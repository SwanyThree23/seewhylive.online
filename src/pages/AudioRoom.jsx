import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
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
import { useAutoSpeakGate } from '../hooks/useAutoSpeakGate';
import { useConnectionQuality } from '../hooks/useConnectionQuality';
import { useVODRecording } from '../hooks/useVODRecording';
import { useSubscriptionCount } from '../hooks/useSubscriptionCount';
import AggregatedChat from '../components/live/AggregatedChat';
import AudioStageTab from '../components/audio/AudioStageTab';
import LoveTap from '../components/live/LoveTap';
import LivePoll from '../components/live/LivePoll';
import SuperChatBar from '../components/live/SuperChatBar';
import StreamGoals from '../components/live/StreamGoals';
import AICopilotSidebar from '../components/live/AICopilotSidebar';
import AIStreamSummary from '../components/live/AIStreamSummary';
import AudioPanel from '../components/live/AudioPanel';
import ChatModerationPanel from '../components/rooms/ChatModerationPanel';
import SoundboardWidget from '../components/live/SoundboardWidget';
import StreamChatbot from '../components/live/StreamChatbot';
import InteractivePollWidget from '../components/streaming/InteractivePollWidget';
import LiveTranslationWidget from '../components/streaming/LiveTranslationWidget';
import MultiGuestPanel from '../components/streaming/MultiGuestPanel';
import EnhancedRoomControls from '../components/live/EnhancedRoomControls';
import GiftShopTray from '../components/live/GiftShopTray';
import PanelMusicPlayer from '../components/live/PanelMusicPlayer';
import LiveTranscription from '../components/live/LiveTranscription';
import PointsEarnWidget from '../components/loyalty/PointsEarnWidget';
import { MerchStrip } from '../components/merch/MerchWidget';
import ReportModal from '../components/moderation/ReportModal';
import LiveAudiencePulse from '../components/live/LiveAudiencePulse';
import AuraEmotionDisplay from '../components/live/AuraEmotionDisplay';
import EnhancedStreamChat from '../components/live/EnhancedStreamChat';
import GiftTray from '../components/live/GiftTray';
import AnimatedGiftShop from '../components/monetization/AnimatedGiftShop';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ShareToSocial from '../components/social/ShareToSocial';
import LoyaltyBadge from '../components/rooms/LoyaltyBadge';
import VirtualCurrencyTips from '../components/live/VirtualCurrencyTips';
import TippingModal from '../components/monetization/TippingModal';
import ZEGOGuestJoin from '../components/zego/ZEGOGuestJoin';
import TippingOverlay from '../components/live/TippingOverlay';
import MobileStreamControls from '../components/live/MobileStreamControls';
import TipNowModal from '../components/live/TipNowModal';
import ModerationAppealPanel from '../components/live/ModerationAppealPanel';
import StreamMetricsBar from '../components/live/StreamMetricsBar';
import SceneSwitcher from '../components/live/SceneSwitcher';
import PollLaunchBar from '../components/live/PollLaunchBar';
import LeaderboardPanel from '../components/live/LeaderboardPanel';
import ModerationActionModal from '../components/moderation/ModerationActionModal';
import PayPerViewGate from '../components/live/PayPerViewGate';
import PaywallGate from '../components/live/PaywallGate';
import SubscriptionGate from '../components/live/SubscriptionGate';
import RTMPFanoutPanel from '../components/streaming/RTMPFanoutPanel';
import GuestInviteGenerator from '../components/streaming/GuestInviteGenerator';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import TipWidget from '../components/live/TipWidget';
import EngagementBadgesDisplay from '../components/live/EngagementBadgesDisplay';
import SuperChatRail from '../components/live/SuperChatRail';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const BG      = '#080B18';
const BG2     = '#0D1022';
const GREEN   = '#6DBF7E';

const PALETTE = ['#8B6F47','#6B7C4A','#CC7755','#4A6B3A','#7C4A3A','#6B5C3A','#A6263A','#D4854A'];

