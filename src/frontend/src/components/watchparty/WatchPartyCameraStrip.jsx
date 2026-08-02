import React, { useRef, useEffect } from 'react';
import { usePeerVideoStreams } from '../../hooks/usePeerVideoStreams';

/**
 * WatchPartyCameraStrip — small-N reaction camera strip for Watch Party.
 *
 * Uses usePeerVideoStreams (the shared Panel/Watch Party media hook) so the
 * watchers' reaction cameras reuse the exact same producer/consumer pipeline
 * as Panel seats. Playback sync stays in useWatchPartySocket — this component
 * is purely the media path and renders nothing playback-related.
 *
 * Props:
 *   roomId, userId, role, socket, mediaConfig, enabled (audio-only gate)
 *   maxSeats (default 6)
 */
var GOLD = '#D4AF37';
var CREAM = '#F5F0E8';
var BG = '#141210';

function Cell({ entry, isLocal, isCamOff, isMuted }) {
  var videoRef = useRef(null);
  var stream = isLocal ? null : (entry && entry.stream);

  useEffect(() => {
    if (isLocal || !videoRef.current || !stream) return;
    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(() => {});
  }, [isLocal, stream]);

  var name = isLocal ? 'You' : (entry && entry.username) || 'Guest';

  return (
    <div style={{
      position: 'relative', width: 96, height: 96, borderRadius: 12, overflow: 'hidden',
      background: BG, border: '1px solid ' + GOLD + '33', flexShrink: 0,
    }}>
      {stream && !isCamOff ? (
        <video ref={videoRef} autoPlay playsInline muted={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <span style={{ fontSize: 28 }}>{isCamOff ? '🚫' : '🎭'}</span>
        </div>
      )}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2px 6px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: CREAM,
        fontSize: 10, fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {name}
      </div>
      {isMuted && (
        <span style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(192,57,43,0.9)', borderRadius: 4, padding: '1px 4px', fontSize: 9, color: '#fff' }}>🔇</span>
      )}
    </div>
  );
}

export default function WatchPartyCameraStrip({ roomId, userId, role, socket, mediaConfig, enabled = true, maxSeats = 6 }) {
  // Viewers don't publish a camera — only host/guest seats do. Viewers still see others.
  var streams = usePeerVideoStreams({ roomId, userId, role, socket, mediaConfig, enabled });

  var localEl = streams.localStream && role !== 'viewer' ? (
    <Cell isLocal={true} isCamOff={streams.isCamOff} isMuted={streams.isMicOff} />
  ) : null;

  var remoteEls = Object.values(streams.remoteStreams)
    .slice(0, maxSeats - (localEl ? 1 : 0))
    .map((entry) => (
      <Cell key={entry.guestId} entry={entry} isLocal={false} isCamOff={false} isMuted={false} />
    ));

  if (!enabled) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: GOLD, fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, letterSpacing: '0.08em' }}>
          🎥 REACTION CAMS
        </span>
        {!streams.ready && (
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>connecting…</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 0' }}>
        {localEl}
        {remoteEls}
        {(!localEl && remoteEls.length === 0 && streams.ready) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 96, color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: '"Barlow Condensed", sans-serif' }}>
            Waiting for other watchers to join…
          </div>
        )}
      </div>
      {role !== 'viewer' && streams.localStream && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={streams.toggleCam}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid ' + GOLD + '44', background: streams.isCamOff ? 'rgba(192,57,43,0.2)' : GOLD + '18', color: streams.isCamOff ? '#E57373' : GOLD, cursor: 'pointer', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 11 }}>
            {streams.isCamOff ? '📷 Cam On' : '🚫 Cam Off'}
          </button>
          <button onClick={streams.toggleMic}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid ' + GOLD + '44', background: streams.isMicOff ? 'rgba(192,57,43,0.2)' : GOLD + '18', color: streams.isMicOff ? '#E57373' : GOLD, cursor: 'pointer', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 11 }}>
            {streams.isMicOff ? '🎤 Unmute' : '🔇 Mute'}
          </button>
        </div>
      )}
    </div>
  );
}