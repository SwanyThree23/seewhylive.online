import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * VideoPlayerControls
 * Floating overlay control bar for host/co-host over any video player.
 * Props:
 *   playerRef    — ref to HTMLVideoElement (for direct video) or YT player object
 *   playerType   — 'direct' | 'youtube'
 *   isHost
 *   isCoHost
 *   onPlay / onPause / onSeek(seconds) / onSkipForward / onSkipBack
 *   syncStatus   — 'synced' | 'syncing' | null
 */
export default function VideoPlayerControls({ playerRef, playerType = 'direct', isHost, isCoHost, onPlay, onPause, onSeek, onSkipForward, onSkipBack, syncStatus }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const containerRef = useRef(null);

  const canControl = isHost || isCoHost;

  // Poll progress for direct video
  useEffect(() => {
    if (playerType !== 'direct') return;
    const interval = setInterval(() => {
      const vid = playerRef?.current;
      if (!vid) return;
      setPlaying(!vid.paused);
      setMuted(vid.muted);
      setDuration(vid.duration || 0);
      setProgress(vid.currentTime || 0);
    }, 500);
    return () => clearInterval(interval);
  }, [playerType, playerRef]);

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function handlePlay() {
    if (playerType === 'direct') playerRef?.current?.play();
    setPlaying(true);
    onPlay?.();
  }

  function handlePause() {
    if (playerType === 'direct') playerRef?.current?.pause();
    setPlaying(false);
    onPause?.();
  }

  function handleMuteToggle() {
    const vid = playerRef?.current;
    if (playerType === 'direct' && vid) {
      vid.muted = !vid.muted;
      setMuted(vid.muted);
    }
  }

  function handleSeek(e) {
    if (!canControl || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const time = ratio * duration;
    if (playerType === 'direct' && playerRef?.current) {
      playerRef.current.currentTime = time;
    }
    onSeek?.(time);
  }

  function handleSkipBack() {
    const vid = playerRef?.current;
    if (playerType === 'direct' && vid) vid.currentTime = Math.max(0, vid.currentTime - 10);
    onSkipBack?.();
  }

  function handleSkipForward() {
    const vid = playerRef?.current;
    if (playerType === 'direct' && vid) vid.currentTime = Math.min(duration, vid.currentTime + 10);
    onSkipForward?.();
  }

  function handleFullscreen() {
    const el = containerRef.current?.closest('[data-video-container]') || document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  }

  if (!canControl) {
    // Viewers: just show sync badge
    return syncStatus ? (
      <div className="absolute top-2 right-2 text-white text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1"
        style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(107,124,74,0.3)' }}>
        <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-spin'}`} />
        {syncStatus === 'synced' ? 'Live Sync' : 'Syncing...'}
      </div>
    ) : null;
  }

  return (
    <div ref={containerRef}
      className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 px-3 py-2"
      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
    >
      {/* Progress bar */}
      {playerType === 'direct' && duration > 0 && (
        <div
          className="h-1 rounded-full cursor-pointer group relative"
          style={{ background: 'rgba(255,255,255,0.2)' }}
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full transition-none"
            style={{ width: `${(progress / duration) * 100}%`, background: '#d4af37' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${(progress / duration) * 100}% - 6px)` }}
          />
          <div className="flex items-center justify-between text-[11px] text-white/50 mt-1 font-mono">
            <span>{fmt(progress)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center gap-2">
        {/* Role badge */}
        <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded shrink-0"
          style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            background: isHost ? 'rgba(212,175,55,0.2)' : 'rgba(201,168,76,0.15)',
            color: isHost ? '#d4af37' : '#C9A84C',
            border: `1px solid ${isHost ? 'rgba(212,175,55,0.3)' : 'rgba(201,168,76,0.25)'}`,
          }}>
          {isHost ? 'HOST' : 'CO-HOST'}
        </span>

        {/* Playback */}
        <div className="flex items-center gap-1">
          <button onClick={handleSkipBack}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 active:scale-90 text-white/70">
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={playing ? handlePause : handlePlay}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: '#d4af37', color: '#000' }}>
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </motion.button>
          <button onClick={handleSkipForward}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 active:scale-90 text-white/70">
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mute */}
        {playerType === 'direct' && (
          <button onClick={handleMuteToggle}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 active:scale-90 text-white/60">
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        )}

        <div className="flex-1" />

        {/* Fullscreen */}
        <button onClick={handleFullscreen}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 active:scale-90 text-white/60">
          {fullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}