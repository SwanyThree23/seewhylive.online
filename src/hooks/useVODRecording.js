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

export function useVODRecording({ streamId, creatorId, title, stream } = {}) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [blobUrl, setBlobUrl] = useState(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const prevBlobUrlRef = useRef(null);

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
    try {
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
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

  return { recording, duration, blobUrl, startRecording, stopRecording, downloadRecording };
}
