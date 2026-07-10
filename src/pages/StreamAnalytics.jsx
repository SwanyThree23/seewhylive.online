import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar,
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Users, DollarSign, MessageSquare, Download, BarChart2 } from 'lucide-react';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
const GOLD = '#D4AF37';
const CYAN = '#C9A84C';
const CRIMSON = '#800020';
const GREEN = '#6DBF7E';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function genViewerData(points = 30) {
  let v = 12;
  return Array.from({ length: points }, (_, i) => {
    v = Math.max(5, Math.min(200, v + (Math.random() - 0.45) * 15));
    return { min: i, viewers: Math.round(v), messages: Math.round(Math.random() * 20) };
  });
}

function genTipData() {
  return Array.from({ length: 15 }, (_, i) => ({
    time: i * 4,
    amount: Math.random() < 0.3 ? Math.round(Math.random() * 50 + 5) : null,
    event: Math.random() < 0.1 ? 'Tip Storm' : null,
  })).filter(d => d.amount !== null);
}

const DEVICE_DATA = [
  { name: 'Desktop', value: 60, color: CYAN },
  { name: 'Mobile',  value: 35, color: GOLD },
  { name: 'Tablet',  value: 5,  color: CRIMSON },
];

const SOURCE_DATA = [
  { name: 'Direct Link', viewers: 45 },
  { name: 'Embed',       viewers: 30 },
  { name: 'Social',      viewers: 15 },
  { name: 'Search',      viewers: 10 },
];

const TOOLTIP_STYLE = {
  background: '#0d0618',
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
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('id');

  const [viewerData] = useState(genViewerData(60));
  const [tipData]    = useState(genTipData());
  const [mode, setMode] = useState('post');

  const { data: user }    = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: room }    = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => base44.entities.Room.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
  });

  const peakViewers  = Math.max(...viewerData.map(d => d.viewers));
  const avgViewers   = Math.round(viewerData.reduce((s, d) => s + d.viewers, 0) / viewerData.length);
  const totalTips    = tipData.reduce((s, d) => s + (d.amount || 0), 0);
  const totalMessages = viewerData.reduce((s, d) => s + d.messages, 0);

  const topChatters = [
    { name: 'StreamFan42',   count: 48 },
    { name: 'TopViewer',     count: 35 },
    { name: 'GoldSupporter', count: 27 },
    { name: 'LoyalWatcher',  count: 19 },
    { name: 'NewcomerX',     count: 11 },
  ];

  const reactionData = [
    { emoji: '🔥', count: 145 },
    { emoji: '❤️', count: 98 },
    { emoji: '😂', count: 67 },
    { emoji: '👏', count: 54 },
    { emoji: '😮', count: 32 },
  ];

  const exportReport = () => {
    const lines = [
      `Stream Report — ${room?.title || 'Stream'}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Peak Viewers: ${peakViewers}`,
      `Average Viewers: ${avgViewers}`,
      `Total Tips: $${totalTips.toFixed(2)}`,
      `Total Messages: ${totalMessages}`,
      `Creator Revenue (90%): $${(totalTips * 0.9).toFixed(2)}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'stream-report.txt'; a.click();
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
            { label: 'Chat Messages', value: totalMessages, sub: `${Math.round(totalMessages / Math.max(viewerData.length, 1))} msg/min`, color: '#a78bfa', icon: MessageSquare },
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
            <div className="flex items-center justify-center h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={DEVICE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {DEVICE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }} />
                </PieChart>
              </ResponsiveContainer>
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
              {topChatters.map((c, i) => (
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
              ))}
            </div>
          </div>

          <div className="rounded-2xl h-56 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.12)' }}>
            <div className="px-4 pt-4 pb-2">
              <span className="text-sm font-black" style={{ color: GOLD, ...T }}>Reactions</span>
            </div>
            <div className="px-4 pb-4 space-y-2.5">
              {reactionData.map(r => (
                <div key={r.emoji} className="flex items-center gap-2">
                  <span className="text-base w-6">{r.emoji}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${(r.count / reactionData[0].count) * 100}%`, background: GOLD }} />
                  </div>
                  <span className="text-[10px] font-mono tabular-nums" style={{ color: 'rgba(255,255,255,0.5)' }}>{r.count}</span>
                </div>
              ))}
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
              {[
                { label: 'Tips',          amount: totalTips,        pct: 55 },
                { label: 'Subscriptions', amount: totalTips * 0.25, pct: 25 },
                { label: 'PPV Tickets',   amount: totalTips * 0.15, pct: 15 },
                { label: 'Store Sales',   amount: totalTips * 0.05, pct: 5 },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <p className="text-xs w-28" style={{ color: 'rgba(255,255,255,0.6)' }}>{r.label}</p>
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${r.pct}%`, background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})` }} />
                  </div>
                  <p className="text-xs font-mono w-16 text-right" style={{ color: GOLD }}>${r.amount.toFixed(2)}</p>
                </div>
              ))}
              <div className="pt-2 flex justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Your share (90%)</p>
                <p className="text-sm font-black" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>
                  ${(totalTips * 0.9).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <ChartCard title="Traffic Sources" height="h-auto">
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SOURCE_DATA} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} width={70} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="viewers" fill={CYAN} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="analytics" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <BackgroundCustomizer />
    </div>
  );
}
