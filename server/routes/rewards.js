'use strict';
var express = require('express');
var router = express.Router();
var { rateLimit } = require('express-rate-limit');
var rewardsService = require('../services/rewardsService');
var requireAuth    = require('../middleware/auth');
var requireRole    = requireAuth.requireRole;
var requireOwnerOrSelf = requireAuth.requireOwnerOrSelf;

var challengeCompleteRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: function(req) { return req.user ? req.user.id : req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many completion attempts — please slow down.' },
});

router.get('/leaderboard', requireAuth, async function(req, res) {
  try {
    var period = req.query.period === 'weekly' ? 'weekly' : 'alltime';
    var rows = await rewardsService.getLeaderboard(period, req.tenantId);
    var data = rows.map(function(r) { return { user_id: r.user_id, points: r.points || r.total_points, level: r.level }; });
    res.json(data);
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

var REWARDS_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get('/me/:userId', requireAuth, requireOwnerOrSelf('userId'), async function(req, res) {
  if (!REWARDS_UUID_RE.test(req.params.userId)) return res.status(400).json({ error: 'invalid userId' });
  try {
    var data = await rewardsService.getUserPoints(req.params.userId, req.tenantId);
    res.json(data);
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tiers', requireAuth, async function(req, res) {
  try {
    var data = await rewardsService.getTiers(req.tenantId);
    res.json(data);
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/challenges', requireAuth, async function(req, res) {
  try {
    var data = await rewardsService.getActiveChallenges(req.tenantId);
    res.json(data);
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/challenges/:id/complete', requireAuth, challengeCompleteRateLimit, async function(req, res) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) return res.status(400).json({ error: 'invalid challenge id' });
  try {
    var result = await rewardsService.completeChallenge(req.user.id, req.params.id, req.tenantId);
    res.json(result);
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    var USER_ERRS = ['challenge is not active', 'challenge has expired'];
    var isUserErr = USER_ERRS.includes(err.message);
    res.status(isUserErr ? 400 : 500).json({ error: isUserErr ? err.message : 'Internal server error' });
  }
});

router.get('/my-tier', requireAuth, async function(req, res) {
  try {
    var data = await rewardsService.getSelectedTier(req.user.id, req.tenantId);
    res.json({ tier: data });
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/my-tier', requireAuth, async function(req, res) {
  try {
    var tierId = req.body && req.body.tierId;
    var data = await rewardsService.setSelectedTier(req.user.id, tierId, req.tenantId);
    res.json({ tier: data });
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    var msg = err && err.message;
    var isUserErr = msg === 'invalid tier id' || msg === 'tierId is required';
    res.status(isUserErr ? 400 : 500).json({ error: isUserErr ? msg : 'Internal server error' });
  }
});

module.exports = router;
