import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

// ─── Earth Tone Palette ───────────────────────────────────────────────────────
var BG     = '#0E0C09';
var SURF   = '#1A1510';
var CARD   = '#241C12';
var CARD2  = '#2E2318';
var DIM    = '#3D3020';

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
  { name: 'CaliBonesOG', flag: '&#x1F1FA;&#x1F1F8;', w: 8, l: 0, pts: 240, streak: 8, color: '#C9A84C' },
  { name: 'SwanyThree',  flag: '&#x1F1FA;&#x1F1F8;', w: 7, l: 1, pts: 210, streak: 5, color: '#C01838' },
  { name: 'VibeNBones',  flag: '&#x1F1FA;&#x1F1F8;', w: 6, l: 2, pts: 180, streak: 3, color: '#D4854A' },
  { name: 'BeatKing_X',  flag: '&#x1F1EC;&#x1F1E7;', w: 5, l: 3, pts: 150, streak: 2, color: '#D4854A' },
  { name: 'NeonBeats',   flag: '&#x1F1F0;&#x1F1F7;', w: 4, l: 4, pts: 120, streak: 0, color: '#C9A84C' },
  { name: 'LyricQueen',  flag: '&#x1F1FA;&#x1F1F8;', w: 3, l: 5, pts: 90,  streak: 0, color: '#FF8C5A' },
  { name: 'DJ_Phantom',  flag: '&#x1F1FA;&#x1F1F8;', w: 2, l: 6, pts: 60,  streak: 0, color: '#8A7A62' },
  { name: 'VibeStar',    flag: '&#x1F1EF;&#x1F1F5;', w: 1, l: 7, pts: 30,  streak: 0, color: '#F0E8D4' },
];

var PLAYER_STATS = [
  { name: 'CaliBonesOG', avgScore: 28.4, highGame: 35, winPct: 100, dominoes: 142, pts: 240, color: '#C9A84C' },
  { name: 'SwanyThree',  avgScore: 26.1, highGame: 33, winPct: 87,  dominoes: 130, pts: 210, color: '#C01838' },
  { name: 'VibeNBones',  avgScore: 23.8, highGame: 31, winPct: 75,  dominoes: 119, pts: 180, color: '#D4854A' },
  { name: 'BeatKing_X',  avgScore: 21.5, highGame: 30, winPct: 63,  dominoes: 107, pts: 150, color: '#D4854A' },
  { name: 'NeonBeats',   avgScore: 19.2, highGame: 27, winPct: 50,  dominoes: 96,  pts: 120, color: '#C9A84C' },
];

var STATUS_COLORS = { LIVE: '#FF1A3C', NEXT: '#D4854A', DONE: '#8A7A62' };

var PRIZE_POOL = [
  { place: 1,    label: '1ST',         prize: 50000, color: '#C9A84C', icon: '&#x1F947;' },
  { place: 2,    label: '2ND',         prize: 25000, color: '#C0C0C0', icon: '&#x1F948;' },
  { place: 3,    label: '3RD',         prize: 10000, color: '#cd7f32', icon: '&#x1F949;' },
  { place: '4',  label: '4TH',         prize: 5000,  color: '#8A7A62', icon: '4️⃣' },
  { place: '5-8',label: '5TH-8TH',     prize: 1000,  color: '#3D3020', icon: '&#x1F396;' },
];
var PRIZE_TOTAL = PRIZE_POOL.reduce(function(s, p) { return s + (p.place === '5-8' ? p.prize * 4 : p.prize); }, 0);

function cloneMatches(arr) {
  return arr.map(function(b) { return Object.assign({}, b); });
}

