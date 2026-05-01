import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Search, Play, Clock, Eye, Tag, Filter, ArrowLeft, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const CATEGORIES = ['all', 'gaming', 'music', 'education', 'talk', 'fitness', 'cooking', 'art', 'tech', 'irl'];

function formatDuration(s) {
  if (!s) return '';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function VODCard({ vod, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => onClick(vod)}
      className="group cursor-pointer bg-[rgba(13,6,24,0.8)] border border-[rgba(212,175,55,0.15)] rounded-xl overflow-hidden hover:border-[#d4af37]/40 transition-all"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-[#1a0a30] to-[#0d0618] overflow-hidden">
        {vod.thumbnail_url ? (
          <img src={vod.thumbnail_url} alt={vod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-12 h-12 text-[#d4af37]/20" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div className="w-14 h-14 rounded-full bg-[#d4af37]/90 flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-black ml-1" fill="currentColor" />
          </div>
        </div>
        {/* Duration badge */}
        {vod.duration_seconds > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
            {formatDuration(vod.duration_seconds)}
          </div>
        )}
        {vod.status === 'published' && (
          <div className="absolute top-2 left-2">
            <Badge className="text-[9px] bg-green-700/80 text-green-200 border-0">Published</Badge>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1.5">{vod.title}</h3>
        {vod.description && (
          <p className="text-[11px] text-white/40 line-clamp-2 mb-2">{vod.description}</p>
        )}
        <div className="flex items-center gap-3 text-[10px] text-white/30">
          {vod.views > 0 && (
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{vod.views.toLocaleString()}</span>
          )}
          {vod.category && (
            <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{vod.category}</span>
          )}
        </div>
        {vod.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {vod.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[9px] bg-[#d4af37]/10 text-[#d4af37]/70 px-1.5 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function VideoPlayer({ vod, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
    >
      {/* Player top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#d4af37]/10">
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white truncate">{vod.title}</h2>
          {vod.category && <p className="text-[11px] text-white/40 capitalize">{vod.category}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white/40 hover:text-white text-xs">✕ Close</Button>
      </div>
      {/* Video */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 bg-black flex items-center justify-center">
          {vod.video_url ? (
            <video
              src={vod.video_url}
              controls
              autoPlay
              className="max-w-full max-h-full w-full"
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            />
          ) : (
            <div className="text-center text-white/30">
              <Video className="w-16 h-16 mx-auto mb-3 opacity-20" />
              <p>No video source available</p>
            </div>
          )}
        </div>
        {/* Side info */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-[#d4af37]/10 bg-[rgba(13,6,24,0.9)] p-4 overflow-y-auto">
          <h3 className="font-bold text-white mb-2">{vod.title}</h3>
          {vod.description && <p className="text-sm text-white/50 mb-3">{vod.description}</p>}
          <div className="space-y-2 text-xs text-white/40">
            {vod.views > 0 && <div className="flex items-center gap-2"><Eye className="w-3.5 h-3.5" />{vod.views.toLocaleString()} views</div>}
            {vod.duration_seconds > 0 && <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" />{formatDuration(vod.duration_seconds)}</div>}
            {vod.category && <div className="flex items-center gap-2"><Tag className="w-3.5 h-3.5" />{vod.category}</div>}
          </div>
          {vod.chapters?.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-semibold text-[#d4af37] mb-2 uppercase tracking-wider">Chapters</p>
              <div className="space-y-1">
                {vod.chapters.map((ch, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-white/50 hover:text-white cursor-pointer py-1">
                    <span className="text-[#d4af37]/60 font-mono">{formatDuration(ch.time)}</span>
                    <span>{ch.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {vod.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {vod.tags.map(t => (
                <span key={t} className="text-[10px] bg-[#d4af37]/10 text-[#d4af37]/70 px-2 py-1 rounded-full">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function VODLibrary() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [playing, setPlaying] = useState(null);

  const { data: vods = [], isLoading } = useQuery({
    queryKey: ['vod-library-public'],
    queryFn: () => base44.entities.VODVideo.filter({ status: 'published' }, '-created_date', 100),
  });

  const filtered = vods.filter(v => {
    const matchSearch = !search ||
      v.title?.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase()) ||
      v.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = category === 'all' || v.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0618] to-[#1a0a30] text-white">
      {/* Header */}
      <div className="border-b border-[#d4af37]/15 bg-[rgba(13,6,24,0.8)] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="sm" className="text-white/50 hover:text-white gap-1.5 hidden sm:flex">
              <ArrowLeft className="w-4 h-4" /> Home
            </Button>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <BookOpen className="w-5 h-5 text-[#d4af37] shrink-0" />
            <h1 className="text-lg font-bold">VOD Library</h1>
            <span className="text-white/30 text-sm hidden sm:inline">— On-demand video archive</span>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Search videos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm h-9"
            />
          </div>
        </div>
        {/* Categories */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 text-xs px-3 py-1 rounded-full border capitalize transition-all ${
                category === cat
                  ? 'bg-[#d4af37] text-black border-[#d4af37] font-semibold'
                  : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-video bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Video className="w-16 h-16 mx-auto mb-4 text-[#d4af37]/20" />
            <h3 className="text-xl font-semibold text-white/50 mb-2">
              {search || category !== 'all' ? 'No videos match your search' : 'No videos published yet'}
            </h3>
            <p className="text-white/30 text-sm">
              {search || category !== 'all'
                ? 'Try a different search or category'
                : 'Creators can publish VODs from their dashboard'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-white/40">
                {filtered.length} video{filtered.length !== 1 ? 's' : ''}
                {search && ` for "${search}"`}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map((vod, i) => (
                <motion.div
                  key={vod.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <VODCard vod={vod} onClick={setPlaying} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Video player overlay */}
      <AnimatePresence>
        {playing && <VideoPlayer vod={playing} onClose={() => setPlaying(null)} />}
      </AnimatePresence>
    </div>
  );
}