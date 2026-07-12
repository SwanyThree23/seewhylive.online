import { useState, useRef, useCallback, useEffect } from 'react';

export function formatDuration(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${m}:${String(s).padStart(2,'0')}`;
}

// Pick the best mime type the browser supports
function getBestMimeType() {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
    'video/mp4',
  ];
  return candidates.find(t => {
    try { return MediaRecorder.isTypeSupported(t); } catch { return false; }
  }) || '';
}

const CLIP_WINDOW_S = 35; // keep this many seconds of rolling chunks for clip extraction

export function useVODRecording({ streamId, creatorId, title, stream } = {}) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [blobUrl, setBlobUrl] = useState(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  // Each entry: { blob, ts } — ts is the timestamp when the chunk was added
  const chunksRef = useRef([]);
  const prevBlobUrlRef = useRef(null);
  const mimeTypeRef = useRef('');

  const startRecording = useCallback(() => {
    if (!stream) return;
    // Release any previous recording
    if (prevBlobUrlRef.current) {
      URL.revokeObjectURL(prevBlobUrlRef.current);
      prevBlobUrlRef.current = null;
    }
    setBlobUrl(null);
    chunksRef.current = [];

    const mimeType = getBestMimeType();
    mimeTypeRef.current = mimeType;
    try {
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          const now = Date.now();
          chunksRef.current.push({ blob: e.data, ts: now });
          // Trim chunks older than CLIP_WINDOW_S seconds to keep memory bounded
          const cutoff = now - CLIP_WINDOW_S * 1000;
          chunksRef.current = chunksRef.current.filter(c => c.ts >= cutoff);
        }
      };
      mr.onstop = () => {
        const blobs = chunksRef.current.map(c => c.blob);
        const blob = new Blob(blobs, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        prevBlobUrlRef.current = url;
        setBlobUrl(url);
      };
      mr.start(1000); // collect chunks every 1 s
      mediaRecorderRef.current = mr;
    } catch {
      return;
    }

    setRecording(true);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  }, [stream]);

  // Extract the last `seconds` seconds from the rolling chunk buffer as a Blob URL
  const extractClipBlobUrl = useCallback((seconds = 30) => {
    if (!chunksRef.current.length) return null;
    const cutoff = Date.now() - seconds * 1000;
    const relevant = chunksRef.current.filter(c => c.ts >= cutoff);
    if (!relevant.length) return null;
    const blob = new Blob(relevant.map(c => c.blob), { type: mimeTypeRef.current || 'video/webm' });
    return URL.createObjectURL(blob);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setRecording(false);
    clearInterval(timerRef.current);
  }, []);

  const downloadRecording = useCallback((filename) => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || `seewhy-recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [blobUrl]);

  // Stop MediaRecorder if the stream goes away mid-recording
  useEffect(() => {
    if (!stream && recording) stopRecording();
  }, [stream, recording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (prevBlobUrlRef.current) URL.revokeObjectURL(prevBlobUrlRef.current);
    };
  }, []);

  return { recording, duration, blobUrl, startRecording, stopRecording, downloadRecording, extractClipBlobUrl };
}
