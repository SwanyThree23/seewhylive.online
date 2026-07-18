import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Gift, Swords,
  Clock, Trophy, Crown, Wifi, WifiOff,
} from 'lucide-react';
import { useLocalMedia } from '@/hooks/useLocalMedia';
import { useWebRTCPeers } from '@/hooks/useWebRTCPeers';

const BG    = '#080B18';
const GOLD  = '#D4AF37';
const CRIM  = '#800020';
const SCAR  = '#C0392B';
const T     = { fontFamily: 'Barlow Condensed, sans-serif' };

const GIFTS = [
  { emoji: '🎁', label: 'Gift',   pts: 1  },
  { emoji: '💎', label: 'Gem',    pts: 5  },
  { emoji: '🚀', label: 'Rocket', pts: 25 },
  { emoji: '👑', label: 'Crown',  pts: 100 },
];

function useCountdown(startedAt, durationMinutes) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (!startedAt || !durationMinutes) return;
    const end = new Date(startedAt).getTime() + durationMinutes * 60_000;
    const tick = () => setRemaining(Math.max(0, Math.round((end - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, durationMinutes]);
  return remaining;
}

function formatTime(seconds) {
  if (seconds === null) return '--:--';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function VideoPane({ stream, label, mirrored, isLocal, score, side, noVideo }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.srcObject !== (stream ?? null)) {
      ref.current.srcObject = stream ?? null;
      if (stream) ref.current.play?.().catch(() => {});
    }
  }, [stream]);

  const accent = side === 'left' ? GOLD : SCAR;

  return (
    <div className="relative flex-1 rounded-xl overflow-hidden flex flex-col"
      style={{ background: '#0a0d1a', border: `2px solid ${accent}33`, minHeight: 0 }}>

      {/* Video / placeholder */}
      <div className="flex-1 relative overflow-hidden">
        {stream && !noVideo ? (
          <video ref={ref} autoPlay playsInline muted={isLocal}
            className="w-full h-full object-cover"
            style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(145deg, ${accent}22, ${BG})` }}>
            <div className="text-center">
              <div className="text-5xl mb-2">
                {isLocal ? '📸' : '⏳'}
              </div>
              <p className="text-xs font-black uppercase" style={{ ...T, color: `${accent}88` }}>
                {isLocal ? 'Camera preview' : 'Waiting for opponent…'}
              </p>
            </div>
          </div>
        )}

        {/* Score bubble */}
        {score !== undefined && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.75)', border: `1px solid ${accent}55`, backdropFilter: 'blur(8px)' }}>
            <span className="font-black text-xl" style={{ ...T, color: accent }}>{score}</span>
            <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>pts</span>
          </div>
        )}
      </div>

      {/* Name bar */}
      <div className="px-3 py-2 flex items-center gap-2 shrink-0"
        style={{ background: `linear-gradient(90deg, ${accent}22, transparent)` }}>
        {isLocal && <Crown className="w-3 h-3" style={{ color: GOLD }} />}
        <span className="font-black text-sm truncate" style={{ ...T, color: '#fff' }}>{label}</span>
        {isLocal && (
          <span className="text-[9px] font-black uppercase px-1.5 py-px rounded-full ml-auto shrink-0"
            style={{ background: `${SCAR}cc`, color: '#fff', ...T }}>
            YOU
          </span>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ creatorScore, challengerScore, creatorName, challengerName }) {
  const total = (creatorScore + challengerScore) || 1;
  const creatorPct = Math.round((creatorScore / total) * 100);
  return (
    <div className="px-4 py-2 shrink-0">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-black" style={{ ...T, color: GOLD }}>{creatorName}</span>
        <span className="text-xs font-black" style={{ ...T, color: SCAR }}>{challengerName}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${creatorPct}%`, background: `linear-gradient(90deg, ${GOLD}, ${SCAR})` }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-black" style={{ ...T, color: '#fff', mixBlendMode: 'difference' }}>
            {creatorPct}% — {100 - creatorPct}%
          </span>
        </div>
      </div>
    </div>
  );
}

function GiftPanel({ onGift, side }) {
  const accent = side === 'creator' ? GOLD : SCAR;
  return (
    <div className="flex gap-2 px-3 py-2 shrink-0 overflow-x-auto">
      {GIFTS.map(g => (
        <motion.button key={g.label} whileTap={{ scale: 0.88 }} onClick={() => onGift(g)}
          className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 shrink-0"
          style={{ background: `${accent}18`, border: `1px solid ${accent}44`, cursor: 'pointer' }}>
          <span className="text-lg leading-none">{g.emoji}</span>
          <span className="text-[8px] font-black uppercase" style={{ ...T, color: accent }}>{g.pts}pt</span>
        </motion.button>
      ))}
    </div>
  );
}

