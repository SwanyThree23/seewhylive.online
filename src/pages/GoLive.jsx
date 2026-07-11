import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  ChevronLeft, ChevronRight, Radio, Swords, Tv2, Mic2,
  Camera, CameraOff, Mic, MicOff, Copy, Check, Lock, Unlock,
  Tag, Image, AlignLeft, Layers, Sparkles,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import ZEGOGuestApprovalPanel from '../components/zego/ZEGOGuestApprovalPanel';
import ZEGOConfigPanel from '../components/zego/ZEGOConfigPanel';
import LiveTranscription from '../components/live/LiveTranscription';
import { SwanDirectorHUD } from '../components/live/SwanDirectorPanel';
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
    color: '#5B6EF5',
    dest: 'WatchParty',
  },
  {
    id: 'audio',
    icon: <Mic style={{ width: 32, height: 32 }} />,
    emoji: '🎧',
    title: 'Audio Room',
    subtitle: 'Clubhouse-style stage. Speakers + listeners.',
    features: ['🎤 Stage', '✋ Hand Raise', '❤️ Love Tap', '📌 Pin Video'],
    color: '#26A69A',
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

function CameraPreview({ onStreamReady }) {
  const videoRef = useRef(null);
  const [stream,  setStream]  = useState(null);
  const [camOn,   setCamOn]   = useState(false);
  const [micOn,   setMicOn]   = useState(true);
  const [error,   setError]   = useState(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      setCamOn(true);
      if (videoRef.current) videoRef.current.srcObject = s;
      onStreamReady?.(s);
    } catch {
      setError('Camera/mic access denied');
    }
  }, [onStreamReady]);

  useEffect(() => { start(); return () => stream?.getTracks().forEach(t => t.stop()); }, []);

  function toggleMic() {
    stream?.getAudioTracks().forEach(t => { t.enabled = !micOn; });
    setMicOn(v => !v);
  }

  return (
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
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 999,
          background: camOn ? 'rgba(255,21,100,0.85)' : 'rgba(0,0,0,0.5)',
          fontSize: 11, fontWeight: 900, color: '#fff', fontFamily: FONT,
          letterSpacing: '0.08em',
        }}>
          {camOn && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />}
          {camOn ? 'PREVIEW' : 'NO SIGNAL'}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
        <button onClick={toggleMic} style={{
          width: 32, height: 32, borderRadius: '50%',
          background: micOn ? 'rgba(212,175,55,0.2)' : 'rgba(239,68,68,0.2)',
          border: `1px solid ${micOn ? 'rgba(212,175,55,0.4)' : 'rgba(239,68,68,0.4)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          {micOn
            ? <Mic style={{ width: 14, height: 14, color: GOLD }} />
            : <MicOff style={{ width: 14, height: 14, color: '#C0392B' }} />}
        </button>
      </div>
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
            <CameraPreview />

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
              boxShadow: title.trim() ? `0 4px 24px rgba(255,21,100,0.4)` : 'none',
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
      <SwanAIRecommendations roomId={partyId} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={partyId} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      {partyId && <ZEGOGuestApprovalPanel roomId={partyId} isHost={true} />}
      {user && <ZEGOConfigPanel user={user} />}
      {partyId && <LiveTranscription isLive={!!partyId} roomId={partyId} />}
      {partyId && <SwanDirectorHUD roomId={partyId} hostId={user?.id} onOpenPanel={() => {}} />}
      <BackgroundCustomizer />
      {partyId && <StreamerGoalsWidget creatorId={user?.id} roomId={partyId} isCreator={true} embedded={true} />}
      {partyId && <PayPerViewManager roomId={partyId} />}
      {partyId && <MonetizationDashboard roomId={partyId} />}
      {partyId && <GiftShopTray roomId={partyId} currentUser={user} />}
      {partyId && <GiftLeaderboard roomId={partyId} />}
      {<SubscriptionManager creatorId={user?.id} />}
      {partyId && <TipAlert roomId={partyId} recipientId={user?.id} />}
      {!true && partyId && <TippingModal isOpen={false} onClose={() => {}} recipient={null} roomId={partyId} />}
      {partyId && <LiveAuctionWidget creatorId={user?.id} roomId={partyId} isCreator={true} currentUser={user} />}
      <MerchWidget />
      <NotificationBell />
      {partyId && <PKBattleInterface roomId={partyId} />}
      {partyId && <CoStreamPanel roomId={partyId} />}
      {partyId && <CollaborativeWhiteboard roomId={partyId} />}
      {partyId && user?.id && <PointsEarnWidget userId={user.id} creatorId={user?.id} roomId={partyId} isHost={true} />}
      {partyId && <RedemptionQueue creatorId={user?.id} roomId={partyId} />}
      {partyId && <RewardShop creatorId={user?.id} roomId={partyId} currentUser={user} />}
      {!true && user?.id && <ViewerLoyaltyCard userId={user.id} creatorId={user?.id} compact={true} />}
      {partyId && <GreenroomQueue roomId={partyId} isHost={true} />}
      {<StreamingPresets onApply={() => {}} />}
      {partyId && <EmbedPlayer roomId={partyId} creatorName={user?.full_name || ''} streamTitle={'Live Stream'} viewerCount={0} />}
      <LiveTranslationWidget chatMessage={null} onTranslation={() => {}} />
      {user?.id && <RecordingManager userId={user.id} />}
      {<OBSBridge />}
      <ZEGOMobileAppBanner />
      {partyId && <AutomatedClipGenerator streamSession={{room_id: partyId}} isLive={partyId != null} />}
      {partyId && <InteractivePollWidget roomId={partyId} isHost={true} />}
      {<StreamMetadataEditor initialTitle={'Live Stream'} initialCategory={'entertainment'} />}
      {<StreamerMonetizationCenter />}
      {!true && partyId && <AnimatedGiftShop recipientId={user?.id} roomId={partyId} onClose={() => {}} />}
      {user?.id && <VirtualGoodsStore userId={user.id} />}
      {<SoundAlertsManager creatorId={user?.id} />}
      <ShareToSocial content={{text: ''}} />
      {partyId && user?.id && <VideoShortRecorder roomId={partyId} creatorId={user.id} />}
      {<BroadcastAnalyticsDashboard streamSession={null} isLive={partyId != null} />}
      {partyId && <AutomatedHighlightReels streamSession={{room_id: partyId}} />}
      {partyId && <PerformanceDashboard roomId={partyId} sessionId={partyId} />}
      <StreamHealthDashboard isLive={partyId != null} />
      {!true && partyId && <QuickTip recipientId={user?.id} recipientName={''} onTipSent={() => {}} />}
      {<LowerThirdsBanner onBannerChange={() => {}} />}
      {<SceneSwitcher activeScene={'main'} onSceneChange={() => {}} />}
      <NotificationHub />
      {<SoundboardWidget isVisible={true} />}
      {partyId && <RaidPanelButton room={null} currentUser={user} isHost={true} />}
      {partyId && <LiveAudiencePulse roomId={partyId} isHost={true} viewerCount={0} />}
      {partyId && <StreamAnalyticsDashboard roomId={partyId} />}
      {partyId && <AIStreamSummary roomId={partyId} isHost={true} streamTitle={''} viewerCount={0} elapsedSeconds={0} />}
      {<ChatModeration collapsed={true} />}
      <BrandChyron />
      {!true && partyId && user?.id && <WhisperPanel roomId={partyId} currentUser={user} recipientId={user?.id} recipientName={''} onClose={() => {}} />}
      {partyId && <RealtimeLeaderboard roomId={partyId} creatorId={user?.id} />}
      {partyId && <ViewerControlsPanel roomId={partyId} currentUser={user} onClose={() => {}} />}
      {partyId && user?.id && <VirtualCurrencyTips roomId={partyId} creatorId={user?.id} currentUser={user} isHost={true} />}
      {partyId && <GoldenWall roomId={partyId} />}
      {partyId && user?.id && <ClipCreator roomId={partyId} creatorId={user.id} streamTitle={''} elapsedSeconds={0} currentUser={user} />}
      {partyId && user?.id && <StreamHighlightCapture roomId={partyId} sessionId={partyId} creatorId={user.id} elapsedSeconds={0} isHost={true} />}
      {partyId && <QuickPollLauncher roomId={partyId} hostId={user?.id} isHost={true} />}
      <RoomBrandingEditor roomData={null} onBrandingChange={() => {}} isHost={true} />
      <HostAlertCenter />
      {partyId && <AICopilotSidebar roomId={partyId} isHost={true} viewerCount={0} />}
      {partyId && <EnhancedPollingSystem roomId={partyId} hostId={user?.id} isHost={true} />}
      {partyId && user?.id && <SuperChatBar roomId={partyId} currentUser={user} recipientId={user?.id} recipientName={''} />}
      {user?.id && <SwanyBotEnhanced userId={user.id} conversationId={null} onContextReady={() => {}} />}
      {<LocalVideoTile stream={null} audioEnabled={true} videoEnabled={true} userName={user?.full_name || ''} isHost={true} />}
      {<OctagonalVideoWindow title={'My Camera'} isMuted={false} isVideoOff={false} onMicToggle={() => {}} onVideoToggle={() => {}} />}
      {<AudioPanel micMuted={false} onMicToggle={() => {}} participants={[]} />}
      {<EvmuxWebSource isActive={false} onClose={() => {}} />}
      {partyId && <LivePollOverlay roomId={partyId} currentUser={user} isHost={true} position={'bottom-left'} />}
      {<StripeConnectButton creatorId={user?.id} />}
      {!true && user?.id && <StripeSubscribeButton creatorId={user?.id} creatorName={''} currentUserId={user.id} />}
      {<SubscriptionTiers communityId={null} userId={user?.id} />}
      {null && <WatchPartyAnalytics party={null} members={[]} pollCount={0} reactionCount={0} />}
      {partyId && user?.id && <ZEGOGuestJoin roomId={partyId} userId={user.id} userName={user?.full_name || ''} onJoined={() => {}} />}
      {partyId && <PaymentMethodSelector creatorId={user?.id} roomId={partyId} onPaymentComplete={() => {}} />}
      {<CreatorTierManager creatorId={user?.id} />}
      {user?.id && <TierBadge tier={null} size={'sm'} showName={false} />}
      {user?.id && <LoyaltyBadge userId={user.id} creatorId={user?.id} />}
      {partyId && <GuestGrid participants={[]} isHost={true} onInvite={() => {}} hostId={user?.id} />}
      {partyId && <EnhancedRoomControls isHost={true} roomData={null} micMuted={false} onMicToggle={() => {}} onAudioSettingsChange={() => {}} />}
      <CollabPlaylist isHost={true} currentUser={user} onPlayVideo={() => {}} />
      <YouTubeDiscovery />
      <ActivitySidebar isOpen={false} onClose={() => {}} />
      <GlobalSearch onClose={() => {}} />
      {partyId && <PayPerViewGate roomId={partyId} ppvPrice={4.99} onPurchase={() => {}} />}
      <PaywallGate isHost={true} streamTitle={''} onUnlock={() => {}} isUnlocked={true} />
      {partyId && <SubscriptionGate creatorId={user?.id} roomId={partyId} />}
      {partyId && <ModerationAppealPanel flagId={null} messageId={null} roomId={partyId} onClose={() => {}} />}
      {user?.id && <GuestDestinationsPanel participantUserId={user.id} guestName={user?.full_name || ''} />}
      {<GuestStreamingPermissions participant={null} isHost={true} onPermissionChange={() => {}} />}
      {partyId && <MultiStreamConfig roomId={partyId} isHost={true} />}
      {partyId && <VdoNinjaGuestLink roomId={partyId} />}
      <WebRTCSetupBanner error={null} audioEnabled={true} videoEnabled={true} onRetry={() => {}} />
      {partyId && <WebhookHooks roomId={partyId} isHost={true} />}
      {<PKBattleSoundboard battleId={partyId} isBattleActive={partyId != null} />}
      <PanelMusicPlayer />
      {partyId && <PollLaunchBar roomId={partyId} hostId={user?.id} activePoll={null} isHost={true} />}
      {null && <PreStreamCountdown room={null} currentUser={user} onGoLive={() => {}} />}
      <PrivatePanel isHost={true} currentUser={user} />
      {partyId && <StreamChatbot roomId={partyId} isHost={true} elapsedSeconds={0} hostName={user?.full_name || ''} room={null} />}
      {partyId && <StreamEventBus roomId={partyId} isHost={true} sessionId={partyId} onViewerUpdate={() => {}} onTipReceived={() => {}} onMessageReceived={() => {}} />}
      {partyId && <TippingOverlay roomId={partyId} creatorId={user?.id} isVisible={true} />}
      {partyId && <UnifiedChat roomId={partyId} currentUser={user} isHost={true} />}
      {partyId && <AIPersonaCustomizer roomId={partyId} sessionId={partyId} onCustomized={() => {}} />}
      {<AudioMixer micMuted={false} onMicToggle={() => {}} />}
      {<EnhancedAudioMixer micMuted={false} onMicToggle={() => {}} onAudioSettingsChange={() => {}} />}
      {<ScreenSharePanel isSharing={false} onStartShare={() => {}} onStopShare={() => {}} />}
      {partyId && <AuraEmotionDisplay roomId={partyId} sessionId={partyId} auraPersona={'hype'} />}
      {partyId && <BattleScoreboard roomId={partyId} />}
      {partyId && user?.id && <EnhancedStreamChat roomId={partyId} userId={user.id} userName={user?.full_name || ''} userRole={true ? 'host' : 'viewer'} />}
      <GlobalChatWidget />
      {partyId && <GuestConnector roomId={partyId} roomName={''} />}
      {partyId && <InteractivePollingSystem roomId={partyId} isHost={true} currentUser={user} />}
      {partyId && <LeaderboardPanel roomId={partyId} />}
      {partyId && <MobileStreamControls micMuted={false} onMicToggle={() => {}} onReact={() => {}} onQuickTip={() => {}} roomId={partyId} />}
      {user?.id && <PointsNotification userId={user.id} />}
      {partyId && user?.id && <EngagementBadgesDisplay roomId={partyId} userId={user.id} creatorId={user?.id} />}
      {partyId && <ChatOverlay roomId={partyId} isVisible={true} />}
      {partyId && <BattleMode roomId={partyId} isHost={true} hostName={user?.full_name || ''} />}
      {<BitratePresets selected={'auto'} onChange={() => {}} />}
      {user?.id && <GuestRTMPPanel participantId={user.id} userId={user.id} />}
      {<GuestStreamMonitor guestName={user?.full_name || ''} isStreaming={partyId != null} />}
      {partyId && <TranscriptionPanel recordingUrl={''} roomTitle={''} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <ViewerCount count={0} peakViewers={0} />
    </div>
  );
}
