import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MobileSelect } from '@/components/ui/MobileSelect';
import { Mic, MicOff, Volume2, VolumeX, ChevronDown, ChevronUp, Music, Radio, Zap, Headphones } from 'lucide-react';

const BG_MUSIC = [
  { id: 'none',      label: 'No Music' },
  { id: 'lofi',      label: '🎵 Lo-Fi Chill' },
  { id: 'upbeat',    label: '🎶 Upbeat Pop' },
  { id: 'ambient',   label: '🌌 Ambient Space' },
  { id: 'jazz',      label: '🎷 Smooth Jazz' },
  { id: 'edm',       label: '⚡ Electronic' },
  { id: 'acoustic',  label: '🎸 Acoustic' },
  { id: 'rnb',       label: '🎤 R&B / Soul' },
  { id: 'hiphop',    label: '🔊 Hip-Hop' },
  { id: 'classical', label: '🎻 Classical' },
  { id: 'nature',    label: '🌿 Nature Sounds' },
  { id: 'trap',      label: '🥁 Trap / Bass' },
  { id: 'deephouse', label: '🏠 Deep House' },
];

const AUDIO_PRESETS = [
  { id: 'normal',      label: 'Normal',      settings: { gain: 100, noiseFilter: true,  echo: true  } },
  { id: 'music',       label: 'Music',       settings: { gain: 120, noiseFilter: false, echo: true  } },
  { id: 'podcast',     label: 'Podcast',     settings: { gain: 110, noiseFilter: true,  echo: false } },
  { id: 'voice',       label: 'Voice+',      settings: { gain: 130, noiseFilter: true,  echo: false } },
  { id: 'gaming',      label: 'Gaming',      settings: { gain: 105, noiseFilter: true,  echo: true  } },
  { id: 'interview',   label: 'Interview',   settings: { gain: 115, noiseFilter: true,  echo: false } },
  { id: 'broadcast',   label: 'Broadcast',   settings: { gain: 125, noiseFilter: true,  echo: false } },
];

