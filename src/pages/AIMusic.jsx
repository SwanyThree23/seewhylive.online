import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Music, Play, Pause, Square, Zap, Radio, Volume2, VolumeX,
  Wand2, Mic2, Headphones, Download, Copy, RefreshCw,
  ChevronRight, Layers, Sliders, Clock, Star, Trash2, Plus
} from 'lucide-react';

const BG = '#080B18';
const BG2 = 'rgba(13,6,24,0.9)';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const PINK = '#FF1564';
const CYAN = '#00d4ff';
const PURPLE = '#a78bfa';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const inp = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(17,8,34,0.85)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif',
};
const lbl = {
  display: 'block', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif',
  color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em',
  textTransform: 'uppercase', marginBottom: 6, marginTop: 14,
};

const GENRES = [
  { id: 'lofi', label: 'Lo-Fi Beats', emoji: '🎧', color: PURPLE },
  { id: 'hiphop', label: 'Hip-Hop', emoji: '🎤', color: PINK },
  { id: 'edm', label: 'EDM / House', emoji: '🎛️', color: CYAN },
  { id: 'rnb', label: 'R&B / Soul', emoji: '🎹', color: GOLD },
  { id: 'trap', label: 'Trap', emoji: '🥁', color: CRIMSON },
  { id: 'jazz', label: 'Jazz Chill', emoji: '🎷', color: '#22c55e' },
  { id: 'ambient', label: 'Ambient', emoji: '🌊', color: '#38bdf8' },
  { id: 'gospel', label: 'Gospel', emoji: '🎺', color: '#f97316' },
];

const MOODS = [
  { id: 'hype', label: 'Hype', emoji: '🔥' },
  { id: 'chill', label: 'Chill', emoji: '😌' },
  { id: 'dark', label: 'Dark', emoji: '🌑' },
  { id: 'happy', label: 'Happy', emoji: '😄' },
  { id: 'focused', label: 'Focused', emoji: '🎯' },
  { id: 'romantic', label: 'Romantic', emoji: '💕' },
];

const BPM_OPTIONS = [80, 90, 100, 110, 120, 130, 140, 160];

const STREAM_PRESETS = [
  { id: 'intro', label: 'Stream Intro', desc: 'High-energy opener for your broadcast', emoji: '🚀', genre: 'edm', mood: 'hype', bpm: 130 },
  { id: 'gaming', label: 'Gaming Session', desc: 'Focused beats for gameplay', emoji: '🎮', genre: 'hiphop', mood: 'focused', bpm: 120 },
  { id: 'chat', label: 'Chat & Chill', desc: 'Background music for talking sessions', emoji: '💬', genre: 'lofi', mood: 'chill', bpm: 85 },
  { id: 'outro', label: 'Stream Outro', desc: 'Smooth sign-off vibes', emoji: '🌙', genre: 'rnb', mood: 'chill', bpm: 90 },
  { id: 'hype', label: 'Hype Train', desc: 'Drop this when subs hit goals', emoji: '💸', genre: 'trap', mood: 'hype', bpm: 140 },
  { id: 'ambient', label: 'AFK / Break', desc: 'Ambient loops while you\'re away', emoji: '⏸️', genre: 'ambient', mood: 'chill', bpm: 80 },
];

const AI_PROMPTS = [
  'Dark trap beat with 808s and hi-hats for a streaming intro',
  'Chill lo-fi piano loop with vinyl crackle, perfect for late-night coding',
  'High-energy EDM drop for hype train moments',
  'Smooth R&B instrumental with soft keys and percussion',
  'Gospel choir vibes with uplifting melodies',
  'Jazz-infused hip-hop with saxophone lead and boom-bap drums',
  'Ambient soundscape with rain and soft synths',
];

