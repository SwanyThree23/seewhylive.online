import { useRef, useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { secureId, isValidPeerId, sanitizeSignalPayload, LIMITS } from '@/lib/security';

const ICE_SERVERS = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun.cloudflare.com:3478'] },
    // TURN relay — ensures connectivity behind symmetric NAT/firewalls
    { urls: 'turn:openrelay.metered.ca:80',              username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443',             username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
  iceCandidatePoolSize: 10,
};

const ICE_TIMEOUT_MS = 30_000;
const VALID_SIGNAL_TYPES = new Set(['peer_join', 'offer', 'answer', 'ice', 'peer_left']);

/**
 * Full WebRTC peer mesh for multi-user live rooms.
 * Signaling uses the RTCSignal entity (not ZEGOStream which is ZEGO SDK config only).
 * Security hardening:
 *  - Cryptographically secure peer IDs (Web Crypto)
 *  - Incoming signal validation (peer ID format, signal type whitelist, max peers)
 *  - Explicit payload spreading prevented (no ...payload into DB create)
 *  - ICE gathering timeout (30 s) to prevent hung connections
 *  - Auto-reconnects dropped peers (ICE failure / disconnect)
 */
export function useWebRTCPeers(roomId, localStream) {
  const peersRef = useRef(new Map()); // peerId → { pc, stream, iceTimer }
  // Update ref synchronously every render — avoids one-render lag vs useEffect
  const localStreamRef = useRef(localStream);
  localStreamRef.current = localStream;

  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [peerStates, setPeerStates] = useState(new Map());
  const [peerUserIds, setPeerUserIds] = useState(new Map());
  const selfIdRef = useRef(secureId('peer'));

  // Replace (or add) tracks on existing connections when stream changes
  useEffect(() => {
    if (!localStream) return;
    peersRef.current.forEach(({ pc }) => {
      const senders = pc.getSenders();
      localStream.getTracks().forEach(track => {
        const sender = senders.find(s => s.track?.kind === track.kind);
        if (sender) {
          // Replace existing track on the sender
          sender.replaceTrack(track).catch(() => {});
        } else {
          // No sender for this track kind yet — add it so the remote peer sees us
          pc.addTrack(track, localStream);
        }
      });
    });
  }, [localStream]);

  // Signaling subscription — uses RTCSignal entity (not ZEGOStream)
  useEffect(() => {
    if (!roomId) return;

    const unsub = base44.entities.RTCSignal.subscribe(async (event) => {
      const msg = event.data;
      if (!msg || msg.room_id !== roomId) return;

      const from = msg.from_peer;
      if (from === selfIdRef.current) return;

      if (!VALID_SIGNAL_TYPES.has(msg.signal_type)) return;
      if (!isValidPeerId(from)) return;

      if (msg.to_peer && msg.to_peer !== selfIdRef.current) return;

      try {
        if (msg.signal_type === 'peer_join') {
          if (peersRef.current.size >= LIMITS.MAX_PEERS) return;
          if (msg.user_id && typeof msg.user_id === 'string') {
            setPeerUserIds(prev => new Map(prev).set(from, msg.user_id));
          }
          addPeer(from);
        } else if (msg.signal_type === 'offer') {
          if (!msg.sdp || typeof msg.sdp !== 'object') return;
          await handleIncomingOffer(from, msg.sdp);
        } else if (msg.signal_type === 'answer') {
          if (!msg.sdp || typeof msg.sdp !== 'object') return;
          await handleIncomingAnswer(from, msg.sdp);
        } else if (msg.signal_type === 'ice') {
          if (!msg.candidate || typeof msg.candidate !== 'object') return;
          await handleIncomingICE(from, msg.candidate);
        } else if (msg.signal_type === 'peer_left') {
          removePeer(from);
        }
      } catch {
        // a bad peer message should not break the room
      }
    });

    return unsub;
  }, [roomId]);

  // Send signals via RTCSignal entity — explicit field mapping, no spread
  const sendSignal = useCallback((toPeer, signalType, payload = {}) => {
    const safe = sanitizeSignalPayload(payload);
    base44.entities.RTCSignal.create({
      room_id: roomId,
      from_peer: selfIdRef.current,
      to_peer: toPeer || null,
      signal_type: signalType,
      sdp: safe.sdp || null,
      candidate: safe.candidate || null,
      user_id: safe.user_id || null,
    }).catch(() => {});
  }, [roomId]);

  const createPeerConnection = useCallback((peerId) => {
    if (peersRef.current.has(peerId)) return peersRef.current.get(peerId).pc;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const remoteStream = new MediaStream();

    // Add local tracks — localStreamRef.current is updated synchronously above,
    // so this always sees the latest stream even on first peer connection after getUserMedia
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach(track => remoteStream.addTrack(track));
      setRemoteStreams(prev => new Map(prev).set(peerId, remoteStream));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(peerId, 'ice', { candidate: event.candidate.toJSON() });
      }
    };

    const iceTimer = setTimeout(() => {
      if (pc.iceConnectionState === 'checking' || pc.iceConnectionState === 'new') {
        removePeer(peerId);
      }
    }, ICE_TIMEOUT_MS);

    // Store entry early so event handlers can mutate reconnectTimer in-place
    const entry = { pc, stream: remoteStream, iceTimer, reconnectTimer: null };
    peersRef.current.set(peerId, entry);

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setPeerStates(prev => new Map(prev).set(peerId, state));
      if (state === 'connected') {
        clearTimeout(iceTimer);
        clearTimeout(entry.reconnectTimer);
        entry.reconnectTimer = null;
      } else if (state === 'failed') {
        removePeer(peerId);
      } else if (state === 'disconnected') {
        // Temporary blip — give ICE restart 8 s to recover before dropping
        entry.reconnectTimer = setTimeout(() => {
          if (pc.connectionState !== 'connected') removePeer(peerId);
        }, 8_000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') pc.restartIce();
    };

    return pc;
  }, [sendSignal]);

  const addPeer = useCallback(async (peerId) => {
    const pc = createPeerConnection(peerId);
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      sendSignal(peerId, 'offer', { sdp: offer });
    } catch {
      removePeer(peerId);
    }
    return pc;
  }, [createPeerConnection, sendSignal]);

  const handleIncomingOffer = useCallback(async (fromPeer, sdp) => {
    const pc = createPeerConnection(fromPeer);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(fromPeer, 'answer', { sdp: answer });
    } catch {
      removePeer(fromPeer);
    }
  }, [createPeerConnection, sendSignal, removePeer]);

  const handleIncomingAnswer = useCallback(async (fromPeer, sdp) => {
    const entry = peersRef.current.get(fromPeer);
    if (entry?.pc) {
      await entry.pc.setRemoteDescription(new RTCSessionDescription(sdp)).catch(() => removePeer(fromPeer));
    }
  }, [removePeer]);

  const handleIncomingICE = useCallback(async (fromPeer, candidate) => {
    const entry = peersRef.current.get(fromPeer);
    if (entry?.pc && candidate) {
      await entry.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    }
  }, []);

  const removePeer = useCallback((peerId) => {
    const entry = peersRef.current.get(peerId);
    if (entry) {
      clearTimeout(entry.iceTimer);
      clearTimeout(entry.reconnectTimer);
      // Stop all remote tracks before closing so consumers see stream end cleanly
      entry.stream?.getTracks().forEach(t => t.stop());
      entry.pc.close();
      peersRef.current.delete(peerId);
    }
    setRemoteStreams(prev => { const m = new Map(prev); m.delete(peerId); return m; });
    setPeerStates(prev => { const m = new Map(prev); m.delete(peerId); return m; });
    setPeerUserIds(prev => { const m = new Map(prev); m.delete(peerId); return m; });
  }, []);

  const getPeers = useCallback(() => {
    return Array.from(peersRef.current.entries()).map(([id, { pc }]) => ({ id, connection: pc }));
  }, []);

  const announceJoin = useCallback((userId) => {
    sendSignal(null, 'peer_join', userId ? { user_id: String(userId) } : {});
  }, [sendSignal]);

  const leaveRoom = useCallback(() => {
    sendSignal(null, 'peer_left', {});
    peersRef.current.forEach(({ pc, iceTimer, reconnectTimer, stream }) => {
      clearTimeout(iceTimer);
      clearTimeout(reconnectTimer);
      stream?.getTracks().forEach(t => t.stop());
      pc.close();
    });
    peersRef.current.clear();
    setRemoteStreams(new Map());
    setPeerStates(new Map());
  }, [sendSignal]);

  useEffect(() => {
    return () => {
      peersRef.current.forEach(({ pc, iceTimer, reconnectTimer, stream }) => {
        clearTimeout(iceTimer);
        clearTimeout(reconnectTimer);
        stream?.getTracks().forEach(t => t.stop());
        pc.close();
      });
      peersRef.current.clear();
    };
  }, []);

  return {
    selfId: selfIdRef.current,
    addPeer,
    removePeer,
    leaveRoom,
    announceJoin,
    getPeers,
    peersRef,
    remoteStreams,
    peerStates,
    peerUserIds,
  };
}
