import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';
import UpgradeGate from './UpgradeGate.jsx';

function pad2(n) { return n < 10 ? '0' + n : String(n); }
function fmtCountdown(s) {
  s = Math.floor(s) || 0;
  return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60);
}
function rndInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function fmtTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

var BG    = '#0E0C09';
var SURF  = '#1A1510';
var CARD  = '#241C12';
var GOLD  = '#C9A84C';
var BURG  = '#800020';
var AMBER = '#D4854A';
var TEXT  = '#F0E8D4';
var MUTED = '#8A7A62';

var DURATION_LABELS = { 60: '1 MIN', 180: '3 MIN', 300: '5 MIN', 600: '10 MIN' };

var RIVALS_DATA = [
  { name: 'STORM_RIDER',  wins: 3,  losses: 1, status: 'LIVE',    elo: 2840 },
  { name: 'MYSTIC_GIRL',  wins: 0,  losses: 0, status: 'NEW',     elo: 1200 },
  { name: 'DARK_KNIGHT',  wins: 7,  losses: 2, status: 'ONLINE',  elo: 3210 },
  { name: 'PHANTOM_X',    wins: 12, losses: 3, status: 'OFFLINE', elo: 4100 },
  { name: 'NEON_WOLF',    wins: 5,  losses: 4, status: 'ONLINE',  elo: 2200 },
  { name: 'SOLAR_STRIKE', wins: 9,  losses: 1, status: 'LIVE',    elo: 3900 },
];

