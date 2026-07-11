import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Users, Trophy, Zap, Timer, TrendingUp } from 'lucide-react';

const BattleCard = ({ player, score, tips, isWinner }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`flex-1 rounded-xl p-4 text-center border-2 transition-all ${
      isWinner ? 'border-amber-400 bg-amber-400/10' : 'border-white/20 bg-white/5'
    }`}
  >
    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
      <span className="text-xl font-bold text-white">{player?.initials || 'N/A'}</span>
    </div>
    <h3 className="font-bold text-white mb-1">{player?.name || 'Player'}</h3>
    <p className="text-[11px] text-white/60 mb-3">{player?.followers || 0} followers</p>

    <div className="space-y-1.5 mb-3">
      <div className="bg-white/10 rounded px-2 py-1">
        <p className="text-[11px] text-white/50">TIPS</p>
        <p className="text-2xl font-black text-white">${tips || 0}</p>
      </div>
      <div className="bg-white/10 rounded px-2 py-1">
        <p className="text-[11px] text-white/50">SCORE</p>
        <p className="text-2xl font-black text-amber-400">{score || 0}</p>
      </div>
    </div>

    {isWinner && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex items-center justify-center gap-1 bg-amber-400/20 rounded py-2"
      >
        <Trophy className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-bold text-amber-400">WINNING</span>
      </motion.div>
    )}
  </motion.div>
);

export default function PKBattleInterface({ roomId }) {
  const [battleActive, setBattleActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [creator, setCreator] = useState({
    name: 'CreatorName',
    followers: 1250,
    initials: 'CN',
    score: 0,
    tips: 0
  });
  const [challenger, setChallenger] = useState({
    name: 'ChallengeName',
    followers: 890,
    initials: 'CH',
    score: 0,
    tips: 0
  });

  useEffect(() => {
    if (!battleActive) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setBattleActive(false);
          return 0;
        }
        return t - 1;
      });

      // Simulate score updates
      setCreator(prev => ({
        ...prev,
        tips: prev.tips + Math.floor(Math.random() * 50),
        score: prev.score + Math.floor(Math.random() * 100)
      }));

      setChallenger(prev => ({
        ...prev,
        tips: prev.tips + Math.floor(Math.random() * 40),
        score: prev.score + Math.floor(Math.random() * 80)
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [battleActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const winner = creator.tips > challenger.tips ? 'creator' : 'challenger';

  if (!battleActive) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-xl p-6 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Swords className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-black text-white">PK BATTLE</h2>
        </div>
        <p className="text-white/60 mb-6">Challenge another creator to a live battle</p>
        <button
          onClick={() => {
            setBattleActive(true);
            setTimeLeft(180);
            setCreator(p => ({ ...p, tips: 0, score: 0 }));
            setChallenger(p => ({ ...p, tips: 0, score: 0 }));
          }}
          style={{
            width: '100%', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', borderRadius: 8,
            background: '#f59e0b', color: '#000', border: 'none',
          }}
        >
          <Swords className="w-4 h-4" />
          Start Battle
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/50 rounded-xl p-4 space-y-4"
    >
      {/* Timer & Status */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/50 rounded-lg px-4 py-2 mb-4">
          <Timer className="w-5 h-5 text-amber-500 animate-pulse" />
          <span className="text-2xl font-black text-amber-400">{formatTime(timeLeft)}</span>
        </div>
        <p className="text-[11px] text-white/60 uppercase tracking-wider">3-Minute PK Battle</p>
      </div>

      {/* VS View */}
      <div className="flex gap-3">
        <BattleCard
          player={creator}
          score={creator.score}
          tips={creator.tips}
          isWinner={battleActive && winner === 'creator'}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="text-center">
            <p className="text-[10px] text-white/40 uppercase font-bold">VS</p>
            <Zap className="w-5 h-5 text-amber-500 mx-auto" />
          </div>
          <div className="text-center">
            <p className="text-[11px] text-white/60">Creator Advantage</p>
            <p className="text-sm font-bold text-white">{Math.round((creator.tips / (creator.tips + challenger.tips || 1)) * 100)}%</p>
          </div>
        </div>

        <BattleCard
          player={challenger}
          score={challenger.score}
          tips={challenger.tips}
          isWinner={battleActive && winner === 'challenger'}
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-[11px] text-white/60 uppercase">Total Tips</p>
          <p className="text-lg font-bold text-white">${(creator.tips + challenger.tips).toLocaleString()}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-[11px] text-white/60 uppercase">Engagement</p>
          <p className="text-lg font-bold text-white">{(creator.score + challenger.score).toLocaleString()}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-[11px] text-white/60 uppercase">Viewers</p>
          <p className="text-lg font-bold text-white">2.4K</p>
        </div>
      </div>

      {/* End Battle Button */}
      {timeLeft <= 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center"
        >
          <Trophy className="w-6 h-6 mx-auto mb-2 text-green-400" />
          <p className="text-sm font-bold text-white mb-2">
            {winner === 'creator' ? creator.name : challenger.name} Wins!
          </p>
          <button
            onClick={() => setBattleActive(false)}
            style={{
              width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 14, cursor: 'pointer', borderRadius: 8,
              background: '#6DBF7E', color: '#fff', border: 'none',
            }}
          >
            View Results
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
