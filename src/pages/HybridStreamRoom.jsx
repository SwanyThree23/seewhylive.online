import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Users, PhoneOff, Settings, Share2, Radio } from 'lucide-react';
import WatchPartyPlayer from '../components/streaming/WatchPartyPlayer';
import MultiGuestPanel from '../components/streaming/MultiGuestPanel';
import ChatPanel from '../components/rooms/ChatPanel';
import ParticipantsList from '../components/rooms/ParticipantsList';
import { toast } from 'sonner';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import ZEGOGuestApprovalPanel from '../components/zego/ZEGOGuestApprovalPanel';
import ZEGOStreamHealthCard from '../components/zego/ZEGOStreamHealthCard';
import ZEGOConfigPanel from '../components/zego/ZEGOConfigPanel';
import SwanDirectorPanel, { SwanDirectorHUD } from '../components/live/SwanDirectorPanel';
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
import { MerchStrip } from '../components/merch/MerchWidget';
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
export default function HybridStreamRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [spotlightId, setSpotlightId] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [participants, setParticipants] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => base44.entities.Room.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
  });

  const { data: fetchedParticipants = [] } = useQuery({
    queryKey: ['participants', roomId],
    queryFn: () => base44.entities.Participant.filter({ room_id: roomId }),
    enabled: !!roomId,
  });

  useEffect(() => {
    setParticipants(fetchedParticipants);
  }, [fetchedParticipants]);

  // Real-time participant sync
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = base44.entities.Participant.subscribe((event) => {
      if (event.data.room_id === roomId) {
        if (event.type === 'create') {
          setParticipants(prev => [...prev, event.data]);
        } else if (event.type === 'update') {
          setParticipants(prev => prev.map(p => p.id === event.id ? event.data : p));
        } else if (event.type === 'delete') {
          setParticipants(prev => prev.filter(p => p.id !== event.id));
        }
      }
    });

    return unsubscribe;
  }, [roomId]);

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const myParticipant = participants.find(p => p.user_id === user?.id);
      if (myParticipant) {
        await base44.entities.Participant.delete(myParticipant.id);
      }
    },
    onSuccess: () => {
      window.location.href = '/Home';
    },
    onError: () => toast.error('Action failed.'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080B18' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full animate-spin mx-auto mb-4"
            style={{ border: '4px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Loading hybrid room…</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080B18' }}>
        <div className="text-center">
          <h2 className="text-2xl font-black mb-2" style={{ color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>Room not found</h2>
          <button onClick={() => window.location.href = '/Home'}
            className="px-5 py-2.5 rounded-xl font-black uppercase text-sm"
            style={{ background: '#800020', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isHost = room.host_id === user?.id;

  return (
    <div className="h-screen overflow-hidden" style={{ background: '#080B18', fontFamily: 'Barlow Condensed, sans-serif' }}>
      {/* Fanbase-style top bar */}
      <div className="sticky top-0 z-50" style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        {/* Row 1 */}
        <div className="flex items-center gap-2 px-3 h-12">
          <button
            onClick={() => leaveMutation.mutate()}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            <PhoneOff className="w-4 h-4" />
          </button>
          <h1 className="flex-1 font-black text-white text-sm leading-none truncate">{room.title}</h1>
          {room.status === 'live' && (
            <span className="shrink-0 px-2 py-0.5 rounded-md text-white font-black text-[11px] uppercase animate-pulse"
              style={{ background: '#C0392B' }}>LIVE</span>
          )}
          <span className="shrink-0 px-2 py-0.5 rounded-md font-black text-[11px] uppercase"
            style={{ background: 'rgba(128,0,32,0.15)', border: '1px solid rgba(128,0,32,0.35)', color: '#D4AF37' }}>
            Hybrid
          </span>
          <button className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            <Share2 className="w-4 h-4" />
          </button>
          {isHost && (
            <button className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Row 2 */}
        <div className="flex items-center gap-2 px-3 pb-2">
          <Users className="w-3 h-3" style={{ color: '#D4AF37' }} />
          <span className="text-[10px] font-black" style={{ color: '#D4AF37' }}>{participants.length}</span>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>participants · Watch Party + Guest Panel</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex" style={{ height: 'calc(100vh - 72px)' }}>
        {/* Left: Content Area */}
        <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
          <div className="h-1/2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.08)' }}>
            <WatchPartyPlayer
              roomId={roomId}
              isHost={isHost}
              videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            />
          </div>
          <div className="h-1/2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.08)' }}>
            <MultiGuestPanel
              participants={participants}
              spotlightId={spotlightId}
              onSpotlight={(id) => setSpotlightId(spotlightId === id ? null : id)}
              maxGuests={20}
            />
          </div>
        </div>

        {/* Right: Chat & Participants */}
        <div className="w-80 flex flex-col" style={{ borderLeft: '1px solid rgba(212,175,55,0.08)', background: 'rgba(13,6,24,0.7)' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Tab bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flexShrink: 0, background: 'rgba(8,11,24,0.8)', borderBottom: '1px solid rgba(212,175,55,0.08)', height: 40 }}>
              <button
                onClick={() => setActiveTab('chat')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: 'none', borderBottom: activeTab === 'chat' ? '2px solid #D4AF37' : '2px solid transparent', color: activeTab === 'chat' ? '#D4AF37' : 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', padding: '0 8px' }}
              >
                <MessageSquare className="w-3.5 h-3.5" />Chat
              </button>
              <button
                onClick={() => setActiveTab('participants')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: 'none', borderBottom: activeTab === 'participants' ? '2px solid #D4AF37' : '2px solid transparent', color: activeTab === 'participants' ? '#D4AF37' : 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', padding: '0 8px' }}
              >
                <Users className="w-3.5 h-3.5" />People
              </button>
            </div>
            {/* Tab content */}
            {activeTab === 'chat' && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ChatPanel roomId={roomId} currentUser={user} />
              </div>
            )}
            {activeTab === 'participants' && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ParticipantsList participants={participants} currentUser={user} roomId={roomId} communityId={room.community_id} />
              </div>
            )}
          </div>
        </div>
      </div>
      <SwanAIRecommendations roomId={roomId} currentLayout="hybrid" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={roomId} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      {roomId && <ZEGOGuestApprovalPanel roomId={roomId} isHost={isHost} />}
      {roomId && <ZEGOStreamHealthCard roomId={roomId} />}
      {user && <ZEGOConfigPanel user={user} />}
      {isHost && roomId && <SwanDirectorHUD roomId={roomId} hostId={user?.id} onOpenPanel={() => setShowSwanPanel(true)} />}
      {roomId && <RealtimeLeaderboard roomId={roomId} creatorId={room?.host_id || user?.id} />}
      {roomId && <LiveTranscription isLive={true} roomId={roomId} />}
      {showViewerControls && roomId && <ViewerControlsPanel roomId={roomId} currentUser={user} onClose={() => setShowViewerControls(false)} />}
      {roomId && user?.id && <VirtualCurrencyTips roomId={roomId} creatorId={room?.host_id || user?.id} currentUser={user} isHost={isHost} />}
      {roomId && <GoldenWall roomId={roomId} />}
      {isHost && roomId && <StreamerGoalsWidget creatorId={room?.host_id || user?.id} roomId={roomId} isCreator={isHost} embedded={true} />}
      {isHost && roomId && <PayPerViewManager roomId={roomId} />}
      {isHost && roomId && <MonetizationDashboard roomId={roomId} />}
      {roomId && <GiftShopTray roomId={roomId} currentUser={user} />}
      {roomId && <GiftLeaderboard roomId={roomId} />}
      {isHost && <SubscriptionManager creatorId={room?.host_id || user?.id} />}
      {roomId && <TipAlert roomId={roomId} recipientId={room?.host_id || user?.id} />}
      {!isHost && roomId && <TippingModal isOpen={false} onClose={() => {}} recipient={null} roomId={roomId} />}
      {roomId && <LiveAuctionWidget creatorId={room?.host_id || user?.id} roomId={roomId} isCreator={isHost} currentUser={user} />}
      <MerchStrip roomId={roomId} currentUser={user} hostId={room?.host_id || user?.id} />
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
      {roomId && <EmbedPlayer roomId={roomId} creatorName={user?.full_name || ''} streamTitle={room?.title || 'Hybrid Stream'} viewerCount={0} />}
      <LiveTranslationWidget chatMessage={null} onTranslation={() => {}} />
      {isHost && user?.id && <RecordingManager userId={user.id} />}
      {isHost && <OBSBridge />}
      <ZEGOMobileAppBanner />
      {isHost && roomId && <AutomatedClipGenerator streamSession={{room_id: roomId}} isLive={roomId != null} />}
      {roomId && <InteractivePollWidget roomId={roomId} isHost={isHost} />}
      {isHost && <StreamMetadataEditor initialTitle={room?.title || 'Hybrid Stream'} initialCategory={'entertainment'} />}
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
      {!isHost && showWhisperPanel && roomId && user?.id && <WhisperPanel roomId={roomId} currentUser={user} recipientId={room?.host_id || user?.id} recipientName={''} onClose={() => setShowWhisperPanel(false)} />}
      <HostAlertCenter />
      {roomId && <AICopilotSidebar roomId={roomId} isHost={isHost} viewerCount={0} />}
      {isHost && roomId && <EnhancedPollingSystem roomId={roomId} hostId={room?.host_id || user?.id} isHost={isHost} />}
      {roomId && user?.id && <SuperChatBar roomId={roomId} currentUser={user} recipientId={room?.host_id || user?.id} recipientName={''} />}
      {user?.id && <SwanyBotEnhanced userId={user.id} conversationId={null} onContextReady={() => {}} />}
      {isHost && <LocalVideoTile stream={null} audioEnabled={true} videoEnabled={true} userName={user?.full_name || ''} isHost={isHost} />}
      {isHost && <OctagonalVideoWindow title={'My Camera'} isMuted={false} isVideoOff={false} onMicToggle={() => {}} onVideoToggle={() => {}} isHost={isHost} isPinned={false} onPinToggle={() => {}} points={0} label={'Host'} />}
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
      {showModerationAppeal && roomId && <ModerationAppealPanel flagId={null} messageId={null} roomId={roomId} onClose={() => setShowModerationAppeal(false)} />}
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
      {isHost && roomId && user?.id && <ClipCreator roomId={roomId} creatorId={user.id} streamTitle={room?.title || ''} elapsedSeconds={0} currentUser={user} />}
      {isHost && roomId && user?.id && <StreamHighlightCapture roomId={roomId} sessionId={roomId} creatorId={user.id} elapsedSeconds={0} isHost={isHost} />}
      {isHost && roomId && <QuickPollLauncher roomId={roomId} hostId={user?.id} isHost={isHost} />}
      {!isHost && roomId && room?.host_id && <GiftTray roomId={roomId} currentUser={user} recipientId={room.host_id} />}
      {isHost && room && <RoomBrandingEditor roomData={room} onBrandingChange={() => {}} isHost={isHost} />}
      <BackgroundCustomizer />
    </div>
  );
}
