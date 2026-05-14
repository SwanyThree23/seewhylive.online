import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Plus, Youtube, Video, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import AggregatedChat from '../components/live/AggregatedChat';
import ViewerRail from '../components/watchparty/ViewerRail';
import ReactionOverlay from '../components/watchparty/ReactionOverlay';
import ShareButtons from '../components/shared/ShareButtons';
import PanelGrid from '../components/watchparty/PanelGrid';
import BattleTiers from '../components/watchparty/BattleTiers';
import WatchQueue from '../components/watchparty/WatchQueue';
import SocialLeaderboard from '../components/watchparty/SocialLeaderboard';
import HostControls from '../components/watchparty/HostControls';
import WatchPartyPoll from '../components/watchparty/WatchPartyPoll';
import VideoQueue from '../components/watchparty/VideoQueue';
import WatchPartyAnalytics from '../components/watchparty/WatchPartyAnalytics';

function getYouTubeId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
  return m ? m[1] : null;
}

function detectType(url) {
  return url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'direct';
}

// ── Sync Engine ──────────────────────────────────────────────────────────────
function useSyncEngine({ party, isHost, onTimeSync }) {
  const qc = useQueryClient();
  const syncInterval = useRef(null);

  // Host: push state every 3s
  const pushState = useCallback(async (playerState) => {
    if (!isHost || !party?.id) return;
    await base44.entities.WatchParty.update(party.id, {
      playback_state: playerState.playing ? 'playing' : 'paused',
      current_time: playerState.currentTime,
      updated_at_ms: Date.now(),
    });
  }, [isHost, party?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!party?.id) return;
    const unsub = base44.entities.WatchParty.subscribe((event) => {
      if (event.id !== party.id) return;
      if (!isHost && event.data) {
        onTimeSync(event.data);
      }
      qc.invalidateQueries(['watchparty', party.id]);
    });
    return unsub;
  }, [party?.id, isHost, onTimeSync, qc]);

  return { pushState };
}

// ── YouTube Player ────────────────────────────────────────────────────────────
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
            const state = e.data;
            if (state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.PAUSED) {
              onStateChange({
                playing: state === window.YT.PlayerState.PLAYING,
                currentTime: playerRef.current?.getCurrentTime() || 0,
              });
            }
          },
        },
      });
    };
  }, [videoId]);

  // Sync from host
  useEffect(() => {
    if (isHost || !playerRef.current || !syncData) return;
    const serverTime = syncData.current_time || 0;
    const lagMs = Date.now() - (syncData.updated_at_ms || Date.now());
    const adjustedTime = serverTime + lagMs / 1000;
    const current = playerRef.current.getCurrentTime?.() || 0;
    if (Math.abs(current - adjustedTime) > 2) {
      playerRef.current.seekTo?.(adjustedTime, true);
    }
    if (syncData.playback_state === 'playing') {
      playerRef.current.playVideo?.();
    } else {
      playerRef.current.pauseVideo?.();
    }
  }, [syncData, isHost]);

  return <div ref={iframeRef} className="w-full h-full" />;
}

