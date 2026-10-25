import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Flame, Star, Zap, Check } from 'lucide-react';
import { toast } from 'sonner';
import ClipThisButton from './ClipThisButton';

const MOMENTS = [
  { id: 'fire',    icon: '🔥', label: 'Fire Moment',  color: '#D4854A' },
  { id: 'epic',    icon: '⚡', label: 'Epic',          color: '#FFB800' },
  { id: 'funny',   icon: '😂', label: 'LOL Moment',   color: '#6DBF7E' },
  { id: 'tip',     icon: '💰', label: 'Big Tip',       color: '#d4af37' },
  { id: 'peak',    icon: '🏆', label: 'Peak Moment',  color: '#D4AF37' },
];

function fmtTs(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2,'0')}`;
}

export default function StreamHighlightCapture({ roomId, sessionId, creatorId, elapsedSeconds, isHost }) {
  const [captured, setCaptured] = useState(null);
  const [open, setOpen] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);

  const captureMutation = useMutation({
    mutationFn: (momentType) => base44.entities.StreamHighlight.create({
      room_id: roomId,
      session_id: sessionId,
      creator_id: creatorId,
      timestamp_seconds: elapsedSeconds,
      moment_type: momentType,
      title: `${MOMENTS.find(m => m.id === momentType)?.label} @ ${Math.floor(elapsedSeconds / 60)}m`,
      upvotes: 0,
    }),
    onSuccess: (highlight, momentType) => {
      setCaptured(momentType);
      setCaptureCount(c => c + 1);
      toast.success('Moment captured! ⚡');
      setTimeout(() => setCaptured(null), 2000);
      setOpen(false);
      if (creatorId) {
        base44.entities.Activity.create({
          user_id: creatorId,
          type: 'clip_created',
          title: `Captured ${MOMENTS.find(m => m.id === momentType)?.label || 'moment'}`,
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Action failed.'),
  });

  if (!isHost) return null;

  return (
    <div className="relative flex items-center gap-1.5">
      <ClipThisButton
        roomId={roomId}
        sessionId={sessionId}
        creatorId={creatorId}
        elapsedSeconds={elapsedSeconds}
      />

      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95"
        style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          background: open ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.25)',
          color: '#D4AF37',
        }}>
        <Scissors className="w-3 h-3" />
        Clip
        {captureCount > 0 && (
          <span className="ml-0.5 text-[9px] font-mono opacity-70">×{captureCount}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full mb-2 right-0 z-50 rounded-2xl p-2 space-y-1"
            style={{ background: '#080B18', border: '1px solid rgba(212,175,55,0.2)', width: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
            <div className="flex items-center justify-between px-1 pb-1">
              <p className="text-[11px] font-bold uppercase text-white/30"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Tag This Moment</p>
              {elapsedSeconds > 0 && (
                <span className="text-[10px] font-mono" style={{ color: 'rgba(212,175,55,0.5)' }}>@ {fmtTs(elapsedSeconds)}</span>
              )}
            </div>
            {MOMENTS.map(m => (
              <button key={m.id}
                onClick={() => captureMutation.mutate(m.id)}
                disabled={captureMutation.isPending}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all hover:bg-white/5 active:scale-95">
                <span className="text-base">{m.icon}</span>
                <span className="text-[11px] font-bold" style={{ color: m.color }}>{m.label}</span>
                {captured === m.id && <Check className="w-3 h-3 ml-auto text-[#6DBF7E]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}