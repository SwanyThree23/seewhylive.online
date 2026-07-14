import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Share2, Crown, Pin } from 'lucide-react';

export default function OctagonalVideoWindow({
  title,
  isMuted,
  isVideoOff,
  onMicToggle,
  onVideoToggle,
  onShareScreen,
  streamUrl,
  points = 0,
  label = 'Participant',
  isHost = false,
  isPinned = false,
  onPinToggle,
  reactions = []
}) {
  const clipPath = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';

  return (
    <motion.div
      className="relative w-full aspect-square"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: isPinned ? 1.05 : 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Octagonal border glow */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          clipPath,
          background: isPinned
            ? 'linear-gradient(135deg, #C8F030, #d4af37)'
            : 'linear-gradient(135deg, #d4af37, #C0392B)',
          padding: '3px',
          opacity: isPinned ? 0.9 : 0.5,
          filter: isPinned ? 'blur(4px)' : 'blur(8px)',
        }}
      />

      {/* Main octagonal container */}
      <div
        className="relative w-full h-full bg-black/80 flex flex-col items-center justify-center overflow-hidden"
        style={{ clipPath }}
      >
        {/* Video feed or placeholder */}
        {streamUrl && !isVideoOff ? (
          <video
            src={streamUrl}
            autoPlay
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
            <div className="text-center">
              {isVideoOff && (
                <>
                  <VideoOff className="w-12 h-12 text-white/40 mx-auto mb-2" />
                  <p className="text-xs text-white/40">Camera Off</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Floating reactions */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {reactions.map(function(r) {
              return (
                <motion.span
                  key={r.id}
                  className="absolute text-2xl"
                  style={{ left: (10 + Math.random() * 80) + '%', bottom: '20%' }}
                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -80, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8 }}
                >
                  {r.emoji}
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Host crown badge - top left */}
        {isHost && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#d4af37] flex items-center justify-center shadow-lg">
            <Crown className="w-3.5 h-3.5 text-black" />
          </div>
        )}

        {/* Points badge - top right */}
        {points > 0 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 border border-[#d4af37]/50 flex items-center gap-1">
            <span className="text-[10px] font-bold text-[#d4af37]">{points}</span>
          </div>
        )}

        {/* Title/label footer */}
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <p className="text-xs font-bold text-white truncate px-2">{title}</p>
          <p className="text-[10px] text-white/60">{label}</p>
        </div>

        {/* Control buttons - bottom corners */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-1 justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={onMicToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-red-900/50 border border-red-600 text-red-400'
                : 'bg-green-900/50 border border-green-600 text-green-400'
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
                : 'bg-blue-900/50 border border-blue-600 text-blue-400'
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
