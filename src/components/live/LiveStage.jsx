/**
 * LiveStage.jsx — SFU-backed dynamic live-streaming stage for SeeWhy LIVE.
 *
 * Roles:
 *   "panelist"  — publishes camera+audio; sees all other panelists. Sub-100ms via SFU uplink.
 *   "viewer"    — subscribes only; no getUserMedia call, no camera permission prompt.
 *
 * Layout rules:
 *   1 panelist  → full-screen (grid-cols-1)
 *   2 panelists → side-by-side (grid-cols-2)
 *   3–4         → 2×2 grid
 *   5+          → 3-column grid
 *   Screen share active → 70/30 split: screen dominant left, webcam sidebar right
 *
 * SFU integration: ZEGOCLOUD ZegoExpressEngine via @/lib/zegoEngine singleton.
 * Tracks published/subscribed as ZEGO stream IDs: `{roomId}_{userId}_{type}`.
 *
 * Usage:
 *   <LiveStage
 *     roomId="abc123"
 *     userId="user_456"
 *     userName="Alice"
 *     role="panelist"          // "panelist" | "viewer"
 *     token={zegoToken}        // obtained server-side via ZEGO token API
 *   />
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicOff, VideoOff, MonitorOff, Maximize2, Pin, Users, Radio, Wifi } from 'lucide-react';

// ─── ZEGO Engine singleton ─────────────────────────────────────────────────
// Lazy-loaded so the heavy SDK is only bundled when the stage actually mounts.
let _engine = null;

async function getZegoEngine() {
  if (_engine) return _engine;
  const { ZegoExpressEngine } = await import('zego-express-engine-webrtc');
  const appId  = Number(import.meta.env.VITE_ZEGO_APP_ID || 0);
  const server = import.meta.env.VITE_ZEGO_SERVER || '';
  if (!appId || !server) {
    console.warn('[LiveStage] VITE_ZEGO_APP_ID / VITE_ZEGO_SERVER not set — using mock engine');
    return null;
  }
  _engine = new ZegoExpressEngine(appId, server);
  return _engine;
}

// Stream ID convention: `{roomId}_{userId}_{type}`
function streamId(roomId, userId, type) {
  return `${roomId}_${userId}_${type}`;
}

// ─── Custom hook: useLiveStage ─────────────────────────────────────────────
/**
 * Manages ZEGO room lifecycle:
 *   - Joins room + logs in user
 *   - Publishes camera/audio for panelists (never for viewers)
 *   - Subscribes to remote streams as they arrive
 *   - Tracks screen-share stream separately
 *   - Cleans up on unmount
 *
 * Returns { localStream, remoteStreams, screenShareStream, toggleMic, toggleCam, startScreenShare, stopScreenShare, quality }
 */
