'use strict';

var express  = require('express');
var https    = require('https');
var fs       = require('fs');
var os       = require('os');
var path     = require('path');
var router   = express.Router();
var requireAuth = require('../middleware/auth');
var { rateLimit } = require('express-rate-limit');
var multer   = require('multer');

var mediaUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: function(req) { return (req.user && req.user.id) || req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Upload limit reached — maximum 20 uploads per hour.' },
});

var ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg',
];
var ALLOWED_EXTS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.mp4', '.webm', '.mov',
  '.mp3', '.m4a', '.wav', '.ogg',
];

var upload = multer({
  storage: multer.diskStorage({ destination: os.tmpdir() }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
    var ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_TYPES.includes(file.mimetype) || !ALLOWED_EXTS.includes(ext)) {
      return cb(new Error('unsupported file type'));
    }
    cb(null, true);
  },
});

var SB_HOST = (function() {
  try { return new URL(process.env.SUPABASE_URL || '').hostname || 'xlrcibziouffgxciecvc.supabase.co'; }
  catch(e) { return 'xlrcibziouffgxciecvc.supabase.co'; }
}());

function sbUploadStream(bucketPath, filePath, fileSize, contentType, cb) {
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
      'Content-Length': fileSize,
      'x-upsert': 'true',
    },
  };
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
  fs.createReadStream(filePath).pipe(req);
}

router.post('/upload', requireAuth, mediaUploadRateLimit, upload.single('file'), function(req, res) {
  if (!req.file) return res.status(400).json({ error: 'file is required' });

  var bucket = 'media';
  var userId = req.user.id;
  var safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  var storagePath = userId + '/' + Date.now() + '-' + safeName;
  var contentType = req.file.mimetype || 'application/octet-stream';
  var tmpPath = req.file.path;
  var fileSize = req.file.size;

  sbUploadStream(bucket + '/' + storagePath, tmpPath, fileSize, contentType, function(err, status, data) {
    fs.unlink(tmpPath, function() {});
    if (err) return res.status(500).json({ error: 'Upload error' });
    if (status >= 400) return res.status(500).json({ error: 'Storage error' });

    var publicUrl = 'https://' + SB_HOST + '/storage/v1/object/public/' + bucket + '/' + storagePath;
    return res.json({ ok: true, url: publicUrl, storage_path: storagePath });
  });
});

module.exports = router;
