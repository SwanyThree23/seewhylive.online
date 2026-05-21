import React, { useState, useEffect, useRef } from 'react';

var DEMO_DURATION = 5418;

function pad2(n) { return n < 10 ? '0' + n : String(n); }
function fmtS(s) { s = s || 0; return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60); }
function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

export default function WatchPartyTab({ guests }) {
  var [playing, setPlaying]   = useState(false);
  var [prog, setProg]         = useState(14);
  var [synced, setSynced]     = useState(true);
  var [reacts, setReacts]     = useState([]);
  var liveGuests = (guests || []).filter(function(g) { return g.live !== false; });

  useEffect(function() {
    if (!playing) return;
    var t = setInterval(function() {
      setProg(function(p) { return Math.min(100, p + 0.07); });
    }, 400);
    return function() { clearInterval(t); };
  }, [playing]);

  function sendReact(emoji) {
    var id = Date.now() + Math.random();
    setReacts(function(p) { return [...p.slice(-20), { id: id, emoji: emoji, x: rnd(5, 88), sz: rnd(22, 34), dur: (rnd(16, 22) / 10) }]; });
    setTimeout(function() { setReacts(function(p) { return p.filter(function(r) { return r.id !== id; }); }); }, 2400);
  }

  var curSec = Math.floor((prog / 100) * DEMO_DURATION);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Video area */}
      <div style={{ flex: 1, background: '#000', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 180 }}>
        {/* Floating reacts */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
          {reacts.map(function(r) {
            return (
              <div key={r.id} style={{ position: 'absolute', left: r.x + '%', bottom: '8%', fontSize: r.sz, animation: 'giftRise ' + r.dur + 's ease forwards', userSelect: 'none' }}>
                {r.emoji}
              </div>
            );
          })}
        </div>

        {/* Center content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 3, padding: '20px 0' }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#7A6F90', letterSpacing: 3 }}>
            {playing ? '▶  WATCH PARTY' : '⏸  PAUSED'}
          </div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#EDE8F5', letterSpacing: 2 }}>Beat Session — Episode 7</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#7A6F90' }}>{fmtS(curSec)} / {fmtS(DEMO_DURATION)}</div>

          {/* Mini guest cells */}
          {liveGuests.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 340 }}>
              {liveGuests.slice(0, 5).map(function(g) {
                return (
                  <div key={g.userId || g.guestId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(128,0,32,.3)', border: '1px solid #C9A84C44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      🎬
                    </div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', maxWidth: 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.username || 'Guest'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {synced && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,201,167,.15)', border: '1px solid rgba(0,201,167,.4)', borderRadius: 999, padding: '2px 10px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#00C9A7', zIndex: 5 }}>🔗 SYNCED</div>
        )}

        {/* Reaction buttons */}
        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, background: 'rgba(0,0,0,.75)', borderRadius: 999, padding: '4px 10px', zIndex: 5 }}>
          {['🔥', '😂', '💎', '👑', '🎲', '❤️', '⚡', '🌟'].map(function(e) {
            return (
              <button key={e} onClick={function() { sendReact(e); }} style={{ fontSize: 16, cursor: 'pointer', background: 'none', border: 'none' }}>{e}</button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div style={{ background: '#0F0C14', borderTop: '1px solid #241C34', padding: '8px 12px', flexShrink: 0 }}>
        {/* Progress bar */}
        <div
          style={{ background: '#241C34', borderRadius: 3, height: 5, cursor: 'pointer', marginBottom: 8 }}
          onClick={function(e) {
            var r = e.currentTarget.getBoundingClientRect();
            setProg(((e.clientX - r.left) / r.width) * 100);
          }}>
          <div style={{ width: prog + '%', height: '100%', background: 'linear-gradient(90deg,#800020,#C01838)', borderRadius: 3, position: 'relative' }}>
            <div style={{ position: 'absolute', right: -5, top: -3.5, width: 12, height: 12, borderRadius: '50%', background: '#C01838', boxShadow: '0 0 8px #FF1A3C' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={function() { setPlaying(function(p) { return !p; }); }}
            style={{ background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            {playing ? '⏸' : '▶'}
          </button>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90', flexShrink: 0 }}>{fmtS(curSec)}</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={function() { setSynced(function(s) { return !s; }); }}
            style={{ background: synced ? 'rgba(0,201,167,.12)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (synced ? 'rgba(0,201,167,.4)' : '#241C34'), borderRadius: 6, padding: '5px 10px', color: synced ? '#00C9A7' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
            {synced ? '🔗 SYNCED' : '⛓ SYNC'}
          </button>
        </div>
      </div>
    </div>
  );
}
