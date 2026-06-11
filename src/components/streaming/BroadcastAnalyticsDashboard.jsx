import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Eye, MessageSquare, Heart, Share2 } from 'lucide-react';

const StatCard = ({ icon: IconComponent, label, value, trend, color }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white/5 border border-white/10 rounded-lg p-3"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] text-white/60 uppercase font-semibold">{label}</p>
        <p className="text-xl font-bold text-white mt-1">{value}</p>
        {trend && (
          <p className={`text-[11px] mt-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </p>
        )}
      </div>
      <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
        <IconComponent className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  </motion.div>
);

export default function BroadcastAnalyticsDashboard({ streamSession, isLive }) {
  const [viewerData, setViewerData] = useState([
    { time: '8:00', viewers: 120 },
    { time: '8:15', viewers: 180 },
    { time: '8:30', viewers: 245 },
    { time: '8:45', viewers: 320 },
    { time: '9:00', viewers: 380 },
  ]);

  const [engagementData, setEngagementData] = useState([
    { label: 'Likes', value: 1240, color: '#C0392B' },
    { label: 'Comments', value: 580, color: '#C9A84C' },
    { label: 'Shares', value: 320, color: '#d4af37' },
    { label: 'Tips', value: 890, color: '#6DBF7E' },
  ]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setViewerData(prev => [
        ...prev.slice(1),
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          viewers: Math.floor(Math.random() * 200 + 300)
        }
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  const totalViewers = viewerData[viewerData.length - 1]?.viewers || 0;
  const peakViewers = Math.max(...viewerData.map(d => d.viewers));
  const totalEngagement = engagementData.reduce((sum, e) => sum + e.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-4 space-y-4"
    >
      <div>
        <h3 className="text-sm font-bold text-white mb-3">Stream Analytics</h3>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <StatCard icon={Users} label="Current Viewers" value={totalViewers} trend={12} color="#C9A84C" />
          <StatCard icon={Eye} label="Peak Viewers" value={peakViewers} trend={8} color="#d4af37" />
          <StatCard icon={MessageSquare} label="Messages" value={engagementData[1]?.value} trend={-5} color="#D4AF37" />
          <StatCard icon={Heart} label="Total Engagement" value={totalEngagement} trend={15} color="#C0392B" />
        </div>

        {/* Viewer Trend Chart */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
          <p className="text-[11px] text-white/60 uppercase font-semibold mb-2">Viewer Trend</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={viewerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" tick={{ fill: '#fff', fontSize: 10 }} />
              <YAxis tick={{ fill: '#fff', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#0B0B18', border: '1px solid rgba(212,175,55,0.2)' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="viewers" stroke="#C9A84C" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement Breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <p className="text-[11px] text-white/60 uppercase font-semibold mb-2">Engagement Breakdown</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="label" tick={{ fill: '#fff', fontSize: 11 }} />
              <YAxis tick={{ fill: '#fff', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#0B0B18', border: '1px solid rgba(212,175,55,0.2)' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" fill="#d4af37" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}