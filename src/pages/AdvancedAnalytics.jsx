import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, DollarSign, Radio, Zap, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import StreamAnalyticsDashboard from '../components/live/StreamAnalyticsDashboard';
import AutomatedHighlightReels from '../components/streaming/AutomatedHighlightReels';
import AutomatedClipGenerator from '../components/streaming/AutomatedClipGenerator';
import PerformanceDashboard from '../components/streaming/PerformanceDashboard';
import BroadcastAnalyticsDashboard from '../components/streaming/BroadcastAnalyticsDashboard';
import StreamHealthDashboard from '../components/streaming/StreamHealthDashboard';
import VirtualGoodsStore from '../components/monetization/VirtualGoodsStore';
import PayPerViewManager from '../components/monetization/PayPerViewManager';
import StreamerGoalsWidget from '../components/monetization/StreamerGoalsWidget';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ShareToSocial from '../components/social/ShareToSocial';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TOOLTIP_STYLE = {
  contentStyle: { background: 'rgba(8,11,24,0.97)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12 },
  cursor: { fill: 'rgba(212,175,55,0.06)' },
};
const TICK = { fill: 'rgba(255,255,255,0.35)', fontSize: 10 };
const GRID = { stroke: 'rgba(255,255,255,0.06)' };

const TABS = ['revenue', 'engagement', 'performance', 'retention', 'insights'];

export default function AdvancedAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('revenue');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: metrics = [] } = useQuery({
    queryKey: ['performanceMetrics'],
    queryFn: () => base44.entities.PerformanceMetric.list('-timestamp', 1000),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['allRooms'],
    queryFn: () => base44.entities.Room.list('-created_date', 100),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['allTransactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 500),
  });

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const activeRooms = rooms.filter(r => r.status === 'live').length;
  const totalViewers = rooms.reduce((sum, r) => sum + (r.viewer_count || 0), 0);

  const engagementData = metrics.filter(m => m.metric_type === 'user_engagement').slice(0, 30).reverse()
    .map(m => ({ date: new Date(m.timestamp).toLocaleDateString(), value: m.value }));

  const revenueData = transactions.reduce((acc, t) => {
    const date = new Date(t.created_date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + t.amount;
    return acc;
  }, {});
  const revenueChartData = Object.entries(revenueData).slice(-14).map(([date, amount]) => ({ date, amount }));

  const roomPerformance = rooms.filter(r => r.viewer_count > 0).slice(0, 10)
    .map(r => ({ title: r.title.substring(0, 20), viewers: r.viewer_count }));

  const tabLabels = { revenue: 'Revenue Trends', engagement: 'Engagement', performance: 'Room Performance', retention: 'Viewer Retention', insights: 'AI Insights' };

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <TrendingUp className="w-5 h-5" style={{ color: GOLD }} />
        <h1 className="text-xl font-black text-white" style={T}>Advanced Analytics</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 space-y-5">
        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: '#6DBF7E' },
            { label: 'Live Rooms', value: activeRooms, icon: Radio, color: '#C0392B' },
            { label: 'Total Viewers', value: totalViewers, icon: Users, color: '#D4AF37' },
            { label: 'Avg. Engagement', value: `${metrics.length > 0 ? (metrics.reduce((a, m) => a + m.value, 0) / metrics.length).toFixed(1) : 0}%`, icon: Zap, color: GOLD },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-4"
              style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-[10px] font-black uppercase" style={{ ...T, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
              </div>
              <p className="text-2xl font-black" style={{ fontFamily: 'Orbitron, monospace', color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className="px-4 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all"
              style={{ ...T, color: activeTab === t ? GOLD : 'rgba(255,255,255,0.35)', borderBottomColor: activeTab === t ? GOLD : 'transparent', background: 'transparent' }}>
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {/* Revenue */}
        {activeTab === 'revenue' && (
          <div className="rounded-2xl p-5" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <p className="font-black text-sm text-white mb-1" style={T}>Revenue Over Time</p>
            <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Last 14 days</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" {...GRID} />
                <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="amount" stroke={GOLD} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Engagement */}
        {activeTab === 'engagement' && (
          <div className="rounded-2xl p-5" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <p className="font-black text-sm text-white mb-1" style={T}>User Engagement Trend</p>
            <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Daily engagement metrics</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" {...GRID} />
                <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Performance */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="font-black text-sm text-white mb-1" style={T}>Top Performing Rooms</p>
              <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>By viewer count</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roomPerformance}>
                  <CartesianGrid strokeDasharray="3 3" {...GRID} />
                  <XAxis dataKey="title" tick={TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="viewers" fill={CRIMSON} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {rooms.find(r => r.status === 'live') && (
              <StreamAnalyticsDashboard roomId={rooms.find(r => r.status === 'live').id} />
            )}
            <PerformanceDashboard
              roomId={rooms.find(r => r.status === 'live')?.id || null}
              sessionId={rooms.find(r => r.status === 'live')?.id || null}
            />
            {rooms.find(r => r.status === 'live') && (
              <>
                <AutomatedClipGenerator
                  streamSession={{ id: rooms.find(r => r.status === 'live').id }}
                  isLive
                />
                <AutomatedHighlightReels
                  streamSession={{ id: rooms.find(r => r.status === 'live').id }}
                />
              </>
            )}
          </div>
        )}

        {/* Retention Curve */}
        {activeTab === 'retention' && (
          <div className="rounded-2xl p-5" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <p className="font-black text-sm text-white mb-1" style={T}>Viewer Retention</p>
            <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Average watch time over stream duration</p>
            <SwanAIRecommendations roomId={rooms.find(r => r.status === 'live')?.id || null} />
          </div>
        )}

        {/* Insights */}
        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4" style={{ color: GOLD }} />
                <p className="font-black text-sm text-white" style={T}>Growth Opportunities</p>
              </div>
              <div className="space-y-3">
                {[
                  { title: 'Optimize Stream Times', desc: 'Peak viewership at 7–9 PM', color: '#D4AF37' },
                  { title: 'Increase Monetization', desc: '15% conversion rate on tips', color: '#6DBF7E' },
                  { title: 'Community Engagement', desc: 'Chat activity up 23%', color: '#D4AF37' },
                ].map(({ title, desc, color }) => (
                  <div key={title} className="p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.06)` }}>
                    <p className="font-black text-xs" style={{ color, ...T }}>{title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="font-black text-sm text-white mb-4" style={T}>Platform Health</p>
              <div className="space-y-4">
                {[
                  { label: 'System Performance', value: 95, text: 'Excellent', color: '#6DBF7E' },
                  { label: 'User Satisfaction', value: 88, text: 'High', color: '#D4AF37' },
                  { label: 'Content Quality', value: 82, text: 'Good', color: '#D4AF37' },
                ].map(({ label, value, text, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color: 'rgba(255,255,255,0.5)', ...T }}>{label}</span>
                      <span className="font-black" style={{ color, ...T }}>{text}</span>
                    </div>
                    <div className="rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <BroadcastAnalyticsDashboard streamSession={rooms.find(r => r.status === 'live') || null} isLive={activeRooms > 0} />
          <StreamHealthDashboard isLive={activeRooms > 0} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '16px 0 24px' }}>
          {[
            { label: '📊 Analytics',          href: 'Analytics'       },
            { label: '📡 Stream Analytics',   href: 'StreamAnalytics' },
            { label: '📤 Export Data',        href: 'DataExport'      },
            { label: '💰 Monetization',       href: 'Monetization'    },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, cursor: 'pointer' }}>{item.label}</span>
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
          <StreamerGoalsWidget userId={user?.id} />
          <PayPerViewManager userId={user?.id} />
          <VirtualGoodsStore creatorId={user?.id} userId={user?.id} />
          <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <OnlineUsersGrid compact maxVisible={10} />
            <ContentRecommendations />
            <CollaborationMatcher />
            <ShareToSocial url={window.location.href} title="SeeWhy LIVE" />
          </div>
        </div>
      </div>
    </div>
  );
}
