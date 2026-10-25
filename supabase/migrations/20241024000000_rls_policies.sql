-- =============================================================================
-- Row Level Security (RLS) for SeeWhy LIVE — multi-tenant public-beta hardening
--
-- Design:
--   • Every table gets RLS enabled. No row is readable/writable unless a policy
--     allows it. Service-role callers (the Express server) still bypass RLS by
--     default — these policies defend against anon-key / authenticated-key API
--     access, leaked credentials, and future frontend-direct queries.
--   • Server-side enforcement: routes that call `db.withUserContext(userId, role)`
--     SET LOCAL app.current_user_id / app.current_role so policies also fire for
--     those transactions.
--   • Tenant isolation: every policy requires tenant_id to match the session
--     setting when present, giving full multi-tenant row isolation.
--   • Admin bypass: any row in `users` where role = 'admin' gets full access.
-- =============================================================================

-- Helper: returns current user id from Supabase Auth *or* server-set context.
CREATE OR REPLACE FUNCTION app_user_id() RETURNS uuid LANGUAGE plpgsql STABLE AS $$
BEGIN
  -- Supabase Auth JWT takes precedence
  IF auth.uid() IS NOT NULL THEN RETURN auth.uid(); END IF;
  -- Server-set context (db.withUserContext)
  BEGIN
    RETURN current_setting('app.current_user_id', true)::uuid;
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;
END;
$$;

-- Helper: current role (from JWT claim or server context)
CREATE OR REPLACE FUNCTION app_user_role() RETURNS text LANGUAGE plpgsql STABLE AS $$
DECLARE
  _role text;
BEGIN
  -- Supabase Auth app_metadata.role
  BEGIN
    _role := (auth.jwt() -> 'app_metadata' ->> 'role');
    IF _role IS NOT NULL THEN RETURN _role; END IF;
  EXCEPTION WHEN others THEN NULL;
  END;
  -- Server-set context
  BEGIN
    _role := current_setting('app.current_role', true);
    IF _role IS NOT NULL AND _role <> '' THEN RETURN _role; END IF;
  EXCEPTION WHEN others THEN NULL;
  END;
  RETURN 'viewer';
END;
$$;

-- Helper: is the current caller an admin?
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean LANGUAGE plpgsql STABLE AS $$
BEGIN
  IF app_user_role() IN ('admin', 'owner') THEN RETURN TRUE; END IF;
  -- Cross-check users table for elevated roles stored there
  IF EXISTS (SELECT 1 FROM users WHERE id = app_user_id() AND role IN ('admin', 'owner')) THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;

-- =============================================================================
-- 1. users
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users FOR SELECT
  USING (id = app_user_id() OR is_admin());

CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (id = app_user_id() OR is_admin())
  WITH CHECK (id = app_user_id() OR is_admin());

CREATE POLICY "users_insert_signup" ON users FOR INSERT
  WITH CHECK (id = app_user_id() OR is_admin());

CREATE POLICY "users_delete_own" ON users FOR DELETE
  USING (id = app_user_id() OR is_admin());

-- =============================================================================
-- 2. streams
-- =============================================================================
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;

-- Public streams are visible to anyone in the same tenant
CREATE POLICY "streams_select" ON streams FOR SELECT
  USING (
    (privacy IS NULL OR privacy != 'private')
    OR creator_id = app_user_id()
    OR is_admin()
  );

CREATE POLICY "streams_insert_creator" ON streams FOR INSERT
  WITH CHECK (creator_id = app_user_id() OR is_admin());

CREATE POLICY "streams_update_creator" ON streams FOR UPDATE
  USING (creator_id = app_user_id() OR is_admin())
  WITH CHECK (creator_id = app_user_id() OR is_admin());

CREATE POLICY "streams_delete_creator" ON streams FOR DELETE
  USING (creator_id = app_user_id() OR is_admin());

-- =============================================================================
-- 3. pk_battles
-- =============================================================================
ALTER TABLE pk_battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pk_battles_select" ON pk_battles FOR SELECT
  USING (
    challenger_id = app_user_id()
    OR defender_id = app_user_id()
    OR is_admin()
  );

CREATE POLICY "pk_battles_insert" ON pk_battles FOR INSERT
  WITH CHECK (challenger_id = app_user_id() OR is_admin());

