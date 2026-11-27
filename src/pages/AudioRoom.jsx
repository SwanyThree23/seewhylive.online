import React, { useState, useEffect, useRef } from 'react';
import { MobileSelect } from '@/components/ui/MobileSelect';
import { useSearchParams } from 'react-router-dom';
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
import { useRemoteSpeakingMap } from '../hooks/useRemoteSpeakingMap';
import { useAutoSpeakGate } from '../hooks/useAutoSpeakGate';
import { useConnectionQuality } from '../hooks/useConnectionQuality';
import { useVODRecording } from '../hooks/useVODRecording';
import { useHighlightDetector } from '../hooks/useHighlightDetector';
import { useVoiceAgentRuntime } from '../hooks/useVoiceAgentRuntime';
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
import SwanDirectorPanel, { SwanDirectorHUD } from '../components/live/SwanDirectorPanel';
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
import AudioPanel from '../components/live/AudioPanel';
import ChatModeration from '../components/live/ChatModeration';
import BrandChyron from '../components/live/BrandChyron';
import LowerThirdsBanner from '../components/live/LowerThirdsBanner';
import NotificationHub from '../components/live/NotificationHub';
import { WhisperPanel } from '../components/live/DMWhisperPanel';
import StreamEventBus from '../components/live/StreamEventBus';
import UnifiedChat from '../components/live/UnifiedChat';
import AIPersonaCustomizer from '../components/live/AIPersonaCustomizer';
import AudioMixer from '../components/live/AudioMixer';
import EnhancedAudioMixer from '../components/live/EnhancedAudioMixer';
import ScreenSharePanel from '../components/live/ScreenSharePanel';
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
import MultiGuestPanel from '../components/streaming/MultiGuestPanel';
import EnhancedRoomControls from '../components/live/EnhancedRoomControls';
import LoyaltyBadge from '../components/rooms/LoyaltyBadge';
import ZEGOGuestJoin from '../components/zego/ZEGOGuestJoin';
import TippingOverlay from '../components/live/TippingOverlay';
import ModerationAppealPanel from '../components/live/ModerationAppealPanel';
import SceneSwitcher from '../components/live/SceneSwitcher';
import PayPerViewGate from '../components/live/PayPerViewGate';
import PaywallGate from '../components/live/PaywallGate';
import SubscriptionGate from '../components/live/SubscriptionGate';
import GuestDestinationsPanel from '../components/live/GuestDestinationsPanel';
import GuestStreamingPermissions from '../components/live/GuestStreamingPermissions';
import MultiStreamConfig from '../components/live/MultiStreamConfig';
import VdoNinjaGuestLink from '../components/live/VdoNinjaGuestLink';
import WebRTCSetupBanner from '../components/live/WebRTCSetupBanner';
import CameraDeviceSelector from '../components/live/CameraDeviceSelector';
import PreJoinSettingsModal from '../components/live/PreJoinSettingsModal';
import LiveCaptionOverlay from '../components/live/LiveCaptionOverlay';
import WebhookHooks from '../components/live/WebhookHooks';
import CreatorTierManager from '../components/subscriptions/CreatorTierManager';
import TierBadge from '../components/subscriptions/TierBadge';
import GuestGrid from '../components/live/GuestGrid';
import GuestInviteGenerator from '../components/live/GuestInviteGenerator';
import CollabPlaylist from '../components/watchparty/CollabPlaylist';
import YouTubeDiscovery from '../components/youtube/YouTubeDiscovery';
import ActivitySidebar from '../components/shared/ActivitySidebar';
import GlobalSearch from '../components/shared/GlobalSearch';
import EvmuxWebSource from '../components/live/EvmuxWebSource';
import LivePollOverlay from '../components/live/LivePollOverlay';
import StripeConnectButton from '../components/monetization/StripeConnectButton';
import StripeSubscribeButton from '../components/monetization/StripeSubscribeButton';
import SubscriptionTiers from '../components/monetization/SubscriptionTiers';
import WatchPartyAnalytics from '../components/watchparty/WatchPartyAnalytics';
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
import OverlayThemeBuilder from '../components/live/OverlayThemeBuilder';
import RoomReactionOverlay from '../components/live/RoomReactionOverlay';
var GOLD    = '#D4AF37';
var CRIMSON = '#800020';
var PINK    = '#C0392B';
var BG      = '#080B18';
var BG2     = '#0D1022';
var GREEN   = '#6DBF7E';

var PALETTE = ['#8B6F47','#6B7C4A','#CC7755','#4A6B7C','#7C4A6B','#5C6BC0','#4A8A7A','#EF6C00'];

function avatarColor(name) {
  return PALETTE[((name && name.charCodeAt)(0) || 0) % PALETTE.length];
}

