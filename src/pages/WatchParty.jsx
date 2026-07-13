import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Youtube, Video, LogOut, List, Maximize2, Minimize2, X as XIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import VideoSourcePicker, { getYouTubeId, detectVideoType } from '../components/video/VideoSourcePicker';
import VideoPlayerControls from '../components/video/VideoPlayerControls';
import AggregatedChat from '../components/live/AggregatedChat';
import ViewerRail from '../components/watchparty/ViewerRail';
import ReactionOverlay from '../components/watchparty/ReactionOverlay';
import ShareButtons from '../components/shared/ShareButtons';
import PanelGrid from '../components/watchparty/PanelGrid';
import BattleTiers from '../components/watchparty/BattleTiers';
import WatchQueue from '../components/watchparty/WatchQueue';
import SocialLeaderboard from '../components/watchparty/SocialLeaderboard';
import HostControls from '../components/watchparty/HostControls';
import WatchPartyPoll from '../components/watchparty/WatchPartyPoll';
import VideoQueuePanel from '../components/watchparty/VideoQueuePanel';
import PartyReactionsOverlay from '../components/watchparty/PartyReactionsOverlay';
import PartyAnalyticsDashboard from '../components/watchparty/PartyAnalyticsDashboard';
import PartyHypeMeter from '../components/watchparty/PartyHypeMeter';
import LiveEmoticonStorm from '../components/watchparty/LiveEmoticonStorm';
import CompositorOverlay from '../components/streaming/CompositorOverlay';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
import { useAutoSpeakGate } from '../hooks/useAutoSpeakGate';
import { useVODRecording } from '../hooks/useVODRecording';
import { useConnectionQuality } from '../hooks/useConnectionQuality';
import { useHighlightDetector } from '../hooks/useHighlightDetector';
import { useSubscriptionCount } from '../hooks/useSubscriptionCount';
import NetworkQualityBanner from '../components/live/NetworkQualityBanner';
import WatchPartyTab from '../components/watchparty/WatchPartyTab';
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
import WatchPartyCoStreamPanel from '../components/live/WatchPartyCoStreamPanel';
import VideoQueue from '../components/watchparty/VideoQueue';
var OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
var REACTION_EMOJIS = ['🔥', '❤️', '😂', '😮', '🎉', '👏', '💯', '🤩', '⚡'];

function Button({ children, onClick, disabled, className = '', style = {}, size }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-black uppercase text-xs transition-all ${className}`}
      style={{ padding: size === 'sm' ? '5px 10px' : '8px 16px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', cursor: disabled ? 'default' : 'pointer', fontFamily: 'Barlow Condensed, sans-serif', opacity: disabled ? 0.4 : 1, ...style }}>
      {children}
    </button>
  );
}
function Input({ value, onChange, placeholder, className = '', style = {}, maxLength }) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength}
      className={className}
      style={{ width: '100%', padding: '10px 14px', background: 'rgba(17,8,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif', ...style }} />
  );
}
function Badge({ children, className = '', style = {} }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full uppercase ${className}`}
      style={{ fontFamily: 'Barlow Condensed, sans-serif', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', ...style }}>
      {children}
    </span>
  );
}
function Card({ children, className = '', style = {} }) {
  return <div className={`rounded-2xl ${className}`} style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', ...style }}>{children}</div>;
}
function CardContent({ children, className = '', style = {} }) {
  return <div className={className} style={style}>{children}</div>;
}

function detectType(url) { return detectVideoType(url); }

function useSyncEngine({ party, isHost, onTimeSync }) {
  const qc = useQueryClient();
  const syncInterval = useRef(null);

  const pushState = useCallback(async (playerState) => {
    if (!isHost || !party?.id) return;
    try {
      await base44.entities.WatchParty.update(party.id, {
        playback_state: playerState.playing ? 'playing' : 'paused',
        current_time: playerState.currentTime,
        updated_at_ms: Date.now(),
      });
    } catch {}
  }, [isHost, party?.id]);

  useEffect(() => {
    if (!party?.id) return;
    const unsub = base44.entities.WatchParty.subscribe((event) => {
      if (event.id !== party.id) return;
      if (!isHost && event.data) {
        onTimeSync(event.data);
      }
      qc.invalidateQueries(['watchparty', party.id]);
    });
    return unsub;
  }, [party?.id, isHost, onTimeSync, qc]);

  return { pushState };
}

