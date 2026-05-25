import React, { useState, useEffect } from 'react';
import OctCell from './OctCell.jsx';
import rtcManager from '../webrtc.js';

const FADES_ROUNDS = ['ROUND 1', 'ROUND 2', 'ROUND 3', 'SUDDEN DEATH'];

export default function FadesTab({ socket, scores, guests, roomId, isLive }) {
  const [activeRound, setActiveRound] = useState(0);
  const [team1, setTeam1] = useState([]);
  const [team2, setTeam2] = useState([]);
  const [fadeScores, setFadeScores] = useState({ team1: 0, team2: 0 });
  const [roundWinner, setRoundWinner] = useState(null);
  const [fadesActive, setFadesActive] = useState(false);

  useEffect(() => {
    if (scores) setFadeScores(scores);
  }, [scores]);

  useEffect(() => {
    if (!socket) return;
    socket.on('fades-event', (data) => {
      if (!data) return;
      if (data.scores) setFadeScores(data.scores);
      if (data.roundWinner) setRoundWinner(data.roundWinner);
      if (data.type === 'fades-start') setFadesActive(true);
      if (data.type === 'fades-end') setFadesActive(false);
    });
    return () => { socket.off('fades-event'); };
  }, [socket]);

  function startFades() {
    if (!socket) return;
    setFadesActive(true);
    socket.emit('fades-event', { roomId, type: 'fades-start', scores: { team1: 0, team2: 0 } });
  }

  function scorePoint(teamKey) {
    if (!socket) return;
    const newScores = { ...fadeScores };
    newScores[teamKey] = newScores[teamKey] + 1;
    setFadeScores(newScores);
    socket.emit('fades-event', { roomId, type: 'score', scores: newScores });
  }

  const half = Math.floor(guests.length / 2);
  const t1Guests = guests.slice(0, half);
  const t2Guests = guests.slice(half);

  return (
    <div className="tab-panel fades-tab">
      {/* CRT scan overlay */}
      <div className="crt-overlay" />

      <div className="fades-header">
        <div className="fades-title-glyph">⚡ FADES</div>
        <div className="fades-subtitle">ONLINE CORRUPTION BATTLE SYSTEM</div>
      </div>

      {/* Round selector */}
      <div className="fades-rounds">
        {FADES_ROUNDS.map((r, i) => (
          <button
            key={r}
            className={'fades-round-btn' + (activeRound === i ? ' fades-round-btn--active' : '')}
            onClick={() => setActiveRound(i)}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Scoreboard */}
      <div className="fades-scoreboard">
        <div className="fades-team fades-team--1">
          <div className="fades-team-name">TEAM ALPHA</div>
          <div className="fades-score">{fadeScores.team1}</div>
          <button className="btn-gold" onClick={() => scorePoint('team1')} disabled={!fadesActive}>+1</button>
        </div>
        <div className="fades-vs">VS</div>
        <div className="fades-team fades-team--2">
          <div className="fades-team-name">TEAM OMEGA</div>
          <div className="fades-score">{fadeScores.team2}</div>
          <button className="btn-burg" onClick={() => scorePoint('team2')} disabled={!fadesActive}>+1</button>
        </div>
      </div>

      {roundWinner && (
        <div className="fades-winner-banner">
          🏆 {roundWinner} WINS THE ROUND!
        </div>
      )}

      {/* Team grids */}
      <div className="fades-teams-grid">
        <div className="fades-team-col">
          <div className="fades-col-header" style={{color:'#00FFFF'}}>ALPHA</div>
          <div className="oct-grid oct-grid--sm">
            {t1Guests.map((g) => (
              <OctCell
                key={g.guestId || g.userId}
                guest={{ ...g, teamColor: '#00FFFF' }}
                sz={120}
                fadesMode={fadesActive}
                branding={{ gold: '#00FFFF' }}
                socket={socket}
                roomId={roomId}
                userId={'viewer'}
                rtcManager={rtcManager}
              />
            ))}
          </div>
        </div>
        <div className="fades-team-col">
          <div className="fades-col-header" style={{color:'#FF0040'}}>OMEGA</div>
          <div className="oct-grid oct-grid--sm">
            {t2Guests.map((g) => (
              <OctCell
                key={g.guestId || g.userId}
                guest={{ ...g, teamColor: '#FF0040' }}
                sz={120}
                fadesMode={fadesActive}
                branding={{ gold: '#FF0040' }}
                socket={socket}
                roomId={roomId}
                userId={'viewer'}
                rtcManager={rtcManager}
              />
            ))}
          </div>
        </div>
      </div>

      {!fadesActive && (
        <button className="btn-gold btn-start-fades" onClick={startFades}>
          ⚡ INITIATE FADES
        </button>
      )}
      {fadesActive && (
        <button className="btn-burg" onClick={() => { setFadesActive(false); socket && socket.emit('fades-event', { roomId, type: 'fades-end', scores: fadeScores }); }}>
          END FADES
        </button>
      )}
    </div>
  );
}
