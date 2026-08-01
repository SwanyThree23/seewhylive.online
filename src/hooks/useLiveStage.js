/**
 * useLiveStage — Room management hook for the LiveStage SFU stage component.
 *
 * Architecture note:
 *   Mirrors the role model used by LiveKit / ZEGOCLOUD:
 *     - Panelists  → publish local camera + mic, subscribe to all remotes.
 *     - Viewers    → subscribe-only; getUserMedia is NEVER called, no bandwidth
 *                    is wasted and no browser camera permission prompt appears.
 *
 *   Under the hood this wraps two existing hooks:
 *     • useLocalMedia  – acquires the local camera/mic MediaStream (panelists only)
 *     • useWebRTCPeers – manages the WebRTC peer mesh via base44 signaling
 *
 *   In a LiveKit integration you would replace useWebRTCPeers with:
 *       import { useRoom } from '@livekit/components-react';
 *   and subscribe to Track.Source.Camera / Track.Source.Microphone via useTracks().
 *
 *   In a ZEGOCLOUD integration you would call:
 *       zegoEngine.startPublishingStream(streamId) for panelists, and
 *       zegoEngine.startPlayingStream(streamId)   for each remote in a loop.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalMedia } from './useLocalMedia';
import { useWebRTCPeers } from './useWebRTCPeers';

/**
 * @typedef {'panelist'|'viewer'} StageRole
 * @typedef {{ peerId: string, userId: string, name: string, stream: MediaStream|null, audioEnabled: boolean, videoEnabled: boolean, isScreenShare: boolean }} StageParticipant
 */

/**
 * @param {object} opts
 * @param {string}    opts.roomId          - The live room / watch-party ID
 * @param {StageRole} opts.role            - 'panelist' (publisher) or 'viewer' (subscriber-only)
 * @param {string}    opts.userId          - Current user's database ID
 * @param {string}    opts.userName        - Display name shown on the tile
 */
export function useLiveStage({ roomId, role, userId, userName }) {
  var isPanelist = role === 'panelist';

  // ── 1. Local media (panelists only) ───────────────────────────────────────
  // Viewers pass audio:false, video:false — getUserMedia is never called.
  var {
    localStream, audioEnabled, videoEnabled,
    toggleAudio, toggleVideo,
    startScreenShare, stopScreenShare, isSharingScreen,
    error: mediaError,
  } = useLocalMedia({ audio: isPanelist, video: isPanelist });

  // ── 2. WebRTC peer mesh ───────────────────────────────────────────────────
  // Viewers pass null as localStream — the hook adds no tracks to offers.
  // peersRef.current is a Map<peerId, {pc}> — pass to VideoTile for quality stats.
  var { remoteStreams, peerStates, peerUserIds, peersRef } =
    useWebRTCPeers(roomId, isPanelist ? localStream : null);

  // ── 3. Build participants array ───────────────────────────────────────────
  // Each entry maps to a <video> tile on stage.
  // This mirrors how LiveKit's useTracks() returns TrackReference objects that
  // you attach to <video> via track.publication.track.attach(videoEl).
  var remoteParticipants = useMemo(function() {
    var arr = [];
    remoteStreams.forEach(function(stream, peerId) {
      var uid  = peerUserIds.get(peerId) || peerId;
      var state = peerStates.get(peerId) || 'connected';
      // Detect screen-share tracks: getVideoTracks()[0] will have label containing 'screen'
      var videoTracks = stream ? stream.getVideoTracks() : [];
      var isScreenShare = videoTracks.some(function(t) {
        return t.label.toLowerCase().includes('screen') || t.label.toLowerCase().includes('display');
      });
      arr.push({
        peerId:       peerId,
        userId:       uid,
        name:         uid,
        stream:       stream,
        audioEnabled: stream ? stream.getAudioTracks().some(function(t) { return t.enabled && !t.muted; }) : false,
        videoEnabled: videoTracks.some(function(t) { return t.enabled && !t.muted; }),
        isScreenShare: isScreenShare,
        state:        state,
      });
    });
    return arr;
  }, [remoteStreams, peerStates, peerUserIds]);

  // Local participant (panelists only — viewers don't appear on stage)
  var localParticipant = isPanelist ? {
    peerId:        'local',
    userId:        userId,
    name:          userName,
    stream:        localStream,
    audioEnabled:  audioEnabled,
    videoEnabled:  videoEnabled,
    isScreenShare: false,
    state:         'connected',
    isLocal:       true,
  } : null;

  // Full participant list: local first (if panelist), then remotes
  var participants = useMemo(function() {
    var list = localParticipant ? [localParticipant] : [];
    return list.concat(remoteParticipants);
  }, [localParticipant, remoteParticipants]);

  // Screen-share track (if any participant is sharing screen)
  var screenShare = remoteParticipants.find(function(p) { return p.isScreenShare; }) || null;

  return {
    participants,
    screenShare,
    localParticipant,
    remoteParticipants,
    // Controls (panelists only; no-ops for viewers)
    toggleAudio,
    toggleVideo,
    audioEnabled,
    videoEnabled,
    // Screen share — panelists only
    startScreenShare: isPanelist ? startScreenShare : null,
    stopScreenShare:  isPanelist ? stopScreenShare  : null,
    isSharingScreen:  isPanelist ? isSharingScreen  : false,
    // Raw peer map for per-peer RTCPeerConnection quality stats
    peersRef,
    localStream,
    mediaError,
    isPanelist,
  };
}
