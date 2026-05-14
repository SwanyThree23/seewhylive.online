import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingBag, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const REWARD_ICONS = {
  soundboard: '🔊', song_request: '🎵', pin_message: '📌',
  shoutout: '📣', badge: '🏅', custom_emote: '✨',
  discount_code: '🎟️', exclusive_content: '🔒',
};

const REWARD_LABELS = {
  soundboard: 'Sound Effect', song_request: 'Song Request', pin_message: 'Pin My Message',
  shoutout: 'Shoutout', badge: 'Badge', custom_emote: 'Custom Emote',
  discount_code: 'Discount Code', exclusive_content: 'Exclusive Content',
};

export default function RewardShop({ creatorId, roomId, currentUser }) {
  const [redeeming, setRedeeming] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [showMessage, setShowMessage] = useState(null);
  const qc = useQueryClient();

  const { data: rewards = [] } = useQuery({
    queryKey: ['loyalty-rewards', creatorId],
    queryFn: () => base44.entities.LoyaltyReward.filter({ creator_id: creatorId, is_active: true }),
    enabled: !!creatorId,
  });

  const { data: loyalty } = useQuery({
    queryKey: ['viewer-loyalty', currentUser?.id, creatorId],
    queryFn: () => base44.entities.ViewerLoyalty.filter({ user_id: currentUser?.id, creator_id: creatorId }).then(r => r[0]),
    enabled: !!currentUser?.id && !!creatorId,
    refetchInterval: 10000,
  });

  const balance = loyalty?.loyalty_points || 0;

  const redeemMutation = useMutation({
    mutationFn: ({ rewardId, message }) =>
      base44.functions.invoke('redeemReward', { reward_id: rewardId, room_id: roomId, message }),
    onSuccess: (res) => {
      if (res.data?.error) { toast.error(res.data.error); return; }
      toast.success('Reward redeemed! 🎉');
      setRedeeming(null);
      setMessageInput('');
      setShowMessage(null);
      qc.invalidateQueries(['viewer-loyalty', currentUser?.id, creatorId]);
    },
    onError: () => toast.error('Redemption failed'),
  });

  const handleRedeem = (reward) => {
    if (['song_request', 'pin_message'].includes(reward.reward_type)) {
      setShowMessage(reward);
    } else {
      setRedeeming(reward.id);
      redeemMutation.mutate({ rewardId: reward.id });
    }
  };

  const confirmWithMessage = (reward) => {
    setRedeeming(reward.id);
    redeemMutation.mutate({ rewardId: reward.id, message: messageInput });
  };

  if (rewards.length === 0) {
    return (
      <div className="text-center py-8 text-white/30">
        <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-xs">No rewards available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold uppercase text-white/40" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
          Reward Shop
        </span>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <Zap className="w-3 h-3 text-[#d4af37]" />
          <span className="text-xs font-black font-mono text-[#d4af37]">{balance.toLocaleString()}</span>
          <span className="text-[9px] text-white/40">pts</span>
        </div>
      </div>

      <div className="space-y-2">
        {rewards.map(reward => {
          const canAfford = balance >= reward.points_required;
          const isRedeeming = redeeming === reward.id && redeemMutation.isPending;
          return (
            <motion.div key={reward.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-3 flex items-center gap-3 transition-all"
              style={{
                background: canAfford ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${canAfford ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}>
              <div className="text-2xl w-9 h-9 flex items-center justify-center rounded-xl shrink-0"
                style={{ background: 'rgba(0,0,0,0.3)' }}>
                {reward.icon || REWARD_ICONS[reward.reward_type] || '🎁'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{reward.name}</p>
                <p className="text-[10px] text-white/40 truncate">{reward.description || REWARD_LABELS[reward.reward_type]}</p>
                {reward.stock != null && (
                  <p className="text-[9px] text-orange-400/70">{reward.stock - (reward.claimed_count || 0)} left</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5 text-[#d4af37]" />
                  <span className="text-[10px] font-black text-[#d4af37] font-mono">{reward.points_required.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={!canAfford || isRedeeming}
                  className="text-[9px] font-black uppercase px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-40"
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    background: canAfford ? '#d4af37' : 'rgba(255,255,255,0.06)',
                    color: canAfford ? '#000' : 'rgba(255,255,255,0.3)',
                  }}>
                  {isRedeeming ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Redeem'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowMessage(null)}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-5 space-y-4"
              style={{ background: '#0d0618', border: '1px solid rgba(212,175,55,0.2)' }}>
              <p className="text-sm font-bold text-white">
                {showMessage.reward_type === 'song_request' ? '🎵 Request a Song' : '📌 Pin Your Message'}
              </p>
              <Input
                placeholder={showMessage.reward_type === 'song_request' ? 'Song name + artist...' : 'Message to pin...'}
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                className="text-white bg-white/5 border-white/10"
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 text-white/50" onClick={() => setShowMessage(null)}>Cancel</Button>
                <Button
                  className="flex-1 font-bold"
                  style={{ background: '#d4af37', color: '#000' }}
                  disabled={!messageInput.trim() || redeemMutation.isPending}
                  onClick={() => confirmWithMessage(showMessage)}>
                  {redeemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}