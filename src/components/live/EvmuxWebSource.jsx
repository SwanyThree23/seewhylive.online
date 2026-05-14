import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX } from 'lucide-react';

export default function EvmuxWebSource({ isActive, onClose }) {
  const [isMuted, setIsMuted] = useState(false);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute inset-0 z-40 rounded-lg overflow-hidden bg-black"
      >
        {/* Web source iframe */}
        <iframe
          src="https://publicfiles.evmux.com/static/websources/websource-demo.v7.html"
          className="w-full h-full border-0"
          allow="autoplay"
          title="Evmux Web Source"
        />
        
        {/* Controls overlay */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-50">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/60 hover:bg-black/80 text-white/70 hover:text-white transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/60 hover:bg-black/80 text-white/70 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}