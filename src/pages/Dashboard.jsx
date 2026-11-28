import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts';
import {
  Radio, Users, DollarSign, TrendingUp, Eye, Clock, MessageSquare,
  Heart, Plus, Video, Settings, ChevronRight, Play, Trash2, Edit, X, BarChart2,
  Crown, Layers
} from 'lucide-react';
import ZEGOConfigPanel from '../components/zego/ZEGOConfigPanel';
import AnalyticsOverview from '../components/dashboard/AnalyticsOverview';
import AudienceInsights from '../components/dashboard/AudienceInsights';
import EarningsBreakdown from '../components/dashboard/EarningsBreakdown';
import RoomAnalyticsPanel from '../components/rooms/RoomAnalyticsPanel';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import MonetizationDashboard from '../components/monetization/MonetizationDashboard';
import RecordingManager from '../components/content/RecordingManager';
import AIHighlightGenerator from '../components/content/AIHighlightGenerator';
import StreamerGoalsWidget from '../components/monetization/StreamerGoalsWidget';
import QuickActionPanel from '../components/shared/QuickActionPanel';
import ZEGOMobileAppBanner from '../components/zego/ZEGOMobileAppBanner';
import NotificationBell from '../components/shared/NotificationBell';
import SubscriptionManager from '@/components/monetization/SubscriptionManager';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import PayPerViewCard from '../components/monetization/PayPerViewCard';
import PayPerViewManager from '../components/monetization/PayPerViewManager';
import SubscriptionTiers from '../components/monetization/SubscriptionTiers';
import VirtualGoodsStore from '../components/monetization/VirtualGoodsStore';
import DirectPayments from '../components/live/DirectPayments';
import SpotlightBanner from '../components/community/SpotlightBanner';
import SpotlightSection from '../components/community/SpotlightSection';
import PollCard from '../components/community/PollCard';
import CreatorBridge from '../components/social/CreatorBridge';
import { toast } from 'sonner';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import RewardShopEditor from '../components/loyalty/RewardShopEditor';
import SubscriptionCard from '../components/monetization/SubscriptionCard';
import TierSubscribeCard from '../components/subscriptions/TierSubscribeCard';
import TierEditor from '../components/subscriptions/TierEditor';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import OnlinePresence from '../components/shared/OnlinePresence';
import AlertConfig from '../components/live/AlertConfig';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import ShopDashboard from '../components/merch/ShopDashboard';
var GOLD = '#D4AF37';
var BURGUNDY = '#800020';
var CREAM = '#F5E6D3';

var TABS = [
  { id: 'overview',     label: '📊 Overview',     icon: BarChart2 },
  { id: 'analytics',   label: '📈 Analytics',    icon: TrendingUp },
  { id: 'content',     label: '🎬 Content',       icon: Video },
  { id: 'community',   label: '👥 Community',     icon: Users },
  { id: 'monetization',label: '💰 Monetization', icon: DollarSign },
  { id: 'settings',    label: '⚙ Settings',      icon: Settings },
];

function Card({ children, className, style }) {
  if (className === undefined) className = '';
  if (style === undefined) style = {};
  return (
    <div className={'rounded-xl ' + className}
      style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.12)', ...style }}>
      {children}
    </div>
  );
}

function StatTile({ label, value, sub, color, icon: Icon }) {
  if (color === undefined) color = GOLD;
  return (
    <Card>
      <div className="p-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(245,230,211,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</p>
          <p className="text-2xl font-black leading-none" style={{ color: color, fontFamily: 'Orbitron, monospace' }}>{value}</p>
          {sub && <p className="text-[11px] mt-1" style={{ color: 'rgba(245,230,211,0.3)' }}>{sub}</p>}
        </div>
        {Icon && <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + '15', border: '1px solid ' + color + '25' }}>
          <Icon className="w-4 h-4" style={{ color: color }} />
        </div>}
      </div>
    </Card>
  );
}

