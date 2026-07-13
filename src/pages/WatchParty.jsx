import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Youtube, Video, LogOut, List, Maximize2, Minimize2, X as XIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import VideoSourcePicker, { getYouTubeId, detectVideoType } from '../components/video/VideoSourcePicker';
import VideoPlayerControls from '../components/video/VideoPlayerControls';
import AggregatedChat from '../components/live/AggregatedChat';
import SuperChatBar from '../components/live/SuperChatBar';
import StreamGoals from '../components/live/StreamGoals';
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
import WatchPartyTab from '../components/watchparty/WatchPartyTab';
import CollabPlaylist from '../components/watchparty/CollabPlaylist';
import WatchPartyAnalytics from '../components/watchparty/WatchPartyAnalytics';
import AICopilotSidebar from '../components/live/AICopilotSidebar';
import PointsEarnWidget from '../components/loyalty/PointsEarnWidget';
import { MerchStrip } from '../components/merch/MerchWidget';
import LiveAudiencePulse from '../components/live/LiveAudiencePulse';
import ChatOverlay from '../components/live/ChatOverlay';
import WatchPartyPlayer from '../components/streaming/WatchPartyPlayer';
import YouTubeDiscovery from '../components/youtube/YouTubeDiscovery';
import GiftTray from '../components/live/GiftTray';
import GiftAnimation from '../components/live/GiftAnimation';
import TipNowModal from '../components/live/TipNowModal';
import ViewerControlsPanel from '../components/live/ViewerControlsPanel';
import LivePollOverlay from '../components/live/LivePollOverlay';
import UnifiedChat from '../components/live/UnifiedChat';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ShareToSocial from '../components/social/ShareToSocial';
import LoveTap from '../components/live/LoveTap';
import TipWidget from '../components/live/TipWidget';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import PollLaunchBar from '../components/live/PollLaunchBar';
import SuperChatRail from '../components/live/SuperChatRail';

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
      style={{ width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'Barlow Condensed, sans-serif', ...style }} />
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
  return <div className={`rounded-2xl ${className}`} style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', ...style }}>{children}</div>;
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
      qc.invalidateQueries({ queryKey: ['watchparty', party.id] });
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

