import { useState, useEffect } from 'react';

var BG    = '#0E0C09';
var SURF  = '#1A1510';
var CARD  = '#241C12';
var GOLD  = '#C9A84C';
var TEXT  = '#F0E8D4';
var MUTED = '#8A7A62';
var BORDER = 'rgba(201,168,76,.12)';
var GREEN = '#22c55e';
var RED   = '#FF1A3C';
var AMBER = '#f59e0b';

function StatusDot({ status }) {
  var color = status === 'ok' ? GREEN : status === 'warn' ? AMBER : RED;
  return (
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
  );
}

export default function PlatformHealthTab({ socket, addToast }) {
  var [health, setHealth] = useState({
    server: 'ok',
    mediasoup: 'ok',
    database: 'ok',
    rtmp: 'ok',
    cdn: 'ok',
  });
  var [lastCheck, setLastCheck] = useState(null);
  var [checking, setChecking] = useState(false);

  useEffect(function() {
    if (!socket) return;
    function onHealthUpdate(data) {
      if (!data) return;
      setHealth(function(prev) { return Object.assign({}, prev, data); });
      setLastCheck(Date.now());
    }
    socket.on('platform-health', onHealthUpdate);
    return function() { socket.off('platform-health', onHealthUpdate); };
  }, [socket]);

  function runCheck() {
    setChecking(true);
    if (socket) socket.emit('platform-health-check', {});
    fetch('/health', { credentials: 'include' })
      .then(function(r) { return r.ok ? 'ok' : 'error'; })
      .catch(function() { return 'error'; })
      .then(function(status) {
        setHealth(function(prev) { return Object.assign({}, prev, { server: status }); });
        setLastCheck(Date.now());
        setChecking(false);
      });
  }

  var services = [
    { key: 'server',     label: 'API Server',     icon: '🖥' },
    { key: 'mediasoup',  label: 'WebRTC (SFU)',    icon: '📡' },
    { key: 'database',   label: 'Database',        icon: '🗄' },
    { key: 'rtmp',       label: 'RTMP Ingest',     icon: '🎙' },
    { key: 'cdn',        label: 'CDN / Delivery',  icon: '🌐' },
  ];

  var allOk = Object.values(health).every(function(s) { return s === 'ok'; });

  return (
    <div style={{ background: BG, minHeight: '100%', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: GOLD, letterSpacing: 2, marginBottom: 4 }}>
            PLATFORM HEALTH
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1.5 }}>
            {allOk ? '✓ All systems operational' : '⚠ Degraded service detected'}
          </div>
        </div>
        <button
          onClick={runCheck}
          disabled={checking}
          style={{
            background: 'transparent', border: '1px solid ' + GOLD,
            borderRadius: 8, padding: '6px 14px',
            color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 9,
            cursor: checking ? 'not-allowed' : 'pointer',
            opacity: checking ? 0.6 : 1, letterSpacing: 1,
          }}
        >
          {checking ? 'CHECKING...' : 'REFRESH'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {services.map(function(svc) {
          var status = health[svc.key] || 'ok';
          return (
            <div key={svc.key} style={{ background: SURF, borderRadius: 10, padding: '12px 14px', border: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{svc.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: TEXT }}>
                  {svc.label}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 1, letterSpacing: .5, textTransform: 'uppercase' }}>
                  {status === 'ok' ? 'Operational' : status === 'warn' ? 'Degraded' : 'Down'}
                </div>
              </div>
              <StatusDot status={status} />
            </div>
          );
        })}
      </div>

      {lastCheck && (
        <div style={{ marginTop: 16, textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>
          Last checked {Math.floor((Date.now() - lastCheck) / 1000)}s ago
        </div>
      )}
    </div>
  );
}
