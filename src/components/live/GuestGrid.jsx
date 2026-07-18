import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Maximize2, Minimize2, Crown, Link, Radio } from 'lucide-react';
import GuestDestinationsPanel from './GuestDestinationsPanel';
import GuestStreamingPermissions from './GuestStreamingPermissions';
import SpeakingIndicator from './SpeakingIndicator';

const OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const ROLE_GLOW = {
  host:     '#D4AF37',
  'co-host':'#D4AF37',
  speaker:  '#6DBF7E',
  guest:    '#D4854A',
  viewer:   'rgba(255,255,255,0.2)',
};

const LAYOUTS = [1, 2, 4, 6, 9, 12, 16, 20];

function getGridClass(slots) {
  if (slots <= 1) return 'grid-cols-1';
  if (slots <= 2) return 'grid-cols-2';
  if (slots <= 4) return 'grid-cols-2 sm:grid-cols-4';
  if (slots <= 6) return 'grid-cols-3';
  if (slots <= 9) return 'grid-cols-3';
  if (slots <= 12) return 'grid-cols-4';
  return 'grid-cols-5';
}

export default React.memo(function GuestGrid({ participants = [], isHost, onInvite, hostId, maxGuests = 20, speakingIds = {} }) {
  const [layoutSlots, setLayoutSlots] = useState(4);
  const [spotlightId, setSpotlightId] = useState(null);
  const [audioStates, setAudioStates] = useState({});
  const [showDestsFor, setShowDestsFor] = useState(null);

  const speakers = participants
    .filter(p => ['host', 'co-host', 'speaker', 'guest'].includes(p.role))
    .slice(0, maxGuests);

  const empty = Math.max(0, layoutSlots - speakers.length);

  const handleSpotlight = (id) => setSpotlightId(prev => prev === id ? null : id);

  const spotlightGuest = spotlightId ? speakers.find(s => s.id === spotlightId) : null;

  return (
    <div className="h-full bg-[rgba(13,6,24,0.7)] rounded-xl border border-[rgba(212,175,55,0.15)] flex flex-col overflow-hidden">
      {/* Per-guest destinations panel (host only) */}
      {isHost && showDestsFor && (
        <div className="shrink-0 px-2 pt-2">
          <GuestDestinationsPanel participantUserId={showDestsFor} guestName={participants.find(p => p.user_id === showDestsFor)?.user_name || 'Guest'} />
        </div>
      )}
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 shrink-0">
        <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(128,0,32,0.6)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)' }}>
          {speakers.length}/{maxGuests} on stage
        </span>
        <div className="flex gap-1 ml-auto">
          {LAYOUTS.map(l => (
            <button
              key={l.value}
              onClick={() => setLayoutSlots(l.value)}
              className={`text-[10px] w-6 h-5 rounded border transition-all ${
                layoutSlots === l.value
                  ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10'
                  : 'border-white/10 text-white/40 hover:border-white/20'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spotlight layout */}
      {spotlightGuest ? (
        <div className="flex-1 flex flex-col gap-2 p-2 overflow-hidden">
          <GuestTile
            participant={spotlightGuest}
            isSpotlight
            isHost={spotlightGuest.user_id === hostId}
            isHostUser={isHost}
            onSpotlight={handleSpotlight}
            externalSpeaking={speakingIds[spotlightGuest.id] ?? speakingIds[spotlightGuest.user_id]}
          />
          <div className="flex gap-2 h-20 shrink-0 overflow-x-auto">
            {speakers.filter(s => s.id !== spotlightId).map(p => (
              <div key={p.id} className="w-28 shrink-0 h-full">
                <GuestTile participant={p} compact isHost={p.user_id === hostId} isHostUser={isHost} onSpotlight={handleSpotlight} externalSpeaking={speakingIds[p.id] ?? speakingIds[p.user_id]} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`flex-1 p-2 grid ${getGridClass(speakers.length, layoutSlots)} gap-2 content-start overflow-auto`}>
          <AnimatePresence>
            {speakers.map(p => (
              <GuestTile key={p.id} participant={p} isHost={p.user_id === hostId} isHostUser={isHost} onSpotlight={handleSpotlight} externalSpeaking={speakingIds[p.id] ?? speakingIds[p.user_id]} />
            ))}
            {Array.from({ length: Math.min(empty, 4) }).map((_, i) => (
              <EmptySlot key={`empty-${i}`} onInvite={onInvite} isHost={isHost} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

function GuestTile({ participant, isSpotlight, compact, isHost: isHostUser, onSpotlight, isHostUser: hostCtrl, externalSpeaking }) {
  const [simSpeaking, setSimSpeaking] = useState(false);

  // Use real speaking data when available; fall back to simulation
  const hasRealData = externalSpeaking !== undefined && externalSpeaking !== null;
  const speaking = hasRealData ? externalSpeaking : simSpeaking;

  // Real Web Audio API VAD on the participant's remote (or local) stream
  useEffect(() => {
    if (compact || hasRealData) return;
    const interval = setInterval(() => setSimSpeaking(Math.random() > 0.6), 800);
    return () => clearInterval(interval);
  }, [compact, hasRealData]);

  // Attach stream to video element whenever it changes
  useEffect(() => {
    if (!videoRef.current) return;
    const s = participant?.remoteStream ?? null;
    if (videoRef.current.srcObject !== s) {
      videoRef.current.srcObject = s;
      if (s) videoRef.current.play?.().catch(() => {});
    }
  }, [participant?.remoteStream]);

  const px = isSpotlight ? 180 : compact ? 60 : 110;
  // Show video if stream exists and has active video tracks; honour explicit is_video_enabled=false
  const stream = participant?.remoteStream;
  const hasVideo = !!stream && participant?.is_video_enabled !== false &&
    (stream.getVideoTracks?.()?.some(t => t.enabled && t.readyState !== 'ended') ?? true);
  const isLocal = !!participant?.isLocal;

  return (
    <SpeakingIndicator isSpeaking={speaking && !compact} isHost={isHostUser}>
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative group flex flex-col items-center gap-1"
    >
      {/* Speaking pulse ring */}
      {speaking && !compact && (
        <div className="absolute animate-ping rounded-full"
          style={{ clipPath: OCT, width: px + 12, height: px + 12, background: `${glow}18`, top: -6, left: -6, zIndex: 0 }} />
      )}

      {/* Octagonal cell */}
      <div
        className={`w-full h-full rounded-lg border-2 overflow-hidden bg-gradient-to-br from-[#1a0a20] to-[#0d0618] flex flex-col relative transition-all duration-200 ${
          speaking && !compact
            ? 'border-[#4A8A7A] shadow-[0_0_16px_rgba(74,138,122,0.4)]'
            : 'border-white/10 group-hover:border-[#d4af37]/40'
        }`}
      >
        {/* Center avatar */}
        <div className="flex-1 flex items-center justify-center">
          <div style={{ width: isSpotlight ? 96 : compact ? 40 : 56, height: isSpotlight ? 96 : compact ? 40 : 56, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(to bottom right, #800020, #d4af37)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isSpotlight ? 32 : compact ? 14 : 20, fontWeight: 700, color: '#fff' }}>
            {participant.user_name?.charAt(0)?.toUpperCase()}
          </div>
          {speaking && !compact && (
            <div className="absolute flex items-end gap-0.5 bottom-10 left-1/2 -translate-x-1/2">
              {[3, 5, 4, 6, 3].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [h, h * 1.8, h] }}
                  transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.05 }}
                  className="w-0.5 rounded-full bg-[#4A8A7A]"
                  style={{ height: h }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              {isHostUser && <Crown className="w-3 h-3 text-[#d4af37] shrink-0" />}
              <p className={`text-white font-semibold truncate ${compact ? 'text-[11px]' : 'text-xs'}`}>
                {participant.user_name}
              </p>
            </div>
            {!compact && (
              <div className="flex items-center gap-1 shrink-0">
                {participant.is_audio_enabled !== false
                  ? <Mic className="w-2.5 h-2.5 text-[#6DBF7E]" />
                  : <MicOff className="w-2.5 h-2.5 text-[#C0392B]" />}
                {Array.from({ length: connDots }).map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-[#6DBF7E]" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hover controls */}
        {!compact && (
          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={() => onSpotlight?.(participant.id)}
              className="w-6 h-6 rounded bg-black/60 hover:bg-[#d4af37]/20 flex items-center justify-center"
            >
              {isSpotlight ? <Minimize2 className="w-3 h-3 text-white" /> : <Maximize2 className="w-3 h-3 text-white" />}
            </button>
            {hostCtrl && (
              <GuestStreamingPermissions
                participant={participant}
                isHost={hostCtrl}
                onPermissionChange={() => {}}
              />
            )}
          </div>
        )}

        {/* Live badge */}
        {participant?.is_streaming && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-1.5 py-px rounded-full"
            style={{ background: '#C0392B', border: '1px solid rgba(212,175,55,0.5)' }}>
            <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
            <span className="text-[7px] font-black text-white uppercase" style={T}>Live</span>
          </div>
        )}

        {/* Muted indicator */}
        {participant?.is_audio_enabled === false && !compact && (
          <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(200,50,50,0.85)' }}>
            <MicOff className="w-2.5 h-2.5 text-white" />
          </div>
        )}

        {/* Spotlight toggle */}
        {!compact && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={e => { e.stopPropagation(); onSpotlight?.(participant.id); }}
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer' }}>
              {isSpotlight ? <Minimize2 className="w-3 h-3 text-white" /> : <Maximize2 className="w-3 h-3 text-white" />}
            </button>
          </div>
        )}
      </div>

      {/* Name + role + controls */}
      {!compact && (
        <div className="flex flex-col items-center gap-0.5" style={{ maxWidth: px + 8 }}>
          <div className="flex items-center gap-1">
            {isHostBadge && <Crown className="w-2.5 h-2.5" style={{ color: GOLD }} />}
            <p className="text-white font-black truncate"
              style={{ ...T, fontSize: 9, maxWidth: px, textShadow: `0 0 6px ${glow}` }}>
              {participant?.user_name}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-1 py-px rounded text-[7px] font-black uppercase"
              style={{ background: `${glow}22`, color: glow, border: `1px solid ${glow}44`, ...T }}>
              {participant?.role}
            </span>
            {participant?.is_audio_enabled !== false
              ? <Mic className="w-2 h-2 text-[#6DBF7E]" />
              : <MicOff className="w-2 h-2 text-red-400" />}
            {participant?.is_video_enabled
              ? <Video className="w-2 h-2" style={{ color: GOLD }} />
              : <VideoOff className="w-2 h-2 text-red-400" />}
          </div>
          {/* Host controls */}
          {isHostUser && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
              <GuestStreamingPermissions
                participant={participant}
                isHost={isHostUser}
                onPermissionChange={() => {}}
              />
            </div>
          )}
        </div>
      )}
    </motion.div>
    </SpeakingIndicator>
  );
}

function EmptySlot({ onInvite, isHost }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 0.4 }}
      className="flex flex-col items-center gap-1 cursor-pointer group"
      onClick={onInvite}
    >
      <div style={{
        clipPath: OCT, width: 80, height: 80,
        background: 'rgba(255,255,255,0.02)',
        border: '2px dashed rgba(212,175,55,0.15)',
      }}
        className="flex items-center justify-center group-hover:border-[#d4af37]/40 transition-all">
        {isHost && (
          <Link className="w-4 h-4" style={{ color: 'rgba(212,175,55,0.3)' }} />
        )}
      </div>
      {isHost && (
        <p className="text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'rgba(212,175,55,0.5)', ...T }}>
          Invite
        </p>
      )}
    </motion.div>
  );
}

/* ───── main component ───── */
export default React.memo(function GuestGrid({
  participants = [],
  isHost,
  onInvite,
  hostId,
  maxGuests = 20,
  remoteStreams,    // Map<peerId, MediaStream> from useWebRTCPeers
  peerUserIds,     // Map<peerId, userId> from useWebRTCPeers
  localStream,     // MediaStream from useLocalMedia (for current user's tile)
  currentUserId,   // current user's id, to identify which tile gets localStream
}) {
  const [layoutSlots, setLayoutSlots] = useState(4);
  const [spotlightId, setSpotlightId] = useState(null);
  const [showDestsFor, setShowDestsFor] = useState(null);

  const speakers = participants
    .filter(p => ['host', 'co-host', 'speaker', 'guest'].includes(p.role))
    .slice(0, maxGuests)
    .map(p => {
      const isLocalUser = currentUserId && p.user_id === currentUserId;
      if (isLocalUser && localStream) {
        return { ...p, remoteStream: localStream, isLocal: true };
      }
      const peerId = peerUserIds
        ? Array.from(peerUserIds.entries()).find(([, uid]) => uid === p.user_id)?.[0]
        : undefined;
      const stream = peerId && remoteStreams ? remoteStreams.get(peerId) : undefined;
      return { ...p, remoteStream: stream };
    });

  const viewers = participants.filter(p => p.role === 'viewer');
  const empty = Math.max(0, layoutSlots - speakers.length);
  const spotlightGuest = spotlightId ? speakers.find(s => s.id === spotlightId) : null;

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden"
      style={{ background: 'rgba(8,11,24,0.7)', border: '1px solid rgba(212,175,55,0.12)' }}>

      {/* Per-guest destinations panel */}
      {isHost && showDestsFor && (
        <div className="shrink-0 px-2 pt-2">
          <GuestDestinationsPanel
            participantUserId={showDestsFor}
            guestName={participants.find(p => p.user_id === showDestsFor)?.user_name || 'Guest'} />
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 shrink-0"
        style={{ background: 'rgba(8,11,24,0.9)' }}>
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1"
          style={{ ...T, background: 'rgba(128,0,32,0.6)', color: GOLD, border: '1px solid rgba(212,175,55,0.3)' }}>
          <Radio className="w-2.5 h-2.5" />
          {speakers.length}/{maxGuests} on stage
        </span>
        {viewers.length > 0 && (
          <span className="text-[10px]" style={{ ...T, color: 'rgba(255,255,255,0.35)' }}>
            · {viewers.length} viewing
          </span>
        )}
        <div className="flex gap-1 ml-auto">
          {LAYOUTS.map(n => (
            <button key={n} onClick={() => setLayoutSlots(n)}
              className="text-[9px] w-5 h-5 rounded border transition-all flex items-center justify-center"
              style={{
                border: `1px solid ${layoutSlots === n ? GOLD : 'rgba(255,255,255,0.1)'}`,
                color: layoutSlots === n ? GOLD : 'rgba(255,255,255,0.35)',
                background: layoutSlots === n ? 'rgba(212,175,55,0.1)' : 'transparent',
                cursor: 'pointer',
              }}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Spotlight layout */}
      {spotlightGuest ? (
        <div className="flex-1 flex flex-col gap-3 p-3 overflow-hidden">
          <div className="flex justify-center">
            <GuestTile
              participant={spotlightGuest}
              isSpotlight
              isHostBadge={spotlightGuest.user_id === hostId}
              isHostUser={isHost}
              onSpotlight={() => setSpotlightId(null)}
            />
          </div>
          <div className="flex gap-3 overflow-x-auto justify-center pb-1">
            {speakers.filter(s => s.id !== spotlightId).map(p => (
              <GuestTile key={p.id} participant={p} compact
                isHostBadge={p.user_id === hostId} isHostUser={isHost}
                onSpotlight={id => setSpotlightId(id)} />
            ))}
          </div>
        </div>
      ) : (
        <div className={`flex-1 p-3 grid ${getGridClass(layoutSlots)} gap-4 content-center overflow-auto place-items-center`}>
          <AnimatePresence>
            {speakers.map(p => (
              <GuestTile key={p.id} participant={p}
                isHostBadge={p.user_id === hostId}
                isHostUser={isHost}
                onSpotlight={id => setSpotlightId(id)} />
            ))}
            {Array.from({ length: Math.min(empty, 8) }).map((_, i) => (
              <EmptySlot key={`empty-${i}`} onInvite={onInvite} isHost={isHost} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Viewers strip */}
      {viewers.length > 0 && (
        <div className="shrink-0 px-3 py-2 flex items-center gap-2 overflow-x-auto border-t"
          style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.25)' }}>
          <span className="text-[8px] font-black uppercase shrink-0" style={{ ...T, color: 'rgba(255,255,255,0.2)' }}>
            Watching
          </span>
          {viewers.slice(0, 16).map(v => (
            <div key={v.id} title={v.user_name}
              className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[7px] font-black text-white"
              style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})` }}>
              {v.user_name?.charAt(0)?.toUpperCase()}
            </div>
          ))}
          {viewers.length > 16 && (
            <span className="text-[8px] shrink-0" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
              +{viewers.length - 16}
            </span>
          )}
        </div>
      )}
    </div>
  );
});
