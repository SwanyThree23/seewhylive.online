var express     = require('express');
var https       = require('https');
var fs          = require('fs');
var os          = require('os');
var path        = require('path');
var router      = express.Router();
var requireAuth = require('../middleware/auth');
var { rateLimit } = require('express-rate-limit');
var multer      = require('multer');

var soundUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: function(req) { return (req.user && req.user.id) || req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Upload limit reached — maximum 10 uploads per hour.' },
});

var ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'audio/mp4'];
var ALLOWED_AUDIO_EXTS  = ['.mp3', '.wav', '.ogg', '.webm', '.m4a'];

var upload = multer({
  storage: multer.diskStorage({ destination: os.tmpdir() }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
    var ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_AUDIO_TYPES.includes(file.mimetype) || !ALLOWED_AUDIO_EXTS.includes(ext)) {
      return cb(new Error('unsupported file type'));
    }
    cb(null, true);
  }
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

// GET /api/sounds — list this creator's custom sounds
router.get('/', requireAuth, function(req, res) {
  var qPath = '/rest/v1/custom_sounds?creator_id=eq.' + req.user.id + '&order=created_at.desc';
  sbReq('GET', qPath, null, function(err, status, data) {
    if (err) return res.status(500).json({ error: 'Failed to load sounds' });
    res.json(data || []);
  });
});

// POST /api/sounds/upload — upload a custom sound
router.post('/upload', requireAuth, soundUploadRateLimit, upload.single('audio'), function(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

  var label = (req.body.label || req.file.originalname).slice(0, 60);
  var safeName = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  var storagePath = req.user.id + '/' + Date.now() + '-' + safeName;

  fs.readFile(req.file.path, function(readErr, buffer) {
    if (readErr) return res.status(500).json({ error: 'Failed to read upload' });

    sbUpload('sounds/' + storagePath, buffer, req.file.mimetype, function(upErr, status, data) {
      fs.unlink(req.file.path, function() {});
      if (upErr || status >= 400) return res.status(500).json({ error: 'Upload failed' });

      var publicUrl = 'https://' + SB_HOST + '/storage/v1/object/public/sounds/' + storagePath;

      sbReq('POST', '/rest/v1/custom_sounds', {
        creator_id: req.user.id,
        label: label,
        storage_path: storagePath,
        playback_url: publicUrl
      }, function(insErr, insStatus, insData) {
        if (insErr || insStatus >= 400) return res.status(500).json({ error: 'Failed to save sound record' });
        res.json((insData && insData[0]) || { label: label, playback_url: publicUrl });
      });
    });
  });
});

module.exports = router;
