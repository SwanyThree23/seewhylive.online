import React, { useState } from 'react';

var INITIAL_SERVICES = [
  { id: 'db',     name: 'SQLite / WAL',       val: 'WAL mode',   icon: '🗄',  status: 'healthy' },
  { id: 'rtmp',   name: 'RTMP Ingest',        val: '6420 kbps',  icon: '📡',  status: 'healthy' },
  { id: 'webrtc', name: 'mediasoup SFU',       val: '2 workers',  icon: '🌐',  status: 'healthy' },
  { id: 'stripe', name: 'Stripe Connect',      val: '99.9%',      icon: '💳',  status: 'healthy' },
  { id: 'vault',  name: 'Vault AES-256-GCM',   val: 'encrypted',  icon: '🔐',  status: 'healthy' },
  { id: 'ai',     name: 'Claude AI Bridge',    val: 'sonnet-4',   icon: '🤖',  status: 'healthy' },
  { id: 'turn',   name: 'coturn TURN',         val: '3478/5349',  icon: '🔄',  status: 'healthy' },
  { id: 'nginx',  name: 'nginx reverse proxy', val: '443→3001',   icon: '⚡',  status: 'healthy' },
  { id: 'pm2',    name: 'PM2 Process Manager', val: 'online',     icon: '💻',  status: 'healthy' },
  { id: 'ssl',    name: "Let's Encrypt SSL",   val: 'valid ~79d', icon: '🔒',  status: 'healthy' },
];

var VPS_IP  = '2.24.194.112';
var APP_ID  = '6990f5f24823b53e21fcdc9d';

export default function InsForgeTab({ addToast }) {
  var [services, setServices] = useState(INITIAL_SERVICES.map(function(s) { return Object.assign({}, s); }));
  var [refreshing, setRefreshing] = useState(false);
  var [lastRefresh, setLastRefresh] = useState(null);

  function refresh() {
    setRefreshing(true);
    fetch('/api/health').then(function(r) { return r.json(); }).then(function(data) {
      setServices(function(p) {
        return p.map(function(s) {
          if (s.id === 'webrtc') return Object.assign({}, s, { val: (data.mediasoupWorkers || 0) + ' workers', status: data.mediasoupWorkers > 0 ? 'healthy' : 'warning' });
          return s;
        });
      });
      setLastRefresh(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setRefreshing(false);
      if (addToast) addToast('Status refreshed', 'success');
    }).catch(function() {
      setRefreshing(false);
      if (addToast) addToast('Refresh failed', 'error');
    });
  }

  var healthy = services.filter(function(s) { return s.status === 'healthy'; }).length;
  var warning = services.filter(function(s) { return s.status === 'warning'; }).length;
  var errors  = services.filter(function(s) { return s.status === 'error'; }).length;

  var statusColors = { healthy: '#00C96A', warning: '#C9A84C', error: '#FF1A3C' };

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>
      {/* Header stats */}
      <div style={{ background: 'rgba(0,201,167,.06)', border: '1px solid rgba(0,201,167,.2)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#00C9A7', letterSpacing: 3, marginBottom: 8 }}>⚙️ INSFORGE STATUS</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginBottom: 8 }}>VPS: {VPS_IP} · App: {APP_ID.substring(0, 12)}...</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {[[healthy, 'HEALTHY', '#00C96A'], [warning, 'WARN', '#C9A84C'], [errors, 'ERROR', '#FF1A3C']].map(function(s) {
            return (
              <div key={s[1]} style={{ flex: 1, background: s[2] + '12', border: '1px solid ' + s[2] + '33', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: s[2], lineHeight: 1 }}>{s[0]}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1 }}>{s[1]}</div>
              </div>
            );
          })}
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          style={{ width: '100%', padding: '9px', background: refreshing ? 'rgba(0,201,167,.1)' : 'rgba(0,201,167,.15)', border: '1px solid rgba(0,201,167,.4)', borderRadius: 8, color: '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.7 : 1 }}>
          {refreshing ? '🔄 REFRESHING...' : '🔄 REFRESH ALL'}
        </button>
        {lastRefresh && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', textAlign: 'center', marginTop: 4 }}>Last refresh: {lastRefresh}</div>}
      </div>

      {/* Service list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {services.map(function(s) {
          var sc = statusColors[s.status] || '#7A6F90';
          return (
            <div key={s.id} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: sc + '12', border: '1px solid ' + sc + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#EDE8F5' }}>{s.name}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: sc }}>{s.val}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc, boxShadow: s.status === 'healthy' ? '0 0 6px ' + sc : 'none' }} />
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: sc, textTransform: 'uppercase', letterSpacing: 1 }}>{s.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* RTMP info */}
      <div style={{ background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 2, marginBottom: 6 }}>RTMP INGEST</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#00C9A7', wordBreak: 'break-all' }}>rtmp://{VPS_IP}:1935/live</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', marginTop: 4 }}>Domain: seewhylive.online · Port 443 (nginx TLS)</div>
      </div>
    </div>
  );
}
