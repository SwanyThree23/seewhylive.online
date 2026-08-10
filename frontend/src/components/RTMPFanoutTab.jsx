import React, { useState, useEffect, useRef } from 'react';

var CUSTOM_DEST_TEMPLATE = { name: '', url: '', key: '' };

var PLATFORMS = [
  { id: 'seewhy',   name: 'SeeWhy LIVE', color: '#C9A84C', icon: '📡', rtmp: 'rtmp://seewhylive.online:1935/live',                          locked: true  },
  { id: 'youtube',  name: 'YouTube',     color: '#FF0000', icon: '▶',  rtmp: 'rtmp://a.rtmp.youtube.com/live2',                        locked: false },
  { id: 'twitch',   name: 'Twitch',      color: '#9146FF', icon: '⬡',  rtmp: 'rtmp://live.twitch.tv/app',                              locked: false },
  { id: 'facebook', name: 'Facebook',    color: '#1877F2', icon: 'f',  rtmp: 'rtmp://live-api-s.facebook.com/rtmp',                    locked: false },
  { id: 'tiktok',   name: 'TikTok',      color: '#69C9D0', icon: '♪',  rtmp: 'rtmp://rtmp-push.tiktok.com/stream',                    locked: false },
  { id: 'kick',     name: 'Kick',        color: '#53FC18', icon: 'K',  rtmp: 'rtmp://fa723fc1b171.global-contribute.live-video.net/app', locked: false },
  { id: 'rumble',   name: 'Rumble',      color: '#85C742', icon: 'R',  rtmp: 'rtmp://p.contribute.live-video.net/live',                locked: false },
];

function _authHeaders(extra) {
  var tok = localStorage.getItem('sw_token') || '';
  var h = tok ? { 'Authorization': 'Bearer ' + tok } : {};
  return Object.assign(h, extra || {});
}

