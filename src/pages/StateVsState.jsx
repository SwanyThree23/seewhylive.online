import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
const BG   = '#080B18';
const BG2  = '#0D1022';
const BG3  = '#13182C';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const BLUE  = '#1565C0';
const RED2  = '#C62828';
const TEAL  = '#1ABC9C';
const CYAN  = '#00d4ff';
const T     = { fontFamily: 'Barlow Condensed, sans-serif' };

const STATES_DATA = [
  {
    id: 'wa', name: 'Washington', abbr: 'WA', color: BLUE,
    record: { w: 4, l: 1 }, pts: 1820,
    players: ['K. Daniels', 'T. Brooks', 'M. Evans', 'J. Carter', 'L. Hayes'],
  },
  {
    id: 'ca', name: 'California', abbr: 'CA', color: '#1B5E20',
    record: { w: 3, l: 2 }, pts: 1650,
    players: ['D. Reyes', 'A. Nguyen', 'C. Moore', 'R. Torres', 'P. Green'],
  },
  {
    id: 'tx', name: 'Texas', abbr: 'TX', color: '#B71C1C',
    record: { w: 3, l: 2 }, pts: 1610,
    players: ['B. Williams', 'S. Johnson', 'H. Davis', 'N. Wilson', 'F. Martinez'],
  },
  {
    id: 'fl', name: 'Florida', abbr: 'FL', color: '#E65100',
    record: { w: 3, l: 1 }, pts: 1740,
    players: ['O. Smith', 'V. Brown', 'Q. Jones', 'I. Garcia', 'E. Miller'],
  },
  {
    id: 'ny', name: 'New York', abbr: 'NY', color: '#4A148C',
    record: { w: 2, l: 3 }, pts: 1380,
    players: ['Z. Anderson', 'W. Thomas', 'U. Jackson', 'Y. White', 'X. Harris'],
  },
  {
    id: 'ga', name: 'Georgia', abbr: 'GA', color: '#BF360C',
    record: { w: 1, l: 4 }, pts: 1120,
    players: ['G. Lewis', 'J. Robinson', 'P. Walker', 'K. Hall', 'T. Allen'],
  },
];

const BRACKET_MATCHES = [
  {
    id: 'qf1', round: 'QF', status: 'complete',
    teamA: 'wa', teamB: 'ny', scoreA: 7, scoreB: 3,
  },
  {
    id: 'qf2', round: 'QF', status: 'complete',
    teamA: 'fl', teamB: 'ga', scoreA: 7, scoreB: 4,
  },
  {
    id: 'qf3', round: 'QF', status: 'complete',
    teamA: 'ca', teamB: 'tx', scoreA: 5, scoreB: 7,
  },
  {
    id: 'sf1', round: 'SF', status: 'live',
    teamA: 'wa', teamB: 'fl', scoreA: 4, scoreB: 3,
  },
  {
    id: 'sf2', round: 'SF', status: 'upcoming',
    teamA: 'tx', teamB: null, scoreA: 0, scoreB: 0,
  },
  {
    id: 'final', round: 'FINAL', status: 'upcoming',
    teamA: null, teamB: null, scoreA: 0, scoreB: 0,
  },
];

const INITIAL_PLAYS = [
  { time: '12:04', player: 'K. Daniels', action: 'Double domino block', pts: 4 },
  { time: '10:58', player: 'O. Smith', action: 'Spinner chain play', pts: 3 },
  { time: '9:33', player: 'T. Brooks', action: 'Closing hand sweep', pts: 2 },
  { time: '8:17', player: 'V. Brown', action: 'Draw challenge win', pts: 1 },
];

