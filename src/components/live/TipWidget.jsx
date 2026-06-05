import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// ── Palette (zero forbidden colors) ───────────────────────────────────────────
const C = {
  bg:      '#07050A',
  bg2:     '#0E0C09',
  bg3:     'rgba(255,255,255,0.04)',
  bg4:     'rgba(255,255,255,0.02)',
  gold:    '#D4AF37',
  goldD:   '#C9A84C',
  amber:   '#D4854A',
  crimson: '#800020',
  crimsonD:'#8B1A2F',
  bronze:  '#CD7F32',
  scarlet: '#C0392B',
  text:    '#F0E8D4',
  textM:   'rgba(240,232,212,0.55)',
  textD:   'rgba(240,232,212,0.28)',
  slate:   'rgba(255,255,255,0.08)',
  slate2:  'rgba(255,255,255,0.05)',
};
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

// ── Tip tiers ──────────────────────────────────────────────────────────────────
const TIERS = [
  { amount: 1,   label: 'Spark',   icon: '✨', color: '#CD7F32', glow: 'rgba(205,127,50,0.35)',  desc: 'Quick love'     },
  { amount: 5,   label: 'Blaze',   icon: '🔥', color: '#D4854A', glow: 'rgba(212,133,74,0.40)',  desc: '1 shoutout'     },
  { amount: 15,  label: 'Gold',    icon: '⭐', color: '#D4AF37', glow: 'rgba(212,175,55,0.50)',  desc: 'Top chat'       },
  { amount: 50,  label: 'Crimson', icon: '💢', color: '#C0392B', glow: 'rgba(192,57,43,0.50)',   desc: 'Pinned msg'     },
  { amount: 100, label: 'Legend',  icon: '👑', color: '#C9A84C', glow: 'rgba(201,168,76,0.60)',  desc: 'Hall of fame'   },
];

const EMOJIS = ['🔥','💯','❤️','🚀','👑','💎','🎉','🤑','💪','✨','👏','🙌'];
const PAYMENT_METHODS = ['Card', 'CashApp', 'PayPal', 'Venmo', 'SeeGems'];
const PARTICLE_COLORS = ['#D4AF37','#800020','#D4854A','#CD7F32','#F0E8D4','#C0392B'];

function getActiveTier(amount) {
  return TIERS.slice().reverse().find(t => t.amount <= amount) || TIERS[0];
}

// ── Particle burst ─────────────────────────────────────────────────────────────
function Particle({ color, delay }) {
  const angle = Math.random() * 360;
  const dist  = 90 + Math.random() * 150;
  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      animate={{ opacity: 0, x: Math.cos(angle * Math.PI / 180) * dist, y: Math.sin(angle * Math.PI / 180) * dist - 70, scale: 0 }}
      transition={{ duration: 1.3, delay, ease: 'easeOut' }}
      style={{ position: 'absolute', left: `${18 + Math.random() * 64}%`, top: '50%', width: 8, height: 8, borderRadius: Math.random() > 0.5 ? '50%' : 3, background: color, pointerEvents: 'none' }}
    />
  );
}

function ParticleBurst({ active }) {
  if (!active) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 8 }}>
      {Array.from({ length: 36 }).map((_, i) => (
        <Particle key={i} color={PARTICLE_COLORS[i % PARTICLE_COLORS.length]} delay={i * 0.025} />
      ))}
    </div>
  );
}

