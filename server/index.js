const battleRoutes = require('./routes/battles');
const rewardsRoutes = require('./routes/rewards');
const publicPreviewRoutes = require('./routes/publicPreview');
const { registerBattleHandlers } = require('./socket/battleHandlers');
'use strict';

/**
 * index.js - SeeWhy LIVE v33.0 main server entry point
 * Express + Socket.io + mediasoup SFU + Stripe + SwanyBot
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

var express       = require('express');
var { createServer } = require('http');
var { Server }    = require('socket.io');
var helmet        = require('helmet');
var cors          = require('cors');
var { rateLimit } = require('express-rate-limit');
var xssClean      = require('xss-clean');
var jwt           = require('jsonwebtoken');
var { v4: uuidv4 } = require('uuid');
var crypto        = require('crypto');
var Database      = require('better-sqlite3');
var winston       = require('winston');
require('winston-daily-rotate-file');

var webpush = null;
try {
  webpush = require('web-push');
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails('mailto:admin@seewhylive.online', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  } else {
    webpush = null;
  }
} catch(wpErr) {
  console.warn('[push] web-push not loaded: ' + wpErr.message);
}

var mediasoup    = require('./mediasoup');
var rtmp         = require('./rtmp');
var vault        = require('./vault');
var stripeModule = require('./stripe');
var SwanyBot     = require('./swanybot');
var translation  = require('./translation');
var aura         = require('./aura');
var whisper      = require('./whisper');
var analytics    = require('./analytics');

// ─── Revenue split constants (immutable) ─────────────────────────────────
var CREATOR  = 0.90;
var PLATFORM = 0.10; // eslint-disable-line no-unused-vars

// ─── Logger ───────────────────────────────────────────────────────────────
var logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.DailyRotateFile({
      dirname:       '/var/log/seewhy',
      filename:      'seewhy-%DATE%.log',
      datePattern:   'YYYY-MM-DD',
      maxFiles:      '14d',
      maxSize:       '100m',
      zippedArchive: true
    })
  ]
});

// ─── Database ─────────────────────────────────────────────────────────────
var DB_PATH = process.env.DB_PATH || '/opt/seewhy/data/seewhy.db';
var db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    room_id     TEXT    PRIMARY KEY,
    host_id     TEXT    NOT NULL,
    created_at  INTEGER,
    ended_at    INTEGER
  );

  CREATE TABLE IF NOT EXISTS stream_keys (
    guest_id      TEXT    NOT NULL,
    dest_id       TEXT    NOT NULL,
    encrypted_key TEXT    NOT NULL,
    created_at    INTEGER NOT NULL,
    PRIMARY KEY (guest_id, dest_id)
  );

  CREATE TABLE IF NOT EXISTS ppv_unlocks (
    id                TEXT    PRIMARY KEY,
    room_id           TEXT    NOT NULL,
    viewer_id         TEXT    NOT NULL,
    payment_intent_id TEXT    NOT NULL UNIQUE,
    amount_cents      INTEGER NOT NULL,
    creator_cents     INTEGER NOT NULL,
    platform_cents    INTEGER NOT NULL,
    status            TEXT    NOT NULL DEFAULT 'pending',
    created_at        INTEGER NOT NULL,
    completed_at      INTEGER
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id          TEXT    PRIMARY KEY,
    room_id     TEXT    NOT NULL,
    user_id     TEXT    NOT NULL,
    username    TEXT    NOT NULL,
    message     TEXT    NOT NULL,
    translated  TEXT,
    lang        TEXT,
    ts          INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gifts (
    id              TEXT    PRIMARY KEY,
    room_id         TEXT    NOT NULL,
    from_user       TEXT    NOT NULL,
    emoji           TEXT,
    name            TEXT,
    value_cents     INTEGER NOT NULL,
    creator_cents   INTEGER NOT NULL,
    platform_cents  INTEGER NOT NULL,
    ts              INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id            TEXT    PRIMARY KEY,
    user_id       TEXT,
    action        TEXT    NOT NULL,
    resource_type TEXT,
    resource_id   TEXT,
    metadata      TEXT,
    ip_address    TEXT,
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_profiles (
    user_id              TEXT    PRIMARY KEY,
    username             TEXT    UNIQUE,
    display_name         TEXT,
    bio                  TEXT,
    avatar_emoji         TEXT    DEFAULT '🎭',
    tier                 TEXT    DEFAULT 'free',
    stripe_account_id    TEXT,
    follower_count       INTEGER DEFAULT 0,
    total_earnings_cents INTEGER DEFAULT 0,
    created_at           INTEGER NOT NULL,
    updated_at           INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS creator_tiers (
    id          TEXT    PRIMARY KEY,
    creator_id  TEXT    NOT NULL,
    tier_name   TEXT    NOT NULL CHECK(tier_name IN ('fan','supporter','ride_or_die')),
    amount_cents INTEGER NOT NULL,
    description TEXT,
    perks       TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gift_types (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    icon        TEXT    NOT NULL,
    amount_cents INTEGER NOT NULL,
    aura_message TEXT,
    sort_order  INTEGER DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS clip_markers (
    id         TEXT    PRIMARY KEY,
    room_id    TEXT    NOT NULL,
    ts         INTEGER NOT NULL,
    label      TEXT,
    marked_by  TEXT
  );

  CREATE TABLE IF NOT EXISTS super_chats (
    id              TEXT    PRIMARY KEY,
    room_id         TEXT    NOT NULL,
    user_id         TEXT    NOT NULL,
    username        TEXT    NOT NULL,
    message         TEXT    NOT NULL,
    amount_cents    INTEGER NOT NULL,
    creator_cents   INTEGER NOT NULL,
    platform_cents  INTEGER NOT NULL,
    tier_color      TEXT    NOT NULL DEFAULT '#C9A84C',
    ts              INTEGER NOT NULL
  );
`);

db.exec(`CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT UNIQUE NOT NULL,
  username TEXT,
  p256dh TEXT,
  auth TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
)`);

// Initialise vault with same db (vault.initDb() will open its own handle to the same file)
vault.initDb();

// Seed gift types if none exist
var giftCount = db.prepare('SELECT COUNT(*) as c FROM gift_types').get();
if (giftCount.c === 0) {
  var giftInsert = db.prepare('INSERT OR IGNORE INTO gift_types (id, name, icon, amount_cents, aura_message, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)');
  var seedGifts = [
    [uuidv4(), 'Rose',    '🌹',  99,   'Someone sent a Rose!',    1],
    [uuidv4(), 'Domino',  '🀱', 199,   'A Domino just dropped!',  2],
    [uuidv4(), 'Fire',    '🔥', 299,   'FIRE IN THE CHAT!',       3],
    [uuidv4(), 'Crown',   '👑', 499,   'Royalty in the building!',4],
    [uuidv4(), 'Diamond', '💎', 999,   'DIAMOND TIER!',           5],
    [uuidv4(), 'Trophy',  '🏆', 1999,  'CHAMPION STATUS!',        6]
  ];
  var seedTxn = db.transaction(function(gifts) {
    gifts.forEach(function(g) {
      giftInsert.run(g[0], g[1], g[2], g[3], g[4], g[5]);
    });
  });
  seedTxn(seedGifts);
}

// ─── Express app ──────────────────────────────────────────────────────────
var app    = express();
var server = createServer(app);
app.set('trust proxy', 1);

// Stripe webhook needs raw body - register BEFORE express.json()
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  function(req, res) {
    var sig = req.headers['stripe-signature'];
    if (!sig) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }
    stripeModule.handleStripeWebhook(req.body, sig)
      .then(function(result) {
        res.json(result);
      })
      .catch(function(err) {
        logger.error('[webhook] ' + err.message);
        res.status(400).json({ error: err.message });
      });
  }
);

app.use(helmet());
var _corsOrigins = (process.env.FRONTEND_ORIGIN || '*').split(',').map(function(s) { return s.trim(); });
var _corsOrigin  = _corsOrigins.length === 1 ? _corsOrigins[0] : _corsOrigins;
app.use(cors({ origin: _corsOrigin }));

/* Global rate limit — generous for a live streaming app */
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skip: function(req) { return req.path === '/api/health' || req.path.startsWith('/socket.io'); }
}));

/* AI endpoint — tighter limit to protect Anthropic API key costs */
var aiRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many AI requests — please wait before trying again.' }
});
app.use('/api/ai', aiRateLimit);
app.use('/api/battles', battleRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/', publicPreviewRoutes);

app.use(express.json({ limit: '2mb' }));
var n8nRouter = require('./n8nWebhooks');
app.use('/api/n8n', n8nRouter);
app.use(xssClean());

// ─── Socket.io ────────────────────────────────────────────────────────────
var io = new Server(server, {
  cors: {
    origin: _corsOrigin,
    methods: ['GET', 'POST']
  },
  pingTimeout:        45000,
  pingInterval:       20000,
  maxHttpBufferSize:  1e6,
  connectionStateRecovery: {
    maxDisconnectionDuration: 120000,
    skipMiddlewares: true
  }
});

// ─── SwanyBot instance ────────────────────────────────────────────────────
var swanybot = new SwanyBot(io);

// Wire SwanyBot poll/clip EventEmitter events (after io and polls are defined)
swanybot.on('poll-request', function(roomId, data) {
  var id   = uuidv4();
  var opts = data.options.map(function(t) { return { text: t, votes: new Set() }; });
  var poll = { id: id, question: data.question, options: opts, createdAt: Date.now(), active: true };
  polls.set(roomId, poll);
  io.to(roomId).emit('poll-update', serializePoll(poll));
  io.to(roomId).emit('bot-log', { event: 'poll_created', message: 'Poll: ' + data.question, ts: Date.now() });
  poll.autoEndT = setTimeout(function() {
    if (polls.get(roomId) !== poll) return;
    poll.active = false;
    io.to(roomId).emit('poll-update', serializePoll(poll));
    setTimeout(function() { if (polls.get(roomId) === poll) polls.delete(roomId); }, 5000);
  }, 120000);
});

swanybot.on('poll-end-request', function(roomId) {
  var poll = polls.get(roomId);
  if (!poll || !poll.active) return;
  poll.active = false;
  if (poll.autoEndT) clearTimeout(poll.autoEndT);
  io.to(roomId).emit('poll-update', serializePoll(poll));
  setTimeout(function() { if (polls.get(roomId) === poll) polls.delete(roomId); }, 5000);
});

swanybot.on('poll-vote-cmd', function(roomId, socketId, optIdx) {
  var poll = polls.get(roomId);
  if (!poll || !poll.active) return;
  if (optIdx < 0 || optIdx >= poll.options.length) return;
  poll.options.forEach(function(o) { o.votes.delete(socketId); });
  poll.options[optIdx].votes.add(socketId);
  io.to(roomId).emit('poll-update', serializePoll(poll));
});

// ─── Room state ───────────────────────────────────────────────────────────
// roomId → { viewers: Set<socketId>, guests: Map<socketId, {guestId, username, role}>,
//            hostSocketId: string|null, hostUserId: string|null,
//            watchParty: { videoId, url, playing, position, ts } | null,
//            presence: Map<socketId, lastSeenTs> }
var rooms = new Map();

// Per-room tracking for AURA auto-triggers
var peakViewers    = new Map();  // roomId → peak viewer count this session
var milestonesSeen = new Map();  // roomId → Set of milestone numbers already fired
var sessionRevenue = new Map();  // roomId → cumulative gift cents this session
var polls               = new Map();  // roomId → { id, question, options:[{text,votes:Set}], createdAt, autoEndT, active }
var qaQueues            = new Map();  // roomId → Map<id, { id, username, text, upvotes, ts }>
var vsPolls             = new Map();  // roomId → { id, sideA, sideB, votesA:Set, votesB:Set, active, createdAt, autoEndT }
var judgeRosters        = new Map();  // roomId → Map<userId, { userId, username, scores:[] }>
var chatReactions       = new Map();  // roomId → Map<msgId, Map<emoji, Set<socketId>>>
var viewerReactThrottle = new Map();  // socketId → lastReactTs ms (2s per-socket throttle)
var pkVotes             = new Map();  // roomId → { challenger: n, defender: n }
var roomAnalytics       = new Map();  // roomId → { viewerHistory:[], msgCounts:{}, sessionEarnings:0, peak:0 }
var activePolls         = new Map();  // roomId → { id, question, options, votes:{}, totalVotes, endsAt, timer }
var stageRooms          = new Map();  // roomId → { speakers:[], listeners:[] }
var loveCounts          = new Map();  // roomId → total love count
var loveEarnings        = new Map();  // roomId → { creator: microcents, platform: microcents }
var giftLeaderboards    = new Map();  // roomId → [{username, totalCents}] top 10
var triviaRooms         = new Map();  // roomId → { question, options:[{text}], answers:Map<socketId,idx>, correctIdx, timer, active }

var REVENUE_MILESTONES_CENTS = [1000, 2500, 5000, 10000, 25000, 50000]; // $10,$25,$50,$100,$250,$500

function getAnalytics(roomId) {
  if (!roomAnalytics.has(roomId)) {
    roomAnalytics.set(roomId, { viewerHistory: [], msgCounts: {}, sessionEarnings: 0, peak: 0 });
  }
  return roomAnalytics.get(roomId);
}

function endTrivia(roomId) {
  var trivia = triviaRooms.get(roomId);
  if (!trivia) return;
  if (trivia.timer) { clearTimeout(trivia.timer); trivia.timer = null; }
  trivia.active = false;
  var tally = trivia.options.map(function(_, i) { return 0; });
  var correct = [];
  var wrong   = [];
  trivia.answers.forEach(function(entry) {
    if (entry.idx >= 0 && entry.idx < tally.length) tally[entry.idx]++;
    if (entry.idx === trivia.correctIdx) {
      correct.push(entry.username);
    } else {
      wrong.push(entry.username);
    }
  });
  var results = {
    roomId:     roomId,
    question:   trivia.question,
    options:    trivia.options.map(function(o, i) { return { text: o.text, votes: tally[i] }; }),
    correctIdx: trivia.correctIdx,
    correct:    correct.slice(0, 20),
    wrong:      wrong.slice(0, 20),
    total:      trivia.answers.size
  };
  io.to(roomId).emit('trivia-results', results);
  triviaRooms.delete(roomId);
}

// Helper: serialize a poll (Set<socketId> votes → plain counts)
function serializePoll(poll) {
  var total = 0;
  var opts = poll.options.map(function(o) {
    total += o.votes.size;
    return { text: o.text, votes: o.votes.size };
  });
  return { id: poll.id, question: poll.question, options: opts, totalVotes: total, active: poll.active, createdAt: poll.createdAt };
}

// Helper: serialize a VS poll
function serializeVs(vp) {
  var a = vp.votesA.size;
  var b = vp.votesB.size;
  var total = a + b;
  return {
    id: vp.id, sideA: vp.sideA, sideB: vp.sideB,
    votesA: a, votesB: b, totalVotes: total,
    pctA: total > 0 ? Math.floor(a / total * 100) : 50,
    pctB: total > 0 ? Math.floor(b / total * 100) : 50,
    active: vp.active, endsAt: vp.endsAt, createdAt: vp.createdAt
  };
}

// Helper: serialize judge roster for a room
function serializeJudges(roomId) {
  var roster = judgeRosters.get(roomId);
  if (!roster) return [];
  var out = [];
  roster.forEach(function(j) {
    var total = j.scores.reduce(function(s, x) { return s + x.score; }, 0);
    var avg   = j.scores.length > 0 ? total / j.scores.length : null;
    out.push({
      userId:     j.userId,
      username:   j.username,
      scoreCount: j.scores.length,
      avgScore:   avg !== null ? Math.round(avg * 10) / 10 : null,
      lastScore:  j.scores.length > 0 ? j.scores[j.scores.length - 1] : null
    });
  });
  return out;
}

function getJoinStateForRoom(roomId) {
  var state = { chatHistory: [], activePoll: null, activeVsPoll: null, judges: [], sessionRevenueCents: 0 };
  try {
    var rows = db.prepare(
      'SELECT id, username, message, translated, lang, ts FROM chat_history WHERE room_id = ? ORDER BY ts DESC LIMIT 50'
    ).all(roomId);
    state.chatHistory = rows.reverse();
  } catch(e) { logger.warn('[getJoinState] chat: ' + e.message); }
  var poll = polls.get(roomId);
  if (poll && poll.active) state.activePoll = serializePoll(poll);
  var vp = vsPolls.get(roomId);
  if (vp && vp.active) state.activeVsPoll = serializeVs(vp);
  state.judges = serializeJudges(roomId);
  state.sessionRevenueCents = sessionRevenue.get(roomId) || 0;
  return state;
}

// Helper: auto-trigger AURA and broadcast to room
function autoAura(roomId, triggerFn) {
  try {
    triggerFn(function(err, text) {
      if (err || !text) return;
      io.to(roomId).emit('aura-message', { text: text, mode: aura.getMode(), ts: Math.floor(Date.now() / 1000), auto: true });
    });
  } catch(e) {
    logger.warn('[autoAura] ' + e.message);
  }
}

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      viewers:      new Set(),
      guests:       new Map(),
      hostSocketId: null,
      hostUserId:   null,
      watchParty:   null,
      presence:     new Map()
    });
  }
  return rooms.get(roomId);
}

