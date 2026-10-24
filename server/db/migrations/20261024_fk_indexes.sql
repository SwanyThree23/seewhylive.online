-- FK indexes for frequently-joined foreign key columns not covered by
-- earlier migration files. All use CONCURRENTLY to avoid locking prod.

-- pk_battles: challenger, opponent, room lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pk_battles_challenger_id  ON pk_battles(challenger_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pk_battles_opponent_id    ON pk_battles(opponent_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pk_battles_challenger_room ON pk_battles(challenger_room_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pk_battles_opponent_room  ON pk_battles(opponent_room_id);

-- room_panel_slots: user lookup (stream_id already indexed in panel_upgrades.sql)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_panel_slots_user_id  ON room_panel_slots(user_id);

-- streams: stream_key must be unique — two live ingest URLs must never collide
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_streams_stream_key ON streams(stream_key);
