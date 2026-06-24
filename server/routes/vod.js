'use strict';

var express = require('express');
var https   = require('https');
var router  = express.Router();

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

// POST /api/vod/start
// Body: { stream_id, creator_id, title? }
router.post('/start', function(req, res) {
  var body      = req.body || {};
  var streamId  = body.stream_id  || '';
  var creatorId = body.creator_id || '';
  var title     = body.title      || 'Live Recording';

  if (!streamId)  return res.status(400).json({ error: 'stream_id is required' });
  if (!creatorId) return res.status(400).json({ error: 'creator_id is required' });

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

// POST /api/vod/stop
// Body: { vod_id, duration_seconds, playback_url? }
router.post('/stop', function(req, res) {
  var body        = req.body || {};
  var vodId       = body.vod_id            || '';
  var durationSec = body.duration_seconds  || body.duration_sec || 0;
  var playbackUrl = body.playback_url      || '';

  if (!vodId) return res.status(400).json({ error: 'vod_id is required' });

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
});

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
router.delete('/:id', function(req, res) {
  var vodId = req.params.id || '';
  if (!vodId) return res.status(400).json({ error: 'id is required' });
  sbReq('DELETE', '/rest/v1/vods?id=eq.' + encodeURIComponent(vodId), null, function(err, status, data) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (status >= 400) return res.status(status).json({ error: 'Supabase error', detail: data });
    return res.json({ ok: true, deleted: vodId });
  });
});

module.exports = router;
