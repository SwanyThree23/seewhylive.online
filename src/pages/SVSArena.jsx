import React, { useReducer } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Swords, Trophy, MapPin, Users, Plus, Clock } from 'lucide-react';
import BattleScoreboard from '../components/live/BattleScoreboard';
import BattleMode from '../components/streaming/BattleMode';
import EngagementBadgesDisplay from '../components/live/EngagementBadgesDisplay';
import SocialLeaderboard from '../components/watchparty/SocialLeaderboard';

const VENUE = "Jamar's Sports Bar & Grill, Des Moines, WA";
const FORMAT = '7 Rock / 5-150 / Double Elimination';

const HISTORY = [
  { year: 2023, champion: 'Washington', score: '7-4', opponent: 'California', peak_viewers: 3840 },
  { year: 2024, champion: 'Washington', score: '7-6', opponent: 'Oregon', peak_viewers: 4920 },
  { year: 2025, champion: 'California', score: '7-5', opponent: 'Washington', peak_viewers: 6210 },
];

const INIT_BRACKET = {
  quarterfinals: [
    { id: 'qf1', stateA: 'Washington', stateB: 'Nevada', scoreA: 0, scoreB: 0, winner: null, live: true },
    { id: 'qf2', stateA: 'California', stateB: 'Arizona', scoreA: 0, scoreB: 0, winner: null, live: false },
    { id: 'qf3', stateA: 'Oregon', stateB: 'Utah', scoreA: 0, scoreB: 0, winner: null, live: false },
    { id: 'qf4', stateA: 'Texas', stateB: 'Colorado', scoreA: 0, scoreB: 0, winner: null, live: false },
  ],
  semifinals: [
    { id: 'sf1', stateA: 'TBD', stateB: 'TBD', scoreA: 0, scoreB: 0, winner: null, live: false },
    { id: 'sf2', stateA: 'TBD', stateB: 'TBD', scoreA: 0, scoreB: 0, winner: null, live: false },
  ],
  finals: [
    { id: 'f1', stateA: 'TBD', stateB: 'TBD', scoreA: 0, scoreB: 0, winner: null, live: false },
  ],
};

const STATE_ROSTERS = {
  Washington: [
    { name: 'SwanyThree23', role: 'CAPTAIN', gems: 8420, wins: 34 },
    { name: 'DominoKing_WA', role: 'ANCHOR', gems: 6180, wins: 28 },
    { name: 'WashingtonDomz', role: 'PLAYER', gems: 3810, wins: 19 },
    { name: 'PNW_Bones', role: 'PLAYER', gems: 2140, wins: 14 },
  ],
  California: [
    { name: 'CaliBones_Champ', role: 'CAPTAIN', gems: 7240, wins: 31 },
    { name: 'LADomino_King', role: 'ANCHOR', gems: 5890, wins: 26 },
    { name: 'BayArea_Bones', role: 'PLAYER', gems: 3210, wins: 18 },
    { name: 'SoCal_Domz', role: 'PLAYER', gems: 1980, wins: 12 },
  ],
};

const ROLE_COLORS = { CAPTAIN: '#d4af37', ANCHOR: '#C0392B', PLAYER: '#D4854A' };

const initState = {
  tab: 'bracket',
  bracket: INIT_BRACKET,
  activeMatch: 'qf1',
  matchLog: [],
  selectedState: 'Washington',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAB': return { ...state, tab: action.payload };
    case 'SET_ACTIVE': return { ...state, activeMatch: action.payload };
    case 'SET_STATE': return { ...state, selectedState: action.payload };
    case 'SCORE': {
      var rounds = ['quarterfinals', 'semifinals', 'finals'];
      var newBracket = JSON.parse(JSON.stringify(state.bracket));
      var newLog = [...state.matchLog];
      for (var round of rounds) {
        var idx = newBracket[round].findIndex(m => m.id === action.matchId);
        if (idx !== -1) {
          var match = newBracket[round][idx];
          if (action.side === 'A') match.scoreA += 1;
          else match.scoreB += 1;
          newLog.unshift({
            id: Date.now(),
            text: action.side === 'A' ? match.stateA + ' scores!' : match.stateB + ' scores!',
            scoreA: match.scoreA,
            scoreB: match.scoreB,
            ts: new Date().toLocaleTimeString(),
          });
          if (match.scoreA >= 7) match.winner = 'A';
          if (match.scoreB >= 7) match.winner = 'B';
          break;
        }
      }
      return { ...state, bracket: newBracket, matchLog: newLog };
    }
    default: return state;
  }
}

