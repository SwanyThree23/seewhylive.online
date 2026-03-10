import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell() {
  const qc = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user?.id, is_read: false }, '-created_date', 20),
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;
    const unsub = base44.entities.Notification.subscribe((event) => { // eslint-disable-line
      if (event.data?.user_id === user.id) {
        qc.invalidateQueries(['notifications', user.id]);
      }
    });
    return unsub;
  }, [user, qc]);

  const unreadCount = notifications.length;

  return (
    <Link to={createPageUrl('Notifications')}>
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </Link>
  );
}