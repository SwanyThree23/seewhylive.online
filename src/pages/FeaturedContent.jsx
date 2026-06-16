import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Play, ExternalLink, Youtube, Star, Users, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import SpotlightSection from '../components/community/SpotlightSection';
import YouTubeDiscovery from '../components/youtube/YouTubeDiscovery';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import EmbedPlayer from '../components/streaming/EmbedPlayer';
import ViewerCount from '../components/live/ViewerCount';
import LoveHearts from '../components/live/LoveHearts';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ShareToSocial from '../components/social/ShareToSocial';
import StreamGoals from '../components/live/StreamGoals';
import AnnouncementPanel from '../components/community/AnnouncementPanel';

const CHANNELS = [
  {
    id: 'domino',
    name: 'Domino Entertainment',
    handle: '@dominoentertainment5513',
    url: 'https://youtube.com/@dominoentertainment5513',
    description: 'Live entertainment, shows, and exclusive content',
    bg: 'rgba(128,0,32,0.25)',
    border: 'rgba(192,57,43,0.3)',
    accent: '#C0392B',
    emoji: '🎭',
  },
  {
    id: 'memoirs',
    name: 'Memoirs of a Shy Girl',
    handle: '@memoirsofashygirl',
    url: 'https://youtube.com/@memoirsofashygirl',
    description: 'Personal stories, lifestyle, and real conversations',
    bg: 'rgba(128,0,32,0.2)',
    border: 'rgba(128,0,32,0.35)',
    accent: '#D4854A',
    emoji: '📖',
  },
  {
    id: 'ampdup',
    name: 'Amp\'d Up Videos',
    handle: '@ampdupvideos',
    url: 'https://youtube.com/@ampdupvideos',
    description: 'High energy content, music videos, and entertainment',
    bg: 'rgba(212,175,55,0.1)',
    border: 'rgba(212,175,55,0.3)',
    accent: '#D4AF37',
    emoji: '⚡',
  },
  {
    id: 'aiverse',
    name: 'AIverse Podcast',
    handle: '@aiversepodcast',
    url: 'https://youtube.com/@aiversepodcast',
    description: 'AI, tech, and futurism — conversations that matter',
    bg: 'rgba(212,175,55,0.08)',
    border: 'rgba(212,175,55,0.2)',
    accent: '#D4AF37',
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
          <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform" style={{ background: '#C0392B' }}>
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
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
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
  const [activeChannel, setActiveChannel] = useState(null);

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#080B18' }}>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#C0392B' }}>
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
                className="rounded-2xl p-5 space-y-3 transition-all cursor-pointer"
              style={{ background: channel.bg, border: `1px solid ${channel.border}` }}
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
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg text-white transition-all"
                    style={{ background: 'rgba(192,57,43,0.5)' }}
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
                        <Youtube className="w-12 h-12 text-red-500" />
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
        <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: 'rgba(128,0,32,0.2)', border: '1px solid rgba(128,0,32,0.35)' }}>
          <div className="flex items-center gap-4">
            <span className="text-4xl">📖</span>
            <div>
              <h3 className="text-white font-bold text-lg">Memoirs Studio Pro</h3>
              <p className="text-white/50 text-sm">Professional streaming studio by Memoirs of a Shy Girl</p>
              <p className="text-[11px] text-[#D4854A]/60 mt-0.5">memoirs-studio-pro-d081db27.base44.app</p>
            </div>
          </div>
          <a href="https://memoirs-studio-pro-d081db27.base44.app" target="_blank" rel="noopener noreferrer">
            <button style={{ background: '#C0392B', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', flexShrink: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ExternalLink className="w-4 h-4" />
              Visit Studio Pro
            </button>
          </a>
        </div>

        <SpotlightSection communityId={userCommunityId} currentUser={user} />
        <YouTubeDiscovery />
        <ContentRecommendations userId={user?.id} />
        <CollaborationMatcher />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <ViewerCount count={0} peakViewers={0} />
          <LoveHearts roomId={activeRoomId} currentUser={user} creatorId={user?.id} />
          <EmbedPlayer roomId={activeRoomId} streamTitle="Featured Stream" viewerCount={0} />
        </div>

        <div className="text-center">
          <Link to={createPageUrl('Home')}>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14 }}>← Back to Home</button>
          </Link>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
          <OnlineUsersGrid compact maxVisible={10} />
          <ShareToSocial content={{ title: 'SeeWhy LIVE', url: window.location.href }} />
          <StreamGoals isHost={false} />
          <AnnouncementPanel communityId={userCommunityId} userId={user?.id} />
        </div>
      </div>
    </div>
  );
}