// ─── Presence cleanup — evict sockets unseen for >90s ─────────────────────
setInterval(function() {
  var now = Date.now();
  rooms.forEach(function(room, roomId) {
    room.presence.forEach(function(lastSeen, sid) {
      if (now - lastSeen > 90000) {
        room.presence.delete(sid);
        // Only clean up if the socket is not actually connected
        if (!io.sockets.sockets.has(sid)) {
          room.viewers.delete(sid);
          room.guests.delete(sid);
        }
      }
    });
    // Emit refreshed viewer count after cleanup
    var count = room.viewers.size + room.guests.size;
    if (count >= 0) {
      io.to(roomId).emit('viewer-count', { count: count });
    }
  });
}, 60000);

// ─── REST API Routes ──────────────────────────────────────────────────────

// GET /api/health
app.get('/api/health', function(req, res) {
  var mem = process.memoryUsage();
  var dbOk = true;
  try { db.prepare('SELECT 1').get(); } catch(e) { dbOk = false; }
  res.json({
    status:           'ok',
    version:          'v33.0',
    timestamp:        Date.now(),
    uptimeSeconds:    Math.floor(process.uptime()),
    rooms:            rooms.size,
    connections:      io.engine.clientsCount,
    mediasoupWorkers: mediasoup.getWorkerCount(),
    db:               dbOk ? 'ok' : 'error',
    memoryMB: {
      rss:      Math.floor(mem.rss / 1048576),
      heap:     Math.floor(mem.heapUsed / 1048576),
      heapTotal:Math.floor(mem.heapTotal / 1048576)
    }
  });
});

// GET /api/metrics
app.get('/api/metrics', function(req, res) {
  try {
    var totalViews = db.prepare('SELECT COUNT(*) as cnt FROM chat_history').get().cnt;
    var giftsSum   = db.prepare('SELECT COALESCE(SUM(value_cents),0) as total FROM gifts').get().total;
    var revenue    = db.prepare('SELECT COALESCE(SUM(platform_cents),0) as total FROM ppv_unlocks WHERE status = ?').get('succeeded').total;
    res.json({
      totalChatMessages: totalViews,
      giftsTotalCents:   Math.floor(giftsSum),
      platformRevenueCents: Math.floor(revenue)
    });
  } catch (err) {
    logger.error('[metrics] ' + err.message);
    res.status(500).json({ error: 'Metrics query failed' });
  }
});

// POST /api/ppv/create
app.post('/api/ppv/create', function(req, res) {
  var body = req.body;
  if (!body.roomId || !body.viewerId || !body.priceUsd || !body.creatorStripeAccountId) {
    res.status(400).json({ error: 'Missing required fields: roomId, viewerId, priceUsd, creatorStripeAccountId' });
    return;
  }
  stripeModule.createPPVPaymentIntent(
    body.roomId,
    body.viewerId,
    body.priceUsd,
    body.creatorStripeAccountId
  ).then(function(result) {
    res.json(result);
  }).catch(function(err) {
    logger.error('[ppv/create] ' + err.message);
    res.status(500).json({ error: err.message });
  });
});

// POST /api/ppv/verify
app.post('/api/ppv/verify', function(req, res) {
  var body = req.body;
  if (!body.paymentIntentId || !body.roomId || !body.viewerId) {
    res.status(400).json({ error: 'Missing required fields: paymentIntentId, roomId, viewerId' });
    return;
  }
  stripeModule.verifyPPVPayment(body.paymentIntentId, body.roomId, body.viewerId)
    .then(function(result) {
      res.json(result);
    }).catch(function(err) {
      logger.error('[ppv/verify] ' + err.message);
      res.status(400).json({ error: err.message });
    });
});

// GET /api/schedule
app.get('/api/schedule', function(req, res) {
  try {
    var rows = db.prepare('SELECT * FROM schedules ORDER BY scheduled_at ASC').all();
    res.json({ events: rows });
  } catch (err) {
    res.json({ events: [] });
  }
});

