/**
 * LiveStage.jsx — Dynamic SFU-backed live-streaming stage.
 *
 * Competitive-feature matrix (sourced from TikTok LIVE, Chatter, Fanbase, rork.com):
 *   • Stage X/Y capacity counter + LIVE badge + "X is speaking" indicator
 *   • Active-speaker glow ring (pulsing teal border via AudioContext)
 *   • Host crown 👑 + Co-host crown + role labels on every tile
 *   • Gift/engagement diamond badge per tile
 *   • Request-to-join empty slots up to stage capacity
 *   • "Others in the Room" audience grid below stage
 *   • Raise Hand button for viewers
 *   • Mute All button for host in control bar
 *   • Quick-Action Dock: Auction, Invite, AI Trip, Battle, Host Panel, Share
 *   • QR / link share modal
 *
 * Upgrade path:
 *   Replace useLiveStage with @livekit/components-react hooks or ZEGOCLOUD.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  Users, PhoneOff, AlertCircle, Wifi, WifiOff,
  Crown, Hand, Sparkles, Zap, Trophy, UserPlus, Shield,
  Share2, Copy, Check, VolumeX, Volume2, X,
} from 'lucide-react';
import { useLiveStage }        from '@/hooks/useLiveStage';
import { useConnectionQuality } from '@/hooks/useConnectionQuality';
import { useAudioLevel }       from '@/hooks/useAudioLevel';

// ── Design tokens ──────────────────────────────────────────────────────────
var T       = { fontFamily: 'Barlow Condensed, sans-serif' };
var GOLD    = '#D4AF37';
var CRIMSON = '#800020';
var EMERALD = '#6DBF7E';
var TEAL    = '#4AE3C8'; // active-speaker ring colour

// ── Dynamic grid class ─────────────────────────────────────────────────────
function gridClass(count) {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count <= 4)  return 'grid-cols-2 grid-rows-2';
  return 'grid-cols-3';
}

var QUALITY_COLOR = { excellent: EMERALD, good: EMERALD, fair: GOLD, poor: '#C0392B', offline: '#C0392B' };

// ── useAudioLevel (inline fallback — real hook lives in useAudioLevel.js) ──
// The VideoTile calls the imported hook; we just re-export nothing here.

// ── RoleInfo helpers ────────────────────────────────────────────────────────
function getRoleInfo(participant, hostId, cohostIds) {
  var uid = participant.userId || participant.peerId;
  if (participant.isLocal) {
    if (uid === hostId || cohostIds.includes(uid)) return null; // derived below
  }
  if (uid === hostId)            return { label: 'Host',    crown: true,  color: GOLD   };
  if (cohostIds.includes(uid))   return { label: 'Co-host', crown: true,  color: '#C8A2C8' };
  return                               { label: null,        crown: false, color: null   };
}

// ── VideoTile ──────────────────────────────────────────────────────────────
function VideoTile({ participant, isLocal, isLarge, isHighlighted, peerConnection, roleInfo, giftCount }) {
  var videoRef = useRef(null);
  var { quality, bars } = useConnectionQuality(peerConnection || null, 5000);

  // Active-speaker glow from real audio-level measurement
  var { isSpeaking } = useAudioLevel(
    isLocal ? null : (participant.stream || null), // don't analyse own mic (feedback)
    10
  );

  useEffect(function() {
    var el = videoRef.current;
    if (!el) return;
    if (participant.stream) {
      el.srcObject = participant.stream;
      el.play().catch(function() {});
    } else {
      el.srcObject = null;
    }
    return function() { if (el) el.srcObject = null; };
  }, [participant.stream]);

  var showVideo = participant.videoEnabled && participant.stream;
  var showMuted = !participant.audioEnabled;
  var isScreen  = participant.isScreenShare;
  var speaking  = isSpeaking && !isLocal && !isScreen;

  return (
    <div className="relative overflow-hidden" style={{
      background:   'rgba(8,11,24,0.9)',
      border:       speaking
                      ? ('2px solid ' + TEAL)
                      : ('1px solid ' + (isHighlighted ? 'rgba(192,57,43,0.4)' : 'rgba(212,175,55,0.1)')),
      borderRadius: isLarge ? 16 : 10,
      aspectRatio:  '16/9',
      minHeight:    isLarge ? 200 : 80,
      boxShadow:    speaking ? ('0 0 14px 3px ' + TEAL + '55') : 'none',
      transition:   'border-color .15s, box-shadow .15s',
    }}>
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{ width: '100%', height: '100%', objectFit: isScreen ? 'contain' : 'cover', display: 'block' }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(8,11,24,0.95), rgba(15,20,40,0.95))' }}>
          <div style={{
            width: isLarge ? 72 : 36, height: isLarge ? 72 : 36,
            borderRadius: '50%',
            background: roleInfo?.crown ? 'linear-gradient(135deg, #6B4423, #d4af37)' : 'linear-gradient(135deg, #1a1a2e, #555)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isLarge ? 28 : 14, fontWeight: 900, color: '#000',
          }}>
            {(participant.name || '?').charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Gradient scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,11,24,0.85) 0%, transparent 45%)', pointerEvents: 'none' }} />

      {/* Crown icon — top-centre for host/cohost */}
      {roleInfo?.crown && (
        <div style={{ position: 'absolute', top: isLarge ? -2 : -1, left: '50%', transform: 'translateX(-50%)' }}>
          <Crown style={{ width: isLarge ? 18 : 12, height: isLarge ? 18 : 12, color: roleInfo.color, filter: 'drop-shadow(0 0 4px ' + roleInfo.color + ')' }} />
        </div>
      )}

      {/* Gift count badge (top-left) */}
      {giftCount > 0 && (
        <div style={{
          position: 'absolute', top: isLarge ? 10 : 5, left: isLarge ? 10 : 5,
          display: 'flex', alignItems: 'center', gap: 2,
          padding: '1px 5px', borderRadius: 99,
          background: 'rgba(212,175,55,0.85)',
        }}>
          <span style={{ fontSize: isLarge ? 9 : 7, fontWeight: 900, color: '#000' }}>💎</span>
          <span style={{ ...T, fontSize: isLarge ? 9 : 7, fontWeight: 900, color: '#000' }}>{giftCount}</span>
        </div>
      )}

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

        {/* Role label chip */}
        {roleInfo?.label && (
          <span style={{
            ...T, fontSize: 8, fontWeight: 900, letterSpacing: '0.06em',
            padding: '1px 5px', borderRadius: 4,
            background: (roleInfo.color || GOLD) + '22',
            color: roleInfo.color || GOLD,
            border: '1px solid ' + (roleInfo.color || GOLD) + '44',
          }}>
            {roleInfo.label.toUpperCase()}
          </span>
        )}
        {isLocal && (
          <span style={{ ...T, fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', padding: '1px 5px', borderRadius: 4, background: CRIMSON + '33', color: CRIMSON, border: '1px solid ' + CRIMSON + '55' }}>
            YOU
          </span>
        )}
      </div>

      {/* Connection quality bars */}
      {!isLocal && !isScreen && (
        <div style={{ position: 'absolute', bottom: isLarge ? 36 : 24, right: isLarge ? 10 : 5, display: 'flex', alignItems: 'center', gap: 2 }}>
          {[0, 1, 2, 3].map(function(i) {
            return (
              <div key={i} style={{
                width: isLarge ? 3 : 2, height: isLarge ? (4 + i * 3) : (3 + i * 2),
                borderRadius: 1, alignSelf: 'flex-end',
                background: i < bars ? QUALITY_COLOR[quality] : 'rgba(255,255,255,0.15)',
              }} />
            );
          })}
        </div>
      )}

      {/* Muted badge */}
      {showMuted && (
        <div style={{
          position: 'absolute', top: isLarge ? 10 : 5, right: isLarge ? 10 : 5,
          width: isLarge ? 28 : 18, height: isLarge ? 28 : 18, borderRadius: '50%',
          background: 'rgba(192,57,43,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MicOff style={{ width: isLarge ? 13 : 9, height: isLarge ? 13 : 9, color: '#fff' }} />
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

      {/* Disconnected overlay */}
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

// ── RequestSlot ─────────────────────────────────────────────────────────────
// Empty stage slot that audience can click to request speaking access.
function RequestSlot({ onRequest, isLarge }) {
  var [requested, setRequested] = useState(false);
  function handleClick() {
    if (requested) return;
    setRequested(true);
    if (onRequest) onRequest();
    setTimeout(function() { setRequested(false); }, 4000);
  }
  return (
    <button onClick={handleClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      border: '1px dashed rgba(212,175,55,0.25)',
      borderRadius: isLarge ? 16 : 10,
      aspectRatio: '16/9', minHeight: isLarge ? 200 : 80,
      background: 'rgba(8,11,24,0.5)',
      cursor: requested ? 'default' : 'pointer',
      gap: 6, transition: 'border-color .15s, background .15s',
    }}>
      {requested ? (
        <>
          <Check style={{ width: 22, height: 22, color: EMERALD }} />
          <span style={{ ...T, fontSize: 10, fontWeight: 700, color: EMERALD, letterSpacing: '0.06em' }}>REQUEST SENT</span>
        </>
      ) : (
        <>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 16, color: GOLD }}>+</span>
          </div>
          <span style={{ ...T, fontSize: 10, fontWeight: 700, color: 'rgba(212,175,55,0.5)', letterSpacing: '0.06em' }}>REQUEST</span>
        </>
      )}
    </button>
  );
}

// ── OthersInRoom ────────────────────────────────────────────────────────────
// Audience avatars shown below the stage (matches Chatter/rork.com design).
function OthersInRoom({ viewers }) {
  if (!viewers || viewers.length === 0) return null;
  var shown = viewers.slice(0, 20);
  return (
    <div style={{ padding: '8px 12px 10px', borderTop: '1px solid rgba(212,175,55,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        <Users style={{ width: 11, height: 11, color: 'rgba(212,175,55,0.45)' }} />
        <span style={{ ...T, fontSize: 10, fontWeight: 900, letterSpacing: '0.07em', color: 'rgba(255,255,255,0.4)' }}>
          OTHERS IN THE ROOM · {viewers.length}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {shown.map(function(v, i) {
          return (
            <div key={v.id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: v.avatar ? 'none' : 'linear-gradient(135deg, #1a1a2e, #444)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.7)',
                overflow: 'hidden',
              }}>
                {v.avatar
                  ? <img src={v.avatar} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (v.name || '?').charAt(0).toUpperCase()
                }
              </div>
              <span style={{ ...T, fontSize: 8, color: 'rgba(255,255,255,0.4)', maxWidth: 44, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {(v.name || '').split(' ')[0]}
              </span>
            </div>
          );
        })}
        {viewers.length > 20 && (
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ ...T, fontSize: 9, fontWeight: 900, color: GOLD }}>+{viewers.length - 20}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── QuickActionDock ─────────────────────────────────────────────────────────
// Horizontal scroll row of quick-action icon buttons (matches rork.com/SeeWhy mobile).
function QuickActionDock({ actions }) {
  if (!actions || actions.length === 0) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto',
      padding: '8px 12px',
      borderTop: '1px solid rgba(212,175,55,0.08)',
      scrollbarWidth: 'none',
    }}>
      {actions.map(function(a, i) {
        var Icon = a.icon;
        return (
          <button key={i} onClick={a.onClick} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            minWidth: 52, padding: '8px 6px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.03)',
            cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none',
            transition: 'background .15s',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: a.bg || 'rgba(212,175,55,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {typeof a.icon === 'string'
                ? <span style={{ fontSize: 18 }}>{a.icon}</span>
                : <Icon style={{ width: 18, height: 18, color: a.color || GOLD }} />
              }
            </div>
            <span style={{ ...T, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              {a.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── ShareModal ───────────────────────────────────────────────────────────────
function ShareModal({ url, onClose }) {
  var [copied, setCopied] = useState(false);
  function handleCopy() {
    if (!url) return;
    navigator.clipboard.writeText(url).then(function() {
      setCopied(true);
      setTimeout(function() { setCopied(false); }, 2000);
    });
  }
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={function(e) { e.stopPropagation(); }}
        style={{
          background: 'rgba(10,12,25,0.98)', border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 20, padding: 24, width: '100%', maxWidth: 360,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ ...T, fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '0.04em' }}>INVITE TO STAGE</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        {/* QR placeholder (canvas QR generation would require a library) */}
        <div style={{
          width: 160, height: 160, margin: '0 auto 16px',
          background: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 8,
        }}>
          <Share2 style={{ width: 32, height: 32, color: 'rgba(212,175,55,0.4)' }} />
          <span style={{ ...T, fontSize: 10, color: 'rgba(212,175,55,0.4)', textAlign: 'center', letterSpacing: '0.06em' }}>SCAN QR IN APP</span>
        </div>

        {/* URL copy */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            readOnly
            value={url || window.location.href}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)',
              color: 'rgba(255,255,255,0.7)', fontSize: 11,
              fontFamily: 'monospace',
            }}
          />
          <button onClick={handleCopy} style={{
            padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: copied ? EMERALD : GOLD, color: '#000',
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 4,
            transition: 'background .2s',
          }}>
            {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Controls bar (panelists only) ──────────────────────────────────────────
function ControlBar({
  audioEnabled, videoEnabled,
  toggleAudio, toggleVideo,
  onLeave,
  isSharingScreen, startScreenShare, stopScreenShare,
  isHost, onMuteAll,
  isViewer, onRaiseHand,
  raisedHand,
}) {
  function Btn({ onClick, active, Icon, InactiveIcon, label, danger, teal }) {
    return (
      <button onClick={onClick} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        padding: '8px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
        background: danger ? CRIMSON : (teal ? TEAL + '22' : (active ? 'rgba(255,255,255,0.07)' : 'rgba(192,57,43,0.18)')),
        minWidth: 44, minHeight: 44,
        transition: 'background .15s',
        userSelect: 'none', WebkitUserSelect: 'none',
      }} aria-label={label}>
        {active
          ? <Icon style={{ width: 18, height: 18, color: teal ? TEAL : 'rgba(255,255,255,0.8)' }} />
          : <InactiveIcon style={{ width: 18, height: 18, color: danger ? '#fff' : '#C0392B' }} />}
        <span style={{ ...T, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: teal ? TEAL : (danger ? '#fff' : (active ? 'rgba(255,255,255,0.5)' : '#C0392B')) }}>
          {label}
        </span>
      </button>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: '10px 14px',
      background: 'rgba(7,7,15,0.97)',
      borderTop: '1px solid rgba(212,175,55,0.1)',
      backdropFilter: 'blur(20px)',
      flexWrap: 'wrap',
    }}>
      {/* Viewer-only: Raise Hand */}
      {isViewer && onRaiseHand && (
        <Btn
          onClick={onRaiseHand}
          active={!raisedHand}
          teal={raisedHand}
          Icon={Hand}
          InactiveIcon={Hand}
          label={raisedHand ? 'Raised' : 'Hand'}
        />
      )}

      {/* Panelist controls */}
      {!isViewer && (
        <>
          <Btn onClick={toggleAudio} active={audioEnabled}  Icon={Mic}       InactiveIcon={MicOff}    label={audioEnabled ? 'Mute'   : 'Unmute'} />
          <Btn onClick={toggleVideo} active={videoEnabled}  Icon={Video}     InactiveIcon={VideoOff}  label={videoEnabled ? 'Camera' : 'No Cam'} />
          {startScreenShare && (
            <Btn
              onClick={isSharingScreen ? stopScreenShare : startScreenShare}
              active={!isSharingScreen}
              Icon={Monitor} InactiveIcon={MonitorOff}
              label={isSharingScreen ? 'Stop' : 'Share'}
            />
          )}
          {/* Host-only: Mute All */}
          {isHost && onMuteAll && (
            <Btn onClick={onMuteAll} active={false} Icon={VolumeX} InactiveIcon={VolumeX} label="Mute All" />
          )}
        </>
      )}

      {onLeave && (
        <button onClick={onLeave} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: CRIMSON, minWidth: 44, minHeight: 44, userSelect: 'none',
        }} aria-label="Leave">
          <PhoneOff style={{ width: 18, height: 18, color: '#fff' }} />
          <span style={{ ...T, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: '#fff' }}>Leave</span>
        </button>
      )}
    </div>
  );
}

// ── Stage Header ───────────────────────────────────────────────────────────
function StageHeader({ count, capacity, activeSpeaker, isLive, onShare }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px',
      borderBottom: '1px solid rgba(212,175,55,0.08)',
      background: 'rgba(7,7,15,0.8)',
    }}>
      {/* LIVE badge */}
      {isLive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 99, background: '#C0392B' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
          <span style={{ ...T, fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: '0.08em' }}>LIVE</span>
        </div>
      )}

      {/* Stage X/Y */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span style={{ ...T, fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.04em' }}>Stage</span>
        <span style={{ ...T, fontSize: 12, fontWeight: 700, color: GOLD }}>{count}/{capacity}</span>
      </div>

      {/* Who's speaking */}
      {activeSpeaker && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 12 }}>
            {[3, 5, 3, 7, 5].map(function(h, i) {
              return <div key={i} style={{ width: 2, height: h, borderRadius: 1, background: TEAL, animation: 'barBounce ' + (0.4 + i * 0.1) + 's ease-in-out infinite alternate' }} />;
            })}
          </div>
          <span style={{ ...T, fontSize: 10, fontWeight: 700, color: TEAL, letterSpacing: '0.04em' }}>
            {activeSpeaker} is speaking
          </span>
        </div>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Share / invite button */}
        <button onClick={onShare} style={{
          padding: '4px 10px', borderRadius: 8,
          background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <UserPlus style={{ width: 11, height: 11, color: GOLD }} />
          <span style={{ ...T, fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.04em' }}>Invite</span>
        </button>
      </div>
    </div>
  );
}

// ── Main LiveStage component ───────────────────────────────────────────────
/**
 * @param {string}   roomId       - Room / party ID
 * @param {'panelist'|'viewer'} role
 * @param {string}   userId       - Auth user ID
 * @param {string}   userName     - Display name
 * @param {function} [onLeave]    - Called when user clicks Leave
 * @param {number}   [minHeight]  - Min stage height (default 360)
 * @param {number}   [capacity]   - Max stage capacity (default 20)
 * @param {string}   [hostId]     - userId of the room host
 * @param {string[]} [cohostIds]  - userIds of co-hosts
 * @param {{[uid]:number}} [giftCounts]  - gift count per userId
 * @param {object[]} [viewers]    - Audience members [{id,name,avatar}]
 * @param {function} [onRaiseHand]
 * @param {function} [onMuteAll]
 * @param {object[]} [quickActions] - [{icon, label, onClick, color, bg}]
 * @param {string}   [roomUrl]    - URL for share modal
 */
export default function LiveStage({
  roomId, role = 'viewer', userId, userName, onLeave,
  minHeight = 360,
  capacity = 20,
  hostId, cohostIds = [],
  giftCounts = {},
  viewers = [],
  onRaiseHand,
  onMuteAll,
  quickActions,
  roomUrl,
}) {
  var {
    participants, screenShare,
    toggleAudio, toggleVideo,
    audioEnabled, videoEnabled,
    startScreenShare, stopScreenShare, isSharingScreen,
    peersRef,
    mediaError, isPanelist,
  } = useLiveStage({ roomId, role, userId, userName });

  var [showShare, setShowShare]     = useState(false);
  var [raisedHand, setRaisedHand]   = useState(false);
  var [activeSpeaker, setActiveSpeaker] = useState(null);

  var isHost   = userId === hostId;
  var isViewer = !isPanelist;

  // Webcam-only participants
  var webcamParticipants = participants.filter(function(p) { return !p.isScreenShare; });
  var count = webcamParticipants.length;

  // Open slots = capacity - panelists on stage (show up to 3 empty slots max to avoid clutter)
  var openSlots = Math.min(3, Math.max(0, Math.min(capacity, 8) - count));

  var gc = gridClass(count + openSlots);

  // Default quick actions for host
  var defaultHostActions = isHost ? [
    { icon: '🏆', label: 'Auction',   onClick: function() {} },
    { icon: '📣', label: 'Invite',    onClick: function() { setShowShare(true); } },
    { icon: '🤖', label: 'AI Trip',   onClick: function() {} },
    { icon: '⚔️', label: 'Battle',    onClick: function() {} },
    { icon: '🛡️', label: 'Host Panel', onClick: function() {} },
  ] : [];

  var actions = quickActions || (isHost ? defaultHostActions : [
    { icon: Share2, label: 'Share', onClick: function() { setShowShare(true); }, color: GOLD },
    { icon: '🏆', label: 'Auction',  onClick: function() {} },
  ]);

  function handleRaiseHand() {
    setRaisedHand(function(v) { return !v; });
    if (onRaiseHand) onRaiseHand(!raisedHand);
  }

  function handleMuteAll() {
    if (onMuteAll) onMuteAll();
  }

  function handleRequest() {
    if (onRaiseHand) onRaiseHand(true);
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (count === 0 && !openSlots) {
    return (
      <div style={{
        minHeight: minHeight, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(8,11,24,0.97)', borderRadius: 16,
        border: '1px solid rgba(212,175,55,0.1)',
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
    <>
      <div style={{ background: 'rgba(7,7,15,0.99)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* ── Stage header ──────────────────────────────────────────── */}
        <StageHeader
          count={count}
          capacity={capacity}
          activeSpeaker={activeSpeaker}
          isLive={count > 0}
          onShare={function() { setShowShare(true); }}
        />

        {/* ── Stage area ────────────────────────────────────────────── */}
        <div style={{ flex: 1, minHeight: minHeight, padding: screenShare ? 0 : 8 }}>

          {/* Screen-share layout: 70 / 30 split */}
          {screenShare ? (
            <div style={{ display: 'flex', height: '100%', minHeight: minHeight }}>
              <div style={{ flex: '0 0 70%', padding: 8 }}>
                <VideoTile participant={screenShare} isLarge isHighlighted
                  roleInfo={null} giftCount={0}
                  peerConnection={peersRef?.current?.get(screenShare.peerId)?.pc || null} />
              </div>
              <div style={{ flex: '0 0 30%', padding: '8px 8px 8px 0', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
                {webcamParticipants.map(function(p) {
                  var ri = getRoleInfo(p, hostId, cohostIds);
                  return (
                    <VideoTile key={p.peerId} participant={p} isLocal={p.isLocal}
                      roleInfo={ri} giftCount={giftCounts[p.userId || p.peerId] || 0}
                      peerConnection={peersRef?.current?.get(p.peerId)?.pc || null} />
                  );
                })}
              </div>
            </div>
          ) : (
            /* Standard grid */
            <AnimatePresence>
              <motion.div layout className={'grid gap-2 ' + gc} style={{ gridAutoRows: '1fr' }}>
                {webcamParticipants.map(function(p) {
                  var ri = getRoleInfo(p, hostId, cohostIds);
                  return (
                    <motion.div key={p.peerId} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                      <VideoTile participant={p} isLocal={p.isLocal} isLarge={count === 1}
                        roleInfo={ri} giftCount={giftCounts[p.userId || p.peerId] || 0}
                        peerConnection={peersRef?.current?.get(p.peerId)?.pc || null} />
                    </motion.div>
                  );
                })}

                {/* Open request slots */}
                {Array.from({ length: openSlots }).map(function(_, i) {
                  return (
                    <motion.div key={'slot-' + i} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <RequestSlot onRequest={handleRequest} isLarge={count === 0} />
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ── Quick-action dock ──────────────────────────────────────── */}
        <QuickActionDock actions={actions} />

        {/* ── Others in the Room ────────────────────────────────────── */}
        <OthersInRoom viewers={viewers} />

        {/* ── Viewer role badge / Raise Hand ────────────────────────── */}
        {isViewer && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 12px',
            background: 'rgba(212,175,55,0.04)',
            borderTop: '1px solid rgba(212,175,55,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users style={{ width: 10, height: 10, color: 'rgba(212,175,55,0.4)' }} />
              <span style={{ ...T, fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', color: 'rgba(212,175,55,0.45)' }}>
                VIEWING · {count} panelist{count !== 1 ? 's' : ''} live
              </span>
            </div>
            {onRaiseHand && (
              <button onClick={handleRaiseHand} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: 99, border: 'none', cursor: 'pointer',
                background: raisedHand ? TEAL + '22' : 'rgba(255,255,255,0.06)',
                transition: 'background .15s',
              }}>
                <Hand style={{ width: 13, height: 13, color: raisedHand ? TEAL : 'rgba(255,255,255,0.5)' }} />
                <span style={{ ...T, fontSize: 10, fontWeight: 700, color: raisedHand ? TEAL : 'rgba(255,255,255,0.5)' }}>
                  {raisedHand ? 'Hand Raised' : 'Raise Hand'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* ── Panelist controls ──────────────────────────────────────── */}
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
            isHost={isHost}
            onMuteAll={handleMuteAll}
            isViewer={false}
          />
        )}
      </div>

      {/* ── Share Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showShare && <ShareModal url={roomUrl || window.location.href} onClose={function() { setShowShare(false); }} />}
      </AnimatePresence>
    </>
  );
}
