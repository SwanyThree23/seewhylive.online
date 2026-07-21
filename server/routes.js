'use strict';

var express = require('express');
var router = express.Router();
var uuidv4 = require('uuid').v4;
var Database = require('better-sqlite3');
var jwt = require('jsonwebtoken');

// ─── Revenue split constants (immutable) ──────────────────────────────────────
var CREATOR  = 0.90;
var PLATFORM = 0.10;

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
var _notificationPrefs = {};
var _pushSubscriptions = {};

// ─── AURA routes ──────────────────────────────────────────────────────────────

router.get('/aura/usage', function(req, res) {
  try {
    var streamId = req.query.streamId || req.body.streamId || '';
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
    return res.json({ success: false, error: err.message });
  }
});

router.post('/aura/mode', function(req, res) {
  try {
    var mode = req.body.mode || 'hype';
    if (aura) {
      aura.setMode(mode);
    }
    return res.json({ mode: mode, success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.post('/aura/trigger', function(req, res) {
  try {
    var type = req.body.type || '';
    var streamId = req.body.streamId || '';
    var mode = req.body.mode || 'hype';
    var data = req.body.data || {};

    if (!aura) {
      return res.json({ success: true, text: '[AURA offline -- set ANTHROPIC_API_KEY]', mode: 'hype' });
    }

    var triggerFn = null;

    if (type === 'stream_start') {
      triggerFn = function(cb) {
        aura.triggerStreamStart(streamId, data.streamTitle || 'SeeWhy LIVE', data.viewerCount || 0, cb);
      };
    } else if (type === 'tip_received') {
      triggerFn = function(cb) {
        aura.triggerTip(streamId, data.viewerName || 'Viewer', data.amountCents || 500, data.note || '', cb);
      };
    } else if (type === 'gift_received') {
      triggerFn = function(cb) {
        aura.triggerGift(streamId, data.viewerName || 'Viewer', data.giftName || 'Gift', data.amountCents || 100, cb);
      };
    } else if (type === 'new_viewer') {
      triggerFn = function(cb) {
        aura.triggerNewViewer(streamId, data.viewerName || 'Viewer', data.isReturning || false, cb);
      };
    } else if (type === 'stream_end') {
      triggerFn = function(cb) {
        aura.triggerStreamEnd(streamId, data.peakViewers || 0, data.totalEarningsCents || 0, cb);
      };
    }

    if (!triggerFn) {
      return res.json({ success: false, error: 'Unknown trigger type: ' + type });
    }

    triggerFn(function(err, text) {
      res.json({ success: true, text: text || 'AURA response', mode: mode });
    });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// ─── SEARCH routes ────────────────────────────────────────────────────────────

router.get('/search', function(req, res) {
  try {
    var q = req.query.q || '';
    var type = req.query.type || 'all';
    var limit = parseInt(req.query.limit || '20', 10);
    if (search) {
      var data = search.search(q, type, limit);
      return res.json({ results: data, total: data.length });
    }
    return res.json({ results: [], total: 0 });
  } catch (err) {
    return res.json({ success: false, error: err.message });
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
    return res.json({ success: false, error: err.message });
  }
});

// ─── ANALYTICS routes ─────────────────────────────────────────────────────────

router.get('/creator/analytics', function(req, res) {
  try {
    var creatorId = req.headers['x-creator-id'] || 'default';
    var period = req.query.period || 'month';
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
    return res.json({ success: false, error: err.message });
  }
});

router.get('/admin/metrics', function(req, res) {
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
    return res.json({ success: false, error: err.message });
  }
});

// ─── MODERATION routes ────────────────────────────────────────────────────────

router.get('/moderation/word-filters', function(req, res) {
  try {
    var creatorId = req.query.creatorId || 'default';
    if (moderation) {
      return res.json({ filters: moderation.getWordFilters(creatorId) });
    }
    return res.json({ filters: [] });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.post('/moderation/word-filters', function(req, res) {
  try {
    var word = req.body.word || '';
    var creatorId = req.body.creatorId || 'default';
    if (!word) {
      return res.json({ success: false, error: 'word is required' });
    }
    if (moderation) {
      var filter = moderation.addWordFilter(creatorId, word);
      return res.json({ filter: filter, success: true });
    }
    return res.json({ success: false, error: 'moderation module unavailable' });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.delete('/moderation/word-filters/:word', function(req, res) {
  try {
    var creatorId = req.query.creatorId || 'default';
    if (moderation) {
      moderation.removeWordFilter(creatorId, req.params.word);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.post('/moderation/subscriber-only', function(req, res) {
  try {
    var roomId = req.body.roomId || '';
    var creatorId = req.body.creatorId || 'default';
    var enabled = req.body.enabled || false;
    if (moderation) {
      moderation.setSubscriberOnly(roomId, creatorId, enabled);
    }
    return res.json({ success: true, enabled: enabled });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.post('/moderation/ban', function(req, res) {
  try {
    var creatorId = req.body.creatorId || 'default';
    var bannedUserId = req.body.bannedUserId || '';
    var bannedUsername = req.body.bannedUsername || '';
    var reason = req.body.reason || '';
    if (moderation) {
      var ban = moderation.banUser(creatorId, bannedUserId, bannedUsername, reason);
      return res.json({ success: true, ban: ban });
    }
    return res.json({ success: false, error: 'moderation module unavailable' });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.delete('/moderation/ban/:userId', function(req, res) {
  try {
    var creatorId = req.query.creatorId || 'default';
    if (moderation) {
      moderation.unbanUser(creatorId, req.params.userId);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.get('/moderation/bans', function(req, res) {
  try {
    var creatorId = req.query.creatorId || 'default';
    if (moderation) {
      return res.json({ bans: moderation.getBannedUsers(creatorId) });
    }
    return res.json({ bans: [] });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.post('/moderation/shadow-ban', function(req, res) {
  try {
    var userId = req.body.userId || '';
    var reason = req.body.reason || '';
    var bannedBy = req.body.bannedBy || 'system';
    if (moderation) {
      moderation.shadowBanUser(userId, reason, bannedBy);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// ─── STRIPE / PAYMENT routes ──────────────────────────────────────────────────

router.get('/creator/onboard/status', function(req, res) {
  try {
    return res.json({
      connected: !!(process.env.STRIPE_SECRET_KEY),
      accountId: null
    });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.get('/creator/onboard/link', function(req, res) {
  try {
    if (stripe) {
      stripe.createConnectAccount('creator@seewhylive.online')
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
    return res.json({ success: false, error: err.message });
  }
});

router.post('/payments/tip', function(req, res) {
  try {
    var streamId = req.body.streamId || '';
    var amountCents = req.body.amountCents || 0;
    var note = req.body.note || '';
    var fromUserId = req.body.fromUserId || 'anon';
    var creatorStripeAccountId = req.body.creatorStripeAccountId || '';

    if (!amountCents || Math.floor(amountCents) < 50) {
      return res.status(400).json({ success: false, error: 'Minimum tip amount is 50 cents' });
    }

    var amtCents = Math.floor(amountCents);
    var creatorCents = Math.floor(amtCents * CREATOR);
    var platformCents = amtCents - creatorCents;

    if (stripe && creatorStripeAccountId) {
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
          res.json({ success: false, error: err.message });
        });
      return;
    }

    if (analytics) {
      try {
        analytics.recordEarning(streamId, fromUserId, 'tip', amtCents, creatorCents, platformCents, note);
      } catch (e) { /* ignore analytics error */ }
    }

    return res.json({
      success: true,
      clientSecret: null,
      amountCents: amtCents,
      creatorCents: creatorCents,
      platformCents: platformCents
    });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.post('/payments/payout', function(req, res) {
  try {
    var creatorId = req.body.creatorId || 'default';
    var amountCents = req.body.amountCents || 0;

    if (Math.floor(amountCents) < 1000) {
      return res.status(400).json({ success: false, error: 'Minimum payout is $10.00' });
    }

    var flooredCents = Math.floor(amountCents);
    return res.json({
      success: true,
      amountCents: flooredCents,
      message: 'Payout of $' + (flooredCents / 100).toFixed(2) + ' initiated'
    });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.post('/payments/subscribe', function(req, res) {
  try {
    var subscriberId = req.body.subscriberId || 'anon';
    var creatorId = req.body.creatorId || 'default';
    var tier = req.body.tier || 'fan';
    var amountCents = req.body.amountCents || 0;
    var id = uuidv4();

    if (moderation) {
      try {
        moderation.addSubscription(id, subscriberId, creatorId, tier, Math.floor(amountCents), null);
      } catch (e) { /* ignore moderation error */ }
    }

    return res.json({ success: true, tier: tier, id: id });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// ─── USER routes ──────────────────────────────────────────────────────────────

router.get('/users/:username', function(req, res) {
  try {
    var username = req.params.username;
    var profile = _userProfiles[username] || null;
    if (profile) {
      return res.json(profile);
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
    return res.json({ success: false, error: err.message });
  }
});

router.get('/users/me', function(req, res) {
  try {
    var profile = _userProfiles['default'] || {};
    return res.json({
      username: profile.username || 'SwanyThree',
      displayName: profile.displayName || 'SwanyThree',
      bio: profile.bio || 'SeeWhy LIVE creator · Washington Classic host',
      avatarEmoji: profile.avatarEmoji || '👑',
      tier: 'pro',
      isLive: false
    });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.put('/users/me', function(req, res) {
  try {
    var displayName = req.body.displayName || '';
    var bio = req.body.bio || '';
    var avatarEmoji = req.body.avatarEmoji || '';
    _userProfiles['default'] = {
      displayName: displayName,
      bio: bio,
      avatarEmoji: avatarEmoji
    };
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.get('/users/me/earnings', function(req, res) {
  try {
    return res.json({ availableCents: 0, totalEarnedCents: 0, pendingCents: 0 });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// ─── NOTIFICATION routes ──────────────────────────────────────────────────────

router.post('/push/subscribe', function(req, res) {
  try {
    var userId = req.body.userId || 'default';
    var subscription = req.body.subscription || {};
    _pushSubscriptions[userId] = subscription;
    if (notifications) {
      try {
        notifications.subscribeToNotifications(userId, subscription);
      } catch (e) { /* ignore notifications error */ }
    }
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.post('/users/me/notifications', function(req, res) {
  try {
    var prefKey = req.body.userId || 'default';
    _notificationPrefs[prefKey] = {
      notifyNewStream: req.body.notifyNewStream || false,
      notifyTip: req.body.notifyTip || false,
      notifySubscriber: req.body.notifySubscriber || false,
      notifyEmailDigest: req.body.notifyEmailDigest || false
    };
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// ─── METRICS / LEADERBOARD routes ────────────────────────────────────────────

router.get('/metrics', function(req, res) {
  try {
    var roomId = req.query.roomId || 'default';
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
    return res.json({ success: false, error: err.message });
  }
});

router.get('/leaderboard', function(req, res) {
  try {
    var limit = parseInt(req.query.limit || '20', 10);
    if (analytics && analytics.getTopCreators) {
      var top = analytics.getTopCreators(limit);
      return res.json({ leaderboard: top, updatedAt: Date.now() });
    }
    return res.json({ leaderboard: [], updatedAt: Date.now() });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// ─── PPV routes ───────────────────────────────────────────────────────────────

var _ppvTokens = {};

router.post('/ppv/create', function(req, res) {
  try {
    var streamId = req.body.streamId || 'default';
    var priceCents = Math.floor(req.body.priceCents || 499);
    var token = require('crypto').randomBytes(16).toString('hex');
    var expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    _ppvTokens[token] = { streamId: streamId, priceCents: priceCents, expiresAt: expiresAt };
    return res.json({ token: token, priceCents: priceCents, expiresAt: expiresAt });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.post('/ppv/verify', function(req, res) {
  try {
    var token = req.body.token || '';
    var streamId = req.body.streamId || '';
    var entry = _ppvTokens[token];
    if (!entry) {
      return res.json({ valid: false, error: 'Invalid or expired PPV token' });
    }
    if (Date.now() > entry.expiresAt) {
      delete _ppvTokens[token];
      return res.json({ valid: false, error: 'PPV token expired' });
    }
    if (entry.streamId !== streamId && streamId) {
      return res.json({ valid: false, error: 'Token not valid for this stream' });
    }
    return res.json({ valid: true, streamId: entry.streamId, priceCents: entry.priceCents });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// ─── N8N / AUTOMATION routes ──────────────────────────────────────────────────

router.post('/n8n/test', function(req, res) {
  try {
    var webhookUrl = req.body.webhookUrl || '';
    var payload = req.body.payload || { test: true, source: 'seewhy-live', ts: Date.now() };
    if (!webhookUrl) {
      return res.json({ success: false, error: 'webhookUrl is required' });
    }
    var https = require('https');
    var http = require('http');
    var url = require('url');
    var parsed = url.parse(webhookUrl);
    var isHttps = parsed.protocol === 'https:';
    var bodyStr = JSON.stringify(payload);
    var options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) }
    };
    var reqLib = isHttps ? https : http;
    var outReq = reqLib.request(options, function(outRes) {
      return res.json({ success: true, statusCode: outRes.statusCode, webhookUrl: webhookUrl });
    });
    outReq.on('error', function(e) {
      return res.json({ success: false, error: e.message });
    });
    outReq.write(bodyStr);
    outReq.end();
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});


// ── STREAM SYNC → Supabase ────────────────────────────────────
var SUPA_URL = 'https://rxlgywvfclyjdfyvfvyc.supabase.co';
var SUPA_KEY = process.env.SUPABASE_SERVICE_KEY || '';

router.post('/stream-sync', async function(req, res) {
  try {
    var b = req.body;
    var creatorId = b.creator_id;
    // If not a UUID, look up by username
    if (creatorId && !creatorId.match(/^[0-9a-f-]{36}$/i)) {
      var uResp = await fetch(SUPA_URL + '/rest/v1/users?username=eq.' + encodeURIComponent(creatorId) + '&select=id&limit=1', {
        headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }
      });
      var uData = await uResp.json();
      if (uData && uData[0] && uData[0].id) { creatorId = uData[0].id; }
      else { creatorId = null; }
      // fallback: hardcoded known users
      if (!creatorId && b.creator_id === 'swanythree23') { creatorId = 'fa691550-9019-4f89-8a25-b1f88c10ac9e'; }
    }
    var payload = { title: b.title, status: b.status || 'live', viewer_count: b.viewer_count || 0, started_at: new Date().toISOString(), category: b.category || 'live', is_live: true, host_user_id: creatorId || null };
    if (creatorId) payload.creator_id = creatorId;
    var resp = await fetch(SUPA_URL + '/rest/v1/streams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY, 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });
    var data = await resp.json();
    res.json({ ok: true, stream: data });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/stream-end', async function(req, res) {
  try {
    var stream_id = req.body.stream_id;
    await fetch(SUPA_URL + '/rest/v1/streams?id=eq.' + stream_id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY },
      body: JSON.stringify({ status: 'ended', ended_at: new Date().toISOString() })
    });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});


// ── VAULT PRO KEY ENDPOINTS ───────────────────────────────────
// /vault/save-key  — client posts plaintext key once; server encrypts and stores
// /vault/key-exists — client can check presence without getting the raw key
// /vault/delete-key — remove stored key when destination is deleted

router.post('/vault/save-key', function(req, res) {
  if (!vault) return res.status(501).json({ ok: false, error: 'Vault not available on this server' });
  try {
    var guestId = req.body.guest_id;
    var destId  = req.body.dest_id;
    var plainKey = req.body.plain_key;
    if (!guestId || !destId || !plainKey) {
      return res.status(400).json({ ok: false, error: 'guest_id, dest_id, plain_key are required' });
    }
    vault.saveKey(guestId, destId, plainKey);
    res.json({ ok: true, stored: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/vault/key-exists', function(req, res) {
  if (!vault) return res.json({ ok: true, exists: false });
  try {
    var exists = vault.hasKey(req.query.guest_id || '', req.query.dest_id || '');
    res.json({ ok: true, exists: exists });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/vault/delete-key', function(req, res) {
  if (!vault) return res.json({ ok: true });
  try {
    vault.deleteKey(req.body.guest_id || '', req.body.dest_id || '');
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/vault/key-meta', function(req, res) {
  if (!vault) return res.json({ ok: true, keys: [] });
  try {
    var meta = vault.listGuestKeyMeta(req.query.guest_id || '');
    res.json({ ok: true, keys: meta });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── RTMP FANOUT ENGINE ────────────────────────────────────────
// Each guest gets their own isolated FFmpeg process (failure isolation).
// Keys are resolved from Vault Pro; plaintext keys in body are only a fallback.
// Transmuxing only: -c copy (no re-encoding), <2s startup latency.

var { spawn } = require('child_process');

// Map of streamId → { process, restarts, destCount, startedAt }
var activeFanouts = {};
var MAX_RESTARTS = 3;
var RESTART_DELAY_MS = 5000;

function buildFfmpegArgs(ingestUrl, resolvedDests) {
  var args = ['-re', '-i', ingestUrl, '-loglevel', 'warning'];
  resolvedDests.forEach(function(d) {
    // transmux only — no re-encoding
    args.push('-c', 'copy', '-f', 'flv', d.url + d.key);
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

router.post('/fanout-start', async function(req, res) {
  try {
    var b = req.body;
    var streamId = b.stream_id || 'default';
    var guestId  = b.guest_id  || streamId;
    var ingestUrl = 'rtmp://localhost:1935/live/' + (b.room_id || b.stream_key || 'stream');
    var destinations = b.destinations || [];

    // Stop any existing fanout for this stream
    if (activeFanouts[streamId] && activeFanouts[streamId].process) {
      activeFanouts[streamId].process.kill('SIGTERM');
      delete activeFanouts[streamId];
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
      resolvedDests.push({ url: d.url, key: resolvedKey, label: d.label || d.platform || 'custom' });
    }

    if (resolvedDests.length === 0) {
      return res.json({ ok: false, error: 'No enabled destinations with resolvable keys' });
    }

    spawnFanout(streamId, ingestUrl, resolvedDests, 0);
    console.log('[fanout:%s] started → %d destinations (guest=%s)', streamId, resolvedDests.length, guestId);
    res.json({ ok: true, stream_id: streamId, destinations: resolvedDests.length });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/fanout-stop', function(req, res) {
  var streamId = req.body.stream_id || 'default';
  var entry = activeFanouts[streamId];
  if (entry && entry.process) {
    entry.process.kill('SIGTERM');
    delete activeFanouts[streamId];
    res.json({ ok: true, stopped: streamId });
  } else {
    res.json({ ok: false, error: 'No active fanout for ' + streamId });
  }
});

router.get('/fanout-status', function(req, res) {
  var streamId = req.query.stream_id;
  if (streamId) {
    var entry = activeFanouts[streamId];
    if (entry) {
      res.json({ ok: true, active: true, stream_id: streamId, destinations: entry.destCount, restarts: entry.restarts, uptime_ms: Date.now() - entry.startedAt });
    } else {
      res.json({ ok: true, active: false, stream_id: streamId });
    }
  } else {
    var active = Object.keys(activeFanouts).map(function(id) {
      var e = activeFanouts[id];
      return { stream_id: id, destinations: e.destCount, restarts: e.restarts, uptime_ms: Date.now() - e.startedAt };
    });
    res.json({ ok: true, active_streams: active, count: active.length });
  }
});

module.exports = router;

