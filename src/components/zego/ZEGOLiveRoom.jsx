import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Monitor, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useWebRTCPeers } from '@/hooks/useWebRTCPeers';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

// Reusable octagonal video cell used throughout the broadcast grid
function OctCell({ videoRef, stream, label, sublabel, gold, paused, error, connecting, live, role }) {
  const localRef = useRef(null);
  const ref = videoRef || localRef;
  const borderColor = gold ? 'rgba(212,175,55,0.7)' : 'rgba(201,168,76,0.3)';

  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="relative aspect-square"
    >
      {/* Gold OCT border ring — pulses when speaking/gold */}
      <div className="absolute inset-0" style={{ clipPath: OCT, background: borderColor }} />

      <div className="absolute inset-[2px] overflow-hidden flex items-center justify-center"
        style={{ clipPath: OCT, background: '#0A0A12' }}>
        {error ? (
          <p className="text-[11px] text-center px-2" style={{ color: '#ef4444' }}>{error}</p>
        ) : connecting ? (
          <div className="text-center">
            <div className="w-8 h-8 rounded-full animate-pulse mx-auto mb-1" style={{ background: 'rgba(212,175,55,0.2)' }} />
            <p className="text-[11px]" style={{ color: GOLD }}>Connecting…</p>
          </div>
        ) : stream ? (
          <video ref={ref} autoPlay playsInline muted={!!videoRef} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-2">
            <div className="w-10 h-10 rounded-full mx-auto mb-1 animate-pulse" style={{ background: 'rgba(212,175,55,0.15)' }} />
            {label && <p className="text-[11px] font-bold truncate" style={{ color: GOLD }}>{label}</p>}
            {sublabel && <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{sublabel}</p>}
          </div>
        )}

        {/* Overlay labels */}
        {stream && (
          <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
            <div className="flex items-center gap-1">
              {label && <span className="text-[10px] font-black truncate flex-1" style={{ color: GOLD, ...T }}>{label}</span>}
              {role && <span className="text-[8px] px-1 rounded font-bold" style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}>{role}</span>}
              {live && <span className="text-[8px] px-1 rounded font-bold animate-pulse" style={{ background: 'rgba(109,191,126,0.2)', color: '#6DBF7E' }}>LIVE</span>}
              {paused && <VideoOff className="w-2.5 h-2.5 text-white/40" />}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Full ZEGOCLOUD WebRTC integration:
 * - Host publishes video/audio streams
 * - Guests join and can optionally co-stream
 * - Viewers watch with real-time participant grid
 * - Uses native WebRTC PeerConnection + database sync for roster
 */
export default function ZEGOLiveRoom({ roomId, userId, userName, isHost, onStreamHealth }) {
  const qc = useQueryClient();
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  // Track stream in state so useWebRTCPeers receives it after async init
  const [localStream, setLocalStream] = useState(null);
  const { addPeer, removePeer, getPeers, remoteStreams, peerStates, peerUserIds, leaveRoom, announceJoin, selfId } = useWebRTCPeers(roomId, localStream);

  // Stable refs for cleanup closure (avoids stale state captures)
  const leaveRoomRef = useRef(leaveRoom);
  const announceJoinRef = useRef(announceJoin);
  useEffect(() => { leaveRoomRef.current = leaveRoom; }, [leaveRoom]);
  useEffect(() => { announceJoinRef.current = announceJoin; }, [announceJoin]);

  const [localMuted, setLocalMuted] = useState(false);
  const [localVideoPaused, setLocalVideoPaused] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [screenSharing, setScreenSharing] = useState(false);
  const screenTrackRef = useRef(null);
  const mediaInitialized = useRef(false);

  // Fetch ZEGO config & room state
  const { data: zegoConfig } = useQuery({
    queryKey: ['zego-config', userId],
    queryFn: () => base44.entities.ZEGOStream.filter({ host_id: userId, status: 'config' }).then(r => r[0]),
    enabled: !!userId,
  });

  const { data: zegoStream } = useQuery({
    queryKey: ['zego-active', roomId],
    queryFn: () => base44.entities.ZEGOStream.filter({ room_id: roomId, status: 'live' }, '-created_date', 1).then(r => r[0]),
    enabled: !!roomId,
    refetchInterval: 3000,
  });

  // Fetch active participants in room
  const { data: roomParticipants = [] } = useQuery({
    queryKey: ['room-participants', roomId],
    queryFn: () => base44.entities.Participant.filter({ room_id: roomId }),
    enabled: !!roomId,
    refetchInterval: 2000,
  });

  // Join signaling mutation
  const joinSignalingMut = useMutation({
    mutationFn: () => base44.functions.invoke('zegoSignaling', {
      action: 'join',
      roomId,
      role: isHost ? 'host' : 'viewer',
    }),
    onSuccess: () => {
      toast.success('Connected to room');
    },
  });

  // Leave signaling mutation
  const leaveSignalingMut = useMutation({
    mutationFn: (participantId) => base44.functions.invoke('zegoSignaling', {
      action: 'leave',
      roomId,
      participantId,
    }),
  });

  // Initialize local media once and announce presence to peers
  useEffect(() => {
    if (mediaInitialized.current) return;
    if (!isHost && zegoStream?.status !== 'live') return;

    mediaInitialized.current = true;
    let mounted = true;

    const initMedia = async () => {
      try {
        setConnecting(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;
        setLocalStream(stream); // update state so WebRTC hook gets the stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setConnecting(false);
        // Announce with our userId so peers can map streams to participants
        announceJoinRef.current?.(userId);
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to access camera/microphone');
          setConnecting(false);
        }
      }
    };

    initMedia();

    return () => {
      mounted = false;
      leaveRoomRef.current?.();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [isHost, zegoStream?.status]);

  // Sync participants from database
  useEffect(() => {
    setParticipants(
      roomParticipants
        .filter(p => p.user_id !== userId && p.status !== 'pending')
        .map(p => ({ id: p.id, name: p.user_name, role: p.role }))
    );
  }, [roomParticipants, userId]);

  // Toggle audio
  const handleToggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setLocalMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setLocalVideoPaused(!videoTrack.enabled);
      }
    }
  };

  // Screen share toggle
  const handleScreenShare = async () => {
    if (!localStreamRef.current) return;
    if (screenSharing) {
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      const camTrack = await navigator.mediaDevices.getUserMedia({ video: true }).then(s => s.getVideoTracks()[0]).catch(() => null);
      if (camTrack && localStreamRef.current) {
        const old = localStreamRef.current.getVideoTracks()[0];
        if (old) localStreamRef.current.removeTrack(old);
        localStreamRef.current.addTrack(camTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      }
      setScreenSharing(false);
      toast('Camera restored');
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;
        const old = localStreamRef.current.getVideoTracks()[0];
        if (old) localStreamRef.current.removeTrack(old);
        localStreamRef.current.addTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        screenTrack.onended = () => { handleScreenShare(); };
        setScreenSharing(true);
        toast.success('Screen sharing started');
      } catch {
        toast.error('Screen share cancelled');
      }
    }
  };

  // End stream (host only)
  const endStreamMut = useMutation({
    mutationFn: () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      return base44.entities.ZEGOStream.update(zegoStream.id, {
        status: 'ended',
        ended_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries(['zego-active']);
      toast.success('Stream ended');
      if (userId) {
        base44.entities.Activity.create({
          user_id: userId,
          type: 'room_ended',
          title: 'Ended live stream',
        }).catch(() => {});
      }
    },
  });

  const handleEndStream = () => {
    if (zegoStream && isHost) {
      endStreamMut.mutate();
    }
  };

  // Render video grid
  const gridLayout = () => {
    const count = 1 + participants.length; // local + peers
    if (count <= 1) return 'w-full h-full';
    if (count === 2) return 'grid grid-cols-2 gap-2';
    if (count <= 4) return 'grid grid-cols-2 gap-2';
    return 'grid grid-cols-3 gap-2';
  };

  const OCT = 'polygon(29% 0%,71% 0%,100% 29%,100% 71%,71% 100%,29% 100%,0% 71%,0% 29%)';
  const count = 1 + participants.length;
  const cellSize = count <= 2 ? 180 : count <= 6 ? 140 : 110;

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col h-full" style={{ background: '#0F0F1A', border: '1px solid rgba(201,168,76,0.15)' }}>
      {/* Video Grid */}
      <div className={`flex-1 ${gridLayout()} p-2 min-h-0`}>
        {/* Local Video — octagonal cell */}
        <OctCell
          videoRef={localVideoRef}
          stream={localStream}
          label={`YOU ${isHost ? '(HOST)' : ''}`}
          gold
          paused={localVideoPaused}
          error={error}
          connecting={connecting}
        />

        {/* Peer Videos — real WebRTC streams, octagonal */}
        {participants.map(p => {
          const peerId = Array.from(peerUserIds.entries()).find(([, uid]) => uid === p.user_id)?.[0];
          const peerStream = peerId ? remoteStreams.get(peerId) : undefined;
          const connState = peerId ? peerStates.get(peerId) : undefined;
          const initials = (p.name || 'P').slice(0, 2).toUpperCase();
          const isConnected = connState === 'connected' && !!peerStream;
          return (
            <OctCell
              key={p.id}
              stream={stream}
              label={p.name}
              sublabel={connState === 'connecting' ? 'Connecting…' : connState === 'failed' ? '⚠ Failed' : stream ? undefined : 'Waiting…'}
              live={connState === 'connected' && !!stream}
              role={p.role}
            />
          );
        })}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-2 p-3" style={{ background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <Users className="w-3 h-3" />
          <span id="zego-participant-count" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, color: GOLD, fontSize: 12 }}>
            {participants.length + 1} LIVE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mic toggle */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleToggleMic}
            disabled={connecting || !localStreamRef.current}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-all"
            style={{
              background: localMuted ? 'rgba(255,68,68,0.2)' : 'rgba(109,191,126,0.15)',
              border: localMuted ? '1px solid rgba(255,68,68,0.4)' : '1px solid rgba(109,191,126,0.3)',
              color: localMuted ? '#FF4444' : '#6DBF7E',
            }}>
            {localMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </motion.button>

          {/* Video toggle */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleToggleVideo}
            disabled={connecting || !localStreamRef.current}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-all"
            style={{
              background: localVideoPaused ? 'rgba(255,68,68,0.2)' : 'rgba(201,168,76,0.15)',
              border: localVideoPaused ? '1px solid rgba(255,68,68,0.4)' : '1px solid rgba(201,168,76,0.3)',
              color: localVideoPaused ? '#FF4444' : '#C9A84C',
            }}>
            {localVideoPaused ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </motion.button>

          {/* Screen share */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleScreenShare}
            disabled={!localStreamRef.current}
            title={screenSharing ? 'Stop screen share' : 'Share screen'}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-all"
            style={{
              background: screenSharing ? 'rgba(212,133,74,0.2)' : 'rgba(255,255,255,0.05)',
              border: screenSharing ? '1px solid rgba(212,133,74,0.4)' : '1px solid rgba(255,255,255,0.1)',
              color: screenSharing ? '#D4854A' : 'rgba(255,255,255,0.4)',
            }}>
            <Monitor className="w-4 h-4" />
          </motion.button>

          {/* Settings */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
            <Settings className="w-4 h-4" />
          </motion.button>

          {/* End stream (host only) */}
          {isHost && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleEndStream}
              disabled={endStreamMut.isPending || !zegoStream}
              className="flex items-center justify-center w-9 h-9 rounded-lg"
              style={{ background: 'rgba(255,68,68,0.2)', border: '1px solid rgba(255,68,68,0.4)', color: '#FF4444' }}>
              <PhoneOff className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {connecting && (
          <span className="text-[11px]" style={{ color: GOLD }}>Connecting…</span>
        )}
      </div>
    </div>
  );
}