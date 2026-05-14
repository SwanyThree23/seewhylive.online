import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, SmilePlus, X, Shield, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const EMOJI_REACTIONS = ['👍', '❤️', '🔥', '😂', '🤔', '✨', '🎉', '💯'];

export default function ChatOverlay({ roomId, isVisible = true }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [recentReactions, setRecentReactions] = useState({});
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: roomMessages } = useQuery({
    queryKey: ['roomMessages', roomId],
    queryFn: () => base44.entities.Message?.filter({ room_id: roomId }, '-created_date', 50) || [],
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (roomMessages) {
      setMessages(roomMessages);
    }
  }, [roomMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    try {
      await base44.entities.Message.create({
        room_id: roomId,
        user_id: user.id,
        user_name: user.full_name,
        content: inputValue,
        is_moderator: user.role === 'admin' || user.role === 'moderator',
      });
      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleEmoji = (emoji) => {
    if (!user) return;
    
    const reactionKey = `${user.id}-${Date.now()}`;
    setRecentReactions(prev => ({
      ...prev,
      [reactionKey]: emoji,
    }));

    setTimeout(() => {
      setRecentReactions(prev => {
        const newReactions = { ...prev };
        delete newReactions[reactionKey];
        return newReactions;
      });
    }, 3000);

    setShowEmojis(false);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-20 right-4 w-80 h-96 rounded-2xl flex flex-col overflow-hidden z-40"
      style={{ background: 'rgba(7,7,15,0.95)', border: '1px solid rgba(212,175,55,0.2)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Live Chat</h3>
        <button
          onClick={() => setShowEmojis(false)}
          className="text-white/40 hover:text-white/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 p-3">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={`${msg.id}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm"
            >
              <div className="flex gap-2">
                {/* Moderator Badge */}
                <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: msg.is_moderator ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.1)' }}>
                  {msg.is_moderator ? (
                    <Shield className="w-3 h-3 text-purple-400" />
                  ) : (
                    <User className="w-3 h-3 text-white/40" />
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-white truncate">{msg.user_name}</span>
                    {msg.is_moderator && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.3)', color: '#8B5CF6' }}>
                        MOD
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/70 break-words">{msg.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Emoji Reactions */}
      <div className="absolute inset-0 pointer-events-none">
        {Object.entries(recentReactions).map(([key, emoji]) => (
          <motion.div
            key={key}
            initial={{ y: 0, opacity: 1, x: 0 }}
            animate={{ y: -100, opacity: 0, x: Math.random() * 40 - 20 }}
            transition={{ duration: 2 }}
            className="absolute bottom-20 right-4 text-xl pointer-events-none"
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      {/* Emoji Reactions Bar */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 p-2 flex flex-wrap gap-1.5 bg-black/30"
          >
            {EMOJI_REACTIONS.map(emoji => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleEmoji(emoji)}
                className="text-lg p-1 rounded-lg transition-all hover:bg-white/10"
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="border-t border-white/10 p-3 space-y-2">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 text-xs text-white placeholder:text-white/30 rounded-lg px-3 py-2 border border-white/10 focus:border-[#d4af37] focus:outline-none transition-colors"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEmojis(!showEmojis)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}
          >
            <SmilePlus className="w-4 h-4 text-[#d4af37]" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)' }}
          >
            <Send className="w-4 h-4 text-[#d4af37]" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}