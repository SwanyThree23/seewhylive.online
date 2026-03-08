import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Rocket, Search, Users, Radio, Send } from 'lucide-react';
import { toast } from 'sonner';
import { fireAlert } from './HostAlertCenter';

export default function RaidPanel({ roomId, currentUser, viewerCount }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);
  const searchTimeout = useRef(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    searchTimeout.current = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  const { data: liveRooms = [] } = useQuery({
    queryKey: ['live-rooms-for-raid', debouncedQuery],
    queryFn: () => base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 20),
    enabled: true,
  });

  const filteredRooms = liveRooms.filter(r =>
    r.host_id !== currentUser?.id &&
    r.title?.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const raidMutation = useMutation({
    mutationFn: (data) => base44.entities.RaidEvent.create(data),
    onSuccess: () => toast.success(`Raid sent to ${selectedCreator?.title}!`),
  });

  const startCountdown = () => {
    if (!selectedCreator) return;
    setCountdown(10);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          executeRaid();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executeRaid = () => {
    raidMutation.mutate({
      from_creator_id: currentUser?.id,
      from_creator_username: currentUser?.full_name || currentUser?.email,
      from_room_id: roomId,
      to_creator_id: selectedCreator?.host_id,
      to_creator_username: selectedCreator?.title,
      to_room_id: selectedCreator?.id,
      viewer_count_sent: viewerCount,
      status: 'active',
    });
    fireAlert({ type: 'milestone', duration: 8000, title: `🚀 Raiding ${selectedCreator?.title} with ${viewerCount} viewers!` });
    setSelectedCreator(null);
    setCountdown(null);
  };

  const cancelCountdown = () => {
    clearInterval(countdownRef.current);
    setCountdown(null);
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2">
        <Rocket className="w-5 h-5 text-[#f97316]" />
        <h3 className="font-semibold text-white">Raid Another Creator</h3>
      </div>

      {/* Raid countdown overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backdropFilter: 'blur(8px)', background: 'rgba(13,6,24,0.9)' }}
          >
            <div className="text-center">
              <p className="text-white/70 mb-2 text-lg">Raiding</p>
              <p className="text-2xl font-bold text-[#f97316] mb-4">{selectedCreator?.title}</p>
              <div className="relative mb-6">
                {[3, 2, 1].map(ring => (
                  <motion.div
                    key={ring}
                    className="absolute inset-0 rounded-full border-2 border-[#f97316]"
                    animate={{ scale: [1, 1 + ring * 0.4], opacity: [0.6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: ring * 0.2 }}
                  />
                ))}
                <div className="w-28 h-28 rounded-full bg-[#f97316] flex items-center justify-center mx-auto">
                  <span className="text-5xl font-bold text-white font-mono">{countdown}</span>
                </div>
              </div>
              <p className="text-white/50 mb-4">Sending {viewerCount} viewers...</p>
              <Button variant="outline" onClick={cancelCountdown} className="border-white/20 text-white/60">
                Cancel Raid
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search live creators..."
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25"
        />
      </div>

      {/* Selected preview */}
      {selectedCreator && countdown === null && (
        <motion.div
          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-[#f97316]/10 border border-[#f97316]/30 rounded-xl"
        >
          <p className="text-xs text-[#f97316] mb-2 font-semibold">Selected for Raid</p>
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-[#f97316]/20 text-[#f97316] font-bold">
                {selectedCreator.title?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-white">{selectedCreator.title}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                <Users className="w-3 h-3" />{selectedCreator.viewer_count || 0} viewers
              </div>
            </div>
          </div>
          <p className="text-xs text-white/50 mb-3">
            Send your <strong className="text-[#f97316]">{viewerCount}</strong> viewers to this stream?
          </p>
          <div className="flex gap-2">
            <Button onClick={startCountdown} className="flex-1 bg-[#f97316] hover:bg-[#fb923c] text-white font-bold gap-1.5">
              <Rocket className="w-4 h-4" /> Start Raid!
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedCreator(null)} className="text-white/40">
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Live rooms list */}
      <div className="space-y-2">
        <p className="text-[10px] text-white/30 uppercase">Live Now</p>
        {filteredRooms.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-6">No live creators found</p>
        ) : filteredRooms.map(room => (
          <motion.button
            key={room.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedCreator(room)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              selectedCreator?.id === room.id
                ? 'border-[#f97316]/50 bg-[#f97316]/10'
                : 'border-white/5 bg-white/3 hover:border-white/10'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-[#800020] to-[#d4af37] text-white text-xs font-bold">
                {room.title?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{room.title}</p>
              <div className="flex items-center gap-2 text-[10px] text-white/40">
                <Users className="w-3 h-3" />{room.viewer_count || 0}
                {room.type && <span>· {room.type}</span>}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}