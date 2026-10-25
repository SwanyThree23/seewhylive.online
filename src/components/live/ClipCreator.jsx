import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Scissors, X, Check, Share2, Tag, Film, Clock } from 'lucide-react';
import { toast } from 'sonner';

const CLIP_TAGS = [
  { id: 'funny',    label: '😂 Funny'  },
  { id: 'hype',     label: '🔥 Hype'   },
  { id: 'fail',     label: '💀 Fail'   },
  { id: 'gaming',   label: '🎮 Gaming' },
  { id: 'reaction', label: '😮 Reaction'},
  { id: 'wtf',      label: '🤯 WTF'    },
];

export default function ClipCreator({ roomId, creatorId, streamTitle, elapsedSeconds, currentUser }) {
  const [open, setOpen]           = useState(false);
  const [startPct, setStartPct]   = useState(0.33);
  const [endPct, setEndPct]       = useState(1.0);
  const [title, setTitle]         = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [createdClipUrl, setCreatedClipUrl] = useState(null);
  const [showRecent, setShowRecent]   = useState(false);
  const draggingRef = useRef(null);
  const trackRef    = useRef(null);

  const maxWindow   = Math.max(1, Math.min(elapsedSeconds, 60));
  const trimStartSec = Math.round(startPct * maxWindow);
  const trimEndSec   = Math.round(endPct   * maxWindow);
  const duration     = Math.max(1, trimEndSec - trimStartSec);
  const absStartSec  = elapsedSeconds - maxWindow + trimStartSec;
  const absEndSec    = elapsedSeconds - maxWindow + trimEndSec;

  const { data: recentClips = [] } = useQuery({
    queryKey: ['recentClips', roomId],
    queryFn: () => base44.entities.StreamClip.filter({ room_id: roomId }, '-created_date', 5),
    enabled: !!roomId && showRecent,
  });

  const createClipMutation = useMutation({
    mutationFn: (data) => base44.entities.StreamClip.create(data),
    onSuccess: (clip) => {
      const url = clip?.share_url || clip?.url || null;
      setCreatedClipUrl(url);
      toast.success('Clip saved!');
      const userId = currentUser?.id || creatorId;
      if (userId) {
        base44.entities.Activity.create({
          user_id: userId,
          type: 'clip_created',
          title: `Clipped: ${clip?.title || title || 'Stream clip'}`,
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Failed to save clip.'),
  });

  const handleTrackMouseDown = useCallback((handle) => (e) => {
    draggingRef.current = handle;
    e.preventDefault();
    const onMove = (ev) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      if (draggingRef.current === 'start') setStartPct(Math.min(pct, endPct - 0.1));
      else                                  setEndPct(Math.max(pct, startPct + 0.1));
    };
    const onUp = () => {
      draggingRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [startPct, endPct]);

  const handleSave = () => {
    const clipTitle = title.trim() || `${streamTitle} — ${selectedTag ? CLIP_TAGS.find(t => t.id === selectedTag)?.label.split(' ')[1] : 'Clip'}`;
    createClipMutation.mutate({
      room_id:                  roomId,
      creator_id:               creatorId,
      clipped_by_id:            currentUser?.id,
      clipped_by_username:      currentUser?.full_name || currentUser?.email,
      title:                    clipTitle,
      tag:                      selectedTag,
      start_timestamp_seconds:  absStartSec,
      end_timestamp_seconds:    absEndSec,
      duration_seconds:         duration,
    });
  };

  const handleShare = () => {
    if (!createdClipUrl) return;
    navigator.clipboard.writeText(createdClipUrl)
      .then(() => toast.success('Clip link copied!'))
      .catch(() => toast.error('Copy failed'));
  };

  const handleOpen = () => {
    setTitle(`${streamTitle} Clip`);
    setCreatedClipUrl(null);
    setSelectedTag(null);
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setCreatedClipUrl(null); };

  const formatSec = (s) => { const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleOpen}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}
        >
          <Scissors className="w-3.5 h-3.5" /> Clip
        </button>
        <button
          onClick={() => setShowRecent(v => !v)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all"
          style={showRecent
            ? { background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }
            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }}
        >
          <Film className="w-3 h-3" /> Recent
        </button>
      </div>

      {/* Recent clips list */}
      <AnimatePresence>
        {showRecent && recentClips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-lg mt-1"
            style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            {recentClips.map(clip => (
              <div key={clip.id} className="flex items-center gap-2 px-3 py-2 border-b border-white/5 last:border-0">
                <Scissors className="w-3 h-3 text-[#D4AF37] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/80 font-semibold truncate">{clip.title}</p>
                  <div className="flex items-center gap-2 text-[9px] text-white/30 mt-0.5">
                    <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{clip.duration_seconds}s</span>
                    {clip.tag && <span className="px-1 rounded text-[#D4AF37]" style={{ background: 'rgba(212,175,55,0.12)' }}>{clip.tag}</span>}
                  </div>
                </div>
                {clip.share_url && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(clip.share_url).then(() => toast.success('Copied!')); }}
                    className="text-white/20 hover:text-[#7B5DA6] transition-colors"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {recentClips.length === 0 && (
              <p className="text-[10px] text-white/30 text-center py-4">No clips yet</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create clip modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 bg-[#0d0d0d] border border-[#D4AF37]/30 rounded-2xl shadow-2xl z-30 overflow-hidden"
            style={{ backdropFilter: 'blur(16px)' }}
          >
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-semibold text-white text-sm">Create Clip</span>
                </div>
                <button onClick={handleClose} className="text-white/30 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Post-save: share state */}
              {createdClipUrl ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(109,191,126,0.1)', border: '1px solid rgba(109,191,126,0.25)' }}>
                    <Check className="w-4 h-4 text-[#6DBF7E]" />
                    <span className="text-sm font-semibold text-[#6DBF7E]">Clip saved!</span>
                  </div>
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all"
                    style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37' }}
                  >
                    <Share2 className="w-4 h-4" /> Copy Share Link
                  </button>
                  <button onClick={handleClose} className="w-full text-center text-[11px] text-white/30 hover:text-white/60 transition-colors">
                    Close
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Clip title */}
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Clip title..."
                    style={{ width: '100%', padding: '6px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif', height: 32 }}
                  />

                  {/* Tag picker */}
                  <div className="space-y-1">
                    <p className="flex items-center gap-1 text-[10px] text-white/40 uppercase font-bold">
                      <Tag className="w-3 h-3" /> Tag
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {CLIP_TAGS.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTag(selectedTag === t.id ? null : t.id)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold transition-all"
                          style={selectedTag === t.id
                            ? { background: 'rgba(212,175,55,0.2)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.4)' }
                            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timeline scrubber */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-white/40">
                      <span>Last {maxWindow}s</span>
                      <span className="text-[#D4AF37] font-semibold">{duration}s clip</span>
                    </div>
                    <div
                      ref={trackRef}
                      className="relative h-10 bg-white/5 rounded-lg overflow-hidden cursor-pointer select-none"
                    >
                      {Array.from({ length: maxWindow }).map((_, i) => (
                        <div key={i} className="absolute top-0 bottom-0 w-px bg-white/5"
                          style={{ left: `${(i / maxWindow) * 100}%` }} />
                      ))}
                      <div
                        className="absolute top-0 bottom-0 bg-[#D4AF37]/20 border-x-2 border-[#D4AF37]"
                        style={{ left: `${startPct * 100}%`, width: `${(endPct - startPct) * 100}%` }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-4 bg-[#D4AF37] cursor-ew-resize flex items-center justify-center"
                        style={{ left: `${startPct * 100 - 8}px` }}
                        onMouseDown={handleTrackMouseDown('start')}
                      >
                        <div className="w-0.5 h-6 bg-white/60 rounded-full" />
                      </div>
                      <div
                        className="absolute top-0 bottom-0 w-4 bg-[#D4AF37] cursor-ew-resize flex items-center justify-center"
                        style={{ right: `${(1 - endPct) * 100}%`, transform: 'translateX(100%)' }}
                        onMouseDown={handleTrackMouseDown('end')}
                      >
                        <div className="w-0.5 h-6 bg-white/60 rounded-full" />
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[#D4AF37]">{formatSec(absStartSec)}</span>
                      <span className="text-[#D4AF37]">{formatSec(absEndSec)}</span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/40 uppercase">Start</span>
                        <span className="text-[#D4AF37] font-semibold">{formatSec(absStartSec)}</span>
                      </div>
                      <input type="range" min={0} max={Math.max(0, maxWindow - 3)} step={1} value={trimStartSec}
                        onChange={e => setStartPct(Math.min(Number(e.target.value) / maxWindow, endPct - 0.05))}
                        aria-label="Clip start time"
                        style={{ width: '100%', height: 20, accentColor: '#D4AF37', cursor: 'pointer' }}
                      />
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/40 uppercase">End</span>
                        <span className="text-[#D4AF37] font-semibold">{formatSec(absEndSec)}</span>
                      </div>
                      <input type="range" min={3} max={maxWindow} step={1} value={trimEndSec}
                        onChange={e => setEndPct(Math.max(Number(e.target.value) / maxWindow, startPct + 0.05))}
                        aria-label="Clip end time"
                        style={{ width: '100%', height: 20, accentColor: '#D4AF37', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={createClipMutation.isPending || duration < 3}
                    style={{ width: '100%', background: 'rgba(212,175,55,0.15)', color: '#D4AF37', fontWeight: 700, border: '1px solid rgba(212,175,55,0.4)', borderRadius: 8, padding: '8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, opacity: (createClipMutation.isPending || duration < 3) ? 0.5 : 1 }}
                  >
                    <Check className="w-4 h-4" /> Create {duration}s Clip
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
