import React, { useState } from 'react';

var ROUND_KEYS   = ['qf', 'sf', 'fn'];
var ROUND_LABELS = { qf: 'QUARTERFINALS', sf: 'SEMIFINALS', fn: 'THE FINALS' };
var ROUND_SHORT  = { qf: 'QF', sf: 'SF', fn: 'FINALS' };

var INIT_QF = [
  { id: 1, p1: 'CaliBonesOG', p2: 'DJ_Phantom',  score: '3-2', status: 'DONE', winner: 'CaliBonesOG' },
  { id: 2, p1: 'SwanyThree',  p2: 'VibeNBones',   score: '—',   status: 'LIVE', winner: null },
  { id: 3, p1: 'BeatKing_X',  p2: 'LyricQueen',   score: '2-1', status: 'DONE', winner: 'BeatKing_X' },
  { id: 4, p1: 'NeonBeats',   p2: 'VibeStar',     score: '3-0', status: 'DONE', winner: 'NeonBeats' },
];
var INIT_SF = [
  { id: 5, p1: 'CaliBonesOG', p2: 'TBD', score: '—', status: 'NEXT', winner: null },
  { id: 6, p1: 'BeatKing_X',  p2: 'NeonBeats', score: '—', status: 'NEXT', winner: null },
];
var INIT_FN = [
  { id: 7, p1: 'TBD', p2: 'TBD', score: '—', status: 'NEXT', winner: null },
];

var LEADERBOARD = [
  { name: 'CaliBonesOG', flag: '🇺🇸', w: 8, l: 0, pts: 240, streak: 8, color: '#C9A84C' },
  { name: 'SwanyThree',  flag: '🇺🇸', w: 7, l: 1, pts: 210, streak: 5, color: '#C01838' },
  { name: 'VibeNBones',  flag: '🇺🇸', w: 6, l: 2, pts: 180, streak: 3, color: '#00DEC0' },
  { name: 'BeatKing_X',  flag: '🇬🇧', w: 5, l: 3, pts: 150, streak: 2, color: '#C084FC' },
  { name: 'NeonBeats',   flag: '🇰🇷', w: 4, l: 4, pts: 120, streak: 0, color: '#5A8FFF' },
  { name: 'LyricQueen',  flag: '🇺🇸', w: 3, l: 5, pts: 90,  streak: 0, color: '#FF8C5A' },
  { name: 'DJ_Phantom',  flag: '🇺🇸', w: 2, l: 6, pts: 60,  streak: 0, color: '#7A6F90' },
  { name: 'VibeStar',    flag: '🇯🇵', w: 1, l: 7, pts: 30,  streak: 0, color: '#EDE8F5' },
];

var PLAYER_STATS = [
  { name: 'CaliBonesOG', avgScore: 28.4, highGame: 35, winPct: 100, dominoes: 142, pts: 240, color: '#C9A84C' },
  { name: 'SwanyThree',  avgScore: 26.1, highGame: 33, winPct: 87,  dominoes: 130, pts: 210, color: '#C01838' },
  { name: 'VibeNBones',  avgScore: 23.8, highGame: 31, winPct: 75,  dominoes: 119, pts: 180, color: '#00DEC0' },
  { name: 'BeatKing_X',  avgScore: 21.5, highGame: 30, winPct: 63,  dominoes: 107, pts: 150, color: '#C084FC' },
  { name: 'NeonBeats',   avgScore: 19.2, highGame: 27, winPct: 50,  dominoes: 96,  pts: 120, color: '#5A8FFF' },
];

var STATUS_COLORS = { LIVE: '#FF1A3C', NEXT: '#00C9A7', DONE: '#7A6F90' };

function cloneMatches(arr) {
  return arr.map(function(b) { return Object.assign({}, b); });
}

