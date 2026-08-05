'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });
const battleRoutes = require('./routes/battles');
const rewardsRoutes = require('./routes/rewards');
const publicPreviewRoutes = require('./routes/publicPreview');
const guestRoutes = require('./routes/guests');
const inviteRoutes = require('./routes/invites');
const panelRoomRoutes = require('./routes/panelRooms');
const challengeRoutes = require('./routes/challenges');
const vodRoutes = require('./routes/vod');
const leaderboardRoutes = require('./routes/leaderboard');
const loginRoutes = require('./routes/login');
const musicVideoRoutes = require('./routes/musicVideo');
const { registerBattleHandlers } = require('./socket/battleHandlers');
const { registerPanelHandlers } = require('./socket/panelHandlers');
const requireAuth = require('./middleware/auth');

/**
 * index.js - SeeWhy LIVE v33.0 main server entry point
 * Express + Socket.io + mediasoup SFU + Stripe + SwanyBot
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });

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
var ttsRouter    = require('./tts');
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
    ts              INTEGER NOT NULL,
    to_guest_id     TEXT
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
  user_id TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
)`);
try { db.exec('ALTER TABLE push_subscriptions ADD COLUMN user_id TEXT'); } catch(_) {}

// Initialise vault with same db (vault.initDb() will open its own handle to the same file)
vault.initDb();

// Add to_guest_id to gifts for existing DBs created before this column existed
try { db.exec('ALTER TABLE gifts ADD COLUMN to_guest_id TEXT'); } catch(_) {}

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
app.use(require('express').static(require('path').join(__dirname, '..', 'frontend', 'dist')));
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
        res.status(400).json({ error: 'Webhook processing failed' });
      });
  }
);

app.use(helmet());
var _corsOrigins = (process.env.FRONTEND_ORIGIN || 'https://seewhylive.online').split(',').map(function(s) { return s.trim(); });
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
/* Aura and translate endpoints also invoke external AI APIs — apply same limit */
var aiCostRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many requests — please wait before trying again.' }
});
app.use('/api/ai', aiRateLimit);
app.use('/api/aura', aiCostRateLimit);
app.use('/api/translate', aiCostRateLimit);
app.use('/api/summarize-chat', aiCostRateLimit);
var stripeOnboardRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: function(req) { return (req.user && req.user.id) || req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many onboard requests — please try again later.' }
});
// NOTE: stripeOnboardRateLimit is applied on the route itself (after requireAuth)
// so req.user.id is available for per-user keying.
app.use(express.json({ limit: '2mb' }));
app.use(xssClean());
app.use('/api/battles', battleRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/rooms', panelRoomRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/vod', vodRoutes);
app.use('/api/music-video', musicVideoRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api', loginRoutes);
app.use('/', publicPreviewRoutes);

var n8nRouter = require('./n8nWebhooks');
app.use('/api/n8n', n8nRouter);

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
    skipMiddlewares: false
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
var sendGiftThrottle    = new Map();  // socketId → lastGiftTs ms (1s throttle)
var qaQuestionThrottle  = new Map();  // socketId → lastQuestionTs ms (3s throttle)
var loveThrottle        = new Map();  // socketId → lastLoveTs ms (1s throttle)
var audioChunkThrottle  = new Map();  // socketId → lastChunkTs ms (500ms throttle)
var collabThrottle      = new Map();  // socketId → lastCollabTs ms (2s throttle)
var superChatThrottle   = new Map();  // socketId → lastSuperChatTs ms (2s throttle)
var subscribeThrottle   = new Map();  // userId → lastSubscribeTs ms (60s throttle)
var merchOrderThrottle      = new Map();  // socketId → lastMerchOrderTs ms (2s throttle)
var updateUsernameThrottle  = new Map();  // userId → lastUpdateTs ms (2s throttle)
var handRaiseThrottle       = new Map();  // userId → lastHandRaiseTs ms (500ms throttle)
var speakingThrottle        = new Map();  // userId → lastSpeakingTs ms (250ms throttle)
var producerOwners      = new Map();  // producerId → guestId (ownership for close/pause/resume)
var chatMsgThrottle     = new Map();  // socketId → lastChatTs ms (500ms throttle)
var slowModeSeconds     = new Map();  // roomId → seconds (0 = off)
var slowModeUserTs      = new Map();  // roomId+':'+userId → last message timestamp ms
var pinnedMessages      = new Map();  // roomId → { id, username, message, ts } | undefined
var streamGoals         = new Map();  // roomId → { type, target, label } | undefined
var chyrons             = new Map();  // roomId → chyron data object | undefined
var subOnlyRooms        = new Set();  // roomIds where subscriber-only mode is active
var roomAudioOnly       = new Map();  // roomId → true when audio-only mode is active
var roomPrivateMap      = new Map();  // roomId → true when room is private
var roomPaywallMap      = new Map();  // roomId → { amountCents } when paywall is active
var pollVoteThrottle    = new Map();  // socketId → lastPollVoteTs ms (500ms throttle)
var vsVoteThrottle      = new Map();  // socketId → lastVsVoteTs ms (500ms throttle)
var qaUpvoteThrottle    = new Map();  // socketId → lastQaUpvoteTs ms (500ms throttle)
var judgeScoreThrottle  = new Map();  // userId → lastJudgeScoreTs ms (500ms throttle)
var pkVotes             = new Map();  // roomId → { voters: Map<userId, side>, challenger: 0, defender: 0 }
var roomAnalytics       = new Map();  // roomId → { viewerHistory:[], msgCounts:{}, sessionEarnings:0, peak:0 }
var activePolls         = new Map();  // roomId → { id, question, options, votes:{}, totalVotes, endsAt, timer }
var stageRooms          = new Map();  // roomId → { speakers:[], listeners:[] }
var loveCounts          = new Map();  // roomId → total love count
var loveEarnings        = new Map();  // roomId → { creator: microcents, platform: microcents }
var giftLeaderboards    = new Map();  // roomId → [{username, totalCents}] top 10
var triviaRooms         = new Map();  // roomId → { question, options:[{text}], answers:Map<socketId,idx>, correctIdx, timer, active }

// Prune stale throttle map entries every 5 minutes to prevent unbounded growth
// from unauthenticated connections (each reconnect gets a fresh anon key).
// 300 000 ms >> the longest throttle window (60 s) so live entries are unaffected.
var _THROTTLE_PRUNE_MS = 300000;
setInterval(function() {
  var _cut = Date.now() - _THROTTLE_PRUNE_MS;
  [viewerReactThrottle, sendGiftThrottle, qaQuestionThrottle, loveThrottle,
   audioChunkThrottle, collabThrottle, superChatThrottle, subscribeThrottle,
   merchOrderThrottle, updateUsernameThrottle, handRaiseThrottle, speakingThrottle,
   chatMsgThrottle, pollVoteThrottle, vsVoteThrottle, qaUpvoteThrottle,
   judgeScoreThrottle].forEach(function(m) {
    m.forEach(function(ts, k) { if (ts < _cut) m.delete(k); });
  });
}, 5 * 60 * 1000).unref();

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
  var state = { chatHistory: [], activePoll: null, activeVsPoll: null, judges: [], sessionRevenueCents: 0, giftLeaderboard: [], pinnedMessage: null, slowMode: 0 };
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
  state.giftLeaderboard = (giftLeaderboards.get(roomId) || []).slice(0, 10);
  state.pinnedMessage   = pinnedMessages.get(roomId) || null;
  state.slowMode        = slowModeSeconds.get(roomId) || 0;
  state.streamGoal      = streamGoals.get(roomId) || null;
  state.audioOnly       = roomAudioOnly.has(roomId);
  state.privateMode     = roomPrivateMap.has(roomId);
  var _qaMap = qaQueues.get(roomId);
  if (_qaMap && _qaMap.size > 0) {
    var _qaArr = [];
    _qaMap.forEach(function(item) { _qaArr.push({ id: item.id, username: item.username, text: item.text, upvotes: item.upvotes || 0 }); });
    _qaArr.sort(function(a, b) { return b.upvotes - a.upvotes; });
    state.qaQueue = _qaArr.slice(0, 100);
  }
  return state;
}

