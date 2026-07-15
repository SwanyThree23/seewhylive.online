import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Zap, Heart, Star, Crown, Diamond } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const CRIMSON = '#800020';
const PINK = '#C0392B';
const BG = '#080B18';
const BG2 = 'rgba(8,11,24,0.97)';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TIERS = [
  { amount: 1,   label: 'Bronze', color: '#CD7F32', icon: '🪙', glow: 'rgba(205,127,50,0.4)' },
  { amount: 5,   label: 'Silver', color: '#C0C0C0', icon: '⭐', glow: 'rgba(192,192,192,0.4)' },
  { amount: 15,  label: 'Gold',   color: G,         icon: '💛', glow: 'rgba(212,175,55,0.5)' },
  { amount: 50,  label: 'Plat',   color: '#D4AF37', icon: '💎', glow: 'rgba(212,175,55,0.5)' },
  { amount: 100, label: 'Diam',   color: PINK,      icon: '👑', glow: 'rgba(192,57,43,0.6)' },
];

const QUICK_EMOJIS = ['🔥', '💯', '❤️', '🚀', '👑', '💎', '🎉', '🤑'];

const CONFETTI_COLORS = [G, CRIMSON, PINK, '#D4AF37', '#D4AF37', '#6DBF7E'];

function Particle({ x, color, delay }) {
  const angle = Math.random() * 360;
  const dist = 80 + Math.random() * 120;
  const tx = Math.cos((angle * Math.PI) / 180) * dist;
  const ty = Math.sin((angle * Math.PI) / 180) * dist - 60;
  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
      animate={{ opacity: 0, x: tx, y: ty, scale: 0, rotate: angle * 2 }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute', left: x, top: '50%',
        width: 8, height: 8, borderRadius: Math.random() > 0.5 ? '50%' : 2,
        background: color, pointerEvents: 'none',
      }}
    />
  );
}

function ConfettiBurst({ active }) {
  if (!active) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 10 }}>
      {Array.from({ length: 24 }).map((_, i) => (
        <Particle
          key={i}
          x={`${20 + Math.random() * 60}%`}
          color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
          delay={i * 0.04}
        />
      ))}
    </div>
  );
}

