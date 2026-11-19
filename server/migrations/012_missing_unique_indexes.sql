-- Migration 012: add missing unique indexes required by ON CONFLICT clauses
-- Without these, INSERT ... ON CONFLICT ... statements throw:
--   "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- loyaltyService.js + rewardsService.js: dedup loyalty events by (user, source, source_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_loyalty_events_dedup
  ON loyalty_point_events(user_id, source, source_id)
  WHERE source_id IS NOT NULL;

-- battleService.js: one vote per voter per battle
CREATE UNIQUE INDEX IF NOT EXISTS uq_pk_battle_votes_voter
  ON pk_battle_votes(battle_id, voter_id);

-- guestService.js: one guest row per (stream, user)
CREATE UNIQUE INDEX IF NOT EXISTS uq_stream_guests_stream_user
  ON stream_guests(stream_id, user_id);
