import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Layers, Bell, Palette } from 'lucide-react';
import AlertConfig from '@/components/live/AlertConfig';
import OverlayThemeBuilder from '@/components/live/OverlayThemeBuilder';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
const G = '#D4AF37';
const BG = '#0A0710';

export default function OverlayEditorPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: activeRoom } = useQuery({
    queryKey: ['overlayeditor-active-room', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <div className="px-4 py-8 md:px-8 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-6 h-6" style={{ color: G }} />
            <h1 className="text-3xl font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
              Overlay & Branding
            </h1>
          </div>
          <p className="text-white/60">Customize alerts, themes, and stream overlays</p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {user?.id && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Alerts */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <AlertConfig creatorId={user.id} />
            </motion.div>

            {/* Theme */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <OverlayThemeBuilder creatorId={user.id} />
            </motion.div>
          </div>
        )}
      </div>
      <SwanAIRecommendations roomId={activeRoomId} currentLayout="overlay" viewerCount={activeRoom?.viewer_count || 0} />
      <MilestoneAlerts userId={user?.id} roomId={activeRoomId} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={activeRoom?.viewer_count || 0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={user?.id || null} roomId={activeRoomId} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={activeRoom?.viewer_count || 0} peakViewers={activeRoom?.peak_viewers || 0} />
      <BackgroundCustomizer />
    </div>
  );
}