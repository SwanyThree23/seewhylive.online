import React, { useEffect, useRef, useState } from 'react';

const OCT = 'polygon(29% 0%,71% 0%,100% 29%,100% 71%,71% 100%,29% 100%,0% 71%,0% 29%)';

export default function OctCell({ guest, sz, isHost, fadesMode, branding, onTap, socket, roomId, userId, rtcManager, mediaConfig, isMuted, isCamOff, onMuteToggle, onCamToggle }) {
  const videoRef    = useRef(null);
  const analyserRef = useRef(null);
  const animRef     = useRef(null);
  const audioCtxRef = useRef(null);
  const streamRef   = useRef(null);
  const [speaking,    setSpeaking]    = useState(false);
  const [online,      setOnline]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [connQuality, setConnQuality] = useState('green');
  const [eqBars,      setEqBars]      = useState([0,0,0,0,0,0,0,0]);
  const [camError,    setCamError]    = useState('');

  const size      = sz || 200;
  const guestId   = guest && guest.guestId ? guest.guestId : (guest && guest.userId ? guest.userId : 'unknown');
  const guestName = guest && guest.username ? guest.username : guestId;
  const isOwnCell = guestId === userId;
  const color     = fadesMode && guest && guest.teamColor ? guest.teamColor : (branding && branding.gold ? branding.gold : '#C9A84C');

  // Own cell: getUserMedia and publish
  useEffect(function() {
    if (!isOwnCell || !rtcManager) return;
    var cancelled = false;
    setLoading(true);
    setCamError('');

    async function initCamera() {
      try {
        var preset = mediaConfig && mediaConfig.preset ? mediaConfig.preset : { width: 1280, height: 720, frameRate: 30 };
        var videoConstraints = {
          width:     { ideal: preset.width },
          height:    { ideal: preset.height },
          frameRate: { ideal: preset.frameRate },
        };
        if (mediaConfig && mediaConfig.camId) {
          videoConstraints.deviceId = { exact: mediaConfig.camId };
        } else {
          videoConstraints.facingMode = mediaConfig && !mediaConfig.facingFront ? 'environment' : 'user';
        }
        var audioConstraints = {
          noiseSuppression: mediaConfig ? mediaConfig.noiseSup !== false : true,
          echoCancellation: mediaConfig ? mediaConfig.echoCan  !== false : true,
          autoGainControl:  mediaConfig ? mediaConfig.autoGain !== false : true,
        };
        if (mediaConfig && mediaConfig.micId) audioConstraints.deviceId = { exact: mediaConfig.micId };

        // If mediaConfig has a pre-acquired stream from the config panel, reuse it
        var stream;
        if (mediaConfig && mediaConfig.stream && mediaConfig.stream.active) {
          stream = mediaConfig.stream;
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: audioConstraints,
          });
        }

        if (cancelled) { stream.getTracks().forEach(function(t) { t.stop(); }); return; }
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

        // Apply mute/cam state immediately if set before stream started
        if (isMuted) {
          stream.getAudioTracks().forEach(function(t) { t.enabled = false; });
        }
        if (isCamOff) {
          stream.getVideoTracks().forEach(function(t) { t.enabled = false; });
        }

      } catch(e) {
        if (!cancelled) {
          setLoading(false);
          setCamError(e.name === 'NotAllowedError' ? 'Permission denied' : e.message);
          console.error('[OctCell] getUserMedia error:', e);
        }
      }
    }

    initCamera();
    return function() { cancelled = true; };
  }, [isOwnCell, rtcManager, mediaConfig]);

  // Apply mute state to local audio tracks
  useEffect(function() {
    if (!isOwnCell || !streamRef.current) return;
    streamRef.current.getAudioTracks().forEach(function(t) {
      t.enabled = !isMuted;
    });
    if (rtcManager) {
      if (isMuted) {
        rtcManager.pauseProducer('audio');
      } else {
        rtcManager.resumeProducer('audio');
      }
    }
  }, [isMuted, isOwnCell]);

  // Apply cam off state to local video tracks
  useEffect(function() {
    if (!isOwnCell || !streamRef.current) return;
    streamRef.current.getVideoTracks().forEach(function(t) {
      t.enabled = !isCamOff;
    });
    if (rtcManager) {
      if (isCamOff) {
        rtcManager.pauseProducer('video');
      } else {
        rtcManager.resumeProducer('video');
      }
    }
  }, [isCamOff, isOwnCell]);

  // Remote cell: subscribe to video + audio producers
  useEffect(function() {
    if (isOwnCell || !rtcManager || !guest) return;
    if (!guest.producerId) return;
    var cancelled = false;

    async function subscribeRemote() {
      try {
        setLoading(true);
        var videoStream = await rtcManager.subscribeToProducer(guest.producerId);
        if (cancelled) return;

        var combined = new MediaStream(videoStream.getTracks());

        if (guest.audioProducerId) {
          try {
            var audioStream = await rtcManager.subscribeToProducer(guest.audioProducerId);
            audioStream.getAudioTracks().forEach(function(t) { combined.addTrack(t); });
          } catch(ae) {
            console.warn('[OctCell] audio subscribe failed:', ae.message);
          }
        }

        if (cancelled) return;
        streamRef.current = combined;
        if (videoRef.current) videoRef.current.srcObject = combined;
        setOnline(true);
        setLoading(false);
        initAnalyser(combined);
      } catch(e) {
        if (!cancelled) { setLoading(false); console.error('[OctCell] subscribe error:', e); }
      }
    }

    subscribeRemote();
    return function() { cancelled = true; };
  }, [isOwnCell, rtcManager, guest && guest.producerId, guest && guest.audioProducerId]);

  function initAnalyser(stream) {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      var audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      var source = audioCtx.createMediaStreamSource(stream);
      var analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawEQ();
    } catch(e) {
      console.error('[OctCell] AudioContext error:', e);
    }
  }

  function drawEQ() {
    if (!analyserRef.current) return;
    var dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    function tick() {
      animRef.current = requestAnimationFrame(tick);
      analyserRef.current.getByteFrequencyData(dataArray);
      var bars = [];
      var step = Math.floor(dataArray.length / 8);
      for (var i = 0; i < 8; i++) {
        bars.push(Math.round((dataArray[i * step] / 255) * 100));
      }
      setEqBars(bars);
      var avg = bars.reduce(function(a, b) { return a + b; }, 0) / bars.length;
      setSpeaking(avg > 20);
    }
    tick();
  }

  useEffect(function() {
    return function() {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(function(){});
      if (streamRef.current) streamRef.current.getTracks().forEach(function(t) { t.stop(); });
    };
  }, []);

  useEffect(function() {
    if (!socket || !roomId) return;
    socket.emit('speaking', { roomId: roomId, guestId: userId, speaking: speaking });
  }, [speaking]);

  var ringClass = fadesMode ? 'oct-ring-corrupt' : (speaking && !isMuted ? 'oct-ring-speak' : (online ? 'oct-ring-active' : ''));

  return (
    <div
      className={'oct-cell' + (fadesMode ? ' fades-mode' : '')}
      style={{ width: size, height: size, cursor: onTap ? 'pointer' : 'default', position: 'relative' }}
      onClick={onTap ? function() { onTap(guest); } : undefined}
    >
      {/* Octagonal clip container */}
      <div className={'oct-inner ' + ringClass} style={{ clipPath: OCT, width: '100%', height: '100%', position: 'relative', background: '#0F0C14' }}>
        {loading && (
          <div className="oct-loading">
            <div className="oct-spinner" />
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isOwnCell}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: (online && !isCamOff) ? 'block' : 'none' }}
        />

        {/* Cam off overlay */}
        {online && isCamOff && isOwnCell && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#07050A', gap: 4 }}>
            <div style={{ fontSize: 28 }}>🚫</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>CAM OFF</div>
          </div>
        )}

        {/* Offline crosshatch */}
        {!online && !loading && (
          <div className="oct-offline">
            {camError ? (
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81', textAlign: 'center', padding: '0 8px' }}>{camError}</span>
            ) : (
              <span className="oct-offline-name">{guestName}</span>
            )}
          </div>
        )}

        {/* Status overlays */}
        {isMuted && isOwnCell && (
          <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,26,60,.85)', borderRadius: 999, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#fff' }}>
            🔇 MUTED
          </div>
        )}

        {/* Connection quality dot */}
        <div className={'conn-dot conn-dot--' + connQuality} />
      </div>

      {/* Name bar */}
      <div className="oct-name" style={{ color: speaking && !isMuted ? color : '#B0A0C0' }}>
        {guestName}
        {isOwnCell && <span className="oct-you-tag"> (YOU)</span>}
      </div>

      {/* EQ bars */}
      <div className="eq-bars">
        {eqBars.map(function(h, i) {
          return <div key={i} className="eq-bar" style={{ height: Math.max(3, h * 0.2) + 'px', backgroundColor: isMuted ? '#241C34' : color }} />;
        })}
      </div>

      {/* Own cell controls: mic + cam toggles */}
      {isOwnCell && (onMuteToggle || onCamToggle) && (
        <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', flexDirection: 'column', gap: 3, zIndex: 10 }}>
          {onMuteToggle && (
            <button
              onClick={function(e) { e.stopPropagation(); onMuteToggle(); }}
              style={{ width: 26, height: 26, borderRadius: '50%', background: isMuted ? 'rgba(255,26,60,.8)' : 'rgba(0,201,167,.5)', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? '🔇' : '🎙'}
            </button>
          )}
          {onCamToggle && (
            <button
              onClick={function(e) { e.stopPropagation(); onCamToggle(); }}
              style={{ width: 26, height: 26, borderRadius: '50%', background: isCamOff ? 'rgba(255,26,60,.8)' : 'rgba(0,201,167,.5)', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={isCamOff ? 'Turn camera on' : 'Turn camera off'}>
              {isCamOff ? '📵' : '📷'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
