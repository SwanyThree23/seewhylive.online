import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Plus, ChevronDown, Trash2, Shuffle } from 'lucide-react';

// ─── Brand tokens ──────────────────────────────────────────────────────────
const BG      = '#080B18';
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const SHEET   = '#0E1120';
const SURFACE = '#141729';
const BORDER  = 'rgba(212,175,55,0.18)';
const OCT     = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const FONT    = { fontFamily: "'Barlow Condensed', sans-serif" };

// Palette for auto-coloring participant tiles
const TILE_COLORS = [
  '#8B4513', '#6B4A9A', '#4A7A9B', '#6B8B4A', '#9B6B4A',
  '#4A6B8B', '#8B4A6B', '#6B8B4A', '#4A8B6B', '#9B8B4A',
  '#4A4A8B', '#8B4A4A', '#4A8B8B',
];

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.slice(0, 2)).toUpperCase();
}

function getTileColor(id) {
  const idx = typeof id === 'number' ? id : String(id).charCodeAt(0);
  return TILE_COLORS[idx % TILE_COLORS.length];
}

// ─── Octagonal avatar tile ──────────────────────────────────────────────────
function OctTile({ size = 40, participant, fontSize = 13 }) {
  const name  = participant?.full_name || participant?.name || '?';
  const color = getTileColor(participant?.id ?? 0);
  return (
    <div
      title={name}
      style={{
        width: size,
        height: size,
        clipPath: OCT,
        background: `linear-gradient(135deg, ${color}DD, ${color}88)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{ ...FONT, fontSize, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
        {getInitials(name)}
      </span>
    </div>
  );
}

// ─── Capacity pill selector ─────────────────────────────────────────────────
function CapacityPills({ value, onChange }) {
  const options = [2, 4, 6, 8];
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            ...FONT,
            padding: '4px 14px',
            borderRadius: 999,
            border: `1.5px solid ${value === n ? GOLD : 'rgba(255,255,255,0.15)'}`,
            background: value === n ? `linear-gradient(135deg, ${GOLD}33, ${GOLD}11)` : 'transparent',
            color: value === n ? GOLD : 'rgba(255,255,255,0.6)',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.18s',
          }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// ─── Countdown badge shown after room creation ──────────────────────────────
function CountdownBadge({ roomId, onDone }) {
  const [secs, setSecs] = useState(5);

  useEffect(() => {
    if (secs <= 0) {
      onDone(roomId);
      return;
    }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, roomId, onDone]);

  return (
    <motion.span
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.7, opacity: 0 }}
      style={{
        ...FONT,
        fontSize: 11,
        fontWeight: 700,
        background: `linear-gradient(135deg, ${GOLD}, #b8962e)`,
        color: BG,
        borderRadius: 999,
        padding: '2px 9px',
        whiteSpace: 'nowrap',
      }}
    >
      Room Opens In… {secs}s
    </motion.span>
  );
}

// ─── Assign dropdown ────────────────────────────────────────────────────────
function AssignDropdown({ unassigned, onAssign, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 6px)',
        right: 0,
        minWidth: 200,
        background: '#1a1f35',
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: '6px 0',
        zIndex: 50,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {unassigned.length === 0 ? (
        <p style={{ ...FONT, fontSize: 13, color: 'rgba(255,255,255,0.45)', padding: '8px 14px' }}>
          All participants assigned
        </p>
      ) : (
        unassigned.map((p) => (
          <button
            key={p.id}
            onClick={() => { onAssign(p); onClose(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '8px 14px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <OctTile size={30} participant={p} fontSize={11} />
            <span style={{ ...FONT, fontSize: 14, fontWeight: 600, color: '#fff' }}>
              {p.full_name || p.name}
            </span>
          </button>
        ))
      )}
    </motion.div>
  );
}

// ─── Room card ──────────────────────────────────────────────────────────────
function RoomCard({ room, unassigned, onAssign, onRemoveParticipant, onDelete, isNew, onCountdownDone }) {
  const [dropOpen, setDropOpen] = useState(false);
  const isActive = room.participants.length > 0;
  const isFull   = room.participants.length >= room.capacity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -10 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: SURFACE,
        border: `1.5px solid ${isActive ? 'rgba(34,197,94,0.35)' : BORDER}`,
        borderRadius: 16,
        padding: '14px 16px',
        position: 'relative',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...FONT, fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
              {room.name}
            </span>

            {isActive && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  ...FONT,
                  fontSize: 10,
                  fontWeight: 700,
                  background: 'rgba(34,197,94,0.18)',
                  color: '#6DBF7E',
                  border: '1px solid rgba(34,197,94,0.4)',
                  borderRadius: 999,
                  padding: '1px 8px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Active
              </motion.span>
            )}

            <AnimatePresence>
              {isNew && (
                <CountdownBadge roomId={room.id} onDone={onCountdownDone} />
              )}
            </AnimatePresence>
          </div>

          {room.purpose && (
            <p style={{
              ...FONT,
              fontSize: 13,
              color: 'rgba(255,255,255,0.5)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {room.purpose}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Capacity badge */}
          <span style={{
            ...FONT,
            fontSize: 12,
            fontWeight: 700,
            color: isFull ? GOLD : 'rgba(255,255,255,0.55)',
            background: isFull ? `${GOLD}18` : 'rgba(255,255,255,0.07)',
            border: `1px solid ${isFull ? GOLD + '44' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 999,
            padding: '2px 10px',
            transition: 'all 0.2s',
          }}>
            <Users size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {room.participants.length}/{room.capacity}
          </span>

          <button
            onClick={(e) => { e.stopPropagation(); onDelete(room.id); }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)',
              padding: 2,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6b6b'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
            title="Delete room"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Participant tiles row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 48, flexWrap: 'wrap' }}>
        {room.participants.length === 0 ? (
          <span style={{ ...FONT, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            No participants yet
          </span>
        ) : (
          <AnimatePresence>
            {room.participants.map((p) => (
              <motion.div
                key={p.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.18 }}
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); onRemoveParticipant(room.id, p.id); }}
                title={`Remove ${p.full_name || p.name}`}
              >
                <OctTile size={40} participant={p} />
                {/* Red overlay on hover */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    clipPath: OCT,
                    background: 'rgba(200,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={14} color="#fff" />
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Assign button */}
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <button
            disabled={isFull}
            onClick={(e) => { e.stopPropagation(); setDropOpen((v) => !v); }}
            style={{
              ...FONT,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 13px',
              background: isFull
                ? 'rgba(255,255,255,0.06)'
                : `linear-gradient(135deg, ${GOLD}22, ${GOLD}0a)`,
              border: `1px solid ${isFull ? 'rgba(255,255,255,0.1)' : GOLD + '55'}`,
              borderRadius: 999,
              color: isFull ? 'rgba(255,255,255,0.3)' : GOLD,
              fontSize: 13,
              fontWeight: 700,
              cursor: isFull ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s',
            }}
          >
            <Plus size={12} />
            Assign
            <ChevronDown size={12} style={{ transform: dropOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>

          <AnimatePresence>
            {dropOpen && (
              <AssignDropdown
                unassigned={unassigned}
                onAssign={(p) => onAssign(room.id, p)}
                onClose={() => setDropOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function BreakoutRoomsModal({
  isOpen,
  onClose,
  roomId,
  roomTitle,
  currentUser,
  participants = [],
}) {
  const isHost = currentUser?.role === 'host' || currentUser?.isHost;

  // ── Form state ──
  const [roomName, setRoomName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [purpose, setPurpose]   = useState('');

  // ── Breakout rooms state ──
  const [breakoutRooms, setBreakoutRooms] = useState([]);
  const [newRoomIds, setNewRoomIds]       = useState(new Set());
  const nextId = useRef(1);

  // ── Focused room for click-to-assign from unassigned section ──
  const [focusedRoomId, setFocusedRoomId] = useState(null);

  // ── Derived: set of all assigned participant IDs ──
  const assignedIds = new Set(
    breakoutRooms.flatMap((r) => r.participants.map((p) => p.id))
  );
  const unassigned = participants.filter((p) => !assignedIds.has(p.id));

  // ── Handlers ──
  function handleCreate() {
    const name = roomName.trim() || `Breakout Group ${breakoutRooms.length + 1}`;
    const id   = nextId.current++;
    const room = { id, name, capacity, participants: [], purpose: purpose.trim() };
    setBreakoutRooms((prev) => [...prev, room]);
    setNewRoomIds((prev) => new Set([...prev, id]));
    setRoomName('');
    setPurpose('');
    // Auto-focus newly created room so unassigned clicks go there
    setFocusedRoomId(id);
  }

  const handleCountdownDone = useCallback((id) => {
    setNewRoomIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  function handleAssign(targetRoomId, participant) {
    setBreakoutRooms((prev) =>
      prev.map((r) => {
        if (r.id !== targetRoomId) return r;
        if (r.participants.find((p) => p.id === participant.id)) return r;
        if (r.participants.length >= r.capacity) return r;
        return { ...r, participants: [...r.participants, participant] };
      })
    );
  }

  function handleRemoveParticipant(targetRoomId, participantId) {
    setBreakoutRooms((prev) =>
      prev.map((r) =>
        r.id === targetRoomId
          ? { ...r, participants: r.participants.filter((p) => p.id !== participantId) }
          : r
      )
    );
  }

  function handleDeleteRoom(id) {
    setBreakoutRooms((prev) => prev.filter((r) => r.id !== id));
    setNewRoomIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (focusedRoomId === id) setFocusedRoomId(null);
  }

  function handleEndAll() {
    setBreakoutRooms([]);
    setNewRoomIds(new Set());
    setFocusedRoomId(null);
  }

  function handleUnassignedClick(participant) {
    if (!focusedRoomId) return;
    const room = breakoutRooms.find((r) => r.id === focusedRoomId);
    if (!room || room.participants.length >= room.capacity) return;
    handleAssign(focusedRoomId, participant);
  }

  function toggleFocus(id) {
    setFocusedRoomId((prev) => (prev === id ? null : id));
  }

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setFocusedRoomId(null);
    }
  }, [isOpen]);

  const focusedRoom = breakoutRooms.find((r) => r.id === focusedRoomId);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="brm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 9998,
            }}
          />

          {/* Bottom sheet */}
          <motion.div
            key="brm-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '75vh',
              background: SHEET,
              borderRadius: '24px 24px 0 0',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 -8px 48px rgba(0,0,0,0.7)',
            }}
          >
            {/* Handle bar */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
              <div style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.2)',
              }} />
            </div>

            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px 14px',
              borderBottom: `1px solid ${BORDER}`,
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>🔀</span>
                <span style={{ ...FONT, fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
                  Breakout Rooms
                </span>
                {roomTitle && (
                  <span style={{ ...FONT, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                    — {roomTitle}
                  </span>
                )}
              </div>

              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.7)',
                  transition: 'background 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              >
                <X size={17} />
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px 32px' }}>

              {/* ── Create form (host only) ── */}
              {isHost && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  style={{
                    background: SURFACE,
                    border: `1.5px solid ${BORDER}`,
                    borderRadius: 16,
                    padding: '16px',
                    marginBottom: 20,
                  }}
                >
                  <p style={{
                    ...FONT,
                    fontSize: 13,
                    fontWeight: 700,
                    color: GOLD,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}>
                    Create Room
                  </p>

                  {/* Room name */}
                  <input
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder={`Breakout Group ${breakoutRooms.length + 1}`}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                    style={{
                      ...FONT,
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 600,
                      outline: 'none',
                      marginBottom: 12,
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = `${GOLD}66`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  />

                  {/* Capacity pills */}
                  <div style={{ marginBottom: 12 }}>
                    <p style={{
                      ...FONT,
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.45)',
                      marginBottom: 6,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}>
                      Capacity
                    </p>
                    <CapacityPills value={capacity} onChange={setCapacity} />
                  </div>

                  {/* Purpose */}
                  <input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Discussion topic or theme..."
                    style={{
                      ...FONT,
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 10,
                      padding: '9px 14px',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 500,
                      outline: 'none',
                      marginBottom: 14,
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = `${GOLD}66`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  />

                  {/* Create button */}
                  <motion.button
                    onClick={handleCreate}
                    whileHover={{ scale: 1.01, brightness: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      ...FONT,
                      width: '100%',
                      padding: '11px 0',
                      borderRadius: 12,
                      border: 'none',
                      background: `linear-gradient(135deg, ${GOLD}, #b8962e)`,
                      color: BG,
                      fontSize: 16,
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Plus size={16} />
                    Create Room
                  </motion.button>
                </motion.div>
              )}

              {/* ── Unassigned participants section ── */}
              {unassigned.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ marginBottom: 20 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{
                      ...FONT,
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.55)',
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                    }}>
                      Unassigned
                    </span>
                    <span style={{
                      ...FONT,
                      fontSize: 11,
                      fontWeight: 700,
                      background: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.55)',
                      borderRadius: 999,
                      padding: '1px 8px',
                    }}>
                      {unassigned.length}
                    </span>
                    {focusedRoom ? (
                      <span style={{ ...FONT, fontSize: 12, color: `${GOLD}bb`, marginLeft: 4 }}>
                        Click to add to &quot;{focusedRoom.name}&quot;
                      </span>
                    ) : (
                      breakoutRooms.length > 0 && (
                        <span style={{ ...FONT, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>
                          Select a room below to enable quick-assign
                        </span>
                      )
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 12,
                    overflowX: 'auto',
                    paddingBottom: 8,
                    scrollbarWidth: 'none',
                  }}>
                    <AnimatePresence>
                      {unassigned.map((p) => {
                        const canAssign = !!focusedRoom && focusedRoom.participants.length < focusedRoom.capacity;
                        return (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.18 }}
                            onClick={() => handleUnassignedClick(p)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 5,
                              flexShrink: 0,
                              cursor: canAssign ? 'pointer' : 'default',
                              opacity: focusedRoomId ? (canAssign ? 1 : 0.5) : 0.7,
                              transition: 'opacity 0.18s',
                            }}
                          >
                            <motion.div
                              whileHover={canAssign ? { scale: 1.12 } : {}}
                              whileTap={canAssign ? { scale: 0.94 } : {}}
                            >
                              <OctTile size={44} participant={p} />
                            </motion.div>
                            <span style={{
                              ...FONT,
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.6)',
                              maxWidth: 52,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textAlign: 'center',
                            }}>
                              {(p.full_name || p.name || '').split(' ')[0]}
                            </span>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* ── Rooms list ── */}
              {breakoutRooms.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    textAlign: 'center',
                    padding: '40px 0',
                    color: 'rgba(255,255,255,0.25)',
                  }}
                >
                  <Shuffle size={36} style={{ margin: '0 auto 12px', opacity: 0.35, display: 'block' }} />
                  <p style={{ ...FONT, fontSize: 16, fontWeight: 600 }}>No breakout rooms yet</p>
                  {isHost && (
                    <p style={{ ...FONT, fontSize: 14, marginTop: 4, color: 'rgba(255,255,255,0.3)' }}>
                      Create your first room above
                    </p>
                  )}
                </motion.div>
              ) : (
                <>
                  {/* Section label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{
                      ...FONT,
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.55)',
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                    }}>
                      Rooms
                    </span>
                    <span style={{
                      ...FONT,
                      fontSize: 11,
                      fontWeight: 700,
                      background: `${GOLD}22`,
                      color: GOLD,
                      border: `1px solid ${GOLD}44`,
                      borderRadius: 999,
                      padding: '1px 8px',
                    }}>
                      {breakoutRooms.length}
                    </span>
                    {isHost && (
                      <span style={{ ...FONT, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>
                        Click a room to focus for assignment
                      </span>
                    )}
                  </div>

                  {/* Room cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <AnimatePresence>
                      {breakoutRooms.map((room) => (
                        <div
                          key={room.id}
                          onClick={() => toggleFocus(room.id)}
                          style={{
                            outline: focusedRoomId === room.id ? `2px solid ${GOLD}88` : '2px solid transparent',
                            borderRadius: 18,
                            transition: 'outline 0.18s',
                            cursor: 'pointer',
                          }}
                        >
                          <RoomCard
                            room={room}
                            unassigned={participants.filter((p) => !assignedIds.has(p.id))}
                            onAssign={handleAssign}
                            onRemoveParticipant={handleRemoveParticipant}
                            onDelete={handleDeleteRoom}
                            isNew={newRoomIds.has(room.id)}
                            onCountdownDone={handleCountdownDone}
                          />
                        </div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* End all rooms button (host only) */}
                  {isHost && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      onClick={handleEndAll}
                      whileHover={{ background: `${CRIMSON}33` }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        ...FONT,
                        width: '100%',
                        marginTop: 20,
                        padding: '11px 0',
                        borderRadius: 12,
                        border: `1.5px solid ${CRIMSON}88`,
                        background: `${CRIMSON}18`,
                        color: '#ff6b6b',
                        fontSize: 15,
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <Trash2 size={15} />
                      End All Rooms
                    </motion.button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
