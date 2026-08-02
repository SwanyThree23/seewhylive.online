import { useEffect, useRef, useState, useCallback } from 'react';
import rtcManager from '../webrtc';

/**
 * usePeerVideoStreams — shared producer/consumer binding for the mediasoup SFU.
 *
 * Extracted from OctCell.jsx's own-cell (getUserMedia → publishStream) and
 * remote-cell (subscribeToProducer → MediaStream) logic so Panel, Watch Party,
 * and any future small-N camera strip reuse ONE media path instead of each
 * growing a parallel implementation.
 *
 * Playback sync (video URL / play / pause / seek) is a SEPARATE Socket.IO
 * concern — do not mix it in here.
 *
 * @param {object}   opts
 * @param {string}   opts.roomId
 * @param {string}   opts.userId
 * @param {string}   opts.role         'host' | 'guest' | 'viewer'
 * @param {object}   opts.socket       connected socket.io client
 * @param {object}   [opts.mediaConfig] { camId, micId, facingFront, preset, noiseSup, echoCan, autoGain, stream }
 * @param {boolean}  [opts.enabled]     gate the whole hook (e.g. audio-only rooms)
 * @returns {{ localStream, remoteStreams, ready, replaceTrack, pauseKind, resumeKind, toggleCam, toggleMic, isCamOff, isMicOff }}
 */
