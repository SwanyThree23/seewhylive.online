// server/routes/panelRooms.js
//
// INTEGRATION: mount alongside your existing rooms routes, e.g.
//   app.use('/api/rooms', requireAuth, panelRoomsRoutes);
// These are additive endpoints for the panel-upgrade feature — they don't
// replace whatever room CRUD routes you already have.

const express = require('express');
const router = express.Router();
const db = require('../db');
const panelService = require('../services/panelService');
const requireAuth  = require('../middleware/auth');

// Host sets a room to private and picks a gating mode.
router.post('/:id/privacy', requireAuth, async (req, res) => {
  try {
    const { isPrivate, gatingMode } = req.body; // gatingMode: 'invite_code' | 'approval'
    const ownerCheck = await db.query(
      'SELECT creator_id FROM streams WHERE id = $1', [req.params.id]
    );
    if (!ownerCheck.rows[0] || ownerCheck.rows[0].creator_id !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const result = await panelService.setPrivacy({ roomId: req.params.id, isPrivate, gatingMode });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Host-facing list of pending join requests (approval-gated rooms).
router.get('/:id/join-requests', requireAuth, async (req, res) => {
  try {
    const ownerCheck = await db.query(
      'SELECT creator_id FROM streams WHERE id = $1', [req.params.id]
    );
    if (!ownerCheck.rows[0] || ownerCheck.rows[0].creator_id !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const result = await db.query(
      `SELECT r.id, r.user_id, r.requested_at, u.display_name, u.avatar_url
       FROM room_join_requests r JOIN users u ON u.id = r.user_id
       WHERE r.stream_id = $1 AND r.status = 'pending' ORDER BY r.requested_at`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Current panel seating + privacy mode (used on initial page load before sockets connect).
router.get('/:id/panel', async (req, res) => {
  try {
    const [slots, privacyResult] = await Promise.all([
      panelService.getPanelState(req.params.id),
      db.query('SELECT privacy, private_gating_mode FROM streams WHERE id = $1', [req.params.id]),
    ]);
    const row = privacyResult.rows[0] || {};
    const gatingMode = row.privacy === 'private' ? (row.private_gating_mode || null) : null;
    res.json({ slots, gatingMode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
