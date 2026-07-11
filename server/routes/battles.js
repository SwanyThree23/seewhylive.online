// server/routes/battles.js
// INTEGRATION: mount this in your main router, e.g.:
//   app.use('/api/battles', require('./routes/battles'));
// Also wire your existing auth middleware in place of `requireAuth` below.
// CORRECTED: uses defenderId (not opponentId) and durationMinutes (not durationSeconds),
// matching the real pre-existing pk_battles schema.

const express = require('express');
const router = express.Router();
const battleService = require('../services/battleService');

// TODO: replace with your real auth middleware import
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  next();
}

router.post('/', requireAuth, async (req, res) => {
  try {
    const { defenderId, challengerName, defenderName, roomId, durationMinutes } = req.body;
    const battle = await battleService.createChallenge({
      challengerId: req.user.id,
      defenderId,
      challengerName,
      defenderName,
      roomId,
      durationMinutes,
    });
    res.status(201).json(battle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/accept', requireAuth, async (req, res) => {
  try {
    const { roomId } = req.body;
    const battle = await battleService.acceptChallenge(req.params.id, roomId);
    if (!battle) return res.status(404).json({ error: 'battle not found or not pending' });
    res.json(battle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/start', requireAuth, async (req, res) => {
  try {
    const battle = await battleService.startBattle(req.params.id);
    if (!battle) return res.status(404).json({ error: 'battle not found or not pending' });
    // Socket broadcast happens in battleHandlers.js — call it from here if you
    // prefer REST-triggered start, or drive entirely from sockets instead.
    res.json(battle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/vote', requireAuth, async (req, res) => {
  try {
    const { side, giftValueCents } = req.body; // side: 'challenger' | 'defender'
    const battle = await battleService.castVote({
      battleId: req.params.id,
      voterId: req.user.id,
      side,
      giftValueCents,
    });
    res.json(battle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const battles = await battleService.getActiveBattles();
    res.json(battles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const battle = await battleService.getBattle(req.params.id);
    if (!battle) return res.status(404).json({ error: 'battle not found' });
    res.json(battle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
