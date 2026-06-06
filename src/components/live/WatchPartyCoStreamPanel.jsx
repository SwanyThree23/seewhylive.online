import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Volume2,
  Camera, Trash2, Plus, Tv2, Users, RefreshCw, Gamepad2,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const G       = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const BG      = '#080B18';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const C = {
  card:    'rgba(8,11,24,0.98)',
  border:  'rgba(212,175,55,0.15)',
  gold:    G,
  crimson: CRIMSON,
  pink:    PINK,
  bg:      BG,
  text:    '#F0E8D4',
  textM:   'rgba(240,232,212,0.60)',
  textD:   'rgba(240,232,212,0.28)',
  green:   '#6DBF7E',
  amber:   '#F59E0B',
  red:     '#EF4444',
  gray:    'rgba(240,232,212,0.10)',
};

// ── helpers ───────────────────────────────────────────────────────────────────
function parseYouTubeId(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function fmtTime(s) {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
}

function AvatarCircle({ name, size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg,${CRIMSON},${G})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.42,
      flexShrink: 0, ...T,
    }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

function SectionHeader({ children, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0 6px',
      borderBottom: `1px solid ${C.border}`,
      marginBottom: 8,
    }}>
      <span style={{
        ...T, color: G, fontWeight: 700, fontSize: 11,
        letterSpacing: 1.5, textTransform: 'uppercase',
      }}>
        {children}
      </span>
      {action}
    </div>
  );
}

function GoldBtn({ onClick, children, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: `linear-gradient(90deg,${CRIMSON},${G})`,
        border: 'none', borderRadius: 6, color: '#fff',
        padding: '5px 12px', cursor: 'pointer', fontSize: 12,
        fontWeight: 700, ...T, whiteSpace: 'nowrap', ...style,
      }}
    >
      {children}
    </button>
  );
}

function SmallBtn({ onClick, children, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: C.gray, border: `1px solid ${C.border}`,
        borderRadius: 5, color: C.text, padding: '3px 8px',
        cursor: 'pointer', fontSize: 11, fontWeight: 600, ...T, ...style,
      }}
    >
      {children}
    </button>
  );
}

const EMOJIS = ['🔥', '❤️', '😂', '😮', '👏'];

