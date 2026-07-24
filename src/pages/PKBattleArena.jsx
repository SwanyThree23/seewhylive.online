import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import NotificationBell from '../components/shared/NotificationBell';
import { GiftTray as GiftSystem } from '../components/live/GiftSystem';
import { GiftLeaderboard } from '../components/live/GiftSystem';
import ViewerCount from '../components/live/ViewerCount';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import HostAlertCenter from '../components/live/HostAlertCenter';
import StreamHealthMonitor from '../components/streaming/StreamHealthMonitor';
import BattleArenaManager from '../components/live/BattleArenaManager';
import PKBattleInterface from '../components/pk/PKBattleInterface';
import StreamAnalyticsDashboard from '../components/streaming/StreamAnalyticsDashboard';
import GuestControls from '../components/live/GuestControls';
import LivePoll from '../components/live/LivePoll';

const BG    = '#080B18';
const BG2   = '#0D0A08';
const BG3   = '#13100A';
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
// SCARL (scarlet) and CRIM (crimson) — used throughout battle card UI
const SCARL = '#C0392B';
const CRIM  = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO = { fontFamily: 'Space Mono, monospace' };

// Format large numbers: 4710 → "4.7K", 1.2M → "1.2M"
function formatK(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const OCT = 'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)';

const OPPONENTS = [
  { id: 'swanythree',   name: 'SwanyThree',    state: 'WA', wins: 47, losses: 8,  avatar: '🦁' },
  { id: 'bigbone',      name: 'BigBoneEarl',   state: 'WA', wins: 38, losses: 14, avatar: '🏆' },
  { id: 'fasthandsr',   name: 'FastHandsR',    state: 'TX', wins: 52, losses: 11, avatar: '⚡' },
  { id: 'domqueen',     name: 'DomQueen',      state: 'GA', wins: 29, losses: 9,  avatar: '👑' },
  { id: 'stonewall',    name: 'StoneWall',     state: 'CA', wins: 33, losses: 19, avatar: '🪨' },
];

const GLOBAL_CSS = `
@keyframes pkPulse{0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,0);}50%{box-shadow:0 0 0 8px rgba(192,57,43,0.18);}}
@keyframes voteShake{0%,100%{transform:scale(1);}25%{transform:scale(1.08);}75%{transform:scale(0.96);}}
@keyframes pk-in{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
.pk-in{animation:pk-in .35s ease forwards;}
`;

function battleToUI(b) {
  const creatorScore  = (b.creator_tips || 0) + (b.creator_subs || 0) * 10;
  const challengerScore = (b.challenger_tips || 0) + (b.challenger_subs || 0) * 10;
  return {
    id: b.id,
    raw: b,
    a: { name: b.creator_name   || 'Creator',    score: creatorScore,    color: SCARL },
    b: { name: b.challenger_name || 'Challenger', score: challengerScore, color: '#D4854A' },
    status: b.status === 'active' ? 'live' : b.status === 'pending' ? 'upcoming' : b.status,
    timeLeft: null,
    category: b.battle_type || 'Exhibition',
  };
}

function ScoreBar({ battle }) {
  const total = battle.a.score + battle.b.score;
  const pctA  = total > 0 ? (battle.a.score / total) * 100 : 50;
  const pctB  = 100 - pctA;
  return (
    <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', margin: '10px 0 4px' }}>
      <div style={{ display: 'flex', height: '100%' }}>
        <motion.div
          animate={{ width: `${pctA}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${GOLD}cc, ${GOLD})` }}
        />
        <motion.div
          animate={{ width: `${pctB}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${SCARL}, ${SCARL}cc)` }}
        />
      </div>
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

      {/* BIGO-style split score hero */}
      <div style={{ display: 'flex', minHeight: 80, position: 'relative' }}>
        {/* Side A — gold */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '10px 14px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(8,11,24,0.6) 100%)',
        }}>
          <motion.div
            key={battle.a.score}
            initial={{ scale: 1.18 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ ...MONO, fontSize: 30, fontWeight: 900, color: GOLD, lineHeight: 1 }}
          >
            {formatK(battle.a.score)}
          </motion.div>
          <div style={{ ...T, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 3, maxWidth: 80, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {battle.a.name}
          </div>
          <div style={{ ...T, fontSize: 9, color: `${GOLD}88`, marginTop: 1 }}>{pctA}%</div>
        </div>

        {/* Center: VS + timer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 10px', flexShrink: 0, zIndex: 1 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: `${CRIM}55`, border: `1.5px solid ${SCARL}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: isLive ? 'pkPulse 2s ease infinite' : 'none',
          }}>
            <span style={{ ...T, fontSize: 12, fontWeight: 900, color: TEXT }}>⚔️</span>
          </div>
          {isLive && battle.timeLeft != null && (
            <div style={{ ...MONO, fontSize: 10, color: GOLD, marginTop: 4 }}>
              {Math.floor(battle.timeLeft / 60)}:{String(battle.timeLeft % 60).padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Side B — red */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '10px 14px',
          background: 'linear-gradient(225deg, rgba(192,57,43,0.18) 0%, rgba(8,11,24,0.6) 100%)',
        }}>
          <motion.div
            key={battle.b.score}
            initial={{ scale: 1.18 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ ...MONO, fontSize: 30, fontWeight: 900, color: SCARL, lineHeight: 1 }}
          >
            {formatK(battle.b.score)}
          </motion.div>
          <div style={{ ...T, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 3, maxWidth: 80, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {battle.b.name}
          </div>
          <div style={{ ...T, fontSize: 9, color: `${SCARL}88`, marginTop: 1 }}>{100 - pctA}%</div>
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
  const roomId = new URLSearchParams(window.location.search).get('id') || null;
  const navigate = useNavigate();
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: battleMembers = [] } = useQuery({
    queryKey: ['pk-members', roomId],
    queryFn: () => base44.entities.WatchPartyMember.filter({ party_id: roomId, is_active: true }),
    enabled: !!roomId,
    refetchInterval: 10000,
  });
  const [tab, setTab] = useState('live');
  const [votes, setVotes] = useState({});
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [battleSecs, setBattleSecs]             = useState(0);
  const [hostVotes, setHostVotes]               = useState(50);
  const [oppVotes, setOppVotes]                 = useState(50);
  const [battleHistory, setBattleHistory]       = useState([]);
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

  async function vote(battleId, side) {
    if (votes[battleId] || !user) return;
    setVotes(v => ({ ...v, [battleId]: side }));
    const battle = rawBattles.find(b => b.id === battleId);
    if (!battle) return;
    const field = side === 'a' ? 'creator_tips' : 'challenger_tips';
    await base44.entities.PKBattle.update(battleId, { [field]: (battle[field] || 0) + 1 }).catch(() => {});
    await base44.entities.Activity.create({ type: 'pk_vote', user_id: user.id, entity_id: battleId, metadata: { side } }).catch(() => {});
  }

  const liveBattles     = battles.filter(b => b.status === 'live');
  const upcomingBattles = battles.filter(b => b.status === 'upcoming' || b.status === 'pending');
  const displayed       = tab === 'live' ? liveBattles : upcomingBattles;
  const totalVotes = battles.length;
  const battleActive = liveBattles.length > 0;

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
      <SwanyBotWidget />
      <NotificationBell />
      <GiftSystem roomId={roomId} userId={user?.id || null} isHost={true} />
      <GiftLeaderboard roomId={roomId} />
      <ViewerCount count={totalVotes} peakViewers={totalVotes} />
      <SwanAIRecommendations roomId={roomId} currentLayout='pkbattle' viewerCount={totalVotes} />
      <HostAlertCenter />
      <StreamHealthMonitor isStreaming={battleActive} />
      <BattleArenaManager roomId={roomId} isHost={true} onBattleEnd={() => { setTimeout(() => navigate('/'), 2000); }} />
      <PKBattleInterface roomId={roomId} />
      <StreamAnalyticsDashboard roomId={roomId} isHost={true} isLive={battleActive} />
      <GuestControls participants={battleMembers} onMuteGuest={(id) => base44.entities.WatchPartyMember.update(id, { is_audio_enabled: false }).catch(() => {})} onRemoveGuest={(id) => base44.entities.WatchPartyMember.update(id, { is_active: false }).catch(() => {})} />
      <LivePoll roomId={roomId} isHost={true} />
    </div>
  );
}