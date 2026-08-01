import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, Tooltip } from 'recharts';
import SafeResponsiveContainer from '@/components/shared/SafeChart';
import { Users } from 'lucide-react';
import confetti from 'canvas-confetti';

const MILESTONES = [10, 25, 50, 100, 500, 1000];

export default function ViewerCount({ count = 0, peakViewers = 0 }) {
  const [displayed, setDisplayed] = useState(count);
  const [history, setHistory] = useState(Array.from({ length: 20 }, () => ({ v: count })));
  const prevRef = useRef(count);

  useEffect(() => {
    const diff = count - displayed;
    if (diff === 0) return;
    const step = diff > 0 ? 1 : -1;
    const steps = Math.min(Math.abs(diff), 10);
    let current = displayed;
    const interval = setInterval(() => {
      current += step;
      setDisplayed(current);
      if (current === count) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [count]);

  useEffect(() => {
    setHistory(prev => [...prev.slice(-59), { v: count }]);
    const prevCount = prevRef.current;
    const hitMilestone = MILESTONES.find(m => prevCount < m && count >= m);
    if (hitMilestone) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.3 }, colors: ['#d4af37', '#f5e6a3', '#D4AF37'] });
    }
    prevRef.current = count;
  }, [count]);

  const sparkMin = Math.min(...history.map(h => h.v));
  const sparkMax = Math.max(...history.map(h => h.v));

  return (
    <div className="flex flex-col items-center gap-0.5">
      <motion.div
        key={displayed}
        initial={{ scale: 1.3, color: '#D4AF37' }}
        animate={{ scale: 1, color: '#ffffff' }}
        transition={{ duration: 0.3 }}
        className="text-2xl font-bold font-mono leading-none"
      >
        {displayed.toLocaleString()}
      </motion.div>
      <div className="flex items-center gap-1 text-[10px] text-white/50">
        <Users className="w-2.5 h-2.5" />
        <span>viewers</span>
      </div>
      {peakViewers > 0 && (
        <p className="text-[11px] text-[#d4af37]/70">Peak: {peakViewers.toLocaleString()}</p>
      )}
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