import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, ChevronDown, ChevronUp, AlertTriangle, Volume2, Monitor, Copy } from 'lucide-react';
import { toast } from 'sonner';

const QUALITY_LABELS = [
  { min: 80, label: 'Excellent', color: '#6DBF7E' },
  { min: 60, label: 'Good',      color: '#D4AF37' },
  { min: 40, label: 'Fair',      color: '#D4854A' },
  { min:  0, label: 'Poor',      color: '#C0392B' },
];

const SUGGESTIONS = {
  lowHealth:    '⚠ Consider lowering to 720p or reducing bitrate.',
  highLatency:  '⚠ High latency — check your upload connection.',
  droppedFrames:'⚠ Dropped frames detected — close background apps.',
  packetLoss:   '⚠ Packet loss detected — try a wired connection.',
};

function getQuality(health) {
  return QUALITY_LABELS.find(q => health >= q.min) || QUALITY_LABELS[QUALITY_LABELS.length - 1];
}

function fmtUptime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-white/5 rounded p-1.5">
      <p className="text-white/40 uppercase tracking-wide" style={{ fontSize: '9px' }}>{label}</p>
      <p className="font-mono font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function AlertRow({ alert }) {
  const color = alert.level === 'error' ? '#C0392B' : '#D4854A';
  return (
    <div className="flex items-start gap-2 py-1 border-b border-white/5 last:border-0">
      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/70 leading-snug">{alert.message}</p>
        <p className="text-[9px] text-white/25 mt-0.5">{alert.time}</p>
      </div>
    </div>
  );
}

