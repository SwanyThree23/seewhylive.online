import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

const GOLD = '#D4AF37';

/**
 * Reusable pull-to-refresh wrapper.
 * Attaches touch-drag handlers to its wrapper (only fires when the page is
 * scrolled to the top), renders a gold refresh indicator, and calls onRefresh
 * on release past the threshold. Does not create a new scroll container, so
 * sticky headers and the app's window-level scrolling keep working.
 *
 * onRefresh may return a Promise; the spinner spins until it resolves.
 */
export default function PullToRefresh({ onRefresh, children, threshold = 65 }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  function onTouchStart(e) {
    if (window.scrollY > 0) { pulling.current = false; return; }
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }
  function onTouchMove(e) {
    if (!pulling.current || window.scrollY > 0) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      e.preventDefault();
      setPullY(Math.min(dy * 0.45, threshold + 20));
    }
  }
  async function onTouchEnd() {
    if (!pulling.current) { setPullY(0); return; }
    pulling.current = false;
    if (pullY >= threshold && !refreshing) {
      setRefreshing(true);
      setPullY(threshold);
      try { await onRefresh?.(); } catch {}
      setRefreshing(false);
    }
    setPullY(0);
  }

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <motion.div
        style={{ height: pullY, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        {pullY > 10 && (
          <motion.div
            animate={refreshing ? { rotate: 360 } : { rotate: pullY * 4 }}
            transition={refreshing ? { repeat: Infinity, duration: 0.6, ease: 'linear' } : {}}
            style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid rgba(212,175,55,0.3)`, borderTopColor: GOLD }}
          />
        )}
      </motion.div>
      {children}
    </div>
  );
}