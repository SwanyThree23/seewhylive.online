-- Migration 004: Add tenants and music_video_jobs tables
-- Applied: 2026-11-19

CREATE TABLE IF NOT EXISTS tenants (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  subdomain       TEXT        NOT NULL UNIQUE,
  plan_tier       TEXT        NOT NULL DEFAULT 'free',
  feature_flags   JSONB       NOT NULL DEFAULT '{}',
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  owner_id        UUID        REFERENCES users(id) ON DELETE SET NULL,
  owner_email     TEXT,
  active          BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tenants_subdomain_idx ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS tenants_stripe_sub_idx ON tenants(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS music_video_jobs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  audio_path  TEXT        NOT NULL,
  style       TEXT        NOT NULL DEFAULT 'neon_pulse',
  status      TEXT        NOT NULL DEFAULT 'pending',
  output_path TEXT,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS music_video_jobs_status_idx ON music_video_jobs(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS music_video_jobs_user_idx  ON music_video_jobs(user_id);
