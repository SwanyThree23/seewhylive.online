/**
 * LiveStage.jsx — SFU-backed dynamic live-streaming stage for SeeWhy LIVE (v2).
 *
 * Roles:
 *   "panelist" — publishes camera+audio (one uplink, SFU fans out to subscribers).
 *   "viewer"   — subscribe-only; never calls getUserMedia; zero camera permission prompts.
 *               Viewers can upgrade to panelist at runtime without a page reload.
 *
 * Layout rules:
 *   1 panelist  → full-screen (grid-cols-1)
 *   2 panelists → side-by-side (grid-cols-2)
 *   3–4         → 2×2 grid
 *   5+          → 3-column grid
 *   Screen share active → 70/30 split (screen dominant left, webcam sidebar right)
 *   Pinned tile         → 70/30 split (pinned dominant, rest in sidebar)
 *
 * SFU data channels (ZEGO broadcast/custom commands):
 *   Chat:      sendBroadcastMessage / IMRecvBroadcastMessage
 *   Reactions: sendCustomCommand   / IMRecvCustomCommand (JSON {type:"reaction",emoji})
 *   Users:     roomUserUpdate event → viewerCount badge
 *
 * Instant co-hosting: viewers click "Go on Stage" → upgradeToParticipant() →
 *   creates ZEGO stream + starts publishing — no reload required.
 *
 * Adaptive degradation: ZEGO networkQuality events (0–5 scale) → 'good'/'warning'/'poor'
 *   label + toast when quality drops to 'poor'.
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MicOff, VideoOff, MonitorOff, Pin, Radio, Wifi,
  MessageSquare, Send, X, Users, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// ─── Design tokens ─────────────────────────────────────────────────────────
const GOLD  = '#D4AF37';
const BURG  = '#800020';
const GREEN = '#6DBF7E';
const RED   = '#C0392B';
const BG    = '#080B18';
const FONT  = 'Barlow Condensed, sans-serif';

// ─── Emoji reaction palette ────────────────────────────────────────────────
const REACTION_EMOJIS = ['👏', '🔥', '❤️', '😂', '🎉'];

// ─── ZEGO engine singleton ─────────────────────────────────────────────────
// Lazy-loaded so the SDK only bundles when the stage actually mounts.
let _zegoEngine = null;

async function getZegoEngine() {
  if (_zegoEngine) return _zegoEngine;
  const { ZegoExpressEngine } = await import('zego-express-engine-webrtc');
  const appId  = Number(import.meta.env.VITE_ZEGO_APP_ID || 0);
  const server = import.meta.env.VITE_ZEGO_SERVER || '';
  if (!appId || !server) {
    console.warn('[LiveStage] VITE_ZEGO_APP_ID / VITE_ZEGO_SERVER not configured — stage disabled');
    return null;
  }
  _zegoEngine = new ZegoExpressEngine(appId, server);
  return _zegoEngine;
}

// Stream ID convention: `{roomId}_{userId}_{type}` (camera | screen)
function makeStreamId(roomId, userId, type) {
  return `${roomId}_${userId}_${type}`;
}

// ─── useLiveStage ──────────────────────────────────────────────────────────
/**
 * Core SFU lifecycle hook. Manages:
 *   - ZEGO loginRoom + optional publish (panelists only)
 *   - roomStreamUpdate: subscribe remote MediaStreams from SFU
 *   - networkQuality: 'good' / 'warning' / 'poor' with toast on degradation
 *   - roomUserUpdate: viewer count badge
 *   - IMRecvBroadcastMessage: incoming chat messages
 *   - IMRecvCustomCommand: incoming emoji reactions
 *   - upgradeToParticipant(): viewer → panelist at runtime
 *   - sendChat() / sendReaction(): outgoing data channel messages
 */
