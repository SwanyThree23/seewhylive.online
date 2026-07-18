import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Volume2, VolumeX, Maximize,
  Settings, Lock, Clock, Copy, Code2, Users, X, AlertCircle,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

const GOLD = '#d4af37';
const CRIM = '#C0392B';

function useHLSVideo(videoRef, streamUrl) {
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    // Native HLS (Safari / older Edge) or direct video URL
    if (video.canPlayType('application/vnd.apple.mpegurl') || !streamUrl.includes('.m3u8')) {
      video.src = streamUrl;
      video.load();
      return;
    }

    // Dynamic hls.js import — only loaded when needed
    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) {
        video.src = streamUrl;
        return;
      }
      const hls = new Hls({ maxBufferLength: 10, liveSyncDurationCount: 2 });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;
    }).catch(() => {
      // hls.js not installed — fall back to native src
      video.src = streamUrl;
    });

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [streamUrl, videoRef]);
}

function formatTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * EmbedPlayer — embeddable live / PPV video player with real video playback.
 *
 * Props:
 *   roomId           {string}   — room / stream identifier
 *   streamUrl        {string?}  — HLS URL (.m3u8) or direct video URL; shows placeholder if absent
 *   streamObject     {MediaStream?} — WebRTC MediaStream (alternative to streamUrl)
 *   creatorName      {string}
 *   creatorAvatar    {string?}
 *   streamTitle      {string}
 *   viewerCount      {number}
 *   previewDuration  {number}   — free preview seconds (default 120)
 *   price            {number}   — one-time unlock price
 *   subscriptionPrice{number}
 *   isLive           {boolean}
 *   isUnlocked       {boolean}  — true if viewer has already paid
 *   onPurchase       {(type:'ppv'|'sub', method:string)=>void} — payment intent callback
 */