function WaveformVisualizer({ playing, color = GOLD }) {
  const bars = 32;
  return (
    <div className="flex items-center justify-center gap-0.5" style={{ height: 40 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          animate={playing ? {
            height: [4, 8 + Math.random() * 28, 4],
          } : { height: 4 }}
          transition={playing ? {
            duration: 0.4 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.03,
            ease: 'easeInOut',
          } : {}}
          style={{ width: 3, borderRadius: 2, background: color, opacity: 0.7 + i % 3 * 0.1 }}
        />
      ))}
    </div>
  );
}

function TrackCard({ track, onPlay, isPlaying, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl"
      style={{ background: BG2, border: `1px solid ${isPlaying ? GOLD + '40' : 'rgba(212,175,55,0.1)'}`, boxShadow: isPlaying ? `0 0 20px ${GOLD}15` : 'none' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onPlay}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: isPlaying ? `${GOLD}20` : `${CRIMSON}20`, border: `1px solid ${isPlaying ? GOLD + '50' : CRIMSON + '40'}` }}
        >
          {isPlaying ? <Pause className="w-4 h-4" style={{ color: GOLD }} /> : <Play className="w-4 h-4 ml-0.5" style={{ color: '#fff' }} />}
        </motion.button>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-white truncate" style={T}>{track.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full"
              style={{ ...T, background: `${PURPLE}15`, border: `1px solid ${PURPLE}30`, color: PURPLE }}>
              {track.genre}
            </span>
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{track.bpm} BPM · {track.mood}</span>
          </div>
        </div>
        <button onClick={onDelete}
          className="p-1.5 rounded-lg shrink-0"
          style={{ background: 'rgba(255,21,100,0.06)', border: '1px solid rgba(255,21,100,0.15)' }}>
          <Trash2 className="w-3.5 h-3.5" style={{ color: PINK }} />
        </button>
      </div>
      {isPlaying && <WaveformVisualizer playing={true} color={GOLD} />}
    </motion.div>
  );
}

