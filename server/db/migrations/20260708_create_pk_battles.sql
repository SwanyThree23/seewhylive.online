CREATE TABLE IF NOT EXISTS pk_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL DEFAULT '1v1',
  status TEXT NOT NULL DEFAULT 'pending',
  challenger_id UUID REFERENCES users(id),
  opponent_id UUID REFERENCES users(id),
  challenger_room_id UUID REFERENCES rooms(id),
  opponent_room_id UUID REFERENCES rooms(id),
  challenger_score INT NOT NULL DEFAULT 0,
  opponent_score INT NOT NULL DEFAULT 0,
  duration_seconds INT NOT NULL DEFAULT 300,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  winner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pk_battle_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES pk_battles(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id),
  side TEXT NOT NULL,
  gift_value_cents INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pk_battle_teams (
  battle_id UUID REFERENCES pk_battles(id) ON DELETE CASCADE,
  side TEXT NOT NULL,
  creator_id UUID REFERENCES users(id),
  PRIMARY KEY (battle_id, side, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_pk_battle_votes_battle ON pk_battle_votes(battle_id);
CREATE INDEX IF NOT EXISTS idx_pk_battles_status ON pk_battles(status);
