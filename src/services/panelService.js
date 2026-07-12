/**
 * panelService — Panel Seat Approval & WebSocket integration
 * Manages join requests, seat allocation, tile expansion, and audio-only mode
 * for the SeeWhy LIVE panel / stage system.
 */

const BASE = '/api/panel';

// ── REST helpers ──────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`panelService ${path}: ${res.status}`);
  return res.json().catch(() => null);
}

// ── WebSocket panel events ────────────────────────────────────────────────────

var _ws = null;
var _handlers = {};

function connect(roomId) {
  if (_ws && _ws.readyState < 2) return;
  const url = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/panel/${roomId}`;
  _ws = new WebSocket(url);
  _ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      (_handlers[msg.type] || []).forEach(fn => fn(msg.payload));
    } catch {}
  };
  _ws.onclose = () => { setTimeout(() => connect(roomId), 3000); };
}

function disconnect() {
  if (_ws) { _ws.close(); _ws = null; }
}

function on(event, handler) {
  if (!_handlers[event]) _handlers[event] = [];
  _handlers[event].push(handler);
  return () => { _handlers[event] = _handlers[event].filter(fn => fn !== handler); };
}

function send(type, payload = {}) {
  if (_ws && _ws.readyState === 1) {
    _ws.send(JSON.stringify({ type, payload }));
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function joinPanel(roomId, userId) {
  connect(roomId);
  send('panel:join', { roomId, userId });
}

export function requestJoin(roomId, userId, displayName) {
  send('panel:request', { roomId, userId, displayName });
  return apiFetch('/request', {
    method: 'POST',
    body: JSON.stringify({ roomId, userId, displayName }),
  });
}

export function resolveJoinRequest(roomId, requestId, approved, hostId) {
  send('panel:resolve', { roomId, requestId, approved, hostId });
  return apiFetch('/resolve', {
    method: 'POST',
    body: JSON.stringify({ roomId, requestId, approved, hostId }),
  });
}

export function leavePanel(roomId, userId) {
  send('panel:leave', { roomId, userId });
  disconnect();
}

export function expandTile(userId, expanded) {
  send('panel:expand', { userId, expanded });
}

export function toggleAudioOnly(userId, audioOnly) {
  send('panel:audio-only', { userId, audioOnly });
}

export function onJoinRequest(handler) { return on('join_request', handler); }
export function onRequestResolved(handler) { return on('request_resolved', handler); }
export function onPanelUpdate(handler) { return on('panel_update', handler); }
export function onPeerJoined(handler) { return on('peer_joined', handler); }
export function onPeerLeft(handler) { return on('peer_left', handler); }
