'use strict';
var express = require('express');
var router = express.Router();
var loyaltyService = require('../services/loyaltyService');
var requireAuth    = require('../middleware/auth');

router.get('/global', requireAuth, async function(req, res) {
  try {
    var limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;
    var rows = await loyaltyService.getGlobalLeaderboard(limit, req.tenantId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/weekly', requireAuth, async function(req, res) {
  try {
    var limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;
    var rows = await loyaltyService.getWeeklyLeaderboard(limit, req.tenantId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth, async function(req, res) {
  try {
    var loyalty = await loyaltyService.getUserLoyalty(req.user.id);
    var rank = await loyaltyService.getUserRank(req.user.id, req.tenantId);
    res.json(Object.assign({}, loyalty, { rank: rank }));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tiers', async function(req, res) {
  try {
    var tiers = await loyaltyService.getRewardTiers(req.tenantId);
    res.json(tiers);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
