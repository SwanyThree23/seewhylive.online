import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Crown, TrendingUp, Star, Zap, DollarSign, Users, Trophy, Radio, Swords } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
const SVS_STATES = [
  { id: 'wa', name: 'Washington', abbr: 'WA', color: '#1565C0', w: 4, l: 1, pts: 1820 },
  { id: 'fl', name: 'Florida',    abbr: 'FL', color: '#E65100', w: 3, l: 1, pts: 1740 },
  { id: 'ca', name: 'California', abbr: 'CA', color: '#1B5E20', w: 3, l: 2, pts: 1650 },
  { id: 'tx', name: 'Texas',      abbr: 'TX', color: '#B71C1C', w: 3, l: 2, pts: 1610 },
  { id: 'ny', name: 'New York',   abbr: 'NY', color: '#4A148C', w: 2, l: 3, pts: 1380 },
  { id: 'ga', name: 'Georgia',    abbr: 'GA', color: '#BF360C', w: 1, l: 4, pts: 1120 },
];

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const SILVER  = '#9ca3af';
const BRONZE  = '#CD7F32';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };
const OCT     = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

const RANK_COLORS = [GOLD, SILVER, BRONZE];
const RANK_GLOWS  = ['rgba(212,175,55,0.35)', 'rgba(156,163,175,0.2)', 'rgba(205,127,50,0.2)'];
const RANK_LABELS = ['#1', '#2', '#3'];

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
          background: `linear-gradient(145deg, ${CRIMSON}99, #0d0618)`,
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
  const color  = RANK_COLORS[rank - 1];
  const glow   = RANK_GLOWS[rank - 1];
  const isFirst = rank === 1;
  const size   = isFirst ? 72 : 60;
  const initials = entry.user?.full_name?.charAt(0)?.toUpperCase() || '?';

  // Heights: 1st tallest, 3rd medium, 2nd shortest
  const podiumHeights = { 1: 'pt-0', 2: 'pt-8', 3: 'pt-4' };

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
      <OctAvatar size={size} src={entry.user?.avatar_url} initials={initials} rankColor={color} glow={isFirst} />

      {/* name */}
      <p className="font-black text-[11px] text-white text-center truncate max-w-[96px]" style={T}>
        {entry.user?.full_name || 'Anonymous'}
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
  const initials = user?.full_name?.charAt(0)?.toUpperCase() || '?';
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl transition-all"
      style={{
        background: isCurrentUser
          ? 'rgba(212,175,55,0.08)'
          : isEven ? 'rgba(17,8,34,0.6)' : 'rgba(13,6,24,0.4)',
        border: `1px solid ${isCurrentUser ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.04)'}`,
      }}>
      {/* rank number */}
      <div className="w-8 text-center shrink-0">
        <span className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>
          {rank}
        </span>
      </div>

      {/* oct avatar (40px) */}
      <OctAvatar size={40} src={user?.avatar_url} initials={initials} rankColor="rgba(212,175,55,0.6)" />

      {/* name + subtitle */}
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm text-white truncate flex items-center gap-1" style={T}>
          {user?.full_name || 'Anonymous'}
          {isCurrentUser && (
            <span className="text-[11px] font-black uppercase px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(212,175,55,0.15)', color: GOLD, border: '1px solid rgba(212,175,55,0.3)', ...T }}>
              You
            </span>
          )}
        </p>
        <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{user?.email}</p>
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
  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: creators = [] } = useQuery({
    queryKey: ['leaderboardCreators'],
    queryFn: () => base44.entities.CreatorProfile.list('-subscriber_count', 50),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['leaderboardRooms'],
    queryFn: () => base44.entities.Room.list('-viewer_count', 50),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['leaderboardTransactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 500),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['leaderboardUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
  });

  // Revenue leaderboard: aggregate by creator
  const revenueByCreator = transactions.reduce((acc, t) => {
    if (!t.to_user_id) return acc;
    acc[t.to_user_id] = (acc[t.to_user_id] || 0) + (t.amount || 0);
    return acc;
  }, {});

  const topEarners = Object.entries(revenueByCreator)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([userId, revenue]) => {
      const user = allUsers.find(u => u.id === userId);
      return { user: user || { full_name: 'Creator', email: '', id: userId }, revenue };
    })
    .filter(e => e.user);

  const topByViewers = [...rooms]
    .sort((a, b) => (b.viewer_count || 0) - (a.viewer_count || 0))
    .slice(0, 20)
    .map(room => {
      const user = allUsers.find(u => u.id === room.host_id);
      return { user: user || { full_name: room.host_id || 'Creator', email: '', id: room.host_id }, viewers: room.viewer_count || 0, room };
    })
    .filter(e => e.user);

  const topBySubscribers = creators.slice(0, 20).map(profile => {
    const user = allUsers.find(u => u.id === profile.user_id);
    return { user: user || { full_name: profile.display_name, email: '', id: profile.user_id }, subscribers: profile.subscriber_count || 0 };
  }).filter(e => e.user);

  const [activeTab, setActiveTab] = useState('earnings');
  const [period, setPeriod] = useState('all');

  // Select list + stat accessors by active tab
  const tabData = {
    earnings:    { list: topEarners,      getStat: e => `$${e.revenue.toFixed(0)}`,   label: 'earned' },
    viewers:     { list: topByViewers,    getStat: e => e.viewers,                    label: 'viewers' },
    subscribers: { list: topBySubscribers, getStat: e => e.subscribers,               label: 'subs' },
  };
  const { list, getStat, label } = tabData[activeTab];
  const top3    = list.slice(0, 3);
  const rest    = list.slice(3);

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
              style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.12)' }}>
              <div className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Swords className="w-4 h-4" style={{ color: GOLD }} />
                <p className="font-black text-[11px] uppercase" style={{ color: 'rgba(255,255,255,0.5)', ...T }}>
                  State vs State · Season 1 Standings
                </p>
              </div>
              <div className="p-3 space-y-2">
                {SVS_STATES.map((s, i) => (
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
            style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.12)' }}>
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
            style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No data yet</p>
          </div>
        ) : activeTab !== 'svs' && rest.length > 0 && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
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
                  key={entry.user?.id || i}
                  rank={i + 4}
                  user={entry.user}
                  stat={getStat(entry)}
                  statLabel={label}
                  isCurrentUser={entry.user?.id === currentUser?.id}
                  isEven={i % 2 === 0}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="leaderboard" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={user?.id} roomId={null} currentUser={user} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}