// POST /api/schedule
app.post('/api/schedule', function(req, res) {
  var body = req.body;
  if (!body.title || !body.scheduled_at) {
    res.status(400).json({ error: 'title and scheduled_at required' });
    return;
  }
  try {
    db.exec('CREATE TABLE IF NOT EXISTS schedules (id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT, desc TEXT, scheduled_at INTEGER NOT NULL, created_at INTEGER NOT NULL, recurring TEXT)');
    try { db.exec('ALTER TABLE schedules ADD COLUMN recurring TEXT'); } catch(e) { /* column already exists */ }
    var id  = uuidv4();
    var now = Math.floor(Date.now() / 1000);
    db.prepare('INSERT INTO schedules (id,title,category,desc,scheduled_at,created_at,recurring) VALUES (?,?,?,?,?,?,?)')
      .run(id, String(body.title).slice(0,120), String(body.category||'').slice(0,40), String(body.desc||'').slice(0,400), Math.floor(body.scheduled_at), now, String(body.recurring||'none').slice(0,20));
    res.json({ id: id, saved: true });
  } catch (err) {
    logger.error('[schedule/post] ' + err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/schedule/:id
app.delete('/api/schedule/:id', function(req, res) {
  try {
    db.exec('CREATE TABLE IF NOT EXISTS schedules (id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT, desc TEXT, scheduled_at INTEGER NOT NULL, created_at INTEGER NOT NULL)');
    db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    logger.error('[schedule/delete] ' + err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/push/subscribe
app.post('/api/push/subscribe', function(req, res) {
  var sub = req.body.subscription;
  var username = req.body.username || 'viewer';
  if (!sub || !sub.endpoint) return res.status(400).json({ error: 'Invalid subscription' });
  var p256dh = (sub.keys && sub.keys.p256dh) ? sub.keys.p256dh : '';
  var auth   = (sub.keys && sub.keys.auth)   ? sub.keys.auth   : '';
  try {
    db.prepare('INSERT OR REPLACE INTO push_subscriptions (endpoint, username, p256dh, auth) VALUES (?, ?, ?, ?)').run(sub.endpoint, username, p256dh, auth);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/push/unsubscribe
app.post('/api/push/unsubscribe', function(req, res) {
  var endpoint = req.body.endpoint;
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });
  try {
    db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payout-history
app.get('/api/payout-history', function(req, res) {
  var roomId = req.query.roomId || null;
  var stmt;
  var rows;
  try {
    if (roomId) {
      stmt = db.prepare('SELECT date(ts, "unixepoch") as day, SUM(amount_cents) as totalCents, COUNT(*) as events FROM super_chats WHERE room_id = ? GROUP BY day ORDER BY day DESC LIMIT 30');
      rows = stmt.all(roomId);
    } else {
      stmt = db.prepare('SELECT date(ts, "unixepoch") as day, SUM(amount_cents) as totalCents, COUNT(*) as events FROM super_chats GROUP BY day ORDER BY day DESC LIMIT 30');
      rows = stmt.all();
    }
    var sessions = (rows || []).map(function(row, i) {
      return {
        id: i + 1,
        date: Math.floor(Date.now() / 1000) - i * 86400,
        label: 'Stream Session ' + (new Date(row.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        totalCents: Math.floor(row.totalCents || 0),
        superChats: row.events || 0,
        gifts: 0,
        tips: 0,
        viewers: 0,
      };
    });
    res.json({ sessions: sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/n8n/test
app.post('/api/n8n/test', function(req, res) {
  var body = req.body;
  var workflowId = String(body.workflowId || 'unknown').slice(0, 80);
  var event      = String(body.event || 'test').slice(0, 40);
  var ts         = Math.floor(body.ts || Date.now());
  logger.info('[n8n/test] workflow=' + workflowId + ' event=' + event);
  res.json({ triggered: true, workflowId: workflowId, event: event, ts: ts });
});

// GET /api/leaderboard
app.get('/api/leaderboard', function(req, res) {
  try {
    var roomId = req.query.roomId || '';
    var rows;
    if (roomId) {
      rows = db.prepare(
        'SELECT from_user, SUM(value_cents) as total, COUNT(*) as cnt FROM gifts WHERE room_id = ? GROUP BY from_user ORDER BY total DESC LIMIT 10'
      ).all(roomId);
    } else {
      rows = db.prepare(
        'SELECT from_user, SUM(value_cents) as total, COUNT(*) as cnt FROM gifts GROUP BY from_user ORDER BY total DESC LIMIT 10'
      ).all();
    }
    res.json({
      leaderboard: rows.map(function(r) {
        return {
          from_user:     r.from_user,
          total_cents:   Math.floor(r.total),
          creator_cents: Math.floor(r.total * CREATOR),
          gift_count:    r.cnt
        };
      })
    });
  } catch (err) {
    logger.error('[leaderboard] ' + err.message);
    res.status(500).json({ error: 'Leaderboard query failed' });
  }
});

// POST /api/connect/onboard
app.post('/api/connect/onboard', function(req, res) {
  var body = req.body;
  if (!body.email) {
    res.status(400).json({ error: 'Missing required field: email' });
    return;
  }
  stripeModule.createConnectAccount(body.email)
    .then(function(result) {
      res.json(result);
    }).catch(function(err) {
      logger.error('[connect/onboard] ' + err.message);
      res.status(500).json({ error: err.message });
    });
});

// POST /api/turn/credentials
app.post('/api/turn/credentials', function(req, res) {
  var body = req.body;
  if (!body.userId) {
    res.status(400).json({ error: 'Missing required field: userId' });
    return;
  }
  if (!process.env.TURN_SECRET) {
    res.status(500).json({ error: 'TURN_SECRET not configured' });
    return;
  }
  try {
    var ttl      = Math.floor(Date.now() / 1000) + 300;
    var username = ttl + ':' + body.userId;
    var hmac     = crypto.createHmac('sha256', process.env.TURN_SECRET);
    var credential = hmac.update(username).digest('base64');

    res.json({
      urls:       ['turn:2.24.194.112:3478', 'turns:2.24.194.112:5349'],
      username:   username,
      credential: credential
    });
  } catch (err) {
    logger.error('[turn/credentials] ' + err.message);
    res.status(500).json({ error: 'TURN credential generation failed' });
  }
});

// POST /api/keys/save
app.post('/api/keys/save', function(req, res) {
  var body = req.body;
  if (!body.guestId || !body.destId || !body.plainKey) {
    res.status(400).json({ error: 'Missing required fields: guestId, destId, plainKey' });
    return;
  }
  try {
    vault.saveKey(body.guestId, body.destId, body.plainKey);
    res.json({ saved: true });
  } catch (err) {
    logger.error('[keys/save] ' + err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/keys/delete
app.delete('/api/keys/delete', function(req, res) {
  var body = req.body;
  if (!body.guestId || !body.destId) {
    res.status(400).json({ error: 'Missing required fields: guestId, destId' });
    return;
  }
  try {
    vault.deleteKey(body.guestId, body.destId);
    res.json({ deleted: true });
  } catch (err) {
    logger.error('[keys/delete] ' + err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/keys/meta/:guestId
app.get('/api/keys/meta/:guestId', function(req, res) {
  try {
    var meta = vault.listGuestKeyMeta(req.params.guestId);
    res.json(meta);
  } catch (err) {
    logger.error('[keys/meta] ' + err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── AI Chat proxy ───────────────────────────────────────────────────────
app.post('/api/ai/chat', function(req, res) {
  var body    = req.body;
  var system  = typeof body.system  === 'string' ? body.system.slice(0, 2000) : '';
  var message = typeof body.message === 'string' ? body.message.slice(0, 1000) : '';
  if (!message) { res.status(400).json({ error: 'message required' }); return; }
  var client = require('./llm').getClient();
  client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 512,
    system: system || 'You are a helpful assistant for SeeWhy LIVE.',
    messages: [{ role: 'user', content: message }]
  }).then(function(r) {
    var text = r.content && r.content[0] && r.content[0].text ? r.content[0].text : '';
    res.json({ text: text });
  }).catch(function(err) {
    logger.error('[ai/chat] ' + err.message);
    res.status(500).json({ error: 'AI error: ' + err.message });
  });
});

// ─── On-demand translation endpoint ──────────────────────────────────────
var VALID_TRANSLATE_LANGS = ['EN','ES','PT','FR','DE','JA','ZH','KO','AR','RU','HI','IT','NL','PL','TR','VI'];

app.post('/api/translate', function(req, res) {
  var body       = req.body;
  var text       = typeof body.text === 'string' ? body.text.slice(0, 500) : '';
  var targetLang = typeof body.targetLang === 'string' ? body.targetLang.slice(0, 5).toUpperCase() : 'EN';

  if (!text) { res.status(400).json({ error: 'text required' }); return; }
  if (VALID_TRANSLATE_LANGS.indexOf(targetLang) === -1) {
    res.status(400).json({ error: 'unsupported targetLang' });
    return;
  }

  translation.translateTo(text, targetLang)
    .then(function(result) { res.json(result); })
    .catch(function(err) {
      logger.error('[/api/translate] ' + err.message);
      res.status(500).json({ error: err.message });
    });
});

// ─── Live Streams — active ingest + fanout status ────────────────────────
// ─── AI Chat Summary ─────────────────────────────────────────────────────
app.post('/api/summarize-chat', function(req, res) {
  var messages = typeof req.body.messages === 'string' ? req.body.messages.slice(0, 4000) : '';
  if (!messages) { res.json({ summary: 'No chat to summarize.' }); return; }
  try {
    var client = require('./llm').getClient();
    client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: 'Summarize this live stream chat in 2-3 sentences, highlighting key topics and viewer sentiment:\n\n' + messages }]
    }).then(function(resp) {
      var text = (resp.content && resp.content[0] && resp.content[0].text) ? resp.content[0].text : 'No summary.';
      res.json({ summary: text });
    }).catch(function(err) {
      logger.warn('[summarize-chat] AI error: ' + err.message);
      res.json({ summary: 'Chat was lively! Viewers discussed the stream content and engaged with the host.' });
    });
  } catch(e) {
    res.json({ summary: 'Chat was lively! Viewers discussed the stream content and engaged with the host.' });
  }
});

app.get('/api/streams/live', function(req, res) {
  var fsModule = require('fs');
  var pathModule = require('path');
  var HLS_DIR = '/var/www/html/hls';
  var now = Date.now();
  var STALE_MS = 15000; // segment older than 15s = not actively streaming

  // Streams IN: scan HLS dir for active m3u8/ts files
  var streamsIn = [];
  try {
    var entries = fsModule.readdirSync(HLS_DIR);
    entries.forEach(function(name) {
      var dirPath = pathModule.join(HLS_DIR, name);
      try {
        var stat = fsModule.statSync(dirPath);
        if (stat.isDirectory()) {
          // sub-dir per roomId (from rtmp.js FFmpeg output)
          var m3u8 = pathModule.join(dirPath, 'index.m3u8');
          try {
            var m3u8Stat = fsModule.statSync(m3u8);
            var ageMs = now - m3u8Stat.mtimeMs;
            var room = rooms.get(name);
            streamsIn.push({
              roomId:      name,
              active:      ageMs < STALE_MS,
              ageMs:       Math.floor(ageMs),
              hlsUrl:      '/hls/' + name + '/index.m3u8',
              viewers:     room ? (room.viewers ? room.viewers.size : 0) : 0,
              startedAt:   Math.floor(m3u8Stat.birthtimeMs)
            });
          } catch(e) { /* no m3u8 yet */ }
        } else if (name.endsWith('.m3u8')) {
          // flat layout: /hls/<key>.m3u8
          var ageMs = now - stat.mtimeMs;
          var key = name.replace('.m3u8', '');
          var room = rooms.get(key);
          streamsIn.push({
            roomId:    key,
            active:    ageMs < STALE_MS,
            ageMs:     Math.floor(ageMs),
            hlsUrl:    '/hls/' + name,
            viewers:   room ? (room.viewers ? room.viewers.size : 0) : 0,
            startedAt: Math.floor(stat.birthtimeMs)
          });
        }
      } catch(e) { /* skip */ }
    });
  } catch(e) {
    // HLS dir doesn't exist yet — no active streams
  }

  // Streams OUT: fanout processes
  var streamsOut = [];
  try {
    streamsOut = rtmp.getAllFanouts();
  } catch(e) {
    logger.warn('[streams/live] getAllFanouts error: ' + e.message);
  }

  // Room summaries
  var roomSummaries = [];
  rooms.forEach(function(room, roomId) {
    if (room.viewers && room.viewers.size > 0) {
      roomSummaries.push({
        roomId:   roomId,
        viewers:  room.viewers.size,
        hasHost:  !!room.hostSocketId,
        guests:   room.guests ? room.guests.size : 0
      });
    }
  });

  res.json({
    ts:          now,
    streamsIn:   streamsIn,
    streamsOut:  streamsOut,
    rooms:       roomSummaries
  });
});

// ─── Live Rooms — active rooms with viewer counts for DiscoverTab ─────────
app.get('/api/rooms/live', function(req, res) {
  var result = [];
  rooms.forEach(function(room, roomId) {
    var viewerCount = room.viewers ? room.viewers.size : 0;
    if (viewerCount < 1) return;
    var hostName = '';
    if (room.hostSocketId && io.sockets.sockets.get(room.hostSocketId)) {
      hostName = io.sockets.sockets.get(room.hostSocketId).data.username || '';
    }
    result.push({
      roomId:    roomId,
      viewers:   viewerCount,
      hasHost:   !!room.hostSocketId,
      hostName:  hostName,
      isLive:    !!room.isLive,
      title:     room.streamTitle || '',
      category:  room.streamCategory || '',
      startedAt: room.liveStartedAt || null
    });
  });
  result.sort(function(a, b) { return b.viewers - a.viewers; });
  res.json({ ts: Date.now(), rooms: result });
});

// ─── /api/active-rooms — for DiscoverTab room listing ─────────────────────
app.get('/api/active-rooms', function(req, res) {
  var rooms_out = [];
  rooms.forEach(function(room, id) {
    if (room && room.hostSocketId) {
      rooms_out.push({
        id:          id,
        title:       room.streamTitle || 'Live Stream',
        hostName:    room.hostSocketId && io.sockets.sockets.get(room.hostSocketId)
                       ? (io.sockets.sockets.get(room.hostSocketId).data.username || 'Host')
                       : 'Host',
        viewerCount: room.viewers ? room.viewers.size : 0,
        isLive:      true,
        category:    room.streamCategory || 'GENERAL',
      });
    }
  });
  res.json({ rooms: rooms_out });
});

// ─── New API routes (analytics, search, moderation, aura, payments) ──────
var apiRoutes = null;
try {
  apiRoutes = require('./routes');
  app.use('/api', apiRoutes);
  logger.info('[routes] New API routes mounted at /api');
} catch (routesErr) {
  logger.warn('[routes] Failed to load routes.js: ' + routesErr.message);
}

// ─── Socket.io Auth Middleware ────────────────────────────────────────────

io.use(function(socket, next) {
  var token = socket.handshake.auth.token;
  if (!token) {
    // Unauthenticated viewers are allowed
    socket.data.role = 'viewer';
    socket.data.userId = 'anon-' + uuidv4();
    return next();
  }
  if (!process.env.JWT_SECRET) {
    socket.data.role = 'viewer';
    socket.data.userId = 'anon-' + uuidv4();
    return next();
  }
  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.role   = decoded.role || 'viewer';
    socket.data.userId = decoded.userId || decoded.sub || ('user-' + uuidv4());
    socket.data.decoded = decoded;
    return next();
  } catch (err) {
    // Invalid token falls back to viewer
    socket.data.role = 'viewer';
    socket.data.userId = 'anon-' + uuidv4();
    return next();
  }
});

// ─── Socket.io Connection Handler ────────────────────────────────────────

io.on('connection', function(socket) {
  registerBattleHandlers(io, socket);
  logger.info('[socket] Connected: ' + socket.id + ' role=' + socket.data.role);

  // ── join-room ──────────────────────────────────────────────────────────
  socket.on('join-room', function(data, ack) {
    var roomId   = data.roomId;
    var guestId  = data.guestId || socket.data.userId;
    var username = data.username || 'Guest';
    var role     = data.role || socket.data.role || 'viewer';

    if (!roomId) {
      if (ack) ack({ error: 'roomId required' });
      return;
    }

    // Verify token for host/guest roles
    if (role === 'host' || role === 'guest') {
      if (!data.token && !socket.data.decoded) {
        if (ack) ack({ error: 'Token required for host/guest role' });
        return;
      }
    }

    socket.join(roomId);
    socket.data.roomId   = roomId;
    socket.data.guestId  = guestId;
    socket.data.username = username;
    socket.data.role     = role;

    var room = getRoom(roomId);
    room.presence.set(socket.id, Date.now());

    if (role === 'host' || role === 'guest') {
      room.guests.set(socket.id, { guestId: guestId, username: username, role: role });
      if (role === 'host') {
        room.hostSocketId = socket.id;
        room.hostUserId   = guestId;
        // Insert/update room record
        try {
          db.prepare(`
            INSERT OR IGNORE INTO rooms (room_id, host_id, created_at)
            VALUES (?, ?, ?)
          `).run(roomId, guestId, Math.floor(Date.now() / 1000));
        } catch (dbErr) {
          logger.error('[join-room] DB insert rooms failed: ' + dbErr.message);
        }
      }
    } else {
      room.viewers.add(socket.id);
      try {
        analytics.recordViewerSession(roomId, socket.data.userId || socket.id, Date.now());
      } catch (aErr) {
        logger.warn('[join-room] analytics viewer session failed: ' + aErr.message);
      }
    }

    var viewerCount = room.viewers.size + room.guests.size;

    // Get or create router + transports for host/guest
    if (role === 'host' || role === 'guest') {
      mediasoup.getOrCreateRouter(roomId)
        .then(function() {
          return Promise.all([
            mediasoup.createWebRtcTransport(roomId),
            mediasoup.createWebRtcTransport(roomId)
          ]);
        })
        .then(function(results) {
          var sendTransport = results[0];
          var recvTransport = results[1];

          var existingProducers = mediasoup.getRoomProducers(roomId);
          var routerCaps = mediasoup.getRouterRtpCapabilities(roomId);

          // Build roster
          var guestList = [];
          room.guests.forEach(function(g) {
            guestList.push({ guestId: g.guestId, username: g.username, role: g.role });
          });

          io.to(roomId).emit('roster-update', { guests: guestList });
          io.to(roomId).emit('viewer-count', { count: viewerCount });

          swanybot.onViewerJoin(roomId, username, socket.id);
          swanybot.onWelcomeVisitor(socket.id);

          var ackPayload = {
            routerRtpCapabilities: routerCaps,
            sendTransport:         sendTransport.params,
            recvTransport:         recvTransport.params,
            existingProducers:     existingProducers
          };
          Object.assign(ackPayload, getJoinStateForRoom(roomId));

          // Emit as socket event (for listeners like RoomTab) AND ack callback
          io.to(socket.id).emit('join-room-ack', ackPayload);
          if (ack) ack(ackPayload);
        })
        .catch(function(err) {
          logger.error('[join-room] mediasoup setup failed: ' + err.message);
          io.to(socket.id).emit('join-room-ack', { error: 'MediaSoup setup failed: ' + err.message });
          if (ack) ack({ error: 'MediaSoup setup failed: ' + err.message });
        });
    } else {
      // Viewer — ensure router exists so they can subscribe to producers
      var guestList = [];
      room.guests.forEach(function(g) {
        guestList.push({ guestId: g.guestId, username: g.username, role: g.role });
      });

      io.to(roomId).emit('roster-update', { guests: guestList });
      io.to(roomId).emit('viewer-count', { count: viewerCount });

      swanybot.onViewerJoin(roomId, username, socket.id);
      swanybot.onWelcomeVisitor(socket.id);

      // Create router so viewer can subscribe; emit join-room-ack as connection signal
      mediasoup.getOrCreateRouter(roomId)
        .then(function() {
          var routerCaps = mediasoup.getRouterRtpCapabilities(roomId);
          var existingProducers = mediasoup.getRoomProducers(roomId);
          var viewerAck = { joined: true, routerRtpCapabilities: routerCaps, existingProducers: existingProducers };
          // Send active watch party state so late-joiners auto-sync
          if (room.watchParty) {
            viewerAck.watchParty = room.watchParty;
          }
          Object.assign(viewerAck, getJoinStateForRoom(roomId));
          io.to(socket.id).emit('join-room-ack', viewerAck);
          if (ack) ack(viewerAck);
        })
        .catch(function(err) {
          logger.warn('[join-room] viewer router setup error: ' + err.message);
          var fallbackAck = { joined: true };
          if (room.watchParty) fallbackAck.watchParty = room.watchParty;
          Object.assign(fallbackAck, getJoinStateForRoom(roomId));
          io.to(socket.id).emit('join-room-ack', fallbackAck);
          if (ack) ack(fallbackAck);
        });
    }
  });

  // ── ping-presence ──────────────────────────────────────────────────────
  socket.on('ping-presence', function() {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var room = rooms.get(roomId);
    if (room) room.presence.set(socket.id, Date.now());
  });

  // ── get-rtp-capabilities ───────────────────────────────────────────────
  socket.on('get-rtp-capabilities', function(data, ack) {
    var roomId = data.roomId;
    if (!roomId) {
      if (ack) ack({ error: 'roomId required' });
      return;
    }
    try {
      var caps = mediasoup.getRouterRtpCapabilities(roomId);
      if (ack) ack({ routerRtpCapabilities: caps });
      else io.to(socket.id).emit('rtp-capabilities', { routerRtpCapabilities: caps });
    } catch (err) {
      logger.error('[get-rtp-capabilities] ' + err.message);
      if (ack) ack({ error: err.message });
    }
  });

  // ── create-transport ──────────────────────────────────────────────────
  // Called by mediasoup-client after loading device RTP capabilities
  socket.on('create-transport', function(data, ack) {
    var roomId = socket.data.roomId;
    if (!roomId) {
      if (ack) ack({ error: 'Must join room before creating transport' });
      return;
    }
    mediasoup.createWebRtcTransport(roomId)
      .then(function(transport) {
        if (ack) ack(transport.params);
      })
      .catch(function(err) {
        logger.error('[create-transport] ' + err.message);
        if (ack) ack({ error: err.message });
      });
  });

  // ── transport-connect ──────────────────────────────────────────────────
  socket.on('transport-connect', function(data, ack) {
    var transportId    = data.transportId;
    var dtlsParameters = data.dtlsParameters;

    if (!transportId || !dtlsParameters) {
      if (ack) ack({ error: 'transportId and dtlsParameters required' });
      return;
    }

    mediasoup.connectTransport(transportId, dtlsParameters)
      .then(function() {
        if (ack) ack({ connected: true });
      })
      .catch(function(err) {
        logger.error('[transport-connect] ' + err.message);
        if (ack) ack({ error: err.message });
      });
  });

  // ── produce ────────────────────────────────────────────────────────────
  socket.on('produce', function(data, ack) {
    var transportId    = data.transportId;
    var rtpParameters  = data.rtpParameters;
    var kind           = data.kind;
    var guestId        = socket.data.guestId || data.guestId;
    var roomId         = socket.data.roomId;

    if (!transportId || !rtpParameters || !kind) {
      if (ack) ack({ error: 'transportId, rtpParameters and kind required' });
      return;
    }

    mediasoup.createProducer(transportId, rtpParameters, kind, guestId)
      .then(function(result) {
        var producerId = result.producerId;

        // Notify everyone in the room about the new producer
        if (roomId) {
          io.to(roomId).emit('new-producer', {
            producerId: producerId,
            guestId:    guestId,
            kind:       kind
          });
        }

        if (ack) ack({ producerId: producerId });
      })
      .catch(function(err) {
        logger.error('[produce] ' + err.message);
        if (ack) ack({ error: err.message });
      });
  });

  // ── consume ────────────────────────────────────────────────────────────
  socket.on('consume', function(data, ack) {
    var transportId    = data.transportId;
    var producerId     = data.producerId;
    var rtpCapabilities = data.rtpCapabilities;
    var roomId         = socket.data.roomId || data.roomId;

    if (!transportId || !producerId || !rtpCapabilities || !roomId) {
      if (ack) ack({ error: 'transportId, producerId, rtpCapabilities and roomId required' });
      return;
    }

    mediasoup.createConsumer(roomId, transportId, producerId, rtpCapabilities)
      .then(function(result) {
        if (ack) ack(result.params);
      })
      .catch(function(err) {
        logger.error('[consume] ' + err.message);
        if (ack) ack({ error: err.message });
      });
  });

  // ── producer-closed ────────────────────────────────────────────────────
  socket.on('producer-closed', function(data) {
    var producerId = data.producerId;
    var roomId     = socket.data.roomId;
    if (!producerId) return;

    mediasoup.closeProducer(producerId);

    if (roomId) {
      io.to(roomId).emit('producer-closed', { producerId: producerId });
    }
  });

  // ── producer-pause ─────────────────────────────────────────────────────
  socket.on('producer-pause', function(data) {
    var producerId = data.producerId;
    var roomId     = socket.data.roomId;
    if (!producerId) return;
    mediasoup.pauseProducer(producerId);
    if (roomId) io.to(roomId).emit('producer-paused', { producerId: producerId });
  });

  // ── producer-resume ────────────────────────────────────────────────────
  socket.on('producer-resume', function(data) {
    var producerId = data.producerId;
    var roomId     = socket.data.roomId;
    if (!producerId) return;
    mediasoup.resumeProducer(producerId);
    if (roomId) io.to(roomId).emit('producer-resumed', { producerId: producerId });
  });

  // ── stage-invite ───────────────────────────────────────────────────────
  socket.on('stage-invite', function(data) {
    var roomId  = data.roomId || socket.data.roomId;
    var guestId = data.guestId;
    if (!roomId || !guestId) return;
    io.to(roomId).emit('stage-invite', { guestId: guestId, invitedBy: socket.data.userId });
    io.to(roomId).emit('hand-lower',   { guestId: guestId });
  });

  // ── stage-remove ───────────────────────────────────────────────────────
  socket.on('stage-remove', function(data) {
    var roomId  = data.roomId || socket.data.roomId;
    var guestId = data.guestId;
    if (!roomId || !guestId) return;
    io.to(roomId).emit('stage-remove', { guestId: guestId });
  });

  // ── mute-guest ─────────────────────────────────────────────────────────
  socket.on('mute-guest', function(data) {
    var roomId  = data.roomId || socket.data.roomId;
    var guestId = data.guestId;
    if (!roomId || !guestId) return;
    if (socket.data.role !== 'host') return;
    var producerIds = mediasoup.getProducerIdsByGuest(guestId);
    producerIds.forEach(function(pid) { mediasoup.pauseProducer(pid); });
    io.to(roomId).emit('guest-muted', { guestId: guestId });
  });

  // ── unmute-guest ───────────────────────────────────────────────────────
  socket.on('unmute-guest', function(data) {
    var roomId  = data.roomId || socket.data.roomId;
    var guestId = data.guestId;
    if (!roomId || !guestId) return;
    if (socket.data.role !== 'host') return;
    var producerIds = mediasoup.getProducerIdsByGuest(guestId);
    producerIds.forEach(function(pid) { mediasoup.resumeProducer(pid); });
    io.to(roomId).emit('guest-unmuted', { guestId: guestId });
  });

  // ── kick-guest ─────────────────────────────────────────────────────────
  socket.on('kick-guest', function(data) {
    var roomId  = data.roomId || socket.data.roomId;
    var guestId = data.guestId;
    if (!roomId || !guestId) return;
    if (socket.data.role !== 'host') return;

    var producerIds = mediasoup.getProducerIdsByGuest(guestId);
    producerIds.forEach(function(pid) { mediasoup.closeProducer(pid); });

    var room = rooms.get(roomId);
    if (room) {
      room.guests.forEach(function(g, sid) {
        if (g.guestId === guestId) {
          room.guests.delete(sid);
          var targetSocket = io.sockets.sockets.get(sid);
          if (targetSocket) {
            targetSocket.leave(roomId);
            targetSocket.emit('you-were-kicked', { roomId: roomId });
          }
        }
      });
    }

    io.to(roomId).emit('guest-kicked', { guestId: guestId });

    if (room) {
      var guestList = [];
      room.guests.forEach(function(g) {
        guestList.push({ guestId: g.guestId, username: g.username, role: g.role });
      });
      io.to(roomId).emit('roster-update', { guests: guestList });
    }
  });

  // ── promote-guest ──────────────────────────────────────────────────────
  socket.on('promote-guest', function(data) {
    var roomId  = data.roomId || socket.data.roomId;
    var guestId = data.guestId;
    var newRole = data.role;
    if (!roomId || !guestId || !newRole) return;
    if (socket.data.role !== 'host') return;
    var validRoles = ['cohost', 'guest', 'viewer'];
    if (validRoles.indexOf(newRole) === -1) return;

    var room = rooms.get(roomId);
    if (!room) return;

    room.guests.forEach(function(g, sid) {
      if (g.guestId === guestId) {
        g.role = newRole;
        io.to(sid).emit('role-changed', { guestId: guestId, role: newRole });
      }
    });

    var guestList = [];
    room.guests.forEach(function(g) {
      guestList.push({ guestId: g.guestId, username: g.username, role: g.role });
    });
    io.to(roomId).emit('roster-update', { guests: guestList });
  });

  // ── update-username ────────────────────────────────────────────────────
  socket.on('update-username', function(data) {
    var roomId   = data.roomId || socket.data.roomId;
    var newName  = String(data.username || '').trim().slice(0, 32);
    if (!roomId || !newName) return;

    socket.data.username = newName;

    var room = rooms.get(roomId);
    if (room && room.guests.has(socket.id)) {
      var g = room.guests.get(socket.id);
      room.guests.set(socket.id, Object.assign({}, g, { username: newName }));
    }

    io.to(roomId).emit('username-updated', { userId: socket.data.userId || socket.data.guestId, username: newName });

    if (room) {
      var guestList = [];
      room.guests.forEach(function(g) {
        guestList.push({ guestId: g.guestId, username: g.username, role: g.role });
      });
      io.to(roomId).emit('roster-update', { guests: guestList });
    }
  });

  // ── chat-message ───────────────────────────────────────────────────────
  socket.on('chat-message', function(data) {
    var roomId   = data.roomId || socket.data.roomId;
    var username = data.username || socket.data.username || 'Guest';
    var message  = data.message || '';
    var userId   = data.userId  || socket.data.userId;

    if (!roomId || !message.trim()) return;

    // Spam check
    if (swanybot.isSocketMuted(socket.id)) {
      io.to(socket.id).emit('muted', { reason: 'Too many messages' });
      return;
    }
    swanybot.onChatMessage(roomId, socket.id, message, { username: username, room: rooms.get(roomId) });

    // Analytics: increment per-minute message count
    var chatA = getAnalytics(roomId);
    var chatMinKey = Math.floor(Date.now() / 60000);
    chatA.msgCounts[chatMinKey] = (chatA.msgCounts[chatMinKey] || 0) + 1;

    // Detect and translate
    translation.detectAndTranslate(message)
      .then(function(result) {
        var msgId = uuidv4();
        var ts    = Math.floor(Date.now() / 1000);

        try {
          db.prepare(`
            INSERT INTO chat_history (id, room_id, user_id, username, message, translated, lang, ts)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(msgId, roomId, userId, username, message, result.translated, result.detectedLang, ts);
        } catch (dbErr) {
          logger.error('[chat-message] DB insert failed: ' + dbErr.message);
        }

        io.to(roomId).emit('chat-message', {
          id:         msgId,
          username:   username,
          message:    message,
          translated: result.translated,
          lang:       result.detectedLang,
          ts:         ts
        });
      })
      .catch(function(err) {
        logger.error('[chat-message] translation failed: ' + err.message);
        // Still emit the original message
        var msgId = uuidv4();
        var ts    = Math.floor(Date.now() / 1000);
        io.to(roomId).emit('chat-message', {
          id:         msgId,
          username:   username,
          message:    message,
          translated: message,
          lang:       'UNK',
          ts:         ts
        });
      });
  });

  // ── send-gift ──────────────────────────────────────────────────────────
  socket.on('send-gift', function(data) {
    var roomId                 = data.roomId || socket.data.roomId;
    var fromUser               = data.fromUser || socket.data.username || 'Guest';
    var emoji                  = data.emoji || '';
    var name                   = data.name || 'Gift';
    var valueCents             = Math.floor(data.valueCents || 0);
    var creatorStripeAccountId = data.creatorStripeAccountId || '';

    if (!roomId || valueCents <= 0) return;

    var creatorCents  = Math.floor(valueCents * CREATOR);
    var platformCents = valueCents - creatorCents;
    var giftId        = uuidv4();
    var ts            = Math.floor(Date.now() / 1000);

    try {
      db.prepare(`
        INSERT INTO gifts (id, room_id, from_user, emoji, name, value_cents, creator_cents, platform_cents, ts)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(giftId, roomId, fromUser, emoji, name, valueCents, creatorCents, platformCents, ts);
    } catch (dbErr) {
      logger.error('[send-gift] DB insert failed: ' + dbErr.message);
    }

    // Analytics: track session earnings
    var giftAnalytics = getAnalytics(roomId);
    giftAnalytics.sessionEarnings += valueCents;

    io.to(roomId).emit('gift-received', {
      id:            giftId,
      fromUser:      fromUser,
      emoji:         emoji,
      name:          name,
      valueCents:    valueCents,
      creatorCents:  creatorCents,
      platformCents: platformCents,
      ts:            ts
    });

    try {
      var giftRoom = rooms.get(roomId);
      var hostId = giftRoom ? (giftRoom.hostUserId || giftRoom.hostSocketId) : roomId;
      analytics.recordEarning(hostId, roomId, 'gift', valueCents, name + ' from ' + fromUser);
    } catch (aErr) {
      logger.warn('[send-gift] analytics record failed: ' + aErr.message);
    }

    swanybot.onGiftReceived(roomId, fromUser, name, valueCents);

    // Push live earnings update to host
    try {
      var gifRoom = rooms.get(roomId);
      if (gifRoom && gifRoom.hostSocketId) {
        io.to(gifRoom.hostSocketId).emit('earnings-update', {
          sessionCents: sessionRevenue.get(roomId) || 0,
          lastCents:    valueCents,
          source:       'gift',
          username:     fromUser
        });
      }
    } catch(geu) { logger.warn('[send-gift] earnings-update: ' + geu.message); }

    // Gift leaderboard update
    try {
      var lb = giftLeaderboards.get(roomId) || [];
      var existingIdx = lb.findIndex(function(e) { return e.username === fromUser; });
      if (existingIdx >= 0) {
        lb[existingIdx].totalCents += valueCents;
      } else {
        lb.push({ username: fromUser, totalCents: valueCents });
      }
      lb.sort(function(a, b) { return b.totalCents - a.totalCents; });
      giftLeaderboards.set(roomId, lb);
      io.to(roomId).emit('gift-leaderboard', { roomId: roomId, leaders: lb.slice(0, 10) });
    } catch(lbErr) { logger.warn('[gift-lb] ' + lbErr.message); }

    // Session revenue milestone tracking
    var prevRevenue = sessionRevenue.get(roomId) || 0;
    var newRevenue  = prevRevenue + valueCents;
    sessionRevenue.set(roomId, newRevenue);
    for (var rmi = 0; rmi < REVENUE_MILESTONES_CENTS.length; rmi++) {
      var rev = REVENUE_MILESTONES_CENTS[rmi];
      if (newRevenue >= rev && prevRevenue < rev) {
        swanybot.onRevenueMilestone(roomId, rev);
        break;
      }
    }

    // Auto-trigger AURA gift hype (threshold: $1+)
    if (valueCents >= 100) {
      autoAura(roomId, function(cb) { aura.triggerGift(roomId, fromUser, name, valueCents, cb); });
    }

    // Optionally create a gift PaymentIntent if a Stripe account is provided
    if (creatorStripeAccountId) {
      stripeModule.createGiftCharge(
        socket.data.userId || fromUser,
        roomId,
        valueCents,
        creatorStripeAccountId
      ).then(function(piResult) {
        io.to(socket.id).emit('gift-payment-intent', {
          clientSecret:   piResult.clientSecret,
          paymentIntentId: piResult.paymentIntentId
        });
      }).catch(function(err) {
        logger.error('[send-gift] createGiftCharge failed: ' + err.message);
      });
    }
  });

  // ── speaking ───────────────────────────────────────────────────────────
  socket.on('speaking', function(data) {
    var roomId  = data.roomId || socket.data.roomId;
    var guestId = data.guestId || socket.data.guestId;
    if (!roomId) return;
    io.to(roomId).emit('speaking', { guestId: guestId, speaking: data.speaking });
  });

  // ── hand-raise ─────────────────────────────────────────────────────────
  socket.on('hand-raise', function(data) {
    var roomId   = data.roomId || socket.data.roomId;
    var guestId  = data.guestId  || socket.data.guestId;
    var username = data.username || socket.data.username || guestId;
    if (!roomId) return;
    io.to(roomId).emit('hand-raise', { guestId: guestId, username: username, ts: Math.floor(Date.now() / 1000) });
  });

  // ── hand-lower ─────────────────────────────────────────────────────────
  socket.on('hand-lower', function(data) {
    var roomId  = (data && data.roomId) || socket.data.roomId;
    var guestId = (data && data.guestId) || socket.data.guestId || socket.id;
    if (!roomId) return;
    io.to(roomId).emit('hand-lower', { guestId: guestId });
  });

  // ── mute-all ───────────────────────────────────────────────────────────
  socket.on('mute-all', function(data) {
    var roomId = (data && data.roomId) || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    io.to(roomId).emit('mute-all', { by: socket.data.userId });
    io.to(roomId).emit('chat-message', {
      userId:   'system',
      username: 'SeeWhy LIVE',
      text:     '🔇 ' + (socket.data.username || 'Host') + ' muted all participants',
      ts:       Math.floor(Date.now() / 1000)
    });
  });

  // ── lock-stage ─────────────────────────────────────────────────────────
  socket.on('lock-stage', function(data) {
    var roomId = (data && data.roomId) || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room   = getRoom(roomId);
    var locked = Boolean(data && data.locked);
    room.stageLocked = locked;
    io.to(roomId).emit('stage-lock-update', { locked: locked });
  });

  // ── overlay-update ────────────────────────────────────────────────────
  socket.on('overlay-update', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.overlay) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    io.to(roomId).emit('overlay-update', { overlay: data.overlay });
  });

  // ── watch-party ────────────────────────────────────────────────────────
  socket.on('watch-party-start', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room = getRoom(roomId);
    room.watchParty = { videoId: null, url: null, playing: false, position: 0, ts: Date.now() };
    var hostName = socket.data.username || 'Host';
    io.to(roomId).emit('watch-party-started', { ts: Math.floor(Date.now() / 1000) });
    io.to(roomId).emit('chat-message', {
      userId:   'system',
      username: 'SeeWhy LIVE',
      text:     '🎉 ' + hostName + ' started a Watch Party! Sync up and enjoy together.',
      ts:       Math.floor(Date.now() / 1000)
    });
  });

  socket.on('watch-party-url', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (!data.videoId && !data.url) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room = getRoom(roomId);
    if (!room.watchParty) room.watchParty = { playing: false, position: 0, ts: Date.now() };
    var type = data.type || (data.videoId ? 'youtube' : 'direct');
    room.watchParty.videoId = data.videoId || null;
    room.watchParty.url  = data.url || '';
    room.watchParty.type = type;
    io.to(roomId).emit('watch-party-url', { videoId: data.videoId || null, url: data.url || '', type: type });
  });

  socket.on('watch-party-play', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room = getRoom(roomId);
    var now = Date.now();
    var position = data.position || 0;
    if (!room.watchParty) room.watchParty = {};
    room.watchParty.playing  = true;
    room.watchParty.position = position;
    room.watchParty.ts       = now;
    io.to(roomId).emit('watch-party-play', { position: position, timestamp: now });
  });

  socket.on('watch-party-pause', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room = getRoom(roomId);
    var position = data.position || 0;
    if (!room.watchParty) room.watchParty = {};
    room.watchParty.playing  = false;
    room.watchParty.position = position;
    room.watchParty.ts       = Date.now();
    io.to(roomId).emit('watch-party-pause', { position: position });
  });

  socket.on('watch-party-seek', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || typeof data.position !== 'number') return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room = getRoom(roomId);
    if (!room.watchParty) room.watchParty = {};
    room.watchParty.position = data.position;
    room.watchParty.ts       = Date.now();
    io.to(roomId).emit('watch-party-seek', { position: data.position });
  });

  // Request current watch party state (for late-joining guests/viewers)
  socket.on('watch-party-sync-request', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var room = rooms.get(roomId);
    if (room && room.watchParty) {
      var wp = room.watchParty;
      var elapsed = wp.playing ? (Date.now() - wp.ts) / 1000 : 0;
      io.to(socket.id).emit('watch-party-sync', {
        videoId:  wp.videoId,
        url:      wp.url,
        type:     wp.type || 'youtube',
        playing:  wp.playing,
        position: wp.position + elapsed,
        ts:       Date.now()
      });
    }
  });

  // ── bot-manual-message ─────────────────────────────────────────────────
  socket.on('bot-manual-message', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.message) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var msg = String(data.message).substring(0, 300);
    io.to(roomId).emit('chat-message', {
      userId: 'swanybot',
      username: '🤖 SwanyBot',
      text: msg,
      ts: Date.now(),
      isBot: true
    });
    io.to(roomId).emit('bot-log', {
      event: 'manual',
      message: msg,
      ts: Date.now()
    });
  });

  socket.on('bot-add-trigger', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.trigger) return;
    io.to(roomId).emit('bot-trigger-added', { trigger: data.trigger });
  });

  socket.on('bot-remove-trigger', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.triggerId) return;
    io.to(roomId).emit('bot-trigger-removed', { triggerId: data.triggerId });
  });

  // ── room settings (audio-only, private, paywall) ──────────────────────
  socket.on('room-audio-only', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    io.to(roomId).emit('room-audio-only', { enabled: Boolean(data.enabled), ts: Math.floor(Date.now() / 1000) });
  });

  socket.on('room-private', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    io.to(roomId).emit('room-private', { enabled: Boolean(data.enabled), ts: Math.floor(Date.now() / 1000) });
  });

  socket.on('room-paywall', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var amountCents = Math.floor(data.amountCents || 0);
    io.to(roomId).emit('room-paywall', { enabled: Boolean(data.enabled), amountCents: amountCents, ts: Math.floor(Date.now() / 1000) });
  });

  // ── subscribe ──────────────────────────────────────────────────────────
  socket.on('subscribe', function(data) {
    var roomId     = data.roomId || socket.data.roomId;
    var fromUser   = data.username || socket.data.username || 'Guest';
    var tier       = String(data.tier || 'bronze');
    var priceCents = Math.floor(data.price_cents || 0);
    var CREATOR    = 0.90;
    var creatorCents = Math.floor(priceCents * CREATOR);
    if (!roomId) return;
    io.to(roomId).emit('new-subscription', {
      username:      fromUser,
      tier:          tier,
      price_cents:   priceCents,
      creator_cents: creatorCents,
      ts:            Math.floor(Date.now() / 1000)
    });

    // Auto-trigger AURA subscription celebration
    var tierLabel = tier === 'gold' ? 'GOLD' : tier === 'silver' ? 'SILVER' : 'BRONZE';
    autoAura(roomId, function(cb) {
      aura.triggerTip(roomId, fromUser, priceCents, tierLabel + ' subscriber — welcome to the family!', cb);
    });
  });

  // ── live polls (server-side vote tracking) ────────────────────────────
  socket.on('poll-start', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || socket.data.role !== 'host') return;
    var question = String(data.question || '').slice(0, 200);
    var options  = (data.options || []).slice(0, 4).map(function(o) { return String(o).slice(0, 80); });
    if (!question || options.length < 2) return;
    var id   = uuidv4();
    var opts = options.map(function(t) { return { text: t, votes: new Set() }; });
    var poll = { id: id, question: question, options: opts, createdAt: Date.now(), active: true };
    polls.set(roomId, poll);
    io.to(roomId).emit('poll-update', serializePoll(poll));
    io.to(roomId).emit('bot-log', { event: 'poll_created', message: 'Poll: ' + question, ts: Date.now() });
    poll.autoEndT = setTimeout(function() {
      if (polls.get(roomId) !== poll) return;
      poll.active = false;
      io.to(roomId).emit('poll-update', serializePoll(poll));
      setTimeout(function() { if (polls.get(roomId) === poll) polls.delete(roomId); }, 5000);
    }, Math.floor(data.durationSec || 60) * 1000);
  });

  socket.on('poll-vote', function(data) {
    var roomId    = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var optionIdx = Math.floor(data.optionIdx || 0);
    var poll      = polls.get(roomId);
    if (!poll || !poll.active) return;
    if (optionIdx < 0 || optionIdx >= poll.options.length) return;
    poll.options.forEach(function(o) { o.votes.delete(socket.id); });
    poll.options[optionIdx].votes.add(socket.id);
    io.to(roomId).emit('poll-update', serializePoll(poll));
  });

  socket.on('poll-end', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || socket.data.role !== 'host') return;
    var poll = polls.get(roomId);
    if (!poll) return;
    poll.active = false;
    if (poll.autoEndT) clearTimeout(poll.autoEndT);
    io.to(roomId).emit('poll-update', serializePoll(poll));
    setTimeout(function() { if (polls.get(roomId) === poll) polls.delete(roomId); }, 5000);
  });

  // ── Q&A queue ─────────────────────────────────────────────────────────
  socket.on('qa-question', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.text) return;
    var text = String(data.text).slice(0, 300);
    var id   = data.id || uuidv4();
    var user = socket.data.username || data.username || 'Guest';
    if (!qaQueues.has(roomId)) qaQueues.set(roomId, new Map());
    var queue = qaQueues.get(roomId);
    queue.set(id, { id: id, username: user, text: text, upvotes: 0, ts: Date.now() });
    io.to(roomId).emit('qa-question', { id: id, username: user, text: text, upvotes: 0 });
  });

  socket.on('qa-upvote', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.id) return;
    var queue = qaQueues.get(roomId);
    if (!queue) return;
    var item = queue.get(data.id);
    if (!item) return;
    if (!item.upvoters) item.upvoters = new Set();
    if (item.upvoters.has(socket.id)) return;
    item.upvoters.add(socket.id);
    item.upvotes += 1;
    io.to(roomId).emit('qa-upvote', { id: data.id, upvotes: item.upvotes });
  });

  socket.on('qa-dismiss', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.id || socket.data.role !== 'host') return;
    var queue = qaQueues.get(roomId);
    if (queue) queue.delete(data.id);
    io.to(roomId).emit('qa-dismissed', { id: data.id });
  });

  // ── share-music ────────────────────────────────────────────────────────
  socket.on('share-music', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.title) return;
    var title = String(data.title).slice(0, 120);
    var style = String(data.style || '').slice(0, 60);
    var emoji = String(data.emoji || '🎵').slice(0, 4);
    var user  = socket.data.username || 'Creator';
    io.to(roomId).emit('music-shared', { title: title, style: style, emoji: emoji, sharedBy: user, ts: Date.now() });
  });

  // ── watch-react ────────────────────────────────────────────────────────
  socket.on('watch-react', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.emoji) return;
    var emoji  = String(data.emoji).slice(0, 4);
    var now    = Date.now();
    var lastTs = viewerReactThrottle.get(socket.id) || 0;
    if (now - lastTs < 1000) return;
    viewerReactThrottle.set(socket.id, now);
    io.to(roomId).emit('watch-react', { emoji: emoji, userId: socket.data.userId || socket.id, ts: now });
  });

  // ── VS Poll ───────────────────────────────────────────────────────────
  socket.on('vs-start', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || socket.data.role !== 'host') return;
    var sideA = String(data.sideA || 'Side A').slice(0, 60);
    var sideB = String(data.sideB || 'Side B').slice(0, 60);
    var dur   = Math.min(Math.max(Math.floor(data.durationSec || 60), 10), 300);
    var id    = uuidv4();
    var vp    = { id: id, sideA: sideA, sideB: sideB, votesA: new Set(), votesB: new Set(), active: true, createdAt: Date.now(), endsAt: Date.now() + dur * 1000 };
    vsPolls.set(roomId, vp);
    io.to(roomId).emit('vs-update', serializeVs(vp));
    vp.autoEndT = setTimeout(function() {
      if (vsPolls.get(roomId) !== vp) return;
      vp.active = false;
      io.to(roomId).emit('vs-update', serializeVs(vp));
      setTimeout(function() { if (vsPolls.get(roomId) === vp) vsPolls.delete(roomId); }, 8000);
    }, dur * 1000);
  });

  socket.on('vs-vote', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var vp = vsPolls.get(roomId);
    if (!vp || !vp.active) return;
    var side = data.side; // 'A' or 'B'
    if (side !== 'A' && side !== 'B') return;
    vp.votesA.delete(socket.id);
    vp.votesB.delete(socket.id);
    if (side === 'A') vp.votesA.add(socket.id);
    else vp.votesB.add(socket.id);
    io.to(roomId).emit('vs-update', serializeVs(vp));
  });

  socket.on('vs-end', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || socket.data.role !== 'host') return;
    var vp = vsPolls.get(roomId);
    if (!vp) return;
    vp.active = false;
    if (vp.autoEndT) clearTimeout(vp.autoEndT);
    io.to(roomId).emit('vs-update', serializeVs(vp));
    setTimeout(function() { if (vsPolls.get(roomId) === vp) vsPolls.delete(roomId); }, 8000);
  });

  // ── Judges ────────────────────────────────────────────────────────────
  socket.on('judge-assign', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || socket.data.role !== 'host') return;
    var uid  = String(data.userId || '').slice(0, 80);
    var uname = String(data.username || 'Judge').slice(0, 40);
    if (!uid) return;
    if (!judgeRosters.has(roomId)) judgeRosters.set(roomId, new Map());
    var roster = judgeRosters.get(roomId);
    roster.set(uid, { userId: uid, username: uname, scores: [] });
    io.to(roomId).emit('judges-update', serializeJudges(roomId));
  });

  socket.on('judge-remove', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || socket.data.role !== 'host') return;
    var uid = String(data.userId || '').slice(0, 80);
    var roster = judgeRosters.get(roomId);
    if (roster) roster.delete(uid);
    io.to(roomId).emit('judges-update', serializeJudges(roomId));
  });

  socket.on('judge-score', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var uid = socket.data.userId || socket.id;
    var roster = judgeRosters.get(roomId);
    if (!roster || !roster.has(uid)) return;
    var score = Math.min(10, Math.max(0, Math.floor(data.score || 0)));
    var label = String(data.label || '').slice(0, 40);
    var judge = roster.get(uid);
    judge.scores.push({ score: score, label: label, ts: Date.now() });
    if (judge.scores.length > 20) judge.scores = judge.scores.slice(-20);
    io.to(roomId).emit('judges-update', serializeJudges(roomId));
    io.to(roomId).emit('judge-scored', { userId: uid, username: judge.username, score: score, label: label, ts: Date.now() });
  });

  // ── clip-marker ────────────────────────────────────────────────────────
  socket.on('clip-marker', function(data) {
    var roomId   = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var label    = data.label ? String(data.label).slice(0, 60) : 'Clip Marker';
    var markerId = uuidv4();
    var ts       = Math.floor(Date.now() / 1000);
    var markedBy = socket.data.username || socket.id;
    try {
      db.prepare('INSERT OR IGNORE INTO clip_markers (id, room_id, ts, label, marked_by) VALUES (?, ?, ?, ?, ?)').run(markerId, roomId, ts, label, markedBy);
    } catch(e) {
      logger.warn('[clip-marker] DB insert: ' + e.message);
    }
    io.to(socket.id).emit('clip-marked', { id: markerId, label: label, ts: ts });
    io.to(roomId).emit('bot-log', { event: 'clip_marker', message: 'Clip: ' + label + ' by ' + markedBy, ts: Date.now() });
    logger.info('[clip-marker] ' + label + ' by ' + markedBy + ' in ' + roomId);
  });

  // ── chat-react ─────────────────────────────────────────────────────────
  socket.on('chat-react', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.msgId || !data.emoji) return;
    var emoji = String(data.emoji).slice(0, 4);

    if (!chatReactions.has(roomId)) chatReactions.set(roomId, new Map());
    var roomRxns = chatReactions.get(roomId);
    if (!roomRxns.has(data.msgId)) roomRxns.set(data.msgId, new Map());
    var msgRxns = roomRxns.get(data.msgId);
    if (!msgRxns.has(emoji)) msgRxns.set(emoji, new Set());
    var emojiSet = msgRxns.get(emoji);

    if (emojiSet.has(socket.id)) {
      emojiSet.delete(socket.id);
    } else {
      emojiSet.add(socket.id);
    }

    var serialized = {};
    msgRxns.forEach(function(set, em) {
      if (set.size > 0) serialized[em] = set.size;
    });

    io.to(roomId).emit('chat-react-update', { msgId: data.msgId, reactions: serialized });
  });

  // ── super-chat ─────────────────────────────────────────────────────────
  socket.on('super-chat', function(data) {
    var roomId      = data.roomId || socket.data.roomId;
    var username    = data.username || socket.data.username || 'Guest';
    var userId      = data.userId  || socket.data.userId;
    var message     = String(data.message || '').slice(0, 200).trim();
    var amountCents = Math.floor(data.amountCents || 0);
    var VALID_SC    = [100, 200, 500, 1000, 2000, 5000];
    if (!roomId || !message || VALID_SC.indexOf(amountCents) === -1) return;

    var creatorCents  = Math.floor(amountCents * CREATOR);
    var platformCents = amountCents - creatorCents;
    var scId          = uuidv4();
    var ts            = Math.floor(Date.now() / 1000);
    var TIER_COLORS   = { 100: '#C9A84C', 200: '#D4854A', 500: '#C9A84C', 1000: '#FF8C42', 2000: '#FF1A3C', 5000: '#800020' };
    var tierColor     = TIER_COLORS[amountCents] || '#C9A84C';

    try {
      db.prepare(
        'INSERT INTO super_chats (id, room_id, user_id, username, message, amount_cents, creator_cents, platform_cents, tier_color, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(scId, roomId, userId, username, message, amountCents, creatorCents, platformCents, tierColor, ts);
    } catch(e) {
      logger.error('[super-chat] DB insert: ' + e.message);
    }

    // Analytics: track super-chat earnings
    var scAnalytics = getAnalytics(roomId);
    scAnalytics.sessionEarnings += amountCents;

    io.to(roomId).emit('super-chat', {
      id:           scId,
      username:     username,
      message:      message,
      amountCents:  amountCents,
      creatorCents: creatorCents,
      tierColor:    tierColor,
      ts:           ts
    });

    autoAura(roomId, function(cb) { aura.triggerTip(roomId, username, amountCents, message, cb); });

    // Push live earnings update to host
    try {
      var scRoom = rooms.get(roomId);
      if (scRoom && scRoom.hostSocketId) {
        io.to(scRoom.hostSocketId).emit('earnings-update', {
          sessionCents: sessionRevenue.get(roomId) || 0,
          lastCents:    amountCents,
          source:       'super-chat',
          username:     username
        });
      }
    } catch(eu) { logger.warn('[super-chat] earnings-update: ' + eu.message); }

    // Gift leaderboard — super-chat counts too
    try {
      var scLb = giftLeaderboards.get(roomId) || [];
      var scLbIdx = scLb.findIndex(function(e) { return e.username === username; });
      if (scLbIdx >= 0) { scLb[scLbIdx].totalCents += amountCents; }
      else { scLb.push({ username: username, totalCents: amountCents }); }
      scLb.sort(function(a, b) { return b.totalCents - a.totalCents; });
      giftLeaderboards.set(roomId, scLb);
      io.to(roomId).emit('gift-leaderboard', { roomId: roomId, leaders: scLb.slice(0, 10) });
    } catch(scLbErr) { logger.warn('[gift-lb-sc] ' + scLbErr.message); }

    var prevScRev = sessionRevenue.get(roomId) || 0;
    var newScRev  = prevScRev + amountCents;
    sessionRevenue.set(roomId, newScRev);
    for (var scmi = 0; scmi < REVENUE_MILESTONES_CENTS.length; scmi++) {
      var scMil = REVENUE_MILESTONES_CENTS[scmi];
      if (newScRev >= scMil && prevScRev < scMil) {
        swanybot.onRevenueMilestone(roomId, scMil);
        break;
      }
    }
  });

  // ── bracket-update ─────────────────────────────────────────────────────
  socket.on('bracket-update', function(data) {
    if (!data || !data.roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    io.to(data.roomId).emit('bracket-update', data);
  });

  // ── chyron-update ──────────────────────────────────────────────────────
  socket.on('chyron-update', function(data) {
    if (!data || !data.roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    io.to(data.roomId).emit('chyron-update', data);
  });

  // ── PK Battle v2 vote aggregation ──────────────────────────────────────
  socket.on('pk-start', function(data) {
    if (!data || !data.roomId) return;
    pkVotes.set(data.roomId, { challenger: 0, defender: 0 });
    io.to(data.roomId).emit('pk-start', data);
  });

  socket.on('pk-vote', function(data) {
    if (!data || !data.roomId || !data.side) return;
    var votes = pkVotes.get(data.roomId) || { challenger: 0, defender: 0 };
    if (data.side === 'challenger') votes.challenger = (votes.challenger || 0) + 1;
    if (data.side === 'defender')   votes.defender   = (votes.defender   || 0) + 1;
    pkVotes.set(data.roomId, votes);
    io.to(data.roomId).emit('pk-vote-update', { challengerVotes: votes.challenger, defenderVotes: votes.defender });
  });

  socket.on('pk-end', function(data) {
    if (!data || !data.roomId) return;
    pkVotes.delete(data.roomId);
    io.to(data.roomId).emit('pk-end', data);
  });

  // ── viewer-react ───────────────────────────────────────────────────────
  socket.on('viewer-react', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.emoji) return;
    var emoji  = String(data.emoji).slice(0, 4);
    var now    = Date.now();
    var lastTs = viewerReactThrottle.get(socket.id) || 0;
    if (now - lastTs < 2000) return;
    viewerReactThrottle.set(socket.id, now);
    io.to(roomId).emit('react-burst', { emoji: emoji, userId: socket.data.userId || socket.id, ts: now });
  });

  // ── collab events ─────────────────────────────────────────────────────
  socket.on('collab-request', function(data) {
    var roomId   = data.roomId || socket.data.roomId;
    var fromUser = data.fromUser || socket.data.username || 'Creator';
    if (!roomId) return;
    io.to(roomId).emit('collab-request', {
      from:    fromUser,
      to:      (data.toCreator || '').slice(0, 80),
      type:    (data.type || 'LIVE COLLAB').slice(0, 40),
      message: (data.message || '').slice(0, 300),
      split:   (data.split || '50/50').slice(0, 10),
      ts:      Math.floor(Date.now() / 1000)
    });
  });

  socket.on('collab-accept', function(data) {
    var roomId   = data.roomId || socket.data.roomId;
    var fromUser = data.fromUser || socket.data.username || 'Host';
    if (!roomId) return;
    io.to(roomId).emit('collab-accept', {
      from:      fromUser,
      collabId:  data.collabId || '',
      partner:   (data.partner || '').slice(0, 80),
      ts:        Math.floor(Date.now() / 1000)
    });
  });

  socket.on('collab-message', function(data) {
    var roomId   = data.roomId || socket.data.roomId;
    var fromUser = data.fromUser || socket.data.username || 'Host';
    if (!roomId) return;
    io.to(roomId).emit('collab-message', {
      collabId: data.collabId || '',
      from:     fromUser,
      text:     (data.text || '').slice(0, 500),
      ts:       Math.floor(Date.now() / 1000)
    });
  });

  socket.on('portal-share', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var channelName = (data.channelName || '').slice(0, 80);
    io.to(roomId).emit('chat-message', {
      userId: 'system',
      username: 'SeeWhy LIVE',
      text: '🌐 Now featuring: ' + channelName + ' — go check them out!',
      ts: Math.floor(Date.now() / 1000)
    });
  });

  // ── stream-info ────────────────────────────────────────────────────────
  socket.on('stream-info', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room = rooms.get(roomId);
    if (room) {
      if (data.title)    room.streamTitle    = String(data.title).slice(0, 120);
      if (data.category) room.streamCategory = String(data.category).slice(0, 40);
    }
    io.to(roomId).emit('stream-info', {
      title:    (data.title    || '').slice(0, 120),
      category: (data.category || '').slice(0, 40),
      desc:     (data.desc     || '').slice(0, 400),
      ts:       Math.floor(Date.now() / 1000)
    });
  });

  // ── fades-event ────────────────────────────────────────────────────────
  socket.on('fades-event', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    io.to(roomId).emit('fades-event', {
      event:  data.event,
      scores: data.scores,
      ts:     Math.floor(Date.now() / 1000)
    });
  });

  // ── go-live ────────────────────────────────────────────────────────────
  socket.on('go-live', function(data, ack) {
    var roomId      = data.roomId || socket.data.roomId;
    var destinations = data.destinations;

    if (!roomId) {
      if (ack) ack({ error: 'roomId required' });
      return;
    }

    // Verify socket is host
    var room = rooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id) {
      if (ack) ack({ error: 'Only the host can go live' });
      return;
    }

    var now = Math.floor(Date.now() / 1000);
    try {
      db.prepare(`
        UPDATE rooms SET created_at = ? WHERE room_id = ?
      `).run(now, roomId);
    } catch (dbErr) {
      logger.error('[go-live] DB update failed: ' + dbErr.message);
    }

    if (destinations && destinations.length > 0) {
      try {
        rtmp.startFanout(roomId, socket.data.guestId, destinations);
      } catch (err) {
        logger.error('[go-live] startFanout failed: ' + err.message);
        if (ack) ack({ error: 'Failed to start RTMP fanout: ' + err.message });
        return;
      }
    }

    room.isLive        = true;
    room.liveStartedAt = now;
    room.streamTitle   = (data && data.streamTitle) ? String(data.streamTitle).slice(0, 80) : '';

    io.to(roomId).emit('go-live-confirmed', {
      roomId: roomId,
      ts:     now
    });

    // Auto-trigger AURA stream start hype
    peakViewers.set(roomId, room.viewers ? room.viewers.size : 0);
    milestonesSeen.set(roomId, new Set());
    sessionRevenue.set(roomId, 0);
    swanybot.onStreamStart(roomId);
    var streamTitle = room.streamTitle || 'SeeWhy LIVE';
    var vcNow = room.viewers ? room.viewers.size : 0;
    autoAura(roomId, function(cb) { aura.triggerStreamStart(roomId, streamTitle, vcNow, cb); });

    try {
      analytics.recordStreamEvent(roomId, socket.data.userId || socket.id, 'start', room.viewers ? room.viewers.size : 0, 0);
    } catch (aErr) {
      logger.warn('[go-live] analytics record failed: ' + aErr.message);
    }

    if (ack) ack({ started: true });

    // Send push notifications to all subscribers
    try {
      var pushSubs = db.prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions').all();
      if (pushSubs && pushSubs.length > 0) {
        var pushTitle = room.streamTitle || 'SeeWhy LIVE';
        var pushPayload = JSON.stringify({ title: pushTitle + ' is LIVE!', body: 'Tap to watch now on SeeWhy LIVE', url: '/' });
        pushSubs.forEach(function(s) {
          if (!s.endpoint) return;
          if (webpush) {
            var sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
            webpush.sendNotification(sub, pushPayload).catch(function(err) {
              if (err.statusCode === 410 || err.statusCode === 404) {
                db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(s.endpoint);
              }
            });
          } else {
            logger.info('[push] would notify: ' + s.endpoint.slice(-20));
          }
        });
      }
    } catch(pushErr) {
      logger.warn('[push] send error: ' + pushErr.message);
    }
  });

  // ── Audio Stage handlers ───────────────────────────────────────────────
  socket.on('audio-stage-join', function(data) {
    if (!data || !data.roomId) return;
    var sRoomId = String(data.roomId);
    if (!stageRooms.has(sRoomId)) {
      stageRooms.set(sRoomId, { speakers: [], listeners: [] });
    }
    var stage = stageRooms.get(sRoomId);
    var uId   = String(data.userId || socket.id);
    var uName = data.username || 'Guest';
    var uRole = data.role || 'viewer';

    // Remove from both arrays first (idempotent)
    stage.speakers  = stage.speakers.filter(function(s)  { return String(s.userId) !== uId; });
    stage.listeners = stage.listeners.filter(function(l) { return String(l.userId) !== uId; });

    if (uRole === 'host') {
      stage.speakers.push({ userId: uId, username: uName, speaking: false, muted: false });
    } else {
      stage.listeners.push({ userId: uId, username: uName, handRaised: false });
    }
    socket.data.stageRoomId = sRoomId;
    io.to(sRoomId).emit('audio-stage-state', { speakers: stage.speakers, listeners: stage.listeners });
  });

  socket.on('audio-stage-leave', function(data) {
    if (!data || !data.roomId) return;
    var sRoomId = String(data.roomId);
    var stage = stageRooms.get(sRoomId);
    if (!stage) return;
    var uId = String(data.userId || socket.id);
    stage.speakers  = stage.speakers.filter(function(s)  { return String(s.userId) !== uId; });
    stage.listeners = stage.listeners.filter(function(l) { return String(l.userId) !== uId; });
    io.to(sRoomId).emit('audio-stage-update', { speakers: stage.speakers, listeners: stage.listeners });
  });

  socket.on('audio-stage-hand-raise', function(data) {
    if (!data || !data.roomId) return;
    var sRoomId = String(data.roomId);
    var stage = stageRooms.get(sRoomId);
    if (!stage) return;
    var uId = String(data.userId || socket.id);
    var lst = stage.listeners.find(function(l) { return String(l.userId) === uId; });
    if (lst) { lst.handRaised = !!data.raised; }
    io.to(sRoomId).emit('audio-stage-update', { speakers: stage.speakers, listeners: stage.listeners });
  });

  socket.on('audio-stage-speaking', function(data) {
    if (!data || !data.roomId) return;
    var sRoomId = String(data.roomId);
    var stage = stageRooms.get(sRoomId);
    if (!stage) return;
    var uId = String(data.userId || socket.id);
    var spk = stage.speakers.find(function(s) { return String(s.userId) === uId; });
    if (spk) { spk.speaking = !!data.speaking; }
    io.to(sRoomId).emit('audio-stage-update', { speakers: stage.speakers, listeners: stage.listeners });
  });

  socket.on('audio-stage-promote', function(data) {
    if (!data || !data.roomId) return;
    var sRoomId = String(data.roomId);
    var stage = stageRooms.get(sRoomId);
    if (!stage) return;
    // Only host or cohost can promote
    var targetId = String(data.targetUserId);
    var lstIdx = stage.listeners.findIndex(function(l) { return String(l.userId) === targetId; });
    if (lstIdx === -1) return;
    if (stage.speakers.length >= 20) return;
    var lst = stage.listeners.splice(lstIdx, 1)[0];
    stage.speakers.push({ userId: lst.userId, username: lst.username, speaking: false, muted: false });
    io.to(sRoomId).emit('audio-stage-update', { speakers: stage.speakers, listeners: stage.listeners });
  });

  socket.on('audio-stage-demote', function(data) {
    if (!data || !data.roomId) return;
    var sRoomId = String(data.roomId);
    var stage = stageRooms.get(sRoomId);
    if (!stage) return;
    var targetId = String(data.targetUserId);
    var spkIdx = stage.speakers.findIndex(function(s) { return String(s.userId) === targetId; });
    if (spkIdx === -1) return;
    var spk = stage.speakers.splice(spkIdx, 1)[0];
    stage.listeners.push({ userId: spk.userId, username: spk.username, handRaised: false });
    io.to(sRoomId).emit('audio-stage-update', { speakers: stage.speakers, listeners: stage.listeners });
  });

  // ── Screen share handlers ──────────────────────────────────────────────
  socket.on('screen-share-start', function(data) {
    if (!data || !data.roomId) return;
    var sRoomId = String(data.roomId);
    io.to(sRoomId).emit('screen-share-active', { userId: data.userId, username: data.username || 'Host' });
  });

  socket.on('screen-share-stop', function(data) {
    if (!data || !data.roomId) return;
    var sRoomId = String(data.roomId);
    io.to(sRoomId).emit('screen-share-ended', {});
  });

  // ── Watch sync handler ─────────────────────────────────────────────────
  socket.on('watch-sync', function(data) {
    if (!data || !data.roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sRoomId = String(data.roomId);
    io.to(sRoomId).emit('watch-sync', { action: data.action, position: data.position, timestamp: Date.now() });
  });

  // ── PK cheer handler ──────────────────────────────────────────────────
  socket.on('pk-cheer', function(data) {
    if (!data || !data.roomId) return;
    var cheerRoomId = String(data.roomId);
    var battle = vsPolls.get(cheerRoomId);
    if (!battle || !battle.active) return;
    var cheerSide = data.side === 'B' ? 'B' : 'A';
    if (!battle.cheerA) battle.cheerA = [];
    if (!battle.cheerB) battle.cheerB = [];
    var list = cheerSide === 'A' ? battle.cheerA : battle.cheerB;
    var user = data.username || 'Viewer';
    if (list.indexOf(user) === -1) { list.push(user); }
    if (battle.cheerA.length > 20) battle.cheerA = battle.cheerA.slice(-20);
    if (battle.cheerB.length > 20) battle.cheerB = battle.cheerB.slice(-20);
    vsPolls.set(cheerRoomId, battle);
    io.to(cheerRoomId).emit('pk-cheer-update', { cheerA: battle.cheerA, cheerB: battle.cheerB });
  });

  // ── Watch stage pin handler ────────────────────────────────────────────
  socket.on('watch-stage-pin', function(data) {
    if (!data || !data.roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sRoomId = String(data.roomId);
    io.to(sRoomId).emit('watch-stage-pin', { ytId: data.ytId || '' });
  });

  // ── Love micro-tip handler ─────────────────────────────────────────────
  socket.on('love-send', function(data) {
    if (!data || !data.roomId) return;
    var loveRoomId = String(data.roomId);
    var prev = loveCounts.get(loveRoomId) || 0;
    var newTotal = prev + 1;
    loveCounts.set(loveRoomId, newTotal);
    var loveRoomEarnings = loveEarnings.get(loveRoomId) || { creator: 0, platform: 0 };
    loveRoomEarnings.creator  += 90;  // 90 microcents
    loveRoomEarnings.platform += 10;  // 10 microcents
    loveEarnings.set(loveRoomId, loveRoomEarnings);
    io.to(loveRoomId).emit('love-update', {
      total:      newTotal,
      lastSender: data.username || 'Someone',
      roomId:     loveRoomId
    });
  });

  // ── Stream Goal handlers ──────────────────────────────────────────────
  socket.on('stream-goal-set', function(data) {
    if (!data || !data.roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sgRoomId = String(data.roomId);
    io.to(sgRoomId).emit('stream-goal-set', {
      roomId:  sgRoomId,
      type:    data.type   || 'viewers',
      target:  Math.floor(data.target || 0),
      label:   data.label  || null
    });
  });

  socket.on('stream-goal-clear', function(data) {
    if (!data || !data.roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sgcRoomId = String(data.roomId);
    io.to(sgcRoomId).emit('stream-goal-clear', { roomId: sgcRoomId });
  });

  // ── Sound FX handler ────────────────────────────────────────────────────
  socket.on('sound-fx', function(data) {
    if (!data || !data.roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sfxRoomId = String(data.roomId);
    io.to(sfxRoomId).emit('sound-fx', { sfxId: data.sfxId, sfxLabel: data.sfxLabel || '' });
  });

  // ── trivia ─────────────────────────────────────────────────────────────
  socket.on('trivia-start', function(data) {
    if (!data || !data.roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var tRoomId = String(data.roomId);
    var question = (data.question || '').trim().slice(0, 200);
    var options  = Array.isArray(data.options) ? data.options.slice(0, 4).map(function(o) { return { text: String(o.text || o).slice(0, 80) }; }) : [];
    var correctIdx = typeof data.correctIdx === 'number' ? data.correctIdx : 0;
    var durationMs = Math.min(Math.max(data.durationMs || 20000, 5000), 60000);
    if (!question || options.length < 2) return;
    var trivia = { question: question, options: options, answers: new Map(), correctIdx: correctIdx, active: true, startTs: Date.now(), durationMs: durationMs };
    triviaRooms.set(tRoomId, trivia);
    io.to(tRoomId).emit('trivia-question', { roomId: tRoomId, question: question, options: options.map(function(o) { return { text: o.text }; }), durationMs: durationMs });
    trivia.timer = setTimeout(function() { endTrivia(tRoomId); }, durationMs);
  });

  socket.on('trivia-answer', function(data) {
    if (!data || !data.roomId) return;
    var tRoomId = String(data.roomId);
    var trivia = triviaRooms.get(tRoomId);
    if (!trivia || !trivia.active) return;
    var idx = parseInt(data.answerIdx, 10);
    if (isNaN(idx) || idx < 0 || idx >= trivia.options.length) return;
    trivia.answers.set(socket.id, { idx: idx, username: data.username || socket.data.username || 'Anonymous', ts: Date.now() });
    socket.emit('trivia-answer-ack', { answerIdx: idx });
  });

  socket.on('trivia-end', function(data) {
    if (!data || !data.roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    endTrivia(String(data.roomId));
  });

  // ── end-broadcast ──────────────────────────────────────────────────────
  socket.on('end-broadcast', function(data, ack) {
    var roomId = data.roomId || socket.data.roomId;

    if (!roomId) {
      if (ack) ack({ error: 'roomId required' });
      return;
    }

    var room = rooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id) {
      if (ack) ack({ error: 'Only the host can end the broadcast' });
      return;
    }

    try {
      rtmp.stopFanout(roomId);
    } catch (err) {
      logger.error('[end-broadcast] stopFanout error: ' + err.message);
    }

    mediasoup.cleanupRoom(roomId);
    whisper.cleanup(roomId);

    var now = Math.floor(Date.now() / 1000);
    try {
      db.prepare('UPDATE rooms SET ended_at = ? WHERE room_id = ?').run(now, roomId);
    } catch (dbErr) {
      logger.error('[end-broadcast] DB update failed: ' + dbErr.message);
    }

    if (room) { room.isLive = false; }

    io.to(roomId).emit('broadcast-ended', { roomId: roomId, ts: now });

    // Auto-trigger AURA stream end wrap-up
    var peak = peakViewers.get(roomId) || 0;
    autoAura(roomId, function(cb) { aura.triggerStreamEnd(roomId, peak, 0, cb); });
    peakViewers.delete(roomId);
    milestonesSeen.delete(roomId);
    sessionRevenue.delete(roomId);
    swanybot.resetRoomGifts(roomId);
    swanybot.onStreamEnd(roomId);
    polls.delete(roomId);
    chatReactions.delete(roomId);
    activePolls.delete(roomId);
    vsPolls.delete(roomId);
    qaQueues.delete(roomId);
    judgeRosters.delete(roomId);
    pkVotes.delete(roomId);
    roomAnalytics.delete(roomId);
    stageRooms.delete(roomId);
    loveCounts.delete(roomId);
    loveEarnings.delete(roomId);
    giftLeaderboards.delete(roomId);
    if (triviaRooms.has(roomId)) { endTrivia(roomId); triviaRooms.delete(roomId); }

    try {
      analytics.recordStreamEvent(roomId, socket.data.userId || socket.id, 'end', 0, 0);
    } catch (aErr) {
      logger.warn('[end-broadcast] analytics record failed: ' + aErr.message);
    }

    // Clean up room state
    rooms.delete(roomId);
    swanybot.cleanupRoom && swanybot.cleanupRoom(roomId);

    if (ack) ack({ ended: true });
  });

  // ── audio-chunk ────────────────────────────────────────────────────────
  socket.on('audio-chunk', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    var chunk  = data.chunk;

    if (!roomId || !chunk) return;

    whisper.processChunk(roomId, chunk, function(text) {
      var ts = Math.floor(Date.now() / 1000);
      io.to(roomId).emit('chat-message', {
        id:         uuidv4(),
        username:   '[Transcript]',
        message:    text,
        translated: text,
        lang:       'EN',
        ts:         ts,
        isTranscript: true
      });
    });
  });

  // ── aura-trigger ───────────────────────────────────────────────────────
  socket.on('aura-trigger', function(data) {
    var sId = data.streamId || socket.data.roomId;
    if (!sId || !aura) return;
    var triggerFn = null;
    if (data.type === 'stream_start') triggerFn = function(cb) { aura.triggerStreamStart(sId, data.streamTitle || 'SeeWhy LIVE', data.viewerCount || 0, cb); };
    if (data.type === 'tip_received') triggerFn = function(cb) { aura.triggerTip(sId, data.viewerName || 'Viewer', data.amountCents || 500, data.note || '', cb); };
    if (data.type === 'gift_received') triggerFn = function(cb) { aura.triggerGift(sId, data.viewerName || 'Viewer', data.giftName || 'Gift', data.amountCents || 100, cb); };
    if (data.type === 'new_viewer') triggerFn = function(cb) { aura.triggerNewViewer(sId, data.viewerName || 'Viewer', data.isReturning || false, cb); };
    if (data.type === 'stream_end') triggerFn = function(cb) { aura.triggerStreamEnd(sId, data.peakViewers || 0, data.totalEarningsCents || 0, cb); };
    if (!triggerFn) return;
    triggerFn(function(err, text) {
      if (text) {
        io.to(sId).emit('aura-message', { text: text, mode: aura.getMode(), ts: Math.floor(Date.now() / 1000) });
      }
    });
  });

  // ── mute-user ──────────────────────────────────────────────────────────
  socket.on('mute-user', function(data) {
    var sId = data.roomId || socket.data.roomId;
    if (!sId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    io.to(sId).emit('user-muted', { userId: data.targetUser, reason: data.reason, ts: Math.floor(Date.now() / 1000) });
  });

  // ── ban-user ───────────────────────────────────────────────────────────
  socket.on('ban-user', function(data) {
    var sId = data.roomId || socket.data.roomId;
    if (!sId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var bannedId = data.userId || data.targetUser;
    io.to(sId).emit('user-banned', { userId: bannedId, ts: Math.floor(Date.now() / 1000) });
    // Disconnect the banned socket if it is connected to this room
    var room = rooms.get(sId);
    if (room) {
      room.guests.forEach(function(g) {
        if ((g.guestId === bannedId || g.userId === bannedId) && g.socketId) {
          var bannedSocket = io.sockets.sockets.get(g.socketId);
          if (bannedSocket) { bannedSocket.disconnect(true); }
        }
      });
    }
  });

  // ── unban-user ─────────────────────────────────────────────────────────
  socket.on('unban-user', function(data) {
    var sId = data.roomId || socket.data.roomId;
    if (!sId) return;
    io.to(sId).emit('user-unbanned', { username: data.username, ts: Math.floor(Date.now() / 1000) });
  });

  // ── mod-rules ──────────────────────────────────────────────────────────
  socket.on('mod-rules', function(data) {
    var sId = data.roomId || socket.data.roomId;
    if (!sId) return;
    io.to(sId).emit('mod-rules-updated', { rules: data.rules, ts: Math.floor(Date.now() / 1000) });
  });

  // ── bot-rule-toggle ────────────────────────────────────────────────────
  socket.on('bot-rule-toggle', function(data) {
    var sId = data.roomId || socket.data.roomId;
    if (!sId) return;
    io.to(sId).emit('bot-rule-changed', { rule: data.rule, enabled: Boolean(data.enabled), ts: Math.floor(Date.now() / 1000) });
  });

  // ── subscriber-only-changed ────────────────────────────────────────────
  socket.on('subscriber-only-changed', function(data) {
    var sId = data.roomId || socket.data.roomId;
    if (!sId) return;
    io.to(sId).emit('subscriber-only-changed', { enabled: Boolean(data.enabled), ts: Math.floor(Date.now() / 1000) });
  });

  // ── analytics-ping ────────────────────────────────────────────────────
  socket.on('analytics-ping', function(data) {
    var pingRoomId = (data && data.roomId) ? data.roomId : socket.data.roomId;
    if (!pingRoomId) return;
    var a = getAnalytics(pingRoomId);
    var pingRoom = io.sockets.adapter.rooms.get(pingRoomId);
    var pingViewers = pingRoom ? pingRoom.size : 0;
    if (pingViewers > a.peak) a.peak = pingViewers;
    a.viewerHistory.push(pingViewers);
    if (a.viewerHistory.length > 20) a.viewerHistory = a.viewerHistory.slice(-20);
    var pingMinKey = Math.floor(Date.now() / 60000);
    var pingMsgRate = (a.msgCounts[pingMinKey] || 0) + (a.msgCounts[pingMinKey - 1] || 0);
    var pingBuckets = [];
    for (var pbi = 9; pbi >= 0; pbi--) {
      pingBuckets.push(a.msgCounts[pingMinKey - pbi] || 0);
    }
    // Prune old msgCounts keys (keep only last 60 minutes)
    var staleMinKey = pingMinKey - 60;
    Object.keys(a.msgCounts).forEach(function(k) {
      if (parseInt(k, 10) < staleMinKey) delete a.msgCounts[k];
    });

    // Send only to the requesting host socket — not to all viewers
    io.to(socket.id).emit('analytics-update', {
      viewers:       pingViewers,
      peak:          a.peak,
      msgRate:       pingMsgRate,
      earnings:      a.sessionEarnings,
      chatBuckets:   pingBuckets,
      viewerHistory: a.viewerHistory
    });
  });

  // ── poll-create ───────────────────────────────────────────────────────
  socket.on('poll-create', function(data) {
    var pollRoomId = data.roomId || socket.data.roomId;
    if (!pollRoomId) return;
    var duration = data.duration || 60;
    var newPoll = {
      id: Date.now().toString(),
      question: String(data.question || '').slice(0, 200),
      options: (Array.isArray(data.options) ? data.options : []).map(function(o) { return String(o).slice(0, 80); }),
      votes: {},
      totalVotes: 0,
      endsAt: Date.now() + duration * 1000
    };
    var existingPoll = activePolls.get(pollRoomId);
    if (existingPoll && existingPoll.timer) clearTimeout(existingPoll.timer);
    newPoll.timer = setTimeout(function() {
      var finCounts = {};
      Object.keys(newPoll.votes).forEach(function(k) {
        var opt = newPoll.votes[k];
        finCounts[opt] = (finCounts[opt] || 0) + 1;
      });
      io.to(pollRoomId).emit('poll-end', { id: newPoll.id, final: true, votes: finCounts, totalVotes: newPoll.totalVotes });
      activePolls.delete(pollRoomId);
    }, duration * 1000);
    activePolls.set(pollRoomId, newPoll);
    io.to(pollRoomId).emit('poll-start', {
      id: newPoll.id,
      question: newPoll.question,
      options: newPoll.options,
      votes: {},
      totalVotes: 0,
      endsAt: newPoll.endsAt
    });
  });

  // ── poll-vote ─────────────────────────────────────────────────────────
  socket.on('poll-vote', function(data) {
    var voteRoomId = data.roomId || socket.data.roomId;
    if (!voteRoomId) return;
    var pollToVote = activePolls.get(voteRoomId);
    if (!pollToVote || pollToVote.id !== data.pollId) return;
    var voteKey = socket.id;
    if (pollToVote.votes[voteKey] !== undefined) return;
    pollToVote.votes[voteKey] = data.option;
    pollToVote.totalVotes = (pollToVote.totalVotes || 0) + 1;
    var voteCounts = {};
    Object.keys(pollToVote.votes).forEach(function(k) {
      var opt = pollToVote.votes[k];
      voteCounts[opt] = (voteCounts[opt] || 0) + 1;
    });
    io.to(voteRoomId).emit('poll-update', {
      id: pollToVote.id,
      question: pollToVote.question,
      options: pollToVote.options,
      votes: voteCounts,
      totalVotes: pollToVote.totalVotes,
      endsAt: pollToVote.endsAt
    });
  });

  // ── poll-end (manual) ─────────────────────────────────────────────────
  socket.on('poll-end', function(data) {
    var endRoomId = data.roomId || socket.data.roomId;
    if (!endRoomId) return;
    var endPoll = activePolls.get(endRoomId);
    if (!endPoll) return;
    if (endPoll.timer) clearTimeout(endPoll.timer);
    activePolls.delete(endRoomId);
    var endCounts = {};
    Object.keys(endPoll.votes).forEach(function(k) {
      var opt = endPoll.votes[k];
      endCounts[opt] = (endCounts[opt] || 0) + 1;
    });
    io.to(endRoomId).emit('poll-end', { id: endPoll.id, final: true, votes: endCounts, totalVotes: endPoll.totalVotes });
  });

  // ── disconnect ─────────────────────────────────────────────────────────
  socket.on('disconnect', function(reason) {
    logger.info('[socket] Disconnected: ' + socket.id + ' reason=' + reason);

    var roomId = socket.data.roomId;
    if (!roomId) return;

    var room = rooms.get(roomId);
    if (!room) return;

    var wasViewer = room.viewers.has(socket.id);
    room.viewers.delete(socket.id);
    room.guests.delete(socket.id);

    if (wasViewer) {
      try {
        analytics.endViewerSession(roomId, socket.data.userId || socket.id, Date.now());
      } catch (aErr) {
        logger.warn('[disconnect] analytics end session failed: ' + aErr.message);
      }
    }

    room.presence.delete(socket.id);

    if (room.hostSocketId === socket.id) {
      room.hostSocketId = null;
      // Pause the watch party if host disconnects
      if (room.watchParty && room.watchParty.playing) {
        var elapsed = (Date.now() - room.watchParty.ts) / 1000;
        room.watchParty.position += elapsed;
        room.watchParty.playing = false;
        room.watchParty.ts = Date.now();
        io.to(roomId).emit('watch-party-pause', { position: room.watchParty.position, reason: 'host_disconnected' });
      }
      // Clear screen share indicator if host was sharing
      io.to(roomId).emit('screen-share-ended', {});
      // Notify room that host disconnected
      io.to(roomId).emit('host-disconnected', { ts: Math.floor(Date.now() / 1000) });
    }

    // Close any producers from this socket (scan by guestId)
    var guestId = socket.data.guestId;
    if (guestId) {
      var roomProducers = mediasoup.getRoomProducers(roomId);
      for (var i = 0; i < roomProducers.length; i++) {
        if (roomProducers[i].guestId === guestId) {
          mediasoup.closeProducer(roomProducers[i].producerId);
          io.to(roomId).emit('producer-closed', { producerId: roomProducers[i].producerId });
        }
      }
    }

    var viewerCount = room.viewers.size + room.guests.size;
    var guestList   = [];
    room.guests.forEach(function(g) {
      guestList.push({ guestId: g.guestId, username: g.username, role: g.role });
    });

    io.to(roomId).emit('roster-update', { guests: guestList });
    io.to(roomId).emit('viewer-count', { count: viewerCount });

    swanybot.onViewerCountChange(roomId, viewerCount);

    // Track peak and fire AURA at viewer milestones
    var curPeak = peakViewers.get(roomId) || 0;
    if (viewerCount > curPeak) peakViewers.set(roomId, viewerCount);
    var seen = milestonesSeen.get(roomId);
    if (seen) {
      var MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
      for (var mi = 0; mi < MILESTONES.length; mi++) {
        var m = MILESTONES[mi];
        if (viewerCount >= m && !seen.has(m)) {
          seen.add(m);
          (function(milestone) {
            autoAura(roomId, function(cb) {
              aura.triggerNewViewer(roomId, milestone.toLocaleString() + ' VIEWERS', false, cb);
            });
          })(m);
        }
      }
    }

    viewerReactThrottle.delete(socket.id);

    // Remove empty rooms
    if (room.viewers.size === 0 && room.guests.size === 0) {
      rooms.delete(roomId);
    }

  });
});

// ─── RTMP event forwarding ─────────────────────────────────────────────────
rtmp.on('fanout-failed', function(data) {
  var roomId = data.roomId;
  if (rooms.has(roomId)) {
    io.to(roomId).emit('fanout-failed', { roomId: roomId });
  }
  logger.error('[rtmp] fanout-failed for room ' + roomId);
});

rtmp.on('fanout-restarted', function(data) {
  var roomId = data.roomId;
  if (rooms.has(roomId)) {
    io.to(roomId).emit('fanout-restarted', { roomId: roomId, attempt: data.attempt });
  }
});

// ─── Deploy webhook ────────────────────────────────────────────────────────
app.post('/api/webhooks/deploy', function(req, res) {
  var token    = req.headers['x-deploy-token'] || '';
  var expected = process.env.DEPLOY_TOKEN || '';
  if (!expected || token !== expected) {
    logger.warn('[deploy-webhook] unauthorized attempt from ' + req.ip);
    return res.status(401).json({ error: 'unauthorized' });
  }
  res.json({ ok: true, queued: true, ts: Date.now() });
  // Defer to give the HTTP response time to flush before any restart
  setTimeout(function() {
    var exec = require('child_process').exec;
    // Use `pm2 reload` (graceful 0-downtime) instead of restart.
    // Frontend-only changes don't need a restart at all, but we pull anyway
    // so server picks up any server/index.js changes via a fresh reload.
    var cmd = [
      'cd /opt/seewhy',
      'git fetch origin main',
      'git reset --hard origin/main',
      'cd server && npm install --omit=dev --silent',
      'pm2 reload seewhy-server --update-env',
      'pm2 save --force'
    ].join(' && ');
    exec(cmd, { timeout: 150000 }, function(err, stdout, stderr) {
      if (err) { logger.error('[deploy-webhook] ' + err.message + (stderr ? ' | ' + stderr.slice(-200) : '')); return; }
      logger.info('[deploy-webhook] reload ok: ' + stdout.slice(-400));
    });
  }, 500);
});

// ─── Server startup ────────────────────────────────────────────────────────
var PORT = parseInt(process.env.PORT || '3001', 10);

mediasoup.createWorkers()
  .then(function() {
    logger.info('mediasoup workers ready');
    server.listen(PORT, '0.0.0.0', function() {
      logger.info('SeeWhy LIVE v33.0 server listening on port ' + PORT);
    });
  })
  .catch(function(err) {
    logger.error('Failed to create mediasoup workers: ' + err.message);
    process.exit(1);
  });

// ─── Graceful shutdown ─────────────────────────────────────────────────────
process.on('SIGTERM', function() {
  logger.info('SIGTERM received, shutting down gracefully...');

  // Stop all FFmpeg processes
  rooms.forEach(function(room, roomId) {
    try {
      rtmp.stopFanout(roomId);
    } catch (err) {
      logger.error('[shutdown] stopFanout error for ' + roomId + ': ' + err.message);
    }
    mediasoup.cleanupRoom(roomId);
  });

  // Close DB
  try {
    db.close();
  } catch (err) {
    logger.error('[shutdown] DB close error: ' + err.message);
  }

  server.close(function() {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10s if clean shutdown stalls
  setTimeout(function() {
    logger.error('[shutdown] Forced exit after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', function() {
  process.emit('SIGTERM');
});

module.exports = { app, server, io };
