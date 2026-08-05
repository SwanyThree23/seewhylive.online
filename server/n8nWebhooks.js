var crypto = require('crypto');
var express = require('express');
var n8nRouter = express.Router();

var N8N_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  var streamId = N8N_UUID_RE.test(String(d.streamId || '')) ? String(d.streamId) : null;
  if (global.io) global.io.emit('stream-alert', { type:'live', streamId:streamId, title:title, ts:Date.now() });
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
  var rawAmount = Number(d.amount);
  var safeAmount = (Number.isFinite(rawAmount) && rawAmount > 0 && rawAmount <= 50000) ? rawAmount : 0;
  if (safeAmount === 0) { res.json({ ok: true, skipped: true }); return; }
  var usd = Math.floor(safeAmount * 10) / 100;
  var creator = Math.floor(usd * CREATOR_SPLIT * 100) / 100;
  var platform = Math.floor(usd * PLATFORM_FEE * 100) / 100;
  var safeFrom = String(d.from || '').slice(0, 80);
  var gemStreamId = N8N_UUID_RE.test(String(d.streamId || '')) ? String(d.streamId) : 'main';
  if (global.io) global.io.to(gemStreamId).emit('gem-send', { user:safeFrom, amount:safeAmount, usd:usd, creatorShare:creator, ts:Date.now() });
  res.json({ ok: true, usd: usd, creatorShare: creator, platformFee: platform });
});

n8nRouter.post('/guardian-flag', function(req, res) {
  var d = req.body;
  var score = Math.min(Math.max(Number(d.score) || 0, 0), 100);
  var action = score >= 95 ? 'ban' : score >= 75 ? 'mute' : 'flag';
  var safeUser = String(d.user || '').slice(0, 80);
  var gfRoomId = N8N_UUID_RE.test(String(d.roomId || '')) ? String(d.roomId) : null;
  var target = gfRoomId ? global.io.to(gfRoomId) : null;
  if (global.io && target) target.emit('moderation-action', { user:safeUser, score:score, action:action, ts:Date.now() });
  res.json({ ok: true, action: action });
});

n8nRouter.post('/battle-result', function(req, res) {
  var d = req.body;
  var safeWinner = String(d.winner || '').slice(0, 80);
  var safeLoser  = String(d.loser  || '').slice(0, 80);
  var safeRound  = Math.floor(Math.min(Math.max(Number(d.round) || 1, 1), 999));
  if (global.io) global.io.emit('battle-result', { winner:safeWinner, loser:safeLoser, round:safeRound, ts:Date.now() });
  res.json({ ok: true, winner: safeWinner });
});

n8nRouter.post('/viewer-milestone', function(req, res) {
  var d = req.body;
  var safeCount = Math.floor(Math.min(Math.max(Number(d.count) || 0, 0), 10000000));
  var vmStreamId = N8N_UUID_RE.test(String(d.streamId || '')) ? String(d.streamId) : 'main';
  if (global.io) global.io.to(vmStreamId).emit('viewer-milestone', { type:'viewers', count:safeCount, ts:Date.now() });
  res.json({ ok: true, count: safeCount });
});

module.exports = n8nRouter;
