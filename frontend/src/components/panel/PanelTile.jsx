// frontend/src/components/panel/PanelTile.jsx
import { useEffect, useRef, useState } from 'react';
import panelService from '../../services/panelService';

const GOLD = '#D4AF37';
const CREAM = '#F5F5DC';
const BG = '#1a1a1a';
const LIVE_RED = '#dc2626';

export default function PanelTile({ socket, roomId, slot, isAudioOnlyRoom, isHost, micLevel, isSpeaking, rtcManager, producerId, audioProducerId, isLocal }) {
  const { slot_index, user_id, display_name, avatar_url, is_expanded, is_muted } = slot;
  const videoRef = useRef(null);
  const [camActive, setCamActive] = useState(false);

  useEffect(function() {
    if (isAudioOnlyRoom || !rtcManager) {
      setCamActive(false);
      return;
    }

    var active = true;

    if (isLocal) {
      // Local tile: use the already-published video producer track directly.
      // producerId being set means publishStream() ran and the track is live.
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

  function handleTap() {
    if (socket) panelService.expandTile(socket, roomId, slot_index, !is_expanded);
  }

  return (
    <div
      onClick={handleTap}
      style={{
        position: 'relative',
        background: BG,
        borderRadius: 8,
        overflow: 'hidden',
        border: isSpeaking ? ('2px solid ' + GOLD) : slot_index === 0 ? ('2px solid ' + GOLD) : '1px solid #333',
        boxShadow: isSpeaking ? ('0 0 12px ' + GOLD + '55') : 'none',
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
              boxShadow: isSpeaking ? ('0 0 0 3px ' + GOLD + ', 0 0 12px ' + GOLD + '66') : 'none',
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
                    width: 3,
                    height: barH + 'px',
                    background: isSpeaking ? GOLD : 'rgba(212,175,55,0.35)',
                    borderRadius: 2,
                    transition: 'height 0.08s, background 0.15s',
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
              width: '100%',
              height: '100%',
              objectFit: 'cover',
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

      <div style={{ position: 'absolute', bottom: 4, left: 4, color: CREAM, fontSize: 11, fontFamily: '"DM Sans", sans-serif', textShadow: '0 1px 2px #000' }}>
        {display_name}
        {isLocal && <span style={{ marginLeft: 4, color: GOLD, fontSize: 10 }}>You</span>}
      </div>

      {isSpeaking && !isAudioOnlyRoom && (
        <span style={{ position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: GOLD, boxShadow: '0 0 6px ' + GOLD }} />
      )}

      {is_muted && (
        <span style={{ position: 'absolute', top: 4, right: 4, background: LIVE_RED, borderRadius: 4, padding: '2px 4px', fontSize: 10, color: CREAM }}>
          MUTED
        </span>
      )}
    </div>
  );
}
