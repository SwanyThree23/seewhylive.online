import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Radio, Monitor, MonitorStop, Signal, Maximize2, Minimize2 } from 'lucide-react';
import { useWebRTCPeers } from '@/hooks/useWebRTCPeers';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
// Eight-sided polygon — matches existing StageView / LocalVideoTile
const OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

const ROLE_COLOR = {
  host: GOLD,
  'co-host': GOLD,
  speaker: '#6DBF7E',
  guest: '#D4854A',
  viewer: 'rgba(255,255,255,0.3)',
};

/* ─────────────────────── single octagonal cell ─────────────────────── */
function OctCell({
  stream, userName, role, isLocal, isMuted, isVideoOff,
  isSpeaking, isStreaming, connState, avatarUrl, size = 'md',
  onToggleAudio, onToggleVideo, onSpotlight, isSpotlight,
}) {
  const videoRef = useRef(null);
  const roleColor = ROLE_COLOR[role] || GOLD;

  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream]);

  const px = { sm: 80, md: 130, lg: 200, xl: 280 }[size] || 130;
  const showVideo = stream && !isVideoOff;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative flex flex-col items-center gap-1.5"
      style={{ width: px }}
    >
      {/* Speaking ring (animated) */}
      {isSpeaking && (
        <div className="absolute inset-0 rounded-full animate-ping"
          style={{ clipPath: OCT, background: `${GOLD}22`, zIndex: 0 }} />
      )}

      {/* Octagonal frame */}
      <div
        className="relative overflow-hidden"
        style={{
          clipPath: OCT,
          width: px,
          height: px,
          background: '#080B18',
          border: `3px solid ${isSpeaking ? GOLD : isStreaming ? '#C0392B' : roleColor}`,
          boxShadow: isStreaming
            ? `0 0 24px rgba(192,57,43,0.5), inset 0 0 16px rgba(192,57,43,0.15)`
            : isSpeaking
              ? `0 0 24px rgba(212,175,55,0.6), inset 0 0 16px rgba(212,175,55,0.2)`
              : `0 0 12px ${roleColor}44, inset 0 0 8px ${roleColor}22`,
          flexShrink: 0,
          cursor: onSpotlight ? 'pointer' : 'default',
        }}
        onClick={onSpotlight}
      >
        {/* Video feed */}
        {showVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="w-full h-full object-cover"
            style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(145deg, ${CRIMSON}55, #080B18)` }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName}
                className="w-full h-full object-cover opacity-60" />
            ) : (
              <span className="font-black text-white"
                style={{ fontSize: px * 0.28, textShadow: `0 0 20px ${roleColor}` }}>
                {userName?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
        )}

        {/* Connecting overlay */}
        {!stream && connState === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${GOLD} transparent ${GOLD} ${GOLD}` }} />
          </div>
        )}

        {/* Live badge */}
        {isStreaming && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: '#C0392B', border: '1px solid rgba(212,175,55,0.4)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[9px] font-black text-white uppercase" style={T}>Live</span>
          </div>
        )}

        {/* Muted indicator */}
        {isMuted && (
          <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,50,50,0.85)' }}>
            <MicOff className="w-2.5 h-2.5 text-white" />
          </div>
        )}

        {/* Spotlight expand */}
        {onSpotlight && size !== 'sm' && (
          <button
            onClick={e => { e.stopPropagation(); onSpotlight(); }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-opacity"
            style={{ background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer' }}>
            {isSpotlight ? <Minimize2 className="w-3 h-3 text-white" /> : <Maximize2 className="w-3 h-3 text-white" />}
          </button>
        )}
      </div>

      {/* Name + controls below cell */}
      <div className="flex flex-col items-center gap-0.5" style={{ maxWidth: px }}>
        <div className="flex items-center gap-1">
          <span className="text-white font-black truncate"
            style={{ ...T, fontSize: 10, maxWidth: px - 20, textShadow: `0 0 8px ${roleColor}` }}>
            {isLocal ? 'You' : userName}
          </span>
          {role && (
            <span className="px-1 py-px rounded text-[8px] font-black uppercase"
              style={{ background: `${roleColor}22`, color: roleColor, border: `1px solid ${roleColor}44`, ...T }}>
              {role}
            </span>
          )}
        </div>

        {/* Mic/cam toggles — only shown for local user */}
        {isLocal && (
          <div className="flex items-center gap-1 mt-0.5">
            <button
              onClick={onToggleAudio}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isMuted ? 'rgba(200,50,50,0.25)' : 'rgba(109,191,126,0.2)',
                border: `1px solid ${isMuted ? 'rgba(200,50,50,0.5)' : 'rgba(109,191,126,0.4)'}`,
              }}>
              {isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-[#6DBF7E]" />}
            </button>
            <button
              onClick={onToggleVideo}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isVideoOff ? 'rgba(200,50,50,0.25)' : 'rgba(212,175,55,0.15)',
                border: `1px solid ${isVideoOff ? 'rgba(200,50,50,0.5)' : 'rgba(212,175,55,0.3)'}`,
              }}>
              {isVideoOff ? <VideoOff className="w-3 h-3 text-red-400" /> : <Video className="w-3 h-3" style={{ color: GOLD }} />}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────── main grid component ──────────────────── */
export default function OctagonalVideoGrid({
  roomId,
  participants = [],       // [{id, user_id, user_name, user_avatar, role, is_streaming, is_audio_enabled, is_video_enabled}]
  currentUser,
  isHost,
  onStreamOut,             // optional callback when user starts RTMP stream-out
  compactMode = false,     // true = smaller cells, strip controls
  speakingIds,             // Set<userId> — live speaking detection from useRemoteSpeakingMap
}) {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [localMuted, setLocalMuted] = useState(false);
  const [localVideoOff, setLocalVideoOff] = useState(false);
  const [camError, setCamError] = useState(null);
  const [spotlightId, setSpotlightId] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const { remoteStreams, peerStates, peerUserIds, leaveRoom, announceJoin } =
    useWebRTCPeers(roomId, localStream);

  /* ── Acquire local camera on mount ── */
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        announceJoin(currentUser?.id);
      } catch (err) {
        if (!mounted) return;
        setCamError(err.name === 'NotAllowedError' ? 'Camera permission denied' : 'No camera found');
        // Still announce with no video so others can see us
        announceJoin(currentUser?.id);
      }
    };
    init();
    return () => {
      mounted = false;
      leaveRoom();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [roomId, currentUser?.id]);

  /* ── Controls ── */
  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setLocalMuted(!track.enabled); }
  }, []);

  const toggleVideo = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setLocalVideoOff(!track.enabled); }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      screenStream?.getTracks().forEach(t => t.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
      // Restore camera
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) camTrack.enabled = !localVideoOff;
      return;
    }
    try {
      const disp = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(disp);
      setIsScreenSharing(true);
      toast.success('Screen sharing started');
      disp.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        setIsScreenSharing(false);
      };
    } catch { /* user cancelled */ }
  }, [isScreenSharing, screenStream, localVideoOff]);

  /* ── Build participant grid ── */
  const speakers = participants.filter(p =>
    ['host', 'co-host', 'speaker', 'guest'].includes(p.role)
  );
  const viewers = participants.filter(p => p.role === 'viewer');

  const allCells = [
    // Local user first
    {
      key: 'local',
      isLocal: true,
      stream: isScreenSharing ? screenStream : localStream,
      userName: currentUser?.full_name || currentUser?.email || 'You',
      role: isHost ? 'host' : 'guest',
      isMuted: localMuted,
      isVideoOff: localVideoOff && !isScreenSharing,
      isSpeaking: speakingIds ? speakingIds.has(currentUser?.id) : false,
      isStreaming: true,
      avatarUrl: currentUser?.avatar_url,
      userId: currentUser?.id,
    },
    // Remote speakers
    ...speakers
      .filter(p => p.user_id !== currentUser?.id)
      .map(p => {
        const peerId = Array.from(peerUserIds.entries()).find(([, uid]) => uid === p.user_id)?.[0];
        const stream = peerId ? remoteStreams.get(peerId) : undefined;
        const connState = peerId ? peerStates.get(peerId) : 'waiting';
        return {
          key: p.id,
          isLocal: false,
          stream,
          userName: p.user_name,
          role: p.role,
          isMuted: !p.is_audio_enabled,
          isVideoOff: !p.is_video_enabled,
          isSpeaking: speakingIds ? speakingIds.has(p.user_id) : false,
          isStreaming: p.is_streaming,
          avatarUrl: p.user_avatar,
          userId: p.user_id,
          connState: connState || 'waiting',
        };
      }),
  ];

  // Compute grid cell size
  const count = allCells.length;
  const cellSize = compactMode ? 'sm' : count <= 2 ? 'xl' : count <= 4 ? 'lg' : count <= 9 ? 'md' : 'sm';

  const spotlightCell = allCells.find(c => c.key === spotlightId);
  const sidebarCells = allCells.filter(c => c.key !== spotlightId);

  return (
    <div className="flex flex-col h-full" style={{ background: '#080B18' }}>
      {/* ── top bar ── */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ background: 'rgba(8,11,24,0.9)', borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#C0392B' }} />
          <span className="text-[10px] font-black uppercase text-white" style={T}>
            {allCells.length} On Stage
          </span>
          {viewers.length > 0 && (
            <span className="text-[10px] font-black uppercase" style={{ ...T, color: 'rgba(255,255,255,0.35)' }}>
              · {viewers.length} watching
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {camError && (
            <span className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(200,50,50,0.15)', color: '#ff6b6b', border: '1px solid rgba(200,50,50,0.3)', ...T }}>
              {camError}
            </span>
          )}
          {/* Screen share */}
          <button
            onClick={toggleScreenShare}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all"
            style={{
              ...T,
              background: isScreenSharing ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isScreenSharing ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: isScreenSharing ? GOLD : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
            }}>
            {isScreenSharing ? <MonitorStop className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
            {isScreenSharing ? 'Stop Share' : 'Share Screen'}
          </button>
          {/* RTMP stream-out (host) */}
          {isHost && onStreamOut && (
            <button
              onClick={onStreamOut}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase"
              style={{ ...T, background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.35)', color: '#C0392B', cursor: 'pointer' }}>
              <Radio className="w-3 h-3" /> Stream Out
            </button>
          )}
        </div>
      </div>

      {/* ── video area ── */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        {spotlightCell ? (
          // Spotlight layout: large + sidebar strip
          <div className="flex gap-3 h-full">
            <div className="flex-1 flex items-center justify-center">
              <OctCell
                {...spotlightCell}
                size="xl"
                isSpotlight
                onSpotlight={() => setSpotlightId(null)}
                onToggleAudio={spotlightCell.isLocal ? toggleMic : undefined}
                onToggleVideo={spotlightCell.isLocal ? toggleVideo : undefined}
              />
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-1" style={{ maxHeight: '100%' }}>
              {sidebarCells.map(cell => (
                <OctCell
                  key={cell.key}
                  {...cell}
                  size="sm"
                  onSpotlight={() => setSpotlightId(cell.key)}
                  onToggleAudio={cell.isLocal ? toggleMic : undefined}
                  onToggleVideo={cell.isLocal ? toggleVideo : undefined}
                />
              ))}
            </div>
          </div>
        ) : (
          // Uniform grid
          <div className="flex flex-wrap gap-4 justify-center items-start">
            <AnimatePresence>
              {allCells.map(cell => (
                <OctCell
                  key={cell.key}
                  {...cell}
                  size={cellSize}
                  onSpotlight={() => setSpotlightId(cell.key)}
                  onToggleAudio={cell.isLocal ? toggleMic : undefined}
                  onToggleVideo={cell.isLocal ? toggleVideo : undefined}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── viewer roster (collapsed strip) ── */}
      {viewers.length > 0 && !compactMode && (
        <div className="shrink-0 px-3 py-2 flex items-center gap-2 overflow-x-auto"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
          <span className="text-[9px] font-black uppercase shrink-0" style={{ ...T, color: 'rgba(255,255,255,0.25)' }}>
            Viewers ({viewers.length})
          </span>
          {viewers.slice(0, 20).map(v => (
            <div key={v.id} title={v.user_name}
              className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[8px] font-black text-white"
              style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})` }}>
              {v.user_name?.charAt(0)?.toUpperCase()}
            </div>
          ))}
          {viewers.length > 20 && (
            <span className="text-[9px] shrink-0" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
              +{viewers.length - 20} more
            </span>
          )}
        </div>
      )}

      {/* ── local controls bar ── */}
      <div className="shrink-0 flex items-center justify-center gap-3 py-3"
        style={{ borderTop: '1px solid rgba(212,175,55,0.08)', background: 'rgba(8,11,24,0.95)' }}>
        {/* Mic */}
        <button
          onClick={toggleMic}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{
            background: localMuted ? 'rgba(200,50,50,0.2)' : 'rgba(109,191,126,0.15)',
            border: `2px solid ${localMuted ? 'rgba(200,50,50,0.5)' : 'rgba(109,191,126,0.4)'}`,
          }}>
          {localMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-[#6DBF7E]" />}
        </button>
        {/* Cam */}
        <button
          onClick={toggleVideo}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{
            background: localVideoOff ? 'rgba(200,50,50,0.2)' : 'rgba(212,175,55,0.12)',
            border: `2px solid ${localVideoOff ? 'rgba(200,50,50,0.5)' : 'rgba(212,175,55,0.35)'}`,
          }}>
          {localVideoOff ? <VideoOff className="w-4 h-4 text-red-400" /> : <Video className="w-4 h-4" style={{ color: GOLD }} />}
        </button>
        {/* Signal quality */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Signal className="w-3 h-3 text-[#6DBF7E]" />
          <span className="text-[9px] font-black uppercase text-[#6DBF7E]" style={T}>
            {localStream ? 'Live' : 'No Cam'}
          </span>
        </div>
      </div>
    </div>
  );
}
