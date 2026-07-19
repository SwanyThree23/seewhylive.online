// frontend/src/components/panel/PanelJoinModal.jsx
// Pre-join camera/mic preview modal for panel participants.
// User can toggle camera and mic before going live on the panel.
import { useEffect, useRef, useState } from 'react';
import panelService from '../../services/panelService';
import rtcManager from '../../webrtc.js';

const GOLD = '#D4AF37';
const CREAM = '#F5F5DC';
const BG = '#111';
const SURFACE = '#1e1e1e';
const BORDER = '#2a2a2a';
const RED = '#dc2626';

export default function PanelJoinModal({ socket, roomId, onJoined, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [camError, setCamError] = useState(false);

  // Acquire local preview stream on mount
  useEffect(function() {
    var active = true;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(function(stream) {
        if (!active) { stream.getTracks().forEach(function(t) { t.stop(); }); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(function() {
        if (!active) return;
        setCamError(true);
        // Try audio-only fallback
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
          .then(function(audioStream) {
            if (!active) { audioStream.getTracks().forEach(function(t) { t.stop(); }); return; }
            streamRef.current = audioStream;
          })
          .catch(function() {});
      });
    return function() {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(function(t) { t.stop(); });
        streamRef.current = null;
      }
    };
  }, []);

  function toggleCam() {
    var stream = streamRef.current;
    if (!stream) return;
    var next = !camOn;
    stream.getVideoTracks().forEach(function(t) { t.enabled = next; });
    setCamOn(next);
  }

  function toggleMic() {
    var stream = streamRef.current;
    if (!stream) return;
    var next = !micOn;
    stream.getAudioTracks().forEach(function(t) { t.enabled = next; });
    setMicOn(next);
  }

  async function handleJoin() {
    if (joining) return;
    setJoining(true);
    setError(null);
    try {
      // 1. Claim a panel slot
      var slot = await panelService.joinPanel(socket, roomId, null);
      // 2. Publish stream through SFU
      var stream = streamRef.current;
      if (stream && stream.getTracks().length > 0) {
        await rtcManager.publishStream(stream);
        // Transfer ownership — modal cleanup should not stop these tracks
        streamRef.current = null;
      }
      onJoined(slot);
    } catch (err) {
      setError(err.message || 'Failed to join panel');
      setJoining(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: SURFACE,
        border: '1px solid ' + BORDER,
        borderRadius: 14,
        width: '100%', maxWidth: 360,
        padding: 24,
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        <div style={{ color: CREAM, fontSize: 18, fontWeight: 700, fontFamily: '"DM Sans", sans-serif' }}>
          Join Panel
        </div>

        {/* Camera preview */}
        <div style={{
          position: 'relative', background: BG,
          borderRadius: 10, overflow: 'hidden', aspectRatio: '4/3',
          border: '1px solid ' + BORDER,
        }}>
          {camError || !camOn ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
              <div style={{ fontSize: 40 }}>🎤</div>
              <span style={{ color: '#888', fontSize: 12, fontFamily: '"DM Sans", sans-serif' }}>
                {camError ? 'Camera unavailable' : 'Camera off'}
              </span>
            </div>
          ) : null}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              display: camError || !camOn ? 'none' : 'block',
              transform: 'scaleX(-1)',
            }}
          />
          {/* Live indicator */}
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, display: 'inline-block' }} />
            <span style={{ color: CREAM, fontSize: 10, fontFamily: '"DM Sans", sans-serif' }}>PREVIEW</span>
          </div>
        </div>

        {/* Toggle row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={toggleCam}
            disabled={camError}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid ' + BORDER,
              background: camOn && !camError ? '#2a2a2a' : RED + '33',
              color: camOn && !camError ? CREAM : RED,
              cursor: camError ? 'default' : 'pointer',
              fontFamily: '"DM Sans", sans-serif', fontSize: 13,
              opacity: camError ? 0.4 : 1,
            }}
          >
            {camOn && !camError ? '📷 Cam On' : '📷 Cam Off'}
          </button>
          <button
            onClick={toggleMic}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid ' + BORDER,
              background: micOn ? '#2a2a2a' : RED + '33',
              color: micOn ? CREAM : RED,
              cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif', fontSize: 13,
            }}
          >
            {micOn ? '🎤 Mic On' : '🎤 Mic Off'}
          </button>
        </div>

        {error && (
          <div style={{ color: RED, fontSize: 12, fontFamily: '"DM Sans", sans-serif', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={joining}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid ' + BORDER,
              background: 'transparent', color: '#888',
              cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={joining}
            style={{
              flex: 2, padding: '12px 0', borderRadius: 8, border: 'none',
              background: joining ? '#333' : GOLD,
              color: joining ? '#888' : '#111',
              cursor: joining ? 'default' : 'pointer',
              fontWeight: 700, fontFamily: '"DM Sans", sans-serif', fontSize: 14,
            }}
          >
            {joining ? 'Joining...' : '🔴 Go Live on Panel'}
          </button>
        </div>
      </div>
    </div>
  );
}
