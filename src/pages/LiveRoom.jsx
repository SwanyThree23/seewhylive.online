import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, MessageCircle, Heart, Hand, Crown,
  ChevronLeft, MoreHorizontal, Share2, Minus, Radio,
  Users, LayoutGrid, Send, X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
import TipWidget from '../components/live/TipWidget';
import ShareModal from '../components/live/ShareModal';
import DirectPayments from '../components/live/DirectPayments';
import { DollarSign } from 'lucide-react';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#FF1564';
const BG      = '#080B18';
const BG2     = '#0d0618';
const BG3     = '#110822';
const OCT     = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';
const PALETTE = ['#8B6F47','#6B7C4A','#CC7755','#4A6B7C','#7C4A6B','#5C6BC0','#26A69A','#EF6C00'];

function avatarColor(name) {
  return PALETTE[(name?.charCodeAt(0) ?? 0) % PALETTE.length];
}

// ── Demo data (replaced by real WebRTC when roomId is available) ──────────────
const DEMO_STAGE = [
  { id: 1, name: 'Joyce 🦋',   role: 'host',    speaking: true,  muted: false },
  { id: 2, name: 'SwanyThree', role: 'co-host', speaking: false, muted: false },
  { id: 3, name: 'Tom',        role: 'speaker', speaking: false, muted: true  },
  { id: 4, name: 'Yahawadah',  role: 'speaker', speaking: false, muted: false },
  { id: 5, name: 'Marvin',     role: 'speaker', speaking: false, muted: true  },
  { id: 6, name: 'Durand',     role: 'speaker', speaking: false, muted: true  },
];
const DEMO_AUDIENCE = [
  'SwanyThree','Phelo The Great','Obi Knowledg.','Marvin 10','Sim 11',
  'Phelo The Gre.','Durand 13','Joyce 14','SwanyThree 15','Obi Knowledg.',
  'Marvin 17','Sim 18','Phelo The Gre.','Durand 20',
].map((name, i) => ({ id: 100 + i, name }));
const DEMO_CHAT = [
  { id: 1, user: 'Joyce 🦋',   text: 'Welcome to the session everyone! 🎉', host: true  },
  { id: 2, user: 'SwanyThree', text: 'Thanks for joining — we go live in 2 min', host: false },
  { id: 3, user: 'Marvin',     text: 'Ready! 🔥',                            host: false },
  { id: 4, user: 'Sim 11',     text: 'Looking good on stage 👏',             host: false },
];

