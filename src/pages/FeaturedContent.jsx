import React, { useState } from 'react';
import { Play, ExternalLink, Youtube, Star, Users, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
const CHANNELS = [
  {
    id: 'domino',
    name: 'Domino Entertainment',
    handle: '@dominoentertainment5513',
    url: 'https://youtube.com/@dominoentertainment5513',
    description: 'Live entertainment, shows, and exclusive content',
    color: 'from-red-900 to-orange-900',
    accent: '#D4854A',
    emoji: '🎭',
  },
  {
    id: 'memoirs',
    name: 'Memoirs of a Shy Girl',
    handle: '@memoirsofashygirl',
    url: 'https://youtube.com/@memoirsofashygirl',
    description: 'Personal stories, lifestyle, and real conversations',
    color: 'from-[#C0392B] to-rose-900',
    accent: '#ff85a1',
    emoji: '📖',
  },
  {
    id: 'ampdup',
    name: 'Amp\'d Up Videos',
    handle: '@ampdupvideos',
    url: 'https://youtube.com/@ampdupvideos',
    description: 'High energy content, music videos, and entertainment',
    color: 'from-yellow-900 to-amber-900',
    accent: '#ffd700',
    emoji: '⚡',
  },
  {
    id: 'aiverse',
    name: 'AIverse Podcast',
    handle: '@aiversepodcast',
    url: 'https://youtube.com/@aiversepodcast',
    description: 'AI, tech, and futurism — conversations that matter',
    color: 'from-blue-900 to-[#4A8A7A]',
    accent: '#4A8A7A',
    emoji: '🤖',
  },
];

const FEATURED_VIDEOS = [
  {
    id: 'domino-demo',
    title: 'Domino Entertainment — Featured Demo',
    channel: 'Domino Entertainment',
    channelId: 'domino',
    embedId: 'Otl7qiUonLs',
    description: 'Watch the featured Domino Entertainment demo reel — exclusive content right here on SeeWhy.',
    isDemo: true,
    emoji: '🎭',
  },
];

function YouTubeEmbed({ videoId, title }) {
  const [playing, setPlaying] = useState(false);

  if (!playing) {
    return (
      <div
        className="relative aspect-video bg-black rounded-xl overflow-hidden cursor-pointer group"
        onClick={() => setPlaying(true)}
      >
        <img
          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
          alt={title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          onError={e => { e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
        <div className="absolute bottom-3 left-3">
          <span style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, border: 'none' }}>▶ Click to Play</span>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-xl overflow-hidden">
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export default function FeaturedContent() {
  const [activeChannel, setActiveChannel] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0618] to-[#1a0a30] py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center">
              <Youtube className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white">Featured Content</h1>
              <p className="text-white/40 text-sm">Partner channels & exclusive videos on SeeWhy</p>
            </div>
          </div>
        </div>

        {/* Featured Demo Video */}
        {FEATURED_VIDEOS.map(video => (
          <div key={video.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span style={{ background: '#D4AF37', color: '#000', fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 99, border: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}>⭐ Featured</span>
              <span className="text-white font-bold text-lg">{video.title}</span>
            </div>
            <YouTubeEmbed videoId={video.embedId} title={video.title} />
            <p className="text-white/40 text-sm">{video.description}</p>
          </div>
        ))}

        {/* Partner Channels */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-xl font-bold text-white">Partner YouTube Channels</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CHANNELS.map(channel => (
              <div
                key={channel.id}
                className={`bg-gradient-to-br ${channel.color} border border-white/10 rounded-2xl p-5 space-y-3 hover:border-white/20 transition-all cursor-pointer`}
                onClick={() => setActiveChannel(activeChannel === channel.id ? null : channel.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{channel.emoji}</span>
                    <div>
                      <h3 className="text-white font-bold">{channel.name}</h3>
                      <p className="text-white/50 text-xs">{channel.handle}</p>
                    </div>
                  </div>
                  <a
                    href={channel.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-red-700/50 hover:bg-red-600 text-white transition-all"
                  >
                    <Youtube className="w-3 h-3" />
                    Subscribe
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <p className="text-white/60 text-sm">{channel.description}</p>

                {/* Embed area */}
                {activeChannel === channel.id && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Latest from this channel →</p>
                    <div className="aspect-video rounded-xl overflow-hidden bg-black/50 flex items-center justify-center">
                      <a
                        href={channel.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center gap-3 text-white/60 hover:text-white transition-all"
                      >
                        <Youtube className="w-12 h-12 text-[#C0392B]" />
                        <span className="text-sm">Open on YouTube →</span>
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-[11px] text-white/30">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> SeeWhy Partner</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Memoirs Studio Pro Link */}
        <div className="bg-gradient-to-r from-[#C0392B]/50 to-rose-900/50 border border-[#C0392B]/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">📖</span>
            <div>
              <h3 className="text-white font-bold text-lg">Memoirs Studio Pro</h3>
              <p className="text-white/50 text-sm">Professional streaming studio by Memoirs of a Shy Girl</p>
              <p className="text-[11px] text-[#C0392B]/60 mt-0.5">memoirs-studio-pro-d081db27.base44.app</p>
            </div>
          </div>
          <a href="https://memoirs-studio-pro-d081db27.base44.app" target="_blank" rel="noopener noreferrer">
            <button style={{ background: '#C0392B', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', flexShrink: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ExternalLink className="w-4 h-4" />
              Visit Studio Pro
            </button>
          </a>
        </div>

        <div className="text-center">
          <Link to={createPageUrl('Home')}>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14 }}>← Back to Home</button>
          </Link>
        </div>
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={null} roomId={null} currentUser={null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}