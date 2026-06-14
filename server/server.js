'use strict';
// SeeWhy LIVE v33 — Production Server
// All constants hardcoded; secrets from env

require('dotenv').config();

var express    = require('express');
var http       = require('http');
var { Server } = require('socket.io');
var cors       = require('cors');
var helmet     = require('helmet');
var rateLimit  = require('express-rate-limit');
var { createClient } = require('@supabase/supabase-js');
var Anthropic  = require('@anthropic-ai/sdk');
var Stripe     = require('stripe');
var { v4: uuid } = require('uuid');
var winston    = require('winston');

// ─── IMMUTABLE CONSTANTS ─────────────────────────────────────────────────────
var CREATOR_SPLIT       = 0.90;
var PLATFORM_FEE_PCT    = 0.10;
var MAX_PANEL_GUESTS    = 20;
var MAX_BREAKOUT_ROOMS  = 35;
var GUARDIAN_AUTO_BAN   = 0.95;
var GUARDIAN_WARN       = 0.75;
var GUARDIAN_FLAG       = 0.50;
var RTMP_INGEST         = 'rtmp://ingest.seewhylive.online:1935/live';
var STREAM_KEY          = 'sw_6991033b_n8gf2vyf';
var STRIPE_ACCOUNT      = 'acct_1Svbvv2N0KWn0OQu';
var SUPABASE_URL        = 'https://rxlgywvfclyjdfyvfvyc.supabase.co';

var GEM_VALUES = { ruby: 99, gold: 199, diamond: 499, purple: 99, bone: 49 };    // cents
var SCENES     = ['main', 'facecam', 'game_focus', 'pk_battle', 'bracket', 'brb', 'outro'];

var PORT = parseInt(process.env.PORT) || 3001;

