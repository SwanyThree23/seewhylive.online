import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import FeaturedContentSection from '../components/home/FeaturedContent';

// ── Pull-to-refresh hook ───────────────────────────────────────────────────
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

// ── OCT clip-path constant ─────────────────────────────────────────────────
var OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

function OctTile({ label, size }) {
  var sz = size || 32;
  return (
    <div style={{ width: sz, height: sz, clipPath: OCT, background: 'rgba(212,175,55,0.2)', flexShrink: 0 }}>
      <div style={{ width: '100%', height: '100%', clipPath: OCT,
        background: 'linear-gradient(135deg, #800020, #3d0010)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: sz * 0.35, fontWeight: 900, color: 'rgba(255,255,255,0.9)',
        fontFamily: 'Barlow Condensed, sans-serif' }}>
        {(label || '?').charAt(0).toUpperCase()}
      </div>
    </div>
  );
}

// ── SignalBars component ───────────────────────────────────────────────────
function SignalBars({ count }) {
  var level = count > 2000 ? 4 : count > 500 ? 3 : count > 100 ? 2 : 1;
  return (
    <span className="flex items-end gap-[2px]" aria-label={`${count} viewers`}>
      {[1, 2, 3, 4].map(function(n) {
        return (
          <span key={n} style={{
            width: 3, height: 4 + n * 3, borderRadius: 1,
            background: n <= level ? '#D4AF37' : 'rgba(255,255,255,0.15)',
            display: 'inline-block'
          }} />
        );
      })}
    </span>
  );
}

// ── streamDuration helper ──────────────────────────────────────────────────
function streamDuration(room) {
  var start = room.started_at || room.created_at;
  if (!start) return null;
  var mins = Math.floor((Date.now() - new Date(start).getTime()) / 60000);
  if (mins < 1) return '< 1m';
  if (mins < 60) return mins + 'm';
  return Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm';
}

