import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  CheckCircle, ChevronDown, ChevronUp, Settings,
  Eye, EyeOff, Users, ArrowRight, X, Clock, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import DevicePreview from '../components/greenroom/DevicePreview';
import GreenroomWaitlistPanel from '../components/greenroom/GreenroomWaitlistPanel';
import SelectSheet from '../components/shared/SelectSheet';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import ZEGOGuestApprovalPanel from '../components/zego/ZEGOGuestApprovalPanel';
import ZEGOConfigPanel from '../components/zego/ZEGOConfigPanel';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';

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
import ClipCreator from '../components/live/ClipCreator';
import RealtimeLeaderboard from '../components/live/RealtimeLeaderboard';
import ViewerControlsPanel from '../components/live/ViewerControlsPanel';
import VirtualCurrencyTips from '../components/live/VirtualCurrencyTips';
import StreamHighlightCapture from '../components/live/StreamHighlightCapture';
import GoldenWall from '../components/live/GoldenWall';
import QuickPollLauncher from '../components/live/QuickPollLauncher';
import GiftTray from '../components/live/GiftTray';
import RoomBrandingEditor from '../components/live/RoomBrandingEditor';
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

const DEST_COLORS = {
  room:        { label: 'ROOM',        bg: 'rgba(212,175,55,0.15)',  color: GOLD,      border: 'rgba(212,175,55,0.35)' },
  panel:       { label: 'PANEL',       bg: 'rgba(212,133,74,0.15)', color: '#D4854A', border: 'rgba(212,133,74,0.35)' },
  watch_party: { label: 'WATCH PARTY', bg: 'rgba(128,0,32,0.15)',   color: '#C0395A', border: 'rgba(128,0,32,0.35)' },
  new_room:    { label: 'NEW ROOM',    bg: 'rgba(201,168,76,0.12)', color: GOLD,      border: 'rgba(201,168,76,0.3)' },
};

const ROLES = ['audience', 'speaker', 'guest', 'co-host'];

