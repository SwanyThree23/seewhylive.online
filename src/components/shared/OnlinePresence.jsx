import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

/**
 * Tracks the current user as "online" by upserting their presence record.
 * Also exports a hook to read active user count from rooms.
 */
export function usePresence(roomId) {
  var userQuery = useQuery({ queryKey: ['currentUser'], queryFn: function() { return base44.auth.me(); } });
  var user = userQuery.data || null;

  var countState = useState(0);
  var onlineCount = countState[0];
  var setOnlineCount = countState[1];

  useEffect(function() {
    if (!user || !roomId) return;

    var join = async function() {
      try {
        var existing = await base44.entities.Participant.filter({ room_id: roomId, user_id: user.id });
        if (existing.length === 0) {
          await base44.entities.Participant.create({
            room_id: roomId,
            user_id: user.id,
            user_name: user.full_name || user.email,
            status: 'listening',
            joined_at: new Date().toISOString(),
          });
        }
      } catch (e) {}
    };

    join();

    var unsub = base44.entities.Participant.subscribe(function(event) {
      if (event.data && event.data.room_id === roomId) {
        base44.entities.Participant.filter({ room_id: roomId, status: 'listening' })
          .then(function(list) { setOnlineCount(list.length); }).catch(function() {});
      }
    });

    base44.entities.Participant.filter({ room_id: roomId })
      .then(function(list) { setOnlineCount(list.length); }).catch(function() {});

    return function() { unsub(); };
  }, [user && user.id, roomId]);

  return { onlineCount: onlineCount };
}

export default function OnlinePresenceDot(props) {
  var isOnline = props.isOnline !== undefined ? props.isOnline : true;
  var size = props.size || 'sm';

  var sizes = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-3.5 h-3.5' };
  return (
    <span
      className={sizes[size] + ' rounded-full inline-block shrink-0 ' + (isOnline ? '' : 'bg-slate-400')}
      style={isOnline ? { background: '#6DBF7E' } : undefined}
    />
  );
}
