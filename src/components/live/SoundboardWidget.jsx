import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Zap, Music } from 'lucide-react';

const G = '#D4AF37';
const PANEL = '#0F0B1A';
const BORDER = 'rgba(212,175,55,0.18)';

// Preset hype sound effects with Freesound/YouTube Audio Library URLs
const SOUND_EFFECTS = [
  { id: 'air_horn', label: 'Air Horn', icon: '📯', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { id: 'crowd_cheer', label: 'Crowd Cheer', icon: '🎉', url: 'https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3' },
  { id: 'victory', label: 'Victory', icon: '🏆', url: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' },
  { id: 'hype_drum', label: 'Hype Drum', icon: '🥁', url: 'https://assets.mixkit.co/active_storage/sfx/2009/2009-preview.mp3' },
  { id: 'level_up', label: 'Level Up', icon: '⚡', url: 'https://assets.mixkit.co/active_storage/sfx/1975/1975-preview.mp3' },
  { id: 'fail_horn', label: 'Fail Horn', icon: '❌', url: 'https://assets.mixkit.co/active_storage/sfx/1099/1099-preview.mp3' },
  { id: 'bell_ring', label: 'Bell Ring', icon: '🔔', url: 'https://assets.mixkit.co/active_storage/sfx/2720/2720-preview.mp3' },
  { id: 'explosion', label: 'Explosion', icon: '💥', url: 'https://assets.mixkit.co/active_storage/sfx/3727/3727-preview.mp3' },
];

export default function SoundboardWidget({ isVisible = true, disabled = false }) {
  const [playingId, setPlayingId] = useState(null);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef(new Audio());

  const playSound = (sound) => {
    if (disabled || playingId) return;

    setPlayingId(sound.id);
    const audio = audioRef.current;
    audio.src = sound.url;
    audio.volume = volume;
    audio.play().catch(() => console.log('Audio play failed'));

    audio.onended = () => setPlayingId(null);
    setTimeout(() => setPlayingId(null), 3000);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg p-3"
      style={{ background: PANEL, border: `1px solid ${BORDER}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Music className="w-4 h-4" style={{ color: G }} />
        <h3 className="text-xs font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          SOUNDBOARD
        </h3>
      </div>

      {/* Volume control */}
      <div className="mb-3 space-y-1">
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-white/50" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 cursor-pointer"
            style={{
              accentColor: G,
            }}
          />
          <span className="text-[10px] text-white/50 w-6 text-right">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* Sound buttons grid */}
      <div className="grid grid-cols-4 gap-1">
        {SOUND_EFFECTS.map((sound) => (
          <motion.button
            key={sound.id}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            onClick={() => playSound(sound)}
            disabled={disabled || playingId === sound.id}
            className="py-2 px-1 rounded text-center transition-all disabled:opacity-40 flex flex-col items-center gap-0.5"
            style={{
              background: playingId === sound.id ? `${G}30` : 'rgba(255,255,255,0.05)',
              border: playingId === sound.id ? `1px solid ${G}` : `1px solid ${BORDER}`,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            title={sound.label}
          >
            <span className="text-lg leading-none">{sound.icon}</span>
            <span className="text-[11px] font-bold text-white/70 leading-tight">{sound.label.split(' ')[0]}</span>
          </motion.button>
        ))}
      </div>

      <p className="text-[10px] text-white/40 text-center mt-2">
        {disabled ? 'Disabled outside PK battles' : playingId ? `${SOUND_EFFECTS.find(s => s.id === playingId)?.label} playing...` : 'Click to trigger'}
      </p>
    </motion.div>
  );
}