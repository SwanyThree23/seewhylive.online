import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mic, MicOff, Video, VideoOff, Users, Link, Copy, Check,
  Radio, Maximize2, Minimize2, Crown, UserX, Signal,
  WifiOff, Wifi, ChevronDown,
} from 'lucide-react';
import { useLocalMedia } from '@/hooks/useLocalMedia';
import { useWebRTCPeers } from '@/hooks/useWebRTCPeers';
import { useAudioLevel } from '@/hooks/useAudioLevel';

const MAX_SEATS   = 20;
const BG          = '#080B18';
const GOLD        = '#D4AF37';
const CRIM        = '#800020';
const T           = { fontFamily: 'Barlow Condensed, sans-serif' };
const OCT         = 'polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)';

const ROLE_COLOR = {
  host:     GOLD,
  'co-host': GOLD,
  speaker:  '#6DBF7E',
  guest:    '#D4854A',
  viewer:   '#555',
};

function connQuality(state) {
  if (state === 'connected')                       return { color: '#6DBF7E', bars: 3 };
  if (state === 'connecting' || state === 'new')   return { color: GOLD,     bars: 2 };
  if (state === 'disconnected')                    return { color: '#f59e0b', bars: 1 };
  return { color: '#ef4444', bars: 0 };
}

function QualityIcon({ state, size = 12 }) {
  const { color, bars } = connQuality(state);
  return (
    <div className="flex items-end gap-px" style={{ height: size }}>
      {[1, 2, 3].map(b => (
        <div key={b} style={{
          width: size * 0.22, borderRadius: 1,
          height: size * (b * 0.28),
          background: bars >= b ? color : 'rgba(255,255,255,0.12)',
        }} />
      ))}
    </div>
  );
}

