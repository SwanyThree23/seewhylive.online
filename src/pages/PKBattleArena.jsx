import { useState, useEffect, useRef } from "react";
import SwanyBotWidget from '../components/guide/ARIAWidget';
import NotificationBell from '../components/shared/NotificationBell';
import { GiftTray as GiftSystem } from '../components/live/GiftSystem';
import { GiftLeaderboard } from '../components/live/GiftSystem';
import ViewerCount from '../components/live/ViewerCount';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import HostAlertCenter from '../components/live/HostAlertCenter';
import StreamHealthMonitor from '../components/streaming/StreamHealthMonitor';
import BattleArenaManager from '../components/live/BattleArenaManager';

const BG    = '#080B18';
const BG2   = 'rgba(13,6,24,0.95)';
const GOLD  = '#D4AF37';
const GOLDD = '#8A6F2E';
const SLATE = '#1A1530';
const TEXT  = '#F0EAF8';
const TEXTD = '#B8AECF';
const TEXTM = '#7A6E8A';
const CRIMSON = '#800020';
const RED   = '#C0392B';
const GREEN = '#6DBF7E';
const CYAN  = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO = { fontFamily: 'Space Mono, monospace' };

const OCT = 'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)';

const OPPONENTS = [
  { id: 'swanythree',   name: 'SwanyThree',    state: 'WA', wins: 47, losses: 8,  avatar: '🦁' },
  { id: 'bigbone',      name: 'BigBoneEarl',   state: 'WA', wins: 38, losses: 14, avatar: '🏆' },
  { id: 'fasthandsr',   name: 'FastHandsR',    state: 'TX', wins: 52, losses: 11, avatar: '⚡' },
  { id: 'domqueen',     name: 'DomQueen',      state: 'GA', wins: 29, losses: 9,  avatar: '👑' },
  { id: 'stonewall',    name: 'StoneWall',     state: 'CA', wins: 33, losses: 19, avatar: '🪨' },
];

const GLOBAL_CSS = `
@keyframes pulse-vote{0%,100%{opacity:1;}50%{opacity:.6;}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes countdown{from{opacity:1;}to{opacity:.2;}}
@keyframes bar-fill{from{width:0;}to{width:var(--w);}}
.card-in{animation:fadeUp .3s ease forwards;}
`;

