import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle } from 'lucide-react';

const BG = '#080B18';
const GOLD = '#D4AF37';
const PURPLE = '#7B5DA6';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function WaveformVisualizer({ playing, color = GOLD, bars = 16, height = 28 }) {
  const heights = useRef(
    Array.from({ length: bars }, () => 4 + Math.random() * 18)
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
          style={{
            width: 3,
            borderRadius: 2,
            background: color,
            opacity: 0.75 + (i % 3) * 0.08,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

export default function PanelMusicPlayer({ className, style }) {
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => { try { const s = localStorage.getItem('panel_volume'); return s !== null ? Number(s) : 75; } catch { return 75; } });
  const [showVolume, setShowVolume] = useState(false);
  const [shuffle, setShuffle] = useState(() => { try { return localStorage.getItem('panel_shuffle') === 'true'; } catch { return false; } });
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);

  useEffect(() => {
    function readTrack() {
      try {
        const raw = sessionStorage.getItem('seewhy_dj_track');
        const parsed = raw ? JSON.parse(raw) : null;
        setTrack(parsed);
      } catch {
        setTrack(null);
      }
    }
    readTrack();
    const iv = setInterval(readTrack, 4000);
    return () => clearInterval(iv);
  }, []);

  // Simulated progress ticker while playing
  useEffect(() => {
    if (!isPlaying || !track) return;
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { setIsPlaying(false); return 0; }
        return p + (100 / (track.duration || 180));
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [isPlaying, track]);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(8,11,24,0.96)',
        borderTop: '1px solid rgba(212,175,55,0.15)',
        ...style,
      }}
    >
      {/* Progress bar */}
      {track && (
        <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', flexShrink: 0, position: 'relative', cursor: 'pointer' }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            setProgress(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
          }}>
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }}
            style={{ height: '100%', background: GOLD, position: 'absolute', left: 0, top: 0 }} />
        </div>
      )}

      {/* Main row */}
      <div style={{ height: 60, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
        {/* Waveform */}
        <div style={{ flexShrink: 0 }}>
          <WaveformVisualizer playing={isPlaying && !!track} color={track ? GOLD : 'rgba(255,255,255,0.2)'} bars={12} height={24} />
        </div>

        {/* Track info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {track ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ ...T, color: '#fff', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                  {track.emoji && `${track.emoji} `}{track.title}
                </span>
                {track.bpm && (
                  <span style={{ ...T, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', padding: '1px 5px', borderRadius: 999, background: GOLD + '18', border: `1px solid ${GOLD}40`, color: GOLD, whiteSpace: 'nowrap' }}>
                    {track.bpm} BPM
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
                {(track.tags || []).slice(0, 3).map(tag => (
                  <span key={tag} style={{ ...T, fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 999, background: 'rgba(123,93,166,0.12)', border: '1px solid rgba(123,93,166,0.25)', color: PURPLE, textTransform: 'uppercase' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <span style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>🎵 AI DJ — no track selected</span>
          )}
        </div>

        {/* Transport controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setProgress(0); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: track ? 0.6 : 0.2 }}>
            <SkipBack size={12} color="rgba(255,255,255,0.7)" />
          </motion.button>

          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsPlaying(p => !p)} disabled={!track}
            style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${track ? GOLD + '60' : 'rgba(255,255,255,0.12)'}`, background: track ? (isPlaying ? GOLD + '22' : 'transparent') : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: track ? 'pointer' : 'default', transition: 'all 0.2s' }}>
            {isPlaying ? <Pause size={12} color={track ? GOLD : 'rgba(255,255,255,0.2)'} /> : <Play size={12} color={track ? GOLD : 'rgba(255,255,255,0.2)'} style={{ marginLeft: 2 }} />}
          </motion.button>

          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setProgress(0); setIsPlaying(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: track ? 0.6 : 0.2 }}>
            <SkipForward size={12} color="rgba(255,255,255,0.7)" />
          </motion.button>

          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShuffle(s => { const n = !s; try { localStorage.setItem('panel_shuffle', String(n)); } catch {} return n; })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: shuffle ? 1 : 0.3 }}>
            <Shuffle size={11} color={shuffle ? GOLD : 'rgba(255,255,255,0.7)'} />
          </motion.button>
        </div>

        {/* Volume */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowVolume(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.7 }}>
            <Volume2 size={13} color="rgba(255,255,255,0.7)" />
          </motion.button>
          <AnimatePresence>
            {showVolume && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                style={{ position: 'absolute', bottom: '110%', right: 0, background: 'rgba(8,11,24,0.97)', border: `1px solid ${GOLD}30`, borderRadius: 8, padding: '8px 10px', width: 110, zIndex: 60 }}>
                <p style={{ ...T, fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Volume {volume}%</p>
                <input type="range" min={0} max={100} value={volume} onChange={e => { const v = +e.target.value; setVolume(v); try { localStorage.setItem('panel_volume', String(v)); } catch {} }} style={{ width: '100%', accentColor: GOLD }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
