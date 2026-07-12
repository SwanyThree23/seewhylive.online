import { useState, useEffect, useRef, useCallback } from 'react';
import { RESOLUTION_PRESETS } from './useCameraDevices';

/**
 * Acquires local mic + camera via browser getUserMedia.
 * Supports device selection, resolution presets, camera switching, and screen share.
 *
 * @param {object} opts
 * @param {boolean}  opts.audio           - request microphone (default true)
 * @param {boolean}  opts.video           - request camera (default true)
 * @param {string}   opts.videoDeviceId   - specific camera deviceId (optional)
 * @param {string}   opts.audioDeviceId   - specific mic deviceId (optional)
 * @param {string}   opts.resolution      - '360p'|'480p'|'720p'|'1080p' (default '720p')
 */
export function useLocalMedia({
  audio = true,
  video = true,
  videoDeviceId = null,
  audioDeviceId = null,
  resolution = '720p',
} = {}) {
  const [localStream, setLocalStream]   = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(audio);
  const [videoEnabled, setVideoEnabled] = useState(video);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState(videoDeviceId);
  const [activeAudioId, setActiveAudioId] = useState(audioDeviceId);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  // Acquire (or re-acquire) camera/mic stream
  const acquire = useCallback(async (opts = {}) => {
    const vId  = opts.videoDeviceId ?? activeVideoId;
    const aId  = opts.audioDeviceId ?? activeAudioId;
    const res  = opts.resolution    ?? resolution;

    const videoConstraint = video === false ? false : {
      ...(RESOLUTION_PRESETS[res] || RESOLUTION_PRESETS['720p']),
      ...(vId ? { deviceId: { ideal: vId } } : {}),
    };
    const audioConstraint = audio === false ? false : {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 48000,
      ...(aId ? { deviceId: { ideal: aId } } : {}),
    };

    // Stop existing tracks before acquiring new ones
    streamRef.current?.getTracks().forEach(t => t.stop());

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraint,
        audio: audioConstraint,
      });
      streamRef.current = stream;
      // Restore mute state
      stream.getAudioTracks().forEach(t => { t.enabled = audioEnabled; });
      stream.getVideoTracks().forEach(t => { t.enabled = videoEnabled; });
      setLocalStream(stream);
      setError(null);
      return stream;
    } catch (err) {
      const msg = err.name === 'NotFoundError'
        ? 'Camera or microphone not found'
        : err.name === 'NotAllowedError'
          ? 'Camera/mic access denied — check browser permissions'
          : err.message || 'Media access failed';
      setError(msg);
      return null;
    }
  }, [audio, video, activeVideoId, activeAudioId, resolution, audioEnabled, videoEnabled]);

  // Initial acquisition on mount
  useEffect(() => {
    let cancelled = false;
    acquire().then(stream => {
      if (cancelled) stream?.getTracks().forEach(t => t.stop());
    });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle audio mute without re-acquiring
  const toggleAudio = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const next = !audioEnabled;
    stream.getAudioTracks().forEach(t => { t.enabled = next; });
    setAudioEnabled(next);
  }, [audioEnabled]);

  // Toggle video mute without re-acquiring
  const toggleVideo = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const next = !videoEnabled;
    stream.getVideoTracks().forEach(t => { t.enabled = next; });
    setVideoEnabled(next);
  }, [videoEnabled]);

  // Switch to a different camera device (hot-swap — replaces track in-place)
  const replaceVideoDevice = useCallback(async (deviceId) => {
    setActiveVideoId(deviceId);
    const resPreset = RESOLUTION_PRESETS[resolution] || RESOLUTION_PRESETS['720p'];
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { ...resPreset, deviceId: { exact: deviceId } },
        audio: false,
      });
      const [newTrack] = newStream.getVideoTracks();
      if (!newTrack) return;
      newTrack.enabled = videoEnabled;

      // Replace the video track in the existing stream
      const old = streamRef.current?.getVideoTracks()[0];
      if (old) {
        streamRef.current.removeTrack(old);
        old.stop();
      }
      streamRef.current?.addTrack(newTrack);
      setLocalStream(new MediaStream(streamRef.current?.getTracks() || [newTrack]));
    } catch (err) {
      setError(err.message || 'Camera switch failed');
    }
  }, [resolution, videoEnabled]);

  // Switch to a different mic (hot-swap)
  const replaceAudioDevice = useCallback(async (deviceId) => {
    setActiveAudioId(deviceId);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, deviceId: { exact: deviceId } },
        video: false,
      });
      const [newTrack] = newStream.getAudioTracks();
      if (!newTrack) return;
      newTrack.enabled = audioEnabled;

      const old = streamRef.current?.getAudioTracks()[0];
      if (old) {
        streamRef.current.removeTrack(old);
        old.stop();
      }
      streamRef.current?.addTrack(newTrack);
      setLocalStream(new MediaStream(streamRef.current?.getTracks() || [newTrack]));
    } catch (err) {
      setError(err.message || 'Mic switch failed');
    }
  }, [audioEnabled]);

  // Flip between front/back cameras (mobile convenience)
  const switchCamera = useCallback(async (cameras = []) => {
    if (cameras.length < 2) return;
    const currentIdx = cameras.findIndex(c => c.deviceId === activeVideoId);
    const next = cameras[(currentIdx + 1) % cameras.length];
    if (next) await replaceVideoDevice(next.deviceId);
  }, [activeVideoId, replaceVideoDevice]);

  // Start screen share (replaces video track)
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', displaySurface: 'monitor' },
        audio: false,
      });
      setScreenStream(stream);
      setIsSharingScreen(true);

      const [screenTrack] = stream.getVideoTracks();
      // When the user stops sharing via browser UI
      screenTrack.onended = () => stopScreenShare();

      // Replace camera track with screen track
      const old = streamRef.current?.getVideoTracks()[0];
      if (old) {
        streamRef.current.removeTrack(old);
        old.stop();
      }
      streamRef.current?.addTrack(screenTrack);
      setLocalStream(new MediaStream(streamRef.current?.getTracks() || [screenTrack]));
    } catch {}
  }, []);

  const stopScreenShare = useCallback(async () => {
    screenStream?.getTracks().forEach(t => t.stop());
    setScreenStream(null);
    setIsSharingScreen(false);
    // Restore camera
    await acquire({ videoDeviceId: activeVideoId });
  }, [screenStream, acquire, activeVideoId]);

  // Apply audio constraints to the live track without re-acquiring the mic.
  // Useful for toggling noiseSuppression / echoCancellation / autoGainControl.
  const applyAudioConstraints = useCallback(async (constraints) => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      try { await track.applyConstraints(constraints); } catch {}
    }
  }, []);

  return {
    localStream,
    audioEnabled,
    videoEnabled,
    isSharingScreen,
    activeVideoId,
    activeAudioId,
    error,
    toggleAudio,
    toggleVideo,
    replaceVideoDevice,
    replaceAudioDevice,
    applyAudioConstraints,
    switchCamera,
    startScreenShare,
    stopScreenShare,
    reacquire: acquire,
  };
}
