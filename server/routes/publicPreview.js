'use strict';
var express = require('express');
var { rateLimit } = require('express-rate-limit');
var router = express.Router();
var db = require('../db');

var previewRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: 'Too many preview requests — please wait.',
});

var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(str) {
  str = str || '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeMediaUrl(url, fallback) {
  if (url && /^https:\/\//i.test(String(url))) return url;
  return fallback;
}

function tenantBranding(tenant) {
  var host = tenant.custom_domain || (tenant.subdomain + '.seewhylive.online');
  return {
    appName: tenant.name || 'SeeWhy LIVE',
    siteUrl: 'https://' + host,
  };
}

function renderPreviewPage(opts) {
  var title = opts.title;
  var description = opts.description;
  var thumbnailUrl = opts.thumbnailUrl;
  var videoUrl = opts.videoUrl;
  var canonicalUrl = opts.canonicalUrl;
  var isLive = opts.isLive;
  var appName = opts.appName;
  var siteUrl = opts.siteUrl;

  var safeTitle = escapeHtml(title);
  var safeDesc = escapeHtml(description);

  return '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    '<meta charset="UTF-8" />' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
    '<title>' + safeTitle + ' — ' + escapeHtml(appName) + '</title>' +
    '<meta property="og:title" content="' + safeTitle + '" />' +
    '<meta property="og:description" content="' + safeDesc + '" />' +
    '<meta property="og:image" content="' + escapeHtml(thumbnailUrl) + '" />' +
    '<meta property="og:url" content="' + escapeHtml(canonicalUrl) + '" />' +
    '<meta property="og:type" content="' + (isLive ? 'video.other' : 'video.movie') + '" />' +
    '<meta property="og:site_name" content="' + escapeHtml(appName) + '" />' +
    (videoUrl ? '<meta property="og:video" content="' + escapeHtml(videoUrl) + '" />' : '') +
    '<meta name="twitter:card" content="player" />' +
    '<meta name="twitter:title" content="' + safeTitle + '" />' +
    '<meta name="twitter:description" content="' + safeDesc + '" />' +
    '<meta name="twitter:image" content="' + escapeHtml(thumbnailUrl) + '" />' +
    '<style>' +
    'body { margin:0; background:#0C0806; color:#F5F5DC; font-family: \'DM Sans\', sans-serif; display:flex; flex-direction:column; align-items:center; padding:16px; }' +
    'video { width:100%; max-width:480px; border-radius:12px; margin-top:12px; }' +
    'h1 { font-family:\'Bebas Neue\', sans-serif; font-size:28px; margin:16px 0 4px; text-align:center; }' +
    'p { color:#ccc; text-align:center; max-width:480px; }' +
    '.cta { margin-top:20px; background:#D4AF37; color:#0C0806; text-decoration:none; padding:14px 28px; border-radius:8px; font-family:\'Barlow Condensed\', sans-serif; font-size:18px; font-weight:600; }' +
    '.live-badge { background:#dc2626; color:#fff; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:700; letter-spacing:1px; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    (isLive ? '<span class="live-badge">● LIVE</span>' : '') +
    '<h1>' + safeTitle + '</h1>' +
    '<p>' + safeDesc + '</p>' +
    (videoUrl
      ? '<video controls playsinline poster="' + escapeHtml(thumbnailUrl) + '" src="' + escapeHtml(videoUrl) + '"></video>'
      : '<img src="' + escapeHtml(thumbnailUrl) + '" style="width:100%;max-width:480px;border-radius:12px;" />'
    ) +
    '<a class="cta" href="' + escapeHtml(siteUrl) + escapeHtml(canonicalUrl) + '">Open in ' + escapeHtml(appName) + '</a>' +
    '</body>' +
    '</html>';
}

router.get('/watch/:id', previewRateLimit, async function(req, res) {
  if (!UUID_RE.test(req.params.id)) return res.status(400).send('Invalid ID');
  try {
    var result = await db.query(
      `SELECT r.id, r.title, r.thumbnail_url, r.hls_url, r.status,
              u.display_name AS creator_name
       FROM rooms r JOIN users u ON u.id = r.creator_id
       WHERE r.id = $1 AND r.tenant_id = $2`,
      [req.params.id, req.tenantId]
    );
    if (!result.rows.length) return res.status(404).send('Stream not found');
    var room = result.rows[0];
    var isLive = room.status === 'live';
    var branding = tenantBranding(req.tenant);

    res.send(renderPreviewPage({
      title: room.title || (room.creator_name + ' is live on ' + branding.appName),
      description: isLive ? (room.creator_name + ' is live now on ' + branding.appName + '.') : ('Watch ' + room.creator_name + ' on ' + branding.appName + '.'),
      thumbnailUrl: safeMediaUrl(room.thumbnail_url, branding.siteUrl + '/default-preview.jpg'),
      videoUrl: safeMediaUrl(room.hls_url, null),
      canonicalUrl: '/watch/' + room.id,
      isLive: isLive,
      appName: branding.appName,
      siteUrl: branding.siteUrl,
    }));
  } catch (err) {
    res.status(500).send('Error loading preview');
  }
});

router.get('/post/:id', previewRateLimit, async function(req, res) {
  if (!UUID_RE.test(req.params.id)) return res.status(400).send('Invalid ID');
  try {
    var result = await db.query(
      `SELECT p.id, p.caption, p.thumbnail_url, p.video_url, u.display_name AS creator_name
       FROM video_posts p JOIN users u ON u.id = p.creator_id
       WHERE p.id = $1 AND p.tenant_id = $2`,
      [req.params.id, req.tenantId]
    );
    if (!result.rows.length) return res.status(404).send('Post not found');
    var post = result.rows[0];
    var branding = tenantBranding(req.tenant);

    res.send(renderPreviewPage({
      title: post.caption ? post.caption.slice(0, 60) : (post.creator_name + ' on ' + branding.appName),
      description: 'Posted by ' + post.creator_name + ' on ' + branding.appName + '.',
      thumbnailUrl: safeMediaUrl(post.thumbnail_url, branding.siteUrl + '/default-preview.jpg'),
      videoUrl: safeMediaUrl(post.video_url, null),
      canonicalUrl: '/post/' + post.id,
      isLive: false,
      appName: branding.appName,
      siteUrl: branding.siteUrl,
    }));
  } catch (err) {
    res.status(500).send('Error loading preview');
  }
});

module.exports = router;
