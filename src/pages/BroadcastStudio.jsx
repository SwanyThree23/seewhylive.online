import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Users,
  Radio, LogOut, Copy, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, Swords, Monitor, LayoutGrid, FlipHorizontal2,
} from 'lucide-react';
import { isSafeUrl, clampStr, LIMITS } from '@/lib/security';

import { useLocalMedia } from '../hooks/useLocalMedia';
import { useVODRecording, formatDuration } from '../hooks/useVODRecording';
import { useAutoSpeakGate } from '../hooks/useAutoSpeakGate';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
import { useConnectionQuality } from '../hooks/useConnectionQuality';
import { useSubscriptionCount } from '../hooks/useSubscriptionCount';
import PanelGrid from '../components/watchparty/PanelGrid';
import BattleTiers from '../components/watchparty/BattleTiers';
import AggregatedChat from '../components/live/AggregatedChat';
import ViewerRail from '../components/watchparty/ViewerRail';
import LivePollWidget from '../components/live/LivePollWidget';
import GreenroomWaitlistPanel from '../components/greenroom/GreenroomWaitlistPanel';
import VideoSourcePicker, { getYouTubeId, detectVideoType } from '../components/video/VideoSourcePicker';
import PartyReactionsOverlay from '../components/watchparty/PartyReactionsOverlay';
import LiveEmoticonStorm from '../components/watchparty/LiveEmoticonStorm';
import PartyHypeMeter from '../components/watchparty/PartyHypeMeter';
import HostControls from '../components/watchparty/HostControls';
import { useHighlightDetector } from '../hooks/useHighlightDetector';
import CompositorOverlay from '../components/streaming/CompositorOverlay';
import CameraSourcePicker from '../components/streaming/CameraSourcePicker';
import CameraDeviceSelector from '../components/live/CameraDeviceSelector';
import { useCameraDevices } from '../hooks/useCameraDevices';
import LoveHearts from '../components/live/LoveHearts';
import GiftShop from '../components/live/GiftShop';
import GiftAnimation from '../components/live/GiftAnimation';
import ClipMarker from '../components/live/ClipMarker';
import KeyboardShortcutsHelp from '../components/live/KeyboardShortcutsHelp';
import NetworkQualityBanner from '../components/live/NetworkQualityBanner';
import GuestQueue from '../components/live/GuestQueue';
import StreamMetricsBar from '../components/live/StreamMetricsBar';
import SuperChatRail from '../components/live/SuperChatRail';
import LiveGoalWidget from '../components/live/LiveGoalWidget';
import AICopilotSidebar from '../components/live/AICopilotSidebar';
import AIModeration from '../components/live/AIModeration';
import AIStreamSummary from '../components/live/AIStreamSummary';
import ClipGeneratorAI from '../components/streaming/ClipGeneratorAI';
import { SwanDirectorHUD } from '../components/live/SwanDirectorPanel';
import { Hand } from 'lucide-react';
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
import HostAlertCenter from '../components/live/HostAlertCenter';
import EnhancedPollingSystem from '../components/live/EnhancedPollingSystem';
import SuperChatBar from '../components/live/SuperChatBar';
import StreamGoals from '../components/live/StreamGoals';
import ViewerCount from '../components/live/ViewerCount';
import LiveAudiencePulse from '../components/live/LiveAudiencePulse';
import StreamAnalyticsDashboard from '../components/live/StreamAnalyticsDashboard';
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
import TipGoalBar from '../components/monetization/TipGoalBar';
import TopTippers from '../components/monetization/TopTippers';
import TipWidget from '../components/live/TipWidget';
import InviteSheet from '../components/live/InviteSheet';
import AuraPanel from '../components/live/AuraPanel';
import GuestControls from '../components/live/GuestControls';
import StreamHealthMonitor from '../components/live/StreamHealthMonitor';
import BreakoutRoomsModal from '../components/live/BreakoutRoomsModal';
import CoStreamHub from '../components/live/CoStreamHub';
import GreenRoomModal from '../components/live/GreenRoomModal';
import GreenRoomPreflight from '../components/live/GreenRoomPreflight';
import OverlayThemeBuilder from '../components/live/OverlayThemeBuilder';
import ClipCreatorSheet from '../components/live/ClipCreatorSheet';
import AuraPanelDrawer from '../components/live/AuraPanelDrawer';
import PKBattle from '../components/live/PKBattle';
import PKBattleModal from '../components/live/PKBattleModal';
import LoveTap from '../components/live/LoveTap';
import ShareModal from '../components/live/ShareModal';
import WebRTCConfigModal from '../components/live/WebRTCConfigModal';
const GOLD = '#D4AF37';
const BG = '#080B18';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

// ── Video sync engine ────────────────────────────────────────────────────────
function useSyncEngine({ party, isController, onTimeSync }) {
  const qc = useQueryClient();

  const pushState = useCallback(async (playerState) => {
    if (!isController || !party?.id) return;
    try {
      await base44.entities.WatchParty.update(party.id, {
        playback_state: playerState.playing ? 'playing' : 'paused',
        current_time: playerState.currentTime,
        updated_at_ms: Date.now(),
      });
    } catch {}
  }, [isController, party?.id]);

  useEffect(() => {
    if (!party?.id) return;
    const unsub = base44.entities.WatchParty.subscribe((event) => {
      if (event.id !== party.id) return;
      if (!isController && event.data) onTimeSync(event.data);
      qc.invalidateQueries(['broadcast-party', party.id]);
    });
    return unsub;
  }, [party?.id, isController, onTimeSync, qc]);

  return { pushState };
}

