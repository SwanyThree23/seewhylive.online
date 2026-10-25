import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, SmilePlus, X, Shield, User, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const EMOJI_REACTIONS = ['👍', '❤️', '🔥', '😂', '🤔', '✨', '🎉', '💯'];
const MAX_CHARS = 200;

function highlightMentions(text) {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="font-bold" style={{ color: '#D4AF37' }}>{part}</span>
      : part
  );
}

function MessageTypeBadge({ msg }) {
  if (msg.type === 'system') {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
        style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
        SYS
      </span>
    );
  }
  if (msg.is_super_chat || msg.transaction_type === 'super_chat') {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5"
        style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
        <Star className="w-2.5 h-2.5" /> SUPER
      </span>
    );
  }
  if (msg.is_moderator) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
        style={{ background: 'rgba(212,175,55,0.3)', color: '#D4AF37' }}>
        MOD
      </span>
    );
  }
  return null;
}

function ChatMessage({ msg, i }) {
  const isSuperChat  = msg.is_super_chat || msg.transaction_type === 'super_chat';
  const isSystem     = msg.type === 'system';
  const hasMention   = msg.content?.includes('@');

  return (
    <motion.div
      key={`${msg.id}-${i}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="text-sm rounded-lg px-2 py-1.5"
      style={{
        background: isSuperChat
          ? 'linear-gradient(90deg, rgba(212,175,55,0.12), rgba(212,175,55,0.06))'
          : isSystem
          ? 'rgba(255,255,255,0.03)'
          : 'transparent',
        border: isSuperChat ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
      }}
    >
      <div className="flex gap-2 items-start">
        {/* Avatar / icon */}
        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
          style={{ background: isSuperChat ? 'rgba(212,175,55,0.2)' : msg.is_moderator ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.08)' }}>
          {isSuperChat
            ? <Star className="w-3 h-3" style={{ color: '#D4AF37' }} />
            : msg.is_moderator
            ? <Shield className="w-3 h-3" style={{ color: '#D4AF37' }} />
            : <User className="w-3 h-3 text-white/40" />
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-semibold truncate"
              style={{ color: isSuperChat ? '#D4AF37' : 'white' }}>
              {msg.user_name}
            </span>
            <MessageTypeBadge msg={msg} />
            {isSuperChat && msg.amount > 0 && (
              <span className="text-[10px] font-black font-mono" style={{ color: '#6DBF7E' }}>
                ${msg.amount?.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-xs break-words" style={{ color: isSuperChat ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)' }}>
            {hasMention ? highlightMentions(msg.content) : msg.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatOverlay({ roomId, isVisible = true, onClose }) {
  const [messages, setMessages]         = useState([]);
  const [inputValue, setInputValue]     = useState('');
  const [showEmojis, setShowEmojis]     = useState(false);
  const [recentReactions, setRecentReactions] = useState({});
  const [charWarning, setCharWarning]   = useState(false);
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: roomMessages } = useQuery({
    queryKey: ['roomMessages', roomId],
    queryFn: () => base44.entities.Message.filter({ room_id: roomId }, '-created_date', 50),
    refetchInterval: 3000,
    enabled: !!roomId,
  });

  useEffect(() => {
    if (roomMessages) setMessages(roomMessages);
  }, [roomMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;
    const trimmed = inputValue.slice(0, MAX_CHARS);
    try {
      await base44.entities.Message.create({
        room_id: roomId,
        user_id: user.id,
        user_name: user.full_name,
        content: trimmed,
        is_moderator: user.role === 'admin' || user.role === 'moderator',
      });
      setInputValue('');
      setCharWarning(false);
    } catch (error) {
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.length > MAX_CHARS) {
      setCharWarning(true);
      return;
    }
    setCharWarning(false);
    setInputValue(val);
  };

  const handleEmoji = (emoji) => {
    if (!user) return;
    const reactionKey = `${user.id}-${Date.now()}`;
    setRecentReactions(prev => ({ ...prev, [reactionKey]: emoji }));
    setTimeout(() => {
      setRecentReactions(prev => {
        const next = { ...prev };
        delete next[reactionKey];
        return next;
      });
    }, 3000);
    setShowEmojis(false);
  };

  const charsLeft = MAX_CHARS - inputValue.length;

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-20 right-4 w-80 h-96 rounded-2xl flex flex-col overflow-hidden z-40"
      style={{ background: 'rgba(8,11,24,0.95)', border: '1px solid rgba(212,175,55,0.2)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">Live Chat</h3>
          {messages.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>
              {messages.length}
            </span>
          )}
        </div>
        <button onClick={onClose || (() => {})} className="text-white/40 hover:text-white/70 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-0.5 p-2">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <ChatMessage key={`${msg.id}-${i}`} msg={msg} i={i} />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Floating reactions */}
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

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 p-2 flex flex-wrap gap-1.5 bg-black/30"
          >
            {EMOJI_REACTIONS.map(emoji => (
              <motion.button key={emoji} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                onClick={() => handleEmoji(emoji)}
                className="text-lg p-1 rounded-lg transition-all hover:bg-white/10">
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-white/10 p-3 space-y-1.5">
        <div className="flex gap-1.5">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              maxLength={MAX_CHARS}
              className="w-full bg-white/5 text-xs text-white placeholder:text-white/30 rounded-lg px-3 py-2 border focus:outline-none transition-colors pr-8"
              style={{ borderColor: charWarning ? 'rgba(192,57,43,0.6)' : 'rgba(255,255,255,0.1)' }}
            />
            {/* Char counter — only show when near limit */}
            {inputValue.length > MAX_CHARS * 0.75 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono"
                style={{ color: charsLeft < 20 ? '#C0392B' : 'rgba(255,255,255,0.3)' }}>
                {charsLeft}
              </span>
            )}
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowEmojis(!showEmojis)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <SmilePlus className="w-4 h-4 text-[#d4af37]" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-40"
            style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)' }}>
            <Send className="w-4 h-4 text-[#d4af37]" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
