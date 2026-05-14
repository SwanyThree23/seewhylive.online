import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, BarChart3 } from 'lucide-react';
import AnalyticsOverview from '@/components/dashboard/AnalyticsOverview';
import EarningsBreakdown from '@/components/dashboard/EarningsBreakdown';
import AudienceInsights from '@/components/dashboard/AudienceInsights';

const G = '#D4AF37';
const BG = '#0A0710';

export default function CreatorDashboardPage() {
  const [timeRange, setTimeRange] = useState('7d');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <div className="px-4 py-8 md:px-8 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6" style={{ color: G }} />
            <h1 className="text-3xl font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
              Creator Dashboard
            </h1>
          </div>
          <p className="text-white/60">Analytics, earnings, and audience insights</p>

          {/* Time Range Selector */}
          <div className="flex gap-2 mt-4">
            {['7d', '30d', '365d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className="px-3 py-1.5 rounded text-xs font-bold transition-all"
                style={{
                  background: timeRange === range ? `${G}20` : 'rgba(255,255,255,0.03)',
                  color: timeRange === range ? G : 'rgba(255,255,255,0.5)',
                  border: timeRange === range ? `1px solid ${G}40` : '1px solid rgba(212,175,55,0.12)',
                }}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last Year'}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {user?.id && (
          <div className="space-y-8">
            {/* Main Analytics */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <AnalyticsOverview creatorId={user.id} timeRange={timeRange} />
            </motion.div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <EarningsBreakdown creatorId={user.id} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <AudienceInsights creatorId={user.id} />
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}