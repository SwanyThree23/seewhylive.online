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
var guestGiftTotals     = new Map();  // roomId → Map<guestId, totalCents>
var joinRequests        = new Map();  // roomId → Map<userId, {socketId,userId,username,requestId,ts}>
var engagementMap       = new Map();  // roomId → Map<userId, {username,chatCount,reactCount,giftCents}>
var bannedWordsMap      = new Map();  // roomId → Set<string>
var chatBannedMap       = new Map();  // roomId → Set<userId>  — chat-only bans
var highlightMap        = new Map();  // roomId → Array<{ts, count}> hot-moment timestamps
var slowModeMap         = new Map();  // roomId → cooldownSeconds (0 = off)
var slowModeLastMsg     = new Map();  // roomId → Map<userId, lastMsgTs>
var handQueues          = new Map();  // roomId → Array<{guestId, userId, username, ts}>
var emojiTallyMap       = new Map();  // roomId → Map<emoji, count>
var tagsMap             = new Map();  // roomId → string[]
var pinnedLinkMap       = new Map();  // roomId → { url, label, emoji } | null
var giftChainMap        = new Map();  // roomId → { count, lastTs }
var watchTogetherMap    = new Map();  // roomId → { url, currentTime, playing, ts } | null
var teamBattleMap       = new Map();  // roomId → { redLabel, blueLabel, redScore, blueScore, active, endsAt, timerId }
var whiteboardMap       = new Map();  // roomId → [{ x1, y1, x2, y2, color, size }] last 800 segments
var karaokeMap          = new Map();  // roomId → { text, active } | null
var chaptersMap         = new Map();  // roomId → [{ ts, label, elapsed }]
var sentimentMap        = new Map();  // roomId → { up: N, down: N, voters: Set<socketId> }
var nowPlayingMap       = new Map();  // roomId → { title, artist, emoji } | null
var tipTickerMap        = new Map();  // roomId → [{ text, id }]
var viewerJoinMap       = new Map();  // roomId → Map<socketId, joinedAtSecs>
var giftGoalMap         = new Map();  // roomId → { target, current, label, active }
var moodMap             = new Map();  // roomId → { emoji, label, counts:{fire,party,chill,love,wow} }
var clipVotesMap        = new Map();  // clipId → { up: N, down: N, voters: Map<socketId, vote> }
var cohostQueueMap      = new Map();  // roomId → [{ socketId, userId, username, ts }]
var userBadgesMap       = new Map();  // userId → Set<badge> (earned badges)
var cohostQueueThrottle = new Map();  // userId → lastRequestTs ms
var reactionComboMap    = new Map();  // roomId → { emoji, count, lastTs, timerId }
var viewerSpotlightMap  = new Map();  // roomId → { userId, username, socketId, endsAt }
var starredMsgsMap      = new Map();  // roomId → [{ id, username, message, starCount, ts }] last 20
var chatRaffleMap       = new Map();  // roomId → { keyword, entries: Map<userId, username>, active }
var starThrottle        = new Map();  // userId → lastStarTs
var energyMap           = new Map();  // roomId → { score:0-100, points:N, lastDecay:ts }
var fanWallMap          = new Map();  // roomId → Map<userId, { username, points, lastSeen }>
var fanWallThrottle     = new Map();  // userId → lastFanWallTs
// Batch 36
var audienceChallengeMap = new Map(); // roomId → { text, durationSecs, startTs, active, responseCount, respondedBy: Set }
var intermissionMap     = new Map();  // roomId → { active, message, returnEta } | null
var flashDropMap        = new Map();  // roomId → { name, price, url, endsAt, timerId }
var applauseMap         = new Map();  // roomId → { count, windowStart, peak }
var vipMap              = new Map();  // roomId → Set<userId>
// Batch 37
var chatColorMap        = new Map();  // userId → hexColor string
var lowerThirdMap       = new Map();  // roomId → { title, subtitle, endsAt, timerId }
var chatThemeMap        = new Map();  // roomId → theme string (party|chill|sports|gaming|news)
// Batch 38
var scoreboardMap       = new Map();  // roomId → { title, teamA:{name,score,color}, teamB:{name,score,color}, active }
var auctionMap          = new Map();  // roomId → { item, desc, startBid, currentBid, bidder, bidderName, active, startTs }
var timerWidgetMap      = new Map();  // roomId → { label, type:'countdown'|'countup', startTs, durationSecs, active }
var quickQuizMap        = new Map();  // roomId → { q, opts:[{text,votes}], answers:Map<userId,idx>, active }
// Batch 39
var songRequestMap      = new Map();  // roomId → [{ id, userId, username, song, ts, played }]
var hypeTrainMap        = new Map();  // roomId → { level, pts, target, startTs, timerId, active }
var marqueeMap          = new Map();  // roomId → { text, active }
var shoutoutQueueMap    = new Map();  // roomId → [{ id, userId, username, message, ts }]
var shoutoutQueueCost   = 50;         // points cost to queue a shoutout
// Batch 40
var checkInMap          = new Map();  // userId → lastCheckInTs
var streamTitleMap      = new Map();  // roomId → string (live-edited title)
var roomVibeMap         = new Map();  // roomId → { vibe: string, ts: number } | null
var simplePollMap       = new Map();  // roomId → { q, yes:Set<userId>, no:Set<userId>, active, startTs }
// Batch 41
var fanClubMap          = new Map();  // roomId → Set<userId>
var watchStreakMap       = new Map();  // userId → { days, lastDate } (date string YYYY-MM-DD)
var hostNoteMap         = new Map();  // roomId → { text, ts } | null
var collabBannerMap     = new Map();  // roomId → { name, platform, ts } | null
// Batch 43
var prizeWheelMap      = new Map();  // roomId → { segments:[{label,color}], active, lastWinner }
var giftComboMap       = new Map();  // userId → { roomId, count, lastTs, timerId }
var signInLogMap       = new Map();  // roomId → [{ userId, username, ts }]
var outroCountdownMap  = new Map();  // roomId → { endsAt, label, timerId }
// Batch 42
var chatWordMap         = new Map();  // roomId → Map<word, count>  (word frequency for cloud)
var chatWordMsgCount   = new Map();  // roomId → int (messages since last broadcast)
var viewerStatusMap    = new Map();  // userId → { emoji, text, ts }
var momentLogMap       = new Map();  // roomId → [{ id, label, ts, by }]
var roomCapacityMap    = new Map();  // roomId → { max, warn } (max viewer cap, warn % threshold)
var STOP_WORDS = new Set(['the','a','an','is','it','in','on','of','to','and','or','for','are','was','this','that','my','your','with','be','do','not','at','so','me','we','you','i','get','got','what','when','can','will','how','no','yes','up','out','just','like','go','all','but','he','she','they','they\'re','i\'m','it\'s','don\'t','can\'t','won\'t','i\'ve','we\'re','let\'s','there','here','from','have','has','had','been','more','than','its','im','its','our','some','by','as','about','if','would','could','should','said','did','now','see','say','then','them','their','also','into','any','new','one','two']);


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
  var joinRoom = rooms.get(roomId);
  if (joinRoom && joinRoom.pinnedChat) state.pinnedChat = joinRoom.pinnedChat;
  if (joinRoom && joinRoom.spotlight && joinRoom.spotlight.endsAt > Math.floor(Date.now() / 1000)) {
    state.spotlight = joinRoom.spotlight;
  }
  if (joinRoom && joinRoom.liveStartedAt) state.liveStartedAt = joinRoom.liveStartedAt;
  state.roomTags      = tagsMap.get(roomId) || [];
  state.pinnedLink    = pinnedLinkMap.get(roomId) || null;
  state.slowMode      = slowModeMap.get(roomId) || 0;
  state.watchTogether = watchTogetherMap.get(roomId) || null;
  var tb = teamBattleMap.get(roomId);
  state.teamBattle = tb ? { redLabel: tb.redLabel, blueLabel: tb.blueLabel, redScore: tb.redScore, blueScore: tb.blueScore, active: tb.active, endsAt: tb.endsAt } : null;
  state.whiteboardStrokes = (whiteboardMap.get(roomId) || []).slice(-200);
  state.karaoke  = karaokeMap.get(roomId)  || null;
  state.chapters = chaptersMap.get(roomId) || [];
  var sm = sentimentMap.get(roomId);
  state.sentiment  = sm ? { up: sm.up, down: sm.down } : { up: 0, down: 0 };
  state.nowPlaying = nowPlayingMap.get(roomId) || null;
  state.tipTicker  = tipTickerMap.get(roomId) || [];
  state.giftGoal    = giftGoalMap.get(roomId)   || null;
  state.mood        = moodMap.get(roomId)        || null;
  state.cohostQueue  = (cohostQueueMap.get(roomId) || []).map(function(e) { return { userId: e.userId, username: e.username, ts: e.ts }; });
  var eng = energyMap.get(roomId);
  state.energy    = eng ? { score: eng.score } : null;
  var fw = fanWallMap.get(roomId);
  if (fw) {
    state.fanWall = Array.from(fw.values()).sort(function(a, b) { return b.points - a.points; }).slice(0, 9).map(function(e) { return { userId: e.userId, username: e.username, points: e.points }; });
  } else {
    state.fanWall = [];
  }
  // Batch 36
  var ac = audienceChallengeMap.get(roomId);
  state.audienceChallenge = (ac && ac.active) ? { text: ac.text, durationSecs: ac.durationSecs, startTs: ac.startTs, responseCount: ac.responseCount } : null;
  state.intermission = intermissionMap.get(roomId) || null;
  var fd = flashDropMap.get(roomId);
  state.flashDrop = (fd && Date.now() < fd.endsAt) ? { name: fd.name, price: fd.price, url: fd.url, endsAt: fd.endsAt } : null;
  var vips = vipMap.get(roomId);
  state.vips = vips ? Array.from(vips) : [];
  // Batch 37
  var lt = lowerThirdMap.get(roomId);
  state.lowerThird = (lt && Date.now() < lt.endsAt) ? { title: lt.title, subtitle: lt.subtitle, endsAt: lt.endsAt } : null;
  state.chatTheme = chatThemeMap.get(roomId) || null;
  // Batch 38
  var sb = scoreboardMap.get(roomId);
  state.scoreboard = (sb && sb.active) ? { title: sb.title, teamA: sb.teamA, teamB: sb.teamB } : null;
  var au = auctionMap.get(roomId);
  state.auction = (au && au.active) ? { item: au.item, desc: au.desc, startBid: au.startBid, currentBid: au.currentBid, bidder: au.bidderName, startTs: au.startTs } : null;
  var tw = timerWidgetMap.get(roomId);
  state.timerWidget = (tw && tw.active) ? { label: tw.label, type: tw.type, startTs: tw.startTs, durationSecs: tw.durationSecs } : null;
  var qq = quickQuizMap.get(roomId);
  state.quickQuiz = (qq && qq.active) ? { q: qq.q, opts: qq.opts.map(function(o) { return { text: o.text, votes: o.votes }; }) } : null;
  // Batch 39
  var srList = songRequestMap.get(roomId);
  state.songRequests = srList ? srList.filter(function(s) { return !s.played; }).slice(0, 20) : [];
  var ht = hypeTrainMap.get(roomId);
  state.hypeTrain = (ht && ht.active) ? { level: ht.level, pts: ht.pts, target: ht.target } : null;
  state.marquee = marqueeMap.get(roomId) || null;
  var sq = shoutoutQueueMap.get(roomId);
  state.shoutoutQueue = sq ? sq.slice(0, 5) : [];
  // Batch 40
  state.streamTitle = streamTitleMap.get(roomId) || null;
  state.roomVibe = roomVibeMap.get(roomId) || null;
  var sp = simplePollMap.get(roomId);
  state.simplePoll = (sp && sp.active) ? { q: sp.q, yes: sp.yes.size, no: sp.no.size, startTs: sp.startTs } : null;
  // Batch 41
  var fc = fanClubMap.get(roomId);
  state.fanClub = fc ? Array.from(fc) : [];
  state.hostNote = hostNoteMap.get(roomId) || null;
  state.collabBanner = collabBannerMap.get(roomId) || null;
  // Batch 43
  var pw = prizeWheelMap.get(roomId);
  state.prizeWheel = pw ? { segments: pw.segments, active: pw.active, lastWinner: pw.lastWinner || null } : null;
  var sl = signInLogMap.get(roomId);
  state.signInLog = sl ? sl.slice(-30) : [];
  var oc = outroCountdownMap.get(roomId);
  state.outroCountdown = (oc && oc.endsAt > Date.now()) ? { endsAt: oc.endsAt, label: oc.label } : null;
  // Batch 42
  var wcMap = chatWordMap.get(roomId);
  state.wordCloud = wcMap ? Array.from(wcMap.entries()).sort(function(a,b){return b[1]-a[1];}).slice(0,20).map(function(e){return{word:e[0],count:e[1]};}) : [];
  state.momentLog = (momentLogMap.get(roomId) || []).slice(-20);
  state.roomCapacity = roomCapacityMap.get(roomId) || null;
  return state;
}

// Helper: add engagement points to energy bar and fan wall; broadcast score
function addEnergy(roomId, userId, username, pts) {
  if (!roomId) return;
  // Energy bar
  if (!energyMap.has(roomId)) energyMap.set(roomId, { score: 0, points: 0, lastDecay: Date.now() });
  var eng = energyMap.get(roomId);
  eng.points += pts;
  eng.score = Math.min(100, Math.round((eng.points / 200) * 100));
  energyMap.set(roomId, eng);
  io.to(roomId).emit('energy-update', { score: eng.score, pts: pts });
  // Fan wall
  if (userId && username) {
    if (!fanWallMap.has(roomId)) fanWallMap.set(roomId, new Map());
    var fw = fanWallMap.get(roomId);
    var entry = fw.get(userId) || { userId: userId, username: username, points: 0, lastSeen: 0 };
    entry.points += pts; entry.lastSeen = Date.now(); entry.username = username;
    fw.set(userId, entry);
    var topFanWall = Array.from(fw.values()).sort(function(a, b) { return b.points - a.points; }).slice(0, 9)
      .map(function(e) { return { userId: e.userId, username: e.username, points: e.points }; });
    io.to(roomId).emit('fan-wall-update', { fans: topFanWall });
  }
}

