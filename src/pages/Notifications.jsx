import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, Gift, Users, Radio, Trophy, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TYPE_CONFIG = {
  tip:          { icon: Gift,      color: '#D4AF37' },
  subscription: { icon: Users,     color: '#00F5FF' },
  room_invite:  { icon: Radio,     color: '#FF1564' },
  challenge:    { icon: Trophy,    color: '#8B5CF6' },
  announcement: { icon: Megaphone, color: '#D4AF37' },
  referral:     { icon: Gift,      color: '#00FF88' },
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user?.id }, '-created_date', 50),
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => {
      toast.success('All marked as read');
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen pb-8" style={{ background: '#080B18' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" style={{ color: GOLD }} />
          <h1 className="font-black text-lg text-white leading-none" style={T}>Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full font-black text-[9px]"
              style={{ background: '#FF1564', color: '#fff', ...T }}>{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllReadMutation.mutate()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-[10px]"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>
            <Check className="w-3 h-3" />Mark all read
          </button>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Bell className="w-16 h-16 mb-4" style={{ color: 'rgba(255,255,255,0.12)' }} />
            <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] || { icon: Bell, color: GOLD };
              const Icon = cfg.icon;
              return (
                <div key={notif.id} className="rounded-xl p-3 flex items-start gap-3 transition-all"
                  style={{
                    background: notif.is_read ? 'rgba(13,6,24,0.6)' : 'rgba(13,6,24,0.95)',
                    border: `1px solid ${notif.is_read ? 'rgba(255,255,255,0.05)' : `${cfg.color}30`}`,
                    opacity: notif.is_read ? 0.7 : 1,
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3 className="font-black text-sm text-white leading-snug" style={T}>{notif.title}</h3>
                      {!notif.is_read && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded font-black text-[8px] uppercase"
                          style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}30`, ...T }}>
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{notif.message}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
                        {format(new Date(notif.created_date), 'PPp')}
                      </span>
                      {notif.link && (
                        <Link to={notif.link}>
                          <span className="text-[10px] font-black" style={{ color: GOLD, ...T }}>View →</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {!notif.is_read && (
                      <button onClick={() => markReadMutation.mutate(notif.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteMutation.mutate(notif.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
