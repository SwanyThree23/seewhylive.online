import { useEffect, useRef } from 'react';

/**
 * Server-authoritative watch-party sync engine.
 *
 * - DRIFT_THRESHOLD 0.3s: if viewer is off by more than 300ms they get snapped.
 * - HEARTBEAT_INTERVAL 5s: viewers independently re-check sync even if no new
 *   syncData event arrives (catches stale subscriptions / missed updates).
 * - Play/pause are only applied when the desired state changes, preventing
 *   feedback loops where re-asserting the same state fights the player.
 */

const DRIFT_THRESHOLD    = 0.3;  // seconds (300ms)
const HEARTBEAT_INTERVAL = 5000; // ms

export function useWatchPartySync({
  isHost,
  syncData,
  onSeek,
  onPlay,
  onPause,
  getCurrentTime,
}) {
  const syncDataRef = useRef(syncData);
  syncDataRef.current = syncData;
  const lastStateRef = useRef(null); // 'playing' | 'paused' | null

  // Apply sync correction whenever syncData changes
  useEffect(() => {
    if (isHost || !syncData || typeof getCurrentTime !== 'function') return;

    const desiredState = syncData.playback_state === 'playing' ? 'playing' : 'paused';
    const lagMs      = Date.now() - (syncData.updated_at_ms || Date.now());
    const serverTime = (syncData.current_time || 0) + lagMs / 1000;
    const current    = getCurrentTime();

    if (Math.abs(current - serverTime) > DRIFT_THRESHOLD) {
      onSeek?.(serverTime);
    }

    // Only flip play state when it actually changes — avoids loops
    if (lastStateRef.current !== desiredState) {
      if (desiredState === 'playing') onPlay?.();
      else onPause?.();
      lastStateRef.current = desiredState;
    }
  }, [syncData, isHost]); // eslint-disable-line react-hooks/exhaustive-deps

  // 5-second heartbeat: viewer re-checks drift independent of push events
  useEffect(() => {
    if (isHost || typeof getCurrentTime !== 'function') return;

    const iv = setInterval(() => {
      const sd = syncDataRef.current;
      if (!sd) return;
      const lagMs      = Date.now() - (sd.updated_at_ms || Date.now());
      const serverTime = (sd.current_time || 0) + lagMs / 1000;
      const current    = getCurrentTime();
      if (Math.abs(current - serverTime) > DRIFT_THRESHOLD) {
        onSeek?.(serverTime);
      }
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(iv);
  }, [isHost, getCurrentTime]); // eslint-disable-line react-hooks/exhaustive-deps
}