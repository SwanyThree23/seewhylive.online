import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var REFRESH_MS = 6000;

function fmtAge(ms) {
  var s = Math.floor(ms / 1000);
  if (s < 60)  return s + 's ago';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm ago';
}

function fmtDuration(startedAt) {
  if (!startedAt) return '—';
  var s = Math.floor((Date.now() - startedAt) / 1000);
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var sec = s % 60;
  if (h > 0) return h + 'h ' + String(m).padStart(2,'0') + 'm';
  return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}

function maskKey(roomId) {
  if (!roomId) return '—';
  if (roomId.length <= 8) return roomId;
  return roomId.slice(0, 4) + '••••' + roomId.slice(-4);
}

var PLATFORM_ICONS = {
  youtube:  '▶',
  tiktok:   '♪',
  twitch:   '◈',
  facebook: 'f',
  custom:   '⚡',
};

var PLATFORM_COLORS = {
  youtube:  '#FF0000',
  tiktok:   '#EE1D52',
  twitch:   '#9146FF',
  facebook: '#1877F2',
  custom:   '#C9A84C',
};

export default function LiveStreamHubTab({ addToast, isLive, socket, roomId }) {
  var [data,     setData]     = useState(null);
  var [loading,  setLoading]  = useState(true);
  var [error,    setError]    = useState(null);
  var [tab,      setTab]      = useState('in');  // 'in' | 'out' | 'rooms'
  var timerRef = useRef(null);

  function fetchData() {
    fetch('/api/streams/live')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        setData(d);
        setLoading(false);
        setError(null);
      })
      .catch(function(e) {
        setError(e.message);
        setLoading(false);
      });
  }

  useEffect(function() {
    fetchData();
    timerRef.current = setInterval(fetchData, REFRESH_MS);
    return function() { clearInterval(timerRef.current); };
  }, []);

  var streamsIn  = (data && data.streamsIn)  || [];
  var streamsOut = (data && data.streamsOut) || [];
  var rooms      = (data && data.rooms)      || [];

  var activeIn  = streamsIn.filter(function(s) { return s.active; });
  var staleIn   = streamsIn.filter(function(s) { return !s.active; });
  var activeOut = streamsOut.filter(function(s) { return s.alive; });

  /* ── styles ── */
  var card = { background: 'rgba(26,21,16,.8)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 };
  var liveChip = { background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 20, padding: '2px 9px', fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#FF1A3C', letterSpacing: 1 };
  var staleChip = { background: 'rgba(61,48,32,.1)', border: '1px solid rgba(61,48,32,.25)', borderRadius: 20, padding: '2px 9px', fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', letterSpacing: 1 };
  var label = { fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', letterSpacing: 1 };
  var value = { fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#F0E8D4', lineHeight: 1 };
  var tabBtn = function(id, color) {
    var isA = tab === id;
    return { padding: '6px 16px', background: isA ? color + '22' : 'rgba(26,21,16,.6)', border: '1px solid ' + (isA ? color : 'rgba(255,255,255,.07)'), borderRadius: 8, color: isA ? color : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1, transition: 'all .12s' };
  };

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,rgba(128,0,32,.25),rgba(201,168,76,.08))', border: '1px solid rgba(201,168,76,.15)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#F0E8D4', letterSpacing: 3, lineHeight: 1 }}>LIVE STREAM HUB</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginTop: 2, letterSpacing: 1 }}>Streams In · Streams Out · Active Rooms</div>
          </div>
          <button onClick={fetchData} style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 8, padding: '6px 12px', color: '#C9A84C', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: 1 }}>↻ REFRESH</button>
        </div>
        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
          {[
            [activeIn.length,  'STREAMS IN',  '#FF1A3C'],
            [activeOut.length, 'STREAMS OUT', '#C9A84C'],
            [rooms.reduce(function(a, r) { return a + r.viewers; }, 0), 'TOTAL VIEWERS', '#C9A84C'],
          ].map(function(row) {
            return (
              <div key={row[1]} style={{ background: 'rgba(14,12,9,.5)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#8A7A62', letterSpacing: 1, marginBottom: 2 }}>{row[1]}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: row[2], lineHeight: 1 }}>{row[0]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button style={tabBtn('in', '#FF1A3C')} onClick={function() { setTab('in'); }}>
          ↓ IN ({activeIn.length})
        </button>
        <button style={tabBtn('out', '#C9A84C')} onClick={function() { setTab('out'); }}>
          ↑ OUT ({activeOut.length})
        </button>
        <button style={tabBtn('rooms', '#C9A84C')} onClick={function() { setTab('rooms'); }}>
          ◈ ROOMS ({rooms.length})
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3D3020', letterSpacing: 2 }}>SCANNING...</div>
      )}
      {error && !loading && (
        <div style={{ background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.25)', borderRadius: 8, padding: '12px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#FF6B81' }}>Error: {error}</div>
      )}

      {/* ── STREAMS IN ── */}
      {tab === 'in' && !loading && (
        <div>
          {/* RTMP ingest info card */}
          <div style={{ background: 'rgba(255,26,60,.06)', border: '1px solid rgba(255,26,60,.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#FF6B81', letterSpacing: 2, marginBottom: 4 }}>RTMP INGEST ENDPOINT</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#F0E8D4', letterSpacing: 0.5 }}>rtmp://2.24.194.112:1935/live/&lt;stream-key&gt;</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginTop: 3 }}>OBS → Settings → Stream → Custom RTMP → paste above</div>
          </div>

          {activeIn.length === 0 && staleIn.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📡</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#3D3020', letterSpacing: 2 }}>NO ACTIVE STREAMS</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#3D3020', marginTop: 4 }}>Streams appear here once a creator starts broadcasting</div>
            </div>
          )}

          {activeIn.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#FF1A3C', letterSpacing: 2, marginBottom: 6 }}>● ACTIVE ({activeIn.length})</div>
              {activeIn.map(function(s) {
                return (
                  <div key={s.roomId} style={Object.assign({}, card, { border: '1px solid rgba(255,26,60,.25)' })}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <AvatarPortrait username={s.roomId} size={38} isLive={true} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: '#F0E8D4' }}>{maskKey(s.roomId)}</div>
                          <span style={liveChip}>● LIVE</span>
                        </div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62' }}>
                          {'Updated ' + fmtAge(s.ageMs) + ' · Running ' + fmtDuration(s.startedAt)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#FF1A3C', lineHeight: 1 }}>{s.viewers}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#8A7A62' }}>VIEWERS</div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(14,12,9,.6)', borderRadius: 6, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>
                        {'https://2.24.194.112' + s.hlsUrl}
                      </div>
                      <button
                        onClick={function() {
                          try { navigator.clipboard.writeText('https://2.24.194.112' + s.hlsUrl); } catch(e) {}
                          if (addToast) addToast('HLS URL copied', 'success');
                        }}
                        style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 5, padding: '3px 9px', color: '#C9A84C', fontFamily: "'DM Mono',monospace", fontSize: 7.5, cursor: 'pointer', flexShrink: 0 }}>
                        COPY HLS
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {staleIn.length > 0 && (
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', letterSpacing: 2, marginBottom: 6 }}>◌ RECENTLY ENDED ({staleIn.length})</div>
              {staleIn.map(function(s) {
                return (
                  <div key={s.roomId} style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AvatarPortrait username={s.roomId} size={32} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#8A7A62' }}>{maskKey(s.roomId)}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#3D3020' }}>{'Last seen ' + fmtAge(s.ageMs)}</div>
                      </div>
                      <span style={staleChip}>ENDED</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── STREAMS OUT ── */}
      {tab === 'out' && !loading && (
        <div>
          {/* HLS output info */}
          <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', letterSpacing: 2, marginBottom: 4 }}>HLS OUTPUT</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#F0E8D4' }}>https://2.24.194.112/hls/&lt;stream-key&gt;/index.m3u8</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginTop: 3 }}>2s fragments · 10 segment playlist · compatible with any HLS player</div>
          </div>

          {activeOut.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#3D3020', letterSpacing: 2 }}>NO ACTIVE FANOUTS</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#3D3020', marginTop: 4 }}>Start a fanout from the FANOUT tab to relay your stream to YouTube, TikTok, and more</div>
            </div>
          )}

          {streamsOut.map(function(s) {
            return (
              <div key={s.roomId} style={Object.assign({}, card, { border: '1px solid rgba(201,168,76,' + (s.alive ? '.25' : '.08') + ')' })}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <AvatarPortrait username={s.roomId} size={36} isLive={s.alive} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: '#F0E8D4' }}>{maskKey(s.roomId)}</div>
                      <span style={{ background: s.alive ? 'rgba(201,168,76,.12)' : 'rgba(255,26,60,.1)', border: '1px solid ' + (s.alive ? 'rgba(201,168,76,.35)' : 'rgba(255,26,60,.3)'), borderRadius: 20, padding: '2px 9px', fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: s.alive ? '#C9A84C' : '#FF6B81', letterSpacing: 1 }}>
                        {s.alive ? '● RELAYING' : '◌ STOPPED'}
                      </span>
                    </div>
                    {s.restartCount > 0 && (
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C' }}>{'⚠ ' + s.restartCount + ' restart' + (s.restartCount > 1 ? 's' : '')}</div>
                    )}
                  </div>
                </div>
                {/* Destination badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {s.destinations.map(function(d, i) {
                    var col = PLATFORM_COLORS[d.platform] || '#8A7A62';
                    var icon = PLATFORM_ICONS[d.platform] || '→';
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: col + '12', border: '1px solid ' + col + '35', borderRadius: 6, padding: '4px 9px' }}>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: col }}>{icon} {d.platform.toUpperCase()}</span>
                      </div>
                    );
                  })}
                  {s.destinations.length === 0 && (
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#3D3020' }}>HLS only (no platform relay)</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ROOMS ── */}
      {tab === 'rooms' && !loading && (
        <div>
          {rooms.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>◈</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#3D3020', letterSpacing: 2 }}>NO ACTIVE ROOMS</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#3D3020', marginTop: 4 }}>Rooms with at least one viewer appear here</div>
            </div>
          )}
          {rooms.map(function(r) {
            return (
              <div key={r.roomId} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AvatarPortrait username={r.roomId} size={36} isLive={r.hasHost} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: '#F0E8D4', marginBottom: 2 }}>{maskKey(r.roomId)}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {r.hasHost && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 4, padding: '1px 6px' }}>HOST ONLINE</span>}
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>{r.guests + ' guest' + (r.guests !== 1 ? 's' : '')}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#C9A84C', lineHeight: 1 }}>{r.viewers}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#8A7A62' }}>VIEWERS</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div style={{ textAlign: 'center', marginTop: 16, fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#2D2540', letterSpacing: 1 }}>
        Auto-refreshes every {REFRESH_MS / 1000}s · {data ? new Date(data.ts).toLocaleTimeString() : '—'}
      </div>
    </div>
  );
}
