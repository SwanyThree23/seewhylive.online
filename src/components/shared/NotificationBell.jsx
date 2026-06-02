import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
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
      <button
        style={{
          position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center',
          width:40, height:40, borderRadius:8, background:'transparent', border:'none', cursor:'pointer', color:'inherit',
        }}
      >
        <Bell style={{ width:20, height:20 }} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{
                position:'absolute', top:-4, right:-4,
                width:20, height:20, borderRadius:'50%',
                background:'#ef4444', color:'#fff', fontSize:10, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center',
                border:'2px solid #fff',
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
