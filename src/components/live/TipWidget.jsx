import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Zap, Flame, CreditCard, ChevronDown, ChevronUp, Users, Trophy } from 'lucide-react';
import { toast } from 'sonner';

const G      = '#D4AF37';
const CRIMSON= '#800020';
const PINK   = '#C0392B';
const BG     = '#080B18';
const T      = { fontFamily: 'Barlow Condensed, sans-serif' };

const TIERS = [
  { amount: 1,   label: 'Bronze',   color: '#CD7F32', icon: '🪙', glow: 'rgba(205,127,50,0.4)',  pts: 10 },
  { amount: 5,   label: 'Silver',   color: '#C0C0C0', icon: '⭐', glow: 'rgba(192,192,192,0.4)', pts: 50 },
  { amount: 15,  label: 'Gold',     color: G,         icon: '💛', glow: 'rgba(212,175,55,0.5)',  pts: 150 },
  { amount: 50,  label: 'Platinum', color: '#D4AF37', icon: '💎', glow: 'rgba(212,175,55,0.5)',   pts: 500 },
  { amount: 100, label: 'Diamond',  color: PINK,      icon: '👑', glow: 'rgba(255,21,100,0.6)',  pts: 1000 },
  { amount: 200, label: 'Legend',   color: '#a78bfa', icon: '🌠', glow: 'rgba(167,139,250,0.6)', pts: 2000 },
  { amount: 500, label: 'Elite',    color: '#ff6b35', icon: '⚡', glow: 'rgba(255,107,53,0.7)',  pts: 5000 },
];

const RAIN_AMOUNT = 10;

const PAYMENT_METHODS = [
  { id: 'card',    label: 'Card',    icon: '💳' },
  { id: 'cashapp', label: 'CashApp', icon: '💚' },
  { id: 'paypal',  label: 'PayPal',  icon: '🅿️' },
  { id: 'venmo',   label: 'Venmo',   icon: '🔵' },
  { id: 'zelle',   label: 'Zelle',   icon: '💜' },
  { id: 'seegems', label: 'SeeGems', icon: '💎' },
];

const QUICK_EMOJIS = ['🔥', '💯', '❤️', '🚀', '👑', '💎', '🎉', '🤑', '🙌', '😍', '💸', '✨'];

// Haptic: single short pulse — no-ops on unsupported devices
function haptic(ms) { if (navigator.vibrate) navigator.vibrate(ms || 10); };

const CONFETTI_COLORS = [G, CRIMSON, PINK, '#D4AF37', '#a78bfa', '#ff6b35', '#22c55e'];

function Particle({ x, color, delay }) {
  const angle = Math.random() * 360;
  const dist  = 80 + Math.random() * 160;
  const tx = Math.cos((angle * Math.PI) / 180) * dist;
  const ty = Math.sin((angle * Math.PI) / 180) * dist - 60;
  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
      animate={{ opacity: 0, x: tx, y: ty, scale: 0, rotate: angle * 2 }}
      transition={{ duration: 1.4, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute', left: x, top: '50%',
        width: 9, height: 9, borderRadius: Math.random() > 0.5 ? '50%' : 2,
        background: color, pointerEvents: 'none',
      }}
    />
  );
}

function ConfettiBurst({ active }) {
  if (!active) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 10 }}>
      {Array.from({ length: 36 }).map((_, i) => (
        <Particle
          key={i}
          x={`${10 + Math.random() * 80}%`}
          color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
          delay={i * 0.03}
        />
      ))}
    </div>
  );
}

function RainDrop({ index }) {
  const left = 5 + Math.random() * 90;
  const delay = index * 0.08;
  return (
    <motion.div
      initial={{ opacity: 1, y: -30, x: 0 }}
      animate={{ opacity: 0, y: 140, x: (Math.random() - 0.5) * 40 }}
      transition={{ duration: 1.2, delay, ease: 'easeIn' }}
      style={{ position: 'absolute', left: `${left}%`, top: 0, fontSize: 22, pointerEvents: 'none' }}
    >
      💸
    </motion.div>
  );
}