// ── Full-screen celebration ────────────────────────────────────────────────────
function TipCelebration({ name, amount, emoji, tier, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4400);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(22px)' }}
    >
      {/* Radial glow backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${tier.glow} 0%, transparent 62%)`, pointerEvents: 'none' }} />

      {/* Expanding rings */}
      {[0, 0.25, 0.5].map((delay, i) => (
        <motion.div key={i}
          initial={{ scale: 0.4, opacity: 0.8 - i * 0.2 }}
          animate={{ scale: 2.8 - i * 0.3, opacity: 0 }}
          transition={{ duration: 1.8 + i * 0.2, ease: 'easeOut', delay }}
          style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', border: `${3 - i}px solid ${tier.color}${i === 0 ? '' : '60'}` }}
        />
      ))}

      {/* Main icon */}
      <motion.div
        initial={{ scale: 0.15, rotate: -25, y: 80 }}
        animate={{ scale: 1.25, rotate: 0, y: 0 }}
        transition={{ type: 'spring', bounce: 0.6, duration: 0.9 }}
        style={{ fontSize: 92, marginBottom: 22, userSelect: 'none', position: 'relative', zIndex: 2, filter: `drop-shadow(0 0 24px ${tier.glow})` }}
      >
        {emoji || tier.icon}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        style={{ textAlign: 'center', zIndex: 2, padding: '0 28px' }}
      >
        <p style={{ ...T, fontSize: 40, fontWeight: 900, color: tier.color, textTransform: 'uppercase', textShadow: `0 0 48px ${tier.glow}`, letterSpacing: '0.04em', lineHeight: 1.1, marginBottom: 10 }}>
          {name} tipped ${amount}!
        </p>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.58, type: 'spring' }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 24, background: `${tier.color}18`, border: `1px solid ${tier.color}55`, color: tier.color, ...T, fontSize: 15, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          {tier.icon} {tier.label} Tier
        </motion.div>
      </motion.div>

      {/* Floating emoji burst */}
      {['💸','✨','🎊','💰','🔥'].map((e, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: (i - 2) * 52, y: 36, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: -110, scale: [0, 1.6, 1.3, 0] }}
          transition={{ delay: 0.75 + i * 0.16, duration: 1.7 }}
          style={{ position: 'absolute', fontSize: 36, top: '62%', zIndex: 2 }}
        >
          {e}
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── Session leaderboard ────────────────────────────────────────────────────────
function SessionLeaderboard({ roomId }) {
  const { data: txns = [], isLoading } = useQuery({
    queryKey: ['tip-leaders', roomId],
    queryFn: () => base44.entities.Transaction.filter({ room_id: roomId, type: 'tip' }, '-created_date', 150),
    refetchInterval: 15000,
    enabled: !!roomId,
  });

  const { leaders, sessionTotal } = useMemo(() => {
    const map = {};
    txns.forEach(t => {
      const name = t.sender_name || 'Anonymous';
      map[name] = (map[name] || 0) + (t.amount || 0);
    });
    const leaders = Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    const sessionTotal = txns.reduce((s, t) => s + (t.amount || 0), 0);
    return { leaders, sessionTotal };
  }, [txns]);

  const MEDALS = ['🥇', '🥈', '🥉', '4', '5'];
  const RANK_COLORS = [C.gold, C.textM, C.bronze, C.textD, C.textD];

  if (isLoading) return (
    <div style={{ padding: 32, textAlign: 'center', color: C.textD, ...T, fontSize: 13 }}>Loading…</div>
  );

  if (leaders.length === 0) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
      <p style={{ ...T, fontSize: 14, color: C.textM, fontWeight: 700 }}>No tips yet this session</p>
      <p style={{ ...T, fontSize: 12, color: C.textD, marginTop: 4 }}>Be the first to support the creator!</p>
    </div>
  );

  return (
    <div style={{ padding: '0 0 8px' }}>
      {/* Session total */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: `${C.gold}0A`, borderRadius: 12, marginBottom: 12, border: `1px solid ${C.gold}22` }}>
        <div>
          <p style={{ ...T, fontSize: 10, color: C.textD, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Session Total</p>
          <p style={{ ...T, fontSize: 28, fontWeight: 900, color: C.gold, lineHeight: 1 }}>${sessionTotal.toFixed(2)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ ...T, fontSize: 10, color: C.textD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Creator Earned</p>
          <p style={{ ...T, fontSize: 22, fontWeight: 900, color: C.amber }}>${Math.floor(sessionTotal * 90) / 100}</p>
        </div>
      </div>

      {/* Leaderboard rows */}
      <p style={{ ...T, fontSize: 10, color: C.textD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Top Supporters</p>
      {leaders.map((l, i) => (
        <motion.div
          key={l.name}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 6, background: i === 0 ? `${C.gold}0C` : C.bg3, border: `1px solid ${i === 0 ? C.gold + '25' : C.slate}` }}
        >
          <span style={{ fontSize: i < 3 ? 20 : 13, minWidth: 24, textAlign: 'center' }}>{MEDALS[i]}</span>
          <span style={{ flex: 1, ...T, fontSize: 14, fontWeight: 700, color: i === 0 ? C.text : C.textM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
          <span style={{ ...T, fontSize: 16, fontWeight: 900, color: RANK_COLORS[i] }}>${l.total.toFixed(0)}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ── Exported: TipGoalBar ───────────────────────────────────────────────────────
// Drop this into stream room headers to show the creator's session goal
export function TipGoalBar({ roomId, goal = 0 }) {
  const { data: txns = [] } = useQuery({
    queryKey: ['tip-goal', roomId],
    queryFn: () => base44.entities.Transaction.filter({ room_id: roomId, type: 'tip' }, '-created_date', 200),
    refetchInterval: 8000,
    enabled: !!roomId && goal > 0,
  });

  const total    = txns.reduce((s, t) => s + (t.amount || 0), 0);
  const pct      = goal > 0 ? Math.min((total / goal) * 100, 100) : 0;
  const reached  = pct >= 100;

  if (!goal) return null;

  return (
    <div style={{ padding: '9px 14px', background: `${C.gold}09`, borderRadius: 10, border: `1px solid ${reached ? C.gold + '55' : C.gold + '20'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ ...T, fontSize: 10, fontWeight: 900, color: C.textD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          🎯 Session Goal
        </span>
        <span style={{ ...T, fontSize: 12, fontWeight: 900, color: reached ? C.gold : C.textM }}>
          ${total.toFixed(0)} / ${goal}
        </span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: C.slate, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 4, background: reached ? `linear-gradient(90deg, ${C.gold}, #fff8a0)` : `linear-gradient(90deg, ${C.crimson}, ${C.gold})` }}
        />
      </div>
      {reached && (
        <p style={{ ...T, fontSize: 10, color: C.gold, fontWeight: 700, marginTop: 5, textAlign: 'center' }}>
          🎉 Goal reached! Incredible support!
        </p>
      )}
    </div>
  );
}

// ── Main TipWidget ─────────────────────────────────────────────────────────────
export default function TipWidget({ roomId, hostId, currentUser, goalAmount = 0 }) {
  const [open,          setOpen]          = useState(false);
  const [view,          setView]          = useState('tip');    // 'tip' | 'leaders'
  const [selected,      setSelected]      = useState(5);
  const [custom,        setCustom]        = useState('');
  const [useCustom,     setUseCustom]     = useState(false);
  const [message,       setMessage]       = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [anonymous,     setAnonymous]     = useState(false);
  const [superTip,      setSuperTip]      = useState(false);
  const [payMethod,     setPayMethod]     = useState('Card');
  const [animating,     setAnimating]     = useState(null);
  const [burst,         setBurst]         = useState(false);
  const [tipCount,      setTipCount]      = useState(0);

  const baseAmount  = useCustom ? (parseFloat(custom) || 0) : selected;
  const superCost   = superTip ? 5 : 0;
  const totalAmount = baseAmount + superCost;
  const validAmount = totalAmount > 0;
  // Math.floor on all money per security contract
  const creatorEarns = Math.floor(totalAmount * 0.9 * 100) / 100;
  const platformFee  = Math.floor(totalAmount * 0.1 * 100) / 100;
  const tier         = getActiveTier(baseAmount);
  const senderName   = anonymous ? 'A Viewer' : (currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Viewer');

  const sendTip = useMutation({
    mutationFn: async () => {
      await base44.entities.Transaction.create({
        room_id:        roomId,
        type:           'tip',
        amount:         totalAmount,
        creator_amount: creatorEarns,
        platform_fee:   platformFee,
        from_user_id:   anonymous ? null : currentUser?.id,
        sender_id:      anonymous ? null : currentUser?.id,
        sender_name:    senderName,
        to_user_id:     hostId,
        status:         'completed',
        message:        message,
        emoji:          selectedEmoji,
        is_super_tip:   superTip,
        payment_method: payMethod,
      });
    },
    onSuccess: () => {
      setBurst(true);
      setTimeout(() => setBurst(false), 1500);
      setAnimating({ name: senderName.split(' ')[0], amount: totalAmount, emoji: selectedEmoji, tier });
      setTipCount(n => n + 1);
      setOpen(false);
      setMessage('');
      setCustom('');
      setUseCustom(false);
      setSelected(5);
      setSelectedEmoji(null);
      setSuperTip(false);
    },
    onError: () => toast.error('Could not send tip. Please try again.'),
  });

  return (
    <>
      {/* Full-screen celebration */}
      <AnimatePresence>
        {animating && (
          <TipCelebration
            name={animating.name}
            amount={animating.amount}
            emoji={animating.emoji}
            tier={animating.tier}
            onDone={() => setAnimating(null)}
          />
        )}
      </AnimatePresence>

      {/* Trigger button */}
      <motion.button
        whileTap={{ scale: 0.91 }}
        onClick={() => setOpen(true)}
        title="Send a tip"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 12, background: `linear-gradient(90deg, ${C.crimson}22, ${C.gold}1E)`, border: `1px solid ${C.gold}42`, color: C.gold, cursor: 'pointer', ...T, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}
      >
        💸 Tip
        {tipCount > 0 && (
          <span style={{ background: C.gold, color: C.bg, borderRadius: 8, padding: '1px 6px', fontSize: 10, fontWeight: 900 }}>
            {tipCount}
          </span>
        )}
      </motion.button>

      {/* Bottom sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.78)' }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90, borderRadius: '24px 24px 0 0', background: C.bg2, border: `1px solid ${C.gold}1E`, maxHeight: '93vh', overflowY: 'auto' }}
            >
              {/* Animated top stripe */}
              <div style={{ height: 4, borderRadius: '4px 4px 0 0', background: validAmount ? `linear-gradient(90deg, ${C.crimson}, ${tier.color}, ${C.gold})` : `linear-gradient(90deg, ${C.crimson}55, ${C.gold}55)`, transition: 'background 0.4s' }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${C.slate}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${C.crimson}, ${C.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    💸
                  </div>
                  <div>
                    <p style={{ ...T, fontSize: 17, fontWeight: 900, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Support Creator</p>
                    <p style={{ ...T, fontSize: 11, color: C.textM, marginTop: 2 }}>90% goes directly to them</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* View tabs */}
                  <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.slate}` }}>
                    {[['tip','💸 Send'], ['leaders','🏆 Top']].map(([v, label]) => (
                      <button key={v} onClick={() => setView(v)} style={{ padding: '6px 12px', background: view === v ? `${C.gold}1E` : 'transparent', color: view === v ? C.gold : C.textM, border: 'none', cursor: 'pointer', ...T, fontSize: 11, fontWeight: 900 }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: C.bg3, border: 'none', cursor: 'pointer', color: C.textM, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                  </button>
                </div>
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
                <ParticleBurst active={burst} />

                {/* ── Leaders view ── */}
                {view === 'leaders' && <SessionLeaderboard roomId={roomId} />}

                {/* ── Tip view ── */}
                {view === 'tip' && (
                  <>
                    {/* Goal bar */}
                    {goalAmount > 0 && <TipGoalBar roomId={roomId} goal={goalAmount} />}

                    {/* Tier grid */}
                    <div>
                      <p style={{ ...T, fontSize: 10, fontWeight: 900, color: C.textD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Choose Amount</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                        {TIERS.map(t => {
                          const active = !useCustom && selected === t.amount;
                          return (
                            <motion.button
                              key={t.amount}
                              whileTap={{ scale: 0.86 }}
                              onClick={() => { setSelected(t.amount); setUseCustom(false); }}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', borderRadius: 12, cursor: 'pointer', background: active ? `${t.color}18` : C.bg3, border: `1.5px solid ${active ? t.color + '70' : C.slate}`, boxShadow: active ? `0 0 20px ${t.glow}` : 'none', transition: 'all 0.15s' }}
                            >
                              <span style={{ fontSize: 20, marginBottom: 2 }}>{t.icon}</span>
                              <span style={{ ...T, fontSize: 13, fontWeight: 900, color: active ? t.color : C.textM }}>${t.amount}</span>
                              <span style={{ ...T, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: active ? t.color + 'cc' : C.textD }}>{t.label}</span>
                              <span style={{ ...T, fontSize: 9, color: active ? t.color + '88' : 'rgba(255,255,255,0.15)', marginTop: 2 }}>{t.desc}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom amount */}
                    <button
                      onClick={() => setUseCustom(v => !v)}
                      style={{ width: '100%', padding: '9px', borderRadius: 10, cursor: 'pointer', background: useCustom ? `${C.gold}12` : C.bg3, border: `1px solid ${useCustom ? C.gold + '50' : C.slate}`, color: useCustom ? C.gold : C.textM, ...T, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                    >
                      ✏️ Custom Amount
                    </button>
                    <AnimatePresence>
                      {useCustom && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ position: 'relative', overflow: 'hidden' }}>
                          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.gold, fontWeight: 900, fontSize: 15, zIndex: 1, ...T }}>$</span>
                          <input
                            type="number" min="1" step="1"
                            value={custom} onChange={e => setCustom(e.target.value)}
                            placeholder="Enter any amount"
                            style={{ width: '100%', paddingLeft: 28, paddingRight: 16, paddingTop: 11, paddingBottom: 11, borderRadius: 10, background: '#0D080B', border: `1px solid ${C.gold}35`, color: C.text, ...T, fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Boost options */}
                    <div>
                      <p style={{ ...T, fontSize: 10, fontWeight: 900, color: C.textD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Boost Options</p>
                      <div style={{ display: 'flex', gap: 8 }}>

                        {/* Super Tip */}
                        <button
                          onClick={() => setSuperTip(v => !v)}
                          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '11px 8px', borderRadius: 12, cursor: 'pointer', background: superTip ? `${C.gold}15` : C.bg3, border: `1px solid ${superTip ? C.gold + '55' : C.slate}`, transition: 'all 0.15s' }}
                        >
                          <span style={{ fontSize: 20, marginBottom: 3 }}>📌</span>
                          <span style={{ ...T, fontSize: 10, fontWeight: 900, color: superTip ? C.gold : C.textM, textTransform: 'uppercase' }}>Super Tip</span>
                          <span style={{ ...T, fontSize: 9, color: superTip ? C.amber : C.textD, marginTop: 1 }}>+$5 · Pin 60s</span>
                        </button>

                        {/* Anonymous */}
                        <button
                          onClick={() => setAnonymous(v => !v)}
                          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '11px 8px', borderRadius: 12, cursor: 'pointer', background: anonymous ? 'rgba(255,255,255,0.06)' : C.bg3, border: `1px solid ${anonymous ? 'rgba(255,255,255,0.22)' : C.slate}`, transition: 'all 0.15s' }}
                        >
                          <span style={{ fontSize: 20, marginBottom: 3 }}>{anonymous ? '🙈' : '👁'}</span>
                          <span style={{ ...T, fontSize: 10, fontWeight: 900, color: anonymous ? C.text : C.textM, textTransform: 'uppercase' }}>Anonymous</span>
                          <span style={{ ...T, fontSize: 9, color: C.textD, marginTop: 1 }}>{anonymous ? 'Hidden' : 'Show name'}</span>
                        </button>

                        {/* Rapid 5x ($5 = 5 × $1) quick-fire */}
                        <button
                          onClick={() => { setSelected(1); setUseCustom(false); setSuperTip(false); }}
                          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '11px 8px', borderRadius: 12, cursor: 'pointer', background: C.bg3, border: `1px solid ${C.slate}`, transition: 'all 0.15s' }}
                        >
                          <span style={{ fontSize: 20, marginBottom: 3 }}>⚡</span>
                          <span style={{ ...T, fontSize: 10, fontWeight: 900, color: C.textM, textTransform: 'uppercase' }}>Spark</span>
                          <span style={{ ...T, fontSize: 9, color: C.textD, marginTop: 1 }}>Quick $1</span>
                        </button>
                      </div>
                    </div>

                    {/* Emoji reaction row */}
                    <div>
                      <p style={{ ...T, fontSize: 10, fontWeight: 900, color: C.textD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                        Reaction <span style={{ color: 'rgba(255,255,255,0.15)', fontWeight: 400, textTransform: 'none' }}>optional</span>
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {EMOJIS.map(e => (
                          <motion.button
                            key={e} whileTap={{ scale: 0.72 }}
                            onClick={() => setSelectedEmoji(selectedEmoji === e ? null : e)}
                            style={{ width: 38, height: 38, borderRadius: 10, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: selectedEmoji === e ? `${C.gold}22` : C.bg3, border: `1px solid ${selectedEmoji === e ? C.gold + '55' : C.slate}`, boxShadow: selectedEmoji === e ? `0 0 12px ${C.gold}40` : 'none' }}
                          >
                            {e}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <p style={{ ...T, fontSize: 10, fontWeight: 900, color: C.textD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                        Message
                        <span style={{ color: 'rgba(255,255,255,0.15)', fontWeight: 400, textTransform: 'none', marginLeft: 6 }}>optional</span>
                        {superTip && <span style={{ color: C.gold, fontWeight: 700, marginLeft: 8 }}>📌 Will be pinned on stream</span>}
                      </p>
                      <textarea
                        maxLength={140} rows={2} value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder={superTip ? 'Your message will be pinned on the stream for 60 seconds...' : 'Say something nice to the creator...'}
                        style={{ width: '100%', borderRadius: 10, padding: '10px 14px', background: '#0D080B', border: `1px solid ${superTip ? C.gold + '40' : C.slate}`, color: C.text, ...T, fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
                      />
                      <p style={{ ...T, fontSize: 10, color: C.textD, textAlign: 'right', marginTop: 2 }}>{message.length}/140</p>
                    </div>

                    {/* Split visualization */}
                    <AnimatePresence>
                      {validAmount && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                          style={{ borderRadius: 12, padding: '13px 15px', background: `${tier.color}0A`, border: `1px solid ${tier.color}28` }}
                        >
                          {/* Animated split bar */}
                          <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 11 }}>
                            <motion.div
                              initial={{ width: '0%' }}
                              animate={{ width: '90%' }}
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                              style={{ height: '100%', background: `linear-gradient(90deg, ${C.crimson}, ${tier.color})`, borderRadius: '4px 0 0 4px' }}
                            />
                            <div style={{ flex: 1, background: C.slate, borderRadius: '0 4px 4px 0' }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                              <span style={{ ...T, fontSize: 9, color: C.textD, textTransform: 'uppercase' }}>Creator gets</span>
                              <span style={{ ...T, fontSize: 22, fontWeight: 900, color: C.gold }}>${creatorEarns.toFixed(2)}</span>
                              <span style={{ ...T, fontSize: 9, color: C.textD }}>(90%)</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ ...T, fontSize: 9, color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase' }}>Platform</div>
                              <div style={{ ...T, fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.25)' }}>${platformFee.toFixed(2)}</div>
                            </div>
                          </div>
                          {superTip && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.slate}`, ...T, fontSize: 10, color: C.amber, fontWeight: 600 }}>
                              📌 +$5 Super Tip included — your message pinned on stream for 60 seconds
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Payment method */}
                    <div>
                      <p style={{ ...T, fontSize: 10, fontWeight: 900, color: C.textD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Pay With</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {PAYMENT_METHODS.map(m => (
                          <button key={m} onClick={() => setPayMethod(m)} style={{ padding: '6px 13px', borderRadius: 8, cursor: 'pointer', background: payMethod === m ? `${C.gold}18` : C.bg3, border: `1px solid ${payMethod === m ? C.gold + '45' : C.slate}`, color: payMethod === m ? C.gold : C.textM, ...T, fontSize: 11, fontWeight: 700 }}>
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Send button */}
                    <motion.button
                      disabled={!validAmount || sendTip.isPending}
                      onClick={() => sendTip.mutate()}
                      whileTap={validAmount ? { scale: 0.96 } : {}}
                      style={{ width: '100%', padding: '17px', borderRadius: 16, background: validAmount ? `linear-gradient(90deg, ${C.crimson}, ${tier.color})` : 'rgba(128,0,32,0.18)', border: 'none', cursor: validAmount ? 'pointer' : 'not-allowed', color: '#fff', ...T, fontSize: 17, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: validAmount ? `0 4px 32px ${tier.glow}` : 'none', opacity: !validAmount ? 0.42 : 1, transition: 'all 0.2s' }}
                    >
                      {sendTip.isPending
                        ? '⏳ Sending…'
                        : `${selectedEmoji || '💸'} Send $${validAmount ? totalAmount.toFixed(0) : '?'} Tip`}
                    </motion.button>

                    <div style={{ paddingBottom: 10 }} />
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
