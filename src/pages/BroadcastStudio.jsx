import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Users,
  Radio, LogOut, Copy, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, Swords, Monitor, LayoutGrid, Hand,
} from 'lucide-react';
import { isSafeUrl, clampStr, LIMITS } from '@/lib/security';

import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
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
import LoveHearts from '../components/live/LoveHearts';
import GiftShop from '../components/live/GiftShop';
import GiftAnimation from '../components/live/GiftAnimation';
import ClipMarker from '../components/live/ClipMarker';
import ClipCreator from '../components/live/ClipCreator';
import GuestQueue from '../components/live/GuestQueue';
import StreamMetricsBar from '../components/live/StreamMetricsBar';
import SuperChatRail from '../components/live/SuperChatRail';
import LiveGoalWidget from '../components/live/LiveGoalWidget';
import AICopilotSidebar from '../components/live/AICopilotSidebar';
import AIModeration from '../components/live/AIModeration';
import AIStreamSummary from '../components/live/AIStreamSummary';
import ClipGeneratorAI from '../components/streaming/ClipGeneratorAI';
import { SwanDirectorHUD } from '../components/live/SwanDirectorPanel';
import GoldenWall from '../components/live/GoldenWall';
import LiveAudiencePulse from '../components/live/LiveAudiencePulse';
import RedemptionQueue from '../components/loyalty/RedemptionQueue';
import AIPersonaCustomizer from '../components/live/AIPersonaCustomizer';
import PreStreamCountdown from '../components/live/PreStreamCountdown';
import EngagementBadgesDisplay from '../components/live/EngagementBadgesDisplay';
import ShareToSocial from '../components/social/ShareToSocial';
import TippingModal from '../components/monetization/TippingModal';
import StreamHealthDashboard from '../components/streaming/StreamHealthDashboard';
import BroadcastAnalyticsDashboard from '../components/streaming/BroadcastAnalyticsDashboard';
import GreenroomQueue from '../components/streaming/GreenroomQueue';
import PointsEarnWidget from '../components/loyalty/PointsEarnWidget';
import InteractivePollWidget from '../components/streaming/InteractivePollWidget';
import StreamMetadataEditor from '../components/streaming/StreamMetadataEditor';
import StreamingPresets from '../components/streaming/StreamingPresets';
import BitratePresets from '../components/streaming/BitratePresets';
import AdvancedEncoderSettings from '../components/streaming/AdvancedEncoderSettings';
import GuestRTMPPanel from '../components/streaming/GuestRTMPPanel';
import RTMPFanoutPanel from '../components/streaming/RTMPFanoutPanel';
import GuestInviteGenerator from '../components/streaming/GuestInviteGenerator';
import WebSourceOverlay from '../components/streaming/WebSourceOverlay';
import LiveTranslationWidget from '../components/streaming/LiveTranslationWidget';
import ZEGOGuestApprovalPanel from '../components/zego/ZEGOGuestApprovalPanel';
import AudioMixer from '../components/live/AudioMixer';
import AudioPanel from '../components/live/AudioPanel';
import AuraEmotionDisplay from '../components/live/AuraEmotionDisplay';
import AuraPanel from '../components/live/AuraPanel';
import ZEGOLiveRoom from '../components/zego/ZEGOLiveRoom';
import HostAlertCenter from '../components/live/HostAlertCenter';
import MultiStreamConfig from '../components/live/MultiStreamConfig';
import RoomBrandingEditor from '../components/live/RoomBrandingEditor';
import SceneSwitcher from '../components/live/SceneSwitcher';
import ScreenSharePanel from '../components/live/ScreenSharePanel';
import SoundboardWidget from '../components/live/SoundboardWidget';
import EnhancedPollingSystem from '../components/live/EnhancedPollingSystem';
import StreamHighlightCapture from '../components/live/StreamHighlightCapture';
import OBSBridge from '../components/obs/OBSBridge';
import BattleMode from '../components/streaming/BattleMode';
import GuestStreamMonitor from '../components/streaming/GuestStreamMonitor';
import GuestStreamingPermissions from '../components/live/GuestStreamingPermissions';
import LiveTranscription from '../components/live/LiveTranscription';
import VideoShortRecorder from '../components/vod/VideoShortRecorder';
import ChatOverlay from '../components/live/ChatOverlay';
import EnhancedAudioMixer from '../components/live/EnhancedAudioMixer';
import GuestGrid from '../components/live/GuestGrid';
import InteractivePollingSystem from '../components/live/InteractivePollingSystem';
import PanelMusicPlayer from '../components/live/PanelMusicPlayer';
import StreamChatbot from '../components/live/StreamChatbot';
import UnifiedChat from '../components/live/UnifiedChat';
import PollLaunchBar from '../components/live/PollLaunchBar';
import QuickPollLauncher from '../components/live/QuickPollLauncher';
import LowerThirdsBanner from '../components/live/LowerThirdsBanner';
import EnhancedRoomControls from '../components/live/EnhancedRoomControls';
import PrivatePanel from '../components/live/PrivatePanel';
import WebRTCSetupBanner from '../components/live/WebRTCSetupBanner';
import PointsNotification from '../components/live/PointsNotification';
import EnhancedStreamChat from '../components/live/EnhancedStreamChat';
import EvmuxWebSource from '../components/live/EvmuxWebSource';
import GuestConnector from '../components/live/GuestConnector';
import GuestDestinationsPanel from '../components/live/GuestDestinationsPanel';
import StreamWebSourceManager from '../components/live/StreamWebSourceManager';
import RTMPIngestPanel from '../components/streaming/RTMPIngestPanel';
import LivePollOverlay from '../components/live/LivePollOverlay';
import LocalVideoTile from '../components/live/LocalVideoTile';
import OctagonalVideoWindow from '../components/live/OctagonalVideoWindow';
import WebhookHooks from '../components/live/WebhookHooks';
import VdoNinjaGuestLink from '../components/live/VdoNinjaGuestLink';
import StreamEventBus from '../components/live/StreamEventBus';
import ViewerCount from '../components/live/ViewerCount';
import GuestControls from '../components/live/GuestControls';
import { GiftLeaderboard } from '../components/live/GiftSystem';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';