function GiftRainBurst({ active }) {
  if (!active) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 10 }}>
      {Array.from({ length: 18 }).map((_, i) => <RainDrop key={i} index={i} />)}
    </div>
  );
}

function TipAnimation({ senderName, amount, emoji, isRain, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, isRain ? 3200 : 3800);
    return () => clearTimeout(t);
  }, []);

  const activeTier = TIERS.slice().reverse().find(t => t.amount <= amount) || TIERS[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)' }}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at center, ${activeTier.glow} 0%, transparent 65%)`,
      }} />

      {isRain ? (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {Array.from({ length: 30 }).map((_, i) => <RainDrop key={i} index={i} />)}
        </div>
      ) : (
        <>
          <motion.div
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 2.8, opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: `3px solid ${activeTier.color}` }}
          />
          <motion.div
            initial={{ scale: 0.5, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeOut', delay: 0.2 }}
            style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: `1px solid ${activeTier.color}60` }}
          />
        </>
      )}

      <motion.div
        initial={{ scale: 0.3, rotate: -15, y: 40 }}
        animate={{ scale: 1.15, rotate: 0, y: 0 }}
        transition={{ type: 'spring', bounce: 0.6, duration: 0.7 }}
        className="text-8xl mb-4 select-none"
      >
        {isRain ? '🌧️' : (emoji || activeTier.icon)}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center px-6">
        <p className="text-3xl font-black uppercase mb-1"
          style={{ ...T, color: activeTier.color, textShadow: `0 0 32px ${activeTier.glow}` }}>
          {isRain ? `${senderName} made it rain!` : `${senderName} tipped $${amount}!`}
        </p>
        <motion.div
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase mt-2"
          style={{ background: `${activeTier.color}15`, border: `1px solid ${activeTier.color}40`, color: activeTier.color, ...T }}
        >
          {isRain ? '🌧 Gift Rain +100 pts' : `${activeTier.icon} ${activeTier.label} Tier · +${activeTier.pts} pts`}
        </motion.div>
      </motion.div>

      {['💸', '✨', '🎉'].map((e, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: (i - 1) * 70, y: 20, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: -90, scale: [0, 1.4, 1.2, 0] }}
          transition={{ delay: 0.6 + i * 0.2, duration: 1.5 }}
          style={{ position: 'absolute', fontSize: 36, top: '58%' }}
        >
          {e}
        </motion.div>
      ))}
    </motion.div>
  );
}

function StatBadge({ label, value, icon }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="text-sm">{icon}</span>
      <div>
        <p className="text-[11px] font-black leading-none" style={{ color: G, ...T }}>{value}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{label}</p>
      </div>
    </div>
  );
}

