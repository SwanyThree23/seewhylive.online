import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

// Heartbeat hook — call once at app root to register presence
export function usePresenceHeartbeat(roomId) {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  useEffect(() => {
    if (!user?.id) return;

    let presenceId = null;

    const upsertPresence = async () => {
      try {
        const data = {
          user_id: user.id,
          user_name: user.full_name || user.email,
          avatar_url: user.avatar_url || '',
          status: 'online',
          current_room_id: roomId || '',
          last_seen: new Date().toISOString(),
        };
        if (presenceId) {
          await base44.entities.OnlinePresence.update(presenceId, data);
        } else {
          const existing = await base44.entities.OnlinePresence.filter({ user_id: user.id });
          if (existing[0]) {
            presenceId = existing[0].id;
            await base44.entities.OnlinePresence.update(presenceId, data);
          } else {
            const created = await base44.entities.OnlinePresence.create(data);
            presenceId = created.id;
          }
        }
      } catch (error) {
      }
    };

    upsertPresence();
    const interval = setInterval(upsertPresence, 60000); // heartbeat every 60s (increased from 30s)

    const markOffline = async () => {
      try {
        if (presenceId) {
          await base44.entities.OnlinePresence.update(presenceId, { status: 'offline', last_seen: new Date().toISOString() });
        } else {
          const existing = await base44.entities.OnlinePresence.filter({ user_id: user.id });
          if (existing[0]) {
            await base44.entities.OnlinePresence.update(existing[0].id, { status: 'offline', last_seen: new Date().toISOString() });
          }
        }
      } catch (error) {
      }
    };

    window.addEventListener('beforeunload', markOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', markOffline);
    };
  }, [user?.id, roomId]);
}

// Visual dot component
export default function PresenceDot({ userId, size = 'sm' }) {
  const { data: presence } = useQuery({
    queryKey: ['presence', userId],
    queryFn: async () => {
      const results = await base44.entities.OnlinePresence.filter({ user_id: userId });
      return results[0] || null;
    },
    enabled: !!userId,
    refetchInterval: 65000, // increased from 35s to match heartbeat
    retry: 1,
    retryDelay: 1000,
  });

  const isOnline = presence?.status === 'online';
  const lastSeen = presence?.last_seen ? new Date(presence.last_seen) : null;
  const isRecent = lastSeen && (Date.now() - lastSeen.getTime()) < 60000; // within 1 min

  const active = isOnline && isRecent;

  const sizeClass = size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <span
      className={`${sizeClass} rounded-full border-2 border-white shrink-0`}
      style={{ background: active ? '#6DBF7E' : 'rgba(255,255,255,0.25)' }}
      title={active ? 'Online' : lastSeen ? `Last seen ${lastSeen.toLocaleTimeString()}` : 'Offline'}
    />
  );
}
