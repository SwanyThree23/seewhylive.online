-- Panel upgrades: 9+ guest slots (default ceiling 20), expandable tiles,
-- audio-only toggle, private rooms with host-chosen gating mode.

BEGIN;

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_audio_only BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Host picks per-room which gating method a private room uses.
-- NULL when is_private = false.
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS private_gating_mode TEXT
  CHECK (private_gating_mode IN ('invite_code', 'approval'));

-- Default ceiling matches the platform's hard MAX_PANEL_GUESTS constant.
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS max_panel_guests INT NOT NULL DEFAULT 20
  CHECK (max_panel_guests <= 20);

CREATE TABLE IF NOT EXISTS room_panel_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  slot_index INT NOT NULL,          -- 0 = host, 1-N = guests
  user_id UUID REFERENCES users(id),
  is_expanded BOOLEAN NOT NULL DEFAULT false,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, slot_index)
);

CREATE INDEX IF NOT EXISTS idx_room_panel_slots_room ON room_panel_slots(room_id);

CREATE TABLE IF NOT EXISTS room_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_join_requests_pending ON room_join_requests(room_id, status)
  WHERE status = 'pending';

COMMIT;
