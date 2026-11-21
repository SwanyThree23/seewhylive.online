import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

export default function FollowButton(props) {
  var targetUserId = props.targetUserId;
  var targetUserName = props.targetUserName;
  var size = props.size || 'sm';
  var className = props.className || '';

  var qc = useQueryClient();

  var userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });
  var currentUser = userQuery.data || null;
  var currentUserId = (currentUser && currentUser.id) || null;

  var followQuery = useQuery({
    queryKey: ['follow', currentUserId, targetUserId],
    queryFn: function() {
      if (!currentUserId || !targetUserId || currentUserId === targetUserId) return Promise.resolve(null);
      return base44.entities.Follow.filter({ follower_id: currentUserId, following_id: targetUserId }).then(function(results) {
        return (results && results[0]) || null;
      });
    },
    enabled: !!(currentUserId && targetUserId && currentUserId !== targetUserId),
  });
  var followRecord = followQuery.data || null;

  var followKey = ['follow', currentUserId, targetUserId];

  var followMutation = useMutation({
    mutationFn: function() {
      return base44.entities.Follow.create({
        follower_id: currentUserId,
        following_id: targetUserId,
        follower_name: (currentUser && (currentUser.full_name || currentUser.email)) || '',
        following_name: targetUserName || '',
      });
    },
    onMutate: function() {
      qc.cancelQueries({ queryKey: followKey });
      var prev = qc.getQueryData(followKey);
      qc.setQueryData(followKey, { id: '__optimistic__', follower_id: currentUserId, following_id: targetUserId });
      return { prev: prev };
    },
    onError: function(err, vars, context) {
      qc.setQueryData(followKey, context && context.prev);
      toast.error('Could not follow. Please try again.');
    },
    onSuccess: function() {
      toast.success('Following ' + (targetUserName || 'creator') + '!');
      qc.invalidateQueries({ queryKey: followKey });
      qc.invalidateQueries({ queryKey: ['followers', targetUserId] });
      Promise.allSettled([
        base44.entities.Activity.create({
          user_id: currentUserId,
          type: 'follow',
          title: 'Now following ' + (targetUserName || 'a creator'),
          recipient_id: targetUserId,
        }),
        base44.entities.Activity.create({
          user_id: targetUserId,
          type: 'follow',
          title: ((currentUser && currentUser.full_name) || 'Someone') + ' is now following you',
          sender_id: currentUserId,
        }),
      ]);
    },
  });

  var unfollowMutation = useMutation({
    mutationFn: function() {
      return base44.entities.Follow.delete(followRecord.id);
    },
    onMutate: function() {
      qc.cancelQueries({ queryKey: followKey });
      var prev = qc.getQueryData(followKey);
      qc.setQueryData(followKey, null);
      return { prev: prev };
    },
    onError: function(err, vars, context) {
      qc.setQueryData(followKey, context && context.prev);
      toast.error('Could not unfollow. Please try again.');
    },
    onSuccess: function() {
      toast.success('Unfollowed');
      qc.invalidateQueries({ queryKey: followKey });
      qc.invalidateQueries({ queryKey: ['followers', targetUserId] });
    },
  });

  if (!currentUser || currentUserId === targetUserId) return null;

  var isFollowing = !!followRecord;
  var isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
    <button
      disabled={isPending}
      onClick={function() { if (isFollowing) { unfollowMutation.mutate(); } else { followMutation.mutate(); } }}
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: size === 'sm' ? '5px 12px' : '8px 18px',
        fontSize: size === 'sm' ? 12 : 14,
        fontWeight: 700,
        border: isFollowing ? '1px solid rgba(255,255,255,0.2)' : 'none',
        background: isFollowing ? 'transparent' : '#D4AF37',
        color: isFollowing ? '#fff' : '#000',
        borderRadius: 8,
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
        fontFamily: 'Barlow Condensed, sans-serif',
        transition: 'all 0.15s',
      }}
    >
      {isFollowing ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><UserMinus style={{ width: 14, height: 14 }} /> Following</span>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><UserPlus style={{ width: 14, height: 14 }} /> Follow</span>
      )}
    </button>
  );
}
