import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Maximize2,
  Settings, Share2, Lock, Clock, Copy, Code2, Users, X
} from 'lucide-react';

export default function EmbedPlayer({
  roomId,
  creatorName = 'Creator',
  creatorAvatar,
  streamTitle = 'Live Stream',
  viewerCount = 0,
  previewDuration = 120,
  price = 4.99,
  subscriptionPrice = 9.99,
  isLive = true,
}) {
  const [timeLeft, setTimeLeft] = useState(previewDuration);
  const [isLocked, setIsLocked] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState([80]);
  const [muted, setMuted] = useState(false);
  const [quality, setQuality] = useState('Auto');
  const [showControls, setShowControls] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [previewExtended, setPreviewExtended] = useState(false);
  const [blurAmount, setBlurAmount] = useState(0);
  const controlsTimeoutRef = useRef(null);

  const embedCode = `<iframe\n  src="${window.location.origin}/embed?room=${roomId}"\n  width="560" height="315"\n  frameborder="0"\n  allow="autoplay; fullscreen"\n  allowfullscreen>\n</iframe>`;

  useEffect(() => {
    if (isLocked) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsLocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isLocked]);

  // Gradual blur as paywall approaches
  useEffect(() => {
    if (timeLeft < 20 && timeLeft > 0) {
      setBlurAmount(((20 - timeLeft) / 20) * 16);
    }
  }, [timeLeft]);

  const extendPreview = () => {
    setTimeLeft(prev => prev + 15);
    setPreviewExtended(true);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const progress = ((previewDuration - timeLeft) / previewDuration) * 100;

  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
      {/* Video area */}
      <div
        className="absolute inset-0 cursor-pointer"
        onMouseMove={showControlsTemporarily}
        onClick={() => setPlaying(!playing)}
        style={{ filter: `blur(${blurAmount}px)`, transition: 'filter 0.5s ease' }}
      >
        {/* Fake video background */}
        <div className="w-full h-full bg-gradient-to-br from-[#1a0a30] via-[#080B18] to-[#001a20] flex items-center justify-center">
          {!playing ? (
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          ) : (
            <div className="w-32 h-32 relative">
              <div className="absolute inset-0 rounded-full bg-[#d4af37]/20 animate-ping" />
              <div className="absolute inset-4 rounded-full bg-[#d4af37]/30 animate-pulse" />
              <div className="absolute inset-8 rounded-full bg-[#d4af37]/50" />
            </div>
          )}
        </div>
      </div>

      {/* Top overlay: stream info */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent flex items-center gap-2">
        {isLive && (
          <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'#dc2626', color:'#fff', display:'inline-flex', alignItems:'center', gap:4 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#fff' }} />
            LIVE
          </span>
        )}
        <div className="flex items-center gap-1.5 text-white text-xs">
          <Users className="w-3 h-3" />
          {viewerCount.toLocaleString()} viewers
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#800020] to-[#d4af37] flex items-center justify-center text-white text-[10px] font-bold">
            {creatorName.charAt(0)}
          </div>
          <span className="text-white text-xs font-semibold truncate max-w-24">{creatorName}</span>
        </div>
      </div>

      {/* Stream title */}
      <div className="absolute bottom-16 left-3 max-w-[70%] pointer-events-none">
        <p className="text-white font-bold text-sm line-clamp-2 drop-shadow-lg">{streamTitle}</p>
        <p className="text-white/60 text-xs mt-0.5">{creatorName}</p>
      </div>

      {/* Preview timer bar */}
      {!isLocked && (
        <div className="absolute bottom-10 left-0 right-0 h-0.5 bg-white/10">
          <motion.div
            className="h-full bg-[#d4af37]"
            style={{ width: `${100 - progress}%` }}
          />
        </div>
      )}

      {/* Custom control bar */}
      <AnimatePresence>
        {(showControls && !isLocked) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-6"
          >
            <div className="flex items-center gap-2">
              <button onClick={() => setPlaying(!playing)} className="text-white hover:text-[#d4af37]">
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button onClick={() => setMuted(!muted)} className="text-white/70 hover:text-white">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="w-20">
                <input type="range" value={muted ? 0 : volume[0]} onChange={e => setVolume([+e.target.value])} min={0} max={100} step={1} style={{ width:'100%', accentColor:'#D4AF37' }} />
              </div>
              <div className="flex-1" />
              <span
                onClick={() => setQuality(quality === 'Auto' ? '1080p' : quality === '1080p' ? '720p' : quality === '720p' ? '480p' : 'Auto')}
                style={{ fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(0,0,0,0.6)', color:'#D4AF37', border:'1px solid rgba(212,175,55,0.3)', cursor:'pointer' }}
              >
                {quality}
              </span>
              <button onClick={() => setShowEmbed(!showEmbed)} className="text-white/60 hover:text-white">
                <Code2 className="w-4 h-4" />
              </button>
              <button className="text-white/60 hover:text-white">
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview timer badge */}
      {!isLocked && timeLeft <= 30 && (
        <motion.div
          initial={{ scale: 0.8 }} animate={{ scale: 1 }}
          className="absolute top-12 left-3"
        >
          <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'#800020', color:'#D4AF37', border:'2px solid #D4AF37', display:'inline-flex', alignItems:'center', gap:4 }}>
            <Clock className="w-3 h-3" />
            PREVIEW: {formatTime(timeLeft)}
          </span>
        </motion.div>
      )}

      {/* Paywall overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 20 }}
            className="absolute inset-0 flex flex-col justify-end"
            style={{ backdropFilter: 'blur(12px)', background: 'rgba(13,6,24,0.85)' }}
          >
            <div className="p-6 border border-[#d4af37]/20 rounded-t-2xl bg-gradient-to-t from-[#080B18] to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#800020] to-[#d4af37] flex items-center justify-center text-white text-xl font-bold">
                  {creatorName.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-bold">Continue watching</p>
                  <p className="text-[#d4af37] font-semibold">{creatorName}</p>
                </div>
                <Lock className="w-5 h-5 text-[#d4af37] ml-auto" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <button className="py-3 rounded-xl bg-gradient-to-r from-[#800020] to-[#d4af37] text-white font-bold text-sm hover:opacity-90 transition-opacity">
                  Unlock ${price} — One-time
                </button>
                <button className="py-3 rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 text-white font-bold text-sm hover:opacity-90 transition-opacity">
                  Subscribe ${subscriptionPrice}/mo
                </button>
              </div>

              <div className="flex justify-center gap-3 mb-3 flex-wrap">
                {['Stripe', 'PayPal', 'CashApp', 'Venmo'].map(p => (
                  <button key={p} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:bg-white/10 hover:text-white">
                    {p}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button className="text-xs text-white/40 hover:text-white underline">
                  Already a member? Sign In
                </button>
                {!previewExtended && (
                  <button onClick={extendPreview} className="text-xs text-[#D4AF37] hover:text-white underline">
                    Watch 15s more free
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embed Code Modal */}
      <AnimatePresence>
        {showEmbed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-4 bg-[#080B18] border border-[#d4af37]/30 rounded-xl p-4 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#d4af37]">Embed Code</p>
              <button onClick={() => setShowEmbed(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="bg-black/50 rounded-lg p-3 text-xs text-[#D4AF37] font-mono overflow-x-auto whitespace-pre-wrap mb-3">
              {embedCode}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(embedCode); }}
              style={{ background:'#D4AF37', color:'#000', border:'none', borderRadius:8, fontWeight:700, padding:'6px 12px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, fontFamily:'Barlow Condensed, sans-serif', fontSize:13 }}
            >
              <Copy className="w-3 h-3" /> Copy Code
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watermark */}
      <div className="absolute bottom-2 right-3 text-[#d4af37]/40 text-[10px] font-bold pointer-events-none">
        StreamSpace
      </div>
    </div>
  );
}