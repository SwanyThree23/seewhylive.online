import React from 'react';
import { motion } from 'framer-motion';
import { Play, Scissors, BookOpen, Eye, Globe, Edit } from 'lucide-react';

export default function VODCard({ vod, onEdit, onTrim, onChapters, onPublish }) {
  const fmt = (s) => {
    const m = Math.floor((s || 0) / 60);
    const sec = Math.floor((s || 0) % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const trimmedDuration = (vod.trim_end || vod.duration_seconds || 0) - (vod.trim_start || 0);

  const statusStyle = {
    published: { color: '#6DBF7E', borderColor: '#166534', background: 'rgba(20,83,45,0.2)' },
    draft: { color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' },
    unlisted: { color: '#D4AF37', borderColor: '#800020', background: 'rgba(113,63,18,0.2)' },
  }[vod.status] || { color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 12, overflow: 'hidden', color: '#fff' }}>
        {/* Thumbnail */}
        <div className="relative h-36 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0F1428, #080B18)' }}>
          {vod.thumbnail_url
            ? <img src={vod.thumbnail_url} alt={vod.title} className="w-full h-full object-cover" />
            : <Play className="w-10 h-10 text-white/10" />
          }
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-8 h-8 text-white" />
          </div>
          {/* Status badge */}
          <span style={{
            position: 'absolute', bottom: 8, right: 8, fontSize: 10, padding: '2px 8px',
            borderRadius: 99, fontWeight: 900, border: '1px solid',
            color: statusStyle.color, borderColor: statusStyle.borderColor, background: statusStyle.background,
          }}>
            {vod.status}
          </span>
          {vod.is_clipped && (
            <span style={{
              position: 'absolute', top: 8, left: 8, fontSize: 10, padding: '2px 8px',
              borderRadius: 99, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(212,175,55,0.2)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)',
            }}>
              <Scissors style={{ width: 10, height: 10 }} /> Clipped
            </span>
          )}
          <span className="absolute bottom-2 left-2 text-[10px] text-white/80 px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(0,0,0,0.7)' }}>
            {fmt(trimmedDuration)}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="text-sm font-semibold text-white line-clamp-1">{vod.title}</p>
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <Eye className="w-3 h-3" /> {vod.views || 0} views
            {vod.chapters?.length > 0 && (
              <><BookOpen className="w-3 h-3 ml-1" />{vod.chapters.length} chapters</>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
            <button
              onClick={() => onTrim(vod)}
              style={{
                height: 28, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 10, borderRadius: 6, cursor: 'pointer',
                background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none',
              }}
            >
              <Scissors className="w-3 h-3" /> Trim
            </button>
            <button
              onClick={() => onChapters(vod)}
              style={{
                height: 28, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 10, borderRadius: 6, cursor: 'pointer',
                background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none',
              }}
            >
              <BookOpen className="w-3 h-3" /> Chapters
            </button>
            {vod.status !== 'published' && (
              <button
                onClick={() => onPublish(vod)}
                style={{
                  marginLeft: 'auto', height: 28, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 700, borderRadius: 6, cursor: 'pointer',
                  background: '#d4af37', color: '#000', border: 'none',
                }}
              >
                <Globe className="w-3 h-3" /> Publish
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
