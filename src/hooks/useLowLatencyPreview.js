import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'swl_low_latency_preview';

/** Light capture profile — 360p @ 20fps. Clear on a phone screen, a fraction of the pixels of 720p. */
export const LOW_LATENCY_PROFILE = { width: 640, height: 360, frameRate: 20 };
/** Per-guest download ceiling while the mode is on (~180 kbps). */
export const LOW_LATENCY_INBOUND_KBPS = 180;

function readNetwork() {
  try {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return { mobile: false, saveData: false, label: 'Network' };
    const type = conn.type || '';
    const effectiveType = conn.effectiveType || '';
    const mobile = type === 'cellular'
      || effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';
    const saveData = !!conn.saveData;
    const label = saveData
      ? 'Data Saver'
      : type === 'cellular' ? 'Mobile data'
      : effectiveType ? effectiveType.toUpperCase()
      : 'Network';
    return { mobile, saveData, label };
  } catch {
    return { mobile: false, saveData: false, label: 'Network' };
  }
}

/**
 * Low-latency preview mode.
 *
 * On a mobile network the studio drops into a lighter preview: our own capture
 * switches to a 360p / 20fps profile (clear on a phone, far less to encode and
 * upload) and every inbound guest feed is capped, so the preview stays
 * responsive without eating a data plan. The choice is remembered, and the
 * switch is available by hand at any time.
 */
export function useLowLatencyPreview({ peersRef, localStream, remoteStreams } = {}) {
  const [network, setNetwork] = useState(readNetwork);
  const [enabled, setEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) return saved === '1';
    } catch {}
    const n = readNetwork();
    return n.mobile || n.saveData;
  });

  // Follow the network as it changes (wifi ⇄ cellular, Data Saver toggled)
  useEffect(() => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn?.addEventListener) return;
    const onChange = () => setNetwork(readNetwork());
    conn.addEventListener('change', onChange);
    return () => conn.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback((next) => {
    setEnabled(prev => {
      const value = typeof next === 'boolean' ? next : !prev;
      try { localStorage.setItem(STORAGE_KEY, value ? '1' : '0'); } catch {}
      return value;
    });
  }, []);

  // 1. Lighten our own capture — lower latency, much smaller upload
  useEffect(() => {
    if (!enabled || !localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (!track) return;
    track.applyConstraints({
      width: { ideal: LOW_LATENCY_PROFILE.width },
      height: { ideal: LOW_LATENCY_PROFILE.height },
      frameRate: { ideal: LOW_LATENCY_PROFILE.frameRate },
    }).catch(() => {});
  }, [enabled, localStream]);

  // 2. Cap inbound guest video so the preview stays responsive on a phone
  useEffect(() => {
    if (!peersRef?.current) return;
    let cancelled = false;
    (async () => {
      for (const { pc } of peersRef.current.values()) {
        if (cancelled || !pc || pc.connectionState === 'closed') continue;
        for (const receiver of pc.getReceivers()) {
          if (receiver.track?.kind !== 'video') continue;
          try {
            const params = receiver.getParameters();
            if (!params.encodings?.length) continue;
            if (enabled) {
              params.encodings[0].maxBitrate = LOW_LATENCY_INBOUND_KBPS * 1000;
              params.degradationPreference = 'maintain-framerate';
            } else {
              delete params.encodings[0].maxBitrate;
              params.degradationPreference = 'balanced';
            }
            await receiver.setParameters(params);
          } catch {}
        }
      }
    })();
    return () => { cancelled = true; };
  }, [enabled, peersRef, remoteStreams]);

  return {
    enabled,
    toggle,
    network,
    isMobileNetwork: network.mobile || network.saveData,
  };
}