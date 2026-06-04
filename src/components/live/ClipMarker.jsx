import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, X, Check, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const GREEN   = '#6DBF7E';
const FONT    = 'Barlow Condensed, sans-serif';

function fmt(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

export default function ClipMarker({ roomId, user, streamStartTs }) {
  const [open,     setOpen]     = useState(false);
  const [title,    setTitle]    = useState('');
  const [duration, setDuration] = useState(60);
  const [saving,   setSaving]   = useState(false);
  const [recent,   setRecent]   = useState([]);

  const { data: existingClips = [] } = useQuery({
    queryKey: ['studio-clips', roomId],
    queryFn: () => base44.entities.StreamClip.filter({ room_id: roomId }, '-created_date', 10),
    enabled: !!roomId,
    refetchInterval: 15000,
  });

  const allClips = recent.length > 0 ? recent : existingClips;

  const elapsedSecs = streamStartTs
    ? Math.floor((Date.now() - streamStartTs) / 1000)
    : 0;

  async function saveClip() {
    if (!title.trim()) { toast.error('Add a clip title'); return; }
    if (!roomId) { toast.error('No active stream'); return; }
    setSaving(true);
    try {
      const end   = elapsedSecs;
      const start = Math.max(0, end - duration);
      const clip = await base44.entities.StreamClip.create({
        room_id:                roomId,
        clipped_by_id:          user?.id,
        clipped_by_name:        user?.full_name || user?.email || 'Host',
        title:                  title.trim(),
        start_timestamp_seconds: start,
        end_timestamp_seconds:   end,
        duration_seconds:        duration,
        status:                 'processing',
        view_count:             0,
        share_count:            0,
        created_date:           new Date().toISOString(),
      });
      setRecent(prev => [clip, ...prev]);
      toast.success(`✂️ Clip "${title.trim()}" saved!`);
      setTitle('');
      setOpen(false);
    } catch {
      toast.error('Failed to save clip');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(v => !v)}
        title="Mark Clip"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '6px 12px',
          borderRadius: 8,
          border: `1px solid ${open ? GOLD + '50' : 'rgba(212,175,55,0.2)'}`,
          background: open ? `${GOLD}18` : 'rgba(212,175,55,0.06)',
          cursor: 'pointer',
          fontFamily: FONT,
          fontSize: 11,
          fontWeight: 900,
          color: GOLD,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          position: 'relative',
        }}
      >
        <Scissors style={{ width: 13, height: 13 }} />
        Clip
        {allClips.length > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            minWidth: 16, height: 16, borderRadius: 8,
            background: CRIMSON, color: '#fff',
            fontSize: 11, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
          }}>{allClips.length}</span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              zIndex: 60,
              width: 260,
              borderRadius: 14,
              background: 'rgba(8,11,24,0.98)',
              border: `1px solid rgba(212,175,55,0.2)`,
              boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px 8px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Scissors style={{ width: 13, height: 13, color: GOLD }} />
                <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Mark Clip
                </span>
              </div>
              {elapsedSecs > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>
                  <Clock style={{ width: 10, height: 10 }} />
                  {fmt(elapsedSecs)}
                </div>
              )}
            </div>

            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveClip()}
                placeholder="Clip title…"
                maxLength={60}
                style={{
                  width: '100%', padding: '8px 10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${title ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 8, color: '#fff', fontSize: 13, fontFamily: FONT,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
                  Duration
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[30, 60, 90, 120].map(d => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      style={{
                        flex: 1, padding: '5px 0',
                        borderRadius: 6, fontSize: 10, fontWeight: 900, fontFamily: FONT,
                        cursor: 'pointer',
                        border: duration === d ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.08)',
                        background: duration === d ? `${GOLD}18` : 'transparent',
                        color: duration === d ? GOLD : 'rgba(255,255,255,0.35)',
                      }}
                    >{d}s</button>
                  ))}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={saveClip}
                disabled={!title.trim() || saving}
                style={{
                  width: '100%', padding: '9px 0',
                  borderRadius: 8, border: 'none',
                  background: title.trim() ? `linear-gradient(135deg, ${CRIMSON}, #c0003a)` : 'rgba(255,255,255,0.06)',
                  color: title.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
                  fontFamily: FONT, fontSize: 13, fontWeight: 900,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  cursor: title.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                <Scissors style={{ width: 13, height: 13 }} />
                {saving ? 'Saving…' : `Save ${duration}s Clip`}
              </motion.button>
            </div>

            {allClips.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 12px 10px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>
                  Recent Clips ({allClips.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {allClips.slice(0, 4).map(c => (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 8px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.03)',
                    }}>
                      <Scissors style={{ width: 10, height: 10, color: GOLD, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.title}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: FONT, flexShrink: 0 }}>
                        {c.duration_seconds || ((c.end_timestamp_seconds || 0) - (c.start_timestamp_seconds || 0))}s
                      </span>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: c.status === 'published' ? GREEN : c.clip_url ? GREEN : '#FFB800',
                      }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
