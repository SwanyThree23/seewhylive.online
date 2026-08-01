import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWatchPartySocket } from '../../hooks/useWatchPartySocket';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv2, Search, X, Volume2, VolumeX, Users } from 'lucide-react';
import { toast } from 'sonner';

const REACTIONS = ['👏', '❤️', '😂', '🔥', '😮'];
let ytApiLoading = false;

function extractYouTubeId(input) {
  if (!input) return null;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

function loadYTApi() {
  if (window.YT?.Player || ytApiLoading) return;
  ytApiLoading = true;
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

export default function RoomWatchPartyPlayer({ roomId, isHost, currentUser }) {
  const [videoId, setVideoId] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [muted, setMuted] = useState(!isHost);
  const [reactions, setReactions] = useState([]);
  const [connected, setConnectedState] = useState(false);

  const playerDivRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  // Emit helpers are set after the hook initialises
  const emitRef = useRef({});

  const destroyPlayer = useCallback(() => {
    try { ytPlayerRef.current?.destroy(); } catch {}
    ytPlayerRef.current = null;
  }, []);

  const createYTPlayer = useCallback((vid) => {
    destroyPlayer();

    const tryCreate = () => {
      if (!playerDivRef.current || !window.YT?.Player) return false;
      ytPlayerRef.current = new window.YT.Player(playerDivRef.current, {
        videoId: vid,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: isHostRef.current ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
          enablejsapi: 1,
        },
        events: {
          onReady(e) {
            if (!isHostRef.current) e.target.mute();
          },
          onStateChange(e) {
            if (!isHostRef.current) return;
            const pos = e.target.getCurrentTime();
            if (e.data === window.YT.PlayerState.PLAYING) {
              emitRef.current.emitPlay?.(pos);
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              emitRef.current.emitPause?.(pos);
            }
          },
        },
      });
      return true;
    };

    if (!tryCreate()) {
      const poll = setInterval(() => {
        if (tryCreate()) clearInterval(poll);
      }, 150);
    }
  }, [destroyPlayer]);

  // Wire up the socket
  const socketControls = useWatchPartySocket({
    partyId: roomId,
    userId: currentUser?.id,
    userName: currentUser?.full_name,
    isHost,
    onPlay({ position, lag }) {
      const p = ytPlayerRef.current;
      if (!p) return;
      p.seekTo(position + lag, true);
      p.unMute();
      p.playVideo();
      setMuted(false);
    },
    onPause({ position }) {
      const p = ytPlayerRef.current;
      if (!p) return;
      p.seekTo(position, true);
      p.pauseVideo();
    },
    onSeek({ position }) {
      ytPlayerRef.current?.seekTo(position, true);
    },
    onUrl({ videoId: vid, url }) {
      const id = vid || extractYouTubeId(url);
      if (!id) return;
      setVideoId(id);
      createYTPlayer(id);
    },
    onSync(state) {
      const id = state?.videoId || extractYouTubeId(state?.url);
      if (!id) return;
      setVideoId(id);
      createYTPlayer(id);
      if (state?.playing) {
        setTimeout(() => {
          ytPlayerRef.current?.seekTo(state.position || 0, true);
          ytPlayerRef.current?.unMute();
          ytPlayerRef.current?.playVideo();
        }, 600);
      }
    },
  });

  // Keep emit refs current
  useEffect(() => {
    emitRef.current = socketControls;
    setConnectedState(socketControls.connected);
  }, [socketControls]);

  // Load YT API on mount
  useEffect(() => {
    loadYTApi();
    return destroyPlayer;
  }, [destroyPlayer]);

  // Heartbeat: host syncs state every 5s
  useEffect(() => {
    if (!isHost || !videoId) return;
    const id = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p) return;
      try {
        emitRef.current.emitSync?.({
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          type: 'youtube',
          playing: p.getPlayerState() === window.YT?.PlayerState?.PLAYING,
          position: p.getCurrentTime(),
        });
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, [isHost, videoId]);

  const handleLoadUrl = () => {
    const vid = extractYouTubeId(urlInput.trim());
    if (!vid) { toast.error('Could not parse a YouTube video ID from that URL'); return; }
    setVideoId(vid);
    setUrlInput('');
    setShowInput(false);
    createYTPlayer(vid);
    socketControls.emitUrl({
      videoId: vid,
      url: urlInput.trim(),
      type: 'youtube',
    });
    toast.success('Watch Party video set — viewers are syncing');
  };

  const addReaction = (emoji) => {
    const id = crypto.randomUUID?.() || Date.now() + Math.random();
    const x = Math.random() * 75 + 5;
    setReactions(r => [...r, { id, emoji, x }]);
    setTimeout(() => setReactions(r => r.filter(rx => rx.id !== id)), 3200);
  };

  // ── No video loaded ──────────────────────────────────────────────────────
  if (!videoId) {
    return (
      <div className="rounded-xl overflow-hidden"
        style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.12)' }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <Tv2 className="w-4 h-4" style={{ color: '#D4AF37' }} />
          <span className="font-black text-sm text-white uppercase"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
            Watch Party
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#6DBF7E]' : 'bg-white/20'}`} />
            <span className="text-[10px]" style={{ color: connected ? '#6DBF7E' : 'rgba(255,255,255,0.3)' }}>
              {connected ? 'Connected' : 'Connecting…'}
            </span>
          </div>
        </div>

        <div className="p-6 text-center space-y-4">
          {isHost ? (
            <>
              <p className="text-sm text-white/50">
                Paste a YouTube link to watch together in real time
              </p>
              <div className="flex gap-2 max-w-sm mx-auto">
                <input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLoadUrl()}
                  placeholder="youtube.com/watch?v=… or video ID"
                  className="flex-1 px-3 py-2 rounded-xl text-sm text-white outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(212,175,55,0.25)',
                    fontFamily: 'Barlow Condensed, sans-serif',
                  }}
                />
                <button onClick={handleLoadUrl} disabled={!urlInput.trim()}
                  className="px-4 py-2 rounded-xl font-black text-xs uppercase transition-opacity"
                  style={{ background: '#D4AF37', color: '#000', opacity: urlInput.trim() ? 1 : 0.5 }}>
                  Play
                </button>
              </div>
              <p className="text-[10px] text-white/20">
                All viewers will sync automatically when you press play
              </p>
            </>
          ) : (
            <div className="py-6 space-y-2">
              <Tv2 className="w-10 h-10 mx-auto" style={{ color: 'rgba(212,175,55,0.25)' }} />
              <p className="text-sm text-white/30">Waiting for the host to start Watch Party…</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Player view ──────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: '#000', border: '1px solid rgba(212,175,55,0.18)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2">
          <Tv2 className="w-3.5 h-3.5" style={{ color: '#D4AF37' }} />
          <span className="text-[11px] font-black uppercase text-white/70"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>
            Watch Party
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#C0392B] animate-pulse" />
          <span className="text-[10px] text-[#C0392B] font-bold">LIVE</span>
        </div>
        {isHost && (
          <div className="flex gap-1.5">
            <button onClick={() => setShowInput(s => !s)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all"
              style={{ background: showInput ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}>
              <Search className="w-3 h-3" /> Change
            </button>
          </div>
        )}
      </div>

      {/* URL input (host) */}
      <AnimatePresence>
        {showInput && isHost && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 p-3"
              style={{ background: 'rgba(8,11,24,0.95)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <input
                autoFocus
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLoadUrl()}
                placeholder="Paste YouTube URL…"
                className="flex-1 px-3 py-1.5 rounded-lg text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}
              />
              <button onClick={handleLoadUrl}
                className="px-3 py-1.5 rounded-lg text-xs font-black uppercase"
                style={{ background: '#D4AF37', color: '#000' }}>Load</button>
              <button onClick={() => setShowInput(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 16:9 player area */}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <div ref={playerDivRef} className="absolute inset-0 w-full h-full" />

        {/* Floating emoji reactions */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {reactions.map(r => (
              <motion.div
                key={r.id}
                initial={{ opacity: 1, y: 0, scale: 0.8 }}
                animate={{ opacity: 0, y: -140, scale: 1.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.8, ease: 'easeOut' }}
                className="absolute bottom-16 select-none text-3xl"
                style={{ left: `${r.x}%` }}
              >
                {r.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Reaction bar */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'rgba(8,11,24,0.97)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex gap-3">
          {REACTIONS.map(emoji => (
            <button key={emoji} onClick={() => addReaction(emoji)}
              className="text-xl leading-none select-none transition-transform active:scale-125 hover:scale-110"
              title={`React ${emoji}`}>
              {emoji}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            const p = ytPlayerRef.current;
            if (!p) return;
            if (muted) { p.unMute(); setMuted(false); }
            else { p.mute(); setMuted(true); }
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', color: muted ? '#C0392B' : 'rgba(255,255,255,0.5)' }}>
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
