import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, ResponsiveContainer } from 'recharts';
import SafeResponsiveContainer from '@/components/shared/SafeChart';
import { TrendingUp, TrendingDown, Users, MessageSquare, Zap, Heart, Eye, Download, RefreshCw, DollarSign } from 'lucide-react';

const G      = '#D4AF37';
const BG     = '#080B18';
const PANEL  = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

function exportCSV(chartData, latestAnalytics) {
  const rows = [
    ['Time', 'Viewers', 'Engagement%', 'Tips$', 'Messages'],
    ...chartData.map(r => [r.time, r.viewers, r.engagement, r.tips, r.messages]),
  ];
  if (latestAnalytics) {
    rows.push([]);
    rows.push(['Summary', '', '', '', '']);
    rows.push(['Total Unique', latestAnalytics.total_viewers || 0]);
    rows.push(['Avg Watch (min)', Math.round(latestAnalytics.average_watch_time || 0)]);
    rows.push(['New Followers', latestAnalytics.new_followers || 0]);
    rows.push(['Engagement%', Math.round(latestAnalytics.engagement_rate || 0)]);
  }
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stream-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Trend({ current, previous, unit = '' }) {
  if (previous == null || previous === 0) return null;
  const delta = ((current - previous) / previous) * 100;
  const up = delta >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const color = up ? '#6DBF7E' : '#C0392B';
  return (
    <span className="flex items-center gap-0.5 text-[9px] font-bold" style={{ color }}>
      <Icon className="w-3 h-3" />
      {Math.abs(delta).toFixed(0)}%{unit}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, unit, color, previous }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg"
      style={{ background: `${color}15`, border: `1px solid ${color}30` }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-4 h-4" style={{ color }} />
        <p className="text-[10px] text-white/60 uppercase font-bold flex-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          {label}
        </p>
        <Trend current={value} previous={previous} />
      </div>
      <p className="text-lg font-black" style={{ color }}>
        {unit === '$' && unit}{typeof value === 'number' ? value.toLocaleString() : '—'}{unit !== '$' && unit}
      </p>
    </motion.div>
  );
}

const CHART_TABS = ['viewers', 'chat', 'revenue'];

export default function StreamAnalyticsDashboard({ roomId }) {
  const [chartTab, setChartTab] = useState('viewers');
  const [lastRefresh, setLastRefresh] = useState(null);

  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['roomAnalytics', roomId],
    queryFn: () => base44.entities.RoomAnalytics.filter({ room_id: roomId }, '-timestamp', 24),
    enabled: !!roomId,
    refetchInterval: 30000,
    onSuccess: () => setLastRefresh(new Date()),
  });

  const { data: metrics } = useQuery({
    queryKey: ['performanceMetrics', roomId],
    queryFn: () => base44.entities.PerformanceMetric.filter({ entity_id: roomId }, '-timestamp', 50),
    enabled: !!roomId,
  });

  useEffect(() => {
    if (analytics) setLastRefresh(new Date());
  }, [analytics]);

  const sorted = [...(analytics || [])].reverse();
  const latestAnalytics  = sorted[sorted.length - 1];
  const prevAnalytics    = sorted[sorted.length - 2];

  const chartData = sorted.map(a => ({
    time:        new Date(a.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    viewers:     a.viewer_count       || 0,
    engagement:  a.engagement_rate    || 0,
    tips:        a.tips_received      || 0,
    messages:    a.chat_messages      || 0,
  }));

  const totalTips = sorted.reduce((s, a) => s + (a.tips_received || 0), 0);
  const avgWatch  = sorted.length ? Math.round(sorted.reduce((s, a) => s + (a.average_watch_time || 0), 0) / sorted.length) : 0;
  const retentionRate = latestAnalytics && latestAnalytics.peak_viewers
    ? Math.round(((latestAnalytics.viewer_count || 0) / latestAnalytics.peak_viewers) * 100)
    : null;

  const tooltipStyle = { contentStyle: { background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8 }, labelStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 } };

  return (
    <div className="space-y-4">
      {/* Header toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          📊 Stream Analytics
        </h2>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-[10px] text-white/30">
              {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => refetchAnalytics()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all hover:bg-white/10"
            style={{ color: G, border: `1px solid ${BORDER}` }}
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <button
            onClick={() => exportCSV(chartData, latestAnalytics)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all hover:bg-white/10"
            style={{ color: '#6DBF7E', border: '1px solid rgba(109,191,126,0.3)' }}
          >
            <Download className="w-3 h-3" /> CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <StatCard icon={Eye}          label="Viewers"    value={latestAnalytics?.viewer_count  || 0} unit=""  color={G}          previous={prevAnalytics?.viewer_count} />
        <StatCard icon={Users}        label="Peak"       value={latestAnalytics?.peak_viewers  || 0} unit=""  color="#C9A84C"     previous={prevAnalytics?.peak_viewers} />
        <StatCard icon={MessageSquare}label="Chat"       value={latestAnalytics?.chat_messages || 0} unit=""  color="#D4AF37"     previous={prevAnalytics?.chat_messages} />
        <StatCard icon={DollarSign}   label="Tips"       value={totalTips}                            unit="$" color="#D4854A"     previous={null} />
        <StatCard icon={Heart}        label="Engagement" value={latestAnalytics?.engagement_rate || 0} unit="%" color="#6DBF7E"   previous={prevAnalytics?.engagement_rate} />
      </div>

      {/* Chart tab switcher */}
      <div className="flex gap-1.5">
        {CHART_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setChartTab(tab)}
            className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-all"
            style={chartTab === tab
              ? { background: `${G}20`, color: G, border: `1px solid ${G}40` }
              : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4">
        {chartTab === 'viewers' && (
          <motion.div key="viewers" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-lg p-4" style={{ background: BG, border: `1px solid ${BORDER}` }}>
            <h3 className="text-xs font-bold mb-3" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
              📈 Viewer Trend
            </h3>
            <SafeResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="viewerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={G} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={G} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.08)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip {...tooltipStyle} formatter={v => [v.toLocaleString(), 'Viewers']} />
                <Area type="monotone" dataKey="viewers" stroke={G} strokeWidth={2} fill="url(#viewerGrad)" dot={false} />
              </AreaChart>
            </SafeResponsiveContainer>
          </motion.div>
        )}

        {chartTab === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-lg p-4" style={{ background: BG, border: `1px solid ${BORDER}` }}>
            <h3 className="text-xs font-bold mb-3" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
              💬 Chat Activity
            </h3>
            <SafeResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.08)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip {...tooltipStyle} formatter={v => [v, 'Messages']} />
                <Bar dataKey="messages" fill="#D4AF37" radius={[3, 3, 0, 0]} />
              </BarChart>
            </SafeResponsiveContainer>
          </motion.div>
        )}

        {chartTab === 'revenue' && (
          <motion.div key="revenue" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-lg p-4" style={{ background: BG, border: `1px solid ${BORDER}` }}>
            <h3 className="text-xs font-bold mb-3" style={{ color: '#D4854A', fontFamily: 'Barlow Condensed, sans-serif' }}>
              💸 Tips &amp; Revenue
            </h3>
            <SafeResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tipGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#D4854A" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#D4854A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,133,74,0.08)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} width={30} tickFormatter={v => `$${v}`} />
                <Tooltip {...tooltipStyle} formatter={v => [`$${v}`, 'Tips']} />
                <Area type="monotone" dataKey="tips" stroke="#D4854A" strokeWidth={2} fill="url(#tipGrad)" dot={false} />
              </AreaChart>
            </SafeResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Session Summary */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="p-4 rounded-lg"
        style={{ background: BG, border: `1px solid ${BORDER}` }}
      >
        <h3 className="text-xs font-bold mb-3" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          📋 Session Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
          {[
            { label: 'Total Unique',    value: (latestAnalytics?.total_viewers || 0).toLocaleString(), color: G },
            { label: 'Avg Watch',       value: `${avgWatch}m`,                                         color: '#C9A84C' },
            { label: 'New Followers',   value: (latestAnalytics?.new_followers || 0).toLocaleString(), color: '#6DBF7E' },
            { label: 'Engagement',      value: `${Math.round(latestAnalytics?.engagement_rate || 0)}%`,color: '#D4854A' },
            { label: 'Retention',       value: retentionRate != null ? `${retentionRate}%` : '—',       color: retentionRate >= 60 ? '#6DBF7E' : retentionRate >= 30 ? '#D4AF37' : '#C0392B' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }} className="p-2.5 rounded">
              <p className="text-white/50 mb-1">{label}</p>
              <p className="font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