// ── Direct Video Player ───────────────────────────────────────────────────────
function DirectPlayer({ url, isHost, syncData, onStateChange }) {
  const videoRef = useRef(null);

  const handleEvent = () => {
    if (!isHost || !videoRef.current) return;
    onStateChange({
      playing: !videoRef.current.paused,
      currentTime: videoRef.current.currentTime,
    });
  };

  useEffect(() => {
    if (isHost || !videoRef.current || !syncData) return;
    const v = videoRef.current;
    const serverTime = syncData.current_time || 0;
    const lagMs = Date.now() - (syncData.updated_at_ms || Date.now());
    const adjustedTime = serverTime + lagMs / 1000;
    if (Math.abs(v.currentTime - adjustedTime) > 2) v.currentTime = adjustedTime;
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WatchPartyPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const partyId = urlParams.get('id');
  const qc = useQueryClient();

  const [videoUrl, setVideoUrl] = useState('');
  const [partyTitle, setPartyTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [syncData, setSyncData] = useState(null);
  const [activePanel, setActivePanel] = useState('chat');
  const [reactionCount, setReactionCount] = useState(0);
  const [pollCount, setPollCount] = useState(0);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: party } = useQuery({
    queryKey: ['watchparty', partyId],
    queryFn: () => base44.entities.WatchParty.filter({ id: partyId }).then(r => r[0]),
    enabled: !!partyId,
    refetchInterval: 5000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['watchparty-members', partyId],
    queryFn: () => base44.entities.WatchPartyMember.filter({ party_id: partyId, is_active: true }),
    enabled: !!partyId,
    refetchInterval: 10000,
  });

  const isHost = party?.host_id === user?.id;

  // Join party on load
  useEffect(() => {
    if (!party || !user) return;
    const join = async () => {
      const existing = await base44.entities.WatchPartyMember.filter({ party_id: party.id, user_id: user.id, is_active: true });
      if (existing.length === 0) {
        await base44.entities.WatchPartyMember.create({
          party_id: party.id,
          user_id: user.id,
          user_name: user.full_name || user.email,
          joined_at: new Date().toISOString(),
          is_active: true,
        });
        await base44.entities.WatchParty.update(party.id, { participant_count: members.length + 1 });
        qc.invalidateQueries(['watchparty-members', party.id]);
      }
    };
    join();
  }, [party?.id, user?.id]);

  // Leave on unmount
  useEffect(() => {
    return () => {
      if (!party || !user) return;
      base44.entities.WatchPartyMember.filter({ party_id: party.id, user_id: user.id, is_active: true })
        .then(members => members.forEach(m =>
          base44.entities.WatchPartyMember.update(m.id, { is_active: false, left_at: new Date().toISOString() })
        ));
    };
  }, [party?.id, user?.id]);

  const onTimeSync = useCallback((data) => setSyncData(data), []);
  const { pushState } = useSyncEngine({ party, isHost, onTimeSync });

  const createMutation = useMutation({
    mutationFn: async () => {
      const type = detectType(videoUrl);
      return base44.entities.WatchParty.create({
        host_id: user.id,
        title: partyTitle || 'Watch Party',
        video_url: videoUrl,
        video_type: type,
        status: 'active',
        participant_count: 1,
        current_time: 0,
        updated_at_ms: Date.now(),
        playback_state: 'paused',
      });
    },
    onSuccess: (p) => {
      window.location.href = `${window.location.pathname}?id=${p.id}`;
    },
  });

  const endPartyMutation = useMutation({
    mutationFn: () => base44.entities.WatchParty.update(partyId, { status: 'ended' }),
    onSuccess: () => { toast.success('Watch party ended'); window.location.href = window.location.pathname; },
  });

  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Invite link copied!');
  };

  // ── Create screen ─────────────────────────────────────────────────────────
  if (!partyId) {
    return (
      <div className="max-w-lg mx-auto mt-16 p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Video className="w-8 h-8 text-primary" /> Watch Party</h1>
          <p className="text-muted-foreground mt-1">Watch together in sync with real-time chat</p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Input
              placeholder="Party title (e.g. Movie Night)"
              value={partyTitle}
              onChange={e => setPartyTitle(e.target.value)}
            />
            <Input
              placeholder="YouTube URL or direct video URL"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
            />
            {videoUrl && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {detectType(videoUrl) === 'youtube'
                  ? <><Youtube className="w-4 h-4 text-red-500" /> YouTube video detected</>
                  : <><Video className="w-4 h-4" /> Direct video URL</>}
              </div>
            )}
            <Button
              className="w-full"
              disabled={!videoUrl.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              <Plus className="w-4 h-4 mr-2" /> Create Watch Party
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!party) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const ytId = party.video_type === 'youtube' ? getYouTubeId(party.video_url) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden" style={{ background: '#0B0B18' }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 shrink-0" style={{ background: '#1A0F0A', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
        <h2 className="font-semibold text-white flex-1 truncate text-sm">{party.title}</h2>
        <div className="flex items-center gap-1 text-[11px]" style={{ color: '#d4af37' }}>
          <Users className="w-3 h-3" /> {members.length}/20
        </div>
        {!isHost && (
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(107,124,74,0.2)', color: '#6B7C4A', border: '1px solid rgba(107,124,74,0.3)' }}>Synced</span>
        )}
        {isHost && (
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.2)' }}>Host</span>
        )}
        <ShareButtons
          url={window.location.href}
          title={`Join my Watch Party: ${party?.title}`}
          className="text-white [&_button]:text-white/60"
        />
        {isHost && (
          <Button size="sm" onClick={() => endPartyMutation.mutate()}
            className="h-7 text-[10px] px-2" style={{ background: 'rgba(180,50,30,0.3)', color: '#ff8866', border: '1px solid rgba(200,80,30,0.3)' }}>
            <LogOut className="w-3 h-3 mr-1" /> End
          </Button>
        )}
      </div>

      {/* ── VIDEO PLAYER — always visible at top on mobile ── */}
      <div className="shrink-0 relative bg-black" style={{ aspectRatio: '16/9', width: '100%' }}>
        {ytId ? (
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
        )}
        {!isHost && (
          <div className="absolute top-2 right-2 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1"
            style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(107,124,74,0.3)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live Sync
          </div>
        )}
      </div>

      {/* Viewer rail — horizontal scrolling avatars */}
      <ViewerRail members={members} hostId={party.host_id} />

      {/* Reactions bar */}
      <div className="shrink-0" style={{ background: '#1A0F0A', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <ReactionOverlay partyId={partyId} currentUser={user} onReact={() => setReactionCount(c => c + 1)} />
      </div>

      {/* Main area: panel grid + tabbed right panel */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* ── 20-PERSON PANEL GRID — hidden on mobile to save space ── */}
        <div className="hidden md:block shrink-0 overflow-hidden"
          style={{ width: '220px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <PanelGrid
            members={members}
            currentUser={user}
            hostId={party.host_id}
            maxSlots={20}
            isHost={isHost}
            onInvite={copyInvite}
          />
        </div>

        {/* ── TABBED PANEL ── */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0d0618' }}>
          {/* Tab bar */}
          <div className="flex shrink-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0B0B18' }}>
            {[
              { id: 'chat',        label: '💬 Chat' },
              { id: 'queue',       label: '🎵 Queue' },
              { id: 'battle',      label: '⚔️ Battle' },
              { id: 'leaderboard', label: '🏆 Ranks' },
              { id: 'polls',       label: '📊 Polls' },
              { id: 'analytics',   label: '📈 Stats' },
              { id: 'viewers',     label: '👥 Viewers' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActivePanel(tab.id)}
                className="flex-1 py-2 text-[9px] font-black uppercase transition-all"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  letterSpacing: '0.06em',
                  color: activePanel === tab.id ? '#d4af37' : 'rgba(255,255,255,0.3)',
                  background: activePanel === tab.id ? 'rgba(212,175,55,0.07)' : 'transparent',
                  borderBottom: activePanel === tab.id ? '2px solid #d4af37' : '2px solid transparent',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {activePanel === 'chat' && (
              <>
                {isHost && (
                  <HostControls isHost={isHost} party={party} onUpdate={() => {}} />
                )}
                <AggregatedChat roomId={party.room_id || partyId} currentUser={user} isHost={isHost} />
              </>
            )}
            {activePanel === 'queue' && (
              <VideoQueue
                isHost={isHost}
                currentUser={user}
                currentVideoUrl={party?.video_url}
                onPlayVideo={(url) => {
                  if (isHost && party?.id) {
                    base44.entities.WatchParty.update(party.id, { video_url: url, current_time: 0, playback_state: 'paused', updated_at_ms: Date.now() });
                  }
                }}
              />
            )}
            {activePanel === 'polls' && (
              <WatchPartyPoll
                partyId={partyId}
                roomId={party.room_id}
                currentUser={user}
                isHost={isHost}
                onPollLaunched={() => setPollCount(c => c + 1)}
              />
            )}
            {activePanel === 'analytics' && (
              <WatchPartyAnalytics
                party={party}
                members={members}
                pollCount={pollCount}
                reactionCount={reactionCount}
              />
            )}
            {activePanel === 'viewers' && (
              <PanelGrid
                members={members}
                currentUser={user}
                hostId={party.host_id}
                maxSlots={20}
                isHost={isHost}
                onInvite={copyInvite}
              />
            )}
            {activePanel === 'battle' && (
              <BattleTiers partyId={partyId} currentUser={user} members={members} hostId={party.host_id} />
            )}
            {activePanel === 'leaderboard' && (
              <SocialLeaderboard members={members} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}