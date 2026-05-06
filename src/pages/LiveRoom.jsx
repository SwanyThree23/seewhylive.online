import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalMedia } from '../hooks/useLocalMedia';
import LocalVideoTile from '../components/live/LocalVideoTile';
import WebRTCSetupBanner from '../components/live/WebRTCSetupBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import StreamHealthMonitor from '../components/live/StreamHealthMonitor';
import SceneSwitcher from '../components/live/SceneSwitcher';
import AudioMixer from '../components/live/AudioMixer';
import LowerThirdsBanner from '../components/live/LowerThirdsBanner';
import GuestGrid from '../components/live/GuestGrid';
import UnifiedChat from '../components/live/UnifiedChat';
import AggregatedChat from '../components/live/AggregatedChat';
import ViewerCount from '../components/live/ViewerCount';
import HostAlertCenter from '../components/live/HostAlertCenter';
import StreamEventBus from '../components/live/StreamEventBus';
import ChatModeration from '../components/live/ChatModeration';
import PreStreamCountdown from '../components/live/PreStreamCountdown';
import ClipCreator from '../components/live/ClipCreator';
import PointsNotification from '../components/live/PointsNotification';
import StreamMetadata from '../components/live/StreamMetadata';
import StreamGoals from '../components/live/StreamGoals';
import RaidPanel from '../components/live/RaidPanel';
import MobileStreamControls from '../components/live/MobileStreamControls';
import StreamChatbot from '../components/live/StreamChatbot';
import PKBattle from '../components/live/PKBattle';
import WebhookHooks from '../components/live/WebhookHooks';
import LivePoll from '../components/live/LivePoll';
import GreenroomQueue from '../components/streaming/GreenroomQueue';
import BattleMode from '../components/streaming/BattleMode';

import {
  Radio, PhoneOff, Settings, ChevronLeft, ChevronRight,
  Video, VideoOff, Monitor, Mic, MicOff, StopCircle, Circle,
  MessageSquare, Users, BarChart2, ShoppingBag, HelpCircle, Share2,
  Clock, Crown, AlignLeft, DollarSign, Lock
} from 'lucide-react';
import ShareModal from '../components/live/ShareModal';
import DirectPayments from '../components/live/DirectPayments';
import PaywallGate from '../components/live/PaywallGate';
import PrivatePanel from '../components/live/PrivatePanel';
import AudioPanel from '../components/live/AudioPanel';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const LAYOUT_MODES = [
  { id: 'grid', label: 'Grid' },
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'cinema', label: 'Cinema' },
  { id: 'side', label: 'Side-by-Side' },
];

