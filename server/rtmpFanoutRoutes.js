'use strict';
var express = require('express');
var crypto = require('crypto');
var spawn = require('child_process').spawn;
var db = require('./db');

var router = express.Router();

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

router.post('/encrypt-key', function (req, res) {
  var streamKey = (req.body || {}).streamKey;
  if (!streamKey) return res.status(400).json({ error: 'streamKey is required' });
  try {
    res.json({ success: true, encryptedKey: encryptKey(streamKey) });
  } catch (err) {
    console.error('encrypt-key failed', err);
    res.status(500).json({ error: 'encryption failed' });
  }
});

router.post('/add-destination', async function (req, res) {
  var body = req.body || {};
  if (!body.streamKey || !body.streamUrl) return res.status(400).json({ error: 'streamUrl and streamKey are required' });
  try {
    var encryptedKey = encryptKey(body.streamKey);
    var result = await db.query(
      'INSERT INTO stream_destinations (stream_id, platform, stream_url, stream_key, status, is_enabled, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [body.streamId, body.platform, body.streamUrl, encryptedKey, 'disconnected', true, body.userId]
    );
    res.json({ success: true, destination: result.rows[0] });
  } catch (err) {
    console.error('add-destination failed', err);
    res.status(500).json({ error: 'insert failed' });
  }
});

router.post('/start-stream', async function (req, res) {
  var body = req.body || {};
  var destinationId = body.destinationId;
  var streamId = body.streamId;
  if (!destinationId) return res.status(400).json({ error: 'destinationId is required' });
  if (activeProcesses.has(destinationId)) {
    return res.json({ success: true, message: 'already running', pid: activeProcesses.get(destinationId).process.pid });
  }
  try {
    var result = await db.query('SELECT * FROM stream_destinations WHERE id = $1', [destinationId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'destination not found' });
    var destination = result.rows[0];
    var plainKey = decryptKey(destination.stream_key);
    var inputUrl = RTMP_INGEST_BASE + '/' + streamId;
    var outputUrl = destination.stream_url.replace(/\/$/, '') + '/' + plainKey;
    var ffmpegProcess = spawn('ffmpeg', ['-i', inputUrl, '-c', 'copy', '-f', 'flv', outputUrl]);

    ffmpegProcess.stderr.on('data', function (chunk) {
      console.log('[ffmpeg ' + destinationId + ']', chunk.toString().slice(0, 200));
    });
    ffmpegProcess.on('exit', function (code) {
      activeProcesses.delete(destinationId);
      db.query('UPDATE stream_destinations SET status = $1 WHERE id = $2', [code === 0 ? 'disconnected' : 'error', destinationId]).catch(function () {});
    });

    activeProcesses.set(destinationId, { process: ffmpegProcess, startedAt: Date.now(), destination: destination });
    await db.query('UPDATE stream_destinations SET status = $1 WHERE id = $2', ['live', destinationId]);
    res.json({ success: true, pid: ffmpegProcess.pid });
  } catch (err) {
    console.error('start-stream failed', err);
    res.status(500).json({ error: 'could not start stream' });
  }
});

router.post('/stop-stream', async function (req, res) {
  var destinationId = (req.body || {}).destinationId;
  var entry = activeProcesses.get(destinationId);
  if (!entry) return res.json({ success: true, message: 'no active process for this destination' });
  entry.process.kill('SIGTERM');
  activeProcesses.delete(destinationId);
  try {
    await db.query('UPDATE stream_destinations SET status = $1 WHERE id = $2', ['disconnected', destinationId]);
    res.json({ success: true });
  } catch (err) {
    console.error('stop-stream db update failed', err);
    res.json({ success: true });
  }
});

router.get('/status/:destinationId', function (req, res) {
  var entry = activeProcesses.get(req.params.destinationId);
  if (!entry) return res.json({ live: false });
  res.json({ live: true, pid: entry.process.pid, uptimeMs: Date.now() - entry.startedAt });
});

module.exports = router;
