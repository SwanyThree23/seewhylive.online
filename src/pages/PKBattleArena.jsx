import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import PKBattleProgress from '../components/pk/PKBattleProgress';
import PKBattleVotePanel from '../components/pk/PKBattleVotePanel';
import PKBattleSoundboard from '../components/live/PKBattleSoundboard';
import GiftShopTray from '../components/live/GiftShopTray';
import EngagementBadgesDisplay from '../components/live/EngagementBadgesDisplay';
import TournamentBracket from '../components/pk/TournamentBracket';
import BattleOverlay from '../components/pk/BattleOverlay';
import MatchmakingQueue from '../components/pk/MatchmakingQueue';
import BattleMode from '../components/streaming/BattleMode';
import BattleScoreboard from '../components/live/BattleScoreboard';
import PKAnalyticsDashboard from '../components/pk/PKAnalyticsDashboard';

const BG    = '#080B18';
const BG2   = '#0D0A08';
const BG3   = '#13100A';
const GOLD  = '#D4AF37';
const CRIM  = '#800020';
const SCARL = '#C0392B';
const TEXT  = '#F0E8D4';
const TEXTD = '#C4B596';
const TEXTM = '#8A7A62';
const GREEN = '#6DBF7E';
const T     = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO  = { fontFamily: 'Space Mono, monospace' };

const GLOBAL_CSS = `
@keyframes pkPulse{0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,0);}50%{box-shadow:0 0 0 8px rgba(192,57,43,0.18);}}
@keyframes voteShake{0%,100%{transform:scale(1);}25%{transform:scale(1.08);}75%{transform:scale(0.96);}}
@keyframes pk-in{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
.pk-in{animation:pk-in .35s ease forwards;}
`;

function genBattles() {
  const names = [
    ['SwanyThree',    'KingDom_WA'],
    ['MamaJoyce_ATL', 'SlickRick_TX'],
    ['DominoKing_CA', 'FastHands_FL'],
    ['WestCoast_WA',  'SouthSide_GA'],
  ];
  return names.map(([a, b], i) => ({
    id: i + 1,
    a: { name: a, score: Math.floor(Math.random() * 12000) + 4000, color: SCARL },
    b: { name: b, score: Math.floor(Math.random() * 12000) + 4000, color: '#D4854A' },
    status: i === 0 ? 'live' : i === 1 ? 'live' : 'upcoming',
    timeLeft: i === 0 ? 142 : i === 1 ? 67 : null,
    category: ['Tournament', 'Exhibition', 'Championship', 'Qualifier'][i],
  }));
}

function ScoreBar({ battle }) {
  const total = battle.a.score + battle.b.score;
  const pct   = total > 0 ? (battle.a.score / total) * 100 : 50;
  return (
    <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', background: 'rgba(212,133,74,0.2)', margin: '8px 0' }}>
      <motion.div
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ height: '100%', background: `linear-gradient(90deg, ${SCARL}, ${SCARL}cc)`, borderRadius: 3 }}
      />
    </div>
  );
}

