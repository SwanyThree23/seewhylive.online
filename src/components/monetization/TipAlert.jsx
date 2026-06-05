import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

// ── Palette (zero forbidden colors) ───────────────────────────────────────────
const C = {
  bg:      'rgba(14,12,9,0.96)',
  gold:    '#D4AF37',
  amber:   '#D4854A',
  crimson: '#800020',
  bronze:  '#CD7F32',
  text:    '#F0E8D4',
  textM:   'rgba(240,232,212,0.6)',
  textD:   'rgba(240,232,212,0.28)',
};
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

// ── Tier definitions matching TipWidget ────────────────────────────────────────
const TIERS = [
  { min: 100, label: 'Legend',  icon: '👑', color: '#C9A84C', glow: 'rgba(201,168,76,0.55)'  },
  { min: 50,  label: 'Crimson', icon: '💢', color: '#C0392B', glow: 'rgba(192,57,43,0.45)'   },
  { min: 15,  label: 'Gold',    icon: '⭐', color: '#D4AF37', glow: 'rgba(212,175,55,0.45)'  },
  { min: 5,   label: 'Blaze',   icon: '🔥', color: '#D4854A', glow: 'rgba(212,133,74,0.40)'  },
  { min: 0,   label: 'Spark',   icon: '✨', color: '#CD7F32', glow: 'rgba(205,127,50,0.35)'  },
];

function getTier(amount) {
  return TIERS.find(t => (amount || 0) >= t.min) || TIERS[TIERS.length - 1];
}

// ── Single alert card ─────────────────────────────────────────────────────────
function AlertCard({ alert, onDismiss }) {
  const { amount, name, message, emoji, tier } = alert;

  return (
    <motion.div
      initial={{ opacity: 0, x: 90, scale: 0.82 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 90, scale: 0.82, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', damping: 22, stiffness: 290 }}
      onClick={onDismiss}
      style={{
        borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
        background: C.bg,
        border: `1px solid ${tier.color}42`,
        boxShadow: `0 6px 28px ${tier.glow}, 0 2px 8px rgba(0,0,0,0.6)`,
        minWidth: 280, maxWidth: 340,
      }}
    >
      {/* Tier stripe */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${C.crimson}, ${tier.color})` }} />

      <div style={{ padding: '11px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${tier.color}1E`,
            border: `1px solid ${tier.color}42`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
            boxShadow: `0 0 14px ${tier.glow}`,
          }}>
            {emoji || tier.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Amount row */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
              <span style={{ ...T, fontSize: 24, fontWeight: 900, color: tier.color, lineHeight: 1 }}>
                ${typeof amount === 'number' ? amount.toFixed(0) : amount}
              </span>
              <span style={{ ...T, fontSize: 12, color: C.textM, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                from {name}
              </span>
            </div>
            {/* Tier badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <span style={{
                ...T, fontSize: 9, fontWeight: 900, color: tier.color,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                background: `${tier.color}1A`, padding: '2px 7px', borderRadius: 5,
              }}>
                {tier.icon} {tier.label} Tip
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <p style={{ ...T, fontSize: 12, color: C.text, marginTop: 9, paddingTop: 9, borderTop: `1px solid rgba(255,255,255,0.06)`, fontStyle: 'italic', lineHeight: 1.45, wordBreak: 'break-word' }}>
            "{message}"
          </p>
        )}
      </div>

      {/* Countdown bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 6, ease: 'linear' }}
        style={{ height: 2, background: `${tier.color}60` }}
      />
    </motion.div>
  );
}

// ── Main TipAlert (real-time subscription) ────────────────────────────────────
export default function TipAlert({ roomId, recipientId }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!roomId || !recipientId) return;

    const unsubscribe = base44.entities.Transaction.subscribe(event => {
      if (
        event.type === 'create' &&
        event.data.type === 'tip' &&
        event.data.room_id === roomId &&
        (event.data.to_user_id === recipientId || event.data.recipient_id === recipientId)
      ) {
        const { id, amount, sender_name, message, emoji } = event.data;
        const tier = getTier(amount);

        const alert = {
          id: id || Date.now().toString(),
          amount,
          name:    sender_name || 'A Viewer',
          message: message || '',
          emoji:   emoji || null,
          tier,
        };

        setAlerts(prev => [alert, ...prev].slice(0, 5));
        setTimeout(() => {
          setAlerts(prev => prev.filter(a => a.id !== alert.id));
        }, 6500);
      }
    });

    return () => unsubscribe();
  }, [roomId, recipientId]);

  function dismiss(id) {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div style={{ position: 'fixed', top: 80, right: 16, zIndex: 120, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none', maxWidth: 340 }}>
      <AnimatePresence mode="sync">
        {alerts.map(alert => (
          <div key={alert.id} style={{ pointerEvents: 'auto' }}>
            <AlertCard alert={alert} onDismiss={() => dismiss(alert.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
