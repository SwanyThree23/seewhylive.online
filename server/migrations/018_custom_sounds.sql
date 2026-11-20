-- Migration 018: create custom_sounds table
-- server/routes/sounds.js inserts/queries/deletes from this table via
-- the Supabase REST API. Without it every sound upload and fetch returns a
-- 404 from PostgREST.

CREATE TABLE IF NOT EXISTS custom_sounds (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  creator_id   UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  label        TEXT        NOT NULL,
  storage_path TEXT        NOT NULL,
  playback_url TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_sounds_creator
  ON custom_sounds(tenant_id, creator_id);
