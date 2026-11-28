import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Radio, LogOut, Copy, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, Monitor, LayoutGrid, FlipHorizontal2,
  Hand,
} from 'lucide-react';
import { isSafeUrl, clampStr, LIMITS } from '@/lib/security';

import { useLocalMedia } from '../hooks/useLocalMedia';
import { useVODRecording, formatDuration } from '../hooks/useVODRecording';
import { useAutoSpeakGate } from '../hooks/useAutoSpeakGate';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
import { useRemoteSpeakingMap } from '../hooks/useRemoteSpeakingMap';
import { useConnectionQuality } from '../hooks/useConnectionQuality';
import { useSubscriptionCount } from '../hooks/useSubscriptionCount';
import PanelGrid from '../components/watchparty/PanelGrid';
import BattleTiers from '../components/watchparty/BattleTiers';
import ViewerRail from '../components/watchparty/ViewerRail';
import GreenroomWaitlistPanel from '../components/greenroom/GreenroomWaitlistPanel';
import VideoSourcePicker, { getYouTubeId, detectVideoType } from '../components/video/VideoSourcePicker';
import PartyReactionsOverlay from '../components/watchparty/PartyReactionsOverlay';
import LiveEmoticonStorm from '../components/watchparty/LiveEmoticonStorm';
import PartyHypeMeter from '../components/watchparty/PartyHypeMeter';
import { useHighlightDetector } from '../hooks/useHighlightDetector';
import { useVoiceAgentRuntime } from '../hooks/useVoiceAgentRuntime';
import CompositorOverlay from '../components/streaming/CompositorOverlay';
import CameraSourcePicker from '../components/streaming/CameraSourcePicker';
import { useCameraDevices } from '../hooks/useCameraDevices';
import LoveHearts from '../components/live/LoveHearts';
import GiftShop from '../components/live/GiftShop';
import GiftAnimation from '../components/live/GiftAnimation';
import ClipMarker from '../components/live/ClipMarker';
import KeyboardShortcutsHelp from '../components/live/KeyboardShortcutsHelp';
import NetworkQualityBanner from '../components/live/NetworkQualityBanner';
import StudioTabContent from '../components/live/StudioTabContent';
import LowLatencyPreviewToggle from '../components/live/LowLatencyPreviewToggle';
import { useLowLatencyPreview } from '../hooks/useLowLatencyPreview';
import StreamMetricsBar from '../components/live/StreamMetricsBar';
import SuperChatRail from '../components/live/SuperChatRail';
import AICopilotSidebar from '../components/live/AICopilotSidebar';
import AIStreamSummary from '../components/live/AIStreamSummary';
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
import TippingModal from '../components/monetization/TippingModal';
import GreenroomQueue from '../components/streaming/GreenroomQueue';
import PointsEarnWidget from '../components/loyalty/PointsEarnWidget';
import InteractivePollWidget from '../components/streaming/InteractivePollWidget';
import StreamMetadataEditor from '../components/streaming/StreamMetadataEditor';
import StreamingPresets from '../components/streaming/StreamingPresets';
import EmbedPlayer from '../components/streaming/EmbedPlayer';
import LiveTranslationWidget from '../components/streaming/LiveTranslationWidget';
import RedemptionQueue from '../components/loyalty/RedemptionQueue';
import RewardShop from '../components/loyalty/RewardShop';
import ViewerLoyaltyCard from '../components/loyalty/ViewerLoyaltyCard';
import PKBattleInterface from '../components/pk/PKBattleInterface';
import CoStreamPanel from '../components/collaboration/CoStreamPanel';
import CollaborativeWhiteboard from '../components/collaboration/CollaborativeWhiteboard';
import TipAlert from '../components/monetization/TipAlert';
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
import PreJoinSettingsModal from '../components/live/PreJoinSettingsModal';
import LiveCaptionOverlay from '../components/live/LiveCaptionOverlay';
import PrivatePanel from '../components/live/PrivatePanel';
import StreamChatbot from '../components/live/StreamChatbot';
import StreamEventBus from '../components/live/StreamEventBus';
import TippingOverlay from '../components/live/TippingOverlay';
import UnifiedChat from '../components/live/UnifiedChat';
import AIPersonaCustomizer from '../components/live/AIPersonaCustomizer';
import AudioMixer from '../components/live/AudioMixer';
import AudioPanel from '../components/live/AudioPanel';
import AuraPanel from '../components/live/AuraPanel';
import MultiStreamConfig from '../components/live/MultiStreamConfig';
import ScreenSharePanel from '../components/live/ScreenSharePanel';
import StreamHighlightCapture from '../components/live/StreamHighlightCapture';
import OBSBridge from '../components/obs/OBSBridge';
import GuestStreamingPermissions from '../components/live/GuestStreamingPermissions';
import LiveTranscription from '../components/live/LiveTranscription';
import VideoShortRecorder from '../components/vod/VideoShortRecorder';
import EnhancedAudioMixer from '../components/live/EnhancedAudioMixer';
import GuestGrid from '../components/live/GuestGrid';
import NewsBlockOverlay from '../components/live/NewsBlockOverlay';
import EnhancedRoomControls from '../components/live/EnhancedRoomControls';
import WebRTCSetupBanner from '../components/live/WebRTCSetupBanner';
import EvmuxWebSource from '../components/live/EvmuxWebSource';
import LivePollOverlay from '../components/live/LivePollOverlay';
import LocalVideoTile from '../components/live/LocalVideoTile';
import OctagonalVideoWindow from '../components/live/OctagonalVideoWindow';
import SwanyBotEnhanced from '../components/guide/SwanyBotEnhanced';
import TipWidget from '../components/live/TipWidget';
import InviteSheet from '../components/live/InviteSheet';
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
import RoomEntryGate from '../components/RoomEntryGate';
import PipCameraTile from '../components/live/PipCameraTile';
import AlertConfig from '../components/live/AlertConfig';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import ShopDashboard from '../components/merch/ShopDashboard';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import ZEGOGuestApprovalPanel from '../components/zego/ZEGOGuestApprovalPanel';
import ZEGOGuestJoin from '../components/zego/ZEGOGuestJoin';
import ZEGOMobileAppBanner from '../components/zego/ZEGOMobileAppBanner';
import ZEGOStreamHealthCard from '../components/zego/ZEGOStreamHealthCard';
import ZEGOConfigPanel from '../components/zego/ZEGOConfigPanel';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import WebhookHooks from '../components/live/WebhookHooks';
import VdoNinjaGuestLink from '../components/live/VdoNinjaGuestLink';
import RealtimeLeaderboard from '../components/live/RealtimeLeaderboard';
import ViewerControlsPanel from '../components/live/ViewerControlsPanel';
import VirtualCurrencyTips from '../components/live/VirtualCurrencyTips';
import RecordingManager from '../components/content/RecordingManager';
import StripeConnectButton from '../components/monetization/StripeConnectButton';
import StripeSubscribeButton from '../components/monetization/StripeSubscribeButton';
import SubscriptionTiers from '../components/monetization/SubscriptionTiers';
import WatchPartyAnalytics from '../components/watchparty/WatchPartyAnalytics';
import PaymentMethodSelector from '../components/monetization/PaymentMethodSelector';
import CreatorTierManager from '../components/subscriptions/CreatorTierManager';
import LoyaltyBadge from '../components/rooms/LoyaltyBadge';
import CollabPlaylist from '../components/watchparty/CollabPlaylist';
import YouTubeDiscovery from '../components/youtube/YouTubeDiscovery';
import ActivitySidebar from '../components/shared/ActivitySidebar';
import GlobalSearch from '../components/shared/GlobalSearch';
import PayPerViewGate from '../components/live/PayPerViewGate';
import PaywallGate from '../components/live/PaywallGate';
import SubscriptionGate from '../components/live/SubscriptionGate';
import ModerationAppealPanel from '../components/live/ModerationAppealPanel';
import ClipCreator from '../components/live/ClipCreator';
import AutomatedClipGenerator from '../components/streaming/AutomatedClipGenerator';
import TierBadge from '../components/subscriptions/TierBadge';
var GOLD = '#D4AF37';
var BG = '#080B18';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };
var OCT = 'polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)';

// ── Video sync engine ────────────────────────────────────────────────────────
function useSyncEngine({ party, isController, onTimeSync }) {
  var qc = useQueryClient();

  var pushState = useCallback(async function(playerState) {
    if (!isController || !(party && party.id)) return;
    try {
      await base44.entities.WatchParty.update(party.id, {
        playback_state: playerState.playing ? 'playing' : 'paused',
        current_time: playerState.currentTime,
        updated_at_ms: Date.now(),
      });
    } catch {}
  }, [isController, (party && party.id)]);

  useEffect(function() {
    if (!(party && party.id)) return;
    var unsub = base44.entities.WatchParty.subscribe(function(event) {
      if (event.id !== party.id) return;
      if (!isController && event.data) onTimeSync(event.data);
      qc.invalidateQueries({ queryKey: ['broadcast-party', party.id] });
    });
    return unsub;
  }, [(party && party.id), isController, onTimeSync, qc]);

  return { pushState };
}

// ── YouTube player ───────────────────────────────────────────────────────────
function YouTubeEmbed({ videoId, isController, syncData, onStateChange }) {
  var iframeRef = useRef(null);
  var playerRef = useRef(null);

  useEffect(function() {
    if (!videoId) return;
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = function() {
      playerRef.current = new window.YT.Player(iframeRef.current, {
        videoId,
        playerVars: { autoplay: 0, controls: isController ? 1 : 0 },
        events: {
          onStateChange: function(e) {
            if (!isController) return;
            var s = e.data;
            if (s === window.YT.PlayerState.PLAYING || s === window.YT.PlayerState.PAUSED) {
              onStateChange({ playing: s === window.YT.PlayerState.PLAYING, currentTime: (playerRef.current && playerRef.current.getCurrentTime()) || 0 });
            }
          },
        },
      });
    };
  }, [videoId]);

  // Push every 3s during playback so viewers stay in sync
  useEffect(function() {
    if (!isController) return;
    var iv = setInterval(function() {
      if (!(playerRef.current && playerRef.current.getPlayerState)) return;
      if (playerRef.current.getPlayerState() === (window.YT && window.YT.PlayerState && window.YT.PlayerState.PLAYING)) {
        onStateChange({ playing: true, currentTime: playerRef.current.getCurrentTime() || 0 });
      }
    }, 3000);
    return function() { clearInterval(iv); };
  }, [isController, onStateChange]);

  useEffect(function() {
    if (isController || !playerRef.current || !syncData) return;
    var lag = Date.now() - (syncData.updated_at_ms || Date.now());
    var adj = (syncData.current_time || 0) + lag / 1000;
    var cur = (playerRef.current.getCurrentTime && playerRef.current.getCurrentTime()) || 0;
    if (Math.abs(cur - adj) > 2 && playerRef.current.seekTo) playerRef.current.seekTo(adj, true);
    if (syncData.playback_state === 'playing' && playerRef.current.playVideo) playerRef.current.playVideo();
    else if (playerRef.current.pauseVideo) playerRef.current.pauseVideo();
  }, [syncData, isController]);

  return <div ref={iframeRef} className="w-full h-full" />;
}

