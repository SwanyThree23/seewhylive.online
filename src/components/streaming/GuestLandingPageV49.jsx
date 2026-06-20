import React, { useRef, useEffect } from 'react';
import { useLocalMedia } from '../../hooks/useLocalMedia';
import { Mic, MicOff, Video, VideoOff, CheckCircle, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const BG = '#080B18';
const FONT = 'Barlow Condensed, sans-serif';

export default function GuestLandingPageV49({ guestName, roomId, onProceed, onBack }) {
  const { localStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo, error } = useLocalMedia({ audio: true, video: true });
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = localStream || null;
  }, [localStream]);

  const hasVideo = localStream && localStream.getVideoTracks().length > 0;
  const hasAudio = localStream && localStream.getAudioTracks().length > 0;
  const readyToProceed = hasVideo || hasAudio;

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎥</div>
        <h1 style={{ fontFamily: FONT, fontWeight: 900, fontSize: 28, color: GOLD, margin: '0 0 4px', letterSpacing: 2 }}>
          READY TO JOIN?
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontFamily: FONT, margin: 0 }}>
          {guestName ? `Welcome, ${guestName}!` : 'Check your camera and mic before joining'}
          {roomId ? ` · Room ${roomId}` : ''}
        </p>
      </div>

      {/* Camera preview */}
      <div style={{ width: '100%', maxWidth: 360, marginBottom: 20 }}>
        <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 16, overflow: 'hidden', background: '#0d0d0d', border: `2px solid ${localStream ? GOLD + '44' : CRIMSON + '44'}` }}>
          {/* Always-mounted video */}
          <video
            ref={videoRef}
            autoPlay muted playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: (localStream && videoEnabled) ? 'block' : 'none' }}
          />
          {(!localStream || !videoEnabled) && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <VideoOff size={40} color="rgba(255,255,255,0.2)" />
              <span style={{ fontFamily: FONT, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                {error ? 'Camera denied' : !localStream ? 'Starting camera…' : 'Camera off'}
              </span>
            </div>
          )}
          {/* Status badge */}
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <div style={{ padding: '3px 10px', borderRadius: 99, background: localStream ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)', border: `1px solid ${localStream ? '#4ade80' : '#EF4444'}44`, fontSize: 11, fontWeight: 700, fontFamily: FONT, color: localStream ? '#4ade80' : '#EF4444' }}>
              {localStream ? '● READY' : '○ CONNECTING'}
            </div>
          </div>
        </div>
      </div>

      {/* Device status checks */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {[
          { icon: hasVideo ? CheckCircle : XCircle, color: hasVideo ? '#4ade80' : '#EF4444', label: 'Camera', status: hasVideo ? 'Detected' : error ? 'Denied — check browser permissions' : 'Waiting…' },
          { icon: hasAudio ? CheckCircle : XCircle, color: hasAudio ? '#4ade80' : '#EF4444', label: 'Microphone', status: hasAudio ? 'Detected' : error ? 'Denied — check browser permissions' : 'Waiting…' },
        ].map(({ icon: Icon, color, label, status }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Icon size={20} color={color} />
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: '#fff' }}>{label}</div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{status}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      {localStream && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button onClick={toggleVideo}
            aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
            aria-pressed={!videoEnabled}
            style={{ width: 52, height: 52, borderRadius: '50%', border: `1px solid ${videoEnabled ? GOLD + '44' : '#EF444444'}`, background: videoEnabled ? GOLD + '15' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 44 }}>
            {videoEnabled ? <Video size={20} color={GOLD} /> : <VideoOff size={20} color="#EF4444" />}
          </button>
          <button onClick={toggleAudio}
            aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            aria-pressed={!audioEnabled}
            style={{ width: 52, height: 52, borderRadius: '50%', border: `1px solid ${audioEnabled ? GOLD + '44' : '#EF444444'}`, background: audioEnabled ? GOLD + '15' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 44 }}>
            {audioEnabled ? <Mic size={20} color={GOLD} /> : <MicOff size={20} color="#EF4444" />}
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360 }}>
        <button onClick={onProceed} disabled={!readyToProceed}
          style={{
            padding: '14px', borderRadius: 12, border: 'none', cursor: readyToProceed ? 'pointer' : 'not-allowed', minHeight: 44,
            background: readyToProceed ? `linear-gradient(to right, ${CRIMSON}, ${GOLD})` : 'rgba(255,255,255,0.06)',
            color: readyToProceed ? '#fff' : 'rgba(255,255,255,0.3)',
            fontFamily: FONT, fontWeight: 900, fontSize: 16, letterSpacing: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: readyToProceed ? 1 : 0.5,
          }}>
          Enter Room <ArrowRight size={18} />
        </button>
        {onBack && (
          <button onClick={onBack}
            style={{ padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', minHeight: 44, color: 'rgba(255,255,255,0.5)', fontFamily: FONT, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Go Back
          </button>
        )}
      </div>
    </div>
  );
}
