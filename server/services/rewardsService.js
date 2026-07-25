const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

async function awardPoints(userId, points, source, sourceId) {
  const { error: eventErr } = await supabase.from('loyalty_point_events').insert({
    user_id: userId,
    points,
    source: source,
    source_id: sourceId || null,
  });
  if (eventErr) throw eventErr;

  const { data: existing } = await supabase
    .from('user_loyalty')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const newTotal = (existing ? existing.total_points : 0) + points;
  const newLevel = Math.floor(newTotal / 1000) + 1;

  const { error: upsertErr } = await supabase.from('user_loyalty').upsert({
    user_id: userId,
    total_points: newTotal,
    level: newLevel,
    updated_at: new Date().toISOString(),
  });
  if (upsertErr) throw upsertErr;

  return { total_points: newTotal, level: newLevel };
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

  const { error: insErr } = await supabase
    .from('challenge_completions')
    .insert({ challenge_id: challengeId, user_id: userId });
  if (insErr) {
    if (insErr.code === '23505') return { alreadyCompleted: true };
    throw insErr;
  }

  return awardPoints(userId, challenge.points_reward, 'challenge_complete', challengeId);
}

module.exports = {
  awardPoints,
  getUserPoints,
  getLeaderboard,
  getTiers,
  getActiveChallenges,
  completeChallenge,
};
