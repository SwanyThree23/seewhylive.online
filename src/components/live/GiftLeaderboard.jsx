import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Gift, Crown, Trophy } from 'lucide-react';

const G      = '#D4AF37';
const BORDER = 'rgba(212,175,55,0.18)';
const PANEL  = '#0D1022';

const RANK_MEDALS = ['👑', '🥈', '🥉'];

const GIFT_EMOJIS = {
  rose: '🌹', diamond: '💎', fire: '🔥', crown: '👑',
  lightning: '⚡', heart: '❤️', star: '⭐', unicorn: '🦄',
};

const TIME_TABS = [
  { id: 'stream',  label: 'Stream' },
  { id: 'alltime', label: 'All Time' },
];

function GiftRow({ entry, rank }) {
  const isTop = rank === 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{
        background: isTop ? `${G}10` : 'rgba(255,255,255,0.03)',
        border:     isTop ? `1px solid ${G}25` : '1px solid transparent',
      }}
    >
      {/* Rank */}
      <div className="w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black shrink-0"
        style={{ background: isTop ? `${G}25` : `${G}12`, color: G }}>
        {rank < 3 ? RANK_MEDALS[rank] : rank + 1}
      </div>

      {/* Most-sent gift emoji */}
      <div className="w-6 h-6 rounded-md flex items-center justify-center text-base shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)' }}>
        {GIFT_EMOJIS[entry.top_gift] || '🎁'}
      </div>

      {/* Name + gift breakdown */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{entry.sender_name || `User ${entry.sender_id?.slice(0, 6)}`}</p>
        <p className="text-[10px] truncate" style={{ color: isTop ? G : 'rgba(212,175,55,0.5)' }}>
          {entry.gift_count} gift{entry.gift_count !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Total value */}
      <div className="text-right shrink-0">
        <p className="text-xs font-black font-mono" style={{ color: G }}>${entry.total_value.toFixed(2)}</p>
      </div>
    </motion.div>
  );
}

export default function GiftLeaderboard({ roomId }) {
  const [timeTab, setTimeTab] = useState('stream');

  const { data: transactions = [] } = useQuery({
    queryKey: ['gift-leaderboard', roomId, timeTab],
    queryFn: async () => {
      const txns = await base44.entities.Transaction.filter(
        { room_id: roomId, transaction_type: 'gift' },
        '-created_date',
        200
      );
      // Aggregate by sender
      const map = {};
      txns.forEach(t => {
        const id = t.sender_id || t.user_id || 'anon';
        if (!map[id]) {
          map[id] = { sender_id: id, sender_name: t.sender_name || 'Anonymous', total_value: 0, gift_count: 0, gift_types: {} };
        }
        const gross = (t.creator_payout || 0) + (t.platform_cut || 0);
        map[id].total_value += gross;
        map[id].gift_count  += 1;
        if (t.gift_type) map[id].gift_types[t.gift_type] = (map[id].gift_types[t.gift_type] || 0) + 1;
      });
      // Derive top_gift per sender
      return Object.values(map)
        .map(e => ({
          ...e,
          total_value: +e.total_value.toFixed(2),
          top_gift: Object.entries(e.gift_types).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
        }))
        .sort((a, b) => b.total_value - a.total_value)
        .slice(0, 10);
    },
    enabled: !!roomId,
    refetchInterval: 20000,
  });

  const totalGifted = transactions.reduce((s, e) => s + e.total_value, 0);

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: '#080B18', border: `1px solid ${BORDER}` }}>
      {/* Header */}
      <div className="px-3 pt-3 pb-0" style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-4 h-4" style={{ color: G }} />
          <h3 className="text-xs font-bold uppercase flex-1" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Gift Leaderboard
          </h3>
          {totalGifted > 0 && (
            <span className="text-[10px] font-black font-mono" style={{ color: '#6DBF7E' }}>
              ${totalGifted.toFixed(2)} gifted
            </span>
          )}
        </div>

        {/* Time tabs */}
        <div className="flex gap-1 pb-0.5">
          {TIME_TABS.map(tab => (
            <button key={tab.id} onClick={() => setTimeTab(tab.id)}
              className="px-2 py-1 rounded-t text-[10px] font-bold transition-all"
              style={{
                background: timeTab === tab.id ? `${G}20` : 'rgba(255,255,255,0.03)',
                color:      timeTab === tab.id ? G : 'rgba(255,255,255,0.35)',
                borderBottom: timeTab === tab.id ? `2px solid ${G}` : '2px solid transparent',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-3 py-3 space-y-1.5 max-h-72 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="py-8 text-center">
            <Gift className="w-6 h-6 mx-auto mb-2 opacity-20" style={{ color: G }} />
            <p className="text-[10px] text-white/20">No gifts yet this stream</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {transactions.map((entry, i) => (
              <GiftRow key={entry.sender_id} entry={entry} rank={i} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
