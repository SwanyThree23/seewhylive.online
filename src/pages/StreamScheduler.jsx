import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ChevronLeft, ChevronRight, Calendar, Clock, Bell,
  Radio, Share2, Pencil, Trash2, X, Check, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
const CATEGORIES = [
  { id: 'gaming', label: '🎮 Gaming' }, { id: 'music', label: '🎵 Music' },
  { id: 'education', label: '📚 Education' }, { id: 'talk', label: '🎙 Talk' },
  { id: 'fitness', label: '💪 Fitness' }, { id: 'cooking', label: '🍳 Cooking' },
  { id: 'art', label: '🎨 Art' }, { id: 'tech', label: '💻 Tech' },
  { id: 'irl', label: '📍 IRL' }, { id: 'other', label: '🌟 Other' },
];
const DURATIONS = [
  { label: '30 min', value: 30 }, { label: '1 hr', value: 60 },
  { label: '2 hr', value: 120 }, { label: '3 hr', value: 180 }, { label: '4 hr+', value: 240 },
];
const CAT_COLORS = {
  gaming: '#a78bfa', music: '#f472b6', education: '#60a5fa', talk: '#34d399',
  fitness: '#fb923c', cooking: '#fbbf24', art: '#C0392B', tech: '#00d4ff',
  irl: '#6DBF7E', other: '#d4af37',
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ width: 40, height: 22, borderRadius: 99, background: checked ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </div>
  );
}