function OctVideoCell({ member, isHost: isMemberHost, isSpeaking, stream, size = 52 }) {
  const vRef = useRef(null);
  useEffect(() => { if (vRef.current && stream) vRef.current.srcObject = stream; }, [stream]);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, clipPath: OCT, background: isSpeaking ? 'rgba(212,175,55,0.7)' : isMemberHost ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.15)', transition: 'background 0.3s' }} />
      <div style={{ position: 'absolute', inset: 3, clipPath: OCT, background: '#0d0618', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {stream ? (
          <video ref={vRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: size * 0.28, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>
            {member.user_name ? member.user_name.charAt(0).toUpperCase() : '?'}
          </span>
        )}
      </div>
      {isMemberHost && (
        <span style={{ position: 'absolute', top: size * 0.04, left: '50%', transform: 'translateX(-50%)', fontSize: size * 0.14, zIndex: 3 }}>👑</span>
      )}
    </div>
  );
}

function MobileParticipantStrip({ members, hostId, speakingIds, remoteStreams, peerUserIds }) {
  var displayMembers = members.slice(0, 8);
  var overflow = members.length - 8;
  return (
    <div className="flex md:hidden items-center gap-2 px-3 py-1.5 overflow-x-auto shrink-0"
      style={{ background: 'rgba(8,11,24,0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {displayMembers.map(function(m) {
        var isHostMember = m.user_id === hostId;
        var isSpeaking = speakingIds && speakingIds.has(m.user_id);
        var peerId = peerUserIds && Array.from(peerUserIds.entries()).find(([, uid]) => uid === m.user_id)?.[0];
        var stream = (peerId && remoteStreams) ? remoteStreams.get(peerId) : null;
        return (
          <div key={m.id || m.user_id} className="flex flex-col items-center shrink-0 gap-0.5">
            <OctVideoCell member={m} isHost={isHostMember} isSpeaking={isSpeaking} stream={stream} size={52} />
            <span className="text-white/50 truncate max-w-[52px]" style={{ fontSize: 7 }}>{m.user_name}</span>
          </div>
        );
      })}
      {overflow > 0 && (
        <div className="shrink-0 flex flex-col items-center gap-0.5">
          <div style={{ width: 52, height: 52, clipPath: OCT, background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif' }}>
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

function AISummaryButton({ members, elapsed, partyId }) {
  const [loading, setLoading] = useState(false);
  async function handleSummary() {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize this watch party in 2 sentences: ${members.length} viewers, active for ${Math.round(elapsed / 60)} minutes, party ID: ${partyId}. Be concise and engaging.`,
        add_context_from_internet: false,
      });
      toast.success(result || 'No summary available.');
    } catch (err) {
      toast.error('AI Summary failed — try again.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <button
      onClick={handleSummary}
      disabled={loading}
      className="text-[11px] px-2 py-0.5 rounded-full font-bold transition-all"
      style={{ border: '1px solid rgba(212,175,55,0.4)', color: '#d4af37', background: 'rgba(212,175,55,0.06)', fontFamily: 'Barlow Condensed, sans-serif', opacity: loading ? 0.6 : 1 }}
    >
      {loading ? '…' : '✨ AI Summary'}
    </button>
  );
}

export default function WatchPartyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const partyId = searchParams.get('id');
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

  const { localStream } = useLocalMedia({ audio: true, video: true });
  const { remoteStreams, peerUserIds, announceJoin, leaveRoom: leaveRTCRoom } = useWebRTCPeers(partyId, localStream);

  const [screenCaptureStream, setScreenCaptureStream] = useState(null);
  const [chatLines, setChatLines] = useState([]);

  const handleScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: true });
      // Stop old stream only after successfully acquiring the new one
      if (screenCaptureStream) screenCaptureStream.getTracks().forEach(t => t.stop());
      setScreenCaptureStream(stream);
      stream.getVideoTracks()[0].onended = () => setScreenCaptureStream(null);
      return stream;
    } catch {
      // User cancelled or permission denied — leave existing stream running
    }
  };

  useEffect(() => () => {
    screenCaptureStream?.getTracks().forEach(t => t.stop());
  }, [screenCaptureStream]);

  useEffect(() => {
    if (!partyId || !user?.id) return;
    announceJoin(user.id);
    return leaveRTCRoom;
  }, [partyId, user?.id]);

  const wpCompositorSlots = [{ stream: screenCaptureStream, label: '' }];
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
      qc.invalidateQueries({ queryKey: ['watchparty-members', partyId] });
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
      if (user?.id) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'room_created',
          title: `Started watch party: ${p?.title || 'Watch Party'}`,
        }).catch(() => {});
      }
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
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(8,11,24,0.95)', border: '1px solid rgba(212,175,55,0.15)' }}>
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
                { id: 'direct', label: 'Direct URL', icon: Video, color: '#D4AF37', placeholder: 'https://example.com/video.mp4' },
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
              <div className="flex items-center gap-2 text-xs" style={{ color: detectType(videoUrl) === 'youtube' ? '#FF0000' : '#D4AF37' }}>
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
        <div className="shrink-0 flex items-center gap-2 px-3 py-2" style={{ background: 'rgba(212,175,55,0.15)', borderBottom: '1px solid rgba(212,175,55,0.3)' }}>
          <span className="text-xs font-bold" style={{ color: '#D4AF37' }}>⚠️ Sync lost — tap to resync</span>
          <button onClick={function() { if (syncData) onTimeSync(syncData); else if (party) onTimeSync(party); setShowSyncWarn(false); }}
            className="ml-auto px-3 py-1 rounded-lg text-[10px] font-bold"
            style={{ background: 'rgba(212,175,55,0.25)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.4)' }}>
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

      <MobileParticipantStrip members={members} hostId={party.host_id} speakingIds={null} remoteStreams={remoteStreams} peerUserIds={peerUserIds} />

      <ViewerRail members={members} hostId={party.host_id} />

      <div className="shrink-0 px-3 py-1.5">
        <PartyHypeMeter partyId={partyId} memberCount={members.length} />
      </div>

      <div className="shrink-0 relative">
        <PartyReactionsOverlay
          partyId={partyId}
          currentUser={user}
          currentTime={syncData?.current_time || party?.current_time || 0}
        />
        <ReactionOverlay partyId={partyId} currentUser={user} />
      </div>

      <LiveEmoticonStorm partyId={partyId} currentUser={user} />

      {/* Floating chat overlay on video */}
      {partyId && <ChatOverlay roomId={partyId} />}

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
              maxHeight: '80vh', overflowY: 'auto', overscrollBehavior: 'contain',
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
              background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)',
            }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 10 }}>
                🎵 AI Music
              </span>
              {wpDjTrack ? (
                <div style={{
                  padding: '8px 12px', borderRadius: 8, marginBottom: 10,
                  background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
                }}>
                  <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: '#D4AF37', fontWeight: 700, margin: 0 }}>
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
                  textAlign: 'center', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
                  color: '#D4AF37', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
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

        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#080B18' }}>
          <div className="flex shrink-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0B0B18' }}>
            {[
              { id: 'chat',        label: '💬 Chat' },
              { id: 'queue',       label: '🎵 Queue' },
              { id: 'reactions',   label: '⚡ React' },
              { id: 'battle',      label: '⚔️ Battle' },
              { id: 'leaderboard', label: '🏆 Ranks' },
              { id: 'polls',       label: '📊 Polls' },
              { id: 'collab',      label: '🎬 Collab' },
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

          <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ overscrollBehavior: "contain" }}>
            {activePanel === 'chat' && (
              <>
                <div className="flex items-center justify-between px-1 pt-1">
                  <span className="text-[11px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>Live Chat</span>
                  <AISummaryButton members={members} elapsed={elapsed} partyId={partyId} />
                </div>
                {isHost && (
                  <HostControls isHost={isHost} party={party} onUpdate={() => {}} />
                )}
                <AggregatedChat roomId={party.room_id || partyId} currentUser={user} isHost={isHost} />
                {party?.host_id && (
                  <SuperChatBar roomId={partyId} currentUser={user} recipientId={party.host_id} recipientName={party.host_name || ''} />
                )}
                {party?.host_id && partyId && (
                  <MerchStrip roomId={partyId} currentUser={user} hostId={party.host_id} />
                )}
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
              <div className="space-y-3">
                {partyId && <StreamGoals roomId={partyId} isHost={isHost} />}
                {partyId && isHost && <LiveAudiencePulse roomId={partyId} isHost={isHost} viewerCount={members.length} />}
                {partyId && isHost && <AICopilotSidebar roomId={partyId} isHost={isHost} viewerCount={members.length} />}
                {partyId && isHost && user?.id && party?.host_id && (
                  <PointsEarnWidget userId={user.id} creatorId={party.host_id} roomId={partyId} isHost={isHost} />
                )}
                <WatchPartyAnalytics
                  party={party}
                  members={members}
                  pollCount={pollCount}
                  reactionCount={reactionCount}
                />
                <PartyAnalyticsDashboard
                  partyId={partyId}
                  isHost={isHost}
                />
              </div>
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
            {activePanel === 'collab' && (
              <div className="space-y-3 p-2">
                <CollabPlaylist isHost={isHost} currentUser={user} onPlayVideo={url => setVideoUrl(url)} />
              </div>
            )}
            {activePanel === 'battle' && (
              <BattleTiers partyId={partyId} currentUser={user} members={members} hostId={party.host_id} />
            )}
            {activePanel === 'leaderboard' && (
              <SocialLeaderboard members={members} />
            )}
            {activePanel === 'discover' && (
              <div className="space-y-3 p-2">
                <YouTubeDiscovery />
              </div>
            )}
            {activePanel === 'player' && partyId && (
              <div className="space-y-3 p-2">
                <WatchPartyPlayer roomId={partyId} isHost={isHost} />
              </div>
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

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GiftTray roomId={partyId} currentUser={user} recipientId={party?.host_id} />
        {partyId && <GiftAnimation roomId={partyId} />}
        <ViewerControlsPanel roomId={partyId} currentUser={user} isHost={isHost} />
        <LivePollOverlay roomId={partyId} isHost={isHost} currentUser={user} />
        <UnifiedChat roomId={partyId} currentUser={user} isHost={isHost} />
        {!isHost && party?.host_id && <TipNowModal roomId={partyId} recipientId={party.host_id} isOpen={false} onClose={() => {}} />}
        <OnlineUsersGrid roomId={partyId} remoteStreams={remoteStreams} peerUserIds={peerUserIds} localStream={localStream} currentUser={user} compact maxVisible={10} />
        <ContentRecommendations />
        <CollaborationMatcher />
        <SwanAIRecommendations roomId={partyId} currentLayout="default" viewerCount={0} />
        <MilestoneAlerts userId={user?.id} roomId={partyId} />
        {partyId && <SuperChatRail roomId={partyId} currentUser={user} />}
        {isHost && partyId && <PollLaunchBar roomId={partyId} hostId={user?.id} />}
        <ShareToSocial url={window.location.href} title={party?.title ? `Watching "${party.title}" on SeeWhy LIVE!` : 'Join my watch party on SeeWhy LIVE!'} />
        {partyId && party?.host_id && !isHost && (
          <LoveTap roomId={partyId} user={user} creatorId={party.host_id} creatorName={party.host_name || 'Host'} />
        )}
        {partyId && party?.host_id && !isHost && (
          <TipWidget roomId={partyId} recipient={{ id: party.host_id, name: party.host_name || 'Host' }} currentUser={user} />
        )}
      </div>
    </div>
  );
}
