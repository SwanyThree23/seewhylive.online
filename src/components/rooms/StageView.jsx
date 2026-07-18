import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Video, VideoOff, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OCT = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

export default function StageView({ stage, participants, currentUserId, onUpdateParticipant, localStream, localAudioEnabled, localVideoEnabled, onToggleAudio, onToggleVideo, remoteStreams, peerUserIds }) {
  const stageParticipants = participants.filter(p => p.stage_id === stage.id);
  const currentParticipant = participants.find(p => p.user_id === currentUserId);
  const isCurrentUserSpeaker = currentParticipant && ['host', 'co-host', 'speaker', 'guest'].includes(currentParticipant.role);

  // Speakers on stage (excluding current user to avoid duplicate — we'll inject them specially)
  const otherSpeakers = stageParticipants.filter(p =>
    ['host', 'co-host', 'speaker', 'guest'].includes(p.role) && p.user_id !== currentUserId
  );
  const speakers = stageParticipants.filter(p =>
    ['host', 'co-host', 'speaker', 'guest'].includes(p.role)
  );

  const getLayoutClass = () => {
    switch(stage.layout) {
      case 'spotlight':
        return 'grid-cols-1';
      case 'sidebar':
        return 'grid-cols-3';
      default: {
        // total visible tiles = other speakers + (1 if current user is on stage)
        const count = otherSpeakers.length + (isCurrentUserSpeaker ? 1 : 0);
        if (count <= 1) return 'grid-cols-1';
        if (count <= 4) return 'grid-cols-2';
        if (count <= 6) return 'grid-cols-3';
        return 'grid-cols-4';
      }
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-display" style={{ textShadow: '0 0 20px rgba(212,175,55,0.6), 0 0 40px rgba(212,175,55,0.3)' }}>{stage.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {speakers.length} / {stage.max_speakers} on stage
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {stage.description && (
          <p className="text-sm text-muted-foreground">{stage.description}</p>
        )}

        <div className={`grid ${getLayoutClass()} gap-4`}>
          <AnimatePresence>
            {/* Current user's local camera tile — always shown first if they are a speaker/host */}
            {isCurrentUserSpeaker && (
              <LocalCameraTile
                key="local"
                participant={currentParticipant}
                localStream={localStream}
                audioEnabled={localAudioEnabled}
                videoEnabled={localVideoEnabled}
                onUpdateParticipant={onUpdateParticipant}
                onToggleAudio={onToggleAudio}
                onToggleVideo={onToggleVideo}
              />
            )}
            {otherSpeakers.map((participant) => (
              <ParticipantTile
                key={participant.id}
                participant={participant}
                isCurrentUser={false}
                onUpdateParticipant={onUpdateParticipant}
                remoteStreams={remoteStreams}
                peerUserIds={peerUserIds}
              />
            ))}
          </AnimatePresence>
        </div>

        {speakers.length === 0 && !isCurrentUserSpeaker && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No one on stage yet</p>
            <p className="text-sm text-muted-foreground">Be the first to join!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Local camera tile — renders the current user's actual webcam feed inside the grid
function LocalCameraTile({ participant, localStream, audioEnabled, videoEnabled, onUpdateParticipant, onToggleAudio, onToggleVideo }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = localStream || null;
  }, [localStream]);

  const getRoleColor = (role) => {
    switch(role) {
      case 'host': return '#d4af37';
      case 'co-host': return '#60a5fa';
      case 'speaker': return '#34d399';
      default: return '#7B5DA6';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative"
    >
      <div className="overflow-hidden" style={{ 
        clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
        border: `3px solid ${getRoleColor(participant?.role)}`,
        background: '#080B18',
        aspectRatio: '4/3',
        boxShadow: `0 0 30px ${getRoleColor(participant?.role)}66, inset 0 0 20px ${getRoleColor(participant?.role)}33`
      }}>
        {/* Video feed — always mounted */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)', display: localStream && videoEnabled ? 'block' : 'none' }}
        />
        {!(localStream && videoEnabled) && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #800020, #d4af37)' }}>
              {participant?.user_name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 flex items-center justify-between"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white font-semibold truncate max-w-[100px]" style={{ textShadow: '0 0 8px rgba(212,175,55,0.5)' }}>{participant?.user_name}</span>
            <span className="text-[11px] px-1.5 py-0 rounded font-black uppercase"
              style={{ background: getRoleColor(participant?.role), color: '#000' }}>
              {participant?.role}
            </span>
            <Badge variant="outline" className="text-[11px] px-1 py-0 border-white/30 text-white/70">You</Badge>
          </div>
          <div className="flex items-center gap-1">
            {audioEnabled ? <Mic className="w-3 h-3 text-[#6DBF7E]" /> : <MicOff className="w-3 h-3 text-[#C0392B]" />}
            {videoEnabled ? <Video className="w-3 h-3 text-blue-400" /> : <VideoOff className="w-3 h-3 text-[#C0392B]" />}
          </div>
        </div>

        {/* Controls for current user — mic/cam toggles inline */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => { onToggleAudio?.(); onUpdateParticipant(participant.id, { is_audio_enabled: !audioEnabled }); }}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: audioEnabled ? 'rgba(52,211,153,0.3)' : 'rgba(192,57,43,0.3)', border: `1px solid ${audioEnabled ? '#34d399' : '#C0392B'}` }}>
            {audioEnabled ? <Mic className="w-3.5 h-3.5 text-[#6DBF7E]" /> : <MicOff className="w-3.5 h-3.5 text-[#C0392B]" />}
          </button>
          <button
            onClick={() => { onToggleVideo?.(); onUpdateParticipant(participant.id, { is_video_enabled: !videoEnabled }); }}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: videoEnabled ? 'rgba(96,165,250,0.3)' : 'rgba(192,57,43,0.3)', border: `1px solid ${videoEnabled ? '#60a5fa' : '#C0392B'}` }}>
            {videoEnabled ? <Video className="w-3.5 h-3.5 text-blue-400" /> : <VideoOff className="w-3.5 h-3.5 text-[#C0392B]" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ParticipantTile({ participant, isCurrentUser, onUpdateParticipant, remoteStreams, peerUserIds }) {
  const videoRef = useRef(null);
  const peerId = Array.from((peerUserIds || new Map()).entries()).find(([, uid]) => uid === participant.user_id)?.[0];
  const remoteStream = peerId ? remoteStreams?.get(peerId) : undefined;
  const hasVideo = participant.is_video_enabled && !!remoteStream;

  const roleColor = participant.role === 'host' ? '#D4AF37'
    : participant.role === 'co-host' ? '#D4AF37'
    : participant.role === 'speaker' ? '#6DBF7E'
    : 'rgba(255,255,255,0.2)';

  useEffect(() => {
    if (videoRef.current && remoteStream) videoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const getRoleColor = (role) => {
    switch(role) {
      case 'host': return 'bg-[#7B5DA6]';
      case 'co-host': return 'bg-blue-500';
      case 'speaker': return 'bg-[#6DBF7E]';
      case 'guest': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center gap-1.5"
    >
      <Card className={`${speaking ? 'ring-2 ring-green-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex flex-col items-center gap-3">
            {/* Video/Avatar */}
            <div className="relative">
              {participant.is_video_enabled && remoteStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-32 h-32 object-cover"
                  style={{
                    clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
                    boxShadow: '0 0 20px rgba(212,175,55,0.4)'
                  }}
                />
              ) : (
                <div style={{
                  clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
                  boxShadow: '0 0 20px rgba(212,175,55,0.4)'
                }}>
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={participant.user_avatar} />
                    <AvatarFallback className="text-2xl">
                      {participant.user_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              {/* Status Indicator */}
              <div className="absolute top-2 right-2 flex gap-1">
                {participant.is_streaming && (
                  <Badge className="bg-[#C0392B] text-white text-xs animate-pulse">
                    LIVE
                  </Badge>
                )}
              </div>

              {/* Audio Status */}
              <div className={`absolute bottom-2 right-2 p-2 rounded-full ${
                participant.is_audio_enabled ? 'bg-[#6DBF7E]' : 'bg-[#C0392B]'
              }`}>
                {participant.is_audio_enabled ? (
                  <Mic className="w-4 h-4 text-white" />
                ) : (
                  <MicOff className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
          )}
        </div>
        {/* Muted badge */}
        {!participant.is_audio_enabled && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#EF4444', border: '2px solid #080B18' }}>
            <MicOff className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {/* LIVE badge */}
        {participant.is_streaming && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-black text-white animate-pulse"
            style={{ background: '#EF4444' }}>
            LIVE
          </div>
        )}
        {isCurrentUser && (
          <div className="absolute -top-1 left-0 right-0 flex justify-center">
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
              style={{ background: '#D4AF37', color: '#000' }}>You</span>
          </div>
        )}
      </div>
      {/* Name + role */}
      <div className="text-center">
        <p className="text-[11px] font-bold text-white truncate" style={{ maxWidth: 136, fontFamily: 'Barlow Condensed, sans-serif' }}>
          {participant.user_name}
        </p>
        <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded"
          style={{ background: `${roleColor}22`, color: roleColor, border: `1px solid ${roleColor}44`, fontFamily: 'Barlow Condensed, sans-serif' }}>
          {participant.role}
        </span>
      </div>
      {/* Current user controls */}
      {isCurrentUser && (
        <div className="flex gap-1.5">
          <Button size="sm" variant={participant.is_audio_enabled ? "default" : "destructive"}
            className="h-7 w-7 p-0"
            onClick={() => onUpdateParticipant(participant.id, { is_audio_enabled: !participant.is_audio_enabled })}>
            {participant.is_audio_enabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
          </Button>
          <Button size="sm" variant={participant.is_video_enabled ? "default" : "outline"}
            className="h-7 w-7 p-0"
            onClick={() => onUpdateParticipant(participant.id, { is_video_enabled: !participant.is_video_enabled })}>
            {participant.is_video_enabled ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
