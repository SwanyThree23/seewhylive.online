import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Crown, Star, DollarSign, Users, Trophy, Swords } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import RealtimeLeaderboard from '../components/live/RealtimeLeaderboard';
import SocialLeaderboard from '../components/watchparty/SocialLeaderboard';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import SpotlightBanner from '../components/community/SpotlightBanner';
import LeaderboardPanel from '../components/live/LeaderboardPanel';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';
import TipWidget from '../components/live/TipWidget';
import TippingOverlay from '../components/live/TippingOverlay';
import AnimatedGiftShop from '../components/monetization/AnimatedGiftShop';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ShareToSocial from '../components/social/ShareToSocial';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';

var SVS_BRACKET_ID = 'svs_bracket_v1';

// Static config: colors/names/abbr only — W-L and pts derived from DB
var SVS_STATE_CONFIG = [
  { id: 'wa', name: 'Washington', abbr: 'WA', color: '#D4854A', pts: 0 },
  { id: 'fl', name: 'Florida',    abbr: 'FL', color: '#C0392B', pts: 0 },
  { id: 'ca', name: 'California', abbr: 'CA', color: '#6DBF7E', pts: 0 },
  { id: 'tx', name: 'Texas',      abbr: 'TX', color: '#800020', pts: 0 },
  { id: 'ny', name: 'New York',   abbr: 'NY', color: '#D4AF37', pts: 0 },
  { id: 'ga', name: 'Georgia',    abbr: 'GA', color: '#CC7755', pts: 0 },
];
// Fallback with zero W-L until DB has records
var SVS_STATES = SVS_STATE_CONFIG.map(function(s) {
  return Object.assign({}, s, { w: 0, l: 0 });
});

var PERIOD_MS = { week: 7 * 86_400_000, month: 30 * 86_400_000, all: Infinity };

var GOLD    = '#D4AF37';
var CRIMSON = '#800020';
var SILVER  = '#9ca3af';
var BRONZE  = '#CD7F32';
var T       = { fontFamily: 'Barlow Condensed, sans-serif' };
var OCT     = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

var RANK_COLORS = [GOLD, SILVER, BRONZE];
var RANK_GLOWS  = ['rgba(212,175,55,0.35)', 'rgba(156,163,175,0.2)', 'rgba(205,127,50,0.2)'];
var RANK_LABELS = ['#1', '#2', '#3'];

/* ── OctAvatar ─────────────────────────────────────────────────────── */
function OctAvatar({ size = 60, src, initials, rankColor = GOLD, glow = false }) {
  return (
    <div className="relative shrink-0" style={{
      width: size, height: size,
      filter: glow ? `drop-shadow(0 0 10px ${rankColor}70)` : undefined,
    }}>
      {/* colored border layer */}
      <div className="absolute inset-0" style={{ clipPath: OCT, background: rankColor }} />
      {/* inner layer */}
      <div className="absolute flex items-center justify-center overflow-hidden"
        style={{
          inset: size <= 48 ? '2px' : '3px',
          clipPath: OCT,
          background: `linear-gradient(145deg, ${CRIMSON}99, #080B18)`,
        }}>
        {src
          ? <img src={src} alt="" className="w-full h-full object-cover" />
          : <span className="font-black text-white"
              style={{ fontSize: size * 0.3, fontFamily: 'Orbitron, monospace' }}>{initials}</span>}
      </div>
    </div>
  );
}

