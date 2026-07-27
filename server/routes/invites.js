// server/routes/invites.js
// INTEGRATION: mount in your main router, e.g.:
//   app.use('/api/invites', require('./routes/invites'));

const express = require('express');
const router = express.Router();
const db          = require('../db');
const inviteService = require('../services/inviteService');
const requireAuth   = require('../middleware/auth');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- direct user-to-user invitations (guest_invitations) ---

router.post('/', requireAuth, async (req, res) => {
  const { toUserId, roomId, message, expiryHours } = req.body;
  if (!toUserId || !UUID_RE.test(toUserId)) return res.status(400).json({ error: 'invalid toUserId' });
  if (roomId && !UUID_RE.test(roomId)) return res.status(400).json({ error: 'invalid roomId' });
  try {
    const safeExpiryHours = Math.min(parseInt(expiryHours, 10) || 24, 168);
    const safeMessage = message ? String(message).slice(0, 500) : null;
    const invite = await inviteService.sendInvitation({
      fromUserId: req.user.id,
      toUserId,
      roomId,
      message: safeMessage,
      expiryHours: safeExpiryHours,
    });
    res.status(201).json(invite);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/respond', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'invalid invite id' });
  try {
    const { status } = req.body; // 'accepted' | 'declined'
    const invite = await inviteService.respondToInvitation(req.params.id, status, req.user.id);
    if (!invite) return res.status(404).json({ error: 'invite not found, expired, or already responded' });
    res.json(invite);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const invites = await inviteService.getPendingInvitations(req.user.id);
    res.json(invites);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- shareable invite links (stream_guest_invites) ---

router.post('/streams/:streamId/links', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    const ownerCheck = await db.query('SELECT creator_id FROM streams WHERE id = $1', [req.params.streamId]);
    if (!ownerCheck.rows[0] || ownerCheck.rows[0].creator_id !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const { displayName, role, maxUses } = req.body;
    const ALLOWED_ROLES = ['guest', 'cohost', 'viewer'];
    const safeRole = ALLOWED_ROLES.includes(role) ? role : 'guest';
    const safeMaxUses = Math.min(Math.floor(maxUses || 1), 100);
    const link = await inviteService.createInviteLink({
      streamId: req.params.streamId,
      createdBy: req.user.id,
      displayName,
      role: safeRole,
      maxUses: safeMaxUses,
    });
    res.status(201).json(link);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/links/:token/redeem', requireAuth, async (req, res) => {
  try {
    const link = await inviteService.redeemInviteLink(req.params.token);
    res.json(link);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/links/:id/revoke', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'invalid invite link id' });
  try {
    const link = await inviteService.revokeInviteLink(req.params.id, req.user.id);
    if (!link) return res.status(404).json({ error: 'not found, not yours, or already revoked' });
    res.json(link);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/streams/:streamId/links', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    const ownerCheck = await db.query('SELECT creator_id FROM streams WHERE id = $1', [req.params.streamId]);
    if (!ownerCheck.rows[0] || ownerCheck.rows[0].creator_id !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const links = await inviteService.getStreamInviteLinks(req.params.streamId);
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
