import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Radio, Play, Bell, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import SpotlightBanner from '../components/community/SpotlightBanner';
import ZEGOMobileAppBanner from '../components/zego/ZEGOMobileAppBanner';
import NebulaBg from '../components/home/NebulaBg';
import GridLines from '../components/home/GridLines';
import StarField from '../components/home/StarField';
import FeaturedContentSection from '../components/home/FeaturedContent';
import ContentRecommendations from '../components/social/ContentRecommendations';
import ShareToSocial from '../components/social/ShareToSocial';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import StreamGoals from '../components/live/StreamGoals';

export default function CoverPage() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  const { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;
  const { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', user?.id],
    queryFn: () => base44.entities.Community.filter({ owner_id: user?.id }).then(r => r[0] || null),
    enabled: !!user?.id,
  });
  const userCommunityId = userCommunity?.id || null;

  const { data: liveRooms } = useQuery({
    queryKey: ['cover-live-rooms'],
    queryFn: () => base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 3),
  });

  const liveCount = liveRooms?.length || 0;

  // Redirect if already logged in
  useEffect(() => {
    if (user?.id) {
      navigate('/Home');
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0B0B18] relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(192,57,43,0.05) 100%)',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[rgba(8,11,24,0.97)] border-b border-[rgba(212,175,55,0.12)] backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6B4423, #d4af37)' }}>
              <Radio className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-base" style={{ fontFamily: 'Orbitron, monospace', color: '#d4af37', letterSpacing: '0.05em' }}>
              SeeWhy LIVE
            </span>
          </Link>
          <button className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Bell className="w-5 h-5 text-white/50" />
          </button>
        </div>
      </header>

      {/* Live Streams Carousel */}
      <div className="px-4 md:px-6 py-6 border-b border-white/5">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {/* You - Start Stream */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 w-20 h-24 rounded-xl flex flex-col items-center justify-center relative cursor-pointer"
            style={{ background: 'rgba(70,70,90,0.6)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            <div className="w-12 h-12 rounded-full bg-[#d4af37]/20 flex items-center justify-center mb-1">
              <Plus className="w-6 h-6 text-[#d4af37]" />
            </div>
            <span className="text-[11px] text-white/60 text-center">You</span>
          </motion.div>

          {/* Live Rooms */}
          {liveRooms?.slice(0, 2).map(room => (
            <motion.div
              key={room.id}
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden relative cursor-pointer"
              style={{ border: '2px solid #C0392B' }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80" />
              <div className="absolute bottom-1 left-1 right-1">
                <div className="flex items-center gap-0.5 bg-[#C0392B] rounded-full px-1.5 py-0.5 w-fit">
                  <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                  <span className="text-[7px] font-bold text-white">LIVE</span>
                </div>
                <p className="text-[11px] text-white mt-1 truncate">{room.host_name}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative px-4 md:px-6 py-12 md:py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="inline-block px-3 py-1.5 rounded-full mb-6" style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)' }}>
            <span className="text-[10px] font-bold text-[#C0392B] flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C0392B] animate-pulse" />
              Live Streaming Platform
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Welcome to{' '}
            <span style={{ color: '#d4af37' }}>SeeWhy LIVE</span>
          </h1>

          <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto mb-8">
            Stream, Connect, Engage. The ultimate platform for professional creators and their communities.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/LiveRoom">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold uppercase text-sm"
                style={{ background: '#d4af37', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}
              >
                <Radio className="inline w-4 h-4 mr-2" />
                Start Broadcasting
              </motion.button>
            </Link>
            <Link to="/Discover">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold uppercase text-sm border-2 border-white/30 text-white"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}
              >
                <Play className="inline w-4 h-4 mr-2" />
                Watch Streams
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-12"
        >
          <div>
            <p className="text-2xl font-black text-[#d4af37]">10K+</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Creators</p>
          </div>
          <div>
            <p className="text-2xl font-black text-[#d4af37]">{liveCount}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Live Now</p>
          </div>
          <div>
            <p className="text-2xl font-black text-[#d4af37]">90%</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Creator Cut</p>
          </div>
        </motion.div>
      </section>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[rgba(8,11,24,0.98)] border-t border-white/5 px-4 py-3">
        <div className="flex items-center justify-around max-w-md mx-auto text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span>SeeWhy</span>
          <span className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-[#C0392B]" />
            3 LIVE
          </span>
          <span>Multi-streaming</span>
          <span>90% Payout</span>
        </div>
      </nav>

      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <NebulaBg />
        <GridLines />
        <StarField count={40} />
        <FeaturedContentSection />
        <OnlineUsersGrid compact maxVisible={8} />
        <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
        <ZEGOMobileAppBanner />
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
        <ContentRecommendations />
        <ShareToSocial content={{ title: 'SeeWhy LIVE', url: window.location.href }} />
        <CollaborationMatcher />
        <StreamGoals isHost={false} />
      </div>
    </div>
  );
}
