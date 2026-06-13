import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Bell, CheckCircle2, Zap, Users, Target, Trophy, Gift, Heart, Star, Radio, Check } from 'lucide-react';
import { isSafeUrl } from '@/lib/security';

const G = '#D4AF37';
const BG = '#080B18';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

const ICON_MAP = {
  poll_created:          <Target className="w-4 h-4" />,
  poll_closed:           <CheckCircle2 className="w-4 h-4" />,
  raid_incoming:         <Users className="w-4 h-4" />,
  raid_outgoing:         <Zap className="w-4 h-4" />,
  engagement_milestone:  <Trophy className="w-4 h-4" />,
  tip:                   <Heart className="w-4 h-4" style={{ color: '#C0392B' }} />,
  love_tap:              <Heart className="w-4 h-4" style={{ color: '#C0392B' }} />,
  gift:                  <Gift className="w-4 h-4" style={{ color: '#D4AF37' }} />,
  subscription:          <Star className="w-4 h-4" style={{ color: '#D4AF37' }} />,
  live_started:          <Radio className="w-4 h-4" style={{ color: '#C0392B' }} />,
  system:                <Bell className="w-4 h-4" />,
};

const CATEGORY_TYPES = {
  tips:   ['tip', 'love_tap', 'gift'],
  subs:   ['subscription'],
  live:   ['live_started', 'raid_incoming', 'raid_outgoing'],
  system: ['poll_created', 'poll_closed', 'engagement_milestone', 'system'],
};

const PRIORITY_COLORS = {
  low: 'rgba(100,116,139,0.1)',
  normal: 'rgba(212,175,55,0.1)',
  high: 'rgba(255,140,0,0.15)',
  urgent: 'rgba(239,68,68,0.15)',
};

const PRIORITY_BORDERS = {
  low: 'rgba(100,116,139,0.2)',
  normal: `${G}20`,
  high: 'rgba(255,140,0,0.3)',
  urgent: 'rgba(239,68,68,0.4)',
};

export default function NotificationHub() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('all');
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch unread notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () =>
      user
        ? base44.entities.Notification.filter(
            { user_id: user.id },
            '-created_date',
            20
          )
        : Promise.resolve([]),
    enabled: !!user,
    refetchInterval: 5000,
  });

  // Mark as read
  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Notification.update(id, { is_read: true });
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Delete notification
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Notification.delete(id);
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Mark all read
  const markAllMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications?.filter(n => !n.is_read) || [];
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const filtered = notifications?.filter(n => {
    if (category === 'all') return true;
    const types = CATEGORY_TYPES[category] || [];
    return types.includes(n.type);
  }) || [];

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }
    if (notif.link && isSafeUrl(notif.link)) {
      window.location.href = notif.link;
    }
  };

  return (
    <>
      {/* Bell Icon */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all"
        style={{
          background: open ? `${G}15` : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? G + '30' : 'rgba(255,255,255,0.08)'}`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell className="w-4 h-4" style={{ color: unreadCount > 0 ? '#D4854A' : 'rgba(255,255,255,0.5)' }} />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: '#D4854A', color: '#000' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="absolute top-12 right-0 z-50 w-80 rounded-xl overflow-hidden shadow-2xl"
            style={{ background: BG, border: `1px solid ${BORDER}` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
              <h3 className="text-sm font-bold uppercase" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                Notifications {unreadCount > 0 && <span style={{ color: '#D4854A' }}>({unreadCount})</span>}
              </h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate()}
                    disabled={markAllMutation.isPending}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg font-bold"
                    style={{ background: 'rgba(212,175,55,0.1)', color: G, border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}
                    title="Mark all read"
                  >
                    <Check className="w-3 h-3" /> All
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10">
                  <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
                </button>
              </div>
            </div>

            {/* Category filter tabs */}
            <div className="flex border-b" style={{ borderColor: BORDER, background: '#08080F' }}>
              {[['all','All'], ['tips','Tips'], ['subs','Subs'], ['live','Live'], ['system','System']].map(([id, label]) => (
                <button key={id} onClick={() => setCategory(id)}
                  className="flex-1 py-1.5 text-[11px] font-black uppercase transition-all"
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    color: category === id ? G : 'rgba(255,255,255,0.3)',
                    borderBottom: category === id ? `2px solid ${G}` : '2px solid transparent',
                    background: category === id ? 'rgba(212,175,55,0.05)' : 'transparent',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto px-2 py-2 space-y-1.5">
              {filtered.length > 0 ? (
                filtered.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => handleNotificationClick(notif)}
                    className="p-3 rounded-lg cursor-pointer transition-all hover:opacity-80"
                    style={{
                      background: PRIORITY_COLORS[notif.priority || 'normal'],
                      border: `1px solid ${PRIORITY_BORDERS[notif.priority || 'normal']}`,
                      opacity: notif.is_read ? 0.6 : 1,
                    }}
                  >
                    <div className="flex gap-2.5 items-start">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${G}15` }}
                      >
                        {ICON_MAP[notif.type] || <Bell className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white">{notif.title}</p>
                        <p className="text-[10px] text-white/60 mt-0.5 leading-snug">{notif.message}</p>
                        {notif.metadata?.amount && (
                          <p className="text-[10px] text-[#D4AF37]/80 mt-1">
                            {notif.metadata.amount}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(notif.id);
                        }}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 shrink-0"
                      >
                        <X className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-6 text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {category === 'all' ? '🔔 No notifications yet' : `No ${category} notifications`}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}