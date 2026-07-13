import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, Gift, Users, Radio, Trophy, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import LeaderboardPanel from '../components/live/LeaderboardPanel';
import StreamGoals from '../components/live/StreamGoals';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AnnouncementFeed from '../components/community/AnnouncementFeed';
import PointsNotification from '../components/live/PointsNotification';
import SpotlightBanner from '../components/community/SpotlightBanner';
import EngagementBadgesDisplay from '../components/live/EngagementBadgesDisplay';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AnnouncementFeed from '../components/community/AnnouncementFeed';
import PointsNotification from '../components/live/PointsNotification';
import SpotlightBanner from '../components/community/SpotlightBanner';
import EngagementBadgesDisplay from '../components/live/EngagementBadgesDisplay';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';

const GOLD = '#D4AF37';
const PINK    = '#C0392B';
const T    = { fontFamily: 'Barlow Condensed, sans-serif' };

const TYPE_CONFIG = {
  tip:          { icon: Gift,      color: '#D4AF37' },
  subscription: { icon: Users,     color: '#C9A84C' },
  room_invite:  { icon: Radio,     color: '#C0392B' },
  challenge:    { icon: Trophy,    color: '#D4AF37' },
  announcement: { icon: Megaphone, color: '#D4AF37' },
  referral:     { icon: Gift,      color: '#6DBF7E' },
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  const { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;
  const { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', user?.id],
    queryFn: () => base44.entities.Community.filter({ owner_id: user?.id }).then(r => r[0] || null),
    enabled: !!user?.id,
  });
  const userCommunityId = userCommunity?.id || null;

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user?.id }, '-created_date', 50),
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => toast.error('Action failed.'),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => {
      toast.success('All marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Action failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => toast.error('Action failed.'),
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotifClick = (notif) => {
    if (!notif.is_read) markReadMutation.mutate(notif.id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: '#080B18', ...T }}>

      {/* ── sticky header ── */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" style={{ color: GOLD }} />
          <h1 className="font-black text-lg text-white leading-none" style={T}>Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full font-black text-[11px]"
              style={{ background: PINK, color: '#fff', ...T }}>{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="font-black text-[10px] uppercase transition-opacity hover:opacity-80"
            style={{ color: GOLD, ...T }}>
            {markAllReadMutation.isPending ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4">

        {/* ── empty state ── */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Bell className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.12)' }} />
            </div>
            <p className="font-black text-base uppercase" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
              No notifications yet
            </p>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Activity from tips, invites, and challenges will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const cfg  = TYPE_CONFIG[notif.type] || { icon: Bell, color: GOLD };
              const Icon = cfg.icon;
              return (
                <div
                  key={notif.id}
                  className="rounded-2xl flex items-start gap-3 p-4 transition-all cursor-pointer hover:brightness-110"
                  style={{
                    background: notif.is_read ? 'rgba(8,11,24,0.6)' : 'rgba(8,11,24,0.95)',
                    border: `1px solid ${notif.is_read ? 'rgba(255,255,255,0.06)' : `${cfg.color}35`}`,
                  }}
                  onClick={() => handleNotifClick(notif)}
                >
                  {/* ── left: colored icon circle (40px) ── */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}40` }}>
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>

                  {/* ── center ── */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-white leading-snug mb-0.5" style={T}>
                      {notif.title}
                    </h3>
                    <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
                        {format(new Date(notif.created_date), 'PPp')}
                      </span>
                      {notif.link && (
                        <span
                          className="text-[10px] font-black cursor-pointer hover:underline"
                          style={{ color: GOLD, ...T }}
                          onClick={(e) => { e.stopPropagation(); navigate(notif.link); }}>
                          View →
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── right: unread dot (PINK, 8px) + delete + mark-read ── */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full" style={{ background: PINK }} />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notif.id); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:brightness-125"
                      style={{ background: 'rgba(192,57,43,0.15)', color: 'rgba(212,133,74,0.8)', border: '1px solid rgba(192,57,43,0.3)' }}
                      title="Delete notification">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {!notif.is_read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(notif.id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:brightness-125"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                        title="Mark as read">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {user?.id && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <StreamGoals isHost={true} />
            <LeaderboardPanel roomId={activeRoomId} />
            <MilestoneAlerts creatorId={user.id} />
            <AnnouncementFeed communityId={userCommunityId} />
            <PointsNotification userId={user.id} />
            <EngagementBadgesDisplay roomId={activeRoomId} userId={user.id} creatorId={user?.id} />
            <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
          </div>
        )}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
        <OnlineUsersGrid compact maxVisible={10} />
        <ContentRecommendations />
        <CollaborationMatcher />
        <ChallengeLeaderboard challengeId={null} />
      </div>
    </div>
  );
}