export default function PKBattleTab({ socket, roomId, role, isLive, addToast, viewerCount, username }) {
  var [battleState, setBattleState]           = useState('idle');
  var [challenger, setChallenger]             = useState('');
  var [defender, setDefender]                 = useState('');
  var [challengerScore, setChallengerScore]   = useState(0);
  var [defenderScore, setDefenderScore]       = useState(0);
  var [battleDuration, setBattleDuration]     = useState(300);
  var [countdown, setCountdown]               = useState(0);
  var [winner, setWinner]                     = useState(null);
  var [myVote, setMyVote]                     = useState(null);
  var [voteHistory, setVoteHistory]           = useState([]);
  var [battleLog, setBattleLog]               = useState([]);
  var [durationOptions]                       = useState([60, 180, 300, 600]);
  var [selectedDuration, setSelectedDuration] = useState(300);
  var [challengerInput, setChallengerInput]   = useState('');
  var [defenderInput, setDefenderInput]       = useState('');
  var [cheerA, setCheerA]                     = useState([]);
  var [cheerB, setCheerB]                     = useState([]);

  var countdownRef  = useRef(null);
  var challengerScoreRef = useRef(0);
  var defenderScoreRef   = useRef(0);
  var suddenDeathRef     = useRef(false);
  function clearAllIntervals() {
    if (countdownRef.current)  { clearInterval(countdownRef.current);  countdownRef.current  = null; }
  }

  useEffect(function() {
    return function() { clearAllIntervals(); };
  }, []);

  useEffect(function() { challengerScoreRef.current = challengerScore; }, [challengerScore]);
  useEffect(function() { defenderScoreRef.current = defenderScore; }, [defenderScore]);

  useEffect(function() {
    if (!socket) return;

    function onPkStart(data) {
      if (!data) return;
      setChallenger(data.challenger || '');
      setDefender(data.defender || '');
      setBattleState('active');
      setChallengerScore(0);
      setDefenderScore(0);
      setCountdown(data.duration || 300);
      setBattleLog([]);
      setWinner(null);
      setCheerA([]);
      setCheerB([]);
      if (addToast) addToast('⚔️ PK Battle started!', 'success');
    }
    function onPkEnd(data) {
      if (!data) return;
      setWinner(data.winner || null);
      setBattleState('ended');
      clearAllIntervals();
      if (addToast) addToast('🏆 ' + (data.winner || 'Battle') + ' wins the PK!', 'success');
    }
    function onPkVoteUpdate(data) {
      if (!data) return;
      if (typeof data.challengerVotes === 'number') setChallengerScore(data.challengerVotes);
      if (typeof data.defenderVotes   === 'number') setDefenderScore(data.defenderVotes);
    }
    function onPkGiftBoost(data) {
      if (!data) return;
      var pts = data.points || 5;
      if (data.side === 'challenger') {
        setChallengerScore(function(prev) { return prev + pts; });
      } else if (data.side === 'defender') {
        setDefenderScore(function(prev) { return prev + pts; });
      }
      var boostMsg = data.side
        ? '🎁 ' + (data.username || 'Someone') + ' boosted ' + (data.side === 'challenger' ? challenger : defender) + ' +' + pts
        : (data.from || 'Viewer') + ' gifted ' + (data.name || data.emoji || 'a gift') + ' — BOOST! 🚀';
      setBattleLog(function(prev) {
        return [{ time: fmtTime(), text: boostMsg, ts: Date.now() }].concat(prev).slice(0, 50);
      });
      if (addToast) addToast('🎁 Gift boost! +' + pts, 'success');
    }
    function onPkCheerUpdate(data) {
      if (!data) return;
      if (data.cheerA) setCheerA(data.cheerA.slice(0, 20));
      if (data.cheerB) setCheerB(data.cheerB.slice(0, 20));
    }
    function onPkSuddenDeath() {
      setBattleLog(function(prev) { return [{ text: '⚡ SUDDEN DEATH — next point wins!', ts: Date.now() }].concat(prev).slice(0, 20); });
      if (addToast) addToast('⚡ SUDDEN DEATH round!', 'error');
    }

    socket.on('pk-start',        onPkStart);
    socket.on('pk-end',          onPkEnd);
    socket.on('pk-vote-update',  onPkVoteUpdate);
    socket.on('pk-gift-boost',   onPkGiftBoost);
    socket.on('pk-cheer-update', onPkCheerUpdate);
    socket.on('pk-sudden-death', onPkSuddenDeath);

    return function() {
      socket.off('pk-start',        onPkStart);
      socket.off('pk-end',          onPkEnd);
      socket.off('pk-vote-update',  onPkVoteUpdate);
      socket.off('pk-gift-boost',   onPkGiftBoost);
      socket.off('pk-cheer-update', onPkCheerUpdate);
      socket.off('pk-sudden-death', onPkSuddenDeath);
    };
  }, [socket, addToast]);

  function startBattle() {
    suddenDeathRef.current = false;
    var cName = challengerInput.trim();
    var dName = defenderInput.trim();
    if (!cName || !dName) {
      addToast('Enter both challenger and defender names', 'error');
      return;
    }
    if (cName === dName) {
      addToast('Names must be different', 'error');
      return;
    }

    setChallenger(cName);
    setDefender(dName);
    setChallengerScore(0);
    setDefenderScore(0);
    setBattleDuration(selectedDuration);
    setCountdown(selectedDuration);
    setWinner(null);
    setMyVote(null);
    setVoteHistory([]);
    setBattleLog([{ time: fmtTime(), text: '⚡ PK Battle started! ' + cName + ' vs ' + dName }]);
    setBattleState('active');

    if (socket && roomId) {
      socket.emit('pk-start', { roomId: roomId, challenger: cName, defender: dName, duration: selectedDuration });
    }

    clearAllIntervals();

    countdownRef.current = setInterval(function() {
      setCountdown(function(prev) {
        if (prev <= 1) {
          if (challengerScoreRef.current === defenderScoreRef.current && !suddenDeathRef.current) {
            suddenDeathRef.current = true;
            if (addToast) addToast('⚡ Sudden death! 30 more seconds!', 'success');
            if (socket && roomId) socket.emit('pk-sudden-death', { roomId: roomId });
            return 30;
          }
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          endBattle();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    addToast('Battle started!', 'success');
  }

  function endBattle() {
    clearAllIntervals();
    setBattleState('ended');

    setChallengerScore(function(cScore) {
      setDefenderScore(function(dScore) {
        var w = cScore >= dScore ? challenger : defender;
        setWinner(w);
        setBattleLog(function(prev) {
          return prev.concat([{ time: fmtTime(), text: '🏆 ' + w + ' wins the PK Battle!' }]);
        });
        if (socket && roomId) {
          socket.emit('pk-end', { roomId: roomId, winner: w, challengerScore: cScore, defenderScore: dScore });
        }
        addToast(w + ' wins the battle!', 'success');
        return dScore;
      });
      return cScore;
    });
  }

  function castVote(side) {
    if (myVote) return;
    setMyVote(side);
    var votedName = side === 'challenger' ? challenger : defender;
    setVoteHistory(function(prev) { return prev.concat([{ side: side, time: fmtTime() }]); });
    setBattleLog(function(prev) {
      return prev.concat([{ time: fmtTime(), text: '👍 You voted for ' + votedName }]).slice(-50);
    });
    if (socket && roomId) {
      socket.emit('pk-vote', { roomId: roomId, side: side, username: username || 'anon' });
    }
    addToast('Voted for ' + votedName + '!', 'success');
  }

  function handleRematch() {
    if (!challenger || !defender) return;
    var cName = challenger;
    var dName = defender;
    suddenDeathRef.current = false;
    setChallengerScore(0);
    setDefenderScore(0);
    setBattleDuration(selectedDuration);
    setCountdown(selectedDuration);
    setWinner(null);
    setMyVote(null);
    setVoteHistory([]);
    setCheerA([]);
    setCheerB([]);
    setBattleLog([{ time: fmtTime(), text: '⚔️ REMATCH! ' + cName + ' vs ' + dName }]);
    setBattleState('active');

    if (socket && roomId) {
      socket.emit('pk-start', { roomId: roomId, challenger: cName, defender: dName, duration: selectedDuration });
    }

    clearAllIntervals();

    countdownRef.current = setInterval(function() {
      setCountdown(function(prev) {
        if (prev <= 1) {
          if (challengerScoreRef.current === defenderScoreRef.current && !suddenDeathRef.current) {
            suddenDeathRef.current = true;
            if (addToast) addToast('⚡ Sudden death! 30 more seconds!', 'success');
            if (socket && roomId) socket.emit('pk-sudden-death', { roomId: roomId });
            return 30;
          }
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          endBattle();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    addToast('⚔️ REMATCH started!', 'success');
  }

  function resetBattle() {
    clearAllIntervals();
    suddenDeathRef.current = false;
    setBattleState('idle');
    setChallenger('');
    setDefender('');
    setChallengerScore(0);
    setDefenderScore(0);
    setCountdown(0);
    setWinner(null);
    setMyVote(null);
    setVoteHistory([]);
    setBattleLog([]);
    setChallengerInput('');
    setDefenderInput('');
  }

  var totalScore = challengerScore + defenderScore;
  var cPct = totalScore > 0 ? Math.floor((challengerScore / totalScore) * 100) : 50;
  var dPct = totalScore > 0 ? Math.floor((defenderScore  / totalScore) * 100) : 50;

  var isHost = role === 'host' || role === 'cohost';

  var containerStyle = {
    background: '#0E0C09',
    minHeight: '100%',
    padding: '16px',
    fontFamily: "'Barlow Condensed',sans-serif",
    color: '#F0E8D4'
  };

  var cardStyle = {
    background: 'rgba(26,21,16,.8)',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: 12,
    padding: '20px',
    marginBottom: 16
  };

  var labelStyle = {
    fontFamily: "'Bebas Neue',sans-serif",
    fontSize: 11,
    letterSpacing: 2,
    color: '#8A7A62',
    marginBottom: 6,
    display: 'block'
  };

  var inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#F0E8D4',
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box'
  };

  // ── IDLE STATE ──────────────────────────────────────────────────────────────
  if (battleState === 'idle') {
    return (
      <UpgradeGate feature="pkBattle">
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A84C', letterSpacing: 2, marginBottom: 4 }}>
            ⚡ PK BATTLE
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: '#8A7A62' }}>
            1v1 live battle — viewers vote for their champion
          </div>
        </div>

        {isHost ? (
          <div style={cardStyle}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A84C', letterSpacing: 2, marginBottom: 16 }}>
              ⚡ PK BATTLE SETUP
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <span style={labelStyle}>CHALLENGER</span>
                <input
                  style={inputStyle}
                  value={challengerInput}
                  onChange={function(e) { setChallengerInput(e.target.value); }}
                  placeholder="Challenger name"
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={labelStyle}>DEFENDER</span>
                <input
                  style={inputStyle}
                  value={defenderInput}
                  onChange={function(e) { setDefenderInput(e.target.value); }}
                  placeholder="Defender name"
                />
              </div>
            </div>

            <span style={labelStyle}>BATTLE DURATION</span>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {durationOptions.map(function(dur) {
                var isSelected = selectedDuration === dur;
                return (
                  <button
                    key={dur}
                    onClick={function() { setSelectedDuration(dur); }}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      background: isSelected ? 'rgba(201,168,76,.25)' : 'rgba(255,255,255,.04)',
                      border: isSelected ? '1px solid rgba(201,168,76,.6)' : '1px solid rgba(255,255,255,.1)',
                      borderRadius: 8,
                      color: isSelected ? '#C9A84C' : '#8A7A62',
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: 13,
                      letterSpacing: 1,
                      cursor: 'pointer'
                    }}
                  >
                    {DURATION_LABELS[dur]}
                  </button>
                );
              })}
            </div>

            <button
              onClick={startBattle}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg,#C0392B,#FF4D7D)',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 18,
                letterSpacing: 2,
                cursor: 'pointer'
              }}
            >
              ⚡ LAUNCH BATTLE
            </button>
          </div>
        ) : (
          <div style={Object.assign({}, cardStyle, { textAlign: 'center', padding: '32px 20px' })}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#8A7A62', letterSpacing: 1 }}>
              WAITING FOR HOST TO START A BATTLE
            </div>
          </div>
        )}

        {/* ── BATTLE RIVALS ── */}
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C', letterSpacing: 3, marginBottom: 10 }}>
          ⚔ BATTLE RIVALS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {RIVALS_DATA.map(function(r) {
            var statusColor = r.status === 'LIVE' ? '#800020' : (r.status === 'ONLINE' ? '#C9A84C' : (r.status === 'NEW' ? '#C9A84C' : '#3D3020'));
            return (
              <div key={r.name} style={{
                background: 'rgba(26,21,16,.8)',
                border: r.status === 'LIVE' ? '1px solid rgba(128,0,32,.35)' : '1px solid rgba(255,255,255,.06)',
                borderRadius: 12,
                padding: '14px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                position: 'relative',
                overflow: 'hidden',
              }}>
                {r.status === 'LIVE' && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#C0392B,transparent)' }} />
                )}
                <div style={{ position: 'relative' }}>
                  <AvatarPortrait username={r.name} size={52} />
                  {r.status === 'LIVE' && (
                    <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', background: '#800020', borderRadius: 3, padding: '1px 5px', fontFamily: "'DM Mono',monospace", fontSize: 5.5, color: '#fff', letterSpacing: 1, whiteSpace: 'nowrap' }}>LIVE</div>
                  )}
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: '#F0E8D4', letterSpacing: 1, textAlign: 'center' }}>{r.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor }} />
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: statusColor, letterSpacing: 0.5 }}>{r.status}</span>
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>
                  {r.wins}W-{r.losses}L · {r.elo} ELO
                </div>
                <button
                  onClick={function() {
                    if (socket) socket.emit('pk-challenge', { roomId: roomId, to: r.name, from: username, challenger_username: username });
                    if (addToast) addToast('Challenge sent to ' + r.name + '!', 'success');
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 0',
                    background: r.status === 'LIVE' ? 'rgba(128,0,32,.2)' : 'rgba(201,168,76,.1)',
                    border: '1px solid ' + (r.status === 'LIVE' ? 'rgba(128,0,32,.45)' : 'rgba(201,168,76,.3)'),
                    borderRadius: 6,
                    color: r.status === 'LIVE' ? '#800020' : '#C9A84C',
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: 10,
                    letterSpacing: 1,
                    cursor: 'pointer',
                  }}
                >
                  {r.status === 'OFFLINE' ? 'REQUEST' : 'CHALLENGE'}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── MATCHMAKING ── */}
        <div style={Object.assign({}, cardStyle, { textAlign: 'center' })}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#F0E8D4', letterSpacing: 2, marginBottom: 4 }}>
            ⚡ QUICK MATCHMAKING
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#8A7A62', marginBottom: 14 }}>
            Find a battle partner · matched by ELO rating
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[{ label: 'INSTANT', icon: '⚡' }, { label: 'RANKED', icon: '🏆' }, { label: 'CLANS', icon: '👥' }].map(function(m) {
              return (
                <button key={m.label} onClick={function() { if (addToast) addToast('Searching for ' + m.label + ' match...', 'info'); }}
                  style={{ flex: 1, padding: '12px 4px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 18 }}>{m.icon}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1 }}>{m.label}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 1 }}>YOUR ELO</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#C9A84C' }}>2,840</span>
          </div>
        </div>
      </div>
      </UpgradeGate>
    );
  }

  // ── ENDED STATE — ELITE LEAGUE HERO CARD ───────────────────────────────────
  if (battleState === 'ended' && winner) {
    return (
      <UpgradeGate feature="pkBattle">
        <div style={containerStyle}>
          <div style={{ background: 'rgba(201,168,76,.12)', border: '2px solid #C9A84C', borderRadius: 14, padding: '20px 16px', textAlign: 'center', margin: '12px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#C9A84C', letterSpacing: 3 }}>{winner}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginTop: 4 }}>WINS THE PK BATTLE</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#800020' }}>{challenger}: {challengerScore}</span>
              <span style={{ color: '#8A7A62' }}>·</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C' }}>{defender}: {defenderScore}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'center' }}>
              {isHost && (
                <button onClick={handleRematch}
                  style={{ padding: '9px 20px', background: 'rgba(128,0,32,.2)', border: '1px solid rgba(128,0,32,.5)', borderRadius: 8, color: '#FF1A3C', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 2, cursor: 'pointer' }}>
                  ⚔️ REMATCH
                </button>
              )}
              <button onClick={function() { setBattleState('idle'); setWinner(null); setChallengerScore(0); setDefenderScore(0); setChallenger(''); setDefender(''); setBattleLog([]); }}
                style={{ padding: '9px 20px', background: 'rgba(26,21,16,.8)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, color: '#C9A84C', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 2, cursor: 'pointer' }}>
                NEW BATTLE
              </button>
            </div>
          </div>
        </div>
      </UpgradeGate>
    );
  }

  if (battleState === 'ended') {
    var isWinnerChallenger = winner === challenger;
    var winnerScore  = isWinnerChallenger ? challengerScore : defenderScore;
    var loserName    = isWinnerChallenger ? defender : challenger;
    var loserScore   = isWinnerChallenger ? defenderScore : challengerScore;

    return (
      <UpgradeGate feature="pkBattle">
      <div style={containerStyle}>

        {/* ELITE LEAGUE badge */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 999, padding: '4px 16px' }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: '#C9A84C', letterSpacing: 3 }}>⚡ ELITE LEAGUE ⚡</span>
          </div>
        </div>

        {/* Hero card — winner */}
        <div style={{
          background: 'linear-gradient(160deg,rgba(201,168,76,.18),rgba(14,12,9,.95))',
          border: '2px solid rgba(201,168,76,.6)',
          borderRadius: 16,
          padding: '24px 20px',
          marginBottom: 12,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background glow */}
          <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, background: 'radial-gradient(circle,rgba(201,168,76,.25),transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C', letterSpacing: 3, marginBottom: 16 }}>
            BATTLE CHAMPION
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <AvatarPortrait username={winner} size={88} rank={1} />
          </div>

          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: '#F0E8D4', letterSpacing: 2, lineHeight: 1, marginBottom: 4 }}>
            {winner}
          </div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, color: '#C9A84C', lineHeight: 1, textShadow: '0 0 24px rgba(201,168,76,.5)' }}>
            {winnerScore}
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', marginTop: 4, letterSpacing: 1 }}>FINAL SCORE</div>
        </div>

        {/* Loser recap card */}
        <div style={{
          background: 'rgba(26,21,16,.7)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <AvatarPortrait username={loserName} size={48} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#8A7A62', letterSpacing: 1 }}>{loserName}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3D3020' }}>RUNNER-UP</div>
          </div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, color: '#8A7A62' }}>{loserScore}</div>
        </div>

        {isHost && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleRematch}
              style={{
                width: '100%',
                padding: '13px',
                background: 'linear-gradient(135deg,rgba(128,0,32,.35),rgba(128,0,32,.15))',
                border: '1px solid rgba(128,0,32,.5)',
                borderRadius: 10,
                color: '#FF1A3C',
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 16,
                letterSpacing: 2,
                cursor: 'pointer',
              }}
            >
              ⚔️ INSTANT REMATCH
            </button>
            <button
              onClick={resetBattle}
              style={{
                width: '100%',
                padding: '13px',
                background: 'linear-gradient(135deg,rgba(201,168,76,.25),rgba(201,168,76,.1))',
                border: '1px solid rgba(201,168,76,.5)',
                borderRadius: 10,
                color: '#C9A84C',
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 16,
                letterSpacing: 2,
                cursor: 'pointer',
              }}
            >
              ⚡ START NEW BATTLE
            </button>
          </div>
        )}
      </div>
      </UpgradeGate>
    );
  }

  // ── ACTIVE BATTLE ───────────────────────────────────────────────────────────
  var countdownColor = countdown < 30 ? '#800020' : '#F0E8D4';
  var lastLog = battleLog.slice(-5);
  var totalVotes = (challengerScore || 0) + (defenderScore || 0);
  var challPct = totalVotes > 0 ? Math.floor((challengerScore || 0) / totalVotes * 100) : 50;
  var defPct = 100 - challPct;

  return (
    <UpgradeGate feature="pkBattle">
    <div style={containerStyle}>
      {/* Support bar */}
      <div style={{ display: 'flex', height: 28, borderRadius: 14, overflow: 'hidden', margin: '0 0 10px', border: '1px solid rgba(201,168,76,.2)' }}>
        <div style={{ width: challPct + '%', background: 'linear-gradient(90deg,#800020,#C01838)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width .6s ease', minWidth: challPct > 0 ? 32 : 0 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#F0E8D4', letterSpacing: 1 }}>{challPct}%</span>
        </div>
        <div style={{ width: defPct + '%', background: 'linear-gradient(90deg,#A07820,#C9A84C)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width .6s ease', minWidth: defPct > 0 ? 32 : 0 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#0E0C09', letterSpacing: 1 }}>{defPct}%</span>
        </div>
      </div>
      {/* Countdown Timer */}
      <div style={Object.assign({}, cardStyle, { textAlign: 'center', padding: '16px 20px' })}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: countdownColor, letterSpacing: 4, lineHeight: 1 }}>
          {fmtCountdown(countdown)}
        </div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#8A7A62', letterSpacing: 1, marginTop: 4 }}>
          REMAINING
        </div>
      </div>

      {/* Card Art Score Split */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'stretch' }}>
        {/* Challenger card */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(160deg,rgba(128,0,32,.2),rgba(14,12,9,.95))',
          border: myVote === 'challenger' ? '2px solid rgba(128,0,32,.8)' : '1px solid rgba(128,0,32,.35)',
          borderRadius: 12,
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          cursor: myVote === null ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={myVote === null ? function() { castVote('challenger'); } : undefined}
        >
          <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', width: 100, height: 100, background: 'radial-gradient(circle,rgba(128,0,32,.3),transparent 70%)', pointerEvents: 'none' }} />
          <AvatarPortrait username={challenger} size={60} />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#F0E8D4', letterSpacing: 1, textAlign: 'center' }}>{challenger}</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, color: '#800020', lineHeight: 1, textShadow: '0 0 16px rgba(128,0,32,.6)' }}>{challengerScore}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1 }}>{cPct}% VOTES</div>
          {myVote === 'challenger' && (
            <div style={{ background: 'rgba(128,0,32,.25)', border: '1px solid rgba(128,0,32,.5)', borderRadius: 999, padding: '2px 10px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 10, color: '#800020', letterSpacing: 1 }}>✓ VOTED</div>
          )}
        </div>

        {/* VS divider */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0, minWidth: 36 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#800020', letterSpacing: 2, textShadow: '0 0 12px #C0392B' }}>VS</div>
          <div style={{ height: 2, width: 2, borderRadius: '50%', background: '#3D3020' }} />
        </div>

        {/* Defender card */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(160deg,rgba(201,168,76,.2),rgba(14,12,9,.95))',
          border: myVote === 'defender' ? '2px solid rgba(201,168,76,.8)' : '1px solid rgba(201,168,76,.35)',
          borderRadius: 12,
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          cursor: myVote === null ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={myVote === null ? function() { castVote('defender'); } : undefined}
        >
          <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', width: 100, height: 100, background: 'radial-gradient(circle,rgba(201,168,76,.3),transparent 70%)', pointerEvents: 'none' }} />
          <AvatarPortrait username={defender} size={60} />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#F0E8D4', letterSpacing: 1, textAlign: 'center' }}>{defender}</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, color: '#C9A84C', lineHeight: 1, textShadow: '0 0 16px rgba(201,168,76,.6)' }}>{defenderScore}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1 }}>{dPct}% VOTES</div>
          {myVote === 'defender' && (
            <div style={{ background: 'rgba(201,168,76,.25)', border: '1px solid rgba(201,168,76,.5)', borderRadius: 999, padding: '2px 10px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 10, color: '#C9A84C', letterSpacing: 1 }}>✓ VOTED</div>
          )}
        </div>
      </div>

      {/* Score bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', height: 8, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,.06)' }}>
          <div style={{ width: cPct + '%', background: 'linear-gradient(90deg,#800020,#C01838)', transition: 'width .4s ease' }} />
          <div style={{ width: dPct + '%', background: 'linear-gradient(90deg,#C9A84C,#D4854A)', transition: 'width .4s ease' }} />
        </div>
        {myVote === null && (
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', textAlign: 'center', marginTop: 6, letterSpacing: 1 }}>TAP A CARD TO VOTE</div>
        )}
      </div>

      {/* Audience Cheer Tiles */}
      {(cheerA.length > 0 || cheerB.length > 0) && (
        <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
          {/* Team A cheers */}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1, marginBottom: 5 }}>
              ⚔ {challenger.toUpperCase() || 'CHALLENGER'} ({cheerA.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {cheerA.slice(0, 20).map(function(u, i) {
                var initials = u.slice(0, 2).toUpperCase();
                return (
                  <div key={i} title={u} style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(128,0,32,.7)', border: '1px solid rgba(128,0,32,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 7, color: '#F0E8D4' }}>
                    {initials}
                  </div>
                );
              })}
              {cheerA.length > 20 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', alignSelf: 'center' }}>+{cheerA.length - 20}</div>}
            </div>
          </div>
          {/* Team B cheers */}
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1, marginBottom: 5 }}>
              ({cheerB.length}) {defender.toUpperCase() || 'DEFENDER'} ⚔
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
              {cheerB.slice(0, 20).map(function(u, i) {
                var initials = u.slice(0, 2).toUpperCase();
                return (
                  <div key={i} title={u} style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(201,168,76,.7)', border: '1px solid rgba(201,168,76,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 7, color: '#0E0C09' }}>
                    {initials}
                  </div>
                );
              })}
              {cheerB.length > 20 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', alignSelf: 'center' }}>+{cheerB.length - 20}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Viewer cheer buttons (shown when battle active) */}
      {myVote !== null && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button
            onClick={function() {
              if (socket) socket.emit('pk-cheer', { roomId: roomId, side: 'A', username: username || 'Viewer' });
            }}
            style={{ flex: 1, background: 'rgba(128,0,32,.2)', border: '1px solid rgba(128,0,32,.5)', borderRadius: 8, padding: '7px 0', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}>
            🔥 CHEER {challenger || 'A'}
          </button>
          <button
            onClick={function() {
              if (socket) socket.emit('pk-cheer', { roomId: roomId, side: 'B', username: username || 'Viewer' });
            }}
            style={{ flex: 1, background: 'rgba(201,168,76,.2)', border: '1px solid rgba(201,168,76,.5)', borderRadius: 8, padding: '7px 0', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}>
            🔥 CHEER {defender || 'B'}
          </button>
        </div>
      )}

      {/* Battle Log */}
      <div style={cardStyle}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#8A7A62', letterSpacing: 2, marginBottom: 10 }}>
          BATTLE LOG
        </div>
        <div style={{ maxHeight: 120, overflowY: 'auto' }}>
          {lastLog.length === 0 ? (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A7A62', textAlign: 'center', padding: '12px 0' }}>
              No events yet...
            </div>
          ) : (
            lastLog.map(function(entry, idx) {
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '5px 0',
                    borderBottom: '1px solid rgba(255,255,255,.04)',
                    alignItems: 'flex-start'
                  }}
                >
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8A7A62', flexShrink: 0, marginTop: 1 }}>
                    {entry.time}
                  </span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: '#F0E8D4' }}>
                    {entry.text}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Host Battle Control Panel */}
      {isHost && (
        <div style={{ background: 'rgba(26,21,16,.95)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: '12px 14px', marginTop: 4 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', letterSpacing: 2, marginBottom: 10 }}>⚙ HOST CONTROLS</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={endBattle}
              style={{
                flex: 1,
                padding: '11px',
                background: 'linear-gradient(135deg,rgba(128,0,32,.4),rgba(128,0,32,.2))',
                border: '1px solid rgba(128,0,32,.6)',
                borderRadius: 9,
                color: '#FF1A3C',
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 15,
                letterSpacing: 2,
                cursor: 'pointer',
              }}
            >
              ■ END BATTLE
            </button>
            <button
              onClick={handleRematch}
              style={{
                flex: 1,
                padding: '11px',
                background: 'rgba(201,168,76,.1)',
                border: '1px solid rgba(201,168,76,.35)',
                borderRadius: 9,
                color: '#C9A84C',
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 15,
                letterSpacing: 2,
                cursor: 'pointer',
              }}
            >
              ⚔️ REMATCH
            </button>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
              <div style={{ height: 4, width: cPct + '%', background: 'linear-gradient(90deg,#800020,#C01838)', borderRadius: 2, transition: 'width .4s ease' }} />
            </div>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF1A3C', minWidth: 30, textAlign: 'right' }}>{cPct}%</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>vs</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', minWidth: 30 }}>{dPct}%</span>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
              <div style={{ height: 4, width: dPct + '%', background: 'linear-gradient(90deg,#C9A84C,#D4854A)', borderRadius: 2, transition: 'width .4s ease' }} />
            </div>
          </div>
        </div>
      )}
    </div>
    </UpgradeGate>
  );
}
