import { useState, useEffect } from 'react';
import { useSubscriptionCount } from './useSubscriptionCount';

/**
 * Returns live tip total and subscription count for StreamGoals.
 * Fetches the creator's existing tip total from /api/creator/analytics
 * and increments it via StreamEventBus onTipReceived callbacks.
 *
 * Usage:
 *   var { tipTotal, subCount, onTipReceived } = useStreamGoalMetrics(userId, activeRoomId);
 *   // Wire onTipReceived to StreamEventBus:
 *   //   <StreamEventBus onTipReceived={onTipReceived} ... />
 */
export function useStreamGoalMetrics(userId, activeRoomId) {
  var [tipTotal, setTipTotal] = useState(0);
  var subCount = useSubscriptionCount(userId || null);

  // Seed tip total from server analytics on mount / room change
  useEffect(function() {
    if (!userId) return;
    fetch('/api/creator/analytics?period=today', { credentials: 'include' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (data && data.byType && data.byType.tip) {
          setTipTotal(Math.floor(data.byType.tip / 100));
        }
      })
      .catch(function() {});
  }, [userId, activeRoomId]);

  function onTipReceived(msg) {
    setTipTotal(function(t) { return t + Math.floor((msg && msg.tip_amount) || 0); });
  }

  return { tipTotal: tipTotal, subCount: subCount, onTipReceived: onTipReceived };
}