export default React.memo(function StreamHealthMonitor({ isLive, webrtcStats }) {
  const [collapsed, setCollapsed]       = useState(() => { try { return localStorage.getItem('health_monitor_collapsed') === 'true'; } catch { return false; } });
  const [showAlerts, setShowAlerts]     = useState(false);
  const [health, setHealth]             = useState(85);
  const [bitrate, setBitrate]           = useState(3200);
  const [fps, setFps]                   = useState(30);
  const [latency, setLatency]           = useState(180);
  const [droppedFrames, setDroppedFrames] = useState(0);
  const [packetLoss, setPacketLoss]     = useState(0);
  const [audioLevel, setAudioLevel]     = useState(72);
  const [resolution, setResolution]     = useState('1080p');
  const [alerts, setAlerts]             = useState([]);
  const prevDropped = useRef(0);
  const [uptime, setUptime] = useState(0);
  const uptimeTimer = useRef(null);
  const [bitrateSparkline, setBitrateSparkline] = useState([]);
  const bitrateHistory = useRef([]);

  // If real WebRTC stats are passed in, consume them
  useEffect(() => {
    if (!webrtcStats) return;
    if (webrtcStats.bitrate    !== undefined) setBitrate(webrtcStats.bitrate);
    if (webrtcStats.fps        !== undefined) setFps(webrtcStats.fps);
    if (webrtcStats.latency    !== undefined) setLatency(webrtcStats.latency);
    if (webrtcStats.dropped    !== undefined) setDroppedFrames(webrtcStats.dropped);
    if (webrtcStats.packetLoss !== undefined) setPacketLoss(webrtcStats.packetLoss);
    if (webrtcStats.resolution !== undefined) setResolution(webrtcStats.resolution);
    if (webrtcStats.audioLevel !== undefined) setAudioLevel(webrtcStats.audioLevel);
    if (webrtcStats.bitrate !== undefined) {
      bitrateHistory.current = [...bitrateHistory.current.slice(-19), webrtcStats.bitrate];
      setBitrateSparkline([...bitrateHistory.current]);
    }
    // Recompute composite health
    const h = Math.round(
      Math.min(100, Math.max(0,
        60 * Math.min(1, bitrate / 4000) +
        20 * (fps >= 30 ? 1 : fps / 30) +
        10 * (latency < 200 ? 1 : latency < 400 ? 0.5 : 0) +
        10 * (1 - Math.min(1, packetLoss / 5))
      ))
    );
    setHealth(h);
  }, [webrtcStats]);

  // Push alert if a threshold is crossed
  const pushAlert = useCallback((message, level = 'warn') => {
    setAlerts(prev => {
      const now = Date.now();
      if (prev.some(a => a.message === message && now - a.ts < 30000)) return prev;
      return [
        { id: now, ts: now, message, level, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 4),
      ];
    });
  }, []);

  useEffect(() => {
    if (health < 40)          pushAlert(SUGGESTIONS.lowHealth, 'error');
  }, [health < 40]);
  useEffect(() => {
    if (latency > 400)        pushAlert(SUGGESTIONS.highLatency);
  }, [latency > 400]);
  useEffect(() => {
    if (packetLoss > 1)       pushAlert(SUGGESTIONS.packetLoss);
  }, [packetLoss > 1]);
  useEffect(() => {
    if (droppedFrames > 0 && droppedFrames !== prevDropped.current) {
      pushAlert(SUGGESTIONS.droppedFrames);
      prevDropped.current = droppedFrames;
    }
  }, [droppedFrames]);

  // Uptime timer
  useEffect(() => {
    if (isLive) {
      uptimeTimer.current = setInterval(() => setUptime(u => u + 1), 1000);
    } else {
      setUptime(0);
      clearInterval(uptimeTimer.current);
    }
    return () => clearInterval(uptimeTimer.current);
  }, [isLive]);

  const quality      = getQuality(health);
  const latencyColor = latency < 200 ? '#6DBF7E' : latency < 400 ? '#C9A84C' : '#C0392B';
  const networkBars  = Math.ceil((health / 100) * 5);
  const ringCirc     = 2 * Math.PI * 20;
  const ringOffset   = ringCirc - (health / 100) * ringCirc;
  const audioBarPct  = Math.min(100, audioLevel);

  return (
    <motion.div
      layout
      className="bg-[rgba(8,11,24,0.9)] border border-[rgba(212,175,55,0.2)] rounded-xl overflow-hidden"
      style={{ backdropFilter: 'blur(12px)' }}
    >
      {/* Header row */}
      <button
        onClick={() => { const n = !collapsed; setCollapsed(n); try { localStorage.setItem('health_monitor_collapsed', String(n)); } catch {} }}
        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5"
      >
        <div className="relative w-8 h-8 shrink-0">
          <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <circle
              cx="24" cy="24" r="20" fill="none"
              stroke={quality.color} strokeWidth="4"
              strokeDasharray={ringCirc}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color: quality.color }}>
            {health}
          </span>
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-[#d4af37]">Stream Health</p>
            <span className="text-[9px] font-black uppercase px-1.5 rounded"
              style={{ background: `${quality.color}22`, color: quality.color }}>
              {quality.label}
            </span>
          </div>
          <p className="text-[10px] text-white/50">{(bitrate / 1000).toFixed(1)} Mbps · {resolution}{isLive && uptime > 0 ? ` · ${fmtUptime(uptime)}` : ''}</p>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-1 rounded-sm"
              style={{ height: `${(i + 1) * 3 + 4}px`, background: i < networkBars ? quality.color : 'rgba(255,255,255,0.15)' }}
            />
          ))}
        </div>
        {alerts.length > 0 && (
          <span className="text-[9px] font-black px-1 rounded" style={{ background: '#C0392B22', color: '#C0392B' }}>
            {alerts.length}⚠
          </span>
        )}
        {collapsed ? <ChevronDown className="w-3 h-3 text-white/40" /> : <ChevronUp className="w-3 h-3 text-white/40" />}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden px-3 pb-3 space-y-2"
          >
            {/* Core stats grid */}
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <Stat label="FPS"       value={`${fps} fps`}                             color="#D4AF37" />
              <Stat label="Latency"   value={`${latency} ms`}                          color={latencyColor} />
              <Stat label="Dropped"   value={`${droppedFrames} fr`}                    color={droppedFrames > 10 ? '#C0392B' : '#6DBF7E'} />
              <Stat label="Bitrate"   value={`${(bitrate / 1000).toFixed(1)} Mbps`}   color="#d4af37" />
              <Stat label="Pkt Loss"  value={`${packetLoss.toFixed(1)}%`}              color={packetLoss > 1 ? '#C0392B' : '#6DBF7E'} />
              <Stat label="Res"       value={resolution}                               color="#C9A84C" />
            </div>

            {/* Audio level bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[9px] text-white/40 uppercase">
                  <Volume2 className="w-3 h-3" /> Audio
                </span>
                <span className="text-[9px] font-bold" style={{ color: audioBarPct > 80 ? '#C0392B' : audioBarPct > 50 ? '#6DBF7E' : '#D4AF37' }}>
                  {audioBarPct}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  animate={{ width: `${audioBarPct}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: audioBarPct > 80 ? '#C0392B' : audioBarPct > 50 ? '#6DBF7E' : '#D4AF37' }}
                />
              </div>
            </div>

            {/* Bitrate sparkline */}
            {bitrateSparkline.length > 2 && (
              <div>
                <p className="text-[9px] text-white/30 uppercase tracking-wide mb-1">Bitrate trend</p>
                <svg width="100%" height="20" viewBox={`0 0 ${bitrateSparkline.length - 1} 20`} preserveAspectRatio="none" style={{ display: 'block' }}>
                  <polyline
                    points={bitrateSparkline.map((v, i) => {
                      const max = Math.max(...bitrateSparkline, 1);
                      return `${i},${(20 - (v / max) * 18).toFixed(1)}`;
                    }).join(' ')}
                    fill="none"
                    stroke={quality.color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}

            {/* Copy stats */}
            <button
              onClick={() => {
                const lines = [
                  `Stream Health: ${health}% (${quality.label})`,
                  `Bitrate: ${(bitrate / 1000).toFixed(1)} Mbps`,
                  `FPS: ${fps}`,
                  `Latency: ${latency} ms`,
                  `Dropped: ${droppedFrames}`,
                  `Packet Loss: ${packetLoss.toFixed(1)}%`,
                  `Resolution: ${resolution}`,
                ];
                if (isLive && uptime > 0) lines.push(`Uptime: ${fmtUptime(uptime)}`);
                navigator.clipboard?.writeText(lines.join('\n')).then(() => toast.success('Stats copied!'));
              }}
              className="w-full text-[10px] py-1 rounded transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              <Copy className="w-3 h-3" /> Copy Stats
            </button>

            {/* Alerts toggle */}
            {alerts.length > 0 && (
              <button
                onClick={() => setShowAlerts(v => !v)}
                className="w-full flex items-center justify-between text-[10px] px-2 py-1 rounded"
                style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', color: '#C0392B' }}
              >
                <span className="flex items-center gap-1 font-bold"><AlertTriangle className="w-3 h-3" /> {alerts.length} alert{alerts.length > 1 ? 's' : ''}</span>
                <span>{showAlerts ? '▲' : '▼'}</span>
              </button>
            )}

            <AnimatePresence>
              {showAlerts && alerts.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden rounded px-2 py-1"
                  style={{ background: 'rgba(12,8,18,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {alerts.map(a => <AlertRow key={a.id} alert={a} />)}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