export function useLiveStage({ roomId, userId, userName, role, token }) {
  const [localStream,   setLocalStream]   = useState(null);
  const [remoteStreams, setRemoteStreams]  = useState([]); // [{ streamId, userId, userName, stream, type }]
  const [screenShare,   setScreenShare]   = useState(null);
  const [micOn,         setMicOn]         = useState(true);
  const [camOn,         setCamOn]         = useState(true);
  const [quality,       setQuality]       = useState('good');
  const [viewerCount,   setViewerCount]   = useState(0);
  const [viewers,       setViewers]       = useState([]); // [{ userID, userName }] — from roomUserUpdate
  const [chatMessages,  setChatMessages]  = useState([]);
  const [lastReaction,  setLastReaction]  = useState(null); // { id, emoji, fromUser }
  const [isPublishing,  setIsPublishing]  = useState(role === 'panelist');
  const [activeSpeakerId, setActiveSpeakerId] = useState(null); // userId of loudest speaker

  const engineRef    = useRef(null);
  const publishedRef = useRef(false);
  const reactionSeq  = useRef(0);

  useEffect(() => {
    if (!roomId || !userId || !token) return;
    let mounted = true;

    (async () => {
      const engine = await getZegoEngine();
      if (!engine || !mounted) return;
      engineRef.current = engine;

      // ── 1. Remote stream events from SFU ──────────────────────────────
      // The SFU notifies when any publisher starts/stops. We call
      // startPlayingStream() so ZEGO delivers the MediaStream to us;
      // that stream is then attached to a <video> srcObject in VideoTile.
      engine.on('roomStreamUpdate', async (rId, updateType, streamList) => {
        if (rId !== roomId || !mounted) return;

        if (updateType === 'ADD') {
          for (const s of streamList) {
            const parts     = s.streamID.split('_');
            const pubUserId = parts[1];
            const type      = parts[2] || 'camera';
            if (pubUserId === userId) continue; // skip own stream echo

            const mediaStream = await engine.startPlayingStream(s.streamID);
            if (!mounted) { engine.stopPlayingStream(s.streamID); return; }

            setRemoteStreams(prev => {
              const deduped = prev.filter(r => r.streamId !== s.streamID);
              return [...deduped, {
                streamId: s.streamID,
                userId:   pubUserId,
                userName: s.extraInfo || pubUserId,
                stream:   mediaStream,
                type,
              }];
            });

            // Track screen share separately to trigger 70/30 layout switch
            if (type === 'screen') {
              setScreenShare({ streamId: s.streamID, stream: mediaStream, userId: pubUserId, local: false });
            }
          }
        }

        if (updateType === 'DELETE') {
          for (const s of streamList) {
            engine.stopPlayingStream(s.streamID);
            setRemoteStreams(prev => prev.filter(r => r.streamId !== s.streamID));
            setScreenShare(prev => prev?.streamId === s.streamID ? null : prev);
          }
        }
      });

      // ── 2. Network quality → adaptive degradation ─────────────────────
      // ZEGO scores 0–5; we map to three labels and notify on poor quality.
      engine.on('networkQuality', (uid, _up, down) => {
        if (uid !== userId) return;
        const q = down >= 4 ? 'good' : down >= 2 ? 'warning' : 'poor';
        setQuality(prev => {
          if (prev !== 'poor' && q === 'poor') {
            toast.warning('Weak connection — video quality auto-reduced by SFU.');
          }
          return q;
        });
      });

      // ── 3. Viewer count + list via roomUserUpdate ─────────────────────
      // SFU fires this when any user joins or leaves the room.
      // We track the full viewer list so we can render avatar strips.
      engine.on('roomUserUpdate', (rId, updateType, userList) => {
        if (rId !== roomId) return;
        if (updateType === 'ADD') {
          setViewers(prev => {
            const ids = new Set(prev.map(u => u.userID));
            const fresh = userList.filter(u => !ids.has(u.userID));
            return [...prev, ...fresh];
          });
          setViewerCount(prev => prev + userList.length);
        } else {
          const leaveIds = new Set(userList.map(u => u.userID));
          setViewers(prev => prev.filter(u => !leaveIds.has(u.userID)));
          setViewerCount(prev => Math.max(0, prev - userList.length));
        }
      });

      // ── 4. Data channel: broadcast chat messages ──────────────────────
      engine.on('IMRecvBroadcastMessage', (rId, chatData) => {
        if (rId !== roomId || !mounted) return;
        setChatMessages(prev => [
          ...prev.slice(-199),
          ...chatData.map(c => ({
            id:       `${c.fromUser.userID}_${c.sendTime}`,
            userId:   c.fromUser.userID,
            userName: c.fromUser.userName,
            text:     c.message,
            time:     c.sendTime,
            local:    false,
          })),
        ]);
      });

      // ── 5. Data channel: emoji reactions ─────────────────────────────
      // Custom commands carry JSON {type:"reaction", emoji:"🔥"} payloads.
      engine.on('IMRecvCustomCommand', (rId, fromUser, command) => {
        if (rId !== roomId || !mounted) return;
        try {
          const payload = JSON.parse(command);
          if (payload.type === 'reaction') {
            setLastReaction({ id: ++reactionSeq.current, emoji: payload.emoji, fromUser: fromUser.userName });
          }
        } catch { /* malformed payload — ignore */ }
      });

      // ── 6. Login room ─────────────────────────────────────────────────
      await engine.loginRoom(roomId, token, { userID: userId, userName });

      // ── 6a. Sound level monitor → Stage/Others auto-spotlight ─────────
      // streamID format: {roomId}_{userId}_{type}; parts[1] is the userId.
      engine.startSoundLevelMonitor(500);
      engine.on('soundLevelUpdate', (soundLevelList) => {
        if (!mounted) return;
        const loudest = [...(soundLevelList || [])]
          .filter(s => s.soundLevel > 15)
          .sort((a, b) => b.soundLevel - a.soundLevel)[0];
        if (loudest) {
          const parts = loudest.streamID.split('_');
          if (parts.length >= 3) setActiveSpeakerId(parts[1]);
        }
      });

      // ── 7. Panelist: create + publish camera stream ───────────────────
      // Viewers never reach this block — zero getUserMedia for viewers.
      if (role === 'panelist') {
        try {
          const local = await engine.createZegoStream({ camera: { video: true, audio: true } });
          if (!mounted) { engine.destroyStream(local); return; }
          setLocalStream(local);
          engine.startPublishingStream(makeStreamId(roomId, userId, 'camera'), local, { extraInfo: userName });
          publishedRef.current = true;
          setIsPublishing(true);
        } catch (e) {
          toast.error('Camera/mic access denied — check permissions.');
        }
      }
    })();

    return () => {
      mounted = false;
      (async () => {
        const engine = engineRef.current;
        if (!engine) return;
        if (publishedRef.current) {
          engine.stopPublishingStream(makeStreamId(roomId, userId, 'camera'));
          engine.stopPublishingStream(makeStreamId(roomId, userId, 'screen'));
          publishedRef.current = false;
        }
        engine.stopSoundLevelMonitor();
        engine.off('soundLevelUpdate');
        engine.off('roomStreamUpdate');
        engine.off('networkQuality');
        engine.off('roomUserUpdate');
        engine.off('IMRecvBroadcastMessage');
        engine.off('IMRecvCustomCommand');
        await engine.logoutRoom(roomId);
      })();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, token]);

  // ── Mic / camera toggles ───────────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (!localStream || !engineRef.current) return;
    const next = !micOn;
    engineRef.current.muteMicrophone(!next);
    setMicOn(next);
  }, [localStream, micOn]);

  const toggleCam = useCallback(() => {
    if (!localStream || !engineRef.current) return;
    const next = !camOn;
    engineRef.current.mutePublishStreamVideo(!next);
    setCamOn(next);
  }, [localStream, camOn]);

  // ── Screen share ───────────────────────────────────────────────────
  const startScreenShare = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine || !isPublishing) return;
    try {
      const ss  = await engine.createZegoStream({ screen: { audio: false } });
      const ssId = makeStreamId(roomId, userId, 'screen');
      engine.startPublishingStream(ssId, ss, { extraInfo: `${userName}_screen` });
      setScreenShare({ streamId: ssId, stream: ss, userId, local: true });
    } catch {
      toast.error('Screen share permission denied.');
    }
  }, [roomId, userId, userName, isPublishing]);

  const stopScreenShare = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.stopPublishingStream(makeStreamId(roomId, userId, 'screen'));
    setScreenShare(null);
  }, [roomId, userId]);

  // ── Instant co-hosting: viewer → panelist without reload ───────────
  const upgradeToParticipant = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine || isPublishing) return;
    try {
      const local = await engine.createZegoStream({ camera: { video: true, audio: true } });
      setLocalStream(local);
      engine.startPublishingStream(makeStreamId(roomId, userId, 'camera'), local, { extraInfo: userName });
      publishedRef.current = true;
      setIsPublishing(true);
      toast.success('You are now on stage!');
    } catch {
      toast.error('Camera/mic access denied — cannot join stage.');
    }
  }, [roomId, userId, userName, isPublishing]);

  // ── Data channel: send chat message ───────────────────────────────
  const sendChat = useCallback(async (text) => {
    const engine = engineRef.current;
    if (!engine || !text.trim()) return;
    await engine.sendBroadcastMessage(roomId, text.trim());
    // Optimistically show own message locally
    setChatMessages(prev => [...prev.slice(-199), {
      id:       `${userId}_local_${Date.now()}`,
      userId,
      userName,
      text:     text.trim(),
      time:     Date.now(),
      local:    true,
    }]);
  }, [roomId, userId, userName]);

  // ── Data channel: send emoji reaction ─────────────────────────────
  const sendReaction = useCallback(async (emoji) => {
    const engine = engineRef.current;
    if (!engine) return;
    const payload = JSON.stringify({ type: 'reaction', emoji });
    // Empty list broadcasts to all room participants
    await engine.sendCustomCommand(roomId, payload, []);
    // Show own reaction locally immediately
    setLastReaction({ id: ++reactionSeq.current, emoji, fromUser: userName, local: true });
  }, [roomId, userName]);

  return {
    localStream, remoteStreams, screenShare,
    micOn, camOn, quality, viewerCount, viewers,
    chatMessages, lastReaction,
    isPublishing, activeSpeakerId,
    toggleMic, toggleCam,
    startScreenShare, stopScreenShare,
    upgradeToParticipant,
    sendChat, sendReaction,
  };
}

