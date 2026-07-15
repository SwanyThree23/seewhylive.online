import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import RevenueDashboard from '../components/monetization/RevenueDashboard';
import StreamAnalyticsDashboard from '../components/streaming/StreamAnalyticsDashboard';
import ShareToSocial from '../components/social/ShareToSocial';
import LeaderboardPanel from '../components/live/LeaderboardPanel';
import AudienceInsights from '../components/dashboard/AudienceInsights';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import EarningsBreakdown from '../components/dashboard/EarningsBreakdown';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import TopTippers from '../components/monetization/TopTippers';
import {
  TrendingUp, Users, DollarSign, Radio, Eye, Activity,
  MessageSquare, Star, Crown, Zap
} from 'lucide-react';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const COLORS = [GOLD, CRIMSON, '#D4AF37', '#C9A84C', '#6DBF7E'];

const CHART_THEME = {
  cartesian: { stroke: 'rgba(255,255,255,0.06)' },
  tick: { fill: 'rgba(255,255,255,0.35)', fontSize: 10 },
  tooltip: { contentStyle: { background: 'rgba(8,11,24,0.97)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12 }, cursor: { fill: 'rgba(212,175,55,0.06)' } },
};

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 14, padding: '14px 16px' }}>
      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>{label}</p>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color }} />
        <span className="text-2xl font-black" style={{ color: '#fff', fontFamily: 'Orbitron, monospace' }}>{value}</span>
      </div>
      {sub && <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>}
    </div>
  );
}