function YouTubeEmbed({ videoId, isHost, syncData, onStateChange }) {
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
        playerVars: { autoplay: 0, controls: isHost ? 1 : 0 },
        events: {
          onStateChange: (e) => {
            if (!isHost) return;
            const state = e.data;
            if (state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.PAUSED) {
              onStateChange({
                playing: state === window.YT.PlayerState.PLAYING,
                currentTime: playerRef.current?.getCurrentTime() || 0,
              });
            }
          },
        },
      });
    };
  }, [videoId]);

  useEffect(() => {
    if (!isHost) return;
    const iv = setInterval(() => {
      if (!playerRef.current?.getPlayerState) return;
      const state = playerRef.current.getPlayerState();
      if (state === window.YT?.PlayerState?.PLAYING) {
        onStateChange({ playing: true, currentTime: playerRef.current.getCurrentTime() || 0 });
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [isHost, onStateChange]);

  useEffect(() => {
    if (isHost || !playerRef.current || !syncData) return;
    const serverTime = syncData.current_time || 0;
    const lagMs = Date.now() - (syncData.updated_at_ms || Date.now());
    const adjustedTime = serverTime + lagMs / 1000;
    const current = playerRef.current.getCurrentTime?.() || 0;
    if (Math.abs(current - adjustedTime) > 2) {
      playerRef.current.seekTo?.(adjustedTime, true);
    }
    if (syncData.playback_state === 'playing') {
      playerRef.current.playVideo?.();
    } else {
      playerRef.current.pauseVideo?.();
    }
  }, [syncData, isHost]);

  return <div ref={iframeRef} className="w-full h-full" />;
}

function DirectPlayer({ url, isHost, syncData, onStateChange }) {
  const videoRef = useRef(null);

  const handleEvent = () => {
    if (!isHost || !videoRef.current) return;
    onStateChange({
      playing: !videoRef.current.paused,
      currentTime: videoRef.current.currentTime,
    });
  };

  useEffect(() => {
    if (!isHost) return;
    const iv = setInterval(() => {
      if (!videoRef.current || videoRef.current.paused) return;
      onStateChange({ playing: true, currentTime: videoRef.current.currentTime });
    }, 3000);
    return () => clearInterval(iv);
  }, [isHost, onStateChange]);

  useEffect(() => {
    if (isHost || !videoRef.current || !syncData) return;
    const v = videoRef.current;
    const serverTime = syncData.current_time || 0;
    const lagMs = Date.now() - (syncData.updated_at_ms || Date.now());
    const adjustedTime = serverTime + lagMs / 1000;
    if (Math.abs(v.currentTime - adjustedTime) > 2) v.currentTime = adjustedTime;
    if (syncData.playback_state === 'playing') v.play().catch(() => {});
    else v.pause();
  }, [syncData, isHost]);

  return (
    <video
      ref={videoRef}
      src={url}
      controls={isHost}
      className="w-full h-full object-contain bg-black"
      onPlay={handleEvent}
      onPause={handleEvent}
      onSeeked={handleEvent}
    />
  );
}

function MobileParticipantStrip({ members, hostId, speakingIds }) {
  var displayMembers = members.slice(0, 8);
  var overflow = members.length - 8;
  return (
    <div className="flex md:hidden items-center gap-2 px-3 py-1.5 overflow-x-auto shrink-0"
      style={{ background: 'rgba(8,11,24,0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {displayMembers.map(function(m) {
        var isHostMember = m.user_id === hostId;
        var isSpeaking = speakingIds && speakingIds.has(m.user_id);
        return (
          <div key={m.id || m.user_id} className="flex flex-col items-center shrink-0 gap-0.5">
            <motion.div
              style={{ width: 44, height: 44, borderRadius: 2 }}
              animate={{
                boxShadow: isSpeaking
                  ? ['0 0 0 2px rgba(212,175,55,0.8)', '0 0 0 6px rgba(212,175,55,0.15)']
                  : isHostMember
                  ? '0 0 0 2px rgba(212,175,55,0.5)'
                  : '0 0 0 0px transparent',
              }}
              transition={isSpeaking ? { boxShadow: { duration: 1, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' } } : {}}
            >
              <div className="w-full h-full relative" style={{ clipPath: OCT, background: isHostMember ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.12)' }}>
                <div className="absolute inset-[2px] flex items-center justify-center font-bold text-white text-xs"
                  style={{ clipPath: OCT, background: '#1a0f2e' }}>
                  {m.user_name ? m.user_name.charAt(0).toUpperCase() : '?'}
                  {isHostMember && (
                    <span className="absolute top-0 right-0 text-[6px]">👑</span>
                  )}
                </div>
              </div>
            </motion.div>
            <span className="text-white/50 truncate max-w-[44px]" style={{ fontSize: 7 }}>{m.user_name}</span>
          </div>
        );
      })}
      {overflow > 0 && (
        <div className="shrink-0 flex flex-col items-center gap-0.5">
          <div className="flex items-center justify-center text-[10px] font-bold rounded"
            style={{ width: 44, height: 44, background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37', clipPath: OCT }}>
            +{overflow}
          </div>
          <span style={{ fontSize: 7, color: 'transparent' }}>.</span>
        </div>
      )}
    </div>
  );
}

function ReactionsPanel({ partyId }) {
  var [counts, setCounts] = useState({});
  var [floaters, setFloaters] = useState([]);
  var floaterIdRef = useRef(0);

  var handleReaction = function(emoji) {
    setCounts(function(prev) { return { ...prev, [emoji]: (prev[emoji] || 0) + 1 }; });
    var id = ++floaterIdRef.current;
    setFloaters(function(prev) { return [...prev, { id, emoji }]; });
    setTimeout(function() { setFloaters(function(prev) { return prev.filter(function(f) { return f.id !== id; }); }); }, 1200);
  };

  return (
    <div className="relative space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {REACTION_EMOJIS.map(function(emoji) {
          return (
            <button key={emoji}
              onClick={function() { handleReaction(emoji); }}
              className="relative flex flex-col items-center justify-center rounded-xl transition-all"
              style={{ height: 52, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={function(e) { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'; }}
              onMouseLeave={function(e) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <span style={{ fontSize: 24 }}>{emoji}</span>
              {counts[emoji] > 0 && (
                <span className="absolute top-1 right-1 text-[11px] font-bold rounded-full px-1"
                  style={{ background: 'rgba(212,175,55,0.3)', color: '#d4af37' }}>
                  {counts[emoji]}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {floaters.map(function(f) {
            return (
              <motion.div key={f.id}
                initial={{ y: 0, opacity: 1, x: Math.random() * 80 + 40 }}
                animate={{ y: -80, opacity: 0 }}
                exit={{}}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                className="absolute bottom-0 text-2xl pointer-events-none"
              >
                {f.emoji}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function InviteCard({ partyUrl }) {
  var handleCopy = function() {
    navigator.clipboard.writeText(partyUrl).then(function() {
      toast.success('Link copied!');
    });
  };
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.04)' }}>
      <p className="text-[11px] font-black uppercase" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>Invite Friends</p>
      <div className="rounded px-2 py-1.5 text-[10px] truncate" style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {partyUrl}
      </div>
      <button onClick={handleCopy}
        className="w-full py-1.5 rounded-lg text-[11px] font-bold transition-all"
        style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' }}>
        Copy Link
      </button>
    </div>
  );
}

export default function WatchPartyPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const partyId = urlParams.get('id');
  const qc = useQueryClient();

  const [videoUrl, setVideoUrl] = useState('');
  const [partyTitle, setPartyTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [syncData, setSyncData] = useState(null);
  const [activePanel, setActivePanel] = useState('chat');
  const [reactionCount, setReactionCount] = useState(0);
  const [pollCount, setPollCount] = useState(0);
  const [playlist, setPlaylist] = useState([]);
  const [theaterMode, setTheaterMode] = useState(false);
  const [showSyncWarn, setShowSyncWarn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [tipTotal, setTipTotal] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  useEffect(() => { setPeakViewers(prev => Math.max(prev, members.length)); }, [members.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const [chatMessages, setChatMessages] = useState([]);
  const [hypeLevel, setHypeLevel] = useState(0);
  const directVideoRef = useRef(null);
  const prevMemberCountRef = useRef(null);

  // AI panel state
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [wpAriaOn, setWpAriaOn] = useState(false);
  const [wpGuardianOn, setWpGuardianOn] = useState(true);
  const [wpAriaMessage, setWpAriaMessage] = useState('');
  const [wpAriaLoading, setWpAriaLoading] = useState(false);
  const [wpDjTrack, setWpDjTrack] = useState(null);

  // Read DJ track from localStorage
  useEffect(() => {
    function readDjTrack() {
      try {
        const raw = sessionStorage.getItem('seewhy_dj_track');
        setWpDjTrack(raw ? JSON.parse(raw) : null);
      } catch {
        setWpDjTrack(null);
      }
    }
    readDjTrack();
    const iv = setInterval(readDjTrack, 4000);
    return () => clearInterval(iv);
  }, []);

  async function generateWpAriaWelcome() {
    setWpAriaLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: 'You are ARIA, an AI co-host for a live streaming platform. Generate one engaging welcome message for viewers joining a watch party. Keep it under 20 words, energetic, relevant to streaming culture. No hashtags.',
        response_json_schema: { type: 'object', properties: { message: { type: 'string' } } },
      });
      setWpAriaMessage(result.message || '');
    } catch {
      setWpAriaMessage('Welcome to the watch party! Great to have you here — enjoy the show!');
    } finally {
      setWpAriaLoading(false);
    }
  }

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: party } = useQuery({
    queryKey: ['watchparty', partyId],
    queryFn: () => base44.entities.WatchParty.filter({ id: partyId }).then(r => r[0]),
    enabled: !!partyId,
    refetchInterval: 5000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['watchparty-members', partyId],
    queryFn: () => base44.entities.WatchPartyMember.filter({ party_id: partyId, is_active: true }),
    enabled: !!partyId,
    refetchInterval: 10000,
  });

  const isHost = party?.host_id === user?.id;
  const subCount = useSubscriptionCount(party?.host_id || user?.id);

  const prefCamWP = (() => { try { return localStorage.getItem('swl_pref_cam') || null; } catch { return null; } })();
  const prefMicWP = (() => { try { return localStorage.getItem('swl_pref_mic') || null; } catch { return null; } })();
  const { localStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo, error: mediaError, reacquire: reacquireMedia } = useLocalMedia({ audio: true, video: true, videoDeviceId: prefCamWP, audioDeviceId: prefMicWP });
  const { remoteStreams, peerUserIds, announceJoin, leaveRoom, peersRef } = useWebRTCPeers(partyId, localStream);
  const announceJoinRef = useRef(announceJoin);
  const leaveRoomRef = useRef(leaveRoom);
  useEffect(() => { announceJoinRef.current = announceJoin; }, [announceJoin]);
  useEffect(() => { leaveRoomRef.current = leaveRoom; }, [leaveRoom]);
  useEffect(() => {
    if (!user?.id || !partyId) return;
    announceJoinRef.current?.(user.id);
  }, [user?.id, partyId]);
  useEffect(() => () => leaveRoomRef.current?.(), []);

  const { isSpeaking: localSpeaking } = useAutoSpeakGate({ stream: localStream, enabled: !!localStream });
  const speakingIds = user?.id && localSpeaking ? new Set([user.id]) : new Set();

  // VOD recording — runs while host has local stream and party is loaded
  const { extractClipBlobUrl } = useVODRecording({ streamId: partyId || '', creatorId: user?.id || '', title: party?.title || 'Watch Party', stream: isHost ? localStream : null });

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
              totalRtt += r.currentRoundTripTime * 1000; cnt++;
            }
          });
          const rtt = cnt > 0 ? Math.round(totalRtt / cnt) : null;
          qual.set(uid, { bars: rtt == null ? 3 : rtt < 80 ? 4 : rtt < 200 ? 3 : rtt < 400 ? 2 : 1, rtt });
        } catch {}
      }
      setPeerQuality(qual);
    }, 5000);
    return () => clearInterval(interval);
  }, [peerUserIds]); // peersRef is a stable ref

  const [activeWpPc, setActiveWpPc] = useState(null);
  useEffect(() => {
    for (const { pc } of peersRef.current.values()) {
      if (pc.connectionState === 'connected') { setActiveWpPc(pc); return; }
    }
    setActiveWpPc(null);
  }, [peerUserIds]);
  const { quality: netQuality, rtt: netRtt } = useConnectionQuality(activeWpPc, 5000);
  useHighlightDetector({ partyId, roomId: partyId, isHost, user, messages: chatMessages, hypeLevel, elapsedSeconds: elapsed, getClipBlobUrl: extractClipBlobUrl });

  const [screenCaptureStream, setScreenCaptureStream] = useState(null);
  const [chatLines, setChatLines] = useState([]);

  const handleScreenCapture = async () => {
    if (screenCaptureStream) {
      screenCaptureStream.getTracks().forEach(t => t.stop());
    }
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: true });
    setScreenCaptureStream(stream);
    stream.getVideoTracks()[0].onended = () => setScreenCaptureStream(null);
    return stream;
  };

  useEffect(() => () => {
    screenCaptureStream?.getTracks().forEach(t => t.stop());
  }, [screenCaptureStream]);

  const wpCompositorSlots = [
    { stream: screenCaptureStream, label: '' },
    { stream: localStream, label: 'You' },
    ...Array.from(remoteStreams.entries()).map(([peerId, stream]) => ({
      stream,
      label: peerUserIds?.get(peerId) || 'Guest',
    })),
  ];
  const wpOverlayConfig = {
    title: party?.title || 'Watch Party',
    subtitle: `${members?.length || 0} watching`,
    showLive: true,
    chatLines,
  };

  useEffect(() => {
    if (!partyId) return;
    const unsub = base44.entities.WatchPartyMember.subscribe((event) => {
      if (event.data?.party_id !== partyId) return;
      qc.invalidateQueries(['watchparty-members', partyId]);
    });
    return unsub;
  }, [partyId, qc]);

  useEffect(() => {
    if (!party || !user) return;
    let mounted = true;
    const join = async () => {
      try {
        const existing = await base44.entities.WatchPartyMember.filter({ party_id: party.id, user_id: user.id, is_active: true });
        if (!mounted) return;
        if (existing.length === 0) {
          await base44.entities.WatchPartyMember.create({
            party_id: party.id,
            user_id: user.id,
            user_name: user.full_name || user.email,
            joined_at: new Date().toISOString(),
            is_active: true,
          });
          if (!mounted) return;
          await base44.entities.WatchParty.update(party.id, { participant_count: members.length + 1 });
          if (mounted) qc.invalidateQueries({ queryKey: ['watchparty-members', party.id] });
        }
      } catch {}
    };
    join();
    return () => { mounted = false; };
  }, [party?.id, user?.id]);

  useEffect(() => {
    return () => {
      if (!party || !user) return;
      base44.entities.WatchPartyMember.filter({ party_id: party.id, user_id: user.id, is_active: true })
        .then(members => members.forEach(m =>
          base44.entities.WatchPartyMember.update(m.id, { is_active: false, left_at: new Date().toISOString() }).catch(() => {})
        )).catch(() => {});
    };
  }, [party?.id, user?.id]);

  useEffect(() => {
    if (prevMemberCountRef.current === null) {
      prevMemberCountRef.current = members.length;
      return;
    }
    if (members.length > prevMemberCountRef.current) {
      const newest = members[members.length - 1];
      toast.success(`👤 ${newest?.user_name || 'Someone'} joined!`, { duration: 2500 });
    }
    prevMemberCountRef.current = members.length;
  }, [members.length]);

  useEffect(() => {
    if (!partyId) return;
    const iv = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, [partyId]);

  useEffect(() => {
    if (isHost || !partyId) return;
    const iv = setInterval(function() {
      var lastMs = syncData?.updated_at_ms || party?.updated_at_ms;
      if (lastMs && (Date.now() - lastMs) > 8000) {
        setShowSyncWarn(true);
      } else {
        setShowSyncWarn(false);
      }
    }, 5000);
    return function() { clearInterval(iv); };
  }, [isHost, syncData, party, partyId]);

  const onTimeSync = useCallback((data) => {
    setSyncData(data);
    setShowSyncWarn(false);
  }, []);
  const { pushState } = useSyncEngine({ party, isHost, onTimeSync });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('auth_required');
      const type = detectType(videoUrl);
      return base44.entities.WatchParty.create({
        host_id: user.id,
        title: partyTitle || 'Watch Party',
        video_url: videoUrl,
        video_type: type,
        status: 'active',
        participant_count: 1,
        current_time: 0,
        updated_at_ms: Date.now(),
        playback_state: 'paused',
      });
    },
    onSuccess: (p) => {
      window.location.href = `${window.location.pathname}?id=${p.id}`;
    },
    onError: (e) => {
      if (e?.message === 'auth_required') {
        toast.error('Please sign in to create a Watch Party');
      } else {
        toast.error('Failed to create Watch Party. Please try again.');
      }
    },
  });

  const endPartyMutation = useMutation({
    mutationFn: () => base44.entities.WatchParty.update(partyId, { status: 'ended' }),
    onSuccess: () => {
      toast.success('Watch party ended');
      if (user?.id) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'room_ended',
          title: `Ended watch party: ${party?.title || 'Watch Party'}`,
        }).catch(() => {});
      }
      setSearchParams({});
    },
    onError: () => toast.error('Failed to end watch party.'),
  });

  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.href).then(() => toast.success('Invite link copied!')).catch(() => toast.error('Copy failed.'));
  };

  const changeVideo = async (source) => {
    if (!isHost || !party?.id) return;
    try {
      await base44.entities.WatchParty.update(party.id, {
        video_url: source.url,
        video_type: source.type === 'youtube' ? 'youtube' : 'direct',
        current_time: 0,
        playback_state: 'paused',
        updated_at_ms: Date.now(),
      });
      qc.invalidateQueries({ queryKey: ['watchparty', partyId] });
      toast.success('Video changed!');
    } catch { toast.error('Failed to change video.'); }
  };

  var handlePip = function() {
    try {
      var el = document.querySelector('[data-video-container] video, [data-video-container] iframe');
      if (el && el.requestPictureInPicture) {
        el.requestPictureInPicture();
      }
    } catch (e) {}
  };

  if (!partyId) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-6 space-y-6" style={{ background: '#0B0B18', minHeight: '100vh' }}>
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>
            <Video className="w-8 h-8" /> Watch Party
          </h1>
          <p className="text-white/50 mt-1 text-sm">Watch together in sync with real-time chat</p>
        </div>
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(13,6,24,0.95)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <Input
            placeholder="Party title (e.g. Movie Night)"
            value={partyTitle}
            onChange={e => setPartyTitle(e.target.value)}
            className="h-11 text-white placeholder:text-white/30"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <div className="space-y-2">
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Video Source</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'youtube', label: 'YouTube URL', icon: Youtube, color: '#FF0000', placeholder: 'https://youtube.com/watch?v=...' },
                { id: 'direct', label: 'Direct URL', icon: Video, color: '#4A8A7A', placeholder: 'https://example.com/video.mp4' },
              ].map(opt => (
                <button key={opt.id}
                  onClick={() => { setVideoUrl(''); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: `${opt.color}12`, border: `1px solid ${opt.color}30`, color: opt.color }}>
                  <opt.icon className="w-4 h-4" /> {opt.label}
                </button>
              ))}
            </div>
            <Input
              placeholder="YouTube URL or direct video URL"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              className="h-11 text-white placeholder:text-white/30"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            {videoUrl && (
              <div className="flex items-center gap-2 text-xs" style={{ color: detectType(videoUrl) === 'youtube' ? '#FF0000' : '#4A8A7A' }}>
                {detectType(videoUrl) === 'youtube'
                  ? <><Youtube className="w-3.5 h-3.5" /> YouTube video detected {getYouTubeId(videoUrl) && '✓'}</>
                  : <><Video className="w-3.5 h-3.5" /> Direct video URL</>}
              </div>
            )}
            {videoUrl && getYouTubeId(videoUrl) && (
              <img
                src={`https://img.youtube.com/vi/${getYouTubeId(videoUrl)}/mqdefault.jpg`}
                className="w-full rounded-xl object-cover" style={{ maxHeight: 130 }}
                alt="preview"
              />
            )}
          </div>
          <Button
            className="w-full h-11 text-sm font-bold"
            disabled={!videoUrl.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            style={{ background: '#d4af37', color: '#000' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {!user ? 'Sign In to Create Watch Party' : createMutation.isPending ? 'Creating…' : 'Create Watch Party'}
          </Button>
        </div>
      </div>
    );
  }

  if (!party) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const syncDrift = !isHost
    ? Math.round(((syncData?.current_time || 0) - (directVideoRef?.current?.currentTime || 0)) * 1000)
    : 0;

  return (
    <div className={`flex flex-col overflow-hidden transition-all duration-300 ${theaterMode ? 'h-screen fixed inset-0 z-50' : 'h-[calc(100vh-120px)]'}`} style={{ background: '#0B0B18' }}>
      <div className="shrink-0" style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>

        <div className="flex items-center gap-2 px-3 h-12">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h2 className="font-black text-white truncate" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, letterSpacing: '0.02em' }}>{party.title}</h2>
            <span className="shrink-0 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-black uppercase"
              style={{ background: 'rgba(192,57,43,0.18)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />LIVE
            </span>
            <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full font-black uppercase hidden sm:block"
              style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Watch Party
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {document.pictureInPictureEnabled && (
              <button onClick={handlePip}
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-95 text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                title="Picture in Picture">
                📺
              </button>
            )}
            <ShareButtons
              url={window.location.href}
              title={`Join my Watch Party: ${party?.title}`}
              className="text-white [&_button]:text-white/60"
            />
            <VideoSourcePicker
              compact
              isHost={isHost}
              isCoHost={false}
              playlist={playlist}
              onPlaylistChange={setPlaylist}
              onSelect={changeVideo}
            />
            <button onClick={() => setTheaterMode(v => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-95"
              style={{ background: theaterMode ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)', color: theaterMode ? '#d4af37' : 'rgba(255,255,255,0.4)' }}
              title="Theater Mode">
              {theaterMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            {isHost && (
              <CompositorOverlay
                layout="watchparty"
                slots={wpCompositorSlots}
                overlayConfig={wpOverlayConfig}
                userId={user?.id}
                onScreenCapture={handleScreenCapture}
                isHost={isHost}
              />
            )}
            {isHost && (
              <Button size="sm" onClick={() => endPartyMutation.mutate()}
                className="h-7 text-[10px] px-2" style={{ background: 'rgba(180,50,30,0.3)', color: '#ff8866', border: '1px solid rgba(200,80,30,0.3)' }}>
                <LogOut className="w-3 h-3 mr-1" /> End
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black text-white"
            style={{ background: 'linear-gradient(135deg, #800020, #D4AF37)' }}>
            {(user?.full_name || user?.email || 'H').charAt(0).toUpperCase()}
          </div>
          <span className="text-[10px] text-white/50 truncate max-w-[80px]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            {user?.full_name || 'Host'}
          </span>
          <span className="text-white/15 mx-0.5">·</span>
          <Users className="w-3 h-3 shrink-0" style={{ color: '#d4af37' }} />
          <span className="text-[10px] font-bold shrink-0" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>{members.length}/20</span>
          {isHost ? (
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0"
              style={{ background: 'rgba(212,175,55,0.1)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Host
            </span>
          ) : (
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0"
              style={{ background: 'rgba(107,124,74,0.15)', color: '#6B7C4A', border: '1px solid rgba(107,124,74,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Synced
            </span>
          )}
          {isHost ? (
            <span className="ml-auto flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#6DBF7E' }} />
              <span className="text-[11px] font-mono" style={{ color: 'rgba(109,191,126,0.6)' }}>±0ms</span>
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#6DBF7E' }} />
              <span className="text-[11px] font-mono" style={{ color: 'rgba(109,191,126,0.6)' }}>Live Sync ±{Math.abs(syncDrift)}ms</span>
            </span>
          )}
        </div>
      </div>

      {showSyncWarn && !isHost && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2" style={{ background: 'rgba(255,176,0,0.15)', borderBottom: '1px solid rgba(255,176,0,0.3)' }}>
          <span className="text-xs font-bold" style={{ color: '#FFB000' }}>⚠️ Sync lost — tap to resync</span>
          <button onClick={function() { if (syncData) onTimeSync(syncData); else if (party) onTimeSync(party); setShowSyncWarn(false); }}
            className="ml-auto px-3 py-1 rounded-lg text-[10px] font-bold"
            style={{ background: 'rgba(255,176,0,0.25)', color: '#FFB000', border: '1px solid rgba(255,176,0,0.4)' }}>
            Resync
          </button>
        </div>
      )}

      <div className="shrink-0 relative bg-black group" data-video-container style={{ aspectRatio: '16/9', width: '100%' }}>
        {party.video_type === 'youtube' ? (
          <YouTubeEmbed
            videoId={getYouTubeId(party.video_url)}
            isHost={isHost}
            syncData={isHost ? null : (syncData || party)}
            onStateChange={pushState}
          />
        ) : (
          <DirectPlayer
            url={party.video_url}
            isHost={isHost}
            syncData={isHost ? null : (syncData || party)}
            onStateChange={pushState}
          />
        )}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
          <VideoPlayerControls
            playerRef={directVideoRef}
            playerType={party.video_type === 'youtube' ? 'youtube' : 'direct'}
            isHost={isHost}
            isCoHost={false}
            onPlay={() => pushState({ playing: true, currentTime: 0 })}
            onPause={() => pushState({ playing: false, currentTime: 0 })}
            syncStatus={!isHost ? 'synced' : null}
          />
        </div>
        {!isHost && (
          <div className="absolute top-2 right-2 text-white text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1"
            style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(107,124,74,0.3)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#6DBF7E] animate-pulse" />
            Live Sync
          </div>
        )}
      </div>

      <MobileParticipantStrip members={members} hostId={party.host_id} speakingIds={speakingIds} />

      <ViewerRail members={members} hostId={party.host_id} />

      <div className="shrink-0 px-3 py-1.5">
        <PartyHypeMeter partyId={partyId} memberCount={members.length} onHypeChange={setHypeLevel} />
      </div>

      <div className="shrink-0 relative">
        <PartyReactionsOverlay
          partyId={partyId}
          currentUser={user}
          currentTime={syncData?.current_time || party?.current_time || 0}
        />
      </div>

      <LiveEmoticonStorm partyId={partyId} currentUser={user} />

      {/* ── AI Floating Button ── */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setAiPanelOpen(v => !v)}
        style={{
          position: 'fixed', bottom: 80, right: 16, zIndex: 200,
          width: 44, height: 44, borderRadius: '50%',
          background: 'linear-gradient(135deg, #800020, #D4AF37)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 16px rgba(212,175,55,0.2)',
        }}
        title="AI Controls"
      >
        🤖
      </motion.button>

      {/* ── AI Drawer ── */}
      <AnimatePresence>
        {aiPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300,
              background: 'rgba(8,11,24,0.98)', borderTop: '1px solid rgba(212,175,55,0.2)',
              borderRadius: '16px 16px 0 0',
              padding: '16px 20px 32px',
              maxHeight: '80vh', overflowY: 'auto',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 900, color: '#D4AF37', letterSpacing: '0.04em' }}>
                🤖 AI Controls
              </span>
              <button
                onClick={() => setAiPanelOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* ARIA Section */}
            <div style={{
              borderRadius: 12, padding: '14px 16px', marginBottom: 12,
              background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 800, color: '#fff' }}>
                  🤖 ARIA Co-host
                </span>
                <button
                  onClick={() => setWpAriaOn(v => !v)}
                  style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: wpAriaOn ? '#D4AF37' : 'rgba(255,255,255,0.12)',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <motion.div
                    animate={{ x: wpAriaOn ? 18 : 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{ position: 'absolute', top: 2, width: 18, height: 18, borderRadius: 9, background: '#fff' }}
                  />
                </button>
              </div>
              {wpAriaOn && (
                <>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={wpAriaLoading}
                    onClick={generateWpAriaWelcome}
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif', width: '100%', padding: '8px 0',
                      borderRadius: 8, border: '1px solid rgba(212,175,55,0.3)',
                      background: wpAriaLoading ? 'rgba(212,175,55,0.06)' : 'rgba(212,175,55,0.12)',
                      color: '#D4AF37', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em',
                      textTransform: 'uppercase', cursor: wpAriaLoading ? 'not-allowed' : 'pointer',
                      marginBottom: wpAriaMessage ? 8 : 0, opacity: wpAriaLoading ? 0.7 : 1,
                    }}
                  >
                    {wpAriaLoading ? '⏳ Generating…' : '✨ Generate Welcome'}
                  </motion.button>
                  {wpAriaMessage && (
                    <div style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
                    }}>
                      <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, color: '#fff', margin: 0, lineHeight: 1.5 }}>
                        💬 {wpAriaMessage}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Guardian Section */}
            <div style={{
              borderRadius: 12, padding: '14px 16px', marginBottom: 12,
              background: 'rgba(192,57,43,0.05)', border: '1px solid rgba(192,57,43,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 800, color: '#fff' }}>
                  🛡️ Guardian
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 800,
                    padding: '2px 8px', borderRadius: 999, letterSpacing: '0.08em',
                    background: wpGuardianOn ? 'rgba(109,191,126,0.15)' : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${wpGuardianOn ? 'rgba(109,191,126,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: wpGuardianOn ? '#6DBF7E' : 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase',
                  }}>
                    {wpGuardianOn ? 'Active' : 'Off'}
                  </span>
                  <button
                    onClick={() => setWpGuardianOn(v => !v)}
                    style={{
                      width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                      background: wpGuardianOn ? '#6DBF7E' : 'rgba(255,255,255,0.12)',
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}
                  >
                    <motion.div
                      animate={{ x: wpGuardianOn ? 18 : 2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      style={{ position: 'absolute', top: 2, width: 18, height: 18, borderRadius: 9, background: '#fff' }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* AI Music Section */}
            <div style={{
              borderRadius: 12, padding: '14px 16px',
              background: 'rgba(74,138,122,0.05)', border: '1px solid rgba(74,138,122,0.15)',
            }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 10 }}>
                🎵 AI Music
              </span>
              {wpDjTrack ? (
                <div style={{
                  padding: '8px 12px', borderRadius: 8, marginBottom: 10,
                  background: 'rgba(74,138,122,0.08)', border: '1px solid rgba(74,138,122,0.2)',
                }}>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: '#4A8A7A', fontWeight: 700, margin: 0 }}>
                    Now Playing: {wpDjTrack.emoji && `${wpDjTrack.emoji} `}{wpDjTrack.title}
                  </p>
                </div>
              ) : (
                <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>
                  No track active
                </p>
              )}
              <Link to={createPageUrl('AIMusic')} style={{ textDecoration: 'none' }} onClick={() => setAiPanelOpen(false)}>
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif', padding: '8px 0', borderRadius: 8,
                  textAlign: 'center', background: 'rgba(74,138,122,0.1)', border: '1px solid rgba(74,138,122,0.25)',
                  color: '#4A8A7A', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                  cursor: 'pointer',
                }}>
                  Open Music Studio →
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        <div className={`shrink-0 overflow-hidden ${theaterMode ? 'hidden md:block md:w-[160px] relative' : 'hidden md:block'}`}
          style={{ width: theaterMode ? undefined : '220px', borderRight: '1px solid rgba(255,255,255,0.06)', ...(theaterMode ? { position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 10, background: 'rgba(8,11,24,0.95)' } : {}) }}>
          <PanelGrid
            members={members}
            currentUser={user}
            hostId={party.host_id}
            maxSlots={20}
            isHost={isHost}
            onInvite={copyInvite}
            localStream={localStream}
            remoteStreams={remoteStreams}
            peerUserIds={peerUserIds}
            peerQuality={peerQuality}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0d0618' }}>
          <div className="flex shrink-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0B0B18' }}>
            {[
              { id: 'chat',        label: '💬 Chat' },
              { id: 'queue',       label: '🎵 Queue' },
              { id: 'reactions',   label: '⚡ React' },
              { id: 'battle',      label: '⚔️ Battle' },
              { id: 'leaderboard', label: '🏆 Ranks' },
              { id: 'polls',       label: '📊 Polls' },
              ...(isHost ? [{ id: 'analytics', label: '📈 Stats' }] : []),
              { id: 'viewers',     label: '👥 Viewers' },
              { id: 'screen',      label: '🖥️ Screen' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActivePanel(tab.id)}
                className="flex-1 py-2 text-[11px] font-black uppercase transition-all"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  letterSpacing: '0.06em',
                  color: activePanel === tab.id ? '#d4af37' : 'rgba(255,255,255,0.3)',
                  background: activePanel === tab.id ? 'rgba(212,175,55,0.07)' : 'transparent',
                  borderBottom: activePanel === tab.id ? '2px solid #d4af37' : '2px solid transparent',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {activePanel === 'chat' && (
              <>
                <div className="flex items-center justify-between px-1 pt-1">
                  <span className="text-[11px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Live Chat</span>
                  <button
                    onClick={() => {
                      toast.success(`AI Summary: ${members.length} viewers watching. Room has been active for ${Math.round(elapsed / 60)}min. Top reaction: 🔥`);
                    }}
                    className="text-[11px] px-2 py-0.5 rounded-full font-bold transition-all"
                    style={{ border: '1px solid rgba(212,175,55,0.4)', color: '#d4af37', background: 'rgba(212,175,55,0.06)', fontFamily: 'Barlow Condensed, sans-serif' }}
                  >
                    ✨ AI Summary
                  </button>
                </div>
                {isHost && (
                  <HostControls isHost={isHost} party={party} onUpdate={() => {}} />
                )}
                <AggregatedChat roomId={party.room_id || partyId} currentUser={user} isHost={isHost} onMessagesChange={setChatMessages} />
                {members.length < 10 && (
                  <InviteCard partyUrl={window.location.href} />
                )}
              </>
            )}
            {activePanel === 'queue' && (
              <VideoQueuePanel
                partyId={partyId}
                party={party}
                isHost={isHost}
                currentUser={user}
                onPlayVideo={(url) => {
                  if (isHost && party?.id) {
                    base44.entities.WatchParty.update(party.id, { video_url: url, current_time: 0, playback_state: 'paused', updated_at_ms: Date.now() }).catch(() => {});
                  }
                }}
              />
            )}
            {activePanel === 'reactions' && (
              <ReactionsPanel partyId={partyId} />
            )}
            {activePanel === 'polls' && (
              <WatchPartyPoll
                partyId={partyId}
                roomId={party.room_id}
                currentUser={user}
                isHost={isHost}
                onPollLaunched={() => setPollCount(c => c + 1)}
              />
            )}
            {activePanel === 'analytics' && (
              <PartyAnalyticsDashboard
                partyId={partyId}
                isHost={isHost}
              />
            )}
            {activePanel === 'viewers' && (
              <PanelGrid
                members={members}
                currentUser={user}
                hostId={party.host_id}
                maxSlots={20}
                isHost={isHost}
                onInvite={copyInvite}
                localStream={localStream}
                remoteStreams={remoteStreams}
                peerUserIds={peerUserIds}
                peerQuality={peerQuality}
              />
            )}
            {activePanel === 'battle' && (
              <BattleTiers partyId={partyId} currentUser={user} members={members} hostId={party.host_id} />
            )}
            {activePanel === 'leaderboard' && (
              <SocialLeaderboard members={members} />
            )}
            {activePanel === 'screen' && (
              <WatchPartyTab
                roomId={partyId}
                user={user}
                party={party}
                members={members}
                remoteStreams={remoteStreams}
                onSyncEvent={(type, payload) => {
                  if (isHost && party?.id) {
                    base44.entities.WatchParty.update(party.id, {
                      playback_state: type === 'play' ? 'playing' : type === 'pause' ? 'paused' : undefined,
                      current_time: payload?.time,
                      updated_at_ms: Date.now(),
                    }).catch(() => {});
                  }
                }}
                syncEvent={party ? { type: party.playback_state === 'playing' ? 'play' : 'pause', payload: { time: party.current_time }, ts: party.updated_at_ms } : null}
              />
            )}
          </div>
        </div>
      </div>
      <SwanAIRecommendations roomId={partyId} currentLayout="watch" viewerCount={members?.length || 0} />
      <MilestoneAlerts userId={user?.id} roomId={partyId} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {party?.host_id && <ShopDashboard creatorId={party.host_id} />}
      {partyId && <ZEGOGuestApprovalPanel roomId={partyId} isHost={isHost} />}
      {partyId && <ZEGOStreamHealthCard roomId={partyId} />}
      {user && <ZEGOConfigPanel user={user} />}
      {partyId && <RealtimeLeaderboard roomId={partyId} creatorId={party?.host_id || user?.id} />}
      {partyId && <LiveTranscription isLive={true} roomId={partyId} stream={localStream} speaker={user?.full_name} />}
      {partyId && <ViewerControlsPanel roomId={partyId} currentUser={user} onClose={() => {}} />}
      {partyId && user?.id && <VirtualCurrencyTips roomId={partyId} creatorId={party?.host_id || user?.id} currentUser={user} isHost={isHost} />}
      {partyId && <GoldenWall roomId={partyId} />}
      {isHost && partyId && <SwanDirectorHUD roomId={partyId} hostId={user?.id} onOpenPanel={() => {}} />}
      {isHost && partyId && <StreamerGoalsWidget creatorId={party?.host_id || user?.id} roomId={partyId} isCreator={isHost} embedded={true} />}
      {isHost && partyId && <PayPerViewManager roomId={partyId} />}
      {isHost && partyId && <MonetizationDashboard roomId={partyId} />}
      {partyId && <GiftShopTray roomId={partyId} currentUser={user} />}
      {partyId && <GiftLeaderboard roomId={partyId} />}
      {isHost && <SubscriptionManager creatorId={party?.host_id || user?.id} />}
      {partyId && <TipAlert roomId={partyId} recipientId={party?.host_id || user?.id} />}
      {!isHost && partyId && <TippingModal isOpen={false} onClose={() => {}} recipient={null} roomId={partyId} />}
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
      {isHost && <StreamingPresets onApply={() => {}} />}
      {partyId && <EmbedPlayer roomId={partyId} creatorName={user?.full_name || ''} streamTitle={party?.title || 'Watch Party'} viewerCount={members.length} />}
      <LiveTranslationWidget chatMessage={null} onTranslation={() => {}} />
      {isHost && user?.id && <RecordingManager userId={user.id} />}
      {isHost && <OBSBridge />}
      <ZEGOMobileAppBanner />
      {isHost && partyId && <AutomatedClipGenerator streamSession={{room_id: partyId}} isLive={partyId != null} />}
      {partyId && <InteractivePollWidget roomId={partyId} isHost={isHost} />}
      {isHost && <StreamMetadataEditor initialTitle={party?.title || 'Watch Party'} initialCategory={'entertainment'} />}
      {isHost && <StreamerMonetizationCenter />}
      {!isHost && partyId && <AnimatedGiftShop recipientId={party?.host_id || user?.id} roomId={partyId} onClose={() => {}} />}
      {isHost && user?.id && <VirtualGoodsStore userId={user.id} />}
      {isHost && <SoundAlertsManager creatorId={party?.host_id || user?.id} />}
      <ShareToSocial content={{text: ''}} />
      {isHost && partyId && user?.id && <VideoShortRecorder roomId={partyId} creatorId={user.id} />}
      {isHost && <BroadcastAnalyticsDashboard streamSession={null} isLive={partyId != null} />}
      {isHost && partyId && <AutomatedHighlightReels streamSession={{room_id: partyId}} />}
      {partyId && <PerformanceDashboard roomId={partyId} sessionId={partyId} />}
      <StreamHealthDashboard isLive={partyId != null} />
      {!isHost && partyId && <QuickTip recipientId={party?.host_id || user?.id} recipientName={''} onTipSent={() => {}} />}
      {isHost && <LowerThirdsBanner onBannerChange={() => {}} />}
      {isHost && <SceneSwitcher activeScene={'main'} onSceneChange={() => {}} />}
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
      {isHost && <LocalVideoTile stream={localStream} audioEnabled={audioEnabled} videoEnabled={videoEnabled} userName={user?.full_name || ''} isHost={isHost} isSpeaking={localSpeaking} />}
      {isHost && <OctagonalVideoWindow title={'My Camera'} isMuted={!audioEnabled} isVideoOff={!videoEnabled} onMicToggle={toggleAudio} onVideoToggle={toggleVideo} />}
      {isHost && <AudioPanel micMuted={!audioEnabled} onMicToggle={toggleAudio} participants={members} />}
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
      {isHost && partyId && <EnhancedRoomControls isHost={isHost} roomData={party} micMuted={!audioEnabled} onMicToggle={toggleAudio} onAudioSettingsChange={() => {}} />}
      <CollabPlaylist isHost={isHost} currentUser={user} onPlayVideo={() => {}} />
      <YouTubeDiscovery />
      <ActivitySidebar isOpen={false} onClose={() => {}} />
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
      {party && <PreStreamCountdown room={party} currentUser={user} onGoLive={() => {}} />}
      <PrivatePanel isHost={isHost} currentUser={user} />
      {partyId && <StreamChatbot roomId={partyId} isHost={isHost} elapsedSeconds={elapsed} hostName={user?.full_name || ''} room={party} />}
      {partyId && <StreamEventBus roomId={partyId} isHost={isHost} sessionId={partyId} onViewerUpdate={() => {}} onTipReceived={msg => setTipTotal(t => t + Math.floor(msg?.tip_amount || 0))} onMessageReceived={() => {}} />}
      {partyId && <TippingOverlay roomId={partyId} creatorId={party?.host_id || user?.id} isVisible={true} />}
      {partyId && <UnifiedChat roomId={partyId} currentUser={user} isHost={isHost} />}
      {isHost && partyId && <AIPersonaCustomizer roomId={partyId} sessionId={partyId} onCustomized={() => {}} />}
      {isHost && <AudioMixer micMuted={!audioEnabled} onMicToggle={toggleAudio} />}
      {isHost && <EnhancedAudioMixer micMuted={!audioEnabled} onMicToggle={toggleAudio} onAudioSettingsChange={() => {}} />
      {isHost && <ScreenSharePanel isSharing={false} onStartShare={() => {}} onStopShare={() => {}} />}
      {partyId && <AuraEmotionDisplay roomId={partyId} sessionId={partyId} auraPersona={'hype'} />}
      {partyId && <BattleScoreboard roomId={partyId} />}
      {partyId && user?.id && <EnhancedStreamChat roomId={partyId} userId={user.id} userName={user?.full_name || ''} userRole={isHost ? 'host' : 'viewer'} />}
      <GlobalChatWidget />
      {isHost && partyId && <GuestConnector roomId={partyId} roomName={''} />}
      {partyId && <InteractivePollingSystem roomId={partyId} isHost={isHost} currentUser={user} />}
      {partyId && <LeaderboardPanel roomId={partyId} />}
      {partyId && <MobileStreamControls micMuted={!audioEnabled} onMicToggle={toggleAudio} onReact={() => {}} onQuickTip={() => {}} roomId={partyId} />}
      {user?.id && <PointsNotification userId={user.id} />}
      {partyId && user?.id && <EngagementBadgesDisplay roomId={partyId} userId={user.id} creatorId={party?.host_id || user?.id} />}
      {partyId && <ChatOverlay roomId={partyId} isVisible={true} />}
      {partyId && <BattleMode roomId={partyId} isHost={isHost} hostName={user?.full_name || ''} />}
      {isHost && <BitratePresets selected={'auto'} onChange={() => {}} />}
      {isHost && user?.id && <GuestRTMPPanel participantId={user.id} userId={user.id} />}
      {isHost && <GuestStreamMonitor guestName={user?.full_name || ''} isStreaming={partyId != null} />}
      {partyId && <TranscriptionPanel recordingUrl={''} roomTitle={''} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={isHost} currentTips={tipTotal} currentSubs={subCount} currentViewers={members.length} />
      <ViewerCount count={members.length} peakViewers={peakViewers} />
      {isHost && partyId && user?.id && <ClipCreator roomId={partyId} creatorId={user.id} streamTitle={party?.title || ''} elapsedSeconds={elapsed} currentUser={user} />}
      {isHost && partyId && user?.id && <StreamHighlightCapture roomId={partyId} sessionId={partyId} creatorId={user.id} elapsedSeconds={elapsed} isHost={isHost} />}
      {isHost && partyId && <QuickPollLauncher roomId={partyId} hostId={user?.id} isHost={isHost} />}
      {!isHost && partyId && party?.host_id && <GiftTray roomId={partyId} currentUser={user} recipientId={party.host_id} />}
      {isHost && party && <RoomBrandingEditor roomData={party} onBrandingChange={() => {}} isHost={isHost} />}
      <BackgroundCustomizer />
      <WatchPartyCoStreamPanel roomId={partyId} currentUser={user || null} isHost={true} />
      <VideoQueue isHost={isHost} currentUser={user} currentVideoUrl={''} onPlayVideo={() => {}} />
      <NetworkQualityBanner quality={netQuality} rtt={netRtt} />
    </div>
  );
}
