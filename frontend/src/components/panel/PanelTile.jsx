// frontend/src/components/panel/PanelTile.jsx
import { useEffect, useRef, useState } from 'react';
import panelService from '../../services/panelService';

const GOLD = '#D4AF37';
const CREAM = '#F5F5DC';
const BG = '#1a1a1a';
const LIVE_RED = '#dc2626';

export default function PanelTile({
  socket, roomId, slot,
  isAudioOnlyRoom, isHost, micLevel, isSpeaking,
  rtcManager, producerId, audioProducerId, isLocal,
  isRaisedHand, onRaiseHand,
  onKick, onMuteToggle,
  role, isScreenSharing,
  isSpotlighted, onSpotlight,
}) {
  const { slot_index, user_id, display_name, avatar_url, is_expanded, is_muted } = slot;
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [camActive, setCamActive] = useState(false);
  const [localCamOn, setLocalCamOn] = useState(true);
  const [localMicOn, setLocalMicOn] = useState(true);
  const [localHandRaised, setLocalHandRaised] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);

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

    rtcManager.subscribeToProducer(producerId)
      .then(function(stream) {
        if (!active) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCamActive(true);
        }
      })
      .catch(function() { if (active) setCamActive(false); });

    return function() {
      active = false;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamActive(false);
    };
  }, [producerId, rtcManager, isAudioOnlyRoom, isLocal]);

  // Subscribe to remote audio producer for playback and speaking detection
  useEffect(function() {
    if (isLocal || !audioProducerId || !rtcManager) return;

    var active = true;
    var ctx = null;
    var raf = null;
    var holdTimer = null;
    var speaking = false;

    rtcManager.subscribeToProducer(audioProducerId)
      .then(function(stream) {
        if (!active) return;
        if (audioRef.current) {
          audioRef.current.srcObject = stream;
          audioRef.current.play().catch(function() {});
        }
        var tracks = stream.getAudioTracks();
        if (!tracks.length) return;
        try {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          var analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          ctx.createMediaStreamSource(stream).connect(analyser);
          var data = new Uint8Array(analyser.frequencyBinCount);
          function loop() {
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
      .catch(function() {});

    return function() {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(holdTimer);
      try { if (ctx) ctx.close(); } catch (e) {}
      if (audioRef.current) audioRef.current.srcObject = null;
    };
  }, [audioProducerId, rtcManager, isLocal]);

  var effectiveSpeaking = isLocal ? isSpeaking : remoteSpeaking;

  function handleTileClick(e) {
    // Don't expand if clicking a control button
    if (e.target.closest && e.target.closest('[data-panel-ctrl]')) return;
    if (socket) panelService.expandTile(socket, roomId, slot_index, !is_expanded);
  }

  function toggleLocalCam() {
    if (!rtcManager) return;
    var vp = rtcManager.producers && rtcManager.producers['video'];
    if (!vp) return;
    var next = !localCamOn;
    vp.track.enabled = next;
    setLocalCamOn(next);
    if (!next && videoRef.current) videoRef.current.srcObject = null;
    if (next && vp.track.readyState !== 'ended') {
      if (videoRef.current) videoRef.current.srcObject = new MediaStream([vp.track]);
      setCamActive(next);
    } else if (!next) {
      setCamActive(false);
    }
  }

  function toggleLocalMic() {
    if (!rtcManager) return;
    var ap = rtcManager.producers && rtcManager.producers['audio'];
    if (!ap) return;
    var next = !localMicOn;
    ap.track.enabled = next;
    setLocalMicOn(next);
    if (socket) panelService.mutePanelist(socket, roomId, user_id, !next);
  }

  function toggleRaiseHand() {
    var next = !localHandRaised;
    setLocalHandRaised(next);
    if (onRaiseHand) onRaiseHand(next);
  }

  function renderLocalControls() {
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
        {!isAudioOnlyRoom && (
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
      </div>
    );
  }

  function renderHostControls() {
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
      onTouchStart={function() { setShowControls(function(v) { return !v; }); }}
      style={{
        position: 'relative',
        background: BG,
        borderRadius: 8,
        overflow: 'hidden',
        border: effectiveSpeaking
          ? ('2px solid ' + GOLD)
          : slot_index === 0
            ? ('2px solid ' + GOLD)
            : '1px solid #333',
        boxShadow: effectiveSpeaking ? ('0 0 12px ' + GOLD + '55') : 'none',
        transition: 'box-shadow 0.15s',
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
              width: '100%', height: '100%', objectFit: 'cover',
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

      {/* Speaking indicator */}
      {effectiveSpeaking && !isAudioOnlyRoom && (
        <span style={{ position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: GOLD, boxShadow: '0 0 6px ' + GOLD }} />
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
      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />

      {/* Local cam/mic controls (shown on hover) */}
      {renderLocalControls()}

      {/* Host kick/mute controls (shown on hover) */}
      {renderHostControls()}
    </div>
  );
}
