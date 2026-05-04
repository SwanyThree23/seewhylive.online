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
    <div className="h-[calc(100vh-120px)] flex gap-0 overflow-hidden">
      {/* ── VIDEO AREA ── */}
      <div className="flex-1 flex flex-col bg-black min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-white/10 shrink-0">
          <h2 className="font-semibold text-white flex-1 truncate">{party.title}</h2>
          <Badge variant="outline" className="text-white border-white/30 gap-1">
            <Users className="w-3 h-3" /> {members.length}
          </Badge>
          {!isHost && (
            <Badge className="bg-blue-600 text-white text-xs">Synced to host</Badge>
          )}
          {isHost && (
            <Badge className="bg-green-600 text-white text-xs">You are host</Badge>
          )}
          <ShareButtons
            url={window.location.href}
            title={`Join my Watch Party: ${party?.title}`}
            className="text-white [&_button]:text-white/60 [&_button:hover]:text-white"
          />
          {isHost && (
            <Button size="sm" variant="destructive" onClick={() => endPartyMutation.mutate()}>
              <LogOut className="w-3 h-3 mr-1" /> End
            </Button>
          )}
        </div>

        {/* Viewer rail */}
        <ViewerRail members={members} hostId={party.host_id} maxVisible={20} />

        {/* Player */}
        <div className="flex-1 relative">
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
            <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live Sync
            </div>
          )}
        </div>

        {/* Reactions */}
        <div className="relative bg-gray-900 border-t border-white/10 shrink-0">
          <ReactionOverlay partyId={partyId} currentUser={user} />
          {!isHost && (
            <div className="px-4 pb-2 text-[10px] text-white/30 text-center">
              Playback controlled by host · Watching in sync
            </div>
          )}
        </div>
      </div>

      {/* ── CHAT SIDEBAR ── */}
      <div className="w-80 shrink-0 border-l border-gray-200 dark:border-white/10 flex flex-col bg-white dark:bg-gray-900">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10 shrink-0">
          <h3 className="font-semibold text-sm">Party Chat</h3>
          <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                  {m.user_name?.charAt(0)?.toUpperCase()}
                </div>
                {m.user_name}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <AggregatedChat roomId={party.room_id || partyId} currentUser={user} isHost={isHost} />
        </div>
      </div>
    </div>
  );
}