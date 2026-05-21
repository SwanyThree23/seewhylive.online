import React, { useState } from 'react';

var INIT_BRACKETS = [
  { id: 1, p1: 'CaliBonesOG', p2: 'VibeNBones',  score: '3-2', status: 'LIVE', winner: null },
  { id: 2, p1: 'SwanyThree',  p2: 'DJ_Cipher',   score: '—',   status: 'NEXT', winner: null },
  { id: 3, p1: 'BeatKing_X',  p2: 'LyricQueen',  score: '2-1', status: 'DONE', winner: 'BeatKing_X' },
  { id: 4, p1: 'NeonBeats',   p2: 'VibeStar',    score: '3-0', status: 'DONE', winner: 'NeonBeats' },
];

var LEADERBOARD = [
  { name: 'CaliBonesOG', flag: '🇺🇸', w: 8, l: 0, pts: 240, streak: 8, color: '#C9A84C' },
  { name: 'SwanyThree',  flag: '🇺🇸', w: 7, l: 1, pts: 210, streak: 5, color: '#C01838' },
  { name: 'VibeNBones',  flag: '🇺🇸', w: 6, l: 2, pts: 180, streak: 3, color: '#00DEC0' },
  { name: 'BeatKing_X',  flag: '🇬🇧', w: 5, l: 3, pts: 150, streak: 2, color: '#C084FC' },
  { name: 'NeonBeats',   flag: '🇰🇷', w: 4, l: 4, pts: 120, streak: 0, color: '#5A8FFF' },
];

var STATUS_COLORS = { LIVE: '#FF1A3C', NEXT: '#00C9A7', DONE: '#7A6F90' };

export default function WashingtonClassicTab({ addToast }) {
  var [brackets, setBrackets] = useState(INIT_BRACKETS.map(function(b) { return Object.assign({}, b); }));
  var [view,   setView]   = useState('brackets');
  var [active, setActive] = useState(null);
  var [s1, setS1] = useState(0);
  var [s2, setS2] = useState(0);

  function openScore(b) {
    if (b.status === 'DONE') return;
    setActive(b.id);
    var parts = b.score.split('-');
    setS1(parseInt(parts[0]) || 0);
    setS2(parseInt(parts[1]) || 0);
  }

  function completeMatch(b) {
    var winner = s1 > s2 ? b.p1 : b.p2;
    setBrackets(function(p) {
      return p.map(function(x) {
        return x.id === b.id ? Object.assign({}, x, { score: s1 + '-' + s2, status: 'DONE', winner: winner }) : x;
      });
    });
    if (addToast) addToast(winner + ' advances! 🏆', 'success');
    setActive(null);
    setS1(0);
    setS2(0);
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>
      {/* Header */}
      <div style={{ background: 'rgba(128,0,32,.12)', border: '1px solid rgba(128,0,32,.35)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C', letterSpacing: 3 }}>🎲 WASHINGTON CLASSIC</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>Live domino tournament scoring · Des Moines, WA</div>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[['brackets', '🏆 BRACKETS'], ['board', '📋 LEADERBOARD']].map(function(t) {
          var active = view === t[0];
          return (
            <button
              key={t[0]}
              onClick={function() { setView(t[0]); }}
              style={{ flex: 1, padding: '8px 0', background: active ? 'rgba(128,0,32,.3)' : 'rgba(22,16,32,.7)', border: '1px solid ' + (active ? '#C9A84C44' : '#241C34'), borderRadius: 8, color: active ? '#C9A84C' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              {t[1]}
            </button>
          );
        })}
      </div>

      {/* Brackets */}
      {view === 'brackets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {brackets.map(function(b) {
            var sc = STATUS_COLORS[b.status] || '#7A6F90';
            var isActive = active === b.id;
            return (
              <div key={b.id} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + (b.status === 'LIVE' ? 'rgba(255,26,60,.4)' : '#241C34'), borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isActive ? 10 : 0 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: b.winner === b.p1 ? '#C9A84C' : '#EDE8F5' }}>{b.p1}</span>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: sc, letterSpacing: 2, minWidth: 36, textAlign: 'center' }}>{b.score}</span>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: b.winner === b.p2 ? '#C9A84C' : '#EDE8F5' }}>{b.p2}</span>
                    </div>
                    {b.winner && (
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', marginTop: 3 }}>🏆 {b.winner} advances</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
                    <span style={{ background: sc + '18', border: '1px solid ' + sc + '44', borderRadius: 999, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: sc, letterSpacing: 1 }}>
                      {b.status}
                    </span>
                    {b.status !== 'DONE' && (
                      <button
                        onClick={function() { openScore(b); }}
                        style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 6, padding: '4px 8px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer' }}>
                        SCORE
                      </button>
                    )}
                  </div>
                </div>
                {isActive && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>{b.p1}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={function() { setS1(function(n) { return Math.max(0, n - 1); }); }} style={{ background: '#241C34', border: '1px solid #241C34', borderRadius: 4, width: 24, height: 24, color: '#EDE8F5', fontSize: 14, cursor: 'pointer' }}>−</button>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#EDE8F5', minWidth: 20, textAlign: 'center' }}>{s1}</span>
                        <button onClick={function() { setS1(function(n) { return n + 1; }); }} style={{ background: '#800020', border: '1px solid #C01838', borderRadius: 4, width: 24, height: 24, color: '#C9A84C', fontSize: 14, cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#7A6F90' }}>VS</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>{b.p2}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={function() { setS2(function(n) { return Math.max(0, n - 1); }); }} style={{ background: '#241C34', border: '1px solid #241C34', borderRadius: 4, width: 24, height: 24, color: '#EDE8F5', fontSize: 14, cursor: 'pointer' }}>−</button>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#EDE8F5', minWidth: 20, textAlign: 'center' }}>{s2}</span>
                        <button onClick={function() { setS2(function(n) { return n + 1; }); }} style={{ background: '#800020', border: '1px solid #C01838', borderRadius: 4, width: 24, height: 24, color: '#C9A84C', fontSize: 14, cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, marginLeft: 'auto' }}>
                      <button onClick={function() { setActive(null); }} style={{ background: 'none', border: '1px solid #241C34', borderRadius: 6, padding: '5px 10px', color: '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>CANCEL</button>
                      <button onClick={function() { completeMatch(b); }} style={{ background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 6, padding: '5px 12px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>FINALIZE</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard */}
      {view === 'board' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {LEADERBOARD.map(function(p, i) {
            return (
              <div key={p.name} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + (i === 0 ? '#C9A84C44' : '#241C34'), borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: i === 0 ? '#C9A84C' : i === 1 ? '#C0C0C0' : i === 2 ? '#cd7f32' : '#7A6F90', width: 24, textAlign: 'center', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{p.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: p.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>{p.w}W · {p.l}L{p.streak > 0 ? ' · ' + p.streak + '🔥' : ''}</div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#EDE8F5', flexShrink: 0 }}>{p.pts}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
