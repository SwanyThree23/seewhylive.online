'use strict';
var express = require('express');
var router = express.Router();
var db = require('../db');
var panelService = require('../services/panelService');
var requireAuth  = require('../middleware/auth');

var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validateId(req, res, next) {
  if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'invalid id' });
  next();
}

router.post('/:id/privacy', requireAuth, validateId, async function(req, res) {
  try {
    var isPrivate = req.body.isPrivate === true || req.body.isPrivate === 'true';
    var ALLOWED_GATING_MODES = ['invite_code', 'approval'];
    var rawGatingMode = req.body.gatingMode;
    var gatingMode = ALLOWED_GATING_MODES.includes(rawGatingMode) ? rawGatingMode : null;
    var ownerCheck = await db.query(
      'SELECT creator_id FROM streams WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]
    );
    if (!ownerCheck.rows[0] || ownerCheck.rows[0].creator_id !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }
    var result = await panelService.setPrivacy({ tenantId: req.tenantId, roomId: req.params.id, isPrivate: isPrivate, gatingMode: gatingMode });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/join-requests', requireAuth, validateId, async function(req, res) {
  try {
    var ownerCheck = await db.query(
      'SELECT creator_id FROM streams WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]
    );
    if (!ownerCheck.rows[0] || ownerCheck.rows[0].creator_id !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }
    var result = await db.query(
      `SELECT r.id, r.user_id, r.requested_at, u.display_name, u.avatar_url
       FROM room_join_requests r JOIN users u ON u.id = r.user_id
       WHERE r.stream_id = $1 AND r.tenant_id = $2 AND r.status = 'pending' ORDER BY r.requested_at`,
      [req.params.id, req.tenantId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/panel', requireAuth, validateId, async function(req, res) {
  try {
    var privacyResult = await db.query(
      'SELECT privacy, private_gating_mode, creator_id FROM streams WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]
    );
    var row = privacyResult.rows[0] || {};
    var slots = await panelService.getPanelState(req.params.id);
    var isCreator = row.creator_id === req.user.id;
    var isOccupant = slots.some(function(s) { return s.user_id === req.user.id; });
    if (!isCreator && !isOccupant) return res.status(403).json({ error: 'forbidden' });
    var gatingMode = row.privacy === 'private' ? (row.private_gating_mode || null) : null;
    res.json({ slots: slots, gatingMode: gatingMode });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
