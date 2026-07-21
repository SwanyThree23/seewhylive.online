/**
 * LiveStage.jsx — Dynamic SFU-backed live-streaming stage.
 *
 * Supports two roles:
 *   • "panelist" — publishes camera + audio, sees a grid of all other panelists.
 *   • "viewer"   — subscribes to all panelist streams; getUserMedia is NEVER
 *                  called, saving bandwidth and preventing permission prompts.
 *
 * Layout engine (mirrors LiveKit's responsive grid model):
 *   1 panelist   → single tile fills the stage
 *   2 panelists  → side-by-side (2-col)
 *   3–4          → 2×2 grid
 *   5+           → 3-col grid
 *   screen share → 70 % dominant panel + 30 % vertical sidebar of webcam tiles
 *
 * SFU track mapping (how MediaStream tracks attach to <video> elements):
 *   Each RemoteParticipant's stream is passed to a <VideoTile>.
 *   VideoTile uses a useEffect + videoRef.current.srcObject = stream to wire
 *   the SFU track directly to the HTML <video> — the same pattern LiveKit uses
 *   internally when it calls track.publication.track.attach(videoEl).
 *
 * Upgrade path:
 *   Replace useLiveStage with @livekit/components-react hooks:
 *     const participants = useParticipants();
 *     const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);
 *   Or with ZEGOCLOUD:
 *     zegoEngine.startPlayingStream(streamId, { video: el });
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Users, PhoneOff, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useLiveStage } from '@/hooks/useLiveStage';
import { useConnectionQuality } from '@/hooks/useConnectionQuality';

// ── Design tokens ──────────────────────────────────────────────────────────
var T = { fontFamily: 'Barlow Condensed, sans-serif' };
var GOLD = '#D4AF37';
var CRIMSON = '#800020';
var EMERALD = '#6DBF7E';

// ── Dynamic grid class ─────────────────────────────────────────────────────
// Maps participant count to a Tailwind grid class string.
// When a screen share is active, this is used only for the sidebar rail.
function gridClass(count) {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count <= 4)  return 'grid-cols-2 grid-rows-2';
  return 'grid-cols-3';
}

// ── Quality badge colours ──────────────────────────────────────────────────
var QUALITY_COLOR = { excellent: '#6DBF7E', good: '#6DBF7E', fair: '#D4AF37', poor: '#C0392B', offline: '#C0392B' };

// ── VideoTile ──────────────────────────────────────────────────────────────
// Attaches a MediaStream to a <video> element.
// This is the core SFU→DOM binding: videoEl.srcObject = stream.
function VideoTile({ participant, isLocal, isLarge, isHighlighted, peerConnection }) {
  var videoRef = useRef(null);
  var [videoLoaded, setVideoLoaded] = useState(false);
  // Per-tile connection quality — uses the RTCPeerConnection from peersRef
  var { quality, bars } = useConnectionQuality(peerConnection || null, 5000);

  // Wire the SFU track (MediaStream) → <video>.srcObject
  // In LiveKit: track.publication.track.attach(videoEl)
  // In ZEGOCLOUD: zegoEngine.startPlayingStream(id, { video: videoEl })
  useEffect(function() {
    var el = videoRef.current;
    if (!el) return;
    if (participant.stream) {
      el.srcObject = participant.stream;
      el.play().catch(function() {}); // autoplay policy — fails silently, user gesture resumes
    } else {
      el.srcObject = null;
    }
    return function() {
      if (el) el.srcObject = null;
    };
  }, [participant.stream]);

  var showVideo  = participant.videoEnabled && participant.stream;
  var showMuted  = !participant.audioEnabled;
  var isScreen   = participant.isScreenShare;

  return (
    <div className="relative overflow-hidden" style={{
      background: isHighlighted ? 'rgba(192,57,43,0.06)' : 'rgba(8,11,24,0.9)',
      border: '1px solid ' + (isHighlighted ? 'rgba(192,57,43,0.4)' : 'rgba(212,175,55,0.1)'),
      borderRadius: isLarge ? 16 : 10,
      aspectRatio: isScreen ? '16/9' : '16/9',
      minHeight: isLarge ? 200 : 80,
    }}>
      {/* SFU video track → <video> element */}
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // always mute local to prevent audio feedback
          onLoadedData={function() { setVideoLoaded(true); }}
          style={{
            width: '100%', height: '100%',
            objectFit: isScreen ? 'contain' : 'cover',
            display: 'block',
          }}
        />
      ) : (
        // No video track: show avatar placeholder
        <div className="w-full h-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(8,11,24,0.95), rgba(15,20,40,0.95))' }}>
          <div style={{
            width: isLarge ? 72 : 36, height: isLarge ? 72 : 36,
            borderRadius: '50%', background: 'linear-gradient(135deg, #6B4423, #d4af37)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isLarge ? 28 : 14, fontWeight: 900, color: '#000',
          }}>
            {(participant.name || '?').charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* ── Overlays ── */}

      {/* Gradient scrim for name readability */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(8,11,24,0.85) 0%, transparent 45%)',
        pointerEvents: 'none',
      }} />

      {/* Name bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: isLarge ? '6px 12px' : '3px 7px',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span style={{
          ...T, fontWeight: 900,
          fontSize: isLarge ? 13 : 10,
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '0.03em',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {isLocal ? 'You' : participant.name}
          {isScreen && <span style={{ color: GOLD, marginLeft: 6 }}>· Screen</span>}
        </span>
        {isLocal && (
          <span style={{ ...T, fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', padding: '1px 5px', borderRadius: 4, background: CRIMSON + '33', color: CRIMSON, border: '1px solid ' + CRIMSON + '55' }}>
            YOU
          </span>
        )}
      </div>

      {/* Connection quality badge — only for remote peers, not local */}
      {!isLocal && (
        <div style={{
          position: 'absolute', bottom: isLarge ? 36 : 24, right: isLarge ? 10 : 5,
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          {[0, 1, 2, 3].map(function(i) {
            return (
              <div key={i} style={{
                width: isLarge ? 3 : 2,
                height: isLarge ? (4 + i * 3) : (3 + i * 2),
                borderRadius: 1,
                background: i < bars ? QUALITY_COLOR[quality] : 'rgba(255,255,255,0.15)',
                alignSelf: 'flex-end',
              }} />
            );
          })}
        </div>
      )}

      {/* Muted audio overlay — prominent mic-off badge per spec */}
      {showMuted && (
        <div style={{
          position: 'absolute', top: isLarge ? 10 : 5, right: isLarge ? 10 : 5,
          width: isLarge ? 30 : 20, height: isLarge ? 30 : 20,
          borderRadius: '50%',
          background: 'rgba(192,57,43,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MicOff style={{ width: isLarge ? 14 : 10, height: isLarge ? 14 : 10, color: '#fff' }} />
        </div>
      )}

      {/* Screen-share badge */}
      {isScreen && (
        <div style={{
          position: 'absolute', top: isLarge ? 10 : 5, left: isLarge ? 10 : 5,
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '2px 7px', borderRadius: 4,
          background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)',
        }}>
          <Monitor style={{ width: 9, height: 9, color: GOLD }} />
          <span style={{ ...T, fontSize: 9, fontWeight: 900, color: GOLD, letterSpacing: '0.06em' }}>SCREEN</span>
        </div>
      )}

      {/* Connection state indicator */}
      {participant.state === 'disconnected' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', borderRadius: 'inherit',
        }}>
          <AlertCircle style={{ width: 24, height: 24, color: '#C0392B' }} />
        </div>
      )}
    </div>
  );
}

