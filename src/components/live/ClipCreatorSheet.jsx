import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Scissors, Zap, Share2, Check } from 'lucide-react';
import { Drawer } from 'vaul';

const GOLD   = '#D4AF37';
const BURG   = '#800020';

function autoTitle(roomTitle) {
  const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${roomTitle || 'Stream'} · ${t}`;
}

async function shareClip(clip) {
  const text = `Check out this clip: ${clip.title}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: clip.title, text, url: window.location.href });
      return;
    } catch { /* user cancelled or API unavailable */ }
  }
  await navigator.clipboard.writeText(window.location.href).catch(() => {});
  toast.success('Link copied to clipboard');
}

export default function ClipCreatorSheet({
  roomId, sessionId, creatorId, elapsedSeconds, roomTitle, onClose,
}) {
  const [title, setTitle]     = useState(autoTitle(roomTitle));
  const [duration, setDuration] = useState(30);
  const [savedClip, setSavedClip] = useState(null);
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: recentClips = [] } = useQuery({
    queryKey: ['room-clips', roomId],
    queryFn: () => base44.entities.StreamClip.filter({ room_id: roomId }, '-created_date', 3),
  });

  const mut = useMutation({
    mutationFn: (secs) => base44.entities.StreamClip.create({
      room_id: roomId,
      stream_session_id: sessionId || roomId,
      creator_id: creatorId || user?.id,
      clipped_by_id: user?.id,
      clipped_by_username: user?.full_name || 'Anonymous',
      title,
      start_timestamp_seconds: Math.max(0, (elapsedSeconds || 0) - secs),
      end_timestamp_seconds: elapsedSeconds || 0,
      duration_seconds: secs,
      view_count: 0,
      share_count: 0,
    }),
    onSuccess: (clip) => {
      qc.invalidateQueries({ queryKey: ['room-clips', roomId] });
      qc.invalidateQueries({ queryKey: ['clips'] });
      setSavedClip(clip);
      base44.entities.Activity.create({
        user_id: user?.id,
        type: 'clip_created',
        title: `Clipped: ${clip?.title || title}`,
      }).catch(() => {});
    },
    onError: () => toast.error('Failed to save clip'),
  });

  const quickMoment = () => {
    setTitle(autoTitle(roomTitle));
    setDuration(30);
    mut.mutate(30);
  };

  return (
    <Drawer.Root defaultOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-[230]"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-[240] rounded-t-2xl"
          style={{
            background: '#0D0F1C',
            border: '1px solid rgba(212,175,55,0.18)',
            padding: '0 20px 40px',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}
        >
          <Drawer.Handle
            className="mx-auto mt-3 mb-5 w-10 h-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          />

          {/* Success view */}
          {savedClip ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(109,191,126,0.15)', border: '1px solid rgba(109,191,126,0.3)' }}>
                <Check className="w-8 h-8 text-[#6DBF7E]" />
              </div>
              <div>
                <p className="text-white font-black text-lg" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Moment saved!
                </p>
                <p className="text-white/40 text-xs mt-1">{savedClip.title}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => shareClip(savedClip)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase"
                  style={{ background: GOLD, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-sm font-bold"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4" style={{ color: GOLD }} />
                <span className="font-black text-sm text-white uppercase"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
                  Create Moment
                </span>
              </div>

              {/* Quick Moment — one tap */}
              <button
                onClick={quickMoment}
                disabled={mut.isPending}
                className="w-full flex items-center gap-3 py-4 px-4 rounded-xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${BURG}88, rgba(212,175,55,0.15))`,
                  border: `1px solid rgba(212,175,55,0.3)`,
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: GOLD }}>
                  <Zap className="w-5 h-5 text-black" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Quick Moment
                  </p>
                  <p className="text-[11px] text-white/40">Capture last 30s instantly — no setup</p>
                </div>
                {mut.isPending && (
                  <div className="ml-auto w-4 h-4 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin shrink-0" />
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-white/25 uppercase tracking-wider">or customize</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {/* Duration picker */}
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Clip last</p>
                <div className="flex gap-2">
                  {[15, 30, 60, 90].map(s => (
                    <button key={s} onClick={() => setDuration(s)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
                      style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        background: duration === s ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${duration === s ? GOLD : 'rgba(255,255,255,0.08)'}`,
                        color: duration === s ? GOLD : 'rgba(255,255,255,0.4)',
                      }}>
                      {s}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5">Title</p>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value.slice(0, 80))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontFamily: 'Barlow Condensed, sans-serif',
                  }}
                />
              </div>

              {/* Create button */}
              <button
                onClick={() => mut.mutate(duration)}
                disabled={mut.isPending || !title.trim()}
                className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  letterSpacing: '0.08em',
                  background: title.trim() ? `linear-gradient(90deg, ${BURG}, ${GOLD})` : 'rgba(255,255,255,0.06)',
                  color: title.trim() ? '#000' : 'rgba(255,255,255,0.2)',
                  cursor: title.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                <Scissors className="w-4 h-4" />
                {mut.isPending ? 'Saving…' : `Save ${duration}s Moment`}
              </button>

              {/* Recent clips */}
              {recentClips.length > 0 && (
                <div className="pt-1">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Recent moments</p>
                  <div className="space-y-2">
                    {recentClips.map(c => (
                      <div key={c.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Scissors className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/60 truncate">{c.title}</p>
                          <p className="text-[10px] text-white/30">{c.duration_seconds}s · {c.share_count || 0} shares</p>
                        </div>
                        <button onClick={() => shareClip(c)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
                          style={{ background: 'rgba(212,175,55,0.08)' }}>
                          <Share2 className="w-3 h-3" style={{ color: 'rgba(212,175,55,0.5)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
