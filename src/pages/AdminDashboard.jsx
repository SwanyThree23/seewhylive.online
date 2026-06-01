import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Radio, DollarSign, MessageSquare, Shield, TrendingUp,
  Activity, Crown, AlertTriangle, CheckCircle, RefreshCw,
  Search, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const CHART_THEME = {
  cartesian: { stroke: 'rgba(255,255,255,0.06)' },
  tick: { fill: 'rgba(255,255,255,0.35)', fontSize: 10 },
  tooltip: { contentStyle: { background: 'rgba(13,6,24,0.97)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12 }, cursor: { fill: 'rgba(212,175,55,0.06)' } },
};

function StatCard({ label, value, icon: Icon, color, badge, sub }) {
  return (
    <div style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)', borderRadius: 14, padding: '14px 16px', position: 'relative' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>{label}</p>
          <p className="text-2xl font-black" style={{ color: '#fff', fontFamily: 'Orbitron, monospace' }}>{value}</p>
          {sub && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: color }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      {badge && <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase mt-1 inline-block" style={{ background: 'rgba(255,21,100,0.15)', border: '1px solid rgba(255,21,100,0.3)', color: '#FF1564', ...T }}>{badge}</span>}
    </div>
  );
}

function DarkCard({ title, children }) {
  return (
    <div style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 20 }}>
      {title && <p className="font-black text-sm text-white mb-4" style={T}>{title}</p>}
      {children}
    </div>
  );
}

