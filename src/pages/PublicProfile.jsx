import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Users, Radio, Video, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import VideoLibrary from '../components/vod/VideoLibrary';
import FollowButton from '../components/shared/FollowButton';
import PresenceDot from '../components/shared/PresenceDot';
import ShareButtons from '../components/shared/ShareButtons';


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
import CreatorProfileSetup from '../components/profile/CreatorProfileSetup';
const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

export default function PublicProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: () => base44.entities.CreatorProfile.filter({ user_id: userId }).then(r => r[0]),
    enabled: !!userId,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['public-rooms', userId],
    queryFn: () => base44.entities.Room.filter({ host_id: userId, is_public: true }, '-created_date', 6),
    enabled: !!userId,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="w-10 h-10 rounded-full animate-spin" style={{ border: `3px solid ${GOLD}`, borderTopColor: 'transparent' }} />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4" style={{ background: BG }}>
      <div>
        <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
        <p className="text-lg font-black" style={{ color: 'rgba(255,255,255,0.5)', ...T }}>Profile not found</p>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>This user hasn't set up a profile yet.</p>
        <Link to="/">
          <button className="mt-4 px-5 py-2 rounded-xl font-black uppercase text-xs" style={{ background: CRIMSON, color: GOLD, border: `1px solid rgba(212,175,55,0.3)`, ...T }}>
            Go Home
          </button>
        </Link>
      </div>
    </div>
  );

  const liveRoom = rooms.find(r => r.status === 'live');

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Banner */}
      <div className="relative h-48 overflow-hidden" style={{ background: `linear-gradient(135deg, ${CRIMSON}44 0%, #0d0618 60%, #080B18 100%)` }}>
        {profile.banner_url && (
          <img src={profile.banner_url} className="w-full h-full object-cover absolute inset-0" alt="banner" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(8,11,24,0.9) 100%)' }} />
        {/* Gold shimmer border */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}44, transparent)` }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16" style={{ marginTop: -60 }}>
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
          {/* OCT Avatar */}
          <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
            <div className="absolute inset-0" style={{ clipPath: OCT, background: GOLD }} />
            <div className="absolute inset-[3px] flex items-center justify-center" style={{ clipPath: OCT, background: `linear-gradient(145deg, ${CRIMSON}99, #0d0618)` }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt={profile.display_name} style={{ clipPath: OCT }} />
                : <span className="text-3xl font-black" style={{ color: GOLD, ...T }}>{profile.display_name?.charAt(0)}</span>
              }
            </div>
          </div>

          <div className="flex-1 pt-2 sm:pt-10">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#fff', ...T }}>
                {profile.display_name}
                <PresenceDot userId={userId} size="md" />
              </h1>
              {profile.is_verified && <CheckCircle className="w-5 h-5" style={{ color: '#4fc3f7' }} />}
              {profile.category && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, ...T }}>
                  {profile.category}
                </span>
              )}
              {liveRoom && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase animate-pulse" style={{ background: 'rgba(255,21,100,0.15)', border: '1px solid rgba(255,21,100,0.4)', color: '#FF1564', ...T }}>
                  🔴 LIVE
                </span>
              )}
            </div>
            {profile.bio && <p className="text-sm mt-1 max-w-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>{profile.bio}</p>}
            <div className="flex gap-4 mt-2 text-sm">
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                <strong style={{ color: GOLD }}>{profile.subscriber_count || 0}</strong> subscribers
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                <strong style={{ color: GOLD }}>{profile.follower_count || 0}</strong> followers
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="sm:pt-10 flex gap-2 flex-wrap">
            {liveRoom && (
              <Link to={createPageUrl('Room') + `?id=${liveRoom.id}`}>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black uppercase text-xs" style={{ background: 'rgba(255,21,100,0.15)', border: '1px solid rgba(255,21,100,0.4)', color: '#FF1564', ...T }}>
                  <Radio className="w-3.5 h-3.5" /> Watch Live
                </button>
              </Link>
            )}
            <FollowButton targetUserId={userId} targetUserName={profile.display_name} />
            <ShareButtons url={window.location.href} title={`Check out ${profile.display_name} on SeeWhy LIVE`} />
            <Link to={createPageUrl('CreatorChannel') + `?id=${userId}`}>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black uppercase text-xs" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>
                <ExternalLink className="w-3.5 h-3.5" /> Full Channel
              </button>
            </Link>
          </div>
        </div>

        {/* Recent Rooms */}
        {rooms.length > 0 && (
          <div className="rounded-2xl mb-6 p-4" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <p className="text-xs font-black uppercase mb-3 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
              <Video className="w-4 h-4" /> Recent Streams
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {rooms.slice(0, 6).map(r => (
                <Link key={r.id} to={createPageUrl('Room') + `?id=${r.id}`}>
                  <div className="rounded-xl p-3 transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
                    <p className="text-xs font-black truncate" style={{ color: '#fff', ...T }}>{r.title}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{r.viewer_count || 0} viewers</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* VOD Library */}
        <VideoLibrary creatorId={userId} />
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="profile" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <CreatorProfileSetup user={user} isOpen={false} onClose={() => {}} />
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={null} roomId={null} currentUser={null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}
