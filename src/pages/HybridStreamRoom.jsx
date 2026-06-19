import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { MessageSquare, Users, PhoneOff, Settings, Share2, Radio } from 'lucide-react';
import WatchPartyPlayer from '../components/streaming/WatchPartyPlayer';
import MultiGuestPanel from '../components/streaming/MultiGuestPanel';
import OctagonalVideoWindow from '../components/live/OctagonalVideoWindow';
import GuestGrid from '../components/live/GuestGrid';
import EvmuxWebSource from '../components/live/EvmuxWebSource';
import StreamWebSourceManager from '../components/live/StreamWebSourceManager';
import RTMPIngestPanel from '../components/streaming/RTMPIngestPanel';
import RTMPFanoutPanel from '../components/streaming/RTMPFanoutPanel';
import GuestConnector from '../components/live/GuestConnector';
import GuestInviteGenerator from '../components/streaming/GuestInviteGenerator';
import AdvancedEncoderSettings from '../components/streaming/AdvancedEncoderSettings';
import ScreenSharePanel from '../components/live/ScreenSharePanel';
import LocalVideoTile from '../components/live/LocalVideoTile';
import UnifiedChat from '../components/live/UnifiedChat';
import StageView from '../components/rooms/StageView';
import ChatPanel from '../components/rooms/ChatPanel';
import ParticipantsList from '../components/rooms/ParticipantsList';
import StreamGoals from '../components/live/StreamGoals';
import LivePoll from '../components/live/LivePoll';
import CoStreamPanel from '../components/collaboration/CoStreamPanel';
import CollaborativeWhiteboard from '../components/collaboration/CollaborativeWhiteboard';
import { toast } from 'sonner';
import CollabPlaylist from '../components/watchparty/CollabPlaylist';
import WatchPartyAnalytics from '../components/watchparty/WatchPartyAnalytics';
import VideoQueuePanel from '../components/watchparty/VideoQueuePanel';
import WatchPartyTab from '../components/watchparty/WatchPartyTab';
import WatchQueue from '../components/watchparty/WatchQueue';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ShareToSocial from '../components/social/ShareToSocial';
import { MerchStrip } from '../components/merch/MerchWidget';
import SuperChatRail from '../components/live/SuperChatRail';
import GiftShopTray from '../components/live/GiftShopTray';
import GiftAnimation from '../components/live/GiftAnimation';
import AICopilotSidebar from '../components/live/AICopilotSidebar';
import LoveTap from '../components/live/LoveTap';
import GiftTray from '../components/live/GiftTray';
import TipWidget from '../components/live/TipWidget';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';

