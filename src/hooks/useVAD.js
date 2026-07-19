import { useState, useEffect, useRef } from 'react';

/**
 * useVAD — Web Audio API voice-activity detection.
 *
 * Connects each provided MediaStream to an AnalyserNode, polls every
 * POLL_MS milliseconds, and returns a { [userId]: boolean } map of
 * who is currently speaking.
 *
 * Usage:
 *   const speaking = useVAD({ streams: { userId: MediaStream, … } });
 *   // Pass `speaking` as speakingIds={speaking} to <GuestGrid>.
 */

const POLL_MS  = 100;     // detection polling interval
const FFT_SIZE = 256;     // AnalyserNode FFT resolution
const DEFAULT_THRESHOLD = 14; // RMS out of 255 that counts as speaking

function rms(analyser) {
  const buf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

export function useVAD({ streams = {}, threshold = DEFAULT_THRESHOLD } = {}) {
  const [speaking, setSpeaking] = useState({});
  const nodesRef = useRef({}); // { userId: { ctx, analyser, source } }
  const streamKeysRef = useRef('');

  // Rebuild AudioContext nodes whenever the stream map changes
  useEffect(() => {
    const nextKey = Object.keys(streams).sort().join(',');
    if (nextKey === streamKeysRef.current) return; // no-op if unchanged
    streamKeysRef.current = nextKey;

    const currentIds = new Set(Object.keys(streams));
    const existingIds = new Set(Object.keys(nodesRef.current));

    // Tear down nodes for removed streams
    existingIds.forEach(id => {
      if (!currentIds.has(id)) {
        try {
          nodesRef.current[id].source.disconnect();
          nodesRef.current[id].ctx.close();
        } catch { /* ignore already-closed contexts */ }
        delete nodesRef.current[id];
      }
    });

    // Create nodes for new streams
    currentIds.forEach(id => {
      if (existingIds.has(id) && nodesRef.current[id]) return;
      const stream = streams[id];
      if (!stream || !(stream instanceof MediaStream)) return;
      if (!stream.getAudioTracks().some(t => t.enabled && t.readyState !== 'ended')) return;

      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = 0.5;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        nodesRef.current[id] = { ctx, analyser, source };
      } catch {
        /* browser may block AudioContext before user gesture — silently skip */
      }
    });
  }, [streams]);

  // Polling loop — runs continuously, updates state only on change
  useEffect(() => {
    const id = setInterval(() => {
      const next = {};
      Object.entries(nodesRef.current).forEach(([uid, { analyser }]) => {
        try { next[uid] = rms(analyser) > threshold; } catch { next[uid] = false; }
      });

      setSpeaking(prev => {
        const allSame = Object.keys(next).every(k => next[k] === prev[k])
          && Object.keys(prev).every(k => k in next);
        return allSame ? prev : next;
      });
    }, POLL_MS);

    return () => clearInterval(id);
  }, [threshold]);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      Object.values(nodesRef.current).forEach(({ ctx, source }) => {
        try { source.disconnect(); ctx.close(); } catch {}
      });
      nodesRef.current = {};
    };
  }, []);

  return speaking;
}