// ── Direct video player ──────────────────────────────────────────────────────
function DirectPlayer({ url, isController, syncData, onStateChange }) {
  var videoRef = useRef(null);

  var handleEvent = function() {
    if (!isController || !videoRef.current) return;
    onStateChange({ playing: !videoRef.current.paused, currentTime: videoRef.current.currentTime });
  };

  useEffect(function() {
    if (!isController) return;
    var iv = setInterval(function() {
      if (!videoRef.current || videoRef.current.paused) return;
      onStateChange({ playing: true, currentTime: videoRef.current.currentTime });
    }, 3000);
    return function() { clearInterval(iv); };
  }, [isController, onStateChange]);

  useEffect(function() {
    if (isController || !videoRef.current || !syncData) return;
    var v = videoRef.current;
    var lag = Date.now() - (syncData.updated_at_ms || Date.now());
    var adj = (syncData.current_time || 0) + lag / 1000;
    if (Math.abs(v.currentTime - adj) > 2) v.currentTime = adj;
    if (syncData.playback_state === 'playing') v.play().catch(function() {});
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

// ── Octagonal avatar thumbnail (audience rail) ───────────────────────────────
function OctAvatarThumb({ name, stream, size = 36 }) {
  var vRef = useRef(null);
  useEffect(function() { if (vRef.current && stream) vRef.current.srcObject = stream; }, [stream]);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, clipPath: OCT, background: 'rgba(212,175,55,0.3)' }} />
      <div style={{ position: 'absolute', inset: 2, clipPath: OCT, background: '#0d0618', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {stream ? (
          <video ref={vRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: size * 0.3, fontWeight: 900, color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {(name || '?')[0].toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Live camera tile (center stage when in 'live' or 'hybrid' mode) ──────────
function NetBars({ bars, rtt }) {
  if (bars == null) return null;
  var color = bars >= 3 ? '#6DBF7E' : bars === 2 ? '#D4AF37' : '#C0392B';
  return (
    <div className="flex items-end gap-0.5" title={rtt != null ? Math.round(rtt) + 'ms RTT' : undefined}>
      {[1, 2, 3, 4].map(function(b) { return (
        <div key={b} style={{ width: 3, height: b * 3 + 2, borderRadius: 1, background: b <= bars ? color : 'rgba(255,255,255,0.15)' }} />
      ); })}
    </div>
  );
}

function LiveCameraTile({ localStream, videoEnabled, screenStream, isSpeaking, netBars, netRtt }) {
  var camRef = useRef(null);
  var pipRef = useRef(null);
  var screenRef = useRef(null);
  var [isPip, setIsPip] = useState(false);
  var [mirrored, setMirrored] = useState(true);
  var pipSupported = typeof document !== 'undefined' && !!document.pictureInPictureEnabled;

  useEffect(function() { if (camRef.current && localStream) camRef.current.srcObject = localStream; }, [localStream]);
  useEffect(function() { if (screenRef.current && screenStream) screenRef.current.srcObject = screenStream; }, [screenStream]);

  var togglePip = useCallback(async function() {
    var el = screenStream ? screenRef.current : camRef.current;
    if (!el) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await el.requestPictureInPicture();
        setIsPip(true);
        el.addEventListener('leavepictureinpicture', function() { setIsPip(false); }, { once: true });
      }
    } catch {}
  }, [screenStream]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center"
      style={isSpeaking ? { boxShadow: 'inset 0 0 0 3px rgba(109,191,126,0.7)' } : undefined}>
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
        style={{ background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.4)', color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B] animate-pulse inline-block mr-0.5" />
        {screenStream ? 'SCREEN' : 'LIVE'}
      </div>
      {/* Mirror toggle + PiP buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        {!screenStream && localStream && videoEnabled && (
          <button onClick={() => setMirrored(function(v) { return !v; })} title={mirrored ? 'Disable mirror' : 'Enable mirror'}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: mirrored ? 'rgba(212,175,55,0.25)' : 'rgba(0,0,0,0.45)', border: '1px solid ' + (mirrored ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.15)') }}>
            <FlipHorizontal2 className="w-3.5 h-3.5" style={{ color: mirrored ? GOLD : 'rgba(255,255,255,0.6)' }} />
          </button>
        )}
        {pipSupported && (localStream || screenStream) && (
          <button onClick={togglePip} title={isPip ? 'Exit Picture-in-Picture' : 'Pop out (Picture-in-Picture)'}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-opacity"
            style={{ background: isPip ? 'rgba(212,175,55,0.25)' : 'rgba(0,0,0,0.45)', border: '1px solid ' + (isPip ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.15)') }}>
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
        <div className="absolute bottom-2 right-2" style={{ width: 80, height: 80 }}>
          <div style={{ position: 'absolute', inset: 0, clipPath: OCT, background: 'rgba(212,175,55,0.5)' }} />
          <div style={{ position: 'absolute', inset: 2, clipPath: OCT, overflow: 'hidden' }}>
            <video ref={camRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create screen ────────────────────────────────────────────────────────────
function CreateScreen({ onSubmit, isPending }) {
  var [title, setTitle] = useState('');
  var [videoUrl, setVideoUrl] = useState('');
  var [mode, setMode] = useState('hybrid');

  var MODES = [
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
            <h1 className="text-4xl font-black uppercase tracking-widest" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
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
            onChange={function(e) { setTitle(e.target.value); }}
            maxLength={120}
            className="h-11 text-white placeholder:text-white/30"
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif' }}
          />

          <div>
            <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Mode</p>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(function(mod) { return (
                <button key={mod.id} onClick={function() { setMode(mod.id); }}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all"
                  style={{
                    background: mode === mod.id ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
                    border: mode === mod.id ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                  <span className="text-xl">{mod.icon}</span>
                  <span className="text-[11px] font-black uppercase" style={{ color: mode === mod.id ? GOLD : 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>{mod.label}</span>
                  <span className="text-[11px] text-center leading-tight" style={{ color: 'rgba(255,255,255,0.25)' }}>{mod.desc}</span>
                </button>
              ); })}
            </div>
          </div>

          {mode !== 'live' && (
            <input
              placeholder="YouTube URL or direct video URL (optional)…"
              value={videoUrl}
              onChange={function(e) { setVideoUrl(e.target.value); }}
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
              fontFamily: 'Barlow Condensed, sans-serif',
            }}
            disabled={!title.trim() || isPending}
            onClick={function() { onSubmit({ title, videoUrl, mode }); }}>
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
  var navigate = useNavigate();
  var [searchParams, setSearchParams] = useSearchParams();
  var partyId = searchParams.get('id');
  var qc = useQueryClient();

  var [entryPassed, setEntryPassed] = useState(false);
  var [studioMode, setStudioMode] = useState('hybrid');
  var [activeTab, setActiveTab] = useState('chat');
  var [leftOpen, setLeftOpen] = useState(true);
  var [theaterMode, setTheaterMode] = useState(false);
  var [syncData, setSyncData] = useState(null);
  var [hostSettings, setHostSettings] = useState({
    chatEnabled: true,
    reactionsEnabled: true,
    guestMicEnabled: true,
    guestVideoEnabled: true,
    battlesEnabled: true,
    maxViewers: 20,
  });
  var [chatMessages, setChatMessages] = useState([]);
  var [elapsed, setElapsed] = useState(0);
  var [aiSubTab, setAiSubTab] = useState('music');
  var [aiMusicGenre, setAiMusicGenre] = useState(null);
  var [aiMusicPlaying, setAiMusicPlaying] = useState(false);
  var [aiMusicTrack, setAiMusicTrack] = useState(null); // { title, genre, mood }
  var [aiMusicGenerating, setAiMusicGenerating] = useState(false);
  var [aiMusicPrompt, setAiMusicPrompt] = useState('');
  var [aiMoodDetecting, setAiMoodDetecting] = useState(false);
  var [guardianEnabled, setGuardianEnabled] = useState(true);
  var [guardianStats, setGuardianStats] = useState({ blocked: 0, warned: 0, muted: 0 });
  var [ariaEnabled, setAriaEnabled] = useState(false);
  var [linkCopied, setLinkCopied]               = useState(false);
  var [inviteSheetOpen, setInviteSheetOpen]     = useState(false);
  var [greenRoomOpen, setGreenRoomOpen]         = useState(false);
  var [tipModalOpen, setTipModalOpen]           = useState(false);
  var [screenSharing, setScreenSharing]         = useState(false);
  var [activeScene, setActiveScene]             = useState('main');
  var [gateComplete, setGateComplete]           = useState(false);
  var [showCameraPicker, setShowCameraPicker] = useState(false);
  var [isExclusive, setIsExclusive] = useState(false);
  var [showPreflight, setShowPreflight] = useState(false);
  var [showGreenRoomModal, setShowGreenRoomModal] = useState(false);
  var [showActivitySidebar, setShowActivitySidebar] = useState(false);
  var [showInviteSheet, setShowInviteSheet] = useState(false);
  var [showShareModal, setShowShareModal] = useState(false);
  var [showBreakoutRooms, setShowBreakoutRooms] = useState(false);
  var [showPKBattleModal, setShowPKBattleModal] = useState(false);
  var [showWebRTCConfig, setShowWebRTCConfig] = useState(false);
  var [showTippingModal, setShowTippingModal] = useState(false);
  var [showEvmux, setShowEvmux] = useState(false);
  var [showViewerControls, setShowViewerControls] = useState(false);
  var [showGiftShop, setShowGiftShop] = useState(false);
  var [showWhisperPanel, setShowWhisperPanel] = useState(false);
  var [showAuraPanelDrawer, setShowAuraPanelDrawer] = useState(false);
  var [showClipCreator, setShowClipCreator] = useState(false);
  var [raidTick, setRaidTick] = useState(0);
  var [goalTick, setGoalTick] = useState(0);
  var [reactEmoji, setReactEmoji] = useState(null);
  var [showSwanPanel, setShowSwanPanel] = useState(false);
  var [showGlobalSearch, setShowGlobalSearch] = useState(false);
  var [showModerationAppeal, setShowModerationAppeal] = useState(false);
  var [selectedBitrate, setSelectedBitrate] = useState(3000);
  var [giftOpen, setGiftOpen] = useState(false);
  var [giftEvent, setGiftEvent] = useState(null);
  var [guardianWords, setGuardianWords] = useState([]);
  var [liveViewers, setLiveViewers] = useState(0);
  var [overlayLayers, setOverlayLayers] = useState([]);
  var [peakViewers, setPeakViewers] = useState(0);
  var [guardianWordInput, setGuardianWordInput] = useState('');
  var [ariaSuggestions] = useState(['What do you think about this topic?', 'Drop a ❤️ if you agree!', 'Questions? Type them below!']);
  var [ariaTopicIdx, setAriaTopicIdx] = useState(0);
  var [musicVolume, setMusicVolume] = useState(70);
  var streamStartRef = useRef(Date.now());
  var [bitratePreset, setBitratePreset] = useState(3000);
  var [tipTotal, setTipTotal] = useState(0);
  var [busViewerCount, setBusViewerCount] = useState(0);
  var [superchats, setSuperchats] = useState([]);
  var [raisedHands, setRaisedHands] = useState(new Set());
  var [slowMode, setSlowMode] = useState(false);
  var [slowModeCooldown, setSlowModeCooldown] = useState(30);
  var [pinnedMessage, setPinnedMessage] = useState(null);

  // Elapsed timer for clip timestamps
  useEffect(function() {
    var iv = setInterval(() => setElapsed(function(s) { return s + 1; }), 1000);
    return function() { clearInterval(iv); };
  }, []);

  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: function() { return base44.auth.me() ; }});

  var { data: party } = useQuery({
    queryKey: ['broadcast-party', partyId],
    queryFn: function() { return base44.entities.WatchParty.filter({ id: partyId }).then(function(r) { return r[0]; }); },
    enabled: !!partyId,
    refetchInterval: 15000,
  });

  var { data: members = [] } = useQuery({
    queryKey: ['broadcast-members', partyId],
    queryFn: function() { return base44.entities.WatchPartyMember.filter({ party_id: partyId, is_active: true }); },
    enabled: !!partyId,
    refetchInterval: 15000,
  });

  var { data: activePoll } = useQuery({
    queryKey: ['active-poll', partyId],
    queryFn: function() { return base44.entities.Poll.filter({ room_id: partyId, status: 'active' }).then(function(r) { return r[0] || null; }); },
    enabled: !!partyId,
    refetchInterval: 5000,
  });
  useEffect(function() { setPeakViewers(function(prev) { return Math.max(prev, members.length); }); }, [members.length]);

  // Real-time roster
  useEffect(function() {
    if (!partyId) return;
    var unsub = base44.entities.WatchPartyMember.subscribe(function(event) {
      if ((event.data && event.data.party_id) !== partyId) return;
      qc.invalidateQueries({ queryKey: ['broadcast-members', partyId] });
    });
    return unsub;
  }, [partyId, qc]);

  // Raised hand subscription
  useEffect(function() {
    if (!partyId) return;
    var unsub = base44.entities.Message.subscribe(function(event) {
      if ((event.data && event.data.room_id) !== partyId) return;
      try {
        var d = JSON.parse((event.data && event.data.content) || '{}');
        if (d.action === 'raise-hand') {
          setRaisedHands(function(prev) { var s = new Set(prev); s.add(d.userId); return s; });
        }
      } catch {}
    });
    return unsub;
  }, [partyId]);

  // Local media — use stored device preferences from RoomEntryGate if available
  var prefCam = (function() { try { return localStorage.getItem('swl_pref_cam') || null; } catch(e) { return null; } })();
  var prefMic = (function() { try { return localStorage.getItem('swl_pref_mic') || null; } catch(e) { return null; } })();
  var { localStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo, replaceVideoDevice, replaceAudioDevice, applyAudioConstraints, activeVideoId, activeAudioId, error: mediaError, reacquire: reacquireMedia } = useLocalMedia({ audio: true, video: true, videoDeviceId: prefCam, audioDeviceId: prefMic });
  var handleBitrateChange = function(b) { setSelectedBitrate(b); reacquireMedia({ resolution: ({1500:'480p',3000:'720p',5000:'1080p',7500:'1080p'})[b]||'720p' }); };

  var vodResult=useVODRecording({streamId:partyId||'',creatorId:user&&user.id||'',title:party&&party.title||'Live Recording',stream:localStream});
  var vodRecording=vodResult.recording,startRecording=vodResult.startRecording,stopRecording=vodResult.stopRecording,vodDuration=vodResult.duration,vodBlobUrl=vodResult.blobUrl,downloadRecording=vodResult.downloadRecording,extractClipBlobUrl=vodResult.extractClipBlobUrl;
  var speakGate=useAutoSpeakGate({stream:localStream,enabled:true});
  var isSpeaking=speakGate.isSpeaking,micLevelVal=speakGate.micLevel,isClipping=speakGate.isClipping;
  // WebRTC peer mesh — uses partyId as the signaling channel room
  var { remoteStreams, peerUserIds, announceJoin, leaveRoom, peersRef } = useWebRTCPeers(partyId, localStream, {
    onPeerStateChange: useCallback(function(peerId, state) {
      if (state === 'disconnected') {
        toast('⚠️ A participant dropped — reconnecting…', { duration: 5000, id: 'peer-' + peerId + '-disc' });
      } else if (state === 'connected') {
        toast.dismiss('peer-' + peerId + '-disc');
        toast.success('✅ Participant reconnected', { duration: 2500 });
      } else if (state === 'failed') {
        toast.error('❌ Peer connection failed — removing from room', { duration: 4000, id: 'peer-' + peerId + '-fail' });
      }
    }, []),
  });

  var remoteSpeakingIds=useRemoteSpeakingMap(remoteStreams,peerUserIds);
  var speakingIds=isSpeaking&&user&&user.id?Object.assign({},remoteSpeakingIds,{[user.id]:true}):remoteSpeakingIds;

  // Connection quality — monitor first connected peer
  var [activePc, setActivePc] = useState(null);
  useEffect(function() {
    var entries = Array.from(peersRef.current.entries());
    var connected = entries.find(function(entry) { return entry[1].pc.connectionState === 'connected'; });
    setActivePc(connected ? connected[1].pc : null);
  }, [remoteStreams]);  
  var { bars: netBars, label: netLabel, rtt: netRtt, quality: netQuality } = useConnectionQuality(activePc, 5000);

  // Low-latency preview — auto-on for mobile networks, lightens our capture and caps guest feeds
  var { enabled: lowLatencyPreview, toggle: toggleLowLatencyPreview, network: previewNetwork } = useLowLatencyPreview({ peersRef, localStream, remoteStreams });

  var subCount = useSubscriptionCount((user && user.id));

  // Warn broadcaster once when connection drops to 1 bar or below
  var lastNetBarsRef = useRef(null);
  useEffect(function() {
    if (netBars === null || netBars === undefined) return;
    if (netBars <= 1 && (lastNetBarsRef.current === null || lastNetBarsRef.current > 1)) {
      toast.warning('Poor network connection — stream quality may be affected');
    }
    lastNetBarsRef.current = netBars;
  }, [netBars]);

  // Adaptive video quality — 3-tier system based on connection bars
  // Tier: 'high' (bars≥3) | 'medium' (bars=2) | 'low' (bars≤1)
  var prefRes = (function() { try { return localStorage.getItem('swl_pref_resolution') || '720p'; } catch (e) { return '720p'; } })();
  var adaptiveTierRef = useRef('high');
  useEffect(function() {
    if (netBars == null || !localStream) return;
    var track = localStream.getVideoTracks()[0];
    if (!track) return;
    // Low-latency preview owns the capture profile while it's on. Clearing the tier
    // here means the adaptive preset is re-applied the moment it's switched off.
    if (lowLatencyPreview) { adaptiveTierRef.current = null; return; }
    var PRESETS = {
      '360p':  { width: 640,  height: 360  },
      '480p':  { width: 854,  height: 480  },
      '720p':  { width: 1280, height: 720  },
      '1080p': { width: 1920, height: 1080 },
    };
    var basePreset = PRESETS[prefRes] || PRESETS['720p'];
    if (netBars <= 1 && adaptiveTierRef.current !== 'low') {
      adaptiveTierRef.current = 'low';
      track.applyConstraints({ width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 12 } }).catch(function() {});
    } else if (netBars === 2 && adaptiveTierRef.current !== 'medium') {
      adaptiveTierRef.current = 'medium';
      track.applyConstraints({ width: { ideal: 854 }, height: { ideal: 480 }, frameRate: { ideal: 20 } }).catch(function() {});
    } else if (netBars >= 3 && adaptiveTierRef.current !== 'high') {
      adaptiveTierRef.current = 'high';
      track.applyConstraints({ ...Object.fromEntries(Object.entries(basePreset).map(function(entry) { return [entry[0], { ideal: entry[1] }]; })), frameRate: { ideal: 30 } }).catch(function() {});
    }
  }, [netBars, localStream, prefRes, lowLatencyPreview]);

  // Per-peer connection quality — Map<userId, {bars, rtt}>
  var [peerQuality, setPeerQuality] = useState(function() { return new Map(); });
  useEffect(function() {
    var interval = setInterval(async function() {
      var qual = new Map();
      for (var [peerId, { pc }] of peersRef.current.entries()) {
        if (pc.connectionState !== 'connected') continue;
        var uid = peerUserIds && peerUserIds.get(peerId);
        if (!uid) continue;
        try {
          var stats = await pc.getStats();
          var totalRtt = 0, cnt = 0;
          stats.forEach(function(r) {
            if (r.type === 'candidate-pair' && r.state === 'succeeded' && r.currentRoundTripTime != null) {
              totalRtt += r.currentRoundTripTime * 1000;
              cnt++;
            }
          });
          var rtt = cnt > 0 ? Math.round(totalRtt / cnt) : null;
          var bars = rtt == null ? 3 : rtt < 80 ? 4 : rtt < 200 ? 3 : rtt < 400 ? 2 : 1;
          qual.set(uid, { bars, rtt });
        } catch {}
      }
      setPeerQuality(qual);
    }, 5000);
    return function() { clearInterval(interval); };
  }, [peerUserIds]); // peersRef is a stable ref — no dep needed

  // Audio output (speaker) preference — applied to all video/audio elements via setSinkId
  var { speakers } = useCameraDevices();
  var [prefSpeaker, setPrefSpeaker] = useState(function() { try { return localStorage.getItem('swl_pref_speaker') || ''; } catch { return ''; } });
  useEffect(function() {
    if (!prefSpeaker) return;
    document.querySelectorAll('video, audio').forEach(function(el) {
      if (typeof el.setSinkId === 'function' && el.sinkId !== prefSpeaker) {
        el.setSinkId(prefSpeaker).catch(function() {});
      }
    });
  }, [prefSpeaker, remoteStreams]);

  // Audio processing toggles — applied to the live audio track without re-acquiring
  var [noiseSupp, setNoiseSupp] = useState(true);
  var [echoCan, setEchoCan] = useState(true);
  var [autoGain, setAutoGain] = useState(true);
  useEffect(function() {
    applyAudioConstraints({ noiseSuppression: noiseSupp, echoCancellation: echoCan, autoGainControl: autoGain });
  }, [noiseSupp, echoCan, autoGain, applyAudioConstraints]);

  // Screen share
  var [screenStream, setScreenStream] = useState(null);
  var [screenEnabled, setScreenEnabled] = useState(false);
  var localStreamRef2 = useRef(localStream);
  useEffect(function() { localStreamRef2.current = localStream; }, [localStream]);

  var toggleScreenShare = useCallback(async function() {
    if (screenEnabled && screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
      setScreenEnabled(false);
      var camTrack = localStreamRef2.current && localStreamRef2.current.getVideoTracks()[0];
      if (camTrack) {
        peersRef.current.forEach(({ pc }) => {
          var sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(camTrack).catch(function() {});
        });
      }
      return;
    }
    try {
      var stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always', frameRate: { ideal: 30 }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: true });
      var screenTrack = stream.getVideoTracks()[0];
      screenTrack.onended = function() {
        setScreenStream(null);
        setScreenEnabled(false);
        var camTrack = localStreamRef2.current && localStreamRef2.current.getVideoTracks()[0];
        if (camTrack) {
          peersRef.current.forEach(({ pc }) => {
            var s = pc.getSenders().find(s2 => s2.track && s2.track.kind === 'video');
            if (s) s.replaceTrack(camTrack).catch(function() {});
          });
        }
      };
      setScreenStream(stream);
      setScreenEnabled(true);
      peersRef.current.forEach(({ pc }) => {
        var sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack).catch(function() {});
      });
    } catch {
      // User cancelled or browser denied — no-op
    }
  }, [screenEnabled, screenStream, peersRef]);
  var announceRef = useRef(announceJoin);
  var leaveRef = useRef(leaveRoom);
  useEffect(function() { announceRef.current = announceJoin; }, [announceJoin]);
  useEffect(function() { leaveRef.current = leaveRoom; }, [leaveRoom]);
  var announcedRef = useRef(false);
  useEffect(function() {
    if (!localStream || !(user && user.id) || announcedRef.current) return;
    announcedRef.current = true;
    if (announceRef.current) announceRef.current(user.id);
  }, [localStream, (user && user.id)]);
  useEffect(() => function() { if (leaveRef.current) leaveRef.current(); }, []);

  var [hypeLevel, setHypeLevel] = useState(0);

  var isHost = (party && party.host_id) === (user && user.id);
  var myMember = members.find(function(m) { return m.user_id === (user && user.id); });
  var isCoHost = (myMember && myMember.role) === 'cohost';
  var isSpeaker = (myMember && myMember.role) === 'speaker';
  var canManage = isHost || isCoHost;
  var canStream = isHost || isCoHost || isSpeaker;

  var _speakingMember = members.find(function(m) { return m.is_audio_enabled && m.user_id !== (user && user.id); });
  var speakingName = (_speakingMember && _speakingMember.user_name) || null;

  function handleToggleAudio() {
    toggleAudio();
    if ((myMember && myMember.id)) {
      base44.entities.WatchPartyMember.update(myMember.id, { is_audio_enabled: !audioEnabled }).catch(function() {});
    }
  }

  var [pttActive, setPttActive] = useState(false);
  var pttWasEnabledRef = useRef(false);

  // Keyboard shortcuts: M = mic, V = camera, S = screen share, C = clip, Space = push-to-talk
  useEffect(function() {
    if (!canStream) return;
    var onDown = function(e) {
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement && document.activeElement.isContentEditable)) return;
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
    var onUp = function(e) {
      if (e.key === ' ') {
        e.preventDefault();
        if (pttActive && !pttWasEnabledRef.current) toggleAudio();
        setPttActive(false);
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return function() { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
   
  }, [canStream, audioEnabled, videoEnabled, screenEnabled, isHost, pttActive]);

  // AI highlight detector — auto-clips when hype + sentiment spike
  var { triggerHighlightClip } = useHighlightDetector({
    partyId,
    roomId: partyId,
    isHost,
    user,
    messages: chatMessages,
    hypeLevel,
    elapsedSeconds: elapsed,
    getClipBlobUrl: extractClipBlobUrl,
  });
  useVoiceAgentRuntime({ chatMessage: chatMessages[chatMessages.length - 1] || null });

  var onTimeSync = useCallback((data) => setSyncData(data), []);
  var { pushState } = useSyncEngine({ party, isController: canManage, onTimeSync });

  // Auto-join as member
  useEffect(function() {
    if (!party || !user) return;
    var mounted = true;
    (async function() {
      try {
        var existing = await base44.entities.WatchPartyMember.filter({ party_id: party.id, user_id: user.id, is_active: true });
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
    return function() { mounted = false; };
  }, [(party && party.id), (user && user.id)]);

  // Leave on unmount
  useEffect(() => function() {
    if (!(party && party.id) || !(user && user.id)) return;
    base44.entities.WatchPartyMember.filter({ party_id: party.id, user_id: user.id, is_active: true })
      .then(ms => ms.forEach(m => base44.entities.WatchPartyMember.update(m.id, { is_active: false, left_at: new Date().toISOString() }).catch(function() {}))).catch(function() {});
  }, [(party && party.id), (user && user.id)]);

  var createMut = useMutation({
    mutationFn: async ({ title, videoUrl, mode }) => {
      var safeUrl = (videoUrl && isSafeUrl(videoUrl)) ? videoUrl : '';
      var type = safeUrl ? detectVideoType(safeUrl) : 'live';
      var p = await base44.entities.WatchParty.create({
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
      if ((user && user.id)) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'room_created',
          title: 'Started broadcast: ' + ((p && p.title) || 'Broadcast Studio'),
        }).catch(function() {});
      }
      window.location.href = window.location.pathname + '?id=' + p.id;
    },
    onError: () => toast.error('Action failed.'),
  });

  var endMut = useMutation({
    mutationFn: () => base44.entities.WatchParty.update(partyId, { status: 'ended' }),
    onSuccess: function() {
      toast.success('Broadcast ended');
      if ((user && user.id)) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'room_ended',
          title: 'Stream ended',
        }).catch(function() {});
      }
      setSearchParams({});
    },
    onError: () => toast.error('Action failed.'),
  });

  // ── AI Music handlers ────────────────────────────────────────────────────
  var generateAiTrack = async function() {
    var prompt = aiMusicPrompt.trim() || (aiMusicGenre ? (aiMusicGenre + ' background music for a live stream') : 'upbeat live stream background music');
    setAiMusicGenerating(true);
    try {
      var result = await base44.integrations.Core.InvokeLLM({
        prompt: 'You are an AI music producer. Generate a background music track description for a live stream.\n' +
          'Genre/Style: ' + (aiMusicGenre || 'Chill') + '\n' +
          'Prompt: "' + prompt + '"\n' +
          'Members on stage: ' + members.length + '\n\n' +
          'Respond with JSON only:\n' +
          '{\n' +
          '  "title": "track title (catchy, 3-5 words)",\n' +
          '  "genre": "genre name",\n' +
          '  "mood": "mood descriptor",\n' +
          '  "bpm": number between 70-140,\n' +
          '  "key": "musical key (e.g. C major)",\n' +
          '  "description": "2-sentence vivid description of the sound",\n' +
          '  "tags": ["tag1","tag2","tag3"]\n' +
          '}'
      });
      var data = JSON.parse(result.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      setAiMusicTrack(data);
      setAiMusicPlaying(true);
      if ((party && party.id)) {
        base44.entities.WatchParty.update(party.id, {
          updated_at_ms: Date.now(),
        }).catch(function() {});
      }
      toast.success('🎵 Now playing: ' + data.title);
    } catch {
      // fallback track on error
      var fallback = { title: (aiMusicGenre || 'Chill') + ' Vibes', genre: aiMusicGenre || 'Chill', mood: 'relaxed', bpm: 90, description: 'Smooth background music for your stream.', tags: ['chill', 'live', 'stream'] };
      setAiMusicTrack(fallback);
      setAiMusicPlaying(true);
    } finally {
      setAiMusicGenerating(false);
    }
  };

  var detectChatMood = async function() {
    if (!(chatMessages && chatMessages.length)) { toast('No chat messages yet'); return; }
    setAiMoodDetecting(true);
    try {
      var snippet = chatMessages.slice(-20).map(function(m) { return m.content; }).join('\n');
      var result = await base44.integrations.Core.InvokeLLM({
        prompt: 'Analyze the vibe of this live stream chat and suggest a music genre.\n' +
          'Chat messages:\n' +
          snippet + '\n\n' +
          'Respond with JSON only: {"genre": "one of: Lo-Fi|Trap|Gospel|Afrobeats|R&B|Chill|Hype|Jazz|EDM|Soul", "mood": "one sentence mood description", "energy": "low|medium|high"}'
      });
      var data = JSON.parse(result.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      setAiMusicGenre(data.genre);
      toast.success('🎵 Chat vibe: ' + data.mood + ' → switching to ' + data.genre);
    } catch {
      toast('Could not analyze chat mood');
    } finally {
      setAiMoodDetecting(false);
    }
  };

  var promoteCoHost = async function(member) {
    try {
      await base44.entities.WatchPartyMember.update(member.id, { role: 'cohost' });
      toast.success(member.user_name + ' promoted to co-host');
      qc.invalidateQueries({ queryKey: ['broadcast-members', partyId] });
    } catch { toast.error('Failed to promote member.'); }
  };

  var promoteSpeaker = async function(member) {
    try {
      await base44.entities.WatchPartyMember.update(member.id, { role: 'speaker' });
      toast.success(member.user_name + ' added to panel');
      qc.invalidateQueries({ queryKey: ['broadcast-members', partyId] });
    } catch { toast.error('Failed to add to panel.'); }
  };

  var demoteToAudience = async function(member) {
    try {
      await base44.entities.WatchPartyMember.update(member.id, { role: 'audience' });
      qc.invalidateQueries({ queryKey: ['broadcast-members', partyId] });
    } catch { toast.error('Failed to update member role.'); }
  };

  var copyLink = function() {
    navigator.clipboard.writeText(window.location.href).then(function() {
      toast.success('Invite link copied!');
      setLinkCopied(true);
      setTimeout(function() { setLinkCopied(false); }, 2000);
    }).catch(() => toast.error('Copy failed.'));
  };

  var kickMember = async function(member) {
    try {
      await base44.entities.WatchPartyMember.update(member.id, { is_active: false, left_at: new Date().toISOString() });
      toast.success(member.user_name + ' removed from broadcast');
      qc.invalidateQueries({ queryKey: ['broadcast-members', partyId] });
    } catch { toast.error('Failed to remove member.'); }
  };

  var sendRaiseHand = async function() {
    if (!partyId || !(user && user.id)) return;
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

  var dismissRaisedHand = function(userId) {
    setRaisedHands(function(prev) { var s = new Set(prev); s.delete(userId); return s; });
  };

  // Build compositor slots from localStream + remoteStreams
  var compositorSlots = React.useMemo(function() {
    var slots = [];
    if (localStream) {
      var roleLabel = isHost ? 'Host' : isCoHost ? 'Co-Host' : isSpeaker ? 'Panel' : 'You';
      slots.push({ stream: localStream, label: (user && user.full_name) || (user && user.email) || ('You (' + roleLabel + ')'), speaking: isSpeaking });
    }
    if (remoteStreams) {
      remoteStreams.forEach(function(stream, peerId) {
        var userId = peerUserIds && peerUserIds.get(peerId);
        var member = members.find(function(m) { return m.user_id === userId; });
        slots.push({ stream, label: (member && member.user_name) || 'Guest' });
      });
    }
    return slots;
  }, [localStream, remoteStreams, peerUserIds, members, user, isSpeaking]);

  // Use spotlight when there are remote peers, otherwise panel layout
  var compositorLayout = (remoteStreams && remoteStreams.size) > 0 ? 'spotlight' : 'panel';

  var compositorOverlay = {
    title: (party && party.title) || 'SeeWhy LIVE',
    subtitle: members.length + ' panelists',
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

  // ── Room entry gate ─────────────────────────────────────────────────────────
  var entryRole = isHost ? 'host' : isCoHost ? 'co-host' : isSpeaker ? 'speaker' : 'viewer';
  if (!entryPassed) {
    return (
      <RoomEntryGate
        role={entryRole}
        user={user}
        onPass={() => setEntryPassed(true)}
        onRoleDowngrade={() => setEntryPassed(true)}
        onExit={() => window.history.back()}
      />
    );
  }

  var safeVideoUrl = isSafeUrl(party.video_url) ? party.video_url : '';
  var ytId = party.video_type === 'youtube' ? getYouTubeId(safeVideoUrl) : null;
  var hasVideo = !!safeVideoUrl;
  var showVideoPlayer = (studioMode === 'watch' || studioMode === 'hybrid') && hasVideo;

  var RIGHT_TABS = [
    { id: 'chat',    label: '💬 Chat',   desc: 'Multilingual' },
    { id: 'battle',  label: '⚔️ Battle', desc: 'PK Tiers' },
    { id: 'polls',   label: '📊 Polls',  desc: 'Live polls' },
    { id: 'viewers', label: '👥 Panel',  desc: 'Manage' },
    ...(canManage ? [{ id: 'manage', label: '🛡 Manage', desc: 'Host tools' }] : []),
    ...(canManage ? [{ id: 'queue',  label: '🎙 Queue',  desc: 'Guest queue' }] : []),
    ...(canStream ? [{ id: 'audio',  label: '🎚 Audio',  desc: 'Mixer' }] : []),
    { id: 'health',  label: '❤️ Health', desc: 'Stream stats' },
    { id: 'ai',    label: '🤖 AI',    desc: 'Music & Mod' },
    { id: 'a11y',  label: '♿ Access', desc: 'Impaired aids' },
    { id: 'share', label: '📢 Share', desc: 'Go Viral' },
  ];

  return (
    <div className={'flex flex-col ' + (theaterMode ? 'fixed inset-0 z-50' : 'h-screen')} style={{ background: BG }}>

      {/* ── FANBASE-STYLE TOP BAR ──────────────────────────────────────────── */}
      <div className="shrink-0" style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>

        {/* Row 1: panel toggle | title + badges | right actions */}
        <div className="flex items-center gap-2 px-3 h-12">
          <button onClick={function() { setLeftOpen(v => !v); }}
            className="w-8 h-8 flex items-center justify-center rounded-xl shrink-0 transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            {leftOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-black text-white truncate" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, letterSpacing: '0.02em' }}>{party.title}</span>
            <span className="shrink-0 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-black uppercase"
              style={{ background: 'rgba(192,57,43,0.18)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />LIVE
            </span>
            {isExclusive && (
              <span className="shrink-0 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-black uppercase"
                style={{ background: 'rgba(212,175,55,0.2)', color: GOLD, border: '1px solid rgba(212,175,55,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                🔐 EXCLUSIVE
              </span>
            )}
            <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full font-black uppercase hidden sm:block"
              style={{ background: 'rgba(212,175,55,0.1)', color: GOLD, border: '1px solid rgba(212,175,55,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              SeeWhy LIVE
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Connection quality */}
            <div className="flex items-end gap-0.5 px-1.5 py-1 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.35)' }}
              title={'Network: ' + netLabel + (netRtt ? (' · ' + netRtt + 'ms') : '')}>
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
            <button onClick={function() { setTheaterMode(v => !v); }}
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
                onSelect={function(src) {
                  var safeSelectUrl = isSafeUrl(src.url) ? src.url : '';
                  base44.entities.WatchParty.update(party.id, {
                    video_url: safeSelectUrl,
                    video_type: src.type === 'youtube' ? 'youtube' : 'direct',
                    current_time: 0,
                    playback_state: 'paused',
                    updated_at_ms: Date.now(),
                  }).then(function() {
                    qc.invalidateQueries({ queryKey: ['broadcast-party', partyId] });
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
                userId={(user && user.id)}
                onScreenCapture={(studioMode === 'watch' || studioMode === 'hybrid') ? async function() {
                  var s = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: true });
                  return s;
                } : undefined}
                isHost={canStream}
              />
            )}
            {canStream && (
              <ClipMarker roomId={partyId} user={user} streamStartTs={streamStartRef.current} getClipBlobUrl={extractClipBlobUrl} />
            )}
            {isHost && (
              <button onClick={function() { endMut.mutate(); }}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
                style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.25)', color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif' }}>
                <LogOut className="w-3 h-3" /> End
              </button>
            )}
          </div>
        </div>

        {/* Row 2: host avatar + name | member count | mode pills | speaking indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black text-white"
            style={{ background: 'linear-gradient(135deg, #800020, #D4AF37)' }}>
            {((user && user.full_name) || (user && user.email) || 'H').charAt(0).toUpperCase()}
          </div>
          <span className="text-[10px] text-white/50 truncate max-w-[80px]" style={T}>{(user && user.full_name) || 'Host'}</span>
          <span className="text-white/15 mx-0.5">·</span>
          <ViewerCount count={liveViewers || members.length} peakViewers={peakViewers} />
          <div className="flex items-center gap-1 ml-1">
            {[
              { id: 'hybrid', icon: '⚡', label: 'Hybrid' },
              { id: 'watch',  icon: '🎬', label: 'Watch' },
              { id: 'live',   icon: '🎙', label: 'Live' },
            ].map(function(mod) { return (
              <button key={mod.id} onClick={function() { setStudioMode(mod.id); }}
                className="text-[11px] px-2 py-0.5 rounded-full font-black uppercase transition-all active:scale-95"
                style={{
                  background: studioMode === mod.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                  border: studioMode === mod.id ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  color: studioMode === mod.id ? GOLD : 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif',
                }}>
                {mod.icon} {mod.label}
              </button>
            ); })}
          </div>
          {isHost && (
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0"
              style={{ background: 'rgba(212,175,55,0.1)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Host
            </span>
          )}
          {isCoHost && !isHost && (
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0"
              style={{ background: 'rgba(212,175,55,0.1)', color: GOLD, border: '1px solid rgba(212,175,55,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Co-Host
            </span>
          )}
          {isSpeaker && !isHost && !isCoHost && (
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0"
              style={{ background: 'rgba(212,133,74,0.12)', color: '#D4854A', border: '1px solid rgba(212,133,74,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Panel
            </span>
          )}
          {speakingName && (
            <span className="ml-auto text-[10px] italic shrink-0" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>
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
                <span className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Barlow Condensed, sans-serif' }}>
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
                {members.length > 6 && (function() {
                  var stageMembers = members.filter(function(m) { return m.user_id === party.host_id || m.role === 'cohost' || m.role === 'speaker'; });
                  var audienceMembers = members.filter(function(m) { return m.role === 'audience' || m.role === 'viewer' || (!m.role && m.user_id !== party.host_id); });
                  if (audienceMembers.length === 0) return null;
                  var shown = audienceMembers.slice(0, 15);
                  var overflow = audienceMembers.length - 15;
                  return (
                    <div className="px-2 pt-2 pb-3">
                      <p className="text-[11px] uppercase font-bold mb-2 tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Others in the Room</p>
                      <div className="flex flex-wrap gap-1.5">
                        {shown.map(function(m) {
                          var _peerEntry = peerUserIds && Array.from(peerUserIds.entries()).find(function(e) { return e[1] === m.user_id; });
                          var peerId = _peerEntry && _peerEntry[0];
                          var mStream = peerId && remoteStreams ? remoteStreams.get(peerId) : null;
                          return (
                            <div key={m.id} className="flex flex-col items-center gap-0.5">
                              <OctAvatarThumb name={m.user_name} stream={mStream} size={36} />
                              <span className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.3)', maxWidth: 36 }}>{m.user_name && m.user_name.split(' ')[0]}</span>
                            </div>
                          );
                        })}
                        {overflow > 0 && (
                          <div className="flex flex-col items-center gap-0.5">
                            <div style={{ width: 36, height: 36, clipPath: 'polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: GOLD }}>
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
              <PipCameraTile localStream={localStream} videoEnabled={videoEnabled} roomId={partyId} tipTotal={tipTotal} tipGoal={100} />
            )}

            {/* Sync badge for audience viewers */}
            {!canStream && (
              <div className="absolute top-2 right-2 text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1"
                style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(107,124,74,0.3)', color: 'white' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#6DBF7E] animate-pulse" />
                Live Sync
              </div>
            )}

            {/* News Block overlay — rendered on top of video */}
            {overlayLayers.length > 0 && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
                <NewsBlockOverlay.Overlay layers={overlayLayers} />
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
                  currentTime={(syncData && syncData.current_time) || (party && party.current_time) || 0}
                />
              </div>
              <LiveEmoticonStorm partyId={partyId} currentUser={user} triggerReact={reactEmoji} />
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
        <div className="shrink-0 flex flex-col overflow-hidden" style={{ width: 296, borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#080B18' }}>

          {/* Exclusive Live toggle */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
            <span style={{ fontSize: 14 }}>🔒</span>
            <span className="flex-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Exclusive Live
            </span>
            <button
              onClick={function() {
                var next = !isExclusive;
                setIsExclusive(next);
                if (partyId && next) {
                  base44.entities.WatchParty.update(partyId, { is_exclusive: true });
                } else if (partyId && !next) {
                  base44.entities.WatchParty.update(partyId, { is_exclusive: false });
                }
              }}
              className="tap-44"
              aria-label="Toggle exclusive live"
              style={{ position: 'relative', width: 36, height: 20, borderRadius: 10, background: isExclusive ? GOLD : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
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
                    <button key={s} onClick={function() { setSlowModeCooldown(s); }}
                      className="text-[11px] px-1.5 py-0.5 rounded-full"
                      style={{ background: slowModeCooldown === s ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)', color: slowModeCooldown === s ? '#C9A84C' : 'rgba(255,255,255,0.3)', border: slowModeCooldown === s ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(255,255,255,0.07)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {s}s
                    </button>
                  ))}
                </div>
              )}
              <button className="tap-44" aria-label="Toggle slow mode" onClick={function() { setSlowMode(v => !v); }}
                style={{ position: 'relative', width: 36, height: 20, borderRadius: 10, background: slowMode ? '#C9A84C' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: 2, left: slowMode ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
            </div>
          )}

          {/* Tab bar */}
          <div className="flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0B0B18' }}>
            {RIGHT_TABS.map(function(tab) { return (
              <button key={tab.id} onClick={function() { setActiveTab(tab.id); }}
                className="flex-1 py-2 flex flex-col items-center gap-0 transition-all"
                style={{
                  color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.3)',
                  background: activeTab === tab.id ? 'rgba(212,175,55,0.06)' : 'transparent',
                  borderBottom: activeTab === tab.id ? ('2px solid ' + GOLD) : '2px solid transparent',
                }}>
                <span className="text-[11px] font-black uppercase" style={T}>{tab.label}</span>
              </button>
            ); })}
          </div>

          {/* Quick-action feature row */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2 overflow-x-auto"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
            <LowLatencyPreviewToggle
              enabled={lowLatencyPreview}
              onToggle={toggleLowLatencyPreview}
              network={previewNetwork}
            />
            {[
              { icon: '🎁', label: 'Gifts',    action: () => setGiftOpen(true) },
              { icon: '👥', label: 'Invite',   action: () => setShowInviteSheet(true) },
              { icon: '⚔️', label: 'PK',       action: () => setShowPKBattleModal(true) },
              { icon: '🚪', label: 'Breakout', action: () => setShowBreakoutRooms(true) },
              { icon: '📢', label: 'Share',    action: () => setShowShareModal(true) },
              { icon: '⚡', label: 'Activity', action: () => setShowActivitySidebar(v => !v) },
              { icon: '📊', label: 'Poll',     action: function() { navigate(createPageUrl('PollManager')); } },
              { icon: '🔔', label: 'Alert',    action: () => toast.info('Alert sent to audience!') },
              { icon: '🎵', label: 'Music',    action: function() { navigate(createPageUrl('AIMusic')); } },
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
          <StudioTabContent s={{
            activeTab, setActiveTab, hostSettings, pinnedMessage, setPinnedMessage, partyId, user,
            canManage, canStream, isHost, isCoHost, members, party, qc, setStudioMode,
            chatMessages, setChatMessages, slowMode, slowModeCooldown,
            activePoll, raisedHands, promoteSpeaker, promoteCoHost, demoteToAudience, dismissRaisedHand, kickMember,
            setShowInviteSheet, setHostSettings, subCount, goalTick, tipTotal, copyLink, linkCopied,
            setShowEvmux, setOverlayLayers, mediaError, audioEnabled, videoEnabled, reacquireMedia,
            toggleAudio, toggleVideo, noiseSupp, setNoiseSupp, echoCan, setEchoCan, autoGain, setAutoGain,
            localStream, screenSharing, setScreenSharing, activeScene, setActiveScene, endMut,
            bitratePreset, setBitratePreset, liveViewers, remoteStreams, peerUserIds, elapsed,
            activeVideoId, activeAudioId, replaceVideoDevice, replaceAudioDevice, toggleScreenShare,
            screenEnabled, speakers, prefSpeaker, setPrefSpeaker,
            aiSubTab, setAiSubTab, aiMusicGenre, setAiMusicGenre, aiMusicPrompt, setAiMusicPrompt,
            aiMusicGenerating, generateAiTrack, aiMoodDetecting, detectChatMood, aiMusicTrack,
            aiMusicPlaying, setAiMusicPlaying, musicVolume, setMusicVolume,
            ariaEnabled, setAriaEnabled, ariaTopicIdx, setAriaTopicIdx, ariaSuggestions,
            guardianEnabled, setGuardianEnabled, guardianStats, guardianWords, setGuardianWords,
            guardianWordInput, setGuardianWordInput,
          }} />
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
            color: videoEnabled ? '#C9A84C' : '#FF4444',
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

        <motion.button whileTap={{ scale: 0.92 }} onClick={function() { setShowCameraPicker(true); }}
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
          style={{ background: 'rgba(212,175,55,0.1)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          {studioMode === 'watch' ? '🎬 Watch' : studioMode === 'live' ? '🎙️ Live' : '⚡ Hybrid'}
        </span>

        {!canManage && (
          <motion.button whileTap={{ scale: 0.92 }} onClick={sendRaiseHand}
            title="Raise hand to ask to speak"
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
            style={{ background: raisedHands.has((user && user.id)) ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)', border: raisedHands.has((user && user.id)) ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)', color: raisedHands.has((user && user.id)) ? GOLD : 'rgba(255,255,255,0.4)' }}>
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
        {!vodRecording&&vodBlobUrl&&(<button onClick={()=>downloadRecording((party && party.title)?(party.title.slice(0,40) + '.webm'):'recording.webm')}
          title="Download recording"
          style={{display:'flex',alignItems:'center',justifyContent:'center',width:44,height:44,minWidth:44,minHeight:44,borderRadius:12,cursor:'pointer',
            background:'rgba(109,191,126,0.15)',border:'1px solid rgba(109,191,126,0.4)',color:'#6DBF7E',fontSize:13}}>
          ⬇</button>)}
        {!isHost ? (
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={function() { navigate('/'); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase"
            style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <PhoneOff className="w-3.5 h-3.5" /> Leave
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={function() { endMut.mutate(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase"
            style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <PhoneOff className="w-3.5 h-3.5" /> End Broadcast
          </motion.button>
        )}
      </div>

      <PreJoinSettingsModal open={showPreflight} onClose={() => setShowPreflight(false)} stream={localStream} devices={{ cameras: [] }} onCameraChange={function(id) { replaceVideoDevice(id); try { if (id) localStorage.setItem('swl_pref_cam', id); } catch {}; }} onResolutionChange={(res) => reacquireMedia({ resolution: res })} />
      <LiveCaptionOverlay stream={localStream} />
      {showCameraPicker && (
        <CameraSourcePicker
          currentStream={localStream}
          onSelect={function(stream, meta) {
            // Release picker's own acquired stream tracks
            if (stream) stream.getVideoTracks().forEach(t => t.stop());
            if ((meta && meta.deviceId)) {
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
        <LoveHearts roomId={partyId} currentUser={user} creatorId={(party && party.host_id)} />
      )}

      {partyId && (
        <StreamEventBus
          roomId={partyId}
          isHost={isHost}
          sessionId={(user && user.id)}
          onViewerUpdate={function(n) { setLiveViewers(n); setPeakViewers(p => Math.max(p, n)); }}
          onTipReceived={function(msg) { var amt = msg.tip_amount || 0; if (amt > 0) setTipTotal(prev => prev + amt); }}
        />
      )}

      <GiftShop
        isOpen={giftOpen}
        onClose={() => setGiftOpen(false)}
        roomId={partyId}
        user={user}
        creatorId={(party && party.host_id)}
        creatorName={(party && party.host_name) || 'Creator'}
        onGiftSent={function(gift, sender) {
          var senderName = (sender && sender.full_name) || (sender && sender.email) || 'You';
          var amount = (gift && gift.price) || 0;
          setGiftEvent({ id: Date.now(), gift, senderName });
          setSuperchats(prev => [...prev, { id: Date.now(), senderName, amount, emoji: (gift && gift.emoji) }]);
          if (amount > 0) setTipTotal(prev => prev + amount);
          setGiftOpen(false);
        }}
      />

      <GiftAnimation event={giftEvent} onDone={() => setGiftEvent(null)} />
      <SwanAIRecommendations roomId={partyId} currentLayout="studio" viewerCount={members.length} />
      <MilestoneAlerts userId={(user && user.id)} roomId={partyId} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(party && party.host_id) && <ShopDashboard creatorId={party.host_id} />}
      {partyId && <ZEGOGuestApprovalPanel roomId={partyId} isHost={isHost} />}
      {partyId && <ZEGOStreamHealthCard roomId={partyId} />}
      {user && <ZEGOConfigPanel user={user} />}
      {partyId && <RealtimeLeaderboard roomId={partyId} creatorId={(party && party.host_id) || (user && user.id)} />}
      {partyId && <LiveTranscription isLive={true} roomId={partyId} stream={localStream} />}
      {showViewerControls && partyId && <ViewerControlsPanel roomId={partyId} currentUser={user} onClose={() => setShowViewerControls(false)} />}
      {partyId && (user && user.id) && <VirtualCurrencyTips roomId={partyId} creatorId={(party && party.host_id) || (user && user.id)} currentUser={user} isHost={isHost} />}
      {partyId && <GoldenWall roomId={partyId} />}
      {isHost && partyId && <StreamerGoalsWidget creatorId={(party && party.host_id) || (user && user.id)} roomId={partyId} isCreator={isHost} embedded={true} />}
      {isHost && partyId && <PayPerViewManager roomId={partyId} />}
      {isHost && partyId && <MonetizationDashboard roomId={partyId} />}
      {partyId && <GiftShopTray roomId={partyId} currentUser={user} />}
      {partyId && <GiftLeaderboard roomId={partyId} />}
      {isHost && <SubscriptionManager creatorId={(party && party.host_id) || (user && user.id)} />}
      {partyId && <TipAlert roomId={partyId} recipientId={(party && party.host_id) || (user && user.id)} />}
      {!isHost && partyId && <TippingModal isOpen={showTippingModal} onClose={() => setShowTippingModal(false)} recipient={{ id: (party && party.host_id) }} roomId={partyId} />}
      {partyId && <LiveAuctionWidget creatorId={(party && party.host_id) || (user && user.id)} roomId={partyId} isCreator={isHost} currentUser={user} />}
      <MerchWidget />
      <NotificationBell />
      {partyId && <PKBattleInterface roomId={partyId} />}
      {partyId && <CoStreamPanel roomId={partyId} />}
      {isHost && partyId && <CollaborativeWhiteboard roomId={partyId} />}
      {partyId && (user && user.id) && <PointsEarnWidget userId={user.id} creatorId={(party && party.host_id) || (user && user.id)} roomId={partyId} isHost={isHost} />}
      {isHost && partyId && <RedemptionQueue creatorId={(party && party.host_id) || (user && user.id)} roomId={partyId} />}
      {partyId && <RewardShop creatorId={(party && party.host_id) || (user && user.id)} roomId={partyId} currentUser={user} />}
      {!isHost && (user && user.id) && <ViewerLoyaltyCard userId={user.id} creatorId={(party && party.host_id) || (user && user.id)} compact={true} />}
      {partyId && <GreenroomQueue roomId={partyId} isHost={isHost} />}
      {isHost && <StreamingPresets onApply={(p) => reacquireMedia({ resolution: p.resolution })} />}
      {partyId && <EmbedPlayer roomId={partyId} creatorName={(user && user.full_name) || ''} streamTitle={(party && party.title) || 'Live Stream'} viewerCount={members.length} />}
      <LiveTranslationWidget chatMessage={(chatMessages[chatMessages.length - 1] && chatMessages[chatMessages.length - 1].content) || null} onTranslation={function() {}} />
      {isHost && (user && user.id) && <RecordingManager userId={user.id} />}
      {isHost && <OBSBridge />}
      <ZEGOMobileAppBanner />
      {isHost && partyId && <AutomatedClipGenerator streamSession={{room_id: partyId}} isLive={partyId != null} />}
      {partyId && <InteractivePollWidget roomId={partyId} isHost={isHost} />}
      {isHost && <StreamMetadataEditor initialTitle={(party && party.title) || 'Live Stream'} initialCategory={'entertainment'} />}
      {isHost && <StreamerMonetizationCenter />}
      {!isHost && showGiftShop && partyId && <AnimatedGiftShop recipientId={(party && party.host_id) || (user && user.id)} roomId={partyId} onClose={() => setShowGiftShop(false)} />}
      {isHost && (user && user.id) && <VirtualGoodsStore userId={user.id} />}
      {isHost && <SoundAlertsManager creatorId={(party && party.host_id) || (user && user.id)} />}
      <ShareToSocial content={{ title: (party && party.title) || 'Broadcast on SeeWhy LIVE', url: window.location.href }} />
      {isHost && partyId && (user && user.id) && <VideoShortRecorder roomId={partyId} creatorId={user.id} />}
      {isHost && <BroadcastAnalyticsDashboard streamSession={partyId ? { room_id: partyId, title: (party && party.title) } : null} isLive={partyId != null} />}
      {isHost && partyId && <AutomatedHighlightReels streamSession={{room_id: partyId}} />}
      {partyId && <PerformanceDashboard roomId={partyId} sessionId={partyId} />}
      <StreamHealthDashboard isLive={partyId != null} />
      {!isHost && partyId && <QuickTip recipientId={(party && party.host_id) || (user && user.id)} recipientName={''} onTipSent={(amount) => setTipTotal(t => t + Math.floor(amount || 0))} />}
      {isHost && <LowerThirdsBanner onBannerChange={function(b) { if (partyId) base44.entities.WatchParty.update(partyId, { lower_thirds_text: b.text, lower_thirds_enabled: b.enabled }).catch(function() {}); }} />}
      {isHost && <SceneSwitcher activeScene={activeScene} onSceneChange={function(s) { setActiveScene(s); if ((s === 'screen' || s === 'pip') && !screenEnabled) setScreenEnabled(true); else if (s === 'camera' && screenEnabled) setScreenEnabled(false); }} />}
      <NotificationHub />
      {isHost && <SoundboardWidget isVisible={true} />}
      {isHost && partyId && <RaidPanelButton room={party} currentUser={user} isHost={isHost} triggerOpen={raidTick} />}
      {partyId && <LiveAudiencePulse roomId={partyId} isHost={isHost} viewerCount={members.length} />}
      {partyId && <StreamAnalyticsDashboard roomId={partyId} />}
      {isHost && partyId && <AIStreamSummary roomId={partyId} isHost={isHost} streamTitle={(party && party.title) || ''} viewerCount={members.length} elapsedSeconds={elapsed} />}
      {isHost && <ChatModeration collapsed={true} />}
      <BrandChyron />
      {!isHost && showWhisperPanel && partyId && (user && user.id) && <WhisperPanel roomId={partyId} currentUser={user} recipientId={(party && party.host_id) || (user && user.id)} recipientName={''} onClose={() => setShowWhisperPanel(false)} />}
      <HostAlertCenter />
      {partyId && <AICopilotSidebar roomId={partyId} isHost={isHost} viewerCount={members.length} />}
      {isHost && partyId && <EnhancedPollingSystem roomId={partyId} hostId={(party && party.host_id) || (user && user.id)} isHost={isHost} />}
      {partyId && (user && user.id) && <SuperChatBar roomId={partyId} currentUser={user} recipientId={(party && party.host_id) || (user && user.id)} recipientName={''} />}
      {(user && user.id) && <SwanyBotEnhanced userId={user.id} conversationId={null} onContextReady={function() {}} />}
      {isHost && <LocalVideoTile stream={localStream} audioEnabled={audioEnabled} videoEnabled={videoEnabled} userName={(user && user.full_name) || ''} isHost={isHost} isSpeaking={isSpeaking} />}
      {isHost && <OctagonalVideoWindow title={'My Camera'} isMuted={!audioEnabled} isVideoOff={!videoEnabled} onMicToggle={handleToggleAudio} onVideoToggle={toggleVideo} />}
      {isHost && <AudioPanel micMuted={!audioEnabled} onMicToggle={handleToggleAudio} participants={members} />}
      {isHost && <EvmuxWebSource isActive={showEvmux} onClose={() => setShowEvmux(false)} />}
      {partyId && <LivePollOverlay roomId={partyId} currentUser={user} isHost={isHost} position={'bottom-left'} />}
      {isHost && <StripeConnectButton creatorId={(party && party.host_id) || (user && user.id)} />}
      {!isHost && (user && user.id) && <StripeSubscribeButton creatorId={(party && party.host_id) || (user && user.id)} creatorName={''} currentUserId={user.id} />}
      {<SubscriptionTiers communityId={null} userId={(user && user.id)} />}
      {party && <WatchPartyAnalytics party={party} members={members} pollCount={0} reactionCount={0} />}
      {partyId && (user && user.id) && <ZEGOGuestJoin roomId={partyId} userId={user.id} userName={(user && user.full_name) || ''} onJoined={() => toast.success('Joined stream successfully!')} />}
      {partyId && <PaymentMethodSelector creatorId={(party && party.host_id) || (user && user.id)} roomId={partyId} onPaymentComplete={() => toast.success('Payment complete!')} />}
      {isHost && <CreatorTierManager creatorId={(party && party.host_id) || (user && user.id)} />}
      {(user && user.id) && <TierBadge tier={null} size={'sm'} showName={false} />}
      {(user && user.id) && <LoyaltyBadge userId={user.id} creatorId={(party && party.host_id) || (user && user.id)} />}
      {partyId && <GuestGrid participants={members} isHost={isHost} onInvite={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('Invite link copied!')).catch(function() {})} hostId={(user && user.id)} speakingIds={speakingIds} />}
      {isHost && partyId && <EnhancedRoomControls isHost={isHost} roomData={party} micMuted={!audioEnabled} onMicToggle={handleToggleAudio} onAudioSettingsChange={function(s) { if (s.noiseSuppression !== undefined) setNoiseSupp(s.noiseSuppression); if (s.echoCancellation !== undefined) setEchoCan(s.echoCancellation); }} />}
      <CollabPlaylist isHost={isHost} currentUser={user} onPlayVideo={function(url) { if (isHost && partyId) base44.entities.WatchParty.update(partyId, { video_url: url, current_time: 0, playback_state: 'paused', updated_at_ms: Date.now() }).catch(function() {}); }} />
      <YouTubeDiscovery />
      <ActivitySidebar isOpen={showActivitySidebar} onClose={() => setShowActivitySidebar(false)} />
      {showGlobalSearch && <GlobalSearch onClose={() => setShowGlobalSearch(false)} />}
      {partyId && <PayPerViewGate roomId={partyId} ppvPrice={4.99} onPurchase={() => toast.success('Content unlocked!')} />}
      <PaywallGate isHost={isHost} streamTitle={(party && party.title) || ''} onUnlock={function() {}} isUnlocked={true} />
      {partyId && <SubscriptionGate creatorId={(party && party.host_id) || (user && user.id)} roomId={partyId} />}
      {showModerationAppeal && partyId && <ModerationAppealPanel flagId={null} messageId={null} roomId={partyId} onClose={() => setShowModerationAppeal(false)} />}
      {isHost && <GuestStreamingPermissions participant={null} isHost={isHost} onPermissionChange={() => toast.success('Permissions updated')} />}
      {isHost && partyId && <MultiStreamConfig roomId={partyId} isHost={isHost} />}
      {partyId && <VdoNinjaGuestLink roomId={partyId} />}
      <WebRTCSetupBanner error={mediaError} audioEnabled={audioEnabled} videoEnabled={videoEnabled} onRetry={reacquireMedia} />
      {isHost && partyId && <WebhookHooks roomId={partyId} isHost={isHost} />}
      {isHost && <PKBattleSoundboard battleId={partyId} isBattleActive={partyId != null} />}
      <PanelMusicPlayer />
      {isHost && partyId && <PollLaunchBar roomId={partyId} hostId={(user && user.id)} activePoll={activePoll} isHost={isHost} />}
      {party && <PreStreamCountdown room={party} currentUser={user} onGoLive={function() { if (isHost && partyId) base44.entities.WatchParty.update(partyId, { status: 'live' }).catch(function() {}); }} />}
      <PrivatePanel isHost={isHost} currentUser={user} />
      {partyId && <StreamChatbot roomId={partyId} isHost={isHost} elapsedSeconds={elapsed} hostName={(user && user.full_name) || ''} room={party} />}
      {partyId && <StreamEventBus roomId={partyId} isHost={isHost} sessionId={partyId} onViewerUpdate={setBusViewerCount} onTipReceived={msg => setTipTotal(t => t + Math.floor((msg && msg.tip_amount) || 0))} onMessageReceived={function(msg) { if ((msg && msg.content)) setChatMessages(prev => [...prev, msg]); }} />}
      {partyId && <TippingOverlay roomId={partyId} creatorId={(party && party.host_id) || (user && user.id)} isVisible={true} />}
      {partyId && <UnifiedChat roomId={partyId} currentUser={user} isHost={isHost} />}
      {isHost && partyId && <AIPersonaCustomizer roomId={partyId} sessionId={partyId} onCustomized={() => toast.success('AI persona configured!')} />}
      {isHost && <AudioMixer micMuted={!audioEnabled} onMicToggle={handleToggleAudio} />}
      {isHost && <EnhancedAudioMixer micMuted={!audioEnabled} onMicToggle={handleToggleAudio} onAudioSettingsChange={function(s) { if (s.noiseSuppression !== undefined) setNoiseSupp(s.noiseSuppression); if (s.echoCancellation !== undefined) setEchoCan(s.echoCancellation); }} stream={localStream} />}
      {isHost && <ScreenSharePanel isSharing={screenEnabled} onStartShare={toggleScreenShare} onStopShare={toggleScreenShare} />}
      {partyId && <AuraEmotionDisplay roomId={partyId} sessionId={partyId} auraPersona={'hype'} />}
      {partyId && <BattleScoreboard roomId={partyId} />}
      {partyId && (user && user.id) && <EnhancedStreamChat roomId={partyId} userId={user.id} userName={(user && user.full_name) || ''} userRole={isHost ? 'host' : 'viewer'} />}
      <GlobalChatWidget />
      {isHost && partyId && <GuestConnector roomId={partyId} roomName={''} />}
      {partyId && <InteractivePollingSystem roomId={partyId} isHost={isHost} currentUser={user} />}
      {partyId && <LeaderboardPanel roomId={partyId} />}
      {partyId && <MobileStreamControls micMuted={!audioEnabled} onMicToggle={handleToggleAudio} onReact={(emoji) => setReactEmoji({ emoji, ts: Date.now() })} onQuickTip={() => !isHost && setShowTippingModal(true)} onWebSource={isHost ? () => setShowEvmux(true) : undefined} onClip={isHost ? () => setShowClipCreator(true) : undefined} onPoll={isHost ? () => setActiveTab('polls') : undefined} onRaid={isHost ? () => setRaidTick(t => t + 1) : undefined} onGoal={isHost ? () => setGoalTick(t => t + 1) : undefined} roomId={partyId} />}
      {(user && user.id) && <PointsNotification userId={user.id} />}
      {partyId && (user && user.id) && <EngagementBadgesDisplay roomId={partyId} userId={user.id} creatorId={(party && party.host_id) || (user && user.id)} />}
      {partyId && <ChatOverlay roomId={partyId} isVisible={true} />}
      {partyId && <BattleMode roomId={partyId} isHost={isHost} hostName={(user && user.full_name) || ''} />}
      {isHost && <BitratePresets selected={selectedBitrate} onChange={handleBitrateChange} />}
      {isHost && <GuestStreamMonitor guestName={(user && user.full_name) || ''} isStreaming={partyId != null} />}
      {partyId && <TranscriptionPanel recordingUrl={''} roomTitle={''} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={isHost} currentTips={tipTotal} currentSubs={subCount} currentViewers={Math.max(busViewerCount, members.length)} />
      <ViewerCount count={Math.max(busViewerCount, members.length)} peakViewers={peakViewers} />
      {isHost && partyId && (user && user.id) && <ClipCreator roomId={partyId} creatorId={user.id} streamTitle={(party && party.title) || ''} elapsedSeconds={elapsed} currentUser={user} />}
      {isHost && partyId && (user && user.id) && <StreamHighlightCapture roomId={partyId} sessionId={partyId} creatorId={user.id} elapsedSeconds={elapsed} isHost={isHost} />}
      {isHost && partyId && <QuickPollLauncher roomId={partyId} hostId={(user && user.id)} isHost={isHost} />}
      {!isHost && partyId && (party && party.host_id) && <GiftTray roomId={partyId} currentUser={user} recipientId={party.host_id} />}
      {isHost && party && <RoomBrandingEditor roomData={party} onBrandingChange={function(b) { if ((party && party.id)) base44.entities.WatchParty.update(party.id, b).catch(function() {}); }} isHost={isHost} />}
      {/* Creator Studios */}
      <div style={{ margin: '0 0 16px', padding: 16, borderRadius: 16, border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(13,6,24,0.5)' }}>
        <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(176,102,204,0.7)', marginBottom: 12 }}>Creator Studios</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          {[
            { emoji: '🎬', label: 'Micro Drama', sub: 'Episode creator', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
            { emoji: '🎵', label: 'AI Music', sub: 'Beat & vocal studio', href: 'AIMusic', color: '#00A8E8' },
            { emoji: '🎙️', label: 'Podcast Studio', sub: 'AI-assisted pods', href: 'PodcastStudio', color: '#B066CC' },
          ].map(function(s) {
            return (
              <Link key={s.href} to={createPageUrl(s.href)} style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(123,45,139,0.18)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', marginTop: 2 }}>{s.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
          <div style={{ borderRadius: 12, padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC', cursor: 'pointer' }}>
            🎬 Launch Episode Creator Studio →
          </div>
        </Link>
      </div>
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
      {!isHost && partyId && user && <TipWidget roomId={partyId} hostId={(party && party.host_id)} currentUser={user} />}
      <InviteSheet isOpen={showInviteSheet} onClose={() => setShowInviteSheet(false)} roomId={partyId} roomTitle={(party && party.title) || ''} isHost={isHost} isCoHost={false} />
      {partyId && <AuraPanel roomId={partyId} isHost={isHost} streamTitle={(party && party.title) || ''} viewerCount={members.length} isLive={partyId != null} userTier="free" />}
      {isHost && <GuestControls
        participants={members}
        onMuteGuest={(id) => base44.entities.WatchPartyMember.update(id, { is_audio_enabled: false }).catch(function() {})}
        onRemoveGuest={function(id) { var m = members.find(mb => mb.id === id); if (m) kickMember(m); }}
      />}
      {isHost && partyId && <StreamHealthMonitor isLive={true} />}
      {isHost && partyId && <BreakoutRoomsModal isOpen={showBreakoutRooms} onClose={() => setShowBreakoutRooms(false)} roomId={partyId} roomTitle={(party && party.title) || ''} currentUser={user} />}
      {isHost && partyId && <CoStreamHub roomId={partyId} isHost={isHost} isCoHost={false} currentUser={user} compact={false} speakingIds={speakingIds} />}
      {isHost && <GreenRoomModal isOpen={showGreenRoomModal} onClose={() => setShowGreenRoomModal(false)} onReady={function() { setShowGreenRoomModal(false); if (partyId) base44.entities.WatchParty.update(partyId, { status: 'live' }).catch(function() {}); }} localStream={localStream} audioEnabled={audioEnabled} />}
      {isHost && party && user && <GreenRoomPreflight isOpen={showPreflight} onClose={() => setShowPreflight(false)} onGoLive={function() { if (partyId) base44.entities.WatchParty.update(partyId, { status: 'live' }).catch(function() {}); }} party={party} user={user} />}
      {isHost && (user && user.id) && <OverlayThemeBuilder creatorId={(party && party.host_id) || (user && user.id)} />}
      {isHost && showClipCreator && partyId && (user && user.id) && <ClipCreatorSheet roomId={partyId} sessionId={partyId} creatorId={user.id} elapsedSeconds={elapsed} roomTitle={(party && party.title) || ''} onClose={() => setShowClipCreator(false)} />}
      {isHost && showAuraPanelDrawer && partyId && <AuraPanelDrawer roomId={partyId} hostId={(party && party.host_id) || (user && user.id)} onClose={() => setShowAuraPanelDrawer(false)} />}
      {partyId && <PKBattle roomId={partyId} isHost={isHost} hostName={(user && user.full_name) || ''} viewerCount={members.length} />}
      {partyId && <PKBattleModal isOpen={showPKBattleModal} onClose={() => setShowPKBattleModal(false)} roomId={partyId} isHost={isHost} currentUser={user} hostName={(user && user.full_name) || ''} />}
      {!isHost && partyId && user && <LoveTap roomId={partyId} user={user} creatorId={(party && party.host_id) || (user && user.id)} creatorName={''} />}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} url={window.location.origin + createPageUrl('BroadcastStudio') + '?id=' + partyId} title={(party && party.title) || ''} />
      <WebRTCConfigModal isOpen={showWebRTCConfig} onClose={() => setShowWebRTCConfig(false)} onApply={() => setShowWebRTCConfig(false)} currentConfig={{}} />
    </div>
  );
}

// ── Picture-in-picture local camera (hybrid mode overlay) ───────────────────