export function useLiveStage({ roomId, userId, userName, role, token }) {
  const [localStream, setLocalStream]         = useState(null);
  const [remoteStreams, setRemoteStreams]      = useState([]); // [{ userId, userName, stream, type }]
  const [screenShareStream, setScreenShare]   = useState(null);
  const [micOn, setMicOn]                     = useState(true);
  const [camOn, setCamOn]                     = useState(true);
  const [quality, setQuality]                 = useState('good'); // 'good' | 'warning' | 'poor'
  const engineRef                             = useRef(null);
  const publishedRef                          = useRef(false);

  const isPanelist = role === 'panelist';

  // Join room and set up event listeners
  useEffect(() => {
    if (!roomId || !userId || !token) return;
    let mounted = true;

    (async () => {
      const engine = await getZegoEngine();
      if (!engine || !mounted) return;
      engineRef.current = engine;

      // ── Subscribe to remote stream events ─────────────────────────
      // The SFU notifies us when any publisher starts/stops; we pull
      // the MediaStream via startPlayingStream and attach it to a <video>.

      engine.on('roomStreamUpdate', async (rId, updateType, streamList) => {
        if (rId !== roomId || !mounted) return;

        if (updateType === 'ADD') {
          for (const s of streamList) {
            // Decode stream ID to extract publisher identity
            const [, pubUserId, type] = s.streamID.split('_');
            if (pubUserId === userId) continue; // skip own stream echo

            // Ask ZEGO SFU to start delivering this stream to us
            const mediaStream = await engine.startPlayingStream(s.streamID);
            if (!mounted) { engine.stopPlayingStream(s.streamID); return; }

            setRemoteStreams(prev => {
              const filtered = prev.filter(r => r.streamId !== s.streamID);
              return [...filtered, {
                streamId: s.streamID,
                userId: pubUserId,
                userName: s.extraInfo || pubUserId,
                stream: mediaStream,
                type: type || 'camera',
              }];
            });

            // Track screen shares separately for the 70/30 layout switch
            if (type === 'screen') {
              setScreenShare({ streamId: s.streamID, stream: mediaStream, userId: pubUserId });
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

      // ── Quality monitoring ─────────────────────────────────────────
      // ZEGO emits network quality scores 0–5; map to human label.
      engine.on('networkQuality', (uid, _up, down) => {
        if (uid === userId) {
          setQuality(down >= 4 ? 'good' : down >= 2 ? 'warning' : 'poor');
        }
      });

      // ── Login + optional publish ───────────────────────────────────
      await engine.loginRoom(roomId, token, { userID: userId, userName });

      if (isPanelist) {
        // Capture local camera+audio. Viewers never reach this branch.
        const local = await engine.createZegoStream({ camera: { video: true, audio: true } });
        if (!mounted) { engine.destroyStream(local); return; }
        setLocalStream(local);

        // One uplink per user — the SFU handles all subscriber downlinks.
        const camStreamId = streamId(roomId, userId, 'camera');
        engine.startPublishingStream(camStreamId, local, { extraInfo: userName });
        publishedRef.current = true;
      }
    })();

    return () => {
      mounted = false;
      (async () => {
        const engine = engineRef.current;
        if (!engine) return;
        if (publishedRef.current) {
          engine.stopPublishingStream(streamId(roomId, userId, 'camera'));
          engine.stopPublishingStream(streamId(roomId, userId, 'screen'));
        }
        if (localStream) engine.destroyStream(localStream);
        engine.off('roomStreamUpdate');
        engine.off('networkQuality');
        await engine.logoutRoom(roomId);
      })();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, token, isPanelist]);

  // ── Mic / camera toggle ────────────────────────────────────────────
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
    if (!engine || !isPanelist) return;
    const screenStream = await engine.createZegoStream({ screen: { audio: false } });
    const ssId = streamId(roomId, userId, 'screen');
    engine.startPublishingStream(ssId, screenStream, { extraInfo: `${userName}_screen` });
    setScreenShare({ streamId: ssId, stream: screenStream, userId, local: true });
  }, [roomId, userId, userName, isPanelist]);

  const stopScreenShare = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.stopPublishingStream(streamId(roomId, userId, 'screen'));
    setScreenShare(null);
  }, [roomId, userId]);

  return { localStream, remoteStreams, screenShareStream, micOn, camOn, toggleMic, toggleCam, startScreenShare, stopScreenShare, quality };
}

// ─── VideoTile ─────────────────────────────────────────────────────────────
/**
 * Attaches a MediaStream to a <video> element.
 * The SFU delivers each track individually — we map stream → srcObject here.
 */
function VideoTile({ stream, label, isMuted, isCamOff, isPinned, onPin, isLocal, quality }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;
    // Attach SFU track to DOM — this is the critical bridge from ZEGO stream → HTML video
    el.srcObject = stream;
    el.play().catch(() => {});
    return () => { el.srcObject = null; };
  }, [stream]);

  const qualityColor = quality === 'good' ? '#6DBF7E' : quality === 'warning' ? '#D4AF37' : '#C0392B';

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#080B18] border border-white/5 group">
      {/* SFU video track output */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // local preview always muted to avoid echo
        className={`w-full h-full object-cover transition-opacity ${isCamOff ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Camera-off placeholder */}
      {isCamOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080B18]">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2">
            <span className="text-2xl font-black text-white/30" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              {(label || '?')[0].toUpperCase()}
            </span>
          </div>
          <VideoOff className="w-4 h-4 text-white/20" />
        </div>
      )}

      {/* Bottom overlay: name + status badges */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2 flex items-end gap-2">
        <span className="text-white text-xs font-bold flex-1 truncate" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          {label}{isLocal && ' (You)'}
        </span>

        {/* Network quality dot — reflects SFU downlink score */}
        <div className="w-2 h-2 rounded-full" style={{ background: qualityColor }} title={`Network: ${quality}`} />

        {/* Muted overlay badge */}
        {isMuted && (
          <span className="flex items-center gap-1 bg-[#C0392B]/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            <MicOff className="w-2.5 h-2.5" /> Muted
          </span>
        )}
      </div>

      {/* Pin button — appears on hover */}
      {onPin && (
        <button
          onClick={onPin}
          className={`absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all
            ${isPinned ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/40 opacity-100' : 'bg-black/40 border border-white/10 opacity-0 group-hover:opacity-100'}`}
        >
          <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-[#D4AF37]' : 'text-white/60'}`} />
        </button>
      )}

      {/* LIVE badge for local publisher */}
      {isLocal && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#800020]/80 border border-[#800020]/60 text-white text-[9px] font-black px-2 py-0.5 rounded-full" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </div>
      )}
    </div>
  );
}

