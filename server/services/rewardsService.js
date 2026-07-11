const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

async function awardPoints(userId, points, eventType, refType, refId) {
  const { error: eventErr } = await supabase.from('point_events').insert({
    user_id: userId,
    points,
    event_type: eventType,
    ref_type: refType || null,
    ref_id: refId || null,
  });
  if (eventErr) throw eventErr;

  const { data: existing } = await supabase
    .from('loyalty_points')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const newLifetime = (existing ? existing.lifetime_points : 0) + points;
  const newCurrent = (existing ? existing.current_points : 0) + points;
  const newLevel = Math.floor(newLifetime / 1000) + 1; // 1000 pts per level, adjust as needed

  const { error: upsertErr } = await supabase.from('loyalty_points').upsert({
    user_id: userId,
    current_points: newCurrent,
    lifetime_points: newLifetime,
    level: newLevel,
    updated_at: new Date().toISOString(),
  });
  if (upsertErr) throw upsertErr;

  return { current_points: newCurrent, lifetime_points: newLifetime, level: newLevel };
}

async function getUserPoints(userId) {
  const { data, error } = await supabase.from('loyalty_points').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data || { user_id: userId, current_points: 0, lifetime_points: 0, level: 1 };
}

async function getLeaderboard(period) {
  const view = period === 'weekly' ? 'leaderboard_weekly' : 'leaderboard_alltime';
  const { data, error } = await supabase.from(view).select('*').limit(100);
  if (error) throw error;
  return data;
}

async function getTiers() {
  const { data, error } = await supabase.from('reward_tiers').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

async function getActiveChallenges() {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('end_date', { ascending: true });
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
    .insert({ user_id: userId, challenge_id: challengeId });
  if (insErr) throw insErr; // will fail on duplicate PK — that's intentional (one completion per user)

  return awardPoints(userId, challenge.points_reward, 'challenge_complete', 'challenges', challengeId);
}

module.exports = {
  awardPoints,
  getUserPoints,
  getLeaderboard,
  getTiers,
  getActiveChallenges,
  completeChallenge,
};