// ── Controls bar (panelists only) ──────────────────────────────────────────
function ControlBar({ audioEnabled, videoEnabled, toggleAudio, toggleVideo, onLeave, isSharingScreen, startScreenShare, stopScreenShare }) {
  function Btn({ onClick, active, Icon, InactiveIcon, label }) {
    return (
      <button
        onClick={onClick}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: active ? 'rgba(255,255,255,0.07)' : 'rgba(192,57,43,0.18)',
          userSelect: 'none', WebkitUserSelect: 'none',
          minWidth: 44, minHeight: 44,
          transition: 'background .15s',
        }}
        aria-label={label}
      >
        {active
          ? <Icon style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.8)' }} />
          : <InactiveIcon style={{ width: 18, height: 18, color: '#C0392B' }} />}
        <span style={{ ...T, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: active ? 'rgba(255,255,255,0.5)' : '#C0392B' }}>
          {label}
        </span>
      </button>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '10px 16px',
      background: 'rgba(7,7,15,0.97)',
      borderTop: '1px solid rgba(212,175,55,0.1)',
      backdropFilter: 'blur(20px)',
    }}>
      <Btn onClick={toggleAudio} active={audioEnabled}   Icon={Mic}   InactiveIcon={MicOff}  label={audioEnabled ? 'Mute'   : 'Unmute'} />
      <Btn onClick={toggleVideo} active={videoEnabled}   Icon={Video} InactiveIcon={VideoOff} label={videoEnabled ? 'Camera' : 'No Cam'} />
      {startScreenShare && (
        <Btn
          onClick={isSharingScreen ? stopScreenShare : startScreenShare}
          active={!isSharingScreen}
          Icon={Monitor} InactiveIcon={MonitorOff}
          label={isSharingScreen ? 'Stop' : 'Share'}
        />
      )}
      {onLeave && (
        <button onClick={onLeave}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: CRIMSON, minWidth: 44, minHeight: 44, userSelect: 'none' }}
          aria-label="Leave">
          <PhoneOff style={{ width: 18, height: 18, color: '#fff' }} />
          <span style={{ ...T, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: '#fff' }}>Leave</span>
        </button>
      )}
    </div>
  );
}

