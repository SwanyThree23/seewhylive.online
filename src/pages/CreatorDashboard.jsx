import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, BarChart3, ExternalLink, Scissors, Mail } from 'lucide-react';
import AnalyticsOverview from '@/components/dashboard/AnalyticsOverview';
import EarningsBreakdown from '@/components/dashboard/EarningsBreakdown';
import AudienceInsights from '@/components/dashboard/AudienceInsights';
import { Link } from 'react-router-dom';

const G = '#D4AF37';
const BG = '#080B18';

export default function CreatorDashboardPage() {
  const [timeRange, setTimeRange] = useState('7d');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6" style={{ color: G }} />
              <h1 className="text-3xl font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                Creator Dashboard
              </h1>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to="/onboarding">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background:'rgba(128,0,32,0.15)', border:'1px solid rgba(128,0,32,0.35)', color:'#ff9999', fontFamily:'Barlow Condensed', letterSpacing:1 }}>
                  ✨ SETUP GUIDE
                </button>
              </Link>
              <Link to="/clips">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.25)', color:G, fontFamily:'Barlow Condensed', letterSpacing:1 }}>
                  ✂️ CLIPS
                </button>
              </Link>
              <Link to="/newsletter">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background:'rgba(200,255,0,0.06)', border:'1px solid rgba(200,255,0,0.2)', color:'#C8FF00', fontFamily:'Barlow Condensed', letterSpacing:1 }}>
                  📧 NEWSLETTER
                </button>
              </Link>
            </div>
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

      {/* Quick Integration Links */}
      <div className="bg-[rgba(13,6,24,0.6)] border-b border-[rgba(212,175,55,0.1)] px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold text-white/50 uppercase mb-3 tracking-widest">Quick Access</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <a
              href="https://console.evmux.com/guest/840fa8ce-69fa-46a4-b361-c6982f4a52a6"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(212,175,55,0.08)] hover:bg-[rgba(212,175,55,0.15)] text-[#d4af37] text-xs font-semibold transition-all"
            >
              <span>Evmux Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://vdo.ninja/?view=Swan23&room=SCN&solo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(139,92,246,0.08)] hover:bg-[rgba(139,92,246,0.15)] text-purple-400 text-xs font-semibold transition-all"
            >
              <span>vdo.ninja</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://gobrunch.com/events/394017/597197"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(0,245,255,0.08)] hover:bg-[rgba(0,245,255,0.15)] text-cyan-400 text-xs font-semibold transition-all"
            >
              <span>GoBrunch Event</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://socialcontactnetwork.mn.co/share/biFSYntVmu5nh1LB"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,136,0,0.08)] hover:bg-[rgba(255,136,0,0.15)] text-orange-400 text-xs font-semibold transition-all"
            >
              <span>Community Network</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
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