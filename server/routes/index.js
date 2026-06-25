const express = require('express');
const router = express.Router();

const SUPABASE_HOST = 'rxlgywvfclyjdfyvfvyc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const https = require('https');

router.get('/vod/list', function(req, res) {
  var creatorId = req.query.creator_id || null;
  var path = '/rest/v1/stream_recordings?order=created_at.desc&limit=50';
  if (creatorId) path += '&creator_id=eq.' + creatorId;
  var opts = {
    hostname: SUPABASE_HOST,
    path: path,
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    }
  };
  var body = '';
  var r = https.request(opts, function(resp) {
    resp.on('data', function(d) { body += d; });
    resp.on('end', function() {
      res.status(resp.statusCode).json(JSON.parse(body));
    });
  });
  r.on('error', function(e) {
    res.status(500).json({ error: e.message });
  });
  r.end();
});

module.exports = router;
