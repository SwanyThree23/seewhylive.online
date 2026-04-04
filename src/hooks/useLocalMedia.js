import { useState, useEffect, useRef } from 'react';

/**
 * Hook that acquires local mic + camera via browser getUserMedia.
 * Returns { localStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo, error }
 */
export function useLocalMedia({ audio = true, video = true } = {}) {
  const [localStream, setLocalStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(audio);
  const [videoEnabled, setVideoEnabled] = useState(video);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        setLocalStream(stream);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Media access denied');
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []); // only on mount

  const toggleAudio = () => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = !audioEnabled; });
    setAudioEnabled(v => !v);
  };

  const toggleVideo = () => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach(t => { t.enabled = !videoEnabled; });
    setVideoEnabled(v => !v);
  };

  return { localStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo, error };
}