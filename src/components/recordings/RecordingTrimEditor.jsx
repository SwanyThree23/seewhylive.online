import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Scissors, Play, X, Loader2 } from 'lucide-react';

const C = {
  surface: '#07070F', card: '#0B0B18', line: '#16162A',
  text: '#F0F0FF', muted: '#5A5A7A', gold: '#FFB800', green: '#00FF88', accent: '#FF1564',
};
const FONT = 'Barlow Condensed, sans-serif';

function fmt(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * RecordingTrimEditor — pick a start/end range inside a stream recording and save
 * it as a highlight clip in the creator's library (StreamClip record).
 */
export default function RecordingTrimEditor({ recording, onClose, onSaved }) {
  const total = Math.max(1, Math.round(recording?.duration_seconds || 0));
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(total);
  const [title, setTitle] = useState(`${recording?.title || 'Stream'} highlight`);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef(null);

  const setRangeStart = (value) => {
    const v = Number(value);
    setStart(Math.min(v, end - 1));
    if (videoRef.current) videoRef.current.currentTime = v;
  };

  const setRangeEnd = (value) => {
    const v = Number(value);
    setEnd(Math.max(v, start + 1));
  };

  const preview = () => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = start;
    el.play().catch(() => {});
  };

  async function save() {
    setSaving(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.StreamClip.create({
        room_id: recording.room_id || 'library',
        creator_id: recording.creator_id || user.id,
        clipped_by_id: user.id,
        clipped_by_username: user.full_name || user.email,
        title: title.trim() || 'Highlight',
        start_timestamp_seconds: start,
        end_timestamp_seconds: end,
        duration_seconds: end - start,
        clip_url: recording.recording_url,
        thumbnail_url: recording.thumbnail_url,
        is_vault: true,
      });
      toast.success('Highlight saved to your library');
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error('Could not save the highlight');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        style={{ background: C.card, border: `1px solid ${C.line}` }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4" style={{ color: C.gold }} />
            <span className="text-sm font-black uppercase tracking-wide" style={{ fontFamily: FONT, color: C.text }}>
              Trim & save highlight
            </span>
          </div>
          <button onClick={onClose} aria-label="Close trim editor" className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, color: C.muted }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            {recording?.recording_url ? (
              <video ref={videoRef} src={recording.recording_url} controls playsInline className="w-full" style={{ maxHeight: 220, background: '#000' }} />
            ) : (
              <div className="flex items-center justify-center text-xs" style={{ height: 160, color: C.muted, fontFamily: FONT }}>
                No playable file for this recording
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold" style={{ fontFamily: FONT, color: C.muted }}>
              <span>Start {fmt(start)}</span>
              <span>End {fmt(end)}</span>
              <span style={{ color: C.green }}>Length {fmt(end - start)}</span>
            </div>
            <input
              type="range" min={0} max={total} step={1} value={start}
              onChange={(e) => setRangeStart(e.target.value)}
              aria-label="Highlight start time"
              className="w-full accent-amber-400"
            />
            <input
              type="range" min={0} max={total} step={1} value={end}
              onChange={(e) => setRangeEnd(e.target.value)}
              aria-label="Highlight end time"
              className="w-full accent-amber-400"
            />
            <button
              onClick={preview}
              className="flex items-center justify-center gap-1.5 w-full rounded-xl text-xs font-bold"
              style={{ minHeight: 44, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.line}`, color: C.text, fontFamily: FONT }}
            >
              <Play className="w-3.5 h-3.5" /> Preview from start
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ fontFamily: FONT, color: C.muted }}>
              Highlight title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Highlight title"
              className="w-full rounded-xl px-3"
              style={{ minHeight: 44, background: C.surface, border: `1px solid ${C.line}`, color: C.text, fontFamily: FONT }}
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-xl font-black uppercase tracking-wide flex items-center justify-center gap-2"
            style={{ minHeight: 48, background: C.gold, color: '#000', fontFamily: FONT, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
            Save highlight to my library
          </button>
        </div>
      </div>
    </div>
  );
}