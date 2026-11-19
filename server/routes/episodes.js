'use strict';
var express    = require('express');
var logger = require('../lib/logger');
var router     = express.Router();
var crypto     = require('crypto');
var requireAuth = require('../middleware/auth');

// SQLite db is passed via app.locals
function db(req) { return req.app.locals.db; }

// ── Tables are created by index.js on startup ──────────────────────────────

// ── Helpers ────────────────────────────────────────────────────────────────
function uid() { return crypto.randomUUID(); }

// ── Series CRUD ────────────────────────────────────────────────────────────

// GET /api/episodes/series  — list all series for the authed user
router.get('/series', requireAuth, function(req, res) {
  try {
    var rows = db(req).prepare(
      'SELECT * FROM ep_series WHERE user_id = ? ORDER BY updated_at DESC'
    ).all(req.user.id);
    res.json(rows);
  } catch (e) {
    logger.error('GET /api/episodes/series', e);
    res.status(500).json({ error: 'db error' });
  }
});

// GET /api/episodes/series/:id
router.get('/series/:id', requireAuth, function(req, res) {
  try {
    var row = db(req).prepare(
      'SELECT * FROM ep_series WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (e) {
    logger.error('GET /api/episodes/series/:id', e);
    res.status(500).json({ error: 'db error' });
  }
});

// POST /api/episodes/series  — create a new series
router.post('/series', requireAuth, function(req, res) {
  try {
    var b = req.body;
    var id = uid();
    var now = Date.now();
    db(req).prepare(`
      INSERT INTO ep_series (id, user_id, title, emoji, genre, color, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.user.id,
      (b.title || 'Untitled Series').slice(0, 120),
      (b.emoji || '🎬').slice(0, 8),
      (b.genre || 'Drama').slice(0, 60),
      (b.color || '#7B2D8B').slice(0, 20),
      (b.description || '').slice(0, 500),
      now, now
    );
    var row = db(req).prepare('SELECT * FROM ep_series WHERE id = ?').get(id);
    res.status(201).json(row);
  } catch (e) {
    logger.error('POST /api/episodes/series', e);
    res.status(500).json({ error: 'db error' });
  }
});

// PATCH /api/episodes/series/:id
router.patch('/series/:id', requireAuth, function(req, res) {
  try {
    var existing = db(req).prepare(
      'SELECT id FROM ep_series WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'not found' });
    var b = req.body;
    var now = Date.now();
    db(req).prepare(`
      UPDATE ep_series SET
        title       = COALESCE(?, title),
        emoji       = COALESCE(?, emoji),
        genre       = COALESCE(?, genre),
        color       = COALESCE(?, color),
        description = COALESCE(?, description),
        updated_at  = ?
      WHERE id = ? AND user_id = ?
    `).run(
      b.title       != null ? String(b.title).slice(0, 120)       : null,
      b.emoji       != null ? String(b.emoji).slice(0, 8)         : null,
      b.genre       != null ? String(b.genre).slice(0, 60)        : null,
      b.color       != null ? String(b.color).slice(0, 20)        : null,
      b.description != null ? String(b.description).slice(0, 500) : null,
      now,
      req.params.id, req.user.id
    );
    var row = db(req).prepare('SELECT * FROM ep_series WHERE id = ?').get(req.params.id);
    res.json(row);
  } catch (e) {
    logger.error('PATCH /api/episodes/series/:id', e);
    res.status(500).json({ error: 'db error' });
  }
});

// DELETE /api/episodes/series/:id  — also deletes all episodes in it
router.delete('/series/:id', requireAuth, function(req, res) {
  try {
    var existing = db(req).prepare(
      'SELECT id FROM ep_series WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'not found' });
    db(req).prepare('DELETE FROM ep_episodes WHERE series_id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    db(req).prepare('DELETE FROM ep_series WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (e) {
    logger.error('DELETE /api/episodes/series/:id', e);
    res.status(500).json({ error: 'db error' });
  }
});

// ── Episodes CRUD ──────────────────────────────────────────────────────────

// GET /api/episodes/series/:seriesId/episodes
router.get('/series/:seriesId/episodes', requireAuth, function(req, res) {
  try {
    // verify series ownership
    var series = db(req).prepare(
      'SELECT id FROM ep_series WHERE id = ? AND user_id = ?'
    ).get(req.params.seriesId, req.user.id);
    if (!series) return res.status(404).json({ error: 'series not found' });
    var rows = db(req).prepare(
      'SELECT * FROM ep_episodes WHERE series_id = ? ORDER BY season ASC, ep_number ASC'
    ).all(req.params.seriesId);
    res.json(rows);
  } catch (e) {
    logger.error('GET episodes', e);
    res.status(500).json({ error: 'db error' });
  }
});

// POST /api/episodes/series/:seriesId/episodes
router.post('/series/:seriesId/episodes', requireAuth, function(req, res) {
  try {
    var series = db(req).prepare(
      'SELECT id FROM ep_series WHERE id = ? AND user_id = ?'
    ).get(req.params.seriesId, req.user.id);
    if (!series) return res.status(404).json({ error: 'series not found' });
    var b = req.body;
    var id = uid();
    var now = Date.now();
    db(req).prepare(`
      INSERT INTO ep_episodes
        (id, series_id, user_id, season, ep_number, title, script,
         thumbnail_emoji, duration_estimate, locked, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.params.seriesId,
      req.user.id,
      parseInt(b.season, 10)  || 1,
      parseInt(b.ep_number, 10) || 1,
      (b.title || 'Untitled Episode').slice(0, 120),
      (b.script || '').slice(0, 50000),
      (b.thumbnail_emoji || '🎬').slice(0, 8),
      (b.duration_estimate || '10 min').slice(0, 20),
      b.locked ? 1 : 0,
      (b.status === 'published' ? 'published' : 'draft'),
      now, now
    );
    // bump series updated_at
    db(req).prepare('UPDATE ep_series SET updated_at = ? WHERE id = ?')
      .run(now, req.params.seriesId);
    var row = db(req).prepare('SELECT * FROM ep_episodes WHERE id = ?').get(id);
    res.status(201).json(row);
  } catch (e) {
    logger.error('POST episode', e);
    res.status(500).json({ error: 'db error' });
  }
});

// PATCH /api/episodes/:episodeId
router.patch('/:episodeId', requireAuth, function(req, res) {
  try {
    var existing = db(req).prepare(
      'SELECT id, series_id FROM ep_episodes WHERE id = ? AND user_id = ?'
    ).get(req.params.episodeId, req.user.id);
    if (!existing) return res.status(404).json({ error: 'not found' });
    var b = req.body;
    var now = Date.now();
    db(req).prepare(`
      UPDATE ep_episodes SET
        season           = COALESCE(?, season),
        ep_number        = COALESCE(?, ep_number),
        title            = COALESCE(?, title),
        script           = COALESCE(?, script),
        thumbnail_emoji  = COALESCE(?, thumbnail_emoji),
        duration_estimate = COALESCE(?, duration_estimate),
        locked           = COALESCE(?, locked),
        status           = COALESCE(?, status),
        updated_at       = ?
      WHERE id = ? AND user_id = ?
    `).run(
      b.season           != null ? parseInt(b.season, 10)                            : null,
      b.ep_number        != null ? parseInt(b.ep_number, 10)                         : null,
      b.title            != null ? String(b.title).slice(0, 120)                     : null,
      b.script           != null ? String(b.script).slice(0, 50000)                 : null,
      b.thumbnail_emoji  != null ? String(b.thumbnail_emoji).slice(0, 8)            : null,
      b.duration_estimate != null ? String(b.duration_estimate).slice(0, 20)        : null,
      b.locked           != null ? (b.locked ? 1 : 0)                               : null,
      b.status           != null ? (b.status === 'published' ? 'published' : 'draft') : null,
      now,
      req.params.episodeId, req.user.id
    );
    db(req).prepare('UPDATE ep_series SET updated_at = ? WHERE id = ?')
      .run(now, existing.series_id);
    var row = db(req).prepare('SELECT * FROM ep_episodes WHERE id = ?').get(req.params.episodeId);
    res.json(row);
  } catch (e) {
    logger.error('PATCH episode', e);
    res.status(500).json({ error: 'db error' });
  }
});

// DELETE /api/episodes/:episodeId
router.delete('/:episodeId', requireAuth, function(req, res) {
  try {
    var existing = db(req).prepare(
      'SELECT id, series_id FROM ep_episodes WHERE id = ? AND user_id = ?'
    ).get(req.params.episodeId, req.user.id);
    if (!existing) return res.status(404).json({ error: 'not found' });
    db(req).prepare('DELETE FROM ep_episodes WHERE id = ? AND user_id = ?')
      .run(req.params.episodeId, req.user.id);
    db(req).prepare('UPDATE ep_series SET updated_at = ? WHERE id = ?')
      .run(Date.now(), existing.series_id);
    res.json({ ok: true });
  } catch (e) {
    logger.error('DELETE episode', e);
    res.status(500).json({ error: 'db error' });
  }
});

module.exports = router;
