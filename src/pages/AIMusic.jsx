import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
import {
  Music, Play, Pause, Heart, Download, MoreHorizontal, Wand2,
  Mic2, Headphones, RefreshCw, X, ChevronRight, Zap,
  Sparkles, Radio, Sliders, Send, Search
} from 'lucide-react';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BG      = '#0E0C09';
const BG2     = 'rgba(14,12,9,0.95)';
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const AMBER   = '#D4854A';
const ROSE    = '#C0395A';
const GREEN   = '#6DBF7E';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

// ── Shared input style ─────────────────────────────────────────────────────────
const inp = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(14,12,9,0.85)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Barlow Condensed, sans-serif',
};

// ── Style tag categories ──────────────────────────────────────────────────────
const STYLE_CATEGORIES = [
  {
    label: 'Genre',
    color: AMBER,
    tags: ['Lo-Fi','Hip-Hop','Trap','R&B','Gospel','EDM','House','Drill','Afrobeats','Jazz','Ambient','Pop'],
  },
  {
    label: 'Mood',
    color: PINK,
    tags: ['Hype','Chill','Dark','Uplifting','Romantic','Aggressive','Melancholic','Euphoric'],
  },
  {
    label: 'Instruments',
    color: ROSE,
    tags: ['808','Piano','Guitar','Violin','Drums','Brass','Synth','Choir','Bass','Flute'],
  },
  {
    label: 'Tempo',
    color: GOLD,
    tags: ['Slow (60-80)','Medium (90-110)','Fast (120-140)','Hyper (150+)'],
  },
];

// ── Genre → color mapping for album art (earth-tone palette only) ────────────
function tagColor(tags) {
  const map = {
    'trap':     `linear-gradient(135deg, #1a0000, ${CRIMSON})`,
    'lo-fi':    `linear-gradient(135deg, #1a1000, ${GOLD})`,
    'gospel':   `linear-gradient(135deg, #1a0a00, #E8A030)`,
    'afrobeats':`linear-gradient(135deg, #120800, #8B4513)`,
    'edm':      `linear-gradient(135deg, #0d0a00, ${AMBER})`,
    'hip-hop':  `linear-gradient(135deg, #1a1000, ${GOLD})`,
    'r&b':      `linear-gradient(135deg, #1a0000, ${ROSE})`,
    'jazz':     `linear-gradient(135deg, #0d0800, #C9A84C)`,
    'ambient':  `linear-gradient(135deg, #0a0d00, #8A7A62)`,
    'house':    `linear-gradient(135deg, #1a0400, ${AMBER})`,
    'drill':    `linear-gradient(135deg, #1a0000, #A01010)`,
    'pop':      `linear-gradient(135deg, #1a0008, ${ROSE})`,
  };
  for (const t of (tags || [])) {
    const k = t.toLowerCase();
    if (map[k]) return map[k];
  }
  return `linear-gradient(135deg, #100d00, ${CRIMSON})`;
}

// ── Trending styles data ──────────────────────────────────────────────────────
const TRENDING = [
  { emoji: '🌑', label: 'Dark Trap', style: 'trap, 808, dark, hype', count: '128 tracks' },
  { emoji: '🎧', label: 'Lo-Fi Chill', style: 'lo-fi, piano, chill, ambient', count: '214 tracks' },
  { emoji: '🎺', label: 'Gospel Vibes', style: 'gospel, choir, uplifting, piano', count: '73 tracks' },
  { emoji: '🌍', label: 'Afrobeats', style: 'afrobeats, drums, hype, fast', count: '96 tracks' },
  { emoji: '🎛️', label: 'EDM Hype', style: 'edm, synth, hype, hyper (150+)', count: '142 tracks' },
  { emoji: '💜', label: 'R&B Late Night', style: 'r&b, bass, romantic, slow (60-80)', count: '61 tracks' },
];

// ── Initial mock library ──────────────────────────────────────────────────────
const INITIAL_TRACKS = [
  {
    id: 't1',
    title: 'Midnight Trap Session',
    tags: ['trap', '808', 'dark', 'hype'],
    duration: '2:47',
    emoji: '🌑',
    playing: false,
    liked: false,
    likeCount: 24,
    streamReady: true,
    lyrics: '[Verse 1]\nLate nights in the booth, grinding till the dawn\nEvery bar I spit another diamond born\nDark energy rising, 808 low\nStream started rolling, watch the numbers grow\n\n[Chorus]\nMidnight session, dark trap nation\nEvery beat a dedication\nLive from the shadows, lights are low\nChat is moving, here we go\n\n[Verse 2]\nSub train rolling, hype train lit\nDrops so heavy make the whole room hit\nProducers on the beat while I hold it down\nSeeWhy LIVE, we run this town',
  },
  {
    id: 't2',
    title: 'Lo-Fi Study Beats Vol.3',
    tags: ['lo-fi', 'piano', 'chill', 'ambient'],
    duration: '3:22',
    emoji: '🎧',
    playing: false,
    liked: true,
    likeCount: 89,
    streamReady: true,
    lyrics: null,
  },
  {
    id: 't3',
    title: 'Gospel Rising',
    tags: ['gospel', 'choir', 'uplifting', 'piano'],
    duration: '4:05',
    emoji: '🎺',
    playing: false,
    liked: false,
    likeCount: 12,
    streamReady: false,
    lyrics: '[Intro]\nRise up, rise up\nLet the music carry you\n\n[Verse 1]\nIn the morning when I open my eyes\nI hear the choir singing from the skies\nEvery note a testament to grace\nEvery melody a holy place\n\n[Chorus]\nGospel rising, voices lifting high\nSeeWhy LIVE, we touch the sky\nHands together, hearts aligned\nLeave the darkness far behind',
  },
  {
    id: 't4',
    title: 'Afrobeats Summer Jam',
    tags: ['afrobeats', 'drums', 'hype', 'fast'],
    duration: '3:15',
    emoji: '🌍',
    playing: false,
    liked: false,
    likeCount: 31,
    streamReady: true,
    lyrics: null,
  },
];

