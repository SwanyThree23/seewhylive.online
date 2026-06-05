import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Crown, Star, Heart } from 'lucide-react';

const G       = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#FF1564';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const TIERS = [
  { min: 500, icon: '⚡', label: 'ELITE',    color: '#ff6b35', glow: 'rgba(255,107,53,0.5)'  },
  { min: 200, icon: '🌠', label: 'LEGEND',   color: '#a78bfa', glow: 'rgba(167,139,250,0.5)' },
  { min: 100, icon: '👑', label: 'DIAMOND',  color: PINK,      glow: 'rgba(255,21,100,0.5)'  },
  { min: 50,  icon: '💎', label: 'PLATINUM', color: '#00d4ff', glow: 'rgba(0,212,255,0.45)'  },
  { min: 15,  icon: '💛', label: 'GOLD',     color: G,         glow: 'rgba(212,175,55,0.45)' },
  { min: 5,   icon: '⭐', label: 'SILVER',   color: '#C0C0C0', glow: 'rgba(192,192,192,0.4)' },
  { min: 0,   icon: '🪙', label: 'BRONZE',   color: '#CD7F32', glow: 'rgba(205,127,50,0.35)' },
];

function getTier(amount) {
  return TIERS.find(t => amount >= t.min) || TIERS[TIERS.length - 1];
}

function Particle({ color }) {
  const angle = Math.random() * 360;
  const dist  = 60 + Math.random() * 80;
  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      animate={{ opacity: 0, x: Math.cos(angle * Math.PI / 180) * dist, y: Math.sin(angle * Math.PI / 180) * dist - 30, scale: 0 }}
      transition={{ duration: 1.2, ease: 'easeOut', delay: Math.random() * 0.3 }}
      style={{ position: 'absolute', width: 7, height: 7, borderRadius: '50%', background: color, left: '50%', top: '50%', pointerEvents: 'none' }}
    />
  );
}

function TipAlertCard({ alert }) {
  const tier = getTier(alert.amount);
  const isBig = alert.amount >= 50;

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.85 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      style={{
        minWidth: 260, maxWidth: 320,
        background: `linear-gradient(135deg, rgba(8,11,24,0.97), rgba(22,8,36,0.97))`,
        border: `1.5px solid ${tier.color}50`,
        borderRadius: 14,
        boxShadow: `0 4px 32px ${tier.glow}, 0 0 0 1px ${tier.color}15`,
        overflow: 'hidden', position: 'relative',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${CRIMSON}, ${tier.color}, ${PINK})` }} />

      {/* Confetti particles for big tips */}
      {isBig && [tier.color, G, PINK, CRIMSON].map((c, i) => <Particle key={i} color={c} />)}

      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Tier icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${tier.color}15`,
          border: `1.5px solid ${tier.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
          boxShadow: `0 0 16px ${tier.glow}`,
        }}>
          {tier.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ ...T, color: tier.color, fontSize: 20, fontWeight: 900, lineHeight: 1 }}>
              ${alert.amount}
            </span>
            <span style={{
              ...T, fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 99,
              background: `${tier.color}15`, color: tier.color, border: `1px solid ${tier.color}35`,
            }}>
              {tier.label}
            </span>
          </div>
          <p style={{ ...T, color: '#fff', fontSize: 12, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
            {alert.from || 'A viewer'} sent a tip!
          </p>
          {alert.message && (
            <p style={{ ...T, color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              "{alert.message}"
            </p>
          )}
        </div>

        {/* Amount glow */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
          background: `radial-gradient(ellipse at right, ${tier.glow} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* Loyalty points earned */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 14px 8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Zap style={{ width: 9, height: 9, color: G }} />
          <span style={{ ...T, color: G, fontSize: 10, fontWeight: 700 }}>
            +{alert.amount * 10} loyalty pts earned
          </span>
        </div>
        <span style={{ ...T, color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>Creator gets 90%</span>
      </div>
    </motion.div>
  );
}

export default function TipAlert({ roomId, recipientId }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!roomId || !recipientId) return;

    const unsubscribe = base44.entities.Transaction.subscribe((event) => {
      if (
        event.type === 'create' &&
        event.data.type === 'tip' &&
        event.data.room_id === roomId &&
        (event.data.to_user_id === recipientId || event.data.sender_id !== recipientId)
      ) {
        const newAlert = {
          id: event.data.id || Date.now(),
          amount: event.data.amount || 0,
          from: event.data.sender_name || 'A viewer',
          message: event.data.message,
          timestamp: Date.now(),
        };

        setAlerts(prev => [newAlert, ...prev].slice(0, 5));

        setTimeout(() => {
          setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
        }, 6000);
      }
    });

    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [roomId, recipientId]);

  return (
    <div style={{
      position: 'fixed', top: 80, right: 20, zIndex: 999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      <AnimatePresence>
        {alerts.map(alert => (
          <TipAlertCard key={alert.id} alert={alert} />
        ))}
      </AnimatePresence>
    </div>
  );
}
