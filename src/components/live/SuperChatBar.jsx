import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Gift, X, Zap, Star, Crown, Heart, Flame, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const SUPER_AMOUNTS = [
  { value: 2,   label: '$2',   color: '#D4AF37', emoji: '💬' },
  { value: 5,   label: '$5',   color: '#C9A84C', emoji: '💙' },
  { value: 10,  label: '$10',  color: '#6DBF7E', emoji: '💚' },
  { value: 20,  label: '$20',  color: '#D4AF37', emoji: '⭐' },
  { value: 50,  label: '$50',  color: '#D4854A', emoji: '🔥' },
  { value: 100, label: '$100', color: '#C0392B', emoji: '👑' },
];

const GIFTS = [
  { id: 'rose',      emoji: '🌹', name: 'Rose',      price: 1  },
  { id: 'heart',     emoji: '❤️', name: 'Heart',     price: 2  },
  { id: 'fire',      emoji: '🔥', name: 'Fire',      price: 5  },
  { id: 'diamond',   emoji: '💎', name: 'Diamond',   price: 10 },
  { id: 'crown',     emoji: '👑', name: 'Crown',     price: 25 },
  { id: 'lightning', emoji: '⚡', name: 'Lightning', price: 50 },
];

const QUICK_MESSAGES = [
  "You're amazing! 🔥",
  'Best stream ever! 👑',
  'Keep it up! 💪',
  'Love this! ❤️',
  'LFG! ⚡',
  'First time here! 👋',
];

const MSG_STYLES = [
  { id: 'normal', label: 'Normal' },
  { id: 'bold',   label: 'Bold'   },
  { id: 'hype',   label: '🎉 Hype' },
];

