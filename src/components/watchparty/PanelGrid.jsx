import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Mic, MicOff, Video, VideoOff, Maximize2, MoreHorizontal, UserPlus, Pin } from 'lucide-react';
import PanelMusicPlayer from '../live/PanelMusicPlayer';

var COLORS = ['#8B6F47', '#6B7C4A', '#CC7755', '#4A6B7C', '#7C4A6B', '#6B4A4A'];
var OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

function getColor(name) {
  var idx = (name ? name.charCodeAt(0) : 0) % COLORS.length;
  return COLORS[idx];
}

function useAudioLevel(stream) {
  var [isSpeaking, setIsSpeaking] = useState(false);
  var ctxRef = useRef(null);
  var analyserRef = useRef(null);
  var rafRef = useRef(null);

  useEffect(() => {
    if (!stream) { setIsSpeaking(false); return; }
    var audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) { setIsSpeaking(false); return; }

    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      var analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      var source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      var data = new Uint8Array(analyser.frequencyBinCount);

      var check = function() {
        analyser.getByteTimeDomainData(data);
        var sum = 0;
        for (var i = 0; i < data.length; i++) {
          var v = (data[i] - 128) / 128;
          sum += v * v;
        }
        var rms = Math.sqrt(sum / data.length);
        setIsSpeaking(rms > 0.01);
        rafRef.current = requestAnimationFrame(check);
      };
      check();
    } catch (e) {
      setIsSpeaking(false);
    }

    return function() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (ctxRef.current) { try { ctxRef.current.close(); } catch (e) {} }
    };
  }, [stream]);

  return isSpeaking;
}

