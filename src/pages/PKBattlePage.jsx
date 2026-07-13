import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { isSafeUrl } from '@/lib/security';
import { Swords, Trophy, ArrowLeft, Plus, Users, Zap, Clock, Gift, Crown } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import ShareButtons from '../components/shared/ShareButtons';
import PKBattleInterface from '../components/pk/PKBattleInterface';
import PKBattleSoundboard from '../components/live/PKBattleSoundboard';
import BattleScoreboard from '../components/live/BattleScoreboard';
import CompositorOverlay from '../components/streaming/CompositorOverlay';
import AggregatedChat from '../components/live/AggregatedChat';
import PKBattleProgress from '../components/pk/PKBattleProgress';
import PKBattleVotePanel from '../components/pk/PKBattleVotePanel';
import PKInviteModal from '../components/pk/PKInviteModal';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
import GiftTray from '../components/live/GiftTray';
import TipNowModal from '../components/live/TipNowModal';
import PointsNotification from '../components/live/PointsNotification';
import SuperChatRail from '../components/live/SuperChatRail';
import LivePoll from '../components/live/LivePoll';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';

const BATTLE_DURATION = 180;
const OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

const GIFTS = [
  { emoji: '🌹', label: 'Rose', pts: 1 },
  { emoji: '🍰', label: 'Cake', pts: 5 },
  { emoji: '💎', label: 'Diamond', pts: 10 },
  { emoji: '🔥', label: 'Fire', pts: 20 },
  { emoji: '🚀', label: 'Rocket', pts: 50 },
  { emoji: '👑', label: 'Crown', pts: 100 },
  { emoji: '💫', label: 'Star Shower', pts: 200 },
  { emoji: '🌊', label: 'Wave', pts: 500 },
];

function OctCamTile({ stream, label, isLocal }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream || null; }, [stream]);
  return (
    <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
      <div className="absolute inset-0" style={{ clipPath: OCT, background: isLocal ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.15)' }} />
      <div className="absolute inset-[2px] overflow-hidden" style={{ clipPath: OCT, background: '#080B18' }}>
        {stream ? (
          <video ref={ref} autoPlay playsInline muted={isLocal}
            className={'w-full h-full object-cover' + (isLocal ? ' scale-x-[-1]' : '')} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-[10px]">
            {label?.charAt(0)?.toUpperCase()}
          </div>
        )}
        {isLocal && (
          <div className="absolute bottom-0 left-0 right-0 text-center text-[6px] text-[#d4af37] font-bold bg-black/60">YOU</div>
        )}
      </div>
    </div>
  );
}

function GhostOctTile() {
  return (
    <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
      <div className="absolute inset-0" style={{ clipPath: OCT, border: '1px dashed rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)' }} />
      <div className="absolute inset-[2px] flex items-center justify-center" style={{ clipPath: OCT, background: 'rgba(0,0,0,0.4)' }}>
        <span className="text-[11px] font-bold" style={{ color: 'rgba(212,175,55,0.5)' }}>Join</span>
      </div>
    </div>
  );
}

function AudienceCameraStrip({ localStream, remoteStreams, currentUserId }) {
  var hasStreams = localStream || (remoteStreams && remoteStreams.size > 0);
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 shrink-0 overflow-x-auto"
      style={{ background: 'rgba(0,0,0,0.6)', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
      <span className="text-[11px] uppercase tracking-widest shrink-0" style={{ color: 'rgba(212,175,55,0.5)' }}>Audience</span>
      {localStream && <OctCamTile stream={localStream} label="You" isLocal />}
      {remoteStreams && Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
        <OctCamTile key={peerId} stream={stream} label="Viewer" isLocal={false} />
      ))}
      {!hasStreams && (
        <>
          <GhostOctTile />
          <GhostOctTile />
          <GhostOctTile />
        </>
      )}
    </div>
  );
}

function FlyingGift({ emoji, side }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 1, x: side === 'left' ? 20 : -20 }}
      animate={{ y: -150, opacity: 0, scale: 1.5 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="absolute bottom-20 text-3xl pointer-events-none z-30"
      style={{ [side === 'left' ? 'left' : 'right']: '40px' }}
    >
      {emoji}
    </motion.div>
  );
}

