import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Zap, Music, Square, RotateCcw, Plus, X, Clock } from 'lucide-react';

const G     = '#D4AF37';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

const SOUND_EFFECTS = [
  { id: 'air_horn',    label: 'Air Horn',    icon: '📯', hotkey: '1', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { id: 'crowd_cheer', label: 'Crowd Cheer', icon: '🎉', hotkey: '2', url: 'https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3' },
  { id: 'victory',     label: 'Victory',     icon: '🏆', hotkey: '3', url: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' },
  { id: 'hype_drum',   label: 'Hype Drum',   icon: '🥁', hotkey: '4', url: 'https://assets.mixkit.co/active_storage/sfx/2009/2009-preview.mp3' },
  { id: 'level_up',    label: 'Level Up',    icon: '⚡', hotkey: '5', url: 'https://assets.mixkit.co/active_storage/sfx/1975/1975-preview.mp3' },
  { id: 'fail_horn',   label: 'Fail Horn',   icon: '❌', hotkey: '6', url: 'https://assets.mixkit.co/active_storage/sfx/1099/1099-preview.mp3' },
  { id: 'bell_ring',   label: 'Bell Ring',   icon: '🔔', hotkey: '7', url: 'https://assets.mixkit.co/active_storage/sfx/2720/2720-preview.mp3' },
  { id: 'explosion',   label: 'Explosion',   icon: '💥', hotkey: '8', url: 'https://assets.mixkit.co/active_storage/sfx/3727/3727-preview.mp3' },
];

export default function SoundboardWidget({ isVisible = true, disabled = false }) {
  const [playingId, setPlayingId]   = useState(null);
  const [volume, setVolume]         = useState(0.7);
  const [loopId, setLoopId]         = useState(null);
  const [recentPlayed, setRecentPlayed] = useState([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customUrl, setCustomUrl]   = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customSounds, setCustomSounds] = useState([]);
  const audioRef = useRef(new Audio());

  const allSounds = [...SOUND_EFFECTS, ...customSounds];

  const stopSound = useCallback(() => {
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    audio.loop = false;
    setPlayingId(null);
    setLoopId(null);
  }, []);

  const playSound = useCallback((sound) => {
    if (disabled) return;
    if (playingId === sound.id) { stopSound(); return; }
    stopSound();
    const audio = audioRef.current;
    audio.src    = sound.url;
    audio.volume = volume;
    audio.loop   = loopId === sound.id;
    audio.play().catch(() => {});
    setPlayingId(sound.id);
    setRecentPlayed(prev => {
      const next = [sound, ...prev.filter(s => s.id !== sound.id)].slice(0, 3);
      return next;
    });
    audio.onended = () => {
      if (!audio.loop) setPlayingId(null);
    };
    setTimeout(() => { if (!audio.loop) setPlayingId(null); }, 8000);
  }, [disabled, playingId, volume, loopId, stopSound]);

  // Keyboard hotkeys (1-8 when widget is focused area)
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < SOUND_EFFECTS.length) {
        playSound(SOUND_EFFECTS[idx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playSound]);

  const addCustomSound = () => {
    const url = customUrl.trim();
    if (!url || !url.startsWith('http')) return;
    const label = customLabel.trim() || 'Custom';
    const id    = `custom_${Date.now()}`;
    setCustomSounds(prev => [...prev, { id, label, icon: '🎵', url, hotkey: null }]);
    setCustomUrl('');
    setCustomLabel('');
    setShowCustom(false);
  };

  const removeCustom = (id) => {
    if (playingId === id) stopSound();
    setCustomSounds(prev => prev.filter(s => s.id !== id));
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg p-3 space-y-3"
      style={{ background: PANEL, border: `1px solid ${BORDER}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Music className="w-4 h-4" style={{ color: G }} />
        <h3 className="text-xs font-black flex-1" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          SOUNDBOARD
        </h3>
        {playingId && (
          <button
            onClick={stopSound}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all"
            style={{ background: 'rgba(192,57,43,0.15)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.3)' }}
          >
            <Square className="w-3 h-3" fill="#C0392B" /> Stop
          </button>
        )}
        <button
          onClick={() => setShowCustom(v => !v)}
          className="w-6 h-6 flex items-center justify-center rounded transition-all hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          title="Add custom sound"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Custom sound form */}
      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-1.5 pt-1"
          >
            <input
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              placeholder="Label (optional)"
              style={{ width: '100%', padding: '4px 8px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
            />
            <div className="flex gap-1">
              <input
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder="Audio URL (https://...mp3)"
                style={{ flex: 1, padding: '4px 8px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 11, outline: 'none' }}
              />
              <button
                onClick={addCustomSound}
                disabled={!customUrl.startsWith('http')}
                className="px-3 py-1 rounded text-[11px] font-bold disabled:opacity-40"
                style={{ background: `${G}20`, color: G, border: `1px solid ${G}30` }}
              >
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Volume control */}
      <div className="flex items-center gap-2">
        <Volume2 className="w-3.5 h-3.5 text-white/50" />
        <input
          type="range" min="0" max="1" step="0.05" value={volume}
          onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; }}
          className="flex-1 h-1 cursor-pointer"
          style={{ accentColor: G }}
        />
        <span className="text-[10px] text-white/50 w-7 text-right">{Math.round(volume * 100)}%</span>
      </div>

      {/* Sound buttons grid */}
      <div className="grid grid-cols-4 gap-1">
        {allSounds.map((sound) => {
          const isPlaying = playingId === sound.id;
          const isLooping = loopId === sound.id;
          return (
            <div key={sound.id} className="relative">
              <motion.button
                whileHover={{ scale: disabled ? 1 : 1.05 }}
                whileTap={{ scale: disabled ? 1 : 0.95 }}
                onClick={() => playSound(sound)}
                disabled={disabled}
                className="w-full py-2 px-1 rounded text-center transition-all disabled:opacity-40 flex flex-col items-center gap-0.5"
                style={{
                  background: isPlaying ? `${G}30` : 'rgba(255,255,255,0.05)',
                  border: isPlaying ? `1px solid ${G}` : `1px solid ${BORDER}`,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
                title={`${sound.label}${sound.hotkey ? ` (${sound.hotkey})` : ''}`}
              >
                <span className="text-lg leading-none">{sound.icon}</span>
                <span className="text-[10px] font-bold text-white/70 leading-tight">{sound.label.split(' ')[0]}</span>
                {sound.hotkey && <span className="text-[8px] text-white/25 font-mono">[{sound.hotkey}]</span>}
              </motion.button>

              {/* Loop toggle (top-right on each button) */}
              <button
                onClick={(e) => { e.stopPropagation(); setLoopId(isLooping ? null : sound.id); if (audioRef.current && isPlaying) audioRef.current.loop = !isLooping; }}
                className="absolute top-0.5 right-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full transition-all"
                style={{ background: isLooping ? `${G}40` : 'transparent', opacity: isLooping ? 1 : 0.3 }}
                title="Loop"
              >
                <RotateCcw className="w-2 h-2" style={{ color: isLooping ? G : '#fff' }} />
              </button>

              {/* Remove custom sounds */}
              {sound.id.startsWith('custom_') && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeCustom(sound.id); }}
                  className="absolute top-0.5 left-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-red-900/60 opacity-60 hover:opacity-100"
                >
                  <X className="w-2 h-2 text-white" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Recently played */}
      {recentPlayed.length > 0 && (
        <div className="space-y-1">
          <p className="flex items-center gap-1 text-[9px] text-white/25 uppercase font-bold">
            <Clock className="w-2.5 h-2.5" /> Recent
          </p>
          <div className="flex gap-1">
            {recentPlayed.map(s => (
              <button
                key={s.id}
                onClick={() => playSound(s)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
              >
                {s.icon} {s.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-white/30 text-center">
        {disabled ? 'Disabled outside PK battles'
          : playingId ? `${allSounds.find(s => s.id === playingId)?.label} playing…${loopId === playingId ? ' 🔁' : ''}`
          : 'Click to play · Hold loop icon to repeat'}
      </p>
    </motion.div>
  );
}