export default function EmbedPlayer({
  roomId,
  streamUrl,
  streamObject,
  creatorName        = 'Creator',
  creatorAvatar,
  streamTitle        = 'Live Stream',
  viewerCount        = 0,
  previewDuration    = 120,
  price              = 4.99,
  subscriptionPrice  = 9.99,
  isLive             = true,
  isUnlocked         = false,
  onPurchase,
}) {
  const videoRef         = useRef(null);
  const wrapperRef       = useRef(null);
  const ctrlTimerRef     = useRef(null);

  const [timeLeft,         setTimeLeft]         = useState(previewDuration);
  const [locked,           setLocked]           = useState(false);
  const [playing,          setPlaying]          = useState(true);
  const [muted,            setMuted]            = useState(false);
  const [volume,           setVolume]           = useState(80);
  const [quality,          setQuality]          = useState('Auto');
  const [showControls,     setShowControls]     = useState(false);
  const [showEmbed,        setShowEmbed]        = useState(false);
  const [previewExtended,  setPreviewExtended]  = useState(false);
  const [blurAmount,       setBlurAmount]       = useState(0);
  const [videoError,       setVideoError]       = useState(false);

  // Wire HLS
  useHLSVideo(videoRef, streamUrl);

  // Wire WebRTC MediaStream
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamObject) return;
    video.srcObject = streamObject;
    video.play?.().catch(() => {});
    return () => { video.srcObject = null; };
  }, [streamObject]);

  // Sync play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    playing ? video.play?.().catch(() => {}) : video.pause?.();
  }, [playing]);

  // Sync volume
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume / 100;
    video.muted  = muted;
  }, [volume, muted]);

  // Preview countdown (skip when already unlocked or no paywall)
  useEffect(() => {
    if (locked || isUnlocked) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setLocked(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [locked, isUnlocked]);

  // Gradual blur as paywall approaches
  useEffect(() => {
    if (isUnlocked) { setBlurAmount(0); return; }
    if (timeLeft < 20 && timeLeft > 0) setBlurAmount(((20 - timeLeft) / 20) * 14);
    else setBlurAmount(0);
  }, [timeLeft, isUnlocked]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(ctrlTimerRef.current);
    ctrlTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else wrapperRef.current?.requestFullscreen?.().catch(() => {});
  };

  const handlePurchase = (type, method) => {
    onPurchase?.(type, method);
    // Create an intent record in DB for the payment flow to pick up
    base44.entities.Transaction?.create?.({
      room_id: roomId,
      type,
      method,
      amount: type === 'ppv' ? price : subscriptionPrice,
      status: 'pending',
    }).catch(() => {});
  };

  const embedCode = `<iframe\n  src="${window.location.origin}/embed?room=${roomId}"\n  width="560" height="315"\n  frameborder="0"\n  allow="autoplay; fullscreen"\n  allowfullscreen>\n</iframe>`;

  const progress    = ((previewDuration - timeLeft) / previewDuration) * 100;
  const hasRealVideo = !!(streamUrl || streamObject);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full bg-black rounded-xl overflow-hidden select-none"
      style={{ aspectRatio: '16/9' }}
    >
      {/* ── Video layer ── */}
      <div
        className="absolute inset-0 cursor-pointer"
        onMouseMove={showControlsTemporarily}
        onClick={() => { showControlsTemporarily(); setPlaying(p => !p); }}
        style={{ filter: `blur(${blurAmount}px)`, transition: 'filter 0.5s ease' }}
      >
        {/* Real video element — always mounted so HLS / srcObject can attach */}
        <video
          ref={videoRef}
          autoPlay playsInline
          className="w-full h-full object-cover"
          style={{ display: hasRealVideo && !videoError ? 'block' : 'none' }}
          onError={() => setVideoError(true)}
          onPlaying={() => setVideoError(false)}
        />

        {/* Placeholder when no stream URL provided yet */}
        {(!hasRealVideo || videoError) && (
          <div className="w-full h-full bg-gradient-to-br from-[#0F1428] via-[#080B18] to-[#080B18] flex items-center justify-center">
            {videoError ? (
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-white/50 text-xs">Stream unavailable</p>
              </div>
            ) : !playing ? (
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            ) : (
              <div className="w-24 h-24 relative">
                <div className="absolute inset-0 rounded-full bg-[#d4af37]/20 animate-ping" />
                <div className="absolute inset-4 rounded-full bg-[#d4af37]/30 animate-pulse" />
                <div className="absolute inset-8 rounded-full bg-[#d4af37]/50" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Top overlay: stream info ── */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent flex items-center gap-2 pointer-events-none">
        {isLive && (
          <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background: CRIM, color:'#fff', display:'inline-flex', alignItems:'center', gap:4 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#fff', animation:'pulse 1s infinite' }} />
            LIVE
          </span>
        )}
        <div className="flex items-center gap-1 text-white text-xs">
          <Users className="w-3 h-3" />
          {viewerCount.toLocaleString()}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {creatorAvatar ? (
            <img src={creatorAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: `linear-gradient(135deg, #800020, ${GOLD})` }}>
              {creatorName.charAt(0)}
            </div>
          )}
          <span className="text-white text-xs font-semibold truncate max-w-24">{creatorName}</span>
        </div>
      </div>

      {/* ── Stream title ── */}
      <div className="absolute bottom-16 left-3 max-w-[70%] pointer-events-none">
        <p className="text-white font-bold text-sm line-clamp-2 drop-shadow-lg">{streamTitle}</p>
        <p className="text-white/60 text-xs mt-0.5">{creatorName}</p>
      </div>

      {/* ── Preview timer bar ── */}
      {!locked && !isUnlocked && (
        <div className="absolute bottom-10 left-0 right-0 h-0.5 bg-white/10 pointer-events-none">
          <motion.div className="h-full" style={{ width: `${100 - progress}%`, background: GOLD }} />
        </div>
      )}

      {/* ── Control bar ── */}
      <AnimatePresence>
        {showControls && !(locked && !isUnlocked) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-6"
          >
            <div className="flex items-center gap-2">
              <button onClick={e => { e.stopPropagation(); setPlaying(p => !p); }} className="text-white hover:text-[#d4af37]">
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button onClick={e => { e.stopPropagation(); setMuted(m => !m); }} className="text-white/70 hover:text-white">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range" min={0} max={100} step={1}
                value={muted ? 0 : volume}
                onChange={e => { setVolume(+e.target.value); setMuted(false); }}
                onClick={e => e.stopPropagation()}
                className="w-20"
                style={{ accentColor: GOLD }}
              />
              <div className="flex-1" />
              <span
                onClick={e => {
                  e.stopPropagation();
                  const cycle = ['Auto', '1080p', '720p', '480p', '360p'];
                  setQuality(q => cycle[(cycle.indexOf(q) + 1) % cycle.length]);
                }}
                style={{ fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(0,0,0,0.6)', color: GOLD, border:`1px solid ${GOLD}44`, cursor:'pointer' }}
              >
                {quality}
              </span>
              <button onClick={e => { e.stopPropagation(); setShowEmbed(v => !v); }} className="text-white/60 hover:text-white">
                <Code2 className="w-4 h-4" />
              </button>
              <button onClick={e => { e.stopPropagation(); toggleFullscreen(); }} className="text-white/60 hover:text-white">
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Preview timer badge ── */}
      {!locked && !isUnlocked && timeLeft <= 30 && (
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="absolute top-12 left-3">
          <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'#800020', color: GOLD, border:`2px solid ${GOLD}`, display:'inline-flex', alignItems:'center', gap:4 }}>
            <Clock className="w-3 h-3" />
            PREVIEW: {formatTime(timeLeft)}
          </span>
        </motion.div>
      )}

      {/* ── Paywall overlay ── */}
      <AnimatePresence>
        {locked && !isUnlocked && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 20 }}
            className="absolute inset-0 flex flex-col justify-end"
            style={{ backdropFilter: 'blur(14px)', background: 'rgba(8,11,24,0.88)' }}
          >
            <div className="p-6 border border-[#d4af37]/20 rounded-t-2xl bg-gradient-to-t from-[#080B18] to-transparent">
              <div className="flex items-center gap-3 mb-4">
                {creatorAvatar ? (
                  <img src={creatorAvatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ background: `linear-gradient(135deg, #800020, ${GOLD})` }}>
                    {creatorName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-white font-bold">Continue watching</p>
                  <p className="font-semibold" style={{ color: GOLD }}>{creatorName}</p>
                </div>
                <Lock className="w-5 h-5 ml-auto" style={{ color: GOLD }} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => handlePurchase('ppv', 'default')}
                  className="py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                  style={{ background: `linear-gradient(90deg, #800020, ${GOLD})` }}>
                  Unlock ${price.toFixed(2)} — One-time
                </button>
                <button
                  onClick={() => handlePurchase('sub', 'default')}
                  className="py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                  style={{ background: `linear-gradient(90deg, #800020, ${CRIM})` }}>
                  Subscribe ${subscriptionPrice.toFixed(2)}/mo
                </button>
              </div>

              <div className="flex justify-center gap-3 mb-3 flex-wrap">
                {['Stripe', 'PayPal', 'CashApp', 'Venmo'].map(method => (
                  <button key={method}
                    onClick={() => handlePurchase('ppv', method.toLowerCase())}
                    className="px-3 py-1 rounded-lg text-xs hover:bg-white/10 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                    {method}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => handlePurchase('signin', 'default')}
                  className="text-xs text-white/40 hover:text-white underline">
                  Already a member? Sign In
                </button>
                {!previewExtended && (
                  <button
                    onClick={() => { setTimeLeft(t => t + 15); setPreviewExtended(true); setLocked(false); }}
                    className="text-xs underline hover:text-white"
                    style={{ color: GOLD }}>
                    Watch 15s more free
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Embed code modal ── */}
      <AnimatePresence>
        {showEmbed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-4 rounded-xl p-4 z-50"
            style={{ background: '#080B18', border: `1px solid ${GOLD}33` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: GOLD }}>Embed Code</p>
              <button onClick={() => setShowEmbed(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="bg-black/50 rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap mb-3"
              style={{ color: GOLD }}>
              {embedCode}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(embedCode).catch(() => {})}
              style={{ background: GOLD, color:'#000', border:'none', borderRadius:8, fontWeight:700, padding:'6px 12px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, fontFamily:'Barlow Condensed, sans-serif', fontSize:13 }}>
              <Copy className="w-3 h-3" /> Copy Code
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Watermark ── */}
      <div className="absolute bottom-2 right-3 text-[10px] font-bold pointer-events-none" style={{ color: `${GOLD}44` }}>
        SeeWhyLIVE
      </div>
    </div>
  );
}
