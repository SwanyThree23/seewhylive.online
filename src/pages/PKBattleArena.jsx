import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
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

var BG    = '#080B18';
var BG2   = '#0D0A08';
var BG3   = '#13100A';
var GOLD  = '#D4AF37';
var GOLDD = '#8A6F2E';
var SLATE = '#1A1530';
var TEXT  = '#F0EAF8';
var TEXTD = '#B8AECF';
var TEXTM = '#7A6E8A';
var CRIMSON = '#800020';
var RED   = '#C0392B';
var GREEN = '#6DBF7E';
var SCARL = '#C0392B';
var CRIM = '#800020';
var CYAN  = '#D4AF37';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };
var MONO = { fontFamily: 'Space Mono, monospace' };

var OCT = 'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)';

var OPPONENTS = [];

var GLOBAL_CSS = `
@keyframes pkPulse{0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,0);}50%{box-shadow:0 0 0 8px rgba(192,57,43,0.18);}}
@keyframes voteShake{0%,100%{transform:scale(1);}25%{transform:scale(1.08);}75%{transform:scale(0.96);}}
@keyframes pk-in{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
.pk-in{animation:pk-in .35s ease forwards;}
`;

function battleToUI(b) {
  var creatorScore  = (b.creator_tips || 0) + (b.creator_subs || 0) * 10;
  var challengerScore = (b.challenger_tips || 0) + (b.challenger_subs || 0) * 10;
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

function ScoreBar(props) {
  var battle = props.battle;
  var total = battle.a.score + battle.b.score;
  var pct   = total > 0 ? (battle.a.score / total) * 100 : 50;
  return (
    <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', background: 'rgba(212,133,74,0.2)', margin: '8px 0' }}>
      <motion.div
        animate={{ width: pct + '%' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ height: '100%', background: 'linear-gradient(90deg, ' + SCARL + ', ' + SCARL + 'cc)', borderRadius: 3 }}
      />
    </div>
  );
}

function BattleCard(props) {
  var battle = props.battle;
  var onVote = props.onVote;
  var myVote = props.myVote;
  var isLive = battle.status === 'live';
  var total  = battle.a.score + battle.b.score;
  var pctA   = total > 0 ? Math.round((battle.a.score / total) * 100) : 50;

  return (
    <motion.div
      className="pk-in"
      style={{
        background: BG2,
        border: '1px solid ' + (isLive ? SCARL + '44' : 'rgba(255,255,255,0.07)'),
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: isLive ? '0 0 0 1px ' + SCARL + '22' : 'none',
      }}
    >
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: isLive ? SCARL : TEXTM,
          background: isLive ? SCARL + '18' : 'rgba(255,255,255,0.04)',
          border: '1px solid ' + (isLive ? SCARL + '44' : 'rgba(255,255,255,0.08)'),
          borderRadius: 99, padding: '2px 8px',
        }}>
          {isLive ? '⚔️ LIVE' : '⏳ UPCOMING'}
        </span>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 700, color: TEXTM, letterSpacing: '0.06em' }}>
          {battle.category}
        </span>
        {isLive && battle.timeLeft != null && (
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: GOLD }}>
            {Math.floor(battle.timeLeft / 60)}:{String(battle.timeLeft % 60).padStart(2, '0')}
          </span>
        )}
      </div>

      {/* VS row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '6px 14px 0' }}>
        {/* Side A */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 900, color: TEXT, letterSpacing: '0.02em' }}>{battle.a.name}</div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 18, fontWeight: 700, color: SCARL, marginTop: 2 }}>
            {battle.a.score.toLocaleString()}
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: TEXTM }}>{pctA}%</div>
        </div>

        {/* VS badge */}
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: CRIM + '55', border: '1.5px solid ' + SCARL + '66',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          animation: isLive ? 'pkPulse 2s ease infinite' : 'none' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, color: TEXT }}>VS</span>
        </div>

        {/* Side B */}
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 900, color: TEXT, letterSpacing: '0.02em' }}>{battle.b.name}</div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 18, fontWeight: 700, color: '#D4854A', marginTop: 2 }}>
            {battle.b.score.toLocaleString()}
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: TEXTM }}>{100 - pctA}%</div>
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
            onClick={function() { onVote(battle.id, 'a'); }}
            style={{ flex: 1, padding: '10px 0', borderRadius: 10,
              background: myVote === 'a' ? 'linear-gradient(135deg, ' + SCARL + ', ' + CRIM + ')' : SCARL + '22',
              color: myVote === 'a' ? '#fff' : SCARL,
              fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, letterSpacing: '0.06em', cursor: 'pointer',
              border: '1px solid ' + SCARL + '55',
            }}
          >
            {myVote === 'a' ? '✓ VOTED' : '⚡ VOTE'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={function() { onVote(battle.id, 'b'); }}
            style={{ flex: 1, padding: '10px 0', borderRadius: 10,
              background: myVote === 'b' ? 'linear-gradient(135deg, #D4854A, #CC7755)' : 'rgba(128,0,32,0.15)',
              color: myVote === 'b' ? '#fff' : '#D4854A',
              fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, letterSpacing: '0.06em', cursor: 'pointer',
              border: '1px solid rgba(128,0,32,0.3)',
            }}
          >
            {myVote === 'b' ? '✓ VOTED' : '⚡ VOTE'}
          </motion.button>
        </div>
      )}
      {!isLive && (
        <div style={{ padding: '8px 14px 14px' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: TEXTM, textAlign: 'center', letterSpacing: '0.06em' }}>
            Battle starts soon — check back
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function PKBattleArena() {
  var roomId = new URLSearchParams(window.location.search).get('id') || null;
  var navigate = useNavigate();
  var userQuery = useQuery({ queryKey: ['currentUser'], queryFn: function() { return base44.auth.me(); } });
  var user = userQuery.data || null;
  var battleMembersQuery = useQuery({
    queryKey: ['pk-members', roomId],
    queryFn: function() { return base44.entities.WatchPartyMember.filter({ party_id: roomId, is_active: true }); },
    enabled: !!roomId,
    refetchInterval: 10000,
  });
  var battleMembers = battleMembersQuery.data || [];
  var tabState = useState('live');
  var tab = tabState[0];
  var setTab = tabState[1];
  var votesState = useState({});
  var votes = votesState[0];
  var setVotes = votesState[1];
  var rawBattlesQuery = useQuery({
    queryKey: ['pk-arena-battles'],
    queryFn: function() { return base44.entities.PKBattle.list('-created_date', 20); },
    refetchInterval: 5000,
  });
  var rawBattles = rawBattlesQuery.data || [];
  var battles = rawBattles.map(battleToUI);
  var selectedOpponentState = useState(null);
  var selectedOpponent = selectedOpponentState[0];
  var setSelectedOpponent = selectedOpponentState[1];
  var battleSecsState = useState(0);
  var battleSecs = battleSecsState[0];
  var setBattleSecs = battleSecsState[1];
  var hostVotesState = useState(50);
  var hostVotes = hostVotesState[0];
  var setHostVotes = hostVotesState[1];
  var oppVotesState = useState(50);
  var oppVotes = oppVotesState[0];
  var setOppVotes = oppVotesState[1];
  var battleHistoryState = useState([]);
  var battleHistory = battleHistoryState[0];
  var setBattleHistory = battleHistoryState[1];
  var phaseState = useState('select');
  var phase = phaseState[0];
  var setPhase = phaseState[1];
  var countdownState = useState(3);
  var countdown = countdownState[0];
  var setCountdown = countdownState[1];
  var timerRef = useRef(null);
  var voteRef  = useRef(null);
  var cdRef    = useRef(null);

  useEffect(function() {
    var style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return function() { document.head.removeChild(style); };
  }, []);

  async function vote(battleId, side) {
    if (votes[battleId] || !user) return;
    setVotes(function(v) { var n = Object.assign({}, v); n[battleId] = side; return n; });
    var battle = rawBattles.find(function(b) { return b.id === battleId; });
    if (!battle) return;
    var field = side === 'a' ? 'creator_tips' : 'challenger_tips';
    var updateData = {}; updateData[field] = (battle[field] || 0) + 1;
    await base44.entities.PKBattle.update(battleId, updateData).catch(function() {});
    await base44.entities.Activity.create({ type: 'pk_vote', user_id: user.id, entity_id: battleId, metadata: { side: side } }).catch(function() {});
  }

  var liveBattles     = battles.filter(function(b) { return b.status === 'live'; });
  var upcomingBattles = battles.filter(function(b) { return b.status === 'upcoming' || b.status === 'pending'; });
  var displayed       = tab === 'live' ? liveBattles : upcomingBattles;
  var totalVotes = battles.length;
  var battleActive = liveBattles.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', background: BG2, borderBottom: '1px solid rgba(192,57,43,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to={createPageUrl('LiveBattles')} style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', letterSpacing: '0.06em', marginRight: 4 }}>← Battles</Link>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, ' + SCARL + ', ' + CRIM + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚔️</div>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 900, color: TEXT, letterSpacing: '0.06em', lineHeight: 1 }}>PK BATTLE ARENA</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginTop: 2 }}>LIVE VOTE BATTLES · SEEWHYLIVE</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link to={createPageUrl('PKBattleManager')} style={{ textDecoration: 'none' }}>
            <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 99, border: '1px solid ' + SCARL + '44', background: SCARL + '18', color: SCARL, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              ⚙️ Manage
            </button>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: 'rgba(109,191,126,0.12)', border: '1px solid rgba(109,191,126,0.3)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'pkPulse 1.5s ease infinite' }} />
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: GREEN, fontWeight: 700 }}>{liveBattles.length} LIVE</span>
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', background: BG2 }}>
        {[['live', '⚔️ Live (' + liveBattles.length + ')'], ['upcoming', '⏳ Upcoming (' + upcomingBattles.length + ')']].map(function(pair) {
          var key = pair[0];
          var label = pair[1];
          return (
          <button key={key} onClick={function() { setTab(key); }} style={{
            flex: 1, padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: tab === key ? SCARL : TEXTM,
            borderBottom: tab === key ? '2px solid ' + SCARL : '2px solid transparent',
            transition: 'all .2s',
          }}>{label}</button>
          );
        })}
      </div>

      {/* Battle list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {displayed.length > 0 ? displayed.map(function(b) { return (
          <BattleCard key={b.id} battle={b} onVote={vote} myVote={votes[b.id]} />
        ); }) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: TEXTM, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14 }}>
            No {tab} battles right now
          </div>
        )}
      </div>
      <SwanyBotWidget />
      <NotificationBell />
      <GiftSystem roomId={roomId} userId={(user && user.id) || null} isHost={true} />
      <GiftLeaderboard roomId={roomId} />
      <ViewerCount count={totalVotes} peakViewers={totalVotes} />
      <SwanAIRecommendations roomId={roomId} currentLayout='pkbattle' viewerCount={totalVotes} />
      <HostAlertCenter />
      <StreamHealthMonitor isStreaming={battleActive} />
      <BattleArenaManager roomId={roomId} isHost={true} onBattleEnd={function() { setTimeout(function() { navigate('/'); }, 2000); }} />
      <PKBattleInterface roomId={roomId} />
      <StreamAnalyticsDashboard roomId={roomId} isHost={true} isLive={battleActive} />
      <GuestControls participants={battleMembers} onMuteGuest={function(id) { base44.entities.WatchPartyMember.update(id, { is_audio_enabled: false }).catch(function() {}); }} onRemoveGuest={function(id) { base44.entities.WatchPartyMember.update(id, { is_active: false }).catch(function() {}); }} />
      <LivePoll roomId={roomId} isHost={true} />
    </div>
  );
}