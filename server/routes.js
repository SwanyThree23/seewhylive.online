'use strict';

var express = require('express');
var router = express.Router();
var uuidv4 = require('uuid').v4;
var Database = require('better-sqlite3');
var jwt = require('jsonwebtoken');
var requireAuth = require('./middleware/auth');
var { rateLimit } = require('express-rate-limit');

// ─── Revenue split constants (immutable) ──────────────────────────────────────
var CREATOR  = 0.90;
var PLATFORM = 0.10;

var ROUTES_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

var moderationRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: function(req) { return req.user ? req.user.id : req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many requests' },
});

var tipRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: function(req) { return req.user ? req.user.id : req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many tip requests' },
});

var ppvCreateRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: function(req) { return req.user ? req.user.id : req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many PPV token requests' },
});

// ─── Optional module loading (graceful fallback) ──────────────────────────────
var analytics = null;
try { analytics = require('./analytics'); } catch (e) { console.warn('[routes] analytics module unavailable'); }

var moderation = null;
try { moderation = require('./moderation'); } catch (e) { console.warn('[routes] moderation module unavailable'); }

var search = null;
try { search = require('./search'); } catch (e) { console.warn('[routes] search module unavailable'); }

var notifications = null;
try { notifications = require('./notifications'); } catch (e) { console.warn('[routes] notifications module unavailable'); }
if (notifications) { notifications.setVAPIDKeys(process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY, process.env.VAPID_SUBJECT); }

var vault = null;
try { vault = require('./vault'); } catch (e) { console.warn('[routes] vault module unavailable — stream keys will not be encrypted at rest'); }

var aura = null;
try { aura = require('./aura'); } catch (e) { console.warn('[routes] aura module unavailable'); }

var stripe = null;
try { stripe = require('./stripe'); } catch (e) { console.warn('[routes] stripe module unavailable'); }

// ─── In-memory session state ──────────────────────────────────────────────────
var _userProfiles = {};
var _usernameIndex = {}; // displayName → userId — lets GET /users/:username find profiles by name
var _notificationPrefs = {};
var _pushSubscriptions = {};

// ─── AURA routes ──────────────────────────────────────────────────────────────