// ─── VideoTile ─────────────────────────────────────────────────────────────
/**
 * Maps a ZEGO SFU MediaStream to a <video> srcObject.
 * The SFU delivers each encoded track; assigning stream → srcObject
 * is the critical bridge from network transport to DOM rendering.
 */
function VideoTile({ stream, label, isMuted, isCamOff, isPinned, onPin, isLocal, quality, giftTotal }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    // Attach SFU track bundle to video element
    el.srcObject = stream || null;
    if (stream) el.play().catch(() => {});
    return () => { el.srcObject = null; };
  }, [stream]);

  const qualityColor = quality === 'good' ? GREEN : quality === 'warning' ? GOLD : RED;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden group" style={{ background: BG, border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* SFU video output — muted on local to prevent echo */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isCamOff ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Camera-off avatar placeholder */}
      {isCamOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: BG }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-2xl font-black text-white/25" style={{ fontFamily: FONT }}>
              {(label || '?')[0].toUpperCase()}
            </span>
          </div>
          <VideoOff className="w-4 h-4 text-white/15" />
        </div>
      )}

      {/* Bottom gradient: name + status */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end gap-2 p-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
        <span className="text-white text-xs font-bold flex-1 truncate" style={{ fontFamily: FONT }}>
          {label}{isLocal ? ' (You)' : ''}
        </span>
        {/* SFU downlink quality dot */}
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: qualityColor }} title={`Network: ${quality}`} />
        {/* Per-seat gift total — real-time DB aggregate */}
        {giftTotal > 0 && (
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.35)', color: GOLD, fontFamily: FONT }}>
            🎁 {giftTotal}
          </span>
        )}
        {/* Muted badge */}
        {isMuted && (
          <span className="flex items-center gap-1 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(192,57,43,0.85)', fontFamily: FONT }}>
            <MicOff className="w-2.5 h-2.5" /> Muted
          </span>
        )}
      </div>

      {/* LIVE badge — local publisher only */}
      {isLocal && (
        <div className="absolute top-2 left-2 flex items-center gap-1 text-white text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(128,0,32,0.85)', border: '1px solid rgba(128,0,32,0.6)', fontFamily: FONT }}>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </div>
      )}

      {/* Pin button — appears on hover */}
      {onPin && (
        <button
          onClick={onPin}
          className={`absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all
            ${isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          style={{
            background: isPinned ? 'rgba(212,175,55,0.2)' : 'rgba(0,0,0,0.5)',
            border: `1px solid ${isPinned ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.15)'}`,
          }}
        >
          <Pin className="w-3.5 h-3.5" style={{ color: isPinned ? GOLD : 'rgba(255,255,255,0.6)' }} />
        </button>
      )}
    </div>
  );
}

