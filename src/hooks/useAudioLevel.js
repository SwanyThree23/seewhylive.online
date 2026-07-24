import { useEffect, useRef, useState } from 'react';

/**
 * Measures real-time audio level from a MediaStream using the Web Audio API.
 * Returns `isSpeaking` (boolean) and `level` (0-100).
 *
 * Only creates an AudioContext when a live stream is present;
 * cleans up on stream change or unmount to prevent memory leaks.
 */
export function useAudioLevel(stream, threshold = 12, intervalMs = 100) {
  var [isSpeaking, setIsSpeaking] = useState(false);
  var [level, setLevel]         = useState(0);
  var ctxRef = useRef(null);

  useEffect(function() {
    if (!stream) {
      setIsSpeaking(false);
      setLevel(0);
      return;
    }

    var audioTracks = stream.getAudioTracks ? stream.getAudioTracks() : [];
    if (!audioTracks.length) return;

    var ctx, source, analyser, timer;
    try {
      ctx      = new (window.AudioContext || window.webkitAudioContext)();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source   = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      ctxRef.current = ctx;

      var data = new Uint8Array(analyser.frequencyBinCount);
      timer = setInterval(function() {
        analyser.getByteFrequencyData(data);
        var sum = 0;
        for (var i = 0; i < data.length; i++) sum += data[i];
        var avg = sum / data.length;
        var pct = Math.min(100, Math.round(avg));
        setLevel(pct);
        setIsSpeaking(avg > threshold);
      }, intervalMs);
    } catch (_) {
      // AudioContext not available (e.g. unit tests, SSR)
    }

    return function() {
      clearInterval(timer);
      try {
        if (source)   source.disconnect();
        if (ctx && ctx.state !== 'closed') ctx.close();
      } catch (_) {}
    };
  }, [stream, threshold, intervalMs]);

  return { isSpeaking, level };
}
