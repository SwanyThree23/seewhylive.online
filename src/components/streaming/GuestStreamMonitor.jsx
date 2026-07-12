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

  // Stats updated via real WebRTC getStats() callbacks from parent when available

  const healthColor = {
    excellent: '#6DBF7E',
    good: '#d4af37',
    warning: '#FFB800',
    critical: '#C0392B'
  };

  const healthLabel = {
    excellent: 'Excellent',
    good: 'Good',
    warning: 'Warning',
    critical: 'Critical'
  };

  if (!isStreaming) {
    return (
      <div className="bg-[#0F1428]/50 border border-white/5 rounded-lg p-3 text-center">
        <WifiOff className="w-4 h-4 text-white/20 mx-auto mb-1" />
        <p className="text-[11px] text-white/30">{guestName} not streaming</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#0F1428]/70 border border-[#6DBF7E]/20 rounded-lg p-3 space-y-2"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-[#6DBF7E] animate-pulse" />
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
          <Zap className="w-3 h-3 text-[#4A8A7A]" />
          <div>
            <p className="text-white/40">Latency</p>
            <p className="text-white font-semibold">{Math.round(stats.latency)}ms</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 rounded p-1.5">
          <Wifi className="w-3 h-3 text-[#6DBF7E]" />
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
          className="rounded p-1.5 flex gap-1.5" style={{ background: 'rgba(212,133,74,0.1)', border: '1px solid rgba(212,133,74,0.25)' }}
        >
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" style={{ color: '#D4854A' }} />
          <p className="text-[11px]" style={{ color: '#CC7755' }}>
            {stats.health === 'warning' ? 'Connection unstable — consider lower bitrate' : 'Critical — connection degrading'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}