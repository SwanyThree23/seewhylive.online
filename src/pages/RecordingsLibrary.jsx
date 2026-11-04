import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RecordingTrimEditor from '@/components/recordings/RecordingTrimEditor';
import { Loader2, Scissors, Calendar, Eye, Clock, ArrowUpDown, Filter } from 'lucide-react';

const C = {
  bg: '#03030A', surface: '#07070F', card: '#0B0B18', cardHi: '#10101E',
  line: '#16162A', text: '#F0F0FF', muted: '#5A5A7A', gold: '#FFB800', accent: '#FF1564', green: '#00FF88',
};
const FONT = 'Barlow Condensed, sans-serif';

const DATE_RANGES = [
  { id: 'all', label: 'All time' },
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
];

const SORTS = [
  { id: 'newest', label: 'Newest first', value: '-recorded_at' },
  { id: 'oldest', label: 'Oldest first', value: 'recorded_at' },
  { id: 'longest', label: 'Longest first', value: '-duration_seconds' },
  { id: 'views', label: 'Most viewed', value: '-views' },
];

function fmtDuration(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function SelectRow({ icon: Icon, value, onChange, options, label }) {
  return (
    <label className="flex-1 min-w-[140px]">
      <span className="flex items-center gap-1 mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: FONT, color: C.muted }}>
        <Icon className="w-3 h-3" /> {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl"
        style={{ minHeight: 44, background: C.surface, border: `1px solid ${C.line}`, color: C.text, fontFamily: FONT, padding: '0 12px' }}
      >
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );
}

export default function RecordingsLibrary() {
  const [dateRange, setDateRange] = useState('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: categories = [] } = useQuery({
    queryKey: ['recording-categories', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await base44.entities.StreamRecording.filter({ creator_id: user.id }, { limit: 200 });
      const list = res.items || res || [];
      return [...new Set(list.map(r => r.category).filter(Boolean))];
    },
  });

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ['recordings', user?.id, dateRange, category, sort],
    enabled: !!user?.id,
    queryFn: async () => {
      const query = { creator_id: user.id };
      if (category !== 'all') query.category = category;
      if (dateRange !== 'all') {
        const since = new Date();
        since.setDate(since.getDate() - Number(dateRange));
        query.recorded_at = { $gte: since.toISOString() };
      }
      const sortValue = SORTS.find(s => s.id === sort)?.value || '-recorded_at';
      const res = await base44.entities.StreamRecording.filter(query, { sort: sortValue, limit: 60 });
      return res.items || res || [];
    },
  });

  const categoryOptions = useMemo(
    () => [{ id: 'all', label: 'All categories' }, ...categories.map(c => ({ id: c, label: c }))],
    [categories],
  );

  return (
    <div className="min-h-screen px-3 py-4 max-w-5xl mx-auto" style={{ background: C.bg }}>
      <div className="flex items-center gap-2 mb-1">
        <Scissors className="w-4 h-4" style={{ color: C.gold }} />
        <h1 className="text-lg font-black uppercase tracking-wide" style={{ fontFamily: FONT, color: C.text }}>
          Recordings Library
        </h1>
      </div>
      <p className="text-[11px] mb-4" style={{ fontFamily: FONT, color: C.muted }}>
        Trim any stream recording and save the best moments as highlights in your library.
      </p>

      {/* Filter & sort */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-2xl" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <SelectRow icon={Calendar} label="Date" value={dateRange} onChange={setDateRange} options={DATE_RANGES} />
        <SelectRow icon={Filter} label="Category" value={category} onChange={setCategory} options={categoryOptions} />
        <SelectRow icon={ArrowUpDown} label="Sort" value={sort} onChange={setSort} options={SORTS} />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: C.gold }} />
        </div>
      )}

      {!isLoading && recordings.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <p className="text-sm font-bold" style={{ fontFamily: FONT, color: C.text }}>No recordings match these filters</p>
          <p className="text-[11px] mt-1" style={{ fontFamily: FONT, color: C.muted }}>
            Try a wider date range or a different category.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recordings.map(rec => (
          <div key={rec.id} className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="relative" style={{ height: 130, background: `linear-gradient(135deg, ${C.accent}22, ${C.surface})` }}>
              {rec.thumbnail_url ? (
                <img src={rec.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Scissors className="w-6 h-6" style={{ color: 'rgba(255,184,0,0.35)' }} />
                </div>
              )}
              <span
                className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{ background: 'rgba(0,0,0,0.8)', color: C.text, fontFamily: FONT }}
              >
                {fmtDuration(rec.duration_seconds)}
              </span>
              {rec.category && (
                <span
                  className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                  style={{ background: 'rgba(255,21,100,0.16)', border: `1px solid ${C.accent}44`, color: C.accent, fontFamily: FONT }}
                >
                  {rec.category}
                </span>
              )}
            </div>

            <div className="p-3">
              <p className="text-sm font-bold truncate" style={{ fontFamily: FONT, color: C.text }}>{rec.title}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ fontFamily: FONT, color: C.muted }}>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{rec.recorded_at ? new Date(rec.recorded_at).toLocaleDateString() : '—'}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{rec.views || 0}</span>
              </div>
              <button
                onClick={() => setEditing(rec)}
                className="mt-3 w-full rounded-xl flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wide"
                style={{ minHeight: 44, background: 'rgba(255,184,0,0.12)', border: `1px solid ${C.gold}44`, color: C.gold, fontFamily: FONT }}
              >
                <Scissors className="w-3.5 h-3.5" /> Trim & highlight
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <RecordingTrimEditor
          recording={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['recordings'] });
            qc.invalidateQueries({ queryKey: ['clips'] });
          }}
        />
      )}
    </div>
  );
}