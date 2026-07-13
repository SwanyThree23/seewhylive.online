import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Home, Radio, Search as SearchIcon,
  LayoutDashboard, Layers, Shield, Server,
  Trophy, Eye, Menu, X, User, ChevronRight,
  MessageSquare, ArrowLeft, DollarSign, Video, Sparkles, Lock, Tv2, Globe, Mic2, Swords, Heart, Bot, Tv,
  Film, FileText, Calendar, Sliders, Scissors, Bell, TrendingUp, Star, Users, BarChart2, Activity as ActivityIcon
} from 'lucide-react';
// DollarSign, Heart, Sparkles already imported above
import NotificationHub from '@/components/live/NotificationHub';
import UserMenu from '@/components/shared/UserMenu';
import GlobalSearch from '@/components/shared/GlobalSearch';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { AnimatePresence, motion } from 'framer-motion';
import { usePresenceHeartbeat } from '@/components/shared/PresenceDot';
import { useBackground } from '@/lib/BackgroundManager';
import BrandChyron from '@/components/live/BrandChyron';
import GlobalChatWidget from '@/components/live/GlobalChatWidget';
import SwanyBotWidget from '@/components/guide/ARIAWidget';

// ── 5 Bottom Nav Tabs ──────────────────────────────────────────────────────
var BOTTOM_NAV = [
  { name: 'Home',  icon: Home,         href: createPageUrl('Home') },
  { name: 'Watch', icon: Eye,          href: createPageUrl('Discover') },
  { name: 'Go Live', icon: Radio,      href: createPageUrl('GoLive'), isCenter: true },
  { name: 'Chat',  icon: MessageSquare, href: createPageUrl('Messages') },
  { name: 'Me',    icon: User,         href: createPageUrl('Profile') },
];

// ── Drawer nav groups ──────────────────────────────────────────────────────
var DRAWER_WATCH = [
  { name: 'Home',             icon: Home,    href: createPageUrl('Home') },
  { name: 'Discover',         icon: Eye,     href: createPageUrl('Discover') },
  { name: 'State vs State',   icon: Swords,  href: createPageUrl('StateVsState') },
  { name: 'WA Classic',       icon: Trophy,  href: '/WashingtonClassic' },
  { name: 'Tribute Wall',     icon: Heart,   href: createPageUrl('TributeWall') },
  { name: 'SwanyBot',         icon: Bot,     href: createPageUrl('SwanyBotPage') },
  { name: 'Watch Party',      icon: Eye,     href: createPageUrl('WatchParty') },
  { name: 'Featured Partners',icon: Tv2,     href: createPageUrl('Discover') + '?tab=partners' },
  { name: 'Social Expo',      icon: Tv2,     href: createPageUrl('SocialExpo') },
  { name: 'Audio Room',       icon: Radio,   href: createPageUrl('AudioRoom') },
  { name: 'Leaderboard',      icon: Trophy,       href: createPageUrl('Leaderboard') },
  { name: 'VOD Library',      icon: Film,         href: createPageUrl('VODLibrary') },
  { name: 'Live Battles',     icon: Swords,       href: createPageUrl('LiveBattles') },
  { name: 'PK Arena',         icon: Trophy,       href: createPageUrl('PKBattleArena') },
  { name: 'PPV Events',       icon: Lock,         href: createPageUrl('PayPerViewEvents') },
  { name: 'Featured Content', icon: Tv2,          href: createPageUrl('FeaturedContent') },
  { name: 'Challenges',       icon: Star,         href: createPageUrl('ChallengesHub') },
  { name: 'Loyalty Hub',      icon: Trophy,       href: createPageUrl('LoyaltyHub') },
  { name: 'Communities',      icon: Users,        href: createPageUrl('Communities') },
];

