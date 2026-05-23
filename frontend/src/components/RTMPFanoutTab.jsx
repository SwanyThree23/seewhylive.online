import React, { useState, useEffect, useRef } from 'react';

var CUSTOM_DEST_TEMPLATE = { name: '', url: '', key: '' };

var PLATFORMS = [
  { id: 'seewhy',   name: 'SeeWhy LIVE', color: '#C9A84C', icon: '📡', rtmp: 'rtmp://2.24.194.112:1935/live',                          locked: true  },
  { id: 'youtube',  name: 'YouTube',     color: '#FF0000', icon: '▶',  rtmp: 'rtmp://a.rtmp.youtube.com/live2',                        locked: false },
  { id: 'twitch',   name: 'Twitch',      color: '#9146FF', icon: '⬡',  rtmp: 'rtmp://live.twitch.tv/app',                              locked: false },
  { id: 'facebook', name: 'Facebook',    color: '#1877F2', icon: 'f',  rtmp: 'rtmp://live-api-s.facebook.com/rtmp',                    locked: false },
  { id: 'tiktok',   name: 'TikTok',      color: '#69C9D0', icon: '♪',  rtmp: 'rtmp://rtmp-push.tiktok.com/stream',                    locked: false },
  { id: 'kick',     name: 'Kick',        color: '#53FC18', icon: 'K',  rtmp: 'rtmp://fa723fc1b171.global-contribute.live-video.net/app', locked: false },
  { id: 'rumble',   name: 'Rumble',      color: '#85C742', icon: 'R',  rtmp: 'rtmp://p.contribute.live-video.net/live',                locked: false },
];

