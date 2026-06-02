import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GOLD = '#D4AF37';

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function Particle({ color, count }) {
  const particles = Array.from({ length: count }, (_, i) => {
    const angle  = (i / count) * 360 + randomBetween(-15, 15);
    const dist   = randomBetween(80, 220);
    const rad    = (angle * Math.PI) / 180;
    const tx     = Math.cos(rad) * dist;
    const ty     = Math.sin(rad) * dist;
    const size   = randomBetween(5, 14);
    const delay  = randomBetween(0, 0.15);
    return { tx, ty, size, delay, angle };
  });

  return (
    <>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.tx, y: p.ty, opacity: 0, scale: 0.3 }}
          transition={{ duration: randomBetween(0.7, 1.1), ease: 'easeOut', delay: p.delay }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: p.size,
            height: p.size,
            borderRadius: i % 3 === 0 ? '50%' : 3,
            background: i % 4 === 0 ? GOLD : color,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

function StreamParticles({ color, count }) {
  const streams = Array.from({ length: Math.min(count, 80) }, (_, i) => {
    const startX = randomBetween(-40, 40);
    const endX   = randomBetween(-180, 180);
    const endY   = randomBetween(-300, -80);
    const size   = randomBetween(8, 20);
    const delay  = randomBetween(0, 0.6);
    const dur    = randomBetween(0.9, 1.6);
    return { startX, endX, endY, size, delay, dur };
  });
  return (
    <>
      {streams.map((s, i) => (
        <motion.div
          key={i}
          initial={{ x: s.startX, y: 60, opacity: 1, scale: 1, rotate: 0 }}
          animate={{ x: s.endX, y: s.endY, opacity: 0, scale: 0.2, rotate: randomBetween(-180, 180) }}
          transition={{ duration: s.dur, ease: 'easeOut', delay: s.delay }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            fontSize: s.size,
            pointerEvents: 'none',
            userSelect: 'none',
            color: i % 3 === 0 ? GOLD : color,
          }}
        >
          {i % 5 === 0 ? '✦' : i % 4 === 0 ? '◆' : i % 3 === 0 ? '●' : '★'}
        </motion.div>
      ))}
    </>
  );
}

export default function GiftAnimation({ event, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!event) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone?.(), 400);
    }, 2800);
    return () => clearTimeout(t);
  }, [event?.id]);

  if (!event) return null;

  const { gift, senderName } = event;
  const isLegendary = gift.price >= 49.99;
  const isMega      = gift.price >= 99.99;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            background: isMega
              ? `radial-gradient(ellipse at center, ${gift.color}30 0%, transparent 70%)`
              : `radial-gradient(ellipse at center, ${gift.color}18 0%, transparent 65%)`,
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {isMega ? (
              <StreamParticles color={gift.color} count={gift.particles} />
            ) : (
              <Particle color={gift.color} count={gift.particles} />
            )}

            <motion.div
              initial={{ scale: 0.2, opacity: 0, rotate: -20 }}
              animate={[
                { scale: 1.3, opacity: 1, rotate: 8, transition: { duration: 0.3, ease: 'backOut' } },
                { scale: 1.0, opacity: 1, rotate: 0, transition: { duration: 0.25, ease: 'easeOut', delay: 0.3 } },
              ]}
              style={{
                fontSize: isMega ? 100 : isLegendary ? 80 : 64,
                lineHeight: 1,
                position: 'relative',
                zIndex: 2,
                filter: `drop-shadow(0 0 ${isLegendary ? 40 : 20}px ${gift.color}99)`,
              }}
            >
              {gift.emoji}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.3, ease: 'easeOut' }}
            style={{ textAlign: 'center', marginTop: 16 }}
          >
            <div style={{
              fontSize: isMega ? 28 : 22,
              fontWeight: 900,
              fontFamily: 'Barlow Condensed, sans-serif',
              color: gift.color,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textShadow: `0 0 20px ${gift.color}88`,
            }}>
              {gift.name}
            </div>
            <div style={{
              fontSize: 13,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.65)',
              marginTop: 4,
            }}>
              from <span style={{ color: '#fff', fontWeight: 900 }}>{senderName || 'Guest'}</span>
            </div>
            {isLegendary && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 }}
                style={{
                  marginTop: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 12px',
                  borderRadius: 999,
                  background: `${gift.color}22`,
                  border: `1px solid ${gift.color}55`,
                  fontSize: 11,
                  fontWeight: 900,
                  fontFamily: 'Barlow Condensed, sans-serif',
                  color: gift.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                🔥 Legendary Gift!
              </motion.div>
            )}
          </motion.div>

          {isLegendary && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2.5, ease: 'linear', delay: 0.2 }}
              style={{
                position: 'absolute',
                bottom: 60,
                left: '10%',
                right: '10%',
                height: 3,
                borderRadius: 999,
                background: `linear-gradient(90deg, transparent, ${gift.color}, transparent)`,
                transformOrigin: 'left',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
