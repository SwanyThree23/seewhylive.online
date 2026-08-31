var express     = require('express');
var https       = require('https');
var db          = require('../db');
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

async function storeSecretInVault(secret, name, description) {
  var result = await db.query(
    'SELECT vault.create_secret($1, $2, $3) AS id',
    [secret, name, description || null]
  );
  return result.rows[0].id;
}

async function getSecretFromVault(vaultId) {
  var result = await db.query(
    'SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = $1',
    [vaultId]
  );
  return result.rows[0] ? result.rows[0].decrypted_secret : null;
}

function extractVaultId(ref) {
  return typeof ref === 'string' && ref.indexOf('vault:') === 0
    ? ref.slice(6)
    : null;
}

router.post('/', requireAuth, directPayLimit, async function(req, res) {
  var rawHandles = sanitizeHandles(req.body && req.body.handles);
  var userId = req.user.id;
  var tenantId = req.tenantId;

  try {
    var vaultRefs = {};
    for (var platform in rawHandles) {
      var vaultId = await storeSecretInVault(
        rawHandles[platform],
        tenantId + '_' + userId + '_' + platform + '_' + Date.now(),
        'Direct pay handle: ' + platform
      );
      vaultRefs[platform] = 'vault:' + vaultId;
    }

    var selectPath = '/rest/v1/user_settings?user_id=eq.' + encodeURIComponent(userId) +
      '&tenant_id=eq.' + encodeURIComponent(tenantId) +
      '&setting_key=eq.direct_pay_handles&select=id';

    sbReq('GET', selectPath, null, function(err, status, existing) {
      if (err) return res.status(500).json({ error: 'Failed to check existing settings' });

      var op = (Array.isArray(existing) && existing.length > 0)
        ? { method: 'PATCH', path: '/rest/v1/user_settings?id=eq.' + encodeURIComponent(existing[0].id) + '&tenant_id=eq.' + encodeURIComponent(tenantId), body: { setting_value: vaultRefs, updated_at: new Date().toISOString() } }
        : { method: 'POST', path: '/rest/v1/user_settings', body: { tenant_id: tenantId, user_id: userId, setting_key: 'direct_pay_handles', setting_value: vaultRefs } };

      sbReq(op.method, op.path, op.body, function(err2, status2) {
        if (err2 || status2 >= 400) return res.status(500).json({ error: 'Failed to save direct pay handles' });
        res.json({ handles: rawHandles });
      });
    });
  } catch (e) {
    console.error('[directPay] vault store error:', e.message);
    res.status(500).json({ error: 'Failed to save direct pay handles' });
  }
});

async function loadAndDecryptHandles(userId, tenantId, res) {
  var path = '/rest/v1/user_settings?user_id=eq.' + encodeURIComponent(userId) +
    '&tenant_id=eq.' + encodeURIComponent(tenantId) +
    '&setting_key=eq.direct_pay_handles&select=setting_value';

  sbReq('GET', path, null, async function(err, status, rows) {
    if (err) return res.status(500).json({ error: 'Failed to load direct pay handles' });
    var vaultRefs = (Array.isArray(rows) && rows[0] && rows[0].setting_value) || {};

    try {
      var decrypted = {};
      for (var platform in vaultRefs) {
        var vaultId = extractVaultId(vaultRefs[platform]);
        if (vaultId) decrypted[platform] = await getSecretFromVault(vaultId);
      }
      res.json({ handles: decrypted });
    } catch (e) {
      console.error('[directPay] vault decrypt error:', e.message);
      res.status(500).json({ error: 'Failed to decrypt direct pay handles' });
    }
  });
}

router.get('/', requireAuth, function(req, res) {
  loadAndDecryptHandles(req.user.id, req.tenantId, res);
});

router.get('/:userId', function(req, res) {
  loadAndDecryptHandles(req.params.userId, req.tenantId, res);
});

module.exports = router;
