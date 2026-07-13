import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, X } from 'lucide-react';

/**
 * NetworkQualityBanner
 *
 * Shows a dismissible banner when connection quality drops to 'poor' or 'offline'.
 * Auto-hides when quality recovers to 'fair' or better.
 *
 * Props:
 *   quality — 'excellent'|'good'|'fair'|'poor'|'offline'
 *   rtt     — round-trip-time in ms (null when unknown)
 */
export default function NetworkQualityBanner({ quality, rtt }) {
  const [dismissed, setDismissed] = useState(false);

  // Re-show banner if quality worsens again after dismissal
  useEffect(() => {
    if (quality === 'excellent' || quality === 'good' || quality === 'fair') {
      setDismissed(false);
    }
  }, [quality]);

  const isVisible = !dismissed && (quality === 'poor' || quality === 'offline');

  const isOffline = quality === 'offline';
  const bg     = isOffline ? 'rgba(128,0,32,0.95)' : 'rgba(192,80,0,0.92)';
  const border = isOffline ? 'rgba(192,57,43,0.6)' : 'rgba(212,130,0,0.5)';
  const color  = '#fff';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-0 inset-x-0 z-[100] flex items-center gap-3 px-4 py-2.5"
          style={{ background: bg, borderBottom: `1px solid ${border}`, color }}
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        >
          {isOffline
            ? <WifiOff className="w-4 h-4 shrink-0" style={{ color: '#ffaaaa' }} />
            : <Wifi className="w-4 h-4 shrink-0" style={{ color: '#ffd080' }} />}

          <span className="text-sm font-bold flex-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            {isOffline
              ? 'No internet connection — reconnecting…'
              : `Weak connection${rtt != null ? ` (${Math.round(rtt)}ms RTT)` : ''} — stream quality may be affected`}
          </span>

          <button
            onClick={() => setDismissed(true)}
            className="flex items-center justify-center w-6 h-6 rounded opacity-70 hover:opacity-100 transition-opacity shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
