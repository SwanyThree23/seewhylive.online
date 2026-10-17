'use strict';
var express = require('express');
var router = express.Router();
var db = require('../db');
var requireAuth = require('../middleware/auth');
var { createClient } = require('@supabase/supabase-js');

var supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: 'ws' } }
);

var CLEANUP_STEPS = [
  { table: 'room_join_requests',    column: 'user_id' },
  { table: 'battles',               column: 'creator_id' },
  { table: 'streams',               column: 'creator_id' },
  { table: 'direct_pay_handles',    column: 'user_id' },
  { table: 'rewards_selected_tier', column: 'user_id' },
  { table: 'reward_points',         column: 'user_id' },
  { table: 'guest_requests',        column: 'user_id' },
];

router.delete('/me', requireAuth, async function(req, res) {
  var userId   = req.user && req.user.id;
  var tenantId = req.tenantId;
  if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

  // Delete Supabase auth first — hardest to undo, most likely to fail externally.
  // If it fails, local data is untouched and the caller can retry safely.
  try {
    var delResult = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delResult.error) throw delResult.error;
  } catch (e) {
    console.error('[delete-account] supabase auth delete failed', e.message);
    return res.status(500).json({ success: false, error: 'Could not delete account' });
  }

  // Auth record gone — clean up local data atomically so no partial deletes.
  var client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    for (var i = 0; i < CLEANUP_STEPS.length; i++) {
      var step = CLEANUP_STEPS[i];
      await client.query('DELETE FROM ' + step.table + ' WHERE ' + step.column + ' = $1 AND tenant_id = $2', [userId, tenantId]);
    }
    await client.query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
    await client.query('COMMIT');
    return res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    // Auth is already gone; orphaned local rows need manual remediation.
    console.error('[delete-account] local cleanup failed after auth delete — manual remediation needed userId=%s tenantId=%s err=%s', userId, tenantId, e.message);
    return res.status(500).json({ success: false, error: 'Local cleanup failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
