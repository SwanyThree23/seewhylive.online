'use strict';
var express = require('express');
var crypto = require('crypto');
var spawn = require('child_process').spawn;
var db = require('./db');
var requireAuth = require('./middleware/auth');
var logger = require('./lib/logger');

var router = express.Router();

// RFC-1918, loopback, and link-local ranges are blocked to prevent SSRF.
var PRIVATE_HOST_RE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|localhost$|::1$)/i;

function isValidRtmpUrl(url) {
  if (typeof url !== 'string') return false;
  var lower = url.toLowerCase();
  if (!lower.startsWith('rtmp://') && !lower.startsWith('rtmps://')) return false;
  try {
    var parsed = new URL(url);
    if (PRIVATE_HOST_RE.test(parsed.hostname)) return false;
    return true;
  } catch (e) {
    return false;
  }
}

var STREAM_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;

var ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  throw new Error('rtmpFanoutRoutes: ENCRYPTION_KEY env var is missing or too short (needs >= 32 chars). Refusing to start rather than fall back to a hardcoded key.');
}
var RTMP_INGEST_BASE = process.env.RTMP_INGEST_BASE || 'rtmp://seewhylive.online/live';

var activeProcesses = new Map();

function encryptKey(plainKey) {
  var iv = crypto.randomBytes(12);
  var keyBuf = Buffer.from(ENCRYPTION_KEY.slice(0, 32));
  var cipher = crypto.createCipheriv('aes-256-gcm', keyBuf, iv);
  var encrypted = Buffer.concat([cipher.update(plainKey, 'utf8'), cipher.final()]);
  var authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptKey(stored) {
  var parts = stored.split(':');
  if (parts.length !== 3) throw new Error('decryptKey: unexpected stored format');
  var iv = Buffer.from(parts[0], 'hex');
  var authTag = Buffer.from(parts[1], 'hex');
  var ciphertext = Buffer.from(parts[2], 'hex');
  var keyBuf = Buffer.from(ENCRYPTION_KEY.slice(0, 32));
  var decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, iv);
  decipher.setAuthTag(authTag);
  var decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

router.post('/encrypt-key', requireAuth, function (req, res) {
  var streamKey = (req.body || {}).streamKey;
  if (!streamKey) return res.status(400).json({ error: 'streamKey is required' });
  if (typeof streamKey !== 'string' || streamKey.length > 500) {
    return res.status(400).json({ error: 'streamKey must be a string of at most 500 characters' });
  }
  try {
    res.json({ success: true, encryptedKey: encryptKey(streamKey) });
  } catch (err) {
    logger.error('encrypt-key failed', { err: err.message });
    res.status(500).json({ error: 'encryption failed' });
  }
});

var PLATFORM_RE = /^[a-zA-Z0-9_-]{1,64}$/;
var LABEL_RE = /^[^<>"]{1,80}$/;
router.post('/add-destination', requireAuth, async function (req, res) {
  var body = req.body || {};
  if (!body.streamKey || !body.streamUrl) return res.status(400).json({ error: 'streamUrl and streamKey are required' });
  if (!isValidRtmpUrl(body.streamUrl)) return res.status(400).json({ error: 'streamUrl must start with rtmp:// or rtmps://' });
  var safePlatform = body.platform ? String(body.platform) : null;
  if (safePlatform && !PLATFORM_RE.test(safePlatform)) return res.status(400).json({ error: 'invalid platform' });
  var safeLabel = body.label ? String(body.label).slice(0, 80) : null;
  if (safeLabel && !LABEL_RE.test(safeLabel)) return res.status(400).json({ error: 'invalid label' });
  var safeStreamKey = typeof body.streamKey === 'string' ? body.streamKey.slice(0, 500) : '';
  if (!safeStreamKey) return res.status(400).json({ error: 'streamKey is required' });
  try {
    var encryptedKey = encryptKey(safeStreamKey);
    var result = await db.query(
      'INSERT INTO stream_destinations (platform, label, rtmp_url, stream_key_encrypted, status, is_enabled, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [safePlatform, safeLabel, body.streamUrl, encryptedKey, 'disconnected', true, req.user.id]
    );
    res.json({ success: true, destination: result.rows[0] });
  } catch (err) {
    logger.error('add-destination failed', { err: err.message });
    res.status(500).json({ error: 'insert failed' });
  }
});

router.post('/start-stream', requireAuth, async function (req, res) {
  var body = req.body || {};
  var destinationId = body.destinationId;
  var streamId = body.streamId;
  if (!destinationId) return res.status(400).json({ error: 'destinationId is required' });
  if (!streamId || !STREAM_ID_RE.test(String(streamId))) return res.status(400).json({ error: 'invalid streamId' });
  if (activeProcesses.has(destinationId)) {
    var _existing = activeProcesses.get(destinationId);
    return res.json({ success: true, message: 'already running', pid: _existing.process ? _existing.process.pid : null });
  }
  // Sentinel prevents a concurrent request from spawning a second process for the
  // same destination while the DB query and spawn are in flight (TOCTOU gap).
  activeProcesses.set(destinationId, { process: null, startedAt: Date.now(), destination: null });
  try {
    var result = await db.query('SELECT * FROM stream_destinations WHERE id = $1 AND user_id = $2', [destinationId, req.user.id]);
    if (result.rows.length === 0) {
      activeProcesses.delete(destinationId);
      return res.status(404).json({ error: 'destination not found' });
    }
    var destination = result.rows[0];
    var plainKey = decryptKey(destination.stream_key_encrypted || destination.stream_key);
    var inputUrl = RTMP_INGEST_BASE + '/' + streamId;
    var outputUrl = (destination.rtmp_url || destination.stream_url).replace(/\/$/, '') + '/' + plainKey;
    var ffmpegProcess = spawn('ffmpeg', ['-i', inputUrl, '-c', 'copy', '-f', 'flv', outputUrl]);

    ffmpegProcess.stderr.on('data', function (chunk) {
      logger.info('[ffmpeg ' + destinationId + ']', chunk.toString().slice(0, 200));
    });
    ffmpegProcess.on('exit', function (code) {
      activeProcesses.delete(destinationId);
      db.query('UPDATE stream_destinations SET status = $1 WHERE id = $2', [code === 0 ? 'disconnected' : 'error', destinationId]).catch(function () {});
    });

    activeProcesses.set(destinationId, { process: ffmpegProcess, startedAt: Date.now(), destination: destination });
    await db.query('UPDATE stream_destinations SET status = $1 WHERE id = $2', ['live', destinationId]);
    res.json({ success: true, pid: ffmpegProcess.pid });
  } catch (err) {
    activeProcesses.delete(destinationId);
    logger.error('start-stream failed', { err: err.message });
    res.status(500).json({ error: 'could not start stream' });
  }
});

router.post('/stop-stream', requireAuth, async function (req, res) {
  var destinationId = (req.body || {}).destinationId;
  var entry = activeProcesses.get(destinationId);
  if (!entry) return res.json({ success: true, message: 'no active process for this destination' });
  if (!entry.destination || (entry.destination.user_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'forbidden' });
  }
  entry.process.kill('SIGTERM');
  activeProcesses.delete(destinationId);
  try {
    await db.query('UPDATE stream_destinations SET status = $1 WHERE id = $2', ['disconnected', destinationId]);
    res.json({ success: true });
  } catch (err) {
    logger.error('stop-stream db update failed', { err: err.message });
    res.json({ success: true });
  }
});

router.get('/status/:destinationId', requireAuth, function (req, res) {
  var entry = activeProcesses.get(req.params.destinationId);
  if (!entry) return res.json({ live: false });
  if (!entry.destination || (String(entry.destination.user_id) !== String(req.user.id) && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'forbidden' });
  }
  res.json({ live: true, pid: entry.process ? entry.process.pid : null, uptimeMs: Date.now() - entry.startedAt });
});

router.get('/destinations', requireAuth, async function (req, res) {
  try {
    var result = await db.query(
      'SELECT id, platform, label, rtmp_url, status, is_enabled, created_at FROM stream_destinations WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ destinations: result.rows });
  } catch (err) {
    logger.error('list-destinations failed', { err: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/destinations/:id', requireAuth, async function (req, res) {
  var id = req.params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'invalid id' });
  if (activeProcesses.has(id)) return res.status(409).json({ error: 'destination is currently live — stop it first' });
  try {
    var result = await db.query(
      'DELETE FROM stream_destinations WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ success: true });
  } catch (err) {
    logger.error('delete-destination failed', { err: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
