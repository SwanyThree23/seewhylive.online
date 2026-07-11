import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Scissors, X, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ClipCreator({ roomId, creatorId, streamTitle, elapsedSeconds, currentUser }) {
  const [open, setOpen] = useState(false);
  const [startPct, setStartPct] = useState(0.33);
  const [endPct, setEndPct] = useState(1.0);
  const [title, setTitle] = useState('');
  const draggingRef = useRef(null);
  const trackRef = useRef(null);

  const maxWindow = Math.min(elapsedSeconds, 60);
  const startSec = Math.round((1 - endPct + startPct) * maxWindow);
  const endSec = maxWindow;
  const duration = Math.round((endPct - startPct) * maxWindow);

  const createClipMutation = useMutation({
    mutationFn: (data) => base44.entities.StreamClip.create(data),
    onSuccess: () => {
      toast.success('Clip saved! View on your channel →');
      setOpen(false);
    },
    onError: () => toast.error('Failed to save clip.'),
  });

  const handleTrackMouseDown = useCallback((handle) => (e) => {
    draggingRef.current = handle;
    e.preventDefault();
    const onMove = (ev) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      if (draggingRef.current === 'start') {
        setStartPct(Math.min(pct, endPct - 0.1));
      } else {
        setEndPct(Math.max(pct, startPct + 0.1));
      }
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
    const clipTitle = title.trim() || `${streamTitle} — Clip`;
    createClipMutation.mutate({
      room_id: roomId,
      creator_id: creatorId,
      clipped_by_id: currentUser?.id,
      clipped_by_username: currentUser?.full_name || currentUser?.email,
      title: clipTitle,
      start_timestamp_seconds: elapsedSeconds - maxWindow + startSec,
      end_timestamp_seconds: elapsedSeconds - maxWindow + endSec,
      duration_seconds: duration,
    });
  };

  const formatSec = (s) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <>
      <button
        onClick={() => { setTitle(`${streamTitle} Clip`); setOpen(true); }}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#a78bfa]/10 border border-[#a78bfa]/30 text-[#a78bfa] hover:bg-[#a78bfa]/20 text-xs font-semibold transition-all"
      >
        <Scissors className="w-3.5 h-3.5" /> Clip
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 bg-[#0d0618] border border-[#a78bfa]/30 rounded-2xl shadow-2xl z-30 overflow-hidden"
            style={{ backdropFilter: 'blur(16px)' }}
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-[#a78bfa]" />
                  <span className="font-semibold text-white text-sm">Create Clip</span>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Clip title */}
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Clip title..."
                style={{ width: '100%', padding: '6px 14px', background: 'rgba(17,8,34,0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif', height: 32 }} />

              {/* Timeline scrubber */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>Last {maxWindow}s</span>
                  <span className="text-[#a78bfa] font-semibold">{duration}s clip</span>
                </div>
                <div
                  ref={trackRef}
                  className="relative h-10 bg-white/5 rounded-lg overflow-hidden cursor-pointer select-none"
                >
                  {/* Background ticks */}
                  {Array.from({ length: maxWindow }).map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 w-px bg-white/5"
                      style={{ left: `${(i / maxWindow) * 100}%` }} />
                  ))}
                  {/* Selected region */}
                  <div
                    className="absolute top-0 bottom-0 bg-[#a78bfa]/25 border-x-2 border-[#a78bfa]"
                    style={{ left: `${startPct * 100}%`, width: `${(endPct - startPct) * 100}%` }}
                  />
                  {/* Start handle */}
                  <div
                    className="absolute top-0 bottom-0 w-4 bg-[#a78bfa] cursor-ew-resize flex items-center justify-center"
                    style={{ left: `${startPct * 100 - 8}px` }}
                    onMouseDown={handleTrackMouseDown('start')}
                  >
                    <div className="w-0.5 h-6 bg-white/60 rounded-full" />
                  </div>
                  {/* End handle */}
                  <div
                    className="absolute top-0 bottom-0 w-4 bg-[#a78bfa] cursor-ew-resize flex items-center justify-center"
                    style={{ right: `${(1 - endPct) * 100}%`, transform: 'translateX(100%)' }}
                    onMouseDown={handleTrackMouseDown('end')}
                  >
                    <div className="w-0.5 h-6 bg-white/60 rounded-full" />
                  </div>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#a78bfa]">{formatSec(elapsedSeconds - maxWindow + startSec)}</span>
                  <span className="text-[#a78bfa]">{formatSec(elapsedSeconds)}</span>
                </div>
              </div>

              <button onClick={handleSave} disabled={createClipMutation.isPending || duration < 3}
                style={{ width: '100%', background: '#a78bfa', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 8, padding: '8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, opacity: (createClipMutation.isPending || duration < 3) ? 0.5 : 1 }}>
                <Check className="w-4 h-4" /> Create {duration}s Clip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}