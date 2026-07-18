import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, AlertCircle, Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const OFFENSIVE_WORDS = [
  'spam', 'scam', 'hack', 'inappropriate', 'offensive',
  'violence', 'hate', 'abuse', 'exploit', 'cheating'
];

const SPAM_PATTERNS = [
  /(.)\1{5,}/g,                          // 5+ repeated characters (aaaaaaa)
  /(?:visit|click|buy|now|free\s+\$)[^\s]*/gi, // spam keywords with context
];

function userHue(id = '') {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return h % 360;
}

const EMOTES = {
  ':)': '😊',
  ':(': '😢',
  ':D': '😄',
  ':O': '😲',
  'PogU': '🎉',
  'Kappa': '😏',
  'GG': '👏',
  'LUL': '😂',
  'FIRE': '🔥',
  'EZ': '💪'
};

// Stable per-user color derived from userId — same user always same hue
function userColor(uid = '') {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) & 0xffff;
  return `hsl(${h % 360}, 70%, 60%)`;
}

const BADGE_TYPES = {
  admin: { color: '#D4854A', label: 'Admin', icon: '👑' },
  moderator: { color: '#6B5CF6', label: 'Mod', icon: '🛡️' },
  subscriber: { color: '#d4af37', label: 'Sub', icon: '⭐' },
  verified: { color: '#C9A84C', label: 'VIP', icon: '✓' }
};

const filterMessage = (text) => {
  let filtered = text;

  // Check for offensive words
  OFFENSIVE_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '***');
  });

  // Check spam patterns
  SPAM_PATTERNS.forEach(pattern => {
    filtered = filtered.replace(pattern, '');
  });

  return filtered.trim();
};

const processEmotes = (text) => {
  let result = text;
  Object.entries(EMOTES).forEach(([emote, emoji]) => {
    result = result.replace(new RegExp(`\\${emote}`, 'g'), emoji);
  });
  return result;
};

const ChatMessage = ({ message, isOwn }) => {
  const badges = message.user_badges || [];
  const processedText = processEmotes(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex gap-2 px-3 py-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isOwn && (
        <div className="w-6 h-6 rounded-full flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${message.user_color || '#D4AF37'}, ${message.user_color || '#6B4423'})`
          }} />
      )}
      <div className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-white/70">{message.user_name}</span>
          {badges.map(badge => {
            const badgeInfo = BADGE_TYPES[badge];
            return badgeInfo ? (
              <div
                key={badge}
                className="px-1.5 py-0.5 rounded text-[11px] font-bold text-white"
                style={{ background: badgeInfo.color + '40', border: `1px solid ${badgeInfo.color}` }}
                title={badgeInfo.label}
              >
                {badgeInfo.icon}
              </div>
            ) : null;
          })}
        </div>
        <div
          className="rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed max-w-xs break-words"
          style={{
            background: isOwn ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
            border: isOwn ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.9)'
          }}
        >
          {processedText}
        </div>
      </div>
    </motion.div>
  );
};

const ModerationAlert = ({ message, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="mx-3 mb-2 p-2 rounded-lg flex items-center gap-2 text-[10px]"
    style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)' }}
  >
    <AlertCircle className="w-3 h-3 text-[#C0392B] flex-shrink-0" />
    <span className="text-red-300 flex-1">{message}</span>
    <button
      onClick={onDismiss}
      className="text-[#C0392B]/50 hover:text-[#C0392B] transition"
    >
      ✕
    </button>
  </motion.div>
);

export default function EnhancedStreamChat({ roomId, userId, userName, userRole }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modAlerts, setModAlerts] = useState([]);
  const messagesEndRef = useRef(null);
  const scrollBoxRef = useRef(null);
  const [scrolledUp, setScrolledUp] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing messages
  useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      const msgs = await base44.entities.Message.filter(
        { room_id: roomId },
        '-created_date',
        50
      );
      setMessages(msgs.reverse());
      return msgs;
    },
    refetchInterval: 2000,
    enabled: !!roomId,
  });

  // Subscribe to real-time messages
  useEffect(() => {
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data.room_id === roomId && event.type === 'create') {
        setMessages(prev => [...prev, event.data].slice(-50));
      }
    });
    return unsubscribe;
  }, [roomId]);

  // Auto-scroll to latest — but not if user has scrolled up to read history
  useEffect(() => {
    if (!scrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, scrolledUp]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const filtered = filterMessage(content);

      // Check if moderation filtered the message significantly
      if (filtered.length < content.length * 0.5) {
        setModAlerts(prev => [...prev, 'Message filtered for spam/offensive content']);
        setTimeout(() => {
          setModAlerts(prev => prev.slice(1));
        }, 3000);
        return null;
      }

      return base44.entities.Message.create({
        room_id: roomId,
        user_id: userId,
        user_name: userName,
        content: filtered,
        user_color: userColor(userId),
        user_badges: userRole === 'admin' ? ['admin'] : userRole === 'moderator' ? ['moderator'] : []
      });
    },
    onError: () => toast.error('Message failed to send.'),
    onSuccess: (data) => {
      if (data) {
        setInput('');
      }
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;
    setLoading(true);
    sendMessageMutation.mutate(input, {
      onSettled: () => setLoading(false)
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'rgba(8,11,24,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4854A]" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-white/70" style={{ fontFamily: 'Barlow Condensed' }}>
            Live Chat
          </h3>
          <span className="text-[11px] text-white/40">({messages.length})</span>
        </div>
        <Shield className="w-3 h-3 text-[#6DBF7E]" title="Automated moderation active" />
      </div>

      {/* Moderation Alerts */}
      <AnimatePresence>
        {modAlerts.map((alert, i) => (
          <ModerationAlert
            key={i}
            message={alert}
            onDismiss={() => setModAlerts(prev => prev.filter((_, idx) => idx !== i))}
          />
        ))}
      </AnimatePresence>

      {/* Messages */}
      <div
        ref={scrollBoxRef}
        className="flex-1 overflow-y-auto space-y-1 px-2 py-2 min-h-0 relative"
        onScroll={() => {
          const el = scrollBoxRef.current;
          if (!el) return;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
          setScrolledUp(!atBottom);
        }}
      >
        <AnimatePresence>
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              message={msg}
              isOwn={msg.user_id === userId}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* "Scroll to bottom" pill — shown when user has scrolled up */}
      {scrolledUp && (
        <button
          onClick={() => {
            setScrolledUp(false);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="mx-auto mb-1 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all"
          style={{ background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.35)', color: '#d4af37' }}
        >
          ↓ Latest
        </button>
      )}

      {/* Input */}
      <div className="px-2 py-2 border-t border-white/10 space-y-1.5">
        <div className="text-[11px] text-white/40 px-1">
          Emotes: {Object.keys(EMOTES).slice(0, 5).join(' ')}...
        </div>
        <div className="flex items-end gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something... :)"
            maxLength={200}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] outline-none placeholder:text-white/25"
            style={{ color: 'rgba(255,255,255,0.9)' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-30"
            style={{
              background: input.trim() ? '#d4af37' : 'rgba(212,175,55,0.15)',
              border: '1px solid rgba(212,175,55,0.3)'
            }}
          >
            <Send className="w-3.5 h-3.5" style={{ color: input.trim() ? '#000' : '#d4af37' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