// ── YouTube player ───────────────────────────────────────────────────────────
function YouTubeEmbed({ videoId, isController, syncData, onStateChange }) {
  const iframeRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player(iframeRef.current, {
        videoId,
        playerVars: { autoplay: 0, controls: isController ? 1 : 0 },
        events: {
          onStateChange: (e) => {
            if (!isController) return;
            const s = e.data;
            if (s === window.YT.PlayerState.PLAYING || s === window.YT.PlayerState.PAUSED) {
              onStateChange({ playing: s === window.YT.PlayerState.PLAYING, currentTime: playerRef.current?.getCurrentTime() || 0 });
            }
          },
        },
      });
    };
  }, [videoId]);

  // Push every 3s during playback so viewers stay in sync
  useEffect(() => {
    if (!isController) return;
    const iv = setInterval(() => {
      if (!playerRef.current?.getPlayerState) return;
      if (playerRef.current.getPlayerState() === window.YT?.PlayerState?.PLAYING) {
        onStateChange({ playing: true, currentTime: playerRef.current.getCurrentTime() || 0 });
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [isController, onStateChange]);

  useEffect(() => {
    if (isController || !playerRef.current || !syncData) return;
    const lag = Date.now() - (syncData.updated_at_ms || Date.now());
    const adj = (syncData.current_time || 0) + lag / 1000;
    const cur = playerRef.current.getCurrentTime?.() || 0;
    if (Math.abs(cur - adj) > 2) playerRef.current.seekTo?.(adj, true);
    if (syncData.playback_state === 'playing') playerRef.current.playVideo?.();
    else playerRef.current.pauseVideo?.();
  }, [syncData, isController]);

  return <div ref={iframeRef} className="w-full h-full" />;
}

// ── Direct video player ──────────────────────────────────────────────────────
function DirectPlayer({ url, isController, syncData, onStateChange }) {
  const videoRef = useRef(null);

  const handleEvent = () => {
    if (!isController || !videoRef.current) return;
    onStateChange({ playing: !videoRef.current.paused, currentTime: videoRef.current.currentTime });
  };

  useEffect(() => {
    if (!isController) return;
    const iv = setInterval(() => {
      if (!videoRef.current || videoRef.current.paused) return;
      onStateChange({ playing: true, currentTime: videoRef.current.currentTime });
    }, 3000);
    return () => clearInterval(iv);
  }, [isController, onStateChange]);

  useEffect(() => {
    if (isController || !videoRef.current || !syncData) return;
    const v = videoRef.current;
    const lag = Date.now() - (syncData.updated_at_ms || Date.now());
    const adj = (syncData.current_time || 0) + lag / 1000;
    if (Math.abs(v.currentTime - adj) > 2) v.currentTime = adj;
    if (syncData.playback_state === 'playing') v.play().catch(() => {});
    else v.pause();
  }, [syncData, isController]);

  return (
    <video
      ref={videoRef}
      src={url}
      controls={isController}
      className="w-full h-full object-contain bg-black"
      onPlay={handleEvent}
      onPause={handleEvent}
      onSeeked={handleEvent}
    />
  );
}

// ── Live camera tile (center stage when in 'live' or 'hybrid' mode) ──────────
function NetBars({ bars, rtt }) {
  if (bars == null) return null;
  const color = bars >= 3 ? '#6DBF7E' : bars === 2 ? '#D4AF37' : '#C0392B';
  return (
    <div className="flex items-end gap-0.5" title={rtt != null ? `${Math.round(rtt)}ms RTT` : undefined}>
      {[1, 2, 3, 4].map(b => (
        <div key={b} style={{ width: 3, height: b * 3 + 2, borderRadius: 1, background: b <= bars ? color : 'rgba(255,255,255,0.15)' }} />
      ))}
    </div>
  );
}

function LiveCameraTile({ localStream, videoEnabled, screenStream, isSpeaking, netBars, netRtt }) {
  const camRef = useRef(null);
  const screenRef = useRef(null);
  const [isPip, setIsPip] = useState(false);
  const [mirrored, setMirrored] = useState(true);
  const pipSupported = typeof document !== 'undefined' && !!document.pictureInPictureEnabled;

  useEffect(() => { if (camRef.current && localStream) camRef.current.srcObject = localStream; }, [localStream]);
  useEffect(() => { if (screenRef.current && screenStream) screenRef.current.srcObject = screenStream; }, [screenStream]);

  const togglePip = useCallback(async () => {
    const el = screenStream ? screenRef.current : camRef.current;
    if (!el) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await el.requestPictureInPicture();
        setIsPip(true);
        el.addEventListener('leavepictureinpicture', () => setIsPip(false), { once: true });
      }
    } catch {}
  }, [screenStream]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center"
      style={isSpeaking ? { boxShadow: `inset 0 0 0 3px rgba(109,191,126,0.7)` } : undefined}>
      {screenStream ? (
        <video ref={screenRef} autoPlay playsInline className="w-full h-full object-contain" />
      ) : localStream && videoEnabled ? (
        <video ref={camRef} autoPlay muted playsInline className="w-full h-full object-cover"
          style={{ transform: mirrored ? 'scaleX(-1)' : 'none', transition: 'transform 0.2s' }} />
      ) : (
        <div className="flex flex-col items-center gap-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
          <VideoOff className="w-12 h-12" />
          <span className="text-xs">Camera off</span>
        </div>
      )}
      <div className="absolute top-3 left-3 flex items-center gap-1 text-[11px] px-2 py-1 rounded"
        style={{ background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.4)', color: '#C0392B', ...T }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B] animate-pulse inline-block mr-0.5" />
        {screenStream ? 'SCREEN' : 'LIVE'}
      </div>
      {/* Mirror toggle + PiP buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        {!screenStream && localStream && videoEnabled && (
          <button onClick={() => setMirrored(v => !v)} title={mirrored ? 'Disable mirror' : 'Enable mirror'}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: mirrored ? 'rgba(212,175,55,0.25)' : 'rgba(0,0,0,0.45)', border: `1px solid ${mirrored ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.15)'}` }}>
            <FlipHorizontal2 className="w-3.5 h-3.5" style={{ color: mirrored ? GOLD : 'rgba(255,255,255,0.6)' }} />
          </button>
        )}
        {pipSupported && (localStream || screenStream) && (
          <button onClick={togglePip} title={isPip ? 'Exit Picture-in-Picture' : 'Pop out (Picture-in-Picture)'}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-opacity"
            style={{ background: isPip ? 'rgba(212,175,55,0.25)' : 'rgba(0,0,0,0.45)', border: `1px solid ${isPip ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.15)'}` }}>
            <Maximize2 className="w-3.5 h-3.5" style={{ color: isPip ? GOLD : 'rgba(255,255,255,0.6)' }} />
          </button>
        )}
      </div>
      {/* Network quality mini-HUD */}
      {netBars != null && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <NetBars bars={netBars} rtt={netRtt} />
          {netRtt != null && (
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              {Math.round(netRtt)}ms
            </span>
          )}
        </div>
      )}
      {/* PIP camera when screen sharing */}
      {screenStream && localStream && videoEnabled && (
        <div className="absolute bottom-2 right-2 w-28 h-20 rounded-lg overflow-hidden"
          style={{ border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <video ref={camRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

// ── Create screen ────────────────────────────────────────────────────────────
function CreateScreen({ onSubmit, isPending }) {
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [mode, setMode] = useState('hybrid');

  const MODES = [
    { id: 'hybrid',  icon: '⚡', label: 'Hybrid',    desc: 'Video + live panel' },
    { id: 'watch',   icon: '🎬', label: 'Watch Party',desc: 'Sync video for everyone' },
    { id: 'live',    icon: '🎙️', label: 'Live Panel', desc: 'Camera-only broadcast' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: BG }}>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Radio className="w-7 h-7" style={{ color: GOLD }} />
            <h1 className="text-4xl font-black uppercase tracking-widest" style={{ color: GOLD, ...T }}>
              Broadcast Studio
            </h1>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
            20-person live panel · Watch party sync · PK Battle tiers · Multilingual chat
          </p>
        </div>

        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <input
            placeholder="Broadcast title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
            className="h-11 text-white placeholder:text-white/30"
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}
          />

          <div>
            <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Mode</p>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(mod => (
                <button key={mod.id} onClick={() => setMode(mod.id)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all"
                  style={{
                    background: mode === mod.id ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
                    border: mode === mod.id ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                  <span className="text-xl">{mod.icon}</span>
                  <span className="text-[11px] font-black uppercase" style={{ color: mode === mod.id ? GOLD : 'rgba(255,255,255,0.4)', ...T }}>{mod.label}</span>
                  <span className="text-[11px] text-center leading-tight" style={{ color: 'rgba(255,255,255,0.25)' }}>{mod.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {mode !== 'live' && (
            <input
              placeholder="YouTube URL or direct video URL (optional)…"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              maxLength={2048}
              className="h-10 text-white placeholder:text-white/30"
              style={{ width: '100%', padding: '8px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}
            />
          )}

          <button
            className="w-full h-12 rounded-xl font-black uppercase text-base flex items-center justify-center gap-2 transition-all"
            style={{
              background: title.trim() ? 'linear-gradient(135deg, #800020, #A0003A)' : 'rgba(255,255,255,0.06)',
              border: title.trim() ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)',
              color: title.trim() ? GOLD : 'rgba(255,255,255,0.25)',
              boxShadow: title.trim() ? '0 0 24px rgba(128,0,32,0.35)' : 'none',
              ...T,
            }}
            disabled={!title.trim() || isPending}
            onClick={() => onSubmit({ title, videoUrl, mode })}>
            <Radio className="w-5 h-5" />
            {isPending ? 'Creating…' : 'Go Live'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main BroadcastStudio ─────────────────────────────────────────────────────
export default function BroadcastStudio() {
  const params = new URLSearchParams(window.location.search);
  const partyId = params.get('id');
  const qc = useQueryClient();

  const [studioMode, setStudioMode] = useState('hybrid');
  const [activeTab, setActiveTab] = useState('chat');
  const [leftOpen, setLeftOpen] = useState(true);
  const [theaterMode, setTheaterMode] = useState(false);
  const [syncData, setSyncData] = useState(null);
  const [hostSettings, setHostSettings] = useState({
    chatEnabled: true,
    reactionsEnabled: true,
    guestMicEnabled: true,
    guestVideoEnabled: true,
    battlesEnabled: true,
    maxViewers: 20,
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [aiSubTab, setAiSubTab] = useState('music');
  const [aiMusicGenre, setAiMusicGenre] = useState(null);
  const [aiMusicPlaying, setAiMusicPlaying] = useState(false);
  const [aiMusicTrack, setAiMusicTrack] = useState(null); // { title, genre, mood }
  const [aiMusicGenerating, setAiMusicGenerating] = useState(false);
  const [aiMusicPrompt, setAiMusicPrompt] = useState('');
  const [aiMoodDetecting, setAiMoodDetecting] = useState(false);
  const [guardianEnabled, setGuardianEnabled] = useState(true);
  const [guardianStats, setGuardianStats] = useState({ blocked: 0, warned: 0, muted: 0 });
  const [ariaEnabled, setAriaEnabled] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showCameraPicker, setShowCameraPicker] = useState(false);
  const [isExclusive, setIsExclusive] = useState(false);
  const [showPreflight, setShowPreflight] = useState(false);
  const [showGreenRoomModal, setShowGreenRoomModal] = useState(false);
  const [showActivitySidebar, setShowActivitySidebar] = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBreakoutRooms, setShowBreakoutRooms] = useState(false);
  const [showPKBattleModal, setShowPKBattleModal] = useState(false);
  const [showWebRTCConfig, setShowWebRTCConfig] = useState(false);
  const [showTippingModal, setShowTippingModal] = useState(false);
  const [selectedBitrate, setSelectedBitrate] = useState(3000);
  const [activeScene, setActiveScene] = useState('main');
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftEvent, setGiftEvent] = useState(null);
  const [guardianWords, setGuardianWords] = useState([]);
  const [guardianWordInput, setGuardianWordInput] = useState('');
  const [ariaSuggestions] = useState(['What do you think about this topic?', 'Drop a ❤️ if you agree!', 'Questions? Type them below!']);
  const [ariaTopicIdx, setAriaTopicIdx] = useState(0);
  const [musicVolume, setMusicVolume] = useState(70);
  const streamStartRef = useRef(Date.now());
  const [tipTotal, setTipTotal] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [busViewerCount, setBusViewerCount] = useState(0);
  const [superchats, setSuperchats] = useState([]);
  const [raisedHands, setRaisedHands] = useState(new Set());
  const [slowMode, setSlowMode] = useState(false);
  const [slowModeCooldown, setSlowModeCooldown] = useState(30);
  const [pinnedMessage, setPinnedMessage] = useState(null);

  useEffect(() => { setPeakViewers(prev => Math.max(prev, members.length)); }, [members.length]);

  // Elapsed timer for clip timestamps
  useEffect(() => {
    const iv = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: party } = useQuery({
    queryKey: ['broadcast-party', partyId],
    queryFn: () => base44.entities.WatchParty.filter({ id: partyId }).then(r => r[0]),
    enabled: !!partyId,
    refetchInterval: 15000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['broadcast-members', partyId],
    queryFn: () => base44.entities.WatchPartyMember.filter({ party_id: partyId, is_active: true }),
    enabled: !!partyId,
    refetchInterval: 15000,
  });

  // Real-time roster
  useEffect(() => {
    if (!partyId) return;
    const unsub = base44.entities.WatchPartyMember.subscribe((event) => {
      if (event.data?.party_id !== partyId) return;
      qc.invalidateQueries(['broadcast-members', partyId]);
    });
    return unsub;
  }, [partyId, qc]);

  // Raised hand subscription
  useEffect(() => {
    if (!partyId) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.room_id !== partyId) return;
      try {
        const d = JSON.parse(event.data?.content || '{}');
        if (d.action === 'raise-hand') {
          setRaisedHands(prev => new Set([...prev, d.userId]));
        }
      } catch {}
    });
    return unsub;
  }, [partyId]);

  // Local media — use stored device preferences from RoomEntryGate if available
  const prefCam = (() => { try { return localStorage.getItem('swl_pref_cam') || null; } catch { return null; } })();
  const prefMic = (() => { try { return localStorage.getItem('swl_pref_mic') || null; } catch { return null; } })();
  const { localStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo, replaceVideoDevice, replaceAudioDevice, applyAudioConstraints, activeVideoId, activeAudioId, error: mediaError, reacquire: reacquireMedia } = useLocalMedia({ audio: true, video: true, videoDeviceId: prefCam, audioDeviceId: prefMic });
  const handleBitrateChange = (b) => { setSelectedBitrate(b); reacquireMedia({ resolution: ({1500:'480p',3000:'720p',5000:'1080p',7500:'1080p'})[b]||'720p' }); };

  var vodResult=useVODRecording({streamId:partyId||'',creatorId:user&&user.id||'',title:party&&party.title||'Live Recording',stream:localStream});
  var vodRecording=vodResult.recording,startRecording=vodResult.startRecording,stopRecording=vodResult.stopRecording,vodDuration=vodResult.duration,vodBlobUrl=vodResult.blobUrl,downloadRecording=vodResult.downloadRecording,extractClipBlobUrl=vodResult.extractClipBlobUrl;
  var speakGate=useAutoSpeakGate({stream:localStream,enabled:true});
  var isSpeaking=speakGate.isSpeaking,micLevelVal=speakGate.micLevel,isClipping=speakGate.isClipping;

  // WebRTC peer mesh — uses partyId as the signaling channel room
  const { remoteStreams, peerUserIds, announceJoin, leaveRoom, peersRef } = useWebRTCPeers(partyId, localStream, {
    onPeerStateChange: useCallback((peerId, state) => {
      if (state === 'disconnected') {
        toast(`⚠️ A participant dropped — reconnecting…`, { duration: 5000, id: `peer-${peerId}-disc` });
      } else if (state === 'connected') {
        toast.dismiss(`peer-${peerId}-disc`);
        toast.success(`✅ Participant reconnected`, { duration: 2500 });
      } else if (state === 'failed') {
        toast.error(`❌ Peer connection failed — removing from room`, { duration: 4000, id: `peer-${peerId}-fail` });
      }
    }, []),
  });

  // Connection quality — monitor first connected peer
  const [activePc, setActivePc] = useState(null);
  useEffect(() => {
    const entries = Array.from(peersRef.current.entries());
    const connected = entries.find(([, { pc }]) => pc.connectionState === 'connected');
    setActivePc(connected ? connected[1].pc : null);
  }, [remoteStreams]); // eslint-disable-line react-hooks/exhaustive-deps
  const { bars: netBars, label: netLabel, rtt: netRtt, quality: netQuality } = useConnectionQuality(activePc, 5000);
  const subCount = useSubscriptionCount(user?.id);

  // Warn broadcaster once when connection drops to 1 bar or below
  const lastNetBarsRef = useRef(null);
  useEffect(() => {
    if (netBars === null || netBars === undefined) return;
    if (netBars <= 1 && (lastNetBarsRef.current === null || lastNetBarsRef.current > 1)) {
      toast.warning('Poor network connection — stream quality may be affected');
    }
    lastNetBarsRef.current = netBars;
  }, [netBars]);

  // Adaptive video quality — 3-tier system based on connection bars
  // Tier: 'high' (bars≥3) | 'medium' (bars=2) | 'low' (bars≤1)
  const prefRes = (() => { try { return localStorage.getItem('swl_pref_resolution') || '720p'; } catch { return '720p'; } })();
  const adaptiveTierRef = useRef('high');
  useEffect(() => {
    if (netBars == null || !localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (!track) return;
    const PRESETS = {
      '360p':  { width: 640,  height: 360  },
      '480p':  { width: 854,  height: 480  },
      '720p':  { width: 1280, height: 720  },
      '1080p': { width: 1920, height: 1080 },
    };
    const basePreset = PRESETS[prefRes] || PRESETS['720p'];
    if (netBars <= 1 && adaptiveTierRef.current !== 'low') {
      adaptiveTierRef.current = 'low';
      track.applyConstraints({ width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 12 } }).catch(() => {});
    } else if (netBars === 2 && adaptiveTierRef.current !== 'medium') {
      adaptiveTierRef.current = 'medium';
      track.applyConstraints({ width: { ideal: 854 }, height: { ideal: 480 }, frameRate: { ideal: 20 } }).catch(() => {});
    } else if (netBars >= 3 && adaptiveTierRef.current !== 'high') {
      adaptiveTierRef.current = 'high';
      track.applyConstraints({ ...Object.fromEntries(Object.entries(basePreset).map(([k, v]) => [k, { ideal: v }])), frameRate: { ideal: 30 } }).catch(() => {});
    }
  }, [netBars, localStream, prefRes]);

  // Per-peer connection quality — Map<userId, {bars, rtt}>
  const [peerQuality, setPeerQuality] = useState(() => new Map());
  useEffect(() => {
    const interval = setInterval(async () => {
      const qual = new Map();
      for (const [peerId, { pc }] of peersRef.current.entries()) {
        if (pc.connectionState !== 'connected') continue;
        const uid = peerUserIds?.get(peerId);
        if (!uid) continue;
        try {
          const stats = await pc.getStats();
          let totalRtt = 0, cnt = 0;
          stats.forEach(r => {
            if (r.type === 'candidate-pair' && r.state === 'succeeded' && r.currentRoundTripTime != null) {
              totalRtt += r.currentRoundTripTime * 1000;
              cnt++;
            }
          });
          const rtt = cnt > 0 ? Math.round(totalRtt / cnt) : null;
          const bars = rtt == null ? 3 : rtt < 80 ? 4 : rtt < 200 ? 3 : rtt < 400 ? 2 : 1;
          qual.set(uid, { bars, rtt });
        } catch {}
      }
      setPeerQuality(qual);
    }, 5000);
    return () => clearInterval(interval);
  }, [peerUserIds]); // peersRef is a stable ref — no dep needed

  // Audio output (speaker) preference — applied to all video/audio elements via setSinkId
  const { speakers } = useCameraDevices();
  const [prefSpeaker, setPrefSpeaker] = useState(() => { try { return localStorage.getItem('swl_pref_speaker') || ''; } catch { return ''; } });
  useEffect(() => {
    if (!prefSpeaker) return;
    document.querySelectorAll('video, audio').forEach(el => {
      if (typeof el.setSinkId === 'function' && el.sinkId !== prefSpeaker) {
        el.setSinkId(prefSpeaker).catch(() => {});
      }
    });
  }, [prefSpeaker, remoteStreams]);

  // Audio processing toggles — applied to the live audio track without re-acquiring
  const [noiseSupp, setNoiseSupp] = useState(true);
  const [echoCan, setEchoCan] = useState(true);
  const [autoGain, setAutoGain] = useState(true);
  useEffect(() => {
    applyAudioConstraints({ noiseSuppression: noiseSupp, echoCancellation: echoCan, autoGainControl: autoGain });
  }, [noiseSupp, echoCan, autoGain, applyAudioConstraints]);

  // Screen share
  const [screenStream, setScreenStream] = useState(null);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const localStreamRef2 = useRef(localStream);
  useEffect(() => { localStreamRef2.current = localStream; }, [localStream]);

  const toggleScreenShare = useCallback(async () => {
    if (screenEnabled && screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
      setScreenEnabled(false);
      const camTrack = localStreamRef2.current?.getVideoTracks()[0];
      if (camTrack) {
        peersRef.current.forEach(({ pc }) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(camTrack).catch(() => {});
        });
      }
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always', frameRate: { ideal: 30 }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: true });
      const screenTrack = stream.getVideoTracks()[0];
      screenTrack.onended = () => {
        setScreenStream(null);
        setScreenEnabled(false);
        const camTrack = localStreamRef2.current?.getVideoTracks()[0];
        if (camTrack) {
          peersRef.current.forEach(({ pc }) => {
            const s = pc.getSenders().find(s2 => s2.track?.kind === 'video');
            if (s) s.replaceTrack(camTrack).catch(() => {});
          });
        }
      };
      setScreenStream(stream);
      setScreenEnabled(true);
      peersRef.current.forEach(({ pc }) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack).catch(() => {});
      });
    } catch {
      // User cancelled or browser denied — no-op
    }
  }, [screenEnabled, screenStream, peersRef]);
  const announceRef = useRef(announceJoin);
  const leaveRef = useRef(leaveRoom);
  useEffect(() => { announceRef.current = announceJoin; }, [announceJoin]);
  useEffect(() => { leaveRef.current = leaveRoom; }, [leaveRoom]);
  const announcedRef = useRef(false);
  useEffect(() => {
    if (!localStream || !user?.id || announcedRef.current) return;
    announcedRef.current = true;
    announceRef.current?.(user.id);
  }, [localStream, user?.id]);
  useEffect(() => () => leaveRef.current?.(), []);

  const [hypeLevel, setHypeLevel] = useState(0);

  const isHost = party?.host_id === user?.id;
  const myMember = members.find(m => m.user_id === user?.id);
  const isCoHost = myMember?.role === 'cohost';
  const isSpeaker = myMember?.role === 'speaker';
  const canManage = isHost || isCoHost;
  const canStream = isHost || isCoHost || isSpeaker;

  const speakingName = members.find(m => m.is_audio_enabled && m.user_id !== user?.id)?.user_name || null;

  function handleToggleAudio() {
    toggleAudio();
    if (myMember?.id) {
      base44.entities.WatchPartyMember.update(myMember.id, { is_audio_enabled: !audioEnabled }).catch(() => {});
    }
  }

  const [pttActive, setPttActive] = useState(false);
  const pttWasEnabledRef = useRef(false);

  // Keyboard shortcuts: M = mic, V = camera, S = screen share, C = clip, Space = push-to-talk
  useEffect(() => {
    if (!canStream) return;
    const onDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if (e.key === 'm' || e.key === 'M') { e.preventDefault(); handleToggleAudio(); }
      if (e.key === 'v' || e.key === 'V') { e.preventDefault(); toggleVideo(); }
      if (e.key === 's' || e.key === 'S') { e.preventDefault(); toggleScreenShare(); }
      if ((e.key === 'c' || e.key === 'C') && isHost) { e.preventDefault(); triggerHighlightClip(1); }
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
  }, [canStream, audioEnabled, videoEnabled, screenEnabled, isHost, pttActive]);

  // AI highlight detector — auto-clips when hype + sentiment spike
  const { triggerHighlightClip } = useHighlightDetector({
    partyId,
    roomId: partyId,
    isHost,
    user,
    messages: chatMessages,
    hypeLevel,
    elapsedSeconds: elapsed,
    getClipBlobUrl: extractClipBlobUrl,
  });

  const onTimeSync = useCallback((data) => setSyncData(data), []);
  const { pushState } = useSyncEngine({ party, isController: canManage, onTimeSync });

  // Auto-join as member
  useEffect(() => {
    if (!party || !user) return;
    let mounted = true;
    (async () => {
      try {
        const existing = await base44.entities.WatchPartyMember.filter({ party_id: party.id, user_id: user.id, is_active: true });
        if (!mounted) return;
        if (!existing.length) {
          await base44.entities.WatchPartyMember.create({
            party_id: party.id,
            user_id: user.id,
            user_name: user.full_name || user.email,
            joined_at: new Date().toISOString(),
            is_active: true,
            role: party.host_id === user.id ? 'host' : 'audience',
            is_audio_enabled: true,
            is_video_enabled: true,
          });
          if (mounted) qc.invalidateQueries({ queryKey: ['broadcast-members', party.id] });
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [party?.id, user?.id]);

  // Leave on unmount
  useEffect(() => () => {
    if (!party?.id || !user?.id) return;
    base44.entities.WatchPartyMember.filter({ party_id: party.id, user_id: user.id, is_active: true })
      .then(ms => ms.forEach(m => base44.entities.WatchPartyMember.update(m.id, { is_active: false, left_at: new Date().toISOString() }).catch(() => {}))).catch(() => {});
  }, [party?.id, user?.id]);

  const createMut = useMutation({
    mutationFn: async ({ title, videoUrl, mode }) => {
      const safeUrl = (videoUrl && isSafeUrl(videoUrl)) ? videoUrl : '';
      const type = safeUrl ? detectVideoType(safeUrl) : 'live';
      const p = await base44.entities.WatchParty.create({
        host_id: user.id,
        title: clampStr(title, LIMITS.ROOM_TITLE) || 'Broadcast Studio',
        video_url: safeUrl,
        video_type: type,
        status: 'active',
        participant_count: 1,
        current_time: 0,
        updated_at_ms: Date.now(),
        playback_state: 'paused',
      });
      return { party: p, mode };
    },
    onSuccess: ({ party: p, mode }) => {
      setStudioMode(mode);
      window.location.href = `${window.location.pathname}?id=${p.id}`;
    },
    onError: () => toast.error('Action failed.'),
  });

  const endMut = useMutation({
    mutationFn: () => base44.entities.WatchParty.update(partyId, { status: 'ended' }),
    onSuccess: () => {
      toast.success('Broadcast ended');
      if (user?.id) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'room_ended',
          title: `Stream ended`,
        }).catch(() => {});
      }
      setSearchParams({});
    },
    onError: () => toast.error('Action failed.'),
  });

  // ── AI Music handlers ────────────────────────────────────────────────────
  const generateAiTrack = async () => {
    const prompt = aiMusicPrompt.trim() || (aiMusicGenre ? `${aiMusicGenre} background music for a live stream` : 'upbeat live stream background music');
    setAiMusicGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI music producer. Generate a background music track description for a live stream.
Genre/Style: ${aiMusicGenre || 'Chill'}
Prompt: "${prompt}"
Members on stage: ${members.length}

Respond with JSON only:
{
  "title": "track title (catchy, 3-5 words)",
  "genre": "genre name",
  "mood": "mood descriptor",
  "bpm": number between 70-140,
  "key": "musical key (e.g. C major)",
  "description": "2-sentence vivid description of the sound",
  "tags": ["tag1","tag2","tag3"]
}`
      });
      const data = JSON.parse(result.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      setAiMusicTrack(data);
      setAiMusicPlaying(true);
      if (party?.id) {
        base44.entities.WatchParty.update(party.id, {
          updated_at_ms: Date.now(),
        }).catch(() => {});
      }
      toast.success(`🎵 Now playing: ${data.title}`);
    } catch {
      // fallback track on error
      const fallback = { title: `${aiMusicGenre || 'Chill'} Vibes`, genre: aiMusicGenre || 'Chill', mood: 'relaxed', bpm: 90, description: 'Smooth background music for your stream.', tags: ['chill', 'live', 'stream'] };
      setAiMusicTrack(fallback);
      setAiMusicPlaying(true);
    } finally {
      setAiMusicGenerating(false);
    }
  };

  const detectChatMood = async () => {
    if (!chatMessages?.length) { toast('No chat messages yet'); return; }
    setAiMoodDetecting(true);
    try {
      const snippet = chatMessages.slice(-20).map(m => m.content).join('\n');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the vibe of this live stream chat and suggest a music genre.
Chat messages:
${snippet}

Respond with JSON only: {"genre": "one of: Lo-Fi|Trap|Gospel|Afrobeats|R&B|Chill|Hype|Jazz|EDM|Soul", "mood": "one sentence mood description", "energy": "low|medium|high"}`
      });
      const data = JSON.parse(result.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      setAiMusicGenre(data.genre);
      toast.success(`🎵 Chat vibe: ${data.mood} → switching to ${data.genre}`);
    } catch {
      toast('Could not analyze chat mood');
    } finally {
      setAiMoodDetecting(false);
    }
  };

  const promoteCoHost = async (member) => {
    try {
      await base44.entities.WatchPartyMember.update(member.id, { role: 'cohost' });
      toast.success(`${member.user_name} promoted to co-host`);
      qc.invalidateQueries({ queryKey: ['broadcast-members', partyId] });
    } catch { toast.error('Failed to promote member.'); }
  };

  const promoteSpeaker = async (member) => {
    try {
      await base44.entities.WatchPartyMember.update(member.id, { role: 'speaker' });
      toast.success(`${member.user_name} added to panel`);
      qc.invalidateQueries({ queryKey: ['broadcast-members', partyId] });
    } catch { toast.error('Failed to add to panel.'); }
  };

  const demoteToAudience = async (member) => {
    try {
      await base44.entities.WatchPartyMember.update(member.id, { role: 'audience' });
      qc.invalidateQueries({ queryKey: ['broadcast-members', partyId] });
    } catch { toast.error('Failed to update member role.'); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('Invite link copied!');
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => toast.error('Copy failed.'));
  };

  const kickMember = async (member) => {
    try {
      await base44.entities.WatchPartyMember.update(member.id, { is_active: false, left_at: new Date().toISOString() });
      toast.success(`${member.user_name} removed from broadcast`);
      qc.invalidateQueries({ queryKey: ['broadcast-members', partyId] });
    } catch { toast.error('Failed to remove member.'); }
  };

  const sendRaiseHand = async () => {
    if (!partyId || !user?.id) return;
    try {
      await base44.entities.Message.create({
        room_id: partyId,
        user_id: user.id,
        user_name: user.full_name || user.email,
        content: JSON.stringify({ action: 'raise-hand', userId: user.id, userName: user.full_name || user.email }),
        type: 'system',
      });
      toast.success('✋ Hand raised — waiting for host');
    } catch {
      toast.error('Failed to raise hand.');
    }
  };

  const dismissRaisedHand = (userId) => {
    setRaisedHands(prev => { const s = new Set(prev); s.delete(userId); return s; });
  };

  // Build compositor slots from localStream + remoteStreams
  const compositorSlots = React.useMemo(() => {
    const slots = [];
    if (localStream) {
      const roleLabel = isHost ? 'Host' : isCoHost ? 'Co-Host' : isSpeaker ? 'Panel' : 'You';
      slots.push({ stream: localStream, label: user?.full_name || user?.email || `You (${roleLabel})`, speaking: isSpeaking });
    }
    if (remoteStreams) {
      remoteStreams.forEach((stream, peerId) => {
        const userId = peerUserIds?.get(peerId);
        const member = members.find(m => m.user_id === userId);
        slots.push({ stream, label: member?.user_name || 'Guest' });
      });
    }
    return slots;
  }, [localStream, remoteStreams, peerUserIds, members, user, isSpeaking]);

  // Use spotlight when there are remote peers, otherwise panel layout
  const compositorLayout = remoteStreams?.size > 0 ? 'spotlight' : 'panel';

  const compositorOverlay = {
    title: party?.title || 'SeeWhy LIVE',
    subtitle: `${members.length} panelists`,
    showLive: true,
    layout: compositorLayout,
    spotlightIndex: 0, // local stream always featured
  };

  // ── Create screen ────────────────────────────────────────────────────────
  if (!partyId) {
    return <CreateScreen onSubmit={(args) => createMut.mutate(args)} isPending={createMut.isPending} />;
  }

  if (!party) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD }} />
      </div>
    );
  }

  const safeVideoUrl = isSafeUrl(party.video_url) ? party.video_url : '';
  const ytId = party.video_type === 'youtube' ? getYouTubeId(safeVideoUrl) : null;
  const hasVideo = !!safeVideoUrl;
  const showVideoPlayer = (studioMode === 'watch' || studioMode === 'hybrid') && hasVideo;

  const RIGHT_TABS = [
    { id: 'chat',    label: '💬 Chat',   desc: 'Multilingual' },
    { id: 'battle',  label: '⚔️ Battle', desc: 'PK Tiers' },
    { id: 'polls',   label: '📊 Polls',  desc: 'Live polls' },
    { id: 'viewers', label: '👥 Panel',  desc: 'Manage' },
    ...(canManage ? [{ id: 'manage', label: '🛡 Manage', desc: 'Host tools' }] : []),
    ...(canManage ? [{ id: 'queue',  label: '🎙 Queue',  desc: 'Guest queue' }] : []),
    ...(canStream ? [{ id: 'audio',  label: '🎚 Audio',  desc: 'Mixer' }] : []),
    { id: 'ai',    label: '🤖 AI',    desc: 'Music & Mod' },
    { id: 'share', label: '📢 Share', desc: 'Go Viral' },
  ];

  return (
    <div className={`flex flex-col ${theaterMode ? 'fixed inset-0 z-50' : 'h-screen'}`} style={{ background: BG }}>

      {/* ── FANBASE-STYLE TOP BAR ──────────────────────────────────────────── */}
      <div className="shrink-0" style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>

        {/* Row 1: panel toggle | title + badges | right actions */}
        <div className="flex items-center gap-2 px-3 h-12">
          <button onClick={() => setLeftOpen(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-xl shrink-0 transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            {leftOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-black text-white truncate" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, letterSpacing: '0.02em' }}>{party.title}</span>
            <span className="shrink-0 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-black uppercase"
              style={{ background: 'rgba(192,57,43,0.18)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.35)', ...T }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />LIVE
            </span>
            {isExclusive && (
              <span className="shrink-0 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-black uppercase"
                style={{ background: 'rgba(212,175,55,0.2)', color: GOLD, border: `1px solid rgba(212,175,55,0.5)`, ...T }}>
                🔐 EXCLUSIVE
              </span>
            )}
            <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full font-black uppercase hidden sm:block"
              style={{ background: 'rgba(212,175,55,0.1)', color: GOLD, border: `1px solid rgba(212,175,55,0.25)`, ...T }}>
              SeeWhy LIVE
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Connection quality */}
            <div className="flex items-end gap-0.5 px-1.5 py-1 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.35)' }}
              title={`Network: ${netLabel}${netRtt ? ` · ${netRtt}ms` : ''}`}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  width: 4, borderRadius: 2,
                  height: 4 + i * 3,
                  background: i < netBars
                    ? (netBars >= 3 ? '#6DBF7E' : netBars >= 2 ? '#D4AF37' : '#C0392B')
                    : 'rgba(255,255,255,0.15)',
                }} />
              ))}
            </div>
            <button onClick={copyLink}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-95"
              style={{ background: 'rgba(212,175,55,0.08)', color: GOLD }} title="Copy invite link">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setTheaterMode(v => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-95"
              style={{ background: theaterMode ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)', color: theaterMode ? GOLD : 'rgba(255,255,255,0.4)' }}>
              {theaterMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            {canManage && <GreenroomWaitlistPanel roomId={partyId} currentUser={user} />}
            {isHost && (
              <VideoSourcePicker
                compact
                isHost={isHost}
                isCoHost={isCoHost}
                onSelect={src => {
                  const safeSelectUrl = isSafeUrl(src.url) ? src.url : '';
                  base44.entities.WatchParty.update(party.id, {
                    video_url: safeSelectUrl,
                    video_type: src.type === 'youtube' ? 'youtube' : 'direct',
                    current_time: 0,
                    playback_state: 'paused',
                    updated_at_ms: Date.now(),
                  }).then(() => {
                    qc.invalidateQueries(['broadcast-party', partyId]);
                    setStudioMode('watch');
                  }).catch(() => toast.error('Failed to update video.'));
                }}
              />
            )}
            {canStream && (
              <CompositorOverlay
                layout={studioMode === 'watch' ? 'watchparty' : compositorLayout}
                slots={compositorSlots}
                overlayConfig={compositorOverlay}
                userId={user?.id}
                onScreenCapture={(studioMode === 'watch' || studioMode === 'hybrid') ? async () => {
                  const s = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: true });
                  return s;
                } : undefined}
                isHost={canStream}
              />
            )}
            {canStream && (
              <ClipMarker roomId={partyId} user={user} streamStartTs={streamStartRef.current} getClipBlobUrl={extractClipBlobUrl} />
            )}
            {isHost && (
              <button onClick={() => endMut.mutate()}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
                style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.25)', color: '#C0392B', ...T }}>
                <LogOut className="w-3 h-3" /> End
              </button>
            )}
          </div>
        </div>

        {/* Row 2: host avatar + name | member count | mode pills | speaking indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black text-white"
            style={{ background: 'linear-gradient(135deg, #800020, #D4AF37)' }}>
            {(user?.full_name || user?.email || 'H').charAt(0).toUpperCase()}
          </div>
          <span className="text-[10px] text-white/50 truncate max-w-[80px]" style={T}>{user?.full_name || 'Host'}</span>
          <span className="text-white/15 mx-0.5">·</span>
          <Users className="w-3 h-3 shrink-0" style={{ color: GOLD }} />
          <span className="text-[10px] font-bold shrink-0" style={{ color: GOLD, ...T }}>{members.length}/20</span>
          <div className="flex items-center gap-1 ml-1">
            {[
              { id: 'hybrid', icon: '⚡', label: 'Hybrid' },
              { id: 'watch',  icon: '🎬', label: 'Watch' },
              { id: 'live',   icon: '🎙', label: 'Live' },
            ].map(mod => (
              <button key={mod.id} onClick={() => setStudioMode(mod.id)}
                className="text-[11px] px-2 py-0.5 rounded-full font-black uppercase transition-all active:scale-95"
                style={{
                  background: studioMode === mod.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                  border: studioMode === mod.id ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  color: studioMode === mod.id ? GOLD : 'rgba(255,255,255,0.3)', ...T,
                }}>
                {mod.icon} {mod.label}
              </button>
            ))}
          </div>
          {isHost && (
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0"
              style={{ background: 'rgba(212,175,55,0.1)', color: GOLD, border: `1px solid rgba(212,175,55,0.2)`, ...T }}>
              Host
            </span>
          )}
          {isCoHost && !isHost && (
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0"
              style={{ background: 'rgba(212,175,55,0.1)', color: GOLD, border: `1px solid rgba(212,175,55,0.25)`, ...T }}>
              Co-Host
            </span>
          )}
          {isSpeaker && !isHost && !isCoHost && (
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0"
              style={{ background: 'rgba(212,133,74,0.12)', color: '#D4854A', border: '1px solid rgba(212,133,74,0.25)', ...T }}>
              Panel
            </span>
          )}
          {speakingName && (
            <span className="ml-auto text-[10px] italic shrink-0" style={{ color: 'rgba(255,255,255,0.6)', ...T }}>
              &quot;{speakingName} is speaking&quot;
            </span>
          )}
        </div>

        {/* Metrics bar */}
        <StreamMetricsBar
          startTime={streamStartRef.current}
          memberCount={members.length}
          tipTotal={tipTotal}
          peakViewers={peakViewers}
          netQuality={netQuality}
          netRtt={netRtt}
        />
      </div>

      {/* ── MAIN AREA ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT: 20-person Panel Grid ────────────────────────────────── */}
        <AnimatePresence>
          {leftOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 216, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 overflow-hidden h-full flex flex-col"
              style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="shrink-0 flex items-center justify-between px-3 py-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                <span className="text-[14px] font-black text-white" style={T}>Stage</span>
                <span className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.45)', ...T }}>
                  {members.length}/{hostSettings.maxViewers}
                </span>
                <button className="w-6 h-6 flex items-center justify-center rounded"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <LayoutGrid className="w-3.5 h-3.5" style={{ color: GOLD }} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <PanelGrid
                  members={members}
                  currentUser={user}
                  hostId={party.host_id}
                  maxSlots={hostSettings.maxViewers}
                  isHost={canManage}
                  onInvite={copyLink}
                  remoteStreams={remoteStreams}
                  peerUserIds={peerUserIds}
                  localStream={localStream}
                  peerQuality={peerQuality}
                />
                {members.length > 6 && (() => {
                  const stageMembers = members.filter(m => m.user_id === party.host_id || m.role === 'cohost' || m.role === 'speaker');
                  const audienceMembers = members.filter(m => m.role === 'audience' || m.role === 'viewer' || (!m.role && m.user_id !== party.host_id));
                  if (audienceMembers.length === 0) return null;
                  const shown = audienceMembers.slice(0, 15);
                  const overflow = audienceMembers.length - 15;
                  return (
                    <div className="px-2 pt-2 pb-3">
                      <p className="text-[11px] uppercase font-bold mb-2 tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Others in the Room</p>
                      <div className="flex flex-wrap gap-1.5">
                        {shown.map(m => (
                          <div key={m.id} className="flex flex-col items-center gap-0.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white"
                              style={{ background: 'rgba(255,255,255,0.08)' }}>
                              {(m.user_name || '?')[0].toUpperCase()}
                            </div>
                            <span className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.3)', maxWidth: 32 }}>{m.user_name?.split(' ')[0]}</span>
                          </div>
                        ))}
                        {overflow > 0 && (
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                              style={{ background: 'rgba(212,175,55,0.15)', color: GOLD }}>
                              +{overflow}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CENTER: Stage ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Main video / camera area */}
          <div className="relative shrink-0 bg-black group" style={{ aspectRatio: '16/9' }}>
            {showVideoPlayer ? (
              party.video_type === 'youtube' && ytId ? (
                <YouTubeEmbed
                  videoId={ytId}
                  isController={canManage}
                  syncData={canManage ? null : (syncData || party)}
                  onStateChange={pushState}
                />
              ) : (
                <DirectPlayer
                  url={safeVideoUrl}
                  isController={canManage}
                  syncData={canManage ? null : (syncData || party)}
                  onStateChange={pushState}
                />
              )
            ) : (
              <LiveCameraTile localStream={localStream} videoEnabled={videoEnabled} screenStream={screenStream} isSpeaking={isSpeaking} netBars={netBars} netRtt={netRtt} />
            )}

            {/* Hybrid PIP: local camera overlay when video is playing */}
            {studioMode === 'hybrid' && hasVideo && localStream && (
              <PipCameraTile localStream={localStream} videoEnabled={videoEnabled} />
            )}

            {/* Sync badge for audience viewers */}
            {!canStream && (
              <div className="absolute top-2 right-2 text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1"
                style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(107,124,74,0.3)', color: 'white' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#6DBF7E] animate-pulse" />
                Live Sync
              </div>
            )}
          </div>

          {/* Super chat rail */}
          <SuperChatRail superchats={superchats} />

          {/* Hype meter */}
          <div className="shrink-0 px-3 py-1">
            <PartyHypeMeter partyId={partyId} memberCount={members.length} onHypeChange={setHypeLevel} />
          </div>

          {/* Viewer rail */}
          <ViewerRail members={members} hostId={party.host_id} />

          {/* Emoji reactions — hidden when host disables reactions */}
          {hostSettings.reactionsEnabled && (
            <>
              <div className="shrink-0">
                <PartyReactionsOverlay
                  partyId={partyId}
                  currentUser={user}
                  currentTime={syncData?.current_time || party?.current_time || 0}
                />
              </div>
              <LiveEmoticonStorm partyId={partyId} currentUser={user} />
            </>
          )}

          {/* PK Battle strip — hidden when host disables battles */}
          {hostSettings.battlesEnabled && (
            <div className="flex-1 overflow-auto p-2 min-h-0">
              <BattleTiers partyId={partyId} currentUser={user} members={members} hostId={party.host_id} />
            </div>
          )}
        </div>

        {/* ── RIGHT: Tabbed tools panel ─────────────────────────────────── */}
        <div className="shrink-0 flex flex-col overflow-hidden" style={{ width: 296, borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#0D0618' }}>

          {/* Exclusive Live toggle */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
            <span style={{ fontSize: 14 }}>🔒</span>
            <span className="flex-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Exclusive Live
            </span>
            <button
              onClick={() => {
                const next = !isExclusive;
                setIsExclusive(next);
                if (partyId && next) {
                  base44.entities.WatchParty.update(partyId, { is_exclusive: true });
                } else if (partyId && !next) {
                  base44.entities.WatchParty.update(partyId, { is_exclusive: false });
                }
              }}
              style={{
                position: 'relative',
                width: 36,
                height: 20,
                borderRadius: 10,
                background: isExclusive ? GOLD : 'rgba(255,255,255,0.2)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: 2,
                left: isExclusive ? 18 : 2,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {/* Slow mode toggle */}
          {canManage && (
            <div className="shrink-0 flex items-center gap-2 px-3 py-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ fontSize: 14 }}>🐢</span>
              <span className="flex-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                Slow Mode
              </span>
              {slowMode && (
                <div className="flex items-center gap-1 mr-2">
                  {[10, 30, 60].map(s => (
                    <button key={s} onClick={() => setSlowModeCooldown(s)}
                      className="text-[11px] px-1.5 py-0.5 rounded-full"
                      style={{ background: slowModeCooldown === s ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)', color: slowModeCooldown === s ? '#C9A84C' : 'rgba(255,255,255,0.3)', border: slowModeCooldown === s ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(255,255,255,0.07)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {s}s
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setSlowMode(v => !v)}
                style={{ position: 'relative', width: 36, height: 20, borderRadius: 10, background: slowMode ? '#C9A84C' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: 2, left: slowMode ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
            </div>
          )}

          {/* Tab bar */}
          <div className="flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0B0B18' }}>
            {RIGHT_TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-2 flex flex-col items-center gap-0 transition-all"
                style={{
                  color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.3)',
                  background: activeTab === tab.id ? 'rgba(212,175,55,0.06)' : 'transparent',
                  borderBottom: activeTab === tab.id ? `2px solid ${GOLD}` : '2px solid transparent',
                }}>
                <span className="text-[11px] font-black uppercase" style={T}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Quick-action feature row */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2 overflow-x-auto"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
            {[
              { icon: '🎁', label: 'Gifts',    action: () => setGiftOpen(true) },
              { icon: '👥', label: 'Invite',   action: () => setShowInviteSheet(true) },
              { icon: '⚔️', label: 'PK',       action: () => setShowPKBattleModal(true) },
              { icon: '🚪', label: 'Breakout', action: () => setShowBreakoutRooms(true) },
              { icon: '📢', label: 'Share',    action: () => setShowShareModal(true) },
              { icon: '⚡', label: 'Activity', action: () => setShowActivitySidebar(v => !v) },
              { icon: '📊', label: 'Poll',     action: () => { window.location.href = '/PollManager'; } },
              { icon: '🔔', label: 'Alert',    action: () => toast.info('Alert sent to audience!') },
              { icon: '🎵', label: 'Music',    action: () => { window.location.href = '/AIMusic'; } },
            ].map(item => (
              <button key={item.label}
                onClick={item.action}
                className="flex flex-col items-center gap-0.5 shrink-0 transition-all hover:opacity-80"
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {item.icon}
                </div>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">

            {/* 💬 MULTILINGUAL CHAT */}
            {activeTab === 'chat' && (
              hostSettings.chatEnabled ? (
                <div className="flex flex-col h-full">
                  {pinnedMessage && (
                    <div className="shrink-0 flex items-center gap-2 px-3 py-2 mx-2 mt-2 rounded-lg" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
                      <span className="text-[10px]">📌</span>
                      <span className="flex-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Barlow Condensed, sans-serif' }}>{pinnedMessage}</span>
                    </div>
                  )}
                  <div className="flex-1 min-h-0">
                    <AggregatedChat roomId={partyId} currentUser={user} isHost={canManage} onMessagesChange={setChatMessages} slowMode={slowMode} slowModeCooldown={slowModeCooldown} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-[10px] text-white/25">Chat disabled by host</p>
                </div>
              )
            )}

            {/* ⚔️ PK BATTLE */}
            {activeTab === 'battle' && (
              hostSettings.battlesEnabled ? (
                <div className="p-2 space-y-2">
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <Swords className="w-3.5 h-3.5" style={{ color: GOLD }} />
                    <span className="text-[10px] font-black uppercase" style={{ color: GOLD, ...T }}>PK Battle Tiers</span>
                  </div>
                  <BattleTiers partyId={partyId} currentUser={user} members={members} hostId={party.host_id} />
                  <div className="rounded-xl p-3 mt-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Award tiers to panelists in real time. Points accumulate during the broadcast and reset each session.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-[10px] text-white/25">Battles disabled by host</p>
                </div>
              )
            )}

            {/* 📊 POLLS */}
            {activeTab === 'polls' && (
              <div className="p-2">
                <LivePollWidget roomId={partyId} currentUser={user} isHost={canManage} />
              </div>
            )}

            {/* 👥 PANEL MANAGEMENT */}
            {activeTab === 'viewers' && (
              <div className="p-2 space-y-2">
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-[11px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
                    {members.length} / 20 panelists
                  </span>
                  <button onClick={() => setShowInviteSheet(true)} className="text-[11px] px-2 py-0.5 rounded"
                    style={{ background: 'rgba(212,175,55,0.08)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', ...T }}>
                    + Invite
                  </button>
                </div>

                {/* Raised hands queue */}
                {canManage && raisedHands.size > 0 && (
                  <div className="rounded-xl p-2 mb-1" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <div className="flex items-center gap-1 mb-1.5">
                      <Hand className="w-3 h-3" style={{ color: GOLD }} />
                      <span className="text-[11px] font-black uppercase" style={{ color: GOLD, ...T }}>
                        Raised Hands ({raisedHands.size})
                      </span>
                    </div>
                    {[...raisedHands].map(uid => {
                      const mem = members.find(m => m.user_id === uid);
                      return (
                        <div key={uid} className="flex items-center gap-2 py-1">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black"
                            style={{ background: 'rgba(212,175,55,0.2)', color: GOLD }}>
                            {(mem?.user_name || '?')[0].toUpperCase()}
                          </div>
                          <span className="flex-1 text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{mem?.user_name || uid}</span>
                          <button onClick={() => { if (mem) promoteSpeaker(mem); dismissRaisedHand(uid); }}
                            className="text-[11px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(212,133,74,0.1)', color: '#D4854A', border: '1px solid rgba(212,133,74,0.25)', ...T }}>
                            ✓ Panel
                          </button>
                          <button onClick={() => { if (mem) promoteCoHost(mem); dismissRaisedHand(uid); }}
                            className="text-[11px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(212,175,55,0.08)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', ...T }}>
                            Co-host
                          </button>
                          <button onClick={() => dismissRaisedHand(uid)}
                            className="text-[11px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(255,68,68,0.08)', color: '#FF6666', border: '1px solid rgba(255,68,68,0.15)', ...T }}>
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {members.map(mem => {
                  const isMe = mem.user_id === user?.id;
                  const isHostMem = mem.user_id === party.host_id;
                  const isCoHostMem = mem.role === 'cohost';
                  const isSpeakerMem = mem.role === 'speaker';
                  const isOnStage = isHostMem || isCoHostMem || isSpeakerMem;
                  const hasHand = raisedHands.has(mem.user_id);
                  const avatarBg = isHostMem ? 'rgba(212,175,55,0.2)' : isCoHostMem ? 'rgba(212,175,55,0.12)' : isSpeakerMem ? 'rgba(212,133,74,0.18)' : 'rgba(255,255,255,0.08)';
                  const avatarColor = isHostMem ? GOLD : isCoHostMem ? GOLD : isSpeakerMem ? '#D4854A' : 'rgba(255,255,255,0.4)';
                  return (
                    <div key={mem.id} className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.03)', border: hasHand ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 relative"
                        style={{ background: avatarBg, color: avatarColor }}>
                        {(mem.user_name || '?')[0].toUpperCase()}
                        {hasHand && <span className="absolute -top-1 -right-1 text-[10px]">✋</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-white font-semibold truncate">{mem.user_name}{isMe ? ' (you)' : ''}</p>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {isHostMem ? '👑 Host' : isCoHostMem ? '🎙 Co-host' : isSpeakerMem ? '🎤 Panel' : '👁 Audience'}
                        </p>
                      </div>
                      {canManage && !isMe && !isHostMem && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {isOnStage ? (
                            <button onClick={() => demoteToAudience(mem)}
                              className="text-[11px] px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(255,68,68,0.08)', color: '#FF6666', border: '1px solid rgba(255,68,68,0.2)', ...T }}>
                              Remove
                            </button>
                          ) : (
                            <>
                              <button onClick={() => promoteSpeaker(mem)}
                                className="text-[11px] px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(212,133,74,0.1)', color: '#D4854A', border: '1px solid rgba(212,133,74,0.25)', ...T }}>
                                Panel
                              </button>
                              <button onClick={() => promoteCoHost(mem)}
                                className="text-[11px] px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(212,175,55,0.08)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', ...T }}>
                                Co-host
                              </button>
                            </>
                          )}
                          <button onClick={() => kickMember(mem)}
                            className="text-[11px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(192,57,43,0.08)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.2)', ...T }}
                            title="Remove from broadcast">
                            Kick
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {members.length === 0 && (
                  <p className="text-center text-[10px] py-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    No panelists yet — share the invite link!
                  </p>
                )}
              </div>
            )}

            {/* 🛡 HOST / CO-HOST MANAGEMENT */}
            {activeTab === 'manage' && canManage && (
              <div className="p-2 space-y-3">
                <HostControls isHost={canManage} party={party} onUpdate={setHostSettings} />

                {/* Stream goal */}
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Stream Goal</p>
                  <LiveGoalWidget memberCount={members.length} tipTotal={tipTotal} subCount={0} />
                </div>

                {/* Pinned message */}
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>📌 Pinned Message</p>
                  {pinnedMessage ? (
                    <div className="rounded-lg p-2 mb-2 flex items-start gap-2" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                      <span className="text-[10px] flex-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{pinnedMessage}</span>
                      <button onClick={() => setPinnedMessage(null)}
                        style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, lineHeight: 1 }}>×</button>
                    </div>
                  ) : (
                    <p className="text-[11px] mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>No pinned message</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      placeholder="Pin a message for all viewers…"
                      maxLength={200}
                      onKeyDown={e => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { setPinnedMessage(e.currentTarget.value.trim()); e.currentTarget.value = ''; } }}
                      style={{ flex: 1, height: 28, padding: '0 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}
                    />
                    <button
                      onClick={e => { const inp = e.currentTarget.previousSibling; if (inp?.value?.trim()) { setPinnedMessage(inp.value.trim()); inp.value = ''; } }}
                      style={{ height: 28, padding: '0 10px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 6, color: GOLD, fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, cursor: 'pointer' }}>
                      📌
                    </button>
                  </div>
                </div>

                {/* Video source changer */}
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Video Source</p>
                  <VideoSourcePicker
                    isHost={isHost}
                    isCoHost={isCoHost}
                    onSelect={src => {
                      const safeManageUrl = isSafeUrl(src.url) ? src.url : '';
                      base44.entities.WatchParty.update(party.id, {
                        video_url: safeManageUrl,
                        video_type: src.type === 'youtube' ? 'youtube' : 'direct',
                        current_time: 0,
                        playback_state: 'paused',
                        updated_at_ms: Date.now(),
                      }).then(() => {
                        qc.invalidateQueries(['broadcast-party', partyId]);
                        setStudioMode('watch');
                        toast.success('Video updated!');
                      }).catch(() => toast.error('Failed to update video.'));
                    }}
                  />
                </div>

                {/* Danger zone */}
                {isHost && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.15)' }}>
                    <p className="text-[11px] font-black uppercase mb-2" style={{ color: '#FF6680', ...T }}>End Broadcast</p>
                    <button onClick={() => endMut.mutate()}
                      className="w-full py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1"
                      style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', color: '#C0392B', ...T }}>
                      <LogOut className="w-3.5 h-3.5" /> End Broadcast for Everyone
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 🎙 GUEST QUEUE */}
            {activeTab === 'queue' && canManage && (
              <div className="p-2">
                <GuestQueue roomId={partyId} isHost={canManage} />
              </div>
            )}

            {/* 🎚 AUDIO MIXER TAB */}
            {activeTab === 'audio' && canStream && (
              <div className="p-3 space-y-3">
                {/* In-room camera + mic device switcher */}
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Devices</p>
                  <CameraDeviceSelector
                    compact
                    currentVideoId={activeVideoId}
                    currentAudioId={activeAudioId}
                    onVideoChange={(id) => { replaceVideoDevice(id); try { if (id) localStorage.setItem('swl_pref_cam', id); } catch {} }}
                    onAudioChange={(id) => { replaceAudioDevice(id); try { if (id) localStorage.setItem('swl_pref_mic', id); } catch {} }}
                    onScreenShare={toggleScreenShare}
                    isSharingScreen={screenEnabled}
                  />
                  {/* Audio output (speaker) selector — Chrome/Edge only */}
                  {speakers.length > 1 && (
                    <div className="mt-2 flex items-center gap-2"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '8px 12px' }}>
                      <span className="text-xs shrink-0" style={{ color: GOLD }}>🔊</span>
                      <select
                        value={prefSpeaker}
                        onChange={e => {
                          const id = e.target.value;
                          setPrefSpeaker(id);
                          try { if (id) localStorage.setItem('swl_pref_speaker', id); } catch {}
                        }}
                        style={{ flex: 1, background: 'transparent', border: 'none', color: prefSpeaker ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif', outline: 'none', cursor: 'pointer' }}>
                        <option value="" style={{ background: '#080B18' }}>Default speakers</option>
                        {speakers.map(s => (
                          <option key={s.deviceId} value={s.deviceId} style={{ background: '#080B18', color: '#fff' }}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {/* Audio processing toggles */}
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Audio Processing</p>
                  {[
                    { label: 'Noise Suppression', state: noiseSupp, set: setNoiseSupp },
                    { label: 'Echo Cancellation', state: echoCan, set: setEchoCan },
                    { label: 'Auto Gain Control', state: autoGain, set: setAutoGain },
                  ].map(({ label, state, set }) => (
                    <button key={label} onClick={() => set(v => !v)}
                      className="w-full flex items-center justify-between py-1.5 px-0"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</span>
                      <div className="w-8 h-4 rounded-full relative transition-colors shrink-0"
                        style={{ background: state ? 'rgba(109,191,126,0.6)' : 'rgba(255,255,255,0.12)', border: `1px solid ${state ? 'rgba(109,191,126,0.8)' : 'rgba(255,255,255,0.15)'}` }}>
                        <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                          style={{ background: state ? '#6DBF7E' : 'rgba(255,255,255,0.35)', left: state ? 'calc(100% - 14px)' : '2px' }} />
                      </div>
                    </button>
                  ))}
                  <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Disable if using professional hardware/software processing
                  </p>
                </div>
                <EnhancedAudioMixer
                  micMuted={!audioEnabled}
                  onMicToggle={handleToggleAudio}
                  onAudioSettingsChange={() => {}}
                  stream={localStream}
                />
                <SoundboardWidget isVisible={true} disabled={false} />
              </div>
            )}

            {/* 🤖 AI HUB TAB */}
            {activeTab === 'ai' && (
              <div className="flex flex-col h-full">
                {/* Sub-tab nav */}
                <div className="flex gap-0 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {[
                    { id: 'music',    icon: '🎵', label: 'Music' },
                    { id: 'copilot',  icon: '🤖', label: 'Copilot' },
                    { id: 'guardian', icon: '🛡️', label: 'Guard' },
                    { id: 'director', icon: '🎬', label: 'Director' },
                    { id: 'summary',  icon: '📊', label: 'Summary' },
                    { id: 'clips',    icon: '✂️',  label: 'Clips' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setAiSubTab(t.id)}
                      className="flex-1 py-2 flex flex-col items-center gap-0.5 transition-all"
                      style={{
                        background: aiSubTab === t.id ? 'rgba(212,175,55,0.1)' : 'transparent',
                        borderBottom: aiSubTab === t.id ? `2px solid ${GOLD}` : '2px solid transparent',
                        fontFamily: 'Barlow Condensed, sans-serif',
                      }}>
                      <span style={{ fontSize: 12 }}>{t.icon}</span>
                      <span className="text-[9px] font-black uppercase" style={{ color: aiSubTab === t.id ? GOLD : 'rgba(255,255,255,0.3)' }}>{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* Sub-tab content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">

                  {/* ── MUSIC ── */}
                  {aiSubTab === 'music' && (
                    <div className="space-y-3">
                      {/* Genre picker */}
                      <div className="rounded-xl p-3" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)' }}>
                        <p className="text-[11px] font-black uppercase mb-2" style={{ color: GOLD, ...T }}>Genre</p>
                        <div className="flex flex-wrap gap-1.5">
                          {['Lo-Fi','Trap','Gospel','Afrobeats','R&B','Chill','Hype','Jazz','Soul','Drill'].map(g => (
                            <button key={g}
                              onClick={() => setAiMusicGenre(prev => prev === g ? null : g)}
                              className="px-2 py-0.5 rounded-full text-[11px] font-bold transition-all"
                              style={aiMusicGenre === g
                                ? { background: 'rgba(212,175,55,0.25)', color: GOLD, border: `1px solid rgba(212,175,55,0.5)` }
                                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom prompt */}
                      <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Custom prompt</p>
                        <div className="flex gap-2">
                          <input
                            value={aiMusicPrompt}
                            onChange={e => setAiMusicPrompt(e.target.value)}
                            placeholder="e.g. dark ambient trap beat 90bpm…"
                            maxLength={120}
                            style={{ flex: 1, height: 32, padding: '0 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}
                          />
                        </div>
                      </div>

                      {/* Generate / Mood detect */}
                      <div className="flex gap-2">
                        <button
                          onClick={generateAiTrack}
                          disabled={aiMusicGenerating}
                          className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-1"
                          style={{ background: aiMusicGenerating ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.18)', color: GOLD, border: `1px solid rgba(212,175,55,0.35)`, fontFamily: 'Barlow Condensed, sans-serif', cursor: aiMusicGenerating ? 'not-allowed' : 'pointer' }}>
                          {aiMusicGenerating ? '⏳ Generating…' : '✨ Generate Track'}
                        </button>
                        <button
                          onClick={detectChatMood}
                          disabled={aiMoodDetecting}
                          className="px-3 py-2.5 rounded-xl text-[11px] font-black"
                          title="Detect vibe from chat"
                          style={{ background: 'rgba(212,133,74,0.15)', color: '#D4854A', border: '1px solid rgba(212,133,74,0.3)', fontFamily: 'Barlow Condensed, sans-serif', cursor: aiMoodDetecting ? 'not-allowed' : 'pointer' }}>
                          {aiMoodDetecting ? '⏳' : '🎭 Vibe'}
                        </button>
                      </div>

                      {/* Now playing card */}
                      {aiMusicTrack && (
                        <div className="rounded-xl p-3" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-end gap-[2px]">
                              {[3,5,4,6,3,5,4].map((h, i) => (
                                <div key={i} className="w-[2px] rounded-full animate-pulse"
                                  style={{ height: aiMusicPlaying ? h*2 : 4, background: GOLD, animationDelay: i*0.12+'s', transition: 'height 0.3s' }} />
                              ))}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-black truncate" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>{aiMusicTrack.title}</p>
                              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>{aiMusicTrack.genre} · {aiMusicTrack.bpm} BPM · Key {aiMusicTrack.key}</p>
                            </div>
                            <button onClick={() => setAiMusicPlaying(v => !v)}
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ background: 'rgba(212,175,55,0.2)', border: `1px solid rgba(212,175,55,0.4)`, color: GOLD, fontSize: 14 }}>
                              {aiMusicPlaying ? '⏸' : '▶'}
                            </button>
                          </div>
                          <p className="text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>{aiMusicTrack.description}</p>
                          {/* Volume slider */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Vol</span>
                            <input type="range" min={0} max={100} value={musicVolume}
                              onChange={e => setMusicVolume(+e.target.value)}
                              className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                              style={{ accentColor: GOLD }} />
                            <span className="text-[10px] font-black" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>{musicVolume}%</span>
                          </div>
                          {/* Broadcast to panel badge */}
                          {canManage && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px]" style={{ color: 'rgba(212,133,74,0.8)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                              <span>📡</span>
                              <span>Broadcasting to all {members.length} panel members</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tags row */}
                      {aiMusicTrack?.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {aiMusicTrack.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.6)', border: '1px solid rgba(212,175,55,0.15)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Link to full AI Music Studio */}
                      <a href="/AIMusic" target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>Open AI Music Studio</span>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>→</span>
                      </a>
                    </div>
                  )}

                  {/* ── COPILOT ── */}
                  {aiSubTab === 'copilot' && (
                    <div className="space-y-3">
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
                        <AICopilotSidebar roomId={partyId} isHost={canManage} viewerCount={members.length} />
                      </div>
                      {/* ARIA toggle */}
                      <div className="rounded-xl p-3" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span>🤖</span>
                            <span className="text-[11px] font-black uppercase" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>ARIA Auto-engage</span>
                          </div>
                          <button onClick={() => setAriaEnabled(v => !v)}
                            className="relative w-9 h-5 rounded-full transition-all"
                            style={{ background: ariaEnabled ? GOLD : 'rgba(255,255,255,0.1)' }}>
                            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                              style={{ left: ariaEnabled ? '17px' : '2px' }} />
                          </button>
                        </div>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                          {ariaEnabled ? '✓ Answering chat questions & keeping audience active' : 'Enable ARIA to engage your audience automatically'}
                        </p>
                        {ariaEnabled && (
                          <div className="mt-2 space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {['🎵 Music', '💬 Q&A', '🔥 Hype', '🎁 Gifts'].map((t, i) => (
                                <button key={t} onClick={() => setAriaTopicIdx(i)}
                                  className="text-[11px] px-2 py-0.5 rounded-full font-bold"
                                  style={{
                                    background: ariaTopicIdx === i ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
                                    color: ariaTopicIdx === i ? GOLD : 'rgba(255,255,255,0.35)',
                                    border: ariaTopicIdx === i ? `1px solid rgba(212,175,55,0.4)` : '1px solid rgba(255,255,255,0.08)',
                                    fontFamily: 'Barlow Condensed, sans-serif',
                                  }}>
                                  {t}
                                </button>
                              ))}
                            </div>
                            <div className="space-y-1">
                              {ariaSuggestions.map((s, i) => (
                                <button key={i}
                                  className="w-full text-left text-[11px] px-2 py-1.5 rounded-lg"
                                  style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}
                                  onClick={() => toast.success('ARIA sent: ' + s)}>
                                  💬 {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── GUARDIAN ── */}
                  {aiSubTab === 'guardian' && (
                    <div className="space-y-3">
                      {/* Real AIModeration component */}
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(107,191,126,0.2)' }}>
                        <AIModeration roomId={partyId} isHost={canManage} />
                      </div>

                      {/* Custom blocked words panel */}
                      <div className="rounded-xl p-3" style={{ background: 'rgba(107,191,126,0.06)', border: '1px solid rgba(107,191,126,0.15)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span>🛡️</span>
                            <span className="text-[11px] font-black uppercase" style={{ color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>Guardian AI</span>
                          </div>
                          <button onClick={() => setGuardianEnabled(v => !v)}
                            className="relative w-9 h-5 rounded-full transition-all"
                            style={{ background: guardianEnabled ? '#6DBF7E' : 'rgba(255,255,255,0.1)' }}>
                            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                              style={{ left: guardianEnabled ? '17px' : '2px' }} />
                          </button>
                        </div>
                        <p className="text-[11px] mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                          {guardianEnabled ? '✓ Auto-removing hate speech, spam, and toxic messages' : 'Enable to auto-moderate chat in real time'}
                        </p>
                        {guardianEnabled && (
                          <div className="space-y-2">
                            <div className="flex gap-3 text-center">
                              {[['Blocked', guardianStats.blocked + guardianWords.length], ['Warned', guardianStats.warned], ['Muted', guardianStats.muted]].map(([l, v]) => (
                                <div key={l} className="flex-1">
                                  <div className="text-sm font-black" style={{ color: '#6DBF7E' }}>{v}</div>
                                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>{l}</div>
                                </div>
                              ))}
                            </div>
                            <div>
                              <div className="text-[10px] font-bold uppercase mb-1" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>Blocked words</div>
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {guardianWords.map(w => (
                                  <span key={w} className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full"
                                    style={{ background: 'rgba(107,191,126,0.12)', color: '#6DBF7E', border: '1px solid rgba(107,191,126,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                                    {w}
                                    <button onClick={() => setGuardianWords(ws => ws.filter(x => x !== w))} style={{ lineHeight: 1 }}>×</button>
                                  </span>
                                ))}
                                {guardianWords.length === 0 && (
                                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>None added yet</span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <input
                                  value={guardianWordInput}
                                  onChange={e => setGuardianWordInput(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && guardianWordInput.trim()) {
                                      setGuardianWords(ws => [...new Set([...ws, guardianWordInput.trim().toLowerCase()])]);
                                      setGuardianWordInput('');
                                    }
                                  }}
                                  placeholder="Add word…"
                                  maxLength={30}
                                  style={{ flex: 1, padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(107,191,126,0.2)', borderRadius: 6, color: '#fff', fontSize: 11, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}
                                />
                                <button
                                  onClick={() => {
                                    if (guardianWordInput.trim()) {
                                      setGuardianWords(ws => [...new Set([...ws, guardianWordInput.trim().toLowerCase()])]);
                                      setGuardianWordInput('');
                                    }
                                  }}
                                  style={{ padding: '4px 10px', background: 'rgba(107,191,126,0.15)', border: '1px solid rgba(107,191,126,0.3)', borderRadius: 6, color: '#6DBF7E', fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, cursor: 'pointer' }}>
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── DIRECTOR ── */}
                  {aiSubTab === 'director' && (
                    <div className="space-y-3">
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,133,74,0.2)' }}>
                        <SwanDirectorHUD roomId={partyId} hostId={party?.host_id} onOpenPanel={() => setActiveTab('manage')} />
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'rgba(212,133,74,0.06)', border: '1px solid rgba(212,133,74,0.15)' }}>
                        <p className="text-[11px] font-black uppercase mb-1" style={{ color: '#D4854A', fontFamily: 'Barlow Condensed, sans-serif' }}>Director Mode</p>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>AI-assisted scene switching, layout suggestions, and audience engagement cues — synced across all {members.length} panel slots.</p>
                      </div>
                    </div>
                  )}

                  {/* ── SUMMARY ── */}
                  {aiSubTab === 'summary' && (
                    <div className="space-y-3">
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
                        <AIStreamSummary
                          roomId={partyId}
                          isHost={canManage}
                          streamTitle={party?.title}
                          viewerCount={members.length}
                          elapsedSeconds={elapsed}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── CLIPS ── */}
                  {aiSubTab === 'clips' && (
                    <div className="space-y-3">
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,133,74,0.2)' }}>
                        <ClipGeneratorAI sessionId={partyId} roomId={partyId} creatorId={user?.id} />
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'rgba(212,133,74,0.06)', border: '1px solid rgba(212,133,74,0.15)' }}>
                        <p className="text-[11px] font-black uppercase mb-1" style={{ color: '#D4854A', fontFamily: 'Barlow Condensed, sans-serif' }}>AI Clip Generator</p>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Automatically detects highlight moments and creates shareable clips from your live session.</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* 📢 SHARE TAB */}
            {activeTab === 'share' && (
              <div className="p-3 space-y-3">
                <div className="text-[10px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Share Your Live Session</div>

                {/* Copy link */}
                <div className="flex gap-2">
                  <div className="flex-1 h-9 px-3 flex items-center rounded-xl text-[10px] truncate"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                    {window.location.href}
                  </div>
                  <button onClick={copyLink}
                    className="h-9 px-3 rounded-xl text-[10px] font-black transition-all"
                    style={{ background: linkCopied ? 'rgba(109,191,126,0.2)' : 'rgba(212,175,55,0.15)', color: linkCopied ? '#6DBF7E' : '#D4AF37', border: `1px solid ${linkCopied ? 'rgba(109,191,126,0.3)' : 'rgba(212,175,55,0.3)'}`, fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {linkCopied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>

                {/* Social platforms grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'WhatsApp',  emoji: '💬', color: '#25D366', href: `https://wa.me/?text=${encodeURIComponent('🔴 I\'m LIVE on SeeWhy! Join me → ' + window.location.href)}` },
                    { name: 'Twitter/X', emoji: '🐦', color: '#1DA1F2', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent('🔴 LIVE on SeeWhy LIVE! Join me → ' + window.location.href)}` },
                    { name: 'Facebook',  emoji: '👥', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
                    { name: 'Telegram',  emoji: '✈️', color: '#2AABEE', href: `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('🔴 Join me LIVE on SeeWhy!')}` },
                    { name: 'Instagram', emoji: '📸', color: '#E1306C', href: null, note: 'Copy link → paste in story' },
                    { name: 'TikTok',    emoji: '🎵', color: '#000000', href: null, note: 'Copy link → paste in bio' },
                  ].map(p => (
                    <button key={p.name}
                      onClick={() => p.href ? window.open(p.href, '_blank', 'noopener,noreferrer') : copyLink()}
                      className="flex items-center gap-2 p-2 rounded-xl transition-all text-left"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <span className="text-base">{p.emoji}</span>
                      <div>
                        <div className="text-[10px] font-bold text-white">{p.name}</div>
                        {p.note && <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{p.note}</div>}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Native share if available */}
                {navigator.share && (
                  <button
                    onClick={() => navigator.share({ title: 'Join me LIVE on SeeWhy!', url: window.location.href }).catch(() => {})}
                    className="w-full py-2.5 rounded-xl text-[11px] font-black uppercase"
                    style={{ background: 'linear-gradient(135deg, #800020, #A0003A)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    📱 Share via Phone
                  </button>
                )}

                {/* Embed code */}
                <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[11px] font-bold uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>Embed Code</div>
                  <code className="text-[11px] break-all" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {`<iframe src="${window.location.href}" width="100%" height="600" frameborder="0" allow="camera;microphone"></iframe>`}
                  </code>
                  <button onClick={() => { navigator.clipboard.writeText(`<iframe src="${window.location.href}" width="100%" height="600" frameborder="0" allow="camera;microphone"></iframe>`).catch(() => {}); }}
                    className="mt-1.5 text-[11px] px-2 py-0.5 rounded"
                    style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.15)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Copy Embed
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM CONTROLS ────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-center gap-3 py-2 px-4"
        style={{ background: 'rgba(0,0,0,0.75)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        <div className="relative">
          <motion.button whileTap={{ scale: 0.92 }} onClick={handleToggleAudio}
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
            title={pttActive ? 'PTT active' : audioEnabled ? 'Mute mic (M)' : 'Unmute mic (M)'}
            style={{
              background: isClipping ? 'rgba(192,57,43,0.25)' : pttActive ? 'rgba(109,191,126,0.25)' : audioEnabled ? 'rgba(109,191,126,0.12)' : 'rgba(255,68,68,0.15)',
              border: isClipping ? '1px solid rgba(192,57,43,0.9)' : audioEnabled && isSpeaking ? '1px solid rgba(109,191,126,0.85)' : audioEnabled ? '1px solid rgba(109,191,126,0.3)' : '1px solid rgba(255,68,68,0.4)',
              color: isClipping ? '#C0392B' : pttActive ? '#6DBF7E' : audioEnabled ? '#6DBF7E' : '#C0392B',
              boxShadow: isClipping ? '0 0 0 3px rgba(192,57,43,0.3)' : audioEnabled && isSpeaking ? '0 0 0 3px rgba(109,191,126,0.25)' : 'none',
            }}>
            {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </motion.button>
          {isClipping && (
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase whitespace-nowrap px-1 py-0.5 rounded"
              style={{ background: 'rgba(192,57,43,0.8)', color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>
              CLIP
            </span>
          )}
          {pttActive && !isClipping && (
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase whitespace-nowrap px-1 py-0.5 rounded"
              style={{ background: 'rgba(109,191,126,0.25)', color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>
              PTT
            </span>
          )}
        </div>

        <motion.button whileTap={{ scale: 0.92 }} onClick={toggleVideo}
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
          style={{
            background: videoEnabled ? 'rgba(201,168,76,0.12)' : 'rgba(255,68,68,0.15)',
            border: videoEnabled ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(255,68,68,0.4)',
            color: videoEnabled ? '#C9A84C' : '#C0392B',
          }}>
          {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </motion.button>

        <motion.button whileTap={{ scale: 0.92 }} onClick={toggleScreenShare}
          title={screenEnabled ? 'Stop screen share' : 'Share screen'}
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
          style={{
            background: screenEnabled ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
            border: screenEnabled ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)',
            color: screenEnabled ? '#D4AF37' : 'rgba(255,255,255,0.4)',
          }}>
          <Monitor className="w-4 h-4" />
        </motion.button>

        <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowCameraPicker(true)}
          title="Switch camera / OBS source"
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
          style={{
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.2)',
            color: GOLD,
          }}>
          <Video className="w-4 h-4" />
        </motion.button>

        <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.1)' }} />

        <span className="text-[11px] px-2 py-1 rounded font-black uppercase"
          style={{ background: 'rgba(212,175,55,0.1)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', ...T }}>
          {studioMode === 'watch' ? '🎬 Watch' : studioMode === 'live' ? '🎙️ Live' : '⚡ Hybrid'}
        </span>

        {!canManage && (
          <motion.button whileTap={{ scale: 0.92 }} onClick={sendRaiseHand}
            title="Raise hand to ask to speak"
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
            style={{ background: raisedHands.has(user?.id) ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)', border: raisedHands.has(user?.id) ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)', color: raisedHands.has(user?.id) ? GOLD : 'rgba(255,255,255,0.4)' }}>
            <Hand className="w-4 h-4" />
          </motion.button>
        )}

        <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.1)' }} />


        {isHost&&(<button onClick={vodRecording?stopRecording:startRecording}
          style={{display:'flex',alignItems:'center',justifyContent:'center',width:44,height:44,minWidth:44,minHeight:44,borderRadius:12,cursor:'pointer',
            background:vodRecording?'rgba(192,57,43,0.18)':'rgba(255,255,255,0.05)',
            border:vodRecording?'1px solid rgba(192,57,43,0.5)':'1px solid rgba(255,255,255,0.1)',
            color:vodRecording?'#C0392B':'rgba(255,255,255,0.4)',fontSize:14}}>
          {vodRecording?'⏹':'⏺'}</button>)}
        {vodRecording&&(<span style={{fontSize:11,fontWeight:900,color:'#C0392B',fontFamily:'Barlow Condensed,sans-serif'}}>{formatDuration(vodDuration)}</span>)}
        {isHost&&(<button onClick={()=>triggerHighlightClip(1)}
          title="Save clip marker now (C)"
          style={{display:'flex',alignItems:'center',justifyContent:'center',width:44,height:44,minWidth:44,minHeight:44,borderRadius:12,cursor:'pointer',
            background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.3)',color:GOLD,fontSize:14}}>
          🎬</button>)}
        {!vodRecording&&vodBlobUrl&&(<button onClick={()=>downloadRecording(party?.title?`${party.title.slice(0,40)}.webm`:'recording.webm')}
          title="Download recording"
          style={{display:'flex',alignItems:'center',justifyContent:'center',width:44,height:44,minWidth:44,minHeight:44,borderRadius:12,cursor:'pointer',
            background:'rgba(109,191,126,0.15)',border:'1px solid rgba(109,191,126,0.4)',color:'#6DBF7E',fontSize:13}}>
          ⬇</button>)}
        {!isHost ? (
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => { window.location.href = '/'; }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase"
            style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', color: '#C0392B', ...T }}>
            <PhoneOff className="w-3.5 h-3.5" /> Leave
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => endMut.mutate()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase"
            style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', color: '#C0392B', ...T }}>
            <PhoneOff className="w-3.5 h-3.5" /> End Broadcast
          </motion.button>
        )}
      </div>

      {showCameraPicker && (
        <CameraSourcePicker
          currentStream={localStream}
          onSelect={(stream, meta) => {
            // Release picker's own acquired stream tracks
            stream?.getVideoTracks().forEach(t => t.stop());
            if (meta?.deviceId) {
              // replaceVideoDevice updates localStream state; useWebRTCPeers auto-replaces
              // sender tracks when localStream changes
              replaceVideoDevice(meta.deviceId);
              try { localStorage.setItem('swl_pref_cam', meta.deviceId); } catch {}
            }
            setShowCameraPicker(false);
          }}
          onClose={() => setShowCameraPicker(false)}
        />
      )}

      
      {partyId && (
        <LoveHearts roomId={partyId} currentUser={user} creatorId={party?.host_id} />
      )}

      <GiftShop
        isOpen={giftOpen}
        onClose={() => setGiftOpen(false)}
        roomId={partyId}
        user={user}
        creatorId={party?.host_id}
        creatorName={party?.host_name || 'Creator'}
        onGiftSent={(gift, sender) => {
          const senderName = sender?.full_name || sender?.email || 'You';
          const amount = gift?.price || 0;
          setGiftEvent({ id: Date.now(), gift, senderName });
          setSuperchats(prev => [...prev, { id: Date.now(), senderName, amount, emoji: gift?.emoji }]);
          if (amount > 0) setTipTotal(prev => prev + amount);
          setGiftOpen(false);
        }}
      />

      <GiftAnimation event={giftEvent} onDone={() => setGiftEvent(null)} />
      <SwanAIRecommendations roomId={partyId} currentLayout="studio" viewerCount={members.length} />
      <MilestoneAlerts userId={user?.id} roomId={partyId} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {party?.host_id && <ShopDashboard creatorId={party.host_id} />}
      {partyId && <ZEGOGuestApprovalPanel roomId={partyId} isHost={isHost} />}
      {partyId && <ZEGOStreamHealthCard roomId={partyId} />}
      {user && <ZEGOConfigPanel user={user} />}
      {partyId && <RealtimeLeaderboard roomId={partyId} creatorId={party?.host_id || user?.id} />}
      {partyId && <LiveTranscription isLive={true} roomId={partyId} stream={localStream} />}
      {partyId && <ViewerControlsPanel roomId={partyId} currentUser={user} onClose={() => {}} />}
      {partyId && user?.id && <VirtualCurrencyTips roomId={partyId} creatorId={party?.host_id || user?.id} currentUser={user} isHost={isHost} />}
      {partyId && <GoldenWall roomId={partyId} />}
      {isHost && partyId && <StreamerGoalsWidget creatorId={party?.host_id || user?.id} roomId={partyId} isCreator={isHost} embedded={true} />}
      {isHost && partyId && <PayPerViewManager roomId={partyId} />}
      {isHost && partyId && <MonetizationDashboard roomId={partyId} />}
      {partyId && <GiftShopTray roomId={partyId} currentUser={user} />}
      {partyId && <GiftLeaderboard roomId={partyId} />}
      {isHost && <SubscriptionManager creatorId={party?.host_id || user?.id} />}
      {partyId && <TipAlert roomId={partyId} recipientId={party?.host_id || user?.id} />}
      {!isHost && partyId && <TippingModal isOpen={showTippingModal} onClose={() => setShowTippingModal(false)} recipient={{ id: party?.host_id }} roomId={partyId} />}
      {partyId && <LiveAuctionWidget creatorId={party?.host_id || user?.id} roomId={partyId} isCreator={isHost} currentUser={user} />}
      <MerchWidget />
      <NotificationBell />
      {partyId && <PKBattleInterface roomId={partyId} />}
      {partyId && <CoStreamPanel roomId={partyId} />}
      {isHost && partyId && <CollaborativeWhiteboard roomId={partyId} />}
      {partyId && user?.id && <PointsEarnWidget userId={user.id} creatorId={party?.host_id || user?.id} roomId={partyId} isHost={isHost} />}
      {isHost && partyId && <RedemptionQueue creatorId={party?.host_id || user?.id} roomId={partyId} />}
      {partyId && <RewardShop creatorId={party?.host_id || user?.id} roomId={partyId} currentUser={user} />}
      {!isHost && user?.id && <ViewerLoyaltyCard userId={user.id} creatorId={party?.host_id || user?.id} compact={true} />}
      {partyId && <GreenroomQueue roomId={partyId} isHost={isHost} />}
      {isHost && <StreamingPresets onApply={(p) => reacquireMedia({ resolution: p.resolution })} />}
      {partyId && <EmbedPlayer roomId={partyId} creatorName={user?.full_name || ''} streamTitle={party?.title || 'Live Stream'} viewerCount={members.length} />}
      <LiveTranslationWidget chatMessage={chatMessages[chatMessages.length - 1]?.content || null} onTranslation={() => {}} />
      {isHost && user?.id && <RecordingManager userId={user.id} />}
      {isHost && <OBSBridge />}
      <ZEGOMobileAppBanner />
      {isHost && partyId && <AutomatedClipGenerator streamSession={{room_id: partyId}} isLive={partyId != null} />}
      {partyId && <InteractivePollWidget roomId={partyId} isHost={isHost} />}
      {isHost && <StreamMetadataEditor initialTitle={party?.title || 'Live Stream'} initialCategory={'entertainment'} />}
      {isHost && <StreamerMonetizationCenter />}
      {!isHost && partyId && <AnimatedGiftShop recipientId={party?.host_id || user?.id} roomId={partyId} onClose={() => {}} />}
      {isHost && user?.id && <VirtualGoodsStore userId={user.id} />}
      {isHost && <SoundAlertsManager creatorId={party?.host_id || user?.id} />}
      <ShareToSocial content={{text: ''}} />
      {isHost && partyId && user?.id && <VideoShortRecorder roomId={partyId} creatorId={user.id} />}
      {isHost && <BroadcastAnalyticsDashboard streamSession={partyId ? { room_id: partyId, title: party?.title } : null} isLive={partyId != null} />}
      {isHost && partyId && <AutomatedHighlightReels streamSession={{room_id: partyId}} />}
      {partyId && <PerformanceDashboard roomId={partyId} sessionId={partyId} />}
      <StreamHealthDashboard isLive={partyId != null} />
      {!isHost && partyId && <QuickTip recipientId={party?.host_id || user?.id} recipientName={''} onTipSent={() => {}} />}
      {isHost && <LowerThirdsBanner onBannerChange={() => {}} />}
      {isHost && <SceneSwitcher activeScene={activeScene} onSceneChange={(s) => { setActiveScene(s); if ((s === 'screen' || s === 'pip') && !screenEnabled) setScreenEnabled(true); else if (s === 'camera' && screenEnabled) setScreenEnabled(false); }} />}
      <NotificationHub />
      {isHost && <SoundboardWidget isVisible={true} />}
      {isHost && partyId && <RaidPanelButton room={party} currentUser={user} isHost={isHost} />}
      {partyId && <LiveAudiencePulse roomId={partyId} isHost={isHost} viewerCount={members.length} />}
      {partyId && <StreamAnalyticsDashboard roomId={partyId} />}
      {isHost && partyId && <AIStreamSummary roomId={partyId} isHost={isHost} streamTitle={party?.title || ''} viewerCount={members.length} elapsedSeconds={elapsed} />}
      {isHost && <ChatModeration collapsed={true} />}
      <BrandChyron />
      {!isHost && partyId && user?.id && <WhisperPanel roomId={partyId} currentUser={user} recipientId={party?.host_id || user?.id} recipientName={''} onClose={() => {}} />}
      <HostAlertCenter />
      {partyId && <AICopilotSidebar roomId={partyId} isHost={isHost} viewerCount={members.length} />}
      {isHost && partyId && <EnhancedPollingSystem roomId={partyId} hostId={party?.host_id || user?.id} isHost={isHost} />}
      {partyId && user?.id && <SuperChatBar roomId={partyId} currentUser={user} recipientId={party?.host_id || user?.id} recipientName={''} />}
      {user?.id && <SwanyBotEnhanced userId={user.id} conversationId={null} onContextReady={() => {}} />}
      {isHost && <LocalVideoTile stream={localStream} audioEnabled={audioEnabled} videoEnabled={videoEnabled} userName={user?.full_name || ''} isHost={isHost} isSpeaking={isSpeaking} />}
      {isHost && <OctagonalVideoWindow title={'My Camera'} isMuted={!audioEnabled} isVideoOff={!videoEnabled} onMicToggle={handleToggleAudio} onVideoToggle={toggleVideo} />}
      {isHost && <AudioPanel micMuted={!audioEnabled} onMicToggle={handleToggleAudio} participants={members} />}
      {isHost && <EvmuxWebSource isActive={false} onClose={() => {}} />}
      {partyId && <LivePollOverlay roomId={partyId} currentUser={user} isHost={isHost} position={'bottom-left'} />}
      {isHost && <StripeConnectButton creatorId={party?.host_id || user?.id} />}
      {!isHost && user?.id && <StripeSubscribeButton creatorId={party?.host_id || user?.id} creatorName={''} currentUserId={user.id} />}
      {<SubscriptionTiers communityId={null} userId={user?.id} />}
      {party && <WatchPartyAnalytics party={party} members={members} pollCount={0} reactionCount={0} />}
      {partyId && user?.id && <ZEGOGuestJoin roomId={partyId} userId={user.id} userName={user?.full_name || ''} onJoined={() => {}} />}
      {partyId && <PaymentMethodSelector creatorId={party?.host_id || user?.id} roomId={partyId} onPaymentComplete={() => {}} />}
      {isHost && <CreatorTierManager creatorId={party?.host_id || user?.id} />}
      {user?.id && <TierBadge tier={null} size={'sm'} showName={false} />}
      {user?.id && <LoyaltyBadge userId={user.id} creatorId={party?.host_id || user?.id} />}
      {partyId && <GuestGrid participants={members} isHost={isHost} onInvite={() => {}} hostId={user?.id} />}
      {isHost && partyId && <EnhancedRoomControls isHost={isHost} roomData={party} micMuted={!audioEnabled} onMicToggle={handleToggleAudio} onAudioSettingsChange={() => {}} />}
      <CollabPlaylist isHost={isHost} currentUser={user} onPlayVideo={() => {}} />
      <YouTubeDiscovery />
      <ActivitySidebar isOpen={showActivitySidebar} onClose={() => setShowActivitySidebar(false)} />
      <GlobalSearch onClose={() => {}} />
      {partyId && <PayPerViewGate roomId={partyId} ppvPrice={4.99} onPurchase={() => {}} />}
      <PaywallGate isHost={isHost} streamTitle={party?.title || ''} onUnlock={() => {}} isUnlocked={true} />
      {partyId && <SubscriptionGate creatorId={party?.host_id || user?.id} roomId={partyId} />}
      {partyId && <ModerationAppealPanel flagId={null} messageId={null} roomId={partyId} onClose={() => {}} />}
      {isHost && user?.id && <GuestDestinationsPanel participantUserId={user.id} guestName={user?.full_name || ''} />}
      {isHost && <GuestStreamingPermissions participant={null} isHost={isHost} onUpdate={() => {}} />}
      {isHost && partyId && <MultiStreamConfig roomId={partyId} isHost={isHost} />}
      {partyId && <VdoNinjaGuestLink roomId={partyId} />}
      <WebRTCSetupBanner error={mediaError} audioEnabled={audioEnabled} videoEnabled={videoEnabled} onRetry={reacquireMedia} />
      {isHost && partyId && <WebhookHooks roomId={partyId} isHost={isHost} />}
      {isHost && <PKBattleSoundboard battleId={partyId} isBattleActive={partyId != null} />}
      <PanelMusicPlayer />
      {isHost && partyId && <PollLaunchBar roomId={partyId} hostId={user?.id} activePoll={null} isHost={isHost} />}
      {party && <PreStreamCountdown room={party} currentUser={user} onGoLive={() => { if (isHost && partyId) base44.entities.WatchParty.update(partyId, { status: 'live' }).catch(() => {}); }} />}
      <PrivatePanel isHost={isHost} currentUser={user} />
      {partyId && <StreamChatbot roomId={partyId} isHost={isHost} elapsedSeconds={elapsed} hostName={user?.full_name || ''} room={party} />}
      {partyId && <StreamEventBus roomId={partyId} isHost={isHost} sessionId={partyId} onViewerUpdate={setBusViewerCount} onTipReceived={msg => setTipTotal(t => t + Math.floor(msg?.tip_amount || 0))} onMessageReceived={() => {}} />}
      {partyId && <TippingOverlay roomId={partyId} creatorId={party?.host_id || user?.id} isVisible={true} />}
      {partyId && <UnifiedChat roomId={partyId} currentUser={user} isHost={isHost} />}
      {isHost && partyId && <AIPersonaCustomizer roomId={partyId} sessionId={partyId} onCustomized={() => {}} />}
      {isHost && <AudioMixer micMuted={!audioEnabled} onMicToggle={handleToggleAudio} />}
      {isHost && <EnhancedAudioMixer micMuted={!audioEnabled} onMicToggle={handleToggleAudio} onAudioSettingsChange={() => {}} stream={localStream} />}
      {isHost && <ScreenSharePanel isSharing={screenEnabled} onStartShare={toggleScreenShare} onStopShare={toggleScreenShare} />}
      {partyId && <AuraEmotionDisplay roomId={partyId} sessionId={partyId} auraPersona={'hype'} />}
      {partyId && <BattleScoreboard roomId={partyId} />}
      {partyId && user?.id && <EnhancedStreamChat roomId={partyId} userId={user.id} userName={user?.full_name || ''} userRole={isHost ? 'host' : 'viewer'} />}
      <GlobalChatWidget />
      {isHost && partyId && <GuestConnector roomId={partyId} roomName={''} />}
      {partyId && <InteractivePollingSystem roomId={partyId} isHost={isHost} currentUser={user} />}
      {partyId && <LeaderboardPanel roomId={partyId} />}
      {partyId && <MobileStreamControls micMuted={!audioEnabled} onMicToggle={handleToggleAudio} onReact={() => {}} onQuickTip={() => {}} roomId={partyId} />}
      {user?.id && <PointsNotification userId={user.id} />}
      {partyId && user?.id && <EngagementBadgesDisplay roomId={partyId} userId={user.id} creatorId={party?.host_id || user?.id} />}
      {partyId && <ChatOverlay roomId={partyId} isVisible={true} />}
      {partyId && <BattleMode roomId={partyId} isHost={isHost} hostName={user?.full_name || ''} />}
      {isHost && <BitratePresets selected={selectedBitrate} onChange={handleBitrateChange} />}
      {isHost && user?.id && <GuestRTMPPanel participantId={user.id} userId={user.id} />}
      {isHost && <GuestStreamMonitor guestName={user?.full_name || ''} isStreaming={partyId != null} />}
      {partyId && <TranscriptionPanel recordingUrl={''} roomTitle={''} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={isHost} currentTips={tipTotal} currentSubs={subCount} currentViewers={Math.max(busViewerCount, members.length)} />
      <ViewerCount count={Math.max(busViewerCount, members.length)} peakViewers={peakViewers} />
      {isHost && partyId && user?.id && <ClipCreator roomId={partyId} creatorId={user.id} streamTitle={party?.title || ''} elapsedSeconds={elapsed} currentUser={user} />}
      {isHost && partyId && user?.id && <StreamHighlightCapture roomId={partyId} sessionId={partyId} creatorId={user.id} elapsedSeconds={elapsed} isHost={isHost} />}
      {isHost && partyId && <QuickPollLauncher roomId={partyId} hostId={user?.id} isHost={isHost} />}
      {!isHost && partyId && party?.host_id && <GiftTray roomId={partyId} currentUser={user} recipientId={party.host_id} />}
      {isHost && party && <RoomBrandingEditor roomData={party} onBrandingChange={(b) => { if (party?.id) base44.entities.WatchParty.update(party.id, b).catch(() => {}); }} isHost={isHost} />}
      <BackgroundCustomizer />

      <NetworkQualityBanner quality={netQuality} rtt={netRtt} />

      <KeyboardShortcutsHelp shortcuts={[
        { key: 'M',     label: 'Toggle microphone' },
        { key: 'V',     label: 'Toggle camera' },
        { key: 'S',     label: 'Start / stop screen share' },
        { key: 'C',     label: 'Save highlight clip (host)' },
        { key: 'Space', label: 'Push-to-talk (hold when muted)' },
        { key: '?',     label: 'Show keyboard shortcuts' },
      ]} />
      {!isHost && partyId && user && <TipWidget roomId={partyId} hostId={party?.host_id} currentUser={user} />}
      <InviteSheet isOpen={showInviteSheet} onClose={() => setShowInviteSheet(false)} roomId={partyId} roomTitle={party?.title || ''} isHost={isHost} isCoHost={false} />
      {partyId && <AuraPanel roomId={partyId} isHost={isHost} streamTitle={party?.title || ''} viewerCount={members.length} isLive={partyId != null} userTier="free" />}
      {isHost && <GuestControls
        participants={members}
        onMuteGuest={(id) => base44.entities.WatchPartyMember.update(id, { is_audio_enabled: false }).catch(() => {})}
        onRemoveGuest={(id) => { const m = members.find(mb => mb.id === id); if (m) kickMember(m); }}
      />}
      {isHost && partyId && <StreamHealthMonitor isLive={true} />}
      {isHost && partyId && <BreakoutRoomsModal isOpen={showBreakoutRooms} onClose={() => setShowBreakoutRooms(false)} roomId={partyId} roomTitle={party?.title || ''} currentUser={user} />}
      {isHost && partyId && <CoStreamHub roomId={partyId} isHost={isHost} isCoHost={false} currentUser={user} compact={false} />}
      {isHost && <GreenRoomModal isOpen={showGreenRoomModal} onClose={() => setShowGreenRoomModal(false)} onReady={() => { setShowGreenRoomModal(false); if (partyId) base44.entities.WatchParty.update(partyId, { status: 'live' }).catch(() => {}); }} localStream={localStream} audioEnabled={audioEnabled} />}
      {isHost && party && user && <GreenRoomPreflight isOpen={showPreflight} onClose={() => setShowPreflight(false)} onGoLive={() => { if (partyId) base44.entities.WatchParty.update(partyId, { status: 'live' }).catch(() => {}); }} party={party} user={user} />}
      {isHost && user?.id && <OverlayThemeBuilder creatorId={party?.host_id || user?.id} />}
      {isHost && partyId && user?.id && <ClipCreatorSheet roomId={partyId} sessionId={partyId} creatorId={user.id} elapsedSeconds={elapsed} roomTitle={party?.title || ''} onClose={() => {}} />}
      {isHost && partyId && <AuraPanelDrawer roomId={partyId} hostId={party?.host_id || user?.id} onClose={() => {}} />}
      {partyId && <PKBattle roomId={partyId} isHost={isHost} hostName={user?.full_name || ''} viewerCount={members.length} />}
      {partyId && <PKBattleModal isOpen={showPKBattleModal} onClose={() => setShowPKBattleModal(false)} roomId={partyId} isHost={isHost} currentUser={user} hostName={user?.full_name || ''} />}
      {!isHost && partyId && user && <LoveTap roomId={partyId} user={user} creatorId={party?.host_id || user?.id} creatorName={''} />}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} url={`${window.location.origin}${createPageUrl('BroadcastStudio')}?id=${partyId}`} title={party?.title || ''} />
      <WebRTCConfigModal isOpen={showWebRTCConfig} onClose={() => setShowWebRTCConfig(false)} onApply={() => setShowWebRTCConfig(false)} currentConfig={{}} />
    </div>
  );
}

// ── Picture-in-picture local camera (hybrid mode overlay) ───────────────────
function PipCameraTile({ localStream, videoEnabled }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && localStream) ref.current.srcObject = localStream; }, [localStream]);
  return (
    <div className="absolute bottom-3 right-3 rounded-xl overflow-hidden shadow-xl"
      style={{ width: 120, height: 90, border: '2px solid rgba(212,175,55,0.4)', background: '#000', zIndex: 10 }}>
      {localStream && videoEnabled
        ? <video ref={ref} autoPlay muted playsInline className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <VideoOff className="w-5 h-5" />
          </div>}
      <div className="absolute bottom-1 left-1 text-[7px] px-1 rounded"
        style={{ background: 'rgba(0,0,0,0.6)', color: GOLD, ...T }}>YOU</div>
      <TipGoalBar roomId={null} goal={100} current={0} />
      <TopTippers roomId={null} />
    </div>
  );
}