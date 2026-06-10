import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, DollarSign, Radio, Zap, Target, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import StreamAnalyticsDashboard from '../components/live/StreamAnalyticsDashboard';
import AutomatedHighlightReels from '../components/streaming/AutomatedHighlightReels';
import AutomatedClipGenerator from '../components/streaming/AutomatedClipGenerator';
import PerformanceDashboard from '../components/streaming/PerformanceDashboard';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TOOLTIP_STYLE = {
  contentStyle: { background: 'rgba(13,6,24,0.97)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12 },
  cursor: { fill: 'rgba(212,175,55,0.06)' },
};
const TICK = { fill: 'rgba(255,255,255,0.35)', fontSize: 10 };
const GRID = { stroke: 'rgba(255,255,255,0.06)' };

const TABS = ['revenue', 'engagement', 'performance', 'insights', 'retention', 'schedule'];

export default function AdvancedAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('revenue');

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

  const tabLabels = { revenue: 'Revenue Trends', engagement: 'Engagement', performance: 'Room Performance', insights: 'AI Insights', retention: 'Retention Curve', schedule: 'Best Stream Time' };

  // Retention Curve data
  const retentionData = metrics.filter(m => m.metric_type === 'viewer_retention').length > 0
    ? metrics.filter(m => m.metric_type === 'viewer_retention').slice(0, 10).map((m, i) => ({ minute: i * 5, retention: m.value }))
    : Array.from({ length: 12 }, (_, i) => ({ minute: i * 5, retention: Math.max(20, 100 - i * 6 - Math.random() * 5) }));

  // Best Stream Time heatmap data
  const heatmap = {};
  metrics.forEach(m => {
    const d = new Date(m.timestamp);
    const key = `${d.getDay()}-${d.getHours()}`;
    if (!heatmap[key]) heatmap[key] = { total: 0, count: 0 };
    heatmap[key].total += m.value;
    heatmap[key].count++;
  });
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const HOURS = [0, 6, 12, 15, 18, 20, 22];

  const heatmapValues = DAYS.flatMap((_, di) => HOURS.map((h) => {
    const cell = heatmap[`${di}-${h}`];
    return cell ? cell.total / cell.count : 0;
  }));
  const heatmapMin = Math.min(...heatmapValues);
  const heatmapMax = Math.max(...heatmapValues) || 1;
  let bestKey = null, bestVal = -Infinity;
  DAYS.forEach((_, di) => HOURS.forEach((h) => {
    const cell = heatmap[`${di}-${h}`];
    const val = cell ? cell.total / cell.count : 0;
    if (val > bestVal) { bestVal = val; bestKey = `${di}-${h}`; }
  }));

  // CSV Export
  function exportCSV() {
    const headers = ['Date', 'Amount', 'Type', 'Description'];
    const rows = transactions.map(t => [
      new Date(t.created_date).toLocaleDateString(),
      t.amount,
      t.transaction_type || 'payment',
      (t.description || '').replace(/,/g, ';'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'analytics.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <TrendingUp className="w-5 h-5" style={{ color: GOLD }} />
        <h1 className="text-xl font-black text-white" style={T}>Advanced Analytics</h1>
        <div className="ml-auto">
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase"
            style={{ ...T, border: `1px solid ${GOLD}`, color: GOLD, background: 'rgba(212,175,55,0.06)' }}>
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 space-y-5">
        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: '#00ff88' },
            { label: 'Live Rooms', value: activeRooms, icon: Radio, color: '#C0392B' },
            { label: 'Total Viewers', value: totalViewers, icon: Users, color: '#D4AF37' },
            { label: 'Avg. Engagement', value: `${metrics.length > 0 ? (metrics.reduce((a, m) => a + m.value, 0) / metrics.length).toFixed(1) : 0}%`, icon: Zap, color: GOLD },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-4"
              style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
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
          <div className="rounded-2xl p-5" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
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
          <div className="rounded-2xl p-5" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
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
            <div className="rounded-2xl p-5" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
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
            {/* Live stream analytics panel */}
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
          <div className="rounded-2xl p-5" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <p className="font-black text-sm text-white mb-1" style={T}>Viewer Retention Curve</p>
            <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Drop-off over stream duration</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" {...GRID} />
                <XAxis dataKey="minute" tick={TICK} axisLine={false} tickLine={false} label={{ value: 'Minutes', position: 'insideBottom', offset: -2, fill: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif' }} />
                <YAxis domain={[0, 100]} unit="%" tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="retention" stroke="#D4AF37" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Best Stream Time */}
        {activeTab === 'schedule' && (
          <div className="rounded-2xl p-5" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <p className="font-black text-sm text-white mb-1" style={T}>Best Stream Time</p>
            <p className="text-[11px] mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>Predicted engagement by day and hour</p>
            <div className="overflow-x-auto">
              <table className="border-separate" style={{ borderSpacing: 4 }}>
                <thead>
                  <tr>
                    <th className="w-10" />
                    {HOURS.map(h => (
                      <th key={h} className="text-center text-[9px] font-black uppercase pb-1"
                        style={{ ...T, color: 'rgba(255,255,255,0.35)', minWidth: 36 }}>
                        {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day, di) => (
                    <tr key={day}>
                      <td className="text-[9px] font-black uppercase pr-2 text-right"
                        style={{ ...T, color: 'rgba(255,255,255,0.35)' }}>{day}</td>
                      {HOURS.map(h => {
                        const key = `${di}-${h}`;
                        const cell = heatmap[key];
                        const val = cell ? cell.total / cell.count : 0;
                        const norm = heatmapMax > heatmapMin ? (val - heatmapMin) / (heatmapMax - heatmapMin) : 0;
                        const opacity = 0.05 + norm * 0.35;
                        const isBest = key === bestKey;
                        return (
                          <td key={h} className="relative">
                            <div className="rounded-lg flex items-center justify-center"
                              style={{
                                width: 36, height: 36,
                                background: `rgba(212,175,55,${opacity})`,
                                border: isBest ? `2px solid ${GOLD}` : '1px solid rgba(212,175,55,0.08)',
                              }}>
                              {isBest && (
                                <span className="text-[8px] font-black text-center leading-tight"
                                  style={{ ...T, color: GOLD }}>⭐<br/>Best</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {/* AI-powered recommendations (live room context if one is active) */}
            <SwanAIRecommendations
              roomId={rooms.find(r => r.status === 'live')?.id || null}
              currentLayout="analytics"
              viewerCount={activeRooms}
            />
          </div>
        )}
      </div>
    </div>
  );
}