function BracketCell(props) {
  var match   = props.match;
  var isFinal = props.isFinal;
  if (!match) return null;
  var sc = STATUS_COLORS[match.status] || '#8A7A62';
  var bc = match.status === 'LIVE' ? 'rgba(255,26,60,.45)' : isFinal ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.07)';
  var p1c = match.winner === match.p1 ? '#C9A84C' : match.p1 === 'TBD' ? '#3D3020' : '#F0E8D4';
  var p2c = match.winner === match.p2 ? '#C9A84C' : match.p2 === 'TBD' ? '#3D3020' : '#F0E8D4';
  return (
    <div style={{ background: isFinal ? 'rgba(128,0,32,.2)' : 'rgba(26,21,16,.95)', border: '1px solid ' + bc, borderRadius: 7, padding: '7px 8px', boxShadow: match.status === 'LIVE' ? '0 0 10px rgba(255,26,60,.15)' : 'none', minHeight: 60 }}>
      {isFinal && (
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#C9A84C', letterSpacing: 2, marginBottom: 3, textAlign: 'center' }}>&#x1F3C6; FINAL</div>
      )}
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: p1c, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.p1}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '3px 0', gap: 4 }}>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: sc, letterSpacing: 1 }}>{match.score}</span>
        {match.status === 'LIVE' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF1A3C', display: 'inline-block', boxShadow: '0 0 4px #FF1A3C' }} />}
      </div>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: p2c, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.p2}</div>
      {match.winner && (
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#C9A84C', marginTop: 3 }}>&#x1F3C6; {match.winner}</div>
      )}
    </div>
  );
}

