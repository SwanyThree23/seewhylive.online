import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Volume2,
  Camera, Trash2, Plus, Tv2, Gamepad2,
} from 'lucide-react';
import { toast } from 'sonner';
import NativeSelect from '@/components/shared/NativeSelect';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const G       = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const BG      = '#080B18';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const C = {
  card:    'rgba(8,11,24,0.98)',
  border:  'rgba(212,175,55,0.15)',
  text:    '#e8e8e8',
  muted:   '#888',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const YT_REGEX = /(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function parseQueueItem(url) {
  const ytMatch = url.match(YT_REGEX);
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      id: `yt-${id}-${Date.now()}`,
      title: 'YouTube Video',
      url,
      type: 'youtube',
      thumb: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
    };
  }
  const isRtmp = url.startsWith('rtmp://') || url.startsWith('rtmps://');
  return {
    id: `custom-${Date.now()}`,
    title: isRtmp ? 'RTMP Stream' : 'Custom Source',
    url,
    type: isRtmp ? 'rtmp' : 'custom',
    thumb: null,
  };
}

function fmt(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// ── Flying Reaction ───────────────────────────────────────────────────────────
function FlyReaction({ emoji, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -60, scale: 1.4 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      style={{
        position: 'absolute',
        bottom: 60,
        right: 24,
        fontSize: 28,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {emoji}
    </motion.div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ ...T, color: G, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        {children}
      </span>
      {action}
    </div>
  );
}

function IcoBtn({ disabled, onClick, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'none',
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.1)' : 'rgba(212,175,55,0.3)'}`,
        borderRadius: 6,
        padding: '5px 8px',
        color: disabled ? '#555' : G,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function WatchPartyCoStreamPanel({ roomId, isHost: _isHost, participants = [], currentUser }) {
  // ── Queue state ──────────────────────────────────────────────────────────────
  const [queue, setQueue]             = useState([]);
  const [urlInput, setUrlInput]       = useState('');
  const [nowPlaying, setNowPlaying]   = useState(null);
  const [queueHistory, setQueueHistory] = useState([]);

  // ── Playback ─────────────────────────────────────────────────────────────────
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume]   = useState(75);
  const intervalRef           = useRef(null);

  // ── Sync ─────────────────────────────────────────────────────────────────────
  const [syncOffsets, setSyncOffsets] = useState({});

  // ── Co-host control ──────────────────────────────────────────────────────────
  const [coHostControlEnabled, setCoHostControlEnabled] = useState(false);
  const [coHostControllerId, setCoHostControllerId]     = useState('');

  // ── Reactions ────────────────────────────────────────────────────────────────
  const [flyReactions, setFlyReactions]       = useState([]);
  const [recentReactions, setRecentReactions] = useState([]);
  const reactionIdRef = useRef(0);

  // ── Playback timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing]);

  // ── Sync offsets simulation ──────────────────────────────────────────────────
  useEffect(() => {
    function refreshOffsets() {
      if (!participants.length) return;
      const map = {};
      participants.forEach(p => {
        map[p.id] = Math.round((Math.random() * 16 - 8) * 10) / 10;
      });
      setSyncOffsets(map);
    }
    refreshOffsets();
    const id = setInterval(refreshOffsets, 8000);
    return () => clearInterval(id);
  }, [participants]);

  // ── Entity mutation ──────────────────────────────────────────────────────────
  const syncMutation = useMutation({
    mutationFn: (payload) =>
      base44.entities.WatchPartySync
        ? base44.entities.WatchPartySync.create(payload)
        : Promise.resolve(payload),
    onError: () => {},
  });

  // ── Queue actions ────────────────────────────────────────────────────────────
  const addToQueue = useCallback(() => {
    const url = urlInput.trim();
    if (!url) return;
    if (queue.length >= 10) { toast.error('Queue limit is 10 items'); return; }
    const item = parseQueueItem(url);
    setQueue(q => [...q, item]);
    setUrlInput('');
  }, [urlInput, queue.length]);

  const removeFromQueue = useCallback((id) => {
    setQueue(q => q.filter(i => i.id !== id));
    if (nowPlaying?.id === id) setNowPlaying(null);
  }, [nowPlaying]);

  const playNow = useCallback((item) => {
    if (nowPlaying) setQueueHistory(h => [...h, nowPlaying]);
    setNowPlaying(item);
    setElapsed(0);
    setPlaying(true);
  }, [nowPlaying]);

  const playPrev = useCallback(() => {
    if (!queueHistory.length) return;
    const prev = queueHistory[queueHistory.length - 1];
    if (nowPlaying) setQueue(q => [nowPlaying, ...q]);
    setQueueHistory(h => h.slice(0, -1));
    setNowPlaying(prev);
    setElapsed(0);
    setPlaying(true);
  }, [queueHistory, nowPlaying]);

  const playNext = useCallback(() => {
    if (!queue.length) return;
    const [next, ...rest] = queue;
    if (nowPlaying) setQueueHistory(h => [...h, nowPlaying]);
    setNowPlaying(next);
    setQueue(rest);
    setElapsed(0);
    setPlaying(true);
  }, [queue, nowPlaying]);

  const syncAll = useCallback(() => {
    toast.success('Syncing all guests to current timestamp…');
    setSyncOffsets(o => {
      const reset = {};
      Object.keys(o).forEach(k => { reset[k] = 0; });
      return reset;
    });
    syncMutation.mutate({ roomId, action: 'syncAll', timestamp: elapsed });
  }, [elapsed, roomId, syncMutation]);

  const syncGuest = useCallback((guestId) => {
    toast.success('Guest synced to current timestamp');
    setSyncOffsets(o => ({ ...o, [guestId]: 0 }));
  }, []);

  // ── Reactions ────────────────────────────────────────────────────────────────
  const fireReaction = useCallback((emoji) => {
    const id = ++reactionIdRef.current;
    setFlyReactions(r => [...r, { id, emoji }]);
    setRecentReactions(r => [...r.slice(-4), emoji]);
  }, []);

  const removeFlyReaction = useCallback((id) => {
    setFlyReactions(r => r.filter(x => x.id !== id));
  }, []);

  const streamingParticipants = participants.filter(p => p.id !== currentUser?.id);
  const coHostController = streamingParticipants.find(p => p.id === coHostControllerId);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        ...T,
        position: 'relative',
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        maxHeight: 600,
        overflowY: 'auto',
        color: C.text,
      }}
    >
      {/* Flying reactions */}
      <AnimatePresence>
        {flyReactions.map(r => (
          <FlyReaction key={r.id} emoji={r.emoji} onDone={() => removeFlyReaction(r.id)} />
        ))}
      </AnimatePresence>

      {/* Recent reactions strip */}
      {recentReactions.length > 0 && (
        <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', gap: 4, zIndex: 10 }}>
          {recentReactions.map((e, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                fontSize: 18,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '2px 5px',
              }}
            >
              {e}
            </motion.span>
          ))}
        </div>
      )}

      {/* ══ MEDIA QUEUE ══ */}
      <section>
        <SectionHeader>Media Queue ({queue.length}/10)</SectionHeader>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addToQueue()}
            placeholder="YouTube URL or RTMP link…"
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              padding: '6px 10px',
              color: C.text,
              fontSize: 13,
              ...T,
              outline: 'none',
            }}
          />
          <button
            onClick={addToQueue}
            style={{
              background: G,
              border: 'none',
              borderRadius: 7,
              padding: '6px 12px',
              color: BG,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              ...T,
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {queue.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '14px 0' }}>
            Add a YouTube or RTMP link to get started
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <AnimatePresence>
              {queue.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: nowPlaying?.id === item.id ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    padding: '6px 8px',
                    border: nowPlaying?.id === item.id ? `1px solid ${G}30` : '1px solid transparent',
                  }}
                >
                  {item.thumb ? (
                    <img
                      src={item.thumb}
                      alt=""
                      style={{ width: 48, height: 34, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: 48, height: 34, background: 'rgba(255,255,255,0.06)',
                      borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Camera size={16} color={C.muted} />
                    </div>
                  )}
                  <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: C.muted, marginRight: 4 }}>{idx + 1}.</span>
                    {item.title}
                    <span style={{
                      marginLeft: 6, fontSize: 10,
                      color: item.type === 'youtube' ? '#ff4444' : G,
                      border: `1px solid ${item.type === 'youtube' ? '#ff4444' : G}40`,
                      borderRadius: 3, padding: '1px 4px', textTransform: 'uppercase',
                    }}>
                      {item.type}
                    </span>
                  </span>
                  <button
                    onClick={() => playNow(item)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: G, fontSize: 12, ...T, padding: '2px 6px' }}
                  >
                    ▶ Play Now
                  </button>
                  <button
                    onClick={() => removeFromQueue(item.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4444', padding: 2 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* ══ NOW PLAYING ══ */}
      <AnimatePresence>
        {nowPlaying && (
          <motion.section
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              background: 'rgba(212,175,55,0.06)',
              border: `1px solid ${G}30`,
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            <SectionHeader>Now Playing</SectionHeader>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {nowPlaying.thumb ? (
                <img src={nowPlaying.thumb} alt="" style={{ width: 40, height: 28, objectFit: 'cover', borderRadius: 4 }} />
              ) : (
                <div style={{
                  width: 40, height: 28, background: 'rgba(255,255,255,0.06)',
                  borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Tv2 size={14} color={C.muted} />
                </div>
              )}
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nowPlaying.title}
              </span>
              <span style={{ fontSize: 12, color: nowPlaying.type === 'rtmp' ? PINK : G, fontWeight: 700, letterSpacing: 1 }}>
                {nowPlaying.type === 'rtmp' ? '● LIVE' : fmt(elapsed)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IcoBtn disabled={!queueHistory.length} onClick={playPrev}><SkipBack size={16} /></IcoBtn>
              <button
                onClick={() => setPlaying(p => !p)}
                style={{
                  background: G, border: 'none', borderRadius: '50%',
                  width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: BG, flexShrink: 0,
                }}
              >
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <IcoBtn disabled={!queue.length} onClick={playNext}><SkipForward size={16} /></IcoBtn>

              <Volume2 size={14} color={C.muted} style={{ marginLeft: 6 }} />
              <input
                type="range" min={0} max={100} value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                style={{ flex: 1, accentColor: G, height: 4 }}
              />
              <span style={{ fontSize: 11, color: C.muted, width: 26, textAlign: 'right' }}>{volume}</span>

              <button
                onClick={syncAll}
                style={{
                  background: `${CRIMSON}cc`, border: 'none', borderRadius: 6,
                  padding: '4px 10px', color: '#fff', fontSize: 11, cursor: 'pointer', ...T,
                  marginLeft: 6, fontWeight: 700,
                }}
              >
                Sync All
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ══ GUEST SYNC STATUS ══ */}
      {streamingParticipants.length > 0 && (
        <section>
          <SectionHeader
            action={
              <button
                onClick={syncAll}
                style={{
                  background: 'none', border: `1px solid ${G}50`, borderRadius: 10,
                  padding: '2px 8px', color: G, fontSize: 10, cursor: 'pointer', ...T,
                }}
              >
                Sync All
              </button>
            }
          >
            Guest Sync Status
          </SectionHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {streamingParticipants.map(p => {
              const offset = syncOffsets[p.id] ?? 0;
              const abs    = Math.abs(offset);
              let badgeColor = '#22c55e';
              let badgeText  = 'IN SYNC';
              let showSync   = false;
              if (abs >= 2 && abs <= 5) {
                badgeColor = '#f59e0b';
                badgeText  = `${offset > 0 ? '+' : ''}${offset.toFixed(1)}s`;
              } else if (abs > 5) {
                badgeColor = '#ef4444';
                badgeText  = `${offset > 0 ? '+' : ''}${offset.toFixed(1)}s`;
                showSync   = true;
              }
              const name    = p.name || p.user_name || p.id;
              const initial = (name[0] || '?').toUpperCase();

              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${CRIMSON}, ${G})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {initial}
                  </div>
                  <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: badgeColor,
                    border: `1px solid ${badgeColor}50`, borderRadius: 8, padding: '1px 6px', letterSpacing: 0.5,
                  }}>
                    {badgeText}
                  </span>
                  {showSync && (
                    <button
                      onClick={() => syncGuest(p.id)}
                      style={{
                        background: 'none', border: `1px solid #ef444450`, borderRadius: 6,
                        padding: '1px 7px', color: '#ef4444', fontSize: 10, cursor: 'pointer', ...T,
                      }}
                    >
                      Sync
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ══ CO-HOST PLAYER CONTROL ══ */}
      <section>
        <SectionHeader>Co-host Player Control</SectionHeader>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            onClick={() => setCoHostControlEnabled(v => !v)}
            style={{
              width: 38, height: 20, borderRadius: 10,
              background: coHostControlEnabled ? G : 'rgba(255,255,255,0.15)',
              position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 2,
              left: coHostControlEnabled ? 20 : 2,
              width: 16, height: 16, borderRadius: '50%',
              background: coHostControlEnabled ? BG : '#888',
              transition: 'left 0.2s',
            }} />
          </div>
          <span style={{ fontSize: 13, color: C.text }}>Grant player control to co-host</span>
        </div>

        {coHostControlEnabled && streamingParticipants.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NativeSelect
              value={coHostControllerId}
              onChange={val => setCoHostControllerId(val)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`,
                borderRadius: 7, padding: '5px 8px', color: C.text, fontSize: 12, ...T,
                flex: 1, outline: 'none',
              }}
              options={[{value:'',label:'Select co-host…'},...streamingParticipants.map(p => ({value: p.id, label: p.name || p.user_name || p.id}))]}
            />

            {coHostController && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: `${G}18`, border: `1px solid ${G}40`,
                borderRadius: 8, padding: '3px 10px',
              }}>
                <Gamepad2 size={12} color={G} />
                <span style={{ fontSize: 11, color: G }}>
                  Player controlled by {coHostController.name || coHostController.user_name}
                </span>
              </div>
            )}
          </div>
        )}

        {coHostControlEnabled && coHostController && (
          <div style={{ marginTop: 8, fontSize: 12, color: G, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Gamepad2 size={12} />
            🎮 {coHostController.name || coHostController.user_name} controls playback
          </div>
        )}
      </section>

      {/* ══ REACTION FEED ══ */}
      <section>
        <SectionHeader>Reactions</SectionHeader>
        <div style={{ display: 'flex', gap: 10 }}>
          {['🔥', '❤️', '😂', '😮', '👏'].map(emoji => (
            <button
              key={emoji}
              onClick={() => fireReaction(emoji)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 20,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${G}20`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}