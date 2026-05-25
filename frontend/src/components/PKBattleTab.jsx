import React, { useState, useEffect, useRef } from 'react';

function pad2(n) { return n < 10 ? '0' + n : String(n); }
function fmtCountdown(s) {
  s = Math.floor(s) || 0;
  return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60);
}
function rndInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function fmtTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

var DURATION_LABELS = { 60: '1 MIN', 180: '3 MIN', 300: '5 MIN', 600: '10 MIN' };

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

  var countdownRef  = useRef(null);
  var simScoreRef   = useRef(null);
  var simLogRef     = useRef(null);

  function clearAllIntervals() {
    if (countdownRef.current)  { clearInterval(countdownRef.current);  countdownRef.current  = null; }
    if (simScoreRef.current)   { clearInterval(simScoreRef.current);   simScoreRef.current   = null; }
    if (simLogRef.current)     { clearInterval(simLogRef.current);     simLogRef.current     = null; }
  }

  useEffect(function() {
    return function() { clearAllIntervals(); };
  }, []);

  useEffect(function() {
    if (!socket) return;

    socket.on('pk-update', function(data) {
      if (data && typeof data.challengerScore === 'number') setChallengerScore(data.challengerScore);
      if (data && typeof data.defenderScore   === 'number') setDefenderScore(data.defenderScore);
    });

    return function() {
      socket.off('pk-update');
    };
  }, [socket]);

  function startBattle() {
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
      socket.emit('pk-battle-start', { roomId: roomId, challenger: cName, defender: dName, duration: selectedDuration });
    }

    clearAllIntervals();

    countdownRef.current = setInterval(function() {
      setCountdown(function(prev) {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          endBattle();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    simScoreRef.current = setInterval(function() {
      var pts = rndInt(1, 5);
      var side = Math.random() < 0.5 ? 'challenger' : 'defender';
      if (side === 'challenger') {
        setChallengerScore(function(prev) { return prev + pts; });
      } else {
        setDefenderScore(function(prev) { return prev + pts; });
      }
    }, 2000);

    simLogRef.current = setInterval(function() {
      var side   = Math.random() < 0.5 ? cName : dName;
      var viewer = 'viewer' + rndInt(100, 999);
      setBattleLog(function(prev) {
        var entry = { time: fmtTime(), text: '👍 ' + viewer + ' voted for ' + side };
        return prev.concat([entry]).slice(-50);
      });
    }, 10000);

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
          socket.emit('pk-battle-end', { roomId: roomId, winner: w, challengerScore: cScore, defenderScore: dScore });
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

  function resetBattle() {
    clearAllIntervals();
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
    background: '#0F0C14',
    minHeight: '100%',
    padding: '16px',
    fontFamily: "'Barlow Condensed',sans-serif",
    color: '#EDE8F5'
  };

  var cardStyle = {
    background: 'rgba(22,16,32,.8)',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: 12,
    padding: '20px',
    marginBottom: 16
  };

  var labelStyle = {
    fontFamily: "'Bebas Neue',sans-serif",
    fontSize: 11,
    letterSpacing: 2,
    color: '#7A6F90',
    marginBottom: 6,
    display: 'block'
  };

  var inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#EDE8F5',
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box'
  };

  // ── IDLE STATE ──────────────────────────────────────────────────────────────
  if (battleState === 'idle') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A84C', letterSpacing: 2, marginBottom: 4 }}>
            ⚡ PK BATTLE
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: '#7A6F90' }}>
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
                      color: isSelected ? '#C9A84C' : '#7A6F90',
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
                background: 'linear-gradient(135deg,#FF1564,#FF4D7D)',
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
          <div style={Object.assign({}, cardStyle, { textAlign: 'center', padding: '40px 20px' })}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#7A6F90', letterSpacing: 1 }}>
              WAITING FOR HOST TO START A BATTLE
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── ENDED STATE ─────────────────────────────────────────────────────────────
  if (battleState === 'ended') {
    return (
      <div style={containerStyle}>
        <div style={Object.assign({}, cardStyle, { textAlign: 'center', padding: '32px 20px' })}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🏆</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 40, color: '#C9A84C', letterSpacing: 2, marginBottom: 4 }}>
            {winner}
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: '#7A6F90', marginBottom: 24 }}>
            WINS THE PK BATTLE!
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#7A6F90', letterSpacing: 1 }}>
                {challenger}
              </div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: '#FF1564' }}>
                {challengerScore}
              </div>
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#FF1564', alignSelf: 'center' }}>VS</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#7A6F90', letterSpacing: 1 }}>
                {defender}
              </div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: '#00C9A7' }}>
                {defenderScore}
              </div>
            </div>
          </div>

          {isHost && (
            <button
              onClick={resetBattle}
              style={{
                padding: '12px 32px',
                background: 'rgba(201,168,76,.2)',
                border: '1px solid rgba(201,168,76,.5)',
                borderRadius: 10,
                color: '#C9A84C',
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 16,
                letterSpacing: 2,
                cursor: 'pointer'
              }}
            >
              START NEW BATTLE
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── ACTIVE BATTLE ───────────────────────────────────────────────────────────
  var countdownColor = countdown < 30 ? '#FF1564' : '#EDE8F5';
  var lastLog = battleLog.slice(-5);

  return (
    <div style={containerStyle}>
      {/* Countdown Timer */}
      <div style={Object.assign({}, cardStyle, { textAlign: 'center', padding: '16px 20px' })}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: countdownColor, letterSpacing: 4, lineHeight: 1 }}>
          {fmtCountdown(countdown)}
        </div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#7A6F90', letterSpacing: 1, marginTop: 4 }}>
          REMAINING
        </div>
      </div>

      {/* Score Split */}
      <div style={cardStyle}>
        {/* Names + Scores */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          {/* Challenger side */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#EDE8F5', letterSpacing: 1, marginBottom: 4 }}>
              {challenger}
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: '#C9A84C' }}>
              {challengerScore}
            </div>
          </div>

          {/* VS */}
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#FF1564', letterSpacing: 2, flexShrink: 0 }}>
            VS
          </div>

          {/* Defender side */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#EDE8F5', letterSpacing: 1, marginBottom: 4 }}>
              {defender}
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: '#00C9A7' }}>
              {defenderScore}
            </div>
          </div>
        </div>

        {/* Score Bar */}
        <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,.06)', marginBottom: 20 }}>
          <div style={{
            width: cPct + '%',
            background: 'linear-gradient(90deg,#FF1564,#FF4D7D)',
            transition: 'width .4s ease'
          }} />
          <div style={{
            width: dPct + '%',
            background: 'linear-gradient(90deg,#00C9A7,#00E5C0)',
            transition: 'width .4s ease'
          }} />
        </div>

        {/* Vote Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={function() { castVote('challenger'); }}
            disabled={myVote !== null}
            style={{
              flex: 1,
              padding: '12px',
              background: myVote === 'challenger' ? 'rgba(255,21,100,.4)' : 'rgba(255,21,100,.2)',
              border: '1px solid rgba(255,21,100,.5)',
              borderRadius: 10,
              color: myVote === 'challenger' ? '#FF1564' : '#EDE8F5',
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 14,
              letterSpacing: 1,
              cursor: myVote !== null ? 'not-allowed' : 'pointer',
              opacity: (myVote !== null && myVote !== 'challenger') ? 0.5 : 1
            }}
          >
            {myVote === 'challenger' ? '✓ VOTED' : 'VOTE ' + challenger}
          </button>
          <button
            onClick={function() { castVote('defender'); }}
            disabled={myVote !== null}
            style={{
              flex: 1,
              padding: '12px',
              background: myVote === 'defender' ? 'rgba(0,201,167,.4)' : 'rgba(0,201,167,.2)',
              border: '1px solid rgba(0,201,167,.5)',
              borderRadius: 10,
              color: myVote === 'defender' ? '#00C9A7' : '#EDE8F5',
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 14,
              letterSpacing: 1,
              cursor: myVote !== null ? 'not-allowed' : 'pointer',
              opacity: (myVote !== null && myVote !== 'defender') ? 0.5 : 1
            }}
          >
            {myVote === 'defender' ? '✓ VOTED' : 'VOTE ' + defender}
          </button>
        </div>
      </div>

      {/* Battle Log */}
      <div style={cardStyle}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#7A6F90', letterSpacing: 2, marginBottom: 10 }}>
          BATTLE LOG
        </div>
        <div style={{ maxHeight: 120, overflowY: 'auto' }}>
          {lastLog.length === 0 ? (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#7A6F90', textAlign: 'center', padding: '12px 0' }}>
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
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90', flexShrink: 0, marginTop: 1 }}>
                    {entry.time}
                  </span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: '#EDE8F5' }}>
                    {entry.text}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Host end-battle control */}
      {isHost && (
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <button
            onClick={endBattle}
            style={{
              padding: '10px 24px',
              background: 'rgba(255,21,100,.15)',
              border: '1px solid rgba(255,21,100,.4)',
              borderRadius: 8,
              color: '#FF1564',
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 13,
              letterSpacing: 1,
              cursor: 'pointer'
            }}
          >
            END BATTLE NOW
          </button>
        </div>
      )}
    </div>
  );
}