export default function EnhancedAudioMixer({ micMuted, onMicToggle, onAudioSettingsChange, stream }) {
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('eam_collapsed') === 'true'; } catch { return false; } });
  const [preset, setPreset] = useState(() => { try { return localStorage.getItem('eam_preset') || 'normal'; } catch { return 'normal'; } });
  const [gain, setGain] = useState([100]);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [speakerMuted,   setSpeakerMuted]   = useState(false);
  const [bgMusic,        setBgMusic]        = useState('none');
  const [bgMusicVol,     setBgMusicVol]     = useState([70]);
  const [vuLevels,       setVuLevels]       = useState([0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02]);
  const [mono,           setMono]           = useState(false);
  const [reverb,         setReverb]         = useState(false);
  const [stereoEnhance,  setStereoEnhance]  = useState(false);
  const [showAdvanced,   setShowAdvanced]   = useState(false);
  const [peakLevel,      setPeakLevel]      = useState(0);
  const [bass,           setBass]           = useState(0);
  const [treble,         setTreble]         = useState(0);

  // Real AudioContext VU analysis from the mic stream
  useEffect(() => {
    if (!stream || micMuted) {
      setVuLevels(Array(8).fill(0.02));
      return;
    }
    let ctx, raf;
    try {
      ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(buf);
        const bands = 8;
        const size = Math.floor(buf.length / bands);
        setVuLevels(Array.from({ length: bands }, (_, i) => {
          const slice = buf.slice(i * size, i * size + size);
          return slice.reduce((a, b) => a + b, 0) / (size * 255);
        }));
        raf = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
    return () => { cancelAnimationFrame(raf); ctx?.close().catch(() => {}); };
  }, [stream, micMuted]);

  const handlePresetChange = (presetId) => {
    setPreset(presetId);
    try { localStorage.setItem('eam_preset', presetId); } catch {}
    const p = AUDIO_PRESETS.find(x => x.id === presetId);
    if (p) {
      setGain([p.settings.gain]);
      setNoiseSuppression(p.settings.noiseFilter);
      setEchoCancellation(p.settings.echo);
    }
  };

  useEffect(() => {
    onAudioSettingsChange?.({
      gain: gain[0],
      noiseSuppression,
      echoCancellation,
      bgMusic,
      bgMusicVol: bgMusicVol[0],
      monoMode: mono,
      reverb,
      stereoEnhance,
      bass,
      treble,
    });
  }, [gain, noiseSuppression, echoCancellation, bgMusic, bgMusicVol, mono, reverb, stereoEnhance, bass, treble]);

  const avgLevel = vuLevels.reduce((a, b) => a + b) / vuLevels.length;
  const levelColor = avgLevel > 0.8 ? '#C0392B' : avgLevel > 0.5 ? '#C9A84C' : '#6DBF7E';
  const isClipping = avgLevel > 0.9;

  // Peak hold: update peak upward immediately, decay slowly
  useEffect(() => {
    setPeakLevel(prev => avgLevel > prev ? avgLevel : Math.max(0, prev - 0.015));
  }, [avgLevel]);

  return (
    <div className="bg-[rgba(8,11,24,0.9)] border border-[rgba(212,175,55,0.2)] rounded-xl overflow-hidden" style={{ backdropFilter: 'blur(12px)' }}>
      <button
        onClick={() => { const next = !collapsed; setCollapsed(next); try { localStorage.setItem('eam_collapsed', String(next)); } catch {} }}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider">Audio Mixer</span>
          <div className="w-8 h-4 rounded-full bg-black/30 flex items-center" style={{ background: levelColor + '20', borderColor: levelColor + '40', border: '1px solid' }}>
            <motion.div
              animate={{ width: `${avgLevel * 100}%` }}
              className="h-2 rounded-full"
              style={{ background: levelColor }}
            />
          </div>
          {micMuted && <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(127,29,29,0.6)', color: '#FF4444', border: '1px solid rgba(185,28,28,0.4)' }}>MUTED</span>}
        </div>
        {collapsed ? <ChevronDown className="w-3 h-3 text-white/40" /> : <ChevronUp className="w-3 h-3 text-white/40" />}
      </button>

      {!collapsed && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden px-3 pb-3 space-y-3">
          {/* VU Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-white/40 uppercase">Live Mic Level</p>
              {isClipping && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                  className="text-[9px] font-black px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(192,57,43,0.3)', color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                >
                  CLIP
                </motion.span>
              )}
            </div>
            <div className="relative flex items-end gap-0.5 h-10 bg-black/30 rounded px-2">
              {vuLevels.map((level, i) => (
                <motion.div
                  key={i}
                  animate={{ height: `${(micMuted ? 0.02 : level) * 100}%` }}
                  transition={{ duration: 0.08 }}
                  className="flex-1 rounded-sm"
                  style={{ background: level > 0.8 ? '#C0392B' : level > 0.5 ? '#C9A84C' : '#6DBF7E' }}
                />
              ))}
              {/* Peak hold needle */}
              <div
                className="absolute left-2 right-2 h-px rounded-full pointer-events-none"
                style={{ bottom: `${peakLevel * 100}%`, background: peakLevel > 0.8 ? '#C0392B' : '#D4AF37', opacity: 0.8 }}
              />
            </div>
          </div>

          {/* Main controls */}
          <div className="flex gap-2">
            <button
              onClick={onMicToggle}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                micMuted
                  ? 'bg-red-900/50 border border-red-600/50 text-[#C0392B]'
                  : 'border border-green-600/40 text-[#6DBF7E]'
              }`}
              style={!micMuted ? { background: 'rgba(109,191,126,0.15)' } : undefined}
            >
              {micMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              {micMuted ? 'Unmute' : 'Live'} (M)
            </button>
            <button
              onClick={() => setSpeakerMuted(!speakerMuted)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                speakerMuted
                  ? 'bg-gray-800 border border-gray-600 text-gray-400'
                  : 'bg-[#0F1428]/50 border border-[#D4AF37]/25 text-[#D4AF37]'
              }`}
            >
              {speakerMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              Monitor
            </button>
          </div>

          {/* Presets */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Audio Presets</p>
            <div className="flex gap-1 flex-wrap">
              {AUDIO_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id)}
                  className={`text-[10px] px-2 py-1 rounded border transition-all ${
                    preset === p.id
                      ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10'
                      : 'border-white/10 text-white/40 hover:border-white/20'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gain */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <p className="text-[10px] text-white/40">Input Gain</p>
              <p className="text-[10px] font-mono text-[#d4af37]">{gain[0]}%</p>
            </div>
            <input type="range" value={gain[0]} onChange={e => setGain([+e.target.value])} min={0} max={200} step={5} style={{ width: '100%', accentColor: '#D4AF37' }} />
          </div>

          {/* Smart Toggles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/60">Smart Noise Filter</span>
              <div onClick={() => setNoiseSuppression(v => !v)} style={{ width: 40, height: 22, borderRadius: 99, background: noiseSuppression ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}><div style={{ position: 'absolute', top: 3, left: noiseSuppression ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} /></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/60">Echo Cancellation</span>
              <div onClick={() => setEchoCancellation(v => !v)} style={{ width: 40, height: 22, borderRadius: 99, background: echoCancellation ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}><div style={{ position: 'absolute', top: 3, left: echoCancellation ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} /></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/60">Mono Mode (Bandwidth Saver)</span>
              <div onClick={() => setMono(v => !v)} style={{ width: 40, height: 22, borderRadius: 99, background: mono ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}><div style={{ position: 'absolute', top: 3, left: mono ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} /></div>
            </div>
          </div>

          {/* BG Music */}
          <div className="space-y-1">
            <p className="text-[10px] text-white/40 flex items-center gap-1"><Music className="w-3 h-3" /> Background Music</p>
            <MobileSelect
              value={bgMusic}
              onChange={(v) => setBgMusic(v)}
              options={BG_MUSIC.map(m => ({ value: m.id, label: m.label }))}
              placeholder="Select music"
            />
            {bgMusic !== 'none' && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <p className="text-[10px] text-white/40">Music Volume</p>
                  <p className="text-[10px] font-mono text-[#d4af37]">{bgMusicVol[0]}%</p>
                </div>
                <input type="range" value={bgMusicVol[0]} onChange={e => setBgMusicVol([+e.target.value])} min={0} max={100} step={5} style={{ width: '100%', accentColor: '#D4AF37' }} />
              </div>
            )}
          </div>

          {/* Advanced section toggle */}
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="w-full text-left text-[10px] text-white/30 flex items-center gap-1 hover:text-white/50 transition-colors"
          >
            <Zap className="w-3 h-3" />
            <span>Advanced</span>
            {showAdvanced ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
          </button>

          {showAdvanced && (
            <div className="space-y-2 border-t border-white/5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/60 flex items-center gap-1"><Radio className="w-3 h-3" /> Reverb</span>
                <div onClick={() => setReverb(v => !v)} style={{ width: 40, height: 22, borderRadius: 99, background: reverb ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}><div style={{ position: 'absolute', top: 3, left: reverb ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} /></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/60 flex items-center gap-1"><Headphones className="w-3 h-3" /> Stereo Enhance</span>
                <div onClick={() => setStereoEnhance(v => !v)} style={{ width: 40, height: 22, borderRadius: 99, background: stereoEnhance ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}><div style={{ position: 'absolute', top: 3, left: stereoEnhance ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} /></div>
              </div>
              {/* EQ sliders */}
              <div className="space-y-1 pt-1">
                <p className="text-[9px] text-white/30 uppercase tracking-wider">Equalizer</p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/50 w-10">Bass</span>
                  <input type="range" value={bass} onChange={e => setBass(+e.target.value)} min={-12} max={12} step={1} style={{ flex: 1, accentColor: '#D4854A', margin: '0 8px' }} />
                  <span className="text-[9px] font-mono text-[#D4854A] w-7 text-right">{bass > 0 ? '+' : ''}{bass}dB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/50 w-10">Treble</span>
                  <input type="range" value={treble} onChange={e => setTreble(+e.target.value)} min={-12} max={12} step={1} style={{ flex: 1, accentColor: '#D4AF37', margin: '0 8px' }} />
                  <span className="text-[9px] font-mono text-[#D4AF37] w-7 text-right">{treble > 0 ? '+' : ''}{treble}dB</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