/* ── Top-3 Podium ──────────────────────────────────────────────────── */
function PodiumEntry({ rank, entry, statLabel, statValue }) {
  var color  = RANK_COLORS[rank - 1];
  var glow   = RANK_GLOWS[rank - 1];
  var isFirst = rank === 1;
  var size   = isFirst ? 72 : 60;
  var initials = (entry.user && entry.user.full_name && entry.user.full_name.charAt(0) && entry.user.full_name.charAt(0).toUpperCase()) || '?';

  // Heights: 1st tallest, 3rd medium, 2nd shortest
  var podiumHeights = { 1: 'pt-0', 2: 'pt-8', 3: 'pt-4' };

  return (
    <div className={`flex flex-col items-center gap-2 ${podiumHeights[rank]}`} style={{ minWidth: isFirst ? 100 : 80 }}>
      {/* crown for #1 */}
      {isFirst && (
        <Crown className="w-6 h-6 mb-1" style={{ color: GOLD, filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.8))' }} />
      )}

      {/* rank badge */}
      <div className="flex items-center justify-center w-6 h-6 rounded-full font-black text-[10px]"
        style={{ background: color, color: isFirst ? '#000' : '#fff', fontFamily: 'Orbitron, monospace' }}>
        {rank}
      </div>

      {/* oct avatar */}
      <OctAvatar size={size} src={entry.user && entry.user.avatar_url} initials={initials} rankColor={color} glow={isFirst} />

      {/* name */}
      <p className="font-black text-[11px] text-white text-center truncate max-w-[96px]" style={T}>
        {(entry.user && entry.user.full_name) || 'Anonymous'}
      </p>

      {/* stat */}
      <div className="flex flex-col items-center">
        <p className="font-black text-sm leading-none" style={{ color, fontFamily: 'Orbitron, monospace' }}>
          {statValue}
        </p>
        <p className="text-[11px] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{statLabel}</p>
      </div>

      {/* podium base */}
      <div className="w-full rounded-t-lg mt-1" style={{
        height: isFirst ? 40 : rank === 3 ? 24 : 16,
        background: `linear-gradient(180deg, ${color}30, ${color}10)`,
        border: `1px solid ${color}30`,
        borderBottom: 'none',
        minWidth: isFirst ? 80 : 64,
      }} />
    </div>
  );
}

/* ── Rank row (4th+) ───────────────────────────────────────────────── */
function RankRow({ rank, user, stat, statLabel, isCurrentUser, isEven }) {
  var initials = (user && user.full_name && user.full_name.charAt(0) && user.full_name.charAt(0).toUpperCase()) || '?';
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl transition-all"
      style={{
        background: isCurrentUser
          ? 'rgba(212,175,55,0.08)'
          : isEven ? 'rgba(8,11,24,0.6)' : 'rgba(8,11,24,0.4)',
        border: `1px solid ${isCurrentUser ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.04)'}`,
      }}>
      {/* rank number */}
      <div className="w-8 text-center shrink-0">
        <span className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>
          {rank}
        </span>
      </div>

      {/* oct avatar (40px) */}
      <OctAvatar size={40} src={(user && user.avatar_url)} initials={initials} rankColor="rgba(212,175,55,0.6)" />

      {/* name + subtitle */}
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm text-white truncate flex items-center gap-1" style={T}>
          {(user && user.full_name) || 'Anonymous'}
          {isCurrentUser && (
            <span className="text-[11px] font-black uppercase px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(212,175,55,0.15)', color: GOLD, border: '1px solid rgba(212,175,55,0.3)', ...T }}>
              You
            </span>
          )}
        </p>
        <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{(user && user.id) ? 'Creator' : ''}</p>
      </div>

      {/* score */}
      <div className="text-right shrink-0">
        <p className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>
          {typeof stat === 'number' && stat >= 1000 ? `${(stat / 1000).toFixed(1)}k` : stat}
        </p>
        <p className="text-[11px] uppercase" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{statLabel}</p>
      </div>
    </div>
  );
}

