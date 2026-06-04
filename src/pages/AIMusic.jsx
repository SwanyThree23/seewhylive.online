import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music, Play, Pause, Heart, Download, MoreHorizontal, Wand2,
  Mic2, Headphones, RefreshCw, Plus, X, ChevronRight, Zap,
  Sparkles, Radio
} from 'lucide-react';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BG      = '#080B18';
const BG2     = 'rgba(13,6,24,0.9)';
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#FF1564';
const CYAN    = '#00d4ff';
const PURPLE  = '#a78bfa';
const GREEN   = '#22c55e';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

// ── Shared input style ─────────────────────────────────────────────────────────
const inp = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(17,8,34,0.85)',
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
    color: CYAN,
    tags: ['Lo-Fi','Hip-Hop','Trap','R&B','Gospel','EDM','House','Drill','Afrobeats','Jazz','Ambient','Pop'],
  },
  {
    label: 'Mood',
    color: PINK,
    tags: ['Hype','Chill','Dark','Uplifting','Romantic','Aggressive','Melancholic','Euphoric'],
  },
  {
    label: 'Instruments',
    color: PURPLE,
    tags: ['808','Piano','Guitar','Violin','Drums','Brass','Synth','Choir','Bass','Flute'],
  },
  {
    label: 'Tempo',
    color: GOLD,
    tags: ['Slow (60-80)','Medium (90-110)','Fast (120-140)','Hyper (150+)'],
  },
];

