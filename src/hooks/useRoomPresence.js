import { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

// A watcher whose heartbeat is older than this has left the room.
const STALE_MS = 75000;
const HEARTBEAT_MS = 25000;

/**
 * Who is watching this broadcast right now.
 *
 * Writes this device's presence against the room (heartbeat), then keeps a live
 * list of everyone else doing the same — new arrivals and departures appear
 * without a refresh, on every device.
 *
 *   const { watchers, count } = useRoomPresence(roomId, user);
 */
export function useRoomPresence(roomId, user) {
  const [rows, setRows] = useState([]);
  const [tick, setTick] = useState(0);
  const presenceIdRef = useRef(null);

  // Heartbeat — point this device's presence row at the room being watched.
  useEffect(() => {
    if (!roomId || !user?.id) return;
    let cancelled = false;

    const beat = async () => {
      const data = {
        user_id: user.id,
        user_name: user.full_name || user.email || 'Guest',
        avatar_url: user.avatar_url || '',
        status: 'online',
        current_room_id: roomId,
        last_seen: new Date().toISOString(),
      };
      try {
        if (presenceIdRef.current) {
          await base44.entities.OnlinePresence.update(presenceIdRef.current, data);
          return;
        }
        const existing = await base44.entities.OnlinePresence.filter({ user_id: user.id });
        if (cancelled) return;
        if (existing[0]) {
          presenceIdRef.current = existing[0].id;
          await base44.entities.OnlinePresence.update(presenceIdRef.current, data);
        } else {
          const rec = await base44.entities.OnlinePresence.create(data);
          presenceIdRef.current = rec.id;
        }
      } catch {
        // offline or throttled — the next beat catches up
      }
    };

    beat();
    const iv = setInterval(beat, HEARTBEAT_MS);
    return () => { cancelled = true; clearInterval(iv); };
  }, [roomId, user?.id, user?.full_name, user?.email, user?.avatar_url]);

  // Live roster for this room.
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    (async () => {
      try {
        const list = await base44.entities.OnlinePresence.filter({ current_room_id: roomId, status: 'online' });
        if (!cancelled) setRows(list);
      } catch {
        // offline — the subscription picks up when it reconnects
      }
    })();

    const unsub = base44.entities.OnlinePresence.subscribe((event) => {
      const d = event?.data;
      if (!d || d.current_room_id !== roomId) return;
      setRows((prev) => {
        const rest = prev.filter((w) => w.id !== d.id);
        return event.type === 'delete' ? rest : [...rest, d];
      });
    });

    return () => { cancelled = true; if (unsub) unsub(); };
  }, [roomId]);

  // Drop stale watchers as time passes, so the count stays honest.
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  const watchers = useMemo(() => {
    const cutoff = Date.now() - STALE_MS;
    return rows
      .filter((w) => w.last_seen && new Date(w.last_seen).getTime() > cutoff)
      .sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());
  }, [rows, tick]);

  return { watchers, count: watchers.length };
}

export default useRoomPresence;