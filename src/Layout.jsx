import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Home, Radio, Users, DollarSign, Search as SearchIcon, Plus, Video, Zap, Film } from 'lucide-react';
import NotificationBell from '@/components/shared/NotificationBell';
import UserMenu from '@/components/shared/UserMenu';
import GlobalSearch from '@/components/shared/GlobalSearch';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { AnimatePresence } from 'framer-motion';

export default function Layout({ children, currentPageName }) {
  const [showSearch, setShowSearch] = useState(false);
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const navigation = [
    { name: 'Home', icon: Home, href: createPageUrl('Home') },
    { name: 'Discover', icon: SearchIcon, href: createPageUrl('Discover') },
    { name: 'Communities', icon: Users, href: createPageUrl('Communities') },
    { name: 'Schedule', icon: Radio, href: createPageUrl('StreamScheduler') },
    { name: 'Monetization', icon: DollarSign, href: createPageUrl('Monetization') },
    { name: 'Featured', icon: Zap, href: createPageUrl('FeaturedContent') },
  ];

  const isAdmin = user?.role === 'admin';

  // Global keyboard shortcut ⌘K / Ctrl+K for search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(s => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
      </AnimatePresence>
      <style>{`
        :root {
          --primary: 25 45% 35%;
          --primary-foreground: 40 30% 95%;
          --accent: 35 55% 45%;
          --accent-foreground: 40 30% 95%;
        }
        .bg-gradient-to-br { background-image: linear-gradient(to bottom right, #8B6F47, #A0826D); }
        .bg-gradient-to-r { background-image: linear-gradient(to right, #8B4513, #B8860B); }
        .from-purple-600 { --tw-gradient-from: #8B4513; }
        .to-pink-600 { --tw-gradient-to: #B8860B; }
        .text-purple-600 { color: #8B4513; }
        .text-purple-500 { color: #A0826D; }
        .text-purple-700 { color: #6B3410; }
        .bg-purple-50 { background-color: #F5F0EB; }
        .bg-purple-500 { background-color: #8B4513; }
        .hover\\:bg-purple-600:hover { background-color: #6B3410; }
        .border-purple-300 { border-color: #C4A57B; }
      `}</style>
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r bg-clip-text text-transparent">
              SeeWhy LIVE
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.name;
              return (
                <Link key={item.name} to={item.href}>
                  <Button 
                    variant={isActive ? "default" : "ghost"}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearch(true)}
              className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
            >
              <SearchIcon className="w-4 h-4" />
              <span className="text-xs">Search...</span>
              <kbd className="text-[10px] bg-white border rounded px-1 ml-1">⌘K</kbd>
            </button>
            <NotificationBell />
            <Link to={createPageUrl('LiveRoom')}>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs hidden md:flex text-[#800020] border border-[#800020]/30 hover:bg-[#800020]/10">
                <Radio className="w-3.5 h-3.5" />
                Studio
              </Button>
            </Link>
            <Link to={createPageUrl('CreateRoom')}>
              <Button className="gap-2 bg-gradient-to-r hover:opacity-90">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Room</span>
              </Button>
            </Link>
            <UserMenu user={user} isAdmin={isAdmin} />
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white">
        <nav className="flex items-center justify-around h-16 px-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.name;
            return (
              <Link 
                key={item.name} 
                to={item.href}
                className={`flex flex-col items-center gap-1 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Status Banner */}
      <div className="bg-green-600 text-white text-xs font-semibold py-1.5 px-4 flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        SeeWhy LIVE — <strong>Production Ready</strong> · 28 features live · Multi-user enabled
        <Link to={createPageUrl('BetaStatus')} className="underline hover:no-underline ml-1">View platform status →</Link>
      </div>

      {/* Main Content */}
      <main className="pb-16 md:pb-0">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}