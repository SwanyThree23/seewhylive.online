import React, { useEffect, useRef, useState } from 'react';

var OCT = 'polygon(29% 0%,71% 0%,100% 29%,100% 71%,71% 100%,29% 100%,0% 71%,0% 29%)';

function OctCell({ guest, sz, fill, handRaised, isHost, fadesMode, branding, onTap, socket, roomId, userId, rtcManager, mediaConfig, isMuted, isCamOff, onMuteToggle, onCamToggle, onCameraTrack, giftTotal }) {
  var videoRef       = useRef(null);
  var analyserRef    = useRef(null);
  var animRef        = useRef(null);
  var audioCtxRef    = useRef(null);
  var streamRef      = useRef(null);
  var flyTimersRef   = useRef(new Set());
  var [speaking,     setSpeaking]     = useState(false);
  var [online,       setOnline]       = useState(false);
  var [loading,      setLoading]      = useState(false);
  var [connQuality,  setConnQuality]  = useState('green');
  var [eqBars,       setEqBars]       = useState([0,0,0,0,0,0,0,0]);
  var [camError,     setCamError]     = useState('');
  var [streamReady,  setStreamReady]  = useState(false);
  var [retryCount,   setRetryCount]   = useState(0);
  var [flyReactions, setFlyReactions] = useState([]);

  var size      = fill ? null : (sz || 200);
  var guestId   = guest && guest.guestId ? guest.guestId : (guest && guest.userId ? guest.userId : 'unknown');
  var guestName = guest && guest.username ? guest.username : guestId;
  var isOwnCell = guestId === userId;
  var color     = fadesMode && guest && guest.teamColor ? guest.teamColor : (branding && branding.gold ? branding.gold : '#C9A84C');

  // Own cell: acquire camera immediately (no rtcManager dependency)
  useEffect(function() {
    if (!isOwnCell) return;
    var cancelled = false;
    setLoading(true);
    setCamError('');
    setStreamReady(false);

    // Stop any existing stream when mediaConfig changes
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(function(t) { t.stop(); });
      streamRef.current = null;
    }

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

        if (onCameraTrack) {
          var vt = stream.getVideoTracks()[0];
          if (vt) onCameraTrack(vt);
        }

        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(function() {});
        }

        setLoading(false);
        setOnline(true);
        initAnalyser(stream);
        setStreamReady(true);

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
  }, [isOwnCell, mediaConfig, retryCount]);

  // Own cell: publish stream once both stream and rtcManager are ready
  useEffect(function() {
    if (!isOwnCell || !streamReady || !rtcManager || !rtcManager.sendTransport) return;
    rtcManager.publishStream(streamRef.current).catch(function(e) {
      console.error('[OctCell] publishStream error:', e);
    });
  }, [isOwnCell, streamReady, rtcManager]);

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

  // Listen for reactions targeted at this seat
  useEffect(function() {
    if (!socket || !guestId) return;
    function onReaction(payload) {
      if (payload.guestId !== guestId) return;
      var id = Date.now() + Math.random();
      setFlyReactions(function(prev) { return prev.concat([{ id: id, emoji: payload.emoji, offset: Math.round(Math.random() * 40 - 20) }]); });
      flyTimersRef.current.add(setTimeout(function() {
        setFlyReactions(function(prev) { return prev.filter(function(r) { return r.id !== id; }); });
      }, 1500));
    }
    socket.on('panel:reaction', onReaction);
    return function() {
      socket.off('panel:reaction', onReaction);
      flyTimersRef.current.forEach(function(tid) { clearTimeout(tid); });
      flyTimersRef.current.clear();
    };
  }, [socket, guestId]);

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
        if (videoRef.current) {
          videoRef.current.srcObject = combined;
          videoRef.current.play().catch(function() {});
        }
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
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(function(){}); audioCtxRef.current = null; }
    analyserRef.current = null;
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
    if (!isOwnCell || !socket || !roomId) return;
    socket.emit('speaking', { roomId: roomId, guestId: userId, speaking: speaking });
  }, [speaking]);

  var ringGlow = fill ? 'none'
    : fadesMode
      ? '0 0 0 3px #FF1A3C, 0 0 14px rgba(255,26,60,.6)'
      : (speaking && !isMuted ? '0 0 0 3px ' + color + ', 0 0 12px ' + color + '88' : (online ? '0 0 0 2px rgba(201,168,76,.5)' : 'none'));

  var connDotColor = connQuality === 'green' ? '#C9A84C' : (connQuality === 'yellow' ? '#C9A84C' : '#FF1A3C');
  var avatarSz = fill ? '38%' : (Math.round(size * 0.38) + 'px');
  var avatarFs = fill ? '18px' : (Math.round(size * 0.18) + 'px');
  var nameFs   = fill ? '10px' : (Math.max(8, Math.round(size * 0.07)) + 'px');

  return (
    <div
      style={{ width: fill ? '100%' : size, height: fill ? '100%' : size, cursor: onTap ? 'pointer' : 'default', position: 'relative', flexShrink: 0 }}
      onClick={onTap ? function() { onTap(guest); } : undefined}
    >
      {/* Video container — octagonal clip or full rect depending on fill mode */}
      <div style={{ clipPath: fill ? 'none' : OCT, width: '100%', height: fill ? '100%' : '100%', position: 'relative', background: '#0E0C09', boxShadow: ringGlow }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,12,9,.8)', zIndex: 2 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + color, borderTopColor: 'transparent' }} />
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isOwnCell}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: (online && !isCamOff && !(guest && guest.remoteCamOff)) ? 'block' : 'none' }}
        />

        {/* Cam off overlay — own cell */}
        {online && isCamOff && isOwnCell && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0E0C09', gap: 4 }}>
            <div style={{ fontSize: 28 }}>🚫</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>CAM OFF</div>
          </div>
        )}
        {/* Cam off overlay — remote cell whose producer was paused */}
        {online && !isOwnCell && guest && guest.remoteCamOff && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0E0C09', gap: 4 }}>
            <div style={{ width: avatarSz, height: avatarSz, borderRadius: '50%', background: 'linear-gradient(135deg,' + color + '22,' + color + '11)', border: '2px solid ' + color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: avatarFs, color: color + '88', lineHeight: 1 }}>{guestName ? guestName.charAt(0).toUpperCase() : '?'}</span>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>CAM OFF</div>
          </div>
        )}

        {/* Offline — avatar + name */}
        {!online && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0E0C09', gap: 6 }}>
            <div style={{ width: avatarSz, height: avatarSz, borderRadius: '50%', background: 'linear-gradient(135deg,' + color + '33,' + color + '11)', border: '2px solid ' + color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: avatarFs, color: color + 'BB', lineHeight: 1 }}>
                {guestName ? guestName.charAt(0).toUpperCase() : '?'}
              </span>
            </div>
            {camError && isOwnCell ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#FF6B81', textAlign: 'center', padding: '0 6px', lineHeight: 1.3 }}>{camError}</span>
                <button onClick={function(e) { e.stopPropagation(); setCamError(''); setOnline(false); setStreamReady(false); setRetryCount(function(n) { return n + 1; }); }}
                  style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 4, padding: '2px 6px', color: '#C9A84C', cursor: 'pointer' }}>
                  RETRY
                </button>
              </div>
            ) : (
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: nameFs, color: '#8A7A62', textAlign: 'center', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guestName}</span>
            )}
          </div>
        )}

        {/* Status overlays */}
        {isMuted && isOwnCell && (
          <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,26,60,.85)', borderRadius: 999, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#fff' }}>
            🔇 MUTED
          </div>
        )}
        {!isOwnCell && guest && guest.remoteMuted && (
          <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,26,60,.75)', borderRadius: 999, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#fff' }}>
            🔇 MUTED
          </div>
        )}

        {/* Hand raised badge (shown inside video) */}
        {handRaised && (
          <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(255,140,0,.9)', borderRadius: 999, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#fff', zIndex: 5 }}>
            ✋
          </div>
        )}

        {/* Gift total badge */}
        {giftTotal > 0 && (
          <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(201,168,76,.85)', borderRadius: 999, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#0E0C09', zIndex: 5 }}>
            {'🎁 $' + (giftTotal / 100).toFixed(2)}
          </div>
        )}

        {/* Connection quality dot */}
        <div style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: connDotColor, boxShadow: '0 0 4px ' + connDotColor, border: '1px solid rgba(0,0,0,.5)' }} />
        {isHost && (
          <div style={{ position: 'absolute', top: 6, left: 6, fontSize: 11, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.8))', zIndex: 5 }}>
            👑
          </div>
        )}
        {guest && guest.role === 'mod' && !isHost && (
          <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(59,130,246,.85)', borderRadius: 999, padding: '2px 6px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#fff', zIndex: 5 }}>
            MOD
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: '50%', pointerEvents: 'none', width: 0, height: 0 }}>
          {flyReactions.map(function(r) {
            return (
              <div key={r.id} style={{ position: 'absolute', left: r.offset, bottom: 0, fontSize: 22, animation: 'panelReactFloat 1.5s ease forwards', userSelect: 'none', lineHeight: 1, pointerEvents: 'none' }}>
                {r.emoji}
              </div>
            );
          })}
        </div>
      </div>

      {/* Name bar + EQ bars — hidden in fill/rect mode (host renders footer externally) */}
      {!fill && (
        <>
          <div style={{ textAlign: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: speaking && !isMuted ? color : '#F0E8D4', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {guestName}
            {isOwnCell && <span style={{ color: '#8A7A62', fontStyle: 'italic' }}> (YOU)</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 1, height: 12, marginTop: 2 }}>
            {eqBars.map(function(h, i) {
              return <div key={i} style={{ width: 3, height: Math.max(3, h * 0.2) + 'px', backgroundColor: isMuted ? '#3D3020' : color, borderRadius: 1 }} />;
            })}
          </div>
        </>
      )}

      {/* In fill mode, show EQ bars as an overlay bar at bottom */}
      {fill && online && !isCamOff && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 1, padding: '0 0 3px', background: 'linear-gradient(transparent, rgba(14,12,9,.5))', pointerEvents: 'none', zIndex: 4 }}>
          {eqBars.map(function(h, i) {
            return <div key={i} style={{ width: 3, height: Math.max(2, h * 0.14) + 'px', backgroundColor: isMuted ? '#3D302088' : color + 'CC', borderRadius: 1 }} />;
          })}
        </div>
      )}

      {/* Own cell controls: mic + cam toggles */}
      {isOwnCell && (onMuteToggle || onCamToggle) && (
        <div style={{ position: 'absolute', top: 4, right: fill ? 28 : 4, display: 'flex', flexDirection: 'column', gap: 3, zIndex: 10 }}>
          {onMuteToggle && (
            <button
              onClick={function(e) { e.stopPropagation(); onMuteToggle(); }}
              style={{ width: 26, height: 26, borderRadius: '50%', background: isMuted ? 'rgba(255,26,60,.8)' : 'rgba(201,168,76,.5)', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? '🔇' : '🎙'}
            </button>
          )}
          {onCamToggle && (
            <button
              onClick={function(e) { e.stopPropagation(); onCamToggle(); }}
              style={{ width: 26, height: 26, borderRadius: '50%', background: isCamOff ? 'rgba(255,26,60,.8)' : 'rgba(201,168,76,.5)', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={isCamOff ? 'Turn camera on' : 'Turn camera off'}>
              {isCamOff ? '📵' : '📷'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Re-render only when the props that affect visual output actually change.
// Sibling cells' prop changes and unrelated parent re-renders are suppressed.
function areOctCellPropsEqual(prev, next) {
  var pg = prev.guest || {};
  var ng = next.guest || {};
  return (
    pg.producerId      === ng.producerId      &&
    pg.audioProducerId === ng.audioProducerId &&
    pg.speaking        === ng.speaking        &&
    pg.role             === ng.role            &&
    pg.teamColor        === ng.teamColor       &&
    pg.remoteMuted     === ng.remoteMuted     &&
    pg.remoteCamOff    === ng.remoteCamOff    &&
    pg.username        === ng.username        &&
    prev.rtcManager     === next.rtcManager    &&
    prev.isMuted        === next.isMuted       &&
    prev.isCamOff       === next.isCamOff      &&
    prev.giftTotal      === next.giftTotal     &&
    prev.handRaised     === next.handRaised    &&
    prev.isHost         === next.isHost        &&
    prev.fadesMode      === next.fadesMode     &&
    prev.branding       === next.branding
  );
}

export default React.memo(OctCell, areOctCellPropsEqual);
