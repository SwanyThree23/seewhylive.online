import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Gift, Star, Crown, Zap, TrendingUp } from 'lucide-react';

const G = '#D4AF37';
const GIFT_EMOJIS = { rose: '🌹', diamond: '💎', fire: '🔥', crown: '👑', lightning: '⚡', heart: '❤️', star: '⭐', unicorn: '🦄' };
const BIG_TIP_THRESHOLD = 25;

function CelebrationBurst({ amount, color }) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 1 }}
      animate={{ scale: 2.5, opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 rounded-xl pointer-events-none"
      style={{ background: `radial-gradient(circle, ${color}40 0%, transparent 70%)` }}
    />
  );
}

function GoldenWallItem({ item }) {
  const isGift      = item.type === 'gift';
  const isSuperChat = item.is_super_chat;
  const isBig       = item.amount >= BIG_TIP_THRESHOLD;
  const accentColor = isSuperChat ? G : isGift ? '#C0392B' : '#C9A84C';

  return (
    <motion.div
      layout
      initial={{ scale: 0, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0, y: -10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="relative rounded-xl overflow-hidden border px-3 py-2.5"
      style={{
        background: isSuperChat
          ? 'linear-gradient(135deg, #1a1000, #0B0B18)'
          : isGift
          ? 'linear-gradient(135deg, #1a0010, #0B0B18)'
          : '#10101E',
        border: `1px solid ${accentColor}${isBig ? '80' : '40'}`,
        boxShadow: isBig ? `0 0 20px ${accentColor}30` : undefined,
      }}
    >
      {/* Shimmer */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60" />

      {/* Big tip celebration burst */}
      {isBig && <CelebrationBurst amount={item.amount} color={accentColor} />}

      <div className="relative flex items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
          style={{ background: `${accentColor}20`, color: accentColor }}>
          {isGift ? (GIFT_EMOJIS[item.gift_type] || '🎁') : <DollarSign className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white truncate">{item.user_name}</span>
            {item.is_top && <Crown className="w-3 h-3 text-[#D4AF37] shrink-0" title="Top tipper" />}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-black font-mono" style={{ color: accentColor }}>
              ${item.amount?.toFixed(2)}
            </span>
            {item.message && (
              <span className="text-[10px] text-white/50 truncate">{item.message}</span>
            )}
          </div>
        </div>
        {isSuperChat && <Star className="w-4 h-4 text-[#D4AF37] shrink-0 animate-spin" style={{ animationDuration: '3s' }} />}
        {isBig && !isSuperChat && <span className="text-[10px] font-black px-1.5 py-0.5 rounded shrink-0" style={{ background: `${accentColor}20`, color: accentColor }}>BIG</span>}
      </div>
    </motion.div>
  );
}

const FILTER_TABS = [
  { id: 'all',      label: 'All'   },
  { id: 'tips',     label: '💰 Tips'  },
  { id: 'gifts',    label: '🎁 Gifts' },
  { id: 'super',    label: '⭐ Super' },
];

export default function GoldenWall({ roomId, isExpanded = true }) {
  const [wallItems, setWallItems]   = useState([]);
  const [filter, setFilter]         = useState('all');
  const [sessionTotal, setSessionTotal] = useState(0);
  const qc = useQueryClient();

  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.Transaction.subscribe((event) => {
      if (event.type !== 'create') return;
      const t = event.data;
      if (t.room_id !== roomId) return;
      if (!['tip', 'gift', 'super_chat'].includes(t.transaction_type)) return;
      const gross = (t.creator_payout || 0) + (t.platform_cut || 0);
      setSessionTotal(prev => +(prev + gross).toFixed(2));
      setWallItems(prev => {
        const maxAmount = Math.max(...prev.map(i => i.amount), gross);
        const newItem = {
          id:           event.id || Date.now(),
          user_name:    t.sender_name || 'Anonymous',
          amount:       gross,
          message:      t.message || t.note,
          type:         t.transaction_type,
          gift_type:    t.gift_type,
          is_super_chat: t.transaction_type === 'super_chat' || gross >= 25,
          is_top:       gross === maxAmount,
        };
        const next = [newItem, ...prev].slice(0, 20).map(i => ({
          ...i,
          is_top: i.amount === Math.max(...[newItem, ...prev].slice(0, 20).map(x => x.amount)),
        }));
        return next;
      });
    });
    return unsub;
  }, [roomId]);

  useQuery({
    queryKey: ['golden-wall', roomId],
    queryFn: async () => {
      const txns = await base44.entities.Transaction.filter({ room_id: roomId }, '-created_date', 10);
      const items = txns
        .filter(t => ['tip', 'gift', 'super_chat'].includes(t.transaction_type))
        .map(t => {
          const gross = (t.creator_payout || 0) + (t.platform_cut || 0);
          return {
            id:           t.id,
            user_name:    t.sender_name || 'Anonymous',
            amount:       gross,
            message:      t.message || t.note,
            type:         t.transaction_type,
            gift_type:    t.gift_type,
            is_super_chat: t.transaction_type === 'super_chat' || gross >= 25,
          };
        });
      const maxAmount = items.length ? Math.max(...items.map(i => i.amount)) : 0;
      const tagged = items.map(i => ({ ...i, is_top: i.amount === maxAmount }));
      setWallItems(tagged);
      const total = items.reduce((s, i) => s + i.amount, 0);
      setSessionTotal(+total.toFixed(2));
      return tagged;
    },
    enabled: !!roomId,
  });

  const filteredItems = wallItems.filter(item => {
    if (filter === 'tips')  return item.type === 'tip';
    if (filter === 'gifts') return item.type === 'gift';
    if (filter === 'super') return item.is_super_chat;
    return true;
  });

  const topTipper = wallItems.length ? wallItems.reduce((best, item) => item.amount > best.amount ? item : best, wallItems[0]) : null;

  if (!isExpanded) return null;

  return (
    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0B0B18] overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#D4AF37]/10 bg-[#0D1022] space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#D4AF37] flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-black" />
          </div>
          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider flex-1">Golden Wall</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#6DBF7E]" />
            <span className="text-[11px] font-black font-mono text-[#6DBF7E]">${sessionTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Top tipper banner */}
        {topTipper && topTipper.amount >= BIG_TIP_THRESHOLD && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <Crown className="w-3 h-3 text-[#D4AF37]" />
            <span className="text-[10px] text-white/60">Top: </span>
            <span className="text-[10px] font-bold text-[#D4AF37] truncate flex-1">{topTipper.user_name}</span>
            <span className="text-[10px] font-black font-mono text-[#D4AF37]">${topTipper.amount.toFixed(2)}</span>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className="flex-1 py-1 rounded text-[10px] font-bold transition-all"
              style={filter === tab.id
                ? { background: `${G}20`, color: G, border: `1px solid ${G}30` }
                : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', border: '1px solid transparent' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="p-2 space-y-2 max-h-72 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-6 text-[10px] text-white/20">
            <DollarSign className="w-5 h-5 mx-auto mb-1 opacity-20" />
            {filter === 'all' ? 'Tips & gifts appear here live' : `No ${filter} yet`}
          </div>
        ) : (
          <AnimatePresence>
            {filteredItems.map(item => (
              <GoldenWallItem key={item.id} item={item} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
