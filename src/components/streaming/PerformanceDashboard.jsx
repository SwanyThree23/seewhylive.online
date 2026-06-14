import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Activity, Users, TrendingUp, Zap, Eye } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const G = '#d4af37';

export default function PerformanceDashboard({ roomId, sessionId }) {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const result = await base44.functions.invoke('analyzeStreamPerformance', {
          room_id: roomId,
          session_id: sessionId,
        });

        if (result?.data) {
          setMetrics(result.data);
          setHistory(prev => [...prev, {
            timestamp: Date.now(),
            bitrate: result.data.bitrate,
            fps: result.data.fps,
            viewers: result.data.viewer_count,
            latency: result.data.latency_ms,
          }]);
        }
      } catch (error) {
      }
      setLoading(false);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [roomId, sessionId]);

  const stats = [
    { label: 'Bitrate', value: metrics?.bitrate ? `${metrics.bitrate} Mbps` : '--', icon: Zap, color: '#D4854A' },
    { label: 'FPS', value: metrics?.fps || '--', icon: Activity, color: '#C9A84C' },
    { label: 'Viewers', value: metrics?.viewer_count || 0, icon: Users, color: '#6DBF7E' },
    { label: 'Latency', value: metrics?.latency_ms ? `${metrics.latency_ms}ms` : '--', icon: TrendingUp, color: G },
  ];

  return (
    <div className="space-y-4 p-4 rounded-lg" style={{ background: 'rgba(8,11,24,0.95)', border: `1px solid ${G}20` }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5" style={{ color: G }} />
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: G }}>Stream Health</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg"
              style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}30` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                <span className="text-[10px] text-white/50 uppercase">{stat.label}</span>
              </div>
              <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Chart */}
      {history.length > 1 && (
        <div className="mt-4 h-48 -mx-4 px-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history.slice(-30)}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.2)" style={{ fontSize: '10px' }} />
              <YAxis stroke="rgba(255,255,255,0.2)" style={{ fontSize: '10px' }} />
              <Tooltip
                contentStyle={{ background: 'rgba(8,11,24,0.9)', border: `1px solid ${G}30` }}
                labelStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="bitrate"
                stroke={G}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="fps"
                stroke="#C9A84C"
                dot={false}
                strokeWidth={2}
                yAxisId="right"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Status */}
      <div className="text-[10px] text-white/30 pt-2 border-t border-white/10">
        Health check every 10s · Bitrate, FPS, latency monitoring
      </div>
    </div>
  );
}