// server/routes/invites.js
// INTEGRATION: mount in your main router, e.g.:
//   app.use('/api/invites', require('./routes/invites'));

const express = require('express');
const router = express.Router();
const inviteService = require('../services/inviteService');
const requireAuth   = require('../middleware/auth');

// --- direct user-to-user invitations (guest_invitations) ---

router.post('/', requireAuth, async (req, res) => {
  try {
    const { toUserId, roomId, message, expiryHours } = req.body;
    const invite = await inviteService.sendInvitation({
      fromUserId: req.user.id,
      toUserId,
      roomId,
      message,
      expiryHours,
    });
    res.status(201).json(invite);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/respond', requireAuth, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' | 'declined'
    const invite = await inviteService.respondToInvitation(req.params.id, status);
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
    res.status(500).json({ error: err.message });
  }
});

// --- shareable invite links (stream_guest_invites) ---

router.post('/streams/:streamId/links', requireAuth, async (req, res) => {
  try {
    const { displayName, role, maxUses } = req.body;
    const link = await inviteService.createInviteLink({
      streamId: req.params.streamId,
      createdBy: req.user.id,
      displayName,
      role,
      maxUses,
    });
    res.status(201).json(link);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/links/:token/redeem', async (req, res) => {
  try {
    const link = await inviteService.redeemInviteLink(req.params.token);
    res.json(link);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/links/:id/revoke', requireAuth, async (req, res) => {
  try {
    const link = await inviteService.revokeInviteLink(req.params.id, req.user.id);
    if (!link) return res.status(404).json({ error: 'not found, not yours, or already revoked' });
    res.json(link);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/streams/:streamId/links', requireAuth, async (req, res) => {
  try {
    const links = await inviteService.getStreamInviteLinks(req.params.streamId);
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
