import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Radio, Users, Trophy } from 'lucide-react';
import RoomCard from '../components/rooms/RoomCard';
import CommunityCard from '../components/communities/CommunityCard';
import ChallengeCard from '../components/community/ChallengeCard';


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
const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TABS = [
  { id: 'rooms',       label: 'Rooms',       icon: Radio },
  { id: 'communities', label: 'Communities', icon: Users },
  { id: 'challenges',  label: 'Challenges',  icon: Trophy },
];

export default function SearchPage() {
  const [query, setQuery]     = useState('');
  const [activeTab, setActiveTab] = useState('rooms');

  const { data: rooms = [] } = useQuery({
    queryKey: ['searchRooms', query],
    queryFn: () => base44.entities.Room.list('-created_date', 50),
  });

  const { data: communities = [] } = useQuery({
    queryKey: ['searchCommunities', query],
    queryFn: () => base44.entities.Community.list('-member_count', 50),
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['searchChallenges', query],
    queryFn: () => base44.entities.Challenge.list('-created_date', 50),
  });

  const q = query.toLowerCase();
  const filteredRooms       = rooms.filter(r => r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
  const filteredCommunities = communities.filter(c => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
  const filteredChallenges  = challenges.filter(ch => ch.title?.toLowerCase().includes(q) || ch.description?.toLowerCase().includes(q));

  const counts = { rooms: filteredRooms.length, communities: filteredCommunities.length, challenges: filteredChallenges.length };

  function EmptyState({ icon: Icon, label }) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Icon className="w-14 h-14 mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
        <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>{label}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: '#080B18' }}>
      {/* Sticky header + search bar */}
      <div className="sticky top-0 z-20"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2 px-4 h-12">
          <SearchIcon className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rooms, communities, challenges…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
          />
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full shrink-0 font-black uppercase text-[10px] transition-all"
              style={{
                background: activeTab === tab.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeTab === tab.id ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.4)',
                ...T,
              }}>
              <tab.icon className="w-3 h-3" />
              {tab.label}
              <span className="ml-0.5 opacity-60">({counts[tab.id]})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4">
        {activeTab === 'rooms' && (
          filteredRooms.length === 0
            ? <EmptyState icon={Radio} label="No rooms found" />
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map(room => <RoomCard key={room.id} room={room} />)}
              </div>
        )}

        {activeTab === 'communities' && (
          filteredCommunities.length === 0
            ? <EmptyState icon={Users} label="No communities found" />
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCommunities.map(c => <CommunityCard key={c.id} community={c} isMember={false} />)}
              </div>
        )}

        {activeTab === 'challenges' && (
          filteredChallenges.length === 0
            ? <EmptyState icon={Trophy} label="No challenges found" />
            : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredChallenges.map(ch => <ChallengeCard key={ch.id} challenge={ch} />)}
              </div>
        )}
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
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