const GOLD = '#D4AF37';
const BG = '#080B18';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

// ── Video sync engine ────────────────────────────────────────────────────────
function useSyncEngine({ party, isController, onTimeSync }) {
  const qc = useQueryClient();

  const pushState = useCallback(async (playerState) => {
    if (!isController || !party?.id) return;
    await base44.entities.WatchParty.update(party.id, {
      playback_state: playerState.playing ? 'playing' : 'paused',
      current_time: playerState.currentTime,
      updated_at_ms: Date.now(),
    });
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

// ── Octagonal avatar thumbnail (audience rail) ───────────────────────────────
function OctAvatarThumb({ name, stream, size = 36 }) {
  const vRef = useRef(null);
  const oct = 'polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)';
  useEffect(() => { if (vRef.current && stream) vRef.current.srcObject = stream; }, [stream]);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, clipPath: oct, background: 'rgba(212,175,55,0.3)' }} />
      <div style={{ position: 'absolute', inset: 2, clipPath: oct, background: '#0d0618', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
function LiveCameraTile({ localStream, videoEnabled, screenStream }) {
  const camRef = useRef(null);
  const screenRef = useRef(null);
  useEffect(() => { if (camRef.current && localStream) camRef.current.srcObject = localStream; }, [localStream]);
  useEffect(() => { if (screenRef.current && screenStream) screenRef.current.srcObject = screenStream; }, [screenStream]);
  const oct = 'polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)';
  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {screenStream ? (
        <video ref={screenRef} autoPlay playsInline className="w-full h-full object-contain" />
      ) : localStream && videoEnabled ? (
        <video ref={camRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
          <VideoOff className="w-12 h-12" />
          <span className="text-xs">Camera off</span>
        </div>
      )}
      <div className="absolute top-3 left-3 flex items-center gap-1 text-[11px] px-2 py-1 rounded"
        style={{ background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.4)', color: '#C0392B', ...T }}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block mr-0.5" />
        {screenStream ? 'SCREEN' : 'LIVE'}
      </div>
      {/* PIP camera (octagonal) when screen sharing */}
      {screenStream && localStream && videoEnabled && (
        <div className="absolute bottom-2 right-2" style={{ width: 80, height: 80 }}>
          <div style={{ position: 'absolute', inset: 0, clipPath: oct, background: 'rgba(212,175,55,0.5)' }} />
          <div style={{ position: 'absolute', inset: 2, clipPath: oct, overflow: 'hidden' }}>
            <video ref={camRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
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
  const [linkCopied, setLinkCopied]               = useState(false);
  const [inviteSheetOpen, setInviteSheetOpen]     = useState(false);
  const [greenRoomOpen, setGreenRoomOpen]         = useState(false);
  const [tipModalOpen, setTipModalOpen]           = useState(false);
  const [screenSharing, setScreenSharing]         = useState(false);
  const [activeScene, setActiveScene]             = useState('main');
  const [gateComplete, setGateComplete]           = useState(false);
  const [showCameraPicker, setShowCameraPicker] = useState(false);
  const [isExclusive, setIsExclusive] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftEvent, setGiftEvent] = useState(null);
  const [guardianWords, setGuardianWords] = useState([]);
  const [liveViewers, setLiveViewers] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [guardianWordInput, setGuardianWordInput] = useState('');
  const [ariaSuggestions] = useState(['What do you think about this topic?', 'Drop a ❤️ if you agree!', 'Questions? Type them below!']);
  const [ariaTopicIdx, setAriaTopicIdx] = useState(0);
  const [musicVolume, setMusicVolume] = useState(70);
  const streamStartRef = useRef(Date.now());
  const [bitratePreset, setBitratePreset] = useState(3000);
  const [tipTotal, setTipTotal] = useState(0);
  const [superchats, setSuperchats] = useState([]);
  const [raisedHands, setRaisedHands] = useState(new Set());
  const [slowMode, setSlowMode] = useState(false);
  const [slowModeCooldown, setSlowModeCooldown] = useState(30);
  const [pinnedMessage, setPinnedMessage] = useState(null);

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

  // Local media
  const { localStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo } = useLocalMedia({ audio: true, video: true });

  // WebRTC peer mesh — uses partyId as the signaling channel room
  const { remoteStreams, peerUserIds, announceJoin, leaveRoom, peersRef } = useWebRTCPeers(partyId, localStream);

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
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
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

  // AI highlight detector — auto-clips when hype + sentiment spike
  useHighlightDetector({
    partyId,
    roomId: partyId,
    isHost,
    user,
    messages: chatMessages,
    hypeLevel,
    elapsedSeconds: elapsed,
  });

  const onTimeSync = useCallback((data) => setSyncData(data), []);
  const { pushState } = useSyncEngine({ party, isController: canManage, onTimeSync });

  // Auto-join as member
  useEffect(() => {
    if (!party || !user) return;
    (async () => {
      const existing = await base44.entities.WatchPartyMember.filter({ party_id: party.id, user_id: user.id, is_active: true });
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
        qc.invalidateQueries(['broadcast-members', party.id]);
      }
    })();
  }, [party?.id, user?.id]);

  // Leave on unmount
  useEffect(() => () => {
    if (!party?.id || !user?.id) return;
    base44.entities.WatchPartyMember.filter({ party_id: party.id, user_id: user.id, is_active: true })
      .then(ms => ms.forEach(m => base44.entities.WatchPartyMember.update(m.id, { is_active: false, left_at: new Date().toISOString() })));
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
      if (user?.id) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'room_created',
          title: `Started broadcast: ${p?.title || 'Broadcast Studio'}`,
        }).catch(() => {});
      }
      window.location.href = `${window.location.pathname}?id=${p.id}`;
    },
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
      window.location.href = window.location.pathname;
    },
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
    await base44.entities.WatchPartyMember.update(member.id, { role: 'cohost' });
    toast.success(`${member.user_name} promoted to co-host`);
    qc.invalidateQueries(['broadcast-members', partyId]);
  };

  const promoteSpeaker = async (member) => {
    await base44.entities.WatchPartyMember.update(member.id, { role: 'speaker' });
    toast.success(`${member.user_name} added to panel`);
    qc.invalidateQueries(['broadcast-members', partyId]);
  };

  const demoteToAudience = async (member) => {
    await base44.entities.WatchPartyMember.update(member.id, { role: 'audience' });
    qc.invalidateQueries(['broadcast-members', partyId]);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Invite link copied!');
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const kickMember = async (member) => {
    await base44.entities.WatchPartyMember.update(member.id, { is_active: false, left_at: new Date().toISOString() });
    toast.success(`${member.user_name} removed from broadcast`);
    qc.invalidateQueries(['broadcast-members', partyId]);
  };

  const sendRaiseHand = async () => {
    if (!partyId || !user?.id) return;
    await base44.entities.Message.create({
      room_id: partyId,
      user_id: user.id,
      user_name: user.full_name || user.email,
      content: JSON.stringify({ action: 'raise-hand', userId: user.id, userName: user.full_name || user.email }),
      type: 'system',
    });
    toast.success('✋ Hand raised — waiting for host');
  };

  const dismissRaisedHand = (userId) => {
    setRaisedHands(prev => { const s = new Set(prev); s.delete(userId); return s; });
  };

  // Build compositor slots from localStream + remoteStreams
  const compositorSlots = React.useMemo(() => {
    const slots = [];
    if (localStream) {
      const roleLabel = isHost ? 'Host' : isCoHost ? 'Co-Host' : isSpeaker ? 'Panel' : 'You';
      slots.push({ stream: localStream, label: user?.full_name || user?.email || `You (${roleLabel})` });
    }
    if (remoteStreams) {
      remoteStreams.forEach((stream, peerId) => {
        const userId = peerUserIds?.get(peerId);
        const member = members.find(m => m.user_id === userId);
        slots.push({ stream, label: member?.user_name || 'Guest' });
      });
    }
    return slots;
  }, [localStream, remoteStreams, peerUserIds, members, user]);

  const compositorOverlay = {
    title: party?.title || 'SeeWhy LIVE',
    subtitle: `${members.length} panelists`,
    showLive: true,
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
    { id: 'health',  label: '❤️ Health', desc: 'Stream stats' },
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
                  });
                }}
              />
            )}
            {canStream && (
              <CompositorOverlay
                layout={studioMode === 'watch' ? 'watchparty' : 'panel'}
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
              <>
                <ClipMarker roomId={partyId} user={user} streamStartTs={streamStartRef.current} />
                <ClipCreator roomId={partyId} creatorId={user?.id} streamTitle={party?.title} elapsedSeconds={elapsed} currentUser={user} />
              </>
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
          <ViewerCount count={liveViewers || members.length} peakViewers={peakViewers} />
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
          peakViewers={peakViewers || members.length}
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
                        {shown.map(m => {
                          const peerId = peerUserIds && Array.from(peerUserIds.entries()).find(([, uid]) => uid === m.user_id)?.[0];
                          const mStream = peerId && remoteStreams ? remoteStreams.get(peerId) : null;
                          return (
                            <div key={m.id} className="flex flex-col items-center gap-0.5">
                              <OctAvatarThumb name={m.user_name} stream={mStream} size={36} />
                              <span className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.3)', maxWidth: 36 }}>{m.user_name?.split(' ')[0]}</span>
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
              <LiveCameraTile localStream={localStream} videoEnabled={videoEnabled} screenStream={screenStream} />
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
        <div className="shrink-0 flex flex-col overflow-hidden" style={{ width: 296, borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#080B18' }}>

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
              { icon: '🎁', label: 'Gifts',   action: () => setGiftOpen(true) },
              { icon: '📊', label: 'Poll',    action: () => { window.location.href = '/PollManager'; } },
              { icon: '🔔', label: 'Alert',   action: () => toast.info('Alert sent to audience!') },
              { icon: '📱', label: 'QR',      action: () => toast.info(window.location.href) },
              { icon: '🎵', label: 'Music',   action: () => { window.location.href = '/AIMusic'; } },
              { icon: '📝', label: 'Captions',action: () => { window.location.href = '/TranscriptionStudio'; } },
              { icon: '🎛️', label: 'Control', action: () => { window.location.href = '/ControlRoom'; } },
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
                  {chatMessages.length > 0 && (
                    <div className="shrink-0 px-2 pb-2">
                      <LiveTranslationWidget
                        chatMessage={chatMessages[chatMessages.length - 1]}
                        onTranslation={() => {}}
                      />
                    </div>
                  )}
                  <UnifiedChat roomId={partyId} currentUser={user} isHost={canManage} />
                  <ChatOverlay roomId={partyId} isVisible />
                  {user?.id && (
                    <EnhancedStreamChat
                      roomId={partyId}
                      userId={user.id}
                      userName={user.full_name || user.email || 'Host'}
                      userRole={isHost ? 'host' : 'viewer'}
                    />
                  )}
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
                  <BattleMode roomId={partyId} isHost={isHost} hostName={party?.host_name || ''} participants={members} />
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
              <div className="p-2 space-y-3">
                <LivePollWidget roomId={partyId} currentUser={user} isHost={canManage} />
                <InteractivePollWidget roomId={partyId} isHost={canManage} />
                {partyId && (
                  <EnhancedPollingSystem roomId={partyId} hostId={party?.host_id} isHost={canManage} />
                )}
                <InteractivePollingSystem roomId={partyId} isHost={canManage} currentUser={user} />
                <PollLaunchBar roomId={partyId} hostId={party?.host_id} activePoll={null} isHost={canManage} />
                <QuickPollLauncher roomId={partyId} hostId={party?.host_id} isHost={canManage} />
                <LivePollOverlay roomId={partyId} currentUser={user} isHost={canManage} position="bottom-left" />
              </div>
            )}

            {/* 👥 PANEL MANAGEMENT */}
            {activeTab === 'viewers' && (
              <div className="p-2 space-y-2">
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-[11px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
                    {members.length} / 20 panelists
                  </span>
                  <button onClick={copyLink} className="text-[11px] px-2 py-0.5 rounded"
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
                            style={{ background: 'rgba(255,68,68,0.08)', color: '#D4854A', border: '1px solid rgba(255,68,68,0.15)', ...T }}>
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
                              style={{ background: 'rgba(255,68,68,0.08)', color: '#D4854A', border: '1px solid rgba(255,68,68,0.2)', ...T }}>
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

                {/* Gift leaderboard */}
                {partyId && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>🏆 Top Gifters</p>
                    <GiftLeaderboard roomId={partyId} />
                  </div>
                )}

                {/* Golden wall — live gift/superchat feed */}
                {partyId && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
                    <GoldenWall roomId={partyId} isExpanded />
                  </div>
                )}

                {/* Engagement badges */}
                {partyId && user?.id && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
                    <EngagementBadgesDisplay roomId={partyId} userId={user.id} creatorId={party?.host_id || user.id} />
                  </div>
                )}

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
                      });
                    }}
                  />
                </div>

                {/* Reward redemption queue */}
                {isHost && user?.id && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>🔔 Reward Queue</p>
                    <RedemptionQueue creatorId={user.id} roomId={partyId} />
                  </div>
                )}

                {/* Points earn widget */}
                {user?.id && partyId && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
                    <PointsEarnWidget userId={user.id} creatorId={party?.host_id || user.id} roomId={partyId} isHost={isHost} />
                  </div>
                )}

                {/* Greenroom guest queue */}
                {canManage && partyId && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
                    <GreenroomQueue roomId={partyId} isHost={isHost} />
                  </div>
                )}

                {/* Host alert center */}
                {isHost && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
                    <HostAlertCenter />
                  </div>
                )}

                {/* Enhanced room controls */}
                {isHost && party && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <EnhancedRoomControls
                      isHost={isHost}
                      roomData={party}
                      micMuted={!audioEnabled}
                      onMicToggle={toggleAudio}
                      onAudioSettingsChange={() => {}}
                      onBrandingChange={() => {}}
                    />
                  </div>
                )}

                {/* Private panel */}
                {isHost && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <PrivatePanel isHost={isHost} currentUser={user} />
                  </div>
                )}

                {/* Lower thirds banner */}
                {isHost && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>📺 Lower Thirds</p>
                    <LowerThirdsBanner onBannerChange={() => {}} />
                  </div>
                )}

                {/* WebRTC setup banner */}
                <WebRTCSetupBanner error={null} audioEnabled={audioEnabled} videoEnabled={videoEnabled} onRetry={() => {}} />

                {/* Webhook hooks */}
                {isHost && partyId && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <WebhookHooks roomId={partyId} isHost={isHost} />
                  </div>
                )}

                {/* Web Overlays + RTMP Fanout + Ingest */}
                {isHost && (
                  <div className="space-y-3 p-3 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,11,24,0.5)' }}>
                    <WebSourceOverlay isStreamActive={party?.status === 'live'} />
                    <div className="pt-2 border-t border-white/5">
                      <RTMPFanoutPanel roomId={partyId} isHost={isHost} />
                    </div>
                    <div className="pt-2 border-t border-white/5">
                      <RTMPIngestPanel roomId={partyId} />
                    </div>
                  </div>
                )}

                {/* Local video tile */}
                {localStream && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <LocalVideoTile stream={localStream} audioEnabled={audioEnabled} videoEnabled={videoEnabled} userName={user?.full_name || 'You'} isHost={isHost} />
                  </div>
                )}

                {/* Octagonal video window — live host feed */}
                {isHost && (
                  <OctagonalVideoWindow
                    title={party?.title || 'Live'}
                    isMuted={!audioEnabled}
                    isVideoOff={!videoEnabled}
                    onMicToggle={toggleAudio}
                    onVideoToggle={toggleVideo}
                    onShareScreen={() => setScreenSharing(v => !v)}
                    stream={localStream}
                    userName={user?.full_name || 'Host'}
                    avatarUrl={user?.avatar_url}
                    label="Host"
                    isLocal
                  />
                )}

                {/* Scene switcher */}
                {isHost && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>🎬 Scene</p>
                    <SceneSwitcher activeScene={activeScene} onSceneChange={setActiveScene} />
                  </div>
                )}

                {/* Screen share */}
                {isHost && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>🖥 Screen Share</p>
                    <ScreenSharePanel
                      isSharing={screenSharing}
                      onStartShare={() => setScreenSharing(true)}
                      onStopShare={() => setScreenSharing(false)}
                    />
                  </div>
                )}

                {/* Room branding */}
                {isHost && party && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>🎨 Branding</p>
                    <RoomBrandingEditor roomData={party} onBrandingChange={() => {}} isHost={isHost} />
                  </div>
                )}

                {/* Multi-stream config */}
                {isHost && partyId && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <MultiStreamConfig roomId={partyId} isHost={isHost} />
                  </div>
                )}

                {/* OBS Bridge */}
                {isHost && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <OBSBridge />
                  </div>
                )}

                {/* Stream metadata */}
                {isHost && party && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>🏷 Stream Info</p>
                    <StreamMetadataEditor initialTitle={party.title} initialCategory={party.category || 'general'} />
                  </div>
                )}

                {/* Streaming presets + bitrate */}
                {isHost && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[11px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>⚡ Stream Presets</p>
                    <StreamingPresets onApply={preset => toast.success(`Preset "${preset?.label || preset}" applied`)} />
                    <div className="mt-3">
                      <BitratePresets selected={bitratePreset} onChange={setBitratePreset} />
                    </div>
                    <div className="mt-3">
                      <AdvancedEncoderSettings onApply={cfg => toast.success(`Encoder: ${cfg.video.resolution} @ ${cfg.video.bitrate}kbps`)} />
                    </div>
                  </div>
                )}

                {/* Danger zone */}
                {isHost && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.15)' }}>
                    <p className="text-[11px] font-black uppercase mb-2" style={{ color: '#C0392B', ...T }}>End Broadcast</p>
                    <button onClick={() => endMut.mutate()}
                      className="w-full py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1"
                      style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', color: '#C0392B', ...T }}>
                      <LogOut className="w-3.5 h-3.5" /> End Broadcast for Everyone
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ❤️ HEALTH TAB */}
            {activeTab === 'health' && (
              <div className="p-2 space-y-3">
                <StreamHealthDashboard isLive={party?.status === 'live'} />
                {partyId && (
                  <LiveAudiencePulse roomId={partyId} isHost={isHost} viewerCount={liveViewers || members.length} />
                )}
                {partyId && (
                  <BroadcastAnalyticsDashboard
                    streamSession={{ id: partyId, title: party?.title }}
                    isLive={party?.status === 'live'}
                  />
                )}
                {partyId && user?.id && (
                  <ZEGOLiveRoom
                    roomId={partyId}
                    userId={user.id}
                    userName={user.full_name || user.email || 'Host'}
                    isHost={isHost}
                    onStreamHealth={() => {}}
                  />
                )}
                {isHost && partyId && user?.id && (
                  <VideoShortRecorder roomId={partyId} creatorId={user.id} />
                )}
              </div>
            )}

            {/* 🎙 GUEST QUEUE */}
            {activeTab === 'queue' && canManage && (
              <div className="p-2 space-y-3">
                <GuestQueue roomId={partyId} isHost={canManage} />
                {user?.id && (
                  <GuestRTMPPanel participantId={user.id} userId={user.id} />
                )}
                <ZEGOGuestApprovalPanel roomId={partyId} isHost={canManage} />
                <GuestStreamMonitor guestName={user?.full_name || 'Host'} isStreaming={party?.status === 'live'} />
                {members.length > 0 && (
                  <GuestStreamingPermissions participant={members[0]} isHost={isHost} onUpdate={() => {}} />
                )}
                <GuestGrid
                  participants={members}
                  isHost={isHost}
                  onInvite={copyLink}
                  hostId={party?.host_id}
                  remoteStreams={remoteStreams}
                  peerUserIds={peerUserIds}
                  localStream={localStream}
                  currentUserId={user?.id}
                />
                <GuestControls
                  participants={members}
                  onMuteGuest={(guestId) => {
                    const m = members.find(x => x.id === guestId);
                    if (m) toast(`${m.user_name} muted (local)`);
                  }}
                  onRemoveGuest={(guestId) => {
                    const m = members.find(x => x.id === guestId);
                    if (m) kickMember(m);
                  }}
                />
                <GuestConnector roomId={partyId} roomName={party?.title || 'SeeWhy Studio'} />
                <GuestInviteGenerator roomId={partyId} isHost={isHost} />
                {members[0]?.user_id && (
                  <GuestDestinationsPanel participantUserId={members[0].user_id} guestName={members[0].full_name || 'Guest'} />
                )}
                <RTMPFanoutPanel roomId={partyId} isHost={isHost} />
                <RTMPIngestPanel roomId={partyId} />
                <WebSourceOverlay isStreamActive={party?.status === 'live'} />
              </div>
            )}

            {/* 🤖 AI HUB TAB */}
            {activeTab === 'ai' && (
              <div className="flex flex-col h-full">
                {/* Sub-tab nav */}
                <div className="flex gap-0 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {[
                    { id: 'music',     icon: '🎵', label: 'Music' },
                    { id: 'copilot',   icon: '🤖', label: 'Copilot' },
                    { id: 'guardian',  icon: '🛡️', label: 'Guard' },
                    { id: 'director',  icon: '🎬', label: 'Direct' },
                    { id: 'summary',   icon: '📊', label: 'Summary' },
                    { id: 'clips',     icon: '✂️',  label: 'Clips' },
                    { id: 'persona',   icon: '✨', label: 'Persona' },
                    { id: 'countdown', icon: '⏱', label: 'Count' },
                    { id: 'aura',      icon: '🌊', label: 'Aura' },
                    { id: 'audio',     icon: '🎚', label: 'Audio' },
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

                      {/* Soundboard */}
                      <SoundboardWidget isVisible={true} />

                      {/* Panel music player */}
                      <PanelMusicPlayer />

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
                      {/* Stream chatbot */}
                      <StreamChatbot roomId={partyId} isHost={canManage} elapsedSeconds={elapsed} hostName={party?.host_name || ''} room={party} />
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
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
                        <LiveTranscription isLive={party?.status === 'live'} roomId={partyId} />
                      </div>
                    </div>
                  )}

                  {/* ── CLIPS ── */}
                  {aiSubTab === 'clips' && (
                    <div className="space-y-3">
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,133,74,0.2)' }}>
                        <ClipGeneratorAI sessionId={partyId} roomId={partyId} creatorId={user?.id} />
                      </div>
                      {partyId && user?.id && (
                        <StreamHighlightCapture
                          roomId={partyId}
                          sessionId={partyId}
                          creatorId={user.id}
                          elapsedSeconds={0}
                          isHost={isHost}
                        />
                      )}
                      <div className="rounded-xl p-3" style={{ background: 'rgba(212,133,74,0.06)', border: '1px solid rgba(212,133,74,0.15)' }}>
                        <p className="text-[11px] font-black uppercase mb-1" style={{ color: '#D4854A', fontFamily: 'Barlow Condensed, sans-serif' }}>AI Clip Generator</p>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Automatically detects highlight moments and creates shareable clips from your live session.</p>
                      </div>
                    </div>
                  )}

                  {/* ── AI PERSONA ── */}
                  {aiSubTab === 'persona' && (
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
                      <AIPersonaCustomizer roomId={partyId} sessionId={partyId} onCustomized={() => {}} />
                    </div>
                  )}

                  {/* ── PRE-STREAM COUNTDOWN ── */}
                  {aiSubTab === 'countdown' && (
                    <PreStreamCountdown
                      room={party}
                      currentUser={user}
                      onGoLive={() => toast.success('You\'re live! 🎙')}
                    />
                  )}

                  {aiSubTab === 'aura' && partyId && (
                    <div className="space-y-3">
                      <AuraPanel
                        roomId={partyId}
                        isHost={isHost}
                        streamTitle={party?.title}
                        viewerCount={members.length}
                        isLive={party?.status === 'live'}
                        userTier="creator"
                      />
                      <AuraEmotionDisplay
                        roomId={partyId}
                        sessionId={partyId}
                        auraPersona="hype"
                      />
                    </div>
                  )}

                  {aiSubTab === 'audio' && (
                    <div className="space-y-3">
                      <AudioMixer
                        micMuted={!audioEnabled}
                        onMicToggle={toggleAudio}
                      />
                      <AudioPanel
                        micMuted={!audioEnabled}
                        onMicToggle={toggleAudio}
                        participants={members}
                      />
                      <EnhancedAudioMixer
                        micMuted={!audioEnabled}
                        onMicToggle={toggleAudio}
                        onAudioSettingsChange={() => {}}
                      />
                    </div>
                  )}


                </div>
              </div>
            )}

            {/* 📢 SHARE TAB */}
            {activeTab === 'share' && (
              <div className="p-3 space-y-3">
                <div className="text-[10px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Share Your Live Session</div>

                {/* ShareToSocial quick-share widget */}
                <ShareToSocial content={{ url: window.location.href, title: party?.title ? `🔴 ${party.title} — Join me LIVE on SeeWhy!` : '🔴 Join me LIVE on SeeWhy!' }} />

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
                  <button onClick={() => { navigator.clipboard.writeText(`<iframe src="${window.location.href}" width="100%" height="600" frameborder="0" allow="camera;microphone"></iframe>`); }}
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

        <motion.button whileTap={{ scale: 0.92 }} onClick={toggleAudio}
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
          style={{
            background: audioEnabled ? 'rgba(109,191,126,0.12)' : 'rgba(255,68,68,0.15)',
            border: audioEnabled ? '1px solid rgba(109,191,126,0.3)' : '1px solid rgba(255,68,68,0.4)',
            color: audioEnabled ? '#6DBF7E' : '#FF4444',
          }}>
          {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </motion.button>

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

        {!isHost ? (
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => { window.location.href = '/'; }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase"
            style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444', ...T }}>
            <PhoneOff className="w-3.5 h-3.5" /> Leave
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => endMut.mutate()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase"
            style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444', ...T }}>
            <PhoneOff className="w-3.5 h-3.5" /> End Broadcast
          </motion.button>
        )}
      </div>

      {showCameraPicker && (
        <CameraSourcePicker
          currentStream={localStream}
          onSelect={(stream) => {
            if (stream && localStream) {
              const newTrack = stream.getVideoTracks()[0];
              if (newTrack) {
                peersRef.current.forEach(({ pc }) => {
                  const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                  if (sender) sender.replaceTrack(newTrack).catch(() => {});
                });
              }
            }
            setShowCameraPicker(false);
          }}
          onClose={() => setShowCameraPicker(false)}
        />
      )}

      {partyId && (
        <LoveHearts roomId={partyId} currentUser={user} creatorId={party?.host_id} />
      )}

      {partyId && (
        <StreamEventBus
          roomId={partyId}
          isHost={isHost}
          sessionId={user?.id}
          onViewerUpdate={n => { setLiveViewers(n); setPeakViewers(p => Math.max(p, n)); }}
          onTipReceived={msg => { const amt = msg.tip_amount || 0; if (amt > 0) setTipTotal(prev => prev + amt); }}
        />
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

      {/* Points notification overlay — shows animated badge when points are awarded */}
      {user?.id && <PointsNotification userId={user.id} />}

      {/* Tipping modal — opened via tipModalOpen state */}
      <TippingModal
        isOpen={tipModalOpen}
        onClose={() => setTipModalOpen(false)}
        recipient={{ id: party?.host_id, name: party?.host_name || 'Creator' }}
        roomId={partyId}
      />

      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <OnlineUsersGrid roomId={partyId} remoteStreams={remoteStreams} peerUserIds={peerUserIds} localStream={localStream} currentUser={user} compact maxVisible={10} />
        <ContentRecommendations />
        <CollaborationMatcher currentUserId={user?.id} />
      </div>
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
    </div>
  );
}