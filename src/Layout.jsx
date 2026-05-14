import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import {
  Home, Radio, Users, DollarSign, Search as SearchIcon,
  Plus, Video, Zap, LayoutDashboard, Layers, Swords,
  Trophy, Shield, Server, Sparkles, Menu, X, Eye,
  Bell, User, ChevronRight
} from 'lucide-react';
import NotificationBell from '@/components/shared/NotificationBell';
import UserMenu from '@/components/shared/UserMenu';
import GlobalSearch from '@/components/shared/GlobalSearch';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { AnimatePresence, motion } from 'framer-motion';
import { usePresenceHeartbeat } from '@/components/shared/PresenceDot';
import BrandChyron from '@/components/live/BrandChyron';
import SignalBars from '@/components/live/SignalBars';
import GlobalChatWidget from '@/components/live/GlobalChatWidget';

var MOBILE_NAV = [
  { name: 'Home',      icon: Home,          href: createPageUrl('Home') },
  { name: 'Discover',  icon: SearchIcon,    href: createPageUrl('Discover') },
  { name: 'LIVE',      icon: Radio,         href: createPageUrl('LiveRoom'),   isCenter: true },
  { name: 'Battles',   icon: Swords,        href: createPageUrl('PKBattleManager') },
  { name: 'Dashboard', icon: LayoutDashboard, href: createPageUrl('CreatorDashboard') },
];

var PRIMARY_NAV = [
  { name: 'Home',       icon: Home,           href: createPageUrl('Home') },
  { name: 'Discover',   icon: SearchIcon,     href: createPageUrl('Discover') },
  { name: 'Communities',icon: Users,          href: createPageUrl('Communities') },
  { name: 'Battles',    icon: Swords,         href: createPageUrl('PKBattleManager') },
  { name: 'Leaderboard',icon: Trophy,         href: createPageUrl('Leaderboard') },
  { name: 'Watch Party',icon: Eye,            href: createPageUrl('WatchParty') },
];

var CREATOR_NAV = [
  { name: 'Dashboard',   icon: LayoutDashboard, href: createPageUrl('CreatorDashboard') },
  { name: 'Monetize',    icon: DollarSign,      href: createPageUrl('Monetization') },
  { name: 'Schedule',    icon: Radio,           href: createPageUrl('StreamScheduler') },
  { name: 'Stream Setup',icon: Server,          href: createPageUrl('StreamInfra') },
];

