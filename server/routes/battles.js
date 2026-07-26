// server/routes/battles.js
// INTEGRATION: mount this in your main router, e.g.:
//   app.use('/api/battles', require('./routes/battles'));
// CORRECTED: uses defenderId (not opponentId) and durationMinutes (not durationSeconds),
// matching the real pre-existing pk_battles schema.

const express = require('express');
const router = express.Router();
const battleService = require('../services/battleService');
const requireAuth   = require('../middleware/auth');

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
    const existing = await battleService.getBattle(req.params.id);
    if (!existing) return res.status(404).json({ error: 'battle not found' });
    if (existing.defender_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
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
    const existing = await battleService.getBattle(req.params.id);
    if (!existing) return res.status(404).json({ error: 'battle not found' });
    if (existing.challenger_id !== req.user.id && existing.defender_id !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const battle = await battleService.startBattle(req.params.id);
    if (!battle) return res.status(404).json({ error: 'battle not found or not pending' });
    res.json(battle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/vote', requireAuth, async (req, res) => {
  try {
    const { side } = req.body;
    const giftValueCents = Math.floor(req.body.giftValueCents);
    if (!Number.isFinite(giftValueCents) || giftValueCents < 1 || giftValueCents > 50000) {
      return res.status(400).json({ error: 'giftValueCents must be between 1 and 50000' });
    }
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