function getYouTubeId(url) {
  if (!url) return null;
  var m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

var OCT = 'polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)';

function SpeakerTile({ member, size = 80 }) {
  var isHost    = member.role === 'host';
  var isCohost  = member.role === 'cohost';
  var isMuted   = member.is_audio_enabled === false;
  var isSpeaking = member.speaking;
  var color     = avatarColor(member.user_name || 'A');

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        {isSpeaking && (
          <motion.div
            className="absolute inset-0"
            style={{ clipPath: OCT, background: GOLD, opacity: 0.25 }}
            animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.08, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {/* OCT outer ring */}
        <div className="absolute inset-0" style={{
          clipPath: OCT,
          background: isSpeaking ? GOLD : (isHost ? '#D4AF37' : 'rgba(255,255,255,0.18)'),
          transition: 'background 0.3s',
        }} />
        {/* OCT inner fill */}
        <div className="absolute inset-[3px] overflow-hidden flex items-center justify-center font-black text-lg text-white" style={{
          clipPath: OCT,
          background: 'linear-gradient(135deg, ' + color + '88, ' + BG2 + ')',
        }}>
          {member.user_avatar
            ? <img src={member.user_avatar} alt={member.user_name} className="w-full h-full object-cover" />
            : (member.user_name || '?').charAt(0).toUpperCase()
          }
        </div>

        {(isHost || isCohost) && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
            <Crown className="w-3.5 h-3.5 drop-shadow" style={{ color: GOLD }} />
          </div>
        )}
        {isMuted && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#EF4444', border: '2px solid ' + BG }}>
            <MicOff className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <p className="text-[12px] font-bold text-white truncate" style={{ fontFamily: 'Barlow Condensed, sans-serif', maxWidth: size + 8 }}>
        {(member.user_name || 'Guest').split(' ')[0]}
      </p>
    </div>
  );
}

function AudienceTile({ member }) {
  var size  = 52;
  var color = avatarColor(member.user_name || 'A');
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative" style={{ width: size, height: size }}>
        <div className="absolute inset-0" style={{ clipPath: OCT, background: 'rgba(255,255,255,0.12)' }} />
        <div className="absolute inset-[2px] overflow-hidden flex items-center justify-center font-bold text-sm text-white"
          style={{ clipPath: OCT, background: 'linear-gradient(135deg, ' + color + '66, ' + BG2 + ')' }}>
          {member.user_avatar
            ? <img src={member.user_avatar} alt={member.user_name} className="w-full h-full object-cover" />
            : (member.user_name || '?').charAt(0).toUpperCase()
          }
        </div>
      </div>
      <p className="text-[11px] truncate" style={{ color: '#888', fontFamily: 'Barlow Condensed, sans-serif', maxWidth: size + 4 }}>
        {(member.user_name || 'Guest').slice(0, 8)}
      </p>
    </div>
  );
}

export default function AudioRoom() {
  var searchParamsState = useSearchParams();
  var searchParams = searchParamsState[0];
  var setSearchParams = searchParamsState[1];
  var roomId = searchParams.get('id');

  var activeMicIdState = useState(function() { try { return localStorage.getItem('swl_pref_mic') || null; } catch { return null; } });
  var activeMicId = activeMicIdState[0];
  var setActiveMicId = activeMicIdState[1];
  var handleMicChange = function(id) { setActiveMicId(id); try { localStorage.setItem('swl_pref_mic', id); } catch {} reacquireMedia({ audioDeviceId: id }); };
  var { localStream, audioEnabled, toggleAudio, applyAudioConstraints, error: mediaError, reacquire: reacquireMedia } = useLocalMedia({ audio: true, video: false, audioDeviceId: activeMicId });
  var { cameras: cameraDevices, speakers: speakerDevices } = useCameraDevices();
  var { remoteStreams, peerUserIds, peersRef, announceJoin } = useWebRTCPeers(roomId, localStream);
  var autoSpeakResult = useAutoSpeakGate({ stream: localStream, enabled: !!localStream });
  var localIsSpeaking = autoSpeakResult.isSpeaking;
  var remoteSpeakingIds = useRemoteSpeakingMap(remoteStreams, peerUserIds);
  var [busViewerCount, setBusViewerCount] = useState(0);
  var [tipTotal, setTipTotal] = useState(0);
  var [peakViewers, setPeakViewers] = useState(0);
  var [lastChatMsg, setLastChatMsg] = useState(null);
  var [chatMessages, setChatMessages] = useState([]);
  var [hypeLevel, setHypeLevel] = useState(0);
  var [activeScene, setActiveScene] = useState('main');
  var [selectedBitrate, setSelectedBitrate] = useState(3000);
  var [showGreenRoomModal, setShowGreenRoomModal] = useState(false);
  var handleBitrateChange = function(b) { setSelectedBitrate(b); reacquireMedia({ resolution: ({1500:'480p',3000:'720p',5000:'1080p',7500:'1080p'})[b]||'720p' }); };

  var activePcState = useState(null);
  var activePc = activePcState[0];
  var setActivePc = activePcState[1];
  useEffect(function() {
    var entries = Array.from(peersRef.current.entries());
    var connected = entries.find(function(pair) { return pair[1].pc.connectionState === 'connected'; });
    setActivePc(connected ? connected[1].pc : null);
  }, [remoteStreams]);

  var { bars: netBars, label: netLabel, rtt: netRtt, quality: netQuality } = useConnectionQuality(activePc, 5000);

  var userQuery = useQuery({ queryKey: ['currentUser'], queryFn: function() { return base44.auth.me(); } });
  var user = userQuery.data || null;
  var speakingIds = (function() {
    if (!localIsSpeaking || !(user && user.id)) return remoteSpeakingIds;
    var o = Object.assign({}, remoteSpeakingIds);
    o[user.id] = true;
    return o;
  }());

  var partyQuery = useQuery({
    queryKey: ['audio-room', roomId],
    queryFn:  function() { return base44.entities.WatchParty.filter({ id: roomId }).then(function(r) { return r[0]; }); },
    enabled:  !!roomId,
    refetchInterval: 10000,
  });
  var party = partyQuery.data || null;
  var membersQuery = useQuery({
    queryKey: ['audio-room-members', roomId],
    queryFn:  function() { return base44.entities.WatchPartyMember.filter({ party_id: roomId, is_active: true }); },
    enabled:  !!roomId,
    refetchInterval: 10000,
  });
  var members = membersQuery.data || [];
  var lovesQuery = useQuery({
    queryKey: ['audio-room-loves', roomId],
    queryFn:  function() { return base44.entities.Reaction.filter({ room_id: roomId, emoji: '❤️', target_type: 'room' }); },
    enabled:  !!roomId,
    refetchInterval: 5000,
  });
  var loves = lovesQuery.data || [];

  var activePollQuery = useQuery({
    queryKey: ['active-poll', roomId],
    queryFn: function() { return base44.entities.Poll.filter({ room_id: roomId, status: 'active' }).then(function(r) { return r[0] || null; }); },
    enabled: !!roomId,
    refetchInterval: 5000,
  });
  var activePoll = activePollQuery.data || null;

  var [showActivitySidebar, setShowActivitySidebar] = useState(false);
  var [showShareModal, setShowShareModal] = useState(false);
  var [showBreakoutRooms, setShowBreakoutRooms] = useState(false);
  var [showWebRTCConfig, setShowWebRTCConfig] = useState(false);
  var [showTippingModal, setShowTippingModal] = useState(false);
  var [showEvmux, setShowEvmux] = useState(false);
  var [pollTick, setPollTick] = useState(0);
  var [raidTick, setRaidTick] = useState(0);
  var [goalTick, setGoalTick] = useState(0);
  var [reactEmoji, setReactEmoji] = useState(null);
  var [showAuraPanelDrawer, setShowAuraPanelDrawer] = useState(false);
  var [showViewerControls, setShowViewerControls] = useState(false);
  var [showWhisperPanel, setShowWhisperPanel] = useState(false);
  var [showGiftShop, setShowGiftShop] = useState(false);
  var [showSwanPanel, setShowSwanPanel] = useState(false);
  var [showCamSettings, setShowCamSettings] = useState(false);
  var [showGlobalSearch, setShowGlobalSearch] = useState(false);
  var [showModerationAppeal, setShowModerationAppeal] = useState(false);
  var [isSharing, setIsSharing] = useState(false);
  var screenStreamRef = useRef(null);
  var _applyShareStream = function(stream) { screenStreamRef.current = stream; var vt = stream.getVideoTracks()[0]; if (vt) vt.onended = function() { screenStreamRef.current = null; setIsSharing(false); }; setIsSharing(true); };
  var handleStartShare = function(stream) { if (stream) { _applyShareStream(stream); return; } navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then(_applyShareStream).catch(function() {}); };
  var handleStopShare = function() { if (screenStreamRef.current && screenStreamRef.current.getTracks) { screenStreamRef.current.getTracks().forEach(function(t) { t.stop(); }); } screenStreamRef.current = null; setIsSharing(false); };
  var [chatOpen,      setChatOpen]      = useState(false);
  var [settingsOpen,  setSettingsOpen]  = useState(false);
  var [handRaised,    setHandRaised]    = useState(false);
  var [loveCount,     setLoveCount]     = useState(0);
  var [pttActive,     setPttActive]     = useState(false); // push-to-talk live state
  var pttWasEnabledRef = useRef(false); // was mic already on before PTT press?

  var prefSpeakerState = useState(function() { try { return localStorage.getItem('swl_pref_speaker') || ''; } catch { return ''; } });
  var prefSpeaker = prefSpeakerState[0];
  var setPrefSpeaker = prefSpeakerState[1];
  var [noiseSupp,   setNoiseSupp]   = useState(true);
  var [echoCan,     setEchoCan]     = useState(true);
  var [autoGain,    setAutoGain]    = useState(true);
  var [spotlightId, setSpotlightId] = useState(null);

  var [createTitle,    setCreateTitle]    = useState('');
  var [createVideoUrl, setCreateVideoUrl] = useState('');
  var [creating,       setCreating]       = useState(false);

  // Elapsed-seconds counter (starts on mount)
  var [elapsed, setElapsed] = useState(0);
  useEffect(function() {
    var iv = setInterval(function() { setElapsed(function(s) { return s + 1; }); }, 1000);
    return function() { clearInterval(iv); };
  }, []);

  useEffect(function() { setLoveCount(loves.length); }, [loves.length]);

  useEffect(function() {
    if (!roomId || !(user && user.id)) return;
    announceJoin(user.id);
    return leaveRoom;
  }, [roomId, (user && user.id)]);

  var speakers = members.length > 0
    ? members.filter(function(m) { return m.role === 'host' || m.role === 'cohost' || m.role === 'speaker'; })
    : [];
  var audience = members.length > 0
    ? members.filter(function(m) { return m.role !== 'host' && m.role !== 'cohost' && m.role !== 'speaker'; })
    : [];

  var speakerList = speakers.length > 0 ? speakers : members.slice(0, 6);
  var audienceList = speakers.length > 0 ? audience : members.slice(6);

  var isHost  = (user && user.id) && (party && party.host_id) && user.id === party.host_id;
  var ytId    = getYouTubeId((party && party.video_url) || '');
  var hostMember = members.find(function(m) { return m.user_id === (party && party.host_id); });
  var myMember   = members.find(function(m) { return m.user_id === (user && user.id); });
  var hostName   = (hostMember && hostMember.user_name) || (party && party.host_name) || 'Host';
  var memberCount = members.length;
  useEffect(function() { setPeakViewers(function(p) { return Math.max(p, Math.max(busViewerCount, memberCount)); }); }, [busViewerCount, memberCount]);
  var vodRecording = useVODRecording({ streamId: roomId || '', creatorId: (user && user.id) || '', title: (party && party.title) || 'Live Audio', stream: localStream });
  var extractClipBlobUrl = vodRecording.extractClipBlobUrl;
  useHighlightDetector({ partyId: roomId, roomId, isHost, user, messages: chatMessages, hypeLevel, elapsedSeconds: elapsed, getClipBlobUrl: extractClipBlobUrl });
  useVoiceAgentRuntime({ chatMessage: chatMessages[chatMessages.length - 1] || null });
  var subCount = useSubscriptionCount((party && party.host_id) || (user && user.id));

  function handleToggleAudio() {
    toggleAudio();
    if ((myMember && myMember.id)) {
      base44.entities.WatchPartyMember.update(myMember.id, { is_audio_enabled: !audioEnabled }).catch(function() {});
    }
  }

  // Keyboard shortcuts: M = mic toggle, Space = push-to-talk (hold)
  useEffect(function() {
    var onDown = function(e) {
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement && document.activeElement.isContentEditable)) return;
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
    var onUp = function(e) {
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
    return function() { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };

  }, [audioEnabled, pttActive]);

  // Apply audio output device to all media elements when speaker pref changes
  useEffect(function() {
    if (!prefSpeaker) return;
    document.querySelectorAll('video, audio').forEach(function(el) {
      if (typeof el.setSinkId === 'function') {
        el.setSinkId(prefSpeaker).catch(function() {});
      }
    });
    try { localStorage.setItem('swl_pref_speaker', prefSpeaker); } catch {}
  }, [prefSpeaker]);

  // Apply live audio processing constraints (NS / EC / AGC)
  useEffect(function() {
    applyAudioConstraints({
      noiseSuppression: noiseSupp,
      echoCancellation: echoCan,
      autoGainControl:  autoGain,
    });
  }, [noiseSupp, echoCan, autoGain, applyAudioConstraints]);

  async function sendLove() {
    if (!(user && user.id) || !roomId) {
      setLoveCount(function(c) { return c + 1; });
      return;
    }
    try {
      await base44.entities.Reaction.create({ room_id: roomId, user_id: user.id, emoji: '❤️', target_type: 'room', target_id: roomId });
      setLoveCount(function(c) { return c + 1; });
    } catch {
      setLoveCount(function(c) { return c + 1; });
    }
  }

  function leaveRoom() {
    if (roomId && (user && user.id)) {
      base44.entities.WatchPartyMember
        .filter({ party_id: roomId, user_id: user.id, is_active: true })
        .then(function(ms) { ms.forEach(function(m) {
          base44.entities.WatchPartyMember.update(m.id, { is_active: false, left_at: new Date().toISOString() }).catch(function() {});
        }); }).catch(function() {});
    }
    window.history.back();
  }

  async function handleCreate() {
    if (!createTitle.trim() || creating) return;
    setCreating(true);
    try {
      var p = await base44.entities.WatchParty.create({
        title:       createTitle.trim(),
        video_url:   createVideoUrl.trim() || '',
        host_id:     (user && user.id),
        status:      'active',
        updated_at_ms: Date.now(),
      });
      setSearchParams({ id: p.id });
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
              onChange={function(e) { setCreateTitle(e.target.value); }}
              placeholder="Room title…"
              className="w-full h-11 px-4 rounded-xl text-white placeholder:text-white/25 outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Barlow Condensed, sans-serif' }}
            />
            <input
              value={createVideoUrl}
              onChange={function(e) { setCreateVideoUrl(e.target.value); }}
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
        <button onClick={function() { window.history.back(); }} className="flex items-center gap-1">
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
          title={'Network: ' + netLabel + (netRtt ? ' · ' + netRtt + 'ms' : '')}>
          {[0,1,2,3].map(function(i) { return (
            <div key={i} className="w-1 rounded-sm"
              style={{
                height: 4 + i * 3,
                background: i < netBars
                  ? (netBars >= 3 ? '#4A9B5E' : netBars >= 2 ? '#D4AF37' : '#C0392B')
                  : 'rgba(0,0,0,0.15)',
              }} />
          ); })}
        </div>
        <button onClick={sendLove} className="flex items-center gap-1">
          <Heart className="w-4 h-4 text-[#C0392B]" fill="#C0392B" />
          <span className="text-sm font-bold" style={{ color: '#555' }}>{loveCount}</span>
        </button>
        <button>
          <MoreHorizontal className="w-5 h-5" style={{ color: '#555' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 80, overscrollBehavior: "contain" }}>

        {(party && party.video_url) && (
          <div className="bg-black" style={{ aspectRatio: '16/9', width: '100%', position: 'relative' }}>
            {ytId ? (
              <img
                src={'https://img.youtube.com/vi/' + ytId + '/mqdefault.jpg'}
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

        {(party && party.video_url) && (
          <div className="px-4 py-3 bg-white border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            <p className="text-base font-black text-black leading-tight">{(party && party.title) || 'Audio Room'}</p>
            <p className="text-sm" style={{ color: '#888' }}>Shared by {hostName}</p>
          </div>
        )}

        {!(party && party.video_url) && (
          <div className="px-4 pt-4 pb-2">
            <p className="text-lg font-black text-black">{(party && party.title) || 'Audio Room'}</p>
            <p className="text-sm" style={{ color: '#888' }}>Hosted by {hostName}</p>
          </div>
        )}

        <AudioStageTab
          roomId={roomId}
          user={user}
          party={party}
          members={members.map(function(m) { return Object.assign({}, m, {
            display_name: m.user_name,
            speaking: m.user_id === (user && user.id) ? localIsSpeaking : m.speaking,
          }); })}
          localStream={localStream}
          remoteStreams={remoteStreams}
          peerUserIds={peerUserIds}
          onLeave={leaveRoom}
        />

        {/* Multi-guest panel (host view) */}
        {isHost && roomId && (
          <MultiGuestPanel
            participants={members}
            spotlightId={spotlightId}
            onSpotlight={function(id) { setSpotlightId(function(prev) { return prev === id ? null : id; }); }}
            roomId={roomId}
            isHost={isHost}
            speakingIds={new Set(Object.keys(speakingIds).filter(function(k) { return speakingIds[k]; }))}
          />
        )}
      </div>

      <div
        className="fixed bottom-0 inset-x-0 flex items-center px-4 gap-3 shrink-0"
        style={{ height: 64, background: 'rgba(8,11,24,0.97)', borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={leaveRoom}
          className="text-[14px] font-black uppercase"
          style={{ color: '#EF4444', fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Leave
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">

          <button
            onClick={function() { setChatOpen(function(v) { return !v; }); }}
            className="flex flex-col items-center gap-0.5"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: chatOpen ? GOLD + '20' : 'rgba(255,255,255,0.07)',
                border: chatOpen ? '1px solid ' + GOLD + '55' : '1px solid rgba(255,255,255,0.12)',
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
            onClick={function() {
              if (navigator.share) {
                navigator.share({ title: (party && party.title) || 'Audio Room', url: window.location.href }).catch(function() {});
              } else {
                navigator.clipboard.writeText(window.location.href).then(function() { toast.success('Link copied!'); }).catch(function() { toast.error('Copy failed.'); });
              }
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>

          <button
            onClick={function() { setHandRaised(function(h) { return !h; }); }}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              background: handRaised ? GOLD + '20' : 'rgba(255,255,255,0.07)',
              border: handRaised ? '1px solid ' + GOLD + '55' : '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Hand className="w-4 h-4" style={{ color: handRaised ? GOLD : 'rgba(255,255,255,0.6)' }} />
          </button>

          <div className="relative flex flex-col items-center gap-0.5">
            <button
              onClick={handleToggleAudio}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{
                background: pttActive ? 'rgba(109,191,126,0.25)' : audioEnabled ? GOLD + '15' : 'rgba(192,57,43,0.15)',
                border: pttActive ? '1px solid rgba(109,191,126,0.6)' : audioEnabled ? '1px solid ' + GOLD + '44' : '1px solid rgba(192,57,43,0.4)',
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
            onClick={function() { setSettingsOpen(function(v) { return !v; }); }}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              background: settingsOpen ? GOLD + '20' : 'rgba(255,255,255,0.07)',
              border: settingsOpen ? '1px solid ' + GOLD + '55' : '1px solid rgba(255,255,255,0.12)',
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
              onClick={function() { setChatOpen(false); }}
            />
            <motion.div
              className="fixed inset-x-0 z-50 flex flex-col rounded-t-2xl overflow-hidden"
              style={{ bottom: 64, height: 220, background: BG, borderTop: '1px solid rgba(212,175,55,0.2)' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="shrink-0 flex items-center justify-between px-4 py-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-black uppercase text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Chat</span>
                <button onClick={function() { setChatOpen(false); }} className="text-white/40 text-sm">✕</button>
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
              onClick={function() { setSettingsOpen(false); }}
            />
            <motion.div
              className="fixed inset-x-0 z-50 rounded-t-2xl overflow-hidden"
              style={{ bottom: 64, background: BG, borderTop: '1px solid rgba(212,175,55,0.2)' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="shrink-0 flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-black uppercase text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Audio Settings</span>
                <button onClick={function() { setSettingsOpen(false); }} className="text-white/40 text-sm">✕</button>
              </div>

              <div className="p-4 space-y-4" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {/* Speaker output */}
                {speakerDevices.length > 1 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5" style={{ color: GOLD }} />
                      <span className="text-xs font-bold uppercase text-white/60">Output Device</span>
                    </div>
                    <MobileSelect
                      value={prefSpeaker}
                      onChange={function(v) { setPrefSpeaker(v); }}
                      options={speakerDevices.map(function(d) { return { value: d.deviceId, label: d.label || ('Speaker ' + d.deviceId.slice(0, 6)) }; })}
                      placeholder="Select speaker"
                    />
                  </div>
                )}

                {/* Audio processing toggles */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase text-white/60">Mic Processing</span>
                  {[
                    { label: 'Noise Suppression', value: noiseSupp, set: setNoiseSupp },
                    { label: 'Echo Cancellation', value: echoCan,   set: setEchoCan   },
                    { label: 'Auto Gain',          value: autoGain,  set: setAutoGain  },
                  ].map(function(item) { var label = item.label; var value = item.value; var set = item.set; return (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-white/80">{label}</span>
                      <button
                        onClick={function() { set(function(v) { return !v; }); }}
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
                  ); })}
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
          creatorId={(party && party.host_id)}
          creatorName={hostName}
        />
      )}
      <SwanAIRecommendations roomId={roomId} currentLayout="audio" viewerCount={memberCount} />
      <MilestoneAlerts userId={(user && user.id)} roomId={roomId} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(party && party.host_id) && <ShopDashboard creatorId={party.host_id} />}
      {roomId && <ZEGOGuestApprovalPanel roomId={roomId} isHost={isHost} />}
      {roomId && <ZEGOStreamHealthCard roomId={roomId} />}
      {user && <ZEGOConfigPanel user={user} />}
      {roomId && <RealtimeLeaderboard roomId={roomId} creatorId={(party && party.host_id) || (user && user.id)} />}
      {roomId && <LiveTranscription isLive={true} roomId={roomId} stream={localStream} />}
      {showViewerControls && roomId && <ViewerControlsPanel roomId={roomId} currentUser={user} onClose={function() { setShowViewerControls(false); }} />}
      {roomId && (user && user.id) && <VirtualCurrencyTips roomId={roomId} creatorId={(party && party.host_id) || (user && user.id)} currentUser={user} isHost={isHost} />}
      {roomId && <GoldenWall roomId={roomId} />}
      {isHost && roomId && <SwanDirectorHUD roomId={roomId} hostId={(user && user.id)} onOpenPanel={function() { setShowSwanPanel(true); }} />}
      {isHost && roomId && <StreamerGoalsWidget creatorId={(party && party.host_id) || (user && user.id)} roomId={roomId} isCreator={isHost} embedded={true} />}
      {isHost && roomId && <PayPerViewManager roomId={roomId} />}
      {isHost && roomId && <MonetizationDashboard roomId={roomId} />}
      {roomId && <GiftShopTray roomId={roomId} currentUser={user} />}
      {roomId && <GiftLeaderboard roomId={roomId} />}
      {isHost && <SubscriptionManager creatorId={(party && party.host_id) || (user && user.id)} />}
      {roomId && <TipAlert roomId={roomId} recipientId={(party && party.host_id) || (user && user.id)} />}
      {!isHost && roomId && <TippingModal isOpen={showTippingModal} onClose={function() { setShowTippingModal(false); }} recipient={{ id: (party && party.host_id) }} roomId={roomId} />}
      {roomId && <LiveAuctionWidget creatorId={(party && party.host_id) || (user && user.id)} roomId={roomId} isCreator={isHost} currentUser={user} />}
      <MerchWidget />
      <NotificationBell />
      {roomId && <PKBattleInterface roomId={roomId} />}
      {roomId && <CoStreamPanel roomId={roomId} />}
      {isHost && roomId && <CollaborativeWhiteboard roomId={roomId} />}
      {roomId && (user && user.id) && <PointsEarnWidget userId={user.id} creatorId={(party && party.host_id) || (user && user.id)} roomId={roomId} isHost={isHost} />}
      {isHost && roomId && <RedemptionQueue creatorId={(party && party.host_id) || (user && user.id)} roomId={roomId} />}
      {roomId && <RewardShop creatorId={(party && party.host_id) || (user && user.id)} roomId={roomId} currentUser={user} />}
      {!isHost && (user && user.id) && <ViewerLoyaltyCard userId={user.id} creatorId={(party && party.host_id) || (user && user.id)} compact={true} />}
      {roomId && <GreenroomQueue roomId={roomId} isHost={isHost} />}
      {isHost && <StreamingPresets onApply={function(p) { reacquireMedia({ resolution: p.resolution }); }} />}
      {roomId && <EmbedPlayer roomId={roomId} creatorName={(user && user.full_name) || ''} streamTitle={(party && party.title) || 'Live Audio'} viewerCount={memberCount} />}
      <LiveTranslationWidget chatMessage={lastChatMsg} onTranslation={function() {}} />
      {isHost && (user && user.id) && <RecordingManager userId={user.id} />}
      {isHost && <OBSBridge />}
      <ZEGOMobileAppBanner />
      {isHost && roomId && <AutomatedClipGenerator streamSession={{room_id: roomId}} isLive={roomId != null} />}
      {roomId && <InteractivePollWidget roomId={roomId} isHost={isHost} />}
      {isHost && <StreamMetadataEditor initialTitle={'Live Audio'} initialCategory={'entertainment'} />}
      {isHost && <StreamerMonetizationCenter />}
      {!isHost && showGiftShop && roomId && <AnimatedGiftShop recipientId={(party && party.host_id) || (user && user.id)} roomId={roomId} onClose={function() { setShowGiftShop(false); }} />}
      {isHost && (user && user.id) && <VirtualGoodsStore userId={user.id} />}
      {isHost && <SoundAlertsManager creatorId={(party && party.host_id) || (user && user.id)} />}
      <ShareToSocial content={{ title: (party && party.title) || 'Audio Room on SeeWhy LIVE', url: window.location.href }} />
      {isHost && roomId && (user && user.id) && <VideoShortRecorder roomId={roomId} creatorId={user.id} />}
      {isHost && <BroadcastAnalyticsDashboard streamSession={party || null} isLive={roomId != null} />}
      {isHost && roomId && <AutomatedHighlightReels streamSession={{room_id: roomId}} />}
      {roomId && <PerformanceDashboard roomId={roomId} sessionId={roomId} />}
      <StreamHealthDashboard isLive={roomId != null} />
      {!isHost && roomId && <QuickTip recipientId={(party && party.host_id) || (user && user.id)} recipientName={''} onTipSent={function(amount) { setTipTotal(function(t) { return t + Math.floor(amount || 0); }); }} />}
      {isHost && <LowerThirdsBanner onBannerChange={function(b) { if (roomId) base44.entities.WatchParty.update(roomId, { lower_thirds_text: b.text, lower_thirds_enabled: b.enabled }).catch(function() {}); }} />}
      {isHost && <SceneSwitcher activeScene={activeScene} onSceneChange={setActiveScene} />}
      <NotificationHub />
      {isHost && <SoundboardWidget isVisible={true} />}
      {isHost && roomId && <RaidPanelButton room={party} currentUser={user} isHost={isHost} triggerOpen={raidTick} />}
      {roomId && <LiveAudiencePulse roomId={roomId} isHost={isHost} viewerCount={memberCount} />}
      {roomId && <StreamAnalyticsDashboard roomId={roomId} />}
      {isHost && roomId && <AIStreamSummary roomId={roomId} isHost={isHost} streamTitle={(party && party.title) || ''} viewerCount={memberCount} elapsedSeconds={elapsed} />}
      {isHost && <ChatModeration collapsed={true} />}
      <BrandChyron />
      {!isHost && showWhisperPanel && roomId && (user && user.id) && <WhisperPanel roomId={roomId} currentUser={user} recipientId={(party && party.host_id) || (user && user.id)} recipientName={''} onClose={function() { setShowWhisperPanel(false); }} />}
      <HostAlertCenter />
      {roomId && <AICopilotSidebar roomId={roomId} isHost={isHost} viewerCount={memberCount} />}
      {isHost && roomId && <EnhancedPollingSystem roomId={roomId} hostId={(party && party.host_id) || (user && user.id)} isHost={isHost} />}
      {roomId && (user && user.id) && <SuperChatBar roomId={roomId} currentUser={user} recipientId={(party && party.host_id) || (user && user.id)} recipientName={''} />}
      {(user && user.id) && <SwanyBotEnhanced userId={user.id} conversationId={null} onContextReady={function() {}} />}
      {isHost && <LocalVideoTile stream={localStream} audioEnabled={audioEnabled} videoEnabled={false} userName={(user && user.full_name) || ''} isHost={isHost} />}
      {isHost && <OctagonalVideoWindow title={'My Mic'} isMuted={!audioEnabled} isVideoOff={true} onMicToggle={handleToggleAudio} onVideoToggle={function() {}} />}
      {isHost && <AudioPanel micMuted={!audioEnabled} onMicToggle={toggleAudio} participants={members} />}
      {isHost && <EvmuxWebSource isActive={showEvmux} onClose={function() { setShowEvmux(false); }} />}
      {roomId && <LivePollOverlay roomId={roomId} currentUser={user} isHost={isHost} position={'bottom-left'} />}
      {isHost && <StripeConnectButton creatorId={(party && party.host_id) || (user && user.id)} />}
      {!isHost && (user && user.id) && <StripeSubscribeButton creatorId={(party && party.host_id) || (user && user.id)} creatorName={''} currentUserId={user.id} />}
      {<SubscriptionTiers communityId={null} userId={(user && user.id)} />}
      {party && <WatchPartyAnalytics party={party} members={members} pollCount={0} reactionCount={0} />}
      {roomId && (user && user.id) && <ZEGOGuestJoin roomId={roomId} userId={user.id} userName={(user && user.full_name) || ''} onJoined={function() { toast.success('Joined stream successfully!'); }} />}
      {roomId && <PaymentMethodSelector creatorId={(party && party.host_id) || (user && user.id)} roomId={roomId} onPaymentComplete={function() { toast.success('Payment complete!'); }} />}
      {isHost && <CreatorTierManager creatorId={(party && party.host_id) || (user && user.id)} />}
      {(user && user.id) && <TierBadge tier={null} size={'sm'} showName={false} />}
      {(user && user.id) && <LoyaltyBadge userId={user.id} creatorId={(party && party.host_id) || (user && user.id)} />}
      {roomId && isHost && <GuestInviteGenerator roomId={roomId} isHost={isHost} />}
      {roomId && <GuestGrid participants={members} isHost={isHost} onInvite={function() { navigator.clipboard.writeText(window.location.href).then(function() { toast.success('Invite link copied!'); }).catch(function() {}); }} hostId={(user && user.id)} speakingIds={speakingIds} />}
      {isHost && roomId && <EnhancedRoomControls isHost={isHost} roomData={party} micMuted={!audioEnabled} onMicToggle={handleToggleAudio} onAudioSettingsChange={function(s) { if (s.noiseSuppression !== undefined) setNoiseSupp(s.noiseSuppression); if (s.echoCancellation !== undefined) setEchoCan(s.echoCancellation); }} />}
      <CollabPlaylist isHost={isHost} currentUser={user} onPlayVideo={function(url) { if (isHost && roomId) base44.entities.WatchParty.update(roomId, { video_url: url, current_time: 0, playback_state: 'paused', updated_at_ms: Date.now() }).catch(function() {}); }} />
      <YouTubeDiscovery />
      <ActivitySidebar isOpen={showActivitySidebar} onClose={function() { setShowActivitySidebar(false); }} />
      {showGlobalSearch && <GlobalSearch onClose={function() { setShowGlobalSearch(false); }} />}
      {roomId && <PayPerViewGate roomId={roomId} ppvPrice={4.99} onPurchase={function() { toast.success('Content unlocked!'); }} />}
      <PaywallGate isHost={isHost} streamTitle={''} onUnlock={function() {}} isUnlocked={true} />
      {roomId && <SubscriptionGate creatorId={(party && party.host_id) || (user && user.id)} roomId={roomId} />}
      {showModerationAppeal && roomId && <ModerationAppealPanel flagId={null} messageId={null} roomId={roomId} onClose={function() { setShowModerationAppeal(false); }} />}
      {isHost && (user && user.id) && <GuestDestinationsPanel participantUserId={user.id} guestName={(user && user.full_name) || ''} />}
      {isHost && <GuestStreamingPermissions participant={null} isHost={isHost} onPermissionChange={function() { toast.success('Permissions updated'); }} />}
      {isHost && roomId && <MultiStreamConfig roomId={roomId} isHost={isHost} />}
      {roomId && <VdoNinjaGuestLink roomId={roomId} />}
      <CameraDeviceSelector compact currentAudioId={activeMicId} onAudioChange={handleMicChange} />
      <PreJoinSettingsModal open={showCamSettings} onClose={function() { setShowCamSettings(false); }} stream={localStream} devices={{ cameras: cameraDevices }} onCameraChange={function(id) { reacquireMedia({ cameraId: id }); }} onResolutionChange={function(res) { reacquireMedia({ resolution: res }); }} />
      {isHost && <LiveCaptionOverlay stream={localStream} position="top" />}
      <WebRTCSetupBanner error={mediaError} audioEnabled={audioEnabled} videoEnabled={false} onRetry={reacquireMedia} />
      {isHost && roomId && <WebhookHooks roomId={roomId} isHost={isHost} />}
      {isHost && <PKBattleSoundboard battleId={roomId} isBattleActive={roomId != null} />}
      <PanelMusicPlayer />
      {isHost && roomId && <PollLaunchBar roomId={roomId} hostId={(user && user.id)} activePoll={activePoll} isHost={isHost} />}
      {party && <PreStreamCountdown room={party} currentUser={user} onGoLive={function() { if (isHost && roomId) base44.entities.WatchParty.update(roomId, { status: 'live' }).catch(function() {}); }} />}
      <PrivatePanel isHost={isHost} currentUser={user} />
      {roomId && <StreamChatbot roomId={roomId} isHost={isHost} elapsedSeconds={elapsed} hostName={(user && user.full_name) || ''} room={party} />}
      {roomId && <StreamEventBus roomId={roomId} isHost={isHost} sessionId={roomId} onViewerUpdate={setBusViewerCount} onTipReceived={function(msg) { setTipTotal(function(t) { return t + Math.floor((msg && msg.tip_amount) || 0); }); }} onMessageReceived={function(msg) {
        var content = (msg && msg.content) || null;
        setLastChatMsg(content);
        if (content) {
          setChatMessages(function(prev) {
            var next = prev.concat([{ content: content }]);
            return next.length > 100 ? next.slice(-100) : next;
          });
          setHypeLevel(function(prev) { return Math.min(100, prev + 2); });
        }
      }} />}
      {roomId && <TippingOverlay roomId={roomId} creatorId={(party && party.host_id) || (user && user.id)} isVisible={true} />}
      {roomId && <UnifiedChat roomId={roomId} currentUser={user} isHost={isHost} />}
      {isHost && roomId && <AIPersonaCustomizer roomId={roomId} sessionId={roomId} onCustomized={function() { toast.success('AI persona configured!'); }} />}
      {isHost && <AudioMixer micMuted={!audioEnabled} onMicToggle={handleToggleAudio} />}
      {isHost && <EnhancedAudioMixer micMuted={!audioEnabled} onMicToggle={handleToggleAudio} onAudioSettingsChange={function(s) { if (s.noiseSuppression !== undefined) setNoiseSupp(s.noiseSuppression); if (s.echoCancellation !== undefined) setEchoCan(s.echoCancellation); }} />}
      {isHost && <ScreenSharePanel isSharing={isSharing} onStartShare={handleStartShare} onStopShare={handleStopShare} />}
      {roomId && <AuraEmotionDisplay roomId={roomId} sessionId={roomId} auraPersona={'hype'} />}
      {roomId && <BattleScoreboard roomId={roomId} />}
      {roomId && (user && user.id) && <EnhancedStreamChat roomId={roomId} userId={user.id} userName={(user && user.full_name) || ''} userRole={isHost ? 'host' : 'viewer'} />}
      <GlobalChatWidget />
      {isHost && roomId && <GuestConnector roomId={roomId} roomName={''} />}
      {roomId && <InteractivePollingSystem roomId={roomId} isHost={isHost} currentUser={user} />}
      {roomId && <LeaderboardPanel roomId={roomId} />}
      {roomId && <MobileStreamControls micMuted={!audioEnabled} onMicToggle={handleToggleAudio} onReact={function(emoji) { setReactEmoji({ emoji: emoji, ts: Date.now() }); }} onQuickTip={function() { if (!isHost) setShowTippingModal(true); }} onWebSource={isHost ? function() { setShowEvmux(true); } : undefined} onPoll={isHost ? function() { setPollTick(function(t) { return t + 1; }); } : undefined} onRaid={isHost ? function() { setRaidTick(function(t) { return t + 1; }); } : undefined} onGoal={isHost ? function() { setGoalTick(function(t) { return t + 1; }); } : undefined} roomId={roomId} />}
      {(user && user.id) && <PointsNotification userId={user.id} />}
      {roomId && (user && user.id) && <EngagementBadgesDisplay roomId={roomId} userId={user.id} creatorId={(party && party.host_id) || (user && user.id)} />}
      {roomId && <ChatOverlay roomId={roomId} isVisible={true} />}
      {roomId && <BattleMode roomId={roomId} isHost={isHost} hostName={(user && user.full_name) || ''} />}
      {isHost && <BitratePresets selected={selectedBitrate} onChange={handleBitrateChange} />}
      {isHost && (user && user.id) && <GuestRTMPPanel participantId={user.id} userId={user.id} />}
      {isHost && <GuestStreamMonitor guestName={(user && user.full_name) || ''} isStreaming={roomId != null} />}
      {roomId && <TranscriptionPanel recordingUrl={''} roomTitle={''} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={isHost} currentTips={tipTotal} currentSubs={subCount} currentViewers={Math.max(busViewerCount, memberCount)} />
      <StreamMetricsBar startTime={elapsed > 0 ? Date.now() - elapsed * 1000 : null} memberCount={Math.max(busViewerCount, memberCount)} tipTotal={tipTotal} peakViewers={peakViewers} netQuality={netQuality} netRtt={netRtt} />
      <ViewerCount count={Math.max(busViewerCount, memberCount)} peakViewers={peakViewers} />
      {isHost && roomId && (user && user.id) && <ClipCreator roomId={roomId} creatorId={user.id} streamTitle={(party && party.title) || ''} elapsedSeconds={elapsed} currentUser={user} />}
      {isHost && roomId && (user && user.id) && <StreamHighlightCapture roomId={roomId} sessionId={roomId} creatorId={user.id} elapsedSeconds={elapsed} isHost={isHost} />}
      {isHost && roomId && <QuickPollLauncher roomId={roomId} hostId={(user && user.id)} isHost={isHost} triggerOpen={pollTick} />}
      {!isHost && roomId && (party && party.host_id) && <GiftTray roomId={roomId} currentUser={user} recipientId={party.host_id} />}
      {isHost && party && <RoomBrandingEditor roomData={party} onBrandingChange={function(b) { if ((party && party.id)) base44.entities.WatchParty.update(party.id, b).catch(function() {}); }} isHost={isHost} />}
      <BackgroundCustomizer />

      {/* ── New feature stubs ──────────────────────────────────────────────── */}
      {roomId && <AIModeration roomId={roomId} isHost={isHost} />}
      {isHost && roomId && <GreenRoomModal isOpen={showGreenRoomModal} onClose={function() { setShowGreenRoomModal(false); }} onReady={function() { setShowGreenRoomModal(false); if (roomId) base44.entities.WatchParty.update(roomId, { status: 'live' }).catch(function() {}); }} localStream={localStream} audioEnabled={audioEnabled} />}
      {isHost && roomId && <WebRTCConfigModal isOpen={showWebRTCConfig} onClose={function() { setShowWebRTCConfig(false); }} onApply={function() { setShowWebRTCConfig(false); }} currentConfig={{}} />}
      {roomId && <BreakoutRoomsModal isOpen={showBreakoutRooms} onClose={function() { setShowBreakoutRooms(false); }} roomId={roomId} roomTitle={(party && party.title) || ''} currentUser={user} />}
      {roomId && <ShareModal isOpen={showShareModal} onClose={function() { setShowShareModal(false); }} url={window.location.origin + '/AudioRoom?id=' + roomId} title={(party && party.title) || 'Audio Room'} />}
      {roomId && <CoStreamHub roomId={roomId} isHost={isHost} isCoHost={false} currentUser={user} compact={true} speakingIds={speakingIds} />}
      {showAuraPanelDrawer && roomId && (party && party.host_id) && <AuraPanelDrawer roomId={roomId} hostId={party.host_id} onClose={function() { setShowAuraPanelDrawer(false); }} />}
      {showSwanPanel && roomId && <SwanDirectorPanel roomId={roomId} hostId={(party && party.host_id) || (user && user.id)} onClose={function() { setShowSwanPanel(false); }} />}
      {roomId && <AuraPanel roomId={roomId} isHost={isHost} streamTitle={(party && party.title) || ''} viewerCount={memberCount} isLive={roomId != null} userTier={'free'} />}
      {isHost && <OverlayThemeBuilder creatorId={(user && user.id)} />}
      <LiveGoalWidget memberCount={memberCount} tipTotal={tipTotal} subCount={subCount} triggerEdit={goalTick} />
      {roomId && user && <RoomReactionOverlay roomId={roomId} currentUser={user} triggerReact={reactEmoji} />}
      <SuperChatRail roomId={roomId} currentUser={user} />
      {roomId && (user && user.id) && (party && party.host_id) && <LoveTap roomId={roomId} user={user} creatorId={party.host_id} creatorName={hostName} />}

      <NetworkQualityBanner quality={netQuality} rtt={netRtt} />

      <KeyboardShortcutsHelp shortcuts={[
        { key: 'M',     label: 'Toggle microphone' },
        { key: 'Space', label: 'Push-to-talk (hold when muted)' },
        { key: '?',     label: 'Show keyboard shortcuts' },
      ]} />
    </div>
  );
}