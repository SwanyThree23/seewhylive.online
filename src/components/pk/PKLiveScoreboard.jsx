import React from 'react';
import { motion } from 'framer-motion';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

export default function PKLiveScoreboard({ battle }) {
  if (!battle) return null;
  const lead = battle.score_a > battle.score_b ? 'a' : battle.score_b > battle.score_a ? 'b' : null;
  return (
    <motion.div
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -24, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="relative z-20 flex items-stretch gap-1 px-2 py-1.5"
      style={{ background: 'linear-gradient(90deg, rgba(128,0,32,0.4), rgba(8,11,24,0.6), rgba(212,175,55,0.28))', borderBottom: '1px solid rgba(212,175,55,0.3)' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center min-w-0">
        <span className="text-[8px] font-black uppercase truncate w-full text-center" style={{ ...T, color: GOLD }}>{battle.challenger_name || 'Host'}</span>
        <motion.span key={battle.score_a} initial={{ scale: 1.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }} className="text-xl font-black tabular-nums leading-none" style={{ ...T, color: lead === 'a' ? GOLD : '#fff' }}>{battle.score_a || 0}</motion.span>
      </div>
      <div className="flex flex-col items-center justify-center px-1 shrink-0">
        <span className="text-[8px] font-black" style={{ ...T, color: 'rgba(255,255,255,0.4)' }}>VS</span>
        <span className="text-[8px]" style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>Bo{battle.format}</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center min-w-0">
        <span className="text-[8px] font-black uppercase truncate w-full text-center" style={{ ...T, color: '#ff6b6b' }}>{battle.opponent_name || 'Opp'}</span>
        <motion.span key={battle.score_b} initial={{ scale: 1.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }} className="text-xl font-black tabular-nums leading-none" style={{ ...T, color: lead === 'b' ? '#ff6b6b' : '#fff' }}>{battle.score_b || 0}</motion.span>
      </div>
    </motion.div>
  );
}