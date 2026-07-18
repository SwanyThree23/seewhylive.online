import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
// Fallback poll interval when socket is not available
const FALLBACK_MS = 30000;

/**
 * Subscribes to the server's livehome:trending socket push.
 * Returns { trending: Array<{ roomId, viewers, guests, score, hostId }>, connectedViaSocket }
 *
 * Consumers can merge this with their DB room objects by roomId to add titles, thumbnails, etc.
 * Falls back to the passed-in `fallbackRooms` when the socket hasn't delivered a payload yet.
 */
export function useLiveHomeRanking({ fallbackRooms = [] } = {}) {
  const [trending, setTrending] = useState(null); // null = not yet received
  const [connectedViaSocket, setConnectedViaSocket] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectedViaSocket(true);
    });
    socket.on('disconnect', () => setConnectedViaSocket(false));

    socket.on('livehome:trending', ({ rooms = [] }) => {
      setTrending(rooms);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnectedViaSocket(false);
    };
  }, []);

  // Client-side rank applied to fallbackRooms when socket hasn't delivered yet
  const clientRanked = fallbackRooms
    .slice()
    .sort((a, b) => (b.viewer_count || b.participant_count || 0) - (a.viewer_count || a.participant_count || 0));

  // If socket hasn't delivered, return client-side ranked fallback rooms
  const result = trending !== null
    ? trending.map(t => ({
        ...t,
        // Attempt to merge DB room data when available
        dbRoom: fallbackRooms.find(r => r.id === t.roomId) || null,
      }))
    : clientRanked.map(r => ({ roomId: r.id, viewers: r.viewer_count || 0, guests: 0, score: r.viewer_count || 0, hostId: r.host_id || null, dbRoom: r }));

  const requestManualSync = useCallback(() => {
    // Force the server to push a fresh trending snapshot
    socketRef.current?.emit('livehome:sync-request');
  }, []);

  return { trending: result, connectedViaSocket, requestManualSync };
}
