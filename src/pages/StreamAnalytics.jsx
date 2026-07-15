import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import StreamHealthDashboard from '../components/streaming/StreamHealthDashboard';
import BroadcastAnalyticsDashboard from '../components/streaming/BroadcastAnalyticsDashboard';
import PerformanceDashboard from '../components/streaming/PerformanceDashboard';
import AudienceInsights from '../components/dashboard/AudienceInsights';
import StreamerGoalsWidget from '../components/monetization/StreamerGoalsWidget';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ShareToSocial from '../components/social/ShareToSocial';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Users, DollarSign, MessageSquare, Download, BarChart2 } from 'lucide-react';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';

const GOLD = '#D4AF37';
const CYAN = '#C9A84C';
const CRIMSON = '#800020';
const GREEN = '#6DBF7E';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };


const TOOLTIP_STYLE = {
  background: '#080B18',
  border: '1px solid rgba(212,175,55,0.2)',
  borderRadius: 8,
  color: 'white',
  fontSize: 11,
};

function ChartCard({ title, icon: Icon, children, height = 'h-64', colSpan = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${colSpan} ${height}`}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.12)' }}>
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        {Icon && <Icon className="w-4 h-4" style={{ color: GOLD }} />}
        <span className="text-sm font-black" style={{ color: GOLD, ...T }}>{title}</span>
      </div>
      <div className="px-4 pb-4 h-[calc(100%-52px)]">{children}</div>
    </div>
  );
}

export default function StreamAnalytics() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('id');

  const [mode, setMode] = useState('post');

  const { data: user }    = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: room }    = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => base44.entities.Room.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
  });

  const { data: roomAnalytics = [] } = useQuery({
    queryKey: ['room-analytics', roomId],
    queryFn: () => base44.entities.RoomAnalytics.filter({ room_id: roomId }, '-timestamp', 60),
    enabled: !!roomId,
  });

  const { data: tipTransactions = [] } = useQuery({
    queryKey: ['tip-transactions', user?.id, roomId],
    queryFn: () => base44.entities.Transaction.filter({ to_user_id: user.id, type: 'tip' }, '-created_date', 100),
    enabled: !!user?.id,
  });

  const viewerData = roomAnalytics.slice().reverse().map((a, i) => ({
    min: i,
    viewers: a.viewer_count || 0,
    messages: a.chat_messages || 0,
  }));

  const tipData = tipTransactions.map((t, i) => ({
    time: i * 4,
    amount: t.amount || 0,
    event: t.metadata?.event || null,
  }));

  const peakViewers  = roomAnalytics.length > 0
    ? Math.max(...roomAnalytics.map(a => a.peak_viewers || a.viewer_count || 0))
    : (room?.viewer_count || 0);
  const avgViewers   = viewerData.length > 0
    ? Math.round(viewerData.reduce((s, d) => s + d.viewers, 0) / viewerData.length)
    : 0;
  const totalTips    = tipData.reduce((s, d) => s + (d.amount || 0), 0);
  const totalMessages = roomAnalytics.length > 0
    ? (roomAnalytics[0].chat_messages || 0)
    : viewerData.reduce((s, d) => s + d.messages, 0);

  const topChatters = [];
  const reactionData = [];

  const exportReport = () => {
    const lines = [
      `Stream Report — ${room?.title || 'Stream'}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Peak Viewers: ${peakViewers}`,
      `Average Viewers: ${avgViewers}`,
      `Total Tips: $${totalTips.toFixed(2)}`,
      `Total Messages: ${totalMessages}`,
      `Creator Revenue (90%): $${(Math.floor(totalTips * 90) / 100).toFixed(2)}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'stream-report.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: '#080B18' }}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 px-4 py-3"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}>
              <BarChart2 className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <div>
              <h1 className="font-black text-lg text-white leading-none" style={T}>Stream Analytics</h1>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
                {room?.title || 'Stream Overview'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <div className="flex rounded-lg overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { id: 'live', label: '🔴 Live' },
                { id: 'post', label: '📊 Review' },
              ].map(m => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className="px-3 py-1.5 text-[11px] font-black uppercase transition-all"
                  style={{
                    ...T,
                    background: mode === m.id ? GOLD : 'transparent',
                    color: mode === m.id ? '#000' : 'rgba(255,255,255,0.5)',
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
            {/* Export */}
            <button onClick={exportReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-[11px] uppercase transition-all"
              style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-5 space-y-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Peak Viewers',  value: peakViewers, sub: `Avg: ${avgViewers}`,                                    color: CYAN,     icon: Users },
            { label: 'Total Revenue', value: `$${totalTips.toFixed(2)}`, sub: `90% = $${(totalTips * 0.9).toFixed(2)} yours`, color: GOLD, icon: DollarSign },
            { label: 'Chat Messages', value: totalMessages, sub: `${Math.round(totalMessages / Math.max(viewerData.length, 1))} msg/min`, color: '#D4AF37', icon: MessageSquare },
            { label: 'Engagement',    value: `${Math.round(((totalMessages + tipData.length) / Math.max(avgViewers, 1)) * 100)}%`, sub: 'vs. 12% avg', color: GREEN, icon: TrendingUp },
          ].map((kpi, i) => (
            <motion.div key={kpi.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>{kpi.label}</p>
                  <p className="text-2xl font-black mt-1" style={{ color: kpi.color, fontFamily: 'Orbitron, monospace' }}>{kpi.value}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{kpi.sub}</p>
                </div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${kpi.color}20` }}>
                  <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Viewer chart + Device pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="Viewer Count Over Time" icon={Users} colSpan="lg:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewerData}>
                <defs>
                  <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CYAN} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CYAN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="min" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="viewers" stroke={CYAN} fill="url(#vGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Device Breakdown">
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <BarChart2 className="w-8 h-8 opacity-20" style={{ color: GOLD }} />
              <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Device data available after stream ends</p>
            </div>
          </ChartCard>
        </div>

        {/* Chat + Chatters + Reactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="Chat Activity" height="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={viewerData.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="min" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="messages" fill={GOLD} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="rounded-2xl h-56 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.12)' }}>
            <div className="px-4 pt-4 pb-2">
              <span className="text-sm font-black" style={{ color: GOLD, ...T }}>Top Chatters</span>
            </div>
            <div className="px-4 pb-4 space-y-2">
              {topChatters.length > 0 ? topChatters.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="text-[10px] w-4 font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{c.name}</p>
                    <div className="h-1 rounded-full mt-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(c.count / topChatters[0].count) * 100}%`, background: GOLD }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono tabular-nums" style={{ color: GOLD }}>{c.count}</span>
                </div>
              )) : (
                <p className="text-xs text-center py-4" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>No chat data yet</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl h-56 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.12)' }}>
            <div className="px-4 pt-4 pb-2">
              <span className="text-sm font-black" style={{ color: GOLD, ...T }}>Reactions</span>
            </div>
            <div className="px-4 pb-4 space-y-2.5">
              {reactionData.length > 0 ? reactionData.map(r => (
                <div key={r.emoji} className="flex items-center gap-2">
                  <span className="text-base w-6">{r.emoji}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${(r.count / reactionData[0].count) * 100}%`, background: GOLD }} />
                  </div>
                  <span className="text-[10px] font-mono tabular-nums" style={{ color: 'rgba(255,255,255,0.5)' }}>{r.count}</span>
                </div>
              )) : (
                <p className="text-xs text-center py-4" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>No reactions recorded yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Revenue + Traffic Sources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.12)' }}>
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <DollarSign className="w-4 h-4" style={{ color: GOLD }} />
              <span className="text-sm font-black" style={{ color: GOLD, ...T }}>Revenue Breakdown</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full font-black"
                style={{ background: 'rgba(212,175,55,0.1)', color: GOLD, border: '1px solid rgba(212,175,55,0.3)', ...T }}>
                90/10 Split
              </span>
            </div>
            <div className="px-4 pb-4 space-y-2">
              {tipTransactions.length > 0 ? (
                <>
                  <div className="flex items-center gap-3">
                    <p className="text-xs w-28" style={{ color: 'rgba(255,255,255,0.6)' }}>Tips</p>
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: '100%', background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})` }} />
                    </div>
                    <p className="text-xs font-mono w-16 text-right" style={{ color: GOLD }}>${totalTips.toFixed(2)}</p>
                  </div>
                  <div className="pt-2 flex justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Your share (90%)</p>
                    <p className="text-sm font-black" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>
                      ${Math.floor(totalTips * 90) / 100 .toFixed(2)}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-center py-4" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>No revenue data for this stream</p>
              )}
            </div>
          </div>

          <ChartCard title="Traffic Sources" height="h-auto">
            <div style={{ height: 160 }} className="flex flex-col items-center justify-center gap-2">
              <BarChart2 className="w-8 h-8 opacity-20" style={{ color: CYAN }} />
              <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Traffic source data coming soon</p>
            </div>
          </ChartCard>
        </div>

        {/* Health + broadcast analytics panels */}
        <div className="mt-6 space-y-4">
          <StreamHealthDashboard />
          <BroadcastAnalyticsDashboard />
          <PerformanceDashboard />
          <AudienceInsights />
          <StreamerGoalsWidget userId={user?.id} />
          <SwanAIRecommendations roomId={roomId} currentLayout="default" viewerCount={0} />
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
          <OnlineUsersGrid compact maxVisible={10} />
          <ContentRecommendations />
          <CollaborationMatcher />
          <ShareToSocial content={{ title: 'SeeWhy LIVE', url: window.location.href }} />
        </div>
      </div>
    </div>
  );
}
