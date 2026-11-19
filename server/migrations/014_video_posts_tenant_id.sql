-- Migration 014: add tenant_id to video_posts
-- publicPreview.js WHERE p.tenant_id = $2 fails without this column

ALTER TABLE video_posts
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_video_posts_tenant
  ON video_posts(tenant_id);
