import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity as ActivityIcon, Radio, Users, Trophy, Gift, Award, Bell,
  DollarSign, Heart, MessageSquare, Star, Zap, Eye, TrendingUp,
  Check, Filter, RefreshCw, Scissors, Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import LeaderboardPanel from '../components/live/LeaderboardPanel';
import StreamGoals from '../components/live/StreamGoals';
import PresenceDot from '../components/shared/PresenceDot';
import OnlinePresence from '../components/shared/OnlinePresence';
import PointsNotification from '../components/live/PointsNotification';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import ShareToSocial from '../components/social/ShareToSocial';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const GREEN   = '#6DBF7E';
const AMBER   = '#D4854A';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };
const BG      = '#080B18';

const TYPE_CONFIG = {
  room_created:        { icon: Radio,          color: CRIMSON,  label: 'Went Live',        emoji: '🔴' },
  room_joined:         { icon: Radio,          color: CRIMSON,  label: 'Joined Stream',    emoji: '📺' },
  room_ended:          { icon: Radio,          color: AMBER,    label: 'Stream Ended',     emoji: '✅' },
  community_joined:    { icon: Users,          color: GOLD,     label: 'Joined Community', emoji: '👥' },
  subscription:        { icon: Star,           color: GOLD,     label: 'New Subscriber',   emoji: '⭐' },
  subscription_ended:  { icon: Star,           color: AMBER,    label: 'Sub Ended',        emoji: '↩️' },
  tip_sent:            { icon: DollarSign,     color: GOLD,     label: 'Tip Sent',         emoji: '💰' },
  tip_received:        { icon: DollarSign,     color: GOLD,     label: 'Tip Received',     emoji: '💎' },
  challenge_completed: { icon: Trophy,         color: GOLD,     label: 'Challenge Done',   emoji: '🏆' },
  badge_earned:        { icon: Award,          color: GREEN,    label: 'Badge Earned',     emoji: '🎖️' },
  clip_created:        { icon: Scissors,       color: AMBER,    label: 'Clip Created',     emoji: '✂️' },
  gift_sent:           { icon: Gift,           color: GOLD,     label: 'Gift Sent',        emoji: '🎁' },
  gift_received:       { icon: Gift,           color: GOLD,     label: 'Gift Received',    emoji: '🎁' },
  follow:              { icon: Heart,          color: CRIMSON,  label: 'New Follower',     emoji: '❤️' },
  message:             { icon: MessageSquare,  color: AMBER,    label: 'Message',          emoji: '💬' },
  raid_sent:           { icon: Zap,            color: GOLD,     label: 'Raid Sent',        emoji: '⚡' },
  raid_received:       { icon: Zap,            color: GOLD,     label: 'Raid Received',    emoji: '⚡' },
  milestone:           { icon: TrendingUp,     color: GREEN,    label: 'Milestone',        emoji: '🎯' },
  stream_scheduled:    { icon: Calendar,       color: GOLD,     label: 'Stream Scheduled', emoji: '📅' },
  ppv_purchase:        { icon: Eye,            color: GOLD,     label: 'PPV Purchase',     emoji: '🎬' },
};

const FILTERS = [
  { id: 'all',     label: 'All' },
  { id: 'streams', label: 'Streams',   types: ['room_created', 'room_joined', 'room_ended'] },
  { id: 'money',   label: 'Earnings',  types: ['tip_sent', 'tip_received', 'gift_sent', 'gift_received', 'subscription', 'ppv_purchase'] },
  { id: 'social',  label: 'Social',    types: ['follow', 'community_joined', 'raid_sent', 'raid_received', 'message'] },
  { id: 'achieve', label: 'Milestones', types: ['challenge_completed', 'badge_earned', 'milestone', 'clip_created'] },
];