// ── Advanced generation options ───────────────────────────────────────────────
const VOCAL_TYPES = [
  { id: 'auto',        label: 'Auto',        color: GOLD },
  { id: 'male-rap',    label: 'Male Rap',    color: AMBER },
  { id: 'female-rnb',  label: 'Female R&B',  color: PINK },
  { id: 'male-singer', label: 'Male Singer', color: ROSE },
  { id: 'choir',       label: 'Choir',       color: GREEN },
  { id: 'auto-tune',   label: 'Auto-Tune',   color: '#D4AF37' },
];

const MASTER_PRESETS = [
  { id: 'radio',   label: 'Radio',   color: GOLD },
  { id: 'club',    label: 'Club',    color: PINK },
  { id: 'youtube', label: 'YouTube', color: '#FF0000' },
  { id: 'lo-fi',   label: 'Lo-Fi',   color: ROSE },
];

const DURATIONS = [
  { s: 30,  label: '30s' },
  { s: 60,  label: '1m' },
  { s: 120, label: '2m' },
  { s: 180, label: '3m' },
];

const KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// ── Generation status messages ────────────────────────────────────────────────
const GEN_STEPS = [
  'Analyzing style tags…',
  'Composing lyrics…',
  'Arranging instrumentation…',
  'Rendering audio…',
  'Mastering track…',
  'Finalizing…',
];

// ── WaveformVisualizer ────────────────────────────────────────────────────────
function WaveformVisualizer({ playing, color = GOLD, bars = 28, height = 36 }) {
  const heights = useRef(
    Array.from({ length: bars }, () => 4 + Math.random() * 24)
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height }}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          animate={playing ? { height: [4, heights.current[i], 4] } : { height: 4 }}
          transition={
            playing
              ? { duration: 0.35 + (i % 5) * 0.09, repeat: Infinity, delay: i * 0.025, ease: 'easeInOut' }
              : { duration: 0.2 }
          }
          style={{ width: 3, borderRadius: 2, background: color, opacity: 0.75 + (i % 3) * 0.08, flexShrink: 0 }}
        />
      ))}
    </div>
  );
}

// ── StyleChip ─────────────────────────────────────────────────────────────────
function StyleChip({ label, color, active, onClick, onRemove }) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 11px',
        borderRadius: 999,
        border: `1px solid ${active ? color + 'aa' : 'rgba(255,255,255,0.12)'}`,
        background: active ? color + '22' : 'rgba(255,255,255,0.04)',
        color: active ? color : 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
      }}
    >
      {label}
      {active && onRemove && (
        <X size={10} style={{ marginLeft: 2, opacity: 0.7 }} onClick={(e) => { e.stopPropagation(); onRemove(); }} />
      )}
    </motion.button>
  );
}

// ── MiniScrubber ──────────────────────────────────────────────────────────────
function MiniScrubber({ isPlaying, duration }) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const [totalSecs] = useState(() => {
    const [m, s] = (duration || '2:00').split(':').map(Number);
    return m * 60 + (s || 0);
  });

  useEffect(() => {
    if (!isPlaying) { cancelAnimationFrame(rafRef.current); return; }
    startRef.current = Date.now() - progress * totalSecs * 10;
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const pct = Math.min(1, elapsed / totalSecs);
      setProgress(pct);
      if (pct < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  const fmtTime = (p) => {
    const s = Math.floor(p * totalSecs);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '0 16px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.3)', minWidth: 28 }}>{fmtTime(progress)}</span>
        <div
          style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, cursor: 'pointer', position: 'relative' }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setProgress(p);
            if (isPlaying) startRef.current = Date.now() - p * totalSecs * 1000;
          }}
        >
          <motion.div
            style={{ height: '100%', background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, borderRadius: 2, width: `${progress * 100}%` }}
          />
          <div style={{ position: 'absolute', top: '50%', left: `${progress * 100}%`, transform: 'translate(-50%, -50%)', width: 8, height: 8, borderRadius: '50%', background: GOLD, opacity: isPlaying ? 1 : 0.5 }} />
        </div>
        <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.3)', minWidth: 28, textAlign: 'right' }}>{fmtTime(1)}</span>
      </div>
    </div>
  );
}

