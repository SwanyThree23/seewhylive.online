import React, { useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Music, Radio, Headphones, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SoundboardWidget from './SoundboardWidget';

const AUDIO_PRESETS = [
  { id: 'normal', label: 'Normal', icon: '🎙️' },
  { id: 'music', label: 'Music Mode', icon: '🎵' },
  { id: 'podcast', label: 'Podcast', icon: '🎧' },
  { id: 'bass', label: 'Bass Boost', icon: '🔊' },
  { id: 'voice', label: 'Voice Enhance', icon: '🗣️' },
];

export default function AudioPanel({ micMuted, onMicToggle, participants = [] }) {
  const [preset, setPreset] = useState('normal');
  const [bgMusic, setBgMusic] = useState(false);
  const [volumes, setVolumes] = useState({});
  const [masterVolume, setMasterVolume] = useState([80]);
  const [noiseCancel, setNoiseCancel] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const audioOnlyParticipants = participants.filter(p =>
    ['host', 'co-host', 'speaker'].includes(p.role)
  );

  return (
    <div className="bg-[rgba(8,11,24,0.9)] border border-[rgba(212,175,55,0.15)] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-semibold text-white">Audio Panel</span>
          {bgMusic && <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(128,0,32,0.5)', color: '#C9A84C', border: '1px solid rgba(128,0,32,0.3)' }}>♪ Music</span>}
        </div>
        <span className="text-white/30 text-[10px]">{expanded ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-white/5">

              {/* Mic toggle */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onMicToggle}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      micMuted
                        ? 'bg-red-900/50 border-red-600 text-red-400'
                        : 'bg-green-900/30 border-green-600/50 text-green-400'
                    }`}
                  >
                    {micMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                  <div>
                    <p className="text-xs text-white font-semibold">{micMuted ? 'Muted' : 'Live'}</p>
                    <p className="text-[11px] text-white/40">{micMuted ? 'Tap to unmute' : 'Tap to mute'}</p>
                  </div>
                </div>

                {/* Noise cancel toggle */}
                <button
                  onClick={() => setNoiseCancel(!noiseCancel)}
                  className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all ${
                    noiseCancel
                      ? 'border-[#d4af37]/40 text-[#d4af37] bg-[#d4af37]/10'
                      : 'border-white/10 text-white/30'
                  }`}
                >
                  <Settings2 className="w-2.5 h-2.5" />
                  Noise Cancel
                </button>
              </div>

              {/* Master volume */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/50">Master Volume</span>
                  <span className="text-[10px] text-[#d4af37] font-mono">{masterVolume[0]}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <VolumeX className="w-3 h-3 text-white/30 shrink-0" />
                  <input type="range" value={masterVolume[0]} onChange={e => setMasterVolume([+e.target.value])} min={0} max={100} step={1} style={{ flex: 1, accentColor: '#D4AF37' }} />
                  <Volume2 className="w-3 h-3 text-[#d4af37] shrink-0" />
                </div>
              </div>

              {/* Audio presets */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Mode</p>
                <div className="flex gap-1.5 flex-wrap">
                  {AUDIO_PRESETS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPreset(p.id)}
                      className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all ${
                        preset === p.id
                          ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10'
                          : 'border-white/10 text-white/40 hover:border-white/20'
                      }`}
                    >
                      <span>{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background music toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs text-white">Background Music</span>
                </div>
                <button
                  onClick={() => setBgMusic(!bgMusic)}
                  className={`w-9 h-5 rounded-full transition-all relative ${bgMusic ? 'bg-purple-600' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${bgMusic ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Per-speaker volumes */}
              {audioOnlyParticipants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">Speaker Volumes</p>
                  {audioOnlyParticipants.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#800020] to-[#d4af37] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                        {p.user_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-[10px] text-white/60 w-16 truncate">{p.user_name}</span>
                      <input type="range" value={volumes[p.id] ?? 80} onChange={e => setVolumes(prev => ({ ...prev, [p.id]: +e.target.value }))} min={0} max={100} step={5} style={{ flex: 1, accentColor: '#D4AF37' }} />
                      <span className="text-[11px] text-white/30 w-7 text-right">{volumes[p.id] ?? 80}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Soundboard */}
              <div className="border-t border-white/5 pt-3">
                <SoundboardWidget isVisible={true} disabled={false} />
              </div>

              {/* Audio only mode info */}
              <div className="bg-[#d4af37]/5 border border-[#d4af37]/15 rounded-lg p-2">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-[#d4af37]" />
                  <p className="text-[10px] text-[#d4af37] font-semibold">Audio-Only Mode Active</p>
                </div>
                <p className="text-[11px] text-white/30 mt-0.5">Saves bandwidth — video off, audio on</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}