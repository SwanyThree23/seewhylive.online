import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, MessageCircle, Heart, Hand,
  ChevronLeft, MoreHorizontal, Share2, Users, Crown, Radio, Plus, Settings, Volume2
} from 'lucide-react';
import { useCameraDevices } from '../hooks/useCameraDevices';
import KeyboardShortcutsHelp from '../components/live/KeyboardShortcutsHelp';
import NetworkQualityBanner from '../components/live/NetworkQualityBanner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
import { useAutoSpeakGate } from '../hooks/useAutoSpeakGate';
import { useConnectionQuality } from '../hooks/useConnectionQuality';
import { useVODRecording } from '../hooks/useVODRecording';
import { useSubscriptionCount } from '../hooks/useSubscriptionCount';
import AggregatedChat from '../components/live/AggregatedChat';
import AudioStageTab from '../components/audio/AudioStageTab';
import LoveTap from '../components/live/LoveTap';
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
import WebRTCConfigModal from '../components/live/WebRTCConfigModal';
import BreakoutRoomsModal from '../components/live/BreakoutRoomsModal';
import AIModeration from '../components/live/AIModeration';
import GreenRoomModal from '../components/live/GreenRoomModal';
import ShareModal from '../components/live/ShareModal';
import CoStreamHub from '../components/live/CoStreamHub';
import AuraPanelDrawer from '../components/live/AuraPanelDrawer';
import AuraPanel from '../components/live/AuraPanel';
import LiveGoalWidget from '../components/live/LiveGoalWidget';
import SuperChatRail from '../components/live/SuperChatRail';
import LoveTap from '../components/live/LoveTap';
import OverlayThemeBuilder from '../components/live/OverlayThemeBuilder';
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const BG      = '#080B18';
const BG2     = '#0d0618';
const GREEN   = '#6DBF7E';

const PALETTE = ['#8B6F47','#6B7C4A','#CC7755','#4A6B7C','#7C4A6B','#5C6BC0','#4A8A7A','#EF6C00'];

function avatarColor(name) {
  return PALETTE[(name?.charCodeAt(0) ?? 0) % PALETTE.length];
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function SpeakerTile({ member, size = 80 }) {
  const isHost    = member.role === 'host';
  const isCohost  = member.role === 'cohost';
  const isMuted   = member.is_audio_enabled === false;
  const isSpeaking = member.speaking;
  const color     = avatarColor(member.user_name || 'A');

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: GOLD, opacity: 0.2 }}
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.08, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: isSpeaking ? `2.5px solid ${GOLD}` : `2px solid rgba(255,255,255,0.15)`,
            transition: 'border-color 0.3s',
          }}
        />
        <div
          className="absolute inset-[3px] rounded-full flex items-center justify-center font-black text-lg text-white"
          style={{ background: `linear-gradient(135deg, ${color}88, ${BG2})` }}
        >
          {(member.user_name || '?').charAt(0).toUpperCase()}
        </div>

        {(isHost || isCohost) && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
            <Crown className="w-3.5 h-3.5 drop-shadow" style={{ color: GOLD }} />
          </div>
        )}
        {isMuted && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#C0392B', border: `2px solid ${BG}` }}
          >
            <MicOff className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        <button
          className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <Heart className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
        </button>
      </div>
      <p className="text-[12px] font-bold text-black truncate" style={{ maxWidth: size + 8 }}>
        {(member.user_name || 'Guest').split(' ')[0]}
      </p>
    </div>
  );
}

