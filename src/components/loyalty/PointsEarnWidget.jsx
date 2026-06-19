import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Invisible component that auto-awards watch-time loyalty points every 5 minutes.
 */
export default function PointsEarnWidget({ userId, creatorId, roomId, isHost }) {
  const qc = useQueryClient();

  const awardMutation = useMutation({
    mutationFn: async ({ reason }) => {
      const existing = await base44.entities.ViewerLoyalty.filter({ user_id: userId, creator_id: creatorId }).then(r => r[0]).catch(() => null);
      const pts = 10;
      if (existing?.id) {
        return base44.entities.ViewerLoyalty.update(existing.id, { loyalty_points: (existing.loyalty_points || 0) + pts, updated_at: new Date().toISOString() });
      }
      return base44.entities.ViewerLoyalty.create({ user_id: userId, creator_id: creatorId, room_id: roomId, loyalty_points: pts, created_at: new Date().toISOString() });
    },
    onSuccess: () => qc.invalidateQueries(['viewer-loyalty', userId, creatorId]),
  });

  useEffect(() => {
    if (!userId || !creatorId || isHost) return;
    const interval = setInterval(() => {
      awardMutation.mutate({ reason: 'watch_time', metadata: {} });
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, creatorId, isHost]);

  return null;
}