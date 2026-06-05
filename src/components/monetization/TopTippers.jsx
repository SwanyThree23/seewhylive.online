/**
 * TopTippers — Real-time session leaderboard of top tippers.
 * Subscribes to Transaction entity, shows top 5 by amount, updates live.
 * Props: { roomId, limit (default 5), compact (bool) }
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Zap } from 'lucide-react';

const G       = '#D4AF37';
const CRIMSON = '#800020';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const RANK_ICONS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
const RANK_COLORS = [G, '#C0C0C0', '#CD7F32', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.4)'];

function useTopTippers(roomId, limit) {
  const qc = useQueryClient();

  const { data: tippers = [] } = useQuery({
    queryKey: ['top-tippers', roomId],
    queryFn: async () => {
      const txns = await base44.entities.Transaction.filter({ room_id: roomId, type: 'tip' });
      const map = {};
      txns.forEach(t => {
        const key = t.sender_name || t.sender_id || 'Anonymous';
        map[key] = (map[key] || 0) + (t.amount || 0);
      });
      return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, total], idx) => ({ name, total, rank: idx + 1 }));
    },
    refetchInterval: 10000,
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.Transaction.subscribe(event => {
      if (event.type === 'create' && event.data.type === 'tip' && event.data.room_id === roomId) {
        qc.invalidateQueries(['top-tippers', roomId]);
      }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [roomId, qc]);

  return tippers;
}

export default function TopTippers({ roomId, limit = 5, compact = false }) {
  const tippers = useTopTippers(roomId, limit);

  if (tippers.length === 0) return null;

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Trophy style={{ width: 11, height: 11, color: G, flexShrink: 0 }} />
        <span style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Top:</span>
        <div style={{ display: 'flex', gap: 4, overflow: 'hidden' }}>
          {tippers.slice(0, 3).map((t, i) => (
            <span key={t.name} style={{
              ...T, fontSize: 10, fontWeight: 900,
              color: RANK_COLORS[i], whiteSpace: 'nowrap',
            }}>
              {RANK_ICONS[i]} {t.name.split(' ')[0]} ${t.total.toFixed(0)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(8,11,24,0.96)', border: `1px solid ${G}18`,
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Trophy style={{ width: 13, height: 13, color: G }} />
        <span style={{ ...T, color: G, fontSize: 12, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Top Tippers
        </span>
        <span style={{ ...T, color: 'rgba(255,255,255,0.2)', fontSize: 10, marginLeft: 'auto' }}>This session</span>
      </div>

      {/* List */}
      <div style={{ padding: '6px 0' }}>
        <AnimatePresence>
          {tippers.map((tipper, idx) => (
            <motion.div
              key={tipper.name}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 14px',
                background: idx === 0 ? `${G}06` : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              {/* Rank */}
              <span style={{ fontSize: 14, flexShrink: 0 }}>{RANK_ICONS[idx]}</span>

              {/* Avatar initial */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: idx === 0
                  ? `linear-gradient(135deg, #4a3000, #8a6000)`
                  : 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${RANK_COLORS[idx]}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900, color: RANK_COLORS[idx], ...T,
              }}>
                {(tipper.name || '?')[0].toUpperCase()}
              </div>

              {/* Name */}
              <span style={{ ...T, flex: 1, fontSize: 12, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tipper.name.split(' ')[0]}
              </span>

              {/* Amount */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <Zap style={{ width: 10, height: 10, color: RANK_COLORS[idx] }} />
                <span style={{ ...T, color: RANK_COLORS[idx], fontSize: 13, fontWeight: 900 }}>
                  ${tipper.total.toFixed(0)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
