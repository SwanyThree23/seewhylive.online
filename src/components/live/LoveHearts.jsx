import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const GOLD = '#D4AF37';

export default function LoveHearts({ roomId, currentUser, creatorId }) {
  const [floaters, setFloaters] = useState([]);
  const [popup, setPopup] = useState(null);
  const holdTimer = useRef(null);
  const holdFired = useRef(false);

  const { data: tips = [] } = useQuery({
    queryKey: ['love-tips', roomId],
    queryFn: () => base44.entities.TipAlert.filter({ room_id: roomId, message: 'love_tap' }),
    enabled: !!roomId,
    refetchInterval: 5000,
  });

  const totalLove = tips.reduce((sum, t) => sum + (t.amount_usd || 1), 0);

  const spawnHearts = useCallback((count) => {
    const batch = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      emoji: Math.random() > 0.5 ? '❤️' : '💛',
      x: Math.random() * 80 - 40,
    }));
    setFloaters(prev => [...prev, ...batch]);
    setTimeout(() => {
      setFloaters(prev => prev.filter(f => !batch.find(b => b.id === f.id)));
    }, 1300);
  }, []);

  const sendLove = useCallback(async (amount) => {
    spawnHearts(Math.min(amount === 10 ? 5 : 3, 5));
    const id = Date.now();
    setPopup({ id, text: amount === 10 ? '+10 💛' : '+1 💛' });
    setTimeout(() => setPopup(p => p?.id === id ? null : p), 1000);
    if (!roomId || !currentUser) return;
    await base44.entities.TipAlert.create({
      room_id: roomId,
      sender_id: currentUser?.id,
      sender_name: currentUser?.full_name || currentUser?.email,
      creator_id: creatorId,
      amount_usd: amount,
      message: 'love_tap',
      animation_type: 'hearts',
    }).catch(() => {});
  }, [roomId, currentUser, creatorId, spawnHearts]);

  const handlePointerDown = () => {
    holdFired.current = false;
    holdTimer.current = setTimeout(() => {
      holdFired.current = true;
      sendLove(10);
    }, 2000);
  };

  const handlePointerUp = () => {
    clearTimeout(holdTimer.current);
    if (!holdFired.current) sendLove(1);
  };

  return (
    <div style={{ position: 'fixed', bottom: 100, right: 16, zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <AnimatePresence>
        {floaters.map(f => (
          <motion.div
            key={f.id}
            initial={{ y: 0, opacity: 1, scale: 1, x: 0 }}
            animate={{ y: -180, opacity: 0, scale: 1.4, x: f.x }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ position: 'absolute', bottom: 56, fontSize: 22, pointerEvents: 'none', userSelect: 'none' }}
          >
            {f.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {popup && (
          <motion.div
            key={popup.id}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -24 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{ position: 'absolute', bottom: 60, right: 0, fontSize: 13, fontWeight: 900, color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', pointerEvents: 'none', whiteSpace: 'nowrap' }}
          >
            {popup.text}
          </motion.div>
        )}
      </AnimatePresence>

      {totalLove > 0 && (
        <div style={{ fontSize: 12, fontWeight: 900, color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1 }}>
          {totalLove >= 1000 ? (totalLove / 1000).toFixed(1) + 'k' : totalLove}
        </div>
      )}

      <motion.button
        whileTap={{ scale: 1.25 }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => clearTimeout(holdTimer.current)}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${GOLD}, #B8960C)`,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          boxShadow: '0 4px 16px rgba(212,175,55,0.4)',
          userSelect: 'none',
        }}
      >
        ❤️
      </motion.button>
    </div>
  );
}
