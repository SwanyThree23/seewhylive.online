var express = require('express');
var n8nRouter = express.Router();

n8nRouter.get('/ping', function(req, res) {
  res.json({ pong: true, ts: Date.now() });
});

n8nRouter.get('/health', function(req, res) {
  res.json({ ok: true, server: 'seewhy-live', ts: Date.now() });
});

n8nRouter.post('/stream-live', function(req, res) {
  var d = req.body;
  if (global.io) global.io.emit('stream-alert', { type:'live', streamId:d.streamId, title:d.title||'SeeWhy LIVE is streaming!', ts:Date.now() });
  res.json({ ok: true, event: 'stream-live' });
});

n8nRouter.post('/stream-end', function(req, res) {
  if (global.io) global.io.emit('stream-alert', { type:'ended', ts:Date.now() });
  res.json({ ok: true, event: 'stream-end' });
});

n8nRouter.post('/gem-transaction', function(req, res) {
  var d = req.body;
  var usd = Math.floor(Number(d.amount) * 10) / 100;
  var creator = Math.floor(usd * 0.90 * 100) / 100;
  var platform = Math.floor(usd * 0.10 * 100) / 100;
  if (global.io) global.io.to(d.streamId||'main').emit('gem-send', { user:d.from, amount:d.amount, usd:usd, creatorShare:creator, ts:Date.now() });
  res.json({ ok: true, usd: usd, creatorShare: creator, platformFee: platform });
});

n8nRouter.post('/guardian-flag', function(req, res) {
  var d = req.body;
  var action = d.score >= 95 ? 'ban' : d.score >= 75 ? 'mute' : 'flag';
  if (global.io) global.io.emit('moderation-action', { user:d.user, score:d.score, action:action, ts:Date.now() });
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
