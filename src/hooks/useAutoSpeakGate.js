import { useState, useEffect, useRef } from 'react';

// Hold the "speaking" state for this many ms after the last peak
// to prevent rapid flickering at borderline volume levels
const HOLD_MS = 400;

export function useAutoSpeakGate({ stream, enabled = false, threshold = 0.015 } = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const rafRef = useRef(null);
  const holdTimerRef = useRef(null);
  const speakingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !stream) {
      setIsSpeaking(false);
      setMicLevel(0);
      return;
    }
    let ctx;
    try {
      ctx = new AudioContext();
    } catch { return; }
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
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

      if (rms > threshold) {
        // Clear any pending hold-off timer; stay speaking
        clearTimeout(holdTimerRef.current);
        if (!speakingRef.current) {
          speakingRef.current = true;
          setIsSpeaking(true);
        }
      } else if (speakingRef.current) {
        // Below threshold — schedule hold-off before flipping to false
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = setTimeout(() => {
          speakingRef.current = false;
          setIsSpeaking(false);
        }, HOLD_MS);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(holdTimerRef.current);
      speakingRef.current = false;
      ctx.close().catch(() => {});
    };
  }, [stream, enabled, threshold]);

  return { isSpeaking, micLevel };
}