function AudienceTile({ member }) {
  const size  = 52;
  const color = avatarColor(member.user_name || 'A');
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="rounded-full flex items-center justify-center font-bold text-sm text-white"
        style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}66, ${BG2})`, border: '2px solid rgba(255,255,255,0.1)' }}
      >
        {(member.user_name || '?').charAt(0).toUpperCase()}
      </div>
      <p className="text-[11px] truncate" style={{ color: '#888', maxWidth: size + 4 }}>
        {(member.user_name || 'Guest').slice(0, 8)}
      </p>
    </div>
  );
}

export default function AudioRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId    = urlParams.get('id');

  const prefMic = (() => { try { return localStorage.getItem('swl_pref_mic') || null; } catch { return null; } })();
  const { localStream, audioEnabled, toggleAudio, applyAudioConstraints, error: mediaError, reacquire: reacquireMedia } = useLocalMedia({ audio: true, video: false, audioDeviceId: prefMic });
  const { speakers } = useCameraDevices();
  const { remoteStreams, peerUserIds, peersRef } = useWebRTCPeers(roomId, localStream);
  const { isSpeaking: localIsSpeaking } = useAutoSpeakGate({ stream: localStream, enabled: !!localStream });
  const [busViewerCount, setBusViewerCount] = useState(0);
  const [lastChatMsg, setLastChatMsg] = useState(null);
  const [activeScene, setActiveScene] = useState('main');
  const [selectedBitrate, setSelectedBitrate] = useState(3000);
  const handleBitrateChange = (b) => { setSelectedBitrate(b); reacquireMedia({ resolution: ({1500:'480p',3000:'720p',5000:'1080p',7500:'1080p'})[b]||'720p' }); };

  const [activePc, setActivePc] = useState(null);
  useEffect(() => {
    const entries = Array.from(peersRef.current.entries());
    const connected = entries.find(([, { pc }]) => pc.connectionState === 'connected');
    setActivePc(connected ? connected[1].pc : null);
  }, [remoteStreams]); // eslint-disable-line react-hooks/exhaustive-deps

  const { bars: netBars, label: netLabel, rtt: netRtt, quality: netQuality } = useConnectionQuality(activePc, 5000);

  const { data: user }  = useQuery({ queryKey: ['currentUser'],   queryFn: () => base44.auth.me() });

  const { data: party } = useQuery({
    queryKey: ['audio-room', roomId],
    queryFn:  () => base44.entities.WatchParty.filter({ id: roomId }).then(r => r[0]),
    enabled:  !!roomId,
    refetchInterval: 10000,
  });
  const { data: members = [] } = useQuery({
    queryKey: ['audio-room-members', roomId],
    queryFn:  () => base44.entities.WatchPartyMember.filter({ party_id: roomId, is_active: true }),
    enabled:  !!roomId,
    refetchInterval: 10000,
  });
  const { data: loves = [] } = useQuery({
    queryKey: ['audio-room-loves', roomId],
    queryFn:  () => base44.entities.Tip.filter({ room_id: roomId, currency: 'love' }),
    enabled:  !!roomId,
    refetchInterval: 5000,
  });

  const [chatOpen,      setChatOpen]      = useState(false);
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [handRaised,    setHandRaised]    = useState(false);
  const [loveCount,     setLoveCount]     = useState(0);
  const [pttActive,     setPttActive]     = useState(false); // push-to-talk live state
  const pttWasEnabledRef = useRef(false); // was mic already on before PTT press?

  const [prefSpeaker, setPrefSpeaker] = useState(() => { try { return localStorage.getItem('swl_pref_speaker') || ''; } catch { return ''; } });
  const [noiseSupp,   setNoiseSupp]   = useState(true);
  const [echoCan,     setEchoCan]     = useState(true);
  const [autoGain,    setAutoGain]    = useState(true);

  const [createTitle,    setCreateTitle]    = useState('');
  const [createVideoUrl, setCreateVideoUrl] = useState('');
  const [creating,       setCreating]       = useState(false);

  // Elapsed-seconds counter (starts on mount)
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { setLoveCount(loves.length); }, [loves.length]);

  const speakers = members.length > 0
    ? members.filter(m => m.role === 'host' || m.role === 'cohost' || m.role === 'speaker')
    : [];
  const audience = members.length > 0
    ? members.filter(m => m.role !== 'host' && m.role !== 'cohost' && m.role !== 'speaker')
    : [];

  const speakerList = speakers.length > 0 ? speakers : members.slice(0, 6);
  const audienceList = speakers.length > 0 ? audience : members.slice(6);

  const isHost  = user?.id && party?.host_id && user.id === party.host_id;
  const ytId    = getYouTubeId(party?.video_url || '');
  const hostMember = members.find(m => m.user_id === party?.host_id);
  const myMember   = members.find(m => m.user_id === user?.id);
  const hostName   = hostMember?.user_name || party?.host_name || 'Host';
  const memberCount = members.length;
  const { extractClipBlobUrl } = useVODRecording({ streamId: roomId || '', creatorId: user?.id || '', title: party?.title || 'Live Audio', stream: localStream });
  const subCount = useSubscriptionCount(party?.host_id || user?.id);

  function handleToggleAudio() {
    toggleAudio();
    if (myMember?.id) {
      base44.entities.WatchPartyMember.update(myMember.id, { is_audio_enabled: !audioEnabled }).catch(() => {});
    }
  }

  // Keyboard shortcuts: M = mic toggle, Space = push-to-talk (hold)
  useEffect(() => {
    const onDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if (e.key === 'm' || e.key === 'M') { e.preventDefault(); handleToggleAudio(); }
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        // Push-to-talk: if currently muted, enable mic temporarily
        if (!audioEnabled) {
          pttWasEnabledRef.current = false;
          setPttActive(true);
          toggleAudio(); // unmute
        } else {
          pttWasEnabledRef.current = true;
        }
      }
    };
    const onUp = (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        // Release PTT: re-mute only if we were the ones who enabled it
        if (pttActive && !pttWasEnabledRef.current) {
          toggleAudio(); // re-mute
        }
        setPttActive(false);
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioEnabled, pttActive]);

  // Apply audio output device to all media elements when speaker pref changes
  useEffect(() => {
    if (!prefSpeaker) return;
    document.querySelectorAll('video, audio').forEach(el => {
      if (typeof el.setSinkId === 'function') {
        el.setSinkId(prefSpeaker).catch(() => {});
      }
    });
    try { localStorage.setItem('swl_pref_speaker', prefSpeaker); } catch {}
  }, [prefSpeaker]);

  // Apply live audio processing constraints (NS / EC / AGC)
  useEffect(() => {
    applyAudioConstraints({
      noiseSuppression: noiseSupp,
      echoCancellation: echoCan,
      autoGainControl:  autoGain,
    });
  }, [noiseSupp, echoCan, autoGain, applyAudioConstraints]);

  async function sendLove() {
    if (!user?.id || !roomId) {
      setLoveCount(c => c + 1);
      return;
    }
    try {
      await base44.entities.Tip.create({ room_id: roomId, user_id: user.id, currency: 'love', amount: 1 });
      setLoveCount(c => c + 1);
    } catch {
      setLoveCount(c => c + 1);
    }
  }

  function leaveRoom() {
    if (roomId && user?.id) {
      base44.entities.WatchPartyMember
        .filter({ party_id: roomId, user_id: user.id, is_active: true })
        .then(ms => ms.forEach(m =>
          base44.entities.WatchPartyMember.update(m.id, { is_active: false, left_at: new Date().toISOString() }).catch(() => {})
        )).catch(() => {});
    }
    window.history.back();
  }

  async function handleCreate() {
    if (!createTitle.trim() || creating) return;
    setCreating(true);
    try {
      const p = await base44.entities.WatchParty.create({
        title:       createTitle.trim(),
        video_url:   createVideoUrl.trim() || '',
        host_id:     user?.id,
        status:      'active',
        updated_at_ms: Date.now(),
      });
      window.location.href = `${window.location.pathname}?id=${p.id}`;
    } catch {
      toast.error('Failed to create room');
      setCreating(false);
    }
  }

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: BG, fontFamily: 'Barlow Condensed, sans-serif' }}>
        <div className="w-full max-w-md space-y-5">
          <div className="text-center">
            <Radio className="w-9 h-9 mx-auto mb-2" style={{ color: GOLD }} />
            <h1 className="text-3xl font-black uppercase tracking-wide" style={{ color: GOLD }}>Audio Room</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Clubhouse-style audio with optional video pin</p>
          </div>
          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <input
              value={createTitle}
              onChange={e => setCreateTitle(e.target.value)}
              placeholder="Room title…"
              className="w-full h-11 px-4 rounded-xl text-white placeholder:text-white/25 outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Barlow Condensed, sans-serif' }}
            />
            <input
              value={createVideoUrl}
              onChange={e => setCreateVideoUrl(e.target.value)}
              placeholder="YouTube URL (optional)…"
              className="w-full h-11 px-4 rounded-xl text-white placeholder:text-white/25 outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Barlow Condensed, sans-serif' }}
            />
            <button
              onClick={handleCreate}
              disabled={!createTitle.trim() || creating}
              className="w-full h-12 rounded-xl font-black uppercase text-base flex items-center justify-center gap-2 transition-all"
              style={{
                background: createTitle.trim() ? GOLD : 'rgba(255,255,255,0.06)',
                color:      createTitle.trim() ? '#000' : 'rgba(255,255,255,0.25)',
                border: 'none',
                fontFamily: 'Barlow Condensed, sans-serif',
              }}
            >
              <Plus className="w-5 h-5" />
              {creating ? 'Creating…' : 'Start Audio Room'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (roomId && !party) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD }} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: '#F5F5F5', fontFamily: 'Barlow Condensed, sans-serif' }}>

      <div className="shrink-0 flex items-center px-4 gap-3 h-12"
        style={{ background: 'rgba(255,255,255,0.97)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <button onClick={() => window.history.back()} className="flex items-center gap-1">
          <ChevronLeft className="w-5 h-5" style={{ color: '#111' }} />
          <span className="text-sm font-black" style={{ color: '#111' }}>All Rooms</span>
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-1" style={{ color: '#555' }}>
          <Users className="w-4 h-4" />
          <span className="text-sm font-bold">{memberCount}</span>
        </div>
        {/* Connection quality */}
        <div className="flex items-end gap-0.5 px-1.5 py-1 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.06)' }}
          title={`Network: ${netLabel}${netRtt ? ` · ${netRtt}ms` : ''}`}>
          {[0,1,2,3].map(i => (
            <div key={i} className="w-1 rounded-sm"
              style={{
                height: 4 + i * 3,
                background: i < netBars
                  ? (netBars >= 3 ? '#4A9B5E' : netBars >= 2 ? '#D4AF37' : '#C0392B')
                  : 'rgba(0,0,0,0.15)',
              }} />
          ))}
        </div>
        <button onClick={sendLove} className="flex items-center gap-1">
          <Heart className="w-4 h-4 text-[#C0392B]" fill="#C0392B" />
          <span className="text-sm font-bold" style={{ color: '#555' }}>{loveCount}</span>
        </button>
        <button>
          <MoreHorizontal className="w-5 h-5" style={{ color: '#555' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 80 }}>

        {party?.video_url && (
          <div className="bg-black" style={{ aspectRatio: '16/9', width: '100%', position: 'relative' }}>
            {ytId ? (
              <img
                src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                alt="video"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: '#111' }}>
                <span className="text-4xl">▶</span>
              </div>
            )}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.9)' }}>
                <span className="text-xl" style={{ color: '#111' }}>▶</span>
              </div>
            </div>
          </div>
        )}

        {party?.video_url && (
          <div className="px-4 py-3 bg-white border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            <p className="text-base font-black text-black leading-tight">{party?.title || 'Audio Room'}</p>
            <p className="text-sm" style={{ color: '#888' }}>Shared by {hostName}</p>
          </div>
        )}

        {!party?.video_url && (
          <div className="px-4 pt-4 pb-2">
            <p className="text-lg font-black text-black">{party?.title || 'Audio Room'}</p>
            <p className="text-sm" style={{ color: '#888' }}>Hosted by {hostName}</p>
          </div>
        )}

        <AudioStageTab
          roomId={roomId}
          user={user}
          party={party}
          members={members.map(m => ({
            ...m,
            display_name: m.user_name,
            speaking: m.user_id === user?.id ? localIsSpeaking : m.speaking,
          }))}
          localStream={localStream}
          remoteStreams={remoteStreams}
          peerUserIds={peerUserIds}
          onLeave={leaveRoom}
        />
      </div>

      <div
        className="fixed bottom-0 inset-x-0 flex items-center px-4 gap-3 shrink-0"
        style={{ height: 64, background: 'rgba(8,11,24,0.97)', borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={leaveRoom}
          className="text-[14px] font-black uppercase"
          style={{ color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Leave
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">

          <button
            onClick={() => setChatOpen(v => !v)}
            className="flex flex-col items-center gap-0.5"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: chatOpen ? `${GOLD}20` : 'rgba(255,255,255,0.07)',
                border: chatOpen ? `1px solid ${GOLD}55` : '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
          </button>

          <button onClick={sendLove} className="flex flex-col items-center gap-0.5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.35)' }}
            >
              <Heart className="w-4 h-4 text-[#C0392B]" fill="#C0392B" />
            </div>
            <span className="text-[11px] font-bold" style={{ color: GOLD }}>{loveCount}</span>
          </button>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: party?.title || 'Audio Room', url: window.location.href }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied!')).catch(() => toast.error('Copy failed.'));
              }
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>

          <button
            onClick={() => setHandRaised(h => !h)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              background: handRaised ? `${GOLD}20` : 'rgba(255,255,255,0.07)',
              border: handRaised ? `1px solid ${GOLD}55` : '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Hand className="w-4 h-4" style={{ color: handRaised ? GOLD : 'rgba(255,255,255,0.6)' }} />
          </button>

          <div className="relative flex flex-col items-center gap-0.5">
            <button
              onClick={handleToggleAudio}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{
                background: pttActive ? 'rgba(109,191,126,0.25)' : audioEnabled ? `${GOLD}15` : 'rgba(192,57,43,0.15)',
                border: pttActive ? '1px solid rgba(109,191,126,0.6)' : audioEnabled ? `1px solid ${GOLD}44` : '1px solid rgba(192,57,43,0.4)',
              }}
            >
              {audioEnabled
                ? <Mic className="w-4 h-4" style={{ color: pttActive ? '#6DBF7E' : GOLD }} />
                : <MicOff className="w-4 h-4 text-[#C0392B]" />}
            </button>
            {pttActive && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase whitespace-nowrap px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(109,191,126,0.25)', color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif', border: '1px solid rgba(109,191,126,0.4)' }}>
                PTT
              </span>
            )}
          </div>

          <button
            onClick={() => setSettingsOpen(v => !v)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              background: settingsOpen ? `${GOLD}20` : 'rgba(255,255,255,0.07)',
              border: settingsOpen ? `1px solid ${GOLD}55` : '1px solid rgba(255,255,255,0.12)',
            }}
            title="Audio settings"
          >
            <Settings className="w-4 h-4" style={{ color: settingsOpen ? GOLD : 'rgba(255,255,255,0.6)' }} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.4)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 z-50 flex flex-col rounded-t-2xl overflow-hidden"
              style={{ bottom: 64, height: 220, background: BG, borderTop: `1px solid rgba(212,175,55,0.2)` }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="shrink-0 flex items-center justify-between px-4 py-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-black uppercase text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Chat</span>
                <button onClick={() => setChatOpen(false)} className="text-white/40 text-sm">✕</button>
              </div>
              <div className="flex-1 overflow-hidden">
                <AggregatedChat roomId={roomId} currentUser={user} isHost={isHost} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.4)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 z-50 rounded-t-2xl overflow-hidden"
              style={{ bottom: 64, background: BG, borderTop: `1px solid rgba(212,175,55,0.2)` }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="shrink-0 flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-black uppercase text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Audio Settings</span>
                <button onClick={() => setSettingsOpen(false)} className="text-white/40 text-sm">✕</button>
              </div>

              <div className="p-4 space-y-4" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {/* Speaker output */}
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

                {/* Audio processing toggles */}
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
                        <span
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                          style={{ left: 2, transform: value ? 'translateX(20px)' : 'translateX(0)' }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {roomId && !isHost && (
        <LoveTap
          roomId={roomId}
          user={user}
          creatorId={party?.host_id}
          creatorName={hostName}
        />
      )}
      <SwanAIRecommendations roomId={roomId} currentLayout="audio" viewerCount={memberCount} />
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
      {roomId && <EmbedPlayer roomId={roomId} creatorName={user?.full_name || ''} streamTitle={party?.title || 'Live Audio'} viewerCount={memberCount} />}
      <LiveTranslationWidget chatMessage={lastChatMsg} onTranslation={() => {}} />
      {isHost && user?.id && <RecordingManager userId={user.id} />}
      {isHost && <OBSBridge />}
      <ZEGOMobileAppBanner />
      {isHost && roomId && <AutomatedClipGenerator streamSession={{room_id: roomId}} isLive={roomId != null} />}
      {roomId && <InteractivePollWidget roomId={roomId} isHost={isHost} />}
      {isHost && <StreamMetadataEditor initialTitle={'Live Audio'} initialCategory={'entertainment'} />}
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
      {isHost && <SceneSwitcher activeScene={activeScene} onSceneChange={setActiveScene} />}
      <NotificationHub />
      {isHost && <SoundboardWidget isVisible={true} />}
      {isHost && roomId && <RaidPanelButton room={party} currentUser={user} isHost={isHost} />}
      {roomId && <LiveAudiencePulse roomId={roomId} isHost={isHost} viewerCount={memberCount} />}
      {roomId && <StreamAnalyticsDashboard roomId={roomId} />}
      {isHost && roomId && <AIStreamSummary roomId={roomId} isHost={isHost} streamTitle={party?.title || ''} viewerCount={memberCount} elapsedSeconds={elapsed} />}
      {isHost && <ChatModeration collapsed={true} />}
      <BrandChyron />
      {!isHost && roomId && user?.id && <WhisperPanel roomId={roomId} currentUser={user} recipientId={party?.host_id || user?.id} recipientName={''} onClose={() => {}} />}
      <HostAlertCenter />
      {roomId && <AICopilotSidebar roomId={roomId} isHost={isHost} viewerCount={memberCount} />}
      {isHost && roomId && <EnhancedPollingSystem roomId={roomId} hostId={party?.host_id || user?.id} isHost={isHost} />}
      {roomId && user?.id && <SuperChatBar roomId={roomId} currentUser={user} recipientId={party?.host_id || user?.id} recipientName={''} />}
      {user?.id && <SwanyBotEnhanced userId={user.id} conversationId={null} onContextReady={() => {}} />}
      {isHost && <LocalVideoTile stream={localStream} audioEnabled={audioEnabled} videoEnabled={false} userName={user?.full_name || ''} isHost={isHost} />}
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
      <ActivitySidebar isOpen={false} onClose={() => {}} />
      <GlobalSearch onClose={() => {}} />
      {roomId && <PayPerViewGate roomId={roomId} ppvPrice={4.99} onPurchase={() => {}} />}
      <PaywallGate isHost={isHost} streamTitle={''} onUnlock={() => {}} isUnlocked={true} />
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
      {roomId && <StreamEventBus roomId={roomId} isHost={isHost} sessionId={roomId} onViewerUpdate={setBusViewerCount} onTipReceived={msg => setTipTotal(t => t + Math.floor(msg?.tip_amount || 0))} onMessageReceived={msg => setLastChatMsg(msg?.content || null)} />}
      {roomId && <TippingOverlay roomId={roomId} creatorId={party?.host_id || user?.id} isVisible={true} />}
      {roomId && <UnifiedChat roomId={roomId} currentUser={user} isHost={isHost} />}
      {isHost && roomId && <AIPersonaCustomizer roomId={roomId} sessionId={roomId} onCustomized={() => {}} />}
      {isHost && <AudioMixer micMuted={!audioEnabled} onMicToggle={handleToggleAudio} />}
      {isHost && <EnhancedAudioMixer micMuted={!audioEnabled} onMicToggle={handleToggleAudio} onAudioSettingsChange={() => {}} />
      {isHost && <ScreenSharePanel isSharing={false} onStartShare={() => {}} onStopShare={() => {}} />}
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
      {isHost && <BitratePresets selected={selectedBitrate} onChange={handleBitrateChange} />}
      {isHost && user?.id && <GuestRTMPPanel participantId={user.id} userId={user.id} />}
      {isHost && <GuestStreamMonitor guestName={user?.full_name || ''} isStreaming={roomId != null} />}
      {roomId && <TranscriptionPanel recordingUrl={''} roomTitle={''} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={isHost} currentTips={tipTotal} currentSubs={subCount} currentViewers={Math.max(busViewerCount, memberCount)} />
      <ViewerCount count={Math.max(busViewerCount, memberCount)} peakViewers={peakViewers} />
      {isHost && roomId && user?.id && <ClipCreator roomId={roomId} creatorId={user.id} streamTitle={party?.title || ''} elapsedSeconds={elapsed} currentUser={user} />}
      {isHost && roomId && user?.id && <StreamHighlightCapture roomId={roomId} sessionId={roomId} creatorId={user.id} elapsedSeconds={elapsed} isHost={isHost} />}
      {isHost && roomId && <QuickPollLauncher roomId={roomId} hostId={user?.id} isHost={isHost} />}
      {!isHost && roomId && party?.host_id && <GiftTray roomId={roomId} currentUser={user} recipientId={party.host_id} />}
      {isHost && party && <RoomBrandingEditor roomData={party} onBrandingChange={() => {}} isHost={isHost} />}
      <BackgroundCustomizer />

      {/* ── New feature stubs ──────────────────────────────────────────────── */}
      {roomId && <AIModeration roomId={roomId} isHost={isHost} />}
      {isHost && roomId && <GreenRoomModal isOpen={false} onClose={() => {}} onReady={() => {}} localStream={localStream} audioEnabled={audioEnabled} />}
      {isHost && roomId && <WebRTCConfigModal isOpen={false} onClose={() => {}} onApply={() => {}} currentConfig={{}} />}
      {roomId && <BreakoutRoomsModal isOpen={false} onClose={() => {}} roomId={roomId} roomTitle={party?.title || ''} currentUser={user} />}
      {roomId && <ShareModal isOpen={false} onClose={() => {}} url={`${window.location.origin}/AudioRoom?id=${roomId}`} title={party?.title || 'Audio Room'} />}
      {roomId && <CoStreamHub roomId={roomId} isHost={isHost} isCoHost={false} currentUser={user} compact={true} />}
      {roomId && party?.host_id && <AuraPanelDrawer roomId={roomId} hostId={party.host_id} onClose={() => {}} />}
      {roomId && <AuraPanel roomId={roomId} isHost={isHost} streamTitle={party?.title || ''} viewerCount={memberCount} isLive={roomId != null} userTier={'free'} />}
      {isHost && <OverlayThemeBuilder creatorId={user?.id} />}
      <LiveGoalWidget memberCount={memberCount} tipTotal={tipTotal} subCount={subCount} />
      <SuperChatRail superchats={[]} />
      {roomId && user?.id && party?.host_id && <LoveTap roomId={roomId} user={user} creatorId={party.host_id} creatorName={hostName} />}

      <NetworkQualityBanner quality={netQuality} rtt={netRtt} />

      <KeyboardShortcutsHelp shortcuts={[
        { key: 'M',     label: 'Toggle microphone' },
        { key: 'Space', label: 'Push-to-talk (hold when muted)' },
        { key: '?',     label: 'Show keyboard shortcuts' },
      ]} />
    </div>
  );
}