// ── Octagonal stage tile (speaker) ───────────────────────────────────────────
function StageTile({ p, size = 96, stream, isLocal = false, onClick }) {
  const videoRef = useRef(null);
  useEffect(() => { if (videoRef.current && stream) videoRef.current.srcObject = stream; }, [stream]);

  const isHost   = p.role === 'host';
  const isCohost = p.role === 'co-host';
  const border   = p.speaking ? GOLD
    : isHost                  ? 'rgba(212,175,55,0.45)'
    :                           'rgba(255,255,255,0.12)';

  return (
    <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={onClick}>
      <div className="relative" style={{ width: size, height: size }}>

        {/* Speaking pulse ring */}
        {p.speaking && (
          <motion.div className="absolute inset-0"
            style={{ clipPath: OCT, background: GOLD, opacity: 0.18 }}
            animate={{ opacity: [0.18, 0.44, 0.18], scale: [1, 1.06, 1] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Gold / white octagonal border */}
        <div className="absolute inset-0"
          style={{ clipPath: OCT, background: border, filter: p.speaking ? 'blur(1.5px)' : 'none', transition: 'background 0.4s' }} />

        {/* Dark content shell */}
        <div className="absolute inset-[2.5px] overflow-hidden flex items-center justify-center"
          style={{ clipPath: OCT, background: `linear-gradient(145deg, ${CRIMSON}99, ${BG2})` }}>

          {stream ? (
            <video ref={videoRef} autoPlay playsInline muted={isLocal}
              className={'absolute inset-0 w-full h-full object-cover' + (isLocal ? ' scale-x-[-1]' : '')} />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black border-2 shrink-0"
              style={{ background: avatarColor(p.name) + '55', borderColor: avatarColor(p.name), color: '#fff' }}>
              {p.name.replace(/\s+\S*$/, '').charAt(0).toUpperCase()}
            </div>
          )}

          {/* Speaking waveform bars */}
          {p.speaking && !p.muted && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center items-end gap-[2px]">
              {[3,6,4,7,3,5,4].map((h, i) => (
                <motion.div key={i} className="w-[2px] rounded-full"
                  style={{ background: GOLD, height: h }}
                  animate={{ height: [h, h * 2.8, h] }}
                  transition={{ duration: 0.38, repeat: Infinity, delay: i * 0.07 }} />
              ))}
            </div>
          )}
        </div>

        {/* Muted badge */}
        {p.muted && (
          <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
            style={{ background: '#EF4444', border: `2px solid ${BG}` }}>
            <MicOff className="w-2 h-2 text-white" />
          </div>
        )}

        {/* Crown */}
        {(isHost || isCohost) && (
          <div className="absolute -top-1 left-0 right-0 flex justify-center">
            <Crown className="w-3 h-3 drop-shadow" style={{ color: GOLD }} />
          </div>
        )}
      </div>

      {/* Name + role label */}
      <div className="text-center" style={{ maxWidth: size + 8 }}>
        <p className="text-[11px] font-bold text-white leading-none truncate">{p.name}</p>
        {(isHost || isCohost) && (
          <p className="text-[9px] mt-0.5 font-semibold" style={{ color: GOLD + 'BB' }}>
            {isHost ? 'Host' : 'Co-host'}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Small octagonal audience tile ─────────────────────────────────────────────
function AudienceTile({ p }) {
  const color = avatarColor(p.name);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 48, height: 48 }}>
        <div className="absolute inset-0"
          style={{ clipPath: OCT, background: 'rgba(255,255,255,0.07)' }} />
        <div className="absolute inset-[2px] overflow-hidden flex items-center justify-center"
          style={{ clipPath: OCT, background: `linear-gradient(135deg, #1A0F0A, ${BG2})` }}>
          <span className="text-xs font-black" style={{ color }}>
            {p.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      <p className="text-[8px] text-white/35 truncate leading-none" style={{ maxWidth: 48 }}>
        {p.name.split(' ')[0]}
      </p>
    </div>
  );
}

// ── Slide-up chat panel ────────────────────────────────────────────────────────
function ChatPanel({ messages, onClose, onSend }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function submit() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl overflow-hidden"
      style={{ height: '62vh', background: BG3, borderTop: `1px solid rgba(212,175,55,0.18)` }}
    >
      {/* Drag handle */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/15" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="text-sm font-black uppercase tracking-wide text-white"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Room Chat</span>
        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase"
          style={{ background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}44` }}>LIVE</span>
        <button onClick={onClose}><X className="w-4 h-4 text-white/40" /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.map(m => (
          <div key={m.id} className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black"
              style={{ background: avatarColor(m.user) + '44', color: avatarColor(m.user) }}>
              {m.user.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold"
                  style={{ color: m.host ? GOLD : 'rgba(255,255,255,0.55)' }}>{m.user}</span>
                {m.host && (
                  <span className="text-[7px] px-1 py-0.5 rounded font-bold uppercase"
                    style={{ background: `${GOLD}22`, color: GOLD }}>HOST</span>
                )}
              </div>
              <p className="text-[12px] text-white/80 leading-snug">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 flex gap-2 px-3 py-2.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: BG2 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Say something…"
          className="flex-1 h-9 px-3 rounded-xl text-sm text-white placeholder:text-white/25 outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <button onClick={submit}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${CRIMSON}, #A0003A)`, border: `1px solid ${GOLD}44` }}>
          <Send className="w-3.5 h-3.5" style={{ color: GOLD }} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function LiveRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId    = urlParams.get('id');

  // Real camera + peer mesh (falls back gracefully when no roomId)
  const { localStream, audioEnabled, toggleAudio } = useLocalMedia({ audio: true, video: false });
  const { remoteStreams, peerUserIds } = useWebRTCPeers(roomId, localStream);

  // Fetch real room members if roomId provided
  const { data: user }    = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: members = [] } = useQuery({
    queryKey: ['room-members', roomId],
    queryFn: () => base44.entities.WatchPartyMember.filter({ party_id: roomId, is_active: true }),
    enabled: !!roomId,
    refetchInterval: 10000,
  });
  const { data: party } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => base44.entities.WatchParty.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
  });

  // Build stage from real members or demo data
  const stage = roomId && members.length > 0
    ? members.slice(0, 20).map((m, i) => ({
        id:       m.id,
        name:     m.user_name || 'Guest',
        role:     m.user_id === party?.host_id ? 'host' : m.role || 'speaker',
        speaking: false,
        muted:    m.is_audio_enabled === false,
      }))
    : DEMO_STAGE;

  const audience = roomId && members.length > 6
    ? members.slice(6).map(m => ({ id: m.id, name: m.user_name || 'Viewer' }))
    : DEMO_AUDIENCE;

  const roomTitle  = party?.title || (roomId ? 'Live Room' : 'Demo Room');
  const hostName   = party ? (members.find(m => m.user_id === party.host_id)?.user_name || 'Host') : 'SwanyThree';
  const liveCount  = members.length || 20;
  const isLive     = !roomId || members.length > 0 || (remoteStreams?.size ?? 0) > 0;

  // Local UI state
  const [stageData, setStageData]   = useState(stage);
  const [spotlit, setSpotlit]       = useState(null);
  const [chatOpen, setChatOpen]     = useState(false);
  const [chatMsgs, setChatMsgs]     = useState(DEMO_CHAT);
  const [unread, setUnread]         = useState(0);
  const [liked, setLiked]           = useState(false);
  const [likeCount, setLikeCount]   = useState(3);
  const [handRaised, setHandRaised] = useState(false);
  const [shareOpen, setShareOpen]   = useState(false);
  const [payOpen, setPayOpen]       = useState(false);

  // Sync stage when real data arrives
  useEffect(() => { if (stage.length) setStageData(stage); }, [members]);

  // Simulate rotating speaker in demo mode
  useEffect(() => {
    if (roomId) return;
    let idx = 0;
    const t = setInterval(() => {
      idx = (idx + 1) % DEMO_STAGE.length;
      setStageData(prev => prev.map((s, i) => ({ ...s, speaking: i === idx && !s.muted })));
    }, 4500);
    return () => clearInterval(t);
  }, [roomId]);

  const activeSpeaker = stageData.find(s => s.speaking);
  const stageCols = stageData.length <= 4 ? 2 : stageData.length <= 9 ? 3 : 4;
  const tileSize = stageCols === 2 ? 120 : stageCols === 3 ? 88 : 72;

  function resolveStream(memberId, userId) {
    if (userId === user?.id) return { stream: localStream, isLocal: true };
    const peerId = Array.from((peerUserIds || new Map()).entries()).find(([, uid]) => uid === userId)?.[0];
    return { stream: peerId ? remoteStreams?.get(peerId) : null, isLocal: false };
  }

  // Real-time member roster sync
  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.WatchPartyMember.subscribe((event) => {
      if (event.data?.party_id !== roomId) return;
      // queryClient not available here — data refetches on interval
    });
    return unsub;
  }, [roomId]);

  function openChat()  { setChatOpen(true); setUnread(0); }
  function sendChat(t) { setChatMsgs(p => [...p, { id: Date.now(), user: user?.full_name || 'You', text: t, host: false }]); }
  function handleLike() { setLiked(l => !l); setLikeCount(c => liked ? c - 1 : c + 1); }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: BG, fontFamily: 'Barlow Condensed, sans-serif' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)' }}
          onClick={() => history.back()}>
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <MessageCircle className="w-3 h-3 text-white/40" />
        </div>
        <h1 className="flex-1 text-sm font-bold text-white truncate">{roomTitle}</h1>
        <button className="w-7 h-7 flex items-center justify-center">
          <MoreHorizontal className="w-4 h-4 text-white/40" />
        </button>
        <button className="w-7 h-7 flex items-center justify-center" onClick={() => setShareOpen(true)}>
          <Share2 className="w-4 h-4 text-white/40" />
        </button>
        <button className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <Minus className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 88 }}>

        {/* Room meta row */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-3 flex-wrap">
          {/* Host */}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
              style={{ background: avatarColor(hostName) + '55', color: avatarColor(hostName), border: `1.5px solid ${avatarColor(hostName)}` }}>
              {hostName.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-white/60">{hostName}</span>
          </div>
          {/* Counts */}
          <div className="flex items-center gap-2 text-[10px] text-white/35">
            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{liveCount}</span>
            <span>•</span>
            <span>{liveCount} here now</span>
          </div>
          {/* Active speaker */}
          {activeSpeaker && (
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black"
                style={{ background: avatarColor(activeSpeaker.name) + '55', color: avatarColor(activeSpeaker.name) }}>
                {activeSpeaker.name.charAt(0)}
              </div>
              <span className="text-[10px] text-white/40">{activeSpeaker.name.split(' ')[0]} is speaking</span>
            </div>
          )}
        </div>

        {/* LIVE + SeeWhy badge row */}
        <div className="px-4 pb-3 flex items-center gap-2">
          {isLive ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: `${PINK}1A`, border: `1px solid ${PINK}44` }}>
              <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: PINK }}
                animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
              <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: PINK }}>Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }} />
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Waiting to go live</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Radio className="w-2.5 h-2.5" style={{ color: GOLD }} />
            <span className="text-[9px] font-semibold" style={{ color: GOLD }}>SeeWhy LIVE</span>
          </div>
        </div>

        {/* ── Stage header ─────────────────────────────────────────────────── */}
        <div className="px-4 mb-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[17px] font-black text-white">Stage</span>
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {stageData.length}/20
            </span>
          </div>
          <button
            onClick={() => setSpotlit(null)}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <LayoutGrid className="w-3.5 h-3.5 text-white/40" />
          </button>
        </div>

        {/* ── Stage grid ────────────────────────────────────────────────────── */}
        <div className="px-3 mb-5">
          {spotlit ? (
            /* Spotlight mode */
            <div className="space-y-4">
              <div className="flex justify-center py-3">
                <StageTile p={spotlit} size={170} onClick={() => setSpotlit(null)} />
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 px-1">
                {stageData.filter(s => s.id !== spotlit.id).map(p => (
                  <div key={p.id} className="shrink-0">
                    <StageTile p={p} size={72} onClick={() => setSpotlit(p)} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${stageCols}, 1fr)` }}>
              <AnimatePresence>
                {stageData.map(p => {
                  const { stream, isLocal } = resolveStream(p.id, p.userId);
                  return (
                    <motion.div key={p.id} layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex justify-center">
                      <StageTile p={p} size={tileSize} stream={stream} isLocal={isLocal}
                        onClick={() => setSpotlit(p)} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── Audience section ──────────────────────────────────────────────── */}
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Others in the Room
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <Users className="w-3 h-3" />
              <span className="text-[10px]">{audience.length}</span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-x-2 gap-y-3">
            {audience.map(p => (
              <div key={p.id} className="flex justify-center">
                <AudienceTile p={p} />
              </div>
            ))}
          </div>
        </div>

        {/* ── App shortcut carousel ─────────────────────────────────────────── */}
        <div className="px-3 pb-3">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[
              { label: 'Auction',      icon: '🏆', bg: 'rgba(212,175,55,0.08)'  },
              { label: 'Destinations', icon: '📍', bg: 'rgba(0,200,200,0.06)'   },
              { label: 'AI Trip',      icon: '🤖', bg: 'rgba(139,92,246,0.08)'  },
              { label: 'Pay',          icon: '💸', bg: 'rgba(255,21,100,0.08)', action: () => setPayOpen(true) },
              { label: 'Battle',       icon: '⚔️', bg: 'rgba(212,175,55,0.08)'  },
              { label: 'QR Code',      icon: '📱', bg: 'rgba(255,255,255,0.04)' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                onClick={s.action}
                style={{ userSelect: 'none' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                  style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
                  {s.icon}
                </div>
                <span className="text-[8px] text-white/30">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fixed bottom toolbar ──────────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: `linear-gradient(to top, ${BG} 70%, ${BG}00)`, backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Leave */}
        <button className="text-[13px] font-black uppercase tracking-wide" style={{ color: PINK }}>
          Leave room
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-3">

          {/* Chat */}
          <button onClick={openChat} className="relative flex flex-col items-center gap-0.5">
            <div className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: chatOpen ? `${GOLD}15` : 'rgba(255,255,255,0.07)', border: chatOpen ? `1px solid ${GOLD}44` : '1px solid rgba(255,255,255,0.1)' }}>
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            {unread > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                style={{ background: PINK, color: '#fff' }}>{unread}</div>
            )}
            <span className="text-[8px] text-white/35">Chat</span>
          </button>

          {/* Heart */}
          <button onClick={handleLike} className="flex flex-col items-center gap-0.5">
            <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
              style={{ background: liked ? `${PINK}1A` : 'rgba(255,255,255,0.07)', border: liked ? `1px solid ${PINK}55` : '1px solid rgba(255,255,255,0.1)' }}>
              <Heart className="w-4 h-4 transition-all"
                style={{ color: liked ? PINK : 'rgba(255,255,255,0.6)', fill: liked ? PINK : 'none' }} />
            </div>
            <span className="text-[8px]" style={{ color: liked ? PINK : 'rgba(255,255,255,0.35)' }}>{likeCount}</span>
          </button>

          {/* Hand raise */}
          <button onClick={() => setHandRaised(h => !h)} className="flex flex-col items-center gap-0.5">
            <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
              style={{ background: handRaised ? `${GOLD}1A` : 'rgba(255,255,255,0.07)', border: handRaised ? `1px solid ${GOLD}55` : '1px solid rgba(255,255,255,0.1)' }}>
              <Hand className="w-4 h-4 transition-all" style={{ color: handRaised ? GOLD : 'rgba(255,255,255,0.6)' }} />
            </div>
            <span className="text-[8px] text-white/35"> </span>
          </button>

          {/* Tip */}
          {party && (
            <div className="flex flex-col items-center gap-0.5">
              <TipWidget roomId={roomId} hostId={party?.host_id} currentUser={user} />
              <span className="text-[8px] text-white/35">Tip</span>
            </div>
          )}

          {/* Mic */}
          <button onClick={toggleAudio} className="flex flex-col items-center gap-0.5">
            <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
              style={{ background: !audioEnabled ? 'rgba(239,68,68,0.15)' : `${GOLD}1A`, border: !audioEnabled ? '1px solid rgba(239,68,68,0.4)' : `1px solid ${GOLD}55` }}>
              {!audioEnabled
                ? <MicOff className="w-4 h-4 text-red-400" />
                : <Mic className="w-4 h-4" style={{ color: GOLD }} />}
            </div>
            <span className="text-[8px] text-white/35"> </span>
          </button>
        </div>
      </div>

      {/* ── Chat panel overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.55)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)} />
            <ChatPanel messages={chatMsgs} onClose={() => setChatOpen(false)} onSend={sendChat} />
          </>
        )}
      </AnimatePresence>

      {/* Share modal */}
      <AnimatePresence>
        {shareOpen && (
          <ShareModal
            isOpen={shareOpen}
            onClose={() => setShareOpen(false)}
            url={`${window.location.origin}/LiveRoom?id=${roomId || 'demo'}`}
            title={roomTitle}
          />
        )}
      </AnimatePresence>

      {/* Direct payments sheet */}
      <AnimatePresence>
        {payOpen && (
          <DirectPayments
            isOpen={payOpen}
            onClose={() => setPayOpen(false)}
            creatorName={hostName}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
