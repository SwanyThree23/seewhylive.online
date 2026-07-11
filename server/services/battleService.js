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

async function createBattle({ roomId, challengerId, defenderId, challengerName, defenderName, durationMinutes }) {
  const result = await db.query(
    `INSERT INTO pk_battles
      (room_id, challenger_id, defender_id, challenger_name, defender_name,
       challenger_points, defender_points, status, duration_minutes, started_at, ends_at)
     VALUES ($1, $2, $3, $4, $5, 0, 0, 'active', $6, now(), now() + ($6 || ' minutes')::interval)
     RETURNING *`,
    [roomId, challengerId, defenderId, challengerName, defenderName, durationMinutes || DEFAULT_DURATION_MINUTES]
  );
  return result.rows[0];
}

async function getBattle(battleId) {
  const result = await db.query(`SELECT * FROM pk_battles WHERE id = $1`, [battleId]);
  return result.rows[0] || null;
}

async function getBattleTeams(battleId) {
  const result = await db.query(`SELECT * FROM pk_battle_teams WHERE battle_id = $1`, [battleId]);
  return result.rows;
}

async function recordVote(battleId, voterId, side, giftValueCents) {
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

async function getActiveBattlesForRoom(roomId) {
  const result = await db.query(
    `SELECT * FROM pk_battles WHERE room_id = $1 AND status = 'active' ORDER BY created_at DESC`,
    [roomId]
  );
  return result.rows;
}

module.exports = {
  createBattle,
  getBattle,
  getBattleTeams,
  recordVote,
  endBattle,
  getActiveBattlesForRoom,
  CREATOR_SPLIT,
};
