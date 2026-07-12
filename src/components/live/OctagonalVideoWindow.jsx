import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Share2 } from 'lucide-react';

const OCT = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';

const PALETTE = ['#8B6F47','#6B7C4A','#CC7755','#4A6B7C','#7C4A6B','#C0392B','#D4854A','#C9A84C'];
function avatarColor(name) {
  return PALETTE[(name?.charCodeAt(0) ?? 0) % PALETTE.length];
}

export default function OctagonalVideoWindow({
  title,
  isMuted,
  isVideoOff,
  onMicToggle,
  onVideoToggle,
  onShareScreen,
  // MediaStream object — preferred over legacy streamUrl
  stream,
  // Legacy string prop — kept for compatibility but not used for live feeds
  streamUrl,
  avatarUrl,
  userName,
  points = 0,
  label = 'Participant',
  isLocal = false,
  showControls = true,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
    } else if (streamUrl && typeof streamUrl === 'string') {
      el.srcObject = null;
      el.src = streamUrl;
    } else {
      el.srcObject = null;
    }
  }, [stream, streamUrl]);

  const displayName = userName || title || 'Guest';
  const hasVideo = (stream || streamUrl) && !isVideoOff;

  return (
    <motion.div
      className="relative w-full aspect-square"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Gold glow border */}
      <div
        className="absolute inset-0"
        style={{
          clipPath,
          background: 'linear-gradient(135deg, #d4af37, #C0392B)',
          padding: '3px',
          opacity: 0.5,
          filter: 'blur(8px)',
        }}
      />

      {/* Main octagonal shell */}
      <div
        className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
        style={{
          clipPath: OCT,
          background: 'linear-gradient(145deg, rgba(30,15,30,0.97), rgba(8,11,24,0.97))',
        }}
      >
        {/* Video or avatar */}
        {hasVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal || isMuted}
            className={'absolute inset-0 w-full h-full object-cover' + (isLocal ? ' scale-x-[-1]' : '')}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: `radial-gradient(circle, ${avatarColor(displayName)}22 0%, transparent 70%)` }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-14 h-14 rounded-full object-cover"
                style={{ border: `2px solid ${avatarColor(displayName)}88` }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black"
                style={{
                  background: `linear-gradient(135deg, ${avatarColor(displayName)}, ${avatarColor(displayName)}99)`,
                  color: '#fff',
                  boxShadow: `0 0 20px ${avatarColor(displayName)}55, inset 0 1px 0 rgba(255,255,255,0.2)`,
                  border: '2px solid rgba(255,255,255,0.15)',
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {isVideoOff && (
              <div className="mt-1.5 flex items-center gap-1">
                <VideoOff className="w-3 h-3 text-white/30" />
                <span className="text-[9px] text-white/30 font-semibold">Camera Off</span>
              </div>
            )}
          </div>
        )}

        {/* Points badge */}
        {points > 0 && (
          <div className="absolute top-3 right-3 rounded-lg px-2 py-1"
            style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}` }}>
            <p className="text-xs font-bold" style={{ color: GOLD }}>{points}</p>
            <p className="text-[9px]" style={{ color: `${GOLD}99` }}>PTS</p>
          </div>
        )}

        {/* Name label */}
        <div className="absolute bottom-8 left-0 right-0 text-center px-2">
          <p className="text-[11px] font-bold text-white truncate leading-tight"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
            {displayName}
          </p>
          {label && label !== displayName && (
            <p className="text-[9px] text-white/50">{label}</p>
          )}
        </div>

        {/* Control buttons - bottom corners */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-1 justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={onMicToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-red-900/50 border border-red-600 text-red-400'
                : 'bg-[#0F1428]/50 border border-[#6DBF7E]/35 text-[#6DBF7E]'
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={onVideoToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isVideoOff
                ? 'bg-red-900/50 border border-red-600 text-red-400'
                : 'bg-[#0F1428]/70 border border-[#D4AF37]/40 text-[#D4AF37]'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={onShareScreen}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#7B5DA6]/50 border border-[#7B5DA6] text-[#7B5DA6] transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}