export default function SuperChatBar({ roomId, currentUser, recipientId, recipientName }) {
  const [mode, setMode]                   = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(() => { try { const i = localStorage.getItem('superchat_amount_idx'); return SUPER_AMOUNTS[i !== null ? Number(i) : 1] || SUPER_AMOUNTS[1]; } catch { return SUPER_AMOUNTS[1]; } });
  const [customAmount, setCustomAmount]   = useState('');
  const [message, setMessage]             = useState('');
  const [msgStyle, setMsgStyle]           = useState(() => { try { return localStorage.getItem('superchat_msg_style') || 'normal'; } catch { return 'normal'; } });
  const [selectedGift, setSelectedGift]   = useState(null);
  const [confirming, setConfirming]       = useState(false);
  const [sentHistory, setSentHistory]     = useState([]);

  // Expire sent-history entries after 30s
  useEffect(() => {
    if (sentHistory.length === 0) return;
    const t = setTimeout(() => {
      setSentHistory(prev => prev.filter(h => Date.now() - h.ts < 30000));
    }, 30000);
    return () => clearTimeout(t);
  }, [sentHistory]);

  const effectiveAmount = customAmount
    ? { value: Math.min(500, Math.max(1, Number(customAmount))), label: `$${customAmount}`, color: '#C9A84C', emoji: '💫' }
    : selectedAmount;

  const buildMessage = () => {
    if (!message) return '';
    if (msgStyle === 'bold') return `**${message}**`;
    if (msgStyle === 'hype') return `${message} 🎉🎉🎉`;
    return message;
  };

  const sendMutation = useMutation({
    mutationFn: async (data) => {
      const amount = data.amount;
      await base44.entities.Transaction.create({
        sender_id: currentUser?.id,
        recipient_id: recipientId,
        room_id: roomId,
        creator_payout: Math.floor(amount * 90) / 100,
        platform_cut: amount - Math.floor(amount * 90) / 100,
        transaction_type: 'direct_support',
        status: 'completed',
        creator_amount: Math.floor(amount * 0.9),
        platform_fee: amount - Math.floor(amount * 0.9),
      });

      if (data.type === 'gift' && data.giftType) {
        const gemTypeMap = { diamond: 'diamond', crown: 'gold', lightning: 'diamond', fire: 'ruby', heart: 'ruby', rose: 'gold' };
        base44.entities.GemTransaction?.create({
          sender_id: currentUser?.id,
          recipient_id: recipientId,
          stream_id: roomId,
          gem_type: gemTypeMap[data.giftType] || 'gold',
          quantity: 1,
          usd_value: amount,
        }).catch(() => {});
      }

      await base44.entities.Message.create({
        room_id: roomId,
        user_id: currentUser?.id,
        user_name: currentUser?.full_name || 'Anonymous',
        content: data.type === 'gift'
          ? `${GIFTS.find(g => g.id === data.giftType)?.emoji || '🎁'} sent a ${data.giftType} gift!`
          : `💬 [Super Chat $${amount}] ${data.finalMessage || ''}`,
        message_type: data.type === 'gift' ? 'gift' : 'super_chat',
        amount,
      });
    },
    onSuccess: (_, vars) => {
      const isGift = vars.type === 'gift';
      toast.success(isGift ? '🎁 Gift sent!' : '⭐ Super Chat sent!');
      setSentHistory(prev => [
        { id: Date.now(), emoji: isGift ? (GIFTS.find(g => g.id === vars.giftType)?.emoji || '🎁') : effectiveAmount.emoji, amount: vars.amount, ts: Date.now() },
        ...prev.slice(0, 2),
      ]);
      setMode(null);
      setMessage('');
      setCustomAmount('');
      setConfirming(false);
      if (currentUser?.id) {
        const giftName = isGift ? GIFTS.find(g => g.id === vars.giftType)?.name || 'Gift' : null;
        Promise.allSettled([
          base44.entities.Activity.create({
            user_id: currentUser.id,
            type: isGift ? 'gift_sent' : 'tip_sent',
            title: isGift ? `Sent ${giftName} gift` : `Super Chat $${vars.amount}`,
            amount: vars.amount,
            recipient_id: recipientId,
          }),
          recipientId && base44.entities.Activity.create({
            user_id: recipientId,
            type: isGift ? 'gift_received' : 'tip_received',
            title: isGift ? `Received ${giftName} from ${currentUser.full_name || 'viewer'}` : `Super Chat $${vars.amount} from ${currentUser.full_name || 'viewer'}`,
            amount: vars.amount,
            sender_id: currentUser.id,
          }),
        ]);
      }
    },
    onError: () => { toast.error('Failed to send'); setConfirming(false); },
  });

  const handleSuperChat = () => {
    if (!currentUser) { toast.error('Sign in to send'); return; }
    setConfirming(true);
  };

  const confirmSend = () => {
    sendMutation.mutate({
      type: 'super_chat',
      amount: effectiveAmount.value,
      finalMessage: buildMessage(),
    });
  };

  const handleGift = (gift) => {
    if (!currentUser) { toast.error('Sign in to send'); return; }
    sendMutation.mutate({
      type: 'gift',
      amount: gift.price,
      giftType: gift.id,
      finalMessage: `Sent a ${gift.name}!`,
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
              ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10'
              : 'border-white/10 text-white/40 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]/60'
          }`}
        >
          <Star className="w-3 h-3" /> Super Chat
        </button>
        <button
          onClick={() => setMode(mode === 'gift' ? null : 'gift')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
            mode === 'gift'
              ? 'border-[#C0392B] text-[#C0392B] bg-[#C0392B]/10'
              : 'border-white/10 text-white/40 hover:border-[#C0392B]/30 hover:text-[#C0392B]/60'
          }`}
        >
          <Gift className="w-3 h-3" /> Gift
        </button>
        {mode && (
          <button onClick={() => { setMode(null); setConfirming(false); }} className="ml-auto text-white/20 hover:text-white/50">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Sent history pills */}
      <AnimatePresence>
        {sentHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-1 px-2 pb-1 flex-wrap"
          >
            {sentHistory.map(h => (
              <span key={h.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}>
                <CheckCircle className="w-2.5 h-2.5" /> {h.emoji} ${h.amount} sent
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Super Chat panel */}
      <AnimatePresence>
        {mode === 'superchat' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#D4AF37]/10"
          >
            <div className="p-2 space-y-2">
              {/* Amount grid */}
              <div className="grid grid-cols-6 gap-1">
                {SUPER_AMOUNTS.map(a => (
                  <button
                    key={a.value}
                    onClick={() => { setSelectedAmount(a); setCustomAmount(''); try { localStorage.setItem('superchat_amount_idx', String(SUPER_AMOUNTS.indexOf(a))); } catch {} }}
                    className={`py-1.5 rounded text-[11px] font-bold transition-all border ${
                      !customAmount && selectedAmount.value === a.value
                        ? 'border-current'
                        : 'border-white/10 text-white/40 hover:border-white/20'
                    }`}
                    style={!customAmount && selectedAmount.value === a.value ? { color: a.color, borderColor: a.color, background: `${a.color}15` } : {}}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <input
                type="number"
                min="1"
                max="500"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                placeholder="Custom $"
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/40"
              />

              {/* Message style */}
              <div className="flex gap-1">
                {MSG_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setMsgStyle(s.id); try { localStorage.setItem('superchat_msg_style', s.id); } catch {} }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                      msgStyle === s.id
                        ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10'
                        : 'border-white/10 text-white/30'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Quick messages */}
              <div className="flex gap-1 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                {QUICK_MESSAGES.map(qm => (
                  <button
                    key={qm}
                    onClick={() => setMessage(qm)}
                    className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold border border-white/10 text-white/40 hover:border-white/25 hover:text-white/60 transition-all whitespace-nowrap"
                  >
                    {qm}
                  </button>
                ))}
              </div>

              {/* Message input */}
              <div className="space-y-0.5">
                <div className="flex gap-1.5">
                  <input
                    value={message}
                    onChange={e => setMessage(e.target.value.slice(0, 100))}
                    placeholder="Add a message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/40"
                    style={msgStyle === 'hype' ? { background: 'rgba(192,57,43,0.15)', borderColor: 'rgba(192,57,43,0.4)' } : {}}
                  />
                  <button
                    onClick={handleSuperChat}
                    disabled={sendMutation.isPending}
                    style={{ height: 28, padding: '0 8px', borderRadius: 6, border: 'none', background: effectiveAmount.color, color: '#000', fontWeight: 700, fontSize: 10, cursor: sendMutation.isPending ? 'not-allowed' : 'pointer' }}
                  >
                    {sendMutation.isPending ? '...' : `${effectiveAmount.emoji} Send`}
                  </button>
                </div>
                {message.length > 0 && (
                  <div className="flex justify-end">
                    <span style={{ fontSize: 9, color: message.length > 90 ? '#C0392B' : 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {message.length}/100
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Confirm overlay */}
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="mx-4 p-5 rounded-xl text-center max-w-xs w-full"
              style={{ background: 'rgba(8,11,24,0.98)', border: '1px solid rgba(212,175,55,0.3)' }}
            >
              <div className="text-3xl mb-2">{effectiveAmount.emoji}</div>
              <p className="text-sm font-black text-white mb-1">Confirm Super Chat</p>
              <p className="text-xs text-white/60 mb-1">
                Send <span style={{ color: effectiveAmount.color }} className="font-bold">${effectiveAmount.value}</span>
                {recipientName ? ` to ${recipientName}` : ''}?
              </p>
              <p className="text-[10px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Creator receives <span style={{ color: '#6DBF7E', fontWeight: 700 }}>${(Math.floor(effectiveAmount.value * 0.9 * 100) / 100).toFixed(2)}</span> (90%)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-2 rounded-lg text-xs font-bold border border-white/20 text-white/50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSend}
                  disabled={sendMutation.isPending}
                  className="flex-1 py-2 rounded-lg text-xs font-bold text-black"
                  style={{ background: effectiveAmount.color }}
                >
                  {sendMutation.isPending ? 'Sending...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {mode === 'gift' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#C0392B]/10"
          >
            <div className="p-2">
              <div className="grid grid-cols-6 gap-1">
                {GIFTS.map(gift => (
                  <button
                    key={gift.id}
                    onClick={() => handleGift(gift)}
                    disabled={sendMutation.isPending}
                    className="flex flex-col items-center py-1.5 rounded border border-white/10 hover:border-[#C0392B]/40 hover:bg-[#C0392B]/10 transition-all"
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
