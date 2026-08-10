'use strict';

var express     = require('express');
var multer      = require('multer');
var path        = require('path');
var os          = require('os');
var fs          = require('fs');
var router      = express.Router();
var db          = require('../db');
var requireAuth = require('../middleware/auth');
var { rateLimit } = require('express-rate-limit');

var mvSubmitRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: function(req) { return (req.user && req.user.id) || req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Submission limit reached — maximum 10 music video jobs per hour.' },
});

var MEDIA_DIR      = process.env.MEDIA_DIR || '/opt/seewhy/media/mv';
var MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50 MB

var ALLOWED_AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.weba', '.aac'];
var ALLOWED_AUDIO_MIME = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
  'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a',
  'audio/flac', 'audio/webm', 'audio/aac', 'audio/x-aac',
];

var VALID_STYLES = ['lyric_visualizer', 'neon_pulse', 'urban_night', 'abstract_wave', 'fire_storm'];

var upload = multer({
  storage: multer.diskStorage({ destination: os.tmpdir() }),
  limits: { fileSize: MAX_AUDIO_SIZE },
  fileFilter: function(req, file, cb) {
    var ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_AUDIO_EXTS.includes(ext) && !ALLOWED_AUDIO_MIME.includes(file.mimetype)) {
      return cb(new Error('unsupported audio format'));
    }
    cb(null, true);
  },
});

// Ensure output dir exists
try { fs.mkdirSync(MEDIA_DIR, { recursive: true }); } catch (e) { /* already exists */ }

// Create table if not yet present (idempotent)
db.query([
  'CREATE TABLE IF NOT EXISTS music_video_jobs (',
  '  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),',
  '  user_id     TEXT        NOT NULL,',
  '  username    TEXT        NOT NULL,',
  '  audio_path  TEXT        NOT NULL,',
  '  style       TEXT        NOT NULL,',
  '  status      TEXT        NOT NULL DEFAULT \'pending\',',
  '  output_path TEXT,',
  '  error       TEXT,',
  '  created_at  TIMESTAMPTZ DEFAULT NOW(),',
  '  updated_at  TIMESTAMPTZ DEFAULT NOW()',
  ')',
].join('\n')).catch(function(e) {
  console.error('[musicVideo] table init error:', e.message);
});

// ── POST /api/music-video/submit ────────────────────────────────────────────
router.post('/submit', requireAuth, mvSubmitRateLimit, upload.single('audio'), async function(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

  var style = (req.body && req.body.style) || '';
  if (!VALID_STYLES.includes(style)) {
    fs.unlink(req.file.path, function() {});
    return res.status(400).json({ error: 'Invalid style' });
  }

  var userId   = req.user.userId || req.user.id;
  var username = req.user.username || userId;

  try {
    var result = await db.query(
      'INSERT INTO music_video_jobs (user_id, username, audio_path, style) VALUES ($1,$2,$3,$4) RETURNING id',
      [userId, username, req.file.path, style]
    );
    res.json({ jobId: result.rows[0].id, status: 'pending' });
  } catch (e) {
    fs.unlink(req.file.path, function() {});
    console.error('[musicVideo] submit error:', e.message);
    res.status(500).json({ error: 'Failed to queue job' });
  }
});

// ── GET /api/music-video/jobs ───────────────────────────────────────────────
router.get('/jobs', requireAuth, async function(req, res) {
  var userId = req.user.userId || req.user.id;
  try {
    var result = await db.query(
      'SELECT id, style, status, output_path, error, created_at, updated_at ' +
      'FROM music_video_jobs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',
      [userId]
    );
    res.json({ jobs: result.rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// ── GET /api/music-video/jobs/:id ──────────────────────────────────────────
router.get('/jobs/:id', requireAuth, async function(req, res) {
  var userId = req.user.userId || req.user.id;
  try {
    var result = await db.query(
      'SELECT id, style, status, output_path, error, created_at, updated_at ' +
      'FROM music_video_jobs WHERE id=$1 AND user_id=$2',
      [req.params.id, userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// ── GET /api/music-video/output/:filename — stream generated video ──────────
router.get('/output/:filename', requireAuth, function(req, res) {
  var name     = path.basename(req.params.filename); // strip path traversal
  var filePath = path.join(MEDIA_DIR, name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(filePath);
});

// ── DELETE /api/music-video/jobs/:id ───────────────────────────────────────
router.delete('/jobs/:id', requireAuth, async function(req, res) {
  var userId = req.user.userId || req.user.id;
  try {
    var existing = await db.query(
      'SELECT output_path, audio_path FROM music_video_jobs WHERE id=$1 AND user_id=$2',
      [req.params.id, userId]
    );
    if (!existing.rows.length) return res.status(404).json({ error: 'Job not found' });
    var row = existing.rows[0];
    if (row.output_path) fs.unlink(row.output_path, function() {});
    if (row.audio_path && row.audio_path.startsWith(os.tmpdir())) {
      fs.unlink(row.audio_path, function() {});
    }
    await db.query('DELETE FROM music_video_jobs WHERE id=$1', [req.params.id]);
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

module.exports = router;
