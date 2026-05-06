import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Maximize2, Minimize2, Mic, MicOff, Video, VideoOff, Radio, Swords, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GuestRTMPPanel from '@/components/streaming/GuestRTMPPanel';
import BattleMode from '@/components/streaming/BattleMode';
import GreenroomQueue from '@/components/streaming/GreenroomQueue';

export default function MultiGuestPanel({ participants = [], spotlightId, onSpotlight, maxGuests = 20, roomId, isHost }) {
  const [layout, setLayout] = useState('grid'); // 'grid' | 'spotlight' | 'battle'
  const [tab, setTab] = useState('stage'); // 'stage' | 'greenroom'

  const speakers = participants
    .filter(p => ['host', 'co-host', 'speaker', 'guest'].includes(p.role))
    .slice(0, maxGuests);

  const getGridCols = () => {
    const count = speakers.length;
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    if (count <= 16) return 'grid-cols-4';
    return 'grid-cols-5';
  };

  return (
    <div className="h-full bg-[#2A1F1F] rounded-xl border-2 border-[#800020]/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-[#800020] text-[#D4AF37] border-[#D4AF37]">
            <Radio className="w-3 h-3 mr-1" />
            {speakers.length}/{maxGuests} GUESTS LIVE
          </Badge>
        </div>
        
        <div className="flex gap-1">
          {['grid', 'spotlight', 'battle'].map(l => (
            <Button
              key={l}
              size="sm"
              variant={layout === l ? 'default' : 'outline'}
              onClick={() => setLayout(l)}
              className={`text-[10px] h-6 px-2 ${layout === l ? 'bg-[#800020] text-[#D4AF37] border-[#D4AF37]' : 'border-white/20 text-white/50 bg-transparent'}`}
            >
              {l === 'battle' ? <Swords className="w-3 h-3" /> : l.charAt(0).toUpperCase() + l.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs: Stage vs Greenroom */}
      <div className="flex gap-1 mb-3">
        {[{ id: 'stage', icon: Radio, label: 'Stage' }, { id: 'greenroom', icon: Users, label: 'Queue' }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-all ${
              tab === t.id ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10' : 'border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            <t.icon className="w-2.5 h-2.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'greenroom' ? (
        <GreenroomQueue roomId={roomId} isHost={isHost} />
      ) : layout === 'battle' ? (
        <BattleMode roomId={roomId} isHost={isHost} participants={participants} />
      ) : layout === 'grid' ? (
        <div className={`grid ${getGridCols()} gap-3 auto-rows-fr`}>
          <AnimatePresence>
            {speakers.map((participant) => (
              <GuestTile
                key={participant.id}
                participant={participant}
                isSpotlight={false}
                onSpotlight={onSpotlight}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="h-full flex flex-col gap-3">
          {spotlightId && (
            <div className="flex-1">
              <GuestTile
                participant={speakers.find(p => p.id === spotlightId)}
                isSpotlight={true}
                onSpotlight={onSpotlight}
              />
            </div>
          )}
          
          <div className="grid grid-cols-6 gap-2 h-24">
            {speakers
              .filter(p => p.id !== spotlightId)
              .map((participant) => (
                <GuestTile
                  key={participant.id}
                  participant={participant}
                  isSpotlight={false}
                  onSpotlight={onSpotlight}
                  compact
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}  // closes tab === 'greenroom' ternary

function GuestTile({ participant, isSpotlight, onSpotlight, compact = false }) {
  const [showRTMP, setShowRTMP] = useState(false);
  if (!participant) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`relative group ${compact ? 'h-full' : ''}`}
    >
      <Card className={`${
        isSpotlight ? 'h-full' : compact ? 'h-full' : 'aspect-video'
      } bg-[#3C2F2F] border-2 ${
        participant.is_streaming ? 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'border-[#800020]/30'
      } overflow-hidden relative`}>
        <CardContent className="p-0 h-full">
          {/* Video/Avatar Display */}
          <div className="relative w-full h-full bg-gradient-to-br from-[#3C2F2F] to-[#2A1F1F] flex items-center justify-center">
            <Avatar className={isSpotlight ? 'w-32 h-32' : compact ? 'w-12 h-12' : 'w-20 h-20'}>
              <AvatarImage src={participant.user_avatar} />
              <AvatarFallback className="bg-[#800020] text-[#D4AF37] text-xl font-bold">
                {participant.user_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Streaming Indicator */}
            {participant.is_streaming && (
              <Badge className="absolute top-2 right-2 bg-red-600 text-white animate-pulse">
                <Radio className="w-2 h-2 mr-1" />
                LIVE
              </Badge>
            )}

            {/* Name & Status Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className={`text-[#F5E6D3] font-semibold truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                    {participant.user_name}
                  </p>
                  {!compact && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-[10px] border-[#D4AF37] text-[#D4AF37]">
                        {participant.role}
                      </Badge>
                    </div>
                  )}
                </div>

                {!compact && (
                  <div className="flex items-center gap-1">
                    {participant.is_audio_enabled ? (
                      <Mic className="w-3 h-3 text-green-400" />
                    ) : (
                      <MicOff className="w-3 h-3 text-red-400" />
                    )}
                    {participant.is_video_enabled && (
                      <Video className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Expand Button */}
            {!compact && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onSpotlight?.(participant.id)}
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-[#800020]/80 text-[#D4AF37]"
              >
                {isSpotlight ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            )}

            {/* RTMP Toggle Button */}
            {!compact && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowRTMP(v => !v)}
                title="Configure RTMP destinations"
                className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all bg-black/50 hover:bg-[#D4AF37]/20 ${
                  showRTMP ? 'opacity-100 text-[#D4AF37] bg-[#D4AF37]/20' : 'text-white/60'
                }`}
              >
                <Radio className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Collapsible RTMP Panel */}
      <AnimatePresence>
        {showRTMP && !compact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-1"
          >
            <GuestRTMPPanel
              participantId={participant.id}
              userId={participant.user_id || participant.id}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}