function StateFlag({ state: st }) {
  var colors = { Washington: '#4A90D9', California: '#C4170C', Oregon: '#2E8B57', Nevada: '#C9A832', Arizona: '#8B0000', Utah: '#990000', Texas: '#BF0A30', Colorado: '#002868' };
  return <div style={{ width: 12, height: 12, borderRadius: 3, background: colors[st] || '#666', flexShrink: 0 }} />;
}

function MatchCard({ match, active, onClick }) {
  var hasWinner = match.winner !== null;
  return (
    <div
      onClick={() => !match.winner && onClick(match.id)}
      style={{
        background: match.live ? 'rgba(192,57,43,0.1)' : 'rgba(255,255,255,0.03)',
        border: match.live ? '1px solid rgba(192,57,43,0.4)' : active ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: '10px 12px', cursor: match.winner ? 'default' : 'pointer', transition: 'all 0.15s', minWidth: 160,
      }}
    >
      {match.live && (
        <div style={{ fontSize: 9, fontWeight: 900, color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C0392B' }} /> LIVE
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <StateFlag state={match.stateA} />
          <span style={{ fontSize: 12, fontWeight: match.winner === 'A' ? 900 : 700, color: match.winner === 'A' ? '#d4af37' : match.winner === 'B' ? 'rgba(255,255,255,0.3)' : '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{match.stateA}</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 900, color: match.winner === 'A' ? '#d4af37' : '#D4854A', fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1 }}>{match.scoreA}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <StateFlag state={match.stateB} />
          <span style={{ fontSize: 12, fontWeight: match.winner === 'B' ? 900 : 700, color: match.winner === 'B' ? '#d4af37' : match.winner === 'A' ? 'rgba(255,255,255,0.3)' : '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{match.stateB}</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 900, color: match.winner === 'B' ? '#d4af37' : '#C0392B', fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1 }}>{match.scoreB}</span>
      </div>
      {match.winner && (
        <div style={{ marginTop: 6, fontSize: 10, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, textAlign: 'center' }}>
          🏆 {match.winner === 'A' ? match.stateA : match.stateB} WINS
        </div>
      )}
    </div>
  );
}

function findActiveMatch(bracket, id) {
  for (var round of ['quarterfinals', 'semifinals', 'finals']) {
    var m = bracket[round].find(x => x.id === id);
    if (m) return m;
  }
  return null;
}

export default function SVSArena() {
  const [state, dispatch] = useReducer(reducer, initState);
  var activeMatch = findActiveMatch(state.bracket, state.activeMatch);
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const roomId = new URLSearchParams(window.location.search).get('room_id');

  return (
    <div style={{ minHeight: '100vh', background: '#07050A', color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.65)', borderBottom: '1px solid rgba(212,175,55,0.15)', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #800020, #d4af37)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Swords size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>STATE VS STATE ARENA</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Washington Classic 2026 · {FORMAT}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <MapPin size={12} /> {VENUE}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', padding: '0 16px' }}>
        {['bracket', 'scoring', 'rosters', 'history'].map(tab => (
          <button key={tab} onClick={() => dispatch({ type: 'SET_TAB', payload: tab })}
            style={{ padding: '11px 16px', background: 'none', border: 'none', borderBottom: state.tab === tab ? '2px solid #d4af37' : '2px solid transparent', color: state.tab === tab ? '#d4af37' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {tab === 'bracket' ? '🏆 Bracket' : tab === 'scoring' ? '⚡ Live Scoring' : tab === 'rosters' ? '👥 Rosters' : '📜 History'}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 16px' }}>

        {/* BRACKET */}
        {state.tab === 'bracket' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              { label: 'QUARTERFINALS', key: 'quarterfinals' },
              { label: 'SEMIFINALS', key: 'semifinals' },
              { label: 'FINALS', key: 'finals' },
            ].map(round => (
              <div key={round.key}>
                <div style={{ fontSize: 11, fontWeight: 700, color: round.key === 'finals' ? '#d4af37' : 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', marginBottom: 10, fontFamily: 'Barlow Condensed, sans-serif' }}>{round.label}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {state.bracket[round.key].map(match => (
                    <MatchCard key={match.id} match={match} active={state.activeMatch === match.id} onClick={id => dispatch({ type: 'SET_ACTIVE', payload: id })} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SCORING */}
        {state.tab === 'scoring' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Match selector */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 10, fontFamily: 'Barlow Condensed, sans-serif' }}>SELECT MATCH</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[...state.bracket.quarterfinals, ...state.bracket.semifinals, ...state.bracket.finals].map(m => (
                    <button key={m.id} onClick={() => dispatch({ type: 'SET_ACTIVE', payload: m.id })}
                      style={{ padding: '5px 12px', borderRadius: 8, border: state.activeMatch === m.id ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.1)', background: state.activeMatch === m.id ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)', color: state.activeMatch === m.id ? '#d4af37' : 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                      {m.stateA} vs {m.stateB}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live scoreboard */}
              {activeMatch && !activeMatch.winner && (
                <div style={{ background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 14, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C0392B' }} />
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>LIVE SCORING · {FORMAT}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 8 }}>{activeMatch.stateA}</div>
                      <div style={{ fontSize: 72, fontWeight: 900, color: '#4A90D9', fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1 }}>{activeMatch.scoreA}</div>
                      <button onClick={() => dispatch({ type: 'SCORE', matchId: activeMatch.id, side: 'A' })}
                        style={{ marginTop: 12, padding: '10px 24px', background: 'rgba(74,144,217,0.2)', border: '1px solid rgba(74,144,217,0.4)', borderRadius: 8, color: '#4A90D9', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Plus size={14} /> +1 POINT
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <Swords size={24} color="#d4af37" />
                      <span style={{ fontSize: 11, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>VS</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 8 }}>{activeMatch.stateB}</div>
                      <div style={{ fontSize: 72, fontWeight: 900, color: '#C4170C', fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1 }}>{activeMatch.scoreB}</div>
                      <button onClick={() => dispatch({ type: 'SCORE', matchId: activeMatch.id, side: 'B' })}
                        style={{ marginTop: 12, padding: '10px 24px', background: 'rgba(196,23,12,0.2)', border: '1px solid rgba(196,23,12,0.4)', borderRadius: 8, color: '#C0392B', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Plus size={14} /> +1 POINT
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>First to 7 wins · {FORMAT}</div>
                </div>
              )}
              {activeMatch && activeMatch.winner && (
                <div style={{ textAlign: 'center', padding: 32, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 14 }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>{activeMatch.winner === 'A' ? activeMatch.stateA : activeMatch.stateB} WINS!</div>
                  <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif', marginTop: 4 }}>Final: {activeMatch.scoreA} — {activeMatch.scoreB}</div>
                </div>
              )}
            </div>

            {/* Match log */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', maxHeight: 420, overflow: 'hidden' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 10, fontFamily: 'Barlow Condensed, sans-serif', flexShrink: 0 }}>MATCH LOG</div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {state.matchLog.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 20, fontFamily: 'Barlow Condensed, sans-serif' }}>No events yet</div>
                ) : state.matchLog.map(log => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif', flexShrink: 0 }}>{log.ts}</span>
                    <span style={{ fontSize: 12, color: '#fff', flex: 1 }}>{log.text}</span>
                    <span style={{ fontSize: 11, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, flexShrink: 0 }}>{log.scoreA}—{log.scoreB}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ROSTERS */}
        {state.tab === 'rosters' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {Object.keys(STATE_ROSTERS).map(st => (
                <button key={st} onClick={() => dispatch({ type: 'SET_STATE', payload: st })}
                  style={{ padding: '6px 16px', borderRadius: 8, border: state.selectedState === st ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.12)', background: state.selectedState === st ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)', color: state.selectedState === st ? '#d4af37' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StateFlag state={st} /> {st}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(STATE_ROSTERS[state.selectedState] || []).map((player, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(212,175,55,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {player.role === 'CAPTAIN' ? '👑' : player.role === 'ANCHOR' ? '⚓' : '🎯'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{player.name}</div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: ROLE_COLORS[player.role] || '#fff', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em', marginTop: 2 }}>{player.role}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>{player.gems.toLocaleString()} 💎</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{player.wins}W</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY */}
        {state.tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 4 }}>WASHINGTON CLASSIC CHAMPIONS</div>
            {HISTORY.map(h => (
              <div key={h.year} style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1 }}>{h.year}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>SEASON</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', flex: 1 }}>
                  🏆 {h.champion}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>{h.score}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>vs {h.opponent}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif' }}>{h.peak_viewers.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>PEAK VIEWERS</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 32 }}>
        <BattleScoreboard roomId={roomId} />
        <BattleMode roomId={roomId} isHost={false} hostName={null} participants={[]} />
        <EngagementBadgesDisplay roomId={roomId} userId={user?.id} creatorId={user?.id} />
        <SocialLeaderboard roomId={roomId} />
      </div>
    </div>
  );
}
