// server/routes/battles.js
// INTEGRATION: mount this in your main router, e.g.:
//   app.use('/api/battles', require('./routes/battles'));
// CORRECTED: uses defenderId (not opponentId) and durationMinutes (not durationSeconds),
// matching the real pre-existing pk_battles schema.

const express = require('express');
const router = express.Router();
const battleService = require('../services/battleService');
const requireAuth   = require('../middleware/auth');
const pool          = require('../db');
const { rateLimit } = require('express-rate-limit');

const battleVoteRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: function(req) { return (req.user && req.user.id) || req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many vote requests — please slow down.' },
});

const battleCreateRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: function(req) { return (req.user && req.user.id) || req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many challenge requests — please slow down.' },
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validateId(req, res, next) {
  if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'invalid battle id' });
  next();
}

router.post('/', requireAuth, battleCreateRateLimit, async (req, res) => {
  try {
    const { defenderId, roomId } = req.body;
    if (!UUID_RE.test(defenderId)) return res.status(400).json({ error: 'invalid defenderId' });
    if (defenderId === req.user.id) return res.status(400).json({ error: 'cannot challenge yourself' });
    if (roomId && !UUID_RE.test(roomId)) return res.status(400).json({ error: 'invalid roomId' });
    const challengerName = String(req.body.challengerName || '').slice(0, 80);
    const defenderName   = String(req.body.defenderName  || '').slice(0, 80);
    const rawDuration = Math.floor(Number(req.body.durationMinutes) || 5);
    const durationMinutes = Math.min(Math.max(rawDuration, 1), 60);
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

router.post('/:id/accept', requireAuth, validateId, async (req, res) => {
  try {
    const existing = await battleService.getBattle(req.params.id);
    if (!existing) return res.status(404).json({ error: 'battle not found' });
    if (existing.defender_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    const { roomId } = req.body;
    if (roomId && !UUID_RE.test(roomId)) return res.status(400).json({ error: 'invalid roomId' });
    const battle = await battleService.acceptChallenge(req.params.id, roomId);
    if (!battle) return res.status(404).json({ error: 'battle not found or not pending' });
    res.json(battle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/start', requireAuth, validateId, async (req, res) => {
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

router.post('/:id/vote', requireAuth, battleVoteRateLimit, validateId, async (req, res) => {
  try {
    const { side } = req.body;
    if (side !== 'challenger' && side !== 'defender') {
      return res.status(400).json({ error: 'side must be challenger or defender' });
    }
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    var limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    var result = await pool.query(
      'SELECT winner_id, COUNT(*) AS wins, ' +
      'COALESCE(SUM(CASE WHEN winner_id = challenger_id THEN challenger_points ELSE defender_points END), 0) AS total_points, ' +
      'MAX(CASE WHEN winner_id = challenger_id THEN challenger_name ELSE defender_name END) AS display_name ' +
      'FROM pk_battles ' +
      'WHERE status = $1 AND winner_id IS NOT NULL ' +
      'GROUP BY winner_id ' +
      'ORDER BY wins DESC, total_points DESC ' +
      'LIMIT $2',
      ['ended', limit]
    );
    res.json(result.rows.map(function(r, i) {
      return {
        rank: i + 1,
        userId: r.winner_id,
        displayName: r.display_name || 'Unknown',
        wins: parseInt(r.wins) || 0,
        totalPoints: parseInt(r.total_points) || 0,
      };
    }));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', validateId, async (req, res) => {
  try {
    const battle = await battleService.getBattle(req.params.id);
    if (!battle) return res.status(404).json({ error: 'battle not found' });
    res.json(battle);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
