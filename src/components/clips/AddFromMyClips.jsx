import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Scissors, X, Copy, Check } from 'lucide-react';

const GOLD = '#FFB800';
const COND = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO = { fontFamily: 'DM Mono, monospace' };

function fmt(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * AddFromMyClips — creator picks one of their own existing clips and adds it
 * to their library as a new, already-approved clip of their own.
 */
export default function AddFromMyClips({ creatorId, onClose }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: myClips = [], isLoading } = useQuery({
    queryKey: ['my-clips-for-add', creatorId],
    queryFn: async () => {
      const res = await base44.entities.StreamClip.filter(
        { clipped_by_id: creatorId },
        { sort: '-created_date', limit: 40 }
      );
      return (res.items || []).filter(c => c.approval_status !== 'removed');
    },
    enabled: !!creatorId,
  });

  const mut = useMutation({
    mutationFn: async (source) => {
      const user = await base44.auth.me();
      return base44.entities.StreamClip.create({
        room_id: source.room_id,
        stream_session_id: source.stream_session_id,
        creator_id: creatorId,
        clipped_by_id: creatorId,
        clipped_by_username: user.full_name || user.username || 'You',
        title: (title || source.title || 'Clip').trim(),
        start_timestamp_seconds: source.start_timestamp_seconds || 0,
        end_timestamp_seconds: source.end_timestamp_seconds || 0,
        duration_seconds: source.duration_seconds
          || Math.max(0, (source.end_timestamp_seconds || 0) - (source.start_timestamp_seconds || 0)),
        clip_url: source.clip_url,
        thumbnail_url: source.thumbnail_url,
        approval_status: 'approved',
        reviewed_at: new Date().toISOString(),
        derived_from_clip_id: source.id,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clip-approvals', creatorId] });
      qc.invalidateQueries({ queryKey: ['my-clips-for-add', creatorId] });
      qc.invalidateQueries({ queryKey: ['clips'] });
      toast.success('Clip added to your library');
      onClose();
    },
    onError: () => toast.error('Could not add that clip'),
  });

  const submit = () => {
    if (!selected) return;
    setSaving(true);
    mut.mutate(selected, { onSettled: () => setSaving(false) });
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--cd)', border: '1px solid var(--bd)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--bd)' }}>
        <div className="flex items-center gap-2">
          <Copy className="w-4 h-4" style={{ color: GOLD }} />
          <p className="font-black uppercase" style={{ ...COND, fontSize: 11, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.5)' }}>
            Add from my clips
          </p>
        </div>
        <button onClick={onClose} aria-label="Close" className="tap-44 flex items-center justify-center rounded-lg"
          style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.05)' }}>
          <X className="w-3.5 h-3.5" style={{ color: 'var(--mu)' }} />
        </button>
      </div>

      {isLoading ? (
        <p className="px-4 py-6 text-center" style={{ ...COND, fontSize: 13, color: 'var(--mu)' }}>Loading your clips…</p>
      ) : myClips.length === 0 ? (
        <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
          <Scissors className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.12)' }} />
          <p style={{ ...COND, fontSize: 13, color: 'var(--mu)' }}>You haven't made any clips yet.</p>
        </div>
      ) : (
        <>
          <div className="max-h-64 overflow-y-auto divide-y" style={{ borderColor: 'var(--bd)' }}>
            {myClips.map(c => {
              const active = selected?.id === c.id;
              return (
                <button key={c.id} onClick={() => { setSelected(c); setTitle(c.title || ''); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                  style={{ background: active ? 'rgba(255,184,0,0.07)' : 'transparent' }}>
                  <span className="flex items-center justify-center rounded-lg shrink-0"
                    style={{ width: 26, height: 26, background: active ? 'rgba(255,184,0,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? 'rgba(255,184,0,0.5)' : 'var(--bd)'}` }}>
                    {active ? <Check className="w-3 h-3" style={{ color: GOLD }} /> : <Scissors className="w-3 h-3" style={{ color: 'var(--mu)' }} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate" style={{ ...COND, fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>{c.title}</span>
                    <span className="block" style={{ ...MONO, fontSize: 10, color: 'var(--mu)' }}>
                      {fmt(c.duration_seconds || (c.end_timestamp_seconds - c.start_timestamp_seconds))} · {c.approval_status || 'pending'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="px-4 py-3 space-y-2" style={{ borderTop: '1px solid var(--bd)' }}>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title for the added clip"
                className="w-full rounded-lg px-3 py-2 outline-none"
                style={{ ...COND, fontSize: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--bd)', color: 'var(--tx)' }}
              />
              <button onClick={submit} disabled={saving || !title.trim()}
                className="w-full rounded-lg py-2.5 font-black uppercase disabled:opacity-40"
                style={{ ...COND, fontSize: 12, letterSpacing: '0.12em', background: GOLD, color: '#000' }}>
                {saving ? 'Adding…' : 'Add to my library'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}