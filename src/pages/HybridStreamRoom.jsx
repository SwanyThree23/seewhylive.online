import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users, PhoneOff, Settings, Share2, Radio } from 'lucide-react';
import WatchPartyPlayer from '../components/streaming/WatchPartyPlayer';
import MultiGuestPanel from '../components/streaming/MultiGuestPanel';
import ChatPanel from '../components/rooms/ChatPanel';
import ParticipantsList from '../components/rooms/ParticipantsList';
import { toast } from 'sonner';

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
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#3C2F2F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#F5E6D3]">Loading hybrid room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#3C2F2F] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#D4AF37] mb-2">Room not found</h2>
          <Button onClick={() => window.location.href = '/Home'}>Go Home</Button>
        </div>
      </div>
    );
  }

  const isHost = room.host_id === user?.id;

  return (
    <div className="h-screen bg-gradient-to-br from-[#3C2F2F] to-[#2A1F1F] text-[#F5E6D3] overflow-hidden">
      {/* Top Bar */}
      <div className="bg-[#2A1F1F] border-b-2 border-[#800020] shadow-lg">
        <div className="max-w-full mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {room.status === 'live' && (
                <Badge className="bg-[#800020] text-[#D4AF37] border-2 border-[#D4AF37] animate-pulse shadow-[0_0_15px_rgba(128,0,32,0.8)]">
                  <Radio className="w-3 h-3 mr-1" />
                  HYBRID ROOM LIVE
                </Badge>
              )}
              <div>
                <h1 className="text-xl font-bold text-[#D4AF37]">{room.title}</h1>
                <p className="text-sm text-[#F5E6D3]/70">
                  {participants.length} participants • Watch Party + Guest Panel
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="border-[#800020] text-[#D4AF37] hover:bg-[#800020]/20">
                <Share2 className="w-4 h-4" />
              </Button>
              {isHost && (
                <Button variant="outline" size="icon" className="border-[#800020] text-[#D4AF37] hover:bg-[#800020]/20">
                  <Settings className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => leaveMutation.mutate()}
                className="bg-red-600 hover:bg-red-700"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                Leave
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left: Content Area */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          {/* Top: Watch Party (50%) */}
          <div className="h-1/2">
            <WatchPartyPlayer
              roomId={roomId}
              isHost={isHost}
              videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            />
          </div>

          {/* Bottom: Multi-Guest Panel (50%) */}
          <div className="h-1/2">
            <MultiGuestPanel
              participants={participants}
              spotlightId={spotlightId}
              onSpotlight={(id) => setSpotlightId(spotlightId === id ? null : id)}
              maxGuests={20}
            />
          </div>
        </div>

        {/* Right: Chat & Participants */}
        <div className="w-96 bg-[#2A1F1F] border-l-2 border-[#800020] flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 bg-[#3C2F2F]">
              <TabsTrigger value="chat" className="data-[state=active]:bg-[#800020] data-[state=active]:text-[#D4AF37]">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="participants" className="data-[state=active]:bg-[#800020] data-[state=active]:text-[#D4AF37]">
                <Users className="w-4 h-4 mr-2" />
                People
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
              <ChatPanel roomId={roomId} currentUser={user} />
            </TabsContent>

            <TabsContent value="participants" className="flex-1 overflow-hidden mt-0">
              <ParticipantsList
                participants={participants}
                currentUser={user}
                roomId={roomId}
                communityId={room.community_id}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}