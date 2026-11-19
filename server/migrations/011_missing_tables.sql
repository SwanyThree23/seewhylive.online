-- Migration 011: create missing tables and fix challenge_completions
-- rewardsService.js references pricing_tiers, user_settings, and inserts
-- tenant_id into challenge_completions.

-- challenge_completions: add tenant_id (rewardsService.completeChallenge inserts it)
ALTER TABLE challenge_completions
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- Add unique constraint required by ON CONFLICT behavior in completeChallenge
ALTER TABLE challenge_completions
  DROP CONSTRAINT IF EXISTS challenge_completions_pkey CASCADE;
ALTER TABLE challenge_completions
  ADD CONSTRAINT challenge_completions_pkey PRIMARY KEY (challenge_id, user_id);

-- pricing_tiers: platform/tenant-level subscription pricing
-- rewardsService.getTiers() selects * ordered by price with optional tenant_id filter
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  price       INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  features    JSONB,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_tenant ON pricing_tiers(tenant_id);

-- user_settings: key-value store for per-user preferences
-- rewardsService.getSelectedTier / setSelectedTier use it
CREATE TABLE IF NOT EXISTS user_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id    UUID REFERENCES tenants(id) ON DELETE CASCADE,
  setting_key  TEXT NOT NULL,
  setting_value JSONB,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, tenant_id, setting_key)
);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id, tenant_id);
