// server/socket/panelHandlers.js
//
// INTEGRATION: call registerPanelHandlers(io, socket) from the same place
// battleHandlers/join-room handlers are registered, inside io.on('connection').

const panelService = require('../services/panelService');
const loyaltyService = require('../services/loyaltyService');

const panelJoinThrottle    = new Map(); // userId -> last join timestamp
const panelRequestThrottle = new Map(); // userId -> last request timestamp
const panelReactThrottle   = new Map(); // userId -> last react timestamp
const panelHandThrottle    = new Map(); // userId -> last hand-raise timestamp
const panelLoyaltyThrottle = new Map(); // `userId:roomId` -> last award timestamp

const LOYALTY_AWARD_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour per user per room
const THROTTLE_STALE_MS = 30000; // 30 s >> any window (max 3 s) — safe to prune

// Prune stale throttle entries every 5 minutes so the Maps don't grow
// unboundedly on long-running PM2 processes (one entry per unique userId otherwise).
setInterval(function() {
  var now = Date.now();
  panelJoinThrottle.forEach(function(ts, k) { if (now - ts > THROTTLE_STALE_MS) panelJoinThrottle.delete(k); });
  panelRequestThrottle.forEach(function(ts, k) { if (now - ts > THROTTLE_STALE_MS) panelRequestThrottle.delete(k); });
  panelReactThrottle.forEach(function(ts, k) { if (now - ts > THROTTLE_STALE_MS) panelReactThrottle.delete(k); });
  panelHandThrottle.forEach(function(ts, k) { if (now - ts > THROTTLE_STALE_MS) panelHandThrottle.delete(k); });
  panelLoyaltyThrottle.forEach(function(ts, k) { if (now - ts > LOYALTY_AWARD_COOLDOWN_MS) panelLoyaltyThrottle.delete(k); });
}, 5 * 60 * 1000).unref();