var DRAWER_CREATE = [
  { name: 'Go Live',          icon: Radio,           href: createPageUrl('GoLive') },
  { name: 'LIVE Studio',      icon: Tv,              href: createPageUrl('SeeWhyLIVEv37') },
  { name: 'Broadcast Studio', icon: Video,           href: createPageUrl('BroadcastStudio') },
  { name: 'Green Room',       icon: Video,           href: createPageUrl('GreenroomEnhanced') },
  { name: 'Monetize',         icon: DollarSign,      href: createPageUrl('Monetization') },
  { name: 'Dashboard',        icon: LayoutDashboard, href: createPageUrl('CreatorDashboard') },
  { name: 'Stream Analytics', icon: BarChart2,       href: createPageUrl('StreamAnalytics') },
  { name: 'Analytics',        icon: BarChart2,       href: createPageUrl('Analytics') },
  { name: 'Stream Scheduler', icon: Calendar,        href: createPageUrl('StreamScheduler') },
  { name: 'SwanyBot',         icon: Bot,             href: createPageUrl('SwanyBotPage') },
  { name: 'Enhancement Suite', icon: Sparkles,       href: createPageUrl('EnhancementSuite') },
  { name: 'AI Hub',           icon: Sparkles,        href: createPageUrl('AIHub') },
  { name: 'INS Forge',        icon: Sparkles,        href: createPageUrl('INSForge') },
  { name: 'AI Music Studio',  icon: Radio,           href: createPageUrl('AIMusic') },
  { name: 'Podcast Studio',   icon: Mic2,            href: createPageUrl('PodcastStudio') },
  { name: 'Multi-Platform',   icon: Globe,           href: createPageUrl('MultiPlatform') },
  { name: 'Multi-Platform+',  icon: Globe,           href: createPageUrl('MultiPlatformIntegration') },
  { name: 'Multi-Stream Mgr', icon: Globe,          href: createPageUrl('MultiStreamManager') },
  { name: 'Newsletter Hub',   icon: MessageSquare,   href: createPageUrl('NewsletterHub') },
  { name: 'Creator Profile',  icon: User,            href: createPageUrl('CreatorPublicProfile') },
  { name: 'Joyce AI',         icon: Bot,             href: createPageUrl('JoyceAI') },
  { name: 'Aura AI',          icon: Sparkles,        href: createPageUrl('AuraAI') },
  { name: 'Pre-Flight',       icon: Sliders,         href: createPageUrl('GreenRoomPreFlight') },
  { name: 'Overlay Editor',   icon: Layers,          href: createPageUrl('OverlayEditor') },
  { name: 'Stream Alerts',    icon: Bell,            href: createPageUrl('StreamAlerts') },
  { name: 'Captions',         icon: FileText,        href: createPageUrl('TranscriptionStudio') },
  { name: 'Clips',            icon: Scissors,        href: createPageUrl('ClipsLibrary') },
  { name: 'Content Calendar', icon: Calendar,        href: createPageUrl('ContentCalendar') },
  { name: 'Stream Scheduler', icon: Calendar,        href: createPageUrl('StreamScheduler') },
  { name: 'Stream Analytics', icon: TrendingUp,      href: createPageUrl('StreamAnalytics') },
  { name: 'Advanced Analytics',icon: BarChart2,      href: createPageUrl('AdvancedAnalytics') },
  { name: 'Poll Manager',     icon: Sliders,         href: createPageUrl('PollManager') },
  { name: 'Multi-Stream Mgr', icon: Radio,           href: createPageUrl('MultiStreamManager') },
  { name: 'Voice AI',         icon: Sliders,         href: createPageUrl('VoiceAISettings') },
  { name: 'Challenges',       icon: Star,            href: createPageUrl('ChallengesHub') },
  { name: 'Scene Templates',  icon: Layers,          href: createPageUrl('SceneTemplates') },
  { name: 'SwanyBot',         icon: Bot,             href: createPageUrl('SwanyBotPage') },
  { name: 'Hybrid Room',      icon: Radio,           href: createPageUrl('HybridStreamRoom') },
  { name: 'Enhancement Suite',icon: Sparkles,        href: createPageUrl('EnhancementSuite') },
  { name: 'Messages',         icon: MessageSquare,   href: createPageUrl('Messages') },
  { name: 'Control Room',     icon: LayoutDashboard, href: createPageUrl('ControlRoom') },
  { name: 'PK Battle Mgr',    icon: Swords,          href: createPageUrl('PKBattleManager') },
  { name: 'Creator Subs',     icon: DollarSign,      href: createPageUrl('CreatorSubscriptions') },
  { name: 'Invite Users',     icon: Users,           href: createPageUrl('InviteUsers') },
  { name: 'Analytics',        icon: BarChart2,       href: createPageUrl('Analytics') },
  { name: 'Creator Dashboard',icon: LayoutDashboard, href: createPageUrl('Dashboard') },
  { name: 'Newsletter',       icon: MessageSquare,   href: createPageUrl('Newsletter') },
  { name: 'Overlay Builder',  icon: Layers,          href: createPageUrl('OverlayBuilder') },
  { name: 'Greenroom',        icon: Video,           href: createPageUrl('Greenroom') },
  { name: 'PPV Events',       icon: DollarSign,      href: createPageUrl('PayPerViewEvents') },
  { name: 'VOD Library',      icon: Video,           href: createPageUrl('VODLibrary') },
  { name: 'Social Expo',      icon: Globe,           href: createPageUrl('SocialExpo') },
];