// ── Genre → color mapping for album art ──────────────────────────────────────
function tagColor(tags) {
  const map = {
    'trap': `linear-gradient(135deg, #1a0010, ${CRIMSON})`,
    'lo-fi': `linear-gradient(135deg, #0d001f, ${PURPLE})`,
    'gospel': `linear-gradient(135deg, #1a0a00, #f97316)`,
    'afrobeats': `linear-gradient(135deg, #001a0d, ${GREEN})`,
    'edm': `linear-gradient(135deg, #001a20, ${CYAN})`,
    'hip-hop': `linear-gradient(135deg, #1a1a00, ${GOLD})`,
    'r&b': `linear-gradient(135deg, #0d001a, ${PINK})`,
    'jazz': `linear-gradient(135deg, #001a10, #38bdf8)`,
    'ambient': `linear-gradient(135deg, #00101a, #7dd3fc)`,
    'house': `linear-gradient(135deg, #1a0020, ${PURPLE})`,
    'drill': `linear-gradient(135deg, #1a0000, #ef4444)`,
    'pop': `linear-gradient(135deg, #1a0015, ${PINK})`,
  };
  for (const t of (tags || [])) {
    const k = t.toLowerCase();
    if (map[k]) return map[k];
  }
  return `linear-gradient(135deg, #0d0d1a, ${PURPLE})`;
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

// ── TrackCard ─────────────────────────────────────────────────────────────────
function TrackCard({ track, isPlaying, onPlay, onLike, onDelete, onContinue, onRemix }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [editingLyrics, setEditingLyrics] = useState(false);
  const [lyricsText, setLyricsText] = useState(track.lyrics || '');
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
                background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
                color: PURPLE, textTransform: 'uppercase',
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
                    background: 'rgba(13,6,24,0.98)', border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: 12, overflow: 'hidden', minWidth: 150,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}
                >
                  {[
                    { label: 'Remix', icon: RefreshCw, color: CYAN, action: () => { onRemix(); setMenuOpen(false); } },
                    { label: 'Continue', icon: ChevronRight, color: PURPLE, action: () => { onContinue(); setMenuOpen(false); } },
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
                background: lyricsOpen ? PURPLE + '22' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${lyricsOpen ? PURPLE + '55' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8, width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: lyricsOpen ? PURPLE : 'rgba(255,255,255,0.4)',
              }}
              title="View lyrics"
            >
              <Mic2 size={13} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Lyrics panel */}
      <AnimatePresence>
        {lyricsOpen && track.lyrics && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(167,139,250,0.15)' }}
          >
            <div style={{ padding: '14px 16px', background: 'rgba(167,139,250,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ ...T, fontSize: 11, color: PURPLE, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Lyrics
                </span>
                <button
                  onClick={() => setEditingLyrics(e => !e)}
                  style={{ ...T, background: 'none', border: 'none', cursor: 'pointer', color: CYAN, fontSize: 11, fontWeight: 700 }}
                >
                  {editingLyrics ? 'Done' : 'Edit'}
                </button>
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
        border: `1px solid ${PURPLE}55`,
        padding: 20, marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ ...T, color: PURPLE, fontSize: 14, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
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
          background: `linear-gradient(90deg, ${PURPLE}, ${CYAN})`,
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
            background: 'rgba(13,6,24,0.97)', border: `1px solid ${GOLD}55`,
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
  // Form state
  const [description, setDescription] = useState('');
  const [styleInput, setStyleInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [instrumental, setInstrumental] = useState(false);

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

  function handleCreate(forceInstrumental = false) {
    if (generating) return;
    setGenerating(true);
    const totalDelay = 2500 + Math.random() * 600;
    setTimeout(() => {
      const tags = parsedTags.length > 0 ? parsedTags : ['chill'];
      const isInstrumental = forceInstrumental || instrumental;
      const title = titleInput ||
        (tags[0] ? tags[0].charAt(0).toUpperCase() + tags[0].slice(1) : 'Track') +
        ' — AI Generated';
      const emojiMap = {
        trap:'🌑', 'lo-fi':'🎧', gospel:'🎺', afrobeats:'🌍',
        edm:'🎛️', 'hip-hop':'🎤', 'r&b':'💜', jazz:'🎷',
        ambient:'🌊', house:'🎹', drill:'💥', pop:'⭐',
        '808':'🥁', piano:'🎹', guitar:'🎸', choir:'🎶',
      };
      const emoji = emojiMap[tags[0]] || '🎵';
      const minutes = 2 + Math.floor(Math.random() * 2);
      const seconds = 10 + Math.floor(Math.random() * 50);
      const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      const newTrack = {
        id: `t${Date.now()}`,
        title,
        tags: tags.slice(0, 6),
        duration,
        emoji,
        playing: false,
        liked: false,
        likeCount: Math.floor(Math.random() * 20),
        streamReady: isInstrumental || Math.random() > 0.4,
        lyrics: isInstrumental ? null : generateMockLyrics(tags),
      };
      setTracks(prev => [newTrack, ...prev]);
      setGenerating(false);
      setTitleInput('');
      setDescription('');
      setMobileTab('library');
      showToast('🎵 Your track is ready!');
    }, totalDelay);
  }

  function generateMockLyrics(tags) {
    const mood = tags.find(t => ['dark','chill','hype','uplifting','romantic','aggressive'].includes(t)) || 'chill';
    const genre = tags[0] || 'music';
    return `[Verse 1]\nRiding the ${mood} wave, ${genre} in my veins\nSeeWhy LIVE is where the magic remains\nEvery beat a story, every note a dream\nNothing is impossible, or so it seems\n\n[Chorus]\n${genre.toUpperCase()}, can you feel it tonight\nThe music takes over, everything feels right\nLive on the stream, hearts locked in the flow\n${mood.charAt(0).toUpperCase() + mood.slice(1)} vibes only, watch the numbers grow\n\n[Verse 2]\nChat moving fast, the energy is real\nHitting every drop, you know how we feel\nAI composing what the soul demands\nSeeWhy LIVE, we're in your hands\n\n[Outro]\nFade into the ${mood} night\nThis music carries us just right`;
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
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, ${CRIMSON}, ${PURPLE})`,
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
          { id: 'library', label: `My Songs (${tracks.length})`, icon: Music, color: PURPLE },
          { id: 'trending', label: 'Trending', icon: Radio, color: CYAN },
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
                    color={CYAN}
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
                  background: instrumental ? PURPLE : 'rgba(255,255,255,0.12)',
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
              <span style={{ ...T, fontSize: 13, color: instrumental ? PURPLE : 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                Instrumental (no lyrics)
              </span>
            </div>

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
                  background: generating ? 'rgba(167,139,250,0.1)' : `linear-gradient(90deg, ${PURPLE}, #6d28d9)`,
                  border: `1px solid ${PURPLE}55`, borderRadius: 12, cursor: generating ? 'not-allowed' : 'pointer',
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
            border: '1px solid rgba(0,212,255,0.12)',
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Radio size={14} color={CYAN} />
              <span style={{ ...T, fontSize: 12, fontWeight: 800, color: CYAN, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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
                    background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)',
                    borderRadius: 12, padding: '12px 14px',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = CYAN + '40'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.12)'}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ ...T, fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>
              My Library
            </span>
            <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
              {tracks.length} track{tracks.length !== 1 ? 's' : ''}
            </span>
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
          {tracks.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              borderRadius: 20, background: BG2, border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <Music size={44} color="rgba(255,255,255,0.15)" style={{ marginBottom: 12 }} />
              <p style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: 700 }}>No tracks yet</p>
              <p style={{ ...T, color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 4 }}>
                Create your first AI track in the Create tab
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tracks.map(track => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isPlaying={playingId === track.id}
                  onPlay={() => togglePlay(track.id)}
                  onLike={() => toggleLike(track.id)}
                  onDelete={() => deleteTrack(track.id)}
                  onContinue={() => setContinueTrack(track)}
                  onRemix={() => remixTrack(track)}
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
            <Radio size={16} color={CYAN} />
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
                  background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)',
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
                <span style={{ ...T, color: CYAN, fontSize: 11, fontWeight: 700 }}>{item.count}</span>
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
    </div>
  );
}