function PermissionPill({ label, status }) {
  const cfg = {
    granted: { color: '#6DBF7E', border: 'rgba(109,191,126,0.3)', icon: '✓' },
    denied:  { color: '#C0392B', border: 'rgba(255,68,68,0.3)',  icon: '✗' },
    prompt:  { color: '#FFD700', border: 'rgba(255,215,0,0.3)',  icon: '…' },
  }[status] || { color: 'rgba(255,255,255,0.3)', border: 'rgba(255,255,255,0.1)', icon: '?' };

  return (
    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-black uppercase"
      style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.border}`, color: cfg.color, fontFamily: 'Barlow Condensed, sans-serif' }}>
      {cfg.icon} {label}
    </span>
  );
}

function WaitingRoom({ waitlistEntry, onCancel }) {
  const [elapsed, setElapsed] = useState(0);
  const qc = useQueryClient();

  useEffect(() => {
    const iv = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  // Poll for admission
  const { data: entry } = useQuery({
    queryKey: ['greenroom-wl-status', waitlistEntry?.id],
    queryFn: () => base44.entities.GreenroomWaitlist.filter({ id: waitlistEntry.id }).then(r => r[0]),
    enabled: !!waitlistEntry?.id,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (!entry) return;
    if (entry.status === 'admitted') {
      toast.success('You\'ve been admitted!');
      const roomId = new URLSearchParams(window.location.search).get('room_id');
      window.location.href = `/LiveRoom?id=${roomId}`;
    }
    if (entry.status === 'denied') {
      toast.error('The host isn\'t admitting new guests right now');
    }
  }, [entry?.status]);

  const cancelMut = useMutation({
    mutationFn: () => base44.entities.GreenroomWaitlist.update(waitlistEntry.id, { status: 'cancelled' }),
    onError: () => toast.error('Failed to cancel. Please try again.'),
    onSuccess: () => onCancel(),
  });

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const isDenied = entry?.status === 'denied';

  if (isDenied) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 p-8 text-center rounded-2xl"
        style={{ background: 'rgba(128,0,32,0.12)', border: `1px solid rgba(128,0,32,0.3)` }}>
        <X className="w-12 h-12 text-red-400" />
        <div>
          <h3 className="font-black text-lg uppercase" style={{ color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif' }}>Not Admitted</h3>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>The host isn't admitting new guests right now.</p>
          {entry?.deny_reason && <p className="text-[11px] mt-1 italic" style={{ color: 'rgba(255,255,255,0.3)' }}>"{entry.deny_reason}"</p>}
        </div>
        <Link to="/Discover">
          <button className="px-6 py-2 rounded-xl font-black uppercase text-[11px]"
            style={{ background: `rgba(212,175,55,0.12)`, border: `1px solid rgba(212,175,55,0.3)`, color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Browse Other Rooms
          </button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-5 p-8 text-center rounded-2xl"
      style={{ background: '#1A1A1A', border: `1px solid rgba(212,175,55,0.2)` }}>
      {/* Spinning ring */}
      <div className="relative w-20 h-20">
        <motion.div className="absolute inset-0 rounded-full"
          style={{ border: `2px solid rgba(212,175,55,0.15)` }} />
        <motion.div className="absolute inset-0 rounded-full"
          style={{ border: `2px solid transparent`, borderTopColor: GOLD }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} />
        <div className="absolute inset-2 rounded-full overflow-hidden">
          <div className="w-full h-full flex items-center justify-center font-black text-xl"
            style={{ background: BURGUNDY, color: GOLD }}>
            {(waitlistEntry?.user_name || 'U')[0]}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-black text-xl uppercase tracking-wide"
          style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
          Waiting for Host
        </h3>
        <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Waiting for host to admit you...</p>
      </div>

      <div className="flex items-center gap-4">
        {waitlistEntry?.position && (
          <div className="px-3 py-2 rounded-xl text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="font-black text-xl" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
              #{waitlistEntry.position}
            </div>
            <div className="text-[11px] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>in queue</div>
          </div>
        )}
        <div className="px-3 py-2 rounded-xl text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="font-black text-xl font-mono" style={{ color: GOLD }}>
            {fmt(elapsed)}
          </div>
          <div className="text-[11px] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>wait time</div>
        </div>
      </div>

      {waitlistEntry?.join_message && (
        <p className="text-[11px] italic px-4 py-2 rounded-xl"
          style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          "{waitlistEntry.join_message}"
        </p>
      )}

      <button onClick={() => cancelMut.mutate()}
        className="px-5 py-2 rounded-xl font-black uppercase text-[10px] transition-all"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
        Cancel &amp; Leave Queue
      </button>
    </motion.div>
  );
}

export default function GreenroomPage() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room_id');
  const destType = params.get('destination_type') || 'room'; // room | panel | watch_party | new_room

  const qc = useQueryClient();
  const [deviceState, setDeviceState] = useState({ cameraOn: false, micOn: false, networkQuality: 3, isSim: false });
  const [displayName, setDisplayName] = useState('');
  const [roleRequested, setRoleRequested] = useState('audience');
  const [joinMessage, setJoinMessage] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [videoQuality, setVideoQuality] = useState('720p');
  const [echoCancel, setEchoCancel] = useState(true);
  const [noiseCancel, setNoiseCancel] = useState(true);
  const [bgBlur, setBgBlur] = useState(false);
  const [bypassDeviceCheck, setBypassDeviceCheck] = useState(false);
  const [permissions, setPermissions] = useState({ camera: 'prompt', mic: 'prompt', speaker: 'granted' });
  const [waitlistEntry, setWaitlistEntry] = useState(null);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('other');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: room } = useQuery({
    queryKey: ['greenroom-target', roomId],
    queryFn: () => base44.entities.Room.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId && destType !== 'new_room',
  });

  useEffect(() => {
    if (user?.full_name) setDisplayName(user.full_name);
  }, [user?.full_name]);

  // Check permissions
  useEffect(() => {
    const check = async () => {
      if (!navigator.permissions) return;
      const cam = await navigator.permissions.query({ name: 'camera' }).catch(() => ({ state: 'prompt' }));
      const mic = await navigator.permissions.query({ name: 'microphone' }).catch(() => ({ state: 'prompt' }));
      setPermissions(p => ({ ...p, camera: cam.state, mic: mic.state }));
    };
    check();
  }, []);

  useEffect(() => {
    if (deviceState.cameraOn) setPermissions(p => ({ ...p, camera: 'granted' }));
    if (deviceState.micOn) setPermissions(p => ({ ...p, mic: 'granted' }));
  }, [deviceState.cameraOn, deviceState.micOn]);

  const deviceCheckPassed = (deviceState.cameraOn || deviceState.micOn) || bypassDeviceCheck;
  const destCfg = DEST_COLORS[destType] || DEST_COLORS.room;
  const isHost = room?.host_id === user?.id || destType === 'new_room' || (!roomId && (destType === 'room' || destType === 'panel'));

  const readyMut = useMutation({
    mutationFn: async () => {
      // Create/upsert GreenroomSession
      const sessionData = {
        user_id: user.id,
        user_name: displayName || user.full_name || user.email,
        room_id: roomId || '',
        destination_type: destType,
        camera_enabled: deviceState.cameraOn,
        mic_enabled: deviceState.micOn,
        network_quality: ['poor', 'poor', 'fair', 'good', 'excellent'][deviceState.networkQuality] || 'good',
        video_quality: videoQuality,
        device_check_passed: deviceCheckPassed,
        permissions_granted: permissions,
        role_requested: roleRequested,
        join_message: joinMessage,
        status: 'ready',
        ready_at: new Date().toISOString(),
        display_name_override: displayName,
      };
      let session;
      try { session = await base44.entities.GreenroomSession.create(sessionData); } catch { session = { id: null }; }

      if (destType === 'new_room') {
        const newRoom = await base44.entities.Room.create({
          title: newRoomTitle || 'New Room',
          type: 'video',
          host_id: user.id,
          status: 'scheduled',
          category: newRoomCategory,
          is_public: true,
        });
        return { action: 'navigate', path: `/LiveRoom?id=${newRoom.id}` };
      }

      if (destType === 'watch_party') {
        return { action: 'navigate', path: `/WatchParty?id=${roomId}` };
      }

      // room or panel — create waitlist entry
      const existingWL = await base44.entities.GreenroomWaitlist.filter({ room_id: roomId, user_id: user.id, status: 'waiting' });
      let wlEntry;
      if (existingWL.length > 0) {
        wlEntry = existingWL[0];
      } else {
        const allWaiting = await base44.entities.GreenroomWaitlist.filter({ room_id: roomId, status: 'waiting' });
        wlEntry = await base44.entities.GreenroomWaitlist.create({
          room_id: roomId,
          user_id: user.id,
          user_name: displayName || user.full_name || user.email,
          avatar_url: user.avatar_url || '',
          role_requested: roleRequested,
          join_message: joinMessage,
          status: 'waiting',
          position: allWaiting.length + 1,
          greenroom_session_id: session?.id || '',
          notified_at: new Date().toISOString(),
        });
      }
      return { action: 'wait', wlEntry };
    },
    onSuccess: (result) => {
      if (result.action === 'navigate') {
        window.location.href = result.path;
      } else if (result.action === 'wait') {
        setWaitlistEntry(result.wlEntry);
      }
    },
    onError: () => toast.error('Something went wrong — please try again'),
  });

  const hostReadyMut = useMutation({
    mutationFn: async () => {
      await base44.entities.GreenroomSession.create({
        user_id: user.id,
        user_name: displayName || user.full_name || user.email,
        room_id: roomId || '',
        destination_type: destType,
        camera_enabled: deviceState.cameraOn,
        mic_enabled: deviceState.micOn,
        status: 'admitted',
        device_check_passed: deviceCheckPassed,
        role_requested: 'co-host',
      }).catch(() => {});
      // Go Live / Panel always enters SeeWhyLIVEv17
      if (!roomId || destType === 'room' || destType === 'panel') {
        return `/SeeWhyLIVEv17?direct=1`;
      }
      return `/LiveRoom?id=${roomId}`;
    },
    onSuccess: (path) => { window.location.href = path; },
    onError: () => toast.error('Something went wrong — please try again'),
  });

  // ─── Waiting Room State ───────────────────────────────────────────────────
  if (waitlistEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D0D0D' }}>
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Layers className="w-5 h-5" style={{ color: GOLD }} />
            <span className="font-black uppercase text-sm" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
              SeeWhy LIVE — Greenroom
            </span>
          </div>
          <WaitingRoom waitlistEntry={waitlistEntry} onCancel={() => setWaitlistEntry(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#080B18' }}>
      {/* ── FANBASE-STYLE HEADER ── */}
      <div className="sticky top-0 z-30" style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2 px-3 h-12">
          <Link to={roomId ? `/Room?id=${roomId}` : '/Discover'}>
            <button className="w-8 h-8 flex items-center justify-center rounded-xl shrink-0 transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
              <X className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Layers className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
            <span className="font-black text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, letterSpacing: '0.04em' }}>Greenroom</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-black uppercase shrink-0"
              style={{ background: destCfg.bg, color: destCfg.color, border: `1px solid ${destCfg.border}`, fontFamily: 'Barlow Condensed, sans-serif' }}>
              {destCfg.label}
            </span>
          </div>
          {/* Live permission pills in header */}
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <PermissionPill label="Cam" status={permissions.camera} />
            <PermissionPill label="Mic" status={permissions.mic} />
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">

        {/* ── LEFT: Device Preview ── */}
        <div className="w-full md:w-[60%] space-y-4">
          <DevicePreview user={user} onDeviceState={setDeviceState} />
        </div>

        {/* ── RIGHT: Controls ── */}
        <div className="w-full md:w-[40%] space-y-4">

          {/* Room identity card */}
          <div className="rounded-xl p-4"
            style={{ background: '#1A1A1A', border: `1px solid rgba(212,175,55,0.15)` }}>
            {destType === 'new_room' ? (
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>New Room</p>
                <input placeholder="Room title..." value={newRoomTitle} onChange={e => setNewRoomTitle(e.target.value)}
                  style={{ width: '100%', height: 32, padding: '0 10px', fontSize: 11, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {['gaming','music','education','talk','fitness','tech','irl','other'].map(c => (
                    <button key={c} onClick={() => setNewRoomCategory(c)}
                      style={{ padding: '3px 8px', borderRadius: 99, fontSize: 10, border: `1px solid ${newRoomCategory === c ? '#D4AF37' : 'rgba(255,255,255,0.12)'}`, background: newRoomCategory === c ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)', color: newRoomCategory === c ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, textTransform: 'capitalize' }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ) : room ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
                  style={{ border: `1px solid rgba(212,175,55,0.2)`, background: BURGUNDY }}>
                  {room.thumbnail_url
                    ? <img src={room.thumbnail_url} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <Layers className="w-5 h-5" style={{ color: GOLD }} />
                      </div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-white truncate">{room.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] uppercase font-bold px-1.5 py-0.5 rounded"
                      style={{ background: room.status === 'live' ? 'rgba(192,57,43,0.15)' : 'rgba(255,255,255,0.07)', color: room.status === 'live' ? '#C0392B' : 'rgba(255,255,255,0.4)' }}>
                      {room.status}
                    </span>
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      <Users className="w-2.5 h-2.5 inline mr-0.5" />{room.viewer_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-12 animate-pulse rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
            )}
          </div>

          {/* Display name + role */}
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <label className="text-[11px] font-black uppercase block mb-1"
                style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                Display Name
              </label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name..."
                style={{ width: '100%', height: 32, padding: '0 10px', fontSize: 11, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {!isHost && (
              <>
                <div>
                  <label className="text-[11px] font-black uppercase block mb-1"
                    style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Join As
                  </label>
                  <SelectSheet
                    label="Join As"
                    value={roleRequested}
                    onChange={function(v) { setRoleRequested(v); }}
                    options={ROLES.map(function(r) { return { value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }; })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase block mb-1"
                    style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Message to Host <span style={{ color: 'rgba(255,255,255,0.2)' }}>(optional)</span>
                  </label>
                  <textarea
                    value={joinMessage} onChange={e => setJoinMessage(e.target.value.slice(0, 140))}
                    placeholder="Say hi to the host..." rows={2}
                    className="w-full px-3 py-2 rounded-lg resize-none text-[11px]"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', outline: 'none' }} />
                  <p className="text-right text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{joinMessage.length}/140</p>
                </div>
              </>
            )}
          </div>

          {/* Device settings (collapsible) */}
          <div className="rounded-xl overflow-hidden"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button className="w-full flex items-center justify-between px-4 py-3"
              onClick={() => setSettingsOpen(s => !s)}>
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" style={{ color: GOLD }} />
                <span className="text-[10px] font-black uppercase"
                  style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Device Settings
                </span>
              </div>
              {settingsOpen ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
            </button>
            <AnimatePresence>
              {settingsOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden">
                  <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="pt-3">
                      <label className="text-[11px] font-black uppercase block mb-1"
                        style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        Video Quality
                      </label>
                      <div className="flex gap-1.5">
                        {['360p', '480p', '720p', '1080p'].map(q => (
                          <button key={q} onClick={() => setVideoQuality(q)}
                            className="flex-1 py-1.5 rounded text-[11px] font-black uppercase transition-all"
                            style={{
                              background: videoQuality === q ? `rgba(212,175,55,0.15)` : 'rgba(255,255,255,0.04)',
                              border: videoQuality === q ? `1px solid rgba(212,175,55,0.4)` : '1px solid rgba(255,255,255,0.08)',
                              color: videoQuality === q ? GOLD : 'rgba(255,255,255,0.3)',
                              fontFamily: 'Barlow Condensed, sans-serif',
                            }}>{q}</button>
                        ))}
                      </div>
                    </div>

                    {/* Toggles */}
                    {[
                      { label: 'Echo Cancellation', state: echoCancel, set: setEchoCancel },
                      { label: 'Noise Cancellation', state: noiseCancel, set: setNoiseCancel },
                      { label: 'Background Blur', state: bgBlur, set: setBgBlur },
                    ].map(({ label, state, set }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                        <button onClick={() => set(s => !s)}
                          className="w-10 h-5 rounded-full relative transition-all"
                          style={{ background: state ? GOLD : 'rgba(255,255,255,0.1)' }}>
                          <motion.div animate={{ x: state ? 20 : 2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="absolute top-0.5 w-4 h-4 rounded-full"
                            style={{ background: state ? '#000' : 'rgba(255,255,255,0.4)' }} />
                        </button>
                      </div>
                    ))}

                    {bgBlur && (
                      <div>
                        <p className="text-[11px] mb-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Background</p>
                        <div className="flex gap-2">
                          {['#0D0D0D', BURGUNDY, '#0A0A2E'].map(c => (
                            <button key={c} className="w-8 h-8 rounded-lg border transition-all"
                              style={{ background: c, border: `2px solid rgba(212,175,55,0.3)` }} />
                          ))}
                          <button className="flex-1 h-8 rounded-lg text-[11px] font-bold"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.3)' }}>
                            Upload
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Permissions */}
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[11px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Permissions
            </p>
            <div className="flex flex-wrap gap-1.5">
              <PermissionPill label="Camera" status={permissions.camera} />
              <PermissionPill label="Microphone" status={permissions.mic} />
              <PermissionPill label="Speakers" status={permissions.speaker} />
            </div>
            {(permissions.camera === 'denied' || permissions.mic === 'denied') && (
              <p className="text-[11px]" style={{ color: 'rgba(255,100,100,0.8)' }}>
                Some permissions are blocked — check browser settings or use "Join without audio/video" below.
              </p>
            )}

            {/* Device check badge */}
            <AnimatePresence>
              {deviceCheckPassed && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.2)' }}>
                  <CheckCircle className="w-4 h-4 text-[#6DBF7E]" />
                  <span className="text-[10px] font-black uppercase" style={{ color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Device Check ✓
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ready button */}
          <div className="space-y-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => isHost ? hostReadyMut.mutate() : readyMut.mutate()}
              disabled={(!deviceCheckPassed) || readyMut.isPending || hostReadyMut.isPending}
              className="w-full py-4 rounded-xl font-black uppercase text-base flex items-center justify-center gap-2 transition-all"
              style={{
                background: deviceCheckPassed
                  ? `linear-gradient(135deg, ${BURGUNDY}, #D4AF37)`
                  : 'rgba(255,255,255,0.06)',
                border: deviceCheckPassed ? `1px solid rgba(212,175,55,0.5)` : '1px solid rgba(255,255,255,0.1)',
                color: deviceCheckPassed ? '#000' : 'rgba(255,255,255,0.25)',
                fontFamily: 'Barlow Condensed, sans-serif',
                letterSpacing: '0.12em',
                boxShadow: deviceCheckPassed ? `0 0 40px rgba(128,0,32,0.6), 0 0 80px rgba(128,0,32,0.25)` : 'none',
              }}>
              {readyMut.isPending || hostReadyMut.isPending
                ? 'Preparing…'
                : isHost || destType === 'watch_party'
                  ? <><ArrowRight className="w-5 h-5" /> Enter Now</>
                  : <><ArrowRight className="w-5 h-5" /> I'm Ready — Join</>}
            </motion.button>

            <label className="flex items-center gap-2 cursor-pointer px-1">
              <input type="checkbox" checked={bypassDeviceCheck} onChange={e => setBypassDeviceCheck(e.target.checked)}
                className="rounded" style={{ accentColor: GOLD }} />
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Join without audio/video</span>
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <ZEGOStreamHealthCard roomId={room?.id || null} />
              {isHost && <StreamGoals isHost={true} />}
              <EnhancedAudioMixer roomId={room?.id || null} isHost={isHost} />
              <PanelMusicPlayer roomId={room?.id || null} isHost={isHost} />
              <PrivatePanel roomId={room?.id || null} currentUser={user} isHost={isHost} />
              {isHost && <GreenroomWaitlistPanel roomId={room?.id || null} currentUser={user} onAdmit={() => {}} />}
              <OnlineUsersGrid compact maxVisible={10} />
              <ContentRecommendations />
              <CollaborationMatcher />
            </div>
          </div>
        </div>
      </div>
      <SwanAIRecommendations roomId={roomId} currentLayout="greenroom" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={roomId} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      {roomId && <ZEGOGuestApprovalPanel roomId={roomId} isHost={isHost} />}
      {user && <ZEGOConfigPanel user={user} />}
      <BackgroundCustomizer />
      {isHost && roomId && <StreamerGoalsWidget creatorId={room?.host_id || user?.id} roomId={roomId} isCreator={isHost} embedded={true} />}
      {isHost && roomId && <PayPerViewManager roomId={roomId} />}
      {isHost && roomId && <MonetizationDashboard roomId={roomId} />}
      {roomId && <GiftShopTray roomId={roomId} currentUser={user} />}
      {roomId && <GiftLeaderboard roomId={roomId} />}
      {isHost && <SubscriptionManager creatorId={room?.host_id || user?.id} />}
      {roomId && <TipAlert roomId={roomId} recipientId={room?.host_id || user?.id} />}
      {!isHost && roomId && <TippingModal isOpen={false} onClose={() => {}} recipient={null} roomId={roomId} />}
      {roomId && <LiveAuctionWidget creatorId={room?.host_id || user?.id} roomId={roomId} isCreator={isHost} currentUser={user} />}
      <MerchWidget />
      <NotificationBell />
      {roomId && <PKBattleInterface roomId={roomId} />}
      {roomId && <CoStreamPanel roomId={roomId} />}
      {isHost && roomId && <CollaborativeWhiteboard roomId={roomId} />}
      {roomId && user?.id && <PointsEarnWidget userId={user.id} creatorId={room?.host_id || user?.id} roomId={roomId} isHost={isHost} />}
      {isHost && roomId && <RedemptionQueue creatorId={room?.host_id || user?.id} roomId={roomId} />}
      {roomId && <RewardShop creatorId={room?.host_id || user?.id} roomId={roomId} currentUser={user} />}
      {!isHost && user?.id && <ViewerLoyaltyCard userId={user.id} creatorId={room?.host_id || user?.id} compact={true} />}
      {roomId && <GreenroomQueue roomId={roomId} isHost={isHost} />}
      {isHost && <StreamingPresets onApply={() => {}} />}
      {roomId && <EmbedPlayer roomId={roomId} creatorName={user?.full_name || ''} streamTitle={room?.title || 'Greenroom'} viewerCount={0} />}
      <LiveTranslationWidget chatMessage={null} onTranslation={() => {}} />
      {isHost && user?.id && <RecordingManager userId={user.id} />}
      {isHost && <OBSBridge />}
      <ZEGOMobileAppBanner />
      {isHost && roomId && <AutomatedClipGenerator streamSession={{room_id: roomId}} isLive={roomId != null} />}
      {roomId && <InteractivePollWidget roomId={roomId} isHost={isHost} />}
      {isHost && <StreamMetadataEditor initialTitle={room?.title || 'Greenroom'} initialCategory={'entertainment'} />}
      {isHost && <StreamerMonetizationCenter />}
      {!isHost && roomId && <AnimatedGiftShop recipientId={room?.host_id || user?.id} roomId={roomId} onClose={() => {}} />}
      {isHost && user?.id && <VirtualGoodsStore userId={user.id} />}
      {isHost && <SoundAlertsManager creatorId={room?.host_id || user?.id} />}
      <ShareToSocial content={{text: ''}} />
      {isHost && roomId && user?.id && <VideoShortRecorder roomId={roomId} creatorId={user.id} />}
      {isHost && <BroadcastAnalyticsDashboard streamSession={null} isLive={roomId != null} />}
      {isHost && roomId && <AutomatedHighlightReels streamSession={{room_id: roomId}} />}
      {roomId && <PerformanceDashboard roomId={roomId} sessionId={roomId} />}
      <StreamHealthDashboard isLive={roomId != null} />
      {!isHost && roomId && <QuickTip recipientId={room?.host_id || user?.id} recipientName={''} onTipSent={() => {}} />}
      {isHost && <LowerThirdsBanner onBannerChange={() => {}} />}
      {isHost && <SceneSwitcher activeScene={'main'} onSceneChange={() => {}} />}
      <NotificationHub />
      {isHost && <SoundboardWidget isVisible={true} />}
      {isHost && roomId && <RaidPanelButton room={room} currentUser={user} isHost={isHost} />}
      {roomId && <LiveAudiencePulse roomId={roomId} isHost={isHost} viewerCount={0} />}
      {roomId && <StreamAnalyticsDashboard roomId={roomId} />}
      {isHost && roomId && <AIStreamSummary roomId={roomId} isHost={isHost} streamTitle={room?.title || ''} viewerCount={0} elapsedSeconds={0} />}
      {isHost && <ChatModeration collapsed={true} />}
      <BrandChyron />
      {!isHost && roomId && user?.id && <WhisperPanel roomId={roomId} currentUser={user} recipientId={room?.host_id || user?.id} recipientName={''} onClose={() => {}} />}
      {roomId && <RealtimeLeaderboard roomId={roomId} creatorId={room?.host_id || user?.id} />}
      {roomId && <ViewerControlsPanel roomId={roomId} currentUser={user} onClose={() => {}} />}
      {roomId && user?.id && <VirtualCurrencyTips roomId={roomId} creatorId={room?.host_id || user?.id} currentUser={user} isHost={isHost} />}
      {roomId && <GoldenWall roomId={roomId} />}
      {isHost && roomId && user?.id && <ClipCreator roomId={roomId} creatorId={user.id} streamTitle={room?.title || ''} elapsedSeconds={0} currentUser={user} />}
      {isHost && roomId && user?.id && <StreamHighlightCapture roomId={roomId} sessionId={roomId} creatorId={user.id} elapsedSeconds={0} isHost={isHost} />}
      {isHost && roomId && <QuickPollLauncher roomId={roomId} hostId={user?.id} isHost={isHost} />}
      {!isHost && roomId && room?.host_id && <GiftTray roomId={roomId} currentUser={user} recipientId={room.host_id} />}
      {isHost && room && <RoomBrandingEditor roomData={room} onBrandingChange={() => {}} isHost={true} />}
      <HostAlertCenter />
      {roomId && <AICopilotSidebar roomId={roomId} isHost={isHost} viewerCount={0} />}
      {isHost && roomId && <EnhancedPollingSystem roomId={roomId} hostId={room?.host_id || user?.id} isHost={isHost} />}
      {roomId && user?.id && <SuperChatBar roomId={roomId} currentUser={user} recipientId={room?.host_id || user?.id} recipientName={''} />}
      {user?.id && <SwanyBotEnhanced userId={user.id} conversationId={null} onContextReady={() => {}} />}
      {isHost && <LocalVideoTile stream={null} audioEnabled={true} videoEnabled={true} userName={user?.full_name || ''} isHost={isHost} />}
      {isHost && <OctagonalVideoWindow title={'My Camera'} isMuted={false} isVideoOff={false} onMicToggle={() => {}} onVideoToggle={() => {}} />}
      {isHost && <AudioPanel micMuted={false} onMicToggle={() => {}} participants={[]} />}
      {isHost && <EvmuxWebSource isActive={false} onClose={() => {}} />}
      {roomId && <LivePollOverlay roomId={roomId} currentUser={user} isHost={isHost} position={'bottom-left'} />}
      {isHost && <StripeConnectButton creatorId={room?.host_id || user?.id} />}
      {!isHost && user?.id && <StripeSubscribeButton creatorId={room?.host_id || user?.id} creatorName={''} currentUserId={user.id} />}
      {<SubscriptionTiers communityId={null} userId={user?.id} />}
      {room && <WatchPartyAnalytics party={room} members={[]} pollCount={0} reactionCount={0} />}
      {roomId && user?.id && <ZEGOGuestJoin roomId={roomId} userId={user.id} userName={user?.full_name || ''} onJoined={() => {}} />}
      {roomId && <PaymentMethodSelector creatorId={room?.host_id || user?.id} roomId={roomId} onPaymentComplete={() => {}} />}
      {isHost && <CreatorTierManager creatorId={room?.host_id || user?.id} />}
      {user?.id && <TierBadge tier={null} size={'sm'} showName={false} />}
      {user?.id && <LoyaltyBadge userId={user.id} creatorId={room?.host_id || user?.id} />}
      {roomId && <GuestGrid participants={[]} isHost={isHost} onInvite={() => {}} hostId={user?.id} />}
      {isHost && roomId && <EnhancedRoomControls isHost={isHost} roomData={room} micMuted={false} onMicToggle={() => {}} onAudioSettingsChange={() => {}} />}
      <CollabPlaylist isHost={isHost} currentUser={user} onPlayVideo={() => {}} />
      <YouTubeDiscovery />
      <ActivitySidebar isOpen={false} onClose={() => {}} />
      <GlobalSearch onClose={() => {}} />
      {roomId && <PayPerViewGate roomId={roomId} ppvPrice={4.99} onPurchase={() => {}} />}
      <PaywallGate isHost={isHost} streamTitle={room?.title || ''} onUnlock={() => {}} isUnlocked={true} />
      {roomId && <SubscriptionGate creatorId={room?.host_id || user?.id} roomId={roomId} />}
      {roomId && <ModerationAppealPanel flagId={null} messageId={null} roomId={roomId} onClose={() => {}} />}
      {isHost && user?.id && <GuestDestinationsPanel participantUserId={user.id} guestName={user?.full_name || ''} />}
      {isHost && <GuestStreamingPermissions participant={null} isHost={isHost} onPermissionChange={() => {}} />}
      {isHost && roomId && <MultiStreamConfig roomId={roomId} isHost={isHost} />}
      {roomId && <VdoNinjaGuestLink roomId={roomId} />}
      <WebRTCSetupBanner error={null} audioEnabled={true} videoEnabled={true} onRetry={() => {}} />
      {isHost && roomId && <WebhookHooks roomId={roomId} isHost={isHost} />}
      {isHost && <PKBattleSoundboard battleId={roomId} isBattleActive={roomId != null} />}
      <PanelMusicPlayer />
      {isHost && roomId && <PollLaunchBar roomId={roomId} hostId={user?.id} activePoll={null} isHost={isHost} />}
      {room && <PreStreamCountdown room={room} currentUser={user} onGoLive={() => {}} />}
      <PrivatePanel isHost={isHost} currentUser={user} />
      {roomId && <StreamChatbot roomId={roomId} isHost={isHost} elapsedSeconds={0} hostName={user?.full_name || ''} room={room} />}
      {roomId && <StreamEventBus roomId={roomId} isHost={isHost} sessionId={roomId} onViewerUpdate={() => {}} onTipReceived={() => {}} onMessageReceived={() => {}} />}
      {roomId && <TippingOverlay roomId={roomId} creatorId={room?.host_id || user?.id} isVisible={true} />}
      {roomId && <UnifiedChat roomId={roomId} currentUser={user} isHost={isHost} />}
      {isHost && roomId && <AIPersonaCustomizer roomId={roomId} sessionId={roomId} onCustomized={() => {}} />}
      {isHost && <AudioMixer micMuted={false} onMicToggle={() => {}} />}
      {isHost && <EnhancedAudioMixer micMuted={false} onMicToggle={() => {}} onAudioSettingsChange={() => {}} />}
      {isHost && <ScreenSharePanel isSharing={false} onStartShare={() => {}} onStopShare={() => {}} />}
      {roomId && <AuraEmotionDisplay roomId={roomId} sessionId={roomId} auraPersona={'hype'} />}
      {roomId && <BattleScoreboard roomId={roomId} />}
      {roomId && user?.id && <EnhancedStreamChat roomId={roomId} userId={user.id} userName={user?.full_name || ''} userRole={isHost ? 'host' : 'viewer'} />}
      <GlobalChatWidget />
      {isHost && roomId && <GuestConnector roomId={roomId} roomName={''} />}
      {roomId && <InteractivePollingSystem roomId={roomId} isHost={isHost} currentUser={user} />}
      {roomId && <LeaderboardPanel roomId={roomId} />}
      {roomId && <MobileStreamControls micMuted={false} onMicToggle={() => {}} onReact={() => {}} onQuickTip={() => {}} roomId={roomId} />}
      {user?.id && <PointsNotification userId={user.id} />}
      {roomId && user?.id && <EngagementBadgesDisplay roomId={roomId} userId={user.id} creatorId={room?.host_id || user?.id} />}
      {roomId && <ChatOverlay roomId={roomId} isVisible={true} />}
      {roomId && <BattleMode roomId={roomId} isHost={isHost} hostName={user?.full_name || ''} />}
      {isHost && <BitratePresets selected={'auto'} onChange={() => {}} />}
      {isHost && user?.id && <GuestRTMPPanel participantId={user.id} userId={user.id} />}
      {isHost && <GuestStreamMonitor guestName={user?.full_name || ''} isStreaming={roomId != null} />}
      {roomId && <TranscriptionPanel recordingUrl={''} roomTitle={''} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={isHost} currentTips={0} currentSubs={0} currentViewers={0} />
      <ViewerCount count={0} peakViewers={0} />
    </div>
  );
}