// ── FanbaseRoomCard ────────────────────────────────────────────────────────
function FanbaseRoomCard({ room }) {
  var participantCount = room.participant_count || room.viewer_count || 0;
  var displayNames = (room.participant_names || []).slice(0, 3);
  var extra = participantCount > 3 ? participantCount - 3 : 0;
  var isTrending = participantCount >= 500;
  var categoryColor = {
    Music: '#FF1564', Gaming: '#8B5CF6', Tech: '#00d4ff',
    Education: '#6B7C4A', Business: '#D4AF37', Sports: '#CC7755',
    Lifestyle: '#FF6B8A', Tournament: '#CC7755', Domino: '#8B5CF6'
  };
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
            <span className="flex items-center gap-1 text-[11px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(255,21,100,0.18)', color: '#FF1564', border: '1px solid rgba(255,21,100,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />LIVE
            </span>
            {isTrending && (
              <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(255,140,0,0.15)', color: '#FF8C00', border: '1px solid rgba(255,140,0,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                🔥 TRENDING
              </span>
            )}
          </div>
          <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full"
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
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${tagColor}22`, color: tagColor, border: `1px solid ${tagColor}44`, fontFamily: 'Barlow Condensed, sans-serif' }}>
              {tag}
            </span>
          )}
          {duration && (
            <span className="text-[11px] font-black" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>{duration}</span>
          )}
          <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full ml-auto"
            style={{ ...accessStyle, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {accessLabel}
          </span>
        </div>

        {/* Participant oct-tile row */}
        {(displayNames.length > 0 || participantCount > 0) && (
          <div className="flex items-center gap-1.5 px-3 pb-3 -mt-1">
            {displayNames.map(function(name, i) { return <OctTile key={i} label={name} size={32} />; })}
            {displayNames.length === 0 && <OctTile label="?" size={32} />}
            {extra > 0 && (
              <span className="text-[11px] font-black ml-0.5" style={{ color: 'rgba(212,175,55,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                +{extra}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </Link>
  );
}

// ── Filter pill labels and logic ───────────────────────────────────────────
var FILTERS = ['All', 'Panel', 'FadesStage', 'Watch Party', 'Battles'];

function applyFilter(rooms, filter) {
  if (filter === 'All') return rooms;
  if (filter === 'Panel') {
    return rooms.filter(function(r) {
      return r.room_type === 'panel' || (r.participant_count > 1);
    });
  }
  if (filter === 'FadesStage' || filter === 'Battles') {
    return rooms.filter(function(r) {
      return r.room_type === 'battle' || r.category === 'battle';
    });
  }
  if (filter === 'Watch Party') {
    return rooms.filter(function(r) {
      return r.room_type === 'watch_party';
    });
  }
  return rooms;
}

// ── Home page ──────────────────────────────────────────────────────────────
export default function Home() {
  var [activeFilter, setActiveFilter] = useState('All');
  var qc = useQueryClient();
  var { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(async function() {
    await qc.invalidateQueries();
  });

  var { data: liveRooms = [], isLoading: loadingLive } = useQuery({
    queryKey: ['rooms', 'live'],
    queryFn: function() { return base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 20); },
    refetchInterval: 10000,
  });

  var { data: communities = [] } = useQuery({
    queryKey: ['communities'],
    queryFn: function() { return base44.entities.Community.list('-member_count', 12); },
  });

  var { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });

  var liveCount = liveRooms.length;
  var filteredRooms = applyFilter(liveRooms, activeFilter);

  return (
    <div
      className="min-h-screen"
      style={{ background: '#080B18' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <motion.div
        style={{ height: pullY, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        {pullY > 10 && (
          <motion.div
            animate={refreshing ? { rotate: 360 } : { rotate: pullY * 4 }}
            transition={refreshing ? { repeat: Infinity, duration: 0.6, ease: 'linear' } : {}}
            style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(212,175,55,0.3)', borderTopColor: '#D4AF37' }}
          />
        )}
      </motion.div>

      {/* ── HERO STRIP ── */}
      <div className="flex items-center justify-between px-4"
        style={{ height: 48, background: 'rgba(8,11,24,0.98)', borderBottom: '1px solid rgba(212,175,55,0.10)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-sm font-black"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', color: liveCount > 0 ? '#CC7755' : 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
            {liveCount > 0 ? `${liveCount} Live Now` : 'No streams yet'}
          </span>
        </div>
        <Link to={createPageUrl('GoLive')}>
          <motion.div whileTap={{ scale: 0.93 }}
            className="px-4 py-1.5 rounded-full text-xs font-black uppercase cursor-pointer"
            style={{ background: 'linear-gradient(90deg, #6B4423, #D4AF37)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
            Go Live →
          </motion.div>
        </Link>
      </div>

      {/* ── FILTER PILLS ── */}
      <div className="overflow-x-auto scrollbar-hide"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.07)' }}>
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ width: 'max-content', minWidth: '100%' }}>
          {FILTERS.map(function(filter) {
            var active = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={function() { setActiveFilter(filter); }}
                className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 whitespace-nowrap relative"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  letterSpacing: '0.07em',
                  background: active ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#D4AF37' : 'rgba(255,255,255,0.45)',
                  border: active ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.08)',
                }}>
                {filter.toUpperCase()}
                {active && (
                  <span style={{
                    position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                    width: '60%', height: 2, background: '#D4AF37', borderRadius: 1,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FEATURED PARTNER CONTENT ── */}
      <FeaturedContentSection />

      {/* ── ROOM CARDS ── */}
      <div className="px-4 pt-4 pb-8">
        <AnimatePresence mode="wait">
          {loadingLive ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map(function(_, i) {
                return (
                  <div key={i} className="h-52 rounded-2xl animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.05)' }} />
                );
              })}
            </motion.div>
          ) : filteredRooms.length > 0 ? (
            <motion.div key={activeFilter}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredRooms.map(function(room, i) {
                return (
                  <motion.div key={room.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}>
                    <FanbaseRoomCard room={room} />
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="empty"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-5">
              <div className="text-5xl">🛰️</div>
              <div className="text-center">
                <p className="font-black text-white/60 text-base"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em' }}>
                  No live rooms right now
                </p>
                <p className="text-sm text-white/30 mt-1"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Be the first to broadcast
                </p>
              </div>
              <Link to={createPageUrl('GoLive')}>
                <motion.div whileTap={{ scale: 0.93 }}
                  className="px-6 py-2.5 rounded-full text-sm font-black uppercase cursor-pointer"
                  style={{ background: 'linear-gradient(90deg, #6B4423, #D4AF37)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
                  Be the first → Go Live
                </motion.div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
