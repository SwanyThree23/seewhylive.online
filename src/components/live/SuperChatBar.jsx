import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Gift, X, Zap, Star, Crown, Heart, Flame } from 'lucide-react';
import { toast } from 'sonner';

const SUPER_AMOUNTS = [
  { value: 2, label: '$2', color: '#5A5A7A', emoji: '💬' },
  { value: 5, label: '$5', color: '#00F5FF', emoji: '💙' },
  { value: 10, label: '$10', color: '#00FF88', emoji: '💚' },
  { value: 20, label: '$20', color: '#FFB800', emoji: '⭐' },
  { value: 50, label: '$50', color: '#FF8C00', emoji: '🔥' },
  { value: 100, label: '$100', color: '#FF1564', emoji: '👑' },
];

const GIFTS = [
  { id: 'rose', emoji: '🌹', name: 'Rose', price: 1 },
  { id: 'heart', emoji: '❤️', name: 'Heart', price: 2 },
  { id: 'fire', emoji: '🔥', name: 'Fire', price: 5 },
  { id: 'diamond', emoji: '💎', name: 'Diamond', price: 10 },
  { id: 'crown', emoji: '👑', name: 'Crown', price: 25 },
  { id: 'lightning', emoji: '⚡', name: 'Lightning', price: 50 },
];

export default function SuperChatBar({ roomId, currentUser, recipientId, recipientName }) {
  const [mode, setMode] = useState(null); // null | 'superchat' | 'gift'
  const [selectedAmount, setSelectedAmount] = useState(SUPER_AMOUNTS[1]);
  const [message, setMessage] = useState('');
  const [selectedGift, setSelectedGift] = useState(null);

  const sendMutation = useMutation({
    mutationFn: async (data) => {
      // Create transaction record
      await base44.entities.Transaction.create({
        type: data.type,
        amount: data.amount,
        from_user_id: currentUser?.id,
        to_user_id: recipientId,
        room_id: roomId,
        sender_name: currentUser?.full_name || 'Anonymous',
        message: data.message,
        gift_type: data.giftType,
        status: 'completed',
        platform_fee: data.amount * 0.1,
        creator_amount: data.amount * 0.9,
      });

      // Post message to chat
      await base44.entities.Message.create({
        room_id: roomId,
        user_id: currentUser?.id,
        user_name: currentUser?.full_name || 'Anonymous',
        content: data.type === 'gift'
          ? `${GIFTS.find(g => g.id === data.giftType)?.emoji || '🎁'} sent a ${data.giftType} gift!`
          : `💬 [Super Chat $${data.amount}] ${data.message || ''}`,
        message_type: data.type === 'gift' ? 'gift' : 'super_chat',
        amount: data.amount,
      });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.type === 'gift' ? '🎁 Gift sent!' : '⭐ Super Chat sent!');
      setMode(null);
      setMessage('');
    },
    onError: () => toast.error('Failed to send'),
  });

  const handleSuperChat = () => {
    if (!currentUser) { toast.error('Sign in to send'); return; }
    sendMutation.mutate({
      type: 'super_chat',
      amount: selectedAmount.value,
      message,
    });
  };

  const handleGift = (gift) => {
    if (!currentUser) { toast.error('Sign in to send'); return; }
    sendMutation.mutate({
      type: 'gift',
      amount: gift.price,
      giftType: gift.id,
      message: `Sent a ${gift.name}!`,
    });
  };

  return (
    <div className="border-t border-white/5">
      {/* Quick action strip */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          onClick={() => setMode(mode === 'superchat' ? null : 'superchat')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
            mode === 'superchat'
              ? 'border-[#FFB800] text-[#FFB800] bg-[#FFB800]/10'
              : 'border-white/10 text-white/40 hover:border-[#FFB800]/30 hover:text-[#FFB800]/60'
          }`}
        >
          <Star className="w-3 h-3" /> Super Chat
        </button>
        <button
          onClick={() => setMode(mode === 'gift' ? null : 'gift')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
            mode === 'gift'
              ? 'border-[#FF1564] text-[#FF1564] bg-[#FF1564]/10'
              : 'border-white/10 text-white/40 hover:border-[#FF1564]/30 hover:text-[#FF1564]/60'
          }`}
        >
          <Gift className="w-3 h-3" /> Gift
        </button>
        {mode && (
          <button onClick={() => setMode(null)} className="ml-auto text-white/20 hover:text-white/50">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Super Chat panel */}
      <AnimatePresence>
        {mode === 'superchat' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#FFB800]/10"
          >
            <div className="p-2 space-y-2">
              {/* Amount grid */}
              <div className="grid grid-cols-6 gap-1">
                {SUPER_AMOUNTS.map(a => (
                  <button
                    key={a.value}
                    onClick={() => setSelectedAmount(a)}
                    className={`py-1.5 rounded text-[11px] font-bold transition-all border ${
                      selectedAmount.value === a.value
                        ? 'border-current'
                        : 'border-white/10 text-white/40 hover:border-white/20'
                    }`}
                    style={selectedAmount.value === a.value ? { color: a.color, borderColor: a.color, background: `${a.color}15` } : {}}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              {/* Message input */}
              <div className="flex gap-1.5">
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, 100))}
                  placeholder="Add a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white placeholder-white/20 focus:outline-none focus:border-[#FFB800]/40"
                />
                <button
                  onClick={handleSuperChat}
                  disabled={sendMutation.isPending}
                  style={{ height:28, padding:'0 8px', borderRadius:6, border:'none', background: selectedAmount.color, color: '#000', fontWeight:700, fontSize:10, cursor: sendMutation.isPending ? 'not-allowed' : 'pointer' }}
                >
                  {sendMutation.isPending ? '...' : `${selectedAmount.emoji} Send`}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {mode === 'gift' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#FF1564]/10"
          >
            <div className="p-2">
              <div className="grid grid-cols-6 gap-1">
                {GIFTS.map(gift => (
                  <button
                    key={gift.id}
                    onClick={() => handleGift(gift)}
                    disabled={sendMutation.isPending}
                    className="flex flex-col items-center py-1.5 rounded border border-white/10 hover:border-[#FF1564]/40 hover:bg-[#FF1564]/10 transition-all"
                    title={`${gift.name} — $${gift.price}`}
                  >
                    <span className="text-base">{gift.emoji}</span>
                    <span className="text-[11px] text-white/30 mt-0.5">${gift.price}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}