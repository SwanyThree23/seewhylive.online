import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Video, Mic, MicOff, VideoOff, CheckCircle, Clock, AlertCircle, Wifi, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import StreamGoals from '../components/live/StreamGoals';
import GreenroomWaitlistPanel from '../components/greenroom/GreenroomWaitlistPanel';
import GuestConnector from '../components/live/GuestConnector';
import WebRTCSetupBanner from '../components/live/WebRTCSetupBanner';
import GuestDestinationsPanel from '../components/live/GuestDestinationsPanel';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import GuestLandingPanel from '../components/streaming/GuestLandingPanel';
import GuestLandingPageV49 from '../components/streaming/GuestLandingPageV49';
import AgeGate from '../components/AgeGate';
import { getStoredAge } from '@/lib/ageVerification';
import DevicePreview from '../components/greenroom/DevicePreview';
import OctagonalVideoWindow from '../components/live/OctagonalVideoWindow';
import PreStreamCountdown from '../components/live/PreStreamCountdown';
import VdoNinjaGuestLink from '../components/live/VdoNinjaGuestLink';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

export default function GuestJoin() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room') || urlParams.get('id');
  const inviteToken = urlParams.get('token');

  const [ageVerified, setAgeVerified] = useState(() => { const a = getStoredAge(); return a !== null && a >= 18; });
  const [name, setName] = useState('');
  const [participantId, setParticipantId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [readyState, setReadyState] = useState(false);
  const [waitingTooLong, setWaitingTooLong] = useState(false);

  // Real local camera via singleton cache — permission granted here carries
  // forward into LiveRoom without a second getUserMedia prompt.
  const { localStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo, error: mediaError } = useLocalMedia({ audio: true, video: true });

  const { data: room } = useQuery({
    queryKey: ['guestRoom', roomId],
    queryFn: () => base44.entities.Room.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
    retry: 2,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  useEffect(() => {
    if (user?.full_name && !name) setName(user.full_name);
  }, [user]);

  useEffect(() => {
    if (!participantId) return;
    const unsub = base44.entities.Participant.subscribe((event) => {
      if (event.id !== participantId && event.data?.id !== participantId) return;
      const newStatus = event.data?.status;
      if (newStatus === 'admitted') { setStatus('admitted'); toast.success("🎙️ You've been admitted to the stage!"); }
      else if (newStatus === 'rejected') { setStatus('rejected'); toast.error('You were removed from the queue'); }
    });
    const waitTimeout = setTimeout(() => setWaitingTooLong(true), 5 * 60 * 1000);
    return () => { unsub(); clearTimeout(waitTimeout); };
  }, [participantId]);

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Please enter your name');
      return base44.entities.Participant.create({
        room_id: roomId,
        user_id: user?.id || `guest_${Date.now()}`,
        user_name: name.trim(),
        user_avatar: user?.avatar_url || '',
        role: 'guest',
        status: 'waiting',
        is_audio_enabled: true,
        is_video_enabled: true,
        is_streaming: false,
      });
    },
    onSuccess: (p) => { setParticipantId(p.id); setStatus('waiting'); toast.success('Joined greenroom! Waiting for the director…'); },
    onError: () => toast.error('Failed to join. Please try again.'),
  });

  const toggleReadyMutation = useMutation({
    mutationFn: async (ready) => {
      if (!participantId) return;
      return base44.entities.Participant.update(participantId, { status: ready ? 'ready' : 'waiting' });
    },
    onSuccess: (_, ready) => { setReadyState(ready); toast.success(ready ? '✅ Marked as ready!' : 'Status set to waiting'); },
    onError: () => toast.error('Failed to update status.'),
  });

  // If arriving via invite link, show the enhanced landing panel
  if (inviteToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#080B18' }}>
        <div className="w-full max-w-sm rounded-2xl" style={{ background: 'rgba(13,6,24,0.98)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <GuestLandingPanel
            token={inviteToken}
            roomId={roomId}
            onJoin={({ name }) => {
              toast.success(`Welcome, ${name}! Waiting for host to admit you.`);
            }}
          />
        </div>
      </div>
    );
  }

  const card = { background: 'rgba(8,11,24,0.98)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, padding: 20 };

  // Age gate — required for all entry paths
  if (!ageVerified) {
    return (
      <AgeGate
        minAge={18}
        feature="join a live room"
        onPass={() => setAgeVerified(true)}
        onSkip={() => setAgeVerified(true)}
        overlay={true}
      />
    );
  }

  // Token-based invite: show richer pre-join panel
  if (inviteToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0d0618', fontFamily: 'Barlow Condensed, sans-serif' }}>
        <div className="w-full max-w-sm">
          <GuestLandingPanel
            token={inviteToken}
            roomId={roomId}
            onJoin={() => {
              if (roomId) window.location.href = createPageUrl('LiveRoom') + '?id=' + roomId;
            }}
          />
        </div>
        <SwanyBotWidget />
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#080B18' }}>
        <div style={{ ...card, maxWidth: 360, width: '100%', textAlign: 'center' }}>
          <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#C0392B' }} />
          <h2 className="text-lg font-black mb-1" style={{ ...T, color: GOLD }}>Invalid Link</h2>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>No room ID found. Ask your host for the correct join link.</p>
          <Link to={createPageUrl('Home')}>
            <button className="px-6 py-2 rounded-xl font-black uppercase text-xs"
              style={{ ...T, background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer' }}>
              Go Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#080B18', fontFamily: 'Barlow Condensed, sans-serif' }}>
      <div className="w-full max-w-md space-y-4">
        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})` }}>
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black" style={{ color: GOLD }}>SeeWhy LIVE</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Guest Greenroom</p>
        </div>

        {/* Room info */}
        {room && (
          <div style={{ ...card, padding: 14 }}>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full"
                style={{ background: room.status === 'live' ? '#C0392B' : '#D4AF37', animation: room.status === 'live' ? 'pulse 1.5s infinite' : 'none' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate" style={T}>{room.title}</p>
                <p className="text-[10px] capitalize" style={{ color: 'rgba(255,255,255,0.35)' }}>{room.status}</p>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase"
                style={{ ...T, background: room.status === 'live' ? 'rgba(192,57,43,0.15)' : 'rgba(212,175,55,0.12)', border: `1px solid ${room.status === 'live' ? 'rgba(192,57,43,0.4)' : 'rgba(212,175,55,0.3)'}`, color: room.status === 'live' ? '#C0392B' : '#D4AF37' }}>
                {room.status === 'live' ? '● LIVE' : 'Scheduled'}
              </span>
            </div>
          </div>
        )}

        {/* State machine */}
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={card}>
                <h2 className="text-base font-black mb-1" style={{ ...T, color: GOLD }}>Join the Greenroom</h2>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Enter your name to request to go on stage</p>
                <input
                  placeholder="Your display name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && name.trim() && setStatus('device-check')}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 12 }}
                />
                <button
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black uppercase text-xs"
                  onClick={() => name.trim() && setStatus('device-check')}
                  disabled={!name.trim()}
                  style={{ ...T, background: !name.trim() ? 'rgba(212,175,55,0.2)' : GOLD, border: 'none', color: !name.trim() ? 'rgba(255,255,255,0.3)' : '#000', cursor: !name.trim() ? 'default' : 'pointer' }}>
                  <Radio className="w-4 h-4" />
                  Check Camera &amp; Join
                </button>
              </div>
            </motion.div>
          )}

          {status === 'device-check' && (
            <GuestLandingPageV49
              key="device-check"
              guestName={name}
              roomId={roomId}
              onProceed={() => joinMutation.mutate()}
              onBack={() => setStatus('idle')}
            />
          )}

          {status === 'waiting' && (
            <motion.div key="waiting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ ...card, borderColor: 'rgba(212,175,55,0.3)' }}>
                <div className="text-center space-y-2 mb-4">
                  <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-xl font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})` }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-base font-black text-white" style={T}>{name}</h2>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full uppercase ${readyState ? '' : 'animate-pulse'}`}
                    style={{ ...T, background: readyState ? 'rgba(109,191,126,0.12)' : 'rgba(255,200,0,0.12)', border: `1px solid ${readyState ? 'rgba(109,191,126,0.3)' : 'rgba(255,200,0,0.3)'}`, color: readyState ? '#6DBF7E' : '#ffc800' }}>
                    {readyState ? <><CheckCircle className="w-2.5 h-2.5" /> Ready</> : <><Clock className="w-2.5 h-2.5" /> Waiting</>}
                  </span>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {readyState ? 'The director will admit you shortly' : "Mark yourself as ready when you're set up"}
                  </p>
                  {waitingTooLong && (
                    <p className="text-[10px] mt-1 px-2 py-1.5 rounded-lg" style={{ color: '#D4854A', background: 'rgba(212,133,74,0.08)', border: '1px solid rgba(212,133,74,0.2)' }}>
                      Still waiting after 5 min — the host may not be monitoring the queue right now. Try messaging them directly.
                    </p>
                  )}
                </div>

                <button
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-black uppercase text-xs mb-3"
                  onClick={() => toggleReadyMutation.mutate(!readyState)}
                  disabled={toggleReadyMutation.isPending}
                  style={{ ...T, background: readyState ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${readyState ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.1)'}`, color: readyState ? GOLD : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {readyState ? "I'm Ready ✓" : 'Mark as Ready'}
                </button>

                <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Connection Tips</p>
                  {[
                    { icon: Mic, text: 'Check your microphone in browser settings' },
                    { icon: Video, text: 'Allow camera access when prompted' },
                    { icon: Wifi, text: 'Use a stable WiFi or wired connection' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <Icon className="w-3 h-3 shrink-0" style={{ color: GOLD }} />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {status === 'admitted' && (
            <motion.div key="admitted" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ ...card, borderColor: 'rgba(109,191,126,0.35)', textAlign: 'center' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3"
                  style={{ background: 'rgba(109,191,126,0.12)', border: '2px solid rgba(109,191,126,0.5)' }}>
                  <CheckCircle className="w-8 h-8" style={{ color: '#6DBF7E' }} />
                </motion.div>
                <h2 className="text-xl font-black mb-1" style={{ ...T, color: '#6DBF7E' }}>You're Live!</h2>
                <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>The director has admitted you to the stage</p>
                <Link to={`${createPageUrl('LiveRoom')}?id=${roomId}`}>
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black uppercase text-xs"
                    style={{ ...T, background: 'rgba(109,191,126,0.15)', border: '1px solid rgba(109,191,126,0.4)', color: '#6DBF7E', cursor: 'pointer' }}>
                    <Radio className="w-4 h-4 animate-pulse" />
                    Enter the Live Room
                  </button>
                </Link>
              </div>
            </motion.div>
          )}

          {status === 'rejected' && (
            <motion.div key="rejected" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ ...card, borderColor: 'rgba(192,57,43,0.3)', textAlign: 'center' }}>
                <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: '#C0392B' }} />
                <h2 className="text-lg font-black mb-1" style={{ ...T, color: '#C0392B' }}>Removed from Queue</h2>
                <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>The director has removed you from the stage queue.</p>
                <button
                  className="w-full py-2 rounded-xl font-black uppercase text-xs"
                  onClick={() => { setStatus('idle'); setParticipantId(null); setReadyState(false); }}
                  style={{ ...T, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Device camera/mic preview */}
        <div style={{ marginTop: 8 }}>
          <DevicePreview />
        </div>

        {/* Waitlist panel when waiting */}
        {status === 'waiting' && roomId && (
          <div style={{ marginTop: 8 }}>
            <GreenroomWaitlistPanel roomId={roomId} currentUser={user} />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <GuestConnector roomId={roomId || null} roomName="SeeWhy Studio" />
          <WebRTCSetupBanner error={null} audioEnabled={true} videoEnabled={true} onRetry={() => {}} />
          <VdoNinjaGuestLink roomId={roomId || null} guestName={user?.full_name || 'Guest'} />
          <OctagonalVideoWindow stream={localStream} label={user?.full_name || 'You'} isHost={false} isMuted={false} />
          <OnlineUsersGrid compact maxVisible={8} />
          <ContentRecommendations />
          <StreamGoals isHost={false} />
          {user && <PreStreamCountdown room={room || null} currentUser={user} onGoLive={() => {}} />}
        </div>

        <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
          SeeWhy LIVE by Domino Entertainment / SwanyThree AI
        </p>
      </div>
    </div>
  );
}