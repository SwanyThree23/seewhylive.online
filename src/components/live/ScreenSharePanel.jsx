import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, StopCircle, Monitor, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
                <Button
                  onClick={handleStopShare}
                  className="w-full gap-2 bg-red-900/50 hover:bg-red-900/70 text-red-400 border border-red-600/50"
                >
                  <StopCircle className="w-4 h-4" />
                  Stop Sharing
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleStartScreenShare}
                    className="w-full gap-2 bg-purple-900/50 hover:bg-purple-900/70 text-purple-400 border border-purple-600/50 justify-start"
                  >
                    <Monitor className="w-4 h-4" />
                    Share Screen
                  </Button>
                  <Button
                    onClick={handleStartWindowShare}
                    className="w-full gap-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-600/30 justify-start"
                  >
                    <Monitor className="w-4 h-4" />
                    Share Window
                  </Button>
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