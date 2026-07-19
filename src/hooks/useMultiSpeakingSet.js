import { useState, useEffect, useRef } from 'react';

const THRESHOLD = 0.015;
const POLL_MS   = 150;

function buildAnalyser(stream) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx || !stream) return null;
  try {
    const ctx  = new Ctx();
    const node = ctx.createAnalyser();
    node.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(node);
    return { ctx, node, buf: new Uint8Array(node.frequencyBinCount) };
  } catch { return null; }
}

function getLevel(h) {
  h.node.getByteTimeDomainData(h.buf);
  let sum = 0;
  for (let i = 0; i < h.buf.length; i++) { const v = (h.buf[i] - 128) / 128; sum += v * v; }
  return Math.sqrt(sum / h.buf.length);
}

/**
 * Tracks active speakers across local + remote WebRTC streams via AnalyserNode.
 * Returns a Set<userId> of members currently above the speaking threshold.
 *
 * Pass localUserId: null to skip local stream analysis (e.g. when useAutoSpeakGate
 * is already handling it).
 */
export function useMultiSpeakingSet({ localStream, localUserId, remoteStreams, peerUserIds }) {
  const [speakingIds, setSpeakingIds] = useState(() => new Set());

  const localStreamRef   = useRef(localStream);
  const localUserIdRef   = useRef(localUserId);
  const remoteStreamsRef  = useRef(remoteStreams);
  const peerUserIdsRef   = useRef(peerUserIds);

  useEffect(() => { localStreamRef.current   = localStream;   }, [localStream]);
  useEffect(() => { localUserIdRef.current   = localUserId;   }, [localUserId]);
  useEffect(() => { remoteStreamsRef.current  = remoteStreams;  }, [remoteStreams]);
  useEffect(() => { peerUserIdsRef.current   = peerUserIds;   }, [peerUserIds]);

  useEffect(() => {
    const analysers = new Map(); // userId → { ctx, node, buf }

    function syncAnalysers() {
      const active = new Map();
      const uid = localUserIdRef.current;
      const ls  = localStreamRef.current;
      if (uid && ls) active.set(uid, ls);

      const rs = remoteStreamsRef.current;
      const pu = peerUserIdsRef.current;
      if (rs && pu) {
        for (const [peerId, stream] of rs) {
          const remoteUid = pu.get(peerId);
          if (remoteUid && stream) active.set(remoteUid, stream);
        }
      }

      for (const [key, h] of analysers) {
        if (!active.has(key)) {
          try { h.ctx.close(); } catch {}
          analysers.delete(key);
        }
      }
      for (const [key, stream] of active) {
        if (!analysers.has(key)) {
          const h = buildAnalyser(stream);
          if (h) analysers.set(key, h);
        }
      }
    }

    const iv = setInterval(() => {
      syncAnalysers();
      const speaking = new Set();
      for (const [uid, h] of analysers) {
        if (getLevel(h) > THRESHOLD) speaking.add(uid);
      }
      setSpeakingIds(prev => {
        if (prev.size === speaking.size && [...prev].every(id => speaking.has(id))) return prev;
        return speaking;
      });
    }, POLL_MS);

    return () => {
      clearInterval(iv);
      for (const h of analysers.values()) {
        try { h.ctx.close(); } catch {}
      }
    };
  }, []); // refs keep this current without re-subscribing

  return speakingIds;
}
