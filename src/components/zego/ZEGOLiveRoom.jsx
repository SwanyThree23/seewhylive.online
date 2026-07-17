import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Monitor, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useWebRTCPeers } from '@/hooks/useWebRTCPeers';
import { useRemoteSpeakingMap } from '@/hooks/useRemoteSpeakingMap';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

/**
 * Full ZEGOCLOUD WebRTC integration:
 * - Host publishes video/audio streams
 * - Guests join and can optionally co-stream
 * - Viewers watch with real-time participant grid
 * - Uses native WebRTC PeerConnection + database sync for roster
 */
export default function ZEGOLiveRoom({ roomId, userId, userName, isHost, onStreamHealth, onSpeakingChange }) {
  const qc = useQueryClient();
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  // Track stream in state so useWebRTCPeers receives it after async init
  const [localStream, setLocalStream] = useState(null);
  const { addPeer, removePeer, getPeers, remoteStreams, peerStates, peerUserIds, leaveRoom, announceJoin, selfId } = useWebRTCPeers(roomId, localStream);

  // Real per-peer speaking detection via WebAudio RMS analysis
  const remoteSpeakingIds = useRemoteSpeakingMap(remoteStreams, peerUserIds);
  useEffect(() => { onSpeakingChange?.(remoteSpeakingIds); }, [remoteSpeakingIds]);

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
    onError: () => toast.error('Action failed.'),
  });

  // Leave signaling mutation
  const leaveSignalingMut = useMutation({
    mutationFn: (participantId) => participantId
      ? base44.entities.Participant.delete(participantId)
      : Promise.resolve(),
    onError: () => toast.error('Action failed.'),
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
    },
    onError: () => toast.error('Action failed.'),
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

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col h-full" style={{ background: '#0F0F1A', border: '1px solid rgba(201,168,76,0.15)' }}>
      {/* Video Grid */}
      <div className={`flex-1 ${gridLayout()} p-2 min-h-0`}>
        {/* Local Video */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-xl overflow-hidden"
          style={{ background: '#000', border: '1px solid rgba(201,168,76,0.2)' }}>
          {error ? (
            <div className="inset-0 flex items-center justify-center text-center p-4 text-[#C0392B] text-sm">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-start justify-between p-2">
                <span className="text-[10px] font-black uppercase px-2 py-1 rounded" style={{ background: 'rgba(0,0,0,0.6)', color: GOLD, ...T }}>
                  YOU {isHost ? '(HOST)' : '(VIEWER)'}
                </span>
                {localVideoPaused && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
                    <VideoOff className="w-6 h-6 text-white/50" />
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* Peer Videos — real WebRTC streams */}
        {participants.map(p => {
          // Find peerId whose announceJoin userId matches this participant's user_id
          const peerId = Array.from(peerUserIds.entries()).find(([, uid]) => uid === p.user_id)?.[0];
          const stream = peerId ? remoteStreams.get(peerId) : undefined;
          const connState = peerId ? peerStates.get(peerId) : undefined;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative rounded-xl overflow-hidden"
              style={{ background: '#000', border: '1px solid rgba(212,175,55,0.2)' }}>
              {stream ? (
                <video
                  autoPlay playsInline
                  ref={el => { if (el && el.srcObject !== stream) el.srcObject = stream; }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: '#0A0A0F' }}>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full mx-auto mb-2 animate-pulse" style={{ background: 'rgba(212,175,55,0.15)' }} />
                    <p className="text-[10px]" style={{ color: GOLD }}>{p.name}</p>
                    <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {connState === 'connecting' ? 'Connecting…' : connState === 'failed' ? 'Connection failed' : 'Waiting for stream…'}
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <span className="text-[11px] font-black uppercase px-2 py-1 rounded" style={{ background: 'rgba(0,0,0,0.6)', color: '#C9A84C' }}>
                  {p.role}
                </span>
                {connState === 'connected' && stream && (
                  <span className="text-[7px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(109,191,126,0.2)', color: '#6DBF7E' }}>LIVE</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-2 p-3" style={{ background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <Users className="w-3 h-3" />
          <span>{participants.length + 1} in room</span>
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
              color: localMuted ? '#C0392B' : '#6DBF7E',
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
              color: localVideoPaused ? '#C0392B' : '#C9A84C',
            }}>
            {localVideoPaused ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </motion.button>

          {/* Screen share (stub) */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
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
              style={{ background: 'rgba(255,68,68,0.2)', border: '1px solid rgba(255,68,68,0.4)', color: '#C0392B' }}>
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