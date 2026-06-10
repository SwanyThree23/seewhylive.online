import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, MessageCircle, Heart, Hand, Crown,
  ChevronLeft, MoreHorizontal, Share2, Minus, Radio,
  Users, LayoutGrid, Send, X, UserPlus, LogIn, Trophy,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
import TipWidget from '../components/live/TipWidget';
import ShareModal from '../components/live/ShareModal';
import InviteSheet from '../components/live/InviteSheet';
import { buildVdoViewUrl } from '../components/live/VdoNinjaGuestLink';
import DirectPayments from '../components/live/DirectPayments';
import PKBattleModal from '../components/live/PKBattleModal';
import InviteGuestsModal from '../components/live/InviteGuestsModal';
import { getStoredAge, getAccessLevel } from '../lib/ageVerification';
import RoomEntryGate from '../components/RoomEntryGate';
import LoveHearts from '../components/live/LoveHearts';
import LoveTap from '../components/live/LoveTap';
import GiftShop from '../components/live/GiftShop';
import AnimatedGiftShop from '../components/monetization/AnimatedGiftShop';
import ZEGOGuestJoin from '../components/zego/ZEGOGuestJoin';
import TippingOverlay from '../components/live/TippingOverlay';
import VirtualCurrencyTips from '../components/live/VirtualCurrencyTips';
import SuperChatBar from '../components/live/SuperChatBar';
import SubscriptionGate from '../components/live/SubscriptionGate';
import RealtimeLeaderboard from '../components/live/RealtimeLeaderboard';
import LeaderboardPanel from '../components/live/LeaderboardPanel';
import MobileStreamControls from '../components/live/MobileStreamControls';
import ReportModal from '../components/moderation/ReportModal';
import PayPerViewGate from '../components/live/PayPerViewGate';
import PaywallGate from '../components/live/PaywallGate';
import PointsNotification from '../components/live/PointsNotification';
import LoyaltyBadge from '../components/rooms/LoyaltyBadge';
import GiftAnimation from '../components/live/GiftAnimation';
import { DollarSign, Gift } from 'lucide-react';
import SuperChatRail from '../components/live/SuperChatRail';
import ClipMarker from '../components/live/ClipMarker';
import StreamGoals from '../components/live/StreamGoals';
import BreakoutRoomsModal from '../components/live/BreakoutRoomsModal';
import GoldenWall from '../components/live/GoldenWall';
import LiveAudiencePulse from '../components/live/LiveAudiencePulse';
import ViewerLoyaltyCard from '../components/loyalty/ViewerLoyaltyCard';
import PointsEarnWidget from '../components/loyalty/PointsEarnWidget';

// ── Guardian AI chat filter ──────────────────────────────────────────────────
const GUARDIAN_PATTERNS = [
  /\b(hate|kill|rape|n[i1]gg[ae]r|f[a@]gg[o0]t|ch[i1]nk|sp[i1]c|k[y1]ke)\b/i,
  /\b(fuck\s+you|piece\s+of\s+shit|stupid\s+bitch|go\s+die)\b/i,
  /((.)\2{5,})/,                          // spam: same char 6+ times
  /https?:\/\/[^\s]{0,40}\.ru\b/i,        // suspicious domains
  /(buy|cheap|discount|click here|earn \$)/i,
];
function filterMessageWithGuardianAI(text) {
  for (const pat of GUARDIAN_PATTERNS) {
    if (pat.test(text)) return { blocked: true, reason: 'Message flagged by Guardian AI' };
  }
  return { blocked: false };
}

// ── Brand tokens ──────────────────────────────────────────────────────────────
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const BG      = '#080B18';
const BG2     = '#0A0D1E';
const BG3     = '#0E1120';
const OCT     = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const PALETTE = ['#8B6F47','#6B7C4A','#CC7755','#4A6B7C','#7C4A6B','#5C6BC0','#26A69A','#EF6C00'];

function avatarColor(name) {
  return PALETTE[(name?.charCodeAt(0) ?? 0) % PALETTE.length];
}

// ── Demo data (replaced by real WebRTC when roomId is available) ──────────────
const DEMO_STAGE = [
  { id: 1, name: 'Joyce 🦋',   role: 'host',    speaking: true,  muted: false },
  { id: 2, name: 'SwanyThree', role: 'co-host', speaking: false, muted: false },
  { id: 3, name: 'Tom',        role: 'speaker', speaking: false, muted: true  },
  { id: 4, name: 'Yahawadah',  role: 'speaker', speaking: false, muted: false },
  { id: 5, name: 'Marvin',     role: 'speaker', speaking: false, muted: true  },
  { id: 6, name: 'Durand',     role: 'speaker', speaking: false, muted: true  },
];
const DEMO_AUDIENCE = [
  'SwanyThree','Phelo The Great','Obi Knowledg.','Marvin 10','Sim 11',
  'Phelo The Gre.','Durand 13','Joyce 14','SwanyThree 15','Obi Knowledg.',
  'Marvin 17','Sim 18','Phelo The Gre.','Durand 20',
].map((name, i) => ({ id: 100 + i, name }));
const DEMO_CHAT = [
  { id: 1, user: 'Joyce 🦋',   text: 'Welcome to the session everyone! 🎉', host: true  },
  { id: 2, user: 'SwanyThree', text: 'Thanks for joining — we go live in 2 min', host: false },
  { id: 3, user: 'Marvin',     text: 'Ready! 🔥',                            host: false },
  { id: 4, user: 'Sim 11',     text: 'Looking good on stage 👏',             host: false },
];

