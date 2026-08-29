const express = require('express');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');
const rewardsService = require('../services/rewardsService');
const requireAuth    = require('../middleware/auth');

var challengeCompleteRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: function(req) { return req.user ? req.user.id : req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many completion attempts — please slow down.' },
});

router.get('/leaderboard', requireAuth, async (req, res) => {
  try {
    const period = req.query.period === 'weekly' ? 'weekly' : 'alltime';
    const rows = await rewardsService.getLeaderboard(req.tenantId, period);
    const data = rows.map(function(r) { return { user_id: r.user_id, points: r.points || r.total_points, level: r.level }; });
    res.json(data);
  } catch (err) { console.error('[ROUTE ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const REWARDS_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get('/me/:userId', requireAuth, async (req, res) => {
  if (!REWARDS_UUID_RE.test(req.params.userId)) return res.status(400).json({ error: 'invalid userId' });
  try {
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }
    const data = await rewardsService.getUserPoints(req.tenantId, req.params.userId);
    res.json(data);
  } catch (err) { console.error('[ROUTE ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tiers', async (req, res) => {
  try {
    const data = await rewardsService.getTiers(req.tenantId);
    res.json(data);
  } catch (err) { console.error('[ROUTE ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/challenges', async (req, res) => {
  try {
    const data = await rewardsService.getActiveChallenges(req.tenantId);
    res.json(data);
  } catch (err) { console.error('[ROUTE ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/challenges/:id/complete', requireAuth, challengeCompleteRateLimit, async (req, res) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) return res.status(400).json({ error: 'invalid challenge id' });
  try {
    const result = await rewardsService.completeChallenge(req.tenantId, req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    var USER_ERRS = ['challenge is not active', 'challenge has expired', 'already voted in this battle'];
    var isUserErr = USER_ERRS.includes(err.message) || (err.code === '23505');
    res.status(isUserErr ? 400 : 500).json({ error: err.message || 'Internal server error' });
  }
});

router.get('/my-tier', requireAuth, async (req, res) => {
  try {
    const data = await rewardsService.getSelectedTier(req.tenantId, req.user.id);
    res.json({ tier: data });
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/my-tier', requireAuth, async (req, res) => {
  try {
    var tierId = req.body && req.body.tierId;
    const data = await rewardsService.setSelectedTier(req.tenantId, req.user.id, tierId);
    res.json({ tier: data });
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    var msg = err && err.message;
    var isUserErr = msg === 'invalid tier id' || msg === 'tierId is required';
    res.status(isUserErr ? 400 : 500).json({ error: msg || 'Internal server error' });
  }
});

module.exports = router;
