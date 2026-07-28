// server/socket/battleHandlers.js
// INTEGRATION: call registerBattleHandlers(io, socket) from inside your existing
// io.on('connection', socket => { ... }) block in index.js / your socket setup file.
// CORRECTED: uses defenderId/challenger_points/defender_points/duration_minutes,
// matching the real pre-existing pk_battles schema.

const battleService = require('../services/battleService');
const loyaltyService = require('../services/loyaltyService');

const HEARTBEAT_MS = 5000;
const MAX_DRIFT_MS = 300;
const BATTLE_WIN_POINTS = 100; // adjust to taste

const activeTimers       = new Map(); // battleId -> interval handle
const voteThrottle       = new Map(); // userId -> last vote timestamp (2s)
const challengeThrottle  = new Map(); // userId -> last challenge timestamp (10s)
const BATTLE_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validBattleId(id) {
  return typeof id === 'string' && BATTLE_UUID_RE.test(id);
}

function roomName(battleId) {
  return `battle:${battleId}`;
}

function registerBattleHandlers(io, socket) {
  // Any client (viewer, participant) joins the battle room to receive live events.
  socket.on('battle:watch', async (payload, cb) => {
    if (!payload || !validBattleId(payload.battleId)) { if (cb) cb({ ok: false, error: 'battleId required' }); return; }
    try {
      const battle = await battleService.getBattle(payload.battleId);
      if (!battle) { if (cb) cb({ ok: false, error: 'battle not found' }); return; }
      socket.join(roomName(payload.battleId));
      if (cb) cb({ ok: true });
    } catch (err) {
      if (cb) cb({ ok: false, error: 'Battle error' });
    }
  });

  socket.on('battle:unwatch', (payload) => {
    if (payload && payload.battleId) socket.leave(roomName(payload.battleId));
  });

  socket.on('battle:challenge', async (payload, cb) => {
    if (!socket.data.userId || socket.data.userId.startsWith('anon')) { if (cb) cb({ ok: false, error: 'auth required' }); return; }
    if (!payload || !validBattleId(payload.defenderId)) { if (cb) cb({ ok: false, error: 'invalid defenderId' }); return; }
    if (payload.defenderId === socket.data.userId) { if (cb) cb({ ok: false, error: 'cannot challenge yourself' }); return; }
    if (payload.roomId && !BATTLE_UUID_RE.test(payload.roomId)) { if (cb) cb({ ok: false, error: 'invalid roomId' }); return; }
    const _ctNow = Date.now();
    if (_ctNow - (challengeThrottle.get(socket.data.userId) || 0) < 10000) { if (cb) cb({ ok: false, error: 'too many requests' }); return; }
    challengeThrottle.set(socket.data.userId, _ctNow);
    try {
      const rawDur = Math.floor(Number(payload.durationMinutes) || 5);
      const battle = await battleService.createChallenge({
        challengerId: socket.data.userId,
        defenderId: payload.defenderId,
        challengerName: String(payload.challengerName || '').slice(0, 80),
        defenderName: String(payload.defenderName || '').slice(0, 80),
        roomId: payload.roomId,
        durationMinutes: Math.min(Math.max(rawDur, 1), 60),
      });
      io.to(`user:${payload.defenderId}`).emit('battle:challenge', battle);
      if (cb) cb({ ok: true, battle });
    } catch (err) {
      if (cb) cb({ ok: false, error: 'Challenge failed' });
    }
  });

  socket.on('battle:accept', async (payload, cb) => {
    if (!validBattleId(payload && payload.battleId)) { if (cb) cb({ ok: false, error: 'invalid battleId' }); return; }
    if (payload.roomId && !BATTLE_UUID_RE.test(payload.roomId)) { if (cb) cb({ ok: false, error: 'invalid roomId' }); return; }
    try {
      const existing = await battleService.getBattle(payload.battleId);
      if (!existing || existing.defender_id !== socket.data.userId) {
        if (cb) cb({ ok: false, error: 'forbidden' });
        return;
      }
      const battle = await battleService.acceptChallenge(payload.battleId, payload.roomId);
      socket.join(roomName(payload.battleId));
      // Notify challenger so they can join the battle room too.
      io.to(`user:${battle.challenger_id}`).emit('battle:accept', battle);
      if (cb) cb({ ok: true, battle });
    } catch (err) {
      if (cb) cb({ ok: false, error: 'Battle error' });
    }
  });

  socket.on('battle:decline', async (payload, cb) => {
    if (!validBattleId(payload && payload.battleId)) { if (cb) cb({ ok: false, error: 'invalid battleId' }); return; }
    try {
      const battle = await battleService.getBattle(payload.battleId);
      if (!battle || battle.defender_id !== socket.data.userId) {
        if (cb) cb({ ok: false, error: 'forbidden' });
        return;
      }
      await battleService.declineBattle(payload.battleId, socket.data.userId);
      io.to(`user:${battle.challenger_id}`).emit('battle:decline', { battleId: payload.battleId });
      if (cb) cb({ ok: true });
    } catch (err) {
      if (cb) cb({ ok: false, error: 'Battle error' });
    }
  });

  socket.on('battle:start', async (payload, cb) => {
    if (!socket.data.userId || socket.data.userId.startsWith('anon')) { if (cb) cb({ ok: false, error: 'auth required' }); return; }
    if (!validBattleId(payload && payload.battleId)) { if (cb) cb({ ok: false, error: 'invalid battleId' }); return; }
    try {
      const existing = await battleService.getBattle(payload.battleId);
      if (!existing || (existing.challenger_id !== socket.data.userId && existing.defender_id !== socket.data.userId)) {
        if (cb) cb({ ok: false, error: 'forbidden' });
        return;
      }
      const battle = await battleService.startBattle(payload.battleId);
      if (!battle) { if (cb) cb({ ok: false, error: 'Battle could not be started' }); return; }
      const room = roomName(payload.battleId);
      io.to(room).emit('battle:start', battle);
      startCountdown(io, battle);
      if (cb) cb({ ok: true, battle });
    } catch (err) {
      if (cb) cb({ ok: false, error: 'Battle error' });
    }
  });

  socket.on('battle:vote', async (payload, cb) => {
    if (!socket.data.userId || socket.data.userId.startsWith('anon')) { if (cb) cb({ ok: false, error: 'auth required' }); return; }
    if (!validBattleId(payload && payload.battleId)) { if (cb) cb({ ok: false, error: 'invalid battleId' }); return; }
    const _vtNow = Date.now();
    if (_vtNow - (voteThrottle.get(socket.data.userId) || 0) < 2000) { if (cb) cb({ ok: false, error: 'too many requests' }); return; }
    voteThrottle.set(socket.data.userId, _vtNow);
    try {
      const cents = Math.floor(payload.giftValueCents);
      if (!Number.isFinite(cents) || cents <= 0) {
        if (cb) cb({ ok: false, error: 'giftValueCents must be a positive integer' });
        return;
      }
      // Cap at $500 per vote to limit score inflation from unverified client values
      const MAX_VOTE_CENTS = 50000;
      if (cents > MAX_VOTE_CENTS) {
        if (cb) cb({ ok: false, error: 'giftValueCents exceeds maximum' });
        return;
      }
      if (payload.side !== 'challenger' && payload.side !== 'defender') {
        if (cb) cb({ ok: false, error: 'side must be challenger or defender' });
        return;
      }
      const battle = await battleService.castVote({
        battleId: payload.battleId,
        voterId: socket.data.userId,
        side: payload.side,
        giftValueCents: cents,
      });
      io.to(roomName(payload.battleId)).emit('battle:score_update', {
        battleId: battle.id,
        challengerPoints: battle.challenger_points,
        defenderPoints: battle.defender_points,
      });
      if (cb) cb({ ok: true, battle });
    } catch (err) {
      if (cb) cb({ ok: false, error: 'Battle error' });
    }
  });

  socket.on('disconnect', () => {
    if (socket.data.userId) {
      voteThrottle.delete(socket.data.userId);
      challengeThrottle.delete(socket.data.userId);
    }
  });
}

