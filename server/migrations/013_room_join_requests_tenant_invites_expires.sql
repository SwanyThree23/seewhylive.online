-- Migration 013: add missing columns
--   room_join_requests.tenant_id — panelRooms.js:44 WHERE r.tenant_id = $2 throws
--     "column r.tenant_id does not exist" on every join-approval queue request
--   stream_guest_invites.expires_at — inviteService.redeemInviteLink checks
--     (expires_at IS NULL OR expires_at > now()), column doesn't exist

ALTER TABLE room_join_requests
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_room_join_requests_tenant
  ON room_join_requests(tenant_id);

ALTER TABLE stream_guest_invites
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