// ─── Dynamic grid class ────────────────────────────────────────────────────
function gridClass(count) {
  if (count === 1)  return 'grid-cols-1';
  if (count === 2)  return 'grid-cols-2';
  if (count <= 4)   return 'grid-cols-2 grid-rows-2';
  return 'grid-cols-3';
}

// ─── FloatingReaction ──────────────────────────────────────────────────────
// Animated emoji that floats upward and fades — triggered by data channel events.
function FloatingReaction({ reaction, onDone }) {
  // Deterministically vary horizontal position using reaction ID
  const leftPct = 10 + (reaction.id % 9) * 9;
  return (
    <motion.div
      className="absolute pointer-events-none select-none text-2xl z-10"
      style={{ bottom: 64, left: `${leftPct}%` }}
      initial={{ y: 0, opacity: 1, scale: 0.8 }}
      animate={{ y: -90, opacity: 0, scale: 1.3 }}
      transition={{ duration: 2.2, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      {reaction.emoji}
    </motion.div>
  );
}

// ─── ChatPanel ─────────────────────────────────────────────────────────────
// Data-channel backed live chat. Slides in from the right of the stage.
function ChatPanel({ messages, onSend, onClose }) {
  const [input,   setInput]  = useState('');
  const bottomRef            = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  }

  return (
    <motion.div
      className="flex flex-col shrink-0 w-64 min-h-0 overflow-hidden"
      style={{ background: 'rgba(8,11,24,0.97)', borderLeft: '1px solid rgba(212,175,55,0.12)' }}
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 256, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 200 }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="text-[11px] font-black uppercase tracking-widest" style={{ fontFamily: FONT, color: GOLD }}>
          Live Chat
        </span>
        <button onClick={onClose} className="transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-xs mt-8" style={{ fontFamily: FONT, color: 'rgba(255,255,255,0.2)' }}>
            No messages yet — say hi! 👋
          </p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.local ? 'items-end' : 'items-start'}`}>
            <span className="text-[9px] mb-0.5" style={{ fontFamily: FONT, color: 'rgba(255,255,255,0.3)' }}>
              {msg.userName}
            </span>
            <div
              className="max-w-[90%] px-2.5 py-1.5 rounded-xl text-[11px]"
              style={{
                background:  msg.local ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)',
                border:      `1px solid ${msg.local ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.08)'}`,
                color:       'rgba(255,255,255,0.82)',
                fontFamily:  FONT,
                wordBreak:   'break-word',
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="shrink-0 p-2 flex items-center gap-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Say something…"
          className="flex-1 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontFamily: FONT }}
        />
        <button
          onClick={handleSend}
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
          style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.28)' }}
        >
          <Send className="w-3 h-3" style={{ color: GOLD }} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── LiveStage (main export) ───────────────────────────────────────────────
