import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const EMOJIS = ['🔥','❤️','😂','👏','🎉','😮','💪','🤩','🙌','😍','🤯','💯','👀','💀','🫶','⚡'];
const COOLDOWN_MS = 600;
const COUNT_TTL_MS = 5000;

export default function EmojiReactionBar({ roomId, userId, userName }) {
  const [floaters, setFloaters] = useState([]);
  const [recentCounts, setRecentCounts] = useState({});
  const [cooldown, setCooldown] = useState({});
  const idRef = useRef(0);
  const countTimers = useRef({});

  const send = useCallback(async (emoji) => {
    if (cooldown[emoji]) return;

    // Set cooldown
    setCooldown(prev => ({ ...prev, [emoji]: true }));
    setTimeout(() => setCooldown(prev => ({ ...prev, [emoji]: false })), COOLDOWN_MS);

    // Floater animation
    const id = ++idRef.current;
    setFloaters(prev => [...prev, { id, emoji, x: Math.random() * 60 - 30 }]);
    setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 1100);

    // Bump recent count, clear after TTL
    setRecentCounts(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
    if (countTimers.current[emoji]) clearTimeout(countTimers.current[emoji]);
    countTimers.current[emoji] = setTimeout(() => {
      setRecentCounts(prev => { const next = { ...prev }; delete next[emoji]; return next; });
    }, COUNT_TTL_MS);

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
  }, [cooldown, roomId, userId, userName]);

  const rows = [EMOJIS.slice(0, 8), EMOJIS.slice(8)];

  return (
    <div className="relative px-2 py-1.5 border-t border-white/5" style={{ background: 'rgba(8,11,24,0.6)' }}>
      {/* Two-row grid on narrow screens, single row on wider */}
      <div className="hidden" style={{ display: 'none' }} />
      <div className="flex flex-col gap-1 sm:hidden">
        {rows.map((row, ri) => (
          <div key={ri} className="flex items-center gap-1">
            {row.map(emoji => (
              <EmojiButton
                key={emoji}
                emoji={emoji}
                count={recentCounts[emoji] || 0}
                disabled={!!cooldown[emoji]}
                onSend={send}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="hidden sm:flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {EMOJIS.map(emoji => (
          <EmojiButton
            key={emoji}
            emoji={emoji}
            count={recentCounts[emoji] || 0}
            disabled={!!cooldown[emoji]}
            onSend={send}
          />
        ))}
      </div>

      {/* Floating animations */}
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

function EmojiButton({ emoji, count, disabled, onSend }) {
  return (
    <div className="relative shrink-0">
      {count > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute -top-2 -right-1 z-10 pointer-events-none"
          style={{
            background: '#D4AF37',
            color: '#000',
            fontSize: 8,
            fontWeight: 900,
            borderRadius: 999,
            padding: '1px 4px',
            lineHeight: 1.4,
            fontFamily: 'Barlow Condensed, sans-serif',
          }}
        >
          +{count}
        </motion.div>
      )}
      <motion.button
        whileTap={{ scale: 0.75 }}
        onClick={() => onSend(emoji)}
        disabled={disabled}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all"
        style={{
          background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'; }}
      >
        {emoji}
      </motion.button>
    </div>
  );
}
