-- Migration 010: add tenant_id and username to music_video_jobs
-- musicVideo.js routes INSERT with tenant_id and username, and all
-- SELECT/DELETE queries include AND tenant_id = $N.

ALTER TABLE music_video_jobs
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

ALTER TABLE music_video_jobs
  ADD COLUMN IF NOT EXISTS username TEXT;

CREATE INDEX IF NOT EXISTS idx_mvj_tenant_user ON music_video_jobs(tenant_id, user_id);
