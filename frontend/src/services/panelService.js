// frontend/src/services/panelService.js
// Panel seat/join-request feature. No apiClient/socketClient helpers exist
// in this codebase, so socket is passed in by the caller (same instance
// LiveRoomPage already holds), and REST calls use plain fetch + credentials,
// matching rewardsService.js's convention.

var ROOMS_BASE = '/api/rooms';

function joinPanel(socket, roomId, inviteCode) {
  return new Promise(function (resolve, reject) {
    socket.emit('panel:join', { roomId: roomId, inviteCode: inviteCode }, function (res) {
      if (res.ok) { resolve(res.slot); } else { reject(new Error(res.reason || res.error)); }
    });
  });
}

function requestJoin(socket, roomId) {
  return new Promise(function (resolve, reject) {
    socket.emit('panel:request_join', { roomId: roomId }, function (res) {
      if (res.ok) { resolve(res); } else { reject(new Error(res.error)); }
    });
  });
}

function resolveJoinRequest(socket, roomId, userId, approve) {
  return new Promise(function (resolve, reject) {
    socket.emit('panel:resolve_join_request', { roomId: roomId, userId: userId, approve: approve }, function (res) {
      if (res.ok) { resolve(); } else { reject(new Error(res.error)); }
    });
  });
}

function leavePanel(socket, roomId) {
  socket.emit('panel:leave', { roomId: roomId });
}

function expandTile(socket, roomId, slotIndex, expanded) {
  socket.emit('panel:expand', { roomId: roomId, slotIndex: slotIndex, expanded: expanded });
}

function toggleAudioOnly(socket, roomId, isAudioOnly) {
  socket.emit('panel:toggle_audio_only', { roomId: roomId, isAudioOnly: isAudioOnly });
}

function onSlotAssigned(socket, cb) { socket.on('panel:slot_assigned', cb); return function () { socket.off('panel:slot_assigned', cb); }; }
function onSlotReleased(socket, cb) { socket.on('panel:slot_released', cb); return function () { socket.off('panel:slot_released', cb); }; }
function onLayoutUpdate(socket, cb) { socket.on('panel:layout_update', cb); return function () { socket.off('panel:layout_update', cb); }; }
function onAudioOnlyChanged(socket, cb) { socket.on('panel:audio_only_changed', cb); return function () { socket.off('panel:audio_only_changed', cb); }; }
function onJoinRequestReceived(socket, cb) { socket.on('panel:join_request_received', cb); return function () { socket.off('panel:join_request_received', cb); }; }
function onJoinRequestResolved(socket, cb) { socket.on('panel:join_request_resolved', cb); return function () { socket.off('panel:join_request_resolved', cb); }; }

function fetchPanelState(roomId) {
  return fetch(ROOMS_BASE + '/' + roomId + '/panel', { credentials: 'include' })
    .then(function (r) { return r.json(); });
}

function fetchJoinRequests(roomId) {
  return fetch(ROOMS_BASE + '/' + roomId + '/join-requests', { credentials: 'include' })
    .then(function (r) { return r.json(); });
}

function setRoomPrivacy(roomId, isPrivate, gatingMode) {
  return fetch(ROOMS_BASE + '/' + roomId + '/privacy', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPrivate: isPrivate, gatingMode: gatingMode })
  }).then(function (r) { return r.json(); });
}

var panelService = {
  joinPanel: joinPanel,
  requestJoin: requestJoin,
  resolveJoinRequest: resolveJoinRequest,
  leavePanel: leavePanel,
  expandTile: expandTile,
  toggleAudioOnly: toggleAudioOnly,
  onSlotAssigned: onSlotAssigned,
  onSlotReleased: onSlotReleased,
  onLayoutUpdate: onLayoutUpdate,
  onAudioOnlyChanged: onAudioOnlyChanged,
  onJoinRequestReceived: onJoinRequestReceived,
  onJoinRequestResolved: onJoinRequestResolved,
  fetchPanelState: fetchPanelState,
  fetchJoinRequests: fetchJoinRequests,
  setRoomPrivacy: setRoomPrivacy
};

export default panelService;