export default function HybridStreamRoom() {
  const navigate = useNavigate();
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

  const { localStream } = useLocalMedia({ audio: true, video: true });
  const { remoteStreams, peerUserIds, announceJoin, leaveRoom: leaveRTCRoom } = useWebRTCPeers(roomId, localStream);

  useEffect(() => {
    if (!roomId || !user?.id) return;
    announceJoin(user.id);
    return leaveRTCRoom;
  }, [roomId, user?.id]);

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const myParticipant = participants.find(p => p.user_id === user?.id);
      if (myParticipant) {
        await base44.entities.Participant.delete(myParticipant.id);
      }
    },
    onSuccess: () => {
      navigate('/Home');
    },
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
          <button onClick={() => navigate('/Home')}
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
              roomId={roomId}
              isHost={isHost}
              currentUser={user}
            />
          </div>
        </div>

        {/* Right: Chat & Participants */}
        <div className="w-80 flex flex-col" style={{ borderLeft: '1px solid rgba(212,175,55,0.08)', background: 'rgba(8,11,24,0.7)' }}>
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

      {/* Host tools */}
      {roomId && isHost && (
        <div style={{ padding: '0 16px 8px' }}>
          <StreamGoals roomId={roomId} isHost={isHost} />
        </div>
      )}
      {roomId && (
        <div style={{ padding: '0 16px 8px' }}>
          <LivePoll roomId={roomId} isHost={isHost} />
        </div>
      )}

      {/* Co-streaming + Whiteboard */}
      {roomId && (
        <div style={{ padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <CoStreamPanel roomId={roomId} />
          <CollaborativeWhiteboard roomId={roomId} />
        </div>
      )}

      {/* Octagonal video window + guest grid (host) */}
      {isHost && (
        <div style={{ padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <OctagonalVideoWindow title="Main Stage" isMuted={false} isVideoOff={false} onMicToggle={() => {}} onVideoToggle={() => {}} />
          <LocalVideoTile stream={null} audioEnabled={true} videoEnabled={true} userName={user?.full_name || ''} isHost={isHost} />
          <GuestGrid participants={participants} isHost={isHost} onInvite={() => {}} hostId={user?.id} />
          <StreamWebSourceManager isStreamActive={false} />
          <RTMPIngestPanel roomId={roomId} />
          <RTMPFanoutPanel roomId={roomId} isHost={isHost} />
          <GuestConnector roomId={roomId} />
          <GuestInviteGenerator roomId={roomId} isHost={isHost} />
          <AdvancedEncoderSettings onApply={() => {}} />
          <ScreenSharePanel isSharing={false} onStartShare={() => {}} onStopShare={() => {}} />
        </div>
      )}

      {/* Unified chat (all users) */}
      {roomId && (
        <div style={{ padding: '0 16px 8px' }}>
          <UnifiedChat roomId={roomId} currentUser={user} isHost={isHost} />
        </div>
      )}

      {/* Stage view for participants */}
      {roomId && (
        <div style={{ padding: '0 16px 8px' }}>
          <StageView
            stage={null}
            participants={participants}
            currentUserId={user?.id}
            onUpdateParticipant={() => {}}
            localStream={localStream}
            localAudioEnabled={true}
            localVideoEnabled={true}
            onToggleAudio={() => {}}
            onToggleVideo={() => {}}
            remoteStreams={remoteStreams}
            peerUserIds={[]}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 16px 28px' }}>
        {[
          { label: '🎙 Broadcast Studio', href: 'BroadcastStudio' },
          { label: '🎧 Audio Room',       href: 'AudioRoom'       },
          { label: '🎬 Watch Party',      href: 'WatchParty'      },
          { label: '🔴 Go Live',          href: 'GoLive'          },
        ].map(item => (
          <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
            <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', cursor: 'pointer' }}>{item.label}</span>
          </Link>
        ))}
      </div>

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <CollabPlaylist roomId={roomId} isHost={false} />
        <VideoQueuePanel roomId={roomId} isHost={false} onVideoSelect={() => {}} />
        <WatchPartyAnalytics partyId={null} />
        <WatchPartyTab roomId={roomId} user={null} party={null} members={[]} remoteStreams={[]} onSyncEvent={() => {}} syncEvent={null} />
        <WatchQueue isHost={false} currentIndex={0} onSelect={() => {}} />
        <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <OnlineUsersGrid roomId={roomId} remoteStreams={remoteStreams} peerUserIds={peerUserIds} localStream={localStream} currentUser={user} compact maxVisible={10} />
          <ContentRecommendations />
          <CollaborationMatcher />
          <SwanAIRecommendations roomId={roomId} currentLayout="default" viewerCount={0} />
          <MilestoneAlerts userId={user?.id} roomId={roomId} />
          <ShareToSocial url={window.location.href} title="SeeWhy LIVE" />
          {roomId && room?.host_id && !isHost && (
            <LoveTap roomId={roomId} user={user} creatorId={room.host_id} creatorName={room.host_name || 'Host'} />
          )}
          {roomId && room?.host_id && !isHost && (
            <GiftTray roomId={roomId} recipientId={room.host_id} senderId={user?.id} />
          )}
          {roomId && room?.host_id && !isHost && (
            <TipWidget roomId={roomId} recipient={{ id: room.host_id, name: room.host_name || 'Host' }} currentUser={user} />
          )}
        </div>
      </div>
    </div>
  );
}