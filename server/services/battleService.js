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

async function getBattle(battleId) {
  const result = await db.query(`SELECT * FROM pk_battles WHERE id = $1`, [battleId]);
  return result.rows[0] || null;
}

async function getBattleTeams(battleId) {
  const result = await db.query(`SELECT * FROM pk_battle_teams WHERE battle_id = $1`, [battleId]);
  return result.rows;
}

async function getActiveBattles() {
  const result = await db.query(
    `SELECT * FROM pk_battles WHERE status = 'active' ORDER BY started_at DESC`
  );
  return result.rows;
}

async function getActiveBattlesForRoom(roomId) {
  const result = await db.query(
    `SELECT * FROM pk_battles WHERE room_id = $1 AND status = 'active' ORDER BY created_at DESC`,
    [roomId]
  );
  return result.rows;
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

async function createChallenge({ challengerId, defenderId, challengerName, defenderName, roomId, durationMinutes }) {
  const result = await db.query(
    `INSERT INTO pk_battles
      (room_id, challenger_id, defender_id, challenger_name, defender_name,
       challenger_points, defender_points, status, duration_minutes)
     VALUES ($1, $2, $3, $4, $5, 0, 0, 'pending', $6)
     RETURNING *`,
    [roomId || null, challengerId, defenderId, challengerName || null, defenderName || null,
     durationMinutes || DEFAULT_DURATION_MINUTES]
  );
  return result.rows[0];
}

async function acceptChallenge(battleId, roomId) {
  const result = await db.query(
    `UPDATE pk_battles
     SET status = 'accepted', room_id = COALESCE($2, room_id)
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [battleId, roomId || null]
  );
  return result.rows[0] || null;
}

async function startBattle(battleId) {
  const result = await db.query(
    `UPDATE pk_battles
     SET status = 'active',
         started_at = now(),
         ends_at = now() + (duration_minutes || ' minutes')::interval
     WHERE id = $1 AND status IN ('pending', 'accepted')
     RETURNING *`,
    [battleId]
  );
  return result.rows[0] || null;
}

async function castVote({ battleId, voterId, side, giftValueCents }) {
  await db.query(
    `INSERT INTO pk_battle_votes (battle_id, voter_id, side, gift_value_cents)
     VALUES ($1, $2, $3, $4)`,
    [battleId, voterId, side, giftValueCents]
  );
  const column = side === 'challenger' ? 'challenger_points' : 'defender_points';
  const result = await db.query(
    `UPDATE pk_battles SET ${column} = ${column} + $1 WHERE id = $2 RETURNING *`,
    [giftValueCents, battleId]
  );
  return result.rows[0];
}

async function endBattle(battleId) {
  const battle = await getBattle(battleId);
  if (!battle) throw new Error('Battle not found');

  let winnerId = null;
  if (battle.challenger_points > battle.defender_points) winnerId = battle.challenger_id;
  else if (battle.defender_points > battle.challenger_points) winnerId = battle.defender_id;

  const result = await db.query(
    `UPDATE pk_battles SET status = 'ended', winner_id = $1 WHERE id = $2 RETURNING *`,
    [winnerId, battleId]
  );
  return result.rows[0];
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
  endBattle,
  CREATOR_SPLIT,
};
