import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mic, MicOff, Volume2, VolumeX, Trash2, Shield } from 'lucide-react';

export default function GuestControls({ participants = [], onMuteGuest, onRemoveGuest }) {
  const [expanded, setExpanded] = useState(true);
  const [mutedGuests, setMutedGuests] = useState({});

  const handleMute = (guestId) => {
    setMutedGuests(prev => ({ ...prev, [guestId]: !prev[guestId] }));
    onMuteGuest?.(guestId);
  };

  const handleRemove = (guestId) => {
    onRemoveGuest?.(guestId);
  };

  return (
    <div className="bg-[rgba(8,11,24,0.9)] border border-[rgba(212,175,55,0.15)] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-semibold text-white">Guest Controls</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-purple-900/30 text-purple-300">
            {participants.length}
          </span>
        </div>
        <span className="text-white/30 text-[10px]">{expanded ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="max-h-64 overflow-y-auto">
              {participants.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-[10px] text-white/40">No guests on stage</p>
                </div>
              ) : (
                participants.map(guest => (
                  <div
                    key={guest.id}
                    className="px-3 py-2.5 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white truncate">{guest.user_name}</p>
                          {guest.role === 'co-host' && (
                            <Shield className="w-3 h-3 text-[#d4af37] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-white/40 capitalize">{guest.role}</p>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Mute/Unmute */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleMute(guest.id)}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                            mutedGuests[guest.id]
                              ? 'bg-red-900/60 text-red-400 border border-red-600'
                              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                          }`}
                          title={mutedGuests[guest.id] ? 'Unmute' : 'Mute'}
                        >
                          {mutedGuests[guest.id] ? (
                            <MicOff className="w-3 h-3" />
                          ) : (
                            <Mic className="w-3 h-3" />
                          )}
                        </motion.button>

                        {/* Volume */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          className="w-6 h-6 rounded flex items-center justify-center bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 transition-all"
                          title="Adjust volume"
                        >
                          <Volume2 className="w-3 h-3" />
                        </motion.button>

                        {/* Remove */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleRemove(guest.id)}
                          className="w-6 h-6 rounded flex items-center justify-center bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-600/30 transition-all"
                          title="Remove guest"
                        >
                          <Trash2 className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}