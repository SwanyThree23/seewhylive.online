import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Users, MessageSquare } from 'lucide-react';
import DiscussionFeed from '@/components/community/DiscussionFeed';
import SpotlightSection from '@/components/community/SpotlightSection';
import ReferralProgram from '@/components/community/ReferralProgram';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
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
import SpotlightBanner from '../components/community/SpotlightBanner';
import OnlinePresence from '../components/shared/OnlinePresence';
const G = '#D4AF37';
const BG = '#080B18';

export default function CommunityPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: community } = useQuery({
    queryKey: ['userCommunity', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const communities = await base44.entities.Community.filter({ creator_id: user.id }, '-created_date', 1);
      return communities?.[0];
    },
    enabled: !!user?.id,
  });

  const { data: membership } = useQuery({
    queryKey: ['my-membership', community?.id, user?.id],
    queryFn: () => base44.entities.CommunityMember.filter({ community_id: community.id, user_id: user.id }).then(r => r[0]),
    enabled: !!community?.id && !!user?.id,
  });

  const { data: memberCount = 0 } = useQuery({
    queryKey: ['community-member-count-page', community?.id],
    queryFn: async () => {
      const members = await base44.entities.CommunityMember.filter({ community_id: community.id });
      return members?.length || 0;
    },
    enabled: !!community?.id,
  });

  const { data: liveRooms = [] } = useQuery({
    queryKey: ['community-live-rooms', community?.id],
    queryFn: () => base44.entities.Room.filter({ community_id: community.id, status: 'live' }, '-viewer_count', 10),
    enabled: !!community?.id,
    refetchInterval: 20000,
  });

  const joinMut = useMutation({
    mutationFn: () => base44.entities.CommunityMember.create({ community_id: community.id, user_id: user.id, role: 'member', joined_date: new Date().toISOString() }),
    onSuccess: () => {
      toast.success(`Joined ${community.name}!`);
      qc.invalidateQueries({ queryKey: ['my-membership'] });
      qc.invalidateQueries({ queryKey: ['community-member-count-page'] });
      base44.entities.Activity.create({
        user_id: user.id,
        type: 'community_joined',
        title: `Joined ${community.name}`,
        description: community.description || '',
      }).catch(() => {});
    },
    onError: () => toast.error('Action failed.'),
  });

  const leaveMut = useMutation({
    mutationFn: () => base44.entities.CommunityMember.delete(membership.id),
    onSuccess: () => { toast.success('Left community'); qc.invalidateQueries({ queryKey: ['my-membership'] }); qc.invalidateQueries({ queryKey: ['community-member-count-page'] }); },
    onError: () => toast.error('Action failed.'),
  });

  const isMember = !!membership;
  const isAdmin = membership?.role === 'admin' || membership?.role === 'owner';
  const isOwner = membership?.role === 'owner' || community?.creator_id === user?.id;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="w-10 h-10 rounded-full animate-spin" style={{ border: `3px solid ${G}`, borderTopColor: 'transparent' }} />
    </div>
  );

  if (!community) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4" style={{ background: BG }}>
      <Users className="w-16 h-16 mb-4" style={{ color: 'rgba(255,255,255,0.08)' }} />
      <h2 className="text-2xl font-black text-white mb-2" style={T}>No Community Yet</h2>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {communityIdParam ? 'Community not found.' : "You haven't joined or created a community."}
      </p>
      <Link to={createPageUrl('CreateCommunity')}>
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase text-sm"
          style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${G})`, color: '#000', border: 'none', cursor: 'pointer', ...T }}>
          <Plus className="w-4 h-4" /> Create Community
        </button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-6 md:px-8 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6" style={{ color: G }} />
            <h1 className="text-3xl font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
              Community Hub
            </h1>
          </div>
          <p className="text-white/60">Connect with your audience, share content, and build relationships</p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {community?.id ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-2"
            >
              <DiscussionFeed communityId={community.id} />
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <SpotlightSection communityId={community.id} />
              <ReferralProgram communityId={community.id} />
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/40">Create a community to get started</p>
          </div>
        )}
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="community" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SpotlightBanner communityId={null} isAdmin={isAdmin} />
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={user?.id} roomId={null} currentUser={user} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
      <OnlinePresence userId={null} />
  );
}