import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

// Heartbeat hook — call once at app root to register presence
export function usePresenceHeartbeat(roomId) {
  var userQuery = useQuery({ queryKey: ['currentUser'], queryFn: function() { return base44.auth.me(); } });
  var user = userQuery.data || null;

  useEffect(function() {
    if (!user || !user.id) return;

    var presenceId = null;

    var upsertPresence = async function() {
      try {
        var data = {
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
          var existing = await base44.entities.OnlinePresence.filter({ user_id: user.id });
          if (existing[0]) {
            presenceId = existing[0].id;
            await base44.entities.OnlinePresence.update(presenceId, data);
          } else {
            var created = await base44.entities.OnlinePresence.create(data);
            presenceId = created.id;
          }
        }
      } catch (error) {
      }
    };

    upsertPresence();
    var interval = setInterval(upsertPresence, 60000);

    var markOffline = async function() {
      try {
        if (presenceId) {
          await base44.entities.OnlinePresence.update(presenceId, { status: 'offline', last_seen: new Date().toISOString() });
        } else {
          var existing = await base44.entities.OnlinePresence.filter({ user_id: user.id });
          if (existing[0]) {
            await base44.entities.OnlinePresence.update(existing[0].id, { status: 'offline', last_seen: new Date().toISOString() });
          }
        }
      } catch (error) {
      }
    };

    window.addEventListener('beforeunload', markOffline);
    return function() {
      clearInterval(interval);
      window.removeEventListener('beforeunload', markOffline);
    };
  }, [user && user.id, roomId]);
}

// Visual dot component
export default function PresenceDot(props) {
  var userId = props.userId;
  var size = props.size || 'sm';

  var presenceQuery = useQuery({
    queryKey: ['presence', userId],
    queryFn: async function() {
      var results = await base44.entities.OnlinePresence.filter({ user_id: userId });
      return results[0] || null;
    },
    enabled: !!userId,
    refetchInterval: 65000,
    retry: 1,
    retryDelay: 1000,
  });
  var presence = presenceQuery.data || null;

  var isOnline = (presence && presence.status === 'online') || false;
  var lastSeen = (presence && presence.last_seen) ? new Date(presence.last_seen) : null;
  var isRecent = lastSeen && (Date.now() - lastSeen.getTime()) < 60000;

  var active = isOnline && isRecent;

  var sizeClass = size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <span
      className={sizeClass + ' rounded-full border-2 border-white shrink-0 ' + (active ? '' : 'bg-slate-300')}
      style={active ? { background: '#6DBF7E' } : undefined}
      title={active ? 'Online' : lastSeen ? ('Last seen ' + lastSeen.toLocaleTimeString()) : 'Offline'}
    />
  );
}
