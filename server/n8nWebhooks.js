var crypto = require('crypto');
var express = require('express');
var n8nRouter = express.Router();

// HMAC-based shared-secret check. Set N8N_SECRET env var to a random string and
// configure n8n to send it as the x-n8n-secret request header.
// When N8N_SECRET is unset (dev mode), the guard is skipped.
n8nRouter.use(function(req, res, next) {
  var secret = process.env.N8N_SECRET || '';
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'unauthorized' });
    }
    return next();
  }
  var sig = req.headers['x-n8n-secret'] || '';
  var hash = function(s) { return crypto.createHash('sha256').update(String(s)).digest(); };
  if (!crypto.timingSafeEqual(hash(sig), hash(secret))) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
});

n8nRouter.get('/ping', function(req, res) {
  res.json({ pong: true, ts: Date.now() });
});

n8nRouter.get('/health', function(req, res) {
  res.json({ ok: true, server: 'seewhy-live', ts: Date.now() });
});

n8nRouter.post('/stream-live', function(req, res) {
  var d = req.body;
  var title = String(d.title || 'SeeWhy LIVE is streaming!').slice(0, 120);
  if (global.io) global.io.emit('stream-alert', { type:'live', streamId:d.streamId, title:title, ts:Date.now() });
  res.json({ ok: true, event: 'stream-live' });
});

n8nRouter.post('/stream-end', function(req, res) {
  if (global.io) global.io.emit('stream-alert', { type:'ended', ts:Date.now() });
  res.json({ ok: true, event: 'stream-end' });
});

var CREATOR_SPLIT = 0.90;
var PLATFORM_FEE  = 0.10;

n8nRouter.post('/gem-transaction', function(req, res) {
  var d = req.body;
  var usd = Math.floor(Number(d.amount) * 10) / 100;
  var creator = Math.floor(usd * CREATOR_SPLIT * 100) / 100;
  var platform = Math.floor(usd * PLATFORM_FEE * 100) / 100;
  if (global.io) global.io.to(d.streamId||'main').emit('gem-send', { user:d.from, amount:d.amount, usd:usd, creatorShare:creator, ts:Date.now() });
  res.json({ ok: true, usd: usd, creatorShare: creator, platformFee: platform });
});

n8nRouter.post('/guardian-flag', function(req, res) {
  var d = req.body;
  var score = Number(d.score) || 0;
  var action = score >= 95 ? 'ban' : score >= 75 ? 'mute' : 'flag';
  var target = d.roomId ? global.io.to(String(d.roomId)) : null;
  if (global.io && target) target.emit('moderation-action', { user:d.user, score:d.score, action:action, ts:Date.now() });
  res.json({ ok: true, action: action });
});

n8nRouter.post('/battle-result', function(req, res) {
  var d = req.body;
  if (global.io) global.io.emit('battle-result', { winner:d.winner, loser:d.loser, round:d.round, ts:Date.now() });
  res.json({ ok: true, winner: d.winner });
});

n8nRouter.post('/viewer-milestone', function(req, res) {
  var d = req.body;
  if (global.io) global.io.to(d.streamId||'main').emit('milestone', { type:'viewers', count:d.count, ts:Date.now() });
  res.json({ ok: true, count: d.count });
});

module.exports = n8nRouter;