const PANEL_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function registerPanelHandlers(io, socket) {
  socket.on('panel:join', async ({ roomId, inviteCode }, ack) => {
    try {
      const userId = socket.data.userId;
      if (!userId || userId.startsWith('anon')) {
        ack?.({ ok: false, error: 'auth required' });
        return;
      }
      if (roomId !== socket.data.roomId) {
        ack?.({ ok: false, error: 'forbidden' });
        return;
      }
      var _pjNow = Date.now();
      if (_pjNow - (panelJoinThrottle.get(userId) || 0) < 3000) {
        ack?.({ ok: false, error: 'too many requests' });
        return;
      }
      panelJoinThrottle.set(userId, _pjNow);
      const gate = await panelService.checkJoinGate({ roomId, userId, inviteCode });
      if (!gate.allowed) {
        ack?.({ ok: false, reason: gate.reason });
        return;
      }
      const { slot, isNew } = await panelService.assignSlot({ roomId, userId });
      socket.join(roomId);
      io.to(roomId).emit('panel:slot_assigned', { roomId, slot });
      if (isNew) {
        var _loyKey = userId + ':' + roomId;
        var _loyNow = Date.now();
        if (_loyNow - (panelLoyaltyThrottle.get(_loyKey) || 0) >= LOYALTY_AWARD_COOLDOWN_MS) {
          panelLoyaltyThrottle.set(_loyKey, _loyNow);
          loyaltyService.awardPoints({ userId, points: 25, source: 'panel_join', sourceId: roomId }).catch(function() {});
        }
      }
      ack?.({ ok: true, slot });
    } catch (err) {
      ack?.({ ok: false, error: 'Panel error' });
    }
  });

  socket.on('panel:request_join', async ({ roomId: _ignored }, ack) => {
    try {
      const userId = socket.data.userId;
      const roomId = socket.data.roomId;
      if (!userId || userId.startsWith('anon')) {
        ack?.({ ok: false, error: 'auth required' });
        return;
      }
      if (!roomId) {
        ack?.({ ok: false, error: 'not in a room' });
        return;
      }
      var _prjNow = Date.now();
      if (_prjNow - (panelRequestThrottle.get(userId) || 0) < 2000) {
        ack?.({ ok: false, error: 'too many requests' });
        return;
      }
      panelRequestThrottle.set(userId, _prjNow);
      const request = await panelService.requestJoin({ roomId, userId });
      // Emit only to host sockets in this room — not all viewers
      const roomSockets = await io.in(roomId).fetchSockets();
      const hostSockets = roomSockets.filter(function(s) { return s.data && s.data.role === 'host'; });
      hostSockets.forEach(function(hs) {
        hs.emit('panel:join_request_received', {
          roomId,
          userId,
          requestId: request.id,
          displayName: request.display_name || null,
          avatarUrl: request.avatar_url || null,
        });
      });
      ack?.({ ok: true, status: 'pending' });
    } catch (err) {
      ack?.({ ok: false, error: 'Panel error' });
    }
  });

  socket.on('panel:resolve_join_request', async ({ roomId, userId, approve }, ack) => {
    try {
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) {
        ack?.({ ok: false, error: 'forbidden' });
        return;
      }
      if (!userId || !PANEL_UUID_RE.test(String(userId))) {
        ack?.({ ok: false, error: 'invalid userId' });
        return;
      }
      const resolved = await panelService.resolveJoinRequest({ roomId, userId, approve, resolverId: socket.data.userId });
      // Emit only to the requesting user, not the entire room
      const roomSockets = await io.in(roomId).fetchSockets();
      const targetSocket = roomSockets.find(function(s) { return s.data && s.data.userId === userId; });
      if (targetSocket) targetSocket.emit('panel:join_request_resolved', { roomId, userId, approve, resolved });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: 'Panel error' });
    }
  });

  socket.on('panel:leave', async (payload, ack) => {
    try {
      const userId = socket.data.userId;
      const roomId = socket.data.roomId;
      if (!roomId) { ack?.({ ok: false, error: 'not in a room' }); return; }
      await panelService.releaseSlot({ roomId, userId });
      socket.leave(roomId);
      io.to(roomId).emit('panel:slot_released', { roomId, userId });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: 'Panel error' });
    }
  });

  socket.on('panel:expand', async ({ roomId, slotIndex, expanded }, ack) => {
    try {
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) {
        ack?.({ ok: false, error: 'forbidden' });
        return;
      }
      const _si = Math.floor(Number(slotIndex));
      if (!Number.isFinite(_si) || _si < 0 || _si > 7) {
        ack?.({ ok: false, error: 'invalid slotIndex' });
        return;
      }
      const slot = await panelService.setExpandedSlot({ roomId, slotIndex: _si, expanded });
      io.to(roomId).emit('panel:layout_update', { roomId, slot });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: 'Panel error' });
    }
  });

  socket.on('panel:toggle_audio_only', async ({ roomId, isAudioOnly }, ack) => {
    try {
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) {
        ack?.({ ok: false, error: 'forbidden' });
        return;
      }
      const room = await panelService.setAudioOnly({ roomId, isAudioOnly });
      io.to(roomId).emit('panel:audio_only_changed', { roomId, isAudioOnly: room.is_audio_only });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: 'Panel error' });
    }
  });

  socket.on('panel:kick', async ({ roomId, targetUserId }, ack) => {
    try {
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) {
        ack?.({ ok: false, error: 'forbidden' });
        return;
      }
      if (!targetUserId || !PANEL_UUID_RE.test(String(targetUserId))) {
        ack?.({ ok: false, error: 'invalid targetUserId' });
        return;
      }
      // Cohosts may not kick the room's host
      if (socket.data.role === 'cohost') {
        const _roomSockets = await io.in(roomId).fetchSockets();
        const _targetSock = _roomSockets.find(function(s) { return s.data && s.data.userId === targetUserId; });
        if (_targetSock && _targetSock.data.role === 'host') {
          ack?.({ ok: false, error: 'forbidden' });
          return;
        }
      }
      await panelService.releaseSlot({ roomId, userId: targetUserId });
      io.to(roomId).emit('panel:slot_released', { roomId, userId: targetUserId });
      const roomSockets = await io.in(roomId).fetchSockets();
      const kickedSocket = roomSockets.find(s => s.data && s.data.userId === targetUserId);
      if (kickedSocket) kickedSocket.emit('panel:kicked', { roomId });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: 'Panel error' });
    }
  });

  socket.on('panel:mute', async ({ roomId, targetUserId, isMuted }) => {
    try {
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) return;
      if (!targetUserId || !PANEL_UUID_RE.test(String(targetUserId))) return;
      await panelService.setMuted({ roomId, userId: targetUserId, isMuted });
      io.to(roomId).emit('panel:slot_muted', { roomId, userId: targetUserId, isMuted });
    } catch (err) {
      console.error('[panelHandlers] panel:mute error:', err);
    }
  });

  socket.on('panel:raise_hand', function(payload) {
    try {
      var roomId = socket.data.roomId;
      var raised  = !!(payload && payload.raised);
      if (!roomId) return;
      var _prNow = Date.now();
      if (_prNow - (panelHandThrottle.get(socket.data.userId) || 0) < 1000) return;
      panelHandThrottle.set(socket.data.userId, _prNow);
      io.to(roomId).emit('panel:hand_update', { roomId: roomId, userId: socket.data.userId, raised: raised });
    } catch (err) {
      console.error('[panelHandlers] panel:raise_hand error:', err);
    }
  });

  socket.on('panel:react', function(payload) {
    try {
      var roomId = socket.data.roomId;
      var emoji  = payload && String(payload.emoji || '').slice(0, 4);
      if (!roomId || !emoji) return;
      var _preNow = Date.now();
      if (_preNow - (panelReactThrottle.get(socket.data.userId) || 0) < 1000) return;
      panelReactThrottle.set(socket.data.userId, _preNow);
      io.to(roomId).emit('panel:reaction', { roomId: roomId, guestId: socket.data.userId, emoji: emoji });
    } catch (err) {
      console.error('[panelHandlers] panel:react error:', err);
    }
  });

  // Throttle entries are intentionally NOT cleared on disconnect — clearing
  // them would allow bypass via rapid reconnect (same userId, new socket.id).
  // Stale entries are pruned by the module-scope setInterval above.
}

module.exports = { registerPanelHandlers };
