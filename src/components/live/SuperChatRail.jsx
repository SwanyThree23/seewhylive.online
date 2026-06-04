import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign } from 'lucide-react';

const TIER_COLORS = {
  1:  { bg: 'rgba(201,168,76,0.12)',  border: 'rgba(201,168,76,0.3)',  text: '#C9A84C'  },
  5:  { bg: 'rgba(212,175,55,0.15)', border: 'rgba(212,175,55,0.4)', text: '#D4AF37'  },
  10: { bg: 'rgba(128,0,32,0.25)',   border: 'rgba(255,21,100,0.5)', text: '#FF1564'  },
  20: { bg: 'rgba(212,175,55,0.25)', border: 'rgba(212,175,55,0.5)', text: '#D4AF37'  },
};

function getTierStyle(amount) {
  if (amount >= 20) return TIER_COLORS[20];
  if (amount >= 10) return TIER_COLORS[10];
  if (amount >= 5)  return TIER_COLORS[5];
  return TIER_COLORS[1];
}

const F = { fontFamily: 'Barlow Condensed, sans-serif' };

export default function SuperChatRail({ superchats = [] }) {
  const railRef = useRef(null);

  useEffect(() => {
    if (railRef.current && superchats.length > 0) {
      railRef.current.scrollLeft = railRef.current.scrollWidth;
    }
  }, [superchats.length]);

  if (superchats.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.5)',
      borderTop: '1px solid rgba(212,175,55,0.12)',
      padding: '6px 0',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 12, marginBottom: 5 }}>
        <DollarSign style={{ width: 10, height: 10, color: '#D4AF37' }} />
        <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#D4AF37', ...F }}>
          Super Chats
        </span>
      </div>

      {/* Scrolling cards */}
      <div
        ref={railRef}
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingLeft: 12,
          paddingRight: 12,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <AnimatePresence initial={false}>
          {superchats.slice(-20).map((sc, i) => {
            const tier = getTierStyle(sc.amount || 0);
            return (
              <motion.div
                key={sc.id || i}
                initial={{ opacity: 0, scale: 0.7, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 99,
                  background: tier.bg,
                  border: `1px solid ${tier.border}`,
                  maxWidth: 200,
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 900,
                  color: '#fff',
                  flexShrink: 0,
                  ...F,
                }}>
                  {(sc.senderName || '?')[0].toUpperCase()}
                </div>
                {/* Name + amount */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80, ...F }}>
                    {sc.senderName || 'Someone'}
                  </div>
                  {(sc.amount || 0) > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 900, color: tier.text, ...F }}>
                      ${sc.amount}
                    </div>
                  )}
                </div>
                {/* Emoji */}
                {sc.emoji && <span style={{ fontSize: 14, flexShrink: 0 }}>{sc.emoji}</span>}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
