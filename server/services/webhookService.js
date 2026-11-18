'use strict';
var crypto   = require('crypto');
var https    = require('https');
var http     = require('http');
var urlLib   = require('url');
var Database = require('better-sqlite3');
var logger;
try { logger = require('../logger'); } catch (_) { logger = console; }

var DB_PATH = process.env.DB_PATH || '/opt/seewhy/data/seewhy.db';
var _db = null;

function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.exec(
    'CREATE TABLE IF NOT EXISTS outbound_webhooks (' +
    '  id         TEXT PRIMARY KEY,' +
    '  tenant_id  TEXT NOT NULL DEFAULT \'\',' +
    '  host_id    TEXT NOT NULL,' +
    '  url        TEXT NOT NULL,' +
    '  secret     TEXT NOT NULL,' +
    '  events     TEXT NOT NULL DEFAULT \'[]\',' +
    '  active     INTEGER NOT NULL DEFAULT 1,' +
    '  created_at INTEGER NOT NULL' +
    ')'
  );
  _db.exec('CREATE INDEX IF NOT EXISTS idx_owh_host ON outbound_webhooks(host_id, tenant_id)');
  return _db;
}

function signPayload(secret, body) {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function deliver(row, body, sig, event) {
  try {
    var parsed = urlLib.parse(row.url);
    if (!parsed.hostname) return;
    var mod = parsed.protocol === 'https:' ? https : http;
    var req = mod.request({
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.path || '/',
      method:   'POST',
      headers: {
        'Content-Type':       'application/json',
        'Content-Length':     Buffer.byteLength(body),
        'x-seewhy-signature': sig,
        'x-seewhy-event':     event,
        'User-Agent':         'SeeWhyLIVE-Webhooks/1.0',
      },
      timeout: 8000,
    }, function(res) {
      res.resume();
    });
    req.on('error',   function() {});
    req.on('timeout', function() { try { req.destroy(); } catch (_e) {} });
    req.write(body);
    req.end();
  } catch (_e) {}
}

// Fire webhooks for a given host+tenant+event — synchronous DB read, async HTTP sends
function fireWebhooks(hostId, tenantId, event, payload) {
  if (!hostId) return;
  var rows;
  try {
    rows = getDb().prepare(
      'SELECT id, url, secret, events FROM outbound_webhooks ' +
      'WHERE host_id = ? AND tenant_id = ? AND active = 1'
    ).all(hostId, tenantId || '');
  } catch (e) {
    logger.warn('[webhookService] DB read error: ' + e.message);
    return;
  }
  if (!rows || !rows.length) return;

  var body = JSON.stringify({
    event: event,
    ts:    Math.floor(Date.now() / 1000),
    data:  payload || {},
  });

  rows.forEach(function(row) {
    var events;
    try { events = JSON.parse(row.events); } catch (_) { events = []; }
    if (!Array.isArray(events) || (!events.includes(event) && !events.includes('*'))) return;
    var sig = signPayload(row.secret, body);
    deliver(row, body, sig, event);
  });
}

// CRUD helpers used by the route
function listByHost(hostId, tenantId) {
  return getDb().prepare(
    'SELECT id, url, events, active, created_at FROM outbound_webhooks ' +
    'WHERE host_id = ? AND tenant_id = ? ORDER BY created_at DESC'
  ).all(hostId, tenantId || '');
}

function countByHost(hostId, tenantId) {
  return (getDb().prepare(
    'SELECT COUNT(*) as c FROM outbound_webhooks WHERE host_id = ? AND tenant_id = ?'
  ).get(hostId, tenantId || '') || {}).c || 0;
}

function create(id, tenantId, hostId, url, secret, events, now) {
  getDb().prepare(
    'INSERT INTO outbound_webhooks (id, tenant_id, host_id, url, secret, events, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)'
  ).run(id, tenantId || '', hostId, url, secret, JSON.stringify(events), now);
}

function getOne(id, hostId, tenantId) {
  return getDb().prepare(
    'SELECT id, url, secret FROM outbound_webhooks WHERE id = ? AND host_id = ? AND tenant_id = ?'
  ).get(id, hostId, tenantId || '');
}

function setActive(id, active) {
  getDb().prepare('UPDATE outbound_webhooks SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
}

function setEvents(id, events) {
  getDb().prepare('UPDATE outbound_webhooks SET events = ? WHERE id = ?').run(JSON.stringify(events), id);
}

function remove(id, hostId, tenantId) {
  return getDb().prepare(
    'DELETE FROM outbound_webhooks WHERE id = ? AND host_id = ? AND tenant_id = ?'
  ).run(id, hostId, tenantId || '').changes;
}

module.exports = {
  fireWebhooks: fireWebhooks,
  listByHost:   listByHost,
  countByHost:  countByHost,
  create:       create,
  getOne:       getOne,
  setActive:    setActive,
  setEvents:    setEvents,
  remove:       remove,
};
