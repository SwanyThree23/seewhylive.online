import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, TrendingDown, Zap, Wifi, WifiOff } from 'lucide-react';

export default function GuestStreamMonitor({ guestName, isStreaming }) {
  const [stats, setStats] = useState({
    bitrate: 4200,
    latency: 45,
    frames: 60,
    resolution: '1080p',
    health: 'excellent'
  });

  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setStats(prev => ({
        bitrate: Math.max(1000, prev.bitrate + (Math.random() - 0.5) * 200),
        latency: Math.max(10, prev.latency + (Math.random() - 0.5) * 15),
        frames: Math.max(20, prev.frames + (Math.random() - 0.5) * 10),
        resolution: prev.resolution,
        health: Math.random() > 0.1 ? 'excellent' : Math.random() > 0.3 ? 'good' : 'warning'
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const healthColor = {
    excellent: '#00FF88',
    good: '#d4af37',
    warning: '#FFB800',
    critical: '#FF1564'
  };

  const healthLabel = {
    excellent: 'Excellent',
    good: 'Good',
    warning: 'Warning',
    critical: 'Critical'
  };

  if (!isStreaming) {
    return (
      <div className="bg-[#1a0a2e]/50 border border-white/5 rounded-lg p-3 text-center">
        <WifiOff className="w-4 h-4 text-white/20 mx-auto mb-1" />
        <p className="text-[11px] text-white/30">{guestName} not streaming</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#1a0a2e]/70 border border-[#00FF88]/20 rounded-lg p-3 space-y-2"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
        <span className="text-[10px] font-semibold text-white">{guestName}</span>
        <span className="text-[11px] text-white/40 ml-auto">{healthLabel[stats.health]}</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="flex items-center gap-1.5 bg-white/5 rounded p-1.5">
          <Activity className="w-3 h-3 text-[#d4af37]" />
          <div>
            <p className="text-white/40">Bitrate</p>
            <p className="text-white font-semibold">{Math.round(stats.bitrate)} kbps</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 rounded p-1.5">
          <Zap className="w-3 h-3 text-cyan-400" />
          <div>
            <p className="text-white/40">Latency</p>
            <p className="text-white font-semibold">{Math.round(stats.latency)}ms</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 rounded p-1.5">
          <Wifi className="w-3 h-3 text-green-400" />
          <div>
            <p className="text-white/40">FPS</p>
            <p className="text-white font-semibold">{Math.round(stats.frames)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 rounded p-1.5">
          <span className="text-[10px] font-mono text-white/60">{stats.resolution}</span>
        </div>
      </div>

      {stats.health !== 'excellent' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-orange-900/20 border border-orange-600/30 rounded p-1.5 flex gap-1.5"
        >
          <AlertTriangle className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-orange-300">
            {stats.health === 'warning' ? 'Connection unstable — consider lower bitrate' : 'Critical — connection degrading'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}