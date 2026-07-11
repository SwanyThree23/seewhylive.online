// frontend/src/services/panelService.js
import { apiFetch } from './apiClient';
import { socket } from './socketClient';

export function joinPanel({ roomId, inviteCode }) {
  return new Promise((resolve, reject) => {
    socket.emit('panel:join', { roomId, inviteCode }, (res) =>
      res.ok ? resolve(res.slot) : reject(Object.assign(new Error(res.error || res.reason), { reason: res.reason }))
    );
  });
}

export function requestJoin(roomId) {
  return new Promise((resolve, reject) => {
    socket.emit('panel:request_join', { roomId }, (res) => (res.ok ? resolve(res) : reject(new Error(res.error))));
  });
}

export function resolveJoinRequest({ roomId, userId, approve }) {
  return new Promise((resolve, reject) => {
    socket.emit('panel:resolve_join_request', { roomId, userId, approve }, (res) =>
      res.ok ? resolve() : reject(new Error(res.error))
    );
  });
}

export function leavePanel(roomId) {
  socket.emit('panel:leave', { roomId });
}

export function expandTile({ roomId, slotIndex, expanded }) {
  socket.emit('panel:expand', { roomId, slotIndex, expanded });
}

export function toggleAudioOnly({ roomId, isAudioOnly }) {
  socket.emit('panel:toggle_audio_only', { roomId, isAudioOnly });
}

export function onSlotAssigned(cb) { socket.on('panel:slot_assigned', cb); return () => socket.off('panel:slot_assigned', cb); }
export function onSlotReleased(cb) { socket.on('panel:slot_released', cb); return () => socket.off('panel:slot_released', cb); }
export function onLayoutUpdate(cb) { socket.on('panel:layout_update', cb); return () => socket.off('panel:layout_update', cb); }
export function onAudioOnlyChanged(cb) { socket.on('panel:audio_only_changed', cb); return () => socket.off('panel:audio_only_changed', cb); }
export function onJoinRequestReceived(cb) { socket.on('panel:join_request_received', cb); return () => socket.off('panel:join_request_received', cb); }
export function onJoinRequestResolved(cb) { socket.on('panel:join_request_resolved', cb); return () => socket.off('panel:join_request_resolved', cb); }

export function fetchPanelState(roomId) {
  return apiFetch(`/api/rooms/${roomId}/panel`);
}

export function fetchJoinRequests(roomId) {
  return apiFetch(`/api/rooms/${roomId}/join-requests`);
}

export function setRoomPrivacy({ roomId, isPrivate, gatingMode }) {
  return apiFetch(`/api/rooms/${roomId}/privacy`, {
    method: 'POST',
    body: JSON.stringify({ isPrivate, gatingMode }),
  });
}
