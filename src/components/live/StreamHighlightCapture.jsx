import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Flame, Star, Zap, Check } from 'lucide-react';
import { toast } from 'sonner';

const MOMENTS = [
  { id: 'fire',    icon: '🔥', label: 'Fire Moment',  color: '#FF4500' },
  { id: 'epic',    icon: '⚡', label: 'Epic',          color: '#FFB800' },
  { id: 'funny',   icon: '😂', label: 'LOL Moment',   color: '#6DBF7E' },
  { id: 'tip',     icon: '💰', label: 'Big Tip',       color: '#d4af37' },
  { id: 'peak',    icon: '🏆', label: 'Peak Moment',  color: '#D4AF37' },
];

export default function StreamHighlightCapture({ roomId, sessionId, creatorId, elapsedSeconds, isHost }) {
  const [captured, setCaptured] = useState(null);
  const [open, setOpen] = useState(false);

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
    onSuccess: (_, momentType) => {
      setCaptured(momentType);
      toast.success('Moment captured! ⚡');
      setTimeout(() => setCaptured(null), 2000);
      setOpen(false);
    },
    onError: () => toast.error('Action failed.'),
  });

  if (!isHost) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95"
        style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          background: open ? 'rgba(255,184,0,0.2)' : 'rgba(255,184,0,0.08)',
          border: '1px solid rgba(255,184,0,0.25)',
          color: '#FFB800',
        }}>
        <Scissors className="w-3 h-3" />
        Clip
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full mb-2 right-0 z-50 rounded-2xl p-2 space-y-1"
            style={{ background: '#0d0618', border: '1px solid rgba(255,184,0,0.2)', width: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
            <p className="text-[11px] font-bold uppercase text-white/30 px-1 pb-1"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Tag This Moment</p>
            {MOMENTS.map(m => (
              <button key={m.id}
                onClick={() => captureMutation.mutate(m.id)}
                disabled={captureMutation.isPending}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all hover:bg-white/5 active:scale-95">
                <span className="text-base">{m.icon}</span>
                <span className="text-[11px] font-bold" style={{ color: m.color }}>{m.label}</span>
                {captured === m.id && <Check className="w-3 h-3 ml-auto text-green-400" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}