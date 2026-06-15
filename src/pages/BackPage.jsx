import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Radio, Globe, MessageSquare, Menu, Search } from 'lucide-react';
import SpotlightBanner from '../components/community/SpotlightBanner';
import ZEGOMobileAppBanner from '../components/zego/ZEGOMobileAppBanner';
import ContentRecommendations from '../components/social/ContentRecommendations';
import ZEGOStreamHealthCard from '../components/zego/ZEGOStreamHealthCard';
import ActivitySidebar from '../components/shared/ActivitySidebar';
import StreamingPresets from '../components/streaming/StreamingPresets';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ShareToSocial from '../components/social/ShareToSocial';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import AnnouncementPanel from '../components/community/AnnouncementPanel';
import { motion } from 'framer-motion';

export default function BackPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user?.id) {
      window.location.href = '/Home';
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0B0B18] relative overflow-hidden pb-20">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.05) 100%)',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[rgba(8,11,24,0.98)] border-b border-white/5 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #A0522D, #d4af37)' }}>
              <Radio className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: '#d4af37' }}>
              SeeWhy LIVE
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Globe className="w-4 h-4 text-white/50" />
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <MessageSquare className="w-4 h-4 text-white/50" />
            </button>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <Menu className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 md:px-6 py-12 md:py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {/* Beta Badge */}
          <div className="inline-block px-4 py-2 rounded-full mb-8 border border-[#d4af37]/50" style={{ background: 'rgba(212,175,55,0.05)' }}>
            <span className="text-xs font-bold text-[#d4af37] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
              BETA – Invite Only
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-black mb-6" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Welcome to{' '}
            <span style={{ color: '#d4af37' }}>SeeWhy LIVE</span>
          </h1>

          {/* Tagline */}
          <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto mb-12">
            Stream, Connect, Engage. The ultimate platform for professional creators and their communities.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-3 max-w-sm mx-auto mb-12">
            <Link to="/LiveRoom">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-3.5 rounded-lg font-bold uppercase text-sm"
                style={{ background: '#d4af37', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}
              >
                Start Broadcasting
              </motion.button>
            </Link>
            <Link to="/Discover">
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="w-full px-6 py-3.5 rounded-lg font-bold uppercase text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}
              >
                Explore Creators
              </motion.button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative max-w-sm mx-auto mb-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search streams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white placeholder-white/30 bg-white/5 border border-white/10 focus:outline-none focus:border-[#d4af37]/50"
            />
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto space-y-6 mt-12"
        >
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-bold mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Professional Streaming Made Simple
            </h3>
            <p className="text-white/60 text-sm">
              Multi-streaming to Twitch, YouTube, and custom RTMP endpoints with one-click distribution.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-bold mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Creator-First Revenue Sharing
            </h3>
            <p className="text-white/60 text-sm">
              Keep 90% of all earnings from subscriptions, tips, and exclusive content.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-bold mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Real-Time Analytics
            </h3>
            <p className="text-white/60 text-sm">
              Stream health monitoring, audience insights, and performance metrics at your fingertips.
            </p>
          </div>
        </motion.div>
      </section>

      <div style={{ padding: '0 16px 80px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ZEGOStreamHealthCard roomId={null} />
        <StreamingPresets onApply={() => {}} />
        <ActivitySidebar isOpen={false} onClose={() => {}} />
        <ContentRecommendations />
        <SpotlightBanner communityId={null} isAdmin={false} />
        <ZEGOMobileAppBanner />
        <OnlineUsersGrid compact maxVisible={12} />
        <ShareToSocial content={{ title: 'SeeWhy LIVE', url: window.location.href }} />
        <CollaborationMatcher />
        <AnnouncementPanel communityId={null} userId={null} />
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[rgba(8,11,24,0.98)] border-t border-white/5 px-4 py-3">
        <div className="flex items-center justify-around text-white/40 text-[11px]">
          <span>© 2026 SeeWhy LIVE</span>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Status</span>
        </div>
      </nav>
    </div>
  );
}