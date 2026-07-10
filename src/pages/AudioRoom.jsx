import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, MessageCircle, Heart, Hand,
  ChevronLeft, MoreHorizontal, Share2, Users, Crown, Radio, Plus
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
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
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#FF1564';
const BG      = '#080B18';
const BG2     = '#0d0618';
const GREEN   = '#6DBF7E';

const PALETTE = ['#8B6F47','#6B7C4A','#CC7755','#4A6B7C','#7C4A6B','#5C6BC0','#26A69A','#EF6C00'];

function avatarColor(name) {
  return PALETTE[(name?.charCodeAt(0) ?? 0) % PALETTE.length];
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function SpeakerTile({ member, size = 80 }) {
  const isHost    = member.role === 'host';
  const isCohost  = member.role === 'cohost';
  const isMuted   = member.is_audio_enabled === false;
  const isSpeaking = member.speaking;
  const color     = avatarColor(member.user_name || 'A');

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: GOLD, opacity: 0.2 }}
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.08, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: isSpeaking ? `2.5px solid ${GOLD}` : `2px solid rgba(255,255,255,0.15)`,
            transition: 'border-color 0.3s',
          }}
        />
        <div
          className="absolute inset-[3px] rounded-full flex items-center justify-center font-black text-lg text-white"
          style={{ background: `linear-gradient(135deg, ${color}88, ${BG2})` }}
        >
          {(member.user_name || '?').charAt(0).toUpperCase()}
        </div>

        {(isHost || isCohost) && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
            <Crown className="w-3.5 h-3.5 drop-shadow" style={{ color: GOLD }} />
          </div>
        )}
        {isMuted && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#EF4444', border: `2px solid ${BG}` }}
          >
            <MicOff className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        <button
          className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <Heart className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
        </button>
      </div>
      <p className="text-[12px] font-bold text-black truncate" style={{ maxWidth: size + 8 }}>
        {(member.user_name || 'Guest').split(' ')[0]}
      </p>
    </div>
  );
}

