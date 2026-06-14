import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';

const HealthMetric = ({ label, value, unit, status, trend }) => {
  const statusColor = {
    excellent: '#6DBF7E',
    good: '#d4af37',
    warning: '#D4AF37',
    critical: '#C0392B'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white/5 border border-white/10 rounded-lg p-2.5"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-white/60 font-semibold uppercase">{label}</span>
        <div className="flex items-center gap-1">
          {trend === 'up' ? (
            <TrendingUp className="w-3 h-3 text-[#6DBF7E]" />
          ) : trend === 'down' ? (
            <TrendingDown className="w-3 h-3 text-red-400" />
          ) : null}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-white">{value}</span>
        <span className="text-[11px] text-white/50">{unit}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: statusColor[status] }}
        />
        <span className="text-[11px] text-white/40 capitalize">{status}</span>
      </div>
    </motion.div>
  );
};

export default function StreamHealthDashboard({ isLive }) {
  const [metrics, setMetrics] = useState({
    bitrate: { value: 5000, status: 'excellent', trend: 'up' },
    fps: { value: 60, status: 'excellent', trend: null },
    latency: { value: 42, status: 'good', trend: 'down' },
    resolution: { value: '1080p', status: 'excellent', trend: null },
    uploadSpeed: { value: 25, status: 'excellent', trend: null },
    viewers: { value: 247, status: 'excellent', trend: 'up' }
  });

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        bitrate: { value: Math.round(Math.random() * 2000 + 4000), status: 'excellent', trend: Math.random() > 0.5 ? 'up' : 'down' },
        fps: { value: Math.round(Math.random() * 15 + 50), status: 'excellent', trend: null },
        latency: { value: Math.round(Math.random() * 30 + 30), status: 'good', trend: 'down' },
        resolution: { value: '1080p', status: 'excellent', trend: null },
        uploadSpeed: { value: Math.round(Math.random() * 10 + 20), status: 'excellent', trend: null },
        viewers: { value: Math.round(Math.random() * 100 + 200), status: 'excellent', trend: 'up' }
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  if (!isLive) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
        <AlertCircle className="w-5 h-5 text-white/30 mx-auto mb-2" />
        <p className="text-[11px] text-white/40">Stream not live</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <h3 className="text-sm font-bold text-white">Stream Health</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <HealthMetric
          label="Bitrate"
          value={metrics.bitrate.value}
          unit="kbps"
          status={metrics.bitrate.status}
          trend={metrics.bitrate.trend}
        />
        <HealthMetric
          label="FPS"
          value={metrics.fps.value}
          unit="fps"
          status={metrics.fps.status}
          trend={metrics.fps.trend}
        />
        <HealthMetric
          label="Latency"
          value={metrics.latency.value}
          unit="ms"
          status={metrics.latency.status}
          trend={metrics.latency.trend}
        />
        <HealthMetric
          label="Resolution"
          value={metrics.resolution.value}
          unit=""
          status={metrics.resolution.status}
          trend={metrics.resolution.trend}
        />
        <HealthMetric
          label="Upload Speed"
          value={metrics.uploadSpeed.value}
          unit="Mbps"
          status={metrics.uploadSpeed.status}
          trend={metrics.uploadSpeed.trend}
        />
        <HealthMetric
          label="Viewers"
          value={metrics.viewers.value}
          unit="live"
          status={metrics.viewers.status}
          trend={metrics.viewers.trend}
        />
      </div>
    </div>
  );
}