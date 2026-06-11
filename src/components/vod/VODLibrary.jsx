import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Play, Eye, ThumbsUp, Share2, Trash2 } from 'lucide-react';

const G = '#D4AF37';
const BG = '#080B18';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

export default function VODLibrary({ creatorId }) {
  const [filter, setFilter] = useState('all');

  const { data: vods } = useQuery({
    queryKey: ['creatorVODs', creatorId],
    queryFn: () =>
      base44.entities.VODVideo.filter(
        { creator_id: creatorId },
        '-updated_date',
        50
      ),
    enabled: !!creatorId,
  });

  const { data: clips } = useQuery({
    queryKey: ['creatorClips', creatorId],
    queryFn: () =>
      base44.entities.StreamClip.filter(
        { creator_id: creatorId },
        '-created_date',
        50
      ),
    enabled: !!creatorId,
  });

  const filteredItems = filter === 'vods' ? vods : filter === 'clips' ? clips : [...(vods || []), ...(clips || [])];

  const formatDuration = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'vods', 'clips'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: filter === f ? `${G}20` : 'rgba(255,255,255,0.03)',
              color: filter === f ? G : 'rgba(255,255,255,0.5)',
              border: filter === f ? `1px solid ${G}40` : `1px solid ${BORDER}`,
            }}
          >
            {f.toUpperCase()} ({filter === 'all' ? (vods?.length || 0) + (clips?.length || 0) : filter === 'vods' ? vods?.length || 0 : clips?.length || 0})
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredItems?.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-lg overflow-hidden group cursor-pointer"
            style={{ background: BG, border: `1px solid ${BORDER}` }}
          >
            {/* Thumbnail */}
            <div className="relative h-40 bg-black overflow-hidden">
              <img
                src={item.thumbnail_url || `https://via.placeholder.com/400x225?text=${encodeURIComponent(item.title)}`}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Play className="w-8 h-8" style={{ color: G }} fill={G} />
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-bold bg-black/80" style={{ color: G }}>
                {formatDuration(item.duration_seconds || item.end_timestamp_seconds - item.start_timestamp_seconds)}
              </div>
            </div>

            {/* Info */}
            <div className="p-3 space-y-2">
              <p className="text-sm font-bold text-white line-clamp-2">{item.title}</p>
              <div className="flex items-center gap-3 text-[10px] text-white/60">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {item.views || item.view_count || 0}
                </div>
                {item.like_count !== undefined && (
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {item.like_count || 0}
                  </div>
                )}
              </div>
              <div className="flex gap-1 pt-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  className="flex-1 px-2 py-1.5 rounded text-xs font-bold"
                  style={{ background: `${G}20`, color: G }}
                >
                  <Share2 className="w-3 h-3 mx-auto" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  className="flex-1 px-2 py-1.5 rounded text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)' }}
                >
                  <Trash2 className="w-3 h-3 mx-auto" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {!filteredItems || filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/40 text-sm">No {filter === 'all' ? 'content' : filter} yet</p>
        </div>
      )}
    </div>
  );
}