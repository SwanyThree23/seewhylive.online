// server/socket/panelHandlers.js
//
// INTEGRATION: call registerPanelHandlers(io, socket) from the same place
// battleHandlers/join-room handlers are registered, inside io.on('connection').

const panelService = require('../services/panelService');
const loyaltyService = require('../services/loyaltyService');

function registerPanelHandlers(io, socket) {
  socket.on('panel:join', async ({ roomId, inviteCode }, ack) => {
    try {
      const userId = socket.data.userId;
      const gate = await panelService.checkJoinGate({ roomId, userId, inviteCode });
      if (!gate.allowed) {
        ack?.({ ok: false, reason: gate.reason });
        return;
      }
      const slot = await panelService.assignSlot({ roomId, userId });
      socket.join(roomId);
      io.to(roomId).emit('panel:slot_assigned', { roomId, slot });
      loyaltyService.awardPoints({ userId, points: 25, source: 'panel_join', sourceId: roomId }).catch(() => {});
      ack?.({ ok: true, slot });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('panel:request_join', async ({ roomId }, ack) => {
    try {
      const userId = socket.data.userId;
      const request = await panelService.requestJoin({ roomId, userId });
      io.to(roomId).emit('panel:join_request_received', {
        roomId,
        userId,
        requestId: request.id,
        displayName: request.display_name || null,
        avatarUrl: request.avatar_url || null,
      });
      ack?.({ ok: true, status: 'pending' });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('panel:resolve_join_request', async ({ roomId, userId, approve }, ack) => {
    try {
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) {
        ack?.({ ok: false, error: 'forbidden' });
        return;
      }
      const resolved = await panelService.resolveJoinRequest({ roomId, userId, approve });
      // Broadcast to room — requesting client filters by its own userId
      io.to(roomId).emit('panel:join_request_resolved', { roomId, userId, approve, resolved });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('panel:leave', async ({ roomId }, ack) => {
    try {
      const userId = socket.data.userId;
      await panelService.releaseSlot({ roomId, userId });
      socket.leave(roomId);
      io.to(roomId).emit('panel:slot_released', { roomId, userId });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('panel:expand', async ({ roomId, slotIndex, expanded }, ack) => {
    try {
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) {
        ack?.({ ok: false, error: 'forbidden' });
        return;
      }
      const slot = await panelService.setExpandedSlot({ roomId, slotIndex, expanded });
      io.to(roomId).emit('panel:layout_update', { roomId, slot });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
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
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('panel:kick', async ({ roomId, targetUserId }, ack) => {
    try {
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) {
        ack?.({ ok: false, error: 'forbidden' });
        return;
      }
      await panelService.releaseSlot({ roomId, userId: targetUserId });
      io.to(roomId).emit('panel:slot_released', { roomId, userId: targetUserId });
      // Notify the kicked user's socket directly if possible
      const kickedSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.data && s.data.userId === targetUserId);
      if (kickedSocket) kickedSocket.emit('panel:kicked', { roomId });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('panel:mute', async ({ roomId, targetUserId, isMuted }) => {
    try {
      if ((socket.data.role !== 'host' && socket.data.role !== 'cohost') || socket.data.roomId !== roomId) return;
      await panelService.setMuted({ roomId, userId: targetUserId, isMuted });
      io.to(roomId).emit('panel:slot_muted', { roomId, userId: targetUserId, isMuted });
    } catch (err) {
      console.error('[panelHandlers] panel:mute error:', err);
    }
  });

  socket.on('panel:raise_hand', function(payload) {
    try {
      var roomId = payload && payload.roomId;
      var raised  = !!(payload && payload.raised);
      if (!roomId) return;
      io.to(roomId).emit('panel:hand_update', { roomId: roomId, userId: socket.data.userId, raised: raised });
    } catch (err) {
      console.error('[panelHandlers] panel:raise_hand error:', err);
    }
  });

  socket.on('panel:react', function(payload) {
    try {
      var roomId = payload && payload.roomId;
      var emoji  = payload && payload.emoji;
      if (!roomId || !emoji) return;
      io.to(roomId).emit('panel:reaction', { roomId: roomId, guestId: socket.data.userId, emoji: emoji });
    } catch (err) {
      console.error('[panelHandlers] panel:react error:', err);
    }
  });
}

module.exports = { registerPanelHandlers };