export function usePeerVideoStreams({ roomId, userId, role, socket, mediaConfig, enabled = true }) {
  const [remoteStreams, setRemoteStreams] = useState({}); // guestId -> { guestId, username, stream, videoProducerId, audioProducerId }
  const [localStream, setLocalStream] = useState(null);
  const [ready, setReady] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isMicOff, setIsMicOff] = useState(false);

  const streamRef = useRef(null);
  const subscribedRef = useRef(new Set()); // producerIds already consumed
  const guestNamesRef = useRef({});          // guestId -> username (from roster-update)

  // ── 1. Connect rtcManager (transports + device) once ───────────────────
  useEffect(() => {
    if (!enabled || !socket || !roomId || !userId || role === 'viewer') return;
    let cancelled = false;
    rtcManager.connect(socket, roomId, userId, role)
      .then(() => { if (!cancelled) setReady(true); })
      .catch((e) => console.error('[usePeerVideoStreams] connect error:', e));
    return () => { cancelled = true; };
  }, [enabled, socket, roomId, userId, role]);

  // ── 2. Acquire local camera/mic and publish (host/guest only) ─────────
  useEffect(() => {
    if (!enabled || !ready || role === 'viewer') return;
    let cancelled = false;

    async function init() {
      try {
        const preset = (mediaConfig && mediaConfig.preset) || { width: 1280, height: 720, frameRate: 30 };
        const videoConstraints = {
          width: { ideal: preset.width },
          height: { ideal: preset.height },
          frameRate: { ideal: preset.frameRate },
        };
        if (mediaConfig && mediaConfig.camId) {
          videoConstraints.deviceId = { exact: mediaConfig.camId };
        } else {
          videoConstraints.facingMode = (mediaConfig && !mediaConfig.facingFront) ? 'environment' : 'user';
        }
        const audioConstraints = {
          noiseSuppression: mediaConfig ? mediaConfig.noiseSup !== false : true,
          echoCancellation: mediaConfig ? mediaConfig.echoCan !== false : true,
          autoGainControl: mediaConfig ? mediaConfig.autoGain !== false : true,
        };
        if (mediaConfig && mediaConfig.micId) audioConstraints.deviceId = { exact: mediaConfig.micId };

        let stream;
        if (mediaConfig && mediaConfig.stream && mediaConfig.stream.active) {
          stream = mediaConfig.stream;
        } else {
          stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: audioConstraints });
        }
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        setLocalStream(stream);
        await rtcManager.publishStream(stream);
      } catch (e) {
        console.error('[usePeerVideoStreams] getUserMedia/publish error:', e);
      }
    }
    init();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [enabled, ready, role, mediaConfig]);

  // ── 3. Subscribe to a producer and merge into the guest's stream ───────
  const consumeProducer = useCallback(async (producerId, guestId, kind) => {
    if (!producerId || subscribedRef.current.has(producerId)) return;
    subscribedRef.current.add(producerId);
    try {
      const trackStream = await rtcManager.subscribeToProducer(producerId);
      setRemoteStreams((prev) => {
        const existing = prev[guestId] || { guestId, username: guestNamesRef.current[guestId] || guestId, stream: null, videoProducerId: null, audioProducerId: null };
        // Merge the new track into the existing combined MediaStream (or seed it)
        let combined = existing.stream ? new MediaStream(existing.stream.getTracks()) : new MediaStream();
        trackStream.getTracks().forEach((t) => {
          if (kind === 'audio') {
            // drop any stale audio track first to avoid duplicates on re-subscribe
            combined.getAudioTracks().forEach((old) => combined.removeTrack(old));
          }
          combined.addTrack(t);
        });
        return {
          ...prev,
          [guestId]: {
            ...existing,
            stream: combined,
            videoProducerId: kind === 'video' ? producerId : existing.videoProducerId,
            audioProducerId: kind === 'audio' ? producerId : existing.audioProducerId,
          },
        };
      });
    } catch (e) {
      console.error('[usePeerVideoStreams] subscribe error:', producerId, e);
      subscribedRef.current.delete(producerId);
    }
  }, []);

  // ── 4. Wire socket events: roster names, new producers, closed producers ─
  useEffect(() => {
    if (!enabled || !socket) return;

    function onRoster({ guests }) {
      if (!guests) return;
      const names = {};
      guests.forEach((g) => { names[g.guestId] = g.username || g.guestId; });
      guestNamesRef.current = Object.assign(guestNamesRef.current, names);
      setRemoteStreams((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.keys(names).forEach((gid) => {
          if (next[gid] && next[gid].username !== names[gid]) {
            next[gid] = { ...next[gid], username: names[gid] };
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }

    function onNewProducer({ producerId, guestId, kind }) {
      if (guestId === userId) return; // don't subscribe to our own producer
      consumeProducer(producerId, guestId, kind);
    }

    function onProducerClosed({ producerId }) {
      if (!subscribedRef.current.has(producerId)) return;
      subscribedRef.current.delete(producerId);
      setRemoteStreams((prev) => {
        const next = {};
        Object.keys(prev).forEach((gid) => {
          const g = prev[gid];
          let videoId = g.videoProducerId;
          let audioId = g.audioProducerId;
          let tracks = g.stream ? g.stream.getTracks() : [];
          if (videoId === producerId) {
            tracks = tracks.filter((t) => t.kind !== 'video');
            videoId = null;
          }
          if (audioId === producerId) {
            tracks = tracks.filter((t) => t.kind !== 'audio');
            audioId = null;
          }
          if (videoId || audioId) {
            next[gid] = { ...g, stream: new MediaStream(tracks), videoProducerId: videoId, audioProducerId: audioId };
          }
        });
        return next;
      });
    }

    // Late-joiners: join-room-ack carries existingProducers for the room
    function onJoinAck(payload) {
      if (!payload || !Array.isArray(payload.existingProducers)) return;
      payload.existingProducers.forEach((p) => {
        if (p.guestId && p.guestId !== userId) consumeProducer(p.producerId, p.guestId, p.kind);
      });
    }

    socket.on('roster-update', onRoster);
    socket.on('new-producer', onNewProducer);
    socket.on('producer-closed', onProducerClosed);
    socket.on('join-room-ack', onJoinAck);
    return () => {
      socket.off('roster-update', onRoster);
      socket.off('new-producer', onNewProducer);
      socket.off('producer-closed', onProducerClosed);
      socket.off('join-room-ack', onJoinAck);
    };
  }, [enabled, socket, userId, consumeProducer]);

  // ── 5. Controls: replaceTrack (virtual cam / screen share), mute, cam off ─
  const replaceTrack = useCallback((kind, newTrack) => {
    return rtcManager.replaceTrack(kind, newTrack);
  }, []);

  const pauseKind = useCallback((kind) => {
    rtcManager.pauseProducer(kind);
    if (kind === 'video') setIsCamOff(true);
    if (kind === 'audio') setIsMicOff(true);
  }, []);

  const resumeKind = useCallback((kind) => {
    rtcManager.resumeProducer(kind);
    if (kind === 'video') setIsCamOff(false);
    if (kind === 'audio') setIsMicOff(false);
  }, []);

  const toggleCam = useCallback(() => {
    if (isCamOff) resumeKind('video'); else pauseKind('video');
  }, [isCamOff, resumeKind, pauseKind]);

  const toggleMic = useCallback(() => {
    if (isMicOff) resumeKind('audio'); else pauseKind('audio');
  }, [isMicOff, resumeKind, pauseKind]);

  // Apply enabled toggles to the live local tracks too (immediate visual)
  useEffect(() => {
    if (!streamRef.current) return;
    streamRef.current.getVideoTracks().forEach((t) => { t.enabled = !isCamOff; });
    streamRef.current.getAudioTracks().forEach((t) => { t.enabled = !isMicOff; });
  }, [isCamOff, isMicOff]);

  return {
    localStream,
    remoteStreams, // { [guestId]: { guestId, username, stream, videoProducerId, audioProducerId } }
    ready,
    isCamOff,
    isMicOff,
    replaceTrack,
    toggleCam,
    toggleMic,
  };
}

export default usePeerVideoStreams;