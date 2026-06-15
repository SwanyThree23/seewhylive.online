/**
 * WashingtonClassic — The flagship SeeWhy LIVE domino tournament hub
 * Venue: Jamar's Sports Bar & Grill, Des Moines, WA
 * Format: 7 Rock / 5-150 / Double Elimination
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Users, Swords, Calendar, MapPin, Star, ChevronRight, Plus, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import BattleScoreboard from '../components/live/BattleScoreboard';
import BattleMode from '../components/streaming/BattleMode';
import StreamAnalyticsDashboard from '../components/streaming/StreamAnalyticsDashboard';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';
import TournamentBracket from '../components/pk/TournamentBracket';
import EngagementBadgesDisplay from '../components/live/EngagementBadgesDisplay';
import LeaderboardPanel from '../components/live/LeaderboardPanel';
import ShareToSocial from '../components/social/ShareToSocial';

const C = {
  bg:    '#07050A',
  bg2:   '#0D0A08',
  bg3:   '#13100A',
  gold:  '#C9A84C',
  goldD: '#8A6F2E',
  ruby:  '#8B1A2F',
  rubyL: '#B22340',
  slate: '#2A2418',
  text:  '#F0E8D4',
  textD: '#C4B596',
  textM: '#8A7A62',
  green: '#6DBF7E',
  amber: '#D4854A',
  blue:  '#D4854A',
  red:   '#C62828',
};

// ── Static seed data (real tournament history) ──────────────────────────────
const PAST_CHAMPIONS = [
  { year: 2023, name: 'Marcus "Domino King" Williams', state: 'WA', record: '7-0', prize: '$2,500' },
  { year: 2022, name: 'Jerome "Big Spin" Carter',      state: 'CA', record: '6-1', prize: '$2,000' },
  { year: 2021, name: 'Darius "Double Six" Johnson',   state: 'TX', record: '7-0', prize: '$1,500' },
  { year: 2019, name: 'Antoine "Rock Solid" Freeman',  state: 'GA', record: '5-2', prize: '$1,200' },
];

const TEAMS_2026 = [
  { id: 't1', name: 'Pacific NW Kings',   state: 'WA', seed: 1,  wins: 5, losses: 0, ppg: 142 },
  { id: 't2', name: 'So-Cal Dominators',  state: 'CA', seed: 2,  wins: 4, losses: 1, ppg: 138 },
  { id: 't3', name: 'ATL Hardliners',     state: 'GA', seed: 3,  wins: 4, losses: 1, ppg: 135 },
  { id: 't4', name: 'Texas Lone Stars',   state: 'TX', seed: 4,  wins: 3, losses: 2, ppg: 129 },
  { id: 't5', name: 'NYC Slammers',       state: 'NY', seed: 5,  wins: 3, losses: 2, ppg: 127 },
  { id: 't6', name: 'Chi-Town Bosses',    state: 'IL', seed: 6,  wins: 2, losses: 3, ppg: 121 },
  { id: 't7', name: 'DMV Ruthless',       state: 'MD', seed: 7,  wins: 2, losses: 3, ppg: 118 },
  { id: 't8', name: 'H-Town Originals',   state: 'TX', seed: 8,  wins: 1, losses: 4, ppg: 112 },
];

const BRACKET_2026 = [
  // QF Winners Bracket
  { id: 'm1', round: 'QF', bracket: 'W', team_a: 't1', team_b: 't8', score_a: 150, score_b: 112, winner: 't1', status: 'completed' },
  { id: 'm2', round: 'QF', bracket: 'W', team_a: 't4', team_b: 't5', score_a: 132, score_b: 145, winner: 't5', status: 'completed' },
  { id: 'm3', round: 'QF', bracket: 'W', team_a: 't2', team_b: 't7', score_a: 150, score_b: 98,  winner: 't2', status: 'completed' },
  { id: 'm4', round: 'QF', bracket: 'W', team_a: 't3', team_b: 't6', score_a: 150, score_b: 121, winner: 't3', status: 'completed' },
  // SF Winners Bracket
  { id: 'm5', round: 'SF', bracket: 'W', team_a: 't1', team_b: 't5', score_a: null, score_b: null, winner: null, status: 'scheduled', date: 'Jun 21, 2026' },
  { id: 'm6', round: 'SF', bracket: 'W', team_a: 't2', team_b: 't3', score_a: null, score_b: null, winner: null, status: 'scheduled', date: 'Jun 21, 2026' },
  // LF Losers Bracket
  { id: 'm7', round: 'SF', bracket: 'L', team_a: 't8', team_b: 't4', score_a: 138, score_b: 120, winner: 't8', status: 'completed' },
  { id: 'm8', round: 'SF', bracket: 'L', team_a: 't6', team_b: 't7', score_a: 115, score_b: 140, winner: 't7', status: 'completed' },
  // Finals scheduled
  { id: 'm9', round: 'F',  bracket: 'W', team_a: null, team_b: null, score_a: null, score_b: null, winner: null, status: 'upcoming', date: 'Jul 5, 2026' },
  { id: 'm10',round: 'GF', bracket: 'G', team_a: null, team_b: null, score_a: null, score_b: null, winner: null, status: 'upcoming', date: 'Jul 12, 2026' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function teamById(id) { return TEAMS_2026.find(t => t.id === id); }

function StatusBadge({ status }) {
  const cfg = {
    completed: { bg: 'rgba(46,204,113,0.12)', color: C.green, label: 'FINAL' },
    scheduled:  { bg: 'rgba(201,168,76,0.12)', color: C.gold,  label: 'SCHEDULED' },
    live:       { bg: 'rgba(139,26,47,0.2)',  color: '#E74C3C', label: 'LIVE' },
    upcoming:   { bg: 'rgba(42,36,24,0.6)',   color: C.textM,   label: 'UPCOMING' },
  };
  const s = cfg[status] || cfg.upcoming;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'Barlow Condensed, sans-serif' }}>
      {s.label}
    </span>
  );
}

function MatchCard({ match }) {
  const a = match.team_a ? teamById(match.team_a) : null;
  const b = match.team_b ? teamById(match.team_b) : null;
  const winA = match.winner === match.team_a;
  const winB = match.winner === match.team_b;

  return (
    <div style={{ background: C.bg3, border: `1px solid ${C.slate}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ color: C.amber, fontSize: 11, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>
          {match.bracket === 'G' ? 'GRAND FINAL' : match.bracket === 'W' ? `WINNERS · ${match.round}` : `LOSERS · ${match.round}`}
        </span>
        <StatusBadge status={match.status} />
      </div>

      {/* Team A */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, opacity: match.winner && !winA ? 0.45 : 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {winA && <Trophy style={{ width: 14, height: 14, color: C.gold }} />}
          <span style={{ color: winA ? C.gold : C.text, fontWeight: winA ? 700 : 400, fontSize: 14, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {a ? a.name : 'TBD'}
          </span>
          {a && <span style={{ color: C.textM, fontSize: 11 }}>({a.state})</span>}
        </div>
        <span style={{ color: winA ? C.gold : C.textD, fontWeight: 700, fontSize: 18, fontFamily: 'Barlow Condensed, sans-serif' }}>
          {match.score_a ?? '—'}
        </span>
      </div>

      <div style={{ height: 1, background: C.slate, margin: '4px 0' }} />

      {/* Team B */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, opacity: match.winner && !winB ? 0.45 : 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {winB && <Trophy style={{ width: 14, height: 14, color: C.gold }} />}
          <span style={{ color: winB ? C.gold : C.text, fontWeight: winB ? 700 : 400, fontSize: 14, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {b ? b.name : 'TBD'}
          </span>
          {b && <span style={{ color: C.textM, fontSize: 11 }}>({b.state})</span>}
        </div>
        <span style={{ color: winB ? C.gold : C.textD, fontWeight: 700, fontSize: 18, fontFamily: 'Barlow Condensed, sans-serif' }}>
          {match.score_b ?? '—'}
        </span>
      </div>

      {match.date && (
        <div style={{ marginTop: 8, color: C.textM, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar style={{ width: 11, height: 11 }} />{match.date}
        </div>
      )}
    </div>
  );
}

// ── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'bracket',  label: '🏆 Bracket' },
  { id: 'standings',label: '📊 Standings' },
  { id: 'history',  label: '👑 Champions' },
  { id: 'info',     label: 'ℹ Info' },
];

export default function WashingtonClassic() {
  const [tab, setTab] = useState('bracket');

  const sorted = [...TEAMS_2026].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.ppg - a.ppg;
  });

  const wbMatches  = BRACKET_2026.filter(m => m.bracket === 'W');
  const lbMatches  = BRACKET_2026.filter(m => m.bracket === 'L');
  const gfMatches  = BRACKET_2026.filter(m => m.bracket === 'G');

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Barlow Condensed', sans-serif" }}>

      {/* Hero */}
      <div style={{ background: `linear-gradient(180deg, #1A0A05 0%, ${C.bg} 100%)`, padding: '32px 20px 24px', borderBottom: `1px solid ${C.slate}` }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ background: 'rgba(139,26,47,0.3)', color: '#E74C3C', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
              ⚫ 2026 SEASON
            </span>
            <span style={{ color: C.textM, fontSize: 11 }}>Double Elimination</span>
          </div>

          <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: 32, fontWeight: 900, color: C.gold, margin: '0 0 6px', letterSpacing: '0.04em', lineHeight: 1.1 }}>
            Washington Classic
          </h1>
          <p style={{ color: C.textD, fontSize: 16, margin: '0 0 16px', letterSpacing: '0.02em' }}>
            The Premier Domino Tournament on SeeWhy LIVE
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {[
              { icon: MapPin,    label: "Jamar's Sports Bar & Grill, Des Moines, WA" },
              { icon: Calendar,  label: 'June–July 2026' },
              { icon: Users,     label: '8 Teams · 7 Rock / 5-150 Format' },
              { icon: Trophy,    label: '$5,000 Prize Pool' },
            ].map(({ icon: IconComp, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textM, fontSize: 13 }}>
                <IconComp style={{ width: 14, height: 14, color: C.amber, flexShrink: 0 }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: C.bg2, borderBottom: `1px solid ${C.slate}`, overflowX: 'auto', display: 'flex', padding: '0 16px', scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '12px 16px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === t.id ? 700 : 400,
              background: 'transparent', color: tab === t.id ? C.gold : C.textM, whiteSpace: 'nowrap',
              borderBottom: tab === t.id ? `2px solid ${C.gold}` : '2px solid transparent',
              fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── BRACKET ── */}
        {tab === 'bracket' && (
          <div>
            <p style={{ color: C.amber, fontWeight: 700, fontSize: 13, marginBottom: 12, letterSpacing: '0.06em' }}>WINNERS BRACKET</p>
            {wbMatches.map(m => <MatchCard key={m.id} match={m} />)}

            <p style={{ color: C.blue, fontWeight: 700, fontSize: 13, margin: '20px 0 12px', letterSpacing: '0.06em' }}>LOSERS BRACKET</p>
            {lbMatches.map(m => <MatchCard key={m.id} match={m} />)}

            <p style={{ color: C.gold, fontWeight: 900, fontSize: 14, margin: '20px 0 12px', letterSpacing: '0.06em' }}>⚡ GRAND FINAL</p>
            {gfMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        )}

        {/* ── STANDINGS ── */}
        {tab === 'standings' && (
          <div>
            <div style={{ background: C.bg3, border: `1px solid ${C.slate}`, borderRadius: 10, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 60px 60px 60px', gap: 10, padding: '10px 14px', background: C.bg2, color: C.textM, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                <span>#</span><span>TEAM</span><span style={{ textAlign: 'center' }}>W</span><span style={{ textAlign: 'center' }}>L</span><span style={{ textAlign: 'right' }}>AVG</span>
              </div>
              {sorted.map((team, i) => (
                <div key={team.id} style={{
                  display: 'grid', gridTemplateColumns: '28px 1fr 60px 60px 60px', gap: 10, padding: '12px 14px', alignItems: 'center',
                  borderTop: i > 0 ? `1px solid ${C.slate}` : 'none',
                  background: i === 0 ? 'rgba(201,168,76,0.06)' : 'transparent',
                }}>
                  <span style={{ color: i === 0 ? C.gold : C.textM, fontWeight: i < 3 ? 700 : 400, fontSize: 15 }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </span>
                  <div>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{team.name}</div>
                    <div style={{ color: C.textM, fontSize: 11 }}>{team.state} · Seed #{team.seed}</div>
                  </div>
                  <span style={{ color: C.green, fontWeight: 700, fontSize: 16, textAlign: 'center' }}>{team.wins}</span>
                  <span style={{ color: C.red, fontWeight: 700, fontSize: 16, textAlign: 'center' }}>{team.losses}</span>
                  <span style={{ color: C.amber, fontWeight: 700, fontSize: 15, textAlign: 'right' }}>{team.ppg}</span>
                </div>
              ))}
            </div>
            <p style={{ color: C.textM, fontSize: 11, marginTop: 10, textAlign: 'center' }}>AVG = Average Points Per Game · Format: 5-150</p>
          </div>
        )}

        {/* ── CHAMPIONS ── */}
        {tab === 'history' && (
          <div>
            <div style={{ background: `linear-gradient(135deg, rgba(139,26,47,0.15), rgba(201,168,76,0.08))`, border: `1px solid ${C.goldD}`, borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32 }}>🏆</div>
              <div style={{ color: C.gold, fontWeight: 900, fontSize: 18, marginTop: 8 }}>Hall of Champions</div>
              <div style={{ color: C.textM, fontSize: 13, marginTop: 4 }}>Washington Classic · Est. 2019</div>
            </div>

            {PAST_CHAMPIONS.map((champ, i) => (
              <div key={champ.year} style={{ background: C.bg3, border: `1px solid ${C.slate}`, borderRadius: 10, padding: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: i === 0 ? 'rgba(201,168,76,0.15)' : C.bg2, border: `1px solid ${i === 0 ? C.gold : C.slate}`, borderRadius: 10, padding: '10px 16px', textAlign: 'center', minWidth: 64 }}>
                  <div style={{ color: C.gold, fontWeight: 900, fontSize: 22 }}>{champ.year}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Star style={{ width: 14, height: 14, color: C.gold }} />
                    <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{champ.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ color: C.textM, fontSize: 12 }}>📍 {champ.state}</span>
                    <span style={{ color: C.green, fontSize: 12, fontWeight: 700 }}>Record: {champ.record}</span>
                    <span style={{ color: C.amber, fontSize: 12, fontWeight: 700 }}>Prize: {champ.prize}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── INFO ── */}
        {tab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              {
                title: '🎯 Tournament Format',
                content: `Double Elimination bracket. 8 seeded teams. All games use the 7 Rock / 5-150 format — first team to 150 points wins each game. Best of 3 games per match in all rounds except the Grand Final (best of 5).`,
              },
              {
                title: '📍 Venue',
                content: `Jamar's Sports Bar & Grill\nDes Moines, WA\nAll matches are livestreamed exclusively on SeeWhy LIVE. Venue capacity: 150 spectators.`,
              },
              {
                title: '💰 Prize Pool',
                content: `Total: $5,000\n1st Place: $2,500\n2nd Place: $1,500\n3rd Place: $750\n4th Place: $250\nAll payouts via SeeWhy LIVE Payout Center (90% creator / 10% platform split applies to streaming revenue only — prize pool is separate).`,
              },
              {
                title: '📅 2026 Schedule',
                content: `Quarterfinals: June 7–14, 2026 (complete)\nSemifinals (Winners): June 21, 2026\nSemifinals (Losers): June 21, 2026\nWinners Final: July 5, 2026\nGrand Final: July 12, 2026`,
              },
              {
                title: '📡 Streaming Rules',
                content: `All Washington Classic matches stream live on SeeWhy LIVE. Creators broadcasting Washington Classic content earn 90% of streaming revenue. Co-streams permitted with attribution. Clips allowed with SeeWhy LIVE watermark.`,
              },
            ].map(s => (
              <div key={s.title} style={{ background: C.bg3, border: `1px solid ${C.slate}`, borderRadius: 10, padding: 16 }}>
                <p style={{ color: C.gold, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{s.title}</p>
                <p style={{ color: C.textD, fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-line' }}>{s.content}</p>
              </div>
            ))}

            <Link to="/GoLiveStudio" style={{ textDecoration: 'none' }}>
              <div style={{ background: `linear-gradient(135deg, ${C.ruby}, ${C.goldD})`, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>📡 Broadcast This Tournament</div>
                  <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 }}>Go live from Go Live Studio</div>
                </div>
                <Radio style={{ width: 28, height: 28, color: 'rgba(255,255,255,0.7)' }} />
              </div>
            </Link>
          </div>
        )}
      </div>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 32 }}>
        <BattleScoreboard roomId={null} />
        <BattleMode roomId={null} isHost={false} hostName={null} participants={[]} />
        <StreamAnalyticsDashboard roomId={null} />
        <ChallengeLeaderboard communityId={null} />
        <TournamentBracket />
        <EngagementBadgesDisplay roomId={null} userId={null} creatorId={null} />
        <LeaderboardPanel roomId={null} />
        <ShareToSocial content={null} />
      </div>
    </div>
  );
}