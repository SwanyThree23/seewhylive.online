const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: 'ws' } }
);

const CLEANUP_STEPS = [
  { table: 'room_join_requests', column: 'user_id' },
  { table: 'battles',            column: 'creator_id' },
  { table: 'streams',            column: 'creator_id' },
  { table: 'direct_pay_handles', column: 'user_id' },
  { table: 'rewards_selected_tier', column: 'user_id' },
  { table: 'reward_points',      column: 'user_id' },
  { table: 'guest_requests',     column: 'user_id' },
];

router.delete('/me', requireAuth, async (req, res) => {
  const userId = req.user && req.user.id;
  const tenantId = req.tenantId;
  if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

  const results = [];

  for (const step of CLEANUP_STEPS) {
    try {
      await db.query('DELETE FROM ' + step.table + ' WHERE ' + step.column + ' = $1 AND tenant_id = $2', [userId, tenantId]);
      results.push(step.table + ': ok');
    } catch (e) {
      console.error('[delete-account] cleanup skip for', step.table, e.message);
      results.push(step.table + ': skipped (' + e.message + ')');
    }
  }

  try {
    await db.query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
    results.push('users: ok');
  } catch (e) {
    console.error('[delete-account] failed to delete users row', e.message);
    results.push('users: failed (' + e.message + ')');
  }

  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
  } catch (e) {
    console.error('[delete-account] supabase auth delete failed', e.message);
    return res.status(500).json({ success: false, error: 'Could not fully delete account', details: results });
  }

  return res.json({ success: true, cleanup: results });
});

module.exports = router;
