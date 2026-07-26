const express = require('express');
const router = express.Router();
const rewardsService = require('../services/rewardsService');
const requireAuth    = require('../middleware/auth');

router.get('/leaderboard', async (req, res) => {
  try {
    const period = req.query.period === 'weekly' ? 'weekly' : 'alltime';
    const data = await rewardsService.getLeaderboard(period);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me/:userId', requireAuth, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }
    const data = await rewardsService.getUserPoints(req.params.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tiers', async (req, res) => {
  try {
    const data = await rewardsService.getTiers();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/challenges', async (req, res) => {
  try {
    const data = await rewardsService.getActiveChallenges();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/challenges/:id/complete', requireAuth, async (req, res) => {
  try {
    const result = await rewardsService.completeChallenge(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