// ── Main component ────────────────────────────────────────────────────────────
export default function WatchPartyCoStreamPanel({ roomId, isHost, participants = [], currentUser }) {
  // Media queue
  const [queue, setQueue]         = useState([]);
  const [urlInput, setUrlInput]   = useState('');
  const [nowPlaying, setNowPlaying] = useState(null);
  const [queueIndex, setQueueIndex] = useState(-1);

  // Playback state
  const [playing, setPlaying]   = useState(false);
  const [elapsed, setElapsed]   = useState(0);
  const [volume, setVolume]     = useState(75);

  // Sync offsets
  const [syncOffsets, setSyncOffsets] = useState({});

  // Co-host control
  const [coHostControl, setCoHostControl]   = useState(false);
  const [controlledBy, setControlledBy]     = useState(null);

  // Reactions
  const [flyReactions, setFlyReactions]   = useState([]);
  const [recentReactions, setRecentReactions] = useState([]);
  const flyIdRef = useRef(0);

  // Timer
  const timerRef = useRef(null);

  // ── Playback timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing]);

  // ── Sync offset simulation ──────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const streamers = participants.filter(p => p.id !== currentUser?.id);
      if (!streamers.length) return;
      setSyncOffsets(prev => {
        const next = { ...prev };
        streamers.forEach(p => {
          if (next[p.id] === 0) return; // was manually synced
          next[p.id] = Math.round((Math.random() * 16 - 8) * 10) / 10;
        });
        return next;
      });
    }, 8000);
    return () => clearInterval(id);
  }, [participants, currentUser]);

  // ── Add to queue ────────────────────────────────────────────────────────────
  const addToQueue = useCallback(() => {
    const url = urlInput.trim();
    if (!url) return;
    if (queue.length >= 10) { toast.error('Queue is full (max 10)'); return; }

    const ytId = parseYouTubeId(url);
    const item = ytId
      ? { id: Date.now(), title: 'YouTube Video', url, type: 'youtube', thumb: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` }
      : { id: Date.now(), title: url.length > 40 ? url.slice(0, 40) + '…' : url, url, type: url.toLowerCase().includes('rtmp') ? 'rtmp' : 'custom', thumb: null };

    setQueue(q => [...q, item]);
    setUrlInput('');
    toast.success('Added to queue');
  }, [urlInput, queue.length]);

  const removeFromQueue = (id) => {
    setQueue(q => q.filter(i => i.id !== id));
    if (nowPlaying?.id === id) { setNowPlaying(null); setPlaying(false); setElapsed(0); }
  };

  const playItem = (item, idx) => {
    setNowPlaying(item);
    setQueueIndex(idx);
    setElapsed(0);
    setPlaying(true);
  };

  const prev = () => {
    if (queueIndex > 0) playItem(queue[queueIndex - 1], queueIndex - 1);
  };

  const next = () => {
    if (queueIndex < queue.length - 1) playItem(queue[queueIndex + 1], queueIndex + 1);
  };

  // ── Sync all ────────────────────────────────────────────────────────────────
  const syncAll = () => {
    setSyncOffsets(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { next[k] = 0; });
      return next;
    });
    toast.success('Syncing all guests to current timestamp…');
  };

  const syncGuest = (guestId, guestName) => {
    setSyncOffsets(prev => ({ ...prev, [guestId]: 0 }));
    toast.success(`Synced ${guestName}`);
  };

  // ── Reactions ───────────────────────────────────────────────────────────────
  const fireReaction = (emoji) => {
    const id = ++flyIdRef.current;
    setFlyReactions(r => [...r, { id, emoji }]);
    setRecentReactions(r => [{ id, emoji }, ...r].slice(0, 5));
    setTimeout(() => setFlyReactions(r => r.filter(x => x.id !== id)), 1300);
  };

  const streamers = participants.filter(p => p.id !== currentUser?.id);
  const coHostCandidates = participants.filter(p => p.isCoHost || p.role === 'cohost');

  return (
    <div style={{
      ...T,
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '14px 16px',
      maxHeight: 600,
      overflowY: 'auto',
      position: 'relative',
      color: C.text,
    }}>
      {/* Recent reactions strip (top-right) */}
      <div style={{
        position: 'absolute', top: 10, right: 12,
        display: 'flex', gap: 4, zIndex: 10,
      }}>
        <AnimatePresence>
          {recentReactions.map((r, i) => (
            <motion.span
              key={r.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                fontSize: 18, background: 'rgba(212,175,55,0.12)',
                borderRadius: 6, padding: '1px 4px',
              }}
            >
              {r.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Fly-up reaction animations */}
      <div style={{ position: 'absolute', bottom: 60, right: 16, zIndex: 20, pointerEvents: 'none' }}>
        <AnimatePresence>
          {flyReactions.map(r => (
            <motion.div
              key={r.id}
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -60, opacity: 0 }}
              exit={{}}
              transition={{ duration: 1.2 }}
              style={{ position: 'absolute', fontSize: 26 }}
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 1, color: G, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Tv2 size={16} color={G} /> Watch Party Co-Stream
      </div>

      {/* ── MEDIA QUEUE ─────────────────────────────────────────────────────── */}
      <SectionHeader>Media Queue</SectionHeader>

      {/* URL input row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <input
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addToQueue()}
          placeholder="YouTube URL or RTMP stream…"
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
            borderRadius: 6, color: C.text, padding: '6px 10px', fontSize: 12,
            outline: 'none', ...T,
          }}
        />
        <GoldBtn onClick={addToQueue} style={{ borderRadius: 6 }}>
          <Plus size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          Add
        </GoldBtn>
      </div>

      {/* Queue list */}
      {queue.length === 0 ? (
        <div style={{ color: C.textD, fontSize: 12, textAlign: 'center', padding: '10px 0' }}>
          Add a YouTube or RTMP link to get started
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {queue.map((item, idx) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: nowPlaying?.id === item.id ? 'rgba(212,175,55,0.08)' : C.gray,
              borderRadius: 7, padding: '5px 8px',
              border: nowPlaying?.id === item.id ? `1px solid ${C.gold}44` : '1px solid transparent',
            }}>
              {item.thumb
                ? <img src={item.thumb} alt="" style={{ width: 40, height: 30, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 40, height: 30, borderRadius: 4, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Camera size={14} color={C.textD} /></div>
              }
              <span style={{ flex: 1, fontSize: 11, color: C.text, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {item.title}
              </span>
              <SmallBtn onClick={() => playItem(item, idx)}>▶ Play Now</SmallBtn>
              <button onClick={() => removeFromQueue(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, padding: 2 }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── NOW PLAYING BAR ─────────────────────────────────────────────────── */}
      {nowPlaying && (
        <>
          <SectionHeader>Now Playing</SectionHeader>
          <div style={{ background: 'rgba(212,175,55,0.07)', borderRadius: 9, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {nowPlaying.thumb
                ? <img src={nowPlaying.thumb} alt="" style={{ width: 40, height: 30, borderRadius: 4, objectFit: 'cover' }} />
                : <Camera size={20} color={C.textD} />
              }
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {nowPlaying.title}
                </div>
                <div style={{ fontSize: 11, color: C.textM }}>
                  {nowPlaying.type === 'rtmp' ? '🔴 LIVE' : fmtTime(elapsed)}
                </div>
              </div>
            </div>
            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={prev} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textM, padding: 4 }}>
                <SkipBack size={16} />
              </button>
              <button onClick={() => setPlaying(p => !p)} style={{
                background: playing ? CRIMSON : G, border: 'none', borderRadius: 20,
                width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {playing ? <Pause size={14} color="#fff" /> : <Play size={14} color="#fff" />}
              </button>
              <button onClick={next} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textM, padding: 4 }}>
                <SkipForward size={16} />
              </button>
              <Volume2 size={13} color={C.textM} />
              <input
                type="range" min={0} max={100} value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                style={{ flex: 1, accentColor: G }}
              />
              <span style={{ fontSize: 10, color: C.textD, minWidth: 26 }}>{volume}%</span>
              <GoldBtn onClick={syncAll} style={{ fontSize: 10, padding: '3px 8px' }}>
                <RefreshCw size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                Sync All
              </GoldBtn>
            </div>
          </div>
        </>
      )}

      {/* ── PER-GUEST SYNC STATUS ────────────────────────────────────────────── */}
      {streamers.length > 0 && (
        <>
          <SectionHeader
            action={
              <button onClick={syncAll} style={{
                background: 'rgba(212,175,55,0.12)', border: `1px solid ${C.border}`,
                borderRadius: 20, color: G, fontSize: 10, fontWeight: 700,
                padding: '2px 10px', cursor: 'pointer', ...T,
              }}>
                Sync All
              </button>
            }
          >
            Guest Sync Status
          </SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            {streamers.map(p => {
              const offset = syncOffsets[p.id] ?? 0;
              const absOff = Math.abs(offset);
              const inSync = absOff < 2;
              const slightOff = absOff >= 2 && absOff <= 5;
              const badOff = absOff > 5;
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AvatarCircle name={p.name || p.user_name} size={20} />
                  <span style={{ flex: 1, fontSize: 11, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name || p.user_name || 'Guest'}
                  </span>
                  {inSync && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: 'rgba(109,191,126,0.15)', borderRadius: 4, padding: '1px 6px' }}>
                      IN SYNC
                    </span>
                  )}
                  {slightOff && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.amber, background: 'rgba(245,158,11,0.15)', borderRadius: 4, padding: '1px 6px' }}>
                      +{absOff.toFixed(1)}s
                    </span>
                  )}
                  {badOff && (
                    <>
                      <span style={{ fontSize: 10, fontWeight: 700, color: C.red, background: 'rgba(239,68,68,0.15)', borderRadius: 4, padding: '1px 6px' }}>
                        +{absOff.toFixed(1)}s
                      </span>
                      <SmallBtn onClick={() => syncGuest(p.id, p.name || p.user_name || 'Guest')} style={{ fontSize: 10, padding: '1px 6px', color: C.gold, borderColor: G }}>
                        Sync
                      </SmallBtn>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── CO-HOST PLAYER CONTROL ───────────────────────────────────────────── */}
      <SectionHeader>Co-host Player Control</SectionHeader>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: C.textM }}>Grant player control to co-host</span>
          <button
            onClick={() => { setCoHostControl(c => !c); if (coHostControl) setControlledBy(null); }}
            style={{
              width: 36, height: 20, borderRadius: 10,
              background: coHostControl ? G : 'rgba(255,255,255,0.1)',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: coHostControl ? 18 : 3,
              width: 14, height: 14, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>
        {coHostControl && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <select
              value={controlledBy || ''}
              onChange={e => setControlledBy(e.target.value || null)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`,
                borderRadius: 6, color: C.text, padding: '5px 8px', fontSize: 12, ...T,
              }}
            >
              <option value="">— Select co-host —</option>
              {(coHostCandidates.length ? coHostCandidates : participants).map(p => (
                <option key={p.id} value={p.id}>{p.name || p.user_name || p.id}</option>
              ))}
            </select>
            {controlledBy && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(212,175,55,0.08)', borderRadius: 6, padding: '5px 10px',
              }}>
                <Gamepad2 size={13} color={G} />
                <span style={{ fontSize: 11, color: G, fontWeight: 600 }}>
                  {(participants.find(p => p.id === controlledBy)?.name) || controlledBy} controls playback
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── REACTION FEED ───────────────────────────────────────────────────── */}
      <SectionHeader>Reaction Feed</SectionHeader>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 6, position: 'relative' }}>
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => fireReaction(emoji)}
            style={{
              fontSize: 22, background: C.gray, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
              transition: 'transform 0.1s',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.88)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
