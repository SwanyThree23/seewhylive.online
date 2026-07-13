import React from 'react';
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
const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TYPE_CONFIG = {
  room_created:        { icon: Radio,        color: '#C0392B' },
  room_joined:         { icon: Radio,        color: '#C0392B' },
  community_joined:    { icon: Users,        color: '#C9A84C' },
  subscription:        { icon: Users,        color: '#C9A84C' },
  tip_sent:            { icon: Gift,         color: GOLD      },
  challenge_completed: { icon: Trophy,       color: '#D4AF37' },
  badge_earned:        { icon: Award,        color: '#6DBF7E' },
};

export default function ActivityPage() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-created_date', 100),
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
    <div className="min-h-screen pb-8" style={{ background: '#080B18' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 flex items-center gap-2 px-4 py-3"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <ActivityIcon className="w-5 h-5" style={{ color: GOLD }} />
        <h1 className="font-black text-lg text-white" style={T}>Activity Feed</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ActivityIcon className="w-14 h-14 mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No activity yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => {
              const cfg = TYPE_CONFIG[activity.type] || { icon: ActivityIcon, color: GOLD };
              const Icon = cfg.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-white leading-snug" style={T}>{activity.title}</p>
                    {activity.description && (
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{activity.description}</p>
                    )}
                    <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
                      {format(new Date(activity.created_date), 'PPp')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={user?.id || null} roomId={null} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}
