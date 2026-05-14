import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Eye, DollarSign } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const G = '#D4AF37';
const PANEL = '#0F0B1A';
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

  const stats = {
    totalViewers: analytics?.reduce((sum, a) => sum + (a.total_viewers || 0), 0) || 0,
    avgViewers: analytics?.length ? Math.round(analytics.reduce((sum, a) => sum + (a.viewer_count || 0), 0) / analytics.length) : 0,
    totalRevenue: analytics?.reduce((sum, a) => sum + (a.tips_received || 0), 0) || 0,
    avgEngagement: analytics?.length ? Math.round(analytics.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / analytics.length) : 0,
  };

  const chartData = analytics?.reverse().map(a => ({
    date: new Date(a.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    viewers: a.viewer_count || 0,
  })) || [];

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
        <StatCard icon={Users} label="Avg Viewers" value={stats.avgViewers} unit="" color="#00F5FF" />
        <StatCard icon={DollarSign} label="Revenue" value={stats.totalRevenue} unit="$" color="#00FF88" />
        <StatCard icon={TrendingUp} label="Engagement" value={stats.avgEngagement} unit="%" color="#FF8C00" />
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg"
        style={{ background: PANEL, border: `1px solid ${BORDER}` }}
      >
        <h3 className="text-xs font-bold mb-4" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          📊 Viewer Trend ({timeRange})
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.1)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.3)" />
            <YAxis tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.3)" />
            <Tooltip
              contentStyle={{ background: '#0A0710', border: `1px solid ${BORDER}`, borderRadius: '8px' }}
              formatter={(value) => value.toLocaleString()}
            />
            <Line type="monotone" dataKey="viewers" stroke={G} strokeWidth={2} dot={{ fill: G, r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}