-- Prevent two active battles in the same room simultaneously.
-- Partial index covers only the hot path (status = 'active') without
-- conflicting with the many non-active rows (pending, accepted, ended, declined).
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_pk_battles_room_active
  ON pk_battles(room_id)
  WHERE status = 'active' AND room_id IS NOT NULL;
