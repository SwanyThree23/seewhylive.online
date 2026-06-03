import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Mic, MicOff, Maximize2, MoreHorizontal, UserPlus, Pin, UserX, LayoutGrid, MonitorPlay } from 'lucide-react';

const COLORS = ['#8B6F47', '#6B7C4A', '#CC7755', '#4A6B7C', '#7C4A6B', '#6B4A4A'];
const OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const SLOT_OPTIONS = [4, 6, 9, 12, 16, 20];

function getColor(name) {
  return COLORS[(name ? name.charCodeAt(0) : 0) % COLORS.length];
}

function useAudioLevel(stream) {
  const [data, setData] = useState({ isSpeaking: false, level: 0 });
  const refs = useRef({});

  useEffect(() => {
    if (!stream || !stream.getAudioTracks().length) {
      setData({ isSpeaking: false, level: 0 });
      return;
    }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      refs.current = { ctx };
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / buf.length);
        setData({ isSpeaking: rms > 0.01, level: Math.min(1, rms * 8) });
        refs.current.raf = requestAnimationFrame(tick);
      };
      tick();
    } catch (_) { setData({ isSpeaking: false, level: 0 }); }
    return () => {
      if (refs.current.raf) cancelAnimationFrame(refs.current.raf);
      try { refs.current.ctx?.close(); } catch (_) {}
    };
  }, [stream]);

  return data;
}

function AudioBars({ level, color = '#D4AF37', compact = false }) {
  const heights = [0.4, 0.7, 1.0, 0.7, 0.4];
  const maxH = compact ? 6 : 10;
  return (
    <div className="flex items-end gap-px" style={{ height: maxH }}>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          animate={{ height: level > 0.05 ? `${Math.max(2, h * level * maxH)}px` : '2px' }}
          transition={{ duration: 0.08, ease: 'linear' }}
          style={{ width: compact ? 1.5 : 2, borderRadius: 1, background: color, minHeight: 2 }}
        />
      ))}
    </div>
  );
}

