import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Mic, MicOff, RefreshCw, Volume2 } from 'lucide-react';

const GOLD = '#D4AF37';
const BURGUNDY = '#800020';

function SignalBarsIcon({ quality }) {
  const bars = [
    { h: 'h-2', threshold: 0 },
    { h: 'h-3', threshold: 1 },
    { h: 'h-4', threshold: 2 },
    { h: 'h-5', threshold: 3 },
  ];
  const color = quality >= 3 ? '#6DBF7E' : quality >= 2 ? '#D4AF37' : '#FF4444';
  return (
    <div className="flex items-end gap-0.5">
      {bars.map((b, i) => (
        <div key={i} className={`w-1.5 rounded-sm ${b.h}`}
          style={{ background: i < quality ? color : 'rgba(255,255,255,0.15)' }} />
      ))}
    </div>
  );
}

function SimulatedCamera({ user }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1A1A1A, #0D0D0D, #2A1F1F)' }}>
      {/* Scan-line animation */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          animation: 'scan 3s linear infinite',
        }} />
      <style>{`@keyframes scan { 0% { background-position: 0 0; } 100% { background-position: 0 100px; } }`}</style>
      {/* Avatar */}
      <motion.div animate={{ boxShadow: ['0 0 0 0 rgba(212,175,55,0.4)', '0 0 0 12px rgba(212,175,55,0)', '0 0 0 0 rgba(212,175,55,0.4)'] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="w-20 h-20 rounded-full overflow-hidden mb-3"
        style={{ border: `2px solid ${GOLD}` }}>
        {user?.avatar_url
          ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
          : <div className="w-full h-full flex items-center justify-center text-2xl font-black"
              style={{ background: BURGUNDY, color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
              {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>}
      </motion.div>
      <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>
        {user?.full_name || user?.email || 'You'}
      </p>
      <p className="text-[11px] mt-1 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>Camera Preview</p>
    </div>
  );
}

export default function DevicePreview({ user, onDeviceState }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [networkQuality, setNetworkQuality] = useState(3);
  const [isSim, setIsSim] = useState(false);
  const [permDenied, setPermDenied] = useState(false);
  const [devices, setDevices] = useState({ video: [], audio: [], output: [] });
  const [selectedCam, setSelectedCam] = useState('');
  const [selectedMic, setSelectedMic] = useState('');

  // Enumerate devices
  useEffect(() => {
    const enumerate = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        video: list.filter(d => d.kind === 'videoinput'),
        audio: list.filter(d => d.kind === 'audioinput'),
        output: list.filter(d => d.kind === 'audiooutput'),
      });
    };
    enumerate();
  }, []);

  // Network quality simulation
  useEffect(() => {
    const iv = setInterval(() => {
      if (navigator.connection) {
        const dl = navigator.connection.downlink;
        setNetworkQuality(dl > 10 ? 4 : dl > 5 ? 3 : dl > 1 ? 2 : 1);
      } else {
        setNetworkQuality(q => (Math.random() > 0.85 ? Math.max(2, q - 1) : Math.min(4, q + 1)));
      }
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  // Simulated mic level when isSim or micOn without real analyser
  useEffect(() => {
    if (!micOn || analyserRef.current) return;
    const iv = setInterval(() => {
      setMicLevel(Math.floor(30 + Math.random() * 60));
    }, 150);
    return () => clearInterval(iv);
  }, [micOn, isSim]);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setIsSim(true); setCameraOn(true); setMicOn(true); return; }
    try {
      const constraints = {
        video: selectedCam ? { deviceId: { exact: selectedCam } } : true,
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      // Mic analyser
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setMicLevel(Math.round((avg / 128) * 100));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
      setCameraOn(true);
      setMicOn(true);
      setPermDenied(false);
    } catch (err) {
      if (err.name === 'NotAllowedError') { setPermDenied(true); }
      else { setIsSim(true); setCameraOn(true); setMicOn(true); }
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    analyserRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setMicLevel(0);
  };

  const toggleCamera = () => { cameraOn ? stopCamera() : startCamera(); };
  const toggleMic = () => {
    if (isSim) { setMicOn(m => !m); return; }
    const tracks = streamRef.current?.getAudioTracks() || [];
    tracks.forEach(t => { t.enabled = !micOn; });
    setMicOn(m => !m);
  };

  const testSpeaker = () => {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  };

  useEffect(() => {
    onDeviceState?.({ cameraOn, micOn, networkQuality, isSim });
  }, [cameraOn, micOn, networkQuality]);

  useEffect(() => () => stopCamera(), []);

  return (
    <div className="space-y-3">
      {/* Camera preview */}
      <div className="relative w-full rounded-2xl overflow-hidden"
        style={{ aspectRatio: '16/9', border: `1px solid rgba(212,175,55,0.3)`, background: '#0D0D0D' }}>

        {/* Real camera feed */}
        <video ref={videoRef} autoPlay playsInline muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: cameraOn && !isSim ? 'block' : 'none' }} />

        {/* Simulated / camera off state */}
        {(!cameraOn || isSim) && (
          isSim && cameraOn
            ? <SimulatedCamera user={user} />
            : permDenied
              ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4"
                  style={{ background: 'rgba(128,0,32,0.15)' }}>
                  <CameraOff className="w-8 h-8 text-red-400" />
                  <p className="text-[11px] text-center font-bold text-red-300">Camera access blocked</p>
                  <p className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>Check your browser settings to allow camera access</p>
                </div>
              : <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-1"
                    style={{ border: `2px solid rgba(212,175,55,0.3)` }}>
                    {user?.avatar_url
                      ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-xl font-black"
                          style={{ background: BURGUNDY, color: GOLD }}>{(user?.full_name || 'U')[0]}</div>}
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.full_name || 'Camera Off'}</p>
                </div>
        )}

        {/* Network quality — top right */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          title="Estimated connection to SeeWhy LIVE servers">
          <SignalBarsIcon quality={networkQuality} />
          <span className="text-[11px] ml-0.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            {networkQuality >= 3 ? 'GOOD' : networkQuality >= 2 ? 'FAIR' : 'POOR'}
          </span>
        </div>

        {/* LIVE label when on */}
        {cameraOn && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[11px] font-black uppercase"
            style={{ background: 'rgba(109,191,126,0.15)', border: '1px solid rgba(109,191,126,0.3)', color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>
            ● PREVIEW
          </div>
        )}

        {/* Flip camera (mobile) */}
        <button className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)' }}
          onClick={startCamera}>
          <RefreshCw className="w-3.5 h-3.5 text-white/60" />
        </button>
      </div>

      {/* Camera toggle */}
      <div className="flex justify-center">
        <button onClick={toggleCamera}
          className="flex items-center gap-2 px-5 py-2 rounded-xl font-black uppercase text-[11px] transition-all"
          style={{
            background: cameraOn ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.06)',
            border: cameraOn ? `1px solid rgba(212,175,55,0.35)` : '1px solid rgba(255,255,255,0.12)',
            color: cameraOn ? GOLD : 'rgba(255,255,255,0.4)',
            fontFamily: 'Barlow Condensed, sans-serif',
          }}>
          {cameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
          {cameraOn ? 'Camera On' : 'Start Camera'}
        </button>
      </div>

      {/* Mic meter */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            MIC LEVEL
          </span>
          <span className="text-[11px] font-mono" style={{ color: micOn ? GOLD : 'rgba(255,255,255,0.2)' }}>
            {micOn ? micLevel : '--'}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: micOn ? `linear-gradient(90deg, ${BURGUNDY}, ${GOLD})` : 'rgba(255,255,255,0.1)' }}
            animate={{ width: micOn ? `${micLevel}%` : '0%' }}
            transition={{ duration: 0.08 }} />
        </div>
        {!micOn && <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Microphone muted</p>}
      </div>

      {/* Mic toggle + Speaker test */}
      <div className="flex gap-2">
        <button onClick={toggleMic}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-black uppercase text-[11px] transition-all"
          style={{
            background: micOn ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.04)',
            border: micOn ? `1px solid rgba(212,175,55,0.2)` : '1px solid rgba(255,255,255,0.08)',
            color: micOn ? GOLD : 'rgba(255,255,255,0.3)',
            fontFamily: 'Barlow Condensed, sans-serif',
          }}>
          {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          {micOn ? 'Mic On' : 'Mic Off'}
        </button>
        <button onClick={testSpeaker}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          <Volume2 className="w-3.5 h-3.5" /> Test Speaker
        </button>
      </div>
    </div>
  );
}