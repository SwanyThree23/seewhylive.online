import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const EMOJIS = ['🔥', '❤️', '😂', '👏', '🎉', '😮', '💪', '🤩'];

export default function EmojiReactionBar({ roomId, userId, userName }) {
  const [floaters, setFloaters] = useState([]);
  const idRef = useRef(0);

  const send = async (emoji) => {
    const id = ++idRef.current;
    setFloaters(prev => [...prev, { id, emoji, x: Math.random() * 60 - 30 }]);
    setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 1100);
    if (roomId && userId) {
      try {
        await base44.entities.Message.create({
          room_id: roomId,
          user_id: userId,
          user_name: userName || 'Viewer',
          content: emoji,
          user_color: 'rgba(212,175,55,0.9)',
        });
      } catch {}
    }
  };

  return (
    <div className="relative px-2 py-1.5 border-t border-white/5" style={{ background: 'rgba(8,11,24,0.6)' }}>
      <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {EMOJIS.map(emoji => (
          <motion.button
            key={emoji}
            whileTap={{ scale: 0.8 }}
            onClick={() => send(emoji)}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {floaters.map(f => (
            <motion.div
              key={f.id}
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -60, opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute bottom-1 text-xl"
              style={{ left: `calc(50% + ${f.x}px)` }}
            >
              {f.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}