// ─── LOGGER ──────────────────────────────────────────────────────────────────
var logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) =>
      `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/var/log/seewhy/server-out.log', maxsize: 10_000_000, maxFiles: 5 }),
    new winston.transports.File({ filename: '/var/log/seewhy/server-error.log', level: 'error', maxsize: 10_000_000, maxFiles: 5 }),
  ],
});

// ─── CLIENTS ─────────────────────────────────────────────────────────────────
var supabase  = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || '');
var ai        = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
var stripe    = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-04-10' });

// ─── APP ─────────────────────────────────────────────────────────────────────
var app    = express();
var server = http.createServer(app);
var io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));

// Raw body for Stripe webhooks before json middleware
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '2mb' }));

var limiter = rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

// ─── IN-MEMORY STATE ─────────────────────────────────────────────────────────
var rooms       = new Map(); // roomId → { hostId, guests: Set, scene, pkBattle, watchParty }
var pkBattles   = new Map(); // battleId → { roomA, roomB, scoreA, scoreB, endsAt }
var watchParties= new Map(); // partyId  → { videoUrl, position, playing, members: Set }
var brackets    = new Map(); // tourneyId → { rounds: [], participants: [] }
var inviteCodes = new Set(process.env.INVITE_CODES ? process.env.INVITE_CODES.split(',') : []);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function creatorShare(totalCents) {
  return Math.floor(totalCents * CREATOR_SPLIT);
}
function platformShare(totalCents) {
  return totalCents - creatorShare(totalCents);
}

function getOrCreateRoom(roomId, hostId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { hostId, guests: new Set(), scene: 'main', pkBattle: null, watchParty: null, createdAt: Date.now() });
  }
  return rooms.get(roomId);
}

async function logActivity(userId, type, title, extra = {}) {
  if (!userId) return;
  try {
    await supabase.from('activities').insert({ user_id: userId, type, title, ...extra });
  } catch (_) { /* non-blocking */ }
}

// ─── GUARDIAN AI (Claude Haiku — speed) ──────────────────────────────────────
async function guardianScan(text, userId, streamId) {
  if (!text || !text.trim()) return { action: 'allow', score: 0 };
  try {
    var resp = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      system: 'You are a content moderation AI. Respond ONLY with a JSON object: {"score":0.0,"reason":"short reason"}. Score 0-1 where 1 = severe violation (hate speech, threats, CSAM, doxxing). Score 0.5 = borderline spam/harassment.',
      messages: [{ role: 'user', content: text.slice(0, 500) }],
    });
    var raw = resp.content[0]?.text?.trim() ?? '{"score":0}';
    var parsed = JSON.parse(raw);
    var score = Number(parsed.score) || 0;

    if (score >= GUARDIAN_AUTO_BAN) {
      await supabase.from('moderation_actions').insert({ user_id: userId, stream_id: streamId, action: 'auto_ban', score, reason: parsed.reason, text: text.slice(0, 300) });
      return { action: 'ban', score, reason: parsed.reason };
    }
    if (score >= GUARDIAN_WARN) {
      await supabase.from('moderation_actions').insert({ user_id: userId, stream_id: streamId, action: 'warn', score, reason: parsed.reason, text: text.slice(0, 300) });
      return { action: 'warn', score, reason: parsed.reason };
    }
    if (score >= GUARDIAN_FLAG) {
      return { action: 'flag', score, reason: parsed.reason };
    }
    return { action: 'allow', score };
  } catch (err) {
    logger.error(`Guardian scan error: ${err.message}`);
    return { action: 'allow', score: 0 };
  }
}

// ─── INSFORGE (Claude Sonnet — quality) ──────────────────────────────────────
async function insForge(prompt, maxTokens = 1024) {
  var resp = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  return resp.content[0]?.text?.trim() ?? '';
}

// ══════════════════════════════════════════════════════════════════════════════
// REST ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    version: 33,
    rooms: rooms.size,
    pkBattles: pkBattles.size,
    watchParties: watchParties.size,
    uptime: Math.floor(process.uptime()),
    ts: new Date().toISOString(),
  });
});

// ── Broadcast Engine ──────────────────────────────────────────────────────────
app.post('/api/rooms/start', async (req, res) => {
  try {
    var { roomId, hostId, title, category, scene } = req.body;
    if (!roomId || !hostId) return res.status(400).json({ error: 'roomId and hostId required' });

    var room = getOrCreateRoom(roomId, hostId);
    if (scene && SCENES.includes(scene)) room.scene = scene;

    var { error } = await supabase.from('streams').upsert({
      id: roomId, creator_id: hostId, creator_username: title || roomId,
      title: title || 'Live Stream', category: category || 'general',
      is_live: true, started_at: new Date().toISOString(),
      rtmp_key: STREAM_KEY,
    }, { onConflict: 'id' });

    if (error) logger.error(`rooms/start DB error: ${error.message}`);

    io.to(roomId).emit('room:started', { roomId, hostId, scene: room.scene, rtmpIngest: RTMP_INGEST });
    await logActivity(hostId, 'room_created', `Started stream: ${title || roomId}`);

    res.json({ ok: true, roomId, scene: room.scene, rtmpIngest: RTMP_INGEST, streamKey: STREAM_KEY });
  } catch (err) {
    logger.error(`rooms/start: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms/end', async (req, res) => {
  try {
    var { roomId, hostId } = req.body;
    var room = rooms.get(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    await supabase.from('streams').update({ is_live: false, ended_at: new Date().toISOString() }).eq('id', roomId);
    io.to(roomId).emit('room:ended', { roomId });
    rooms.delete(roomId);

    await logActivity(hostId, 'room_ended', `Ended stream: ${roomId}`);
    res.json({ ok: true });
  } catch (err) {
    logger.error(`rooms/end: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms/scene', async (req, res) => {
  var { roomId, scene } = req.body;
  if (!SCENES.includes(scene)) return res.status(400).json({ error: 'Invalid scene', validScenes: SCENES });
  var room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.scene = scene;
  io.to(roomId).emit('room:scene', { roomId, scene });
  res.json({ ok: true, scene });
});

app.get('/api/rooms/:roomId', (req, res) => {
  var room = rooms.get(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ ...room, guests: [...room.guests] });
});

// ── Panel Grid (up to 20 guests) ─────────────────────────────────────────────
app.post('/api/panel/join', (req, res) => {
  var { roomId, guestId, displayName } = req.body;
  if (!roomId || !guestId) return res.status(400).json({ error: 'roomId and guestId required' });
  var room = getOrCreateRoom(roomId, guestId);
  if (room.guests.size >= MAX_PANEL_GUESTS) {
    return res.status(429).json({ error: `Panel full (max ${MAX_PANEL_GUESTS})` });
  }
  room.guests.add(guestId);
  io.to(roomId).emit('panel:joined', { guestId, displayName, count: room.guests.size });
  res.json({ ok: true, count: room.guests.size });
});

app.post('/api/panel/leave', (req, res) => {
  var { roomId, guestId } = req.body;
  var room = rooms.get(roomId);
  if (room) { room.guests.delete(guestId); io.to(roomId).emit('panel:left', { guestId, count: room.guests.size }); }
  res.json({ ok: true });
});

// ── PK Battle ────────────────────────────────────────────────────────────────
app.post('/api/pk/start', async (req, res) => {
  try {
    var { roomA, roomB, hostAId, hostBId, durationMs = 300_000 } = req.body;
    var battleId = uuid();
    var endsAt   = Date.now() + durationMs;

    pkBattles.set(battleId, { roomA, roomB, hostAId, hostBId, scoreA: 0, scoreB: 0, endsAt, active: true });

    io.to(roomA).emit('pk:started', { battleId, opponent: roomB, endsAt });
    io.to(roomB).emit('pk:started', { battleId, opponent: roomA, endsAt });

    await Promise.allSettled([
      logActivity(hostAId, 'milestone', `PK Battle started vs ${roomB}`),
      logActivity(hostBId, 'milestone', `PK Battle started vs ${roomA}`),
    ]);

    // Auto-end after duration
    setTimeout(async () => {
      var battle = pkBattles.get(battleId);
      if (!battle || !battle.active) return;
      battle.active = false;
      var winner = battle.scoreA >= battle.scoreB ? roomA : roomB;
      var loser  = winner === roomA ? roomB : roomA;
      io.to(roomA).emit('pk:ended', { battleId, winner, loser, scoreA: battle.scoreA, scoreB: battle.scoreB });
      io.to(roomB).emit('pk:ended', { battleId, winner, loser, scoreA: battle.scoreA, scoreB: battle.scoreB });
      pkBattles.delete(battleId);
    }, durationMs);

    res.json({ ok: true, battleId, endsAt });
  } catch (err) {
    logger.error(`pk/start: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pk/score', (req, res) => {
  var { battleId, room, delta = 1 } = req.body;
  var battle = pkBattles.get(battleId);
  if (!battle || !battle.active) return res.status(404).json({ error: 'Battle not found or ended' });

  if (room === battle.roomA) battle.scoreA += delta;
  else if (room === battle.roomB) battle.scoreB += delta;
  else return res.status(400).json({ error: 'Room not in this battle' });

  io.to(battle.roomA).emit('pk:score', { battleId, scoreA: battle.scoreA, scoreB: battle.scoreB });
  io.to(battle.roomB).emit('pk:score', { battleId, scoreA: battle.scoreA, scoreB: battle.scoreB });
  res.json({ ok: true, scoreA: battle.scoreA, scoreB: battle.scoreB });
});

// ── Watch Party ───────────────────────────────────────────────────────────────
app.post('/api/watchparty/create', (req, res) => {
  var { partyId, hostId, videoUrl } = req.body;
  if (!partyId || !videoUrl) return res.status(400).json({ error: 'partyId and videoUrl required' });
  watchParties.set(partyId, { hostId, videoUrl, position: 0, playing: false, members: new Set([hostId]) });
  res.json({ ok: true, partyId });
});

app.post('/api/watchparty/sync', (req, res) => {
  var { partyId, position, playing, requesterId } = req.body;
  var party = watchParties.get(partyId);
  if (!party) return res.status(404).json({ error: 'Party not found' });
  if (requesterId !== party.hostId) return res.status(403).json({ error: 'Only host can sync' });
  party.position = position;
  party.playing  = playing;
  io.to(`watchparty:${partyId}`).emit('watchparty:sync', { position, playing, ts: Date.now() });
  res.json({ ok: true });
});

app.get('/api/watchparty/:partyId', (req, res) => {
  var party = watchParties.get(req.params.partyId);
  if (!party) return res.status(404).json({ error: 'Party not found' });
  res.json({ ...party, members: [...party.members] });
});

// ── Guardian AI ───────────────────────────────────────────────────────────────
app.post('/api/guardian/scan', async (req, res) => {
  try {
    var { text, userId, streamId } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    var result = await guardianScan(text, userId, streamId);
    res.json(result);
  } catch (err) {
    logger.error(`guardian/scan: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ── InsForge AI Content Generation ───────────────────────────────────────────
app.post('/api/insforge/generate', async (req, res) => {
  try {
    var { type, context, userId } = req.body;
    if (!type) return res.status(400).json({ error: 'type required' });

    var prompts = {
      title:       `Generate 5 catchy, engaging live stream titles for: "${context}". Return as a JSON array of strings.`,
      description: `Write a compelling 2-paragraph stream description for a live show about: "${context}". Be energetic and creator-forward.`,
      tags:        `Generate 15 relevant stream tags for: "${context}". Return as a JSON array of lowercase strings.`,
      clip_title:  `Write 3 short, punchy clip titles for a highlight from: "${context}". Return as a JSON array.`,
      bio:         `Write a creative streamer bio (150 words max) for a creator who streams: "${context}".`,
      announcement:`Write an exciting social media announcement for a live stream about: "${context}". Include a call to action.`,
    };

    var prompt = prompts[type] || `Generate content of type "${type}" for: "${context}"`;
    var result = await insForge(prompt);

    await logActivity(userId, 'milestone', `Used InsForge: ${type}`);
    res.json({ ok: true, type, result });
  } catch (err) {
    logger.error(`insforge/generate: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ── Gems / Payouts (90/10 split) ─────────────────────────────────────────────
app.post('/api/gems/tribute', async (req, res) => {
  try {
    var { senderId, recipientId, streamId, gemType, quantity = 1 } = req.body;
    if (!senderId || !recipientId || !gemType) {
      return res.status(400).json({ error: 'senderId, recipientId, gemType required' });
    }

    var unitCents  = GEM_VALUES[gemType];
    if (!unitCents) return res.status(400).json({ error: `Unknown gem type: ${gemType}. Valid: ${Object.keys(GEM_VALUES).join(', ')}` });

    var totalCents    = unitCents * quantity;
    var creatorCents  = creatorShare(totalCents);
    var platformCents = platformShare(totalCents);

    var { data, error } = await supabase.from('tribute_transactions').insert({
      stream_id: streamId,
      sender_id: senderId,
      recipient_id: recipientId,
      gem_type: gemType,
      quantity,
      total_cents: totalCents,
      creator_cents: creatorCents,
      platform_cents: platformCents,
    }).select().single();

    if (error) throw new Error(error.message);

    io.to(streamId || recipientId).emit('gems:tribute', {
      senderId, recipientId, gemType, quantity, totalCents, creatorCents,
    });

    await Promise.allSettled([
      logActivity(senderId,    'tip_sent',      `Sent ${quantity}x ${gemType} gem(s)`, { amount: totalCents, recipient_id: recipientId }),
      logActivity(recipientId, 'tip_received',  `Received ${quantity}x ${gemType} gem(s)`, { amount: creatorCents, sender_id: senderId }),
    ]);

    res.json({ ok: true, totalCents, creatorCents, platformCents, transactionId: data?.id });
  } catch (err) {
    logger.error(`gems/tribute: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/gems/values', (req, res) => res.json(GEM_VALUES));

app.post('/api/gems/payout', async (req, res) => {
  try {
    var { creatorId, stripeAccountId = STRIPE_ACCOUNT } = req.body;
    if (!creatorId) return res.status(400).json({ error: 'creatorId required' });

    var { data: txns, error } = await supabase
      .from('tribute_transactions')
      .select('creator_cents')
      .eq('recipient_id', creatorId)
      .eq('paid_out', false);

    if (error) throw new Error(error.message);

    var totalOwed = (txns || []).reduce((sum, t) => sum + (t.creator_cents || 0), 0);
    if (totalOwed < 100) return res.status(400).json({ error: 'Minimum payout is $1.00', totalOwed });

    var transfer = await stripe.transfers.create({
      amount: totalOwed,
      currency: 'usd',
      destination: stripeAccountId,
      metadata: { creatorId, source: 'seewhy_live_gems' },
    });

    await supabase.from('tribute_transactions')
      .update({ paid_out: true, payout_transfer_id: transfer.id, paid_out_at: new Date().toISOString() })
      .eq('recipient_id', creatorId)
      .eq('paid_out', false);

    await logActivity(creatorId, 'milestone', `Payout processed: $${(totalOwed / 100).toFixed(2)}`);
    res.json({ ok: true, amountCents: totalOwed, transferId: transfer.id });
  } catch (err) {
    logger.error(`gems/payout: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ── Subscriptions ─────────────────────────────────────────────────────────────
app.post('/api/subscriptions/checkout', async (req, res) => {
  try {
    var { userId, creatorId, tier, successUrl, cancelUrl } = req.body;
    var tierPriceIds = {
      bronze: process.env.STRIPE_PRICE_BRONZE,
      silver: process.env.STRIPE_PRICE_SILVER,
      gold:   process.env.STRIPE_PRICE_GOLD,
    };
    var priceId = tierPriceIds[tier];
    if (!priceId) return res.status(400).json({ error: 'Invalid tier or price not configured' });

    var session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${process.env.FRONTEND_URL}/subscription/success`,
      cancel_url:  cancelUrl  || `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: { userId, creatorId, tier },
    });

    res.json({ ok: true, checkoutUrl: session.url, sessionId: session.id });
  } catch (err) {
    logger.error(`subscriptions/checkout: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ── Analytics ─────────────────────────────────────────────────────────────────
app.get('/api/analytics/stream/:streamId', async (req, res) => {
  try {
    var { streamId } = req.params;

    var [streamRes, chatRes, tributeRes] = await Promise.all([
      supabase.from('streams').select('*').eq('id', streamId).single(),
      supabase.from('stream_chat').select('id', { count: 'exact' }).eq('stream_id', streamId),
      supabase.from('tribute_transactions').select('total_cents, creator_cents').eq('stream_id', streamId),
    ]);

    var tributes = tributeRes.data || [];
    var totalRevenueCents  = tributes.reduce((s, t) => s + (t.total_cents || 0), 0);
    var creatorRevenueCents = tributes.reduce((s, t) => s + (t.creator_cents || 0), 0);

    res.json({
      stream: streamRes.data,
      chatMessages: chatRes.count || 0,
      tributeCount: tributes.length,
      totalRevenueCents,
      creatorRevenueCents,
      platformRevenueCents: totalRevenueCents - creatorRevenueCents,
      creatorSplitPct: CREATOR_SPLIT * 100,
    });
  } catch (err) {
    logger.error(`analytics/stream: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/creator/:creatorId', async (req, res) => {
  try {
    var { creatorId } = req.params;
    var { data: streams } = await supabase.from('streams').select('id, title, viewer_count, peak_viewers, started_at, ended_at').eq('creator_id', creatorId).order('created_at', { ascending: false }).limit(30);
    var { data: tributes } = await supabase.from('tribute_transactions').select('total_cents, creator_cents, created_at').eq('recipient_id', creatorId);

    var totalEarned = (tributes || []).reduce((s, t) => s + (t.creator_cents || 0), 0);
    res.json({ streams: streams || [], totalEarnedCents: totalEarned, streamCount: (streams || []).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Fallen Legends ────────────────────────────────────────────────────────────
app.get('/api/fallen-legends', async (req, res) => {
  try {
    var { data, error } = await supabase.from('fallen_legends').select('*').order('memorial_date', { ascending: false });
    if (error) throw new Error(error.message);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fallen-legends', async (req, res) => {
  try {
    var { name, bio, memorialDate, imageUrl, tributeStreamId, addedBy } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    var { data, error } = await supabase.from('fallen_legends').insert({
      name, bio, memorial_date: memorialDate, image_url: imageUrl,
      tribute_stream_id: tributeStreamId, added_by: addedBy,
    }).select().single();
    if (error) throw new Error(error.message);
    res.json({ ok: true, legend: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Onboarding / Invite Codes ─────────────────────────────────────────────────
app.post('/api/invite/validate', async (req, res) => {
  try {
    var { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });

    var { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) return res.status(404).json({ valid: false, error: 'Code not found' });
    if (data.used_at)  return res.status(409).json({ valid: false, error: 'Code already used' });

    res.json({ valid: true, tier: data.tier || 'bronze', foundingMember: !!data.is_founding });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invite/redeem', async (req, res) => {
  try {
    var { code, userId } = req.body;
    if (!code || !userId) return res.status(400).json({ error: 'code and userId required' });

    var { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) return res.status(404).json({ error: 'Code not found' });
    if (data.used_at)  return res.status(409).json({ error: 'Code already used' });

    await Promise.all([
      supabase.from('invite_codes').update({ used_at: new Date().toISOString(), used_by: userId }).eq('id', data.id),
      supabase.from('profiles').update({
        subscription_tier: data.tier || 'bronze',
        is_founding_member: !!data.is_founding,
        founding_member_number: data.founding_number || null,
      }).eq('id', userId),
    ]);

    await logActivity(userId, 'milestone', `Redeemed founding invite code: ${code.toUpperCase()}`);
    res.json({ ok: true, tier: data.tier || 'bronze', foundingMember: !!data.is_founding });
  } catch (err) {
    logger.error(`invite/redeem: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ── Tournament Brackets ───────────────────────────────────────────────────────
app.post('/api/tournament/create', async (req, res) => {
  try {
    var { tournamentId, name, participants, format = 'single_elimination', hostId } = req.body;
    if (!tournamentId || !participants?.length) return res.status(400).json({ error: 'tournamentId and participants required' });

    var shuffled = [...participants].sort(() => Math.random() - 0.5);
    var rounds   = buildBracket(shuffled, format);

    brackets.set(tournamentId, { name, format, participants: shuffled, rounds, hostId, createdAt: Date.now() });

    var { error } = await supabase.from('tournaments').upsert({
      id: tournamentId, name, format, host_id: hostId,
      participants: JSON.stringify(shuffled),
      bracket: JSON.stringify(rounds),
    }, { onConflict: 'id' });

    if (error) logger.error(`tournament/create DB: ${error.message}`);

    await logActivity(hostId, 'milestone', `Created tournament: ${name}`);
    res.json({ ok: true, tournamentId, rounds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tournament/result', (req, res) => {
  var { tournamentId, roundIdx, matchIdx, winnerId } = req.body;
  var tourney = brackets.get(tournamentId);
  if (!tourney) return res.status(404).json({ error: 'Tournament not found' });
  if (!tourney.rounds[roundIdx]?.[matchIdx]) return res.status(400).json({ error: 'Invalid round/match' });

  tourney.rounds[roundIdx][matchIdx].winner = winnerId;
  io.to(`tournament:${tournamentId}`).emit('tournament:result', { roundIdx, matchIdx, winnerId });
  res.json({ ok: true });
});

app.get('/api/tournament/:tournamentId', (req, res) => {
  var tourney = brackets.get(req.params.tournamentId);
  if (!tourney) return res.status(404).json({ error: 'Tournament not found' });
  res.json(tourney);
});

function buildBracket(participants, format) {
  if (format === 'round_robin') {
    var matches = [];
    for (var i = 0; i < participants.length; i++) {
      for (var j = i + 1; j < participants.length; j++) {
        matches.push({ a: participants[i], b: participants[j], winner: null });
      }
    }
    return [matches];
  }
  // Single elimination
  var rounds = [];
  var current = [...participants];
  while (current.length > 1) {
    var round = [];
    for (var k = 0; k < current.length; k += 2) {
      round.push({ a: current[k], b: current[k + 1] || null, winner: null });
    }
    rounds.push(round);
    current = round.map(m => m.winner || m.a); // placeholder until results filed
    if (rounds.length > 10) break; // safety
  }
  return rounds;
}

// ── Chat Moderation ───────────────────────────────────────────────────────────
app.post('/api/chat/message', async (req, res) => {
  try {
    var { streamId, userId, username, message, role } = req.body;
    if (!streamId || !message) return res.status(400).json({ error: 'streamId and message required' });

    // Guardian scan (async, non-blocking for response)
    var scanResult = await guardianScan(message, userId, streamId);
    if (scanResult.action === 'ban') {
      return res.status(403).json({ error: 'Message blocked by Guardian AI', reason: scanResult.reason });
    }

    var { data, error } = await supabase.from('stream_chat').insert({
      stream_id: streamId, user_id: userId, username,
      message, role: role || 'viewer',
      is_moderated: scanResult.action !== 'allow',
      guardian_score: scanResult.score,
    }).select().single();

    if (error) throw new Error(error.message);

    var payload = { id: data.id, streamId, userId, username, message, role, ts: data.created_at };
    io.to(streamId).emit('chat:message', payload);

    if (scanResult.action === 'warn') {
      io.to(streamId).emit('chat:flagged', { messageId: data.id, reason: scanResult.reason });
    }

    res.json({ ok: true, messageId: data.id, guardianAction: scanResult.action });
  } catch (err) {
    logger.error(`chat/message: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ── Stripe Webhooks ───────────────────────────────────────────────────────────
app.post('/api/webhooks/stripe', async (req, res) => {
  var sig = req.headers['stripe-signature'];
  var event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err) {
    logger.error(`Stripe webhook sig failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        var session = event.data.object;
        var { userId, creatorId, tier } = session.metadata || {};
        if (userId && tier) {
          await supabase.from('profiles').update({ subscription_tier: tier }).eq('id', userId);
          if (creatorId) {
            await supabase.from('subscriptions').upsert({
              subscriber_id: userId, creator_id: creatorId, tier,
              stripe_subscription_id: session.subscription,
              active: true, started_at: new Date().toISOString(),
            }, { onConflict: 'subscriber_id,creator_id' });
          }
          await Promise.allSettled([
            logActivity(userId, 'subscription', `Subscribed at ${tier} tier`),
            creatorId && logActivity(creatorId, 'subscription', `New ${tier} subscriber`),
          ]);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        var sub = event.data.object;
        var { userId: uid } = sub.metadata || {};
        if (uid) await supabase.from('profiles').update({ subscription_tier: 'free' }).eq('id', uid);
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    logger.error(`Stripe webhook handler: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ── RTMP / Stream Key Validation (called by nginx rtmp on_publish) ────────────
app.post('/api/rtmp/auth', async (req, res) => {
  try {
    var { name: streamKey, addr } = req.body;
    if (!streamKey) return res.status(403).send('Forbidden');

    var { data } = await supabase.from('streams').select('id, creator_id, is_live').eq('rtmp_key', streamKey).single();
    if (!data) return res.status(403).send('Invalid stream key');

    await supabase.from('streams').update({ is_live: true, started_at: new Date().toISOString() }).eq('id', data.id);
    io.to(data.id).emit('room:started', { roomId: data.id, rtmpAddr: addr });
    logger.info(`RTMP auth OK: stream ${data.id} from ${addr}`);
    res.status(200).send('OK');
  } catch (err) {
    logger.error(`rtmp/auth: ${err.message}`);
    res.status(403).send('Forbidden');
  }
});

app.post('/api/rtmp/done', async (req, res) => {
  try {
    var { name: streamKey } = req.body;
    var { data } = await supabase.from('streams').select('id').eq('rtmp_key', streamKey).single();
    if (data) {
      await supabase.from('streams').update({ is_live: false, ended_at: new Date().toISOString() }).eq('id', data.id);
      io.to(data.id).emit('room:ended', { roomId: data.id });
    }
    res.status(200).send('OK');
  } catch (err) {
    logger.error(`rtmp/done: ${err.message}`);
    res.status(200).send('OK');
  }
});

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use('/api/', (req, res) => res.status(404).json({ error: 'Not found' }));

// ══════════════════════════════════════════════════════════════════════════════
// SOCKET.IO — WebSocket hub
// ══════════════════════════════════════════════════════════════════════════════
io.on('connection', (socket) => {
  var currentRooms = new Set();

  socket.on('room:join', ({ roomId, userId, displayName }) => {
    if (!roomId) return;
    socket.join(roomId);
    currentRooms.add(roomId);
    var room = getOrCreateRoom(roomId, userId);
    socket.to(roomId).emit('user:joined', { userId, displayName, socketId: socket.id, guestCount: room.guests.size });
  });

  socket.on('room:leave', ({ roomId, userId }) => {
    socket.leave(roomId);
    currentRooms.delete(roomId);
    var room = rooms.get(roomId);
    if (room) { room.guests.delete(userId); socket.to(roomId).emit('user:left', { userId, guestCount: room.guests.size }); }
  });

  socket.on('watchparty:join', ({ partyId, userId }) => {
    socket.join(`watchparty:${partyId}`);
    var party = watchParties.get(partyId);
    if (party) {
      party.members.add(userId);
      socket.emit('watchparty:state', { position: party.position, playing: party.playing, videoUrl: party.videoUrl });
    }
  });

  socket.on('tournament:join', ({ tournamentId }) => {
    socket.join(`tournament:${tournamentId}`);
  });

  socket.on('chat:message', async ({ roomId, userId, username, message, role }) => {
    var scanResult = await guardianScan(message, userId, roomId);
    if (scanResult.action === 'ban') {
      socket.emit('chat:blocked', { reason: scanResult.reason });
      return;
    }
    var payload = { userId, username, message, role, ts: Date.now(), flagged: scanResult.action !== 'allow' };
    io.to(roomId).emit('chat:message', payload);
  });

  socket.on('pk:tribute', ({ battleId, room, amount, senderId }) => {
    var battle = pkBattles.get(battleId);
    if (!battle || !battle.active) return;
    var delta = Math.max(1, Math.floor(amount / 100));
    if (room === battle.roomA) battle.scoreA += delta;
    else if (room === battle.roomB) battle.scoreB += delta;
    io.to(battle.roomA).emit('pk:score', { battleId, scoreA: battle.scoreA, scoreB: battle.scoreB });
    io.to(battle.roomB).emit('pk:score', { battleId, scoreA: battle.scoreA, scoreB: battle.scoreB });
  });

  socket.on('scene:change', ({ roomId, scene, hostId }) => {
    if (!SCENES.includes(scene)) return;
    var room = rooms.get(roomId);
    if (!room || room.hostId !== hostId) return;
    room.scene = scene;
    io.to(roomId).emit('room:scene', { roomId, scene });
  });

  socket.on('disconnect', () => {
    currentRooms.forEach(roomId => {
      var room = rooms.get(roomId);
      if (room) socket.to(roomId).emit('user:disconnected', { socketId: socket.id });
    });
  });
});

// ─── START ────────────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`SeeWhy LIVE v33 server running on :${PORT}`);
  logger.info(`Creator split: ${CREATOR_SPLIT * 100}%  |  Platform fee: ${PLATFORM_FEE_PCT * 100}%`);
  logger.info(`Max panel guests: ${MAX_PANEL_GUESTS}  |  Max breakout rooms: ${MAX_BREAKOUT_ROOMS}`);
  logger.info(`RTMP ingest: ${RTMP_INGEST}`);
});

module.exports = { app, server, io };