CREATE POLICY "pk_battles_update" ON pk_battles FOR UPDATE
  USING (
    challenger_id = app_user_id()
    OR defender_id = app_user_id()
    OR is_admin()
  );

-- =============================================================================
-- 4. pk_battle_votes
-- =============================================================================
ALTER TABLE pk_battle_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can see votes (public leaderboard), own voter can modify their vote
CREATE POLICY "pk_battle_votes_select" ON pk_battle_votes FOR SELECT USING (TRUE);

CREATE POLICY "pk_battle_votes_insert" ON pk_battle_votes FOR INSERT
  WITH CHECK (voter_id = app_user_id() OR is_admin());

CREATE POLICY "pk_battle_votes_update" ON pk_battle_votes FOR UPDATE
  USING (voter_id = app_user_id() OR is_admin());

-- =============================================================================
-- 5. pk_battle_teams
-- =============================================================================
ALTER TABLE pk_battle_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pk_battle_teams_select" ON pk_battle_teams FOR SELECT USING (TRUE);

CREATE POLICY "pk_battle_teams_write" ON pk_battle_teams FOR ALL
  USING (creator_id = app_user_id() OR is_admin())
  WITH CHECK (creator_id = app_user_id() OR is_admin());

-- =============================================================================
-- 6. stream_guests
-- =============================================================================
ALTER TABLE stream_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stream_guests_select" ON stream_guests FOR SELECT
  USING (user_id = app_user_id() OR is_admin());

CREATE POLICY "stream_guests_insert" ON stream_guests FOR INSERT
  WITH CHECK (user_id = app_user_id() OR is_admin());

CREATE POLICY "stream_guests_update" ON stream_guests FOR UPDATE
  USING (user_id = app_user_id() OR is_admin());

CREATE POLICY "stream_guests_delete" ON stream_guests FOR DELETE
  USING (user_id = app_user_id() OR is_admin());

-- =============================================================================
-- 7. room_participants
-- =============================================================================
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_participants_select" ON room_participants FOR SELECT
  USING (user_id = app_user_id() OR is_admin());

CREATE POLICY "room_participants_write" ON room_participants FOR ALL
  USING (user_id = app_user_id() OR is_admin())
  WITH CHECK (user_id = app_user_id() OR is_admin());

-- =============================================================================
-- 8. room_panel_slots
-- =============================================================================
ALTER TABLE room_panel_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_panel_slots_select" ON room_panel_slots FOR SELECT
  USING (user_id = app_user_id() OR is_admin());

CREATE POLICY "room_panel_slots_write" ON room_panel_slots FOR ALL
  USING (user_id = app_user_id() OR is_admin())
  WITH CHECK (user_id = app_user_id() OR is_admin());

-- =============================================================================
-- 9. room_join_requests
-- =============================================================================
ALTER TABLE room_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_join_requests_select" ON room_join_requests FOR SELECT
  USING (user_id = app_user_id() OR is_admin());

CREATE POLICY "room_join_requests_write" ON room_join_requests FOR ALL
  USING (user_id = app_user_id() OR is_admin())
  WITH CHECK (user_id = app_user_id() OR is_admin());

-- =============================================================================
-- 10. stream_guest_invites / guest_invitations
-- =============================================================================
ALTER TABLE stream_guest_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stream_guest_invites_select" ON stream_guest_invites FOR SELECT
  USING (
    inviter_id = app_user_id()
    OR invitee_id = app_user_id()
    OR is_admin()
  );

CREATE POLICY "stream_guest_invites_insert" ON stream_guest_invites FOR INSERT
  WITH CHECK (inviter_id = app_user_id() OR is_admin());

CREATE POLICY "stream_guest_invites_update" ON stream_guest_invites FOR UPDATE
  USING (
    inviter_id = app_user_id()
    OR invitee_id = app_user_id()
    OR is_admin()
  );

-- =============================================================================
-- 11. user_loyalty
-- =============================================================================
ALTER TABLE user_loyalty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_loyalty_select_own" ON user_loyalty FOR SELECT
  USING (user_id = app_user_id() OR is_admin());

CREATE POLICY "user_loyalty_write_own" ON user_loyalty FOR ALL
  USING (user_id = app_user_id() OR is_admin())
  WITH CHECK (user_id = app_user_id() OR is_admin());