function ComboBadge({ combo }) {
  if (!combo || combo < 2) return null;
  var color = combo >= 10 ? '#C0392B' : combo >= 5 ? '#D4854A' : combo >= 3 ? '#CC7755' : '#D4AF37';
  var glow = combo >= 10 ? '0 0 12px rgba(192,57,43,0.8)' : 'none';
  return (
    <motion.div
      key={combo}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full font-black text-sm px-2 py-0.5 rounded-full z-20"
      style={{ background: color + '30', color, border: `1px solid ${color}60`, boxShadow: glow, fontFamily: 'Barlow Condensed, sans-serif' }}
    >
      x{combo}
    </motion.div>
  );
}

function OnFireBadge({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
        >
          <div className="text-sm font-black px-3 py-1 rounded-xl" style={{ background: 'rgba(192,57,43,0.3)', border: '1px solid rgba(192,57,43,0.6)', color: '#D4854A' }}>
            🔥 ON FIRE!
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ScoreBar({ leftVotes, rightVotes, leftName, rightName }) {
  const total = leftVotes + rightVotes || 1;
  const leftPct = Math.round((leftVotes / total) * 100);
  return (
    <div className="w-full px-4">
      <div className="flex items-center justify-between text-[11px] text-white/60 mb-1">
        <span>{leftPct}%</span>
        <span>{100 - leftPct}%</span>
      </div>
      <div className="h-3 rounded-full flex overflow-hidden bg-white/10">
        <motion.div
          className="bg-[#D4AF37] transition-all duration-700"
          style={{ width: `${leftPct}%` }}
        />
        <motion.div
          className="bg-red-500 transition-all duration-700"
          style={{ width: `${100 - leftPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs font-bold mt-1">
        <span className="text-[#D4AF37]">{leftVotes.toLocaleString()} pts</span>
        <span className="text-red-400">{rightVotes.toLocaleString()} pts</span>
      </div>
    </div>
  );
}

function CircularTimer({ timeLeft, totalTime }) {
  var size = 40;
  var stroke = 3;
  var radius = (size - stroke) / 2;
  var circumference = 2 * Math.PI * radius;
  var pct = totalTime > 0 ? timeLeft / totalTime : 0;
  var offset = circumference * (1 - pct);
  var color = pct > 0.5 ? '#D4AF37' : pct > 0.25 ? '#D4854A' : '#FF3030';
  var mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  var ss = String(timeLeft % 60).padStart(2, '0');
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', color }}>
        {mm}:{ss}
      </div>
    </div>
  );
}

function CountdownOverlay({ countdown }) {
  return (
    <AnimatePresence>
      {countdown !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            key={countdown}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="font-black text-[#D4AF37]"
            style={{ fontSize: 120, fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1, textShadow: '0 0 40px rgba(212,175,55,0.8)' }}
          >
            {countdown}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function WinnerOverlay({ winner, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="text-center px-8 py-10"
      >
        <div className="text-7xl mb-4">🏆</div>
        <Crown className="w-10 h-10 text-[#d4af37] mx-auto mb-3" />
        <p className="text-white/60 text-lg uppercase tracking-widest mb-2">Winner</p>
        <h2 className="text-5xl font-black text-[#d4af37] mb-6">{winner}</h2>
        <button onClick={onClose} style={{ background: '#D4AF37', color: '#000', fontWeight: 700, padding: '10px 32px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14 }}>
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function PKBattlePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const battleId = searchParams.get('id');
  const qc = useQueryClient();

  const [leftName, setLeftName] = useState('');
  const [rightName, setRightName] = useState('');
  const [leftStream, setLeftStream] = useState('');
  const [rightStream, setRightStream] = useState('');
  const [duration, setDuration] = useState(BATTLE_DURATION);

  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION);
  const [leftVotes, setLeftVotes] = useState(0);
  const [rightVotes, setRightVotes] = useState(0);
  const [flyingGifts, setFlyingGifts] = useState([]);
  const [winner, setWinner] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [countdownDone, setCountdownDone] = useState(false);
  const [leftCombo, setLeftCombo] = useState(0);
  const [rightCombo, setRightCombo] = useState(0);
  const [leftOnFire, setLeftOnFire] = useState(false);
  const [rightOnFire, setRightOnFire] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pkRound, setPkRound] = useState(1);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [leftSupporters, setLeftSupporters] = useState(new Set());
  const [rightSupporters, setRightSupporters] = useState(new Set());

  const timerRef = useRef(null);
  const giftIdRef = useRef(0);
  const leftLastGiftRef = useRef(0);
  const rightLastGiftRef = useRef(0);
  const leftComboTimerRef = useRef(null);
  const rightComboTimerRef = useRef(null);
  const leftVelocityRef = useRef([]);
  const rightVelocityRef = useRef([]);
  const leftFireTimerRef = useRef(null);
  const rightFireTimerRef = useRef(null);
  const countdownStartedRef = useRef(false);
  const battleDurationRef = useRef(BATTLE_DURATION);

  useEffect(() => {
    var check = function() { setIsMobile(window.innerWidth < 768); };
    check();
    window.addEventListener('resize', check);
    return function() { window.removeEventListener('resize', check); };
  }, []);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: battle } = useQuery({
    queryKey: ['pk-battle', battleId],
    queryFn: () => base44.entities.LiveAuction.filter({ id: battleId }).then(r => r[0]),
    enabled: !!battleId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (!battleId) return;
    const unsub = base44.entities.LiveAuction.subscribe((event) => {
      if (event.id !== battleId) return;
      if (event.data) {
        setLeftVotes(event.data.current_bid || 0);
        setRightVotes(event.data.bid_count || 0);
      }
    });
    return unsub;
  }, [battleId]);

  useEffect(() => {
    if (!battle || battle.status !== 'active' || countdownStartedRef.current) return;
    var endsAt = new Date(battle.ends_at).getTime();
    var remaining = Math.floor((endsAt - Date.now()) / 1000);
    if (Math.abs(remaining - battleDurationRef.current) <= 2 || remaining >= battleDurationRef.current - 2) {
      countdownStartedRef.current = true;
      setCountdown(3);
      var t1 = setTimeout(function() { setCountdown(2); }, 1000);
      var t2 = setTimeout(function() { setCountdown(1); }, 2000);
      var t3 = setTimeout(function() { setCountdown(null); setCountdownDone(true); }, 3000);
      return function() { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [battle?.status, battle?.ends_at]);

  const createBattle = useMutation({
    mutationFn: () => base44.entities.LiveAuction.create({
      creator_id: user?.id,
      title: `${leftName} vs ${rightName}`,
      auction_type: 'experience',
      starting_bid: 0,
      current_bid: 0,
      bid_count: 0,
      ends_at: new Date(Date.now() + duration * 1000).toISOString(),
      status: 'active',
    }),
    onSuccess: (b) => {
      battleDurationRef.current = duration;
      setSearchParams({ id: b.id });
    },
    onError: () => toast.error('Action failed.'),
  });

  var addVote = function(side, pts, combo) {
    var multiplier = combo || 1;
    var totalPts = pts * multiplier;
    var emoji = GIFTS.find(function(g) { return g.pts === pts; })?.emoji || '🎁';
    var id = ++giftIdRef.current;
    setFlyingGifts(function(p) { return [...p, { id, emoji, side }]; });
    setTimeout(function() { setFlyingGifts(function(p) { return p.filter(function(g) { return g.id !== id; }); }); }, 1600);

    var uid = user?.id || ('anon_' + id);
    if (side === 'left') {
      setLeftSupporters(function(prev) { var next = new Set(prev); next.add(uid); return next; });
    } else {
      setRightSupporters(function(prev) { var next = new Set(prev); next.add(uid); return next; });
    }

    var now = Date.now();
    if (side === 'left') {
      var lastLeft = leftLastGiftRef.current;
      leftLastGiftRef.current = now;
      if (now - lastLeft < 2000) {
        setLeftCombo(function(c) { return c + 1; });
      } else {
        setLeftCombo(1);
      }
      if (leftComboTimerRef.current) clearTimeout(leftComboTimerRef.current);
      leftComboTimerRef.current = setTimeout(function() { setLeftCombo(0); }, 2000);

      leftVelocityRef.current = [...leftVelocityRef.current, now].slice(-5);
      var leftRecent = leftVelocityRef.current.filter(function(t) { return now - t < 3000; });
      if (leftRecent.length > 3) {
        setLeftOnFire(true);
        if (leftFireTimerRef.current) clearTimeout(leftFireTimerRef.current);
        leftFireTimerRef.current = setTimeout(function() { setLeftOnFire(false); }, 2000);
      }

      var newVal = leftVotes + totalPts;
      setLeftVotes(newVal);
      if (battleId) base44.entities.LiveAuction.update(battleId, { current_bid: newVal });
    } else {
      var lastRight = rightLastGiftRef.current;
      rightLastGiftRef.current = now;
      if (now - lastRight < 2000) {
        setRightCombo(function(c) { return c + 1; });
      } else {
        setRightCombo(1);
      }
      if (rightComboTimerRef.current) clearTimeout(rightComboTimerRef.current);
      rightComboTimerRef.current = setTimeout(function() { setRightCombo(0); }, 2000);

      rightVelocityRef.current = [...rightVelocityRef.current, now].slice(-5);
      var rightRecent = rightVelocityRef.current.filter(function(t) { return now - t < 3000; });
      if (rightRecent.length > 3) {
        setRightOnFire(true);
        if (rightFireTimerRef.current) clearTimeout(rightFireTimerRef.current);
        rightFireTimerRef.current = setTimeout(function() { setRightOnFire(false); }, 2000);
      }

      var newRightVal = rightVotes + totalPts;
      setRightVotes(newRightVal);
      if (battleId) base44.entities.LiveAuction.update(battleId, { bid_count: newRightVal });
    }
  };

  useEffect(() => {
    if (!battleId || !battle || battle.status !== 'active') return;
    const endsAt = battle ? new Date(battle.ends_at).getTime() : Date.now() + duration * 1000;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(timerRef.current);
        const w = leftVotes >= rightVotes ? (battle?.title?.split(' vs ')[0] || 'Left') : (battle?.title?.split(' vs ')[1] || 'Right');
        setWinner(w);
        setPkRound(function(r) { return r + 1; });
        base44.entities.LiveAuction.update(battleId, { status: 'ended' });
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [battleId, battle?.status]);

  const copyLink = () => { navigator.clipboard.writeText(window.location.href).then(() => toast.success('Battle link copied!')).catch(() => toast.error('Copy failed.')); };

  const { localStream: localCamStream } = useLocalMedia({ audio: true, video: true });
  const { remoteStreams: battleRemoteStreams, peerUserIds: battlePeerUserIds } = useWebRTCPeers(battleId || '', localCamStream);
  const [leftCaptureStream, setLeftCaptureStream] = React.useState(null);
  const [rightCaptureStream, setRightCaptureStream] = React.useState(null);
  React.useEffect(() => {
    return () => {
      if (leftCaptureStream) leftCaptureStream.getTracks().forEach(t => t.stop());
      if (rightCaptureStream) rightCaptureStream.getTracks().forEach(t => t.stop());
    };
  }, [leftCaptureStream, rightCaptureStream]);

  if (!battleId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#080B18] via-[#001428] to-[#080B18] flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <Link to={createPageUrl('Home')}>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14 }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </Link>
          <div className="bg-white/5 border border-[#d4af37]/20 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-[#d4af37] flex items-center justify-center">
                <Swords className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">PK Battle</h1>
                <p className="text-sm text-white/40">Head-to-head streamer showdown</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[11px] text-[#D4AF37] font-semibold uppercase tracking-wider mb-1 block">Left Creator</label>
                <input
                  placeholder="Name"
                  value={leftName}
                  onChange={e => setLeftName(e.target.value)}
                  className="w-full bg-[#0F1428] border border-[#D4AF37]/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/50"
                />
                <input
                  placeholder="Stream URL (optional)"
                  value={leftStream}
                  onChange={e => setLeftStream(e.target.value)}
                  className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="text-[11px] text-red-400 font-semibold uppercase tracking-wider mb-1 block">Right Creator</label>
                <input
                  placeholder="Name"
                  value={rightName}
                  onChange={e => setRightName(e.target.value)}
                  className="w-full bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-red-500/60"
                />
                <input
                  placeholder="Stream URL (optional)"
                  value={rightStream}
                  onChange={e => setRightStream(e.target.value)}
                  className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Duration</label>
              <div className="flex gap-2">
                {[60, 120, 180, 300].map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                      duration === d
                        ? 'bg-[#d4af37] border-[#d4af37] text-black font-bold'
                        : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                    }`}
                  >
                    {d / 60}min
                  </button>
                ))}
              </div>
            </div>
            <button
              style={{ width: '100%', background: !leftName || !rightName || createBattle.isPending ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, #800020, #C0392B)', color: '#fff', fontWeight: 700, padding: '12px', borderRadius: 8, border: 'none', cursor: !leftName || !rightName || createBattle.isPending ? 'default' : 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Barlow Condensed, sans-serif', opacity: !leftName || !rightName || createBattle.isPending ? 0.5 : 1 }}
              disabled={!leftName || !rightName || createBattle.isPending}
              onClick={() => createBattle.mutate()}
            >
              <Swords className="w-4 h-4" /> Start Battle
            </button>
          </div>
        </div>
      </div>
    );
  }

  const names = battle?.title?.split(' vs ') || [leftName || 'Left', rightName || 'Right'];
  const [bLeftName, bRightName] = names;
  const bLeftStream = leftStream;
  const bRightStream = rightStream;

  const isHost = !!(user?.id && battle?.creator_id === user?.id);

  const battleCompositorSlots = [
    { stream: leftCaptureStream, label: bLeftName },
    { stream: rightCaptureStream, label: bRightName },
  ];
  const battleOverlay = {
    title: battle?.title || `${bLeftName} vs ${bRightName}`,
    battleData: { leftScore: leftVotes, rightScore: rightVotes, timeLeft, leftName: bLeftName, rightName: bRightName },
  };

  const handleBattleScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: true });
      if (!leftCaptureStream) setLeftCaptureStream(stream);
      else setRightCaptureStream(stream);
      return stream;
    } catch {
      // User cancelled or permission denied — leave existing streams unchanged
    }
  };

  var giftsDisabled = countdown !== null;
  var splitDir = isMobile ? 'flex-col' : 'flex-row';

  return (
    <div className="min-h-screen bg-[#050010] text-white flex flex-col overflow-hidden relative">
      <AnimatePresence>
        {winner && <WinnerOverlay winner={winner} onClose={() => setWinner(null)} />}
      </AnimatePresence>

      {/* PKBattleInterface widget — battle controls */}
      {battleId && (
        <div className="absolute top-2 left-2 z-30 max-w-xs">
          <PKBattleInterface roomId={battleId} />
        </div>
      )}

      {battleId && (
        <div className="absolute top-2 right-2 z-30 max-w-xs space-y-2">
          <BattleScoreboard roomId={battleId} />
          <PKBattleSoundboard battleId={battleId} isBattleActive={!!battle} />
          <PKBattleProgress battleId={battleId} />
          {battle && (
            <PKBattleVotePanel
              battleId={battleId}
              creatorId={battle.creator_id}
              challengerId={battle.challenger_id}
              creatorName={battle.creator_name || bLeftName}
              challengerName={battle.challenger_name || bRightName}
            />
          )}
        </div>
      )}

      <PKInviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} creators={[]} />

      <CountdownOverlay countdown={countdown} />

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <AnimatePresence>
          {flyingGifts.map(g => <FlyingGift key={g.id} emoji={g.emoji} side={g.side} />)}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 px-4 py-3 bg-black/60 border-b border-white/10 z-10 shrink-0">
        <Link to={createPageUrl('Home')}>
          <button style={{ width: 32, height: 32, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <Swords className="w-4 h-4 text-[#d4af37]" />
          <span className="font-bold text-sm text-white truncate">{battle?.title || 'PK Battle'}</span>
          {battle?.status === 'active' && (
            <span style={{ background: '#C0392B', color: '#fff', fontSize: 11, fontWeight: 900, padding: '2px 6px', borderRadius: 99, fontFamily: 'Barlow Condensed, sans-serif' }} className="animate-pulse">LIVE</span>
          )}
          {battle?.status === 'ended' && (
            <span style={{ background: '#4b5563', color: '#fff', fontSize: 11, fontWeight: 900, padding: '2px 6px', borderRadius: 99, fontFamily: 'Barlow Condensed, sans-serif' }}>ENDED</span>
          )}
        </div>
        <CircularTimer timeLeft={timeLeft} totalTime={battleDurationRef.current} />
        <button onClick={function() { setShowChat(function(v) { return !v; }); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all text-sm"
          style={{ background: showChat ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.07)', border: showChat ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)' }}>
          💬
        </button>
        <ShareButtons
          url={window.location.href}
          title={`Watch this PK Battle: ${battle?.title || 'Live Battle'}`}
          className="[&_button]:text-white/40 [&_button:hover]:text-white"
        />
        <CompositorOverlay
          layout="battle"
          slots={battleCompositorSlots}
          overlayConfig={battleOverlay}
          userId={user?.id}
          onScreenCapture={handleBattleScreenCapture}
          isHost={!!(user?.id && battle?.creator_id === user?.id)}
        />
      </div>

      <div className={'flex-1 flex overflow-hidden ' + splitDir}>
        <div className={'flex-1 relative flex flex-col bg-gradient-to-br from-[#080B18] to-black ' + (isMobile ? 'border-b-2' : 'border-r-2') + ' border-[#d4af37]/30'}>
          <div className="flex-1 relative overflow-hidden">
            {isSafeUrl(bLeftStream) ? (
              <iframe src={bLeftStream} className="w-full h-full" allowFullScreen allow="autoplay" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-20 h-20 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37]/40 flex items-center justify-center text-4xl font-black text-[#D4AF37]">
                  {bLeftName?.charAt(0)?.toUpperCase()}
                </div>
                <p className="text-2xl font-black text-white">{bLeftName}</p>
                <span style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.4)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, fontFamily: 'Barlow Condensed, sans-serif' }}>Left Creator</span>
              </div>
            )}
            <div className="absolute top-3 left-3 bg-black/70 rounded-xl px-4 py-2 flex flex-col items-center relative">
              <AnimatePresence>
                <ComboBadge combo={leftCombo} />
              </AnimatePresence>
              <p className="text-3xl font-black text-[#D4AF37] font-mono">{leftVotes.toLocaleString()}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">points</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>👥 {leftSupporters.size} supporting</p>
              <OnFireBadge show={leftOnFire} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-black/60 overflow-x-auto" style={{ flexWrap: 'nowrap' }}>
            {GIFTS.map(g => (
              <button
                key={g.pts}
                onClick={() => !giftsDisabled && addVote('left', g.pts, leftCombo)}
                disabled={giftsDisabled}
                className="flex items-center gap-1 px-2 py-1.5 bg-[#0F1428]/80 border border-[#D4AF37]/30 rounded-lg text-[11px] text-[#D4AF37] font-bold hover:bg-[#800020]/50 transition-all shrink-0"
                style={{ opacity: giftsDisabled ? 0.4 : 1 }}
              >
                {g.emoji} +{g.pts}
              </button>
            ))}
          </div>
        </div>

        <div className={'flex flex-col items-center justify-center bg-black z-10 shrink-0 ' + (isMobile ? 'h-8 flex-row w-full' : 'w-10')}>
          <div className={'bg-gradient-to-b from-transparent via-[#d4af37]/60 to-transparent ' + (isMobile ? 'flex-1 h-px' : 'flex-1 w-px')} />
          <div className="w-9 h-9 rounded-full bg-[#d4af37] flex flex-col items-center justify-center my-2 shrink-0">
            <span className="text-black font-black leading-none" style={{ fontSize: 11 }}>PK</span>
            <span className="text-black font-black leading-none" style={{ fontSize: 10 }}>{pkRound}</span>
          </div>
          <div className={'bg-gradient-to-b from-transparent via-[#d4af37]/60 to-transparent ' + (isMobile ? 'flex-1 h-px' : 'flex-1 w-px')} />
        </div>

        <div className="flex-1 relative flex flex-col bg-gradient-to-bl from-red-950 to-black">
          <div className="flex-1 relative overflow-hidden">
            {isSafeUrl(bRightStream) ? (
              <iframe src={bRightStream} className="w-full h-full" allowFullScreen allow="autoplay" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-20 h-20 rounded-full bg-red-700/40 border-2 border-red-500/60 flex items-center justify-center text-4xl font-black text-red-300">
                  {bRightName?.charAt(0)?.toUpperCase()}
                </div>
                <p className="text-2xl font-black text-white">{bRightName}</p>
                <span style={{ background: 'rgba(185,28,28,0.5)', color: '#fecaca', border: '1px solid rgba(192,57,43,0.4)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, fontFamily: 'Barlow Condensed, sans-serif' }}>Right Creator</span>
              </div>
            )}
            <div className="absolute top-3 right-3 bg-black/70 rounded-xl px-4 py-2 flex flex-col items-center relative">
              <AnimatePresence>
                <ComboBadge combo={rightCombo} />
              </AnimatePresence>
              <p className="text-3xl font-black text-red-400 font-mono">{rightVotes.toLocaleString()}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">points</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>👥 {rightSupporters.size} supporting</p>
              <OnFireBadge show={rightOnFire} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-black/60 overflow-x-auto" style={{ flexWrap: 'nowrap' }}>
            {GIFTS.map(g => (
              <button
                key={g.pts}
                onClick={() => !giftsDisabled && addVote('right', g.pts, rightCombo)}
                disabled={giftsDisabled}
                className="flex items-center gap-1 px-2 py-1.5 bg-red-900/40 border border-red-700/40 rounded-lg text-[11px] text-red-300 font-bold hover:bg-red-700/50 transition-all shrink-0"
                style={{ opacity: giftsDisabled ? 0.4 : 1 }}
              >
                {g.emoji} +{g.pts}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AudienceCameraStrip
        localStream={localCamStream}
        remoteStreams={battleRemoteStreams}
        currentUserId={user?.id}
      />

      <div className="shrink-0 flex items-center gap-3 px-4 py-2"
        style={{ background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(212,175,55,0.08)' }}>
        <span className="text-[11px] uppercase tracking-widest shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>Supporting</span>
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
          {Array.from(leftSupporters).slice(0, 5).map((uid, i) => (
            <div key={uid} className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{ background: 'rgba(212,175,55,0.2)', color: '#C9A84C', border: '1px solid rgba(212,175,55,0.3)' }}>
              {uid.charAt(0).toUpperCase()}
            </div>
          ))}
          {leftSupporters.size > 5 && (
            <span className="text-[11px] text-[#D4AF37]">+{leftSupporters.size - 5}</span>
          )}
          {leftSupporters.size === 0 && <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>None yet</span>}
        </div>
        <div className="w-px h-4" style={{ background: 'rgba(212,175,55,0.3)' }} />
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto justify-end">
          {rightSupporters.size === 0 && <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>None yet</span>}
          {rightSupporters.size > 5 && (
            <span className="text-[11px] text-red-300">+{rightSupporters.size - 5}</span>
          )}
          {Array.from(rightSupporters).slice(0, 5).map((uid, i) => (
            <div key={uid} className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{ background: 'rgba(192,57,43,0.4)', color: '#fca5a5', border: '1px solid rgba(192,57,43,0.4)' }}>
              {uid.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-black/80 border-t border-white/10 px-6 py-3 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-bold text-[#D4AF37] truncate flex-1 text-right">{bLeftName}</span>
          <Swords className="w-4 h-4 text-[#d4af37] shrink-0" />
          <span className="text-sm font-bold text-red-400 truncate flex-1">{bRightName}</span>
        </div>
        <ScoreBar leftVotes={leftVotes} rightVotes={rightVotes} leftName={bLeftName} rightName={bRightName} />
      </div>

      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: 240 }}
            animate={{ x: 0 }}
            exit={{ x: 240 }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed right-0 bottom-0 z-40 flex flex-col"
            style={{ width: 240, height: '90vh', top: '10vh', background: 'rgba(8,5,20,0.97)', borderLeft: '1px solid rgba(212,175,55,0.2)' }}
          >
            <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-[11px] font-black uppercase" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>Live Chat</span>
              <button onClick={function() { setShowChat(false); }} className="text-white/40 hover:text-white text-xs">✕</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AggregatedChat roomId={battleId} currentUser={user} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GiftTray roomId={battleId} currentUser={user} recipientId={battle?.creator_id} />
        {battle?.creator_id && <TipNowModal roomId={battleId} recipientId={battle.creator_id} isOpen={false} onClose={() => {}} />}
        {user?.id && <PointsNotification userId={user.id} />}
        {battleId && <SuperChatRail roomId={battleId} currentUser={user} />}
        {battleId && <LivePoll roomId={battleId} isHost={isHost} />}
        <OnlineUsersGrid roomId={battleId} remoteStreams={battleRemoteStreams} peerUserIds={battlePeerUserIds} localStream={localCamStream} currentUser={user} compact maxVisible={8} />
        <ContentRecommendations />
        <MilestoneAlerts userId={user?.id} roomId={null} />
        <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
        <CollaborationMatcher />
      </div>
    </div>
  );
}