'use strict';
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });
const db = require('../db');

async function awardPoints(userId, points, source, sourceId, tenantId) {
  if (!Number.isFinite(points) || points <= 0) throw new Error('awardPoints: points must be a positive finite number');

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    var _eventRes;
    if (tenantId) {
      _eventRes = await client.query(
        `INSERT INTO loyalty_point_events (user_id, tenant_id, points, source, source_id) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, source, source_id) WHERE source_id IS NOT NULL DO NOTHING
         RETURNING id`,
        [userId, tenantId, points, source || null, sourceId || null]
      );
    } else {
      _eventRes = await client.query(
        `INSERT INTO loyalty_point_events (user_id, points, source, source_id) VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, source, source_id) WHERE source_id IS NOT NULL DO NOTHING
         RETURNING id`,
        [userId, points, source || null, sourceId || null]
      );
    }
    if (_eventRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    const conflictKey = tenantId ? '(user_id, tenant_id)' : '(user_id)';
    const result = tenantId
      ? await client.query(
          `INSERT INTO user_loyalty (user_id, tenant_id, total_points, level, updated_at)
           VALUES ($1, $3, $2,
             (SELECT COALESCE(MAX(level),1) FROM reward_tiers WHERE points_required <= $2 AND tenant_id = $3),
             now())
           ON CONFLICT (user_id, tenant_id) DO UPDATE SET
             total_points = LEAST(user_loyalty.total_points + EXCLUDED.total_points, 10000000),
             level        = (SELECT COALESCE(MAX(level),1) FROM reward_tiers
                             WHERE points_required <= LEAST(user_loyalty.total_points + EXCLUDED.total_points, 10000000)
                               AND tenant_id = $3),
             updated_at   = now()
           RETURNING total_points, level`,
          [userId, points, tenantId]
        )
      : await client.query(
          `INSERT INTO user_loyalty (user_id, total_points, level, updated_at)
           VALUES ($1, $2, floor($2::numeric / 1000)::int + 1, now())
           ON CONFLICT (user_id) DO UPDATE SET
             total_points = LEAST(user_loyalty.total_points + EXCLUDED.total_points, 10000000),
             level        = floor(LEAST(user_loyalty.total_points + EXCLUDED.total_points, 10000000)::numeric / 1000)::int + 1,
             updated_at   = now()
           RETURNING total_points, level`,
          [userId, points]
        );
    await client.query('COMMIT');
    const row = result.rows[0];
    return { total_points: row.total_points, level: row.level };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getUserPoints(userId, tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  const { data, error } = await supabase.from('user_loyalty').select('*').eq('user_id', userId).eq('tenant_id', tenantId).maybeSingle();
  if (error) throw error;
  return data || { user_id: userId, tenant_id: tenantId, total_points: 0, level: 1 };
}

async function getLeaderboard(period, tenantId) {
  if (!tenantId) throw Object.assign(new Error('tenantId is required'), { status: 400 });
  if (period === 'weekly') {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let q = supabase.from('loyalty_point_events').select('user_id, points').gte('created_at', since).eq('tenant_id', tenantId).limit(10000);
    const { data, error } = await q;
    if (error) throw error;
    const totals = {};
    data.forEach((row) => {
      totals[row.user_id] = (totals[row.user_id] || 0) + row.points;
    });
    return Object.entries(totals)
      .map(([user_id, points]) => ({ user_id, points }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 100);
  }
  let q = supabase.from('user_loyalty').select('user_id, total_points, level').order('total_points', { ascending: false }).limit(100).eq('tenant_id', tenantId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function getTiers(tenantId) {
  let q = supabase.from('pricing_tiers').select('*').order('price', { ascending: true });
  if (tenantId) q = q.eq('tenant_id', tenantId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function getSelectedTier(userId, tenantId) {
  let q = supabase.from('user_settings').select('setting_value')
    .eq('user_id', userId).eq('setting_key', 'selected_tier').limit(1);
  if (tenantId) q = q.eq('tenant_id', tenantId);
  const { data, error } = await q;
  if (error) throw error;
  var row = Array.isArray(data) && data[0];
  return (row && row.setting_value) || null;
}

async function setSelectedTier(userId, tierId, tenantId) {
  if (!tierId || typeof tierId !== 'string' || tierId.length > 100) throw new Error('tierId is required');
  var payload = { tierId: tierId.trim() };

  let selQ = supabase.from('user_settings').select('id')
    .eq('user_id', userId).eq('setting_key', 'selected_tier').limit(1);
  if (tenantId) selQ = selQ.eq('tenant_id', tenantId);
  const { data: existing, error: selErr } = await selQ;
  if (selErr) throw selErr;

  if (existing && existing.length) {
    const { error: updErr } = await supabase
      .from('user_settings')
      .update({ setting_value: payload, updated_at: new Date().toISOString() })
      .eq('id', existing[0].id)
      .eq('user_id', userId);
    if (updErr) throw updErr;
  } else {
    var insRow = { user_id: userId, setting_key: 'selected_tier', setting_value: payload };
    if (tenantId) insRow.tenant_id = tenantId;
    const { error: insErr } = await supabase.from('user_settings').insert(insRow);
    if (insErr) throw insErr;
  }
  return payload;
}

async function getActiveChallenges(tenantId) {
  let q = supabase.from('challenges').select('*').eq('status', 'active').order('ends_at', { ascending: true });
  if (tenantId) q = q.eq('tenant_id', tenantId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function completeChallenge(userId, challengeId, tenantId) {
  if (!tenantId) throw Object.assign(new Error('tenantId is required'), { status: 400 });
  const { data: challenge, error: chErr } = await supabase
    .from('challenges').select('*').eq('id', challengeId).eq('tenant_id', tenantId).single();
  if (chErr) throw chErr;
  if (!challenge || challenge.status !== 'active') throw new Error('challenge is not active');
  if (challenge.ends_at && new Date(challenge.ends_at) < new Date()) throw new Error('challenge has expired');

  const { error: insErr } = await supabase
    .from('challenge_completions')
    .insert({ challenge_id: challengeId, user_id: userId, tenant_id: tenantId });
  if (insErr) {
    if (insErr.code === '23505') return { alreadyCompleted: true };
    throw insErr;
  }

  try {
    return await awardPoints(userId, challenge.points_reward, 'challenge_complete', challengeId, tenantId);
  } catch (awardErr) {
    await supabase.from('challenge_completions')
      .delete().eq('challenge_id', challengeId).eq('user_id', userId)
      .catch(function(delErr) {
        console.error('[rewardsService] compensating delete failed challengeId=%s userId=%s err=%s', challengeId, userId, delErr && delErr.message);
      });
    throw awardErr;
  }
}

module.exports = {
  awardPoints,
  getUserPoints,
  getLeaderboard,
  getTiers,
  getActiveChallenges,
  completeChallenge,
  getSelectedTier,
  setSelectedTier,
};
