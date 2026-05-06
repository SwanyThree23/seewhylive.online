import React from 'react';
import { motion } from 'framer-motion';

/**
 * SignalBars — animated 5-bar broadcast signal indicator.
 * Permanent brand signature component used across header, chat, studio.
 */
export default function SignalBars({ count = 5, active = true, size = 'sm', className = '' }) {
  const heights = [3, 5, 7, 9, 11]; // px heights per bar
  const scale = size === 'xs' ? 0.7 : size === 'sm' ? 1 : size === 'md' ? 1.4 : 1.8;

  return (
    <div className={`flex items-end gap-[2px] ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-[1px]"
          style={{
            width: Math.round(3 * scale),
            height: Math.round(heights[i] * scale),
            background: active
              ? `hsl(${100 + i * 10}, 100%, 55%)`
              : 'rgba(255,255,255,0.15)',
          }}
          animate={active ? {
            scaleY: [1, 1.4 + i * 0.1, 0.7, 1.2, 1],
            opacity: [0.7, 1, 0.8, 1, 0.7],
          } : { scaleY: 1, opacity: 0.2 }}
          transition={{
            duration: 0.8 + i * 0.1,
            repeat: Infinity,
            delay: i * 0.12,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}