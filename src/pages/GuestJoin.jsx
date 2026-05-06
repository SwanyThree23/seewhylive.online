import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Radio, Video, Mic, MicOff, VideoOff, CheckCircle, Clock, AlertCircle, Wifi, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

/**
 * GuestJoin — mobile-friendly onboarding page for guests.
 * URL: /GuestJoin?room=<roomId>
 * 
 * Flow:
 *  1. Guest enters name
 *  2. Joins greenroom (creates Participant record with status='waiting')
 *  3. Director sees them in GreenroomQueue in real-time
 *  4. Guest polls for status update → when 'admitted', shows "You're Live!"
 */
export default function GuestJoin() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room') || urlParams.get('id');

  const [name, setName] = useState('');
  const [participantId, setParticipantId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | joining | waiting | admitted | rejected
  const [readyState, setReadyState] = useState(false);

  // Fetch room info
  const { data: room } = useQuery({
    queryKey: ['guestRoom', roomId],
    queryFn: () => base44.entities.Room.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
    retry: 2,
  });

  // Try to get current user (optional — guest may not be logged in)
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  // Prefill name from user
  useEffect(() => {
    if (user?.full_name && !name) setName(user.full_name);
  }, [user]);

  // Real-time subscription to our own participant record
  useEffect(() => {
    if (!participantId) return;
    const unsub = base44.entities.Participant.subscribe((event) => {
      if (event.id !== participantId && event.data?.id !== participantId) return;
      const newStatus = event.data?.status;
      if (newStatus === 'admitted') {
        setStatus('admitted');
        toast.success('🎙️ You\'ve been admitted to the stage!');
      } else if (newStatus === 'rejected') {
        setStatus('rejected');
        toast.error('You were removed from the queue');
      }
    });
    return unsub;
  }, [participantId]);

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Please enter your name');
      const participant = await base44.entities.Participant.create({
        room_id: roomId,
        user_id: user?.id || `guest_${Date.now()}`,
        user_name: name.trim(),
        user_avatar: user?.avatar_url || '',
        role: 'guest',
        status: 'waiting',
        is_audio_enabled: true,
        is_video_enabled: false,
        is_streaming: false,
      });
      return participant;
    },
    onSuccess: (p) => {
      setParticipantId(p.id);
      setStatus('waiting');
      toast.success('Joined greenroom! Waiting for the director...');
    },
    onError: (e) => toast.error(e.message || 'Failed to join'),
  });

  const toggleReadyMutation = useMutation({
    mutationFn: async (ready) => {
      if (!participantId) return;
      return base44.entities.Participant.update(participantId, {
        status: ready ? 'ready' : 'waiting',
      });
    },
    onSuccess: (_, ready) => {
      setReadyState(ready);
      toast.success(ready ? '✅ Marked as ready!' : 'Status set to waiting');
    },
  });

  if (!roomId) {
    return (
      <div className="min-h-screen bg-[#0d0618] flex items-center justify-center p-4">
        <Card className="bg-[#1a0d2e] border-[#800020]/30 text-white max-w-sm w-full">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <h2 className="text-lg font-bold text-[#d4af37]">Invalid Link</h2>
            <p className="text-sm text-white/50">No room ID found. Ask your host for the correct join link.</p>
            <Link to={createPageUrl('Home')}>
              <Button className="bg-[#800020] hover:bg-[#9a0025] text-white">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0618] flex items-center justify-center p-4"
      style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="w-full max-w-md space-y-4">
        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#800020] to-[#d4af37] flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[#d4af37]">SeeWhy LIVE</span>
          </div>
          <p className="text-white/40 text-sm">Guest Greenroom</p>
        </div>

        {/* Room card */}
        {room && (
          <Card className="bg-[#1a0d2e] border-[#d4af37]/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${room.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{room.title}</p>
                <p className="text-[10px] text-white/40 capitalize">{room.status}</p>
              </div>
              <Badge className={room.status === 'live' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-black'}>
                {room.status === 'live' ? '● LIVE' : 'Scheduled'}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Main state machine */}
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="bg-[#1a0d2e] border-[#800020]/30">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-[#d4af37] mb-1">Join the Greenroom</h2>
                    <p className="text-xs text-white/40">Enter your name to request to go on stage</p>
                  </div>
                  <Input
                    placeholder="Your display name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && name.trim() && joinMutation.mutate()}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  <Button
                    className="w-full bg-[#d4af37] hover:bg-[#f5e6a3] text-black font-bold"
                    onClick={() => joinMutation.mutate()}
                    disabled={!name.trim() || joinMutation.isPending}
                  >
                    <Radio className="w-4 h-4 mr-2" />
                    {joinMutation.isPending ? 'Joining…' : 'Join Greenroom'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {status === 'waiting' && (
            <motion.div key="waiting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="bg-[#1a0d2e] border-[#d4af37]/30">
                <CardContent className="p-5 space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#800020] to-[#d4af37] flex items-center justify-center text-xl font-bold text-white">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-base font-bold text-white">{name}</h2>
                    <div className="flex items-center justify-center gap-2">
                      {readyState ? (
                        <Badge className="bg-green-700 text-white gap-1">
                          <CheckCircle className="w-3 h-3" /> Ready
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-700 text-white gap-1 animate-pulse">
                          <Clock className="w-3 h-3" /> Waiting
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-white/40">
                      {readyState
                        ? 'The director will admit you shortly'
                        : 'Mark yourself as ready when you\'re set up'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className={`flex-1 border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 ${readyState ? 'bg-[#d4af37]/10' : ''}`}
                      onClick={() => toggleReadyMutation.mutate(!readyState)}
                      disabled={toggleReadyMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {readyState ? 'I\'m Ready ✓' : 'Mark as Ready'}
                    </Button>
                  </div>

                  {/* Tech check */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Connection Tips</p>
                    <div className="space-y-1.5">
                      {[
                        { icon: Mic, text: 'Check your microphone in browser settings' },
                        { icon: Video, text: 'Allow camera access when prompted' },
                        { icon: Wifi, text: 'Use a stable WiFi or wired connection' },
                      ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-2 text-[10px] text-white/50">
                          <Icon className="w-3 h-3 shrink-0 text-[#d4af37]" />
                          {text}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {status === 'admitted' && (
            <motion.div key="admitted" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="bg-[#1a0d2e] border-green-500/40">
                <CardContent className="p-6 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="w-16 h-16 mx-auto rounded-full bg-green-700/30 border-2 border-green-500 flex items-center justify-center"
                  >
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold text-green-400">You're Live!</h2>
                    <p className="text-sm text-white/50 mt-1">The director has admitted you to the stage</p>
                  </div>
                  <Link to={`${createPageUrl('LiveRoom')}?id=${roomId}`}>
                    <Button className="w-full bg-green-700 hover:bg-green-600 text-white font-bold">
                      <Radio className="w-4 h-4 mr-2 animate-pulse" />
                      Enter the Live Room
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {status === 'rejected' && (
            <motion.div key="rejected" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="bg-[#1a0d2e] border-red-500/30">
                <CardContent className="p-6 text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                  <div>
                    <h2 className="text-lg font-bold text-red-400">Removed from Queue</h2>
                    <p className="text-sm text-white/40 mt-1">The director has removed you from the stage queue.</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-white/10 text-white/60"
                    onClick={() => { setStatus('idle'); setParticipantId(null); setReadyState(false); }}
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-center text-[10px] text-white/20">
          SeeWhy LIVE by Domino Entertainment / SwanyThree AI
        </p>
      </div>
    </div>
  );
}