/**
 * TipGoalBar — Horizontal creator tip goal progress bar for stream pages.
 * Shows progress toward a creator-set session goal. Celebrates on completion.
 * Props: { roomId, goal (number), label (string), currentTotal (number) }
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Target, Zap } from 'lucide-react';

const G       = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

export default function TipGoalBar({ roomId, goal = 500, label = 'Stream Goal', currentTotal }) {
  const [celebrated, setCelebrated] = useState(false);

  // Load live total from transactions if not passed as prop
  const { data: liveTxns = [] } = useQuery({
    queryKey: ['tip-goal-total', roomId],
    queryFn: () => base44.entities.Transaction.filter({ room_id: roomId, type: 'tip' }),
    refetchInterval: 8000,
    enabled: !!roomId && currentTotal === undefined,
  });

  const total = currentTotal !== undefined
    ? currentTotal
    : liveTxns.reduce((sum, t) => sum + (t.amount || 0), 0);

  const pct = Math.min(100, goal > 0 ? (total / goal) * 100 : 0);
  const reached = pct >= 100;

  useEffect(() => {
    if (reached && !celebrated) setCelebrated(true);
  }, [reached]);

  const segColor = pct >= 100 ? '#22c55e' : pct >= 75 ? G : pct >= 50 ? G : pct >= 25 ? '#C9A84C' : CRIMSON;

  return (
    <div style={{ position: 'relative' }}>
      {/* Celebration overlay */}
      <AnimatePresence>
        {celebrated && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 10, borderRadius: 10,
              background: `linear-gradient(90deg, ${CRIMSON}30, ${G}30)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${G}50`,
            }}
          >
            <span style={{ ...T, fontSize: 12, fontWeight: 900, color: G }}>
              🎉 GOAL REACHED! ${total.toFixed(0)} raised!
            </span>
            <button onClick={() => setCelebrated(false)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: G, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{
        background: 'rgba(8,11,24,0.95)', border: `1px solid ${G}18`,
        borderRadius: 10, padding: '8px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {/* Icon + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <Target style={{ width: 12, height: 12, color: G }} />
          <span style={{ ...T, color: G, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              height: '100%', borderRadius: 99,
              background: reached
                ? `linear-gradient(90deg, #22c55e, ${G})`
                : `linear-gradient(90deg, ${CRIMSON}, ${segColor})`,
              boxShadow: `0 0 8px ${segColor}60`,
            }}
          />
        </div>

        {/* Numbers */}
        <div style={{ display: 'flex', flex: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
          <span style={{ ...T, color: '#fff', fontSize: 12, fontWeight: 900 }}>
            ${total.toFixed(0)}
            <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}> / ${goal}</span>
          </span>
          <span style={{ ...T, color: segColor, fontSize: 10, marginLeft: 6 }}>
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
