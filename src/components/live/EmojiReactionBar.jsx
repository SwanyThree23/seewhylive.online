import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const EMOJIS = ['🔥','❤️','😂','👏','🎉','😮','💪','🤩','🙌','😍','🤯','💯','👀','💀','🫶','⚡'];
const COOLDOWN_MS = 600;
const COUNT_TTL_MS = 5000;
const STREAK_THRESHOLD = 3;  // taps within window to trigger burst

export default function EmojiReactionBar({ roomId, userId, userName }) {
  const [floaters, setFloaters] = useState([]);
  const [recentCounts, setRecentCounts] = useState({});
  const [cooldown, setCooldown] = useState({});
  const [streakEmoji, setStreakEmoji] = useState(null);   // shows STREAK! badge
  const [hotEmoji, setHotEmoji] = useState(null);          // most-tapped this session
  const idRef = useRef(0);
  const countTimers = useRef({});
  const streakTimers = useRef({});
  const streakCounts = useRef({});             // consecutive tap counter per emoji
  const sessionTotals = useRef({});            // all-time session counts

  const spawnFloaters = useCallback((emoji, count = 1) => {
    const ids = Array.from({ length: count }, () => ++idRef.current);
    setFloaters(prev => [
      ...prev,
      ...ids.map(id => ({ id, emoji, x: Math.random() * 80 - 40, scale: count > 1 ? 1.2 + Math.random() * 0.5 : 1 })),
    ]);
    ids.forEach(id => setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 1200));
  }, []);

  const send = useCallback(async (emoji) => {
    if (cooldown[emoji]) return;

    // Set cooldown
    setCooldown(prev => ({ ...prev, [emoji]: true }));
    setTimeout(() => setCooldown(prev => ({ ...prev, [emoji]: false })), COOLDOWN_MS);

    // Track streak — reset timer on each tap
    streakCounts.current[emoji] = (streakCounts.current[emoji] || 0) + 1;
    if (streakTimers.current[emoji]) clearTimeout(streakTimers.current[emoji]);
    streakTimers.current[emoji] = setTimeout(() => { streakCounts.current[emoji] = 0; }, 1800);

    const streak = streakCounts.current[emoji];
    const isBurst = streak >= STREAK_THRESHOLD && streak % STREAK_THRESHOLD === 0;

    // Floater animation — burst on streak milestone
    spawnFloaters(emoji, isBurst ? 6 : 1);
    if (isBurst) {
      setStreakEmoji(emoji);
      setTimeout(() => setStreakEmoji(null), 1200);
    }

    // Session totals → update hot emoji
    sessionTotals.current[emoji] = (sessionTotals.current[emoji] || 0) + 1;
    const top = Object.entries(sessionTotals.current).sort((a, b) => b[1] - a[1])[0];
    setHotEmoji(top?.[0] || null);

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
  const totalSent = Object.values(sessionTotals.current).reduce((s, v) => s + v, 0);

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
                isHot={emoji === hotEmoji}
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
            isHot={emoji === hotEmoji}
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
              style={{ left: `calc(50% + ${f.x}px)`, fontSize: `${((f.scale || 1) * 1.25).toFixed(2)}rem` }}
            >
              {f.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Session total */}
      {totalSent > 0 && (
        <div className="absolute top-1 right-2 pointer-events-none">
          <span className="text-[9px] font-mono" style={{ color: 'rgba(212,175,55,0.4)' }}>
            {totalSent} sent{hotEmoji ? ` · ${hotEmoji} hot` : ''}
          </span>
        </div>
      )}

      {/* Streak badge */}
      <AnimatePresence>
        {streakEmoji && (
          <motion.div
            key="streak"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="flex items-center gap-1 px-3 py-1 rounded-full"
              style={{ background: 'rgba(212,175,55,0.25)', border: '1px solid rgba(212,175,55,0.6)', backdropFilter: 'blur(4px)' }}>
              <span className="text-lg">{streakEmoji}</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>STREAK!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmojiButton({ emoji, count, disabled, onSend, isHot }) {
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
          background: isHot ? 'rgba(212,175,55,0.08)' : disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isHot ? 'rgba(212,175,55,0.5)' : disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isHot ? '0 0 8px rgba(212,175,55,0.3)' : undefined,
        }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = disabled ? 'rgba(255,255,255,0.04)' : isHot ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)'; }}
      >
        {emoji}
      </motion.button>
    </div>
  );
}
