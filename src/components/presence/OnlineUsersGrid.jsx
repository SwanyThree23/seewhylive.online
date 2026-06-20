import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Radio, Wifi, WifiOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const BG = '#080B18';
const BG2 = '#0d0618';

const PALETTE = ['#8B6F47','#6B7C4A','#CC7755','#4A6B7C','#7C4A6B','#C0392B','#D4854A','#C9A84C'];
function avatarColor(name) {
  return PALETTE[(name?.charCodeAt(0) ?? 0) % PALETTE.length];
}

// Single octagonal user tile with real video or avatar fallback
function UserOctTile({ user, stream, size = 72, isLive = false, isSpeaking = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream || null;
  }, [stream]);

  const name = user?.full_name || user?.user_name || user?.name || 'Guest';
  const color = avatarColor(name);
  const border = isSpeaking ? GOLD : isLive ? `${GOLD}66` : 'rgba(255,255,255,0.1)';

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: size + 16 }}>
      <div className="relative" style={{ width: size, height: size }}>

        {/* Speaking pulse ring */}
        {isSpeaking && (
          <motion.div
            className="absolute inset-0"
            style={{ clipPath: OCT, background: GOLD, opacity: 0.2 }}
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.06, 1] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Octagonal border */}
        <div className="absolute inset-0"
          style={{ clipPath: OCT, background: border, transition: 'background 0.4s' }} />

        {/* Content shell */}
        <div
          className="absolute inset-[2.5px] overflow-hidden flex items-center justify-center"
          style={{ clipPath: OCT, background: `linear-gradient(145deg, rgba(30,15,30,0.97), rgba(8,11,24,0.97))` }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: stream ? 'block' : 'none' }}
          />
          {!stream && (
            <>
              <div className="absolute inset-0"
                style={{ background: `radial-gradient(circle, ${color}22 0%, transparent 70%)` }} />
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${color}, ${color}88)`,
                    color: '#fff',
                    boxShadow: `0 0 16px ${color}44`,
                    border: '1.5px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </>
          )}
        </div>

        {/* LIVE badge */}
        {isLive && (
          <div className="absolute -top-1 left-0 right-0 flex justify-center">
            <span style={{
              fontSize: 7,
              fontWeight: 900,
              background: CRIMSON,
              color: '#fff',
              padding: '1px 4px',
              borderRadius: 99,
              fontFamily: 'Barlow Condensed, sans-serif',
              letterSpacing: '0.06em',
              boxShadow: `0 0 6px ${CRIMSON}88`,
            }}>LIVE</span>
          </div>
        )}

        {/* Online dot */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
          style={{ background: '#6DBF7E', border: `2px solid ${BG}` }} />
      </div>

      {/* Name */}
      <p className="text-[10px] font-semibold text-white/60 truncate text-center"
        style={{ maxWidth: size + 16, lineHeight: 1.2 }}>
        {name.split(' ')[0]}
      </p>
    </div>
  );
}

/**
 * Shows all currently online/live users across the platform as octagonal tiles.
 * Accepts optional `remoteStreams` (Map<peerId→MediaStream>) and `peerUserIds`
 * (Map<peerId→userId>) from useWebRTCPeers so camera feeds show when available.
 */
export default function OnlineUsersGrid({
  roomId = null,
  remoteStreams = new Map(),
  peerUserIds = new Map(),
  localStream = null,
  currentUser = null,
  compact = false,
  maxVisible = 20,
}) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [liveUserIds, setLiveUserIds] = useState(new Set());

  // Query current room participants (fast path when in a room)
  const { data: roomMembers = [] } = useQuery({
    queryKey: ['room-members-presence', roomId],
    queryFn: () => base44.entities.WatchPartyMember.filter({ party_id: roomId, is_active: true }),
    enabled: !!roomId,
    refetchInterval: 15000,
  });

  // Query platform-wide online presence
  const { data: presenceRecords = [] } = useQuery({
    queryKey: ['online-presence-all'],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString(); // 3 min window
      return base44.entities.OnlinePresence.filter({ status: 'online' });
    },
    refetchInterval: 20000,
  });

  // Subscribe to real-time presence changes
  useEffect(() => {
    const unsub = base44.entities.OnlinePresence.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        setOnlineUsers(prev => {
          const idx = prev.findIndex(u => u.id === event.data?.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = event.data;
            return next;
          }
          return [...prev, event.data];
        });
      } else if (event.type === 'delete') {
        setOnlineUsers(prev => prev.filter(u => u.id !== event.data?.id));
      }
    });
    return unsub;
  }, []);

  // Merge room members + platform presence into one list
  useEffect(() => {
    const roomSet = new Set();
    const merged = [];

    if (currentUser) {
      merged.push({
        id: currentUser.id,
        user_id: currentUser.id,
        full_name: currentUser.full_name,
        avatar_url: currentUser.avatar_url,
        isLocal: true,
        isLive: !!localStream,
      });
      roomSet.add(currentUser.id);
    }

    roomMembers.forEach(m => {
      if (!roomSet.has(m.user_id)) {
        merged.push({
          id: m.user_id,
          user_id: m.user_id,
          full_name: m.user_name || 'Guest',
          avatar_url: m.avatar_url,
          isLive: true,
        });
        roomSet.add(m.user_id);
      }
    });

    presenceRecords.forEach(p => {
      if (!roomSet.has(p.user_id)) {
        merged.push({
          id: p.user_id,
          user_id: p.user_id,
          full_name: p.user_name || p.display_name || 'Guest',
          avatar_url: p.avatar_url,
          isLive: !!p.current_room_id,
        });
        roomSet.add(p.user_id);
      }
    });

    // Also merge any WebRTC peer user IDs we know about
    peerUserIds.forEach((userId) => {
      if (!roomSet.has(userId)) {
        merged.push({
          id: userId,
          user_id: userId,
          full_name: 'Peer',
          isLive: true,
        });
        roomSet.add(userId);
      }
    });

    setOnlineUsers(merged);
    setLiveUserIds(new Set(merged.filter(u => u.isLive).map(u => u.user_id)));
  }, [roomMembers, presenceRecords, currentUser, localStream]);

  // Map userId → MediaStream
  function streamForUser(userId) {
    if (userId === currentUser?.id) return localStream;
    for (const [peerId, uid] of peerUserIds.entries()) {
      if (uid === userId) return remoteStreams.get(peerId) || null;
    }
    return null;
  }

  const visible = onlineUsers.slice(0, maxVisible);
  const overflow = onlineUsers.length - maxVisible;
  const tileSize = compact ? 56 : 72;

  if (onlineUsers.length === 0) return null;

  return (
    <div style={{ width: '100%' }}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: '#6DBF7E', boxShadow: '0 0 6px #6DBF7E' }} />
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: compact ? 12 : 14,
            fontWeight: 900,
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Online Now
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3" style={{ color: GOLD }} />
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            color: GOLD,
          }}>
            {onlineUsers.length}
          </span>
          {liveUserIds.size > 0 && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>·</span>
              <Radio className="w-3 h-3 text-red-400" />
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 700, color: '#EF4444' }}>
                {liveUserIds.size} live
              </span>
            </>
          )}
        </div>
      </div>

      {/* Scrollable tile row */}
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence>
          {visible.map((u, idx) => {
            const s = streamForUser(u.user_id);
            return (
              <motion.div
                key={u.user_id || idx}
                className="shrink-0"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
              >
                <UserOctTile
                  user={u}
                  stream={s}
                  size={tileSize}
                  isLive={u.isLive}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* +N overflow pill */}
        {overflow > 0 && (
          <div className="shrink-0 flex flex-col items-center justify-center gap-1">
            <div className="rounded-full flex items-center justify-center"
              style={{
                width: tileSize,
                height: tileSize,
                clipPath: OCT,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: 16,
                fontWeight: 900,
                color: GOLD,
              }}>
                +{overflow}
              </span>
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              more
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
