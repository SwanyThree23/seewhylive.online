import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import CreatorProfileSetup from '../components/profile/CreatorProfileSetup';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radio, Clock, Users, Search, Plus, Video, Star, Swords, Eye, Zap, Activity } from 'lucide-react';
import ZEGOMobileAppBanner from '../components/zego/ZEGOMobileAppBanner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import RoomCard from '../components/rooms/RoomCard';
import CommunityCard from '../components/communities/CommunityCard';
import ActivitySidebar from '../components/shared/ActivitySidebar';
import QuickActionPanel from '../components/shared/QuickActionPanel';
import YouTubeDiscovery from '../components/youtube/YouTubeDiscovery';
import ShareToSocial from '../components/social/ShareToSocial';
import CreatorBridge from '../components/social/CreatorBridge';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import { motion, AnimatePresence } from 'framer-motion';

var CATEGORIES = ['All', 'Music', 'Gaming', 'Tech', 'Education', 'Business', 'Sports', 'Lifestyle'];

function usePullToRefresh(onRefresh) {
  var [pullY, setPullY] = useState(0);
  var [refreshing, setRefreshing] = useState(false);
  var startY = React.useRef(0);
  var THRESHOLD = 65;

  function onTouchStart(e) {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (window.scrollY > 0) return;
    var dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPullY(Math.min(dy * 0.45, THRESHOLD + 20));
  }
  async function onTouchEnd() {
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPullY(0);
  }
  return { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd };
}

var OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

function OctTile({ label, color, size }) {
  var sz = size || 44;
  return (
    <div style={{ width: sz, height: sz, clipPath: OCT, background: 'rgba(212,175,55,0.2)', flexShrink: 0 }}>
      <div style={{ width: '100%', height: '100%', clipPath: OCT,
        background: color || 'linear-gradient(135deg, #800020, #3d0010)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: sz * 0.3, fontWeight: 900, color: 'rgba(255,255,255,0.9)',
        fontFamily: 'Barlow Condensed, sans-serif' }}>
        {(label || '?').charAt(0).toUpperCase()}
      </div>
    </div>
  );
}

function SignalBars({ count }) {
  var level = count > 2000 ? 4 : count > 500 ? 3 : count > 100 ? 2 : 1;
  return (
    <span className="flex items-end gap-[2px]" aria-label={`${count} viewers`}>
      {[1,2,3,4].map(function(n) {
        return <span key={n} style={{ width: 3, height: 4 + n * 3, borderRadius: 1, background: n <= level ? '#D4AF37' : 'rgba(255,255,255,0.15)', display: 'inline-block' }} />;
      })}
    </span>
  );
}

function streamDuration(room) {
  var start = room.started_at || room.created_at;
  if (!start) return null;
  var mins = Math.floor((Date.now() - new Date(start).getTime()) / 60000);
  if (mins < 1) return '< 1m';
  if (mins < 60) return mins + 'm';
  return Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm';
}

