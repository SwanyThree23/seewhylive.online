import { useState, useRef, useCallback } from 'react';

export function formatDuration(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${m}:${String(s).padStart(2,'0')}`;
}

export function useVODRecording({ streamId, creatorId, title } = {}) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  const startRecording = useCallback(() => {
    setRecording(true);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  }, []);

  const stopRecording = useCallback(() => {
    setRecording(false);
    clearInterval(timerRef.current);
  }, []);

  return { recording, duration, startRecording, stopRecording };
}