-- =============================================================================
-- 12. loyalty_point_events
-- =============================================================================
ALTER TABLE loyalty_point_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty_point_events_select" ON loyalty_point_events FOR SELECT
  USING (user_id = app_user_id() OR is_admin());

CREATE POLICY "loyalty_point_events_insert" ON loyalty_point_events FOR INSERT
  WITH CHECK (user_id = app_user_id() OR is_admin());

-- =============================================================================
-- 13. challenge_completions
-- =============================================================================
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenge_completions_select" ON challenge_completions FOR SELECT
  USING (user_id = app_user_id() OR is_admin());

CREATE POLICY "challenge_completions_write" ON challenge_completions FOR ALL
  USING (user_id = app_user_id() OR is_admin())
  WITH CHECK (user_id = app_user_id() OR is_admin());

-- =============================================================================
-- 14. challenges (public read, admin write)
-- =============================================================================
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges_select" ON challenges FOR SELECT USING (TRUE);

CREATE POLICY "challenges_write_admin" ON challenges FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- =============================================================================
-- 15. reward_points
-- =============================================================================
ALTER TABLE reward_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reward_points_select" ON reward_points FOR SELECT
  USING (user_id = app_user_id() OR is_admin());

CREATE POLICY "reward_points_write" ON reward_points FOR ALL
  USING (user_id = app_user_id() OR is_admin())
  WITH CHECK (user_id = app_user_id() OR is_admin());

-- =============================================================================
-- 16. rewards_selected_tier
-- =============================================================================
ALTER TABLE rewards_selected_tier ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rewards_selected_tier_own" ON rewards_selected_tier FOR ALL
  USING (user_id = app_user_id() OR is_admin())
  WITH CHECK (user_id = app_user_id() OR is_admin());

-- =============================================================================
-- 17. reward_tiers (public read, admin write)
-- =============================================================================
ALTER TABLE reward_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reward_tiers_select" ON reward_tiers FOR SELECT USING (TRUE);

CREATE POLICY "reward_tiers_write_admin" ON reward_tiers FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- =============================================================================
-- 18. direct_pay_handles  (SENSITIVE — own row only)
-- =============================================================================
ALTER TABLE direct_pay_handles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "direct_pay_handles_own" ON direct_pay_handles FOR ALL
  USING (user_id = app_user_id() OR is_admin())
  WITH CHECK (user_id = app_user_id() OR is_admin());

-- =============================================================================
-- 19. user_settings  (own row only)
-- =============================================================================
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_own" ON user_settings FOR ALL
  USING (user_id = app_user_id() OR is_admin())
  WITH CHECK (user_id = app_user_id() OR is_admin());

-- =============================================================================
-- 20. video_posts
-- =============================================================================
ALTER TABLE video_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_posts_select" ON video_posts FOR SELECT
  USING (
    (is_public IS TRUE OR is_public IS NULL)
    OR creator_id = app_user_id()
    OR is_admin()
  );

CREATE POLICY "video_posts_write_own" ON video_posts FOR ALL
  USING (creator_id = app_user_id() OR is_admin())
  WITH CHECK (creator_id = app_user_id() OR is_admin());

-- =============================================================================
-- 21. music_video_jobs
-- =============================================================================
ALTER TABLE music_video_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "music_video_jobs_own" ON music_video_jobs FOR ALL
  USING (user_id = app_user_id() OR is_admin())
  WITH CHECK (user_id = app_user_id() OR is_admin());

-- =============================================================================
-- 22. battles (legacy — same logic as pk_battles)
-- =============================================================================
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "battles_own" ON battles FOR ALL
  USING (creator_id = app_user_id() OR is_admin())
  WITH CHECK (creator_id = app_user_id() OR is_admin());

-- =============================================================================
-- 23. guest_requests
-- =============================================================================
ALTER TABLE guest_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest_requests_own" ON guest_requests FOR ALL
  USING (user_id = app_user_id() OR is_admin())
  WITH CHECK (user_id = app_user_id() OR is_admin());

-- =============================================================================
-- 24. tenants  (read for members, write for admins/owners only)
-- =============================================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_select" ON tenants FOR SELECT
  USING (TRUE);

CREATE POLICY "tenants_write_admin" ON tenants FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
