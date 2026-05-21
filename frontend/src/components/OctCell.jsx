import React, { useEffect, useRef, useState } from 'react';

const OCT = 'polygon(29% 0%,71% 0%,100% 29%,100% 71%,71% 100%,29% 100%,0% 71%,0% 29%)';

export default function OctCell({ guest, sz, isHost, fadesMode, branding, onTap, socket, roomId, userId, rtcManager }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animRef = useRef(null);
  const audioCtxRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connQuality, setConnQuality] = useState('green'); // green/yellow/red
  const [eqBars, setEqBars] = useState([0,0,0,0,0,0,0,0]);
  const streamRef = useRef(null);

  const size = sz || 200;
  const guestId = guest && guest.guestId ? guest.guestId : (guest && guest.userId ? guest.userId : 'unknown');
  const guestName = guest && guest.username ? guest.username : guestId;
  const isOwnCell = guestId === userId;
  const color = fadesMode && guest && guest.teamColor ? guest.teamColor : (branding && branding.gold ? branding.gold : '#C9A84C');

  // Host cell: getUserMedia and publish
  useEffect(() => {
    if (!isOwnCell || !rtcManager) return;
    let cancelled = false;
    setLoading(true);

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: true
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
        }
        setLoading(false);
        setOnline(true);
        initAnalyser(stream);
        if (rtcManager && rtcManager.sendTransport) {
          await rtcManager.publishStream(stream);
        }
      } catch (e) {
        if (!cancelled) { setLoading(false); console.error('[OctCell] getUserMedia error:', e); }
      }
    }

    initCamera();
    return () => { cancelled = true; };
  }, [isOwnCell, rtcManager]);

  // Remote cell: subscribe to producer
  useEffect(() => {
    if (isOwnCell || !rtcManager || !guest) return;
    if (!guest.producerId) return;
    let cancelled = false;

    async function subscribeRemote() {
      try {
        setLoading(true);
        const stream = await rtcManager.subscribeToProducer(guest.producerId);
        if (cancelled) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setOnline(true);
        setLoading(false);
        initAnalyser(stream);
      } catch (e) {
        if (!cancelled) { setLoading(false); console.error('[OctCell] subscribe error:', e); }
      }
    }

    subscribeRemote();
    return () => { cancelled = true; };
  }, [isOwnCell, rtcManager, guest && guest.producerId]);

  function initAnalyser(stream) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawEQ();
    } catch (e) {
      console.error('[OctCell] AudioContext error:', e);
    }
  }

  function drawEQ() {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    function tick() {
      animRef.current = requestAnimationFrame(tick);
      analyserRef.current.getByteFrequencyData(dataArray);
      const bars = [];
      const step = Math.floor(dataArray.length / 8);
      for (let i = 0; i < 8; i++) {
        bars.push(Math.round((dataArray[i * step] / 255) * 100));
      }
      setEqBars(bars);
      const avg = bars.reduce((a, b) => a + b, 0) / bars.length;
      setSpeaking(avg > 20);
    }
    tick();
  }

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Emit speaking state to socket
  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('speaking', { roomId, guestId: userId, speaking });
  }, [speaking]);

  const ringClass = fadesMode ? 'oct-ring-corrupt' : (speaking ? 'oct-ring-speak' : (online ? 'oct-ring-active' : ''));

  return (
    <div
      className={'oct-cell' + (fadesMode ? ' fades-mode' : '')}
      style={{ width: size, height: size, cursor: onTap ? 'pointer' : 'default' }}
      onClick={onTap ? () => onTap(guest) : undefined}
    >
      {/* Octagonal clip container */}
      <div className={'oct-inner ' + ringClass} style={{ clipPath: OCT, width: '100%', height: '100%', position: 'relative', background: '#0F0C14' }}>
        {/* Loading spinner */}
        {loading && (
          <div className="oct-loading">
            <div className="oct-spinner" />
          </div>
        )}
        {/* Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isOwnCell}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: online ? 'block' : 'none' }}
        />
        {/* Offline crosshatch */}
        {!online && !loading && (
          <div className="oct-offline">
            <span className="oct-offline-name">{guestName}</span>
          </div>
        )}
        {/* Connection quality dot */}
        <div className={'conn-dot conn-dot--' + connQuality} />
      </div>

      {/* Name bar */}
      <div className="oct-name" style={{ color: speaking ? color : '#B0A0C0' }}>
        {guestName}
        {isOwnCell && <span className="oct-you-tag"> (YOU)</span>}
      </div>

      {/* EQ bars */}
      <div className="eq-bars">
        {eqBars.map((h, i) => (
          <div key={i} className="eq-bar" style={{ height: Math.max(3, h * 0.2) + 'px', backgroundColor: color }} />
        ))}
      </div>
    </div>
  );
}
