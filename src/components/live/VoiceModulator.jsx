import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

var PRESETS = [
  { id: 'studio',    label: 'Studio Crisp',   pitch: 0,    formant: 0,    reverb: 0.05, distort: 0,    desc: 'Clean, broadcast-ready' },
  { id: 'cyber',     label: 'Cyber Droid',    pitch: -4,   formant: -2,   reverb: 0.1,  distort: 0.3,  desc: 'Robotic + metallic' },
  { id: 'cathedral', label: 'Vast Cathedral', pitch: 0,    formant: 0,    reverb: 0.75, distort: 0,    desc: 'Deep hall reverb' },
  { id: 'autotune',  label: 'Hyper Autotune', pitch: 0,    formant: 2,    reverb: 0.15, distort: 0.1,  desc: 'T-Pain pitched' },
  { id: 'behemoth',  label: 'Behemoth',       pitch: -8,   formant: -4,   reverb: 0.2,  distort: 0.6,  desc: 'Deep monster voice' },
  { id: 'megaphone', label: 'Megaphone',      pitch: 0,    formant: 0,    reverb: 0,    distort: 0.8,  desc: 'Distorted bullhorn' },
];

var GOLD = '#C9A84C';

export default function VoiceModulator(props) {
  var isHost = props.isHost;
  var [expanded, setExpanded] = useState(false);
  var [active, setActive] = useState(false);
  var [preset, setPreset] = useState('studio');
  var [wet, setWet] = useState(0.5);
  var [hearSelf, setHearSelf] = useState(false);
  var [micOn, setMicOn] = useState(false);
  var [vu, setVu] = useState(0);

  var ctxRef = useRef(null);
  var sourceRef = useRef(null);
  var analyserRef = useRef(null);
  var rafRef = useRef(null);
  var streamRef = useRef(null);

  function stopChain() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (sourceRef.current) { try { sourceRef.current.disconnect(); } catch (_e) {} sourceRef.current = null; }
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      ctxRef.current.close().catch(function() {});
      ctxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(function(t) { t.stop(); });
      streamRef.current = null;
    }
    setMicOn(false);
    setVu(0);
  }

  var startChain = useCallback(function(presetId, wetVal, shouldHear) {
    stopChain();
    var p = PRESETS.find(function(x) { return x.id === presetId; }) || PRESETS[0];

    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(stream) {
      streamRef.current = stream;
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      var ctx = new AudioCtx();
      ctxRef.current = ctx;

      var src = ctx.createMediaStreamSource(stream);
      sourceRef.current = src;

      var analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      var dist = ctx.createWaveShaper();
      if (p.distort > 0) {
        var n = 256;
        var curve = new Float32Array(n);
        var deg = p.distort * 400;
        for (var i = 0; i < n; i++) {
          var x = (i * 2) / n - 1;
          curve[i] = ((Math.PI + deg) * x) / (Math.PI + deg * Math.abs(x));
        }
        dist.curve = curve;
        dist.oversample = '4x';
      }

      var formantFilter = ctx.createBiquadFilter();
      formantFilter.type = 'peaking';
      formantFilter.frequency.value = 500 + p.formant * 80;
      formantFilter.Q.value = 1.5;
      formantFilter.gain.value = p.formant * 3;

      var convolver = ctx.createConvolver();
      if (p.reverb > 0) {
        var bufLen = ctx.sampleRate * 2;
        var impulse = ctx.createBuffer(2, bufLen, ctx.sampleRate);
        for (var ch = 0; ch < 2; ch++) {
          var channelData = impulse.getChannelData(ch);
          for (var s = 0; s < bufLen; s++) {
            channelData[s] = (Math.random() * 2 - 1) * Math.pow(1 - s / bufLen, 1 / (p.reverb + 0.001));
          }
        }
        convolver.buffer = impulse;
      }

      var dryGain = ctx.createGain();
      dryGain.gain.value = 1 - wetVal;
      var wetGain = ctx.createGain();
      wetGain.gain.value = wetVal;
      var masterGain = ctx.createGain();
      masterGain.gain.value = 1;

      src.connect(analyser);
      src.connect(dryGain);
      src.connect(formantFilter);
      formantFilter.connect(dist);
      dist.connect(convolver);
      convolver.connect(wetGain);
      dryGain.connect(masterGain);
      wetGain.connect(masterGain);
      if (shouldHear) { masterGain.connect(ctx.destination); }

      setMicOn(true);

      function tick() {
        if (!analyserRef.current) return;
        var buf = new Uint8Array(analyserRef.current.fftSize);
        analyserRef.current.getByteTimeDomainData(buf);
        var sum = 0;
        for (var bi = 0; bi < buf.length; bi++) {
          var v = (buf[bi] - 128) / 128;
          sum += v * v;
        }
        setVu(Math.min(1, Math.sqrt(sum / buf.length) * 8));
        rafRef.current = requestAnimationFrame(tick);
      }
      tick();
    }).catch(function(e) {
      toast.error('Mic access denied: ' + e.message);
      setActive(false);
    });
  }, []);

  useEffect(function() {
    if (active) { startChain(preset, wet, hearSelf); } else { stopChain(); }
    return function() { stopChain(); };
  }, [active]);

  useEffect(function() {
    if (active) { startChain(preset, wet, hearSelf); }
  }, [preset, wet, hearSelf]);

  if (!isHost) return null;

  var currentPreset = PRESETS.find(function(p) { return p.id === preset; }) || PRESETS[0];

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
      <button
        onClick={function() { setExpanded(!expanded); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
      >
        <span style={{ fontSize: 16 }}>🎙</span>
        <span style={{ fontWeight: 700, fontSize: 13, flex: 1, textAlign: 'left' }}>Voice Modulator</span>
        {active && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#00FF88', fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FF88', display: 'inline-block' }} />
            LIVE
          </span>
        )}
        {expanded ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Real-time browser voice effects via Web Audio API. Modulate your mic before it reaches your audience.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {PRESETS.map(function(p) {
              var isSel = preset === p.id;
              return (
                <button key={p.id} onClick={function() { setPreset(p.id); }} style={{ padding: '10px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: isSel ? 'rgba(201,168,76,0.12)' : 'rgba(0,0,0,0.3)', border: '1px solid ' + (isSel ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.08)') }}>
                  <div style={{ fontWeight: 800, fontSize: 12, color: isSel ? GOLD : 'rgba(255,255,255,0.75)', marginBottom: 2 }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{p.desc}</div>
                </button>
              );
            })}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Wet / Dry Signal</span>
              <span style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>{Math.round(wet * 100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.01" value={wet} onChange={function(e) { setWet(parseFloat(e.target.value)); }} style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
              <span>Dry (original)</span><span>Wet (effect)</span>
            </div>
          </div>
          {active && (
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 6, height: 8, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: (vu * 100) + '%', background: 'linear-gradient(90deg,#00FF88,' + GOLD + ',#FF1A3C)', borderRadius: 6, transition: 'width 50ms linear' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={function() { setActive(!active); }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: active ? 'rgba(255,26,60,0.15)' : 'rgba(201,168,76,0.12)', border: '1px solid ' + (active ? 'rgba(255,26,60,0.4)' : 'rgba(201,168,76,0.3)'), color: active ? '#FF1A3C' : GOLD }}>
              {active ? React.createElement(MicOff, { size: 14 }) : React.createElement(Mic, { size: 14 })}
              {active ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={function() { setHearSelf(!hearSelf); }} style={{ padding: '10px 14px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, background: hearSelf ? 'rgba(96,165,250,0.12)' : 'rgba(0,0,0,0.3)', border: '1px solid ' + (hearSelf ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.08)'), color: hearSelf ? '#60A5FA' : 'rgba(255,255,255,0.4)' }}>
              {React.createElement(Volume2, { size: 13 })} Hear Self
            </button>
          </div>
          {active && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0, textAlign: 'center' }}>
              Preset: <strong style={{ color: GOLD }}>{currentPreset.label}</strong> — {currentPreset.desc}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
