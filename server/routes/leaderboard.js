// server/routes/leaderboard.js
// INTEGRATION: mount in your main router, e.g.:
//   app.use('/api/leaderboard', require('./routes/leaderboard'));

const express = require('express');
const router = express.Router();
const loyaltyService = require('../services/loyaltyService');
const requireAuth    = require('../middleware/auth');

router.get('/global', async (req, res) => {
  try {
    let limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;
    const rows = await loyaltyService.getGlobalLeaderboard(limit);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/weekly', async (req, res) => {
  try {
    let limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;
    const rows = await loyaltyService.getWeeklyLeaderboard(limit);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const loyalty = await loyaltyService.getUserLoyalty(req.user.id);
    const rank = await loyaltyService.getUserRank(req.user.id);
    res.json(Object.assign({}, loyalty, { rank }));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tiers', async (req, res) => {
  try {
    const tiers = await loyaltyService.getRewardTiers();
    res.json(tiers);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