function FanbaseRoomCard({ room }) {
  var participantCount = room.participant_count || room.viewer_count || 0;
  var displayNames = (room.participant_names || []).slice(0, 3);
  var extra = participantCount > 3 ? participantCount - 3 : 0;
  var isTrending = participantCount >= 500;
  var categoryColor = { Music: '#FF1564', Gaming: '#8B5CF6', Tech: '#00d4ff', Education: '#6B7C4A', Business: '#D4AF37', Sports: '#CC7755', Lifestyle: '#FF6B8A', Tournament: '#CC7755', Domino: '#8B5CF6' };
  var tag = room.tags && room.tags[0];
  var tagColor = tag ? (categoryColor[tag] || '#D4AF37') : '#D4AF37';
  var duration = streamDuration(room);
  var accessLabel = room.ppv_price ? 'PPV' : room.is_fan_only ? 'FAN' : 'FREE';
  var accessStyle = accessLabel === 'PPV'
    ? { background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }
    : accessLabel === 'FAN'
    ? { background: 'rgba(128,0,32,0.2)', color: '#ff9999', border: '1px solid rgba(128,0,32,0.4)' }
    : { background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' };

  return (
    <Link to={`/LiveRoom?id=${room.id}`}>
      <motion.div whileTap={{ scale: 0.98 }}
        className="rounded-2xl overflow-hidden cursor-pointer"
        style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>

        {/* Top row: LIVE + TRENDING badges | Join */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(255,21,100,0.18)', color: '#FF1564', border: '1px solid rgba(255,21,100,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />LIVE
            </span>
            {isTrending && (
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(255,140,0,0.15)', color: '#FF8C00', border: '1px solid rgba(255,140,0,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                🔥 TRENDING
              </span>
            )}
          </div>
          <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
            Join
          </span>
        </div>

        {/* Thumbnail / placeholder */}
        <div className="relative mx-3 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a0d2e, #0d1a2e)' }}>
          {room.thumbnail_url ? (
            <img src={room.thumbnail_url} alt={room.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Radio className="w-8 h-8" style={{ color: 'rgba(212,175,55,0.2)' }} />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,6,24,0.85) 0%, transparent 60%)' }} />
        </div>

        {/* Room title + host */}
        <div className="px-3 pt-2">
          <p className="font-black text-white leading-tight text-sm line-clamp-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.02em' }}>
            {room.title}
          </p>
          {room.host_name && (
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(212,175,55,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              {room.host_name}
            </p>
          )}
        </div>

        {/* Stats row: signal+count | category | duration | access */}
        <div className="flex items-center gap-2 px-3 pt-1.5 pb-2.5 flex-wrap">
          {participantCount > 0 && (
            <span className="flex items-center gap-1.5">
              <SignalBars count={participantCount} />
              <span className="text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                {participantCount.toLocaleString()}
              </span>
            </span>
          )}
          {tag && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${tagColor}22`, color: tagColor, border: `1px solid ${tagColor}44`, fontFamily: 'Barlow Condensed, sans-serif' }}>
              {tag}
            </span>
          )}
          {duration && (
            <span className="text-[9px] font-black" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>{duration}</span>
          )}
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full ml-auto" style={{ ...accessStyle, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {accessLabel}
          </span>
        </div>

        {/* Participant oct-tile row */}
        {(displayNames.length > 0 || participantCount > 0) && (
          <div className="flex items-center gap-1.5 px-3 pb-3 -mt-1">
            {displayNames.map(function(name, i) { return <OctTile key={i} label={name} size={32} />; })}
            {displayNames.length === 0 && <OctTile label="?" size={32} />}
            {extra > 0 && <span className="text-[9px] font-black ml-0.5" style={{ color: 'rgba(212,175,55,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>+{extra}</span>}
          </div>
        )}
      </motion.div>
    </Link>
  );
}

var QUICK_ACTIONS = [
  { label: 'Go Live',      icon: Radio,   href: '/Greenroom?destination_type=room', color: '#CC7755', bg: 'rgba(204,119,85,0.15)',   border: 'rgba(204,119,85,0.3)' },
  { label: 'Watch Party',  icon: Eye,     href: 'WatchParty',     color: '#6B7C4A', bg: 'rgba(107,124,74,0.15)',   border: 'rgba(107,124,74,0.3)' },
  { label: 'PK Battles',   icon: Swords,  href: 'PKBattleManager',color: '#d4af37', bg: 'rgba(212,175,55,0.12)',   border: 'rgba(212,175,55,0.25)' },
  { label: 'Featured',     icon: Star,    href: 'FeaturedContent',color: '#8B6F47', bg: 'rgba(139,111,71,0.15)',   border: 'rgba(139,111,71,0.3)' },
  { label: 'VOD Library',  icon: Video,   href: 'VODLibrary',     color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
  { label: 'Create Room',  icon: Plus,    href: 'CreateRoom',     color: '#d4af37', bg: 'rgba(212,175,55,0.12)',   border: 'rgba(212,175,55,0.25)' },
];

var TABS = [
  { id: 'live',        label: 'Live Now',   icon: Radio  },
  { id: 'upcoming',   label: 'Upcoming',  icon: Clock  },
  { id: 'communities',label: 'Community', icon: Users  },
];

export default function Home() {
  var [searchQuery, setSearchQuery]         = useState('');
  var [selectedCategory, setSelectedCategory] = useState('All');
  var [activeTab, setActiveTab]             = useState('live');
  var [showOnboarding, setShowOnboarding]   = useState(false);
  var [showProfileSetup, setShowProfileSetup] = useState(false);
  var [showActivitySidebar, setShowActivitySidebar] = useState(false);
  var [showQuickActions, setShowQuickActions] = useState(false);
  var qc = useQueryClient();
  var { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(async function() { await qc.invalidateQueries(); });

  useEffect(function() {
    var unsub = base44.entities.Room.subscribe(function() {
      qc.invalidateQueries(['rooms']);
    });
    return unsub;
  }, [qc]);

  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: function() { return base44.auth.me(); } });

  var { data: preferences } = useQuery({
    queryKey: ['userPreferences', user && user.id],
    queryFn: async function() {
      var prefs = await base44.entities.UserPreference.filter({ user_id: user.id });
      return prefs[0];
    },
    enabled: !!user,
  });

  var { data: creatorProfile } = useQuery({
    queryKey: ['creatorProfile', user && user.id],
    queryFn: function() { return base44.entities.CreatorProfile.filter({ user_id: user.id }).then(function(r) { return r[0]; }); },
    enabled: !!user,
  });

  useEffect(function() {
    if (!user) return;
    if (!preferences || !preferences.onboarding_completed) {
      setTimeout(function() { setShowOnboarding(true); }, 1000);
    } else if (creatorProfile === null || creatorProfile === undefined) {
      setTimeout(function() { setShowProfileSetup(true); }, 1500);
    }
  }, [user, preferences, creatorProfile]);

  var { data: liveRooms = [], isLoading: loadingLive } = useQuery({
    queryKey: ['rooms', 'live'],
    queryFn: function() { return base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 20); },
    refetchInterval: 10000,
  });

  var { data: scheduledRooms = [], isLoading: loadingScheduled } = useQuery({
    queryKey: ['rooms', 'scheduled'],
    queryFn: function() { return base44.entities.Room.filter({ status: 'scheduled' }, 'scheduled_start', 10); },
  });

  var { data: communities = [], isLoading: loadingCommunities } = useQuery({
    queryKey: ['communities'],
    queryFn: function() { return base44.entities.Community.list('-member_count', 12); },
  });

  function filterRooms(rooms) {
    return rooms.filter(function(room) {
      var matchSearch = !searchQuery ||
        room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()));
      var matchCat = selectedCategory === 'All' ||
        (room.tags && room.tags.includes(selectedCategory.toLowerCase()));
      return matchSearch && matchCat;
    });
  }

  function SkeletonCards(count) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: count }).map(function(_, i) {
          return <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />;
        })}
      </div>
    );
  }

  return (
    <>
      <OnboardingFlow isOpen={showOnboarding} onClose={function() { setShowOnboarding(false); }} />
      <CreatorProfileSetup user={user} isOpen={showProfileSetup} onClose={function() { setShowProfileSetup(false); }} />
      <ActivitySidebar isOpen={showActivitySidebar} onClose={function() { setShowActivitySidebar(false); }} />
      <QuickActionPanel isOpen={showQuickActions} onClose={function() { setShowQuickActions(false); }} />

      {/* Floating quick-action FAB */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring' }}
        whileTap={{ scale: 0.9 }}
        onClick={function() { setShowActivitySidebar(true); }}
        className="fixed bottom-28 right-4 z-30 w-12 h-12 rounded-full flex items-center justify-center shadow-xl md:bottom-8"
        style={{ background: 'linear-gradient(135deg, #3D2B1F, #6B4423)', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <Activity className="w-5 h-5 text-yellow-300" />
      </motion.button>

      <div className="min-h-screen" style={{ background: '#0B0B18' }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        {/* Pull-to-refresh indicator */}
        <motion.div
          style={{ height: pullY, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
          {pullY > 10 && (
            <motion.div
              animate={refreshing ? { rotate: 360 } : { rotate: pullY * 4 }}
              transition={refreshing ? { repeat: Infinity, duration: 0.6, ease: 'linear' } : {}}
              style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(212,175,55,0.3)', borderTopColor: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            </motion.div>
          )}
        </motion.div>

        {/* ── HERO ── */}
        <div className="relative overflow-hidden px-4 pt-6 pb-5"
          style={{ background: 'linear-gradient(160deg, #1A0F0A 0%, #2C1810 60%, #1a1200 100%)', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>

          {/* Live indicator pill */}
          {liveRooms.length > 0 && (
            <div className="flex justify-center mb-3">
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(204,119,85,0.2)', border: '1px solid rgba(204,119,85,0.4)', color: '#CC7755', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                {liveRooms.length} STREAMS LIVE NOW
              </motion.div>
            </div>
          )}

          <h1 className="text-center text-3xl sm:text-4xl font-black mb-1"
            style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em' }}>
            SeeWhy LIVE
          </h1>
          <p className="text-center text-sm mb-5" style={{ color: 'rgba(196,168,130,0.7)' }}>
            Stream · Battle · Watch Together
          </p>

          {/* Search bar — full width on mobile */}
          <div className="relative max-w-2xl mx-auto mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(212,175,55,0.5)' }} />
            <Input
              placeholder="Search rooms, topics, creators..."
              value={searchQuery}
              onChange={function(e) { setSearchQuery(e.target.value); }}
              className="w-full pl-10 h-12 text-sm text-white placeholder:text-white/30 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.2)', fontSize: 14 }}
            />
          </div>

          {/* New Creator CTA */}
          {user && !creatorProfile && (
            <div className="max-w-2xl mx-auto mb-4">
              <Link to="/onboarding">
                <motion.div whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer"
                  style={{ background: 'linear-gradient(90deg, rgba(128,0,32,0.3), rgba(212,175,55,0.15))', border: '1px solid rgba(212,175,55,0.35)' }}>
                  <div>
                    <div className="font-black text-sm" style={{ color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>🚀 NEW CREATOR? START HERE →</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Set up your profile, branding, and first stream in 7 steps</div>
                  </div>
                  <div className="text-xl ml-3">✨</div>
                </motion.div>
              </Link>
            </div>
          )}
          {/* Quick action grid — 3 cols on mobile, 6 on desktop */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-2xl mx-auto">
            {QUICK_ACTIONS.map(function(action) {
              var Icon = action.icon;
              var href = action.href.startsWith('/') ? action.href : createPageUrl(action.href);
              return (
                <Link key={action.label} to={href}>
                  <motion.div whileTap={{ scale: 0.92 }}
                    className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl cursor-pointer transition-all active:opacity-80"
                    style={{ background: action.bg, border: '1px solid ' + action.border }}>
                    <Icon className="w-5 h-5" style={{ color: action.color }} />
                    <span className="text-[10px] font-bold text-center leading-tight"
                      style={{ color: action.color, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
                      {action.label}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── PRIMARY ATTRACTIONS: 20-Person Panel, Watch Party, PK-Battle ── */}
         <div className="px-4 pt-6 pb-4 space-y-3">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             {/* 20-Person Panel Grid */}
             <Link to="/Greenroom?destination_type=panel" className="group">
               <motion.div
                 whileHover={{ scale: 1.02 }}
                 className="relative overflow-hidden rounded-2xl h-40 flex flex-col items-center justify-center cursor-pointer transition-all"
                 style={{ background: 'linear-gradient(135deg, #1a0d2e 0%, #2d1b6b 50%, #1a0d2e 100%)', border: '1px solid rgba(212,175,55,0.25)' }}>
                 <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ background: '#d4af37' }} />
                 <Users className="w-8 h-8 mb-2" style={{ color: '#d4af37' }} />
                 <p className="font-black text-center text-sm" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>
                   20-PERSON PANEL
                 </p>
                 <p className="text-xs text-white/50 mt-1">Max participants</p>
               </motion.div>
             </Link>

             {/* Watch Party */}
             <Link to={createPageUrl('WatchParty')} className="group">
               <motion.div
                 whileHover={{ scale: 1.02 }}
                 className="relative overflow-hidden rounded-2xl h-40 flex flex-col items-center justify-center cursor-pointer transition-all"
                 style={{ background: 'linear-gradient(135deg, #0d2818 0%, #1b6b2d 50%, #0d2818 100%)', border: '1px solid rgba(0,212,255,0.25)' }}>
                 <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ background: '#00d4ff' }} />
                 <Eye className="w-8 h-8 mb-2" style={{ color: '#00d4ff' }} />
                 <p className="font-black text-center text-sm" style={{ color: '#00d4ff', fontFamily: 'Barlow Condensed, sans-serif' }}>
                   WATCH PARTY
                 </p>
                 <p className="text-xs text-white/50 mt-1">Stream together</p>
               </motion.div>
             </Link>

             {/* PK-Battle */}
             <Link to={createPageUrl('PKBattleManager')} className="group">
               <motion.div
                 whileHover={{ scale: 1.02 }}
                 className="relative overflow-hidden rounded-2xl h-40 flex flex-col items-center justify-center cursor-pointer transition-all"
                 style={{ background: 'linear-gradient(135deg, #2d1a0d 0%, #6b2d1b 50%, #2d1a0d 100%)', border: '1px solid rgba(204,119,85,0.25)' }}>
                 <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ background: '#CC7755' }} />
                 <Swords className="w-8 h-8 mb-2" style={{ color: '#CC7755' }} />
                 <p className="font-black text-center text-sm" style={{ color: '#CC7755', fontFamily: 'Barlow Condensed, sans-serif' }}>
                   PK-BATTLE
                 </p>
                 <p className="text-xs text-white/50 mt-1">1v1 competition</p>
               </motion.div>
             </Link>
           </div>
         </div>

         {/* ── CATEGORY FILTER — horizontal scroll ── */}
         <div className="sticky top-[3px] z-30 overflow-x-auto scrollbar-hide"
           style={{ background: 'rgba(11,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.08)', backdropFilter: 'blur(12px)' }}>
           <div className="flex items-center gap-2 px-4 py-2.5" style={{ width: 'max-content', minWidth: '100%' }}>
             {CATEGORIES.map(function(cat) {
               var active = selectedCategory === cat;
               return (
                 <button key={cat}
                   onClick={function() { setSelectedCategory(cat); }}
                   className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
                   style={{
                     fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.07em',
                     background: active ? '#d4af37' : 'rgba(255,255,255,0.05)',
                     color: active ? '#000' : 'rgba(255,255,255,0.45)',
                     border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                   }}>
                   {cat.toUpperCase()}
                 </button>
               );
             })}
           </div>
         </div>

         {/* ── TABS ── */}
         <div className="px-4 pt-4">
           <div className="flex gap-1 p-1 rounded-xl max-w-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
             {TABS.map(function(tab) {
               var Icon = tab.icon;
               var active = activeTab === tab.id;
               return (
                 <button key={tab.id}
                   onClick={function() { setActiveTab(tab.id); }}
                   className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase transition-all"
                   style={{
                     fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em',
                     background: active ? 'rgba(212,175,55,0.15)' : 'transparent',
                     color: active ? '#d4af37' : 'rgba(255,255,255,0.35)',
                     border: active ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent',
                   }}>
                   <Icon className="w-3.5 h-3.5" />
                   <span className="hidden sm:inline">{tab.label}</span>
                   <span className="sm:hidden">{tab.id === 'live' ? 'Live' : tab.id === 'upcoming' ? 'Soon' : 'Groups'}</span>
                 </button>
               );
             })}
           </div>

           {/* Live count badge */}
           {activeTab === 'live' && liveRooms.length > 0 && (
             <div className="flex items-center gap-2 mt-3">
               <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
               <span className="text-sm font-bold" style={{ color: '#CC7755', fontFamily: 'Barlow Condensed, sans-serif' }}>
                 {liveRooms.length} room{liveRooms.length !== 1 ? 's' : ''} live
               </span>
             </div>
           )}
         </div>

        {/* ── ZEGOCLOUD MOBILE BANNER ── */}
        <div className="px-4 pt-4">
          <ZEGOMobileAppBanner />
        </div>

        {/* ── YOUTUBE DISCOVERY ── */}
        <div className="px-0 pt-6 pb-4 border-t border-white/5">
          <YouTubeDiscovery />
        </div>

        {/* ── SOCIAL FEATURES ── */}
        <div className="px-0 pt-6 pb-4 border-t border-white/5 space-y-6">
          {/* Share & Bridge Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
            <ShareToSocial content={{ title: 'Check out SeeWhy LIVE - Stream, Connect, Engage!', url: window.location.href }} />
            {user && <CreatorBridge user={user} />}
          </div>

          {/* Collaboration & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
            <CollaborationMatcher />
            <ContentRecommendations />
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="px-4 pt-4 pb-4">
          <AnimatePresence mode="wait">

            {/* LIVE ROOMS */}
            {activeTab === 'live' && (
              <motion.div key="live" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {loadingLive ? SkeletonCards(6) : filterRooms(liveRooms).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filterRooms(liveRooms).map(function(room, i) {
                      return (
                        <motion.div key={room.id}
                          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}>
                          <FanbaseRoomCard room={room} />
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
                      <Radio className="w-8 h-8" style={{ color: 'rgba(212,175,55,0.4)' }} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-white/60">No live rooms right now</p>
                      <p className="text-sm text-white/30 mt-1">Be the first to go live!</p>
                    </div>
                    <Link to="/SeeWhyLIVEv17">
                      <Button className="font-bold" style={{ background: '#d4af37', color: '#000' }}>
                        <Radio className="w-4 h-4 mr-2" /> Go Live Now
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            )}

            {/* UPCOMING */}
            {activeTab === 'upcoming' && (
              <motion.div key="upcoming" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {loadingScheduled ? SkeletonCards(4) : filterRooms(scheduledRooms).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filterRooms(scheduledRooms).map(function(room, i) {
                      return (
                        <motion.div key={room.id}
                          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}>
                          <RoomCard room={room} />
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Clock className="w-12 h-12" style={{ color: 'rgba(196,168,130,0.3)' }} />
                    <p className="text-white/40 text-sm">No upcoming rooms scheduled</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* COMMUNITIES */}
            {activeTab === 'communities' && (
              <motion.div key="communities" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-white/60">Trending Communities</p>
                  <Link to={createPageUrl('Communities')}>
                    <span className="text-xs" style={{ color: '#d4af37' }}>View All →</span>
                  </Link>
                </div>
                {loadingCommunities ? SkeletonCards(6) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {communities.map(function(community, i) {
                      return (
                        <motion.div key={community.id}
                          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}>
                          <CommunityCard community={community} />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </>
  );
}