// ── TrackCard ─────────────────────────────────────────────────────────────────
function TrackCard({ track, isPlaying, onPlay, onLike, onDelete, onContinue, onRemix, onAddToStream }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [editingLyrics, setEditingLyrics] = useState(false);
  const [lyricsText, setLyricsText] = useState(track.lyrics || '');
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const menuRef = useRef(null);

  // close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const artGradient = tagColor(track.tags);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      style={{
        borderRadius: 16,
        background: BG2,
        border: `1px solid ${isPlaying ? GOLD + '50' : 'rgba(212,175,55,0.1)'}`,
        boxShadow: isPlaying ? `0 0 24px ${GOLD}18` : 'none',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
        {/* Album art / play button */}
        <div
          style={{
            position: 'relative',
            width: 80,
            height: 80,
            borderRadius: 12,
            background: artGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          onClick={onPlay}
        >
          <span style={{ fontSize: 28, lineHeight: 1, zIndex: 1 }}>{track.emoji}</span>
          {/* Play overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
            }}
          >
            {isPlaying
              ? <Pause size={26} color="#fff" />
              : <Play size={26} color="#fff" style={{ marginLeft: 3 }} />
            }
          </motion.div>
          {/* Waveform overlay when playing */}
          {isPlaying && (
            <div style={{ position: 'absolute', bottom: 4, left: 4, right: 4 }}>
              <WaveformVisualizer playing bars={18} height={18} color="#fff" />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ ...T, color: '#fff', fontSize: 15, fontWeight: 800, letterSpacing: '0.02em' }}>
              {track.title}
            </span>
            {track.streamReady && (
              <span style={{
                ...T, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                padding: '2px 7px', borderRadius: 999,
                background: GREEN + '22', border: `1px solid ${GREEN}55`, color: GREEN,
                textTransform: 'uppercase',
              }}>
                Stream Ready
              </span>
            )}
          </div>
          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
            {track.tags.map(tag => (
              <span key={tag} style={{
                ...T, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                padding: '2px 8px', borderRadius: 999,
                background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
                color: GOLD, textTransform: 'uppercase',
              }}>
                {tag}
              </span>
            ))}
          </div>
          {/* Duration */}
          <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>
            {track.duration}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Like */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onLike}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <Heart
              size={17}
              fill={track.liked ? PINK : 'none'}
              color={track.liked ? PINK : 'rgba(255,255,255,0.35)'}
            />
            <span style={{ ...T, fontSize: 10, color: track.liked ? PINK : 'rgba(255,255,255,0.3)' }}>
              {track.likeCount}
            </span>
          </motion.button>

          {/* More menu */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setMenuOpen(o => !o)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
              }}
            >
              <MoreHorizontal size={15} />
            </motion.button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  style={{
                    position: 'absolute', right: 0, top: 36, zIndex: 30,
                    background: 'rgba(8,11,24,0.98)', border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: 12, overflow: 'hidden', minWidth: 150,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}
                >
                  {[
                    { label: 'Remix', icon: RefreshCw, color: AMBER, action: () => { onRemix(); setMenuOpen(false); } },
                    { label: 'Continue', icon: ChevronRight, color: ROSE, action: () => { onContinue(); setMenuOpen(false); } },
                    { label: 'Download', icon: Download, color: GOLD, action: () => setMenuOpen(false) },
                    { label: 'Delete', icon: X, color: PINK, action: () => { onDelete(); setMenuOpen(false); } },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '10px 14px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: item.color, fontSize: 13, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif',
                        textAlign: 'left', letterSpacing: '0.04em',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <item.icon size={13} /> {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Lyrics toggle if lyrics exist */}
          {track.lyrics && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setLyricsOpen(o => !o)}
              style={{
                background: lyricsOpen ? ROSE + '22' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${lyricsOpen ? ROSE + '55' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8, width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: lyricsOpen ? ROSE : 'rgba(255,255,255,0.4)',
              }}
              title="View lyrics"
            >
              <Mic2 size={13} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Add to Stream + Scrubber row */}
      <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {track.streamReady && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => onAddToStream?.(track)}
            style={{
              ...T, display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800,
              background: `${GREEN}15`, border: `1px solid ${GREEN}40`, color: GREEN,
              cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${GREEN}25`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${GREEN}15`; }}
          >
            <Send size={10} /> Add to Stream
          </motion.button>
        )}
        <span style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{track.duration}</span>
      </div>

      {/* Mini audio scrubber */}
      {isPlaying && <MiniScrubber isPlaying={isPlaying} duration={track.duration} />}

      {/* Lyrics panel */}
      <AnimatePresence>
        {lyricsOpen && track.lyrics && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(212,175,55,0.15)' }}
          >
            <div style={{ padding: '14px 16px', background: 'rgba(212,175,55,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ ...T, fontSize: 11, color: ROSE, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Lyrics
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => { navigator.clipboard.writeText(lyricsText).then(() => { setCopiedLyrics(true); setTimeout(() => setCopiedLyrics(false), 1800); }); }}
                    style={{ ...T, background: 'none', border: 'none', cursor: 'pointer', color: copiedLyrics ? GOLD : 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, transition: 'color .2s' }}
                  >
                    {copiedLyrics ? '✓ copied' : '📋 copy'}
                  </button>
                  <button
                    onClick={() => setEditingLyrics(e => !e)}
                    style={{ ...T, background: 'none', border: 'none', cursor: 'pointer', color: AMBER, fontSize: 11, fontWeight: 700 }}
                  >
                    {editingLyrics ? 'Done' : 'Edit'}
                  </button>
                </div>
              </div>
              {editingLyrics ? (
                <textarea
                  value={lyricsText}
                  onChange={e => setLyricsText(e.target.value)}
                  rows={10}
                  style={{ ...inp, fontSize: 12, resize: 'vertical', lineHeight: 1.7 }}
                />
              ) : (
                <pre style={{
                  margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 12,
                  fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1.8,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {lyricsText.split('\n').map((line, i) => {
                    const isTag = /^\[.+\]$/.test(line.trim());
                    return (
                      <span key={i} style={{ display: 'block', color: isTag ? GOLD : 'rgba(255,255,255,0.7)', fontWeight: isTag ? 800 : 400 }}>
                        {line || ' '}
                      </span>
                    );
                  })}
                </pre>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── ContinuePanel ─────────────────────────────────────────────────────────────
function ContinuePanel({ track, onClose, onGenerate }) {
  const [startTime, setStartTime] = useState(track.duration);
  const [desc, setDesc] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      style={{
        borderRadius: 16, background: BG2,
        border: `1px solid ${ROSE}55`,
        padding: 20, marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ ...T, color: ROSE, fontSize: 14, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Continue: {track.title}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
          <X size={16} />
        </button>
      </div>
      <label style={{ ...T, display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        Continue from (end of track)
      </label>
      <input
        value={startTime}
        onChange={e => setStartTime(e.target.value)}
        placeholder="e.g. 2:47"
        style={{ ...inp, marginBottom: 12 }}
      />
      <label style={{ ...T, display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        Description for next section
      </label>
      <textarea
        value={desc}
        onChange={e => setDesc(e.target.value)}
        rows={3}
        placeholder="Bridge with strings, slower tempo, emotional outro…"
        style={{ ...inp, resize: 'none', marginBottom: 14 }}
      />
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onGenerate({ track, startTime, desc })}
        style={{
          ...T, width: '100%', padding: '12px',
          background: `linear-gradient(90deg, ${CRIMSON}, ${AMBER})`,
          border: 'none', borderRadius: 10,
          color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: '0.06em',
          textTransform: 'uppercase', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <ChevronRight size={15} /> Generate Continuation
      </motion.button>
    </motion.div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          style={{
            position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(8,11,24,0.97)', border: `1px solid ${GOLD}55`,
            borderRadius: 12, padding: '12px 22px',
            color: '#fff', fontSize: 14, fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, letterSpacing: '0.04em',
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${GOLD}18`,
            zIndex: 9999, whiteSpace: 'nowrap',
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AIMusic() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
// Form state
  const [description, setDescription] = useState('');
  const [styleInput, setStyleInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [instrumental, setInstrumental] = useState(false);

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [keyNote, setKeyNote] = useState('C');
  const [keyScale, setKeyScale] = useState('major');
  const [duration, setDuration] = useState(120);
  const [vocalType, setVocalType] = useState('auto');
  const [masterPreset, setMasterPreset] = useState('radio');

  // Library filters
  const [libFilter, setLibFilter] = useState('all'); // all | liked | streamready
  const [libSearch, setLibSearch] = useState('');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const genTimerRef = useRef(null);

  // Library
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [playingId, setPlayingId] = useState(null);

  // Continue panel
  const [continueTrack, setContinueTrack] = useState(null);

  // Toast
  const [toast, setToast] = useState({ visible: false, message: '' });

  // Mobile tabs
  const [mobileTab, setMobileTab] = useState('create'); // 'create' | 'library' | 'trending'

  // Active style tag category filter
  const [activeCategory, setActiveCategory] = useState(0);

  // Parsed style tags (comma-separated from styleInput)
  const parsedTags = styleInput
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);

  // Cycling gen steps
  useEffect(() => {
    if (!generating) { setGenStep(0); return; }
    let step = 0;
    genTimerRef.current = setInterval(() => {
      step = (step + 1) % GEN_STEPS.length;
      setGenStep(step);
    }, 480);
    return () => clearInterval(genTimerRef.current);
  }, [generating]);

  function showToast(msg) {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  }

  function handleAddStyleTag(tag) {
    const lower = tag.toLowerCase();
    if (parsedTags.includes(lower)) return;
    setStyleInput(prev => prev ? prev + ', ' + lower : lower);
  }

  function handleRemoveStyleTag(tag) {
    const newTags = parsedTags.filter(t => t !== tag.toLowerCase());
    setStyleInput(newTags.join(', '));
  }

  async function handleCreate(forceInstrumental = false) {
    if (generating) return;
    setGenerating(true);
    const isInstrumental = forceInstrumental || instrumental;
    const tags = parsedTags.length > 0 ? parsedTags : ['chill'];
    const styleDesc = tags.join(', ');
    const promptText = description || `${styleDesc} background music${isInstrumental ? '' : ' with lyrics'}`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI music producer for SeeWhy LIVE, a live streaming platform. Generate a complete original track.
Style: ${styleDesc}
Description: ${promptText}
BPM: ${bpm}, Key: ${keyNote} ${keyScale}, Mastering: ${masterPreset}
Vocal: ${isInstrumental ? 'Instrumental – no lyrics' : vocalType}
Duration: ~${Math.floor(duration/60)}m${duration%60 > 0 ? duration%60+'s' : ''}

Return ONLY valid JSON (no markdown, no backticks):
{
  "title": "creative track title",
  "emoji": "one relevant emoji",
  "tags": ["tag1","tag2","tag3","tag4"],
  "duration": "2:45",
  "streamReady": true,
  "lyrics": ${isInstrumental ? 'null' : '"[Verse 1]\\nlyric line\\nlyric line\\n\\n[Chorus]\\nchorus line\\nchorus line\\n\\n[Verse 2]\\nverse line\\nverse line\\n\\n[Outro]\\noutro line"'},
  "description": "one-sentence description of the sound"
}`,
      });

      let data;
      try {
        const cleaned = (result || '').replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        data = JSON.parse(cleaned);
      } catch (_) {
        data = {
          title: titleInput || tags[0].charAt(0).toUpperCase() + tags[0].slice(1) + ' — AI Track',
          emoji: '🎵', tags, duration: `${2 + Math.floor(Math.random()*2)}:${(10+Math.floor(Math.random()*50)).toString().padStart(2,'0')}`,
          streamReady: true,
          lyrics: isInstrumental ? null : generateFallbackLyrics(tags),
        };
      }

      setTracks(prev => [{
        id: `t${Date.now()}`,
        title: titleInput || data.title || tags[0] + ' Track',
        tags: (data.tags || tags).slice(0, 6),
        duration: data.duration || '2:30',
        emoji: data.emoji || '🎵',
        liked: false,
        likeCount: 0,
        streamReady: data.streamReady !== false,
        lyrics: isInstrumental ? null : (data.lyrics || null),
      }, ...prev]);
      setTitleInput('');
      setDescription('');
      setMobileTab('library');
      showToast('🎵 AI track generated!');
    } catch (_) {
      const newTrack = {
        id: `t${Date.now()}`,
        title: titleInput || tags[0].charAt(0).toUpperCase() + tags[0].slice(1) + ' — AI Track',
        tags: tags.slice(0, 6),
        duration: `${2+Math.floor(Math.random()*2)}:${(10+Math.floor(Math.random()*50)).toString().padStart(2,'0')}`,
        emoji: '🎵', liked: false, likeCount: 0,
        streamReady: true,
        lyrics: isInstrumental ? null : generateFallbackLyrics(tags),
      };
      setTracks(prev => [newTrack, ...prev]);
      setMobileTab('library');
      showToast('🎵 Track created!');
    } finally {
      setGenerating(false);
    }
  }

  function generateFallbackLyrics(tags) {
    const mood = tags.find(t => ['dark','chill','hype','uplifting','romantic','aggressive'].includes(t)) || 'chill';
    const genre = tags[0] || 'music';
    return `[Verse 1]\nRiding the ${mood} wave, ${genre} in my veins\nSeeWhy LIVE is where the magic remains\nEvery beat a story, every note a dream\n\n[Chorus]\n${genre.toUpperCase()}, can you feel it tonight\nThe music takes over, everything feels right\nLive on the stream, hearts locked in the flow\n\n[Verse 2]\nChat moving fast, the energy is real\nAI composing what the soul demands\n\n[Outro]\nFade into the ${mood} night\nThis music carries us just right`;
  }

  function handleContinueGenerate({ track, startTime, desc }) {
    setContinueTrack(null);
    setGenerating(true);
    setTimeout(() => {
      const newTrack = {
        ...track,
        id: `t${Date.now()}`,
        title: track.title + ' (Continued)',
        duration: '1:' + (30 + Math.floor(Math.random() * 29)).toString(),
        likeCount: 0,
        liked: false,
      };
      setTracks(prev => [newTrack, ...prev]);
      setGenerating(false);
      showToast('🎵 Continuation ready!');
    }, 2800);
  }

  function togglePlay(id) {
    setPlayingId(prev => (prev === id ? null : id));
  }

  function toggleLike(id) {
    setTracks(prev => prev.map(t =>
      t.id === id
        ? { ...t, liked: !t.liked, likeCount: t.liked ? t.likeCount - 1 : t.likeCount + 1 }
        : t
    ));
  }

  function deleteTrack(id) {
    setTracks(prev => prev.filter(t => t.id !== id));
    if (playingId === id) setPlayingId(null);
  }

  function remixTrack(track) {
    setStyleInput(track.tags.join(', '));
    setTitleInput(track.title + ' (Remix)');
    setMobileTab('create');
    showToast('🎛️ Remix settings loaded!');
  }

  function handleAddToStream(track) {
    try {
      const existing = JSON.parse(sessionStorage.getItem('seewhy_stream_queue') || '[]');
      if (!existing.some(t => t.id === track.id)) {
        existing.push({ id: track.id, title: track.title, tags: track.tags, duration: track.duration, emoji: track.emoji, streamReady: track.streamReady });
        sessionStorage.setItem('seewhy_stream_queue', JSON.stringify(existing));
      }
    } catch (_) {}
    showToast(`📡 "${track.title}" added to stream queue!`);
  }

  const filteredTracks = tracks.filter(t => {
    if (libFilter === 'liked' && !t.liked) return false;
    if (libFilter === 'streamready' && !t.streamReady) return false;
    if (libSearch && !t.title.toLowerCase().includes(libSearch.toLowerCase()) && !t.tags.some(tag => tag.includes(libSearch.toLowerCase()))) return false;
    return true;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', paddingBottom: 60 }}>

      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
        borderBottom: '1px solid rgba(212,175,55,0.12)',
        background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(14px)',
      }}>
        <a href="/AIHub" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em', flexShrink: 0, paddingRight: 4 }} aria-label="Back to AI Hub">
          ← AI Hub
        </a>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, ${CRIMSON}, ${AMBER})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Music size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ ...T, fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '0.02em' }}>
            AI Music Studio
          </h1>
          <p style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: '0.08em' }}>
            Powered by SeeWhy LIVE · Suno-style generation
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            ...T, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
            padding: '4px 12px', borderRadius: 999,
            background: GOLD + '18', border: `1px solid ${GOLD}40`, color: GOLD,
            textTransform: 'uppercase',
          }}>
            <Zap size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            AI Beta
          </span>
        </div>
      </div>

      {/* ── Mobile tabs ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(8,11,24,0.95)', position: 'sticky', top: 71, zIndex: 40,
      }}>
        {[
          { id: 'create', label: 'Create', icon: Wand2, color: GOLD },
          { id: 'library', label: `My Songs (${tracks.length})`, icon: Music, color: ROSE },
          { id: 'trending', label: 'Trending', icon: Radio, color: AMBER },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            style={{
              flex: 1, padding: '12px 4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'none', border: 'none', borderBottom: `2px solid ${mobileTab === tab.id ? tab.color : 'transparent'}`,
              color: mobileTab === tab.id ? tab.color : 'rgba(255,255,255,0.35)',
              cursor: 'pointer', fontSize: 11, fontWeight: 800, fontFamily: 'Barlow Condensed, sans-serif',
              letterSpacing: '0.07em', textTransform: 'uppercase', transition: 'all 0.15s',
            }}
          >
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ── Two-column desktop layout ── */}
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 16px',
        display: 'flex',
        gap: 24,
        paddingTop: 24,
      }}>

        {/* ════ LEFT / CREATE PANEL ════ */}
        <div style={{
          flex: '0 0 520px',
          maxWidth: 520,
          display: mobileTab === 'create' ? 'block' : 'none',
        }}
          className="desktop-show-left"
        >

          {/* Hero prompt card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: 20, background: BG2,
              border: '1px solid rgba(212,175,55,0.15)',
              padding: 24, marginBottom: 20,
              boxShadow: `0 4px 40px rgba(0,0,0,0.4)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <Sparkles size={16} color={GOLD} />
              <span style={{ ...T, fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Song Description
              </span>
            </div>

            {/* Main textarea */}
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe your song... dark trap beat with 808s, hype stream intro, chill lo-fi piano loop..."
              style={{ ...inp, resize: 'none', fontSize: 15, lineHeight: 1.6, marginBottom: 14 }}
            />

            {/* Style of Music */}
            <label style={{ ...T, display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Style of Music
            </label>
            <input
              value={styleInput}
              onChange={e => setStyleInput(e.target.value)}
              placeholder="trap, 808, dark, hype"
              style={{ ...inp, marginBottom: 10 }}
            />

            {/* Active style tag pills */}
            {parsedTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {parsedTags.map(tag => (
                  <StyleChip
                    key={tag}
                    label={tag}
                    color={AMBER}
                    active
                    onRemove={() => handleRemoveStyleTag(tag)}
                    onClick={() => {}}
                  />
                ))}
              </div>
            )}

            {/* Title */}
            <label style={{ ...T, display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Title (optional)
            </label>
            <input
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              placeholder="My Stream Intro Beat"
              style={{ ...inp, marginBottom: 16 }}
            />

            {/* Instrumental toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => setInstrumental(i => !i)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: instrumental ? ROSE : 'rgba(255,255,255,0.12)',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <motion.div
                  animate={{ x: instrumental ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{
                    position: 'absolute', top: 3, width: 18, height: 18, borderRadius: 9,
                    background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  }}
                />
              </button>
              <span style={{ ...T, fontSize: 13, color: instrumental ? ROSE : 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                Instrumental (no lyrics)
              </span>
            </div>

            {/* Advanced options toggle */}
            <button
              onClick={() => setShowAdvanced(v => !v)}
              style={{ ...T, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: showAdvanced ? AMBER : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: showAdvanced ? 0 : 4 }}
            >
              <Sliders size={12} /> Advanced Options
              <ChevronRight size={11} style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden', marginBottom: 16 }}
                >
                  <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* BPM Slider */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>BPM</label>
                        <span style={{ ...T, fontSize: 13, fontWeight: 800, color: GOLD }}>{bpm}</span>
                      </div>
                      <input type="range" min={60} max={180} step={1} value={bpm} onChange={e => setBpm(+e.target.value)}
                        className="w-full h-1.5 rounded-full appearance-none"
                        style={{ background: `linear-gradient(to right, ${GOLD} ${((bpm - 60) / 120) * 100}%, rgba(255,255,255,0.1) 0%)` }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                        <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>60 Slow</span>
                        <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Hyper 180</span>
                      </div>
                    </div>

                    {/* Key/Scale */}
                    <div>
                      <label style={{ ...T, display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                        Key: <span style={{ color: ROSE }}>{keyNote} {keyScale}</span>
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                        {KEYS.map(k => (
                          <button key={k} onClick={() => setKeyNote(k)}
                            style={{ ...T, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.12s', background: keyNote === k ? ROSE + '25' : 'rgba(255,255,255,0.04)', border: `1px solid ${keyNote === k ? ROSE + '60' : 'rgba(255,255,255,0.08)'}`, color: keyNote === k ? ROSE : 'rgba(255,255,255,0.4)' }}>
                            {k}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['major', 'minor'].map(s => (
                          <button key={s} onClick={() => setKeyScale(s)}
                            style={{ ...T, flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.12s', background: keyScale === s ? ROSE + '20' : 'rgba(255,255,255,0.04)', border: `1px solid ${keyScale === s ? ROSE + '50' : 'rgba(255,255,255,0.08)'}`, color: keyScale === s ? ROSE : 'rgba(255,255,255,0.35)' }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <label style={{ ...T, display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Duration</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {DURATIONS.map(d => (
                          <button key={d.s} onClick={() => setDuration(d.s)}
                            style={{ ...T, flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.12s', background: duration === d.s ? AMBER + '18' : 'rgba(255,255,255,0.04)', border: `1px solid ${duration === d.s ? AMBER + '50' : 'rgba(255,255,255,0.08)'}`, color: duration === d.s ? AMBER : 'rgba(255,255,255,0.35)' }}>
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Vocal type */}
                    <div>
                      <label style={{ ...T, display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Vocal Type</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {VOCAL_TYPES.map(v => (
                          <button key={v.id} onClick={() => { setVocalType(v.id); if (v.id !== 'auto') setInstrumental(false); }}
                            style={{ ...T, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.12s', background: vocalType === v.id ? v.color + '20' : 'rgba(255,255,255,0.04)', border: `1px solid ${vocalType === v.id ? v.color + '60' : 'rgba(255,255,255,0.08)'}`, color: vocalType === v.id ? v.color : 'rgba(255,255,255,0.4)' }}>
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mastering preset */}
                    <div>
                      <label style={{ ...T, display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Mastering Preset</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {MASTER_PRESETS.map(p => (
                          <button key={p.id} onClick={() => setMasterPreset(p.id)}
                            style={{ ...T, flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.12s', background: masterPreset === p.id ? p.color + '18' : 'rgba(255,255,255,0.04)', border: `1px solid ${masterPreset === p.id ? p.color + '50' : 'rgba(255,255,255,0.08)'}`, color: masterPreset === p.id ? p.color : 'rgba(255,255,255,0.35)' }}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={generating}
                onClick={() => handleCreate(false)}
                style={{
                  flex: 1, padding: '13px 0',
                  background: generating ? 'rgba(212,175,55,0.15)' : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`,
                  border: 'none', borderRadius: 12, cursor: generating ? 'not-allowed' : 'pointer',
                  color: generating ? GOLD : '#000', fontSize: 13, fontWeight: 800,
                  fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.07em',
                  textTransform: 'uppercase', opacity: generating ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {generating
                  ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><RefreshCw size={14} /></motion.span> Creating…</>
                  : <><Wand2 size={14} /> Create</>
                }
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={generating}
                onClick={() => handleCreate(true)}
                style={{
                  flex: 1, padding: '13px 0',
                  background: generating ? 'rgba(212,133,74,0.1)' : `linear-gradient(90deg, ${CRIMSON}, ${ROSE})`,
                  border: `1px solid rgba(192,57,90,0.5)`, borderRadius: 12, cursor: generating ? 'not-allowed' : 'pointer',
                  color: '#fff', fontSize: 13, fontWeight: 800,
                  fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.07em',
                  textTransform: 'uppercase', opacity: generating ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Headphones size={14} /> Instrumental
              </motion.button>
            </div>
          </motion.div>

          {/* ── Generation progress ── */}
          <AnimatePresence>
            {generating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  borderRadius: 16, padding: '20px 24px',
                  background: GOLD + '08', border: `1px solid ${GOLD}25`,
                  marginBottom: 20, textAlign: 'center',
                }}
              >
                <WaveformVisualizer playing bars={36} height={44} color={GOLD} />
                <motion.p
                  key={genStep}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ ...T, color: GOLD, fontSize: 13, fontWeight: 700, marginTop: 12, letterSpacing: '0.05em' }}
                >
                  {GEN_STEPS[genStep]}
                </motion.p>
                <p style={{ ...T, color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 }}>
                  {parsedTags.slice(0, 4).join(' · ') || 'chill'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Style Tags Chips ── */}
          <div style={{
            borderRadius: 20, background: BG2,
            border: '1px solid rgba(255,255,255,0.08)',
            padding: 20, marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Sparkles size={14} color={PINK} />
              <span style={{ ...T, fontSize: 12, fontWeight: 800, color: PINK, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Quick Style Tags
              </span>
            </div>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {STYLE_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(i)}
                  style={{
                    ...T, padding: '5px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    background: activeCategory === i ? cat.color + '25' : 'rgba(255,255,255,0.04)',
                    color: activeCategory === i ? cat.color : 'rgba(255,255,255,0.4)',
                    fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
                    border: `1px solid ${activeCategory === i ? cat.color + '55' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Tag chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {STYLE_CATEGORIES[activeCategory].tags.map(tag => {
                const isActive = parsedTags.includes(tag.toLowerCase());
                return (
                  <StyleChip
                    key={tag}
                    label={tag}
                    color={STYLE_CATEGORIES[activeCategory].color}
                    active={isActive}
                    onClick={() => isActive ? handleRemoveStyleTag(tag) : handleAddStyleTag(tag)}
                  />
                );
              })}
            </div>
          </div>

          {/* ── Trending styles (left panel desktop) ── */}
          <div style={{
            borderRadius: 20, background: BG2,
            border: '1px solid rgba(212,175,55,0.12)',
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Radio size={14} color={AMBER} />
              <span style={{ ...T, fontSize: 12, fontWeight: 800, color: AMBER, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Trending Now on SeeWhy LIVE
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TRENDING.map(item => (
                <motion.button
                  key={item.label}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setStyleInput(item.style); setMobileTab('create'); }}
                  style={{
                    background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)',
                    borderRadius: 12, padding: '12px 14px',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = AMBER + '40'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.12)'}
                >
                  <span style={{ fontSize: 22, marginBottom: 6 }}>{item.emoji}</span>
                  <span style={{ ...T, color: '#fff', fontSize: 13, fontWeight: 800, display: 'block', marginBottom: 2 }}>
                    {item.label}
                  </span>
                  <span style={{ ...T, color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{item.count}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* ════ RIGHT / LIBRARY PANEL ════ */}
        <div style={{
          flex: 1,
          minWidth: 0,
          display: mobileTab === 'library' ? 'block' : 'none',
        }}
          className="desktop-show-right"
        >
          {/* Library header */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ ...T, fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>My Library</span>
              <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
                {filteredTracks.length}/{tracks.length} tracks
              </span>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'Total', value: tracks.length, color: GOLD },
                { label: 'Liked', value: tracks.filter(t => t.liked).length, color: PINK },
                { label: 'Stream Ready', value: tracks.filter(t => t.streamReady).length, color: GREEN },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ ...T, fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input
                value={libSearch}
                onChange={e => setLibSearch(e.target.value)}
                placeholder="Search tracks, tags…"
                style={{ width: '100%', height: 34, padding: '0 12px 0 28px', fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: 8, outline: 'none', boxSizing: 'border-box', ...T }}
              />
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'all',         label: 'All',         color: GOLD },
                { id: 'liked',       label: '❤ Liked',     color: PINK },
                { id: 'streamready', label: '📡 Stream Ready', color: GREEN },
              ].map(f => (
                <button key={f.id} onClick={() => setLibFilter(f.id)}
                  style={{ ...T, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.12s', background: libFilter === f.id ? f.color + '20' : 'rgba(255,255,255,0.04)', border: `1px solid ${libFilter === f.id ? f.color + '55' : 'rgba(255,255,255,0.08)'}`, color: libFilter === f.id ? f.color : 'rgba(255,255,255,0.35)' }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Continue panel */}
          <AnimatePresence>
            {continueTrack && (
              <ContinuePanel
                track={continueTrack}
                onClose={() => setContinueTrack(null)}
                onGenerate={handleContinueGenerate}
              />
            )}
          </AnimatePresence>

          {/* Generating (library view) */}
          <AnimatePresence>
            {generating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  borderRadius: 16, padding: 18,
                  background: GOLD + '08', border: `1px solid ${GOLD}25`,
                  marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                <div style={{ flex: 1 }}>
                  <motion.p
                    key={genStep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ ...T, color: GOLD, fontSize: 13, fontWeight: 700, marginBottom: 8 }}
                  >
                    {GEN_STEPS[genStep]}
                  </motion.p>
                  <WaveformVisualizer playing bars={24} height={28} color={GOLD} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Track cards */}
          {filteredTracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 20, background: BG2, border: '1px solid rgba(255,255,255,0.06)' }}>
              <Music size={44} color="rgba(255,255,255,0.15)" style={{ marginBottom: 12 }} />
              <p style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: 700 }}>
                {tracks.length === 0 ? 'No tracks yet' : 'No tracks match your filter'}
              </p>
              <p style={{ ...T, color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 4 }}>
                {tracks.length === 0 ? 'Create your first AI track in the Create tab' : 'Try a different filter or search term'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredTracks.map(track => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isPlaying={playingId === track.id}
                  onPlay={() => togglePlay(track.id)}
                  onLike={() => toggleLike(track.id)}
                  onDelete={() => deleteTrack(track.id)}
                  onContinue={() => setContinueTrack(track)}
                  onRemix={() => remixTrack(track)}
                  onAddToStream={() => handleAddToStream(track)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ════ TRENDING TAB (mobile only) ════ */}
        <div style={{
          flex: 1,
          minWidth: 0,
          display: mobileTab === 'trending' ? 'block' : 'none',
        }}
          className="desktop-hide-trending"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Radio size={16} color={AMBER} />
            <span style={{ ...T, fontSize: 18, fontWeight: 900, color: '#fff' }}>
              Trending Now on SeeWhy LIVE
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {TRENDING.map(item => (
              <motion.button
                key={item.label}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { setStyleInput(item.style); setMobileTab('create'); }}
                style={{
                  background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)',
                  borderRadius: 16, padding: '20px 16px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 36, marginBottom: 10 }}>{item.emoji}</span>
                <span style={{ ...T, color: '#fff', fontSize: 15, fontWeight: 800, display: 'block', marginBottom: 4 }}>
                  {item.label}
                </span>
                <span style={{ ...T, color: AMBER, fontSize: 11, fontWeight: 700 }}>{item.count}</span>
              </motion.button>
            ))}
          </div>
        </div>

      </div>

      {/* ── Desktop CSS overrides ── */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-show-left { display: block !important; }
          .desktop-show-right { display: block !important; }
          .desktop-hide-trending { display: none !important; }
        }
      `}</style>

      {/* ── Toast ── */}
      <Toast message={toast.message} visible={toast.visible} />
      <SwanAIRecommendations roomId={null} currentLayout="ai" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={null} roomId={null} currentUser={null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}