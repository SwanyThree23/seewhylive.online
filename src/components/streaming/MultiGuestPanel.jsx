import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize2, Minimize2, Mic, MicOff, Video, VideoOff, Radio,
  Swords, Users, Pin, PinOff, Shield, ShieldOff, Wifi, WifiOff,
  LayoutGrid, LayoutList, Star, Hand, Settings, Signal, BarChart2,
  Zap, Crown, Eye, EyeOff, MoreVertical, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import GuestRTMPPanel from '@/components/streaming/GuestRTMPPanel';
import GreenroomQueue from '@/components/streaming/GreenroomQueue';

const G       = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#FF1564';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const LAYOUT_PRESETS = [
  { id: 'grid',      label: 'Grid',      icon: LayoutGrid },
  { id: 'spotlight', label: 'Focus',     icon: Maximize2 },
  { id: 'broadcast', label: '1+5',       icon: LayoutList },
  { id: 'battle',    label: 'Battle',    icon: Swords },
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

function GuestTile({ participant, isSpotlit, onSpotlight, compact, isHost, roomId, raisedHands = new Set(), onPromote, onMute, onKick, onVideoToggle, streamRef }) {
  const [showRTMP, setShowRTMP]     = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [vidOff, setVidOff]         = useState(false);
  const health = useSimulatedHealth(participant?.id, participant?.is_streaming);
  const isRaised = raisedHands.has(participant?.user_id);
  const isCoHost = participant?.role === 'co-host';
  const isHostP  = participant?.role === 'host';
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && streamRef) videoRef.current.srcObject = streamRef;
  }, [streamRef]);

  if (!participant) return null;

  const qColor = qualityColor(health.quality);

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
        boxShadow: participant.is_streaming ? `0 0 16px ${qColor}55` : 'none',
        border: `2px solid ${participant.is_streaming ? qColor + '70' : 'rgba(255,255,255,0.08)'}`,
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
              border: `2px solid ${isHostP ? G : isCoHost ? '#00d4ff' : 'rgba(255,255,255,0.15)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isSpotlit ? 32 : compact ? 14 : 20,
              color: G, fontWeight: 900, ...T,
              boxShadow: isHostP ? `0 0 20px ${G}50` : isCoHost ? '0 0 16px rgba(0,212,255,0.4)' : 'none',
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
              background: isHostP ? `${G}22` : 'rgba(0,212,255,0.15)',
              border: `1px solid ${isHostP ? G + '60' : 'rgba(0,212,255,0.4)'}`,
              color: isHostP ? G : '#00d4ff', fontSize: 9, fontWeight: 900,
              padding: '2px 5px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2, ...T,
            }}>
              {isHostP ? <Crown style={{ width: 8, height: 8 }} /> : <Shield style={{ width: 8, height: 8 }} />}
              {isHostP ? 'HOST' : 'CO-HOST'}
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
                  onClick={() => onPromote(participant)} color="#00d4ff" />}
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
                  borderRadius: 8, padding: '4px 0', minWidth: 140,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                }}
              >
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

function BattlePanel({ participants, roomId, isHost }) {
  const speakers = participants.filter(p => ['host','co-host','speaker','guest'].includes(p.role));
  const [teamA, setTeamA] = useState(speakers.slice(0, Math.ceil(speakers.length / 2)));
  const [teamB, setTeamB] = useState(speakers.slice(Math.ceil(speakers.length / 2)));
  const [votesA, setVotesA] = useState(50);
  const [votesB, setVotesB] = useState(50);
  const [phase, setPhase] = useState('ready'); // 'ready' | 'countdown' | 'live' | 'ended'
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const BATTLE_SECS = 180;
  const timerRef = useRef(null);
  const voteRef  = useRef(null);

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

  const timeLeft = BATTLE_SECS - elapsed;
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const winnerA = votesA > votesB;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Swords style={{ width: 14, height: 14, color: CRIMSON }} />
          <span style={{ ...T, color: G, fontSize: 13, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            PK Battle
          </span>
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
          {(phase === 'ended') && (
            <button onClick={resetBattle} style={{
              ...T, background: `${G}15`, border: `1px solid ${G}40`,
              color: G, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 900, cursor: 'pointer',
            }}>
              Rematch
            </button>
          )}
        </div>
      </div>

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
                {teamA[0]?.user_name?.split(' ')[0] || 'Team A'} {votesA.toFixed(0)}%
              </span>
            </motion.div>
            <motion.div
              animate={{ width: `${votesB}%` }}
              transition={{ duration: 0.6 }}
              style={{ background: `linear-gradient(90deg, rgba(0,100,255,0.4), #2020c020)`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' }}
            >
              <span style={{ ...T, color: '#fff', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' }}>
                {votesB.toFixed(0)}% {teamB[0]?.user_name?.split(' ')[0] || 'Team B'}
              </span>
            </motion.div>
          </div>
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
              🏆 {winnerA ? teamA[0]?.user_name || 'Team A' : teamB[0]?.user_name || 'Team B'} WINS!
            </p>
            <p style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              Final: {winnerA ? votesA : votesB}% — {winnerA ? votesB : votesA}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, flex: 1 }}>
        {/* Team A */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ ...T, fontSize: 10, fontWeight: 900, color: '#ef4444', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
            Team A
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
            Team B
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: teamB.length > 1 ? '1fr 1fr' : '1fr', gap: 4 }}>
            {teamB.map(p => (
              <GuestTile key={p.id} participant={p} isSpotlit={false} compact={teamB.length > 2} isHost={isHost} roomId={roomId}
                onSpotlight={() => {}} onPromote={() => {}} onMute={() => {}} onKick={() => {}} onVideoToggle={() => {}} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MultiGuestPanel({
  participants = [], spotlightId, onSpotlight, maxGuests = 20,
  roomId, isHost, remoteStreams = new Map(), raisedHands = new Set(),
}) {
  const [layout, setLayout]   = useState('grid');
  const [tab, setTab]         = useState('stage');
  const [mutedIds, setMutedIds] = useState(new Set());
  const [hiddenIds, setHiddenIds] = useState(new Set());
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
          {/* Live guest count */}
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

          {/* Raised hands count */}
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
          {/* Mute all (host only) */}
          {isHost && (
            <button onClick={muteAll} style={{
              ...T, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444', borderRadius: 6, padding: '3px 8px',
              fontSize: 10, fontWeight: 900, cursor: 'pointer',
            }}>
              <MicOff style={{ display: 'inline', width: 9, height: 9, marginRight: 3 }} />
              Mute All
            </button>
          )}

          {/* Layout presets */}
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
          { id: 'stage', icon: Radio, label: 'Stage' },
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
        ) : layout === 'battle' ? (
          <BattlePanel participants={speakers} roomId={roomId} isHost={isHost} />
        ) : layout === 'broadcast' ? (
          /* 1+5 broadcast layout */
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
          /* Focus: 1 large + compact bottom row */
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
          /* Grid */
          <div style={{ display: 'grid', gridTemplateColumns: getGridCols(), gap: 8 }}>
            <AnimatePresence>
              {speakers.map(p => (
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
        )}
      </div>
    </div>
  );
}
