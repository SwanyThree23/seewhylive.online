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
import RTMPFanoutPanel from '../components/streaming/RTMPFanoutPanel';
import GuestInviteGenerator from '../components/streaming/GuestInviteGenerator';
import GreenroomWaitlistPanel from '../components/greenroom/GreenroomWaitlistPanel';
import LiveAuctionWidget from '../components/live/LiveAuctionWidget';
import RaidPanelButton from '../components/live/RaidPanel';
import GiftShopTray from '../components/live/GiftShopTray';
import TipWidget from '../components/live/TipWidget';
import LivePollWidget from '../components/live/LivePollWidget';
import { Link, useNavigate } from 'react-router-dom';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
import { useAutoSpeakGate } from '../hooks/useAutoSpeakGate';
import { useConnectionQuality } from '../hooks/useConnectionQuality';
import { useVODRecording } from '../hooks/useVODRecording';
import { useSubscriptionCount } from '../hooks/useSubscriptionCount';
import { useHighlightDetector } from '../hooks/useHighlightDetector';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import { MerchStrip } from '../components/merch/MerchWidget';
import SuperChatRail from '../components/live/SuperChatRail';
import AICopilotSidebar from '../components/live/AICopilotSidebar';
import LoveTap from '../components/live/LoveTap';
import GiftTray from '../components/live/GiftTray';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';

export default function RoomPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [stages, setStages] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
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
  const [chatMessages, setChatMessages] = useState([]);
  const [hypeLevel, setHypeLevel] = useState(0);
  useHighlightDetector({ partyId: roomId, roomId, isHost, user, messages: chatMessages, hypeLevel, elapsedSeconds: elapsed, getClipBlobUrl: extractClipBlobUrl });

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
      navigate(createPageUrl('Home'));
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
          <button onClick={() => navigate(createPageUrl('Home'))}
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

  const hostParticipant = participants.find(p => p.user_id === room.host_id);
  const speakerName = participants.find(p => p.is_speaking)?.user_name;

  return (
    <div className="min-h-screen" style={{ background: '#080B18' }}>
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
                style={{ background: isRecording ? 'rgba(192,57,43,0.15)' : 'rgba(255,255,255,0.06)', color: isRecording ? '#EF4444' : 'rgba(255,255,255,0.4)' }}>
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
            <div className="rounded-xl p-4" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
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
              <div className="rounded-xl p-4" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
                <h3 className="font-semibold mb-4 text-white">Collaborative Whiteboard</h3>
                <CollaborativeWhiteboard roomId={roomId} />
              </div>
            )}

            {/* Quick Tip */}
            {room?.host_id !== user?.id && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-white">
                  <DollarSign className="w-5 h-5" style={{ color: '#D4AF37' }} />
                  Support the Creator
                </h3>
                <QuickTip recipientId={room.host_id} recipientName="Host" />
              </div>
            )}

            {/* Control Bar */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
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
            {isHost && (
              <div className="mt-3 space-y-3">
                <RTMPFanoutPanel userId={user?.id} streamId={roomId} isStreaming={room?.status === 'live'} />
                <GuestInviteGenerator userId={user?.id} roomId={roomId} streamId={roomId} />
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
            <div className="mt-3 space-y-3">
              {roomId && <SuperChatRail roomId={roomId} currentUser={user} />}
              {roomId && room?.host_id && (
                <MerchStrip roomId={roomId} currentUser={user} hostId={room.host_id} />
              )}
              <OnlineUsersGrid roomId={roomId} remoteStreams={remoteStreams} peerUserIds={peerUserIds} localStream={localStream} currentUser={user} compact maxVisible={8} />
              <ContentRecommendations />
            </div>
            {isHost && <AICopilotSidebar roomId={roomId} hostId={user?.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}