import React, { useState } from 'react';

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
                        <Btn label="WATCH NOW" variant="gold" size="sm" />
                        <Btn label="WATCH PARTY" variant="ghost" size="sm" />
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

const TABS = ['BRACKET', 'ROSTERS', 'LIVE MATCH', 'STANDINGS'];

export default function StateVsState() {
  const [tab, setTab] = useState('BRACKET');
  const [matches, setMatches] = useState(BRACKET_MATCHES);

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '16px 16px 96px', fontFamily: 'Barlow Condensed, sans-serif' }}>
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
    </div>
  );
}
