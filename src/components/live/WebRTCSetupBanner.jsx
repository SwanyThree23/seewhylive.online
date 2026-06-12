import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, ExternalLink, Mic, Video } from 'lucide-react';

/**
 * Shown when media permissions are denied or unavailable.
 * Also shows browser-level permission status.
 */
export default function WebRTCSetupBanner({ error, audioEnabled, videoEnabled, onRetry }) {
  const [expanded, setExpanded] = useState(false);

  if (!error && (audioEnabled || videoEnabled)) return null;

  return (
    <div className="bg-[#0F1428]/80 border border-[#D4AF37]/35 rounded-lg p-3 text-sm">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[#C9A84C] font-semibold text-xs">
            {error ? 'Camera/Mic access denied' : 'Media not available'}
          </p>
          {error && <p className="text-[#D4AF37] text-[10px] mt-0.5 truncate">{error}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onRetry} style={{ height:24, padding:'0 8px', borderRadius:6, border:'none', background:'transparent', color:'#D4AF37', cursor:'pointer', fontSize:10 }}>
            Retry
          </button>
          <button onClick={() => setExpanded(v => !v)} className="text-[#D4AF37]">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 text-[11px] text-[#D4AF37]/80">
          <div className="flex items-center gap-2">
            <Mic className="w-3 h-3" />
            <span>Microphone:</span>
            {audioEnabled
              ? <span style={{ fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'#4A9B5E', color:'#bbf7d0', display:'inline-flex', alignItems:'center', gap:4 }}><CheckCircle className="w-2.5 h-2.5" />Active</span>
              : <span style={{ fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'#7f1d1d', color:'#fca5a5' }}>Blocked</span>}
          </div>
          <div className="flex items-center gap-2">
            <Video className="w-3 h-3" />
            <span>Camera:</span>
            {videoEnabled
              ? <span style={{ fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'#4A9B5E', color:'#bbf7d0', display:'inline-flex', alignItems:'center', gap:4 }}><CheckCircle className="w-2.5 h-2.5" />Active</span>
              : <span style={{ fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'#7f1d1d', color:'#fca5a5' }}>Blocked</span>}
          </div>
          <p className="text-[#D4AF37]/70 mt-1">
            Click the 🔒 lock icon in your browser address bar → allow Camera &amp; Microphone, then click Retry.
          </p>
          <p className="text-[#D4AF37]/60 text-[10px]">
            For production peer-to-peer video, integrate <strong className="text-[#D4AF37]">LiveKit</strong> or <strong className="text-[#D4AF37]">Daily.co</strong> with a WebRTC SFU.{' '}
            <a href="https://livekit.io/docs/getting-started" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">
              LiveKit Docs <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </p>
        </div>
      )}
    </div>
  );
}