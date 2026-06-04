import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, ThumbsUp, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const SMART_RECOMMENDATIONS = [
  {
    id: 'rec1',
    title: 'Washington Classic 2025 – Full Tournament Replay',
    channel: 'Rick Astley',
    reason: 'Tournament Highlights',
    duration: '1h 18m',
    views: '847',
    url: 'https://youtu.be/hjwyNnSWfnI',
    thumbnail: 'https://img.youtube.com/vi/hjwyNnSWfnI/mqdefault.jpg',
  },
  {
    id: 'rec2',
    title: 'Aiverse Podcast Ep.47 – The Future of Creator AI',
    channel: 'AI Verse Podcast',
    reason: 'Trending with Creators',
    duration: '1h 2m',
    views: '512',
    url: 'https://youtu.be/cDkr2u40oJc',
    thumbnail: 'https://img.youtube.com/vi/cDkr2u40oJc/mqdefault.jpg',
  },
  {
    id: 'rec3',
    title: 'Creator Growth Strategies 2025',
    channel: 'Memoirs of a Shy Girl',
    reason: 'Top Creator Resource',
    duration: '45m',
    views: '3.2K',
    url: 'https://youtu.be/5AZPCZ8--hc',
    thumbnail: 'https://img.youtube.com/vi/5AZPCZ8--hc/mqdefault.jpg',
  },
];

export default function ContentRecommendations() {
  const [liked, setLiked] = useState(new Set());

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const toggleLike = (id) => {
    const newLiked = new Set(liked);
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    setLiked(newLiked);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 px-4">
        <Brain className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-bold text-white">Recommended for You</h3>
      </div>

      <div className="px-4 space-y-2">
        {SMART_RECOMMENDATIONS.map((rec, i) => (
          <motion.a
            key={rec.id}
            href={rec.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02 }}
            className="flex gap-2 p-2 rounded-lg transition-all group"
            style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}
          >
            {/* Thumbnail */}
            <div className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-black">
              <img
                src={rec.thumbnail}
                alt={rec.title}
                className="w-full h-full object-cover group-hover:brightness-75 transition-all"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/56x56/1a1a1a/666';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-3 h-3 text-white fill-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{rec.title}</h4>
              <p className="text-[11px] text-white/60">{rec.channel}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-cyan-400/70">{rec.duration}</span>
                <span className="text-[11px] text-white/40">•</span>
                <span className="text-[11px] text-white/40">{rec.views} views</span>
              </div>
            </div>

            {/* Like button */}
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                toggleLike(rec.id);
              }}
              whileHover={{ scale: 1.1 }}
              className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: liked.has(rec.id) ? 'rgba(236,72,153,0.2)' : 'rgba(255,255,255,0.05)',
                border: liked.has(rec.id) ? '1px solid rgba(236,72,153,0.4)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <ThumbsUp
                className="w-3 h-3"
                style={{ color: liked.has(rec.id) ? '#EC4899' : 'rgba(255,255,255,0.4)', fill: liked.has(rec.id) ? '#EC4899' : 'none' }}
              />
            </motion.button>
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}