var ADMIN_NAV = [
  { name: 'Admin', icon: Shield, href: createPageUrl('AdminDashboard') },
  { name: 'Stage', icon: Layers, href: createPageUrl('StageCleanup') },
  { name: 'RTMP',  icon: Radio,  href: createPageUrl('RTMPServer') },
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

      {/* Brand accent line */}
      <div className="fixed top-0 left-0 right-0 z-[101] h-[3px]"
        style={{ background: 'linear-gradient(90deg, #d4af37, #CC7755, #6B7C4A, #d4af37)' }} />

      {/* ── HEADER ── */}
      <header className="sticky top-[3px] z-50 w-full"
        style={{ background: 'rgba(7,7,15,0.97)', borderBottom: '1px solid rgba(212,175,55,0.12)', backdropFilter: 'blur(16px)' }}>

        <div className="flex h-14 items-center justify-between px-3 md:px-6 max-w-7xl mx-auto">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2 shrink-0 active:opacity-70 transition-opacity">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6B4423, #d4af37)' }}>
              <Video className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-none"
                style={{ fontFamily: 'Orbitron, monospace', color: '#d4af37', letterSpacing: '0.05em' }}>SeeWhy</span>
              <span className="text-[9px] text-white/30 leading-none"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}>LIVE</span>
            </div>
            {liveCount > 0 && (
              <div className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(180,50,30,0.25)', border: '1px solid rgba(200,80,30,0.3)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-[9px] font-bold text-orange-300">{liveCount}</span>
              </div>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {PRIMARY_NAV.map(function(item) {
              var Icon = item.icon;
              var active = isActive(item.href);
              return (
                <Link key={item.name} to={item.href}>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.07em',
                      background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                      color: active ? '#d4af37' : 'rgba(255,255,255,0.45)' }}>
                    <Icon className="w-3.5 h-3.5" />
                    {item.name}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Mobile search */}
            <button onClick={function() { setShowSearch(true); }}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <SearchIcon className="w-4.5 h-4.5 text-white/50" style={{ width: 18, height: 18 }} />
            </button>

            {/* Go Live — mobile prominent */}
            <Link to={createPageUrl('LiveRoom')} className="md:hidden">
              <button className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-black uppercase transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6B4423, #d4af37)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
                <Radio className="w-3.5 h-3.5" />
                Live
              </button>
            </Link>

            {/* Desktop: Studio + Create */}
            <Link to={createPageUrl('LiveRoom')} className="hidden md:flex">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase transition-all"
                style={{ background: 'rgba(107,68,35,0.25)', border: '1px solid rgba(212,175,55,0.25)', color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>
                <Radio className="w-3.5 h-3.5" />
                Studio
              </button>
            </Link>
            <Link to={createPageUrl('CreateRoom')} className="hidden md:flex">
              <Button size="sm" className="h-9 text-xs font-bold uppercase gap-1.5"
                style={{ background: '#d4af37', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
                <Plus className="w-3.5 h-3.5" />Create
              </Button>
            </Link>

            {/* Guardian AI — desktop */}
            <Link to={createPageUrl('AIModeration')} className="hidden xl:flex">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase"
                style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#8B5CF6', fontFamily: 'Barlow Condensed, sans-serif' }}>
                <Sparkles className="w-3 h-3" />AI
              </div>
            </Link>

            <NotificationBell />
            <UserMenu user={user} isAdmin={isAdmin} />

            {/* Desktop creator/admin nav toggle */}
            <button className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={function() { setShowMobileMenu(function(v) { return !v; }); }}>
              {showMobileMenu ? <X className="w-4 h-4 text-white/50" /> : <Menu className="w-4 h-4 text-white/50" />}
            </button>

            {/* Mobile menu toggle */}
            <button className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={function() { setShowMobileMenu(function(v) { return !v; }); }}>
              {showMobileMenu ? <X className="w-4 h-4 text-white/50" /> : <Menu className="w-4 h-4 text-white/50" />}
            </button>
          </div>
        </div>

        {/* Live ticker bar */}
        {liveCount > 0 && (
          <div className="flex items-center justify-between px-4 py-1 text-[10px] font-bold"
            style={{ background: 'rgba(180,50,30,0.12)', borderTop: '1px solid rgba(200,80,30,0.15)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>SeeWhy LIVE</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <span style={{ color: '#CC7755' }}>{liveCount} stream{liveCount !== 1 ? 's' : ''} live now</span>
            </div>
            <Link to={createPageUrl('Discover')} style={{ color: '#d4af37' }}>
              Watch <ChevronRight className="inline w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Expanded menu — mobile & desktop */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden" style={{ background: 'rgba(7,7,15,0.99)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="p-4 space-y-3">
                {/* All sections in a scrollable grid */}
                <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Navigate</p>
                <div className="grid grid-cols-4 gap-2">
                  {[...PRIMARY_NAV, ...CREATOR_NAV].map(function(item) {
                    var Icon = item.icon;
                    var active = isActive(item.href);
                    return (
                      <Link key={item.name} to={item.href} onClick={function() { setShowMobileMenu(false); }}>
                        <div className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-center transition-all active:scale-95"
                          style={{ background: active ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)', border: active ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
                          <Icon className="w-5 h-5" style={{ color: active ? '#d4af37' : 'rgba(255,255,255,0.4)' }} />
                          <span className="text-[9px] uppercase font-bold leading-tight" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: active ? '#d4af37' : 'rgba(255,255,255,0.4)' }}>{item.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {isAdmin && (
                  <>
                    <p className="text-[9px] text-orange-400/50 uppercase font-bold tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Admin</p>
                    <div className="grid grid-cols-3 gap-2">
                      {ADMIN_NAV.map(function(item) {
                        var Icon = item.icon;
                        return (
                          <Link key={item.name} to={item.href} onClick={function() { setShowMobileMenu(false); }}>
                            <div className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-center"
                              style={{ background: 'rgba(255,140,0,0.06)', border: '1px solid rgba(255,140,0,0.15)' }}>
                              <Icon className="w-4 h-4 text-orange-400/70" />
                              <span className="text-[9px] text-orange-400/60 uppercase font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{item.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main */}
      <main className="pb-[96px] md:pb-10">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      {/* Brand chyron */}
      <BrandChyron />

      {/* Global multilingual chat widget */}
      <GlobalChatWidget />

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="md:hidden fixed bottom-[34px] left-0 right-0 z-40"
        style={{ background: 'rgba(7,7,15,0.98)', borderTop: '1px solid rgba(212,175,55,0.15)', backdropFilter: 'blur(20px)' }}>
        <nav className="flex items-end justify-around px-2 pt-2 pb-safe" style={{ height: 60 }}>
          {MOBILE_NAV.map(function(item) {
            var Icon = item.icon;
            var active = isActive(item.href);

            if (item.isCenter) {
              return (
                <Link key={item.name} to={item.href} className="flex flex-col items-center -mt-5">
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #6B4423, #d4af37)', boxShadow: '0 4px 20px rgba(212,175,55,0.4)' }}>
                    <Icon className="w-6 h-6 text-black" />
                  </motion.div>
                  <span className="text-[9px] font-black mt-1 uppercase"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#d4af37', letterSpacing: '0.1em' }}>{item.name}</span>
                </Link>
              );
            }

            return (
              <Link key={item.name} to={item.href}
                className="flex flex-col items-center gap-1 px-3 pb-1 transition-all active:scale-90"
                style={{ color: active ? '#d4af37' : 'rgba(255,255,255,0.3)' }}>
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {active && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: '#d4af37' }} />
                  )}
                </div>
                <span className="text-[9px] uppercase font-bold"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop footer */}
      <footer className="hidden md:block py-3 px-6 text-[10px]"
        style={{ background: 'rgba(7,7,15,0.9)', borderTop: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }}>
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