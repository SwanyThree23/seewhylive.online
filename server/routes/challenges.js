// server/routes/challenges.js
// INTEGRATION: mount in your main router, e.g.:
//   app.use('/api/challenges', require('./routes/challenges'));
// Also gate admin-only routes (create) behind your real admin check.

const express = require('express');
const router = express.Router();
const challengeService = require('../services/challengeService');
const requireAuth      = require('../middleware/auth');

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'admin only' });
  next();
}

router.get('/', async (req, res) => {
  try {
    const challenges = await challengeService.getActiveChallenges();
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, pointsReward, startsAt, endsAt } = req.body;
    const challenge = await challengeService.createChallenge({
      title,
      description,
      pointsReward,
      startsAt,
      endsAt,
    });
    res.status(201).json(challenge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/complete', requireAuth, async (req, res) => {
  try {
    const completion = await challengeService.completeChallenge(req.params.id, req.user.id);
    res.json(completion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/me/completions', requireAuth, async (req, res) => {
  try {
    const completions = await challengeService.getUserCompletions(req.user.id);
    res.json(completions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
