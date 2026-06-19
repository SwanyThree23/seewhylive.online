import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, MessageSquare, Zap, Heart, Eye } from 'lucide-react';

const G = '#D4AF37';
const BG = '#080B18';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

const COLORS = ['#D4AF37', '#C9A84C', '#D4AF37', '#D4854A', '#6DBF7E'];

export default function StreamAnalyticsDashboard({ roomId }) {
  // Fetch room analytics
  const { data: analytics } = useQuery({
    queryKey: ['roomAnalytics', roomId],
    queryFn: () =>
      base44.entities.RoomAnalytics.filter(
        { room_id: roomId },
        '-timestamp',
        24
      ),
    enabled: !!roomId,
  });

  // Fetch performance metrics
  const { data: metrics } = useQuery({
    queryKey: ['performanceMetrics', roomId],
    queryFn: () =>
      base44.entities.PerformanceMetric.filter(
        { entity_id: roomId },
        '-timestamp',
        50
      ),
    enabled: !!roomId,
  });

  const latestAnalytics = analytics?.[0];
  
  const chartData = analytics?.reverse().map(a => ({
    time: new Date(a.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    viewers: a.viewer_count,
    engagement: a.engagement_rate || 0,
    tips: a.tips_received || 0,
    messages: a.chat_messages || 0,
  })) || [];

  const StatCard = ({ icon: Icon, label, value, unit, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg"
      style={{ background: `${color}15`, border: `1px solid ${color}30` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <p className="text-[10px] text-white/60 uppercase font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          {label}
        </p>
      </div>
      <p className="text-lg font-black" style={{ color }}>
        {typeof value === 'number' ? value.toLocaleString() : '—'}{unit}
      </p>
    </motion.div>
  );

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <StatCard icon={Eye} label="Viewers" value={latestAnalytics?.viewer_count || 0} unit="" color={G} />
        <StatCard icon={Users} label="Peak" value={latestAnalytics?.peak_viewers || 0} unit="" color="#C9A84C" />
        <StatCard icon={MessageSquare} label="Chat" value={latestAnalytics?.chat_messages || 0} unit="" color="#D4AF37" />
        <StatCard icon={Zap} label="Tips" value={latestAnalytics?.tips_received || 0} unit="$" color="#D4854A" />
        <StatCard icon={Heart} label="Engagement" value={latestAnalytics?.engagement_rate || 0} unit="%" color="#6DBF7E" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Viewer Count Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg p-4"
          style={{ background: BG, border: `1px solid ${BORDER}` }}
        >
          <h3 className="text-xs font-bold mb-3" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
            📊 Viewer Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.3)" />
              <YAxis tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.3)" />
              <Tooltip
                contentStyle={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: '8px' }}
                formatter={(value) => value.toLocaleString()}
              />
              <Line type="monotone" dataKey="viewers" stroke={G} strokeWidth={2} dot={{ fill: G, r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Engagement Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg p-4"
          style={{ background: BG, border: `1px solid ${BORDER}` }}
        >
          <h3 className="text-xs font-bold mb-3" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
            💬 Chat Activity
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.3)" />
              <YAxis tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.3)" />
              <Tooltip
                contentStyle={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: '8px' }}
              />
              <Bar dataKey="messages" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Session Summary */}
      {latestAnalytics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg"
          style={{ background: BG, border: `1px solid ${BORDER}` }}
        >
          <h3 className="text-xs font-bold mb-3" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
            📈 Session Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }} className="p-2.5 rounded">
              <p className="text-white/60 mb-1">Total Unique</p>
              <p className="font-bold" style={{ color: G }}>{latestAnalytics.total_viewers || 0}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }} className="p-2.5 rounded">
              <p className="text-white/60 mb-1">Avg Watch</p>
              <p className="font-bold" style={{ color: '#C9A84C' }}>{Math.round(latestAnalytics.average_watch_time || 0)}m</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }} className="p-2.5 rounded">
              <p className="text-white/60 mb-1">New Followers</p>
              <p className="font-bold" style={{ color: '#6DBF7E' }}>{latestAnalytics.new_followers || 0}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }} className="p-2.5 rounded">
              <p className="text-white/60 mb-1">Engagement</p>
              <p className="font-bold" style={{ color: '#D4854A' }}>{Math.round(latestAnalytics.engagement_rate || 0)}%</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}