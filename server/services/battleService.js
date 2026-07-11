// server/services/battleService.js
// PK Battle Arena — lifecycle logic. Server is single source of truth for timing/score.
// CORRECTED to match the pre-existing pk_battles schema:
//   challenger_id, defender_id (not opponent_id)
//   challenger_points, defender_points (not challenger_score/opponent_score)
//   duration_minutes (not duration_seconds)
//   single room_id (not separate challenger_room_id/opponent_room_id)
//   ends_at (not ended_at), no mode column

const db = require('../db'); // <-- verify this matches your actual db module

const CREATOR_SPLIT = 0.90; // reuse existing platform invariant, do not change here
const DEFAULT_DURATION_MINUTES = 5;

async function createChallenge({ challengerId, defenderId, challengerName, defenderName, roomId, durationMinutes }) {
  const duration = durationMinutes || DEFAULT_DURATION_MINUTES;
  const result = await db.query(
    `INSERT INTO pk_battles (room_id, challenger_id, defender_id, challenger_name, defender_name, status, duration_minutes)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING *`,
    [roomId || null, challengerId, defenderId, challengerName || null, defenderName || null, duration]
  );
  return result.rows[0];
}

async function acceptChallenge(battleId, roomId) {
  const result = await db.query(
    `UPDATE pk_battles SET room_id = $2
     WHERE id = $1 AND status = 'pending' RETURNING *`,
    [battleId, roomId]
  );
  return result.rows[0];
}

async function startBattle(battleId) {
  const battle = await db.query(`SELECT duration_minutes FROM pk_battles WHERE id = $1`, [battleId]);
  if (!battle.rows[0]) return null;
  const durationMinutes = battle.rows[0].duration_minutes;

  const result = await db.query(
    `UPDATE pk_battles
     SET status = 'live', started_at = now(), ends_at = now() + ($2 || ' minutes')::interval
     WHERE id = $1 AND status = 'pending' RETURNING *`,
    [battleId, durationMinutes]
  );
  return result.rows[0];
}

// Vote/gift on a side. Points are a raw display metric — separate from creator payout.
async function castVote({ battleId, voterId, side, giftValueCents }) {
  if (side !== 'challenger' && side !== 'defender') {
    throw new Error('side must be "challenger" or "defender"');
  }
  await db.query(
    `INSERT INTO pk_battle_votes (battle_id, voter_id, side, gift_value_cents)
     VALUES ($1, $2, $3, $4)`,
    [battleId, voterId, side, giftValueCents || 0]
  );

  const column = side === 'challenger' ? 'challenger_points' : 'defender_points';
  const result = await db.query(
    `UPDATE pk_battles SET ${column} = ${column} + $2 WHERE id = $1 RETURNING *`,
    [battleId, giftValueCents || 0]
  );

  // Feed the gift into the existing 90/10 monetization pipeline — this function
  // does NOT compute payouts itself, it just hands off. Wire to your real payout module.
  if (giftValueCents > 0) {
    const creatorId = side === 'challenger'
      ? result.rows[0].challenger_id
      : result.rows[0].defender_id;
    const creatorPayoutCents = Math.floor(giftValueCents * CREATOR_SPLIT);
    // await payoutService.recordCreatorEarning(creatorId, creatorPayoutCents, 'pk_battle_gift');
    // ^ uncomment and point at your real payout/earnings module
  }

  return result.rows[0];
}

async function endBattle(battleId) {
  const battle = await db.query(`SELECT * FROM pk_battles WHERE id = $1`, [battleId]);
  const row = battle.rows[0];
  if (!row) throw new Error('battle not found');

  let winnerId = null;
  if (row.challenger_points > row.defender_points) winnerId = row.challenger_id;
  else if (row.defender_points > row.challenger_points) winnerId = row.defender_id;
  // tie -> winnerId stays null

  const result = await db.query(
    `UPDATE pk_battles SET status = 'ended', ends_at = now(), winner_id = $2
     WHERE id = $1 RETURNING *`,
    [battleId, winnerId]
  );
  return result.rows[0];
}

async function getBattle(battleId) {
  const result = await db.query(`SELECT * FROM pk_battles WHERE id = $1`, [battleId]);
  return result.rows[0];
}

async function getActiveBattles() {
  const result = await db.query(
    `SELECT * FROM pk_battles WHERE status IN ('pending', 'live') ORDER BY created_at DESC`
  );
  return result.rows;
}

module.exports = {
  createChallenge,
  acceptChallenge,
  startBattle,
  castVote,
  endBattle,
  getBattle,
  getActiveBattles,
  DEFAULT_DURATION_MINUTES,
};
