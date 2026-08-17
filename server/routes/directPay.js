var express     = require('express');
var https       = require('https');
var router      = express.Router();
var requireAuth = require('../middleware/auth');
var { rateLimit } = require('express-rate-limit');

var directPayLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: function(req) { return (req.user && req.user.id) || req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many requests, try again shortly.' },
});

var SB_HOST = 'xlrcibziouffgxciecvc.supabase.co';

function sbReq(method, path, body, cb) {
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
      var raw = Buffer.concat(chunks).toString('utf8');
      var json = null;
      try { json = raw ? JSON.parse(raw) : null; } catch (e) {}
      cb(null, res.statusCode, json);
    });
  });
  req.on('error', function(e) { cb(e); });
  if (payload) req.write(payload);
  req.end();
}

var ALLOWED_PLATFORMS = ['paypal', 'cashapp', 'venmo', 'zelle', 'chime'];

function sanitizeHandles(input) {
  var out = {};
  if (!input || typeof input !== 'object') return out;
  ALLOWED_PLATFORMS.forEach(function(p) {
    if (typeof input[p] === 'string' && input[p].trim()) {
      out[p] = input[p].trim().slice(0, 100);
    }
  });
  return out;
}

router.post('/', requireAuth, directPayLimit, function(req, res) {
  var handles = sanitizeHandles(req.body && req.body.handles);
  var userId = req.user.id;

  var selectPath = '/rest/v1/user_settings?user_id=eq.' + encodeURIComponent(userId) +
    '&setting_key=eq.direct_pay_handles&select=id';

  sbReq('GET', selectPath, null, function(err, status, existing) {
    if (err) return res.status(500).json({ error: 'Failed to check existing settings' });

    if (Array.isArray(existing) && existing.length > 0) {
      var updatePath = '/rest/v1/user_settings?id=eq.' + encodeURIComponent(existing[0].id);
      sbReq('PATCH', updatePath, {
        setting_value: handles,
        updated_at: new Date().toISOString(),
      }, function(err2, status2, result2) {
        if (err2 || status2 >= 400) return res.status(500).json({ error: 'Failed to update direct pay handles' });
        res.json({ handles: handles });
      });
    } else {
      sbReq('POST', '/rest/v1/user_settings', {
        user_id: userId,
        setting_key: 'direct_pay_handles',
        setting_value: handles,
      }, function(err2, status2, result2) {
        if (err2 || status2 >= 400) return res.status(500).json({ error: 'Failed to save direct pay handles' });
        res.json({ handles: handles });
      });
    }
  });
});

router.get('/', requireAuth, function(req, res) {
  var userId = req.user.id;
  var path = '/rest/v1/user_settings?user_id=eq.' + encodeURIComponent(userId) +
    '&setting_key=eq.direct_pay_handles&select=setting_value';

  sbReq('GET', path, null, function(err, status, rows) {
    if (err) return res.status(500).json({ error: 'Failed to load direct pay handles' });
    var handles = (Array.isArray(rows) && rows[0] && rows[0].setting_value) || {};
    res.json({ handles: handles });
  });
});

router.get('/:userId', function(req, res) {
  var userId = req.params.userId;
  var path = '/rest/v1/user_settings?user_id=eq.' + encodeURIComponent(userId) +
    '&setting_key=eq.direct_pay_handles&select=setting_value';

  sbReq('GET', path, null, function(err, status, rows) {
    if (err) return res.status(500).json({ error: 'Failed to load direct pay handles' });
    var handles = (Array.isArray(rows) && rows[0] && rows[0].setting_value) || {};
    res.json({ handles: handles });
  });
});

module.exports = router;
