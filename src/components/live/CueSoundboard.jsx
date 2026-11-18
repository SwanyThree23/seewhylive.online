import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { toast } from 'sonner';

var GOLD = '#C9A84C';

var SFX = [
  { id: 'airhorn',   label: 'Airhorn',       icon: '📯', freq: 440,  type: 'sawtooth', dur: 0.5 },
  { id: 'applause',  label: 'Applause',      icon: '👏', freq: 200,  type: 'noise',    dur: 2.0 },
  { id: 'scratch',   label: 'Scratch',       icon: '🎧', freq: 880,  type: 'sawtooth', dur: 0.3 },
  { id: 'drop808',   label: '808 Drop',      icon: '💣', freq: 60,   type: 'drop808',  dur: 1.5 },
  { id: 'laser',     label: 'Laser Hit',     icon: '⚡', freq: 1200, type: 'laser',    dur: 0.4 },
  { id: 'cyberhorn', label: 'Cyber Horn',    icon: '🔊', freq: 330,  type: 'triangle', dur: 0.8 },
  { id: 'laugh',     label: 'Crowd Laugh',   icon: '😂', freq: 300,  type: 'noise',    dur: 1.8 },
  { id: 'cash',      label: 'Cash',          icon: '💰', freq: 660,  type: 'triangle', dur: 0.6 },
];

function getCtx(ctxRef) {
  if (!ctxRef.current || ctxRef.current.state === 'closed') {
    ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctxRef.current.state === 'suspended') { ctxRef.current.resume(); }
  return ctxRef.current;
}

function playSynth(sfx, volume, ctx) {
  if (!ctx) return;
  var gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + sfx.dur);

  if (sfx.type === 'noise') {
    var bufSize = Math.floor(ctx.sampleRate * sfx.dur);
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

  if (sfx.type === 'drop808') {
    var osc808 = ctx.createOscillator();
    osc808.type = 'sine';
    osc808.frequency.setValueAtTime(sfx.freq * 2, ctx.currentTime);
    osc808.frequency.exponentialRampToValueAtTime(sfx.freq, ctx.currentTime + 0.1);
    osc808.connect(gain);
    gain.connect(ctx.destination);
    osc808.start();
    osc808.stop(ctx.currentTime + sfx.dur);
    return;
  }

  if (sfx.type === 'laser') {
    var oscL = ctx.createOscillator();
    oscL.type = 'square';
    oscL.frequency.setValueAtTime(sfx.freq, ctx.currentTime);
    oscL.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + sfx.dur);
    oscL.connect(gain);
    gain.connect(ctx.destination);
    oscL.start();
    oscL.stop(ctx.currentTime + sfx.dur);
    return;
  }

  var osc2 = ctx.createOscillator();
  osc2.type = sfx.type;
  osc2.frequency.setValueAtTime(sfx.freq, ctx.currentTime);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  osc2.start();
  osc2.stop(ctx.currentTime + sfx.dur);
}

export default function CueSoundboard(props) {
  var isHost = props.isHost;
  var [expanded, setExpanded] = useState(false);
  var [playing, setPlaying] = useState({});
  var [volume, setVolume] = useState(0.8);
  var [custom, setCustom] = useState([]);
  var ctxRef = useRef(null);

  if (!isHost) return null;

  function fire(sfx) {
    var ctx = getCtx(ctxRef);
    setPlaying(function(p) { return Object.assign({}, p, { [sfx.id]: true }); });
    setTimeout(function() {
      setPlaying(function(p) { return Object.assign({}, p, { [sfx.id]: false }); });
    }, sfx.dur * 1000 + 100);
    playSynth(sfx, volume, ctx);
  }

  function fireCustom(snd) {
    var ctx = getCtx(ctxRef);
    var src = ctx.createBufferSource();
    src.buffer = snd.buffer;
    var g = ctx.createGain();
    g.gain.value = volume;
    src.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  function handleUpload(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) { toast.error('Audio files only'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 MB'); return; }
    var reader = new FileReader();
    reader.onload = function(ev) {
      var ctx = getCtx(ctxRef);
      ctx.decodeAudioData(ev.target.result, function(buf) {
        setCustom(function(prev) {
          return prev.concat([{ id: Date.now(), name: file.name.replace(/\.[^.]+$/, ''), buffer: buf }]);
        });
        toast.success('Sound loaded: ' + file.name);
      }, function() { toast.error('Could not decode audio'); });
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 8 }}>
      <button
        onClick={function() { setExpanded(!expanded); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
      >
        <span style={{ fontSize: 16 }}>🎚️</span>
        <span style={{ fontWeight: 700, fontSize: 13, flex: 1, textAlign: 'left', color: '#A78BFA' }}>Cue Soundboard</span>
        {expanded ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}
      </button>
      {expanded && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Volume</span>
            <input
              type="range" min="0" max="1" step="0.05" value={volume}
              onChange={function(e) { setVolume(Number(e.target.value)); }}
              style={{ flex: 1, accentColor: GOLD, height: 4 }}
            />
            <span style={{ fontSize: 11, color: GOLD, minWidth: 32 }}>{Math.round(volume * 100)}%</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {SFX.map(function(sfx) {
              var isOn = playing[sfx.id];
              return (
                <button
                  key={sfx.id}
                  onClick={function() { fire(sfx); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '8px 4px', borderRadius: 10, cursor: 'pointer', userSelect: 'none',
                    background: isOn ? 'rgba(167,139,250,0.25)' : 'rgba(0,0,0,0.35)',
                    border: '1.5px solid ' + (isOn ? '#A78BFA' : 'rgba(255,255,255,0.08)'),
                    transform: isOn ? 'scale(0.95)' : 'scale(1)', transition: 'all 0.1s',
                    color: '#fff',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{sfx.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 700 }}>{sfx.label}</span>
                </button>
              );
            })}
            {custom.map(function(snd) {
              return (
                <button
                  key={snd.id}
                  onClick={function() { fireCustom(snd); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(201,168,76,0.1)', border: '1.5px solid rgba(201,168,76,0.3)',
                    color: GOLD,
                  }}
                >
                  <span style={{ fontSize: 20 }}>🎵</span>
                  <span style={{ fontSize: 9, fontWeight: 700, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snd.name}</span>
                </button>
              );
            })}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', border: '1px dashed rgba(201,168,76,0.3)', color: 'rgba(201,168,76,0.7)', fontSize: 12, fontWeight: 700 }}>
            <Upload size={13} /> Upload WAV / MP3 (max 5 MB)
            <input type="file" accept="audio/*" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}
    </div>
  );
}
