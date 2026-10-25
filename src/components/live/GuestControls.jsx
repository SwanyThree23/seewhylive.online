import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mic, MicOff, Volume2, VolumeX, Trash2, Shield, MicOff as MuteAll } from 'lucide-react';

export default function GuestControls({ participants = [], onMuteGuest, onRemoveGuest, speakingIds = [] }) {
  const [expanded, setExpanded] = useState(true);
  const [mutedGuests, setMutedGuests] = useState({});
  const [volumes, setVolumes] = useState({});
  const [openVolume, setOpenVolume] = useState(null);

  const handleMute = (guestId) => {
    setMutedGuests(prev => ({ ...prev, [guestId]: !prev[guestId] }));
    onMuteGuest?.(guestId);
  };

  const handleMuteAll = () => {
    const allMuted = {};
    participants.forEach(g => { allMuted[g.id] = true; });
    setMutedGuests(allMuted);
    participants.forEach(g => onMuteGuest?.(g.id));
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
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#800020]/20 text-[#C9A84C]">
            {participants.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {participants.length > 0 && (
            <button
              onClick={e => { e.stopPropagation(); handleMuteAll(); }}
              className="px-2 py-0.5 rounded text-[9px] font-black uppercase"
              style={{ background: 'rgba(192,57,43,0.15)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.3)' }}
              title="Mute all guests"
            >
              Mute All
            </button>
          )}
          <span className="text-white/30 text-[10px]">{expanded ? '▲' : '▼'}</span>
        </div>
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
                          {speakingIds.includes(guest.id) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6DBF7E] animate-pulse shrink-0" />
                          )}
                          <p className="text-xs font-semibold text-white truncate">{guest.user_name}</p>
                          {guest.role === 'co-host' && (
                            <Shield className="w-3 h-3 text-[#d4af37] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-white/40 capitalize">{guest.role}</p>
                        {openVolume === guest.id && (
                          <input type="range" min={0} max={100} value={volumes[guest.id] ?? 100}
                            onChange={e => setVolumes(prev => ({ ...prev, [guest.id]: Number(e.target.value) }))}
                            className="w-full mt-1 h-1 accent-[#D4AF37]" />
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Mute/Unmute */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleMute(guest.id)}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                            mutedGuests[guest.id]
                              ? 'bg-red-900/60 text-[#C0392B] border border-red-600'
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
                          onClick={() => setOpenVolume(prev => prev === guest.id ? null : guest.id)}
                          className="w-6 h-6 rounded flex items-center justify-center transition-all"
                          style={{ background: openVolume === guest.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)', color: openVolume === guest.id ? '#D4AF37' : 'rgba(255,255,255,0.5)', border: `1px solid ${openVolume === guest.id ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}` }}
                          title="Adjust volume"
                        >
                          <Volume2 className="w-3 h-3" />
                        </motion.button>

                        {/* Remove */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleRemove(guest.id)}
                          className="w-6 h-6 rounded flex items-center justify-center bg-red-900/20 hover:bg-red-900/40 text-[#C0392B] border border-red-600/30 transition-all"
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
