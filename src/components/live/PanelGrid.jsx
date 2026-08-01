import React, { useReducer, useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Mic, MicOff, Video, VideoOff, X, Maximize2, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MAX_PANEL_GUESTS = 20;
const OCT = 'polygon(29% 0%,71% 0%,100% 29%,100% 71%,71% 100%,29% 100%,0% 71%,0% 29%)';
const GOLD = '#D4AF37';

const ROLE_CONFIG = {
  HOST:     { label: 'HOST',     color: '#d4af37', icon: '👑', textColor: '#000' },
  COHOST:   { label: 'CO-HOST', color: '#D4AF37', icon: '⚡', textColor: '#000' },
  FEATURED: { label: 'FEATURED', color: '#C0392B', icon: '⭐', textColor: '#fff' },
  GUEST:    { label: 'GUEST',    color: '#D4854A', icon: '🎙', textColor: '#000' },
  VIEWER:   { label: 'VIEWER',   color: '#666',    icon: '👁', textColor: '#fff' },
};

// ── Grid engine: maps guest count → column count (1×1 → 4×5) ─────────────
function getGridCols(count) {
  if (count <= 1)  return 1;
  if (count <= 4)  return 2;
  if (count <= 9)  return 3;
  if (count <= 16) return 4;
  return 5;
}

// ── Reducer ───────────────────────────────────────────────────────────────
const initState = { spotlight: null, expanded: null, guests: [] };

function reducer(state, action) {
  switch (action.type) {
    case 'SET_GUESTS':   return { ...state, guests: action.payload };
    case 'ADD_GUEST':
      if (state.guests.length >= MAX_PANEL_GUESTS) return state;
      return { ...state, guests: [...state.guests, action.payload] };
    case 'REMOVE_GUEST':
      return { ...state, guests: state.guests.filter(g => g.id !== action.id), spotlight: state.spotlight === action.id ? null : state.spotlight, expanded: state.expanded === action.id ? null : state.expanded };
    case 'TOGGLE_MIC':  return { ...state, guests: state.guests.map(g => g.id === action.id ? { ...g, micMuted: !g.micMuted } : g) };
    case 'TOGGLE_CAM':  return { ...state, guests: state.guests.map(g => g.id === action.id ? { ...g, camOff: !g.camOff } : g) };
    case 'SET_SPOTLIGHT': return { ...state, spotlight: state.spotlight === action.id ? null : action.id };
    case 'SET_EXPANDED':  return { ...state, expanded: state.expanded === action.id ? null : action.id };
    default: return state;
  }
}

// ── Video feed inside an octagon ──────────────────────────────────────────
function VideoOctInner({ stream }) {
  const vRef = useRef(null);
  useEffect(() => {
    if (vRef.current && stream) vRef.current.srcObject = stream;
  }, [stream]);
  if (!stream) return null;
  return (
    <video
      ref={vRef}
      autoPlay playsInline muted
      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
    />
  );
}

// ── Single octagonal guest cell ───────────────────────────────────────────
function OctCell({ guest, size, onClick, onDoubleClick, isSpotlight, isSpeaking, stream }) {
  const role = ROLE_CONFIG[guest.role] || ROLE_CONFIG.GUEST;
  const initials = (guest.name || 'G').slice(0, 2).toUpperCase();
  const hasLiveCam = !!stream && !guest.camOff;

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{ position: 'relative', width: size, height: size, cursor: 'pointer', flexShrink: 0 }}
    >
      {/* Speaking pulse ring */}
      {isSpeaking && (
        <motion.div
          style={{ position: 'absolute', inset: -3, clipPath: OCT, background: GOLD, zIndex: 0 }}
          animate={{ opacity: [0.35, 0.75, 0.35] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {/* Spotlight ring */}
      <div style={{ position: 'absolute', inset: 0, clipPath: OCT, background: isSpotlight ? GOLD + '70' : role.color + '50', transition: 'background 0.2s' }} />
      {/* Inner content */}
      <div style={{ position: 'absolute', inset: 3, clipPath: OCT, background: '#0d0618', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hasLiveCam ? (
          <VideoOctInner stream={stream} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: size * 0.35, height: size * 0.35, borderRadius: '50%', background: role.color + '30', border: '2px solid ' + role.color + '60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.18, fontWeight: 900, color: role.color, fontFamily: 'Barlow Condensed, sans-serif' }}>
              {initials}
            </div>
          </div>
        )}
      </div>
      {/* Mic indicator */}
      <div style={{ position: 'absolute', bottom: size * 0.12, left: '50%', transform: 'translateX(-50%)', width: size * 0.22, height: size * 0.22, borderRadius: '50%', background: guest.micMuted ? 'rgba(239,68,68,0.9)' : 'rgba(109,191,126,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        {guest.micMuted ? <MicOff size={size * 0.1} color="#fff" /> : <Mic size={size * 0.1} color="#fff" />}
      </div>
      {/* Role badge */}
      <div style={{ position: 'absolute', top: size * 0.06, left: '50%', transform: 'translateX(-50%)', background: role.color, borderRadius: 99, padding: '1px 5px', fontSize: size * 0.09, fontWeight: 900, color: role.textColor, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em', whiteSpace: 'nowrap', zIndex: 2 }}>
        {role.label}
      </div>
      {/* Name */}
      <div style={{ position: 'absolute', bottom: size * 0.32, left: '50%', transform: 'translateX(-50%)', fontSize: size * 0.1, fontWeight: 700, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', whiteSpace: 'nowrap', textShadow: '0 1px 4px rgba(0,0,0,0.8)', maxWidth: size * 0.8, overflow: 'hidden', textOverflow: 'ellipsis', zIndex: 2 }}>
        {guest.name}
      </div>
      {/* Speaking label */}
      {isSpeaking && (
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 0.9, repeat: Infinity }}
          style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 9, fontWeight: 900, color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}
        >
          ● SPEAKING
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Ghost slot ────────────────────────────────────────────────────────────
function GhostCell({ size }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, clipPath: OCT, border: '2px dashed rgba(212,175,55,0.2)', background: 'rgba(255,255,255,0.02)' }} />
      <div style={{ position: 'absolute', inset: 3, clipPath: OCT, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: size * 0.18, color: 'rgba(212,175,55,0.3)' }}>+</span>
        <span style={{ fontSize: size * 0.09, color: 'rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>OPEN</span>
      </div>
    </div>
  );
}

// ── Bigo-style spotlight: full stage + thumbnail strip ────────────────────
function SpotlightView({ spotlightGuest, allGuests, streams, isSpeaking, dispatch, isHost, speakingIds }) {
  const videoRef = useRef(null);
  const stream = streams[spotlightGuest.id] || null;
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  const role = ROLE_CONFIG[spotlightGuest.role] || ROLE_CONFIG.GUEST;
  const others = allGuests.filter(g => g.id !== spotlightGuest.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Full-stage featured view */}
      <div style={{ position: 'relative', background: '#050310', border: `2px solid ${isSpeaking ? GOLD : 'rgba(212,175,55,0.3)'}`, borderRadius: 14, aspectRatio: '16/9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.3s' }}>
        {stream ? (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: role.color + '25', border: '3px solid ' + role.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{role.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{spotlightGuest.name}</div>
          </div>
        )}
        {/* Overlays */}
        <div style={{ position: 'absolute', top: 10, left: 10, background: GOLD, color: '#000', fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 6, fontFamily: 'Barlow Condensed, sans-serif' }}>⭐ SPOTLIGHT</div>
        {isSpeaking && (
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ position: 'absolute', top: 10, right: 44, background: 'rgba(109,191,126,0.9)', color: '#fff', fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 6, fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            ● SPEAKING
          </motion.div>
        )}
        <button
          onClick={() => dispatch({ type: 'SET_SPOTLIGHT', id: spotlightGuest.id })}
          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '4px 8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          ✕
        </button>
        {/* Name bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', padding: '20px 14px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          {isHost && (
            <>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_MIC', id: spotlightGuest.id })}
                style={{ padding: '4px 10px', borderRadius: 6, border: spotlightGuest.micMuted ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(109,191,126,0.5)', background: spotlightGuest.micMuted ? 'rgba(239,68,68,0.2)' : 'rgba(109,191,126,0.15)', color: spotlightGuest.micMuted ? '#ef4444' : '#6DBF7E', cursor: 'pointer', fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {spotlightGuest.micMuted ? <MicOff size={10} /> : <Mic size={10} />}
                {spotlightGuest.micMuted ? 'UNMUTE' : 'MUTE'}
              </button>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_CAM', id: spotlightGuest.id })}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(212,133,74,0.4)', background: 'rgba(212,133,74,0.1)', color: '#D4854A', cursor: 'pointer', fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {spotlightGuest.camOff ? <VideoOff size={10} /> : <Video size={10} />} CAM
              </button>
            </>
          )}
          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', marginLeft: 'auto' }}>{spotlightGuest.name}</span>
          <span style={{ fontSize: 11, color: (ROLE_CONFIG[spotlightGuest.role] || ROLE_CONFIG.GUEST).color, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>{(ROLE_CONFIG[spotlightGuest.role] || ROLE_CONFIG.GUEST).label}</span>
        </div>
      </div>

      {/* Thumbnail strip — remaining 19 guests */}
      {others.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 0', scrollbarWidth: 'none' }}>
          {others.map(g => (
            <OctCell
              key={g.id}
              guest={g}
              size={56}
              stream={streams[g.id] || null}
              isSpeaking={speakingIds ? speakingIds.has(g.user_id || g.id) : false}
              isSpotlight={false}
              onClick={() => dispatch({ type: 'SET_SPOTLIGHT', id: g.id })}
              onDoubleClick={() => dispatch({ type: 'SET_EXPANDED', id: g.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Director "manage guest" modal ─────────────────────────────────────────
function DirectorModal({ guest, onClose, onMuteMic, onToggleCam, onRemove, onSpotlight }) {
  const role = ROLE_CONFIG[guest.role] || ROLE_CONFIG.GUEST;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#0d0618', border: `1px solid ${role.color}40`, borderRadius: 20, padding: 28, width: '88vw', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}
      >
        <div style={{ width: 96, height: 96, clipPath: OCT, background: role.color + '25', border: '3px solid ' + role.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{role.icon}</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{guest.name}</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: role.color, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>{role.label}</div>
        </div>
        {/* Director controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          <button onClick={onSpotlight} style={{ padding: '8px 16px', borderRadius: 9, border: `1px solid ${GOLD}60`, background: `${GOLD}15`, color: GOLD, cursor: 'pointer', fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Star size={12} /> SPOTLIGHT
          </button>
          <button onClick={onMuteMic} style={{ padding: '8px 16px', borderRadius: 9, border: guest.micMuted ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(109,191,126,0.5)', background: guest.micMuted ? 'rgba(239,68,68,0.12)' : 'rgba(109,191,126,0.1)', color: guest.micMuted ? '#ef4444' : '#6DBF7E', cursor: 'pointer', fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            {guest.micMuted ? <MicOff size={12} /> : <Mic size={12} />} {guest.micMuted ? 'UNMUTE' : 'MUTE'}
          </button>
          <button onClick={onToggleCam} style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid rgba(212,133,74,0.4)', background: 'rgba(212,133,74,0.08)', color: '#D4854A', cursor: 'pointer', fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            {guest.camOff ? <VideoOff size={12} /> : <Video size={12} />} CAM {guest.camOff ? 'ON' : 'OFF'}
          </button>
          <button onClick={onRemove} style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <X size={12} /> REMOVE
          </button>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif' }}>Close</button>
      </motion.div>
    </motion.div>
  );
}

// ── Main PanelGrid export ─────────────────────────────────────────────────
export default function PanelGrid({
  guests: propGuests,
  isHost,
  onRemoveGuest,
  compact,
  streams = {},
  speakingIds,       // Set<userId> from useMultiSpeakingSet / useRemoteSpeakingMap
  autoSpotlight,     // boolean — auto-spotlights loudest active speaker
}) {
  const [state, dispatch] = useReducer(reducer, { ...initState, guests: propGuests || [] });
  const lastTap = useRef({});
  const autoSpotlightTimer = useRef(null);

  // Auto-spotlight: when a new speaker appears and no spotlight is active, promote them
  useEffect(() => {
    if (!autoSpotlight || !speakingIds || speakingIds.size === 0) return;
    if (state.spotlight) return; // host already chose someone
    const guests = state.guests;
    const firstSpeaker = guests.find(g => speakingIds.has(g.user_id || g.id));
    if (firstSpeaker) {
      // debounce 800ms to avoid jitter
      clearTimeout(autoSpotlightTimer.current);
      autoSpotlightTimer.current = setTimeout(() => {
        dispatch({ type: 'SET_SPOTLIGHT', id: firstSpeaker.id });
      }, 800);
    }
    return () => clearTimeout(autoSpotlightTimer.current);
  }, [speakingIds, autoSpotlight, state.spotlight, state.guests]);

  const guests = state.guests;
  const cols = getGridCols(guests.length);
  const cellSize = compact
    ? 72
    : Math.min(130, Math.floor((Math.min(window.innerWidth, 900) - 40) / cols));
  const ghostCount = Math.max(0, Math.min(3, MAX_PANEL_GUESTS - guests.length));

  const spotlightGuest = guests.find(g => g.id === state.spotlight);
  const expandedGuest  = guests.find(g => g.id === state.expanded);

  function handleTap(id) {
    const now = Date.now();
    const last = lastTap.current[id] || 0;
    if (now - last < 320) {
      dispatch({ type: 'SET_EXPANDED', id });
    } else {
      dispatch({ type: 'SET_SPOTLIGHT', id });
    }
    lastTap.current[id] = now;
  }

  function isSpeaking(guest) {
    if (!speakingIds) return false;
    return speakingIds.has(guest.user_id || guest.id);
  }

  return (
    <div style={{ position: 'relative', background: '#07050A', borderRadius: compact ? 0 : 16, padding: compact ? 6 : 14, fontFamily: 'Rajdhani, sans-serif' }}>
      <AnimatePresence>
        {expandedGuest && isHost && (
          <DirectorModal
            guest={expandedGuest}
            onClose={() => dispatch({ type: 'SET_EXPANDED', id: expandedGuest.id })}
            onSpotlight={() => {
              dispatch({ type: 'SET_SPOTLIGHT', id: expandedGuest.id });
              dispatch({ type: 'SET_EXPANDED', id: expandedGuest.id });
            }}
            onMuteMic={() => {
              dispatch({ type: 'TOGGLE_MIC', id: expandedGuest.id });
              base44.entities.Participant.update(expandedGuest.id, { is_audio_enabled: !!expandedGuest.micMuted }).catch(() => {});
            }}
            onToggleCam={() => {
              dispatch({ type: 'TOGGLE_CAM', id: expandedGuest.id });
              base44.entities.Participant.update(expandedGuest.id, { is_video_enabled: !!expandedGuest.camOff }).catch(() => {});
            }}
            onRemove={() => {
              dispatch({ type: 'REMOVE_GUEST', id: expandedGuest.id });
              base44.entities.Participant.update(expandedGuest.id, { role: 'viewer', is_streaming: false }).catch(() => {});
              if (onRemoveGuest) onRemoveGuest(expandedGuest.id);
            }}
          />
        )}
      </AnimatePresence>

      {/* Bigo-style spotlight (full-stage + thumbnail strip) */}
      {spotlightGuest ? (
        <SpotlightView
          spotlightGuest={spotlightGuest}
          allGuests={guests}
          streams={streams}
          isSpeaking={isSpeaking(spotlightGuest)}
          dispatch={dispatch}
          isHost={isHost}
          speakingIds={speakingIds}
        />
      ) : (
        /* Auto-scaling grid */
        <motion.div
          layout
          style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`, gap: compact ? 6 : 10, justifyContent: 'center' }}
        >
          <AnimatePresence>
            {guests.map(guest => (
              <OctCell
                key={guest.id}
                guest={guest}
                size={cellSize}
                stream={streams[guest.id] || null}
                isSpeaking={isSpeaking(guest)}
                isSpotlight={false}
                onClick={() => handleTap(guest.id)}
                onDoubleClick={() => dispatch({ type: 'SET_EXPANDED', id: guest.id })}
              />
            ))}
            {Array.from({ length: ghostCount }).map((_, i) => (
              <GhostCell key={'ghost_' + i} size={cellSize} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!compact && (
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
          {guests.length}/{MAX_PANEL_GUESTS} · Tap = Spotlight · Double-tap = Director controls
        </div>
      )}
    </div>
  );
}
