const express = require('express');
const router = express.Router();
const rewardsService = require('../services/rewardsService');
const requireAuth    = require('../middleware/auth');

router.get('/leaderboard', requireAuth, async (req, res) => {
  try {
    const period = req.query.period === 'weekly' ? 'weekly' : 'alltime';
    const rows = await rewardsService.getLeaderboard(period);
    const data = rows.map(function(r) { return { points: r.points || r.total_points, level: r.level }; });
    res.json(data);
  } catch (err) {
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
    const data = await rewardsService.getUserPoints(req.params.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tiers', async (req, res) => {
  try {
    const data = await rewardsService.getTiers();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/challenges', async (req, res) => {
  try {
    const data = await rewardsService.getActiveChallenges();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/challenges/:id/complete', requireAuth, async (req, res) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) return res.status(400).json({ error: 'invalid challenge id' });
  try {
    const result = await rewardsService.completeChallenge(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
