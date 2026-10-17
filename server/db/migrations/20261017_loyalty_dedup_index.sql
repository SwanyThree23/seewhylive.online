-- Prevent double-awarding of loyalty points for the same (user, source, source_id) triple.
-- watch_time events pass source_id = NULL so they are excluded from the constraint;
-- session-level throttling (watchHeartbeatThrottle) already guards those.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_loyalty_events_dedup
  ON loyalty_point_events (user_id, source, source_id)
  WHERE source_id IS NOT NULL;
