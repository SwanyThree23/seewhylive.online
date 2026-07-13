import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Returns the live count of active subscribers for a given creator.
 * Polls every 30 s so it stays fresh during a stream without hammering the API.
 */
export function useSubscriptionCount(creatorId) {
  const { data: count = 0 } = useQuery({
    queryKey: ['sub-count', creatorId],
    queryFn: () =>
      base44.entities.Subscription
        .filter({ creator_id: creatorId, status: 'active' })
        .then(subs => subs.length),
    enabled: !!creatorId,
    refetchInterval: 30_000,
  });
  return count;
}
