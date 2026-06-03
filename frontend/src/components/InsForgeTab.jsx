import React, { useState, useEffect, useRef } from 'react';

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
var AUTO_REFRESH_SEC = 30;

var MOCK_LOGS = [
  { ts: Date.now() - 4000,   level: 'INFO',  msg: 'Room seewhy-001 created — 3 guests joined' },
  { ts: Date.now() - 12000,  level: 'INFO',  msg: 'RTMP stream connected: 720p@30fps 6420 kbps' },
  { ts: Date.now() - 28000,  level: 'INFO',  msg: 'Gift received: Rose ×3 ($3.00) from CaliBonesOG' },
  { ts: Date.now() - 45000,  level: 'WARN',  msg: 'mediasoup worker CPU >80%, spawning backup' },
  { ts: Date.now() - 72000,  level: 'INFO',  msg: "SwanyBot triggered: !hype → 🔥 LET'S GO!" },
  { ts: Date.now() - 90000,  level: 'INFO',  msg: 'WebRTC ICE established via TURN relay' },
  { ts: Date.now() - 130000, level: 'INFO',  msg: 'Analytics snapshot saved (60-min window)' },
  { ts: Date.now() - 180000, level: 'ERROR', msg: 'Stripe webhook retry 1/3 for evt_1234abc' },
  { ts: Date.now() - 240000, level: 'INFO',  msg: 'SSL certificate checked: 79 days remaining' },
  { ts: Date.now() - 360000, level: 'INFO',  msg: 'PM2 heartbeat OK — uptime 7d 14h 22m' },
];

var SYSTEM_STATS = [
  { label: 'CPU USAGE',  val: '18%',     bar: 18,  color: '#C9A84C' },
  { label: 'MEMORY',     val: '19.4 MB', bar: 22,  color: '#C9A84C' },
  { label: 'DISK USED',  val: '12%',     bar: 12,  color: '#C9A84C' },
  { label: 'NETWORK RX', val: '1.2 MB/s',bar: 35,  color: '#C9A84C' },
  { label: 'UPTIME',     val: '7d 14h',  bar: 100, color: '#C9A84C' },
];

var PORT_MAP = [
  ['443',   'HTTPS/WSS nginx'],
  ['3001',  'Express/Socket.io'],
  ['1935',  'RTMP Ingest'],
  ['3478',  'coturn STUN/TURN'],
  ['5349',  'coturn TLS'],
  ['10000+','mediasoup RTP/UDP'],
];

var VPS_INFO = [
  ['IP ADDRESS', VPS_IP],
  ['DOMAIN',     'seewhylive.online'],
  ['STACK',      'Node 20 · Express · Socket.io · mediasoup'],
  ['DATABASE',   'better-sqlite3 WAL · /opt/seewhy/data/seewhy.db'],
  ['VAULT',      'AES-256-GCM · server-side decrypt only'],
  ['PM2 NAME',   'seewhylive-backend · id 0'],
];

