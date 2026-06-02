import { io } from 'socket.io-client';

// In production, connect through nginx reverse proxy (same origin, port 443).
// In dev, Vite's proxy forwards /socket.io → localhost:3001 automatically.
var SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

var socket = null;
var _rejoinPayload = null;    // stored join-room payload for auto-rejoin on reconnect
var _onReconnect = null;      // optional callback to notify App on reconnect

export function setRejoinPayload(payload) {
  _rejoinPayload = payload;
}

export function onReconnectCallback(fn) {
  _onReconnect = fn;
}

export function getSocket(token) {
  if (socket && socket.connected) return socket;
  socket = io(SOCKET_URL, {
    auth: { token: token || '' },
    transports: ['websocket', 'polling'],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    reconnectionAttempts: Infinity,
    timeout: 20000
  });
  socket.on('connect_error', function(err) {
    console.error('[Socket] Connection error:', err.message);
  });
  socket.on('reconnect', function() {
    // Re-join room automatically after reconnection
    if (_rejoinPayload) {
      socket.emit('join-room', _rejoinPayload);
    }
    if (_onReconnect) _onReconnect();
  });
  // Presence heartbeat — keeps server aware the client is alive
  var heartbeatInterval = setInterval(function() {
    if (socket && socket.connected) {
      socket.emit('ping-presence');
    }
  }, 30000);
  socket.on('disconnect', function() {
    clearInterval(heartbeatInterval);
  });
  return socket;
}

export function destroySocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  _rejoinPayload = null;
  _onReconnect = null;
}

export default { getSocket, destroySocket, setRejoinPayload, onReconnectCallback };
