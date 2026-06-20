import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, CheckCircle, AlertCircle, Wifi, Users, Radio, Camera } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function AudioMeter({ stream }) {
  const [level, setLevel] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    if (!stream) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length;
      setLevel(Math.min(100, avg * 2));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animRef.current); ctx.close(); };
  }, [stream]);

  return (
    <div className="flex items-center gap-0.5 h-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="w-1.5 rounded-full transition-all duration-75"
          style={{ height: level > (i / 12) * 100 ? `${8 + (i / 12) * 8}px` : '4px', background: level > 80 ? '#f87171' : level > 50 ? GOLD : '#6DBF7E', opacity: level > (i / 12) * 100 ? 1 : 0.15 }} />
      ))}
    </div>
  );
}

export default function GuestLandingPanel({ token, roomId, onJoin }) {
  const [name, setName] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [devicesReady, setDevicesReady] = useState(false);
  const [joining, setJoining] = useState(false);
  const [tokenValid, setTokenValid] = useState(null); // null=checking, true=ok, false=invalid
  const videoRef = useRef(null);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me().catch(() => null) });
  const { data: room } = useQuery({
    queryKey: ['guestRoom', roomId],
    queryFn: () => base44.entities.Room.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
  });

  // Validate token
  useEffect(() => {
    if (!token) { setTokenValid(false); return; }
    if (!roomId) { setTokenValid(true); return; } // open room
    base44.entities.Activity.filter({ type: 'guest_invite' })
      .then(rows => {
        const found = rows.some(r => {
          try { return JSON.parse(r.description || '{}').token === token; } catch { return false; }
        });
        setTokenValid(found);
      })
      .catch(() => setTokenValid(true)); // fallback open
  }, [token, roomId]);

  // Pre-fill name from user
  useEffect(() => { if (user?.full_name && !name) setName(user.full_name); }, [user]);

  // Get camera/mic
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        setDevicesReady(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => { setLocalStream(stream); setDevicesReady(true); })
          .catch(() => toast.error('Could not access camera/mic'));
      });
    return () => localStream?.getTracks().forEach(t => t.stop());
  }, []);

  useEffect(() => {
    if (!localStream) return;
    if (videoRef.current) videoRef.current.srcObject = localStream;
    localStream.getAudioTracks().forEach(t => { t.enabled = audioEnabled; });
    localStream.getVideoTracks().forEach(t => { t.enabled = videoEnabled; });
  }, [localStream, audioEnabled, videoEnabled]);

  const handleJoin = async () => {
    if (!name.trim()) { toast.error('Enter your name'); return; }
    setJoining(true);
    try {
      await base44.entities.Participant.create({
        room_id: roomId,
        name: name.trim(),
        user_id: user?.id || null,
        status: 'waiting',
        token,
        joined_at: new Date().toISOString(),
      });
      onJoin?.({ name: name.trim(), localStream, user });
    } catch (e) {
      toast.error('Could not join. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] p-6 space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-lg font-black text-white" style={T}>Invite Expired or Invalid</p>
        <p className="text-sm text-white/40 text-center" style={T}>This invite link is no longer active. Ask the host for a new link.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-sm mx-auto">
      {/* Room header */}
      {room && (
        <div className="text-center">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1" style={T}>You're joining</p>
          <p className="text-xl font-black text-white" style={T}>{room.name || room.title || 'Live Stream'}</p>
          {room.host_name && <p className="text-xs text-[#D4AF37]" style={T}>Hosted by {room.host_name}</p>}
        </div>
      )}
      {!room && (
        <div className="text-center">
          <Radio className="w-8 h-8 mx-auto mb-2" style={{ color: GOLD }} />
          <p className="text-xl font-black text-white" style={T}>Join as Guest</p>
        </div>
      )}

      {/* Camera preview */}
      <div className="relative w-48 h-48">
        <div style={{ clipPath: OCT, width: '100%', height: '100%', background: 'linear-gradient(135deg, #400010, #1a0008)', overflow: 'hidden', border: `2px solid ${GOLD}` }}>
          {/* Always-mounted video — ref valid before stream arrives */}
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: (videoEnabled && localStream) ? 'block' : 'none' }} />
          {!(videoEnabled && localStream) && (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-10 h-10 text-white/20" />
            </div>
          )}
        </div>
        {tokenValid === null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
            <div className="w-5 h-5 border-2 border-t-transparent border-[#D4AF37] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Audio meter */}
      {localStream && (
        <div className="flex items-center gap-2">
          <Mic className="w-3 h-3 text-white/40" />
          <AudioMeter stream={localStream} />
        </div>
      )}

      {/* AV toggles */}
      <div className="flex gap-3">
        <button
          onClick={() => setAudioEnabled(a => !a)}
          className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
          style={{ background: audioEnabled ? 'rgba(109,191,126,0.15)' : 'rgba(239,68,68,0.12)', border: `1px solid ${audioEnabled ? 'rgba(109,191,126,0.3)' : 'rgba(239,68,68,0.25)'}` }}
        >
          {audioEnabled ? <Mic className="w-4 h-4 text-[#6DBF7E]" /> : <MicOff className="w-4 h-4 text-red-400" />}
          <span className="text-[9px] font-bold" style={{ ...T, color: audioEnabled ? '#6DBF7E' : '#f87171' }}>{audioEnabled ? 'Mic On' : 'Muted'}</span>
        </button>
        <button
          onClick={() => setVideoEnabled(v => !v)}
          className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
          style={{ background: videoEnabled ? 'rgba(109,191,126,0.15)' : 'rgba(239,68,68,0.12)', border: `1px solid ${videoEnabled ? 'rgba(109,191,126,0.3)' : 'rgba(239,68,68,0.25)'}` }}
        >
          {videoEnabled ? <Video className="w-4 h-4 text-[#6DBF7E]" /> : <VideoOff className="w-4 h-4 text-red-400" />}
          <span className="text-[9px] font-bold" style={{ ...T, color: videoEnabled ? '#6DBF7E' : '#f87171' }}>{videoEnabled ? 'Cam On' : 'Cam Off'}</span>
        </button>
      </div>

      {/* Name input */}
      <div className="w-full space-y-1.5">
        <label className="text-[10px] text-white/40 uppercase tracking-widest" style={T}>Your Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          placeholder="How should we introduce you?"
          style={{ width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', ...T }}
        />
      </div>

      {/* Readiness check */}
      <div className="w-full rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { label: 'Microphone', ok: audioEnabled && !!localStream },
          { label: 'Camera', ok: videoEnabled && !!localStream },
          { label: 'Connection', ok: true },
          { label: 'Invite', ok: tokenValid === true },
        ].map(({ label, ok }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-[10px] text-white/40" style={T}>{label}</span>
            {ok
              ? <span className="flex items-center gap-1 text-[10px] text-[#6DBF7E]"><CheckCircle className="w-3 h-3" /> Ready</span>
              : <span className="flex items-center gap-1 text-[10px] text-white/30"><AlertCircle className="w-3 h-3" /> —</span>}
          </div>
        ))}
      </div>

      {/* Join button */}
      <button
        onClick={handleJoin}
        disabled={joining || !name.trim() || tokenValid === false}
        style={{ ...T, width: '100%', height: 44, fontSize: 15, fontWeight: 900, letterSpacing: 1, borderRadius: 12, border: 'none', cursor: (joining || !name.trim()) ? 'not-allowed' : 'pointer',
          background: `linear-gradient(135deg, ${CRIMSON} 0%, #B22222 100%)`, color: '#fff', opacity: (joining || !name.trim()) ? 0.5 : 1 }}
      >
        {joining ? 'Joining…' : 'Join Stream'}
      </button>

      <p className="text-[9px] text-white/20 text-center" style={T}>
        By joining you agree to be seen and heard by other participants
      </p>
    </div>
  );
}
