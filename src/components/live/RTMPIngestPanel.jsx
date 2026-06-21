import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Copy, Check, ChevronDown, ChevronUp, Smartphone, Monitor, Camera } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const INGEST_APPS = [
  { name: 'OBS Studio', icon: '🎬', hint: 'Settings → Stream → Custom → paste URL + Key' },
  { name: 'Streamlabs', icon: '🎮', hint: 'Settings → Stream → Custom RTMP → paste URL + Key' },
  { name: 'Larix (iOS/Android)', icon: '📱', hint: 'Add connection → paste Server URL + Stream Name' },
  { name: 'vMix', icon: '🎥', hint: 'Add Input → Stream → RTMP → paste URL + Key' },
];

function CopyRow({ label, value, secret = false }) {
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState(!secret);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(`${label} copied!`);
    }).catch(() => toast.error('Copy failed.'));
  };
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-white/30 font-bold" style={T}>{label}</p>
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <code className="flex-1 text-[11px] font-mono text-white/80 truncate">
          {shown ? value : '•'.repeat(Math.min(value.length, 28))}
        </code>
        {secret && (
          <button onClick={() => setShown(s => !s)} className="shrink-0 text-white/25 hover:text-white/50 transition-colors">
            <span className="text-[10px]">{shown ? 'hide' : 'show'}</span>
          </button>
        )}
        <button onClick={copy} className="shrink-0 w-6 h-6 rounded flex items-center justify-center transition-all" style={{ background: copied ? `${G}20` : 'rgba(255,255,255,0.05)' }}>
          {copied ? <Check className="w-3 h-3" style={{ color: G }} /> : <Copy className="w-3 h-3 text-white/40" />}
        </button>
      </div>
    </div>
  );
}

export default function RTMPIngestPanel({ roomId, streamKey }) {
  const [expanded, setExpanded] = useState(false);
  const [appIdx, setAppIdx] = useState(0);

  const ingestUrl = `rtmp://ingest.seewhylive.online/live`;
  const ingestKey = streamKey || (roomId ? `sw_ingest_${roomId.slice(0, 12)}` : 'sw_ingest_demo');

  return (
    <div className="space-y-1">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all"
        style={{
          background: expanded ? 'rgba(128,0,32,0.12)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${expanded ? 'rgba(192,57,43,0.4)' : 'rgba(255,255,255,0.08)'}`,
        }}
      >
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5" style={{ color: expanded ? '#C0392B' : 'rgba(255,255,255,0.3)' }} />
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ ...T, color: expanded ? '#D4AF37' : 'rgba(255,255,255,0.5)' }}>
            RTMP Ingest
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(128,0,32,0.25)', color: 'rgba(255,255,255,0.4)', ...T }}>
            Pull external stream in
          </span>
        </div>
        {expanded ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3 rounded-lg" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(128,0,32,0.2)' }}>
              <p className="text-[10px] text-white/35 leading-relaxed">
                Push any external source (phone camera, secondary OBS, hardware encoder) directly into this SeeWhy room using the ingest endpoint below.
              </p>

              <CopyRow label="RTMP Server URL" value={ingestUrl} />
              <CopyRow label="Stream Key" value={ingestKey} secret />

              {/* Combined URL */}
              <CopyRow label="Full Ingest URL (Server+Key combined)" value={`${ingestUrl}/${ingestKey}`} secret />

              {/* App instructions */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-white/25 font-bold" style={T}>Setup Guide</p>
                <div className="flex gap-1 flex-wrap">
                  {INGEST_APPS.map((app, i) => (
                    <button
                      key={app.name}
                      onClick={() => setAppIdx(i)}
                      className="px-2 py-1 rounded text-[10px] transition-all"
                      style={{
                        background: appIdx === i ? `${G}15` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${appIdx === i ? `${G}40` : 'rgba(255,255,255,0.08)'}`,
                        color: appIdx === i ? G : 'rgba(255,255,255,0.4)',
                        ...T, fontWeight: 700,
                      }}
                    >
                      {app.icon} {app.name}
                    </button>
                  ))}
                </div>
                <div className="px-3 py-2 rounded-lg text-[11px] text-white/60 leading-relaxed" style={{ background: 'rgba(212,175,55,0.05)', border: `1px solid ${G}15` }}>
                  {INGEST_APPS[appIdx].hint}
                </div>
              </div>

              {/* Use cases */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { icon: <Smartphone className="w-3 h-3" />, label: 'Mobile Cam', desc: 'Use phone as roaming camera' },
                  { icon: <Monitor className="w-3 h-3" />, label: 'Screen Share', desc: 'Push desktop via OBS' },
                  { icon: <Camera className="w-3 h-3" />, label: 'Hardware', desc: 'Encoder or capture card' },
                ].map(u => (
                  <div key={u.label} className="p-2 rounded text-center space-y-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex justify-center" style={{ color: 'rgba(212,175,55,0.5)' }}>{u.icon}</div>
                    <p className="text-[10px] font-black text-white/70" style={T}>{u.label}</p>
                    <p className="text-[9px] text-white/25">{u.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
