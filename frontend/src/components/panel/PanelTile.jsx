// frontend/src/components/panel/PanelTile.jsx
import { useEffect, useRef, useState } from 'react';
import panelService from '../../services/panelService';

var GOLD = '#C9A84C';
var CREAM = '#F0E8D4';
var BG = '#0E0C09';
var LIVE_RED = '#FF1A3C';

export default function PanelTile({
  socket, roomId, slot,
  isAudioOnlyRoom, isHost, micLevel, isSpeaking,
  rtcManager, producerId, audioProducerId, isLocal,
  isRaisedHand, onRaiseHand,
  onKick, onMuteToggle,
  role, isScreenSharing, remoteCamOff,
  isSpotlighted, onSpotlight,
  onExpand,
  isSwapSource, onSwap,
}) {
  var { slot_index, user_id, display_name, avatar_url, is_expanded, is_muted } = slot;
  var videoRef = useRef(null);
  var audioRef = useRef(null);
  var prevCamTrackRef = useRef(null);
  var [camActive, setCamActive] = useState(false);
  var [localCamOn, setLocalCamOn] = useState(true);
  var [localMicOn, setLocalMicOn] = useState(true);
  var [localHandRaised, setLocalHandRaised] = useState(false);
  var [showControls, setShowControls] = useState(false);
  var touchStartRef = useRef({ x: 0, y: 0 });
  var [remoteSpeaking, setRemoteSpeaking] = useState(false);
  var [connQuality, setConnQuality] = useState('green');
  var [screenSharing, setScreenSharing] = useState(false);
  var [videoSubscribeKey, setVideoSubscribeKey] = useState(0);
  var [audioSubscribeKey, setAudioSubscribeKey] = useState(0);
  var camActiveRef = useRef(false);
  useEffect(function() { camActiveRef.current = camActive; }, [camActive]);
  var remoteCamOffRef = useRef(false);
  useEffect(function() { remoteCamOffRef.current = !!remoteCamOff; }, [remoteCamOff]);

  // Reconnect: re-publish the local panel stream after RTC transport cycling.
  // PanelJoinModal publishes once at join; after reconnect those producers are gone.
  // We save track refs just before reconnect (beforeReconnect event fires before producer.close())
  // and re-publish them once the new send transport is ready.
  var localTrackRefs = useRef({ video: null, audio: null });
  var screenSharingRef = useRef(false);
  useEffect(function() { screenSharingRef.current = screenSharing; }, [screenSharing]);

  useEffect(function() {
    if (!isLocal || !rtcManager) return;
    var onBefore = function(tracks) {
      if (tracks.video) localTrackRefs.current.video = tracks.video;
      if (tracks.audio) localTrackRefs.current.audio = tracks.audio;
    };
    rtcManager.on('beforeReconnect', onBefore);
    return function() { rtcManager.off('beforeReconnect', onBefore); };
  }, [isLocal, rtcManager]);

  useEffect(function() {
    if (!isLocal || !rtcManager) return;
    var onReady = function() {
      // If producers already exist this is the initial sendTransportReady (not a reconnect).
      var hasProducers = !!(rtcManager.producers &&
        (rtcManager.producers['video'] || rtcManager.producers['audio']));
      if (hasProducers) return;
      var video = localTrackRefs.current.video;
      var audio = localTrackRefs.current.audio;
      if (!video && !audio) return;
      var s = new MediaStream();
      if (video && video.readyState !== 'ended') s.addTrack(video);
      if (audio && audio.readyState !== 'ended') s.addTrack(audio);
      if (s.getTracks().length === 0) return;
      rtcManager.publishStream(s).then(function() {
        // Restore server-side layer boost if screen share was active when reconnect happened
        if (screenSharingRef.current && socket && roomId) {
          socket.emit('screen-share-start', { roomId: roomId });
        }
      }).catch(function() {});
    };
    rtcManager.on('sendTransportReady', onReady);
    return function() { rtcManager.off('sendTransportReady', onReady); };
  }, [isLocal, rtcManager, socket, roomId]);

  // Force re-subscription when mediasoup reconnects (consumers cleared by connect())
  useEffect(function() {
    if (isLocal || !rtcManager) return;
    var onReset = function() {
      setVideoSubscribeKey(function(k) { return k + 1; });
      setAudioSubscribeKey(function(k) { return k + 1; });
    };
    rtcManager.on('rtcReset', onReset);
    return function() { rtcManager.off('rtcReset', onReset); };
  }, [isLocal, rtcManager]);

  // Re-subscribe only the affected stream when a consumer closes unexpectedly
  useEffect(function() {
    if (isLocal || !rtcManager) return;
    var onClosed = function(data) {
      if (!data) return;
      if (data.producerId === producerId)      setVideoSubscribeKey(function(k) { return k + 1; });
      if (data.producerId === audioProducerId) setAudioSubscribeKey(function(k) { return k + 1; });
    };
    rtcManager.on('consumerClosed', onClosed);
    return function() { rtcManager.off('consumerClosed', onClosed); };
  }, [isLocal, rtcManager, producerId, audioProducerId]);

  // Subscribe to remote stream or wire up local producer track
  useEffect(function() {
    if (isAudioOnlyRoom || !rtcManager) {
      setCamActive(false);
      return;
    }

    var active = true;

    if (isLocal) {
      var vp = rtcManager.producers && rtcManager.producers['video'];
      if (producerId && vp && vp.track && vp.track.readyState !== 'ended') {
        var localStream = new MediaStream([vp.track]);
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          setCamActive(true);
        }
      } else {
        setCamActive(false);
      }
      return function() {
        active = false;
        if (videoRef.current) videoRef.current.srcObject = null;
        setCamActive(false);
      };
    }

    if (!producerId) {
      setCamActive(false);
      return;
    }

    var retryCount = 0;
    var retryTimer = null;
    var doSubscribe = function() {
      rtcManager.subscribeToProducer(producerId)
        .then(function(stream) {
          if (!active) return;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(function() {});
            // Re-attempt play if browser pauses the element
            videoRef.current.onpause = function() {
              if (active && videoRef.current && videoRef.current.srcObject) {
                videoRef.current.play().catch(function() {});
              }
            };
            setCamActive(true);
          }
        })
        .catch(function() {
          if (!active) return;
          retryCount++;
          if (retryCount <= 3) {
            retryTimer = setTimeout(doSubscribe, retryCount * 2000);
          } else {
            setCamActive(false);
          }
        });
    };
    doSubscribe();

    return function() {
      active = false;
      clearTimeout(retryTimer);
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamActive(false);
    };
  }, [producerId, rtcManager, isAudioOnlyRoom, isLocal, videoSubscribeKey]);

  // Subscribe to remote audio producer for playback and speaking detection
  useEffect(function() {
    if (isLocal || !audioProducerId || !rtcManager) return;

    var active = true;
    var ctx = null;
    var raf = null;
    var holdTimer = null;
    var speaking = false;

    var audioRetryCount = 0;
    var audioRetryTimer = null;
    var doAudioSubscribe = function() {
      rtcManager.subscribeToProducer(audioProducerId)
        .then(function(stream) {
          if (!active) return;
          if (audioRef.current) {
            audioRef.current.srcObject = stream;
            audioRef.current.play().catch(function() {});
            audioRef.current.onpause = function() {
              if (active && audioRef.current && audioRef.current.srcObject) {
                audioRef.current.play().catch(function() {});
              }
            };
          }
          var tracks = stream.getAudioTracks();
          if (!tracks.length) return;
          try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            var analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            ctx.createMediaStreamSource(stream).connect(analyser);
            var data = new Uint8Array(analyser.frequencyBinCount);
            var loop = function() {
              analyser.getByteTimeDomainData(data);
              var sum = 0;
              for (var i = 0; i < data.length; i++) {
                var v = (data[i] - 128) / 128;
                sum += v * v;
              }
              var rms = Math.sqrt(sum / data.length);
              if (rms > 0.01) {
                clearTimeout(holdTimer);
                if (!speaking) { speaking = true; if (active) setRemoteSpeaking(true); }
              } else if (speaking) {
                holdTimer = setTimeout(function() {
                  speaking = false;
                  if (active) setRemoteSpeaking(false);
                }, 400);
              }
              raf = requestAnimationFrame(loop);
            }
            raf = requestAnimationFrame(loop);
          } catch (e) {}
        })
        .catch(function() {
          if (!active) return;
          audioRetryCount++;
          if (audioRetryCount <= 3) {
            audioRetryTimer = setTimeout(doAudioSubscribe, audioRetryCount * 2000);
          }
        });
    };
    doAudioSubscribe();

    return function() {
      active = false;
      clearTimeout(audioRetryTimer);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(holdTimer);
      try { if (ctx) ctx.close(); } catch (e) {}
      if (audioRef.current) audioRef.current.srcObject = null;
    };
  }, [audioProducerId, rtcManager, isLocal, audioSubscribeKey]);

  // Freeze detection: re-subscribe remote tile if video currentTime stops advancing for ~10s
  useEffect(function() {
    if (isLocal || !producerId || !rtcManager) return;
    var prevTime = -1;
    var stuckCount = 0;
    var timer = setInterval(function() {
      var v = videoRef.current;
      if (!v || !v.srcObject || !camActiveRef.current || remoteCamOffRef.current) { stuckCount = 0; prevTime = -1; return; }
      var ct = v.currentTime;
      if (ct > 0 && ct === prevTime) {
        stuckCount++;
        if (stuckCount >= 2) {
          stuckCount = 0;
          prevTime = -1;
          setVideoSubscribeKey(function(k) { return k + 1; });
        }
      } else {
        stuckCount = 0;
        prevTime = ct;
      }
    }, 5000);
    return function() { clearInterval(timer); };
  }, [isLocal, producerId, rtcManager]);

  // Emit speaking event for local panelist so server upgrades simulcast layer
  useEffect(function() {
    if (!isLocal || !socket || !roomId || !user_id) return;
    socket.emit('speaking', { roomId: roomId, guestId: user_id, speaking: isSpeaking });
  }, [isLocal, isSpeaking, socket, roomId, user_id]);

  // Connection quality from RTC stats (local tile only)
  useEffect(function() {
    if (!isLocal || !rtcManager) return;
    var onStats = function(stats) {
      var q;
      if (stats.lossPct > 15 || (stats.rttMs !== null && stats.rttMs > 300)) q = 'red';
      else if (stats.lossPct > 5 || (stats.rttMs !== null && stats.rttMs > 150)) q = 'yellow';
      else q = 'green';
      setConnQuality(q);
    };
    rtcManager.on('stats', onStats);
    return function() { rtcManager.off('stats', onStats); };
  }, [isLocal, rtcManager]);

  useEffect(function() {
    if (!rtcManager) return;
    var onState = function(info) {
      if (info.state === 'failed' || info.state === 'closed') setConnQuality('red');
      else if (info.state === 'disconnected') setConnQuality('yellow');
      else if (info.state === 'connected') setConnQuality('green');
    };
    rtcManager.on('transportState', onState);
    return function() { rtcManager.off('transportState', onState); };
  }, [rtcManager]);

  // Per-consumer recv quality indicator for remote tiles
  useEffect(function() {
    if (isLocal || !rtcManager || !producerId) return;
    var onConsumerStats = function(data) {
      if (!data || data.producerId !== producerId) return;
      var q;
      if (data.bitratekbps > 0 && data.bitratekbps < 80) q = 'red';
      else if (data.bitratekbps > 0 && data.bitratekbps < 250) q = 'yellow';
      else q = 'green';
      setConnQuality(q);
    };
    rtcManager.on('consumerStats', onConsumerStats);
    return function() { rtcManager.off('consumerStats', onConsumerStats); };
  }, [isLocal, rtcManager, producerId]);

  var effectiveSpeaking = isLocal ? isSpeaking : remoteSpeaking;

  var handleTileClick = function(e) {
    // Don't expand if clicking a control button
    if (e.target.closest && e.target.closest('[data-panel-ctrl]')) return;
    if (socket) panelService.expandTile(socket, roomId, slot_index, !is_expanded);
  }

  var toggleLocalCam = function() {
    if (!rtcManager) return;
    var vp = rtcManager.producers && rtcManager.producers['video'];
    if (!vp) return;
    var next = !localCamOn;
    vp.track.enabled = next;
    setLocalCamOn(next);
    if (!next) {
      rtcManager.pauseProducer('video');
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamActive(false);
    } else if (vp.track.readyState !== 'ended') {
      rtcManager.resumeProducer('video');
      if (videoRef.current) videoRef.current.srcObject = new MediaStream([vp.track]);
      setCamActive(true);
    }
  }

  var toggleLocalMic = function() {
    if (!rtcManager) return;
    var ap = rtcManager.producers && rtcManager.producers['audio'];
    if (!ap) return;
    var next = !localMicOn;
    ap.track.enabled = next;
    setLocalMicOn(next);
    if (socket) panelService.mutePanelist(socket, roomId, user_id, !next);
  }

  var toggleRaiseHand = function() {
    var next = !localHandRaised;
    setLocalHandRaised(next);
    if (onRaiseHand) onRaiseHand(next);
  }

  var prevMicTrackRef = useRef(null); // saved mic track for restoration after screen audio

  var toggleScreenShare = function() {
    if (!rtcManager) return;
    if (screenSharing) {
      setScreenSharing(false);
      if (socket && roomId) socket.emit('screen-share-stop', { roomId: roomId });
      // Restore camera track
      var vp = rtcManager.producers && rtcManager.producers['video'];
      var _camSimulcast = [
        { rid: 'r0', maxBitrate: 99000,  scaleResolutionDownBy: 4 },
        { rid: 'r1', maxBitrate: 297000, scaleResolutionDownBy: 2 },
        { rid: 'r2', maxBitrate: 900000, scaleResolutionDownBy: 1 },
      ];
      if (vp && prevCamTrackRef.current) {
        var _ct = prevCamTrackRef.current;
        if ('contentHint' in _ct) _ct.contentHint = 'motion';
        rtcManager.replaceTrack('video', _ct).catch(function() {});
        rtcManager.setVideoEncodings(_camSimulcast).catch(function() {});
        prevCamTrackRef.current = null;
      } else if (vp) {
        navigator.mediaDevices.getUserMedia({ video: true }).then(function(s) {
          var t = s.getVideoTracks()[0];
          if (t) {
            if ('contentHint' in t) t.contentHint = 'motion';
            rtcManager.replaceTrack('video', t).catch(function() {});
            rtcManager.setVideoEncodings(_camSimulcast).catch(function() {});
          }
        }).catch(function() {});
      }
      // Restore microphone if screen audio was captured
      if (prevMicTrackRef.current) {
        rtcManager.replaceTrack('audio', prevMicTrackRef.current).catch(function() {});
        prevMicTrackRef.current = null;
      }
    } else {
      navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: { sampleRate: 48000, channelCount: 2, echoCancellation: false, noiseSuppression: false }
      }).then(function(displayStream) {
        var screenTrack = displayStream.getVideoTracks()[0];
        if (!screenTrack) { displayStream.getTracks().forEach(function(t) { t.stop(); }); return; }
        if ('contentHint' in screenTrack) screenTrack.contentHint = 'detail';
        var vp = rtcManager.producers && rtcManager.producers['video'];
        if (vp) prevCamTrackRef.current = vp.track;
        screenTrack.addEventListener('ended', function() {
          setScreenSharing(false);
          if (socket && roomId) socket.emit('screen-share-stop', { roomId: roomId });
          var camTrack = prevCamTrackRef.current;
          if (vp && camTrack) {
            if ('contentHint' in camTrack) camTrack.contentHint = 'motion';
            rtcManager.replaceTrack('video', camTrack).catch(function() {});
            rtcManager.setVideoEncodings([
              { rid: 'r0', maxBitrate: 99000,  scaleResolutionDownBy: 4 },
              { rid: 'r1', maxBitrate: 297000, scaleResolutionDownBy: 2 },
              { rid: 'r2', maxBitrate: 900000, scaleResolutionDownBy: 1 },
            ]).catch(function() {});
            prevCamTrackRef.current = null;
          }
          if (prevMicTrackRef.current) {
            rtcManager.replaceTrack('audio', prevMicTrackRef.current).catch(function() {});
            prevMicTrackRef.current = null;
          }
        });
        rtcManager.replaceTrack('video', screenTrack).then(function() {
          // Switch to screen-optimized simulcast (text/slides readable; less resolution downscaling)
          rtcManager.setVideoEncodings([
            { rid: 'r0', maxBitrate: 300000,  scaleResolutionDownBy: 2 },
            { rid: 'r1', maxBitrate: 800000,  scaleResolutionDownBy: 1 },
            { rid: 'r2', maxBitrate: 2000000, scaleResolutionDownBy: 1 },
          ]).catch(function() {});
          // Capture screen audio if available (tab/window audio on Chrome)
          var screenAudioTrack = displayStream.getAudioTracks()[0];
          var ap = rtcManager.producers && rtcManager.producers['audio'];
          if (screenAudioTrack && ap && ap.track) {
            prevMicTrackRef.current = ap.track;
            rtcManager.replaceTrack('audio', screenAudioTrack).catch(function() {});
          }
          setScreenSharing(true);
          if (socket && roomId) socket.emit('screen-share-start', { roomId: roomId });
        }).catch(function() {
          displayStream.getTracks().forEach(function(t) { t.stop(); });
        });
      }).catch(function() {});
    }
  }

  var renderLocalControls = function() {
    if (!isLocal) return null;
    return (
      <div
        data-panel-ctrl="1"
        style={{
          position: 'absolute', bottom: 24, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 8,
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: showControls ? 'auto' : 'none',
        }}
      >
        {!isAudioOnlyRoom && !screenSharing && (
          <button
            onClick={toggleLocalCam}
            style={{
              background: localCamOn ? 'rgba(0,0,0,0.7)' : LIVE_RED,
              border: 'none', borderRadius: 20, width: 32, height: 32,
              color: CREAM, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title={localCamOn ? 'Turn camera off' : 'Turn camera on'}
          >
            {localCamOn ? '📷' : '🚫'}
          </button>
        )}
        <button
          onClick={toggleLocalMic}
          style={{
            background: localMicOn ? 'rgba(0,0,0,0.7)' : LIVE_RED,
            border: 'none', borderRadius: 20, width: 32, height: 32,
            color: CREAM, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title={localMicOn ? 'Mute mic' : 'Unmute mic'}
        >
          {localMicOn ? '🎤' : '🔇'}
        </button>
        <button
          onClick={toggleRaiseHand}
          style={{
            background: localHandRaised ? GOLD : 'rgba(0,0,0,0.7)',
            border: 'none', borderRadius: 20, width: 32, height: 32,
            color: localHandRaised ? '#111' : CREAM, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title={localHandRaised ? 'Lower hand' : 'Raise hand'}
        >
          ✋
        </button>
        {!isAudioOnlyRoom && rtcManager && role !== 'viewer' && (
          <button
            onClick={toggleScreenShare}
            style={{
              background: screenSharing ? GOLD : 'rgba(0,0,0,0.7)',
              border: 'none', borderRadius: 20, width: 32, height: 32,
              color: screenSharing ? '#111' : CREAM, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title={screenSharing ? 'Stop screen share' : 'Share screen'}
          >
            🖥
          </button>
        )}
      </div>
    );
  }

  var renderHostControls = function() {
    if (!isHost || isLocal || !onKick) return null;
    return (
      <div
        data-panel-ctrl="1"
        style={{
          position: 'absolute', top: 4, left: 4,
          display: 'flex', gap: 4,
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: showControls ? 'auto' : 'none',
        }}
      >
        {onSpotlight && (
          <button
            onClick={onSpotlight}
            style={{
              background: isSpotlighted ? GOLD : 'rgba(0,0,0,0.75)', border: 'none', borderRadius: 4,
              padding: '3px 6px', fontSize: 10, color: isSpotlighted ? '#111' : CREAM, cursor: 'pointer',
            }}
            title={isSpotlighted ? 'Remove spotlight' : 'Spotlight this guest'}
          >
            ✦
          </button>
        )}
        {onExpand && (
          <button
            onClick={onExpand}
            style={{
              background: is_expanded ? GOLD : 'rgba(0,0,0,0.75)', border: 'none', borderRadius: 4,
              padding: '3px 6px', fontSize: 10, color: is_expanded ? '#111' : CREAM, cursor: 'pointer',
            }}
            title={is_expanded ? 'Collapse tile' : 'Expand tile'}
          >
            {is_expanded ? '⤤' : '⤢'}
          </button>
        )}
        {onMuteToggle && (
          <button
            onClick={function() { onMuteToggle(!is_muted); }}
            style={{
              background: 'rgba(0,0,0,0.75)', border: 'none', borderRadius: 4,
              padding: '3px 6px', fontSize: 10, color: CREAM, cursor: 'pointer',
            }}
            title={is_muted ? 'Unmute' : 'Mute'}
          >
            {is_muted ? '🔇' : '🎤'}
          </button>
        )}
        {onSwap && (
          <button
            onClick={onSwap}
            style={{
              background: isSwapSource ? GOLD : 'rgba(0,0,0,0.75)',
              border: isSwapSource ? ('1px solid ' + GOLD) : 'none',
              borderRadius: 4, padding: '3px 6px', fontSize: 10,
              color: isSwapSource ? '#111' : CREAM, cursor: 'pointer',
            }}
            title={isSwapSource ? 'Cancel swap' : 'Swap slot position'}
          >
            ⇄
          </button>
        )}
        <button
          onClick={onKick}
          style={{
            background: LIVE_RED + 'cc', border: 'none', borderRadius: 4,
            padding: '3px 6px', fontSize: 10, color: CREAM, cursor: 'pointer',
            fontFamily: '"DM Sans", sans-serif',
          }}
          title={'Remove ' + display_name + ' from panel'}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={handleTileClick}
      onMouseEnter={function() { setShowControls(true); }}
      onMouseLeave={function() { setShowControls(false); }}
      onTouchStart={function(e) { touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
      onTouchEnd={function(e) {
        var dx = e.changedTouches[0].clientX - touchStartRef.current.x;
        var dy = e.changedTouches[0].clientY - touchStartRef.current.y;
        if (Math.abs(dx) < 15 && Math.abs(dy) < 15) { setShowControls(function(v) { return !v; }); return; }
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx < -40 && onMuteToggle) { onMuteToggle(!is_muted); return; }
          if (dx > 40 && onSpotlight) { onSpotlight(); return; }
        }
      }}
      style={{
        position: 'relative',
        background: BG,
        borderRadius: 8,
        overflow: 'hidden',
        border: isSwapSource
          ? ('2px solid ' + GOLD)
          : effectiveSpeaking
            ? ('2px solid ' + GOLD)
            : slot_index === 0
              ? ('2px solid ' + GOLD)
              : '1px solid #333',
        animation: effectiveSpeaking ? 'panelSpeakPulse 1.4s ease-in-out infinite' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        aspectRatio: '9/16',
      }}
    >
      {isAudioOnlyRoom ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <img
            src={avatar_url}
            alt={display_name}
            style={{
              width: 56, height: 56, borderRadius: '50%',
              boxShadow: effectiveSpeaking ? ('0 0 0 3px ' + GOLD + ', 0 0 12px ' + GOLD + '66') : 'none',
              transition: 'box-shadow 0.15s',
            }}
          />
          <div style={{ display: 'flex', gap: 2, marginTop: 8, alignItems: 'flex-end' }}>
            {[0.25, 0.5, 1, 0.6, 0.35].map(function(scale, i) {
              var level = micLevel || 0;
              var barH = 4 + Math.min(24, Math.round(level * scale * 0.32));
              return (
                <span
                  key={i}
                  style={{
                    width: 3, height: barH + 'px',
                    background: effectiveSpeaking ? GOLD : 'rgba(212,175,55,0.35)',
                    borderRadius: 2, transition: 'height 0.08s, background 0.15s',
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', background: '#000', position: 'relative' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={!!isLocal}
            style={{
              width: '100%', height: '100%',
              objectFit: (isScreenSharing || screenSharing) ? 'contain' : 'cover',
              display: camActive ? 'block' : 'none',
            }}
          />
          {!camActive && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
              {avatar_url ? (
                <img src={avatar_url} alt={display_name} style={{ width: 56, height: 56, borderRadius: '50%', opacity: 0.7 }} />
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: '#333',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: CREAM, fontSize: 22, fontFamily: '"DM Sans", sans-serif',
                }}>
                  {(display_name || '?')[0].toUpperCase()}
                </div>
              )}
              <span style={{ color: '#666', fontSize: 10, fontFamily: '"DM Sans", sans-serif' }}>
                {(isLocal && !localCamOn) || (!isLocal && remoteCamOff) ? 'Camera off' : 'Connecting...'}
              </span>
            </div>
          )}
          {/* Remote cam-off overlay: show when producer is paused by the remote panelist */}
          {!isLocal && remoteCamOff && camActive && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,12,9,.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 4 }}>
              {avatar_url ? (
                <img src={avatar_url} alt={display_name} style={{ width: 48, height: 48, borderRadius: '50%', opacity: 0.6 }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: CREAM, fontSize: 20, fontFamily: '"DM Sans", sans-serif' }}>
                  {(display_name || '?')[0].toUpperCase()}
                </div>
              )}
              <span style={{ color: '#666', fontSize: 10, fontFamily: '"DM Sans", sans-serif' }}>Camera off</span>
            </div>
          )}
        </div>
      )}

      {/* Screen sharing badge */}
      {isScreenSharing && (
        <div style={{
          position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)', border: '1px solid ' + GOLD,
          borderRadius: 999, padding: '2px 8px', fontSize: 9, color: GOLD,
          fontFamily: '"DM Sans", sans-serif', whiteSpace: 'nowrap', zIndex: 6,
        }}>
          SCREEN
        </div>
      )}

      {/* Name label */}
      <div style={{ position: 'absolute', bottom: 4, left: 4, color: CREAM, fontSize: 11, fontFamily: '"DM Sans", sans-serif', textShadow: '0 1px 2px #000', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>{display_name}</span>
        {isLocal && <span style={{ color: GOLD, fontSize: 10 }}>You</span>}
        {role && role !== 'viewer' && (
          <span style={{
            fontSize: 9, textTransform: 'uppercase', fontFamily: '"DM Sans", sans-serif',
            color: role === 'host' ? GOLD : '#818cf8',
            background: 'rgba(0,0,0,0.5)', borderRadius: 3, padding: '1px 3px',
          }}>{role}</span>
        )}
      </div>

      {/* Speaking / connection quality indicator */}
      {!isAudioOnlyRoom && isLocal && rtcManager ? (
        <span
          style={{
            position: 'absolute', bottom: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: effectiveSpeaking ? GOLD
              : connQuality === 'green' ? '#6DBF7E'
              : connQuality === 'yellow' ? '#F0A500'
              : LIVE_RED,
            boxShadow: '0 0 6px ' + (effectiveSpeaking ? GOLD
              : connQuality === 'green' ? '#6DBF7E'
              : connQuality === 'yellow' ? '#F0A500'
              : LIVE_RED),
            transition: 'background 0.3s',
          }}
          title={effectiveSpeaking ? 'Speaking' : connQuality === 'green' ? 'Connection good' : connQuality === 'yellow' ? 'Connection unstable' : 'Connection poor'}
        />
      ) : (
        effectiveSpeaking && !isAudioOnlyRoom && (
          <span style={{ position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: GOLD, boxShadow: '0 0 6px ' + GOLD }} />
        )
      )}

      {/* Muted badge */}
      {is_muted && (
        <span style={{ position: 'absolute', top: 4, right: 4, background: LIVE_RED, borderRadius: 4, padding: '2px 4px', fontSize: 10, color: CREAM }}>
          MUTED
        </span>
      )}

      {/* Raised-hand badge */}
      {isRaisedHand && (
        <span style={{ position: 'absolute', top: 4, right: is_muted ? 48 : 4, fontSize: 18, filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.8))' }}>
          ✋
        </span>
      )}

      {/* Hidden audio element for remote panelist audio playback */}
      <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />

      {/* Local cam/mic controls (shown on hover) */}
      {renderLocalControls()}

      {/* Host kick/mute controls (shown on hover) */}
      {renderHostControls()}
    </div>
  );
}
