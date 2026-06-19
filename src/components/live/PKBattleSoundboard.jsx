import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Volume2 } from 'lucide-react';
import SoundboardWidget from './SoundboardWidget';

const G = '#D4AF37';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

export default function PKBattleSoundboard({ battleId, isBattleActive = false }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <AnimatePresence>
      {isBattleActive && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="rounded-lg overflow-hidden"
          style={{ background: PANEL, border: `1px solid ${BORDER}` }}
        >
          {/* Toggle header */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-3 py-2 flex items-center justify-between transition-all hover:bg-white/5"
            style={{ background: 'rgba(0,0,0,0.2)', borderBottom: isExpanded ? `1px solid ${BORDER}` : 'none' }}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: '#C0392B' }} />
              <span className="text-xs font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                HYPE SOUNDS
              </span>
            </div>
            <span className="text-xs" style={{ color: '#C0392B' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          </motion.button>

          {/* Soundboard content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3">
                  <SoundboardWidget isVisible={true} disabled={false} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}