var DRAWER_ACCOUNT = [
  { name: 'Profile',  icon: User,       href: createPageUrl('Profile') },
  { name: 'Settings', icon: SearchIcon, href: createPageUrl('Settings') },
  { name: 'VaultPro', icon: Lock,       href: createPageUrl('VaultPro') },
  { name: 'Terms',    icon: Video,      href: createPageUrl('TermsOfService') },
  { name: 'Privacy',  icon: Video,      href: createPageUrl('PrivacyPolicy') },
  { name: 'BetaStatus', icon: Radio,         href: createPageUrl('BetaStatus') },
  { name: 'Payouts',    icon: DollarSign,    href: createPageUrl('Payouts') },
  { name: 'Notifications', icon: Bell,       href: createPageUrl('Notifications') },
  { name: 'Activity',   icon: ActivityIcon,  href: createPageUrl('Activity') },
  { name: 'Data Export',icon: FileText,      href: createPageUrl('DataExport') },
  { name: 'Viewer Dashboard',icon: LayoutDashboard, href: createPageUrl('ViewerDashboard') },
  { name: 'Loyalty Program',  icon: Trophy,         href: createPageUrl('LoyaltyProgram') },
  { name: 'Loyalty Hub',      icon: Trophy,         href: createPageUrl('LoyaltyHub') },
  { name: 'My Subscriptions', icon: Star,           href: createPageUrl('CreatorSubscriptions') },
  { name: 'Invite Friends',   icon: Users,          href: createPageUrl('InviteUsers') },
  { name: 'Communities',      icon: Users,          href: createPageUrl('Communities') },
  { name: 'Messages',         icon: MessageSquare,  href: createPageUrl('Messages') },
  { name: 'Leaderboard',      icon: Trophy,         href: createPageUrl('Leaderboard') },
];

var DRAWER_ADMIN = [
  { name: 'AdminDashboard',  icon: Shield, href: createPageUrl('AdminDashboard') },
  { name: 'Guardian AI',     icon: Shield, href: createPageUrl('GuardianAI') },
  { name: 'StageCleanup',    icon: Layers, href: createPageUrl('StageCleanup') },
  { name: 'RTMPServer',         icon: Server,  href: createPageUrl('RTMPServer') },
  { name: 'Infra Reference',   icon: Server,  href: createPageUrl('StreamInfraRef') },
  { name: 'Moderation',        icon: Shield,  href: createPageUrl('ModerationDashboard') },
  { name: 'AI Moderation',     icon: Shield,  href: createPageUrl('AIModeration') },
];

