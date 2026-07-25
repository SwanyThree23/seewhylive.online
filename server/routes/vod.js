'use strict';

var express     = require('express');
var https       = require('https');
var router      = express.Router();
var requireAuth = require('../middleware/auth');

var multer = require('multer');
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }
});


var SB_HOST = 'rxlgywvfclyjdfyvfvyc.supabase.co';

function sbReq(method, path, body, cb) {
  var key     = process.env.SUPABASE_SERVICE_ROLE_KEY;
  var payload = body ? JSON.stringify(body) : null;
  var opts = {
    hostname: SB_HOST,
    port:     443,
    path:     path,
    method:   method,
    headers: {
      'apikey':        key,
      'Authorization': 'Bearer ' + key,
      'Content-Type':  'application/json',
      'Prefer':        'return=representation',
    },
  };
  if (payload) opts.headers['Content-Length'] = Buffer.byteLength(payload);
  var req = https.request(opts, function(res) {
    var chunks = [];
    res.on('data', function(c) { chunks.push(c); });
    res.on('end', function() {
      var raw = Buffer.concat(chunks).toString();
      var parsed = null;
      try { parsed = JSON.parse(raw); } catch(e) { parsed = raw; }
      cb(null, res.statusCode, parsed);
    });
  });
  req.on('error', function(e) { cb(e); });
  if (payload) req.write(payload);
  req.end();
}

function sbUpload(bucketPath, buffer, contentType, cb) {
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  var opts = {
    hostname: SB_HOST,
    port: 443,
    path: '/storage/v1/object/' + bucketPath,
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': contentType,
      'Content-Length': buffer.length,
      'x-upsert': 'true'
    }
  };
  var req = https.request(opts, function(res) {
    var chunks = [];
    res.on('data', function(c) { chunks.push(c); });
    res.on('end', function() {
      var raw = Buffer.concat(chunks).toString();
      var parsed = null;
      try { parsed = JSON.parse(raw); } catch (e) { parsed = raw; }
      cb(null, res.statusCode, parsed);
    });
  });
  req.on('error', function(e) { cb(e); });
  req.write(buffer);
  req.end();
}

// POST /api/vod/start
// Body: { stream_id, title? }
router.post('/start', requireAuth, function(req, res) {
  var body      = req.body || {};
  var streamId  = body.stream_id  || '';
  var creatorId = req.user.id;
  var title     = body.title      || 'Live Recording';

  if (!streamId) return res.status(400).json({ error: 'stream_id is required' });

  var row = {
    stream_id:    streamId,
    creator_id:   creatorId,
    title:        title,
    storage_path: 'pending/' + streamId + '/' + Date.now(),
    is_public:    false,
    view_count:   0,
  };

  sbReq('POST', '/rest/v1/vods', row, function(err, status, data) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (status >= 400) return res.status(status).json({ error: 'Supabase error', detail: data });
    var created = Array.isArray(data) ? data[0] : data;
    return res.json(created);
  });
});