// Emit ephemeral room state (chyron, subscriber-only, active trivia) to a single joining socket
function seedEphemeralState(socketId, roomId) {
  var _chyron = chyrons.get(roomId);
  if (_chyron && _chyron.text) io.to(socketId).emit('chyron-update', _chyron);
  if (subOnlyRooms.has(roomId)) io.to(socketId).emit('subscriber-only-changed', { enabled: true, ts: Math.floor(Date.now() / 1000) });
  if (roomAudioOnly.has(roomId))  io.to(socketId).emit('room-audio-only', { enabled: true });
  if (roomPrivateMap.has(roomId)) io.to(socketId).emit('room-private',    { enabled: true });
  var _pw = roomPaywallMap.get(roomId);
  if (_pw) io.to(socketId).emit('room-paywall', { enabled: true, amountCents: _pw.amountCents });
  var _trivia = triviaRooms.get(roomId);
  if (_trivia && _trivia.active) {
    var _msRem = Math.max(0, (_trivia.durationMs || 20000) - (Date.now() - (_trivia.startTs || Date.now())));
    if (_msRem > 2000) {
      io.to(socketId).emit('trivia-question', {
        roomId:    roomId,
        question:  _trivia.question,
        options:   _trivia.options.map(function(o) { return { text: o.text }; }),
        durationMs: _msRem
      });
    }
  }
  var _room = rooms.get(roomId);
  if (_room && (_room.streamTitle || _room.streamCategory)) {
    io.to(socketId).emit('stream-info', {
      title:    _room.streamTitle    || '',
      category: _room.streamCategory || '',
      desc:     '',
      ts:       Math.floor(Date.now() / 1000)
    });
  }
  var _loveTotal = loveCounts.get(roomId) || 0;
  if (_loveTotal > 0) io.to(socketId).emit('love-update', { roomId: roomId, total: _loveTotal });
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

// ─── Live Home trending push — broadcast ranked room list every 30 s ─────
// Simple in-process rank: viewer count × 2 + guest count × 3 (no Redis required)
setInterval(function() {
  var ranked = [];
  rooms.forEach(function(room, roomId) {
    var viewers = room.viewers.size;
    var guests  = room.guests.size;
    if (viewers + guests === 0) return;
    ranked.push({
      roomId:    roomId,
      viewers:   viewers,
      guests:    guests,
      score:     viewers * 2 + guests * 3,
    });
  });
  ranked.sort(function(a, b) { return b.score - a.score; });
  var top = ranked.slice(0, 20);
  if (top.length > 0) {
    io.emit('livehome:trending', { rooms: top, ts: Date.now() });
  }
}, 30000);

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

app.use('/api/tts', ttsRouter);

// GET /api/health
app.get('/api/health', function(req, res) {
  var dbOk = true;
  try { db.prepare('SELECT 1').get(); } catch(e) { dbOk = false; }
  res.json({ status: dbOk ? 'ok' : 'degraded', timestamp: Date.now() });
});

// GET /api/metrics
app.get('/api/metrics', requireAuth, function(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
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
app.post('/api/ppv/create', requireAuth, function(req, res) {
  var body = req.body;
  if (!body.roomId || !body.priceUsd || !body.creatorStripeAccountId) {
    res.status(400).json({ error: 'Missing required fields: roomId, priceUsd, creatorStripeAccountId' });
    return;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(body.roomId))) {
    return res.status(400).json({ error: 'invalid roomId' });
  }
  if (!/^acct_[a-zA-Z0-9]{16,}$/.test(String(body.creatorStripeAccountId))) {
    return res.status(400).json({ error: 'invalid creatorStripeAccountId' });
  }
  var priceUsd = parseFloat(body.priceUsd);
  if (!Number.isFinite(priceUsd) || priceUsd < 0.50 || priceUsd > 500) {
    return res.status(400).json({ error: 'priceUsd must be between 0.50 and 500' });
  }
  // Verify the authenticated user owns this room
  try {
    var _ppvRoom = db.prepare('SELECT host_id FROM rooms WHERE room_id = ?').get(body.roomId);
    if (!_ppvRoom || _ppvRoom.host_id !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }
  } catch (_ppvErr) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  stripeModule.createPPVPaymentIntent(
    body.roomId,
    req.user.id,
    body.priceUsd,
    body.creatorStripeAccountId
  ).then(function(result) {
    res.json(result);
  }).catch(function(err) {
    logger.error('[ppv/create] ' + err.message);
    res.status(500).json({ error: 'Internal server error' });
  });
});

// POST /api/ppv/verify
app.post('/api/ppv/verify', requireAuth, function(req, res) {
  var body = req.body;
  if (!body.paymentIntentId || !body.roomId) {
    res.status(400).json({ error: 'Missing required fields: paymentIntentId, roomId' });
    return;
  }
  var _piId = String(body.paymentIntentId);
  if (!/^pi_[A-Za-z0-9]{10,}$/.test(_piId)) {
    return res.status(400).json({ error: 'invalid paymentIntentId format' });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(body.roomId))) {
    return res.status(400).json({ error: 'invalid roomId' });
  }
  stripeModule.verifyPPVPayment(_piId, body.roomId, req.user.id)
    .then(function(result) {
      res.json(result);
    }).catch(function(err) {
      logger.error('[ppv/verify] ' + err.message);
      res.status(400).json({ error: 'Payment verification failed' });
    });
});

// GET /api/schedule
app.get('/api/schedule', function(req, res) {
  try {
    var rows = db.prepare('SELECT id, title, category, desc, scheduled_at, created_at, recurring FROM schedules ORDER BY scheduled_at ASC').all();
    res.json({ events: rows });
  } catch (err) {
    res.json({ events: [] });
  }
});

// POST /api/schedule
app.post('/api/schedule', requireAuth, function(req, res) {
  if (req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }
  var body = req.body;
  if (!body.title || !body.scheduled_at) {
    res.status(400).json({ error: 'title and scheduled_at required' });
    return;
  }
  try {
    db.exec('CREATE TABLE IF NOT EXISTS schedules (id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT, desc TEXT, scheduled_at INTEGER NOT NULL, created_at INTEGER NOT NULL, recurring TEXT)');
    try { db.exec('ALTER TABLE schedules ADD COLUMN recurring TEXT'); } catch(e) { /* column already exists */ }
    try { db.exec('ALTER TABLE schedules ADD COLUMN creator_id TEXT'); } catch(e) { /* column already exists */ }
    var id  = uuidv4();
    var now = Math.floor(Date.now() / 1000);
    var _schedAt = Math.floor(Number(body.scheduled_at));
    if (!Number.isFinite(_schedAt) || _schedAt <= 0) return res.status(400).json({ error: 'scheduled_at must be a positive integer (Unix ms)' });
    db.prepare('INSERT INTO schedules (id,title,category,desc,scheduled_at,created_at,recurring,creator_id) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, String(body.title).slice(0,120), String(body.category||'').slice(0,40), String(body.desc||'').slice(0,400), _schedAt, now, String(body.recurring||'none').slice(0,20), req.user.id);
    res.json({ id: id, saved: true });
  } catch (err) {
    logger.error('[schedule/post] ' + err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/schedule/:id
app.delete('/api/schedule/:id', requireAuth, function(req, res) {
  if (req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  try {
    var info = db.prepare('DELETE FROM schedules WHERE id = ? AND creator_id = ?').run(req.params.id, req.user.id);
    if (info.changes === 0) return res.status(403).json({ error: 'not found or forbidden' });
    res.json({ deleted: true });
  } catch (err) {
    logger.error('[schedule/delete] ' + err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /api/push/unsubscribe
app.post('/api/push/unsubscribe', requireAuth, function(req, res) {
  var endpoint = String(req.body.endpoint || '').slice(0, 2000);
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });
  try {
    db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?').run(endpoint, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/payout-history
app.get('/api/payout-history', requireAuth, function(req, res) {
  var roomId = req.query.roomId || null;
  if (roomId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId)) {
    return res.status(400).json({ error: 'invalid roomId' });
  }
  var userId = req.user.id;
  var stmt;
  var rows;
  try {
    if (roomId) {
      stmt = db.prepare('SELECT date(ts, "unixepoch") as day, SUM(amount_cents) as totalCents, COUNT(*) as events FROM super_chats WHERE room_id = ? AND room_id IN (SELECT room_id FROM rooms WHERE host_id = ?) GROUP BY day ORDER BY day DESC LIMIT 30');
      rows = stmt.all(roomId, userId);
    } else {
      stmt = db.prepare('SELECT date(ts, "unixepoch") as day, SUM(amount_cents) as totalCents, COUNT(*) as events FROM super_chats WHERE room_id IN (SELECT room_id FROM rooms WHERE host_id = ?) GROUP BY day ORDER BY day DESC LIMIT 30');
      rows = stmt.all(userId);
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
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /api/admin/financial-summary  (admin only)
app.get('/api/admin/financial-summary', requireAuth, function(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  try {
    var gifts = db.prepare(
      'SELECT COUNT(*) as cnt, COALESCE(SUM(creator_cents),0) as creator, COALESCE(SUM(platform_cents),0) as platform FROM gifts'
    ).get();
    var superChats = db.prepare(
      'SELECT COUNT(*) as cnt, COALESCE(SUM(creator_cents),0) as creator, COALESCE(SUM(platform_cents),0) as platform FROM super_chats'
    ).get();
    var ppv = db.prepare(
      "SELECT COUNT(*) as cnt, COALESCE(SUM(creator_cents),0) as creator, COALESCE(SUM(platform_cents),0) as platform FROM ppv_unlocks WHERE status = 'succeeded'"
    ).get();
    var recentGifts = db.prepare(
      "SELECT 'gift' as type, from_user as actor, value_cents as total_cents, creator_cents, platform_cents, ts FROM gifts ORDER BY ts DESC LIMIT 15"
    ).all();
    var recentSuperChats = db.prepare(
      "SELECT 'superchat' as type, username as actor, amount_cents as total_cents, creator_cents, platform_cents, ts FROM super_chats ORDER BY ts DESC LIMIT 15"
    ).all();
    var topCreators = db.prepare(
      'SELECT user_id, COALESCE(username, user_id) as username, display_name, total_earnings_cents FROM user_profiles WHERE total_earnings_cents > 0 ORDER BY total_earnings_cents DESC LIMIT 20'
    ).all();
    var combined = recentGifts.concat(recentSuperChats).sort(function(a, b) { return b.ts - a.ts; }).slice(0, 25);
    res.json({
      summary: {
        totalCreatorCents: Math.floor(gifts.creator + superChats.creator + ppv.creator),
        totalPlatformCents: Math.floor(gifts.platform + superChats.platform + ppv.platform),
        gifts:      { count: gifts.cnt,      creatorCents: Math.floor(gifts.creator),      platformCents: Math.floor(gifts.platform) },
        superChats: { count: superChats.cnt, creatorCents: Math.floor(superChats.creator), platformCents: Math.floor(superChats.platform) },
        ppv:        { count: ppv.cnt,        creatorCents: Math.floor(ppv.creator),        platformCents: Math.floor(ppv.platform) },
      },
      recentTransactions: combined.map(function(r) {
        return { type: r.type, actor: r.actor, totalCents: Math.floor(r.total_cents), creatorCents: Math.floor(r.creator_cents), platformCents: Math.floor(r.platform_cents), ts: r.ts };
      }),
      topCreators: (topCreators || []).map(function(c) {
        return { userId: c.user_id, username: c.username, displayName: c.display_name, totalEarningsCents: Math.floor(c.total_earnings_cents || 0) };
      }),
    });
  } catch (err) {
    logger.error('[admin/financial-summary] ' + err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaderboard
app.get('/api/leaderboard', function(req, res) {
  try {
    var roomId = req.query.roomId || '';
    if (roomId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId)) {
      return res.status(400).json({ error: 'invalid roomId' });
    }
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
app.post('/api/connect/onboard', requireAuth, stripeOnboardRateLimit, function(req, res) {
  var body = req.body;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var _ceEmail = String(body.email || '').slice(0, 254);
  if (!_ceEmail || !EMAIL_RE.test(_ceEmail)) {
    res.status(400).json({ error: 'valid email is required' });
    return;
  }
  stripeModule.createConnectAccount(_ceEmail)
    .then(function(result) {
      res.json(result);
    }).catch(function(err) {
      logger.error('[connect/onboard] ' + err.message);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// POST /api/turn/credentials
app.post('/api/turn/credentials', requireAuth, function(req, res) {
  if (!process.env.TURN_SECRET) {
    res.status(500).json({ error: 'TURN_SECRET not configured' });
    return;
  }
  try {
    var ttl      = Math.floor(Date.now() / 1000) + 300;
    var username = ttl + ':' + req.user.id;
    var hmac     = crypto.createHmac('sha256', process.env.TURN_SECRET);
    var credential = hmac.update(username).digest('base64');

    if (!process.env.TURN_URL || !process.env.TURNS_URL) {
      logger.error('[turn/credentials] TURN_URL or TURNS_URL env var not set');
      res.status(500).json({ error: 'TURN server not configured' });
      return;
    }
    res.json({
      urls:       [process.env.TURN_URL, process.env.TURNS_URL],
      username:   username,
      credential: credential
    });
  } catch (err) {
    logger.error('[turn/credentials] ' + err.message);
    res.status(500).json({ error: 'TURN credential generation failed' });
  }
});

// POST /api/keys/save
app.post('/api/keys/save', requireAuth, function(req, res) {
  var body = req.body;
  var destId   = String(body.destId   || '').slice(0, 200);
  var plainKey = String(body.plainKey || '').slice(0, 2000);
  if (!destId || !plainKey) {
    res.status(400).json({ error: 'Missing required fields: destId, plainKey' });
    return;
  }
  try {
    vault.saveKey(req.user.id, destId, plainKey);
    res.json({ saved: true });
  } catch (err) {
    logger.error('[keys/save] ' + err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/keys/delete
app.delete('/api/keys/delete', requireAuth, function(req, res) {
  var body = req.body;
  if (!body.destId) {
    res.status(400).json({ error: 'Missing required field: destId' });
    return;
  }
  try {
    vault.deleteKey(req.user.id, body.destId);
    res.json({ deleted: true });
  } catch (err) {
    logger.error('[keys/delete] ' + err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/keys/meta/:guestId
app.get('/api/keys/meta/:guestId', requireAuth, function(req, res) {
  try {
    var meta = vault.listGuestKeyMeta(req.user.id);
    res.json(meta);
  } catch (err) {
    logger.error('[keys/meta] ' + err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── AI Chat proxy ───────────────────────────────────────────────────────
// Per-user throttle maps for the three AI proxy endpoints.
// Keys are user IDs; values are the timestamp of the last allowed call.
var _aiChatThrottle       = new Map(); // 5 s cooldown
var _translateThrottle    = new Map(); // 1 s cooldown
var _summarizeThrottle    = new Map(); // 10 s cooldown

app.post('/api/ai/chat', requireAuth, function(req, res) {
  var _acNow = Date.now();
  var _acKey = req.user.id;
  if (_acNow - (_aiChatThrottle.get(_acKey) || 0) < 5000) {
    return res.status(429).json({ error: 'too many requests' });
  }
  _aiChatThrottle.set(_acKey, _acNow);
  var body    = req.body;
  var message = typeof body.message === 'string' ? body.message.slice(0, 1000) : '';
  if (!message) { res.status(400).json({ error: 'message required' }); return; }
  var client = require('./llm').getClient();
  client.messages.create({
    model: 'anthropic/claude-sonnet-5',
    max_tokens: 512,
    system: 'You are a helpful assistant for SeeWhy LIVE.',
    messages: [{ role: 'user', content: message }]
  }).then(function(r) {
    var text = r.content && r.content[0] && r.content[0].text ? r.content[0].text : '';
    res.json({ text: text });
  }).catch(function(err) {
    logger.error('[ai/chat] ' + err.message);
    res.status(500).json({ error: 'Internal server error' });
  });
});

// ─── On-demand translation endpoint ──────────────────────────────────────
var VALID_TRANSLATE_LANGS = ['EN','ES','PT','FR','DE','JA','ZH','KO','AR','RU','HI','IT','NL','PL','TR','VI'];

app.post('/api/translate', requireAuth, function(req, res) {
  var _trNow = Date.now();
  var _trKey = req.user.id;
  if (_trNow - (_translateThrottle.get(_trKey) || 0) < 1000) {
    return res.status(429).json({ error: 'too many requests' });
  }
  _translateThrottle.set(_trKey, _trNow);
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
      res.status(500).json({ error: 'Internal server error' });
    });
});

// ─── Live Streams — active ingest + fanout status ────────────────────────
// ─── AI Chat Summary ─────────────────────────────────────────────────────
app.post('/api/summarize-chat', requireAuth, function(req, res) {
  var _scNow = Date.now();
  var _scKey = req.user.id;
  if (_scNow - (_summarizeThrottle.get(_scKey) || 0) < 10000) {
    return res.status(429).json({ error: 'too many requests' });
  }
  _summarizeThrottle.set(_scKey, _scNow);
  var messages = typeof req.body.messages === 'string' ? req.body.messages.slice(0, 4000) : '';
  if (!messages) { res.json({ summary: 'No chat to summarize.' }); return; }
  try {
    var client = require('./llm').getClient();
    client.messages.create({
      model: 'anthropic/claude-haiku-4.5',
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

var _liveStreamsCache = { data: null, ts: 0 };
app.get('/api/streams/live', function(req, res) {
  var fsModule = require('fs');
  var pathModule = require('path');
  var HLS_DIR = '/var/www/html/hls';
  var now = Date.now();
  if (_liveStreamsCache.data && now - _liveStreamsCache.ts < 5000) {
    return res.json(_liveStreamsCache.data);
  }
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

  var _liveResult = {
    ts:          now,
    streamsIn:   streamsIn,
    streamsOut:  streamsOut,
    rooms:       roomSummaries
  };
  _liveStreamsCache = { data: _liveResult, ts: now };
  res.json(_liveResult);
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

// ─── SPA fallback — must be after all API routes ──────────────────────────
app.get('*', function(req, res) {
  var indexPath = require('path').join(__dirname, '..', 'frontend', 'dist', 'index.html');
  if (!require('fs').existsSync(indexPath)) {
    return res.status(503).send('<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Deploying update, back in a moment...</h2></body></html>');
  }
  res.sendFile(indexPath);
});

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
    // Mirror the HTTP requireAuth behaviour: hard-fail unless explicitly in
    // development or test — staging/qa/empty NODE_ENV must fail closed.
    var _sockEnv = process.env.NODE_ENV || '';
    if (_sockEnv === 'development' || _sockEnv === 'test') {
      socket.data.role = 'viewer';
      socket.data.userId = 'anon-' + uuidv4();
      return next();
    }
    return next(new Error('server misconfigured'));
  }
  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.role   = decoded.role || 'viewer';
    socket.data.userId = decoded.userId || decoded.sub || ('user-' + uuidv4());
    socket.data.decoded = decoded;
    return next();
  } catch (err) {
    // A token was supplied but failed verification — reject rather than downgrade
    return next(new Error('invalid token'));
  }
});

// ─── Socket.io Connection Handler ────────────────────────────────────────

io.on('connection', function(socket) {
  registerBattleHandlers(io, socket);
  registerPanelHandlers(io, socket);
  logger.info('[socket] Connected: ' + socket.id + ' role=' + socket.data.role);
  // Join a per-user room so battle:challenge / battle:accept / battle:decline reach this socket
  if (socket.data.userId && !String(socket.data.userId).startsWith('anon')) {
    socket.join('user:' + socket.data.userId);
  }

  // ── join-room ──────────────────────────────────────────────────────────
  socket.on('join-room', function(data, ack) {
    var roomId   = data.roomId;
    var guestId  = socket.data.userId;
    var username = String(data.username || 'Guest').slice(0, 32);
    var role     = socket.data.role || 'viewer';

    if (!roomId || typeof roomId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId)) {
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

    // If claiming host, verify ownership and INSERT atomically in a transaction
    // to prevent TOCTOU: two concurrent join-room calls both see no room and
    // both pass the ownership check, but the last one wins the in-memory state.
    if (role === 'host') {
      try {
        var _hostJoinTx = db.transaction(function() {
          var _existing = db.prepare('SELECT host_id FROM rooms WHERE room_id = ?').get(roomId);
          if (_existing && _existing.host_id !== guestId) return { forbidden: true };
          db.prepare('INSERT OR IGNORE INTO rooms (room_id, host_id, created_at) VALUES (?, ?, ?)')
            .run(roomId, guestId, Math.floor(Date.now() / 1000));
          return { forbidden: false };
        });
        var _txResult = _hostJoinTx();
        if (_txResult.forbidden) {
          if (ack) ack({ error: 'forbidden' });
          return;
        }
      } catch (ownerErr) {
        logger.warn('[join-room] ownership tx error: ' + ownerErr.message);
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
        // DB INSERT already handled in the transaction above.
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
          if (!socket.data.ownedTransportIds) socket.data.ownedTransportIds = [];
          socket.data.ownedTransportIds.push(sendTransport.params.id, recvTransport.params.id);

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
          seedEphemeralState(socket.id, roomId);
          if (ack) ack(ackPayload);
        })
        .catch(function(err) {
          logger.error('[join-room] mediasoup setup failed: ' + err.message);
          io.to(socket.id).emit('join-room-ack', { error: 'MediaSoup setup failed' });
          if (ack) ack({ error: 'MediaSoup setup failed' });
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
          seedEphemeralState(socket.id, roomId);
          if (ack) ack(viewerAck);
        })
        .catch(function(err) {
          logger.warn('[join-room] viewer router setup error: ' + err.message);
          var fallbackAck = { joined: true };
          if (room.watchParty) fallbackAck.watchParty = room.watchParty;
          Object.assign(fallbackAck, getJoinStateForRoom(roomId));
          io.to(socket.id).emit('join-room-ack', fallbackAck);
          seedEphemeralState(socket.id, roomId);
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
    var roomId = socket.data.roomId;
    if (!roomId) {
      if (ack) ack({ error: 'Must join room first' });
      return;
    }
    try {
      var caps = mediasoup.getRouterRtpCapabilities(roomId);
      if (ack) ack({ routerRtpCapabilities: caps });
      else io.to(socket.id).emit('rtp-capabilities', { routerRtpCapabilities: caps });
    } catch (err) {
      logger.error('[get-rtp-capabilities] ' + err.message);
      if (ack) ack({ error: 'Failed to get capabilities' });
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
        if (!socket.data.ownedTransportIds) socket.data.ownedTransportIds = [];
        socket.data.ownedTransportIds.push(transport.params.id);
        if (ack) ack(transport.params);
      })
      .catch(function(err) {
        logger.error('[create-transport] ' + err.message);
        if (ack) ack({ error: 'Failed to create transport' });
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
    if (!socket.data.ownedTransportIds || !socket.data.ownedTransportIds.includes(transportId)) {
      if (ack) ack({ error: 'forbidden' });
      return;
    }

    mediasoup.connectTransport(transportId, dtlsParameters)
      .then(function() {
        if (ack) ack({ connected: true });
      })
      .catch(function(err) {
        logger.error('[transport-connect] ' + err.message);
        if (ack) ack({ error: 'Transport connection failed' });
      });
  });

  // ── produce ────────────────────────────────────────────────────────────
  socket.on('produce', function(data, ack) {
    var transportId    = data.transportId;
    var rtpParameters  = data.rtpParameters;
    var kind           = data.kind;
    var guestId        = socket.data.guestId;
    var roomId         = socket.data.roomId;

    if (!transportId || !rtpParameters || !kind) {
      if (ack) ack({ error: 'transportId, rtpParameters and kind required' });
      return;
    }
    if (!guestId) {
      if (ack) ack({ error: 'Not a guest — cannot produce' });
      return;
    }

    mediasoup.createProducer(transportId, rtpParameters, kind, guestId)
      .then(function(result) {
        var producerId = result.producerId;

        // Track producer ownership for close/pause/resume guards
        producerOwners.set(producerId, guestId);
        if (!socket.data.ownedProducerIds) socket.data.ownedProducerIds = [];
        socket.data.ownedProducerIds.push(producerId);

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
        if (ack) ack({ error: 'Failed to produce' });
      });
  });

  // ── consume ────────────────────────────────────────────────────────────
  socket.on('consume', function(data, ack) {
    var transportId    = data.transportId;
    var producerId     = data.producerId;
    var rtpCapabilities = data.rtpCapabilities;
    var roomId         = socket.data.roomId;

    if (!transportId || !producerId || !rtpCapabilities || !roomId) {
      if (ack) ack({ error: 'transportId, producerId, rtpCapabilities and roomId required' });
      return;
    }
    if (!socket.data.ownedTransportIds || !socket.data.ownedTransportIds.includes(transportId)) {
      if (ack) ack({ error: 'forbidden' });
      return;
    }

    mediasoup.createConsumer(roomId, transportId, producerId, rtpCapabilities)
      .then(function(result) {
        if (ack) ack(result.params);
      })
      .catch(function(err) {
        logger.error('[consume] ' + err.message);
        if (ack) ack({ error: 'Failed to consume' });
      });
  });

  // ── producer-closed ────────────────────────────────────────────────────
  socket.on('producer-closed', function(data) {
    var producerId = data.producerId;
    var roomId     = socket.data.roomId;
    if (!producerId) return;
    if (producerOwners.get(producerId) !== socket.data.guestId) return;

    producerOwners.delete(producerId);
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
    if (producerOwners.get(producerId) !== socket.data.guestId) return;
    mediasoup.pauseProducer(producerId);
    if (roomId) io.to(roomId).emit('producer-paused', { producerId: producerId });
  });

  // ── producer-resume ────────────────────────────────────────────────────
  socket.on('producer-resume', function(data) {
    var producerId = data.producerId;
    var roomId     = socket.data.roomId;
    if (!producerId) return;
    if (producerOwners.get(producerId) !== socket.data.guestId) return;
    mediasoup.resumeProducer(producerId);
    if (roomId) io.to(roomId).emit('producer-resumed', { producerId: producerId });
  });

  // ── stage-invite ───────────────────────────────────────────────────────
  socket.on('stage-invite', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId  = socket.data.roomId;
    var guestId = String(data.guestId || '');
    if (!roomId || !guestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestId)) return;
    // Find the target viewer's socket and send them a pending invite
    var found = false;
    io.sockets.sockets.forEach(function(s) {
      if (s.data.userId === guestId && s.data.roomId === roomId) {
        s.emit('stage-invite-pending', {
          invitedBy: socket.data.username || 'Host',
          hostSocketId: socket.id,
          guestId: guestId,
        });
        found = true;
      }
    });
    // Fallback: if viewer not found via socket (e.g. reconnecting), add them directly
    if (!found) {
      io.to(roomId).emit('stage-invite', { guestId: guestId, invitedBy: socket.data.userId });
      io.to(roomId).emit('hand-lower',   { guestId: guestId });
    }
  });

  socket.on('stage-invite-accept', function(data) {
    var roomId  = socket.data.roomId;
    var guestId = socket.data.userId;
    if (!roomId || !guestId) return;
    io.to(roomId).emit('stage-invite', { guestId: guestId, invitedBy: data.hostSocketId || '' });
    io.to(roomId).emit('hand-lower',   { guestId: guestId });
    // Notify the host
    if (data.hostSocketId) {
      var hostSock = io.sockets.sockets.get(data.hostSocketId);
      if (hostSock) hostSock.emit('stage-invite-accepted', { username: socket.data.username || guestId });
    }
  });

  socket.on('stage-invite-decline', function(data) {
    var guestId = socket.data.userId;
    if (data.hostSocketId) {
      var hostSock = io.sockets.sockets.get(data.hostSocketId);
      if (hostSock) hostSock.emit('stage-invite-declined', { username: socket.data.username || guestId });
    }
  });

  // ── pin-chat-message / unpin-chat-message ──────────────────────────────
  socket.on('pin-chat-message', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId || !data || !data.message) return;
    var pinned = {
      id:       String(data.id || ''),
      username: String(data.username || '').slice(0, 80),
      message:  String(data.message || '').slice(0, 300),
      ts:       data.ts || 0,
    };
    pinnedMessages.set(roomId, pinned);
    io.to(roomId).emit('chat-pinned', pinned);
  });

  socket.on('unpin-chat-message', function() {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    pinnedMessages.delete(roomId);
    io.to(roomId).emit('chat-unpinned', {});
  });

  // ── set-slow-mode ──────────────────────────────────────────────────────
  socket.on('set-slow-mode', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var VALID = [0, 3, 5, 10, 30, 60];
    var sec = Number(data && data.seconds);
    if (!VALID.includes(sec)) sec = 0;
    slowModeSeconds.set(roomId, sec);
    io.to(roomId).emit('slow-mode-update', { seconds: sec });
  });

  // ── stage-remove ───────────────────────────────────────────────────────
  socket.on('stage-remove', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId  = socket.data.roomId;
    var guestId = String(data.guestId || '');
    if (!roomId || !guestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestId)) return;
    io.to(roomId).emit('stage-remove', { guestId: guestId });
  });

  // ── mute-guest ─────────────────────────────────────────────────────────
  socket.on('mute-guest', function(data) {
    var roomId  = socket.data.roomId;
    var guestId = String(data.guestId || '');
    if (!roomId || !guestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestId)) return;
    if (socket.data.role !== 'host') return;
    var producerIds = mediasoup.getProducerIdsByGuest(guestId);
    producerIds.forEach(function(pid) { mediasoup.pauseProducer(pid); });
    io.to(roomId).emit('guest-muted', { guestId: guestId });
  });

  // ── unmute-guest ───────────────────────────────────────────────────────
  socket.on('unmute-guest', function(data) {
    var roomId  = socket.data.roomId;
    var guestId = String(data.guestId || '');
    if (!roomId || !guestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestId)) return;
    if (socket.data.role !== 'host') return;
    var producerIds = mediasoup.getProducerIdsByGuest(guestId);
    producerIds.forEach(function(pid) { mediasoup.resumeProducer(pid); });
    io.to(roomId).emit('guest-unmuted', { guestId: guestId });
  });

  // ── kick-guest ─────────────────────────────────────────────────────────
  socket.on('kick-guest', function(data) {
    var roomId  = socket.data.roomId;
    var guestId = String(data.guestId || '');
    if (!roomId || !guestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestId)) return;
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
    var roomId  = socket.data.roomId;
    var guestId = String(data.guestId || '');
    var newRole = data.role;
    if (!roomId || !guestId || !newRole) return;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestId)) return;
    if (socket.data.role !== 'host') return;
    var validRoles = ['cohost', 'guest', 'viewer'];
    if (validRoles.indexOf(newRole) === -1) return;

    var room = rooms.get(roomId);
    if (!room) return;

    room.guests.forEach(function(g, sid) {
      if (g.guestId === guestId) {
        g.role = newRole;
        // Sync socket.data.role on the live socket so per-event guards see the new role immediately
        var targetSocket = io.sockets.sockets.get(sid);
        if (targetSocket) targetSocket.data.role = newRole;
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
    var roomId   = socket.data.roomId;
    var newName  = String(data.username || '').trim().slice(0, 32);
    if (!roomId || !newName) return;
    var _unNow = Date.now();
    if (_unNow - (updateUsernameThrottle.get(socket.data.userId) || 0) < 2000) return;
    updateUsernameThrottle.set(socket.data.userId, _unNow);

    socket.data.username = newName;

    var room = rooms.get(roomId);
    if (room && room.guests.has(socket.id)) {
      var g = room.guests.get(socket.id);
      room.guests.set(socket.id, Object.assign({}, g, { username: newName }));

      // Only broadcast room-wide events for sockets that are panel guests/hosts — not
      // pure viewer sockets which could otherwise spam username-updated to the room.
      io.to(roomId).emit('username-updated', { userId: socket.data.userId || socket.data.guestId, username: newName });

      var guestList = [];
      room.guests.forEach(function(g) {
        guestList.push({ guestId: g.guestId, username: g.username, role: g.role });
      });
      io.to(roomId).emit('roster-update', { guests: guestList });
    }
  });

  // ── chat-message ───────────────────────────────────────────────────────
  socket.on('chat-message', function(data) {
    var roomId   = socket.data.roomId;
    var username = socket.data.username || 'Guest';
    var message  = String(data.message || '').slice(0, 500);
    var userId   = socket.data.userId;

    if (!roomId || !message.trim()) return;

    var _cmNow = Date.now();
    var _cmKey = socket.data.userId || socket.id;
    if (_cmNow - (chatMsgThrottle.get(_cmKey) || 0) < 500) return;
    chatMsgThrottle.set(_cmKey, _cmNow);

    // Detect external links — flag so frontends can display a safety indicator
    var _EXT_URL = /https?:\/\/([^\s/]+)/gi;
    var _ownHosts = /^(www\.)?seewhylive\.online$/i;
    var _hasExternalLinks = false;
    var _urlMatch;
    _EXT_URL.lastIndex = 0;
    while ((_urlMatch = _EXT_URL.exec(message)) !== null) {
      if (!_ownHosts.test(_urlMatch[1])) { _hasExternalLinks = true; break; }
    }

    // Spam check — keyed by userId so reconnect doesn't bypass a 60s mute
    var _swKey = socket.data.userId || socket.id;
    if (swanybot.isSocketMuted(_swKey)) {
      io.to(socket.id).emit('muted', { reason: 'Too many messages' });
      return;
    }
    // Slow mode check — skip for host/cohost
    var _smSec = slowModeSeconds.get(roomId) || 0;
    if (_smSec > 0 && socket.data.role !== 'host' && socket.data.role !== 'cohost') {
      var _smKey  = roomId + ':' + userId;
      var _smLast = slowModeUserTs.get(_smKey) || 0;
      var _smWait = Math.ceil((_smLast + _smSec * 1000 - Date.now()) / 1000);
      if (_smWait > 0) {
        io.to(socket.id).emit('chat-slow-mode', { waitSeconds: _smWait, slowSeconds: _smSec });
        return;
      }
      slowModeUserTs.set(_smKey, Date.now());
    }

    swanybot.onChatMessage(roomId, _swKey, message, { username: username, userId: _swKey, room: rooms.get(roomId) });

    // !so / !shoutout command — host/cohost only
    var _soMatch = /^\s*!(so|shoutout)\s+@?(\S+)/i.exec(message);
    if (_soMatch && (socket.data.role === 'host' || socket.data.role === 'cohost')) {
      var _soUser = String(_soMatch[2]).slice(0, 60);
      var _soTs   = Math.floor(Date.now() / 1000);
      io.to(roomId).emit('shoutout', { username: _soUser, by: username, ts: _soTs });
      io.to(roomId).emit('chat-message', {
        id: uuidv4(), username: '🎤 SeeWhy',
        message: '🎤 Shoutout to @' + _soUser + '! Shown to everyone in the room.',
        translated: '🎤 Shoutout to @' + _soUser + '!',
        lang: 'EN', hasExternalLinks: false, isSystem: true, ts: _soTs,
      });
    }

    // !kick @username command — host/cohost only
    var _kickMatch = /^\s*!kick\s+@?(\S+)/i.exec(message);
    if (_kickMatch && (socket.data.role === 'host' || socket.data.role === 'cohost')) {
      var _kickTarget = String(_kickMatch[1]).slice(0, 60).toLowerCase();
      var _kickTs     = Math.floor(Date.now() / 1000);
      var _kicked     = false;
      var _kickRoom   = rooms.get(roomId);
      if (_kickRoom) {
        _kickRoom.guests.forEach(function(g, sid) {
          if (g.guestId === socket.data.userId) return;
          if ((g.username || '').toLowerCase() === _kickTarget) {
            var _tSock = io.sockets.sockets.get(sid);
            if (_tSock) { _tSock.emit('you-were-kicked', { roomId: roomId }); _tSock.disconnect(true); _kicked = true; }
            _kickRoom.guests.delete(sid);
          }
        });
      }
      if (!_kicked) {
        var _kickRoomSocks = io.sockets.adapter.rooms.get(roomId);
        if (_kickRoomSocks) {
          _kickRoomSocks.forEach(function(sid) {
            var s = io.sockets.sockets.get(sid);
            if (s && s.data.userId !== socket.data.userId && (s.data.username || '').toLowerCase() === _kickTarget) {
              s.emit('you-were-kicked', { roomId: roomId });
              s.disconnect(true);
              _kicked = true;
            }
          });
        }
      }
      io.to(roomId).emit('chat-message', {
        id: uuidv4(), username: '🛡 SeeWhy',
        message:    _kicked ? ('🦶 @' + _kickTarget + ' was kicked from the room.') : ('⚠ @' + _kickTarget + ' not found in room.'),
        translated: _kicked ? ('🦶 @' + _kickTarget + ' was kicked from the room.') : ('⚠ @' + _kickTarget + ' not found in room.'),
        lang: 'EN', hasExternalLinks: false, isSystem: true, ts: _kickTs,
      });
      return;
    }

    // !ban @username command — host only
    var _banMatch = /^\s*!ban\s+@?(\S+)/i.exec(message);
    if (_banMatch && socket.data.role === 'host') {
      var _banTarget = String(_banMatch[1]).slice(0, 60).toLowerCase();
      var _banTs     = Math.floor(Date.now() / 1000);
      var _banned    = false;
      var _banUserId = null;
      var _banRoom   = rooms.get(roomId);
      if (_banRoom) {
        _banRoom.guests.forEach(function(g, sid) {
          if (g.guestId === socket.data.userId) return;
          if ((g.username || '').toLowerCase() === _banTarget) {
            _banUserId = g.guestId || g.userId || null;
            var _bSock = io.sockets.sockets.get(sid);
            if (_bSock) { _bSock.emit('you-were-kicked', { roomId: roomId }); _bSock.disconnect(true); _banned = true; }
            _banRoom.guests.delete(sid);
          }
        });
      }
      if (!_banned) {
        var _banRoomSocks = io.sockets.adapter.rooms.get(roomId);
        if (_banRoomSocks) {
          _banRoomSocks.forEach(function(sid) {
            var s = io.sockets.sockets.get(sid);
            if (s && s.data.userId !== socket.data.userId && (s.data.username || '').toLowerCase() === _banTarget) {
              _banUserId = s.data.userId || null;
              s.emit('you-were-kicked', { roomId: roomId });
              s.disconnect(true);
              _banned = true;
            }
          });
        }
      }
      if (_banUserId) {
        io.to(roomId).emit('user-banned', { userId: _banUserId, ts: _banTs });
      }
      io.to(roomId).emit('chat-message', {
        id: uuidv4(), username: '🛡 SeeWhy',
        message:    _banned ? ('🚫 @' + _banTarget + ' has been banned from this room.') : ('⚠ @' + _banTarget + ' not found in room.'),
        translated: _banned ? ('🚫 @' + _banTarget + ' has been banned from this room.') : ('⚠ @' + _banTarget + ' not found in room.'),
        lang: 'EN', hasExternalLinks: false, isSystem: true, ts: _banTs,
      });
      return;
    }

    // !help command — list available chat commands (private reply to sender only)
    if (/^\s*!help\s*$/i.test(message)) {
      var _helpTs  = Math.floor(Date.now() / 1000);
      var _isHost  = socket.data.role === 'host' || socket.data.role === 'cohost';
      var _helpMsg = _isHost
        ? '📋 Commands: !clip · !so @user · !kick @user · !ban @user (host) · !help'
        : '📋 Commands: !clip (request a highlight clip) · !help';
      io.to(socket.id).emit('chat-message', {
        id: uuidv4(), username: '🛡 SeeWhy',
        message: _helpMsg, translated: _helpMsg,
        lang: 'EN', hasExternalLinks: false, isSystem: true, ts: _helpTs,
      });
      return;
    }

    // !clip / "clip that" command — any viewer can request a clip marker
    if (/^\s*(!clip|clip that)\s*$/i.test(message)) {
      var _clipId  = uuidv4();
      var _clipTs  = Math.floor(Date.now() / 1000);
      var _clipLbl = '✂️ Clipped by ' + username;
      try {
        db.prepare('INSERT OR IGNORE INTO clip_markers (id, room_id, ts, label, marked_by) VALUES (?, ?, ?, ?, ?)').run(_clipId, roomId, _clipTs, _clipLbl, username);
      } catch (_ce) { logger.warn('[!clip] db: ' + _ce.message); }
      io.sockets.sockets.forEach(function(s) {
        if (s.data.roomId === roomId && (s.data.role === 'host' || s.data.role === 'cohost')) {
          s.emit('clip-marked', { id: _clipId, label: _clipLbl, ts: _clipTs });
        }
      });
      io.to(roomId).emit('chat-message', {
        id: uuidv4(), username: '✂️ SeeWhy', message: username + ' clipped it!',
        translated: username + ' clipped it!', lang: 'EN', hasExternalLinks: false, isSystem: true, ts: _clipTs,
      });
    }

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
          id:              msgId,
          username:        username,
          message:         message,
          translated:      result.translated,
          lang:            result.detectedLang,
          hasExternalLinks: _hasExternalLinks,
          ts:              ts
        });
      })
      .catch(function(err) {
        logger.error('[chat-message] translation failed: ' + err.message);
        // Still emit the original message
        var msgId = uuidv4();
        var ts    = Math.floor(Date.now() / 1000);
        io.to(roomId).emit('chat-message', {
          id:              msgId,
          username:        username,
          message:         message,
          translated:      message,
          lang:            'UNK',
          hasExternalLinks: _hasExternalLinks,
          ts:              ts
        });
      });
  });

  // ── send-gift ──────────────────────────────────────────────────────────
  socket.on('send-gift', function(data) {
    if (!socket.data.userId || socket.data.userId.startsWith('anon')) return;
    var _sgNow = Date.now();
    if (_sgNow - (sendGiftThrottle.get(socket.data.userId) || 0) < 1000) return;
    sendGiftThrottle.set(socket.data.userId, _sgNow);
    var roomId                 = socket.data.roomId;
    var fromUser               = socket.data.username || 'Guest';
    var fromUserId             = socket.data.userId;
    var emoji                  = String(data.emoji || '').slice(0, 4);
    var name                   = String(data.name || 'Gift').slice(0, 60);
    var valueCents             = Math.floor(data.valueCents || 0);
    if (valueCents > 50000) return;
    var _tgRaw = data.toGuestId || null;
    var toGuestId = (_tgRaw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(_tgRaw))) ? String(_tgRaw) : null;
    var _rawSAId = String(data.creatorStripeAccountId || '');
    var creatorStripeAccountId = /^acct_[A-Za-z0-9]{8,32}$/.test(_rawSAId) ? _rawSAId : '';

    if (!roomId || valueCents < 0) return;
    // Monetary gifts require a Stripe account — prevents analytics inflation from unverified amounts
    if (valueCents > 0 && !creatorStripeAccountId) return;

    var creatorCents  = Math.floor(valueCents * CREATOR);
    var platformCents = valueCents - creatorCents;
    var giftId        = uuidv4();
    var ts            = Math.floor(Date.now() / 1000);

    try {
      db.prepare(
        'INSERT INTO gifts (id, room_id, from_user, emoji, name, value_cents, creator_cents, platform_cents, ts, to_guest_id)' +
        ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(giftId, roomId, fromUser, emoji, name, valueCents, creatorCents, platformCents, ts, toGuestId);
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
      toGuestId:     toGuestId,
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
      var existingIdx = lb.findIndex(function(e) { return e.userId === fromUserId; });
      if (existingIdx >= 0) {
        lb[existingIdx].totalCents += valueCents;
        lb[existingIdx].username = fromUser;
      } else {
        lb.push({ userId: fromUserId, username: fromUser, totalCents: valueCents });
      }
      lb.sort(function(a, b) { return b.totalCents - a.totalCents; });
      if (lb.length > 500) lb = lb.slice(0, 500);
      giftLeaderboards.set(roomId, lb);
      io.to(roomId).emit('gift-leaderboard', { roomId: roomId, leaders: lb.slice(0, 10) });
    } catch(lbErr) { logger.warn('[gift-lb] ' + lbErr.message); }

    // If a PK battle is active, emit gift boost notification to room
    if (pkVotes.has(roomId)) {
      io.to(roomId).emit('pk-gift-boost', { from: fromUser, emoji: emoji, name: name, valueCents: valueCents, ts: ts });
    }

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

  // ── merch-order ────────────────────────────────────────────────────────
  socket.on('merch-order', function(data) {
    if (!socket.data.userId || socket.data.userId.startsWith('anon')) return;
    var _moThNow = Date.now();
    if (_moThNow - (merchOrderThrottle.get(socket.data.userId) || 0) < 2000) return;
    merchOrderThrottle.set(socket.data.userId, _moThNow);
    var roomId     = socket.data.roomId;
    var buyerUser  = socket.data.username || 'Guest';
    var itemName   = String(data.itemName || 'Merch').slice(0, 80);
    var priceCents = Math.floor(data.priceCents || 0);
    var _moTgRaw = data.toGuestId || null;
    var toGuestId = (_moTgRaw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(_moTgRaw))) ? String(_moTgRaw) : null;

    if (!roomId || priceCents <= 0 || priceCents > 50000) return;

    var creatorCents  = Math.floor(priceCents * CREATOR);
    var platformCents = priceCents - creatorCents;
    var orderId       = uuidv4();
    var ts            = Math.floor(Date.now() / 1000);

    try {
      db.prepare(
        'INSERT INTO gifts (id, room_id, from_user, emoji, name, value_cents, creator_cents, platform_cents, ts, to_guest_id)' +
        ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(orderId, roomId, buyerUser, '👕', itemName, priceCents, creatorCents, platformCents, ts, toGuestId);
    } catch (dbErr) {
      logger.error('[merch-order] DB insert failed: ' + dbErr.message);
    }

    try {
      var mRoom = rooms.get(roomId);
      var hostId = mRoom ? (mRoom.hostUserId || mRoom.hostSocketId) : roomId;
      analytics.recordEarning(hostId, roomId, 'merch', priceCents, itemName + ' by ' + buyerUser);
    } catch(ae) { logger.warn('[merch-order] analytics: ' + ae.message); }

    io.to(roomId).emit('merch-order-received', {
      id:            orderId,
      buyerUser:     buyerUser,
      itemName:      itemName,
      priceCents:    priceCents,
      creatorCents:  creatorCents,
      platformCents: platformCents,
      toGuestId:     toGuestId,
      ts:            ts
    });

    if (priceCents >= 100) {
      autoAura(roomId, function(cb) { aura.triggerGift(roomId, buyerUser, itemName, priceCents, cb); });
    }
  });

  // ── speaking ───────────────────────────────────────────────────────────
  socket.on('speaking', function(data) {
    var roomId  = socket.data.roomId;
    var guestId = socket.data.guestId;
    if (!roomId || !guestId) return;
    var _spNow = Date.now();
    if (_spNow - (speakingThrottle.get(socket.data.userId) || 0) < 250) return;
    speakingThrottle.set(socket.data.userId, _spNow);
    io.to(roomId).emit('speaking', { guestId: guestId, speaking: data.speaking });
    // Upgrade active-speaker video to r2 (900 kbps) while speaking;
    // drop back to r0 (100 kbps) when silent — O(subscribers) but fine for ≤20 seats.
    mediasoup.setPreferredLayersByGuestId(guestId, data.speaking ? 2 : 0).catch(function() {});
  });

  // ── hand-raise ─────────────────────────────────────────────────────────
  socket.on('hand-raise', function(data) {
    var roomId   = socket.data.roomId;
    var guestId  = socket.data.guestId;
    var username = socket.data.username || guestId;
    if (!roomId) return;
    var _hrNow = Date.now();
    if (_hrNow - (handRaiseThrottle.get(socket.data.userId) || 0) < 500) return;
    handRaiseThrottle.set(socket.data.userId, _hrNow);
    io.to(roomId).emit('hand-raise', { guestId: guestId, username: username, ts: Math.floor(Date.now() / 1000) });
  });

  // ── hand-lower ─────────────────────────────────────────────────────────
  socket.on('hand-lower', function(data) {
    var roomId  = socket.data.roomId;
    if (!roomId) return;
    var _hlNow = Date.now();
    if (_hlNow - (handRaiseThrottle.get(socket.data.userId) || 0) < 500) return;
    handRaiseThrottle.set(socket.data.userId, _hlNow);
    var _hlGuest;
    if (socket.data.role === 'host' || socket.data.role === 'cohost') {
      var _hlRaw = String((data && data.guestId) || socket.data.guestId || '');
      if (_hlRaw && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(_hlRaw)) return;
      _hlGuest = _hlRaw || socket.data.guestId;
    } else {
      _hlGuest = socket.data.guestId;
    }
    io.to(roomId).emit('hand-lower', { guestId: _hlGuest });
  });

  // ── mute-all ───────────────────────────────────────────────────────────
  socket.on('mute-all', function(data) {
    var roomId = socket.data.roomId;
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
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room   = getRoom(roomId);
    var locked = Boolean(data && data.locked);
    room.stageLocked = locked;
    io.to(roomId).emit('stage-lock-update', { locked: locked });
  });

  // ── overlay-update ────────────────────────────────────────────────────
  socket.on('overlay-update', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId || !data.overlay) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var safeOverlay;
    try {
      var _ovStr = JSON.stringify(data.overlay);
      if (!_ovStr || _ovStr.length > 4096) return;
      safeOverlay = JSON.parse(_ovStr);
    } catch(e) { return; }
    io.to(roomId).emit('overlay-update', { overlay: safeOverlay });
  });

  // ── watch-party ────────────────────────────────────────────────────────
  socket.on('watch-party-start', function(data) {
    var roomId = socket.data.roomId;
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
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (!data.videoId && !data.url) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var safeUrl = '';
    var urlDomain = '';
    if (data.url) {
      if (!/^https:\/\//i.test(String(data.url))) return;
      safeUrl = String(data.url).slice(0, 500);
      try {
        urlDomain = new URL(safeUrl).hostname.replace(/^www\./, '');
      } catch (_) { urlDomain = ''; }
    }
    // Validate YouTube video IDs (11 alphanumeric/dash/underscore chars)
    var _wpVideoId = null;
    if (data.videoId) {
      var _rawVid = String(data.videoId).slice(0, 200);
      _wpVideoId = /^[A-Za-z0-9_-]{11}$/.test(_rawVid) ? _rawVid : null;
      if (!_wpVideoId && !safeUrl) return;
    }
    var room = getRoom(roomId);
    if (!room.watchParty) room.watchParty = { playing: false, position: 0, ts: Date.now() };
    var WATCH_PARTY_TYPES = ['youtube', 'twitch', 'direct'];
    var rawType = data.type || (data.videoId ? 'youtube' : 'direct');
    var type = WATCH_PARTY_TYPES.includes(String(rawType)) ? String(rawType) : 'direct';
    room.watchParty.videoId   = _wpVideoId;
    room.watchParty.url       = safeUrl;
    room.watchParty.type      = type;
    room.watchParty.urlDomain = urlDomain;
    io.to(roomId).emit('watch-party-url', { videoId: _wpVideoId, url: safeUrl, type: type, urlDomain: urlDomain });
  });

  socket.on('watch-party-play', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room = getRoom(roomId);
    var now = Date.now();
    var _rawPos = Number(data.position);
    var position = (Number.isFinite(_rawPos) && _rawPos >= 0 && _rawPos <= 86400) ? _rawPos : 0;
    if (!room.watchParty) room.watchParty = {};
    room.watchParty.playing  = true;
    room.watchParty.position = position;
    room.watchParty.ts       = now;
    io.to(roomId).emit('watch-party-play', { position: position, timestamp: now });
  });

  socket.on('watch-party-pause', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room = getRoom(roomId);
    var _rawPausePos = Number(data.position);
    var position = (Number.isFinite(_rawPausePos) && _rawPausePos >= 0 && _rawPausePos <= 86400) ? _rawPausePos : 0;
    if (!room.watchParty) room.watchParty = {};
    room.watchParty.playing  = false;
    room.watchParty.position = position;
    room.watchParty.ts       = Date.now();
    io.to(roomId).emit('watch-party-pause', { position: position });
  });

  socket.on('watch-party-seek', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var seekPos = Number(data.position);
    if (!Number.isFinite(seekPos) || seekPos < 0 || seekPos > 86400) return;
    var room = getRoom(roomId);
    if (!room.watchParty) room.watchParty = {};
    room.watchParty.position = seekPos;
    room.watchParty.ts       = Date.now();
    io.to(roomId).emit('watch-party-seek', { position: seekPos });
  });

  // Host pushes a full sync to all room viewers
  socket.on('watch-party-sync', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room = getRoom(roomId);
    if (!room.watchParty) room.watchParty = {};
    if (data.videoId !== undefined) {
      var _swVid = data.videoId ? String(data.videoId).slice(0, 200) : null;
      room.watchParty.videoId = (_swVid && /^[A-Za-z0-9_-]{11}$/.test(_swVid)) ? _swVid : null;
    }
    if (data.url !== undefined) {
      if (!/^https:\/\//i.test(String(data.url))) return;
      room.watchParty.url = String(data.url).slice(0, 500);
    }
    if (data.type !== undefined) {
      var SYNC_PARTY_TYPES = ['youtube', 'twitch', 'direct'];
      room.watchParty.type = SYNC_PARTY_TYPES.includes(String(data.type)) ? String(data.type) : 'direct';
    }
    room.watchParty.playing  = !!data.playing;
    var _syncRawPos = Number(data.position);
    room.watchParty.position = (Number.isFinite(_syncRawPos) && _syncRawPos >= 0 && _syncRawPos <= 86400) ? _syncRawPos : 0;
    room.watchParty.ts       = Date.now();
    io.to(roomId).emit('watch-party-sync', {
      videoId:  room.watchParty.videoId,
      url:      room.watchParty.url || '',
      type:     room.watchParty.type || 'youtube',
      playing:  room.watchParty.playing,
      position: room.watchParty.position,
      ts:       room.watchParty.ts
    });
  });

  // Request current watch party state (for late-joining guests/viewers)
  socket.on('watch-party-sync-request', function(data) {
    var roomId = socket.data.roomId;
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
    var roomId = socket.data.roomId;
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
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId || !data.trigger) return;
    io.to(roomId).emit('bot-trigger-added', { trigger: String(data.trigger).slice(0, 300) });
  });

  socket.on('bot-remove-trigger', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId || !data.triggerId) return;
    var _triggerId = String(data.triggerId).slice(0, 100);
    if (!_triggerId) return;
    io.to(roomId).emit('bot-trigger-removed', { triggerId: _triggerId });
  });

  // ── room settings (audio-only, private, paywall) ──────────────────────
  socket.on('room-audio-only', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    if (data.enabled) roomAudioOnly.set(roomId, true); else roomAudioOnly.delete(roomId);
    io.to(roomId).emit('room-audio-only', { enabled: Boolean(data.enabled), ts: Math.floor(Date.now() / 1000) });
  });

  socket.on('room-private', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    if (data.enabled) roomPrivateMap.set(roomId, true); else roomPrivateMap.delete(roomId);
    io.to(roomId).emit('room-private', { enabled: Boolean(data.enabled), ts: Math.floor(Date.now() / 1000) });
  });

  socket.on('room-paywall', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var amountCents = Math.min(50000, Math.floor(data.amountCents || 0));
    if (data.enabled) roomPaywallMap.set(roomId, { amountCents: amountCents }); else roomPaywallMap.delete(roomId);
    io.to(roomId).emit('room-paywall', { enabled: Boolean(data.enabled), amountCents: amountCents, ts: Math.floor(Date.now() / 1000) });
  });

  // ── subscribe ──────────────────────────────────────────────────────────
  socket.on('follow-creator', function(data) {
    if (!socket.data.userId || socket.data.userId.startsWith('anon')) return;
    var roomId   = socket.data.roomId;
    var follower = socket.data.username || 'Viewer';
    var creator  = String((data && data.username) || '').slice(0, 80);
    if (!roomId || !creator) return;
    io.to(roomId).emit('creator-followed', { follower: follower, creator: creator, ts: Math.floor(Date.now() / 1000) });
  });

  socket.on('subscribe', function(data) {
    if (!socket.data.userId || socket.data.userId.startsWith('anon')) return;
    // Rate-limit: one subscription announcement per user per 60 s to prevent AURA-call spam
    var _subNow = Date.now();
    if (_subNow - (subscribeThrottle.get(socket.data.userId) || 0) < 60000) return;
    subscribeThrottle.set(socket.data.userId, _subNow);
    var roomId     = socket.data.roomId;
    var fromUser   = socket.data.username || 'Guest';
    var VALID_TIERS = ['bronze', 'silver', 'gold'];
    var tier        = VALID_TIERS.includes(String(data.tier || '')) ? String(data.tier) : 'bronze';
    var priceCents = Math.floor(data.price_cents || 0);
    if (!Number.isFinite(priceCents) || priceCents < 0 || priceCents > 50000) return;
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
    var roomId = socket.data.roomId;
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
    var _rawDur = Number(data.durationSec);
    var pollDur = Math.min(Math.max(Number.isFinite(_rawDur) ? Math.floor(_rawDur) : 60, 5), 300);
    poll.autoEndT = setTimeout(function() {
      if (polls.get(roomId) !== poll) return;
      poll.active = false;
      io.to(roomId).emit('poll-update', serializePoll(poll));
      setTimeout(function() { if (polls.get(roomId) === poll) polls.delete(roomId); }, 5000);
    }, pollDur * 1000);
  });

  socket.on('poll-vote', function(data) {
    var roomId    = socket.data.roomId;
    if (!roomId) return;
    var _pvNow = Date.now();
    var _pvKey = socket.data.userId || socket.id;
    if (_pvNow - (pollVoteThrottle.get(_pvKey) || 0) < 500) return;
    pollVoteThrottle.set(_pvKey, _pvNow);
    var optionIdx = Math.floor(data.optionIdx || 0);
    var poll      = polls.get(roomId);
    if (!poll || !poll.active) return;
    if (optionIdx < 0 || optionIdx >= poll.options.length) return;
    poll.options.forEach(function(o) { o.votes.delete(_pvKey); });
    poll.options[optionIdx].votes.add(_pvKey);
    io.to(roomId).emit('poll-update', serializePoll(poll));
  });

  socket.on('poll-end', function(data) {
    var roomId = socket.data.roomId;
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
    var roomId = socket.data.roomId;
    if (!roomId || !data.text) return;
    var _qaNow = Date.now();
    var _qaKey = socket.data.userId || socket.id;
    if (_qaNow - (qaQuestionThrottle.get(_qaKey) || 0) < 3000) return;
    qaQuestionThrottle.set(_qaKey, _qaNow);
    var text = String(data.text).slice(0, 300);
    var id   = uuidv4();
    var user = socket.data.username || 'Guest';
    if (!qaQueues.has(roomId)) qaQueues.set(roomId, new Map());
    var queue = qaQueues.get(roomId);
    if (queue.size >= 200) return;
    queue.set(id, { id: id, username: user, text: text, upvotes: 0, ts: Date.now() });
    io.to(roomId).emit('qa-question', { id: id, username: user, text: text, upvotes: 0 });
  });

  socket.on('qa-upvote', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId || !data.id) return;
    var _quId = String(data.id);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(_quId)) return;
    var _quNow = Date.now();
    var _quKey = socket.data.userId || socket.id;
    if (_quNow - (qaUpvoteThrottle.get(_quKey) || 0) < 500) return;
    qaUpvoteThrottle.set(_quKey, _quNow);
    var queue = qaQueues.get(roomId);
    if (!queue) return;
    var item = queue.get(_quId);
    if (!item) return;
    if (!item.upvoters) item.upvoters = new Set();
    if (item.upvoters.has(_quKey)) return;
    item.upvoters.add(_quKey);
    item.upvotes += 1;
    io.to(roomId).emit('qa-upvote', { id: _quId, upvotes: item.upvotes });
  });

  socket.on('qa-dismiss', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId || !data.id || socket.data.role !== 'host') return;
    var _qdId = String(data.id);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(_qdId)) return;
    var queue = qaQueues.get(roomId);
    if (queue) queue.delete(_qdId);
    io.to(roomId).emit('qa-dismissed', { id: _qdId });
  });

  // ── qa-answering / qa-answering-clear ─────────────────────────────────
  socket.on('qa-answering', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId || socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    if (!data || !data.id || !data.text) return;
    io.to(roomId).emit('qa-answering', {
      id:       String(data.id).slice(0, 60),
      username: String(data.username || '').slice(0, 80),
      text:     String(data.text).slice(0, 300),
    });
  });

  socket.on('qa-answering-clear', function() {
    var roomId = socket.data.roomId;
    if (!roomId || socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    io.to(roomId).emit('qa-answering-cleared', {});
  });

  // ── share-music ────────────────────────────────────────────────────────
  socket.on('share-music', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId || !data.title) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var title = String(data.title).slice(0, 120);
    var style = String(data.style || '').slice(0, 60);
    var emoji = String(data.emoji || '🎵').slice(0, 4);
    var user  = socket.data.username || 'Creator';
    io.to(roomId).emit('music-shared', { title: title, style: style, emoji: emoji, sharedBy: user, ts: Date.now() });
  });

  // ── watch-react ────────────────────────────────────────────────────────
  socket.on('watch-react', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId || !data.emoji) return;
    if (!socket.data.userId || socket.data.userId.startsWith('anon')) return;
    var emoji  = String(data.emoji).slice(0, 4);
    var now    = Date.now();
    var lastTs = viewerReactThrottle.get(socket.data.userId) || 0;
    if (now - lastTs < 1000) return;
    viewerReactThrottle.set(socket.data.userId, now);
    io.to(roomId).emit('watch-react', { emoji: emoji, userId: socket.data.userId || socket.id, ts: now });
  });

  // ── VS Poll ───────────────────────────────────────────────────────────
  socket.on('vs-start', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId || socket.data.role !== 'host') return;
    var sideA = String(data.sideA || 'Side A').slice(0, 60);
    var sideB = String(data.sideB || 'Side B').slice(0, 60);
    var _rawVsDur = Number(data.durationSec);
    var dur   = Math.min(Math.max(Number.isFinite(_rawVsDur) ? Math.floor(_rawVsDur) : 60, 10), 300);
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
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var _vvNow = Date.now();
    var _vvKey = socket.data.userId || socket.id;
    if (_vvNow - (vsVoteThrottle.get(_vvKey) || 0) < 500) return;
    vsVoteThrottle.set(_vvKey, _vvNow);
    var vp = vsPolls.get(roomId);
    if (!vp || !vp.active) return;
    var side = data.side; // 'A' or 'B'
    if (side !== 'A' && side !== 'B') return;
    vp.votesA.delete(_vvKey);
    vp.votesB.delete(_vvKey);
    if (side === 'A') vp.votesA.add(_vvKey);
    else vp.votesB.add(_vvKey);
    io.to(roomId).emit('vs-update', serializeVs(vp));
  });

  socket.on('vs-end', function(data) {
    var roomId = socket.data.roomId;
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
    var roomId = socket.data.roomId;
    if (!roomId || socket.data.role !== 'host') return;
    var uid  = String(data.userId || '');
    if (!uid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) return;
    var uname = String(data.username || 'Judge').slice(0, 40);
    if (!judgeRosters.has(roomId)) judgeRosters.set(roomId, new Map());
    var roster = judgeRosters.get(roomId);
    if (roster.size >= 50) return;
    roster.set(uid, { userId: uid, username: uname, scores: [] });
    io.to(roomId).emit('judges-update', serializeJudges(roomId));
  });

  socket.on('judge-remove', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId || socket.data.role !== 'host') return;
    var uid = String(data.userId || '').slice(0, 80);
    var roster = judgeRosters.get(roomId);
    if (roster) roster.delete(uid);
    io.to(roomId).emit('judges-update', serializeJudges(roomId));
  });

  socket.on('judge-score', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var _jsNow = Date.now();
    var uid = socket.data.userId || socket.id;
    if (_jsNow - (judgeScoreThrottle.get(uid) || 0) < 500) return;
    judgeScoreThrottle.set(uid, _jsNow);
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
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId   = socket.data.roomId;
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
    var roomId = socket.data.roomId;
    if (!roomId || !data.msgId || !data.emoji) return;
    var _crNow = Date.now();
    var _crKey = socket.data.userId || socket.id;
    if (_crNow - (viewerReactThrottle.get(_crKey) || 0) < 500) return;
    viewerReactThrottle.set(_crKey, _crNow);
    var _msgIdStr = String(data.msgId);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(_msgIdStr)) return;
    var emoji = String(data.emoji).slice(0, 4);

    if (!chatReactions.has(roomId)) chatReactions.set(roomId, new Map());
    var roomRxns = chatReactions.get(roomId);
    if (!roomRxns.has(data.msgId)) {
      if (roomRxns.size >= 500) return;
      roomRxns.set(data.msgId, new Map());
    }
    var msgRxns = roomRxns.get(data.msgId);
    if (!msgRxns.has(emoji)) msgRxns.set(emoji, new Set());
    var emojiSet = msgRxns.get(emoji);

    if (emojiSet.has(_crKey)) {
      emojiSet.delete(_crKey);
    } else {
      emojiSet.add(_crKey);
    }

    var serialized = {};
    msgRxns.forEach(function(set, em) {
      if (set.size > 0) serialized[em] = set.size;
    });

    io.to(roomId).emit('chat-react-update', { msgId: data.msgId, reactions: serialized });
  });

  // ── super-chat ─────────────────────────────────────────────────────────
  socket.on('super-chat', function(data) {
    if (!socket.data.userId || socket.data.userId.startsWith('anon')) return;
    var _scThNow = Date.now();
    if (_scThNow - (superChatThrottle.get(socket.data.userId) || 0) < 2000) return;
    superChatThrottle.set(socket.data.userId, _scThNow);
    var roomId      = socket.data.roomId;
    var username    = socket.data.username || 'Guest';
    var userId      = socket.data.userId;
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
      var scLbIdx = scLb.findIndex(function(e) { return e.userId === userId; });
      if (scLbIdx >= 0) { scLb[scLbIdx].totalCents += amountCents; scLb[scLbIdx].username = username; }
      else { scLb.push({ userId: userId, username: username, totalCents: amountCents }); }
      scLb.sort(function(a, b) { return b.totalCents - a.totalCents; });
      if (scLb.length > 500) scLb = scLb.slice(0, 500);
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

  // ── super-chat:tts (Voice SuperChat) ──────────────────────────────────────
  socket.on('super-chat:tts', function(data) {
    if (!socket.data.userId || socket.data.userId.startsWith('anon')) return;
    var _ttsNow = Date.now();
    if (_ttsNow - (superChatThrottle.get(socket.data.userId) || 0) < 2000) return;
    superChatThrottle.set(socket.data.userId, _ttsNow);
    var roomId      = socket.data.roomId;
    var username    = socket.data.username || 'Guest';
    var userId      = socket.data.userId;
    var message     = String(data.message || '').slice(0, 120).trim();
    var amountCents = Math.floor(data.amountCents || 0);
    var VALID_SC    = [100, 200, 500, 1000, 2000, 5000];
    if (!roomId || !message || VALID_SC.indexOf(amountCents) === -1) return;

    var rawVoice = data.voice || {};
    var voice = {
      id:    String(rawVoice.id    || 'anchor').slice(0, 20),
      label: String(rawVoice.label || 'Voice').slice(0, 30),
      emoji: String(rawVoice.emoji || '🎙').slice(0, 8),
      pitch: Math.min(2, Math.max(0, parseFloat(rawVoice.pitch) || 1)),
      rate:  Math.min(2, Math.max(0.5, parseFloat(rawVoice.rate) || 1)),
    };

    var creatorCents  = Math.floor(amountCents * CREATOR);
    var platformCents = amountCents - creatorCents;
    var ttsId         = uuidv4();
    var ts            = Math.floor(Date.now() / 1000);
    var TIER_COLORS   = { 100: '#C9A84C', 200: '#D4854A', 500: '#C9A84C', 1000: '#FF8C42', 2000: '#FF1A3C', 5000: '#800020' };
    var tierColor     = TIER_COLORS[amountCents] || '#C9A84C';

    try {
      db.prepare(
        'INSERT INTO super_chats (id, room_id, user_id, username, message, amount_cents, creator_cents, platform_cents, tier_color, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(ttsId, roomId, userId, username, message, amountCents, creatorCents, platformCents, tierColor, ts);
    } catch(e) {
      logger.error('[super-chat:tts] DB insert: ' + e.message);
    }

    var ttsAnalytics = getAnalytics(roomId);
    ttsAnalytics.sessionEarnings += amountCents;

    io.to(roomId).emit('super-chat:tts', {
      id:           ttsId,
      username:     username,
      message:      message,
      amountCents:  amountCents,
      creatorCents: creatorCents,
      tierColor:    tierColor,
      ts:           ts,
      voice:        voice,
    });

    autoAura(roomId, function(cb) { aura.triggerTip(roomId, username, amountCents, message, cb); });

    try {
      var ttsRoom = rooms.get(roomId);
      if (ttsRoom && ttsRoom.hostSocketId) {
        io.to(ttsRoom.hostSocketId).emit('earnings-update', {
          sessionCents: sessionRevenue.get(roomId) || 0,
          lastCents:    amountCents,
          source:       'super-chat',
          username:     username,
        });
      }
    } catch(eu) { logger.warn('[super-chat:tts] earnings-update: ' + eu.message); }

    try {
      var ttsLb = giftLeaderboards.get(roomId) || [];
      var ttsIdx = ttsLb.findIndex(function(e) { return e.userId === userId; });
      if (ttsIdx >= 0) { ttsLb[ttsIdx].totalCents += amountCents; ttsLb[ttsIdx].username = username; }
      else { ttsLb.push({ userId: userId, username: username, totalCents: amountCents }); }
      ttsLb.sort(function(a, b) { return b.totalCents - a.totalCents; });
      if (ttsLb.length > 500) ttsLb = ttsLb.slice(0, 500);
      giftLeaderboards.set(roomId, ttsLb);
      io.to(roomId).emit('gift-leaderboard', { roomId: roomId, leaders: ttsLb.slice(0, 10) });
    } catch(ttsLbErr) { logger.warn('[gift-lb-tts] ' + ttsLbErr.message); }

    var prevTtsRev = sessionRevenue.get(roomId) || 0;
    var newTtsRev  = prevTtsRev + amountCents;
    sessionRevenue.set(roomId, newTtsRev);
    for (var ttsMi = 0; ttsMi < REVENUE_MILESTONES_CENTS.length; ttsMi++) {
      var ttsMil = REVENUE_MILESTONES_CENTS[ttsMi];
      if (newTtsRev >= ttsMil && prevTtsRev < ttsMil) {
        swanybot.onRevenueMilestone(roomId, ttsMil);
        break;
      }
    }
  });

  // ── bracket-update ─────────────────────────────────────────────────────
  socket.on('bracket-update', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var _bStr; try { _bStr = JSON.stringify(data); } catch(e) { return; }
    if (!_bStr || _bStr.length > 8192) return;
    var safe; try { safe = JSON.parse(_bStr); } catch(e) { return; }
    io.to(roomId).emit('bracket-update', Object.assign(safe, { roomId: roomId }));
  });

  // ── chyron-update ──────────────────────────────────────────────────────
  socket.on('chyron-update', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var _cStr; try { _cStr = JSON.stringify(data); } catch(e) { return; }
    if (!_cStr || _cStr.length > 8192) return;
    var safe; try { safe = JSON.parse(_cStr); } catch(e) { return; }
    Object.assign(safe, { roomId: roomId });
    if (safe.text) { chyrons.set(roomId, safe); } else { chyrons.delete(roomId); }
    io.to(roomId).emit('chyron-update', safe);
  });

  socket.on('chyron-clear', function() {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    chyrons.delete(roomId);
    io.to(roomId).emit('chyron-clear', { roomId: roomId, ts: Math.floor(Date.now() / 1000) });
  });

  socket.on('stream-caption', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    if (!data || !data.text) return;
    socket.to(roomId).emit('stream-caption', { text: String(data.text).slice(0, 300), ts: Date.now() });
  });

  // ── PK Battle v2 vote aggregation ──────────────────────────────────────
  socket.on('pk-start', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var _pksStr; try { _pksStr = JSON.stringify(data); } catch(e) { return; }
    if (!_pksStr || _pksStr.length > 4096) return;
    var _pksSafe; try { _pksSafe = JSON.parse(_pksStr); } catch(e) { return; }
    pkVotes.set(roomId, { voters: new Map(), challenger: 0, defender: 0 });
    io.to(roomId).emit('pk-start', _pksSafe);
  });

  socket.on('pk-vote', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId || !data || !data.side) return;
    var votes = pkVotes.get(roomId);
    if (!votes) return;
    var pkUserId = socket.data.userId;
    if (!pkUserId || pkUserId.startsWith('anon')) return;
    if (votes.voters.has(pkUserId)) return;
    if (data.side !== 'challenger' && data.side !== 'defender') return;
    votes.voters.set(pkUserId, data.side);
    votes[data.side]++;
    io.to(roomId).emit('pk-vote-update', { challengerVotes: votes.challenger, defenderVotes: votes.defender });
  });

  socket.on('pk-end', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var _pkeStr; try { _pkeStr = JSON.stringify(data); } catch(e) { return; }
    if (!_pkeStr || _pkeStr.length > 4096) return;
    var _pkeSafe; try { _pkeSafe = JSON.parse(_pkeStr); } catch(e) { return; }
    pkVotes.delete(roomId);
    io.to(roomId).emit('pk-end', _pkeSafe);
  });

  socket.on('pk-sudden-death', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    io.to(roomId).emit('pk-sudden-death', { roomId: roomId, ts: Math.floor(Date.now() / 1000) });
  });

  // ── viewer-react ───────────────────────────────────────────────────────
  socket.on('viewer-react', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId || !data.emoji) return;
    if (!socket.data.userId || socket.data.userId.startsWith('anon')) return;
    var emoji  = String(data.emoji).slice(0, 4);
    var now    = Date.now();
    var lastTs = viewerReactThrottle.get(socket.data.userId) || 0;
    if (now - lastTs < 2000) return;
    viewerReactThrottle.set(socket.data.userId, now);
    io.to(roomId).emit('react-burst', { emoji: emoji, userId: socket.data.userId || socket.id, ts: now });
  });

  // ── collab events ─────────────────────────────────────────────────────
  socket.on('collab-request', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId   = socket.data.roomId;
    var fromUser = socket.data.username || 'Creator';
    if (!roomId) return;
    var _cNow = Date.now();
    if (_cNow - (collabThrottle.get(socket.data.userId) || 0) < 2000) return;
    collabThrottle.set(socket.data.userId, _cNow);
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
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId   = socket.data.roomId;
    var fromUser = socket.data.username || 'Host';
    if (!roomId) return;
    io.to(roomId).emit('collab-accept', {
      from:      fromUser,
      collabId:  String(data.collabId || '').slice(0, 80),
      partner:   (data.partner || '').slice(0, 80),
      ts:        Math.floor(Date.now() / 1000)
    });
  });

  socket.on('collab-message', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId   = socket.data.roomId;
    var fromUser = socket.data.username || 'Host';
    if (!roomId) return;
    io.to(roomId).emit('collab-message', {
      collabId: String(data.collabId || '').slice(0, 80),
      from:     fromUser,
      text:     (data.text || '').slice(0, 500),
      ts:       Math.floor(Date.now() / 1000)
    });
  });

  socket.on('portal-share', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
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
    var roomId = socket.data.roomId;
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
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var fadesEvent = /^[a-z0-9-]{1,32}$/i.test(String(data.event || '')) ? String(data.event) : '';
    if (!fadesEvent) return;
    var fadesScores;
    try {
      var _fStr = JSON.stringify(data.scores);
      if (_fStr && _fStr.length > 4096) return;
      fadesScores = JSON.parse(_fStr);
    } catch(e) { fadesScores = null; }
    io.to(roomId).emit('fades-event', {
      event:  fadesEvent,
      scores: fadesScores,
      ts:     Math.floor(Date.now() / 1000)
    });
  });

  // ── go-live ────────────────────────────────────────────────────────────
  socket.on('go-live', async function(data, ack) {
    var roomId      = socket.data.roomId;
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
      var _PRIV_GL = /^(localhost$|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.0\.0\.0|169\.254\.|::1$|::ffff:|fc00:|fd[0-9a-f]{2}:|fe80:|2002:7f|100\.(6[4-9]|[7-9]\d|1[0-2]\d)\.|^\d+$|^0x)/i;
      var _validDests = [];
      var _destList = Array.isArray(destinations) ? destinations.slice(0, 10) : [];
      for (var _gdi = 0; _gdi < _destList.length; _gdi++) {
        var _gd = _destList[_gdi];
        if (!_gd || !_gd.url) continue;
        var _gdp;
        try { _gdp = new URL(_gd.url); } catch(_) { continue; }
        if (!/^rtmps?:$/i.test(_gdp.protocol)) continue;
        if (!_gdp.hostname || _PRIV_GL.test(_gdp.hostname)) continue;
        try {
          var _gdDns = await require('dns').promises.lookup(_gdp.hostname);
          if (_PRIV_GL.test(_gdDns.address)) continue;
        } catch(_) { continue; }
        // For custom destinations rtmpUrl is used by buildFfmpegArgs — validate it too
        if (_gd.platform === 'custom' && _gd.rtmpUrl) {
          var _gdrp;
          try { _gdrp = new URL(String(_gd.rtmpUrl)); } catch(_) { continue; }
          if (!/^rtmps?:$/i.test(_gdrp.protocol)) continue;
          if (!_gdrp.hostname || _PRIV_GL.test(_gdrp.hostname)) continue;
          try {
            var _gdrDns = await require('dns').promises.lookup(_gdrp.hostname);
            if (_PRIV_GL.test(_gdrDns.address)) continue;
          } catch(_) { continue; }
        }
        _validDests.push(_gd);
      }
      try {
        rtmp.startFanout(roomId, socket.data.guestId, _validDests);
      } catch (err) {
        logger.error('[go-live] startFanout failed: ' + err.message);
        if (ack) ack({ error: 'Failed to start RTMP fanout' });
        return;
      }
    }

    var wasAlreadyLive = !!room.isLive;
    room.isLive        = true;
    room.liveStartedAt = room.liveStartedAt || now;
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

    // Send push notifications to all subscribers (once per go-live, not on replay)
    if (wasAlreadyLive) return;
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
    var sRoomId = socket.data.roomId;
    if (!sRoomId) return;
    var _asjNow = Date.now();
    if (_asjNow - (socket.data._lastAudioJoin || 0) < 2000) return;
    socket.data._lastAudioJoin = _asjNow;
    if (!stageRooms.has(sRoomId)) {
      stageRooms.set(sRoomId, { speakers: [], listeners: [] });
    }
    var stage = stageRooms.get(sRoomId);
    var uId   = String(socket.data.userId || socket.id);
    var uName = socket.data.username || 'Guest';
    var uRole = socket.data.role || 'viewer';

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
    var sRoomId = socket.data.stageRoomId || socket.data.roomId;
    if (!sRoomId) return;
    var _aslNow = Date.now();
    if (_aslNow - (socket.data._lastAudioLeave || 0) < 1000) return;
    socket.data._lastAudioLeave = _aslNow;
    var stage = stageRooms.get(sRoomId);
    if (!stage) return;
    var uId = String(socket.data.userId || socket.id);
    stage.speakers  = stage.speakers.filter(function(s)  { return String(s.userId) !== uId; });
    stage.listeners = stage.listeners.filter(function(l) { return String(l.userId) !== uId; });
    io.to(sRoomId).emit('audio-stage-update', { speakers: stage.speakers, listeners: stage.listeners });
  });

  socket.on('audio-stage-hand-raise', function(data) {
    var sRoomId = socket.data.stageRoomId || socket.data.roomId;
    if (!sRoomId) return;
    var _ashrNow = Date.now();
    if (_ashrNow - (socket.data._lastAudioHandRaise || 0) < 1000) return;
    socket.data._lastAudioHandRaise = _ashrNow;
    var stage = stageRooms.get(sRoomId);
    if (!stage) return;
    var uId = String(socket.data.userId || socket.id);
    var lst = stage.listeners.find(function(l) { return String(l.userId) === uId; });
    if (lst) { lst.handRaised = !!data.raised; }
    io.to(sRoomId).emit('audio-stage-update', { speakers: stage.speakers, listeners: stage.listeners });
  });

  socket.on('audio-stage-speaking', function(data) {
    var sRoomId = socket.data.stageRoomId || socket.data.roomId;
    if (!sRoomId) return;
    var _asNow = Date.now();
    if (_asNow - (speakingThrottle.get(socket.data.userId) || 0) < 250) return;
    speakingThrottle.set(socket.data.userId, _asNow);
    var stage = stageRooms.get(sRoomId);
    if (!stage) return;
    var uId = String(socket.data.userId || socket.id);
    var spk = stage.speakers.find(function(s) { return String(s.userId) === uId; });
    if (spk) { spk.speaking = !!data.speaking; }
    io.to(sRoomId).emit('audio-stage-update', { speakers: stage.speakers, listeners: stage.listeners });
  });

  socket.on('audio-stage-promote', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sRoomId = socket.data.roomId;
    if (!sRoomId) return;
    var stage = stageRooms.get(sRoomId);
    if (!stage) return;
    var targetId = String(data.targetUserId || '');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) return;
    var lstIdx = stage.listeners.findIndex(function(l) { return String(l.userId) === targetId; });
    if (lstIdx === -1) return;
    if (stage.speakers.length >= 20) return;
    var lst = stage.listeners.splice(lstIdx, 1)[0];
    stage.speakers.push({ userId: lst.userId, username: lst.username, speaking: false, muted: false });
    io.to(sRoomId).emit('audio-stage-update', { speakers: stage.speakers, listeners: stage.listeners });
  });

  socket.on('audio-stage-demote', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sRoomId = socket.data.roomId;
    if (!sRoomId) return;
    var stage = stageRooms.get(sRoomId);
    if (!stage) return;
    var targetId = String(data.targetUserId || '');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) return;
    var spkIdx = stage.speakers.findIndex(function(s) { return String(s.userId) === targetId; });
    if (spkIdx === -1) return;
    var spk = stage.speakers.splice(spkIdx, 1)[0];
    stage.listeners.push({ userId: spk.userId, username: spk.username, handRaised: false });
    io.to(sRoomId).emit('audio-stage-update', { speakers: stage.speakers, listeners: stage.listeners });
  });

  // ── Screen share handlers ──────────────────────────────────────────────
  socket.on('screen-share-start', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sRoomId = socket.data.roomId;
    if (!sRoomId) return;
    io.to(sRoomId).emit('screen-share-active', { userId: socket.data.userId, username: socket.data.username || 'Host' });
  });

  socket.on('screen-share-stop', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sRoomId = socket.data.roomId;
    if (!sRoomId) return;
    io.to(sRoomId).emit('screen-share-ended', {});
  });

  // ── Watch sync handler ─────────────────────────────────────────────────
  socket.on('watch-sync', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sRoomId = socket.data.roomId;
    if (!sRoomId) return;
    var WATCH_SYNC_ACTIONS = ['play', 'pause', 'seek', 'stop'];
    var safeWsAction = WATCH_SYNC_ACTIONS.includes(String(data.action || '')) ? String(data.action) : 'play';
    var _wsRawPos = Number(data.position);
    var safeWsPos = (Number.isFinite(_wsRawPos) && _wsRawPos >= 0 && _wsRawPos <= 86400) ? _wsRawPos : 0;
    io.to(sRoomId).emit('watch-sync', { action: safeWsAction, position: safeWsPos, timestamp: Date.now() });
  });

  // ── PK cheer handler ──────────────────────────────────────────────────
  socket.on('pk-cheer', function(data) {
    var cheerRoomId = socket.data.roomId;
    if (!cheerRoomId) return;
    var battle = vsPolls.get(cheerRoomId);
    if (!battle || !battle.active) return;
    var cheerSide = data.side === 'B' ? 'B' : 'A';
    if (!battle.cheerA) battle.cheerA = [];
    if (!battle.cheerB) battle.cheerB = [];
    if (!battle.cheerSids) battle.cheerSids = new Set();
    var _cheerKey = socket.data.userId || socket.id;
    if (battle.cheerSids.has(_cheerKey)) return;
    battle.cheerSids.add(_cheerKey);
    var user = socket.data.username || 'Viewer';
    var list = cheerSide === 'A' ? battle.cheerA : battle.cheerB;
    list.push(user);
    if (battle.cheerA.length > 20) battle.cheerA = battle.cheerA.slice(-20);
    if (battle.cheerB.length > 20) battle.cheerB = battle.cheerB.slice(-20);
    vsPolls.set(cheerRoomId, battle);
    io.to(cheerRoomId).emit('pk-cheer-update', { cheerA: battle.cheerA, cheerB: battle.cheerB });
  });

  // ── Watch stage pin handler ────────────────────────────────────────────
  socket.on('watch-stage-pin', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sRoomId = socket.data.roomId;
    if (!sRoomId) return;
    var _wspYtId = String(data.ytId || '');
    io.to(sRoomId).emit('watch-stage-pin', { ytId: /^[A-Za-z0-9_-]{11}$/.test(_wspYtId) ? _wspYtId : '' });
  });

  // ── Love micro-tip handler ─────────────────────────────────────────────
  socket.on('love-send', function(data) {
    if (!socket.data.userId || socket.data.userId.startsWith('anon')) return;
    var loveRoomId = socket.data.roomId;
    if (!loveRoomId) return;
    var _lsNow = Date.now();
    if (_lsNow - (loveThrottle.get(socket.data.userId) || 0) < 1000) return;
    loveThrottle.set(socket.data.userId, _lsNow);
    var prev = loveCounts.get(loveRoomId) || 0;
    var newTotal = prev + 1;
    loveCounts.set(loveRoomId, newTotal);
    var loveRoomEarnings = loveEarnings.get(loveRoomId) || { creator: 0, platform: 0 };
    loveRoomEarnings.creator  += 90;  // 90 microcents
    loveRoomEarnings.platform += 10;  // 10 microcents
    loveEarnings.set(loveRoomId, loveRoomEarnings);
    io.to(loveRoomId).emit('love-update', {
      total:      newTotal,
      lastSender: socket.data.username || 'Someone',
      roomId:     loveRoomId
    });
  });

  // ── Stream Goal handlers ──────────────────────────────────────────────
  socket.on('stream-goal-set', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sgRoomId = socket.data.roomId;
    if (!sgRoomId) return;
    var GOAL_TYPES = ['viewers', 'revenue', 'duration', 'gifts'];
    var goalType  = GOAL_TYPES.includes(String(data.type || '')) ? String(data.type) : 'viewers';
    var goalLabel = data.label ? String(data.label).slice(0, 80) : null;
    var _rawTarget = Number(data.target);
    var goalTarget = (Number.isFinite(_rawTarget) && _rawTarget > 0) ? Math.min(Math.floor(_rawTarget), 10000000) : 0;
    streamGoals.set(sgRoomId, { type: goalType, target: goalTarget, label: goalLabel });
    io.to(sgRoomId).emit('stream-goal-set', {
      roomId:  sgRoomId,
      type:    goalType,
      target:  goalTarget,
      label:   goalLabel
    });
  });

  socket.on('stream-goal-clear', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sgcRoomId = socket.data.roomId;
    if (!sgcRoomId) return;
    streamGoals.delete(sgcRoomId);
    io.to(sgcRoomId).emit('stream-goal-clear', { roomId: sgcRoomId });
  });

  // ── Sound FX handler ────────────────────────────────────────────────────
  socket.on('sound-fx', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sfxRoomId = socket.data.roomId;
    if (!sfxRoomId) return;
    var sfxId    = String(data.sfxId    || '').slice(0, 40);
    var sfxLabel = String(data.sfxLabel || '').slice(0, 80);
    io.to(sfxRoomId).emit('sound-fx', { sfxId: sfxId, sfxLabel: sfxLabel });
  });

  // ── trivia ─────────────────────────────────────────────────────────────
  socket.on('trivia-start', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var tRoomId = socket.data.roomId;
    if (!tRoomId) return;
    var question = (data.question || '').trim().slice(0, 200);
    var options  = Array.isArray(data.options) ? data.options.slice(0, 4).map(function(o) { return { text: String(o.text || o).slice(0, 80) }; }) : [];
    var _rawCorrectIdx = parseInt(data.correctIdx, 10);
    var correctIdx = (Number.isFinite(_rawCorrectIdx) && _rawCorrectIdx >= 0) ? _rawCorrectIdx : 0;
    var durationMs = Math.min(Math.max(data.durationMs || 20000, 5000), 60000);
    if (!question || options.length < 2) return;
    if (correctIdx >= options.length) correctIdx = 0;
    // Clear any in-flight timer so the previous trivia's timeout cannot end this one
    var _prevTrivia = triviaRooms.get(tRoomId);
    if (_prevTrivia && _prevTrivia.timer) clearTimeout(_prevTrivia.timer);
    var trivia = { question: question, options: options, answers: new Map(), correctIdx: correctIdx, active: true, startTs: Date.now(), durationMs: durationMs };
    triviaRooms.set(tRoomId, trivia);
    io.to(tRoomId).emit('trivia-question', { roomId: tRoomId, question: question, options: options.map(function(o) { return { text: o.text }; }), durationMs: durationMs });
    trivia.timer = setTimeout(function() { if (triviaRooms.get(tRoomId) === trivia) endTrivia(tRoomId); }, durationMs);
  });

  socket.on('trivia-answer', function(data) {
    var tRoomId = socket.data.roomId;
    if (!tRoomId) return;
    var trivia = triviaRooms.get(tRoomId);
    if (!trivia || !trivia.active) return;
    var idx = parseInt(data.answerIdx, 10);
    if (isNaN(idx) || idx < 0 || idx >= trivia.options.length) return;
    var _taKey = socket.data.userId || socket.id;
    trivia.answers.set(_taKey, { idx: idx, username: socket.data.username || 'Anonymous', ts: Date.now() });
    socket.emit('trivia-answer-ack', { answerIdx: idx });
  });

  socket.on('trivia-end', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var tEndRoomId = socket.data.roomId;
    if (!tEndRoomId) return;
    endTrivia(tEndRoomId);
  });

  // ── end-broadcast ──────────────────────────────────────────────────────
  socket.on('end-broadcast', function(data, ack) {
    var roomId = socket.data.roomId;

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

    var _rcPeak    = peakViewers.get(roomId) || 0;
    var _rcRevenue = sessionRevenue.get(roomId) || 0;
    var _rcTop     = (giftLeaderboards.get(roomId) || []).slice(0, 3);
    var _rcClips   = 0;
    var _rcSc      = 0;
    try { _rcClips = (db.prepare('SELECT COUNT(*) as c FROM clip_markers WHERE room_id = ?').get(roomId) || {}).c || 0; } catch(e) {}
    try { _rcSc    = (db.prepare('SELECT COUNT(*) as c FROM super_chats   WHERE room_id = ?').get(roomId) || {}).c || 0; } catch(e) {}
    io.to(roomId).emit('broadcast-ended', {
      roomId: roomId, ts: now,
      peakViewers: _rcPeak, sessionRevenueCents: _rcRevenue,
      topGifters: _rcTop, clipCount: _rcClips, superChatCount: _rcSc,
    });

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
    slowModeSeconds.delete(roomId);
    pinnedMessages.delete(roomId);
    streamGoals.delete(roomId);
    chyrons.delete(roomId);
    subOnlyRooms.delete(roomId);
    roomAudioOnly.delete(roomId);
    roomPrivateMap.delete(roomId);
    roomPaywallMap.delete(roomId);
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
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    var chunk  = data.chunk;

    if (!roomId || !chunk) return;
    if (typeof chunk !== 'string' || chunk.length > 65536) return;
    var _acNow = Date.now();
    if (_acNow - (audioChunkThrottle.get(socket.data.userId) || 0) < 500) return;
    audioChunkThrottle.set(socket.data.userId, _acNow);

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
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sId = socket.data.roomId;
    if (!sId || !aura) return;
    var triggerFn = null;
    var _at_st  = String(data.streamTitle  || '').slice(0, 120);
    var _at_vn  = String(data.viewerName   || '').slice(0, 80);
    var _at_gn  = String(data.giftName     || '').slice(0, 60);
    var _at_nt  = String(data.note         || '').slice(0, 200);
    var _at_vc  = Math.min(Math.max(Math.floor(Number(data.viewerCount)        || 0), 0), 1000000);
    var _at_ac  = Math.min(Math.max(Math.floor(Number(data.amountCents)        || 0), 0), 5000000);
    var _at_pv  = Math.min(Math.max(Math.floor(Number(data.peakViewers)        || 0), 0), 1000000);
    var _at_tec = Math.min(Math.max(Math.floor(Number(data.totalEarningsCents) || 0), 0), 5000000);
    if (data.type === 'stream_start') triggerFn = function(cb) { aura.triggerStreamStart(sId, _at_st || 'SeeWhy LIVE', _at_vc, cb); };
    if (data.type === 'tip_received') triggerFn = function(cb) { aura.triggerTip(sId, _at_vn || 'Viewer', _at_ac || 500, _at_nt, cb); };
    if (data.type === 'gift_received') triggerFn = function(cb) { aura.triggerGift(sId, _at_vn || 'Viewer', _at_gn || 'Gift', _at_ac || 100, cb); };
    if (data.type === 'new_viewer') triggerFn = function(cb) { aura.triggerNewViewer(sId, _at_vn || 'Viewer', data.isReturning || false, cb); };
    if (data.type === 'stream_end') triggerFn = function(cb) { aura.triggerStreamEnd(sId, _at_pv, _at_tec, cb); };
    if (!triggerFn) return;
    triggerFn(function(err, text) {
      if (text) {
        io.to(sId).emit('aura-message', { text: text, mode: aura.getMode(), ts: Math.floor(Date.now() / 1000) });
      }
    });
  });

  // ── mute-user ──────────────────────────────────────────────────────────
  socket.on('mute-user', function(data) {
    var sId = socket.data.roomId;
    if (!sId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var _muteId = String(data.targetUser || data.userId || '');
    if (!_muteId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(_muteId)) return;
    var _muteReason = String(data.reason || '').slice(0, 200);
    var _muteProducers = mediasoup.getProducerIdsByGuest(_muteId);
    _muteProducers.forEach(function(pid) { mediasoup.pauseProducer(pid); });
    io.to(sId).emit('user-muted', { userId: _muteId, reason: _muteReason, ts: Math.floor(Date.now() / 1000) });
  });

  // ── ban-user ───────────────────────────────────────────────────────────
  socket.on('ban-user', function(data) {
    var sId = socket.data.roomId;
    if (!sId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var bannedId = String(data.userId || data.targetUser || '');
    if (!bannedId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bannedId)) return;
    io.to(sId).emit('user-banned', { userId: bannedId, ts: Math.floor(Date.now() / 1000) });
    // Disconnect every socket in this room whose userId matches the ban target
    var room = rooms.get(sId);
    if (room) {
      room.guests.forEach(function(g, sid) {
        if (g.guestId === bannedId || g.userId === bannedId) {
          var bannedSocket = io.sockets.sockets.get(sid);
          if (bannedSocket) { bannedSocket.disconnect(true); }
        }
      });
      // Also catch viewer-role sockets not stored in room.guests
      var roomSockets = io.sockets.adapter.rooms.get(sId);
      if (roomSockets) {
        roomSockets.forEach(function(sid) {
          var s = io.sockets.sockets.get(sid);
          if (s && s.data.userId === bannedId) { s.disconnect(true); }
        });
      }
    }
  });

  // ── unban-user ─────────────────────────────────────────────────────────
  socket.on('unban-user', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sId = socket.data.roomId;
    if (!sId) return;
    var _unbanUsername = String(data.username || '').slice(0, 100);
    if (!_unbanUsername) return;
    io.to(sId).emit('user-unbanned', { username: _unbanUsername, ts: Math.floor(Date.now() / 1000) });
  });

  // ── mod-rules ──────────────────────────────────────────────────────────
  socket.on('mod-rules', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sId = socket.data.roomId;
    if (!sId) return;
    var safeRules;
    try {
      var _mrStr = JSON.stringify(data.rules);
      if (_mrStr && _mrStr.length > 8192) return;
      safeRules = JSON.parse(_mrStr);
    } catch(e) { return; }
    io.to(sId).emit('mod-rules-updated', { rules: safeRules, ts: Math.floor(Date.now() / 1000) });
  });

  // ── bot-rule-toggle ────────────────────────────────────────────────────
  socket.on('bot-rule-toggle', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sId = socket.data.roomId;
    if (!sId) return;
    io.to(sId).emit('bot-rule-changed', { rule: String(data.rule || '').slice(0, 100), enabled: Boolean(data.enabled), ts: Math.floor(Date.now() / 1000) });
  });

  // ── subscriber-only-changed ────────────────────────────────────────────
  socket.on('subscriber-only-changed', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var sId = socket.data.roomId;
    if (!sId) return;
    if (data.enabled) { subOnlyRooms.add(sId); } else { subOnlyRooms.delete(sId); }
    io.to(sId).emit('subscriber-only-changed', { enabled: Boolean(data.enabled), ts: Math.floor(Date.now() / 1000) });
  });

  // ── analytics-ping ────────────────────────────────────────────────────
  socket.on('analytics-ping', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var pingRoomId = socket.data.roomId;
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
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var pollRoomId = socket.data.roomId;
    if (!pollRoomId) return;
    var _rawPcDur = Number(data.duration);
    var duration = Math.min(Math.max(Number.isFinite(_rawPcDur) ? Math.floor(_rawPcDur) : 60, 5), 300);
    var newPoll = {
      id: uuidv4(),
      question: String(data.question || '').slice(0, 200),
      options: (Array.isArray(data.options) ? data.options : []).slice(0, 8).map(function(o) { return String(o).slice(0, 80); }),
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
    var voteRoomId = socket.data.roomId;
    if (!voteRoomId) return;
    var _pv2Now = Date.now();
    var _pv2Key = socket.data.userId || socket.id;
    if (_pv2Now - (pollVoteThrottle.get(_pv2Key) || 0) < 500) return;
    pollVoteThrottle.set(_pv2Key, _pv2Now);
    var pollToVote = activePolls.get(voteRoomId);
    if (!pollToVote || pollToVote.id !== data.pollId) return;
    var voteKey = _pv2Key;
    if (pollToVote.votes[voteKey] !== undefined) return;
    var option = String(data.option || '');
    if (!pollToVote.options || !pollToVote.options.includes(option)) return;
    pollToVote.votes[voteKey] = option;
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
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var endRoomId = socket.data.roomId;
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

  // ── livesync ────────────────────────────────────────────────────────────
  socket.on('livesync-toggle', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var lsRoomId = socket.data.roomId;
    if (!lsRoomId) return;
    var enabled = Boolean(data.enabled);
    io.to(lsRoomId).emit('livesync-state', { roomId: lsRoomId, enabled: enabled, delayMs: 0, viewerCount: 0 });
  });

  // ── platform health check ────────────────────────────────────────────────
  socket.on('platform-health-check', function() {
    if (!socket.data.userId || socket.data.userId.startsWith('anon')) return;
    var status = { server: 'ok', mediasoup: 'ok', database: 'ok', rtmp: 'ok', cdn: 'ok' };
    try { db.prepare('SELECT 1').get(); } catch (e) { status.database = 'error'; }
    socket.emit('platform-health', status);
  });

  // ── disconnect ─────────────────────────────────────────────────────────
  socket.on('disconnect', function(reason) {
    logger.info('[socket] Disconnected: ' + socket.id + ' reason=' + reason);

    // Always purge throttle entries regardless of room state (prevents memory leak)
    var _tKey = socket.data.userId || socket.id;
    viewerReactThrottle.delete(_tKey); viewerReactThrottle.delete(socket.id);
    sendGiftThrottle.delete(_tKey);
    qaQuestionThrottle.delete(_tKey); qaQuestionThrottle.delete(socket.id);
    loveThrottle.delete(_tKey); audioChunkThrottle.delete(_tKey);
    collabThrottle.delete(_tKey);
    // superChatThrottle and subscribeThrottle are intentionally NOT cleared on disconnect:
    // clearing them allows rapid-reconnect bypass of the per-user cooldown windows (2s / 60s).
    merchOrderThrottle.delete(_tKey); updateUsernameThrottle.delete(_tKey);
    handRaiseThrottle.delete(_tKey); speakingThrottle.delete(_tKey);
    // These throttles were re-keyed to userId in phase-110; delete both the userId
    // key (normal case) and the socket.id key (anon / pre-upgrade sockets).
    chatMsgThrottle.delete(_tKey);    chatMsgThrottle.delete(socket.id);
    pollVoteThrottle.delete(_tKey);   pollVoteThrottle.delete(socket.id);
    vsVoteThrottle.delete(_tKey);     vsVoteThrottle.delete(socket.id);
    qaUpvoteThrottle.delete(_tKey);   qaUpvoteThrottle.delete(socket.id);
    judgeScoreThrottle.delete(_tKey);
    if (socket.data.ownedProducerIds) {
      socket.data.ownedProducerIds.forEach(function(pid) { producerOwners.delete(pid); });
    }

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
            io.to(roomId).emit('viewer-milestone', { count: milestone, ts: Math.floor(Date.now() / 1000) });
          })(m);
        }
      }
    }

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
  var authorized = false;
  if (expected) {
    var _dc = require('crypto');
    var _dh = function(s) { return _dc.createHash('sha256').update(String(s)).digest(); };
    try { authorized = _dc.timingSafeEqual(_dh(token), _dh(expected)); } catch (_) {}
  }
  if (!authorized) {
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
      'cd /opt/seewhy/server && npm install --omit=dev --silent',
      'cd /opt/seewhy/frontend && npm install --silent && npm run build',
      'pm2 reload seewhy-server --update-env',
      'pm2 save --force'
    ].join(' && ');
    exec(cmd, { timeout: 300000 }, function(err, stdout, stderr) {
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

// ─── ZEGO Token 04 generation ────────────────────────────────────────────────
// Format: "04" + base64( uint32LE(payloadLen) + payloadUTF8 + hmac32bytes )
// ZEGO_SERVER_SECRET env var must be a 32-byte hex string (64 hex chars).
app.post('/api/zego/token', requireAuth, function(req, res) {
  var appId  = parseInt(process.env.ZEGO_APP_ID  || '0');
  var secret = process.env.ZEGO_SERVER_SECRET     || '';
  if (!appId || !secret) {
    return res.status(503).json({ error: 'ZEGO credentials not configured on server' });
  }

  var userId = req.user.id.slice(0, 64);
  var now    = Math.floor(Date.now() / 1000);
  var nonce  = require('crypto').randomInt(0, 0x7fffffff);

  // Token body — matches ZEGO Token04 spec exactly
  var body = JSON.stringify({
    app_id:      appId,
    user_id:     userId,
    nonce:       nonce,
    ctime:       now,
    expire:      now + 3600,
    payload_str: '',
  });

  // serverSecret is hex-encoded — convert to raw bytes before use as HMAC key
  var keyBuf  = Buffer.from(secret, 'hex');
  var hmac    = crypto.createHmac('sha256', keyBuf).update(body).digest();

  // Pack: 4-byte LE payload length + payload UTF-8 bytes + 32-byte HMAC
  var bodyBuf = Buffer.from(body, 'utf8');
  var out     = Buffer.alloc(4 + bodyBuf.length + hmac.length);
  out.writeUInt32LE(bodyBuf.length, 0);
  bodyBuf.copy(out, 4);
  hmac.copy(out, 4 + bodyBuf.length);

  res.json({
    token:  '04' + out.toString('base64'),
    appId:  appId,
    userId: userId,
    expire: now + 3600,
  });
});
