import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Radio, Search, TrendingUp, Users, Calendar, Star,
  Zap, Eye, Clock, ChevronRight, Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import RoomCard from '../components/rooms/RoomCard';
import CommunityCard from '../components/communities/CommunityCard';
import SignalBars from '../components/live/SignalBars';
import { formatDistanceToNow } from 'date-fns';

const GENRES = ['All', 'Music', 'Gaming', 'Talk', 'Education', 'Tech', 'Art', 'Fitness', 'IRL'];

export default function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [tab, setTab] = useState('live'); // live | scheduled | communities | creators
  const debounceRef = useRef(null);

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
    <div className="min-h-screen bg-[#03030A] text-white">
      {/* Hero banner */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B0B18 0%, #07070F 60%, #0B0B18 100%)' }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* Stats row */}
          <div className="flex items-center gap-4 sm:gap-6 mb-6 overflow-x-auto scrollbar-hide pb-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF1564] animate-pulse" />
              <span className="text-3xl font-black text-white" style={{ fontFamily: 'monospace' }}>
                {liveRooms.length}
              </span>
              <span className="text-[#FF1564] text-sm font-bold uppercase tracking-wider">Live Now</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#00F5FF]" />
              <span className="text-3xl font-black text-white" style={{ fontFamily: 'monospace' }}>
                {totalViewers.toLocaleString()}
              </span>
              <span className="text-[#00F5FF] text-sm font-bold uppercase tracking-wider">Viewers</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FFB800]" />
              <span className="text-3xl font-black text-white" style={{ fontFamily: 'monospace' }}>
                {communities.length}
              </span>
              <span className="text-[#FFB800] text-sm font-bold uppercase tracking-wider">Communities</span>
            </div>
          </div>

          {/* Hero trending */}
          {trending.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FF1564]/50 focus:bg-white/8 transition-all"
            />
          </div>
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
            ].map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    tab === t.id ? 'bg-[#CC7755] text-white' : 'text-white/40 hover:text-white/70'
                  }`} style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                  {t.id === 'live' && liveRooms.length > 0 && (
                    <span className="bg-white/20 rounded-full px-1.5 text-[9px]">{liveRooms.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Genre pills */}
        {(tab === 'live' || tab === 'scheduled') && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-1">
            {GENRES.map(g => (
              <button key={g} onClick={() => setGenre(g)}
                className={`shrink-0 text-[10px] px-3 py-1.5 rounded-full border transition-all active:scale-95 whitespace-nowrap ${
                  genre === g ? 'text-white' : 'border-white/10 text-white/40'
                }`}
                style={genre === g ? { background: 'rgba(204,119,85,0.2)', border: '1px solid rgba(204,119,85,0.4)', color: '#CC7755' } : {}}>
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
                <EmptyState icon={Radio} title="No live streams" desc={search ? 'Try a different search' : 'Check back soon — creators are spinning up!'} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((room, i) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <RoomCard room={room} />
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
        </AnimatePresence>
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
        className="relative rounded-xl overflow-hidden border border-[#16162A] hover:border-[#FF1564]/30 transition-all cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #0B0B18 0%, #07070F 100%)' }}
      >
        {room.thumbnail_url && (
          <img src={room.thumbnail_url} alt="" className="w-full h-28 object-cover opacity-60" />
        )}
        {!room.thumbnail_url && (
          <div className="w-full h-28 bg-gradient-to-br from-[#1a0010] to-[#0B0B18] flex items-center justify-center">
            <Radio className="w-10 h-10 text-[#FF1564]/30" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="text-xs font-black font-mono" style={{ color: rankColors[rank - 1] }}>#{rank}</span>
          <Badge className="bg-[#FF1564] text-white text-[9px] border-0 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </Badge>
        </div>
        <div className="p-3">
          <p className="text-sm font-bold text-white truncate">{room.title}</p>
          <div className="flex items-center justify-between mt-1">
            <SignalBars count={5} active={true} size="xs" />
            <span className="text-[10px] text-[#00F5FF] font-mono">{(room.viewer_count || 0).toLocaleString()} viewers</span>
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
  return (
    <Link to={`${createPageUrl('PublicProfile')}?id=${creator.user_id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="relative p-4 rounded-xl border border-[#16162A] hover:border-[#8B5CF6]/30 bg-[#0B0B18] hover:bg-[#10101E] transition-all cursor-pointer text-center"
      >
        {isLive && (
          <Badge className="absolute top-2 right-2 bg-[#FF1564] text-white text-[8px] border-0">LIVE</Badge>
        )}
        <div className="w-14 h-14 rounded-full mx-auto mb-3 bg-gradient-to-br from-[#FF1564] to-[#8B5CF6] flex items-center justify-center text-xl font-black text-white overflow-hidden">
          {creator.avatar_url
            ? <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
            : creator.display_name?.charAt(0)?.toUpperCase()
          }
        </div>
        <p className="text-sm font-bold text-white truncate">{creator.display_name}</p>
        <p className="text-[10px] text-white/40 mt-0.5 capitalize">{creator.category}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <Users className="w-3 h-3 text-[#8B5CF6]" />
          <span className="text-[9px] text-[#8B5CF6] font-mono">{(creator.follower_count || 0).toLocaleString()}</span>
        </div>
      </motion.div>
    </Link>
  );
}

function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-[#0B0B18] border border-[#16162A] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-white/20" />
      </div>
      <h3 className="text-lg font-bold text-white/60 mb-1">{title}</h3>
      <p className="text-sm text-white/30">{desc}</p>
    </div>
  );
}