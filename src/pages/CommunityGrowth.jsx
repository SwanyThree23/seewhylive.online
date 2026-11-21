import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Gift, Megaphone, TrendingUp } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ReferralProgram from '../components/community/ReferralProgram';
import ChallengeCard from '../components/community/ChallengeCard';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';
import AnnouncementPanel from '../components/community/AnnouncementPanel';
import AnnouncementFeed from '../components/community/AnnouncementFeed';
import SpotlightSection from '../components/community/SpotlightSection';
import CreatePollModal from '../components/community/CreatePollModal';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import ShopDashboard from '../components/merch/ShopDashboard';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CreatorBridge from '../components/social/CreatorBridge';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';

var BG = '#080B18';
var GOLD = '#D4AF37';
var CRIMSON = '#800020';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };

var TABS = [
  { id: 'challenges', label: 'Challenges', icon: Trophy },
  { id: 'referrals', label: 'Referrals', icon: Gift },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
];

export default function CommunityGrowthPage() {
  var [searchParams] = useSearchParams();
  var communityId = searchParams.get('id');
  var [selectedChallenge, setSelectedChallenge] = useState(null);
  var [activeTab, setActiveTab] = useState('challenges');

  var { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, null);

  var { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => base44.entities.Community.filter({ id: communityId }).then(c => c[0]),
    enabled: !!communityId,
  });

  var { data: membership } = useQuery({
    queryKey: ['membership', communityId, (user && user.id)],
    queryFn: () => base44.entities.CommunityMember.filter({ community_id: communityId, user_id: (user && user.id) }).then(m => m[0]),
    enabled: !!communityId && !!user,
  });

  var { data: challenges = [] } = useQuery({
    queryKey: ['challenges', communityId],
    queryFn: () => base44.entities.Challenge.filter({ community_id: communityId }, '-start_date'),
    enabled: !!communityId,
  });

  var { data: userParticipation = [] } = useQuery({
    queryKey: ['challengeParticipation', (user && user.id)],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ user_id: (user && user.id) }),
    enabled: !!user,
  });

  var isAdmin = (membership && membership.role) === 'admin' || (membership && membership.role) === 'owner';

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
              var Icon = tab.icon;
              var active = activeTab === tab.id;
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
                      userId={(user && user.id)}
                    />
                  </div>
                ))}
                {challenges.filter(c => c.status === 'active').length === 0 && (
                  <div className="text-center py-12 rounded-2xl"
                    style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
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
                      <ChallengeCard key={challenge.id} challenge={challenge} userId={(user && user.id)} />
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
                  style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
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
            <ReferralProgram communityId={communityId} userId={(user && user.id)} />
          </div>
        )}

        {/* Announcements */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isAdmin && (
              <div>
                <AnnouncementPanel communityId={communityId} userId={(user && user.id)} />
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          <OnlineUsersGrid compact maxVisible={10} />
          <ContentRecommendations />
          <CollaborationMatcher />
          <SpotlightSection communityId={communityId || null} />
          <CreatePollModal isOpen={false} onClose={() => {}} communityId={communityId || null} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to={createPageUrl('Communities')} style={{ textDecoration: 'none' }}>
            <span className="font-black uppercase text-[10px] px-3 py-1.5 rounded-xl" style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', display: 'block', cursor: 'pointer' }}>← Communities</span>
          </Link>
          <Link to={createPageUrl('CommunityAdmin')} style={{ textDecoration: 'none' }}>
            <span className="font-black uppercase text-[10px] px-3 py-1.5 rounded-xl" style={{ background: 'rgba(128,0,32,0.08)', border: '1px solid rgba(128,0,32,0.25)', color: '#ff6666', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', display: 'block', cursor: 'pointer' }}>⚙️ Admin</span>
          </Link>
          <Link to={createPageUrl('CommunitySettings')} style={{ textDecoration: 'none' }}>
            <span className="font-black uppercase text-[10px] px-3 py-1.5 rounded-xl" style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', display: 'block', cursor: 'pointer' }}>⚡ Settings</span>
          </Link>
        </div>
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={null} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={null} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      {/* Creator Studios */}
      <div style={{ margin: '0 0 16px', padding: 16, borderRadius: 16, border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(13,6,24,0.5)' }}>
        <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(176,102,204,0.7)', marginBottom: 12 }}>Creator Studios</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          {[
            { emoji: '🎬', label: 'Micro Drama', sub: 'Episode creator', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
            { emoji: '🎵', label: 'AI Music', sub: 'Beat & vocal studio', href: 'AIMusic', color: '#00A8E8' },
            { emoji: '🎙️', label: 'Podcast Studio', sub: 'AI-assisted pods', href: 'PodcastStudio', color: '#B066CC' },
          ].map(function(s) {
            return (
              <Link key={s.href} to={createPageUrl(s.href)} style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(123,45,139,0.18)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', marginTop: 2 }}>{s.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
          <div style={{ borderRadius: 12, padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC', cursor: 'pointer' }}>
            🎬 Launch Episode Creator Studio →
          </div>
        </Link>
      </div>
      <BackgroundCustomizer />
    </div>
  );
}
