import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, Tooltip } from 'recharts';
import SafeResponsiveContainer from '@/components/shared/SafeChart';
import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import confetti from 'canvas-confetti';

const MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 5000];

function getNextMilestone(count) {
  return MILESTONES.find(m => m > count) ?? null;
}

function getPerMinuteDelta(history) {
  if (history.length < 2) return 0;
  const recent = history.slice(-6);
  const diff = recent[recent.length - 1].v - recent[0].v;
  return Math.round(diff);
}

export default function ViewerCount({ count = 0, peakViewers = 0 }) {
  const [displayed, setDisplayed]       = useState(count);
  const [history, setHistory]           = useState(Array.from({ length: 20 }, () => ({ v: count })));
  const [deltaFlash, setDeltaFlash]     = useState(null);
  const prevRef = useRef(count);

  // Animate counter toward real count
  useEffect(() => {
    const diff = count - displayed;
    if (diff === 0) return;
    const step = diff > 0 ? 1 : -1;
    let current = displayed;
    const interval = setInterval(() => {
      current += step;
      setDisplayed(current);
      if (current === count) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [count]);

  // Track history and milestone confetti
  useEffect(() => {
    setHistory(prev => [...prev.slice(-59), { v: count }]);
    const prevCount = prevRef.current;
    const diff = count - prevCount;
    const hitMilestone = MILESTONES.find(m => prevCount < m && count >= m);
    if (hitMilestone) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.3 }, colors: ['#d4af37', '#f5e6a3', '#D4AF37'] });
    }
    prevRef.current = count;
    if (diff !== 0) {
      setDeltaFlash(diff);
      const t = setTimeout(() => setDeltaFlash(null), 2500);
      return () => clearTimeout(t);
    }
  }, [count]);

  const perMinute  = getPerMinuteDelta(history);
  const nextMile   = getNextMilestone(count);
  const awayFromNext = nextMile != null ? nextMile - count : null;
  const trendDir   = perMinute > 0 ? 'up' : perMinute < 0 ? 'down' : 'flat';

  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Main count */}
      <div className="relative flex items-center gap-1">
        <motion.div
          key={displayed}
          initial={{ scale: 1.3, color: '#D4AF37' }}
          animate={{ scale: 1, color: '#ffffff' }}
          transition={{ duration: 0.3 }}
          className="text-2xl font-bold font-mono leading-none"
        >
          {displayed.toLocaleString()}
        </motion.div>

        {/* Trend arrow */}
        <div className="flex flex-col items-center justify-center" style={{ marginBottom: 2 }}>
          {trendDir === 'up' && <TrendingUp className="w-3.5 h-3.5 text-[#6DBF7E]" />}
          {trendDir === 'down' && <TrendingDown className="w-3.5 h-3.5 text-[#C0392B]" />}
          {trendDir === 'flat' && <Minus className="w-3.5 h-3.5 text-white/20" />}
        </div>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-white/50">
        <Users className="w-2.5 h-2.5" />
        <span>viewers</span>
      </div>

      {/* Per-minute delta badge */}
      <AnimatePresence>
        {deltaFlash !== null && deltaFlash !== 0 && (
          <motion.span
            key={deltaFlash}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="text-[10px] font-bold font-mono"
            style={{ color: deltaFlash > 0 ? '#6DBF7E' : '#C0392B' }}
          >
            {deltaFlash > 0 ? `+${deltaFlash}` : deltaFlash}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Per-minute rate when stable */}
      {deltaFlash === null && perMinute !== 0 && (
        <span className="text-[9px] font-mono" style={{ color: perMinute > 0 ? '#6DBF7E' : '#C0392B' }}>
          {perMinute > 0 ? `+${perMinute}` : perMinute}/min
        </span>
      )}

      {peakViewers > 0 && (
        <p className="text-[10px] text-[#d4af37]/70">Peak: {peakViewers.toLocaleString()}</p>
      )}

      {/* Next milestone progress bar */}
      {nextMile != null && awayFromNext != null && awayFromNext > 0 && (
        <div className="w-full mt-1">
          <div className="flex justify-between text-[9px] mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span>{count.toLocaleString()}</span>
            <span style={{ color: '#C9A84C' }}>→ {nextMile.toLocaleString()}</span>
          </div>
          <div className="h-0.5 bg-white/10 rounded-full overflow-hidden w-20 mx-auto">
            <motion.div
              className="h-full rounded-full"
              style={{ background: '#C9A84C' }}
              animate={{ width: `${Math.min(100, (count / nextMile) * 100)}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>
      )}

      {/* Sparkline */}
      {history.length > 3 && (
        <div className="w-20 h-8 mt-1">
          <SafeResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <Line type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={1.5} dot={false} />
            </LineChart>
          </SafeResponsiveContainer>
        </div>
      )}
    </div>
  );
}
