import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLiveHomeRanking } from '../hooks/useLiveHomeRanking';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Search, TrendingUp, Users, Calendar, Star, Eye, ChevronRight, Clapperboard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CommunityCard from '../components/communities/CommunityCard';
import FollowButton from '../components/shared/FollowButton';
import SignalBars from '../components/live/SignalBars';
import { formatDistanceToNow } from 'date-fns';
import YouTubeDiscovery from '../components/youtube/YouTubeDiscovery';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ShareToSocial from '../components/social/ShareToSocial';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import AnnouncementPanel from '../components/community/AnnouncementPanel';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CreatorBridge from '../components/social/CreatorBridge';
import MomentsFeed from '../components/live/MomentsFeed';
import PullToRefresh from '../components/shared/PullToRefresh';

var GENRES = ['All', 'Music', 'Gaming', 'Talk', 'Education', 'Tech', 'Art', 'Fitness', 'IRL'];

var OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
var CAT_COLOR = { Music: '#FF2040', Gaming: '#FFB800', Talk: '#00F5FF', Education: '#00FF88', Tech: '#00F5FF', Art: '#FF6B8A', Fitness: '#FF8C00', IRL: '#FFB800' };

function FanbaseRoomCard({ room }) {
  var tag = room.tags && room.tags[0];
  var tagColor = tag ? (CAT_COLOR[tag] || '#FFB800') : '#FFB800';
  var viewers = room.viewer_count || room.participant_count || 0;
  return (
    <motion.div whileTap={{ scale: 0.98 }} className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: 'rgba(7,7,15,0.9)', border: '1px solid rgba(255,184,0,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full"
          style={{ background: `${tagColor}22`, color: tagColor, border: `1px solid ${tagColor}44`, fontFamily: 'Barlow Condensed, sans-serif' }}>
          {tag || 'Live'}
        </span>
        <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,184,0,0.15)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          Join
        </span>
      </div>
      <div className="relative mx-3 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #0F1428, #03030A)' }}>
        {room.thumbnail_url
          ? <img src={room.thumbnail_url} alt={room.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Radio className="w-8 h-8" style={{ color: 'rgba(255,184,0,0.2)' }} /></div>}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,7,15,0.85) 0%, transparent 60%)' }} />
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black"
          style={{ background: 'rgba(255,32,64,0.85)', color: 'white', fontFamily: 'Barlow Condensed, sans-serif' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
        </div>
        {viewers > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[11px] font-bold"
            style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <Users className="w-3 h-3" />{viewers.toLocaleString()}
          </div>
        )}
      </div>
      <div className="px-3 pt-2 pb-3">
        <p className="font-black text-white leading-tight text-sm line-clamp-2"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{room.title}</p>
        <div className="flex items-center justify-between mt-1">
          {room.host_name && (
            <p className="text-[10px]" style={{ color: 'rgba(255,184,0,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>{room.host_name}</p>
          )}
          {room.host_id && (
            <FollowButton targetUserId={room.host_id} targetUserName={room.host_name || 'Creator'} size="sm" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function DiscoverPage() {
  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  var [search, setSearch] = useState('');
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, null);

  var [debouncedSearch, setDebouncedSearch] = useState('');
  var [genre, setGenre] = useState('All');
  var [tab, setTab] = useState('live'); // live | scheduled | communities | creators | episodes
  var debounceRef = useRef(null);
  var queryClient = useQueryClient();
  var { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', (user && user.id)],
    queryFn: () => base44.entities.Community.filter({ owner_id: (user && user.id) }).then(r => r[0] || null),
    enabled: !!(user && user.id),
  });
  var userCommunityId = (userCommunity && userCommunity.id) || null;

  // 300ms debounce
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  var { data: liveRooms = [], isLoading: loadingLive } = useQuery({
    queryKey: ['discover-live'],
    queryFn: () => base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 30),
    refetchInterval: 10000,
  });

  var { data: scheduledRooms = [] } = useQuery({
    queryKey: ['discover-scheduled'],
    queryFn: () => base44.entities.Room.filter({ status: 'scheduled' }, 'scheduled_start', 20),
    refetchInterval: 30000,
  });

  var { data: communities = [] } = useQuery({
    queryKey: ['discover-communities'],
    queryFn: () => base44.entities.Community.list('-member_count', 24),
  });

  var { data: creators = [] } = useQuery({
    queryKey: ['discover-creators'],
    queryFn: () => base44.entities.CreatorProfile.list('-follower_count', 20),
  });

  var { data: followingList = [] } = useQuery({
    queryKey: ['following', (user && user.id)],
    queryFn: () => base44.entities.Follow.filter({ follower_id: user.id }, '-created_date', 200),
    enabled: !!(user && user.id),
    staleTime: 60000,
  });
  var followingIds = followingList.map(f => f.following_id).filter(Boolean);

  var totalViewers = liveRooms.reduce((s, r) => s + (r.viewer_count || 0), 0);

  var filterRooms = function(rooms) {
    return rooms.filter(function(r) {
      var lq = debouncedSearch.toLowerCase();
      var titleMatch = r.title && r.title.toLowerCase().includes(lq);
      var descMatch = r.description && r.description.toLowerCase().includes(lq);
      var matchSearch = !debouncedSearch || titleMatch || descMatch;
      var matchGenre = genre === 'All' || (r.tags && r.tags.includes(genre.toLowerCase()));
      return matchSearch && matchGenre;
    });
  };

  // Live Home: real-time ranked discovery via socket push, falls back to DB sort
  var { trending: liveHomeTrending, connectedViaSocket: liveHomeSocketOn } = useLiveHomeRanking({ fallbackRooms: liveRooms });

  // Merge socket scores into DB room objects for the trending cards
  var trending = liveHomeTrending
    .slice(0, 3)
    .map(t => t.dbRoom || liveRooms.find(r => r.id === t.roomId))
    .filter(Boolean);

  var filtered = filterRooms(tab === 'live' ? liveRooms : scheduledRooms);

  return (
    <div className="min-h-screen bg-[#03030A] text-white" style={{ overscrollBehavior: 'contain' }}>
      <PullToRefresh onRefresh={async function() { await queryClient.invalidateQueries(); }}>
      {/* Dark header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #03030A 0%, #03030A 60%, #03030A 100%)', borderBottom: '1px solid rgba(255,184,0,0.1)' }}>
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl sm:text-4xl font-black text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.02em' }}>
              Discover
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FF2040] animate-pulse" />
              <span className="text-sm font-bold text-white/70" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {liveRooms.length} <span style={{ color: '#FF2040' }}>LIVE</span>
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 sm:gap-6 mb-5 overflow-x-auto scrollbar-hide pb-1">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#FFB800]" />
              <span className="text-2xl font-black text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {totalViewers.toLocaleString()}
              </span>
              <span className="text-[#FFB800] text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Viewers</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: '#FFB800' }} />
              <span className="text-2xl font-black text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {communities.length}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#FFB800', fontFamily: 'Barlow Condensed, sans-serif' }}>Communities</span>
            </div>
          </div>

          {/* Hero trending — Live Home ranked discovery */}
          {trending.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" style={{ color: '#FFB800' }} />
                <span className="text-[13px] font-black uppercase tracking-wide" style={{ color: '#FFB800', fontFamily: 'Barlow Condensed, sans-serif' }}>Trending Now</span>
                <span className="flex items-center gap-1 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: liveHomeSocketOn ? '#00FF88' : '#FFB000' }} />
                  <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{liveHomeSocketOn ? 'Live' : 'Polling'}</span>
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trending.map((room, i) => (
                  <TrendingCard key={room.id} room={room} rank={i + 1} />
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              placeholder="Search streams, creators, topics…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Barlow Condensed, sans-serif' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(255,184,0,0.5)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
            />
          </div>
        </div>
      </div>

      {/* Tournament & Battle Feature Strip */}
      <div style={{ background: 'rgba(7,7,15,0.97)', borderBottom: '1px solid rgba(255,184,0,0.08)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', gap: 8, padding: '10px 16px', width: 'max-content' }}>
          {[
            { emoji: '⚔️', label: 'SVS Tournaments', sub: 'State vs State', page: 'StateVsState',    color: '#FF2040' },
            { emoji: '🏟️', label: 'Battle Arena',    sub: 'Vote Live Battles', page: 'PKBattleArena',  color: '#FF2040' },
            { emoji: '🏆', label: 'Live Battles',    sub: 'PK Showdowns',   page: 'LiveBattles',     color: '#FF8C00' },
            { emoji: '👑', label: 'Elite League',    sub: 'Creator Rankings', page: 'Leaderboard',    color: '#FFB800' },
            { emoji: '🕊️', label: 'Tribute Wall',   sub: 'Honor Legends',  page: 'TributeWall',     color: '#8B6F47' },
            { emoji: '🎬', label: 'VOD Library',     sub: 'Past Streams',   page: 'VODLibrary',      color: '#FF8C00' },
            { emoji: '🎟️', label: 'PPV Events',      sub: 'Pay-Per-View',   page: 'PayPerViewEvents',color: '#8B6F00' },
            { emoji: '🎬', label: 'Micro Drama',     sub: 'Episode Series', page: 'EpisodeSeries',   color: '#7B2D8B' },
            { emoji: '🎵', label: 'AI Music',        sub: 'Live Studio',    page: 'AIMusic',          color: '#C9A84C' },
            { emoji: '🎙', label: 'Podcast Studio',  sub: 'Co-Stream Live', page: 'PodcastStudio',    color: '#00A8E8' },
            { emoji: '🤖', label: 'AI Hub',          sub: 'All AI Tools',   page: 'AIHub',            color: '#00F5FF' },
          ].map(item => (
            <Link key={item.page} to={createPageUrl(item.page)} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: 96, padding: '8px 6px', background: item.color + '12', border: `1px solid ${item.color}28`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 18 }}>{item.emoji}</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 10, color: '#fff', textAlign: 'center', letterSpacing: '0.02em', lineHeight: 1.2 }}>{item.label}</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 8, color: item.color, textAlign: 'center', opacity: 0.9 }}>{item.sub}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Who's Online */}
        <OnlineUsersGrid compact maxVisible={16} />

        {/* Tab bar + genre filter */}
        {/* Tabs — scrollable on mobile */}
        <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
          <div className="flex gap-1 p-1 rounded-xl w-max min-w-full sm:w-auto" style={{ background: 'rgba(7,7,15,0.9)', border: '1px solid rgba(22,22,42,1)' }}>
            {[
              { id: 'live', label: 'Live', icon: Radio },
              { id: 'scheduled', label: 'Upcoming', icon: Calendar },
              { id: 'communities', label: 'Communities', icon: Users },
              { id: 'creators', label: 'Creators', icon: Star },
              { id: 'videos', label: 'Videos', icon: Clapperboard },
              { id: 'moments', label: 'Moments', icon: Clapperboard },
              { id: 'episodes', label: 'Episodes', icon: Clapperboard },
            ].map(t => {
              var Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    tab === t.id ? 'text-white' : 'text-white/40 hover:text-white/70'
                  }`} style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', borderBottom: tab === t.id ? '2px solid #FFB800' : '2px solid transparent', borderRadius: 0, paddingBottom: 6 }}>
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                  {t.id === 'live' && liveRooms.length > 0 && (
                    <span className="bg-white/20 rounded-full px-1.5 text-[11px]">{liveRooms.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Genre pills */}
        {(tab === 'live' || tab === 'scheduled') && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-1" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            {GENRES.map(g => (
              <button key={g} onClick={() => setGenre(g)}
                className="shrink-0 text-[11px] px-3.5 py-1.5 rounded-full transition-all active:scale-95 whitespace-nowrap font-bold"
                style={genre === g
                  ? { background: '#FFB800', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', border: '1px solid #FFB800' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Barlow Condensed, sans-serif' }
                }>
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {tab === 'live' && (
            <motion.div key="live" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {loadingLive ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-52 bg-[#0B0B18] rounded-xl animate-pulse border border-[#07070F]" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                search ? (
                  <EmptyState icon={Radio} title="No live rooms yet" desc="Try a different search" />
                ) : (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.15)' }}>
                      <Radio className="w-7 h-7" style={{ color: 'rgba(255,184,0,0.3)' }} />
                    </div>
                    <h3 className="text-lg font-black text-white/60 mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>No live rooms yet</h3>
                    <Link to={createPageUrl('BroadcastStudio')} className="text-sm font-bold transition-colors" style={{ color: '#FFB800' }}>Be the first to go live →</Link>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((room, i) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <FanbaseRoomCard room={room} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'scheduled' && (
            <motion.div key="sched" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {filtered.length === 0 ? (
                <EmptyState icon={Calendar} title="No upcoming streams" desc="Nothing scheduled yet — check the creator schedule page." />
              ) : (
                <div className="space-y-3">
                  {filtered.map(room => (
                    <ScheduledRow key={room.id} room={room} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'communities' && (
            <motion.div key="comm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {communities.map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <CommunityCard community={c} isMember={false} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === 'creators' && (
            <motion.div key="creators" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {creators.map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <CreatorCard creator={c} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === 'videos' && (
            <motion.div key="videos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <VideoPostsGrid />
            </motion.div>
          )}

          {tab === 'moments' && (
            <motion.div key="moments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <MomentsFeed currentUserId={(user && user.id)} followingIds={followingIds} />
            </motion.div>
          )}

          {tab === 'episodes' && (
            <motion.div key="episodes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[
                  { emoji: '👑', title: 'Shadow Reign',  genre: 'Thriller',  color: '#7B2D8B', ep: 4, desc: 'A power struggle inside a secret dynasty that runs an entire city.' },
                  { emoji: '🌆', title: 'Street Code',   genre: 'Drama',     color: '#1A3A5C', ep: 3, desc: 'Two brothers navigate loyalty and survival in a city that never forgives.' },
                  { emoji: '🤖', title: 'Cyber Hearts',  genre: 'Sci-Fi',    color: '#0D3D2B', ep: 2, desc: 'An AI entity discovers what it means to love in a world that fears it.' },
                  { emoji: '🎭', title: 'Block Party',   genre: 'Comedy',    color: '#5C1A1A', ep: 5, desc: 'A Brooklyn block erupts when a reality show picks their street as its set.' },
                ].map(function(s) {
                  return (
                    <Link key={s.title} to={createPageUrl('EpisodeSeries')} style={{ textDecoration: 'none' }}>
                      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg,' + s.color + '44,rgba(0,0,0,0.5))', border: '1px solid ' + s.color + '44', cursor: 'pointer' }}>
                        <div style={{ padding: '20px 14px 10px', textAlign: 'center', fontSize: 32 }}>{s.emoji}</div>
                        <div style={{ padding: '0 12px 14px' }}>
                          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, color: '#F0E8D4', margin: '0 0 3px' }}>{s.title}</p>
                          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: s.color, margin: '0 0 5px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.genre}</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 8px', lineHeight: 1.4 }}>{s.desc}</p>
                          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>{s.ep} episodes</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Link to={createPageUrl('EpisodeSeries')} style={{ textDecoration: 'none', display: 'inline-block', padding: '10px 24px', borderRadius: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, letterSpacing: '0.08em', background: 'rgba(123,45,139,0.15)', border: '1px solid rgba(123,45,139,0.4)', color: '#F0E8D4' }}>
                  View All Series →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI-powered content recommendations */}
        <ContentRecommendations />

        {/* YouTube partner content discovery */}
        <div className="mt-8">
          <YouTubeDiscovery />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
          <ShareToSocial content={{ title: 'Discover on SeeWhy LIVE', url: window.location.href }} />
          <StreamGoals isHost={true} />
          <AnnouncementPanel communityId={userCommunityId} userId={(user && user.id)} />
          <ChallengeLeaderboard challengeId={null} />
        </div>
      </div>
      </PullToRefresh>
    </div>
  );
}

function VideoPostsGrid() {
  var { data: posts = [], isLoading } = useQuery({
    queryKey: ['discover-video-posts'],
    queryFn: function() { return base44.entities.Room.filter({ type: 'video', is_public: true }, '-created_date', 20); },
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {[1,2,3,4].map(function(i) { return <div key={i} style={{ height: 160, background: 'rgba(255,255,255,0.03)', borderRadius: 14, animation: 'pulse 1.5s ease-in-out infinite' }} />; })}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <span style={{ fontSize: 32 }}>🎬</span>
        <p style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.3)', fontSize: 14, marginTop: 8 }}>No video posts yet</p>
        <Link to={createPageUrl('VideoPost')} style={{ display: 'inline-block', marginTop: 12, padding: '8px 20px', borderRadius: 10, background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', textDecoration: 'none', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900 }}>
          + Post a Video
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <Link to={createPageUrl('VideoPost')} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', textDecoration: 'none', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 900 }}>
          + Post Video
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {posts.map(function(post) {
          var thumb = post.thumbnail_url || null;
          return (
            <Link key={post.id} to={createPageUrl('VideoViewer') + '?id=' + post.id} style={{ textDecoration: 'none' }}>
              <motion.div whileTap={{ scale: 0.97 }} style={{ borderRadius: 14, overflow: 'hidden', background: 'rgba(7,7,15,0.9)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
                <div style={{ height: 100, position: 'relative', background: 'linear-gradient(135deg, rgba(0,80,160,0.3), rgba(7,7,15,0.9))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {thumb
                    ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                    : <span style={{ fontSize: 28 }}>🎬</span>
                  }
                  <div style={{ position: 'absolute', top: 6, left: 6, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.75)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}>VIDEO</div>
                </div>
                <div style={{ padding: '8px 10px 10px' }}>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 12, color: '#fff', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title || 'Video Post'}</p>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{post.host_name || 'Creator'} · 👁 {post.viewer_count || 0}</p>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function TrendingCard({ room, rank }) {
  var rankColors = ['#FFB800', '#FFB800', '#FF8C00'];
  return (
    <Link to={`${createPageUrl('LiveRoom')}?id=${room.id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="relative rounded-xl overflow-hidden border border-[#07070F] hover:border-[#FF2040]/30 transition-all cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #0B0B18 0%, #07070F 100%)' }}
      >
        {room.thumbnail_url && (
          <img src={room.thumbnail_url} alt="" className="w-full h-28 object-cover opacity-60" />
        )}
        {!room.thumbnail_url && (
          <div className="w-full h-28 bg-gradient-to-br from-[#07070F] to-[#0B0B18] flex items-center justify-center">
            <Radio className="w-10 h-10 text-[#FF2040]/30" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="text-xs font-black font-mono" style={{ color: rankColors[rank - 1] }}>#{rank}</span>
          <span style={{ background: '#FF2040', color: '#fff', fontSize: 11, fontWeight: 900, padding: '2px 6px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4, border: 'none', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
        </div>
        <div className="p-3">
          <p className="text-sm font-bold text-white truncate">{room.title}</p>
          <div className="flex items-center justify-between mt-1">
            <SignalBars count={5} active={true} size="xs" />
            <span className="text-[10px] text-[#FFB800] font-mono">{(room.viewer_count || 0).toLocaleString()} viewers</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function ScheduledRow({ room }) {
  return (
    <Link to={`${createPageUrl('Room')}?id=${room.id}`}>
      <motion.div
        whileHover={{ x: 4 }}
        className="flex items-center gap-4 p-4 rounded-xl border border-[#07070F] hover:border-[#FFB800]/30 bg-[#0B0B18] hover:bg-[#10101E] transition-all cursor-pointer"
      >
        <div className="w-12 h-12 rounded-lg bg-[#07070F] border border-[#07070F] flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-[#FFB800]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{room.title}</p>
          {room.scheduled_start && (
            <p className="text-[10px] text-white/40 mt-0.5">
              {formatDistanceToNow(new Date(room.scheduled_start), { addSuffix: true })}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
      </motion.div>
    </Link>
  );
}

function CreatorCard({ creator }) {
  var isLive = creator.is_live;
  var _dn = creator && creator.display_name;
  var initials = (_dn && _dn.charAt(0) && _dn.charAt(0).toUpperCase()) || '?';
  return (
    <Link to={`${createPageUrl('PublicProfile')}?id=${creator.user_id}`}>
      <motion.div whileTap={{ scale: 0.97 }}
        className="relative p-4 rounded-2xl cursor-pointer text-center"
        style={{ background: 'rgba(7,7,15,0.9)', border: '1px solid rgba(255,184,0,0.12)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
        {isLive && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black"
            style={{ background: 'rgba(255,32,64,0.85)', color: 'white', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
          </div>
        )}
        {/* Octagonal avatar */}
        <div className="mx-auto mb-3" style={{ width: 64, height: 64, clipPath: OCT, background: 'rgba(255,184,0,0.25)' }}>
          <div style={{ width: '100%', height: '100%', clipPath: OCT,
            background: creator.avatar_url ? 'transparent' : 'linear-gradient(135deg, #FF1564, #FFB800)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: 'white', overflow: 'hidden' }}>
            {creator.avatar_url
              ? <img src={creator.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
        </div>
        <p className="text-sm font-black text-white truncate" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>{creator.display_name}</p>
        <p className="text-[10px] mt-0.5 capitalize" style={{ color: 'rgba(255,184,0,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>{creator.category}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <Users className="w-3 h-3" style={{ color: '#FFB800' }} />
          <span className="text-[11px] font-bold" style={{ color: '#FFB800', fontFamily: 'Barlow Condensed, sans-serif' }}>{(creator.follower_count || 0).toLocaleString()}</span>
        </div>
        {creator.user_id && (
          <div className="mt-3" onClick={function(e) { e.preventDefault(); e.stopPropagation(); }}>
            <FollowButton targetUserId={creator.user_id} targetUserName={creator.display_name} size="sm" />
          </div>
        )}
      </motion.div>
    </Link>
  );
}

function EmptyState({ icon: Icon, title, desc }) {
  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.12)' }}>
        <Icon className="w-7 h-7" style={{ color: 'rgba(255,184,0,0.3)' }} />
      </div>
      <h3 className="text-lg font-black text-white/60 mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{title}</h3>
      <p className="text-sm text-white/30" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{desc}</p>
      <SwanAIRecommendations roomId={null} currentLayout="discover" viewerCount={0} />
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