/* ── Single seat tile ──────────────────────────────── */
function SeatTile({
  participant, stream, isLocal, peerState,
  isSpotlight, onSpotlight,
  isHost, onMute, onKick,
  size = 120,
}) {
  const videoRef = useRef(null);
  const { level, isSpeaking: speaking } = useAudioLevel(stream);
  const glow     = ROLE_COLOR[participant?.role] || GOLD;
  const quality  = peerState ? connQuality(peerState) : null;

  const hasVideo = !!stream
    && participant?.is_video_enabled !== false
    && stream.getVideoTracks?.().some(t => t.enabled && t.readyState !== 'ended');

  useEffect(() => {
    if (!videoRef.current) return;
    if (videoRef.current.srcObject !== (stream ?? null)) {
      videoRef.current.srcObject = stream ?? null;
      if (stream) videoRef.current.play?.().catch(() => {});
    }
  }, [stream]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      className="relative group flex flex-col items-center gap-1"
      style={{ width: size }}
    >
      {/* Speaking pulse */}
      {speaking && (
        <div className="absolute rounded-full animate-ping pointer-events-none"
          style={{ clipPath: OCT, width: size + 10, height: size + 10, top: -5, left: -5, background: `${glow}1A`, zIndex: 0 }} />
      )}

      {/* Octagonal cell */}
      <div onClick={() => onSpotlight?.(participant.id)}
        style={{
          clipPath: OCT, width: size, height: size,
          background: BG, overflow: 'hidden', position: 'relative',
          border: `3px solid ${speaking ? glow : isSpotlight ? GOLD : `${glow}44`}`,
          boxShadow: speaking ? `0 0 18px ${glow}55` : undefined,
          cursor: 'pointer',
        }}>
        {hasVideo ? (
          <video ref={videoRef} autoPlay playsInline muted={isLocal}
            className="w-full h-full object-cover"
            style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(145deg, ${glow}22, ${BG})` }}>
            {participant?.user_avatar ? (
              <img src={participant.user_avatar} alt="" className="w-full h-full object-cover opacity-60" />
            ) : (
              <span className="font-black" style={{ fontSize: size * 0.28, color: glow, ...T }}>
                {participant?.user_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
        )}

        {/* Live badge */}
        {participant?.is_streaming && (
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-px rounded-full"
            style={{ background: CRIM, border: `1px solid ${GOLD}44` }}>
            <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
            <span className="text-[7px] font-black text-white uppercase" style={T}>Live</span>
          </div>
        )}

        {/* Muted indicator */}
        {participant?.is_audio_enabled === false && (
          <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(200,50,50,0.85)' }}>
            <MicOff className="w-2.5 h-2.5 text-white" />
          </div>
        )}

        {/* Host controls (hover) */}
        {isHost && !isLocal && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5"
            style={{ background: 'rgba(0,0,0,0.7)' }}>
            <button onClick={e => { e.stopPropagation(); onMute?.(participant); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase"
              style={{ ...T, background: 'rgba(109,191,126,0.2)', border: '1px solid #6DBF7E55', color: '#6DBF7E', cursor: 'pointer' }}>
              <MicOff className="w-2.5 h-2.5" />
              Mute
            </button>
            <button onClick={e => { e.stopPropagation(); onKick?.(participant); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase"
              style={{ ...T, background: 'rgba(239,68,68,0.2)', border: '1px solid #ef444455', color: '#ef4444', cursor: 'pointer' }}>
              <UserX className="w-2.5 h-2.5" />
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Name + quality */}
      <div className="flex items-center gap-1" style={{ maxWidth: size + 8 }}>
        {(participant?.role === 'host' || participant?.role === 'co-host') && (
          <Crown className="w-2.5 h-2.5 shrink-0" style={{ color: GOLD }} />
        )}
        <span className="font-black truncate text-white" style={{ ...T, fontSize: 9, maxWidth: size - 20 }}>
          {participant?.user_name || 'Guest'}
        </span>
        {quality && <QualityIcon state={peerState} size={10} />}
        {isLocal && <span className="text-[7px] font-black px-1 rounded" style={{ ...T, background: `${CRIM}cc`, color: '#fff' }}>YOU</span>}
      </div>
    </motion.div>
  );
}

/* ── Empty seat ──────────────────────────────────── */
function EmptySeat({ size = 120, onInvite, isHost }) {
  return (
    <div onClick={isHost ? onInvite : undefined}
      className="flex flex-col items-center gap-1"
      style={{ width: size, cursor: isHost ? 'pointer' : 'default' }}>
      <div style={{ clipPath: OCT, width: size, height: size, background: 'rgba(255,255,255,0.015)', border: '2px dashed rgba(212,175,55,0.12)' }}
        className="flex items-center justify-center group-hover:border-[#d4af37]/30 transition-colors">
        {isHost && <Link className="w-4 h-4" style={{ color: 'rgba(212,175,55,0.2)' }} />}
      </div>
      {isHost && (
        <span className="text-[8px] font-black uppercase" style={{ ...T, color: 'rgba(212,175,55,0.25)' }}>Invite</span>
      )}
    </div>
  );
}

/* ── Invite modal ─────────────────────────────────── */
function InviteModal({ roomId, onClose }) {
  const [copied, setCopied] = useState(false);
  const token = useMemo(() => {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);
  const link = `${window.location.origin}/GuestJoin?room=${encodeURIComponent(roomId)}&token=${token}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); } catch { return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: '#0d1020', border: `1px solid ${GOLD}33` }}>
        <h3 className="font-black text-lg" style={{ ...T, color: GOLD }}>Invite Guest</h3>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)', ...T }}>
          Share this link — it grants one-click entry to the co-stream panel.
        </p>
        <div className="flex gap-2">
          <input readOnly value={link} className="flex-1 rounded-lg px-2 py-1.5 text-xs text-white truncate"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', ...T }} />
          <button onClick={copy}
            className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-black uppercase shrink-0"
            style={{ ...T, background: copied ? '#6DBF7E22' : `${GOLD}22`, border: `1px solid ${copied ? '#6DBF7E55' : `${GOLD}44`}`, color: copied ? '#6DBF7E' : GOLD, cursor: 'pointer' }}>
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <button onClick={onClose}
          className="text-xs self-center"
          style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', ...T }}>
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ── Grid layout helper ───────────────────────────── */
function gridCols(count) {
  if (count <= 2)  return 2;
  if (count <= 6)  return 3;
  if (count <= 12) return 4;
  return 5;
}

/* ── Main component ───────────────────────────────── */
/**
 * MultiGuestCoStreamPanel — native 20-seat WebRTC co-stream panel.
 * Replaces VDO.Ninja dependency with a direct peer mesh.
 *
 * Props:
 *   roomId        {string}  — room identifier for WebRTC + DB queries
 *   currentUser   {{ id, user_name, user_avatar, role }} — local user info
 *   isHost        {boolean}
 *   maxSeats      {number}  — up to 20
 *   onLeave       {()=>void}
 */
