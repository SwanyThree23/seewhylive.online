import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Eye, EyeOff, Globe, Monitor, Camera } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const FONT = 'Barlow Condensed, sans-serif';

const SOURCE_TYPES = [
  { id: 'url',        label: 'Web URL',      icon: Globe,   placeholder: 'https://example.com' },
  { id: 'rtmp',       label: 'RTMP Stream',  icon: Monitor, placeholder: 'rtmp://server/key' },
  { id: 'screenshot', label: 'Screenshot',   icon: Camera,  placeholder: 'https://screenshot-url.com/image.png' },
];

export default function WebSourceOverlayV49({ roomId, isHost }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ type: 'url', url: '', label: '', x: 0, y: 0, width: 320, height: 180 });
  const [showAdd, setShowAdd] = useState(false);

  const { data: overlays = [] } = useQuery({
    queryKey: ['overlays', roomId],
    queryFn: () => base44.entities.Overlay ? base44.entities.Overlay.filter({ room_id: roomId }) : Promise.resolve([]),
    enabled: !!roomId,
    refetchInterval: 10000,
  });

  const addMutation = useMutation({
    mutationFn: () => base44.entities.Overlay ? base44.entities.Overlay.create({
      room_id: roomId,
      source_type: form.type,
      url: form.url.trim(),
      label: form.label.trim() || form.type,
      x: form.x, y: form.y,
      width: form.width, height: form.height,
      visible: true,
    }) : Promise.reject(new Error('Overlay entity not available')),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['overlays', roomId] });
      setForm({ type: 'url', url: '', label: '', x: 0, y: 0, width: 320, height: 180 });
      setShowAdd(false);
      toast.success('Overlay added!');
    },
    onError: () => toast.error('Could not add overlay'),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.Overlay ? base44.entities.Overlay.delete(id) : Promise.reject(new Error('Overlay entity not available')),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['overlays', roomId] }); toast.success('Overlay removed'); },
    onError: () => toast.error('Failed to remove overlay.'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, visible }) => base44.entities.Overlay ? base44.entities.Overlay.update(id, { visible: !visible }) : Promise.reject(new Error('Overlay entity not available')),
    onError: () => toast.error('Failed to toggle overlay.'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['overlays', roomId] }),
  });

  if (!isHost) return null;

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${CRIMSON}44`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${CRIMSON}22`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Monitor size={16} color={GOLD} />
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: GOLD, letterSpacing: 1 }}>WEB OVERLAYS</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: FONT }}>{overlays.length} active</span>
        </div>
        <button onClick={() => setShowAdd(prev => !prev)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${GOLD}44`, background: 'transparent', cursor: 'pointer', color: GOLD, fontFamily: FONT, fontWeight: 700, fontSize: 12, minHeight: 44 }}>
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ padding: 14, borderBottom: `1px solid ${CRIMSON}22`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {SOURCE_TYPES.map(t => (
              <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${form.type === t.id ? GOLD + '55' : 'rgba(255,255,255,0.08)'}`, background: form.type === t.id ? GOLD + '12' : 'transparent', cursor: 'pointer', color: form.type === t.id ? GOLD : 'rgba(255,255,255,0.4)', fontFamily: FONT, fontWeight: 700, fontSize: 11, minHeight: 44 }}>
                {t.label}
              </button>
            ))}
          </div>
          <input placeholder={SOURCE_TYPES.find(t => t.id === form.type).placeholder} value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: `1px solid ${CRIMSON}33`, color: '#fff', fontFamily: FONT, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
          <input placeholder="Label (optional)" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: `1px solid ${CRIMSON}33`, color: '#fff', fontFamily: FONT, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {[['Width', 'width'], ['Height', 'height']].map(([label, key]) => (
              <div key={key} style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: FONT, marginBottom: 4 }}>{label}</div>
                <input type="number" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.3)', border: `1px solid ${CRIMSON}22`, color: '#fff', fontSize: 12, outline: 'none' }} />
              </div>
            ))}
          </div>
          <button onClick={() => addMutation.mutate()} disabled={!form.url.trim() || addMutation.isPending}
            style={{ padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', minHeight: 44, background: `linear-gradient(to right, ${CRIMSON}, ${GOLD})`, color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 13, opacity: (!form.url.trim() || addMutation.isPending) ? 0.5 : 1 }}>
            {addMutation.isPending ? 'Adding…' : 'Add to Scene'}
          </button>
        </div>
      )}

      {/* Overlay list */}
      <div style={{ padding: overlays.length ? '8px 12px 12px' : 0 }}>
        {overlays.map(overlay => (
          <div key={overlay.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: overlay.visible ? '#fff' : 'rgba(255,255,255,0.35)' }}>{overlay.label || overlay.source_type}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{overlay.url}</div>
            </div>
            <button onClick={() => toggleMutation.mutate({ id: overlay.id, visible: overlay.visible })}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 8, color: overlay.visible ? GOLD : 'rgba(255,255,255,0.25)', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {overlay.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button onClick={() => removeMutation.mutate(overlay.id)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 8, color: 'rgba(239,68,68,0.5)', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {overlays.length === 0 && (
          <div style={{ padding: '20px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: FONT, fontSize: 13 }}>
            No overlays added yet
          </div>
        )}
      </div>
    </div>
  );
}
