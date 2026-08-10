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
  // Return the existing socket regardless of connection state. Socket.IO's
  // built-in reconnection loop handles recovery — creating a second socket
  // while the first is mid-reconnect causes both to connect simultaneously,
  // producing duplicate events and mediasoup transport leaks.
  if (socket) return socket;
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
  // On reconnect, notify App UI. Do NOT re-emit join-room here —
  // Socket.IO fires 'connect' on every connection (initial + reconnect),
  // and App.jsx's 'connect' handler emits join-room there. Emitting here
  // too causes duplicate join-room → 4 mediasoup transports per reconnect.
  socket.on('reconnect', function() {
    if (_onReconnect) _onReconnect();
  });
  // Presence heartbeat — restart on every connect so it survives reconnects.
  // A plain setInterval at getSocket() time is killed by the first disconnect
  // and never restarted, so the server evicts the socket from the presence map.
  var heartbeatInterval = null;
  socket.on('connect', function() {
    clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(function() {
      if (socket && socket.connected) {
        socket.emit('ping-presence');
      }
    }, 30000);
  });
  socket.on('disconnect', function() {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
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
