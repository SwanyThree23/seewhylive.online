'use strict';
// server/socket/panelHandlers.js
//
// INTEGRATION: call registerPanelHandlers(io, socket) from the same place
// battleHandlers/join-room handlers are registered, inside io.on('connection').

const panelService = require('../services/panelService');
const loyaltyService = require('../services/loyaltyService');

const panelKickedUsers     = new Map(); // roomId -> Set<userId> (cleared when room ends or host approves)
const panelJoinThrottle    = new Map(); // userId -> last join timestamp
const panelRequestThrottle = new Map(); // userId -> last request timestamp
const panelReactThrottle   = new Map(); // userId -> last react timestamp
const panelHandThrottle    = new Map(); // userId -> last hand-raise timestamp
const panelLoyaltyThrottle = new Map(); // `userId:roomId` -> last award timestamp
const panelSpotlight       = new Map(); // roomId -> spotlitUserId (null = cleared)
const panelInviteThrottle  = new Map(); // `hostId:targetId` -> last invite timestamp

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
  panelInviteThrottle.forEach(function(ts, k) { if (now - ts > THROTTLE_STALE_MS) panelInviteThrottle.delete(k); });
  // panelKickedUsers is intentionally not pruned here — entries persist until
  // the host explicitly approves the user or the process restarts.
}, 5 * 60 * 1000).unref();

