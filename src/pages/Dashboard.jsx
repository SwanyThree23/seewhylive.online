import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts';
import {
  DollarSign, Radio, Users, TrendingUp, Settings, Star, Eye, Clock,
  Plus, Calendar, MessageSquare, Gift, Target, ChevronRight, Zap,
  Play, Film, BarChart2, Vote, Shield, CreditCard, Download
} from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const B = '#800020';
const OB = '#0D0D0D';
const OB2 = '#1A1A1A';
const OB3 = '#2A1F1F';
const CREAM = '#F5E6D3';

const TABS = [
  { id: 'overview',    label: 'Overview',    icon: BarChart2 },
  { id: 'analytics',  label: 'Analytics',   icon: TrendingUp },
  { id: 'content',    label: 'Content',     icon: Film },
  { id: 'community',  label: 'Community',   icon: Users },
  { id: 'monetize',   label: 'Monetize',    icon: DollarSign },
  { id: 'settings',   label: 'Settings',    icon: Settings },
];

function Stat({ label, value, icon: Icon, color = G }) {
  return (
    <div className="rounded-xl p-4 space-y-2" style={{ background: OB2, border: `1px solid ${color}22` }}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'rgba(245,230,211,0.35)', fontFamily: 'IBM Plex Mono, monospace' }}>{label}</span>
        {Icon && <Icon className="w-4 h-4" style={{ color }} />}
      </div>
      <div className="text-2xl font-black" style={{ color, fontFamily: 'Barlow Condensed, sans-serif' }}>{value}</div>
    </div>
  );
}

