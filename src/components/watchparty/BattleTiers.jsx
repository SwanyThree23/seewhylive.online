import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Crown } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const TIERS = [
  { id: 'bronze',   label: 'Bronze',   emoji: '🥉', color: '#cd7f32', pts: 10,  bg: 'rgba(205,127,50,0.12)',  border: 'rgba(205,127,50,0.3)' },
  { id: 'silver',   label: 'Silver',   emoji: '🥈', color: '#c0c0c0', pts: 25,  bg: 'rgba(192,192,192,0.10)', border: 'rgba(192,192,192,0.25)' },
  { id: 'gold',     label: 'Gold',     emoji: '🥇', color: '#d4af37', pts: 50,  bg: 'rgba(212,175,55,0.12)',  border: 'rgba(212,175,55,0.3)' },
  { id: 'diamond',  label: 'Diamond',  emoji: '💎', color: '#C9A84C', pts: 100, bg: 'rgba(201,168,76,0.10)',   border: 'rgba(201,168,76,0.3)' },
  { id: 'legendary',label: 'Legendary',emoji: '👑', color: '#D4AF37', pts: 250, bg: 'rgba(212,175,55,0.12)',  border: 'rgba(212,175,55,0.35)' },
];

function FloatingBurst({ tier, onDone }) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 1, y: 0 }}
      animate={{ scale: 2.5, opacity: 0, y: -80 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
    >
      <span className="text-5xl">{tier.emoji}</span>
    </motion.div>
  );
}

export default function BattleTiers({ partyId, currentUser, members = [], hostId }) {
  const qc = useQueryClient();
  const [bursts, setBursts] = useState([]);
  const burstId = useRef(0);
  const [optimisticPts, setOptimisticPts] = useState({});

  // Fetch all tier events from the DB (Message entity, type battle_tier)
  const { data: tierMessages = [] } = useQuery({
    queryKey: ['battle-tiers', partyId],
    queryFn: () => base44.entities.Message.filter({ room_id: partyId, message_type: 'battle_tier' }),
    enabled: !!partyId,
  });

  // Real-time subscription so every client sees new awards instantly
  useEffect(() => {
    if (!partyId) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.room_id !== partyId || event.data?.message_type !== 'battle_tier') return;
      qc.invalidateQueries(['battle-tiers', partyId]);
    });
    return unsub;
  }, [partyId, qc]);

  // Derive scores from messages
  const scores = useMemo(() => {
    const map = {};
    tierMessages.forEach(msg => {
      try {
        const { userId, pts } = JSON.parse(msg.content);
        map[userId] = (map[userId] || 0) + pts;
      } catch {}
    });
    return map;
  }, [tierMessages]);

  // Merge optimistic points on top of DB scores
  const mergedScores = useMemo(() => {
    const merged = { ...scores };
    Object.entries(optimisticPts).forEach(([uid, pts]) => {
      merged[uid] = (merged[uid] || 0) + pts;
    });
    return merged;
  }, [scores, optimisticPts]);

  const myPts = currentUser ? (mergedScores[currentUser.id] || 0) : 0;

  const sendTier = async (tier) => {
    if (!currentUser || !partyId) return;
    // Optimistic burst animation + instant score update
    const id = ++burstId.current;
    setBursts(p => [...p, { id, tier }]);
    setTimeout(() => setBursts(p => p.filter(b => b.id !== id)), 1300);
    setOptimisticPts(prev => ({ ...prev, [currentUser.id]: (prev[currentUser.id] || 0) + tier.pts }));
    try {
      await base44.entities.Message.create({
        room_id: partyId,
        user_id: currentUser.id,
        user_name: currentUser.full_name || currentUser.email,
        message_type: 'battle_tier',
        content: JSON.stringify({ userId: currentUser.id, pts: tier.pts, tierId: tier.id }),
      });
      qc.invalidateQueries(['battle-tiers', partyId]);
      // Clear optimistic delta once DB query refreshes
      setOptimisticPts(prev => { const n = { ...prev }; delete n[currentUser.id]; return n; });
    } catch {
      // Roll back optimistic pts on failure
      setOptimisticPts(prev => ({ ...prev, [currentUser.id]: Math.max(0, (prev[currentUser.id] || 0) - tier.pts) }));
    }
  };

  // Sorted leaderboard derived from merged scores
  const board = members
    .map(m => ({ name: m.user_name, uid: m.user_id, pts: mergedScores[m.user_id] || 0 }))
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 5);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.97)', border: '1px solid rgba(212,175,55,0.18)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
        <Swords className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#d4af37' }}>
          Battle Tiers
        </span>
        {myPts > 0 && (
          <span className="ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37' }}>
            You: {myPts}pts
          </span>
        )}
      </div>

      {/* Tier buttons */}
      <div className="flex gap-1.5 p-2.5 flex-wrap">
        {TIERS.map(tier => (
          <motion.button key={tier.id} whileTap={{ scale: 0.88 }}
            onClick={() => sendTier(tier)}
            className="flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl flex-1 min-w-[52px] transition-all"
            style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
            <span className="text-lg">{tier.emoji}</span>
            <span className="text-[11px] font-black" style={{ color: tier.color, fontFamily: 'Barlow Condensed, sans-serif' }}>
              +{tier.pts}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Mini leaderboard */}
      {board.some(b => b.pts > 0) && (
        <div className="px-2.5 pb-2.5 space-y-1">
          <p className="text-[11px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            Top Battlers
          </p>
          {board.filter(b => b.pts > 0).map((b, i) => (
            <div key={b.uid} className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[10px]">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
              <span className="text-[11px] font-bold text-white flex-1 truncate">{b.name}</span>
              <span className="text-[11px] font-black tabular-nums" style={{ color: '#d4af37' }}>{b.pts}pts</span>
            </div>
          ))}
        </div>
      )}

      {/* Burst animations */}
      <AnimatePresence>
        {bursts.map(b => (
          <FloatingBurst key={b.id} tier={b.tier} onDone={() => setBursts(p => p.filter(x => x.id !== b.id))} />
        ))}
      </AnimatePresence>
    </div>
  );
}