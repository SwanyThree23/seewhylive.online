import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search as SearchIcon, Radio, Users, Trophy, User,
  TrendingUp, Clock, X, Flame, Star, Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import RoomCard from '../components/rooms/RoomCard';
import CommunityCard from '../components/communities/CommunityCard';
import ChallengeCard from '../components/community/ChallengeCard';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const AMBER   = '#D4854A';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const TABS = [
  { id: 'live',        label: 'Live',        icon: Radio },
  { id: 'rooms',       label: 'Rooms',       icon: Radio },
  { id: 'creators',    label: 'Creators',    icon: User },
  { id: 'communities', label: 'Communities', icon: Users },
  { id: 'challenges',  label: 'Challenges',  icon: Trophy },
];

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function CreatorResult({ creator }) {
  const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <Link to={createPageUrl('CreatorPublicProfile') + `?id=${creator.id}`}>
      <div className="flex items-center gap-3 p-3 rounded-xl transition-all"
        style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(255,255,255,0.05)' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-black text-sm"
          style={{
            background: creator.avatar_url ? undefined : `linear-gradient(135deg, ${CRIMSON}, ${GOLD})`,
            backgroundImage: creator.avatar_url ? `url(${creator.avatar_url})` : undefined,
            backgroundSize: 'cover', backgroundPosition: 'center',
            color: '#fff', ...T,
          }}>
          {!creator.avatar_url && initials(creator.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-black text-sm text-white truncate" style={T}>
              {creator.full_name || creator.username || 'Creator'}
            </p>
            {creator.is_verified && <Star className="w-3 h-3 shrink-0" style={{ color: GOLD }} />}
          </div>
          <div className="flex items-center gap-2 mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>
            {creator.follower_count != null && (
              <span style={T}><Users className="w-2.5 h-2.5 inline mr-0.5" />{creator.follower_count}</span>
            )}
            {creator.category && <span style={T}>{creator.category}</span>}
          </div>
        </div>
        {creator.is_live && (
          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black"
            style={{ background: 'rgba(128,0,32,0.2)', border: '1px solid rgba(128,0,32,0.4)', color: AMBER, ...T }}>
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
          </span>
        )}
      </div>
    </Link>
  );
}

function TrendingChip({ label, onClick }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black transition-all"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', ...T }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.25)'; e.currentTarget.style.color = GOLD; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
      {label}
    </button>
  );
}

const TRENDING_TAGS = ['🎵 Music', '🎮 Gaming', '💬 Talk Show', '🏋️ Fitness', '🎨 Art', '🍳 Cooking', '📱 Tech', '⚽ Sports'];

