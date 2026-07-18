import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TipAlert from '../components/monetization/TipAlert';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Radio, Users, MessageSquare, Hand, Settings, 
  LogOut, Mic, MicOff, Video, VideoOff, PhoneOff,
  Share2, MoreVertical, DollarSign, TrendingUp, Circle, StopCircle
} from 'lucide-react';
import StageView from '../components/rooms/StageView';
import ChatPanel from '../components/rooms/ChatPanel';
import ParticipantsList from '../components/rooms/ParticipantsList';
import CollaborativeWhiteboard from '../components/collaboration/CollaborativeWhiteboard';
import CoStreamPanel from '../components/collaboration/CoStreamPanel';
import QuickTip from '../components/rooms/QuickTip';
import ChatModerationPanel from '../components/rooms/ChatModerationPanel';
import RoomAnalyticsPanel from '../components/rooms/RoomAnalyticsPanel';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import ShareButtons from '../components/shared/ShareButtons';
import GreenroomWaitlistPanel from '../components/greenroom/GreenroomWaitlistPanel';
import LiveAuctionWidget from '../components/live/LiveAuctionWidget';
import RaidPanelButton from '../components/live/RaidPanel';
import GiftShopTray from '../components/live/GiftShopTray';
import TipWidget from '../components/live/TipWidget';
import LivePollWidget from '../components/live/LivePollWidget';
import { Link } from 'react-router-dom';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
import { useRemoteSpeakingMap } from '../hooks/useRemoteSpeakingMap';
import { useAutoSpeakGate } from '../hooks/useAutoSpeakGate';
import { useConnectionQuality } from '../hooks/useConnectionQuality';
import { useVODRecording } from '../hooks/useVODRecording';
import { useSubscriptionCount } from '../hooks/useSubscriptionCount';
import NetworkQualityBanner from '../components/live/NetworkQualityBanner';
import KeyboardShortcutsHelp from '../components/live/KeyboardShortcutsHelp';
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
import ModerationToast, { useModerationToasts } from '../components/shared/ModerationToast';
import RoomBrandingEditor from '../components/live/RoomBrandingEditor';
import SwanDirectorPanel, { SwanDirectorHUD } from '../components/live/SwanDirectorPanel';
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
import BroadcastAnalyticsDashboard from '../components/streaming/BroadcastAnalyticsDashboard';
import AutomatedHighlightReels from '../components/streaming/AutomatedHighlightReels';
import PerformanceDashboard from '../components/streaming/PerformanceDashboard';
import StreamHealthDashboard from '../components/streaming/StreamHealthDashboard';
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
import StreamerGoalsWidget from '../components/monetization/StreamerGoalsWidget';
import PayPerViewManager from '../components/monetization/PayPerViewManager';
import MonetizationDashboard from '../components/monetization/MonetizationDashboard';
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
import StreamHealthMonitor from '../components/live/StreamHealthMonitor';
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
import CameraDeviceSelector from '../components/live/CameraDeviceSelector';
import SwanyBotEnhanced from '../components/guide/SwanyBotEnhanced';
import InviteSheet from '../components/live/InviteSheet';
import AuraPanel from '../components/live/AuraPanel';
import GuestControls from '../components/live/GuestControls';
import AggregatedChat from '../components/live/AggregatedChat';
import LoveHearts from '../components/live/LoveHearts';
import ClipMarker from '../components/live/ClipMarker';
import GuestQueue from '../components/live/GuestQueue';
import StreamMetricsBar from '../components/live/StreamMetricsBar';
import SuperChatRail from '../components/live/SuperChatRail';
import LiveGoalWidget from '../components/live/LiveGoalWidget';
import AIModeration from '../components/live/AIModeration';
import LoveTap from '../components/live/LoveTap';
import PKBattle from '../components/live/PKBattle';
import PKBattleModal from '../components/live/PKBattleModal';
import BreakoutRoomsModal from '../components/live/BreakoutRoomsModal';
import ShareModal from '../components/live/ShareModal';
import WebRTCConfigModal from '../components/live/WebRTCConfigModal';
import CoStreamHub from '../components/live/CoStreamHub';
import GreenRoomModal from '../components/live/GreenRoomModal';
import GreenRoomPreflight from '../components/live/GreenRoomPreflight';
import OverlayThemeBuilder from '../components/live/OverlayThemeBuilder';
import ClipCreatorSheet from '../components/live/ClipCreatorSheet';
import AuraPanelDrawer from '../components/live/AuraPanelDrawer';
import PartyHypeMeter from '../components/watchparty/PartyHypeMeter';
import { useHighlightDetector } from '../hooks/useHighlightDetector';
import { useVoiceAgentRuntime } from '../hooks/useVoiceAgentRuntime';
export default function RoomPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [stages, setStages] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [pinnedId, setPinnedId] = useState(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showPreflight, setShowPreflight] = useState(false);
  const [showGreenRoomModal, setShowGreenRoomModal] = useState(false);
  const [showActivitySidebar, setShowActivitySidebar] = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [showPKBattleModal, setShowPKBattleModal] = useState(false);
  const [showBreakoutRooms, setShowBreakoutRooms] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showWebRTCConfig, setShowWebRTCConfig] = useState(false);
  const [showAuraPanelDrawer, setShowAuraPanelDrawer] = useState(false);
  const [showCamSettings, setShowCamSettings] = useState(false);
  const [showEvmux, setShowEvmux] = useState(false);
  const [showClipCreator, setShowClipCreator] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const screenStreamRef = useRef(null);
  const handleStartShare = (stream) => { if (!stream) return; screenStreamRef.current = stream; const vt = stream.getVideoTracks()[0]; if (vt) vt.onended = () => { screenStreamRef.current = null; setIsSharing(false); }; setIsSharing(true); };
  const handleStopShare = () => { screenStreamRef.current?.getTracks().forEach(t => t.stop()); screenStreamRef.current = null; setIsSharing(false); };
  const [activeScene, setActiveScene] = useState('main');
  const [selectedBitrate, setSelectedBitrate] = useState(3000);
  const handleBitrateChange = (b) => { setSelectedBitrate(b); reacquireMedia({ resolution: ({1500:'480p',3000:'720p',5000:'1080p',7500:'1080p'})[b]||'720p' }); };
  const [isRecording, setIsRecording] = useState(false);
  const [showSwanPanel, setShowSwanPanel] = useState(false);
  const [showGiftShop, setShowGiftShop] = useState(false);
  const [showWhisperPanel, setShowWhisperPanel] = useState(false);
  const [showModerationAppeal, setShowModerationAppeal] = useState(false);
  const recordingRef = useRef(null);
  const recordingStartRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Real local camera/mic stream — seed device IDs from stored preferences
  const prefCamRoom = (() => { try { return localStorage.getItem('swl_pref_cam') || null; } catch { return null; } })();
  const prefMicRoom = (() => { try { return localStorage.getItem('swl_pref_mic') || null; } catch { return null; } })();
  const [activeCamId, setActiveCamId] = useState(prefCamRoom);
  const [activeMicId, setActiveMicId] = useState(prefMicRoom);
  const { localStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo, error: mediaError, reacquire: reacquireMedia } = useLocalMedia({ audio: true, video: true, videoDeviceId: prefCamRoom, audioDeviceId: prefMicRoom });
  const handleCamChange = (id) => { setActiveCamId(id); try { localStorage.setItem('swl_pref_cam', id); } catch {} reacquireMedia({ videoDeviceId: id }); };
  const handleMicChange = (id) => { setActiveMicId(id); try { localStorage.setItem('swl_pref_mic', id); } catch {} reacquireMedia({ audioDeviceId: id }); };

  // Speaking detection + network quality
  const { isSpeaking } = useAutoSpeakGate({ stream: localStream, enabled: !!localStream });
  const remoteSpeakingIds = useRemoteSpeakingMap(remoteStreams, peerUserIds);
  const speakingIds = isSpeaking && user?.id ? { ...remoteSpeakingIds, [user.id]: true } : remoteSpeakingIds;
  const [activePc, setActivePc] = useState(null);
  useEffect(() => {
    const entries = Array.from(peersRef?.current?.entries() || []);
    const connected = entries.find(([, { pc }]) => pc.connectionState === 'connected');
    setActivePc(connected ? connected[1].pc : null);
  }, [remoteStreams]); // eslint-disable-line react-hooks/exhaustive-deps
  const { quality: netQuality, rtt: netRtt } = useConnectionQuality(activePc, 5000);

  // VOD recording — activated once host has a local stream and room is loaded
  const { extractClipBlobUrl } = useVODRecording({ streamId: roomId || '', creatorId: user?.id || '', title: room?.title || 'Live Room', stream: localStream });
  const subCount = useSubscriptionCount(room?.host_id || user?.id);
  const [busViewerCount, setBusViewerCount] = useState(0);
  const [tipTotal, setTipTotal] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [showViewerControls, setShowViewerControls] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [hypeLevel, setHypeLevel] = useState(0);
  useHighlightDetector({ partyId: roomId, roomId, isHost, user, messages: chatMessages, hypeLevel, elapsedSeconds: elapsed, getClipBlobUrl: extractClipBlobUrl });
  useVoiceAgentRuntime({ chatMessage: chatMessages[chatMessages.length - 1] || null });

  // Stream start time — set once on mount
  const streamStartRef = useRef(Date.now());

  // Elapsed-seconds counter (starts when component mounts)
  const [elapsed, setElapsed] = useState(0);
  const elapsedTimerRef = useRef(null);
  useEffect(() => {
    elapsedTimerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(elapsedTimerRef.current);
  }, []);

  // Push-to-talk (Space bar) — unmutes mic while held, remutes on release
  const [pttActive, setPttActive] = useState(false);
  const pttWasEnabledRef = useRef(false);
  useEffect(() => {
    const onDown = (e) => {
      if (e.code !== 'Space' || e.repeat) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      if (!pttActive && !audioEnabled) {
        pttWasEnabledRef.current = false;
        toggleAudio();
        setPttActive(true);
      }
    };
    const onUp = (e) => {
      if (e.code !== 'Space' || !pttActive) return;
      toggleAudio();
      setPttActive(false);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [pttActive, audioEnabled, toggleAudio]);

  // M = toggle mic, V = toggle camera (when not in a text input)
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      if (e.key === 'm' || e.key === 'M') toggleAudio();
      if (e.key === 'v' || e.key === 'V') toggleVideo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleAudio, toggleVideo]);

  // WebRTC peer mesh — connects to all other participants via STUN/TURN
  const { remoteStreams, peerUserIds, announceJoin, leaveRoom, peersRef } = useWebRTCPeers(roomId, localStream);
  const announceJoinRef = useRef(announceJoin);
  const leaveRoomRef = useRef(leaveRoom);
  useEffect(() => { announceJoinRef.current = announceJoin; }, [announceJoin]);
  useEffect(() => { leaveRoomRef.current = leaveRoom; }, [leaveRoom]);
  const announcedRef = useRef(false);
  useEffect(() => {
    if (!localStream || !user?.id || announcedRef.current) return;
    announcedRef.current = true;
    announceJoinRef.current?.(user.id);
  }, [localStream, user?.id]);
  useEffect(() => { return () => leaveRoomRef.current?.(); }, []);

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => base44.entities.Room.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
  });

  const { data: fetchedStages = [] } = useQuery({
    queryKey: ['stages', roomId],
    queryFn: () => base44.entities.Stage.filter({ room_id: roomId }, 'order'),
    enabled: !!roomId,
  });

  const { data: fetchedParticipants = [] } = useQuery({
    queryKey: ['participants', roomId],
    queryFn: () => base44.entities.Participant.filter({ room_id: roomId }),
    enabled: !!roomId,
  });

  useEffect(() => {
    setStages(fetchedStages);
  }, [fetchedStages]);

  useEffect(() => {
    setParticipants(fetchedParticipants);
    if (user) {
      const myParticipant = fetchedParticipants.find(p => p.user_id === user.id);
      setCurrentParticipant(myParticipant);
    }
  }, [fetchedParticipants, user]);

  // Increment viewer count on join, decrement on leave
  useEffect(() => {
    if (!room || !user) return;
    base44.entities.Room.update(room.id, { viewer_count: (room.viewer_count || 0) + 1 }).catch(() => {});
    return () => {
      base44.entities.Room.update(room.id, { viewer_count: Math.max(0, (room.viewer_count || 1) - 1) }).catch(() => {});
    };
  }, [room?.id, user?.id]);

  // Real-time subscriptions
  useEffect(() => {
    if (!roomId) return;

    const unsubParticipants = base44.entities.Participant.subscribe((event) => {
      if (event.data.room_id === roomId) {
        if (event.type === 'create') {
          setParticipants(prev => [...prev, event.data]);
        } else if (event.type === 'update') {
          setParticipants(prev => prev.map(p => p.id === event.id ? event.data : p));
          if (event.data.user_id === user?.id) {
            setCurrentParticipant(event.data);
          }
        } else if (event.type === 'delete') {
          setParticipants(prev => prev.filter(p => p.id !== event.id));
        }
      }
    });

    return () => {
      unsubParticipants();
    };
  }, [roomId, user]);

  const joinRoomMutation = useMutation({
    mutationFn: async () => {
      const existingParticipant = participants.find(p => p.user_id === user.id);
      if (existingParticipant) {
        return existingParticipant;
      }

      return await base44.entities.Participant.create({
        room_id: roomId,
        user_id: user.id,
        user_name: user.full_name || user.email,
        user_avatar: user.avatar_url,
        role: room.host_id === user.id ? 'host' : 'audience',
        status: 'online',
        joined_at: new Date().toISOString(),
      });
    },
    onSuccess: async (participant) => {
      setCurrentParticipant(participant);
      toast.success('Joined room successfully!');
      // Log activity
      try {
        const me = await base44.auth.me();
        await base44.entities.Activity.create({
          user_id: me.id,
          type: 'room_joined',
          title: `Joined room: ${room.title}`,
          entity_id: roomId,
          entity_type: 'Room',
          is_public: room.is_public,
        });
        // Award ViewerPoints for joining
        const existing = await base44.entities.ViewerPoints.filter({ user_id: me.id, creator_id: room.host_id });
        if (existing.length > 0) {
          await base44.entities.ViewerPoints.update(existing[0].id, {
            points: (existing[0].points || 0) + 5,
          });
        } else {
          await base44.entities.ViewerPoints.create({
            user_id: me.id,
            creator_id: room.host_id,
            points: 5,
          });
        }
      } catch (_) {}
    },
    onError: () => toast.error('Action failed.'),
  });

  const leaveRoomMutation = useMutation({
    mutationFn: async () => {
      if (currentParticipant) {
        await base44.entities.Participant.delete(currentParticipant.id);
      }
    },
    onSuccess: () => {
      window.location.href = createPageUrl('Home');
    },
    onError: () => toast.error('Action failed.'),
  });

  const updateParticipantMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      return await base44.entities.Participant.update(id, updates);
    },
    onError: () => toast.error('Action failed.'),
  });

  const startRecordingMutation = useMutation({
    mutationFn: async () => {
      const rec = await base44.entities.Recording.create({
        room_id: roomId,
        host_id: room.host_id,
        title: room.title,
        started_at: new Date().toISOString(),
        status: 'recording',
        stream_url: `${window.location.origin}${createPageUrl('Room')}?id=${roomId}`,
        viewer_count: room.viewer_count || 0,
      });
      return rec;
    },
    onSuccess: (rec) => {
      recordingRef.current = rec.id;
      recordingStartRef.current = Date.now();
      setIsRecording(true);
      toast.success('Recording started');
    },
    onError: () => toast.error('Action failed.'),
  });

  const stopRecordingMutation = useMutation({
    mutationFn: async () => {
      if (!recordingRef.current) return;
      const duration = Math.floor((Date.now() - (recordingStartRef.current || Date.now())) / 1000);
      await base44.entities.Recording.update(recordingRef.current, {
        ended_at: new Date().toISOString(),
        status: 'ready',
        duration_seconds: duration,
      });
    },
    onSuccess: () => {
      setIsRecording(false);
      recordingRef.current = null;
      toast.success('Recording saved to Past Streams');
    },
    onError: () => toast.error('Action failed.'),
  });

  const raiseHandMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.Participant.update(currentParticipant.id, {
        hand_raised: !currentParticipant.hand_raised,
        hand_raised_at: !currentParticipant.hand_raised ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      toast.success(currentParticipant.hand_raised ? 'Hand lowered' : 'Hand raised!');
    },
    onError: () => toast.error('Action failed.'),
  });

  useEffect(() => {
    if (room && user && !currentParticipant) {
      joinRoomMutation.mutate();
    }
  }, [room, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080B18' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'rgba(212,175,55,0.3)', borderTopColor: '#D4AF37' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Loading room…</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080B18' }}>
        <div className="text-center">
          <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Room not found</h2>
          <p className="mb-4 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>This room doesn't exist or has been deleted</p>
          <button onClick={() => window.location.href = createPageUrl('Home')}
            className="px-5 py-2.5 rounded-xl font-black uppercase text-sm"
            style={{ background: '#800020', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isHost = currentParticipant?.role === 'host';
  const isSpeaker = ['host', 'co-host', 'speaker'].includes(currentParticipant?.role);

  // Moderation toasts for audience
  const { toasts: modToasts, push: pushModToast } = useModerationToasts();
  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.ChatModeration.subscribe((event) => {
      if (event.type !== 'create') return;
      const d = event.data;
      if (d?.room_id !== roomId || !d?.auto_detected) return;
      pushModToast({ type: d.action_type === 'ban' ? 'ban' : 'mute', target: d.target_user_name || 'User' });
    });
    return unsub;
  }, [roomId]);

  const hostParticipant = participants.find(p => p.user_id === room.host_id);
  const speakerName = participants.find(p => p.is_speaking)?.user_name;

  return (
    <div className="min-h-screen" style={{ background: '#080B18' }}>
      <NetworkQualityBanner quality={netQuality} rtt={netRtt} />
      <KeyboardShortcutsHelp shortcuts={[
        { key: 'Space', label: 'Push-to-talk (hold)' },
        { key: 'M', label: 'Toggle microphone' },
        { key: 'V', label: 'Toggle camera' },
        { key: '?', label: 'Show shortcuts' },
      ]} />
      {isHost && roomId && <StreamerGoalsWidget creatorId={room?.host_id || user?.id} roomId={roomId} isCreator={isHost} embedded={true} />}
      {isHost && roomId && <PayPerViewManager roomId={roomId} />}
      {isHost && roomId && <MonetizationDashboard roomId={roomId} />}
      {roomId && <GiftShopTray roomId={roomId} currentUser={user} />}
      {roomId && <GiftLeaderboard roomId={roomId} />}
      {isHost && <SubscriptionManager creatorId={room?.host_id || user?.id} />}
      {/* Tip Alert */}
      <TipAlert roomId={roomId} recipientId={room?.host_id} />

      {/* Fanbase-style top bar */}
      <div className="sticky top-0 z-50" style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        {/* Row 1: nav + title + badges + actions */}
        <div className="flex items-center gap-2 px-3 h-12">
          <button onClick={() => leaveRoomMutation.mutate()}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            <PhoneOff className="w-4 h-4" />
          </button>
          <h1 className="flex-1 font-black text-white text-sm leading-none truncate"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            {room.title}
          </h1>
          {room.status === 'live' && (
            <span className="shrink-0 px-2 py-0.5 rounded-md text-white font-black text-[11px] uppercase animate-pulse"
              style={{ background: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif' }}>LIVE</span>
          )}
          <span className="shrink-0 px-2 py-0.5 rounded-md font-black text-[11px] uppercase"
            style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>
            SeeWhy LIVE
          </span>
          <ShareButtons url={`${window.location.origin}${createPageUrl('Room')}?id=${roomId}`} title={room?.title} />
          <button onClick={() => setShowWhiteboard(!showWhiteboard)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            <Share2 className="w-4 h-4" />
          </button>
          {isHost && (
            <>
              <GreenroomWaitlistPanel roomId={roomId} currentUser={user} />
              <RaidPanelButton room={room} currentUser={user} isHost={isHost} />
              <button
                onClick={() => { if (isRecording) stopRecordingMutation.mutate(); else startRecordingMutation.mutate(); }}
                disabled={startRecordingMutation.isPending || stopRecordingMutation.isPending}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: isRecording ? 'rgba(192,57,43,0.15)' : 'rgba(255,255,255,0.06)', color: isRecording ? '#C0392B' : 'rgba(255,255,255,0.4)' }}>
                {isRecording ? <StopCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              </button>
              <button
                onClick={async () => {
                  try {
                    if (isRecording) await stopRecordingMutation.mutateAsync();
                    await base44.entities.Room.update(room.id, { status: 'ended', ended_at: new Date().toISOString() });
                    toast.success('Stream ended');
                    queryClient.invalidateQueries({ queryKey: ['room', roomId] });
                  } catch {
                    toast.error('Failed to end stream.');
                  }
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Row 2: host + count + meta */}
        <div className="flex items-center gap-3 px-3 pb-2">
          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0"
            style={{ background: 'linear-gradient(135deg, #800020, #D4AF37)' }}>
            {hostParticipant?.user_avatar
              ? <img src={hostParticipant.user_avatar} alt="" className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center text-[11px] font-black text-black">
                  {(hostParticipant?.user_name || room.title || '?')[0].toUpperCase()}
                </span>}
          </div>
          <span className="text-[10px] font-black truncate max-w-[100px]"
            style={{ color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>
            {hostParticipant?.user_name || 'Host'}
          </span>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Users className="w-3 h-3 inline mr-0.5" />{participants.length}
          </span>
          {speakerName && (
            <span className="text-[10px] ml-auto" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              🎙 {speakerName} is speaking
            </span>
          )}
          {isHost && (
            <div className="flex items-center gap-1 ml-auto">
              <Link to={`/ControlRoom?room_id=${roomId}`}>
                <button className="flex items-center gap-1 px-2 py-0.5 rounded-lg font-black uppercase text-[11px]"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  📡 Ctrl
                </button>
              </Link>
              <Link to={`/ModerationDashboard?room_id=${roomId}`}>
                <button className="flex items-center gap-1 px-2 py-0.5 rounded-lg font-black uppercase text-[11px]"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  🛡 Mod
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Column - Stage & Controls */}
          <div className="lg:col-span-3 space-y-4">
            {/* Stage */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
              {stages.length > 0 ? (
                <Tabs defaultValue={stages[0]?.id} className="space-y-4">
                  {stages.length > 1 && (
                    <TabsList>
                      {stages.map(stage => (
                        <TabsTrigger key={stage.id} value={stage.id}>
                          {stage.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  )}

                  {stages.map(stage => (
                    <TabsContent key={stage.id} value={stage.id}>
                      <StageView
                        stage={stage}
                        participants={participants}
                        currentUserId={user?.id}
                        onUpdateParticipant={(id, updates) =>
                          updateParticipantMutation.mutate({ id, updates })
                        }
                        localStream={localStream}
                        localAudioEnabled={audioEnabled}
                        localVideoEnabled={videoEnabled}
                        onToggleAudio={toggleAudio}
                        onToggleVideo={toggleVideo}
                        remoteStreams={remoteStreams}
                        peerUserIds={peerUserIds}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No stages available</p>
                </div>
              )}
            </div>

            {/* Whiteboard */}
            {showWhiteboard && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
                <h3 className="font-semibold mb-4 text-white">Collaborative Whiteboard</h3>
                <CollaborativeWhiteboard roomId={roomId} />
              </div>
            )}

            {/* Quick Tip */}
            {room?.host_id !== user?.id && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-white">
                  <DollarSign className="w-5 h-5" style={{ color: '#D4AF37' }} />
                  Support the Creator
                </h3>
                <QuickTip recipientId={room.host_id} recipientName="Host" />
              </div>
            )}

            {/* Control Bar */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
              <div className="flex items-center justify-center gap-3">
                {/* Gift Shop Tray + Tip for viewers */}
                {user && !isHost && (
                  <>
                    <GiftShopTray roomId={roomId} currentUser={user} />
                    <TipWidget roomId={roomId} hostId={room.host_id} currentUser={user} />
                  </>
                )}
                {currentParticipant && (
                     <>
                    <Button
                      size="lg"
                      variant={audioEnabled ? "default" : "destructive"}
                      className="w-16 h-16 rounded-full"
                      onClick={() => {
                        toggleAudio();
                        updateParticipantMutation.mutate({
                          id: currentParticipant.id,
                          updates: { is_audio_enabled: !audioEnabled }
                        });
                      }}
                      disabled={!isSpeaker}
                    >
                      {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    </Button>

                    <Button
                      size="lg"
                      variant={videoEnabled ? "default" : "outline"}
                      className="w-16 h-16 rounded-full"
                      onClick={() => {
                        toggleVideo();
                        updateParticipantMutation.mutate({
                          id: currentParticipant.id,
                          updates: { is_video_enabled: !videoEnabled }
                        });
                      }}
                      disabled={!isSpeaker}
                    >
                      {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </Button>

                    {!isSpeaker && (
                      <Button
                        size="lg"
                        variant={currentParticipant.hand_raised ? "default" : "outline"}
                        className="w-16 h-16 rounded-full"
                        onClick={() => raiseHandMutation.mutate()}
                      >
                        <Hand className="w-6 h-6" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Chat & Participants */}
          <div className="lg:col-span-1 text-white">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-200px)]">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="chat">
                  <MessageSquare className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="participants">
                  <Users className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="costream">
                  <Video className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <TrendingUp className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="h-full mt-4">
                <ChatPanel roomId={roomId} currentUser={user} isHost={isHost} />
              </TabsContent>

              <TabsContent value="participants" className="h-full mt-4">
                <ParticipantsList
                  participants={participants}
                  currentUser={user}
                  roomId={roomId}
                  communityId={room.community_id}
                  onUpdateParticipant={(id, updates) => 
                    updateParticipantMutation.mutate({ id, updates })
                  }
                  onInviteToStage={(participant) => {
                    updateParticipantMutation.mutate({
                      id: participant.id,
                      updates: { 
                        role: 'speaker',
                        stage_id: stages[0]?.id,
                        hand_raised: false
                      }
                    });
                    toast.success(`Invited ${participant.user_name} to stage`);
                  }}
                />
              </TabsContent>

              <TabsContent value="costream" className="h-full mt-4 overflow-auto">
                <CoStreamPanel roomId={roomId} />
              </TabsContent>

              <TabsContent value="analytics" className="h-full mt-4 overflow-auto">
                {isHost ? (
                  <RoomAnalyticsPanel roomId={roomId} />
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">Only the host can view analytics</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Moderation Panel for Host */}
            {isHost && (
              <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.08)' }}>
                <ChatModerationPanel roomId={roomId} />
              </div>
            )}
            {/* Stream Health Monitor for host */}
            {isHost && room?.status === 'live' && (
              <div className="mt-3">
                <StreamHealthMonitor isLive={true} />
              </div>
            )}
            {/* Live Auctions - visible to all */}
            <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.08)' }}>
              <LiveAuctionWidget roomId={roomId} currentUser={user} isHost={isHost} />
            </div>
            {/* Live Poll Widget */}
            <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.08)' }}>
              <LivePollWidget roomId={roomId} currentUser={user} isHost={isHost} />
            </div>
          </div>
        </div>
      </div>
      <SwanAIRecommendations roomId={roomId} currentLayout="default" viewerCount={participants.length} />
      <MilestoneAlerts userId={user?.id} roomId={roomId} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {room?.host_id && <ShopDashboard creatorId={room.host_id} />}
      {roomId && <ZEGOGuestApprovalPanel roomId={roomId} isHost={isHost} />}
      {roomId && <ZEGOStreamHealthCard roomId={roomId} />}
      {user && <ZEGOConfigPanel user={user} />}
      {roomId && <RealtimeLeaderboard roomId={roomId} creatorId={room?.host_id || user?.id} />}
      {roomId && <LiveTranscription isLive={true} roomId={roomId} stream={localStream} speaker={user?.full_name} />}
      {showViewerControls && roomId && <ViewerControlsPanel roomId={roomId} currentUser={user} onClose={() => setShowViewerControls(false)} />}
      {roomId && user?.id && <VirtualCurrencyTips roomId={roomId} creatorId={room?.host_id || user?.id} currentUser={user} isHost={isHost} />}
      {roomId && <GoldenWall roomId={roomId} />}
      {isHost && roomId && <SwanDirectorHUD roomId={roomId} hostId={user?.id} onOpenPanel={() => setShowSwanPanel(true)} />}
      {roomId && <PKBattleInterface roomId={roomId} />}
      {roomId && <CoStreamPanel roomId={roomId} />}
      {isHost && roomId && <CollaborativeWhiteboard roomId={roomId} />}
      {roomId && user?.id && <PointsEarnWidget userId={user.id} creatorId={room?.host_id || user?.id} roomId={roomId} isHost={isHost} />}
      {isHost && roomId && <RedemptionQueue creatorId={room?.host_id || user?.id} roomId={roomId} />}
      {roomId && <RewardShop creatorId={room?.host_id || user?.id} roomId={roomId} currentUser={user} />}
      {!isHost && user?.id && <ViewerLoyaltyCard userId={user.id} creatorId={room?.host_id || user?.id} compact={true} />}
      {roomId && <GreenroomQueue roomId={roomId} isHost={isHost} />}
      {isHost && <StreamingPresets onApply={(p) => reacquireMedia({ resolution: p.resolution })} />}
      {roomId && <EmbedPlayer roomId={roomId} creatorName={user?.full_name || ''} streamTitle={room?.title || 'Live Stream'} viewerCount={participants.length} />}
      <LiveTranslationWidget chatMessage={chatMessages[chatMessages.length - 1]?.content || null} onTranslation={() => {}} />
      {isHost && user?.id && <RecordingManager userId={user.id} />}
      {isHost && <OBSBridge />}
      <ZEGOMobileAppBanner />
      {isHost && roomId && <AutomatedClipGenerator streamSession={{room_id: roomId}} isLive={roomId != null} />}
      {roomId && <InteractivePollWidget roomId={roomId} isHost={isHost} />}
      {isHost && <StreamMetadataEditor initialTitle={room?.title || 'Live Stream'} initialCategory={'entertainment'} />}
      {isHost && <StreamerMonetizationCenter />}
      {!isHost && showGiftShop && roomId && <AnimatedGiftShop recipientId={room?.host_id || user?.id} roomId={roomId} onClose={() => setShowGiftShop(false)} />}
      {isHost && user?.id && <VirtualGoodsStore userId={user.id} />}
      {isHost && <SoundAlertsManager creatorId={room?.host_id || user?.id} />}
      <ShareToSocial content={{text: ''}} />
      {isHost && roomId && user?.id && <VideoShortRecorder roomId={roomId} creatorId={user.id} />}
      {isHost && <BroadcastAnalyticsDashboard streamSession={null} isLive={roomId != null} />}
      {isHost && roomId && <AutomatedHighlightReels streamSession={{room_id: roomId}} />}
      {roomId && <PerformanceDashboard roomId={roomId} sessionId={roomId} />}
      <StreamHealthDashboard isLive={roomId != null} />
      {!isHost && roomId && <QuickTip recipientId={room?.host_id || user?.id} recipientName={''} onTipSent={(amount) => setTipTotal(t => t + Math.floor(amount || 0))} />}
      {isHost && <LowerThirdsBanner onBannerChange={(b) => { if (roomId) base44.entities.Room.update(roomId, { lower_thirds_text: b.text, lower_thirds_enabled: b.enabled }).catch(() => {}); }} />}
      {isHost && <SceneSwitcher activeScene={activeScene} onSceneChange={(s) => { setActiveScene(s); if ((s === 'screen' || s === 'pip') && !isSharing) screenStreamRef.current || navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then(st => handleStartShare(st)).catch(() => {}); else if (s === 'camera' && isSharing) handleStopShare(); }} />}
      <NotificationHub />
      {isHost && <SoundboardWidget isVisible={true} />}
      {isHost && roomId && <RaidPanelButton room={room} currentUser={user} isHost={isHost} />}
      {roomId && <LiveAudiencePulse roomId={roomId} isHost={isHost} viewerCount={participants.length} />}
      {roomId && <StreamAnalyticsDashboard roomId={roomId} />}
      {isHost && roomId && <AIStreamSummary roomId={roomId} isHost={isHost} streamTitle={room?.title || ''} viewerCount={participants.length} elapsedSeconds={elapsed} />}
      {isHost && <ChatModeration collapsed={true} />}
      <BrandChyron />
      {!isHost && showWhisperPanel && roomId && user?.id && <WhisperPanel roomId={roomId} currentUser={user} recipientId={room?.host_id || user?.id} recipientName={''} onClose={() => setShowWhisperPanel(false)} />}
      <HostAlertCenter />
      {roomId && <AICopilotSidebar roomId={roomId} isHost={isHost} viewerCount={participants.length} />}
      {isHost && roomId && <EnhancedPollingSystem roomId={roomId} hostId={room?.host_id || user?.id} isHost={isHost} />}
      {roomId && user?.id && <SuperChatBar roomId={roomId} currentUser={user} recipientId={room?.host_id || user?.id} recipientName={''} />}
      {user?.id && <SwanyBotEnhanced userId={user.id} conversationId={null} onContextReady={() => {}} />}
      {isHost && <LocalVideoTile stream={localStream} audioEnabled={audioEnabled} videoEnabled={videoEnabled} userName={user?.full_name || ''} isHost={isHost} isSpeaking={isSpeaking} />}
      {isHost && <OctagonalVideoWindow title={'My Camera'} isMuted={!audioEnabled} isVideoOff={!videoEnabled} onMicToggle={toggleAudio} onVideoToggle={toggleVideo} />}
      {isHost && roomId && <PipCameraTile localStream={localStream} videoEnabled={videoEnabled} roomId={roomId} tipTotal={tipTotal} />}
      {isHost && <PreJoinSettingsModal open={showCamSettings} onClose={() => setShowCamSettings(false)} stream={localStream} devices={{ cameras: [] }} onCameraChange={handleCamChange} onResolutionChange={(res) => reacquireMedia({ resolution: res })} />}
      {isHost && <LiveCaptionOverlay stream={localStream} />}
      {isHost && <CameraDeviceSelector compact currentVideoId={activeCamId} currentAudioId={activeMicId} onVideoChange={handleCamChange} onAudioChange={handleMicChange} />}
      {isHost && <AudioPanel micMuted={!audioEnabled} onMicToggle={toggleAudio} participants={participants} />}
      {isHost && <EvmuxWebSource isActive={showEvmux} onClose={() => setShowEvmux(false)} />}
      {roomId && <LivePollOverlay roomId={roomId} currentUser={user} isHost={isHost} position={'bottom-left'} />}
      {isHost && <StripeConnectButton creatorId={room?.host_id || user?.id} />}
      {!isHost && user?.id && <StripeSubscribeButton creatorId={room?.host_id || user?.id} creatorName={''} currentUserId={user.id} />}
      {<SubscriptionTiers communityId={null} userId={user?.id} />}
      {room && <WatchPartyAnalytics party={room} members={participants} pollCount={0} reactionCount={0} />}
      {roomId && user?.id && <ZEGOGuestJoin roomId={roomId} userId={user.id} userName={user?.full_name || ''} onJoined={() => toast.success('Joined stream successfully!')} />}
      {roomId && <PaymentMethodSelector creatorId={room?.host_id || user?.id} roomId={roomId} onPaymentComplete={() => toast.success('Payment complete!')} />}
      {isHost && <CreatorTierManager creatorId={room?.host_id || user?.id} />}
      {user?.id && <TierBadge tier={null} size={'sm'} showName={false} />}
      {user?.id && <LoyaltyBadge userId={user.id} creatorId={room?.host_id || user?.id} />}
      {roomId && isHost && <GuestInviteGenerator roomId={roomId} isHost={isHost} />}
      {roomId && <GuestGrid participants={participants} isHost={isHost} onInvite={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('Invite link copied!')).catch(() => {})} hostId={user?.id} speakingIds={speakingIds} />}
      {isHost && roomId && <EnhancedRoomControls isHost={isHost} roomData={room} micMuted={!audioEnabled} onMicToggle={toggleAudio} onAudioSettingsChange={() => {}} />}
      <CollabPlaylist isHost={isHost} currentUser={user} onPlayVideo={(url) => { if (isHost && roomId) base44.entities.Room.update(roomId, { video_url: url }).catch(() => {}); }} />
      <YouTubeDiscovery />
      <ActivitySidebar isOpen={showActivitySidebar} onClose={() => setShowActivitySidebar(false)} />
      {showGlobalSearch && <GlobalSearch onClose={() => setShowGlobalSearch(false)} />}
      {roomId && <PayPerViewGate roomId={roomId} ppvPrice={4.99} onPurchase={() => toast.success('Content unlocked!')} />}
      <PaywallGate isHost={isHost} streamTitle={room?.title || ''} onUnlock={() => {}} isUnlocked={true} />
      {roomId && <SubscriptionGate creatorId={room?.host_id || user?.id} roomId={roomId} />}
      {showModerationAppeal && roomId && <ModerationAppealPanel flagId={null} messageId={null} roomId={roomId} onClose={() => setShowModerationAppeal(false)} />}
      {isHost && user?.id && <GuestDestinationsPanel participantUserId={user.id} guestName={user?.full_name || ''} />}
      {isHost && <GuestStreamingPermissions participant={null} isHost={isHost} onPermissionChange={() => toast.success('Permissions updated')} />}
      {isHost && roomId && <MultiStreamConfig roomId={roomId} isHost={isHost} />}
      {roomId && <VdoNinjaGuestLink roomId={roomId} />}
      <WebRTCSetupBanner error={mediaError} audioEnabled={audioEnabled} videoEnabled={videoEnabled} onRetry={reacquireMedia} />
      {isHost && roomId && <WebhookHooks roomId={roomId} isHost={isHost} />}
      {isHost && <PKBattleSoundboard battleId={roomId} isBattleActive={roomId != null} />}
      <PanelMusicPlayer />
      {isHost && roomId && <PollLaunchBar roomId={roomId} hostId={user?.id} activePoll={null} isHost={isHost} />}
      {room && <PreStreamCountdown room={room} currentUser={user} onGoLive={() => { if (isHost && roomId) base44.entities.Room.update(roomId, { status: 'live' }).catch(() => {}); }} />}
      <PrivatePanel isHost={isHost} currentUser={user} />
      {roomId && <StreamChatbot roomId={roomId} isHost={isHost} elapsedSeconds={elapsed} hostName={user?.full_name || ''} room={room} />}
      {roomId && <StreamEventBus roomId={roomId} isHost={isHost} sessionId={roomId} onViewerUpdate={setBusViewerCount} onTipReceived={msg => setTipTotal(t => t + Math.floor(msg?.tip_amount || 0))} onMessageReceived={msg => { if (msg?.content) setChatMessages(prev => [...prev, msg]); }} />}
      {roomId && <TippingOverlay roomId={roomId} creatorId={room?.host_id || user?.id} isVisible={true} />}
      {roomId && <UnifiedChat roomId={roomId} currentUser={user} isHost={isHost} />}
      {isHost && roomId && <AIPersonaCustomizer roomId={roomId} sessionId={roomId} onCustomized={() => toast.success('AI persona configured!')} />}
      {isHost && <AudioMixer micMuted={!audioEnabled} onMicToggle={toggleAudio} />}
      {isHost && <EnhancedAudioMixer micMuted={!audioEnabled} onMicToggle={toggleAudio} onAudioSettingsChange={() => {}} />}
      {isHost && <ScreenSharePanel isSharing={isSharing} onStartShare={handleStartShare} onStopShare={handleStopShare} />}
      {roomId && <AuraEmotionDisplay roomId={roomId} sessionId={roomId} auraPersona={'hype'} />}
      {roomId && <BattleScoreboard roomId={roomId} />}
      {roomId && user?.id && <EnhancedStreamChat roomId={roomId} userId={user.id} userName={user?.full_name || ''} userRole={isHost ? 'host' : 'viewer'} />}
      <GlobalChatWidget />
      {isHost && roomId && <GuestConnector roomId={roomId} roomName={''} />}
      {roomId && <InteractivePollingSystem roomId={roomId} isHost={isHost} currentUser={user} />}
      {roomId && <LeaderboardPanel roomId={roomId} />}
      {roomId && <MobileStreamControls micMuted={!audioEnabled} onMicToggle={toggleAudio} onReact={() => {}} onQuickTip={() => {}} onWebSource={isHost ? () => setShowEvmux(true) : undefined} roomId={roomId} />}
      {user?.id && <PointsNotification userId={user.id} />}
      {roomId && user?.id && <EngagementBadgesDisplay roomId={roomId} userId={user.id} creatorId={room?.host_id || user?.id} />}
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
      <StreamGoals isHost={isHost} currentTips={tipTotal} currentSubs={subCount} currentViewers={Math.max(busViewerCount, participants.length)} />
      <ViewerCount count={Math.max(busViewerCount, participants.length)} peakViewers={peakViewers} />
      {roomId && <PartyHypeMeter partyId={roomId} memberCount={Math.max(busViewerCount, participants.length)} onHypeChange={setHypeLevel} />}
      {isHost && roomId && user?.id && <ClipCreator roomId={roomId} creatorId={user.id} streamTitle={room?.title || ''} elapsedSeconds={elapsed} currentUser={user} />}
      {isHost && roomId && user?.id && <StreamHighlightCapture roomId={roomId} sessionId={roomId} creatorId={user.id} elapsedSeconds={elapsed} isHost={isHost} />}
      {isHost && roomId && <QuickPollLauncher roomId={roomId} hostId={user?.id} isHost={isHost} />}
      {!isHost && roomId && room?.host_id && <GiftTray roomId={roomId} currentUser={user} recipientId={room.host_id} />}
      {isHost && room && <RoomBrandingEditor roomData={room} onBrandingChange={(b) => { if (room?.id) base44.entities.Room.update(room.id, b).catch(() => {}); }} isHost={isHost} />}
      <BackgroundCustomizer />
      <InviteSheet isOpen={showInviteSheet} onClose={() => setShowInviteSheet(false)} roomId={roomId} roomTitle={room?.title || ''} isHost={isHost} isCoHost={false} />
      <AuraPanel roomId={roomId} isHost={isHost} streamTitle={room?.title || ''} viewerCount={participants.length} isLive={room?.status === 'live'} userTier="free" />
      {isHost && <GuestControls
        participants={participants}
        onMuteGuest={(id) => updateParticipantMutation.mutate({ id, updates: { is_audio_enabled: false } })}
        onRemoveGuest={(id) => updateParticipantMutation.mutate({ id, updates: { is_active: false } })}
      />}
      {isHost && roomId && <StreamAnalyticsDashboard roomId={roomId} isHost={isHost} isLive={room?.status === 'live'} />}
      {isHost && roomId && <AggregatedChat roomId={roomId} currentUser={user} isHost={isHost} onMessagesChange={setChatMessages} />}
      {roomId && <LoveHearts roomId={roomId} currentUser={user} creatorId={room?.host_id || user?.id} />}
      {isHost && roomId && user && <ClipMarker roomId={roomId} user={user} streamStartTs={streamStartRef.current} getClipBlobUrl={extractClipBlobUrl} />}
      {isHost && roomId && <GuestQueue roomId={roomId} isHost={isHost} />}
      <StreamMetricsBar startTime={streamStartRef.current} memberCount={participants.length} tipTotal={tipTotal} peakViewers={peakViewers} netQuality={netQuality} netRtt={netRtt} />
      <SuperChatRail superchats={[]} />
      <LiveGoalWidget memberCount={participants.length} tipTotal={tipTotal} subCount={0} />
      {isHost && roomId && <AIModeration roomId={roomId} isHost={isHost} />}
      {!isHost && roomId && user && <LoveTap roomId={roomId} user={user} creatorId={room?.host_id || user?.id} creatorName={''} />}
      {roomId && <PKBattle roomId={roomId} isHost={isHost} hostName={user?.full_name || ''} viewerCount={participants.length} />}
      {roomId && <PKBattleModal isOpen={showPKBattleModal} onClose={() => setShowPKBattleModal(false)} roomId={roomId} isHost={isHost} currentUser={user} hostName={user?.full_name || ''} />}
      {roomId && <BreakoutRoomsModal isOpen={showBreakoutRooms} onClose={() => setShowBreakoutRooms(false)} roomId={roomId} roomTitle={room?.title || ''} currentUser={user} />}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} url={`${window.location.origin}${createPageUrl('Room')}?id=${roomId}`} title={room?.title || ''} />
      <WebRTCConfigModal isOpen={showWebRTCConfig} onClose={() => setShowWebRTCConfig(false)} onApply={() => setShowWebRTCConfig(false)} currentConfig={{}} />
      {isHost && roomId && <CoStreamHub roomId={roomId} isHost={isHost} isCoHost={false} currentUser={user} compact={false} speakingIds={speakingIds} />}
      {isHost && <GreenRoomModal isOpen={showGreenRoomModal} onClose={() => setShowGreenRoomModal(false)} onReady={() => { setShowGreenRoomModal(false); if (roomId) base44.entities.Room.update(roomId, { status: 'live' }).catch(() => {}); }} localStream={localStream} audioEnabled={audioEnabled} />}
      {isHost && room && user && <GreenRoomPreflight isOpen={showPreflight} onClose={() => setShowPreflight(false)} onGoLive={() => { if (roomId) base44.entities.Room.update(roomId, { status: 'live' }).catch(() => {}); }} party={room} user={user} />}
      {isHost && user?.id && <OverlayThemeBuilder creatorId={room?.host_id || user?.id} />}
      {isHost && roomId && user?.id && showClipCreator && <ClipCreatorSheet roomId={roomId} sessionId={roomId} creatorId={user.id} elapsedSeconds={elapsed} roomTitle={room?.title || ''} onClose={() => setShowClipCreator(false)} />}
      {isHost && roomId && showAuraPanelDrawer && <AuraPanelDrawer roomId={roomId} hostId={room?.host_id || user?.id} onClose={() => setShowAuraPanelDrawer(false)} />}
      {showSwanPanel && roomId && <SwanDirectorPanel roomId={roomId} hostId={room?.host_id || user?.id} onClose={() => setShowSwanPanel(false)} />}
    </div>
  );
}