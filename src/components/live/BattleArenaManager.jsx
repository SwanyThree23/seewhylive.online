import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { toast } from 'sonner';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const G       = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const BG      = '#080B18';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const C = {
  card:   'rgba(8,11,24,0.98)',
  border: 'rgba(212,175,55,0.15)',
  divider:'rgba(255,255,255,0.07)',
  text:   '#e8e8e8',
  muted:  '#888',
};

const DURATION_OPTIONS = [
  { label: '1m',  value: 60  },
  { label: '3m',  value: 180 },
  { label: '5m',  value: 300 },
  { label: '10m', value: 600 },
];

const ROUND_OPTIONS = [1, 3, 5];
const TEAM_COLORS   = [CRIMSON, '#3b82f6', '#a78bfa'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(s) {
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function relTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000)  return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ ...T, color: G, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        {children}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: `1px solid ${C.divider}`, margin: '14px 0' }} />;
}

// ── Participant chip ──────────────────────────────────────────────────────────
function ParticipantChip({ participant, onClick, team }) {
  const name    = participant.name || participant.user_name || participant.id;
  const initial = (name[0] || '?').toUpperCase();
  const color   = team === 'A' ? CRIMSON : team === 'B' ? '#3b82f6' : '#555';

  return (
    <button
      onClick={() => onClick(participant)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: `${color}22`, border: `1px solid ${color}60`,
        borderRadius: 20, padding: '4px 10px 4px 6px',
        cursor: 'pointer', ...T, fontSize: 12, color: C.text,
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
      }}>
        {initial}
      </div>
      {name}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BattleArenaManager({ roomId, isHost, participants = [], currentUser: _currentUser }) {
  // ── State ────────────────────────────────────────────────────────────────────
  const [phase, setPhase]           = useState('setup'); // setup | countdown | live | ended
  const [teamA, setTeamA]           = useState([]);
  const [teamB, setTeamB]           = useState([]);
  const [teamAName, setTeamAName]   = useState('Team A');
  const [teamBName, setTeamBName]   = useState('Team B');
  const [teamAColor, setTeamAColor] = useState(CRIMSON);
  const [teamBColor, setTeamBColor] = useState('#3b82f6');
  const [votesA, setVotesA]         = useState(50);
  const [votesB, setVotesB]         = useState(50);
  const [countdown, setCountdown]   = useState(3);
  const [elapsed, setElapsed]       = useState(0);
  const [DURATION, setDURATION]     = useState(180);
  const [round, setRound]           = useState(1);
  const [maxRounds, setMaxRounds]   = useState(3);
  const [roundWinsA, setRoundWinsA] = useState(0);
  const [roundWinsB, setRoundWinsB] = useState(0);
  const [prizePool, setPrizePool]   = useState('');
  const [votingMode, setVotingMode] = useState('chat'); // chat | poll
  const [history, setHistory]       = useState([]);
  const [openAssignMenu, setOpenAssignMenu] = useState(null); // participant id

  const timerRef    = useRef(null);
  const voteRef     = useRef(null);
  const countdownRef = useRef(null);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const assignedIds   = [...teamA, ...teamB].map(p => p.id);
  const unassigned    = participants.filter(p => !assignedIds.includes(p.id));
  const timeLeft      = Math.max(0, DURATION - elapsed);
  const totalVotes    = votesA + votesB;
  const pctA          = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
  const pctB          = 100 - pctA;

  // ── Entity mutation ──────────────────────────────────────────────────────────
  const battleMutation = useMutation({
    mutationFn: (payload) =>
      base44.entities.BattleArena
        ? base44.entities.BattleArena.create(payload)
        : Promise.resolve(payload),
    onError: () => {},
  });

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearInterval(voteRef.current);
    clearInterval(countdownRef.current);
  }, []);

  // ── Vote drift during live ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'live') {
      voteRef.current = setInterval(() => {
        const drift = Math.floor(Math.random() * 5) - 2;
        setVotesA(a => Math.max(1, Math.min(a + drift, 999)));
        setVotesB(b => Math.max(1, Math.min(b + drift, 999)));
      }, 800);
    } else {
      clearInterval(voteRef.current);
    }
    return () => clearInterval(voteRef.current);
  }, [phase]);

  // ── Battle timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'live') {
      timerRef.current = setInterval(() => {
        setElapsed(e => {
          if (e + 1 >= DURATION) {
            clearInterval(timerRef.current);
            endRound();
            return DURATION;
          }
          return e + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, DURATION, endRound]);

  // ── Countdown ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'countdown') {
      setCountdown(3);
      let c = 3;
      countdownRef.current = setInterval(() => {
        c -= 1;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(countdownRef.current);
          setPhase('live');
          setElapsed(0);
          battleMutation.mutate({ roomId, action: 'battleStart', round });
        }
      }, 1000);
    }
    return () => clearInterval(countdownRef.current);
  }, [phase, round, roomId, battleMutation]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const startBattle = useCallback(() => {
    if (teamA.length < 1 || teamB.length < 1) { toast.error('Each team needs at least 1 member'); return; }
    setVotesA(50);
    setVotesB(50);
    setPhase('countdown');
  }, [teamA, teamB]);

  const endRound = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(voteRef.current);

    const total = votesA + votesB;
    const finalPctA = total > 0 ? Math.round((votesA / total) * 100) : 50;
    const finalPctB = 100 - finalPctA;
    const winner    = finalPctA >= finalPctB ? teamAName : teamBName;

    const newWinsA = finalPctA >= finalPctB ? roundWinsA + 1 : roundWinsA;
    const newWinsB = finalPctA < finalPctB  ? roundWinsB + 1 : roundWinsB;
    setRoundWinsA(newWinsA);
    setRoundWinsB(newWinsB);

    const entry = {
      roundNum: round,
      winner,
      scoreA: finalPctA,
      scoreB: finalPctB,
      teamAName,
      teamBName,
      ts: Date.now(),
    };
    setHistory(h => [...h, entry]);

    battleMutation.mutate({ roomId, action: 'roundEnd', winner, round });
    setPhase('ended');
  }, [votesA, votesB, teamAName, teamBName, roundWinsA, roundWinsB, round, roomId, battleMutation]);

  const endBattle = useCallback(() => {
    endRound();
  }, [endRound]);

  const nextRound = useCallback(() => {
    setRound(r => r + 1);
    setVotesA(50);
    setVotesB(50);
    setElapsed(0);
    setPhase('countdown');
  }, []);

  const resetAll = useCallback(() => {
    setPhase('setup');
    setTeamA([]);
    setTeamB([]);
    setTeamAName('Team A');
    setTeamBName('Team B');
    setTeamAColor(CRIMSON);
    setTeamBColor('#3b82f6');
    setVotesA(50);
    setVotesB(50);
    setElapsed(0);
    setRound(1);
    setRoundWinsA(0);
    setRoundWinsB(0);
    setPrizePool('');
    setHistory([]);
  }, []);

  const autoBalance = useCallback(() => {
    const all = [...unassigned];
    const half = Math.ceil(all.length / 2);
    setTeamA(a => [...a, ...all.slice(0, half)]);
    setTeamB(b => [...b, ...all.slice(half)]);
  }, [unassigned]);

  const assignToTeam = useCallback((participant, team) => {
    if (team === 'A') {
      setTeamA(a => [...a, participant]);
    } else {
      setTeamB(b => [...b, participant]);
    }
    setOpenAssignMenu(null);
  }, []);

  const removeFromTeam = useCallback((participant, team) => {
    if (team === 'A') setTeamA(a => a.filter(p => p.id !== participant.id));
    else              setTeamB(b => b.filter(p => p.id !== participant.id));
  }, []);

  const shareResult = useCallback(() => {
    const total     = votesA + votesB;
    const finalPctA = total > 0 ? Math.round((votesA / total) * 100) : 50;
    const finalPctB = 100 - finalPctA;
    const winner    = finalPctA >= finalPctB ? teamAName : teamBName;
    const text      = `🏆 ${teamAName} vs ${teamBName} — ${winner} wins ${finalPctA}%-${finalPctB}%! #SeeWhyLIVE`;
    navigator.clipboard.writeText(text).then(() => toast.success('Result copied to clipboard!'));
  }, [votesA, votesB, teamAName, teamBName]);

  // ── Derived series winner ─────────────────────────────────────────────────────
  const needed        = Math.ceil(maxRounds / 2);
  const seriesWinner  = roundWinsA >= needed ? teamAName : roundWinsB >= needed ? teamBName : null;
  const seriesDone    = seriesWinner !== null;

  // ── Last round result (for ended phase) ──────────────────────────────────────
  const lastRound = history[history.length - 1];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        ...T,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        color: C.text,
        width: '100%',
      }}
    >

      {/* ══════════════ SETUP PHASE ══════════════ */}
      {phase === 'setup' && (
        <>
          <SectionHeader>Battle Arena Setup</SectionHeader>

          {/* Three-column team builder */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {/* Unassigned */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Unassigned ({unassigned.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, minHeight: 40 }}>
                {unassigned.length === 0 && (
                  <span style={{ fontSize: 11, color: C.muted }}>None</span>
                )}
                {unassigned.map(p => (
                  <div key={p.id} style={{ position: 'relative' }}>
                    <ParticipantChip
                      participant={p}
                      team={null}
                      onClick={() => setOpenAssignMenu(openAssignMenu === p.id ? null : p.id)}
                    />
                    {openAssignMenu === p.id && (
                      <div style={{
                        position: 'absolute', top: '110%', left: 0, zIndex: 20,
                        background: '#1a1d2e', border: `1px solid ${C.border}`,
                        borderRadius: 8, overflow: 'hidden', minWidth: 130, boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                      }}>
                        <button
                          onClick={() => assignToTeam(p, 'A')}
                          style={{ display: 'block', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: C.text, fontSize: 12, cursor: 'pointer', textAlign: 'left', ...T }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${CRIMSON}33`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                        >
                          Add to {teamAName}
                        </button>
                        <button
                          onClick={() => assignToTeam(p, 'B')}
                          style={{ display: 'block', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: C.text, fontSize: 12, cursor: 'pointer', textAlign: 'left', ...T }}
                          onMouseEnter={e => { e.currentTarget.style.background = `#3b82f633`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                        >
                          Add to {teamBName}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Team A */}
            <div style={{ flex: 1, background: `${teamAColor}0d`, border: `1px solid ${teamAColor}30`, borderRadius: 8, padding: 8 }}>
              <div style={{ fontSize: 11, color: teamAColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                ⚔ {teamAName}
              </div>
              <input
                value={teamAName}
                onChange={e => setTeamAName(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${teamAColor}40`, borderRadius: 5, padding: '4px 7px', color: C.text, fontSize: 12, ...T, outline: 'none', marginBottom: 6, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                {TEAM_COLORS.map(col => (
                  <div
                    key={col}
                    onClick={() => setTeamAColor(col)}
                    style={{
                      width: 16, height: 16, borderRadius: '50%', background: col, cursor: 'pointer',
                      border: teamAColor === col ? '2px solid #fff' : '2px solid transparent',
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 30 }}>
                {teamA.length === 0 && <span style={{ fontSize: 11, color: C.muted }}>Empty</span>}
                {teamA.map(p => (
                  <ParticipantChip key={p.id} participant={p} team="A" onClick={() => removeFromTeam(p, 'A')} />
                ))}
              </div>
            </div>

            {/* Team B */}
            <div style={{ flex: 1, background: `${teamBColor}0d`, border: `1px solid ${teamBColor}30`, borderRadius: 8, padding: 8 }}>
              <div style={{ fontSize: 11, color: teamBColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                ⚔ {teamBName}
              </div>
              <input
                value={teamBName}
                onChange={e => setTeamBName(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${teamBColor}40`, borderRadius: 5, padding: '4px 7px', color: C.text, fontSize: 12, ...T, outline: 'none', marginBottom: 6, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                {TEAM_COLORS.map(col => (
                  <div
                    key={col}
                    onClick={() => setTeamBColor(col)}
                    style={{
                      width: 16, height: 16, borderRadius: '50%', background: col, cursor: 'pointer',
                      border: teamBColor === col ? '2px solid #fff' : '2px solid transparent',
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 30 }}>
                {teamB.length === 0 && <span style={{ fontSize: 11, color: C.muted }}>Empty</span>}
                {teamB.map(p => (
                  <ParticipantChip key={p.id} participant={p} team="B" onClick={() => removeFromTeam(p, 'B')} />
                ))}
              </div>
            </div>
          </div>

          {/* Auto-balance */}
          <button
            onClick={autoBalance}
            disabled={unassigned.length === 0}
            style={{
              background: 'none', border: `1px solid ${G}50`, borderRadius: 7,
              padding: '6px 14px', color: G, fontSize: 12, cursor: unassigned.length === 0 ? 'not-allowed' : 'pointer',
              ...T, marginBottom: 14, alignSelf: 'flex-start',
              opacity: unassigned.length === 0 ? 0.4 : 1,
            }}
          >
            ⚖ Auto-Balance
          </button>

          <Divider />

          {/* Battle Config */}
          <SectionHeader>Battle Config</SectionHeader>

          {/* Duration chips */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Duration</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {DURATION_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setDURATION(o.value)}
                  style={{
                    background: DURATION === o.value ? G : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${DURATION === o.value ? G : C.border}`,
                    borderRadius: 6, padding: '4px 12px',
                    color: DURATION === o.value ? BG : C.text,
                    fontSize: 12, cursor: 'pointer', fontWeight: DURATION === o.value ? 700 : 400, ...T,
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Best-of chips */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Best of</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {ROUND_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setMaxRounds(r)}
                  style={{
                    background: maxRounds === r ? CRIMSON : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${maxRounds === r ? CRIMSON : C.border}`,
                    borderRadius: 6, padding: '4px 14px',
                    color: C.text, fontSize: 12, cursor: 'pointer', fontWeight: maxRounds === r ? 700 : 400, ...T,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Prize pool */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Prize Pool ($)</div>
            <input
              value={prizePool}
              onChange={e => setPrizePool(e.target.value)}
              placeholder="e.g. 100"
              style={{
                background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`,
                borderRadius: 7, padding: '5px 10px', color: C.text, fontSize: 12, ...T,
                outline: 'none', width: 120,
              }}
            />
          </div>

          {/* Voting mode toggle */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Voting Mode</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ v: 'chat', label: 'Chat (!A/!B)' }, { v: 'poll', label: 'Poll' }].map(opt => (
                <button
                  key={opt.v}
                  onClick={() => setVotingMode(opt.v)}
                  style={{
                    background: votingMode === opt.v ? PINK : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${votingMode === opt.v ? PINK : C.border}`,
                    borderRadius: 6, padding: '4px 12px',
                    color: C.text, fontSize: 12, cursor: 'pointer', fontWeight: votingMode === opt.v ? 700 : 400, ...T,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start battle button */}
          {teamA.length > 0 && teamB.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={startBattle}
              style={{
                background: `linear-gradient(135deg, ${CRIMSON}, ${G})`,
                border: 'none', borderRadius: 10,
                padding: '12px 0', color: '#fff',
                fontSize: 16, fontWeight: 700, cursor: 'pointer', ...T,
                letterSpacing: 1, width: '100%',
              }}
            >
              ⚡ Start Battle
            </motion.button>
          )}
        </>
      )}

      {/* ══════════════ COUNTDOWN PHASE ══════════════ */}
      {phase === 'countdown' && (
        <div style={{
          position: 'relative', minHeight: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', borderRadius: 10,
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={countdown}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                fontSize: countdown === 0 ? 60 : 100,
                fontWeight: 900,
                color: countdown === 0 ? G : '#fff',
                ...T,
                letterSpacing: 4,
                textShadow: `0 0 40px ${countdown === 0 ? G : CRIMSON}`,
              }}
            >
              {countdown === 0 ? 'GO!' : countdown}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ══════════════ LIVE PHASE ══════════════ */}
      {phase === 'live' && (
        <>
          {/* Battle header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: teamAColor, ...T }}>{teamAName}</div>
              <div style={{ fontSize: 12, color: C.muted }}>
                {'🏆 '.repeat(roundWinsA)}{roundWinsA > 0 ? '' : '–'}
              </div>
            </div>
            <div style={{ fontSize: 14, color: C.muted, fontWeight: 700 }}>VS</div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: teamBColor, ...T }}>{teamBName}</div>
              <div style={{ fontSize: 12, color: C.muted }}>
                {'🏆 '.repeat(roundWinsB)}{roundWinsB > 0 ? '' : '–'}
              </div>
            </div>
          </div>

          {/* Round wins summary */}
          <div style={{ textAlign: 'center', fontSize: 13, color: G, marginBottom: 10 }}>
            Round {round} of {maxRounds} — Series: {roundWinsA}–{roundWinsB}
          </div>

          {/* Vote bar */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: teamAColor, fontWeight: 700 }}>{pctA}%</span>
              <span style={{ color: C.muted, fontSize: 11 }}>Live Votes</span>
              <span style={{ color: teamBColor, fontWeight: 700 }}>{pctB}%</span>
            </div>
            <div style={{ height: 18, background: 'rgba(255,255,255,0.06)', borderRadius: 9, overflow: 'hidden', display: 'flex' }}>
              <motion.div
                animate={{ width: `${pctA}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ height: '100%', background: `linear-gradient(90deg, ${teamAColor}, ${teamAColor}aa)`, borderRadius: '9px 0 0 9px' }}
              />
              <motion.div
                animate={{ width: `${pctB}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ height: '100%', background: `linear-gradient(90deg, ${teamBColor}aa, ${teamBColor})`, borderRadius: '0 9px 9px 0' }}
              />
            </div>
          </div>

          {/* Timer */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{
              fontSize: 36, fontWeight: 900, ...T,
              color: timeLeft < 30 ? '#ef4444' : G,
              letterSpacing: 2,
              textShadow: timeLeft < 30 ? '0 0 20px #ef4444' : 'none',
            }}>
              {fmt(timeLeft)}
            </span>
          </div>

          {/* Prize pool */}
          {prizePool && (
            <div style={{
              textAlign: 'center', marginBottom: 10,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: `${G}15`, border: `1px solid ${G}40`, borderRadius: 20,
              padding: '4px 14px', alignSelf: 'center',
            }}>
              <Trophy size={13} color={G} />
              <span style={{ fontSize: 13, color: G }}>Prize Pool: ${prizePool}</span>
            </div>
          )}

          {/* Voting hint */}
          {votingMode === 'chat' && (
            <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginBottom: 10 }}>
              Type <b style={{ color: teamAColor }}>!A</b> or <b style={{ color: teamBColor }}>!B</b> to vote
            </div>
          )}

          {/* Host controls */}
          {isHost && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={endRound}
                style={{
                  flex: 1, background: `${CRIMSON}cc`, border: 'none', borderRadius: 8,
                  padding: '8px 0', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 700, ...T,
                }}
              >
                End Round
              </button>
              <button
                onClick={endBattle}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.08)', border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: '8px 0', color: C.text, fontSize: 13, cursor: 'pointer', ...T,
                }}
              >
                End Battle
              </button>
            </div>
          )}
        </>
      )}

      {/* ══════════════ ENDED PHASE ══════════════ */}
      {phase === 'ended' && lastRound && (
        <>
          {/* Winner banner */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ textAlign: 'center', marginBottom: 16 }}
          >
            <div style={{ fontSize: 36, marginBottom: 4 }}>🏆</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: G, ...T, letterSpacing: 2 }}>
              {lastRound.winner} WINS!
            </div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>
              {lastRound.scoreA}% — {lastRound.scoreB}%
            </div>
          </motion.div>

          {/* Series done vs. not */}
          {maxRounds > 1 && !seriesDone && (
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 8 }}>
                Series: {teamAName} <b style={{ color: G }}>{roundWinsA}</b> – <b style={{ color: G }}>{roundWinsB}</b> {teamBName}
              </div>
              <button
                onClick={nextRound}
                style={{
                  background: `linear-gradient(135deg, ${CRIMSON}, ${G})`,
                  border: 'none', borderRadius: 8, padding: '10px 28px',
                  color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 700, ...T,
                }}
              >
                Next Round →
              </button>
            </div>
          )}

          {seriesDone && (
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: PINK, ...T, marginBottom: 8 }}>
                🎉 Series Winner: {seriesWinner}!
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                {history.map(h => (
                  <div key={h.roundNum} style={{ fontSize: 12, color: C.muted }}>
                    Round {h.roundNum}: <span style={{ color: G }}>{h.winner}</span> ({h.scoreA}%–{h.scoreB}%)
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <button
              onClick={shareResult}
              style={{
                flex: 1, background: `${G}22`, border: `1px solid ${G}60`,
                borderRadius: 8, padding: '8px 0', color: G, fontSize: 13, cursor: 'pointer', fontWeight: 700, ...T,
              }}
            >
              📤 Share Result
            </button>
            <button
              onClick={resetAll}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '8px 0', color: C.text, fontSize: 13, cursor: 'pointer', ...T,
              }}
            >
              New Battle
            </button>
          </div>
        </>
      )}

      {/* ══════════════ BATTLE HISTORY ══════════════ */}
      {history.length > 0 && (
        <>
          <Divider />
          <SectionHeader>Battle History</SectionHeader>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {history.slice(-3).map(h => (
              <div
                key={h.roundNum}
                style={{
                  background: `${G}10`, border: `1px solid ${G}30`,
                  borderRadius: 8, padding: '5px 10px', fontSize: 11, color: C.text,
                }}
              >
                🏆 <span style={{ color: G }}>{h.winner}</span> {h.scoreA}% | Round {h.roundNum} | {relTime(h.ts)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