export default function TipWidget({ roomId, hostId, currentUser }) {
  const [open, setOpen]               = useState(false);
  const [selected, setSelected]       = useState(15);
  const [custom, setCustom]           = useState('');
  const [useCustom, setUseCustom]     = useState(false);
  const [message, setMessage]         = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [payMethod, setPayMethod]     = useState('card');
  const [animating, setAnimating]     = useState(null);
  const [confetti, setConfetti]       = useState(false);
  const [rainBurst, setRainBurst]     = useState(false);
  const [tipStreak, setTipStreak]     = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const sessionTipCount = useRef(0);

  const rawAmount   = useCustom ? parseFloat(custom) : selected;
  const validAmount = rawAmount > 0 && !isNaN(rawAmount);
  const creatorAmt  = validAmount ? (rawAmount * 0.9).toFixed(2) : '0.00';
  const platformFee = validAmount ? (rawAmount * 0.1).toFixed(2) : '0.00';
  const activeTier  = TIERS.slice().reverse().find(t => t.amount <= rawAmount) || TIERS[0];
  const ptsPreview  = validAmount ? Math.floor(rawAmount * 10) : 0;

  // Session stats: count + total for this room
  const { data: sessionStats } = useQuery({
    queryKey: ['tip-session-stats', roomId],
    queryFn: async () => {
      if (!roomId) return { count: 0, total: 0 };
      const txns = await base44.entities.Transaction.filter({ room_id: roomId, type: 'tip' });
      const total = txns.reduce((s, t) => s + (t.amount || 0), 0);
      return { count: txns.length, total: total.toFixed(0) };
    },
    refetchInterval: 15000,
    enabled: open,
  });

  // Top 3 tippers this session
  const { data: topTippers = [] } = useQuery({
    queryKey: ['tip-leaderboard', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const txns = await base44.entities.Transaction.filter({ room_id: roomId, type: 'tip' });
      const map = {};
      txns.forEach(t => {
        const key = t.sender_name || t.sender_id || 'Viewer';
        map[key] = (map[key] || 0) + (t.amount || 0);
      });
      return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, total]) => ({ name, total }));
    },
    refetchInterval: 15000,
    enabled: open && showLeaderboard,
  });

  const doSendTip = useMutation({
    mutationFn: async (amt) => {
      await base44.entities.Transaction.create({
        room_id: roomId,
        type: 'tip',
        amount: amt,
        creator_amount: parseFloat((amt * 0.9).toFixed(2)),
        platform_fee: parseFloat((amt * 0.1).toFixed(2)),
        from_user_id: currentUser?.id,
        sender_id: currentUser?.id,
        sender_name: currentUser?.full_name || currentUser?.email || 'Viewer',
        to_user_id: hostId,
        status: 'completed',
        message: message,
        emoji: selectedEmoji,
        payment_method: payMethod,
        loyalty_points_earned: Math.floor(amt * 10),
      });
    },
    onSuccess: (_, amt) => {
      const name = (currentUser?.full_name || currentUser?.email || 'Viewer').split(' ')[0];
      sessionTipCount.current += 1;
      setTipStreak(sessionTipCount.current);
      setAnimating({ name, amount: amt, emoji: selectedEmoji, isRain: false });
      setOpen(false);
      setMessage('');
      setCustom('');
      setUseCustom(false);
      setSelected(15);
      setSelectedEmoji(null);
    },
    onError: () => toast.error('Could not send tip'),
  });

  const doRain = useMutation({
    mutationFn: async () => {
      await base44.entities.Transaction.create({
        room_id: roomId,
        type: 'tip',
        amount: RAIN_AMOUNT,
        creator_amount: parseFloat((RAIN_AMOUNT * 0.9).toFixed(2)),
        platform_fee: parseFloat((RAIN_AMOUNT * 0.1).toFixed(2)),
        from_user_id: currentUser?.id,
        sender_id: currentUser?.id,
        sender_name: currentUser?.full_name || currentUser?.email || 'Viewer',
        to_user_id: hostId,
        status: 'completed',
        message: '🌧️ Gift Rain!',
        payment_method: payMethod,
        tip_type: 'rain',
        loyalty_points_earned: 100,
      });
    },
    onSuccess: () => {
      const name = (currentUser?.full_name || currentUser?.email || 'Viewer').split(' ')[0];
      sessionTipCount.current += 1;
      setTipStreak(sessionTipCount.current);
      setAnimating({ name, amount: RAIN_AMOUNT, emoji: null, isRain: true });
      setOpen(false);
    },
    onError: () => toast.error('Could not send gift rain'),
  });

  const TIER_ROWS = [TIERS.slice(0, 4), TIERS.slice(4)];

  return (
    <>
      <AnimatePresence>
        {animating && (
          <TipAnimation
            senderName={animating.name}
            amount={animating.amount}
            emoji={animating.emoji}
            isRain={animating.isRain}
            onDone={() => setAnimating(null)}
          />
        )}
      </AnimatePresence>

      {/* Tip Button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-[10px] relative"
        title="Send a tip"
        style={{ ...T, background: `linear-gradient(90deg, ${CRIMSON}30, ${G}25)`, color: G, border: `1px solid ${G}40` }}
      >
        💸 Tip
        {tipStreak >= 2 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 px-1 rounded-full text-[8px] font-black"
            style={{ background: PINK, color: '#fff', ...T }}>
            🔥{tipStreak}
          </span>
        )}
      </motion.button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.78)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
              style={{ background: BG, border: `1px solid ${G}20`, maxHeight: '92vh', overflowY: 'auto', overscrollBehavior: 'contain' }}
            >
              {/* Glow bar */}
              <div style={{
                height: 4, borderRadius: '4px 4px 0 0',
                background: validAmount
                  ? `linear-gradient(90deg, ${CRIMSON}, ${activeTier.color}, ${PINK})`
                  : `linear-gradient(90deg, ${CRIMSON}, ${G})`,
                transition: 'background 0.4s',
              }} />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${G})` }}>
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-black uppercase text-sm leading-none" style={{ ...T, color: G }}>
                      Send a Tip
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
                      90% goes directly to the creator
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tipStreak >= 2 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
                      style={{ background: `${PINK}20`, border: `1px solid ${PINK}40` }}>
                      <Flame className="w-3 h-3" style={{ color: PINK }} />
                      <span className="text-[10px] font-black" style={{ color: PINK, ...T }}>
                        {tipStreak}x streak
                      </span>
                    </div>
                  )}
                  <button onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  </button>
                </div>
              </div>

              {/* Session Stats */}
              {sessionStats && sessionStats.count > 0 && (
                <div className="flex items-center gap-2 px-5 pt-3">
                  <StatBadge icon="👥" label="tippers" value={sessionStats.count} />
                  <StatBadge icon="💰" label="total tipped" value={`$${sessionStats.total}`} />
                  {topTippers.length > 0 && (
                    <StatBadge icon="🏆" label="top tipper" value={topTippers[0]?.name?.split(' ')[0] || '—'} />
                  )}
                </div>
              )}

              <div className="px-5 py-4 space-y-5 relative">
                <ConfettiBurst active={confetti} />
                <GiftRainBurst active={rainBurst} />

                {/* Gift Rain Button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { haptic(); doRain.mutate(); }}
                  disabled={doRain.isPending}
                  className="w-full py-2.5 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest transition-all disabled:opacity-40"
                  style={{
                    ...T,
                    background: `linear-gradient(90deg, rgba(0,150,255,0.15), rgba(212,175,55,0.15))`,
                    border: '1px solid rgba(212,175,55,0.35)',
                    color: '#D4AF37',
                  }}
                >
                  🌧️ {doRain.isPending ? 'Raining…' : `Gift Rain — $${RAIN_AMOUNT} · +100 pts`}
                </motion.button>

                {/* Tier grid */}
                <div>
                  <p className="text-[11px] uppercase font-black tracking-widest mb-2.5"
                    style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>Tip Amount</p>

                  {/* Row 1: $1–$50 */}
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {TIERS.slice(0, 4).map(tier => {
                      const active = !useCustom && selected === tier.amount;
                      return (
                        <motion.button
                          key={tier.amount} whileTap={{ scale: 0.88 }}
                          onClick={() => { haptic(); setSelected(tier.amount); setUseCustom(false); }}
                          className="flex flex-col items-center py-2.5 rounded-xl transition-all"
                          style={{
                            background: active ? `${tier.color}18` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${active ? tier.color + '60' : 'rgba(255,255,255,0.08)'}`,
                            boxShadow: active ? `0 0 18px ${tier.glow}` : 'none',
                          }}
                        >
                          <span className="text-lg mb-0.5">{tier.icon}</span>
                          <span className="text-[11px] font-black" style={{ ...T, color: active ? tier.color : 'rgba(255,255,255,0.5)' }}>${tier.amount}</span>
                          <span className="text-[10px] font-black uppercase" style={{ ...T, color: active ? tier.color + 'bb' : 'rgba(255,255,255,0.2)' }}>{tier.label}</span>
                          <span className="text-[9px] mt-0.5" style={{ color: active ? tier.color + '90' : 'rgba(255,255,255,0.15)', ...T }}>+{tier.pts}pts</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Row 2: $100–$500 */}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {TIERS.slice(4).map(tier => {
                      const active = !useCustom && selected === tier.amount;
                      return (
                        <motion.button
                          key={tier.amount} whileTap={{ scale: 0.88 }}
                          onClick={() => { haptic(); setSelected(tier.amount); setUseCustom(false); }}
                          className="flex flex-col items-center py-2.5 rounded-xl transition-all"
                          style={{
                            background: active ? `${tier.color}18` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${active ? tier.color + '60' : 'rgba(255,255,255,0.08)'}`,
                            boxShadow: active ? `0 0 22px ${tier.glow}` : 'none',
                          }}
                        >
                          <span className="text-xl mb-0.5">{tier.icon}</span>
                          <span className="text-[12px] font-black" style={{ ...T, color: active ? tier.color : 'rgba(255,255,255,0.5)' }}>${tier.amount}</span>
                          <span className="text-[10px] font-black uppercase" style={{ ...T, color: active ? tier.color + 'bb' : 'rgba(255,255,255,0.2)' }}>{tier.label}</span>
                          <span className="text-[9px] mt-0.5" style={{ color: active ? tier.color + '90' : 'rgba(255,255,255,0.15)', ...T }}>+{tier.pts}pts</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Custom amount */}
                  <button
                    onClick={() => setUseCustom(true)}
                    className="mt-1 w-full py-2 rounded-xl text-xs font-black uppercase transition-all"
                    style={{
                      ...T,
                      background: useCustom ? `${G}12` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${useCustom ? G + '40' : 'rgba(255,255,255,0.08)'}`,
                      color: useCustom ? G : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    + Custom Amount
                  </button>

                  <AnimatePresence>
                    {useCustom && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-2 relative overflow-hidden"
                      >
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-sm z-10" style={{ color: G, ...T }}>$</span>
                        <input
                          type="number" min="1" step="1"
                          value={custom} onChange={e => setCustom(e.target.value)}
                          placeholder="Enter amount"
                          autoFocus
                          className="w-full rounded-xl pl-7 pr-4 py-2.5 text-sm font-bold outline-none"
                          style={{ background: 'rgba(17,8,34,0.9)', border: `1px solid ${G}30`, color: '#fff', ...T }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Payment Methods */}
                <div>
                  <p className="text-[11px] uppercase font-black tracking-widest mb-2"
                    style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>
                    <CreditCard className="inline w-3 h-3 mr-1" />
                    Payment Method
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map(m => (
                      <motion.button
                        key={m.id} whileTap={{ scale: 0.92 }}
                        onClick={() => setPayMethod(m.id)}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black uppercase transition-all"
                        style={{
                          ...T,
                          background: payMethod === m.id ? `${G}15` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${payMethod === m.id ? G + '50' : 'rgba(255,255,255,0.08)'}`,
                          color: payMethod === m.id ? G : 'rgba(255,255,255,0.45)',
                        }}
                      >
                        <span>{m.icon}</span> {m.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Emoji Reactions */}
                <div>
                  <p className="text-[11px] uppercase font-black tracking-widest mb-2"
                    style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>
                    React <span style={{ color: 'rgba(255,255,255,0.18)' }}>(optional)</span>
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {QUICK_EMOJIS.map(e => (
                      <motion.button
                        key={e} whileTap={{ scale: 0.8 }}
                        onClick={() => setSelectedEmoji(selectedEmoji === e ? null : e)}
                        className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all"
                        style={{
                          background: selectedEmoji === e ? `${G}20` : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${selectedEmoji === e ? G + '50' : 'rgba(255,255,255,0.08)'}`,
                          boxShadow: selectedEmoji === e ? `0 0 10px ${G}40` : 'none',
                        }}
                      >
                        {e}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Split Breakdown */}
                <AnimatePresence>
                  {validAmount && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      className="rounded-xl px-4 py-3"
                      style={{ background: `${activeTier.color}08`, border: `1px solid ${activeTier.color}25` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase" style={{ ...T, color: activeTier.color }}>
                          {activeTier.icon} {activeTier.label} Tier
                        </span>
                        <span className="text-[10px] font-black uppercase" style={{ ...T, color: activeTier.color + '80' }}>
                          +{ptsPreview} loyalty pts
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase" style={{ ...T, color: 'rgba(255,255,255,0.4)' }}>Creator (90%)</span>
                        <span className="font-black text-sm" style={{ color: G, ...T }}>${creatorAmt}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase" style={{ ...T, color: 'rgba(255,255,255,0.25)' }}>Platform (10%)</span>
                        <span className="font-black text-sm" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>${platformFee}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message */}
                <div>
                  <p className="text-[11px] uppercase font-black tracking-widest mb-2"
                    style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>
                    Message <span style={{ color: 'rgba(255,255,255,0.15)' }}>(optional)</span>
                  </p>
                  <textarea
                    maxLength={140} value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Say something nice…"
                    rows={2}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
                    style={{ background: 'rgba(17,8,34,0.85)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', ...T }}
                  />
                  <p className="text-right text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>
                    {message.length}/140
                  </p>
                </div>

                {/* Leaderboard toggle */}
                <button
                  onClick={() => setShowLeaderboard(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5" style={{ color: G }} />
                    <span className="text-[11px] font-black uppercase" style={{ ...T, color: 'rgba(255,255,255,0.45)' }}>
                      Session Leaderboard
                    </span>
                  </div>
                  {showLeaderboard ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                </button>

                <AnimatePresence>
                  {showLeaderboard && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      {topTippers.length === 0 && (
                        <p className="text-center text-[11px] py-3" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
                          No tips yet — be the first! 🎉
                        </p>
                      )}
                      {topTippers.map((tipper, idx) => (
                        <div key={tipper.name} className="flex items-center justify-between px-4 py-2 rounded-xl"
                          style={{ background: idx === 0 ? `${G}0a` : 'rgba(255,255,255,0.03)', border: `1px solid ${idx === 0 ? G + '25' : 'rgba(255,255,255,0.06)'}` }}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                            <span className="text-[12px] font-black" style={{ ...T, color: idx === 0 ? G : 'rgba(255,255,255,0.6)' }}>
                              {tipper.name.split(' ')[0]}
                            </span>
                          </div>
                          <span className="font-black text-[12px]" style={{ color: idx === 0 ? G : 'rgba(255,255,255,0.5)', ...T }}>
                            ${tipper.total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Send Button */}
                <motion.button
                  disabled={!validAmount || doSendTip.isPending}
                  onClick={() => { haptic(20); doSendTip.mutate(rawAmount); }}
                  whileTap={validAmount ? { scale: 0.97 } : {}}
                  className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all disabled:opacity-40"
                  style={{
                    ...T,
                    background: validAmount
                      ? `linear-gradient(90deg, ${CRIMSON}, ${activeTier.color})`
                      : 'rgba(128,0,32,0.25)',
                    color: '#fff',
                    letterSpacing: '0.1em',
                    boxShadow: validAmount ? `0 4px 28px ${activeTier.glow}` : 'none',
                  }}
                >
                  {doSendTip.isPending
                    ? '⏳ Sending…'
                    : `${selectedEmoji || '💸'} Send ${validAmount ? `$${rawAmount}` : 'Tip'}`}
                </motion.button>

                <div className="pb-4" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
