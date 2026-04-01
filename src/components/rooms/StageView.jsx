import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Mic, MicOff, Video, VideoOff, MonitorUp, Hand, 
  Settings, UserPlus, MoreVertical, Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'framer-motion';

export default function StageView({ stage, participants, currentUserId, onUpdateParticipant }) {
  const stageParticipants = participants.filter(p => p.stage_id === stage.id);
  const speakers = stageParticipants.filter(p => 
    ['host', 'co-host', 'speaker', 'guest'].includes(p.role)
  );

  const getLayoutClass = () => {
    switch(stage.layout) {
      case 'spotlight':
        return 'grid-cols-1';
      case 'sidebar':
        return 'grid-cols-3';
      default:
        const count = speakers.length;
        if (count <= 2) return 'grid-cols-2';
        if (count <= 4) return 'grid-cols-2';
        if (count <= 6) return 'grid-cols-3';
        return 'grid-cols-4';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">{stage.name}</CardTitle>
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
            {speakers.map((participant) => (
              <ParticipantTile
                key={participant.id}
                participant={participant}
                isCurrentUser={participant.user_id === currentUserId}
                onUpdateParticipant={onUpdateParticipant}
              />
            ))}
          </AnimatePresence>
        </div>

        {speakers.length === 0 && (
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

function ParticipantTile({ participant, isCurrentUser, onUpdateParticipant }) {
  const [speaking, setSpeaking] = useState(false);

  const getRoleColor = (role) => {
    switch(role) {
      case 'host': return 'bg-purple-500';
      case 'co-host': return 'bg-blue-500';
      case 'speaker': return 'bg-green-500';
      case 'guest': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative"
    >
      <Card className={`overflow-hidden ${speaking ? 'ring-2 ring-green-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex flex-col items-center gap-3">
            {/* Video/Avatar */}
            <div className="relative">
              {participant.is_video_enabled ? (
                <div className="w-32 h-32 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Video className="w-8 h-8 text-gray-400" />
                  <span className="absolute bottom-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                    Video Stream
                  </span>
                </div>
              ) : (
                <Avatar className="w-32 h-32">
                  <AvatarImage src={participant.user_avatar} />
                  <AvatarFallback className="text-2xl">
                    {participant.user_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              {/* Status Indicator */}
              <div className="absolute top-2 right-2 flex gap-1">
                {participant.is_streaming && (
                  <Badge className="bg-red-500 text-white text-xs animate-pulse">
                    LIVE
                  </Badge>
                )}
              </div>

              {/* Audio Status */}
              <div className={`absolute bottom-2 right-2 p-2 rounded-full ${
                participant.is_audio_enabled ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {participant.is_audio_enabled ? (
                  <Mic className="w-4 h-4 text-white" />
                ) : (
                  <MicOff className="w-4 h-4 text-white" />
                )}
              </div>
            </div>

            {/* Name and Role */}
            <div className="text-center w-full">
              <div className="flex items-center justify-center gap-2">
                <p className="font-medium truncate">{participant.user_name}</p>
                {isCurrentUser && (
                  <Badge variant="outline" className="text-xs">You</Badge>
                )}
              </div>
              <Badge className={`${getRoleColor(participant.role)} text-white text-xs mt-1`}>
                {participant.role}
              </Badge>
            </div>

            {/* Controls (only for current user) */}
            {isCurrentUser && (
              <div className="flex gap-2 w-full">
                <Button
                  size="sm"
                  variant={participant.is_audio_enabled ? "default" : "destructive"}
                  className="flex-1"
                  onClick={() => onUpdateParticipant(participant.id, {
                    is_audio_enabled: !participant.is_audio_enabled
                  })}
                >
                  {participant.is_audio_enabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant={participant.is_video_enabled ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => onUpdateParticipant(participant.id, {
                    is_video_enabled: !participant.is_video_enabled
                  })}
                >
                  {participant.is_video_enabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}