import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Users,
  Radio, LogOut, Copy, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, Swords, Monitor,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
import PanelGrid from '../components/watchparty/PanelGrid';
import BattleTiers from '../components/watchparty/BattleTiers';
import AggregatedChat from '../components/live/AggregatedChat';
import ViewerRail from '../components/watchparty/ViewerRail';
import LivePollWidget from '../components/live/LivePollWidget';
import GreenroomWaitlistPanel from '../components/greenroom/GreenroomWaitlistPanel';
import VideoSourcePicker, { getYouTubeId, detectVideoType } from '../components/video/VideoSourcePicker';
import PartyReactionsOverlay from '../components/watchparty/PartyReactionsOverlay';
import LiveEmoticonStorm from '../components/watchparty/LiveEmoticonStorm';
import PartyHypeMeter from '../components/watchparty/PartyHypeMeter';
import HostControls from '../components/watchparty/HostControls';

const GOLD = '#D4AF37';
const BG = '#080B18';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

// ── Video sync engine ────────────────────────────────────────────────────────
function useSyncEngine({ party, isHost, onTimeSync }) {
  const qc = useQueryClient();

  const pushState = useCallback(async (playerState) => {
    if (!isHost || !party?.id) return;
    await base44.entities.WatchParty.update(party.id, {
      playback_state: playerState.playing ? 'playing' : 'paused',
      current_time: playerState.currentTime,
      updated_at_ms: Date.now(),
    });
  }, [isHost, party?.id]);

  useEffect(() => {
    if (!party?.id) return;
    const unsub = base44.entities.WatchParty.subscribe((event) => {
      if (event.id !== party.id) return;
      if (!isHost && event.data) onTimeSync(event.data);
      qc.invalidateQueries(['broadcast-party', party.id]);
    });
    return unsub;
  }, [party?.id, isHost, onTimeSync, qc]);

  return { pushState };
}

// ── YouTube player ───────────────────────────────────────────────────────────
function YouTubeEmbed({ videoId, isHost, syncData, onStateChange }) {
  const iframeRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player(iframeRef.current, {
        videoId,
        playerVars: { autoplay: 0, controls: isHost ? 1 : 0 },
        events: {
          onStateChange: (e) => {
            if (!isHost) return;
            const s = e.data;
            if (s === window.YT.PlayerState.PLAYING || s === window.YT.PlayerState.PAUSED) {
              onStateChange({ playing: s === window.YT.PlayerState.PLAYING, currentTime: playerRef.current?.getCurrentTime() || 0 });
            }
          },
        },
      });
    };
  }, [videoId]);

  // Push every 3s during playback so viewers stay in sync
  useEffect(() => {
    if (!isHost) return;
    const iv = setInterval(() => {
      if (!playerRef.current?.getPlayerState) return;
      if (playerRef.current.getPlayerState() === window.YT?.PlayerState?.PLAYING) {
        onStateChange({ playing: true, currentTime: playerRef.current.getCurrentTime() || 0 });
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [isHost, onStateChange]);

  useEffect(() => {
    if (isHost || !playerRef.current || !syncData) return;
    const lag = Date.now() - (syncData.updated_at_ms || Date.now());
    const adj = (syncData.current_time || 0) + lag / 1000;
    const cur = playerRef.current.getCurrentTime?.() || 0;
    if (Math.abs(cur - adj) > 2) playerRef.current.seekTo?.(adj, true);
    if (syncData.playback_state === 'playing') playerRef.current.playVideo?.();
    else playerRef.current.pauseVideo?.();
  }, [syncData, isHost]);

  return <div ref={iframeRef} className="w-full h-full" />;
}

// ── Direct video player ──────────────────────────────────────────────────────
function DirectPlayer({ url, isHost, syncData, onStateChange }) {
  const videoRef = useRef(null);

  const handleEvent = () => {
    if (!isHost || !videoRef.current) return;
    onStateChange({ playing: !videoRef.current.paused, currentTime: videoRef.current.currentTime });
  };

  useEffect(() => {
    if (!isHost) return;
    const iv = setInterval(() => {
      if (!videoRef.current || videoRef.current.paused) return;
      onStateChange({ playing: true, currentTime: videoRef.current.currentTime });
    }, 3000);
    return () => clearInterval(iv);
  }, [isHost, onStateChange]);

  useEffect(() => {
    if (isHost || !videoRef.current || !syncData) return;
    const v = videoRef.current;
    const lag = Date.now() - (syncData.updated_at_ms || Date.now());
    const adj = (syncData.current_time || 0) + lag / 1000;
    if (Math.abs(v.currentTime - adj) > 2) v.currentTime = adj;
    if (syncData.playback_state === 'playing') v.play().catch(() => {});
    else v.pause();
  }, [syncData, isHost]);

  return (
    <video
      ref={videoRef}
      src={url}
      controls={isHost}
      className="w-full h-full object-contain bg-black"
      onPlay={handleEvent}
      onPause={handleEvent}
      onSeeked={handleEvent}
    />
  );
}

// ── Live camera tile (center stage when in 'live' or 'hybrid' mode) ──────────
function LiveCameraTile({ localStream, videoEnabled }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && localStream) ref.current.srcObject = localStream; }, [localStream]);
  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {localStream && videoEnabled
        ? <video ref={ref} autoPlay muted playsInline className="w-full h-full object-cover" />
        : <div className="flex flex-col items-center gap-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
            <VideoOff className="w-12 h-12" />
            <span className="text-xs">Camera off</span>
          </div>}
      <div className="absolute top-3 left-3 flex items-center gap-1 text-[9px] px-2 py-1 rounded"
        style={{ background: 'rgba(255,21,100,0.2)', border: '1px solid rgba(255,21,100,0.4)', color: '#FF1564', ...T }}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block mr-0.5" />
        LIVE
      </div>
    </div>
  );
}

