import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Gift, X, Trophy } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const B = '#800020';
const OB2 = '#1A1A1A';
const CREAM = '#F5E6D3';

const RARITY_STYLE = {
  common:    { color: 'rgba(255,255,255,0.4)', label: 'COMMON',    shimmer: false },
  rare:      { color: '#4FC3F7',              label: 'RARE',      shimmer: false },
  epic:      { color: '#CE93D8',              label: 'EPIC',      shimmer: false },
  legendary: { color: G,                      label: 'LEGENDARY', shimmer: true  },
};

const CATS = ['All', 'Hearts', 'Celebration', 'Appreciation', 'Humor', 'Special'];

function GiftAnimation({ gift, senderName, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ scale: 0.2, y: 40 }} animate={{ scale: 1.2, y: 0 }} transition={{ type: 'spring', bounce: 0.6 }}
        className="text-9xl mb-4">
        {gift.emoji || '🎁'}
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="text-xl font-black uppercase mb-1" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
        {senderName} sent
      </motion.p>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-2xl font-black" style={{ color: CREAM, fontFamily: 'Barlow Condensed, sans-serif' }}>
        {gift.name}!
      </motion.p>
    </motion.div>
  );
}

export default function GiftTray({ roomId, currentUser, recipientId }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState('All');
  const [sending, setSending] = useState(null);
  const qc = useQueryClient();

  const { data: gifts = [] } = useQuery({
    queryKey: ['active-gifts'],
    queryFn: () => base44.entities.AnimatedGift.filter({ is_active: true }),
  });
  const { data: topSenders = [] } = useQuery({
    queryKey: ['gift-senders', roomId],
    queryFn: () => base44.entities.Transaction.filter({ room_id: roomId, type: 'virtual_good' }, '-created_date', 100),
    enabled: !!roomId,
    refetchInterval: 10000,
  });

  const filtered = cat === 'All' ? gifts : gifts.filter(g => g.category?.toLowerCase() === cat.toLowerCase());

  // Aggregate senders for leaderboard
  const senderMap = {};
  topSenders.forEach(t => {
    senderMap[t.sender_name || 'Anon'] = (senderMap[t.sender_name || 'Anon'] || 0) + (t.amount || 0);
  });
  const senderRank = Object.entries(senderMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const sendGift = useMutation({
    mutationFn: async (gift) => {
      await base44.entities.Transaction.create({
        room_id: roomId,
        type: 'virtual_good',
        amount: gift.price,
        creator_amount: gift.price * 0.85,
        platform_fee: gift.price * 0.15,
        sender_id: currentUser.id,
        sender_name: currentUser.full_name || currentUser.email,
        to_user_id: recipientId,
        status: 'completed',
        metadata: { gift_id: gift.id, gift_name: gift.name },
      });
      await base44.entities.AnimatedGift.update(gift.id, { times_sent: (gift.times_sent || 0) + 1 }).catch(() => {});
    },
    onSuccess: (_, gift) => {
      setSending(gift);
      setOpen(false);
      qc.invalidateQueries(['gift-senders', roomId]);
    },
    onError: () => toast.error('Could not send gift'),
  });

  return (
    <>
      <AnimatePresence>
        {sending && (
          <GiftAnimation gift={sending} senderName={currentUser?.full_name || 'You'} onDone={() => setSending(null)} />
        )}
      </AnimatePresence>

      {/* Gift button */}
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-[10px]"
        title="Send a gift"
        style={{ background: `${G}15`, color: G, border: `1px solid ${G}30`, fontFamily: 'Barlow Condensed, sans-serif' }}>
        <Gift className="w-3.5 h-3.5" /> Gift
      </button>

      {/* Tray */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[70vh] overflow-hidden flex flex-col"
              style={{ background: OB2, border: `1px solid ${G}20` }}>
              
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4" style={{ color: G }} />
                  <span className="font-black uppercase text-sm" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>Gift Shop</span>
                </div>
                <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-white/40" /></button>
              </div>

              {/* Category filter */}
              <div className="flex overflow-x-auto gap-1.5 px-4 py-2 shrink-0 scrollbar-hide" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => setCat(c)}
                    className="shrink-0 px-3 py-1 rounded-full text-[11px] font-black uppercase"
                    style={{ background: cat === c ? `${G}20` : 'rgba(255,255,255,0.05)', color: cat === c ? G : 'rgba(255,255,255,0.35)', border: cat === c ? `1px solid ${G}40` : '1px solid rgba(255,255,255,0.08)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {c}
                  </button>
                ))}
              </div>

              {/* Gift grid */}
              <div className="overflow-y-auto flex-1 p-3">
                {filtered.length === 0
                  ? <p className="text-center py-6 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No gifts available</p>
                  : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {filtered.map(gift => {
                        const rarity = RARITY_STYLE[gift.rarity] || RARITY_STYLE.common;
                        return (
                          <button key={gift.id} onClick={() => sendGift.mutate(gift)}
                            disabled={sendGift.isPending}
                            className="rounded-xl p-2.5 flex flex-col items-center gap-1.5 active:scale-95 transition-all"
                            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${rarity.color}25`, boxShadow: rarity.shimmer ? `0 0 12px ${G}20` : undefined }}>
                            <div className="text-3xl">{gift.emoji || '🎁'}</div>
                            <p className="text-[11px] font-bold text-center leading-tight" style={{ color: CREAM }}>{gift.name}</p>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[7px] font-black uppercase" style={{ color: rarity.color, fontFamily: 'Barlow Condensed, sans-serif' }}>{rarity.label}</span>
                              {gift.is_limited && <span className="text-[6px] px-1 py-0.5 rounded font-black uppercase" style={{ background: 'rgba(192,57,43,0.2)', color: '#C0392B' }}>LIMITED</span>}
                            </div>
                            <span className="font-black text-[11px]" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>${gift.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  )
                }

                {/* Leaderboard */}
                {senderRank.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Trophy className="w-3.5 h-3.5" style={{ color: G }} />
                      <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'rgba(245,230,211,0.4)', fontFamily: 'IBM Plex Mono, monospace' }}>Top Senders</span>
                    </div>
                    {senderRank.map(([name, total], i) => (
                      <div key={name} className="flex items-center justify-between px-2 py-1.5 rounded mb-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
                          <span className="text-[11px] font-bold" style={{ color: CREAM }}>{name}</span>
                        </div>
                        <span className="font-black text-[10px]" style={{ color: G, fontFamily: 'IBM Plex Mono, monospace' }}>${total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}