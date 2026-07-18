import { useState, useEffect, useRef } from 'react';

const THRESHOLD = 0.01;
const HOLD_MS = 400;

/**
 * Analyses audio from each remote WebRTC stream and returns a map of
 * { [userId]: true } for peers currently detected as speaking.
 *
 * @param {Map<string,MediaStream>} remoteStreams  peerId → MediaStream
 * @param {Map<string,string>}      peerUserIds    peerId → userId
 * @returns {{ [userId: string]: boolean }}
 */
export function useRemoteSpeakingMap(remoteStreams, peerUserIds) {
  const [speakingIds, setSpeakingIds] = useState({});
  const analysersRef = useRef({});

  useEffect(() => {
    if (!remoteStreams) return;

    const currentPeerIds = new Set(remoteStreams.keys());

    // Tear down analysers for departed peers
    for (const peerId of Object.keys(analysersRef.current)) {
      if (!currentPeerIds.has(peerId)) {
        const e = analysersRef.current[peerId];
        if (e.raf) cancelAnimationFrame(e.raf);
        clearTimeout(e.holdTimer);
        try { e.ctx?.close(); } catch (_) {}
        delete analysersRef.current[peerId];
      }
    }

    // Set up analysers for new peers
    for (const [peerId, stream] of remoteStreams.entries()) {
      if (analysersRef.current[peerId]) continue;
      if (!stream?.getAudioTracks().length) continue;

      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const entry = { ctx, raf: null, holdTimer: null, speaking: false };
        analysersRef.current[peerId] = entry;

        // IIFE captures per-peer analyser, data, and entry
        (function startLoop(pid, ent, an, buf) {
          function loop() {
            an.getByteTimeDomainData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i++) {
              const v = (buf[i] - 128) / 128;
              sum += v * v;
            }
            const rms = Math.sqrt(sum / buf.length);
            const uid = peerUserIds?.get(pid);

            if (rms > THRESHOLD) {
              clearTimeout(ent.holdTimer);
              if (!ent.speaking) {
                ent.speaking = true;
                if (uid) setSpeakingIds(prev => ({ ...prev, [uid]: true }));
              }
            } else if (ent.speaking) {
              ent.holdTimer = setTimeout(() => {
                ent.speaking = false;
                if (uid) setSpeakingIds(prev => { const n = { ...prev }; delete n[uid]; return n; });
              }, HOLD_MS);
            }

            ent.raf = requestAnimationFrame(loop);
          }
          ent.raf = requestAnimationFrame(loop);
        })(peerId, entry, analyser, data);
      } catch (_) {
        // WebAudio unavailable for this stream — skip silently
      }
    }
  }, [remoteStreams, peerUserIds]);

  // Full teardown on unmount
  useEffect(() => {
    return () => {
      for (const e of Object.values(analysersRef.current)) {
        if (e.raf) cancelAnimationFrame(e.raf);
        clearTimeout(e.holdTimer);
        try { e.ctx?.close(); } catch (_) {}
      }
      analysersRef.current = {};
    };
  }, []);

  return speakingIds;
}
