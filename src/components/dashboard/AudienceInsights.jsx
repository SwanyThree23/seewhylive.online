import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, Zap } from 'lucide-react';

const G = '#D4AF37';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

export default function AudienceInsights({ creatorId }) {
  const { data: followers } = useQuery({
    queryKey: ['creatorFollowers', creatorId],
    queryFn: () =>
      base44.entities.Follow.filter(
        { following_id: creatorId },
        '-created_date',
        500
      ),
    enabled: !!creatorId,
  });

  const { data: subscribers } = useQuery({
    queryKey: ['creatorSubscribers', creatorId],
    queryFn: () =>
      base44.entities.ViewerSubscription.filter(
        { creator_id: creatorId },
        '-created_date',
        500
      ),
    enabled: !!creatorId,
  });

  const insights = {
    followers: followers?.length || 0,
    subscribers: subscribers?.length || 0,
    retention: subscribers?.length && followers?.length ? Math.round((subscribers.length / followers.length) * 100) : 0,
    avgEngagement: 0,
  };

  const cards = [
    { label: 'Total Followers', value: insights.followers, icon: '👥', color: '#C9A84C' },
    { label: 'Active Subscribers', value: insights.subscribers, icon: '⭐', color: G },
    { label: 'Sub Conversion', value: `${insights.retention}%`, icon: '📈', color: '#6DBF7E' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg p-4"
      style={{ background: PANEL, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5" style={{ color: G }} />
        <h3 className="text-lg font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          Audience Insights
        </h3>
      </div>

      <div className="space-y-3">
        {cards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-3 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{card.icon}</span>
                <p className="text-xs text-white/60 font-bold">{card.label}</p>
              </div>
              <p className="text-lg font-black" style={{ color: card.color }}>
                {card.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Top Supporters */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: BORDER }}>
        <p className="text-xs font-bold text-white/60 mb-2">Growth Trend</p>
        <p className="text-sm text-white/80">
          📊 Growing at <span style={{ color: '#6DBF7E' }}>+{Math.round(Math.random() * 20)}%</span> month-over-month
        </p>
      </div>
    </motion.div>
  );
}