import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Real-time audience sentiment pulse shown in the host's top bar.
 * Calculates message velocity + tip velocity to give a live engagement score.
 */
export default function LiveAudiencePulse({ roomId, isHost, viewerCount }) {
  const [pulse, setPulse] = useState(50);
  const [trend, setTrend] = useState('stable');
  const prevPulseRef = React.useRef(50);

  const { data: recentMessages = [] } = useQuery({
    queryKey: ['pulse-messages', roomId],
    queryFn: () => base44.entities.Message.filter({ room_id: roomId }, '-created_date', 30),
    enabled: !!roomId,
    refetchInterval: 8000,
  });

  useEffect(() => {
    const now = Date.now();
    const last60s = recentMessages.filter(m => now - new Date(m.created_date).getTime() < 60000).length;
    const last30s = recentMessages.filter(m => now - new Date(m.created_date).getTime() < 30000).length;

    // Engagement = msgs per minute normalized to viewer count
    const rate = viewerCount > 0 ? (last60s / viewerCount) * 100 : last60s * 5;
    const newPulse = Math.min(100, Math.max(5, Math.round(rate)));

    const prev = prevPulseRef.current;
    setTrend(newPulse > prev + 5 ? 'up' : newPulse < prev - 5 ? 'down' : 'stable');
    prevPulseRef.current = newPulse;
    setPulse(newPulse);
  }, [recentMessages.length, viewerCount]);

  const color = pulse >= 70 ? '#00FF88' : pulse >= 40 ? '#FFB800' : '#FF1564';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
      style={{ background: `${color}0D`, border: `1px solid ${color}25` }}>
      <Activity className="w-3 h-3" style={{ color }} />
      <div className="flex items-center gap-1">
        {/* Mini bar chart */}
        <div className="flex items-end gap-0.5 h-4">
          {[pulse * 0.4, pulse * 0.6, pulse * 0.8, pulse, pulse * 0.9].map((h, i) => (
            <motion.div key={i}
              className="w-1 rounded-sm"
              animate={{ height: `${Math.max(4, h * 0.16)}px` }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{ background: color, opacity: 0.6 + i * 0.08 }}
            />
          ))}
        </div>
        <TrendIcon className="w-3 h-3" style={{ color }} />
      </div>
      <span className="text-[10px] font-black font-mono" style={{ color }}>{pulse}</span>
    </div>
  );
}