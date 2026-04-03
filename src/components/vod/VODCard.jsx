import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Scissors, BookOpen, Eye, Globe, Edit } from 'lucide-react';

export default function VODCard({ vod, onEdit, onTrim, onChapters, onPublish }) {
  const fmt = (s) => {
    const m = Math.floor((s || 0) / 60);
    const sec = Math.floor((s || 0) % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const trimmedDuration = (vod.trim_end || vod.duration_seconds || 0) - (vod.trim_start || 0);

  const statusColor = {
    published: 'text-green-400 border-green-800 bg-green-900/20',
    draft: 'text-white/40 border-white/10 bg-white/5',
    unlisted: 'text-yellow-400 border-yellow-800 bg-yellow-900/20',
  }[vod.status] || '';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
      <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)] text-white overflow-hidden group">
        {/* Thumbnail */}
        <div className="relative h-36 bg-gradient-to-br from-[#1a0a20] to-[#0d0618] flex items-center justify-center">
          {vod.thumbnail_url
            ? <img src={vod.thumbnail_url} alt={vod.title} className="w-full h-full object-cover" />
            : <Play className="w-10 h-10 text-white/10" />
          }
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-8 h-8 text-white" />
          </div>
          <Badge className={`absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 border ${statusColor}`}>
            {vod.status}
          </Badge>
          {vod.is_clipped && (
            <Badge className="absolute top-2 left-2 bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30 text-[10px]">
              <Scissors className="w-2.5 h-2.5 mr-1" /> Clipped
            </Badge>
          )}
          <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white/80 px-1.5 py-0.5 rounded font-mono">
            {fmt(trimmedDuration)}
          </span>
        </div>

        <CardContent className="p-3 space-y-2">
          <p className="text-sm font-semibold text-white line-clamp-1">{vod.title}</p>
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <Eye className="w-3 h-3" /> {vod.views || 0} views
            {vod.chapters?.length > 0 && (
              <><BookOpen className="w-3 h-3 ml-1" />{vod.chapters.length} chapters</>
            )}
          </div>
          <div className="flex gap-1.5 pt-1">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-white/50 hover:text-white" onClick={() => onTrim(vod)}>
              <Scissors className="w-3 h-3 mr-1" /> Trim
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-white/50 hover:text-white" onClick={() => onChapters(vod)}>
              <BookOpen className="w-3 h-3 mr-1" /> Chapters
            </Button>
            {vod.status !== 'published' && (
              <Button size="sm" className="h-7 px-2 text-[10px] bg-[#d4af37] text-black font-bold ml-auto" onClick={() => onPublish(vod)}>
                <Globe className="w-3 h-3 mr-1" /> Publish
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}