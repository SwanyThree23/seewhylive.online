-- Add UNIQUE constraint required by ON CONFLICT (battle_id, voter_id) in battleService.castVote.
-- Without this, every vote INSERT throws: "there is no unique or exclusion constraint
-- matching the ON CONFLICT specification".
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_pk_battle_votes_battle_voter'
  ) THEN
    ALTER TABLE pk_battle_votes
      ADD CONSTRAINT uq_pk_battle_votes_battle_voter UNIQUE (battle_id, voter_id);
  END IF;
END $$;
