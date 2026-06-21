import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

/**
 * Tracks the current user as "online" by upserting their presence record.
 * Also exports a hook to read active user count from rooms.
 */
export function usePresence(roomId) {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!user || !roomId) return;

    // Mark user as active participant
    const join = async () => {
      const existing = await base44.entities.Participant.filter({ room_id: roomId, user_id: user.id });
      if (existing.length === 0) {
        await base44.entities.Participant.create({
          room_id: roomId,
          user_id: user.id,
          user_name: user.full_name || user.email,
          status: 'listening',
          joined_at: new Date().toISOString(),
        });
      }
    };

    join();

    // Subscribe to participant changes
    const unsub = base44.entities.Participant.subscribe((event) => {
      if (event.data?.room_id === roomId) {
        base44.entities.Participant.filter({ room_id: roomId, status: 'listening' })
          .then(list => setOnlineCount(list.length)).catch(() => {});
      }
    });

    // Initial count
    base44.entities.Participant.filter({ room_id: roomId })
      .then(list => setOnlineCount(list.length)).catch(() => {});

    return () => unsub();
  }, [user?.id, roomId]);

  return { onlineCount };
}

export default function OnlinePresenceDot({ isOnline = true, size = 'sm' }) {
  const sizes = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-3.5 h-3.5' };
  return (
    <span className={`${sizes[size]} rounded-full inline-block shrink-0 ${isOnline ? 'bg-[#6DBF7E]' : 'bg-[rgba(255,255,255,0.2)]'}`} />
  );
}