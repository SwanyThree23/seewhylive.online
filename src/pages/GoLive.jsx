import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  ChevronLeft, ChevronRight, Radio, Swords, Tv2, Mic2,
  Camera, CameraOff, Mic, MicOff, Copy, Check, Lock, Unlock,
  Tag, Image, AlignLeft, Layers, Sparkles,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GuestInviteGeneratorV49 from '../components/streaming/GuestInviteGeneratorV49';
import RTMPFanoutPanelV49 from '../components/streaming/RTMPFanoutPanelV49';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import ZEGOGuestApprovalPanel from '../components/zego/ZEGOGuestApprovalPanel';
import ZEGOStreamHealthCard from '../components/zego/ZEGOStreamHealthCard';
import ZEGOConfigPanel from '../components/zego/ZEGOConfigPanel';
import LiveTranscription from '../components/live/LiveTranscription';
import SwanDirectorPanel, { SwanDirectorHUD } from '../components/live/SwanDirectorPanel';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';

import HostAlertCenter from '../components/live/HostAlertCenter';
import AICopilotSidebar from '../components/live/AICopilotSidebar';
import EnhancedPollingSystem from '../components/live/EnhancedPollingSystem';
import SuperChatBar from '../components/live/SuperChatBar';
import StreamGoals from '../components/live/StreamGoals';
import ViewerCount from '../components/live/ViewerCount';
import StreamMetricsBar from '../components/live/StreamMetricsBar';
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
import ClipCreator from '../components/live/ClipCreator';
import RealtimeLeaderboard from '../components/live/RealtimeLeaderboard';
import ViewerControlsPanel from '../components/live/ViewerControlsPanel';
import VirtualCurrencyTips from '../components/live/VirtualCurrencyTips';
import StreamHighlightCapture from '../components/live/StreamHighlightCapture';
import GoldenWall from '../components/live/GoldenWall';
import QuickPollLauncher from '../components/live/QuickPollLauncher';
import GiftTray from '../components/live/GiftTray';
import RoomBrandingEditor from '../components/live/RoomBrandingEditor';
import CameraDeviceSelector from '../components/live/CameraDeviceSelector';
import { useCameraDevices } from '../hooks/useCameraDevices';
import { useAutoSpeakGate } from '../hooks/useAutoSpeakGate';
import { useVODRecording } from '../hooks/useVODRecording';
import { useHighlightDetector } from '../hooks/useHighlightDetector';
import { useVoiceAgentRuntime } from '../hooks/useVoiceAgentRuntime';
import { useConnectionQuality } from '../hooks/useConnectionQuality';
import { useSubscriptionCount } from '../hooks/useSubscriptionCount';
import NetworkQualityBanner from '../components/live/NetworkQualityBanner';
import PartyHypeMeter from '../components/watchparty/PartyHypeMeter';
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
import GuestInviteGenerator from '../components/live/GuestInviteGenerator';
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
import PipCameraTile from '../components/live/PipCameraTile';
import PreJoinSettingsModal from '../components/live/PreJoinSettingsModal';
import LiveCaptionOverlay from '../components/live/LiveCaptionOverlay';
import SwanyBotEnhanced from '../components/guide/SwanyBotEnhanced';
import TipGoalBar from '../components/monetization/TipGoalBar';
import GuestControls from '../components/live/GuestControls';
import AggregatedChat from '../components/live/AggregatedChat';
import AIModeration from '../components/live/AIModeration';
import CoStreamHub from '../components/live/CoStreamHub';
import PKBattle from '../components/live/PKBattle';
import SuperChatRail from '../components/live/SuperChatRail';
import LiveGoalWidget from '../components/live/LiveGoalWidget';
import AuraPanelDrawer from '../components/live/AuraPanelDrawer';
import GreenRoomModal from '../components/live/GreenRoomModal';
import BreakoutRoomsModal from '../components/live/BreakoutRoomsModal';
import WebRTCConfigModal from '../components/live/WebRTCConfigModal';
import ClipCreatorSheet from '../components/live/ClipCreatorSheet';
import OverlayThemeBuilder from '../components/live/OverlayThemeBuilder';
import { WhisperPanel, WhisperToast } from '../components/live/DMWhisperPanel';
import RoomEntryGate from '../components/RoomEntryGate';
const BG   = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const PINK = '#C0392B';
const GREEN = '#6DBF7E';
const FONT = 'Barlow Condensed, sans-serif';

const FORMATS = [
  {
    id: 'panel',
    icon: <Mic2 style={{ width: 32, height: 32 }} />,
    emoji: '🎙️',
    title: '20-Person Panel',
    subtitle: 'Audio + video stage. Up to 20 speakers.',
    features: ['🎤 Audio', '📹 Video', '👥 20 seats', '💬 Chat', '🎁 Gifts'],
    color: GOLD,
    dest: 'BroadcastStudio',
  },
  {
    id: 'battle',
    icon: <Swords style={{ width: 32, height: 32 }} />,
    emoji: '⚔️',
    title: 'FadesStage Battle',
    subtitle: 'Challenge a creator. Audience votes with gifts.',
    features: ['⚔️ PK Rounds', '🎁 Gifts', '📊 Score', '👑 Winner'],
    color: CRIMSON,
    dest: 'PKBattle',
  },
  {
    id: 'watchparty',
    icon: <Tv2 style={{ width: 32, height: 32 }} />,
    emoji: '📺',
    title: 'Watch Party',
    subtitle: 'Sync a video. React together in real time.',
    features: ['🔗 Sync', '💬 Chat', '🖥️ Screen Share', '4K'],
    color: '#5B7FA6',
    dest: 'WatchParty',
  },
  {
    id: 'audio',
    icon: <Mic style={{ width: 32, height: 32 }} />,
    emoji: '🎧',
    title: 'Audio Room',
    subtitle: 'Clubhouse-style stage. Speakers + listeners.',
    features: ['🎤 Stage', '✋ Hand Raise', '❤️ Love Tap', '📌 Pin Video'],
    color: '#4A8A7A',
    dest: 'AudioRoom',
  },
];

