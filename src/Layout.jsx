import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home, Radio, Users, DollarSign, Search as SearchIcon,
  Plus, Video, Zap, Film, LayoutDashboard, Layers, Swords,
  Trophy, Shield, Server, Sparkles, Menu, X, Globe,
  Eye, MessageSquare, Star, ChevronDown
} from 'lucide-react';
import NotificationBell from '@/components/shared/NotificationBell';
import UserMenu from '@/components/shared/UserMenu';
import GlobalSearch from '@/components/shared/GlobalSearch';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { AnimatePresence, motion } from 'framer-motion';
import { usePresenceHeartbeat } from '@/components/shared/PresenceDot';
import BrandChyron from '@/components/live/BrandChyron';
import SignalBars from '@/components/live/SignalBars';

var PRIMARY_NAV = [
  { name: 'Home', icon: Home, href: createPageUrl('Home') },
  { name: 'Discover', icon: SearchIcon, href: createPageUrl('Discover') },
  { name: 'Communities', icon: Users, href: createPageUrl('Communities') },
  { name: 'Battles', icon: Swords, href: createPageUrl('LiveBattles') },
  { name: 'Leaderboard', icon: Trophy, href: createPageUrl('Leaderboard') },
  { name: 'Watch Party', icon: Eye, href: createPageUrl('WatchParty') },
];

var CREATOR_NAV = [
  { name: 'Dashboard', icon: LayoutDashboard, href: createPageUrl('CreatorDashboard') },
  { name: 'Monetize', icon: DollarSign, href: createPageUrl('Monetization') },
  { name: 'Schedule', icon: Radio, href: createPageUrl('StreamScheduler') },
  { name: 'Stream Setup', icon: Server, href: createPageUrl('StreamInfra') },
];

var ADMIN_NAV = [
  { name: 'Admin', icon: Shield, href: createPageUrl('AdminDashboard') },
  { name: 'Stage', icon: Layers, href: createPageUrl('StageCleanup') },
  { name: 'RTMP', icon: Radio, href: createPageUrl('RTMPServer') },
];

var MOBILE_NAV = [
  { name: 'Home', icon: Home, href: createPageUrl('Home') },
  { name: 'Discover', icon: SearchIcon, href: createPageUrl('Discover') },
  { name: 'Live', icon: Radio, href: createPageUrl('LiveRoom') },
  { name: 'Dashboard', icon: LayoutDashboard, href: createPageUrl('CreatorDashboard') },
  { name: 'More', icon: Menu, href: createPageUrl('Communities') },
];

