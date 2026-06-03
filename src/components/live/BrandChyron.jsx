import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Radio, Users, DollarSign, Zap } from 'lucide-react';
import SignalBars from './SignalBars';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

/**
 * BrandChyron — permanent 34px bottom bar pinned to viewport.
 * Shows live platform stats + scrolling news ticker.
 * NEVER remove, hide, or conditionally render this component.
 */
export default function BrandChyron() {
  const [tickerX, setTickerX] = useState(0);
  const [time, setTime] = useState(new Date());

  // Platform live stats
  const { data: liveRooms = [] } = useQuery({
    queryKey: ['chyron-live'],
    queryFn: () => base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 5),
    refetchInterval: 15000,
  });

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const totalViewers = liveRooms.reduce((s, r) => s + (r.viewer_count || 0), 0);
  const liveCount = liveRooms.length;

  const tickerItems = [
    liveCount > 0 && `${liveCount} streams live now`,
    totalViewers > 0 && `${totalViewers.toLocaleString()} viewers online`,
    ...liveRooms.map(r => `🔴 ${r.title}`),
    'SeeWhy LIVE — Culture Creator Platform',
    '90% Creator Payouts · Multi-Panel Streaming · AURA AI',
  ].filter(Boolean);

  const tickerText = tickerItems.join('   ·   ');

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] h-[34px] flex items-center overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, #03030A 0%, #07070F 50%, #03030A 100%)',
        borderTop: '1px solid rgba(255,21,100,0.25)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, #FF1564, #FFB800, #00F5FF, #00FF88, #8B5CF6, transparent)' }}
      />

      {/* Left: brand + signal */}
      <div className="shrink-0 flex items-center gap-2 px-3 border-r border-white/5">
        <SignalBars count={5} active={liveCount > 0} size="xs" />
        <span className="text-[11px] font-bold text-[#FF1564] uppercase tracking-wider whitespace-nowrap">SeeWhy LIVE</span>
      </div>

      {/* Center: scrolling ticker */}
      <div className="flex-1 overflow-hidden relative mx-2">
        <motion.div
          className="flex whitespace-nowrap text-[10px] text-white/50"
          animate={{ x: [0, -2000] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          <span>{tickerText}&nbsp;&nbsp;&nbsp;{tickerText}&nbsp;&nbsp;&nbsp;</span>
        </motion.div>
      </div>

      {/* Right: clock + live count */}
      <div className="shrink-0 flex items-center gap-3 px-3 border-l border-white/5">
        {liveCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF1564] animate-pulse" />
            <span className="text-[11px] text-[#FF1564] font-bold font-mono">{liveCount} LIVE</span>
          </div>
        )}
        <span className="text-[11px] text-white/30 font-mono">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}