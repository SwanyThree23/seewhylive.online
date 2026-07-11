import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Radio, Zap, AlertTriangle, CheckCircle, Eye, EyeOff, Copy,
  RefreshCw, Power, StopCircle, Cpu, Wifi, Clock, Monitor,
  ChevronDown, X
} from 'lucide-react';
import ZEGOStreamHealthCard from '../components/zego/ZEGOStreamHealthCard';
import ZEGOGoLiveFlow from '../components/zego/ZEGOGoLiveFlow';
import { toast } from 'sonner';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import DestinationsManager from '../components/streaming/DestinationsManager';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import ZEGOGuestApprovalPanel from '../components/zego/ZEGOGuestApprovalPanel';
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
import MerchWidget from '../components/merch/MerchWidget';
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
const GOLD = '#D4AF37';
const BURGUNDY = '#800020';

const PLATFORM_ICONS = {
  youtube:  { icon: '▶', color: '#FF0000', label: 'YouTube' },
  tiktok:   { icon: '♫', color: '#69C9D0', label: 'TikTok' },
  facebook: { icon: 'f', color: '#1877F2', label: 'Facebook' },
  twitch:   { icon: '◉', color: '#9146FF', label: 'Twitch' },
  rumble:   { icon: '◈', color: '#85C742', label: 'Rumble' },
  custom:   { icon: '◎', color: GOLD,       label: 'Custom' },
};

function fmt(ms) {
  if (!ms) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

function StatusBadge({ status }) {
  const cfg = {
    live:        { label: 'LIVE',        bg: 'rgba(109,191,126,0.12)', color: '#6DBF7E', border: 'rgba(109,191,126,0.3)', pulse: true },
    connecting:  { label: 'CONNECTING',  bg: `rgba(212,175,55,0.12)`, color: GOLD, border: `rgba(212,175,55,0.3)`, spin: true },
    offline:     { label: 'OFFLINE',     bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: 'rgba(255,255,255,0.1)' },
    error:       { label: 'ERROR',       bg: 'rgba(255,50,50,0.12)', color: '#C0392B', border: 'rgba(255,50,50,0.3)', flash: true },
  }[status] || { label: status?.toUpperCase(), bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: 'rgba(255,255,255,0.1)' };

  return (
    <span className="flex items-center gap-1 text-[11px] font-black uppercase px-1.5 py-0.5 rounded"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontFamily: 'Barlow Condensed, sans-serif' }}>
      {cfg.pulse && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />}
      {cfg.spin && <RefreshCw className="w-2.5 h-2.5 animate-spin inline-block" />}
      {cfg.flash && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />}
      {cfg.label}
    </span>
  );
}

function BitrateSparkline({ data, degraded }) {
  if (!data?.length) return <div className="h-8 opacity-20 flex items-center justify-center text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No data</div>;
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width="100%" height={28}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" stroke={degraded ? '#C0392B' : GOLD} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function StatPill({ label, value, color }) {
  const c = color || (value === 'OK' ? '#6DBF7E' : value === 'FAIR' ? '#FFD700' : value === 'BAD' ? '#C0392B' : GOLD);
  return (
    <div className="flex flex-col items-center px-2 py-1 rounded"
      style={{ background: `${c}12`, border: `1px solid ${c}25` }}>
      <span className="text-[11px] font-black" style={{ color: c, fontFamily: 'Barlow Condensed, sans-serif' }}>{value}</span>
      <span className="text-[7px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</span>
    </div>
  );
}

