import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Camera, MessageSquare, Heart, DollarSign, MoreHorizontal, X, RotateCcw } from 'lucide-react';

export default function MobileStreamControls({ micMuted, onMicToggle, onReact, onQuickTip, roomId }) {
  const [showChat, setShowChat] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [facing, setFacing] = useState('user');
  const [hypeCount, setHypeCount] = useState(0);

  const handleFlipCamera = () => {
    setFacing(f => f === 'user' ? 'environment' : 'user');
  };

  const handleHype = () => {
    onReact?.('🔥');
    onReact?.('🔥');
    onReact?.('🔥');
    onReact?.('🔥');
    onReact?.('🔥');
    setHypeCount(c => c + 5);
    setTimeout(() => setHypeCount(0), 2000);
  };

  return (
    <>
      {/* Fixed bottom control strip */}
      <motion.div
        initial={{ y: 80 }} animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
      >
        <div className="bg-black/80 border-t border-white/10 px-4 py-3"
          style={{ backdropFilter: 'blur(16px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
          <div className="flex items-center justify-around">
            {/* Mic */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onMicToggle}
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center gap-0.5 ${
                micMuted ? 'bg-red-700/80 border-2 border-red-600' : 'bg-white/10 border border-white/20'
              }`}
            >
              {micMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
              <span className="text-[8px] text-white/60">{micMuted ? 'Muted' : 'Live'}</span>
            </motion.button>

            {/* Flip Camera */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleFlipCamera}
              className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center gap-0.5"
            >
              <RotateCcw className="w-5 h-5 text-white" />
              <span className="text-[8px] text-white/60">Flip</span>
            </motion.button>

            {/* Toggle Chat */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowChat(!showChat)}
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center gap-0.5 ${
                showChat ? 'bg-[#00d4ff]/20 border border-[#00d4ff]/50' : 'bg-white/10 border border-white/20'
              }`}
            >
              <MessageSquare className="w-5 h-5 text-white" />
              <span className="text-[8px] text-white/60">Chat</span>
            </motion.button>

            {/* Quick React */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => onReact?.('❤️')}
              className="w-12 h-12 rounded-full bg-red-900/40 border border-red-700/40 flex flex-col items-center justify-center gap-0.5"
            >
              <span className="text-xl">❤️</span>
              <span className="text-[8px] text-white/60">React</span>
            </motion.button>

            {/* Quick Tip */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onQuickTip}
              className="w-12 h-12 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 flex flex-col items-center justify-center gap-0.5"
            >
              <DollarSign className="w-5 h-5 text-[#d4af37]" />
              <span className="text-[8px] text-white/60">Tip</span>
            </motion.button>

            {/* More */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMore(!showMore)}
              className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center gap-0.5"
            >
              <MoreHorizontal className="w-5 h-5 text-white" />
              <span className="text-[8px] text-white/60">More</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* More options drawer */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setShowMore(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed bottom-0 left-0 right-0 bg-[#0d0618] border-t border-[rgba(212,175,55,0.2)] rounded-t-2xl z-50 md:hidden p-4"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <p className="text-sm font-semibold text-white/60 mb-3">Quick Actions</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🎯', label: 'Goals', action: () => {} },
                  { icon: '✂️', label: 'Clip', action: () => {} },
                  { icon: '🚀', label: 'Raid', action: () => {} },
                  { icon: '📊', label: 'Poll', action: () => {} },
                  { icon: '❓', label: 'Q&A', action: () => {} },
                  { icon: '⚙️', label: 'Settings', action: () => {} },
                ].map(item => (
                  <button key={item.label} onClick={() => { item.action(); setShowMore(false); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[10px] text-white/60">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hype counter */}
      <AnimatePresence>
        {hypeCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-24 left-4 bg-red-600 text-white font-bold rounded-full px-3 py-1 text-sm z-40 md:hidden"
          >
            +{hypeCount} 🔥
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}