import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { base44 } from '@/api/base44Client';
import ZEGOMobileAppBanner from '../components/zego/ZEGOMobileAppBanner';

// ── Secondary panels are code-split into their own chunks ──────────────────
// They ride along only when needed, so the Home screen paints fast on mobile
// WebViews instead of waiting on the whole studio/monetization bundle.
var ActivitySidebar              = lazy(() => import('../components/shared/ActivitySidebar'));
var QuickActionPanel             = lazy(() => import('../components/shared/QuickActionPanel'));
var SwanAIRecommendations        = lazy(() => import('../components/live/SwanAIRecommendations'));
import GridLines from '../components/home/GridLines';
import NebulaBg from '../components/home/NebulaBg';
import StarField from '../components/home/StarField';
import NotificationBell from '../components/shared/NotificationBell';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Radio, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import FeaturedContentSection from '../components/home/FeaturedContent';
import ContentRecommendations from '../components/social/ContentRecommendations';

var MilestoneAlerts              = lazy(() => import('../components/creator/MilestoneAlerts'));
var AlertConfig                  = lazy(() => import('../components/live/AlertConfig'));
var ShopDashboard                = lazy(() => import('../components/merch/ShopDashboard'));
var BackgroundCustomizer         = lazy(() => import('../components/settings/BackgroundCustomizer'));
var StreamGoals                  = lazy(() => import('../components/live/StreamGoals'));
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
var StreamerMonetizationCenter   = lazy(() => import('../components/monetization/StreamerMonetizationCenter'));
var RewardShop                   = lazy(() => import('../components/loyalty/RewardShop'));
var HostAlertCenter              = lazy(() => import('../components/live/HostAlertCenter'));
var ViewerCount                  = lazy(() => import('../components/live/ViewerCount'));
import SwanyBotWidget from '../components/guide/ARIAWidget';
var CollaborationMatcher         = lazy(() => import('../components/social/CollaborationMatcher'));
var CreatorBridge                = lazy(() => import('../components/social/CreatorBridge'));
var OnboardingFlow               = lazy(() => import('../components/onboarding/OnboardingFlow'));
var OnlinePresence               = lazy(() => import('../components/shared/OnlinePresence'));
import PullToRefresh from '../components/shared/PullToRefresh';
import FollowButton from '../components/shared/FollowButton';

// ── OCT clip-path constant ─────────────────────────────────────────────────
var OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

