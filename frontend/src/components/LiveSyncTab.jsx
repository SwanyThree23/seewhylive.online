import { useState, useEffect } from 'react';

var BG    = '#0E0C09';
var SURF  = '#1A1510';
var CARD  = '#241C12';
var GOLD  = '#C9A84C';
var TEXT  = '#F0E8D4';
var MUTED = '#8A7A62';
var BORDER = 'rgba(201,168,76,.12)';

export default function LiveSyncTab({ socket, roomId, isLive, addToast }) {
  var [syncEnabled, setSyncEnabled] = useState(false);
  var [syncDelay,   setSyncDelay]   = useState(0);
  var [viewers,     setViewers]     = useState(0);

  useEffect(function() {
    if (!socket) return;
    function onSyncState(data) {
      if (!data || data.roomId !== roomId) return;
      setSyncEnabled(Boolean(data.enabled));
      setSyncDelay(data.delayMs || 0);
      setViewers(data.viewerCount || 0);
    }
    socket.on('livesync-state', onSyncState);
    return function() { socket.off('livesync-state', onSyncState); };
  }, [socket, roomId]);

  function toggleSync() {
    var next = !syncEnabled;
    setSyncEnabled(next);
    if (socket) socket.emit('livesync-toggle', { roomId: roomId, enabled: next });
    if (addToast) addToast(next ? '🔗 Live Sync enabled' : 'Live Sync off', next ? 'success' : 'info');
  }

  return (
    <div style={{ background: BG, minHeight: '100%', padding: 16 }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: GOLD, letterSpacing: 2, marginBottom: 4 }}>
        LIVE SYNC
      </div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1.5, marginBottom: 20 }}>
        Synchronize playback across all viewers
      </div>

      <div style={{ background: SURF, borderRadius: 12, padding: 16, border: '1px solid ' + BORDER, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT }}>
              Sync Mode
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 2 }}>
              {syncEnabled ? 'All viewers locked to host timestamp' : 'Viewers playing independently'}
            </div>
          </div>
          <button
            onClick={toggleSync}
            disabled={!isLive}
            style={{
              background: syncEnabled ? GOLD : 'rgba(255,255,255,.08)',
              border: '1px solid ' + (syncEnabled ? GOLD : BORDER),
              borderRadius: 8, padding: '6px 16px',
              color: syncEnabled ? BG : MUTED,
              fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: isLive ? 'pointer' : 'not-allowed',
              letterSpacing: 1, opacity: isLive ? 1 : 0.5,
            }}
          >
            {syncEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        {syncEnabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED }}>
              Sync delay: <span style={{ color: GOLD }}>{syncDelay}ms</span>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED }}>
              ·
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED }}>
              Synced viewers: <span style={{ color: GOLD }}>{viewers}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: SURF, borderRadius: 12, padding: 16, border: '1px solid ' + BORDER }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 8 }}>
          Delay Buffer
        </div>
        <input
          type="range" min="0" max="10000" step="500"
          value={syncDelay}
          onChange={function(e) {
            var ms = Number(e.target.value);
            setSyncDelay(ms);
            if (socket && syncEnabled) socket.emit('livesync-toggle', { roomId: roomId, enabled: true, delayMs: ms });
          }}
          style={{ width: '100%', accentColor: GOLD }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 4 }}>
          <span>0ms</span>
          <span style={{ color: GOLD }}>{syncDelay}ms</span>
          <span>10s</span>
        </div>
      </div>

      {!isLive && (
        <div style={{ marginTop: 16, textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED }}>
          Go live to enable sync controls
        </div>
      )}
    </div>
  );
}
