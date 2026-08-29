const express = require('express');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');
const challengeService = require('../services/challengeService');
const requireAuth      = require('../middleware/auth');

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

router.get('/', async (req, res) => {
  try {
    const challenges = await challengeService.getActiveChallenges(req.tenantId);
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, pointsReward, startsAt, endsAt } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 120) {
      return res.status(400).json({ error: 'title must be a non-empty string of at most 120 characters' });
    }
    if (description && typeof description === 'string' && description.length > 1000) {
      return res.status(400).json({ error: 'description must be at most 1000 characters' });
    }
    const pts = Math.floor(Number(pointsReward));
    if (!Number.isFinite(pts) || pts < 1 || pts > 1000000) {
      return res.status(400).json({ error: 'pointsReward must be a positive integer up to 1,000,000' });
    }
    if (startsAt && isNaN(Date.parse(startsAt))) {
      return res.status(400).json({ error: 'startsAt must be a valid date string' });
    }
    if (endsAt && isNaN(Date.parse(endsAt))) {
      return res.status(400).json({ error: 'endsAt must be a valid date string' });
    }
    const challenge = await challengeService.createChallenge({
      tenantId: req.tenantId,
      title: title.trim(),
      description: description || null,
      pointsReward: pts,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
    });
    res.status(201).json(challenge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/complete', requireAuth, challengeCompleteRateLimit, async (req, res) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: 'invalid challenge id' });
    }
    const completion = await challengeService.completeChallenge(req.tenantId, req.params.id, req.user.id);
    res.json(completion);
  } catch (err) {
    const USER_MSGS = ['challenge is not active', 'challenge has expired'];
    const msg = USER_MSGS.includes(err.message) ? err.message : 'Unable to complete challenge';
    res.status(400).json({ error: msg });
  }
});

router.get('/me/completions', requireAuth, async (req, res) => {
  try {
    const completions = await challengeService.getUserCompletions(req.tenantId, req.user.id);
    res.json(completions);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