export default function LiveStage({ roomId, userId, userName, role = 'viewer', token }) {
  const {
    localStream, remoteStreams, screenShare,
    micOn, camOn, quality, viewerCount, viewers,
    chatMessages, lastReaction,
    isPublishing, activeSpeakerId,
    toggleMic, toggleCam,
    startScreenShare, stopScreenShare,
    upgradeToParticipant,
    sendChat, sendReaction,
  } = useLiveStage({ roomId, userId, userName, role, token });

  const [pinnedId,          setPinnedId]          = useState(null);
  const [showChat,          setShowChat]          = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);

  // Per-seat gift totals keyed by userId — polled every 15s
  const { data: giftRows = [] } = useQuery({
    queryKey: ['stage-gifts', roomId],
    queryFn:  () => base44.entities.Transaction.filter({ room_id: roomId }),
    enabled:  !!roomId,
    refetchInterval: 15000,
    staleTime: 10000,
  });
  const giftTotals = useMemo(() =>
    giftRows.reduce((acc, row) => {
      if (row.user_id) acc[row.user_id] = (acc[row.user_id] || 0) + (row.amount || 0);
      return acc;
    }, {}),
  [giftRows]);

  // Build floating reaction list from incoming lastReaction events
  useEffect(() => {
    if (!lastReaction) return;
    setFloatingReactions(prev => [...prev.slice(-15), lastReaction]);
  }, [lastReaction]);

  function removeReaction(id) {
    setFloatingReactions(prev => prev.filter(r => r.id !== id));
  }

  const togglePin = useCallback((id) => {
    setPinnedId(prev => prev === id ? null : id);
  }, []);

  // All camera tiles: local panelist first, then remotes
  const cameraTiles = useMemo(() => {
    const tiles = [];
    if (isPublishing && localStream) {
      tiles.push({ id: `local_${userId}`, userId, stream: localStream, label: userName, isLocal: true, isMuted: !micOn, isCamOff: !camOn });
    }
    for (const r of remoteStreams) {
      if (r.type !== 'camera') continue;
      tiles.push({ id: r.streamId, userId: r.userId, stream: r.stream, label: r.userName, isLocal: false, isMuted: false, isCamOff: false });
    }
    return tiles;
  }, [isPublishing, localStream, remoteStreams, userId, userName, micOn, camOn]);

  // Resolve display name of active speaker for the header indicator
  // Must be after cameraTiles to avoid TDZ reference errors
  const activeSpeakerLabel = useMemo(() => {
    if (!activeSpeakerId) return null;
    const tile = cameraTiles.find(t => t.userId === activeSpeakerId);
    return tile ? tile.label : null;
  }, [activeSpeakerId, cameraTiles]);

  // ── Screen share: 70/30 split layout ──────────────────────────────
  const stageContent = (() => {
    if (screenShare) {
      return (
        <div className="flex-1 flex gap-2 min-h-0">
          <div className="flex-[7] min-w-0 min-h-0">
            <VideoTile
              stream={screenShare.stream}
              label={screenShare.local
                ? `${userName}'s Screen`
                : `${remoteStreams.find(r => r.userId === screenShare.userId)?.userName || 'Guest'}'s Screen`}
              isMuted={false} isCamOff={false} quality={quality}
            />
          </div>
          <div className="flex-[3] flex flex-col gap-2 min-h-0 overflow-y-auto">
            {cameraTiles.map(tile => (
              <div key={tile.id} className="flex-1 min-h-0">
                <VideoTile {...tile} isPinned={pinnedId === tile.id} onPin={() => togglePin(tile.id)} quality={quality} giftTotal={giftTotals[tile.userId] || 0} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Pinned tile: one dominant, rest in sidebar
    const pinnedTile = pinnedId ? cameraTiles.find(t => t.id === pinnedId) : null;
    if (pinnedTile && cameraTiles.length > 1) {
      const rest = cameraTiles.filter(t => t.id !== pinnedId);
      return (
        <div className="flex-1 flex gap-2 min-h-0">
          <div className="flex-[7] min-w-0 min-h-0">
            <VideoTile {...pinnedTile} isPinned onPin={() => togglePin(pinnedTile.id)} quality={quality} giftTotal={giftTotals[pinnedTile.userId] || 0} />
          </div>
          <div className="flex-[3] flex flex-col gap-2 min-h-0 overflow-y-auto">
            {rest.map(tile => (
              <div key={tile.id} className="flex-1 min-h-0">
                <VideoTile {...tile} onPin={() => togglePin(tile.id)} quality={quality} giftTotal={giftTotals[tile.userId] || 0} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Stage / Others split: 5+ panelists with no explicit pin or screen share.
    // Auto-spotlights the loudest speaker (soundLevelUpdate); others collapse to
    // a compact horizontal strip. Click any strip tile to pin them to spotlight.
    if (cameraTiles.length >= 5) {
      const spotlightTile = cameraTiles.find(t => t.userId === activeSpeakerId) || cameraTiles[0];
      const otherTiles    = cameraTiles.filter(t => t !== spotlightTile);
      return (
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="flex-1 min-h-0">
            <VideoTile
              {...spotlightTile}
              isPinned={false}
              onPin={() => togglePin(spotlightTile.id)}
              quality={quality}
              giftTotal={giftTotals[spotlightTile.userId] || 0}
            />
          </div>
          {/* Others strip — horizontal scroll, no scrollbar */}
          <div
            className="shrink-0 flex gap-1.5 overflow-x-auto"
            style={{ height: 88, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {otherTiles.map(tile => (
              <div
                key={tile.id}
                className="shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all"
                style={{
                  width:  120,
                  height: 88,
                  border: tile.userId === activeSpeakerId
                    ? `2px solid ${GOLD}`
                    : '1px solid rgba(255,255,255,0.08)',
                  transition: 'border-color 0.3s',
                }}
                onClick={() => togglePin(tile.id)}
                title={`Pin ${tile.label}`}
              >
                <VideoTile {...tile} onPin={null} quality={quality} giftTotal={giftTotals[tile.userId] || 0} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Standard dynamic grid (≤4 tiles)
    const showRequestSlot = !isPublishing && cameraTiles.length > 0 && cameraTiles.length < 9;
    const totalSlots = cameraTiles.length + (showRequestSlot ? 1 : 0);
    return (
      <div className={`flex-1 grid gap-2 min-h-0 ${gridClass(totalSlots)}`}>
        <AnimatePresence>
          {cameraTiles.map(tile => (
            <motion.div
              key={tile.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="min-h-0 min-w-0"
            >
              <VideoTile {...tile} isPinned={pinnedId === tile.id} onPin={() => togglePin(tile.id)} quality={quality} giftTotal={giftTotals[tile.userId] || 0} />
            </motion.div>
          ))}

          {/* "+ Request to Join" slot — TikTok LIVE / BIGO style */}
          {showRequestSlot && (
            <motion.div
              key="request-slot"
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="min-h-0 min-w-0"
            >
              <button
                onClick={upgradeToParticipant}
                className="w-full h-full flex flex-col items-center justify-center rounded-xl transition-all group"
                style={{
                  background: 'rgba(212,175,55,0.03)',
                  border: '1.5px dashed rgba(212,175,55,0.25)',
                  minHeight: 80,
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all group-hover:scale-110"
                  style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}
                >
                  <span className="text-xl" style={{ color: GOLD }}>+</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ fontFamily: FONT, color: 'rgba(212,175,55,0.6)' }}>
                  Request to Join
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty stage placeholder */}
        {cameraTiles.length === 0 && (
          <div className="col-span-full row-span-full flex flex-col items-center justify-center rounded-xl" style={{ background: BG, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Radio className="w-10 h-10 mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-sm font-bold" style={{ fontFamily: FONT, color: 'rgba(255,255,255,0.2)' }}>
              {isPublishing ? 'Starting your camera…' : 'Waiting for the show to start'}
            </p>
            {!isPublishing && (
              <button
                onClick={upgradeToParticipant}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase text-xs transition-all"
                style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)', color: GOLD, fontFamily: FONT }}
              >
                <Zap className="w-3.5 h-3.5" /> Go on Stage
              </button>
            )}
          </div>
        )}
      </div>
    );
  })();

  return (
    <div className="w-full h-full flex min-h-0" style={{ fontFamily: FONT }}>

      {/* ── Main stage column ── */}
      <div className="flex-1 flex flex-col gap-2 min-h-0 min-w-0 relative">

        {/* Top status bar */}
        <div className="flex items-center gap-2 shrink-0 px-1 flex-wrap">
          {/* Viewer count — SFU roomUserUpdate */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Users className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {viewerCount + cameraTiles.length}
            </span>
          </div>

          {/* Stage capacity: N/20 */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)' }}>
            <Radio className="w-3 h-3" style={{ color: GOLD }} />
            <span className="text-[10px] font-bold" style={{ color: GOLD }}>
              Stage {cameraTiles.length}/20
            </span>
          </div>

          {/* "X is speaking" live indicator */}
          <AnimatePresence mode="wait">
            {activeSpeakerLabel && (
              <motion.div
                key={activeSpeakerLabel}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                style={{ background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.22)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GREEN }} />
                <span className="text-[10px] font-bold truncate max-w-[100px]" style={{ color: GREEN }}>
                  {activeSpeakerLabel} speaking
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Network quality */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Wifi className="w-3 h-3" style={{ color: quality === 'good' ? GREEN : quality === 'warning' ? GOLD : RED }} />
            <span className="text-[10px] font-bold" style={{ color: quality === 'good' ? GREEN : quality === 'warning' ? GOLD : RED }}>
              {quality === 'good' ? 'Good' : quality === 'warning' ? 'Weak' : 'Poor'}
            </span>
          </div>

          <div className="flex-1" />

          {/* Chat toggle */}
          <button
            onClick={() => setShowChat(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all"
            style={{
              background: showChat ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
              border:     `1px solid ${showChat ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <MessageSquare className="w-3.5 h-3.5" style={{ color: showChat ? GOLD : 'rgba(255,255,255,0.4)' }} />
            {chatMessages.length > 0 && (
              <span className="text-[10px] font-bold" style={{ color: GOLD }}>{chatMessages.length}</span>
            )}
          </button>
        </div>

        {/* Video grid / layouts */}
        {stageContent}

        {/* Floating emoji reactions — data channel driven */}
        <AnimatePresence>
          {floatingReactions.map(r => (
            <FloatingReaction key={r.id} reaction={r} onDone={() => removeReaction(r.id)} />
          ))}
        </AnimatePresence>

        {/* ── Bottom controls ── */}
        <div className="shrink-0 flex items-center justify-center gap-2 pb-1 flex-wrap">
          {/* Panelist controls */}
          {isPublishing && (
            <>
              <StageBtn icon="mic"    active={micOn} danger={!micOn} label={micOn ? 'Mute' : 'Unmute'} onClick={toggleMic} />
              <StageBtn icon="cam"    active={camOn} danger={!camOn} label={camOn ? 'Stop Cam' : 'Start Cam'} onClick={toggleCam} />
              {screenShare?.local
                ? <StageBtn icon="screen-off" danger label="Stop Share" onClick={stopScreenShare} />
                : <StageBtn icon="screen"            label="Share Screen" onClick={startScreenShare} />
              }
            </>
          )}

          {/* Viewer upgrade button — shown when not yet publishing */}
          {!isPublishing && (
            <button
              onClick={upgradeToParticipant}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-xs transition-all"
              style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)', color: GOLD }}
            >
              <Zap className="w-3.5 h-3.5" />
              Go on Stage
            </button>
          )}

          {/* Emoji reaction bar — all users */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="text-base leading-none px-1 py-0.5 rounded-lg transition-all hover:scale-125 active:scale-110"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* "Others watching" viewer avatar strip — Fanbase/Chatter style */}
        {viewers.length > 0 && (
          <div className="shrink-0 flex items-center gap-1.5 px-1 pb-0.5">
            <span className="text-[9px] font-bold shrink-0" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: FONT }}>
              Watching
            </span>
            <div className="flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {viewers.slice(0, 20).map((v, i) => (
                <div
                  key={v.userID}
                  title={v.userName || v.userID}
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[8px] font-black"
                  style={{
                    background: `hsl(${(v.userID.charCodeAt(0) * 47) % 360}, 45%, 28%)`,
                    border: '1px solid rgba(255,255,255,0.1)',
                    marginLeft: i === 0 ? 0 : -4,
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: FONT,
                    zIndex: 20 - i,
                    position: 'relative',
                  }}
                >
                  {(v.userName || v.userID || '?')[0].toUpperCase()}
                </div>
              ))}
              {viewers.length > 20 && (
                <span className="text-[9px] font-bold ml-2 shrink-0" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: FONT }}>
                  +{viewers.length - 20}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Chat panel (slides in from right) ── */}
      <AnimatePresence>
        {showChat && (
          <ChatPanel
            messages={chatMessages}
            onSend={sendChat}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// ─── StageBtn ──────────────────────────────────────────────────────────────
function StageBtn({ icon, label, onClick, active = true, danger = false }) {
  const icons = {
    'mic': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8"  y1="23" x2="16" y2="23"/>
      </svg>
    ),
    'mic-off':    <MicOff    className="w-4 h-4" />,
    'cam': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    'cam-off':    <VideoOff  className="w-4 h-4" />,
    'screen': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8"  y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    'screen-off': <MonitorOff className="w-4 h-4" />,
  };

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-bold"
      style={{
        fontFamily: FONT,
        background: danger ? 'rgba(192,57,43,0.14)' : 'rgba(255,255,255,0.05)',
        border:     `1px solid ${danger ? 'rgba(192,57,43,0.3)' : 'rgba(255,255,255,0.1)'}`,
        color:      danger ? RED : 'rgba(255,255,255,0.6)',
      }}
    >
      {icons[icon] ?? null}
      {label}
    </button>
  );
}
