import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';

const GOLD = '#D4AF37';
const BURGUNDY = '#800020';

const REACTIONS = [
  { emoji: '🎲', category: 'domino',   animation: 'burst' },
  { emoji: '🔥', category: 'hype',     animation: 'float_up' },
  { emoji: '❤️', category: 'love',     animation: 'pulse' },
  { emoji: '😂', category: 'lol',      animation: 'spin' },
  { emoji: '😮', category: 'wow',      animation: 'rain' },
  { emoji: '😡', category: 'rage',     animation: 'shake' },
  { emoji: '⭐', category: 'standard', animation: 'float_up' },
  { emoji: '💎', category: 'superchat', animation: 'burst', premium: true },
];

function getAnimation(style) {
  switch (style) {
    case 'burst':    return { y: [-10, -120], scale: [0.5, 1.4, 0.8], rotate: [0, 20, -20, 0], opacity: [1, 1, 0] };
    case 'rain':     return { y: [0, -150], x: [0, Math.random() * 40 - 20], opacity: [1, 1, 0] };
    case 'shake':    return { y: [0, -80], x: [0, -8, 8, -8, 8, 0], opacity: [1, 1, 0] };
    case 'spin':     return { y: [0, -100], rotate: [0, 360, 720], opacity: [1, 1, 0] };
    case 'pulse':    return { y: [0, -90], scale: [1, 1.5, 1, 1.5, 0.8], opacity: [1, 1, 0] };
    default:         return { y: [0, -120], opacity: [1, 1, 0] };
  }
}

function FloatingEmoji({ id, emoji, x, animation, onDone }) {
  return (
    <motion.div
      className="absolute bottom-12 pointer-events-none text-2xl z-50 select-none"
      style={{ left: `${x * 100}%` }}
      animate={getAnimation(animation)}
      transition={{ duration: 1.8, ease: 'easeOut' }}
      onAnimationComplete={onDone}>
      {emoji}
    </motion.div>
  );
}

function ComboOverlay({ text }) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: [0.5, 1.3, 1], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.5 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
      <div className="px-4 py-2 rounded-xl font-black text-2xl uppercase tracking-widest"
        style={{ background: 'rgba(212,175,55,0.9)', color: '#000', boxShadow: '0 0 30px rgba(212,175,55,0.6)' }}>
        {text}
      </div>
    </motion.div>
  );
}

