'use strict';
var express = require('express');
var router = express.Router();
var { rateLimit } = require('express-rate-limit');
var challengeService = require('../services/challengeService');
var requireAuth      = require('../middleware/auth');

var challengeCompleteRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: function(req) { return req.user ? req.user.id : req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many completion attempts — please slow down.' },
});

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'admin only' });
  next();
}

router.get('/', async function(req, res) {
  try {
    var challenges = await challengeService.getActiveChallenges(req.tenantId);
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAuth, requireAdmin, async function(req, res) {
  try {
    var title = req.body.title;
    var description = req.body.description;
    var pointsReward = req.body.pointsReward;
    var startsAt = req.body.startsAt;
    var endsAt = req.body.endsAt;
    if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 120) {
      return res.status(400).json({ error: 'title must be a non-empty string of at most 120 characters' });
    }
    if (description && typeof description === 'string' && description.length > 1000) {
      return res.status(400).json({ error: 'description must be at most 1000 characters' });
    }
    var pts = Math.floor(Number(pointsReward));
    if (!Number.isFinite(pts) || pts < 1 || pts > 1000000) {
      return res.status(400).json({ error: 'pointsReward must be a positive integer up to 1,000,000' });
    }
    if (startsAt && isNaN(Date.parse(startsAt))) {
      return res.status(400).json({ error: 'startsAt must be a valid date string' });
    }
    if (endsAt && isNaN(Date.parse(endsAt))) {
      return res.status(400).json({ error: 'endsAt must be a valid date string' });
    }
    var challenge = await challengeService.createChallenge({
      tenantId: req.tenantId,
      title: title.trim(),
      description: description || null,
      pointsReward: pts,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
    });
    res.status(201).json(challenge);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/complete', requireAuth, challengeCompleteRateLimit, async function(req, res) {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: 'invalid challenge id' });
    }
    var completion = await challengeService.completeChallenge(req.params.id, req.user.id, req.tenantId);
    res.json(completion);
  } catch (err) {
    if (err.message === 'challenge not found') return res.status(404).json({ error: 'challenge not found' });
    var USER_MSGS = ['challenge is not active', 'challenge has expired', 'challenge already completed'];
    var isUserErr = USER_MSGS.includes(err.message) || err.code === '23505';
    res.status(isUserErr ? 400 : 500).json({ error: isUserErr ? err.message : 'Internal server error' });
  }
});

router.get('/me/completions', requireAuth, async function(req, res) {
  try {
    var completions = await challengeService.getUserCompletions(req.user.id, req.tenantId);
    res.json(completions);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
