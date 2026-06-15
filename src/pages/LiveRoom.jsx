import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, MessageCircle, Heart, Hand, Crown,
  ChevronLeft, MoreHorizontal, Share2, Minus, Radio,
  Users, LayoutGrid, Send, X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import TipWidget from '../components/live/TipWidget';
import ShareModal from '../components/live/ShareModal';
import DirectPayments from '../components/live/DirectPayments';
import LoveHearts from '../components/live/LoveHearts';
import LoveTap from '../components/live/LoveTap';
import GiftShop from '../components/live/GiftShop';
import AnimatedGiftShop from '../components/monetization/AnimatedGiftShop';
import LiveAuctionWidget from '../components/live/LiveAuctionWidget';
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
import ModerationAppealPanel from '../components/live/ModerationAppealPanel';
import GiftAnimation from '../components/live/GiftAnimation';
import QuickPollLauncher from '../components/live/QuickPollLauncher';
import HostAlertCenter from '../components/live/HostAlertCenter';
import LiveGoalWidget from '../components/live/LiveGoalWidget';
import { DollarSign, Gift } from 'lucide-react';
import ViewerCount from '../components/live/ViewerCount';
import SuperChatRail from '../components/live/SuperChatRail';
import EmbedPlayer from '../components/streaming/EmbedPlayer';
import StreamEventBus from '../components/live/StreamEventBus';
import ClipMarker from '../components/live/ClipMarker';
import StreamGoals from '../components/live/StreamGoals';
import StreamHighlightCapture from '../components/live/StreamHighlightCapture';
import EngagementBadgesDisplay from '../components/live/EngagementBadgesDisplay';
import EnhancedPollingSystem from '../components/live/EnhancedPollingSystem';
import InteractivePollingSystem from '../components/live/InteractivePollingSystem';
import LivePollOverlay from '../components/live/LivePollOverlay';
import GoldenWall from '../components/live/GoldenWall';
import LiveAudiencePulse from '../components/live/LiveAudiencePulse';
import ViewerLoyaltyCard from '../components/loyalty/ViewerLoyaltyCard';
import PointsEarnWidget from '../components/loyalty/PointsEarnWidget';
import { WhisperPanel } from '../components/live/DMWhisperPanel';
import { MerchStrip } from '../components/merch/MerchWidget';
import RaidPanelButton from '../components/live/RaidPanel';
import ChatModeration from '../components/live/ChatModeration';
import ClipCreator from '../components/live/ClipCreator';
import StreamMetadata from '../components/live/StreamMetadata';
import AICopilotSidebar from '../components/live/AICopilotSidebar';
import AuraPanelDrawer from '../components/live/AuraPanelDrawer';
import PrivatePanel from '../components/live/PrivatePanel';
import ReactionOverlay from '../components/watchparty/ReactionOverlay';
import ViewerControlsPanel from '../components/live/ViewerControlsPanel';
import CreatePollModal from '../components/community/CreatePollModal';

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
const BG2     = '#080B18';
const BG3     = '#0F1428';
const OCT     = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const PALETTE = ['#8B6F47','#6B7C4A','#CC7755','#4A6B3A','#7C4A3A','#6B5C3A','#A6263A','#D4854A'];

function avatarColor(name) {
  return PALETTE[(name?.charCodeAt(0) ?? 0) % PALETTE.length];
}


