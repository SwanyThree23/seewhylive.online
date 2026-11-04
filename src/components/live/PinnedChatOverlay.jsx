import React from 'react';
import { Pin, Eye, EyeOff, X } from 'lucide-react';

const FONT = 'Barlow Condensed, sans-serif';
const GOLD = '#FFB800';

/**
 * PinnedChatOverlay — renders host-pinned chat messages directly on top of the
 * live video feed. The strip is anchored to the top of the feed and collapsible,
 * so audience questions / top supporters can be highlighted in real time.
 */
export default function PinnedChatOverlay({ pins = [], visible = true, onToggleVisible, onUnpin, top = 48 }) {
  if (!pins.length) return null;

  return (
    <div
      className="absolute left-2 right-2 z-30 pointer-events-none flex flex-col items-start gap-1"
      style={{ top }}
    >
      {/* Control strip */}
      <div
        className="pointer-events-auto flex items-center gap-1 pl-2 pr-1 rounded-lg"
        style={{
          minHeight: 32,
          background: 'rgba(3,3,10,0.86)',
          border: `1px solid ${GOLD}44`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Pin className="w-3 h-3 shrink-0" style={{ color: GOLD }} />
        <span
          className="text-[10px] font-black uppercase tracking-widest"
          style={{ fontFamily: FONT, color: GOLD }}
        >
          Pinned {pins.length}
        </span>
        <button
          onClick={onToggleVisible}
          aria-label={visible ? 'Hide pinned messages' : 'Show pinned messages'}
          aria-pressed={visible}
          className="tap-44 flex items-center justify-center rounded-md"
          style={{ width: 28, height: 28, color: 'rgba(255,255,255,0.45)' }}
        >
          {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>
      </div>

      {/* Pinned messages */}
      {visible && pins.map(pin => (
        <div
          key={pin.id}
          className="pointer-events-auto max-w-[94%] flex items-start gap-1.5 pl-2.5 pr-1 py-1.5 rounded-lg"
          style={{
            background: 'rgba(3,3,10,0.9)',
            border: `1px solid ${GOLD}30`,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
          }}
        >
          <div className="min-w-0">
            <span
              className="block text-[9px] font-bold uppercase tracking-wide"
              style={{ fontFamily: FONT, color: `rgba(255,184,0,0.85)` }}
            >
              {pin.userName || 'Guest'}
            </span>
            <span
              className="block text-[11px] leading-snug"
              style={{ fontFamily: FONT, color: 'rgba(255,255,255,0.92)', wordBreak: 'break-word' }}
            >
              {pin.text}
            </span>
          </div>
          <button
            onClick={() => onUnpin?.(pin.id)}
            aria-label="Unpin message"
            className="tap-44 shrink-0 flex items-center justify-center rounded-md"
            style={{ width: 28, height: 28, color: 'rgba(255,255,255,0.4)' }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}