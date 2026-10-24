-- Missing Postgres indexes for seewhylive.online
-- Run once against the Supabase project. All statements are idempotent.
-- Generated from query analysis of server/services/*.js and server/routes/*.js.

-- pk_battles: filtered by tenant_id + status frequently
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pk_battles_tenant
  ON pk_battles(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pk_battles_tenant_status
  ON pk_battles(tenant_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pk_battles_room_tenant
  ON pk_battles(room_id, tenant_id);

-- pk_battle_teams: looked up by battle_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pk_battle_teams_battle
  ON pk_battle_teams(battle_id);

-- challenges: filtered by tenant_id + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_tenant
  ON challenges(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_tenant_status
  ON challenges(tenant_id, status);

-- challenge_completions: joined on challenge_id and filtered by user_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenge_completions_user
  ON challenge_completions(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenge_completions_challenge
  ON challenge_completions(challenge_id);

-- streams: filtered by creator_id and tenant_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streams_creator
  ON streams(creator_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streams_tenant
  ON streams(tenant_id);

-- stream_guests: looked up by stream_id and user_id; joined to streams
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stream_guests_stream
  ON stream_guests(stream_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stream_guests_user
  ON stream_guests(user_id);

-- stream_guest_invites: looked up by stream_id + tenant_id, guest_token
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stream_guest_invites_stream_tenant
  ON stream_guest_invites(stream_id, tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stream_guest_invites_token
  ON stream_guest_invites(guest_token);

-- room_participants: joined on stream_id, filtered by user_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_participants_stream
  ON room_participants(stream_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_participants_user
  ON room_participants(user_id);

-- room_panel_slots: joined on stream_id (panelService heavy)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_panel_slots_stream
  ON room_panel_slots(stream_id);

-- room_join_requests: looked up by stream_id + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_join_requests_stream
  ON room_join_requests(stream_id);

-- user_loyalty: filtered by user_id + tenant_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_loyalty_user_tenant
  ON user_loyalty(user_id, tenant_id);

-- loyalty_point_events: filtered by user_id to avoid duplicate points
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loyalty_events_user_source
  ON loyalty_point_events(user_id, source, source_id)
  WHERE source_id IS NOT NULL;

-- reward_tiers: filtered by tenant_id + points_required
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reward_tiers_tenant_points
  ON reward_tiers(tenant_id, points_required);

-- guest_invitations / invites: filtered by to_user_id + tenant_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guest_invitations_to_user
  ON guest_invitations(to_user_id, tenant_id);

-- users: filtered by tenant_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant
  ON users(tenant_id);
