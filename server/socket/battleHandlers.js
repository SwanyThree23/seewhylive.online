// server/socket/battleHandlers.js
// INTEGRATION: call registerBattleHandlers(io, socket) from inside your existing
// io.on('connection', socket => { ... }) block in index.js / your socket setup file.
// CORRECTED: uses defenderId/challenger_points/defender_points/duration_minutes,
// matching the real pre-existing pk_battles schema.

const battleService = require('../services/battleService');
// Hook into Rewards & Leaderboard on battle end — see bottom of endBattleAndBroadcast().
const loyaltyService = require('../services/loyaltyService');

const HEARTBEAT_MS = 5000;
const MAX_DRIFT_MS = 300;
const BATTLE_WIN_POINTS = 100; // adjust to taste

const activeTimers = new Map(); // battleId -> interval handle

function roomName(battleId) {
  return `battle:${battleId}`;
}

function registerBattleHandlers(io, socket) {
  socket.on('battle:challenge', async (payload, cb) => {
    try {
      const battle = await battleService.createChallenge({
        challengerId: socket.data.userId,
        defenderId: payload.defenderId,
        challengerName: payload.challengerName,
        defenderName: payload.defenderName,
        roomId: payload.roomId,
        durationMinutes: payload.durationMinutes,
      });
      io.to(`user:${payload.defenderId}`).emit('battle:challenge', battle);
      if (cb) cb({ ok: true, battle });
    } catch (err) {
      if (cb) cb({ ok: false, error: err.message });
    }
  });

  socket.on('battle:accept', async (payload, cb) => {
    try {
      const battle = await battleService.acceptChallenge(payload.battleId, payload.roomId);
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
        side: payload.side, // 'challenger' | 'defender'
        giftValueCents: payload.giftValueCents,
      });
      io.to(roomName(payload.battleId)).emit('battle:score_update', {
        battleId: battle.id,
        challengerPoints: battle.challenger_points,
        defenderPoints: battle.defender_points,
      });
      if (cb) cb({ ok: true, battle });
    } catch (err) {
      if (cb) cb({ ok: false, error: err.message });
    }
  });
}

function startCountdown(io, battle) {
  const room = roomName(battle.id);
  const endTime = Date.now() + battle.duration_minutes * 60 * 1000;

  const interval = setInterval(async () => {
    const remainingMs = endTime - Date.now();
    if (remainingMs <= MAX_DRIFT_MS) {
      clearInterval(interval);
      activeTimers.delete(battle.id);
      await endBattleAndBroadcast(io, room, battle.id);
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
    io.to(room).emit('battle:error', { message: err.message });
  }
}

module.exports = { registerBattleHandlers };
