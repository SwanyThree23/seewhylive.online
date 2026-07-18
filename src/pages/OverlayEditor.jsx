import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Layers, Bell, Palette, Target, Info, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AlertConfig from '@/components/live/AlertConfig';
import OverlayThemeBuilder from '@/components/live/OverlayThemeBuilder';
import StreamerGoalsWidget from '../components/monetization/StreamerGoalsWidget';
import SoundboardWidget from '../components/live/SoundboardWidget';
import SceneSwitcher from '../components/live/SceneSwitcher';
import LowerThirdsBanner from '@/components/live/LowerThirdsBanner';
import RoomBrandingEditor from '../components/live/RoomBrandingEditor';
import StreamMetricsBar from '../components/live/StreamMetricsBar';
import ChatOverlay from '../components/live/ChatOverlay';
import AuraPanelDrawer from '../components/live/AuraPanelDrawer';
import InteractivePollWidget from '../components/streaming/InteractivePollWidget';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import StreamGoals from '../components/live/StreamGoals';
import ShareToSocial from '../components/social/ShareToSocial';


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
  const [activeTab, setActiveTab] = useState('theme');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  const roomId = new URLSearchParams(window.location.search).get('room_id');

  const { data: liveRoom } = useQuery({
    queryKey: ['my-live-room-overlay', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }, '-created_date', 1).then(r => r?.[0]),
    enabled: !!user?.id,
  });

  const { data: activeRoom } = useQuery({
    queryKey: ['overlayeditor-active-room', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 border-b flex items-center justify-between flex-wrap gap-3"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5" style={{ color: GOLD }} />
          <div>
            <h1 className="text-xl font-black text-white leading-none" style={T}>Overlay &amp; Branding</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {liveRoom ? `Active room: ${liveRoom.title}` : 'Customize alerts, themes, and stream goals'}
            </p>
          </div>
        </div>
        {liveRoom && (
          <span className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full uppercase animate-pulse"
            style={{ ...T, background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)', color: '#C0392B' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Live Now
          </span>
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
