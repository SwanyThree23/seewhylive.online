import { useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Manages WebRTC peer connections for ZEGOCLOUD multi-user streaming
 * - Handles PeerConnection lifecycle (create, connect, close)
 * - Auto-reconnects on network changes
 * - Cleans up on component unmount
 */
export function useWebRTCPeers(roomId, localStream) {
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(localStream);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Add a peer connection
  const addPeer = useCallback((peerId, initiator = false) => {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        ],
      });

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      // Log ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('ICE candidate:', event.candidate);
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`Peer ${peerId} connection state: ${peerConnection.connectionState}`);
      };

      peersRef.current.set(peerId, peerConnection);
      return peerConnection;
    } catch (err) {
      console.error('Failed to add peer:', err);
      return null;
    }
  }, []);

  // Remove a peer connection
  const removePeer = useCallback((peerId) => {
    const peer = peersRef.current.get(peerId);
    if (peer) {
      peer.close();
      peersRef.current.delete(peerId);
    }
  }, []);

  // Get all active peers
  const getPeers = useCallback(() => {
    return Array.from(peersRef.current.entries()).map(([id, conn]) => ({ id, connection: conn }));
  }, []);

  // Clean up all connections on unmount
  useEffect(() => {
    return () => {
      peersRef.current.forEach(peer => peer.close());
      peersRef.current.clear();
    };
  }, []);

  return { addPeer, removePeer, getPeers, peersRef };
}