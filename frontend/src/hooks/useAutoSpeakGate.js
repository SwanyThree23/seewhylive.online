import { useState, useEffect, useRef, useCallback } from 'react';
function createAnalyser(stream) {
  if (!stream) return null;
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    var ctx = new AudioCtx();
    var analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(analyser);
    return { ctx: ctx, analyser: analyser };
  } catch(e) { return null; }
}
export function useAutoSpeakGate(opts) {
  var stream    = (opts && opts.stream)    || null;
  var threshold = (opts && opts.threshold) || 0.015;
  var s1 = useState(false);  var isSpeaking = s1[0]; var setIsSpeaking = s1[1];
  var s2 = useState(0);      var micLevel   = s2[0]; var setMicLevel   = s2[1];
  var s3 = useState(false);  var gateOpen   = s3[0]; var setGateOpen   = s3[1];
  var s4 = useState(false);  var raisedHand = s4[0]; var setRaisedHand = s4[1];
  var aRef = useRef(null); var rafRef = useRef(null); var aboveRef = useRef(false); var dataRef = useRef(null);
  useEffect(function() {
    if (aRef.current) { try { aRef.current.ctx.close(); } catch(e) {} aRef.current = null; }
    cancelAnimationFrame(rafRef.current);
    if (!stream) { setIsSpeaking(false); setMicLevel(0); return; }
    var h = createAnalyser(stream);
    if (!h) return;
    aRef.current = h;
    dataRef.current = new Uint8Array(h.analyser.frequencyBinCount);
    function tick() {
      if (!aRef.current) return;
      aRef.current.analyser.getByteTimeDomainData(dataRef.current);
      var sum = 0;
      for (var i = 0; i < dataRef.current.length; i++) { var v = (dataRef.current[i]-128)/128; sum += v*v; }
      var rms = Math.sqrt(sum/dataRef.current.length);
      setMicLevel(Math.min(100, Math.floor(rms*600)));
      var above = rms > threshold;
      if (above && !aboveRef.current) { aboveRef.current = true; setIsSpeaking(true); }
      else if (!above && aboveRef.current) { aboveRef.current = false; setIsSpeaking(false); }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return function() { cancelAnimationFrame(rafRef.current); if (aRef.current) { try { aRef.current.ctx.close(); } catch(e) {} aRef.current = null; } };
  }, [stream, threshold]);
  var openGate  = useCallback(function() { setGateOpen(true); setRaisedHand(false); }, []);
  var closeGate = useCallback(function() { setGateOpen(false); }, []);
  var raiseHand = useCallback(function() { setRaisedHand(true); }, []);
  var lowerHand = useCallback(function() { setRaisedHand(false); }, []);
  return { isSpeaking: isSpeaking, micLevel: micLevel, gateOpen: gateOpen, openGate: openGate, closeGate: closeGate, raisedHand: raisedHand, raiseHand: raiseHand, lowerHand: lowerHand };
}
