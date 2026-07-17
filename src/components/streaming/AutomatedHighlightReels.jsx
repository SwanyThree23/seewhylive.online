import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Play, Download, Share2, Trash2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

const HighlightCard = ({ highlight, onDelete, onShare }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -4 }}
    className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-[#d4af37]/30 transition-all"
  >
    <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center group overflow-hidden">
      {highlight.thumbnail ? (
        <img src={highlight.thumbnail} alt={highlight.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
      ) : (
        <Sparkles className="w-8 h-8 text-[#d4af37]/40" />
      )}
      <motion.div
        whileHover={{ scale: 1.1 }}
        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Play className="w-10 h-10 text-white fill-white" />
      </motion.div>
      <div className="absolute top-2 right-2 bg-black/80 text-[#d4af37] px-2 py-1 rounded text-[11px] font-bold capitalize">
        {highlight.status === 'generating' ? (
          <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Processing</span>
        ) : 'Highlight'}
      </div>
    </div>

    <div className="p-3 space-y-2">
      <div>
        <h3 className="text-[10px] font-bold text-white truncate">{highlight.title}</h3>
        <p className="text-[11px] text-white/50">{highlight.duration_seconds ?? '—'}s • {highlight.view_count ?? 0} views</p>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {highlight.tags?.map((tag, i) => (
          <span key={i} className="text-[7px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded">
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex gap-1.5 pt-2 border-t border-white/10">
        <button
          onClick={() => onShare?.(highlight)}
          className="flex-1 flex items-center justify-center gap-1 text-[11px] bg-white/10 hover:bg-white/20 rounded py-1.5 text-white/70 transition-colors"
        >
          <Share2 className="w-3 h-3" />
          Share
        </button>
        <button
          onClick={() => onDelete?.(highlight.id)}
          className="flex-1 flex items-center justify-center gap-1 text-[11px] bg-[#C0392B]/10 hover:bg-[#C0392B]/20 rounded py-1.5 text-[#C0392B] transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      </div>
    </div>
  </motion.div>
);

export default function AutomatedHighlightReels({ streamSession }) {
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load highlights from DB (filtered by clip_type or just all clips for this session)
  const { data: highlights = [], isLoading } = useQuery({
    queryKey: ['stream-highlights', streamSession?.id],
    queryFn: () => base44.entities.StreamClip.filter({ stream_session_id: streamSession.id }),
    enabled: !!streamSession?.id,
    refetchInterval: 15_000,
  });

  const handleGenerateHighlights = async () => {
    if (!streamSession?.id) { toast.error('No active stream session'); return; }
    setGenerating(true);
    try {
      await base44.entities.StreamClip.create({
        stream_session_id: streamSession.id,
        room_id: streamSession.room_id || null,
        creator_id: streamSession.creator_id || null,
        title: `Highlight — ${new Date().toLocaleTimeString()}`,
        clip_type: 'highlight',
        trigger_type: 'auto',
        duration_seconds: null,
        thumbnail: null,
        clip_url: null,
        status: 'generating',
        view_count: 0,
        like_count: 0,
        tags: ['auto', 'peak', 'engagement'],
        quality: '1080p',
        confidence_score: 95,
      });
      qc.invalidateQueries({ queryKey: ['stream-highlights', streamSession.id] });
      toast.success('Highlight queued — processing now');
    } catch {
      toast.error('Failed to create highlight');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.StreamClip.delete(id);
      qc.invalidateQueries({ queryKey: ['stream-highlights', streamSession?.id] });
      toast.success('Highlight deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleShare = (highlight) => {
    const url = highlight.clip_url || `${window.location.origin}/clips/${highlight.id}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Share link copied!')).catch(() => toast.error('Copy failed.'));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#0F1428]/50 border border-[#d4af37]/15 rounded-lg p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#d4af37]" />
          <h3 className="text-sm font-bold text-white">Automated Highlights</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-[10px] text-white/50 hover:text-white/80 transition-colors"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2"
          >
            <p className="text-[11px] text-white/60 font-semibold uppercase">Auto-Generate When</p>
            <label className="flex items-center gap-2 text-[11px] text-white/80">
              <input type="checkbox" defaultChecked className="w-3 h-3" />
              Peak chat activity (2K+ messages/min)
            </label>
            <label className="flex items-center gap-2 text-[11px] text-white/80">
              <input type="checkbox" defaultChecked className="w-3 h-3" />
              Viewer spike (50%+ increase)
            </label>
            <label className="flex items-center gap-2 text-[11px] text-white/80">
              <input type="checkbox" defaultChecked className="w-3 h-3" />
              Milestone achievements
            </label>
            <label className="flex items-center gap-2 text-[11px] text-white/80">
              <input type="checkbox" className="w-3 h-3" />
              High tip moments
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Button */}
      <button
        onClick={handleGenerateHighlights}
        disabled={generating}
        style={{ width:'100%', background:'#D4AF37', color:'#000', border:'none', borderRadius:8, fontWeight:700, height:36, cursor:generating?'not-allowed':'pointer', opacity:generating?0.6:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'Barlow Condensed, sans-serif', fontSize:13 }}
      >
        {generating ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3" />
            Generate New Highlights
          </>
        )}
      </button>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/5 rounded px-2 py-1.5">
          <p className="text-[11px] text-white/60">TOTAL</p>
          <p className="text-base font-bold text-white">{highlights.length}</p>
        </div>
        <div className="bg-white/5 rounded px-2 py-1.5">
          <p className="text-[11px] text-white/60">TOTAL VIEWS</p>
          <p className="text-base font-bold text-[#d4af37]">{highlights.reduce((sum, h) => sum + (h.view_count || 0), 0).toLocaleString()}</p>
        </div>
        <div className="bg-white/5 rounded px-2 py-1.5">
          <p className="text-[11px] text-white/60">AVG CONF.</p>
          <p className="text-base font-bold text-white">
            {highlights.length ? Math.round(highlights.reduce((s, h) => s + (h.confidence_score || 0), 0) / highlights.length) + '%' : '—'}
          </p>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto scrollbar-hide">
        <AnimatePresence>
          {highlights.map(highlight => (
            <HighlightCard
              key={highlight.id}
              highlight={highlight}
              onDelete={handleDelete}
              onShare={handleShare}
            />
          ))}
        </AnimatePresence>
      </div>

      {highlights.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Sparkles className="w-8 h-8 text-white/30 mx-auto mb-2" />
          <p className="text-[11px] text-white/50">
            {streamSession?.id ? 'No highlights yet — generate some to get started!' : 'Start a stream to generate highlights'}
          </p>
        </div>
      )}
      {isLoading && (
        <div className="text-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-[#d4af37]/40 mx-auto" />
        </div>
      )}
    </motion.div>
  );
}