// ─── Dynamic grid class ────────────────────────────────────────────────────
function gridClass(count) {
  if (count === 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count <= 4)  return 'grid-cols-2 grid-rows-2';
  return 'grid-cols-3';
}

// ─── LiveStage ─────────────────────────────────────────────────────────────
export default function LiveStage({ roomId, userId, userName, role = 'viewer', token }) {
  const {
    localStream, remoteStreams, screenShareStream,
    micOn, camOn, toggleMic, toggleCam,
    startScreenShare, stopScreenShare, quality,
  } = useLiveStage({ roomId, userId, userName, role, token });

  const isPanelist = role === 'panelist';
  const [pinnedId, setPinnedId] = useState(null);

  const togglePin = useCallback((id) => {
    setPinnedId(prev => prev === id ? null : id);
  }, []);

  // All camera tiles to display (local panelist first, then remotes)
  const cameraTiles = useMemo(() => {
    const tiles = [];
    // Local panelist's own camera — displayed as preview (muted to prevent echo)
    if (isPanelist && localStream) {
      tiles.push({ id: `local_${userId}`, stream: localStream, label: userName, isLocal: true, isMuted: !micOn, isCamOff: !camOn });
    }
    // Remote camera streams from SFU
    for (const r of remoteStreams) {
      if (r.type !== 'camera') continue;
      tiles.push({ id: r.streamId, stream: r.stream, label: r.userName, isLocal: false, isMuted: false, isCamOff: false });
    }
    return tiles;
  }, [isPanelist, localStream, remoteStreams, userId, userName, micOn, camOn]);

  // ── Screen-share layout (70/30 split) ──────────────────────────────
  if (screenShareStream) {
    return (
      <div className="w-full h-full flex gap-2 min-h-0">
        {/* Dominant 70% — screen share track */}
        <div className="flex-[7] min-w-0 min-h-0">
          <VideoTile
            stream={screenShareStream.stream}
            label={screenShareStream.local ? `${userName}'s Screen` : `Shared Screen`}
            isMuted={false}
            isCamOff={false}
            quality={quality}
          />
        </div>
        {/* 30% sidebar — webcam feeds stacked vertically */}
        <div className="flex-[3] flex flex-col gap-2 min-h-0 overflow-y-auto">
          {cameraTiles.map(tile => (
            <div key={tile.id} className="flex-1 min-h-0">
              <VideoTile
                stream={tile.stream}
                label={tile.label}
                isLocal={tile.isLocal}
                isMuted={tile.isMuted}
                isCamOff={tile.isCamOff}
                isPinned={pinnedId === tile.id}
                onPin={() => togglePin(tile.id)}
                quality={quality}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Pinned layout — one tile takes 70%, rest in sidebar ────────────
  const pinnedTile = pinnedId ? cameraTiles.find(t => t.id === pinnedId) : null;
  if (pinnedTile && cameraTiles.length > 1) {
    const rest = cameraTiles.filter(t => t.id !== pinnedId);
    return (
      <div className="w-full h-full flex gap-2 min-h-0">
        <div className="flex-[7] min-w-0 min-h-0">
          <VideoTile {...pinnedTile} isPinned onPin={() => togglePin(pinnedTile.id)} quality={quality} />
        </div>
        <div className="flex-[3] flex flex-col gap-2 min-h-0 overflow-y-auto">
          {rest.map(tile => (
            <div key={tile.id} className="flex-1 min-h-0">
              <VideoTile {...tile} onPin={() => togglePin(tile.id)} quality={quality} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Standard dynamic grid layout ──────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col gap-2 min-h-0">
      {/* Stage grid — class adapts to participant count */}
      <div className={`flex-1 grid gap-2 min-h-0 ${gridClass(cameraTiles.length)}`}>
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
              <VideoTile
                {...tile}
                isPinned={pinnedId === tile.id}
                onPin={() => togglePin(tile.id)}
                quality={quality}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty stage placeholder for viewers waiting for panelists */}
        {cameraTiles.length === 0 && (
          <div className="col-span-full row-span-full flex flex-col items-center justify-center bg-[#080B18] rounded-xl border border-white/5">
            <Radio className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-white/20 text-sm font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              {isPanelist ? 'Starting your camera…' : 'Waiting for the show to start'}
            </p>
          </div>
        )}
      </div>

      {/* Panelist controls bar — viewers never see this */}
      {isPanelist && (
        <div className="flex items-center justify-center gap-3 pb-1">
          <StageBtn
            active={micOn}
            icon={micOn ? 'mic' : 'mic-off'}
            label={micOn ? 'Mute' : 'Unmute'}
            onClick={toggleMic}
            danger={!micOn}
          />
          <StageBtn
            active={camOn}
            icon={camOn ? 'cam' : 'cam-off'}
            label={camOn ? 'Stop Video' : 'Start Video'}
            onClick={toggleCam}
            danger={!camOn}
          />
          {screenShareStream?.local ? (
            <StageBtn icon="screen-off" label="Stop Share" onClick={stopScreenShare} danger />
          ) : (
            <StageBtn icon="screen" label="Share Screen" onClick={startScreenShare} />
          )}
          {/* Network quality indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
            <Wifi className={`w-3 h-3 ${quality === 'good' ? 'text-[#6DBF7E]' : quality === 'warning' ? 'text-[#D4AF37]' : 'text-[#C0392B]'}`} />
            <span className="text-[10px] font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: quality === 'good' ? '#6DBF7E' : quality === 'warning' ? '#D4AF37' : '#C0392B' }}>
              {quality === 'good' ? 'Good' : quality === 'warning' ? 'Weak' : 'Poor'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small stage control button ─────────────────────────────────────────────
function StageBtn({ icon, label, onClick, active = true, danger = false }) {
  const icons = {
    'mic':        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
    'mic-off':    <MicOff className="w-4 h-4" />,
    'cam':        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    'cam-off':    <VideoOff className="w-4 h-4" />,
    'screen':     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    'screen-off': <MonitorOff className="w-4 h-4" />,
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-bold
        ${danger
          ? 'bg-[#C0392B]/15 border-[#C0392B]/30 text-[#C0392B] hover:bg-[#C0392B]/25'
          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
        }`}
      style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
    >
      {icons[icon]}
      {label}
    </button>
  );
}