/* ═══════════════ QUICK START CARD ═══════════════ */
function QuickStartCard() {
  var [visible, setVisible] = useState(function() {
    try { return localStorage.getItem('swlv_first_visit') !== 'done'; } catch(e) { return true; }
  });

  function dismiss() {
    try { localStorage.setItem('swlv_first_visit', 'done'); } catch(e) {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="rounded-xl mb-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(128,0,32,0.25), rgba(212,175,55,0.08))', border: '1px solid rgba(212,175,55,0.3)' }}>
      <button onClick={dismiss} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}>
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="p-4 pb-4">
        <p className="font-black text-sm uppercase mb-0.5" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>Quick Start</p>
        <p className="text-[11px] mb-4" style={{ color: CREAM + '55' }}>Welcome! Here are your first steps as a creator.</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { emoji: '📡', label: 'Go Live Now', href: createPageUrl('GoLive'), bg: BURGUNDY },
            { emoji: '📅', label: 'Schedule Stream', href: createPageUrl('StreamScheduler'), bg: 'rgba(212,175,55,0.12)' },
            { emoji: '👥', label: 'Invite Guests', href: createPageUrl('InviteUsers'), bg: 'rgba(212,175,55,0.08)' },
          ].map(function(tile) {
            return (
              <Link key={tile.label} to={tile.href}>
                <div className="rounded-xl p-3 text-center cursor-pointer" style={{ background: tile.bg, border: '1px solid rgba(212,175,55,0.22)' }}>
                  <div className="text-2xl mb-1">{tile.emoji}</div>
                  <p className="text-[10px] font-black uppercase leading-tight" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>{tile.label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ OVERVIEW TAB ═══════════════ */
function OverviewTab({ user }) {
  var { data: payout } = useQuery({
    queryKey: ['db-payout', (user && user.id)],
    queryFn: function() { return base44.entities.CreatorPayout.filter({ creator_id: (user && user.id) }).then(function(r) { return r[0]; }); },
    enabled: !!(user && user.id),
  });
  var { data: profile } = useQuery({
    queryKey: ['db-profile', (user && user.id)],
    queryFn: function() { return base44.entities.CreatorProfile.filter({ user_id: (user && user.id) }).then(function(r) { return r[0]; }); },
    enabled: !!(user && user.id),
  });
  var { data: liveRooms = [] } = useQuery({
    queryKey: ['db-live'],
    queryFn: function() { return base44.entities.Room.filter({ status: 'live' }); },
    refetchInterval: 10000,
  });
  var { data: txns = [] } = useQuery({
    queryKey: ['db-txns7', (user && user.id)],
    queryFn: function() { return base44.entities.Transaction.filter({ recipient_id: (user && user.id) }, '-created_date', 100); },
    enabled: !!(user && user.id),
  });
  var { data: activities = [] } = useQuery({
    queryKey: ['db-activities', (user && user.id)],
    queryFn: function() { return base44.entities.Activity.filter({ user_id: (user && user.id) }, '-created_date', 10); },
    enabled: !!(user && user.id),
  });

  // Last 7 days chart
  var days = Array.from({ length: 7 }, function(_, i) {
    var d = new Date(); d.setDate(d.getDate() - (6 - i));
    var label = d.toLocaleDateString('en', { weekday: 'short' });
    var total = txns.filter(function(t) {
      var td = new Date(t.created_date);
      return td.toDateString() === d.toDateString();
    }).reduce(function(s, t) { return s + (t.creator_payout || t.creator_amount || 0); }, 0);
    return { label: label, total: total };
  });

  return (
    <div className="space-y-5">
      <QuickStartCard />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Pending Balance" value={'$' + Math.floor((payout && payout.pending_balance) || 0)} icon={DollarSign} color={GOLD} />
        <StatTile label="Subscribers" value={((profile && profile.subscriber_count) || 0).toLocaleString()} icon={Users} color="#C9A84C" />
        <StatTile label="Hours Streamed" value={Math.floor((profile && profile.total_hours_streamed) || 0) + 'h'} icon={Clock} color="#D4AF37" />
        <StatTile label="Live Rooms" value={liveRooms.length} icon={Radio} color="#C0392B" sub="right now" />
      </div>

      <Card>
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: CREAM + '50', fontFamily: 'Barlow Condensed, sans-serif' }}>Revenue — Last 7 Days</p>
        </div>
        <div className="px-4 pb-4" style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: 'rgba(245,230,211,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(245,230,211,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(8,11,24,0.9)', border: '1px solid ' + GOLD + '30', color: CREAM }} />
              <Bar dataKey="total" fill={GOLD} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-black uppercase" style={{ color: CREAM + '50', fontFamily: 'Barlow Condensed, sans-serif' }}>Recent Activity</p>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {activities.length === 0
            ? <p className="text-center py-8 text-[11px]" style={{ color: CREAM + '30' }}>No recent activity</p>
            : activities.map(function(a) {
              return (
                <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: GOLD }} />
                  <p className="text-[11px] flex-1" style={{ color: CREAM + '70' }}>{a.title}</p>
                  <span className="text-[11px]" style={{ color: CREAM + '30' }}>{new Date(a.created_date).toLocaleDateString()}</span>
                </div>
              );
            })}
        </div>
      </Card>

      {(user && user.id) && <MilestoneAlerts creatorId={user.id} />}

      {user && (
        <div className="mb-4">
          <CreatorBridge user={user} />
        </div>
      )}

      <div className="flex items-center gap-3 mb-2">
        <NotificationBell />
        <ZEGOMobileAppBanner />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: '📡 Go Live', href: createPageUrl('GoLive'), color: BURGUNDY },
          { label: '📅 Schedule Stream', href: createPageUrl('StreamScheduler'), color: 'rgba(212,175,55,0.15)' },
          { label: '✍ Create Post', href: createPageUrl('Communities'), color: 'rgba(201,168,76,0.1)' },
          { label: '🤖 Joyce AI', href: createPageUrl('JoyceAI'), color: 'rgba(212,175,55,0.08)' },
          { label: '🛡️ Guardian AI', href: createPageUrl('GuardianAI'), color: 'rgba(192,57,43,0.08)' },
          { label: '⚡ INS Forge', href: createPageUrl('INSForge'), color: 'rgba(212,175,55,0.08)' },
        ].map(function(q) {
          return (
            <Link key={q.label} to={q.href}>
              <button className="px-4 py-2 rounded-xl font-black uppercase text-[10px]"
                style={{ background: q.color, color: GOLD, border: '1px solid rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                {q.label}
              </button>
            </Link>
          );
        })}
      </div>

      {/* Creator Studios */}
      <div className="rounded-2xl p-4" style={{ border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(13,6,24,0.5)' }}>
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(176,102,204,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>Creator Studios</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { emoji: '🎬', label: 'Micro Drama', sub: 'Episode creator', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
            { emoji: '🎵', label: 'AI Music', sub: 'Beat & vocal studio', href: 'AIMusic', color: '#00A8E8' },
            { emoji: '🎙️', label: 'Podcast Studio', sub: 'AI-assisted pods', href: 'PodcastStudio', color: '#B066CC' },
          ].map(function(s) {
            return (
              <Link key={s.href} to={createPageUrl(s.href)} style={{ textDecoration: 'none' }}>
                <div className="rounded-xl p-3 cursor-pointer" style={{ border: '1px solid rgba(123,45,139,0.18)', background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-xl mb-1">{s.emoji}</div>
                  <div className="text-[11px] font-black uppercase" style={{ color: s.color, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>{s.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
          <div className="rounded-xl px-3 py-2 text-center text-[11px] font-black uppercase" style={{ background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', cursor: 'pointer' }}>
            🎬 Launch Episode Creator Studio →
          </div>
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════ ANALYTICS TAB ═══════════════ */
function AnalyticsTab({ user }) {
  var { data: roomAnalytics = [] } = useQuery({
    queryKey: ['db-roomanalytics', (user && user.id)],
    queryFn: function() { return base44.entities.RoomAnalytics.filter({ host_id: (user && user.id) }, '-created_date', 20); },
    enabled: !!(user && user.id),
  });
  var { data: follows = [] } = useQuery({
    queryKey: ['db-follows', (user && user.id)],
    queryFn: function() { return base44.entities.Follow.filter({ following_id: (user && user.id) }, '-created_date', 50); },
    enabled: !!(user && user.id),
  });
  var { data: messages = [] } = useQuery({
    queryKey: ['db-msgs', (user && user.id)],
    queryFn: function() { return base44.entities.Message.filter({ user_id: (user && user.id) }); },
    enabled: !!(user && user.id),
  });
  var { data: destinations = [] } = useQuery({
    queryKey: ['db-rtmp', (user && user.id)],
    queryFn: function() { return base44.entities.RTMPDestination.filter({ creator_id: (user && user.id) }); },
    enabled: !!(user && user.id),
  });

  var peakViewers = roomAnalytics.reduce(function(m, r) { return Math.max(m, r.peak_viewers || 0); }, 0);
  var avgWatch = roomAnalytics.length
    ? Math.round(roomAnalytics.reduce(function(s, r) { return s + (r.average_watch_time || 0); }, 0) / roomAnalytics.length)
    : 0;
  var totalTips = roomAnalytics.reduce(function(s, r) { return s + (r.total_tips || 0); }, 0);
  var engagementRate = roomAnalytics.length
    ? ((messages.length / Math.max(1, peakViewers)) * 100).toFixed(1) : '0.0';

  var sortedRooms = roomAnalytics.slice().sort(function(a, b) { return (b.peak_viewers || 0) - (a.peak_viewers || 0); }).slice(0, 5);

  var platformData = destinations.map(function(d) {
    return {
      name: d.platform || d.label || 'Custom',
      viewers: d.viewer_count || 0,
    };
  });

  var COLORS = [GOLD, '#C9A84C', '#D4AF37', '#C0392B', '#6DBF7E'];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatTile label="Peak Viewers" value={peakViewers.toLocaleString()} icon={Eye} color={GOLD} />
        <StatTile label="Avg Watch Time" value={avgWatch + 'm'} icon={Clock} color="#C9A84C" />
        <StatTile label="New Followers" value={follows.length} icon={Users} color="#6DBF7E" />
        <StatTile label="Chat Messages" value={messages.length} icon={MessageSquare} color="#D4AF37" />
        <StatTile label="Engagement" value={engagementRate + '%'} icon={Heart} color="#C0392B" />
        <StatTile label="Tips Earned" value={'$' + Math.floor(totalTips)} icon={DollarSign} color={GOLD} />
      </div>

      {/* Top Streams table */}
      <Card>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-black uppercase" style={{ color: CREAM + '50', fontFamily: 'Barlow Condensed, sans-serif' }}>Top Performing Streams</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Title','Date','Peak Viewers','Tips','Duration'].map(function(h) {
                  return (
                    <th key={h} className="px-4 py-2 text-left font-black uppercase tracking-wider" style={{ color: CREAM + '40', fontFamily: 'Barlow Condensed, sans-serif' }}>{h}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedRooms.length === 0
                ? <tr><td colSpan={5} className="px-4 py-6 text-center" style={{ color: CREAM + '30' }}>No data yet</td></tr>
                : sortedRooms.map(function(r) {
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-2" style={{ color: CREAM + '80' }}>{(r.room_id && r.room_id.slice(0,8)) || '—'}</td>
                      <td className="px-4 py-2" style={{ color: CREAM + '40' }}>{new Date(r.created_date).toLocaleDateString()}</td>
                      <td className="px-4 py-2 font-black" style={{ color: GOLD }}>{r.peak_viewers || 0}</td>
                      <td className="px-4 py-2" style={{ color: '#6DBF7E' }}>${Math.floor(r.total_tips || 0)}</td>
                      <td className="px-4 py-2" style={{ color: CREAM + '50' }}>{Math.floor((r.average_watch_time || 0))}m</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Platform breakdown */}
      {platformData.length > 0 && (
        <Card>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-black uppercase" style={{ color: CREAM + '50', fontFamily: 'Barlow Condensed, sans-serif' }}>Platform Breakdown</p>
          </div>
          <div className="p-4 space-y-2">
            {platformData.map(function(p, i) {
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] w-20 shrink-0" style={{ color: CREAM + '60' }}>{p.name}</span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: Math.min(100,(p.viewers/300)*100) + '%', background: COLORS[i % COLORS.length] }} />
                  </div>
                  <span className="text-[11px] w-12 text-right" style={{ color: CREAM + '50' }}>{p.viewers}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Analytics Overview */}
      {(user && user.id) && <AnalyticsOverview creatorId={user.id} />}

      {/* Audience Insights */}
      {(user && user.id) && <AudienceInsights creatorId={user.id} />}

      {/* Earnings Breakdown */}
      {(user && user.id) && <EarningsBreakdown creatorId={user.id} />}

      {/* Monetization dashboard widget */}
      {(roomAnalytics[0] && roomAnalytics[0].room_id) && (
        <MonetizationDashboard roomId={roomAnalytics[0].room_id} />
      )}

      {/* Room Analytics Panel (most recent stream) */}
      {(roomAnalytics[0] && roomAnalytics[0].room_id) && (
        <RoomAnalyticsPanel roomId={roomAnalytics[0].room_id} />
      )}

      {/* Streamer goals widget */}
      {(user && user.id) && (
        <StreamerGoalsWidget creatorId={user.id} isCreator={true} />
      )}

      {/* AI highlight generator */}
      <AIHighlightGenerator recording={null} />
    </div>
  );
}

/* ═══════════════ CONTENT TAB ═══════════════ */
function ContentTab({ user }) {
  var [filter, setFilter] = useState('all');
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);

  var [sort, setSort] = useState('newest');
  var [showCreate, setShowCreate] = useState(false);
  var [editVod, setEditVod] = useState(null);
  var [form, setForm] = useState({ title: '', video_url: '', description: '', category: 'other', status: 'draft', tags: [] });
  var qc = useQueryClient();

  var { data: vods = [] } = useQuery({
    queryKey: ['db-vods', (user && user.id)],
    queryFn: function() { return base44.entities.VODVideo.filter({ creator_id: (user && user.id) }, '-created_date', 50); },
    enabled: !!(user && user.id),
  });
  var { data: highlights = [] } = useQuery({
    queryKey: ['db-highlights', (user && user.id)],
    queryFn: function() { return base44.entities.StreamHighlight.filter({ creator_id: (user && user.id) }, '-created_date', 10); },
    enabled: !!(user && user.id),
  });

  var createMut = useMutation({
    mutationFn: function() { return base44.entities.VODVideo.create({ ...form, creator_id: (user && user.id), views: 0 }); },
    onSuccess: function(vod) {
      qc.invalidateQueries({ queryKey: ['db-vods'] });
      setShowCreate(false);
      toast.success('VOD created!');
      if ((user && user.id)) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'clip_created',
          title: 'Uploaded VOD: ' + ((vod && vod.title) || 'Video'),
        }).catch(function() {});
      }
    },
    onError: function() { toast.error('Action failed.'); },
  });
  var updateMut = useMutation({
    mutationFn: function(params) { return base44.entities.VODVideo.update(params.id, params.data); },
    onSuccess: function() { qc.invalidateQueries({ queryKey: ['db-vods'] }); setEditVod(null); toast.success('Updated!'); },
    onError: function() { toast.error('Action failed.'); },
  });
  var deleteMut = useMutation({
    mutationFn: function(id) { return base44.entities.VODVideo.delete(id); },
    onSuccess: function() { return qc.invalidateQueries({ queryKey: ['db-vods'] }); },
    onError: function() { toast.error('Action failed.'); },
  });

  var filtered = vods.filter(function(v) {
    if (filter === 'published') return v.status === 'published';
    if (filter === 'draft') return v.status === 'draft';
    if (filter === 'clips') return v.is_clipped;
    return true;
  });
  if (sort === 'views') filtered = filtered.slice().sort(function(a, b) { return (b.views || 0) - (a.views || 0); });
  if (sort === 'longest') filtered = filtered.slice().sort(function(a, b) { return (b.duration_seconds || 0) - (a.duration_seconds || 0); });

  var statusColors = { published: '#6DBF7E', draft: 'rgba(255,255,255,0.3)', unlisted: GOLD };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5">
          {['all','published','draft','clips'].map(function(f) {
            return (
              <button key={f} onClick={function() { setFilter(f); }}
                className="px-3 py-1.5 rounded-lg font-black uppercase text-[11px]"
                style={{ background: filter===f ? GOLD + '20' : 'rgba(255,255,255,0.04)', color: filter===f ? GOLD : CREAM+'50', border: filter===f ? '1px solid ' + GOLD + '40' : '1px solid rgba(255,255,255,0.08)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                {f}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[{v:'newest',l:'Newest'},{v:'views',l:'Views'},{v:'longest',l:'Longest'}].map(function(opt) {
              return (
                <button key={opt.v} onClick={function() { setSort(opt.v); }}
                  className="text-[10px] px-2 py-1 rounded-lg font-black uppercase"
                  style={{ background: sort===opt.v ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid ' + (sort===opt.v ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'), color: sort===opt.v ? GOLD : CREAM, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {opt.l}
                </button>
              );
            })}
          </div>
          <button onClick={function() { setShowCreate(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-[10px]"
            style={{ background: BURGUNDY, color: GOLD, border: '1px solid rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <Plus className="w-3 h-3" /> Upload
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(function(v) {
          return (
            <Card key={v.id}>
              <div className="aspect-video relative overflow-hidden rounded-t-xl bg-black">
                {v.thumbnail_url
                  ? <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-6 h-6" style={{ color: GOLD + '40' }} />
                    </div>}
                <span className="absolute top-1.5 right-1.5 text-[7px] font-black uppercase px-1.5 py-0.5 rounded"
                  style={{ background: (statusColors[v.status] || CREAM) + '20', color: statusColors[v.status] || CREAM, border: '1px solid ' + (statusColors[v.status] || CREAM) + '30' }}>
                  {v.status}
                </span>
              </div>
              <div className="p-2.5 space-y-1">
                <p className="text-[10px] font-bold text-white leading-tight line-clamp-1">{v.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: CREAM + '40' }}>{(v.views || 0).toLocaleString()} views</span>
                  <div className="flex gap-1">
                    <button onClick={function() { setEditVod(v); }}
                      className="w-5 h-5 flex items-center justify-center rounded"
                      style={{ background: GOLD + '15', color: GOLD }}>
                      <Edit className="w-2.5 h-2.5" />
                    </button>
                    <button onClick={function() { deleteMut.mutate(v.id); }}
                      className="w-5 h-5 flex items-center justify-center rounded"
                      style={{ background: 'rgba(255,68,68,0.1)', color: '#FF4444' }}>
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="col-span-4 text-center py-10 text-[11px]" style={{ color: CREAM + '30' }}>No content yet</p>}
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase" style={{ color: CREAM + '40', fontFamily: 'Barlow Condensed, sans-serif' }}>AI Highlights</p>
          <div className="space-y-1.5">
            {highlights.slice(0, 5).map(function(h) {
              return (
                <Card key={h.id}>
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: GOLD + '15', border: '1px solid ' + GOLD + '30' }}>
                      <Play className="w-3.5 h-3.5" style={{ color: GOLD }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white">{h.title || 'Stream Highlight'}</p>
                      <p className="text-[11px]" style={{ color: CREAM + '40' }}>
                        {h.highlight_type} · {Math.floor((h.start_time||0)/60)}:{String((h.start_time||0)%60).padStart(2,'0')}
                      </p>
                    </div>
                    <span className="text-[11px] font-black px-1.5 py-0.5 rounded"
                      style={{ background: GOLD + '15', color: GOLD }}>
                      {Math.round((h.ai_confidence || 0) * 100)}%
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {(showCreate || editVod) && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.7)' }}
              onClick={function() { setShowCreate(false); setEditVod(null); }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl p-5 space-y-3"
              style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div className="flex items-center justify-between">
                <span className="font-black uppercase text-sm" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>{editVod ? 'Edit VOD' : 'Upload VOD'}</span>
                <button onClick={function() { setShowCreate(false); setEditVod(null); }}><X className="w-4 h-4 text-white/40" /></button>
              </div>
              {[
                { field: 'title', placeholder: 'Title' },
                { field: 'video_url', placeholder: 'Video URL' },
                { field: 'description', placeholder: 'Description' },
              ].map(function(item) {
                var field = item.field;
                var placeholder = item.placeholder;
                return (
                  <input key={field} placeholder={placeholder}
                    value={(editVod ? editVod : form)[field] || ''}
                    onChange={function(e) { if (editVod) { setEditVod(function(v) { return {...v, [field]: e.target.value}; }); } else { setForm(function(f) { return {...f, [field]: e.target.value}; }); } }}
                    className="w-full px-3 py-2 rounded-lg text-[11px] outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                );
              })}
              <div className="flex flex-wrap gap-1.5">
                {['draft','published','unlisted'].map(function(s) {
                  var cur = (editVod ? editVod : form).status;
                  return <button key={s} onClick={function() { if (editVod) { setEditVod(function(v) { return {...v, status: s}; }); } else { setForm(function(f) { return {...f, status: s}; }); } }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase"
                    style={{ background: cur===s ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid ' + (cur===s ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'), color: cur===s ? GOLD : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif', cursor: 'pointer' }}>{s}</button>;
                })}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['gaming','music','education','talk','other'].map(function(c) {
                  var cur = (editVod ? editVod : form).category;
                  return <button key={c} onClick={function() { if (editVod) { setEditVod(function(v) { return {...v, category: c}; }); } else { setForm(function(f) { return {...f, category: c}; }); } }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase"
                    style={{ background: cur===c ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid ' + (cur===c ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'), color: cur===c ? GOLD : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif', cursor: 'pointer' }}>{c}</button>;
                })}
              </div>
              <button
                onClick={function() { if (editVod) { updateMut.mutate({ id: editVod.id, data: editVod }); } else { createMut.mutate(); } }}
                className="w-full py-2.5 rounded-xl font-black uppercase text-[11px]"
                style={{ background: BURGUNDY, color: GOLD, border: '1px solid rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                {editVod ? 'Save Changes' : 'Create VOD'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Recording Manager */}
      {(user && user.id) && (
        <div className="mt-4">
          <RecordingManager userId={user.id} />
        </div>
      )}
    </div>
  );
}

/* ═══════════════ COMMUNITY TAB ═══════════════ */
function CommunityTab({ user }) {
  var [selectedCommunity, setSelectedCommunity] = useState(null);
  var [showPollForm, setShowPollForm] = useState(false);
  var [pollForm, setPollForm] = useState({ question: '', options: ['',''], ends_at: '' });
  var qc = useQueryClient();

  var { data: communities = [] } = useQuery({
    queryKey: ['db-communities', (user && user.id)],
    queryFn: function() { return base44.entities.Community.filter({ owner_id: (user && user.id) }); },
    enabled: !!(user && user.id),
  });
  useEffect(function() { if (communities.length && !selectedCommunity) setSelectedCommunity(communities[0] && communities[0].id); }, [communities]);

  var { data: polls = [] } = useQuery({
    queryKey: ['db-polls', selectedCommunity],
    queryFn: function() { return base44.entities.Poll.filter({ community_id: selectedCommunity }); },
    enabled: !!selectedCommunity,
    refetchInterval: 5000,
  });
  var { data: challenges = [] } = useQuery({
    queryKey: ['db-challenges', selectedCommunity],
    queryFn: function() { return base44.entities.Challenge.filter({ community_id: selectedCommunity }); },
    enabled: !!selectedCommunity,
  });

  var createPollMut = useMutation({
    mutationFn: function() {
      return base44.entities.Poll.create({
        community_id: selectedCommunity,
        creator_id: (user && user.id),
        question: pollForm.question,
        options: pollForm.options.filter(Boolean).map(function(o) { return { text: o, votes: 0 }; }),
        ends_at: pollForm.ends_at || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        status: 'active',
        total_votes: 0,
      });
    },
    onSuccess: function(poll) {
      qc.invalidateQueries({ queryKey: ['db-polls'] });
      setShowPollForm(false);
      toast.success('Poll created!');
      if ((user && user.id)) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'milestone',
          title: 'Created poll: ' + ((poll && poll.question) || 'Community Poll'),
        }).catch(function() {});
      }
    },
    onError: function() { toast.error('Action failed.'); },
  });

  var endPollMut = useMutation({
    mutationFn: function(id) { return base44.entities.Poll.update(id, { status: 'ended' }); },
    onSuccess: function() { return qc.invalidateQueries({ queryKey: ['db-polls'] }); },
    onError: function() { toast.error('Action failed.'); },
  });

  return (
    <div className="space-y-4">
      {/* Community selector */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex flex-wrap gap-1.5">
          {communities.length === 0
            ? <span className="text-[11px] px-3 py-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>No communities yet</span>
            : communities.map(function(c) {
              return (
                <button key={c.id} onClick={function() { setSelectedCommunity(c.id); }}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-black"
                  style={{ background: selectedCommunity===c.id ? 'rgba(212,175,55,0.15)' : 'rgba(8,11,24,0.9)', border: '1px solid ' + (selectedCommunity===c.id ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.2)'), color: selectedCommunity===c.id ? GOLD : CREAM, fontFamily: 'Barlow Condensed, sans-serif', cursor: 'pointer' }}>
                  {c.name}
                </button>
              );
            })
          }
        </div>
      </div>

      {/* Spotlight banner + section */}
      {selectedCommunity && (
        <div className="space-y-3">
          <SpotlightBanner communityId={selectedCommunity} isAdmin={true} />
          <SpotlightSection communityId={selectedCommunity} />
        </div>
      )}

      {/* Polls section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black uppercase" style={{ color: CREAM + '60', fontFamily: 'Barlow Condensed, sans-serif' }}>Active Polls</p>
          <button onClick={function() { setShowPollForm(true); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-black uppercase text-[11px]"
            style={{ background: GOLD + '15', color: GOLD, border: '1px solid ' + GOLD + '30', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <Plus className="w-3 h-3" /> Poll
          </button>
        </div>

        {polls.filter(function(p) { return p.status === 'active'; }).map(function(poll) {
          return (
            <PollCard key={'pc-' + poll.id} poll={poll} />
          );
        })}
        {polls.filter(function(p) { return p.status === 'active'; }).map(function(poll) {
          var opts = Array.isArray(poll.options) ? poll.options : [];
          var total = poll.total_votes || 1;
          return (
            <Card key={poll.id}>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-[12px] text-white">{poll.question}</p>
                  <button onClick={function() { endPollMut.mutate(poll.id); }}
                    className="text-[11px] px-2 py-1 rounded font-black uppercase shrink-0"
                    style={{ background: 'rgba(255,68,68,0.1)', color: '#FF4444', fontFamily: 'Barlow Condensed, sans-serif' }}>End</button>
                </div>
                <div className="space-y-1.5">
                  {opts.map(function(o, i) {
                    var label = typeof o === 'object' ? o.text : o;
                    var votes = typeof o === 'object' ? (o.votes || 0) : 0;
                    var pct = Math.round((votes / total) * 100);
                    return (
                      <div key={i} className="space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                          <span style={{ color: CREAM + '70' }}>{label}</span>
                          <span style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <div className="h-full rounded-full" style={{ width: pct + '%', background: GOLD }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px]" style={{ color: CREAM + '30' }}>{poll.total_votes || 0} total votes</p>
              </div>
            </Card>
          );
        })}
        {polls.filter(function(p) { return p.status === 'active'; }).length === 0 && (
          <p className="text-center py-4 text-[11px]" style={{ color: CREAM + '25' }}>No active polls</p>
        )}
      </div>

      {/* Challenges section */}
      <div className="space-y-3">
        <p className="text-[11px] font-black uppercase" style={{ color: CREAM + '60', fontFamily: 'Barlow Condensed, sans-serif' }}>Challenges</p>
        {challenges.map(function(c) {
          var progress = c.goal_value > 0 ? Math.min(100, Math.round((c.participant_count || 0) / c.goal_value * 100)) : 0;
          return (
            <Card key={c.id}>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-[11px] text-white">{c.title}</p>
                  <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded"
                    style={{ background: GOLD + '15', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>{c.challenge_type}</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: CREAM + '40' }}>{c.participant_count || 0} / {c.goal_value || 0}</span>
                    <span style={{ color: GOLD }}>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full" style={{ width: progress + '%', background: GOLD }} />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {challenges.length === 0 && <p className="text-center py-4 text-[11px]" style={{ color: CREAM + '25' }}>No challenges</p>}
      </div>

      {/* Poll create modal */}
      <AnimatePresence>
        {showPollForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={function() { setShowPollForm(false); }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl p-5 space-y-3"
              style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div className="flex items-center justify-between">
                <span className="font-black uppercase" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>Create Poll</span>
                <button onClick={function() { setShowPollForm(false); }}><X className="w-4 h-4 text-white/40" /></button>
              </div>
              <input placeholder="Question" value={pollForm.question} onChange={function(e) { setPollForm(function(f) { return {...f, question: e.target.value}; }); }}
                className="w-full px-3 py-2 rounded-lg text-[11px] outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
              {pollForm.options.map(function(o, i) {
                return (
                  <input key={i} placeholder={'Option ' + (i+1)} value={o} onChange={function(e) { setPollForm(function(f) { return {...f, options: f.options.map(function(x, j) { return j===i ? e.target.value : x; })}; }); }}
                    className="w-full px-3 py-2 rounded-lg text-[11px] outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                );
              })}
              {pollForm.options.length < 6 && <button onClick={function() { setPollForm(function(f) { return {...f, options: f.options.concat([''])}; }); }} className="text-[11px] font-black" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>+ Add Option</button>}
              <button onClick={function() { createPollMut.mutate(); }} disabled={!pollForm.question}
                className="w-full py-2.5 rounded-xl font-black uppercase text-[11px]"
                style={{ background: BURGUNDY, color: GOLD, border: '1px solid rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Create Poll</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════ MONETIZATION TAB ═══════════════ */
function MonetizationTab({ user }) {
  var { data: tiers = [] } = useQuery({
    queryKey: ['db-tiers', (user && user.id)],
    queryFn: function() { return base44.entities.SubscriptionTier.filter({ creator_id: (user && user.id) }); },
    enabled: !!(user && user.id),
  });
  var { data: payout } = useQuery({
    queryKey: ['db-payout', (user && user.id)],
    queryFn: function() { return base44.entities.CreatorPayout.filter({ creator_id: (user && user.id) }).then(function(r) { return r[0]; }); },
    enabled: !!(user && user.id),
  });
  var { data: txns = [] } = useQuery({
    queryKey: ['db-txns', (user && user.id)],
    queryFn: function() { return base44.entities.Transaction.filter({ recipient_id: (user && user.id) }, '-created_date', 100); },
    enabled: !!(user && user.id),
  });
  var { data: goals = [] } = useQuery({
    queryKey: ['db-goals', (user && user.id)],
    queryFn: function() { return base44.entities.StreamerGoal.filter({ creator_id: (user && user.id) }); },
    enabled: !!(user && user.id),
  });
  var { data: dashCommunity } = useQuery({
    queryKey: ['dashCommunity-mt', (user && user.id)],
    queryFn: function() { return base44.entities.Community.filter({ owner_id: (user && user.id) }).then(function(r) { return r[0] || null; }); },
    enabled: !!(user && user.id),
  });
  var dashCommunityId = (dashCommunity && dashCommunity.id) || null;
  var { data: dashActiveRoom } = useQuery({
    queryKey: ['dashActiveRoom-mt', (user && user.id)],
    queryFn: function() { return base44.entities.Room.filter({ host_id: (user && user.id), status: 'live' }).then(function(r) { return r[0] || null; }); },
    enabled: !!(user && user.id),
  });
  var dashActiveRoomId = (dashActiveRoom && dashActiveRoom.id) || null;
  var qc = useQueryClient();
  var toggleTierMut = useMutation({
    mutationFn: function(params) { return base44.entities.SubscriptionTier.update(params.id, { is_active: params.is_active }); },
    onSuccess: function() { return qc.invalidateQueries({ queryKey: ['db-tiers'] }); },
    onError: function() { toast.error('Action failed.'); },
  });

  var tipTotal = txns.filter(function(t) { return t.type === 'tip'; }).reduce(function(s, t) { return s + (t.creator_payout || t.creator_amount || 0); }, 0);
  var subTotal = txns.filter(function(t) { return t.type === 'subscription'; }).reduce(function(s, t) { return s + (t.creator_payout || t.creator_amount || 0); }, 0);
  var giftTotal = txns.filter(function(t) { return t.type === 'virtual_good'; }).reduce(function(s, t) { return s + (t.creator_payout || t.creator_amount || 0); }, 0);
  var total = tipTotal + subTotal + giftTotal;
  var creatorShare = Math.floor(total * 90) / 100;
  var platformShare = total - creatorShare;

  var pieData = [
    { name: 'Tips', value: tipTotal, color: GOLD },
    { name: 'Subs', value: subTotal, color: '#C9A84C' },
    { name: 'Gifts', value: giftTotal, color: '#D4AF37' },
  ].filter(function(d) { return d.value > 0; });

  return (
    <div className="space-y-5">
      {/* Subscription Tiers */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase" style={{ color: CREAM + '50', fontFamily: 'Barlow Condensed, sans-serif' }}>Subscription Tiers</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tiers.map(function(tier) {
            return (
              <Card key={tier.id}>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-sm" style={{ color: tier.color || GOLD }}>{tier.name}</p>
                    <button onClick={function() { toggleTierMut.mutate({ id: tier.id, is_active: !tier.is_active }); }}
                      className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded"
                      style={{ background: tier.is_active ? 'rgba(109,191,126,0.1)' : 'rgba(255,255,255,0.06)', color: tier.is_active ? '#6DBF7E' : CREAM + '40' }}>
                      {tier.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </div>
                  <p className="text-2xl font-black" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>${tier.price}<span className="text-[10px]">/mo</span></p>
                  <p className="text-[11px]" style={{ color: CREAM + '40' }}>{tier.subscriber_count || 0} subscribers</p>
                  <div className="space-y-0.5">
                    {(tier.benefits || []).slice(0, 3).map(function(b, i) {
                      return (
                        <p key={i} className="text-[11px] flex items-center gap-1" style={{ color: CREAM + '60' }}>
                          <span style={{ color: GOLD }}>✓</span> {b}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
          {tiers.length === 0 && <p className="text-[11px]" style={{ color: CREAM + '30' }}>No tiers yet — create them in Creator Subscriptions</p>}
        </div>
      </div>

      {/* Payout */}
      <Card>
        <div className="p-4 space-y-3">
          <p className="text-[10px] font-black uppercase" style={{ color: CREAM + '50', fontFamily: 'Barlow Condensed, sans-serif' }}>Payout Status</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px]" style={{ color: CREAM + '40' }}>Pending Balance</p>
              <p className="text-xl font-black" style={{ color: '#6DBF7E', fontFamily: 'Orbitron, monospace' }}>${Math.floor((payout && payout.pending_balance) || 0)}</p>
            </div>
            <div>
              <p className="text-[11px]" style={{ color: CREAM + '40' }}>Total Paid Out</p>
              <p className="text-xl font-black" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>${Math.floor((payout && payout.total_paid_out) || 0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-1.5 py-0.5 rounded font-black uppercase"
              style={{ background: (payout && payout.stripe_connected) ? 'rgba(109,191,126,0.12)' : 'rgba(255,68,68,0.12)', color: (payout && payout.stripe_connected) ? '#6DBF7E' : '#FF4444', fontFamily: 'Barlow Condensed, sans-serif' }}>
              {(payout && payout.stripe_connected) ? '● Stripe Connected' : '● Setup Stripe'}
            </span>
            {(payout && payout.last_payout_at) && <span className="text-[11px]" style={{ color: CREAM + '30' }}>Last: {new Date(payout.last_payout_at).toLocaleDateString()}</span>}
          </div>
        </div>
      </Card>

      {/* Revenue breakdown + 90/10 split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="p-4 space-y-3">
            <p className="text-[10px] font-black uppercase" style={{ color: CREAM + '50', fontFamily: 'Barlow Condensed, sans-serif' }}>Revenue Breakdown</p>
            {pieData.length > 0 ? (
              <div style={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value">
                      {pieData.map(function(d, i) { return <Cell key={i} fill={d.color} />; })}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(8,11,24,0.9)', border: '1px solid ' + GOLD + '30', color: CREAM }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-center py-6 text-[11px]" style={{ color: CREAM + '30' }}>No transactions yet</p>}
          </div>
        </Card>
        <Card>
          <div className="p-4 space-y-3">
            <p className="text-[10px] font-black uppercase" style={{ color: CREAM + '50', fontFamily: 'Barlow Condensed, sans-serif' }}>90/10 Creator Split</p>
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span style={{ color: '#6DBF7E' }}>Creator 90%</span>
                <span style={{ color: '#6DBF7E', fontFamily: 'Orbitron, monospace' }}>${creatorShare.toFixed(2)}</span>
              </div>
              <div className="h-6 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div className="h-full" animate={{ width: '90%' }} transition={{ duration: 1.2 }}
                  style={{ background: 'linear-gradient(90deg, #6DBF7E, #D4854A)' }} />
                <div className="h-full flex-1" style={{ background: 'rgba(192,57,43,0.3)' }} />
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span style={{ color: 'rgba(192,57,43,0.7)' }}>Platform 10%</span>
                <span style={{ color: 'rgba(192,57,43,0.7)', fontFamily: 'Orbitron, monospace' }}>${platformShare.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-1 space-y-1">
              <p className="text-[11px]" style={{ color: CREAM + '30' }}>Gift Shop: ${giftTotal.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Streamer Goals */}
      {goals.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase" style={{ color: CREAM + '50', fontFamily: 'Barlow Condensed, sans-serif' }}>Streamer Goals</p>
          {goals.map(function(g) {
            var progress = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount || 0) / g.target_amount * 100)) : 0;
            return (
              <Card key={g.id}>
                <div className="p-3 space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold text-white">{g.title}</span>
                    <span className="font-black" style={{ color: GOLD }}>{g.current_amount || 0} / {g.target_amount}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full" style={{ width: progress + '%', background: g.color || GOLD }} />
                  </div>
                  <span className="text-[7px] px-1.5 py-0.5 rounded font-black uppercase"
                    style={{ background: g.status === 'completed' ? 'rgba(109,191,126,0.12)' : GOLD + '12', color: g.status === 'completed' ? '#6DBF7E' : GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {g.status}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Subscription manager + tiers */}
      {(user && user.id) && (
        <div className="mb-4 space-y-4">
          <SubscriptionManager creatorId={user.id} />
          <SubscriptionTiers communityId={dashCommunityId} userId={user.id} />
        </div>
      )}

      {/* PPV manager */}
      {(user && user.id) && (
        <div className="mb-4">
          <PayPerViewManager roomId={dashActiveRoomId} />
          <PayPerViewCard event={null} />
        </div>
      )}

      {/* Virtual goods store */}
      {(user && user.id) && (
        <div className="mb-4">
          <VirtualGoodsStore userId={user.id} />
        </div>
      )}

      {/* Monetization center */}
      {(user && user.id) && (
        <div className="mb-4">
          <StreamerMonetizationCenter />
        </div>
      )}

      {/* Direct payments modal */}
      <DirectPayments isOpen={false} onClose={function() {}} creatorName={(user && user.full_name) || ''} />

      {/* Deep links to monetization pages */}
      <div className="flex flex-wrap gap-3 pt-2">
        {[
          { label: '💰 Monetization',       href: 'Monetization'        },
          { label: '⭐ Subscriptions',       href: 'CreatorSubscriptions' },
          { label: '🎛 Widgets',             href: 'MonetizationWidgets' },
          { label: '📊 Revenue Analytics',  href: 'Analytics'           },
        ].map(function(item) {
          return (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span className="font-black uppercase text-[10px] px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', display: 'block', cursor: 'pointer' }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════ SETTINGS TAB ═══════════════ */
function SettingsTab({ user }) {
  var [profile, setProfile] = useState({ display_name: '', bio: '', category: 'other', avatar_url: '', social_links: {} });
  var [schedule, setSchedule] = useState([]);
  var [prefs, setPrefs] = useState({});
  var [rtmpDests, setRtmpDests] = useState([]);
  var qc = useQueryClient();

  var { data: creatorProfile } = useQuery({
    queryKey: ['db-cprofile', (user && user.id)],
    queryFn: function() { return base44.entities.CreatorProfile.filter({ user_id: (user && user.id) }).then(function(r) { return r[0]; }); },
    enabled: !!(user && user.id),
  });
  var { data: destinations = [] } = useQuery({
    queryKey: ['db-rtmp', (user && user.id)],
    queryFn: function() { return base44.entities.RTMPDestination.filter({ creator_id: (user && user.id) }); },
    enabled: !!(user && user.id),
  });
  var { data: userPref } = useQuery({
    queryKey: ['db-userpref', (user && user.id)],
    queryFn: function() { return base44.entities.UserPreference.filter({ user_id: (user && user.id) }).then(function(r) { return r[0]; }); },
    enabled: !!(user && user.id),
  });

  useEffect(function() {
    if (creatorProfile) {
      setProfile({ display_name: creatorProfile.display_name || '', bio: creatorProfile.bio || '', category: creatorProfile.category || 'other', avatar_url: creatorProfile.avatar_url || '', social_links: creatorProfile.social_links || {} });
      setSchedule(creatorProfile.stream_schedule || []);
    }
  }, [creatorProfile]);
  useEffect(function() { if (destinations) setRtmpDests(destinations); }, [destinations]);
  useEffect(function() { if (userPref) setPrefs(userPref.notification_preferences || {}); }, [userPref]);

  var saveProfile = useMutation({
    mutationFn: function() {
      return (creatorProfile && creatorProfile.id)
        ? base44.entities.CreatorProfile.update(creatorProfile.id, { ...profile, stream_schedule: schedule })
        : base44.entities.CreatorProfile.create({ user_id: (user && user.id), ...profile, stream_schedule: schedule });
    },
    onSuccess: function() { qc.invalidateQueries({ queryKey: ['db-cprofile'] }); toast.success('Profile saved!'); },
    onError: function() { toast.error('Action failed.'); },
  });
  var savePrefs = useMutation({
    mutationFn: function() {
      return (userPref && userPref.id)
        ? base44.entities.UserPreference.update(userPref.id, { notification_preferences: prefs })
        : base44.entities.UserPreference.create({ user_id: (user && user.id), notification_preferences: prefs });
    },
    onSuccess: function() { toast.success('Preferences saved!'); },
    onError: function() { toast.error('Action failed.'); },
  });
  var toggleDest = useMutation({
    mutationFn: function(params) { return base44.entities.RTMPDestination.update(params.id, { is_enabled: params.is_enabled }); },
    onSuccess: function() { return qc.invalidateQueries({ queryKey: ['db-rtmp'] }); },
    onError: function() { toast.error('Action failed.'); },
  });
  var deleteDest = useMutation({
    mutationFn: function(id) { return base44.entities.RTMPDestination.delete(id); },
    onSuccess: function() { return qc.invalidateQueries({ queryKey: ['db-rtmp'] }); },
    onError: function() { toast.error('Action failed.'); },
  });

  var SOCIAL_FIELDS = ['twitter','instagram','tiktok','youtube','discord','website'];
  var NOTIF_KEYS = ['tip_alerts','new_subscriber','raid_received','challenge_completed','announcement'];
  var DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <Card>
        <div className="p-4 space-y-3">
          <p className="text-[10px] font-black uppercase" style={{ color: CREAM + '50', fontFamily: 'Barlow Condensed, sans-serif' }}>Profile Settings</p>
          {['display_name','bio','avatar_url'].map(function(field) {
            return (
              <div key={field}>
                <label className="text-[11px] uppercase font-black block mb-1" style={{ color: CREAM + '35', fontFamily: 'Barlow Condensed, sans-serif' }}>{field.replace('_',' ')}</label>
                {field === 'bio'
                  ? <textarea value={profile[field]} onChange={function(e) { setProfile(function(p) { return {...p, [field]: e.target.value}; }); }} rows={3}
                      className="w-full px-3 py-2 rounded-lg text-[11px] outline-none resize-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM }} />
                  : <input value={profile[field]} onChange={function(e) { setProfile(function(p) { return {...p, [field]: e.target.value}; }); }}
                      className="w-full px-3 py-2 rounded-lg text-[11px] outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM }} />}
              </div>
            );
          })}
          <div>
            <label className="text-[11px] uppercase font-black block mb-1" style={{ color: CREAM + '35', fontFamily: 'Barlow Condensed, sans-serif' }}>Category</label>
            <div className="flex flex-wrap gap-1.5">
              {['gaming','music','education','talk','fitness','cooking','art','tech','other'].map(function(c) {
                return (
                  <button key={c} onClick={function() { setProfile(function(p) { return {...p, category: c}; }); }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase"
                    style={{ background: profile.category===c ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid ' + (profile.category===c ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'), color: profile.category===c ? GOLD : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif', cursor: 'pointer' }}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase font-black block mb-2" style={{ color: CREAM + '35', fontFamily: 'Barlow Condensed, sans-serif' }}>Social Links</label>
            <div className="grid grid-cols-2 gap-2">
              {SOCIAL_FIELDS.map(function(s) {
                return (
                  <input key={s} placeholder={s} value={(profile.social_links && profile.social_links[s]) || ''}
                    onChange={function(e) { setProfile(function(p) { return {...p, social_links: {...p.social_links, [s]: e.target.value}}; }); }}
                    className="px-2 py-1.5 rounded-lg text-[10px] outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: CREAM }} />
                );
              })}
            </div>
          </div>
          <button onClick={function() { saveProfile.mutate(); }}
            className="px-5 py-2 rounded-xl font-black uppercase text-[10px]"
            style={{ background: BURGUNDY, color: GOLD, border: '1px solid rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            Save Profile
          </button>
        </div>
      </Card>

      {/* Stream Schedule */}
      <Card>
        <div className="p-4 space-y-3">
          <p className="text-[10px] font-black uppercase" style={{ color: CREAM + '50', fontFamily: 'Barlow Condensed, sans-serif' }}>Stream Schedule</p>
          <div className="space-y-1.5">
            {DAYS.map(function(day, i) {
              var slot = schedule.find(function(s) { return s.day === day; }) || {};
              return (
                <div key={day} className="flex items-center gap-2">
                  <span className="text-[11px] w-8 font-black" style={{ color: CREAM + '50', fontFamily: 'Barlow Condensed, sans-serif' }}>{day}</span>
                  <input type="time" value={slot.time || ''} onChange={function(e) { setSchedule(function(prev) {
                    var next = prev.filter(function(s) { return s.day !== day; });
                    if (e.target.value) next.push({ day: day, time: e.target.value, title: slot.title || '' });
                    return next;
                  }); }}
                    className="px-2 py-1 rounded text-[10px] outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: CREAM }} />
                  <input placeholder="Stream title" value={slot.title || ''} onChange={function(e) { setSchedule(function(prev) {
                    var next = prev.filter(function(s) { return s.day !== day; });
                    if (slot.time) next.push({ day: day, time: slot.time, title: e.target.value });
                    return next;
                  }); }}
                    className="flex-1 px-2 py-1 rounded text-[10px] outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: CREAM }} />
                </div>
              );
            })}
          </div>
          <button onClick={function() { saveProfile.mutate(); }}
            className="px-5 py-2 rounded-xl font-black uppercase text-[10px]"
            style={{ background: GOLD + '15', color: GOLD, border: '1px solid ' + GOLD + '30', fontFamily: 'Barlow Condensed, sans-serif' }}>
            Save Schedule
          </button>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <div className="p-4 space-y-3">
          <p className="text-[10px] font-black uppercase" style={{ color: CREAM + '50', fontFamily: 'Barlow Condensed, sans-serif' }}>Notifications</p>
          <div className="space-y-2">
            {NOTIF_KEYS.map(function(k) {
              return (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-[11px] capitalize" style={{ color: CREAM + '70' }}>{k.replace('_',' ')}</span>
                  <button onClick={function() { var n = {...prefs, [k]: !prefs[k]}; setPrefs(n); savePrefs.mutate(); }}
                    className="w-10 h-5 rounded-full relative transition-all"
                    style={{ background: prefs[k] ? GOLD : 'rgba(255,255,255,0.1)' }}>
                    <motion.div animate={{ x: prefs[k] ? 20 : 2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="absolute top-0.5 w-4 h-4 rounded-full"
                      style={{ background: prefs[k] ? '#000' : 'rgba(255,255,255,0.4)' }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* RTMP Destinations */}
      <Card>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase" style={{ color: CREAM + '50', fontFamily: 'Barlow Condensed, sans-serif' }}>RTMP Destinations</p>
            <Link to={createPageUrl('StreamInfra')}>
              <button className="text-[11px] font-black uppercase px-2 py-1 rounded"
                style={{ background: GOLD + '15', color: GOLD, border: '1px solid ' + GOLD + '25', fontFamily: 'Barlow Condensed, sans-serif' }}>
                Manage in Stream Setup
              </button>
            </Link>
          </div>
          {destinations.map(function(d) {
            return (
              <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-white">{d.label || d.platform}</p>
                  <p className="text-[11px]" style={{ color: CREAM + '35' }}>{(d.rtmp_url && d.rtmp_url.slice(0, 30))}…</p>
                </div>
                <button onClick={function() { toggleDest.mutate({ id: d.id, is_enabled: !d.is_enabled }); }}
                  className="w-9 h-5 rounded-full relative shrink-0"
                  style={{ background: d.is_enabled ? GOLD : 'rgba(255,255,255,0.1)' }}>
                  <motion.div animate={{ x: d.is_enabled ? 16 : 2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="absolute top-0.5 w-4 h-4 rounded-full"
                    style={{ background: d.is_enabled ? '#000' : 'rgba(255,255,255,0.4)' }} />
                </button>
                <button onClick={function() { deleteDest.mutate(d.id); }}>
                  <Trash2 className="w-3.5 h-3.5 text-white/20 hover:text-[#C0392B] transition-colors" />
                </button>
              </div>
            );
          })}
          {destinations.length === 0 && <p className="text-[10px]" style={{ color: CREAM + '25' }}>No destinations configured</p>}
        </div>
      </Card>

      {/* ZEGOCLOUD Streaming Engine */}
      <ZEGOConfigPanel user={user} />

      {/* Overlay Builder link */}
      <Link to="/OverlayBuilder">
        <div className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
          style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5" style={{ color: GOLD }} />
            <div>
              <p className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>OBS Overlay Builder</p>
              <p className="text-[11px]" style={{ color: CREAM + '40' }}>Design and export custom stream overlays</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: GOLD + '60' }} />
        </div>
      </Link>
    </div>
  );
}

/* ═══════════════ MAIN PAGE ═══════════════ */
export default function DashboardPage() {
  var [activeTab, setActiveTab] = useState('overview');
  var [showQuickAction, setShowQuickAction] = useState(false);
  var [showOnboarding, setShowOnboarding] = useState(false);
  var [showTierEditor, setShowTierEditor] = useState(false);
  var [editingTier, setEditingTier] = useState(null);
  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: function() { return base44.auth.me(); } });
  var { data: activeRoom } = useQuery({
    queryKey: ['dashboard-active-room', (user && user.id)],
    queryFn: function() { return base44.entities.Room.filter({ host_id: user.id, status: 'live' }).then(function(r) { return r[0] || null; }); },
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoomId = (activeRoom && activeRoom.id) || null;
  var { data: profile } = useQuery({
    queryKey: ['db-profile', (user && user.id)],
    queryFn: function() { return base44.entities.CreatorProfile.filter({ user_id: (user && user.id) }).then(function(r) { return r[0]; }); },
    enabled: !!(user && user.id),
  });
  var { data: dashCommunity } = useQuery({
    queryKey: ['dashCommunity', (user && user.id)],
    queryFn: function() { return base44.entities.Community.filter({ owner_id: (user && user.id) }).then(function(r) { return r[0] || null; }); },
    enabled: !!(user && user.id),
  });
  var dashCommunityId = (dashCommunity && dashCommunity.id) || null;

  return (
    <div className="min-h-screen" style={{ background: '#080B18' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 md:px-8 py-4" style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.12)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0"
                style={{ background: 'linear-gradient(135deg, #800020, #D4AF37)' }}>
                {(profile && profile.avatar_url)
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <Crown className="w-6 h-6 m-2.5 text-black" />}
              </div>
              <div>
                <h1 className="font-black text-lg uppercase leading-none" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>
                  {(profile && profile.display_name) || (user && user.full_name) || 'Creator Dashboard'}
                </h1>
                <p className="text-[11px] mt-0.5" style={{ color: CREAM + '40', fontFamily: 'Barlow Condensed, sans-serif' }}>SeeWhy LIVE Creator Studio</p>
              </div>
            </div>
            <Link to={createPageUrl('LiveRoom')}>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase text-[11px]"
                style={{ background: BURGUNDY, color: GOLD, border: '1px solid rgba(212,175,55,0.4)', boxShadow: '0 0 16px rgba(128,0,32,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                <Radio className="w-3.5 h-3.5" /> GO LIVE
              </button>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide gap-0">
            {TABS.map(function(t) {
              return (
                <button key={t.id} onClick={function() { setActiveTab(t.id); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 shrink-0 font-black uppercase text-[11px] transition-all border-b-2"
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    color: activeTab === t.id ? GOLD : CREAM + '35',
                    background: activeTab === t.id ? 'rgba(212,175,55,0.07)' : 'transparent',
                    borderBottomColor: activeTab === t.id ? GOLD : 'transparent',
                  }}>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {activeTab === 'overview'      && <OverviewTab user={user} />}
            {activeTab === 'analytics'    && <AnalyticsTab user={user} />}
            {activeTab === 'content'      && <ContentTab user={user} />}
            {activeTab === 'community'    && <CommunityTab user={user} />}
            {activeTab === 'monetization' && <MonetizationTab user={user} />}
            {activeTab === 'settings'     && <SettingsTab user={user} />}
          </motion.div>
        </AnimatePresence>
      </div>
      <SwanAIRecommendations roomId={activeRoomId} currentLayout="dashboard" viewerCount={(activeRoom && activeRoom.viewer_count) || 0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={activeRoomId} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      {(user && user.id) && <SubscriptionCard tier={'basic'} price={4.99} benefits={[]} communityId={null} creatorId={(user && user.id)} isSubscribed={false} />}
      {(user && user.id) && <TierSubscribeCard tier={null} currentSub={null} userId={user.id} creatorId={(user && user.id)} isHighlighted={false} />}
      <TierEditor open={showTierEditor} onClose={function() { setShowTierEditor(false); setEditingTier(null); }} creatorId={(user && user.id)} existing={editingTier} />
      <RewardShopEditor creatorId={(user && user.id)} />
      <QuickActionPanel isOpen={showQuickAction} onClose={function() { setShowQuickAction(false); }} />
      <OnboardingFlow isOpen={showOnboarding} onClose={function() { setShowOnboarding(false); }} />
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={(activeRoom && activeRoom.viewer_count) || 0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id)} roomId={activeRoomId} currentUser={user} />
      <HostAlertCenter />
      <ViewerCount count={(activeRoom && activeRoom.viewer_count) || 0} peakViewers={(activeRoom && activeRoom.peak_viewers) || 0} />
      <BackgroundCustomizer />
      <OnlinePresence userId={(user && user.id) || null} />
    </div>
  );
}
