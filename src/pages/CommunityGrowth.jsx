import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Gift, Megaphone, TrendingUp } from 'lucide-react';
import ReferralProgram from '../components/community/ReferralProgram';
import ChallengeCard from '../components/community/ChallengeCard';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';
import AnnouncementPanel from '../components/community/AnnouncementPanel';
import AnnouncementFeed from '../components/community/AnnouncementFeed';


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
const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TABS = [
  { id: 'challenges', label: 'Challenges', icon: Trophy },
  { id: 'referrals', label: 'Referrals', icon: Gift },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
];

export default function CommunityGrowthPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const communityId = urlParams.get('id');
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [activeTab, setActiveTab] = useState('challenges');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => base44.entities.Community.filter({ id: communityId }).then(c => c[0]),
    enabled: !!communityId,
  });

  const { data: membership } = useQuery({
    queryKey: ['membership', communityId, user?.id],
    queryFn: () => base44.entities.CommunityMember.filter({ community_id: communityId, user_id: user?.id }).then(m => m[0]),
    enabled: !!communityId && !!user,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges', communityId],
    queryFn: () => base44.entities.Challenge.filter({ community_id: communityId }, '-start_date'),
    enabled: !!communityId,
  });

  const { data: userParticipation = [] } = useQuery({
    queryKey: ['challengeParticipation', user?.id],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ user_id: user?.id }),
    enabled: !!user,
  });

  const isAdmin = membership?.role === 'admin' || membership?.role === 'owner';

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <p className="font-black uppercase text-sm" style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 border-b"
        style={{ background: 'rgba(8,11,24,0.97)', borderColor: 'rgba(212,175,55,0.12)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 py-4">
            <TrendingUp className="w-5 h-5" style={{ color: GOLD }} />
            <div>
              <h1 className="text-xl font-black text-white leading-none" style={T}>{community.name}</h1>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Growth Hub — Engage members, drive growth</p>
            </div>
          </div>
          {/* Tab bar */}
          <div className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all"
                  style={{ ...T, color: active ? GOLD : 'rgba(255,255,255,0.35)', borderBottomColor: active ? GOLD : 'transparent', background: active ? 'rgba(212,175,55,0.05)' : 'transparent' }}>
                  <Icon className="w-3.5 h-3.5" />{tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Challenges */}
        {activeTab === 'challenges' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div>
                <h2 className="text-xl font-black text-white mb-0.5" style={T}>Active Challenges</h2>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Compete and earn rewards</p>
              </div>
              <div className="space-y-4">
                {challenges.filter(c => c.status === 'active').map((challenge) => (
                  <div key={challenge.id} onClick={() => setSelectedChallenge(challenge.id)} style={{ cursor: 'pointer' }}>
                    <ChallengeCard
                      challenge={challenge}
                      userParticipation={userParticipation.find(p => p.challenge_id === challenge.id)}
                      userId={user?.id}
                    />
                  </div>
                ))}
                {challenges.filter(c => c.status === 'active').length === 0 && (
                  <div className="text-center py-12 rounded-2xl"
                    style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
                    <Trophy className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: GOLD }} />
                    <p className="font-black uppercase text-xs" style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>No active challenges</p>
                  </div>
                )}
              </div>

              {challenges.filter(c => c.status === 'upcoming').length > 0 && (
                <div>
                  <h3 className="text-lg font-black text-white mb-3" style={T}>Coming Soon</h3>
                  <div className="space-y-4">
                    {challenges.filter(c => c.status === 'upcoming').map((challenge) => (
                      <ChallengeCard key={challenge.id} challenge={challenge} userId={user?.id} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              {selectedChallenge ? (
                <ChallengeLeaderboard challengeId={selectedChallenge} />
              ) : (
                <div className="text-center py-12 rounded-2xl"
                  style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
                  <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: GOLD }} />
                  <p className="text-xs" style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>Select a challenge to view leaderboard</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Referrals */}
        {activeTab === 'referrals' && (
          <div className="max-w-2xl">
            <ReferralProgram communityId={communityId} userId={user?.id} />
          </div>
        )}

        {/* Announcements */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isAdmin && (
              <div>
                <AnnouncementPanel communityId={communityId} userId={user?.id} />
              </div>
            )}
            <div className={isAdmin ? '' : 'lg:col-span-2'}>
              <div className="mb-4">
                <h2 className="text-xl font-black text-white mb-0.5" style={T}>Announcements</h2>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Stay updated with community news</p>
              </div>
              <AnnouncementFeed communityId={communityId} />
            </div>
          </div>
        )}
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={user?.id || null} roomId={null} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}
