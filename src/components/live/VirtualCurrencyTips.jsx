import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Zap, Star, Flame, Crown, Gift } from 'lucide-react';
import { toast } from 'sonner';

const COIN_PACKS = [
  { coins: 10,  price: 0.99,  label: '10 🪙',  color: '#d4af37' },
  { coins: 50,  price: 3.99,  label: '50 🪙',  color: '#CC7755' },
  { coins: 100, price: 6.99,  label: '100 🪙', color: '#D4AF37' },
  { coins: 500, price: 29.99, label: '500 🪙', color: '#C0392B' },
];

const TIP_AMOUNTS = [
  { coins: 5,   emoji: '⚡', label: 'Spark',    color: '#C9A84C' },
  { coins: 20,  emoji: '🔥', label: 'Fire',     color: '#D4854A' },
  { coins: 50,  emoji: '💎', label: 'Diamond',  color: '#D4AF37' },
  { coins: 100, emoji: '👑', label: 'Royal',    color: '#d4af37' },
  { coins: 200, emoji: '🚀', label: 'Legend',   color: '#C0392B' },
];

// Floating coin animation
function FloatingTip({ tip, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -80, scale: 1.3 }}
      transition={{ duration: 1.8, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-black shadow-2xl"
        style={{ background: tip.color + '22', border: `2px solid ${tip.color}`, color: tip.color, fontFamily: 'Barlow Condensed, sans-serif' }}>
        <span className="text-lg">{tip.emoji}</span>
        <span>{tip.senderName} sent {tip.coins} coins!</span>
      </div>
    </motion.div>
  );
}