function RTMPCard({ dest, health, onToggle, onReconnect }) {
  const platform = dest.platform?.toLowerCase() || 'custom';
  const pCfg = PLATFORM_ICONS[platform] || PLATFORM_ICONS.custom;
  const bitrate = health?.video_bitrate_kbps || 0;
  const target = dest.bitrate_kbps || 4000;
  const bitrateRatio = target > 0 ? (bitrate / target) : 0;
  const bitrateDegraded = bitrateRatio < 0.8;

  const fps = health?.current_fps || 0;
  const latency = health?.network_latency_ms || 0;
  const dropped = health?.dropped_frames_pct || 0;
  const history = health?.bitrate_history || [];

  return (
    <div className="rounded-xl p-4 space-y-3"
      style={{
        background: 'rgba(13,6,24,0.9)',
        border: dest.status === 'live' ? `1px solid rgba(212,175,55,0.3)` : '1px solid rgba(255,255,255,0.08)',
        boxShadow: dest.status === 'live' ? `0 0 20px rgba(212,175,55,0.08)` : 'none',
      }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-black"
            style={{ background: `${pCfg.color}15`, border: `1px solid ${pCfg.color}30`, color: pCfg.color, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {pCfg.icon}
          </div>
          <div>
            <p className="text-[11px] font-bold text-white">{dest.label || pCfg.label}</p>
            <StatusBadge status={dest.status} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {(dest.reconnect_count || 0) > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded font-bold"
              style={{ background: 'rgba(255,165,0,0.15)', color: '#FFA500', border: '1px solid rgba(255,165,0,0.3)' }}>
              ⚠ {dest.reconnect_count} reconnects
            </span>
          )}
          {/* Toggle */}
          <button onClick={() => onToggle(dest)}
            className="w-9 h-5 rounded-full relative transition-all"
            style={{ background: dest.is_enabled ? GOLD : 'rgba(255,255,255,0.1)' }}>
            <motion.div animate={{ x: dest.is_enabled ? 16 : 2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute top-0.5 w-4 h-4 rounded-full"
              style={{ background: dest.is_enabled ? '#000' : 'rgba(255,255,255,0.4)' }} />
          </button>
        </div>
      </div>

      {/* Bitrate bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>BITRATE</span>
          <span className="text-[11px] font-bold" style={{ color: bitrateDegraded ? '#C0392B' : GOLD }}>
            {bitrate.toLocaleString()} / {target.toLocaleString()} kbps
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: bitrateDegraded ? '#C0392B' : GOLD }}
            animate={{ width: `${Math.min(100, bitrateRatio * 100)}%` }}
            transition={{ duration: 0.5 }} />
        </div>
        <div className="mt-1.5">
          <BitrateSparkline data={history} degraded={bitrateDegraded} />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-1.5">
        <StatPill label="FPS" value={fps > 0 ? String(fps) : '--'} color={fps >= 29 ? '#6DBF7E' : fps >= 24 ? '#FFD700' : '#C0392B'} />
        <StatPill label="LATENCY" value={latency > 0 ? `${latency}ms` : '--'} color={latency < 100 ? '#6DBF7E' : latency < 300 ? '#FFD700' : '#C0392B'} />
        <StatPill label="DROPPED" value={dropped > 0 ? `${dropped.toFixed(1)}%` : '0%'} color={dropped < 0.5 ? '#6DBF7E' : dropped < 2 ? '#FFD700' : '#C0392B'} />
      </div>

      {/* Force reconnect */}
      <button onClick={() => onReconnect(dest)}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
        <RefreshCw className="w-3 h-3" /> Force Reconnect
      </button>
    </div>
  );
}

function EndStreamModal({ onConfirm, onCancel }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: 'rgba(13,6,24,0.9)', border: `1px solid rgba(128,0,32,0.4)` }}>
        <div className="flex items-center gap-3">
          <StopCircle className="w-8 h-8 text-red-400" />
          <h3 className="font-black text-lg uppercase" style={{ color: '#ff6680', fontFamily: 'Barlow Condensed, sans-serif' }}>End Stream?</h3>
        </div>
        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>This will end the live stream for all viewers. This action cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl font-black uppercase text-[11px]"
            style={{ background: BURGUNDY, color: GOLD, border: `1px solid rgba(212,175,55,0.3)`, fontFamily: 'Barlow Condensed, sans-serif' }}>
            End Stream
          </button>
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-black uppercase text-[11px]"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ControlRoomPage() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room_id');
  const qc = useQueryClient();

  const [showStreamKey, setShowStreamKey] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [uptime, setUptime] = useState(0);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: room } = useQuery({
    queryKey: ['cr-room', roomId],
    queryFn: () => base44.entities.Room.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
    refetchInterval: 8000,
  });
  const { data: destinations = [] } = useQuery({
    queryKey: ['cr-rtmp', user?.id],
    queryFn: () => base44.entities.RTMPDestination.filter({ creator_id: user.id }),
    enabled: !!user?.id,
    refetchInterval: 5000,
  });
  const { data: session } = useQuery({
    queryKey: ['cr-session', roomId],
    queryFn: () => base44.entities.StreamSession.filter({ room_id: roomId }).then(r => r[0]),
    enabled: !!roomId,
    refetchInterval: 10000,
  });
  const { data: healthMetrics = [] } = useQuery({
    queryKey: ['cr-health', roomId],
    queryFn: () => base44.entities.StreamHealthMetric?.filter ? base44.entities.StreamHealthMetric.filter({ room_id: roomId }, '-created_date', 20) : Promise.resolve([]),
    enabled: !!roomId,
    refetchInterval: 5000,
  });

  // Uptime counter
  useEffect(() => {
    if (!session?.started_at) return;
    const iv = setInterval(() => {
      setUptime(Date.now() - new Date(session.started_at).getTime());
    }, 1000);
    return () => clearInterval(iv);
  }, [session?.started_at]);

  const toggleDest = useMutation({
    mutationFn: (dest) => base44.entities.RTMPDestination.update(dest.id, { is_enabled: !dest.is_enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cr-rtmp', user?.id] }),
    onError: () => toast.error('Action failed.'),
  });
  const reconnectDest = useMutation({
    mutationFn: (dest) => base44.entities.RTMPDestination.update(dest.id, { status: 'connecting', reconnect_count: (dest.reconnect_count || 0) + 1 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cr-rtmp', user?.id] }); toast.success('Reconnecting…'); },
    onError: () => toast.error('Action failed.'),
  });
  const goLiveMut = useMutation({
    mutationFn: async () => {
      // Update room & session status
      await base44.entities.Room.update(roomId, { status: 'live', started_at: new Date().toISOString() });
      if (session?.id) await base44.entities.StreamSession.update(session.id, { started_at: new Date().toISOString(), status: 'live' });
      
      // Distribute to enabled RTMP destinations
      const enabledDests = destinations.filter(d => d.is_enabled);
      if (enabledDests.length > 0 && user?.id) {
        await base44.functions.invoke('distributeStreamToRTMP', {
          room_id: roomId,
          creator_id: user.id,
          destinations: enabledDests.map(d => ({ id: d.id, platform: d.platform, label: d.label })),
        });
      }
    },
    onError: () => toast.error('Action failed.'),
  });
  const endStreamMut = useMutation({
    mutationFn: async () => {
      await base44.entities.Room.update(roomId, { status: 'ended', ended_at: new Date().toISOString() });
      if (session?.id) await base44.entities.StreamSession.update(session.id, { ended_at: new Date().toISOString(), status: 'ended' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cr-room', roomId] });
      setShowEndModal(false);
      toast.success('Stream ended.');
      if (user?.id) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'room_ended',
          title: `Stream ended via Control Room`,
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Action failed.'),
  });

  const latestHealth = healthMetrics[0];
  const liveCount = destinations.filter(d => d.status === 'live').length;
  const enabledCount = destinations.filter(d => d.is_enabled).length;
  const hasError = destinations.some(d => d.status === 'error');
  const hasDegraded = destinations.some(d => d.status !== 'live' && d.is_enabled);
  const overallHealth = hasError ? 'CRITICAL' : hasDegraded ? 'DEGRADED' : 'ALL HEALTHY';
  const healthColor = overallHealth === 'ALL HEALTHY' ? '#6DBF7E' : overallHealth === 'DEGRADED' ? GOLD : '#C0392B';
  const streamKey = session?.stream_key || 'sk-live-XXXXXXXXXXXX';
  const isLive = room?.status === 'live';

  return (
    <div className="min-h-screen" style={{ background: '#080B18' }}>
      <AnimatePresence>
        {showEndModal && <EndStreamModal onConfirm={() => endStreamMut.mutate()} onCancel={() => setShowEndModal(false)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 md:px-8 py-4 flex items-center justify-between"
        style={{ background: 'rgba(13,6,24,0.9)', borderBottom: `1px solid rgba(212,175,55,0.12)` }}>
        <div className="flex items-center gap-2.5">
          <Monitor className="w-5 h-5" style={{ color: GOLD }} />
          <span className="font-black uppercase tracking-widest text-sm" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Control Room
          </span>
          {room && <span className="text-[10px] px-2 py-0.5 rounded" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)' }}>{room.title}</span>}
        </div>
        <div className="flex items-center gap-2">
          {!isLive ? (
            <ZEGOGoLiveFlow roomId={roomId} userId={user?.id} onLive={() => goLiveMut.mutate()}>
              <motion.button whileTap={{ scale: 0.96 }}
                disabled={goLiveMut.isPending}
                className="flex items-center gap-2 px-5 py-2 rounded-xl font-black uppercase text-[12px]"
                style={{ background: BURGUNDY, color: GOLD, border: `1px solid rgba(212,175,55,0.4)`, boxShadow: `0 0 20px rgba(128,0,32,0.4)`, fontFamily: 'Barlow Condensed, sans-serif' }}>
                <Radio className="w-4 h-4" /> GO LIVE
              </motion.button>
            </ZEGOGoLiveFlow>
          ) : (
            <button onClick={() => setShowEndModal(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-black uppercase text-[12px]"
              style={{ background: 'rgba(255,50,50,0.15)', color: '#C0392B', border: '1px solid rgba(255,50,50,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              <StopCircle className="w-4 h-4" /> END STREAM
            </button>
          )}
        </div>
      </div>

      {/* Health Summary Bar */}
      <div className="px-4 md:px-8 py-3 flex flex-wrap items-center gap-4"
        style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: healthColor }} />
          <span className="text-[10px] font-black uppercase" style={{ color: healthColor, fontFamily: 'Barlow Condensed, sans-serif' }}>{overallHealth}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <Radio className="w-3 h-3" /> <span>{liveCount}/{enabledCount} destinations</span>
        </div>
        <div className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <Clock className="w-3 h-3" />
          <span className="font-mono">{fmt(uptime)}</span>
        </div>
        {latestHealth?.cpu_usage_pct != null && (
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3" style={{ color: GOLD }} />
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full" style={{ width: `${latestHealth.cpu_usage_pct}%`, background: latestHealth.cpu_usage_pct > 85 ? '#C0392B' : GOLD }} />
            </div>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{latestHealth.cpu_usage_pct}%</span>
          </div>
        )}
        {/* Stream key — only show when a real session key exists */}
        {session?.stream_key && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {showStreamKey ? session.stream_key : '●'.repeat(Math.min(session.stream_key.length, 16))}
            </span>
            <button onClick={() => setShowStreamKey(s => !s)}>
              {showStreamKey ? <EyeOff className="w-3 h-3 text-white/40" /> : <Eye className="w-3 h-3 text-white/40" />}
            </button>
            <button onClick={() => { navigator.clipboard.writeText(session.stream_key).then(() => toast.success('Stream key copied!')).catch(() => toast.error('Copy failed.')); }}>
              <Copy className="w-3 h-3 text-white/40" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Tools Toolbar */}
      <div className="px-4 md:px-8 py-2 flex items-center gap-2 flex-wrap"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.07)' }}>
        {[
          { label: '🎨 Scenes',       page: 'SceneTemplates',       color: 'rgba(212,175,55,0.12)' },
          { label: '🔔 Alerts',       page: 'StreamAlerts',         color: 'rgba(212,133,74,0.12)' },
          { label: '🛡️ Guardian AI',  page: 'GuardianAI',           color: 'rgba(192,57,43,0.12)' },
          { label: '📡 Multi-Stream', page: 'MultiStreamManager',   color: 'rgba(109,191,126,0.1)' },
          { label: '📊 Analytics',    page: 'AdvancedAnalytics',    color: 'rgba(212,175,55,0.08)' },
          { label: '📅 Schedule',     page: 'StreamScheduler',      color: 'rgba(107,124,74,0.12)' },
          { label: '📝 Captions',     page: 'TranscriptionStudio',  color: 'rgba(74,124,89,0.12)'  },
        ].map(t => (
          <Link key={t.page} to={createPageUrl(t.page)} style={{ textDecoration: 'none' }}>
            <button className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg"
              style={{ background: t.color, border: '1px solid rgba(212,175,55,0.2)', color: GOLD, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
              {t.label}
            </button>
          </Link>
        ))}
      </div>

      {/* ZEGOCLOUD Health Card */}
      {roomId && (
        <div className="px-4 md:px-8 pt-4">
          <ZEGOStreamHealthCard roomId={roomId} />
        </div>
      )}

      {/* Destinations Manager */}
      <div className="p-4 md:p-8">
        <DestinationsManager userId={user?.id} />
      </div>

      {/* RTMP Cards Grid */}
      {destinations.length > 0 && (
        <div className="px-4 md:px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {destinations.map(dest => (
              <RTMPCard
                key={dest.id}
                dest={dest}
                health={healthMetrics.find(h => h.destination_id === dest.id) || latestHealth}
                onToggle={(d) => toggleDest.mutate(d)}
                onReconnect={(d) => reconnectDest.mutate(d)}
              />
            ))}
          </div>
        </div>
      )}
      <SwanAIRecommendations roomId={roomId} currentLayout="control" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={roomId} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      {roomId && <ZEGOGuestApprovalPanel roomId={roomId} isHost={true} />}
      {roomId && <ZEGOStreamHealthCard roomId={roomId} />}
      {user && <ZEGOConfigPanel user={user} />}
      {roomId && <RealtimeLeaderboard roomId={roomId} creatorId={user?.id} />}
      {roomId && <LiveTranscription isLive={true} roomId={roomId} />}
      {roomId && <ViewerControlsPanel roomId={roomId} currentUser={user} onClose={() => {}} />}
      {roomId && user?.id && <VirtualCurrencyTips roomId={roomId} creatorId={user?.id} currentUser={user} isHost={true} />}
      {roomId && <GoldenWall roomId={roomId} />}
      {roomId && <SwanDirectorHUD roomId={roomId} hostId={user?.id} onOpenPanel={() => {}} />}
      {roomId && <StreamerGoalsWidget creatorId={user?.id} roomId={roomId} isCreator={true} embedded={true} />}
      {roomId && <PayPerViewManager roomId={roomId} />}
      {roomId && <MonetizationDashboard roomId={roomId} />}
      {roomId && <GiftShopTray roomId={roomId} currentUser={user} />}
      {roomId && <GiftLeaderboard roomId={roomId} />}
      {<SubscriptionManager creatorId={user?.id} />}
      {roomId && <TipAlert roomId={roomId} recipientId={user?.id} />}
      {!true && roomId && <TippingModal isOpen={false} onClose={() => {}} recipient={null} roomId={roomId} />}
      {roomId && <LiveAuctionWidget creatorId={user?.id} roomId={roomId} isCreator={true} currentUser={user} />}
      <MerchWidget />
      <NotificationBell />
      {roomId && <PKBattleInterface roomId={roomId} />}
      {roomId && <CoStreamPanel roomId={roomId} />}
      {roomId && <CollaborativeWhiteboard roomId={roomId} />}
      {roomId && user?.id && <PointsEarnWidget userId={user.id} creatorId={user?.id} roomId={roomId} isHost={true} />}
      {roomId && <RedemptionQueue creatorId={user?.id} roomId={roomId} />}
      {roomId && <RewardShop creatorId={user?.id} roomId={roomId} currentUser={user} />}
      {!true && user?.id && <ViewerLoyaltyCard userId={user.id} creatorId={user?.id} compact={true} />}
      {roomId && <GreenroomQueue roomId={roomId} isHost={true} />}
      {<StreamingPresets onApply={() => {}} />}
      {roomId && <EmbedPlayer roomId={roomId} creatorName={user?.full_name || ''} streamTitle={room?.title || 'Control Room'} viewerCount={0} />}
      <LiveTranslationWidget chatMessage={null} onTranslation={() => {}} />
      {user?.id && <RecordingManager userId={user.id} />}
      {<OBSBridge />}
      <ZEGOMobileAppBanner />
      {roomId && <AutomatedClipGenerator streamSession={{room_id: roomId}} isLive={roomId != null} />}
      {roomId && <InteractivePollWidget roomId={roomId} isHost={true} />}
      {<StreamMetadataEditor initialTitle={room?.title || 'Control Room'} initialCategory={'entertainment'} />}
      {<StreamerMonetizationCenter />}
      {!true && roomId && <AnimatedGiftShop recipientId={user?.id} roomId={roomId} onClose={() => {}} />}
      {user?.id && <VirtualGoodsStore userId={user.id} />}
      {<SoundAlertsManager creatorId={user?.id} />}
      <ShareToSocial content={{text: ''}} />
      {roomId && user?.id && <VideoShortRecorder roomId={roomId} creatorId={user.id} />}
      {<BroadcastAnalyticsDashboard streamSession={null} isLive={roomId != null} />}
      {roomId && <AutomatedHighlightReels streamSession={{room_id: roomId}} />}
      {roomId && <PerformanceDashboard roomId={roomId} sessionId={roomId} />}
      <StreamHealthDashboard isLive={roomId != null} />
      {!true && roomId && <QuickTip recipientId={user?.id} recipientName={''} onTipSent={() => {}} />}
      {<LowerThirdsBanner onBannerChange={() => {}} />}
      {<SceneSwitcher activeScene={'main'} onSceneChange={() => {}} />}
      <NotificationHub />
      {<SoundboardWidget isVisible={true} />}
      {roomId && <RaidPanelButton room={room} currentUser={user} isHost={true} />}
      {roomId && <LiveAudiencePulse roomId={roomId} isHost={true} viewerCount={0} />}
      {roomId && <StreamAnalyticsDashboard roomId={roomId} />}
      {roomId && <AIStreamSummary roomId={roomId} isHost={true} streamTitle={room?.title || ''} viewerCount={0} elapsedSeconds={0} />}
      {<ChatModeration collapsed={true} />}
      <BrandChyron />
      {!true && roomId && user?.id && <WhisperPanel roomId={roomId} currentUser={user} recipientId={user?.id} recipientName={''} onClose={() => {}} />}
      <HostAlertCenter />
      {roomId && <AICopilotSidebar roomId={roomId} isHost={true} viewerCount={0} />}
      {roomId && <EnhancedPollingSystem roomId={roomId} hostId={user?.id} isHost={true} />}
      {roomId && user?.id && <SuperChatBar roomId={roomId} currentUser={user} recipientId={user?.id} recipientName={''} />}
      {user?.id && <SwanyBotEnhanced userId={user.id} conversationId={null} onContextReady={() => {}} />}
      {<LocalVideoTile stream={null} audioEnabled={true} videoEnabled={true} userName={user?.full_name || ''} isHost={true} />}
      {<OctagonalVideoWindow title={'My Camera'} isMuted={false} isVideoOff={false} onMicToggle={() => {}} onVideoToggle={() => {}} />}
      {<AudioPanel micMuted={false} onMicToggle={() => {}} participants={[]} />}
      {<EvmuxWebSource isActive={false} onClose={() => {}} />}
      {roomId && <LivePollOverlay roomId={roomId} currentUser={user} isHost={true} position={'bottom-left'} />}
      {<StripeConnectButton creatorId={user?.id} />}
      {!true && user?.id && <StripeSubscribeButton creatorId={user?.id} creatorName={''} currentUserId={user.id} />}
      {<SubscriptionTiers communityId={null} userId={user?.id} />}
      {room && <WatchPartyAnalytics party={room} members={[]} pollCount={0} reactionCount={0} />}
      {roomId && user?.id && <ZEGOGuestJoin roomId={roomId} userId={user.id} userName={user?.full_name || ''} onJoined={() => {}} />}
      {roomId && <PaymentMethodSelector creatorId={user?.id} roomId={roomId} onPaymentComplete={() => {}} />}
      {<CreatorTierManager creatorId={user?.id} />}
      {user?.id && <TierBadge tier={null} size={'sm'} showName={false} />}
      {user?.id && <LoyaltyBadge userId={user.id} creatorId={user?.id} />}
      {roomId && <GuestGrid participants={[]} isHost={true} onInvite={() => {}} hostId={user?.id} />}
      {roomId && <EnhancedRoomControls isHost={true} roomData={room} micMuted={false} onMicToggle={() => {}} onAudioSettingsChange={() => {}} />}
      <CollabPlaylist isHost={true} currentUser={user} onPlayVideo={() => {}} />
      <YouTubeDiscovery />
      <ActivitySidebar isOpen={false} onClose={() => {}} />
      <GlobalSearch onClose={() => {}} />
      {roomId && <PayPerViewGate roomId={roomId} ppvPrice={4.99} onPurchase={() => {}} />}
      <PaywallGate isHost={true} streamTitle={room?.title || ''} onUnlock={() => {}} isUnlocked={true} />
      {roomId && <SubscriptionGate creatorId={user?.id} roomId={roomId} />}
      {roomId && <ModerationAppealPanel flagId={null} messageId={null} roomId={roomId} onClose={() => {}} />}
      {user?.id && <GuestDestinationsPanel participantUserId={user.id} guestName={user?.full_name || ''} />}
      {<GuestStreamingPermissions participant={null} isHost={true} onPermissionChange={() => {}} />}
      {roomId && <MultiStreamConfig roomId={roomId} isHost={true} />}
      {roomId && <VdoNinjaGuestLink roomId={roomId} />}
      <WebRTCSetupBanner error={null} audioEnabled={true} videoEnabled={true} onRetry={() => {}} />
      {roomId && <WebhookHooks roomId={roomId} isHost={true} />}
      {<PKBattleSoundboard battleId={roomId} isBattleActive={roomId != null} />}
      <PanelMusicPlayer />
      {roomId && <PollLaunchBar roomId={roomId} hostId={user?.id} activePoll={null} isHost={true} />}
      {room && <PreStreamCountdown room={room} currentUser={user} onGoLive={() => {}} />}
      <PrivatePanel isHost={true} currentUser={user} />
      {roomId && <StreamChatbot roomId={roomId} isHost={true} elapsedSeconds={0} hostName={user?.full_name || ''} room={room} />}
      {roomId && <StreamEventBus roomId={roomId} isHost={true} sessionId={roomId} onViewerUpdate={() => {}} onTipReceived={() => {}} onMessageReceived={() => {}} />}
      {roomId && <TippingOverlay roomId={roomId} creatorId={user?.id} isVisible={true} />}
      {roomId && <UnifiedChat roomId={roomId} currentUser={user} isHost={true} />}
      {roomId && <AIPersonaCustomizer roomId={roomId} sessionId={roomId} onCustomized={() => {}} />}
      {<AudioMixer micMuted={false} onMicToggle={() => {}} />}
      {<EnhancedAudioMixer micMuted={false} onMicToggle={() => {}} onAudioSettingsChange={() => {}} />}
      {<ScreenSharePanel isSharing={false} onStartShare={() => {}} onStopShare={() => {}} />}
      {roomId && <AuraEmotionDisplay roomId={roomId} sessionId={roomId} auraPersona={'hype'} />}
      {roomId && <BattleScoreboard roomId={roomId} />}
      {roomId && user?.id && <EnhancedStreamChat roomId={roomId} userId={user.id} userName={user?.full_name || ''} userRole={true ? 'host' : 'viewer'} />}
      <GlobalChatWidget />
      {roomId && <GuestConnector roomId={roomId} roomName={''} />}
      {roomId && <InteractivePollingSystem roomId={roomId} isHost={true} currentUser={user} />}
      {roomId && <LeaderboardPanel roomId={roomId} />}
      {roomId && <MobileStreamControls micMuted={false} onMicToggle={() => {}} onReact={() => {}} onQuickTip={() => {}} roomId={roomId} />}
      {user?.id && <PointsNotification userId={user.id} />}
      {roomId && user?.id && <EngagementBadgesDisplay roomId={roomId} userId={user.id} creatorId={user?.id} />}
      {roomId && <ChatOverlay roomId={roomId} isVisible={true} />}
      {roomId && <BattleMode roomId={roomId} isHost={true} hostName={user?.full_name || ''} />}
      {<BitratePresets selected={'auto'} onChange={() => {}} />}
      {user?.id && <GuestRTMPPanel participantId={user.id} userId={user.id} />}
      {<GuestStreamMonitor guestName={user?.full_name || ''} isStreaming={roomId != null} />}
      {roomId && <TranscriptionPanel recordingUrl={''} roomTitle={''} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <ViewerCount count={0} peakViewers={0} />
      {roomId && user?.id && <ClipCreator roomId={roomId} creatorId={user.id} streamTitle={room?.title || ''} elapsedSeconds={0} currentUser={user} />}
      {roomId && user?.id && <StreamHighlightCapture roomId={roomId} sessionId={roomId} creatorId={user.id} elapsedSeconds={0} isHost={true} />}
      {roomId && <QuickPollLauncher roomId={roomId} hostId={user?.id} isHost={true} />}
      {room && <RoomBrandingEditor roomData={room} onBrandingChange={() => {}} isHost={true} />}
      <BackgroundCustomizer />
    </div>
  );
}