function SuperChatModal({ emoji, currentUser, partyId, onClose, onSent }) {
  const [msg, setMsg] = useState('');
  const [amount, setAmount] = useState('');

  const mut = useMutation({
    mutationFn: () => base44.entities.PartyReaction.create({
      party_id: partyId,
      user_id: currentUser.id,
      user_name: currentUser.full_name || currentUser.email,
      emoji,
      reaction_category: 'superchat',
      animation_style: 'burst',
      is_premium: true,
      tip_amount: Math.round(parseFloat(amount || 0) * 100),
      message: msg.trim(),
      screen_x: Math.random(),
    }),
    onSuccess: (r) => { onSent(r); onClose(); },
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-xs rounded-xl p-5 space-y-3"
        style={{ background: '#2A1F1F', border: `1px solid rgba(212,175,55,0.35)` }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-black uppercase text-sm" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: GOLD }}>
            💎 Super Reaction
          </h3>
          <button onClick={onClose}><X className="w-4 h-4 text-white/40" /></button>
        </div>
        <p className="text-4xl text-center">{emoji}</p>
        <input placeholder="Message (optional)" value={msg} onChange={e => setMsg(e.target.value)}
          style={{ width: '100%', height: 32, padding: '0 10px', fontSize: 11, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }} />
        <div className="flex items-center gap-1">
          <span className="text-white/50 text-sm">$</span>
          <input placeholder="Tip amount (optional)" type="number" value={amount} onChange={e => setAmount(e.target.value)}
            style={{ flex: 1, height: 32, padding: '0 10px', fontSize: 11, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button
          style={{ width: '100%', height: 36, fontSize: 11, fontWeight: 900, background: GOLD, color: '#000', border: 'none', borderRadius: 6, cursor: mut.isPending ? 'default' : 'pointer', opacity: mut.isPending ? 0.7 : 1, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase' }}
          onClick={() => mut.mutate()} disabled={mut.isPending}>
          {mut.isPending ? 'Sending…' : '💎 Send Super Reaction'}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function PartyReactionsOverlay({ partyId, currentUser, currentTime }) {
  const [floaters, setFloaters] = useState([]);
  const [combo, setCombo] = useState(null);
  const [showSuperchat, setShowSuperchat] = useState(false);
  const [recentReactions, setRecentReactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Click tracking for combos
  const clickTracker = useRef({}); // { category: [timestamp, ...] }

  // Subscribe to real-time reactions
  useEffect(() => {
    if (!partyId) return;
    const unsub = base44.entities.PartyReaction.subscribe((event) => {
      if (event.type !== 'create') return;
      const r = event.data;
      if (r?.party_id !== partyId) return;
      setTotalCount(c => c + 1);
      setRecentReactions(prev => [r, ...prev].slice(0, 5));
      // Spawn floater for others' reactions
      if (r.user_id !== currentUser?.id) {
        spawnFloater(r.emoji, r.screen_x ?? Math.random(), r.animation_style || 'float_up');
      }
    });
    return unsub;
  }, [partyId, currentUser?.id]);

  const spawnFloater = useCallback((emoji, x, animation) => {
    const id = `f_${Date.now()}_${Math.random()}`;
    setFloaters(prev => [...prev, { id, emoji, x, animation }]);
  }, []);

  const removeFloater = useCallback((id) => {
    setFloaters(prev => prev.filter(f => f.id !== id));
  }, []);

  const reactMut = useMutation({
    mutationFn: ({ emoji, category, animation, is_premium, message, tip_amount }) =>
      base44.entities.PartyReaction.create({
        party_id: partyId,
        user_id: currentUser.id,
        user_name: currentUser.full_name || currentUser.email,
        emoji,
        reaction_category: category,
        animation_style: animation,
        is_premium: is_premium || false,
        tip_amount: tip_amount || 0,
        message: message || '',
        screen_x: Math.random(),
        context_timestamp: currentTime || 0,
        combo_count: 1,
      }),
    onSuccess: (r, vars) => {
      spawnFloater(vars.emoji, Math.random(), vars.animation);
      setTotalCount(c => c + 1);
      setRecentReactions(prev => [r, ...prev].slice(0, 5));
    },
  });

  const handleClick = (r) => {
    if (!currentUser) return;
    if (r.premium) { setShowSuperchat(true); return; }

    // Combo detection
    const now = Date.now();
    const tracker = clickTracker.current;
    if (!tracker[r.category]) tracker[r.category] = [];
    tracker[r.category] = tracker[r.category].filter(t => now - t < 2000);
    tracker[r.category].push(now);
    const count = tracker[r.category].length;

    if (count >= 3) {
      setCombo(`${r.emoji} x${count} COMBO!`);
      setTimeout(() => setCombo(null), 1600);
    }

    reactMut.mutate({ emoji: r.emoji, category: r.category, animation: r.animation });
  };

  return (
    <div className="relative">
      {/* Floaters container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 40 }}>
        <AnimatePresence>
          {floaters.map(f => (
            <FloatingEmoji key={f.id} {...f} onDone={() => removeFloater(f.id)} />
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {combo && <ComboOverlay text={combo} />}
        </AnimatePresence>
      </div>

      {/* Reaction bar */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: '#1A1A1A', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
        <div className="flex items-center gap-1">
          {REACTIONS.map(r => (
            <motion.button
              key={r.category}
              whileTap={{ scale: 0.75 }}
              onClick={() => handleClick(r)}
              className="text-xl rounded-lg p-1.5 transition-all"
              style={{
                background: r.premium ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
                border: r.premium ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.08)',
              }}>
              {r.emoji}
            </motion.button>
          ))}
        </div>
        {/* Total count HUD */}
        <div className="flex items-center gap-1 px-2 py-1 rounded"
          style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <span className="text-[9px] font-black" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {totalCount.toLocaleString()} reactions
          </span>
        </div>
      </div>

      {/* Recent reactions feed */}
      {recentReactions.length > 0 && (
        <div className="absolute right-2 top-[-120px] w-36 space-y-1 pointer-events-none" style={{ zIndex: 30 }}>
          <AnimatePresence>
            {recentReactions.map((r, i) => (
              <motion.div key={r.id || i}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                style={{ background: r.is_premium ? 'rgba(212,175,55,0.15)' : 'rgba(0,0,0,0.7)', border: r.is_premium ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-sm">{r.emoji}</span>
                <div className="min-w-0">
                  <p className="text-[8px] font-bold text-white/60 truncate">{r.user_name}</p>
                  {r.message && <p className="text-[8px] text-white/40 truncate">{r.message}</p>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showSuperchat && (
          <SuperChatModal
            emoji="💎"
            currentUser={currentUser}
            partyId={partyId}
            onClose={() => setShowSuperchat(false)}
            onSent={(r) => {
              spawnFloater('💎', Math.random(), 'burst');
              setTotalCount(c => c + 1);
              setRecentReactions(prev => [r, ...prev].slice(0, 5));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}