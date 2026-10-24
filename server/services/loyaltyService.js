// server/services/loyaltyService.js
'use strict';
// Points ledger + level computation. This is the integration point for other
// features awarding points (PK Battle Arena wins, gifts, watch time, etc).
const db = require('../db'); // <-- verify this matches your actual db module

// Award points to a user and bump their running total. Idempotency is the
// caller's responsibility — pass a stable sourceId if the same event could
// fire twice (e.g. don't award a battle win twice for the same battle).
async function awardPoints({ userId, tenantId, points, source, sourceId }) {
  if (!userId || !tenantId || !points || points <= 0 || !Number.isFinite(points)) return null;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const _eventRes = await client.query(
      `INSERT INTO loyalty_point_events (user_id, tenant_id, points, source, source_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, source, source_id) WHERE source_id IS NOT NULL DO NOTHING
       RETURNING id`,
      [userId, tenantId, points, source, sourceId || null]
    );
    if (_eventRes.rowCount === 0) {
      await client.query('ROLLBACK');
      const _existing = await db.query(
        'SELECT * FROM user_loyalty WHERE user_id = $1 AND tenant_id = $2',
        [userId, tenantId]
      );
      return _existing.rows[0] || null;
    }
    await client.query(
      `INSERT INTO user_loyalty (user_id, tenant_id, total_points, level, updated_at)
       VALUES ($1, $2, $3, 1, now())
       ON CONFLICT (user_id, tenant_id) DO UPDATE
         SET total_points = LEAST(user_loyalty.total_points + $3, 10000000), updated_at = now()`,
      [userId, tenantId, points]
    );
    const _totals = await client.query(
      `SELECT total_points FROM user_loyalty WHERE user_id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );
    const _totalPoints = _totals.rows[0] ? _totals.rows[0].total_points : 0;
    const _tier = await client.query(
      `SELECT level FROM reward_tiers WHERE points_required <= $1 AND tenant_id = $2 ORDER BY level DESC LIMIT 1`,
      [_totalPoints, tenantId]
    );
    const _newLevel = _tier.rows[0] ? _tier.rows[0].level : 1;
    const _updated = await client.query(
      `UPDATE user_loyalty SET level = $2 WHERE user_id = $1 AND tenant_id = $3 RETURNING *`,
      [userId, _newLevel, tenantId]
    );
    await client.query('COMMIT');
    return _updated.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Recompute level from total_points against reward_tiers thresholds.
async function recomputeLevel(userId, tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  const totals = await db.query(
    `SELECT total_points FROM user_loyalty WHERE user_id = $1 AND tenant_id = $2`,
    [userId, tenantId]
  );
  if (!totals.rows[0]) return null;
  const totalPoints = totals.rows[0].total_points;

  const tier = await db.query(
    `SELECT level FROM reward_tiers WHERE points_required <= $1 AND tenant_id = $2 ORDER BY level DESC LIMIT 1`,
    [totalPoints, tenantId]
  );
  const newLevel = tier.rows[0] ? tier.rows[0].level : 1;

  const result = await db.query(
    `UPDATE user_loyalty SET level = $2 WHERE user_id = $1 AND tenant_id = $3 RETURNING *`,
    [userId, newLevel, tenantId]
  );
  return result.rows[0];
}

async function getUserLoyalty(userId, tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  const result = await db.query(
    `SELECT * FROM user_loyalty WHERE user_id = $1 AND tenant_id = $2`,
    [userId, tenantId]
  );
  return result.rows[0] || { user_id: userId, tenant_id: tenantId, total_points: 0, level: 1 };
}

async function getRewardTiers(tenantId) {
  const result = await db.query(`SELECT * FROM reward_tiers WHERE tenant_id = $1 ORDER BY level ASC`, [tenantId]);
  return result.rows;
}

// Global (all-time) leaderboard, top N by total points scoped to tenant.
async function getGlobalLeaderboard(limit, tenantId) {
  const result = await db.query(
    `SELECT ul.user_id, ul.total_points, ul.level,
            COALESCE(u.display_name, ul.user_id::text) AS display_name,
            u.avatar_url
     FROM user_loyalty ul
     LEFT JOIN users u ON u.id = ul.user_id
     WHERE ul.tenant_id = $2
     ORDER BY ul.total_points DESC
     LIMIT $1`,
    [limit || 50, tenantId]
  );
  return result.rows;
}

// Weekly leaderboard, summed from the point-event ledger over the trailing 7 days, scoped to tenant.
async function getWeeklyLeaderboard(limit, tenantId) {
  const result = await db.query(
    `SELECT e.user_id, SUM(e.points) AS total_points,
            COALESCE(u.display_name, e.user_id::text) AS display_name,
            u.avatar_url
     FROM loyalty_point_events e
     LEFT JOIN users u ON u.id = e.user_id
     WHERE e.created_at >= now() - interval '7 days'
       AND e.tenant_id = $2
     GROUP BY e.user_id, u.display_name, u.avatar_url
     ORDER BY total_points DESC
     LIMIT $1`,
    [limit || 50, tenantId]
  );
  return result.rows;
}

// 1-indexed rank of a user on the all-time leaderboard, scoped to tenant.
async function getUserRank(userId, tenantId) {
  const result = await db.query(
    `SELECT rank FROM (
       SELECT user_id, RANK() OVER (ORDER BY total_points DESC) AS rank
       FROM user_loyalty
       WHERE tenant_id = $2
     ) ranked WHERE user_id = $1`,
    [userId, tenantId]
  );
  return result.rows[0] ? result.rows[0].rank : null;
}

module.exports = {
  awardPoints,
  recomputeLevel,
  getUserLoyalty,
  getRewardTiers,
  getGlobalLeaderboard,
  getWeeklyLeaderboard,
  getUserRank,
};