export default function WashingtonClassicTab({ addToast, isLive, socket, roomId, role }) {
  var [qf,         setQf]         = useState(cloneMatches(INIT_QF));
  var [sf,         setSf]         = useState(cloneMatches(INIT_SF));
  var [finals,     setFinals]     = useState(cloneMatches(INIT_FN));
  var [view,       setView]       = useState('brackets');
  var [round,      setRound]      = useState('qf');
  var [activeId,   setActiveId]   = useState(null);
  var [s1,         setS1]         = useState(0);
  var [s2,         setS2]         = useState(0);
  var [autoScore,    setAutoScore]    = useState(false);
  var [liveScores,   setLiveScores]   = useState(null);
  var [possession,   setPossession]   = useState(0);
  var [bracketMode,  setBracketMode]  = useState('list');
  var [editMode,     setEditMode]     = useState(false);
  var [editScores,   setEditScores]   = useState({});  // matchId -> { score, status, winner }
  var autoRef = useRef(null);

  // ── Socket: real-time bracket updates ─────────────────────────────────────
  useEffect(function() {
    if (!socket) return;
    function onBracketUpdate(data) {
      if (data.round === 'qf') setQf(function(prev) { return prev.map(function(m) { return m.id === data.matchId ? Object.assign({}, m, { score: data.score, status: data.status, winner: data.winner || m.winner }) : m; }); });
      if (data.round === 'sf') setSf(function(prev) { return prev.map(function(m) { return m.id === data.matchId ? Object.assign({}, m, { score: data.score, status: data.status, winner: data.winner || m.winner }) : m; }); });
      if (data.round === 'fn') setFinals(function(prev) { return prev.map(function(m) { return m.id === data.matchId ? Object.assign({}, m, { score: data.score, status: data.status, winner: data.winner || m.winner }) : m; }); });
    }
    socket.on('bracket-update', onBracketUpdate);
    return function() { socket.off('bracket-update', onBracketUpdate); };
  }, [socket]);

  var isHost = role === 'host' || role === 'cohost';

  function getEditVal(matchId, key, fallback) {
    return editScores[matchId] && editScores[matchId][key] !== undefined ? editScores[matchId][key] : fallback;
  }

  function setEditVal(matchId, key, val) {
    setEditScores(function(prev) {
      var entry = Object.assign({}, prev[matchId] || {});
      entry[key] = val;
      var next = Object.assign({}, prev);
      next[matchId] = entry;
      return next;
    });
  }

  function saveEditedMatch(rk, match) {
    var newScore  = getEditVal(match.id, 'score',  match.score);
    var newStatus = getEditVal(match.id, 'status', match.status);
    var newWinner = getEditVal(match.id, 'winner', match.winner);
    if (socket && roomId) {
      socket.emit('bracket-update', { roomId: roomId, round: rk, matchId: match.id, score: newScore, status: newStatus, winner: newWinner });
    }
    // Local update too
    if (rk === 'qf') setQf(function(prev) { return prev.map(function(m) { return m.id === match.id ? Object.assign({}, m, { score: newScore, status: newStatus, winner: newWinner || m.winner }) : m; }); });
    if (rk === 'sf') setSf(function(prev) { return prev.map(function(m) { return m.id === match.id ? Object.assign({}, m, { score: newScore, status: newStatus, winner: newWinner || m.winner }) : m; }); });
    if (rk === 'fn') setFinals(function(prev) { return prev.map(function(m) { return m.id === match.id ? Object.assign({}, m, { score: newScore, status: newStatus, winner: newWinner || m.winner }) : m; }); });
    if (addToast) addToast('Score updated!', 'success');
  }

  useEffect(function() {
    if (!autoScore) {
      if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; }
      return;
    }
    autoRef.current = setInterval(function() {
      setQf(function(prev) {
        return prev.map(function(b) {
          if (b.status !== 'LIVE') return b;
          var parts = (b.score === '—' ? '0-0' : b.score).split('-');
          var a = parseInt(parts[0]) || 0;
          var bv = parseInt(parts[1]) || 0;
          if (Math.random() > 0.5) { a++; } else { bv++; }
          var newScore = a + '-' + bv;
          var newStatus = (a >= 5 || bv >= 5) ? 'DONE' : 'LIVE';
          var winner = newStatus === 'DONE' ? (a >= 5 ? b.p1 : b.p2) : null;
          if (winner && addToast) addToast(winner + ' wins the match! &#x1F3C6;', 'success');
          return Object.assign({}, b, { score: newScore, status: newStatus, winner: winner });
        });
      });
    }, 1800);
    return function() { if (autoRef.current) clearInterval(autoRef.current); };
  }, [autoScore, addToast]);

  // Seed liveScores from current LIVE match state (no auto-increment)
  useEffect(function() {
    if (!isLive) {
      setLiveScores(null);
      setPossession(0);
      return;
    }
    setLiveScores(function(prev) {
      if (prev) return prev;
      var liveMatch = null;
      for (var i = 0; i < qf.length; i++) {
        if (qf[i].status === 'LIVE') { liveMatch = qf[i]; break; }
      }
      if (!liveMatch) return { p1score: 0, p2score: 0, matchId: null };
      var parts = (liveMatch.score === '—' ? '0-0' : liveMatch.score).split('-');
      return { p1score: parseInt(parts[0]) || 0, p2score: parseInt(parts[1]) || 0, matchId: liveMatch.id };
    });
  }, [isLive]);

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
    if (addToast) addToast(winner + ' advances! &#x1F3C6;', 'success');
    setActiveId(null);
    setS1(0);
    setS2(0);
  }

  var [bracketCopied, setBracketCopied] = useState(false);

  function shareBracket() {
    var lines = ['🏆 WASHINGTON CLASSIC — Bracket Update'];
    var allMatches = qf.concat(sf).concat(finals);
    for (var i = 0; i < allMatches.length; i++) {
      var m = allMatches[i];
      var statusStr = m.status === 'LIVE' ? '🔴 LIVE' : m.status === 'DONE' ? '✓ DONE' : '⏳ NEXT';
      lines.push(statusStr + ' · ' + m.p1 + ' vs ' + m.p2 + ' · ' + m.score + (m.winner ? ' · Winner: ' + m.winner : ''));
    }
    if (champion) lines.push('🏆 CHAMPION: ' + champion);
    lines.push('Watch live at seewhylive.online');
    var text = lines.join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        setBracketCopied(true);
        setTimeout(function() { setBracketCopied(false); }, 2000);
      }).catch(function() {});
    }
    if (addToast) addToast('Bracket copied to clipboard!', 'success');
  }

  var brackets = getRound(round);
  var champion = finals[0] && finals[0].status === 'DONE' ? finals[0].winner : null;

  // Find the LIVE match for live score overlay
  var liveMatchForOverlay = null;
  for (var mi = 0; mi < qf.length; mi++) {
    if (qf[mi].status === 'LIVE') { liveMatchForOverlay = qf[mi]; break; }
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* Header */}
      <div style={{ background: 'rgba(128,0,32,.12)', border: '1px solid rgba(128,0,32,.35)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C', letterSpacing: 3 }}>&#x1F3B2; WASHINGTON CLASSIC</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62' }}>Live domino tournament scoring \xB7 Des Moines, WA</div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {isHost && (
              <button onClick={function() { setEditMode(function(v) { return !v; }); }}
                style={{ background: editMode ? 'rgba(212,133,74,.2)' : 'rgba(201,168,76,.1)', border: '1px solid ' + (editMode ? 'rgba(212,133,74,.5)' : 'rgba(201,168,76,.3)'), borderRadius: 6, padding: '5px 10px', color: editMode ? '#D4854A' : '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
                {editMode ? '✓ DONE' : '📝 EDIT'}
              </button>
            )}
            <button onClick={shareBracket} style={{ background: bracketCopied ? 'rgba(212,133,74,.15)' : 'rgba(201,168,76,.1)', border: '1px solid ' + (bracketCopied ? 'rgba(212,133,74,.4)' : 'rgba(201,168,76,.3)'), borderRadius: 6, padding: '5px 10px', color: bracketCopied ? '#D4854A' : '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
              {bracketCopied ? '✓ COPIED' : '📤 SHARE'}
            </button>
          </div>
        </div>
        {champion && (
          <div style={{ marginTop: 7, padding: '4px 10px', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 6, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#C9A84C', textAlign: 'center', letterSpacing: 2 }}>
            &#x1F3C6; CHAMPION: {champion}
          </div>
        )}
      </div>

      {/* Live score panel — shown when isLive and there is a LIVE match */}
      {isLive && liveMatchForOverlay && liveScores && (
        <div style={{ background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 10, padding: '12px 14px', boxShadow: '0 0 18px rgba(255,26,60,.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 6px #FF1A3C' }} />
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 11, color: '#FF1A3C', letterSpacing: 2 }}>LIVE SCORE</span>
            </div>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>auto-updating</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <AvatarPortrait username={liveMatchForOverlay.p1} size={44} isLive={true} />
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#F0E8D4' }}>{liveMatchForOverlay.p1}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: '#C9A84C', lineHeight: 1 }}>{liveScores.p1score}</div>
              {possession === 0 && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#D4854A' }}>&#x25B6; POSSESSION</div>
              )}
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#8A7A62', padding: '0 10px' }}>VS</div>
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <AvatarPortrait username={liveMatchForOverlay.p2} size={44} isLive={true} />
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#F0E8D4' }}>{liveMatchForOverlay.p2}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: '#C9A84C', lineHeight: 1 }}>{liveScores.p2score}</div>
              {possession === 1 && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#D4854A' }}>&#x25B6; POSSESSION</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auto-score toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(26,21,16,.6)', border: '1px solid #3D3020', borderRadius: 8, padding: '7px 12px' }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 1 }}>&#x26A1; LIVE AUTO-SCORING</span>
        <button onClick={function() { setAutoScore(function(v) { return !v; }); }}
          style={{ background: autoScore ? 'rgba(255,26,60,.2)' : 'rgba(201,168,76,.1)', border: '1px solid ' + (autoScore ? 'rgba(255,26,60,.5)' : 'rgba(201,168,76,.3)'), borderRadius: 999, padding: '3px 14px', color: autoScore ? '#FF6B81' : '#C9A84C', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: 1 }}>
          {autoScore ? '&#x23F9; STOP' : '&#x25B6; START'}
        </button>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[['brackets', '&#x1F3C6; BRACKETS'], ['board', '&#x1F4CB; STANDINGS'], ['stats', '&#x1F4CA; STATS'], ['prizes', '&#x1F4B0; PRIZES']].map(function(t) {
          var isActive = view === t[0];
          return (
            <button key={t[0]} onClick={function() { setView(t[0]); }}
              style={{ flex: 1, padding: '8px 0', background: isActive ? 'rgba(128,0,32,.3)' : 'rgba(26,21,16,.7)', border: '1px solid ' + (isActive ? '#C9A84C44' : '#241C12'), borderRadius: 8, color: isActive ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              {t[1]}
            </button>
          );
        })}
      </div>

      {/* ── BRACKETS ── */}
      {view === 'brackets' && (
        <div>
          {/* Round selector */}
          <div style={{ display: 'flex', gap: 3, background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 8, padding: 3, marginBottom: 8 }}>
            {ROUND_KEYS.map(function(rk) {
              var isActive = round === rk;
              var matches  = getRound(rk);
              var done = matches.filter(function(m) { return m.status === 'DONE'; }).length;
              return (
                <button key={rk} onClick={function() { setRound(rk); setActiveId(null); }}
                  style={{ flex: 1, padding: '6px 4px', background: isActive ? 'rgba(201,168,76,.12)' : 'transparent', border: 'none', borderRadius: 6, color: isActive ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1, textAlign: 'center' }}>
                  <div>{ROUND_SHORT[rk]}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3020' }}>{done}/{matches.length}</div>
                </button>
              );
            })}
          </div>

          {/* List / Tree mode toggle */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 8, background: 'rgba(14,12,9,.8)', border: '1px solid #3D3020', borderRadius: 7, padding: 3 }}>
            {[['list', '&#x2630; LIST'], ['tree', '&#x1F333; FULL BRACKET']].map(function(m) {
              var active = bracketMode === m[0];
              return (
                <button key={m[0]} onClick={function() { setBracketMode(m[0]); }}
                  style={{ flex: 1, padding: '5px', background: active ? 'rgba(201,168,76,.12)' : 'transparent', border: 'none', borderRadius: 5, color: active ? '#C9A84C' : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
                  {m[1]}
                </button>
              );
            })}
          </div>

          {/* ── VISUAL BRACKET TREE ── */}
          {bracketMode === 'tree' && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 360, height: 330 }}>

                {/* QF column — 4 matches spread vertically */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', width: 108, flexShrink: 0, gap: 6 }}>
                  {qf.map(function(m) { return <BracketCell key={m.id} match={m} />; })}
                </div>

                {/* QF → SF connector */}
                <div style={{ display: 'flex', flexDirection: 'column', width: 16, flexShrink: 0 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, borderRight: '1px solid rgba(201,168,76,.25)', borderBottom: '1px solid rgba(201,168,76,.25)', borderBottomRightRadius: 3 }} />
                    <div style={{ flex: 1, borderRight: '1px solid rgba(201,168,76,.25)', borderTop: '1px solid rgba(201,168,76,.25)', borderTopRightRadius: 3 }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, borderRight: '1px solid rgba(201,168,76,.25)', borderBottom: '1px solid rgba(201,168,76,.25)', borderBottomRightRadius: 3 }} />
                    <div style={{ flex: 1, borderRight: '1px solid rgba(201,168,76,.25)', borderTop: '1px solid rgba(201,168,76,.25)', borderTopRightRadius: 3 }} />
                  </div>
                </div>

                {/* SF column — 2 matches centered in each QF-pair half */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', width: 108, flexShrink: 0, gap: 6 }}>
                  {sf.map(function(m) { return <BracketCell key={m.id} match={m} />; })}
                </div>

                {/* SF → Finals connector */}
                <div style={{ display: 'flex', flexDirection: 'column', width: 16, flexShrink: 0 }}>
                  <div style={{ flex: 1, borderRight: '1px solid rgba(201,168,76,.4)', borderBottom: '1px solid rgba(201,168,76,.4)', borderBottomRightRadius: 3 }} />
                  <div style={{ flex: 1, borderRight: '1px solid rgba(201,168,76,.4)', borderTop: '1px solid rgba(201,168,76,.4)', borderTopRightRadius: 3 }} />
                </div>

                {/* Finals — centered vertically */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                  <BracketCell match={finals[0]} isFinal={true} />
                </div>
              </div>

              {/* Round labels below */}
              <div style={{ display: 'flex', marginTop: 6, gap: 0 }}>
                <div style={{ width: 108, textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1, flexShrink: 0 }}>QF</div>
                <div style={{ width: 16, flexShrink: 0 }} />
                <div style={{ width: 108, textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1, flexShrink: 0 }}>SEMI</div>
                <div style={{ width: 16, flexShrink: 0 }} />
                <div style={{ flex: 1, textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 1 }}>FINALS</div>
              </div>
            </div>
          )}

          {/* ── MATCH LIST ── */}
          {bracketMode === 'list' && (
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', letterSpacing: 3, textAlign: 'center', marginBottom: 8 }}>{ROUND_LABELS[round]}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {brackets.map(function(b) {
              var sc = STATUS_COLORS[b.status] || '#8A7A62';
              var isActiveMatch = activeId === b.id;
              var isTbd = b.p1 === 'TBD' || b.p2 === 'TBD';
              var isLiveMatch = b.status === 'LIVE';
              var showLiveOverlay = isLive && isLiveMatch && liveScores;
              var displayP1Score = showLiveOverlay ? (liveScores.p1score || 0) : null;
              var displayP2Score = showLiveOverlay ? (liveScores.p2score || 0) : null;
              return (
                <div key={b.id} style={{ background: 'rgba(26,21,16,.8)', border: '1px solid ' + (isLiveMatch && isLive ? 'rgba(255,26,60,.4)' : b.status === 'LIVE' ? 'rgba(255,26,60,.4)' : '#241C12'), borderRadius: 10, padding: '10px 12px', boxShadow: isLiveMatch && isLive ? '0 0 12px rgba(255,26,60,.1)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isActiveMatch ? 10 : 0 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: b.winner === b.p1 ? '#C9A84C' : isTbd ? '#3D3020' : '#F0E8D4' }}>{b.p1}</span>
                        {showLiveOverlay ? (
                          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C9A84C', letterSpacing: 2, minWidth: 50, textAlign: 'center' }}>
                            {displayP1Score} - {displayP2Score}
                          </span>
                        ) : (
                          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: sc, letterSpacing: 2, minWidth: 34, textAlign: 'center' }}>{b.score}</span>
                        )}
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: b.winner === b.p2 ? '#C9A84C' : isTbd ? '#3D3020' : '#F0E8D4' }}>{b.p2}</span>
                      </div>
                      {showLiveOverlay && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 5px #FF1A3C' }} />
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81', letterSpacing: 1 }}>LIVE SCORE</span>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginLeft: 6 }}>
                            {possession === 0 ? b.p1 : b.p2} &#x25B6; POSSESSION
                          </span>
                        </div>
                      )}
                      {b.winner && (
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', marginTop: 3 }}>&#x1F3C6; {b.winner} advances</div>
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
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>{b.p1}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={function() { setS1(function(n) { return Math.max(0, n - 1); }); }} style={{ background: '#241C12', border: '1px solid #241C12', borderRadius: 4, width: 24, height: 24, color: '#F0E8D4', fontSize: 14, cursor: 'pointer' }}>−</button>
                          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#F0E8D4', minWidth: 20, textAlign: 'center' }}>{s1}</span>
                          <button onClick={function() { setS1(function(n) { return n + 1; }); }} style={{ background: '#800020', border: '1px solid #C01838', borderRadius: 4, width: 24, height: 24, color: '#C9A84C', fontSize: 14, cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#8A7A62' }}>VS</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>{b.p2}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={function() { setS2(function(n) { return Math.max(0, n - 1); }); }} style={{ background: '#241C12', border: '1px solid #241C12', borderRadius: 4, width: 24, height: 24, color: '#F0E8D4', fontSize: 14, cursor: 'pointer' }}>−</button>
                          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#F0E8D4', minWidth: 20, textAlign: 'center' }}>{s2}</span>
                          <button onClick={function() { setS2(function(n) { return n + 1; }); }} style={{ background: '#800020', border: '1px solid #C01838', borderRadius: 4, width: 24, height: 24, color: '#C9A84C', fontSize: 14, cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 5, marginLeft: 'auto' }}>
                        <button onClick={function() { setActiveId(null); }} style={{ background: 'none', border: '1px solid #241C12', borderRadius: 6, padding: '5px 10px', color: '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>CANCEL</button>
                        <button onClick={function() { completeMatch(b); }} style={{ background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 6, padding: '5px 12px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>FINALIZE</button>
                      </div>
                    </div>
                  )}
                  {editMode && isHost && (
                    <div style={{ marginTop: 8, padding: '8px', background: 'rgba(212,133,74,.06)', border: '1px solid rgba(212,133,74,.2)', borderRadius: 7, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#D4854A', letterSpacing: 1 }}>📝 EDIT SCORE</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          value={getEditVal(b.id, 'score', b.score)}
                          onChange={function(e) { setEditVal(b.id, 'score', e.target.value); }}
                          placeholder="e.g. 3-2"
                          style={{ background: '#241C12', border: '1px solid rgba(212,133,74,.35)', borderRadius: 5, padding: '4px 7px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 9, width: 60, outline: 'none' }}
                        />
                        <select
                          value={getEditVal(b.id, 'status', b.status)}
                          onChange={function(e) { setEditVal(b.id, 'status', e.target.value); }}
                          style={{ background: '#241C12', border: '1px solid rgba(212,133,74,.35)', borderRadius: 5, padding: '4px 7px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 9, outline: 'none' }}>
                          <option value="NEXT">NEXT</option>
                          <option value="LIVE">LIVE</option>
                          <option value="DONE">DONE</option>
                        </select>
                        <input
                          value={getEditVal(b.id, 'winner', b.winner || '')}
                          onChange={function(e) { setEditVal(b.id, 'winner', e.target.value); }}
                          placeholder="Winner name"
                          style={{ background: '#241C12', border: '1px solid rgba(212,133,74,.35)', borderRadius: 5, padding: '4px 7px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 9, width: 90, outline: 'none' }}
                        />
                        <button onClick={function() { saveEditedMatch(round, b); }}
                          style={{ background: 'rgba(212,133,74,.2)', border: '1px solid rgba(212,133,74,.4)', borderRadius: 5, padding: '4px 10px', color: '#D4854A', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
                          SAVE
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STANDINGS ── */}
      {view === 'board' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 10, padding: '0 12px' }}>
            <div style={{ width: 24, flexShrink: 0 }} />
            <div style={{ width: 18, flexShrink: 0 }} />
            <div style={{ flex: 1 }} />
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3020', width: 24, textAlign: 'center' }}>W</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3020', width: 24, textAlign: 'center' }}>L</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3020', width: 30, textAlign: 'right' }}>PTS</div>
          </div>
          {LEADERBOARD.map(function(p, i) {
            return (
              <div key={p.name} style={{ background: i === 0 ? 'rgba(201,168,76,.1)' : 'rgba(26,21,16,.8)', border: '1px solid ' + (i === 0 ? '#C9A84C44' : '#241C12'), borderRadius: 10, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: i === 0 ? '0 0 12px rgba(201,168,76,.15)' : 'none' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: i === 0 ? '#C9A84C' : i === 1 ? '#C0C0C0' : i === 2 ? '#cd7f32' : '#8A7A62', width: 18, textAlign: 'center', flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flexShrink: 0 }}>
                  <AvatarPortrait username={p.name} size={36} rank={i < 3 ? i + 1 : undefined} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: p.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  {p.streak > 0 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#C9A84C' }}>{p.streak}&#x1F525; streak</div>}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#C9A84C', width: 24, textAlign: 'center', flexShrink: 0 }}>{p.w}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#FF4060', width: 24, textAlign: 'center', flexShrink: 0 }}>{p.l}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#F0E8D4', width: 30, textAlign: 'right', flexShrink: 0 }}>{p.pts}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PRIZES ── */}
      {view === 'prizes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 3, marginBottom: 4 }}>TOTAL PRIZE POOL</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: '#C9A84C', lineHeight: 1 }}>
              ${(PRIZE_TOTAL / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginTop: 4 }}>Washington Classic 2025 \xB7 Des Moines, WA</div>
          </div>

          {PRIZE_POOL.map(function(p) {
            var pct = Math.floor((p.prize / PRIZE_TOTAL) * 100);
            return (
              <div key={p.label} style={{ background: 'rgba(26,21,16,.8)', border: '1px solid ' + (p.place === 1 ? '#C9A84C44' : '#241C12'), borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 14, color: p.color }}>{p.label} PLACE</div>
                    {p.place === '5-8' && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>\xD74 players</div>}
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: p.color }}>${(p.prize / 100).toFixed(2)}</div>
                </div>
                <div style={{ height: 4, background: '#241C12', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: pct + '%', height: '100%', background: 'linear-gradient(90deg,' + p.color + '66,' + p.color + ')', borderRadius: 2 }} />
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#3D3020', textAlign: 'right', marginTop: 3 }}>{pct}% of pool</div>
              </div>
            );
          })}

          <div style={{ background: 'rgba(128,0,32,.08)', border: '1px solid rgba(128,0,32,.25)', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1.5 }}>Prizes paid via SeeWhy LIVE Stripe Connect. 90% to winner wallet, 10% platform fee per split rules.</div>
          </div>
        </div>
      )}

      {/* ── STATS ── */}
      {view === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', letterSpacing: 2, textAlign: 'center' }}>TOP 5 — SESSION STATS</div>
          {PLAYER_STATS.map(function(p, i) {
            var winBarW = Math.floor(p.winPct);
            return (
              <div key={p.name} style={{ background: 'rgba(26,21,16,.8)', border: '1px solid ' + (i === 0 ? p.color + '55' : '#241C12'), borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: i === 0 ? '#C9A84C' : '#8A7A62', width: 18, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flexShrink: 0 }}>
                    <AvatarPortrait username={p.name} size={36} rank={i < 3 ? i + 1 : undefined} />
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: p.color, flex: 1 }}>{p.name}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: p.color, lineHeight: 1 }}>
                    {p.pts}<span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', marginLeft: 3 }}>PTS</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginBottom: 8 }}>
                  {[['AVG SCORE', p.avgScore], ['HIGH GAME', p.highGame], ['DOMINOES', p.dominoes]].map(function(stat) {
                    return (
                      <div key={stat[0]} style={{ background: 'rgba(14,12,9,.5)', borderRadius: 6, padding: '5px 6px', textAlign: 'center' }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#8A7A62', letterSpacing: 1, marginBottom: 2 }}>{stat[0]}</div>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#F0E8D4', lineHeight: 1 }}>{stat[1]}</div>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#8A7A62' }}>WIN RATE</span>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: p.color }}>{p.winPct}%</span>
                  </div>
                  <div style={{ height: 4, background: '#241C12', borderRadius: 2, overflow: 'hidden' }}>
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