// POST /api/vod/:id/upload
// multipart/form-data field "video"
router.post('/:id/upload', requireAuth, upload.single('video'), function(req, res) {
  var vodId = req.params.id || '';
  if (!vodId) return res.status(400).json({ error: 'id is required' });
  if (!req.file) return res.status(400).json({ error: 'video file is required' });
  // Verify VOD belongs to authenticated user before upload
  sbReq('GET', '/rest/v1/vods?id=eq.' + encodeURIComponent(vodId) + '&select=creator_id&limit=1', null, function(chkErr, chkStatus, chkData) {
    if (chkErr || chkStatus >= 400) return res.status(500).json({ error: 'Database error' });
    var vod = Array.isArray(chkData) ? chkData[0] : chkData;
    if (!vod || vod.creator_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    doUpload(req, res, vodId);
  });
});
function doUpload(req, res, vodId) {
  var bucket = 'vods';
  var safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  var storagePath = vodId + '/' + Date.now() + '-' + safeName;
  var contentType = req.file.mimetype || 'video/mp4';

  sbUpload(bucket + '/' + storagePath, req.file.buffer, contentType, function(err, status, data) {
    if (err) return res.status(500).json({ error: 'Upload error' });
    if (status >= 400) return res.status(status).json({ error: 'Supabase storage error', detail: data });

    var publicUrl = 'https://' + SB_HOST + '/storage/v1/object/public/' + bucket + '/' + storagePath;
    var patch = { storage_path: storagePath, playback_url: publicUrl };

    sbReq('PATCH', '/rest/v1/vods?id=eq.' + encodeURIComponent(vodId), patch, function(err2, status2, data2) {
      if (err2) return res.status(500).json({ error: 'Database error' });
      if (status2 >= 400) return res.status(status2).json({ error: 'Supabase error', detail: data2 });
      var updated = Array.isArray(data2) ? data2[0] : data2;
      return res.json(updated || { ok: true, storage_path: storagePath, playback_url: publicUrl });
    });
  });
}

// POST /api/vod/stop
// Body: { vod_id, duration_seconds, playback_url? }
router.post('/stop', requireAuth, function(req, res) {
  var body        = req.body || {};
  var vodId       = body.vod_id            || '';
  var durationSec = body.duration_seconds  || body.duration_sec || 0;
  var playbackUrl = body.playback_url      || '';

  if (!vodId) return res.status(400).json({ error: 'vod_id is required' });
  sbReq('GET', '/rest/v1/vods?id=eq.' + encodeURIComponent(vodId) + '&select=creator_id&limit=1', null, function(chkErr, chkStatus, chkData) {
    if (chkErr || chkStatus >= 400) return res.status(500).json({ error: 'Database error' });
    var vod = Array.isArray(chkData) ? chkData[0] : chkData;
    if (!vod || vod.creator_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    doStop(res, vodId, durationSec, playbackUrl);
  });
});
function doStop(res, vodId, durationSec, playbackUrl) {
  var patch = {
    duration_seconds: Math.floor(durationSec),
    is_public:        true,
  };
  if (playbackUrl) patch.playback_url = playbackUrl;

  sbReq('PATCH', '/rest/v1/vods?id=eq.' + encodeURIComponent(vodId), patch, function(err, status, data) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (status >= 400) return res.status(status).json({ error: 'Supabase error', detail: data });
    var updated = Array.isArray(data) ? data[0] : data;
    return res.json(updated || { ok: true });
  });
}

// GET /api/vod/list
// Query: ?stream_id=<uuid>&limit=20
router.get('/list', function(req, res) {
  var streamId = req.query.stream_id || '';
  var limit    = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  if (!streamId) return res.status(400).json({ error: 'stream_id is required' });

  var path = '/rest/v1/vods'
           + '?stream_id=eq.' + encodeURIComponent(streamId)
           + '&order=created_at.desc'
           + '&limit=' + limit;

  sbReq('GET', path, null, function(err, status, data) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (status >= 400) return res.status(status).json({ error: 'Supabase error', detail: data });
    return res.json(Array.isArray(data) ? data : []);
  });
});

// DELETE /api/vod/:id
router.delete('/:id', requireAuth, function(req, res) {
  var vodId = req.params.id || '';
  if (!vodId) return res.status(400).json({ error: 'id is required' });
  sbReq('GET', '/rest/v1/vods?id=eq.' + encodeURIComponent(vodId) + '&select=creator_id&limit=1', null, function(chkErr, chkStatus, chkData) {
    if (chkErr || chkStatus >= 400) return res.status(500).json({ error: 'Database error' });
    var vod = Array.isArray(chkData) ? chkData[0] : chkData;
    if (!vod || vod.creator_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    sbReq('DELETE', '/rest/v1/vods?id=eq.' + encodeURIComponent(vodId), null, function(err, status, data) {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (status >= 400) return res.status(status).json({ error: 'Supabase error', detail: data });
      return res.json({ ok: true, deleted: vodId });
    });
  });
});

module.exports = router;