function OctAvatar({ emoji, size = 72, color, glow }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0, position: 'relative' }}>
      <div style={{
        width: '100%', height: '100%',
        clipPath: OCT,
        background: color || `linear-gradient(135deg, ${CRIMSON}, #a0002a)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.42,
        boxShadow: glow ? `0 0 20px ${GOLD}66` : undefined,
      }}>
        {emoji}
      </div>
    </div>
  );
}

function VoteBar({ leftPct }) {
  const rightPct = 100 - leftPct;
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', height: 24, borderRadius: 12, overflow: 'hidden', border: `1px solid rgba(255,255,255,0.1)` }}>
        <div style={{ width: `${leftPct}%`, background: `linear-gradient(90deg, ${CRIMSON}, #a0002a)`, transition: 'width 0.4s ease', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 10 }}>
          {leftPct > 12 && <span style={{ ...MONO, fontSize: 10, color: '#fff', fontWeight: 700 }}>{leftPct}%</span>}
        </div>
        <div style={{ flex: 1, background: 'linear-gradient(90deg, #1a1530, #2a2040)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10 }}>
          {rightPct > 12 && <span style={{ ...MONO, fontSize: 10, color: '#fff', fontWeight: 700 }}>{rightPct}%</span>}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ ...MONO, fontSize: 9, color: TEXTM }}>HOST</span>
        <span style={{ ...MONO, fontSize: 9, color: TEXTM }}>OPPONENT</span>
      </div>
    </div>
  );
}

export default function PKBattleArena() {
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [battleActive, setBattleActive]         = useState(false);
  const [battleSecs, setBattleSecs]             = useState(0);
  const [hostVotes, setHostVotes]               = useState(50);
  const [oppVotes, setOppVotes]                 = useState(50);
  const [battleHistory, setBattleHistory]       = useState([]);
  const [totalVotes, setTotalVotes]             = useState(0);
  const [phase, setPhase]                       = useState('select'); // select | countdown | live | result
  const [countdown, setCountdown]               = useState(3);
  const timerRef = useRef(null);
  const voteRef  = useRef(null);
  const cdRef    = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  function startBattle() {
    if (!selectedOpponent) return;
    if (navigator.vibrate) navigator.vibrate(10);
    setPhase('countdown');
    setCountdown(3);
    setHostVotes(50);
    setOppVotes(50);
    setTotalVotes(0);
    setBattleSecs(0);
    let cd = 3;
    cdRef.current = setInterval(() => {
      cd--;
      setCountdown(cd);
      if (cd <= 0) {
        clearInterval(cdRef.current);
        setPhase('live');
        setBattleActive(true);
        startTimerAndVotes();
      }
    }, 1000);
  }

  function startTimerAndVotes() {
    timerRef.current = setInterval(() => setBattleSecs(s => s + 1), 1000);
    // Simulate incoming votes
    voteRef.current = setInterval(() => {
      const inc = Math.floor(Math.random() * 50) + 10;
      const forHost = Math.random() > 0.48;
      setTotalVotes(t => t + inc);
      if (forHost) {
        setHostVotes(h => Math.min(95, h + Math.random() * 3));
        setOppVotes(o => Math.max(5, o - Math.random() * 3));
      } else {
        setOppVotes(o => Math.min(95, o + Math.random() * 3));
        setHostVotes(h => Math.max(5, h - Math.random() * 3));
      }
    }, 800);
  }

  function endBattle() {
    if (navigator.vibrate) navigator.vibrate(10);
    clearInterval(timerRef.current);
    clearInterval(voteRef.current);
    setPhase('result');
    setBattleActive(false);
    const hostWins = hostVotes >= oppVotes;
    setBattleHistory(prev => [{
      id: Date.now(),
      opponent: selectedOpponent.name,
      opponentState: selectedOpponent.state,
      hostPct: Math.round(hostVotes),
      oppPct: Math.round(oppVotes),
      totalVotes,
      duration: formatTime(battleSecs),
      winner: hostWins ? 'HOST' : selectedOpponent.name,
      date: new Date().toLocaleDateString(),
    }, ...prev]);
  }

  function resetBattle() {
    if (navigator.vibrate) navigator.vibrate(10);
    clearInterval(timerRef.current);
    clearInterval(voteRef.current);
    clearInterval(cdRef.current);
    setBattleActive(false);
    setPhase('select');
    setSelectedOpponent(null);
    setBattleSecs(0);
    setHostVotes(50);
    setOppVotes(50);
    setTotalVotes(0);
  }

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(voteRef.current);
      clearInterval(cdRef.current);
    };
  }, []);

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  const hostPct = Math.round(hostVotes);
  const oppPct  = 100 - hostPct;

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', background: BG2, borderBottom: `1px solid ${SLATE}`, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${CRIMSON}, #a0002a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⚔️</div>
        <div>
          <div style={{ ...T, fontSize: 22, fontWeight: 900, color: TEXT, letterSpacing: '0.08em', lineHeight: 1 }}>PK BATTLE ARENA</div>
          <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginTop: 2 }}>LIVE 1V1 · VIEWER VOTES · SEEWHY LIVE</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* COUNTDOWN phase */}
        {phase === 'countdown' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 20 }}>
            <div style={{ ...T, fontSize: 14, fontWeight: 700, color: TEXTM, letterSpacing: '0.1em' }}>BATTLE STARTING IN</div>
            <div style={{ ...T, fontSize: 120, fontWeight: 900, color: GOLD, lineHeight: 1, animation: 'countdown 0.9s ease' }}>{countdown}</div>
            <div style={{ ...T, fontSize: 18, fontWeight: 700, color: TEXT }}>YOU vs {selectedOpponent?.name} ({selectedOpponent?.state})</div>
          </div>
        )}

        {/* LIVE / RESULT phase */}
        {(phase === 'live' || phase === 'result') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Live header */}
            <div style={{ background: BG2, border: `1px solid ${phase === 'live' ? 'rgba(239,68,68,0.4)' : 'rgba(212,175,55,0.3)'}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {phase === 'live' && <span style={{ width: 10, height: 10, borderRadius: '50%', background: RED, animation: 'pulse-vote 1s ease infinite', display: 'inline-block' }} />}
                  <span style={{ ...T, fontSize: 20, fontWeight: 900, color: phase === 'live' ? RED : GOLD, letterSpacing: '0.1em' }}>
                    {phase === 'live' ? 'PK BATTLE LIVE' : 'BATTLE COMPLETE'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ ...MONO, fontSize: 12, color: TEXTD }}>{formatTime(battleSecs)}</span>
                  <span style={{ ...MONO, fontSize: 10, color: TEXTM }}>{totalVotes.toLocaleString()} votes</span>
                </div>
              </div>

              {/* Competitors */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <OctAvatar emoji="🎙️" size={72} color={`linear-gradient(135deg, ${CRIMSON}, #a0002a)`} glow={hostPct > oppPct} />
                  <div style={{ ...T, fontSize: 14, fontWeight: 800, color: TEXT }}>YOU (HOST)</div>
                  <div style={{ ...MONO, fontSize: 18, fontWeight: 700, color: hostPct >= oppPct ? GOLD : TEXTM }}>{hostPct}%</div>
                </div>
                <div style={{ ...T, fontSize: 28, fontWeight: 900, color: CRIMSON }}>VS</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <OctAvatar emoji={selectedOpponent?.avatar} size={72} glow={oppPct > hostPct} />
                  <div style={{ ...T, fontSize: 14, fontWeight: 800, color: TEXT }}>{selectedOpponent?.name}</div>
                  <div style={{ ...MONO, fontSize: 18, fontWeight: 700, color: oppPct > hostPct ? GOLD : TEXTM }}>{oppPct}%</div>
                </div>
              </div>

              <VoteBar leftPct={hostPct} />

              {phase === 'result' && (
                <div className="card-in" style={{ marginTop: 16, textAlign: 'center' }}>
                  <div style={{ ...T, fontSize: 22, fontWeight: 900, color: GOLD, letterSpacing: '0.06em' }}>
                    {hostPct >= oppPct ? '🏆 YOU WIN!' : `${selectedOpponent?.name} WINS`}
                  </div>
                  <div style={{ ...MONO, fontSize: 11, color: TEXTM, marginTop: 4 }}>
                    Final: {hostPct}% / {oppPct}% · {totalVotes.toLocaleString()} total votes
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 10 }}>
              {phase === 'live' && (
                <button onClick={endBattle} style={{ flex: 1, ...T, fontSize: 16, fontWeight: 800, letterSpacing: '0.06em', background: 'rgba(239,68,68,0.15)', border: `1px solid ${RED}`, borderRadius: 10, padding: '12px 0', color: RED, cursor: 'pointer' }}>
                  END BATTLE
                </button>
              )}
              {phase === 'result' && (
                <button onClick={resetBattle} style={{ flex: 1, ...T, fontSize: 16, fontWeight: 800, letterSpacing: '0.06em', background: 'rgba(212,175,55,0.15)', border: `1px solid ${GOLD}`, borderRadius: 10, padding: '12px 0', color: GOLD, cursor: 'pointer' }}>
                  NEW BATTLE
                </button>
              )}
            </div>
          </div>
        )}

        {/* OPPONENT SELECTION */}
        {phase === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...T, fontSize: 13, fontWeight: 700, color: TEXTM, letterSpacing: '0.1em' }}>SELECT OPPONENT</div>
            {OPPONENTS.map(opp => (
              <div key={opp.id} className="card-in" onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setSelectedOpponent(opp); }} style={{
                background: BG2,
                border: `1px solid ${selectedOpponent?.id === opp.id ? GOLD : 'rgba(212,175,55,0.1)'}`,
                borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color 0.15s',
              }}>
                <OctAvatar emoji={opp.avatar} size={52} color={selectedOpponent?.id === opp.id ? `linear-gradient(135deg, ${GOLD}, ${GOLDD})` : `linear-gradient(135deg, ${CRIMSON}, #a0002a)`} />
                <div style={{ flex: 1 }}>
                  <div style={{ ...T, fontSize: 18, fontWeight: 800, color: TEXT, letterSpacing: '0.04em' }}>{opp.name}</div>
                  <div style={{ ...MONO, fontSize: 10, color: TEXTM }}>{opp.state} · {opp.wins}W / {opp.losses}L</div>
                </div>
                {selectedOpponent?.id === opp.id && (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 14, fontWeight: 900 }}>✓</div>
                )}
              </div>
            ))}
            <button
              onClick={startBattle}
              disabled={!selectedOpponent}
              style={{
                ...T, fontSize: 18, fontWeight: 900, letterSpacing: '0.08em',
                background: !selectedOpponent ? 'rgba(128,0,32,0.1)' : `linear-gradient(135deg, ${CRIMSON}, #a0002a)`,
                border: `2px solid ${!selectedOpponent ? 'rgba(128,0,32,0.2)' : CRIMSON}`,
                borderRadius: 12, padding: '14px 0',
                color: !selectedOpponent ? TEXTM : '#fff',
                cursor: !selectedOpponent ? 'not-allowed' : 'pointer',
                marginTop: 6, transition: 'all 0.15s',
              }}
            >
              ⚔️ START PK BATTLE
            </button>
          </div>
        )}

        {/* Battle History */}
        {battleHistory.length > 0 && phase !== 'live' && phase !== 'countdown' && (
          <div style={{ background: BG2, border: '1px solid rgba(212,175,55,0.12)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ ...T, fontSize: 13, fontWeight: 700, color: TEXTM, letterSpacing: '0.1em', marginBottom: 12 }}>BATTLE HISTORY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {battleHistory.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...T, fontSize: 15, fontWeight: 700, color: TEXT }}>vs {b.opponent} ({b.opponentState})</div>
                    <div style={{ ...MONO, fontSize: 9, color: TEXTM }}>{b.hostPct}% / {b.oppPct}% · {b.totalVotes.toLocaleString()} votes · {b.duration} · {b.date}</div>
                  </div>
                  <div style={{
                    ...MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    color: b.winner === 'HOST' ? GREEN : RED,
                    background: b.winner === 'HOST' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${b.winner === 'HOST' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: 999, padding: '3px 10px',
                  }}>
                    {b.winner === 'HOST' ? 'WIN' : 'LOSS'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <SwanyBotWidget />
      <NotificationBell />
      <GiftSystem roomId={null} userId={null} isHost={true} />
      <GiftLeaderboard roomId={null} />
      <ViewerCount count={0} peakViewers={0} />
      <SwanAIRecommendations roomId={null} currentLayout='pkbattle' viewerCount={0} />
      <HostAlertCenter />
      <StreamHealthMonitor isStreaming={false} />
      <BattleArenaManager roomId={null} isHost={true} onBattleEnd={() => {}} />
    </div>
  );
}
