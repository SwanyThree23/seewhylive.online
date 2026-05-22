import React, { useState, useEffect, useRef } from 'react';

var ROUNDS = ['ROUND 1', 'ROUND 2', 'ROUND 3', 'SUDDEN DEATH'];

function pad2(n) { return n < 10 ? '0' + n : String(n); }
function fmtTime(s) { return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60); }

export default function FadesTab({ socket, scores, guests, roomId, isLive, role, userId }) {
  var [activeRound,  setActiveRound]  = useState(0);
  var [fadeScores,   setFadeScores]   = useState({ team1: 0, team2: 0 });
  var [roundWinner,  setRoundWinner]  = useState(null);
  var [matchWinner,  setMatchWinner]  = useState(null);
  var [fadesActive,  setFadesActive]  = useState(false);
  var [team1,        setTeam1]        = useState([]);
  var [team2,        setTeam2]        = useState([]);
  var [roundSecs,    setRoundSecs]    = useState(0);
  var [roundHistory, setRoundHistory] = useState([]);
  var [view,         setView]         = useState('board');
  var tickRef = useRef(null);

  var isHost = role === 'host' || role === 'cohost';

  useEffect(function() {
    if (scores) setFadeScores(scores);
  }, [scores]);

  useEffect(function() {
    if (!socket) return;
    function onFades(data) {
      if (!data) return;
      if (data.scores) setFadeScores(data.scores);
      if (data.roundWinner) setRoundWinner(data.roundWinner);
      if (data.matchWinner) { setMatchWinner(data.matchWinner); setFadesActive(false); }
      if (data.type === 'fades-start') { setFadesActive(true); setMatchWinner(null); setRoundWinner(null); }
      if (data.type === 'fades-end') setFadesActive(false);
      if (data.team1) setTeam1(data.team1);
      if (data.team2) setTeam2(data.team2);
    }
    socket.on('fades-event', onFades);
    return function() { socket.off('fades-event', onFades); };
  }, [socket]);

  useEffect(function() {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!fadesActive) return;
    tickRef.current = setInterval(function() {
      setRoundSecs(function(n) { return n + 1; });
    }, 1000);
    return function() { clearInterval(tickRef.current); };
  }, [fadesActive]);

  function startFades() {
    if (!socket) return;
    var t1 = team1.length > 0 ? team1 : (guests || []).slice(0, Math.floor((guests || []).length / 2));
    var t2 = team2.length > 0 ? team2 : (guests || []).slice(Math.floor((guests || []).length / 2));
    if (t1.length === 0 && t2.length === 0) { t1 = []; t2 = []; }
    setTeam1(t1);
    setTeam2(t2);
    setFadeScores({ team1: 0, team2: 0 });
    setRoundSecs(0);
    setRoundWinner(null);
    setMatchWinner(null);
    setFadesActive(true);
    socket.emit('fades-event', { roomId: roomId, type: 'fades-start', scores: { team1: 0, team2: 0 }, team1: t1, team2: t2 });
  }

  function scorePoint(teamKey) {
    if (!socket || !fadesActive) return;
    var next = { team1: fadeScores.team1, team2: fadeScores.team2 };
    next[teamKey] = next[teamKey] + 1;
    setFadeScores(next);
    socket.emit('fades-event', { roomId: roomId, type: 'score', scores: next });
  }

  function deductPoint(teamKey) {
    if (!socket || !fadesActive) return;
    var next = { team1: fadeScores.team1, team2: fadeScores.team2 };
    next[teamKey] = Math.max(0, next[teamKey] - 1);
    setFadeScores(next);
    socket.emit('fades-event', { roomId: roomId, type: 'score', scores: next });
  }

  function endRound() {
    var winner = fadeScores.team1 > fadeScores.team2 ? 'ALPHA' : fadeScores.team2 > fadeScores.team1 ? 'OMEGA' : 'TIE';
    setRoundWinner(winner);
    setRoundHistory(function(h) {
      return h.concat([{ round: ROUNDS[activeRound], winner: winner, scores: { team1: fadeScores.team1, team2: fadeScores.team2 } }]);
    });
    if (socket) socket.emit('fades-event', { roomId: roomId, type: 'round-end', roundWinner: winner, scores: fadeScores });
    if (activeRound < ROUNDS.length - 1) setActiveRound(function(r) { return r + 1; });
  }

  function endMatch() {
    if (tickRef.current) clearInterval(tickRef.current);
    var winner = fadeScores.team1 > fadeScores.team2 ? 'ALPHA' : fadeScores.team2 > fadeScores.team1 ? 'OMEGA' : 'TIE';
    setMatchWinner(winner);
    setFadesActive(false);
    if (socket) socket.emit('fades-event', { roomId: roomId, type: 'fades-end', scores: fadeScores, matchWinner: winner });
  }

  function assignGuest(guest, team) {
    var gid = guest.guestId || guest.userId;
    setTeam1(function(t) { return t.filter(function(g) { return (g.guestId || g.userId) !== gid; }); });
    setTeam2(function(t) { return t.filter(function(g) { return (g.guestId || g.userId) !== gid; }); });
    if (team === 1) setTeam1(function(t) { return t.concat([guest]); });
    if (team === 2) setTeam2(function(t) { return t.concat([guest]); });
  }

  var t1Score = fadeScores.team1;
  var t2Score = fadeScores.team2;
  var totalPts = t1Score + t2Score;
  var t1Pct = totalPts > 0 ? Math.floor((t1Score / totalPts) * 100) : 50;

  var VIEWS = [['board', '🎲 BOARD'], ['roster', '👥 ROSTER'], ['history', '📜 HISTORY']];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#07050A' }}>
      {/* Scanline overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.06) 3px,rgba(0,0,0,.06) 4px)' }} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1 }}>

        {/* FADES header */}
        <div style={{ background: 'linear-gradient(135deg,rgba(0,255,255,.06),rgba(255,0,64,.06))', border: '1px solid rgba(0,255,255,.2)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 10, background: 'linear-gradient(90deg,#00FFFF,#FF0040)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>⚡ FADES</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 3, marginTop: 2 }}>ONLINE CORRUPTION BATTLE SYSTEM · v33</div>
          {fadesActive && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF0040', boxShadow: '0 0 10px #FF0040' }} />
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#FF0040', letterSpacing: 4 }}>LIVE BATTLE</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#00FFFF', letterSpacing: 2 }}>{fmtTime(roundSecs)}</span>
            </div>
          )}
          {matchWinner && (
            <div style={{ marginTop: 8, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C9A84C', letterSpacing: 4 }}>🏆 {matchWinner} WINS THE MATCH</div>
          )}
        </div>

        {/* Round pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {ROUNDS.map(function(r, i) {
            var active = activeRound === i;
            var done   = roundHistory.some(function(h) { return h.round === r; });
            return (
              <button key={r} onClick={function() { setActiveRound(i); }}
                style={{ flex: 1, padding: '7px 0', background: active ? 'rgba(0,255,255,.12)' : done ? 'rgba(255,0,64,.06)' : 'rgba(22,16,32,.7)', border: '1px solid ' + (active ? 'rgba(0,255,255,.45)' : done ? 'rgba(255,0,64,.3)' : '#241C34'), borderRadius: 6, color: active ? '#00FFFF' : done ? '#FF6B81' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
                {i === 3 ? 'S/D' : 'R' + (i + 1)}{done ? '✓' : ''}
              </button>
            );
          })}
        </div>

        {/* View switcher */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: 3 }}>
          {VIEWS.map(function(v) {
            var active = view === v[0];
            return (
              <button key={v[0]} onClick={function() { setView(v[0]); }}
                style={{ flex: 1, padding: '7px 0', background: active ? 'rgba(255,0,64,.12)' : 'transparent', border: 'none', borderRadius: 6, color: active ? '#FF6B81' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
                {v[1]}
              </button>
            );
          })}
        </div>

        {/* ── BOARD VIEW ── */}
        {view === 'board' && (
          <>
            {/* Score card */}
            <div style={{ background: 'rgba(15,12,20,.95)', border: '1px solid #241C34', borderRadius: 14, padding: '16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>

                {/* Alpha */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#00FFFF', letterSpacing: 4, marginBottom: 6 }}>◈ ALPHA</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 72, color: '#00FFFF', lineHeight: 0.85, textShadow: '0 0 30px rgba(0,255,255,.45)' }}>{t1Score}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', marginTop: 6 }}>{team1.length} players</div>
                </div>

                {/* VS */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 14px' }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#3D3450', letterSpacing: 3 }}>VS</div>
                  <div style={{ width: 1, height: 50, background: 'linear-gradient(180deg,transparent,#241C34,transparent)' }} />
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1 }}>{ROUNDS[activeRound]}</div>
                </div>

                {/* Omega */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF0040', letterSpacing: 4, marginBottom: 6 }}>◈ OMEGA</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 72, color: '#FF0040', lineHeight: 0.85, textShadow: '0 0 30px rgba(255,0,64,.45)' }}>{t2Score}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', marginTop: 6 }}>{team2.length} players</div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex', marginTop: 14 }}>
                <div style={{ width: t1Pct + '%', background: 'linear-gradient(90deg,rgba(0,255,255,.4),#00FFFF)', transition: 'width .4s ease' }} />
                <div style={{ flex: 1, background: 'linear-gradient(90deg,#FF0040,rgba(255,0,64,.4))', transition: 'flex .4s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#00FFFF' }}>α {t1Pct}%</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF0040' }}>{100 - t1Pct}% ω</span>
              </div>
            </div>

            {/* Score controls — host only */}
            {isHost && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button onClick={function() { scorePoint('team1'); }} disabled={!fadesActive}
                    style={{ padding: '13px', background: fadesActive ? 'rgba(0,255,255,.14)' : 'rgba(22,16,32,.4)', border: '1px solid ' + (fadesActive ? 'rgba(0,255,255,.4)' : '#241C34'), borderRadius: 9, color: fadesActive ? '#00FFFF' : '#3D3450', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: fadesActive ? 'pointer' : 'not-allowed', letterSpacing: 2, textShadow: fadesActive ? '0 0 14px rgba(0,255,255,.6)' : 'none' }}>
                    +1 ALPHA
                  </button>
                  <button onClick={function() { deductPoint('team1'); }} disabled={!fadesActive || t1Score === 0}
                    style={{ padding: '5px', background: 'transparent', border: '1px solid #241C34', borderRadius: 6, color: '#3D3450', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: fadesActive && t1Score > 0 ? 'pointer' : 'not-allowed', opacity: fadesActive && t1Score > 0 ? 0.7 : 0.2 }}>
                    −1
                  </button>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button onClick={function() { scorePoint('team2'); }} disabled={!fadesActive}
                    style={{ padding: '13px', background: fadesActive ? 'rgba(255,0,64,.14)' : 'rgba(22,16,32,.4)', border: '1px solid ' + (fadesActive ? 'rgba(255,0,64,.4)' : '#241C34'), borderRadius: 9, color: fadesActive ? '#FF0040' : '#3D3450', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: fadesActive ? 'pointer' : 'not-allowed', letterSpacing: 2, textShadow: fadesActive ? '0 0 14px rgba(255,0,64,.6)' : 'none' }}>
                    +1 OMEGA
                  </button>
                  <button onClick={function() { deductPoint('team2'); }} disabled={!fadesActive || t2Score === 0}
                    style={{ padding: '5px', background: 'transparent', border: '1px solid #241C34', borderRadius: 6, color: '#3D3450', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: fadesActive && t2Score > 0 ? 'pointer' : 'not-allowed', opacity: fadesActive && t2Score > 0 ? 0.7 : 0.2 }}>
                    −1
                  </button>
                </div>
              </div>
            )}

            {/* Round winner banner */}
            {roundWinner && !matchWinner && (
              <div style={{ background: 'linear-gradient(135deg,rgba(201,168,76,.15),rgba(128,0,32,.12))', border: '1px solid rgba(201,168,76,.45)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C9A84C', letterSpacing: 4 }}>🏆 {roundWinner} WINS THE ROUND</div>
              </div>
            )}

            {/* Match controls — host only */}
            {isHost && (
              <div style={{ display: 'flex', gap: 8 }}>
                {!fadesActive ? (
                  <button onClick={startFades}
                    style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,rgba(0,255,255,.15),rgba(255,0,64,.15))', border: '1px solid rgba(0,255,255,.4)', borderRadius: 10, color: '#00FFFF', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer', letterSpacing: 3, textShadow: '0 0 14px rgba(0,255,255,.7)' }}>
                    ⚡ INITIATE FADES
                  </button>
                ) : (
                  <>
                    <button onClick={endRound}
                      style={{ flex: 1, padding: '10px', background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 8, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
                      END ROUND
                    </button>
                    <button onClick={endMatch}
                      style={{ flex: 1, padding: '10px', background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 8, color: '#FF6B81', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
                      END MATCH
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Team player list */}
            {(team1.length > 0 || team2.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#00FFFF', letterSpacing: 2, marginBottom: 6, textAlign: 'center' }}>◈ ALPHA</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {team1.slice(0, 5).map(function(g) {
                      return (
                        <div key={g.guestId || g.userId} style={{ background: 'rgba(0,255,255,.05)', border: '1px solid rgba(0,255,255,.15)', borderRadius: 7, padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(0,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>🎲</div>
                          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#00FFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.username || 'Player'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#FF0040', letterSpacing: 2, marginBottom: 6, textAlign: 'center' }}>◈ OMEGA</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {team2.slice(0, 5).map(function(g) {
                      return (
                        <div key={g.guestId || g.userId} style={{ background: 'rgba(255,0,64,.05)', border: '1px solid rgba(255,0,64,.15)', borderRadius: 7, padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(255,0,64,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>🎲</div>
                          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#FF0040', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.username || 'Player'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── ROSTER VIEW ── */}
        {view === 'roster' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 1, marginBottom: 2 }}>
              {isHost ? 'Tap α / ω to assign guests to teams' : 'Current team assignments'}
            </div>

            {(guests || []).length === 0 && (
              <div style={{ textAlign: 'center', padding: 28, fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3D3450' }}>No guests in room</div>
            )}

            {(guests || []).map(function(g) {
              var gid = g.guestId || g.userId;
              var inAlpha = team1.some(function(t) { return (t.guestId || t.userId) === gid; });
              var inOmega = team2.some(function(t) { return (t.guestId || t.userId) === gid; });
              var borderCol = inAlpha ? 'rgba(0,255,255,.3)' : inOmega ? 'rgba(255,0,64,.3)' : '#241C34';
              var bgCol     = inAlpha ? 'rgba(0,255,255,.05)' : inOmega ? 'rgba(255,0,64,.05)' : 'rgba(22,16,32,.7)';
              return (
                <div key={gid} style={{ background: bgCol, border: '1px solid ' + borderCol, borderRadius: 9, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: inAlpha ? 'rgba(0,255,255,.15)' : inOmega ? 'rgba(255,0,64,.15)' : 'rgba(22,16,32,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🎲</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: inAlpha ? '#00FFFF' : inOmega ? '#FF0040' : '#EDE8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.username || 'Guest'}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: inAlpha ? '#00FFFF' : inOmega ? '#FF0040' : '#7A6F90', letterSpacing: 1 }}>
                      {inAlpha ? '◈ ALPHA' : inOmega ? '◈ OMEGA' : 'UNASSIGNED'}
                    </div>
                  </div>
                  {isHost && (
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={function() { assignGuest(g, inAlpha ? 0 : 1); }}
                        style={{ background: inAlpha ? 'rgba(0,255,255,.25)' : 'rgba(0,255,255,.07)', border: '1px solid rgba(0,255,255,.3)', borderRadius: 5, padding: '4px 9px', color: '#00FFFF', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', fontWeight: 700 }}>
                        {inAlpha ? '✓α' : 'α'}
                      </button>
                      <button onClick={function() { assignGuest(g, inOmega ? 0 : 2); }}
                        style={{ background: inOmega ? 'rgba(255,0,64,.25)' : 'rgba(255,0,64,.07)', border: '1px solid rgba(255,0,64,.3)', borderRadius: 5, padding: '4px 9px', color: '#FF0040', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', fontWeight: 700 }}>
                        {inOmega ? '✓ω' : 'ω'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── HISTORY VIEW ── */}
        {view === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {roundHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3D3450' }}>No rounds played yet</div>
            ) : (
              roundHistory.map(function(h, i) {
                return (
                  <div key={i} style={{ background: 'rgba(22,16,32,.7)', border: '1px solid #241C34', borderRadius: 9, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 5, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', flexShrink: 0 }}>{h.round}</div>
                    <div style={{ flex: 1, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: h.winner === 'ALPHA' ? '#00FFFF' : h.winner === 'OMEGA' ? '#FF0040' : '#C9A84C' }}>🏆 {h.winner}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#00FFFF', lineHeight: 1 }}>{h.scores.team1}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#3D3450' }}>—</span>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#FF0040', lineHeight: 1 }}>{h.scores.team2}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}