// ── Create screen ────────────────────────────────────────────────────────────
function CreateScreen({ onSubmit, isPending }) {
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [mode, setMode] = useState('hybrid');

  const MODES = [
    { id: 'hybrid',  icon: '⚡', label: 'Hybrid',    desc: 'Video + live panel' },
    { id: 'watch',   icon: '🎬', label: 'Watch Party',desc: 'Sync video for everyone' },
    { id: 'live',    icon: '🎙️', label: 'Live Panel', desc: 'Camera-only broadcast' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: BG }}>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Radio className="w-7 h-7" style={{ color: GOLD }} />
            <h1 className="text-4xl font-black uppercase tracking-widest" style={{ color: GOLD, ...T }}>
              Broadcast Studio
            </h1>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
            20-person live panel · Watch party sync · PK Battle tiers · Multilingual chat
          </p>
        </div>

        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <Input
            placeholder="Broadcast title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="h-11 text-white placeholder:text-white/30"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />

          <div>
            <p className="text-[9px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Mode</p>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(mod => (
                <button key={mod.id} onClick={() => setMode(mod.id)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all"
                  style={{
                    background: mode === mod.id ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
                    border: mode === mod.id ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                  <span className="text-xl">{mod.icon}</span>
                  <span className="text-[9px] font-black uppercase" style={{ color: mode === mod.id ? GOLD : 'rgba(255,255,255,0.4)', ...T }}>{mod.label}</span>
                  <span className="text-[8px] text-center leading-tight" style={{ color: 'rgba(255,255,255,0.25)' }}>{mod.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {mode !== 'live' && (
            <Input
              placeholder="YouTube URL or direct video URL (optional)…"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              className="h-10 text-white placeholder:text-white/30"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          )}

          <button
            className="w-full h-12 rounded-xl font-black uppercase text-base flex items-center justify-center gap-2 transition-all"
            style={{
              background: title.trim() ? 'linear-gradient(135deg, #800020, #A0003A)' : 'rgba(255,255,255,0.06)',
              border: title.trim() ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)',
              color: title.trim() ? GOLD : 'rgba(255,255,255,0.25)',
              boxShadow: title.trim() ? '0 0 24px rgba(128,0,32,0.35)' : 'none',
              ...T,
            }}
            disabled={!title.trim() || isPending}
            onClick={() => onSubmit({ title, videoUrl, mode })}>
            <Radio className="w-5 h-5" />
            {isPending ? 'Creating…' : 'Go Live'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main BroadcastStudio ─────────────────────────────────────────────────────
export default function BroadcastStudio() {
  const params = new URLSearchParams(window.location.search);
  const partyId = params.get('id');
  const qc = useQueryClient();

  const [studioMode, setStudioMode] = useState('hybrid');
  const [activeTab, setActiveTab] = useState('chat');
  const [leftOpen, setLeftOpen] = useState(true);
  const [theaterMode, setTheaterMode] = useState(false);
  const [syncData, setSyncData] = useState(null);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: party } = useQuery({
    queryKey: ['broadcast-party', partyId],
    queryFn: () => base44.entities.WatchParty.filter({ id: partyId }).then(r => r[0]),
    enabled: !!partyId,
    refetchInterval: 15000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['broadcast-members', partyId],
    queryFn: () => base44.entities.WatchPartyMember.filter({ party_id: partyId, is_active: true }),
    enabled: !!partyId,
    refetchInterval: 15000,
  });

  // Real-time roster
  useEffect(() => {
    if (!partyId) return;
    const unsub = base44.entities.WatchPartyMember.subscribe((event) => {
      if (event.data?.party_id !== partyId) return;
      qc.invalidateQueries(['broadcast-members', partyId]);
    });
    return unsub;
  }, [partyId, qc]);

  // Local media
  const { localStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo } = useLocalMedia({ audio: true, video: true });

  // WebRTC peer mesh — uses partyId as the signaling channel room
  const { remoteStreams, peerUserIds, announceJoin, leaveRoom } = useWebRTCPeers(partyId, localStream);
  const announceRef = useRef(announceJoin);
  const leaveRef = useRef(leaveRoom);
  useEffect(() => { announceRef.current = announceJoin; }, [announceJoin]);
  useEffect(() => { leaveRef.current = leaveRoom; }, [leaveRoom]);
  const announcedRef = useRef(false);
  useEffect(() => {
    if (!localStream || !user?.id || announcedRef.current) return;
    announcedRef.current = true;
    announceRef.current?.(user.id);
  }, [localStream, user?.id]);
  useEffect(() => () => leaveRef.current?.(), []);

  const isHost = party?.host_id === user?.id;
  const myMember = members.find(m => m.user_id === user?.id);
  const isCoHost = myMember?.role === 'cohost';
  const canManage = isHost || isCoHost;

  const onTimeSync = useCallback((data) => setSyncData(data), []);
  const { pushState } = useSyncEngine({ party, isHost, onTimeSync });

  // Auto-join as member
  useEffect(() => {
    if (!party || !user) return;
    (async () => {
      const existing = await base44.entities.WatchPartyMember.filter({ party_id: party.id, user_id: user.id, is_active: true });
      if (!existing.length) {
        await base44.entities.WatchPartyMember.create({
          party_id: party.id,
          user_id: user.id,
          user_name: user.full_name || user.email,
          joined_at: new Date().toISOString(),
          is_active: true,
          role: party.host_id === user.id ? 'host' : 'audience',
          is_audio_enabled: true,
          is_video_enabled: true,
        });
        qc.invalidateQueries(['broadcast-members', party.id]);
      }
    })();
  }, [party?.id, user?.id]);

  // Leave on unmount
  useEffect(() => () => {
    if (!party?.id || !user?.id) return;
    base44.entities.WatchPartyMember.filter({ party_id: party.id, user_id: user.id, is_active: true })
      .then(ms => ms.forEach(m => base44.entities.WatchPartyMember.update(m.id, { is_active: false, left_at: new Date().toISOString() })));
  }, [party?.id, user?.id]);

  const createMut = useMutation({
    mutationFn: async ({ title, videoUrl, mode }) => {
      const type = videoUrl ? detectVideoType(videoUrl) : 'live';
      const p = await base44.entities.WatchParty.create({
        host_id: user.id,
        title: title || 'Broadcast Studio',
        video_url: videoUrl || '',
        video_type: type,
        status: 'active',
        participant_count: 1,
        current_time: 0,
        updated_at_ms: Date.now(),
        playback_state: 'paused',
      });
      return { party: p, mode };
    },
    onSuccess: ({ party: p, mode }) => {
      setStudioMode(mode);
      window.location.href = `${window.location.pathname}?id=${p.id}`;
    },
  });

  const endMut = useMutation({
    mutationFn: () => base44.entities.WatchParty.update(partyId, { status: 'ended' }),
    onSuccess: () => { toast.success('Broadcast ended'); window.location.href = window.location.pathname; },
  });

  const promoteCoHost = async (member) => {
    await base44.entities.WatchPartyMember.update(member.id, { role: 'cohost' });
    toast.success(`${member.user_name} promoted to co-host`);
    qc.invalidateQueries(['broadcast-members', partyId]);
  };

  const demoteToAudience = async (member) => {
    await base44.entities.WatchPartyMember.update(member.id, { role: 'audience' });
    qc.invalidateQueries(['broadcast-members', partyId]);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Invite link copied!');
  };

  // ── Create screen ────────────────────────────────────────────────────────
  if (!partyId) {
    return <CreateScreen onSubmit={(args) => createMut.mutate(args)} isPending={createMut.isPending} />;
  }

  if (!party) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD }} />
      </div>
    );
  }

  const ytId = party.video_type === 'youtube' ? getYouTubeId(party.video_url) : null;
  const hasVideo = !!party.video_url;
  const showVideoPlayer = (studioMode === 'watch' || studioMode === 'hybrid') && hasVideo;

  const RIGHT_TABS = [
    { id: 'chat',    label: '💬 Chat',   desc: 'Multilingual' },
    { id: 'battle',  label: '⚔️ Battle', desc: 'PK Tiers' },
    { id: 'polls',   label: '📊 Polls',  desc: 'Live polls' },
    { id: 'viewers', label: '👥 Panel',  desc: 'Manage' },
    ...(canManage ? [{ id: 'manage', label: '🛡 Manage', desc: 'Host tools' }] : []),
  ];

  return (
    <div className={`flex flex-col ${theaterMode ? 'fixed inset-0 z-50' : 'h-screen'}`} style={{ background: BG }}>

      {/* ── TOP BAR ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2" style={{ background: 'rgba(0,0,0,0.65)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
        {/* Toggle left panel */}
        <button onClick={() => setLeftOpen(v => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
          {leftOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Title + live badge */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: '#FF1564' }} />
          <span className="font-black text-sm text-white truncate max-w-[160px]" style={T}>{party.title}</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0"
            style={{ background: 'rgba(255,21,100,0.15)', color: '#FF1564', border: '1px solid rgba(255,21,100,0.3)', ...T }}>LIVE</span>
        </div>

        {/* Mode pills */}
        <div className="flex items-center gap-1 ml-1">
          {[
            { id: 'hybrid', icon: '⚡', label: 'Hybrid' },
            { id: 'watch',  icon: '🎬', label: 'Watch' },
            { id: 'live',   icon: '🎙️', label: 'Live' },
          ].map(mod => (
            <button key={mod.id} onClick={() => setStudioMode(mod.id)}
              className="text-[8px] px-2 py-1 rounded font-black uppercase transition-all"
              style={{
                background: studioMode === mod.id ? 'rgba(212,175,55,0.15)' : 'transparent',
                border: studioMode === mod.id ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
                color: studioMode === mod.id ? GOLD : 'rgba(255,255,255,0.3)', ...T,
              }}>
              {mod.icon} {mod.label}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Users className="w-3 h-3 inline mr-0.5" />{members.length}/20
          </span>

          <button onClick={copyLink}
            className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>
            <Copy className="w-3 h-3" /> Invite
          </button>

          {canManage && <GreenroomWaitlistPanel roomId={partyId} currentUser={user} />}

          {isHost && (
            <VideoSourcePicker
              compact
              isHost={isHost}
              isCoHost={isCoHost}
              onSelect={src => {
                base44.entities.WatchParty.update(party.id, {
                  video_url: src.url,
                  video_type: src.type === 'youtube' ? 'youtube' : 'direct',
                  current_time: 0,
                  playback_state: 'paused',
                  updated_at_ms: Date.now(),
                }).then(() => {
                  qc.invalidateQueries(['broadcast-party', partyId]);
                  setStudioMode('watch');
                });
              }}
            />
          )}

          <button onClick={() => setTheaterMode(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: theaterMode ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)', color: theaterMode ? GOLD : 'rgba(255,255,255,0.4)' }}>
            {theaterMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {isHost && (
            <button onClick={() => endMut.mutate()}
              className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg"
              style={{ background: 'rgba(255,21,100,0.12)', border: '1px solid rgba(255,21,100,0.25)', color: '#FF1564', ...T }}>
              <LogOut className="w-3 h-3" /> End
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN AREA ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT: 20-person Panel Grid ────────────────────────────────── */}
        <AnimatePresence>
          {leftOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 216, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 overflow-hidden h-full"
              style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <PanelGrid
                members={members}
                currentUser={user}
                hostId={party.host_id}
                maxSlots={20}
                isHost={canManage}
                onInvite={copyLink}
                remoteStreams={remoteStreams}
                peerUserIds={peerUserIds}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CENTER: Stage ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Main video / camera area */}
          <div className="relative shrink-0 bg-black group" style={{ aspectRatio: '16/9' }}>
            {showVideoPlayer ? (
              party.video_type === 'youtube' && ytId ? (
                <YouTubeEmbed
                  videoId={ytId}
                  isHost={isHost}
                  syncData={isHost ? null : (syncData || party)}
                  onStateChange={pushState}
                />
              ) : (
                <DirectPlayer
                  url={party.video_url}
                  isHost={isHost}
                  syncData={isHost ? null : (syncData || party)}
                  onStateChange={pushState}
                />
              )
            ) : (
              <LiveCameraTile localStream={localStream} videoEnabled={videoEnabled} />
            )}

            {/* Hybrid PIP: local camera overlay when video is playing */}
            {studioMode === 'hybrid' && hasVideo && localStream && (
              <PipCameraTile localStream={localStream} videoEnabled={videoEnabled} />
            )}

            {/* Sync badge for viewers */}
            {!isHost && (
              <div className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1"
                style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(107,124,74,0.3)', color: 'white' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live Sync
              </div>
            )}
          </div>

          {/* Hype meter */}
          <div className="shrink-0 px-3 py-1">
            <PartyHypeMeter partyId={partyId} memberCount={members.length} />
          </div>

          {/* Viewer rail */}
          <ViewerRail members={members} hostId={party.host_id} />

          {/* Emoji reactions */}
          <div className="shrink-0">
            <PartyReactionsOverlay
              partyId={partyId}
              currentUser={user}
              currentTime={syncData?.current_time || party?.current_time || 0}
            />
          </div>
          <LiveEmoticonStorm partyId={partyId} currentUser={user} />

          {/* PK Battle strip — always visible on center stage */}
          <div className="flex-1 overflow-auto p-2 min-h-0">
            <BattleTiers partyId={partyId} currentUser={user} members={members} hostId={party.host_id} />
          </div>
        </div>

        {/* ── RIGHT: Tabbed tools panel ─────────────────────────────────── */}
        <div className="shrink-0 flex flex-col overflow-hidden" style={{ width: 296, borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#0D0618' }}>

          {/* Tab bar */}
          <div className="flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0B0B18' }}>
            {RIGHT_TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-2 flex flex-col items-center gap-0 transition-all"
                style={{
                  color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.3)',
                  background: activeTab === tab.id ? 'rgba(212,175,55,0.06)' : 'transparent',
                  borderBottom: activeTab === tab.id ? `2px solid ${GOLD}` : '2px solid transparent',
                }}>
                <span className="text-[9px] font-black uppercase" style={T}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">

            {/* 💬 MULTILINGUAL CHAT */}
            {activeTab === 'chat' && (
              <AggregatedChat roomId={partyId} currentUser={user} isHost={canManage} />
            )}

            {/* ⚔️ PK BATTLE */}
            {activeTab === 'battle' && (
              <div className="p-2 space-y-2">
                <div className="flex items-center gap-2 px-1 pt-1">
                  <Swords className="w-3.5 h-3.5" style={{ color: GOLD }} />
                  <span className="text-[10px] font-black uppercase" style={{ color: GOLD, ...T }}>PK Battle Tiers</span>
                </div>
                <BattleTiers partyId={partyId} currentUser={user} members={members} hostId={party.host_id} />
                <div className="rounded-xl p-3 mt-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Award tiers to panelists in real time. Points accumulate during the broadcast and reset each session.
                  </p>
                </div>
              </div>
            )}

            {/* 📊 POLLS */}
            {activeTab === 'polls' && (
              <div className="p-2">
                <LivePollWidget roomId={partyId} currentUser={user} isHost={canManage} />
              </div>
            )}

            {/* 👥 PANEL MANAGEMENT */}
            {activeTab === 'viewers' && (
              <div className="p-2 space-y-2">
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-[9px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
                    {members.length} / 20 panelists
                  </span>
                  <button onClick={copyLink} className="text-[8px] px-2 py-0.5 rounded"
                    style={{ background: 'rgba(212,175,55,0.08)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', ...T }}>
                    + Invite
                  </button>
                </div>
                {members.map(mem => {
                  const isMe = mem.user_id === user?.id;
                  const isHostMem = mem.user_id === party.host_id;
                  const isCoHostMem = mem.role === 'cohost';
                  return (
                    <div key={mem.id} className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0"
                        style={{ background: isHostMem ? 'rgba(212,175,55,0.2)' : isCoHostMem ? 'rgba(0,245,255,0.15)' : 'rgba(139,92,246,0.2)', color: isHostMem ? GOLD : isCoHostMem ? '#00F5FF' : '#8B5CF6' }}>
                        {(mem.user_name || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-white font-semibold truncate">{mem.user_name}{isMe ? ' (you)' : ''}</p>
                        <p className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {isHostMem ? '👑 Host' : isCoHostMem ? '🎙️ Co-host' : 'Audience'}
                        </p>
                      </div>
                      {canManage && !isMe && !isHostMem && (
                        isCoHostMem ? (
                          <button onClick={() => demoteToAudience(mem)}
                            className="text-[8px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(255,68,68,0.08)', color: '#FF6666', border: '1px solid rgba(255,68,68,0.2)', ...T }}>
                            Demote
                          </button>
                        ) : (
                          <button onClick={() => promoteCoHost(mem)}
                            className="text-[8px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(212,175,55,0.08)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', ...T }}>
                            Co-host
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
                {members.length === 0 && (
                  <p className="text-center text-[10px] py-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    No panelists yet — share the invite link!
                  </p>
                )}
              </div>
            )}

            {/* 🛡 HOST / CO-HOST MANAGEMENT */}
            {activeTab === 'manage' && canManage && (
              <div className="p-2 space-y-3">
                <HostControls isHost={canManage} party={party} onUpdate={() => qc.invalidateQueries(['broadcast-party', partyId])} />

                {/* Video source changer */}
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[9px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Video Source</p>
                  <VideoSourcePicker
                    isHost={isHost}
                    isCoHost={isCoHost}
                    onSelect={src => {
                      base44.entities.WatchParty.update(party.id, {
                        video_url: src.url,
                        video_type: src.type === 'youtube' ? 'youtube' : 'direct',
                        current_time: 0,
                        playback_state: 'paused',
                        updated_at_ms: Date.now(),
                      }).then(() => {
                        qc.invalidateQueries(['broadcast-party', partyId]);
                        setStudioMode('watch');
                        toast.success('Video updated!');
                      });
                    }}
                  />
                </div>

                {/* Danger zone */}
                {isHost && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,21,100,0.06)', border: '1px solid rgba(255,21,100,0.15)' }}>
                    <p className="text-[9px] font-black uppercase mb-2" style={{ color: '#FF6680', ...T }}>End Broadcast</p>
                    <button onClick={() => endMut.mutate()}
                      className="w-full py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1"
                      style={{ background: 'rgba(255,21,100,0.12)', border: '1px solid rgba(255,21,100,0.3)', color: '#FF1564', ...T }}>
                      <LogOut className="w-3.5 h-3.5" /> End Broadcast for Everyone
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM CONTROLS ────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-center gap-3 py-2 px-4"
        style={{ background: 'rgba(0,0,0,0.75)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        <motion.button whileTap={{ scale: 0.92 }} onClick={toggleAudio}
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
          style={{
            background: audioEnabled ? 'rgba(0,255,136,0.12)' : 'rgba(255,68,68,0.15)',
            border: audioEnabled ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,68,68,0.4)',
            color: audioEnabled ? '#00FF88' : '#FF4444',
          }}>
          {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </motion.button>

        <motion.button whileTap={{ scale: 0.92 }} onClick={toggleVideo}
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
          style={{
            background: videoEnabled ? 'rgba(0,245,255,0.12)' : 'rgba(255,68,68,0.15)',
            border: videoEnabled ? '1px solid rgba(0,245,255,0.3)' : '1px solid rgba(255,68,68,0.4)',
            color: videoEnabled ? '#00F5FF' : '#FF4444',
          }}>
          {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </motion.button>

        <motion.button whileTap={{ scale: 0.92 }}
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
          <Monitor className="w-4 h-4" />
        </motion.button>

        <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.1)' }} />

        <span className="text-[9px] px-2 py-1 rounded font-black uppercase"
          style={{ background: 'rgba(212,175,55,0.1)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)', ...T }}>
          {studioMode === 'watch' ? '🎬 Watch' : studioMode === 'live' ? '🎙️ Live' : '⚡ Hybrid'}
        </span>

        <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {!isHost ? (
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => { window.location.href = '/'; }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase"
            style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444', ...T }}>
            <PhoneOff className="w-3.5 h-3.5" /> Leave
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => endMut.mutate()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase"
            style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444', ...T }}>
            <PhoneOff className="w-3.5 h-3.5" /> End Broadcast
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ── Picture-in-picture local camera (hybrid mode overlay) ───────────────────
function PipCameraTile({ localStream, videoEnabled }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && localStream) ref.current.srcObject = localStream; }, [localStream]);
  return (
    <div className="absolute bottom-3 right-3 rounded-xl overflow-hidden shadow-xl"
      style={{ width: 120, height: 90, border: '2px solid rgba(212,175,55,0.4)', background: '#000', zIndex: 10 }}>
      {localStream && videoEnabled
        ? <video ref={ref} autoPlay muted playsInline className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <VideoOff className="w-5 h-5" />
          </div>}
      <div className="absolute bottom-1 left-1 text-[7px] px-1 rounded"
        style={{ background: 'rgba(0,0,0,0.6)', color: GOLD, ...T }}>YOU</div>
    </div>
  );
}
