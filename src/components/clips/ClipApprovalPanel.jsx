import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Scissors, Check, Trash2, RotateCcw, Plus, Clock } from 'lucide-react';
import AddFromMyClips from '@/components/clips/AddFromMyClips';

const GOLD = '#FFB800';
const GREEN = '#00FF88';
const RED = '#FF2040';
const COND = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO = { fontFamily: 'DM Mono, monospace' };

const TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'removed', label: 'Removed' },
];

function fmt(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function statusOf(clip) {
  return clip.approval_status || 'pending';
}

export default function ClipApprovalPanel({ creatorId }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState('pending');
  const [adding, setAdding] = useState(false);

  const { data: clips = [], isLoading } = useQuery({
    queryKey: ['clip-approvals', creatorId],
    queryFn: async () => {
      const res = await base44.entities.StreamClip.filter(
        { creator_id: creatorId },
        { sort: '-created_date', limit: 80 }
      );
      return res.items || [];
    },
    enabled: !!creatorId,
  });

  const moderate = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.StreamClip.update(id, {
        approval_status: status,
        reviewed_at: new Date().toISOString(),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['clip-approvals', creatorId] });
      qc.invalidateQueries({ queryKey: ['clips'] });
      toast.success(vars.status === 'approved' ? 'Clip approved' : 'Clip removed');
    },
    onError: () => toast.error('Could not update that clip'),
  });

  const grouped = React.useMemo(() => ({
    pending: clips.filter(c => statusOf(c) === 'pending'),
    approved: clips.filter(c => statusOf(c) === 'approved'),
    removed: clips.filter(c => statusOf(c) === 'removed'),
  }), [clips]);

  const visible = grouped[tab] || [];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(7,7,15,0.9)', border: '1px solid var(--bd)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--bd)' }}>
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4" style={{ color: GOLD }} />
            <p className="font-black uppercase" style={{ ...COND, fontSize: 11, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)' }}>
              Clip Approval
            </p>
            {grouped.pending.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full" style={{ ...MONO, fontSize: 10, color: GOLD, background: 'rgba(255,184,0,0.14)', border: '1px solid rgba(255,184,0,0.35)' }}>
                {grouped.pending.length}
              </span>
            )}
          </div>
          <button onClick={() => setAdding(v => !v)}
            className="tap-44 flex items-center gap-1.5 rounded-lg px-2.5"
            style={{ height: 32, ...COND, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: GOLD, background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)' }}>
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        <div className="flex" style={{ borderBottom: '1px solid var(--bd)' }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 py-2.5 tap-44"
                style={{
                  ...COND, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: active ? GOLD : 'var(--mu)',
                  background: active ? 'rgba(255,184,0,0.07)' : 'transparent',
                  borderBottom: `2px solid ${active ? GOLD : 'transparent'}`,
                }}>
                {t.label} {grouped[t.id].length > 0 ? `(${grouped[t.id].length})` : ''}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <p className="px-4 py-8 text-center" style={{ ...COND, fontSize: 13, color: 'var(--mu)' }}>Loading clips…</p>
        ) : visible.length === 0 ? (
          <div className="px-4 py-9 flex flex-col items-center gap-2 text-center">
            <Scissors className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.12)' }} />
            <p style={{ ...COND, fontSize: 13, color: 'var(--mu)' }}>
              {tab === 'pending' ? 'No clips waiting for review.' : tab === 'approved' ? 'No approved clips yet.' : 'Nothing removed.'}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--bd)' }}>
            {visible.map(clip => {
              const mine = clip.clipped_by_id === creatorId;
              const busy = moderate.isPending && moderate.variables?.id === clip.id;
              return (
                <div key={clip.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate" style={{ ...COND, fontSize: 14, fontWeight: 800, color: 'var(--tx)' }}>
                        {clip.title || 'Untitled clip'}
                      </p>
                      <p className="truncate" style={{ ...MONO, fontSize: 10, color: 'var(--mu)', marginTop: 2 }}>
                        {mine ? 'Clipped by you' : `by ${clip.clipped_by_username || 'a viewer'}`}
                        {' · '}{fmt(clip.duration_seconds || (clip.end_timestamp_seconds - clip.start_timestamp_seconds))}
                        {' · '}{new Date(clip.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    {statusOf(clip) === 'approved' && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded" style={{ ...MONO, fontSize: 10, color: GREEN, background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>LIVE</span>
                    )}
                    {statusOf(clip) === 'removed' && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded" style={{ ...MONO, fontSize: 10, color: RED, background: 'rgba(255,32,64,0.1)', border: '1px solid rgba(255,32,64,0.3)' }}>REMOVED</span>
                    )}
                    {statusOf(clip) === 'pending' && (
                      <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ ...MONO, fontSize: 10, color: GOLD, background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)' }}>
                        <Clock className="w-2.5 h-2.5" /> REVIEW
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {statusOf(clip) !== 'approved' && (
                      <button onClick={() => moderate.mutate({ id: clip.id, status: 'approved' })} disabled={busy}
                        className="tap-44 flex items-center gap-1.5 rounded-lg px-3 disabled:opacity-40"
                        style={{ height: 32, ...COND, fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', color: '#000', background: GREEN }}>
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                    {statusOf(clip) !== 'removed' && (
                      <button onClick={() => moderate.mutate({ id: clip.id, status: 'removed' })} disabled={busy}
                        className="tap-44 flex items-center gap-1.5 rounded-lg px-3 disabled:opacity-40"
                        style={{ height: 32, ...COND, fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', color: RED, background: 'rgba(255,32,64,0.1)', border: '1px solid rgba(255,32,64,0.35)' }}>
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                    {statusOf(clip) === 'removed' && (
                      <button onClick={() => moderate.mutate({ id: clip.id, status: 'approved' })} disabled={busy}
                        className="tap-44 flex items-center gap-1.5 rounded-lg px-3 disabled:opacity-40"
                        style={{ height: 32, ...COND, fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', color: GOLD, background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)' }}>
                        <RotateCcw className="w-3.5 h-3.5" /> Restore
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {adding && <AddFromMyClips creatorId={creatorId} onClose={() => setAdding(false)} />}
    </div>
  );
}