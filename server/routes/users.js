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

router.delete('/me', requireAuth, async function(req, res) {
  var userId   = req.user && req.user.id;
  var tenantId = req.tenantId;
  if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

  // Revoke Supabase auth so the user can no longer log in.
  // If this fails, we abort — no local changes have been made yet.
  try {
    var delResult = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delResult.error) throw delResult.error;
  } catch (e) {
    console.error('[delete-account] supabase auth delete failed', e.message);
    return res.status(500).json({ success: false, error: 'Could not delete account' });
  }

  // Soft-delete: anonymize PII and set deleted_at. The row is retained for
  // referential integrity (earnings records, audit logs, etc.).
  var now = new Date().toISOString();
  var anonName = 'deleted_' + userId.slice(0, 8);
  try {
    await db.pool.query(
      'UPDATE users SET display_name = $1, email = NULL, avatar_url = NULL, bio = NULL, deleted_at = $2 WHERE id = $3 AND tenant_id = $4',
      [anonName, now, userId, tenantId]
    );
    return res.json({ success: true });
  } catch (e) {
    console.error('[delete-account] soft-delete failed userId=%s err=%s', userId, e.message);
    return res.status(500).json({ success: false, error: 'Local cleanup failed' });
  }
});

// GET /api/users/search?q=<term> — search users by display_name (public, no auth)
router.get('/search', async function(req, res) {
  var q = String(req.query.q || '').trim().slice(0, 64);
  if (!q || q.length < 2) return res.json({ users: [] });
  try {
    var result = await db.pool.query(
      "SELECT id, display_name, avatar_url, account_type FROM users WHERE display_name ILIKE $1 AND deleted_at IS NULL LIMIT 20",
      ['%' + q + '%']
    );
    return res.json({ users: result.rows.map(function(u) {
      return { id: u.id, displayName: u.display_name, avatarUrl: u.avatar_url, accountType: u.account_type };
    }) });
  } catch (e) {
    return res.status(500).json({ users: [] });
  }
});

// GET /api/users/creators — recent/active creators (public, no auth)
router.get('/creators', async function(req, res) {
  try {
    var result = await db.pool.query(
      "SELECT u.id, u.display_name, u.avatar_url, u.account_type, COUNT(s.id) AS stream_count FROM users u LEFT JOIN streams s ON s.creator_id = u.id WHERE u.deleted_at IS NULL GROUP BY u.id ORDER BY stream_count DESC LIMIT 30"
    );
    return res.json({ creators: result.rows.map(function(u) {
      return { id: u.id, displayName: u.display_name, avatarUrl: u.avatar_url, accountType: u.account_type, streamCount: parseInt(u.stream_count, 10) || 0 };
    }) });
  } catch (e) {
    return res.status(500).json({ creators: [] });
  }
});

// GET /api/users/:username — public profile by username (must be after all fixed-path /api/users/* routes)
router.get('/:username', async function(req, res) {
  var username = String(req.params.username || '').trim().slice(0, 64);
  if (!username) return res.status(400).json({ error: 'username required' });
  try {
    var result = await db.pool.query(
      "SELECT u.id, u.display_name, u.avatar_url, u.account_type, u.bio, u.created_at, COUNT(s.id) AS stream_count FROM users u LEFT JOIN streams s ON s.creator_id = u.id WHERE u.display_name ILIKE $1 AND u.deleted_at IS NULL GROUP BY u.id LIMIT 1",
      [username]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'not found' });
    var u = result.rows[0];
    return res.json({
      id:          u.id,
      username:    u.display_name,
      displayName: u.display_name,
      avatarUrl:   u.avatar_url || null,
      accountType: u.account_type || 'standard',
      bio:         u.bio || '',
      streamCount: parseInt(u.stream_count, 10) || 0,
      createdAt:   u.created_at
    });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
