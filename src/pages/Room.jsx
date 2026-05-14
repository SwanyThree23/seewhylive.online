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
import LivePollWidget from '../components/live/LivePollWidget';
import { Link } from 'react-router-dom';

export default function RoomPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [stages, setStages] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef(null);
  const recordingStartRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

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
  });

  const updateParticipantMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      return await base44.entities.Participant.update(id, updates);
    },
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
  });

  useEffect(() => {
    if (room && user && !currentParticipant) {
      joinRoomMutation.mutate();
    }
  }, [room, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Room not found</h2>
          <p className="text-muted-foreground mb-4">This room doesn't exist or has been deleted</p>
          <Button onClick={() => window.location.href = createPageUrl('Home')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const isHost = currentParticipant?.role === 'host';
  const isSpeaker = ['host', 'co-host', 'speaker'].includes(currentParticipant?.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Tip Alert */}
      <TipAlert roomId={roomId} recipientId={room?.host_id} />
      
      {/* Top Bar */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {room.status === 'live' && (
                <Badge className="bg-red-500 text-white animate-pulse">
                  <Radio className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
              )}
              <div>
                <h1 className="text-xl font-bold">{room.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShareButtons
                url={`${window.location.origin}${createPageUrl('Room')}?id=${roomId}`}
                title={room?.title}
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowWhiteboard(!showWhiteboard)}
                title="Toggle Whiteboard"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              {isHost && (
                <>
                  <GreenroomWaitlistPanel roomId={roomId} currentUser={user} />
                  <RaidPanelButton room={room} currentUser={user} isHost={isHost} />
                  <Link to={`/ControlRoom?room_id=${roomId}`}>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-[10px]"
                      style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      📡 Control Room
                    </button>
                  </Link>
                  <Link to={`/ModerationDashboard?room_id=${roomId}`}>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-[10px]"
                      style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#8B5CF6', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      🛡 Moderation
                    </button>
                  </Link>
                  <Button
                    variant={isRecording ? 'destructive' : 'outline'}
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      if (isRecording) stopRecordingMutation.mutate();
                      else startRecordingMutation.mutate();
                    }}
                    disabled={startRecordingMutation.isPending || stopRecordingMutation.isPending}
                  >
                    {isRecording ? <StopCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    {isRecording ? 'Stop Rec' : 'Record'}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    title="End stream"
                    onClick={async () => {
                      if (isRecording) await stopRecordingMutation.mutateAsync();
                      await base44.entities.Room.update(room.id, { status: 'ended', ended_at: new Date().toISOString() });
                      toast.success('Stream ended');
                      queryClient.invalidateQueries(['room', roomId]);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button 
                variant="destructive"
                onClick={() => leaveRoomMutation.mutate()}
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                Leave
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Stage & Controls */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stage */}
            <div className="bg-white rounded-xl shadow-lg p-6">
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
                        localStream={null}
                        localAudioEnabled={currentParticipant?.is_audio_enabled ?? true}
                        localVideoEnabled={currentParticipant?.is_video_enabled ?? true}
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
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold mb-4">Collaborative Whiteboard</h3>
                <CollaborativeWhiteboard roomId={roomId} />
              </div>
            )}

            {/* Quick Tip */}
            {room?.host_id !== user?.id && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Support the Creator
                </h3>
                <QuickTip recipientId={room.host_id} recipientName="Host" />
              </div>
            )}

            {/* Control Bar */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-center gap-3">
                {/* Gift Shop Tray for viewers */}
                {user && !isHost && (
                  <GiftShopTray roomId={roomId} currentUser={user} />
                )}
                {currentParticipant && (
                     <>
                    <Button
                      size="lg"
                      variant={currentParticipant.is_audio_enabled ? "default" : "destructive"}
                      className="w-16 h-16 rounded-full"
                      onClick={() => updateParticipantMutation.mutate({
                        id: currentParticipant.id,
                        updates: { is_audio_enabled: !currentParticipant.is_audio_enabled }
                      })}
                      disabled={!isSpeaker}
                    >
                      {currentParticipant.is_audio_enabled ? (
                        <Mic className="w-6 h-6" />
                      ) : (
                        <MicOff className="w-6 h-6" />
                      )}
                    </Button>

                    <Button
                      size="lg"
                      variant={currentParticipant.is_video_enabled ? "default" : "outline"}
                      className="w-16 h-16 rounded-full"
                      onClick={() => updateParticipantMutation.mutate({
                        id: currentParticipant.id,
                        updates: { is_video_enabled: !currentParticipant.is_video_enabled }
                      })}
                      disabled={!isSpeaker}
                    >
                      {currentParticipant.is_video_enabled ? (
                        <Video className="w-6 h-6" />
                      ) : (
                        <VideoOff className="w-6 h-6" />
                      )}
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
          <div className="lg:col-span-1">
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
             <div className="mt-4">
               <ChatModerationPanel roomId={roomId} />
             </div>
            )}
            {/* Live Auctions - visible to all */}
            <div className="mt-4">
              <LiveAuctionWidget roomId={roomId} currentUser={user} isHost={isHost} />
            </div>
            {/* Live Poll Widget */}
            <div className="mt-4">
              <LivePollWidget roomId={roomId} currentUser={user} isHost={isHost} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}