function AudienceTile({ member }) {
  const size  = 52;
  const color = avatarColor(member.user_name || 'A');
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="rounded-full flex items-center justify-center font-bold text-sm text-white"
        style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}66, ${BG2})`, border: '2px solid rgba(255,255,255,0.1)' }}
      >
        {(member.user_name || '?').charAt(0).toUpperCase()}
      </div>
      <p className="text-[11px] truncate" style={{ color: '#888', maxWidth: size + 4 }}>
        {(member.user_name || 'Guest').slice(0, 8)}
      </p>
    </div>
  );
}

export default function AudioRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId    = urlParams.get('id');

  const { localStream, audioEnabled, toggleAudio } = useLocalMedia({ audio: true, video: false });
  const { remoteStreams, peerUserIds } = useWebRTCPeers(roomId, localStream);

  const { data: user }  = useQuery({ queryKey: ['currentUser'],   queryFn: () => base44.auth.me() });
  const { data: party } = useQuery({
    queryKey: ['audio-room', roomId],
    queryFn:  () => base44.entities.WatchParty.filter({ id: roomId }).then(r => r[0]),
    enabled:  !!roomId,
    refetchInterval: 10000,
  });
  const { data: members = [] } = useQuery({
    queryKey: ['audio-room-members', roomId],
    queryFn:  () => base44.entities.WatchPartyMember.filter({ party_id: roomId, is_active: true }),
    enabled:  !!roomId,
    refetchInterval: 10000,
  });
  const { data: loves = [] } = useQuery({
    queryKey: ['audio-room-loves', roomId],
    queryFn:  () => base44.entities.Tip.filter({ room_id: roomId, currency: 'love' }),
    enabled:  !!roomId,
    refetchInterval: 5000,
  });

  const [chatOpen,   setChatOpen]   = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [loveCount,  setLoveCount]  = useState(0);

  const [createTitle,    setCreateTitle]    = useState('');
  const [createVideoUrl, setCreateVideoUrl] = useState('');
  const [creating,       setCreating]       = useState(false);

  useEffect(() => { setLoveCount(loves.length); }, [loves.length]);

  const speakers = members.length > 0
    ? members.filter(m => m.role === 'host' || m.role === 'cohost' || m.role === 'speaker')
    : [];
  const audience = members.length > 0
    ? members.filter(m => m.role !== 'host' && m.role !== 'cohost' && m.role !== 'speaker')
    : [];

  const speakerList = speakers.length > 0 ? speakers : members.slice(0, 6);
  const audienceList = speakers.length > 0 ? audience : members.slice(6);

  const isHost  = user?.id && party?.host_id && user.id === party.host_id;
  const ytId    = getYouTubeId(party?.video_url || '');
  const hostMember = members.find(m => m.user_id === party?.host_id);
  const hostName   = hostMember?.user_name || party?.host_name || 'Host';
  const memberCount = members.length;

  async function sendLove() {
    if (!user?.id || !roomId) {
      setLoveCount(c => c + 1);
      return;
    }
    try {
      await base44.entities.Tip.create({ room_id: roomId, user_id: user.id, currency: 'love', amount: 1 });
      setLoveCount(c => c + 1);
    } catch {
      setLoveCount(c => c + 1);
    }
  }

  function leaveRoom() {
    if (roomId && user?.id) {
      base44.entities.WatchPartyMember
        .filter({ party_id: roomId, user_id: user.id, is_active: true })
        .then(ms => ms.forEach(m =>
          base44.entities.WatchPartyMember.update(m.id, { is_active: false, left_at: new Date().toISOString() })
        ));
    }
    window.history.back();
  }

  async function handleCreate() {
    if (!createTitle.trim() || creating) return;
    setCreating(true);
    try {
      const p = await base44.entities.WatchParty.create({
        title:       createTitle.trim(),
        video_url:   createVideoUrl.trim() || '',
        host_id:     user?.id,
        status:      'active',
        updated_at_ms: Date.now(),
      });
      window.location.href = `${window.location.pathname}?id=${p.id}`;
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
              onChange={e => setCreateTitle(e.target.value)}
              placeholder="Room title…"
              className="w-full h-11 px-4 rounded-xl text-white placeholder:text-white/25 outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Barlow Condensed, sans-serif' }}
            />
            <input
              value={createVideoUrl}
              onChange={e => setCreateVideoUrl(e.target.value)}
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
        <button onClick={() => window.history.back()} className="flex items-center gap-1">
          <ChevronLeft className="w-5 h-5" style={{ color: '#111' }} />
          <span className="text-sm font-black" style={{ color: '#111' }}>All Rooms</span>
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-1" style={{ color: '#555' }}>
          <Users className="w-4 h-4" />
          <span className="text-sm font-bold">{memberCount}</span>
        </div>
        <button onClick={sendLove} className="flex items-center gap-1">
          <Heart className="w-4 h-4 text-red-500" fill="#ef4444" />
          <span className="text-sm font-bold" style={{ color: '#555' }}>{loveCount}</span>
        </button>
        <button>
          <MoreHorizontal className="w-5 h-5" style={{ color: '#555' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 80 }}>

        {party?.video_url && (
          <div className="bg-black" style={{ aspectRatio: '16/9', width: '100%', position: 'relative' }}>
            {ytId ? (
              <img
                src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
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

        {party?.video_url && (
          <div className="px-4 py-3 bg-white border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            <p className="text-base font-black text-black leading-tight">{party?.title || 'Audio Room'}</p>
            <p className="text-sm" style={{ color: '#888' }}>Shared by {hostName}</p>
          </div>
        )}

        {!party?.video_url && (
          <div className="px-4 pt-4 pb-2">
            <p className="text-lg font-black text-black">{party?.title || 'Audio Room'}</p>
            <p className="text-sm" style={{ color: '#888' }}>Hosted by {hostName}</p>
          </div>
        )}

        <AudioStageTab
          roomId={roomId}
          user={user}
          party={party}
          members={members.map(m => ({
            ...m,
            display_name: m.user_name,
          }))}
          localStream={localStream}
          remoteStreams={remoteStreams}
          onLeave={leaveRoom}
        />
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
            onClick={() => setChatOpen(v => !v)}
            className="flex flex-col items-center gap-0.5"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: chatOpen ? `${GOLD}20` : 'rgba(255,255,255,0.07)',
                border: chatOpen ? `1px solid ${GOLD}55` : '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
          </button>

          <button onClick={sendLove} className="flex flex-col items-center gap-0.5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)' }}
            >
              <Heart className="w-4 h-4 text-red-400" fill="#EF4444" />
            </div>
            <span className="text-[11px] font-bold" style={{ color: GOLD }}>{loveCount}</span>
          </button>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: party?.title || 'Audio Room', url: window.location.href }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied!');
              }
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>

          <button
            onClick={() => setHandRaised(h => !h)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              background: handRaised ? `${GOLD}20` : 'rgba(255,255,255,0.07)',
              border: handRaised ? `1px solid ${GOLD}55` : '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Hand className="w-4 h-4" style={{ color: handRaised ? GOLD : 'rgba(255,255,255,0.6)' }} />
          </button>

          <button
            onClick={toggleAudio}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              background: audioEnabled ? `${GOLD}15` : 'rgba(239,68,68,0.15)',
              border: audioEnabled ? `1px solid ${GOLD}44` : '1px solid rgba(239,68,68,0.4)',
            }}
          >
            {audioEnabled
              ? <Mic className="w-4 h-4" style={{ color: GOLD }} />
              : <MicOff className="w-4 h-4 text-red-400" />}
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
              onClick={() => setChatOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 z-50 flex flex-col rounded-t-2xl overflow-hidden"
              style={{ bottom: 64, height: 220, background: BG, borderTop: `1px solid rgba(212,175,55,0.2)` }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="shrink-0 flex items-center justify-between px-4 py-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-black uppercase text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Chat</span>
                <button onClick={() => setChatOpen(false)} className="text-white/40 text-sm">✕</button>
              </div>
              <div className="flex-1 overflow-hidden">
                <AggregatedChat roomId={roomId} currentUser={user} isHost={isHost} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {roomId && !isHost && (
        <LoveTap
          roomId={roomId}
          user={user}
          creatorId={party?.host_id}
          creatorName={hostName}
        />
      )}
      <SwanAIRecommendations roomId={roomId} currentLayout="audio" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={roomId} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {party?.host_id && <ShopDashboard creatorId={party.host_id} />}
      {roomId && <ZEGOGuestApprovalPanel roomId={roomId} isHost={isHost} />}
      {roomId && <ZEGOStreamHealthCard roomId={roomId} />}
      {user && <ZEGOConfigPanel user={user} />}
      {roomId && <RealtimeLeaderboard roomId={roomId} creatorId={party?.host_id || user?.id} />}
      {roomId && <LiveTranscription isLive={true} roomId={roomId} />}
      {roomId && <ViewerControlsPanel roomId={roomId} currentUser={user} onClose={() => {}} />}
      {roomId && user?.id && <VirtualCurrencyTips roomId={roomId} creatorId={party?.host_id || user?.id} currentUser={user} isHost={isHost} />}
      {roomId && <GoldenWall roomId={roomId} />}
      {isHost && roomId && <SwanDirectorHUD roomId={roomId} hostId={user?.id} onOpenPanel={() => {}} />}
      {isHost && user?.id && <RecordingManager userId={user.id} />}
      {isHost && <OBSBridge />}
      <ZEGOMobileAppBanner />
      {isHost && roomId && <AutomatedClipGenerator streamSession={{room_id: roomId}} isLive={roomId != null} />}
      {roomId && <InteractivePollWidget roomId={roomId} isHost={isHost} />}
      {isHost && <StreamMetadataEditor initialTitle={'Live Audio'} initialCategory={'entertainment'} />}
      {isHost && <StreamerMonetizationCenter />}
      {!isHost && roomId && <AnimatedGiftShop recipientId={party?.host_id || user?.id} roomId={roomId} onClose={() => {}} />}
      {isHost && user?.id && <VirtualGoodsStore userId={user.id} />}
      {isHost && <SoundAlertsManager creatorId={party?.host_id || user?.id} />}
      <ShareToSocial content={{text: ''}} />
      {isHost && roomId && user?.id && <VideoShortRecorder roomId={roomId} creatorId={user.id} />}
      {isHost && <BroadcastAnalyticsDashboard streamSession={null} isLive={roomId != null} />}
      {isHost && roomId && <AutomatedHighlightReels streamSession={{room_id: roomId}} />}
      {roomId && <PerformanceDashboard roomId={roomId} sessionId={roomId} />}
      <StreamHealthDashboard isLive={roomId != null} />
      {!isHost && roomId && <QuickTip recipientId={party?.host_id || user?.id} recipientName={''} onTipSent={() => {}} />}
      {isHost && <LowerThirdsBanner onBannerChange={() => {}} />}
      {isHost && <SceneSwitcher activeScene={'main'} onSceneChange={() => {}} />}
      <NotificationHub />
      {isHost && <SoundboardWidget isVisible={true} />}
      {isHost && roomId && <RaidPanelButton room={party} currentUser={user} isHost={isHost} />}
      {roomId && <LiveAudiencePulse roomId={roomId} isHost={isHost} viewerCount={0} />}
      {roomId && <StreamAnalyticsDashboard roomId={roomId} />}
      {isHost && roomId && <AIStreamSummary roomId={roomId} isHost={isHost} streamTitle={''} viewerCount={0} elapsedSeconds={0} />}
      {isHost && <ChatModeration collapsed={true} />}
      <BrandChyron />
      {!isHost && roomId && user?.id && <WhisperPanel roomId={roomId} currentUser={user} recipientId={party?.host_id || user?.id} recipientName={''} onClose={() => {}} />}
      <HostAlertCenter />
      {roomId && <AICopilotSidebar roomId={roomId} isHost={isHost} viewerCount={0} />}
      {isHost && roomId && <EnhancedPollingSystem roomId={roomId} hostId={party?.host_id || user?.id} isHost={isHost} />}
      {roomId && user?.id && <SuperChatBar roomId={roomId} currentUser={user} recipientId={party?.host_id || user?.id} recipientName={''} />}
      <StreamGoals isHost={isHost} currentTips={0} currentSubs={0} currentViewers={0} />
      <ViewerCount count={0} peakViewers={0} />
      {isHost && roomId && user?.id && <ClipCreator roomId={roomId} creatorId={user.id} streamTitle={''} elapsedSeconds={0} currentUser={user} />}
      {isHost && roomId && user?.id && <StreamHighlightCapture roomId={roomId} sessionId={roomId} creatorId={user.id} elapsedSeconds={0} isHost={isHost} />}
      {isHost && roomId && <QuickPollLauncher roomId={roomId} hostId={user?.id} isHost={isHost} />}
      {!isHost && roomId && party?.host_id && <GiftTray roomId={roomId} currentUser={user} recipientId={party.host_id} />}
      {isHost && party && <RoomBrandingEditor roomData={party} onBrandingChange={() => {}} isHost={isHost} />}
      <BackgroundCustomizer />
    </div>
  );
}