export default function Layout({ children, currentPageName }) {
  var [showSearch, setShowSearch] = useState(false);
  var [showMobileMenu, setShowMobileMenu] = useState(false);
  var location = useLocation();

  var { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });

  var { data: liveRooms } = useQuery({
    queryKey: ['layout-live-count'],
    queryFn: function() { return base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 1); },
    refetchInterval: 15000,
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

  function isActive(href) {
    var path = location.pathname;
    var hrefPath = href.split('?')[0];
    return path === hrefPath || path === '/' + currentPageName;
  }

  return (
    <div className="min-h-screen" style={{ background: '#0B0B18' }}>
      <AnimatePresence>
        {showSearch && <GlobalSearch onClose={function() { setShowSearch(false); }} />}
      </AnimatePresence>

      {/* Brand gradient top line */}
      <div
        className="fixed top-0 left-0 right-0 z-[101] h-[2px]"
        style={{ background: 'linear-gradient(90deg, #FF1564, #FFB800, #00F5FF, #00FF88, #8B5CF6, transparent)' }}
      />

      {/* Header */}
      <header
        className="sticky top-[2px] z-50 w-full"
        style={{ background: 'rgba(7,7,15,0.98)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2 shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #800020, #d4af37)' }}
            >
              <Video className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span
                className="font-bold text-base leading-none"
                style={{ fontFamily: 'Orbitron, monospace', color: '#d4af37', letterSpacing: '0.05em' }}
              >
                SeeWhy
              </span>
              <span className="text-[9px] text-white/30 leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                LIVE
              </span>
            </div>
            <SignalBars count={5} active={liveCount > 0} size="xs" className="ml-1 opacity-60" />
          </Link>

          {/* Primary nav — desktop */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {PRIMARY_NAV.map(function(item) {
              var Icon = item.icon;
              var active = isActive(item.href);
              return (
                <Link key={item.name} to={item.href}>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all"
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      letterSpacing: '0.07em',
                      background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                      color: active ? '#d4af37' : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.name}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search trigger */}
            <button
              onClick={function() { setShowSearch(true); }}
              className="hidden md:flex items-center gap-2 text-xs text-white/30 rounded-lg px-3 py-1.5 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <SearchIcon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Search</span>
              <kbd className="text-[9px] bg-white/5 border border-white/10 rounded px-1">⌘K</kbd>
            </button>

            {/* Guardian AI badge */}
            <Link to={createPageUrl('AIModeration')} className="hidden md:flex">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase"
                style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#8B5CF6', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}
              >
                <Sparkles className="w-3 h-3" />
                Guardian AI
              </div>
            </Link>

            {/* Creator nav links */}
            {CREATOR_NAV.map(function(item) {
              var Icon = item.icon;
              return (
                <Link key={item.name} to={item.href} className="hidden xl:flex">
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase transition-all"
                    style={{ color: 'rgba(212,175,55,0.6)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}
                  >
                    <Icon className="w-3 h-3" />
                    {item.name}
                  </button>
                </Link>
              );
            })}

            {/* Admin links */}
            {isAdmin && ADMIN_NAV.map(function(item) {
              var Icon = item.icon;
              return (
                <Link key={item.name} to={item.href} className="hidden xl:flex">
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase transition-all"
                    style={{ color: 'rgba(255,140,0,0.7)', border: '1px solid rgba(255,140,0,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}
                  >
                    <Icon className="w-3 h-3" />
                    {item.name}
                  </button>
                </Link>
              );
            })}

            {/* Studio */}
            <Link to={createPageUrl('LiveRoom')}>
              <button
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all"
                style={{ background: 'rgba(128,0,32,0.2)', border: '1px solid rgba(212,175,55,0.25)', color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}
              >
                <Radio className="w-3 h-3 text-red-400" />
                Studio
              </button>
            </Link>

            {/* Create */}
            <Link to={createPageUrl('CreateRoom')}>
              <Button
                size="sm"
                className="h-8 text-xs font-bold uppercase gap-1.5"
                style={{ background: '#d4af37', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Create</span>
              </Button>
            </Link>

            <NotificationBell />
            <UserMenu user={user} isAdmin={isAdmin} />

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white/50"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              onClick={function() { setShowMobileMenu(function(v) { return !v; }); }}
            >
              {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div
          className="flex items-center justify-center gap-2 py-1 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: liveCount > 0 ? 'rgba(255,21,100,0.08)' : 'rgba(0,255,136,0.06)', borderTop: '1px solid rgba(255,255,255,0.04)', fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>
            SeeWhy LIVE
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span style={{ color: liveCount > 0 ? '#FF1564' : 'rgba(255,255,255,0.3)' }}>
            {liveCount > 0 ? liveCount + ' streams live' : 'Platform Ready'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <Link to={createPageUrl('BetaStatus')} style={{ color: 'rgba(0,245,255,0.6)', textDecoration: 'underline' }}>
            Status →
          </Link>
        </div>

        {/* Mobile full menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden"
              style={{ background: 'rgba(7,7,15,0.99)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="p-4 grid grid-cols-3 gap-2">
                {[...PRIMARY_NAV, ...CREATOR_NAV].map(function(item) {
                  var Icon = item.icon;
                  return (
                    <Link key={item.name} to={item.href} onClick={function() { setShowMobileMenu(false); }}>
                      <div className="flex flex-col items-center gap-1 py-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Icon className="w-4 h-4 text-yellow-400/60" />
                        <span className="text-[9px] text-white/40 uppercase font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="pb-[50px] md:pb-[34px]">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      {/* Permanent brand chyron */}
      <BrandChyron />

      {/* Mobile bottom nav */}
      <div
        className="md:hidden fixed bottom-[34px] left-0 right-0 z-40 h-14"
        style={{ background: 'rgba(7,7,15,0.98)', borderTop: '1px solid rgba(212,175,55,0.12)' }}
      >
        <nav className="flex items-center justify-around h-full px-2">
          {MOBILE_NAV.map(function(item) {
            var Icon = item.icon;
            var active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className="flex flex-col items-center gap-0.5 px-2"
                style={{ color: active ? '#d4af37' : 'rgba(255,255,255,0.35)' }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] uppercase font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <footer
        className="hidden md:block py-3 px-6 text-[10px]"
        style={{ background: 'rgba(7,7,15,0.9)', borderTop: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }}
      >
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