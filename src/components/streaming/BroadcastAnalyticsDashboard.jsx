import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, Eye, MessageSquare, Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
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
          <p className={`text-[11px] mt-1 ${trend > 0 ? 'text-[#6DBF7E]' : 'text-[#C0392B]'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </p>
        )}
      </div>
      <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  </motion.div>
);

const SAMPLE_INTERVAL_MS = 30_000; // add a data point every 30 s
const MAX_HISTORY = 20;            // keep last 10 minutes of samples

function fmt(d) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function pctChange(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * BroadcastAnalyticsDashboard — live viewer counts from DB + engagement from streamSession.
 *
 * Props:
 *   roomId        {string}  — used to query Participant entities for live viewer count
 *   streamSession {object}  — base44 stream session record (likes, comments, shares, tips_count, etc.)
 *   isLive        {boolean}
 */
export default function BroadcastAnalyticsDashboard({ roomId, streamSession, isLive }) {
  // Viewer history: [{time, viewers, timestamp}]
  const [viewerHistory, setViewerHistory] = useState([]);
  const historyRef = useRef([]);
  const lastSampleRef = useRef(0);

  // Live participant count from DB
  const { data: participants = [] } = useQuery({
    queryKey: ['participants-live', roomId],
    queryFn: () => base44.entities.Participant.filter({ room_id: roomId }),
    enabled: !!roomId && isLive,
    refetchInterval: 10_000,
  });

  const liveViewers = participants.filter(
    p => ['host', 'co-host', 'speaker', 'guest', 'viewer'].includes(p.role)
  ).length;

  // Append a sample to the viewer history every SAMPLE_INTERVAL_MS
  useEffect(() => {
    if (!isLive) return;
    const now = Date.now();
    if (now - lastSampleRef.current < SAMPLE_INTERVAL_MS) return;
    lastSampleRef.current = now;

    const point = { time: fmt(now), viewers: liveViewers, ts: now };
    historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), point];
    setViewerHistory([...historyRef.current]);
  }, [liveViewers, isLive]);

  // Also seed an initial point when stream goes live
  useEffect(() => {
    if (isLive && historyRef.current.length === 0) {
      const point = { time: fmt(Date.now()), viewers: liveViewers, ts: Date.now() };
      historyRef.current = [point];
      setViewerHistory([point]);
      lastSampleRef.current = Date.now();
    }
  }, [isLive]);

  const currentViewers = liveViewers;
  const peakViewers    = viewerHistory.length ? Math.max(...viewerHistory.map(d => d.viewers)) : 0;
  const prevPoint      = viewerHistory.length > 1 ? viewerHistory[viewerHistory.length - 2] : null;
  const viewerTrend    = pctChange(currentViewers, prevPoint?.viewers ?? null);

  const engagementData = [
    { label: 'Likes',    value: streamSession?.likes      || 0, color: '#C0392B' },
    { label: 'Comments', value: streamSession?.comments   || 0, color: '#C9A84C' },
    { label: 'Shares',   value: streamSession?.shares     || 0, color: '#d4af37' },
    { label: 'Tips',     value: streamSession?.tips_count || 0, color: '#6DBF7E' },
  ];

  const totalEngagement = engagementData.reduce((s, e) => s + e.value, 0);
  const messages        = streamSession?.comments || 0;
  const prevEngagement  = streamSession?._prev_engagement ?? null;
  const engagementTrend = pctChange(totalEngagement, prevEngagement);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#0F1428]/50 border border-[#d4af37]/15 rounded-lg p-4 space-y-4"
    >
      <h3 className="text-sm font-bold text-white">Stream Analytics</h3>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={Users}         label="Current Viewers"   value={currentViewers}  trend={viewerTrend}    color="#C9A84C" />
        <StatCard icon={Eye}           label="Peak Viewers"      value={peakViewers}      trend={null}           color="#d4af37" />
        <StatCard icon={MessageSquare} label="Messages"          value={messages}         trend={null}           color="#D4AF37" />
        <StatCard icon={Heart}         label="Total Engagement"  value={totalEngagement}  trend={engagementTrend} color="#C0392B" />
      </div>

      {/* Viewer trend chart */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
        <p className="text-[11px] text-white/60 uppercase font-semibold mb-2">Viewer Trend</p>
        {viewerHistory.length > 1 ? (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={viewerHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" tick={{ fill: '#fff', fontSize: 10 }} />
              <YAxis tick={{ fill: '#fff', fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#0B0B18', border: '1px solid rgba(212,175,55,0.2)' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="viewers" stroke="#C9A84C" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[150px] flex items-center justify-center text-white/30 text-xs">
            {isLive ? 'Collecting data…' : 'Start stream to see viewer trend'}
          </div>
        )}
      </div>

      {/* Engagement breakdown */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
        <p className="text-[11px] text-white/60 uppercase font-semibold mb-2">Engagement</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="label" tick={{ fill: '#fff', fontSize: 11 }} />
            <YAxis tick={{ fill: '#fff', fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#0B0B18', border: '1px solid rgba(212,175,55,0.2)' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="value" fill="#d4af37" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
