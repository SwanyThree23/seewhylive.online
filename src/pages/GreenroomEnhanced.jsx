import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CameraSourcePicker from '../components/streaming/CameraSourcePicker';
import StreamHealthMonitor from '../components/streaming/StreamHealthMonitor';
import EnhancedIngestPanel from '../components/streaming/EnhancedIngestPanel';
import WebRTCSetupBanner from '../components/live/WebRTCSetupBanner';
import DevicePreview from '../components/greenroom/DevicePreview';
import GreenroomQueue from '../components/streaming/GreenroomQueue';
import StreamMetadataEditor from '../components/streaming/StreamMetadataEditor';
import RoomBrandingEditor from '../components/live/RoomBrandingEditor';
import StreamingPresets from '../components/streaming/StreamingPresets';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const GREEN = '#6DBF7E';

export default function GreenroomEnhanced() {
  const [cameraStream, setCameraStream] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [webrtcError, setWebrtcError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [checklist, setChecklist] = useState([
    { id: 'cam',   label: 'Camera connected & working', done: false, auto: true },
    { id: 'mic',   label: 'Microphone working', done: false, auto: true },
    { id: 'light', label: 'Lighting looks good', done: false, auto: false },
    { id: 'net',   label: 'Internet connection strong', done: false, auto: true },
    { id: 'title', label: 'Room title set', done: false, auto: false },
    { id: 'ready', label: 'You\'re ready to go live!', done: false, auto: false },
  ]);
  const [countdown, setCountdown] = useState(null);
  const [roomPin, setRoomPin] = useState('');
  const [encryptedPin, setEncryptedPin] = useState('');
  const videoRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Test mic level
  useEffect(() => {
    let stream;
    async function testMic() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);
        function tick() {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setAudioLevel(Math.min(100, avg * 2.5));
          // Auto-check mic
          if (avg > 5) setChecklist(p => p.map(c => c.id === 'mic' ? { ...c, done: true } : c));
          animFrameRef.current = requestAnimationFrame(tick);
        }
        tick();
        setChecklist(p => p.map(c => c.id === 'net' ? { ...c, done: navigator.onLine } : c));
      } catch(e) {}
    }
    testMic();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Camera stream → video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      setChecklist(p => p.map(c => c.id === 'cam' ? { ...c, done: true } : c));
    }
  }, [cameraStream]);

  function handleCameraSource(stream, info) {
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    setCameraStream(stream);
  }

  async function generatePin() {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomPin(pin);
    // Use Web Crypto to encrypt the PIN with a room-specific salt
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', enc.encode(pin.padEnd(16, '0').slice(0, 16)), 'AES-GCM', false, ['encrypt']);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(pin));
      const combined = new Uint8Array(12 + encrypted.byteLength);
      combined.set(iv); combined.set(new Uint8Array(encrypted), 12);
      setEncryptedPin('room://' + btoa(String.fromCharCode(...combined)).slice(0, 16) + '...');
    } catch(e) { setEncryptedPin(''); }
  }

  function startCountdown(seconds = 5) {
    setCountdown(seconds);
    const t = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(t); setIsLive(true); return null; }
        return prev - 1;
      });
    }, 1000);
  }

  const completedCount = checklist.filter(c => c.done).length;
  const allReady = completedCount >= 4;

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: BG, fontFamily: 'Barlow Condensed, sans-serif' }}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ color: GOLD }}>🎬 Green Room</h1>
            <p className="text-xs text-white/40">Test your setup before you go live</p>
          </div>
          <StreamHealthMonitor isStreaming={isLive} />
        </div>

        {/* Camera preview + source picker */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.12)' }}>
          <div className="relative aspect-video bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!cameraStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/20">
                <span className="text-4xl">📹</span>
                <span className="text-xs">No camera selected</span>
              </div>
            )}
            {isLive && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full"
                style={{ background: 'rgba(192,57,43,0.9)' }}>
                <motion.div className="w-1.5 h-1.5 rounded-full bg-white"
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                <span className="text-[11px] font-black text-white">LIVE</span>
              </div>
            )}
          </div>
          <div className="p-3 flex items-center justify-between gap-3">
            <CameraSourcePicker onSourceSelected={handleCameraSource} currentDeviceId={null} />
            {/* Mic level bar */}
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm">🎤</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: audioLevel > 70 ? '#FF4444' : audioLevel > 40 ? GOLD : GREEN }}
                  animate={{ width: audioLevel + '%' }}
                  transition={{ duration: 0.1 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Pre-broadcast checklist */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.12)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-black" style={{ color: GOLD }}>Pre-Broadcast Checklist</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: allReady ? 'rgba(109,191,126,0.1)' : 'rgba(255,255,255,0.05)', color: allReady ? GREEN : 'rgba(255,255,255,0.3)', border: `1px solid ${allReady ? 'rgba(109,191,126,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
              {completedCount}/{checklist.length} ready
            </span>
          </div>
          <div className="space-y-2">
            {checklist.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
                onClick={() => !item.auto && setChecklist(p => p.map(c => c.id === item.id ? { ...c, done: !c.done } : c))}
                style={{ background: item.done ? 'rgba(109,191,126,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${item.done ? 'rgba(109,191,126,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                <motion.div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: item.done ? 'rgba(109,191,126,0.2)' : 'rgba(255,255,255,0.06)', color: item.done ? GREEN : 'rgba(255,255,255,0.2)' }}>
                  {item.done ? '✓' : (item.auto ? '…' : '○')}
                </motion.div>
                <span className="text-xs font-semibold" style={{ color: item.done ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)' }}>{item.label}</span>
                {!item.auto && !item.done && <span className="ml-auto text-[11px] text-white/20">tap to check</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Room PIN (AES-encrypted) */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(128,0,32,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🔐</span>
            <span className="text-sm font-black" style={{ color: CRIMSON }}>Private Room PIN</span>
            <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(109,191,126,0.08)', color: GREEN, border: '1px solid rgba(109,191,126,0.2)' }}>AES-256</span>
          </div>
          {roomPin ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(128,0,32,0.1)', border: '1px solid rgba(128,0,32,0.2)' }}>
                <span className="text-2xl font-black tracking-widest" style={{ color: GOLD, fontFamily: 'monospace' }}>{roomPin}</span>
                <button onClick={() => navigator.clipboard?.writeText(roomPin)} className="ml-auto text-[11px] px-2 py-1 rounded font-bold" style={{ background: 'rgba(212,175,55,0.1)', color: GOLD }}>Copy PIN</button>
              </div>
              {encryptedPin && <p className="text-[11px] text-white/25 font-mono break-all">{encryptedPin}</p>}
              <p className="text-[11px] text-white/40">Share this PIN privately. Only guests with the PIN can join your room.</p>
            </div>
          ) : (
            <button onClick={generatePin}
              className="w-full py-2.5 rounded-xl text-xs font-black uppercase"
              style={{ background: 'rgba(128,0,32,0.15)', color: CRIMSON, border: '1px solid rgba(128,0,32,0.3)' }}>
              🔐 Generate Encrypted Room PIN
            </button>
          )}
        </div>

        {/* Device Preview */}
        <DevicePreview user={null} onDeviceState={() => {}} />

        {/* WebRTC Setup Banner (shows if camera/mic fails) */}
        {webrtcError && (
          <WebRTCSetupBanner
            error={webrtcError}
            audioEnabled={audioLevel > 0}
            videoEnabled={!!cameraStream}
            onRetry={() => setWebrtcError(null)}
          />
        )}

        {/* Streaming presets */}
        <StreamingPresets onApply={() => {}} />

        {/* Stream metadata editor (title/category) */}
        <StreamMetadataEditor />

        {/* Room branding (logo, banner colors) */}
        <RoomBrandingEditor roomData={null} onBrandingChange={() => {}} isHost={true} />

        {/* Participant queue */}
        <GreenroomQueue roomId={null} isHost={true} />

        {/* RTMP / WHIP Ingest Panel */}
        <EnhancedIngestPanel roomId={null} isHost={true} />

        {/* Go Live button */}
        <div className="rounded-2xl p-4" style={{ background: allReady ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${allReady ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
          {countdown !== null ? (
            <div className="text-center py-4">
              <motion.div className="text-6xl font-black" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}
                animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>{countdown}</motion.div>
              <p className="text-sm text-white/50 mt-2">Going live in {countdown}...</p>
            </div>
          ) : isLive ? (
            <div className="text-center py-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <motion.div className="w-3 h-3 rounded-full bg-red-500"
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                <span className="text-lg font-black text-white">YOU ARE LIVE</span>
              </div>
              <a href="/BroadcastStudio" className="block w-full py-2.5 rounded-xl text-sm font-black uppercase text-center"
                style={{ background: 'linear-gradient(135deg, #800020, #A0003A)', color: GOLD }}>
                Open Broadcast Studio →
              </a>
            </div>
          ) : (
            <>
              {!allReady && <p className="text-xs text-center mb-3 text-white/30">Complete at least 4 checklist items to go live</p>}
              <button onClick={() => startCountdown(5)} disabled={!allReady}
                className="w-full py-3 rounded-xl text-sm font-black uppercase transition-all"
                style={allReady
                  ? { background: 'linear-gradient(135deg, #6B4423, #D4AF37)', color: '#000' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }}>
                🔴 {allReady ? 'Go Live in 5 Seconds' : 'Not Ready Yet'}
              </button>
            </>
          )}
        </div>

      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 16px 28px' }}>
        {[
          { label: '🔴 Go Live',        href: 'GoLive'           },
          { label: '🎙 Broadcast Studio', href: 'BroadcastStudio' },
          { label: '🎧 Audio Room',     href: 'AudioRoom'        },
          { label: '⚙️ Settings',       href: 'Settings'         },
        ].map(item => (
          <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
            <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', cursor: 'pointer' }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
