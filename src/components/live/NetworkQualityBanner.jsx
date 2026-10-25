import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, X, RefreshCw } from 'lucide-react';

export default function NetworkQualityBanner({ quality, rtt }) {
  const [dismissed, setDismissed] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(null);
  const [prevQuality, setPrevQuality] = useState(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    if (quality === 'excellent' || quality === 'good' || quality === 'fair' ||
        (quality === 'poor' && prevQuality === 'offline')) {
      setDismissed(false);
      setRetryCountdown(null);
      clearInterval(countdownRef.current);
    }
    if (quality === 'offline' && prevQuality !== 'offline') {
      // Start 30s auto-retry countdown
      setRetryCountdown(30);
      clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setRetryCountdown(c => {
          if (c <= 1) {
            clearInterval(countdownRef.current);
            window.location.reload();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    setPrevQuality(quality);
    return () => clearInterval(countdownRef.current);
  }, [quality]);

  const isVisible = !dismissed && (quality === 'poor' || quality === 'offline');

  const isOffline = quality === 'offline';
  const bg     = isOffline ? 'rgba(128,0,32,0.95)' : 'rgba(192,80,0,0.92)';
  const border = isOffline ? 'rgba(192,57,43,0.6)' : 'rgba(212,130,0,0.5)';
  const color  = '#fff';

  const contextMsg = prevQuality && prevQuality !== quality && prevQuality !== 'offline' && prevQuality !== 'poor'
    ? ` (was ${prevQuality})`
    : '';

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
              ? `No internet connection${retryCountdown != null ? ` — retrying in ${retryCountdown}s` : ' — reconnecting…'}`
              : `Weak connection${rtt != null ? ` (${Math.round(rtt)}ms RTT)` : ''}${contextMsg} — stream quality may be affected`}
          </span>

          {isOffline && (
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold opacity-90 hover:opacity-100 transition-opacity shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          )}

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
