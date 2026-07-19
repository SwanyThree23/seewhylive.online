import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
// Max drift (seconds) before we force-seek to correct position
const DRIFT_THRESHOLD = 2;

/**
 * Socket.IO-based watch party sync hook.
 *
 * Hosts emit control events; all clients receive them and apply
 * lag-compensated seek/play/pause. State is carried in a ref so
 * the YouTube / Direct player effects can read it synchronously.
 *
 * @param {object} opts
 * @param {string}  opts.partyId   - Room / party ID
 * @param {string}  opts.userId    - Current user ID
 * @param {string}  opts.userName  - Current user display name
 * @param {boolean} opts.isHost    - Whether this user controls playback
 * @param {Function} opts.onPlay   - ({ position, lag }) → void
 * @param {Function} opts.onPause  - ({ position }) → void
 * @param {Function} opts.onSeek   - ({ position }) → void
 * @param {Function} opts.onUrl    - ({ videoId, url, type }) → void
 * @param {Function} opts.onSync   - (fullState) → void  (late-join catch-up)
 */
export function useWatchPartySocket({ partyId, userId, userName, isHost, onPlay, onPause, onSeek, onUrl, onSync }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // Keep callbacks in refs so effects don't re-subscribe on every render
  const onPlayRef  = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onSeekRef  = useRef(onSeek);
  const onUrlRef   = useRef(onUrl);
  const onSyncRef  = useRef(onSync);
  useEffect(() => { onPlayRef.current  = onPlay;  }, [onPlay]);
  useEffect(() => { onPauseRef.current = onPause; }, [onPause]);
  useEffect(() => { onSeekRef.current  = onSeek;  }, [onSeek]);
  useEffect(() => { onUrlRef.current   = onUrl;   }, [onUrl]);
  useEffect(() => { onSyncRef.current  = onSync;  }, [onSync]);

  useEffect(() => {
    if (!partyId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 6,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', {
        roomId: partyId,
        userId,
        username: userName,
        role: isHost ? 'host' : 'viewer',
      });
      // Request current state for late-joiners
      if (!isHost) {
        socket.emit('watch-party-sync-request', { roomId: partyId });
      }
    });

    socket.on('disconnect', () => setConnected(false));

    // Host pushes play — viewers get lag-compensated position
    socket.on('watch-party-play', ({ position = 0, timestamp = Date.now() }) => {
      const lagMs = Date.now() - timestamp;
      onPlayRef.current?.({ position, lag: lagMs / 1000 });
    });

    socket.on('watch-party-pause', ({ position = 0 }) => {
      onPauseRef.current?.({ position });
    });

    socket.on('watch-party-seek', ({ position = 0 }) => {
      onSeekRef.current?.({ position });
    });

    // Host changed the video source
    socket.on('watch-party-url', ({ videoId = null, url = '', type = 'youtube' }) => {
      onUrlRef.current?.({ videoId, url, type });
    });

    // Full state sent on sync-request or late-join
    socket.on('watch-party-sync', (state) => {
      onSyncRef.current?.(state);
    });

    // The server also emits this when a host calls watch-party-start
    socket.on('watch-party-started', () => {
      if (!isHost) {
        socket.emit('watch-party-sync-request', { roomId: partyId });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [partyId, userId, userName, isHost]);

  /** Emit play — host only, caller passes current player position */
  const emitPlay = useCallback((position) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('watch-party-play', {
      roomId: partyId,
      position: position || 0,
    });
  }, [partyId]);

  /** Emit pause — host only */
  const emitPause = useCallback((position) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('watch-party-pause', {
      roomId: partyId,
      position: position || 0,
    });
  }, [partyId]);

  /** Emit seek — host only */
  const emitSeek = useCallback((position) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('watch-party-seek', {
      roomId: partyId,
      position: position || 0,
    });
  }, [partyId]);

  /** Emit new video source — host only */
  const emitUrl = useCallback(({ videoId, url, type }) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('watch-party-url', {
      roomId: partyId,
      videoId: videoId || null,
      url: url || '',
      type: type || (videoId ? 'youtube' : 'direct'),
    });
  }, [partyId]);

  /** Push full sync state — host calls this periodically as a heartbeat */
  const emitSync = useCallback(({ videoId, url, type, playing, position }) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('watch-party-sync', {
      roomId: partyId,
      videoId: videoId || null,
      url: url || '',
      type: type || 'youtube',
      playing: !!playing,
      position: position || 0,
    });
  }, [partyId]);

  return { connected, emitPlay, emitPause, emitSeek, emitUrl, emitSync, DRIFT_THRESHOLD };
}
