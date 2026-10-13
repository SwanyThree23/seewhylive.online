'use strict';
var express = require('express');
var router = express.Router();
var battleService = require('../services/battleService');
var requireAuth   = require('../middleware/auth');
var pool          = require('../db');
var { rateLimit } = require('express-rate-limit');

var battleVoteRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: function(req) { return (req.user && req.user.id) || req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many vote requests — please slow down.' },
});

var battleCreateRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: function(req) { return (req.user && req.user.id) || req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many challenge requests — please slow down.' },
});

var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validateId(req, res, next) {
  if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'invalid battle id' });
  next();
}

router.post('/', requireAuth, battleCreateRateLimit, async function(req, res) {
  try {
    var defenderId = req.body.defenderId;
    var roomId = req.body.roomId;
    if (!UUID_RE.test(defenderId)) return res.status(400).json({ error: 'invalid defenderId' });
    if (defenderId === req.user.id) return res.status(400).json({ error: 'cannot challenge yourself' });
    if (roomId && !UUID_RE.test(roomId)) return res.status(400).json({ error: 'invalid roomId' });
    var challengerName = String(req.body.challengerName || '').slice(0, 80);
    var defenderName   = String(req.body.defenderName  || '').slice(0, 80);
    var rawDuration = Math.floor(Number(req.body.durationMinutes) || 5);
    var durationMinutes = Math.min(Math.max(rawDuration, 1), 60);
    var battle = await battleService.createChallenge({
      tenantId: req.tenantId,
      challengerId: req.user.id,
      defenderId: defenderId,
      challengerName: challengerName,
      defenderName: defenderName,
      roomId: roomId,
      durationMinutes: durationMinutes,
    });
    res.status(201).json(battle);
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/accept', requireAuth, validateId, async function(req, res) {
  try {
    var existing = await battleService.getBattle(req.params.id, req.tenantId);
    if (!existing) return res.status(404).json({ error: 'battle not found' });
    if (existing.defender_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    var roomId = req.body.roomId;
    if (roomId && !UUID_RE.test(roomId)) return res.status(400).json({ error: 'invalid roomId' });
    var battle = await battleService.acceptChallenge(req.params.id, roomId, req.tenantId);
    if (!battle) return res.status(404).json({ error: 'battle not found or not pending' });
    res.json(battle);
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/start', requireAuth, validateId, async function(req, res) {
  try {
    var existing = await battleService.getBattle(req.params.id, req.tenantId);
    if (!existing) return res.status(404).json({ error: 'battle not found' });
    if (existing.challenger_id !== req.user.id && existing.defender_id !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }
    var battle = await battleService.startBattle(req.params.id, req.tenantId);
    if (!battle) return res.status(404).json({ error: 'battle not found or not pending' });
    res.json(battle);
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/vote', requireAuth, battleVoteRateLimit, validateId, async function(req, res) {
  try {
    var side = req.body.side;
    if (side !== 'challenger' && side !== 'defender') {
      return res.status(400).json({ error: 'side must be challenger or defender' });
    }
    var giftValueCents = Math.floor(req.body.giftValueCents);
    if (!Number.isFinite(giftValueCents) || giftValueCents < 1 || giftValueCents > 50000) {
      return res.status(400).json({ error: 'giftValueCents must be between 1 and 50000' });
    }
    var battle = await battleService.castVote({
      tenantId: req.tenantId,
      battleId: req.params.id,
      voterId: req.user.id,
      side: side,
      giftValueCents: giftValueCents,
    });
    res.json(battle);
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/active', requireAuth, async function(req, res) {
  try {
    var battles = await battleService.getActiveBattles(req.tenantId);
    res.json(battles);
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/leaderboard', requireAuth, async function(req, res) {
  try {
    var limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    var result = await pool.query(
      'SELECT winner_id, COUNT(*) AS wins, ' +
      'COALESCE(SUM(CASE WHEN winner_id = challenger_id THEN challenger_points ELSE defender_points END), 0) AS total_points, ' +
      'MAX(CASE WHEN winner_id = challenger_id THEN challenger_name ELSE defender_name END) AS display_name ' +
      'FROM pk_battles ' +
      'WHERE status = $1 AND winner_id IS NOT NULL AND tenant_id = $3 ' +
      'GROUP BY winner_id ' +
      'ORDER BY wins DESC, total_points DESC ' +
      'LIMIT $2',
      ['ended', limit, req.tenantId]
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
    console.error('[ROUTE ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', validateId, async function(req, res) {
  try {
    var battle = await battleService.getBattle(req.params.id, req.tenantId);
    if (!battle) return res.status(404).json({ error: 'battle not found' });
    res.json(battle);
  } catch (err) {
    console.error('[ROUTE ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