function PanelTile({ member, isHost, isCurrentUser, hostId, onSpotlight, canManage, stream, isLocal, raisedHands, onMute, onRemove, onPin, isPinned }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isSpeaking, level } = useAudioLevel(isLocal ? stream : null);
  const speaking = isLocal ? isSpeaking : (member.is_audio_enabled !== false);
  const effectiveLevel = isLocal ? level : (speaking ? 0.5 : 0);
  const color = getColor(member.user_name);
  const isHostMember = member.user_id === hostId;
  const videoRef = useRef(null);
  const isRaised = raisedHands && member.user_id && raisedHands.has(member.user_id);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  const borderColor = speaking
    ? 'rgba(212,175,55,0.85)'
    : isPinned
    ? 'rgba(0,245,255,0.6)'
    : isCurrentUser
    ? 'rgba(212,175,55,0.4)'
    : 'rgba(255,255,255,0.12)';

  const connDotColor = stream?.active ? '#00FF88' : member ? '#FFD700' : 'rgba(255,255,255,0.2)';

  const roleBadge = member.role === 'host'
    ? { label: 'HOST', color: '#D4AF37', bg: 'rgba(212,175,55,0.25)' }
    : member.role === 'cohost'
    ? { label: 'CO-HOST', color: 'rgba(192,192,192,1)', bg: 'rgba(192,192,192,0.18)' }
    : null;

  const menuActions = [
    { action: 'spotlight', icon: Maximize2, label: 'Spotlight', color: '#fff' },
    { action: 'pin', icon: Pin, label: isPinned ? 'Unpin' : 'Pin', color: isPinned ? '#00F5FF' : '#fff' },
    { action: 'mute', icon: MicOff, label: 'Mute', color: '#fff' },
    { action: 'remove', icon: UserX, label: 'Remove', color: '#f87171' },
  ];

  const handleMenuAction = (action) => {
    setMenuOpen(false);
    if (action === 'spotlight') onSpotlight(member.user_id);
    else if (action === 'pin') onPin?.(member);
    else if (action === 'mute') onMute?.(member);
    else if (action === 'remove') onRemove?.(member);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: speaking
          ? ['0 0 0 2px rgba(212,175,55,0.85)', '0 0 0 8px rgba(212,175,55,0.1)']
          : isPinned
          ? '0 0 0 2px rgba(0,245,255,0.5)'
          : '0 0 0 0px transparent',
      }}
      transition={speaking ? { boxShadow: { duration: 0.9, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' } } : {}}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative group aspect-square cursor-pointer select-none"
      onClick={() => !menuOpen && onSpotlight(member.user_id)}
      title={member.user_name}
    >
      {/* Outer OCT border layer */}
      <div
        className="absolute inset-0"
        style={{ clipPath: OCT, background: borderColor, transition: 'background 0.3s', filter: speaking ? 'blur(0.5px)' : 'none' }}
      />

      {/* Inner OCT content */}
      <div className="absolute inset-[2px] overflow-hidden" style={{ clipPath: OCT, background: 'linear-gradient(135deg, #1A0F0A, #0d0618)' }}>
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className={'absolute inset-0 w-full h-full object-cover' + (isLocal ? ' scale-x-[-1]' : '')}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${color}60`, background: color + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>
              {member.user_name?.charAt(0).toUpperCase() || '?'}
            </div>
          </div>
        )}

        {/* Live audio level bars — centered above name bar */}
        {speaking && (
          <div className="absolute bottom-5 left-0 right-0 flex justify-center pointer-events-none">
            <AudioBars level={effectiveLevel} compact />
          </div>
        )}

        {/* Name gradient bar */}
        <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92), transparent)' }}>
          <div className="flex items-center gap-0.5">
            {isHostMember && <Crown className="w-2 h-2 shrink-0" style={{ color: '#d4af37' }} />}
            <span className="text-[11px] text-white font-semibold truncate flex-1">{member.user_name}</span>
            {roleBadge && (
              <span className="text-[6px] px-0.5 rounded font-bold shrink-0" style={{ background: roleBadge.bg, color: roleBadge.color }}>
                {roleBadge.label}
              </span>
            )}
            {speaking
              ? <Mic className="w-2 h-2 text-green-400 shrink-0" />
              : <MicOff className="w-2 h-2 shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} />}
          </div>
        </div>

        {/* "You" badge */}
        {isCurrentUser && (
          <div className="absolute top-1 left-1">
            <span className="text-[7px] px-1 py-0.5 rounded font-bold" style={{ background: 'rgba(212,175,55,0.3)', color: '#d4af37' }}>You</span>
          </div>
        )}

        {/* Pin indicator */}
        {isPinned && !isCurrentUser && (
          <div className="absolute top-1 left-1 z-10">
            <Pin className="w-2 h-2" style={{ color: '#00F5FF' }} />
          </div>
        )}

        {/* Raised hand — bouncing */}
        {isRaised && (
          <motion.div
            className="absolute top-1 right-1 z-10 text-[12px] leading-none"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.55, repeat: Infinity, ease: 'easeInOut' }}
          >
            ✋
          </motion.div>
        )}

        {/* Connection quality dot */}
        <div className="absolute bottom-1 right-1 z-10" style={{ width: 5, height: 5, borderRadius: '50%', background: connDotColor, boxShadow: stream?.active ? '0 0 4px rgba(0,255,136,0.5)' : 'none' }} />

        {/* Hover action buttons — stopPropagation so they don't trigger spotlight click */}
        <div
          className="absolute opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5"
          style={{ top: isRaised ? 16 : 4, right: 4 }}
          onClick={e => e.stopPropagation()}
        >
          {canManage && member.user_id !== hostId && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="w-4 h-4 rounded flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <MoreHorizontal className="w-2 h-2 text-white" />
              </button>

              {menuOpen && (
                <div
                  style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, background: '#110818', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, minWidth: 110, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.7)' }}
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  {menuActions.map(item => (
                    <button
                      key={item.action}
                      onClick={() => handleMenuAction(item.action)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'transparent', border: 'none', color: item.color, fontSize: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <item.icon className="w-3 h-3 shrink-0" /> {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SpotlitView({ member, hostId, stream, isLocal, onUnpin, speakerLevel = 0 }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="flex-1 rounded-xl overflow-hidden relative" style={{ border: `2px solid ${speakerLevel > 0.1 ? 'rgba(212,175,55,0.7)' : 'rgba(212,175,55,0.3)'}`, background: '#0d0618', transition: 'border-color 0.3s' }}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={'w-full h-full object-cover' + (isLocal ? ' scale-x-[-1]' : '')}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: getColor(member.user_name) + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 24, border: `1px solid ${getColor(member.user_name)}60` }}>
            {member.user_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{member.user_name}</span>
            {member.user_id === hostId && <Crown className="w-4 h-4" style={{ color: '#d4af37' }} />}
          </div>
          {speakerLevel > 0.05 && (
            <div className="mt-1">
              <AudioBars level={speakerLevel} />
            </div>
          )}
        </div>
      )}

      {/* Name + speaking overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
        <div className="flex items-center gap-2">
          {member.user_id === hostId && <Crown className="w-3 h-3" style={{ color: '#d4af37' }} />}
          <span className="text-sm font-bold text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{member.user_name}</span>
          {speakerLevel > 0.05 && (
            <div className="ml-1">
              <AudioBars level={speakerLevel} compact />
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onUnpin}
        className="absolute top-2 right-2 text-[11px] px-2 py-1 rounded transition-all"
        style={{ background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
      >
        ✕ Unpin
      </button>
    </div>
  );
}

function EmptyTile({ onClick, canInvite }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.2, 0.35, 0.2] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      onClick={canInvite ? onClick : undefined}
      className="aspect-square flex items-center justify-center"
      style={{ cursor: canInvite ? 'pointer' : 'default' }}
    >
      <div style={{ clipPath: OCT, width: '100%', paddingTop: '100%', position: 'relative' }}>
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ clipPath: OCT, border: '1px dashed rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.02)' }}
        >
          {canInvite && <UserPlus className="w-3 h-3" style={{ color: 'rgba(212,175,55,0.4)' }} />}
        </div>
      </div>
    </motion.div>
  );
}

function CompactTile({ member, hostId, stream, isLocal, isSpeaking }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);
  const isHostMember = member.user_id === hostId;
  const color = getColor(member.user_name);

  return (
    <div className="flex flex-col items-center shrink-0 gap-0.5">
      <motion.div
        className="relative"
        style={{ width: 48, height: 48, borderRadius: 2 }}
        animate={{
          boxShadow: isSpeaking
            ? ['0 0 0 2px rgba(212,175,55,0.85)', '0 0 0 5px rgba(212,175,55,0.1)']
            : isHostMember
            ? '0 0 0 2px rgba(212,175,55,0.45)'
            : '0 0 0 0px transparent',
        }}
        transition={isSpeaking ? { boxShadow: { duration: 0.9, repeat: Infinity, repeatType: 'reverse' } } : {}}
      >
        <div className="absolute inset-0" style={{ clipPath: OCT, background: isHostMember ? 'rgba(212,175,55,0.55)' : 'rgba(255,255,255,0.14)' }} />
        <div className="absolute inset-[2px] overflow-hidden" style={{ clipPath: OCT, background: color + '30' }}>
          {stream ? (
            <video ref={videoRef} autoPlay playsInline muted={isLocal}
              className={'w-full h-full object-cover' + (isLocal ? ' scale-x-[-1]' : '')} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
              {member.user_name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          {isHostMember && (
            <div className="absolute top-0 right-0">
              <Crown style={{ width: 8, height: 8, color: '#d4af37' }} />
            </div>
          )}
        </div>
      </motion.div>
      <span className="text-white/60 truncate max-w-[48px]" style={{ fontSize: 7 }}>{member.user_name}</span>
    </div>
  );
}

function ScreenShareTile({ screenStream }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && screenStream) videoRef.current.srcObject = screenStream;
  }, [screenStream]);

  return (
    <div className="relative w-full shrink-0" style={{ aspectRatio: '16/9', background: '#000', border: '1px solid rgba(212,175,55,0.25)' }}>
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
      <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded font-bold"
        style={{ background: 'rgba(212,175,55,0.18)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
        📺 Screen Share
      </div>
    </div>
  );
}

function resolveStream(member, currentUser, localStream, remoteStreams, peerUserIds) {
  const isMe = currentUser && member.user_id === currentUser.id;
  if (isMe) return { stream: localStream || null, isLocal: true };
  const peerId = Array.from((peerUserIds || new Map()).entries()).find(([, uid]) => uid === member.user_id)?.[0];
  return { stream: peerId ? remoteStreams?.get(peerId) || null : null, isLocal: false };
}

export default function PanelGrid({
  members = [],
  currentUser,
  hostId,
  maxSlots = 20,
  onInvite,
  isHost,
  remoteStreams,
  peerUserIds,
  localStream,
  compact,
  screenStream,
  raisedHands,
  onMuteMember,
  onRemoveMember,
  onPinMember,
  pinnedMemberId,
}) {
  const [spotlitId, setSpotlitId] = useState(null);
  const [slots, setSlots] = useState(maxSlots);
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' | 'stage'

  const spotlit = spotlitId ? members.find(m => m.user_id === spotlitId) : null;
  const rest = spotlit ? members.filter(m => m.user_id !== spotlitId) : members;
  const emptyCount = Math.max(0, Math.min(slots - members.length, 4));
  const gridCols = slots <= 4 ? 'grid-cols-2' : slots <= 9 ? 'grid-cols-3' : slots <= 16 ? 'grid-cols-4' : 'grid-cols-5';

  // Stage mode: auto-spotlight host or first member if no manual spotlight set
  const effectiveSpotlitId = layoutMode === 'stage'
    ? (spotlitId || (members.find(m => m.user_id === hostId)?.user_id) || members[0]?.user_id)
    : spotlitId;
  const effectiveSpotlit = effectiveSpotlitId ? members.find(m => m.user_id === effectiveSpotlitId) : null;
  const effectiveRest = effectiveSpotlit ? members.filter(m => m.user_id !== effectiveSpotlitId) : members;

  const handleSpotlight = (userId) => {
    if (layoutMode === 'stage') {
      setSpotlitId(prev => prev === userId ? null : userId);
    } else {
      setSpotlitId(prev => prev === userId ? null : userId);
    }
  };

  if (compact) {
    return (
      <div className="flex overflow-x-auto gap-2 px-2 py-1" style={{ background: '#0d0618' }}>
        {members.slice(0, 20).map(m => {
          const { stream, isLocal } = resolveStream(m, currentUser, localStream, remoteStreams, peerUserIds);
          return (
            <CompactTile key={m.id || m.user_id} member={m} hostId={hostId} stream={stream} isLocal={isLocal} isSpeaking={m.is_audio_enabled !== false} />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0618' }}>
      {/* Header bar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 11, background: 'rgba(212,175,55,0.13)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 99, padding: '2px 7px', fontFamily: 'Barlow Condensed, sans-serif' }}>
          {members.length}/{maxSlots}
        </span>

        {/* Layout mode toggle */}
        <div className="flex gap-0.5">
          {[
            { mode: 'grid', icon: LayoutGrid, title: 'Grid' },
            { mode: 'stage', icon: MonitorPlay, title: 'Stage' },
          ].map(({ mode, icon: Icon, title }) => (
            <button
              key={mode}
              onClick={() => setLayoutMode(mode)}
              title={title}
              className="w-5 h-5 rounded flex items-center justify-center transition-all"
              style={layoutMode === mode
                ? { background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)', color: '#d4af37' }
                : { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
            >
              <Icon className="w-2.5 h-2.5" />
            </button>
          ))}
        </div>

        {/* Slot size buttons */}
        <div className="flex gap-0.5 ml-auto">
          {SLOT_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setSlots(n)}
              className="text-[11px] w-5 h-5 rounded border transition-all"
              style={slots === n
                ? { borderColor: '#d4af37', color: '#d4af37', background: 'rgba(212,175,55,0.1)' }
                : { borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' }}
            >
              {n}
            </button>
          ))}
        </div>

        {isHost && (
          <button
            onClick={onInvite}
            className="flex items-center gap-1 text-[11px] px-1.5 py-1 rounded transition-all"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}
          >
            <UserPlus className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {screenStream && <ScreenShareTile screenStream={screenStream} />}

      {/* Stage layout: large spotlit + filmstrip row */}
      {(layoutMode === 'stage' || effectiveSpotlit) ? (
        <div className="flex-1 flex flex-col gap-2 p-2 overflow-hidden">
          {effectiveSpotlit && (() => {
            const { stream, isLocal } = resolveStream(effectiveSpotlit, currentUser, localStream, remoteStreams, peerUserIds);
            return (
              <SpotlitView
                member={effectiveSpotlit}
                hostId={hostId}
                stream={stream}
                isLocal={isLocal}
                speakerLevel={isLocal ? 0.5 : (effectiveSpotlit.is_audio_enabled !== false ? 0.4 : 0)}
                onUnpin={() => setSpotlitId(null)}
              />
            );
          })()}

          {/* Filmstrip row */}
          <div className="flex gap-1.5 shrink-0 overflow-x-auto" style={{ height: 64 }}>
            {effectiveRest.slice(0, slots).map(m => {
              const { stream, isLocal } = resolveStream(m, currentUser, localStream, remoteStreams, peerUserIds);
              return (
                <div key={m.id || m.user_id} className="w-14 shrink-0 h-full">
                  <PanelTile
                    member={m} isHost={isHost} hostId={hostId}
                    isCurrentUser={!!(currentUser && m.user_id === currentUser.id)}
                    onSpotlight={handleSpotlight} canManage={isHost}
                    stream={stream} isLocal={isLocal}
                    raisedHands={raisedHands}
                    onMute={onMuteMember} onRemove={onRemoveMember} onPin={onPinMember}
                    isPinned={pinnedMemberId === m.user_id}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Grid layout */
        <div className={'flex-1 p-2 grid ' + gridCols + ' gap-2 content-start overflow-auto'}>
          <AnimatePresence>
            {members.slice(0, slots).map(m => {
              const { stream, isLocal } = resolveStream(m, currentUser, localStream, remoteStreams, peerUserIds);
              return (
                <PanelTile
                  key={m.id || m.user_id}
                  member={m} isHost={isHost} hostId={hostId}
                  isCurrentUser={!!(currentUser && m.user_id === currentUser.id)}
                  onSpotlight={handleSpotlight} canManage={isHost}
                  stream={stream} isLocal={isLocal}
                  raisedHands={raisedHands}
                  onMute={onMuteMember} onRemove={onRemoveMember} onPin={onPinMember}
                  isPinned={pinnedMemberId === m.user_id}
                />
              );
            })}
            {Array.from({ length: emptyCount }).map((_, i) => (
              <EmptyTile key={'empty-' + i} onClick={onInvite} canInvite={!!isHost} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
