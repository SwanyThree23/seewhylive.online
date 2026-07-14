// server/socket/panelHandlers.js
//
// INTEGRATION: call registerPanelHandlers(io, socket) from the same place
// battleHandlers/join-room handlers are registered, inside io.on('connection').

const panelService = require('../services/panelService');

function registerPanelHandlers(io, socket) {
  socket.on('panel:join', async ({ roomId, inviteCode }, ack) => {
    try {
      const gate = await panelService.checkJoinGate({ roomId, userId: socket.user.id, inviteCode });
      if (!gate.allowed) {
        ack?.({ ok: false, reason: gate.reason });
        return;
      }
      const slot = await panelService.assignSlot({ roomId, userId: socket.user.id });
      socket.join(`room:${roomId}`);
      io.to(`room:${roomId}`).emit('panel:slot_assigned', { roomId, slot });
      ack?.({ ok: true, slot });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('panel:request_join', async ({ roomId }, ack) => {
    try {
      const request = await panelService.requestJoin({ roomId, userId: socket.user.id });
      // Notify host — assumes host is in a room-scoped "host:<roomId>" room;
      // adjust to however your existing host-notification channel works.
      io.to(`host:${roomId}`).emit('panel:join_request_received', {
        roomId, userId: socket.user.id, requestId: request.id,
      });
      ack?.({ ok: true, status: 'pending' });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('panel:resolve_join_request', async ({ roomId, userId, approve }, ack) => {
    try {
      // INTEGRATION: verify socket.user.id is the room's host before allowing this.
      const resolved = await panelService.resolveJoinRequest({ roomId, userId, approve });
      io.to(userId).emit('panel:join_request_resolved', { roomId, approve, resolved });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('panel:leave', async ({ roomId }, ack) => {
    try {
      await panelService.releaseSlot({ roomId, userId: socket.user.id });
      socket.leave(`room:${roomId}`);
      io.to(`room:${roomId}`).emit('panel:slot_released', { roomId, userId: socket.user.id });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('panel:expand', async ({ roomId, slotIndex, expanded }, ack) => {
    try {
      const slot = await panelService.setExpandedSlot({ roomId, slotIndex, expanded });
      io.to(`room:${roomId}`).emit('panel:layout_update', { roomId, slot });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('panel:toggle_audio_only', async ({ roomId, isAudioOnly }, ack) => {
    try {
      // INTEGRATION: verify socket.user.id is the room's host before allowing this.
      const room = await panelService.setAudioOnly({ roomId, isAudioOnly });
      io.to(`room:${roomId}`).emit('panel:audio_only_changed', { roomId, isAudioOnly: room.is_audio_only });
      // NOTE: this only persists/broadcasts the mode. The actual bandwidth
      // savings happen client-side in the producer — see AudioOnlyToggle.jsx
      // for the mediasoup-client producer.pause()/close() call.
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });
  socket.on('panel:react', function (payload) {
    try {
      var roomId = payload && payload.roomId;
      var guestId = payload && payload.guestId;
      var emoji = payload && payload.emoji;
      if (!roomId || !guestId || !emoji) return;
      io.to('room:' + roomId).emit('panel:reaction', { roomId: roomId, guestId: guestId, emoji: emoji });
    } catch (err) {
      console.error('[panelHandlers] panel:react error:', err);
    }
  });

}

module.exports = { registerPanelHandlers };
