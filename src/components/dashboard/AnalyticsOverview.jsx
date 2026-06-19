import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Eye, DollarSign } from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const G = '#D4AF37';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

export default function AnalyticsOverview({ creatorId, timeRange = '7d' }) {
  const { data: analytics } = useQuery({
    queryKey: ['creatorAnalytics', creatorId, timeRange],
    queryFn: async () => {
      const metrics = await base44.entities.RoomAnalytics.filter(
        { creator_id: creatorId },
        '-timestamp',
        timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365
      );
      return metrics || [];
    },
    enabled: !!creatorId,
  });

  const { data: tips = [] } = useQuery({
    queryKey: ['creatorTips', creatorId, timeRange],
    queryFn: () => base44.entities.Tip.filter({ creator_id: creatorId }, '-created_date', 50),
    enabled: !!creatorId,
  });

  const { data: subs = [] } = useQuery({
    queryKey: ['creatorSubs', creatorId, timeRange],
    queryFn: () => base44.entities.Subscription.filter({ creator_id: creatorId }, '-created_date', 100),
    enabled: !!creatorId,
  });

  const stats = {
    totalViewers: analytics?.reduce((sum, a) => sum + (a.total_viewers || 0), 0) || 0,
    avgViewers: analytics?.length ? Math.round(analytics.reduce((sum, a) => sum + (a.viewer_count || 0), 0) / analytics.length) : 0,
    totalRevenue: (tips.reduce((s, t) => s + (t.amount || 0), 0) + subs.reduce((s, sub) => s + (sub.amount || 0), 0)).toFixed(2),
    avgEngagement: analytics?.length ? Math.round(analytics.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / analytics.length) : 0,
  };

  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const chartData = buckets.map(date => {
    const a = analytics?.find(r => new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === date);
    return { date, viewers: a?.viewer_count || 0 };
  });

  const earningsData = buckets.map(date => {
    const dayTips = tips.filter(t => new Date(t.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === date);
    const daySubs = subs.filter(s => new Date(s.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === date);
    const tipTotal = dayTips.reduce((s, t) => s + (t.amount || 0), 0);
    const subTotal = daySubs.reduce((s, sub) => s + (sub.amount || 0), 0);
    return { date, tips: +tipTotal.toFixed(2), subs: +subTotal.toFixed(2), total: +(tipTotal + subTotal).toFixed(2) };
  });

  const followerData = buckets.map((date, i) => {
    const activeSubs = subs.filter(s => new Date(s.created_date) <= new Date()).length;
    const cumulative = Math.round((activeSubs / days) * (i + 1));
    return { date, subscribers: cumulative };
  });

  const StatCard = ({ icon: Icon, label, value, unit, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg"
      style={{ background: PANEL, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5" style={{ color }} />
        <p className="text-xs text-white/60 font-bold uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          {label}
        </p>
      </div>
      <p className="text-2xl font-black" style={{ color }}>
        {typeof value === 'number' ? value.toLocaleString() : '—'}
        <span className="text-xs text-white/40 ml-1">{unit}</span>
      </p>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Eye} label="Total Viewers" value={stats.totalViewers} unit="" color={G} />
        <StatCard icon={Users} label="Avg Viewers" value={stats.avgViewers} unit="" color="#C9A84C" />
        <StatCard icon={DollarSign} label="Revenue" value={stats.totalRevenue} unit="$" color="#6DBF7E" />
        <StatCard icon={TrendingUp} label="Engagement" value={stats.avgEngagement} unit="%" color="#D4854A" />
      </div>

      {/* Viewer Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
        <h3 className="text-xs font-bold mb-4" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          👁 Viewer Trend ({timeRange})
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.1)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} stroke="rgba(255,255,255,0.1)" />
            <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} stroke="rgba(255,255,255,0.1)" />
            <Tooltip contentStyle={{ background: '#080B18', border: `1px solid ${BORDER}`, borderRadius: 8 }} formatter={(v) => [v.toLocaleString(), 'Viewers']} />
            <Line type="monotone" dataKey="viewers" stroke={G} strokeWidth={2} dot={{ fill: G, r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Earnings Area Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-4 rounded-lg" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
        <h3 className="text-xs font-bold mb-4" style={{ color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>
          💰 Earnings Breakdown ({timeRange})
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={earningsData}>
            <defs>
              <linearGradient id="gradTips" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradSubs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6DBF7E" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6DBF7E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} stroke="rgba(255,255,255,0.1)" />
            <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} stroke="rgba(255,255,255,0.1)" tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ background: '#080B18', border: `1px solid ${BORDER}`, borderRadius: 8 }} formatter={(v, name) => [`$${v}`, name === 'tips' ? 'Tips' : 'Subscriptions']} />
            <Area type="monotone" dataKey="tips" stroke={G} fill="url(#gradTips)" strokeWidth={2} />
            <Area type="monotone" dataKey="subs" stroke="#6DBF7E" fill="url(#gradSubs)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          {[['Tips', G], ['Subscriptions', '#6DBF7E']].map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Subscriber Growth Bar Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="p-4 rounded-lg" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
        <h3 className="text-xs font-bold mb-4" style={{ color: '#C9A84C', fontFamily: 'Barlow Condensed, sans-serif' }}>
          📈 Subscriber Growth ({timeRange})
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={followerData} barSize={timeRange === '7d' ? 24 : 8}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} stroke="rgba(255,255,255,0.1)" />
            <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} stroke="rgba(255,255,255,0.1)" />
            <Tooltip contentStyle={{ background: '#080B18', border: `1px solid ${BORDER}`, borderRadius: 8 }} formatter={(v) => [v, 'Subscribers']} />
            <Bar dataKey="subscribers" fill="rgba(201,168,76,0.7)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}