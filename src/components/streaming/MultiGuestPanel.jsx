import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Maximize2, Minimize2, Mic, MicOff, Video, VideoOff, Radio,
  Swords, Users, Pin, PinOff, Shield, ShieldOff, Wifi, WifiOff,
  LayoutGrid, LayoutList, Star, Hand, Settings, Signal, BarChart2,
  Zap, Crown, Eye, EyeOff, MoreVertical, X, Tv, Volume2, AlignJustify,
  ChevronLeft, ChevronRight, Cast,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import GuestRTMPPanel from '@/components/streaming/GuestRTMPPanel';
import GreenroomQueue from '@/components/streaming/GreenroomQueue';

const G       = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const LAYOUT_PRESETS = [
  { id: 'list',        label: 'List',   icon: AlignJustify },
  { id: 'grid',        label: 'Grid',   icon: LayoutGrid   },
  { id: 'spotlight',   label: 'Focus',  icon: Maximize2    },
  { id: 'broadcast',   label: '1+5',    icon: LayoutList   },
  { id: 'battle',      label: 'Battle', icon: Swords       },
  { id: 'watch_party', label: 'Watch',  icon: Tv           },
];

function qualityColor(q) {
  if (q === 'excellent') return '#22c55e';
  if (q === 'good')      return G;
  if (q === 'warning')   return '#f59e0b';
  return '#ef4444';
}

function useSimulatedHealth(participantId, isStreaming) {
  const [health, setHealth] = useState({ bitrate: 0, latency: 0, quality: 'good', fps: 30 });
  const ref = useRef(null);
  useEffect(() => {
    if (!isStreaming) { setHealth({ bitrate: 0, latency: 0, quality: 'offline', fps: 0 }); return; }
    const tick = () => {
      const bitrate = 1800 + Math.round((Math.random() - 0.5) * 600);
      const latency = 45 + Math.round(Math.random() * 80);
      const quality = latency > 200 ? 'warning' : latency > 120 ? 'good' : 'excellent';
      setHealth({ bitrate, latency, quality, fps: bitrate > 1200 ? 30 : 24 });
    };
    tick();
    ref.current = setInterval(tick, 4000);
    return () => clearInterval(ref.current);
  }, [participantId, isStreaming]);
  return health;
}

/* ─── Audio level hook ─────────────────────────────────────────────────── */
function useAudioLevel(id, streaming) {
  const [level, setLevel] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!streaming) { setLevel(0); return; }
    const tick = () => {
      // Simulate: 70% chance of speaking, random burst
      const speaking = Math.random() > 0.3;
      setLevel(speaking ? 20 + Math.floor(Math.random() * 80) : Math.floor(Math.random() * 15));
    };
    tick();
    ref.current = setInterval(tick, 500);
    return () => clearInterval(ref.current);
  }, [id, streaming]);
  return level;
}

