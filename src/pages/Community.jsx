import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, MessageSquare, Settings, TrendingUp, UserPlus, UserCheck, Shield, Radio, CheckCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import DiscussionFeed from '@/components/community/DiscussionFeed';
import SpotlightSection from '@/components/community/SpotlightSection';
import SpotlightBanner from '../components/community/SpotlightBanner';
import ReferralProgram from '@/components/community/ReferralProgram';
import CreatePollModal from '../components/community/CreatePollModal';
import InteractivePollingSystem from '../components/live/InteractivePollingSystem';
import UnifiedChat from '../components/live/UnifiedChat';
import ShareModal from '../components/live/ShareModal';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ShareToSocial from '../components/social/ShareToSocial';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import StreamGoals from '../components/live/StreamGoals';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';

const G = '#D4AF37';
const BG = '#080B18';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TABS = [
  { id: 'feed', label: 'Feed', icon: MessageSquare },
  { id: 'spotlight', label: 'Spotlight', icon: TrendingUp },
  { id: 'rooms', label: 'Live', icon: Radio },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('feed');
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const qc = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const communityIdParam = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: community, isLoading } = useQuery({
    queryKey: ['community-page', communityIdParam, user?.id],
    queryFn: async () => {
      if (communityIdParam) {
        const list = await base44.entities.Community.filter({ id: communityIdParam });
        return list?.[0] || null;
      }
      if (!user?.id) return null;
      const owned = await base44.entities.Community.filter({ creator_id: user.id }, '-created_date', 1);
      if (owned?.[0]) return owned[0];
      const memberships = await base44.entities.CommunityMember.filter({ user_id: user.id }, '-joined_date', 1);
      if (memberships?.[0]?.community_id) {
        const joined = await base44.entities.Community.filter({ id: memberships[0].community_id });
        return joined?.[0] || null;
      }
      return null;
    },
    enabled: !!communityIdParam || !!user?.id,
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
      {/* Banner */}
      <div className="relative overflow-hidden" style={{ height: 160 }}>
        {community.banner_url
          ? <img src={community.banner_url} className="w-full h-full object-cover absolute inset-0" alt="" />
          : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${CRIMSON}44 0%, #080B18 60%)` }} />
        }
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(8,11,24,0.95) 100%)' }} />
      </div>

      {/* Community identity */}
      <div className="max-w-7xl mx-auto px-4 md:px-6" style={{ marginTop: -48 }}>
        <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl shrink-0 flex items-center justify-center font-black text-3xl"
            style={{ background: community.avatar_url ? undefined : `linear-gradient(135deg, ${CRIMSON}, ${G})`, backgroundImage: community.avatar_url ? `url(${community.avatar_url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', border: '3px solid rgba(212,175,55,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', color: '#fff', ...T }}>
            {!community.avatar_url && (community.name?.charAt(0) || '?')}
          </div>

          <div className="flex-1 sm:pt-10 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-white" style={T}>{community.name}</h1>
              {community.is_verified && <CheckCircle className="w-5 h-5" style={{ color: G }} />}
              {community.category && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                  style={{ ...T, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: G }}>
                  {community.category}
                </span>
              )}
              {liveRooms.length > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase animate-pulse"
                  style={{ ...T, background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)', color: '#C0392B' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> LIVE
                </span>
              )}
            </div>
            {community.description && <p className="text-sm mt-1 max-w-xl" style={{ color: 'rgba(255,255,255,0.5)' }}>{community.description}</p>}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <strong style={{ color: G }}>{memberCount}</strong> members
              </span>
              {community.tags?.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', ...T }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="sm:pt-10 flex gap-2 flex-wrap">
            {user && !isMember && (
              <button onClick={() => joinMut.mutate()} disabled={joinMut.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase text-xs"
                style={{ ...T, background: `linear-gradient(90deg, ${CRIMSON}, ${G})`, color: '#000', border: 'none', cursor: 'pointer' }}>
                <UserPlus className="w-3.5 h-3.5" /> Join
              </button>
            )}
            {isMember && !isOwner && (
              <button onClick={() => leaveMut.mutate()} disabled={leaveMut.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase text-xs"
                style={{ ...T, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <UserCheck className="w-3.5 h-3.5" /> Joined
              </button>
            )}
            {isMember && (
              <button onClick={() => setPollModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black uppercase text-xs"
                style={{ ...T, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: G, cursor: 'pointer' }}>
                <Plus className="w-3.5 h-3.5" /> Poll
              </button>
            )}
            {(isAdmin || isOwner) && (
              <Link to={createPageUrl('CommunityAdmin') + `?id=${community.id}`}>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black uppercase text-xs"
                  style={{ ...T, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: G, cursor: 'pointer' }}>
                  <Shield className="w-3.5 h-3.5" /> Admin
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6 overflow-x-auto scrollbar-hide" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all shrink-0"
                style={{ ...T, color: active ? G : 'rgba(255,255,255,0.35)', borderBottomColor: active ? G : 'transparent', background: 'transparent' }}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === 'rooms' && liveRooms.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ background: 'rgba(192,57,43,0.2)', color: '#C0392B' }}>{liveRooms.length}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div key="feed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-16">
              <div className="md:col-span-2">
                <DiscussionFeed communityId={community.id} />
              </div>
              <div className="space-y-4">
                <ReferralProgram communityId={community.id} />
              </div>
            </motion.div>
          )}

          {activeTab === 'spotlight' && (
            <motion.div key="spotlight" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pb-16 space-y-6">
              <SpotlightBanner communityId={community.id} isAdmin={isAdmin || isOwner} />
              <SpotlightSection communityId={community.id} />
            </motion.div>
          )}

          {activeTab === 'rooms' && (
            <motion.div key="rooms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pb-16">
              {liveRooms.length === 0 ? (
                <div className="text-center py-16">
                  <Radio className="w-14 h-14 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.08)' }} />
                  <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No live streams right now</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>Check back soon</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveRooms.map(room => (
                    <Link key={room.id} to={createPageUrl('Room') + `?id=${room.id}`}>
                      <div className="p-4 rounded-2xl transition-all"
                        style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(192,57,43,0.3)' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(192,57,43,0.6)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(192,57,43,0.3)'}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase" style={{ color: '#C0392B', ...T }}>Live</span>
                        </div>
                        <p className="font-black text-sm text-white truncate" style={T}>{room.title}</p>
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {room.viewer_count || 0} watching
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {community?.id && (
        <CreatePollModal isOpen={pollModalOpen} onClose={() => setPollModalOpen(false)} communityId={community.id} />
      )}

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {community?.id && <InteractivePollingSystem communityId={community.id} userId={user?.id} isHost={false} />}
        {community?.id && <UnifiedChat roomId={community.id} currentUser={user} isHost={false} />}
        <ShareModal isOpen={false} onClose={() => {}} url={window.location.href} title={community?.name || 'Community'} />
        <OnlineUsersGrid compact maxVisible={10} />
        <ContentRecommendations />
        <CollaborationMatcher currentUserId={user?.id} />
        <ShareToSocial url={window.location.href} title={community?.name ? `Join "${community.name}" community on SeeWhy LIVE!` : 'Join our community on SeeWhy LIVE!'} />
      </div>
    </div>
  );
}