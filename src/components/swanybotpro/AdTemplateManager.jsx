import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save, Clock, Play, Trash2, Calendar, Film, Zap,
  ChevronDown, ChevronUp,
} from 'lucide-react';

const G = '#D4AF37';
const EM = '#6DBF7E';
const OR = '#D4854A';
const BORDER = 'rgba(212,175,55,0.18)';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function fmtOffset(sec) {
  const m = Math.floor((sec || 0) / 60);
  const s = Math.floor((sec || 0) % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
function parseOffset(str) {
  const parts = String(str || '').split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

export default function AdTemplateManager({ currentSetup, onLoad, roomId }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [offset, setOffset] = useState('0:00');
  const [room, setRoom] = useState(roomId || '');
  const [expanded, setExpanded] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editOffset, setEditOffset] = useState('');
  const [editRoom, setEditRoom] = useState('');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: templates = [] } = useQuery({
    queryKey: ['adTemplates', user?.id],
    queryFn: () => base44.entities.AdTemplate.filter({ creator_id: user.id }, '-created_date', 100),
    enabled: !!user,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      return base44.entities.AdTemplate.create({
        creator_id: user.id,
        template_name: name.trim() || 'Untitled Ad',
        ...currentSetup,
        room_id: room.trim(),
        trigger_offset_seconds: parseOffset(offset),
        status: room.trim() ? 'active' : 'draft',
      });
    },
    onSuccess: () => { setName(''); setOffset('0:00'); qc.invalidateQueries({ queryKey: ['adTemplates'] }); },
  });
  const updateMut = useMutation({
    mutationFn: async ({ id, data }) => base44.entities.AdTemplate.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adTemplates'] }),
  });
  const delMut = useMutation({
    mutationFn: async (id) => base44.entities.AdTemplate.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adTemplates'] }),
  });

  const canSave = !!user && !!(currentSetup?.style_id || currentSetup?.product_name) && !saveMut.isPending;

  return (
    <div className="space-y-3">
      {/* Save new template */}
      <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 mb-2">
          <Save className="w-3.5 h-3.5" style={{ color: G }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: G, ...T }}>Save current setup as template</span>
        </div>
        <div className="grid grid-cols-12 gap-1.5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name"
            className="col-span-12 sm:col-span-5 rounded-lg px-2.5 py-2 text-[12px]" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff' }} />
          <input value={offset} onChange={(e) => setOffset(e.target.value)} placeholder="0:00"
            className="col-span-4 sm:col-span-2 rounded-lg px-2 py-2 text-[12px] text-center" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: OR, fontFamily: 'Share Tech Mono, monospace' }} />
          <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="room id"
            className="col-span-8 sm:col-span-3 rounded-lg px-2 py-2 text-[11px]" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff', fontFamily: 'Share Tech Mono, monospace' }} />
          <button onClick={() => saveMut.mutate()} disabled={!canSave}
            className="col-span-12 sm:col-span-2 rounded-lg py-2 text-[11px] font-black uppercase flex items-center justify-center gap-1 disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${G}, ${OR})`, color: '#000' }}>
            <Save className="w-3 h-3" /> Save
          </button>
        </div>
        <p className="text-[9px] mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <Clock className="w-3 h-3 inline mr-1" style={{ color: OR }} />
          Trigger offset = seconds into the broadcast when this ad + poll auto-fires. Bind a room id to arm it now.
        </p>
      </div>

      {/* Template list */}
      {templates.length === 0 ? (
        <p className="text-center py-4 text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No saved templates yet. Build a setup above and save it.</p>
      ) : (
        <div className="space-y-1.5">
          {templates.map((t) => {
            const open = expanded === t.id;
            const editing = editingId === t.id;
            const statusColor = t.status === 'fired' ? 'rgba(255,255,255,0.3)' : t.status === 'active' ? EM : 'rgba(255,255,255,0.4)';
            return (
              <div key={t.id} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    {t.product_image ? <img src={t.product_image} alt="" className="w-full h-full object-cover" /> : <Film className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-white truncate" style={T}>{t.template_name}</p>
                    <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {t.style_id} · {t.aspect_id} · {t.shot_count} shot{t.shot_count > 1 ? 's' : ''} · {t.poll_question ? 'poll ✓' : 'no poll'}
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase shrink-0" style={{ background: statusColor + '18', border: `1px solid ${statusColor}44`, color: statusColor, ...T }}>{t.status}</span>
                  <button onClick={() => setExpanded(open ? null : t.id)} className="shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                {open && (
                  <div className="px-3 pb-3 space-y-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div>
                        <span className="text-[9px] font-black uppercase block mb-1" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>Trigger offset</span>
                        {editing ? (
                          <input value={editOffset} onChange={(e) => setEditOffset(e.target.value)} className="w-full rounded px-2 py-1 text-[11px] text-center" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff', fontFamily: 'Share Tech Mono, monospace' }} />
                        ) : (
                          <span className="text-[14px] font-black" style={{ color: OR, fontFamily: 'Share Tech Mono, monospace' }}>{fmtOffset(t.trigger_offset_seconds)}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase block mb-1" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>Room binding</span>
                        {editing ? (
                          <input value={editRoom} onChange={(e) => setEditRoom(e.target.value)} placeholder="room id" className="w-full rounded px-2 py-1 text-[11px]" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff', fontFamily: 'Share Tech Mono, monospace' }} />
                        ) : (
                          <span className="text-[11px]" style={{ color: t.room_id ? EM : 'rgba(255,255,255,0.3)', fontFamily: 'Share Tech Mono, monospace' }}>{t.room_id ? t.room_id.slice(-6) : '— none —'}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <button onClick={() => onLoad && onLoad(t)} disabled={!onLoad}
                        className="flex-1 rounded-lg py-2 text-[10px] font-black uppercase flex items-center justify-center gap-1 disabled:opacity-40"
                        style={{ background: 'rgba(212,175,55,0.12)', border: `1px solid ${G}55`, color: G, ...T }}>
                        <Play className="w-3 h-3" /> Load into Studio
                      </button>
                      {editing ? (
                        <button onClick={() => { updateMut.mutate({ id: t.id, data: { trigger_offset_seconds: parseOffset(editOffset), room_id: editRoom.trim(), status: editRoom.trim() ? 'active' : 'draft' } }); setEditingId(null); }}
                          className="px-3 rounded-lg text-[10px] font-black uppercase" style={{ background: 'rgba(109,191,126,0.15)', border: '1px solid rgba(109,191,126,0.4)', color: EM, ...T }}>Save</button>
                      ) : (
                        <button onClick={() => { setEditingId(t.id); setEditOffset(fmtOffset(t.trigger_offset_seconds)); setEditRoom(t.room_id || ''); }}
                          className="px-2.5 rounded-lg text-[10px] font-black uppercase" style={{ background: 'rgba(212,175,55,0.1)', border: `1px solid ${BORDER}`, color: G, ...T }}>Edit</button>
                      )}
                      {t.status !== 'fired' && !editing && (
                        <button onClick={() => updateMut.mutate({ id: t.id, data: { status: t.status === 'active' ? 'draft' : 'active' } })}
                          className="px-2.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1" style={{ background: t.status === 'active' ? 'rgba(255,255,255,0.04)' : 'rgba(109,191,126,0.12)', border: `1px solid ${t.status === 'active' ? 'rgba(255,255,255,0.1)' : 'rgba(109,191,126,0.4)'}`, color: t.status === 'active' ? 'rgba(255,255,255,0.5)' : EM, ...T }}>
                          <Zap className="w-3 h-3" /> {t.status === 'active' ? 'Pause' : 'Arm'}
                        </button>
                      )}
                      <button onClick={() => delMut.mutate(t.id)}
                        className="px-2 rounded-lg flex items-center" style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.4)', color: '#ef4444' }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}