export default function RTMPFanoutTab({ isLive, addToast, socket, roomId }) {
  var [enabled, setEnabled]         = useState({ seewhy: true });
  var [keys, setKeys]               = useState({});
  var [revealed, setRevealed]       = useState({});
  var [bitrates, setBitrates]       = useState({});
  var [fanoutActive, setFanoutActive] = useState(false);
  var [pingMs, setPingMs]           = useState(null);
  var [lastPinged, setLastPinged]   = useState(null);
  var [pingingServer, setPingingServer] = useState(false);
  var [copiedRtmp, setCopiedRtmp]   = useState(false);
  var [customDests,   setCustomDests]   = useState([]);
  var [showAddCustom, setShowAddCustom] = useState(false);
  var [newCustom,     setNewCustom]     = useState({ name: '', url: '', key: '' });
  var [customRevealed, setCustomRevealed] = useState({});
  var [customEnabled,  setCustomEnabled]  = useState({});

  useEffect(function() {
    if (!socket) return;
    function onFanoutFailed(data) {
      setFanoutActive(false);
      if (addToast) addToast('⚠️ Fanout failed' + (data && data.platform ? ': ' + data.platform : ''), 'error');
    }
    function onFanoutRestarted(data) {
      if (addToast) addToast('♻️ Fanout restarted' + (data && data.platform ? ': ' + data.platform : ''), 'success');
    }
    socket.on('fanout-failed',    onFanoutFailed);
    socket.on('fanout-restarted', onFanoutRestarted);
    return function() {
      socket.off('fanout-failed',    onFanoutFailed);
      socket.off('fanout-restarted', onFanoutRestarted);
    };
  }, [socket, addToast]);

  useEffect(function() {
    if (!fanoutActive) setBitrates({});
  }, [fanoutActive]);

  function toggle(id) {
    if (id === 'seewhy') return;
    setEnabled(function(prev) {
      var next = Object.assign({}, prev);
      next[id] = !prev[id];
      return next;
    });
  }

  function testConnection(p) {
    if (!keys[p.id] && !p.locked) { addToast('Enter a stream key for ' + p.name, 'error'); return; }
    addToast(p.name + ' key saved — will connect when fanout starts', 'success');
  }

  function startFanout() {
    var missingKeys = PLATFORMS.filter(function(p) {
      return enabled[p.id] && !p.locked && !keys[p.id];
    });
    var missingCustom = customDests.filter(function(dest, idx) {
      return customEnabled['custom_' + idx] && !dest.key;
    });
    if (missingKeys.length > 0 || missingCustom.length > 0) {
      var names = missingKeys.map(function(p) { return p.name; }).concat(missingCustom.map(function(d) { return d.name; }));
      addToast('Missing key for: ' + names.join(', '), 'error');
      return;
    }
    var dests = PLATFORMS
      .filter(function(p) { return enabled[p.id] && !p.locked; })
      .map(function(p) { return { url: p.rtmp, key: keys[p.id], enabled: true, label: p.name, platform: p.id }; });
    customDests.forEach(function(dest, idx) {
      if (customEnabled['custom_' + idx]) {
        dests.push({ url: dest.url, key: dest.key, enabled: true, label: dest.name });
      }
    });
    var streamId = roomId || 'default';
    fetch('/api/fanout-start', {
      method: 'POST',
      headers: _authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ stream_id: streamId, room_id: streamId, destinations: dests })
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.ok) {
          setFanoutActive(true);
          addToast('🔴 RTMP Fanout started — ' + (d.destinations || dests.length) + ' destinations', 'success');
        } else {
          addToast('Fanout error: ' + ((d && d.error) || 'unknown'), 'error');
        }
      })
      .catch(function(e) { addToast('Fanout error: ' + e.message, 'error'); });
  }

  function stopAll() {
    var streamId = roomId || 'default';
    fetch('/api/fanout-stop', {
      method: 'POST',
      headers: _authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ stream_id: streamId })
    })
      .then(function(r) { return r.json(); })
      .catch(function() { return {}; })
      .then(function() {
        setFanoutActive(false);
        setBitrates({});
        addToast('⏹ Fanout stopped', 'info');
      });
  }

  function pingServer() {
    setPingingServer(true);
    var t0 = Date.now();
    fetch('/api/health').then(function() {
      var ms = Date.now() - t0;
      setPingMs(ms);
      setLastPinged(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setPingingServer(false);
      addToast('Server ping: ' + ms + 'ms', 'success');
    }, function() {
      var ms = Date.now() - t0;
      setPingMs(ms);
      setLastPinged(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setPingingServer(false);
      addToast('Ping failed — server unreachable', 'error');
    });
  }

  function copyRtmpUrl() {
    navigator.clipboard.writeText('rtmp://seewhylive.online:1935/live');
    setCopiedRtmp(true);
    addToast('RTMP URL copied to clipboard', 'success');
    setTimeout(function() { setCopiedRtmp(false); }, 1500);
  }

  var enabledCount = Object.values(enabled).filter(Boolean).length + Object.values(customEnabled).filter(Boolean).length;
  var totalDests   = PLATFORMS.length + customDests.length;
  var liveCount    = fanoutActive ? enabledCount : 0;

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* Header stats */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          [enabledCount, 'ENABLED', '#C9A84C'],
          [liveCount,    'LIVE',    '#FF1A3C'],
          [totalDests, 'TOTAL', '#8A7A62'],
        ].map(function(s) {
          return (
            <div key={s[1]} style={{ flex: 1, background: s[2] + '12', border: '1px solid ' + s[2] + '33', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: s[2], lineHeight: 1 }}>{s[0]}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1 }}>{s[1]}</div>
            </div>
          );
        })}
      </div>

      {/* Master controls */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={startFanout}
          disabled={fanoutActive}
          style={{ flex: 1, padding: '10px', background: fanoutActive ? 'rgba(128,0,32,.3)' : 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 8, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: fanoutActive ? 'not-allowed' : 'pointer', opacity: fanoutActive ? 0.5 : 1 }}>
          🔴 START FANOUT
        </button>
        <button
          onClick={stopAll}
          disabled={!fanoutActive}
          style={{ flex: 1, padding: '10px', background: 'rgba(230,57,70,.12)', border: '1px solid rgba(230,57,70,.4)', borderRadius: 8, color: '#FF6B81', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: !fanoutActive ? 'not-allowed' : 'pointer', opacity: !fanoutActive ? 0.5 : 1 }}>
          ⏹ STOP ALL
        </button>
      </div>

      {/* Server status row: PING SERVER + COPY RTMP URL */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={pingServer}
          disabled={pingingServer}
          style={{ background: pingingServer ? 'rgba(201,168,76,.1)' : 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,' + (pingingServer ? '.25' : '.45') + ')', borderRadius: 8, padding: '7px 12px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: pingingServer ? 'not-allowed' : 'pointer', opacity: pingingServer ? 0.7 : 1, flexShrink: 0 }}>
          {pingingServer ? '⟳ PINGING...' : '📡 PING SERVER'}
        </button>
        {pingMs !== null && (
          <div style={{ background: pingMs < 150 ? 'rgba(201,168,76,.12)' : 'rgba(255,107,0,.12)', border: '1px solid ' + (pingMs < 150 ? 'rgba(201,168,76,.4)' : 'rgba(255,107,0,.4)'), borderRadius: 6, padding: '4px 10px', fontFamily: "'DM Mono',monospace", fontSize: 10, color: pingMs < 150 ? '#C9A84C' : '#D4854A', flexShrink: 0 }}>
            {'● ' + pingMs + 'ms'}
          </div>
        )}
        {lastPinged && (
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', flexShrink: 0 }}>
            {lastPinged}
          </div>
        )}
        <button
          onClick={copyRtmpUrl}
          style={{ marginLeft: 'auto', background: copiedRtmp ? 'rgba(201,168,76,.2)' : 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,' + (copiedRtmp ? '.6' : '.3') + ')', borderRadius: 8, padding: '7px 12px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
          {copiedRtmp ? '✓ COPIED' : '📋 COPY RTMP URL'}
        </button>
      </div>

      {/* Platform rows */}
      {PLATFORMS.map(function(p) {
        var isOn   = Boolean(enabled[p.id]);

        return (
          <div key={p.id} style={{ background: isOn ? p.color + '0a' : 'rgba(26,21,16,.5)', border: '1px solid ' + (isOn ? p.color + '44' : 'rgba(26,21,16,1)'), borderRadius: 10, padding: '10px 12px' }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: p.color + '22', border: '1px solid ' + p.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, color: p.color }}>
                {p.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: isOn ? '#F0E8D4' : '#8A7A62' }}>
                  {p.name}
                  {p.locked && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', marginLeft: 4 }}>PRIMARY</span>}
                </div>
              </div>
              {/* Toggle */}
              <div
                onClick={function() { toggle(p.id); }}
                style={{ width: 32, height: 18, borderRadius: 999, background: isOn ? '#800020' : '#3D3020', position: 'relative', cursor: p.locked ? 'not-allowed' : 'pointer', transition: 'background .2s', flexShrink: 0, boxShadow: isOn ? '0 0 10px #FF1A3C44' : 'none' }}>
                <div style={{ position: 'absolute', top: 3, left: isOn ? 16 : 3, width: 12, height: 12, borderRadius: '50%', background: isOn ? '#C9A84C' : '#8A7A62', transition: 'left .18s' }} />
              </div>
            </div>

            {/* Key input */}
            {!p.locked && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input
                  type={revealed[p.id] ? 'text' : 'password'}
                  value={keys[p.id] || ''}
                  onChange={function(e) { setKeys(function(prev) { return Object.assign({}, prev, { [p.id]: e.target.value }); }); }}
                  placeholder="Stream key..."
                  style={{ flex: 1, background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 6, padding: '5px 8px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 10 }}
                />
                <button
                  onClick={function() { setRevealed(function(prev) { return Object.assign({}, prev, { [p.id]: !prev[p.id] }); }); }}
                  style={{ background: 'rgba(255,255,255,.05)', border: '1px solid #3D3020', borderRadius: 6, padding: '4px 8px', color: '#8A7A62', fontSize: 10, cursor: 'pointer' }}>
                  {revealed[p.id] ? '🙈' : '👁'}
                </button>
                <button
                  onClick={function() { testConnection(p); }}
                  style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '4px 8px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer' }}>
                  TEST
                </button>
              </div>
            )}

            {fanoutActive && isOn && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: p.color }}>● LIVE</div>
            )}
          </div>
        );
      })}

      {/* Custom RTMP destinations */}
      {customDests.map(function(dest, idx) {
        var cid     = 'custom_' + idx;
        var isOn    = Boolean(customEnabled[cid]);
        return (
          <div key={cid} style={{ background: isOn ? 'rgba(212,133,74,.06)' : 'rgba(26,21,16,.5)', border: '1px solid ' + (isOn ? 'rgba(212,133,74,.4)' : 'rgba(26,21,16,1)'), borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(212,133,74,.15)', border: '1px solid rgba(212,133,74,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, color: '#C9A84C' }}>
                📡
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: isOn ? '#F0E8D4' : '#8A7A62', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dest.name}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dest.url}</div>
              </div>
              <div
                onClick={function() {
                  setCustomEnabled(function(prev) {
                    var next = Object.assign({}, prev);
                    next[cid] = !prev[cid];
                    return next;
                  });
                }}
                style={{ width: 32, height: 18, borderRadius: 999, background: isOn ? '#800020' : '#3D3020', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0, boxShadow: isOn ? '0 0 10px #FF1A3C44' : 'none' }}>
                <div style={{ position: 'absolute', top: 3, left: isOn ? 16 : 3, width: 12, height: 12, borderRadius: '50%', background: isOn ? '#C9A84C' : '#8A7A62', transition: 'left .18s' }} />
              </div>
              <button
                onClick={function() {
                  setCustomDests(function(prev) { return prev.filter(function(_, i) { return i !== idx; }); });
                  addToast('Custom destination removed', 'info');
                }}
                style={{ background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.25)', borderRadius: 5, padding: '3px 6px', color: '#FF6B81', fontSize: 9, cursor: 'pointer', flexShrink: 0, fontFamily: "'DM Mono',monospace" }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input
                type={customRevealed[cid] ? 'text' : 'password'}
                value={dest.key}
                onChange={function(e) {
                  var val = e.target.value;
                  setCustomDests(function(prev) {
                    var next = prev.slice();
                    next[idx] = Object.assign({}, next[idx], { key: val });
                    return next;
                  });
                }}
                placeholder="Stream key..."
                style={{ flex: 1, background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 6, padding: '5px 8px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 10 }}
              />
              <button
                onClick={function() { setCustomRevealed(function(prev) { return Object.assign({}, prev, { [cid]: !prev[cid] }); }); }}
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid #3D3020', borderRadius: 6, padding: '4px 8px', color: '#8A7A62', fontSize: 10, cursor: 'pointer' }}>
                {customRevealed[cid] ? '🙈' : '👁'}
              </button>
              <button
                onClick={function() {
                  if (!dest.key) { addToast('Enter a stream key for ' + dest.name, 'error'); return; }
                  addToast(dest.name + ' key saved — will connect when fanout starts', 'success');
                }}
                style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '4px 8px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer' }}>
                TEST
              </button>
            </div>
            {fanoutActive && isOn && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C' }}>● LIVE</div>
            )}
          </div>
        );
      })}

      {/* ADD CUSTOM RTMP button + form */}
      <div>
        <button
          onClick={function() { setShowAddCustom(function(v) { return !v; }); }}
          style={{ width: '100%', padding: '9px', background: showAddCustom ? 'rgba(212,133,74,.12)' : 'rgba(26,21,16,.7)', border: '1px dashed ' + (showAddCustom ? 'rgba(212,133,74,.5)' : 'rgba(212,133,74,.25)'), borderRadius: 8, color: showAddCustom ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}>
          {showAddCustom ? '✕ CANCEL' : '+ ADD CUSTOM RTMP'}
        </button>

        {showAddCustom && (
          <div style={{ marginTop: 8, background: 'rgba(212,133,74,.05)', border: '1px solid rgba(212,133,74,.2)', borderRadius: 10, padding: '12px' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#C9A84C', letterSpacing: 2, marginBottom: 10 }}>CUSTOM RTMP DESTINATION</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', marginBottom: 3 }}>NAME</div>
                <input
                  value={newCustom.name}
                  onChange={function(e) { setNewCustom(function(prev) { return Object.assign({}, prev, { name: e.target.value }); }); }}
                  placeholder="My RTMP Server"
                  style={{ width: '100%', background: '#07050A', border: '1px solid #3D3020', borderRadius: 6, padding: '7px 10px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13 }}
                />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', marginBottom: 3 }}>RTMP URL</div>
                <input
                  value={newCustom.url}
                  onChange={function(e) { setNewCustom(function(prev) { return Object.assign({}, prev, { url: e.target.value }); }); }}
                  placeholder="rtmp://your-server.com/live"
                  style={{ width: '100%', background: '#07050A', border: '1px solid #3D3020', borderRadius: 6, padding: '7px 10px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 10 }}
                />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', marginBottom: 3 }}>STREAM KEY</div>
                <input
                  type="password"
                  value={newCustom.key}
                  onChange={function(e) { setNewCustom(function(prev) { return Object.assign({}, prev, { key: e.target.value }); }); }}
                  placeholder="your-stream-key"
                  style={{ width: '100%', background: '#07050A', border: '1px solid #3D3020', borderRadius: 6, padding: '7px 10px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 10 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={function() {
                    if (!newCustom.name.trim()) { addToast('Enter a destination name', 'error'); return; }
                    if (!newCustom.url.trim()) { addToast('Enter an RTMP URL', 'error'); return; }
                    setCustomDests(function(prev) { return prev.concat([{ name: newCustom.name.trim(), url: newCustom.url.trim(), key: newCustom.key }]); });
                    setNewCustom({ name: '', url: '', key: '' });
                    setShowAddCustom(false);
                    addToast('Custom RTMP destination added', 'success');
                  }}
                  style={{ flex: 2, padding: '8px', background: 'rgba(212,133,74,.15)', border: '1px solid rgba(212,133,74,.4)', borderRadius: 7, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  ✓ ADD DESTINATION
                </button>
                <button
                  onClick={function() { setShowAddCustom(false); setNewCustom({ name: '', url: '', key: '' }); }}
                  style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #3D3020', borderRadius: 7, color: '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
