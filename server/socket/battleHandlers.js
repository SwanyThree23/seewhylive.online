// server/socket/battleHandlers.js
// INTEGRATION: call registerBattleHandlers(io, socket) from inside your existing
// io.on('connection', socket => { ... }) block in index.js / your socket setup file.

const battleService = require('../services/battleService');
const loyaltyService = require('../services/loyaltyService');

// Reuse your existing tick constants if you have them defined elsewhere —
// import them instead of redefining if e.g. HEARTBEAT_MS already exists globally.
const HEARTBEAT_MS = 5000;
const MAX_DRIFT_MS = 300;

const activeTimers = new Map(); // battleId -> interval handle

function roomName(battleId) {
  return `battle:${battleId}`;
}

function registerBattleHandlers(io, socket) {
  socket.on('battle:challenge', async (payload, cb) => {
    try {
      const battle = await battleService.createChallenge({
        challengerId: socket.data.userId,
        opponentId: payload.opponentId,
        mode: payload.mode,
        durationSeconds: payload.durationSeconds,
      });
      io.to(`user:${payload.opponentId}`).emit('battle:challenge', battle);
      if (cb) cb({ ok: true, battle });
    } catch (err) {
      if (cb) cb({ ok: false, error: err.message });
    }
  });

  socket.on('battle:accept', async (payload, cb) => {
    try {
      const battle = await battleService.acceptChallenge(
        payload.battleId,
        payload.challengerRoomId,
        payload.opponentRoomId
      );
      socket.join(roomName(payload.battleId));
      io.to(`user:${battle.challenger_id}`).emit('battle:accept', battle);
      if (cb) cb({ ok: true, battle });
    } catch (err) {
      if (cb) cb({ ok: false, error: err.message });
    }
  });

  socket.on('battle:decline', async (payload, cb) => {
    io.to(`user:${payload.challengerId}`).emit('battle:decline', { battleId: payload.battleId });
    if (cb) cb({ ok: true });
  });

  socket.on('battle:start', async (payload, cb) => {
    try {
      const battle = await battleService.startBattle(payload.battleId);
      const room = roomName(payload.battleId);
      io.to(room).emit('battle:start', battle);
      startCountdown(io, battle);
      if (cb) cb({ ok: true, battle });
    } catch (err) {
      if (cb) cb({ ok: false, error: err.message });
    }
  });

  socket.on('battle:vote', async (payload, cb) => {
    try {
      const battle = await battleService.castVote({
        battleId: payload.battleId,
        voterId: socket.data.userId,
        side: payload.side,
        giftValueCents: payload.giftValueCents,
      });
      io.to(roomName(payload.battleId)).emit('battle:score_update', {
        battleId: battle.id,
        challengerScore: battle.challenger_score,
        opponentScore: battle.opponent_score,
      });
      if (cb) cb({ ok: true, battle });
    } catch (err) {
      if (cb) cb({ ok: false, error: err.message });
    }
  });
}

function startCountdown(io, battle) {
  const room = roomName(battle.id);
  const endTime = Date.now() + battle.duration_seconds * 1000;

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
        io.to(room).emit('battle:error', { message: err.message });
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

module.exports = { registerBattleHandlers };