/* ── TAB 1: OVERVIEW ── */
function OverviewTab({ user }) {
  const { data: payout } = useQuery({
    queryKey: ['dash-payout', user?.id],
    queryFn: () => base44.entities.CreatorPayout.filter({ creator_id: user.id }).then(r => r[0]),
    enabled: !!user?.id,
  });
  const { data: profile } = useQuery({
    queryKey: ['dash-profile', user?.id],
    queryFn: () => base44.entities.CreatorProfile.filter({ user_id: user.id }).then(r => r[0]),
    enabled: !!user?.id,
  });
  const { data: liveRooms = [] } = useQuery({
    queryKey: ['dash-live', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user.id, status: 'live' }),
    enabled: !!user?.id,
  });
  const { data: txns = [] } = useQuery({
    queryKey: ['dash-txns-7', user?.id],
    queryFn: () => base44.entities.Transaction.filter({ to_user_id: user.id }, '-created_date', 200),
    enabled: !!user?.id,
  });
  const { data: activities = [] } = useQuery({
    queryKey: ['dash-activity', user?.id],
    queryFn: () => base44.entities.Activity.filter({ user_id: user.id }, '-created_date', 10),
    enabled: !!user?.id,
  });

  // Build last-7-days chart
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  });
  const chartData = days.map((day, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toDateString();
    const total = txns.filter(t => new Date(t.created_date).toDateString() === ds)
      .reduce((s, t) => s + (t.creator_amount || 0), 0);
    return { day, total: Math.round(total * 100) / 100 };
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Pending Balance" value={`$${Math.floor((payout?.pending_balance || 0) * 100) / 100}`} icon={DollarSign} color={G} />
        <Stat label="Subscribers" value={profile?.subscriber_count || 0} icon={Users} color="#00F5FF" />
        <Stat label="Hours Streamed" value={`${Math.round((profile?.total_hours_streamed || 0))}h`} icon={Clock} color="#8B5CF6" />
        <Stat label="Live Now" value={liveRooms.length} icon={Radio} color="#FF1564" />
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl p-4" style={{ background: OB2, border: `1px solid ${G}20` }}>
        <p className="text-[10px] uppercase tracking-widest mb-3 font-bold" style={{ color: 'rgba(245,230,211,0.4)', fontFamily: 'IBM Plex Mono, monospace' }}>Revenue — Last 7 Days</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{ fill: 'rgba(245,230,211,0.3)', fontSize: 9, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(245,230,211,0.3)', fontSize: 9, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: OB2, border: `1px solid ${G}30`, color: CREAM, fontSize: 11 }} />
            <Bar dataKey="total" fill={G} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Go Live', icon: Radio, href: '/LiveRoom', color: B },
          { label: 'Schedule Stream', icon: Calendar, href: '/StreamScheduler', color: G },
          { label: 'Create Post', icon: Plus, href: '/VideoPost', color: '#00FF88' },
        ].map(a => (
          <Link key={a.label} to={`/${a.label === 'Go Live' ? 'LiveRoom' : a.label === 'Schedule Stream' ? 'StreamScheduler' : 'VideoPost'}`}>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase text-[10px]"
              style={{ background: `${a.color}18`, color: a.color, border: `1px solid ${a.color}30`, fontFamily: 'Barlow Condensed, sans-serif' }}>
              <a.icon className="w-3.5 h-3.5" /> {a.label}
            </button>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl overflow-hidden" style={{ background: OB2, border: `1px solid rgba(255,255,255,0.07)` }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'rgba(245,230,211,0.4)', fontFamily: 'IBM Plex Mono, monospace' }}>Recent Activity</span>
        </div>
        {activities.length === 0
          ? <p className="text-center py-6 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No recent activity</p>
          : activities.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${G}15`, border: `1px solid ${G}25` }}>
                <Zap className="w-3.5 h-3.5" style={{ color: G }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold" style={{ color: CREAM }}>{a.title}</p>
                <p className="text-[9px]" style={{ color: 'rgba(245,230,211,0.3)' }}>{new Date(a.created_date).toLocaleString()}</p>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

/* ── TAB 2: ANALYTICS ── */
function AnalyticsTab({ user }) {
  const { data: roomAnalytics = [] } = useQuery({
    queryKey: ['dash-room-analytics', user?.id],
    queryFn: () => base44.entities.RoomAnalytics.filter({ host_id: user.id }, '-created_date', 50),
    enabled: !!user?.id,
  });
  const { data: rooms = [] } = useQuery({
    queryKey: ['dash-rooms', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user.id }, '-created_date', 20),
    enabled: !!user?.id,
  });
  const { data: follows = [] } = useQuery({
    queryKey: ['dash-follows', user?.id],
    queryFn: () => base44.entities.Follow.filter({ following_id: user.id }, '-created_date', 7),
    enabled: !!user?.id,
  });

  const peakViewers = roomAnalytics.reduce((m, r) => Math.max(m, r.peak_viewers || 0), 0);
  const avgWatch = roomAnalytics.length > 0
    ? Math.round(roomAnalytics.reduce((s, r) => s + (r.average_watch_time || 0), 0) / roomAnalytics.length)
    : 0;
  const totalMsgs = roomAnalytics.reduce((s, r) => s + (r.total_messages || 0), 0);

  const topStreams = [...rooms].sort((a, b) => {
    const ra = roomAnalytics.find(r => r.room_id === a.id);
    const rb = roomAnalytics.find(r => r.room_id === b.id);
    return (rb?.peak_viewers || 0) - (ra?.peak_viewers || 0);
  }).slice(0, 5);

  const RTMP_PLATFORMS = ['YouTube', 'TikTok', 'Facebook', 'Twitch', 'Rumble'];
  const platColors = ['#FF0000', '#69C9D0', '#1877F2', '#9146FF', '#85C742'];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Peak Viewers" value={peakViewers} icon={Eye} color={G} />
        <Stat label="Avg Watch (s)" value={`${avgWatch}s`} icon={Clock} color="#00F5FF" />
        <Stat label="Chat Messages" value={totalMsgs} icon={MessageSquare} color="#8B5CF6" />
        <Stat label="New Followers" value={follows.length} icon={Users} color="#00FF88" />
        <Stat label="Rooms" value={rooms.length} icon={Radio} color="#FF6B35" />
      </div>

      {/* Top streams */}
      <div className="rounded-xl overflow-hidden" style={{ background: OB2, border: `1px solid rgba(255,255,255,0.07)` }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'rgba(245,230,211,0.4)', fontFamily: 'IBM Plex Mono, monospace' }}>Top Performing Streams</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Title', 'Date', 'Peak', 'Duration', 'Status'].map(h => (
                <th key={h} className="px-4 py-2 text-left font-bold" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {topStreams.map(r => {
                const ra = roomAnalytics.find(a => a.room_id === r.id);
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-2 font-bold truncate max-w-[140px]" style={{ color: CREAM }}>{r.title}</td>
                    <td className="px-4 py-2" style={{ color: 'rgba(245,230,211,0.4)' }}>{new Date(r.created_date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 font-black" style={{ color: G }}>{ra?.peak_viewers || 0}</td>
                    <td className="px-4 py-2" style={{ color: 'rgba(245,230,211,0.4)' }}>{Math.round((ra?.total_watch_time || 0) / 60)}m</td>
                    <td className="px-4 py-2">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase"
                        style={{ background: r.status === 'live' ? 'rgba(255,21,100,0.15)' : 'rgba(255,255,255,0.06)', color: r.status === 'live' ? '#FF1564' : 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {topStreams.length === 0 && <p className="text-center py-6 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No stream data yet</p>}
        </div>
      </div>

      {/* Platform breakdown */}
      <div className="rounded-xl p-4" style={{ background: OB2, border: `1px solid rgba(255,255,255,0.07)` }}>
        <p className="text-[9px] uppercase tracking-widest mb-3 font-bold" style={{ color: 'rgba(245,230,211,0.4)', fontFamily: 'IBM Plex Mono, monospace' }}>Platform Distribution</p>
        <div className="space-y-2">
          {RTMP_PLATFORMS.map((p, i) => {
            const pct = Math.floor(Math.random() * 40 + 5);
            return (
              <div key={p} className="flex items-center gap-2">
                <span className="w-14 text-[9px]" style={{ color: platColors[i] }}>{p}</span>
                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: platColors[i] }} />
                </div>
                <span className="text-[9px] w-8 text-right" style={{ color: 'rgba(245,230,211,0.4)', fontFamily: 'IBM Plex Mono, monospace' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── TAB 3: CONTENT ── */
function ContentTab({ user }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [showCreate, setShowCreate] = useState(false);
  const [editVod, setEditVod] = useState(null);
  const [form, setForm] = useState({ title: '', video_url: '', description: '', category: 'other', status: 'draft', tags: '' });

  const { data: vods = [] } = useQuery({
    queryKey: ['dash-vods', user?.id],
    queryFn: () => base44.entities.VODVideo.filter({ creator_id: user.id }, '-created_date', 50),
    enabled: !!user?.id,
  });
  const { data: highlights = [] } = useQuery({
    queryKey: ['dash-highlights', user?.id],
    queryFn: () => base44.entities.StreamHighlight.filter({ creator_id: user.id }, '-created_date', 10),
    enabled: !!user?.id,
  });

  const createMut = useMutation({
    mutationFn: () => base44.entities.VODVideo.create({ ...form, creator_id: user.id, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }),
    onSuccess: () => { qc.invalidateQueries(['dash-vods', user?.id]); setShowCreate(false); toast.success('VOD created'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VODVideo.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['dash-vods', user?.id]); setEditVod(null); toast.success('VOD updated'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.VODVideo.delete(id),
    onSuccess: () => { qc.invalidateQueries(['dash-vods', user?.id]); toast.success('Deleted'); },
  });

  let filtered = vods.filter(v => {
    if (filter === 'published') return v.status === 'published';
    if (filter === 'draft') return v.status === 'draft';
    if (filter === 'clips') return v.is_clipped;
    return true;
  });
  if (sort === 'views') filtered = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0));
  if (sort === 'longest') filtered = [...filtered].sort((a, b) => (b.duration_seconds || 0) - (a.duration_seconds || 0));

  const statusColors = { published: '#00FF88', draft: 'rgba(255,255,255,0.3)', unlisted: G };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 flex-wrap">
          {['all','published','draft','clips'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-lg text-[9px] font-black uppercase"
              style={{ background: filter === f ? `${G}20` : 'rgba(255,255,255,0.04)', color: filter === f ? G : 'rgba(255,255,255,0.4)', border: filter === f ? `1px solid ${G}40` : '1px solid rgba(255,255,255,0.08)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select value={sort} onChange={e => setSort(e.target.value)} className="h-7 px-2 rounded text-[9px]"
            style={{ background: OB2, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
            <option value="newest">Newest</option>
            <option value="views">Most Viewed</option>
            <option value="longest">Longest</option>
          </select>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase"
            style={{ background: B, color: G, border: `1px solid ${G}40`, fontFamily: 'Barlow Condensed, sans-serif' }}>
            <Plus className="w-3 h-3" /> Upload
          </button>
        </div>
      </div>

      {(showCreate || editVod) && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: OB2, border: `1px solid ${G}25` }}>
          <h4 className="font-black uppercase text-[11px]" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>{editVod ? 'Edit VOD' : 'New VOD'}</h4>
          {['title','video_url','description'].map(field => (
            <div key={field}>
              <label className="text-[8px] uppercase tracking-widest" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>{field.replace('_',' ')}</label>
              <input value={editVod ? (editVod[field] || '') : form[field]}
                onChange={e => editVod ? setEditVod(v => ({ ...v, [field]: e.target.value })) : setForm(f => ({ ...f, [field]: e.target.value }))}
                className="mt-0.5 w-full h-8 px-2 rounded text-[11px]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM, outline: 'none' }} />
            </div>
          ))}
          <div className="flex gap-2">
            <select value={editVod ? editVod.status : form.status}
              onChange={e => editVod ? setEditVod(v => ({ ...v, status: e.target.value })) : setForm(f => ({ ...f, status: e.target.value }))}
              className="flex-1 h-8 px-2 rounded text-[10px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM }}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="unlisted">Unlisted</option>
            </select>
            <button onClick={() => editVod ? updateMut.mutate({ id: editVod.id, data: editVod }) : createMut.mutate()}
              className="px-4 h-8 rounded-lg font-black uppercase text-[9px]"
              style={{ background: G, color: OB, fontFamily: 'Barlow Condensed, sans-serif' }}>
              {editVod ? 'Save' : 'Create'}
            </button>
            <button onClick={() => { setShowCreate(false); setEditVod(null); }}
              className="px-3 h-8 rounded-lg font-black uppercase text-[9px]"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(v => (
          <div key={v.id} className="rounded-xl overflow-hidden" style={{ background: OB2, border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="aspect-video bg-black relative flex items-center justify-center" style={{ background: '#111' }}>
              {v.thumbnail_url ? <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" /> : <Film className="w-8 h-8 text-white/10" />}
              <span className="absolute top-2 right-2 text-[7px] font-black uppercase px-1.5 py-0.5 rounded"
                style={{ background: `${statusColors[v.status] || G}20`, color: statusColors[v.status] || G, border: `1px solid ${statusColors[v.status] || G}30`, fontFamily: 'Barlow Condensed, sans-serif' }}>
                {v.status}
              </span>
            </div>
            <div className="p-3">
              <h4 className="text-[11px] font-bold truncate" style={{ color: CREAM }}>{v.title}</h4>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[8px]" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>
                  {(v.views || 0).toLocaleString()} views · {Math.floor((v.duration_seconds || 0) / 60)}m
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setEditVod(v)} className="text-[8px] px-2 py-0.5 rounded"
                    style={{ background: `${G}12`, color: G, border: `1px solid ${G}25` }}>Edit</button>
                  <button onClick={() => deleteMut.mutate(v.id)} className="text-[8px] px-2 py-0.5 rounded"
                    style={{ background: 'rgba(255,68,68,0.1)', color: '#FF4444', border: '1px solid rgba(255,68,68,0.2)' }}>Del</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-3 text-center py-10 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No videos</p>}
      </div>

      {highlights.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-2 font-bold" style={{ color: 'rgba(245,230,211,0.35)', fontFamily: 'IBM Plex Mono, monospace' }}>AI Highlights</p>
          <div className="space-y-2">
            {highlights.map(h => (
              <div key={h.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: OB2, border: '1px solid rgba(255,255,255,0.06)' }}>
                <Play className="w-4 h-4" style={{ color: G }} />
                <div className="flex-1">
                  <span className="text-[10px] font-bold" style={{ color: CREAM }}>{h.highlight_type}</span>
                  <span className="text-[8px] ml-2" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>@{h.start_time}s · {Math.round((h.ai_confidence || 0) * 100)}% conf</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── TAB 4: COMMUNITY ── */
function CommunityTab({ user }) {
  const qc = useQueryClient();
  const [selCommunity, setSelCommunity] = useState(null);
  const [showPoll, setShowPoll] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [pollForm, setPollForm] = useState({ question: '', options: ['', ''], ends_at: '', allow_multiple: false });
  const [challengeForm, setChallengeForm] = useState({ title: '', description: '', type: 'engagement', goal_value: 100, reward_type: 'badge', start_date: '', end_date: '' });

  const { data: communities = [] } = useQuery({
    queryKey: ['dash-communities', user?.id],
    queryFn: () => base44.entities.Community.filter({ owner_id: user.id }),
    enabled: !!user?.id,
  });
  const communityId = selCommunity || communities[0]?.id;

  const { data: polls = [] } = useQuery({
    queryKey: ['dash-polls', communityId],
    queryFn: () => base44.entities.Poll.filter({ community_id: communityId }),
    enabled: !!communityId,
  });
  const { data: challenges = [] } = useQuery({
    queryKey: ['dash-challenges', communityId],
    queryFn: () => base44.entities.Challenge.filter({ community_id: communityId }),
    enabled: !!communityId,
  });

  useEffect(() => { if (communities.length > 0 && !selCommunity) setSelCommunity(communities[0].id); }, [communities]);

  const createPoll = useMutation({
    mutationFn: () => base44.entities.Poll.create({
      community_id: communityId,
      creator_id: user.id,
      question: pollForm.question,
      options: pollForm.options.filter(Boolean).map(o => ({ text: o, votes: 0 })),
      total_votes: 0,
      status: 'active',
      ends_at: pollForm.ends_at,
      allow_multiple: pollForm.allow_multiple,
    }),
    onSuccess: () => { qc.invalidateQueries(['dash-polls', communityId]); setShowPoll(false); toast.success('Poll created!'); },
  });
  const endPoll = useMutation({
    mutationFn: (id) => base44.entities.Poll.update(id, { status: 'ended' }),
    onSuccess: () => qc.invalidateQueries(['dash-polls', communityId]),
  });
  const createChallenge = useMutation({
    mutationFn: () => base44.entities.Challenge.create({ ...challengeForm, community_id: communityId, creator_id: user.id, status: 'active', participant_count: 0 }),
    onSuccess: () => { qc.invalidateQueries(['dash-challenges', communityId]); setShowChallenge(false); toast.success('Challenge created!'); },
  });

  return (
    <div className="space-y-5">
      {communities.length > 1 && (
        <select value={selCommunity || ''} onChange={e => setSelCommunity(e.target.value)}
          className="h-9 px-3 rounded-xl text-[11px] w-full max-w-xs"
          style={{ background: OB2, border: `1px solid ${G}25`, color: CREAM }}>
          {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      {/* Polls */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'rgba(245,230,211,0.4)', fontFamily: 'IBM Plex Mono, monospace' }}>Active Polls</span>
          <button onClick={() => setShowPoll(true)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] font-black uppercase"
            style={{ background: `${G}15`, color: G, border: `1px solid ${G}30`, fontFamily: 'Barlow Condensed, sans-serif' }}>
            <Plus className="w-3 h-3" /> Poll
          </button>
        </div>

        {showPoll && (
          <div className="rounded-xl p-3 space-y-2 mb-3" style={{ background: OB2, border: `1px solid ${G}25` }}>
            <input placeholder="Question" value={pollForm.question} onChange={e => setPollForm(f => ({ ...f, question: e.target.value }))}
              className="w-full h-8 px-2 rounded text-[10px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM, outline: 'none' }} />
            {pollForm.options.map((o, i) => (
              <input key={i} placeholder={`Option ${i + 1}`} value={o} onChange={e => { const opts = [...pollForm.options]; opts[i] = e.target.value; setPollForm(f => ({ ...f, options: opts })); }}
                className="w-full h-8 px-2 rounded text-[10px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM, outline: 'none' }} />
            ))}
            {pollForm.options.length < 6 && (
              <button onClick={() => setPollForm(f => ({ ...f, options: [...f.options, ''] }))}
                className="text-[9px]" style={{ color: G }}>+ Add option</button>
            )}
            <input type="datetime-local" value={pollForm.ends_at} onChange={e => setPollForm(f => ({ ...f, ends_at: e.target.value }))}
              className="w-full h-8 px-2 rounded text-[10px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM, outline: 'none' }} />
            <div className="flex gap-2">
              <button onClick={() => createPoll.mutate()} className="px-4 h-8 rounded font-black uppercase text-[9px]"
                style={{ background: G, color: OB, fontFamily: 'Barlow Condensed, sans-serif' }}>Create</button>
              <button onClick={() => setShowPoll(false)} className="px-3 h-8 rounded text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Cancel</button>
            </div>
          </div>
        )}

        {polls.map(poll => {
          const total = poll.total_votes || 1;
          return (
            <div key={poll.id} className="rounded-xl p-3 space-y-2 mb-2" style={{ background: OB2, border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-start justify-between">
                <p className="text-[12px] font-bold" style={{ color: CREAM }}>{poll.question}</p>
                <div className="flex gap-1">
                  {poll.status === 'active' && (
                    <button onClick={() => endPoll.mutate(poll.id)}
                      className="text-[7px] px-1.5 py-0.5 rounded font-black uppercase"
                      style={{ background: 'rgba(255,68,68,0.1)', color: '#FF4444', border: '1px solid rgba(255,68,68,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>End</button>
                  )}
                </div>
              </div>
              {(poll.options || []).map((opt, i) => {
                const pct = Math.round(((opt.votes || 0) / total) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-[9px] mb-0.5">
                      <span style={{ color: CREAM }}>{opt.text}</span>
                      <span style={{ color: G, fontFamily: 'IBM Plex Mono, monospace' }}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: G }} />
                    </div>
                  </div>
                );
              })}
              <p className="text-[8px]" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>{poll.total_votes || 0} votes</p>
            </div>
          );
        })}
      </div>

      {/* Challenges */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'rgba(245,230,211,0.4)', fontFamily: 'IBM Plex Mono, monospace' }}>Challenges</span>
          <button onClick={() => setShowChallenge(true)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] font-black uppercase"
            style={{ background: `rgba(139,92,246,0.15)`, color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <Plus className="w-3 h-3" /> Challenge
          </button>
        </div>

        {showChallenge && (
          <div className="rounded-xl p-3 space-y-2 mb-3" style={{ background: OB2, border: '1px solid rgba(139,92,246,0.25)' }}>
            {['title','description'].map(f => (
              <input key={f} placeholder={f} value={challengeForm[f]} onChange={e => setChallengeForm(cf => ({ ...cf, [f]: e.target.value }))}
                className="w-full h-8 px-2 rounded text-[10px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM, outline: 'none' }} />
            ))}
            <div className="flex gap-2">
              <button onClick={() => createChallenge.mutate()} className="px-4 h-8 rounded font-black uppercase text-[9px]"
                style={{ background: '#8B5CF6', color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>Create</button>
              <button onClick={() => setShowChallenge(false)} className="px-3 h-8 rounded text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Cancel</button>
            </div>
          </div>
        )}

        {challenges.map(ch => {
          const pct = Math.min(100, Math.round(((ch.participant_count || 0) / (ch.goal_value || 100)) * 100));
          return (
            <div key={ch.id} className="rounded-xl p-3 space-y-2 mb-2" style={{ background: OB2, border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold" style={{ color: CREAM }}>{ch.title}</p>
                <span className="text-[7px] px-1.5 py-0.5 rounded font-black uppercase"
                  style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {ch.type}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #8B5CF6, #00F5FF)' }} />
              </div>
              <p className="text-[8px]" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>{ch.participant_count || 0} / {ch.goal_value || 100} · {pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── TAB 5: MONETIZE ── */
function MonetizeTab({ user }) {
  const { data: tiers = [] } = useQuery({
    queryKey: ['dash-tiers', user?.id],
    queryFn: () => base44.entities.SubscriptionTier.filter({ creator_id: user.id }),
    enabled: !!user?.id,
  });
  const { data: payout } = useQuery({
    queryKey: ['dash-payout', user?.id],
    queryFn: () => base44.entities.CreatorPayout.filter({ creator_id: user.id }).then(r => r[0]),
    enabled: !!user?.id,
  });
  const { data: txns = [] } = useQuery({
    queryKey: ['dash-txns-7', user?.id],
    queryFn: () => base44.entities.Transaction.filter({ to_user_id: user.id }, '-created_date', 200),
    enabled: !!user?.id,
  });
  const { data: goals = [] } = useQuery({
    queryKey: ['dash-goals', user?.id],
    queryFn: () => base44.entities.StreamerGoal.filter({ creator_id: user.id }),
    enabled: !!user?.id,
  });
  const qc = useQueryClient();

  const tipTotal = txns.filter(t => t.type === 'tip' || t.type === 'super_chat').reduce((s, t) => s + (t.amount || 0), 0);
  const subTotal = txns.filter(t => t.type === 'subscription').reduce((s, t) => s + (t.amount || 0), 0);
  const giftTotal = txns.filter(t => t.type === 'virtual_good').reduce((s, t) => s + (t.amount || 0), 0);
  const pieData = [
    { name: 'Tips', value: Math.round(tipTotal * 100) / 100, color: G },
    { name: 'Subs', value: Math.round(subTotal * 100) / 100, color: '#00F5FF' },
    { name: 'Gifts', value: Math.round(giftTotal * 100) / 100, color: '#8B5CF6' },
  ].filter(d => d.value > 0);
  const totalRev = tipTotal + subTotal + giftTotal;
  const creatorCut = Math.round(totalRev * 0.9 * 100) / 100;
  const platformCut = Math.round(totalRev * 0.1 * 100) / 100;

  return (
    <div className="space-y-5">
      {/* Payout status */}
      <div className="rounded-xl p-4" style={{ background: OB2, border: `1px solid ${G}20` }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'rgba(245,230,211,0.4)', fontFamily: 'IBM Plex Mono, monospace' }}>Payout Account</span>
          {payout?.stripe_connected
            ? <span className="text-[8px] px-2 py-0.5 rounded-full font-black" style={{ background: 'rgba(0,255,136,0.12)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }}>✓ STRIPE CONNECTED</span>
            : <Link to="/Payouts"><span className="text-[8px] px-2 py-0.5 rounded-full font-black" style={{ background: 'rgba(255,50,50,0.15)', color: '#FF6680', border: '1px solid rgba(255,50,50,0.3)', cursor: 'pointer' }}>⚠ SETUP STRIPE</span></Link>
          }
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Pending" value={`$${Math.floor((payout?.pending_balance || 0) * 100) / 100}`} color="#00FF88" icon={DollarSign} />
          <Stat label="Total Paid Out" value={`$${Math.floor((payout?.total_paid_out || 0) * 100) / 100}`} color={G} icon={CreditCard} />
        </div>
      </div>

      {/* 90/10 split */}
      <div className="rounded-xl p-4" style={{ background: OB2, border: `1px solid rgba(255,255,255,0.07)` }}>
        <p className="text-[9px] uppercase tracking-widest mb-2 font-bold" style={{ color: 'rgba(245,230,211,0.4)', fontFamily: 'IBM Plex Mono, monospace' }}>Revenue Split</p>
        <div className="h-8 rounded-xl overflow-hidden flex mb-2">
          <motion.div animate={{ width: '90%' }} style={{ background: `linear-gradient(90deg, ${B}, ${G})` }} className="h-full flex items-center justify-center">
            <span className="text-[10px] font-black" style={{ color: OB, fontFamily: 'Barlow Condensed, sans-serif' }}>You 90% — ${creatorCut}</span>
          </motion.div>
          <motion.div animate={{ width: '10%' }} style={{ background: 'rgba(255,255,255,0.1)' }} className="h-full flex items-center justify-center">
            <span className="text-[8px] font-black text-white/40">10%</span>
          </motion.div>
        </div>
      </div>

      {/* Revenue pie */}
      {pieData.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: OB2, border: `1px solid rgba(255,255,255,0.07)` }}>
          <p className="text-[9px] uppercase tracking-widest mb-3 font-bold" style={{ color: 'rgba(245,230,211,0.4)', fontFamily: 'IBM Plex Mono, monospace' }}>Revenue Breakdown</p>
          <div className="flex items-center gap-4">
            <PieChart width={100} height={100}>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={46}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
            <div className="space-y-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-[9px]" style={{ color: 'rgba(245,230,211,0.6)' }}>{d.name}</span>
                  <span className="text-[9px] font-black" style={{ color: d.color, fontFamily: 'IBM Plex Mono, monospace' }}>${d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subscription tiers */}
      <div>
        <p className="text-[9px] uppercase tracking-widest mb-2 font-bold" style={{ color: 'rgba(245,230,211,0.4)', fontFamily: 'IBM Plex Mono, monospace' }}>Subscription Tiers</p>
        {tiers.length === 0 && <p className="text-[11px] text-center py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>No tiers. Create at <Link to="/CreatorSubscriptions" className="underline" style={{ color: G }}>Subscriptions</Link></p>}
        {tiers.map(tier => (
          <div key={tier.id} className="flex items-center justify-between px-3 py-2 rounded-lg mb-1" style={{ background: OB2, border: `1px solid ${tier.color || G}22` }}>
            <div>
              <p className="text-[11px] font-bold" style={{ color: CREAM }}>{tier.name}</p>
              <p className="text-[8px]" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>${tier.price}/mo · {tier.subscriber_count || 0} subs</p>
            </div>
            <span className="text-[8px] px-1.5 py-0.5 rounded font-black" style={{ background: tier.is_active ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.06)', color: tier.is_active ? '#00FF88' : 'rgba(255,255,255,0.3)' }}>
              {tier.is_active ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>
        ))}
      </div>

      {/* Streamer goals */}
      <div>
        <p className="text-[9px] uppercase tracking-widest mb-2 font-bold" style={{ color: 'rgba(245,230,211,0.4)', fontFamily: 'IBM Plex Mono, monospace' }}>Streamer Goals</p>
        {goals.map(goal => {
          const pct = Math.min(100, Math.round(((goal.current_amount || 0) / (goal.target_amount || 1)) * 100));
          return (
            <div key={goal.id} className="rounded-xl p-3 mb-2" style={{ background: OB2, border: `1px solid ${goal.color || G}22` }}>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-bold" style={{ color: CREAM }}>{goal.title}</span>
                <span className="text-[9px] font-black" style={{ color: goal.color || G, fontFamily: 'IBM Plex Mono, monospace' }}>{goal.current_amount || 0}/{goal.target_amount}</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                  className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${B}, ${goal.color || G})` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── TAB 6: SETTINGS ── */
function SettingsTab({ user }) {
  const qc = useQueryClient();
  const [profile, setProfile] = useState({ display_name: '', bio: '', avatar_url: '', category: 'other', social_links: {} });
  const [schedule, setSchedule] = useState([]);
  const [notifPrefs, setNotifPrefs] = useState({ tip_alerts: true, new_subscriber: true, raid_received: true, challenge_completed: true });
  const [destinations, setDestinations] = useState([]);
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const { data: cpData } = useQuery({
    queryKey: ['settings-cp', user?.id],
    queryFn: () => base44.entities.CreatorProfile.filter({ user_id: user.id }).then(r => r[0]),
    enabled: !!user?.id,
  });
  const { data: prefData } = useQuery({
    queryKey: ['settings-prefs', user?.id],
    queryFn: () => base44.entities.UserPreference.filter({ user_id: user.id }).then(r => r[0]),
    enabled: !!user?.id,
  });
  const { data: rtmpDests = [] } = useQuery({
    queryKey: ['settings-rtmp', user?.id],
    queryFn: () => base44.entities.RTMPDestination.filter({ creator_id: user.id }),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (cpData) {
      setProfile({ display_name: cpData.display_name || '', bio: cpData.bio || '', avatar_url: cpData.avatar_url || '', category: cpData.category || 'other', social_links: cpData.social_links || {} });
      setSchedule(cpData.stream_schedule || []);
    }
  }, [cpData]);
  useEffect(() => {
    if (prefData?.notification_preferences) setNotifPrefs(prefData.notification_preferences);
  }, [prefData]);
  useEffect(() => { setDestinations(rtmpDests); }, [rtmpDests]);

  const saveProfile = useMutation({
    mutationFn: () => cpData?.id
      ? base44.entities.CreatorProfile.update(cpData.id, { ...profile, stream_schedule: schedule })
      : base44.entities.CreatorProfile.create({ user_id: user.id, ...profile, stream_schedule: schedule }),
    onSuccess: () => { qc.invalidateQueries(['settings-cp', user?.id]); toast.success('Profile saved!'); },
  });
  const savePrefs = useMutation({
    mutationFn: () => prefData?.id
      ? base44.entities.UserPreference.update(prefData.id, { notification_preferences: notifPrefs })
      : base44.entities.UserPreference.create({ user_id: user.id, notification_preferences: notifPrefs }),
    onSuccess: () => toast.success('Preferences saved!'),
  });
  const deleteRTMP = useMutation({
    mutationFn: (id) => base44.entities.RTMPDestination.delete(id),
    onSuccess: () => qc.invalidateQueries(['settings-rtmp', user?.id]),
  });
  const toggleRTMP = useMutation({
    mutationFn: ({ id, val }) => base44.entities.RTMPDestination.update(id, { is_enabled: val }),
    onSuccess: () => qc.invalidateQueries(['settings-rtmp', user?.id]),
  });
  const addRTMP = useMutation({
    mutationFn: () => base44.entities.RTMPDestination.create({ creator_id: user.id, label: 'New Destination', platform: 'custom', status: 'offline', is_enabled: true, bitrate_kbps: 4000 }),
    onSuccess: () => qc.invalidateQueries(['settings-rtmp', user?.id]),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <section>
        <p className="text-[9px] uppercase tracking-widest mb-3 font-bold" style={{ color: G, fontFamily: 'IBM Plex Mono, monospace' }}>Profile</p>
        <div className="space-y-2">
          {[['display_name','Display Name'],['bio','Bio'],['avatar_url','Avatar URL']].map(([k,l]) => (
            <div key={k}>
              <label className="text-[8px] uppercase tracking-wide" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>{l}</label>
              {k === 'bio'
                ? <textarea value={profile[k]} onChange={e => setProfile(p => ({ ...p, [k]: e.target.value }))} rows={2}
                    className="mt-0.5 w-full px-2 py-1.5 rounded text-[10px] resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM, outline: 'none' }} />
                : <input value={profile[k]} onChange={e => setProfile(p => ({ ...p, [k]: e.target.value }))}
                    className="mt-0.5 w-full h-8 px-2 rounded text-[10px]"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM, outline: 'none' }} />
              }
            </div>
          ))}
          {/* Social links */}
          <p className="text-[8px] uppercase tracking-wide mt-2" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>Social Links</p>
          <div className="grid grid-cols-2 gap-2">
            {['twitter','instagram','tiktok','youtube','discord','website'].map(s => (
              <input key={s} placeholder={s} value={profile.social_links[s] || ''}
                onChange={e => setProfile(p => ({ ...p, social_links: { ...p.social_links, [s]: e.target.value } }))}
                className="h-7 px-2 rounded text-[9px]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM, outline: 'none' }} />
            ))}
          </div>
          <button onClick={() => saveProfile.mutate()} className="mt-1 px-5 h-8 rounded-xl font-black uppercase text-[9px]"
            style={{ background: B, color: G, border: `1px solid ${G}40`, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Save Profile
          </button>
        </div>
      </section>

      {/* Stream schedule */}
      <section>
        <p className="text-[9px] uppercase tracking-widest mb-3 font-bold" style={{ color: G, fontFamily: 'IBM Plex Mono, monospace' }}>Stream Schedule</p>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day, i) => {
            const slot = schedule.find(s => s.day === day) || null;
            return (
              <div key={day} className="rounded-lg p-1.5 text-center" style={{ background: slot ? `${G}12` : 'rgba(255,255,255,0.03)', border: slot ? `1px solid ${G}30` : '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[7px] font-black uppercase" style={{ color: slot ? G : 'rgba(255,255,255,0.2)' }}>{day}</p>
                {slot && <p className="text-[6px] mt-0.5" style={{ color: 'rgba(245,230,211,0.5)' }}>{slot.time}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Notifications */}
      <section>
        <p className="text-[9px] uppercase tracking-widest mb-3 font-bold" style={{ color: G, fontFamily: 'IBM Plex Mono, monospace' }}>Notifications</p>
        <div className="space-y-2">
          {Object.entries(notifPrefs).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: OB2, border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-[10px]" style={{ color: CREAM }}>{k.replace(/_/g, ' ')}</span>
              <button onClick={() => { const n = { ...notifPrefs, [k]: !v }; setNotifPrefs(n); savePrefs.mutate(); }}
                className="w-10 h-5 rounded-full relative"
                style={{ background: v ? G : 'rgba(255,255,255,0.1)' }}>
                <motion.div animate={{ x: v ? 20 : 2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute top-0.5 w-4 h-4 rounded-full"
                  style={{ background: v ? OB : 'rgba(255,255,255,0.4)' }} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* RTMP Destinations */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: G, fontFamily: 'IBM Plex Mono, monospace' }}>RTMP Destinations</p>
          <button onClick={() => addRTMP.mutate()} className="flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] font-black uppercase"
            style={{ background: `${G}15`, color: G, border: `1px solid ${G}30`, fontFamily: 'Barlow Condensed, sans-serif' }}>
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        {rtmpDests.map(d => (
          <div key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1" style={{ background: OB2, border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex-1">
              <p className="text-[10px] font-bold" style={{ color: CREAM }}>{d.label}</p>
              <p className="text-[8px]" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>{d.platform} · {d.bitrate_kbps}kbps</p>
            </div>
            <button onClick={() => toggleRTMP.mutate({ id: d.id, val: !d.is_enabled })}
              className="w-8 h-4 rounded-full relative"
              style={{ background: d.is_enabled ? G : 'rgba(255,255,255,0.1)' }}>
              <motion.div animate={{ x: d.is_enabled ? 16 : 2 }} className="absolute top-0.5 w-3 h-3 rounded-full"
                style={{ background: d.is_enabled ? OB : 'rgba(255,255,255,0.4)' }} />
            </button>
            <button onClick={() => deleteRTMP.mutate(d.id)} className="text-[8px]" style={{ color: '#FF4444' }}>✕</button>
          </div>
        ))}
        <Link to="/OverlayEditor">
          <button className="mt-3 w-full py-2 rounded-xl text-[10px] font-black uppercase"
            style={{ background: `rgba(139,92,246,0.1)`, color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            🎨 Open Overlay Builder →
          </button>
        </Link>
      </section>
    </div>
  );
}

/* ── MAIN ── */
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  return (
    <div className="min-h-screen" style={{ background: OB, fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Header */}
      <div style={{ background: OB2, borderBottom: `1px solid ${G}18` }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                Creator Dashboard
              </h1>
              <p className="text-[10px]" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>
                {user?.full_name || user?.email}
              </p>
            </div>
            <Link to="/LiveRoom">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase text-[11px]"
                style={{ background: B, color: G, border: `1px solid ${G}40`, boxShadow: `0 0 20px rgba(128,0,32,0.3)`, fontFamily: 'Barlow Condensed, sans-serif' }}>
                <Radio className="w-4 h-4" /> GO LIVE
              </button>
            </Link>
          </div>

          <div className="flex overflow-x-auto scrollbar-hide gap-0.5">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-4 py-2 shrink-0 border-b-2 transition-all"
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 'bold',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: active ? G : 'rgba(245,230,211,0.3)',
                    borderBottomColor: active ? G : 'transparent',
                    background: active ? `${G}08` : 'transparent',
                  }}>
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {activeTab === 'overview'   && <OverviewTab user={user} />}
            {activeTab === 'analytics' && <AnalyticsTab user={user} />}
            {activeTab === 'content'   && <ContentTab user={user} />}
            {activeTab === 'community' && <CommunityTab user={user} />}
            {activeTab === 'monetize'  && <MonetizeTab user={user} />}
            {activeTab === 'settings'  && <SettingsTab user={user} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}