function OctTile({ label, size }) {
  var sz = size || 32;
  return (
    <div style={{ width: sz, height: sz, clipPath: OCT, background: 'rgba(255,184,0,0.2)', flexShrink: 0 }}>
      <div style={{ width: '100%', height: '100%', clipPath: OCT,
        background: 'linear-gradient(135deg, #FF1564, #3d0010)',
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
            background: n <= level ? '#FFB800' : 'rgba(255,255,255,0.15)',
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

// ── Top Live Strip ─────────────────────────────────────────────────────────
// Horizontal scroller of the top 8 live rooms — first thing users see.
function TopLiveStripSkeleton() {
  return (
    <div style={{ background: 'rgba(7,7,15,0.99)', borderBottom: '1px solid rgba(255,184,0,0.06)' }}>
      <div className="flex items-center gap-2 px-4 pt-2.5 pb-1">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FF2040' }} />
        <div className="h-2 w-16 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div className="overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-2.5 px-4" style={{ width: 'max-content' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden shrink-0 animate-pulse"
              style={{ width: 116, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,184,0,0.06)' }}>
              <div style={{ height: 72, background: 'rgba(255,255,255,0.04)' }} />
              <div className="px-2 py-1.5 space-y-1.5">
                <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.06)', width: '80%' }} />
                <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.04)', width: '55%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TopLiveStrip({ rooms, loading }) {
  if (loading) return <TopLiveStripSkeleton />;
  if (!rooms || rooms.length === 0) return null;
  var top = rooms.slice(0, 8);

  return (
    <div style={{ background: 'rgba(7,7,15,0.99)', borderBottom: '1px solid rgba(255,184,0,0.06)' }}>
      <div className="flex items-center gap-2 px-4 pt-2.5 pb-1">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FF2040' }} />
        <span className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
          Live Now
        </span>
        <span className="text-[10px] font-bold" style={{ color: 'rgba(255,184,0,0.55)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          {rooms.length}
        </span>
      </div>

      <div className="overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-2.5 px-4" style={{ width: 'max-content' }}>
          {top.map(function(room) {
            var count = room.participant_count || room.viewer_count || 0;
            var countLabel = count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count > 0 ? String(count) : null;
            return (
              <Link key={room.id} to={'/LiveRoom?id=' + room.id}>
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="relative rounded-xl overflow-hidden shrink-0"
                  style={{ width: 116, background: 'rgba(13,6,24,0.97)', border: '1px solid rgba(255,184,0,0.10)' }}>

                  {/* Thumbnail / placeholder */}
                  <div className="relative" style={{ height: 72, background: 'linear-gradient(135deg, #0B0B18, #03030A)' }}>
                    {room.thumbnail_url ? (
                      <img src={room.thumbnail_url} alt={room.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Radio className="w-5 h-5" style={{ color: 'rgba(255,184,0,0.18)' }} />
                      </div>
                    )}
                    <div className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgba(7,7,15,0.88) 0%, transparent 55%)' }} />

                    {/* LIVE badge */}
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded"
                      style={{ background: '#FF2040' }}>
                      <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      <span className="text-[8px] font-black text-white"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>LIVE</span>
                    </div>

                    {/* Viewer count */}
                    {countLabel && (
                      <div className="absolute bottom-1 right-1.5">
                        <span className="text-[9px] font-bold text-white/80"
                          style={{ fontFamily: 'Barlow Condensed, sans-serif', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                          👁 {countLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] font-black text-white leading-tight"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {room.title}
                    </p>
                    {room.host_name && (
                      <p className="text-[9px] mt-0.5 truncate"
                        style={{ color: 'rgba(255,184,0,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {room.host_name}
                      </p>
                    )}
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Live ranking score ─────────────────────────────────────────────────────
function scoreRoom(room) {
  var viewers = room.viewer_count || room.participant_count || 0;
  var startMs = room.started_at ? new Date(room.started_at).getTime()
              : room.created_at ? new Date(room.created_at).getTime()
              : Date.now();
  var ageMinutes = (Date.now() - startMs) / 60000;

  // Base: sqrt dampens superstar effect so small rooms can compete
  var score = Math.sqrt(viewers + 1) * 10;

  // Freshness bonus — decays linearly from 15 pts at 0 min to 0 at 90 min
  score += Math.max(0, 1 - ageMinutes / 90) * 15;

  // Room type multipliers
  if (room.room_type === 'battle')      score *= 1.3;
  if (room.room_type === 'watch_party') score *= 1.15;
  if (room.room_type === 'panel' && viewers > 3) score *= 1.1;

  // Trending bonus
  if (viewers >= 500) score *= 1.1;

  // PPV/fan-only slight reduction (less discoverable)
  if (room.ppv_price || room.is_fan_only) score *= 0.92;

  return score;
}

// Is this room "rising" — new and gaining traction?
function isRising(room) {
  var viewers = room.viewer_count || room.participant_count || 0;
  var startMs = room.started_at ? new Date(room.started_at).getTime()
              : room.created_at ? new Date(room.created_at).getTime()
              : Date.now();
  var ageMinutes = (Date.now() - startMs) / 60000;
  return ageMinutes < 25 && viewers >= 5;
}

var RANK_STYLES = [
  { label: '#1', bg: 'linear-gradient(135deg, #B8860B, #FFB800)', color: '#000', glow: 'rgba(255,184,0,0.45)' },
  { label: '#2', bg: 'linear-gradient(135deg, #6B6B6B, #B0B0B0)', color: '#000', glow: 'rgba(176,176,176,0.35)' },
  { label: '#3', bg: 'linear-gradient(135deg, #7B3F00, #CD7F32)', color: '#fff', glow: 'rgba(205,127,50,0.35)' },
];

// ── FanbaseRoomCard ────────────────────────────────────────────────────────
function FanbaseRoomCard({ room, rank, rising }) {
  var participantCount = room.participant_count || room.viewer_count || 0;
  var displayNames = (room.participant_names || []).slice(0, 3);
  var extra = participantCount > 3 ? participantCount - 3 : 0;
  var isTrending = participantCount >= 500;
  var rankStyle = rank != null && rank < 3 ? RANK_STYLES[rank] : null;
  var categoryColor = {
    Music: '#FF2040', Gaming: '#FFB800', Tech: '#00F5FF',
    Education: '#00FF88', Business: '#FFB800', Sports: '#FF8C00',
    Lifestyle: '#FF8C00', Tournament: '#FF8C00', Domino: '#FFB800'
  };
  var tag = room.tags && room.tags[0];
  var tagColor = tag ? (categoryColor[tag] || '#FFB800') : '#FFB800';
  var duration = streamDuration(room);
  var accessLabel = room.ppv_price ? 'PPV' : room.is_fan_only ? 'FAN' : 'FREE';
  var accessStyle = accessLabel === 'PPV'
    ? { background: 'rgba(255,184,0,0.15)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.3)' }
    : accessLabel === 'FAN'
    ? { background: 'rgba(255,21,100,0.2)', color: '#FF8C00', border: '1px solid rgba(255,21,100,0.4)' }
    : { background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' };

  return (
    <Link to={`/LiveRoom?id=${room.id}`}>
      <motion.div whileTap={{ scale: 0.98 }}
        className="rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: 'rgba(7,7,15,0.9)',
          border: rankStyle
            ? `1px solid ${rankStyle.glow.replace('0.', '0.3').replace('rgba', 'rgba')}`
            : '1px solid rgba(255,184,0,0.12)',
          boxShadow: rankStyle
            ? `0 4px 24px ${rankStyle.glow}, 0 0 0 1px rgba(0,0,0,0.4)`
            : '0 4px 20px rgba(0,0,0,0.4)',
        }}>

        {/* Top row: LIVE + badges | Rank badge | Join */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
          <div className="flex items-center gap-1.5">
            {rankStyle && (
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full"
                style={{ background: rankStyle.bg, color: rankStyle.color, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', boxShadow: `0 2px 8px ${rankStyle.glow}` }}>
                {rankStyle.label}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(255,32,64,0.18)', color: '#FF2040', border: '1px solid rgba(255,32,64,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />LIVE
            </span>
            {rising && !isTrending && (
              <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(0,255,136,0.12)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                ↑ RISING
              </span>
            )}
            {isTrending && (
              <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(255,140,0,0.15)', color: '#FF8C00', border: '1px solid rgba(255,140,0,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                🔥 TRENDING
              </span>
            )}
          </div>
          <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,184,0,0.15)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.3)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
            Join
          </span>
        </div>

        {/* Thumbnail / placeholder */}
        <div className="relative mx-3 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #0B0B18, #03030A)' }}>
          {room.thumbnail_url ? (
            <img src={room.thumbnail_url} alt={room.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Radio className="w-8 h-8" style={{ color: 'rgba(255,184,0,0.2)' }} />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,7,15,0.85) 0%, transparent 60%)' }} />
        </div>

        {/* Room title + host */}
        <div className="px-3 pt-2">
          <p className="font-black text-white leading-tight text-sm line-clamp-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.02em' }}>
            {room.title}
          </p>
          {room.host_name && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <p className="text-[10px]" style={{ color: 'rgba(255,184,0,0.6)', fontFamily: 'Barlow Condensed, sans-serif', margin: 0 }}>
                {room.host_name}
              </p>
              {room.host_id && (
                <div onClick={function(e) { e.preventDefault(); e.stopPropagation(); }}>
                  <FollowButton targetUserId={room.host_id} targetUserName={room.host_name} size="sm" />
                </div>
              )}
            </div>
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
              <span className="text-[11px] font-black ml-0.5" style={{ color: 'rgba(255,184,0,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                +{extra}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </Link>
  );
}

// ── Platform Spotlight Strip ──────────────────────────────────────────────
var SPOTLIGHT_ITEMS = [
  { emoji: '⚔️', label: 'State vs State', sub: 'Domino Tournaments', color: '#5B7FA6', page: 'StateVsState' },
  { emoji: '🕊️', label: 'Tribute Wall',   sub: 'Honor Legends',       color: '#7B5EA7', page: 'TributeWall' },
  { emoji: '🤖', label: 'Joyce AI',        sub: 'Co-Host Assistant',   color: '#FFB800', page: 'JoyceAI' },
  { emoji: '🛡️', label: 'Guardian AI',    sub: 'Live Moderation',     color: '#FF2040', page: 'GuardianAI' },
  { emoji: '🎙️', label: 'AI Podcast',     sub: 'Create Episodes',     color: '#00F5FF', page: 'PodcastStudio' },
  { emoji: '🎵', label: 'Music Studio',   sub: 'AI Music Creation',   color: '#8B5CF6', page: 'AIMusic' },
  { emoji: '⚡', label: 'INS Forge',      sub: 'AI Graphics',         color: '#F59E0B', page: 'INSForge' },
  { emoji: '📡', label: 'Multi-Platform', sub: 'Stream Everywhere',   color: '#00FF88', page: 'MultiPlatform' },
];

function SpotlightStrip() {
  return (
    <div style={{ paddingTop: 8, paddingBottom: 4 }}>
      <div style={{
        padding: '0 16px 6px',
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900,
        fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.25)',
      }}>Platform Features</div>
      <div style={{ overflowX: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 8, display: 'flex', gap: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {SPOTLIGHT_ITEMS.map(function(item) {
          return (
            <Link key={item.page} to={createPageUrl(item.page)} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{
                width: 88, padding: '10px 8px 8px',
                background: item.color + '14',
                border: '1px solid ' + item.color + '30',
                borderRadius: 14,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <div style={{ fontSize: 20, lineHeight: 1 }}>{item.emoji}</div>
                <p style={{
                  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900,
                  fontSize: 11, color: '#fff', textAlign: 'center', lineHeight: 1.15,
                  letterSpacing: '0.03em', margin: 0,
                }}>{item.label}</p>
                <p style={{
                  fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9,
                  color: item.color, textAlign: 'center', margin: 0,
                  letterSpacing: '0.02em', opacity: 0.9,
                }}>{item.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Episode Preview Section ───────────────────────────────────────────────
var DRAMA_EPISODES = [
  { id: 'e1', series: 'Shadow Reign', ep: 'S1E3', hook: 'She finally discovers the truth...', emoji: '👑', color: '#7B2D8B' },
  { id: 'e2', series: 'Street Code',  ep: 'S2E1', hook: 'New city, same enemies.',            emoji: '🌆', color: '#1A3A5C' },
  { id: 'e3', series: 'Cyber Hearts', ep: 'S1E7', hook: 'The AI knows too much.',             emoji: '🤖', color: '#0D3D2B' },
  { id: 'e4', series: 'Block Party',  ep: 'S3E5', hook: 'The final showdown.',                emoji: '🎭', color: '#5C1A1A' },
];

function EpisodePreviewSection() {
  var [activeEp, setActiveEp] = useState(null);

  function openModal(ep) { setActiveEp(ep); }
  function closeModal() { setActiveEp(null); }

  return (
    <div style={{ paddingTop: 8, paddingBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 8px' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>
          🎬 Featured Micro Drama
        </span>
        <Link to={createPageUrl('EpisodeSeries')} style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.55)', textDecoration: 'none' }}>
          All Series →
        </Link>
      </div>
      <div style={{ overflowX: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 8, display: 'flex', gap: 10, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {DRAMA_EPISODES.map(function(ep) {
          return (
            <div key={ep.id} style={{ flexShrink: 0, width: 148, borderRadius: 14, overflow: 'hidden', background: 'rgba(7,7,15,0.95)', border: '1px solid ' + ep.color + '55', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
              <div style={{ height: 90, background: 'linear-gradient(135deg, ' + ep.color + 'aa, #0E0C09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                {ep.emoji}
              </div>
              <div style={{ padding: '8px 10px 10px' }}>
                <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 12, color: '#F0E8D4', margin: 0, lineHeight: 1.2 }}>{ep.series}</p>
                <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: ep.color, margin: '2px 0 4px', letterSpacing: '0.05em' }}>{ep.ep}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '0 0 8px', lineHeight: 1.4 }}>{ep.hook}</p>
                <button
                  onClick={function() { openModal(ep); }}
                  style={{ width: '100%', padding: '5px 0', borderRadius: 8, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer', background: ep.color + '22', border: '1px solid ' + ep.color + '55', color: '#F0E8D4' }}
                >
                  ▶ Preview
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeEp && (
        <div
          onClick={closeModal}
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={function(e) { e.stopPropagation(); }}
            style={{ width: '100%', maxWidth: 420, background: '#0E0C09', borderRadius: 18, overflow: 'hidden', border: '1px solid ' + activeEp.color + '55', boxShadow: '0 20px 60px rgba(0,0,0,0.9)' }}
          >
            <div style={{ width: '100%', paddingTop: '56.25%', position: 'relative', background: 'linear-gradient(135deg, ' + activeEp.color + 'cc, #0E0C09)' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>
                {activeEp.emoji}
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>▶</div>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 18, color: '#F0E8D4', margin: '0 0 2px' }}>{activeEp.series}</p>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: activeEp.color, margin: '0 0 10px', letterSpacing: '0.07em' }}>{activeEp.ep}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 16px', lineHeight: 1.5 }}>{activeEp.hook} Watch the full episode to find out what happens next in this gripping series.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link
                  to={createPageUrl('EpisodeSeries')}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, letterSpacing: '0.06em', textAlign: 'center', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)', color: '#C9A84C', textDecoration: 'none', display: 'block' }}
                >
                  Watch Full Episode
                </Link>
                <button
                  onClick={closeModal}
                  style={{ padding: '10px 18px', borderRadius: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Music Sample Widget ────────────────────────────────────────────────
var MUSIC_TRACKS = [
  { id: 't1', name: 'Neon Drift',    genre: 'Lo-Fi',     bpm: 85,  color: '#8B5CF6' },
  { id: 't2', name: 'Street Gospel', genre: 'Gospel',    bpm: 94,  color: '#D97706' },
  { id: 't3', name: 'Cyber 808',     genre: 'Trap',      bpm: 140, color: '#EF4444' },
  { id: 't4', name: 'AfroTech',      genre: 'Afrobeats', bpm: 118, color: '#10B981' },
];

function AIAudioSampleWidget() {
  var [playing, setPlaying] = useState(null);
  var ctxRef = useRef(null);
  var oscRef = useRef(null);

  function stopCurrent() {
    if (oscRef.current) { try { oscRef.current.stop(); } catch (_e) {} oscRef.current = null; }
    if (ctxRef.current && ctxRef.current.state !== 'closed') { ctxRef.current.close(); ctxRef.current = null; }
    setPlaying(null);
  }

  function playTrack(track) {
    if (playing === track.id) { stopCurrent(); return; }
    stopCurrent();
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    var ctx = new AudioCtx();
    ctxRef.current = ctx;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 220 + (track.bpm % 12) * 8;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.setTargetAtTime(0, ctx.currentTime + 2.5, 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 3);
    oscRef.current = osc;
    setPlaying(track.id);
    setTimeout(function() { setPlaying(null); ctxRef.current = null; oscRef.current = null; }, 3200);
  }

  return (
    <div style={{ paddingTop: 8, paddingBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 8px' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>
          🎵 AI Music Studio — Live Samples
        </span>
        <Link to={createPageUrl('AIMusic')} style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.55)', textDecoration: 'none' }}>
          Open Studio →
        </Link>
      </div>
      <div style={{ overflowX: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 8, display: 'flex', gap: 10, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {MUSIC_TRACKS.map(function(track) {
          var isPlaying = playing === track.id;
          return (
            <div key={track.id} style={{ flexShrink: 0, width: 142, borderRadius: 14, overflow: 'hidden', background: 'rgba(7,7,15,0.95)', border: '1px solid ' + track.color + '44', padding: '12px 12px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <button
                  onClick={function() { playTrack(track); }}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: isPlaying ? track.color : track.color + '22', border: '1px solid ' + track.color + '66', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: isPlaying ? '#fff' : track.color, flexShrink: 0 }}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, color: '#F0E8D4', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</p>
                  <p style={{ fontSize: 9, color: track.color, margin: 0, letterSpacing: '0.05em' }}>{track.genre} · {track.bpm} BPM</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 24 }}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(function(i) {
                  var h = 4 + (Math.sin(i * 1.5) + 1) * 10;
                  return (
                    <div key={i} style={{ flex: 1, borderRadius: 2, height: isPlaying ? (4 + (i % 5) * 4) + 'px' : h + 'px', background: isPlaying ? track.color : track.color + '55', transition: isPlaying ? 'height 0.2s ease' : 'none' }} />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Creator Highlights Row ────────────────────────────────────────────────
var CREATOR_HIGHLIGHTS = [
  { id: 'c1', handle: '@DominoHost',    quote: 'SeeWhy let me co-stream with 4 creators at once — unprecedented!', role: 'Host',       color: '#C9A84C' },
  { id: 'c2', handle: '@QueenPulse',    quote: 'The DSP voice modulator is elite. Studio quality, live.',          role: 'Creator',    color: '#A78BFA' },
  { id: 'c3', handle: '@BlockchainBro', quote: 'Battle mode + loyalty points = my audience never leaves.',         role: 'Host',       color: '#F472B6' },
  { id: 'c4', handle: '@JoyceAI',       quote: 'Co-hosting with an AI kept my stream running 24/7.',              role: 'AI Co-Host', color: '#34D399' },
  { id: 'c5', handle: '@TrapKingLive',  quote: 'First paycheck from streaming came through in days.',             role: 'Creator',    color: '#FB923C' },
];

function CreatorHighlightsRow() {
  return (
    <div style={{ paddingTop: 8, paddingBottom: 4 }}>
      <div style={{ padding: '0 16px 8px' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>
          ⭐ Creator Highlights
        </span>
      </div>
      <div style={{ overflowX: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 8, display: 'flex', gap: 10, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {CREATOR_HIGHLIGHTS.map(function(c) {
          var initials = c.handle.replace('@', '').slice(0, 2).toUpperCase();
          return (
            <div key={c.id} style={{ flexShrink: 0, width: 192, borderRadius: 14, background: 'rgba(7,7,15,0.95)', border: '1px solid ' + c.color + '33', padding: '14px 14px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, ' + c.color + '88, #0E0C09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, color: c.color, flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 12, color: '#F0E8D4', margin: 0 }}>{c.handle}</p>
                  <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: c.color + '22', color: c.color, letterSpacing: '0.05em' }}>{c.role}</span>
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: '0 0 10px', lineHeight: 1.5, fontStyle: 'italic' }}>&ldquo;{c.quote}&rdquo;</p>
              <span style={{ fontSize: 10, fontWeight: 700, color: c.color, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>🔴 Watch Live</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Moments strip ─────────────────────────────────────────────────────────
var MOMENT_EMOJI_MAP = { fire:'🔥', epic:'⚡', funny:'😂', tip:'💡', peak:'📈', highlight:'🌟', auto:'🤖', battle:'⚔️', domino:'🁣' };
function ytIdFromUrl(url) {
  if (!url) return null;
  var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function MomentsStrip() {
  var qc = useQueryClient();
  var { data: clips = [] } = useQuery({
    queryKey: ['moments-strip'],
    queryFn: function() { return base44.entities.StreamClip.list('-created_date', 10); },
    staleTime: 30000,
  });
  useEffect(function() {
    var unsub = base44.entities.StreamClip.subscribe(function() {
      qc.invalidateQueries({ queryKey: ['moments-strip'] });
    });
    return unsub;
  }, [qc]);
  if (clips.length === 0) return null;
  return (
    <div style={{ paddingTop: 4, paddingBottom: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 8px' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>
          ✂️ Moments
        </span>
        <Link to={createPageUrl('ClipsLibrary')} style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,184,0,0.45)', textDecoration: 'none' }}>
          See all →
        </Link>
      </div>
      <div style={{ overflowX: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 8, display: 'flex', gap: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {clips.map(function(clip) {
          var dur = clip.duration_seconds || Math.max(0, (clip.end_timestamp_seconds || 30) - (clip.start_timestamp_seconds || 0));
          var durStr = Math.floor(dur / 60) + ':' + String(Math.floor(dur % 60)).padStart(2, '0');
          var emoji = MOMENT_EMOJI_MAP[clip.highlight_type] || MOMENT_EMOJI_MAP[clip.trigger_type] || MOMENT_EMOJI_MAP[clip.clip_type] || '🎬';
          var thumb = clip.thumbnail_url || clip.thumbnail || null;
          var yt = !thumb ? ytIdFromUrl(clip.clip_url || '') : null;
          return (
            <Link key={clip.id} to={'/moments/' + clip.id} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <motion.div whileTap={{ scale: 0.96 }} style={{ width: 126, borderRadius: 10, overflow: 'hidden', background: 'rgba(7,7,15,0.92)', border: '1px solid rgba(255,184,0,0.1)' }}>
                <div style={{ height: 71, position: 'relative', background: 'linear-gradient(135deg, rgba(255,21,100,0.3), rgba(7,7,15,0.9))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(thumb || yt) ? (
                    <img src={yt ? ('https://img.youtube.com/vi/' + yt + '/mqdefault.jpg') : thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                  ) : (
                    <span style={{ fontSize: 24 }}>{emoji}</span>
                  )}
                  <div style={{ position: 'absolute', bottom: 4, right: 4, padding: '1px 5px', borderRadius: 3, background: 'rgba(0,0,0,0.72)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: '#fff', letterSpacing: '0.04em' }}>{durStr}</div>
                </div>
                <div style={{ padding: '5px 7px 7px' }}>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 12, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>{clip.title || 'Moment'}</p>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>👁 {clip.view_count || 0}</p>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Video Posts Strip ─────────────────────────────────────────────────────
function VideoPostsStrip() {
  var { data: posts = [] } = useQuery({
    queryKey: ['video-posts-strip'],
    queryFn: function() { return base44.entities.Room.filter({ type: 'video', is_public: true }, '-created_date', 8); },
    staleTime: 60000,
  });
  if (posts.length === 0) return null;
  return (
    <div style={{ paddingTop: 4, paddingBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 8px' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>
          🎬 Video Posts
        </span>
        <Link to={createPageUrl('VideoPost')} style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,184,0,0.45)', textDecoration: 'none' }}>
          + Post Video →
        </Link>
      </div>
      <div style={{ overflowX: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 8, display: 'flex', gap: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {posts.map(function(post) {
          var thumb = post.thumbnail_url || null;
          return (
            <Link key={post.id} to={createPageUrl('VideoViewer') + '?id=' + post.id} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <motion.div whileTap={{ scale: 0.96 }} style={{ width: 126, borderRadius: 10, overflow: 'hidden', background: 'rgba(7,7,15,0.92)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ height: 71, position: 'relative', background: 'linear-gradient(135deg, rgba(0,100,200,0.2), rgba(7,7,15,0.9))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {thumb ? (
                    <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                  ) : (
                    <span style={{ fontSize: 24 }}>🎬</span>
                  )}
                  <div style={{ position: 'absolute', top: 4, left: 4, padding: '1px 5px', borderRadius: 3, background: 'rgba(0,0,0,0.72)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 8, color: '#aaa', letterSpacing: '0.04em' }}>VIDEO</div>
                </div>
                <div style={{ padding: '5px 7px 7px' }}>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 12, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>{post.title || 'Video Post'}</p>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>👁 {post.viewer_count || 0}</p>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Washington Classic 2026 Hero Card ─────────────────────────────────────
function WashingtonClassicHero() {
  return (
    <Link to={createPageUrl('StateVsState')} style={{ textDecoration: 'none', display: 'block' }}>
      <motion.div
        whileTap={{ scale: 0.985 }}
        style={{
          margin: '0 16px',
          borderRadius: 20,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0A0005 0%, #1A0008 40%, #0D0A00 100%)',
          border: '1px solid rgba(255,184,0,0.28)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,184,0,0.12)',
          position: 'relative',
        }}
      >
        {/* Background texture lines */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'repeating-linear-gradient(45deg, #FFB800 0, #FFB800 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />

        {/* Top badges row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0', position: 'relative' }}>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 10,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: '#FFB800', background: 'rgba(255,184,0,0.12)',
            border: '1px solid rgba(255,184,0,0.3)', borderRadius: 99,
            padding: '3px 10px',
          }}>
            🏆 UPCOMING EVENT
          </span>
          <span style={{
            fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 10,
            color: '#00FF88', background: 'rgba(0,255,136,0.12)',
            border: '1px solid rgba(0,255,136,0.3)', borderRadius: 99,
            padding: '3px 10px', letterSpacing: '0.06em',
          }}>
            WA #1 RANKED
          </span>
        </div>

        {/* Title block */}
        <div style={{ padding: '10px 16px 4px', position: 'relative' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#F0F0FF', letterSpacing: '0.02em', lineHeight: 1.05 }}>
            Washington Classic
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 22, color: '#FFB800', letterSpacing: '0.04em', lineHeight: 1, marginTop: 2 }}>
            2026
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6, letterSpacing: '0.02em' }}>
            State vs State · 7 Rock Format · Double Elimination
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,184,0,0.1)', margin: '10px 16px' }} />

        {/* Info row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px 14px', position: 'relative' }}>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Venue</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, color: '#F0F0FF' }}>Jamar's Sports Bar</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Des Moines, WA</div>
          </div>
          <div style={{ width: 1, height: 36, background: 'rgba(255,184,0,0.15)' }} />
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Format</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, color: '#F0F0FF' }}>5-pt / 150-pt Games</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Live on SeeWhy LIVE</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13,
              color: '#000', background: 'linear-gradient(135deg, #FFB800, #FFB800)',
              borderRadius: 10, padding: '8px 14px', letterSpacing: '0.06em',
              textTransform: 'uppercase', boxShadow: '0 2px 12px rgba(255,184,0,0.4)',
            }}>
              View →
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ── Domino Social Expo partner data ───────────────────────────────────────
var DOMINO_VIDEOS = [
  { id: 'sn-X0avptY0' },
  { id: 'cFbjR6VFbnI' },
  { id: 'RTR9Rt09qRY' },
];

var DOMINO_FEATURES = [
  { icon: '🌐', title: 'Cross-Platform', desc: 'Simultaneous engagement across all digital ecosystems' },
  { icon: '💰', title: 'Multi-Revenue', desc: 'Tickets, gifts, sponsorships & affiliate commissions' },
  { icon: '🌍', title: 'Global Reach', desc: 'All time zones, no geographic barriers' },
  { icon: '🤝', title: 'Creator-First', desc: 'Collaborative revenue shares & tiered incentives' },
];

var DOMINO_OFFERINGS = [
  { title: 'Social Lights', badge: 'WEEKLY', badgeColor: '#FFB800', desc: 'Weekly spotlight show featuring influencers & organizers from Social Audio & Social Gaming communities.' },
  { title: 'Domino Entertainment', badge: 'EVENTS', badgeColor: '#FF1564', desc: 'Hybrid events & tournaments bridging diverse communities with mobile livestream production.' },
];

var DOMINO_SPONSORSHIPS = [
  { tier: 'Universal Chat', price: '$100', desc: 'Chat branding' },
  { tier: 'Segment',        price: '$200', desc: 'Branded segment' },
  { tier: 'Title Sponsor',  price: '$500', desc: 'Full event branding' },
  { tier: 'Affiliate',      price: '10%',  desc: 'Per ticket sold', accent: '#FF8C00' },
];

function DominoExpoSection() {
  return (
    <div style={{ background: 'rgba(13,6,2,0.98)', borderTop: '1px solid rgba(255,184,0,0.12)', borderBottom: '1px solid rgba(255,184,0,0.12)' }}>

      {/* Header */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#FFB800', padding: '2px 8px', background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.28)', borderRadius: 99 }}>
            Featured Partner
          </span>
          <a href="https://youtube.com/@dominoentertainment5513" target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, color: '#FF8C00', letterSpacing: '0.04em', textDecoration: 'none' }}>
            Follow →
          </a>
        </div>
        <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 26, color: '#F0F0FF', letterSpacing: '0.02em', margin: '0 0 2px', lineHeight: 1.1 }}>
          Domino Social Expo
        </h2>
        <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '0 0 12px', letterSpacing: '0.02em' }}>
          Connecting Worlds · Where Digital Meets Physical
        </p>
        <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.52)', lineHeight: 1.5, margin: '0 0 14px' }}>
          A revolutionary ecosystem bridging physical and digital worlds — hybrid events, cross-platform livestreaming, and a creator-first revenue model that turns passion into income.
        </p>
      </div>

      {/* Feature pillars (horizontal scroll) */}
      <div style={{ overflowX: 'auto', padding: '0 16px 14px', display: 'flex', gap: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {DOMINO_FEATURES.map(function(f) {
          return (
            <div key={f.title} style={{ flexShrink: 0, width: 140, background: 'rgba(36,22,8,0.8)', border: '1px solid rgba(255,184,0,0.11)', borderRadius: 12, padding: '12px 12px 10px' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 14, color: '#F0F0FF', margin: '0 0 3px', letterSpacing: '0.02em' }}>{f.title}</p>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.35 }}>{f.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,184,0,0.07)', margin: '0 16px 14px' }} />

      {/* Videos */}
      <div style={{ padding: '0 16px 8px' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
          Latest from Domino Entertainment
        </span>
      </div>
      <div style={{ overflowX: 'auto', padding: '0 16px 16px', display: 'flex', gap: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {DOMINO_VIDEOS.map(function(v) {
          return (
            <a key={v.id} href={'https://youtu.be/' + v.id} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, textDecoration: 'none' }}>
              <div style={{ width: 150, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,184,0,0.14)', position: 'relative' }}>
                <img src={'https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg'} alt="Domino Entertainment"
                  style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,6,2,0.65) 0%, transparent 50%)' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,21,100,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 13, marginLeft: 2 }}>▶</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,184,0,0.07)', margin: '0 16px 14px' }} />

      {/* Offerings */}
      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {DOMINO_OFFERINGS.map(function(o) {
          return (
            <div key={o.title} style={{ background: 'rgba(36,22,8,0.8)', border: '1px solid rgba(255,184,0,0.1)', borderRadius: 10, padding: '12px 10px' }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.12em', color: o.badgeColor, background: o.badgeColor + '18', border: '1px solid ' + o.badgeColor + '33', borderRadius: 99, padding: '2px 7px', textTransform: 'uppercase' }}>
                {o.badge}
              </span>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 15, color: '#F0F0FF', margin: '7px 0 4px', letterSpacing: '0.02em', lineHeight: 1.2 }}>{o.title}</p>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.35 }}>{o.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Sponsorship & monetization tiers */}
      <div style={{ padding: '0 16px 8px' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
          Sponsorship &amp; Monetization
        </span>
      </div>
      <div style={{ overflowX: 'auto', padding: '0 16px 20px', display: 'flex', gap: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {DOMINO_SPONSORSHIPS.map(function(s) {
          var accent = s.accent || '#FFB800';
          return (
            <div key={s.tier} style={{ flexShrink: 0, minWidth: 110, background: 'rgba(255,21,100,0.07)', border: '1px solid rgba(255,21,100,0.18)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 20, color: accent, margin: '0 0 2px' }}>{s.price}</p>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, color: '#F0F0FF', margin: '0 0 2px', letterSpacing: '0.02em' }}>{s.tier}</p>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{s.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Filter pill labels and logic ───────────────────────────────────────────
var FILTERS = ['All', 'Live Now', 'Watch Party', 'Battles', 'Panel', 'Communities'];

function applyFilter(rooms, filter) {
  if (filter === 'All' || filter === 'Live Now') return rooms;
  if (filter === 'Panel') {
    return rooms.filter(function(r) {
      return r.room_type === 'panel' || (r.participant_count > 1);
    });
  }
  if (filter === 'Battles') {
    return rooms.filter(function(r) {
      return r.room_type === 'battle' || r.category === 'battle';
    });
  }
  if (filter === 'Watch Party') {
    return rooms.filter(function(r) {
      return r.room_type === 'watch_party';
    });
  }
  if (filter === 'Communities') {
    return rooms.filter(function(r) {
      return r.room_type === 'community' || r.category === 'community';
    });
  }
  return rooms;
}

// ── Home page ──────────────────────────────────────────────────────────────
export default function Home() {
  var navigate = useNavigate();
  var [activeFilter, setActiveFilter] = useState('All');
  var [showQuickAction, setShowQuickAction] = useState(false);
  var [activityOpen, setActivityOpen] = useState(false);
  var [quickActionsOpen, setQuickActionsOpen] = useState(false);
  var [showOnboarding, setShowOnboarding] = useState(false);
  var qc = useQueryClient();

  var { data: liveRooms = [], isLoading: loadingLive } = useQuery({
    queryKey: ['rooms', 'live'],
    // Fetch wider pool so ranking algo has more to work with
    queryFn: function() { return base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 50); },
    refetchInterval: 10000,
    select: function(rooms) {
      // Re-rank client-side with composite score
      return [...rooms].sort(function(a, b) { return scoreRoom(b) - scoreRoom(a); });
    },
  });

  var liveCount = liveRooms.length;
  var filteredRooms = applyFilter(liveRooms, activeFilter);

  var { data: communities = [] } = useQuery({
    queryKey: ['communities'],
    queryFn: function() { return base44.entities.Community.list('-member_count', 12); },
  });

  var { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, null);

  var { data: myFollows = [] } = useQuery({
    queryKey: ['my-follows', (user && user.id)],
    queryFn: function() { return base44.entities.Follow.filter({ follower_id: user.id }); },
    enabled: !!(user && user.id),
    staleTime: 60000,
  });

  var followingLive = liveRooms.filter(function(r) {
    return myFollows.some(function(f) { return f.creator_id === r.host_id || f.following_id === r.host_id; });
  });

  var followedIds = myFollows.map(function(f) { return f.following_id || f.creator_id; });
  var suggestedCreators = liveRooms.filter(function(r) {
    return r.host_id && r.host_id !== (user && user.id) && followedIds.indexOf(r.host_id) === -1;
  }).slice(0, 6);

  var { data: onboarding } = useQuery({
    queryKey: ['onboarding-check', (user && user.id)],
    queryFn: async function() {
      var list = await base44.entities.CreatorOnboarding.filter({ user_id: user.id });
      return list[0] || null;
    },
    enabled: !!(user && user.id),
    staleTime: 60000,
  });
  var showOnboardingBanner = (user && user.id) && onboarding !== undefined && (!onboarding || !onboarding.step_1_profile);

  return (
    <div
      className="min-h-screen relative"
      style={{ background: '#03030A', overscrollBehavior: 'contain' }}
    >
      <PullToRefresh onRefresh={async function() { await qc.invalidateQueries(); }}>
      <StarField />
      <NebulaBg />
      <GridLines />
      <ZEGOMobileAppBanner />
      <NotificationBell />
      <Suspense fallback={null}>
        <ActivitySidebar isOpen={activityOpen} onClose={() => setActivityOpen(false)} />
        <QuickActionPanel isOpen={quickActionsOpen} onClose={() => setQuickActionsOpen(false)} />
      </Suspense>
      {/* ── NEW USER ONBOARDING BANNER ── */}
      {showOnboardingBanner && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 mx-4 mt-3 mb-1 rounded-2xl overflow-hidden cursor-pointer"
          style={{ background: 'linear-gradient(135deg, rgba(255,21,100,0.35) 0%, rgba(255,184,0,0.18) 100%)', border: '1px solid rgba(255,184,0,0.3)' }}
          onClick={() => { navigate(createPageUrl('Onboarding')); }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,184,0,0.15)', border: '1px solid rgba(255,184,0,0.3)' }}>
              <span style={{ fontSize: 20 }}>📡</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-sm leading-tight"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>
                Complete Your Creator Setup
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                Set up profile, stream key &amp; 90/10 payout in 5 min
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-full font-black text-xs shrink-0"
              style={{ background: '#FFB800', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
              START →
            </div>
          </div>
          <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, var(--ac), var(--go), var(--cy), var(--em), var(--pu), transparent)' }} />
        </motion.div>
      )}

      {/* ── HERO STRIP ── */}
      <div className="flex items-center justify-between px-4"
        style={{ height: 48, background: 'rgba(7,7,15,0.98)', borderBottom: '1px solid rgba(255,184,0,0.10)' }}>
        <div className="flex items-center gap-2">
          {liveCount > 0 ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,21,100,0.33)', border: '1px solid #FF1564' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FF2040' }} />
              <span className="text-[10px] font-bold" style={{ color: '#FF2040', fontFamily: 'DM Mono, monospace' }}>
                {liveCount} LIVE
              </span>
            </span>
          ) : (
            <span className="text-sm font-black"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
              No streams yet
            </span>
          )}
        </div>
        <Link to={createPageUrl('GoLive')}>
          <motion.div whileTap={{ scale: 0.93 }}
            className="px-4 py-1.5 rounded-full text-xs font-black uppercase cursor-pointer"
            style={{ background: 'linear-gradient(90deg, #B37F00, #FFB800)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
            Go Live →
          </motion.div>
        </Link>
      </div>

      {/* ── FOLLOWING LIVE STRIP ── Live rooms from creators you follow */}
      {followingLive.length > 0 && (
        <div style={{ padding: '10px 0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 8px' }}>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, color: '#FF1A3C', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF1A3C', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
              Following Live
            </span>
          </div>
          <div style={{ overflowX: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 8, display: 'flex', gap: 10, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {followingLive.slice(0, 8).map(function(room) {
              return (
                <Link key={room.id} to={createPageUrl('LiveRoom') + '?id=' + room.id} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <motion.div whileTap={{ scale: 0.96 }} style={{ width: 140, borderRadius: 12, overflow: 'hidden', background: 'rgba(7,7,15,0.9)', border: '1px solid rgba(255,26,60,0.25)' }}>
                    <div style={{ height: 80, position: 'relative', background: 'linear-gradient(135deg, rgba(255,26,60,0.15), rgba(7,7,15,0.9))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {room.thumbnail_url
                        ? <img src={room.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                        : <Radio style={{ width: 24, height: 24, color: '#FF1A3C' }} />
                      }
                      <div style={{ position: 'absolute', top: 5, left: 5, padding: '1px 6px', borderRadius: 4, background: '#FF1A3C', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: '#fff', fontWeight: 900, letterSpacing: '0.08em' }}>LIVE</div>
                    </div>
                    <div style={{ padding: '7px 9px 9px' }}>
                      <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 12, color: '#F0E8D4', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.title || 'Live Stream'}</p>
                      <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>👁 {room.viewer_count || 0}</p>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SUGGESTED CREATORS ── shown when user follows fewer than 3 people */}
      {user && myFollows.length < 3 && suggestedCreators.length > 0 && (
        <div style={{ padding: '10px 0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 8px' }}>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Creators to Follow
            </span>
          </div>
          <div style={{ overflowX: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 8, display: 'flex', gap: 10, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {suggestedCreators.map(function(room) {
              var initials = (room.host_name || 'C').charAt(0).toUpperCase();
              return (
                <div key={room.id} style={{ flexShrink: 0, width: 110, background: 'rgba(7,7,15,0.9)', borderRadius: 14, border: '1px solid rgba(201,168,76,0.15)', overflow: 'hidden', padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(201,168,76,0.3), rgba(255,26,60,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 18, fontWeight: 900, color: '#F0E8D4', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {room.host_avatar_url
                      ? <img src={room.host_avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : initials}
                  </div>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 11, color: '#F0E8D4', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.host_name || 'Creator'}</p>
                  <FollowButton targetUserId={room.host_id} targetUserName={room.host_name || 'Creator'} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TOP LIVE STRIP ── Rooms worth being in, the moment they go live */}
      <TopLiveStrip rooms={liveRooms} loading={loadingLive} />

      {/* ── MOMENTS STRIP ── Recent clips from the creators you follow */}
      <MomentsStrip />

      {/* ── VIDEO POSTS STRIP ── Short-form videos posted by creators */}
      <VideoPostsStrip />

      {/* ── WASHINGTON CLASSIC 2026 HERO ── */}
      <div style={{ padding: '14px 0 10px' }}>
        <WashingtonClassicHero />
      </div>

      {/* ── DOMINO SOCIAL EXPO FEATURED PARTNER ── */}
      <DominoExpoSection />

      {/* ── FILTER PILLS ── */}
      <div className="overflow-x-auto scrollbar-hide"
        style={{ background: 'rgba(7,7,15,0.97)', borderBottom: '1px solid rgba(255,184,0,0.07)' }}>
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
                  background: active ? 'rgba(255,184,0,0.12)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#FFB800' : 'rgba(255,255,255,0.45)',
                  border: active ? '1px solid rgba(255,184,0,0.3)' : '1px solid rgba(255,255,255,0.08)',
                }}>
                {filter.toUpperCase()}
                {active && (
                  <span style={{
                    position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                    width: '60%', height: 2, background: '#FFB800', borderRadius: 1,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── WHO'S ONLINE ── */}
      <OnlineUsersGrid compact maxVisible={12} />

      {/* ── PLATFORM FEATURES SPOTLIGHT ── */}
      <SpotlightStrip />

      {/* ── MICRO DRAMA EPISODE PREVIEW ── */}
      <EpisodePreviewSection />

      {/* ── AI MUSIC SAMPLE WIDGET ── */}
      <AIAudioSampleWidget />

      {/* ── CREATOR HIGHLIGHTS ── */}
      <CreatorHighlightsRow />

      {/* ── FEATURED PARTNER CONTENT ── */}
      <FeaturedContentSection />

      {/* ── CONTENT RECOMMENDATIONS ── */}
      <div className="px-4 pb-4">
        <ContentRecommendations />
      </div>

      {/* ── COMMUNITY CARDS (shown when Communities filter is active) ── */}
      {activeFilter === 'Communities' && (
        <div className="px-4 pt-4 pb-8">
          <p className="font-black text-white/50 text-xs uppercase mb-3"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
            Communities · {communities.length} active
          </p>
          <div className="grid grid-cols-2 gap-3">
            {communities.map(function(c) {
              return (
                <Link key={c.id} to={createPageUrl('Communities')}>
                  <motion.div whileTap={{ scale: 0.97 }} className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(7,7,15,0.9)', border: '1px solid rgba(255,184,0,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}>
                    <div className="h-20 flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #0B0B18, #03030A)' }}>
                      <Users className="w-7 h-7" style={{ color: 'rgba(255,184,0,0.3)' }} />
                    </div>
                    <div className="p-2.5">
                      <p className="font-black text-white text-sm line-clamp-1"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{c.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,184,0,0.55)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {(c.member_count || 0).toLocaleString()} members
                      </p>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
            {communities.length === 0 && (
              <div className="col-span-2 py-12 text-center">
                <p className="text-white/30 text-sm" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>No communities yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ROOM CARDS ── */}
      {activeFilter !== 'Communities' && (
      <div className="px-4 pt-4 pb-8">
        {/* Section label */}
        {filteredRooms.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.22)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              🏆 Ranked Live
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,184,0,0.08)' }} />
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)', fontFamily: 'DM Mono, monospace' }}>
              {filteredRooms.length} streams
            </span>
          </div>
        )}
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
                    <FanbaseRoomCard room={room} rank={i} rising={isRising(room)} />
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
                  style={{ background: 'linear-gradient(90deg, #B37F00, #FFB800)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
                  Be the first → Go Live
                </motion.div>
              </Link>
              {/* AI recommendations when no live rooms */}
              <div className="mt-4 w-full">
                <Suspense fallback={null}>
                  <SwanAIRecommendations roomId={(liveRooms[0] && liveRooms[0].id) || null} currentLayout="grid" viewerCount={0} />
                </Suspense>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}
      <Suspense fallback={null}>
        <SwanAIRecommendations roomId={null} currentLayout="home" viewerCount={0} />
        <MilestoneAlerts userId={(user && user.id)} roomId={null} />
        {(user && user.id) && <AlertConfig creatorId={user.id} />}
        {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      </Suspense>
      <GridLines />
      <NebulaBg />
      <StarField count={80} />
      <Suspense fallback={null}>
        <QuickActionPanel isOpen={showQuickAction} onClose={() => setShowQuickAction(false)} />
        <OnboardingFlow isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
      </Suspense>
      <SwanyBotWidget />
      {/* ContentRec stays eager — it sits above the fold and must not pop in late */}
      <ContentRecommendations />
      <Suspense fallback={null}>
        <CollaborationMatcher />
        <CreatorBridge user={user || null} />
        <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
        <StreamerMonetizationCenter />
      </Suspense>
      <NotificationBell />
      <Suspense fallback={null}>
        <RewardShop creatorId={(user && user.id)} roomId={null} currentUser={user} />
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
        <OnlinePresence userId={(user && user.id) || null} />
      </Suspense>
      </PullToRefresh>
    </div>
  );
}