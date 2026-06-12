import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Crown, Trophy, Star, Zap, Users, DollarSign, Timer, Gift, X, Medal } from 'lucide-react';
import { toast } from 'sonner';

// ── Constants ────────────────────────────────────────────────────────────────
const GIFTS = [
  { emoji: '🌹', label: 'Rose',    pts: 1,   usd: 0.10, color: '#ff6b6b' },
  { emoji: '🍰', label: 'Cake',    pts: 5,   usd: 0.50, color: '#ffd93d' },
  { emoji: '💎', label: 'Diamond', pts: 10,  usd: 1.00, color: '#C9A84C' },
  { emoji: '🔥', label: 'Fire',    pts: 25,  usd: 2.50, color: '#ff8c00' },
  { emoji: '🚀', label: 'Rocket',  pts: 50,  usd: 5.00, color: '#D4AF37' },
  { emoji: '👑', label: 'Crown',   pts: 100, usd: 10.00, color: '#d4af37' },
];

const QUICK_EMOJIS = ['❤️','🔥','💯','👏','😂','🎉','💪','⚡','🌟','🤩','😱','🙌'];

// Fake top supporters for simulation (in production these'd come from Transaction entity)
function genSupporters(name, score, side) {
  const names = side === 'left'
    ? ['AceViewer','BlazeFan','ChampX','DragonSup','EaglePro']
    : ['FlameBoss','GoldRush','HeroWave','IcePeak','JetStream'];
  return names.slice(0, 5).map((n, i) => ({
    name: n,
    amount: Math.max(1, Math.floor(score * (0.35 - i * 0.06))),
    rank: i + 1,
    emoji: ['🥇','🥈','🥉','4️⃣','5️⃣'][i],
  }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FloatingEmoji({ item, onDone }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none text-3xl z-50"
      style={{ left: item.x, bottom: 60 }}
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{ y: item.big ? -320 : -200, opacity: 0, scale: item.big ? 3 : 1.8 }}
      transition={{ duration: item.big ? 2 : 1.4, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      {item.emoji}
    </motion.div>
  );
}

function FloatingTip({ item, onDone }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none z-50 font-black text-sm px-3 py-1 rounded-full"
      style={{ left: item.x, bottom: 70, background: 'rgba(212,175,55,0.9)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif' }}
      initial={{ y: 0, opacity: 1, scale: 0.8 }}
      animate={{ y: -160, opacity: 0, scale: 1.2 }}
      transition={{ duration: 1.6, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      +{item.pts}pts {item.emoji}
    </motion.div>
  );
}

function ViewerBar({ count, side, color }) {
  return (
    <div className="flex items-center gap-0.5 md:gap-1.5" style={{ flexDirection: side === 'right' ? 'row-reverse' : 'row' }}>
      <Users className="w-2 md:w-3 h-2 md:h-3 flex-shrink-0" style={{ color }} />
      <span className="text-[11px] md:text-xs font-black tabular-nums" style={{ color, fontFamily: 'Orbitron, monospace' }}>
        {(count || 0).toLocaleString()}
      </span>
    </div>
  );
}

function SupporterBoard({ supporters, color, name }) {
  return (
    <div className="space-y-0.5 md:space-y-1">
      <p className="text-[7px] md:text-[11px] font-black uppercase tracking-widest mb-1"
        style={{ color, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
        Top
      </p>
      {supporters.map((s) => (
        <motion.div key={s.name} layout
          className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg"
          style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
          <span className="text-[11px] md:text-xs flex-shrink-0">{s.emoji}</span>
          <span className="text-[11px] md:text-[10px] font-bold text-white truncate flex-1">{s.name}</span>
          <span className="text-[7px] md:text-[10px] font-black tabular-nums flex-shrink-0" style={{ color }}>
            {s.amount}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function WinnerCelebration({ battle, onClose }) {
  const winnerIsCreator = (battle.creator_score || 0) >= (battle.challenger_score || 0);
  const winnerName = winnerIsCreator ? battle.creator_name : (battle.challenger_name || 'Challenger');
  const loserName = winnerIsCreator ? (battle.challenger_name || 'Challenger') : battle.creator_name;
  const winScore = winnerIsCreator ? (battle.creator_score || 0) : (battle.challenger_score || 0);
  const loseScore = winnerIsCreator ? (battle.challenger_score || 0) : (battle.creator_score || 0);
  const winTips = winnerIsCreator ? (battle.creator_tips || 0) : (battle.challenger_tips || 0);
  const winColor = winnerIsCreator ? '#D4AF37' : '#ef4444';

  const particles = [...Array(30)].map((_, i) => ({
    id: i,
    x: `${(i * 7 + 5) % 100}%`,
    color: ['#d4af37','#CC7755','#6B7C4A','#C9A84C','#D4AF37'][i % 5],
    size: 4 + (i % 4),
    duration: 1.8 + (i % 4) * 0.3,
    delay: i * 0.06,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(12px)' }}
    >
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <motion.div key={p.id}
            className="absolute rounded-sm"
            style={{ left: p.x, top: -20, width: p.size, height: p.size, background: p.color }}
            initial={{ y: -20, rotate: 0, opacity: 1 }}
            animate={{ y: '110vh', rotate: p.id * 40, opacity: [1, 1, 0] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, repeatDelay: 0.5 }}
          />
        ))}
        {/* Big floating trophies */}
        {['🏆','🏆','🏆'].map((t, i) => (
          <motion.div key={i} className="absolute text-6xl"
            style={{ left: `${20 + i * 30}%`, bottom: -60 }}
            initial={{ y: 0, opacity: 0 }} animate={{ y: -300, opacity: [0, 1, 0] }}
            transition={{ duration: 3, delay: 0.5 + i * 0.4, repeat: Infinity, repeatDelay: 1 }}
          >{t}</motion.div>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.3, rotate: -12 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.6, duration: 0.8 }}
        className="relative z-10 text-center px-6 py-10 rounded-3xl max-w-sm w-full mx-4"
        style={{ background: 'rgba(8,11,24,0.99)', border: `2px solid ${winColor}`, boxShadow: `0 0 60px ${winColor}40` }}
      >
        {/* Pulse ring */}
        <motion.div className="absolute inset-0 rounded-3xl"
          animate={{ boxShadow: [`0 0 20px ${winColor}30`, `0 0 60px ${winColor}60`, `0 0 20px ${winColor}30`] }}
          transition={{ duration: 1.5, repeat: Infinity }} />

        <motion.div className="text-6xl mb-2"
          animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, delay: 0.4, repeat: 3 }}>🏆</motion.div>

        <Crown className="w-10 h-10 mx-auto mb-2" style={{ color: '#d4af37' }} />

        <p className="text-[10px] uppercase tracking-[0.4em] mb-1"
          style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          PK Battle Winner
        </p>
        <motion.h2 className="text-4xl font-black mb-1"
          style={{ fontFamily: 'Orbitron, monospace', color: '#d4af37' }}
          animate={{ textShadow: ['0 0 10px #d4af3780', '0 0 30px #d4af37cc', '0 0 10px #d4af3780'] }}
          transition={{ duration: 1.2, repeat: Infinity }}>
          {winnerName}
        </motion.h2>
        <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
          defeated <span className="text-white/60 font-bold">{loserName}</span>
        </p>

        {/* Score split */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 rounded-xl text-center" style={{ background: `${winColor}15`, border: `1px solid ${winColor}30` }}>
            <p className="text-[11px] text-white/40">Score</p>
            <p className="text-xl font-black" style={{ fontFamily: 'Orbitron, monospace', color: winColor }}>{winScore.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <p className="text-[11px] text-white/40">Tips</p>
            <p className="text-xl font-black" style={{ fontFamily: 'Orbitron, monospace', color: '#d4af37' }}>${winTips.toFixed(0)}</p>
          </div>
          <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[11px] text-white/40">Rival</p>
            <p className="text-xl font-black" style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(255,255,255,0.3)' }}>{loseScore.toLocaleString()}</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl mb-5"
          style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Star className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-bold text-white">+{battle.reward_points || 500}</span>
            <span className="text-white/40 text-xs">Loyalty Points</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 mt-1">
            <Medal className="w-3 h-3 text-[#C9A84C]" />
            PK Champion badge unlocked
          </div>
        </div>

        <button onClick={onClose}
          className="w-full py-3 rounded-2xl font-black text-sm uppercase"
          style={{ background: 'linear-gradient(135deg, #6B4423, #d4af37)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
          Claim Victory →
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Main BattleOverlay ────────────────────────────────────────────────────────

export default function BattleOverlay({ battle, onBattleUpdate }) {
  const qc = useQueryClient();
  const [floatingItems, setFloatingItems] = useState([]);
  const [timeLeft, setTimeLeft] = useState(battle?.duration_seconds || 180);
  const [showWinner, setShowWinner] = useState(false);
  const [ended, setEnded] = useState(false);
  const [tipFeed, setTipFeed] = useState([]);
  const floatIdRef = useRef(0);
  const timerRef = useRef(null);
  const endedRef = useRef(false);

  const isActive = battle?.status === 'active';
  const creatorScore = battle?.creator_score || 0;
  const challengerScore = battle?.challenger_score || 0;
  const totalPts = creatorScore + challengerScore || 1;
  const creatorPct = Math.round((creatorScore / totalPts) * 100);
  const challengerPct = 100 - creatorPct;
  const creatorTips = battle?.creator_tips || 0;
  const challengerTips = battle?.challenger_tips || 0;
  const creatorViewers = Math.floor(50 + creatorScore * 0.8);
  const challengerViewers = Math.floor(50 + challengerScore * 0.8);

  const creatorSupporters = genSupporters(battle?.creator_name, creatorScore, 'left');
  const challengerSupporters = genSupporters(battle?.challenger_name, challengerScore, 'right');

  // Timer
  useEffect(() => {
    if (!battle || !isActive) return;
    const endsAt = new Date(battle.started_at).getTime() + battle.duration_seconds * 1000;
    const tick = () => {
      const rem = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
      setTimeLeft(rem);
      if (rem <= 0 && !endedRef.current) {
        endedRef.current = true;
        clearInterval(timerRef.current);
        handleAutoEnd();
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [battle?.id, isActive]);

  const addGiftMutation = useMutation({
    mutationFn: (vars) => {
      const update = {};
      if (vars.side === 'creator') {
        update.creator_score = creatorScore + vars.pts;
        update.creator_tips = +(creatorTips + vars.usd).toFixed(2);
      } else {
        update.challenger_score = challengerScore + vars.pts;
        update.challenger_tips = +(challengerTips + vars.usd).toFixed(2);
      }
      return base44.entities.PKBattle.update(battle.id, update);
    },
    onSuccess: () => {
      qc.invalidateQueries(['pk-battles']);
      onBattleUpdate?.();
    },
  });

  const handleAutoEnd = useCallback(() => {
    if (!battle) return;
    const winnerId = creatorScore >= challengerScore ? battle.creator_id : battle.challenger_id;
    const winnerName = creatorScore >= challengerScore ? battle.creator_name : (battle.challenger_name || 'Challenger');
    base44.entities.PKBattle.update(battle.id, {
      status: 'ended', winner_id: winnerId, winner_name: winnerName, ended_at: new Date().toISOString(),
    }).then(() => {
      qc.invalidateQueries(['pk-battles']);
      setEnded(true);
      setShowWinner(true);
    });
  }, [battle, creatorScore, challengerScore]);

  const sendGift = (side, gift) => {
    if (!isActive) { toast.error('Battle not active'); return; }
    const id = ++floatIdRef.current;
    const x = `${20 + Math.random() * 60}%`;
    setFloatingItems(p => [...p, { id, emoji: gift.emoji, pts: gift.pts, x, big: gift.pts >= 50 }]);
    setTipFeed(p => [{
      id, side, name: 'You', emoji: gift.emoji, pts: gift.pts, usd: gift.usd, ts: Date.now(),
    }, ...p.slice(0, 9)]);
    addGiftMutation.mutate({ side, pts: gift.pts, usd: gift.usd });
  };

  const removeFloat = (id) => setFloatingItems(p => p.filter(x => x.id !== id));

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  const urgency = timeLeft < 30 ? 'critical' : timeLeft < 60 ? 'warning' : 'normal';
  const timerColor = urgency === 'critical' ? '#C0392B' : urgency === 'warning' ? '#FF8C00' : '#d4af37';

  if (!battle) return null;

  return (
    <div className="relative select-none" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Winner celebration */}
      <AnimatePresence>
        {showWinner && (
          <WinnerCelebration
            battle={{ ...battle, creator_score: creatorScore, challenger_score: challengerScore }}
            onClose={() => { setShowWinner(false); setEnded(true); }}
          />
        )}
      </AnimatePresence>

      {/* Floating gifts & tips */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-40">
        <AnimatePresence>
          {floatingItems.map(item =>
            item.pts ? (
              <FloatingTip key={item.id} item={item} onDone={() => removeFloat(item.id)} />
            ) : (
              <FloatingEmoji key={item.id} item={item} onDone={() => removeFloat(item.id)} />
            )
          )}
        </AnimatePresence>
      </div>

      {/* ── MAIN SPLIT-SCREEN HEADER ─────────────────────────────────── */}
      <div className="rounded-xl md:rounded-2xl overflow-hidden mb-2 md:mb-3"
        style={{ background: 'rgba(8,11,24,0.98)', border: '1px solid rgba(212,175,55,0.18)' }}>

        {/* Status bar */}
        <div className="flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2 text-[11px] md:text-[10px]"
          style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-1 md:gap-2 min-w-0">
            <Swords className="w-3 md:w-4 h-3 md:h-4 text-[#D4AF37] animate-pulse flex-shrink-0" />
            {isActive ? (
              <span className="font-black uppercase animate-pulse truncate"
                style={{ color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em', fontSize: '8px' }}>
                ● LIVE
              </span>
            ) : (
              <span className="text-[11px] font-bold uppercase truncate"
                style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                {battle.status.toUpperCase()}
              </span>
            )}
          </div>

          {/* Timer */}
          <motion.div
            animate={urgency === 'critical' ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: urgency === 'critical' ? Infinity : 0 }}
            className="flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 rounded-full flex-shrink-0"
            style={{ background: `${timerColor}15`, border: `1px solid ${timerColor}40` }}>
            <Timer className="w-2.5 md:w-3.5 h-2.5 md:h-3.5" style={{ color: timerColor }} />
            <span className="font-black tabular-nums text-sm md:text-lg"
              style={{ fontFamily: 'Orbitron, monospace', color: timerColor }}>
              {fmt(timeLeft)}
            </span>
          </motion.div>

          <div className="flex items-center gap-0.5 md:gap-1 text-[11px] md:text-[10px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <DollarSign className="w-2.5 md:w-3 h-2.5 md:h-3" />
            <span className="font-bold truncate">${(creatorTips + challengerTips).toFixed(0)}</span>
          </div>
        </div>

        {/* Split score + viewer counts */}
        <div className="grid grid-cols-3" style={{ minHeight: '90px' }}>
          {/* Creator side */}
          <motion.div className="p-2.5 md:p-4 flex flex-col gap-1"
            animate={creatorScore > challengerScore && isActive ? { boxShadow: ['inset 0 0 0 transparent', 'inset 0 0 20px rgba(212,175,55,0.15)', 'inset 0 0 0 transparent'] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ background: 'rgba(212,175,55,0.06)', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center justify-between">
              <div className="w-6 md:w-8 h-6 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center font-black text-xs md:text-sm flex-shrink-0"
                style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37' }}>
                {battle.creator_name.charAt(0).toUpperCase()}
              </div>
              <ViewerBar count={creatorViewers} side="right" color="#D4AF37" />
            </div>
            <p className="text-[10px] md:text-xs font-bold text-white truncate mt-0.5">{battle.creator_name}</p>
            <motion.p layout className="text-2xl md:text-3xl font-black tabular-nums"
              style={{ fontFamily: 'Orbitron, monospace', color: '#D4AF37' }}>
              {creatorScore.toLocaleString()}
            </motion.p>
            <p className="text-[11px] md:text-[11px]" style={{ color: 'rgba(212,175,55,0.6)' }}>
              ${creatorTips.toFixed(0)}
            </p>
          </motion.div>

          {/* Center VS */}
          <div className="flex flex-col items-center justify-center gap-0.5">
            <Swords className="w-4 md:w-5 h-4 md:h-5 text-[#D4AF37]" />
            <span className="text-[11px] md:text-xs font-black text-[#D4AF37]"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>VS</span>
            <span className="text-[7px] md:text-[11px] text-white/25">{totalPts.toLocaleString()}</span>
          </div>

          {/* Challenger side */}
          <motion.div className="p-2.5 md:p-4 flex flex-col gap-1 items-end"
            animate={challengerScore > creatorScore && isActive ? { boxShadow: ['inset 0 0 0 transparent', 'inset 0 0 20px rgba(239,68,68,0.15)', 'inset 0 0 0 transparent'] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ background: 'rgba(239,68,68,0.06)', borderLeft: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center justify-between w-full">
              <ViewerBar count={challengerViewers} side="left" color="#ef4444" />
              <div className="w-6 md:w-8 h-6 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center font-black text-xs md:text-sm flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                {(battle.challenger_name || '?').charAt(0).toUpperCase()}
              </div>
            </div>
            <p className="text-[10px] md:text-xs font-bold text-white truncate mt-0.5 text-right">{battle.challenger_name || 'Challenger'}</p>
            <motion.p layout className="text-2xl md:text-3xl font-black tabular-nums text-right"
              style={{ fontFamily: 'Orbitron, monospace', color: '#ef4444' }}>
              {challengerScore.toLocaleString()}
            </motion.p>
            <p className="text-[11px] md:text-[11px] text-right" style={{ color: 'rgba(239,68,68,0.6)' }}>
              ${challengerTips.toFixed(0)}
            </p>
          </motion.div>
        </div>

        {/* Progress bar */}
        <div className="px-2.5 md:px-3 pb-2.5 md:pb-3">
          <div className="h-2.5 md:h-3 rounded-full flex overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div className="h-full rounded-l-full transition-all duration-700"
              style={{ width: `${creatorPct}%`, background: 'linear-gradient(90deg, #800020, #D4AF37)' }} />
            <motion.div className="h-full rounded-r-full transition-all duration-700"
              style={{ width: `${challengerPct}%`, background: 'linear-gradient(90deg, #ef4444, #dc2626)' }} />
          </div>
          <div className="flex justify-between mt-0.5 md:mt-1">
            <span className="text-[11px] md:text-[11px] font-black" style={{ color: '#D4AF37' }}>{creatorPct}%</span>
            <span className="text-[11px] md:text-[11px] font-black" style={{ color: '#ef4444' }}>{challengerPct}%</span>
          </div>
        </div>
      </div>

      {/* ── LEADERBOARDS SIDE BY SIDE ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-1.5 md:gap-2 mb-2 md:mb-3">
        <div className="p-2 md:p-3 rounded-xl md:rounded-2xl" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <SupporterBoard supporters={creatorSupporters} color="#D4AF37" name={battle.creator_name} />
        </div>
        <div className="p-2 md:p-3 rounded-xl md:rounded-2xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <SupporterBoard supporters={challengerSupporters} color="#ef4444" name={battle.challenger_name || 'Challenger'} />
        </div>
      </div>

      {/* ── TIP FEED ────────────────────────────────────────────────── */}
      {tipFeed.length > 0 && (
        <div className="rounded-xl md:rounded-2xl mb-2 md:mb-3 overflow-hidden" style={{ background: 'rgba(8,11,24,0.95)', border: '1px solid rgba(212,175,55,0.1)' }}>
          <div className="px-2 md:px-3 py-1.5 md:py-2 flex items-center gap-1.5 md:gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Zap className="w-2.5 md:w-3 h-2.5 md:h-3 text-[#D4AF37] flex-shrink-0" />
            <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Tip Feed
            </span>
          </div>
          <div className="divide-y divide-white/5 max-h-24 md:max-h-32 overflow-y-auto">
            {tipFeed.map((t) => (
              <motion.div key={t.id}
                initial={{ opacity: 0, x: t.side === 'creator' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 px-2 md:px-3 py-1">
                <span className="text-xs md:text-sm flex-shrink-0">{t.emoji}</span>
                <span className="text-[11px] md:text-[10px] text-white/60 flex-1 truncate">{t.name}</span>
                <span className="text-[11px] font-black flex-shrink-0" style={{ color: t.side === 'creator' ? '#D4AF37' : '#ef4444' }}>
                  +{t.pts}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── GIFT BUTTONS ─────────────────────────────────────────────── */}
      {isActive && (
        <div className="grid grid-cols-2 gap-1.5 md:gap-2 mb-2 md:mb-3">
          {/* Creator gifts */}
          <div className="rounded-xl md:rounded-2xl p-2 md:p-3" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <p className="text-[7px] md:text-[11px] font-black uppercase text-center mb-1.5 md:mb-2 truncate"
              style={{ color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
              {battle.creator_name}
            </p>
            <div className="grid grid-cols-3 gap-0.5 md:gap-1">
              {GIFTS.slice(0, 3).map(g => (
                <motion.button key={g.pts} whileTap={{ scale: 0.88 }}
                  onClick={() => sendGift('creator', g)}
                  className="flex flex-col items-center py-1.5 md:py-2 rounded-lg md:rounded-xl"
                  style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}>
                  <span className="text-sm md:text-base">{g.emoji}</span>
                  <span className="text-[7px] md:text-[11px] font-black" style={{ color: '#D4AF37' }}>+{g.pts}</span>
                </motion.button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-0.5 md:gap-1 mt-0.5 md:mt-1">
              {GIFTS.slice(3, 6).map(g => (
                <motion.button key={g.pts} whileTap={{ scale: 0.88 }}
                  onClick={() => sendGift('creator', g)}
                  className="flex flex-col items-center py-1.5 md:py-2 rounded-lg md:rounded-xl"
                  style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}>
                  <span className="text-sm md:text-base">{g.emoji}</span>
                  <span className="text-[7px] md:text-[11px] font-black" style={{ color: '#D4AF37' }}>+{g.pts}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Challenger gifts */}
          <div className="rounded-xl md:rounded-2xl p-2 md:p-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-[7px] md:text-[11px] font-black uppercase text-center mb-1.5 md:mb-2 truncate"
              style={{ color: '#ef4444', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
              {battle.challenger_name || 'Challenger'}
            </p>
            <div className="grid grid-cols-3 gap-0.5 md:gap-1">
              {GIFTS.slice(0, 3).map(g => (
                <motion.button key={g.pts} whileTap={{ scale: 0.88 }}
                  onClick={() => sendGift('challenger', g)}
                  className="flex flex-col items-center py-1.5 md:py-2 rounded-lg md:rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <span className="text-sm md:text-base">{g.emoji}</span>
                  <span className="text-[7px] md:text-[11px] font-black" style={{ color: '#ef4444' }}>+{g.pts}</span>
                </motion.button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-0.5 md:gap-1 mt-0.5 md:mt-1">
              {GIFTS.slice(3, 6).map(g => (
                <motion.button key={g.pts} whileTap={{ scale: 0.88 }}
                  onClick={() => sendGift('challenger', g)}
                  className="flex flex-col items-center py-1.5 md:py-2 rounded-lg md:rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <span className="text-sm md:text-base">{g.emoji}</span>
                  <span className="text-[7px] md:text-[11px] font-black" style={{ color: '#ef4444' }}>+{g.pts}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK EMOJI REACTIONS ────────────────────────────────────── */}
      {isActive && (
        <div className="rounded-xl md:rounded-2xl p-2 md:p-3 mb-0.5 md:mb-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[7px] md:text-[11px] font-black uppercase text-center mb-1.5 md:mb-2"
            style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
            React
          </p>
          <div className="flex gap-1 md:gap-1.5 flex-wrap justify-center">
            {QUICK_EMOJIS.map(e => (
              <motion.button key={e} whileTap={{ scale: 1.6 }}
                onClick={() => {
                  const id = ++floatIdRef.current;
                  const x = `${20 + Math.random() * 60}%`;
                  setFloatingItems(p => [...p, { id, emoji: e, pts: 0, x, big: false }]);
                  setTimeout(() => removeFloat(id), 1600);
                }}
                className="text-lg md:text-xl w-8 md:w-9 h-8 md:h-9 flex items-center justify-center rounded-lg md:rounded-xl hover:bg-white/10 transition-all">
                {e}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}