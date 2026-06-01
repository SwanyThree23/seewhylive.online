import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const GOLD = '#D4AF37';

export default function StreamHealthMonitor({ isStreaming = false }) {
  const [stats, setStats] = useState({ bitrate: 0, fps: 0, packetLoss: 0, latency: 0, quality: 'good' });

  useEffect(() => {
    if (!isStreaming) return;
    const t = setInterval(() => {
      // Simulate realistic stream stats
      setStats({
        bitrate: 2400 + Math.floor(Math.random() * 400),
        fps: 29 + Math.floor(Math.random() * 3),
        packetLoss: Math.random() < 0.1 ? Math.floor(Math.random() * 3) : 0,
        latency: 80 + Math.floor(Math.random() * 40),
        quality: Math.random() < 0.9 ? 'good' : 'fair',
      });
    }, 2000);
    return () => clearInterval(t);
  }, [isStreaming]);

  const qualityColor = stats.quality === 'good' ? '#00FF88' : stats.quality === 'fair' ? '#FFD700' : '#FF4444';

  if (!isStreaming) return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
      <span className="text-[9px] font-bold text-white/25" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>OFFLINE</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg"
      style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${qualityColor}33` }}>
      <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: qualityColor }}
        animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }} />
      <span className="text-[9px] font-black" style={{ color: qualityColor, fontFamily: 'Barlow Condensed, sans-serif' }}>
        {stats.quality.toUpperCase()}
      </span>
      <span className="text-[9px] text-white/40" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
        {(stats.bitrate / 1000).toFixed(1)}Mbps · {stats.fps}fps · {stats.latency}ms
      </span>
      {stats.packetLoss > 0 && (
        <span className="text-[8px] px-1 rounded font-bold" style={{ background: 'rgba(255,68,68,0.15)', color: '#FF4444' }}>
          {stats.packetLoss}% loss
        </span>
      )}
    </div>
  );
}