function WinnerOverlay({ winner, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center z-50 rounded-xl"
      style={{ background: 'rgba(5,3,12,0.96)', backdropFilter: 'blur(12px)' }}>
      <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.5 }} className="text-7xl mb-4">🏆</motion.div>
      <p className="text-xs font-black uppercase mb-2" style={{ ...T, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>
        Battle Over
      </p>
      <h2 className="font-black text-4xl mb-1" style={{ ...T, color: GOLD }}>{winner}</h2>
      <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>wins the battle!</p>
      <button onClick={onClose}
        className="px-6 py-2 rounded-xl font-black text-sm"
        style={{ ...T, background: `${GOLD}22`, border: `1px solid ${GOLD}55`, color: GOLD, cursor: 'pointer' }}>
        Close
      </button>
    </motion.div>
  );
}

/**
 * FaceToFaceRoom — fully-wired 1v1 WebRTC video call with optional PKBattle scoring.
 *
 * Props:
 *   roomId         {string}  — WebRTC signaling room (usually battleId or generated UUID)
 *   battleId       {string?} — base44 PKBattle entity id; if provided enables score + gifts
 *   currentUserId  {string?} — identifies which DB participant is "us"
 *   currentUserName{string}  — display name for local tile
 *   opponentName   {string?} — display name for remote tile (fallback while no PKBattle data)
 *   side           {'creator'|'challenger'} — which side this user is on (for gift routing)
 *   onLeave        {()=>void}
 */
