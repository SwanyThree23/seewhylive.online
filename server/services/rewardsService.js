const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });
const db = require('../db');

async function awardPoints(userId, points, source, sourceId) {
  if (!Number.isFinite(points) || points <= 0) throw new Error('awardPoints: points must be a positive finite number');
  // Insert event record
  const { error: eventErr } = await supabase.from('loyalty_point_events').insert({
    user_id: userId,
    points,
    source: source,
    source_id: sourceId || null,
  });
  if (eventErr) throw eventErr;

  // Atomic upsert via pg pool — eliminates the read-modify-write race
  const result = await db.query(
    `INSERT INTO user_loyalty (user_id, total_points, level, updated_at)
     VALUES ($1, $2, floor($2::numeric / 1000)::int + 1, now())
     ON CONFLICT (user_id) DO UPDATE SET
       total_points = user_loyalty.total_points + EXCLUDED.total_points,
       level        = floor((user_loyalty.total_points + EXCLUDED.total_points)::numeric / 1000)::int + 1,
       updated_at   = now()
     RETURNING total_points, level`,
    [userId, points]
  );
  const row = result.rows[0];
  return { total_points: row.total_points, level: row.level };
}

async function getUserPoints(userId) {
  const { data, error } = await supabase.from('user_loyalty').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data || { user_id: userId, total_points: 0, level: 1 };
}

async function getLeaderboard(period) {
  if (period === 'weekly') {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('loyalty_point_events')
      .select('user_id, points')
      .gte('created_at', since);
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
  const { data, error } = await supabase
    .from('user_loyalty')
    .select('user_id, total_points, level')
    .order('total_points', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

async function getTiers() {
  const { data, error } = await supabase.from('reward_tiers').select('*').order('level', { ascending: true });
  if (error) throw error;
  return data;
}

async function getActiveChallenges() {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('status', 'active')
    .order('ends_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function completeChallenge(userId, challengeId) {
  const { data: challenge, error: chErr } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();
  if (chErr) throw chErr;
  if (!challenge || challenge.status !== 'active') throw new Error('challenge is not active');
  if (challenge.ends_at && new Date(challenge.ends_at) < new Date()) throw new Error('challenge has expired');

  const { error: insErr } = await supabase
    .from('challenge_completions')
    .insert({ challenge_id: challengeId, user_id: userId });
  if (insErr) {
    if (insErr.code === '23505') return { alreadyCompleted: true };
    throw insErr;
  }

  try {
    return await awardPoints(userId, challenge.points_reward, 'challenge_complete', challengeId);
  } catch (awardErr) {
    await supabase.from('challenge_completions')
      .delete().eq('challenge_id', challengeId).eq('user_id', userId)
      .catch(function() {});
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
};
