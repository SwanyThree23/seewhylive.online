import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import {
  Mic, MicOff, Volume2, VolumeX, ArrowLeft, Upload,
  Play, Square, Sliders, Radio, Music2, Zap, Wind,
  Share2, Download, ExternalLink, ChevronDown, ChevronUp,
  RefreshCw, Check, Settings, Eye, EyeOff,
} from 'lucide-react';
import BrandChyron from '../components/live/BrandChyron';

// ─── Design Tokens ────────────────────────────────────────────────────────────
var GOLD    = '#C9A84C';
var BG      = '#0E0C09';
var CREAM   = '#F0E8D4';
var RED     = '#FF1A3C';

// ─── Voice Modulator Presets ──────────────────────────────────────────────────
var VOICE_PRESETS = [
  { id: 'studio',    label: 'Studio Crisp',    icon: '🎙️', desc: 'Clean broadcast voice',         color: '#60A5FA' },
  { id: 'cyber',     label: 'Cyber Droid',     icon: '🤖', desc: 'Robotic ring modulation',       color: '#A78BFA' },
  { id: 'cathedral', label: 'Vast Cathedral',  icon: '🏛️', desc: 'Deep reverb + delay',           color: '#34D399' },
  { id: 'autotune',  label: 'Hyper Autotune',  icon: '🎵', desc: 'Pitch quantize to key',         color: '#F472B6' },
  { id: 'behemoth',  label: 'Behemoth',        icon: '👹', desc: 'Sub bass boost + pitch down',   color: '#FB923C' },
  { id: 'megaphone', label: 'Megaphone',       icon: '📢', desc: 'Bandpass + grit',               color: GOLD     },
];

// ─── Soundboard presets ───────────────────────────────────────────────────────
var SFX_PRESETS = [
  { id: 'airhorn',   label: 'Airhorn',       icon: '📯', freq: 440,  type: 'sawtooth',  dur: 0.5 },
  { id: 'applause',  label: 'Applause',      icon: '👏', freq: 200,  type: 'noise',     dur: 2.0 },
  { id: 'scratch',   label: 'Scratch',       icon: '🎧', freq: 880,  type: 'sawtooth',  dur: 0.3 },
  { id: 'drop808',   label: '808 Drop',      icon: '💣', freq: 60,   type: 'sine',      dur: 1.5 },
  { id: 'laser',     label: 'Laser Hit',     icon: '⚡', freq: 1200, type: 'square',    dur: 0.4 },
  { id: 'cyberhorn', label: 'Cyber Horn',    icon: '🔊', freq: 330,  type: 'triangle',  dur: 0.8 },
  { id: 'laugh',     label: 'Crowd Laugh',   icon: '😂', freq: 300,  type: 'noise',     dur: 1.8 },
  { id: 'cash',      label: 'Cash',          icon: '💰', freq: 660,  type: 'triangle',  dur: 0.6 },
];

// ─── EQ Bands ─────────────────────────────────────────────────────────────────
var EQ_BANDS = [
  { id: 'sub',      label: 'Sub',     hz: 60   },
  { id: 'bass',     label: 'Bass',    hz: 200  },
  { id: 'low_mid',  label: 'Lo-Mid',  hz: 500  },
  { id: 'mid',      label: 'Mid',     hz: 1000 },
  { id: 'hi_mid',   label: 'Hi-Mid',  hz: 3000 },
  { id: 'presence', label: 'Presence',hz: 6000 },
  { id: 'air',      label: 'Air',     hz: 12000},
];

// ─── Reel Platforms ──────────────────────────────────────────────────────────
var REEL_PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok Short',         icon: '🎵', color: '#ff0050', maxSec: 60,  ratio: '9:16', fmt: 'MP4 / H.264' },
  { id: 'instagram', label: 'Instagram Reel',       icon: '📸', color: '#E1306C', maxSec: 90,  ratio: '9:16', fmt: 'MP4 / H.264' },
  { id: 'spotify',   label: 'Spotify Master Tape',  icon: '🎧', color: '#1DB954', maxSec: 180, ratio: 'Audio', fmt: 'MP3 / 320kbps' },
  { id: 'youtube',   label: 'YouTube VOD Archive',  icon: '▶️',  color: '#FF0000', maxSec: 0,   ratio: '16:9', fmt: 'MP4 / H.264' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

// Synthesize a short tone via Web Audio (poor-man soundboard)
function playSynth(preset, volume, ctx) {
  if (!ctx) return;
  var gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + preset.dur);

  if (preset.type === 'noise') {
    var bufSize = ctx.sampleRate * preset.dur;
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) { data[i] = Math.random() * 2 - 1; }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    return;
  }

  if (preset.id === 'drop808') {
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(preset.freq * 2, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(preset.freq, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + preset.dur);
    return;
  }

  var osc2 = ctx.createOscillator();
  osc2.type = preset.type;
  osc2.frequency.setValueAtTime(preset.freq, ctx.currentTime);
  if (preset.id === 'laser') {
    osc2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + preset.dur);
  }
  osc2.connect(gain);
  gain.connect(ctx.destination);
  osc2.start();
  osc2.stop(ctx.currentTime + preset.dur);
}