export default function AIMusic() {
  const [activeTab, setActiveTab] = useState('generate');
  const [genre, setGenre] = useState('lofi');
  const [mood, setMood] = useState('chill');
  const [bpm, setBpm] = useState(90);
  const [prompt, setPrompt] = useState('');
  const [trackName, setTrackName] = useState('');
  const [duration, setDuration] = useState(60);
  const [generating, setGenerating] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [tracks, setTracks] = useState([
    { id: 't1', name: 'Late Night Lo-Fi Session', genre: 'lofi', mood: 'chill', bpm: 85, duration: 180, created: Date.now() - 86400000 },
    { id: 't2', name: 'Hype Train Intro', genre: 'trap', mood: 'hype', bpm: 140, duration: 60, created: Date.now() - 3600000 },
    { id: 't3', name: 'Chat & Chill Vibes', genre: 'rnb', mood: 'chill', bpm: 90, duration: 120, created: Date.now() - 7200000 },
  ]);
  const [djMode, setDjMode] = useState(false);
  const [djQueue, setDjQueue] = useState([]);
  const [djPlaying, setDjPlaying] = useState(false);

  const selectedGenre = GENRES.find(g => g.id === genre) || GENRES[0];

  const TABS = [
    { id: 'generate', label: 'Generate', icon: Wand2, color: GOLD },
    { id: 'library', label: 'My Tracks', icon: Music, color: PURPLE },
    { id: 'presets', label: 'Stream Presets', icon: Radio, color: CYAN },
    { id: 'dj', label: 'AI DJ Mode', icon: Headphones, color: PINK },
  ];

  function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    const name = trackName || `${selectedGenre.emoji} ${selectedGenre.label} — ${mood} ${bpm}bpm`;
    setTimeout(() => {
      const newTrack = {
        id: `t${Date.now()}`,
        name,
        genre,
        mood,
        bpm,
        duration,
        prompt,
        created: Date.now(),
      };
      setTracks(prev => [newTrack, ...prev]);
      setGenerating(false);
      setTrackName('');
      setPrompt('');
      setActiveTab('library');
    }, 2800);
  }

  function applyPreset(preset) {
    setGenre(preset.genre);
    setMood(preset.mood);
    setBpm(preset.bpm);
    setTrackName(preset.label);
    setActiveTab('generate');
  }

  function toggleDjTrack(track) {
    setDjQueue(prev =>
      prev.find(t => t.id === track.id)
        ? prev.filter(t => t.id !== track.id)
        : [...prev, track]
    );
  }

  return (
    <div className="min-h-screen pb-10 text-white" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${PURPLE})` }}>
          <Music className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white leading-none" style={T}>AI Music Studio</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
            Generate beats, build playlists &amp; power your stream soundtrack
          </p>
        </div>

        {/* Volume control */}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setMuted(m => !m)}
            className="p-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {muted ? <VolumeX className="w-4 h-4" style={{ color: PINK }} /> : <Volume2 className="w-4 h-4" style={{ color: GOLD }} />}
          </button>
          <input type="range" min="0" max="100" value={volume}
            onChange={e => setVolume(parseInt(e.target.value))}
            style={{ width: 80, accentColor: GOLD }} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 space-y-4">

        {/* Now Playing strip */}
        {playingId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}25` }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${GOLD}20` }}>
              <Music className="w-4 h-4" style={{ color: GOLD }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate" style={T}>
                {tracks.find(t => t.id === playingId)?.name || 'Track'}
              </p>
              <WaveformVisualizer playing={true} color={GOLD} />
            </div>
            <button onClick={() => setPlayingId(null)}
              className="p-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Square className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
            </button>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all"
              style={{ ...T, color: activeTab === tab.id ? tab.color : 'rgba(255,255,255,0.35)', borderBottomColor: activeTab === tab.id ? tab.color : 'transparent', background: 'transparent' }}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── GENERATE TAB ── */}
        {activeTab === 'generate' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Genre Grid */}
            <div className="rounded-2xl p-5" style={{ background: BG2, border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="font-black text-sm mb-3" style={{ ...T, color: GOLD }}>Genre</p>
              <div className="grid grid-cols-4 gap-2">
                {GENRES.map(g => (
                  <motion.button key={g.id} whileTap={{ scale: 0.9 }}
                    onClick={() => setGenre(g.id)}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl transition-all"
                    style={{
                      background: genre === g.id ? `${g.color}18` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${genre === g.id ? g.color + '50' : 'rgba(255,255,255,0.07)'}`,
                      boxShadow: genre === g.id ? `0 0 14px ${g.color}30` : 'none',
                    }}>
                    <span className="text-xl">{g.emoji}</span>
                    <span className="text-[9px] font-black uppercase text-center leading-tight"
                      style={{ ...T, color: genre === g.id ? g.color : 'rgba(255,255,255,0.4)' }}>{g.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Mood & BPM */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-5" style={{ background: BG2, border: '1px solid rgba(212,175,55,0.1)' }}>
                <p className="font-black text-sm mb-3" style={{ ...T, color: CYAN }}>Mood</p>
                <div className="space-y-1.5">
                  {MOODS.map(m => (
                    <button key={m.id} onClick={() => setMood(m.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left"
                      style={{
                        background: mood === m.id ? `${CYAN}12` : 'transparent',
                        border: `1px solid ${mood === m.id ? CYAN + '40' : 'transparent'}`,
                      }}>
                      <span>{m.emoji}</span>
                      <span className="text-xs font-black" style={{ ...T, color: mood === m.id ? CYAN : 'rgba(255,255,255,0.5)' }}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: BG2, border: '1px solid rgba(212,175,55,0.1)' }}>
                <p className="font-black text-sm mb-3" style={{ ...T, color: PURPLE }}>BPM</p>
                <div className="space-y-1.5">
                  {BPM_OPTIONS.map(b => (
                    <button key={b} onClick={() => setBpm(b)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all"
                      style={{
                        background: bpm === b ? `${PURPLE}12` : 'transparent',
                        border: `1px solid ${bpm === b ? PURPLE + '40' : 'transparent'}`,
                      }}>
                      <span className="text-xs font-black font-mono" style={{ color: bpm === b ? PURPLE : 'rgba(255,255,255,0.5)' }}>{b}</span>
                      {bpm === b && <div className="w-1.5 h-1.5 rounded-full" style={{ background: PURPLE }} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Prompt & Options */}
            <div className="rounded-2xl p-5" style={{ background: BG2, border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="font-black text-sm mb-3" style={{ ...T, color: PINK }}>AI Prompt <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>(optional)</span></p>
              <textarea
                value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="Describe your track... e.g. 'Dark trap with 808 bass and atmospheric synths'"
                rows={3}
                style={{ ...inp, resize: 'none', marginBottom: 8 }}
              />
              {/* Quick prompt suggestions */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {AI_PROMPTS.slice(0, 3).map((p, i) => (
                  <button key={i} onClick={() => setPrompt(p)}
                    className="text-[9px] font-black px-2 py-1 rounded-lg transition-all"
                    style={{ ...T, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                    {p.slice(0, 38)}…
                  </button>
                ))}
              </div>

              <label style={lbl}>Track Name <span style={{ color: 'rgba(255,255,255,0.2)' }}>(optional)</span></label>
              <input value={trackName} onChange={e => setTrackName(e.target.value)}
                placeholder="e.g. My Stream Intro Beat" style={inp} />

              <div className="grid grid-cols-2 gap-4 mt-0">
                <div>
                  <label style={lbl}>Duration</label>
                  <select value={duration} onChange={e => setDuration(parseInt(e.target.value))} style={inp}>
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={120}>2 minutes</option>
                    <option value={180}>3 minutes</option>
                    <option value={300}>5 minutes</option>
                    <option value={600}>10 minutes (Loop)</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <motion.button
                    onClick={handleGenerate}
                    disabled={generating}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-xl font-black uppercase tracking-wide text-sm mt-2 disabled:opacity-60"
                    style={{ ...T, background: generating ? 'rgba(212,175,55,0.2)' : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, color: generating ? GOLD : '#000', border: 'none' }}
                  >
                    {generating ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <RefreshCw className="w-4 h-4" />
                        </motion.span>
                        Generating…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Wand2 className="w-4 h-4" /> Generate Track
                      </span>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Generating Progress */}
            <AnimatePresence>
              {generating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl p-5 text-center"
                  style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}25` }}
                >
                  <p className="font-black text-sm mb-3" style={{ ...T, color: GOLD }}>🎵 AI is composing your track…</p>
                  <WaveformVisualizer playing={true} color={GOLD} />
                  <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
                    Analyzing {selectedGenre.label} patterns • {mood} mood • {bpm} BPM
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── LIBRARY TAB ── */}
        {activeTab === 'library' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>{tracks.length} tracks generated</p>
              <button onClick={() => setActiveTab('generate')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black"
                style={{ ...T, background: `${GOLD}15`, border: `1px solid ${GOLD}30`, color: GOLD }}>
                <Plus className="w-3.5 h-3.5" /> New Track
              </button>
            </div>
            {tracks.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ background: BG2, border: '1px solid rgba(255,255,255,0.06)' }}>
                <Music className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                <p className="text-sm font-black" style={{ ...T, color: 'rgba(255,255,255,0.4)' }}>No tracks yet</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>Generate your first AI track above</p>
              </div>
            ) : (
              tracks.map(track => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isPlaying={playingId === track.id}
                  onPlay={() => setPlayingId(playingId === track.id ? null : track.id)}
                  onDelete={() => { setTracks(prev => prev.filter(t => t.id !== track.id)); if (playingId === track.id) setPlayingId(null); }}
                />
              ))
            )}
          </motion.div>
        )}

        {/* ── PRESETS TAB ── */}
        {activeTab === 'presets' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="rounded-2xl p-4" style={{ background: `${CYAN}08`, border: `1px solid ${CYAN}20` }}>
              <p className="text-xs font-black" style={{ ...T, color: CYAN }}>Stream-Ready Presets</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
                One-tap presets optimized for specific stream moments. Click to load into the generator.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STREAM_PRESETS.map(preset => (
                <motion.div key={preset.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-2xl cursor-pointer"
                  style={{ background: BG2, border: '1px solid rgba(212,175,55,0.12)' }}
                  onClick={() => applyPreset(preset)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">{preset.emoji}</div>
                    <div className="flex-1">
                      <p className="font-black text-sm text-white" style={T}>{preset.label}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>{preset.desc}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase"
                          style={{ ...T, background: `${PURPLE}15`, border: `1px solid ${PURPLE}25`, color: PURPLE }}>
                          {GENRES.find(g => g.id === preset.genre)?.label}
                        </span>
                        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
                          {preset.mood} · {preset.bpm} BPM
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 mt-1" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── AI DJ MODE TAB ── */}
        {activeTab === 'dj' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* DJ Header */}
            <div className="rounded-2xl p-5 text-center relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${CRIMSON}20, ${PURPLE}20)`, border: `1px solid ${PINK}25` }}>
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: `radial-gradient(ellipse at center top, ${PINK}15 0%, transparent 60%)`,
              }} />
              <Headphones className="w-10 h-10 mx-auto mb-3" style={{ color: PINK }} />
              <p className="font-black text-lg" style={{ ...T, color: PINK }}>AI DJ Mode</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)', ...T }}>
                Build a queue and let AI auto-mix your stream soundtrack
              </p>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setDjPlaying(p => !p)}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-sm"
                style={{ ...T, background: djPlaying ? `${PINK}20` : `linear-gradient(90deg, ${CRIMSON}, ${PINK})`, border: `1px solid ${PINK}40`, color: djPlaying ? PINK : '#fff' }}
              >
                {djPlaying ? <><Pause className="w-4 h-4" /> Stop DJ</> : <><Play className="w-4 h-4 ml-0.5" /> Start DJ</>}
              </motion.button>
            </div>

            {djPlaying && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-4 rounded-2xl"
                style={{ background: `${PINK}08`, border: `1px solid ${PINK}25` }}>
                <p className="text-xs font-black mb-2" style={{ ...T, color: PINK }}>🎧 DJ Active — Auto-mixing your queue</p>
                <WaveformVisualizer playing={true} color={PINK} />
              </motion.div>
            )}

            {/* Queue Builder */}
            <div className="rounded-2xl p-5" style={{ background: BG2, border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="font-black text-sm mb-3" style={{ ...T, color: GOLD }}>Queue ({djQueue.length} tracks)</p>
              {djQueue.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
                  Add tracks from your library below
                </p>
              ) : (
                <div className="space-y-2">
                  {djQueue.map((track, i) => (
                    <div key={track.id} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <span className="text-xs font-black w-5 text-center" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-xs font-black text-white" style={T}>{track.name}</p>
                        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{track.genre} · {track.bpm} BPM</p>
                      </div>
                      <button onClick={() => toggleDjTrack(track)}>
                        <Trash2 className="w-3.5 h-3.5" style={{ color: PINK }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add from library */}
            <div className="rounded-2xl p-5" style={{ background: BG2, border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="font-black text-sm mb-3" style={{ ...T, color: PURPLE }}>Add to Queue</p>
              <div className="space-y-2">
                {tracks.map(track => {
                  const inQueue = djQueue.find(t => t.id === track.id);
                  return (
                    <div key={track.id} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                      style={{ background: inQueue ? `${PURPLE}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${inQueue ? PURPLE + '30' : 'transparent'}` }}>
                      <div className="flex-1">
                        <p className="text-xs font-black text-white" style={T}>{track.name}</p>
                        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{track.genre} · {track.mood} · {track.bpm} BPM</p>
                      </div>
                      <button onClick={() => toggleDjTrack(track)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase"
                        style={{ ...T, background: inQueue ? `${PINK}15` : `${PURPLE}15`, border: `1px solid ${inQueue ? PINK + '30' : PURPLE + '30'}`, color: inQueue ? PINK : PURPLE }}>
                        {inQueue ? 'Remove' : '+ Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
