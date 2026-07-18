import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Share2, Crown, Pin } from 'lucide-react';

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
  isHost = false,
  isPinned = false,
  onPinToggle,
  reactions = [],
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
      animate={{ scale: isPinned ? 1.05 : 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Gold glow border */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: OCT,
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
        {/* Floating reactions */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {reactions.map(function(r) {
            return (
              <span key={r.id} className="absolute text-xl reaction-float"
                style={{ left: (10 + Math.random() * 80) + '%', bottom: '15%' }}
              >
                {r.emoji}
              </span>
            );
          })}
        </div>

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

        {/* Host crown badge */}
      {isHost && (
        <div className="absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}` }}
        >
          <Crown className="w-3.5 h-3.5" style={{ color: GOLD }} />
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
                ? 'bg-red-900/50 border border-red-600 text-[#C0392B]'
                : 'border border-green-600 text-[#6DBF7E]'
            }`}
            style={isMuted ? undefined : { background: 'rgba(109,191,126,0.15)' }}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={onVideoToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isVideoOff
                ? 'bg-red-900/50 border border-red-600 text-[#C0392B]'
                : 'bg-blue-900/50 border border-blue-600 text-blue-400'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={onShareScreen}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#800020]/30 border border-[#800020] text-[#D4854A] transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
          </motion.button>

          {onPinToggle && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={onPinToggle}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isPinned
                  ? 'bg-[#C8F030]/50 border border-[#C8F030] text-[#C8F030]'
                  : 'bg-white/10 border border-white/20 text-white/60'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
