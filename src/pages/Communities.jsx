import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CommunityCard from '../components/communities/CommunityCard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import SpotlightBanner from '../components/community/SpotlightBanner';
import DiscussionFeed from '../components/community/DiscussionFeed';
import PollCard from '../components/community/PollCard';
import RaidPanelButton from '../components/live/RaidPanel';
import AnnouncementPanel from '../components/community/AnnouncementPanel';
import SpotlightSection from '../components/community/SpotlightSection';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';

function usePullToRefresh(onRefresh) {
  var [pullY, setPullY] = useState(0);
  var [refreshing, setRefreshing] = useState(false);
  var startY = useRef(0);
  var THRESHOLD = 65;
  function onTouchStart(e) {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (window.scrollY > 0) return;
    var dy = e.touches[0].clientY - startY.current;
    if (dy > 0) { e.preventDefault(); setPullY(Math.min(dy * 0.45, THRESHOLD + 20)); }
  }
  async function onTouchEnd() {
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true); setPullY(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPullY(0);
  }
  return { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd };
}

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const OCT     = 'polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const CATEGORIES = ['all','music','gaming','tech','education','business','entertainment','sports','lifestyle'];

export default function CommunitiesPage() {
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab]               = useState('discover');
  const queryClient = useQueryClient();
  var { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(
    async function() { await queryClient.invalidateQueries(); }
  );

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allCommunities = [], isLoading } = useQuery({
    queryKey: ['communities', selectedCategory],
    queryFn: async () => {
      if (selectedCategory === 'all') return base44.entities.Community.list('-member_count', 50);
      return base44.entities.Community.filter({ category: selectedCategory }, '-member_count', 50);
    },
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['myMemberships'],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.CommunityMember.filter({ user_id: user.id });
    },
    enabled: !!user,
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async (communityId) => {
      const existing = myMemberships.find(m => m.community_id === communityId);
      if (existing) { toast.info('Already a member'); return; }
      await base44.entities.CommunityMember.create({
        community_id: communityId, user_id: user.id,
        role: 'member', joined_at: new Date().toISOString(),
      });
      const community = allCommunities.find(c => c.id === communityId);
      if (community) {
        await base44.entities.Community.update(communityId, { member_count: (community.member_count || 0) + 1 });
      }
    },
    onSuccess: (_, communityId) => {
      queryClient.invalidateQueries({ queryKey: ['myMemberships'] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      toast.success('Joined community!');
      if (user?.id) {
        const community = allCommunities.find(c => c.id === communityId);
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'community_joined',
          title: `Joined community: ${community?.name || 'Community'}`,
        }).catch(() => {});
      }
    },
  });

  const q        = searchQuery.toLowerCase();
  const filtered = allCommunities.filter(c =>
    !q || c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
  );
  const trending = filtered.slice(0, 12);
  const mine     = filtered.filter(c => myMemberships.some(m => m.community_id === c.id));

  return (
    <div className="min-h-screen pb-10" style={{ background: '#080B18' }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

      {/* Pull-to-refresh indicator */}
      <motion.div style={{ height: pullY, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {pullY > 10 && (
          <motion.div
            animate={refreshing ? { rotate: 360 } : { rotate: pullY * 4 }}
            transition={refreshing ? { repeat: Infinity, duration: 0.6, ease: 'linear' } : {}}
            style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(212,175,55,0.3)', borderTopColor: '#D4AF37' }} />
        )}
      </motion.div>

      {/* ── Sticky header ─────────────────────────────────────── */}
      <div className="sticky top-0 z-20"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>

        {/* Row 1 – title + Create button */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: GOLD }} />
            <h1 className="font-black text-xl text-white leading-none" style={T}>Communities</h1>
          </div>
          <Link to={createPageUrl('CreateCommunity')}>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-[10px] transition-all hover:brightness-110"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.4)', color: GOLD, ...T }}>
              <Plus className="w-3 h-3" />Create
            </button>
          </Link>
        </div>

        {/* Row 2 – search bar */}
        <div className="flex items-center gap-2 mx-4 mb-2 px-3 py-2 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search communities…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            style={{ ...T }}
          />
        </div>

        {/* Row 3 – category pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className="px-3 py-1 rounded-full shrink-0 font-black uppercase text-[11px] transition-all capitalize"
              style={{
                background:   selectedCategory === cat ? GOLD : 'rgba(255,255,255,0.06)',
                border:       `1px solid ${selectedCategory === cat ? GOLD : 'rgba(255,255,255,0.1)'}`,
                color:        selectedCategory === cat ? '#000' : 'rgba(255,255,255,0.45)',
                ...T,
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Row 4 – Discover / My Communities tabs */}
        <div className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {[
            { id: 'discover', label: 'Discover',                              icon: TrendingUp },
            { id: 'mine',     label: `My Communities (${mine.length})`,        icon: Users      },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-black uppercase text-[10px] transition-all border-b-2"
              style={{
                ...T,
                color:            activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.35)',
                borderBottomColor: activeTab === tab.id ? GOLD : 'transparent',
                background:       activeTab === tab.id ? 'rgba(212,175,55,0.05)' : 'transparent',
              }}>
              <tab.icon className="w-3 h-3" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pt-5">

        {/* DISCOVER TAB */}
        {activeTab === 'discover' && (
          <>
            <p className="font-black text-[10px] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
              Trending Communities
            </p>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : trending.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trending.map((community, i) => (
                  <motion.div key={community.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}>
                    <CommunityCard
                      community={community}
                      isMember={myMemberships.some(m => m.community_id === community.id)}
                      onJoin={c => joinCommunityMutation.mutate(c.id)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24">
                {/* Octagonal placeholder */}
                <div style={{ width: 72, height: 72, clipPath: OCT, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Users className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.2)' }} />
                </div>
                <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No communities found</p>
              </div>
            )}
          </>
        )}

        {/* MY COMMUNITIES TAB */}
        {activeTab === 'mine' && (
          <>
            <p className="font-black text-[10px] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
              Your Communities
            </p>

            {mine.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mine.map((community, i) => (
                  <motion.div key={community.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}>
                    <CommunityCard community={community} isMember={true} />
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-24">
                <div style={{
                  width: 80, height: 80, clipPath: OCT,
                  background: 'rgba(212,175,55,0.07)',
                  border: '2px solid rgba(212,175,55,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                }}>
                  <Users className="w-9 h-9" style={{ color: 'rgba(212,175,55,0.4)' }} />
                </div>
                <p className="font-black text-sm uppercase mb-2" style={{ color: 'rgba(255,255,255,0.45)', ...T }}>
                  You haven't joined any communities yet
                </p>
                <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
                  Discover communities that match your interests
                </p>
                <button onClick={() => setActiveTab('discover')}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-black uppercase text-[11px] transition-all hover:brightness-110"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.35)', color: GOLD, ...T }}>
                  Explore communities →
                </button>
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SpotlightBanner communityId={mine[0]?.id || null} isAdmin={false} />
          <DiscussionFeed communityId="discover" />
        </div>

        {/* Community management quick links */}
        {mine.length > 0 && (
          <div className="mt-6 mb-4 flex flex-wrap gap-3">
            <Link to={createPageUrl('CommunityAdmin')} style={{ textDecoration: 'none' }}>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[10px] uppercase"
                style={{ background: 'rgba(128,0,32,0.1)', border: '1px solid rgba(128,0,32,0.3)', color: '#ff6666', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
                ⚙️ Community Admin
              </button>
            </Link>
            <Link to={createPageUrl('CommunityGrowth')} style={{ textDecoration: 'none' }}>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[10px] uppercase"
                style={{ background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.25)', color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
                📈 Growth Tools
              </button>
            </Link>
            <Link to={createPageUrl('CommunitySettings')} style={{ textDecoration: 'none' }}>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[10px] uppercase"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
                ⚡ Settings
              </button>
            </Link>
          </div>
        )}

        <div style={{ padding: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <OnlineUsersGrid compact maxVisible={12} />
          <PollCard poll={null} />
          <RaidPanelButton room={null} currentUser={user} isHost={false} />
          <AnnouncementPanel communityId={mine[0]?.id || null} userId={user?.id} />
          <SpotlightSection communityId={mine[0]?.id || null} />
          <ContentRecommendations />
          <CollaborationMatcher />
        </div>
      </div>
    </div>
  );
}