import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Gift, Star, Crown, Zap } from 'lucide-react';

const GIFT_EMOJIS = { rose: '🌹', diamond: '💎', fire: '🔥', crown: '👑', lightning: '⚡', heart: '❤️' };

function GoldenWallItem({ item, onExpire }) {
  useEffect(() => {
    const t = setTimeout(onExpire, 8000);
    return () => clearTimeout(t);
  }, []);

  const isGift = item.type === 'gift';
  const isSuperChat = item.is_super_chat;

  return (
    <motion.div
      layout
      initial={{ scale: 0, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0, y: -10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`relative rounded-xl overflow-hidden border ${
        isSuperChat
          ? 'border-[#FFB800] shadow-[0_0_20px_rgba(255,184,0,0.4)] bg-gradient-to-br from-[#1a1000] to-[#0B0B18]'
          : isGift
          ? 'border-[#FF1564]/50 shadow-[0_0_16px_rgba(255,21,100,0.3)] bg-gradient-to-br from-[#1a0010] to-[#0B0B18]'
          : 'border-[#FFB800]/30 bg-[#10101E]'
      } px-3 py-2.5`}
    >
      {/* Shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFB800] to-transparent opacity-60" />

      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
          isSuperChat ? 'bg-[#FFB800]/20 text-[#FFB800]' : 'bg-[#FF1564]/20 text-[#FF1564]'
        }`}>
          {isGift ? (GIFT_EMOJIS[item.gift_type] || '🎁') : <DollarSign className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white truncate">{item.user_name}</span>
            {isSuperChat && <Crown className="w-3 h-3 text-[#FFB800] shrink-0" />}
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-sm font-black font-mono ${isSuperChat ? 'text-[#FFB800]' : 'text-[#FF1564]'}`}>
              ${item.amount?.toFixed(2)}
            </span>
            {item.message && (
              <span className="text-[10px] text-white/50 truncate">{item.message}</span>
            )}
          </div>
        </div>
        {isSuperChat && (
          <div className="shrink-0">
            <Star className="w-4 h-4 text-[#FFB800] animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function GoldenWall({ roomId, isExpanded = true }) {
  const [wallItems, setWallItems] = useState([]);
  const qc = useQueryClient();

  // Subscribe to new transactions (tips/gifts) for this room
  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.Transaction.subscribe((event) => {
      if (event.type !== 'create') return;
      const t = event.data;
      if (t.room_id !== roomId) return;
      if (!['tip', 'gift', 'super_chat'].includes(t.type)) return;

      setWallItems(prev => [{
        id: event.id || Date.now(),
        user_name: t.sender_name || 'Anonymous',
        amount: t.amount || 0,
        message: t.message || t.note,
        type: t.type,
        gift_type: t.gift_type,
        is_super_chat: t.type === 'super_chat' || t.amount >= 25,
      }, ...prev].slice(0, 20));
    });
    return unsub;
  }, [roomId]);

  // Fetch recent tips for initial wall
  useQuery({
    queryKey: ['golden-wall', roomId],
    queryFn: async () => {
      const txns = await base44.entities.Transaction.filter(
        { room_id: roomId },
        '-created_date',
        10
      );
      const items = txns
        .filter(t => ['tip', 'gift', 'super_chat'].includes(t.type))
        .map(t => ({
          id: t.id,
          user_name: t.sender_name || 'Anonymous',
          amount: t.amount || 0,
          message: t.message || t.note,
          type: t.type,
          gift_type: t.gift_type,
          is_super_chat: t.type === 'super_chat' || t.amount >= 25,
        }));
      setWallItems(items);
      return items;
    },
    enabled: !!roomId,
  });

  if (!isExpanded) return null;

  return (
    <div className="rounded-xl border border-[#FFB800]/20 bg-[#0B0B18] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#FFB800]/10 bg-[#07070F]">
        <div className="w-4 h-4 rounded-full bg-[#FFB800] flex items-center justify-center">
          <Zap className="w-2.5 h-2.5 text-black" />
        </div>
        <span className="text-[10px] font-bold text-[#FFB800] uppercase tracking-wider">Golden Wall</span>
        <span className="text-[11px] text-[#FFB800]/40 ml-auto font-mono">{wallItems.length} recent</span>
      </div>

      {/* Items */}
      <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
        {wallItems.length === 0 ? (
          <div className="text-center py-6 text-[10px] text-white/20">
            <DollarSign className="w-5 h-5 mx-auto mb-1 opacity-20" />
            Tips & gifts appear here live
          </div>
        ) : (
          <AnimatePresence>
            {wallItems.map((item) => (
              <GoldenWallItem
                key={item.id}
                item={item}
                onExpire={() => {}} // keep them visible, don't auto-remove
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}