// ── Octagonal stage tile (speaker) ───────────────────────────────────────────
function StageTile({ p, size = 96, stream, isLocal = false, vdoUrl = null, onClick }) {
  const videoRef = useRef(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !stream) return;
    v.muted = isLocal;        // set DOM property directly — React muted prop unreliable on mobile
    v.srcObject = stream;
    v.play().catch(() => {}); // explicit play() — autoPlay alone not reliable on mobile
  }, [stream, isLocal]);

  const isHost   = p.role === 'host';
  const isCohost = p.role === 'co-host';
  const border   = p.speaking ? GOLD
    : isHost                  ? 'rgba(212,175,55,0.45)'
    :                           'rgba(255,255,255,0.12)';

  return (
    <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={onClick}>
      <div className="relative" style={{ width: size, height: size }}>

        {/* Speaking pulse ring */}
        {p.speaking && (
          <motion.div className="absolute inset-0"
            style={{ clipPath: OCT, background: GOLD, opacity: 0.18 }}
            animate={{ opacity: [0.18, 0.44, 0.18], scale: [1, 1.06, 1] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Gold / white octagonal border */}
        <div className="absolute inset-0"
          style={{ clipPath: OCT, background: border, filter: p.speaking ? 'blur(1.5px)' : 'none', transition: 'background 0.4s' }} />

        {/* Dark content shell */}
        <div className="absolute inset-[2.5px] overflow-hidden flex items-center justify-center"
          style={{ clipPath: OCT, background: `linear-gradient(145deg, ${CRIMSON}99, ${BG2})` }}>

          {stream ? (
            <video ref={videoRef} autoPlay playsInline muted={isLocal}
              className={'absolute inset-0 w-full h-full object-cover' + (isLocal ? ' scale-x-[-1]' : '')} />
          ) : vdoUrl ? (
            <iframe
              src={vdoUrl}
              allow="camera; microphone; autoplay; fullscreen; display-capture"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', background: 'transparent', pointerEvents: 'none' }}
            />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black border-2 shrink-0"
              style={{ background: avatarColor(p.name) + '55', borderColor: avatarColor(p.name), color: '#fff' }}>
              {p.name.replace(/\s+\S*$/, '').charAt(0).toUpperCase()}
            </div>
          )}

          {/* Speaking waveform bars */}
          {p.speaking && !p.muted && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center items-end gap-[2px]">
              {[3,6,4,7,3,5,4].map((h, i) => (
                <motion.div key={i} className="w-[2px] rounded-full"
                  style={{ background: GOLD, height: h }}
                  animate={{ height: [h, h * 2.8, h] }}
                  transition={{ duration: 0.38, repeat: Infinity, delay: i * 0.07 }} />
              ))}
            </div>
          )}
        </div>

        {/* Muted badge */}
        {p.muted && (
          <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
            style={{ background: '#EF4444', border: `2px solid ${BG}` }}>
            <MicOff className="w-2 h-2 text-white" />
          </div>
        )}

        {/* Crown */}
        {(isHost || isCohost) && (
          <div className="absolute -top-1 left-0 right-0 flex justify-center">
            <Crown className="w-3 h-3 drop-shadow" style={{ color: GOLD }} />
          </div>
        )}
      </div>

      {/* Name + role label */}
      <div className="text-center" style={{ maxWidth: size + 8 }}>
        <p className="text-[11px] font-bold text-white leading-none truncate">{p.name}</p>
        {(isHost || isCohost) && (
          <p className="text-[11px] mt-0.5 font-semibold" style={{ color: GOLD + 'BB' }}>
            {isHost ? 'Host' : 'Co-host'}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Small octagonal audience tile ─────────────────────────────────────────────
function AudienceTile({ p }) {
  const color = avatarColor(p.name);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 48, height: 48 }}>
        <div className="absolute inset-0"
          style={{ clipPath: OCT, background: 'rgba(255,255,255,0.07)' }} />
        <div className="absolute inset-[2px] overflow-hidden flex items-center justify-center"
          style={{ clipPath: OCT, background: `linear-gradient(135deg, #1A0F0A, ${BG2})` }}>
          <span className="text-xs font-black" style={{ color }}>
            {p.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      <p className="text-[11px] text-white/35 truncate leading-none" style={{ maxWidth: 48 }}>
        {p.name.split(' ')[0]}
      </p>
    </div>
  );
}

// ── Slide-up chat panel ────────────────────────────────────────────────────────
function ChatPanel({ messages, onClose, onSend }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function submit() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl overflow-hidden"
      style={{ height: '62vh', background: BG3, borderTop: `1px solid rgba(212,175,55,0.18)` }}
    >
      {/* Drag handle */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/15" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="text-sm font-black uppercase tracking-wide text-white"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Room Chat</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold uppercase"
          style={{ background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}44` }}>LIVE</span>
        <button onClick={onClose}><X className="w-4 h-4 text-white/40" /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.map(m => (
          <div key={m.id} className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black"
              style={{ background: avatarColor(m.user) + '44', color: avatarColor(m.user) }}>
              {m.user.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className="text-[10px] font-bold"
                  style={{ color: m.host ? GOLD : 'rgba(255,255,255,0.55)' }}>{m.user}</span>
                {m.host && (
                  <span className="text-[7px] px-1 py-0.5 rounded font-bold uppercase"
                    style={{ background: `${GOLD}22`, color: GOLD }}>HOST</span>
                )}
                {m.fm && (
                  <span className="text-[7px] px-1 py-0.5 rounded font-bold uppercase"
                    style={{ background: 'rgba(128,0,32,0.35)', color: '#FF9944', border: '1px solid rgba(255,153,68,0.3)' }}>FM</span>
                )}
              </div>
              <p className="text-[12px] text-white/80 leading-snug">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input / sign-in prompt */}
      <div className="shrink-0 flex gap-2 px-3 py-2.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: BG2 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Say something…"
          className="flex-1 h-9 px-3 rounded-xl text-sm text-white placeholder:text-white/25 outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <button onClick={submit}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${CRIMSON}, #A0003A)`, border: `1px solid ${GOLD}44` }}>
          <Send className="w-3.5 h-3.5" style={{ color: GOLD }} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function LiveRoom() {
  const urlParams    = new URLSearchParams(window.location.search);
  const roomId       = urlParams.get('id');
  const joinAs       = urlParams.get('join_as');   // 'co-host' | 'guest' | null
  const inviteKey    = urlParams.get('ik');

  // Store invite role so it survives a login redirect
  if (joinAs && typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('swl_pending_role', joinAs);
    sessionStorage.setItem('swl_pending_room', roomId || '');
  }

  // Real camera + peer mesh (falls back gracefully when no roomId)
  const { localStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo } = useLocalMedia({ audio: true, video: { facingMode: 'user' } });
  const { remoteStreams, peerUserIds, announceJoin } = useWebRTCPeers(roomId, localStream);

  // Fetch real room members if roomId provided
  const { data: user }    = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: members = [] } = useQuery({
    queryKey: ['room-members', roomId],
    queryFn: () => base44.entities.WatchPartyMember.filter({ party_id: roomId, is_active: true }),
    enabled: !!roomId,
    refetchInterval: 10000,
  });
  const { data: party } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => base44.entities.WatchParty.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
  });

  const isExclusiveStream = party?.is_exclusive === true;
  const isHost   = user?.id && party?.host_id && user.id === party.host_id;
  const isCoHost = !isHost && members.some(m => m.user_id === user?.id && m.role === 'co-host');

  const { data: activeSubs = [] } = useQuery({
    queryKey: ['user-subscriptions', user?.id, party?.host_id],
    queryFn: () => base44.entities.Subscription.filter({ user_id: user.id, creator_id: party.host_id, status: 'active' }),
    enabled: !!user?.id && !!party?.host_id && isExclusiveStream && !isHost,
  });

  const isSubscribed = activeSubs.length > 0;
  const showExclusiveGate = isExclusiveStream && !isHost && !isSubscribed && !!party;

  const isPrivateRoom = party?.is_private === true;
  const [approvalStatus, setApprovalStatus] = React.useState('none'); // 'none' | 'pending' | 'approved'
  const showPrivateGate = isPrivateRoom && !isHost && !isCoHost && approvalStatus !== 'approved' && !!party;

  async function requestJoin() {
    setApprovalStatus('pending');
    try {
      await base44.entities.WatchPartyMember.create({
        party_id: roomId,
        user_id: user?.id,
        user_name: user?.full_name || 'Viewer',
        role: 'audience',
        join_request: 'pending',
        is_active: false,
      });
    } catch { /* ignore — record may exist */ }
  }

  const [paywallVisible, setPaywallVisible] = React.useState(false);
  const [previewSecondsLeft, setPreviewSecondsLeft] = React.useState(120);
  React.useEffect(() => {
    if (!isExclusiveStream || isHost || isSubscribed || !party || showExclusiveGate) return;
    const t = setInterval(() => {
      setPreviewSecondsLeft(s => {
        if (s <= 1) { clearInterval(t); setPaywallVisible(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isExclusiveStream, isHost, isSubscribed, party, showExclusiveGate]);

  // Deduplicate — keep one record per user_id (latest by created_date)
  const dedupedMembers = React.useMemo(() => {
    if (!roomId || !members.length) return [];
    const seen = new Map();
    members.forEach(m => {
      const key = m.user_id || m.id;
      const existing = seen.get(key);
      if (!existing || (m.created_date || '') > (existing.created_date || '')) {
        seen.set(key, m);
      }
    });
    return Array.from(seen.values());
  }, [members, roomId]);

  const stageMembers = dedupedMembers.filter(m =>
    m.role && ['host', 'co-host', 'speaker', 'guest'].includes(m.role)
  );
  const audienceMembers = dedupedMembers.filter(m =>
    !m.role || m.role === 'audience'
  );

  // Build stage from real members or demo data
  const stage = roomId && stageMembers.length > 0
    ? stageMembers.slice(0, 20).map((m, i) => ({
        id:       m.id,
        name:     m.user_name || 'Guest',
        role:     m.user_id === party?.host_id ? 'host' : m.role || 'speaker',
        speaking: false,
        muted:    m.is_audio_enabled === false,
        userId:   m.user_id,
        vdoSeat:  i + 1,
      }))
    // Demo mode: give first tile the current user's ID so local camera appears
    : user
      ? [{ ...DEMO_STAGE[0], userId: user.id, name: user.full_name || 'You' }, ...DEMO_STAGE.slice(1)]
      : DEMO_STAGE;

  const audience = roomId && members.length > 0
    ? audienceMembers.map(m => ({ id: m.id, name: m.user_name || 'Viewer' }))
    : DEMO_AUDIENCE;

  const roomTitle  = party?.title || (roomId ? 'Live Room' : 'Demo Room');
  const hostName   = party ? (members.find(m => m.user_id === party.host_id)?.user_name || 'Host') : 'SwanyThree';
  const liveCount  = members.length || 20;
  const isLive     = !roomId || members.length > 0 || (remoteStreams?.size ?? 0) > 0;

  // Local UI state
  const [stageData, setStageData]   = useState(stage);
  const [spotlit, setSpotlit]       = useState(null);
  const [chatOpen, setChatOpen]     = useState(false);
  const [chatMsgs, setChatMsgs]     = useState(DEMO_CHAT);
  const [unread, setUnread]         = useState(0);
  const [liked, setLiked]           = useState(false);
  const [likeCount, setLikeCount]   = useState(3);
  const [handRaised, setHandRaised] = useState(false);
  const [shareOpen, setShareOpen]   = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [payOpen, setPayOpen]       = useState(false);
  const [giftOpen, setGiftOpen]     = useState(false);
  const [animGiftOpen, setAnimGiftOpen] = useState(false);
  const [zegoJoined, setZegoJoined]   = useState(false);
  const [reportOpen, setReportOpen]   = useState(false);
  const [giftEvent, setGiftEvent]   = useState(null);
  const lastGiftTsRef               = useRef(0);
  const [joinNotif, setJoinNotif]   = useState(null);
  const prevMemberCountRef           = useRef(0);
  const [gateComplete, setGateComplete] = useState(false);
  const [showNameModal, setShowNameModal]   = useState(false);
  const [editName, setEditName]             = useState('');
  const [giftLeaderboard, setGiftLeaderboard] = useState([]); // [{userId, name, total, lastGift, combo}]
  const [giftCombo, setGiftCombo] = useState(null); // {emoji, count, color} - shown as overlay for 2s
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // V45: stream duration timer (HH:MM:SS)
  const [streamDuration, setStreamDuration] = useState(0); // seconds
  useEffect(() => {
    if (!isLive) return;
    const t = setInterval(() => setStreamDuration(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [isLive]);
  function fmtDuration(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    return [h, m, sc].map(v => String(v).padStart(2, '0')).join(':');
  }

  // V45: live viewer ticker (simulated ±)
  const [viewerCount, setViewerCount] = useState(liveCount);
  useEffect(() => {
    const t = setInterval(() => {
      setViewerCount(c => Math.max(1, c + (Math.random() > 0.45 ? 1 : -1)));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // PKBattle + InviteGuests modals
  const [pkBattleOpen, setPkBattleOpen] = useState(false);
  const [inviteGuestsOpen, setInviteGuestsOpen] = useState(false);

  // Feature: SuperChatRail
  const [superchats, setSuperchats] = useState([]);

  // Feature: Room Link modal
  const [roomLinkOpen, setRoomLinkOpen] = useState(false);
  const [roomLinkCopied, setRoomLinkCopied] = useState(false);

  // Feature: Stream Goals
  const [goalsOpen, setGoalsOpen] = useState(false);

  // Feature: Breakout Rooms
  const [breakoutOpen, setBreakoutOpen] = useState(false);

  // Feature: ClipMarker stream start timestamp
  const streamStartRef = useRef(Date.now());

  // V45: sponsor overlay
  const [sponsorActive, setSponsorActive] = useState(false);
  const [sponsorData, setSponsorData] = useState({ name: '', logoUrl: '', cta: '' });
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);

  // Announce presence to peers for WebRTC discovery
  useEffect(() => {
    if (!roomId || !user?.id) return;
    announceJoin(user.id);
  }, [roomId, user?.id]);

  // Apply pending invite role when user logs in and arrives at the room
  useEffect(() => {
    if (!user?.id || !roomId) return;
    const pendingRole = joinAs || sessionStorage.getItem('swl_pending_role');
    const pendingRoom = sessionStorage.getItem('swl_pending_room');
    if (!pendingRole) return;
    if (pendingRoom && pendingRoom !== roomId) return; // different room
    // Clear immediately so we don't re-apply on re-renders
    sessionStorage.removeItem('swl_pending_role');
    sessionStorage.removeItem('swl_pending_room');
    // Enforce age requirements for invited roles
    const ageLevel = getAccessLevel(getStoredAge());
    let effectiveRole = pendingRole;
    if (pendingRole === 'co-host' && ageLevel !== 'host') effectiveRole = 'audience';
    else if (pendingRole === 'guest' && (ageLevel === 'blocked' || ageLevel === null)) effectiveRole = 'audience';
    // Find existing membership and update role
    (async () => {
      try {
        const existing = await base44.entities.WatchPartyMember.filter({ party_id: roomId, user_id: user.id });
        if (existing && existing.length > 0) {
          const m = existing[0];
          if (m.role === 'audience' || !m.role) {
            await base44.entities.WatchPartyMember.update(m.id, { role: effectiveRole });
          }
        } else {
          await base44.entities.WatchPartyMember.create({ party_id: roomId, user_id: user.id, user_name: user.full_name || user.email, role: effectiveRole, is_active: true });
        }
      } catch {}
    })();
  }, [user?.id, roomId]);

  // Auto-create/update member record when signed-in user enters room
  useEffect(() => {
    if (!user?.id || !roomId || !party?.id) return;
    const myName = user.full_name || user.email?.split('@')[0] || 'Guest';
    const myMember = members.find(m => m.user_id === user.id);
    if (!myMember) {
      base44.entities.WatchPartyMember.create({
        party_id: roomId,
        user_id: user.id,
        user_name: myName,
        role: 'audience',
        is_active: true,
      }).catch(() => {});
    } else if (user.full_name && myMember.user_name !== user.full_name) {
      base44.entities.WatchPartyMember.update(myMember.id, {
        user_name: user.full_name,
      }).catch(() => {});
    }
  }, [user?.id, user?.full_name, roomId, party?.id, members.length]);

  // Sync stage when real data or current user changes
  useEffect(() => { if (stage.length) setStageData(stage); }, [members, user?.id]);

  // Simulate rotating speaker in demo mode
  useEffect(() => {
    if (roomId) return;
    let idx = 0;
    const t = setInterval(() => {
      idx = (idx + 1) % DEMO_STAGE.length;
      setStageData(prev => prev.map((s, i) => ({ ...s, speaking: i === idx && !s.muted })));
    }, 4500);
    return () => clearInterval(t);
  }, [roomId]);

  const activeSpeaker = stageData.find(s => s.speaking);

  // Ensure the local user always has a tile (handles demo mode + initial load before members arrive)
  const selfInStage = user?.id && stageData.some(p => p.userId === user.id);
  const displayStage = (user?.id && !selfInStage)
    ? [{ id: 'local-self', userId: user.id, name: user.full_name || user.email?.split('@')[0] || 'You',
         role: isHost ? 'host' : isCoHost ? 'co-host' : 'speaker', speaking: false, muted: !audioEnabled },
       ...stageData.slice(0, 19)]
    : stageData;

  const stageCols = displayStage.length <= 4 ? 2 : displayStage.length <= 9 ? 3 : 4;
  const tileSize  = stageCols === 2 ? 120 : stageCols === 3 ? 88 : 72;

  function resolveStream(memberId, userId) {
    if (memberId === 'local-self' || (user?.id && userId === user.id)) {
      return { stream: localStream, isLocal: true };
    }
    const peerId = Array.from((peerUserIds || new Map()).entries())
      .find(([, uid]) => uid === userId)?.[0];
    return { stream: peerId ? remoteStreams?.get(peerId) : null, isLocal: false };
  }

  // Real-time member roster sync
  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.WatchPartyMember.subscribe((event) => {
      if (event.data?.party_id !== roomId) return;
      // queryClient not available here — data refetches on interval
    });
    return unsub;
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !user?.id) return;
    const iv = setInterval(async () => {
      try {
        const tips = await base44.entities.Tip.filter({ room_id: roomId, type: 'gift' });
        const newest = tips
          .filter(t => t.user_id !== user.id)
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        if (newest) {
          const ts = new Date(newest.created_date).getTime();
          if (ts > lastGiftTsRef.current) {
            lastGiftTsRef.current = ts;
            const { GIFTS } = await import('../components/live/GiftShop');
            const gift = GIFTS.find(g => g.id === newest.gift_id) || {
              emoji: newest.gift_emoji || '🎁',
              name:  newest.gift_name  || 'Gift',
              color: '#D4AF37',
              price: newest.amount || 0,
            };
            setGiftEvent({ id: ts, gift, senderName: newest.sender_name || 'Guest' });
          }
        }
      } catch {}
    }, 4000);
    return () => clearInterval(iv);
  }, [roomId, user?.id]);

  useEffect(() => {
    if (!roomId || !members.length) return;
    const prev = prevMemberCountRef.current;
    if (members.length > prev && prev > 0) {
      const newest = members[members.length - 1];
      setJoinNotif({ name: newest.user_name || 'Someone' });
      const t = setTimeout(() => setJoinNotif(null), 3500);
      return () => clearTimeout(t);
    }
    prevMemberCountRef.current = members.length;
  }, [members.length]);

  function recordGift(senderId, senderName, gift) {
    setGiftLeaderboard(prev => {
      const idx = prev.findIndex(r => r.userId === senderId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          total: updated[idx].total + (gift.price || 0),
          lastGift: gift.emoji,
          combo: updated[idx].lastGift === gift.emoji ? (updated[idx].combo || 1) + 1 : 1,
        };
        return updated.sort((a, b) => b.total - a.total);
      }
      return [...prev, { userId: senderId, name: senderName, total: gift.price || 0, lastGift: gift.emoji, combo: 1 }]
        .sort((a, b) => b.total - a.total);
    });
    // Show combo overlay if gift was sent by me
    if (senderId === user?.id) {
      setGiftCombo({ emoji: gift.emoji, color: gift.color || '#D4AF37' });
      setTimeout(() => setGiftCombo(null), 2000);
    }
  }

  function openChat()  { setChatOpen(true); setUnread(0); }
  function sendChat(rawText) {
    const { blocked } = filterMessageWithGuardianAI(rawText);
    if (blocked) return; // silently drop — Guardian AI filtered it
    const isFM = user?.is_founding_member === true;
    const displayName = (user?.full_name || 'You') + (isFM ? ' [FM]' : '');
    // Super chat: message starting with $amount
    const scMatch = rawText.match(/^\$(\d+(?:\.\d{1,2})?)\s*(.*)/);
    if (scMatch) {
      const entry = {
        id: Date.now(),
        user: displayName,
        amount: parseFloat(scMatch[1]),
        message: scMatch[2] || '',
      };
      setSuperchats(s => [...s.slice(-9), entry]);
    }
    setChatMsgs(p => [...p, { id: Date.now(), user: displayName, text: rawText, host: isHost || isCoHost, fm: isFM }]);
  }
  function handleLike() { setLiked(l => !l); setLikeCount(c => liked ? c - 1 : c + 1); }

  // Determine entry role for the gate — wait for party data when a roomId is present
  // so a host always gets the 21+ gate, not the audience (18+) gate
  const partyReady = !roomId || party !== undefined;
  const entryRole  = isHost ? 'host' : isCoHost ? 'co-host' : 'audience';

  // Hold until party data resolves, then show the gate
  if (user && !gateComplete) {
    if (!partyReady) {
      return (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#080B18' }}>
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#D4AF37' }} />
        </div>
      );
    }
    return (
      <RoomEntryGate
        role={entryRole}
        user={user}
        onPass={() => setGateComplete(true)}
        onRoleDowngrade={() => setGateComplete(true)}
        onExit={() => window.history.back()}
      />
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: BG, fontFamily: 'Barlow Condensed, sans-serif' }}>

      {/* ── Gift combo VFX overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {giftCombo && (
          <motion.div
            key="combo"
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1.2, opacity: 1, y: 0 }}
            exit={{ scale: 1.5, opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[200] pointer-events-none text-center"
          >
            <div className="text-6xl">{giftCombo.emoji}</div>
            <div className="font-black text-xl mt-1" style={{ color: giftCombo.color, fontFamily: 'Barlow Condensed, sans-serif', textShadow: `0 0 20px ${giftCombo.color}` }}>
              GIFT SENT! ✨
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)' }}
          onClick={() => history.back()}>
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>

        {/* Stream timer */}
        {isLive && (
          <div className="shrink-0 px-2 py-0.5 rounded-md font-black text-[11px] tabular-nums"
            style={{ background: `${CRIMSON}22`, color: PINK, border: `1px solid ${PINK}33`, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em' }}>
            {fmtDuration(streamDuration)}
          </div>
        )}

        <h1 className="flex-1 text-sm font-bold text-white truncate">{roomTitle}</h1>

        {/* Viewer count ticker */}
        <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Users className="w-2.5 h-2.5 text-white/40" />
          <span className="text-[11px] font-bold text-white/50" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{viewerCount}</span>
        </div>

        {/* Audience engagement pulse — visible to host & co-host */}
        {(isHost || isCoHost) && roomId && (
          <LiveAudiencePulse roomId={roomId} isHost={isHost} viewerCount={viewerCount} />
        )}

        {/* Sponsor badge (when active) */}
        {sponsorActive && sponsorData.name && (
          <div className="shrink-0 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wide"
            style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}33`, fontFamily: 'Barlow Condensed, sans-serif' }}>
            ★ {sponsorData.name}
          </div>
        )}

        {/* Host: sponsor button */}
        {isHost && (
          <button onClick={() => setSponsorModalOpen(true)}
            className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{ background: `rgba(212,175,55,0.1)`, border: `1px solid rgba(212,175,55,0.25)` }}
            title="Manage sponsor overlay">
            <span className="text-[10px]">★</span>
          </button>
        )}

        <button className="w-7 h-7 flex items-center justify-center" onClick={() => setShareOpen(true)}>
          <Share2 className="w-4 h-4 text-white/40" />
        </button>
        {(isHost || isCoHost) && (
          <button onClick={() => setInviteOpen(true)}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-all"
            style={{ background: `rgba(212,175,55,0.15)`, border: `1px solid rgba(212,175,55,0.3)` }}
            title="Invite people">
            <UserPlus className="w-3.5 h-3.5" style={{ color: GOLD }} />
          </button>
        )}
        <button className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <Minus className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>

      {/* Sponsor overlay banner */}
      <AnimatePresence>
        {sponsorActive && sponsorData.name && (
          <motion.div
            initial={{ y: -32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -32, opacity: 0 }}
            className="w-full flex items-center gap-3 px-4 py-1.5 shrink-0"
            style={{ background: `linear-gradient(90deg, ${GOLD}18, ${CRIMSON}18)`, borderBottom: `1px solid ${GOLD}22` }}>
            {sponsorData.logoUrl && (
              <img src={sponsorData.logoUrl} alt={sponsorData.name} className="h-5 w-auto object-contain rounded" />
            )}
            <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
              Sponsored by {sponsorData.name}
            </span>
            {sponsorData.cta && (
              <span className="ml-auto text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                {sponsorData.cta}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SuperChatRail ────────────────────────────────────────────────────── */}
      {superchats.length > 0 && (
        <div className="shrink-0">
          <SuperChatRail superchats={superchats} />
        </div>
      )}

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 88 }}>

        {/* Room meta row */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-3 flex-wrap">
          {/* Host */}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black"
              style={{ background: avatarColor(hostName) + '55', color: avatarColor(hostName), border: `1.5px solid ${avatarColor(hostName)}` }}>
              {hostName.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-white/60">{hostName}</span>
          </div>
          {/* Counts */}
          <div className="flex items-center gap-2 text-[10px] text-white/35">
            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{liveCount}</span>
            <span>•</span>
            <span>{liveCount} here now</span>
          </div>
          {/* Active speaker */}
          {activeSpeaker && (
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black"
                style={{ background: avatarColor(activeSpeaker.name) + '55', color: avatarColor(activeSpeaker.name) }}>
                {activeSpeaker.name.charAt(0)}
              </div>
              <span className="text-[10px] text-white/40">{activeSpeaker.name.split(' ')[0]} is speaking</span>
            </div>
          )}
        </div>

        {/* LIVE + SeeWhy badge row */}
        <div className="px-4 pb-3 flex items-center gap-2">
          {isLive ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: `${PINK}1A`, border: `1px solid ${PINK}44` }}>
              <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: PINK }}
                animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
              <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: PINK }}>Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Waiting to go live</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Radio className="w-2.5 h-2.5" style={{ color: GOLD }} />
            <span className="text-[11px] font-semibold" style={{ color: GOLD }}>SeeWhy LIVE</span>
          </div>
          {isExclusiveStream && !isHost && !isSubscribed && !paywallVisible && previewSecondsLeft < 120 && (
            <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <span className="text-[10px] font-black" style={{ color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>
                Free preview: {previewSecondsLeft}s
              </span>
            </div>
          )}
        </div>

        {/* ── Stage header ─────────────────────────────────────────────────── */}
        <div className="px-4 mb-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[17px] font-black text-white">Stage</span>
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {displayStage.length}/20
            </span>
          </div>
          <button
            onClick={() => setSpotlit(null)}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <LayoutGrid className="w-3.5 h-3.5 text-white/40" />
          </button>
        </div>

        {/* ── Stage grid ────────────────────────────────────────────────────── */}
        <div className="px-3 mb-5">
          {spotlit ? (
            /* Spotlight mode */
            <div className="space-y-4">
              <div className="flex justify-center py-3">
                {(() => {
                  const { stream, isLocal } = resolveStream(spotlit.id, spotlit.userId);
                  const vdoUrl = roomId && spotlit.vdoSeat && !stream ? buildVdoViewUrl(roomId, spotlit.vdoSeat) : null;
                  return <StageTile p={spotlit} size={170} stream={stream} isLocal={isLocal} vdoUrl={vdoUrl} onClick={() => setSpotlit(null)} />;
                })()}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 px-1">
                {displayStage.filter(s => s.id !== spotlit.id).map(p => {
                  const { stream, isLocal } = resolveStream(p.id, p.userId);
                  const vdoUrl = roomId && p.vdoSeat && !stream ? buildVdoViewUrl(roomId, p.vdoSeat) : null;
                  return (
                    <div key={p.id} className="shrink-0">
                      <StageTile p={p} size={72} stream={stream} isLocal={isLocal} vdoUrl={vdoUrl} onClick={() => setSpotlit(p)} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <motion.div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${stageCols}, 1fr)` }}
              variants={{ show: { transition: { staggerChildren: 0.08 } } }}
              initial="hidden"
              animate="show">
              <AnimatePresence>
                {displayStage.map(p => {
                  const { stream, isLocal } = resolveStream(p.id, p.userId);
                  const vdoUrl = roomId && p.vdoSeat && !stream ? buildVdoViewUrl(roomId, p.vdoSeat) : null;
                  return (
                    <motion.div key={p.id} layout
                      variants={{
                        hidden: { opacity: 0, scale: 0.75, y: 18 },
                        show:   { opacity: 1, scale: 1,    y: 0,
                                  transition: { type: 'spring', damping: 22, stiffness: 280 } }
                      }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      className="flex justify-center">
                      <StageTile p={p} size={tileSize} stream={stream} isLocal={isLocal} vdoUrl={vdoUrl}
                        onClick={() => setSpotlit(p)} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* ── Golden Wall: live tips & gifts ───────────────────────────────── */}
        {roomId && (
          <div className="px-3 mb-4">
            <GoldenWall roomId={roomId} isExpanded />
          </div>
        )}

        {/* ── Viewer loyalty card for this creator ─────────────────────────── */}
        {user?.id && party?.host_id && user.id !== party.host_id && (
          <div className="px-3 mb-4">
            <ViewerLoyaltyCard userId={user.id} creatorId={party.host_id} compact />
          </div>
        )}

        {user?.id && party?.id && (
          <div className="px-3 mb-4">
            <PointsEarnWidget userId={user.id} creatorId={party.host_id || ''} roomId={party.id} isHost={isHost} />
          </div>
        )}

        {/* Virtual currency tips */}
        {user?.id && party?.host_id && (
          <div className="px-3 mb-4">
            <VirtualCurrencyTips roomId={party.id} creatorId={party.host_id} currentUser={user} isHost={isHost} />
          </div>
        )}

        {/* Super chat bar */}
        {user?.id && party?.host_id && (
          <div className="px-3 mb-4">
            <SuperChatBar roomId={party.id} currentUser={user} recipientId={party.host_id} recipientName={party.host_name || ''} />
          </div>
        )}

        {/* Realtime leaderboard */}
        {party?.id && party?.host_id && (
          <div className="px-3 mb-4">
            <RealtimeLeaderboard roomId={party.id} creatorId={party.host_id} />
          </div>
        )}

        {/* Leaderboard panel */}
        {party?.id && (
          <div className="px-3 mb-4">
            <LeaderboardPanel roomId={party.id} />
          </div>
        )}

        {/* ── Audience section ──────────────────────────────────────────────── */}
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Others in the Room
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <Users className="w-3 h-3" />
              <span className="text-[10px]">{audience.length}</span>
            </div>
          </div>
          <motion.div
            className="grid grid-cols-5 gap-x-2 gap-y-3"
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            initial="hidden"
            animate="show">
            {audience.map(p => (
              <motion.div
                key={p.id}
                className="flex justify-center"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show:   { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 260 } }
                }}>
                <AudienceTile p={p} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ── App shortcut carousel ─────────────────────────────────────────── */}
        <div className="px-3 pb-3">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[
              { label: 'Auction',      icon: '🏆', bg: 'rgba(212,175,55,0.08)'  },
              { label: 'Destinations', icon: '📍', bg: 'rgba(0,200,200,0.06)'   },
              { label: 'AI Trip',      icon: '🤖', bg: 'rgba(212,175,55,0.08)'  },
              { label: 'Pay',          icon: '💸', bg: 'rgba(255,21,100,0.08)', action: () => setPayOpen(true) },
              { label: 'Battle',    icon: '⚔️', bg: 'rgba(212,175,55,0.08)', action: () => (isHost || isCoHost) && setPkBattleOpen(true) },
              { label: 'Invite',    icon: '🤝', bg: 'rgba(109,191,126,0.07)', action: () => setInviteGuestsOpen(true) },
              { label: 'Room Link', icon: '🔗', bg: 'rgba(109,191,126,0.07)', action: () => setRoomLinkOpen(true) },
              { label: 'Goals',     icon: '🎯', bg: 'rgba(34,197,94,0.08)',   action: () => setGoalsOpen(true) },
              { label: 'Breakout',  icon: '🔀', bg: 'rgba(167,139,250,0.08)', action: () => (isHost || isCoHost) && setBreakoutOpen(true) },
            ].map(s => (
              <motion.div key={s.label} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                onClick={s.action}
                whileTap={{ scale: 0.82 }}
                whileHover={{ scale: 1.12 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{ userSelect: 'none' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                  style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
                  {s.icon}
                </div>
                <span className="text-[11px] text-white/30">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Anonymous viewer banner ───────────────────────────────────────────── */}
      {!user && (
        <div className="fixed bottom-[76px] inset-x-0 z-30 px-4">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(13,6,24,0.96)', border: '1px solid rgba(212,175,55,0.18)', backdropFilter: 'blur(12px)' }}>
            <span className="text-[11px] text-white/50" style={{ fontFamily: 'Barlow Condensed, sans-serif', flex: 1 }}>
              👁 Watching as guest — sign in to chat, tip, and join the stage
            </span>
            <a href={`/login?from_url=${encodeURIComponent(window.location.href)}`}
              className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wide"
              style={{ background: `linear-gradient(135deg, #800020, #A0003A)`, color: GOLD, textDecoration: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Sign In
            </a>
          </div>
        </div>
      )}

      {/* ── Fixed bottom toolbar ──────────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: `linear-gradient(to top, ${BG} 70%, ${BG}00)`, backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Leave */}
        <button className="text-[13px] font-black uppercase tracking-wide" style={{ color: PINK }}>
          Leave room
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-3">

          {/* Chat */}
          <button onClick={openChat} className="relative flex flex-col items-center gap-0.5">
            <motion.div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: chatOpen ? `${GOLD}15` : 'rgba(255,255,255,0.07)', border: chatOpen ? `1px solid ${GOLD}44` : '1px solid rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.82 }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <MessageCircle className="w-4 h-4 text-white" />
            </motion.div>
            {unread > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ background: PINK, color: '#fff' }}>{unread}</div>
            )}
            <span className="text-[11px] text-white/35">Chat</span>
          </button>

          {/* Heart */}
          <button onClick={handleLike} className="flex flex-col items-center gap-0.5">
            <motion.div
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
              style={{ background: liked ? `${PINK}1A` : 'rgba(255,255,255,0.07)', border: liked ? `1px solid ${PINK}55` : '1px solid rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.82 }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <Heart className="w-4 h-4 transition-all"
                style={{ color: liked ? PINK : 'rgba(255,255,255,0.6)', fill: liked ? PINK : 'none' }} />
            </motion.div>
            <span className="text-[11px]" style={{ color: liked ? PINK : 'rgba(255,255,255,0.35)' }}>{likeCount}</span>
          </button>

          {/* Hand raise */}
          <button onClick={() => {
            setHandRaised(h => !h);
          }} className="flex flex-col items-center gap-0.5">
            <motion.div
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
              style={{ background: handRaised ? `${GOLD}1A` : 'rgba(255,255,255,0.07)', border: handRaised ? `1px solid ${GOLD}55` : '1px solid rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.82 }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <Hand className="w-4 h-4 transition-all" style={{ color: handRaised ? GOLD : 'rgba(255,255,255,0.6)' }} />
            </motion.div>
            <span className="text-[11px] text-white/35"> </span>
          </button>

          {/* Gift Leaderboard */}
          <button onClick={() => setShowLeaderboard(l => !l)} className="flex flex-col items-center gap-0.5">
            <motion.div
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
              style={{ background: showLeaderboard ? `${GOLD}1A` : 'rgba(255,255,255,0.07)', border: showLeaderboard ? `1px solid ${GOLD}55` : '1px solid rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.82 }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <Trophy className="w-4 h-4 transition-all" style={{ color: showLeaderboard ? GOLD : 'rgba(255,255,255,0.6)' }} />
            </motion.div>
            <span className="text-[11px] text-white/35">Top</span>
          </button>

          {/* Gift */}
          {party && party?.host_id !== user?.id && (
            <button onClick={() => setGiftOpen(true)} className="flex flex-col items-center gap-0.5">
              <motion.div
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}44` }}
                whileTap={{ scale: 0.82 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <Gift className="w-4 h-4" style={{ color: GOLD }} />
              </motion.div>
              <span className="text-[11px]" style={{ color: GOLD }}>Gift</span>
            </button>
          )}

          {/* Tip */}
          {party && (
            <div className="flex flex-col items-center gap-0.5">
              <TipWidget roomId={roomId} hostId={party?.host_id} currentUser={user} />
              <span className="text-[11px] text-white/35">Tip</span>
            </div>
          )}

          {/* ClipMarker (host / co-host) */}
          {(isHost || isCoHost) && (
            <div className="flex flex-col items-center gap-0.5">
              <ClipMarker roomId={roomId} user={user} streamStartTs={streamStartRef.current} />
              <span className="text-[11px] text-white/35">Clip</span>
            </div>
          )}

          {/* Edit Name (host / co-host) */}
          {(isHost || isCoHost) && (
            <button onClick={() => { setEditName(user?.full_name || ''); setShowNameModal(true); }}
              className="flex flex-col items-center gap-0.5">
              <div className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}>
                <span className="text-sm">✏️</span>
              </div>
              <span className="text-[11px]" style={{ color: 'rgba(212,175,55,0.7)' }}>Name</span>
            </button>
          )}

          {/* Mic / Sign-in gate */}
          {user ? (
            <>
              {/* Camera toggle */}
              <button onClick={() => {
                toggleVideo();
              }} className="flex flex-col items-center gap-0.5">
                <motion.div
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                  style={{ background: !videoEnabled ? 'rgba(239,68,68,0.15)' : `${GOLD}1A`, border: !videoEnabled ? '1px solid rgba(239,68,68,0.4)' : `1px solid ${GOLD}55` }}
                  whileTap={{ scale: 0.82 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                  {!videoEnabled
                    ? <VideoOff className="w-4 h-4 text-red-400" />
                    : <Video className="w-4 h-4" style={{ color: GOLD }} />}
                </motion.div>
                <span className="text-[11px] text-white/35">Cam</span>
              </button>
              {/* Mic toggle */}
              <button onClick={() => {
                toggleAudio();
              }} className="flex flex-col items-center gap-0.5">
                <motion.div
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                  style={{ background: !audioEnabled ? 'rgba(239,68,68,0.15)' : `${GOLD}1A`, border: !audioEnabled ? '1px solid rgba(239,68,68,0.4)' : `1px solid ${GOLD}55` }}
                  whileTap={{ scale: 0.82 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                  {!audioEnabled
                    ? <MicOff className="w-4 h-4 text-red-400" />
                    : <Mic className="w-4 h-4" style={{ color: GOLD }} />}
                </motion.div>
                <span className="text-[11px] text-white/35"> </span>
              </button>
            </>
          ) : (
            <a href={`/login?from_url=${encodeURIComponent(window.location.href)}`}
              className="flex flex-col items-center gap-0.5" style={{ textDecoration: 'none' }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <LogIn className="w-4 h-4 text-white/30" />
              </div>
              <span className="text-[9px] text-white/25" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Sign in</span>
            </a>
          )}
        </div>
      </div>

      {/* Join notification */}
      <AnimatePresence>
        {joinNotif && (
          <motion.div
            initial={{ y: 48, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            className="fixed bottom-24 inset-x-0 flex justify-center z-50 px-6 pointer-events-none">
            <div style={{ background: 'rgba(14,17,32,0.92)', border: '1px solid rgba(212,175,55,0.28)', borderRadius: 40, padding: '8px 18px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: avatarColor(joinNotif.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {joinNotif.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                <strong style={{ color: '#D4AF37' }}>{joinNotif.name}</strong> joined the room ✨
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat panel overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.55)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)} />
            <ChatPanel messages={chatMsgs} onClose={() => setChatOpen(false)} onSend={sendChat} />
          </>
        )}
      </AnimatePresence>

      {/* Share modal */}
      <AnimatePresence>
        {shareOpen && (
          <ShareModal
            isOpen={shareOpen}
            onClose={() => setShareOpen(false)}
            url={`${window.location.origin}/LiveRoom?id=${roomId || 'demo'}`}
            title={roomTitle}
          />
        )}
      </AnimatePresence>

      {/* Direct payments sheet */}
      <AnimatePresence>
        {payOpen && (
          <DirectPayments
            isOpen={payOpen}
            onClose={() => setPayOpen(false)}
            creatorName={hostName}
          />
        )}
      </AnimatePresence>

      {(roomId || party?.id) && (
        <LoveHearts roomId={roomId || party?.id} currentUser={user} creatorId={party?.host_id} />
      )}

      {(roomId || party?.id) && party?.host_id !== user?.id && (
        <LoveTap
          roomId={roomId || party?.id}
          user={user}
          creatorId={party?.host_id}
          creatorName={hostName}
        />
      )}

      <GiftShop
        isOpen={giftOpen}
        onClose={() => setGiftOpen(false)}
        roomId={roomId || party?.id}
        user={user}
        creatorId={party?.host_id}
        creatorName={hostName}
        onGiftSent={(gift, sender) => {
          lastGiftTsRef.current = Date.now();
          setGiftEvent({ id: Date.now(), gift, senderName: sender?.full_name || sender?.email || 'You' });
          recordGift(sender?.id || user?.id, sender?.full_name || sender?.email || 'You', gift);
          setGiftOpen(false);
        }}
      />

      <GiftAnimation event={giftEvent} onDone={() => setGiftEvent(null)} />

      {animGiftOpen && (
        <AnimatedGiftShop
          recipientId={party?.host_id}
          roomId={roomId || party?.id}
          onClose={() => setAnimGiftOpen(false)}
        />
      )}

      {/* Tipping overlay (viewer) */}
      {user?.id && party?.host_id && !isHost && (
        <TippingOverlay roomId={roomId || party?.id} creatorId={party.host_id} isVisible />
      )}

      {/* Subscription gate */}
      {party?.host_id && (
        <SubscriptionGate creatorId={party.host_id} roomId={roomId || party?.id} />
      )}

      {/* PPV gate */}
      {!isHost && (roomId || party?.id) && (
        <PayPerViewGate roomId={roomId || party?.id} ppvPrice={4.99} onPurchase={() => {}} />
      )}

      {/* Paywall gate */}
      <PaywallGate isHost={isHost} streamTitle={party?.title || ''} onUnlock={() => {}} isUnlocked={isHost} />

      {/* Points notification */}
      {user?.id && <PointsNotification userId={user.id} />}

      {/* Loyalty badge */}
      {user?.id && party?.host_id && (
        <LoyaltyBadge userId={user.id} creatorId={party.host_id} />
      )}

      {/* Report modal */}
      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} reportedUser={null} roomId={roomId || party?.id} communityId={null} messageId={null} />

      {/* Mobile stream controls */}
      <MobileStreamControls
        micMuted={false}
        onMicToggle={() => {}}
        onReact={() => {}}
        onQuickTip={() => setGiftOpen(true)}
        roomId={roomId || party?.id}
      />

      {!zegoJoined && user?.id && (roomId || party?.id) && (
        <ZEGOGuestJoin
          roomId={roomId || party?.id}
          userId={user.id}
          userName={user.full_name || user.email || 'Guest'}
          onJoined={() => setZegoJoined(true)}
        />
      )}

      {/* Invite sheet */}
      <InviteSheet
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        roomId={roomId}
        roomTitle={roomTitle}
        isHost={isHost}
        isCoHost={isCoHost}
      />



      {/* ── Gift Leaderboard panel ────────────────────────────────────────── */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{ background: 'rgba(8,11,24,0.98)', border: '1px solid rgba(212,175,55,0.15)', maxHeight: '60vh' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
              <h3 className="font-black text-lg text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>🏆 Gift Leaders</h3>
              <button onClick={() => setShowLeaderboard(false)} className="text-white/40 hover:text-white/70">✕</button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(60vh - 64px)' }}>
              {giftLeaderboard.length === 0 ? (
                <div className="text-center py-12 text-white/30 text-sm" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  No gifts yet — be the first! 🎁
                </div>
              ) : giftLeaderboard.slice(0, 10).map((entry, i) => (
                <div key={entry.userId} className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <span className="w-6 text-center font-black text-sm" style={{ color: i === 0 ? '#D4AF37' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                  </span>
                  <span className="text-2xl">{entry.lastGift}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-white text-sm truncate" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{entry.name}</div>
                    {entry.combo > 1 && <div className="text-[10px] font-bold" style={{ color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>×{entry.combo} combo!</div>}
                  </div>
                  <span className="font-black text-sm" style={{ color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    ${entry.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Display name modal ─────────────────────────────────────────────── */}
      {showNameModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-5"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-xs rounded-2xl overflow-hidden"
            style={{ background: '#0E1120', border: '1px solid rgba(212,175,55,0.25)' }}>
            <div className="px-5 pt-5 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="font-black text-base text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Your screen name
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                This is how others see you on stage
              </p>
            </div>
            <div className="p-5 space-y-3">
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                maxLength={32}
                placeholder="Enter your name…"
                className="w-full px-3 py-3 rounded-xl text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.25)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15 }}
              />
              <button
                onClick={async () => {
                  if (!editName.trim()) return;
                  const myMember = members.find(m => m.user_id === user?.id);
                  if (myMember) {
                    await base44.entities.WatchPartyMember.update(myMember.id, { user_name: editName.trim() }).catch(() => {});
                  }
                  try { await base44.auth.updateMe({ full_name: editName.trim() }); } catch {}
                  setShowNameModal(false);
                }}
                disabled={!editName.trim()}
                className="w-full py-3 rounded-xl font-black uppercase text-sm"
                style={{ background: editName.trim() ? '#800020' : 'rgba(128,0,32,0.2)', color: editName.trim() ? '#D4AF37' : 'rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif', userSelect: 'none' }}>
                Set Name
              </button>
              <button onClick={() => setShowNameModal(false)}
                className="w-full py-2 rounded-xl font-black uppercase text-xs"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif', userSelect: 'none' }}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrivateGate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,11,24,0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 360, background: 'rgba(13,6,24,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 56 }}>🔒</span>
            <h2 style={{ margin: 0, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 28, fontWeight: 900 }}>Private Room</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.5 }}>
              {approvalStatus === 'pending'
                ? 'Your request was sent. Waiting for the host to let you in...'
                : `This room is invite-only. Request access from ${hostName}.`}
            </p>
            {approvalStatus === 'none' ? (
              <button
                onClick={requestJoin}
                style={{ width: '100%', padding: '12px 0', background: 'linear-gradient(135deg, #D4AF37, #B8960C)', color: '#080B18', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 15, letterSpacing: '0.05em', borderRadius: 12, border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}
              >Request to Join</button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(212,175,55,0.7)', fontSize: 13 }}>
                <span>⏳</span> Pending approval...
              </div>
            )}
            <button onClick={() => history.back()} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, padding: '10px 0', width: '100%', cursor: 'pointer' }}>Go Back</button>
          </div>
        </div>
      )}

      {showExclusiveGate && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(8,11,24,0.96)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            width: '100%', maxWidth: 360,
            background: 'rgba(13,6,24,0.98)',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 20,
            padding: 32,
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          }}>
            <span style={{ fontSize: 60 }}>🔐</span>
            <h2 style={{ margin: 0, color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 32, fontWeight: 900, letterSpacing: '0.04em' }}>
              Exclusive Live
            </h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.5 }}>
              This stream is for subscribers only
            </p>
            {hostName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #800020, #D4AF37)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 900, fontSize: 14,
                }}>
                  {hostName.charAt(0).toUpperCase()}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{hostName}</span>
              </div>
            )}
            <a
              href={`/CreatorSubscriptions?creator=${party?.host_id}`}
              style={{
                display: 'block', width: '100%',
                padding: '12px 0',
                background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
                color: '#080B18',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 900, fontSize: 15,
                letterSpacing: '0.05em',
                borderRadius: 12, textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Subscribe to Watch
            </a>
            <button
              onClick={() => history.back()}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 12,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 14,
                padding: '10px 0',
                width: '100%',
                cursor: 'pointer',
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* ── PK Battle Modal (host/co-host only) ────────────────────────────── */}
      <AnimatePresence>
        {pkBattleOpen && (
          <PKBattleModal
            isOpen={pkBattleOpen}
            onClose={() => setPkBattleOpen(false)}
            roomId={roomId}
            isHost={isHost}
            currentUser={user}
            hostName={hostName}
          />
        )}
      </AnimatePresence>

      {/* ── Room Link modal ────────────────────────────────────────────────── */}
      {(() => {
        const roomUrl = `${window.location.origin}/LiveRoom?id=${roomId || 'demo'}`;
        return (
          <AnimatePresence>
            {roomLinkOpen && (
              <>
                <motion.div className="fixed inset-0 z-[74]" style={{ background: 'rgba(0,0,0,0.65)' }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setRoomLinkOpen(false)} />
                <motion.div
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed inset-x-0 bottom-0 z-[75] rounded-t-3xl overflow-hidden"
                  style={{ background: '#0E1120', border: '1px solid rgba(212,175,55,0.18)', maxHeight: '60vh' }}>
                  <div className="w-8 h-1 rounded-full bg-white/10 mx-auto mt-3 mb-1" />
                  <div className="px-5 pt-2 pb-2 flex items-center justify-between">
                    <h3 className="font-black text-lg text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>🔗 Room Link</h3>
                    <button onClick={() => setRoomLinkOpen(false)} className="text-white/40 text-xl">✕</button>
                  </div>
                  <div className="px-5 pb-8 space-y-3">
                    <p className="text-[11px] text-white/35" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      Share this link to invite viewers into your room
                    </p>
                    <div className="px-3 py-2.5 rounded-xl break-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                      {roomUrl}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(roomUrl);
                        setRoomLinkCopied(true);
                        setTimeout(() => setRoomLinkCopied(false), 2000);
                      }}
                      className="w-full py-3 rounded-2xl font-black text-sm uppercase tracking-wide"
                      style={{ background: roomLinkCopied ? 'rgba(109,191,126,0.2)' : `linear-gradient(135deg, ${CRIMSON}, #A0003A)`, color: roomLinkCopied ? '#6DBF7E' : GOLD, border: roomLinkCopied ? '1px solid rgba(109,191,126,0.4)' : 'none', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {roomLinkCopied ? '✓ Copied!' : '📋 Copy Link'}
                    </button>
                    <button
                      onClick={() => { if (navigator.share) navigator.share({ title: roomTitle, url: roomUrl }).catch(() => {}); else navigator.clipboard?.writeText(roomUrl); }}
                      className="w-full py-3 rounded-2xl font-black text-sm uppercase tracking-wide"
                      style={{ background: 'transparent', color: GOLD, border: `1px solid rgba(212,175,55,0.3)`, fontFamily: 'Barlow Condensed, sans-serif' }}>
                      📤 Share via…
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        );
      })()}

      {/* ── Invite Guests Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {inviteGuestsOpen && (
          <InviteGuestsModal
            isOpen={inviteGuestsOpen}
            onClose={() => setInviteGuestsOpen(false)}
            roomId={roomId}
            roomTitle={roomTitle}
            currentUser={user}
          />
        )}
      </AnimatePresence>

      {/* ── Stream Goals slide-up panel ─────────────────────────────────────── */}
      <AnimatePresence>
        {goalsOpen && (
          <>
            <motion.div className="fixed inset-0 z-[80]" style={{ background: 'rgba(0,0,0,0.7)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setGoalsOpen(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-[85] rounded-t-3xl overflow-hidden"
              style={{ background: '#0E1120', border: '1px solid rgba(34,197,94,0.2)', maxHeight: '70vh' }}>
              <div className="w-8 h-1 rounded-full bg-white/10 mx-auto mt-3 mb-2" />
              <div className="px-5 pb-2 flex items-center justify-between">
                <h3 className="font-black text-lg text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>🎯 Stream Goals</h3>
                <button onClick={() => setGoalsOpen(false)} className="text-white/40 text-xl">✕</button>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: 'calc(70vh - 70px)' }}>
                <StreamGoals
                  isHost={isHost || isCoHost}
                  currentTips={superchats.reduce((s, sc) => s + (sc.amount || 0), 0)}
                  currentViewers={viewerCount}
                  currentSubs={0}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Breakout Rooms Modal ──────────────────────────────────────────── */}
      <BreakoutRoomsModal
        isOpen={breakoutOpen}
        onClose={() => setBreakoutOpen(false)}
        roomId={roomId}
        roomTitle={roomTitle}
        currentUser={user}
        participants={displayStage || []}
      />

      {/* ── Sponsor Overlay Modal (host only) ──────────────────────────────── */}
      <AnimatePresence>
        {sponsorModalOpen && isHost && (
          <>
            <motion.div className="fixed inset-0 z-[80]" style={{ background: 'rgba(0,0,0,0.75)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSponsorModalOpen(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-[85] rounded-t-3xl overflow-hidden"
              style={{ background: '#0E1120', border: '1px solid rgba(212,175,55,0.2)', maxHeight: '75vh' }}>
              <div className="w-8 h-1 rounded-full bg-white/10 mx-auto mt-3 mb-4" />
              <div className="px-5 pb-2 flex items-center justify-between">
                <h3 className="font-black text-lg text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>★ Sponsor Overlay</h3>
                <button onClick={() => setSponsorModalOpen(false)} className="text-white/40 text-xl">✕</button>
              </div>
              <div className="px-5 pb-8 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(75vh - 80px)' }}>
                <div>
                  <label className="text-[11px] uppercase tracking-wide font-bold text-white/40 mb-1 block" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Sponsor Name</label>
                  <input
                    value={sponsorData.name}
                    onChange={e => setSponsorData(d => ({ ...d, name: e.target.value }))}
                    placeholder="e.g. Domino Social Expo"
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide font-bold text-white/40 mb-1 block" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Logo URL (optional)</label>
                  <input
                    value={sponsorData.logoUrl}
                    onChange={e => setSponsorData(d => ({ ...d, logoUrl: e.target.value }))}
                    placeholder="https://…"
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide font-bold text-white/40 mb-1 block" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Call to Action Text (optional)</label>
                  <input
                    value={sponsorData.cta}
                    onChange={e => setSponsorData(d => ({ ...d, cta: e.target.value }))}
                    placeholder="e.g. Visit booth 4B!"
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}
                  />
                </div>
                <button
                  onClick={() => { setSponsorActive(a => !a); setSponsorModalOpen(false); }}
                  className="w-full py-3 rounded-2xl font-black text-sm uppercase tracking-wide"
                  style={{
                    background: sponsorActive ? 'rgba(239,68,68,0.18)' : `linear-gradient(135deg, ${GOLD}, #B8960C)`,
                    color: sponsorActive ? '#EF4444' : '#080B18',
                    border: sponsorActive ? '1px solid rgba(239,68,68,0.35)' : 'none',
                    fontFamily: 'Barlow Condensed, sans-serif',
                  }}>
                  {sponsorActive ? 'Deactivate Overlay' : 'Activate Overlay'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {paywallVisible && !showExclusiveGate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,11,24,0.94)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 360, background: 'rgba(13,6,24,0.98)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 20, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 56 }}>⏱️</span>
            <h2 style={{ margin: 0, color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 30, fontWeight: 900, letterSpacing: '0.04em' }}>Free Preview Ended</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.5 }}>
              Subscribe to {hostName} to keep watching this exclusive stream.
            </p>
            <a href={`/CreatorSubscriptions?creator=${party?.host_id}`}
              style={{ display: 'block', width: '100%', padding: '12px 0', background: 'linear-gradient(135deg, #D4AF37, #B8960C)', color: '#080B18', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 15, letterSpacing: '0.05em', borderRadius: 12, textDecoration: 'none', textTransform: 'uppercase' }}>
              Subscribe Now — 90/10 Split
            </a>
            <button onClick={() => setPaywallVisible(false)}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, padding: '8px 0', width: '100%', cursor: 'pointer' }}>
              Watch for free (limited view)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