export default function FaceToFaceRoom({
  roomId,
  battleId,
  currentUserId,
  currentUserName = 'You',
  opponentName    = 'Opponent',
  side            = 'creator',
  onLeave,
}) {
  const qc = useQueryClient();

  // Local media
  const {
    localStream,
    audioEnabled,
    videoEnabled,
    toggleAudio,
    toggleVideo,
    error: mediaError,
  } = useLocalMedia({ audio: true, video: true });

  // WebRTC mesh
  const {
    remoteStreams,
    peerStates,
    announceJoin,
    leaveRoom,
  } = useWebRTCPeers(roomId, localStream, {
    onPeerStateChange: () => {},
  });

  // First remote peer is the opponent
  const opponentStream = remoteStreams.size > 0
    ? remoteStreams.get([...remoteStreams.keys()][0])
    : null;
  const opponentConnState = peerStates.size > 0
    ? peerStates.get([...peerStates.keys()][0])
    : null;
  const opponentConnected = opponentConnState === 'connected';

  // PKBattle data
  const { data: battle } = useQuery({
    queryKey: ['battle', battleId],
    queryFn: () => base44.entities.PKBattle.get(battleId),
    enabled: !!battleId,
    refetchInterval: 3000,
  });

  const remaining = useCountdown(battle?.started_at, battle?.duration_minutes);

  // Announce join on mount
  useEffect(() => {
    if (roomId) announceJoin(currentUserId);
    return () => { leaveRoom(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Gift mutation — increments the relevant tips counter
  const giftMutation = useMutation({
    mutationFn: ({ targetSide, pts }) => {
      if (!battleId || !battle) return Promise.resolve();
      const field = targetSide === 'creator' ? 'creator_tips' : 'challenger_tips';
      return base44.entities.PKBattle.update(battleId, {
        [field]: (battle[field] || 0) + pts,
      });
    },
    onSuccess: () => qc.invalidateQueries(['battle', battleId]),
  });

  const sendGift = useCallback((gift, targetSide) => {
    giftMutation.mutate({ targetSide, pts: gift.pts });
  }, [giftMutation]);

  const handleLeave = () => {
    leaveRoom();
    onLeave?.();
  };

  // Scores
  const creatorScore     = (battle?.creator_tips     || 0) + (battle?.creator_subs     || 0) * 10;
  const challengerScore  = (battle?.challenger_tips  || 0) + (battle?.challenger_subs  || 0) * 10;
  const myScore          = side === 'creator' ? creatorScore : challengerScore;
  const opponentScore    = side === 'creator' ? challengerScore : creatorScore;
  const myName           = battle ? (side === 'creator' ? battle.creator_name : battle.challenger_name) ?? currentUserName : currentUserName;
  const theirName        = battle ? (side === 'creator' ? battle.challenger_name : battle.creator_name) ?? opponentName : opponentName;
  const hasBattle        = !!battleId;
  const isEnded          = battle?.status === 'ended';
  const isLobby          = !opponentConnected && !isEnded;
  const opponentSide     = side === 'creator' ? 'challenger' : 'creator';

  // Winner
  const winner = isEnded
    ? (creatorScore >= challengerScore ? battle?.creator_name : battle?.challenger_name) || 'Unknown'
    : null;

  const [showWinner, setShowWinner] = useState(false);
  useEffect(() => { if (isEnded) setShowWinner(true); }, [isEnded]);

  const peerSignal = opponentConnState === 'connected'   ? { icon: <Wifi className="w-3 h-3" style={{ color: '#6DBF7E' }} />, label: 'Connected' }
                   : opponentConnState === 'connecting'
                     || opponentConnState === 'checking' ? { icon: <Wifi className="w-3 h-3" style={{ color: GOLD }} />, label: 'Connecting…' }
                   : opponentConnState === 'failed'      ? { icon: <WifiOff className="w-3 h-3 text-red-400" />, label: 'Failed' }
                   : { icon: null, label: 'Waiting' };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden relative"
      style={{ background: BG, border: `1px solid rgba(212,175,55,0.15)` }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 shrink-0"
        style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Swords className="w-4 h-4" style={{ color: SCAR }} />
        <span className="font-black text-sm uppercase flex-1" style={{ ...T, color: GOLD }}>
          {hasBattle ? (battle?.creator_name && battle?.challenger_name
            ? `${battle.creator_name} vs ${battle.challenger_name}`
            : 'PK Battle') : '1v1 Face-to-Face'}
        </span>

        {/* Timer */}
        {hasBattle && battle?.status === 'active' && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
            style={{ background: remaining !== null && remaining < 60 ? `${SCAR}33` : 'rgba(255,255,255,0.05)', border: `1px solid ${remaining !== null && remaining < 60 ? SCAR : 'rgba(255,255,255,0.1)'}` }}>
            <Clock className="w-3 h-3" style={{ color: remaining !== null && remaining < 60 ? SCAR : GOLD }} />
            <span className="font-black text-sm tabular-nums" style={{ ...T, color: remaining !== null && remaining < 60 ? SCAR : '#fff' }}>
              {formatTime(remaining)}
            </span>
          </div>
        )}

        {/* Connection state */}
        <div className="flex items-center gap-1">
          {peerSignal.icon}
          <span className="text-[9px] font-black uppercase" style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>
            {peerSignal.label}
          </span>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 flex gap-2 p-2 min-h-0 overflow-hidden">
        {/* Local (left) */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <VideoPane
            stream={localStream}
            label={myName}
            mirrored
            isLocal
            score={hasBattle ? myScore : undefined}
            side={side === 'creator' ? 'left' : 'right'}
            noVideo={!videoEnabled}
          />
          {/* Gifts to send to opponent */}
          {hasBattle && battle?.status === 'active' && (
            <GiftPanel side={opponentSide} onGift={g => sendGift(g, opponentSide)} />
          )}
        </div>

        {/* VS divider */}
        <div className="flex flex-col items-center justify-center gap-2 shrink-0 px-1">
          <div className="w-px flex-1" style={{ background: 'rgba(212,175,55,0.1)' }} />
          <span className="font-black text-xs" style={{ ...T, color: `${GOLD}66`, letterSpacing: '0.15em' }}>VS</span>
          <div className="w-px flex-1" style={{ background: 'rgba(212,175,55,0.1)' }} />
        </div>

        {/* Remote (right) */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <VideoPane
            stream={opponentStream}
            label={theirName}
            score={hasBattle ? opponentScore : undefined}
            side={side === 'creator' ? 'right' : 'left'}
          />
          {/* Gifts to send to opponent — same panel, mirrors left */}
          {hasBattle && battle?.status === 'active' && (
            <GiftPanel side={side} onGift={g => sendGift(g, side)} />
          )}
        </div>
      </div>

      {/* Score bar */}
      {hasBattle && (
        <ScoreBar
          creatorScore={creatorScore}
          challengerScore={challengerScore}
          creatorName={battle?.creator_name || 'Creator'}
          challengerName={battle?.challenger_name || 'Challenger'}
        />
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 shrink-0"
        style={{ background: 'rgba(0,0,0,0.35)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Mic */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={toggleAudio}
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: audioEnabled ? 'rgba(109,191,126,0.12)' : 'rgba(239,68,68,0.15)', border: `1px solid ${audioEnabled ? '#6DBF7E55' : '#ef444455'}`, cursor: 'pointer' }}>
          {audioEnabled ? <Mic className="w-5 h-5 text-[#6DBF7E]" /> : <MicOff className="w-5 h-5 text-red-400" />}
        </motion.button>

        {/* Cam */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={toggleVideo}
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: videoEnabled ? 'rgba(212,175,55,0.1)' : 'rgba(239,68,68,0.15)', border: `1px solid ${videoEnabled ? `${GOLD}55` : '#ef444455'}`, cursor: 'pointer' }}>
          {videoEnabled ? <Video className="w-5 h-5" style={{ color: GOLD }} /> : <VideoOff className="w-5 h-5 text-red-400" />}
        </motion.button>

        {/* End call */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleLeave}
          className="w-14 h-11 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(192,57,43,0.25)', border: '1px solid rgba(192,57,43,0.5)', cursor: 'pointer' }}>
          <PhoneOff className="w-5 h-5" style={{ color: SCAR }} />
        </motion.button>
      </div>

      {/* Media error */}
      {mediaError && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: 'rgba(239,68,68,0.9)', color: '#fff', ...T, fontWeight: 900 }}>
          {mediaError}
        </div>
      )}

      {/* Lobby overlay */}
      <AnimatePresence>
        {isLobby && !hasBattle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none rounded-xl"
            style={{ background: 'rgba(8,11,24,0.6)', backdropFilter: 'blur(2px)' }}>
            <div className="text-3xl mb-3 animate-pulse">⏳</div>
            <p className="font-black text-sm uppercase" style={{ ...T, color: GOLD }}>Waiting for opponent…</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Share the room link to invite</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner overlay */}
      <AnimatePresence>
        {showWinner && winner && (
          <WinnerOverlay winner={winner} onClose={() => setShowWinner(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
