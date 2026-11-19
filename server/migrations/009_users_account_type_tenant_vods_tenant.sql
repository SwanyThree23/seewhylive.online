-- Migration 009: add account_type and tenant_id to users; add tenant_id to vods
-- users.js routes use account_type in SELECT and tenant_id in WHERE clauses.
-- inviteService.js checks WHERE ... AND tenant_id = $2 on users.
-- vod.js uses Supabase REST with ?tenant_id=eq.X filter on vods.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'standard';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

ALTER TABLE vods
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_vods_tenant_id ON vods(tenant_id);