function TipAnimation({ senderName, amount, emoji, tier, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3800);
    return () => clearTimeout(t);
  }, []);

  const tierInfo = TIERS.find(t => t.amount <= amount) || TIERS[0];
  const activeTier = TIERS.slice().reverse().find(t => t.amount <= amount) || TIERS[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)' }}
    >
      {/* Radial glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at center, ${activeTier.glow} 0%, transparent 65%)`,
      }} />

      {/* Ring pulse */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0.8 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        style={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          border: `3px solid ${activeTier.color}`,
        }}
      />

      <motion.div
        initial={{ scale: 0.3, rotate: -15, y: 40 }}
        animate={{ scale: 1.15, rotate: 0, y: 0 }}
        transition={{ type: 'spring', bounce: 0.6, duration: 0.7 }}
        className="text-8xl mb-4 select-none relative"
      >
        {emoji || activeTier.icon}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center px-6"
      >
        <p className="text-3xl font-black uppercase mb-1"
          style={{ ...T, color: activeTier.color, textShadow: `0 0 32px ${activeTier.glow}` }}>
          {senderName} tipped ${amount}!
        </p>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase mt-2"
          style={{ background: `${activeTier.color}15`, border: `1px solid ${activeTier.color}40`, color: activeTier.color, ...T }}
        >
          {activeTier.icon} {activeTier.label} Tier
        </motion.div>
      </motion.div>

      {/* Floating emojis */}
      {['💸', '✨', '🎉'].map((e, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: (i - 1) * 60, y: 20, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: -80, scale: [0, 1.4, 1.2, 0] }}
          transition={{ delay: 0.6 + i * 0.2, duration: 1.5 }}
          style={{ position: 'absolute', fontSize: 32, top: '55%' }}
        >
          {e}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function TipWidget({ roomId, hostId, recipient, currentUser }) {
  const resolvedHostId = hostId || recipient?.id;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(5);
  const [custom, setCustom] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [animating, setAnimating] = useState(null);
  const [confetti, setConfetti] = useState(false);

  const rawAmount = useCustom ? parseFloat(custom) : selected;
  const validAmount = rawAmount > 0 && !isNaN(rawAmount);
  const creatorReceives = validAmount ? (Math.floor(rawAmount * 90) / 100).toFixed(2) : '0.00';
  const platformFee = validAmount ? (rawAmount - Math.floor(rawAmount * 90) / 100).toFixed(2) : '0.00';

  const activeTier = TIERS.slice().reverse().find(t => t.amount <= rawAmount) || TIERS[0];

  const sendTip = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) throw new Error('Not authenticated');
      const amt = rawAmount;
      await base44.entities.Transaction.create({
        room_id: roomId,
        transaction_type: 'direct_support',
        creator_payout: Math.floor(amt * 90) / 100,
        platform_fee: amt - Math.floor(amt * 90) / 100,
        sender_id: currentUser.id,
        sender_name: currentUser.full_name || currentUser.email,
        recipient_id: resolvedHostId,
        status: 'completed',
        message: message,
        emoji: selectedEmoji,
      });
    },
    onSuccess: () => {
      navigator.vibrate?.([50, 30, 80]);
      const name = (currentUser.full_name || currentUser.email || 'Viewer').split(' ')[0];
      setAnimating({ name, amount: rawAmount, emoji: selectedEmoji });
      setOpen(false);
      setMessage('');
      setCustom('');
      setUseCustom(false);
      setSelected(5);
      setSelectedEmoji(null);
      Promise.allSettled([
        base44.entities.Activity.create({
          user_id: currentUser.id,
          type: 'tip_sent',
          title: `Tipped $${rawAmount} to creator`,
          amount: rawAmount,
          recipient_id: hostId,
        }),
        hostId && base44.entities.Activity.create({
          user_id: hostId,
          type: 'tip_received',
          title: `Received $${rawAmount} tip from ${name}`,
          amount: rawAmount,
          sender_id: currentUser.id,
        }),
      ]);
    },
    onError: () => toast.error('Could not send tip'),
  });

  return (
    <>
      <AnimatePresence>
        {animating && (
          <TipAnimation
            senderName={animating.name}
            amount={animating.amount}
            emoji={animating.emoji}
            onDone={() => setAnimating(null)}
          />
        )}
      </AnimatePresence>

      {/* Tip Button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-[10px]"
        title="Send a tip"
        style={{
          ...T,
          background: `linear-gradient(90deg, ${CRIMSON}22, ${G}22)`,
          color: G,
          border: `1px solid ${G}40`,
        }}
      >
        💸 Tip
      </motion.button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.72)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
              style={{ background: BG, border: `1px solid ${G}20`, maxHeight: '88vh', overflowY: 'auto' }}
            >
              {/* Glow bar */}
              <div style={{
                height: 3, borderRadius: '3px 3px 0 0',
                background: validAmount
                  ? `linear-gradient(90deg, ${CRIMSON}, ${activeTier.color}, ${PINK})`
                  : `linear-gradient(90deg, ${CRIMSON}, ${G})`,
                transition: 'background 0.4s',
              }} />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${G})` }}>
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-black uppercase text-sm leading-none"
                      style={{ ...T, color: G }}>Send a Tip</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Support the creator</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-5 relative">
                <ConfettiBurst active={confetti} />

                {/* Tier chips */}
                <div>
                  <p className="text-[11px] uppercase font-black tracking-widest mb-2.5"
                    style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>Tip Amount</p>
                  <div className="grid grid-cols-5 gap-2">
                    {TIERS.map(tier => {
                      const active = !useCustom && selected === tier.amount;
                      return (
                        <motion.button
                          key={tier.amount}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { setSelected(tier.amount); setUseCustom(false); }}
                          className="flex flex-col items-center py-2.5 rounded-xl transition-all"
                          style={{
                            background: active ? `${tier.color}18` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${active ? tier.color + '60' : 'rgba(255,255,255,0.08)'}`,
                            boxShadow: active ? `0 0 16px ${tier.glow}` : 'none',
                          }}
                        >
                          <span className="text-lg mb-0.5">{tier.icon}</span>
                          <span className="text-[10px] font-black" style={{ ...T, color: active ? tier.color : 'rgba(255,255,255,0.5)' }}>${tier.amount}</span>
                          <span className="text-[11px] font-black uppercase" style={{ ...T, color: active ? tier.color + 'cc' : 'rgba(255,255,255,0.25)' }}>{tier.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Custom amount */}
                  <button
                    onClick={() => setUseCustom(true)}
                    className="mt-2 w-full py-2 rounded-xl text-xs font-black uppercase transition-all"
                    style={{
                      ...T,
                      background: useCustom ? `${G}12` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${useCustom ? G + '40' : 'rgba(255,255,255,0.08)'}`,
                      color: useCustom ? G : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    Custom Amount
                  </button>

                  <AnimatePresence>
                    {useCustom && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 relative overflow-hidden"
                      >
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-sm z-10"
                          style={{ color: G, ...T }}>$</span>
                        <input
                          type="number" min="1" step="1"
                          value={custom} onChange={e => setCustom(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full rounded-xl pl-7 pr-4 py-2.5 text-sm font-bold outline-none"
                          style={{ background: 'rgba(8,11,24,0.9)', border: `1px solid ${G}30`, color: '#fff', ...T }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Emoji Reactions */}
                <div>
                  <p className="text-[11px] uppercase font-black tracking-widest mb-2"
                    style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>React with Emoji <span style={{ color: 'rgba(255,255,255,0.2)' }}>(optional)</span></p>
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
                      style={{ background: `${activeTier.color}08`, border: `1px solid ${activeTier.color}20` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{activeTier.icon}</span>
                        <span className="text-[10px] font-black uppercase" style={{ ...T, color: activeTier.color }}>
                          {activeTier.label} Tier Tip
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase" style={{ ...T, color: 'rgba(255,255,255,0.4)' }}>Creator (90%)</span>
                        <span className="font-black text-sm" style={{ color: G, ...T }}>${creatorReceives}</span>
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
                    placeholder="Say something nice..."
                    rows={2}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
                    style={{ background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', ...T }}
                  />
                  <p className="text-right text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>
                    {message.length}/140
                  </p>
                </div>

                {/* Send Button */}
                <motion.button
                  disabled={!validAmount || sendTip.isPending}
                  onClick={() => sendTip.mutate()}
                  whileTap={validAmount ? { scale: 0.97 } : {}}
                  className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all disabled:opacity-40"
                  style={{
                    ...T,
                    background: validAmount
                      ? `linear-gradient(90deg, ${CRIMSON}, ${activeTier.color})`
                      : 'rgba(128,0,32,0.25)',
                    color: '#fff',
                    letterSpacing: '0.1em',
                    boxShadow: validAmount ? `0 4px 24px ${activeTier.glow}` : 'none',
                  }}
                >
                  {sendTip.isPending
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