function DarkCard({ title, desc, children }) {
  return (
    <div style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 20 }}>
      {(title || desc) && (
        <div className="mb-4">
          {title && <p className="font-black text-sm text-white" style={T}>{title}</p>}
          {desc && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

const TABS = ['revenue', 'rooms', 'engagement', 'platform'];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('revenue');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room_id');

  const { data: rooms = [] } = useQuery({
    queryKey: ['analyticsRooms', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id }),
    enabled: !!user,
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ['analyticsTransactions', user?.id],
    queryFn: () => base44.entities.Transaction.filter({ recipient_id: user?.id }, '-created_date', 100),
    enabled: !!user,
  });
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['analyticsSubscriptions', user?.id],
    queryFn: () => base44.entities.Subscription.filter({ creator_id: user?.id }),
    enabled: !!user,
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['analyticsMessages'],
    queryFn: () => base44.entities.Message.list('-created_date', 200),
  });
  const { data: allUsers = [] } = useQuery({
    queryKey: ['analyticsAllUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
    enabled: user?.role === 'admin',
  });

  const totalViews = rooms.reduce((s, r) => s + (r.viewer_count || 0), 0);
  const totalRevenue = transactions.reduce((s, t) => s + (t.creator_payout || 0) + (t.platform_cut || 0), 0);
  const avgViewers = rooms.length > 0 ? (totalViews / rooms.length).toFixed(0) : 0;
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const liveRooms = rooms.filter(r => r.status === 'live').length;

  const statusGroups = rooms.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  const statusPieData = Object.entries(statusGroups).map(([name, value]) => ({ name, value }));

  const revenueByMonth = transactions.reduce((acc, t) => {
    const month = new Date(t.created_date).toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + (t.creator_payout || 0) + (t.platform_cut || 0);
    return acc;
  }, {});
  const revenueChartData = Object.entries(revenueByMonth).slice(-6).map(([month, revenue]) => ({ month, revenue }));

  const categoryGroups = rooms.reduce((acc, r) => {
    const cat = r.tags?.[0] || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(categoryGroups).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));

  const topRooms = [...rooms].sort((a, b) => (b.viewer_count || 0) - (a.viewer_count || 0)).slice(0, 8).map(r => ({ name: r.title.slice(0, 20), viewers: r.viewer_count || 0 }));

  const userGrowth = allUsers.reduce((acc, u) => {
    const month = new Date(u.created_date).toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  const userGrowthData = Object.entries(userGrowth).slice(-6).map(([month, count]) => ({ month, count }));

  const isAdmin = user?.role === 'admin';
  const visibleTabs = isAdmin ? TABS : TABS.filter(t => t !== 'platform');

  const emptyState = (msg) => (
    <div className="h-48 flex items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>{msg}</div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center justify-between gap-3 flex-wrap"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5" style={{ color: GOLD }} />
          <div>
            <h1 className="text-xl font-black text-white leading-none" style={T}>Analytics Dashboard</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Platform performance and creator insights</p>
          </div>
        </div>
        {isAdmin && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', ...T }}>
            Admin View
          </span>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Views" value={totalViews} icon={Eye} color="#D4AF37" />
          <StatCard label="Avg Viewers" value={avgViewers} icon={Users} color="#D4AF37" />
          <StatCard label="Revenue" value={`$${totalRevenue.toFixed(0)}`} icon={DollarSign} color="#6DBF7E" />
          <StatCard label="Rooms" value={rooms.length} icon={Radio} color={GOLD} />
          <StatCard label="Live Now" value={liveRooms} icon={Zap} color="#C0392B" sub="currently live" />
          <StatCard label="Subscribers" value={activeSubscriptions} icon={Star} color={GOLD} sub="active" />
        </div>

        {/* Tab bar */}
        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {visibleTabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 text-[11px] font-black uppercase border-b-2 transition-all capitalize"
              style={{ ...T, color: activeTab === tab ? GOLD : 'rgba(255,255,255,0.35)', borderBottomColor: activeTab === tab ? GOLD : 'transparent', background: activeTab === tab ? 'rgba(212,175,55,0.05)' : 'transparent' }}>
              {tab}
            </button>
          ))}
        </div>

        {/* REVENUE */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DarkCard title="Revenue Over Time" desc="Monthly earnings from tips & subscriptions">
                {revenueChartData.length === 0 ? emptyState('No revenue data yet') : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" {...CHART_THEME.cartesian} />
                      <XAxis dataKey="month" tick={CHART_THEME.tick} />
                      <YAxis tick={CHART_THEME.tick} tickFormatter={v => `$${v}`} />
                      <Tooltip {...CHART_THEME.tooltip} formatter={v => [`$${v.toFixed(2)}`, 'Revenue']} />
                      <Line type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2} dot={{ r: 4, fill: GOLD }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </DarkCard>

              <DarkCard title="Recent Transactions" desc={`Latest ${Math.min(transactions.length, 8)} payments received`}>
                {transactions.length === 0 ? emptyState('No transactions yet') : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {transactions.slice(0, 12).map(t => (
                      <div key={t.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <div>
                          <p className="text-xs font-black text-white" style={T}>{t.sender_name || 'Anonymous'}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{new Date(t.created_date).toLocaleDateString()}</p>
                        </div>
                        <span className="text-sm font-black" style={{ color: '#6DBF7E', fontFamily: 'Orbitron, monospace' }}>+${(t.amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </DarkCard>
            </div>

            <DarkCard title="Subscription Summary">
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { status: 'active', color: '#6DBF7E', bg: 'rgba(109,191,126,0.06)' },
                  { status: 'cancelled', color: '#C0392B', bg: 'rgba(192,57,43,0.06)' },
                  { status: 'expired', color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.03)' },
                ].map(({ status, color, bg }) => {
                  const count = subscriptions.filter(s => s.status === status).length;
                  const revenue = subscriptions.filter(s => s.status === status).reduce((s, sub) => s + (sub.price || 0), 0);
                  return (
                    <div key={status} className="rounded-xl p-4" style={{ background: bg, border: `1px solid ${color}22` }}>
                      <p className="text-2xl font-black" style={{ color, fontFamily: 'Orbitron, monospace' }}>{count}</p>
                      <p className="text-xs font-black uppercase mt-1 capitalize" style={{ color, ...T }}>{status}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>${revenue.toFixed(0)}/mo</p>
                    </div>
                  );
                })}
              </div>
            </DarkCard>
          </div>
        )}

        {/* ROOMS */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DarkCard title="Top Rooms by Viewers">
                {topRooms.length === 0 ? emptyState('No rooms yet') : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={topRooms} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} {...CHART_THEME.cartesian} />
                      <XAxis type="number" tick={CHART_THEME.tick} />
                      <YAxis dataKey="name" type="category" tick={CHART_THEME.tick} width={100} />
                      <Tooltip {...CHART_THEME.tooltip} />
                      <Bar dataKey="viewers" fill={GOLD} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </DarkCard>

              <DarkCard title="Room Status Breakdown">
                {statusPieData.length === 0 ? emptyState('No data') : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusPieData} dataKey="value" nameKey="name" outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false} style={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}>
                        {statusPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip {...CHART_THEME.tooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </DarkCard>
            </div>

            <DarkCard title="All Rooms">
              {rooms.length === 0 ? emptyState('No rooms yet') : (
                <div className="space-y-2">
                  {rooms.slice(0, 15).map(room => (
                    <div key={room.id} className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <p className="font-black text-sm text-white" style={T}>{room.title}</p>
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{new Date(room.created_date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Orbitron, monospace' }}>{room.viewer_count || 0}</span>
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase" style={{ ...T,
                          background: room.status === 'live' ? 'rgba(192,57,43,0.15)' : room.status === 'ended' ? 'rgba(255,255,255,0.06)' : 'rgba(212,175,55,0.1)',
                          border: `1px solid ${room.status === 'live' ? 'rgba(192,57,43,0.4)' : room.status === 'ended' ? 'rgba(255,255,255,0.1)' : 'rgba(212,175,55,0.3)'}`,
                          color: room.status === 'live' ? '#C0392B' : room.status === 'ended' ? 'rgba(255,255,255,0.4)' : '#D4AF37',
                        }}>{room.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DarkCard>
          </div>
        )}

        {/* ENGAGEMENT */}
        {activeTab === 'engagement' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DarkCard title="Chat Activity" desc={`Recent ${messages.length} messages across all rooms`}>
              <div className="space-y-2">
                {[
                  { label: 'Total Messages', value: messages.length },
                  { label: 'Unique Chatters', value: new Set(messages.map(m => m.user_id)).size },
                  { label: 'Avg Message Length', value: `${messages.length > 0 ? Math.round(messages.reduce((s, m) => s + (m.content?.length || 0), 0) / messages.length) : 0} chars` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', ...T }}>{label}</span>
                    <span className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{value}</span>
                  </div>
                ))}
              </div>
            </DarkCard>

            <DarkCard title="Category Performance" desc="Rooms by category">
              {categoryData.length === 0 ? emptyState('No data yet') : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} {...CHART_THEME.cartesian} />
                    <XAxis dataKey="name" tick={CHART_THEME.tick} />
                    <YAxis tick={CHART_THEME.tick} />
                    <Tooltip {...CHART_THEME.tooltip} />
                    <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </DarkCard>
          </div>
        )}

        {/* PLATFORM — admin only */}
        {activeTab === 'platform' && isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DarkCard title="User Growth" desc="New registrations per month">
              {userGrowthData.length === 0 ? emptyState('No data') : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" {...CHART_THEME.cartesian} />
                    <XAxis dataKey="month" tick={CHART_THEME.tick} />
                    <YAxis tick={CHART_THEME.tick} />
                    <Tooltip {...CHART_THEME.tooltip} />
                    <Line type="monotone" dataKey="count" stroke="#6DBF7E" strokeWidth={2} dot={{ r: 4, fill: '#6DBF7E' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </DarkCard>

            <DarkCard title="Platform Totals">
              <div className="space-y-2">
                {[
                  { label: 'Total Users', value: allUsers.length, icon: Users },
                  { label: 'Admin Users', value: allUsers.filter(u => u.role === 'admin').length, icon: Crown },
                  { label: 'Total Rooms', value: rooms.length, icon: Radio },
                  { label: 'Total Messages', value: messages.length, icon: MessageSquare },
                  { label: 'Total Transactions', value: transactions.length, icon: DollarSign },
                  { label: 'Platform Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: TrendingUp },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)', ...T }}>
                      <Icon className="w-4 h-4" style={{ color: 'rgba(212,175,55,0.5)' }} />
                      {label}
                    </div>
                    <span className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{value}</span>
                  </div>
                ))}
              </div>
            </DarkCard>
          </div>
        )}

        {/* Revenue + Stream dashboards */}
        <div className="mt-4 space-y-4">
          <RevenueDashboard />
          <StreamAnalyticsDashboard />
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <LeaderboardPanel roomId={rooms[0]?.id || null} />
          <ShareToSocial />
          <AudienceInsights />
          <StreamerMonetizationCenter userId={user?.id} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16, paddingBottom: 24 }}>
          {[
            { label: '📈 Advanced Analytics', href: 'AdvancedAnalytics' },
            { label: '📊 Stream Analytics',  href: 'StreamAnalytics'   },
            { label: '💰 Monetization',      href: 'Monetization'      },
            { label: '📤 Export Data',       href: 'DataExport'        },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span className="font-black uppercase text-[10px] px-3 py-1.5 rounded-xl" style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', display: 'block', cursor: 'pointer' }}>{item.label}</span>
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
          <OnlineUsersGrid compact maxVisible={8} />
          <CollaborationMatcher />
          <ContentRecommendations />
          <EarningsBreakdown userId={user?.id} />
        </div>
      </div>
    </div>
  );
}