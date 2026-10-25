import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

function FloatingEmoji({ emoji, id, comboLevel, onDone }) {
  const x = Math.random() * 60 - 30;
  const baseSize = Math.min(48, 24 + comboLevel * 5);
  const color = comboLevel >= 10 ? '#C0392B' : comboLevel >= 6 ? '#D4854A' : comboLevel >= 3 ? '#D4AF37' : undefined;
  return (
    <motion.div
      key={id}
      className="absolute bottom-0 right-0 pointer-events-none z-50 select-none"
      style={{ fontSize: baseSize, filter: comboLevel >= 10 ? 'drop-shadow(0 0 8px #C0392B)' : undefined, color }}
      initial={{ opacity: 1, y: 0, x, scale: 0.8 }}
      animate={{ opacity: 0, y: -180, x: x + (Math.random() * 40 - 20), scale: 1.4 }}
      transition={{ duration: 2.2, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      {emoji}
    </motion.div>
  );
}

export default function RoomReactionOverlay({ roomId, currentUser, triggerReact }) {
  const [floating, setFloating] = useState([]);
  const [combo, setCombo] = useState(0);
  const [streak, setStreak] = useState(0);
  const prevTrigger = useRef(triggerReact);
  const comboTimerRef = useRef(null);
  const streakCountRef = useRef(0);
  const streakWindowRef = useRef(null);

  const bumpCombo = () => {
    setCombo(prev => prev + 1);
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => setCombo(0), 2500);
  };

  const bumpStreak = () => {
    streakCountRef.current += 1;
    setStreak(streakCountRef.current);
    if (!streakWindowRef.current) {
      streakWindowRef.current = setTimeout(() => {
        streakCountRef.current = 0;
        setStreak(0);
        streakWindowRef.current = null;
      }, 10000);
    }
  };

  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.Reaction.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      if (event.type === 'create' && event.data?.user_id !== currentUser?.id) {
        const id = `incoming-${Date.now()}-${Math.random()}`;
        setFloating(prev => [...prev.slice(-12), { id, emoji: event.data.emoji || '❤️' }]);
        bumpCombo();
        bumpStreak();
      }
    });
    return unsub;
  }, [roomId, currentUser?.id]);

  const sendMutation = useMutation({
    mutationFn: (emoji) => base44.entities.Reaction.create({
      room_id: roomId,
      user_id: currentUser?.id,
      emoji,
      target_type: 'room',
      target_id: roomId,
    }),
  });

  useEffect(() => {
    if (triggerReact !== prevTrigger.current && triggerReact?.emoji) {
      prevTrigger.current = triggerReact;
      const id = `ext-${Date.now()}`;
      setFloating(prev => [...prev.slice(-12), { id, emoji: triggerReact.emoji }]);
      bumpCombo();
      sendMutation.mutate(triggerReact.emoji);
    }
  }, [triggerReact]);

  const removeFloat = (id) => setFloating(prev => prev.filter(f => f.id !== id));

  return (
    <div className="absolute bottom-16 right-4 w-20 h-48 pointer-events-none overflow-visible z-40">
      <AnimatePresence>
        {floating.map(f => (
          <FloatingEmoji key={f.id} emoji={f.emoji} id={f.id} comboLevel={combo} onDone={() => removeFloat(f.id)} />
        ))}
      </AnimatePresence>

      {/* Combo badge */}
      <AnimatePresence>
        {combo >= 3 && (
          <motion.div
            key={combo}
            initial={{ scale: 0.5, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="absolute top-0 right-0 px-2 py-1 rounded-lg text-center"
            style={{
              background: combo >= 10 ? 'rgba(192,57,43,0.9)' : combo >= 6 ? 'rgba(212,132,74,0.9)' : 'rgba(212,175,55,0.9)',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: 11,
              fontWeight: 900,
              color: '#fff',
              whiteSpace: 'nowrap',
              boxShadow: combo >= 10 ? '0 0 12px rgba(192,57,43,0.6)' : undefined,
            }}
          >
            🔥 x{combo} COMBO
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak label */}
      <AnimatePresence>
        {streak > 8 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 right-0 text-center"
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: 9,
              fontWeight: 700,
              color: 'rgba(212,175,55,0.8)',
              whiteSpace: 'nowrap',
            }}
          >
            Viewers reacting!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