const BG2 = 'rgba(13,6,24,0.9)';
const TABS = ['overview', 'users', 'rooms', 'reports', 'revenue', 'security', 'audit'];

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [bannedIPs, setBannedIPs] = useState([]);
  const [newBanIP, setNewBanIP] = useState('');
  const [banReason, setBanReason] = useState('');
  const [suspensions, setSuspensions] = useState([]);
  const [suspendUser, setSuspendUser] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('24h');
  const [auditLog, setAuditLog] = useState([
    { icon: '🛡️', action: 'Guardian AI enabled for all rooms', time: 'Jun 1, 7:00 PM', color: '#00FF88', severity: 'info' },
    { icon: '📋', action: 'Reports dashboard accessed', time: 'Jun 1, 6:45 PM', color: '#D4AF37', severity: 'low' },
    { icon: '⚙️', action: 'Rate limits verified — all healthy', time: 'Jun 1, 6:30 PM', color: '#00C8C8', severity: 'info' },
  ]);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({ queryKey: ['adminUsers'], queryFn: () => base44.entities.User.list('-created_date', 200), enabled: user?.role === 'admin' });
  const { data: allRooms = [] } = useQuery({ queryKey: ['adminRooms'], queryFn: () => base44.entities.Room.list('-created_date', 100), enabled: user?.role === 'admin' });
  const { data: transactions = [] } = useQuery({ queryKey: ['adminTransactions'], queryFn: () => base44.entities.Transaction.list('-created_date', 200), enabled: user?.role === 'admin' });
  const { data: reports = [] } = useQuery({ queryKey: ['adminReports'], queryFn: () => base44.entities.Report.list('-created_date', 50), enabled: user?.role === 'admin' });
  const { data: messages = [] } = useQuery({ queryKey: ['adminMessages'], queryFn: () => base44.entities.Message.list('-created_date', 500), enabled: user?.role === 'admin' });
  const { data: communities = [] } = useQuery({ queryKey: ['adminCommunities'], queryFn: () => base44.entities.Community.list('-member_count', 50), enabled: user?.role === 'admin' });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => base44.entities.User.update(userId, { role }),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries(['adminUsers']); },
  });
  const endRoomMutation = useMutation({
    mutationFn: (roomId) => base44.entities.Room.update(roomId, { status: 'ended', ended_at: new Date().toISOString() }),
    onSuccess: () => { toast.success('Room ended'); qc.invalidateQueries(['adminRooms']); },
  });

  if (!user || user.role !== 'admin') return (
    <div className="min-h-screen flex items-center justify-center text-center" style={{ background: BG }}>
      <div>
        <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: '#FF1564' }} />
        <h2 className="text-2xl font-black mb-2 text-white" style={T}>Admin Access Required</h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>You don't have permission to view this page.</p>
      </div>
    </div>
  );

  const totalRevenue = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  const liveRooms = allRooms.filter(r => r.status === 'live');
  const pendingReports = reports.filter(r => r.status === 'pending');
  const todayUsers = allUsers.filter(u => new Date(u.created_date).toDateString() === new Date().toDateString());

  const userGrowthData = Object.entries(allUsers.reduce((acc, u) => {
    const m = new Date(u.created_date).toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[m] = (acc[m] || 0) + 1; return acc;
  }, {})).slice(-8).map(([month, count]) => ({ month, count }));

  const revenueChartData = Object.entries(transactions.reduce((acc, t) => {
    const m = new Date(t.created_date).toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[m] = (acc[m] || 0) + (t.amount || 0); return acc;
  }, {})).slice(-8).map(([month, revenue]) => ({ month, revenue }));

  const filteredUsers = allUsers.filter(u => !userSearch || u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()));
  const filteredRooms = roomFilter === 'all' ? allRooms : allRooms.filter(r => r.status === roomFilter);

  const roomStatusStyle = (status) => ({
    live:      { bg: 'rgba(255,21,100,0.12)', border: 'rgba(255,21,100,0.35)', color: '#FF1564' },
    scheduled: { bg: 'rgba(0,212,255,0.1)',   border: 'rgba(0,212,255,0.3)',   color: '#00d4ff' },
    ended:     { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' },
  })[status] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' };

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 border-b" style={{ background: 'rgba(8,11,24,0.97)', borderColor: 'rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" style={{ color: '#FF1564' }} />
              <div>
                <h1 className="text-xl font-black text-white leading-none" style={T}>Admin Dashboard</h1>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Platform management & oversight</p>
              </div>
            </div>
            <button onClick={() => qc.invalidateQueries()} className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-black uppercase text-[10px]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', ...T }}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          {/* Tab bar */}
          <div className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all capitalize"
                style={{ ...T, color: activeTab === tab ? GOLD : 'rgba(255,255,255,0.35)', borderBottomColor: activeTab === tab ? GOLD : 'transparent', background: activeTab === tab ? 'rgba(212,175,55,0.05)' : 'transparent' }}>
                {tab === 'users' ? `Users (${allUsers.length})` : tab === 'rooms' ? `Rooms (${allRooms.length})` : tab === 'reports' ? `Reports (${pendingReports.length})` : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 space-y-6">
        {/* KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Users" value={allUsers.length} icon={Users} color="rgba(99,102,241,0.8)" sub={`+${todayUsers.length} today`} />
          <StatCard label="Live Rooms" value={liveRooms.length} icon={Radio} color="rgba(255,21,100,0.7)" badge={liveRooms.length > 0 ? 'LIVE' : undefined} />
          <StatCard label="Total Rooms" value={allRooms.length} icon={Globe} color="rgba(139,92,246,0.7)" />
          <StatCard label="Revenue" value={`$${totalRevenue.toFixed(0)}`} icon={DollarSign} color="rgba(0,255,136,0.6)" />
          <StatCard label="Messages" value={messages.length} icon={MessageSquare} color="rgba(212,175,55,0.6)" />
          <StatCard label="Open Reports" value={pendingReports.length} icon={AlertTriangle} color={pendingReports.length > 0 ? 'rgba(255,21,100,0.7)' : 'rgba(255,255,255,0.15)'} />
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DarkCard title="User Growth">
                {userGrowthData.length === 0
                  ? <p className="text-sm text-center py-8" style={{ color: 'rgba(255,255,255,0.25)' }}>No data yet</p>
                  : <ResponsiveContainer width="100%" height={200}><LineChart data={userGrowthData}><CartesianGrid strokeDasharray="3 3" {...CHART_THEME.cartesian} /><XAxis dataKey="month" tick={CHART_THEME.tick} /><YAxis tick={CHART_THEME.tick} /><Tooltip {...CHART_THEME.tooltip} /><Line type="monotone" dataKey="count" stroke={GOLD} strokeWidth={2} dot={{ r: 3, fill: GOLD }} /></LineChart></ResponsiveContainer>
                }
              </DarkCard>
              <DarkCard title="Platform Health">
                <div className="space-y-2">
                  {[
                    { label: 'Active Users', value: allUsers.length, Ico: Users, ok: true },
                    { label: 'Communities', value: communities.length, Ico: Globe, ok: true },
                    { label: 'Live Streams', value: liveRooms.length, Ico: Radio, ok: true },
                    { label: 'Pending Reports', value: pendingReports.length, Ico: AlertTriangle, ok: pendingReports.length === 0 },
                    { label: 'Total Transactions', value: transactions.length, Ico: DollarSign, ok: true },
                  ].map(({ label, value, Ico, ok }) => (
                    <div key={label} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)', ...T }}>
                        <Ico className="w-3.5 h-3.5" style={{ color: 'rgba(212,175,55,0.5)' }} />{label}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{value}</span>
                        {ok ? <CheckCircle className="w-3 h-3" style={{ color: '#00FF88' }} /> : <AlertTriangle className="w-3 h-3" style={{ color: '#FF1564' }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </DarkCard>
            </div>
            <DarkCard title="Recent Transactions">
              {transactions.length === 0
                ? <p className="text-sm text-center py-6" style={{ color: 'rgba(255,255,255,0.25)' }}>No transactions yet</p>
                : <div className="space-y-1 max-h-64 overflow-y-auto">
                    {transactions.slice(0, 15).map(t => (
                      <div key={t.id} className="flex items-center justify-between py-2 border-b text-sm" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <div>
                          <p className="font-black text-xs text-white" style={T}>{t.sender_name || 'Anonymous'} → {t.recipient_name || 'Creator'}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.type} · {format(new Date(t.created_date), 'MMM d, h:mm a')}</p>
                        </div>
                        <span className="font-black text-sm" style={{ color: '#00FF88', fontFamily: 'Orbitron, monospace' }}>+${(t.amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
              }
            </DarkCard>
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <input style={{ width: '100%', padding: '9px 12px 9px 38px', background: 'rgba(17,8,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif', boxSizing: 'border-box' }}
                  placeholder="Search users…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>{filteredUsers.length} users</span>
            </div>
            <DarkCard title="">
              {loadingUsers
                ? <p className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>Loading users…</p>
                : <div className="max-h-[600px] overflow-y-auto space-y-1">
                    {filteredUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0" style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})`, color: '#fff', ...T }}>
                            {u.full_name?.charAt(0) || u.email?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-black text-xs text-white" style={T}>{u.full_name || 'No name'}</p>
                            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{u.email} · {format(new Date(u.created_date), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase" style={{ ...T, background: u.role === 'admin' ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${u.role === 'admin' ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}`, color: u.role === 'admin' ? GOLD : 'rgba(255,255,255,0.4)' }}>{u.role}</span>
                          {u.id !== user?.id && (
                            <select style={{ background: 'rgba(17,8,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 10, padding: '3px 8px', outline: 'none', fontFamily: 'Barlow Condensed, sans-serif', cursor: 'pointer' }}
                              value={u.role} onChange={e => changeRoleMutation.mutate({ userId: u.id, role: e.target.value })}>
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </DarkCard>
          </div>
        )}

        {/* ROOMS */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <select style={{ padding: '9px 14px', background: 'rgba(17,8,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif', cursor: 'pointer' }}
                value={roomFilter} onChange={e => setRoomFilter(e.target.value)}>
                <option value="all">All Rooms</option>
                <option value="live">Live</option>
                <option value="scheduled">Scheduled</option>
                <option value="ended">Ended</option>
              </select>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>{filteredRooms.length} rooms</span>
            </div>
            <DarkCard title="">
              <div className="max-h-[600px] overflow-y-auto space-y-1">
                {filteredRooms.map(room => {
                  const ss = roomStatusStyle(room.status);
                  return (
                    <div key={room.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <p className="font-black text-xs text-white" style={T}>{room.title}</p>
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{room.type} · {room.viewer_count || 0} viewers · {format(new Date(room.created_date), 'MMM d')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase" style={{ ...T, background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color }}>{room.status}</span>
                        {room.status === 'live' && (
                          <button onClick={() => endRoomMutation.mutate(room.id)}
                            className="px-2.5 py-1 rounded-lg font-black uppercase text-[9px]"
                            style={{ background: 'rgba(255,21,100,0.12)', border: '1px solid rgba(255,21,100,0.3)', color: '#FF1564', cursor: 'pointer', ...T }}>
                            End
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DarkCard>
          </div>
        )}

        {/* REPORTS */}
        {activeTab === 'reports' && (
          reports.length === 0 ? (
            <DarkCard title="">
              <div className="text-center py-16">
                <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#00FF88' }} />
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>No reports to review</p>
              </div>
            </DarkCard>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <div key={report.id} className="rounded-2xl p-4" style={{ background: 'rgba(13,6,24,0.9)', border: `1px solid ${report.status === 'pending' ? 'rgba(255,136,0,0.25)' : 'rgba(212,175,55,0.1)'}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase" style={{ ...T, background: report.status === 'pending' ? 'rgba(255,136,0,0.12)' : 'rgba(0,255,136,0.1)', border: `1px solid ${report.status === 'pending' ? 'rgba(255,136,0,0.3)' : 'rgba(0,255,136,0.25)'}`, color: report.status === 'pending' ? '#ff8800' : '#00ff88' }}>{report.status}</span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase" style={{ ...T, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}>{report.report_type}</span>
                      </div>
                      <p className="text-sm text-white" style={T}>{report.description}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{format(new Date(report.created_date), 'MMM d, h:mm a')}</p>
                    </div>
                    {report.status === 'pending' && (
                      <button className="px-3 py-1.5 rounded-xl font-black uppercase text-[10px] shrink-0"
                        style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)', color: '#00ff88', cursor: 'pointer', ...T }}
                        onClick={async () => { await base44.entities.Report.update(report.id, { status: 'resolved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() }); qc.invalidateQueries(['adminReports']); toast.success('Report resolved'); }}>
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* REVENUE */}
        {activeTab === 'revenue' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DarkCard title="Monthly Revenue">
              {revenueChartData.length === 0
                ? <p className="text-sm text-center py-12" style={{ color: 'rgba(255,255,255,0.25)' }}>No revenue data</p>
                : <ResponsiveContainer width="100%" height={220}><BarChart data={revenueChartData}><CartesianGrid strokeDasharray="3 3" vertical={false} {...CHART_THEME.cartesian} /><XAxis dataKey="month" tick={CHART_THEME.tick} /><YAxis tick={CHART_THEME.tick} tickFormatter={v => `$${v}`} /><Tooltip {...CHART_THEME.tooltip} formatter={v => [`$${Number(v).toFixed(2)}`, 'Revenue']} /><Bar dataKey="revenue" fill="#00FF88" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
              }
            </DarkCard>
            <DarkCard title="Revenue Summary">
              <div className="space-y-3">
                <div className="p-5 rounded-xl text-center" style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)' }}>
                  <p className="text-3xl font-black" style={{ color: '#00FF88', fontFamily: 'Orbitron, monospace' }}>${totalRevenue.toFixed(2)}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(0,255,136,0.7)', ...T }}>Total Platform Revenue</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Transactions', value: transactions.length },
                    { label: 'Avg Transaction', value: `$${transactions.length > 0 ? (totalRevenue / transactions.length).toFixed(2) : '0.00'}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-xl font-black" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{value}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </DarkCard>
          </div>
        )}
      </div>
    </div>
  );
}
