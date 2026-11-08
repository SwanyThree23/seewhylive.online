'use strict';
var express = require('express');
var router = express.Router();
var loyaltyService = require('../services/loyaltyService');
var requireAuth    = require('../middleware/auth');

var CACHE_TTL_MS = 60000; // 60 s
var _globalCache = {};  // keyed by tenantId:limit
var _weeklyCache = {};  // keyed by tenantId:limit

// Prune stale entries so the caches don't grow unboundedly on many-tenant deployments
setInterval(function() {
  var cutoff = Date.now() - CACHE_TTL_MS * 2;
  Object.keys(_globalCache).forEach(function(k) { if (_globalCache[k].ts < cutoff) delete _globalCache[k]; });
  Object.keys(_weeklyCache).forEach(function(k) { if (_weeklyCache[k].ts < cutoff) delete _weeklyCache[k]; });
}, CACHE_TTL_MS * 2).unref();

router.get('/global', async function(req, res) {
  try {
    var limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;
    var key = (req.tenantId || 'default') + ':' + limit;
    var cached = _globalCache[key];
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return res.json(cached.data);
    }
    var rows = await loyaltyService.getGlobalLeaderboard(limit, req.tenantId);
    _globalCache[key] = { data: rows, ts: Date.now() };
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/weekly', async function(req, res) {
  try {
    var limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;
    var key = (req.tenantId || 'default') + ':' + limit;
    var cached = _weeklyCache[key];
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return res.json(cached.data);
    }
    var rows = await loyaltyService.getWeeklyLeaderboard(limit, req.tenantId);
    _weeklyCache[key] = { data: rows, ts: Date.now() };
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth, async function(req, res) {
  try {
    var loyalty = await loyaltyService.getUserLoyalty(req.user.id, req.tenantId);
    var rank = await loyaltyService.getUserRank(req.user.id, req.tenantId);
    res.json(Object.assign({}, loyalty, { rank: rank }));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tiers', requireAuth, async function(req, res) {
  try {
    var tiers = await loyaltyService.getRewardTiers(req.tenantId);
    res.json(tiers);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