function fmtTs(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtUptime(sec) {
  var h = Math.floor(sec / 3600);
  var m = Math.floor((sec % 3600) / 60);
  var s = sec % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

var LIVE_LOG_POOL = [
  { level: 'INFO',  msg: 'WebRTC ICE candidate pair selected via TURN relay' },
  { level: 'INFO',  msg: 'Gift event: Crown ×1 ($10.00) from SwanyFan99' },
  { level: 'INFO',  msg: 'RTMP keyframe received — stream healthy' },
  { level: 'WARN',  msg: 'mediasoup worker CPU 78% — monitoring' },
  { level: 'INFO',  msg: 'Chat message flood detected — SwanyBot throttled' },
  { level: 'INFO',  msg: 'New viewer joined room 6990f5f2 (total: 314)' },
  { level: 'INFO',  msg: 'Schedule event "Friday Night Dominos" started' },
  { level: 'INFO',  msg: 'PM2 heartbeat OK' },
  { level: 'ERROR', msg: 'Stripe webhook signature mismatch on retry 2/3' },
  { level: 'INFO',  msg: 'DB WAL checkpoint completed — 1,204 pages flushed' },
  { level: 'INFO',  msg: 'SSL cert check: 79 days remaining' },
  { level: 'WARN',  msg: 'coturn session limit 80% — 16/20 slots used' },
];

var RTMP_BITRATES = ['6140 kbps', '6380 kbps', '6520 kbps', '6290 kbps'];
var WEBRTC_WORKERS = ['2 workers', '3 workers'];

export default function InsForgeTab({ addToast, isLive }) {
  var [services,    setServices]    = useState(INITIAL_SERVICES.map(function(s) { return Object.assign({}, s); }));
  var [refreshing,  setRefreshing]  = useState(false);
  var [lastRefresh, setLastRefresh] = useState(null);
  var [tab,         setTab]         = useState('status');
  var [countdown,   setCountdown]   = useState(AUTO_REFRESH_SEC);
  var [liveLogs,    setLiveLogs]    = useState(MOCK_LOGS.map(function(l) { return Object.assign({}, l); }));
  var [actionLog,   setActionLog]   = useState([]);
  var [running,     setRunning]     = useState(null);
  var [uptimeSec,   setUptimeSec]   = useState(0);

  var refreshRef   = useRef(null);
  var rtmpIdx      = useRef(0);
  var prevStatusRef = useRef({});

  // Service health transition alerts
  useEffect(function() {
    var prev = prevStatusRef.current;
    services.forEach(function(s) {
      var wasOk = prev[s.id] !== 'error';
      var isErr = s.status === 'error';
      if (wasOk && isErr && addToast) {
        addToast('FORGE: ' + s.name + ' transitioned to ERROR', 'error');
      }
    });
    var next = {};
    services.forEach(function(s) { next[s.id] = s.status; });
    prevStatusRef.current = next;
  }, [services]);

  // Live log ticker (always running)
  useEffect(function() {
    var id = setInterval(function() {
      var pick = LIVE_LOG_POOL[Math.floor(Math.random() * LIVE_LOG_POOL.length)];
      setLiveLogs(function(prev) {
        return [Object.assign({}, pick, { ts: Date.now() })].concat(prev.slice(0, 49));
      });
    }, 4000);
    return function() { clearInterval(id); };
  }, []);

  // Live service metric simulation
  useEffect(function() {
    if (!isLive) {
      setUptimeSec(0);
      return;
    }

    // Uptime counter — 1-second tick
    var uptimeId = setInterval(function() {
      setUptimeSec(function(prev) { return prev + 1; });
    }, 1000);

    // Service metric updates — 8-second tick
    var metricsId = setInterval(function() {
      rtmpIdx.current = (rtmpIdx.current + 1) % RTMP_BITRATES.length;
      var nextBitrate = RTMP_BITRATES[rtmpIdx.current];
      var nextWorkers = WEBRTC_WORKERS[Math.floor(Math.random() * WEBRTC_WORKERS.length)];

      // Occasionally jitter one non-stable service to warn then back
      var jitterTarget = null;
      if (Math.random() < 0.25) {
        var jitterPool = ['rtmp', 'webrtc', 'turn', 'nginx'];
        jitterTarget = jitterPool[Math.floor(Math.random() * jitterPool.length)];
      }

      setServices(function(prev) {
        return prev.map(function(s) {
          // DB and Vault always stay stable
          if (s.id === 'db' || s.id === 'vault') return s;

          if (s.id === 'rtmp') {
            return Object.assign({}, s, {
              val: nextBitrate,
              status: jitterTarget === 'rtmp' ? 'warn' : 'healthy',
            });
          }
          if (s.id === 'webrtc') {
            return Object.assign({}, s, {
              val: nextWorkers,
              status: jitterTarget === 'webrtc' ? 'warn' : 'healthy',
            });
          }
          if (jitterTarget === s.id) {
            return Object.assign({}, s, { status: 'warn' });
          }
          // Restore any previously-jittered service back to healthy
          if (s.status === 'warn') {
            return Object.assign({}, s, { status: 'healthy' });
          }
          return s;
        });
      });
    }, 8000);

    return function() {
      clearInterval(uptimeId);
      clearInterval(metricsId);
      // Restore services to healthy on live end
      setServices(INITIAL_SERVICES.map(function(s) { return Object.assign({}, s); }));
    };
  }, [isLive]);

  function runAction(action) {
    if (running) return;
    setRunning(action.id);
    var entry = { ts: Date.now(), label: action.label, status: 'running', output: '' };
    setActionLog(function(prev) { return [entry].concat(prev.slice(0, 19)); });
    setTimeout(function() {
      var outputs = {
        pm2restart:  '✓ seewhylive-backend restarted (pid 0) [online]',
        pm2logs:     '✓ Fetched 50 lines from PM2 log buffer',
        nginxtest:   '✓ nginx: the configuration file syntax is ok',
        nginxreload:  '✓ nginx -s reload sent (workers gracefully cycled)',
        diskcheck:   '✓ /opt/seewhy: 12% used (2.1G / 18G)',
        memcheck:    '✓ Mem: 19.4MB / 1.5GB used',
        dbbackup:    '✓ seewhy.db → seewhy.db.bak (2.1 MB copied)',
        sslcheck:    '✓ seewhylive.online — valid 79 days remaining',
      };
      var out = outputs[action.id] || '✓ Done';
      setActionLog(function(prev) {
        if (prev.length === 0) return prev;
        var updated = prev.map(function(e, i) {
          if (i === 0) return Object.assign({}, e, { status: 'done', output: out });
          return e;
        });
        return updated;
      });
      setRunning(null);
      if (addToast) addToast(action.label + ' complete', 'success');
    }, 1200 + Math.floor(Math.random() * 800));
  }

  function doRefresh() {
    setRefreshing(true);
    fetch('/api/health')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        setServices(function(prev) {
          return prev.map(function(s) {
            if (s.id === 'webrtc') return Object.assign({}, s, {
              val:    (data.mediasoupWorkers || 0) + ' workers',
              status: data.mediasoupWorkers > 0 ? 'healthy' : 'warning',
            });
            if (s.id === 'db') return Object.assign({}, s, { status: data.db ? 'healthy' : 'error' });
            if (s.id === 'rtmp') return Object.assign({}, s, {
              val: data.rtmpBitrate ? data.rtmpBitrate + ' kbps' : s.val,
            });
            return s;
          });
        });
        setLastRefresh(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setRefreshing(false);
        if (addToast) addToast('Status refreshed', 'success');
      })
      .catch(function() {
        setRefreshing(false);
        if (addToast) addToast('Refresh failed', 'error');
      });
  }

  refreshRef.current = doRefresh;

  useEffect(function() {
    refreshRef.current();
    var count = AUTO_REFRESH_SEC;
    var timer = setInterval(function() {
      count--;
      setCountdown(count);
      if (count <= 0) {
        count = AUTO_REFRESH_SEC;
        setCountdown(AUTO_REFRESH_SEC);
        refreshRef.current();
      }
    }, 1000);
    return function() { clearInterval(timer); };
  }, []);

  var healthy = services.filter(function(s) { return s.status === 'healthy'; }).length;
  var warning = services.filter(function(s) { return s.status === 'warning' || s.status === 'warn'; }).length;
  var errors  = services.filter(function(s) { return s.status === 'error'; }).length;

  var statusColors = { healthy: '#C9A84C', warning: '#C9A84C', warn: '#C9A84C', error: '#FF1A3C' };
  var levelColors  = { INFO: '#C9A84C',    WARN: '#C9A84C',    ERROR: '#FF1A3C' };

  var ITABS = [['status', '⚙ STATUS'], ['logs', '📋 LOGS'], ['system', '💻 SYSTEM'], ['actions', '⚡ ACTIONS']];

  var VPS_ACTIONS = [
    { id: 'pm2restart',  label: 'RESTART PM2',     icon: '🔄', cmd: 'pm2 restart seewhylive-backend',  color: '#C9A84C' },
    { id: 'pm2logs',     label: 'TAIL PM2 LOGS',   icon: '📋', cmd: 'pm2 logs --lines 50',              color: '#C9A84C' },
    { id: 'nginxtest',   label: 'TEST NGINX CFG',  icon: '⚡', cmd: 'nginx -t',                         color: '#C9A84C' },
    { id: 'nginxreload', label: 'RELOAD NGINX',    icon: '🔃', cmd: 'nginx -s reload',                  color: '#C9A84C' },
    { id: 'diskcheck',   label: 'DISK USAGE',      icon: '💾', cmd: 'df -h /opt/seewhy',                color: '#C9A84C' },
    { id: 'memcheck',    label: 'MEMORY',          icon: '🧠', cmd: 'free -h',                          color: '#FF6B35' },
    { id: 'dbbackup',    label: 'BACKUP DB',       icon: '🗄', cmd: 'cp seewhy.db seewhy.db.bak',        color: '#FF1A3C' },
    { id: 'sslcheck',    label: 'SSL STATUS',      icon: '🔒', cmd: 'certbot certificates',             color: '#C9A84C' },
  ];

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* Stream Active status bar */}
      {isLive && (
        <div style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 8px #FF1A3C', animation: 'pulse 1s infinite' }} />
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#C9A84C', letterSpacing: 2 }}>🔴 STREAM ACTIVE</span>
          </div>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#C9A84C', letterSpacing: 1 }}>{fmtUptime(uptimeSec)}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#C9A84C', letterSpacing: 3 }}>⚙️ INSFORGE STATUS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A84C', boxShadow: '0 0 6px #C9A84C' }} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>AUTO {countdown}s</span>
          </div>
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginBottom: 8 }}>VPS: {VPS_IP} · App: {APP_ID.substring(0, 12)}...</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {[[healthy, 'HEALTHY', '#C9A84C'], [warning, 'WARN', '#C9A84C'], [errors, 'ERROR', '#FF1A3C']].map(function(s) {
            return (
              <div key={s[1]} style={{ flex: 1, background: s[2] + '12', border: '1px solid ' + s[2] + '33', borderRadius: 8, padding: '5px 6px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: s[2], lineHeight: 1 }}>{s[0]}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#8A7A62', letterSpacing: 1 }}>{s[1]}</div>
              </div>
            );
          })}
        </div>
        <button onClick={function() { doRefresh(); }} disabled={refreshing}
          style={{ width: '100%', padding: '8px', background: refreshing ? 'rgba(201,168,76,.1)' : 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 8, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.7 : 1 }}>
          {refreshing ? '🔄 REFRESHING...' : '🔄 REFRESH NOW'}
        </button>
        {lastRefresh && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#3D3020', textAlign: 'center', marginTop: 4 }}>Last: {lastRefresh}</div>}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 8, padding: 3 }}>
        {ITABS.map(function(t) {
          var isActive = tab === t[0];
          return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }}
              style={{ flex: 1, padding: '7px 0', background: isActive ? 'rgba(201,168,76,.1)' : 'transparent', border: 'none', borderRadius: 6, color: isActive ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
              {t[1]}
            </button>
          );
        })}
      </div>

      {/* ── STATUS ── */}
      {tab === 'status' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {services.map(function(s) {
            var sc = statusColors[s.status] || '#8A7A62';
            return (
              <div key={s.id} style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: sc + '12', border: '1px solid ' + sc + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#F0E8D4' }}>{s.name}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: sc }}>{s.val}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc, boxShadow: s.status === 'healthy' ? '0 0 6px ' + sc : 'none' }} />
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: sc, textTransform: 'uppercase', letterSpacing: 1 }}>{s.status}</span>
                </div>
              </div>
            );
          })}

          <div style={{ background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 2, marginBottom: 6 }}>RTMP INGEST</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C', wordBreak: 'break-all' }}>rtmp://{VPS_IP}:1935/live</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginTop: 4 }}>seewhylive.online · Port 443 nginx TLS</div>
          </div>
        </div>
      )}

      {/* ── LOGS ── */}
      {tab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 2 }}>LIVE LOG STREAM</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9A84C', boxShadow: '0 0 4px #C9A84C' }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#3D3020' }}>LIVE · {liveLogs.length} entries</span>
            </div>
          </div>
          {liveLogs.map(function(log, i) {
            var lc = levelColors[log.level] || '#8A7A62';
            return (
              <div key={i} style={{ background: i === 0 ? 'rgba(201,168,76,.05)' : 'rgba(26,21,16,.7)', border: '1px solid ' + (i === 0 ? 'rgba(201,168,76,.2)' : '#3D3020'), borderRadius: 8, padding: '7px 10px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ background: lc + '18', border: '1px solid ' + lc + '33', borderRadius: 4, padding: '1px 6px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: lc, letterSpacing: 1, flexShrink: 0, marginTop: 1 }}>{log.level}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: i === 0 ? '#F0E8D4' : '#A899BE', lineHeight: 1.4, wordBreak: 'break-word' }}>{log.msg}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3020', marginTop: 2 }}>{fmtTs(log.ts)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SYSTEM ── */}
      {tab === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 2, marginBottom: 8 }}>VPS IDENTITY</div>
            {VPS_INFO.map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1, width: 74, flexShrink: 0 }}>{row[0]}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', flex: 1, wordBreak: 'break-all' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 2, marginBottom: 8 }}>RESOURCE USAGE</div>
            {SYSTEM_STATS.map(function(stat) {
              return (
                <div key={stat.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1 }}>{stat.label}</span>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: stat.color }}>{stat.val}</span>
                  </div>
                  <div style={{ height: 4, background: '#3D3020', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: stat.bar + '%', height: '100%', background: 'linear-gradient(90deg,' + stat.color + '66,' + stat.color + ')', borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 2, marginBottom: 8 }}>PORT MAP</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {PORT_MAP.map(function(p) {
                return (
                  <div key={p[0]} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#C9A84C', width: 44, flexShrink: 0 }}>{p[0]}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>{p[1]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIONS ── */}
      {tab === 'actions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 2, padding: '0 2px' }}>VPS QUICK ACTIONS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {VPS_ACTIONS.map(function(a) {
              var isRunning = running === a.id;
              return (
                <button key={a.id} onClick={function() { runAction(a); }} disabled={running !== null}
                  style={{ background: isRunning ? a.color + '18' : 'rgba(26,21,16,.8)', border: '1px solid ' + (isRunning ? a.color + '55' : '#3D3020'), borderRadius: 10, padding: '10px 8px', cursor: running !== null ? 'not-allowed' : 'pointer', opacity: running && !isRunning ? 0.5 : 1, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 18 }}>{a.icon}</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: isRunning ? a.color : '#F0E8D4', letterSpacing: 1 }}>{isRunning ? '...' : a.label}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3020', wordBreak: 'break-all' }}>{a.cmd}</div>
                </button>
              );
            })}
          </div>

          {actionLog.length > 0 && (
            <div style={{ background: 'rgba(14,12,9,.9)', border: '1px solid #3D3020', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 2, marginBottom: 6 }}>ACTION LOG</div>
              {actionLog.map(function(entry, i) {
                return (
                  <div key={i} style={{ marginBottom: 8, borderBottom: i < actionLog.length - 1 ? '1px solid #1A1510' : 'none', paddingBottom: i < actionLog.length - 1 ? 8 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: '#F0E8D4' }}>{entry.label}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: entry.status === 'done' ? '#C9A84C' : '#C9A84C' }}>{entry.status === 'done' ? 'DONE' : 'RUNNING...'}</span>
                    </div>
                    {entry.output && (
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', wordBreak: 'break-word', lineHeight: 1.5 }}>{entry.output}</div>
                    )}
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3020', marginTop: 2 }}>{fmtTs(entry.ts)}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ background: 'rgba(255,107,53,.06)', border: '1px solid rgba(255,107,53,.2)', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B35', letterSpacing: 1 }}>⚠ Actions above simulate VPS commands. In production, connect to a secure SSH exec endpoint on the backend to run real commands.</div>
          </div>
        </div>
      )}
    </div>
  );
}
