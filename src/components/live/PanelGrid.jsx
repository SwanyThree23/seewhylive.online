import React, { useReducer, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Star, Mic, MicOff, Video, VideoOff, X, Maximize2, Plus } from 'lucide-react';

const MAX_PANEL_GUESTS = 20;
const OCT = 'polygon(29% 0%,71% 0%,100% 29%,100% 71%,71% 100%,29% 100%,0% 71%,0% 29%)';

const ROLE_CONFIG = {
  HOST:     { label: 'HOST',     color: '#d4af37', icon: '👑', textColor: '#000' },
  COHOST:   { label: 'CO-HOST', color: '#D4AF37', icon: '⚡', textColor: '#000' },
  FEATURED: { label: 'FEATURED', color: '#C0392B', icon: '⭐', textColor: '#fff' },
  GUEST:    { label: 'GUEST',    color: '#D4854A', icon: '🎙', textColor: '#000' },
  VIEWER:   { label: 'VIEWER',   color: '#666',    icon: '👁', textColor: '#fff' },
};

function getGridCols(count) {
  if (count <= 2) return 2;
  if (count <= 6) return 3;
  if (count <= 12) return 4;
  return 5;
}

const initState = {
  spotlight: null,
  expanded: null,
  guests: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_GUESTS': return { ...state, guests: action.payload };
    case 'ADD_GUEST':
      if (state.guests.length >= MAX_PANEL_GUESTS) return state;
      return { ...state, guests: [...state.guests, action.payload] };
    case 'REMOVE_GUEST':
      return { ...state, guests: state.guests.filter(g => g.id !== action.id), spotlight: state.spotlight === action.id ? null : state.spotlight, expanded: state.expanded === action.id ? null : state.expanded };
    case 'TOGGLE_MIC':
      return { ...state, guests: state.guests.map(g => g.id === action.id ? { ...g, micMuted: !g.micMuted } : g) };
    case 'TOGGLE_CAM':
      return { ...state, guests: state.guests.map(g => g.id === action.id ? { ...g, camOff: !g.camOff } : g) };
    case 'SET_SPOTLIGHT':
      return { ...state, spotlight: state.spotlight === action.id ? null : action.id };
    case 'SET_EXPANDED':
      return { ...state, expanded: state.expanded === action.id ? null : action.id };
    default: return state;
  }
}

