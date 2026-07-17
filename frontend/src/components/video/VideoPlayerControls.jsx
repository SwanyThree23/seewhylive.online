import React, { useRef, useState, useEffect } from 'react';

var GOLD  = '#C9A84C';
var CREAM = '#F0E8D4';
var MUTED = 'rgba(255,255,255,0.5)';
var BURG  = '#800020';

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  var m = Math.floor(s / 60);
  var sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

function IconPlay()        { return React.createElement('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'currentColor'}, React.createElement('polygon', {points:'5,3 19,12 5,21'})); }
function IconPause()       { return React.createElement('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'currentColor'}, React.createElement('rect', {x:6,y:4,width:4,height:16}), React.createElement('rect', {x:14,y:4,width:4,height:16})); }
function IconSkipBack()    { return React.createElement('span', {style:{fontSize:11}}, '⏮'); }
function IconSkipForward() { return React.createElement('span', {style:{fontSize:11}}, '⏭'); }
function IconVolume()      { return React.createElement('span', {style:{fontSize:11}}, '🔊'); }
function IconMute()        { return React.createElement('span', {style:{fontSize:11}}, '🔇'); }
function IconMax()         { return React.createElement('span', {style:{fontSize:11}}, '⛶'); }
function IconMin()         { return React.createElement('span', {style:{fontSize:11}}, '⊡'); }

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
export default function VideoPlayerControls({ playerRef, playerType, isHost, isCoHost, onPlay, onPause, onSeek, onSkipForward, onSkipBack, syncStatus }) {
  var [playing,    setPlaying]    = useState(false);
  var [muted,      setMuted]      = useState(false);
  var [fullscreen, setFullscreen] = useState(false);
  var [progress,   setProgress]   = useState(0);
  var [duration,   setDuration]   = useState(0);
  var containerRef = useRef(null);

  var canControl = isHost || isCoHost;

  // Poll progress for direct video
  useEffect(function() {
    if (playerType !== 'direct') return;
    var id = setInterval(function() {
      var vid = playerRef && playerRef.current;
      if (!vid) return;
      setPlaying(!vid.paused);
      setMuted(vid.muted);
      setDuration(vid.duration || 0);
      setProgress(vid.currentTime || 0);
    }, 500);
    return function() { clearInterval(id); };
  }, [playerType, playerRef]);

  // Track fullscreen changes
  useEffect(function() {
    function onFSChange() { setFullscreen(!!document.fullscreenElement); }
    document.addEventListener('fullscreenchange', onFSChange);
    return function() { document.removeEventListener('fullscreenchange', onFSChange); };
  }, []);

  function handlePlay() {
    if (playerType === 'direct' && playerRef && playerRef.current) playerRef.current.play();
    setPlaying(true);
    if (onPlay) onPlay();
  }

  function handlePause() {
    if (playerType === 'direct' && playerRef && playerRef.current) playerRef.current.pause();
    setPlaying(false);
    if (onPause) onPause();
  }

  function handleMuteToggle() {
    var vid = playerRef && playerRef.current;
    if (playerType === 'direct' && vid) {
      vid.muted = !vid.muted;
      setMuted(vid.muted);
    }
  }

  function handleSeek(e) {
    if (!canControl || !duration) return;
    var rect  = e.currentTarget.getBoundingClientRect();
    var ratio = (e.clientX - rect.left) / rect.width;
    var time  = ratio * duration;
    if (playerType === 'direct' && playerRef && playerRef.current) {
      playerRef.current.currentTime = time;
    }
    if (onSeek) onSeek(time);
  }

  function handleSkipBack() {
    var vid = playerRef && playerRef.current;
    if (playerType === 'direct' && vid) vid.currentTime = Math.max(0, vid.currentTime - 10);
    if (onSkipBack) onSkipBack();
  }

  function handleSkipForward() {
    var vid = playerRef && playerRef.current;
    if (playerType === 'direct' && vid) vid.currentTime = Math.min(duration, vid.currentTime + 10);
    if (onSkipForward) onSkipForward();
  }

  function handleFullscreen() {
    var el = (containerRef.current && containerRef.current.closest('[data-video-container]')) || document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  // Viewers: just show a sync badge
  if (!canControl) {
    if (!syncStatus) return null;
    return (
      <div style={{
        position: 'absolute', top: 8, right: 8, zIndex: 14,
        background: 'rgba(0,0,0,0.7)',
        border: '1px solid rgba(107,124,74,0.3)',
        borderRadius: 12, padding: '3px 10px',
        display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: "'DM Mono',monospace", fontSize: 9, color: CREAM,
        pointerEvents: 'none',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: syncStatus === 'synced' ? '#6DBF7E' : GOLD,
          boxShadow: syncStatus === 'synced' ? '0 0 6px #6DBF7E' : '0 0 6px ' + GOLD,
        }} />
        {syncStatus === 'synced' ? 'Live Sync' : 'Syncing...'}
      </div>
    );
  }

  var pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div ref={containerRef} style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 14,
      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
      padding: '12px 10px 8px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {/* Progress bar — direct video only */}
      {playerType === 'direct' && duration > 0 && (
        <div onClick={handleSeek} style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.18)', cursor: canControl ? 'pointer' : 'default', position: 'relative', marginBottom: 2 }}>
          <div style={{ width: pct + '%', height: '100%', background: GOLD, borderRadius: 999, position: 'relative', transition: 'width .3s linear' }}>
            <div style={{ position: 'absolute', right: -5, top: -4, width: 10, height: 10, borderRadius: '50%', background: '#fff', boxShadow: '0 0 4px rgba(201,168,76,.8)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>
            <span>{fmt(progress)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      )}

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Role badge */}
        <span style={{
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 1,
          background: isHost ? 'rgba(212,175,55,0.2)' : 'rgba(201,168,76,0.15)',
          color: GOLD, border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 4, padding: '2px 6px', flexShrink: 0,
        }}>
          {isHost ? 'HOST' : 'CO-HOST'}
        </span>

        {/* Skip back */}
        <button onClick={handleSkipBack} title="-10s" style={btnStyle()}>
          <IconSkipBack />
        </button>

        {/* Play/Pause */}
        <button
          onClick={playing ? handlePause : handlePlay}
          style={{ width: 30, height: 30, borderRadius: 10, border: 'none', background: GOLD, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {playing ? <IconPause /> : <IconPlay />}
        </button>

        {/* Skip forward */}
        <button onClick={handleSkipForward} title="+10s" style={btnStyle()}>
          <IconSkipForward />
        </button>

        {/* Mute — direct video only */}
        {playerType === 'direct' && (
          <button onClick={handleMuteToggle} style={btnStyle()}>
            {muted ? <IconMute /> : <IconVolume />}
          </button>
        )}

        <div style={{ flex: 1 }} />

        {/* Fullscreen */}
        <button onClick={handleFullscreen} title="Fullscreen" style={btnStyle()}>
          {fullscreen ? <IconMin /> : <IconMax />}
        </button>
      </div>
    </div>
  );
}

function btnStyle() {
  return {
    width: 28, height: 28, borderRadius: 8, border: 'none',
    background: 'rgba(255,255,255,0.08)',
    color: CREAM, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'background .15s',
  };
}
