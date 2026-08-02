// server/routes/publicPreview.js
//
// WHY THIS FILE EXISTS: your frontend is a client-rendered SPA (React/Vite).
// When someone shares a link on Facebook/Twitter/iMessage/etc., those
// platforms' link-preview crawlers do NOT execute JavaScript — they just
// read <meta> tags from the raw HTML response. A pure SPA route returns an
// empty shell, so shared links show no thumbnail/title. This route serves
// real server-rendered HTML with OG tags for exactly two URL patterns
// (/watch/:id and /post/:id), and ALSO gives a human visitor a genuinely
// watchable embedded preview — not just a redirect — before prompting them
// to get the full app.
//
// INTEGRATION: this must be mounted BEFORE your SPA catch-all / nginx
// try_files fallback, or the SPA's index.html will win instead. Mount at
// the top level in server.js:
//   const publicPreview = require('./routes/publicPreview');
//   app.use('/', publicPreview);
// and in nginx, make sure /watch/* and /post/* proxy to Node (port 3001)
// rather than falling through to the static SPA build.

const express = require('express');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const db = require('../db');

const previewRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: 'Too many preview requests — please wait.',
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const APP_NAME = 'SeeWhy LIVE';
const SITE_URL = 'https://www.seewhylive.online';

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Only allow https:// URLs in rendered HTML to block javascript:/data: URI injection
function safeMediaUrl(url, fallback) {
  if (url && /^https:\/\//i.test(String(url))) return url;
  return fallback;
}

function renderPreviewPage({ title, description, thumbnailUrl, videoUrl, canonicalUrl, isLive }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} — ${APP_NAME}</title>

  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${escapeHtml(thumbnailUrl)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:type" content="${isLive ? 'video.other' : 'video.movie'}" />
  <meta property="og:site_name" content="${APP_NAME}" />
  ${videoUrl ? `<meta property="og:video" content="${escapeHtml(videoUrl)}" />` : ''}

  <meta name="twitter:card" content="player" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${escapeHtml(thumbnailUrl)}" />

  <style>
    body { margin:0; background:#0C0806; color:#F5F5DC; font-family: 'DM Sans', sans-serif; display:flex; flex-direction:column; align-items:center; padding:16px; }
    video { width:100%; max-width:480px; border-radius:12px; margin-top:12px; }
    h1 { font-family:'Bebas Neue', sans-serif; font-size:28px; margin:16px 0 4px; text-align:center; }
    p { color:#ccc; text-align:center; max-width:480px; }
    .cta { margin-top:20px; background:#D4AF37; color:#0C0806; text-decoration:none; padding:14px 28px; border-radius:8px; font-family:'Barlow Condensed', sans-serif; font-size:18px; font-weight:600; }
    .live-badge { background:#dc2626; color:#fff; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:700; letter-spacing:1px; }
  </style>
</head>
<body>
  ${isLive ? '<span class="live-badge">● LIVE</span>' : ''}
  <h1>${safeTitle}</h1>
  <p>${safeDesc}</p>
  ${videoUrl ? `<video controls playsinline poster="${escapeHtml(thumbnailUrl)}" src="${escapeHtml(videoUrl)}"></video>` : `<img src="${escapeHtml(thumbnailUrl)}" style="width:100%;max-width:480px;border-radius:12px;" />`}
  <a class="cta" href="${SITE_URL}${canonicalUrl}">Open in ${APP_NAME}</a>
</body>
</html>`;
}

router.get('/watch/:id', previewRateLimit, async (req, res) => {
  if (!UUID_RE.test(req.params.id)) return res.status(400).send('Invalid ID');
  try {
    const result = await db.query(
      `SELECT r.id, r.title, r.thumbnail_url, r.hls_url, r.status,
              u.display_name AS creator_name
       FROM rooms r JOIN users u ON u.id = r.creator_id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).send('Stream not found');
    const room = result.rows[0];
    const isLive = room.status === 'live';

    res.send(renderPreviewPage({
      title: room.title || `${room.creator_name} is live on ${APP_NAME}`,
      description: isLive ? `${room.creator_name} is live now on ${APP_NAME} — creators keep 90%.` : `Watch ${room.creator_name} on ${APP_NAME}.`,
      thumbnailUrl: safeMediaUrl(room.thumbnail_url, `${SITE_URL}/default-preview.jpg`),
      videoUrl: safeMediaUrl(room.hls_url, null),
      canonicalUrl: `/watch/${room.id}`,
      isLive,
    }));
  } catch (err) {
    res.status(500).send('Error loading preview');
  }
});

router.get('/post/:id', previewRateLimit, async (req, res) => {
  if (!UUID_RE.test(req.params.id)) return res.status(400).send('Invalid ID');
  try {
    const result = await db.query(
      `SELECT p.id, p.caption, p.thumbnail_url, p.video_url, u.display_name AS creator_name
       FROM video_posts p JOIN users u ON u.id = p.creator_id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).send('Post not found');
    const post = result.rows[0];

    res.send(renderPreviewPage({
      title: post.caption ? post.caption.slice(0, 60) : `${post.creator_name} on ${APP_NAME}`,
      description: `Posted by ${post.creator_name} on ${APP_NAME}.`,
      thumbnailUrl: safeMediaUrl(post.thumbnail_url, `${SITE_URL}/default-preview.jpg`),
      videoUrl: safeMediaUrl(post.video_url, null),
      canonicalUrl: `/post/${post.id}`,
      isLive: false,
    }));
  } catch (err) {
    res.status(500).send('Error loading preview');
  }
});

module.exports = router;