// Apply voice preset to an AudioContext chain
function buildVoiceChain(ctx, source, preset, wetDry, eqGains) {
  if (!ctx || !source) return null;
  var nodes = [];

  // EQ nodes
  var eqFilters = EQ_BANDS.map(function(band, idx) {
    var f = ctx.createBiquadFilter();
    f.type = (idx === 0) ? 'lowshelf' : (idx === EQ_BANDS.length - 1) ? 'highshelf' : 'peaking';
    f.frequency.value = band.hz;
    f.gain.value = eqGains[band.id] || 0;
    nodes.push(f);
    return f;
  });

  // Preset-specific processing
  var effectNode = ctx.createGain();
  effectNode.gain.value = 1;

  if (preset === 'studio') {
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 80;
    hp.Q.value = 0.7;
    nodes.push(hp);
    source.connect(hp);
    hp.connect(eqFilters[0]);
  } else if (preset === 'megaphone') {
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 1.0;
    var dist = ctx.createWaveShaper();
    var curve = new Float32Array(256);
    for (var i = 0; i < 256; i++) {
      var x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
    }
    dist.curve = curve;
    nodes.push(bp, dist);
    source.connect(bp);
    bp.connect(dist);
    dist.connect(eqFilters[0]);
  } else if (preset === 'behemoth') {
    var pitchDown = ctx.createBiquadFilter();
    pitchDown.type = 'lowshelf';
    pitchDown.frequency.value = 150;
    pitchDown.gain.value = 12;
    nodes.push(pitchDown);
    source.connect(pitchDown);
    pitchDown.connect(eqFilters[0]);
  } else if (preset === 'cathedral') {
    // Simple delay reverb
    var delay = ctx.createDelay(2.0);
    delay.delayTime.value = 0.3;
    var feedback = ctx.createGain();
    feedback.gain.value = 0.5;
    var dryGain = ctx.createGain();
    dryGain.gain.value = 0.5;
    nodes.push(delay, feedback, dryGain);
    source.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(eqFilters[0]);
    source.connect(dryGain);
    dryGain.connect(eqFilters[0]);
  } else if (preset === 'cyber') {
    // Ring modulation: multiply by carrier
    var ring = ctx.createOscillator();
    ring.type = 'sawtooth';
    ring.frequency.value = 30;
    var ringGain = ctx.createGain();
    ringGain.gain.value = 0;
    ring.connect(ringGain.gain);
    source.connect(ringGain);
    ring.start();
    nodes.push(ring, ringGain);
    ringGain.connect(eqFilters[0]);
  } else {
    // Autotune / default: passthrough with high-pass
    var hpDef = ctx.createBiquadFilter();
    hpDef.type = 'highpass';
    hpDef.frequency.value = 60;
    nodes.push(hpDef);
    source.connect(hpDef);
    hpDef.connect(eqFilters[0]);
  }

  // Chain EQ filters
  for (var ei = 0; ei < eqFilters.length - 1; ei++) {
    eqFilters[ei].connect(eqFilters[ei + 1]);
  }

  // Wet/dry mix
  var wet = ctx.createGain();
  var dry = ctx.createGain();
  wet.gain.value = wetDry / 100;
  dry.gain.value = 1 - (wetDry / 100);
  eqFilters[eqFilters.length - 1].connect(wet);
  source.connect(dry);

  var out = ctx.createGain();
  out.gain.value = 1;
  wet.connect(out);
  dry.connect(out);
  nodes.push(wet, dry, out);

  return { output: out, nodes: nodes };
}

// ─── Components ───────────────────────────────────────────────────────────────

