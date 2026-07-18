import React, { useState } from 'react';
import { useDeepgramTranscription } from '../../hooks/useDeepgramTranscription';
import { Mic, MicOff, Type, X } from 'lucide-react';

// LiveCaptionOverlay — floating real-time caption bar for host streams
// stream: MediaStream from useLocalMedia
// enabled: user toggle
// position: 'bottom' (default) | 'top'
export default function LiveCaptionOverlay({ stream, position = 'bottom' }) {
  const [captionsOn, setCaptionsOn] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { transcript, interimTranscript, isConnected, hasKey, clearTranscript } = useDeepgramTranscription({
    stream,
    enabled: captionsOn,
  });

  if (!hasKey) return null;

  const posStyle = position === 'top'
    ? { top: 70, left: '50%', transform: 'translateX(-50%)' }
    : { bottom: 80, left: '50%', transform: 'translateX(-50%)' };

  return (
    <>
      {/* Caption bar */}
      {captionsOn && (isConnected || interimTranscript || transcript) && (
        <div style={{
          position: 'fixed',
          ...posStyle,
          zIndex: 200,
          maxWidth: 700,
          width: '90vw',
          background: 'rgba(7,5,10,0.88)',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 12,
          padding: '8px 14px',
          backdropFilter: 'blur(12px)',
          pointerEvents: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isConnected ? '#6DBF7E' : '#ef4444',
              flexShrink: 0, marginTop: 6,
            }} />
            <div style={{ flex: 1 }}>
              {interimTranscript && (
                <span style={{
                  fontSize: 15, color: 'rgba(255,255,255,0.55)',
                  fontFamily: 'Barlow Condensed, sans-serif', fontStyle: 'italic',
                }}>
                  {interimTranscript}
                </span>
              )}
              {!interimTranscript && transcript && (
                <span style={{
                  fontSize: 15, color: '#fff',
                  fontFamily: 'Barlow Condensed, sans-serif',
                }}>
                  {transcript.split(' ').slice(-30).join(' ')}
                </span>
              )}
              {!interimTranscript && !transcript && isConnected && (
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Listening…
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: captionsOn ? 70 : 24,
        zIndex: 201,
        display: 'flex',
        gap: 8,
      }}>
        {captionsOn && transcript && (
          <button
            onClick={() => { clearTranscript(); setShowHistory(false); }}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(7,5,10,0.85)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Clear transcript"
          >
            <X size={14} />
          </button>
        )}
        <button
          onClick={() => setCaptionsOn(v => !v)}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: captionsOn ? 'rgba(109,191,126,0.2)' : 'rgba(7,5,10,0.85)',
            border: `1px solid ${captionsOn ? 'rgba(109,191,126,0.4)' : 'rgba(255,255,255,0.15)'}`,
            color: captionsOn ? '#6DBF7E' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title={captionsOn ? 'Disable live captions' : 'Enable live captions (Deepgram)'}
        >
          <Type size={15} />
        </button>
      </div>
    </>
  );
}
