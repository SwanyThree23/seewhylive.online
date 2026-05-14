import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, ChevronDown, ChevronUp, Music, Radio, Zap, Headphones } from 'lucide-react';

const BG_MUSIC = [
  { id: 'none', label: 'No Music' },
  { id: 'lofi', label: '🎵 Lo-Fi Chill' },
  { id: 'upbeat', label: '🎶 Upbeat Pop' },
  { id: 'ambient', label: '🌌 Ambient Space' },
  { id: 'jazz', label: '🎷 Smooth Jazz' },
  { id: 'edm', label: '⚡ Electronic' },
  { id: 'acoustic', label: '🎸 Acoustic' },
];

const AUDIO_PRESETS = [
  { id: 'normal', label: 'Normal', settings: { gain: 100, noiseFilter: true, echo: true } },
  { id: 'music', label: 'Music', settings: { gain: 120, noiseFilter: false, echo: true } },
  { id: 'podcast', label: 'Podcast', settings: { gain: 110, noiseFilter: true, echo: false } },
  { id: 'voice', label: 'Voice Enhance', settings: { gain: 130, noiseFilter: true, echo: false } },
];

export default function EnhancedAudioMixer({ micMuted, onMicToggle, onAudioSettingsChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const [preset, setPreset] = useState('normal');
  const [gain, setGain] = useState([100]);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [bgMusic, setBgMusic] = useState('none');
  const [vuLevels, setVuLevels] = useState([0.1, 0.2, 0.1, 0.3, 0.2, 0.1, 0.2, 0.3]);
  const [mono, setMono] = useState(false);
  const vuRef = useRef(null);

  useEffect(() => {
    if (micMuted) return;
    vuRef.current = setInterval(() => {
      setVuLevels(Array.from({ length: 8 }, () => Math.random() * 0.9 + 0.05));
    }, 100);
    return () => clearInterval(vuRef.current);
  }, [micMuted]);

  const handlePresetChange = (presetId) => {
    setPreset(presetId);
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
      monoMode: mono,
    });
  }, [gain, noiseSuppression, echoCancellation, bgMusic, mono]);

  const avgLevel = vuLevels.reduce((a, b) => a + b) / vuLevels.length;
  const levelColor = avgLevel > 0.8 ? '#ef4444' : avgLevel > 0.5 ? '#f59e0b' : '#22c55e';

  return (
    <div className="bg-[rgba(13,6,24,0.9)] border border-[rgba(212,175,55,0.2)] rounded-xl overflow-hidden" style={{ backdropFilter: 'blur(12px)' }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
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
          {micMuted && <Badge className="text-[9px] bg-red-900/60 text-red-400 border-red-700/40 px-1">MUTED</Badge>}
        </div>
        {collapsed ? <ChevronDown className="w-3 h-3 text-white/40" /> : <ChevronUp className="w-3 h-3 text-white/40" />}
      </button>

      {!collapsed && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden px-3 pb-3 space-y-3">
          {/* VU Meter */}
          <div className="space-y-1">
            <p className="text-[10px] text-white/40 uppercase">Live Mic Level</p>
            <div className="flex items-end gap-0.5 h-10 bg-black/30 rounded px-2">
              {vuLevels.map((level, i) => (
                <motion.div
                  key={i}
                  animate={{ height: `${(micMuted ? 0.02 : level) * 100}%` }}
                  transition={{ duration: 0.08 }}
                  className="flex-1 rounded-sm"
                  style={{ background: level > 0.8 ? '#ef4444' : level > 0.5 ? '#f59e0b' : '#22c55e' }}
                />
              ))}
            </div>
          </div>

          {/* Main controls */}
          <div className="flex gap-2">
            <button
              onClick={onMicToggle}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                micMuted
                  ? 'bg-red-900/50 border border-red-600/50 text-red-400'
                  : 'bg-green-900/30 border border-green-600/40 text-green-400'
              }`}
            >
              {micMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              {micMuted ? 'Unmute' : 'Live'} (M)
            </button>
            <button
              onClick={() => setSpeakerMuted(!speakerMuted)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                speakerMuted
                  ? 'bg-gray-800 border border-gray-600 text-gray-400'
                  : 'bg-blue-900/30 border border-blue-600/40 text-blue-400'
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
            <Slider
              value={gain} onValueChange={setGain}
              min={0} max={200} step={5}
              className="[&_[role=slider]]:bg-[#d4af37]"
            />
          </div>

          {/* Smart Toggles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/60">Smart Noise Filter</span>
              <Switch checked={noiseSuppression} onCheckedChange={setNoiseSuppression}
                className="scale-75 data-[state=checked]:bg-[#d4af37]" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/60">Echo Cancellation</span>
              <Switch checked={echoCancellation} onCheckedChange={setEchoCancellation}
                className="scale-75 data-[state=checked]:bg-[#d4af37]" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/60">Mono Mode (Bandwidth Saver)</span>
              <Switch checked={mono} onCheckedChange={setMono}
                className="scale-75 data-[state=checked]:bg-[#d4af37]" />
            </div>
          </div>

          {/* BG Music */}
          <div className="space-y-1">
            <p className="text-[10px] text-white/40 flex items-center gap-1"><Music className="w-3 h-3" /> Background Music</p>
            <select
              value={bgMusic}
              onChange={(e) => setBgMusic(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
            >
              {BG_MUSIC.map(m => <option key={m.id} value={m.id} className="bg-[#0d0618]">{m.label}</option>)}
            </select>
          </div>
        </motion.div>
      )}
    </div>
  );
}