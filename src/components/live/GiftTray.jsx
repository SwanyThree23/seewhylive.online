import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Gift, X, Trophy, Flame } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const B = '#800020';
const OB2 = '#1A1A1A';
const CREAM = '#F5E6D3';

const RARITY_STYLE = {
  common:    { color: 'rgba(255,255,255,0.4)', label: 'COMMON',    shimmer: false },
  rare:      { color: '#D4AF37',              label: 'RARE',      shimmer: false },
  epic:      { color: '#D4854A',              label: 'EPIC',      shimmer: false },
  legendary: { color: G,                      label: 'LEGENDARY', shimmer: true  },
  ultra:     { color: '#ff6ef7',              label: 'ULTRA',     shimmer: true  },
};

const CATS = ['All', 'Hearts', 'Celebration', 'Appreciation', 'Humor', 'Special'];
const MULTIPLIERS = [1, 3, 5];

function GiftAnimation({ gift, senderName, combo, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ scale: 0.2, y: 40 }} animate={{ scale: 1.2, y: 0 }} transition={{ type: 'spring', bounce: 0.6 }}
        className="text-9xl mb-4 relative">
        {gift.emoji || '🎁'}
        {combo && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', bounce: 0.7 }}
            className="absolute -top-4 -right-4 text-base font-black rounded-full px-2 py-0.5"
            style={{ background: G, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14 }}
          >
            +2 COMBO
          </motion.div>
        )}
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
  const [cat, setCat] = useState(() => { try { return localStorage.getItem('gift_tray_cat') || 'All'; } catch { return 'All'; } });
  const [sending, setSending] = useState(null);
  const [multiplier, setMultiplier] = useState(() => {
    try { return parseInt(localStorage.getItem('gift_tray_multiplier') || '1', 10) || 1; } catch { return 1; }
  });
  const [giftStreak, setGiftStreak] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const lastGiftRef = useRef(null);
  const lastGiftTimeRef = useRef(null);
  const sessionTotalRef = useRef(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const recentSentRef = useRef([]);
  const [recentSent, setRecentSent] = useState([]);
  const qc = useQueryClient();

  const { data: gifts = [] } = useQuery({
    queryKey: ['active-gifts'],
    queryFn: () => base44.entities.AnimatedGift.filter({ is_active: true }),
  });
  const { data: topSenders = [] } = useQuery({
    queryKey: ['gift-senders', roomId],
    queryFn: () => base44.entities.Transaction.filter({ room_id: roomId, transaction_type: 'virtual_good' }, '-created_date', 100),
    enabled: !!roomId,
    refetchInterval: 10000,
  });

  const filtered = cat === 'All' ? gifts : gifts.filter(g => g.category?.toLowerCase() === cat.toLowerCase());

  // Find most popular gift
  const mostPopularId = gifts.length > 0
    ? gifts.reduce((best, g) => (g.times_sent || 0) > (best.times_sent || 0) ? g : best, gifts[0])?.id
    : null;

  // Aggregate senders for leaderboard
  const senderMap = {};
  topSenders.forEach(t => {
    senderMap[t.sender_name || 'Anon'] = (senderMap[t.sender_name || 'Anon'] || 0) + (t.creator_payout || 0) + (t.platform_cut || 0);
  });
  const senderRank = Object.entries(senderMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const sendGift = useMutation({
    mutationFn: async (gift) => {
      const sends = Array.from({ length: multiplier }, () =>
        base44.entities.Transaction.create({
          room_id: roomId,
          type: 'virtual_good',
          amount: gift.price,
          creator_amount: Math.floor(gift.price * 0.90),
          platform_fee: gift.price - Math.floor(gift.price * 0.90),
          sender_id: currentUser.id,
          sender_name: currentUser.full_name || currentUser.email,
          recipient_id: recipientId,
          status: 'completed',
          metadata: { gift_id: gift.id, gift_name: gift.name },
        })
      );
      await Promise.all(sends);
      await base44.entities.AnimatedGift.update(gift.id, { times_sent: (gift.times_sent || 0) + multiplier }).catch(() => {});
    },
    onSuccess: (_, gift) => {
      navigator.vibrate?.([40, 20, 60, 20, 100]);

      // Combo detection: same gift within 8 seconds
      const now = Date.now();
      const isCombo = lastGiftRef.current === gift.id && lastGiftTimeRef.current && (now - lastGiftTimeRef.current) < 8000;
      setShowCombo(isCombo);
      lastGiftRef.current = gift.id;
      lastGiftTimeRef.current = now;

      // Track session total and recent gifts
      sessionTotalRef.current += gift.price * multiplier;
      setSessionTotal(sessionTotalRef.current);
      const updated = [gift, ...recentSentRef.current.filter(g => g.id !== gift.id)].slice(0, 3);
      recentSentRef.current = updated;
      setRecentSent(updated);

      setSending(gift);
      setGiftStreak(prev => prev + 1);
      setOpen(false);
      qc.invalidateQueries(['gift-senders', roomId]);

      Promise.allSettled([
        base44.entities.Activity.create({
          user_id: currentUser.id,
          type: 'gift_sent',
          title: `Sent ${gift.name || 'gift'}${multiplier > 1 ? ` x${multiplier}` : ''}`,
          amount: gift.price * multiplier,
          recipient_id: recipientId,
        }),
        recipientId && base44.entities.Activity.create({
          user_id: recipientId,
          type: 'gift_received',
          title: `Received ${gift.name || 'gift'} from ${currentUser.full_name || 'viewer'}`,
          amount: gift.price * multiplier,
          sender_id: currentUser.id,
        }),
      ]);
    },
    onError: () => toast.error('Could not send gift'),
  });

  return (
    <>
      <AnimatePresence>
        {sending && (
          <GiftAnimation
            gift={sending}
            senderName={currentUser?.full_name || 'You'}
            combo={showCombo}
            onDone={() => { setSending(null); setShowCombo(false); }}
          />
        )}
      </AnimatePresence>

      {/* Gift button */}
      <div className="flex items-center gap-1.5">
        {giftStreak >= 3 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(192,57,43,0.2)', color: '#D4854A', border: '1px solid rgba(212,132,74,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            🔥 {giftStreak} STREAK
          </motion.span>
        )}
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-[10px]"
          title="Send a gift"
          style={{ background: `${G}15`, color: G, border: `1px solid ${G}30`, fontFamily: 'Barlow Condensed, sans-serif' }}>
          <Gift className="w-3.5 h-3.5" /> Gift
        </button>
      </div>

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
                  {giftStreak >= 3 && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(212,132,74,0.15)', color: '#D4854A', border: '1px solid rgba(212,132,74,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      🔥 {giftStreak} STREAK
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {sessionTotal > 0 && (
                    <span className="text-[9px] font-black font-mono px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(212,175,55,0.1)', color: G, border: '1px solid rgba(212,175,55,0.2)' }}>
                      ${sessionTotal.toFixed(0)} sent
                    </span>
                  )}
                  <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-white/40" /></button>
                </div>
              </div>

              {/* Multiplier selector */}
              <div className="flex items-center gap-2 px-4 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Send:</span>
                {MULTIPLIERS.map(m => (
                  <button key={m} onClick={() => { setMultiplier(m); try { localStorage.setItem('gift_tray_multiplier', String(m)); } catch {} }}
                    className="px-3 py-1 rounded-lg text-[11px] font-black uppercase"
                    style={{
                      background: multiplier === m ? `${G}20` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${multiplier === m ? G + '60' : 'rgba(255,255,255,0.08)'}`,
                      color: multiplier === m ? G : 'rgba(255,255,255,0.3)',
                      fontFamily: 'Barlow Condensed, sans-serif',
                    }}>
                    x{m}
                  </button>
                ))}
              </div>

              {/* Quick re-send row */}
              {recentSent.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-[9px] uppercase tracking-widest font-black shrink-0" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>Again</span>
                  {recentSent.map(g => (
                    <button key={g.id} onClick={() => sendGift.mutate(g)}
                      disabled={sendGift.isPending}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl active:scale-95 transition-all"
                      style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                      <span className="text-base leading-none">{g.emoji || '🎁'}</span>
                      <span className="text-[9px] font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>${g.price}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Category filter */}
              <div className="flex overflow-x-auto gap-1.5 px-4 py-2 shrink-0 scrollbar-hide" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => { setCat(c); try { localStorage.setItem('gift_tray_cat', c); } catch {} }}
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
                        const isHot = gift.id === mostPopularId && (gift.times_sent || 0) > 0;
                        return (
                          <button key={gift.id} onClick={() => sendGift.mutate(gift)}
                            disabled={sendGift.isPending}
                            className="rounded-xl p-2.5 flex flex-col items-center gap-1.5 active:scale-95 transition-all relative"
                            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${rarity.color}25`, boxShadow: rarity.shimmer ? `0 0 12px ${rarity.color}30` : undefined }}>
                            {isHot && (
                              <span className="absolute -top-1.5 -right-1 text-[7px] font-black px-1 py-0.5 rounded-full z-10"
                                style={{ background: '#C0392B', color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>
                                🔥 HOT
                              </span>
                            )}
                            <div className="text-3xl">{gift.emoji || '🎁'}</div>
                            <p className="text-[11px] font-bold text-center leading-tight" style={{ color: CREAM }}>{gift.name}</p>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[7px] font-black uppercase" style={{ color: rarity.color, fontFamily: 'Barlow Condensed, sans-serif' }}>{rarity.label}</span>
                              {gift.is_limited && <span className="text-[6px] px-1 py-0.5 rounded font-black uppercase" style={{ background: 'rgba(192,57,43,0.2)', color: '#C0392B' }}>LIMITED</span>}
                            </div>
                            <span className="font-black text-[11px]" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                              ${multiplier > 1 ? (gift.price * multiplier).toFixed(0) : gift.price}
                              {multiplier > 1 && <span className="text-[8px] opacity-60 ml-0.5">x{multiplier}</span>}
                            </span>
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
