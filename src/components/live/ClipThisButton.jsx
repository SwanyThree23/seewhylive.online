import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const CLIP_SECONDS = 30;

const SOCIALS = [
  { id: 'instagram', label: 'Instagram', emoji: '📸' },
  { id: 'tiktok',    label: 'TikTok',    emoji: '🎵' },
  { id: 'x',         label: 'X',         emoji: '𝕏' },
  { id: 'youtube',   label: 'YouTube',   emoji: '▶️' },
];

export default function ClipThisButton({ roomId, sessionId, creatorId, elapsedSeconds = 0 }) {
  const [savedClip, setSavedClip] = useState(null);
  const [tags, setTags] = useState([]);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const startSec = Math.max(0, Math.round(elapsedSeconds) - CLIP_SECONDS);
  const endSec = Math.max(CLIP_SECONDS, Math.round(elapsedSeconds));

  const saveClip = useMutation({
    mutationFn: () => base44.entities.StreamClip.create({
      room_id: roomId,
      stream_session_id: sessionId || roomId,
      creator_id: creatorId,
      clipped_by_id: currentUser?.id,
      clipped_by_username: currentUser?.full_name || currentUser?.email,
      title: `Quick clip — ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
      start_timestamp_seconds: startSec,
      end_timestamp_seconds: endSec,
      duration_seconds: CLIP_SECONDS,
      is_vault: true,
      social_tags: [],
    }),
    onSuccess: (clip) => {
      setSavedClip(clip);
      setTags([]);
      navigator.vibrate?.([40, 30, 60]);
      toast.success('Last 30s saved to your Vault');
    },
    onError: () => toast.error('Could not save clip'),
  });

  const tagMutation = useMutation({
    mutationFn: (next) => base44.entities.StreamClip.update(savedClip.id, { social_tags: next }),
    onSuccess: (_r, next) => setTags(next),
    onError: () => toast.error('Could not tag clip'),
  });

  const toggleTag = (id) => {
    if (!savedClip) return;
    const next = tags.includes(id) ? tags.filter(t => t !== id) : [...tags, id];
    tagMutation.mutate(next);
  };

  const close = () => { setSavedClip(null); setTags([]); };

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => saveClip.mutate()}
        disabled={saveClip.isPending}
        title="Save the last 30 seconds"
        aria-label="Clip This — save the last 30 seconds"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all disabled:opacity-50"
        style={{
          ...T,
          background: `linear-gradient(90deg, rgba(192,57,43,0.25), rgba(212,175,55,0.22))`,
          border: `1px solid ${G}55`,
          color: G,
        }}>
        <Zap className="w-3 h-3" />
        {saveClip.isPending ? 'Saving…' : 'Clip This'}
      </motion.button>

      <AnimatePresence>
        {savedClip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            className="absolute bottom-full mb-2 right-0 z-50 rounded-2xl p-3"
            style={{ background: '#080B18', border: `1px solid ${G}30`, width: 230, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>

            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-black uppercase" style={{ ...T, color: '#6DBF7E' }}>
                <Check className="w-3 h-3" /> Saved to Vault
              </span>
              <button onClick={close} aria-label="Close" className="p-1 rounded-lg hover:bg-white/10">
                <X className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
              </button>
            </div>

            <p className="text-[10px] uppercase font-black tracking-widest mb-1.5"
              style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>
              Tag for social <span style={{ color: 'rgba(255,255,255,0.15)' }}>(optional)</span>
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              {SOCIALS.map(s => {
                const active = tags.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleTag(s.id)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                    style={{
                      ...T,
                      background: active ? `${G}1f` : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${active ? G + '60' : 'rgba(255,255,255,0.1)'}`,
                      color: active ? G : 'rgba(255,255,255,0.5)',
                    }}>
                    <span>{s.emoji}</span>{s.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}