function startCountdown(io, battle) {
  if (activeTimers.has(battle.id)) return;
  const room = roomName(battle.id);
  const endTime = Date.now() + battle.duration_minutes * 60 * 1000;

  const interval = setInterval(async () => {
    const remainingMs = endTime - Date.now();
    if (remainingMs <= MAX_DRIFT_MS) {
      clearInterval(interval);
      activeTimers.delete(battle.id);
      try {
        const ended = await battleService.endBattle(battle.id);
        io.to(room).emit('battle:end', ended);
        // Award loyalty points: 150 for winner, 50 for participant
        if (ended.winner_id) {
          const loserId = ended.winner_id === ended.challenger_id ? ended.defender_id : ended.challenger_id;
          loyaltyService.awardPoints({ userId: ended.winner_id, points: 150, source: 'battle_win', sourceId: ended.id }).catch(() => {});
          if (loserId) loyaltyService.awardPoints({ userId: loserId, points: 50, source: 'battle_participate', sourceId: ended.id }).catch(() => {});
        } else {
          // Tie — both get participation points
          [ended.challenger_id, ended.defender_id].filter(Boolean).forEach(uid => {
            loyaltyService.awardPoints({ userId: uid, points: 75, source: 'battle_tie', sourceId: ended.id }).catch(() => {});
          });
        }
      } catch (err) {
        io.to(room).emit('battle:error', { message: 'Battle error' });
      }
      return;
    }
    io.to(room).emit('battle:tick', {
      battleId: battle.id,
      remainingSeconds: Math.max(0, Math.round(remainingMs / 1000)),
    });
  }, HEARTBEAT_MS);

  activeTimers.set(battle.id, interval);
}

async function endBattleAndBroadcast(io, room, battleId) {
  try {
    const ended = await battleService.endBattle(battleId);
    io.to(room).emit('battle:end', ended);

    // Rewards & Leaderboard integration: award points to the winner.
    if (ended.winner_id) {
      await loyaltyService.awardPoints({
        userId: ended.winner_id,
        points: BATTLE_WIN_POINTS,
        source: 'pk_battle_win',
        sourceId: ended.id,
      });
    }
  } catch (err) {
    io.to(room).emit('battle:error', { message: 'Battle error' });
  }
}

module.exports = { registerBattleHandlers };
