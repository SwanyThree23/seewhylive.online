import React, { useState } from 'react';
import { Camera, Mic, Monitor, RefreshCw, Volume2 } from 'lucide-react';
import { useCameraDevices, RESOLUTION_PRESETS } from '../../hooks/useCameraDevices';
import { MobileSelect } from '@/components/ui/MobileSelect';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const ROW = {
  display: 'flex', alignItems: 'center', gap: 10,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, padding: '8px 12px',
};

const LBL = {
  display: 'block', fontSize: 10, ...T,
  color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
};

function NativeSelect({ value, onChange, options, placeholder }) {
  return (
    <MobileSelect
      value={value || ''}
      onChange={onChange}
      options={options.map(o => ({ value: o.deviceId, label: o.label }))}
      placeholder={placeholder}
    />
  );
}

/**
 * CameraDeviceSelector
 *
 * Props:
 *   currentVideoId      string|null     — active camera deviceId
 *   currentAudioId      string|null     — active mic deviceId
 *   resolution          string          — '360p'|'480p'|'720p'|'1080p'
 *   onVideoChange       (deviceId) => void
 *   onAudioChange       (deviceId) => void
 *   onResolutionChange  (preset) => void
 *   onScreenShare       () => void       — optional, show screen-share shortcut
 *   isSharingScreen     boolean
 *   compact             boolean         — one-line row layout (default false)
 *   hideVideo           boolean         — omit camera picker (audio-only mode)
 *   currentSpeakerId    string|null     — active speaker output deviceId
 *   onSpeakerChange     (deviceId) => void — optional; shows speaker picker when provided
 */
export default function CameraDeviceSelector({
  currentVideoId, currentAudioId, resolution = '720p',
  onVideoChange, onAudioChange, onResolutionChange,
  onScreenShare, isSharingScreen = false, compact = false,
  hideVideo = false,
  currentSpeakerId, onSpeakerChange,
}) {
  const { cameras, mics, speakers, refresh } = useCameraDevices();

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {/* Camera picker */}
        {!hideVideo && (
          <div style={{ ...ROW, minWidth: 0, flex: 1 }}>
            <Camera className="w-3.5 h-3.5 shrink-0" style={{ color: GOLD }} />
            <NativeSelect
              value={currentVideoId} onChange={onVideoChange}
              options={cameras} placeholder="Select camera"
            />
          </div>
        )}
        {/* Mic picker */}
        <div style={{ ...ROW, minWidth: 0, flex: 1 }}>
          <Mic className="w-3.5 h-3.5 shrink-0" style={{ color: GOLD }} />
          <NativeSelect
            value={currentAudioId} onChange={onAudioChange}
            options={mics} placeholder="Select mic"
          />
        </div>
        {onScreenShare && (
          <button onClick={onScreenShare}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-black uppercase"
            style={{ ...T, background: isSharingScreen ? `${CRIMSON}33` : 'rgba(255,255,255,0.05)', border: `1px solid ${isSharingScreen ? CRIMSON : 'rgba(255,255,255,0.1)'}`, color: isSharingScreen ? '#C0392B' : 'rgba(255,255,255,0.5)', userSelect: 'none' }}>
            <Monitor className="w-3 h-3" />
            {isSharingScreen ? 'Stop' : 'Share'}
          </button>
        )}
        <button onClick={refresh}
          className="w-8 h-8 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', userSelect: 'none' }}>
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Camera */}
      {!hideVideo && (
        <div>
          <label style={LBL}>Camera</label>
          <div style={ROW}>
            <Camera className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
            <NativeSelect
              value={currentVideoId} onChange={onVideoChange}
              options={cameras} placeholder="No cameras found"
            />
            <button onClick={refresh} title="Refresh devices"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 2, userSelect: 'none' }}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mic */}
      <div>
        <label style={LBL}>Microphone</label>
        <div style={ROW}>
          <Mic className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
          <NativeSelect
            value={currentAudioId} onChange={onAudioChange}
            options={mics} placeholder="No mics found"
          />
        </div>
      </div>

      {/* Speaker output — only shown when onSpeakerChange provided and multiple outputs exist */}
      {onSpeakerChange && speakers.length > 1 && (
        <div>
          <label style={LBL}>Speaker / Headphones</label>
          <div style={ROW}>
            <Volume2 className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
            <NativeSelect
              value={currentSpeakerId} onChange={onSpeakerChange}
              options={speakers} placeholder="Default output"
            />
          </div>
        </div>
      )}

      {/* Resolution presets */}
      {onResolutionChange && (
        <div>
          <label style={LBL}>Resolution</label>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(RESOLUTION_PRESETS).map(preset => (
              <button key={preset} onClick={() => onResolutionChange(preset)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-black uppercase"
                style={{
                  ...T,
                  background: resolution === preset ? `linear-gradient(90deg, ${CRIMSON}, ${GOLD})` : 'rgba(255,255,255,0.05)',
                  border: resolution === preset ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  color: resolution === preset ? '#000' : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer', userSelect: 'none',
                }}>
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Screen share */}
      {onScreenShare && (
        <button onClick={onScreenShare}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase"
          style={{
            ...T,
            background: isSharingScreen ? 'rgba(192,57,43,0.12)' : 'rgba(255,255,255,0.04)',
            border: isSharingScreen ? '1px solid rgba(192,57,43,0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: isSharingScreen ? '#C0392B' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer', userSelect: 'none',
          }}>
          <Monitor className="w-4 h-4" />
          {isSharingScreen ? 'Stop Screen Share' : 'Share Screen'}
        </button>
      )}
    </div>
  );
}
