import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
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

  const followMutation = useMutation({
    mutationFn: () => base44.entities.Follow.create({
      follower_id: currentUser.id,
      following_id: targetUserId,
      follower_name: currentUser.full_name || currentUser.email,
      following_name: targetUserName,
    }),
    onSuccess: () => {
      toast.success(`Following ${targetUserName || 'creator'}!`);
      qc.invalidateQueries(['follow', currentUser?.id, targetUserId]);
      qc.invalidateQueries(['followers', targetUserId]);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => base44.entities.Follow.delete(followRecord.id),
    onSuccess: () => {
      toast.success('Unfollowed');
      qc.invalidateQueries(['follow', currentUser?.id, targetUserId]);
      qc.invalidateQueries(['followers', targetUserId]);
    },
  });

  // Don't show button for own profile
  if (!currentUser || currentUser.id === targetUserId) return null;

  const isFollowing = !!followRecord;
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
    <Button
      size={size}
      variant={isFollowing ? 'outline' : 'default'}
      className={`gap-1.5 ${className}`}
      disabled={isPending}
      onClick={() => isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}
    >
      {isFollowing ? (
        <><UserMinus className="w-3.5 h-3.5" /> Following</>
      ) : (
        <><UserPlus className="w-3.5 h-3.5" /> Follow</>
      )}
    </Button>
  );
}