function VideoOctInner({ stream, size }) {
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

function OctCell({ guest, size, onClick, onDoubleClick, isSpotlight, stream }) {
  var role = ROLE_CONFIG[guest.role] || ROLE_CONFIG.GUEST;
  var initials = (guest.name || 'G').slice(0, 2).toUpperCase();
  var hasLiveCam = !!stream && !guest.camOff;
  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{ position: 'relative', width: size, height: size, cursor: 'pointer', flexShrink: 0 }}
    >
      {/* Outer ring — role color / spotlight gold */}
      <div style={{ position: 'absolute', inset: 0, clipPath: OCT, background: isSpotlight ? '#d4af37' : role.color + '60', transition: 'background 0.2s' }} />
      {/* Inner content */}
      <div style={{ position: 'absolute', inset: 3, clipPath: OCT, background: '#0d0618', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hasLiveCam ? (
          <VideoOctInner stream={stream} size={size} />
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
    </motion.div>
  );
}

function GhostCell({ size }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, clipPath: OCT, border: '2px dashed rgba(212,175,55,0.25)', background: 'rgba(255,255,255,0.02)' }} />
      <div style={{ position: 'absolute', inset: 3, clipPath: OCT, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3 }}>
        <Plus size={size * 0.15} color="rgba(212,175,55,0.4)" />
        <span style={{ fontSize: size * 0.09, color: 'rgba(212,175,55,0.4)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>OPEN</span>
      </div>
    </div>
  );
}

function ExpandedModal({ guest, onClose, onMuteMic, onToggleCam, onRemove }) {
  var role = ROLE_CONFIG[guest.role] || ROLE_CONFIG.GUEST;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#0d0618', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 20, padding: 32, width: '90vw', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
      >
        <div style={{ width: 120, height: 120, clipPath: OCT, background: role.color + '30', border: '3px solid ' + role.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
          {role.icon}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{guest.name}</div>
          <div style={{ fontSize: 12, fontWeight: 900, color: role.color, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>{role.label}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onMuteMic} style={{ padding: '10px 20px', borderRadius: 10, border: guest.micMuted ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(109,191,126,0.5)', background: guest.micMuted ? 'rgba(239,68,68,0.15)' : 'rgba(109,191,126,0.1)', color: guest.micMuted ? '#ef4444' : '#6DBF7E', cursor: 'pointer', fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
            {guest.micMuted ? <MicOff size={14} /> : <Mic size={14} />} {guest.micMuted ? 'UNMUTE' : 'MUTE'}
          </button>
          <button onClick={onToggleCam} style={{ padding: '10px 20px', borderRadius: 10, border: guest.camOff ? '1px solid rgba(212,133,74,0.5)' : '1px solid rgba(212,133,74,0.4)', background: guest.camOff ? 'rgba(212,133,74,0.1)' : 'rgba(212,133,74,0.06)', color: guest.camOff ? '#D4854A' : '#D4AF37', cursor: 'pointer', fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
            {guest.camOff ? <VideoOff size={14} /> : <Video size={14} />} CAM {guest.camOff ? 'ON' : 'OFF'}
          </button>
          <button onClick={onRemove} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
            <X size={14} /> REMOVE
          </button>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif' }}>Close</button>
      </motion.div>
    </motion.div>
  );
}

export default function PanelGrid({ guests: propGuests, isHost, onRemoveGuest, compact, streams = {} }) {
  const [state, dispatch] = useReducer(reducer, { ...initState, guests: propGuests || [] });
  var lastTap = useRef({});

  var guests = state.guests;
  var cols = getGridCols(guests.length);
  var cellSize = compact ? 80 : Math.min(140, Math.floor((Math.min(window.innerWidth, 900) - 40) / cols));
  var ghostCount = Math.max(0, Math.min(4, MAX_PANEL_GUESTS - guests.length));

  var spotlightGuest = guests.find(g => g.id === state.spotlight);
  var expandedGuest = guests.find(g => g.id === state.expanded);

  function handleTap(id) {
    var now = Date.now();
    var last = lastTap.current[id] || 0;
    if (now - last < 300) {
      dispatch({ type: 'SET_EXPANDED', id });
    } else {
      dispatch({ type: 'SET_SPOTLIGHT', id });
    }
    lastTap.current[id] = now;
  }

  return (
    <div style={{ position: 'relative', background: '#07050A', borderRadius: compact ? 0 : 16, padding: compact ? 8 : 16, fontFamily: 'Rajdhani, sans-serif' }}>
      <AnimatePresence>
        {expandedGuest && (
          <ExpandedModal
            guest={expandedGuest}
            onClose={() => dispatch({ type: 'SET_EXPANDED', id: expandedGuest.id })}
            onMuteMic={() => dispatch({ type: 'TOGGLE_MIC', id: expandedGuest.id })}
            onToggleCam={() => dispatch({ type: 'TOGGLE_CAM', id: expandedGuest.id })}
            onRemove={() => { dispatch({ type: 'REMOVE_GUEST', id: expandedGuest.id }); dispatch({ type: 'SET_EXPANDED', id: null }); if (onRemoveGuest) onRemoveGuest(expandedGuest.id); }}
          />
        )}
      </AnimatePresence>

      {/* Spotlight view */}
      {spotlightGuest && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ background: '#0d0618', border: '2px solid #d4af37', borderRadius: 14, aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, marginBottom: 10, position: 'relative' }}>
            <div style={{ fontSize: 48 }}>{(ROLE_CONFIG[spotlightGuest.role] || ROLE_CONFIG.GUEST).icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>{spotlightGuest.name}</div>
            <div style={{ position: 'absolute', top: 10, right: 10, background: '#d4af37', color: '#000', fontSize: 11, fontWeight: 900, padding: '3px 10px', borderRadius: 6, fontFamily: 'Barlow Condensed, sans-serif' }}>SPOTLIGHT</div>
            <button onClick={() => dispatch({ type: 'SET_SPOTLIGHT', id: spotlightGuest.id })} style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '4px 8px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif' }}>✕ Close</button>
          </div>
          {/* Thumbnail strip for non-spotlighted */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0' }}>
            {guests.filter(g => g.id !== state.spotlight).map(g => (
              <OctCell key={g.id} guest={g} size={64} stream={streams[g.id] || null} onClick={() => handleTap(g.id)} onDoubleClick={() => dispatch({ type: 'SET_EXPANDED', id: g.id })} isSpotlight={false} />
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {!spotlightGuest && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`, gap: 10, justifyContent: 'center' }}>
          <AnimatePresence>
            {guests.map(guest => (
              <OctCell
                key={guest.id}
                guest={guest}
                size={cellSize}
                stream={streams[guest.id] || null}
                onClick={() => handleTap(guest.id)}
                onDoubleClick={() => dispatch({ type: 'SET_EXPANDED', id: guest.id })}
                isSpotlight={state.spotlight === guest.id}
              />
            ))}
            {Array.from({ length: ghostCount }).map((_, i) => (
              <GhostCell key={'ghost_' + i} size={cellSize} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Cap notice */}
      {!compact && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
          {guests.length}/{MAX_PANEL_GUESTS} GUESTS · MAX_PANEL_GUESTS = 20 · Tap to spotlight · Double-tap to manage
        </div>
      )}
    </div>
  );
}