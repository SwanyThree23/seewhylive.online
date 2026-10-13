// server/services/battleService.js
// PK Battle Arena — lifecycle logic, aligned to actual production schema:
// pk_battles(id, room_id, challenger_id, defender_id, challenger_name, defender_name,
//            challenger_points, defender_points, status, duration_minutes,
//            started_at, ends_at, winner_id, created_at)
// pk_battle_votes(id, battle_id, voter_id, side, gift_value_cents, created_at)
// pk_battle_teams(battle_id, side, creator_id)

const db = require('../db');

const CREATOR_SPLIT = 0.90;
const DEFAULT_DURATION_MINUTES = 5;

// ── Core read ────────────────────────────────────────────────────────────────

async function getBattle(battleId, tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  const result = await db.query(
    `SELECT * FROM pk_battles WHERE id = $1 AND tenant_id = $2`,
    [battleId, tenantId]
  );
  return result.rows[0] || null;
}

async function getBattleTeams(battleId) {
  const result = await db.query(`SELECT * FROM pk_battle_teams WHERE battle_id = $1`, [battleId]);
  return result.rows;
}

async function getActiveBattles(tenantId) {
  const result = await db.query(
    `SELECT * FROM pk_battles WHERE status = 'active' AND tenant_id = $1 ORDER BY started_at DESC`,
    [tenantId]
  );
  return result.rows;
}

async function getActiveBattlesForRoom(roomId, tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  const result = await db.query(
    `SELECT * FROM pk_battles WHERE room_id = $1 AND status = 'active' AND tenant_id = $2 ORDER BY created_at DESC`,
    [roomId, tenantId]
  );
  return result.rows;
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

async function createChallenge({ tenantId, challengerId, defenderId, challengerName, defenderName, roomId, durationMinutes }) {
  const result = await db.query(
    `INSERT INTO pk_battles
      (tenant_id, room_id, challenger_id, defender_id, challenger_name, defender_name,
       challenger_points, defender_points, status, duration_minutes)
     VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 'pending', $7)
     RETURNING *`,
    [tenantId, roomId || null, challengerId, defenderId, challengerName || null, defenderName || null,
     durationMinutes || DEFAULT_DURATION_MINUTES]
  );
  return result.rows[0];
}

async function acceptChallenge(battleId, roomId, tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  const result = await db.query(
    `UPDATE pk_battles
     SET status = 'accepted', room_id = COALESCE($2, room_id)
     WHERE id = $1 AND status = 'pending' AND tenant_id = $3
     RETURNING *`,
    [battleId, roomId || null, tenantId]
  );
  return result.rows[0] || null;
}

async function startBattle(battleId, tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  const result = await db.query(
    `UPDATE pk_battles
     SET status = 'active',
         started_at = now(),
         ends_at = now() + (duration_minutes || ' minutes')::interval
     WHERE id = $1 AND status IN ('pending', 'accepted') AND tenant_id = $2
     RETURNING *`,
    [battleId, tenantId]
  );
  return result.rows[0] || null;
}

async function castVote({ battleId, voterId, side, giftValueCents, tenantId }) {
  if (!tenantId) throw new Error('tenantId is required');
  if (!Number.isFinite(giftValueCents) || giftValueCents < 1 || giftValueCents > 50000) throw new Error('invalid giftValueCents');
  const active = await db.query(
    `SELECT id, challenger_id, defender_id FROM pk_battles WHERE id = $1 AND status = 'active' AND tenant_id = $2`,
    [battleId, tenantId]
  );
  if (!active.rows[0]) throw new Error('battle not active');
  if (voterId === active.rows[0].challenger_id || voterId === active.rows[0].defender_id) {
    throw new Error('battle participants may not vote');
  }

  if (side !== 'challenger' && side !== 'defender') throw new Error('invalid side');

  // Atomic: insert vote and update points in one CTE to prevent TOCTOU where
  // endBattle fires between the INSERT and the UPDATE, leaving votes consumed
  // but points never credited.
  const result = await db.query(
    `WITH ins AS (
       INSERT INTO pk_battle_votes (battle_id, voter_id, side, gift_value_cents)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (battle_id, voter_id) DO NOTHING
       RETURNING voter_id
     )
     UPDATE pk_battles
     SET challenger_points = challenger_points + CASE WHEN $3 = 'challenger' THEN $4 ELSE 0 END,
         defender_points   = defender_points   + CASE WHEN $3 = 'defender'   THEN $4 ELSE 0 END
     WHERE id = $1
       AND status = 'active'
       AND tenant_id = $5
       AND EXISTS (SELECT 1 FROM ins)
     RETURNING *`,
    [battleId, voterId, side, giftValueCents, tenantId]
  );
  if (!result.rows[0]) throw new Error('already voted in this battle or battle no longer active');
  return result.rows[0];
}

async function declineBattle(battleId, defenderId, tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  const result = await db.query(
    `UPDATE pk_battles SET status = 'declined'
     WHERE id = $1 AND defender_id = $2 AND status = 'pending' AND tenant_id = $3
     RETURNING *`,
    [battleId, defenderId, tenantId]
  );
  return result.rows[0] || null;
}

async function endBattle(battleId, tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  const battle = await getBattle(battleId, tenantId);
  if (!battle) throw new Error('Battle not found');
  if (battle.status === 'ended') return battle;  // idempotent — already ended

  // Determine winner atomically from live DB values (not stale snapshot)
  const result = await db.query(
    `UPDATE pk_battles
     SET status = 'ended',
         winner_id = CASE
           WHEN challenger_points > defender_points THEN challenger_id
           WHEN defender_points > challenger_points THEN defender_id
           ELSE NULL
         END
     WHERE id = $1 AND status = 'active' AND tenant_id = $2
     RETURNING *`,
    [battleId, tenantId]
  );
  return result.rows[0] || battle;
}

// Legacy alias kept for any direct createBattle callers
const createBattle = createChallenge;
// Legacy alias for recordVote
const recordVote = castVote;

module.exports = {
  getBattle,
  getBattleTeams,
  getActiveBattles,
  getActiveBattlesForRoom,
  createBattle,
  createChallenge,
  acceptChallenge,
  startBattle,
  castVote,
  recordVote,
  declineBattle,
  endBattle,
  CREATOR_SPLIT,
};