export default function SearchPage() {
  const [query, setQuery]       = useState('');
  const [activeTab, setActiveTab] = useState('live');
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sw_recent_searches') || '[]'); } catch { return []; }
  });
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const { data: liveRooms = [] } = useQuery({
    queryKey: ['search-live'],
    queryFn: () => base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 30),
    refetchInterval: 15000,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['search-rooms'],
    queryFn: () => base44.entities.Room.list('-created_date', 100),
  });

  const { data: communities = [] } = useQuery({
    queryKey: ['search-communities'],
    queryFn: () => base44.entities.Community.list('-member_count', 60),
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['search-challenges'],
    queryFn: () => base44.entities.Challenge.list('-created_date', 60),
  });

  const { data: creators = [] } = useQuery({
    queryKey: ['search-creators'],
    queryFn: () => base44.entities.CreatorProfile.list('-follower_count', 80),
  });

  const q = debouncedQuery.toLowerCase().trim();

  const filter = (arr, fields) =>
    arr.filter(item => fields.some(f => item[f]?.toLowerCase().includes(q)));

  const filteredLive       = q ? liveRooms.filter(r => r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)) : liveRooms;
  const filteredRooms      = q ? filter(rooms, ['title', 'description']) : rooms;
  const filteredCommunities = q ? filter(communities, ['name', 'description']) : communities;
  const filteredChallenges  = q ? filter(challenges, ['title', 'description']) : challenges;
  const filteredCreators    = q ? filter(creators, ['full_name', 'username', 'category', 'bio']) : creators;

  const counts = {
    live: filteredLive.length,
    rooms: filteredRooms.length,
    creators: filteredCreators.length,
    communities: filteredCommunities.length,
    challenges: filteredChallenges.length,
  };

  function saveSearch(term) {
    if (!term.trim()) return;
    const next = [term, ...recentSearches.filter(s => s !== term)].slice(0, 8);
    setRecentSearches(next);
    localStorage.setItem('sw_recent_searches', JSON.stringify(next));
  }

  function clearRecent() {
    setRecentSearches([]);
    localStorage.removeItem('sw_recent_searches');
  }

  function handleChipClick(tag) {
    const clean = tag.replace(/^[^\s]+\s/, '');
    setQuery(clean);
    setActiveTab('rooms');
    saveSearch(clean);
  }

  function EmptyState({ icon: Icon, label, sublabel }) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Icon className="w-14 h-14 mb-3" style={{ color: 'rgba(255,255,255,0.08)' }} />
        <p className="font-black text-sm uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>{label}</p>
        {sublabel && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.15)', ...T }}>{sublabel}</p>}
      </div>
    );
  }

  const showSuggestions = !q;

  return (
    <div className="min-h-screen pb-20" style={{ background: '#080B18' }}>
      {/* Sticky search header */}
      <div className="sticky top-0 z-20"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2 px-4 py-3">
          <SearchIcon className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveSearch(query)}
            placeholder="Search streams, creators, communities…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            style={T}
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tab pills */}
        <div className="flex gap-1.5 px-4 pb-2.5 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full shrink-0 font-black uppercase text-[10px] border transition-all"
              style={{
                ...T,
                background: activeTab === tab.id ? 'rgba(212,175,55,0.12)' : 'transparent',
                border: `1px solid ${activeTab === tab.id ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.4)',
              }}>
              {tab.id === 'live' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-0.5" />}
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className="ml-0.5 opacity-60">({counts[tab.id]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4">
        {/* Suggestions when no query */}
        <AnimatePresence mode="wait">
          {showSuggestions && (
            <motion.div key="suggestions"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5 mb-4">
              {/* Trending tags */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: GOLD }} />
                  <p className="text-[10px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>
                    Trending Categories
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TAGS.map(tag => (
                    <TrendingChip key={tag} label={tag} onClick={() => handleChipClick(tag)} />
                  ))}
                </div>
              </div>

              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <p className="text-[10px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>
                        Recent
                      </p>
                    </div>
                    <button onClick={clearRecent}
                      className="text-[10px] font-black uppercase"
                      style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map(s => (
                      <button key={s}
                        onClick={() => { setQuery(s); setActiveTab('rooms'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', ...T }}>
                        <Clock className="w-3 h-3" /> {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live tab */}
        {activeTab === 'live' && (
          filteredLive.length === 0
            ? <EmptyState icon={Radio} label="No live streams" sublabel="Check back soon" />
            : <div>
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4" style={{ color: CRIMSON }} />
                  <p className="font-black text-sm text-white" style={T}>{filteredLive.length} live right now</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLive.map(room => <RoomCard key={room.id} room={room} />)}
                </div>
              </div>
        )}

        {/* Rooms tab */}
        {activeTab === 'rooms' && (
          filteredRooms.length === 0
            ? <EmptyState icon={Radio} label="No rooms found" sublabel={q ? `No results for "${q}"` : ''} />
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.slice(0, 30).map(room => <RoomCard key={room.id} room={room} />)}
              </div>
        )}

        {/* Creators tab */}
        {activeTab === 'creators' && (
          filteredCreators.length === 0
            ? <EmptyState icon={User} label="No creators found" sublabel={q ? `No results for "${q}"` : ''} />
            : <div className="space-y-2">
                {filteredCreators.slice(0, 30).map(c => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    <CreatorResult creator={c} />
                  </motion.div>
                ))}
              </div>
        )}

        {/* Communities tab */}
        {activeTab === 'communities' && (
          filteredCommunities.length === 0
            ? <EmptyState icon={Users} label="No communities found" />
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCommunities.map(c => <CommunityCard key={c.id} community={c} isMember={false} />)}
              </div>
        )}

        {/* Challenges tab */}
        {activeTab === 'challenges' && (
          filteredChallenges.length === 0
            ? <EmptyState icon={Trophy} label="No challenges found" />
            : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredChallenges.map(ch => <ChallengeCard key={ch.id} challenge={ch} />)}
              </div>
        )}
      </div>
    </div>
  );
}
