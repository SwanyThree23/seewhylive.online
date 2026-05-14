import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Zap, Trophy } from 'lucide-react';

export default function BattleScoreboard({ roomId }) {
  const [prevScores, setPrevScores] = useState({});
  const [bumps, setBumps] = useState({});

  const { data: battle } = useQuery({
    queryKey: ['active-battle-scoreboard', roomId],
    queryFn: async () => {
      const battles = await base44.entities.PKBattle.filter({ room_id: roomId, status: 'active' });
      return battles?.[0] || null;
    },
    enabled: !!roomId,
    refetchInterval: 2000,
  });

  // Detect score changes and trigger bump animation
  useEffect(() => {
    if (!battle) return;
    const newBumps = {};
    ['host_score', 'challenger_score'].forEach(key => {
      if (prevScores[key] !== undefined && battle[key] !== prevScores[key]) {
        newBumps[key] = true;
      }
    });
    if (Object.keys(newBumps).length > 0) {
      setBumps(newBumps);
      setTimeout(() => setBumps({}), 600);
    }
    setPrevScores({ host_score: battle.host_score, challenger_score: battle.challenger_score });
  }, [battle?.host_score, battle?.challenger_score]);

  if (!battle) return null;

  const hostScore = battle.host_score || 0;
  const chalScore = battle.challenger_score || 0;
  const total = hostScore + chalScore || 1;
  const hostPct = Math.round((hostScore / total) * 100);
  const chalPct = 100 - hostPct;
  const leading = hostScore >= chalScore ? 'host' : 'challenger';

  const timeLeft = battle.duration_seconds
    ? Math.max(0, battle.duration_seconds - Math.floor((Date.now() - new Date(battle.started_at).getTime()) / 1000))
    : null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,6,24,0.98)', border: '1px solid rgba(204,119,85,0.3)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ background: 'rgba(204,119,85,0.1)', borderBottom: '1px solid rgba(204,119,85,0.2)' }}>
        <div className="flex items-center gap-1.5">
          <Swords className="w-3.5 h-3.5" style={{ color: '#CC7755' }} />
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#CC7755', fontFamily: 'Barlow Condensed, sans-serif' }}>
            Live Battle
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-1" />
        </div>
        {timeLeft !== null && (
          <span className="text-[11px] font-mono" style={{ color: '#d4af37' }}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Scores */}
      <div className="grid grid-cols-3 items-center px-3 py-3 gap-2">
        {/* Host */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
            style={{ background: leading === 'host' ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)', border: `1px solid ${leading === 'host' ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}` }}>
            👑
          </div>
          <p className="text-[9px] text-white/50 truncate w-full text-center">{battle.host_name || 'Host'}</p>
          <motion.p
            animate={bumps.host_score ? { scale: [1, 1.4, 1], color: ['#d4af37', '#00FF88', '#d4af37'] } : {}}
            transition={{ duration: 0.5 }}
            className="text-2xl font-black tabular-nums"
            style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>
            {hostScore.toLocaleString()}
          </motion.p>
        </div>

        {/* VS bar */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-black text-white/30" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>VS</span>
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              animate={{ width: `${hostPct}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 20 }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #d4af37, #CC7755)' }}
            />
          </div>
          <div className="flex justify-between w-full text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span>{hostPct}%</span><span>{chalPct}%</span>
          </div>
        </div>

        {/* Challenger */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
            style={{ background: leading === 'challenger' ? 'rgba(204,119,85,0.25)' : 'rgba(255,255,255,0.06)', border: `1px solid ${leading === 'challenger' ? 'rgba(204,119,85,0.5)' : 'rgba(255,255,255,0.1)'}` }}>
            ⚔️
          </div>
          <p className="text-[9px] text-white/50 truncate w-full text-center">{battle.challenger_name || 'Challenger'}</p>
          <motion.p
            animate={bumps.challenger_score ? { scale: [1, 1.4, 1], color: ['#CC7755', '#00FF88', '#CC7755'] } : {}}
            transition={{ duration: 0.5 }}
            className="text-2xl font-black tabular-nums"
            style={{ color: '#CC7755', fontFamily: 'Barlow Condensed, sans-serif' }}>
            {chalScore.toLocaleString()}
          </motion.p>
        </div>
      </div>

      {/* Leading banner */}
      <div className="px-3 pb-2 text-center">
        <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          {hostScore === chalScore ? '🤝 Tied!' : `${leading === 'host' ? (battle.host_name || 'Host') : (battle.challenger_name || 'Challenger')} is leading`}
        </span>
      </div>
    </div>
  );
}