function GCard({ children, style = {}, glow = false }) {
  return (
    <div style={{
      background: BG2,
      border: `1px solid ${glow ? GOLD : 'rgba(212,175,55,0.12)'}`,
      borderRadius: 14,
      padding: 14,
      boxShadow: glow ? `0 0 18px rgba(212,175,55,0.22)` : 'none',
      transition: 'box-shadow 0.3s',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Tag({ label, color }) {
  return (
    <span style={{
      background: color + '22',
      color: color,
      border: `1px solid ${color}44`,
      borderRadius: 999,
      padding: '2px 9px',
      fontSize: 10,
      fontFamily: 'Barlow Condensed, sans-serif',
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function Btn({ label, icon, onClick, variant = 'gold', size = 'md', disabled = false, style = {} }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: 'none',
    borderRadius: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'Barlow Condensed, sans-serif',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    transition: 'opacity 0.2s, transform 0.15s',
    opacity: disabled ? 0.5 : 1,
    fontSize: size === 'sm' ? 11 : size === 'lg' ? 15 : 13,
    padding: size === 'sm' ? '5px 12px' : size === 'lg' ? '11px 24px' : '8px 16px',
  };
  const variants = {
    gold: { background: GOLD, color: '#000' },
    ghost: { background: 'transparent', color: GOLD, border: `1px solid ${GOLD}66` },
    ruby: { background: CRIMSON, color: '#fff' },
    state: { background: `linear-gradient(135deg, ${BLUE}, ${RED2})`, color: '#fff' },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}

function StateCircle({ stateId, size = 36 }) {
  const s = STATES_DATA.find(x => x.id === stateId);
  if (!s) return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: BG3,
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.28, fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif',
      color: 'rgba(255,255,255,0.3)',
    }}>?</div>
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: s.color,
      border: `2px solid ${s.color}88`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif',
      color: '#fff',
      fontWeight: 700,
      flexShrink: 0,
    }}>
      {s.abbr}
    </div>
  );
}

function getState(id) {
  return STATES_DATA.find(x => x.id === id) || null;
}

function BracketView({ matches }) {
  const rounds = ['QF', 'SF', 'FINAL'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {rounds.map(round => {
        const rMatches = matches.filter(m => m.round === round);
        return (
          <div key={round}>
            <div style={{ ...T, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', marginBottom: 8 }}>
              — {round} —
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rMatches.map(m => {
                const isLive = m.status === 'live';
                const isDone = m.status === 'complete';
                const sA = getState(m.teamA);
                const sB = getState(m.teamB);
                return (
                  <GCard key={m.id} glow={isLive}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Tag label={m.round} color={GOLD} />
                        {isLive && <Tag label="LIVE" color={RED2} />}
                        {isDone && <Tag label="COMPLETE" color={TEAL} />}
                        {!isLive && !isDone && <Tag label="UPCOMING" color="rgba(255,255,255,0.35)" />}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                        <StateCircle stateId={m.teamA} size={40} />
                        <div>
                          <div style={{ fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif', fontSize: 18, color: '#fff', lineHeight: 1 }}>
                            {sA ? sA.name : 'TBD'}
                          </div>
                          {sA && <div style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{sA.record.w}W–{sA.record.l}L</div>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{
                          fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif',
                          fontSize: 32,
                          color: isLive ? GOLD : isDone ? '#fff' : 'rgba(255,255,255,0.2)',
                          letterSpacing: 2,
                          lineHeight: 1,
                        }}>
                          {isDone || isLive ? `${m.scoreA}–${m.scoreB}` : 'VS'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif', fontSize: 18, color: '#fff', lineHeight: 1 }}>
                            {sB ? sB.name : 'TBD'}
                          </div>
                          {sB && <div style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{sB.record.w}W–{sB.record.l}L</div>}
                        </div>
                        <StateCircle stateId={m.teamB} size={40} />
                      </div>
                    </div>
                    {isLive && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                        <Link to="/Discover" style={{ textDecoration: 'none' }}>
                          <Btn label="WATCH NOW" variant="gold" size="sm" />
                        </Link>
                        <Link to="/WatchParty" style={{ textDecoration: 'none' }}>
                          <Btn label="WATCH PARTY" variant="ghost" size="sm" />
                        </Link>
                      </div>
                    )}
                  </GCard>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RostersView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {STATES_DATA.map(s => (
        <GCard key={s.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <StateCircle stateId={s.id} size={44} />
            <div>
              <div style={{ fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif', fontSize: 20, color: '#fff', lineHeight: 1 }}>{s.name}</div>
              <div style={{ ...T, fontSize: 11, color: s.color, fontWeight: 700 }}>{s.record.w}W – {s.record.l}L · {s.pts} PTS</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {s.players.map(p => (
              <span key={p} style={{
                background: s.color + '22',
                border: `1px solid ${s.color}44`,
                color: '#fff',
                borderRadius: 20,
                padding: '3px 10px',
                fontSize: 11,
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 600,
              }}>{p}</span>
            ))}
          </div>
          <Btn label="JOIN TEAM" variant="ghost" size="sm" />
        </GCard>
      ))}
    </div>
  );
}

function LiveMatchView() {
  const [scores, setScores] = useState({ wa: 4, fl: 3 });
  const [plays, setPlays] = useState(INITIAL_PLAYS);
  const wa = getState('wa');
  const fl = getState('fl');

  function addGame(side) {
    setScores(prev => ({ ...prev, [side]: prev[side] + 1 }));
  }

  function addPlay() {
    const newPlay = {
      time: `${Math.floor(Math.random() * 12)}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`,
      player: plays.length % 2 === 0 ? 'K. Daniels' : 'O. Smith',
      action: 'Manual log play',
      pts: 1,
    };
    setPlays(prev => [newPlay, ...prev]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <GCard glow>
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <Tag label="SEMIFINAL · LIVE" color={RED2} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
            <StateCircle stateId="wa" size={56} />
            <div style={{ fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif', fontSize: 16, color: '#fff' }}>{wa.name}</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif',
              fontSize: 56,
              color: GOLD,
              lineHeight: 1,
              letterSpacing: 4,
            }}>
              {scores.wa}–{scores.fl}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
            <StateCircle stateId="fl" size={56} />
            <div style={{ fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif', fontSize: 16, color: '#fff' }}>{fl.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8 }}>
          <Btn label="+1 GAME WA" variant="state" size="sm" onClick={() => addGame('wa')} />
          <Btn label="+1 GAME FL" variant="ruby" size="sm" onClick={() => addGame('fl')} />
        </div>
      </GCard>
      <GCard>
        <div style={{ ...T, fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 10, letterSpacing: '0.06em' }}>LIVE PLAY LOG</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {plays.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px',
              background: BG3,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ ...T, fontSize: 11, color: TEAL, fontWeight: 700, minWidth: 38 }}>{p.time}</span>
              <span style={{ ...T, fontSize: 12, color: '#fff', fontWeight: 600, flex: 1 }}>{p.player}</span>
              <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.5)', flex: 2 }}>{p.action}</span>
              <span style={{ ...T, fontSize: 12, color: GOLD, fontWeight: 700, minWidth: 28, textAlign: 'right' }}>+{p.pts}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <Btn label="+ LOG PLAY" variant="ghost" size="sm" onClick={addPlay} />
        </div>
      </GCard>
    </div>
  );
}

function StandingsView() {
  const sorted = [...STATES_DATA].sort((a, b) => b.pts - a.pts);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.map((s, i) => {
        const isFirst = i === 0;
        return (
          <div key={s.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            background: isFirst ? `${GOLD}18` : BG2,
            border: `1px solid ${isFirst ? GOLD + '55' : 'rgba(212,175,55,0.1)'}`,
            borderRadius: 12,
          }}>
            <div style={{
              fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif',
              fontSize: 22,
              color: isFirst ? GOLD : 'rgba(255,255,255,0.3)',
              minWidth: 28,
              textAlign: 'center',
            }}>
              {i + 1}
            </div>
            <StateCircle stateId={s.id} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif', fontSize: 17, color: '#fff', lineHeight: 1 }}>{s.name}</div>
              <div style={{ ...T, fontSize: 11, color: s.color, fontWeight: 700, marginTop: 2 }}>{s.record.w}W – {s.record.l}L</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif', fontSize: 20, color: isFirst ? GOLD : '#fff' }}>{s.pts}</div>
              <div style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>PTS</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const ROUND_RULES = [
  { rule: 'Win a round (opponent blocked)',   pts: '+1 Match Point' },
  { rule: 'Domino out (all tiles played)',    pts: '+2 Match Points' },
  { rule: 'Shut-out win (opponent scores 0)', pts: '+3 Match Points' },
  { rule: 'Tiebreaker',                       pts: 'Pip count differential' },
  { rule: 'Time violation (3rd offense)',     pts: '−1 Match Point' },
  { rule: 'Forfeit',                          pts: 'Opponent wins 3–0' },
];

function JudgesView() {
  const [rounds, setRounds] = useState([
    { round: 1, home: '', away: '', notes: '', locked: false },
    { round: 2, home: '', away: '', notes: '', locked: false },
    { round: 3, home: '', away: '', notes: '', locked: false },
    { round: 4, home: '', away: '', notes: '', locked: false },
    { round: 5, home: '', away: '', notes: '', locked: false },
  ]);
  const [ruling, setRuling] = useState('');
  const [rulingLog, setRulingLog] = useState([]);
  const [matchPaused, setMatchPaused] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [timerSecs, setTimerSecs] = useState(480);
  const [timerRunning, setTimerRunning] = useState(false);
  const [checkDone, setCheckDone] = useState(Array(6).fill(false));
  const [copiedRuling, setCopiedRuling] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (timerRunning && timerSecs > 0) {
      intervalRef.current = setInterval(() => setTimerSecs(s => s - 1), 1000);
    } else {
      clearInterval(intervalRef.current);
      if (timerSecs === 0) setTimerRunning(false);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning, timerSecs]);

  const timerColor = timerSecs <= 30 ? RED2 : timerSecs <= 60 ? GOLD : TEAL;
  const timerDisplay = `${Math.floor(timerSecs / 60)}:${String(timerSecs % 60).padStart(2, '0')}`;

  function lockRound(i) {
    const r = rounds[i];
    if (!r.home.trim() || !r.away.trim()) return;
    setRounds(prev => prev.map((x, idx) => idx === i ? { ...x, locked: true } : x));
  }

  function broadcastRuling() {
    if (!ruling.trim()) return;
    setRulingLog(log => [{ text: ruling, ts: new Date().toLocaleTimeString() }, ...log]);
    setRuling('');
  }

  function copyRuling(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedRuling(true);
      setTimeout(() => setCopiedRuling(false), 1500);
    });
  }

  const lockedCount = rounds.filter(r => r.locked).length;
  const homeTotal = rounds.filter(r => r.locked).reduce((s, r) => s + (parseInt(r.home) || 0), 0);
  const awayTotal = rounds.filter(r => r.locked).reduce((s, r) => s + (parseInt(r.away) || 0), 0);

  const preCheckSteps = [
    'Confirm judge credentials active (role = judge)',
    'Verify active match ID loaded in scorecard',
    'Sync with both state captains before tip-off',
    'Confirm stream overlay receiving judge:score events',
    'Guardian AI monitoring match chat',
    'Acknowledge match rules with both teams',
  ];

  const inputStyle = {
    width: '100%',
    background: BG3,
    border: `1px solid rgba(255,255,255,0.12)`,
    borderRadius: 8,
    padding: '8px 10px',
    color: '#fff',
    fontFamily: 'Barlow Condensed, sans-serif',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Timer + Match Control */}
      <GCard glow={matchPaused || timerRunning}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ ...T, fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 4 }}>ROUND TIMER</div>
            <div style={{
              fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif',
              fontSize: 48, lineHeight: 1,
              color: timerColor,
              letterSpacing: 2,
            }}>{timerDisplay}</div>
            {timerSecs <= 30 && timerSecs > 0 && (
              <div style={{ ...T, fontSize: 11, color: RED2, fontWeight: 700, animation: 'pulse 1s infinite' }}>⚠ TIME WARNING</div>
            )}
            {timerSecs === 0 && (
              <div style={{ ...T, fontSize: 11, color: RED2, fontWeight: 700 }}>⏱ TIME EXPIRED</div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn
                label={timerRunning ? '⏸ PAUSE' : '▶ START'}
                variant={timerRunning ? 'ruby' : 'gold'}
                size="sm"
                onClick={() => setTimerRunning(r => !r)}
              />
              <Btn
                label="RESET"
                variant="ghost"
                size="sm"
                onClick={() => { setTimerRunning(false); setTimerSecs(480); }}
              />
            </div>
            <Btn
              label={matchPaused ? '▶ RESUME MATCH' : '⏸ PAUSE MATCH'}
              variant={matchPaused ? 'state' : 'ruby'}
              size="sm"
              onClick={() => setMatchPaused(p => !p)}
            />
          </div>
        </div>
        {matchPaused && (
          <div style={{
            marginTop: 10, padding: '8px 12px',
            background: `${RED2}22`, border: `1px solid ${RED2}55`,
            borderRadius: 8, ...T, fontSize: 12, color: RED2, fontWeight: 700,
          }}>⏸ MATCH PAUSED — Visible on stream overlay</div>
        )}
        {disputeOpen && (
          <div style={{
            marginTop: 8, padding: '8px 12px',
            background: `${GOLD}18`, border: `1px solid ${GOLD}55`,
            borderRadius: 8, ...T, fontSize: 12, color: GOLD, fontWeight: 700,
          }}>⚖️ DISPUTE OPEN — Under review</div>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <Btn
            label={disputeOpen ? '✓ RESOLVE DISPUTE' : '⚖️ OPEN DISPUTE'}
            variant={disputeOpen ? 'state' : 'ghost'}
            size="sm"
            onClick={() => { setDisputeOpen(d => !d); if (!matchPaused) setMatchPaused(true); }}
          />
        </div>
      </GCard>

      {/* Live Scoreboard */}
      <GCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ ...T, fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: '0.08em' }}>DIGITAL SCORECARD</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ textAlign: 'center', padding: '4px 14px', background: `${BLUE}22`, border: `1px solid ${BLUE}44`, borderRadius: 8 }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#fff', lineHeight: 1 }}>{homeTotal}</div>
              <div style={{ ...T, fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>WA</div>
            </div>
            <div style={{ textAlign: 'center', padding: '4px 14px', background: `${RED2}22`, border: `1px solid ${RED2}44`, borderRadius: 8 }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#fff', lineHeight: 1 }}>{awayTotal}</div>
              <div style={{ ...T, fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>FL</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rounds.map((r, i) => (
            <div key={i} style={{
              padding: '10px 12px',
              background: r.locked ? `${TEAL}0E` : BG3,
              border: `1px solid ${r.locked ? TEAL + '44' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: r.locked ? 0 : 8 }}>
                <span style={{ ...T, fontSize: 11, color: r.locked ? TEAL : 'rgba(255,255,255,0.5)', fontWeight: 700, minWidth: 50 }}>
                  RD {r.round} {r.locked ? '✓' : ''}
                </span>
                {r.locked ? (
                  <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                    <span style={{ ...T, fontSize: 13, color: '#fff', fontWeight: 700 }}>WA: <span style={{ color: GOLD }}>{r.home}</span></span>
                    <span style={{ ...T, fontSize: 13, color: '#fff', fontWeight: 700 }}>FL: <span style={{ color: GOLD }}>{r.away}</span></span>
                    {r.notes && <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', flex: 1 }}>{r.notes}</span>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                    <input
                      type="number" min="0" placeholder="WA pts"
                      value={r.home}
                      onChange={e => setRounds(prev => prev.map((x, idx) => idx === i ? { ...x, home: e.target.value } : x))}
                      style={{ ...inputStyle, width: 72 }}
                    />
                    <input
                      type="number" min="0" placeholder="FL pts"
                      value={r.away}
                      onChange={e => setRounds(prev => prev.map((x, idx) => idx === i ? { ...x, away: e.target.value } : x))}
                      style={{ ...inputStyle, width: 72 }}
                    />
                    <input
                      placeholder="Notes (optional)"
                      value={r.notes}
                      onChange={e => setRounds(prev => prev.map((x, idx) => idx === i ? { ...x, notes: e.target.value } : x))}
                      style={{ ...inputStyle, flex: 1, minWidth: 100 }}
                    />
                    <Btn
                      label="LOCK"
                      variant="gold"
                      size="sm"
                      disabled={!r.home.trim() || !r.away.trim()}
                      onClick={() => lockRound(i)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
          {lockedCount}/5 rounds locked · Best of 5 · First to 3 wins
        </div>
      </GCard>

      {/* Official Ruling Broadcast */}
      <GCard>
        <div style={{ ...T, fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: '0.08em', marginBottom: 10 }}>
          📣 OFFICIAL RULING BROADCAST
        </div>
        <textarea
          value={ruling}
          onChange={e => setRuling(e.target.value)}
          placeholder="Type an official ruling, foul call, or announcement to broadcast to all viewers…"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn
            label="📡 BROADCAST RULING"
            variant="ruby"
            size="sm"
            disabled={!ruling.trim()}
            onClick={broadcastRuling}
          />
        </div>
        {rulingLog.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.1em' }}>RULING LOG</div>
            {rulingLog.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '8px 10px',
                background: `${CRIMSON}18`, border: `1px solid ${CRIMSON}44`,
                borderRadius: 8,
              }}>
                <span style={{ ...T, fontSize: 10, color: GOLD, minWidth: 50, flexShrink: 0 }}>{r.ts}</span>
                <span style={{ ...T, fontSize: 12, color: '#fff', flex: 1 }}>{r.text}</span>
                <button
                  onClick={() => copyRuling(r.text)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', ...T, fontSize: 10, color: copiedRuling ? TEAL : 'rgba(255,255,255,0.3)', flexShrink: 0 }}
                >
                  {copiedRuling ? '✓' : '📋'}
                </button>
              </div>
            ))}
          </div>
        )}
      </GCard>

      {/* SVS Scoring Rules Quick Ref */}
      <GCard>
        <div style={{ ...T, fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: '0.08em', marginBottom: 10 }}>
          ⚖️ SCORING RULES — QUICK REF
        </div>
        {ROUND_RULES.map(r => (
          <div key={r.rule} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{r.rule}</span>
            <span style={{ ...T, fontSize: 12, color: GOLD, fontWeight: 700 }}>{r.pts}</span>
          </div>
        ))}
        <Link to="/StreamRefDash" style={{ textDecoration: 'none' }}>
          <div style={{ ...T, fontSize: 11, color: CYAN, marginTop: 10, textAlign: 'right', fontWeight: 700 }}>
            Full Judges Reference → StreamRefDash ⚖️
          </div>
        </Link>
      </GCard>

      {/* Pre-Match Checklist */}
      <GCard>
        <div style={{ ...T, fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: '0.08em', marginBottom: 8 }}>
          ✅ PRE-MATCH JUDGE CHECKLIST
        </div>
        {preCheckSteps.map((step, i) => (
          <div
            key={i}
            onClick={() => setCheckDone(d => d.map((v, j) => j === i ? !v : v))}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '8px 4px', cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              opacity: checkDone[i] ? 0.45 : 1,
            }}
          >
            <span style={{ ...T, fontSize: 14, color: checkDone[i] ? TEAL : 'rgba(255,255,255,0.25)', marginTop: 1, flexShrink: 0 }}>
              {checkDone[i] ? '✓' : '○'}
            </span>
            <span style={{
              ...T, fontSize: 12, color: '#fff',
              textDecoration: checkDone[i] ? 'line-through' : 'none',
            }}>{step}</span>
          </div>
        ))}
        <div style={{ ...T, fontSize: 11, color: GOLD, marginTop: 8 }}>
          {checkDone.filter(Boolean).length} / {preCheckSteps.length} complete
        </div>
      </GCard>

    </div>
  );
}

const TABS = ['BRACKET', 'ROSTERS', 'LIVE MATCH', 'STANDINGS', 'JUDGES'];

export default function StateVsState() {
  const [tab, setTab] = useState('BRACKET');
  const [matches, setMatches] = useState(BRACKET_MATCHES);

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '16px 16px 96px', fontFamily: 'Barlow Condensed, sans-serif' }}>
      <a href="/Leaderboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 12 }} aria-label="Back to Leaderboard">← Leaderboard</a>
      <div style={{
        background: `linear-gradient(160deg, #0D1022 0%, #080B18 60%, #1565C0 200%)`,
        borderRadius: 16,
        padding: '20px 16px',
        marginBottom: 18,
        border: `1px solid rgba(212,175,55,0.15)`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(135deg, rgba(21,101,192,0.12) 0%, rgba(198,40,40,0.12) 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif',
            fontSize: 32,
            color: GOLD,
            lineHeight: 1,
            letterSpacing: 3,
          }}>
            STATE VS STATE
          </div>
          <div style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.1em', marginTop: 2, marginBottom: 12 }}>
            HYBRID DOMINO TOURNAMENT SERIES
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <Tag label="LIVE ON SEEWHY" color={RED2} />
            <Tag label="7 ROCK · 5/150 · DBL ELIM" color={GOLD} />
            <Tag label="90/10 CREATOR SPLIT" color={TEAL} />
            <Tag label="ALL STATES WELCOME" color={CYAN} />
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        marginBottom: 18,
        paddingBottom: 4,
        scrollbarWidth: 'none',
      }}>
        {TABS.map(t => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: active ? GOLD : BG3,
                color: active ? '#000' : 'rgba(255,255,255,0.6)',
                border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 999,
                padding: '7px 16px',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s, color 0.2s',
                flexShrink: 0,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {tab === 'BRACKET' && <BracketView matches={matches} />}
      {tab === 'ROSTERS' && <RostersView />}
      {tab === 'LIVE MATCH' && <LiveMatchView />}
      {tab === 'STANDINGS' && <StandingsView />}
      {tab === 'JUDGES' && <JudgesView />}
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <BackgroundCustomizer />
    </div>
  );
}
