import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame, TrendingUp } from 'lucide-react';

export default function PartyHypeMeter({ partyId, memberCount, onHypeChange }) {
  const [hypeLevel, setHypeLevel] = useState(0);
  const [prevReactions, setPrevReactions] = useState(0);
  const rateRef = useRef([]);

  const { data: reactions = [] } = useQuery({
    queryKey: ['party-reactions-hype', partyId],
    queryFn: () => base44.entities.PartyReaction.filter({ party_id: partyId }, '-created_date', 50),
    enabled: !!partyId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    const now = Date.now();
    const recentCount = reactions.filter(r => {
      const t = new Date(r.created_date).getTime();
      return now - t < 30000; // last 30 seconds
    }).length;
    rateRef.current.push({ time: now, count: recentCount });
    rateRef.current = rateRef.current.filter(r => now - r.time < 10000);

    // Hype = reactions per 30s normalized, with member count factor
    const normalized = Math.min(100, (recentCount / Math.max(1, memberCount)) * 200);
    const rounded = Math.round(normalized);
    setHypeLevel(rounded);
    onHypeChange?.(rounded);
  }, [reactions.length, memberCount]);

  const hypeColor = hypeLevel >= 80 ? '#FF1564' : hypeLevel >= 50 ? '#FF8C00' : hypeLevel >= 25 ? '#d4af37' : '#8B5CF6';
  const hypeLabel = hypeLevel >= 80 ? '🔥 ON FIRE' : hypeLevel >= 50 ? '⚡ HYPED' : hypeLevel >= 25 ? '📈 Building' : '😴 Chill';

  return (
    <div className="rounded-xl px-3 py-2 flex items-center gap-3"
      style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${hypeColor}20` }}>
      <Flame className="w-4 h-4 shrink-0" style={{ color: hypeColor }} />
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-black uppercase" style={{ color: hypeColor, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {hypeLabel}
          </span>
          <span className="text-[11px] font-mono text-white/30">{hypeLevel}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${hypeLevel}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            style={{ background: `linear-gradient(90deg, ${hypeColor}66, ${hypeColor})` }}
          />
        </div>
      </div>
    </div>
  );
}