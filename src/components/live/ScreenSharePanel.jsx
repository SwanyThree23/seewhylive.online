import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, StopCircle, Monitor, X } from 'lucide-react';

export default function ScreenSharePanel({ isSharing, onStartShare, onStopShare }) {
  const [showOptions, setShowOptions] = useState(false);
  const [shareType, setShareType] = useState(null);

  const handleStartScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });
      setShareType('screen');
      onStartShare(stream);
      setShowOptions(false);
    } catch (err) {
      console.error('Screen share failed:', err);
    }
  };

  const handleStartWindowShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: 'always',
          displaySurface: 'window'
        },
        audio: false,
      });
      setShareType('window');
      onStartShare(stream);
      setShowOptions(false);
    } catch (err) {
      console.error('Window share failed:', err);
    }
  };

  const handleStopShare = () => {
    onStopShare();
    setShareType(null);
  };

  return (
    <div className="bg-[rgba(13,6,24,0.9)] border border-[rgba(212,175,55,0.15)] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-semibold text-white">Screen Share</span>
          {isSharing && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 animate-pulse">
              ACTIVE
            </span>
          )}
        </div>
        <span className="text-white/30 text-[10px]">{showOptions ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="px-3 py-3 space-y-2">
              {isSharing ? (
                <button
                  onClick={handleStopShare}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 14px', borderRadius:8, border:'1px solid rgba(239,68,68,0.5)', background:'rgba(127,29,29,0.5)', color:'#f87171', cursor:'pointer', fontSize:13 }}
                >
                  <StopCircle className="w-4 h-4" />
                  Stop Sharing
                </button>
              ) : (
                <>
                  <button
                    onClick={handleStartScreenShare}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:8, border:'1px solid rgba(147,51,234,0.5)', background:'rgba(88,28,135,0.5)', color:'#c084fc', cursor:'pointer', fontSize:13 }}
                  >
                    <Monitor className="w-4 h-4" />
                    Share Screen
                  </button>
                  <button
                    onClick={handleStartWindowShare}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:8, border:'1px solid rgba(147,51,234,0.3)', background:'rgba(88,28,135,0.3)', color:'#d8b4fe', cursor:'pointer', fontSize:13 }}
                  >
                    <Monitor className="w-4 h-4" />
                    Share Window
                  </button>
                  <p className="text-[9px] text-white/40 px-2 py-1">
                    Share your screen or application window with viewers in real-time
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}