export default function MultiGuestCoStreamPanel({
  roomId,
  currentUser,
  isHost      = false,
  maxSeats    = MAX_SEATS,
  onLeave,
}) {
  const qc = useQueryClient();
  const [spotlight, setSpotlight]   = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Local media
  const {
    localStream,
    audioEnabled, toggleAudio,
    videoEnabled, toggleVideo,
    error: mediaError,
  } = useLocalMedia({ audio: true, video: true });

  // WebRTC mesh
  const {
    remoteStreams,
    peerStates,
    peerUserIds,
    announceJoin,
    leaveRoom,
  } = useWebRTCPeers(roomId, localStream);

  // DB participants
  const { data: participants = [] } = useQuery({
    queryKey: ['participants', roomId],
    queryFn: () => base44.entities.Participant.filter({ room_id: roomId }),
    enabled: !!roomId,
    refetchInterval: 5000,
  });

  // Announce join on mount
  useEffect(() => {
    if (roomId && currentUser?.id) announceJoin(currentUser.id);
    return () => { leaveRoom(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Mute mutation
  const muteMutation = useMutation({
    mutationFn: ({ participantId, enabled }) =>
      base44.entities.Participant.update(participantId, { is_audio_enabled: enabled }),
    onSuccess: () => qc.invalidateQueries(['participants', roomId]),
  });

  // Kick mutation (set role to viewer — keeps them in room but off stage)
  const kickMutation = useMutation({
    mutationFn: ({ participantId }) =>
      base44.entities.Participant.update(participantId, { role: 'viewer', is_streaming: false }),
    onSuccess: () => qc.invalidateQueries(['participants', roomId]),
  });

  const handleMute = useCallback((participant) => {
    const next = !(participant.is_audio_enabled ?? true);
    muteMutation.mutate({ participantId: participant.id, enabled: next });
  }, [muteMutation]);

  const handleKick = useCallback((participant) => {
    kickMutation.mutate({ participantId: participant.id });
  }, [kickMutation]);

  const handleLeave = () => { leaveRoom(); onLeave?.(); };

  // Build speaker list with streams attached
  const speakers = useMemo(() => {
    const onStage = participants
      .filter(p => ['host', 'co-host', 'speaker', 'guest'].includes(p.role))
      .slice(0, maxSeats);

    return onStage.map(p => {
      const isLocalUser = currentUser?.id && p.user_id === currentUser.id;
      if (isLocalUser) return { ...p, _stream: localStream, _isLocal: true, _peerState: 'connected' };

      const peerId = Array.from(peerUserIds.entries()).find(([, uid]) => uid === p.user_id)?.[0];
      const stream = peerId ? remoteStreams.get(peerId) : undefined;
      const state  = peerId ? peerStates.get(peerId)   : undefined;
      return { ...p, _stream: stream, _isLocal: false, _peerState: state };
    });
  }, [participants, peerUserIds, remoteStreams, peerStates, localStream, currentUser, maxSeats]);

  const viewers     = participants.filter(p => p.role === 'viewer');
  const emptySlots  = Math.max(0, Math.min(6, maxSeats - speakers.length));
  const cols        = gridCols(speakers.length || 1);
  const cellSize    = Math.min(140, Math.floor((Math.min(typeof window !== 'undefined' ? window.innerWidth : 900, 900) - 48) / cols));
  const spotlightP  = spotlight ? speakers.find(s => s.id === spotlight) : null;

  const totalConnected = [...peerStates.values()].filter(s => s === 'connected').length;

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden"
      style={{ background: BG, border: '1px solid rgba(212,175,55,0.12)' }}>

      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Radio className="w-3.5 h-3.5" style={{ color: CRIM }} />
        <span className="font-black text-sm uppercase flex-1" style={{ ...T, color: GOLD }}>Co-Stream Panel</span>

        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
          style={{ ...T, background: 'rgba(128,0,32,0.4)', border: '1px solid rgba(192,57,43,0.3)', color: 'rgba(255,255,255,0.7)' }}>
          {speakers.length}/{maxSeats}
        </span>

        <span className="text-[10px] flex items-center gap-1" style={{ color: '#6DBF7E', ...T }}>
          <Wifi className="w-3 h-3" />{totalConnected} live
        </span>

        {isHost && (
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase"
            style={{ ...T, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, color: GOLD, cursor: 'pointer' }}>
            <Link className="w-3 h-3" /> Invite
          </button>
        )}

        <button onClick={() => setShowSidebar(s => !s)}
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer' }}>
          <Users className="w-3.5 h-3.5 text-white opacity-50" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Video grid */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Spotlight */}
          {spotlightP ? (
            <div className="flex-1 flex flex-col gap-2 p-3 overflow-hidden">
              <div className="flex justify-center flex-1 min-h-0">
                <SeatTile
                  participant={spotlightP}
                  stream={spotlightP._stream}
                  isLocal={spotlightP._isLocal}
                  peerState={spotlightP._peerState}
                  isSpotlight
                  onSpotlight={() => setSpotlight(null)}
                  isHost={isHost}
                  onMute={handleMute}
                  onKick={handleKick}
                  size={Math.min(240, cellSize * 1.8)}
                />
              </div>
              {/* Thumbnails */}
              <div className="flex gap-3 overflow-x-auto pb-1 justify-center shrink-0">
                {speakers.filter(s => s.id !== spotlight).map(p => (
                  <SeatTile key={p.id}
                    participant={p} stream={p._stream}
                    isLocal={p._isLocal} peerState={p._peerState}
                    isHost={isHost} onMute={handleMute} onKick={handleKick}
                    onSpotlight={setSpotlight} size={64}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-3"
              style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`, gap: 12, justifyContent: 'center', alignContent: 'start' }}>
              <AnimatePresence>
                {speakers.map(p => (
                  <SeatTile key={p.id}
                    participant={p} stream={p._stream}
                    isLocal={p._isLocal} peerState={p._peerState}
                    isSpotlight={spotlight === p.id}
                    isHost={isHost} onMute={handleMute} onKick={handleKick}
                    onSpotlight={setSpotlight} size={cellSize}
                  />
                ))}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <EmptySeat key={`empty-${i}`} size={cellSize} isHost={isHost} onInvite={() => setShowInvite(true)} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Viewer strip */}
          {viewers.length > 0 && (
            <div className="shrink-0 px-3 py-2 flex items-center gap-2 overflow-x-auto"
              style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.2)' }}>
              <span className="text-[8px] font-black uppercase shrink-0" style={{ ...T, color: 'rgba(255,255,255,0.2)' }}>
                Watching
              </span>
              {viewers.slice(0, 20).map(v => (
                <div key={v.id} title={v.user_name}
                  className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[7px] font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${CRIM}, ${GOLD})` }}>
                  {v.user_name?.charAt(0)?.toUpperCase()}
                </div>
              ))}
              {viewers.length > 20 && (
                <span className="text-[8px] shrink-0" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
                  +{viewers.length - 20}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Sidebar — participant list + controls */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="shrink-0 flex flex-col overflow-hidden"
              style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,3,12,0.5)' }}>
              <div className="px-3 py-2 text-[10px] font-black uppercase"
                style={{ ...T, color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                Participants ({participants.length})
              </div>
              <div className="flex-1 overflow-y-auto">
                {participants.map(p => {
                  const peerId = Array.from(peerUserIds.entries()).find(([, uid]) => uid === p.user_id)?.[0];
                  const state  = peerId ? peerStates.get(peerId) : undefined;
                  const isLocalUser = currentUser?.id === p.user_id;
                  return (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-1.5"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[8px] font-black"
                        style={{ background: `linear-gradient(135deg, ${CRIM}, ${GOLD})`, color: '#fff' }}>
                        {p.user_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate font-black" style={{ ...T, fontSize: 9 }}>
                          {p.user_name}{isLocalUser ? ' (you)' : ''}
                        </p>
                        <p className="truncate font-black uppercase" style={{ ...T, fontSize: 7, color: ROLE_COLOR[p.role] || '#555' }}>
                          {p.role}
                        </p>
                      </div>
                      {state && <QualityIcon state={state} size={10} />}
                      {isHost && !isLocalUser && (
                        <button onClick={() => handleKick(p)}
                          className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(239,68,68,0.15)', border: 'none', cursor: 'pointer' }}
                          title="Remove">
                          <UserX className="w-3 h-3 text-red-400" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-3 px-4 py-2.5 shrink-0"
        style={{ background: 'rgba(0,0,0,0.35)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Mic */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={toggleAudio}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: audioEnabled ? 'rgba(109,191,126,0.1)' : 'rgba(239,68,68,0.15)', border: `1px solid ${audioEnabled ? '#6DBF7E44' : '#ef444444'}`, cursor: 'pointer' }}>
          {audioEnabled ? <Mic className="w-4 h-4 text-[#6DBF7E]" /> : <MicOff className="w-4 h-4 text-red-400" />}
        </motion.button>

        {/* Cam */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={toggleVideo}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: videoEnabled ? `${GOLD}18` : 'rgba(239,68,68,0.15)', border: `1px solid ${videoEnabled ? `${GOLD}44` : '#ef444444'}`, cursor: 'pointer' }}>
          {videoEnabled ? <Video className="w-4 h-4" style={{ color: GOLD }} /> : <VideoOff className="w-4 h-4 text-red-400" />}
        </motion.button>

        {isHost && (
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-black uppercase"
            style={{ ...T, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, color: GOLD, cursor: 'pointer' }}>
            <Link className="w-3 h-3" /> Invite
          </button>
        )}

        {/* Leave */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleLeave}
          className="px-4 py-2 rounded-full flex items-center gap-1.5 text-xs font-black uppercase"
          style={{ ...T, background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.4)', color: '#C0392B', cursor: 'pointer' }}>
          Leave
        </motion.button>
      </div>

      {/* Media error */}
      {mediaError && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: 'rgba(239,68,68,0.95)', color: '#fff', ...T, fontWeight: 900, backdropFilter: 'blur(4px)' }}>
          {mediaError}
        </div>
      )}

      {/* Invite modal */}
      <AnimatePresence>
        {showInvite && <InviteModal roomId={roomId} onClose={() => setShowInvite(false)} />}
      </AnimatePresence>
    </div>
  );
}