router.get('/aura/usage', requireAuth, function(req, res) {
  try {
    var streamId = String(req.query.streamId || '');
    if (!ROUTES_UUID_RE.test(streamId)) return res.status(400).json({ success: false, error: 'invalid streamId' });
    if (aura) {
      var usage = aura.getUsage(streamId);
      return res.json({
        callsThisHour: usage.callsThisHour || 0,
        limit: 60,
        streamId: streamId
      });
    }
    return res.json({ callsThisHour: 0, limit: 20, streamId: streamId });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.post('/aura/mode', requireAuth, function(req, res) {
  if (req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'forbidden' });
  }
  try {
    var VALID_MODES = ['hype', 'chill', 'professional', 'comedy'];
    var mode = VALID_MODES.includes(req.body.mode) ? req.body.mode : 'hype';
    if (aura) {
      aura.setMode(mode);
    }
    return res.json({ mode: mode, success: true });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.post('/aura/trigger', requireAuth, function(req, res) {
  if (req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'forbidden' });
  }
  try {
    var type = req.body.type || '';
    var streamId = String(req.body.streamId || '');
    if (!ROUTES_UUID_RE.test(streamId)) return res.status(400).json({ success: false, error: 'invalid streamId' });
    var mode = req.body.mode || 'hype';
    var data = req.body.data || {};

    if (!aura) {
      return res.json({ success: true, text: '[AURA offline -- set ANTHROPIC_API_KEY]', mode: 'hype' });
    }

    var triggerFn = null;

    var _vn  = String(data.viewerName  || 'Viewer').slice(0, 80);
    var _st  = String(data.streamTitle || 'SeeWhy LIVE').slice(0, 120);
    var _gn  = String(data.giftName   || 'Gift').slice(0, 60);
    var _nt  = String(data.note       || '').slice(0, 200);
    var _ac  = Math.min(Math.max(Math.floor(Number(data.amountCents)  || 0), 0), 5000000);
    var _pv  = Math.min(Math.max(Math.floor(Number(data.peakViewers)  || 0), 0), 1000000);
    var _tec = Math.min(Math.max(Math.floor(Number(data.totalEarningsCents) || 0), 0), 5000000);
    var _vc  = Math.min(Math.max(Math.floor(Number(data.viewerCount)  || 0), 0), 1000000);

    if (type === 'stream_start') {
      triggerFn = function(cb) {
        aura.triggerStreamStart(streamId, _st, _vc, cb);
      };
    } else if (type === 'tip_received') {
      triggerFn = function(cb) {
        aura.triggerTip(streamId, _vn, _ac || 500, _nt, cb);
      };
    } else if (type === 'gift_received') {
      triggerFn = function(cb) {
        aura.triggerGift(streamId, _vn, _gn, _ac || 100, cb);
      };
    } else if (type === 'new_viewer') {
      triggerFn = function(cb) {
        aura.triggerNewViewer(streamId, _vn, data.isReturning || false, cb);
      };
    } else if (type === 'stream_end') {
      triggerFn = function(cb) {
        aura.triggerStreamEnd(streamId, _pv, _tec, cb);
      };
    }

    if (!triggerFn) {
      return res.json({ success: false, error: 'Unknown trigger type: ' + type });
    }

    triggerFn(function(err, text) {
      res.json({ success: true, text: text || 'AURA response', mode: mode });
    });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

// ─── SEARCH routes ────────────────────────────────────────────────────────────

router.get('/search', function(req, res) {
  try {
    var q = String(req.query.q || '').slice(0, 200);
    var type = req.query.type || 'all';
    var limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 100);
    if (search) {
      var data = search.search(q, type, limit);
      return res.json({ results: data, total: data.length });
    }
    return res.json({ results: [], total: 0 });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.get('/streams/count', function(req, res) {
  try {
    if (search && search.db) {
      try {
        var row = search.db.prepare("SELECT COUNT(*) as c FROM stream_index WHERE status='live'").get();
        return res.json({ liveCount: row.c || 0 });
      } catch (dbErr) {
        return res.json({ liveCount: 0 });
      }
    }
    return res.json({ liveCount: 0 });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

// ─── ANALYTICS routes ─────────────────────────────────────────────────────────

router.get('/creator/analytics', requireAuth, function(req, res) {
  try {
    var creatorId = req.user.id;
    var _rawPeriod = req.query.period || 'month';
    var VALID_PERIODS = ['today', 'week', 'month'];
    if (!VALID_PERIODS.includes(_rawPeriod)) {
      return res.status(400).json({ error: 'period must be one of: today, week, month' });
    }
    var period = _rawPeriod;
    if (analytics) {
      var result = analytics.getCreatorAnalytics(creatorId, period);
      return res.json(result);
    }
    return res.json({
      totalEarningsCents: 0,
      creatorCents: 0,
      platformCents: 0,
      byType: { tip: 0, subscription: 0, paywall: 0, gift: 0 },
      recentEarnings: [],
      topSupporters: [],
      streamCount: 0,
      avgViewersPerStream: 0,
      peakViewers: 0
    });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.get('/admin/metrics', requireAuth, function(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  try {
    if (analytics) {
      var metrics = analytics.getPlatformMetrics();
      return res.json(metrics);
    }
    return res.json({
      totalRevenueCents: 0,
      totalCreators: 0,
      totalStreams: 0,
      platformCutCents: 0
    });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

// ─── MODERATION routes ────────────────────────────────────────────────────────

router.get('/moderation/word-filters', requireAuth, function(req, res) {
  try {
    var creatorId = req.user.id;
    if (moderation) {
      return res.json({ filters: moderation.getWordFilters(creatorId) });
    }
    return res.json({ filters: [] });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.post('/moderation/word-filters', requireAuth, function(req, res) {
  try {
    var word = String(req.body.word || '').slice(0, 200);
    var creatorId = req.user.id;
    if (!word) {
      return res.json({ success: false, error: 'word is required' });
    }
    if (moderation) {
      var filter = moderation.addWordFilter(creatorId, word);
      return res.json({ filter: filter, success: true });
    }
    return res.json({ success: false, error: 'moderation module unavailable' });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/moderation/word-filters/:id', requireAuth, function(req, res) {
  try {
    var creatorId = req.user.id;
    if (moderation) {
      moderation.removeWordFilterById(creatorId, String(req.params.id || '').slice(0, 200));
    }
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.post('/moderation/subscriber-only', requireAuth, function(req, res) {
  if (req.user.role !== 'host' && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  try {
    var roomId = String(req.body.roomId || '');
    if (!ROUTES_UUID_RE.test(roomId)) return res.status(400).json({ error: 'invalid roomId' });
    var creatorId = req.user.id;
    var enabled = req.body.enabled || false;
    if (moderation) {
      moderation.setSubscriberOnly(roomId, creatorId, enabled);
    }
    return res.json({ success: true, enabled: enabled });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.post('/moderation/ban', requireAuth, moderationRateLimit, function(req, res) {
  if (req.user.role !== 'host' && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  try {
    var creatorId = req.user.id;
    var bannedUserId = String(req.body.bannedUserId || '');
    if (!ROUTES_UUID_RE.test(bannedUserId)) return res.status(400).json({ error: 'invalid bannedUserId' });
    var bannedUsername = String(req.body.bannedUsername || '').slice(0, 80);
    var reason = String(req.body.reason || '').slice(0, 200);
    if (moderation) {
      var ban = moderation.banUser(creatorId, bannedUserId, bannedUsername, reason);
      return res.json({ success: true, ban: ban });
    }
    return res.json({ success: false, error: 'moderation module unavailable' });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/moderation/ban/:userId', requireAuth, moderationRateLimit, function(req, res) {
  if (req.user.role !== 'host' && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  if (!ROUTES_UUID_RE.test(req.params.userId)) return res.status(400).json({ error: 'invalid userId' });
  try {
    var creatorId = req.user.id;
    if (moderation) {
      moderation.unbanUser(creatorId, req.params.userId);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.get('/moderation/bans', requireAuth, function(req, res) {
  try {
    var creatorId = req.user.id;
    if (moderation) {
      return res.json({ bans: moderation.getBannedUsers(creatorId) });
    }
    return res.json({ bans: [] });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.post('/moderation/shadow-ban', requireAuth, moderationRateLimit, function(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  try {
    var userId = String(req.body.userId || '');
    if (!ROUTES_UUID_RE.test(userId)) return res.status(400).json({ error: 'invalid userId' });
    var reason = String(req.body.reason || '').slice(0, 200);
    var bannedBy = req.user.id;
    if (moderation) {
      moderation.shadowBanUser(userId, reason, bannedBy);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

// ─── STRIPE / PAYMENT routes ──────────────────────────────────────────────────

router.get('/creator/onboard/status', requireAuth, function(req, res) {
  try {
    return res.json({
      connected: !!(process.env.STRIPE_SECRET_KEY),
      accountId: null,
      availableCents: 0
    });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.get('/creator/onboard/link', requireAuth, function(req, res) {
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var email = req.query.email ? String(req.query.email).slice(0, 254) : '';
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'valid email query param is required' });
  }
  try {
    if (stripe) {
      stripe.createConnectAccount(email)
        .then(function(result) {
          res.json({ url: result.onboardingUrl });
        })
        .catch(function(err) {
          res.json({ url: 'https://stripe.com/connect' });
        });
      return;
    }
    return res.json({ url: 'https://stripe.com/connect' });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.post('/payments/tip', requireAuth, tipRateLimit, function(req, res) {
  try {
    var streamId = String(req.body.streamId || '');
    if (!ROUTES_UUID_RE.test(streamId)) return res.status(400).json({ success: false, error: 'invalid streamId' });
    var amountCents = req.body.amountCents || 0;
    var note = String(req.body.note || '').slice(0, 200);
    var fromUserId = req.user.id;
    var creatorStripeAccountId = req.body.creatorStripeAccountId || '';

    if (!amountCents || Math.floor(amountCents) < 50) {
      return res.status(400).json({ success: false, error: 'Minimum tip amount is 50 cents' });
    }

    var amtCents = Math.floor(amountCents);
    if (!Number.isFinite(amtCents) || amtCents > 50000) {
      return res.status(400).json({ success: false, error: 'Tip amount exceeds maximum of $500.00' });
    }
    var creatorCents = Math.floor(amtCents * CREATOR);
    var platformCents = amtCents - creatorCents;

    // A Stripe account is required — without one there is no actual charge,
    // so we must not record earnings (prevents fake analytics injection).
    if (!creatorStripeAccountId) {
      return res.status(400).json({ success: false, error: 'creatorStripeAccountId is required to process a tip' });
    }

    if (stripe) {
      stripe.createGiftCharge(fromUserId, streamId, amtCents, creatorStripeAccountId)
        .then(function(result) {
          if (analytics) {
            try {
              analytics.recordEarning(streamId, fromUserId, 'tip', amtCents, creatorCents, platformCents, note);
            } catch (e) { /* ignore analytics error */ }
          }
          res.json({
            success: true,
            clientSecret: result.clientSecret || null,
            amountCents: amtCents,
            creatorCents: creatorCents,
            platformCents: platformCents
          });
        })
        .catch(function(err) {
          res.status(500).json({ success: false, error: 'Payment processing failed' });
        });
      return;
    }

    return res.status(503).json({ success: false, error: 'Payment processing unavailable' });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.post('/payments/payout', requireAuth, function(req, res) {
  try {
    var creatorId = req.user.id;
    var amountCents = req.body.amountCents || 0;

    var flooredCents = Math.floor(amountCents);
    if (!Number.isFinite(flooredCents) || flooredCents < 1000) {
      return res.status(400).json({ success: false, error: 'Minimum payout is $10.00' });
    }
    if (flooredCents > 5000000) {
      return res.status(400).json({ success: false, error: 'Payout amount exceeds maximum' });
    }
    return res.json({
      success: true,
      amountCents: flooredCents,
      message: 'Payout of $' + (flooredCents / 100).toFixed(2) + ' initiated'
    });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.post('/payments/subscribe', requireAuth, function(req, res) {
  try {
    var subscriberId = req.user.id;
    var creatorId = String(req.body.creatorId || '');
    if (!ROUTES_UUID_RE.test(creatorId)) return res.status(400).json({ error: 'invalid creatorId' });
    var VALID_TIERS = ['fan', 'supporter', 'ride_or_die'];
    var tier = VALID_TIERS.includes(String(req.body.tier || '')) ? String(req.body.tier) : 'fan';
    var amountCents = req.body.amountCents || 0;
    var id = uuidv4();

    if (!Number.isFinite(amountCents) || amountCents < 1 || amountCents > 50000) {
      return res.status(400).json({ success: false, error: 'amountCents must be between 1 and 50000' });
    }

    if (moderation) {
      try {
        moderation.addSubscription(id, subscriberId, creatorId, tier, Math.floor(amountCents), null);
      } catch (e) { /* ignore moderation error */ }
    }

    return res.json({ success: true, tier: tier, id: id });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

// ─── USER routes ──────────────────────────────────────────────────────────────

router.get('/users/me', requireAuth, function(req, res) {
  try {
    var profile = _userProfiles[req.user.id] || {};
    return res.json({
      username: profile.username || 'SwanyThree',
      displayName: profile.displayName || 'SwanyThree',
      bio: profile.bio || 'SeeWhy LIVE creator · Washington Classic host',
      avatarEmoji: profile.avatarEmoji || '👑',
      tier: 'pro',
      isLive: false
    });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.get('/users/:username', function(req, res) {
  try {
    var username = String(req.params.username || '').slice(0, 80);
    var _profileUserId = _usernameIndex[username];
    var profile = (_profileUserId && _userProfiles[_profileUserId]) || null;
    if (profile) {
      return res.json(Object.assign({}, profile, { username: username }));
    }
    return res.json({
      username: username,
      displayName: username,
      bio: 'SeeWhy LIVE creator',
      followerCount: 0,
      isLive: false,
      tier: 'free'
    });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.put('/users/me', requireAuth, function(req, res) {
  try {
    var displayName = String(req.body.displayName || '').slice(0, 80);
    var bio         = String(req.body.bio         || '').slice(0, 500);
    var avatarEmoji = String(req.body.avatarEmoji || '').slice(0, 8);
    if (!_userProfiles[req.user.id] && Object.keys(_userProfiles).length >= 50000) {
      return res.status(503).json({ success: false, error: 'Server at capacity' });
    }
    var _oldProfile = _userProfiles[req.user.id];
    if (_oldProfile && _oldProfile.displayName && _oldProfile.displayName !== displayName) {
      delete _usernameIndex[_oldProfile.displayName];
    }
    _userProfiles[req.user.id] = {
      displayName: displayName,
      bio: bio,
      avatarEmoji: avatarEmoji
    };
    if (displayName) _usernameIndex[displayName] = req.user.id;
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/users/me', requireAuth, function(req, res) {
  try {
    var _delProfile = _userProfiles[req.user.id];
    if (_delProfile && _delProfile.displayName) delete _usernameIndex[_delProfile.displayName];
    delete _userProfiles[req.user.id];
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.get('/users/me/earnings', requireAuth, function(req, res) {
  try {
    return res.json({ availableCents: 0, totalEarnedCents: 0, pendingCents: 0 });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

// ─── NOTIFICATION routes ──────────────────────────────────────────────────────

router.post('/push/subscribe', requireAuth, function(req, res) {
  try {
    var userId = req.user.id;
    var raw = req.body.subscription || {};
    var endpoint = String(raw.endpoint || '');
    // Endpoint must be a valid https:// URL — any other scheme (http, data, javascript)
    // would cause the server to make outbound requests to an attacker-controlled host (SSRF)
    // when push notifications are dispatched.
    if (!endpoint || !/^https:\/\//.test(endpoint) || endpoint.length > 2048) {
      return res.status(400).json({ success: false, error: 'invalid push subscription endpoint' });
    }
    // Hostname guard: push notifications are dispatched as server-initiated HTTPS requests;
    // a private-IP endpoint would let any authenticated user trigger SSRF on every go-live event.
    var _PUSH_PRIV = /^(localhost$|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.0\.0\.0|169\.254\.|::1$|::ffff:|fc00:|fd[0-9a-f]{2}:|fe80:|2002:7f|100\.(6[4-9]|[7-9]\d|1[0-2]\d)\.|^\d+$|^0x)/i;
    var _pushParsed;
    try { _pushParsed = new URL(endpoint); } catch (_) {
      return res.status(400).json({ success: false, error: 'invalid push subscription endpoint' });
    }
    if (!_pushParsed.hostname || _PUSH_PRIV.test(_pushParsed.hostname)) {
      return res.status(400).json({ success: false, error: 'invalid push subscription endpoint' });
    }
    var subscription = { endpoint: endpoint, keys: raw.keys || {} };
    if (!_pushSubscriptions[userId] && Object.keys(_pushSubscriptions).length >= 50000) {
      return res.status(503).json({ success: false, error: 'Server at capacity' });
    }
    _pushSubscriptions[userId] = subscription;
    if (notifications) {
      try {
        notifications.subscribeToNotifications(userId, subscription);
      } catch (e) { /* ignore notifications error */ }
    }
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.post('/users/me/notifications', requireAuth, function(req, res) {
  try {
    var prefKey = req.user.id;
    if (!_notificationPrefs[prefKey] && Object.keys(_notificationPrefs).length >= 50000) {
      return res.status(503).json({ success: false, error: 'Server at capacity' });
    }
    _notificationPrefs[prefKey] = {
      notifyNewStream: req.body.notifyNewStream || false,
      notifyTip: req.body.notifyTip || false,
      notifySubscriber: req.body.notifySubscriber || false,
      notifyEmailDigest: req.body.notifyEmailDigest || false
    };
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

// ─── METRICS / LEADERBOARD routes ────────────────────────────────────────────

router.get('/metrics', requireAuth, function(req, res) {
  try {
    var roomId = req.query.roomId || req.user.id;
    if (roomId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }
    if (!ROUTES_UUID_RE.test(roomId)) {
      return res.status(400).json({ error: 'invalid roomId' });
    }
    if (analytics) {
      var result = analytics.getCreatorAnalytics(roomId, 'month');
      return res.json({
        roomId: roomId,
        viewerCount: 0,
        totalEarningsCents: result.totalEarningsCents || 0,
        creatorCents: result.creatorCents || 0,
        platformCents: result.platformCents || 0,
        topSupporters: result.topSupporters || [],
        recentEarnings: result.recentEarnings || []
      });
    }
    return res.json({
      roomId: roomId,
      viewerCount: 0,
      totalEarningsCents: 0,
      creatorCents: 0,
      platformCents: 0,
      topSupporters: [],
      recentEarnings: []
    });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.get('/leaderboard', function(req, res) {
  try {
    var limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    if (analytics && analytics.getTopCreators) {
      var top = analytics.getTopCreators(limit);
      return res.json({ leaderboard: top, updatedAt: Date.now() });
    }
    return res.json({ leaderboard: [], updatedAt: Date.now() });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

// ─── PPV routes ───────────────────────────────────────────────────────────────

var _ppvTokens = {};

// Evict expired PPV tokens every 30 minutes
setInterval(function() {
  var now = Date.now();
  Object.keys(_ppvTokens).forEach(function(k) {
    if (_ppvTokens[k] && now > _ppvTokens[k].expiresAt) delete _ppvTokens[k];
  });
}, 30 * 60 * 1000);

router.post('/ppv/create', requireAuth, ppvCreateRateLimit, async function(req, res) {
  try {
    var streamId = String(req.body.streamId || '');
    if (!streamId || !ROUTES_UUID_RE.test(streamId)) {
      return res.status(400).json({ success: false, error: 'valid streamId is required' });
    }
    var priceCents = Math.floor(req.body.priceCents || 499);
    if (!Number.isFinite(priceCents) || priceCents < 100 || priceCents > 50000) {
      return res.status(400).json({ success: false, error: 'priceCents must be between 100 and 50000' });
    }
    // Verify the caller owns this stream
    var ownerResp = await fetch(SUPA_URL + '/rest/v1/streams?id=eq.' + encodeURIComponent(streamId) + '&select=host_user_id&limit=1', {
      headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }
    });
    var ownerData = await ownerResp.json();
    if (!Array.isArray(ownerData) || !ownerData[0] || ownerData[0].host_user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    if (Object.keys(_ppvTokens).length >= 1000) {
      return res.status(429).json({ success: false, error: 'Too many active PPV tokens — try again later' });
    }
    var token = require('crypto').randomBytes(16).toString('hex');
    var expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    _ppvTokens[token] = { streamId: streamId, priceCents: priceCents, expiresAt: expiresAt };
    return res.json({ token: token, priceCents: priceCents, expiresAt: expiresAt });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

router.post('/ppv/verify', requireAuth, function(req, res) {
  try {
    var token = String(req.body.token || '');
    if (!token || !/^[0-9a-f]{32}$/i.test(token)) {
      return res.status(400).json({ valid: false, error: 'invalid token format' });
    }
    var streamId = String(req.body.streamId || '');
    if (!streamId || !ROUTES_UUID_RE.test(streamId)) {
      return res.status(400).json({ valid: false, error: 'invalid streamId' });
    }
    var entry = _ppvTokens[token];
    if (!entry) {
      return res.json({ valid: false, error: 'Invalid or expired PPV token' });
    }
    if (Date.now() > entry.expiresAt) {
      delete _ppvTokens[token];
      return res.json({ valid: false, error: 'PPV token expired' });
    }
    if (!streamId || entry.streamId !== streamId) {
      return res.json({ valid: false, error: 'Token not valid for this stream' });
    }
    delete _ppvTokens[token];
    return res.json({ valid: true, streamId: entry.streamId, priceCents: entry.priceCents });
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});

// ─── N8N / AUTOMATION routes ──────────────────────────────────────────────────

router.post('/n8n/test', requireAuth, async function(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'forbidden' });
  try {
    var webhookUrl  = req.body.webhookUrl || '';
    var workflowId  = req.body.workflowId || '';
    var _rawPayload = req.body.payload || { test: true, source: 'seewhy-live', event: req.body.event || 'test', ts: req.body.ts || Date.now() };
    var _payloadStr = JSON.stringify(_rawPayload);
    if (_payloadStr.length > 10240) {
      return res.status(400).json({ success: false, error: 'payload exceeds 10 KB limit' });
    }
    var payload = JSON.parse(_payloadStr);
    if (!webhookUrl) {
      if (workflowId) {
        return res.json({ success: true, simulated: true, workflowId: workflowId, message: 'Simulated test — configure a real webhookUrl to test live delivery.' });
      }
      return res.json({ success: false, error: 'webhookUrl is required' });
    }
    var https = require('https');
    var url = require('url');
    var dns = require('dns');
    var parsed = url.parse(webhookUrl);
    var isHttps = parsed.protocol === 'https:';
    if (!isHttps) {
      return res.status(400).json({ success: false, error: 'webhookUrl must use https://' });
    }
    var PRIVATE_HOST = /^(localhost$|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.0\.0\.0|169\.254\.|::1$|::ffff:|fc00:|fd[0-9a-f]{2}:|fe80:|2002:7f|100\.(6[4-9]|[7-9]\d|1[0-2]\d)\.|^\d+$|^0x)/i;
    if (!parsed.hostname || PRIVATE_HOST.test(parsed.hostname)) {
      return res.status(400).json({ success: false, error: 'webhookUrl hostname not allowed' });
    }
    // DNS rebinding guard: resolve hostname and verify the IP is not private
    var lookupResult;
    try {
      lookupResult = await dns.promises.lookup(parsed.hostname);
    } catch (dnsErr) {
      return res.status(400).json({ success: false, error: 'DNS lookup failed' });
    }
    if (PRIVATE_HOST.test(lookupResult.address)) {
      return res.status(400).json({ success: false, error: 'webhookUrl resolves to disallowed IP' });
    }
    var bodyStr = JSON.stringify(payload);
    var options = {
      hostname: lookupResult.address,  // use resolved IP to prevent TOCTOU re-resolution
      servername: parsed.hostname,     // preserve SNI for TLS certificate validation
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) }
    };
    var reqLib = https;
    var outReq = reqLib.request(options, function(outRes) {
      return res.json({ success: true, statusCode: outRes.statusCode, webhookUrl: webhookUrl });
    });
    outReq.on('error', function(e) {
      return res.json({ success: false, error: 'Webhook request failed' });
    });
    outReq.write(bodyStr);
    outReq.end();
  } catch (err) {
    return res.json({ success: false, error: 'Internal server error' });
  }
});


// ── STREAM SYNC → Supabase ────────────────────────────────────
var SUPA_URL = 'https://rxlgywvfclyjdfyvfvyc.supabase.co';
var SUPA_KEY = process.env.SUPABASE_SERVICE_KEY || '';

router.post('/stream-sync', requireAuth, async function(req, res) {
  try {
    if (req.user.role !== 'host' && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
    var b = req.body;
    var creatorId = req.user.id;
    var STREAM_STATUSES = ['live', 'offline'];
    var safeStatus = STREAM_STATUSES.includes(b.status) ? b.status : 'live';
    var safeTitle = String(b.title || '').slice(0, 120);
    var safeCategory = String(b.category || 'live').slice(0, 40);
    var safeViewerCount = Math.max(0, Math.min(Math.floor(Number(b.viewer_count) || 0), 1000000));
    var payload = { title: safeTitle, status: safeStatus, viewer_count: safeViewerCount, started_at: new Date().toISOString(), category: safeCategory, is_live: true, host_user_id: creatorId, creator_id: creatorId };
    var resp = await fetch(SUPA_URL + '/rest/v1/streams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY, 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      var errBody = await resp.json().catch(function() { return {}; });
      return res.status(502).json({ ok: false, error: (errBody && errBody.message) || 'Supabase error' });
    }
    var data = await resp.json();
    res.json({ ok: true, stream: data });
  } catch(e) { res.status(500).json({ ok: false, error: 'Internal server error' }); }
});

router.post('/stream-end', requireAuth, async function(req, res) {
  try {
    var stream_id = String(req.body.stream_id || '');
    if (!stream_id || !ROUTES_UUID_RE.test(stream_id)) {
      return res.status(400).json({ ok: false, error: 'Invalid stream_id' });
    }
    var ownerResp = await fetch(SUPA_URL + '/rest/v1/streams?id=eq.' + encodeURIComponent(stream_id) + '&select=host_user_id&limit=1', {
      headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }
    });
    var ownerData = await ownerResp.json();
    if (!Array.isArray(ownerData) || !ownerData[0] || ownerData[0].host_user_id !== req.user.id) {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
    await fetch(SUPA_URL + '/rest/v1/streams?id=eq.' + encodeURIComponent(stream_id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY },
      body: JSON.stringify({ status: 'ended', ended_at: new Date().toISOString() })
    });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: 'Internal server error' }); }
});


// ── VAULT PRO KEY ENDPOINTS ───────────────────────────────────
// /vault/save-key  — client posts plaintext key once; server encrypts and stores
// /vault/key-exists — client can check presence without getting the raw key
// /vault/delete-key — remove stored key when destination is deleted

router.post('/vault/save-key', requireAuth, function(req, res) {
  if (!vault) return res.status(501).json({ ok: false, error: 'Vault not available on this server' });
  try {
    var destId   = String(req.body.dest_id  || '').slice(0, 200);
    var plainKey = String(req.body.plain_key || '').slice(0, 2000);
    if (!destId || !plainKey) {
      return res.status(400).json({ ok: false, error: 'dest_id, plain_key are required' });
    }
    vault.saveKey(req.user.id, destId, plainKey);
    res.json({ ok: true, stored: true });
  } catch(e) { res.status(500).json({ ok: false, error: 'Internal server error' }); }
});

router.get('/vault/key-exists', requireAuth, function(req, res) {
  if (!vault) return res.json({ ok: true, exists: false });
  try {
    var exists = vault.hasKey(req.user.id, req.query.dest_id || '');
    res.json({ ok: true, exists: exists });
  } catch(e) { res.status(500).json({ ok: false, error: 'Internal server error' }); }
});

router.post('/vault/delete-key', requireAuth, function(req, res) {
  if (!vault) return res.json({ ok: true });
  try {
    vault.deleteKey(req.user.id, req.body.dest_id || '');
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: 'Internal server error' }); }
});

router.get('/vault/key-meta', requireAuth, function(req, res) {
  if (!vault) return res.json({ ok: true, keys: [] });
  try {
    var meta = vault.listGuestKeyMeta(req.user.id);
    res.json({ ok: true, keys: meta });
  } catch(e) { res.status(500).json({ ok: false, error: 'Internal server error' }); }
});

// Dedicated health check — tests whether VAULT_SECRET is configured and
// encryption is operational without reading or writing any real key data.
router.get('/vault/health', requireAuth, function(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'forbidden' });
  if (!vault) {
    return res.status(503).json({ ok: false, ready: false, reason: 'vault module not loaded' });
  }
  var secret = process.env.VAULT_SECRET || '';
  if (!secret || secret.length !== 64) {
    return res.status(503).json({ ok: false, ready: false, reason: 'VAULT_SECRET not configured (need 64-char hex)' });
  }
  try {
    // Round-trip a test value to confirm encrypt/decrypt works
    var testCipher = vault.encrypt('__vault_health_check__');
    var testPlain  = vault.decrypt(testCipher);
    if (testPlain !== '__vault_health_check__') throw new Error('round-trip mismatch');
    res.json({ ok: true, ready: true, reason: 'AES-256-GCM operational' });
  } catch(e) {
    res.status(503).json({ ok: false, ready: false, reason: e.message });
  }
});

// ── RTMP FANOUT ENGINE ────────────────────────────────────────
// Each guest gets their own isolated FFmpeg process (failure isolation).
// Keys are resolved from Vault Pro; plaintext keys in body are only a fallback.
// Transmuxing only: -c copy (no re-encoding), <2s startup latency.

var { spawn } = require('child_process');

// Map of streamId → { process, restarts, destCount, startedAt }
var activeFanouts = Object.create(null); // null prototype prevents __proto__ pollution
var FANOUT_KEY_BLOCKLIST = new Set(['__proto__', 'constructor', 'prototype']);
var MAX_RESTARTS = 3;
var RESTART_DELAY_MS = 5000;

function buildFfmpegArgs(ingestUrl, resolvedDests) {
  var args = ['-re', '-i', ingestUrl, '-loglevel', 'warning'];
  resolvedDests.forEach(function(d) {
    // transmux only — no re-encoding; separate url and key with / if needed
    var url = d.url.replace(/\/$/, '');
    var dest = url + '/' + d.key;
    args.push('-c', 'copy', '-f', 'flv', dest);
  });
  return args;
}

function spawnFanout(streamId, ingestUrl, resolvedDests, restartCount) {
  restartCount = restartCount || 0;
  var args = buildFfmpegArgs(ingestUrl, resolvedDests);
  var ffmpeg = spawn('ffmpeg', args, { detached: false });
  var entry = activeFanouts[streamId] || {};
  entry.process = ffmpeg;
  entry.restarts = restartCount;
  entry.destCount = resolvedDests.length;
  entry.startedAt = Date.now();
  activeFanouts[streamId] = entry;

  ffmpeg.stderr.on('data', function(data) {
    // Only log errors, not progress
    var msg = data.toString();
    if (msg.includes('Error') || msg.includes('error')) {
      console.error('[fanout:%s]', streamId, msg.trim().substring(0, 120));
    }
  });

  ffmpeg.on('exit', function(code, signal) {
    console.log('[fanout:%s] exited code=%s signal=%s restarts=%d', streamId, code, signal, restartCount);
    if (activeFanouts[streamId] && activeFanouts[streamId].process === ffmpeg) {
      // Auto-restart on unexpected exit (not manual kill)
      if (signal !== 'SIGTERM' && restartCount < MAX_RESTARTS) {
        console.log('[fanout:%s] restarting in %dms (attempt %d/%d)', streamId, RESTART_DELAY_MS, restartCount + 1, MAX_RESTARTS);
        setTimeout(function() {
          if (activeFanouts[streamId]) {
            spawnFanout(streamId, ingestUrl, resolvedDests, restartCount + 1);
          }
        }, RESTART_DELAY_MS);
      } else {
        delete activeFanouts[streamId];
      }
    }
  });

  return ffmpeg;
}

router.post('/fanout-start', requireAuth, async function(req, res) {
  if (req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'only hosts may start a fanout' });
  }
  try {
    var b = req.body;
    var streamId = b.stream_id || 'default';
    if (!/^[\w.\-]{1,128}$/.test(streamId) || FANOUT_KEY_BLOCKLIST.has(streamId)) {
      return res.status(400).json({ ok: false, error: 'invalid stream_id' });
    }
    var guestId  = req.user.id;
    var rtmpHost  = process.env.RTMP_INGEST_HOST || 'localhost';
    var rtmpPort  = process.env.RTMP_INGEST_PORT || '1935';
    var ingestUrl = b.ingest_url || ('rtmp://' + rtmpHost + ':' + rtmpPort + '/live/' + (b.room_id || b.stream_key || 'stream'));
    if (b.ingest_url) {
      var parsedIngest;
      try { parsedIngest = new URL(b.ingest_url); } catch (_) { return res.status(400).json({ ok: false, error: 'ingest_url is not a valid URL' }); }
      if (!/^rtmps?:$/i.test(parsedIngest.protocol)) {
        return res.status(400).json({ ok: false, error: 'ingest_url must use rtmp:// or rtmps://' });
      }
      var PRIV = /^(localhost$|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.0\.0\.0|169\.254\.|::1$|::ffff:|fc00:|fd[0-9a-f]{2}:|fe80:|2002:7f|100\.(6[4-9]|[7-9]\d|1[0-2]\d)\.|^\d+$|^0x)/i;
      if (!parsedIngest.hostname || PRIV.test(parsedIngest.hostname)) {
        return res.status(400).json({ ok: false, error: 'ingest_url hostname not allowed' });
      }
      // Resolve hostname to guard against DNS rebinding (FFmpeg re-resolves on connect)
      var _dnsLookup;
      try { _dnsLookup = await require('dns').promises.lookup(parsedIngest.hostname); } catch(_) { return res.status(400).json({ ok: false, error: 'ingest_url hostname DNS resolution failed' }); }
      if (PRIV.test(_dnsLookup.address)) {
        return res.status(400).json({ ok: false, error: 'ingest_url hostname resolves to disallowed address' });
      }
    }
    var destinations = b.destinations || [];
    if (destinations.length > 10) {
      return res.status(400).json({ ok: false, error: 'maximum 10 destinations per fanout' });
    }

    // Per-user fanout cap checked BEFORE claiming the stream-ID entry.
    // Checking after the claim leaves orphaned entries that permanently block the user
    // from starting any new fanout (concurrent requests each claim a slot then all fail).
    var userFanoutCount = Object.keys(activeFanouts).filter(function(id) {
      return activeFanouts[id] && activeFanouts[id].ownerId === req.user.id;
    }).length;
    if (userFanoutCount >= 5) {
      return res.status(429).json({ ok: false, error: 'Maximum 5 active fanout streams per user' });
    }

    // Ownership check and atomic reservation (JS event loop: no await here, so race-free)
    if (activeFanouts[streamId]) {
      if (activeFanouts[streamId].ownerId && activeFanouts[streamId].ownerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ ok: false, error: 'forbidden' });
      }
      if (activeFanouts[streamId].process) {
        activeFanouts[streamId].process.kill('SIGTERM');
        delete activeFanouts[streamId];
      }
    }
    // Claim this stream_id before async dest-resolution to prevent first-come-first-served bypass
    if (!activeFanouts[streamId]) {
      activeFanouts[streamId] = { ownerId: req.user.id };
    }

    // Resolve stream keys: Vault Pro first, fall back to body key
    var resolvedDests = [];
    for (var i = 0; i < destinations.length; i++) {
      var d = destinations[i];
      if (!d.url || !d.enabled) continue;
      var resolvedKey = d.key || '';
      if (vault && d.dest_id && guestId) {
        try {
          var vaultKey = vault.getDecryptedKey(guestId, d.dest_id);
          if (vaultKey) resolvedKey = vaultKey;
        } catch (_) { /* key not in vault, use body key */ }
      }
      if (!resolvedKey) continue;
      // Validate destination URL to prevent SSRF via FFmpeg output targets
      var destParsed;
      try { destParsed = new URL(d.url); } catch (_) { continue; }
      if (!/^rtmps?:$/i.test(destParsed.protocol)) continue;
      var PRIV2 = /^(localhost$|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.0\.0\.0|169\.254\.|::1$|::ffff:|fc00:|fd[0-9a-f]{2}:|fe80:|2002:7f|100\.(6[4-9]|[7-9]\d|1[0-2]\d)\.|^\d+$|^0x)/i;
      if (!destParsed.hostname || PRIV2.test(destParsed.hostname)) continue;
      try {
        var _destDns = await require('dns').promises.lookup(destParsed.hostname);
        if (PRIV2.test(_destDns.address)) continue;
      } catch(_) { continue; }
      resolvedDests.push({ url: d.url, key: resolvedKey, label: d.label || d.platform || 'custom' });
    }

    if (resolvedDests.length === 0) {
      // Clean up the claim slot so the user's cap count is not inflated
      if (activeFanouts[streamId] && !activeFanouts[streamId].process) delete activeFanouts[streamId];
      return res.json({ ok: false, error: 'No enabled destinations with resolvable keys' });
    }

    spawnFanout(streamId, ingestUrl, resolvedDests, 0);
    activeFanouts[streamId] = activeFanouts[streamId] || { ownerId: req.user.id };
    console.log('[fanout:%s] started → %d destinations (guest=%s)', streamId, resolvedDests.length, guestId);
    res.json({ ok: true, stream_id: streamId, destinations: resolvedDests.length });
  } catch(e) { res.status(500).json({ ok: false, error: 'Internal server error' }); }
});

router.post('/fanout-stop', requireAuth, function(req, res) {
  var streamId = req.body.stream_id || 'default';
  if (!/^[\w.\-]{1,128}$/.test(streamId) || FANOUT_KEY_BLOCKLIST.has(streamId)) {
    return res.status(400).json({ ok: false, error: 'invalid stream_id' });
  }
  var entry = activeFanouts[streamId];
  if (!entry) return res.json({ ok: false, error: 'No active fanout for ' + streamId });
  if (entry.ownerId && entry.ownerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }
  if (entry.process) {
    entry.process.kill('SIGTERM');
    delete activeFanouts[streamId];
    res.json({ ok: true, stopped: streamId });
  } else {
    res.json({ ok: false, error: 'No active fanout for ' + streamId });
  }
});

// Kill every active FFmpeg fanout process — admin/cleanup endpoint.
router.post('/fanout-stop-all', requireAuth, function(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  var ids = Object.keys(activeFanouts);
  var killed = 0;
  ids.forEach(function(id) {
    var entry = activeFanouts[id];
    if (entry && entry.process) {
      entry.process.kill('SIGTERM');
      killed++;
    }
    delete activeFanouts[id];
  });
  console.log('[fanout] stop-all: killed %d processes', killed);
  res.json({ ok: true, killed: killed, stream_ids: ids });
});

router.get('/fanout-status', requireAuth, function(req, res) {
  var isAdmin = req.user.role === 'admin';
  var streamId = req.query.stream_id;
  if (streamId) {
    var entry = activeFanouts[streamId];
    if (entry) {
      if (!isAdmin && entry.ownerId !== req.user.id) {
        return res.status(403).json({ ok: false, error: 'forbidden' });
      }
      res.json({ ok: true, active: true, stream_id: streamId, destinations: entry.destCount, restarts: entry.restarts, uptime_ms: Date.now() - entry.startedAt });
    } else {
      res.json({ ok: true, active: false, stream_id: streamId });
    }
  } else {
    if (!isAdmin) return res.status(403).json({ ok: false, error: 'admin only' });
    var active = Object.keys(activeFanouts).map(function(id) {
      var e = activeFanouts[id];
      return { stream_id: id, destinations: e.destCount, restarts: e.restarts, uptime_ms: Date.now() - e.startedAt };
    });
    res.json({ ok: true, active_streams: active, count: active.length });
  }
});

module.exports = router;

