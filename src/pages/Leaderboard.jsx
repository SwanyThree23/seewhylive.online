import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Crown, TrendingUp, Star, Zap, DollarSign, Users, Trophy, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const RANK_BG = [
  'linear-gradient(135deg, #D4AF37, #a07d20)',
  'linear-gradient(135deg, #9ca3af, #6b7280)',
  'linear-gradient(135deg, #cd7f32, #92400e)',
];
const RANK_ICONS = ['🥇', '🥈', '🥉'];

function RankRow({ rank, user, stat, statLabel, isCurrentUser }) {
  const top3 = rank <= 3;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl transition-all"
      style={{
        background: isCurrentUser ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isCurrentUser ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)'}`,
      }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
        style={{ background: top3 ? RANK_BG[rank - 1] : 'rgba(255,255,255,0.08)', color: top3 ? '#000' : 'rgba(255,255,255,0.4)', ...T }}>
        {top3 ? RANK_ICONS[rank - 1] : rank}
      </div>
      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #800020, #D4AF37)' }}>
        {user.avatar_url
          ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-sm font-black text-black">{user.full_name?.charAt(0) || '?'}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm text-white truncate flex items-center gap-1" style={T}>
          {user.full_name || 'Anonymous'}
          {isCurrentUser && (
            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(212,175,55,0.15)', color: GOLD, border: '1px solid rgba(212,175,55,0.3)', ...T }}>
              You
            </span>
          )}
        </p>
        <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{user.email}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>
          {typeof stat === 'number' && stat >= 1000 ? `${(stat / 1000).toFixed(1)}k` : stat}
        </p>
        <p className="text-[9px] uppercase" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{statLabel}</p>
      </div>
    </div>
  );
}

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

  return (
    <div className="min-h-screen pb-8" style={{ background: '#080B18' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 px-4 py-3" style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #800020, #D4AF37)' }}>
            <Trophy className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="font-black text-lg text-white leading-none" style={T}>Leaderboard</h1>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Top creators & streamers on SeeWhy LIVE</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-4">
        {/* Tab pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {[
            { id: 'earnings', label: 'Top Earners', icon: DollarSign },
            { id: 'viewers',  label: 'Most Viewed', icon: Users },
            { id: 'subscribers', label: 'Subscribers', icon: Star },
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

        {/* Earnings */}
        {activeTab === 'earnings' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <DollarSign className="w-4 h-4" style={{ color: GOLD }} />
              <p className="font-black text-[11px] uppercase" style={{ color: 'rgba(255,255,255,0.5)', ...T }}>Top Earning Creators</p>
            </div>
            <div className="p-2 space-y-1">
              {topEarners.length === 0
                ? <p className="text-sm text-center py-10" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No earnings data yet</p>
                : topEarners.map((entry, i) => (
                    <RankRow key={entry.user.id} rank={i + 1} user={entry.user}
                      stat={`$${entry.revenue.toFixed(0)}`} statLabel="earned"
                      isCurrentUser={entry.user.id === currentUser?.id} />
                  ))}
            </div>
          </div>
        )}

        {/* Viewers */}
        {activeTab === 'viewers' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Radio className="w-4 h-4" style={{ color: '#FF1564' }} />
              <p className="font-black text-[11px] uppercase" style={{ color: 'rgba(255,255,255,0.5)', ...T }}>Most Viewed Streams</p>
            </div>
            <div className="p-2 space-y-1">
              {topByViewers.length === 0
                ? <p className="text-sm text-center py-10" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No stream data yet</p>
                : topByViewers.map((entry, i) => (
                    <RankRow key={`${entry.user.id}-${i}`} rank={i + 1} user={entry.user}
                      stat={entry.viewers} statLabel="viewers"
                      isCurrentUser={entry.user.id === currentUser?.id} />
                  ))}
            </div>
          </div>
        )}

        {/* Subscribers */}
        {activeTab === 'subscribers' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Star className="w-4 h-4" style={{ color: '#D4AF37' }} />
              <p className="font-black text-[11px] uppercase" style={{ color: 'rgba(255,255,255,0.5)', ...T }}>Most Subscribed Creators</p>
            </div>
            <div className="p-2 space-y-1">
              {topBySubscribers.length === 0
                ? <p className="text-sm text-center py-10" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No subscriber data yet</p>
                : topBySubscribers.map((entry, i) => (
                    <RankRow key={entry.user.id} rank={i + 1} user={entry.user}
                      stat={entry.subscribers} statLabel="subscribers"
                      isCurrentUser={entry.user.id === currentUser?.id} />
                  ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}