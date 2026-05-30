import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CommunityCard from '../components/communities/CommunityCard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const CATEGORIES = ['all','music','gaming','tech','education','business','entertainment','sports','lifestyle'];

export default function CommunitiesPage() {
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab]           = useState('discover');
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMemberships'] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      toast.success('Joined community!');
    },
  });

  const q = searchQuery.toLowerCase();
  const filtered = allCommunities.filter(c =>
    !q || c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
  );
  const trending   = filtered.slice(0, 12);
  const mine       = filtered.filter(c => myMemberships.some(m => m.community_id === c.id));

  return (
    <div className="min-h-screen pb-10" style={{ background: '#080B18' }}>
      {/* Sticky header + search */}
      <div className="sticky top-0 z-20"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        {/* Row 1: title + create button */}
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: GOLD }} />
            <h1 className="font-black text-lg text-white leading-none" style={T}>Communities</h1>
          </div>
          <Link to={createPageUrl('CreateCommunity')}>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-[10px]"
              style={{ background: CRIMSON, color: GOLD, border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 0 12px rgba(128,0,32,0.3)', ...T }}>
              <Plus className="w-3 h-3" />Create
            </button>
          </Link>
        </div>

        {/* Row 2: search bar */}
        <div className="flex items-center gap-2 px-4 pb-2">
          <Search className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search communities…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
          />
        </div>

        {/* Row 3: category pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className="px-3 py-1 rounded-full shrink-0 font-black uppercase text-[9px] transition-all capitalize"
              style={{
                background: selectedCategory === cat ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedCategory === cat ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: selectedCategory === cat ? GOLD : 'rgba(255,255,255,0.4)',
                ...T,
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Row 4: Discover / My tabs */}
        <div className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {[
            { id: 'discover', label: 'Discover', icon: TrendingUp },
            { id: 'mine',     label: `My Communities (${mine.length})`, icon: Users },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-black uppercase text-[10px] transition-all border-b-2"
              style={{
                ...T,
                color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.35)',
                borderBottomColor: activeTab === tab.id ? GOLD : 'transparent',
                background: activeTab === tab.id ? 'rgba(212,175,55,0.05)' : 'transparent',
              }}>
              <tab.icon className="w-3 h-3" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pt-5">
        {activeTab === 'discover' && (
          <>
            <p className="font-black text-[10px] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
              Trending Communities
            </p>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-52 rounded-2xl animate-pulse"
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
                      onJoin={(c) => joinCommunityMutation.mutate(c.id)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <Users className="w-14 h-14 mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
                <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No communities found</p>
              </div>
            )}
          </>
        )}

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
              <div className="flex flex-col items-center justify-center py-20">
                <Users className="w-14 h-14 mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
                <p className="font-black text-sm uppercase mb-4" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No communities yet</p>
                <button onClick={() => setActiveTab('discover')}
                  className="px-5 py-2 rounded-xl font-black uppercase text-[11px]"
                  style={{ background: CRIMSON, color: GOLD, border: '1px solid rgba(212,175,55,0.3)', ...T }}>
                  Discover Communities
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