export default function WashingtonClassicTab({ addToast }) {
  var [qf,      setQf]      = useState(cloneMatches(INIT_QF));
  var [sf,      setSf]      = useState(cloneMatches(INIT_SF));
  var [finals,  setFinals]  = useState(cloneMatches(INIT_FN));
  var [view,    setView]    = useState('brackets');
  var [round,   setRound]   = useState('qf');
  var [activeId,setActiveId]= useState(null);
  var [s1,      setS1]      = useState(0);
  var [s2,      setS2]      = useState(0);

  function getRound(r) { return r === 'qf' ? qf : r === 'sf' ? sf : finals; }

  function setRoundUpdater(r, updater) {
    if (r === 'qf') setQf(updater);
    else if (r === 'sf') setSf(updater);
    else setFinals(updater);
  }

  function openScore(b) {
    if (b.status === 'DONE') return;
    setActiveId(b.id);
    var parts = (b.score || '').split('-');
    setS1(parseInt(parts[0]) || 0);
    setS2(parseInt(parts[1]) || 0);
  }

  function completeMatch(b) {
    var winner = s1 > s2 ? b.p1 : b.p2;
    setRoundUpdater(round, function(prev) {
      return prev.map(function(x) {
        return x.id === b.id ? Object.assign({}, x, { score: s1 + '-' + s2, status: 'DONE', winner: winner }) : x;
      });
    });
    if (addToast) addToast(winner + ' advances! 🏆', 'success');
    setActiveId(null);
    setS1(0);
    setS2(0);
  }

  var brackets = getRound(round);
  var champion = finals[0] && finals[0].status === 'DONE' ? finals[0].winner : null;

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* Header */}
      <div style={{ background: 'rgba(128,0,32,.12)', border: '1px solid rgba(128,0,32,.35)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C', letterSpacing: 3 }}>🎲 WASHINGTON CLASSIC</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90' }}>Live domino tournament scoring · Des Moines, WA</div>
        {champion && (
          <div style={{ marginTop: 7, padding: '4px 10px', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 6, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#C9A84C', textAlign: 'center', letterSpacing: 2 }}>
            🏆 CHAMPION: {champion}
          </div>
        )}
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[['brackets', '🏆 BRACKETS'], ['board', '📋 STANDINGS'], ['stats', '📊 STATS']].map(function(t) {
          var isActive = view === t[0];
          return (
            <button key={t[0]} onClick={function() { setView(t[0]); }}
              style={{ flex: 1, padding: '8px 0', background: isActive ? 'rgba(128,0,32,.3)' : 'rgba(22,16,32,.7)', border: '1px solid ' + (isActive ? '#C9A84C44' : '#241C34'), borderRadius: 8, color: isActive ? '#C9A84C' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              {t[1]}
            </button>
          );
        })}
      </div>

      {/* ── BRACKETS ── */}
      {view === 'brackets' && (
        <>
          {/* Round selector */}
          <div style={{ display: 'flex', gap: 3, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: 3 }}>
            {ROUND_KEYS.map(function(rk) {
              var isActive = round === rk;
              var matches  = getRound(rk);
              var done = matches.filter(function(m) { return m.status === 'DONE'; }).length;
              return (
                <button key={rk} onClick={function() { setRound(rk); setActiveId(null); }}
                  style={{ flex: 1, padding: '6px 4px', background: isActive ? 'rgba(201,168,76,.12)' : 'transparent', border: 'none', borderRadius: 6, color: isActive ? '#C9A84C' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1, textAlign: 'center' }}>
                  <div>{ROUND_SHORT[rk]}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3450' }}>{done}/{matches.length}</div>
                </button>
              );
            })}
          </div>

          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 3, textAlign: 'center' }}>{ROUND_LABELS[round]}</div>

          {/* Match cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {brackets.map(function(b) {
              var sc = STATUS_COLORS[b.status] || '#7A6F90';
              var isActiveMatch = activeId === b.id;
              var isTbd = b.p1 === 'TBD' || b.p2 === 'TBD';
              return (
                <div key={b.id} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + (b.status === 'LIVE' ? 'rgba(255,26,60,.4)' : '#241C34'), borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isActiveMatch ? 10 : 0 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: b.winner === b.p1 ? '#C9A84C' : isTbd ? '#3D3450' : '#EDE8F5' }}>{b.p1}</span>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: sc, letterSpacing: 2, minWidth: 34, textAlign: 'center' }}>{b.score}</span>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: b.winner === b.p2 ? '#C9A84C' : isTbd ? '#3D3450' : '#EDE8F5' }}>{b.p2}</span>
                      </div>
                      {b.winner && (
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', marginTop: 3 }}>🏆 {b.winner} advances</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
                      <span style={{ background: sc + '18', border: '1px solid ' + sc + '44', borderRadius: 999, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: sc, letterSpacing: 1 }}>{b.status}</span>
                      {b.status !== 'DONE' && !isTbd && (
                        <button onClick={function() { openScore(b); }}
                          style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 6, padding: '4px 8px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer' }}>
                          SCORE
                        </button>
                      )}
                    </div>
                  </div>
                  {isActiveMatch && (
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
                        <button onClick={function() { setActiveId(null); }} style={{ background: 'none', border: '1px solid #241C34', borderRadius: 6, padding: '5px 10px', color: '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>CANCEL</button>
                        <button onClick={function() { completeMatch(b); }} style={{ background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 6, padding: '5px 12px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>FINALIZE</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── STANDINGS ── */}
      {view === 'board' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 10, padding: '0 12px' }}>
            <div style={{ width: 24, flexShrink: 0 }} />
            <div style={{ width: 18, flexShrink: 0 }} />
            <div style={{ flex: 1 }} />
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3450', width: 24, textAlign: 'center' }}>W</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3450', width: 24, textAlign: 'center' }}>L</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3450', width: 30, textAlign: 'right' }}>PTS</div>
          </div>
          {LEADERBOARD.map(function(p, i) {
            return (
              <div key={p.name} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + (i === 0 ? '#C9A84C44' : '#241C34'), borderRadius: 10, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: i === 0 ? '#C9A84C' : i === 1 ? '#C0C0C0' : i === 2 ? '#cd7f32' : '#7A6F90', width: 24, textAlign: 'center', flexShrink: 0 }}>{i + 1}</div>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{p.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: p.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  {p.streak > 0 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#C9A84C' }}>{p.streak}🔥 streak</div>}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#00C96A', width: 24, textAlign: 'center', flexShrink: 0 }}>{p.w}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#FF4060', width: 24, textAlign: 'center', flexShrink: 0 }}>{p.l}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#EDE8F5', width: 30, textAlign: 'right', flexShrink: 0 }}>{p.pts}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── STATS ── */}
      {view === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 2, textAlign: 'center' }}>TOP 5 — SESSION STATS</div>
          {PLAYER_STATS.map(function(p, i) {
            var winBarW = Math.floor(p.winPct);
            return (
              <div key={p.name} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid ' + (i === 0 ? p.color + '55' : '#241C34'), borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: i === 0 ? '#C9A84C' : '#7A6F90', width: 20, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: p.color, flex: 1 }}>{p.name}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: p.color, lineHeight: 1 }}>
                    {p.pts}<span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', marginLeft: 3 }}>PTS</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginBottom: 8 }}>
                  {[['AVG SCORE', p.avgScore], ['HIGH GAME', p.highGame], ['DOMINOES', p.dominoes]].map(function(stat) {
                    return (
                      <div key={stat[0]} style={{ background: 'rgba(7,5,10,.5)', borderRadius: 6, padding: '5px 6px', textAlign: 'center' }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#7A6F90', letterSpacing: 1, marginBottom: 2 }}>{stat[0]}</div>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#EDE8F5', lineHeight: 1 }}>{stat[1]}</div>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#7A6F90' }}>WIN RATE</span>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: p.color }}>{p.winPct}%</span>
                  </div>
                  <div style={{ height: 4, background: '#241C34', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: winBarW + '%', height: '100%', background: 'linear-gradient(90deg,' + p.color + '66,' + p.color + ')', borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
