'use strict';
var express    = require('express');
var crypto     = require('crypto');
var rateLimit  = require('express-rate-limit');
var router     = express.Router();
var requireAuth = require('../middleware/auth');
var wh         = require('../services/webhookService');
var logger;
try { logger = require('../logger'); } catch (_) { logger = console; }

var ALLOWED_EVENTS = [
  'room.started',
  'room.ended',
  'user.joined',
  'hand.raised',
  'battle.result',
  'tip.received',
  'clip.ready',
];

var createLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many webhook create requests — please slow down.' },
});

var testLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many webhook test requests.' },
});

function requireHost(req, res, next) {
  var role = req.user && req.user.role;
  if (role !== 'host' && role !== 'owner' && role !== 'admin') {
    return res.status(403).json({ error: 'Host access required' });
  }
  next();
}

function validateUrl(raw) {
  if (!raw || typeof raw !== 'string') return 'URL is required';
  var trimmed = raw.trim();
  if (!trimmed.startsWith('https://')) return 'Webhook URL must start with https://';
  var parsed;
  try { parsed = new URL(trimmed); } catch (_) { return 'Invalid URL format'; }
  var hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  ) return 'Private IP/localhost not allowed';
  if (trimmed.length > 1024) return 'URL too long';
  return null;
}

function userId(req)   { return req.user.id || req.user.userId; }
function tenantId(req) { return req.tenantId || ''; }

// GET /api/outbound-webhooks/events
router.get('/events', function(_req, res) {
  res.json({ events: ALLOWED_EVENTS });
});

// GET /api/outbound-webhooks
router.get('/', requireAuth, requireHost, function(req, res) {
  try {
    var rows = wh.listByHost(userId(req), tenantId(req));
    res.json({ webhooks: rows.map(function(r) {
      var evs;
      try { evs = JSON.parse(r.events); } catch (_) { evs = []; }
      return { id: r.id, url: r.url, events: evs, active: r.active === 1, created_at: r.created_at };
    })});
  } catch (e) {
    logger.error('[outbound-webhooks] GET error: ' + e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/outbound-webhooks
router.post('/', requireAuth, requireHost, createLimit, function(req, res) {
  var urlErr = validateUrl(req.body && req.body.url);
  if (urlErr) return res.status(400).json({ error: urlErr });

  var events = Array.isArray(req.body && req.body.events) ? req.body.events : ALLOWED_EVENTS;
  events = events.filter(function(e) { return ALLOWED_EVENTS.includes(e); });
  if (!events.length) events = ALLOWED_EVENTS.slice();

  try {
    var count = wh.countByHost(userId(req), tenantId(req));
    if (count >= 10) return res.status(400).json({ error: 'Maximum 10 webhook subscriptions per account' });
  } catch (e) { return res.status(500).json({ error: 'DB error' }); }

  var id     = crypto.randomUUID();
  var secret = crypto.randomBytes(32).toString('hex');
  var now    = Math.floor(Date.now() / 1000);
  var url    = req.body.url.trim();

  try {
    wh.create(id, tenantId(req), userId(req), url, secret, events, now);
    res.status(201).json({ id: id, url: url, events: events, active: true, secret: secret, created_at: now });
  } catch (e) {
    logger.error('[outbound-webhooks] INSERT error: ' + e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

// PATCH /api/outbound-webhooks/:id
router.patch('/:id', requireAuth, requireHost, function(req, res) {
  var id = req.params.id;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return res.status(400).json({ error: 'Invalid webhook ID' });
  try {
    var row = wh.getOne(id, userId(req), tenantId(req));
    if (!row) return res.status(404).json({ error: 'Webhook not found' });
    if (typeof (req.body && req.body.active) === 'boolean') wh.setActive(id, req.body.active);
    if (Array.isArray(req.body && req.body.events)) {
      var evs = req.body.events.filter(function(e) { return ALLOWED_EVENTS.includes(e); });
      wh.setEvents(id, evs);
    }
    res.json({ ok: true });
  } catch (e) {
    logger.error('[outbound-webhooks] PATCH error: ' + e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

// DELETE /api/outbound-webhooks/:id
router.delete('/:id', requireAuth, requireHost, function(req, res) {
  var id = req.params.id;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return res.status(400).json({ error: 'Invalid webhook ID' });
  try {
    var changed = wh.remove(id, userId(req), tenantId(req));
    if (!changed) return res.status(404).json({ error: 'Webhook not found' });
    res.json({ ok: true });
  } catch (e) {
    logger.error('[outbound-webhooks] DELETE error: ' + e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/outbound-webhooks/:id/test
router.post('/:id/test', requireAuth, requireHost, testLimit, function(req, res) {
  var id = req.params.id;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return res.status(400).json({ error: 'Invalid webhook ID' });
  try {
    var row = wh.getOne(id, userId(req), tenantId(req));
    if (!row) return res.status(404).json({ error: 'Webhook not found' });
    wh.fireWebhooks(userId(req), tenantId(req), 'room.started', { roomId: 'test-room', test: true });
    res.json({ ok: true, url: row.url });
  } catch (e) {
    logger.error('[outbound-webhooks] test error: ' + e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
