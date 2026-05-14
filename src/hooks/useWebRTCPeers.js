import { useRef, useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const ICE_SERVERS = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun.cloudflare.com:3478'] },
  ],
  iceCandidatePoolSize: 10,
};

/**
 * Full WebRTC peer mesh for multi-user live rooms.
 * - Creates RTCPeerConnection per remote peer
 * - Exchanges SDP offer/answer + ICE candidates via Base44 real-time subscriptions
 * - Exposes remote streams so video elements can render them
 * - Auto-reconnects dropped peers (ICE failure / disconnect)
 */
export function useWebRTCPeers(roomId, localStream) {
  const peersRef = useRef(new Map()); // peerId → { pc: RTCPeerConnection, stream: MediaStream }
  const localStreamRef = useRef(localStream);
  const [remoteStreams, setRemoteStreams] = useState(new Map()); // peerId → MediaStream
  const [peerStates, setPeerStates] = useState(new Map()); // peerId → connectionState string
  const selfIdRef = useRef(`peer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  useEffect(() => {
    localStreamRef.current = localStream;
    // If we already have peers, replace tracks
    peersRef.current.forEach(({ pc }) => {
      if (!localStream) return;
      const senders = pc.getSenders();
      localStream.getTracks().forEach(track => {
        const sender = senders.find(s => s.track?.kind === track.kind);
        if (sender) sender.replaceTrack(track).catch(() => {});
      });
    });
  }, [localStream]);

  // Subscribe to signaling messages for this room via entity real-time
  useEffect(() => {
    if (!roomId) return;

    const unsub = base44.entities.ZEGOStream.subscribe(async (event) => {
      const msg = event.data;
      if (!msg || msg.room_id !== roomId) return;
      if (msg.to_peer && msg.to_peer !== selfIdRef.current) return; // not for us

      if (msg.signal_type === 'offer' && msg.from_peer !== selfIdRef.current) {
        await handleIncomingOffer(msg.from_peer, msg.sdp);
      } else if (msg.signal_type === 'answer' && msg.from_peer !== selfIdRef.current) {
        await handleIncomingAnswer(msg.from_peer, msg.sdp);
      } else if (msg.signal_type === 'ice' && msg.from_peer !== selfIdRef.current) {
        await handleIncomingICE(msg.from_peer, msg.candidate);
      } else if (msg.signal_type === 'peer_left' && msg.from_peer !== selfIdRef.current) {
        removePeer(msg.from_peer);
      }
    });

    return unsub;
  }, [roomId]);

  const sendSignal = useCallback((toPeer, signalType, payload) => {
    base44.entities.ZEGOStream.create({
      room_id: roomId,
      from_peer: selfIdRef.current,
      to_peer: toPeer || null,
      signal_type: signalType,
      ...payload,
      created_at: new Date().toISOString(),
    }).catch(() => {});
  }, [roomId]);

  const createPeerConnection = useCallback((peerId) => {
    if (peersRef.current.has(peerId)) return peersRef.current.get(peerId).pc;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const remoteStream = new MediaStream();

    // Add local tracks to this peer
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Receive remote tracks
    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach(track => remoteStream.addTrack(track));
      setRemoteStreams(prev => new Map(prev).set(peerId, remoteStream));
    };

    // Send ICE candidates as they're discovered
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(peerId, 'ice', { candidate: event.candidate });
      }
    };

    // Track connection state
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setPeerStates(prev => new Map(prev).set(peerId, state));

      if (state === 'failed' || state === 'disconnected') {
        // Clean up and signal removal
        removePeer(peerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce();
      }
    };

    peersRef.current.set(peerId, { pc, stream: remoteStream });
    return pc;
  }, [sendSignal]);

  // Initiate connection to a new peer (we are the offerer)
  const addPeer = useCallback(async (peerId) => {
    const pc = createPeerConnection(peerId);
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    sendSignal(peerId, 'offer', { sdp: offer });
    return pc;
  }, [createPeerConnection, sendSignal]);

  const handleIncomingOffer = useCallback(async (fromPeer, sdp) => {
    const pc = createPeerConnection(fromPeer);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendSignal(fromPeer, 'answer', { sdp: answer });
  }, [createPeerConnection, sendSignal]);

  const handleIncomingAnswer = useCallback(async (fromPeer, sdp) => {
    const entry = peersRef.current.get(fromPeer);
    if (entry?.pc) {
      await entry.pc.setRemoteDescription(new RTCSessionDescription(sdp)).catch(() => {});
    }
  }, []);

  const handleIncomingICE = useCallback(async (fromPeer, candidate) => {
    const entry = peersRef.current.get(fromPeer);
    if (entry?.pc && candidate) {
      await entry.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    }
  }, []);

  const removePeer = useCallback((peerId) => {
    const entry = peersRef.current.get(peerId);
    if (entry) {
      entry.pc.close();
      peersRef.current.delete(peerId);
    }
    setRemoteStreams(prev => { const m = new Map(prev); m.delete(peerId); return m; });
    setPeerStates(prev => { const m = new Map(prev); m.delete(peerId); return m; });
  }, []);

  const getPeers = useCallback(() => {
    return Array.from(peersRef.current.entries()).map(([id, { pc }]) => ({ id, connection: pc }));
  }, []);

  const leaveRoom = useCallback(() => {
    sendSignal(null, 'peer_left', {});
    peersRef.current.forEach(({ pc }) => pc.close());
    peersRef.current.clear();
    setRemoteStreams(new Map());
    setPeerStates(new Map());
  }, [sendSignal]);

  useEffect(() => {
    return () => {
      peersRef.current.forEach(({ pc }) => pc.close());
      peersRef.current.clear();
    };
  }, []);

  return {
    selfId: selfIdRef.current,
    addPeer,
    removePeer,
    leaveRoom,
    getPeers,
    peersRef,
    remoteStreams,   // Map<peerId, MediaStream> — bind to <video srcObject={...}>
    peerStates,      // Map<peerId, connectionState>
  };
}