import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const GOLD    = '#D4AF37';
const PINK    = '#C0392B';
const GREEN   = '#6DBF7E';

const PARTICLE_COLORS = [PINK, GOLD, '#FF6B9D', '#FFD700', '#E8003D'];

function formatAmount(cents) {
  if (cents >= 100) {
    return '$' + (cents / 100).toFixed(2);
  }
  return '¢' + cents;
}

export default function LoveTap({ roomId, user, creatorId, creatorName }) {
  const [particles, setParticles]     = useState([]);
  const [popup, setPopup]             = useState(null);
  const [localTotal, setLocalTotal]   = useState(0);
  const [rapidMode, setRapidMode]     = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const holdTimer    = useRef(null);
  const rapidTimer   = useRef(null);
  const popupIdRef   = useRef(0);

  const { data: tips = [] } = useQuery({
    queryKey: ['love-tap-tips', roomId],
    queryFn: () => base44.entities.Tip.filter({ room_id: roomId, currency: 'usd_micro' }),
    enabled: !!roomId,
    refetchInterval: 5000,
  });

  const remoteTotal = tips.reduce((sum, t) => sum + (t.amount || 0.01), 0);
  const totalCents  = Math.round((remoteTotal + localTotal) * 100);

  const spawnParticles = useCallback(() => {
    const batch = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i + Math.random(),
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      size: 8 + Math.random() * 6,
      dx: Math.random() * 100 - 50,
      dy: -120 + (Math.random() * 80 - 40),
      delay: Math.random() * 0.2,
    }));
    setParticles(prev => [...prev, ...batch]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !batch.find(b => b.id === p.id)));
    }, 1200);
  }, []);

  const showPopup = useCallback(() => {
    popupIdRef.current += 1;
    const id = popupIdRef.current;
    setPopup(id);
    setTimeout(() => setPopup(cur => cur === id ? null : cur), 900);
  }, []);

  const fireTap = useCallback(() => {
    navigator.vibrate?.(30);
    spawnParticles();
    showPopup();
    setLocalTotal(prev => prev + 0.01);
    if (roomId && user?.id) {
      base44.entities.Tip.create({
        room_id:    roomId,
        user_id:    user.id,
        creator_id: creatorId,
        amount:     0.01,
        currency:   'usd_micro',
        type:       'love_tap',
      }).catch(() => {});
    }
  }, [roomId, user, creatorId, spawnParticles, showPopup]);

  const stopRapid = useCallback(() => {
    clearInterval(rapidTimer.current);
    clearTimeout(holdTimer.current);
    setRapidMode(false);
  }, []);

  const handlePointerDown = useCallback(() => {
    if (!user?.id) return;
    holdTimer.current = setTimeout(() => {
      setRapidMode(true);
      fireTap();
      rapidTimer.current = setInterval(fireTap, 200);
    }, 1000);
  }, [user, fireTap]);

  const handlePointerUp = useCallback(() => {
    if (!user?.id) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }
    if (!rapidMode) {
      clearTimeout(holdTimer.current);
      fireTap();
    }
    stopRapid();
  }, [user, rapidMode, fireTap, stopRapid]);

  const handlePointerLeave = useCallback(() => {
    stopRapid();
  }, [stopRapid]);

  useEffect(() => () => { clearTimeout(holdTimer.current); clearInterval(rapidTimer.current); }, []);

  const disabled = !user?.id;

  return (
    <div style={{ position: 'fixed', bottom: 100, left: 16, zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>

      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
            animate={{ y: p.dy, x: p.dx, opacity: 0, scale: 0.5 }}
            transition={{ duration: 1.0, ease: 'easeOut', delay: p.delay }}
            style={{
              position: 'absolute',
              bottom: 28,
              left: '50%',
              pointerEvents: 'none',
              userSelect: 'none',
              fontSize: p.size,
              color: p.color,
              lineHeight: 1,
            }}
          >
            ♥
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {popup !== null && (
          <motion.div
            key={popup}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -28 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              bottom: 68,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 13,
              fontWeight: 900,
              color: GREEN,
              fontFamily: 'Barlow Condensed, sans-serif',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            +$0.01
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rapidMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              bottom: 68,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 10,
              fontWeight: 900,
              color: PINK,
              fontFamily: 'Barlow Condensed, sans-serif',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            RAPID ♥
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              bottom: 68,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.85)',
              color: '#fff',
              fontSize: 11,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: 6,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Sign in to tip
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: disabled ? 1 : 1.2 }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${PINK}, ${GOLD})`,
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 18px rgba(255,21,100,0.35)`,
          userSelect: 'none',
          opacity: disabled ? 0.4 : 1,
          touchAction: 'none',
        }}
      >
        <Heart style={{ width: 28, height: 28, color: '#fff', fill: '#fff' }} />
      </motion.button>

      <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
          {formatAmount(totalCents)}
        </div>
        {creatorName && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
            90% → {creatorName}
          </div>
        )}
      </div>
    </div>
  );
}
