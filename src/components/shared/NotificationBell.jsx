import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell() {
  var qc = useQueryClient();

  var userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });
  var user = userQuery.data || null;
  var userId = (user && user.id) || null;

  var notifQuery = useQuery({
    queryKey: ['notifications', userId],
    queryFn: function() {
      return base44.entities.Notification.filter({ user_id: userId, is_read: false }, '-created_date', 20);
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
  var notifications = notifQuery.data || [];

  useEffect(function() {
    if (!user) return;
    var unsub = base44.entities.Notification.subscribe(function(event) {
      if (event.data && event.data.user_id === userId) {
        qc.invalidateQueries({ queryKey: ['notifications', userId] });
      }
    });
    return unsub;
  }, [userId]);

  var unreadCount = notifications.length;

  return (
    <Link to={createPageUrl('Notifications')}>
      <button
        style={{
          position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit',
        }}
      >
        <Bell style={{ width: 20, height: 20 }} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{
                position: 'absolute', top: -4, right: -4,
                width: 20, height: 20, borderRadius: '50%',
                background: '#FF2040', color: '#fff', fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #fff',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </Link>
  );
}