function PanelTile({ member, isHost, isCurrentUser, hostId, onSpotlight, canManage, stream, isLocal, raisedHands }) {
  var [menuOpen, setMenuOpen] = useState(false);
  var audioSpeaking = useAudioLevel(stream);
  var speaking = stream ? audioSpeaking : (member.is_audio_enabled !== false);
  var color = getColor(member.user_name);
  var isHostMember = member.user_id === hostId;
  var videoRef = useRef(null);
  var isRaised = raisedHands && member.user_id && raisedHands.has(member.user_id);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  var borderColor = speaking
    ? 'rgba(212,175,55,0.7)'
    : isCurrentUser
    ? 'rgba(212,175,55,0.35)'
    : 'rgba(255,255,255,0.12)';

  var connDotColor = stream && stream.active ? '#6DBF7E' : member ? '#FFD700' : 'rgba(255,255,255,0.25)';

  var roleBadge = null;
  if (member.role === 'host') {
    roleBadge = { label: 'HOST', color: '#D4AF37', bg: 'rgba(212,175,55,0.25)' };
  } else if (member.role === 'cohost') {
    roleBadge = { label: 'CO-HOST', color: 'rgba(192,192,192,1)', bg: 'rgba(192,192,192,0.18)' };
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: speaking
          ? ['0 0 0 2px rgba(212,175,55,0.8)', '0 0 0 6px rgba(212,175,55,0.15)']
          : '0 0 0 0px rgba(212,175,55,0)',
      }}
      transition={speaking ? { boxShadow: { duration: 1, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' } } : {}}
      exit={{ opacity: 0, scale: 0.85 }}
      className="relative group aspect-square"
    >
      <div
        className="absolute inset-0"
        style={{
          clipPath: OCT,
          background: borderColor,
          filter: speaking ? 'blur(1px)' : 'none',
          transition: 'background 0.3s',
        }}
      />

      <div
        className="absolute inset-[2px] overflow-hidden"
        style={{
          clipPath: OCT,
          background: 'linear-gradient(135deg, #1A0F0A, #0d0618)',
        }}
      >
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
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${color}60`, background: color + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
              {member.user_name ? member.user_name.charAt(0).toUpperCase() : '?'}
            </div>
            {speaking && (
              <div className="flex items-end gap-0.5">
                {[2, 4, 3, 5, 2].map(function(h, i) {
                  return (
                    <motion.div key={i}
                      animate={{ height: [h, h * 2, h] }}
                      transition={{ duration: 0.35, repeat: Infinity, delay: i * 0.06 }}
                      className="w-0.5 rounded-full"
                      style={{ height: h, background: '#d4af37' }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 px-1 py-0.5"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92), transparent)' }}
        >
          <div className="flex items-center gap-0.5">
            {isHostMember && <Crown className="w-2 h-2 shrink-0" style={{ color: '#d4af37' }} />}
            <span className="text-[11px] text-white font-semibold truncate flex-1">{member.user_name}</span>
            {roleBadge && (
              <span className="text-[6px] px-0.5 rounded font-bold shrink-0"
                style={{ background: roleBadge.bg, color: roleBadge.color }}>
                {roleBadge.label}
              </span>
            )}
            {speaking ? <Mic className="w-2 h-2 text-[#6DBF7E] shrink-0" /> : <MicOff className="w-2 h-2 text-white/30 shrink-0" />}
          </div>
        </div>

        {isCurrentUser && (
          <div className="absolute top-1 left-1">
            <span className="text-[7px] px-1 py-0.5 rounded font-bold" style={{ background: 'rgba(212,175,55,0.3)', color: '#d4af37' }}>You</span>
          </div>
        )}

        {isRaised && (
          <div className="absolute top-1 right-1 z-10 text-[14px] leading-none">✋</div>
        )}

        <div className="absolute bottom-1 right-1 z-10" style={{ width: 5, height: 5, borderRadius: '50%', background: connDotColor }} />

        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5" style={{ top: isRaised ? 18 : 4 }}>
          <button
            onClick={function() { onSpotlight(member.user_id); }}
            className="w-4 h-4 rounded flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Maximize2 className="w-2 h-2 text-white" />
          </button>
          {canManage && member.user_id !== hostId && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="w-4 h-4 rounded flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <MoreHorizontal className="w-2 h-2 text-white" />
              </button>
              {menuOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, background: '#1A0F0A', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, minWidth: 100, overflow: 'hidden' }}
                  onMouseLeave={() => setMenuOpen(false)}>
                  {[{ icon: Pin, label: 'Pin', color: '#fff' }, { icon: MicOff, label: 'Mute', color: '#fff' }, { label: 'Remove', color: '#C0392B' }].map(item => (
                    <button key={item.label} onClick={() => setMenuOpen(false)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'transparent', border: 'none', color: item.color, fontSize: 11, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {item.icon && <item.icon className="w-3 h-3" />} {item.label}
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

function SpotlitView({ member, hostId, stream, isLocal, onUnpin }) {
  var videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="flex-1 rounded-xl overflow-hidden relative" style={{ border: '2px solid rgba(212,175,55,0.4)', background: '#0d0618' }}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={'w-full h-full object-cover' + (isLocal ? ' scale-x-[-1]' : '')}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: getColor(member.user_name) + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 24 }}>
            {member.user_name ? member.user_name.charAt(0).toUpperCase() : '?'}
          </div>
          <span className="text-sm font-semibold text-white">{member.user_name}</span>
          {member.user_id === hostId && <Crown className="w-4 h-4" style={{ color: '#d4af37' }} />}
        </div>
      )}
      <button
        onClick={onUnpin}
        className="absolute top-2 right-2 text-[11px] px-2 py-1 rounded"
        style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        ✕ Unpin
      </button>
    </div>
  );
}

function EmptyTile({ onClick, canInvite }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 0.3 }}
      onClick={canInvite ? onClick : undefined}
      className="aspect-square flex items-center justify-center cursor-pointer hover:opacity-50 transition-opacity"
    >
      <div style={{ clipPath: OCT, width: '100%', paddingTop: '100%', position: 'relative' }}>
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            clipPath: OCT,
            border: '1px dashed rgba(212,175,55,0.15)',
            background: 'rgba(255,255,255,0.01)',
          }}
        >
          {canInvite && <UserPlus className="w-3 h-3" style={{ color: 'rgba(212,175,55,0.35)' }} />}
        </div>
      </div>
    </motion.div>
  );
}

function CompactTile({ member, hostId, stream, isLocal, isSpeaking: isSpeakingFallback }) {
  var videoRef = useRef(null);
  var audioSpeaking = useAudioLevel(stream);
  var isSpeaking = stream ? audioSpeaking : isSpeakingFallback;
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);
  var isHostMember = member.user_id === hostId;
  var color = getColor(member.user_name);

  return (
    <div className="flex flex-col items-center shrink-0 gap-0.5">
      <div
        className="relative"
        style={{
          width: 48,
          height: 48,
          boxShadow: isSpeaking ? '0 0 0 2px rgba(212,175,55,0.8)' : isHostMember ? '0 0 0 2px rgba(212,175,55,0.5)' : 'none',
          borderRadius: 2,
        }}
      >
        <div className="absolute inset-0" style={{ clipPath: OCT, background: isHostMember ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.15)' }} />
        <div className="absolute inset-[2px] overflow-hidden" style={{ clipPath: OCT, background: color + '30' }}>
          {stream ? (
            <video ref={videoRef} autoPlay playsInline muted={isLocal}
              className={'w-full h-full object-cover' + (isLocal ? ' scale-x-[-1]' : '')} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
              {member.user_name ? member.user_name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          {isHostMember && (
            <div className="absolute top-0 right-0">
              <Crown style={{ width: 8, height: 8, color: '#d4af37' }} />
            </div>
          )}
        </div>
      </div>
      <span className="text-white/70 truncate max-w-[48px]" style={{ fontSize: 7 }}>{member.user_name}</span>
    </div>
  );
}

function ScreenShareTile({ screenStream }) {
  var videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && screenStream) videoRef.current.srcObject = screenStream;
  }, [screenStream]);

  return (
    <div className="relative w-full shrink-0" style={{ aspectRatio: '16/9', background: '#000', border: '1px solid rgba(212,175,55,0.3)' }}>
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
      <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded font-bold"
        style={{ background: 'rgba(212,175,55,0.2)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)' }}>
        📺 Screen Share
      </div>
    </div>
  );
}

function resolveStream(member, currentUser, localStream, remoteStreams, peerUserIds) {
  var isMe = currentUser && member.user_id === currentUser.id;
  if (isMe) return { stream: localStream || null, isLocal: true };
  var peerId = Array.from((peerUserIds || new Map()).entries()).find(function([, uid]) { return uid === member.user_id; })?.[0];
  return { stream: peerId ? remoteStreams?.get(peerId) || null : null, isLocal: false };
}

export default function PanelGrid({ members = [], currentUser, hostId, maxSlots = 20, onInvite, isHost, remoteStreams, peerUserIds, localStream, compact, screenStream, raisedHands }) {
  var [spotlitId, setSpotlitId] = useState(null);
  var [slots, setSlots] = useState(maxSlots);

  var SLOT_OPTIONS = [4, 6, 9, 12, 16, 20];
  var spotlit = spotlitId ? members.find(function(m) { return m.user_id === spotlitId; }) : null;
  var rest = spotlit ? members.filter(function(m) { return m.user_id !== spotlitId; }) : members;
  var emptyCount = Math.max(0, Math.min(slots - members.length, 4));

  var gridCols = slots <= 4 ? 'grid-cols-2' : slots <= 6 ? 'grid-cols-3' : slots <= 9 ? 'grid-cols-3' : slots <= 12 ? 'grid-cols-4' : slots <= 16 ? 'grid-cols-4' : 'grid-cols-5';

  if (compact) {
    return (
      <div className="flex overflow-x-auto gap-2 px-2 py-1" style={{ background: '#0d0618' }}>
        {members.slice(0, 20).map(function(m) {
          var { stream, isLocal } = resolveStream(m, currentUser, localStream, remoteStreams, peerUserIds);
          var isSpeaking = m.is_audio_enabled !== false;
          return (
            <CompactTile key={m.id || m.user_id} member={m} hostId={hostId} stream={stream} isLocal={isLocal} isSpeaking={isSpeaking} />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0618' }}>
      <div className="flex items-center gap-2 px-2 py-1.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 11, background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 99, padding: '2px 8px' }}>
          {members.length}/{maxSlots} panelists
        </span>
        <div className="flex gap-1 ml-auto">
          {SLOT_OPTIONS.map(function(n) {
            return (
              <button key={n} onClick={function() { setSlots(n); }}
                className="text-[11px] w-6 h-5 rounded border transition-all"
                style={slots === n
                  ? { borderColor: '#d4af37', color: '#d4af37', background: 'rgba(212,175,55,0.1)' }
                  : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
                {n}
              </button>
            );
          })}
        </div>
        {isHost && (
          <button onClick={onInvite} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-all"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}>
            <UserPlus className="w-2.5 h-2.5" /> Invite
          </button>
        )}
      </div>

      {screenStream && <ScreenShareTile screenStream={screenStream} />}

      {spotlit ? (
        <div className="flex-1 flex flex-col gap-2 p-2 overflow-hidden">
          {(() => {
            var { stream, isLocal } = resolveStream(spotlit, currentUser, localStream, remoteStreams, peerUserIds);
            return (
              <SpotlitView
                member={spotlit}
                hostId={hostId}
                stream={stream}
                isLocal={isLocal}
                onUnpin={() => setSpotlitId(null)}
              />
            );
          })()}
          <div className="flex gap-1.5 h-16 shrink-0 overflow-x-auto">
            {rest.slice(0, slots).map(function(m) {
              var { stream, isLocal } = resolveStream(m, currentUser, localStream, remoteStreams, peerUserIds);
              return (
                <div key={m.id} className="w-16 shrink-0 h-full">
                  <PanelTile
                    member={m} isHost={isHost} hostId={hostId}
                    isCurrentUser={!!(currentUser && m.user_id === currentUser.id)}
                    onSpotlight={setSpotlitId} canManage={isHost}
                    stream={stream} isLocal={isLocal}
                    raisedHands={raisedHands}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={'flex-1 p-2 grid ' + gridCols + ' gap-2 content-start overflow-auto'}>
          <AnimatePresence>
            {rest.slice(0, slots).map(function(m) {
              var { stream, isLocal } = resolveStream(m, currentUser, localStream, remoteStreams, peerUserIds);
              return (
                <PanelTile
                  key={m.id} member={m} isHost={isHost} hostId={hostId}
                  isCurrentUser={!!(currentUser && m.user_id === currentUser.id)}
                  onSpotlight={setSpotlitId} canManage={isHost}
                  stream={stream} isLocal={isLocal}
                  raisedHands={raisedHands}
                />
              );
            })}
            {Array.from({ length: emptyCount }).map(function(_, i) {
              return <EmptyTile key={'empty-' + i} onClick={onInvite} canInvite={!!isHost} />;
            })}
          </AnimatePresence>
        </div>
      )}

      <PanelMusicPlayer style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }} />
    </div>
  );
}