// Tab ownership map — which URL patterns belong to each bottom-nav tab
var TAB_OWNERSHIP = {
  Home: /^(\/|\/Home)$/,
  Watch: /\/(Discover|LiveRoom|Room|StateVsState|WashingtonClassic|SVSArena|PKBattleArena|LiveBattles|VODLibrary|WatchParty|TributeWall|FallenLegends|AudioRoom)/i,
  Chat: /\/[Mm]essages/,
  Me: /\/(Profile|Settings|CreatorDashboard|CreatorAnalytics|CreatorPublicProfile|Payouts|PayoutCenter|Notifications|Activity|CreatorSubscriptions|ViewerDashboard)/i,
};

export default function Layout({ children, currentPageName }) {
  var [showSearch, setShowSearch] = useState(false);
  var [showMobileMenu, setShowMobileMenu] = useState(false);
  var location = useLocation();

  // Android hardware back button: push state when drawer opens so back dismisses it
  useEffect(function() {
    if (showMobileMenu) {
      window.history.pushState({ swDrawer: true }, '');
    }
  }, [showMobileMenu]);

  useEffect(function() {
    function onPop() {
      if (showMobileMenu) setShowMobileMenu(false);
    }
    window.addEventListener('popstate', onPop);
    return function() { window.removeEventListener('popstate', onPop); };
  }, [showMobileMenu]);
  var navigate = useNavigate();
  var { backgroundStyle, backgrounds } = useBackground();
  // Scroll-position preservation per bottom-nav tab
  var scrollPositions = useRef({});
  // Virtual tab history stacks — remember last path visited per tab
  var tabMemory = useRef({
    Home: BOTTOM_NAV[0].href,
    Watch: BOTTOM_NAV[1].href,
    Chat: BOTTOM_NAV[3].href,
    Me: BOTTOM_NAV[4].href,
  });
  useEffect(function() {
    var key = location.pathname;
    var saved = scrollPositions.current[key];
    if (saved !== undefined) window.scrollTo(0, saved);
  }, [location.pathname]);
  useEffect(function() {
    function saveScroll() {
      scrollPositions.current[location.pathname] = window.scrollY;
    }
    window.addEventListener('scroll', saveScroll, { passive: true });
    return function() { window.removeEventListener('scroll', saveScroll); };
  }, [location.pathname]);

  // Pages that own their full viewport — suppress header, bottom nav, and padding
  var isFullscreen = ['BroadcastStudio', 'LiveRoom'].includes(currentPageName);

  var { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });

  var { data: liveRooms } = useQuery({
    queryKey: ['layout-live-count'],
    queryFn: function() { return base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 20); },
    refetchInterval: 10000,
  });

  usePresenceHeartbeat();

  var liveCount = (liveRooms && liveRooms.length) || 0;
  var isAdmin = user && user.role === 'admin';

  useEffect(function() {
    function handler(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(function(s) { return !s; });
      }
    }
    window.addEventListener('keydown', handler);
    return function() { window.removeEventListener('keydown', handler); };
  }, []);

  useEffect(function() {
    var path = location.pathname;
    var saved = scrollPositions.current[path];
    if (saved !== undefined) {
      window.requestAnimationFrame(function() { window.scrollTo({ top: saved, behavior: 'instant' }); });
    }
    return function() {
      scrollPositions.current[path] = window.scrollY;
    };
  }, [location.pathname]);

  // Update tab memory when navigation occurs within a tab's domain
  useEffect(function() {
    var path = location.pathname;
    var tabs = Object.keys(TAB_OWNERSHIP);
    for (var i = 0; i < tabs.length; i++) {
      if (TAB_OWNERSHIP[tabs[i]].test(path)) {
        tabMemory.current[tabs[i]] = path + location.search;
        break;
      }
    }
  }, [location.pathname, location.search]);

  function isActive(href) {
    var path = location.pathname;
    var hrefPath = href.split('?')[0];
    return path === hrefPath || path === '/' + currentPageName;
  }

  function isTabActive(item) {
    var pattern = TAB_OWNERSHIP[item.name];
    if (pattern) return pattern.test(location.pathname);
    return isActive(item.href);
  }

  var MAIN_PATHS = BOTTOM_NAV.map(function(i) { return i.href.split('?')[0]; });
  var isMainPage = MAIN_PATHS.includes(location.pathname) || location.pathname === '/';

  function DrawerSection({ label, items, labelColor }) {
    return (
      <div className="px-3 pt-3 pb-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[11px] uppercase font-bold tracking-widest mb-2 px-1"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: labelColor || 'rgba(255,255,255,0.2)' }}>
          {label}
        </p>
        <div className="space-y-0.5">
          {items.map(function(item) {
            var Icon = item.icon;
            var active = isActive(item.href);
            return (
              <Link key={item.name} to={item.href} onClick={function() { setShowMobileMenu(false); }}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                  style={{
                    background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                    borderLeft: active ? '2px solid #d4af37' : '2px solid transparent',
                    userSelect: 'none', WebkitUserSelect: 'none',
                  }}>
                  <Icon className="w-4 h-4 shrink-0" style={{ color: active ? '#d4af37' : 'rgba(255,255,255,0.4)' }} />
                  <span className="text-sm font-bold"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif', color: active ? '#d4af37' : 'rgba(255,255,255,0.6)', letterSpacing: '0.04em' }}>
                    {item.name}
                  </span>
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: '#d4af37' }} />}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={backgrounds[backgroundStyle] || backgrounds.default}>
      <AnimatePresence>
        {showSearch && <GlobalSearch onClose={function() { setShowSearch(false); }} />}
      </AnimatePresence>

      {!isFullscreen && <>
      {/* Brand accent line — sits below status bar on notch devices */}
      <div className="fixed top-0 left-0 right-0 z-[101] pt-safe"
        style={{ background: 'rgba(8,11,24,0.97)' }}>
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #d4af37, #CC7755, #6B7C4A, #d4af37)' }} />
      </div>

      {/* ── HEADER ── */}
      <header className="sticky z-50 w-full"
        style={{ top: 'calc(3px + env(safe-area-inset-top, 0px))', background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.12)', backdropFilter: 'blur(16px)' }}>

        <div className="flex h-14 items-center justify-between px-3 md:px-6 max-w-7xl mx-auto">
          {/* Logo / Back */}
          {isMainPage ? (
            <Link to={createPageUrl('Home')} className="flex items-center gap-2 shrink-0 active:opacity-70 transition-opacity" style={{ userSelect: 'none' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6B4423, #d4af37)' }}>
                <Video className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base leading-none"
                  style={{ fontFamily: 'Orbitron, monospace', color: '#d4af37', letterSpacing: '0.05em' }}>SeeWhy</span>
                <span className="text-[11px] text-white/30 leading-none"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}>LIVE</span>
              </div>
              {liveCount > 0 && (
                <div className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(139,26,47,0.33)', border: '1px solid #8B1A2F' }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#E74C3C' }} />
                  <span className="text-[10px] font-bold" style={{ color: '#E74C3C', fontFamily: 'Space Mono, monospace' }}>LIVE</span>
                </div>
              )}
              <div className="px-1.5 py-0.5 rounded-full hidden sm:flex items-center"
                style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}>
                <span className="text-[10px] font-bold" style={{ color: '#d4af37', fontFamily: 'Space Mono, monospace' }}>90/10</span>
              </div>
            </Link>
          ) : (
            <button onClick={function() { navigate(-1); }}
              className="flex items-center gap-2 shrink-0 active:opacity-70 transition-all active:scale-95"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '6px 12px 6px 8px' }}>
              <ArrowLeft className="w-4 h-4" style={{ color: '#d4af37' }} />
              <span className="text-sm font-black" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.04em' }}>Back</span>
            </button>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Search */}
            <button onClick={function() { setShowSearch(true); }}
              className="flex items-center justify-center rounded-xl transition-all active:scale-95"
              style={{ width: 44, height: 44, minWidth: 44, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', userSelect: 'none', WebkitUserSelect: 'none' }}>
              <SearchIcon className="w-4.5 h-4.5 text-white/50" style={{ width: 18, height: 18 }} />
            </button>

            <div className="relative">
              <NotificationHub />
            </div>
            <UserMenu user={user} isAdmin={isAdmin} />

            {/* Hamburger — animated bars morph to × */}
            <button
              className="flex items-center justify-center rounded-xl transition-all active:scale-95"
              style={{ width: 44, height: 44, minWidth: 44, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', userSelect: 'none', WebkitUserSelect: 'none' }}
              onClick={function() { setShowMobileMenu(function(v) { return !v; }); }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                <div style={{ width: 16, height: 2, background: showMobileMenu ? '#d4af37' : 'rgba(255,255,255,0.5)', borderRadius: 1, transformOrigin: 'center', transform: showMobileMenu ? 'rotate(45deg) translate(4px, 4px)' : 'none', transition: 'all .2s' }} />
                <div style={{ width: 16, height: 2, background: showMobileMenu ? '#d4af37' : 'rgba(255,255,255,0.5)', borderRadius: 1, opacity: showMobileMenu ? 0 : 1, transition: 'all .2s' }} />
                <div style={{ width: 16, height: 2, background: showMobileMenu ? '#d4af37' : 'rgba(255,255,255,0.5)', borderRadius: 1, transformOrigin: 'center', transform: showMobileMenu ? 'rotate(-45deg) translate(4px, -4px)' : 'none', transition: 'all .2s' }} />
              </div>
            </button>
          </div>
        </div>

        {/* Live ticker strip */}
        {liveCount > 0 && (
          <div className="flex items-center justify-between px-4 py-1 text-[10px] font-bold"
            style={{ background: 'rgba(180,50,30,0.12)', borderTop: '1px solid rgba(200,80,30,0.15)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#C0392B' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>SeeWhy LIVE</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <span style={{ color: '#CC7755' }}>{liveCount} stream{liveCount !== 1 ? 's' : ''} live now</span>
            </div>
            <Link to={createPageUrl('Discover')} style={{ color: '#d4af37' }}>
              Watch <ChevronRight className="inline w-3 h-3" />
            </Link>
          </div>
        )}

      </header>
      </>}

      {/* ── SLIDE-OUT LEFT DRAWER ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
              onClick={function() { setShowMobileMenu(false); }}
            />
            {/* Drawer panel */}
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 z-[91] flex flex-col overflow-y-auto w-full sm:w-[80vw] sm:max-w-[320px]"
              style={{ background: 'rgba(8,11,24,0.99)', borderRight: '1px solid rgba(212,175,55,0.12)' }}>

              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 pt-10 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #6B4423, #d4af37)' }}>
                    <Radio className="w-4 h-4 text-black" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm leading-none" style={{ fontFamily: 'Orbitron, monospace', color: '#d4af37' }}>SeeWhy</span>
                    <span className="text-[11px] text-white/30 leading-none mt-0.5" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}>LIVE</span>
                  </div>
                </div>
                <button onClick={function() { setShowMobileMenu(false); }}
                  className="flex items-center justify-center rounded-xl"
                  style={{ width: 44, height: 44, minWidth: 44, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', userSelect: 'none', WebkitUserSelect: 'none' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Group 1: Watch & Play */}
              <DrawerSection label="Watch & Play" items={DRAWER_WATCH} />

              {/* Group 2: Create & Earn */}
              <DrawerSection label="Create & Earn" items={DRAWER_CREATE} />

              {/* Group 3: Account */}
              <DrawerSection label="Account" items={DRAWER_ACCOUNT} />

              {/* Group 4: Admin (isAdmin only) */}
              {isAdmin && (
                <div className="px-3 pt-3 pb-2" style={{ borderTop: '1px solid rgba(212,133,74,0.12)' }}>
                  <p className="text-[11px] uppercase font-bold tracking-widest mb-2 px-1 text-orange-400/40"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Admin</p>
                  <div className="space-y-0.5">
                    {DRAWER_ADMIN.map(function(item) {
                      var Icon = item.icon;
                      return (
                        <Link key={item.name} to={item.href} onClick={function() { setShowMobileMenu(false); }}>
                          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                            style={{ background: 'rgba(212,133,74,0.04)', borderLeft: '2px solid rgba(212,133,74,0.15)', userSelect: 'none', WebkitUserSelect: 'none' }}>
                            <Icon className="w-4 h-4 shrink-0 text-orange-400/70" />
                            <span className="text-sm font-bold text-orange-400/60" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em' }}>{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Drawer footer */}
              <div className="px-4 py-3 text-center" style={{ borderTop: '1px solid rgba(212,175,55,0.1)', background: 'rgba(212,175,55,0.04)', marginTop: 'auto' }}>
                <span className="text-[10px]" style={{ color: 'rgba(212,175,55,0.5)', fontFamily: 'Space Mono, monospace', letterSpacing: '0.08em' }}>Creator · 90% · Always</span>
              </div>
              {/* Bottom padding for safe area */}
              <div className="h-20" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main — with slide-in route transitions */}
      <main className={isFullscreen ? '' : 'pb-main-mobile md:pb-10'}>
        <ErrorBoundary>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.key}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {/* Brand chyron */}
      <BrandChyron />

      {/* Global multilingual chat widget */}
      <GlobalChatWidget />

      {/* SwanyBot — Voice AI Guide */}
      <SwanyBotWidget />

      {/* ── MOBILE BOTTOM NAV (5 tabs) ── */}
      {!isFullscreen && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe"
          style={{ background: 'rgba(8,11,24,0.98)', borderTop: '1px solid rgba(212,175,55,0.15)', backdropFilter: 'blur(20px)' }}>
          <nav className="flex items-end justify-around px-2 pt-2" style={{ height: 60 }}>
            {BOTTOM_NAV.map(function(item) {
              var Icon = item.icon;
              var active = item.isCenter ? isActive(item.href) : isTabActive(item);

              function handleTabPress(e) {
                e.preventDefault();
                if (active && !item.isCenter) {
                  // Tap active tab → scroll to top
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  // Save scroll of current page, then navigate to tab's remembered path
                  scrollPositions.current[location.pathname] = window.scrollY;
                  var dest = item.isCenter
                    ? item.href
                    : (tabMemory.current[item.name] || item.href);
                  navigate(dest);
                }
              }

              if (item.isCenter) {
                return (
                  <Link key={item.name} to={item.href} className="flex flex-col items-center" style={{ marginTop: -8 }} onClick={handleTabPress}>
                    <motion.div
                      whileTap={{ scale: 0.92 }}
                      className="flex items-center justify-center shadow-lg"
                      style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6B4423, #d4af37)',
                        boxShadow: '0 4px 20px rgba(212,175,55,0.4)',
                      }}>
                      <Icon className="w-6 h-6 text-black" />
                    </motion.div>
                    <span className="text-[11px] font-black mt-1 uppercase"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#d4af37', letterSpacing: '0.1em' }}>
                      {item.name}
                    </span>
                  </Link>
                );
              }

              return (
                <Link key={item.name} to={item.href}
                  onClick={handleTabPress}
                  className="flex flex-col items-center gap-1 px-3 pb-1 transition-all active:scale-90"
                  style={{ color: active ? '#d4af37' : 'rgba(255,255,255,0.3)', userSelect: 'none', WebkitUserSelect: 'none', borderTop: active ? '2px solid #d4af37' : '2px solid transparent', paddingTop: 6, transition: 'all .15s' }}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] uppercase font-bold"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Desktop footer */}
      <footer className="hidden md:block py-3 px-6 text-[10px]"
        style={{ background: 'rgba(8,11,24,0.9)', borderTop: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <span style={{ fontFamily: 'Share Tech Mono, monospace' }}>© {new Date().getFullYear()} SeeWhy LIVE</span>
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('TermsOfService')} className="hover:text-white/50 transition-colors">Terms</Link>
            <Link to={createPageUrl('PrivacyPolicy')} className="hover:text-white/50 transition-colors">Privacy</Link>
            <Link to={createPageUrl('BetaStatus')} className="hover:text-white/50 transition-colors">Status</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
