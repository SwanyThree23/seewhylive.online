import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Users, DollarSign, MessageSquare, Download, Zap, Clock, BarChart2 } from 'lucide-react';

const GOLD = '#d4af37';
const CYAN = '#00d4ff';
const BURGUNDY = '#800020';
const GREEN = '#22c55e';

// Generate realistic-looking demo data
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
  { name: 'Mobile', value: 35, color: GOLD },
  { name: 'Tablet', value: 5, color: BURGUNDY },
];

const SOURCE_DATA = [
  { name: 'Direct Link', viewers: 45 },
  { name: 'Embed', viewers: 30 },
  { name: 'Social', viewers: 15 },
  { name: 'Search', viewers: 10 },
];

export default function StreamAnalytics() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('id');

  const [viewerData] = useState(genViewerData(60));
  const [tipData] = useState(genTipData());
  const [mode, setMode] = useState('post');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => base44.entities.Room.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
  });
  const { data: session } = useQuery({
    queryKey: ['stream-session', roomId],
    queryFn: () => base44.entities.StreamSession.filter({ room_id: roomId }, '-created_date', 1).then(r => r[0]),
    enabled: !!roomId,
  });

  const peakViewers = Math.max(...viewerData.map(d => d.viewers));
  const avgViewers = Math.round(viewerData.reduce((s, d) => s + d.viewers, 0) / viewerData.length);
  const totalTips = tipData.reduce((s, d) => s + (d.amount || 0), 0);
  const totalMessages = viewerData.reduce((s, d) => s + d.messages, 0);

  const topChatters = [
    { name: 'StreamFan42', count: 48 },
    { name: 'TopViewer', count: 35 },
    { name: 'GoldSupporter', count: 27 },
    { name: 'LoyalWatcher', count: 19 },
    { name: 'NewcomerX', count: 11 },
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
    const a = document.createElement('a'); a.href = url; a.download = 'stream-report.txt'; a.click();
  };

  return (
    <div className="min-h-screen bg-[#0d0618] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#d4af37]">Stream Analytics</h1>
            <p className="text-sm text-white/50 mt-0.5">{room?.title || 'Stream Overview'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              {['live', 'post'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
                    mode === m ? 'bg-[#d4af37] text-black' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {m === 'live' ? '🔴 Live Mode' : '📊 Review Mode'}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={exportReport}
              className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 text-xs gap-1">
              <Download className="w-3 h-3" /> Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Peak Viewers', value: peakViewers, icon: Users, color: CYAN, sub: `Avg: ${avgViewers}` },
            { label: 'Total Revenue', value: `$${totalTips.toFixed(2)}`, icon: DollarSign, color: GOLD, sub: `90% = $${(totalTips * 0.9).toFixed(2)} yours` },
            { label: 'Chat Messages', value: totalMessages, icon: MessageSquare, color: '#a78bfa', sub: `${Math.round(totalMessages / Math.max(viewerData.length, 1))} msg/min` },
            { label: 'Engagement', value: `${Math.round(((totalMessages + tipData.length) / Math.max(avgViewers, 1)) * 100)}%`, icon: TrendingUp, color: GREEN, sub: 'vs. 12% avg' },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.12)] text-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] text-white/40 uppercase tracking-wide">{kpi.label}</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                      <p className="text-[10px] text-white/30 mt-1">{kpi.sub}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}20` }}>
                      <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Viewer count over time */}
          <div className="lg:col-span-2">
            <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.12)] text-white h-64">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-[#d4af37]">Viewer Count Over Time</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewerData}>
                    <defs>
                      <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CYAN} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CYAN} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="min" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                    <Tooltip contentStyle={{ background: '#0d0618', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, color: 'white', fontSize: 11 }} />
                    <Area type="monotone" dataKey="viewers" stroke={CYAN} fill="url(#vGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Device breakdown */}
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.12)] text-white h-64">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm text-[#d4af37]">Device Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-center h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={DEVICE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {DEVICE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0d0618', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, color: 'white', fontSize: 11 }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat activity */}
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.12)] text-white h-56">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm text-[#d4af37]">Chat Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewerData.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="min" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
                  <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
                  <Tooltip contentStyle={{ background: '#0d0618', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, color: 'white', fontSize: 11 }} />
                  <Bar dataKey="messages" fill={GOLD} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Chatters */}
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.12)] text-white h-56">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm text-[#d4af37]">Top Chatters</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2 overflow-y-auto">
              {topChatters.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/30 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{c.name}</p>
                    <div className="h-1 bg-white/5 rounded-full mt-0.5">
                      <div className="h-full rounded-full bg-[#d4af37]" style={{ width: `${(c.count / topChatters[0].count) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#d4af37]">{c.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reactions */}
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.12)] text-white h-56">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm text-[#d4af37]">Reactions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {reactionData.map(r => (
                <div key={r.emoji} className="flex items-center gap-2">
                  <span className="text-base w-6">{r.emoji}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(r.count / reactionData[0].count) * 100}%`, background: GOLD }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-white/50">{r.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Revenue + Traffic Sources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.12)] text-white">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm text-[#d4af37] flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Revenue Breakdown
                <Badge className="text-[9px] bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30">90/10 Split</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {[
                { label: 'Tips', amount: totalTips, pct: 55 },
                { label: 'Subscriptions', amount: totalTips * 0.25, pct: 25 },
                { label: 'PPV Tickets', amount: totalTips * 0.15, pct: 15 },
                { label: 'Store Sales', amount: totalTips * 0.05, pct: 5 },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <p className="text-xs text-white/60 w-28">{r.label}</p>
                  <div className="flex-1 h-2 bg-white/5 rounded-full">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#800020] to-[#d4af37]" style={{ width: `${r.pct}%` }} />
                  </div>
                  <p className="text-xs font-mono text-[#d4af37] w-16 text-right">${r.amount.toFixed(2)}</p>
                </div>
              ))}
              <div className="pt-2 border-t border-white/10 flex justify-between">
                <p className="text-xs text-white/40">Your share (90%)</p>
                <p className="text-sm font-bold text-[#d4af37]">${(totalTips * 0.9).toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.12)] text-white">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm text-[#d4af37]">Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SOURCE_DATA} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} width={70} />
                  <Tooltip contentStyle={{ background: '#0d0618', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, color: 'white', fontSize: 11 }} />
                  <Bar dataKey="viewers" fill={CYAN} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}