function SectionCard(props) {
  var title = props.title;
  var icon = props.icon;
  var accent = props.accent || GOLD;
  var children = props.children;
  var collapsible = props.collapsible;
  var [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ background: 'rgba(0,0,0,0.3)', cursor: collapsible ? 'pointer' : 'default' }}
        onClick={collapsible ? function() { setOpen(!open); } : undefined}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span className="font-black text-sm uppercase tracking-widest flex-1" style={{ color: accent }}>{title}</span>
        {collapsible && (open ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />)}
      </div>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

function VoiceModulator(props) {
  var micStream = props.micStream;
  var [preset, setPreset] = useState('studio');
  var [wetDry, setWetDry] = useState(70);
  var [hearMyself, setHearMyself] = useState(false);
  var [eqGains, setEqGains] = useState(function() {
    var g = {};
    EQ_BANDS.forEach(function(b) { g[b.id] = 0; });
    return g;
  });
  var ctxRef = useRef(null);
  var chainRef = useRef(null);
  var monitorRef = useRef(null);

  function setEq(id, val) {
    setEqGains(function(prev) { return Object.assign({}, prev, { [id]: Number(val) }); });
  }

  useEffect(function() {
    return function() {
      if (ctxRef.current) { try { ctxRef.current.close(); } catch (_) {} }
    };
  }, []);

  useEffect(function() {
    if (!micStream) return;
    if (!hearMyself) {
      if (monitorRef.current) { try { monitorRef.current.gain.value = 0; } catch (_) {} }
      return;
    }
    try {
      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = ctxRef.current;
      var source = ctx.createMediaStreamSource(micStream);
      var chain = buildVoiceChain(ctx, source, preset, wetDry, eqGains);
      if (chain) {
        chain.output.connect(ctx.destination);
        chainRef.current = chain;
      }
    } catch (e) {}
  }, [micStream, hearMyself, preset, wetDry, eqGains]);

  var selectedPreset = VOICE_PRESETS.find(function(p) { return p.id === preset; }) || VOICE_PRESETS[0];

  return (
    <SectionCard title="Voice Modulator" icon="🎙️" accent={selectedPreset.color} collapsible>
      {/* Preset grid */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {VOICE_PRESETS.map(function(p) {
          var active = preset === p.id;
          return (
            <button
              key={p.id}
              onClick={function() { setPreset(p.id); }}
              className="flex flex-col items-center gap-1 rounded-xl p-3 text-xs font-bold transition-all"
              style={{
                background: active ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.3)',
                border: '1.5px solid ' + (active ? p.color : 'rgba(255,255,255,0.08)'),
                color: active ? p.color : 'rgba(255,255,255,0.5)',
              }}
            >
              <span style={{ fontSize: 20 }}>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Wet/Dry */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <span>DRY</span>
          <span className="font-bold" style={{ color: GOLD }}>Wet/Dry Mix — {wetDry}%</span>
          <span>WET</span>
        </div>
        <input
          type="range" min="0" max="100" value={wetDry}
          onChange={function(e) { setWetDry(Number(e.target.value)); }}
          className="w-full h-2 rounded cursor-pointer"
          style={{ accentColor: GOLD }}
        />
      </div>

      {/* EQ Bands */}
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Harmonic Gate — EQ</p>
        <div className="flex gap-3 items-end justify-between">
          {EQ_BANDS.map(function(band) {
            var val = eqGains[band.id] || 0;
            return (
              <div key={band.id} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                <span className="text-[10px] font-bold" style={{ color: val > 0 ? GOLD : val < 0 ? RED : 'rgba(255,255,255,0.4)' }}>
                  {val > 0 ? '+' + val : val}
                </span>
                <input
                  type="range" min="-12" max="12" value={val} step="1"
                  onChange={function(e) { setEq(band.id, e.target.value); }}
                  className="h-24 cursor-pointer"
                  style={{ writingMode: 'vertical-lr', direction: 'rtl', accentColor: GOLD, width: 20 }}
                />
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{band.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hear Myself */}
      <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div>
          <p className="text-sm font-bold">Hear Myself</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Monitor processed voice in headphones</p>
        </div>
        <button
          onClick={function() { setHearMyself(!hearMyself); }}
          className="rounded-full px-4 py-2 text-xs font-black"
          style={{
            background: hearMyself ? 'rgba(201,168,76,0.2)' : 'rgba(0,0,0,0.5)',
            border: '1.5px solid ' + (hearMyself ? GOLD : 'rgba(255,255,255,0.1)'),
            color: hearMyself ? GOLD : 'rgba(255,255,255,0.4)',
          }}
        >
          {hearMyself ? '● ON' : 'OFF'}
        </button>
      </div>
      {!micStream && (
        <p className="text-xs mt-3 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Grant microphone access below to activate
        </p>
      )}
    </SectionCard>
  );
}

function CueSoundboard() {
  var [volumes, setVolumes] = useState(function() {
    var v = {};
    SFX_PRESETS.forEach(function(s) { v[s.id] = 0.8; });
    return v;
  });
  var [playing, setPlaying] = useState({});
  var [customSounds, setCustomSounds] = useState([]);
  var ctxRef = useRef(null);

  function getCtx() {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') { ctxRef.current.resume(); }
    return ctxRef.current;
  }

  function firePreset(preset) {
    setPlaying(function(prev) { return Object.assign({}, prev, { [preset.id]: true }); });
    setTimeout(function() {
      setPlaying(function(prev) { return Object.assign({}, prev, { [preset.id]: false }); });
    }, preset.dur * 1000 + 100);
    playSynth(preset, volumes[preset.id] || 0.8, getCtx());
  }

  function fireCustom(sound) {
    var ctx = getCtx();
    var buf = ctx.createBufferSource();
    buf.buffer = sound.buffer;
    var g = ctx.createGain();
    g.gain.value = sound.volume || 0.8;
    buf.connect(g);
    g.connect(ctx.destination);
    buf.start();
  }

  function handleUpload(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) { toast.error('Audio files only'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 MB per sound'); return; }
    var reader = new FileReader();
    reader.onload = function(ev) {
      var ctx = getCtx();
      ctx.decodeAudioData(ev.target.result, function(buf) {
        setCustomSounds(function(prev) {
          return prev.concat([{ id: Date.now(), name: file.name.replace(/\.[^.]+$/, ''), buffer: buf, volume: 0.8 }]);
        });
        toast.success('Sound loaded: ' + file.name);
      }, function() {
        toast.error('Could not decode audio file');
      });
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <SectionCard title="Cue Soundboard" icon="🎚️" accent="#A78BFA" collapsible>
      {/* Preset grid */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {SFX_PRESETS.map(function(sfx) {
          var active = playing[sfx.id];
          return (
            <button
              key={sfx.id}
              onClick={function() { firePreset(sfx); }}
              className="flex flex-col items-center gap-1 rounded-xl p-3 select-none transition-all"
              style={{
                background: active ? 'rgba(167,139,250,0.3)' : 'rgba(0,0,0,0.4)',
                border: '1.5px solid ' + (active ? '#A78BFA' : 'rgba(255,255,255,0.08)'),
                transform: active ? 'scale(0.96)' : 'scale(1)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 22 }}>{sfx.icon}</span>
              <span className="text-[10px] font-bold text-center leading-tight">{sfx.label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom sounds */}
      {customSounds.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-5">
          {customSounds.map(function(snd) {
            return (
              <button
                key={snd.id}
                onClick={function() { fireCustom(snd); }}
                className="flex flex-col items-center gap-1 rounded-xl p-3 text-xs font-bold"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1.5px solid rgba(201,168,76,0.3)', color: GOLD, cursor: 'pointer' }}
              >
                <span style={{ fontSize: 20 }}>🎵</span>
                <span className="text-center leading-tight truncate w-full">{snd.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Upload */}
      <label
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 cursor-pointer text-sm font-bold"
        style={{ background: 'rgba(201,168,76,0.08)', border: '1.5px dashed rgba(201,168,76,0.3)', color: 'rgba(201,168,76,0.8)' }}
      >
        <Upload size={15} /> Upload Custom WAV / MP3 (max 5 MB)
        <input type="file" accept="audio/*" onChange={handleUpload} style={{ display: 'none' }} />
      </label>
    </SectionCard>
  );
}

function InstantReelSyndication() {
  var [clipUrl, setClipUrl] = useState('');
  var [exporting, setExporting] = useState({});
  var [done, setDone] = useState({});

  function handleExport(platformId) {
    if (!clipUrl.trim()) { toast.error('Paste a clip URL or upload a recording first'); return; }
    setExporting(function(prev) { return Object.assign({}, prev, { [platformId]: true }); });
    setTimeout(function() {
      setExporting(function(prev) { return Object.assign({}, prev, { [platformId]: false }); });
      setDone(function(prev) { return Object.assign({}, prev, { [platformId]: true }); });
      toast.success('Ready to post to ' + (REEL_PLATFORMS.find(function(p) { return p.id === platformId; }) || {}).label);
    }, 1200);
  }

  return (
    <SectionCard title="Instant Reel Syndication" icon="🎬" accent="#F472B6" collapsible>
      <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Paste a recording URL or use a saved clip, then export to each platform in one tap.
      </p>

      {/* Clip URL input */}
      <div className="flex gap-2 mb-5">
        <input
          type="url"
          value={clipUrl}
          onChange={function(e) { setClipUrl(e.target.value); setDone({}); }}
          placeholder="https://… clip or VOD URL"
          className="flex-1 rounded-xl px-4 py-2 text-sm font-mono outline-none"
          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
        />
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-2 gap-3">
        {REEL_PLATFORMS.map(function(plat) {
          var isDone = done[plat.id];
          var isBusy = exporting[plat.id];
          return (
            <div key={plat.id} className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 20 }}>{plat.icon}</span>
                <div>
                  <p className="text-xs font-black">{plat.label}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{plat.fmt}{plat.maxSec > 0 ? ' · max ' + plat.maxSec + 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] rounded-full px-2 py-0.5 font-bold" style={{ background: plat.color + '22', color: plat.color }}>{plat.ratio}</span>
              </div>
              <button
                onClick={function() { handleExport(plat.id); }}
                disabled={isBusy}
                className="w-full rounded-lg px-3 py-2 text-xs font-black flex items-center justify-center gap-1.5"
                style={{
                  background: isDone ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid ' + (isDone ? '#00FF88' : 'rgba(255,255,255,0.1)'),
                  color: isDone ? '#00FF88' : CREAM,
                  cursor: isBusy ? 'wait' : 'pointer',
                  opacity: isBusy ? 0.6 : 1,
                }}
              >
                {isDone ? <><Check size={12} /> Ready</> : isBusy ? <RefreshCw size={12} className="animate-spin" /> : <><Share2 size={12} /> Export</>}
              </button>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudioDSP() {
  var [micStream, setMicStream] = useState(null);
  var [micActive, setMicActive] = useState(false);
  var [micError, setMicError] = useState('');

  function requestMic() {
    if (micStream) {
      micStream.getTracks().forEach(function(t) { t.stop(); });
      setMicStream(null);
      setMicActive(false);
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(stream) {
      setMicStream(stream);
      setMicActive(true);
      setMicError('');
    }).catch(function(err) {
      setMicError('Microphone access denied — ' + err.message);
      toast.error('Mic access denied');
    });
  }

  useEffect(function() {
    return function() {
      if (micStream) { micStream.getTracks().forEach(function(t) { t.stop(); }); }
    };
  }, [micStream]);

  return (
    <div className="min-h-screen text-white" style={{ background: BG, fontFamily: 'Barlow Condensed, sans-serif' }}>
      <BrandChyron />

      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/10" style={{ background: 'rgba(14,12,9,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to={createPageUrl('ControlRoom')}>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <ArrowLeft size={15} /> Studio
            </button>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A84C, #D4854A)' }}>
              <Sliders size={15} style={{ color: '#000' }} />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest">Live Studio DSP</h1>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Voice · Soundboard · EQ · Reels</p>
            </div>
          </div>

          {/* Mic toggle */}
          <button
            onClick={requestMic}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black"
            style={{
              background: micActive ? 'rgba(255,26,60,0.2)' : 'rgba(255,255,255,0.05)',
              border: '1.5px solid ' + (micActive ? RED : 'rgba(255,255,255,0.15)'),
              color: micActive ? RED : 'rgba(255,255,255,0.6)',
            }}
          >
            {micActive ? <><MicOff size={13} /> Mute Mic</> : <><Mic size={13} /> Enable Mic</>}
          </button>
        </div>
        {micError && (
          <div className="max-w-5xl mx-auto px-4 pb-2 text-xs" style={{ color: RED }}>{micError}</div>
        )}
      </div>

      {/* Main grid */}
      <div className="max-w-5xl mx-auto px-4 py-6 grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="flex flex-col gap-5">
          <VoiceModulator micStream={micStream} />
        </div>
        <div className="flex flex-col gap-5">
          <CueSoundboard />
          <InstantReelSyndication />
        </div>
      </div>
    </div>
  );
}
