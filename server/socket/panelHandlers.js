// server/socket/panelHandlers.js
//
// INTEGRATION: call registerPanelHandlers(io, socket) from the same place
// battleHandlers/join-room handlers are registered, inside io.on('connection').

const panelService = require('../services/panelService');

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
      ack?.({ ok: true, slot });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('panel:request_join', async ({ roomId }, ack) => {
    try {
      const userId = socket.data.userId;
      const request = await panelService.requestJoin({ roomId, userId });
      io.to(roomId).emit('panel:join_request_received', { roomId, userId, requestId: request.id });
      ack?.({ ok: true, status: 'pending' });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('panel:resolve_join_request', async ({ roomId, userId, approve }, ack) => {
    try {
      if (socket.data.role !== 'host' && socket.data.role !== 'cohost') {
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
      const slot = await panelService.setExpandedSlot({ roomId, slotIndex, expanded });
      io.to(roomId).emit('panel:layout_update', { roomId, slot });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('panel:toggle_audio_only', async ({ roomId, isAudioOnly }, ack) => {
    try {
      if (socket.data.role !== 'host' && socket.data.role !== 'cohost') {
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
      if (socket.data.role !== 'host' && socket.data.role !== 'cohost') {
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
      if (socket.data.role !== 'host' && socket.data.role !== 'cohost') return;
      await panelService.setMuted({ roomId, userId: targetUserId, isMuted });
      io.to(roomId).emit('panel:slot_muted', { roomId, userId: targetUserId, isMuted });
    } catch (err) {
      console.error('[panelHandlers] panel:mute error:', err);
    }
  });

  socket.on('panel:react', function(payload) {
    try {
      var roomId  = payload && payload.roomId;
      var guestId = payload && payload.guestId;
      var emoji   = payload && payload.emoji;
      if (!roomId || !guestId || !emoji) return;
      io.to(roomId).emit('panel:reaction', { roomId: roomId, guestId: guestId, emoji: emoji });
    } catch (err) {
      console.error('[panelHandlers] panel:react error:', err);
    }
  });
}

module.exports = { registerPanelHandlers };