const CATEGORIES = [
  'Talk Show', 'Music', 'Gaming', 'Education', 'Sports',
  'Comedy', 'News', 'Creative', 'Travel', 'Tech', 'Spiritual', 'Health',
];

function FormatCard({ fmt, onSelect }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(fmt)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        padding: '16px 18px',
        borderRadius: 16,
        background: 'rgba(13,6,24,0.9)',
        border: `1px solid rgba(255,255,255,0.08)`,
        borderLeft: `4px solid ${fmt.color}`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: `${fmt.color}18`,
        border: `1px solid ${fmt.color}35`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: fmt.color,
        flexShrink: 0,
      }}>
        {fmt.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', fontFamily: FONT, letterSpacing: '0.02em' }}>
          {fmt.title}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: FONT, marginTop: 2 }}>
          {fmt.subtitle}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {fmt.features.map(f => (
            <span key={f} style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: FONT,
              padding: '2px 7px',
              borderRadius: 999,
              background: `${fmt.color}12`,
              border: `1px solid ${fmt.color}28`,
              color: `${fmt.color}CC`,
              letterSpacing: '0.04em',
            }}>{f}</span>
          ))}
        </div>
      </div>
      <ChevronRight style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
    </motion.button>
  );
}

function CameraPreview({ onStreamReady, onMicChange, startRef }) {
  const videoRef = useRef(null);
  const [stream,     setStream]     = useState(null);
  const [camOn,      setCamOn]      = useState(false);
  const [micOn,      setMicOn]      = useState(true);
  const [error,      setError]      = useState(null);
  const [videoId,    setVideoId]    = useState(() => { try { return localStorage.getItem('swl_pref_cam') || null; } catch { return null; } });
  const [audioId,    setAudioId]    = useState(() => { try { return localStorage.getItem('swl_pref_mic') || null; } catch { return null; } });
  const [resolution, setResolution] = useState('720p');
  const { cameras } = useCameraDevices();

  const start = useCallback(async (opts = {}) => {
    setError(null);
    stream?.getTracks().forEach(t => t.stop());
    try {
      const resPresets = { '360p': { width: 640, height: 360 }, '480p': { width: 854, height: 480 }, '720p': { width: 1280, height: 720 }, '1080p': { width: 1920, height: 1080 } };
      const res = resPresets[opts.resolution || resolution] || resPresets['720p'];
      const s = await navigator.mediaDevices.getUserMedia({
        video: { ...res, ...(opts.videoId || videoId ? { deviceId: { ideal: opts.videoId || videoId } } : {}) },
        audio: { echoCancellation: true, noiseSuppression: true, ...(opts.audioId || audioId ? { deviceId: { ideal: opts.audioId || audioId } } : {}) },
      });
      setStream(s);
      setCamOn(true);
      s.getAudioTracks().forEach(t => { t.enabled = micOn; });
      if (videoRef.current) videoRef.current.srcObject = s;
      onStreamReady?.(s);
    } catch {
      setError('Camera/mic access denied — check browser permissions');
    }
  }, [onStreamReady, videoId, audioId, resolution, micOn, stream]);

  useEffect(() => { start(); return () => stream?.getTracks().forEach(t => t.stop()); }, []);
  useEffect(() => { if (startRef) startRef.current = start; }, [startRef, start]);

  function toggleMic() {
    const next = !micOn;
    stream?.getAudioTracks().forEach(t => { t.enabled = next; });
    setMicOn(next);
    onMicChange?.(next);
  }

  function handleVideoChange(id) { setVideoId(id); try { if (id) localStorage.setItem('swl_pref_cam', id); } catch {} start({ videoId: id }); }
  function handleAudioChange(id) { setAudioId(id); try { if (id) localStorage.setItem('swl_pref_mic', id); } catch {} start({ audioId: id }); }
  function handleResolutionChange(r) { setResolution(r); start({ resolution: r }); }
  function handleSwitchCamera() {
    if (cameras.length < 2) return;
    const idx = cameras.findIndex(c => c.deviceId === videoId);
    const next = cameras[(idx + 1) % cameras.length];
    handleVideoChange(next.deviceId);
  }

  return (
    <div className="space-y-3">
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
        {camOn
          ? <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(8,11,24,0.9)' }}>
              <CameraOff style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.2)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: FONT }}>Camera off</span>
            </div>}

        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: FONT, textAlign: 'center', padding: '0 16px' }}>{error}</span>
          </div>
        )}

        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 5, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: camOn ? 'rgba(192,57,43,0.85)' : 'rgba(0,0,0,0.5)', fontSize: 11, fontWeight: 900, color: '#fff', fontFamily: FONT, letterSpacing: '0.08em' }}>
            {camOn && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />}
            {camOn ? `PREVIEW · ${resolution}` : 'NO SIGNAL'}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
          <button onClick={toggleMic} style={{ width: 32, height: 32, borderRadius: '50%', background: micOn ? 'rgba(212,175,55,0.2)' : 'rgba(192,57,43,0.2)', border: `1px solid ${micOn ? 'rgba(212,175,55,0.4)' : 'rgba(192,57,43,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none' }}>
            {micOn ? <Mic style={{ width: 14, height: 14, color: GOLD }} /> : <MicOff style={{ width: 14, height: 14, color: '#C0392B' }} />}
          </button>
          {cameras.length > 1 && (
            <button onClick={handleSwitchCamera} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none' }}>
              <Camera style={{ width: 14, height: 14, color: GOLD }} />
            </button>
          )}
        </div>
      </div>

      {/* Device selector strip */}
      <CameraDeviceSelector
        compact
        currentVideoId={videoId}
        currentAudioId={audioId}
        resolution={resolution}
        onVideoChange={handleVideoChange}
        onAudioChange={handleAudioChange}
        onResolutionChange={handleResolutionChange}
      />
    </div>
  );
}

function RtmpKeyRow({ streamKey }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(streamKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Stream key copied');
  }

  return (
    <div style={{
      borderRadius: 10,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: '10px 12px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 900, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
        RTMP Stream Key
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <code style={{
          flex: 1,
          fontSize: 11,
          fontFamily: 'monospace',
          color: revealed ? GREEN : 'rgba(255,255,255,0.25)',
          letterSpacing: '0.05em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {revealed ? streamKey : '●●●●●●●●●●●●●●●●●●●●'}
        </code>
        <button onClick={() => setRevealed(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          {revealed
            ? <Lock style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)' }} />
            : <Unlock style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)' }} />}
        </button>
        <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          {copied
            ? <Check style={{ width: 14, height: 14, color: GREEN }} />
            : <Copy style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.4)' }} />}
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: FONT, marginTop: 4 }}>
        RTMP URL: rtmp://ingest.seewhylive.online/live
      </div>
    </div>
  );
}

function Countdown({ onDone }) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count <= 0) { onDone(); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onDone]);

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(8,11,24,0.97)',
      }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.55, ease: 'backOut' }}
          style={{
            fontSize: count === 0 ? 72 : 120,
            fontWeight: 900,
            fontFamily: FONT,
            color: count <= 1 ? PINK : count === 2 ? GOLD : '#fff',
            lineHeight: 1,
            textShadow: `0 0 60px ${count <= 1 ? PINK : GOLD}88`,
          }}
        >
          {count === 0 ? '🔴 LIVE' : count}
        </motion.div>
      </AnimatePresence>
      <motion.p
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ fontSize: 16, fontFamily: FONT, color: 'rgba(255,255,255,0.4)', marginTop: 24, letterSpacing: '0.1em', textTransform: 'uppercase' }}
      >
        Going live in {count > 0 ? count : '…'}
      </motion.p>
    </motion.div>
  );
}

export default function GoLive() {
  const navigate = useNavigate();
  const [entryPassed, setEntryPassed] = useState(false);
  const [step,        setStep]        = useState('pick');
  const [format,      setFormat]      = useState(null);
  const [title,       setTitle]       = useState('');
  const [category,    setCategory]    = useState('');
  const [tagInput,    setTagInput]    = useState('');
  const [tags,        setTags]        = useState([]);
  const [thumbUrl,    setThumbUrl]    = useState('');
  const [description, setDescription] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [launching,   setLaunching]   = useState(false);
  const [countdown,   setCountdown]   = useState(false);
  const [partyId,     setPartyId]     = useState(null);
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [suggestingTitles, setSuggestingTitles] = useState(false);
  const [localStream,  setLocalStream]  = useState(null);
  const [micOn,       setMicOn]       = useState(true);
  const [videoOn,     setVideoOn]     = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [tipTotal, setTipTotal] = useState(0);
  const [elapsed,     setElapsed]     = useState(0);
  const handleStreamReady = useCallback((s) => setLocalStream(s), []);
  const cameraRetryRef = useRef(null);
  // cameras + handleVideoChange hoisted so PreJoinSettingsModal can access them
  const { cameras } = useCameraDevices();
  const handleVideoChange = useCallback((id) => {
    try { if (id) localStorage.setItem('swl_pref_cam', id); } catch {}
    cameraRetryRef.current?.({ videoId: id });
  }, []);
  const { isSpeaking } = useAutoSpeakGate({ stream: localStream, enabled: !!localStream });
  const speakingIds = isSpeaking && user?.id ? { [user.id]: true } : {};
  const { extractClipBlobUrl } = useVODRecording({ streamId: partyId || '', creatorId: user?.id || '', title: '', stream: localStream });
  const { quality: netQuality, rtt: netRtt } = useConnectionQuality(null, 5000);
  const subCount = useSubscriptionCount(user?.id);
  const { data: members = [] } = useQuery({
    queryKey: ['golive-members', partyId],
    queryFn: () => base44.entities.WatchPartyMember.filter({ party_id: partyId, is_active: true }),
    enabled: !!partyId,
    refetchInterval: 10000,
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [hypeLevel, setHypeLevel] = useState(0);
  useHighlightDetector({ partyId, roomId: partyId, isHost: true, user, messages: chatMessages, hypeLevel, elapsedSeconds: elapsed, getClipBlobUrl: extractClipBlobUrl });
  useVoiceAgentRuntime({ chatMessage: chatMessages[chatMessages.length - 1] || null });
  useEffect(() => { setPeakViewers(prev => Math.max(prev, viewerCount)); }, [viewerCount]);
  const [isSharing, setIsSharing] = useState(false);
  const [activeScene, setActiveScene] = useState('main');
  const [showGreenRoomModal, setShowGreenRoomModal] = useState(false);
  const [showActivitySidebar, setShowActivitySidebar] = useState(false);
  const [showBreakoutRooms, setShowBreakoutRooms] = useState(false);
  const [showWebRTCConfig, setShowWebRTCConfig] = useState(false);
  const [showClipCreator, setShowClipCreator] = useState(false);
  const [showAuraPanelDrawer, setShowAuraPanelDrawer] = useState(false);
  const [showEvmux, setShowEvmux] = useState(false);
  const [showCamSettings, setShowCamSettings] = useState(false);
  const [showViewerControls, setShowViewerControls] = useState(false);
  const [showSwanPanel, setShowSwanPanel] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showModerationAppeal, setShowModerationAppeal] = useState(false);
  const [selectedBitrate, setSelectedBitrate] = useState('auto');
  const [whisperTarget, setWhisperTarget] = useState(null);       // { id, name } | null
  const [incomingWhisper, setIncomingWhisper] = useState(null);   // latest unread whisper | null
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

  // Elapsed counter — only runs while live (partyId set)
  useEffect(() => {
    if (!partyId) return;
    const iv = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, [partyId]);

  // Poll for incoming whispers addressed to the current user in this room
  useEffect(() => {
    if (!partyId || !user?.id) return;
    var lastSeenId = null;
    var pollId = setInterval(() => {
      base44.entities.DirectMessage.filter({ room_id: partyId, recipient_id: user.id, is_whisper: true })
        .then(msgs => {
          if (!msgs || msgs.length === 0) return;
          var latest = msgs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
          if (latest && latest.id !== lastSeenId) {
            lastSeenId = latest.id;
            setIncomingWhisper(latest);
          }
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(pollId);
  }, [partyId, user?.id]);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const streamKey = user?.id
    ? `sw-${user.id.slice(0, 8)}-${Math.abs(user.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)).toString(16).slice(0, 6)}`
    : 'sw-xxxxxxxx-demo';

  function selectFormat(fmt) {
    setFormat(fmt);
    setStep('setup');
  }

  function addTag(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const t = tagInput.trim().replace(/^#/, '');
      if (t && !tags.includes(t) && tags.length < 8) {
        setTags(prev => [...prev, t]);
      }
      setTagInput('');
    }
  }

  function removeTag(t) {
    setTags(prev => prev.filter(x => x !== t));
  }

  async function suggestTitles() {
    if (suggestingTitles) return;
    setSuggestingTitles(true);
    setTitleSuggestions([]);
    try {
      const ctx = [
        format ? `Stream format: ${format.title}` : '',
        category ? `Category: ${category}` : '',
        tags.length ? `Tags: ${tags.join(', ')}` : '',
        title ? `Draft title so far: "${title}"` : '',
      ].filter(Boolean).join('. ') || 'General live stream on SeeWhy LIVE';
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Joyce AI, co-host for SeeWhy LIVE — a creator-first live streaming platform (domino tournaments, tributes, talk shows, music, 90/10 revenue split). Generate 5 punchy, broadcast-ready stream title suggestions (max 60 chars each) for this stream context: ${ctx}. Return ONLY a JSON array of 5 title strings, no extra text.`,
        response_json_schema: { type: 'array', items: { type: 'string' } },
      });
      if (Array.isArray(res) && res.length) setTitleSuggestions(res.slice(0, 5));
      else setTitleSuggestions(['Live & Direct — Let\'s Go!', 'Tonight\'s Main Event 🔥', 'Stream is LIVE — Join Now!', 'No Cap, This Stream Hits Different', 'The Real Ones Know 🏆']);
    } catch {
      setTitleSuggestions(['Live & Direct — Let\'s Go!', 'Tonight\'s Main Event 🔥', 'Stream is LIVE — Join Now!']);
    }
    setSuggestingTitles(false);
  }

  async function handleGoLive() {
    if (!title.trim()) { toast.error('Add a stream title first'); return; }
    if (launching) return;
    setLaunching(true);
    try {
      const party = await base44.entities.WatchParty.create({
        title:        title.trim(),
        description:  description.trim(),
        category:     category,
        tags:         tags,
        thumbnail_url: thumbUrl.trim(),
        host_id:      user?.id,
        host_name:    user?.full_name || user?.email || 'Host',
        status:       'active',
        is_exclusive: isExclusive,
        stream_type:  format?.id,
        updated_at_ms: Date.now(),
      });
      setPartyId(party.id);
      setCountdown(true);
    } catch {
      toast.error('Failed to create stream');
      setLaunching(false);
    }
  }

  function onCountdownDone() {
    const dest = format?.dest || 'BroadcastStudio';
    window.location.href = `${createPageUrl(dest)}?id=${partyId}`;
  }

  // Room entry gate — age verification, ToS, display name, device permissions
  if (!entryPassed) {
    return (
      <RoomEntryGate
        role="host"
        user={user}
        onPass={() => setEntryPassed(true)}
        onRoleDowngrade={() => setEntryPassed(true)}
        onExit={() => navigate(-1)}
      />
    );
  }

  const SL = { fontSize: 11, fontWeight: 900, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 };
  const INPUT = {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT }}>

      <AnimatePresence>{countdown && <Countdown onDone={onCountdownDone} />}</AnimatePresence>

      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        background: 'rgba(8,11,24,0.97)',
        borderBottom: '1px solid rgba(212,175,55,0.1)',
        backdropFilter: 'blur(12px)',
      }}>
        {step === 'setup' ? (
          <button onClick={() => setStep('pick')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <ChevronLeft style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.6)' }} />
          </button>
        ) : (
          <Radio style={{ width: 20, height: 20, color: PINK }} />
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: GOLD, margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {step === 'setup' ? `${format?.emoji} ${format?.title}` : 'Go Live'}
          </h1>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: FONT }}>
            {step === 'setup' ? 'Configure your stream' : 'Choose your format'}
          </p>
        </div>
        {step === 'setup' && format && (
          <div style={{
            padding: '3px 10px', borderRadius: 999,
            background: `${format.color}18`, border: `1px solid ${format.color}35`,
            fontSize: 10, fontWeight: 900, color: format.color, fontFamily: FONT, letterSpacing: '0.04em',
          }}>
            {format.title}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">

        {step === 'pick' && (
          <motion.div
            key="pick"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
              What kind of stream?
            </p>

            {FORMATS.map(fmt => <FormatCard key={fmt.id} fmt={fmt} onSelect={selectFormat} />)}

            <div style={{ marginTop: 8, borderRadius: 16, padding: '14px 16px', background: 'rgba(109,191,126,0.04)', border: '1px solid rgba(109,191,126,0.12)' }}>
              <Link to={createPageUrl('GreenroomEnhanced')} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                <span style={{ fontSize: 28 }}>🎬</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: FONT }}>Green Room</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>Test camera, mic, and lighting before going live</div>
                </div>
                <ChevronRight style={{ width: 16, height: 16, color: GREEN, marginLeft: 'auto' }} />
              </Link>
            </div>

            <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 12, lineHeight: 1.6 }}>
              90% Creator Payout · Multi-Language Chat · Powered by SeeWhy LIVE
            </p>
          </motion.div>
        )}

        {step === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 120px', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <CameraPreview onStreamReady={handleStreamReady} onMicChange={setMicOn} startRef={cameraRetryRef} />

            <div>
              <div style={{ ...SL, justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlignLeft style={{ width: 10, height: 10 }} /> Stream Title *
                </span>
                <button
                  onClick={suggestTitles}
                  disabled={suggestingTitles}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
                    borderRadius: 99, padding: '3px 10px', cursor: 'pointer',
                    color: GOLD, fontSize: 10, fontFamily: FONT, fontWeight: 900,
                    letterSpacing: '0.05em', opacity: suggestingTitles ? 0.6 : 1, transition: 'opacity .15s',
                  }}>
                  <Sparkles style={{ width: 9, height: 9 }} />
                  {suggestingTitles ? 'Thinking…' : 'AI Suggest'}
                </button>
              </div>
              <input
                style={{ ...INPUT, fontSize: 16, fontWeight: 700, borderColor: title ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)' }}
                placeholder="What's your stream about?"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={80}
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: FONT, marginTop: 3 }}>{title.length}/80</div>
              {titleSuggestions.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {titleSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setTitle(s); setTitleSuggestions([]); }}
                      style={{
                        textAlign: 'left', padding: '8px 12px', borderRadius: 9, cursor: 'pointer',
                        background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)',
                        color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: FONT, fontWeight: 700,
                        transition: 'all .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.12)'; e.currentTarget.style.color = GOLD; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={SL}><Layers style={{ width: 10, height: 10 }} /> Category</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(cat => cat === c ? '' : c)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: FONT,
                      cursor: 'pointer',
                      border: category === c ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.1)',
                      background: category === c ? `${GOLD}18` : 'rgba(255,255,255,0.04)',
                      color: category === c ? GOLD : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.15s',
                    }}
                  >{c}</button>
                ))}
              </div>
            </div>

            <div>
              <div style={SL}><Tag style={{ width: 10, height: 10 }} /> Tags</div>
              <input
                style={INPUT}
                placeholder="Add tags — press Enter"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                  {tags.map(t => (
                    <span key={t} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 9px', borderRadius: 999,
                      background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)',
                      color: GOLD, fontSize: 11, fontFamily: FONT, fontWeight: 700,
                    }}>
                      #{t}
                      <button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(212,175,55,0.5)', fontSize: 11, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={SL}><Image style={{ width: 10, height: 10 }} /> Thumbnail URL</div>
              <input
                style={INPUT}
                placeholder="https://… (optional)"
                value={thumbUrl}
                onChange={e => setThumbUrl(e.target.value)}
              />
              {thumbUrl && (
                <img
                  src={thumbUrl}
                  alt="thumbnail preview"
                  style={{ marginTop: 8, width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
            </div>

            <div>
              <div style={SL}><AlignLeft style={{ width: 10, height: 10 }} /> Description</div>
              <textarea
                style={{ ...INPUT, minHeight: 72, resize: 'vertical' }}
                placeholder="Tell viewers what to expect…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={300}
              />
            </div>

            <button
              onClick={() => setIsExclusive(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                background: isExclusive ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
                border: isExclusive ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isExclusive
                  ? <Lock style={{ width: 16, height: 16, color: GOLD }} />
                  : <Unlock style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.3)' }} />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: isExclusive ? GOLD : '#fff', fontFamily: FONT }}>
                    Exclusive Live
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: FONT }}>
                    Subscribers only · Viewers need an active sub to watch
                  </div>
                </div>
              </div>
              <div style={{
                width: 38, height: 22, borderRadius: 11,
                background: isExclusive ? GOLD : 'rgba(255,255,255,0.1)',
                position: 'relative',
                transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 3, left: isExclusive ? 18 : 3,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </div>
            </button>

            <RtmpKeyRow streamKey={streamKey} />

            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: FONT, textAlign: 'center' }}>
              Configure OBS: Server → <code style={{ color: 'rgba(255,255,255,0.35)' }}>rtmp://ingest.seewhylive.online/live</code>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step === 'setup' && (
        <div style={{
          position: 'fixed', bottom: 0, inset: 0, top: 'auto',
          padding: '12px 16px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          background: 'rgba(8,11,24,0.98)',
          borderTop: '1px solid rgba(212,175,55,0.12)',
          backdropFilter: 'blur(16px)',
        }}>
          <motion.button
            whileTap={{ scale: title.trim() ? 0.97 : 1 }}
            onClick={handleGoLive}
            disabled={!title.trim() || launching}
            style={{
              width: '100%',
              height: 54,
              borderRadius: 14,
              border: 'none',
              cursor: title.trim() ? 'pointer' : 'default',
              fontFamily: FONT,
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: title.trim()
                ? `linear-gradient(135deg, ${CRIMSON}, ${PINK})`
                : 'rgba(255,255,255,0.06)',
              color: title.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
              boxShadow: title.trim() ? `0 4px 24px rgba(192,57,43,0.4)` : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: launching ? 0.7 : 1,
            }}
          >
            <Radio style={{ width: 20, height: 20 }} />
            {launching ? 'Creating Stream…' : '🔴 Go Live'}
          </motion.button>
        </div>
      )}
      <SwanAIRecommendations roomId={partyId} currentLayout="default" viewerCount={viewerCount} />
      <MilestoneAlerts userId={user?.id} roomId={partyId} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      {partyId && <ZEGOStreamHealthCard roomId={partyId} />}
      {partyId && <ZEGOGuestApprovalPanel roomId={partyId} isHost={true} />}
      {user && <ZEGOConfigPanel user={user} />}
      {partyId && <LiveTranscription isLive={!!partyId} roomId={partyId} stream={localStream} speaker={user?.full_name} />}
      {partyId && <SwanDirectorHUD roomId={partyId} hostId={user?.id} onOpenPanel={() => setShowSwanPanel(true)} />}
      <BackgroundCustomizer />
      {partyId && <StreamerGoalsWidget creatorId={user?.id} roomId={partyId} isCreator={true} embedded={true} />}
      {partyId && <PayPerViewManager roomId={partyId} />}
      {partyId && <MonetizationDashboard roomId={partyId} />}
      {partyId && <GiftShopTray roomId={partyId} currentUser={user} />}
      {partyId && <GiftLeaderboard roomId={partyId} />}
      {<SubscriptionManager creatorId={user?.id} />}
      {partyId && <TipAlert roomId={partyId} recipientId={user?.id} />}
      {partyId && <LiveAuctionWidget creatorId={user?.id} roomId={partyId} isCreator={true} currentUser={user} />}
      <MerchStrip roomId={partyId} currentUser={user} hostId={user?.id} />
      <NotificationBell />
      {partyId && <PKBattleInterface roomId={partyId} />}
      {partyId && <CoStreamPanel roomId={partyId} />}
      {partyId && <CollaborativeWhiteboard roomId={partyId} />}
      {partyId && user?.id && <PointsEarnWidget userId={user.id} creatorId={user?.id} roomId={partyId} isHost={true} />}
      {partyId && <RedemptionQueue creatorId={user?.id} roomId={partyId} />}
      {partyId && <RewardShop creatorId={user?.id} roomId={partyId} currentUser={user} />}
      {partyId && <GreenroomQueue roomId={partyId} isHost={true} />}
      {<StreamingPresets onApply={(p) => { try { localStorage.setItem('swl_pref_resolution', p.resolution); localStorage.setItem('swl_pref_bitrate', String(p.bitrate)); } catch {} }} />}
      {partyId && <EmbedPlayer roomId={partyId} creatorName={user?.full_name || ''} streamTitle={'Live Stream'} viewerCount={viewerCount} />}
      <LiveTranslationWidget chatMessage={chatMessages[chatMessages.length - 1]?.content || null} onTranslation={() => {}} />
      {user?.id && <RecordingManager userId={user.id} />}
      {<OBSBridge />}
      <ZEGOMobileAppBanner />
      {partyId && <AutomatedClipGenerator streamSession={{room_id: partyId}} isLive={partyId != null} />}
      {partyId && <InteractivePollWidget roomId={partyId} isHost={true} />}
      {<StreamMetadataEditor initialTitle={'Live Stream'} initialCategory={'entertainment'} />}
      {<StreamerMonetizationCenter />}
      {user?.id && <VirtualGoodsStore userId={user.id} />}
      {<SoundAlertsManager creatorId={user?.id} />}
      <ShareToSocial content={{text: ''}} />
      {partyId && user?.id && <VideoShortRecorder roomId={partyId} creatorId={user.id} />}
      {<BroadcastAnalyticsDashboard streamSession={null} isLive={partyId != null} />}
      {partyId && <AutomatedHighlightReels streamSession={{room_id: partyId}} />}
      {partyId && <PerformanceDashboard roomId={partyId} sessionId={partyId} />}
      <StreamHealthDashboard isLive={partyId != null} />
      {<LowerThirdsBanner onBannerChange={(b) => { if (partyId) base44.entities.WatchParty.update(partyId, { lower_thirds_text: b.text, lower_thirds_enabled: b.enabled }).catch(() => {}); }} />}
      {<SceneSwitcher activeScene={activeScene} onSceneChange={(s) => { setActiveScene(s); if ((s === 'screen' || s === 'pip') && !isSharing) handleStartShare(); else if (s === 'camera' && isSharing) handleStopShare(); }} />}
      <NotificationHub />
      {<SoundboardWidget isVisible={true} />}
      {partyId && <RaidPanelButton room={null} currentUser={user} isHost={true} />}
      {partyId && <LiveAudiencePulse roomId={partyId} isHost={true} viewerCount={viewerCount} />}
      {partyId && <StreamAnalyticsDashboard roomId={partyId} />}
      {partyId && <AIStreamSummary roomId={partyId} isHost={true} streamTitle={''} viewerCount={viewerCount} elapsedSeconds={elapsed} />}
      {<ChatModeration collapsed={true} />}
      <BrandChyron />
      {partyId && <RealtimeLeaderboard roomId={partyId} creatorId={user?.id} />}
      {showViewerControls && partyId && <ViewerControlsPanel roomId={partyId} currentUser={user} onClose={() => setShowViewerControls(false)} />}
      {partyId && user?.id && <VirtualCurrencyTips roomId={partyId} creatorId={user?.id} currentUser={user} isHost={true} />}
      {partyId && <GoldenWall roomId={partyId} />}
      {partyId && user?.id && <ClipCreator roomId={partyId} creatorId={user.id} streamTitle={''} elapsedSeconds={elapsed} currentUser={user} />}
      {partyId && user?.id && <StreamHighlightCapture roomId={partyId} sessionId={partyId} creatorId={user.id} elapsedSeconds={elapsed} isHost={true} />}
      {partyId && <QuickPollLauncher roomId={partyId} hostId={user?.id} isHost={true} />}
      <RoomBrandingEditor roomData={null} onBrandingChange={(b) => { if (partyId) base44.entities.WatchParty.update(partyId, b).catch(() => {}); }} isHost={true} />
      <HostAlertCenter />
      {partyId && <AICopilotSidebar roomId={partyId} isHost={true} viewerCount={viewerCount} />}
      {partyId && <EnhancedPollingSystem roomId={partyId} hostId={user?.id} isHost={true} />}
      {partyId && user?.id && <SuperChatBar roomId={partyId} currentUser={user} recipientId={user?.id} recipientName={''} />}
      {user?.id && <SwanyBotEnhanced userId={user.id} conversationId={null} onContextReady={() => {}} />}
      {<LocalVideoTile stream={localStream} audioEnabled={micOn} videoEnabled={videoOn} userName={user?.full_name || ''} isHost={true} isSpeaking={isSpeaking} />}
      {<OctagonalVideoWindow title={'My Camera'} isMuted={!micOn} isVideoOff={!videoOn} onMicToggle={() => setMicOn(v => !v)} onVideoToggle={() => setVideoOn(v => !v)} />}
      {partyId && <PipCameraTile localStream={localStream} videoEnabled={videoOn} roomId={partyId} tipTotal={tipTotal} />}
      <PreJoinSettingsModal open={showCamSettings} onClose={() => setShowCamSettings(false)} stream={localStream} devices={{ cameras }} onCameraChange={handleVideoChange} onResolutionChange={() => {}} />
      <LiveCaptionOverlay stream={localStream} />
      {<AudioPanel micMuted={!micOn} onMicToggle={() => setMicOn(v => !v)} participants={members} />}
      {<EvmuxWebSource isActive={showEvmux} onClose={() => setShowEvmux(false)} />}
      {partyId && <LivePollOverlay roomId={partyId} currentUser={user} isHost={true} position={'bottom-left'} />}
      {<StripeConnectButton creatorId={user?.id} />}
      {<SubscriptionTiers communityId={null} userId={user?.id} />}
      {partyId && user?.id && <ZEGOGuestJoin roomId={partyId} userId={user.id} userName={user?.full_name || ''} onJoined={() => toast.success('Joined stream successfully!')} />}
      {partyId && <PaymentMethodSelector creatorId={user?.id} roomId={partyId} onPaymentComplete={() => toast.success('Payment complete!')} />}
      {<CreatorTierManager creatorId={user?.id} />}
      {user?.id && <TierBadge tier={null} size={'sm'} showName={false} />}
      {user?.id && <LoyaltyBadge userId={user.id} creatorId={user?.id} />}
      {partyId && <GuestInviteGenerator roomId={partyId} isHost={true} />}
      {partyId && <GuestGrid participants={members} isHost={true} onInvite={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('Invite link copied!')).catch(() => {})} hostId={user?.id} speakingIds={speakingIds} />}
      {partyId && <EnhancedRoomControls isHost={true} roomData={null} micMuted={!micOn} onMicToggle={() => setMicOn(v => !v)} onAudioSettingsChange={() => {}} />}
      <CollabPlaylist isHost={true} currentUser={user} onPlayVideo={(url) => { if (partyId) base44.entities.WatchParty.update(partyId, { video_url: url, current_time: 0, playback_state: 'paused', updated_at_ms: Date.now() }).catch(() => {}); }} />
      <YouTubeDiscovery />
      <ActivitySidebar isOpen={showActivitySidebar} onClose={() => setShowActivitySidebar(false)} />
      {showGlobalSearch && <GlobalSearch onClose={() => setShowGlobalSearch(false)} />}
      {partyId && <PayPerViewGate roomId={partyId} ppvPrice={4.99} onPurchase={() => toast.success('Content unlocked!')} />}
      <PaywallGate isHost={true} streamTitle={''} onUnlock={() => {}} isUnlocked={true} />
      {partyId && <SubscriptionGate creatorId={user?.id} roomId={partyId} />}
      {showModerationAppeal && partyId && <ModerationAppealPanel flagId={null} messageId={null} roomId={partyId} onClose={() => setShowModerationAppeal(false)} />}
      {user?.id && <GuestDestinationsPanel participantUserId={user.id} guestName={user?.full_name || ''} />}
      {<GuestStreamingPermissions participant={null} isHost={true} onPermissionChange={() => toast.success('Permissions updated')} />}
      {partyId && <MultiStreamConfig roomId={partyId} isHost={true} />}
      {partyId && <VdoNinjaGuestLink roomId={partyId} />}
      <WebRTCSetupBanner error={null} audioEnabled={micOn} videoEnabled={videoOn} onRetry={() => cameraRetryRef.current?.()} />
      <NetworkQualityBanner quality={netQuality} rtt={netRtt} />
      {partyId && <WebhookHooks roomId={partyId} isHost={true} />}
      {<PKBattleSoundboard battleId={partyId} isBattleActive={partyId != null} />}
      <PanelMusicPlayer />
      {partyId && <PollLaunchBar roomId={partyId} hostId={user?.id} activePoll={null} isHost={true} />}
      <PrivatePanel isHost={true} currentUser={user} />
      {partyId && <StreamChatbot roomId={partyId} isHost={true} elapsedSeconds={elapsed} hostName={user?.full_name || ''} room={null} />}
      {partyId && <StreamEventBus roomId={partyId} isHost={true} sessionId={partyId} onViewerUpdate={setViewerCount} onTipReceived={msg => setTipTotal(t => t + Math.floor(msg?.tip_amount || 0))} onMessageReceived={msg => { if (msg?.content) setChatMessages(prev => [...prev, msg]); }} />}
      {partyId && <TippingOverlay roomId={partyId} creatorId={user?.id} isVisible={true} />}
      {partyId && <UnifiedChat roomId={partyId} currentUser={user} isHost={true} />}
      {partyId && <AIPersonaCustomizer roomId={partyId} sessionId={partyId} onCustomized={() => toast.success('AI persona configured!')} />}
      {<AudioMixer micMuted={!micOn} onMicToggle={() => setMicOn(v => !v)} />}
      {<EnhancedAudioMixer micMuted={!micOn} onMicToggle={() => setMicOn(v => !v)} onAudioSettingsChange={() => {}} />}
      {<ScreenSharePanel isSharing={isSharing} onStartShare={handleStartShare} onStopShare={handleStopShare} />}
      {partyId && <AuraEmotionDisplay roomId={partyId} sessionId={partyId} auraPersona={'hype'} />}
      {partyId && <BattleScoreboard roomId={partyId} />}
      {partyId && user?.id && <EnhancedStreamChat roomId={partyId} userId={user.id} userName={user?.full_name || ''} userRole={true ? 'host' : 'viewer'} />}
      <GlobalChatWidget />
      {partyId && <GuestConnector roomId={partyId} roomName={''} />}
      {partyId && <InteractivePollingSystem roomId={partyId} isHost={true} currentUser={user} />}
      {partyId && <LeaderboardPanel roomId={partyId} />}
      {partyId && <MobileStreamControls micMuted={!micOn} onMicToggle={() => setMicOn(v => !v)} onReact={() => {}} onQuickTip={() => {}} onWebSource={() => setShowEvmux(true)} roomId={partyId} />}
      {user?.id && <PointsNotification userId={user.id} />}
      {partyId && user?.id && <EngagementBadgesDisplay roomId={partyId} userId={user.id} creatorId={user?.id} />}
      {partyId && <ChatOverlay roomId={partyId} isVisible={true} />}
      {partyId && <BattleMode roomId={partyId} isHost={true} hostName={user?.full_name || ''} />}
      {<BitratePresets selected={selectedBitrate} onChange={setSelectedBitrate} />}
      {user?.id && <GuestRTMPPanel participantId={user.id} userId={user.id} />}
      {<GuestStreamMonitor guestName={user?.full_name || ''} isStreaming={partyId != null} />}
      {partyId && <TranscriptionPanel recordingUrl={''} roomTitle={''} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={tipTotal} currentSubs={subCount} currentViewers={viewerCount} />
      <StreamMetricsBar startTime={elapsed > 0 ? Date.now() - elapsed * 1000 : null} memberCount={viewerCount} tipTotal={tipTotal} peakViewers={peakViewers} netQuality={netQuality} netRtt={netRtt} />
      <ViewerCount count={viewerCount} peakViewers={peakViewers} />
      <TipGoalBar roomId={partyId} goal={100} currentTotal={tipTotal} />
      {partyId && <GuestControls roomId={partyId} isHost={true} onMuteGuest={() => {}} onRemoveGuest={() => {}} guests={[]} />}
      {partyId && <AggregatedChat roomId={partyId} currentUser={user} isHost={true} onMessagesChange={setChatMessages} />}
      {partyId && <PartyHypeMeter partyId={partyId} memberCount={viewerCount} onHypeChange={setHypeLevel} />}
      {partyId && <AIModeration roomId={partyId} isHost={true} onFlag={() => {}} />}
      {partyId && <CoStreamHub roomId={partyId} isHost={true} currentUser={user} speakingIds={speakingIds} />}
      {partyId && <PKBattle roomId={partyId} isHost={true} currentUser={user} onBattleEnd={() => setTimeout(() => navigate('/'), 2000)} />}
      {partyId && <SuperChatRail roomId={partyId} currentUser={user} isHost={true} />}
      {partyId && <LiveGoalWidget roomId={partyId} isHost={true} />}
      {partyId && showAuraPanelDrawer && <AuraPanelDrawer roomId={partyId} hostId={user?.id} onClose={() => setShowAuraPanelDrawer(false)} />}
      {showSwanPanel && partyId && <SwanDirectorPanel roomId={partyId} hostId={user?.id} onClose={() => setShowSwanPanel(false)} />}
      {partyId && <GreenRoomModal isOpen={showGreenRoomModal} onClose={() => setShowGreenRoomModal(false)} onReady={() => setShowGreenRoomModal(false)} localStream={localStream} audioEnabled={micOn} videoEnabled={videoOn} />}
      {partyId && <BreakoutRoomsModal isOpen={showBreakoutRooms} onClose={() => setShowBreakoutRooms(false)} roomId={partyId} />}
      {partyId && <WebRTCConfigModal isOpen={showWebRTCConfig} onClose={() => setShowWebRTCConfig(false)} />}
      {partyId && user?.id && <ClipCreatorSheet roomId={partyId} creatorId={user.id} elapsedSeconds={elapsed} isOpen={showClipCreator} onClose={() => setShowClipCreator(false)} />}
      {partyId && <OverlayThemeBuilder roomId={partyId} isHost={true} onThemeChange={() => {}} />}

      {/* ── DM WHISPER SYSTEM ── */}
      {/* Incoming whisper toast (auto-dismisses after 4s) */}
      <WhisperToast whisper={incomingWhisper} onDismiss={() => setIncomingWhisper(null)} />
      {/* Member whisper selector — click any active member to open DM */}
      {partyId && user && members.length > 0 && (
        <div style={{ position: 'fixed', bottom: 80, right: 20, zIndex: 9980, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <button
            onClick={() => setWhisperTarget(t => t ? null : 'picker')}
            style={{ background: 'rgba(128,0,32,0.9)', border: '1px solid #D4AF37', borderRadius: 20, padding: '5px 12px', color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}
          >
            🤫 WHISPER
          </button>
          {whisperTarget === 'picker' && (
            <div style={{ background: '#1A1A1A', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.6)', maxHeight: 200, overflowY: 'auto', width: 180 }}>
              {members.filter(m => m.user_id !== user.id).slice(0, 10).map(m => (
                <button
                  key={m.user_id || m.id}
                  onClick={() => setWhisperTarget({ id: m.user_id || m.id, name: m.full_name || m.display_name || 'Guest' })}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #2a2a2a', padding: '7px 12px', color: '#f0e8d4', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, cursor: 'pointer' }}
                >
                  {m.full_name || m.display_name || 'Guest'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {whisperTarget && whisperTarget !== 'picker' && (
        <WhisperPanel roomId={partyId} currentUser={user} recipientId={whisperTarget.id} recipientName={whisperTarget.name} onClose={() => setWhisperTarget(null)} />
      )}
    </div>
  );
}