// Helper: add points to hype train; level up on threshold
var HYPE_LEVELS = [0, 50, 150, 300, 500, 800]; // cumulative pts per level
var HYPE_EXPIRE_MS = 30000; // train resets if no activity for 30s
function addHype(roomId, pts) {
  if (!roomId) return;
  var now = Date.now();
  if (!hypeTrainMap.has(roomId)) {
    hypeTrainMap.set(roomId, { level: 0, pts: 0, target: HYPE_LEVELS[1], startTs: now, timerId: null, active: false });
  }
  var ht = hypeTrainMap.get(roomId);
  if (ht.timerId) clearTimeout(ht.timerId);
  ht.pts += pts;
  ht.active = true;
  ht.startTs = now;
  // Level up
  while (ht.level < HYPE_LEVELS.length - 1 && ht.pts >= HYPE_LEVELS[ht.level + 1]) {
    ht.level += 1;
    ht.target = ht.level < HYPE_LEVELS.length - 1 ? HYPE_LEVELS[ht.level + 1] : ht.pts;
    io.to(roomId).emit('hype-train-level', { level: ht.level, pts: ht.pts, target: ht.target });
  }
  io.to(roomId).emit('hype-train-update', { level: ht.level, pts: ht.pts, target: ht.target });
  // Auto-expire after 30s idle
  ht.timerId = setTimeout(function() {
    var cur = hypeTrainMap.get(roomId);
    if (cur && cur.startTs === now) {
      cur.active = false;
      hypeTrainMap.delete(roomId);
      io.to(roomId).emit('hype-train-ended', { level: cur.level });
    }
  }, HYPE_EXPIRE_MS);
  hypeTrainMap.set(roomId, ht);
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
      presence:     new Map(),
      pinnedChat:    null,    // { id, username, message, ts }
      spotlight:     null,    // { name, emoji, price, url, endsAt }
      subscriberOnly: false,  // subscriber-only chat mode
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

// ─── Top-fans leaderboard — broadcast top 5 per room every 30 s ────────────
setInterval(function() {
  engagementMap.forEach(function(engRoom, roomId) {
    if (!engRoom.size) return;
    var entries = [];
    engRoom.forEach(function(e, uid) {
      var score = e.chatCount + e.reactCount * 2 + Math.floor(e.giftCents / 100);
      if (score === 0) return;
      entries.push({ userId: uid, username: e.username, score: score, chatCount: e.chatCount, reactCount: e.reactCount, giftCents: e.giftCents });
    });
    entries.sort(function(a, b) { return b.score - a.score; });
    var top5 = entries.slice(0, 5);
    if (top5.length) {
      io.to(roomId).emit('top-fans', { fans: top5, ts: Date.now() });
    }
  });
}, 30000);

// ─── Emoji reaction tally — broadcast per-room cumulative counts every 15 s ─
setInterval(function() {
  emojiTallyMap.forEach(function(emojiMap, roomId) {
    if (!emojiMap.size) return;
    var entries = [];
    emojiMap.forEach(function(count, emoji) { entries.push({ emoji: emoji, count: count }); });
    entries.sort(function(a, b) { return b.count - a.count; });
    io.to(roomId).emit('emoji-tally', { tally: entries.slice(0, 5), ts: Date.now() });
  });
}, 15000);

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

// GET /api/rooms/:roomId/join-requests — pending stage join requests for a room
app.get('/api/rooms/:roomId/join-requests', function(req, res) {
  var roomId = req.params.roomId;
  var roomMap = joinRequests.get(roomId);
  var reqs = roomMap ? Array.from(roomMap.values()) : [];
  res.json(reqs.map(function(r) { return { id: r.requestId, user_id: r.userId, display_name: r.username, avatar_url: r.avatarUrl || null }; }));
});

// GET /api/gift-types — preset gift options for the tap-to-gift UI
app.get('/api/gift-types', function(req, res) {
  try {
    var rows = db.prepare('SELECT id, name, icon, amount_cents, aura_message FROM gift_types WHERE is_active = 1 ORDER BY sort_order ASC').all();
    res.json({ giftTypes: rows });
  } catch (err) {
    logger.error('[gift-types] ' + err.message);
    res.status(500).json({ error: 'Could not load gift types' });
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

      // Award join points
      io.to(socket.id).emit('points-earned', { amount: 5, reason: 'joined stream', ts: Math.floor(Date.now() / 1000) });
      // Send any active countdown to late-joining viewers
      if (room.countdown && room.countdown.endsAt > Math.floor(Date.now() / 1000)) {
        io.to(socket.id).emit('stream-countdown', room.countdown);
      }

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
          // Batch 41: attach viewer's watch streak
          var _vsUserId = socket.data.userId;
          if (_vsUserId) {
            var _vsToday = new Date().toISOString().slice(0, 10);
            var _vsYest  = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            var _vsStr   = watchStreakMap.get(_vsUserId) || { days: 0, lastDate: null };
            if (_vsStr.lastDate !== _vsToday) {
              _vsStr.days = (_vsStr.lastDate === _vsYest) ? _vsStr.days + 1 : 1;
              _vsStr.lastDate = _vsToday;
              watchStreakMap.set(_vsUserId, _vsStr);
            }
            viewerAck.watchStreak = _vsStr.days;
          }
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

  // ── panel:request_join — viewer asks to come on stage ─────────────────
  socket.on('panel:request_join', function(data, ack) {
    var roomId   = (data && data.roomId) || socket.data.roomId;
    var userId   = socket.data.userId || socket.id;
    var username = socket.data.username || userId;
    if (!roomId) { if (ack) ack({ error: 'no roomId' }); return; }

    if (!joinRequests.has(roomId)) joinRequests.set(roomId, new Map());
    var requestId = uuidv4();
    joinRequests.get(roomId).set(userId, { socketId: socket.id, userId: userId, username: username, requestId: requestId, ts: Math.floor(Date.now() / 1000) });

    // Notify host (and all cohosts) by broadcasting to room — JoinRequestQueue subscribes to panel:join_request_received
    io.to(roomId).emit('panel:join_request_received', { roomId: roomId, userId: userId, requestId: requestId, displayName: username, avatarUrl: null });
    // Also emit hand-raise so the host sees the ✋ badge on the viewer circle
    io.to(roomId).emit('hand-raise', { guestId: userId, username: username });

    if (ack) ack({ ok: true, requestId: requestId });
  });

  // ── panel:resolve_join_request — host approves or denies ──────────────
  socket.on('panel:resolve_join_request', function(data, ack) {
    var roomId  = (data && data.roomId) || socket.data.roomId;
    var userId  = data && data.userId;
    var approve = !!(data && data.approve);
    if (!roomId || !userId) { if (ack) ack({ error: 'missing params' }); return; }

    var roomMap = joinRequests.get(roomId);
    var req     = roomMap && roomMap.get(userId);
    if (req) roomMap.delete(userId);

    if (approve) {
      // Promote requester to stage
      if (req && req.socketId) {
        io.to(req.socketId).emit('panel:join_request_resolved', { approved: true, roomId: roomId });
        io.to(req.socketId).emit('stage-invite', { guestId: userId, invitedBy: socket.data.userId });
      }
      // Broadcast stage-invite to room so everyone tracks the new panelist
      io.to(roomId).emit('stage-invite', { guestId: userId, invitedBy: socket.data.userId });
      io.to(roomId).emit('hand-lower',   { guestId: userId });
    } else {
      if (req && req.socketId) {
        io.to(req.socketId).emit('panel:join_request_resolved', { approved: false, roomId: roomId });
      }
    }
    if (ack) ack({ ok: true });
  });

  // ── stage-invite ───────────────────────────────────────────────────────
  socket.on('stage-invite', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId  = socket.data.roomId;
    var guestId = String(data.guestId || '');
    if (!roomId || !guestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestId)) return;
    io.to(roomId).emit('stage-invite', { guestId: guestId, invitedBy: socket.data.userId });
    io.to(roomId).emit('hand-lower',   { guestId: guestId });
  });

  // ── stage-remove ───────────────────────────────────────────────────────
  socket.on('stage-remove', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId  = socket.data.roomId;
    var guestId = String(data.guestId || '');
    if (!roomId || !guestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestId)) return;
    io.to(roomId).emit('stage-remove', { guestId: guestId });
  });

  // ── chat-pin — host pins a chat message for all viewers ───────────────
  socket.on('chat-pin', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var pinMsg = data.msg ? { id: data.msg.id, username: data.msg.username, message: data.msg.message, ts: data.msg.ts || Math.floor(Date.now() / 1000) } : null;
    var pinRoom = rooms.get(roomId);
    if (pinRoom) pinRoom.pinnedChat = pinMsg;
    io.to(roomId).emit('chat-pinned', { roomId: roomId, msg: pinMsg });
  });

  // ── chat-unpin — host clears the pinned message ────────────────────────
  socket.on('chat-unpin', function(data) {
    var roomId = (data && data.roomId) || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var unpinRoom = rooms.get(roomId);
    if (unpinRoom) unpinRoom.pinnedChat = null;
    io.to(roomId).emit('chat-pinned', { roomId: roomId, msg: null });
  });

  // ── chat-delete — host/cohost removes a message from all clients ───────
  socket.on('chat-delete', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    var msgId  = data.msgId;
    if (!roomId || !msgId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    try { db.prepare('DELETE FROM chat_history WHERE id = ?').run(msgId); } catch(e) {}
    io.to(roomId).emit('chat-deleted', { roomId: roomId, msgId: msgId });
  });

  // ── follow-trigger — host/system fires a new-follower celebration ────────
  socket.on('follow-trigger', function(data) {
    var roomId   = (data && data.roomId) || socket.data.roomId;
    var follower = (data && data.username) || 'Someone';
    if (!roomId) return;
    io.to(roomId).emit('follow-alert', { roomId: roomId, username: follower, ts: Math.floor(Date.now() / 1000) });
  });

  // ── schedule-announce — host queues a system message to fire after a delay
  socket.on('schedule-announce', function(data, ack) {
    var roomId  = (data && data.roomId) || socket.data.roomId;
    var message = data && typeof data.message === 'string' ? data.message.trim().slice(0, 300) : '';
    var delayMs = Math.min(Math.max(parseInt(data && data.delayMs) || 0, 5000), 3600000);
    if (!roomId || !message) { if (ack) ack({ error: 'missing params' }); return; }
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') { if (ack) ack({ error: 'forbidden' }); return; }

    var announceId = uuidv4();
    var timer = setTimeout(function() {
      var msgId = uuidv4();
      var ts = Math.floor(Date.now() / 1000);
      io.to(roomId).emit('chat-message', { id: msgId, username: '📢 Announcement', role: 'system', message: message, ts: ts });
    }, delayMs);

    // Store timer ref so host can cancel; keyed by announceId on socket
    if (!socket._announceTimers) socket._announceTimers = {};
    socket._announceTimers[announceId] = timer;
    if (ack) ack({ ok: true, announceId: announceId, firesAt: Date.now() + delayMs });
  });

  // ── cancel-announce — host cancels a pending scheduled announcement ────
  socket.on('cancel-announce', function(data, ack) {
    var announceId = data && data.announceId;
    if (!announceId) { if (ack) ack({ error: 'missing announceId' }); return; }
    if (socket._announceTimers && socket._announceTimers[announceId]) {
      clearTimeout(socket._announceTimers[announceId]);
      delete socket._announceTimers[announceId];
      if (ack) ack({ ok: true });
    } else {
      if (ack) ack({ ok: false, error: 'not found' });
    }
  });

  // ── product-spotlight — host pins a buy-now overlay card for 30s ───────
  socket.on('product-spotlight', function(data) {
    var roomId   = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var dur = 30;
    var endsAt = Math.floor(Date.now() / 1000) + dur;
    var item = data.item ? { name: data.item.name || '', emoji: data.item.emoji || '🛍️', price: data.item.price || '', url: data.item.url || '', endsAt: endsAt } : null;
    var spRoom = rooms.get(roomId);
    if (spRoom) spRoom.spotlight = item;
    io.to(roomId).emit('product-spotlight', { roomId: roomId, item: item });
    if (item) {
      setTimeout(function() {
        var r2 = rooms.get(roomId);
        if (r2 && r2.spotlight && r2.spotlight.endsAt === endsAt) {
          r2.spotlight = null;
          io.to(roomId).emit('product-spotlight', { roomId: roomId, item: null });
        }
      }, dur * 1000);
    }
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
    var _cmNow = Date.now(); var _cmKey = socket.data.userId || socket.id;
    if (_cmNow - (chatMsgThrottle.get(_cmKey) || 0) < 500) return;
    chatMsgThrottle.set(_cmKey, _cmNow);

    // Banned words filter
    var _bwSet = bannedWordsMap.get(roomId);
    if (_bwSet && _bwSet.size > 0) {
      var _msgLow = message.toLowerCase();
      var _blocked = false;
      _bwSet.forEach(function(w) { if (_msgLow.indexOf(w) >= 0) _blocked = true; });
      if (_blocked) {
        io.to(socket.id).emit('chat-blocked', { reason: 'Message contains a blocked word' });
        return;
      }
    }

    // Chat-ban check
    var _cbSet = chatBannedMap.get(roomId);
    if (_cbSet && _cbSet.has(userId)) {
      io.to(socket.id).emit('chat-blocked', { reason: 'You are banned from chat in this room' });
      return;
    }

    // Subscriber-only chat gate
    var _chatRoom = rooms.get(roomId);
    if (_chatRoom && _chatRoom.subscriberOnly && socket.data.role === 'viewer') {
      io.to(socket.id).emit('chat-blocked', { reason: 'This room is in subscriber-only chat mode' });
      return;
    }

    // Slow mode check
    var _smCooldown = slowModeMap.get(roomId) || 0;
    if (_smCooldown > 0 && socket.data.role === 'viewer') {
      if (!slowModeLastMsg.has(roomId)) slowModeLastMsg.set(roomId, new Map());
      var _smRoom = slowModeLastMsg.get(roomId);
      var _smLast = _smRoom.get(userId) || 0;
      var _smNow = Date.now();
      if (_smNow - _smLast < _smCooldown * 1000) {
        var _smRemaining = Math.ceil((_smCooldown * 1000 - (_smNow - _smLast)) / 1000);
        io.to(socket.id).emit('chat-blocked', { reason: 'Slow mode: wait ' + _smRemaining + 's before sending another message' });
        return;
      }
      _smRoom.set(userId, _smNow);
    }

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
    swanybot.onChatMessage(roomId, _swKey, message, { username: username, userId: _swKey, room: rooms.get(roomId) });

    // Analytics: increment per-minute message count
    var chatA = getAnalytics(roomId);
    var chatMinKey = Math.floor(Date.now() / 60000);
    chatA.msgCounts[chatMinKey] = (chatA.msgCounts[chatMinKey] || 0) + 1;

    // Engagement tracking: chat count
    var _engChatId = userId || socket.data.userId;
    if (_engChatId) {
      if (!engagementMap.has(roomId)) engagementMap.set(roomId, new Map());
      var _engChatRoom = engagementMap.get(roomId);
      var _engChatEntry = _engChatRoom.get(_engChatId) || { username: username, chatCount: 0, reactCount: 0, giftCents: 0 };
      _engChatEntry.chatCount += 1;
      _engChatRoom.set(_engChatId, _engChatEntry);
    }

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

        var senderRole = socket.data.role || 'viewer';
        io.to(roomId).emit('chat-message', {
          id:              msgId,
          userId:          userId,
          username:        username,
          role:            senderRole,
          message:         message,
          translated:      result.translated,
          lang:            result.detectedLang,
          hasExternalLinks: _hasExternalLinks,
          nameColor:       chatColorMap.get(userId) || null,
          ts:              ts
        });
        io.to(socket.id).emit('points-earned', { amount: 2, reason: 'chat', ts: ts });
        // Auto-enter raffle if message matches active raffle keyword
        var raffle = chatRaffleMap.get(roomId);
        if (raffle && raffle.active && message.toLowerCase().trim() === raffle.keyword && !raffle.entries.has(userId)) {
          raffle.entries.set(userId, username);
          io.to(roomId).emit('chat-raffle-update', { keyword: raffle.keyword, active: true, count: raffle.entries.size });
        }
        // Stream energy: +2 per chat message
        addEnergy(roomId, userId, username, 2);
        addHype(roomId, 1);
        // Batch 42: word frequency for word cloud
        var _wcWords = message.toLowerCase().replace(/[^a-z0-9\s']/g, '').split(/\s+/).filter(function(w) { return w.length > 2 && !STOP_WORDS.has(w); });
        if (_wcWords.length > 0) {
          if (!chatWordMap.has(roomId)) chatWordMap.set(roomId, new Map());
          var _wcMap = chatWordMap.get(roomId);
          _wcWords.slice(0, 5).forEach(function(w) { _wcMap.set(w, (_wcMap.get(w) || 0) + 1); });
          var _wcCount = (chatWordMsgCount.get(roomId) || 0) + 1;
          chatWordMsgCount.set(roomId, _wcCount);
          if (_wcCount % 10 === 0) {
            var _wcTop = Array.from(_wcMap.entries()).sort(function(a,b){return b[1]-a[1];}).slice(0,20).map(function(e){return{word:e[0],count:e[1]};});
            io.to(roomId).emit('word-cloud-update', { words: _wcTop });
            if (_wcMap.size > 500) { var _wcArr = Array.from(_wcMap.entries()).sort(function(a,b){return b[1]-a[1];}).slice(0,300); chatWordMap.set(roomId, new Map(_wcArr)); }
          }
        }
        // Auto-queue song request if message starts with !sr
        if (message.toLowerCase().startsWith('!sr ') || message.toLowerCase().startsWith('!songrequest ')) {
          var songText = message.replace(/^!(?:sr|songrequest)\s+/i, '').trim().slice(0, 100);
          if (songText) {
            if (!songRequestMap.has(roomId)) songRequestMap.set(roomId, []);
            var srList2 = songRequestMap.get(roomId);
            if (srList2.filter(function(r) { return !r.played; }).length < 50) {
              var srId = uuidv4 ? uuidv4() : (Date.now() + '-' + Math.random());
              srList2.push({ id: srId, userId: userId, username: username, song: songText, ts: Math.floor(Date.now() / 1000), played: false });
              io.to(roomId).emit('song-request-update', { requests: srList2.filter(function(r) { return !r.played; }).slice(0, 20) });
            }
          }
        }
      })
      .catch(function(err) {
        logger.error('[chat-message] translation failed: ' + err.message);
        // Still emit the original message
        var msgId = uuidv4();
        var ts    = Math.floor(Date.now() / 1000);
        io.to(roomId).emit('chat-message', {
          id:              msgId,
          userId:          userId,
          username:        username,
          role:            socket.data.role || 'viewer',
          message:         message,
          translated:      message,
          lang:            'UNK',
          hasExternalLinks: _hasExternalLinks,
          ts:              ts
        });
      });
  });

  // ── merch-order — merch checkout payment rail (separated from tip gifts) ──
  socket.on('merch-order', function(data) {
    var roomId                 = data.roomId || socket.data.roomId;
    var fromUser               = data.fromUser || socket.data.username || 'Guest';
    var emoji                  = data.emoji || '🛍️';
    var name                   = data.name || 'Merch Order';
    var valueCents             = Math.floor(data.valueCents || 0);
    var creatorStripeAccountId = data.creatorStripeAccountId || '';

    if (!roomId || valueCents <= 0) return;
    var _moThNow = Date.now();
    if (_moThNow - (merchOrderThrottle.get(socket.data.userId) || 0) < 2000) return;
    merchOrderThrottle.set(socket.data.userId, _moThNow);

    var creatorCents  = Math.floor(valueCents * CREATOR);
    var platformCents = valueCents - creatorCents;
    var orderId       = uuidv4();
    var ts            = Math.floor(Date.now() / 1000);

    try {
      db.prepare(
        'INSERT INTO gifts (id, room_id, from_user, emoji, name, value_cents, creator_cents, platform_cents, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(orderId, roomId, fromUser, emoji, name, valueCents, creatorCents, platformCents, ts);
    } catch (dbErr) { logger.error('[merch-order] DB insert failed: ' + dbErr.message); }

    var merchAnalytics = getAnalytics(roomId);
    merchAnalytics.sessionEarnings += valueCents;

    io.to(roomId).emit('merch-sale', { id: orderId, fromUser: fromUser, emoji: emoji, name: name, valueCents: valueCents, creatorCents: creatorCents, platformCents: platformCents, ts: ts });

    try {
      var mRoom = rooms.get(roomId);
      var mHostId = mRoom ? (mRoom.hostUserId || mRoom.hostSocketId) : roomId;
      analytics.recordEarning(mHostId, roomId, 'merch', valueCents, name + ' from ' + fromUser);
    } catch (aErr) { logger.warn('[merch-order] analytics: ' + aErr.message); }

    try {
      var mRoom2 = rooms.get(roomId);
      if (mRoom2 && mRoom2.hostSocketId) {
        io.to(mRoom2.hostSocketId).emit('earnings-update', { sessionCents: sessionRevenue.get(roomId) || 0, lastCents: valueCents, source: 'merch', username: fromUser });
      }
    } catch (eu) { logger.warn('[merch-order] earnings-update: ' + eu.message); }

    var prevMRevenue = sessionRevenue.get(roomId) || 0;
    sessionRevenue.set(roomId, prevMRevenue + valueCents);

    if (creatorStripeAccountId) {
      stripeModule.createGiftCharge(
        socket.data.userId || fromUser, roomId, valueCents, creatorCents, platformCents, creatorStripeAccountId, 'merch'
      ).then(function(piResult) {
        io.to(roomId).emit('payment-intent', { clientSecret: piResult.clientSecret, paymentIntentId: piResult.paymentIntentId });
      }).catch(function(err) { logger.error('[merch-order] createGiftCharge failed: ' + err.message); });
    }
  });

  // ── send-gift — guest tipping (requires toGuestId) ─────────────────────
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

    // Per-guest running total
    if (!guestGiftTotals.has(roomId)) guestGiftTotals.set(roomId, new Map());
    var roomTotals = guestGiftTotals.get(roomId);
    roomTotals.set(toGuestId, (roomTotals.get(toGuestId) || 0) + valueCents);

    // Engagement tracking: gift spending by sender
    var _engGiftId = socket.data.userId;
    if (_engGiftId) {
      if (!engagementMap.has(roomId)) engagementMap.set(roomId, new Map());
      var _engGiftRoom = engagementMap.get(roomId);
      var _engGiftEntry = _engGiftRoom.get(_engGiftId) || { username: fromUser, chatCount: 0, reactCount: 0, giftCents: 0 };
      _engGiftEntry.giftCents += valueCents;
      _engGiftRoom.set(_engGiftId, _engGiftEntry);
    }

    // Analytics: track session earnings
    var giftAnalytics = getAnalytics(roomId);
    giftAnalytics.sessionEarnings += valueCents;

    io.to(roomId).emit('gift-received', {
      id:            giftId,
      fromUser:      fromUser,
      toGuestId:     toGuestId,
      emoji:         emoji,
      name:          name,
      valueCents:    valueCents,
      creatorCents:  creatorCents,
      platformCents: platformCents,
      toGuestId:     toGuestId,
      ts:            ts,
      guestTotals:   Object.fromEntries(roomTotals)
    });

    // Notify the gifted guest directly
    if (toGuestId) {
      io.sockets.sockets.forEach(function(s) {
        if (s.data.roomId === roomId && (s.data.userId === toGuestId || s.data.guestId === toGuestId)) {
          io.to(s.id).emit('gift-notification', { from: fromUser, emoji: emoji, name: name, valueCents: valueCents, ts: ts });
        }
      });
    }

    try {
      var hostId = giftRoom ? (giftRoom.hostUserId || giftRoom.hostSocketId) : roomId;
      analytics.recordEarning(hostId, roomId, 'gift', valueCents, name + ' from ' + fromUser);
    } catch (aErr) {
      logger.warn('[send-gift] analytics record failed: ' + aErr.message);
    }

    swanybot.onGiftReceived(roomId, fromUser, name, valueCents);

    // Auto-advance gift goal if active
    var activeGoal = giftGoalMap.get(roomId);
    if (activeGoal && activeGoal.active && valueCents > 0) {
      activeGoal.current = Math.min(activeGoal.target, activeGoal.current + valueCents);
      giftGoalMap.set(roomId, activeGoal);
      var goalPct = Math.round((activeGoal.current / activeGoal.target) * 100);
      io.to(roomId).emit('gift-goal-update', { target: activeGoal.target, current: activeGoal.current, label: activeGoal.label, active: activeGoal.active, pct: goalPct });
      if (activeGoal.current >= activeGoal.target) {
        activeGoal.active = false;
        setTimeout(function() { io.to(roomId).emit('gift-goal-complete', { label: activeGoal.label }); }, 200);
      }
    }

    // Push live earnings update to host
    try {
      if (giftRoom && giftRoom.hostSocketId) {
        io.to(giftRoom.hostSocketId).emit('earnings-update', {
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

    // Gift chain tracking — consecutive gifts within 10s
    var now10 = Math.floor(Date.now() / 1000);
    var chain = giftChainMap.get(roomId) || { count: 0, lastTs: 0 };
    if (now10 - chain.lastTs <= 10) {
      chain.count += 1;
    } else {
      chain.count = 1;
    }
    chain.lastTs = now10;
    giftChainMap.set(roomId, chain);
    if (chain.count >= 3) {
      io.to(roomId).emit('gift-chain', { count: chain.count, emoji: emoji, ts: now10 });
    }
    // Stream energy: +50 per gift
    addEnergy(roomId, fromUserId, fromUser, 50);
    addHype(roomId, 20);
    // Batch 43: gift combo burst
    var _gcKey = fromUserId + ':' + roomId;
    var _gcNow = Date.now();
    var _gcEntry = giftComboMap.get(_gcKey);
    if (_gcEntry && _gcNow - _gcEntry.lastTs < 8000) {
      clearTimeout(_gcEntry.timerId);
      _gcEntry.count += 1; _gcEntry.lastTs = _gcNow;
      if (_gcEntry.count >= 2) io.to(roomId).emit('gift-combo', { username: fromUser, count: _gcEntry.count, emoji: emoji, ts: _gcNow });
      _gcEntry.timerId = setTimeout(function() { giftComboMap.delete(_gcKey); }, 8000);
      giftComboMap.set(_gcKey, _gcEntry);
    } else {
      if (_gcEntry && _gcEntry.timerId) clearTimeout(_gcEntry.timerId);
      var _gcTimer = setTimeout(function() { giftComboMap.delete(_gcKey); }, 8000);
      giftComboMap.set(_gcKey, { roomId: roomId, count: 1, lastTs: _gcNow, timerId: _gcTimer });
    }

    // Award points to gift sender
    var giftPoints = Math.max(10, Math.floor(valueCents / 10));
    io.to(socket.id).emit('points-earned', { amount: giftPoints, reason: 'gift sent', ts: now10 });

    // Update creator goal progress on every gift
    var giftRoom2 = rooms.get(roomId);
    if (giftRoom2 && giftRoom2.creatorGoal && giftRoom2.creatorGoal.active) {
      giftRoom2.creatorGoal.currentCents = sessionRevenue.get(roomId) || 0;
      io.to(roomId).emit('creator-goal', giftRoom2.creatorGoal);
      if (giftRoom2.creatorGoal.currentCents >= giftRoom2.creatorGoal.targetCents) {
        giftRoom2.creatorGoal.active = false;
        io.to(roomId).emit('creator-goal-reached', { title: giftRoom2.creatorGoal.title, ts: now10 });
      }
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
    io.to(roomId).emit('hand-raise', { guestId: guestId, username: username, ts: ts });
    // Ordered speaker queue: add if not already present
    if (!handQueues.has(roomId)) handQueues.set(roomId, []);
    var hq = handQueues.get(roomId);
    var exists = hq.some(function(e) { return e.guestId === guestId; });
    if (!exists) {
      hq.push({ guestId: guestId, userId: socket.data.userId || guestId, username: username, ts: ts });
    }
    var hrRoom = rooms.get(roomId);
    if (hrRoom && hrRoom.hostSocketId) {
      io.to(hrRoom.hostSocketId).emit('hand-queue', { queue: hq });
    }
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
    io.to(roomId).emit('room-audio-only', { enabled: Boolean(data.enabled), ts: Math.floor(Date.now() / 1000) });
  });

  socket.on('room-private', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    io.to(roomId).emit('room-private', { enabled: Boolean(data.enabled), ts: Math.floor(Date.now() / 1000) });
  });

  socket.on('room-paywall', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var amountCents = Math.min(50000, Math.floor(data.amountCents || 0));
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
    var _subNow = Date.now();
    if (_subNow - (subscribeThrottle.get(socket.data.userId) || 0) < 60000) return;
    subscribeThrottle.set(socket.data.userId, _subNow);
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
    var _scThNow = Date.now();
    if (_scThNow - (superChatThrottle.get(socket.data.userId) || 0) < 2000) return;
    superChatThrottle.set(socket.data.userId, _scThNow);

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
    io.to(roomId).emit('chyron-update', Object.assign(safe, { roomId: roomId }));
  });

  socket.on('chyron-clear', function() {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    io.to(roomId).emit('chyron-clear', { roomId: roomId, ts: Math.floor(Date.now() / 1000) });
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
  var reactWindows = new Map(); // roomId → { count, windowStart, lastWildTs }
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

    // Cumulative emoji tally
    if (!emojiTallyMap.has(roomId)) emojiTallyMap.set(roomId, new Map());
    var _etRoom = emojiTallyMap.get(roomId);
    _etRoom.set(emoji, (_etRoom.get(emoji) || 0) + 1);

    // Engagement tracking: react count
    var _engReactId = socket.data.userId;
    if (_engReactId) {
      if (!engagementMap.has(roomId)) engagementMap.set(roomId, new Map());
      var _engReactRoom = engagementMap.get(roomId);
      var _engReactEntry = _engReactRoom.get(_engReactId) || { username: socket.data.username || 'Guest', chatCount: 0, reactCount: 0, giftCents: 0 };
      _engReactEntry.reactCount += 1;
      _engReactRoom.set(_engReactId, _engReactEntry);
    }

    // Crowd-going-wild detection: 12+ reactions in 6 seconds → crowd-wild broadcast
    var rw = reactWindows.get(roomId) || { count: 0, windowStart: now, lastWildTs: 0 };
    if (now - rw.windowStart > 6000) { rw.count = 0; rw.windowStart = now; }
    rw.count += 1;
    reactWindows.set(roomId, rw);
    if (rw.count >= 12 && now - rw.lastWildTs > 15000) {
      rw.lastWildTs = now;
      rw.count = 0;
      io.to(roomId).emit('crowd-wild', { roomId: roomId, ts: now });
    }
    // Award 1 point per reaction (throttled by the react throttle above)
    io.to(socket.id).emit('points-earned', { amount: 1, reason: 'reaction', ts: Math.floor(now / 1000) });
    // Stream energy: +1 per reaction
    addEnergy(roomId, socket.data.userId, socket.data.username, 1);
    addHype(roomId, 2);
  });

  // ── hot-moment — viewer tags a timestamp as a highlight ────────────────
  var hotMomentWindows = new Map(); // roomId → { windowKey → count }
  socket.on('hot-moment', function(data) {
    var roomId = (data && data.roomId) || socket.data.roomId;
    if (!roomId) return;
    var now = Date.now();
    var windowKey = Math.floor(now / 10000); // 10-second buckets
    if (!hotMomentWindows.has(roomId)) hotMomentWindows.set(roomId, new Map());
    var rMap = hotMomentWindows.get(roomId);
    rMap.set(windowKey, (rMap.get(windowKey) || 0) + 1);
    var count = rMap.get(windowKey);
    // Broadcast to host on threshold (5, 10, 20 unique tags in 10s)
    if (count === 5 || count === 10 || count === 20) {
      var hmRoom = rooms.get(roomId);
      if (hmRoom && hmRoom.hostSocketId) {
        io.to(hmRoom.hostSocketId).emit('hot-moment-alert', { roomId: roomId, count: count, windowKey: windowKey, ts: now });
      }
      io.to(roomId).emit('hot-moment-burst', { roomId: roomId, count: count, ts: now });
      // Record to highlight reel (only at first threshold crossing per window)
      if (count === 5) {
        if (!highlightMap.has(roomId)) highlightMap.set(roomId, []);
        var hlList = highlightMap.get(roomId);
        if (hlList.length === 0 || hlList[hlList.length - 1].windowKey !== windowKey) {
          hlList.push({ ts: now, count: count, windowKey: windowKey });
          if (hlList.length > 100) hlList.shift(); // cap at 100 highlights
        }
      }
    }
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
    var _cNow = Date.now();
    if (_cNow - (collabThrottle.get(socket.data.userId) || 0) < 2000) return;
    collabThrottle.set(socket.data.userId, _cNow);
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
    if (data.title) {
      io.to(roomId).emit('chat-message', {
        id:       require('crypto').randomUUID ? require('crypto').randomUUID() : uuidv4(),
        username: 'SYSTEM',
        message:  '📌 Stream title updated: "' + String(data.title).slice(0, 80) + '"',
        ts:       Math.floor(Date.now() / 1000),
        role:     'system',
      });
    }
  });

  // ── set-banned-words — host/cohost manages chat word filter ─────────────
  socket.on('set-banned-words', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var words = Array.isArray(data.words) ? data.words : [];
    var cleaned = [];
    words.forEach(function(w) {
      var s = String(w).toLowerCase().trim();
      if (s.length > 0 && s.length <= 50) cleaned.push(s);
    });
    bannedWordsMap.set(roomId, new Set(cleaned));
    io.to(socket.id).emit('banned-words-updated', { words: cleaned });
  });

  // ── viewer-shoutout — host calls out a viewer by name ───────────────────
  socket.on('viewer-shoutout', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var shoutoutTo = String(data.shoutoutTo || '').slice(0, 60).trim();
    var message    = String(data.message || '').slice(0, 120).trim();
    if (!shoutoutTo) return;
    io.to(roomId).emit('viewer-shoutout', {
      shoutoutTo: shoutoutTo,
      message:    message || ('Shoutout to ' + shoutoutTo + '! 🎉'),
      from:       socket.data.username || 'host',
      ts:         Math.floor(Date.now() / 1000)
    });
  });

  // ── celebrate — host fires a celebration effect to all viewers ───────────
  socket.on('celebrate', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var type = (data.type === 'fireworks' || data.type === 'hearts') ? data.type : 'confetti';
    io.to(roomId).emit('celebrate', { type: type, from: socket.data.username || 'host', ts: Math.floor(Date.now() / 1000) });
  });

  // ── chat-mention — broadcast mention alert to mentioned user ─────────────
  socket.on('chat-mention', function(data) {
    var roomId     = data.roomId || socket.data.roomId;
    var mentionedUser = String(data.mentionedUsername || '').trim();
    var msgId      = data.msgId;
    if (!roomId || !mentionedUser || !msgId) return;
    // Find the target socket by username
    io.sockets.sockets.forEach(function(s) {
      if (s.data.roomId === roomId && (s.data.username || '').toLowerCase() === mentionedUser.toLowerCase()) {
        io.to(s.id).emit('chat-mention', { by: socket.data.username || 'someone', msgId: msgId, ts: Math.floor(Date.now() / 1000) });
      }
    });
  });

  // ── chat-keyword — host sets a highlight keyword for the chat ───────────
  socket.on('chat-keyword', function(data) {
    var roomId  = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var keyword = data.keyword ? String(data.keyword).trim().slice(0, 30) : '';
    io.to(roomId).emit('chat-keyword', { keyword: keyword, by: socket.data.username || 'host', ts: Math.floor(Date.now() / 1000) });
  });

  // ── private-dm — host sends a private message to one guest socket ───────
  socket.on('private-dm', function(data) {
    var roomId    = data.roomId || socket.data.roomId;
    var toGuestId = data.toGuestId;
    var message   = String(data.message || '').trim().slice(0, 300);
    if (!roomId || !toGuestId || !message) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    io.sockets.sockets.forEach(function(s) {
      if (s.data.roomId === roomId && (s.data.userId === toGuestId || s.data.guestId === toGuestId)) {
        io.to(s.id).emit('private-dm', { from: socket.data.username || 'Host', message: message, ts: Math.floor(Date.now() / 1000) });
      }
    });
  });

  // ── pin-announcement — host pins a persistent text banner above chat ────
  socket.on('pin-announcement', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var text = data.text ? String(data.text).slice(0, 200) : null;
    io.to(roomId).emit('pin-announcement', { text: text, by: socket.data.username || 'host', ts: Math.floor(Date.now() / 1000) });
  });

  // ── spotlight-request — viewer asks host to spotlight their slot ────────
  socket.on('spotlight-request', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var room = rooms.get(roomId);
    if (!room || !room.hostSocketId) return;
    io.to(room.hostSocketId).emit('spotlight-request', {
      guestId:  socket.data.guestId || socket.data.userId,
      userId:   socket.data.userId  || socket.data.guestId,
      username: socket.data.username || 'Guest',
      ts:       Math.floor(Date.now() / 1000),
    });
  });

  // ── shop-item-pin — host pins a product card to the live feed ───────────
  socket.on('shop-item-pin', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var item = data.item ? {
      id:       String(data.item.id    || '').slice(0, 64),
      name:     String(data.item.name  || '').slice(0, 80),
      price:    Number(data.item.price || 0),
      image:    String(data.item.image || '').slice(0, 300),
      url:      String(data.item.url   || '').slice(0, 300),
      stock:    Number(data.item.stock || 0),
    } : null;
    io.to(roomId).emit('shop-item-pin', { item: item, by: socket.data.username || 'host', ts: Math.floor(Date.now() / 1000) });
  });

  // ── shop-add-to-cart — viewer taps "Buy Now" on a pinned product ─────────
  socket.on('shop-add-to-cart', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    var itemId = String(data.itemId || '').slice(0, 64);
    if (!roomId || !itemId) return;
    var username = socket.data.username || 'Guest';
    var room = rooms.get(roomId);
    if (!room || !room.hostSocketId) return;
    io.to(room.hostSocketId).emit('shop-cart-event', {
      type:     'add',
      itemId:   itemId,
      userId:   socket.data.userId,
      username: username,
      ts:       Math.floor(Date.now() / 1000),
    });
    io.to(socket.id).emit('shop-cart-confirm', { itemId: itemId, ts: Math.floor(Date.now() / 1000) });
    io.to(roomId).emit('shop-purchase-burst', { username: username, itemId: itemId, ts: Math.floor(Date.now() / 1000) });
  });

  // ── challenge-set — host creates a viewer challenge ────────────────────
  socket.on('challenge-set', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var challenge = {
      id:          uuidv4(),
      title:       String(data.title   || '').slice(0, 80),
      goal:        Math.max(1, Math.floor(data.goal   || 1)),
      unit:        String(data.unit    || 'reactions').slice(0, 20),
      reward:      String(data.reward  || '').slice(0, 100),
      progress:    0,
      active:      true,
      createdAt:   Math.floor(Date.now() / 1000),
    };
    if (!challenge.title) return;
    var room = rooms.get(roomId);
    if (!room) return;
    room.activeChallenge = challenge;
    io.to(roomId).emit('challenge-update', challenge);
  });

  // ── challenge-progress — server increments challenge progress ─────────
  socket.on('challenge-progress', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var room = rooms.get(roomId);
    if (!room || !room.activeChallenge || !room.activeChallenge.active) return;
    room.activeChallenge.progress = Math.min(
      room.activeChallenge.goal,
      (room.activeChallenge.progress || 0) + Math.max(1, Math.floor(data.amount || 1))
    );
    io.to(roomId).emit('challenge-update', room.activeChallenge);
    if (room.activeChallenge.progress >= room.activeChallenge.goal) {
      room.activeChallenge.active = false;
      io.to(roomId).emit('challenge-complete', {
        id:     room.activeChallenge.id,
        title:  room.activeChallenge.title,
        reward: room.activeChallenge.reward,
        ts:     Math.floor(Date.now() / 1000),
      });
    }
  });

  // ── live-stats-request — host polls aggregated live session stats ──────
  socket.on('live-stats-request', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room     = rooms.get(roomId);
    var analytics = roomAnalytics.get(roomId) || {};
    var revenue   = sessionRevenue.get(roomId) || 0;
    var viewers   = room ? room.viewers.size : 0;
    var gifts     = giftLeaderboards.get(roomId) || [];
    var tally     = emojiTallyMap.get(roomId);
    var topEmoji  = null;
    if (tally && tally.size > 0) {
      var topCount = 0;
      tally.forEach(function(count, emoji) { if (count > topCount) { topCount = count; topEmoji = emoji; } });
    }
    io.to(socket.id).emit('live-stats', {
      viewers:        viewers,
      peakViewers:    analytics.peak || viewers,
      revenueCents:   revenue,
      topGifter:      gifts.length > 0 ? gifts[0] : null,
      topEmoji:       topEmoji,
      chatCount:      analytics.msgCounts ? Object.values(analytics.msgCounts).reduce(function(a, b) { return a + b; }, 0) : 0,
      ts:             Math.floor(Date.now() / 1000),
    });
  });

  // ── creator-goal — host sets/updates a tipping goal bar ────────────────
  socket.on('creator-goal', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room = rooms.get(roomId);
    if (!room) return;
    var goal = {
      title:       String(data.title    || 'Stream Goal').slice(0, 60),
      targetCents: Math.max(100, Math.floor(data.targetCents || 1000)),
      currentCents: sessionRevenue.get(roomId) || 0,
      active:      true,
    };
    room.creatorGoal = goal;
    io.to(roomId).emit('creator-goal', goal);
  });

  // ── viewer-points — server awards points to a viewer's session balance ──
  socket.on('earn-points', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var amount = Math.max(1, Math.min(1000, Math.floor(data.amount || 1)));
    var reason = String(data.reason || 'action').slice(0, 30);
    io.to(socket.id).emit('points-earned', { amount: amount, reason: reason, ts: Math.floor(Date.now() / 1000) });
  });

  // ── shoutout — host gives a public shoutout to a viewer ─────────────────
  socket.on('shoutout', function(data) {
    var roomId   = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var username = String(data.username || '').trim().slice(0, 32);
    var reason   = String(data.reason   || '').trim().slice(0, 80);
    if (!username) return;
    io.to(roomId).emit('shoutout', {
      username: username,
      reason:   reason || '❤️',
      by:       socket.data.username || 'host',
      ts:       Math.floor(Date.now() / 1000),
    });
    io.to(roomId).emit('chat-message', {
      id:       uuidv4(),
      username: 'SYSTEM',
      message:  '📣 Shoutout to @' + username + (reason ? ': ' + reason : '!'),
      ts:       Math.floor(Date.now() / 1000),
      role:     'system',
    });
  });

  // ── stream-countdown — host sets a pre-stream countdown timer ───────────
  socket.on('stream-countdown', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var minutes  = Math.max(1, Math.min(60, Math.floor(data.minutes || 5)));
    var label    = String(data.label || 'Stream starts in').slice(0, 40);
    var endsAt   = Math.floor(Date.now() / 1000) + (minutes * 60);
    var room     = rooms.get(roomId);
    if (room) room.countdown = { endsAt: endsAt, label: label };
    io.to(roomId).emit('stream-countdown', { endsAt: endsAt, label: label });
  });

  // ── countdown-cancel — host cancels an active countdown ─────────────────
  socket.on('countdown-cancel', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room = rooms.get(roomId);
    if (room) room.countdown = null;
    io.to(roomId).emit('stream-countdown', null);
  });

  // ── stream-rating — viewer submits a 1-5 star rating for the stream ────
  socket.on('stream-rating', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var rating = Math.min(5, Math.max(1, Math.floor(data.rating || 3)));
    var userId = socket.data.userId || socket.id;
    // Store in an in-memory map keyed by roomId; userId may only rate once
    if (!rooms.has(roomId)) return;
    var room = rooms.get(roomId);
    if (!room.ratings) room.ratings = new Map();
    room.ratings.set(userId, rating);
    // Compute aggregate
    var total = 0; var count = 0;
    room.ratings.forEach(function(r) { total += r; count += 1; });
    var avg = count > 0 ? (Math.round((total / count) * 10) / 10) : 0;
    // Broadcast updated average to host
    if (room.hostSocketId) {
      io.to(room.hostSocketId).emit('stream-rating-update', { avg: avg, count: count, ts: Math.floor(Date.now() / 1000) });
    }
    io.to(socket.id).emit('stream-rating-ack', { rating: rating, avg: avg, count: count });
  });

  // ── audience-vote — host poses a binary yes/no or A/B question ──────────
  socket.on('audience-vote-start', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var question = String(data.question || 'Vote now!').slice(0, 100);
    var optA     = String(data.optA || 'YES').slice(0, 30);
    var optB     = String(data.optB || 'NO').slice(0, 30);
    var durationSec = Math.max(10, Math.min(300, Math.floor(data.durationSec || 30)));
    var room = rooms.get(roomId);
    if (!room) return;
    var vote = { id: uuidv4(), question: question, optA: optA, optB: optB, votesA: new Map(), votesB: new Map(), active: true, endsAt: Math.floor(Date.now() / 1000) + durationSec };
    room.audienceVote = vote;
    io.to(roomId).emit('audience-vote', { id: vote.id, question: question, optA: optA, optB: optB, endsAt: vote.endsAt, countA: 0, countB: 0 });
    vote.timer = setTimeout(function() {
      if (room.audienceVote && room.audienceVote.id === vote.id) {
        vote.active = false;
        io.to(roomId).emit('audience-vote-end', { id: vote.id, countA: vote.votesA.size, countB: vote.votesB.size, optA: optA, optB: optB });
      }
    }, durationSec * 1000);
  });

  socket.on('audience-vote-cast', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var room = rooms.get(roomId);
    if (!room || !room.audienceVote || !room.audienceVote.active) return;
    var vote = room.audienceVote;
    var side = data.side; // 'A' or 'B'
    if (side !== 'A' && side !== 'B') return;
    var userId = socket.data.userId || socket.id;
    vote.votesA.delete(userId); vote.votesB.delete(userId);
    if (side === 'A') vote.votesA.set(userId, 1);
    else vote.votesB.set(userId, 1);
    io.to(roomId).emit('audience-vote-update', { id: vote.id, countA: vote.votesA.size, countB: vote.votesB.size });
  });

  // ── clip-pin — host pins a clip/moment link to chat ─────────────────────
  socket.on('clip-pin', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var label = String(data.label || '🎬 Highlight clip').slice(0, 60);
    var url   = String(data.url   || '').slice(0, 300);
    var ts    = Math.floor(Date.now() / 1000);
    io.to(roomId).emit('chat-message', {
      id:       uuidv4(),
      username: 'SYSTEM',
      message:  '🎬 ' + label + (url ? ' → ' + url : ''),
      role:     'system',
      ts:       ts,
      clipUrl:  url,
      clipLabel: label,
    });
    io.to(roomId).emit('clip-pinned', { label: label, url: url, ts: ts });
  });

  // ── layout-sync — host broadcasts stage layout preference ───────────────
  socket.on('layout-sync', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var layout = String(data.layout || 'grid').slice(0, 20);
    io.to(roomId).emit('layout-sync', { layout: layout, by: socket.data.username || 'host', ts: Math.floor(Date.now() / 1000) });
  });

  // ── Batch 21: Watch Together, Sound Alert, stream-milestone broadcast ─────

  // watch-together-start — host shares a video URL for synchronized co-watching
  socket.on('watch-together-start', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var url  = String(data.url || '').slice(0, 500);
    var ts   = Math.floor(Date.now() / 1000);
    if (!url) return;
    var session = { url: url, currentTime: 0, playing: true, ts: ts, by: socket.data.username || 'host' };
    watchTogetherMap.set(roomId, session);
    io.to(roomId).emit('watch-together', session);
  });

  // watch-together-sync — host sends current playback time for late joiners
  socket.on('watch-together-sync', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var currentTime = Math.max(0, Number(data.currentTime) || 0);
    var playing     = data.playing !== false;
    var session = watchTogetherMap.get(roomId);
    if (session) { session.currentTime = currentTime; session.playing = playing; }
    io.to(roomId).emit('watch-together-sync', { currentTime: currentTime, playing: playing, ts: Math.floor(Date.now() / 1000) });
  });

  // watch-together-end — host ends the co-watch session
  socket.on('watch-together-end', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    watchTogetherMap.delete(roomId);
    io.to(roomId).emit('watch-together-end', { ts: Math.floor(Date.now() / 1000) });
  });

  // ── Batch 22: Q&A Answer, Room Theme, Shop Carousel ──────────────────────

  // qa-answer — host attaches a typed answer to a Q&A question
  socket.on('qa-answer', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var id     = String(data.id || '').slice(0, 40);
    var answer = String(data.answer || '').slice(0, 300).trim();
    if (!id || !answer) return;
    io.to(roomId).emit('qa-answered', { id: id, answer: answer, by: socket.data.username || 'host', ts: Math.floor(Date.now() / 1000) });
  });

  // room-theme — host sets a visual ambiance theme for the stage
  socket.on('room-theme', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var VALID_THEMES = ['default', 'cosmic', 'forest', 'sunset', 'ocean', 'neon', 'rose', 'gold'];
    var theme = String(data.theme || 'default');
    if (VALID_THEMES.indexOf(theme) < 0) theme = 'default';
    io.to(roomId).emit('room-theme', { theme: theme, ts: Math.floor(Date.now() / 1000) });
  });

  // shop-carousel-set — host sets an array of shop items as a carousel
  socket.on('shop-carousel-set', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var items = Array.isArray(data.items) ? data.items.slice(0, 12).map(function(item) {
      return {
        id:    String(item.id || '').slice(0, 40),
        name:  String(item.name || '').slice(0, 80),
        price: Math.max(0, Math.floor(Number(item.price) || 0)),
        image: String(item.image || '').slice(0, 300),
        url:   String(item.url || '').slice(0, 300),
      };
    }) : [];
    io.to(roomId).emit('shop-carousel', { items: items, ts: Math.floor(Date.now() / 1000) });
  });

  // ── Batch 23: Points redemption, Next-stream schedule ────────────────────

  // redeem-points — viewer spends points for a perk (chat color, badge, shoutout)
  socket.on('redeem-points', function(data) {
    var roomId  = data.roomId || socket.data.roomId;
    if (!roomId || !data.perk) return;
    var userId  = socket.data.userId;
    if (!userId) return;
    var PERK_COSTS = { chatcolor: 50, badge: 100, shoutout: 200, name_highlight: 150 };
    var perk = String(data.perk);
    var cost = PERK_COSTS[perk];
    if (!cost) return;
    // Unicast back to requesting viewer
    io.to(socket.id).emit('redeem-ack', { perk: perk, cost: cost, userId: userId, ts: Math.floor(Date.now() / 1000) });
    // Notify room for shoutout perk
    if (perk === 'shoutout') {
      io.to(roomId).emit('shoutout', { username: socket.data.username || userId, reason: 'redeemed a shoutout', ts: Math.floor(Date.now() / 1000) });
    }
  });

  // next-stream — host sets a next-stream schedule visible to viewers
  socket.on('next-stream', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var ts    = Number(data.ts) || 0;
    var label = String(data.label || 'Next Stream').slice(0, 80);
    if (!ts) return;
    io.to(roomId).emit('next-stream', { ts: ts, label: label, by: socket.data.username || 'host' });
  });

  // ── Batch 24: Team Battle Arena, Reaction Heatmap ────────────────────────

  // team-battle-start — host launches a team vs team gift contribution battle
  socket.on('team-battle-start', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var redLabel  = String(data.redLabel  || 'RED TEAM').slice(0, 40);
    var blueLabel = String(data.blueLabel || 'BLUE TEAM').slice(0, 40);
    var duration  = Math.min(Math.max(Number(data.duration) || 60, 10), 300);
    var endsAt    = Math.floor(Date.now() / 1000) + duration;
    var prev = teamBattleMap.get(roomId);
    if (prev && prev.timerId) clearTimeout(prev.timerId);
    var battle = { redLabel: redLabel, blueLabel: blueLabel, redScore: 0, blueScore: 0, active: true, endsAt: endsAt, timerId: null };
    battle.timerId = setTimeout(function() {
      var b = teamBattleMap.get(roomId);
      if (!b || !b.active) return;
      b.active = false;
      var winner = b.redScore >= b.blueScore ? 'red' : 'blue';
      io.to(roomId).emit('team-battle-update', { redLabel: b.redLabel, blueLabel: b.blueLabel, redScore: b.redScore, blueScore: b.blueScore, active: false, winner: winner });
    }, duration * 1000);
    teamBattleMap.set(roomId, battle);
    io.to(roomId).emit('team-battle-update', { redLabel: redLabel, blueLabel: blueLabel, redScore: 0, blueScore: 0, active: true, endsAt: endsAt });
  });

  // team-battle-gift — any user contributes points to a team in an active battle
  socket.on('team-battle-gift', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var b = teamBattleMap.get(roomId);
    if (!b || !b.active) return;
    var team   = data.team === 'blue' ? 'blue' : 'red';
    var amount = Math.min(Math.max(Number(data.amount) || 1, 1), 1000);
    if (team === 'red')  b.redScore  += amount;
    if (team === 'blue') b.blueScore += amount;
    io.to(roomId).emit('team-battle-update', { redLabel: b.redLabel, blueLabel: b.blueLabel, redScore: b.redScore, blueScore: b.blueScore, active: b.active, endsAt: b.endsAt });
  });

  // team-battle-end — host manually ends battle early
  socket.on('team-battle-end', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var b = teamBattleMap.get(roomId);
    if (!b) return;
    if (b.timerId) clearTimeout(b.timerId);
    b.active = false;
    var winner = b.redScore >= b.blueScore ? 'red' : 'blue';
    io.to(roomId).emit('team-battle-update', { redLabel: b.redLabel, blueLabel: b.blueLabel, redScore: b.redScore, blueScore: b.blueScore, active: false, winner: winner });
  });

  // reaction-heat — user fires a positioned emoji reaction onto the stage
  socket.on('reaction-heat', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var x     = Math.min(Math.max(Number(data.x) || 50, 0), 100);
    var y     = Math.min(Math.max(Number(data.y) || 50, 0), 100);
    var emoji = String(data.emoji || '❤️').slice(0, 4);
    io.to(roomId).emit('reaction-heat', { x: x, y: y, emoji: emoji, ts: Date.now() });
  });

  // ── Batch 25: Collaborative Whiteboard ───────────────────────────────────

  // canvas-draw — any user draws a line segment on the shared whiteboard
  socket.on('canvas-draw', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var VALID_COLORS = /^#[0-9a-fA-F]{3,6}$|^rgba?\(/;
    var color  = String(data.color || '#C9A84C').slice(0, 24);
    if (!VALID_COLORS.test(color)) color = '#C9A84C';
    var size   = Math.min(Math.max(Number(data.size) || 3, 1), 40);
    var x1 = Math.min(Math.max(Number(data.x1) || 0, 0), 100);
    var y1 = Math.min(Math.max(Number(data.y1) || 0, 0), 100);
    var x2 = Math.min(Math.max(Number(data.x2) || 0, 0), 100);
    var y2 = Math.min(Math.max(Number(data.y2) || 0, 0), 100);
    var seg = { x1: x1, y1: y1, x2: x2, y2: y2, color: color, size: size };
    var strokes = whiteboardMap.get(roomId) || [];
    strokes.push(seg);
    if (strokes.length > 800) strokes = strokes.slice(-800);
    whiteboardMap.set(roomId, strokes);
    io.to(roomId).emit('canvas-draw', seg);
  });

  // canvas-clear — host/cohost clears the whiteboard
  socket.on('canvas-clear', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    whiteboardMap.set(roomId, []);
    io.to(roomId).emit('canvas-clear', {});
  });

  // ── Batch 26: Karaoke/Lyrics, Lucky Draw, Stream Chapters ────────────────

  // karaoke-set — host sets/updates live lyrics text
  socket.on('karaoke-set', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var text = String(data.text || '').slice(0, 300);
    var k = { text: text, active: !!text, ts: Math.floor(Date.now() / 1000) };
    karaokeMap.set(roomId, k);
    io.to(roomId).emit('karaoke-update', k);
  });

  // karaoke-clear — host clears lyrics
  socket.on('karaoke-clear', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    karaokeMap.delete(roomId);
    io.to(roomId).emit('karaoke-update', { text: '', active: false });
  });

  // lucky-draw — host spins a lucky draw; server picks random viewer from active sockets
  socket.on('lucky-draw', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var room = rooms.get(roomId);
    if (!room || !room.guests) return;
    var viewers = room.guests.filter(function(g) { return g.role === 'viewer' || g.role === 'guest'; });
    if (viewers.length === 0) {
      io.to(socket.id).emit('lucky-draw-result', { winner: null, error: 'No viewers to pick from' });
      return;
    }
    var winner = viewers[Math.floor(Math.random() * viewers.length)];
    var prize = String(data.prize || '').slice(0, 80);
    io.to(roomId).emit('lucky-draw-result', { winner: winner.username || winner.guestId, prize: prize, ts: Math.floor(Date.now() / 1000) });
  });

  // chapter-mark — host marks a named chapter/timestamp during live
  socket.on('chapter-mark', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var label = String(data.label || 'Chapter').slice(0, 60);
    var room  = rooms.get(roomId);
    var elapsed = room && room.liveStartedAt ? Math.floor(Date.now() / 1000) - room.liveStartedAt : 0;
    var chapter = { label: label, ts: Math.floor(Date.now() / 1000), elapsed: Math.max(0, elapsed) };
    var chapters = chaptersMap.get(roomId) || [];
    chapters.push(chapter);
    chaptersMap.set(roomId, chapters.slice(-50));
    io.to(roomId).emit('chapter-mark', chapter);
  });

  // ── Batch 27: Sentiment Meter, Screen Annotations, Guest Intro Cards ─────

  // sentiment-vote — viewer thumbs up or down (deduplicated per socket)
  socket.on('sentiment-vote', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var vote = data.vote === 'down' ? 'down' : 'up';
    var sm = sentimentMap.get(roomId);
    if (!sm) { sm = { up: 0, down: 0, voters: new Map() }; sentimentMap.set(roomId, sm); }
    var prevVote = sm.voters.get(socket.id);
    if (prevVote) {
      if (prevVote === vote) return; // same vote, ignore
      sm[prevVote] = Math.max(0, sm[prevVote] - 1); // remove old vote
    }
    sm[vote]++;
    sm.voters.set(socket.id, vote);
    io.to(roomId).emit('sentiment-update', { up: sm.up, down: sm.down });
  });

  // screen-annotate — viewer taps on screen share to leave a floating dot
  socket.on('screen-annotate', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var x     = Math.min(Math.max(Number(data.x) || 50, 0), 100);
    var y     = Math.min(Math.max(Number(data.y) || 50, 0), 100);
    var color = String(data.color || '#C9A84C').slice(0, 24);
    io.to(roomId).emit('screen-annotate', { x: x, y: y, color: color, by: socket.data.username || 'viewer', ts: Date.now() });
  });

  // guest-intro — server auto-broadcasts when a guest joins the stage (triggered by host/server)
  socket.on('guest-intro', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var username = String(data.username || '').slice(0, 60);
    var bio      = String(data.bio || '').slice(0, 120);
    var emoji    = String(data.emoji || '🎤').slice(0, 4);
    if (!username) return;
    io.to(roomId).emit('guest-intro', { username: username, bio: bio, emoji: emoji, ts: Math.floor(Date.now() / 1000) });
  });

  // ── Batch 28: Now Playing, Tip Ticker, Watch-Time Loyalty ────────────────

  // Track viewer join time when they join the room
  socket.on('viewer-ping', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (!viewerJoinMap.has(roomId)) viewerJoinMap.set(roomId, new Map());
    var rMap = viewerJoinMap.get(roomId);
    if (!rMap.has(socket.id)) rMap.set(socket.id, Math.floor(Date.now() / 1000));
    // Return current watch time to the requesting socket
    var elapsed = Math.floor(Date.now() / 1000) - (rMap.get(socket.id) || Math.floor(Date.now() / 1000));
    io.to(socket.id).emit('watch-time', { elapsed: elapsed });
  });

  // now-playing-set — host sets the "Now Playing" song name
  socket.on('now-playing-set', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var title  = String(data.title  || '').slice(0, 80);
    var artist = String(data.artist || '').slice(0, 60);
    var emoji  = String(data.emoji  || '🎵').slice(0, 4);
    if (!title) {
      nowPlayingMap.delete(roomId);
      io.to(roomId).emit('now-playing', null);
      return;
    }
    var np = { title: title, artist: artist, emoji: emoji, ts: Math.floor(Date.now() / 1000) };
    nowPlayingMap.set(roomId, np);
    io.to(roomId).emit('now-playing', np);
  });

  // tip-ticker-set — host queues up rotating tip/fact lines
  socket.on('tip-ticker-set', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var items = Array.isArray(data.items) ? data.items : [];
    var cleaned = items.slice(0, 10).map(function(item, i) {
      return { text: String(item.text || item || '').slice(0, 120), id: i };
    }).filter(function(item) { return item.text; });
    tipTickerMap.set(roomId, cleaned);
    io.to(roomId).emit('tip-ticker', { items: cleaned });
  });

  // sound-alert — host triggers a named alert sound for the room
  socket.on('sound-alert', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var VALID_ALERTS = ['goal', 'hype', 'sub', 'win', 'alarm', 'fanfare', 'applause'];
    var alertType = String(data.type || 'hype').slice(0, 20);
    if (VALID_ALERTS.indexOf(alertType) < 0) return;
    io.to(roomId).emit('sound-alert', { type: alertType, ts: Math.floor(Date.now() / 1000), by: socket.data.username || 'host' });
  });

  // ── set-guest-role — host promotes/demotes a guest to/from co-host ──────
  socket.on('set-guest-role', function(data) {
    var roomId  = data.roomId || socket.data.roomId;
    var guestId = data.guestId;
    var newRole = data.role; // 'cohost' | 'guest'
    if (!roomId || !guestId) return;
    if (socket.data.role !== 'host') return;
    if (newRole !== 'cohost' && newRole !== 'guest') return;
    // Find the target socket by guestId
    var targetSocket = null;
    io.sockets.sockets.forEach(function(s) {
      if ((s.data.guestId === guestId || s.data.userId === guestId) && s.data.roomId === roomId) {
        targetSocket = s;
      }
    });
    if (targetSocket) {
      targetSocket.data.role = newRole;
      io.to(targetSocket.id).emit('role-changed', { role: newRole, roomId: roomId });
    }
    io.to(roomId).emit('guest-role-changed', { guestId: guestId, role: newRole, by: socket.data.username || 'host', ts: Math.floor(Date.now() / 1000) });
  });

  // ── set-room-tags — host sets topic tags for discoverability ────────────
  socket.on('set-room-tags', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var tags = Array.isArray(data.tags) ? data.tags : [];
    var cleaned = tags.map(function(t) { return String(t).toLowerCase().trim().replace(/[^a-z0-9 _-]/g, '').slice(0, 20); }).filter(function(t) { return t.length > 0; }).slice(0, 8);
    tagsMap.set(roomId, cleaned);
    io.to(roomId).emit('room-tags', { tags: cleaned, ts: Math.floor(Date.now() / 1000) });
  });

  // ── pin-link — host pins a clickable CTA link to the stream ─────────────
  socket.on('pin-link', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var link = data.url ? { url: String(data.url).slice(0, 300), label: String(data.label || 'Visit Link').slice(0, 40), emoji: String(data.emoji || '🔗').slice(0, 4) } : null;
    pinnedLinkMap.set(roomId, link);
    io.to(roomId).emit('link-pinned', { link: link, ts: Math.floor(Date.now() / 1000) });
  });

  // ── set-slow-mode — host/cohost configures per-viewer message cooldown ──
  socket.on('set-slow-mode', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var secs = Math.max(0, Math.min(120, Math.floor(data.seconds || 0)));
    slowModeMap.set(roomId, secs);
    if (secs === 0) slowModeLastMsg.delete(roomId);
    io.to(roomId).emit('slow-mode-changed', { seconds: secs, ts: Math.floor(Date.now() / 1000) });
  });

  // ── chat-ban / chat-unban — host/cohost bans user from chat only ────────
  socket.on('chat-ban', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    var targetId = data.userId;
    if (!roomId || !targetId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    if (!chatBannedMap.has(roomId)) chatBannedMap.set(roomId, new Set());
    chatBannedMap.get(roomId).add(String(targetId));
    io.to(roomId).emit('chat-banned', { userId: targetId, username: data.username || targetId, bannedBy: socket.data.username || 'host', ts: Math.floor(Date.now() / 1000) });
  });

  socket.on('chat-unban', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    var targetId = data.userId;
    if (!roomId || !targetId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    if (chatBannedMap.has(roomId)) chatBannedMap.get(roomId).delete(String(targetId));
    io.to(roomId).emit('chat-unbanned', { userId: targetId, ts: Math.floor(Date.now() / 1000) });
  });

  // ── request-highlights — host fetches collected hot-moment timestamps ────
  socket.on('request-highlights', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var list = highlightMap.get(roomId) || [];
    io.to(socket.id).emit('highlight-reel', { roomId: roomId, highlights: list, ts: Date.now() });
  });

  // ── gift-goal-set — host sets a donation goal for the stream ─────────
  socket.on('gift-goal-set', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var target = Math.min(1000000, Math.max(1, Math.floor(data.target || 0)));
    var label  = String(data.label || 'Stream Goal').slice(0, 60);
    if (target <= 0) {
      giftGoalMap.delete(roomId);
      io.to(roomId).emit('gift-goal-update', null);
      return;
    }
    var existing = giftGoalMap.get(roomId);
    var current  = existing ? existing.current : 0;
    var goal = { target: target, current: current, label: label, active: true };
    giftGoalMap.set(roomId, goal);
    io.to(roomId).emit('gift-goal-update', { target: goal.target, current: goal.current, label: goal.label, active: true });
  });

  // ── gift-goal-progress — accumulate gift amount toward active goal ────
  // (auto-called internally from send-gift event — mirrors via room broadcast)
  socket.on('gift-goal-contribute', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var goal = giftGoalMap.get(roomId);
    if (!goal || !goal.active) return;
    var cents = Math.min(50000, Math.max(0, Math.floor(data.cents || 0)));
    goal.current = Math.min(goal.target, goal.current + cents);
    giftGoalMap.set(roomId, goal);
    var pct = Math.round((goal.current / goal.target) * 100);
    io.to(roomId).emit('gift-goal-update', { target: goal.target, current: goal.current, label: goal.label, active: goal.active, pct: pct });
    if (goal.current >= goal.target) {
      goal.active = false;
      setTimeout(function() { io.to(roomId).emit('gift-goal-complete', { label: goal.label }); }, 200);
    }
  });

  // ── stream-mood — viewer submits an emoji mood vote, server tallies ───
  var MOOD_EMOJIS = { fire: '🔥', party: '🎉', chill: '💜', love: '❤️', wow: '😮' };
  socket.on('mood-vote', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var key = String(data.key || '');
    if (!MOOD_EMOJIS[key]) return;
    if (!moodMap.has(roomId)) moodMap.set(roomId, { emoji: '🔥', label: 'Hot', counts: { fire: 0, party: 0, chill: 0, love: 0, wow: 0 } });
    var m = moodMap.get(roomId);
    m.counts[key] = (m.counts[key] || 0) + 1;
    // Determine dominant mood
    var top = Object.keys(m.counts).reduce(function(a, b) { return m.counts[a] >= m.counts[b] ? a : b; });
    var MOOD_LABELS = { fire: 'Hot', party: 'Party', chill: 'Chill', love: 'Love', wow: 'Wow' };
    m.emoji = MOOD_EMOJIS[top];
    m.label = MOOD_LABELS[top];
    moodMap.set(roomId, m);
    io.to(roomId).emit('mood-update', { emoji: m.emoji, label: m.label, key: top, counts: Object.assign({}, m.counts) });
  });

  // ── clip-vote — viewer votes on a saved clip ──────────────────────────
  socket.on('clip-vote', function(data) {
    var clipId = String(data.clipId || '').slice(0, 128);
    var vote   = data.vote; // 'up' or 'down'
    if (!clipId || (vote !== 'up' && vote !== 'down')) return;
    var _cvNow = Date.now();
    if (!clipVotesMap.has(clipId)) clipVotesMap.set(clipId, { up: 0, down: 0, voters: new Map() });
    var cv = clipVotesMap.get(clipId);
    var prevVote = cv.voters.get(socket.id);
    if (prevVote) {
      if (prevVote === vote) return; // same vote, ignore
      cv[prevVote] = Math.max(0, cv[prevVote] - 1);
    }
    cv[vote]++;
    cv.voters.set(socket.id, vote);
    // Broadcast to anyone in the room if provided, else just ack to sender
    var roomId = socket.data.roomId;
    var payload = { clipId: clipId, up: cv.up, down: cv.down };
    if (roomId) {
      io.to(roomId).emit('clip-vote-update', payload);
    } else {
      io.to(socket.id).emit('clip-vote-update', payload);
    }
  });

  // ── cohost-request — viewer requests co-host slot ─────────────────────
  socket.on('cohost-request', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role === 'host' || socket.data.role === 'cohost') return;
    var _cqNow = Date.now();
    if (_cqNow - (cohostQueueThrottle.get(socket.data.userId) || 0) < 30000) return;
    cohostQueueThrottle.set(socket.data.userId, _cqNow);
    if (!cohostQueueMap.has(roomId)) cohostQueueMap.set(roomId, []);
    var queue = cohostQueueMap.get(roomId);
    var alreadyQueued = queue.some(function(e) { return e.userId === socket.data.userId; });
    if (alreadyQueued) return;
    if (queue.length >= 20) return; // cap queue
    var entry = { socketId: socket.id, userId: socket.data.userId, username: socket.data.username || 'Guest', ts: Math.floor(_cqNow / 1000) };
    queue.push(entry);
    var room = rooms.get(roomId);
    if (room && room.hostSocketId) {
      io.to(room.hostSocketId).emit('cohost-queue-update', { queue: queue.map(function(e) { return { userId: e.userId, username: e.username, ts: e.ts }; }) });
    }
    io.to(socket.id).emit('cohost-request-ack', { status: 'queued', position: queue.length });
  });

  // ── cohost-queue-approve — host approves a co-host request ───────────
  socket.on('cohost-queue-approve', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId || socket.data.role !== 'host') return;
    var targetUserId = String(data.userId || '');
    if (!targetUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) return;
    var queue = cohostQueueMap.get(roomId);
    if (!queue) return;
    var entryIdx = queue.findIndex(function(e) { return e.userId === targetUserId; });
    if (entryIdx < 0) return;
    var entry = queue[entryIdx];
    queue.splice(entryIdx, 1);
    cohostQueueMap.set(roomId, queue);
    // Notify the approved socket
    io.to(entry.socketId).emit('role-changed', { role: 'cohost', approvedBy: socket.data.username });
    io.to(roomId).emit('guest-role-changed', { guestId: entry.userId, role: 'cohost' });
    // Update queue for host
    io.to(socket.id).emit('cohost-queue-update', { queue: queue.map(function(e) { return { userId: e.userId, username: e.username, ts: e.ts }; }) });
  });

  // ── cohost-queue-dismiss — host removes someone from queue ────────────
  socket.on('cohost-queue-dismiss', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId || socket.data.role !== 'host') return;
    var targetUserId = String(data.userId || '');
    var queue = cohostQueueMap.get(roomId) || [];
    cohostQueueMap.set(roomId, queue.filter(function(e) { return e.userId !== targetUserId; }));
    io.to(socket.id).emit('cohost-queue-update', { queue: cohostQueueMap.get(roomId).map(function(e) { return { userId: e.userId, username: e.username, ts: e.ts }; }) });
  });

  // ── badge-award — host awards a badge to a user ───────────────────────
  socket.on('badge-award', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var targetUserId = String(data.userId || '');
    if (!targetUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) return;
    var badge = String(data.badge || '').slice(0, 32);
    var VALID_BADGES = ['🏆', '⭐', '🔥', '💎', '👑', '🎯', '💜', '🎤', '🎁', '🚀'];
    if (!VALID_BADGES.includes(badge)) return;
    if (!userBadgesMap.has(targetUserId)) userBadgesMap.set(targetUserId, new Set());
    userBadgesMap.get(targetUserId).add(badge);
    io.to(roomId).emit('badge-awarded', { userId: targetUserId, badge: badge, awardedBy: socket.data.username || 'Host' });
  });

  // ── react-combo — server tracks rapid same-emoji reactions for combo overlay ──
  socket.on('react-combo', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var emoji = String(data.emoji || '❤️').slice(0, 4);
    var _rcNow = Date.now();
    if (!reactionComboMap.has(roomId)) reactionComboMap.set(roomId, { emoji: emoji, count: 0, lastTs: 0, timerId: null });
    var combo = reactionComboMap.get(roomId);
    if (_rcNow - combo.lastTs > 3000) {
      // stale — reset
      if (combo.timerId) clearTimeout(combo.timerId);
      combo.count = 0; combo.emoji = emoji;
    }
    if (combo.emoji !== emoji) { combo.count = 0; combo.emoji = emoji; }
    combo.count++;
    combo.lastTs = _rcNow;
    // Broadcast on milestones
    var MILESTONES = [3, 5, 10, 20, 50, 100];
    if (MILESTONES.indexOf(combo.count) >= 0) {
      io.to(roomId).emit('react-combo-hit', { emoji: emoji, count: combo.count, ts: _rcNow });
    }
    // Auto-reset after 3s of inactivity
    if (combo.timerId) clearTimeout(combo.timerId);
    combo.timerId = setTimeout(function() {
      var c = reactionComboMap.get(roomId);
      if (c && c.emoji === emoji) c.count = 0;
    }, 3000);
  });

  // ── viewer-spotlight — host spins to spotlight a random viewer ────────
  socket.on('viewer-spotlight-spin', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var candidates = [];
    io.sockets.sockets.forEach(function(s) {
      if (s.data.roomId === roomId && s.data.role === 'viewer' && s.data.username) {
        candidates.push({ socketId: s.id, userId: s.data.userId, username: s.data.username });
      }
    });
    if (candidates.length === 0) {
      io.to(socket.id).emit('viewer-spotlight-result', { error: 'No viewers to spotlight' });
      return;
    }
    var picked = candidates[Math.floor(Math.random() * candidates.length)];
    var endsAt = Math.floor(Date.now() / 1000) + (data.duration || 30);
    viewerSpotlightMap.set(roomId, { userId: picked.userId, username: picked.username, socketId: picked.socketId, endsAt: endsAt });
    io.to(roomId).emit('viewer-spotlight', { userId: picked.userId, username: picked.username, endsAt: endsAt });
    // Auto-clear
    setTimeout(function() {
      var sp = viewerSpotlightMap.get(roomId);
      if (sp && sp.userId === picked.userId) {
        viewerSpotlightMap.delete(roomId);
        io.to(roomId).emit('viewer-spotlight', null);
      }
    }, (data.duration || 30) * 1000);
  });

  // ── chat-star — viewer stars a message to lift it to highlights strip ───
  socket.on('chat-star', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId || !data.msgId) return;
    var _csNow = Date.now();
    if (_csNow - (starThrottle.get(socket.data.userId) || 0) < 2000) return;
    starThrottle.set(socket.data.userId, _csNow);
    var msgId    = String(data.msgId).slice(0, 64);
    var message  = String(data.message || '').slice(0, 300);
    var username = String(data.username || '').slice(0, 40);
    if (!starredMsgsMap.has(roomId)) starredMsgsMap.set(roomId, []);
    var starred = starredMsgsMap.get(roomId);
    var existing = starred.find(function(m) { return m.id === msgId; });
    if (existing) {
      existing.starCount++;
    } else {
      starred.unshift({ id: msgId, username: username, message: message, starCount: 1, ts: Math.floor(_csNow / 1000) });
      if (starred.length > 20) starred.pop();
    }
    io.to(roomId).emit('chat-star-update', { id: msgId, username: username, message: message, starCount: existing ? existing.starCount : 1, ts: Math.floor(_csNow / 1000) });
  });

  // ── guest-entrance — emits a guest arrival stinger ────────────────────
  // Called from client when a new guest track appears in the panel grid
  socket.on('guest-entrance', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var guestId  = String(data.guestId  || socket.data.guestId || '').slice(0, 64);
    var username = String(data.username || socket.data.username || '').slice(0, 40);
    var emoji    = String(data.emoji    || '🎤').slice(0, 4);
    if (!guestId || !username) return;
    io.to(roomId).emit('guest-entrance', { guestId: guestId, username: username, emoji: emoji, ts: Math.floor(Date.now() / 1000) });
  });

  // ── chat-raffle-start — host starts a keyword raffle ─────────────────
  socket.on('chat-raffle-start', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var keyword = String(data.keyword || '').toLowerCase().trim().slice(0, 30);
    if (!keyword) return;
    chatRaffleMap.set(roomId, { keyword: keyword, entries: new Map(), active: true });
    io.to(roomId).emit('chat-raffle-update', { keyword: keyword, active: true, count: 0 });
  });

  // ── chat-raffle-entry — viewer enters raffle by typing keyword ────────
  socket.on('chat-raffle-entry', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var raffle = chatRaffleMap.get(roomId);
    if (!raffle || !raffle.active) return;
    var userId   = socket.data.userId || socket.id;
    var username = socket.data.username || 'Guest';
    if (raffle.entries.has(userId)) return; // already entered
    raffle.entries.set(userId, username);
    io.to(roomId).emit('chat-raffle-update', { keyword: raffle.keyword, active: true, count: raffle.entries.size });
  });

  // ── chat-raffle-draw — host draws the winner ──────────────────────────
  socket.on('chat-raffle-draw', function(data) {
    var roomId = socket.data.roomId;
    if (!roomId || socket.data.role !== 'host') return;
    var raffle = chatRaffleMap.get(roomId);
    if (!raffle || !raffle.active || raffle.entries.size === 0) {
      io.to(socket.id).emit('chat-raffle-result', { error: 'No entries' }); return;
    }
    raffle.active = false;
    var entries = Array.from(raffle.entries.entries()); // [[userId, username], ...]
    var picked  = entries[Math.floor(Math.random() * entries.length)];
    var prize   = String(data.prize || '').slice(0, 80);
    io.to(roomId).emit('chat-raffle-result', { winner: picked[1], userId: picked[0], prize: prize, count: entries.length, ts: Math.floor(Date.now() / 1000) });
    chatRaffleMap.delete(roomId);
  });

  // Also track raffle entries from chat messages
  // (if user types the keyword in chat while raffle is active)

  // ── audience-challenge-set — host posts a timed task for viewers ──────
  socket.on('audience-challenge-set', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var text = (data && data.text) ? String(data.text).slice(0, 120).trim() : '';
    if (!text) return;
    var durationSecs = Math.min(300, Math.max(10, parseInt(data.durationSecs, 10) || 60));
    var startTs = Date.now();
    var challenge = { text: text, durationSecs: durationSecs, startTs: startTs, active: true, responseCount: 0, respondedBy: new Set() };
    if (audienceChallengeMap.has(roomId)) {
      var old = audienceChallengeMap.get(roomId);
      if (old.timerId) clearTimeout(old.timerId);
    }
    challenge.timerId = setTimeout(function() {
      var cur = audienceChallengeMap.get(roomId);
      if (cur && cur.startTs === startTs) {
        cur.active = false;
        io.to(roomId).emit('audience-challenge-ended', { responseCount: cur.responseCount });
      }
    }, durationSecs * 1000);
    audienceChallengeMap.set(roomId, challenge);
    io.to(roomId).emit('audience-challenge', { text: text, durationSecs: durationSecs, startTs: startTs });
  });

  // ── audience-challenge-respond — viewer marks task done ───────────────
  socket.on('audience-challenge-respond', function(data) {
    var roomId = socket.data.roomId;
    var userId = socket.data.userId;
    if (!roomId || !userId) return;
    var ch = audienceChallengeMap.get(roomId);
    if (!ch || !ch.active) return;
    if (ch.respondedBy.has(userId)) return;
    ch.respondedBy.add(userId);
    ch.responseCount += 1;
    io.to(roomId).emit('audience-challenge-update', { responseCount: ch.responseCount });
    addEnergy(roomId, userId, socket.data.username, 3);
  });

  // ── brb-toggle — host sets/clears BRB intermission screen ──────────
  socket.on('brb-toggle', function(data) {
    if (socket.data.role !== 'host') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var active = !!(data && data.active);
    if (active) {
      var message = (data.message) ? String(data.message).slice(0, 100).trim() : 'Be Right Back…';
      var returnEta = (data.returnEta) ? parseInt(data.returnEta, 10) : null;
      var brb = { active: true, message: message, returnEta: returnEta, startTs: Date.now() };
      intermissionMap.set(roomId, brb);
      io.to(roomId).emit('brb-update', brb);
    } else {
      intermissionMap.delete(roomId);
      io.to(roomId).emit('brb-update', { active: false });
    }
  });

  // ── flash-drop-start — host triggers a time-limited merch/product drop ──
  socket.on('flash-drop-start', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var name = (data && data.name) ? String(data.name).slice(0, 60).trim() : '';
    var price = (data && data.price) ? String(data.price).slice(0, 20).trim() : '';
    var url = (data && data.url) ? String(data.url).slice(0, 300).trim() : '';
    if (!name) return;
    var durationSecs = Math.min(300, Math.max(15, parseInt((data && data.durationSecs) || 60, 10)));
    var endsAt = Date.now() + durationSecs * 1000;
    var prev = flashDropMap.get(roomId);
    if (prev && prev.timerId) clearTimeout(prev.timerId);
    var timerId = setTimeout(function() {
      flashDropMap.delete(roomId);
      io.to(roomId).emit('flash-drop-ended', { roomId: roomId });
    }, durationSecs * 1000);
    flashDropMap.set(roomId, { name: name, price: price, url: url, endsAt: endsAt, timerId: timerId });
    io.to(roomId).emit('flash-drop', { name: name, price: price, url: url, endsAt: endsAt });
  });

  // ── applause-tap — viewer taps the clap button ──────────────────────
  socket.on('applause-tap', function(data) {
    var roomId = (data && data.roomId) || socket.data.roomId;
    if (!roomId) return;
    var now = Date.now();
    if (!applauseMap.has(roomId)) applauseMap.set(roomId, { count: 0, windowStart: now, peak: 0 });
    var a = applauseMap.get(roomId);
    if (now - a.windowStart > 3000) { a.count = 0; a.windowStart = now; }
    a.count += 1;
    if (a.count > a.peak) { a.peak = a.count; }
    applauseMap.set(roomId, a);
    io.to(roomId).emit('applause-update', { count: a.count, peak: a.peak });
    if (a.count === 10 || a.count === 25 || a.count === 50 || a.count === 100) {
      io.to(roomId).emit('applause-burst', { count: a.count });
    }
  });

  // ── vip-grant — host marks a viewer as VIP ───────────────────────────
  socket.on('vip-grant', function(data) {
    if (socket.data.role !== 'host') return;
    var roomId = socket.data.roomId;
    var targetId = data && data.userId;
    if (!roomId || !targetId) return;
    if (!vipMap.has(roomId)) vipMap.set(roomId, new Set());
    vipMap.get(roomId).add(String(targetId));
    io.to(roomId).emit('vip-update', { userId: targetId, vip: true, vips: Array.from(vipMap.get(roomId)) });
  });

  // ── vip-revoke — host removes VIP from a viewer ──────────────────────
  socket.on('vip-revoke', function(data) {
    if (socket.data.role !== 'host') return;
    var roomId = socket.data.roomId;
    var targetId = data && data.userId;
    if (!roomId || !targetId) return;
    var vips = vipMap.get(roomId);
    if (vips) {
      vips.delete(String(targetId));
      io.to(roomId).emit('vip-update', { userId: targetId, vip: false, vips: Array.from(vips) });
    }
  });

  // ── set-chat-color — viewer sets custom chat name color ────────────────
  var ALLOWED_CHAT_COLORS = ['#FF4444','#FF8C00','#FFD700','#00CC66','#00BFFF','#A855F7','#FF69B4','#FF1A3C','#C9A84C','#D4854A'];
  socket.on('set-chat-color', function(data) {
    var userId = socket.data.userId;
    if (!userId || userId.startsWith('anon')) return;
    var color = data && data.color ? String(data.color) : '';
    if (ALLOWED_CHAT_COLORS.indexOf(color) === -1) return;
    chatColorMap.set(userId, color);
    io.to(socket.data.roomId || '').emit('chat-color-set', { userId: userId, color: color });
    io.to(socket.id).emit('chat-color-ack', { color: color });
  });

  // ── lower-third-set — host sets a news-style lower-third overlay ──────
  socket.on('lower-third-set', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var title    = (data && data.title)    ? String(data.title).slice(0, 80).trim()    : '';
    var subtitle = (data && data.subtitle) ? String(data.subtitle).slice(0, 120).trim() : '';
    if (!title) return;
    var durationSecs = Math.min(60, Math.max(5, parseInt((data && data.durationSecs) || 10, 10)));
    var endsAt = Date.now() + durationSecs * 1000;
    var prev = lowerThirdMap.get(roomId);
    if (prev && prev.timerId) clearTimeout(prev.timerId);
    var timerId = setTimeout(function() {
      lowerThirdMap.delete(roomId);
      io.to(roomId).emit('lower-third', null);
    }, durationSecs * 1000);
    lowerThirdMap.set(roomId, { title: title, subtitle: subtitle, endsAt: endsAt, timerId: timerId });
    io.to(roomId).emit('lower-third', { title: title, subtitle: subtitle, endsAt: endsAt });
  });

  // ── lower-third-clear — host manually clears the lower third ──────────
  socket.on('lower-third-clear', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var lt = lowerThirdMap.get(roomId);
    if (lt && lt.timerId) clearTimeout(lt.timerId);
    lowerThirdMap.delete(roomId);
    io.to(roomId).emit('lower-third', null);
  });

  // ── emoji-shower — host triggers a brief emoji particle rain ──────────
  socket.on('emoji-shower', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var emoji = (data && data.emoji) ? String(data.emoji).slice(0, 4) : '🎉';
    io.to(roomId).emit('emoji-shower', { emoji: emoji, ts: Date.now() });
    addEnergy(roomId, null, null, 5);
  });

  // ── shoutout-card — host gives a big visual shoutout to a viewer ──────
  socket.on('shoutout-card', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var username = (data && data.username) ? String(data.username).slice(0, 40).trim() : '';
    var message  = (data && data.message)  ? String(data.message).slice(0, 120).trim()  : '';
    if (!username) return;
    io.to(roomId).emit('shoutout-card', { username: username, message: message, ts: Date.now() });
    addEnergy(roomId, null, null, 10);
  });

  // ── chat-theme-set — host sets room chat vibe/theme ──────────────────
  var VALID_CHAT_THEMES = ['party', 'chill', 'sports', 'gaming', 'news', 'off'];
  socket.on('chat-theme-set', function(data) {
    if (socket.data.role !== 'host') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var theme = (data && data.theme && VALID_CHAT_THEMES.indexOf(data.theme) !== -1) ? data.theme : 'off';
    if (theme === 'off') {
      chatThemeMap.delete(roomId);
    } else {
      chatThemeMap.set(roomId, theme);
    }
    io.to(roomId).emit('chat-theme-update', { theme: theme === 'off' ? null : theme });
  });

  // ── scoreboard-set — host creates/updates live scoreboard ─────────────
  socket.on('scoreboard-set', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var title  = (data && data.title)       ? String(data.title).slice(0, 60).trim()       : 'Live Score';
    var nameA  = (data && data.teamAName)   ? String(data.teamAName).slice(0, 30).trim()   : 'Team A';
    var nameB  = (data && data.teamBName)   ? String(data.teamBName).slice(0, 30).trim()   : 'Team B';
    var colorA = (data && data.teamAColor)  ? String(data.teamAColor).slice(0, 7)          : '#FF1A3C';
    var colorB = (data && data.teamBColor)  ? String(data.teamBColor).slice(0, 7)          : '#00BFFF';
    var prev = scoreboardMap.get(roomId) || {};
    var sb = { title: title, teamA: { name: nameA, score: prev.teamA ? prev.teamA.score : 0, color: colorA }, teamB: { name: nameB, score: prev.teamB ? prev.teamB.score : 0, color: colorB }, active: true };
    scoreboardMap.set(roomId, sb);
    io.to(roomId).emit('scoreboard-update', { title: sb.title, teamA: sb.teamA, teamB: sb.teamB });
  });

  // ── scoreboard-score — host adjusts score for a team ─────────────────
  socket.on('scoreboard-score', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    var sb = scoreboardMap.get(roomId);
    if (!roomId || !sb) return;
    var team = (data && data.team === 'B') ? 'teamB' : 'teamA';
    var delta = parseInt((data && data.delta) || 1, 10);
    if (isNaN(delta)) delta = 1;
    sb[team].score = Math.max(0, sb[team].score + delta);
    scoreboardMap.set(roomId, sb);
    io.to(roomId).emit('scoreboard-update', { title: sb.title, teamA: sb.teamA, teamB: sb.teamB });
    addEnergy(roomId, null, null, 3);
  });

  // ── scoreboard-clear — host hides scoreboard ──────────────────────────
  socket.on('scoreboard-clear', function(data) {
    if (socket.data.role !== 'host') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    scoreboardMap.delete(roomId);
    io.to(roomId).emit('scoreboard-update', null);
  });

  // ── auction-start — host starts a live auction ────────────────────────
  socket.on('auction-start', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    if (auctionMap.has(roomId) && auctionMap.get(roomId).active) return; // already active
    var item     = (data && data.item)     ? String(data.item).slice(0, 80).trim()     : '';
    var desc     = (data && data.desc)     ? String(data.desc).slice(0, 200).trim()    : '';
    var startBid = Math.max(1, parseInt((data && data.startBid) || 1, 10));
    if (!item) return;
    var auction = { item: item, desc: desc, startBid: startBid, currentBid: startBid, bidder: null, bidderName: null, active: true, startTs: Date.now(), bids: [] };
    auctionMap.set(roomId, auction);
    io.to(roomId).emit('auction-update', { item: item, desc: desc, startBid: startBid, currentBid: startBid, bidder: null, active: true });
    addEnergy(roomId, null, null, 10);
  });

  // ── auction-bid — viewer places a bid ─────────────────────────────────
  socket.on('auction-bid', function(data) {
    var roomId = socket.data.roomId;
    var userId = socket.data.userId;
    if (!roomId || !userId || userId.startsWith('anon')) return;
    var au = auctionMap.get(roomId);
    if (!au || !au.active) return;
    var bid = parseInt(data && data.bid, 10);
    if (isNaN(bid) || bid <= au.currentBid) return;
    au.currentBid   = bid;
    au.bidder       = userId;
    au.bidderName   = socket.data.username || userId;
    auctionMap.set(roomId, au);
    io.to(roomId).emit('auction-update', { item: au.item, desc: au.desc, startBid: au.startBid, currentBid: au.currentBid, bidder: au.bidderName, active: true });
    addEnergy(roomId, userId, au.bidderName, 8);
  });

  // ── auction-end — host closes the auction ─────────────────────────────
  socket.on('auction-end', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    var au = auctionMap.get(roomId);
    if (!roomId || !au) return;
    io.to(roomId).emit('auction-ended', { item: au.item, winner: au.bidderName, winningBid: au.currentBid });
    auctionMap.delete(roomId);
    addEnergy(roomId, null, null, 15);
  });

  // ── timer-widget-start — host starts visible countdown/countup ────────
  socket.on('timer-widget-start', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var label       = (data && data.label) ? String(data.label).slice(0, 40).trim() : '';
    var type        = (data && data.type === 'countup') ? 'countup' : 'countdown';
    var durationSecs = Math.min(7200, Math.max(10, parseInt((data && data.durationSecs) || 60, 10)));
    var tw = { label: label, type: type, startTs: Date.now(), durationSecs: durationSecs, active: true };
    timerWidgetMap.set(roomId, tw);
    io.to(roomId).emit('timer-widget-update', { label: label, type: type, startTs: tw.startTs, durationSecs: durationSecs, active: true });
  });

  // ── timer-widget-stop — host stops timer ──────────────────────────────
  socket.on('timer-widget-stop', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    timerWidgetMap.delete(roomId);
    io.to(roomId).emit('timer-widget-update', null);
  });

  // ── quick-quiz-launch — host sends a one-shot quiz question ──────────
  socket.on('quick-quiz-launch', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var q = (data && data.q) ? String(data.q).slice(0, 200).trim() : '';
    var rawOpts = (data && Array.isArray(data.opts)) ? data.opts.slice(0, 4) : [];
    if (!q || rawOpts.length < 2) return;
    var opts = rawOpts.map(function(o) { return { text: String(o).slice(0, 60).trim(), votes: 0 }; });
    var quiz = { q: q, opts: opts, answers: new Map(), active: true };
    quickQuizMap.set(roomId, quiz);
    io.to(roomId).emit('quick-quiz', { q: q, opts: opts.map(function(o) { return { text: o.text, votes: 0 }; }) });
    addEnergy(roomId, null, null, 8);
  });

  // ── quick-quiz-answer — viewer answers ────────────────────────────────
  socket.on('quick-quiz-answer', function(data) {
    var roomId = socket.data.roomId;
    var userId = socket.data.userId;
    if (!roomId || !userId) return;
    var quiz = quickQuizMap.get(roomId);
    if (!quiz || !quiz.active) return;
    if (quiz.answers.has(userId)) return;
    var idx = parseInt(data && data.idx, 10);
    if (isNaN(idx) || idx < 0 || idx >= quiz.opts.length) return;
    quiz.answers.set(userId, idx);
    quiz.opts[idx].votes += 1;
    var totalVotes = quiz.answers.size;
    var results = quiz.opts.map(function(o, i) { return { text: o.text, votes: o.votes, pct: Math.round((o.votes / totalVotes) * 100) }; });
    io.to(roomId).emit('quick-quiz-results', { q: quiz.q, results: results, totalVotes: totalVotes });
    addEnergy(roomId, userId, socket.data.username, 2);
  });

  // ── quick-quiz-end — host closes quiz ─────────────────────────────────
  socket.on('quick-quiz-end', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    var quiz = quickQuizMap.get(roomId);
    if (!roomId || !quiz) return;
    quiz.active = false;
    var totalVotes = quiz.answers.size;
    var winner = quiz.opts.reduce(function(best, o, i) { return o.votes > best.votes ? { idx: i, votes: o.votes, text: o.text } : best; }, { idx: 0, votes: 0, text: '' });
    var results = quiz.opts.map(function(o, i) { return { text: o.text, votes: o.votes, pct: totalVotes ? Math.round((o.votes / totalVotes) * 100) : 0 }; });
    io.to(roomId).emit('quick-quiz-final', { q: quiz.q, results: results, winner: winner.text, winnerIdx: winner.idx, totalVotes: totalVotes });
    setTimeout(function() { quickQuizMap.delete(roomId); }, 30000);
  });

  // ── song-request-mark-played — host marks a song as played ────────────
  socket.on('song-request-mark-played', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    var reqId = data && data.id;
    if (!roomId || !reqId) return;
    var list = songRequestMap.get(roomId);
    if (!list) return;
    list.forEach(function(r) { if (r.id === reqId) r.played = true; });
    io.to(roomId).emit('song-request-update', { requests: list.filter(function(r) { return !r.played; }).slice(0, 20) });
  });

  // ── song-request-clear — host clears all pending requests ─────────────
  socket.on('song-request-clear', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    songRequestMap.delete(roomId);
    io.to(roomId).emit('song-request-update', { requests: [] });
  });

  // ── marquee-set — host sets scrolling text marquee ────────────────────
  socket.on('marquee-set', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var text = (data && data.text) ? String(data.text).slice(0, 200).trim() : '';
    if (!text) { marqueeMap.delete(roomId); io.to(roomId).emit('marquee-update', null); return; }
    marqueeMap.set(roomId, { text: text, active: true });
    io.to(roomId).emit('marquee-update', { text: text });
  });

  // ── marquee-clear — host stops the marquee ────────────────────────────
  socket.on('marquee-clear', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    marqueeMap.delete(roomId);
    io.to(roomId).emit('marquee-update', null);
  });

  // ── shoutout-queue-add — viewer spends points to request a shoutout ───
  socket.on('shoutout-queue-add', function(data) {
    var roomId = socket.data.roomId;
    var userId = socket.data.userId;
    if (!roomId || !userId || userId.startsWith('anon')) return;
    var message = (data && data.message) ? String(data.message).slice(0, 80).trim() : '';
    if (!shoutoutQueueMap.has(roomId)) shoutoutQueueMap.set(roomId, []);
    var sq = shoutoutQueueMap.get(roomId);
    if (sq.length >= 20) return; // cap queue
    if (sq.some(function(e) { return e.userId === userId; })) return; // one per user
    var entry = { id: uuidv4 ? uuidv4() : (Date.now() + '-' + Math.random()), userId: userId, username: socket.data.username || userId, message: message, ts: Math.floor(Date.now() / 1000) };
    sq.push(entry);
    shoutoutQueueMap.set(roomId, sq);
    io.to(socket.id).emit('shoutout-queue-ack', { queued: true, position: sq.length });
    var hostRoom = rooms.get(roomId);
    if (hostRoom && hostRoom.hostSocketId) {
      io.to(hostRoom.hostSocketId).emit('shoutout-queue-update', { queue: sq.slice(0, 5) });
    }
  });

  // ── shoutout-queue-approve — host fires a queued shoutout ─────────────
  socket.on('shoutout-queue-approve', function(data) {
    if (socket.data.role !== 'host') return;
    var roomId = socket.data.roomId;
    var entryId = data && data.id;
    if (!roomId || !entryId) return;
    var sq = shoutoutQueueMap.get(roomId);
    if (!sq) return;
    var entry = sq.find(function(e) { return e.id === entryId; });
    if (!entry) return;
    shoutoutQueueMap.set(roomId, sq.filter(function(e) { return e.id !== entryId; }));
    io.to(roomId).emit('shoutout-card', { username: entry.username, message: entry.message, ts: Date.now() });
    io.to(roomId).emit('shoutout-queue-update', { queue: shoutoutQueueMap.get(roomId).slice(0, 5) });
    addEnergy(roomId, entry.userId, entry.username, 10);
  });

  // ── shoutout-queue-dismiss — host removes without firing ──────────────
  socket.on('shoutout-queue-dismiss', function(data) {
    if (socket.data.role !== 'host') return;
    var roomId = socket.data.roomId;
    var entryId = data && data.id;
    if (!roomId || !entryId) return;
    var sq = shoutoutQueueMap.get(roomId);
    if (!sq) return;
    shoutoutQueueMap.set(roomId, sq.filter(function(e) { return e.id !== entryId; }));
    io.to(roomId).emit('shoutout-queue-update', { queue: shoutoutQueueMap.get(roomId).slice(0, 5) });
  });

  // ── viewer-checkin ─────────────────────────────────────────────────────
  socket.on('viewer-checkin', function(data, ack) {
    var userId   = socket.data.userId;
    var roomId   = socket.data.roomId;
    var username = (data && data.username) ? String(data.username).slice(0, 40) : ('viewer-' + String(userId || '').slice(0, 8));
    if (!userId || !roomId) { if (ack) ack({ error: 'not in room' }); return; }
    var CHECK_INTERVAL = 3600000; // 1 hour
    var last = checkInMap.get(userId + ':' + roomId) || 0;
    var now = Date.now();
    if (now - last < CHECK_INTERVAL) {
      var remaining = Math.ceil((CHECK_INTERVAL - (now - last)) / 60000);
      if (ack) ack({ error: 'wait', minutesLeft: remaining }); return;
    }
    checkInMap.set(userId + ':' + roomId, now);
    var PTS = 25;
    addEnergy(roomId, userId, username, PTS);
    addHype(roomId, PTS);
    io.to(roomId).emit('viewer-checkin-event', { username: username, ts: now });
    if (ack) ack({ ok: true, pts: PTS });
  });

  // ── update-stream-title ────────────────────────────────────────────────
  socket.on('update-stream-title', function(data) {
    if (socket.data.role !== 'host') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var title = data && typeof data.title === 'string' ? data.title.trim().slice(0, 100) : null;
    if (!title) return;
    streamTitleMap.set(roomId, title);
    io.to(roomId).emit('stream-title-updated', { title: title });
  });

  // ── room-vibe-set ──────────────────────────────────────────────────────
  var ALLOWED_VIBES = ['hype', 'chill', 'gaming', 'music', 'party', 'educational', 'news'];
  socket.on('room-vibe-set', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var vibe = data && ALLOWED_VIBES.indexOf(String(data.vibe || '')) !== -1 ? String(data.vibe) : null;
    if (!vibe) return;
    roomVibeMap.set(roomId, { vibe: vibe, ts: Date.now() });
    io.to(roomId).emit('room-vibe-update', { vibe: vibe });
  });

  socket.on('room-vibe-clear', function() {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    roomVibeMap.delete(roomId);
    io.to(roomId).emit('room-vibe-update', null);
  });

  // ── simple-poll-start ──────────────────────────────────────────────────
  socket.on('simple-poll-start', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var q = data && typeof data.q === 'string' ? data.q.trim().slice(0, 140) : '';
    if (!q) return;
    var poll = { q: q, yes: new Set(), no: new Set(), active: true, startTs: Date.now() };
    simplePollMap.set(roomId, poll);
    io.to(roomId).emit('simple-poll-update', { q: q, yes: 0, no: 0, active: true, startTs: poll.startTs });
  });

  socket.on('simple-poll-vote', function(data) {
    var roomId = socket.data.roomId;
    var userId = socket.data.userId;
    if (!roomId || !userId) return;
    var poll = simplePollMap.get(roomId);
    if (!poll || !poll.active) return;
    var vote = data && data.vote;
    if (vote !== 'yes' && vote !== 'no') return;
    // Allow changing vote
    poll.yes.delete(userId);
    poll.no.delete(userId);
    poll[vote].add(userId);
    io.to(roomId).emit('simple-poll-update', { q: poll.q, yes: poll.yes.size, no: poll.no.size, active: true, startTs: poll.startTs });
    addEnergy(roomId, userId, (data && data.username) ? String(data.username).slice(0, 40) : '', 1);
  });

  socket.on('simple-poll-end', function() {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var poll = simplePollMap.get(roomId);
    if (!poll) return;
    poll.active = false;
    io.to(roomId).emit('simple-poll-update', { q: poll.q, yes: poll.yes.size, no: poll.no.size, active: false, startTs: poll.startTs });
    simplePollMap.delete(roomId);
  });

  // ── fanclub-join ────────────────────────────────────────────────────────
  socket.on('fanclub-join', function(data, ack) {
    var userId   = socket.data.userId;
    var roomId   = socket.data.roomId;
    var username = (data && data.username) ? String(data.username).slice(0, 40) : '';
    if (!userId || !roomId) { if (ack) ack({ error: 'not in room' }); return; }
    if (!fanClubMap.has(roomId)) fanClubMap.set(roomId, new Set());
    var fc = fanClubMap.get(roomId);
    if (fc.has(userId)) { if (ack) ack({ already: true }); return; }
    fc.add(userId);
    io.to(roomId).emit('fanclub-update', { members: Array.from(fc), joined: { userId: userId, username: username } });
    addEnergy(roomId, userId, username, 5);
    if (ack) ack({ ok: true, count: fc.size });
  });

  socket.on('fanclub-leave', function(data, ack) {
    var userId = socket.data.userId;
    var roomId = socket.data.roomId;
    if (!userId || !roomId) return;
    var fc = fanClubMap.get(roomId);
    if (!fc) return;
    fc.delete(userId);
    io.to(roomId).emit('fanclub-update', { members: Array.from(fc) });
    if (ack) ack({ ok: true });
  });

  // ── watch-streak-check ──────────────────────────────────────────────────
  socket.on('watch-streak-check', function(data, ack) {
    var userId = socket.data.userId;
    if (!userId) { if (ack) ack({ days: 0 }); return; }
    var today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    var streak = watchStreakMap.get(userId) || { days: 0, lastDate: null };
    if (streak.lastDate === today) { if (ack) ack({ days: streak.days }); return; }
    var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (streak.lastDate === yesterday) {
      streak.days += 1;
    } else if (streak.lastDate !== today) {
      streak.days = 1;
    }
    streak.lastDate = today;
    watchStreakMap.set(userId, streak);
    if (ack) ack({ days: streak.days, isNew: true });
  });

  // ── host-note-set / host-note-clear ────────────────────────────────────
  socket.on('host-note-set', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var text = data && typeof data.text === 'string' ? data.text.trim().slice(0, 280) : null;
    if (!text) { hostNoteMap.delete(roomId); io.to(roomId).emit('host-note-update', null); return; }
    var note = { text: text, ts: Date.now() };
    hostNoteMap.set(roomId, note);
    io.to(roomId).emit('host-note-update', note);
  });

  socket.on('host-note-clear', function() {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    hostNoteMap.delete(roomId);
    io.to(roomId).emit('host-note-update', null);
  });

  // ── collab-banner-set / collab-banner-clear ─────────────────────────────
  socket.on('collab-banner-set', function(data) {
    if (socket.data.role !== 'host') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var name = data && typeof data.name === 'string' ? data.name.trim().slice(0, 60) : null;
    var platform = data && typeof data.platform === 'string' ? data.platform.trim().slice(0, 30) : '';
    if (!name) return;
    var banner = { name: name, platform: platform, ts: Date.now() };
    collabBannerMap.set(roomId, banner);
    io.to(roomId).emit('collab-banner-update', banner);
  });

  socket.on('collab-banner-clear', function() {
    if (socket.data.role !== 'host') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    collabBannerMap.delete(roomId);
    io.to(roomId).emit('collab-banner-update', null);
  });

  // ── set-viewer-status ──────────────────────────────────────────────────
  var ALLOWED_STATUS_EMOJIS = ['🎉','💤','❓','🔥','👍','❤️','😂','😮','😢','🙏','👏','🎮','🎵','💪','✋'];
  socket.on('set-viewer-status', function(data, ack) {
    var userId = socket.data.userId;
    var roomId = socket.data.roomId;
    if (!userId || !roomId) return;
    var emoji = data && ALLOWED_STATUS_EMOJIS.indexOf(String(data.emoji || '')) !== -1 ? String(data.emoji) : null;
    var text  = data && typeof data.text === 'string' ? data.text.trim().slice(0, 24) : '';
    if (!emoji) { viewerStatusMap.delete(userId); io.to(roomId).emit('viewer-status-update', { userId: userId, status: null }); if (ack) ack({ ok: true }); return; }
    var status = { emoji: emoji, text: text, ts: Date.now() };
    viewerStatusMap.set(userId, status);
    io.to(roomId).emit('viewer-status-update', { userId: userId, status: status });
    if (ack) ack({ ok: true });
  });

  // ── mark-moment ────────────────────────────────────────────────────────
  socket.on('mark-moment', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var label = data && typeof data.label === 'string' ? data.label.trim().slice(0, 60) : 'Moment';
    if (!momentLogMap.has(roomId)) momentLogMap.set(roomId, []);
    var log = momentLogMap.get(roomId);
    var mom = { id: String(Date.now()), label: label, ts: Date.now(), by: socket.data.username || 'host' };
    log.push(mom);
    if (log.length > 50) momentLogMap.set(roomId, log.slice(-50));
    io.to(roomId).emit('moment-logged', mom);
    io.to(roomId).emit('moment-flash', { label: label });
  });

  socket.on('moment-log-clear', function() {
    if (socket.data.role !== 'host') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    momentLogMap.delete(roomId);
    io.to(roomId).emit('moment-log-update', { log: [] });
  });

  // ── set-room-capacity ──────────────────────────────────────────────────
  socket.on('set-room-capacity', function(data) {
    if (socket.data.role !== 'host') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var max = data && Number(data.max) > 0 ? Math.floor(Math.min(Number(data.max), 100000)) : 0;
    if (max === 0) { roomCapacityMap.delete(roomId); io.to(roomId).emit('room-capacity-update', null); return; }
    roomCapacityMap.set(roomId, { max: max });
    io.to(roomId).emit('room-capacity-update', { max: max });
  });

  // ── word-cloud-get ─────────────────────────────────────────────────────
  socket.on('word-cloud-get', function(data, ack) {
    var roomId = socket.data.roomId;
    if (!roomId) { if (ack) ack({ words: [] }); return; }
    var wcMap = chatWordMap.get(roomId);
    var words = wcMap ? Array.from(wcMap.entries()).sort(function(a,b){return b[1]-a[1];}).slice(0,20).map(function(e){return{word:e[0],count:e[1]};}) : [];
    if (ack) ack({ words: words });
    else io.to(socket.id).emit('word-cloud-update', { words: words });
  });

  // ── prize-wheel-set / prize-wheel-spin ─────────────────────────────────
  var DEFAULT_WHEEL_COLORS = ['#FF4444','#FF8C00','#FFD700','#00CC66','#00BFFF','#A855F7','#FF69B4','#F472B6'];
  socket.on('prize-wheel-set', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var rawSegs = Array.isArray(data && data.segments) ? data.segments.slice(0, 8) : [];
    if (rawSegs.length < 2) return;
    var segments = rawSegs.map(function(s, i) { return { label: String(s.label || ('Prize ' + (i+1))).slice(0, 40), color: DEFAULT_WHEEL_COLORS[i % DEFAULT_WHEEL_COLORS.length] }; });
    prizeWheelMap.set(roomId, { segments: segments, active: true, lastWinner: null });
    io.to(roomId).emit('prize-wheel-update', { segments: segments, active: true, lastWinner: null });
  });

  socket.on('prize-wheel-spin', function(data, ack) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var wheel = prizeWheelMap.get(roomId);
    if (!wheel || !wheel.active || !wheel.segments.length) { if (ack) ack({ error: 'No wheel set' }); return; }
    var winIdx = Math.floor(Math.random() * wheel.segments.length);
    var winner = wheel.segments[winIdx];
    wheel.lastWinner = { label: winner.label, color: winner.color, idx: winIdx, ts: Date.now() };
    io.to(roomId).emit('prize-wheel-spin', { winIdx: winIdx, winner: winner.label, segments: wheel.segments });
    if (ack) ack({ winIdx: winIdx, winner: winner.label });
  });

  socket.on('prize-wheel-clear', function() {
    if (socket.data.role !== 'host') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    prizeWheelMap.delete(roomId);
    io.to(roomId).emit('prize-wheel-update', null);
  });

  // ── stream-sign-in ─────────────────────────────────────────────────────
  socket.on('stream-sign-in', function(data, ack) {
    var userId   = socket.data.userId;
    var roomId   = socket.data.roomId;
    var username = (data && data.username) ? String(data.username).slice(0, 40) : ('guest-' + String(userId || '').slice(0, 6));
    if (!userId || !roomId) { if (ack) ack({ error: 'not in room' }); return; }
    if (!signInLogMap.has(roomId)) signInLogMap.set(roomId, []);
    var log = signInLogMap.get(roomId);
    if (log.some(function(e) { return e.userId === userId; })) { if (ack) ack({ already: true }); return; }
    var entry = { userId: userId, username: username, ts: Date.now() };
    log.push(entry);
    if (log.length > 200) signInLogMap.set(roomId, log.slice(-200));
    io.to(roomId).emit('stream-sign-in', { username: username, count: log.length, ts: entry.ts });
    addEnergy(roomId, userId, username, 3);
    if (ack) ack({ ok: true, count: log.length });
  });

  // ── outro-countdown-set / outro-countdown-cancel ────────────────────────
  socket.on('outro-countdown-set', function(data) {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var mins = Math.max(1, Math.min(60, Math.floor(Number(data && data.minutes) || 5)));
    var label = data && typeof data.label === 'string' ? data.label.trim().slice(0, 60) : 'GOING OFFLINE IN';
    var endsAt = Date.now() + mins * 60000;
    var old = outroCountdownMap.get(roomId);
    if (old && old.timerId) clearTimeout(old.timerId);
    var timerId = setTimeout(function() { outroCountdownMap.delete(roomId); io.to(roomId).emit('outro-countdown-update', null); }, mins * 60000 + 5000);
    outroCountdownMap.set(roomId, { endsAt: endsAt, label: label, timerId: timerId });
    io.to(roomId).emit('outro-countdown-update', { endsAt: endsAt, label: label });
  });

  socket.on('outro-countdown-cancel', function() {
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var roomId = socket.data.roomId;
    if (!roomId) return;
    var oc = outroCountdownMap.get(roomId);
    if (oc && oc.timerId) clearTimeout(oc.timerId);
    outroCountdownMap.delete(roomId);
    io.to(roomId).emit('outro-countdown-update', null);
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
    watchTogetherMap.delete(roomId);
    var endedBattle = teamBattleMap.get(roomId);
    if (endedBattle && endedBattle.timerId) clearTimeout(endedBattle.timerId);
    teamBattleMap.delete(roomId);
    whiteboardMap.delete(roomId);
    karaokeMap.delete(roomId);
    chaptersMap.delete(roomId);
    sentimentMap.delete(roomId);
    nowPlayingMap.delete(roomId);
    tipTickerMap.delete(roomId);
    viewerJoinMap.delete(roomId);
    giftGoalMap.delete(roomId);
    moodMap.delete(roomId);
    cohostQueueMap.delete(roomId);
    var endedCombo = reactionComboMap.get(roomId);
    if (endedCombo && endedCombo.timerId) clearTimeout(endedCombo.timerId);
    reactionComboMap.delete(roomId);
    viewerSpotlightMap.delete(roomId);
    starredMsgsMap.delete(roomId);
    chatRaffleMap.delete(roomId);
    energyMap.delete(roomId);
    fanWallMap.delete(roomId);
    audienceChallengeMap.delete(roomId);
    intermissionMap.delete(roomId);
    var fd = flashDropMap.get(roomId);
    if (fd && fd.timerId) clearTimeout(fd.timerId);
    flashDropMap.delete(roomId);
    applauseMap.delete(roomId);
    vipMap.delete(roomId);
    var endLt = lowerThirdMap.get(roomId);
    if (endLt && endLt.timerId) clearTimeout(endLt.timerId);
    lowerThirdMap.delete(roomId);
    chatThemeMap.delete(roomId);
    scoreboardMap.delete(roomId);
    auctionMap.delete(roomId);
    timerWidgetMap.delete(roomId);
    quickQuizMap.delete(roomId);
    songRequestMap.delete(roomId);
    var htEnd = hypeTrainMap.get(roomId);
    if (htEnd && htEnd.timerId) clearTimeout(htEnd.timerId);
    hypeTrainMap.delete(roomId);
    marqueeMap.delete(roomId);
    shoutoutQueueMap.delete(roomId);
    streamTitleMap.delete(roomId);
    roomVibeMap.delete(roomId);
    simplePollMap.delete(roomId);
    fanClubMap.delete(roomId);
    hostNoteMap.delete(roomId);
    collabBannerMap.delete(roomId);
    chatWordMap.delete(roomId);
    chatWordMsgCount.delete(roomId);
    momentLogMap.delete(roomId);
    roomCapacityMap.delete(roomId);
    prizeWheelMap.delete(roomId);
    signInLogMap.delete(roomId);
    var ocEnd = outroCountdownMap.get(roomId);
    if (ocEnd && ocEnd.timerId) clearTimeout(ocEnd.timerId);
    outroCountdownMap.delete(roomId);
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
    if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
    var enabled = Boolean(data.enabled);
    var soRoom = rooms.get(sId);
    if (soRoom) soRoom.subscriberOnly = enabled;
    io.to(sId).emit('subscriber-only-changed', { enabled: enabled, ts: Math.floor(Date.now() / 1000) });
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

    // Remove disconnected user from speaker queue
    if (handQueues.has(roomId)) {
      var guestIdForQueue = socket.data.guestId || socket.data.userId;
      var prevQLen = handQueues.get(roomId).length;
      handQueues.set(roomId, handQueues.get(roomId).filter(function(e) {
        return e.guestId !== guestIdForQueue && e.userId !== socket.data.userId;
      }));
      if (handQueues.get(roomId).length !== prevQLen && room.hostSocketId) {
        io.to(room.hostSocketId).emit('hand-queue', { queue: handQueues.get(roomId) });
      }
    }

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
            // Broadcast milestone to all room clients for UI celebration
            io.to(roomId).emit('stream-milestone', { count: milestone, label: milestone.toLocaleString() + ' VIEWERS', ts: Math.floor(Date.now() / 1000) });
            autoAura(roomId, function(cb) {
              aura.triggerNewViewer(roomId, milestone.toLocaleString() + ' VIEWERS', false, cb);
            });
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