export default function RTMPFanoutTab({ isLive, addToast }) {
  var [enabled, setEnabled]         = useState({ seewhy: true });
  var [keys, setKeys]               = useState({});
  var [revealed, setRevealed]       = useState({});
  var [testing, setTesting]         = useState({});
  var [latency, setLatency]         = useState({});
  var [bitrates, setBitrates]       = useState({});
  var [fanoutActive, setFanoutActive] = useState(false);
  var bitrateRef = useRef(null);

  var [customDests,   setCustomDests]   = useState([]);
  var [showAddCustom, setShowAddCustom] = useState(false);
  var [newCustom,     setNewCustom]     = useState({ name: '', url: '', key: '' });
  var [customRevealed, setCustomRevealed] = useState({});
  var [customEnabled,  setCustomEnabled]  = useState({});

  useEffect(function() {
    if (!fanoutActive) {
      if (bitrateRef.current) clearInterval(bitrateRef.current);
      setBitrates({});
      return;
    }
    bitrateRef.current = setInterval(function() {
      var next = {};
      PLATFORMS.forEach(function(p) {
        if (enabled[p.id]) {
          next[p.id] = 3000 + Math.floor(Math.random() * 4000);
        }
      });
      setBitrates(next);
    }, 1200);
    return function() { clearInterval(bitrateRef.current); };
  }, [fanoutActive, enabled]);

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
    setTesting(function(prev) { return Object.assign({}, prev, { [p.id]: true }); });
    setTimeout(function() {
      var ms = 80 + Math.floor(Math.random() * 120);
      setLatency(function(prev) { return Object.assign({}, prev, { [p.id]: ms }); });
      setTesting(function(prev) { return Object.assign({}, prev, { [p.id]: false }); });
      addToast(p.name + ' connection OK — ' + ms + 'ms', 'success');
    }, 1200 + Math.floor(Math.random() * 800));
  }

  function startFanout() {
    var missingKeys = PLATFORMS.filter(function(p) {
      return enabled[p.id] && !p.locked && !keys[p.id];
    });
    if (missingKeys.length > 0) {
      addToast('Missing key for: ' + missingKeys.map(function(p) { return p.name; }).join(', '), 'error');
      return;
    }
    setFanoutActive(true);
    addToast('🔴 RTMP Fanout started — ' + Object.keys(enabled).filter(function(k) { return enabled[k]; }).length + ' destinations', 'success');
  }

  function stopAll() {
    setFanoutActive(false);
    setBitrates({});
    addToast('⏹ Fanout stopped', 'info');
  }

  var enabledCount = Object.values(enabled).filter(Boolean).length;
  var liveCount    = fanoutActive ? enabledCount : 0;

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* Header stats */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          [enabledCount, 'ENABLED', '#C9A84C'],
          [liveCount,    'LIVE',    '#FF1A3C'],
          [PLATFORMS.length, 'TOTAL', '#7A6F90'],
        ].map(function(s) {
          return (
            <div key={s[1]} style={{ flex: 1, background: s[2] + '12', border: '1px solid ' + s[2] + '33', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: s[2], lineHeight: 1 }}>{s[0]}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1 }}>{s[1]}</div>
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

      {/* Platform rows */}
      {PLATFORMS.map(function(p) {
        var isOn   = Boolean(enabled[p.id]);
        var bps    = bitrates[p.id] || 0;
        var bpsPct = Math.min(100, Math.floor((bps / 8000) * 100));
        var lat    = latency[p.id];
        var isTesting = Boolean(testing[p.id]);

        return (
          <div key={p.id} style={{ background: isOn ? p.color + '0a' : 'rgba(22,16,32,.5)', border: '1px solid ' + (isOn ? p.color + '44' : 'rgba(36,28,52,1)'), borderRadius: 10, padding: '10px 12px' }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: p.color + '22', border: '1px solid ' + p.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, color: p.color }}>
                {p.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: isOn ? '#EDE8F5' : '#7A6F90' }}>
                  {p.name}
                  {p.locked && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', marginLeft: 4 }}>PRIMARY</span>}
                </div>
                {lat && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: lat < 100 ? '#00C9A7' : lat < 150 ? '#C9A84C' : '#FF1A3C' }}>{lat}ms</div>}
              </div>
              {/* Toggle */}
              <div
                onClick={function() { toggle(p.id); }}
                style={{ width: 32, height: 18, borderRadius: 999, background: isOn ? '#800020' : '#241C34', position: 'relative', cursor: p.locked ? 'not-allowed' : 'pointer', transition: 'background .2s', flexShrink: 0, boxShadow: isOn ? '0 0 10px #FF1A3C44' : 'none' }}>
                <div style={{ position: 'absolute', top: 3, left: isOn ? 16 : 3, width: 12, height: 12, borderRadius: '50%', background: isOn ? '#C9A84C' : '#7A6F90', transition: 'left .18s' }} />
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
                  style={{ flex: 1, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '5px 8px', color: '#EDE8F5', fontFamily: "'DM Mono',monospace", fontSize: 10 }}
                />
                <button
                  onClick={function() { setRevealed(function(prev) { return Object.assign({}, prev, { [p.id]: !prev[p.id] }); }); }}
                  style={{ background: 'rgba(255,255,255,.05)', border: '1px solid #241C34', borderRadius: 6, padding: '4px 8px', color: '#7A6F90', fontSize: 10, cursor: 'pointer' }}>
                  {revealed[p.id] ? '🙈' : '👁'}
                </button>
                <button
                  onClick={function() { testConnection(p); }}
                  disabled={isTesting}
                  style={{ background: 'rgba(0,201,167,.1)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 6, padding: '4px 8px', color: '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: isTesting ? 'not-allowed' : 'pointer', opacity: isTesting ? 0.6 : 1 }}>
                  {isTesting ? '...' : 'TEST'}
                </button>
              </div>
            )}

            {/* Bitrate bar */}
            {fanoutActive && isOn && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>BITRATE</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: p.color }}>{Math.floor(bps / 1000)}kbps</span>
                </div>
                <div style={{ height: 4, background: '#241C34', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: bpsPct + '%', background: 'linear-gradient(90deg,' + p.color + '88,' + p.color + ')', borderRadius: 2, transition: 'width .4s ease' }} />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Custom RTMP destinations */}
      {customDests.map(function(dest, idx) {
        var cid     = 'custom_' + idx;
        var isOn    = Boolean(customEnabled[cid]);
        var bps     = bitrates[cid] || 0;
        var bpsPct  = Math.min(100, Math.floor((bps / 8000) * 100));
        var isTesting = Boolean(testing[cid]);
        var lat     = latency[cid];
        return (
          <div key={cid} style={{ background: isOn ? 'rgba(90,143,255,.06)' : 'rgba(22,16,32,.5)', border: '1px solid ' + (isOn ? 'rgba(90,143,255,.4)' : 'rgba(36,28,52,1)'), borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(90,143,255,.15)', border: '1px solid rgba(90,143,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, color: '#5A8FFF' }}>
                📡
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: isOn ? '#EDE8F5' : '#7A6F90', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dest.name}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dest.url}</div>
                {lat && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: lat < 100 ? '#00C9A7' : lat < 150 ? '#C9A84C' : '#FF1A3C' }}>{lat}ms</div>}
              </div>
              <div
                onClick={function() {
                  setCustomEnabled(function(prev) {
                    var next = Object.assign({}, prev);
                    next[cid] = !prev[cid];
                    return next;
                  });
                }}
                style={{ width: 32, height: 18, borderRadius: 999, background: isOn ? '#800020' : '#241C34', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0, boxShadow: isOn ? '0 0 10px #FF1A3C44' : 'none' }}>
                <div style={{ position: 'absolute', top: 3, left: isOn ? 16 : 3, width: 12, height: 12, borderRadius: '50%', background: isOn ? '#C9A84C' : '#7A6F90', transition: 'left .18s' }} />
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
                style={{ flex: 1, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 6, padding: '5px 8px', color: '#EDE8F5', fontFamily: "'DM Mono',monospace", fontSize: 10 }}
              />
              <button
                onClick={function() { setCustomRevealed(function(prev) { return Object.assign({}, prev, { [cid]: !prev[cid] }); }); }}
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid #241C34', borderRadius: 6, padding: '4px 8px', color: '#7A6F90', fontSize: 10, cursor: 'pointer' }}>
                {customRevealed[cid] ? '🙈' : '👁'}
              </button>
              <button
                onClick={function() {
                  if (!dest.key) { addToast('Enter a stream key for ' + dest.name, 'error'); return; }
                  setTesting(function(prev) { return Object.assign({}, prev, { [cid]: true }); });
                  setTimeout(function() {
                    var ms = 80 + Math.floor(Math.random() * 120);
                    setLatency(function(prev) { return Object.assign({}, prev, { [cid]: ms }); });
                    setTesting(function(prev) { return Object.assign({}, prev, { [cid]: false }); });
                    addToast(dest.name + ' connection OK — ' + ms + 'ms', 'success');
                  }, 1200 + Math.floor(Math.random() * 800));
                }}
                disabled={isTesting}
                style={{ background: 'rgba(0,201,167,.1)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 6, padding: '4px 8px', color: '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: isTesting ? 'not-allowed' : 'pointer', opacity: isTesting ? 0.6 : 1 }}>
                {isTesting ? '...' : 'TEST'}
              </button>
            </div>
            {fanoutActive && isOn && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>BITRATE</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#5A8FFF' }}>{Math.floor(bps / 1000)}kbps</span>
                </div>
                <div style={{ height: 4, background: '#241C34', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: bpsPct + '%', background: 'linear-gradient(90deg,rgba(90,143,255,.6),#5A8FFF)', borderRadius: 2, transition: 'width .4s ease' }} />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ADD CUSTOM RTMP button + form */}
      <div>
        <button
          onClick={function() { setShowAddCustom(function(v) { return !v; }); }}
          style={{ width: '100%', padding: '9px', background: showAddCustom ? 'rgba(90,143,255,.12)' : 'rgba(22,16,32,.7)', border: '1px dashed ' + (showAddCustom ? 'rgba(90,143,255,.5)' : 'rgba(90,143,255,.25)'), borderRadius: 8, color: showAddCustom ? '#5A8FFF' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}>
          {showAddCustom ? '✕ CANCEL' : '+ ADD CUSTOM RTMP'}
        </button>

        {showAddCustom && (
          <div style={{ marginTop: 8, background: 'rgba(90,143,255,.05)', border: '1px solid rgba(90,143,255,.2)', borderRadius: 10, padding: '12px' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#5A8FFF', letterSpacing: 2, marginBottom: 10 }}>CUSTOM RTMP DESTINATION</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', marginBottom: 3 }}>NAME</div>
                <input
                  value={newCustom.name}
                  onChange={function(e) { setNewCustom(function(prev) { return Object.assign({}, prev, { name: e.target.value }); }); }}
                  placeholder="My RTMP Server"
                  style={{ width: '100%', background: '#07050A', border: '1px solid #241C34', borderRadius: 6, padding: '7px 10px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13 }}
                />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', marginBottom: 3 }}>RTMP URL</div>
                <input
                  value={newCustom.url}
                  onChange={function(e) { setNewCustom(function(prev) { return Object.assign({}, prev, { url: e.target.value }); }); }}
                  placeholder="rtmp://your-server.com/live"
                  style={{ width: '100%', background: '#07050A', border: '1px solid #241C34', borderRadius: 6, padding: '7px 10px', color: '#EDE8F5', fontFamily: "'DM Mono',monospace", fontSize: 10 }}
                />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', marginBottom: 3 }}>STREAM KEY</div>
                <input
                  type="password"
                  value={newCustom.key}
                  onChange={function(e) { setNewCustom(function(prev) { return Object.assign({}, prev, { key: e.target.value }); }); }}
                  placeholder="your-stream-key"
                  style={{ width: '100%', background: '#07050A', border: '1px solid #241C34', borderRadius: 6, padding: '7px 10px', color: '#EDE8F5', fontFamily: "'DM Mono',monospace", fontSize: 10 }}
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
                  style={{ flex: 2, padding: '8px', background: 'rgba(90,143,255,.15)', border: '1px solid rgba(90,143,255,.4)', borderRadius: 7, color: '#5A8FFF', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  ✓ ADD DESTINATION
                </button>
                <button
                  onClick={function() { setShowAddCustom(false); setNewCustom({ name: '', url: '', key: '' }); }}
                  style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #241C34', borderRadius: 7, color: '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
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
