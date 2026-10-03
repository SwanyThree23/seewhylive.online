import React from 'react';
import { Gauge } from 'lucide-react';

/**
 * Studio switch for the low-latency preview.
 * Sits in the studio tool row and lights up green while the lighter
 * preview profile is active.
 */
export default function LowLatencyPreviewToggle({ enabled, onToggle, network }) {
  const reason = network?.saveData
    ? 'Data Saver is on'
    : network?.mobile ? 'You are on a mobile network' : 'Turned on by hand';

  return (
    <button
      type="button"
      onClick={() => onToggle()}
      aria-pressed={enabled}
      aria-label={enabled ? 'Turn off low-latency preview' : 'Turn on low-latency preview'}
      title={enabled
        ? `Low-latency preview ON — lighter video, less data (${reason})`
        : `Low-latency preview OFF — tap for a lighter, low-data preview (${reason})`}
      className="flex flex-col items-center gap-0.5 shrink-0 transition-all hover:opacity-80"
    >
      <div className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: enabled ? 'rgba(109,191,126,0.15)' : 'rgba(255,255,255,0.05)',
          border: enabled ? '1px solid rgba(109,191,126,0.45)' : '1px solid rgba(255,255,255,0.08)',
        }}>
        <Gauge className="w-5 h-5" style={{ color: enabled ? '#6DBF7E' : 'rgba(255,255,255,0.5)' }} />
      </div>
      <span className="text-[10px]"
        style={{
          color: enabled ? '#6DBF7E' : 'rgba(255,255,255,0.4)',
          fontFamily: 'Barlow Condensed, sans-serif',
        }}>
        Low Latency
      </span>
    </button>
  );
}