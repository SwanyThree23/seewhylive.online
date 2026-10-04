import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Cross-device realtime settings sync.
 *
 * A setting is stored once (LiveSyncSetting) and every device subscribed to the
 * same key + scope is pushed the new value the instant it changes — so arming an
 * ad, pausing a control, or flipping a host toggle on desktop lands on the phone
 * immediately, without a refresh.
 *
 *   const { value, push, loading } = useLiveSync('ad_armed_template', { roomId, user });
 *
 * @param {string} syncKey  setting identifier
 * @param {object} options  { roomId } broadcast scope (omit for account-wide), { user } current user
 */
export function useLiveSync(syncKey, { roomId = '', user = null } = {}) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const recordIdRef = useRef(null);
  const scope = roomId || '';

  const decode = (raw) => {
    if (raw === null || raw === undefined || raw === '') return null;
    try { return JSON.parse(raw); } catch { return raw; }
  };

  // Pull the current value, then stay in step with every other device.
  useEffect(() => {
    if (!syncKey) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const rows = await base44.entities.LiveSyncSetting.filter(
          { sync_key: syncKey, room_id: scope }, '-updated_date', 1
        );
        if (cancelled || !rows.length) return;
        recordIdRef.current = rows[0].id;
        setValue(decode(rows[0].value));
      } catch {
        // offline / not signed in — the local value stands
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const unsub = base44.entities.LiveSyncSetting.subscribe((event) => {
      const d = event?.data;
      if (!d || d.sync_key !== syncKey || (d.room_id || '') !== scope) return;
      if (event.type === 'delete') { recordIdRef.current = null; setValue(null); return; }
      recordIdRef.current = d.id;
      setValue(decode(d.value));
    });

    return () => { cancelled = true; if (unsub) unsub(); };
  }, [syncKey, scope]);

  const push = useCallback(async (next) => {
    setValue(next); // this device updates instantly; others follow over the subscription
    const payload = {
      sync_key: syncKey,
      room_id: scope,
      value: JSON.stringify(next ?? null),
      updated_by: user?.id || '',
      updated_by_name: user?.full_name || user?.email || '',
      updated_at: new Date().toISOString(),
    };
    if (recordIdRef.current) {
      await base44.entities.LiveSyncSetting.update(recordIdRef.current, payload);
    } else {
      const rec = await base44.entities.LiveSyncSetting.create(payload);
      recordIdRef.current = rec.id;
    }
  }, [syncKey, scope, user?.id, user?.full_name, user?.email]);

  return { value, push, loading };
}