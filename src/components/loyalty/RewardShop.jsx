import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const INPUT_STYLE = { width:'100%', padding:'10px 14px', background:'rgba(17,8,34,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' };

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
      <div style={{ textAlign:'center', padding:'32px 0', color:'rgba(255,255,255,0.3)' }}>
        <ShoppingBag style={{ width:32, height:32, margin:'0 auto 8px', opacity:0.3 }} />
        <p style={{ fontSize:12 }}>No rewards available yet</p>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 4px' }}>
        <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:'rgba(255,255,255,0.4)', fontFamily:'Barlow Condensed, sans-serif', letterSpacing:'0.1em' }}>
          Reward Shop
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', borderRadius:8, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.2)' }}>
          <Zap style={{ width:12, height:12, color:'#d4af37' }} />
          <span style={{ fontSize:12, fontWeight:900, fontFamily:'monospace', color:'#d4af37' }}>{balance.toLocaleString()}</span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>pts</span>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {rewards.map(reward => {
          const canAfford = balance >= reward.points_required;
          const isRedeeming = redeeming === reward.id && redeemMutation.isPending;
          return (
            <motion.div key={reward.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{
                borderRadius:12, padding:12, display:'flex', alignItems:'center', gap:12,
                background: canAfford ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${canAfford ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
                transition:'all 0.15s',
              }}>
              <div style={{ fontSize:24, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:12, background:'rgba(0,0,0,0.3)', flexShrink:0 }}>
                {reward.icon || REWARD_ICONS[reward.reward_type] || '🎁'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:12, fontWeight:700, color:'#fff', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reward.name}</p>
                <p style={{ fontSize:10, color:'rgba(255,255,255,0.4)', margin:'2px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reward.description || REWARD_LABELS[reward.reward_type]}</p>
                {reward.stock != null && (
                  <p style={{ fontSize:11, color:'rgba(251,146,60,0.7)', margin:'2px 0 0' }}>{reward.stock - (reward.claimed_count || 0)} left</p>
                )}
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                  <Zap style={{ width:10, height:10, color:'#d4af37' }} />
                  <span style={{ fontSize:10, fontWeight:900, color:'#d4af37', fontFamily:'monospace' }}>{reward.points_required.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={!canAfford || isRedeeming}
                  style={{
                    fontSize:11, fontWeight:900, textTransform:'uppercase', padding:'4px 10px', borderRadius:8,
                    border:'none', cursor: (!canAfford || isRedeeming) ? 'not-allowed' : 'pointer',
                    fontFamily:'Barlow Condensed, sans-serif',
                    background: canAfford ? '#d4af37' : 'rgba(255,255,255,0.06)',
                    color: canAfford ? '#000' : 'rgba(255,255,255,0.3)',
                    opacity: (!canAfford || isRedeeming) ? 0.6 : 1,
                    transition:'all 0.15s',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                  {isRedeeming ? <Loader2 style={{ width:12, height:12 }} className="animate-spin" /> : 'Redeem'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:16, background:'rgba(0,0,0,0.7)' }}
            onClick={() => setShowMessage(null)}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
              onClick={e => e.stopPropagation()}
              style={{ width:'100%', maxWidth:384, borderRadius:16, padding:20, background:'#0d0618', border:'1px solid rgba(212,175,55,0.2)', display:'flex', flexDirection:'column', gap:16 }}>
              <p style={{ fontSize:14, fontWeight:700, color:'#fff', margin:0 }}>
                {showMessage.reward_type === 'song_request' ? '🎵 Request a Song' : '📌 Pin Your Message'}
              </p>
              <input
                style={INPUT_STYLE}
                placeholder={showMessage.reward_type === 'song_request' ? 'Song name + artist...' : 'Message to pin...'}
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                autoFocus
              />
              <div style={{ display:'flex', gap:8 }}>
                <button
                  onClick={() => setShowMessage(null)}
                  style={{ flex:1, padding:'10px', background:'transparent', color:'rgba(255,255,255,0.5)', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'Barlow Condensed, sans-serif' }}
                >
                  Cancel
                </button>
                <button
                  style={{ flex:1, padding:'10px', background:'#d4af37', color:'#000', border:'none', borderRadius:8, fontWeight:700, cursor: (!messageInput.trim() || redeemMutation.isPending) ? 'not-allowed' : 'pointer', opacity: (!messageInput.trim() || redeemMutation.isPending) ? 0.6 : 1, fontSize:13, fontFamily:'Barlow Condensed, sans-serif', display:'flex', alignItems:'center', justifyContent:'center' }}
                  disabled={!messageInput.trim() || redeemMutation.isPending}
                  onClick={() => confirmWithMessage(showMessage)}>
                  {redeemMutation.isPending ? <Loader2 style={{ width:16, height:16 }} className="animate-spin" /> : 'Redeem'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
