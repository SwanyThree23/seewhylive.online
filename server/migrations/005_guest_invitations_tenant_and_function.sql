-- Migration 005: add tenant_id to invitation tables and create accept_guest_invitation function

-- Add tenant_id to guest_invitations (direct user-to-user invites)
ALTER TABLE guest_invitations
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- Add tenant_id to stream_guest_invites (shareable token links)
ALTER TABLE stream_guest_invites
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- accept_guest_invitation(token) — called by POST /api/guest-auth/token
-- Atomically marks the invite as used and returns the data needed to issue a JWT.
CREATE OR REPLACE FUNCTION accept_guest_invitation(p_token TEXT)
RETURNS TABLE(
  invitation_id  UUID,
  tenant_id      UUID,
  destination_id UUID,
  stream_id      UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE stream_guest_invites
  SET
    used_at    = COALESCE(used_at, now()),
    use_count  = COALESCE(use_count, 0) + 1
  WHERE guest_token = p_token
    AND revoked_at IS NULL
    AND (max_uses IS NULL OR use_count < max_uses)
  RETURNING
    stream_guest_invites.id        AS invitation_id,
    stream_guest_invites.tenant_id AS tenant_id,
    NULL::uuid                     AS destination_id,
    stream_guest_invites.stream_id AS stream_id;
END;
$$;
