import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Radio, ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import SpotlightBanner from '../components/community/SpotlightBanner';
import ContentRecommendations from '../components/social/ContentRecommendations';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import ZEGOMobileAppBanner from '../components/zego/ZEGOMobileAppBanner';
import FeaturedContentSection from '../components/home/FeaturedContent';
import ShareToSocial from '../components/social/ShareToSocial';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import StreamGoals from '../components/live/StreamGoals';
import AnnouncementPanel from '../components/community/AnnouncementPanel';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';

const G = '#D4AF37';
const BG = '#080B18';

export default function WelcomePage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: liveCount } = useQuery({
    queryKey: ['welcomeLiveCount'],
    queryFn: async () => {
      const rooms = await base44.entities.Room.filter({ status: 'live' });
      return rooms?.length || 0;
    },
  });

  // Redirect logged-in users to home
  React.useEffect(() => {
    if (user?.id) {
      window.location.href = '/Home';
    }
  }, [user]);

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Brand accent line */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px]"
        style={{ background: 'linear-gradient(90deg, #d4af37, #CC7755, #6B7C4A, #d4af37)' }} />

      {/* Header */}
      <header className="sticky top-[3px] z-40 px-4 py-4 md:px-8"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.12)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6B4423, #d4af37)' }}>
              <Radio className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold" style={{ fontFamily: 'Orbitron, monospace', color: G }}>SeeWhy LIVE</span>
          </Link>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => base44.auth.redirectToLogin()}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{ background: G, color: '#000' }}
          >
            Sign In
          </motion.button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative overflow-hidden" style={{ minHeight: '100vh' }}>
        {/* Background with gradient overlay */}
        <div className="absolute inset-0" style={{
          background: `linear-gradient(180deg,
            rgba(8, 11, 24, 0.95) 0%,
            rgba(13, 6, 24, 0.85) 50%,
            rgba(8, 11, 24, 0.95) 100%)`,
          backgroundImage: `url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&h=2000&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }} />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-70px)] px-4 py-12 md:py-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 py-2 rounded-full text-xs font-bold"
            style={{ background: `${G}20`, border: `1px solid ${G}40`, color: G, fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            🔴 LIVE — Open to All
          </motion.div>

          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-6 max-w-2xl"
          >
            <h1 className="text-4xl md:text-6xl font-black mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#fff', letterSpacing: '-0.02em' }}>
              Welcome to <span style={{ color: G }}>SeeWhy LIVE</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70">
              Stream, Connect, Engage. The ultimate platform for professional creators and their communities.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4 mb-8"
          >
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="px-8 py-3 rounded-full font-black text-base md:text-lg flex items-center gap-2"
              style={{ background: G, color: '#000', border: 'none', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              <Radio className="w-5 h-5" />
              Start Broadcasting
              <ChevronRight className="w-5 h-5" />
            </button>
            <Link to="/Home" className="w-full md:w-auto">
              <button
                className="w-full px-8 py-3 rounded-full font-black text-base md:text-lg"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                Watch Streams
              </button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-8 text-center"
          >
            <div>
              <p className="text-3xl font-black" style={{ color: G }}>10K+</p>
              <p className="text-sm text-white/60">Creators</p>
            </div>
            <div>
              <p className="text-3xl font-black" style={{ color: '#C9A84C' }}>{liveCount || 3}</p>
              <p className="text-sm text-white/60">Live Now</p>
            </div>
            <div>
              <p className="text-3xl font-black" style={{ color: '#6DBF7E' }}>90%</p>
              <p className="text-sm text-white/60">Creator Cut</p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Feature Highlights */}
      <section className="relative z-20 py-12 px-4 md:px-8" style={{ background: 'rgba(8,11,24,0.98)', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-black uppercase tracking-widest mb-6" style={{ color: 'rgba(212,175,55,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>Platform Features</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { emoji: '⚔️', label: 'State vs State',    sub: 'Domino Tournaments' },
              { emoji: '🤖', label: 'AI Co-Host',         sub: 'Joyce AI + ARIA' },
              { emoji: '🎙️', label: 'Podcast Studio',    sub: 'AI Script + Record' },
              { emoji: '🕊️', label: 'Tribute Wall',      sub: 'Honor Legends' },
              { emoji: '🎵', label: 'AI Music Studio',   sub: 'Generate & Mix' },
              { emoji: '⚡', label: 'INS Forge',          sub: 'AI Graphics' },
              { emoji: '🛡️', label: 'Guardian AI',       sub: 'Live Moderation' },
              { emoji: '📡', label: 'Multi-Platform',    sub: 'Stream Everywhere' },
            ].map(f => (
              <div key={f.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{f.emoji}</div>
                <p className="text-xs font-black text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{f.label}</p>
                <p className="text-[10px]" style={{ color: 'rgba(212,175,55,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>{f.sub}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/PlatformShowcase">
              <button className="px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                See all features →
              </button>
            </Link>
          </div>
        </div>
      </section>

      <div className="relative z-20 px-4 pb-4 space-y-4">
        <FeaturedContentSection />
        <ZEGOMobileAppBanner />
        <ShareToSocial />
        <SpotlightBanner communityId={null} isAdmin={false} />
        <ContentRecommendations userId={user?.id} />
        <OnlineUsersGrid compact maxVisible={10} />
        {!user && <OnboardingFlow onComplete={() => {}} />}
      </div>

      {/* Footer */}
      <footer className="relative z-20 py-8 px-4 md:px-8 text-center text-xs text-white/40"
        style={{ background: 'rgba(8,11,24,0.9)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <p>© {new Date().getFullYear()} SeeWhy LIVE · SwanyThree EntTech LLC · 90/10 Creator Split</p>
      </footer>
      <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
        {/* new components here */}
        <ShareToSocial content={{ title: 'SeeWhy LIVE', url: window.location.href }} />
        <CollaborationMatcher />
        <StreamGoals isHost={false} />
        <AnnouncementPanel communityId={null} userId={null} />
        <ChallengeLeaderboard challengeId={null} />
      </div>
    </div>
  );
}