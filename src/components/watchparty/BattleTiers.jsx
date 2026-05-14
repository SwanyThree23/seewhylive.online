import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Zap, Crown } from 'lucide-react';

const TIERS = [
  { id: 'bronze',   label: 'Bronze',   emoji: '🥉', color: '#cd7f32', pts: 10,  bg: 'rgba(205,127,50,0.12)',  border: 'rgba(205,127,50,0.3)' },
  { id: 'silver',   label: 'Silver',   emoji: '🥈', color: '#c0c0c0', pts: 25,  bg: 'rgba(192,192,192,0.10)', border: 'rgba(192,192,192,0.25)' },
  { id: 'gold',     label: 'Gold',     emoji: '🥇', color: '#d4af37', pts: 50,  bg: 'rgba(212,175,55,0.12)',  border: 'rgba(212,175,55,0.3)' },
  { id: 'diamond',  label: 'Diamond',  emoji: '💎', color: '#00F5FF', pts: 100, bg: 'rgba(0,245,255,0.10)',   border: 'rgba(0,245,255,0.3)' },
  { id: 'legendary',label: 'Legendary',emoji: '👑', color: '#8B5CF6', pts: 250, bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.35)' },
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
  const [scores, setScores] = useState({});       // { userId: totalPts }
  const [bursts, setBursts] = useState([]);        // [{id, tier}]
  const [myPts, setMyPts] = useState(0);
  const burstId = useRef(0);

  const sendTier = (tier) => {
    if (!currentUser) return;
    const uid = currentUser.id;
    setScores(prev => ({ ...prev, [uid]: (prev[uid] || 0) + tier.pts }));
    setMyPts(p => p + tier.pts);
    const id = ++burstId.current;
    setBursts(p => [...p, { id, tier }]);
    setTimeout(() => setBursts(p => p.filter(b => b.id !== id)), 1300);
  };

  // Sorted leaderboard
  const board = members
    .map(m => ({ name: m.user_name, uid: m.user_id, pts: scores[m.user_id] || 0 }))
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 5);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(7,7,15,0.97)', border: '1px solid rgba(212,175,55,0.18)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
        <Swords className="w-3.5 h-3.5 text-yellow-400" />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#d4af37' }}>
          Battle Tiers
        </span>
        {myPts > 0 && (
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37' }}>
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
            <span className="text-[8px] font-black" style={{ color: tier.color, fontFamily: 'Barlow Condensed, sans-serif' }}>
              +{tier.pts}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Mini leaderboard */}
      {board.some(b => b.pts > 0) && (
        <div className="px-2.5 pb-2.5 space-y-1">
          <p className="text-[8px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            Top Battlers
          </p>
          {board.filter(b => b.pts > 0).map((b, i) => (
            <div key={b.uid} className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[10px]">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
              <span className="text-[9px] font-bold text-white flex-1 truncate">{b.name}</span>
              <span className="text-[9px] font-black tabular-nums" style={{ color: '#d4af37' }}>{b.pts}pts</span>
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