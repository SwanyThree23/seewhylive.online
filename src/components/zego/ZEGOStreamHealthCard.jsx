import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Copy, Zap, Users, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function elapsed(startedAt) {
  if (!startedAt) return '00:00:00';
  const s = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

const STATUS_CFG = {
  live:       { color: '#6DBF7E', bg: 'rgba(109,191,126,0.1)',  border: 'rgba(109,191,126,0.25)',  label: 'LIVE' },
  connecting: { color: GOLD,      bg: `rgba(212,175,55,0.1)`, border: `rgba(212,175,55,0.25)`, label: 'CONNECTING' },
  ended:      { color: '#888',    bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', label: 'ENDED' },
  error:      { color: '#FF4444', bg: 'rgba(255,68,68,0.1)',  border: 'rgba(255,68,68,0.25)',  label: 'ERROR' },
};

const KIT_LABELS = {
  live_streaming: 'Live Streaming',
  video_call: 'Video Call',
  voice_call: 'Voice Call',
};

const LATENCY_LABELS = {
  ultra_low: 'Ultra-Low <500ms',
  low: 'Low <1s',
  standard: 'Standard',
};

export default function ZEGOStreamHealthCard({ roomId }) {
  const [tick, setTick] = useState(0);

  const { data: zegoStream } = useQuery({
    queryKey: ['zego-health', roomId],
    queryFn: () => base44.entities.ZEGOStream.filter({ room_id: roomId }, '-created_date', 1).then(r => r[0]),
    enabled: !!roomId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  if (!zegoStream) return null;

  const sc = STATUS_CFG[zegoStream.status] || STATUS_CFG.ended;
  const bitrateRatio = zegoStream.avg_bitrate_kbps ? Math.min(1, zegoStream.avg_bitrate_kbps / 4000) : 0;
  const platform = zegoStream.platform?.toUpperCase() === 'REACT_NATIVE' ? 'REACT NATIVE' : (zegoStream.platform?.toUpperCase() || 'WEB');
  const platformColor = platform === 'REACT NATIVE' ? '#D4AF37' : '#C9A84C';

  return (
    <div className="rounded-xl p-4 space-y-4" style={{ background: '#1A1A1A', border: `1px solid rgba(201,168,76,0.15)`, boxShadow: zegoStream.status === 'live' ? '0 0 20px rgba(201,168,76,0.06)' : 'none' }}>
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: '#C9A84C' }} />
          <span className="font-black uppercase text-[11px]" style={{ color: GOLD, ...T }}>ZEGOCLOUD Status</span>
        </div>
        <span className="text-[11px] font-black uppercase px-1.5 py-0.5 rounded"
          style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
          {sc.label === 'LIVE' && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 bg-green-400 animate-pulse" />}
          {sc.label}
        </span>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-2">
        <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded"
          style={{ background: `${platformColor}15`, color: platformColor, border: `1px solid ${platformColor}30`, fontFamily: 'Share Tech Mono, monospace' }}>
          {platform}
        </span>
        {zegoStream.kit_type && (
          <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded"
            style={{ background: `${GOLD}10`, color: GOLD, border: `1px solid ${GOLD}25`, ...T }}>
            {KIT_LABELS[zegoStream.kit_type] || zegoStream.kit_type}
          </span>
        )}
        {zegoStream.latency_mode && (
          <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded"
            style={{ background: 'rgba(109,191,126,0.08)', color: '#6DBF7E', border: '1px solid rgba(109,191,126,0.2)', ...T }}>
            {LATENCY_LABELS[zegoStream.latency_mode] || zegoStream.latency_mode}
          </span>
        )}
      </div>

      {/* IDs */}
      <div className="space-y-2">
        {zegoStream.stream_id && (
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-[7px] uppercase font-black" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>Stream ID</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Share Tech Mono, monospace' }}>{zegoStream.stream_id}</p>
            </div>
          </div>
        )}
        {zegoStream.zego_room_id && (
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-[7px] uppercase font-black" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>ZEGO Room ID</p>
              <p className="text-[11px]" style={{ color: '#C9A84C', fontFamily: 'Share Tech Mono, monospace' }}>{zegoStream.zego_room_id}</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(zegoStream.zego_room_id); toast.success('Copied!'); }}>
              <Copy className="w-3 h-3 text-white/30 hover:text-white/60 transition-colors" />
            </button>
          </div>
        )}
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Users className="w-3.5 h-3.5" style={{ color: GOLD }} />
          <div>
            <p className="text-[7px] uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>Audience</p>
            <p className="text-sm font-black" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{zegoStream.audience_count || 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Activity className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
          <div>
            <p className="text-[7px] uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>Elapsed</p>
            <p className="text-sm font-black" style={{ color: '#C9A84C', fontFamily: 'Orbitron, monospace' }}>{elapsed(zegoStream.started_at)}</p>
          </div>
        </div>
      </div>

      {/* Avg Bitrate bar */}
      {zegoStream.avg_bitrate_kbps != null && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[7px] uppercase font-black" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>Avg Bitrate</span>
            <span className="text-[11px] font-bold" style={{ color: GOLD, fontFamily: 'Share Tech Mono, monospace' }}>{zegoStream.avg_bitrate_kbps} kbps</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #C9A84C, ${GOLD})` }}
              animate={{ width: `${bitrateRatio * 100}%` }}
              transition={{ duration: 0.6 }} />
          </div>
        </div>
      )}
    </div>
  );
}