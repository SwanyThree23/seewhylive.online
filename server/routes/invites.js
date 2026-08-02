// server/routes/invites.js
// INTEGRATION: mount in your main router, e.g.:
//   app.use('/api/invites', require('./routes/invites'));

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const db          = require('../db');
const inviteService = require('../services/inviteService');
const requireAuth   = require('../middleware/auth');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Per-user per-token redemption guard: one successful redemption per user per token per 10 minutes
var _redeemLog = new Map(); // key: `${userId}:${token}` → timestamp
var REDEEM_COOLDOWN_MS = 10 * 60 * 1000;

// Prune expired entries once per minute so the Map doesn't grow unboundedly
setInterval(function() {
  var cutoff = Date.now() - REDEEM_COOLDOWN_MS;
  _redeemLog.forEach(function(ts, key) {
    if (ts < cutoff) _redeemLog.delete(key);
  });
}, 60000).unref();

const inviteRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  keyGenerator: function(req) { return req.user ? req.user.id : req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many invitations — please wait before sending more.' },
});

// --- direct user-to-user invitations (guest_invitations) ---

router.post('/', requireAuth, inviteRateLimit, async (req, res) => {
  const { toUserId, roomId, message, expiryHours } = req.body;
  if (!toUserId || !UUID_RE.test(toUserId)) return res.status(400).json({ error: 'invalid toUserId' });
  if (roomId && !UUID_RE.test(roomId)) return res.status(400).json({ error: 'invalid roomId' });
  try {
    const safeExpiryHours = Math.min(Math.max(parseInt(expiryHours, 10) || 24, 1), 168);
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

var VALID_INVITE_STATUSES = ['accepted', 'declined'];

router.post('/:id/respond', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'invalid invite id' });
  const status = req.body.status;
  if (!VALID_INVITE_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'status must be accepted or declined' });
  }
  try {
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
    const safeDisplayName = displayName ? String(displayName).slice(0, 80) : null;
    const link = await inviteService.createInviteLink({
      streamId: req.params.streamId,
      createdBy: req.user.id,
      displayName: safeDisplayName,
      role: safeRole,
      maxUses: safeMaxUses,
    });
    res.status(201).json(link);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/links/:token/redeem', requireAuth, async (req, res) => {
  const token = String(req.params.token || '');
  if (!/^[0-9a-f]{32}$/i.test(token)) return res.status(400).json({ error: 'invalid invite token' });
  var _rlKey = req.user.id + ':' + token;
  var _rlNow = Date.now();
  if (_rlNow - (_redeemLog.get(_rlKey) || 0) < REDEEM_COOLDOWN_MS) {
    return res.status(429).json({ error: 'You have already redeemed this invite link recently' });
  }
  try {
    const link = await inviteService.redeemInviteLink(token);
    _redeemLog.set(_rlKey, _rlNow);
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