function fmtRelative(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000)   return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
  return new Date(dateStr).toLocaleDateString();
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function groupByDate(items) {
  const groups = {};
  items.forEach(item => {
    const key = fmtDate(item.created_date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}

export default function ActivityPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const roomId = new URLSearchParams(window.location.search).get('room_id');

  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['activities', user?.id],
    queryFn: () => base44.entities.Activity.list('-created_date', 200),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user?.id }, '-created_date', 50),
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!user?.id) return;
    const unsub = base44.entities.Activity.subscribe(() => {
      qc.invalidateQueries({ queryKey: ['activities', user.id] });
    });
    return unsub;
  }, [user?.id, qc]);

  const markAllNotifRead = useMutation({
    mutationFn: () => Promise.all(
      notifications.filter(n => !n.is_read).map(n =>
        base44.entities.Notification.update(n.id, { is_read: true })
      )
    ),
    onError: () => toast.error('Failed to mark notifications as read.'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const myActivities = activities.filter(a =>
    a.user_id === user?.id || a.creator_id === user?.id || a.recipient_id === user?.id
  );

  const unreadNotifs = notifications.filter(n => !n.is_read);

  const filterCfg = FILTERS.find(f => f.id === filter);
  const filtered = myActivities.filter(a => {
    if (filter !== 'all' && filterCfg?.types && !filterCfg.types.includes(a.type)) return false;
    return true;
  });

  const grouped = groupByDate(filtered);
  const dateKeys = Object.keys(grouped);

  // Stats summary
  const streamsThisWeek = myActivities.filter(a => {
    const isStream = ['room_created', 'room_ended'].includes(a.type);
    const isRecent = Date.now() - new Date(a.created_date).getTime() < 7 * 86400000;
    return isStream && isRecent;
  }).length;

  const tipsThisWeek = myActivities
    .filter(a => a.type === 'tip_received' && Date.now() - new Date(a.created_date).getTime() < 7 * 86400000)
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const badgesEarned = myActivities.filter(a => a.type === 'badge_earned').length;
  const totalFollowers = myActivities.filter(a => a.type === 'follow').length;

  return (
    <div className="min-h-screen pb-20" style={{ background: BG }}>
      {user?.id && <MilestoneAlerts creatorId={user.id} />}

      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-5 h-5" style={{ color: GOLD }} />
            <h1 className="font-black text-xl text-white" style={T}>Activity</h1>
            {unreadNotifs.length > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black"
                style={{ background: CRIMSON, color: '#fff', ...T }}>
                {unreadNotifs.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadNotifs.length > 0 && (
              <button onClick={() => markAllNotifRead.mutate()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>
                <Check className="w-3 h-3" /> Mark read
              </button>
            )}
            <button onClick={() => refetch()}
              className="flex items-center justify-center w-8 h-8 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-5">

        {/* Stats row */}
        {user?.id && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-2">
            {[
              { label: 'Streams', value: streamsThisWeek, color: CRIMSON, suffix: 'this wk' },
              { label: 'Tips In', value: `$${tipsThisWeek.toFixed(0)}`, color: GOLD, suffix: 'this wk' },
              { label: 'Badges', value: badgesEarned, color: GREEN, suffix: 'total' },
              { label: 'Followers', value: totalFollowers, color: AMBER, suffix: 'total' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl px-3 py-2.5 text-center"
                style={{ background: 'rgba(8,11,24,0.9)', border: `1px solid ${stat.color}20` }}>
                <p className="font-black text-lg leading-none" style={{ color: stat.color, fontFamily: 'Orbitron, monospace' }}>{stat.value}</p>
                <p className="text-[9px] uppercase mt-1" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase border transition-all"
              style={{
                ...T,
                background: filter === f.id ? `rgba(212,175,55,0.12)` : 'transparent',
                border: `1px solid ${filter === f.id ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: filter === f.id ? GOLD : 'rgba(255,255,255,0.4)',
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Unread notifications banner */}
        {unreadNotifs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-3"
            style={{ background: 'rgba(128,0,32,0.12)', border: '1px solid rgba(128,0,32,0.3)' }}>
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 shrink-0" style={{ color: CRIMSON }} />
              <div className="flex-1">
                <p className="font-black text-sm text-white" style={T}>
                  {unreadNotifs.length} unread notification{unreadNotifs.length > 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {unreadNotifs.slice(0, 3).map(n => (
                    <span key={n.id} className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>
                      {n.title}
                    </span>
                  ))}
                  {unreadNotifs.length > 3 && (
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
                      +{unreadNotifs.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <Link to={createPageUrl('Notifications')}>
                <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg shrink-0"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, ...T }}>
                  View All
                </span>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Activity feed */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 mb-3 animate-spin" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-sm font-black uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>Loading activity…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ActivityIcon className="w-14 h-14 mb-3" style={{ color: 'rgba(255,255,255,0.08)' }} />
            <p className="font-black text-sm uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>
              {filter === 'all' ? 'No activity yet' : `No ${filterCfg?.label.toLowerCase()} activity`}
            </p>
            {filter === 'all' && (
              <Link to={createPageUrl('GoLive')}>
                <span className="mt-2 text-[10px] font-black uppercase px-4 py-2 rounded-xl cursor-pointer inline-block"
                  style={{ background: 'rgba(128,0,32,0.15)', border: '1px solid rgba(128,0,32,0.35)', color: AMBER, ...T }}>
                  Go Live to get started
                </span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {dateKeys.map(dateKey => (
              <div key={dateKey}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <span className="text-[10px] font-black uppercase px-2"
                    style={{ color: 'rgba(255,255,255,0.25)', ...T }}>{dateKey}</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {grouped[dateKey].map((activity, i) => {
                      const cfg = TYPE_CONFIG[activity.type] || { icon: ActivityIcon, color: GOLD, label: activity.type, emoji: '📌' };
                      const Icon = cfg.icon;
                      return (
                        <motion.div key={activity.id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="flex items-start gap-3 px-3 py-3 rounded-xl"
                          style={{ background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          {/* Icon */}
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}22` }}>
                            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-black uppercase mr-2"
                                  style={{ color: cfg.color, ...T }}>{cfg.emoji} {cfg.label}</span>
                                <p className="font-black text-sm text-white leading-snug mt-0.5" style={T}>
                                  {activity.title || activity.description || cfg.label}
                                </p>
                                {activity.description && activity.title && (
                                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    {activity.description}
                                  </p>
                                )}
                                {activity.amount != null && activity.amount > 0 && (
                                  <p className="text-[11px] font-black mt-1" style={{ color: GOLD, ...T }}>
                                    💎 ${parseFloat(activity.amount).toFixed(2)}
                                  </p>
                                )}
                              </div>
                              <span className="text-[10px] shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>
                                {fmtRelative(activity.created_date)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}

        {user?.id && (
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <LeaderboardPanel roomId={roomId} />
            <StreamGoals isHost={false} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '16px 0 24px' }}>
          {[
            { label: '🏠 Home',          href: 'Home'           },
            { label: '📊 Dashboard',     href: 'Dashboard'      },
            { label: '👤 Profile',       href: 'Profile'        },
            { label: '🔔 Notifications', href: 'Notifications'  },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', cursor: 'pointer' }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <OnlineUsersGrid compact maxVisible={12} />
        <OnlinePresence userId={user?.id} showLabel />
        <PresenceDot userId={user?.id} />
        <PointsNotification userId={user?.id} />
        <CollaborationMatcher />
        <ContentRecommendations />
        <SwanAIRecommendations roomId={roomId} currentLayout="default" viewerCount={0} />
      </div>
    </div>
  );
}
