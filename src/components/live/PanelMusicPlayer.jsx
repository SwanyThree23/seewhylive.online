import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

const BG = '#080B18';
const GOLD = '#D4AF37';
const PURPLE = '#a78bfa';
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

  return (
    <div
      className={className}
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        background: 'rgba(8,11,24,0.96)',
        borderTop: '1px solid rgba(212,175,55,0.15)',
        ...style,
      }}
    >
      {/* Music icon */}
      <span style={{ fontSize: 18, flexShrink: 0 }}>🎵</span>

      {/* Waveform */}
      <div style={{ flexShrink: 0 }}>
        <WaveformVisualizer
          playing={isPlaying && !!track}
          color={track ? GOLD : 'rgba(255,255,255,0.2)'}
          bars={16}
          height={28}
        />
      </div>

      {/* Track info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {track ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ ...T, color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                {track.emoji && `${track.emoji} `}{track.title}
              </span>
              {track.bpm && (
                <span style={{
                  ...T, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                  padding: '2px 6px', borderRadius: 999,
                  background: GOLD + '18', border: `1px solid ${GOLD}40`, color: GOLD,
                  whiteSpace: 'nowrap',
                }}>
                  {track.bpm} BPM
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
              {(track.tags || []).slice(0, 4).map(tag => (
                <span key={tag} style={{
                  ...T, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                  padding: '1px 6px', borderRadius: 999,
                  background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
                  color: PURPLE, textTransform: 'uppercase',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </>
        ) : (
          <span style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
            🎵 AI DJ — no track selected
          </span>
        )}
      </div>

      {/* Play/pause button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsPlaying(p => !p)}
        disabled={!track}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: `1px solid ${track ? GOLD + '60' : 'rgba(255,255,255,0.12)'}`,
          background: track ? (isPlaying ? GOLD + '22' : 'transparent') : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: track ? 'pointer' : 'default',
          flexShrink: 0,
          transition: 'all 0.2s',
        }}
      >
        {isPlaying
          ? <Pause size={14} color={track ? GOLD : 'rgba(255,255,255,0.2)'} />
          : <Play size={14} color={track ? GOLD : 'rgba(255,255,255,0.2)'} style={{ marginLeft: 2 }} />
        }
      </motion.button>
    </div>
  );
}
