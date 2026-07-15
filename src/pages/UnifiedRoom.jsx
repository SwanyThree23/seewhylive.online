import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { LogOut, Heart, Hand, MessageSquare, DollarSign } from 'lucide-react';
import RoomStatusHeader from '@/components/room/RoomStatusHeader';
import HexagonalStageGrid from '@/components/room/HexagonalStageGrid';
import FloatingControlBar from '@/components/room/FloatingControlBar';
import RoomActionBar from '@/components/room/RoomActionBar';
import MuteNotificationToast from '@/components/room/MuteNotificationToast';
import { toast } from 'sonner';

const GOLD = '#d4af37';
const RED = '#C0392B';
const GREEN = '#6DBF7E';

const SAMPLE_PARTICIPANTS = [
  { id: '1', user_id: 'host', name: 'ladrue swanson', role: 'Host', is_host: true, is_muted: false, is_speaking: true, avatar_url: null },
  { id: '2', user_id: 'cohost', name: 'SwanyThree', role: 'Co-host', is_muted: false, is_speaking: false, avatar_url: null },
  { id: '3', user_id: 'u3', name: 'Tom', role: 'Member', is_muted: true, is_speaking: false, avatar_url: null },
  { id: '4', user_id: 'u4', name: 'Yahwadah', role: 'Member', is_muted: false, is_speaking: false, avatar_url: null },
  { id: '5', user_id: 'u5', name: 'Marvin', role: 'Member', is_muted: true, is_speaking: false, avatar_url: null },
  { id: '6', user_id: 'u6', name: 'Durand', role: 'Member', is_muted: true, is_speaking: false, avatar_url: null },
];

export default function UnifiedRoom() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('id');

  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [muteNotification, setMuteNotification] = useState(null);
  const [speakingId, setSpeakingId] = useState('host');

  const { data: room } = useQuery({
    queryKey: ['unified-room', roomId],
    queryFn: () => base44.entities.Room.get(roomId),
    enabled: !!roomId,
  });

  const { data: participants = SAMPLE_PARTICIPANTS } = useQuery({
    queryKey: ['room-participants', roomId],
    queryFn: async () => {
      const stages = await base44.entities.Stage.filter({ room_id: roomId });
      if (stages.length === 0) return SAMPLE_PARTICIPANTS;
      return stages.map(s => ({
        id: s.id,
        user_id: s.user_id,
        name: s.user_name || 'Guest',
        role: s.role || 'Member',
        is_host: s.role === 'Host',
        is_muted: s.is_muted ?? false,
        is_speaking: false,
        avatar_url: s.avatar_url,
      }));
    },
    enabled: !!roomId,
    refetchInterval: 15000,
  });

  // Simulate speaking rotation for visual demo
  useEffect(() => {
    const interval = setInterval(() => {
      const speakers = participants.filter(p => !p.is_muted);
      if (speakers.length > 0) {
        const random = speakers[Math.floor(Math.random() * speakers.length)];
        setSpeakingId(random.user_id);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [participants]);

  const handleToggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    if (!next) {
      setMuteNotification({ userName: 'You' });
    }
  };

  const handleAction = (key) => {
    const labels = {
      auction: 'Auction panel opening…',
      invite: 'Invite link copied!',
      ai: 'AI assistant activated',
      pay: 'Payment panel opening…',
      battle: 'PK Battle mode activating…',
      panel: 'Host panel opening…',
    };
    toast(labels[key] || key);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0f', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <RoomStatusHeader
        title={room?.title || 'SeeWhy LIVE Room'}
        subtitle={room?.description || 'Audiovisual Podcast'}
        viewerCount={room?.viewer_count || 327}
        hereNow={participants.length}
        speakingName={participants.find(p => p.user_id === speakingId)?.name}
        isLive={room?.status === 'live' || !room}
        onClose={() => navigate('/')}
        onShare={() => toast('Share link copied!')}
        onMenu={() => toast('Menu')}
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-32" style={{ scrollbarWidth: 'none' }}>
        {/* Video / Stream area */}
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-black uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              Stream
            </span>
            <span style={{ fontSize: 14, color: GOLD }}>
              {participants.find(p => p.user_id === speakingId)?.name || 'Someone'} is sharing
            </span>
          </div>
          <div className="relative w-full rounded-2xl overflow-hidden" style={{
            aspectRatio: '16/9',
            background: 'linear-gradient(135deg, #1a0a12, #0a0a0f)',
            border: `1px solid ${GOLD}22`,
          }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
                className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ background: `${RED}22`, border: `2px solid ${RED}` }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: RED }} />
                </div>
                <p className="font-bold" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Waiting for stream…</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Stage Grid */}
        <div className="pt-4">
          <HexagonalStageGrid
            participants={participants}
            speakingId={speakingId}
            hostId="host"
            maxParticipants={room?.max_participants || 20}
          />
        </div>

        {/* Others in room */}
        <div className="pt-4 px-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Others in the Room</span>
            <span className="flex items-center justify-center rounded-full px-2"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>1</span>
          </div>
          <div className="flex items-center gap-2">
            {participants.slice(0, 6).map(p => (
              <div key={`other-${p.id}`} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                {p.name?.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-4">
          <RoomActionBar onAction={handleAction} />
        </div>
      </div>

      {/* Mute notification toast */}
      <MuteNotificationToast notification={muteNotification} />

      {/* Floating control bar */}
      <FloatingControlBar
        onReact={() => toast('react')}
        onChat={() => toast('Chat opening…')}
        onToggleVideo={() => { setIsVideoOn(!isVideoOn); toast(isVideoOn ? 'Video off' : 'Video on'); }}
        onToggleMic={handleToggleMic}
        chatBadge={6}
        isVideoOn={isVideoOn}
        isMicOn={isMicOn}
      />

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-3" style={{
        background: 'rgba(10,10,15,0.97)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
      }}>
        {/* Brand chyron */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="font-black" style={{ color: GOLD, fontSize: 14, letterSpacing: '0.05em' }}>SEEWHY LIVE</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Live Room</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: RED }} />
            <span className="font-bold" style={{ color: RED, fontSize: 14 }}>LIVE</span>
          </div>
        </div>

        {/* Leave + action icons */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="flex items-center justify-center px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.25)' }}>
            <LogOut className="w-4 h-4" style={{ color: RED }} />
            <span className="font-bold ml-1.5" style={{ color: RED, fontSize: 14 }}>Leave</span>
          </button>

          <div className="flex-1 flex items-center justify-center gap-2">
            {[
              { icon: MessageSquare, color: 'rgba(255,255,255,0.5)', badge: 6 },
              { icon: Heart, color: '#EF4444' },
              { icon: Hand, color: GOLD },
              { icon: DollarSign, color: GREEN },
            ].map((btn, i) => {
              const Icon = btn.icon;
              return (
                <button key={i} className="relative flex items-center justify-center rounded-full active:scale-90 transition-transform"
                  style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Icon className="w-4 h-4" style={{ color: btn.color }} />
                  {btn.badge && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold"
                      style={{ background: RED, color: '#fff', fontSize: 14 }}>
                      {btn.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}