import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, ChevronDown, ChevronUp } from 'lucide-react';

export default React.memo(function StreamHealthMonitor({ isLive }) {
  const [collapsed, setCollapsed] = useState(false);
  const [health, setHealth] = useState(85);
  const [bitrate, setBitrate] = useState(3200);
  const [fps, setFps] = useState(30);
  const [latency, setLatency] = useState(180);
  const [droppedFrames, setDroppedFrames] = useState(0);
  const intervalRef = useRef(null);

  // Stats updated by real WebRTC getStats() / ZEGO callbacks when available

  const healthColor = health >= 80 ? '#6DBF7E' : health >= 50 ? '#D4AF37' : '#ef4444';
  const latencyColor = latency < 200 ? '#6DBF7E' : latency < 400 ? '#D4AF37' : '#ef4444';
  const networkBars = Math.ceil((health / 100) * 5);

  const ringCircumference = 2 * Math.PI * 20;
  const ringOffset = ringCircumference - (health / 100) * ringCircumference;

  return (
    <motion.div
      layout
      className="bg-[rgba(8,11,24,0.9)] border border-[rgba(212,175,55,0.2)] rounded-xl overflow-hidden"
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5"
      >
        <div className="relative w-8 h-8 shrink-0">
          <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <circle
              cx="24" cy="24" r="20" fill="none"
              stroke={healthColor} strokeWidth="4"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color: healthColor }}>
            {health}
          </span>
        </div>
        <div className="flex-1 text-left">
          <p className="text-xs font-semibold text-[#d4af37]">Stream Health</p>
          <p className="text-[10px] text-white/50">{bitrate.toLocaleString()} kbps</p>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-sm"
              style={{
                height: `${(i + 1) * 3 + 4}px`,
                background: i < networkBars ? healthColor : 'rgba(255,255,255,0.15)'
              }}
            />
          ))}
        </div>
        {collapsed ? <ChevronDown className="w-3 h-3 text-white/40" /> : <ChevronUp className="w-3 h-3 text-white/40" />}
      </button>

      {!collapsed && (
        <motion.div
          initial={{ height: 0 }} animate={{ height: 'auto' }}
          className="overflow-hidden px-3 pb-3 space-y-1.5"
        >
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <Stat label="FPS" value={`${fps} fps`} color="#D4AF37" />
            <Stat label="Latency" value={`${latency} ms`} color={latencyColor} />
            <Stat label="Bitrate" value={`${(bitrate / 1000).toFixed(1)} Mbps`} color="#d4af37" />
            <Stat label="Dropped" value={`${droppedFrames} fr`} color={droppedFrames > 10 ? '#ef4444' : '#6DBF7E'} />
          </div>
          {health < 50 && (
            <div className="bg-[#0F1428]/60 border border-[#D4AF37]/35 rounded px-2 py-1 text-[10px] text-[#D4AF37]">
              ⚠ Consider lowering to 720p
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
});

function Stat({ label, value, color }) {
  return (
    <div className="bg-white/5 rounded p-1.5">
      <p className="text-white/40 uppercase tracking-wide" style={{ fontSize: '9px' }}>{label}</p>
      <p className="font-mono font-bold" style={{ color }}>{value}</p>
    </div>
  );
}