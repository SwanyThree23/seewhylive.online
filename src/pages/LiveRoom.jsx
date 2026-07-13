import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, MessageCircle, Heart, Hand, Crown,
  ChevronLeft, MoreHorizontal, Share2, Minus, Radio,
  Users, LayoutGrid, Send, X, Settings, Volume2,
} from 'lucide-react';
import { useCameraDevices } from '../hooks/useCameraDevices';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
import { useConnectionQuality } from '../hooks/useConnectionQuality';
import { useAutoSpeakGate } from '../hooks/useAutoSpeakGate';
import { useVODRecording } from '../hooks/useVODRecording';
import { useSubscriptionCount } from '../hooks/useSubscriptionCount';
import { useHighlightDetector } from '../hooks/useHighlightDetector';
import TipWidget from '../components/live/TipWidget';
import ShareModal from '../components/live/ShareModal';
import KeyboardShortcutsHelp from '../components/live/KeyboardShortcutsHelp';
import NetworkQualityBanner from '../components/live/NetworkQualityBanner';
import DirectPayments from '../components/live/DirectPayments';
import LoveHearts from '../components/live/LoveHearts';
import LoveTap from '../components/live/LoveTap';
import GiftShop from '../components/live/GiftShop';
import GiftAnimation from '../components/live/GiftAnimation';
import { DollarSign, Gift } from 'lucide-react';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import ZEGOGuestApprovalPanel from '../components/zego/ZEGOGuestApprovalPanel';
import ZEGOStreamHealthCard from '../components/zego/ZEGOStreamHealthCard';
import ZEGOConfigPanel from '../components/zego/ZEGOConfigPanel';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';

