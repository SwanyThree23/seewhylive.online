import { io } from 'socket.io-client';

var SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://srv1581658.hstgr.cloud:3001';

var socket = null;

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
  return socket;
}

export function destroySocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default { getSocket, destroySocket };