const PANEL_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function registerPanelHandlers(io, socket, rooms) {
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
      var _kickedSet = panelKickedUsers.get(roomId);
      if (_kickedSet && _kickedSet.has(userId)) {
        ack?.({ ok: false, error: 'you have been removed from this panel' });
        return;
      }
      const gate = await panelService.checkJoinGate({ roomId, userId, inviteCode, tenantId: socket.data.tenantId });
      if (!gate.allowed) {
        ack?.({ ok: false, reason: gate.reason });
        return;
      }
      const { slot, isNew } = await panelService.assignSlot({ roomId, userId, tenantId: socket.data.tenantId });
      socket.join(roomId);
      io.to(roomId).emit('panel:slot_assigned', { roomId, slot });
      if (isNew) {
        var _loyKey = userId + ':' + roomId;
        var _loyNow = Date.now();
        if (_loyNow - (panelLoyaltyThrottle.get(_loyKey) || 0) >= LOYALTY_AWARD_COOLDOWN_MS) {
          panelLoyaltyThrottle.set(_loyKey, _loyNow);
          loyaltyService.awardPoints({ userId, tenantId: socket.data.tenantId, points: 25, source: 'panel_join', sourceId: roomId }).catch(function() {});
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
      const request = await panelService.requestJoin({ roomId, userId, tenantId: socket.data.tenantId });
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
      if (approve === true) {
        var _kSet = panelKickedUsers.get(roomId);
        if (_kSet) _kSet.delete(userId);
      }
      const resolved = await panelService.resolveJoinRequest({ roomId, userId, approve });
      // Emit to personal room so all devices of the requesting user receive the decision
      io.to('user:' + userId).emit('panel:join_request_resolved', { roomId, userId, approve, resolved });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: 'Panel error' });
    }
  });

  socket.on('panel:leave', async (payload, ack) => {
    try {
      const userId = socket.data.userId;
      const roomId = socket.data.roomId;
      if (!userId || userId.startsWith('anon')) { ack?.({ ok: false, error: 'auth required' }); return; }
      if (!roomId) { ack?.({ ok: false, error: 'not in a room' }); return; }
      var released = await panelService.releaseSlot({ roomId, userId });
      if (released > 0) io.to(roomId).emit('panel:slot_released', { roomId, userId });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: 'Panel error' });
    }
  });

  socket.on('disconnect', async function() {
    try {
      var userId = socket.data.userId;
      var roomId = socket.data.roomId;
      if (!userId || userId.startsWith('anon') || !roomId) return;
      var released = await panelService.releaseSlot({ roomId, userId });
      if (released > 0) io.to(roomId).emit('panel:slot_released', { roomId, userId });
    } catch (err) {
      console.error('[panelHandlers] disconnect release error:', err);
    }
  });

  socket.on('panel:expand', async ({ roomId, slotIndex, expanded }, ack) => {
    try {
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) {
        ack?.({ ok: false, error: 'forbidden' });
        return;
      }
      const _si = Math.floor(Number(slotIndex));
      if (!Number.isFinite(_si) || _si < 0 || _si > 19) {
        ack?.({ ok: false, error: 'invalid slotIndex' });
        return;
      }
      const slot = await panelService.setExpandedSlot({ roomId, tenantId: socket.data.tenantId, slotIndex: _si, expanded });
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
      const room = await panelService.setAudioOnly({ roomId, tenantId: socket.data.tenantId, isAudioOnly });
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
      // Cohosts may not kick the room's host or other cohosts.
      if (socket.data.role === 'cohost') {
        var _kickRoomData = rooms && rooms.get(roomId);
        if (_kickRoomData) {
          if (_kickRoomData.hostUserId === targetUserId) {
            ack?.({ ok: false, error: 'forbidden' });
            return;
          }
          // Prevent cohost kicking another cohost
          var _targetIsCohost = false;
          _kickRoomData.guests.forEach(function(g) {
            if (g.guestId === targetUserId && g.role === 'cohost') _targetIsCohost = true;
          });
          if (_targetIsCohost) {
            ack?.({ ok: false, error: 'forbidden' });
            return;
          }
        }
      }
      await panelService.releaseSlot({ roomId, userId: targetUserId });
      var _kickMap = panelKickedUsers.get(roomId);
      if (!_kickMap) { _kickMap = new Set(); panelKickedUsers.set(roomId, _kickMap); }
      _kickMap.add(targetUserId);
      io.to(roomId).emit('panel:slot_released', { roomId, userId: targetUserId });
      // Emit to personal room so kick reaches all devices the target is connected from
      var _room = rooms && rooms.get(roomId);
      var _hasTarget = _room && _room.userSockets && _room.userSockets.has(targetUserId);
      if (_hasTarget) io.to('user:' + targetUserId).emit('panel:kicked', { roomId });
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

  socket.on('panel:remote_camera', async function(payload, ack) {
    try {
      var roomId = payload && payload.roomId;
      var targetUserId = payload && payload.targetUserId;
      var deviceId = payload && payload.deviceId;
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) return;
      if (!targetUserId || !PANEL_UUID_RE.test(String(targetUserId))) return;
      io.to(roomId).emit('panel:camera_command', { roomId: roomId, userId: targetUserId, deviceId: deviceId || null });
      if (ack) ack({ ok: true });
    } catch (err) {
      console.error('[panelHandlers] panel:remote_camera error:', err);
      if (ack) ack({ ok: false });
    }
  });

  socket.on('panel:remote_background', async function(payload, ack) {
    try {
      var roomId = payload && payload.roomId;
      var targetUserId = payload && payload.targetUserId;
      var background = payload && payload.background;
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) return;
      if (!targetUserId || !PANEL_UUID_RE.test(String(targetUserId))) return;
      if (typeof background !== 'string' || background.length > 200) return;
      io.to(roomId).emit('panel:background_command', { roomId: roomId, userId: targetUserId, background: background });
      if (ack) ack({ ok: true });
    } catch (err) {
      console.error('[panelHandlers] panel:remote_background error:', err);
      if (ack) ack({ ok: false });
    }
  });

  socket.on('panel:raise_hand', function(payload) {
    try {
      var userId = socket.data.userId;
      if (!userId || userId.startsWith('anon')) return;
      var roomId = socket.data.roomId;
      var raised  = !!(payload && payload.raised);
      if (!roomId) return;
      var _prNow = Date.now();
      if (_prNow - (panelHandThrottle.get(userId) || 0) < 1000) return;
      panelHandThrottle.set(userId, _prNow);
      io.to(roomId).emit('panel:hand_update', { roomId: roomId, userId: userId, raised: raised });
    } catch (err) {
      console.error('[panelHandlers] panel:raise_hand error:', err);
    }
  });

  socket.on('panel:react', function(payload) {
    try {
      var userId = socket.data.userId;
      if (!userId || userId.startsWith('anon')) return;
      var roomId = socket.data.roomId;
      var emoji  = payload && String(payload.emoji || '').slice(0, 4);
      if (!roomId || !emoji) return;
      var _preNow = Date.now();
      if (_preNow - (panelReactThrottle.get(userId) || 0) < 1000) return;
      panelReactThrottle.set(userId, _preNow);
      io.to(roomId).emit('panel:reaction', { roomId: roomId, guestId: userId, emoji: emoji });
    } catch (err) {
      console.error('[panelHandlers] panel:react error:', err);
    }
  });

  // panel:spotlight — host/cohost pins one guest to the 70% spotlight view for all viewers
  socket.on('panel:spotlight', async function(payload, ack) {
    try {
      var roomId = payload && payload.roomId;
      var targetUserId = payload && payload.targetUserId; // null = clear spotlight
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) {
        if (ack) ack({ ok: false, error: 'forbidden' });
        return;
      }
      if (targetUserId && !PANEL_UUID_RE.test(String(targetUserId))) {
        if (ack) ack({ ok: false, error: 'invalid targetUserId' });
        return;
      }
      var current = panelSpotlight.get(roomId);
      var next = (targetUserId && current !== targetUserId) ? targetUserId : null;
      if (next) panelSpotlight.set(roomId, next);
      else panelSpotlight.delete(roomId);
      io.to(roomId).emit('panel:spotlight_changed', { roomId: roomId, spotlitUserId: next });
      if (ack) ack({ ok: true, spotlitUserId: next });
    } catch (err) {
      if (ack) ack({ ok: false, error: 'Panel error' });
    }
  });

  // panel:swap_slots — host/cohost reorders two guests without kicking
  socket.on('panel:swap_slots', async function(payload, ack) {
    try {
      var roomId = payload && payload.roomId;
      var userA  = payload && payload.userA;
      var userB  = payload && payload.userB;
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) {
        if (ack) ack({ ok: false, error: 'forbidden' });
        return;
      }
      if (!userA || !PANEL_UUID_RE.test(String(userA)) || !userB || !PANEL_UUID_RE.test(String(userB)) || userA === userB) {
        if (ack) ack({ ok: false, error: 'invalid userA or userB' });
        return;
      }
      var newSlots = await panelService.swapSlots({ roomId: roomId, userA: userA, userB: userB });
      io.to(roomId).emit('panel:slots_swapped', { roomId: roomId, slots: newSlots });
      if (ack) ack({ ok: true, slots: newSlots });
    } catch (err) {
      if (ack) ack({ ok: false, error: 'Panel error' });
    }
  });

  // panel:invite — host directly invites a viewer to the panel (they get a popup)
  socket.on('panel:invite', async function(payload, ack) {
    try {
      var roomId = payload && payload.roomId;
      var targetUserId = payload && payload.targetUserId;
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) {
        if (ack) ack({ ok: false, error: 'forbidden' });
        return;
      }
      if (!targetUserId || !PANEL_UUID_RE.test(String(targetUserId))) {
        if (ack) ack({ ok: false, error: 'invalid targetUserId' });
        return;
      }
      var _piKey = socket.data.userId + ':' + targetUserId;
      var _piNow = Date.now();
      if (_piNow - (panelInviteThrottle.get(_piKey) || 0) < 5000) {
        if (ack) ack({ ok: false, error: 'too many invites' });
        return;
      }
      panelInviteThrottle.set(_piKey, _piNow);
      // Check presence via userSockets map (populated by join-room) so the
      // invite reaches ALL of the target user's devices, not just the first one.
      var _piRoom = rooms && rooms.get(roomId);
      if (!_piRoom || !_piRoom.userSockets || !_piRoom.userSockets.has(targetUserId)) {
        if (ack) ack({ ok: false, error: 'user not in room' });
        return;
      }
      io.to('user:' + targetUserId).emit('panel:invite_received', {
        roomId: roomId,
        fromUserId: socket.data.userId,
        fromUsername: socket.data.username || null,
      });
      if (ack) ack({ ok: true });
    } catch (err) {
      if (ack) ack({ ok: false, error: 'Panel error' });
    }
  });

  // Throttle entries are intentionally NOT cleared on disconnect — clearing
  // them would allow bypass via rapid reconnect (same userId, new socket.id).
  // Stale entries are pruned by the module-scope setInterval above.
}

module.exports = { registerPanelHandlers };
