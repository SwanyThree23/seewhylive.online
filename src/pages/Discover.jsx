import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Search, TrendingUp, Users, Calendar, Star,
  Zap, Eye, Clock, ChevronRight, Filter, Youtube, Handshake
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import RoomCard from '../components/rooms/RoomCard';
import CommunityCard from '../components/communities/CommunityCard';
import SignalBars from '../components/live/SignalBars';
import { formatDistanceToNow } from 'date-fns';
import YouTubeDiscovery from '../components/youtube/YouTubeDiscovery';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';

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

const GENRES = ['All', 'Music', 'Gaming', 'Talk', 'Education', 'Tech', 'Art', 'Fitness', 'IRL'];

const OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const CAT_COLOR = { Music: '#C0392B', Gaming: '#D4AF37', Talk: '#D4AF37', Education: '#6B7C4A', Tech: '#D4AF37', Art: '#FF6B8A', Fitness: '#CC7755', IRL: '#D4AF37' };

function FanbaseRoomCard({ room }) {
  var tag = room.tags && room.tags[0];
  var tagColor = tag ? (CAT_COLOR[tag] || '#D4AF37') : '#D4AF37';
  var viewers = room.viewer_count || room.participant_count || 0;
  return (
    <motion.div whileTap={{ scale: 0.98 }} className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full"
          style={{ background: `${tagColor}22`, color: tagColor, border: `1px solid ${tagColor}44`, fontFamily: 'Barlow Condensed, sans-serif' }}>
          {tag || 'Live'}
        </span>
        <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          Join
        </span>
      </div>
      <div className="relative mx-3 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a0d2e, #0d1a2e)' }}>
        {room.thumbnail_url
          ? <img src={room.thumbnail_url} alt={room.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Radio className="w-8 h-8" style={{ color: 'rgba(212,175,55,0.2)' }} /></div>}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,11,24,0.85) 0%, transparent 60%)' }} />
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black"
          style={{ background: 'rgba(192,57,43,0.85)', color: 'white', fontFamily: 'Barlow Condensed, sans-serif' }}>
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
        {room.host_name && (
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(212,175,55,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>{room.host_name}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [tab, setTab] = useState('live'); // live | scheduled | communities | creators
  const debounceRef = useRef(null);
  const queryClient = useQueryClient();
  var { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(async function() { await queryClient.invalidateQueries(); });

  // 300ms debounce
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const { data: liveRooms = [], isLoading: loadingLive } = useQuery({
    queryKey: ['discover-live'],
    queryFn: () => base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 30),
    refetchInterval: 10000,
  });

  const { data: scheduledRooms = [] } = useQuery({
    queryKey: ['discover-scheduled'],
    queryFn: () => base44.entities.Room.filter({ status: 'scheduled' }, 'scheduled_start', 20),
    refetchInterval: 30000,
  });

  const { data: communities = [] } = useQuery({
    queryKey: ['discover-communities'],
    queryFn: () => base44.entities.Community.list('-member_count', 24),
  });

  const { data: creators = [] } = useQuery({
    queryKey: ['discover-creators'],
    queryFn: () => base44.entities.CreatorProfile.list('-follower_count', 20),
  });

  const totalViewers = liveRooms.reduce((s, r) => s + (r.viewer_count || 0), 0);

  const filterRooms = (rooms) => {
    return rooms.filter(r => {
      const matchSearch = !debouncedSearch ||
        r.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        r.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchGenre = genre === 'All' || r.tags?.includes(genre.toLowerCase());
      return matchSearch && matchGenre;
    });
  };

  const trending = [...liveRooms]
    .sort((a, b) => (b.viewer_count || 0) - (a.viewer_count || 0))
    .slice(0, 3);

  const filtered = filterRooms(tab === 'live' ? liveRooms : scheduledRooms);

  return (
    <div className="min-h-screen bg-[#03030A] text-white" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
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
      {/* Dark header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #080B18 0%, #080B18 60%, #080B18 100%)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
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
              <div className="w-2 h-2 rounded-full bg-[#C0392B] animate-pulse" />
              <span className="text-sm font-bold text-white/70" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {liveRooms.length} <span style={{ color: '#C0392B' }}>LIVE</span>
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 sm:gap-6 mb-5 overflow-x-auto scrollbar-hide pb-1">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-2xl font-black text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {totalViewers.toLocaleString()}
              </span>
              <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Viewers</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: '#D4AF37' }} />
              <span className="text-2xl font-black text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {communities.length}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>Communities</span>
            </div>
          </div>

          {/* Hero trending */}
          {trending.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {trending.map((room, i) => (
                <TrendingCard key={room.id} room={room} rank={i + 1} />
              ))}
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
              onFocus={e => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
            />
          </div>
        </div>
      </div>

      {/* Tournament & Battle Feature Strip */}
      <div style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.08)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', gap: 8, padding: '10px 16px', width: 'max-content' }}>
          {[
            { emoji: '⚔️', label: 'SVS Tournaments', sub: 'State vs State', page: 'StateVsState',    color: '#1565C0' },
            { emoji: '🏟️', label: 'Battle Arena',    sub: 'Vote Live Battles', page: 'PKBattleArena',  color: '#C0392B' },
            { emoji: '🏆', label: 'Live Battles',    sub: 'PK Showdowns',   page: 'LiveBattles',     color: '#D4854A' },
            { emoji: '👑', label: 'Elite League',    sub: 'Creator Rankings', page: 'Leaderboard',    color: '#D4AF37' },
            { emoji: '🕊️', label: 'Tribute Wall',   sub: 'Honor Legends',  page: 'TributeWall',     color: '#8B6F47' },
            { emoji: '🎬', label: 'VOD Library',     sub: 'Past Streams',   page: 'VODLibrary',      color: '#D4854A' },
            { emoji: '🎟️', label: 'PPV Events',      sub: 'Pay-Per-View',   page: 'PayPerViewEvents',color: '#8B6F00' },
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
        {/* Tab bar + genre filter */}
        {/* Tabs — scrollable on mobile */}
        <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
          <div className="flex gap-1 p-1 rounded-xl w-max min-w-full sm:w-auto" style={{ background: 'rgba(7,7,15,0.9)', border: '1px solid rgba(22,22,42,1)' }}>
            {[
              { id: 'live', label: 'Live', icon: Radio },
              { id: 'scheduled', label: 'Upcoming', icon: Calendar },
              { id: 'communities', label: 'Communities', icon: Users },
              { id: 'creators', label: 'Creators', icon: Star },
              { id: 'youtube', label: 'YouTube', icon: Youtube },
              { id: 'collab', label: 'Collab', icon: Handshake },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    tab === t.id ? 'text-white' : 'text-white/40 hover:text-white/70'
                  }`} style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', borderBottom: tab === t.id ? '2px solid #D4AF37' : '2px solid transparent', borderRadius: 0, paddingBottom: 6 }}>
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
                  ? { background: '#D4AF37', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', border: '1px solid #D4AF37' }
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
                    <div key={i} className="h-52 bg-[#0B0B18] rounded-xl animate-pulse border border-[#16162A]" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                search ? (
                  <EmptyState icon={Radio} title="No live rooms yet" desc="Try a different search" />
                ) : (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
                      <Radio className="w-7 h-7" style={{ color: 'rgba(212,175,55,0.3)' }} />
                    </div>
                    <h3 className="text-lg font-black text-white/60 mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>No live rooms yet</h3>
                    <Link to={createPageUrl('BroadcastStudio')} className="text-sm font-bold transition-colors" style={{ color: '#D4AF37' }}>Be the first to go live →</Link>
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

          {tab === 'youtube' && (
            <motion.div key="youtube" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <YouTubeDiscovery />
            </motion.div>
          )}

          {tab === 'collab' && (
            <motion.div key="collab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <ContentRecommendations />
              <CollaborationMatcher />
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI-powered content recommendations */}
        <ContentRecommendations />

        {/* YouTube partner content discovery */}
        <div className="mt-8">
          <YouTubeDiscovery />
        </div>
      </div>
    </div>
  );
}

function TrendingCard({ room, rank }) {
  const rankColors = ['#FFB800', '#5A5A7A', '#FF8C00'];
  return (
    <Link to={`${createPageUrl('LiveRoom')}?id=${room.id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="relative rounded-xl overflow-hidden border border-[#16162A] hover:border-[#C0392B]/30 transition-all cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #0B0B18 0%, #07070F 100%)' }}
      >
        {room.thumbnail_url && (
          <img src={room.thumbnail_url} alt="" className="w-full h-28 object-cover opacity-60" />
        )}
        {!room.thumbnail_url && (
          <div className="w-full h-28 bg-gradient-to-br from-[#1a0010] to-[#0B0B18] flex items-center justify-center">
            <Radio className="w-10 h-10 text-[#C0392B]/30" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="text-xs font-black font-mono" style={{ color: rankColors[rank - 1] }}>#{rank}</span>
          <span style={{ background: '#C0392B', color: '#fff', fontSize: 11, fontWeight: 900, padding: '2px 6px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4, border: 'none', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
        </div>
        <div className="p-3">
          <p className="text-sm font-bold text-white truncate">{room.title}</p>
          <div className="flex items-center justify-between mt-1">
            <SignalBars count={5} active={true} size="xs" />
            <span className="text-[10px] text-[#C9A84C] font-mono">{(room.viewer_count || 0).toLocaleString()} viewers</span>
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
        className="flex items-center gap-4 p-4 rounded-xl border border-[#16162A] hover:border-[#FFB800]/30 bg-[#0B0B18] hover:bg-[#10101E] transition-all cursor-pointer"
      >
        <div className="w-12 h-12 rounded-lg bg-[#07070F] border border-[#16162A] flex items-center justify-center shrink-0">
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
  const isLive = creator.is_live;
  const initials = creator.display_name?.charAt(0)?.toUpperCase() || '?';
  return (
    <Link to={`${createPageUrl('PublicProfile')}?id=${creator.user_id}`}>
      <motion.div whileTap={{ scale: 0.97 }}
        className="relative p-4 rounded-2xl cursor-pointer text-center"
        style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.12)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
        {isLive && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black"
            style={{ background: 'rgba(192,57,43,0.85)', color: 'white', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
          </div>
        )}
        {/* Octagonal avatar */}
        <div className="mx-auto mb-3" style={{ width: 64, height: 64, clipPath: OCT, background: 'rgba(212,175,55,0.25)' }}>
          <div style={{ width: '100%', height: '100%', clipPath: OCT,
            background: creator.avatar_url ? 'transparent' : 'linear-gradient(135deg, #800020, #D4AF37)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: 'white', overflow: 'hidden' }}>
            {creator.avatar_url
              ? <img src={creator.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
        </div>
        <p className="text-sm font-black text-white truncate" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>{creator.display_name}</p>
        <p className="text-[10px] mt-0.5 capitalize" style={{ color: 'rgba(212,175,55,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>{creator.category}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <Users className="w-3 h-3" style={{ color: '#D4AF37' }} />
          <span className="text-[11px] font-bold" style={{ color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>{(creator.follower_count || 0).toLocaleString()}</span>
        </div>
      </motion.div>
    </Link>
  );
}

function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)' }}>
        <Icon className="w-7 h-7" style={{ color: 'rgba(212,175,55,0.3)' }} />
      </div>
      <h3 className="text-lg font-black text-white/60 mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{title}</h3>
      <p className="text-sm text-white/30" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{desc}</p>
    </div>
  );
}