export default function StreamScheduler() {
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState('month');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingStream, setEditingStream] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const blankForm = {
    title: '', description: '', category: 'gaming',
    scheduled_start: '', estimated_duration_minutes: 60,
    is_recurring: false, recurrence: 'weekly',
    is_public: true,
  };
  const [form, setForm] = useState(blankForm);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: streams = [] } = useQuery({
    queryKey: ['scheduled-streams', user?.id],
    queryFn: () => base44.entities.ScheduledStream.filter({ creator_id: user?.id }, 'scheduled_start', 50),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ScheduledStream.create(data),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['scheduled-streams'] });
      setShowForm(false);
      setForm(blankForm);
      toast.success('Stream scheduled!');
      if (user?.id) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'stream_scheduled',
          title: `Scheduled: ${created?.title || 'Stream'}`,
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Action failed.'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScheduledStream.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scheduled-streams'] }); setShowForm(false); setEditingStream(null); toast.success('Stream updated'); },
    onError: () => toast.error('Action failed.'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledStream.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scheduled-streams'] }); toast.success('Stream cancelled'); },
    onError: () => toast.error('Action failed.'),
  });

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const streamsByDay = useMemo(() => {
    const map = {};
    streams.forEach(s => {
      const d = new Date(s.scheduled_start);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(s);
      }
    });
    return map;
  }, [streams, year, month]);

  const upcomingStreams = streams
    .filter(s => new Date(s.scheduled_start) > new Date() && s.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));

  const openEdit = (stream) => {
    setEditingStream(stream);
    setForm({
      title: stream.title, description: stream.description || '',
      category: stream.category || 'gaming',
      scheduled_start: stream.scheduled_start?.slice(0, 16) || '',
      estimated_duration_minutes: stream.estimated_duration_minutes || 60,
      is_recurring: stream.is_recurring || false,
      recurrence: stream.recurrence || 'weekly',
      is_public: stream.is_public !== false,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.scheduled_start) return toast.error('Title and start time required');
    const data = { ...form, creator_id: user?.id, scheduled_start: new Date(form.scheduled_start).toISOString() };
    if (editingStream) updateMutation.mutate({ id: editingStream.id, data });
    else createMutation.mutate(data);
  };

  const shareStream = (s) => {
    const text = `🔴 I'm going LIVE: "${s.title}" — ${new Date(s.scheduled_start).toLocaleString()}\nJoin me at: ${window.location.origin}`;
    navigator.clipboard.writeText(text).then(() => toast.success('Announcement copied!')).catch(() => toast.error('Copy failed.'));
  };

  const getCountdown = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    if (diff <= 0) return 'Starting now!';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="min-h-screen bg-[#0d0618] text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#d4af37]">Stream Scheduler</h1>
            <p className="text-sm text-white/50">{upcomingStreams.length} upcoming streams</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              {['month', 'week', 'day'].map(v => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`px-3 py-1.5 text-xs capitalize transition-all ${viewMode === v ? 'bg-[#d4af37] text-black font-bold' : 'text-white/50 hover:text-white'}`}>
                  {v}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setEditingStream(null); setForm(blankForm); setShowForm(true); }}
              style={{ background: '#D4AF37', color: '#000', fontWeight: 900, padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, textTransform: 'uppercase' }}>
              <Plus className="w-4 h-4" /> Schedule Stream
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 16 }}>
          <div style={{ padding: '16px 16px 8px' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{monthName}</h2>
              <div className="flex gap-1">
                <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setCalendarDate(new Date())}
                  className="px-3 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/60">Today</button>
                <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] text-white/30 uppercase py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                const dayStreams = streamsByDay[day] || [];
                return (
                  <motion.div
                    key={day}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                    className={`min-h-[60px] rounded-lg p-1.5 cursor-pointer transition-all border ${
                      isToday ? 'border-[#d4af37]/60 bg-[#d4af37]/5' :
                      selectedDay === day ? 'border-white/30 bg-white/5' :
                      'border-transparent hover:border-white/10 hover:bg-white/3'
                    }`}
                  >
                    <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-[#d4af37]' : 'text-white/60'}`}>{day}</p>
                    <div className="space-y-0.5">
                      {dayStreams.slice(0, 2).map(s => (
                        <div key={s.id} className="text-[11px] px-1 py-0.5 rounded truncate font-medium"
                          style={{ background: `${CAT_COLORS[s.category] || '#d4af37'}25`, color: CAT_COLORS[s.category] || '#d4af37' }}>
                          {s.title}
                        </div>
                      ))}
                      {dayStreams.length > 2 && (
                        <p className="text-[11px] text-white/30">+{dayStreams.length - 2} more</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Day detail */}
            <AnimatePresence>
              {selectedDay && streamsByDay[selectedDay] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-3 border-t border-white/10 pt-3 space-y-2"
                >
                  <p className="text-xs text-white/40">{monthName.split(' ')[0]} {selectedDay}</p>
                  {streamsByDay[selectedDay].map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="w-2 h-8 rounded-full shrink-0" style={{ background: CAT_COLORS[s.category] || '#d4af37' }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">{s.title}</p>
                        <p className="text-xs text-white/40">{new Date(s.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {s.estimated_duration_minutes}min</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-[#d4af37]/10 flex items-center justify-center text-white/40 hover:text-[#d4af37]">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => shareStream(s)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-[#00d4ff]/10 flex items-center justify-center text-white/40 hover:text-[#00d4ff]">
                          <Share2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Upcoming streams list */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Upcoming Streams</h2>
          {upcomingStreams.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 16 }}>
              <div style={{ padding: 16 }}>
                <div style={{ padding: '48px 16px', textAlign: 'center' }}>
                  <Calendar className="w-12 h-12 mx-auto text-white/20 mb-3" />
                  <p className="text-white/40">No upcoming streams — schedule your first one!</p>
                </div>
              </div>
            </div>
          ) : (
            upcomingStreams.map(s => (
              <motion.div key={s.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 16 }}>
                  <div style={{ padding: 16 }}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ background: `${CAT_COLORS[s.category] || '#d4af37'}20`, border: `1px solid ${CAT_COLORS[s.category] || '#d4af37'}40` }}>
                        {CATEGORIES.find(c => c.id === s.category)?.label?.charAt(0) || '🎬'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-white truncate">{s.title}</p>
                          {s.is_recurring && (
                            <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 99, background: 'rgba(212,175,55,0.2)', color: '#a78bfa', border: '1px solid rgba(212,175,55,0.3)' }}>
                              <RefreshCw className="w-2.5 h-2.5 mr-1 inline" />{s.recurrence}
                            </span>
                          )}
                          {!s.is_public && (
                            <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 99, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                              Private
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/50 mt-0.5">{new Date(s.scheduled_start).toLocaleString()} · {s.estimated_duration_minutes}min</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-semibold text-[#00d4ff]">⏱ {getCountdown(s.scheduled_start)}</span>
                          <span className="text-[10px] text-white/30 flex items-center gap-1"><Bell className="w-2.5 h-2.5" />{s.reminder_count || 0} reminders</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => shareStream(s)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#00d4ff]/10 flex items-center justify-center text-white/40 hover:text-[#00d4ff]">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#d4af37]/10 flex items-center justify-center text-white/40 hover:text-[#d4af37]">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (window.confirm('Cancel this stream?')) deleteMutation.mutate(s.id); }}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-900/20 flex items-center justify-center text-white/40 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Sheet */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40" onClick={() => { setShowForm(false); setEditingStream(null); }} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0d0618] border-l border-[rgba(212,175,55,0.2)] z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#d4af37]">{editingStream ? 'Edit Stream' : 'Schedule New Stream'}</h2>
                  <button onClick={() => { setShowForm(false); setEditingStream(null); }} className="text-white/40 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xs text-white/50">Stream Title *</label>
                    <span className="text-[10px] text-white/30">{form.title.length}/80</span>
                  </div>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value.slice(0, 80) }))}
                    placeholder="What are you streaming?"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 12px', color: 'white', fontSize: 14, outline: 'none' }}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xs text-white/50">Description</label>
                    <span className="text-[10px] text-white/30">{form.description.length}/500</span>
                  </div>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value.slice(0, 500) }))}
                    rows={3} placeholder="Tell viewers what to expect..."
                    className="w-full bg-white/5 border border-white/20 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[#d4af37]/40 placeholder:text-white/25 resize-none"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Category</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CATEGORIES.map(c => (
                      <button key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))}
                        className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                          form.category === c.id
                            ? 'border-[#d4af37] bg-[#d4af37]/10 text-white'
                            : 'border-white/10 text-white/50 hover:border-white/20'
                        }`}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date/Time */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Date & Time *</label>
                  <input type="datetime-local" value={form.scheduled_start}
                    onChange={e => setForm(f => ({ ...f, scheduled_start: e.target.value }))}
                    className="w-full bg-white/5 border border-white/20 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[#d4af37]/40 [color-scheme:dark]" />
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Estimated Duration</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DURATIONS.map(d => (
                      <button key={d.value} onClick={() => setForm(f => ({ ...f, estimated_duration_minutes: d.value }))}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                          form.estimated_duration_minutes === d.value
                            ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]'
                            : 'border-white/10 text-white/50 hover:border-white/20'
                        }`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">Recurring Stream</p>
                      <p className="text-[10px] text-white/40">Repeat on a schedule</p>
                    </div>
                    <Toggle checked={form.is_recurring} onChange={v => setForm(f => ({ ...f, is_recurring: v }))} />
                  </div>
                  {form.is_recurring && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[{ v: 'daily', l: 'Daily' }, { v: 'weekly', l: 'Weekly' }, { v: 'biweekly', l: 'Every 2 weeks' }].map(opt => (
                        <button key={opt.v} onClick={() => setForm(f => ({ ...f, recurrence: opt.v }))}
                          style={{ padding: '6px 14px', borderRadius: 99, fontSize: 11, border: `1px solid ${form.recurrence === opt.v ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: form.recurrence === opt.v ? 'rgba(212,175,55,0.15)' : 'transparent', color: form.recurrence === opt.v ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">Public Stream</p>
                      <p className="text-[10px] text-white/40">Visible on discover page</p>
                    </div>
                    <Toggle checked={form.is_public} onChange={v => setForm(f => ({ ...f, is_public: v }))} />
                  </div>
                </div>

                {/* Preview Card */}
                <div className="rounded-xl border border-[#d4af37]/20 bg-white/5 p-3">
                  <p className="text-[10px] text-white/30 uppercase mb-2">Preview</p>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ background: `${CAT_COLORS[form.category] || '#d4af37'}20` }}>
                      {CATEGORIES.find(c => c.id === form.category)?.label?.charAt(0) || '🎬'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white truncate">{form.title || 'Stream Title'}</p>
                      <p className="text-[10px] text-white/40">{form.scheduled_start ? new Date(form.scheduled_start).toLocaleString() : 'Date not set'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    style={{ background: '#D4AF37', color: '#000', fontWeight: 900, padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, textTransform: 'uppercase', flex: 1, justifyContent: 'center' }}>
                    <Check className="w-4 h-4" />
                    {editingStream ? 'Save Changes' : 'Schedule Stream'}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setEditingStream(null); }}
                    style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <SwanAIRecommendations roomId={null} currentLayout="schedule" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={null} roomId={null} currentUser={null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}