function avatarColor(name) {
  return PALETTE[(name?.charCodeAt(0) ?? 0) % PALETTE.length];
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const OCT = 'polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)';

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
          background: `linear-gradient(135deg, ${color}88, ${BG2})`,
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
            style={{ background: '#EF4444', border: `2px solid ${BG}` }}>
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
  const size  = 52;
  const color = avatarColor(member.user_name || 'A');
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative" style={{ width: size, height: size }}>
        <div className="absolute inset-0" style={{ clipPath: OCT, background: 'rgba(255,255,255,0.12)' }} />
        <div className="absolute inset-[2px] overflow-hidden flex items-center justify-center font-bold text-sm text-white"
          style={{ clipPath: OCT, background: `linear-gradient(135deg, ${color}66, ${BG2})` }}>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const roomId = searchParams.get('id');

  const { localStream, audioEnabled, toggleAudio } = useLocalMedia({ audio: true, video: false });
  const { remoteStreams, peerUserIds, announceJoin, leaveRoom: leavePeerRoom } = useWebRTCPeers(roomId, localStream);

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
    queryFn:  () => base44.entities.Reaction.filter({ room_id: roomId, emoji: '❤️', target_type: 'room' }),
    enabled:  !!roomId,
    refetchInterval: 5000,
  });

  const [chatOpen,    setChatOpen]    = useState(false);
  const [handRaised,  setHandRaised]  = useState(false);
  const [loveCount,   setLoveCount]   = useState(0);
  const [reportOpen,  setReportOpen]  = useState(false);
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [tipNowOpen,   setTipNowOpen]   = useState(false);
  const [activeScene,  setActiveScene]  = useState('main');

  const [createTitle,    setCreateTitle]    = useState('');
  const [createVideoUrl, setCreateVideoUrl] = useState('');
  const [creating,       setCreating]       = useState(false);

  // Elapsed-seconds counter (starts on mount)
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { setLoveCount(loves.length); }, [loves.length]);

  useEffect(() => {
    if (!roomId || !user?.id) return;
    announceJoin(user.id);
    return leavePeerRoom;
  }, [roomId, user?.id]);

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
  const myMember   = members.find(m => m.user_id === user?.id);
  const hostName   = hostMember?.user_name || party?.host_name || 'Host';
  const memberCount = members.length;
  const { extractClipBlobUrl } = useVODRecording({ streamId: roomId || '', creatorId: user?.id || '', title: party?.title || 'Live Audio', stream: localStream });
  const subCount = useSubscriptionCount(party?.host_id || user?.id);

  function handleToggleAudio() {
    toggleAudio();
    if (myMember?.id) {
      base44.entities.WatchPartyMember.update(myMember.id, { is_audio_enabled: !audioEnabled }).catch(() => {});
    }
  }

  // Keyboard shortcuts: M = mic toggle, Space = push-to-talk (hold)
  useEffect(() => {
    const onDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
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
    const onUp = (e) => {
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
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioEnabled, pttActive]);

  // Apply audio output device to all media elements when speaker pref changes
  useEffect(() => {
    if (!prefSpeaker) return;
    document.querySelectorAll('video, audio').forEach(el => {
      if (typeof el.setSinkId === 'function') {
        el.setSinkId(prefSpeaker).catch(() => {});
      }
    });
    try { localStorage.setItem('swl_pref_speaker', prefSpeaker); } catch {}
  }, [prefSpeaker]);

  // Apply live audio processing constraints (NS / EC / AGC)
  useEffect(() => {
    applyAudioConstraints({
      noiseSuppression: noiseSupp,
      echoCancellation: echoCan,
      autoGainControl:  autoGain,
    });
  }, [noiseSupp, echoCan, autoGain, applyAudioConstraints]);

  async function sendLove() {
    if (!user?.id || !roomId) {
      setLoveCount(c => c + 1);
      return;
    }
    try {
      await base44.entities.Reaction.create({ room_id: roomId, user_id: user.id, emoji: '❤️', target_type: 'room', target_id: roomId });
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
          base44.entities.WatchPartyMember.update(m.id, { is_active: false, left_at: new Date().toISOString() }).catch(() => {})
        )).catch(() => {});
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
        {/* Connection quality */}
        <div className="flex items-end gap-0.5 px-1.5 py-1 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.06)' }}
          title={`Network: ${netLabel}${netRtt ? ` · ${netRtt}ms` : ''}`}>
          {[0,1,2,3].map(i => (
            <div key={i} className="w-1 rounded-sm"
              style={{
                height: 4 + i * 3,
                background: i < netBars
                  ? (netBars >= 3 ? '#4A9B5E' : netBars >= 2 ? '#D4AF37' : '#C0392B')
                  : 'rgba(0,0,0,0.15)',
              }} />
          ))}
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
            speaking: m.user_id === user?.id ? localIsSpeaking : m.speaking,
          }))}
          localStream={localStream}
          remoteStreams={remoteStreams}
          peerUserIds={peerUserIds}
          onLeave={leaveRoom}
        />

        {/* Multi-guest panel (host view) */}
        {isHost && roomId && (
          <MultiGuestPanel
            participants={members}
            spotlightId={null}
            onSpotlight={() => {}}
            roomId={roomId}
            isHost={isHost}
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
              style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.35)' }}
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
                navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied!')).catch(() => toast.error('Copy failed.'));
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

          <div className="relative flex flex-col items-center gap-0.5">
            <button
              onClick={handleToggleAudio}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{
                background: pttActive ? 'rgba(109,191,126,0.25)' : audioEnabled ? `${GOLD}15` : 'rgba(192,57,43,0.15)',
                border: pttActive ? '1px solid rgba(109,191,126,0.6)' : audioEnabled ? `1px solid ${GOLD}44` : '1px solid rgba(192,57,43,0.4)',
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
            onClick={() => setSettingsOpen(v => !v)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              background: settingsOpen ? `${GOLD}20` : 'rgba(255,255,255,0.07)',
              border: settingsOpen ? `1px solid ${GOLD}55` : '1px solid rgba(255,255,255,0.12)',
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

      <AnimatePresence>
        {settingsOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.4)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 z-50 rounded-t-2xl overflow-hidden"
              style={{ bottom: 64, background: BG, borderTop: `1px solid rgba(212,175,55,0.2)` }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="shrink-0 flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-black uppercase text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Audio Settings</span>
                <button onClick={() => setSettingsOpen(false)} className="text-white/40 text-sm">✕</button>
              </div>

              <div className="p-4 space-y-4" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {/* Speaker output */}
                {speakers.length > 1 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5" style={{ color: GOLD }} />
                      <span className="text-xs font-bold uppercase text-white/60">Output Device</span>
                    </div>
                    <select
                      value={prefSpeaker}
                      onChange={e => setPrefSpeaker(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      {speakers.map(d => (
                        <option key={d.deviceId} value={d.deviceId} style={{ background: '#111' }}>
                          {d.label || `Speaker ${d.deviceId.slice(0, 6)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Audio processing toggles */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase text-white/60">Mic Processing</span>
                  {[
                    { label: 'Noise Suppression', value: noiseSupp, set: setNoiseSupp },
                    { label: 'Echo Cancellation', value: echoCan,   set: setEchoCan   },
                    { label: 'Auto Gain',          value: autoGain,  set: setAutoGain  },
                  ].map(({ label, value, set }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-white/80">{label}</span>
                      <button
                        onClick={() => set(v => !v)}
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
                  ))}
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
          creatorId={party?.host_id}
          creatorName={hostName}
        />
      )}

      {/* Live Poll (host can launch polls) */}
      {roomId && (
        <div style={{ padding: '0 16px 8px' }}>
          <LivePoll roomId={roomId} isHost={isHost} />
        </div>
      )}

      {/* Interactive poll widget (host) */}
      {roomId && isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <InteractivePollWidget roomId={roomId} isHost={isHost} />
        </div>
      )}

      {/* Live translation (host) */}
      {isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <LiveTranslationWidget chatMessage={null} onTranslation={() => {}} />
        </div>
      )}

      {/* Stream goals (host) */}
      {roomId && isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <StreamGoals roomId={roomId} isHost={isHost} />
        </div>
      )}

      {/* Live audience pulse + Aura emotion (host) */}
      {roomId && isHost && (
        <div style={{ padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <LiveAudiencePulse roomId={roomId} isHost={isHost} viewerCount={memberCount} />
          <AuraEmotionDisplay roomId={roomId} sessionId={roomId} auraPersona="hype" />
        </div>
      )}

      {/* AI Copilot (host) */}
      {roomId && isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <AICopilotSidebar roomId={roomId} isHost={isHost} viewerCount={memberCount} />
        </div>
      )}

      {/* Points earn widget (host awards points) */}
      {roomId && isHost && user?.id && party?.host_id && (
        <div style={{ padding: '0 16px 8px' }}>
          <PointsEarnWidget userId={user.id} creatorId={party.host_id} roomId={roomId} isHost={isHost} />
        </div>
      )}

      {/* Live transcription (host) */}
      {roomId && isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <LiveTranscription isLive={true} roomId={roomId} />
        </div>
      )}

      {/* SuperChat bar (viewers) */}
      {roomId && party?.host_id && !isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <SuperChatBar roomId={roomId} currentUser={user} recipientId={party.host_id} recipientName={party.host_name || ''} />
        </div>
      )}

      {/* Enhanced room controls (audio + branding, host only) */}
      {isHost && (
        <div style={{ padding: '0 16px 8px' }}>
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

      {/* Audio mixer panel (host only) */}
      {roomId && isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <AudioPanel micMuted={!audioEnabled} onMicToggle={toggleAudio} participants={members} />
        </div>
      )}

      {/* Music player panel (host) */}
      {isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <PanelMusicPlayer />
        </div>
      )}

      {/* Scene switcher (host) */}
      {isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <SceneSwitcher activeScene={activeScene} onSceneChange={setActiveScene} />
        </div>
      )}

      {/* Poll launch bar (host) */}
      {roomId && isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <PollLaunchBar roomId={roomId} hostId={user?.id} activePoll={null} isHost={true} />
        </div>
      )}

      {/* Stream metrics bar (host) */}
      {isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <StreamMetricsBar startTime={null} memberCount={memberCount} tipTotal={0} peakViewers={memberCount} />
        </div>
      )}

      {/* Leaderboard panel (all users) */}
      {roomId && (
        <div style={{ padding: '0 16px 8px' }}>
          <LeaderboardPanel roomId={roomId} />
        </div>
      )}

      {/* Soundboard (host only) */}
      {isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <SoundboardWidget />
        </div>
      )}

      {/* AI stream chatbot (host only) */}
      {roomId && isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <StreamChatbot roomId={roomId} isHost={isHost} hostName={party?.host_name || ''} room={party} elapsedSeconds={0} />
        </div>
      )}

      {/* Chat moderation (host only) */}
      {roomId && isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <ChatModerationPanel roomId={roomId} />
        </div>
      )}

      {/* AI stream summary (host only) */}
      {roomId && isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <AIStreamSummary roomId={roomId} isHost={isHost} streamTitle={party?.title} viewerCount={memberCount} />
        </div>
      )}

      {/* Gift shop tray (viewers can send gifts) */}
      {roomId && !isHost && (
        <GiftShopTray roomId={roomId} currentUser={user} />
      )}

      {/* Gift tray + animated gift shop (viewers) */}
      {roomId && !isHost && user && party?.host_id && (
        <div style={{ padding: '0 16px 8px' }}>
          <GiftTray roomId={roomId} currentUser={user} recipientId={party.host_id} />
        </div>
      )}
      {roomId && !isHost && party?.host_id && (
        <div style={{ padding: '0 16px 8px' }}>
          <AnimatedGiftShop roomId={roomId} recipientId={party.host_id} onClose={() => {}} />
        </div>
      )}

      {/* Loyalty badge (viewers see their loyalty status) */}
      {roomId && !isHost && user?.id && party?.host_id && (
        <div style={{ padding: '0 16px 8px' }}>
          <LoyaltyBadge userId={user.id} creatorId={party.host_id} />
        </div>
      )}

      {/* Enhanced stream chat (viewers) */}
      {roomId && !isHost && user?.id && (
        <div style={{ padding: '0 16px 8px' }}>
          <EnhancedStreamChat roomId={roomId} userId={user.id} userName={user.full_name || ''} userRole="viewer" />
        </div>
      )}

      {/* Virtual currency tips (viewers) */}
      {roomId && !isHost && party?.host_id && user && (
        <div style={{ padding: '0 16px 8px' }}>
          <VirtualCurrencyTips roomId={roomId} creatorId={party.host_id} currentUser={user} isHost={false} />
        </div>
      )}

      {/* ZEGO guest join (for non-host joining via ZEGO) */}
      {roomId && !isHost && user?.id && (
        <div style={{ padding: '0 16px 8px' }}>
          <ZEGOGuestJoin roomId={roomId} userId={user.id} userName={user.full_name || ''} onJoined={() => {}} />
        </div>
      )}

      {/* Tipping overlay (viewers) */}
      {roomId && !isHost && party?.host_id && (
        <TippingOverlay roomId={roomId} creatorId={party.host_id} isVisible={true} />
      )}

      {/* Mobile stream controls */}
      {roomId && !isHost && (
        <MobileStreamControls
          micMuted={!audioEnabled}
          onMicToggle={toggleAudio}
          onReact={() => sendLove()}
          onQuickTip={() => setTipNowOpen(true)}
          roomId={roomId}
        />
      )}

      {/* Moderation appeal panel */}
      {roomId && (
        <ModerationAppealPanel flagId={null} messageId={null} roomId={roomId} onClose={() => {}} />
      )}

      {/* Tip now modal */}
      {tipNowOpen && (
        <TipNowModal
          roomId={roomId}
          currentUser={user}
          hostId={party?.host_id}
          onClose={() => setTipNowOpen(false)}
        />
      )}

      {/* Tipping modal */}
      <TippingModal
        isOpen={tipModalOpen}
        onClose={() => setTipModalOpen(false)}
        recipient={party?.host_name || ''}
        roomId={roomId}
        communityId={party?.community_id || null}
      />

      {/* Merch strip */}
      {roomId && party?.host_id && (
        <MerchStrip roomId={roomId} currentUser={user} hostId={party.host_id} />
      )}

      {/* Report modal */}
      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} reportedUser={null} roomId={roomId} communityId={party?.community_id || null} messageId={null} />

      {/* Moderation action modal (host) */}
      {isHost && (
        <ModerationActionModal isOpen={false} onClose={() => {}} targetUser={null} roomId={roomId} communityId={party?.community_id || null} moderatorId={user?.id} />
      )}

      {/* Access gates (render for non-hosts on exclusive rooms) */}
      {roomId && !isHost && party?.host_id && (
        <>
          <SubscriptionGate creatorId={party.host_id} roomId={roomId} />
          <PayPerViewGate roomId={roomId} ppvPrice={4.99} onPurchase={() => {}} />
          <PaywallGate isHost={false} streamTitle={party?.title || ''} onUnlock={() => {}} isUnlocked={true} />
        </>
      )}

      {/* Milestone alerts + AI recommendations */}
      <MilestoneAlerts userId={user?.id} roomId={roomId} />
      <SwanAIRecommendations roomId={roomId} currentLayout="audio" viewerCount={members.length} />

      {/* Engagement badges */}
      {roomId && user?.id && (
        <div style={{ padding: '0 16px 8px' }}>
          <EngagementBadgesDisplay roomId={roomId} userId={user.id} creatorId={party?.host_id} />
        </div>
      )}

      {/* Super chat rail (all users) */}
      {roomId && <SuperChatRail roomId={roomId} currentUser={user} />}

      {/* Tip widget (viewers only) */}
      {roomId && !isHost && party?.host_id && (
        <div style={{ padding: '0 16px 8px' }}>
          <TipWidget roomId={roomId} recipient={{ id: party.host_id, name: party.host_name || 'Host' }} currentUser={user} />
        </div>
      )}

      {/* Presence + discovery */}
      <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <OnlineUsersGrid roomId={roomId} remoteStreams={remoteStreams} peerUserIds={peerUserIds} localStream={localStream} currentUser={user} compact maxVisible={10} />
        <ContentRecommendations />
        <CollaborationMatcher currentUserId={user?.id} />
        <ShareToSocial url={window.location.href} title={party?.title ? `Join "${party.title}" on SeeWhy LIVE!` : 'Join my audio room on SeeWhy LIVE!'} />
      </div>

      {/* Cross-nav footer */}
      <div style={{ padding: '10px 16px', background: 'rgba(8,11,24,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to={createPageUrl('GoLive')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#C4B596', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            📡 Go Live
          </button>
        </Link>
        <Link to={createPageUrl('LiveRoom')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#C4B596', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            🎙️ Live Room
          </button>
        </Link>
        <Link to={createPageUrl('ControlRoom')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#C4B596', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            🎛️ Control Room
          </button>
        </Link>
        <Link to={createPageUrl('PodcastStudio')} style={{ textDecoration: 'none' }}>
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#C4B596', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            🎤 Podcast
          </button>
        </Link>
      </div>
    </div>
  );
}
