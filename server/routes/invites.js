'use strict';
var express = require('express');
var rateLimit = require('express-rate-limit');
var router = express.Router();
var db          = require('../db');
var inviteService = require('../services/inviteService');
var requireAuth   = require('../middleware/auth');

var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

var _redeemLog = new Map();
var REDEEM_COOLDOWN_MS = 24 * 60 * 60 * 1000;

setInterval(function() {
  var cutoff = Date.now() - REDEEM_COOLDOWN_MS;
  _redeemLog.forEach(function(ts, key) {
    if (ts < cutoff) _redeemLog.delete(key);
  });
}, 60000).unref();

var inviteRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  keyGenerator: function(req) { return req.user ? req.user.id : req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many invitations — please wait before sending more.' },
});

router.post('/', requireAuth, inviteRateLimit, async function(req, res) {
  var toUserId = req.body.toUserId;
  var roomId = req.body.roomId;
  var message = req.body.message;
  var expiryHours = req.body.expiryHours;
  if (!toUserId || !UUID_RE.test(toUserId)) return res.status(400).json({ error: 'invalid toUserId' });
  if (roomId && !UUID_RE.test(roomId)) return res.status(400).json({ error: 'invalid roomId' });
  try {
    var safeExpiryHours = Math.min(Math.max(parseInt(expiryHours, 10) || 24, 1), 168);
    var safeMessage = message ? String(message).slice(0, 500) : null;
    var invite = await inviteService.sendInvitation({
      tenantId: req.tenantId,
      fromUserId: req.user.id,
      toUserId: toUserId,
      roomId: roomId,
      message: safeMessage,
      expiryHours: safeExpiryHours,
    });
    res.status(201).json(invite);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

var VALID_INVITE_STATUSES = ['accepted', 'declined'];

router.post('/:id/respond', requireAuth, inviteRateLimit, async function(req, res) {
  if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'invalid invite id' });
  var status = req.body.status;
  if (!VALID_INVITE_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'status must be accepted or declined' });
  }
  try {
    var invite = await inviteService.respondToInvitation(req.params.id, status, req.user.id, req.tenantId);
    if (!invite) return res.status(404).json({ error: 'invite not found, expired, or already responded' });
    res.json(invite);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth, async function(req, res) {
  try {
    var invites = await inviteService.getPendingInvitations(req.user.id, req.tenantId);
    res.json(invites);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/streams/:streamId/links', requireAuth, async function(req, res) {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    var ownerCheck = await db.query(
      'SELECT creator_id FROM streams WHERE id = $1 AND tenant_id = $2',
      [req.params.streamId, req.tenantId]
    );
    if (!ownerCheck.rows[0] || ownerCheck.rows[0].creator_id !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }
    var displayName = req.body.displayName;
    var role = req.body.role;
    var maxUses = req.body.maxUses;
    var ALLOWED_ROLES = ['guest', 'cohost', 'viewer'];
    var safeRole = ALLOWED_ROLES.includes(role) ? role : 'guest';
    var safeMaxUses = Math.min(Math.max(Math.floor(Number(maxUses) || 1), 1), 100);
    var safeDisplayName = displayName ? String(displayName).slice(0, 80) : null;
    var link = await inviteService.createInviteLink({
      tenantId: req.tenantId,
      streamId: req.params.streamId,
      createdBy: req.user.id,
      displayName: safeDisplayName,
      role: safeRole,
      maxUses: safeMaxUses,
    });
    res.status(201).json(link);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/links/:token/redeem', requireAuth, inviteRateLimit, async function(req, res) {
  var token = String(req.params.token || '');
  if (!/^[0-9a-f]{32}$/i.test(token)) return res.status(400).json({ error: 'invalid invite token' });
  var _rlKey = req.user.id + ':' + token;
  var _rlNow = Date.now();
  if (_rlNow - (_redeemLog.get(_rlKey) || 0) < REDEEM_COOLDOWN_MS) {
    return res.status(429).json({ error: 'You have already redeemed this invite link recently' });
  }
  _redeemLog.set(_rlKey, _rlNow);
  try {
    var link = await inviteService.redeemInviteLink(token, req.tenantId);
    res.json(link);
  } catch (err) {
    _redeemLog.delete(_rlKey);
    var isRedeemUserErr = err.message === 'invite link not found, exhausted, or revoked';
    res.status(isRedeemUserErr ? 400 : 500).json({ error: isRedeemUserErr ? err.message : 'Internal server error' });
  }
});

router.post('/links/:id/revoke', requireAuth, async function(req, res) {
  if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'invalid invite link id' });
  try {
    var link = await inviteService.revokeInviteLink(req.params.id, req.user.id, req.tenantId);
    if (!link) return res.status(404).json({ error: 'not found, not yours, or already revoked' });
    res.json(link);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/streams/:streamId/links', requireAuth, async function(req, res) {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    var ownerCheck = await db.query(
      'SELECT creator_id FROM streams WHERE id = $1 AND tenant_id = $2',
      [req.params.streamId, req.tenantId]
    );
    if (!ownerCheck.rows[0] || ownerCheck.rows[0].creator_id !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }
    var links = await inviteService.getStreamInviteLinks(req.params.streamId, req.tenantId);
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
