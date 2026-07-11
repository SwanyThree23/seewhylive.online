// server/services/challengeService.js
const db = require('../db'); // <-- verify this matches your actual db module
const loyaltyService = require('./loyaltyService');

async function createChallenge({ title, description, pointsReward, startsAt, endsAt }) {
  const result = await db.query(
    `INSERT INTO challenges (title, description, points_reward, starts_at, ends_at)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [title, description || null, pointsReward || 0, startsAt || null, endsAt || null]
  );
  return result.rows[0];
}

async function getActiveChallenges() {
  const result = await db.query(
    `SELECT * FROM challenges
     WHERE status = 'active' AND (ends_at IS NULL OR ends_at > now())
     ORDER BY created_at DESC`
  );
  return result.rows;
}

// Marks a challenge complete for a user and awards points exactly once —
// the PRIMARY KEY on challenge_completions(challenge_id, user_id) prevents
// double-completion at the DB level.
async function completeChallenge(challengeId, userId) {
  const challenge = await db.query(`SELECT * FROM challenges WHERE id = $1`, [challengeId]);
  const row = challenge.rows[0];
  if (!row) throw new Error('challenge not found');
  if (row.status !== 'active') throw new Error('challenge is not active');

  let inserted;
  try {
    inserted = await db.query(
      `INSERT INTO challenge_completions (challenge_id, user_id) VALUES ($1, $2) RETURNING *`,
      [challengeId, userId]
    );
  } catch (err) {
    // unique_violation on the composite PK means already completed
    if (err.code === '23505') {
      throw new Error('challenge already completed');
    }
    throw err;
  }

  await loyaltyService.awardPoints({
    userId,
    points: row.points_reward,
    source: 'challenge_complete',
    sourceId: challengeId,
  });

  return inserted.rows[0];
}

async function getUserCompletions(userId) {
  const result = await db.query(
    `SELECT challenge_id, completed_at FROM challenge_completions WHERE user_id = $1`,
    [userId]
  );
  return result.rows;
}

module.exports = {
  createChallenge,
  getActiveChallenges,
  completeChallenge,
  getUserCompletions,
};
