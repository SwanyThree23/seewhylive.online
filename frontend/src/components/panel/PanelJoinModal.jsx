// frontend/src/components/panel/PanelJoinModal.jsx
// Pre-join camera/mic preview modal for panel participants.
// User can toggle camera and mic before going live on the panel.
import { useEffect, useRef, useState } from 'react';
import panelService from '../../services/panelService';
import rtcManager from '../../webrtc.js';

var GOLD = '#C9A84C';
var CREAM = '#F0E8D4';
var BG = '#111';
var SURFACE = '#1e1e1e';
var BORDER = '#2a2a2a';
var RED = '#FF1A3C';

export default function PanelJoinModal({ socket, roomId, onJoined, onCancel }) {
  var videoRef = useRef(null);
  var streamRef = useRef(null);
  var [camOn, setCamOn] = useState(true);
  var [micOn, setMicOn] = useState(true);
  var [joining, setJoining] = useState(false);
  var [error, setError] = useState(null);
  var [camError, setCamError] = useState(false);
  var [micLevel, setMicLevel] = useState(0);
  var micAnalyserRef = useRef(null);
  var micRafRef = useRef(null);

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
      if (micRafRef.current) cancelAnimationFrame(micRafRef.current);
      try { if (micAnalyserRef.current) micAnalyserRef.current.ctx.close(); } catch (e) {}
    };
  }, []);

  // Mic level meter
  useEffect(function() {
    var stream = streamRef.current;
    if (!stream || !micOn) { setMicLevel(0); return; }
    var audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) return;
    var ctx, analyser, data;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      data = new Uint8Array(analyser.frequencyBinCount);
      micAnalyserRef.current = { ctx: ctx };
    } catch (e) { return; }
    var active = true;
    var loop = function() {
      if (!active) return;
      analyser.getByteTimeDomainData(data);
      var sum = 0;
      for (var i = 0; i < data.length; i++) { var v = (data[i] - 128) / 128; sum += v * v; }
      setMicLevel(Math.min(1, Math.sqrt(sum / data.length) * 8));
      micRafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return function() {
      active = false;
      if (micRafRef.current) cancelAnimationFrame(micRafRef.current);
      try { ctx.close(); } catch (e) {}
    };
  }, [micOn, streamRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  var toggleCam = function() {
    var stream = streamRef.current;
    if (!stream) return;
    var next = !camOn;
    stream.getVideoTracks().forEach(function(t) { t.enabled = next; });
    setCamOn(next);
  }

  var toggleMic = function() {
    var stream = streamRef.current;
    if (!stream) return;
    var next = !micOn;
    stream.getAudioTracks().forEach(function(t) { t.enabled = next; });
    setMicOn(next);
  }

  var handleJoin = async function() {
    if (joining) return;
    if (!localStorage.getItem('sw_token')) {
      setError('You must be logged in to go live on the panel');
      return;
    }
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
      var _msg = err.message || 'Failed to join panel';
      if (_msg === 'auth required') _msg = 'You must be logged in to go live on the panel';
      setError(_msg);
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

        {/* Mic level meter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#666', fontSize: 11, fontFamily: '"DM Sans", sans-serif', flexShrink: 0 }}>MIC</span>
          <div style={{ flex: 1, height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: (micOn ? Math.round(micLevel * 100) : 0) + '%',
              background: micLevel > 0.7 ? '#FF1A3C' : micLevel > 0.3 ? GOLD : '#6DBF7E',
              transition: 'width 0.08s, background 0.15s',
            }} />
          </div>
          <span style={{ color: micOn ? (micLevel > 0.05 ? GOLD : '#444') : '#444', fontSize: 11, fontFamily: '"DM Sans", sans-serif', flexShrink: 0 }}>
            {micOn ? (micLevel > 0.05 ? '●' : '○') : '✕'}
          </span>
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