export default function VirtualCurrencyTips({ roomId, creatorId, currentUser, isHost }) {
  const qc = useQueryClient();
  const [floatingTips, setFloatingTips] = useState([]);
  const [sending, setSending] = useState(null);

  // Fetch viewer's coin balance (stored in ViewerPoints)
  const { data: pointsData } = useQuery({
    queryKey: ['viewer-coins', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      const pts = await base44.entities.ViewerPoints.filter({ user_id: currentUser.id });
      return pts?.[0] || null;
    },
    enabled: !!currentUser?.id,
  });

  const coins = pointsData?.points || 0;

  // Subscribe to incoming tips for host
  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.Transaction.subscribe((event) => {
      if (event.type !== 'create') return;
      const t = event.data;
      if (t?.room_id !== roomId) return;
      const tGross = (t.creator_payout || 0) + (t.platform_cut || 0);
      const tipDef = TIP_AMOUNTS.find(a => a.coins === Math.round(tGross * 10));
      const floatTip = {
        id: Date.now(),
        coins: Math.round(tGross * 10),
        emoji: tipDef?.emoji || '🪙',
        color: tipDef?.color || '#d4af37',
        senderName: t.sender_name || 'Viewer',
      };
      setFloatingTips(prev => [...prev, floatTip]);
    });
    return unsub;
  }, [roomId]);

  const sendTip = async (tipDef) => {
    if (!currentUser || !creatorId) return;
    if (coins < tipDef.coins) {
      toast.error(`Not enough coins! You need ${tipDef.coins} but have ${coins}.`);
      return;
    }
    setSending(tipDef.coins);

    // Deduct from viewer
    const usdAmount = tipDef.coins / 10;
    if (pointsData?.id) {
      await base44.entities.ViewerPoints.update(pointsData.id, { points: coins - tipDef.coins });
    }

    // Log transaction
    await base44.entities.Transaction.create({
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || 'Viewer',
      recipient_id: creatorId,
      room_id: roomId,
      amount: usdAmount,
      creator_payout: Math.floor(usdAmount  * 90) / 100,
      platform_cut: usdAmount - Math.floor(usdAmount  * 90) / 100,
      payment_method: 'virtual_coins',
      transaction_type: 'direct_support',
      status: 'completed',
      processed_at: new Date().toISOString(),
    });

    // Show local float
    setFloatingTips(prev => [...prev, { id: Date.now(), coins: tipDef.coins, emoji: tipDef.emoji, color: tipDef.color, senderName: 'You' }]);
    qc.invalidateQueries(['viewer-coins', currentUser.id]);
    toast.success(`${tipDef.emoji} Sent ${tipDef.coins} coins!`);
    setSending(null);
  };

  const buyCoins = async (pack) => {
    // Simulate purchase — in production this would go through Stripe
    toast.info(`💳 In production, this opens Stripe checkout for $${pack.price}`);
    // For demo: grant coins directly
    if (pointsData?.id) {
      await base44.entities.ViewerPoints.update(pointsData.id, { points: coins + pack.coins });
    } else if (currentUser?.id) {
      await base44.entities.ViewerPoints.create({ user_id: currentUser.id, points: pack.coins, lifetime_points: pack.coins });
    }
    qc.invalidateQueries(['viewer-coins', currentUser.id]);
    toast.success(`+${pack.coins} coins added to your wallet!`);
  };

  if (isHost) {
    // Host sees incoming tips summary
    return (
      <div className="rounded-xl p-3 space-y-2 relative" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}>
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4" style={{ color: '#d4af37' }} />
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>Virtual Tips Active</span>
        </div>
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Viewers are tipping you with coins (1 coin = $0.10). Tips appear as floating animations.</p>
        <AnimatePresence>
          {floatingTips.map(tip => (
            <FloatingTip key={tip.id} tip={tip} onDone={() => setFloatingTips(prev => prev.filter(t => t.id !== tip.id))} />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden relative" style={{ background: 'rgba(8,11,24,0.98)', border: '1px solid rgba(212,175,55,0.2)' }}>
      {/* Floating tip animations */}
      <AnimatePresence>
        {floatingTips.map(tip => (
          <FloatingTip key={tip.id} tip={tip} onDone={() => setFloatingTips(prev => prev.filter(t => t.id !== tip.id))} />
        ))}
      </AnimatePresence>

      {/* Header: coin balance */}
      <div className="flex items-center justify-between px-3 py-2" style={{ background: 'rgba(212,175,55,0.08)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
        <div className="flex items-center gap-1.5">
          <Coins className="w-4 h-4" style={{ color: '#d4af37' }} />
          <span className="text-[11px] font-black uppercase" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>Your Coins</span>
        </div>
        <div className="flex items-center gap-1 text-[13px] font-black" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>
          🪙 {coins.toLocaleString()}
        </div>
      </div>

      {/* Tip buttons */}
      <div className="p-3 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Send a Tip</p>
        <div className="grid grid-cols-5 gap-1.5">
          {TIP_AMOUNTS.map(tip => (
            <motion.button
              key={tip.coins}
              whileTap={{ scale: 0.9 }}
              disabled={sending === tip.coins || coins < tip.coins}
              onClick={() => sendTip(tip)}
              className="flex flex-col items-center gap-1 py-2 rounded-xl text-center transition-all disabled:opacity-40"
              style={{ background: `${tip.color}12`, border: `1px solid ${tip.color}30` }}>
              <span className="text-lg">{tip.emoji}</span>
              <span className="text-[11px] font-bold" style={{ color: tip.color, fontFamily: 'Barlow Condensed, sans-serif' }}>{tip.coins}</span>
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>${(tip.coins / 10).toFixed(2)}</span>
            </motion.button>
          ))}
        </div>

        {/* Buy coins section */}
        <div className="border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Buy Coins</p>
          <div className="grid grid-cols-2 gap-1.5">
            {COIN_PACKS.map(pack => (
              <button
                key={pack.coins}
                onClick={() => buyCoins(pack)}
                className="flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                style={{ background: `${pack.color}10`, border: `1px solid ${pack.color}25`, color: pack.color }}>
                <span>{pack.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>${pack.price}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] mt-2 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>1 coin = $0.10 · 90% goes to creator</p>
        </div>
      </div>
    </div>
  );
}