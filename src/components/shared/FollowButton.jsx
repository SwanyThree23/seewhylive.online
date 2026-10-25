import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

export default function FollowButton({ targetUserId, targetUserName, size = 'sm', className = '' }) {
  const qc = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: followRecord } = useQuery({
    queryKey: ['follow', currentUser?.id, targetUserId],
    queryFn: async () => {
      if (!currentUser?.id || !targetUserId || currentUser.id === targetUserId) return null;
      const results = await base44.entities.Follow.filter({ follower_id: currentUser.id, following_id: targetUserId });
      return results[0] || null;
    },
    enabled: !!currentUser?.id && !!targetUserId && currentUser?.id !== targetUserId,
  });

  const followKey = ['follow', currentUser?.id, targetUserId];

  const followMutation = useMutation({
    mutationFn: () => base44.entities.Follow.create({
      follower_id: currentUser.id,
      following_id: targetUserId,
      follower_name: currentUser.full_name || currentUser.email,
      following_name: targetUserName,
    }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: followKey });
      const prev = qc.getQueryData(followKey);
      // Optimistically mark as following so the button flips instantly
      qc.setQueryData(followKey, { id: '__optimistic__', follower_id: currentUser?.id, following_id: targetUserId });
      return { prev };
    },
    onError: (err, vars, context) => {
      qc.setQueryData(followKey, context?.prev);
      toast.error('Could not follow. Please try again.');
    },
    onSuccess: () => {
      toast.success(`Following ${targetUserName || 'creator'}!`);
      qc.invalidateQueries({ queryKey: followKey });
      qc.invalidateQueries({ queryKey: ['followers', targetUserId] });
      Promise.allSettled([
        base44.entities.Activity.create({
          user_id: currentUser.id,
          type: 'follow',
          title: `Now following ${targetUserName || 'a creator'}`,
          recipient_id: targetUserId,
        }),
        base44.entities.Activity.create({
          user_id: targetUserId,
          type: 'follow',
          title: `${currentUser.full_name || 'Someone'} is now following you`,
          sender_id: currentUser.id,
        }),
      ]);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => base44.entities.Follow.delete(followRecord.id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: followKey });
      const prev = qc.getQueryData(followKey);
      // Optimistically mark as not following so the button flips instantly
      qc.setQueryData(followKey, null);
      return { prev };
    },
    onError: (err, vars, context) => {
      qc.setQueryData(followKey, context?.prev);
      toast.error('Could not unfollow. Please try again.');
    },
    onSuccess: () => {
      toast.success('Unfollowed');
      qc.invalidateQueries({ queryKey: followKey });
      qc.invalidateQueries({ queryKey: ['followers', targetUserId] });
    },
  });

  // Don't show button for own profile
  if (!currentUser || currentUser.id === targetUserId) return null;

  const isFollowing = !!followRecord;
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
    <button
      disabled={isPending}
      onClick={() => isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}
      className={className}
      style={{
        display:'inline-flex', alignItems:'center', gap:6,
        padding: size === 'sm' ? '5px 12px' : '8px 18px',
        fontSize: size === 'sm' ? 12 : 14,
        fontWeight:700,
        border: isFollowing ? '1px solid rgba(255,255,255,0.2)' : 'none',
        background: isFollowing ? 'transparent' : '#D4AF37',
        color: isFollowing ? '#fff' : '#000',
        borderRadius:8,
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
        fontFamily:'Barlow Condensed, sans-serif',
        transition:'all 0.15s',
      }}
    >
      {isFollowing ? (
        <><UserMinus style={{ width:14, height:14 }} /> Following</>
      ) : (
        <><UserPlus style={{ width:14, height:14 }} /> Follow</>
      )}
    </button>
  );
}
