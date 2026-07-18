import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const HealthMetric = ({ label, value, unit, status, trend }) => {
  const statusColor = {
    excellent: '#6DBF7E',
    good: '#d4af37',
    warning: '#FFB800',
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
            <TrendingDown className="w-3 h-3 text-[#C0392B]" />
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

function bitrateStatus(kbps) {
  if (kbps > 4000) return 'excellent';
  if (kbps > 2000) return 'good';
  if (kbps > 500)  return 'warning';
  return 'critical';
}
function fpsStatus(fps) {
  if (fps >= 55) return 'excellent';
  if (fps >= 28) return 'good';
  if (fps >= 15) return 'warning';
  return 'critical';
}
function rttStatus(ms) {
  if (ms < 50)  return 'excellent';
  if (ms < 120) return 'good';
  if (ms < 250) return 'warning';
  return 'critical';
}
function lossStatus(pct) {
  if (pct < 0.5) return 'excellent';
  if (pct < 2)   return 'good';
  if (pct < 5)   return 'warning';
  return 'critical';
}

/* duplicate HealthMetric removed — using the definition above */

const EMPTY = {
  bitrate:   { value: null, unit: 'kbps', status: 'offline', trend: null, label: 'Bitrate' },
  fps:       { value: null, unit: 'fps',  status: 'offline', trend: null, label: 'FPS' },
  latency:   { value: null, unit: 'ms',   status: 'offline', trend: null, label: 'RTT' },
  resolution:{ value: null, unit: '',     status: 'offline', trend: null, label: 'Resolution' },
  packetLoss:{ value: null, unit: '%',    status: 'offline', trend: null, label: 'Pkt Loss' },
  viewers:   { value: null, unit: 'live', status: 'offline', trend: null, label: 'Viewers' },
};

/**
 * StreamHealthDashboard — live metrics via RTCPeerConnection.getStats().
 *
 * Props:
 *   isLive         {boolean}
 *   peerConnection {RTCPeerConnection|null} — optional; from useWebRTCPeers / any PC
 *   viewerCount    {number|null}            — live viewer count from DB (optional)
 */
export default function StreamHealthDashboard({ isLive, peerConnection, viewerCount }) {
  const [metrics, setMetrics] = useState(EMPTY);
  const prevRef = useRef(null);

  useEffect(() => {
    if (!isLive || !peerConnection) {
      setMetrics(EMPTY);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const report = await peerConnection.getStats();
        if (cancelled) return;

        let outboundBitrateKbps = 0;
        let fps = 0;
        let rttMs = 0;
        let packetsLost = 0;
        let packetsTotal = 0;
        let frameWidth = 0, frameHeight = 0;

        const prev = prevRef.current;

        report.forEach(s => {
          if (s.type === 'outbound-rtp' && s.kind === 'video') {
            fps        = s.framesPerSecond ? Math.round(s.framesPerSecond) : fps;
            frameWidth  = s.frameWidth  || frameWidth;
            frameHeight = s.frameHeight || frameHeight;

            if (prev) {
              const p = prev.get(s.id);
              if (p && s.timestamp !== p.timestamp) {
                const bytesDiff = (s.bytesSent || 0) - (p.bytesSent || 0);
                const secDiff   = (s.timestamp - p.timestamp) / 1000;
                if (secDiff > 0) outboundBitrateKbps = Math.round((bytesDiff * 8) / secDiff / 1000);
              }
            }
          }
          if (s.type === 'remote-inbound-rtp' && s.kind === 'video') {
            if (s.roundTripTime !== undefined) rttMs = Math.round(s.roundTripTime * 1000);
            packetsLost  = (packetsLost  || 0) + (s.packetsLost    || 0);
            packetsTotal = (packetsTotal || 0) + (s.packetsReceived || 0) + (s.packetsLost || 0);
          }
          // Also capture from candidate-pair for RTT fallback
          if (s.type === 'candidate-pair' && s.state === 'succeeded' && !rttMs) {
            if (s.currentRoundTripTime) rttMs = Math.round(s.currentRoundTripTime * 1000);
          }
        });

        prevRef.current = new Map(Array.from(report.entries()));

        const lossPercent = packetsTotal > 0
          ? +((packetsLost / packetsTotal) * 100).toFixed(1)
          : 0;
        const resolution = frameWidth && frameHeight
          ? `${frameWidth}×${frameHeight}`
          : null;

        setMetrics({
          bitrate:    { value: outboundBitrateKbps || null, unit: 'kbps', status: outboundBitrateKbps ? bitrateStatus(outboundBitrateKbps) : 'offline', trend: null, label: 'Bitrate' },
          fps:        { value: fps || null,             unit: 'fps',  status: fps       ? fpsStatus(fps)         : 'offline', trend: null, label: 'FPS' },
          latency:    { value: rttMs || null,           unit: 'ms',   status: rttMs     ? rttStatus(rttMs)       : 'offline', trend: null, label: 'RTT' },
          resolution: { value: resolution,              unit: '',     status: resolution ? 'good'                : 'offline', trend: null, label: 'Resolution' },
          packetLoss: { value: lossPercent,             unit: '%',    status: lossStatus(lossPercent),                        trend: null, label: 'Pkt Loss' },
          viewers:    { value: viewerCount ?? null,     unit: 'live', status: viewerCount != null ? (viewerCount > 0 ? 'excellent' : 'good') : 'offline', trend: null, label: 'Viewers' },
        });
      } catch {
        // PC closed or stats unavailable
      }
    };

    poll();
    const id = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isLive, peerConnection, viewerCount]);

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
        <div className="w-2 h-2 rounded-full bg-[#C0392B] animate-pulse" />
        <h3 className="text-sm font-bold text-white">Stream Health</h3>
        {!peerConnection && (
          <span className="text-[10px] text-white/30 ml-auto">(no WebRTC connection)</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.values(metrics).map(m => (
          <HealthMetric
            key={m.label}
            label={m.label}
            value={m.value}
            unit={m.unit}
            status={m.status}
            trend={m.trend}
          />
        ))}
      </div>
    </div>
  );
}