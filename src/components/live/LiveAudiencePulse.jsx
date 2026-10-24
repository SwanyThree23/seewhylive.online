import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function LiveAudiencePulse({ roomId, isHost, viewerCount }) {
  const [engagementScore, setEngagementScore] = useState(50);
  const [chatVelocity, setChatVelocity] = useState(0);
  const [trend, setTrend] = useState('stable');
  const prevScoreRef = useRef(50);
  const peakScoreRef = useRef(50);
  const [peakScore, setPeakScore] = useState(50);

  const { data: recentMessages = [] } = useQuery({
    queryKey: ['pulse-messages', roomId],
    queryFn: () => base44.entities.Message.filter({ room_id: roomId }, '-created_date', 30),
    enabled: !!roomId,
    refetchInterval: 8000,
  });

  const { data: recentGifts = [] } = useQuery({
    queryKey: ['pulse-gifts', roomId],
    queryFn: () => base44.entities.Transaction.filter({ room_id: roomId, transaction_type: 'virtual_good' }, '-created_date', 20),
    enabled: !!roomId,
    refetchInterval: 15000,
  });

  useEffect(() => {
    const now = Date.now();
    const last60s = recentMessages.filter(m => now - new Date(m.created_date).getTime() < 60000).length;
    const rate = viewerCount > 0 ? (last60s / viewerCount) * 100 : last60s * 5;
    const newScore = Math.min(100, Math.max(5, Math.round(rate)));
    const prev = prevScoreRef.current;
    setTrend(newScore > prev + 5 ? 'up' : newScore < prev - 5 ? 'down' : 'stable');
    prevScoreRef.current = newScore;
    if (newScore > peakScoreRef.current) {
      peakScoreRef.current = newScore;
      setPeakScore(newScore);
    }
    setEngagementScore(newScore);
    setChatVelocity(last60s);
  }, [recentMessages.length, viewerCount]);

  const giftRate = recentGifts.filter(t => Date.now() - new Date(t.created_date).getTime() < 60000).length;

  const scoreColor = engagementScore >= 70 ? '#6DBF7E' : engagementScore >= 40 ? '#D4AF37' : '#C0392B';
  const chatColor = chatVelocity >= 20 ? '#6DBF7E' : chatVelocity >= 5 ? '#D4AF37' : 'rgba(200,185,165,0.35)';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // Viewer-only: just the engagement pill
  if (!isHost) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
        style={{ background: `${scoreColor}0D`, border: `1px solid ${scoreColor}25` }}>
        <span style={{ fontSize: 10 }}>⚡</span>
        <span className="text-[10px] font-black font-mono" style={{ color: scoreColor }}>{engagementScore}</span>
        {engagementScore >= 70 && <span className="text-[9px] font-black" style={{ color: '#6DBF7E' }}>🔥</span>}
      </div>
    );
  }

  // Host: full three-metric strip
  return (
    <div className="flex items-center gap-1.5">
      {/* Chat velocity */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
        style={{ background: `${chatColor}12`, border: `1px solid ${chatColor}30` }}>
        <span style={{ fontSize: 9 }}>💬</span>
        <span className="text-[9px] font-black font-mono" style={{ color: chatColor }}>{chatVelocity}/min</span>
      </div>

      {/* Gift rate */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
        style={{ background: giftRate > 0 ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${giftRate > 0 ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
        <span style={{ fontSize: 9 }}>🎁</span>
        <span className="text-[9px] font-black font-mono" style={{ color: giftRate > 0 ? '#D4AF37' : 'rgba(200,185,165,0.3)' }}>{giftRate}</span>
      </div>

      {/* Engagement score with mini bars */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
        style={{ background: `${scoreColor}0D`, border: `1px solid ${scoreColor}25` }}>
        <div className="flex items-end gap-0.5 h-3.5">
          {[engagementScore * 0.4, engagementScore * 0.6, engagementScore * 0.8, engagementScore, engagementScore * 0.9].map((h, i) => (
            <motion.div key={i}
              className="w-0.5 rounded-sm"
              animate={{ height: `${Math.max(3, h * 0.14)}px` }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{ background: scoreColor, opacity: 0.6 + i * 0.08 }}
            />
          ))}
        </div>
        <TrendIcon className="w-2.5 h-2.5" style={{ color: scoreColor }} />
        <span className="text-[9px] font-black font-mono" style={{ color: scoreColor }}>{engagementScore}</span>
        {engagementScore >= 70 && <span className="text-[8px] font-black" style={{ color: '#6DBF7E' }}>HOT</span>}
      </div>
      {peakScore > engagementScore + 5 && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <span style={{ fontSize: 9 }}>↑</span>
          <span className="text-[9px] font-black font-mono" style={{ color: 'rgba(212,175,55,0.6)' }}>{peakScore}</span>
        </div>
      )}
    </div>
  );
}
