import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown, Mic, MicOff, Video, VideoOff, Maximize2, MoreHorizontal, UserPlus, Pin } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

var COLORS = ['#8B6F47', '#6B7C4A', '#CC7755', '#4A6B7C', '#7C4A6B', '#6B4A4A'];
var OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

function getColor(name) {
  var idx = (name ? name.charCodeAt(0) : 0) % COLORS.length;
  return COLORS[idx];
}

function PanelTile({ member, isHost, isCurrentUser, hostId, onSpotlight, canManage, stream, isLocal }) {
  var speaking = member.is_audio_enabled !== false;
  var color = getColor(member.user_name);
  var isHostMember = member.user_id === hostId;
  var videoRef = useRef(null);

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="relative group aspect-square"
    >
      {/* Octagonal border/glow layer */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: OCT,
          background: borderColor,
          filter: speaking ? 'blur(1px)' : 'none',
          transition: 'background 0.3s',
        }}
      />

      {/* Octagonal content layer */}
      <div
        className="absolute inset-[2px] overflow-hidden"
        style={{
          clipPath: OCT,
          background: 'linear-gradient(135deg, #1A0F0A, #0d0618)',
        }}
      >
        {/* Live video or avatar fallback */}
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
            <Avatar className="w-8 h-8 border" style={{ borderColor: color + '60' }}>
              <AvatarFallback className="text-white font-bold text-xs" style={{ background: color + '40' }}>
                {member.user_name ? member.user_name.charAt(0).toUpperCase() : '?'}
              </AvatarFallback>
            </Avatar>
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

        {/* Bottom name bar */}
        <div
          className="absolute bottom-0 left-0 right-0 px-1 py-0.5"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92), transparent)' }}
        >
          <div className="flex items-center gap-0.5">
            {isHostMember && <Crown className="w-2 h-2 shrink-0" style={{ color: '#d4af37' }} />}
            <span className="text-[8px] text-white font-semibold truncate flex-1">{member.user_name}</span>
            {speaking ? <Mic className="w-2 h-2 text-green-400 shrink-0" /> : <MicOff className="w-2 h-2 text-white/30 shrink-0" />}
          </div>
        </div>

        {/* You / host badge */}
        {isCurrentUser && (
          <div className="absolute top-1 left-1">
            <span className="text-[7px] px-1 py-0.5 rounded font-bold" style={{ background: 'rgba(212,175,55,0.3)', color: '#d4af37' }}>You</span>
          </div>
        )}

        {/* Hover controls */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
          <button
            onClick={function() { onSpotlight(member.user_id); }}
            className="w-4 h-4 rounded flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Maximize2 className="w-2 h-2 text-white" />
          </button>
          {canManage && member.user_id !== hostId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-4 h-4 rounded flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <MoreHorizontal className="w-2 h-2 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="text-xs" style={{ background: '#1A0F0A', border: '1px solid rgba(212,175,55,0.2)' }}>
                <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer gap-2">
                  <Pin className="w-3 h-3" /> Pin
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer gap-2">
                  <MicOff className="w-3 h-3" /> Mute
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-400 hover:bg-red-900/20 cursor-pointer gap-2">
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          <Avatar className="w-20 h-20">
            <AvatarFallback className="text-2xl font-bold text-white" style={{ background: getColor(member.user_name) + '40' }}>
              {member.user_name ? member.user_name.charAt(0).toUpperCase() : '?'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold text-white">{member.user_name}</span>
          {member.user_id === hostId && <Crown className="w-4 h-4" style={{ color: '#d4af37' }} />}
        </div>
      )}
      <button
        onClick={onUnpin}
        className="absolute top-2 right-2 text-[9px] px-2 py-1 rounded"
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

function resolveStream(member, currentUser, localStream, remoteStreams, peerUserIds) {
  var isMe = currentUser && member.user_id === currentUser.id;
  if (isMe) return { stream: localStream || null, isLocal: true };
  var peerId = Array.from((peerUserIds || new Map()).entries()).find(function([, uid]) { return uid === member.user_id; })?.[0];
  return { stream: peerId ? remoteStreams?.get(peerId) || null : null, isLocal: false };
}

export default function PanelGrid({ members = [], currentUser, hostId, maxSlots = 20, onInvite, isHost, remoteStreams, peerUserIds, localStream }) {
  var [spotlitId, setSpotlitId] = useState(null);
  var [slots, setSlots] = useState(maxSlots);

  var SLOT_OPTIONS = [4, 6, 9, 12, 16, 20];
  var spotlit = spotlitId ? members.find(function(m) { return m.user_id === spotlitId; }) : null;
  var rest = spotlit ? members.filter(function(m) { return m.user_id !== spotlitId; }) : members;
  var emptyCount = Math.max(0, Math.min(slots - members.length, 4));

  var gridCols = slots <= 4 ? 'grid-cols-2' : slots <= 6 ? 'grid-cols-3' : slots <= 9 ? 'grid-cols-3' : slots <= 12 ? 'grid-cols-4' : slots <= 16 ? 'grid-cols-4' : 'grid-cols-5';

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0618' }}>
      {/* Controls bar */}
      <div className="flex items-center gap-2 px-2 py-1.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Badge className="text-[9px]" style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.2)' }}>
          {members.length}/{maxSlots} panelists
        </Badge>
        <div className="flex gap-1 ml-auto">
          {SLOT_OPTIONS.map(function(n) {
            return (
              <button key={n} onClick={function() { setSlots(n); }}
                className="text-[9px] w-6 h-5 rounded border transition-all"
                style={slots === n
                  ? { borderColor: '#d4af37', color: '#d4af37', background: 'rgba(212,175,55,0.1)' }
                  : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
                {n}
              </button>
            );
          })}
        </div>
        {isHost && (
          <button onClick={onInvite} className="flex items-center gap-1 text-[9px] px-2 py-1 rounded transition-all"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}>
            <UserPlus className="w-2.5 h-2.5" /> Invite
          </button>
        )}
      </div>

      {/* Spotlight + strip */}
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
                />
              );
            })}
            {Array.from({ length: emptyCount }).map(function(_, i) {
              return <EmptyTile key={'empty-' + i} onClick={onInvite} canInvite={!!isHost} />;
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
