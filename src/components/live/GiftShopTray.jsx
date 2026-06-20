import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Gift, X, Trophy, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const BURGUNDY = '#800020';
const CREAM = '#F5E6D3';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const RARITY = {
  common:    { color: 'rgba(255,255,255,0.5)', label: 'COMMON',    glow: '' },
  rare:      { color: '#D4AF37',               label: 'RARE',      glow: '0 0 12px rgba(212,175,55,0.3)' },
  epic:      { color: '#D4AF37',               label: 'EPIC',      glow: '0 0 12px rgba(212,175,55,0.3)' },
  legendary: { color: GOLD,                    label: 'LEGENDARY', glow: `0 0 20px rgba(212,175,55,0.4)` },
};

const GIFT_CATEGORIES = ['All','Hearts','Celebration','Appreciation','Humor','Special'];

function FullScreenAnimation({ gift, senderName, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ scale: 0.3, rotate: -20 }} animate={{ scale: [0.3, 1.3, 1], rotate: ['-20deg', '5deg', '0deg'] }}
        transition={{ duration: 0.7, times: [0, 0.6, 1] }}>
        <div className="text-[80px] leading-none">{gift.animation_url || gift.name?.charAt(0) || '🎁'}</div>
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="mt-4 font-black uppercase text-xl"
        style={{ color: GOLD, fontFamily: 'Orbitron, monospace', textShadow: `0 0 20px ${GOLD}60` }}>
        {senderName || 'Someone'} sent a {gift.name}!
      </motion.p>
      {/* Confetti */}
      {[...Array(12)].map((_, i) => (
        <motion.div key={i}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: (Math.random() - 0.5) * 300, y: -200 - Math.random() * 200, opacity: 0, rotate: Math.random() * 360 }}
          transition={{ duration: 1.5 + Math.random(), delay: 0.2 + Math.random() * 0.5 }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ background: [GOLD, BURGUNDY, '#6DBF7E', '#C0392B'][i % 4] }} />
      ))}
    </motion.div>
  );
}

function GiftCard({ gift, onSend, sending }) {
  const r = RARITY[gift.rarity] || RARITY.common;
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={() => onSend(gift)} disabled={sending}
      className="flex flex-col items-center p-3 rounded-xl relative overflow-hidden"
      style={{ background: '#1A1A1A', border: `1px solid ${r.color}30`, boxShadow: r.glow }}>
      {gift.is_limited && (
        <span className="absolute top-1 left-1 text-[6px] font-black uppercase px-1 rounded"
          style={{ background: BURGUNDY, color: GOLD, ...T }}>LIMITED</span>
      )}
      <div className="text-3xl leading-none my-1">{gift.animation_url || '🎁'}</div>
      <p className="text-[11px] font-bold text-center leading-tight mt-1" style={{ color: CREAM + '80' }}>{gift.name}</p>
      <p className="font-black text-[10px] mt-0.5" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{gift.price}</p>
      <span className="text-[6px] font-black uppercase px-1 py-0.5 rounded mt-1"
        style={{ background: `${r.color}15`, color: r.color, ...T }}>{r.label}</span>
    </motion.button>
  );
}

function GiftLeaderboard({ roomId }) {
  const { data: txns = [] } = useQuery({
    queryKey: ['gift-lb', roomId],
    queryFn: () => base44.entities.Transaction.filter({ room_id: roomId, transaction_type: 'direct_support' }, '-created_date', 50),
    enabled: !!roomId,
    refetchInterval: 10000,
  });

  const senders = Object.entries(
    txns.reduce((acc, t) => {
      const k = t.sender_name || t.sender_id || 'Anonymous';
      acc[k] = (acc[k] || 0) + (t.creator_payout || 0) + (t.platform_cut || 0);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (senders.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-black uppercase" style={{ color: CREAM + '35', ...T }}>Top Gifters</p>
      {senders.map(([name, total], i) => (
        <div key={name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-sm shrink-0">{i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}</span>
          <span className="flex-1 text-[11px]" style={{ color: CREAM + '70' }}>{name}</span>
          <span className="font-black text-[10px]" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>${total.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function GiftShopTray({ roomId, currentUser }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('All');
  const [anim, setAnim] = useState(null);
  const qc = useQueryClient();

  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => base44.entities.Room.get(roomId),
    enabled: !!roomId,
    staleTime: 60000,
  });
  const recipientId = room?.host_id;

  const { data: gifts = [] } = useQuery({
    queryKey: ['gifts-active'],
    queryFn: () => base44.entities.AnimatedGift.filter({ is_active: true }, 'price', 30),
    staleTime: 60000,
  });

  const sendMut = useMutation({
    mutationFn: async (gift) => {
      await base44.entities.Transaction.create({
        room_id: roomId,
        sender_id: currentUser?.id,
        recipient_id: recipientId,
        transaction_type: 'direct_support',
        creator_payout: Math.floor(gift.price * 90) / 100,
        platform_cut: gift.price - Math.floor(gift.price * 90) / 100,
        status: 'completed',
        processed_at: new Date().toISOString(),
      });
      await base44.entities.AnimatedGift.update(gift.id, {
        times_sent: (gift.times_sent || 0) + 1,
      }).catch(() => {});
    },
    onSuccess: (_, gift) => {
      qc.invalidateQueries(['gift-lb', roomId]);
      setAnim({ gift, sender: currentUser?.full_name || 'Someone' });
      setOpen(false);
      if (currentUser?.id) {
        base44.entities.Activity.create({
          user_id: currentUser.id,
          type: 'gift_sent',
          title: `Sent ${gift.name || 'gift'}`,
          amount: gift.price,
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Could not send gift'),
  });

  const filtered = gifts.filter(g => category === 'All' || g.category === category.toLowerCase());

  return (
    <>
      <AnimatePresence>
        {anim && <FullScreenAnimation gift={anim.gift} senderName={anim.sender} onDone={() => setAnim(null)} />}
      </AnimatePresence>

      {/* Button */}
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-[10px]"
        style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}25`, color: GOLD, ...T }}>
        <Gift className="w-3.5 h-3.5" /> Gift
      </button>

      {/* Tray */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl"
              style={{ background: '#1A1A1A', border: `1px solid rgba(212,175,55,0.2)`, maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="sticky top-0 z-10" style={{ background: '#1A1A1A' }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4" style={{ color: GOLD }} />
                    <span className="font-black uppercase text-sm" style={{ color: GOLD, ...T }}>Gift Shop</span>
                  </div>
                  <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-white/40" /></button>
                </div>
                {/* Category filter */}
                <div className="flex gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide">
                  {GIFT_CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c)}
                      className="px-3 py-1 rounded-full text-[11px] font-black uppercase shrink-0"
                      style={{ background: category === c ? GOLD : 'rgba(255,255,255,0.07)', color: category === c ? '#000' : CREAM + '50', ...T }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {filtered.map(g => (
                    <GiftCard key={g.id} gift={g}
                      onSend={() => sendMut.mutate(g)}
                      sending={sendMut.isPending} />
                  ))}
                  {filtered.length === 0 && (
                    <p className="col-span-4 text-center py-6 text-[10px]" style={{ color: CREAM + '25' }}>
                      No gifts available in this category
                    </p>
                  )}
                </div>
                <GiftLeaderboard roomId={roomId} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}