import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Share2 } from 'lucide-react';

export default function OctagonalVideoWindow({ 
  title, 
  isMuted, 
  isVideoOff, 
  onMicToggle, 
  onVideoToggle,
  onShareScreen,
  streamUrl,
  points = 0,
  label = 'Participant'
}) {
  const clipPath = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';

  return (
    <motion.div
      className="relative w-full aspect-square"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Octagonal border glow */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          clipPath,
          background: 'linear-gradient(135deg, #d4af37, #C0392B)',
          padding: '3px',
          opacity: 0.5,
          filter: 'blur(8px)',
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

        {/* Points badge - top right */}
        {points > 0 && (
          <div className="absolute top-3 right-3 bg-[#d4af37]/20 border border-[#d4af37] rounded-lg px-2 py-1">
            <p className="text-xs font-bold text-[#d4af37]">{points}</p>
            <p className="text-[11px] text-[#d4af37]/70">POINTS</p>
          </div>
        )}

        {/* Label - bottom center */}
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
                ? 'bg-red-900/50 border border-red-600 text-[#C0392B]'
                : 'bg-green-900/50 border border-green-600 text-[#6DBF7E]'
            }`}
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
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#7B5DA6]/50 border border-[#7B5DA6] text-[#7B5DA6] transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}