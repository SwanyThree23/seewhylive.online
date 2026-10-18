// server/services/challengeService.js
'use strict';
const db = require('../db'); // <-- verify this matches your actual db module
const loyaltyService = require('./loyaltyService');

async function createChallenge({ tenantId, title, description, pointsReward, startsAt, endsAt }) {
  const result = await db.query(
    `INSERT INTO challenges (tenant_id, title, description, points_reward, starts_at, ends_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [tenantId, title, description || null, pointsReward || 0, startsAt || null, endsAt || null]
  );
  return result.rows[0];
}

async function getActiveChallenges(tenantId) {
  const result = await db.query(
    `SELECT * FROM challenges
     WHERE tenant_id = $1 AND status = 'active' AND (ends_at IS NULL OR ends_at > now())
     ORDER BY created_at DESC`,
    [tenantId]
  );
  return result.rows;
}

// Marks a challenge complete for a user and awards points exactly once —
// the PRIMARY KEY on challenge_completions(challenge_id, user_id) prevents
// double-completion at the DB level.
async function completeChallenge(challengeId, userId, tenantId) {
  const challenge = await db.query(
    `SELECT * FROM challenges WHERE id = $1 AND tenant_id = $2`,
    [challengeId, tenantId]
  );
  const row = challenge.rows[0];
  if (!row) throw new Error('challenge not found');
  if (row.status !== 'active') throw new Error('challenge is not active');
  if (row.ends_at && new Date(row.ends_at) < new Date()) throw new Error('challenge has expired');

  let inserted;
  try {
    // WHERE EXISTS re-evaluates status and ends_at atomically at INSERT time,
    // closing the TOCTOU window between the SELECT above and this write.
    inserted = await db.query(
      `INSERT INTO challenge_completions (challenge_id, user_id)
       SELECT $1, $2
       WHERE EXISTS (
         SELECT 1 FROM challenges
         WHERE id = $1 AND tenant_id = $3
           AND status = 'active'
           AND (ends_at IS NULL OR ends_at > now())
       )
       RETURNING *`,
      [challengeId, userId, tenantId]
    );
    if (!inserted.rows.length) throw new Error('challenge is not active');
  } catch (err) {
    if (err.message === 'challenge is not active') throw err;
    // unique_violation on the composite PK means already completed
    if (err.code === '23505') {
      throw new Error('challenge already completed');
    }
    throw err;
  }

  try {
    await loyaltyService.awardPoints({
      userId,
      tenantId,
      points: row.points_reward,
      source: 'challenge_complete',
      sourceId: challengeId,
    });
  } catch (err) {
    await db.query(
      `DELETE FROM challenge_completions WHERE challenge_id = $1 AND user_id = $2`,
      [challengeId, userId]
    ).catch(function(delErr) {
      console.error('[challengeService] compensating delete failed challengeId=%s userId=%s err=%s', challengeId, userId, delErr && delErr.message);
    });
    throw err;
  }

  return inserted.rows[0];
}

async function getUserCompletions(userId, tenantId) {
  const result = await db.query(
    `SELECT cc.challenge_id, cc.completed_at
     FROM challenge_completions cc
     JOIN challenges c ON c.id = cc.challenge_id
     WHERE cc.user_id = $1 AND c.tenant_id = $2`,
    [userId, tenantId]
  );
  return result.rows;
}

module.exports = {
  createChallenge,
  getActiveChallenges,
  completeChallenge,
  getUserCompletions,
};