/* ─── GuestTile ─────────────────────────────────────────────────────────── */
function GuestTile({ participant, isSpotlit, onSpotlight, compact, isHost, roomId, raisedHands = new Set(), onPromote, onMute, onKick, onVideoToggle, streamRef }) {
  const [showRTMP, setShowRTMP]     = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [vidOff, setVidOff]         = useState(false);
  const [tileVolume, setTileVolume] = useState(100);
  const health     = useSimulatedHealth(participant?.id, participant?.is_streaming);
  const audioLevel = useAudioLevel(participant?.id, participant?.is_streaming);
  const isRaised   = raisedHands.has(participant?.user_id);
  const isCoHost   = participant?.role === 'co-host';
  const isHostP    = participant?.role === 'host';
  const videoRef   = useRef(null);

  useEffect(() => {
    if (videoRef.current && streamRef) videoRef.current.srcObject = streamRef;
  }, [streamRef]);

  if (!participant) return null;

  const speaking  = audioLevel > 40;
  const qColor    = speaking ? '#22c55e' : qualityColor(health.quality);
  const ringColor = speaking ? '#22c55e' : (participant.is_streaming ? qualityColor(health.quality) : 'rgba(255,255,255,0.08)');

  // 3-bar equalizer heights based on audio level
  const b = audioLevel / 100;
  const barH1 = audioLevel > 20 ? Math.max(4, Math.round(b * 20 * 0.7)) : 4;
  const barH2 = audioLevel > 20 ? Math.max(4, Math.round(b * 20 * 1.0)) : 4;
  const barH3 = audioLevel > 20 ? Math.max(4, Math.round(b * 20 * 0.6)) : 4;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className={`relative group ${compact ? 'h-full' : ''}`}
      style={{ userSelect: 'none' }}
    >
      {/* Quality ring glow */}
      <div style={{
        position: 'absolute', inset: -2, borderRadius: 10, pointerEvents: 'none', zIndex: 0,
        boxShadow: participant.is_streaming ? `0 0 16px ${ringColor}55` : 'none',
        border: `2px solid ${participant.is_streaming ? ringColor + '70' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10,
      }} />

      <div style={{
        background: '#1a0d1f',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        height: isSpotlit ? '100%' : compact ? '100%' : undefined,
        aspectRatio: (!isSpotlit && !compact) ? '16/9' : undefined,
        zIndex: 1,
      }}>
        {/* Video / Avatar */}
        <div className="relative w-full h-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#1a0d1f,#0d0614)' }}>

          {streamRef && !vidOff ? (
            <video ref={videoRef} autoPlay muted playsInline
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: isSpotlit ? 96 : compact ? 36 : 64,
              height: isSpotlit ? 96 : compact ? 36 : 64,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${CRIMSON}, #3a0015)`,
              border: `2px solid ${isHostP ? G : isCoHost ? '#D4AF37' : 'rgba(255,255,255,0.15)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isSpotlit ? 32 : compact ? 14 : 20,
              color: G, fontWeight: 900, ...T,
              boxShadow: isHostP ? `0 0 20px ${G}50` : isCoHost ? '0 0 16px rgba(212,175,55,0.4)' : 'none',
            }}>
              {participant.user_avatar
                ? <img src={participant.user_avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : (participant.user_name || '?')[0].toUpperCase()}
            </div>
          )}

          {/* LIVE badge */}
          {participant.is_streaming && (
            <div style={{
              position: 'absolute', top: 6, right: 6,
              background: '#dc2626', color: '#fff', fontSize: 9, fontWeight: 900,
              padding: '2px 6px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 3, ...T,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite' }} />
              LIVE
            </div>
          )}

          {/* Raised hand */}
          {isRaised && (
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              style={{
                position: 'absolute', top: 6, left: 6,
                background: G, color: '#000', fontSize: 14, borderRadius: '50%',
                width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✋
            </motion.div>
          )}

          {/* Host / Co-host crown */}
          {!compact && (isHostP || isCoHost) && (
            <div style={{
              position: 'absolute', top: 6, left: isRaised ? 34 : 6,
              background: isHostP ? `${G}22` : 'rgba(212,175,55,0.15)',
              border: `1px solid ${isHostP ? G + '60' : 'rgba(212,175,55,0.4)'}`,
              color: isHostP ? G : '#D4AF37', fontSize: 9, fontWeight: 900,
              padding: '2px 5px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2, ...T,
            }}>
              {isHostP ? <Crown style={{ width: 8, height: 8 }} /> : <Shield style={{ width: 8, height: 8 }} />}
              {isHostP ? 'HOST' : 'CO-HOST'}
            </div>
          )}

          {/* Audio level equalizer — bottom left, when audioLevel > 20 */}
          {audioLevel > 20 && (
            <div style={{
              position: 'absolute', bottom: compact ? 18 : 28, left: 4,
              display: 'flex', alignItems: 'flex-end', gap: 2, height: 20,
              pointerEvents: 'none',
            }}>
              <div style={{ width: 3, height: barH1, background: '#22c55e', borderRadius: 2, transition: 'height 0.15s ease' }} />
              <div style={{ width: 3, height: barH2, background: '#22c55e', borderRadius: 2, transition: 'height 0.15s ease' }} />
              <div style={{ width: 3, height: barH3, background: '#22c55e', borderRadius: 2, transition: 'height 0.15s ease' }} />
            </div>
          )}

          {/* Health bar bottom (non-compact) */}
          {!compact && participant.is_streaming && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
              padding: '16px 8px 6px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...T, color: '#fff', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {participant.user_name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: qColor }} />
                    <span style={{ ...T, color: qColor, fontSize: 9, fontWeight: 700 }}>
                      {health.bitrate} kbps · {health.latency}ms
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {participant.is_audio_enabled === false && <MicOff style={{ width: 10, height: 10, color: '#ef4444' }} />}
                  {participant.is_video_enabled === false && <VideoOff style={{ width: 10, height: 10, color: '#ef4444' }} />}
                </div>
              </div>
            </div>
          )}

          {compact && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', background: 'rgba(0,0,0,0.7)', padding: '2px 0' }}>
              <p style={{ ...T, color: '#fff', fontSize: 8, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>
                {(participant.user_name || '?').split(' ')[0]}
              </p>
            </div>
          )}

          {/* Host controls overlay (hover) */}
          {isHost && !compact && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-between p-2" style={{ pointerEvents: 'none' }}>
              <div style={{ display: 'flex', gap: 4, pointerEvents: 'all' }}>
                <TileBtn icon={isSpotlit ? Minimize2 : Maximize2} title={isSpotlit ? 'Un-spotlight' : 'Spotlight'}
                  onClick={() => onSpotlight(participant.id)} color={G} />
                {!isHostP && <TileBtn icon={isCoHost ? ShieldOff : Shield} title={isCoHost ? 'Remove Co-host' : 'Make Co-host'}
                  onClick={() => onPromote(participant)} color="#D4AF37" />}
              </div>
              <div style={{ display: 'flex', gap: 4, pointerEvents: 'all' }}>
                <TileBtn icon={Radio} title="RTMP destinations" onClick={() => { setShowRTMP(v => !v); setShowMenu(false); }}
                  color={showRTMP ? G : 'rgba(255,255,255,0.6)'} active={showRTMP} />
                <TileBtn icon={MoreVertical} title="More options" onClick={() => setShowMenu(v => !v)} />
              </div>
            </div>
          )}

          {/* Kebab menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                style={{
                  position: 'absolute', top: 36, right: 6, zIndex: 20,
                  background: '#0d0614', border: `1px solid ${G}30`,
                  borderRadius: 8, padding: '4px 0', minWidth: 160,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                }}
              >
                {/* Volume slider row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}>
                  <Volume2 style={{ width: 11, height: 11, color: G, flexShrink: 0 }} />
                  <input
                    type="range" min={0} max={100} value={tileVolume}
                    onChange={e => setTileVolume(Number(e.target.value))}
                    style={{ flex: 1, accentColor: G, cursor: 'pointer' }}
                  />
                  <span style={{ ...T, color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, width: 28, textAlign: 'right' }}>
                    {tileVolume}%
                  </span>
                </div>

                {[
                  { label: 'Mute Audio', icon: MicOff, action: () => { onMute(participant); setShowMenu(false); } },
                  { label: vidOff ? 'Show Video' : 'Hide Video', icon: vidOff ? Video : VideoOff, action: () => { setVidOff(v => !v); onVideoToggle?.(participant); setShowMenu(false); } },
                  { label: 'RTMP Setup', icon: Radio, action: () => { setShowRTMP(v => !v); setShowMenu(false); } },
                  { label: 'Kick Guest', icon: X, action: () => { onKick(participant); setShowMenu(false); }, danger: true },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '7px 12px', background: 'none', border: 'none',
                      color: item.danger ? '#ef4444' : 'rgba(255,255,255,0.8)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', ...T,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <item.icon style={{ width: 11, height: 11 }} />
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RTMP Panel */}
      <AnimatePresence>
        {showRTMP && !compact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-1.5"
          >
            <GuestRTMPPanel participantId={participant.id} userId={participant.user_id || participant.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TileBtn({ icon: Icon, title, onClick, color = 'rgba(255,255,255,0.7)', active = false }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 26, height: 26, background: active ? `${color}22` : 'rgba(0,0,0,0.55)',
      border: `1px solid ${active ? color + '60' : 'rgba(255,255,255,0.15)'}`,
      borderRadius: 5, cursor: 'pointer', color, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon style={{ width: 11, height: 11 }} />
    </button>
  );
}

/* ─── WatchPartyLayout ──────────────────────────────────────────────────── */
function WatchPartyLayout({ speakers, isHost, roomId }) {
  const [mediaUrl, setMediaUrl] = useState('');
  const [playing, setPlaying]   = useState(false);
  const [elapsed, setElapsed]   = useState(0);
  const tickRef    = useRef(null);
  const offsetMapRef = useRef({});

  // Initialize stable per-speaker sync offsets once
  speakers.forEach(p => {
    if (offsetMapRef.current[p.id] === undefined) {
      offsetMapRef.current[p.id] = Math.round((Math.random() - 0.5) * 12); // ±6s
    }
  });

  useEffect(() => {
    if (playing) {
      tickRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(tickRef.current);
    }
    return () => clearInterval(tickRef.current);
  }, [playing]);

  const isBlob = mediaUrl.startsWith('blob:') || mediaUrl.startsWith('stream:');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      {/* 16:9 video area */}
      <div style={{ flex: '0 0 auto', position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0a0612', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        {isBlob ? (
          <video src={mediaUrl} autoPlay playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Tv style={{ width: 40, height: 40, color: 'rgba(255,255,255,0.15)' }} />
            <p style={{ ...T, color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700 }}>Shared Screen</p>
            <input
              placeholder="Paste media URL…"
              value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6, padding: '6px 12px', color: '#fff', fontSize: 11, outline: 'none',
                width: '60%', textAlign: 'center', ...T,
              }}
            />
            {mediaUrl && (
              <button onClick={() => setPlaying(true)} style={{
                ...T, background: `linear-gradient(90deg,${CRIMSON},${G})`, color: '#fff', border: 'none',
                borderRadius: 6, padding: '5px 14px', fontSize: 11, fontWeight: 900, cursor: 'pointer',
              }}>
                ▶ Play
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sync controls row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 6, padding: '5px 10px',
      }}>
        <span style={{ ...T, color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>
          ▶ {elapsed}s elapsed
        </span>
        <button onClick={() => setPlaying(v => !v)} style={{
          ...T, background: `${G}15`, border: `1px solid ${G}35`, color: G,
          borderRadius: 5, padding: '3px 10px', fontSize: 10, fontWeight: 900, cursor: 'pointer',
        }}>
          {playing ? '⏸' : '▶'}
        </button>
        <button onClick={() => toast.success('Synced all guests!')} style={{
          ...T, background: `${PINK}15`, border: `1px solid ${PINK}35`, color: PINK,
          borderRadius: 5, padding: '3px 10px', fontSize: 10, fontWeight: 900, cursor: 'pointer', marginLeft: 'auto',
        }}>
          Sync All Guests
        </button>
      </div>

      {/* Speaker strip */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, flexShrink: 0 }}>
        {speakers.map(p => {
          const offset = offsetMapRef.current[p.id] ?? 0;
          return (
            <div key={p.id} style={{ position: 'relative', flexShrink: 0, height: 80, minWidth: 60 }}>
              <GuestTile participant={p} isSpotlit={false} compact isHost={isHost} roomId={roomId}
                onSpotlight={() => {}} onPromote={() => {}} onMute={() => {}} onKick={() => {}} onVideoToggle={() => {}} />
              {/* Sync offset badge */}
              <div style={{
                position: 'absolute', bottom: 2, right: 2,
                background: offset === 0 ? '#22c55e' : 'rgba(245,158,11,0.9)',
                borderRadius: 4, padding: '1px 4px',
                fontSize: 8, fontWeight: 900, color: '#fff', ...T,
              }}>
                {offset > 0 ? `+${offset}s` : offset === 0 ? '0s' : `${offset}s`}
              </div>
            </div>
          );
        })}
        {speakers.length === 0 && (
          <p style={{ ...T, color: 'rgba(255,255,255,0.2)', fontSize: 11, padding: '24px 0' }}>No guests on stage</p>
        )}
      </div>
    </div>
  );
}

/* ─── BattlePanel ───────────────────────────────────────────────────────── */
function BattlePanel({ participants, roomId, isHost }) {
  const speakers = participants.filter(p => ['host','co-host','speaker','guest'].includes(p.role));

  // Team setup state
  const [teamAName, setTeamAName] = useState('Team A');
  const [teamBName, setTeamBName] = useState('Team B');
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [unassigned, setUnassigned] = useState(speakers);

  // Duration + prize + series
  const [battleDuration, setBattleDuration] = useState(180);
  const [prizePool, setPrizePool] = useState('');
  const [maxRounds, setMaxRounds] = useState(1);
  const [roundWinsA, setRoundWinsA] = useState(0);
  const [roundWinsB, setRoundWinsB] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [battleHistory, setBattleHistory] = useState([]);

  const [votesA, setVotesA] = useState(50);
  const [votesB, setVotesB] = useState(50);
  const [phase, setPhase]   = useState('ready'); // 'ready' | 'countdown' | 'live' | 'ended'
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed]     = useState(0);

  const BATTLE_SECS = battleDuration;
  const timerRef = useRef(null);
  const voteRef  = useRef(null);

  const assignParticipant = (p) => {
    setUnassigned(prev => prev.filter(x => x.id !== p.id));
    if (teamA.length <= teamB.length) {
      setTeamA(prev => [...prev, p]);
    } else {
      setTeamB(prev => [...prev, p]);
    }
  };

  const autoSplit = () => {
    const mid = Math.ceil(speakers.length / 2);
    setTeamA(speakers.slice(0, mid));
    setTeamB(speakers.slice(mid));
    setUnassigned([]);
  };

  const unassignFromA = (p) => {
    setTeamA(prev => prev.filter(x => x.id !== p.id));
    setUnassigned(prev => [...prev, p]);
  };
  const unassignFromB = (p) => {
    setTeamB(prev => prev.filter(x => x.id !== p.id));
    setUnassigned(prev => [...prev, p]);
  };

  const startBattle = () => {
    setPhase('countdown');
    setCountdown(3);
    let c = 3;
    const t = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(t);
        setPhase('live');
        setElapsed(0);
        timerRef.current = setInterval(() => {
          setElapsed(e => {
            if (e >= BATTLE_SECS - 1) {
              clearInterval(timerRef.current);
              clearInterval(voteRef.current);
              setPhase('ended');
            }
            return e + 1;
          });
        }, 1000);
        voteRef.current = setInterval(() => {
          setVotesA(v => {
            const drift = (Math.random() - 0.48) * 1.5;
            const next = Math.max(10, Math.min(90, v + drift));
            setVotesB(100 - next);
            return next;
          });
        }, 800);
      }
    }, 1000);
  };

  const endBattle = () => {
    clearInterval(timerRef.current);
    clearInterval(voteRef.current);
    const winnerA = votesA > votesB;
    const newWinsA = roundWinsA + (winnerA ? 1 : 0);
    const newWinsB = roundWinsB + (winnerA ? 0 : 1);
    setRoundWinsA(newWinsA);
    setRoundWinsB(newWinsB);
    setBattleHistory(prev => [...prev, {
      round: currentRound,
      winner: winnerA ? teamAName : teamBName,
      pctA: votesA.toFixed(0),
      pctB: votesB.toFixed(0),
    }]);
    setPhase('ended');
  };

  const resetBattle = () => {
    clearInterval(timerRef.current);
    clearInterval(voteRef.current);
    setPhase('ready');
    setVotesA(50);
    setVotesB(50);
    setElapsed(0);
  };

  const nextRound = () => {
    setCurrentRound(r => r + 1);
    setVotesA(50);
    setVotesB(50);
    setElapsed(0);
    setPhase('ready');
  };

  const timeLeft = BATTLE_SECS - elapsed;
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const winnerA = votesA > votesB;
  const seriesOver = maxRounds > 1 && (roundWinsA > maxRounds / 2 || roundWinsB > maxRounds / 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Swords style={{ width: 14, height: 14, color: CRIMSON }} />
          <span style={{ ...T, color: G, fontSize: 13, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            PK Battle
          </span>
          {prizePool && (
            <span style={{ ...T, color: G, fontSize: 11, fontWeight: 700, background: `${G}15`, border: `1px solid ${G}30`, borderRadius: 5, padding: '1px 6px' }}>
              ${prizePool}
            </span>
          )}
          {maxRounds > 1 && (
            <span style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}>
              R{currentRound}/{maxRounds} · {teamAName} {roundWinsA}-{roundWinsB} {teamBName}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {phase === 'ready' && (
            <button onClick={startBattle} style={{
              ...T, background: `linear-gradient(90deg, ${CRIMSON}, ${G})`,
              color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px',
              fontSize: 11, fontWeight: 900, cursor: 'pointer', letterSpacing: '0.06em',
            }}>
              ⚡ Start Battle
            </button>
          )}
          {phase === 'live' && (
            <button onClick={endBattle} style={{
              ...T, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
              color: '#ef4444', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 900, cursor: 'pointer',
            }}>
              End
            </button>
          )}
          {phase === 'ended' && !seriesOver && maxRounds > 1 && currentRound < maxRounds && (
            <button onClick={nextRound} style={{
              ...T, background: `${CRIMSON}20`, border: `1px solid ${CRIMSON}40`,
              color: '#fff', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 900, cursor: 'pointer',
            }}>
              Next Round
            </button>
          )}
          {phase === 'ended' && (
            <button onClick={resetBattle} style={{
              ...T, background: `${G}15`, border: `1px solid ${G}40`,
              color: G, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 900, cursor: 'pointer',
            }}>
              {maxRounds > 1 ? 'Continue Series?' : 'Rematch'}
            </button>
          )}
        </div>
      </div>

      {/* ── Team Setup (ready phase only) ────────────────────────────── */}
      {phase === 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 10 }}>
          {/* Config row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Duration */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}>Duration:</span>
              {[60, 180, 300, 600].map(d => (
                <button key={d} onClick={() => setBattleDuration(d)} style={{
                  ...T, padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 900, cursor: 'pointer',
                  background: battleDuration === d ? CRIMSON : 'transparent',
                  color: battleDuration === d ? '#fff' : 'rgba(255,255,255,0.45)',
                  border: battleDuration === d ? `1px solid ${G}` : '1px solid rgba(255,255,255,0.12)',
                }}>
                  {d === 60 ? '1m' : d === 180 ? '3m' : d === 300 ? '5m' : '10m'}
                </button>
              ))}
            </div>
            {/* Prize pool */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ ...T, color: G, fontSize: 11, fontWeight: 900 }}>$</span>
              <input
                placeholder="Prize pool"
                value={prizePool}
                onChange={e => setPrizePool(e.target.value)}
                style={{
                  width: 70, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 5, padding: '3px 6px', color: '#fff', fontSize: 10, outline: 'none', ...T,
                }}
              />
            </div>
            {/* Best-of */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}>Best of:</span>
              {[1, 3, 5].map(n => (
                <button key={n} onClick={() => setMaxRounds(n)} style={{
                  ...T, padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 900, cursor: 'pointer',
                  background: maxRounds === n ? G : 'transparent',
                  color: maxRounds === n ? '#000' : 'rgba(255,255,255,0.45)',
                  border: maxRounds === n ? `1px solid ${G}` : '1px solid rgba(255,255,255,0.12)',
                }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Team columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <input value={teamAName} onChange={e => setTeamAName(e.target.value)}
                style={{ ...T, width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${CRIMSON}50`, color: '#ef4444', fontSize: 11, fontWeight: 900, outline: 'none', marginBottom: 6, padding: '2px 0' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {teamA.map(p => (
                  <span key={p.id} onClick={() => unassignFromA(p)} title="Click to unassign"
                    style={{ ...T, background: `${CRIMSON}25`, border: `1px solid ${CRIMSON}40`, color: '#ef4444', borderRadius: 99, padding: '2px 8px', fontSize: 9, fontWeight: 900, cursor: 'pointer' }}>
                    {p.user_name?.split(' ')[0] || '?'} ×
                  </span>
                ))}
                {teamA.length === 0 && <span style={{ ...T, color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>No members</span>}
              </div>
            </div>
            <div>
              <input value={teamBName} onChange={e => setTeamBName(e.target.value)}
                style={{ ...T, width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(59,130,246,0.5)', color: '#3b82f6', fontSize: 11, fontWeight: 900, outline: 'none', marginBottom: 6, padding: '2px 0' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {teamB.map(p => (
                  <span key={p.id} onClick={() => unassignFromB(p)} title="Click to unassign"
                    style={{ ...T, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', color: '#3b82f6', borderRadius: 99, padding: '2px 8px', fontSize: 9, fontWeight: 900, cursor: 'pointer' }}>
                    {p.user_name?.split(' ')[0] || '?'} ×
                  </span>
                ))}
                {teamB.length === 0 && <span style={{ ...T, color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>No members</span>}
              </div>
            </div>
          </div>

          {/* Unassigned */}
          {unassigned.length > 0 && (
            <div>
              <p style={{ ...T, color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, marginBottom: 4 }}>UNASSIGNED — click to assign</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {unassigned.map(p => (
                  <span key={p.id} onClick={() => assignParticipant(p)}
                    style={{ ...T, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', borderRadius: 99, padding: '2px 8px', fontSize: 9, fontWeight: 900, cursor: 'pointer' }}>
                    + {p.user_name?.split(' ')[0] || '?'}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button onClick={autoSplit} style={{
            ...T, alignSelf: 'flex-start', background: `${G}15`, border: `1px solid ${G}30`, color: G,
            borderRadius: 5, padding: '3px 10px', fontSize: 10, fontWeight: 900, cursor: 'pointer',
          }}>
            Auto-Split
          </button>
        </div>
      )}

      {/* Countdown overlay */}
      <AnimatePresence>
        {phase === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 30, background: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 8, borderRadius: 8,
            }}
          >
            <motion.div
              key={countdown}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              style={{ fontSize: 80, fontWeight: 900, color: G, ...T, lineHeight: 1 }}
            >
              {countdown}
            </motion.div>
            <p style={{ ...T, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>
              Battle starting…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer + vote bar */}
      {(phase === 'live' || phase === 'ended') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ ...T, fontSize: 11, fontWeight: 900, color: phase === 'ended' ? G : timeLeft < 30 ? '#ef4444' : 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>
              {phase === 'ended' ? '🏆 Battle Over' : `⏱ ${fmt(timeLeft)}`}
            </span>
            {phase === 'live' && (
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', animation: 'pulse 1s infinite' }} />
                <span style={{ ...T, color: '#dc2626', fontSize: 10, fontWeight: 900 }}>LIVE</span>
              </div>
            )}
          </div>
          {/* Vote bar */}
          <div style={{ height: 28, display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <motion.div
              animate={{ width: `${votesA}%` }}
              transition={{ duration: 0.6 }}
              style={{ background: `linear-gradient(90deg, ${CRIMSON}, #c0202020)`, display: 'flex', alignItems: 'center', padding: '0 8px' }}
            >
              <span style={{ ...T, color: '#fff', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' }}>
                {teamAName.split(' ')[0] || 'Team A'} {votesA.toFixed(0)}%
              </span>
            </motion.div>
            <motion.div
              animate={{ width: `${votesB}%` }}
              transition={{ duration: 0.6 }}
              style={{ background: `linear-gradient(90deg, rgba(0,100,255,0.4), #2020c020)`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' }}
            >
              <span style={{ ...T, color: '#fff', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' }}>
                {votesB.toFixed(0)}% {teamBName.split(' ')[0] || 'Team B'}
              </span>
            </motion.div>
          </div>
          {phase === 'live' && (
            <p style={{ ...T, color: 'rgba(255,255,255,0.3)', fontSize: 9, fontStyle: 'italic', textAlign: 'center' }}>
              Viewers can type !A or !B to vote
            </p>
          )}
        </div>
      )}

      {/* Winner banner */}
      <AnimatePresence>
        {phase === 'ended' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              background: `${G}15`, border: `1px solid ${G}40`,
              borderRadius: 8, padding: '8px 12px', textAlign: 'center',
            }}
          >
            <p style={{ ...T, color: G, fontSize: 14, fontWeight: 900, letterSpacing: '0.06em' }}>
              🏆 {winnerA ? teamAName : teamBName} WINS!
            </p>
            <p style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              Final: {winnerA ? votesA : votesB}% — {winnerA ? votesB : votesA}%
            </p>
            {maxRounds > 1 && (
              <p style={{ ...T, color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4 }}>
                Series: {teamAName} {roundWinsA} – {roundWinsB} {teamBName}
              </p>
            )}
            {/* Battle history chips */}
            {battleHistory.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginTop: 6 }}>
                {battleHistory.slice(-3).map((h, i) => (
                  <span key={i} style={{
                    ...T, background: `${G}12`, border: `1px solid ${G}25`, borderRadius: 99,
                    padding: '1px 7px', fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 700,
                  }}>
                    🏆 {h.winner} {h.pctA}% R{h.round}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team tiles (live / ended) */}
      {phase !== 'ready' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, flex: 1 }}>
          {/* Team A */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ ...T, fontSize: 10, fontWeight: 900, color: '#ef4444', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
              {teamAName}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: teamA.length > 1 ? '1fr 1fr' : '1fr', gap: 4 }}>
              {teamA.map(p => (
                <GuestTile key={p.id} participant={p} isSpotlit={false} compact={teamA.length > 2} isHost={isHost} roomId={roomId}
                  onSpotlight={() => {}} onPromote={() => {}} onMute={() => {}} onKick={() => {}} onVideoToggle={() => {}} />
              ))}
            </div>
          </div>

          {/* VS divider */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <div style={{ ...T, fontSize: 18, fontWeight: 900, color: CRIMSON, letterSpacing: '0.05em',
              textShadow: `0 0 20px ${CRIMSON}` }}>VS</div>
            <Swords style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)' }} />
          </div>

          {/* Team B */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ ...T, fontSize: 10, fontWeight: 900, color: '#3b82f6', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
              {teamBName}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: teamB.length > 1 ? '1fr 1fr' : '1fr', gap: 4 }}>
              {teamB.map(p => (
                <GuestTile key={p.id} participant={p} isSpotlit={false} compact={teamB.length > 2} isHost={isHost} roomId={roomId}
                  onSpotlight={() => {}} onPromote={() => {}} onMute={() => {}} onKick={() => {}} onVideoToggle={() => {}} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── GuestListRow — always-visible controls, designed for 20-person panels ─ */
function GuestListRow({ participant, isHost, roomId, raisedHands, onSpotlight, onPromote, onMute, onKick, onStreamToggle }) {
  const audioLevel = useAudioLevel(participant?.id, participant?.is_streaming);
  const isCoHost   = participant?.role === 'co-host';
  const isHostP    = participant?.role === 'host';
  const isRaised   = raisedHands.has(participant?.user_id);
  const speaking   = audioLevel > 40;

  if (!participant) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px', borderRadius: 8,
      background: participant.is_streaming ? 'rgba(128,0,32,0.12)' : 'rgba(255,255,255,0.025)',
      border: participant.is_streaming
        ? `1px solid rgba(128,0,32,0.3)`
        : '1px solid rgba(255,255,255,0.06)',
      transition: 'background 0.2s',
    }}>
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${CRIMSON}, #3a0015)`,
        border: `2px solid ${isHostP ? G : isCoHost ? '#00d4ff' : speaking ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: G, fontWeight: 900, ...T,
        boxShadow: speaking ? '0 0 10px rgba(34,197,94,0.5)' : 'none',
        overflow: 'hidden',
      }}>
        {participant.user_avatar
          ? <img src={participant.user_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (participant.user_name || '?')[0].toUpperCase()}
      </div>

      {/* Name + role + indicators */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isRaised && <span style={{ fontSize: 11 }}>✋</span>}
          <span style={{ ...T, color: '#fff', fontSize: 12, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {participant.user_name || 'Guest'}
          </span>
          {isHostP && <span style={{ ...T, fontSize: 8, fontWeight: 900, color: G, background: `${G}20`, border: `1px solid ${G}40`, borderRadius: 3, padding: '1px 4px' }}>HOST</span>}
          {isCoHost && <span style={{ ...T, fontSize: 8, fontWeight: 900, color: '#00d4ff', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 3, padding: '1px 4px' }}>CO-HOST</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          {participant.is_streaming ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#dc2626', animation: 'pulse 1s infinite' }} />
              <span style={{ ...T, color: '#dc2626', fontSize: 9, fontWeight: 900 }}>LIVE</span>
            </div>
          ) : (
            <span style={{ ...T, color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700 }}>Offline</span>
          )}
          {speaking && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 10 }}>
              {[0.6, 1, 0.7].map((h, i) => (
                <div key={i} style={{ width: 2, height: Math.round(h * 10), background: '#22c55e', borderRadius: 1 }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Always-visible action buttons */}
      {isHost && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {/* Stream toggle */}
          <button onClick={() => onStreamToggle(participant)} title={participant.is_streaming ? 'Stop stream' : 'Go live'}
            style={{
              width: 28, height: 28, borderRadius: 6, cursor: 'pointer', border: 'none',
              background: participant.is_streaming ? 'rgba(220,38,38,0.25)' : `${G}25`,
              color: participant.is_streaming ? '#ef4444' : G,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Cast style={{ width: 11, height: 11 }} />
          </button>
          {/* Spotlight */}
          <button onClick={() => onSpotlight(participant.id)} title="Spotlight"
            style={{ width: 28, height: 28, borderRadius: 6, cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Maximize2 style={{ width: 11, height: 11 }} />
          </button>
          {/* Mute */}
          <button onClick={() => onMute(participant)} title={participant.is_muted ? 'Unmute' : 'Mute'}
            style={{ width: 28, height: 28, borderRadius: 6, cursor: 'pointer', border: 'none', background: participant.is_muted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)', color: participant.is_muted ? '#ef4444' : 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {participant.is_muted ? <MicOff style={{ width: 11, height: 11 }} /> : <Mic style={{ width: 11, height: 11 }} />}
          </button>
          {/* Co-host toggle */}
          {!isHostP && (
            <button onClick={() => onPromote(participant)} title={isCoHost ? 'Remove Co-host' : 'Make Co-host'}
              style={{ width: 28, height: 28, borderRadius: 6, cursor: 'pointer', border: 'none', background: isCoHost ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.07)', color: isCoHost ? '#00d4ff' : 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isCoHost ? <ShieldOff style={{ width: 11, height: 11 }} /> : <Shield style={{ width: 11, height: 11 }} />}
            </button>
          )}
          {/* Kick */}
          <button onClick={() => onKick(participant)} title="Remove from stage"
            style={{ width: 28, height: 28, borderRadius: 6, cursor: 'pointer', border: 'none', background: 'rgba(239,68,68,0.1)', color: 'rgba(239,68,68,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 11, height: 11 }} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function MultiGuestPanel({
  participants = [], spotlightId, onSpotlight, maxGuests = 20,
  roomId, isHost, remoteStreams = new Map(), raisedHands = new Set(),
}) {
  const [layout, setLayout]       = useState('list');
  const [tab, setTab]             = useState('stage');
  const [mutedIds, setMutedIds]   = useState(new Set());
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [gridPage, setGridPage]   = useState(0);
  const PAGE_SIZE = 9;
  const qc = useQueryClient();

  const speakers = participants
    .filter(p => ['host','co-host','speaker','guest'].includes(p.role))
    .slice(0, maxGuests);

  const getGridCols = () => {
    const n = speakers.length;
    if (n <= 2)  return 'repeat(2,1fr)';
    if (n <= 4)  return 'repeat(2,1fr)';
    if (n <= 6)  return 'repeat(3,1fr)';
    if (n <= 9)  return 'repeat(3,1fr)';
    if (n <= 12) return 'repeat(4,1fr)';
    if (n <= 16) return 'repeat(4,1fr)';
    return 'repeat(5,1fr)';
  };

  const streamToggle = useMutation({
    mutationFn: (p) => base44.entities.Participant.update(p.id, { is_streaming: !p.is_streaming }),
    onSuccess: (_, p) => {
      toast.success(p.is_streaming ? `${p.user_name} stream stopped` : `${p.user_name} is now live`);
      qc.invalidateQueries(['participants', roomId]);
    },
  });

  const streamAll = () => {
    speakers.forEach(p => {
      if (!p.is_streaming) base44.entities.Participant.update(p.id, { is_streaming: true }).catch(() => {});
    });
    toast.success(`All ${speakers.length} guests going live`);
    qc.invalidateQueries(['participants', roomId]);
  };

  const stopAll = () => {
    speakers.forEach(p => {
      if (p.is_streaming) base44.entities.Participant.update(p.id, { is_streaming: false }).catch(() => {});
    });
    toast.info('All streams stopped');
    qc.invalidateQueries(['participants', roomId]);
  };

  const promoteGuest = useMutation({
    mutationFn: (p) => base44.entities.Participant.update(p.id, {
      role: p.role === 'co-host' ? 'guest' : 'co-host',
    }),
    onSuccess: (_, p) => {
      toast.success(`${p.user_name} is now ${p.role === 'co-host' ? 'Guest' : 'Co-host'}`);
      qc.invalidateQueries(['participants', roomId]);
    },
  });

  const muteGuest = (p) => {
    setMutedIds(prev => {
      const next = new Set(prev);
      next.has(p.id) ? next.delete(p.id) : next.add(p.id);
      return next;
    });
    base44.entities.Participant.update(p.id, { is_muted: !mutedIds.has(p.id) }).catch(() => {});
  };

  const kickGuest = useMutation({
    mutationFn: (p) => base44.entities.Participant.update(p.id, { status: 'removed' }),
    onSuccess: (_, p) => {
      toast.info(`${p.user_name} removed from stage`);
      qc.invalidateQueries(['participants', roomId]);
    },
  });

  const muteAll = () => {
    const ids = new Set(speakers.map(p => p.id));
    setMutedIds(ids);
    speakers.forEach(p => base44.entities.Participant.update(p.id, { is_muted: true }).catch(() => {}));
    toast.info('All guests muted');
  };

  return (
    <div style={{
      height: '100%', background: 'rgba(13,6,24,0.97)',
      border: `1px solid ${CRIMSON}30`, borderRadius: 12,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: CRIMSON, borderRadius: 99, padding: '3px 9px',
            border: `1px solid ${G}`,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: G, animation: 'pulse 1s infinite' }} />
            <span style={{ ...T, color: G, fontSize: 10, fontWeight: 900 }}>
              {speakers.filter(p => p.is_streaming).length}/{speakers.length} LIVE
            </span>
          </div>

          {raisedHands.size > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, background: `${G}20`,
              border: `1px solid ${G}40`, borderRadius: 99, padding: '3px 8px',
            }}>
              <span style={{ fontSize: 10 }}>✋</span>
              <span style={{ ...T, color: G, fontSize: 10, fontWeight: 900 }}>{raisedHands.size}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isHost && (
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={streamAll} title="Go live with all guests" style={{
                ...T, background: `${CRIMSON}25`, border: `1px solid ${CRIMSON}50`,
                color: '#ff6680', borderRadius: 6, padding: '3px 9px',
                fontSize: 10, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Cast style={{ width: 9, height: 9 }} />
                Stream All
              </button>
              <button onClick={stopAll} title="Stop all guest streams" style={{
                ...T, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.4)', borderRadius: 6, padding: '3px 8px',
                fontSize: 10, fontWeight: 900, cursor: 'pointer',
              }}>
                Stop All
              </button>
              <button onClick={muteAll} style={{
                ...T, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444', borderRadius: 6, padding: '3px 8px',
                fontSize: 10, fontWeight: 900, cursor: 'pointer',
              }}>
                <MicOff style={{ display: 'inline', width: 9, height: 9, marginRight: 3 }} />
                Mute All
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 3 }}>
            {LAYOUT_PRESETS.map(l => (
              <button key={l.id} onClick={() => setLayout(l.id)} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 10, height: 24, padding: '0 8px',
                background: layout === l.id ? CRIMSON : 'transparent',
                color: layout === l.id ? G : 'rgba(255,255,255,0.45)',
                border: layout === l.id ? `1px solid ${G}` : '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6, cursor: 'pointer', ...T,
              }}>
                <l.icon style={{ width: 10, height: 10 }} />
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 12px 0', flexShrink: 0 }}>
        {[
          { id: 'stage',     icon: Radio, label: 'Stage' },
          { id: 'greenroom', icon: Users, label: `Queue${raisedHands.size > 0 ? ` (${raisedHands.size})` : ''}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, padding: '4px 10px', borderRadius: 6,
            background: tab === t.id ? `${G}15` : 'transparent',
            color: tab === t.id ? G : 'rgba(255,255,255,0.35)',
            border: tab === t.id ? `1px solid ${G}35` : '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', ...T, fontWeight: 900,
          }}>
            <t.icon style={{ width: 10, height: 10 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, position: 'relative' }}>
        {tab === 'greenroom' ? (
          <GreenroomQueue roomId={roomId} isHost={isHost} />
        ) : layout === 'list' ? (
          /* ── List view: all 20 as scrollable rows with always-visible controls ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {speakers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.2)', ...T, fontSize: 12 }}>
                No guests on stage — admit guests from the Queue tab
              </div>
            )}
            {speakers.map(p => (
              <GuestListRow key={p.id} participant={p} isHost={isHost} roomId={roomId} raisedHands={raisedHands}
                onSpotlight={onSpotlight}
                onPromote={p2 => promoteGuest.mutate(p2)}
                onMute={muteGuest}
                onKick={p2 => kickGuest.mutate(p2)}
                onStreamToggle={p2 => streamToggle.mutate(p2)}
              />
            ))}
          </div>
        ) : layout === 'battle' ? (
          <BattlePanel participants={speakers} roomId={roomId} isHost={isHost} />
        ) : layout === 'watch_party' ? (
          <WatchPartyLayout speakers={speakers} isHost={isHost} roomId={roomId} />
        ) : layout === 'broadcast' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
            {speakers[0] && (
              <div style={{ flex: 1 }}>
                <GuestTile participant={speakers[0]} isSpotlit isHost={isHost} roomId={roomId}
                  onSpotlight={onSpotlight} onPromote={p => promoteGuest.mutate(p)}
                  onMute={muteGuest} onKick={p => kickGuest.mutate(p)} raisedHands={raisedHands}
                  streamRef={remoteStreams.get(speakers[0].user_id)}
                />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, height: 80 }}>
              {speakers.slice(1, 6).map(p => (
                <GuestTile key={p.id} participant={p} isSpotlit={false} compact isHost={isHost} roomId={roomId}
                  onSpotlight={onSpotlight} onPromote={p2 => promoteGuest.mutate(p2)}
                  onMute={muteGuest} onKick={p2 => kickGuest.mutate(p2)} raisedHands={raisedHands}
                  streamRef={remoteStreams.get(p.user_id)}
                />
              ))}
            </div>
          </div>
        ) : layout === 'spotlight' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
            {(spotlightId ? speakers.find(p => p.id === spotlightId) : speakers[0]) && (
              <div style={{ flex: 1 }}>
                <GuestTile
                  participant={spotlightId ? speakers.find(p => p.id === spotlightId) : speakers[0]}
                  isSpotlit isHost={isHost} roomId={roomId}
                  onSpotlight={onSpotlight} onPromote={p => promoteGuest.mutate(p)}
                  onMute={muteGuest} onKick={p => kickGuest.mutate(p)} raisedHands={raisedHands}
                  streamRef={remoteStreams.get((spotlightId ? speakers.find(p => p.id === spotlightId) : speakers[0])?.user_id)}
                />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, height: 72 }}>
              {speakers.filter(p => p.id !== (spotlightId || speakers[0]?.id)).map(p => (
                <GuestTile key={p.id} participant={p} isSpotlit={false} compact isHost={isHost} roomId={roomId}
                  onSpotlight={onSpotlight} onPromote={p2 => promoteGuest.mutate(p2)}
                  onMute={muteGuest} onKick={p2 => kickGuest.mutate(p2)} raisedHands={raisedHands}
                  streamRef={remoteStreams.get(p.user_id)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Grid with pagination for large panels */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: getGridCols(), gap: 8 }}>
              <AnimatePresence>
                {speakers.slice(gridPage * PAGE_SIZE, (gridPage + 1) * PAGE_SIZE).map(p => (
                  <GuestTile key={p.id} participant={p} isSpotlit={p.id === spotlightId}
                    isHost={isHost} roomId={roomId}
                    onSpotlight={onSpotlight} onPromote={p2 => promoteGuest.mutate(p2)}
                    onMute={muteGuest} onKick={p2 => kickGuest.mutate(p2)} raisedHands={raisedHands}
                    streamRef={remoteStreams.get(p.user_id)}
                  />
                ))}
              </AnimatePresence>
              {speakers.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.2)', ...T, fontSize: 12 }}>
                  No guests on stage yet — admit guests from the Queue tab
                </div>
              )}
            </div>
            {speakers.length > PAGE_SIZE && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 4 }}>
                <button onClick={() => setGridPage(p => Math.max(0, p - 1))} disabled={gridPage === 0}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: gridPage === 0 ? 'rgba(255,255,255,0.2)' : G }}>
                  <ChevronLeft style={{ width: 12, height: 12 }} />
                </button>
                <span style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700 }}>
                  {gridPage + 1} / {Math.ceil(speakers.length / PAGE_SIZE)} · {speakers.length} total
                </span>
                <button onClick={() => setGridPage(p => Math.min(Math.ceil(speakers.length / PAGE_SIZE) - 1, p + 1))} disabled={(gridPage + 1) * PAGE_SIZE >= speakers.length}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: (gridPage + 1) * PAGE_SIZE >= speakers.length ? 'rgba(255,255,255,0.2)' : G }}>
                  <ChevronRight style={{ width: 12, height: 12 }} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
