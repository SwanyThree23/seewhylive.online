import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Play, Users } from 'lucide-react';

const YOUTUBE_CONTENT = [
  {
    id: 'hjwyNnSWfnI',
    type: 'video',
    title: 'Featured Podcast Episode',
    channel: 'AI Verse Podcast',
    channelUrl: 'https://youtube.com/@aiversepodcast',
    url: 'https://youtu.be/hjwyNnSWfnI',
    thumbnail: 'https://img.youtube.com/vi/hjwyNnSWfnI/maxresdefault.jpg',
  },
  {
    id: 'cDkr2u40oJc',
    type: 'video',
    title: 'Memoirs Insights',
    channel: 'Memoirs of a Shy Girl',
    channelUrl: 'https://youtube.com/@memoirsofashygirl',
    url: 'https://youtu.be/cDkr2u40oJc',
    thumbnail: 'https://img.youtube.com/vi/cDkr2u40oJc/maxresdefault.jpg',
  },
  {
    id: '2bKl0tdZJss',
    type: 'video',
    title: 'Entertainment Highlights',
    channel: 'Domino Entertainment',
    channelUrl: 'https://youtube.com/@dominoentertainment5513',
    url: 'https://youtu.be/2bKl0tdZJss',
    thumbnail: 'https://img.youtube.com/vi/2bKl0tdZJss/maxresdefault.jpg',
  },
  {
    id: 'BOW9cNMJcMw',
    type: 'video',
    title: 'Creative Collab',
    channel: 'AI Verse Podcast',
    channelUrl: 'https://youtube.com/@aiversepodcast',
    url: 'https://youtu.be/BOW9cNMJcMw',
    thumbnail: 'https://img.youtube.com/vi/BOW9cNMJcMw/maxresdefault.jpg',
  },
  {
    id: '5AZPCZ8--hc',
    type: 'video',
    title: 'Deep Dive Discussion',
    channel: 'Memoirs of a Shy Girl',
    channelUrl: 'https://youtube.com/@memoirsofashygirl',
    url: 'https://youtu.be/5AZPCZ8--hc',
    thumbnail: 'https://img.youtube.com/vi/5AZPCZ8--hc/maxresdefault.jpg',
  },
  {
    id: '-skeh_1_YWM',
    type: 'video',
    title: 'Entertainment Special',
    channel: 'Domino Entertainment',
    channelUrl: 'https://youtube.com/@dominoentertainment5513',
    url: 'https://youtu.be/-skeh_1_YWM',
    thumbnail: 'https://img.youtube.com/vi/-skeh_1_YWM/maxresdefault.jpg',
  },
  {
    id: '8RSE0O-hASE',
    type: 'video',
    title: 'Trending Content',
    channel: 'AI Verse Podcast',
    channelUrl: 'https://youtube.com/@aiversepodcast',
    url: 'https://youtu.be/8RSE0O-hASE',
    thumbnail: 'https://img.youtube.com/vi/8RSE0O-hASE/maxresdefault.jpg',
  },
  {
    id: 'Q6T4_fmcK6k',
    type: 'video',
    title: 'Creator Spotlight',
    channel: 'Memoirs of a Shy Girl',
    channelUrl: 'https://youtube.com/@memoirsofashygirl',
    url: 'https://youtu.be/Q6T4_fmcK6k',
    thumbnail: 'https://img.youtube.com/vi/Q6T4_fmcK6k/maxresdefault.jpg',
  },
  {
    id: '8hi2DonNIq8',
    type: 'video',
    title: 'Entertainment Extravaganza',
    channel: 'Domino Entertainment',
    channelUrl: 'https://youtube.com/@dominoentertainment5513',
    url: 'https://youtu.be/8hi2DonNIq8',
    thumbnail: 'https://img.youtube.com/vi/8hi2DonNIq8/maxresdefault.jpg',
  },
];

const YOUTUBE_CHANNELS = [
  {
    id: 'aiversepodcast',
    name: 'AI Verse Podcast',
    url: 'https://youtube.com/@aiversepodcast',
    description: 'Exploring AI, technology, and the future',
    icon: 'https://www.youtube.com/yt/brand/media/image/YouTube-icon-full_color.svg',
  },
  {
    id: 'memoirsofashygirl',
    name: 'Memoirs of a Shy Girl',
    url: 'https://youtube.com/@memoirsofashygirl',
    description: 'Personal stories and authentic conversations',
    icon: 'https://www.youtube.com/yt/brand/media/image/YouTube-icon-full_color.svg',
  },
  {
    id: 'dominoentertainment5513',
    name: 'Domino Entertainment',
    url: 'https://youtube.com/@dominoentertainment5513',
    description: 'Entertainment, comedy, and creative content',
    icon: 'https://www.youtube.com/yt/brand/media/image/YouTube-icon-full_color.svg',
  },
];

export default function YouTubeDiscovery() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
          Featured on YouTube
        </h2>
        <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: 'rgba(255,0,0,0.15)', color: '#FF0000' }}>
          YouTube
        </span>
      </div>

      {/* Featured Channels Row */}
      <div className="px-4">
        <p className="text-xs text-white/50 mb-3 uppercase tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          Trending Channels
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {YOUTUBE_CHANNELS.map(channel => (
            <a
              key={channel.id}
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-2 p-3 rounded-lg w-24 text-center transition-all"
                style={{ background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)' }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,0,0,0.2)' }}>
                  <Users className="w-5 h-5" style={{ color: '#FF0000' }} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-white truncate">{channel.name}</p>
                  <p className="text-[8px] text-white/40">Channel</p>
                </div>
              </motion.div>
            </a>
          ))}
        </div>
      </div>

      {/* Videos Grid */}
      <div className="px-4">
        <p className="text-xs text-white/50 mb-3 uppercase tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          Latest Videos
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {YOUTUBE_CONTENT.map((video, i) => (
            <a
              key={video.id}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="rounded-lg overflow-hidden transition-all cursor-pointer group"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,0,0,0.15)' }}
              >
                {/* Thumbnail */}
                <div className="relative w-full aspect-video overflow-hidden bg-black">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-300"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/320x180/1a1a1a/666?text=YouTube+Video';
                    }}
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#FF0000' }}>
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-2.5">
                  <h3 className="text-xs font-bold text-white truncate mb-1">
                    {video.title}
                  </h3>
                  <p className="text-[10px] text-white/60 truncate mb-2">
                    {video.channel}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] px-2 py-1 rounded-full" style={{ background: 'rgba(255,0,0,0.15)', color: '#FF0000' }}>
                      YouTube
                    </span>
                    <ExternalLink className="w-3 h-3 text-white/40 group-hover:text-white/70 transition-colors" />
                  </div>
                </div>
              </motion.div>
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}