/* ── main page ──────────────────────────────────────────────────────── */
export default function LeaderboardPage() {
  var { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  var { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', (currentUser && currentUser.id)],
    queryFn: () => base44.entities.Community.filter({ owner_id: (currentUser && currentUser.id) }).then(r => r[0] || null),
    enabled: !!(currentUser && currentUser.id),
  });
  var userCommunityId = (userCommunity && userCommunity.id) || null;
  var { data: activeChallenge } = useQuery({
    queryKey: ['activeChallenge'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'active' }, '-created_date', 1).then(r => r[0] || null),
    enabled: true,
  });
  var activeChallengeId = (activeChallenge && activeChallenge.id) || null;
  var roomId = new URLSearchParams(window.location.search).get('room_id');
  var activeRoomId = roomId;
  var goalMetrics = useStreamGoalMetrics((currentUser && currentUser.id) || null, activeRoomId);

  var { data: creators = [] } = useQuery({
    queryKey: ['leaderboardCreators'],
    queryFn: () => base44.entities.CreatorProfile.list('-subscriber_count', 50),
  });

  var { data: rooms = [] } = useQuery({
    queryKey: ['leaderboardRooms'],
    queryFn: () => base44.entities.Room.list('-viewer_count', 50),
  });

  var { data: transactions = [] } = useQuery({
    queryKey: ['leaderboardTransactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 500),
  });

  var { data: allUsers = [] } = useQuery({
    queryKey: ['leaderboardUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
  });

  var { data: svsRecords = [] } = useQuery({
    queryKey: ['svs-bracket-records'],
    queryFn: () => base44.entities.PKBattle.filter({ room_id: SVS_BRACKET_ID }, '-created_date', 20),
    staleTime: 60000,
    refetchInterval: 60000,
  });

  var [activeTab, setActiveTab] = useState('earnings');
  var [period, setPeriod] = useState('all');

  // SVS standings derived from DB; fall back to static if no records yet
  var svsStates = useMemo(() => {
    if (!svsRecords.length) return SVS_STATES;
    var wl = {};
    SVS_STATE_CONFIG.forEach(s => { wl[s.id] = { w: 0, l: 0 }; });
    svsRecords.filter(r => r.status === 'ended').forEach(r => {
      var aWon = (r.creator_tips || 0) > (r.challenger_tips || 0);
      if (wl[r.creator_name] !== undefined) wl[r.creator_name][aWon ? 'w' : 'l']++;
      if (wl[r.challenger_name] !== undefined) wl[r.challenger_name][aWon ? 'l' : 'w']++;
    });
    return SVS_STATE_CONFIG
      .map(s => ({ ...s, w: (wl[s.id] && wl[s.id].w) || 0, l: (wl[s.id] && wl[s.id].l) || 0 }))
      .sort((a, b) => b.w - a.w || a.l - b.l);
  }, [svsRecords]);

  // Period cutoff for earnings / viewers tabs
  var cutoff = period === 'all' ? 0 : Date.now() - PERIOD_MS[period];
  var filteredTransactions = period === 'all' ? transactions
    : transactions.filter(t => new Date(t.created_date || 0).getTime() >= cutoff);
  var filteredRooms = period === 'all' ? rooms
    : rooms.filter(r => new Date(r.created_date || 0).getTime() >= cutoff);

  // Revenue leaderboard: aggregate by creator
  var revenueByCreator = filteredTransactions.reduce((acc, t) => {
    var key = t.recipient_id || t.to_user_id;
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + (t.creator_payout || 0) + (t.platform_cut || 0);
    return acc;
  }, {});

  var topEarners = Object.entries(revenueByCreator)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([userId, revenue]) => {
      var user = allUsers.find(u => u.id === userId);
      return { user: user || { full_name: 'Creator', email: '', id: userId }, revenue };
    })
    .filter(e => e.user);

  var topByViewers = [...filteredRooms]
    .sort((a, b) => (b.viewer_count || 0) - (a.viewer_count || 0))
    .slice(0, 20)
    .map(room => {
      var user = allUsers.find(u => u.id === room.host_id);
      return { user: user || { full_name: room.host_id || 'Creator', email: '', id: room.host_id }, viewers: room.viewer_count || 0, room };
    })
    .filter(e => e.user);

  var topBySubscribers = creators.slice(0, 20).map(profile => {
    var user = allUsers.find(u => u.id === profile.user_id);
    return { user: user || { full_name: profile.display_name, email: '', id: profile.user_id }, subscribers: profile.subscriber_count || 0 };
  }).filter(e => e.user);

  // Select list + stat accessors by active tab
  var tabData = {
    earnings:    { list: topEarners,      getStat: e => `$${e.revenue.toFixed(0)}`,   label: 'earned' },
    viewers:     { list: topByViewers,    getStat: e => e.viewers,                    label: 'viewers' },
    subscribers: { list: topBySubscribers, getStat: e => e.subscribers,               label: 'subs' },
  };
  var { list, getStat, label } = tabData[activeTab];
  var top3    = list.slice(0, 3);
  var rest    = list.slice(3);

  return (
    <div className="min-h-screen pb-8" style={{ background: '#080B18' }}>

      {/* ── sticky header ── */}
      <div className="sticky top-0 z-20 px-4 py-3"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}>
              <Trophy className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <h1 className="font-black text-lg text-white leading-none" style={T}>Leaderboard</h1>
          </div>

          {/* period selector */}
          <div className="flex gap-1">
            {[
              { id: 'week',  label: 'Week' },
              { id: 'month', label: 'Month' },
              { id: 'all',   label: 'All Time' },
            ].map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className="px-3 py-1 rounded-full font-black text-[10px] uppercase transition-all"
                style={{
                  background: period === p.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${period === p.id ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: period === p.id ? GOLD : 'rgba(255,255,255,0.4)',
                  ...T,
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-5">

        {/* ── category tab pills ── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {[
            { id: 'earnings',    label: 'Top Earners',  icon: DollarSign },
            { id: 'viewers',     label: 'Most Viewed',  icon: Users },
            { id: 'subscribers', label: 'Subscribers',  icon: Star },
            { id: 'svs',         label: 'State vs State', icon: Swords },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full shrink-0 font-black uppercase text-[10px] transition-all"
              style={{
                background: activeTab === tab.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeTab === tab.id ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.4)',
                ...T,
              }}>
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── SVS standings ── */}
        {activeTab === 'svs' && (
          <>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.12)' }}>
              <div className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Swords className="w-4 h-4" style={{ color: GOLD }} />
                <p className="font-black text-[11px] uppercase" style={{ color: 'rgba(255,255,255,0.5)', ...T }}>
                  State vs State · Season 1 Standings
                </p>
              </div>
              <div className="p-3 space-y-2">
                {svsStates.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      background: i === 0 ? `${GOLD}09` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${i === 0 ? `${GOLD}25` : 'rgba(255,255,255,0.04)'}`,
                    }}>
                    <div className="w-7 text-center shrink-0">
                      {i === 0
                        ? <Crown className="w-5 h-5 mx-auto" style={{ color: GOLD }} />
                        : <span className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{i + 1}</span>}
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-white text-sm"
                      style={{ background: s.color, fontFamily: 'Orbitron, monospace' }}>
                      {s.abbr}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-white" style={T}>{s.name}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
                        {s.w}W – {s.l}L · Season record
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>
                        {s.pts.toLocaleString()}
                      </p>
                      <p className="text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Link to={createPageUrl('StateVsState')}
              className="flex items-center justify-center gap-2 rounded-2xl py-4"
              style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', textDecoration: 'none' }}>
              <Swords className="w-4 h-4" style={{ color: GOLD }} />
              <span className="font-black text-sm uppercase" style={{ color: GOLD, ...T, letterSpacing: '0.06em' }}>
                View Full Tournament →
              </span>
            </Link>
          </>
        )}

        {/* ── top-3 podium ── */}
        {activeTab !== 'svs' && top3.length > 0 && (
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.12)' }}>
            {/* reorder: 2nd | 1st | 3rd */}
            <div className="flex items-end justify-center gap-4">
              {top3[1] && (
                <PodiumEntry rank={2} entry={top3[1]}
                  statLabel={label}
                  statValue={typeof getStat(top3[1]) === 'number' && getStat(top3[1]) >= 1000
                    ? `${(getStat(top3[1]) / 1000).toFixed(1)}k`
                    : getStat(top3[1])} />
              )}
              {top3[0] && (
                <PodiumEntry rank={1} entry={top3[0]}
                  statLabel={label}
                  statValue={typeof getStat(top3[0]) === 'number' && getStat(top3[0]) >= 1000
                    ? `${(getStat(top3[0]) / 1000).toFixed(1)}k`
                    : getStat(top3[0])} />
              )}
              {top3[2] && (
                <PodiumEntry rank={3} entry={top3[2]}
                  statLabel={label}
                  statValue={typeof getStat(top3[2]) === 'number' && getStat(top3[2]) >= 1000
                    ? `${(getStat(top3[2]) / 1000).toFixed(1)}k`
                    : getStat(top3[2])} />
              )}
            </div>
          </div>
        )}

        {/* ── rank list (4th+) ── */}
        {activeTab !== 'svs' && list.length === 0 ? (
          <div className="rounded-2xl flex items-center justify-center py-16"
            style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No data yet</p>
          </div>
        ) : activeTab === 'earnings' && (
          <div className="mb-4">
            <RealtimeLeaderboard creatorId={(currentUser && currentUser.id)} roomId={activeRoomId} />
          </div>
        )}
        {activeTab !== 'svs' && rest.length > 0 && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Trophy className="w-4 h-4" style={{ color: 'rgba(212,175,55,0.5)' }} />
              <p className="font-black text-[11px] uppercase" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
                Rankings
              </p>
            </div>
            <div className="p-2 space-y-1">
              {rest.map((entry, i) => (
                <RankRow
                  key={(entry.user && entry.user.id) || i}
                  rank={i + 4}
                  user={entry.user}
                  stat={getStat(entry)}
                  statLabel={label}
                  isCurrentUser={(entry.user && entry.user.id) === (currentUser && currentUser.id)}
                  isEven={i % 2 === 0}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Studio Series Leaderboard */}
      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div style={{ borderRadius: 14, border: '1px solid rgba(123,45,139,0.25)', background: 'rgba(8,11,24,0.95)', padding: '12px 14px', marginBottom: 16 }}>
          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(176,102,204,0.7)', marginBottom: 10 }}>🎬 Studio Series Top Fans</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
            {[
              { emoji: '👑', rank: '#1', name: 'DramaKing_X', pts: '4,200', color: '#7B2D8B', page: 'EpisodeSeries' },
              { emoji: '🎵', rank: '#1', name: 'BeatLover22', pts: '3,800', color: '#C9A84C', page: 'AIMusic' },
              { emoji: '🎙', rank: '#1', name: 'PodHeadz', pts: '2,900', color: '#00A8E8', page: 'PodcastStudio' },
            ].map(function(s) {
              return (
                <Link key={s.page} to={createPageUrl(s.page)} style={{ textDecoration: 'none' }}>
                  <div style={{ borderRadius: 10, padding: '10px 8px', background: s.color + '0f', border: '1px solid ' + s.color + '28', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{s.emoji}</div>
                    <p style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, color: s.color, marginBottom: 2 }}>{s.rank} FAN</p>
                    <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{s.name}</p>
                    <p style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, color: s.color, marginTop: 2 }}>{s.pts} pts</p>
                  </div>
                </Link>
              );
            })}
          </div>
          <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
            <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.65)' }}>🎥 Start your series — build your own fan leaderboard</p>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, color: '#B066CC' }}>Studio →</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Social Leaderboard (engagement-based) */}
      <div className="max-w-4xl mx-auto px-4 pb-8 mt-4">
        <SocialLeaderboard />
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
          <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
          <TipWidget roomId={roomId} hostId={(currentUser && currentUser.id)} currentUser={currentUser} />
          <TippingOverlay roomId={roomId} creatorId={(currentUser && currentUser.id)} isVisible={true} />
          <AnimatedGiftShop recipientId={(currentUser && currentUser.id)} roomId={roomId} onClose={() => {}} />
          <LeaderboardPanel roomId={roomId} />
          <ChallengeLeaderboard challengeId={activeChallengeId} />
          <OnlineUsersGrid compact maxVisible={10} />
          <ContentRecommendations />
        <MilestoneAlerts userId={(currentUser && currentUser.id)} roomId={roomId} />
        <SwanAIRecommendations roomId={roomId} currentLayout="default" viewerCount={0} />
          <CollaborationMatcher />
          <ShareToSocial content={{ url: window.location.href, title: 'Check out the SeeWhy LIVE leaderboard!' }} />
        </div>
        {/* Creator Studios */}
        <div style={{ margin: '0 0 16px', padding: 16, borderRadius: 16, border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(13,6,24,0.5)' }}>
          <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(176,102,204,0.7)', marginBottom: 12 }}>Creator Studios</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            {[
              { emoji: '🎬', label: 'Micro Drama', sub: 'Episode creator', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
              { emoji: '🎵', label: 'AI Music', sub: 'Beat & vocal studio', href: 'AIMusic', color: '#00A8E8' },
              { emoji: '🎙️', label: 'Podcast Studio', sub: 'AI-assisted pods', href: 'PodcastStudio', color: '#B066CC' },
            ].map(function(s) {
              return (
                <Link key={s.href} to={createPageUrl(s.href)} style={{ textDecoration: 'none' }}>
                  <div style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(123,45,139,0.18)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', marginTop: 2 }}>{s.sub}</div>
                  </div>
                </Link>
              );
            })}
          </div>
          <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
            <div style={{ borderRadius: 12, padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC', cursor: 'pointer' }}>
              🎬 Launch Episode Creator Studio →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}