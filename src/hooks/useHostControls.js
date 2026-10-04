import { useCallback } from 'react';
import { useLiveSync } from './useLiveSync';

// Host switches every device in the room follows.
const DEFAULTS = {
  chat_enabled: true,
  slow_mode: false,
  gift_alerts: true,
};

/**
 * Host controls that apply to the whole room instantly.
 *
 * The host flips a switch on the desktop and every viewer's phone is updated the
 * moment it changes — same shared record, pushed over the live subscription.
 *
 *   const { controls, setControl } = useHostControls(roomId, user);
 */
export function useHostControls(roomId, user) {
  const { value, push, loading } = useLiveSync('host_controls', { roomId, user });
  const controls = { ...DEFAULTS, ...(value || {}) };

  const setControl = useCallback(
    (key, next) => push({ ...controls, [key]: next }),
    [controls, push]
  );

  return { controls, setControl, loading };
}

export default useHostControls;