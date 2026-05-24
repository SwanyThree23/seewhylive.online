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

var mediasoup    = require('./mediasoup');
var rtmp         = require('./rtmp');
var vault        = require('./vault');
var stripeModule = require('./stripe');
var SwanyBot     = require('./swanybot');
var translation  = require('./translation');
var aura         = require('./aura');
var whisper      = require('./whisper');

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
`);

// Initialise vault with same db (vault.initDb() will open its own handle to the same file)
vault.initDb();

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
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
}));
app.use(express.json());
app.use(xssClean());

// ─── Socket.io ────────────────────────────────────────────────────────────
var io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || '*',
    methods: ['GET', 'POST']
  },
  pingTimeout:  60000,
  pingInterval: 25000
});

// ─── SwanyBot instance ────────────────────────────────────────────────────
var swanybot = new SwanyBot(io);

// ─── Room state ───────────────────────────────────────────────────────────
// roomId → { viewers: Set<socketId>, guests: Map<socketId, {guestId, username, role}>, hostSocketId: string|null }
var rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      viewers:      new Set(),
      guests:       new Map(),
      hostSocketId: null
    });
  }
  return rooms.get(roomId);
}

// ─── REST API Routes ──────────────────────────────────────────────────────

// GET /api/health
app.get('/api/health', function(req, res) {
  res.json({
    status:            'ok',
    uptime:            process.uptime(),
    rooms:             rooms.size,
    connections:       io.engine.clientsCount,
    mediasoupWorkers:  mediasoup.getWorkerCount()
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
  var { Anthropic } = require('@anthropic-ai/sdk');
  var client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 256,
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

    if (role === 'host' || role === 'guest') {
      room.guests.set(socket.id, { guestId: guestId, username: username, role: role });
      if (role === 'host') {
        room.hostSocketId = socket.id;
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

          var ackPayload = {
            routerRtpCapabilities: routerCaps,
            sendTransport:         sendTransport.params,
            recvTransport:         recvTransport.params,
            existingProducers:     existingProducers
          };

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

      // Create router so viewer can subscribe; emit join-room-ack as connection signal
      mediasoup.getOrCreateRouter(roomId)
        .then(function() {
          var routerCaps = mediasoup.getRouterRtpCapabilities(roomId);
          var existingProducers = mediasoup.getRoomProducers(roomId);
          var viewerAck = { joined: true, routerRtpCapabilities: routerCaps, existingProducers: existingProducers };
          io.to(socket.id).emit('join-room-ack', viewerAck);
          if (ack) ack(viewerAck);
        })
        .catch(function(err) {
          logger.warn('[join-room] viewer router setup error: ' + err.message);
          // Viewers can still join without RTC — just no stream subscription
          io.to(socket.id).emit('join-room-ack', { joined: true });
          if (ack) ack({ joined: true });
        });
    }
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
    swanybot.onChatMessage(roomId, socket.id, message);

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

    swanybot.onGiftReceived(roomId, fromUser, name, valueCents);

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

  // ── overlay-update ────────────────────────────────────────────────────
  socket.on('overlay-update', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.overlay) return;
    io.to(roomId).emit('overlay-update', { overlay: data.overlay });
  });

  // ── watch-party ────────────────────────────────────────────────────────
  socket.on('watch-party-url', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.videoId) return;
    io.to(roomId).emit('watch-party-url', { videoId: data.videoId, url: data.url || '' });
  });

  socket.on('watch-party-play', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    io.to(roomId).emit('watch-party-play', { position: data.position || 0, timestamp: data.timestamp || Date.now() });
  });

  socket.on('watch-party-pause', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    io.to(roomId).emit('watch-party-pause', { position: data.position || 0 });
  });

  socket.on('watch-party-seek', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || typeof data.position !== 'number') return;
    io.to(roomId).emit('watch-party-seek', { position: data.position });
  });

  // ── bot-manual-message ─────────────────────────────────────────────────
  socket.on('bot-manual-message', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.message) return;
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
    io.to(roomId).emit('room-audio-only', { enabled: Boolean(data.enabled), ts: Math.floor(Date.now() / 1000) });
  });

  socket.on('room-private', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    io.to(roomId).emit('room-private', { enabled: Boolean(data.enabled), ts: Math.floor(Date.now() / 1000) });
  });

  socket.on('room-paywall', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var amountCents = Math.floor(data.amountCents || 0);
    io.to(roomId).emit('room-paywall', { enabled: Boolean(data.enabled), amountCents: amountCents, ts: Math.floor(Date.now() / 1000) });
  });

  // ── live polls ─────────────────────────────────────────────────────────
  socket.on('poll-start', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    io.to(roomId).emit('poll-start', {
      question: String(data.question || '').slice(0, 200),
      options:  (data.options || []).slice(0, 4).map(function(o) { return String(o).slice(0, 80); }),
      durationSec: Math.floor(data.durationSec || 60),
      ts: Math.floor(Date.now() / 1000)
    });
  });

  socket.on('poll-vote', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    var optionIdx = Math.floor(data.optionIdx || 0);
    io.to(roomId).emit('poll-vote', { optionIdx: optionIdx, ts: Math.floor(Date.now() / 1000) });
  });

  socket.on('poll-end', function(data) {
    var roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;
    io.to(roomId).emit('poll-end', { votes: data.votes || {}, ts: Math.floor(Date.now() / 1000) });
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

    io.to(roomId).emit('go-live-confirmed', {
      roomId: roomId,
      ts:     now
    });

    if (ack) ack({ started: true });
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

    io.to(roomId).emit('broadcast-ended', { roomId: roomId, ts: now });

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

  // ── disconnect ─────────────────────────────────────────────────────────
  socket.on('disconnect', function(reason) {
    logger.info('[socket] Disconnected: ' + socket.id + ' reason=' + reason);

    var roomId = socket.data.roomId;
    if (!roomId) return;

    var room = rooms.get(roomId);
    if (!room) return;

    room.viewers.delete(socket.id);
    room.guests.delete(socket.id);

    if (room.hostSocketId === socket.id) {
      room.hostSocketId = null;
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
