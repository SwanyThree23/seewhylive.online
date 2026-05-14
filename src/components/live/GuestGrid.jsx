import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mic, MicOff, Video, VideoOff, Maximize2, Minimize2, Crown, Link, MoreHorizontal, X, Pin, Radio } from 'lucide-react';
import GuestDestinationsPanel from './GuestDestinationsPanel';
import GuestStreamingPermissions from './GuestStreamingPermissions';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const LAYOUTS = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '4', value: 4 },
  { label: '6', value: 6 },
  { label: '9', value: 9 },
  { label: '12', value: 12 },
  { label: '20', value: 20 },
];

function getGridClass(count, maxSlots) {
  if (maxSlots <= 1) return 'grid-cols-1';
  if (maxSlots <= 2) return 'grid-cols-2';
  if (maxSlots <= 4) return 'grid-cols-2';
  if (maxSlots <= 6) return 'grid-cols-3';
  if (maxSlots <= 9) return 'grid-cols-3';
  if (maxSlots <= 12) return 'grid-cols-4';
  return 'grid-cols-4 md:grid-cols-5';
}

export default React.memo(function GuestGrid({ participants = [], isHost, onInvite, hostId, maxGuests = 20 }) {
  const [layoutSlots, setLayoutSlots] = useState(4);
  const [spotlightId, setSpotlightId] = useState(null);
  const [audioStates, setAudioStates] = useState({});
  const [showDestsFor, setShowDestsFor] = useState(null);

  const speakers = participants
    .filter(p => ['host', 'co-host', 'speaker', 'guest'].includes(p.role))
    .slice(0, maxGuests);

  const empty = Math.max(0, layoutSlots - speakers.length);

  const handleSpotlight = (id) => setSpotlightId(prev => prev === id ? null : id);

  const spotlightGuest = spotlightId ? speakers.find(s => s.id === spotlightId) : null;

  return (
    <div className="h-full bg-[rgba(13,6,24,0.7)] rounded-xl border border-[rgba(212,175,55,0.15)] flex flex-col overflow-hidden">
      {/* Per-guest destinations panel (host only) */}
      {isHost && showDestsFor && (
        <div className="shrink-0 px-2 pt-2">
          <GuestDestinationsPanel participantUserId={showDestsFor} guestName={participants.find(p => p.user_id === showDestsFor)?.user_name || 'Guest'} />
        </div>
      )}
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 shrink-0">
        <Badge className="bg-[#800020]/60 text-[#d4af37] border-[#d4af37]/30 text-[10px]">
          {speakers.length}/{maxGuests} on stage
        </Badge>
        <div className="flex gap-1 ml-auto">
          {LAYOUTS.map(l => (
            <button
              key={l.value}
              onClick={() => setLayoutSlots(l.value)}
              className={`text-[10px] w-6 h-5 rounded border transition-all ${
                layoutSlots === l.value
                  ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10'
                  : 'border-white/10 text-white/40 hover:border-white/20'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spotlight layout */}
      {spotlightGuest ? (
        <div className="flex-1 flex flex-col gap-2 p-2 overflow-hidden">
          <GuestTile
            participant={spotlightGuest}
            isSpotlight
            isHost={spotlightGuest.user_id === hostId}
            isHostUser={isHost}
            onSpotlight={handleSpotlight}
          />
          <div className="flex gap-2 h-20 shrink-0 overflow-x-auto">
            {speakers.filter(s => s.id !== spotlightId).map(p => (
              <div key={p.id} className="w-28 shrink-0 h-full">
                <GuestTile participant={p} compact isHost={p.user_id === hostId} isHostUser={isHost} onSpotlight={handleSpotlight} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`flex-1 p-2 grid ${getGridClass(speakers.length, layoutSlots)} gap-2 content-start overflow-auto`}>
          <AnimatePresence>
            {speakers.map(p => (
              <GuestTile key={p.id} participant={p} isHost={p.user_id === hostId} isHostUser={isHost} onSpotlight={handleSpotlight} />
            ))}
            {Array.from({ length: Math.min(empty, 4) }).map((_, i) => (
              <EmptySlot key={`empty-${i}`} onInvite={onInvite} isHost={isHost} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

function GuestTile({ participant, isSpotlight, compact, isHost: isHostUser, onSpotlight, isHostUser: hostCtrl }) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (compact) return;
    const interval = setInterval(() => setSpeaking(Math.random() > 0.6), 800);
    return () => clearInterval(interval);
  }, [compact]);

  const connDots = Math.floor(Math.random() * 2) + 2;
  const gradient = `from-[${['#1a0030', '#001a2c', '#1a1a00', '#001a00'][Math.abs(participant.user_name?.charCodeAt(0) || 0) % 4]}] to-[#0d0618]`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`relative group ${isSpotlight ? 'flex-1' : compact ? 'h-full' : 'aspect-video'}`}
    >
      <div
        className={`w-full h-full rounded-lg border-2 overflow-hidden bg-gradient-to-br from-[#1a0a20] to-[#0d0618] flex flex-col relative transition-all duration-200 ${
          speaking && !compact
            ? 'border-[#00d4ff] shadow-[0_0_16px_rgba(0,212,255,0.4)]'
            : 'border-white/10 group-hover:border-[#d4af37]/40'
        }`}
      >
        {/* Center avatar */}
        <div className="flex-1 flex items-center justify-center">
          <Avatar className={isSpotlight ? 'w-24 h-24' : compact ? 'w-10 h-10' : 'w-14 h-14'}>
            <AvatarFallback className="bg-gradient-to-br from-[#800020] to-[#d4af37] text-white font-bold text-xl">
              {participant.user_name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {speaking && !compact && (
            <div className="absolute flex items-end gap-0.5 bottom-10 left-1/2 -translate-x-1/2">
              {[3, 5, 4, 6, 3].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [h, h * 1.8, h] }}
                  transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.05 }}
                  className="w-0.5 rounded-full bg-[#00d4ff]"
                  style={{ height: h }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              {isHostUser && <Crown className="w-3 h-3 text-[#d4af37] shrink-0" />}
              <p className={`text-white font-semibold truncate ${compact ? 'text-[9px]' : 'text-xs'}`}>
                {participant.user_name}
              </p>
            </div>
            {!compact && (
              <div className="flex items-center gap-1 shrink-0">
                {participant.is_audio_enabled !== false
                  ? <Mic className="w-2.5 h-2.5 text-green-400" />
                  : <MicOff className="w-2.5 h-2.5 text-red-400" />}
                {Array.from({ length: connDots }).map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-green-400" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hover controls */}
        {!compact && (
          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={() => onSpotlight?.(participant.id)}
              className="w-6 h-6 rounded bg-black/60 hover:bg-[#d4af37]/20 flex items-center justify-center"
            >
              {isSpotlight ? <Minimize2 className="w-3 h-3 text-white" /> : <Maximize2 className="w-3 h-3 text-white" />}
            </button>
            {hostCtrl && (
              <GuestStreamingPermissions
                participant={participant}
                isHost={hostCtrl}
                onPermissionChange={() => {}}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EmptySlot({ onInvite, isHost }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="aspect-video rounded-lg border-2 border-dashed border-white/10 hover:border-[#d4af37]/30 transition-all flex items-center justify-center group cursor-pointer"
      onClick={onInvite}
    >
      {isHost && (
        <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Link className="w-5 h-5 text-[#d4af37]/50 mx-auto mb-1" />
          <p className="text-[10px] text-white/30">Invite Guest</p>
        </div>
      )}
    </motion.div>
  );
}