import ClipCreator from '../components/live/ClipCreator';
import RealtimeLeaderboard from '../components/live/RealtimeLeaderboard';
import LiveTranscription from '../components/live/LiveTranscription';
import ViewerControlsPanel from '../components/live/ViewerControlsPanel';
import VirtualCurrencyTips from '../components/live/VirtualCurrencyTips';
import StreamHighlightCapture from '../components/live/StreamHighlightCapture';
import GoldenWall from '../components/live/GoldenWall';
import QuickPollLauncher from '../components/live/QuickPollLauncher';
import GiftTray from '../components/live/GiftTray';
import RoomBrandingEditor from '../components/live/RoomBrandingEditor';
import { SwanDirectorHUD } from '../components/live/SwanDirectorPanel';
import HostAlertCenter from '../components/live/HostAlertCenter';
import AICopilotSidebar from '../components/live/AICopilotSidebar';
import EnhancedPollingSystem from '../components/live/EnhancedPollingSystem';
import SuperChatBar from '../components/live/SuperChatBar';
import StreamGoals from '../components/live/StreamGoals';
import ViewerCount from '../components/live/ViewerCount';
import LiveAudiencePulse from '../components/live/LiveAudiencePulse';
import StreamAnalyticsDashboard from '../components/live/StreamAnalyticsDashboard';
import AIStreamSummary from '../components/live/AIStreamSummary';
import ChatModeration from '../components/live/ChatModeration';
import BrandChyron from '../components/live/BrandChyron';
import { WhisperPanel } from '../components/live/DMWhisperPanel';
import LowerThirdsBanner from '../components/live/LowerThirdsBanner';
import SceneSwitcher from '../components/live/SceneSwitcher';
import NotificationHub from '../components/live/NotificationHub';
import SoundboardWidget from '../components/live/SoundboardWidget';
import RaidPanelButton from '../components/live/RaidPanel';
import BroadcastAnalyticsDashboard from '../components/streaming/BroadcastAnalyticsDashboard';
import AutomatedHighlightReels from '../components/streaming/AutomatedHighlightReels';
import PerformanceDashboard from '../components/streaming/PerformanceDashboard';
import StreamHealthDashboard from '../components/streaming/StreamHealthDashboard';
import QuickTip from '../components/rooms/QuickTip';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import AnimatedGiftShop from '../components/monetization/AnimatedGiftShop';
import VirtualGoodsStore from '../components/monetization/VirtualGoodsStore';
import SoundAlertsManager from '../components/monetization/SoundAlertsManager';
import ShareToSocial from '../components/social/ShareToSocial';
import VideoShortRecorder from '../components/vod/VideoShortRecorder';
import RecordingManager from '../components/content/RecordingManager';
import OBSBridge from '../components/obs/OBSBridge';
import ZEGOMobileAppBanner from '../components/zego/ZEGOMobileAppBanner';
import AutomatedClipGenerator from '../components/streaming/AutomatedClipGenerator';
import InteractivePollWidget from '../components/streaming/InteractivePollWidget';
import StreamMetadataEditor from '../components/streaming/StreamMetadataEditor';
import GreenroomQueue from '../components/streaming/GreenroomQueue';
import StreamingPresets from '../components/streaming/StreamingPresets';
import EmbedPlayer from '../components/streaming/EmbedPlayer';
import LiveTranslationWidget from '../components/streaming/LiveTranslationWidget';
import PointsEarnWidget from '../components/loyalty/PointsEarnWidget';
import RedemptionQueue from '../components/loyalty/RedemptionQueue';
import RewardShop from '../components/loyalty/RewardShop';
import ViewerLoyaltyCard from '../components/loyalty/ViewerLoyaltyCard';
import PKBattleInterface from '../components/pk/PKBattleInterface';
import CoStreamPanel from '../components/collaboration/CoStreamPanel';
import CollaborativeWhiteboard from '../components/collaboration/CollaborativeWhiteboard';
import TipAlert from '../components/monetization/TipAlert';
import TippingModal from '../components/monetization/TippingModal';
import LiveAuctionWidget from '../components/monetization/LiveAuctionWidget';
import { MerchStrip as MerchWidget } from '../components/merch/MerchWidget';
import NotificationBell from '../components/shared/NotificationBell';
import StreamerGoalsWidget from '../components/monetization/StreamerGoalsWidget';
import PayPerViewManager from '../components/monetization/PayPerViewManager';
import MonetizationDashboard from '../components/monetization/MonetizationDashboard';
import GiftShopTray from '../components/live/GiftShopTray';
import { GiftLeaderboard } from '../components/live/GiftSystem';
import SubscriptionManager from '../components/monetization/SubscriptionManager';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
import BattleMode from '../components/streaming/BattleMode';
import BitratePresets from '../components/streaming/BitratePresets';
import GuestRTMPPanel from '../components/streaming/GuestRTMPPanel';
import GuestStreamMonitor from '../components/streaming/GuestStreamMonitor';
import TranscriptionPanel from '../components/streaming/TranscriptionPanel';
import AuraEmotionDisplay from '../components/live/AuraEmotionDisplay';
import BattleScoreboard from '../components/live/BattleScoreboard';
import EnhancedStreamChat from '../components/live/EnhancedStreamChat';
import GlobalChatWidget from '../components/live/GlobalChatWidget';
import GuestConnector from '../components/live/GuestConnector';
import InteractivePollingSystem from '../components/live/InteractivePollingSystem';
import LeaderboardPanel from '../components/live/LeaderboardPanel';
import MobileStreamControls from '../components/live/MobileStreamControls';
import PointsNotification from '../components/live/PointsNotification';
import EngagementBadgesDisplay from '../components/live/EngagementBadgesDisplay';
import ChatOverlay from '../components/live/ChatOverlay';
import PKBattleSoundboard from '../components/live/PKBattleSoundboard';
import PanelMusicPlayer from '../components/live/PanelMusicPlayer';
import PollLaunchBar from '../components/live/PollLaunchBar';
import PreStreamCountdown from '../components/live/PreStreamCountdown';
import PrivatePanel from '../components/live/PrivatePanel';
import StreamChatbot from '../components/live/StreamChatbot';
import StreamEventBus from '../components/live/StreamEventBus';
import TippingOverlay from '../components/live/TippingOverlay';
import UnifiedChat from '../components/live/UnifiedChat';
import AIPersonaCustomizer from '../components/live/AIPersonaCustomizer';
import AudioMixer from '../components/live/AudioMixer';
import EnhancedAudioMixer from '../components/live/EnhancedAudioMixer';
import ScreenSharePanel from '../components/live/ScreenSharePanel';
import PayPerViewGate from '../components/live/PayPerViewGate';
import PaywallGate from '../components/live/PaywallGate';
import SubscriptionGate from '../components/live/SubscriptionGate';
import ModerationAppealPanel from '../components/live/ModerationAppealPanel';
import GuestDestinationsPanel from '../components/live/GuestDestinationsPanel';
import GuestStreamingPermissions from '../components/live/GuestStreamingPermissions';
import MultiStreamConfig from '../components/live/MultiStreamConfig';
import VdoNinjaGuestLink from '../components/live/VdoNinjaGuestLink';
import WebRTCSetupBanner from '../components/live/WebRTCSetupBanner';
import WebhookHooks from '../components/live/WebhookHooks';
import CreatorTierManager from '../components/subscriptions/CreatorTierManager';
import TierBadge from '../components/subscriptions/TierBadge';
import LoyaltyBadge from '../components/rooms/LoyaltyBadge';
import GuestGrid from '../components/live/GuestGrid';
import EnhancedRoomControls from '../components/live/EnhancedRoomControls';
import CollabPlaylist from '../components/watchparty/CollabPlaylist';
import YouTubeDiscovery from '../components/youtube/YouTubeDiscovery';
import ActivitySidebar from '../components/shared/ActivitySidebar';
import GlobalSearch from '../components/shared/GlobalSearch';
import AudioPanel from '../components/live/AudioPanel';
import EvmuxWebSource from '../components/live/EvmuxWebSource';
import LivePollOverlay from '../components/live/LivePollOverlay';
import StripeConnectButton from '../components/monetization/StripeConnectButton';
import StripeSubscribeButton from '../components/monetization/StripeSubscribeButton';
import SubscriptionTiers from '../components/monetization/SubscriptionTiers';
import WatchPartyAnalytics from '../components/watchparty/WatchPartyAnalytics';
import ZEGOGuestJoin from '../components/zego/ZEGOGuestJoin';
import PaymentMethodSelector from '../components/monetization/PaymentMethodSelector';
import LocalVideoTile from '../components/live/LocalVideoTile';
import OctagonalVideoWindow from '../components/live/OctagonalVideoWindow';
import SwanyBotEnhanced from '../components/guide/SwanyBotEnhanced';
import GuestCoStreamDashboard from '../components/live/GuestCoStreamDashboard';
import TipGoalBar from '../components/monetization/TipGoalBar';
import TopTippers from '../components/monetization/TopTippers';
import * as panelService from '../services/panelService';
import WebRTCConfigModal from '../components/live/WebRTCConfigModal';
import BreakoutRoomsModal from '../components/live/BreakoutRoomsModal';
import AIModeration from '../components/live/AIModeration';
import GreenRoomModal from '../components/live/GreenRoomModal';
import CoStreamHub from '../components/live/CoStreamHub';
import AuraPanelDrawer from '../components/live/AuraPanelDrawer';
import AuraPanel from '../components/live/AuraPanel';
import ClipMarker from '../components/live/ClipMarker';
import ClipCreatorSheet from '../components/live/ClipCreatorSheet';
import OverlayThemeBuilder from '../components/live/OverlayThemeBuilder';
import LiveGoalWidget from '../components/live/LiveGoalWidget';
import SuperChatRail from '../components/live/SuperChatRail';
import GuestQueue from '../components/live/GuestQueue';
import AggregatedChat from '../components/live/AggregatedChat';
import PartyHypeMeter from '../components/watchparty/PartyHypeMeter';
import PKBattle from '../components/live/PKBattle';
import PKBattleModal from '../components/live/PKBattleModal';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const BG      = '#080B18';
const BG2     = '#0d0618';
const BG3     = '#110822';
const OCT     = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const PALETTE = ['#8B6F47','#6B7C4A','#CC7755','#4A6B7C','#7C4A6B','#5C6BC0','#4A8A7A','#EF6C00'];

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
          style={{ clipPath: OCT, background: `linear-gradient(145deg, ${CRIMSON}99, ${BG2})` }}>

          {stream ? (
            <video ref={videoRef} autoPlay playsInline muted={isLocal}
              className={'absolute inset-0 w-full h-full object-cover' + (isLocal ? ' scale-x-[-1]' : '')} />
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
            style={{ background: '#C0392B', border: `2px solid ${BG}` }}>
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

  // Read device preferences saved by RoomEntryGate PermissionsStep
  const prefMic = (() => { try { return localStorage.getItem('swl_pref_mic') || null; } catch { return null; } })();

  // Real camera + peer mesh (falls back gracefully when no roomId)
  const { localStream, audioEnabled, toggleAudio, applyAudioConstraints, error: mediaError, reacquire: reacquireMedia } = useLocalMedia({
    audio: true,
    video: false,
    audioDeviceId: prefMic,
  });
  const { speakers } = useCameraDevices();
  const { remoteStreams, peerUserIds, announceJoin, leaveRoom, peersRef } = useWebRTCPeers(roomId, localStream);
  const announceJoinRef = useRef(announceJoin);
  const leaveRoomRef = useRef(leaveRoom);
  useEffect(() => { announceJoinRef.current = announceJoin; }, [announceJoin]);
  useEffect(() => { leaveRoomRef.current = leaveRoom; }, [leaveRoom]);
  useEffect(() => {
    if (!user?.id || !roomId) return;
    announceJoinRef.current?.(user.id);
  }, [user?.id, roomId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => leaveRoomRef.current?.(), []);

  const { isSpeaking: localSpeaking } = useAutoSpeakGate({ stream: localStream, enabled: true });
  const { extractClipBlobUrl } = useVODRecording({ streamId: roomId || '', creatorId: user?.id || '', title: '', stream: localStream });
  const subCount = useSubscriptionCount(party?.host_id || user?.id);

  // Derive the first active RTCPeerConnection for connection quality monitoring
  const [activePc, setActivePc] = useState(null);
  useEffect(() => {
    const entries = Array.from(peersRef.current.entries());
    const connected = entries.find(([, { pc }]) => pc.connectionState === 'connected');
    setActivePc(connected ? connected[1].pc : null);
  }, [remoteStreams]); // eslint-disable-line react-hooks/exhaustive-deps

  const { bars: netBars, label: netLabel, rtt: netRtt, quality: netQuality } = useConnectionQuality(activePc, 5000);

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
        name:     m.user_name || 'Guest',
        role:     m.user_id === party?.host_id ? 'host' : m.role || 'speaker',
        speaking: false,
        muted:    m.is_audio_enabled === false,
      }))
    : DEMO_STAGE;

  const audience = roomId && members.length > 6
    ? members.slice(6).map(m => ({ id: m.id, name: m.user_name || 'Viewer' }))
    : DEMO_AUDIENCE;

  const roomTitle  = party?.title || (roomId ? 'Live Room' : 'Demo Room');
  const hostName   = party ? (members.find(m => m.user_id === party.host_id)?.user_name || 'Host') : 'SwanyThree';
  const [busViewerCount, setBusViewerCount] = useState(0);
  const liveCount  = Math.max(busViewerCount, members.length || 0) || 20;
  const isLive     = !roomId || members.length > 0 || (remoteStreams?.size ?? 0) > 0;

  const [prefSpeaker, setPrefSpeaker]   = useState(() => { try { return localStorage.getItem('swl_pref_speaker') || ''; } catch { return ''; } });
  const [noiseSupp,   setNoiseSupp]     = useState(true);
  const [echoCan,     setEchoCan]       = useState(true);
  const [autoGain,    setAutoGain]      = useState(true);
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);
  const [showGreenRoomModal, setShowGreenRoomModal] = useState(false);
  const [showBreakoutRooms, setShowBreakoutRooms] = useState(false);
  const [showWebRTCConfig, setShowWebRTCConfig] = useState(false);
  const [showActivitySidebar, setShowActivitySidebar] = useState(false);
  const [showPKBattleModal, setShowPKBattleModal] = useState(false);

  // Elapsed-seconds counter (starts on mount)
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  // Highlight auto-clip detector
  const [chatMessages, setChatMessages] = useState([]);
  const [hypeLevel, setHypeLevel] = useState(0);
  useHighlightDetector({ partyId: roomId, roomId, isHost, user, messages: chatMessages, hypeLevel, elapsedSeconds: elapsed, getClipBlobUrl: extractClipBlobUrl });

  // Screen share
  const [isSharing, setIsSharing] = useState(false);
  const [activeScene, setActiveScene] = useState('main');
  const [selectedBitrate, setSelectedBitrate] = useState('auto');
  const screenStreamRef = useRef(null);
  const handleStartShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = stream;
      stream.getVideoTracks()[0].onended = () => { screenStreamRef.current = null; setIsSharing(false); };
      setIsSharing(true);
    } catch {}
  };
  const handleStopShare = () => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    setIsSharing(false);
  };

  // Local UI state
  const [stageData, setStageData]       = useState(stage);
  const [spotlit, setSpotlit]           = useState(null);
  const [chatOpen, setChatOpen]         = useState(false);
  const [chatMsgs, setChatMsgs]         = useState(DEMO_CHAT);
  const [unread, setUnread]             = useState(0);
  const [liked, setLiked]               = useState(false);
  const [likeCount, setLikeCount]       = useState(3);
  const [handRaised, setHandRaised]     = useState(false);
  const [shareOpen, setShareOpen]       = useState(false);
  const [payOpen, setPayOpen]           = useState(false);
  const [giftOpen, setGiftOpen]         = useState(false);
  const [giftEvent, setGiftEvent]       = useState(null);
  const lastGiftTsRef                   = useRef(0);
  // Panel Seat Approval
  const [approvalMode, setApprovalMode]   = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Sync stage when real data arrives
  useEffect(() => { if (stage.length) setStageData(stage); }, [members]);

  // Patch local user's speaking field with live VAD data
  useEffect(() => {
    if (!user?.id) return;
    setStageData(prev => prev.map(s =>
      s.userId === user.id ? { ...s, speaking: localSpeaking } : s
    ));
  }, [localSpeaking, user?.id]);

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

  const myMember = members.find(m => m.user_id === user?.id);
  const [pttActive, setPttActive] = useState(false);
  const pttWasEnabledRef = useRef(false);

  function handleToggleAudio() {
    toggleAudio();
    if (myMember?.id) {
      base44.entities.WatchPartyMember.update(myMember.id, { is_audio_enabled: !audioEnabled }).catch(() => {});
    }
  }

  // Keyboard shortcuts: M = mic toggle, Space = push-to-talk
  useEffect(() => {
    const onDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if (e.key === 'm' || e.key === 'M') { e.preventDefault(); handleToggleAudio(); }
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        if (!audioEnabled) {
          pttWasEnabledRef.current = false;
          setPttActive(true);
          toggleAudio();
        } else {
          pttWasEnabledRef.current = true;
        }
      }
    };
    const onUp = (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (pttActive && !pttWasEnabledRef.current) toggleAudio();
        setPttActive(false);
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioEnabled, pttActive]);

  // Route audio output to selected speaker device
  useEffect(() => {
    if (!prefSpeaker) return;
    document.querySelectorAll('video, audio').forEach(el => {
      if (typeof el.setSinkId === 'function') {
        el.setSinkId(prefSpeaker).catch(() => {});
      }
    });
    try { localStorage.setItem('swl_pref_speaker', prefSpeaker); } catch {}
  }, [prefSpeaker]);

  // Apply mic processing constraints live
  useEffect(() => {
    applyAudioConstraints({ noiseSuppression: noiseSupp, echoCancellation: echoCan, autoGainControl: autoGain });
  }, [noiseSupp, echoCan, autoGain, applyAudioConstraints]);

  const activeSpeaker = stageData.find(s => s.speaking);
  const stageCols = stageData.length <= 4 ? 2 : stageData.length <= 9 ? 3 : 4;
  const tileSize = stageCols === 2 ? 120 : stageCols === 3 ? 88 : 72;

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

  // Panel service: join and listen for seat requests when host
  useEffect(() => {
    if (!roomId || !user?.id) return;
    panelService.joinPanel(roomId, user.id);
    const offReq = panelService.onJoinRequest(req => {
      setPendingRequests(prev => [...prev.filter(r => r.id !== req.id), req]);
    });
    const offRes = panelService.onRequestResolved(({ id }) => {
      setPendingRequests(prev => prev.filter(r => r.id !== id));
    });
    return () => {
      offReq();
      offRes();
      panelService.leavePanel(roomId, user.id);
    };
  }, [roomId, user?.id]);

  function approveRequest(req) {
    panelService.resolveJoinRequest(roomId, req.id, true, user?.id);
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
  }

  function denyRequest(req) {
    panelService.resolveJoinRequest(roomId, req.id, false, user?.id);
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
  }

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
        {/* Connection quality badge */}
        <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg shrink-0"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          title={`Network: ${netLabel}${netRtt ? ` · ${netRtt}ms` : ''}`}>
          {[0,1,2,3].map(i => (
            <div key={i} className="w-1 rounded-sm"
              style={{
                height: 4 + i * 3,
                background: i < netBars
                  ? (netBars >= 3 ? '#6DBF7E' : netBars >= 2 ? '#D4AF37' : '#C0392B')
                  : 'rgba(255,255,255,0.15)',
              }} />
          ))}
        </div>
        <button className="w-7 h-7 flex items-center justify-center">
          <MoreHorizontal className="w-4 h-4 text-white/40" />
        </button>
        <button className="w-7 h-7 flex items-center justify-center" onClick={() => setShareOpen(true)}>
          <Share2 className="w-4 h-4 text-white/40" />
        </button>
        <button className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <Minus className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>

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
        </div>

        {/* ── Stage header ─────────────────────────────────────────────────── */}
        <div className="px-4 mb-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[17px] font-black text-white">Stage</span>
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {stageData.length}/20
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
                <StageTile p={spotlit} size={170} onClick={() => setSpotlit(null)} />
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 px-1">
                {stageData.filter(s => s.id !== spotlit.id).map(p => (
                  <div key={p.id} className="shrink-0">
                    <StageTile p={p} size={72} onClick={() => setSpotlit(p)} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${stageCols}, 1fr)` }}>
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

        {/* ── Panel Seat Approval (host only) ──────────────────────────────── */}
        {isHost && (
          <div className="px-4 mb-4">
            <div className="p-3 rounded-2xl" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-black text-white uppercase tracking-wide"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Panel Seat Approval</span>
                <button
                  onClick={() => setApprovalMode(m => !m)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black uppercase transition-all"
                  style={{
                    background: approvalMode ? `linear-gradient(90deg, ${CRIMSON}, ${GOLD})` : 'rgba(255,255,255,0.07)',
                    border: approvalMode ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    color: approvalMode ? '#000' : 'rgba(255,255,255,0.5)',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    userSelect: 'none',
                  }}>
                  {approvalMode ? 'ON' : 'OFF'}
                </button>
              </div>
              <p className="text-[11px] mb-2" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                {approvalMode ? 'Viewers must be approved before joining the panel.' : 'Any viewer can join the panel freely.'}
              </p>
              {approvalMode && pendingRequests.length > 0 && (
                <div className="space-y-2 mt-2">
                  <p className="text-[10px] uppercase font-bold" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
                    Pending Requests ({pendingRequests.length})
                  </p>
                  {pendingRequests.map(req => (
                    <div key={req.id} className="flex items-center gap-2 p-2 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                        style={{ background: avatarColor(req.displayName || 'G') + '55', color: avatarColor(req.displayName || 'G') }}>
                        {(req.displayName || 'G').charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-xs font-semibold text-white truncate"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {req.displayName || 'Guest'}
                      </span>
                      <button onClick={() => approveRequest(req)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase"
                        style={{ background: 'rgba(109,191,126,0.15)', border: '1px solid rgba(109,191,126,0.3)', color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif', userSelect: 'none' }}>
                        Approve
                      </button>
                      <button onClick={() => denyRequest(req)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase"
                        style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.25)', color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif', userSelect: 'none' }}>
                        Deny
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {approvalMode && pendingRequests.length === 0 && (
                <p className="text-center text-[11px] py-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  No pending requests
                </p>
              )}
            </div>
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
          <div className="grid grid-cols-5 gap-x-2 gap-y-3">
            {audience.map(p => (
              <div key={p.id} className="flex justify-center">
                <AudienceTile p={p} />
              </div>
            ))}
          </div>
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

          {/* Mic + PTT */}
          <div className="relative flex flex-col items-center gap-0.5">
            <button onClick={handleToggleAudio} className="flex flex-col items-center gap-0.5">
              <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: pttActive ? 'rgba(109,191,126,0.25)' : !audioEnabled ? 'rgba(192,57,43,0.15)' : `${GOLD}1A`,
                  border: pttActive ? '1px solid rgba(109,191,126,0.6)' : !audioEnabled ? '1px solid rgba(192,57,43,0.4)' : `1px solid ${GOLD}55`,
                }}>
                {!audioEnabled
                  ? <MicOff className="w-4 h-4 text-[#C0392B]" />
                  : <Mic className="w-4 h-4" style={{ color: pttActive ? '#6DBF7E' : GOLD }} />}
              </div>
              <span className="text-[11px] text-white/35">{pttActive ? 'PTT' : ' '}</span>
            </button>
          </div>

          {/* Audio settings */}
          <button onClick={() => setAudioSettingsOpen(v => !v)} className="flex flex-col items-center gap-0.5" title="Audio settings">
            <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
              style={{ background: audioSettingsOpen ? `${GOLD}20` : 'rgba(255,255,255,0.07)', border: audioSettingsOpen ? `1px solid ${GOLD}55` : '1px solid rgba(255,255,255,0.1)' }}>
              <Settings className="w-4 h-4" style={{ color: audioSettingsOpen ? GOLD : 'rgba(255,255,255,0.55)' }} />
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

      {/* Audio settings panel */}
      <AnimatePresence>
        {audioSettingsOpen && (
          <>
            <motion.div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAudioSettingsOpen(false)} />
            <motion.div
              className="fixed inset-x-0 z-50 rounded-t-2xl overflow-hidden"
              style={{ bottom: 72, background: BG, borderTop: `1px solid rgba(212,175,55,0.2)` }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-black uppercase text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Audio Settings</span>
                <button onClick={() => setAudioSettingsOpen(false)} className="text-white/40 text-sm">✕</button>
              </div>
              <div className="p-4 space-y-4" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {speakers.length > 1 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5" style={{ color: GOLD }} />
                      <span className="text-xs font-bold uppercase text-white/60">Output Device</span>
                    </div>
                    <select
                      value={prefSpeaker}
                      onChange={e => setPrefSpeaker(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      {speakers.map(d => (
                        <option key={d.deviceId} value={d.deviceId} style={{ background: '#111' }}>
                          {d.label || `Speaker ${d.deviceId.slice(0, 6)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase text-white/60">Mic Processing</span>
                  {[
                    { label: 'Noise Suppression', value: noiseSupp, set: setNoiseSupp },
                    { label: 'Echo Cancellation', value: echoCan,   set: setEchoCan   },
                    { label: 'Auto Gain',          value: autoGain,  set: setAutoGain  },
                  ].map(({ label, value, set }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-white/80">{label}</span>
                      <button
                        onClick={() => set(v => !v)}
                        className="relative w-10 h-5 rounded-full transition-all"
                        style={{ background: value ? GOLD : 'rgba(255,255,255,0.15)' }}
                        aria-label={label}
                      >
                        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                          style={{ left: 2, transform: value ? 'translateX(20px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
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
          setGiftOpen(false);
        }}
      />

      <GiftAnimation event={giftEvent} onDone={() => setGiftEvent(null)} />

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
      <SwanAIRecommendations roomId={roomId} currentLayout="live" viewerCount={liveCount} />
      <MilestoneAlerts userId={user?.id} roomId={roomId} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {party?.host_id && <ShopDashboard creatorId={party.host_id} />}
      {roomId && <ZEGOGuestApprovalPanel roomId={roomId} isHost={isHost} />}
      {roomId && <ZEGOStreamHealthCard roomId={roomId} />}
      {user && <ZEGOConfigPanel user={user} />}
      {roomId && <RealtimeLeaderboard roomId={roomId} creatorId={party?.host_id || user?.id} />}
      {roomId && <LiveTranscription isLive={true} roomId={roomId} stream={localStream} />}
      {roomId && <ViewerControlsPanel roomId={roomId} currentUser={user} onClose={() => {}} />}
      {roomId && user?.id && <VirtualCurrencyTips roomId={roomId} creatorId={party?.host_id || user?.id} currentUser={user} isHost={isHost} />}
      {roomId && <GoldenWall roomId={roomId} />}
      {isHost && roomId && <SwanDirectorHUD roomId={roomId} hostId={user?.id} onOpenPanel={() => {}} />}
      {isHost && roomId && <StreamerGoalsWidget creatorId={party?.host_id || user?.id} roomId={roomId} isCreator={isHost} embedded={true} />}
      {isHost && roomId && <PayPerViewManager roomId={roomId} />}
      {isHost && roomId && <MonetizationDashboard roomId={roomId} />}
      {roomId && <GiftShopTray roomId={roomId} currentUser={user} />}
      {roomId && <GiftLeaderboard roomId={roomId} />}
      {isHost && <SubscriptionManager creatorId={party?.host_id || user?.id} />}
      {roomId && <TipAlert roomId={roomId} recipientId={party?.host_id || user?.id} />}
      {!isHost && roomId && <TippingModal isOpen={false} onClose={() => {}} recipient={null} roomId={roomId} />}
      {roomId && <LiveAuctionWidget creatorId={party?.host_id || user?.id} roomId={roomId} isCreator={isHost} currentUser={user} />}
      <MerchWidget />
      <NotificationBell />
      {roomId && <PKBattleInterface roomId={roomId} />}
      {roomId && <CoStreamPanel roomId={roomId} />}
      {isHost && roomId && <CollaborativeWhiteboard roomId={roomId} />}
      {roomId && user?.id && <PointsEarnWidget userId={user.id} creatorId={party?.host_id || user?.id} roomId={roomId} isHost={isHost} />}
      {isHost && roomId && <RedemptionQueue creatorId={party?.host_id || user?.id} roomId={roomId} />}
      {roomId && <RewardShop creatorId={party?.host_id || user?.id} roomId={roomId} currentUser={user} />}
      {!isHost && user?.id && <ViewerLoyaltyCard userId={user.id} creatorId={party?.host_id || user?.id} compact={true} />}
      {roomId && <GreenroomQueue roomId={roomId} isHost={isHost} />}
      {isHost && <StreamingPresets onApply={() => {}} />}
      {roomId && <EmbedPlayer roomId={roomId} creatorName={user?.full_name || ''} streamTitle={party?.title || 'Live Stream'} viewerCount={liveCount} />}
      <LiveTranslationWidget chatMessage={chatMessages[chatMessages.length - 1]?.content || null} onTranslation={() => {}} />
      {isHost && user?.id && <RecordingManager userId={user.id} />}
      {isHost && <OBSBridge />}
      <ZEGOMobileAppBanner />
      {isHost && roomId && <AutomatedClipGenerator streamSession={{room_id: roomId}} isLive={roomId != null} />}
      {roomId && <InteractivePollWidget roomId={roomId} isHost={isHost} />}
      {isHost && <StreamMetadataEditor initialTitle={party?.title || 'Live Stream'} initialCategory={'entertainment'} />}
      {isHost && <StreamerMonetizationCenter />}
      {!isHost && roomId && <AnimatedGiftShop recipientId={party?.host_id || user?.id} roomId={roomId} onClose={() => {}} />}
      {isHost && user?.id && <VirtualGoodsStore userId={user.id} />}
      {isHost && <SoundAlertsManager creatorId={party?.host_id || user?.id} />}
      <ShareToSocial content={{text: ''}} />
      {isHost && roomId && user?.id && <VideoShortRecorder roomId={roomId} creatorId={user.id} />}
      {isHost && <BroadcastAnalyticsDashboard streamSession={null} isLive={roomId != null} />}
      {isHost && roomId && <AutomatedHighlightReels streamSession={{room_id: roomId}} />}
      {roomId && <PerformanceDashboard roomId={roomId} sessionId={roomId} />}
      <StreamHealthDashboard isLive={roomId != null} />
      {!isHost && roomId && <QuickTip recipientId={party?.host_id || user?.id} recipientName={''} onTipSent={() => {}} />}
      {isHost && <LowerThirdsBanner onBannerChange={() => {}} />}
      {isHost && <SceneSwitcher activeScene={activeScene} onSceneChange={(s) => { setActiveScene(s); if ((s === 'screen' || s === 'pip') && !isSharing) handleStartShare(); else if (s === 'camera' && isSharing) handleStopShare(); }} />}
      <NotificationHub />
      {isHost && <SoundboardWidget isVisible={true} />}
      {isHost && roomId && <RaidPanelButton room={party} currentUser={user} isHost={isHost} />}
      {roomId && <LiveAudiencePulse roomId={roomId} isHost={isHost} viewerCount={liveCount} />}
      {roomId && <StreamAnalyticsDashboard roomId={roomId} />}
      {isHost && roomId && <AIStreamSummary roomId={roomId} isHost={isHost} streamTitle={party?.title || ''} viewerCount={liveCount} elapsedSeconds={elapsed} />}
      {isHost && <ChatModeration collapsed={true} />}
      <BrandChyron />
      {!isHost && roomId && user?.id && <WhisperPanel roomId={roomId} currentUser={user} recipientId={party?.host_id || user?.id} recipientName={''} onClose={() => {}} />}
      <HostAlertCenter />
      {roomId && <AICopilotSidebar roomId={roomId} isHost={isHost} viewerCount={liveCount} />}
      {isHost && roomId && <EnhancedPollingSystem roomId={roomId} hostId={party?.host_id || user?.id} isHost={isHost} />}
      {roomId && user?.id && <SuperChatBar roomId={roomId} currentUser={user} recipientId={party?.host_id || user?.id} recipientName={''} />}
      {user?.id && <SwanyBotEnhanced userId={user.id} conversationId={null} onContextReady={() => {}} />}
      {isHost && <LocalVideoTile stream={localStream} audioEnabled={audioEnabled} videoEnabled={false} userName={user?.full_name || ''} isHost={isHost} isSpeaking={localSpeaking} />}
      {isHost && <OctagonalVideoWindow title={'My Mic'} isMuted={!audioEnabled} isVideoOff={true} onMicToggle={handleToggleAudio} onVideoToggle={() => {}} />}
      {isHost && <AudioPanel micMuted={!audioEnabled} onMicToggle={toggleAudio} participants={members} />}
      {isHost && <EvmuxWebSource isActive={false} onClose={() => {}} />}
      {roomId && <LivePollOverlay roomId={roomId} currentUser={user} isHost={isHost} position={'bottom-left'} />}
      {isHost && <StripeConnectButton creatorId={party?.host_id || user?.id} />}
      {!isHost && user?.id && <StripeSubscribeButton creatorId={party?.host_id || user?.id} creatorName={''} currentUserId={user.id} />}
      {<SubscriptionTiers communityId={null} userId={user?.id} />}
      {party && <WatchPartyAnalytics party={party} members={members} pollCount={0} reactionCount={0} />}
      {roomId && user?.id && <ZEGOGuestJoin roomId={roomId} userId={user.id} userName={user?.full_name || ''} onJoined={() => {}} />}
      {roomId && <PaymentMethodSelector creatorId={party?.host_id || user?.id} roomId={roomId} onPaymentComplete={() => {}} />}
      {isHost && <CreatorTierManager creatorId={party?.host_id || user?.id} />}
      {user?.id && <TierBadge tier={null} size={'sm'} showName={false} />}
      {user?.id && <LoyaltyBadge userId={user.id} creatorId={party?.host_id || user?.id} />}
      {roomId && <GuestGrid participants={members} isHost={isHost} onInvite={() => {}} hostId={user?.id} />}
      {isHost && roomId && <EnhancedRoomControls isHost={isHost} roomData={party} micMuted={!audioEnabled} onMicToggle={handleToggleAudio} onAudioSettingsChange={() => {}} />}
      <CollabPlaylist isHost={isHost} currentUser={user} onPlayVideo={() => {}} />
      <YouTubeDiscovery />
      <ActivitySidebar isOpen={showActivitySidebar} onClose={() => setShowActivitySidebar(false)} />
      <GlobalSearch onClose={() => {}} />
      {roomId && <PayPerViewGate roomId={roomId} ppvPrice={4.99} onPurchase={() => {}} />}
      <PaywallGate isHost={isHost} streamTitle={party?.title || ''} onUnlock={() => {}} isUnlocked={true} />
      {roomId && <SubscriptionGate creatorId={party?.host_id || user?.id} roomId={roomId} />}
      {roomId && <ModerationAppealPanel flagId={null} messageId={null} roomId={roomId} onClose={() => {}} />}
      {isHost && user?.id && <GuestDestinationsPanel participantUserId={user.id} guestName={user?.full_name || ''} />}
      {isHost && <GuestStreamingPermissions participant={null} isHost={isHost} onUpdate={() => {}} />}
      {isHost && roomId && <MultiStreamConfig roomId={roomId} isHost={isHost} />}
      {roomId && <VdoNinjaGuestLink roomId={roomId} />}
      <WebRTCSetupBanner error={mediaError} audioEnabled={audioEnabled} videoEnabled={false} onRetry={reacquireMedia} />
      {isHost && roomId && <WebhookHooks roomId={roomId} isHost={isHost} />}
      {isHost && <PKBattleSoundboard battleId={roomId} isBattleActive={roomId != null} />}
      <PanelMusicPlayer />
      {isHost && roomId && <PollLaunchBar roomId={roomId} hostId={user?.id} activePoll={null} isHost={isHost} />}
      {party && <PreStreamCountdown room={party} currentUser={user} onGoLive={() => { if (isHost && roomId) base44.entities.WatchParty.update(roomId, { status: 'live' }).catch(() => {}); }} />}
      <PrivatePanel isHost={isHost} currentUser={user} />
      {roomId && <StreamChatbot roomId={roomId} isHost={isHost} elapsedSeconds={elapsed} hostName={user?.full_name || ''} room={party} />}
      {roomId && <StreamEventBus roomId={roomId} isHost={isHost} sessionId={roomId} onViewerUpdate={setBusViewerCount} onTipReceived={msg => setTipTotal(t => t + Math.floor(msg?.tip_amount || 0))} onMessageReceived={() => {}} />}
      {roomId && <TippingOverlay roomId={roomId} creatorId={party?.host_id || user?.id} isVisible={true} />}
      {roomId && <UnifiedChat roomId={roomId} currentUser={user} isHost={isHost} />}
      {isHost && roomId && <AIPersonaCustomizer roomId={roomId} sessionId={roomId} onCustomized={() => {}} />}
      {isHost && <AudioMixer micMuted={!audioEnabled} onMicToggle={handleToggleAudio} />}
      {isHost && <EnhancedAudioMixer micMuted={!audioEnabled} onMicToggle={handleToggleAudio} onAudioSettingsChange={() => {}} />
      {isHost && <ScreenSharePanel isSharing={isSharing} onStartShare={handleStartShare} onStopShare={handleStopShare} />}
      {roomId && <AuraEmotionDisplay roomId={roomId} sessionId={roomId} auraPersona={'hype'} />}
      {roomId && <BattleScoreboard roomId={roomId} />}
      {roomId && user?.id && <EnhancedStreamChat roomId={roomId} userId={user.id} userName={user?.full_name || ''} userRole={isHost ? 'host' : 'viewer'} />}
      <GlobalChatWidget />
      {isHost && roomId && <GuestConnector roomId={roomId} roomName={''} />}
      {roomId && <InteractivePollingSystem roomId={roomId} isHost={isHost} currentUser={user} />}
      {roomId && <LeaderboardPanel roomId={roomId} />}
      {roomId && <MobileStreamControls micMuted={!audioEnabled} onMicToggle={handleToggleAudio} onReact={() => {}} onQuickTip={() => {}} roomId={roomId} />}
      {user?.id && <PointsNotification userId={user.id} />}
      {roomId && user?.id && <EngagementBadgesDisplay roomId={roomId} userId={user.id} creatorId={party?.host_id || user?.id} />}
      {roomId && <ChatOverlay roomId={roomId} isVisible={true} />}
      {roomId && <BattleMode roomId={roomId} isHost={isHost} hostName={user?.full_name || ''} />}
      {isHost && <BitratePresets selected={selectedBitrate} onChange={setSelectedBitrate} />}
      {isHost && user?.id && <GuestRTMPPanel participantId={user.id} userId={user.id} />}
      {isHost && <GuestStreamMonitor guestName={user?.full_name || ''} isStreaming={roomId != null} />}
      {roomId && <TranscriptionPanel recordingUrl={''} roomTitle={''} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={isHost} currentTips={tipTotal} currentSubs={subCount} currentViewers={liveCount} />
      <ViewerCount count={liveCount} peakViewers={peakViewers} />
      {isHost && roomId && user?.id && <ClipCreator roomId={roomId} creatorId={user.id} streamTitle={party?.title || ''} elapsedSeconds={elapsed} currentUser={user} />}
      {isHost && roomId && user?.id && <StreamHighlightCapture roomId={roomId} sessionId={roomId} creatorId={user.id} elapsedSeconds={elapsed} isHost={isHost} />}
      {isHost && roomId && <QuickPollLauncher roomId={roomId} hostId={user?.id} isHost={isHost} />}
      {!isHost && roomId && party?.host_id && <GiftTray roomId={roomId} currentUser={user} recipientId={party.host_id} />}
      {isHost && party && <RoomBrandingEditor roomData={party} onBrandingChange={() => {}} isHost={isHost} />}
      <BackgroundCustomizer />
      <GuestCoStreamDashboard roomId={roomId} currentUser={user || null} isHost={true} />
      <TipGoalBar roomId={null} goal={100} current={0} />
      <TopTippers roomId={null} />

      {/* ── New feature stubs ──────────────────────────────────────────────── */}
      {roomId && <AggregatedChat roomId={roomId} currentUser={user} isHost={isHost} onMessagesChange={setChatMessages} />}
      {roomId && <AIModeration roomId={roomId} isHost={isHost} />}
      {isHost && roomId && <GreenRoomModal isOpen={showGreenRoomModal} onClose={() => setShowGreenRoomModal(false)} onReady={() => { setShowGreenRoomModal(false); base44.entities.WatchParty.update(roomId, { status: 'live' }).catch(() => {}); }} localStream={localStream} audioEnabled={audioEnabled} />}
      {isHost && roomId && <WebRTCConfigModal isOpen={showWebRTCConfig} onClose={() => setShowWebRTCConfig(false)} onApply={() => setShowWebRTCConfig(false)} currentConfig={{}} />}
      {roomId && <BreakoutRoomsModal isOpen={showBreakoutRooms} onClose={() => setShowBreakoutRooms(false)} roomId={roomId} roomTitle={roomTitle} currentUser={user} />}
      {roomId && <CoStreamHub roomId={roomId} isHost={isHost} isCoHost={false} currentUser={user} compact={true} />}
      {roomId && party?.host_id && <AuraPanelDrawer roomId={roomId} hostId={party.host_id} onClose={() => {}} />}
      {roomId && <AuraPanel roomId={roomId} isHost={isHost} streamTitle={roomTitle} viewerCount={liveCount} isLive={isLive} userTier={'free'} />}
      {isHost && roomId && user?.id && <ClipMarker roomId={roomId} user={user} streamStartTs={elapsed > 0 ? Date.now() - elapsed * 1000 : null} getClipBlobUrl={extractClipBlobUrl} />}
      {isHost && roomId && user?.id && <ClipCreatorSheet roomId={roomId} sessionId={roomId} creatorId={user.id} elapsedSeconds={elapsed} roomTitle={roomTitle} onClose={() => {}} />}
      {isHost && <OverlayThemeBuilder creatorId={user?.id} />}
      <LiveGoalWidget memberCount={members.length} tipTotal={tipTotal} subCount={subCount} />
      {roomId && <PartyHypeMeter partyId={roomId} memberCount={liveCount} onHypeChange={setHypeLevel} />}
      <SuperChatRail superchats={[]} />
      {roomId && <GuestQueue roomId={roomId} isHost={isHost} />}
      {roomId && <PKBattle roomId={roomId} isHost={isHost} hostName={hostName} viewerCount={liveCount} />}
      {roomId && <PKBattleModal isOpen={showPKBattleModal} onClose={() => setShowPKBattleModal(false)} roomId={roomId} isHost={isHost} currentUser={user} hostName={hostName} />}

      <NetworkQualityBanner quality={netQuality} rtt={netRtt} />

      <KeyboardShortcutsHelp shortcuts={[
        { key: 'M',     label: 'Toggle microphone' },
        { key: 'Space', label: 'Push-to-talk (hold when muted)' },
        { key: '?',     label: 'Show keyboard shortcuts' },
      ]} />
    </div>
  );
}
