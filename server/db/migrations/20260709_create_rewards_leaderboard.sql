-- Rewards & Leaderboard schema
CREATE TABLE IF NOT EXISTS user_loyalty (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  total_points INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_point_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  points INT NOT NULL,
  source TEXT NOT NULL,
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reward_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  points_required INT NOT NULL,
  perks JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points_reward INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_completions (
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_events_user ON loyalty_point_events(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_events_created ON loyalty_point_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_points ON user_loyalty(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);

INSERT INTO reward_tiers (level, name, points_required, perks) VALUES
  (1, 'Rookie', 0, '{}'::jsonb),
  (2, 'Contender', 500, '{}'::jsonb),
  (3, 'Veteran', 2000, '{}'::jsonb),
  (4, 'Champion', 5000, '{}'::jsonb),
  (5, 'Legend', 15000, '{}'::jsonb)
ON CONFLICT (level) DO NOTHING;
