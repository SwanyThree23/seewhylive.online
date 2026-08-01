/**
 * useZegoToken — fetches a ZEGO server-authenticated token from the SeeWhy LIVE backend.
 *
 * The server at POST /api/zego/token computes an HMAC-SHA256 signature over the
 * payload fields (appId, userId, roomId, expire, nonce) using ZEGO_SERVER_SECRET.
 * This token is then passed to ZegoExpressEngine.loginRoom() in LiveStage.
 *
 * Returns { token, appId, loading, error } — refetches automatically when
 * roomId or userId changes.
 */
import { useState, useEffect } from 'react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useZegoToken({ roomId, userId, enabled = true }) {
  const [token,   setToken]   = useState(null);
  const [appId,   setAppId]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!roomId || !userId || !enabled) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${SERVER_URL}/api/zego/token?roomId=${encodeURIComponent(roomId)}&userId=${encodeURIComponent(userId)}`;
        const r = await fetch(url, { method: 'POST' });
        if (!r.ok) throw new Error(`Token endpoint returned ${r.status}`);
        const data = await r.json();
        if (!cancelled) {
          setToken(data.token);
          setAppId(data.appId);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [roomId, userId, enabled]);

  return { token, appId, loading, error };
}
