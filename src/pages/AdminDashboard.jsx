import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReportsManager from '../components/admin/ReportsManager';
import ModerationActionModal from '../components/moderation/ModerationActionModal';
import AnnouncementScheduler from '../components/admin/AnnouncementScheduler';
import SpotlightBanner from '../components/community/SpotlightBanner';
import ChallengeAnalytics from '../components/admin/ChallengeAnalytics';
import ReferralConfig from '../components/admin/ReferralConfig';
import PayoutSummary from '../components/admin/PayoutSummary';
import GuestModerationLog from '../components/admin/GuestModerationLog';
import PerformanceDashboard from '../components/streaming/PerformanceDashboard';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import StreamHealthDashboard from '../components/streaming/StreamHealthDashboard';
import AnnouncementPanel from '../components/community/AnnouncementPanel';
import {
  Users, Radio, DollarSign, MessageSquare, Shield, AlertTriangle, CheckCircle, RefreshCw,
  Search, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import ShopDashboard from '../components/merch/ShopDashboard';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CreatorBridge from '../components/social/CreatorBridge';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import CollaborationMatcher from '../components/social/CollaborationMatcher';

var BG = '#080B18';
var GOLD = '#D4AF37';
var CRIMSON = '#800020';

var CHART_THEME = {
  cartesian: { stroke: 'rgba(255,255,255,0.06)' },
  tick: { fill: 'rgba(255,255,255,0.35)', fontSize: 10 },
  tooltip: { contentStyle: { background: 'rgba(8,11,24,0.97)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12 }, cursor: { fill: 'rgba(212,175,55,0.06)' } },
};

function StatCard({ label, value, icon: Icon, color, badge, sub }) {
  return (
    <div style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)', borderRadius: 14, padding: '14px 16px', position: 'relative' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</p>
          <p className="text-2xl font-black" style={{ color: '#fff', fontFamily: 'Orbitron, monospace' }}>{value}</p>
          {sub && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: color }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      {badge && <span className="text-[11px] font-black px-1.5 py-0.5 rounded uppercase mt-1 inline-block" style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif' }}>{badge}</span>}
    </div>
  );
}

function DarkCard({ title, children }) {
  return (
    <div style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 20 }}>
      {title && <p className="font-black text-sm text-white mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{title}</p>}
      {children}
    </div>
  );
}

var BG2 = 'rgba(8,11,24,0.9)';
var TABS = ['overview', 'users', 'rooms', 'reports', 'revenue', 'security', 'audit'];

export default function AdminDashboard() {
  var qc = useQueryClient();
  var activeTabState = useState('overview');
  var activeTab = activeTabState[0];
  var setActiveTab = activeTabState[1];

  var userSearchState = useState('');
  var userSearch = userSearchState[0];
  var setUserSearch = userSearchState[1];
  var roomFilterState = useState('all');
  var roomFilter = roomFilterState[0];
  var setRoomFilter = roomFilterState[1];
  var bannedIPsState = useState([]);
  var bannedIPs = bannedIPsState[0];
  var setBannedIPs = bannedIPsState[1];
  var newBanIPState = useState('');
  var newBanIP = newBanIPState[0];
  var setNewBanIP = newBanIPState[1];
  var banReasonState = useState('');
  var banReason = banReasonState[0];
  var setBanReason = banReasonState[1];
  var suspensionsState = useState([]);
  var suspensions = suspensionsState[0];
  var setSuspensions = suspensionsState[1];
  var suspendUserState = useState('');
  var suspendUser = suspendUserState[0];
  var setSuspendUser = suspendUserState[1];
  var suspendDurationState = useState('24h');
  var suspendDuration = suspendDurationState[0];
  var setSuspendDuration = suspendDurationState[1];
  var auditLogState = useState([]);
  var auditLog = auditLogState[0];
  var setAuditLog = auditLogState[1];

  var userQuery = useQuery({ queryKey: ['currentUser'], queryFn: function() { return base44.auth.me(); } });
  var user = userQuery.data || null;
  var roomId = new URLSearchParams(window.location.search).get('room_id');
  var isAdminOrOwner = user && (user.role === 'admin' || user.role === 'owner');

  var allUsersQuery = useQuery({
    queryKey: ['adminUsers'],
    queryFn: function() { return base44.entities.User.list('-created_date', 200); },
    enabled: !!isAdminOrOwner
  });
  var allUsers = allUsersQuery.data || [];
  var loadingUsers = allUsersQuery.isLoading;

  var allRoomsQuery = useQuery({
    queryKey: ['adminRooms'],
    queryFn: function() { return base44.entities.Room.list('-created_date', 100); },
    enabled: !!isAdminOrOwner
  });
  var allRooms = allRoomsQuery.data || [];

  var transactionsQuery = useQuery({
    queryKey: ['adminTransactions'],
    queryFn: function() { return base44.entities.Transaction.list('-created_date', 200); },
    enabled: !!isAdminOrOwner
  });
  var transactions = transactionsQuery.data || [];

  var reportsQuery = useQuery({
    queryKey: ['adminReports'],
    queryFn: function() { return base44.entities.Report.list('-created_date', 50); },
    enabled: !!isAdminOrOwner
  });
  var reports = reportsQuery.data || [];

  var messagesQuery = useQuery({
    queryKey: ['adminMessages'],
    queryFn: function() { return base44.entities.Message.list('-created_date', 500); },
    enabled: !!isAdminOrOwner
  });
  var messages = messagesQuery.data || [];

  var communitiesQuery = useQuery({
    queryKey: ['adminCommunities'],
    queryFn: function() { return base44.entities.Community.list('-member_count', 50); },
    enabled: !!isAdminOrOwner
  });
  var communities = communitiesQuery.data || [];

  var firstCommunityId = (communities[0] && communities[0].id) || null;
  var _liveRoom = allRooms.find(function(r) { return r.status === 'live'; });
  var activeAdminRoomId = (_liveRoom && _liveRoom.id) || null;

  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, roomId);

  var changeRoleMutation = useMutation({
    mutationFn: function(params) {
      var userId = params.userId;
      var role = params.role;
      return base44.entities.User.update(userId, { role: role });
    },
    onSuccess: function() { toast.success('Role updated'); qc.invalidateQueries({ queryKey: ['adminUsers'] }); },
    onError: function() { toast.error('Action failed.'); },
  });
  var endRoomMutation = useMutation({
    mutationFn: function(rId) { return base44.entities.Room.update(rId, { status: 'ended', ended_at: new Date().toISOString() }); },
    onSuccess: function() { toast.success('Room ended'); qc.invalidateQueries({ queryKey: ['adminRooms'] }); },
    onError: function() { toast.error('Action failed.'); },
  });

  if (!user || (user.role !== 'admin' && user.role !== 'owner')) return (
    <div className="min-h-screen flex items-center justify-center text-center" style={{ background: BG }}>
      <div>
        <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: '#C0392B' }} />
        <h2 className="text-2xl font-black mb-2 text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Admin Access Required</h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>You don't have permission to view this page.</p>
      </div>
    </div>
  );

  var totalRevenue = transactions.reduce(function(s, t) { return s + (t.creator_payout || 0) + (t.platform_cut || 0); }, 0);
  var liveRooms = allRooms.filter(function(r) { return r.status === 'live'; });
  var pendingReports = reports.filter(function(r) { return r.status === 'pending'; });
  var todayUsers = allUsers.filter(function(u) { return new Date(u.created_date).toDateString() === new Date().toDateString(); });

  var userGrowthData = Object.entries(allUsers.reduce(function(acc, u) {
    var m = new Date(u.created_date).toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[m] = (acc[m] || 0) + 1; return acc;
  }, {})).slice(-8).map(function(pair) { return { month: pair[0], count: pair[1] }; });

  var revenueChartData = Object.entries(transactions.reduce(function(acc, t) {
    var m = new Date(t.created_date).toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[m] = (acc[m] || 0) + (t.creator_payout || 0) + (t.platform_cut || 0); return acc;
  }, {})).slice(-8).map(function(pair) { return { month: pair[0], revenue: pair[1] }; });

  var filteredUsers = allUsers.filter(function(u) {
    return !userSearch || (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase())) || (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()));
  });
  var filteredRooms = roomFilter === 'all' ? allRooms : allRooms.filter(function(r) { return r.status === roomFilter; });

  function roomStatusStyle(status) {
    var styles = {
      live:      { bg: 'rgba(192,57,43,0.12)', border: 'rgba(192,57,43,0.35)', color: '#C0392B' },
      scheduled: { bg: 'rgba(74,138,122,0.1)',   border: 'rgba(74,138,122,0.3)',   color: '#4A8A7A' },
      ended:     { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' },
    };
    return styles[status] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' };
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 border-b" style={{ background: 'rgba(8,11,24,0.97)', borderColor: 'rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" style={{ color: '#C0392B' }} />
              <div>
                <h1 className="text-xl font-black text-white leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Admin Dashboard</h1>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Platform management & oversight</p>
              </div>
            </div>
            <button onClick={function() { qc.invalidateQueries(); }} className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-black uppercase text-[10px]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          {/* Tab bar */}
          <div className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {TABS.map(function(tab) {
              var label = tab === 'users' ? 'Users (' + allUsers.length + ')' : tab === 'rooms' ? 'Rooms (' + allRooms.length + ')' : tab === 'reports' ? 'Reports (' + pendingReports.length + ')' : tab;
              return (
                <button key={tab} onClick={function() { setActiveTab(tab); }}
                  className="flex-1 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all capitalize"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', color: activeTab === tab ? GOLD : 'rgba(255,255,255,0.35)', borderBottomColor: activeTab === tab ? GOLD : 'transparent', background: activeTab === tab ? 'rgba(212,175,55,0.05)' : 'transparent' }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 space-y-6">
        {/* KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Users" value={allUsers.length} icon={Users} color="rgba(212,175,55,0.8)" sub={'+' + todayUsers.length + ' today'} />
          <StatCard label="Live Rooms" value={liveRooms.length} icon={Radio} color="rgba(192,57,43,0.7)" badge={liveRooms.length > 0 ? 'LIVE' : undefined} />
          <StatCard label="Total Rooms" value={allRooms.length} icon={Globe} color="rgba(212,175,55,0.7)" />
          <StatCard label="Revenue" value={'$' + totalRevenue.toFixed(0)} icon={DollarSign} color="rgba(109,191,126,0.6)" />
          <StatCard label="Messages" value={messages.length} icon={MessageSquare} color="rgba(212,175,55,0.6)" />
          <StatCard label="Open Reports" value={pendingReports.length} icon={AlertTriangle} color={pendingReports.length > 0 ? 'rgba(192,57,43,0.7)' : 'rgba(255,255,255,0.15)'} />
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
                  ].map(function(item) {
                    var Ico = item.Ico;
                    return (
                      <div key={item.label} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                          <Ico className="w-3.5 h-3.5" style={{ color: 'rgba(212,175,55,0.5)' }} />{item.label}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{item.value}</span>
                          {item.ok ? <CheckCircle className="w-3 h-3" style={{ color: '#6DBF7E' }} /> : <AlertTriangle className="w-3 h-3" style={{ color: '#C0392B' }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DarkCard>
            </div>
            <DarkCard title="Recent Transactions">
              {transactions.length === 0
                ? <p className="text-sm text-center py-6" style={{ color: 'rgba(255,255,255,0.25)' }}>No transactions yet</p>
                : <div className="space-y-1 max-h-64 overflow-y-auto">
                    {transactions.slice(0, 15).map(function(t) {
                      return (
                        <div key={t.id} className="flex items-center justify-between py-2 border-b text-sm" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                          <div>
                            <p className="font-black text-xs text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{t.sender_name || 'Anonymous'} → {t.recipient_name || 'Creator'}</p>
                            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.transaction_type} · {format(new Date(t.created_date), 'MMM d, h:mm a')}</p>
                          </div>
                          <span className="font-black text-sm" style={{ color: '#6DBF7E', fontFamily: 'Orbitron, monospace' }}>+${((t.creator_payout || 0) + (t.platform_cut || 0)).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
              }
            </DarkCard>
          {/* Stream Infra Reference shortcut */}
          <Link to="/StreamRefDash" style={{ display: 'block', textDecoration: 'none', marginTop: 12 }}>
            <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(128,0,32,0.08)', border: '1px solid rgba(128,0,32,0.25)', cursor: 'pointer' }}>
              <span style={{ fontSize: 24 }}>📡</span>
              <div>
                <p className="font-black text-sm uppercase" style={{ color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>Stream Infrastructure Reference</p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>RTMP · WebRTC · Webhooks · .env · Supabase · Nginx · Judges →</p>
              </div>
            </div>
          </Link>

          {/* Admin quick-links grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {[
              { label: '🛡 AI Moderation',     href: 'AIModeration'       },
              { label: '📊 Stream Analytics',  href: 'StreamAnalytics'    },
              { label: '📈 Adv. Analytics',    href: 'AdvancedAnalytics'  },
              { label: '🤖 AI Hub',            href: 'AIHub'              },
              { label: '🏆 Loyalty Program',   href: 'LoyaltyProgram'     },
              { label: '👥 Community Admin',   href: 'CommunityAdmin'     },
              { label: '⚔️ PK Battles',        href: 'PKBattle'           },
              { label: '🔊 Voice AI',          href: 'VoiceAISettings'    },
            ].map(function(item) {
              return (
                <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
                  <span className="font-black uppercase text-[10px] px-3 py-1.5 rounded-xl transition-all hover:brightness-110"
                    style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', display: 'block', letterSpacing: '0.06em', cursor: 'pointer' }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <input style={{ width: '100%', padding: '9px 12px 9px 38px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif', boxSizing: 'border-box' }}
                  placeholder="Search users…" value={userSearch} onChange={function(e) { setUserSearch(e.target.value); }} />
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>{filteredUsers.length} users</span>
            </div>
            <DarkCard title="">
              {loadingUsers
                ? <p className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>Loading users…</p>
                : <div className="max-h-[600px] overflow-y-auto space-y-1">
                    {filteredUsers.map(function(u) {
                      return (
                        <div key={u.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0" style={{ background: 'linear-gradient(135deg, ' + CRIMSON + ', ' + GOLD + ')', color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>
                              {(u.full_name && u.full_name.charAt(0)) || (u.email && u.email.charAt(0)) || '?'}
                            </div>
                            <div>
                              <p className="font-black text-xs text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{u.full_name || 'No name'}</p>
                              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{u.email} · {format(new Date(u.created_date), 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', background: u.role === 'admin' ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.06)', border: '1px solid ' + (u.role === 'admin' ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'), color: u.role === 'admin' ? GOLD : 'rgba(255,255,255,0.4)' }}>{u.role}</span>
                            {u.id !== (user && user.id) && (
                              <div style={{ display: 'flex', gap: 3 }}>
                                {['user', 'admin'].map(function(r) {
                                  return (
                                    <button key={r} onClick={function() { changeRoleMutation.mutate({ userId: u.id, role: r }); }}
                                      style={{ padding: '3px 8px', borderRadius: 99, fontSize: 10, border: '1px solid ' + (u.role === r ? '#D4AF37' : 'rgba(255,255,255,0.1)'), background: u.role === r ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: u.role === r ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                                      {r}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </DarkCard>
          </div>
        )}

        {/* ROOMS */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div style={{ display: 'flex', gap: 4 }}>
                {[['all','All'],['live','Live'],['scheduled','Scheduled'],['ended','Ended']].map(function(pair) {
                  var val = pair[0];
                  var label = pair[1];
                  return (
                    <button key={val} onClick={function() { setRoomFilter(val); }}
                      style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, border: '1px solid ' + (roomFilter === val ? '#D4AF37' : 'rgba(255,255,255,0.1)'), background: roomFilter === val ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: roomFilter === val ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                      {label}
                    </button>
                  );
                })}
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>{filteredRooms.length} rooms</span>
            </div>
            <DarkCard title="">
              <div className="max-h-[600px] overflow-y-auto space-y-1">
                {filteredRooms.map(function(room) {
                  var ss = roomStatusStyle(room.status);
                  return (
                    <div key={room.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <p className="font-black text-xs text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{room.title}</p>
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{room.type} · {room.viewer_count || 0} viewers · {format(new Date(room.created_date), 'MMM d')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', background: ss.bg, border: '1px solid ' + ss.border, color: ss.color }}>{room.status}</span>
                        {room.status === 'live' && (
                          <button onClick={function() { endRoomMutation.mutate(room.id); }}
                            className="px-2.5 py-1 rounded-lg font-black uppercase text-[11px]"
                            style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', color: '#C0392B', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}>
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
                <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#6DBF7E' }} />
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>No reports to review</p>
              </div>
            </DarkCard>
          ) : (
            <div className="space-y-3">
              {reports.map(function(report) {
                return (
                  <div key={report.id} className="rounded-2xl p-4" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid ' + (report.status === 'pending' ? 'rgba(212,133,74,0.25)' : 'rgba(212,175,55,0.1)') }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', background: report.status === 'pending' ? 'rgba(255,136,0,0.12)' : 'rgba(109,191,126,0.1)', border: '1px solid ' + (report.status === 'pending' ? 'rgba(255,136,0,0.3)' : 'rgba(109,191,126,0.25)'), color: report.status === 'pending' ? '#ff8800' : '#6DBF7E' }}>{report.status}</span>
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}>{report.report_type}</span>
                        </div>
                        <p className="text-sm text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{report.description}</p>
                        <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{format(new Date(report.created_date), 'MMM d, h:mm a')}</p>
                      </div>
                      {report.status === 'pending' && (
                        <button className="px-3 py-1.5 rounded-xl font-black uppercase text-[10px] shrink-0"
                          style={{ background: 'rgba(109,191,126,0.1)', border: '1px solid rgba(109,191,126,0.25)', color: '#6DBF7E', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}
                          onClick={async function() { try { await base44.entities.Report.update(report.id, { status: 'resolved', reviewed_by: (user && user.id), reviewed_at: new Date().toISOString() }); qc.invalidateQueries({ queryKey: ['adminReports'] }); toast.success('Report resolved'); } catch(err) { toast.error('Failed to resolve report.'); } }}>
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {activeTab === 'reports' && (
          <div className="mt-4">
            <ReportsManager communityId={firstCommunityId} userId={(user && user.id)} />
          </div>
        )}

        {(user && user.id) && <ModerationActionModal isOpen={false} onClose={function() {}} targetUser={null} roomId={activeAdminRoomId} communityId={firstCommunityId} moderatorId={user.id} />}

        {/* SECURITY */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            {/* Guardian AI shortcut */}
            <Link to="/GuardianAI" style={{ display: 'block', textDecoration: 'none' }}>
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', cursor: 'pointer' }}>
                <span style={{ fontSize: 24 }}>🛡️</span>
                <div>
                  <p className="font-black text-sm uppercase" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>Guardian AI Moderation</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Set risk thresholds · Real-time scan · Auto flag/mute/ban →</p>
                </div>
              </div>
            </Link>
            {/* IP Ban */}
            <div className="rounded-2xl p-4" style={{ background: BG2, border: '1px solid rgba(255,68,68,0.15)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">🚫</span>
                <span className="text-sm font-black uppercase" style={{ color: '#FF4444', fontFamily: 'Barlow Condensed, sans-serif' }}>IP Bans</span>
                <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,68,68,0.1)', color: '#FF4444', border: '1px solid rgba(255,68,68,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>{bannedIPs.length} active</span>
              </div>
              <div className="flex gap-2 mb-3">
                <input value={newBanIP} onChange={function(e) { setNewBanIP(e.target.value); }}
                  placeholder="IP address (e.g. 192.168.1.1)"
                  maxLength={45}
                  className="flex-1 h-9 px-3 rounded-xl text-xs text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <button onClick={function() { if(newBanIP.trim()) { setBannedIPs(function(p) { return p.concat([{ ip: newBanIP.trim(), reason: banReason, date: new Date().toISOString() }]); }); setNewBanIP(''); setBanReason(''); toast.success('IP banned'); }}}
                  className="h-9 px-3 rounded-xl text-xs font-black"
                  style={{ background: 'rgba(255,68,68,0.15)', color: '#FF4444', border: '1px solid rgba(255,68,68,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Ban IP
                </button>
              </div>
              <input value={banReason} onChange={function(e) { setBanReason(e.target.value); }}
                placeholder="Reason (optional)"
                maxLength={200}
                className="w-full h-8 px-3 rounded-xl text-xs text-white outline-none mb-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }} />
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {bannedIPs.length === 0 ? (
                  <p className="text-[10px] text-center py-3" style={{ color: 'rgba(255,255,255,0.2)' }}>No IPs banned</p>
                ) : bannedIPs.map(function(b, i) {
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.1)' }}>
                      <span className="text-xs font-mono text-white/60 flex-1">{b.ip}</span>
                      {b.reason && <span className="text-[11px] text-white/30">{b.reason}</span>}
                      <button onClick={function() { setBannedIPs(function(p) { return p.filter(function(x, j) { return j !== i; }); }); }}
                        className="text-[11px] px-2 py-0.5 rounded" style={{ background: 'rgba(109,191,126,0.08)', color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        Unban
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User suspension */}
            <div className="rounded-2xl p-4" style={{ background: BG2, border: '1px solid rgba(212,133,74,0.15)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">⚠️</span>
                <span className="text-sm font-black uppercase" style={{ color: '#D4854A', fontFamily: 'Barlow Condensed, sans-serif' }}>User Suspension</span>
              </div>
              <div className="flex gap-2 mb-2">
                <input value={suspendUser} onChange={function(e) { setSuspendUser(e.target.value); }}
                  placeholder="Username or user ID"
                  maxLength={100}
                  className="flex-1 h-9 px-3 rounded-xl text-xs text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {[['1h','1h'],['24h','24h'],['7d','7d'],['30d','30d'],['perm','Perm']].map(function(pair) {
                    var val = pair[0];
                    var label = pair[1];
                    return (
                      <button key={val} onClick={function() { setSuspendDuration(val); }}
                        style={{ padding: '4px 8px', borderRadius: 99, fontSize: 10, border: '1px solid ' + (suspendDuration === val ? '#D4854A' : 'rgba(212,133,74,0.2)'), background: suspendDuration === val ? 'rgba(212,133,74,0.2)' : 'rgba(212,133,74,0.06)', color: suspendDuration === val ? '#D4854A' : 'rgba(212,133,74,0.6)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <button onClick={function() { if(suspendUser.trim()) { setSuspensions(function(p) { return p.concat([{ user: suspendUser.trim(), duration: suspendDuration, date: new Date().toISOString() }]); }); setSuspendUser(''); toast.success('User suspended'); }}}
                  className="h-9 px-3 rounded-xl text-xs font-black"
                  style={{ background: 'rgba(212,133,74,0.12)', color: '#D4854A', border: '1px solid rgba(212,133,74,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Suspend
                </button>
              </div>
              {suspensions.map(function(s, i) {
                return (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg mt-1" style={{ background: 'rgba(212,133,74,0.05)', border: '1px solid rgba(212,133,74,0.1)' }}>
                    <span className="text-xs font-bold text-white/60 flex-1">{s.user}</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(212,133,74,0.15)', color: '#D4854A', fontFamily: 'Barlow Condensed, sans-serif' }}>{s.duration}</span>
                    <button onClick={function() { setSuspensions(function(p) { return p.filter(function(x, j) { return j !== i; }); }); }}
                      className="text-[11px] px-2 py-0.5 rounded" style={{ background: 'rgba(109,191,126,0.08)', color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>Lift</button>
                  </div>
                );
              })}
            </div>

            {/* DMCA Takedowns */}
            <div className="rounded-2xl p-4" style={{ background: BG2, border: '1px solid rgba(212,175,55,0.12)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">⚖️</span>
                <span className="text-sm font-black uppercase" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>DMCA Takedowns</span>
              </div>
              <div className="space-y-2 text-xs text-white/40">
                <p>DMCA counter-notice workflow. Takedown requests are logged and acted on within 24 hours.</p>
                <div className="p-2 rounded-lg" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
                  <p className="font-bold text-white/60 mb-1">Process:</p>
                  <p>1. Complaint received → Logged → Stream/content paused</p>
                  <p>2. Creator notified → 48h response window</p>
                  <p>3. Admin reviews → Reinstates or removes permanently</p>
                </div>
                <button className="w-full py-2 rounded-xl text-[10px] font-black uppercase"
                  style={{ background: 'rgba(212,175,55,0.08)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  + Log DMCA Request
                </button>
              </div>
            </div>

            {/* Rate limiting */}
            <div className="rounded-2xl p-4" style={{ background: BG2, border: '1px solid rgba(0,200,200,0.12)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">⚡</span>
                <span className="text-sm font-black uppercase" style={{ color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>Rate Limiting</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'API Requests/min', value: '100', status: 'ok' },
                  { label: 'WS Connections', value: '4,096', status: 'ok' },
                  { label: 'Chat msgs/min', value: '30/user', status: 'ok' },
                  { label: 'Room creates/hr', value: '10/user', status: 'ok' },
                ].map(function(r) {
                  return (
                    <div key={r.label} className="p-2 rounded-lg" style={{ background: 'rgba(0,200,200,0.05)', border: '1px solid rgba(0,200,200,0.1)' }}>
                      <p className="text-[11px] uppercase tracking-wide" style={{ color: 'rgba(0,200,200,0.6)' }}>{r.label}</p>
                      <p className="text-sm font-black text-white">{r.value}</p>
                      <p className="text-[11px]" style={{ color: '#6DBF7E' }}>● {r.status}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* AUDIT */}
        {activeTab === 'audit' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Admin Audit Log</span>
              <button onClick={function() { setAuditLog([]); }} className="text-[11px] px-2 py-0.5 rounded" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>Clear</button>
            </div>
            {auditLog.length === 0 ? (
              <div className="text-center py-8 text-white/20 text-xs">No audit entries yet. Actions you take appear here.</div>
            ) : auditLog.map(function(entry, i) {
              return (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-base">{entry.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">{entry.action}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{entry.time}</p>
                  </div>
                  <span className="text-[11px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0" style={{ background: entry.color + '18', color: entry.color, border: '1px solid ' + entry.color + '33', fontFamily: 'Barlow Condensed, sans-serif' }}>{entry.severity}</span>
                </div>
              );
            })}
            <GuestModerationLog />
            </div>
            )}

            {/* REVENUE */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
          <PayoutSummary />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DarkCard title="Monthly Revenue">
              {revenueChartData.length === 0
                ? <p className="text-sm text-center py-12" style={{ color: 'rgba(255,255,255,0.25)' }}>No revenue data</p>
                : <ResponsiveContainer width="100%" height={220}><BarChart data={revenueChartData}><CartesianGrid strokeDasharray="3 3" vertical={false} {...CHART_THEME.cartesian} /><XAxis dataKey="month" tick={CHART_THEME.tick} /><YAxis tick={CHART_THEME.tick} tickFormatter={function(v) { return '$' + v; }} /><Tooltip {...CHART_THEME.tooltip} formatter={function(v) { return ['$' + Number(v).toFixed(2), 'Revenue']; }} /><Bar dataKey="revenue" fill="#6DBF7E" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
              }
            </DarkCard>
            <DarkCard title="Revenue Summary">
              <div className="space-y-3">
                <div className="p-5 rounded-xl text-center" style={{ background: 'rgba(109,191,126,0.06)', border: '1px solid rgba(109,191,126,0.15)' }}>
                  <p className="text-3xl font-black" style={{ color: '#6DBF7E', fontFamily: 'Orbitron, monospace' }}>${totalRevenue.toFixed(2)}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(109,191,126,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>Total Platform Revenue</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Transactions', value: transactions.length },
                    { label: 'Avg Transaction', value: '$' + (transactions.length > 0 ? (totalRevenue / transactions.length).toFixed(2) : '0.00') },
                  ].map(function(item) {
                    return (
                      <div key={item.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xl font-black" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{item.value}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>{item.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </DarkCard>
          </div>
          </div>
        )}

        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ChallengeAnalytics communityId={firstCommunityId} />
          <ReferralConfig communityId={firstCommunityId} />
          <PerformanceDashboard roomId={activeAdminRoomId} sessionId={activeAdminRoomId} />
          <AnnouncementScheduler communityId={firstCommunityId} userId={(user && user.id)} />
          <SpotlightBanner communityId={firstCommunityId} isAdmin={true} />
          <OnlineUsersGrid compact maxVisible={8} />
          <ContentRecommendations />
          <StreamHealthDashboard roomId={activeAdminRoomId} isHost={true} />
          <AnnouncementPanel communityId={firstCommunityId} userId={(user && user.id)} />
        </div>
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="admin" viewerCount={0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={null} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={null} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      {/* Creator Studios */}
      <div style={{ margin: '0 0 16px', padding: 16, borderRadius: 16, border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(13,6,24,0.5)' }}>
        <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(176,102,204,0.7)', marginBottom: 12 }}>Creator Studios</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          {[
            { emoji: '🎬', label: 'Micro Drama', sub: 'Episode creator', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
            { emoji: '🎵', label: 'AI Music', sub: 'Beat & vocal studio', href: 'AIMusic', color: '#00A8E8' },
            { emoji: '🎙️', label: 'Podcast Studio', sub: 'AI-assisted pods', href: 'PodcastStudio', color: '#B066CC' },
          ].map(function(s) {
            return (
              <Link key={s.href} to={createPageUrl(s.href)} style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(123,45,139,0.18)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', marginTop: 2 }}>{s.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
          <div style={{ borderRadius: 12, padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC', cursor: 'pointer' }}>
            🎬 Launch Episode Creator Studio →
          </div>
        </Link>
      </div>
      <BackgroundCustomizer />
    </div>
  );
}