export default function LiveRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('id');
  const qc = useQueryClient();

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [activeScene, setActiveScene] = useState('camera');
  const [micMuted, setMicMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingId, setRecordingId] = useState(null);
  const recordingStartRef = useRef(null);
  const [layoutMode, setLayoutMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('chat');
  const [viewerCount, setViewerCount] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [bannerConfig, setBannerConfig] = useState({ enabled: false, text: '', style: 'gradient', color: '#d4af37' });
  const [participants, setParticipants] = useState([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [paywallUnlocked, setPaywallUnlocked] = useState(false);
  const timerRef = useRef(null);

  // Real browser media (mic + camera)
  const { localStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo, error: mediaError, } = useLocalMedia({ audio: true, video: true });

  // Keep micMuted in sync with actual track state
  const handleMicToggle = () => { toggleAudio(); setMicMuted(v => !v); };

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
    refetchInterval: 10000,
  });

  useEffect(() => { setParticipants(fetchedParticipants); }, [fetchedParticipants]);

  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.Participant.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      if (event.type === 'create') setParticipants(prev => [...prev, event.data]);
      else if (event.type === 'update') setParticipants(prev => prev.map(p => p.id === event.id ? event.data : p));
      else if (event.type === 'delete') setParticipants(prev => prev.filter(p => p.id !== event.id));
    });
    return unsub;
  }, [roomId]);

  useEffect(() => {
    if (room?.status === 'live') {
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [room?.status]);

  useEffect(() => {
    if (viewerCount > peakViewers) setPeakViewers(viewerCount);
  }, [viewerCount]);

  const goLiveMutation = useMutation({
    mutationFn: () => base44.entities.Room.update(roomId, {
      status: room?.status === 'live' ? 'ended' : 'live',
      started_at: room?.status !== 'live' ? new Date().toISOString() : undefined,
      ended_at: room?.status === 'live' ? new Date().toISOString() : undefined,
    }),
    onSuccess: () => qc.invalidateQueries(['room', roomId]),
  });

  const startRecordingMutation = useMutation({
    mutationFn: async () => {
      const rec = await base44.entities.Recording.create({
        room_id: roomId,
        host_id: room?.host_id,
        title: room?.title || 'Live Stream',
        started_at: new Date().toISOString(),
        status: 'recording',
        stream_url: `${window.location.origin}${createPageUrl('LiveRoom')}?id=${roomId}`,
        viewer_count: viewerCount,
      });
      return rec;
    },
    onSuccess: (rec) => {
      setRecordingId(rec.id);
      recordingStartRef.current = Date.now();
      setIsRecording(true);
      toast.success('Recording started');
    },
  });

  const stopRecordingMutation = useMutation({
    mutationFn: async () => {
      if (!recordingId) return;
      const duration = Math.floor((Date.now() - (recordingStartRef.current || Date.now())) / 1000);
      await base44.entities.Recording.update(recordingId, {
        ended_at: new Date().toISOString(),
        status: 'ready',
        duration_seconds: duration,
        viewer_count: peakViewers,
      });
    },
    onSuccess: () => {
      setIsRecording(false);
      setRecordingId(null);
      toast.success('Recording saved to Past Streams');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const mine = participants.find(p => p.user_id === user?.id);
      if (mine) await base44.entities.Participant.delete(mine.id);
    },
    onSuccess: () => { window.location.href = createPageUrl('Home'); },
  });

  const isHost = room?.host_id === user?.id;
  const isLive = room?.status === 'live';

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}${createPageUrl('LiveRoom')}?id=${roomId}`);
    toast.success('Invite link copied!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0618] flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#0d0618] flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#d4af37] mb-4">Room not found</h2>
          <Link to={createPageUrl('Home')}><Button>Go Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0d0618] text-white flex flex-col overflow-hidden" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Modals */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        url={`${window.location.origin}/LiveRoom?id=${roomId}`}
        title={room?.title}
      />
      <DirectPayments
        isOpen={paymentsOpen}
        onClose={() => setPaymentsOpen(false)}
        creatorName={user?.full_name}
      />

      {/* Mount invisible event bus + alert center */}
      <StreamEventBus roomId={roomId} isHost={isHost} onViewerUpdate={setViewerCount} />
      <HostAlertCenter />

      {/* ─── TOP BAR ─── */}
      <div className="h-12 shrink-0 flex items-center gap-3 px-4 border-b border-[rgba(212,175,55,0.12)] bg-[rgba(13,6,24,0.95)] z-30">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-white/60 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Link>

        {isLive && (
          <Badge className="bg-red-600 text-white animate-pulse border-0 text-xs flex items-center gap-1 px-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            LIVE
          </Badge>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{room.title}</p>
        </div>

        {isLive && (
          <div className="flex items-center gap-1 font-mono text-xs text-white/60">
            <Clock className="w-3 h-3" />
            {formatElapsed(elapsedSeconds)}
          </div>
        )}

        <ViewerCount count={viewerCount} peakViewers={peakViewers} />

        {isHost && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => isRecording ? stopRecordingMutation.mutate() : startRecordingMutation.mutate()}
              disabled={startRecordingMutation.isPending || stopRecordingMutation.isPending}
              className={`h-7 text-xs gap-1 ${isRecording ? 'text-red-400' : 'text-white/50'}`}
            >
              {isRecording ? <StopCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
              <span className="hidden sm:inline">{isRecording ? 'Stop Rec' : 'Record'}</span>
            </Button>

            <Button
              size="sm"
              onClick={() => goLiveMutation.mutate()}
              disabled={goLiveMutation.isPending}
              className={`h-7 text-xs gap-1 font-bold ${
                isLive
                  ? 'bg-red-700 hover:bg-red-800 text-white'
                  : 'bg-[#d4af37] hover:bg-[#f5e6a3] text-black'
              }`}
            >
              <Radio className="w-3 h-3" />
              {isLive ? 'End Stream' : 'Go Live'}
            </Button>
          </div>
        )}

        {/* Direct Payments */}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-[#d4af37]/60 hover:text-[#d4af37]"
          title="Direct Payments"
          onClick={() => setPaymentsOpen(true)}
        >
          <DollarSign className="w-4 h-4" />
        </Button>

        {/* Share */}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-white/60 hover:text-white"
          title="Share stream"
          onClick={() => setShareOpen(true)}
        >
          <Share2 className="w-4 h-4" />
        </Button>

        <Button
          variant="destructive"
          size="sm"
          className="h-7 text-xs gap-1 bg-[#800020] hover:bg-[#9a0025]"
          onClick={() => leaveMutation.mutate()}
        >
          <PhoneOff className="w-3 h-3" />
          <span className="hidden sm:inline">Leave</span>
        </Button>
      </div>

      {/* ─── 3-COLUMN BODY ─── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ─── LEFT SIDEBAR ─── */}
        <AnimatePresence initial={false}>
          {leftOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 h-full border-r border-[rgba(212,175,55,0.1)] bg-[rgba(13,6,24,0.7)] flex flex-col overflow-y-auto overflow-x-hidden"
            >
              <div className="p-3 space-y-3">
              <StreamHealthMonitor isLive={isLive} />
              <SceneSwitcher activeScene={activeScene} onSceneChange={setActiveScene} />
              <AudioPanel micMuted={micMuted} onMicToggle={() => setMicMuted(!micMuted)} participants={participants} />
              <AudioMixer micMuted={micMuted} onMicToggle={() => setMicMuted(!micMuted)} />
              <LowerThirdsBanner onBannerChange={setBannerConfig} />
              {isHost && <ChatModeration />}
              <StreamChatbot
                roomId={roomId}
                isHost={isHost}
                elapsedSeconds={elapsedSeconds}
                hostName={user?.full_name}
                room={room}
              />
              <PKBattle
                roomId={roomId}
                isHost={isHost}
                hostName={user?.full_name}
                viewerCount={viewerCount}
              />
              <WebhookHooks roomId={roomId} isHost={isHost} />
              <LivePoll roomId={roomId} isHost={isHost} />
              <PrivatePanel isHost={isHost} currentUser={user} />
              {!isHost && !paywallUnlocked && (
                <PaywallGate
                  isHost={false}
                  streamTitle={room?.title}
                  onUnlock={() => setPaywallUnlocked(true)}
                  isUnlocked={paywallUnlocked}
                />
              )}
              {isHost && (
                <PaywallGate isHost={true} streamTitle={room?.title} />
              )}

                <div className="space-y-2 pt-1">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider px-1">Layout</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {LAYOUT_MODES.map(l => (
                      <button
                        key={l.id}
                        onClick={() => setLayoutMode(l.id)}
                        className={`text-[10px] py-1.5 rounded border transition-all ${
                          layoutMode === l.id
                            ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10'
                            : 'border-white/10 text-white/40 hover:border-white/20'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle left sidebar */}
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-4 h-10 flex items-center justify-center bg-[rgba(212,175,55,0.1)] hover:bg-[rgba(212,175,55,0.2)] rounded-r border-r border-[rgba(212,175,55,0.2)] transition-all"
          style={{ left: leftOpen ? 240 : 0 }}
        >
          {leftOpen ? <ChevronLeft className="w-3 h-3 text-[#d4af37]" /> : <ChevronRight className="w-3 h-3 text-[#d4af37]" />}
        </button>

        {/* ─── CENTER STAGE ─── */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Stage area */}
          <div className="flex-1 relative overflow-hidden bg-black">
            {/* Scene content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScene}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                {activeScene === 'brb' ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0d0618] to-[#1a0a30]">
                    <div className="text-center">
                      <div className="text-6xl mb-4">⏸</div>
                      <h2 className="text-4xl font-bold text-[#d4af37]">Be Right Back</h2>
                      <p className="text-white/50 mt-2">Stream will resume shortly</p>
                    </div>
                  </div>
                ) : activeScene === 'starting' ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0d0618] to-[#001a30]">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎬</div>
                      <h2 className="text-4xl font-bold text-[#00d4ff]">Starting Soon</h2>
                      <p className="text-white/50 mt-2 animate-pulse">{room.title}</p>
                    </div>
                  </div>
                ) : activeScene === 'ending' ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0d0618] to-[#1a0000]">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🙏</div>
                      <h2 className="text-4xl font-bold text-[#d4af37]">Thanks for Watching!</h2>
                      <p className="text-white/50 mt-2">Stream ending soon</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col">
                    {/* Local self-view: top-right PiP when others on stage, else full */}
                    {participants.length > 0 ? (
                      <>
                        <GuestGrid
                          participants={participants}
                          isHost={isHost}
                          hostId={room?.host_id}
                          maxGuests={20}
                          onInvite={copyInvite}
                        />
                        {/* Self-view picture-in-picture */}
                        <div className="absolute top-3 right-3 w-36 h-24 z-10 rounded-lg overflow-hidden shadow-xl border border-[#d4af37]/30">
                          <LocalVideoTile
                            stream={localStream}
                            audioEnabled={audioEnabled}
                            videoEnabled={videoEnabled}
                            userName={user?.full_name}
                            isHost={isHost}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
                        <div className="w-full max-w-sm aspect-video rounded-xl overflow-hidden">
                          <LocalVideoTile
                            stream={localStream}
                            audioEnabled={audioEnabled}
                            videoEnabled={videoEnabled}
                            userName={user?.full_name}
                            isHost={isHost}
                          />
                        </div>
                        {mediaError && (
                          <div className="w-full max-w-sm">
                            <WebRTCSetupBanner
                              error={mediaError}
                              audioEnabled={audioEnabled}
                              videoEnabled={videoEnabled}
                              onRetry={() => window.location.reload()}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Lower thirds overlay */}
            <AnimatePresence>
              {bannerConfig.enabled && (
                <motion.div
                  initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                  className="absolute bottom-4 left-4 right-4 h-10 rounded overflow-hidden z-10"
                >
                  <div
                    className="w-full h-full flex items-center px-4"
                    style={{
                      background: bannerConfig.style === 'gradient'
                        ? 'linear-gradient(90deg, rgba(128,0,32,0.9) 0%, rgba(212,175,55,0.9) 100%)'
                        : bannerConfig.style === 'solid'
                        ? 'rgba(13,6,24,0.95)'
                        : 'transparent'
                    }}
                  >
                    <p className="text-sm font-bold truncate" style={{ color: bannerConfig.color, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                      {bannerConfig.text}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hover controls overlay */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity bg-black/60 rounded-full px-4 py-2 z-20 pointer-events-none group-hover:pointer-events-auto">
              <button
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all pointer-events-auto ${
                  !audioEnabled ? 'bg-red-700/80 border-red-600 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
                onClick={handleMicToggle}
              >
                {!audioEnabled ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all pointer-events-auto ${
                  !videoEnabled ? 'bg-red-700/80 border-red-600 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
                onClick={toggleVideo}
              >
                {!videoEnabled ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white/10 border-white/20 text-white hover:bg-white/20 pointer-events-auto">
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pre-stream countdown (scheduled, not live) */}
          {room?.status === 'scheduled' && room?.scheduled_start && !isLive && (
            <PreStreamCountdown room={room} currentUser={user} onGoLive={() => isHost && goLiveMutation.mutate()} />
          )}

          {/* Viewer points notification */}
          {!isHost && <PointsNotification userId={user?.id} />}

          {/* Bottom bar: layout controls */}
          <div className="h-9 shrink-0 flex items-center justify-center gap-2 border-t border-white/5 bg-[rgba(13,6,24,0.8)] px-4">
            {LAYOUT_MODES.map(l => (
              <button
                key={l.id}
                onClick={() => setLayoutMode(l.id)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                  layoutMode === l.id
                    ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10'
                    : 'border-white/10 text-white/30 hover:border-white/20'
                }`}
              >
                {l.label}
              </button>
            ))}
            <div className="w-px h-4 bg-white/10 mx-1" />
            <p className="text-[10px] text-white/30 font-mono">{participants.length} on stage</p>
          </div>
        </div>

        {/* Toggle right sidebar */}
        <button
          onClick={() => setRightOpen(!rightOpen)}
          className="relative z-20 w-4 h-10 flex items-center justify-center bg-[rgba(212,175,55,0.1)] hover:bg-[rgba(212,175,55,0.2)] border-l border-[rgba(212,175,55,0.2)] transition-all self-center"
        >
          {rightOpen ? <ChevronRight className="w-3 h-3 text-[#d4af37]" /> : <ChevronLeft className="w-3 h-3 text-[#d4af37]" />}
        </button>

        {/* ─── RIGHT SIDEBAR ─── */}
        <AnimatePresence initial={false}>
          {rightOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 h-full border-l border-[rgba(212,175,55,0.1)] bg-[rgba(13,6,24,0.95)] flex flex-col overflow-hidden"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                <TabsList className="shrink-0 grid grid-cols-4 bg-[rgba(13,6,24,0.9)] border-b border-[rgba(212,175,55,0.1)] rounded-none h-10 p-0">
                  {[
                    { value: 'chat', icon: MessageSquare, label: 'Chat' },
                    { value: 'guests', icon: Users, label: 'Guests' },
                    { value: 'analytics', icon: BarChart2, label: 'Stats' },
                    { value: 'goals', icon: ShoppingBag, label: 'Goals' },
                  ].map(tab => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex flex-col items-center gap-0.5 h-full rounded-none text-[9px] text-white/50 data-[state=active]:text-[#d4af37] data-[state=active]:bg-[#d4af37]/5 data-[state=active]:border-b-2 data-[state=active]:border-[#d4af37] transition-all"
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="chat" className="flex-1 overflow-hidden m-0 p-0">
                  <AggregatedChat roomId={roomId} currentUser={user} isHost={isHost} />
                </TabsContent>

                <TabsContent value="guests" className="flex-1 overflow-y-auto m-0 p-3 space-y-3">
                  {/* Greenroom Queue — real-time director view */}
                  <GreenroomQueue roomId={roomId} isHost={isHost} />

                  {/* On-stage participants list */}
                  <div className="border-t border-white/5 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-semibold text-[#d4af37] uppercase tracking-wider">On Stage</p>
                      <Badge className="text-[9px] bg-[#800020]/60 text-[#d4af37] border-[#d4af37]/30">{participants.length}</Badge>
                    </div>
                    {participants.map(p => (
                      <div key={p.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5 mb-1">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#800020] to-[#d4af37] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {p.user_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-white truncate flex items-center gap-1">
                            {p.user_id === room?.host_id && <Crown className="w-3 h-3 text-[#d4af37]" />}
                            {p.user_name}
                          </p>
                          <p className="text-[9px] text-white/40 capitalize">{p.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Battle Mode widget */}
                  <div className="border-t border-white/5 pt-3">
                    <BattleMode roomId={roomId} isHost={isHost} hostName={user?.full_name} participants={participants} />
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="flex-1 overflow-y-auto m-0 p-3 space-y-3">
                  <p className="text-xs font-semibold text-[#d4af37]">Stream Stats</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Viewers', value: viewerCount, color: '#00d4ff' },
                      { label: 'Peak', value: peakViewers, color: '#d4af37' },
                      { label: 'Messages', value: 0, color: '#a78bfa' },
                      { label: 'Reactions', value: 0, color: '#22c55e' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white/5 border border-white/5 rounded-lg p-3">
                        <p className="text-[10px] text-white/40 uppercase">{stat.label}</p>
                        <p className="text-xl font-bold font-mono mt-1" style={{ color: stat.color }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <Link to={createPageUrl('StreamAnalytics') + `?id=${roomId}`}>
                    <Button size="sm" variant="outline" className="w-full mt-2 text-xs border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10">
                      Full Analytics →
                    </Button>
                  </Link>
                </TabsContent>

                <TabsContent value="goals" className="flex-1 overflow-hidden m-0 p-0">
                  <StreamGoals isHost={isHost} currentTips={0} currentSubs={0} currentViewers={viewerCount} />
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile controls */}
      <MobileStreamControls
        micMuted={micMuted}
        onMicToggle={() => setMicMuted(!micMuted)}
        onReact={() => {}}
        onQuickTip={() => {}}
        roomId={roomId}
      />

      {/* Mobile bottom strip */}
      <div className="md:hidden h-14 shrink-0 flex items-center justify-around border-t border-white/10 bg-[rgba(13,6,24,0.95)] px-4">
        <button onClick={handleMicToggle} className={`flex flex-col items-center gap-0.5 ${!audioEnabled ? 'text-red-400' : 'text-white/60'}`}>
          {!audioEnabled ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          <span className="text-[9px]">Mic</span>
        </button>
        <button onClick={() => setActiveTab('chat')} className="flex flex-col items-center gap-0.5 text-white/60">
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px]">Chat</span>
        </button>
        {isHost && (
          <button
            onClick={() => goLiveMutation.mutate()}
            className={`flex flex-col items-center gap-0.5 ${isLive ? 'text-red-400' : 'text-[#d4af37]'}`}
          >
            <Radio className="w-5 h-5" />
            <span className="text-[9px]">{isLive ? 'End' : 'Go Live'}</span>
          </button>
        )}
        <button onClick={() => setActiveTab('guests')} className="flex flex-col items-center gap-0.5 text-white/60">
          <Users className="w-5 h-5" />
          <span className="text-[9px]">Guests</span>
        </button>
        <button onClick={() => leaveMutation.mutate()} className="flex flex-col items-center gap-0.5 text-red-400">
          <PhoneOff className="w-5 h-5" />
          <span className="text-[9px]">Leave</span>
        </button>
      </div>
    </div>
  );
}