import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, Gift, Users, Radio, Trophy, Megaphone, Zap } from 'lucide-react';
import { format, isToday, isThisWeek } from 'date-fns';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '../utils';

const GOLD = '#D4AF37';
const PINK = '#C0392B';
const T    = { fontFamily: 'Barlow Condensed, sans-serif' };

const TYPE_CONFIG = {
  tip:          { icon: Gift,      color: '#D4AF37', label: 'Tip' },
  subscription: { icon: Users,     color: '#C9A84C', label: 'Sub' },
  room_invite:  { icon: Radio,     color: '#C0392B', label: 'Invite' },
  challenge:    { icon: Trophy,    color: '#D4AF37', label: 'Battle' },
  announcement: { icon: Megaphone, color: '#D4AF37', label: 'News' },
  referral:     { icon: Gift,      color: '#6DBF7E', label: 'Referral' },
  live_now:     { icon: Radio,     color: '#C0392B', label: 'Live' },
  battle_result:{ icon: Trophy,    color: '#D4AF37', label: 'Result' },
};

const FILTER_TABS = [
  { id: 'all',    label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'live',   label: '🔴 Live' },
  { id: 'tips',   label: '💸 Tips' },
  { id: 'invites',label: '📨 Invites' },
];

function groupNotifications(notifs) {
  const today = [], week = [], earlier = [];
  notifs.forEach(n => {
    const d = new Date(n.created_date);
    if (isToday(d)) today.push(n);
    else if (isThisWeek(d)) week.push(n);
    else earlier.push(n);
  });
  return [
    today.length   ? { label: 'Today',     items: today   } : null,
    week.length    ? { label: 'This Week',  items: week    } : null,
    earlier.length ? { label: 'Earlier',    items: earlier } : null,
  ].filter(Boolean);
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user?.id }, '-created_date', 50),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
    onError: () => {},
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => { toast.success('All marked as read'); queryClient.invalidateQueries(['notifications']); },
    onError: () => { toast.error('Failed to mark all as read. Please try again.'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
    onError: () => { toast.error('Failed to delete notification. Please try again.'); },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const liveNotifs  = notifications.filter(n => n.type === 'live_now' && !n.is_read);

  const filtered = useMemo(() => {
    switch (activeFilter) {
      case 'unread':  return notifications.filter(n => !n.is_read);
      case 'live':    return notifications.filter(n => n.type === 'live_now');
      case 'tips':    return notifications.filter(n => n.type === 'tip');
      case 'invites': return notifications.filter(n => n.type === 'room_invite' || n.type === 'challenge');
      default:        return notifications;
    }
  }, [notifications, activeFilter]);

  const groups = useMemo(() => groupNotifications(filtered), [filtered]);

  const handleNotifClick = (notif) => {
    if (!notif.is_read) markReadMutation.mutate(notif.id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: '#080B18', ...T }}>

      {/* ── sticky header ── */}
      <div className="sticky top-0 z-20 px-4 py-3" style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: GOLD }} />
            <h1 className="font-black text-lg text-white leading-none" style={T}>Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full font-black text-[11px]"
                style={{ background: PINK, color: '#fff', ...T }}>{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="font-black text-[10px] uppercase transition-opacity hover:opacity-80"
              style={{ color: GOLD, ...T }}>
              {markAllReadMutation.isPending ? 'Marking…' : 'Mark all read'}
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {FILTER_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveFilter(tab.id)}
              className="shrink-0 px-3 py-1 rounded-full text-xs font-black transition-all"
              style={{
                background: activeFilter === tab.id ? `${GOLD}15` : 'rgba(255,255,255,0.04)',
                border: activeFilter === tab.id ? `1px solid ${GOLD}50` : '1px solid rgba(255,255,255,0.08)',
                color: activeFilter === tab.id ? GOLD : 'rgba(255,255,255,0.45)',
                ...T,
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-1">

        {/* ── Live Now banner ── */}
        <AnimatePresence>
          {liveNotifs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4 cursor-pointer"
              style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.4)' }}
              onClick={() => navigate(createPageUrl('Discover'))}>
              <motion.div className="w-2 h-2 rounded-full shrink-0" style={{ background: PINK }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
              <div className="flex-1">
                <p className="font-black text-sm text-white" style={T}>
                  {liveNotifs.length} stream{liveNotifs.length > 1 ? 's' : ''} LIVE now
                </p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Tap to discover live rooms →</p>
              </div>
              <Radio className="w-4 h-4 shrink-0" style={{ color: PINK }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── empty state ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Bell className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.12)' }} />
            </div>
            <p className="font-black text-base uppercase" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
              {activeFilter === 'all' ? 'No notifications yet' : `No ${activeFilter} notifications`}
            </p>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Activity from tips, invites, and challenges will appear here
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.18)', ...T }}>← swipe to dismiss</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label} className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest mb-2 px-1"
                style={{ color: 'rgba(255,255,255,0.25)', ...T }}>{group.label}</p>
              <div className="space-y-2">
                {group.items.map((notif) => {
                  const cfg  = TYPE_CONFIG[notif.type] || { icon: Bell, color: GOLD };
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-2xl flex items-start gap-3 p-4 transition-all cursor-pointer hover:brightness-110"
                      style={{
                        background: notif.is_read ? 'rgba(13,6,24,0.6)' : 'rgba(13,6,24,0.95)',
                        border: `1px solid ${notif.is_read ? 'rgba(255,255,255,0.06)' : `${cfg.color}35`}`,
                      }}
                      onClick={() => handleNotifClick(notif)}>
                      {/* icon */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}40` }}>
                        {notif.type === 'live_now' ? (
                          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.9, repeat: Infinity }}>
                            <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                          </motion.div>
                        ) : (
                          <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                        )}
                      </div>
                      {/* content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="font-black text-sm text-white leading-snug" style={T}>{notif.title}</h3>
                          {cfg.label && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}30`, ...T }}>
                              {cfg.label}
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
                            {format(new Date(notif.created_date), 'PPp')}
                          </span>
                          {notif.link && (
                            <span className="text-[10px] font-black cursor-pointer hover:underline"
                              style={{ color: GOLD, ...T }}
                              onClick={(e) => { e.stopPropagation(); navigate(notif.link); }}>
                              View →
                            </span>
                          )}
                        </div>
                      </div>
                      {/* actions */}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full" style={{ background: PINK }} />
                        )}
                        <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notif.id); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:brightness-125"
                          style={{ background: 'rgba(255,30,80,0.12)', color: 'rgba(255,80,80,0.6)', border: '1px solid rgba(255,30,80,0.2)' }}
                          title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {!notif.is_read && (
                          <button onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(notif.id); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:brightness-125"
                            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                            title="Mark read">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
