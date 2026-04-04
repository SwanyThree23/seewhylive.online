import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, ExternalLink, Mic, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Shown when media permissions are denied or unavailable.
 * Also shows browser-level permission status.
 */
export default function WebRTCSetupBanner({ error, audioEnabled, videoEnabled, onRetry }) {
  const [expanded, setExpanded] = useState(false);

  if (!error && (audioEnabled || videoEnabled)) return null;

  return (
    <div className="bg-amber-950/80 border border-amber-600/40 rounded-lg p-3 text-sm">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-amber-200 font-semibold text-xs">
            {error ? 'Camera/Mic access denied' : 'Media not available'}
          </p>
          {error && <p className="text-amber-400 text-[10px] mt-0.5 truncate">{error}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="ghost" className="h-6 text-[10px] text-amber-300 hover:text-amber-100 px-2" onClick={onRetry}>
            Retry
          </Button>
          <button onClick={() => setExpanded(v => !v)} className="text-amber-400">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 text-[11px] text-amber-300">
          <div className="flex items-center gap-2">
            <Mic className="w-3 h-3" />
            <span>Microphone:</span>
            {audioEnabled
              ? <Badge className="bg-green-800 text-green-200 text-[9px]"><CheckCircle className="w-2.5 h-2.5 mr-1" />Active</Badge>
              : <Badge className="bg-red-900 text-red-300 text-[9px]">Blocked</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Video className="w-3 h-3" />
            <span>Camera:</span>
            {videoEnabled
              ? <Badge className="bg-green-800 text-green-200 text-[9px]"><CheckCircle className="w-2.5 h-2.5 mr-1" />Active</Badge>
              : <Badge className="bg-red-900 text-red-300 text-[9px]">Blocked</Badge>}
          </div>
          <p className="text-amber-400/70 mt-1">
            Click the 🔒 lock icon in your browser address bar → allow Camera &amp; Microphone, then click Retry.
          </p>
          <p className="text-amber-500/60 text-[10px]">
            For production peer-to-peer video, integrate <strong className="text-amber-400">LiveKit</strong> or <strong className="text-amber-400">Daily.co</strong> with a WebRTC SFU.{' '}
            <a href="https://livekit.io/docs/getting-started" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">
              LiveKit Docs <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </p>
        </div>
      )}
    </div>
  );
}