// ── Main LiveStage component ───────────────────────────────────────────────
/**
 * @param {object}  props
 * @param {string}  props.roomId     - Room / party ID
 * @param {'panelist'|'viewer'} props.role
 * @param {string}  props.userId     - Auth user ID
 * @param {string}  props.userName   - Display name
 * @param {function} [props.onLeave] - Called when user clicks Leave
 * @param {number}  [props.minHeight] - Min stage height (default 360)
 */
export default function LiveStage({ roomId, role = 'viewer', userId, userName, onLeave, minHeight = 360 }) {
  var {
    participants, screenShare,
    toggleAudio, toggleVideo,
    audioEnabled, videoEnabled,
    startScreenShare, stopScreenShare, isSharingScreen,
    peersRef,
    mediaError, isPanelist,
  } = useLiveStage({ roomId, role, userId, userName });

  // Webcam-only participants (exclude screen share entries from grid)
  var webcamParticipants = participants.filter(function(p) { return !p.isScreenShare; });
  var count = webcamParticipants.length;

  var gc = gridClass(count);

  // ── Empty state ────────────────────────────────────────────────────────
  if (count === 0) {
    return (
      <div style={{
        minHeight: minHeight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(8,11,24,0.97)', borderRadius: 16, border: '1px solid rgba(212,175,55,0.1)',
      }}>
        <Users style={{ width: 40, height: 40, color: 'rgba(212,175,55,0.2)', marginBottom: 12 }} />
        <p style={{ ...T, fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
          {isPanelist ? 'Waiting for others to join…' : 'Waiting for the host to go live…'}
        </p>
        {mediaError && (
          <p style={{ ...T, fontSize: 11, color: '#C0392B', marginTop: 8 }}>Camera error: {mediaError}</p>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(7,7,15,0.99)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── Stage area ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: minHeight, padding: screenShare ? 0 : 8 }}>

        {/* Screen-share layout: 70 / 30 split */}
        {screenShare ? (
          <div style={{ display: 'flex', height: '100%', minHeight: minHeight }}>
            {/* Dominant 70% panel — screen share */}
            <div style={{ flex: '0 0 70%', padding: 8 }}>
              <VideoTile participant={screenShare} isLarge isHighlighted
                peerConnection={peersRef?.current?.get(screenShare.peerId)?.pc || null} />
            </div>
            {/* Sidebar 30% — vertical rail of webcam tiles */}
            <div style={{ flex: '0 0 30%', padding: '8px 8px 8px 0', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
              {webcamParticipants.map(function(p) {
                return (
                  <VideoTile
                    key={p.peerId}
                    participant={p}
                    isLocal={p.isLocal}
                    peerConnection={peersRef?.current?.get(p.peerId)?.pc || null}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* Standard grid — dynamic column count per participant count */
          <AnimatePresence>
            <motion.div
              layout
              className={'grid gap-2 ' + gc}
              style={{ gridAutoRows: '1fr' }}
            >
              {webcamParticipants.map(function(p) {
                return (
                  <motion.div key={p.peerId} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <VideoTile
                      participant={p}
                      isLocal={p.isLocal}
                      isLarge={count === 1}
                      peerConnection={peersRef?.current?.get(p.peerId)?.pc || null}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ── Viewer role badge ──────────────────────────────────────────── */}
      {!isPanelist && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px',
          background: 'rgba(212,175,55,0.04)',
          borderTop: '1px solid rgba(212,175,55,0.08)',
        }}>
          <Users style={{ width: 10, height: 10, color: 'rgba(212,175,55,0.4)' }} />
          <span style={{ ...T, fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', color: 'rgba(212,175,55,0.45)' }}>
            VIEWING · {count} panelist{count !== 1 ? 's' : ''} live
          </span>
        </div>
      )}

      {/* ── Panelist controls ──────────────────────────────────────────── */}
      {isPanelist && (
        <ControlBar
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          toggleAudio={toggleAudio}
          toggleVideo={toggleVideo}
          isSharingScreen={isSharingScreen}
          startScreenShare={startScreenShare}
          stopScreenShare={stopScreenShare}
          onLeave={onLeave}
        />
      )}
    </div>
  );
}