function BattleCard({ battle, onVote, myVote }) {
  const isLive = battle.status === 'live';
  const total  = battle.a.score + battle.b.score;
  const pctA   = total > 0 ? Math.round((battle.a.score / total) * 100) : 50;

  return (
    <motion.div
      className="pk-in"
      style={{
        background: BG2,
        border: `1px solid ${isLive ? `${SCARL}44` : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: isLive ? `0 0 0 1px ${SCARL}22` : 'none',
      }}
    >
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px' }}>
        <span style={{ ...T, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: isLive ? SCARL : TEXTM,
          background: isLive ? `${SCARL}18` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isLive ? SCARL + '44' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 99, padding: '2px 8px',
        }}>
          {isLive ? '⚔️ LIVE' : '⏳ UPCOMING'}
        </span>
        <span style={{ ...T, fontSize: 10, fontWeight: 700, color: TEXTM, letterSpacing: '0.06em' }}>
          {battle.category}
        </span>
        {isLive && battle.timeLeft != null && (
          <span style={{ ...MONO, fontSize: 10, color: GOLD }}>
            {Math.floor(battle.timeLeft / 60)}:{String(battle.timeLeft % 60).padStart(2, '0')}
          </span>
        )}
      </div>

      {/* VS row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '6px 14px 0' }}>
        {/* Side A */}
        <div style={{ flex: 1 }}>
          <div style={{ ...T, fontSize: 16, fontWeight: 900, color: TEXT, letterSpacing: '0.02em' }}>{battle.a.name}</div>
          <div style={{ ...MONO, fontSize: 18, fontWeight: 700, color: SCARL, marginTop: 2 }}>
            {battle.a.score.toLocaleString()}
          </div>
          <div style={{ ...T, fontSize: 10, color: TEXTM }}>{pctA}%</div>
        </div>

        {/* VS badge */}
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${CRIM}55`, border: `1.5px solid ${SCARL}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          animation: isLive ? 'pkPulse 2s ease infinite' : 'none' }}>
          <span style={{ ...T, fontSize: 13, fontWeight: 900, color: TEXT }}>VS</span>
        </div>

        {/* Side B */}
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ ...T, fontSize: 16, fontWeight: 900, color: TEXT, letterSpacing: '0.02em' }}>{battle.b.name}</div>
          <div style={{ ...MONO, fontSize: 18, fontWeight: 700, color: '#D4854A', marginTop: 2 }}>
            {battle.b.score.toLocaleString()}
          </div>
          <div style={{ ...T, fontSize: 10, color: TEXTM }}>{100 - pctA}%</div>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ padding: '0 14px' }}>
        <ScoreBar battle={battle} />
      </div>

      {/* Vote buttons */}
      {isLive && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 14px 14px' }}>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => onVote(battle.id, 'a')}
            style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
              background: myVote === 'a' ? `linear-gradient(135deg, ${SCARL}, ${CRIM})` : `${SCARL}22`,
              color: myVote === 'a' ? '#fff' : SCARL,
              ...T, fontSize: 13, fontWeight: 900, letterSpacing: '0.06em', cursor: 'pointer',
              border: `1px solid ${SCARL}55`,
            }}
          >
            {myVote === 'a' ? '✓ VOTED' : '⚡ VOTE'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => onVote(battle.id, 'b')}
            style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
              background: myVote === 'b' ? 'linear-gradient(135deg, #D4854A, #CC7755)' : 'rgba(128,0,32,0.15)',
              color: myVote === 'b' ? '#fff' : '#D4854A',
              ...T, fontSize: 13, fontWeight: 900, letterSpacing: '0.06em', cursor: 'pointer',
              border: '1px solid rgba(128,0,32,0.3)',
            }}
          >
            {myVote === 'b' ? '✓ VOTED' : '⚡ VOTE'}
          </motion.button>
        </div>
      )}
      {!isLive && (
        <div style={{ padding: '8px 14px 14px' }}>
          <div style={{ ...T, fontSize: 12, color: TEXTM, textAlign: 'center', letterSpacing: '0.06em' }}>
            Battle starts soon — check back
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function PKBattleArena() {
  const [battles, setBattles] = useState(() => genBattles());
  const [votes, setVotes] = useState({});
  const [tab, setTab] = useState('live');
  const tickRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Simulate live score updates
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setBattles(prev => prev.map(b => {
        if (b.status !== 'live') return b;
        const delta = Math.floor(Math.random() * 120);
        const side  = Math.random() < 0.5 ? 'a' : 'b';
        return { ...b, [side]: { ...b[side], score: b[side].score + delta }, timeLeft: b.timeLeft != null ? Math.max(0, b.timeLeft - 1) : null };
      }));
    }, 1200);
    return () => clearInterval(tickRef.current);
  }, []);

  function vote(battleId, side) {
    if (votes[battleId]) return;
    setVotes(v => ({ ...v, [battleId]: side }));
    setBattles(prev => prev.map(b => {
      if (b.id !== battleId) return b;
      const inc = Math.floor(Math.random() * 500) + 200;
      return { ...b, [side]: { ...b[side], score: b[side].score + inc } };
    }));
  }

  const liveBattles     = battles.filter(b => b.status === 'live');
  const upcomingBattles = battles.filter(b => b.status === 'upcoming');
  const displayed       = tab === 'live' ? liveBattles : upcomingBattles;

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', background: BG2, borderBottom: `1px solid rgba(192,57,43,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to={createPageUrl('LiveBattles')} style={{ ...T, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', letterSpacing: '0.06em', marginRight: 4 }}>← Battles</Link>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${SCARL}, ${CRIM})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚔️</div>
          <div>
            <div style={{ ...T, fontSize: 20, fontWeight: 900, color: TEXT, letterSpacing: '0.06em', lineHeight: 1 }}>PK BATTLE ARENA</div>
            <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginTop: 2 }}>LIVE VOTE BATTLES · SEEWHYLIVE</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link to={createPageUrl('PKBattleManager')} style={{ textDecoration: 'none' }}>
            <button style={{ ...T, fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 99, border: `1px solid ${SCARL}44`, background: `${SCARL}18`, color: SCARL, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              ⚙️ Manage
            </button>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: 'rgba(109,191,126,0.12)', border: '1px solid rgba(109,191,126,0.3)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'pkPulse 1.5s ease infinite' }} />
            <span style={{ ...MONO, fontSize: 9, color: GREEN, fontWeight: 700 }}>{liveBattles.length} LIVE</span>
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid rgba(255,255,255,0.07)`, background: BG2 }}>
        {[['live', `⚔️ Live (${liveBattles.length})`], ['upcoming', `⏳ Upcoming (${upcomingBattles.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
            ...T, fontSize: 13, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: tab === key ? SCARL : TEXTM,
            borderBottom: tab === key ? `2px solid ${SCARL}` : '2px solid transparent',
            transition: 'all .2s',
          }}>{label}</button>
        ))}
      </div>

      {/* Battle list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {displayed.length > 0 ? displayed.map(b => (
          <BattleCard key={b.id} battle={b} onVote={vote} myVote={votes[b.id]} />
        )) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: TEXTM, ...T, fontSize: 14 }}>
            No {tab} battles right now
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PKBattleProgress battleId={null} />
        <PKBattleVotePanel battleId={null} creatorId={null} challengerId={null} creatorName="Creator" challengerName="Challenger" />
        <PKBattleSoundboard battleId={null} isBattleActive={false} />
        <GiftShopTray roomId={null} currentUser={null} />
        <EngagementBadgesDisplay roomId={null} userId={null} creatorId={null} />
        <BattleScoreboard roomId={null} />
        <BattleMode roomId={null} isHost={false} hostName="" participants={[]} />
        <TournamentBracket />
        <MatchmakingQueue user={null} onMatchFound={() => {}} />
        <BattleOverlay battle={null} onBattleUpdate={() => {}} />
        <PKAnalyticsDashboard battles={[]} user={null} />
      </div>

      {/* Footer nav */}
      <div style={{ padding: '10px 16px', background: BG2, borderTop: `1px solid rgba(255,255,255,0.06)`, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[['LiveBattles', '🏆 Battles'], ['PKBattleManager', '⚙️ Manage'], ['StateVsState', '⚔️ SVS'], ['Leaderboard', '👑 Elite']].map(([page, label]) => (
          <Link key={page} to={createPageUrl(page)} style={{ textDecoration: 'none' }}>
            <button style={{ ...T, fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: `1px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: TEXTD, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {label}
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
