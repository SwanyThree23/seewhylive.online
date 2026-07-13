import React from 'react';
import { motion } from 'framer-motion';

// Quality → bar color
const QUALITY_COLOR = {
  excellent: '#22c55e',
  good:      '#6DBF7E',
  fair:      '#F59E0B',
  poor:      '#EF4444',
  offline:   '#6B7280',
};

/**
 * SignalBars — animated broadcast signal indicator.
 *
 * Props:
 *   count    number   — how many bars to show (default 5)
 *   active   boolean  — whether the bars animate (default true)
 *   size     string   — 'xs' | 'sm' | 'md' | 'lg'
 *   quality  string   — 'excellent'|'good'|'fair'|'poor'|'offline'
 *                       when provided, overrides the default green gradient
 *   filledBars number — how many bars appear "lit" (default: all)
 */
export default function SignalBars({
  count = 5,
  active = true,
  size = 'sm',
  quality,
  filledBars,
  className = '',
}) {
  const heights = [3, 5, 7, 9, 11];
  const scale = size === 'xs' ? 0.7 : size === 'sm' ? 1 : size === 'md' ? 1.4 : 1.8;
  const qualityColor = quality ? QUALITY_COLOR[quality] : null;
  const lit = filledBars ?? count;

  return (
    <div className={`flex items-end gap-[2px] ${className}`}>
      {Array.from({ length: count }).map((_, i) => {
        const isFilled = i < lit;
        const barColor = isFilled
          ? (qualityColor ?? `hsl(${100 + i * 10}, 100%, 55%)`)
          : 'rgba(255,255,255,0.12)';

        return (
          <motion.div
            key={i}
            className="rounded-[1px]"
            style={{
              width: Math.round(3 * scale),
              height: Math.round(heights[Math.min(i, heights.length - 1)] * scale),
              background: active ? barColor : 'rgba(255,255,255,0.15)',
            }}
            animate={active && isFilled ? {
              scaleY: [1, 1.4 + i * 0.1, 0.7, 1.2, 1],
              opacity: [0.7, 1, 0.8, 1, 0.7],
            } : { scaleY: 1, opacity: isFilled ? 0.5 : 0.2 }}
            transition={active && isFilled ? {
              duration: 0.8 + i * 0.1,
              repeat: Infinity,
              delay: i * 0.12,
              ease: 'easeInOut',
            } : {}}
          />
        );
      })}
    </div>
  );
}
