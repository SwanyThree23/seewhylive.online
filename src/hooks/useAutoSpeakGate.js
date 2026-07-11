import { useState, useEffect, useRef } from 'react';

export function useAutoSpeakGate({ stream, enabled = false, threshold = 0.015 } = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const rafRef = useRef(null);
  const analyserRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    if (!enabled || !stream) return;
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    ctxRef.current = ctx;
    analyserRef.current = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      setMicLevel(rms);
      setIsSpeaking(rms > threshold);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ctx.close();
    };
  }, [stream, enabled, threshold]);

  return { isSpeaking, micLevel };
}
