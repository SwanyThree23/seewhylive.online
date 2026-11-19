-- Migration 008: add tenant_id to challenges, loyalty, and reward tables
-- challengeService.js and loyaltyService.js reference tenant_id on all these tables.

ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_challenges_tenant_id ON challenges(tenant_id);

ALTER TABLE loyalty_point_events
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_loyalty_events_tenant ON loyalty_point_events(tenant_id);

-- user_loyalty: loyaltyService uses ON CONFLICT (user_id, tenant_id) — needs unique constraint
ALTER TABLE user_loyalty
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
-- Drop old unique constraint on user_id alone if it exists, replace with (user_id, tenant_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'user_loyalty'::regclass AND contype = 'u' AND conname != 'user_loyalty_user_id_tenant_id_key'
  ) THEN
    -- Remove any single-column unique constraint on user_id
    EXECUTE (
      SELECT 'ALTER TABLE user_loyalty DROP CONSTRAINT ' || conname
      FROM pg_constraint
      WHERE conrelid = 'user_loyalty'::regclass AND contype = 'u' AND conname != 'user_loyalty_user_id_tenant_id_key'
      LIMIT 1
    );
  END IF;
END$$;
ALTER TABLE user_loyalty
  DROP CONSTRAINT IF EXISTS user_loyalty_user_id_key;
ALTER TABLE user_loyalty
  ADD CONSTRAINT IF NOT EXISTS user_loyalty_user_id_tenant_id_key UNIQUE (user_id, tenant_id);

ALTER TABLE reward_tiers
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_reward_tiers_tenant ON reward_tiers(tenant_id);
