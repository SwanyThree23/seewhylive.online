import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Radio, Bell, Users, Mail, Trophy, Filter, X } from 'lucide-react';
import { format, addDays, isSameDay, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const inp = { width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' };
const lbl = { display: 'block', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, marginTop: 14 };

const STATUS_STYLE = {
  draft:      { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' },
  scheduled:  { bg: 'rgba(212,175,55,0.1)',    border: 'rgba(212,175,55,0.3)',    color: '#D4AF37' },
  published:  { bg: 'rgba(109,191,126,0.1)',    border: 'rgba(109,191,126,0.3)',    color: '#6DBF7E' },
  cancelled:  { bg: 'rgba(192,57,43,0.1)',   border: 'rgba(192,57,43,0.3)',   color: '#C0392B' },
};

function getTypeIcon(type) {
  switch (type) {
    case 'room': return <Radio className="w-4 h-4" />;
    case 'event': return <Users className="w-4 h-4" />;
    case 'announcement': return <Bell className="w-4 h-4" />;
    case 'newsletter': return <Mail className="w-4 h-4" />;
    case 'challenge': return <Trophy className="w-4 h-4" />;
    default: return <Calendar className="w-4 h-4" />;
  }
}

const FILTERS = ['all', 'today', 'week', 'month'];

export default function ContentCalendarPage() {
  const [dateFilter, setDateFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ content_type: 'room', title: '', description: '', scheduled_for: new Date().toISOString(), recurrence: 'none' });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: scheduledContent = [] } = useQuery({
    queryKey: ['scheduled-content', user?.id],
    queryFn: () => base44.entities.ScheduledContent.filter({ creator_id: user?.id }, 'scheduled_for'),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ScheduledContent.create({ ...data, creator_id: user.id, status: 'scheduled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-content'] });
      setShowCreate(false);
      setFormData({ content_type: 'room', title: '', description: '', scheduled_for: new Date().toISOString(), recurrence: 'none' });
      toast.success('Content scheduled!');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ScheduledContent.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-content'] }),
  });

  const filteredContent = scheduledContent.filter(item => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d = new Date(item.scheduled_for);
    if (dateFilter === 'today') return isSameDay(d, today);
    if (dateFilter === 'week') return d >= today && d <= addDays(today, 7);
    if (dateFilter === 'month') return d >= startOfMonth(now) && d <= endOfMonth(now);
    return true;
  });

  const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center justify-between gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5" style={{ color: GOLD }} />
          <div>
            <h1 className="text-xl font-black text-white leading-none" style={T}>Content Calendar</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Schedule and manage your content</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs"
          style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer', ...T }}>
          <Plus className="w-3.5 h-3.5" /> Schedule
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 space-y-5">
        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
          {FILTERS.map(f => (
            <button key={f} onClick={() => setDateFilter(f)}
              className="px-3 py-1.5 rounded-lg font-black uppercase text-[10px] transition-all capitalize"
              style={{ ...T, background: dateFilter === f ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${dateFilter === f ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`, color: dateFilter === f ? GOLD : 'rgba(255,255,255,0.4)' }}>
              {f === 'all' ? 'All' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filteredContent.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-black uppercase text-sm mb-4" style={T}>No content scheduled for this period</p>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase text-xs mx-auto"
              style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer', ...T }}>
              <Plus className="w-3.5 h-3.5" /> Schedule Your First Content
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContent.map((item) => {
              const scheduledDate = new Date(item.scheduled_for);
              const isUpcoming = scheduledDate > new Date();
              const ss = STATUS_STYLE[item.status] || STATUS_STYLE.draft;
              const todayHighlight = isToday(scheduledDate);
              return (
                <div key={item.id} className="rounded-2xl p-4 space-y-3"
                  style={{ background: 'rgba(8,11,24,0.9)', border: `1px solid ${todayHighlight ? 'rgba(212,175,55,0.35)' : 'rgba(212,175,55,0.08)'}` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {getTypeIcon(item.content_type)}
                      <span className="text-[10px] font-black uppercase" style={T}>{item.content_type}</span>
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase"
                      style={{ ...T, background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color }}>
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-sm text-white" style={T}>{item.title}</h3>
                    {item.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.description}</p>}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <Calendar className="w-3 h-3" />
                    <span>{format(scheduledDate, 'MMM d, yyyy')}</span>
                    <span>·</span>
                    <span>{format(scheduledDate, 'h:mm a')}</span>
                  </div>

                  {item.recurrence !== 'none' && (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase"
                      style={{ ...T, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD }}>
                      Repeats {item.recurrence}
                    </span>
                  )}

                  {item.status === 'scheduled' && isUpcoming && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'published' })}
                        className="flex-1 py-1.5 rounded-lg font-black uppercase text-[10px]"
                        style={{ ...T, background: 'rgba(109,191,126,0.1)', border: '1px solid rgba(109,191,126,0.25)', color: '#6DBF7E', cursor: 'pointer' }}>
                        Publish
                      </button>
                      <button onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'cancelled' })}
                        className="flex-1 py-1.5 rounded-lg font-black uppercase text-[10px]"
                        style={{ ...T, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', color: '#C0392B', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.98)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <span className="font-black text-sm text-white" style={T}>Schedule Content</span>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-1">
              <label style={lbl}>Content Type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['room','event','announcement','newsletter','challenge'].map(t => (
                  <button key={t} onClick={() => set('content_type', t)}
                    style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, border: `1px solid ${formData.content_type === t ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: formData.content_type === t ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: formData.content_type === t ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </button>
                ))}
              </div>

              <label style={lbl}>Title</label>
              <input style={inp} value={formData.title} onChange={e => set('title', e.target.value)} placeholder="Enter title" />

              <label style={lbl}>Description</label>
              <textarea style={{ ...inp, height: 72, resize: 'none' }} value={formData.description} onChange={e => set('description', e.target.value)} placeholder="Enter description" />

              <label style={lbl}>Schedule For</label>
              <input type="datetime-local" style={inp}
                value={format(new Date(formData.scheduled_for), "yyyy-MM-dd'T'HH:mm")}
                onChange={e => set('scheduled_for', new Date(e.target.value).toISOString())} />

              <label style={lbl}>Recurrence</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['none','daily','weekly','monthly'].map(r => (
                  <button key={r} onClick={() => set('recurrence', r)}
                    style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, border: `1px solid ${formData.recurrence === r ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: formData.recurrence === r ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: formData.recurrence === r ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                    {r.charAt(0).toUpperCase()+r.slice(1)}
                  </button>
                ))}
              </div>

              <button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending || !formData.title}
                className="w-full py-3 rounded-xl font-black uppercase text-sm mt-4"
                style={{ background: !formData.title || createMutation.isPending ? 'rgba(128,0,32,0.3)' : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: !formData.title || createMutation.isPending ? 'rgba(255,255,255,0.3)' : '#000', cursor: !formData.title || createMutation.isPending ? 'default' : 'pointer', ...T }}>
                {createMutation.isPending ? 'Scheduling…' : 'Schedule Content'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
