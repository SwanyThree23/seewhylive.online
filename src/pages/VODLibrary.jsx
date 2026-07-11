import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Film, Scissors } from 'lucide-react';
import VODLibraryComponent from '@/components/vod/VODLibrary';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
const G = '#D4AF37';
const BG = '#0A0710';

export default function VODLibraryPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: stats } = useQuery({
    queryKey: ['vodStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { vods: 0, clips: 0, totalViews: 0 };
      const vods = await base44.entities.VODVideo.filter({ creator_id: user.id });
      const clips = await base44.entities.StreamClip.filter({ creator_id: user.id });
      const totalViews = (vods || []).reduce((sum, v) => sum + (v.views || 0), 0) + (clips || []).reduce((sum, c) => sum + (c.view_count || 0), 0);
      return { vods: vods?.length || 0, clips: clips?.length || 0, totalViews };
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <div className="px-4 py-8 md:px-8 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <Film className="w-6 h-6" style={{ color: G }} />
            <h1 className="text-3xl font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
              VOD Library
            </h1>
          </div>
          <p className="text-white/60">Manage your past streams, clips, and highlights</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: 'VODs', value: stats?.vods || 0, icon: '📹' },
            { label: 'Clips', value: stats?.clips || 0, icon: '✂️' },
            { label: 'Total Views', value: stats?.totalViews || 0, icon: '👁️' },
          ].map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(212,175,55,0.12)` }}>
              <div className="text-lg mb-1">{stat.icon}</div>
              <p className="text-[10px] text-white/60">{stat.label}</p>
              <p className="text-lg font-black" style={{ color: G }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {user?.id && <VODLibraryComponent creatorId={user.id} />}
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="vod" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={null} />
      <BackgroundCustomizer />
    </div>
  );
}