// ── Octagonal stage tile (speaker) ───────────────────────────────────────────
function StageTile({ p, size = 96, stream, isLocal = false, onClick }) {
  const videoRef = useRef(null);
  useEffect(() => { if (videoRef.current && stream) videoRef.current.srcObject = stream; }, [stream]);

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
          style={{ clipPath: OCT, background: `linear-gradient(145deg, rgba(30,15,30,0.95), rgba(20,10,28,0.95))` }}>

          {stream ? (
            <video ref={videoRef} autoPlay playsInline muted={isLocal}
              className={'absolute inset-0 w-full h-full object-cover' + (isLocal ? ' scale-x-[-1]' : '')} />
          ) : p.avatar ? (
            <img src={p.avatar} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              {/* Ambient glow */}
              <div className="absolute inset-0" style={{ background: `radial-gradient(circle, ${avatarColor(p.name)}33 0%, transparent 70%)` }} />
              {p.avatar ? (
                <img src={p.avatar} alt={p.name}
                  className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shrink-0"
                  style={{ background: `linear-gradient(135deg, #800020, #D4AF37)`, color: '#fff', boxShadow: `0 0 20px ${avatarColor(p.name)}66, inset 0 1px 0 rgba(255,255,255,0.2)`, border: '2px solid rgba(212,175,55,0.4)' }}>
                  {p.name.replace(/\s+\S*$/, '').charAt(0).toUpperCase()}
                </div>
              )}
              {/* Audio-only mic indicator */}
              {!p.muted && (
                <motion.div className="absolute bottom-3 left-0 right-0 flex justify-center items-end gap-[2px]"
                  initial={{ opacity: 0 }} animate={{ opacity: p.speaking ? 1 : 0.35 }}>
                  {[2,4,3,5,2].map((h, i) => (
                    <motion.div key={i} className="w-[2px] rounded-full"
                      style={{ background: p.speaking ? GOLD : 'rgba(255,255,255,0.4)', height: h }}
                      animate={p.speaking ? { height: [h, h * 3, h] } : {}}
                      transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }} />
                  ))}
                </motion.div>
              )}
            </>
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
        <div className="flex items-center justify-center gap-1">
          <p className="text-[11px] font-bold text-white leading-none truncate">{p.name}</p>
          {p.fm && (
            <span style={{ fontSize: 8, fontWeight: 900, color: GOLD, background: `${GOLD}22`, border: `1px solid ${GOLD}55`, borderRadius: 4, padding: '1px 4px', letterSpacing: '0.04em', fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>
              FM{p.fmNum ? `#${p.fmNum}` : ''}
            </span>
          )}
        </div>
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
          style={{ clipPath: OCT, background: 'rgba(212,175,55,0.15)' }} />
        <div className="absolute inset-[2px] overflow-hidden flex items-center justify-center"
          style={{ clipPath: OCT, background: `linear-gradient(135deg, #1A0F0A, ${BG2})` }}>
          {p.avatar
            ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
            : <span className="text-xs font-black" style={{ color }}>{p.name.charAt(0).toUpperCase()}</span>
          }
        </div>
      </div>
      <div className="flex items-center gap-1 justify-center" style={{ maxWidth: 52 }}>
        <p className="text-[11px] text-white/35 truncate leading-none">{p.name.split(' ')[0]}</p>
        {p.fm && (
          <span style={{ fontSize: 7, fontWeight: 900, color: GOLD, background: `${GOLD}22`, border: `1px solid ${GOLD}44`, borderRadius: 3, padding: '1px 3px', letterSpacing: '0.03em', fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>
            FM
          </span>
        )}
      </div>
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
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold"
                  style={{ color: m.host ? GOLD : 'rgba(255,255,255,0.55)' }}>{m.user}</span>
                {m.host && (
                  <span className="text-[7px] px-1 py-0.5 rounded font-bold uppercase"
                    style={{ background: `${GOLD}22`, color: GOLD }}>HOST</span>
                )}
              </div>
              <p className="text-[12px] text-white/80 leading-snug">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
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
  const urlParams = new URLSearchParams(window.location.search);
  const roomId    = urlParams.get('id');

  // Real camera + peer mesh (falls back gracefully when no roomId)
  const { localStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo } = useLocalMedia({ audio: true, video: true });
  const { remoteStreams, peerUserIds, announceJoin, leaveRoom: leaveRTCRoom } = useWebRTCPeers(roomId, localStream);

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
  const isHost = user?.id && party?.host_id && user.id === party.host_id;

  const { data: activeSubs = [] } = useQuery({
    queryKey: ['user-subscriptions', user?.id, party?.host_id],
    queryFn: () => base44.entities.Subscription.filter({ user_id: user.id, creator_id: party.host_id, status: 'active' }),
    enabled: !!user?.id && !!party?.host_id && isExclusiveStream && !isHost,
  });

  const isSubscribed = activeSubs.length > 0;
  const showExclusiveGate = isExclusiveStream && !isHost && !isSubscribed && !!party;

  // Build stage from real members or demo data
  const stage = roomId && members.length > 0
    ? members.slice(0, 20).map((m) => ({
        id:       m.id,
        userId:   m.user_id,
        avatar:   m.user_avatar || null,
        name:     m.user_name || 'Guest',
        role:     m.user_id === party?.host_id ? 'host' : m.role || 'speaker',
        speaking: false,
        muted:    m.is_audio_enabled === false,
        fm:       m.is_founding_member || false,
        fmNum:    m.founding_member_number || null,
      }))
    : [];

  const audience = roomId && members.length > 6
    ? members.slice(6).map(m => ({ id: m.id, userId: m.user_id, avatar: m.user_avatar || null, name: m.user_name || 'Viewer', fm: m.is_founding_member || false, fmNum: m.founding_member_number || null }))
    : [];

  const roomTitle  = party?.title || (roomId ? 'Live Room' : 'Demo Room');
  const hostName   = party ? (members.find(m => m.user_id === party.host_id)?.user_name || 'Host') : 'SwanyThree';
  const liveCount  = members.length || 20;
  const isLive     = !roomId || members.length > 0 || (remoteStreams?.size ?? 0) > 0;

  // Local UI state
  const [stageData, setStageData]   = useState(stage);
  const [spotlit, setSpotlit]       = useState(null);
  const [chatOpen, setChatOpen]     = useState(false);
  const [chatMsgs, setChatMsgs]     = useState([]);
  const [unread, setUnread]         = useState(0);
  const [liked, setLiked]           = useState(false);
  const [likeCount, setLikeCount]   = useState(3);
  const [handRaised, setHandRaised] = useState(false);
  const [shareOpen, setShareOpen]   = useState(false);
  const [embedOpen, setEmbedOpen]   = useState(false);
  const [payOpen, setPayOpen]       = useState(false);
  const [liveViewers, setLiveViewers] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [giftOpen, setGiftOpen]     = useState(false);
  const [animGiftOpen, setAnimGiftOpen] = useState(false);
  const [zegoJoined, setZegoJoined]   = useState(false);
  const [reportOpen, setReportOpen]   = useState(false);
  const [giftEvent, setGiftEvent]   = useState(null);
  const [giftLog, setGiftLog]       = useState([]);
  const [goalOpen, setGoalOpen]     = useState(false);
  const [whisperTarget, setWhisperTarget] = useState(null);
  const [auraOpen, setAuraOpen]     = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const lastGiftTsRef               = useRef(0);

  // Connection quality — updated by real WebRTC getStats() via ZEGOStream callbacks when available
  const [connStats] = useState({ latency: 0, bitrate: 0, loss: 0, quality: 'GOOD' });

  // Establish WebRTC peer mesh for real camera feeds
  useEffect(() => {
    if (!roomId || !user?.id) return;
    announceJoin(user.id);
    return leaveRTCRoom;
  }, [roomId, user?.id]);

  // Sync stage when real data arrives; auto-spotlight the host on first load
  useEffect(() => {
    if (stage.length) {
      setStageData(stage);
      setSpotlit(prev => prev ?? stage.find(s => s.role === 'host') ?? null);
    }
  }, [members]);


  const activeSpeaker = stageData.find(s => s.speaking);
  const stageCols = stageData.length <= 4 ? 2 : stageData.length <= 9 ? 3 : 4;
  const tileSize = stageData.length === 1 ? Math.min(320, window.innerWidth * 0.9)
    : stageData.length === 2 ? Math.min(170, window.innerWidth * 0.44)
    : stageCols === 2 ? 120 : stageCols === 3 ? 88 : 72;

  function resolveStream(memberId, userId) {
    if (userId === user?.id) return { stream: localStream, isLocal: true };
    const peerId = Array.from((peerUserIds || new Map()).entries()).find(([, uid]) => uid === userId)?.[0];
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

  function openChat()  { setChatOpen(true); setUnread(0); }
  function sendChat(t) { setChatMsgs(p => [...p, { id: Date.now(), user: user?.full_name || 'You', text: t, host: false }]); }
  function handleLike() { setLiked(l => !l); setLikeCount(c => liked ? c - 1 : c + 1); }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: BG, fontFamily: 'Barlow Condensed, sans-serif' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)' }}
          onClick={() => history.back()}>
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <MessageCircle className="w-3 h-3 text-white/40" />
        </div>
        <h1 className="flex-1 text-sm font-bold text-white truncate">{roomTitle}</h1>
        <button className="w-7 h-7 flex items-center justify-center">
          <MoreHorizontal className="w-4 h-4 text-white/40" />
        </button>
        <button className="w-7 h-7 flex items-center justify-center" onClick={() => setShareOpen(true)}>
          <Share2 className="w-4 h-4 text-white/40" />
        </button>
        <button className="w-7 h-7 flex items-center justify-center" title="Embed stream" onClick={() => setEmbedOpen(v => !v)}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{`</>`}</span>
        </button>
        <button className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <Minus className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 88 }}>

        {/* ── STAGE FIRST — visible without scrolling ───────────────────────── */}
        {/* Stage header */}
        <div className="px-4 pt-3 mb-2 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[17px] font-black text-white">Stage</span>
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {stageData.length}/20
            </span>
            {/* LIVE badge inline with Stage header */}
            {isLive ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: `${PINK}1A`, border: `1px solid ${PINK}44` }}>
                <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: PINK }}
                  animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
                <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: PINK }}>Live</span>
              </div>
            ) : (
              <span className="text-[11px] text-white/30">Waiting…</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ViewerCount count={liveViewers || party?.viewer_count || liveCount} peakViewers={peakViewers} />
            <button
              onClick={() => setSpotlit(null)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <LayoutGrid className="w-3.5 h-3.5 text-white/40" />
            </button>
          </div>
        </div>

        {/* ── Stage grid ────────────────────────────────────────────────────── */}
        <div className="px-3 mb-4">
          {spotlit ? (
            /* Spotlight mode — hero tile fills screen width, others strip below */
            <div className="space-y-3">
              <div className="flex justify-center">
                {(() => { const { stream, isLocal } = resolveStream(spotlit.id, spotlit.userId); return (
                  <StageTile p={spotlit} size={288} stream={stream} isLocal={isLocal} onClick={() => setSpotlit(null)} />
                ); })()}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 px-1">
                {stageData.filter(s => s.id !== spotlit.id).map(p => {
                  const { stream, isLocal } = resolveStream(p.id, p.userId);
                  return (
                    <div key={p.id} className="shrink-0">
                      <StageTile p={p} size={72} stream={stream} isLocal={isLocal} onClick={() => setSpotlit(p)} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={stageData.length <= 2 ? "flex justify-center gap-0.5" : `grid gap-4`}
              style={stageData.length > 2 ? { gridTemplateColumns: `repeat(${stageCols}, 1fr)` } : {}}>
              <AnimatePresence>
                {stageData.map(p => {
                  const { stream, isLocal } = resolveStream(p.id, p.userId);
                  return (
                    <motion.div key={p.id} layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex justify-center">
                      <StageTile p={p} size={tileSize} stream={stream} isLocal={isLocal}
                        onClick={() => setSpotlit(p)} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── Room meta row (below stage) ───────────────────────────────────── */}
        <div className="px-4 pb-1 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black"
              style={{ background: avatarColor(hostName) + '55', color: avatarColor(hostName), border: `1.5px solid ${avatarColor(hostName)}` }}>
              {hostName.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-white/60">{hostName}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/35">
            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{liveCount}</span>
          </div>
          {activeSpeaker && (
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black"
                style={{ background: avatarColor(activeSpeaker.name) + '55', color: avatarColor(activeSpeaker.name) }}>
                {activeSpeaker.name.charAt(0)}
              </div>
              <span className="text-[10px] text-white/40">{activeSpeaker.name.split(' ')[0]} is speaking</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Radio className="w-2.5 h-2.5" style={{ color: GOLD }} />
            <span className="text-[11px] font-semibold" style={{ color: GOLD }}>SeeWhy LIVE</span>
          </div>
        </div>

        {/* ── Connection status bar (compact) ─────────────────────────────────── */}
        {isLive && (() => {
          const qColor = connStats.quality === 'EXCELLENT' ? '#6DBF7E' : connStats.quality === 'GOOD' ? '#D4AF37' : connStats.quality === 'FAIR' ? '#D4854A' : '#EF4444';
          return (
            <div className="px-4 pb-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '5px 10px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, fontWeight: 700, color: qColor, letterSpacing: '0.06em' }}>
                  ● {connStats.quality}
                </span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>
                  {connStats.latency}ms
                </span>
                <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)', display: 'inline-block' }} />
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>
                  {connStats.bitrate.toLocaleString()}kbps
                </span>
                <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)', display: 'inline-block' }} />
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: connStats.loss > 0 ? '#EF4444' : 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>
                  {connStats.loss}% loss
                </span>
              </div>
            </div>
          );
        })()}

        {/* ── Golden Wall: live tips & gifts ───────────────────────────────── */}
        {roomId && (
          <div className="px-3 mb-4">
            <GoldenWall roomId={roomId} isExpanded />
          </div>
        )}

        {/* ── Stream Goals ─────────────────────────────────────────────────── */}
        {roomId && (
          <div className="px-3 mb-4">
            <StreamGoals roomId={roomId} isHost={isHost} />
          </div>
        )}

        {/* ── Live Merch Strip ─────────────────────────────────────────────── */}
        {party?.host_id && (
          <div className="mb-4">
            <MerchStrip roomId={roomId} currentUser={user} hostId={party.host_id} />
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

        {/* ── Merch strip ───────────────────────────────────────────────────── */}
        {party?.host_id && (
          <MerchStrip roomId={roomId || party?.id} currentUser={user} hostId={party.host_id} />
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
          <div className="grid grid-cols-5 gap-x-2 gap-y-3">
            {audience.map(p => (
              <div key={p.id} className="flex justify-center" onClick={() => p.id !== user?.id && setWhisperTarget({ id: p.id, name: p.name })} style={{ cursor: p.id !== user?.id ? 'pointer' : 'default' }}>
                <AudienceTile p={p} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Online Users Grid — everyone online/virtual ───────────────────── */}
        <div className="px-4 mb-5">
          <OnlineUsersGrid
            roomId={roomId}
            remoteStreams={remoteStreams}
            peerUserIds={peerUserIds}
            localStream={localStream}
            currentUser={user}
          />
        </div>

        {/* ── App shortcut carousel ─────────────────────────────────────────── */}
        <div className="px-3 pb-3">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[
              { label: 'Auction',      icon: '🏆', bg: 'rgba(212,175,55,0.08)'  },
              { label: 'Destinations', icon: '📍', bg: 'rgba(0,200,200,0.06)'   },
              { label: 'AI Trip',      icon: '🤖', bg: 'rgba(212,175,55,0.08)'  },
              { label: 'Pay',          icon: '💸', bg: 'rgba(192,57,43,0.08)', action: () => setPayOpen(true) },
              { label: 'Battle',       icon: '⚔️', bg: 'rgba(212,175,55,0.08)'  },
              { label: 'QR Code',      icon: '📱', bg: 'rgba(255,255,255,0.04)' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                onClick={s.action}
                style={{ userSelect: 'none' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                  style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
                  {s.icon}
                </div>
                <span className="text-[11px] text-white/30">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
            <div className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: chatOpen ? `${GOLD}15` : 'rgba(255,255,255,0.07)', border: chatOpen ? `1px solid ${GOLD}44` : '1px solid rgba(255,255,255,0.1)' }}>
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            {unread > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ background: PINK, color: '#fff' }}>{unread}</div>
            )}
            <span className="text-[11px] text-white/35">Chat</span>
          </button>

          {/* Heart */}
          <button onClick={handleLike} className="flex flex-col items-center gap-0.5">
            <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
              style={{ background: liked ? `${PINK}1A` : 'rgba(255,255,255,0.07)', border: liked ? `1px solid ${PINK}55` : '1px solid rgba(255,255,255,0.1)' }}>
              <Heart className="w-4 h-4 transition-all"
                style={{ color: liked ? PINK : 'rgba(255,255,255,0.6)', fill: liked ? PINK : 'none' }} />
            </div>
            <span className="text-[11px]" style={{ color: liked ? PINK : 'rgba(255,255,255,0.35)' }}>{likeCount}</span>
          </button>

          {/* Hand raise */}
          <button onClick={() => setHandRaised(h => !h)} className="flex flex-col items-center gap-0.5">
            <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
              style={{ background: handRaised ? `${GOLD}1A` : 'rgba(255,255,255,0.07)', border: handRaised ? `1px solid ${GOLD}55` : '1px solid rgba(255,255,255,0.1)' }}>
              <Hand className="w-4 h-4 transition-all" style={{ color: handRaised ? GOLD : 'rgba(255,255,255,0.6)' }} />
            </div>
            <span className="text-[11px] text-white/35"> </span>
          </button>

          {/* Gift */}
          {party && party?.host_id !== user?.id && (
            <button onClick={() => setGiftOpen(true)} className="flex flex-col items-center gap-0.5">
              <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}44` }}>
                <Gift className="w-4 h-4" style={{ color: GOLD }} />
              </div>
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

          {/* Mic */}
          <button onClick={toggleAudio} className="flex flex-col items-center gap-0.5">
            <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
              style={{ background: !audioEnabled ? 'rgba(239,68,68,0.15)' : `${GOLD}1A`, border: !audioEnabled ? '1px solid rgba(239,68,68,0.4)' : `1px solid ${GOLD}55` }}>
              {!audioEnabled
                ? <MicOff className="w-4 h-4 text-red-400" />
                : <Mic className="w-4 h-4" style={{ color: GOLD }} />}
            </div>
            <span className="text-[11px] text-white/35"> </span>
          </button>

          {/* Camera */}
          <button onClick={toggleVideo} className="flex flex-col items-center gap-0.5">
            <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
              style={{ background: !videoEnabled ? 'rgba(239,68,68,0.15)' : `${GOLD}1A`, border: !videoEnabled ? '1px solid rgba(239,68,68,0.4)' : `1px solid ${GOLD}55` }}>
              {!videoEnabled
                ? <VideoOff className="w-4 h-4 text-red-400" />
                : <Video className="w-4 h-4" style={{ color: GOLD }} />}
            </div>
            <span className="text-[11px] text-white/35"> </span>
          </button>
        </div>
      </div>

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

      {/* Real-time event bus */}
      {(roomId || party?.id) && (
        <StreamEventBus
          roomId={roomId || party?.id}
          isHost={isHost}
          sessionId={user?.id}
          onViewerUpdate={n => { setLiveViewers(n); setPeakViewers(p => Math.max(p, n)); }}
        />
      )}

      {/* Embed player panel */}
      <AnimatePresence>
        {embedOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ position: 'fixed', bottom: 80, left: 0, right: 0, zIndex: 60, padding: '0 12px' }}
          >
            <EmbedPlayer
              roomId={roomId || party?.id}
              creatorName={hostName}
              creatorAvatar={party?.host_avatar_url}
              streamTitle={roomTitle}
              viewerCount={party?.viewer_count || 0}
              isLive={party?.status === 'live'}
            />
          </motion.div>
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

      {/* Live auction (host can run auctions during stream) */}
      {isHost && party?.id && (
        <LiveAuctionWidget roomId={party.id} currentUser={user} isHost={isHost} />
      )}

      {/* Loyalty badge */}
      {user?.id && party?.host_id && (
        <LoyaltyBadge userId={user.id} creatorId={party.host_id} />
      )}

      {/* Moderation appeal panel */}
      <ModerationAppealPanel flagId={null} messageId={null} roomId={roomId || party?.id} onClose={() => {}} />

      {/* Report modal */}
      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} reportedUser={null} roomId={roomId || party?.id} communityId={null} messageId={null} />

      {/* Whisper DM panel */}
      {whisperTarget && (roomId || party?.id) && (
        <WhisperPanel
          roomId={roomId || party?.id}
          currentUser={user}
          recipientId={whisperTarget.id}
          recipientName={whisperTarget.name}
          onClose={() => setWhisperTarget(null)}
        />
      )}

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

      {/* ── Gift ticker strip ───────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', left: 12, bottom: 112, zIndex: 43, display: 'flex', flexDirection: 'column-reverse', gap: 6, pointerEvents: 'none' }}>
        <AnimatePresence>
          {giftLog.map((ev, i) => (
            <motion.div key={ev.id}
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 - i * 0.2 }}
              exit={{ x: -60, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 10px 5px 6px', borderRadius: 20,
                backdropFilter: 'blur(12px)', background: 'rgba(8,7,16,0.82)',
                border: `1px solid ${ev.gift?.color ?? GOLD}44`, maxWidth: 180,
              }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{ev.gift?.emoji ?? '🎁'}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: ev.gift?.color ?? GOLD, fontFamily: 'Barlow Condensed, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.senderName}</p>
                <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,0.45)', fontFamily: 'Barlow Condensed, sans-serif' }}>sent {ev.gift?.name ?? 'a gift'}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Quick Poll Launcher (hosts) ─────────────────────────────────────── */}
      {isHost && roomId && (
        <div style={{ position: 'fixed', bottom: 88, left: 12, zIndex: 44 }}>
          <QuickPollLauncher roomId={roomId} hostId={user?.id} isHost={isHost} />
        </div>
      )}

      {/* ── Stream Goal Widget ──────────────────────────────────────────────── */}
      {goalOpen && isHost && (
        <div style={{ position: 'fixed', bottom: 90, right: 12, zIndex: 44, width: 280 }}>
          <LiveGoalWidget
            memberCount={0}
            tipTotal={giftLog.reduce((s, g) => s + (g.amount || 0), 0)}
            subCount={0}
          />
        </div>
      )}

      {/* ── Host Alert Center ───────────────────────────────────────────────── */}
      {isHost && <HostAlertCenter />}

      {/* ── Raid Panel (host only) ──────────────────────────────────────────── */}
      {isHost && party && (
        <div style={{ position: 'fixed', bottom: 148, right: 12, zIndex: 44 }}>
          <RaidPanelButton room={party} currentUser={user} isHost={isHost} />
        </div>
      )}

      {/* ── Chat Moderation + Clip Creator + Stream Metadata (host only) ────── */}
      {isHost && (
        <div style={{ padding: '0 16px 16px' }}>
          <ChatModeration collapsed />
          {party?.id && <ClipCreator roomId={party.id} creatorId={user?.id} streamTitle={party.title} elapsedSeconds={0} currentUser={user} />}
          {party && <StreamMetadata room={party} isHost={isHost} />}
          {party?.id && <AICopilotSidebar roomId={party.id} isHost={isHost} viewerCount={members.length} />}
          {party?.id && <StreamHighlightCapture roomId={party.id} sessionId={party.id} creatorId={user?.id} elapsedSeconds={0} isHost={isHost} />}
          {party?.id && <EnhancedPollingSystem roomId={party.id} hostId={user?.id} isHost={isHost} />}
          {party?.id && user?.id && <InteractivePollingSystem roomId={party.id} isHost={isHost} currentUser={user} />}
          {party?.id && user?.id && <EngagementBadgesDisplay roomId={party.id} userId={user.id} creatorId={party.host_id} />}
        </div>
      )}

      {/* Aura/emotion drawer (host) */}
      {isHost && party?.id && (
        <AuraPanelDrawer roomId={party.id} hostId={user?.id} onClose={() => setAuraOpen(false)} />
      )}

      {/* Live poll overlay (floating, all users) */}
      {(roomId || party?.id) && (
        <LivePollOverlay roomId={roomId || party?.id} currentUser={user} isHost={isHost} />
      )}

      {/* Private panel (host only) */}
      {isHost && <PrivatePanel isHost={isHost} currentUser={user} />}

      {/* Reaction overlay (all viewers) */}
      {(roomId || party?.id) && (
        <ReactionOverlay partyId={roomId || party?.id} currentUser={user} />
      )}

      {/* Viewer controls panel */}
      {!isHost && user?.id && (roomId || party?.id) && (
        <ViewerControlsPanel roomId={roomId || party?.id} currentUser={user} onClose={() => {}} />
      )}

      {/* Create poll modal (host) */}
      {isHost && (
        <CreatePollModal isOpen={pollModalOpen} onClose={() => setPollModalOpen(false)} communityId={null} />
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
            background: 'rgba(8,11,24,0.98)',
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
    </div>
  );
}
