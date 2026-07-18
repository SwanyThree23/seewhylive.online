import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import ZEGOMobileAppBanner from '../components/zego/ZEGOMobileAppBanner';
import ActivitySidebar from '../components/shared/ActivitySidebar';
import QuickActionPanel from '../components/shared/QuickActionPanel';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
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

import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
import QuickActionPanel from '../components/shared/QuickActionPanel';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import GridLines from '../components/home/GridLines';
import NebulaBg from '../components/home/NebulaBg';
import StarField from '../components/home/StarField';
import OnlinePresence from '../components/shared/OnlinePresence';
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
    if (dy > 0) {
      e.preventDefault();
      setPullY(Math.min(dy * 0.45, THRESHOLD + 20));
    }
  }
  async function onTouchEnd() {
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      try { await onRefresh(); } catch {}
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
    Music: '#C0392B', Gaming: '#D4AF37', Tech: '#4A8A7A',
    Education: '#6B7C4A', Business: '#D4AF37', Sports: '#CC7755',
    Lifestyle: '#D4854A', Tournament: '#CC7755', Domino: '#D4AF37'
  };
  var tag = room.tags && room.tags[0];
  var tagColor = tag ? (categoryColor[tag] || '#D4AF37') : '#D4AF37';
  var duration = streamDuration(room);
  var accessLabel = room.ppv_price ? 'PPV' : room.is_fan_only ? 'FAN' : 'FREE';
  var accessStyle = accessLabel === 'PPV'
    ? { background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }
    : accessLabel === 'FAN'
    ? { background: 'rgba(128,0,32,0.2)', color: '#D4854A', border: '1px solid rgba(128,0,32,0.4)' }
    : { background: 'rgba(109,191,126,0.1)', color: '#6DBF7E', border: '1px solid rgba(109,191,126,0.25)' };

  return (
    <Link to={`/LiveRoom?id=${room.id}`}>
      <motion.div whileTap={{ scale: 0.98 }}
        className="rounded-2xl overflow-hidden cursor-pointer"
        style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>

        {/* Top row: LIVE + TRENDING badges | Join */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(192,57,43,0.18)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />LIVE
            </span>
            {isTrending && (
              <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(212,133,74,0.15)', color: '#D4854A', border: '1px solid rgba(212,133,74,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
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
        <div className="relative mx-3 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #0F1428, #080B18)' }}>
          {room.thumbnail_url ? (
            <img src={room.thumbnail_url} alt={room.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Radio className="w-8 h-8" style={{ color: 'rgba(212,175,55,0.2)' }} />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,11,24,0.85) 0%, transparent 60%)' }} />
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

// ── Platform Spotlight Strip ──────────────────────────────────────────────
var SPOTLIGHT_ITEMS = [
  { emoji: '⚔️', label: 'State vs State', sub: 'Domino Tournaments', color: '#5B7FA6', page: 'StateVsState' },
  { emoji: '🕊️', label: 'Tribute Wall',   sub: 'Honor Legends',       color: '#7B5EA7', page: 'TributeWall' },
  { emoji: '🤖', label: 'Joyce AI',        sub: 'Co-Host Assistant',   color: '#D4AF37', page: 'JoyceAI' },
  { emoji: '🛡️', label: 'Guardian AI',    sub: 'Live Moderation',     color: '#C0392B', page: 'GuardianAI' },
  { emoji: '🎙️', label: 'AI Podcast',     sub: 'Create Episodes',     color: '#4A8A7A', page: 'PodcastStudio' },
  { emoji: '🎵', label: 'Music Studio',   sub: 'AI Music Creation',   color: '#7B5DA6', page: 'AIMusic' },
  { emoji: '⚡', label: 'INS Forge',      sub: 'AI Graphics',         color: '#F59E0B', page: 'INSForge' },
  { emoji: '📡', label: 'Multi-Platform', sub: 'Stream Everywhere',   color: '#6DBF7E', page: 'MultiPlatform' },
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
          border: '1px solid rgba(212,175,55,0.28)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(212,175,55,0.12)',
          position: 'relative',
        }}
      >
        {/* Background texture lines */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'repeating-linear-gradient(45deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />

        {/* Top badges row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0', position: 'relative' }}>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 10,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: '#D4AF37', background: 'rgba(212,175,55,0.12)',
            border: '1px solid rgba(212,175,55,0.3)', borderRadius: 99,
            padding: '3px 10px',
          }}>
            🏆 UPCOMING EVENT
          </span>
          <span style={{
            fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 10,
            color: '#6DBF7E', background: 'rgba(109,191,126,0.12)',
            border: '1px solid rgba(109,191,126,0.3)', borderRadius: 99,
            padding: '3px 10px', letterSpacing: '0.06em',
          }}>
            WA #1 RANKED
          </span>
        </div>

        {/* Title block */}
        <div style={{ padding: '10px 16px 4px', position: 'relative' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#F0E8D4', letterSpacing: '0.02em', lineHeight: 1.05 }}>
            Washington Classic
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 22, color: '#D4AF37', letterSpacing: '0.04em', lineHeight: 1, marginTop: 2 }}>
            2026
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6, letterSpacing: '0.02em' }}>
            State vs State · 7 Rock Format · Double Elimination
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(212,175,55,0.1)', margin: '10px 16px' }} />

        {/* Info row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px 14px', position: 'relative' }}>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Venue</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, color: '#F0E8D4' }}>Jamar's Sports Bar</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Des Moines, WA</div>
          </div>
          <div style={{ width: 1, height: 36, background: 'rgba(212,175,55,0.15)' }} />
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Format</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, color: '#F0E8D4' }}>5-pt / 150-pt Games</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Live on SeeWhy LIVE</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13,
              color: '#000', background: 'linear-gradient(135deg, #D4AF37, #C9A84C)',
              borderRadius: 10, padding: '8px 14px', letterSpacing: '0.06em',
              textTransform: 'uppercase', boxShadow: '0 2px 12px rgba(212,175,55,0.4)',
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
  { title: 'Social Lights', badge: 'WEEKLY', badgeColor: '#D4AF37', desc: 'Weekly spotlight show featuring influencers & organizers from Social Audio & Social Gaming communities.' },
  { title: 'Domino Entertainment', badge: 'EVENTS', badgeColor: '#800020', desc: 'Hybrid events & tournaments bridging diverse communities with mobile livestream production.' },
];

var DOMINO_SPONSORSHIPS = [
  { tier: 'Universal Chat', price: '$100', desc: 'Chat branding' },
  { tier: 'Segment',        price: '$200', desc: 'Branded segment' },
  { tier: 'Title Sponsor',  price: '$500', desc: 'Full event branding' },
  { tier: 'Affiliate',      price: '10%',  desc: 'Per ticket sold', accent: '#D4854A' },
];

function DominoExpoSection() {
  return (
    <div style={{ background: 'rgba(13,6,2,0.98)', borderTop: '1px solid rgba(201,168,76,0.12)', borderBottom: '1px solid rgba(201,168,76,0.12)' }}>

      {/* Header */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A84C', padding: '2px 8px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.28)', borderRadius: 99 }}>
            Featured Partner
          </span>
          <a href="https://youtube.com/@dominoentertainment5513" target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, color: '#D4854A', letterSpacing: '0.04em', textDecoration: 'none' }}>
            Follow →
          </a>
        </div>
        <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 26, color: '#F0E8D4', letterSpacing: '0.02em', margin: '0 0 2px', lineHeight: 1.1 }}>
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
            <div key={f.title} style={{ flexShrink: 0, width: 140, background: 'rgba(36,22,8,0.8)', border: '1px solid rgba(201,168,76,0.11)', borderRadius: 12, padding: '12px 12px 10px' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 14, color: '#F0E8D4', margin: '0 0 3px', letterSpacing: '0.02em' }}>{f.title}</p>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.35 }}>{f.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(201,168,76,0.07)', margin: '0 16px 14px' }} />

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
              <div style={{ width: 150, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(201,168,76,0.14)', position: 'relative' }}>
                <img src={'https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg'} alt="Domino Entertainment"
                  style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,6,2,0.65) 0%, transparent 50%)' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(128,0,32,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 13, marginLeft: 2 }}>▶</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(201,168,76,0.07)', margin: '0 16px 14px' }} />

      {/* Offerings */}
      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {DOMINO_OFFERINGS.map(function(o) {
          return (
            <div key={o.title} style={{ background: 'rgba(36,22,8,0.8)', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 10, padding: '12px 10px' }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.12em', color: o.badgeColor, background: o.badgeColor + '18', border: '1px solid ' + o.badgeColor + '33', borderRadius: 99, padding: '2px 7px', textTransform: 'uppercase' }}>
                {o.badge}
              </span>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 15, color: '#F0E8D4', margin: '7px 0 4px', letterSpacing: '0.02em', lineHeight: 1.2 }}>{o.title}</p>
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
          var accent = s.accent || '#C9A84C';
          return (
            <div key={s.tier} style={{ flexShrink: 0, minWidth: 110, background: 'rgba(128,0,32,0.07)', border: '1px solid rgba(128,0,32,0.18)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 20, color: accent, margin: '0 0 2px' }}>{s.price}</p>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, color: '#F0E8D4', margin: '0 0 2px', letterSpacing: '0.02em' }}>{s.tier}</p>
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
  const navigate = useNavigate();
  var [activeFilter, setActiveFilter] = useState('All');
  var [showQuickAction, setShowQuickAction] = useState(false);
  var [showOnboarding, setShowOnboarding] = useState(false);
  var qc = useQueryClient();
  var { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(async function() {
    await qc.invalidateQueries();
  });

  var { data: liveRooms = [], isLoading: loadingLive } = useQuery({
    queryKey: ['rooms', 'live'],
    queryFn: function() { return base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 20); },
    refetchInterval: 10000,
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

  var { data: onboarding } = useQuery({
    queryKey: ['onboarding-check', user?.id],
    queryFn: async function() {
      var list = await base44.entities.CreatorOnboarding.filter({ user_id: user.id });
      return list[0] || null;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
  var showOnboardingBanner = user?.id && onboarding !== undefined && (!onboarding || !onboarding.step_1_profile);

  return (
    <div
      className="min-h-screen relative"
      style={{ background: '#080B18', overscrollBehavior: 'contain' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <StarField />
      <NebulaBg />
      <GridLines />
      <ZEGOMobileAppBanner />
      <NotificationBell />
      <ActivitySidebar isOpen={activityOpen} onClose={() => setActivityOpen(false)} />
      <QuickActionPanel isOpen={quickActionsOpen} onClose={() => setQuickActionsOpen(false)} />
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

      {/* ── NEW USER ONBOARDING BANNER ── */}
      {showOnboardingBanner && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 mx-4 mt-3 mb-1 rounded-2xl overflow-hidden cursor-pointer"
          style={{ background: 'linear-gradient(135deg, rgba(128,0,32,0.35) 0%, rgba(212,175,55,0.18) 100%)', border: '1px solid rgba(212,175,55,0.3)' }}
          onClick={() => { window.location.href = '/Onboarding'; }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
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
              style={{ background: '#D4AF37', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
              START →
            </div>
          </div>
          <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #800020, #D4AF37, #6DBF7E, #D4AF37)' }} />
        </motion.div>
      )}

      {/* ── HERO STRIP ── */}
      <div className="flex items-center justify-between px-4"
        style={{ height: 48, background: 'rgba(8,11,24,0.98)', borderBottom: '1px solid rgba(212,175,55,0.10)' }}>
        <div className="flex items-center gap-2">
          {liveCount > 0 ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(139,26,47,0.33)', border: '1px solid #8B1A2F' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#E74C3C' }} />
              <span className="text-[10px] font-bold" style={{ color: '#E74C3C', fontFamily: 'Space Mono, monospace' }}>
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
            style={{ background: 'linear-gradient(90deg, #6B4423, #D4AF37)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
            Go Live →
          </motion.div>
        </Link>
      </div>

      {/* ── WASHINGTON CLASSIC 2026 HERO ── */}
      <div style={{ padding: '14px 0 10px' }}>
        <WashingtonClassicHero />
      </div>

      {/* ── DOMINO SOCIAL EXPO FEATURED PARTNER ── */}
      <DominoExpoSection />

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

      {/* ── WHO'S ONLINE ── */}
      <OnlineUsersGrid compact maxVisible={12} />

      {/* ── PLATFORM FEATURES SPOTLIGHT ── */}
      <SpotlightStrip />

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
                    style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}>
                    <div className="h-20 flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #0F1428, #080B18)' }}>
                      <Users className="w-7 h-7" style={{ color: 'rgba(212,175,55,0.3)' }} />
                    </div>
                    <div className="p-2.5">
                      <p className="font-black text-white text-sm line-clamp-1"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{c.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(212,175,55,0.55)', fontFamily: 'Barlow Condensed, sans-serif' }}>
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
              {/* AI recommendations when no live rooms */}
              <div className="mt-4 w-full">
                <SwanAIRecommendations roomId={liveRooms[0]?.id || null} currentLayout="grid" viewerCount={0} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}
      <SwanAIRecommendations roomId={null} currentLayout="home" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <GridLines />
      <NebulaBg />
      <StarField count={80} />
      <QuickActionPanel isOpen={showQuickAction} onClose={() => setShowQuickAction(false)} />
      <OnboardingFlow isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={user?.id} roomId={null} currentUser={user} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
      <OnlinePresence userId={user?.id || null} />
    </div>
  );
}
