import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Clock, Radio, Users, Copy, AlertCircle, Wifi } from 'lucide-react';
import { toast } from 'sonner';

/**
 * GreenroomQueue — real-time director dashboard.
 * Guests who arrive via /GuestJoin appear here instantly via base44 real-time subscription.
 */
export default function GreenroomQueue({ roomId, isHost }) {
  const [guestSearch, setGuestSearch] = useState('');
  const qc = useQueryClient();

  // Fetch all stage participants for this room
  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['greenroom', roomId],
    queryFn: () => base44.entities.Participant.filter({ room_id: roomId }),
    enabled: !!roomId,
  });

  // Real-time subscription: update instantly on any participant change
  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.Participant.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      qc.setQueryData(['greenroom', roomId], (prev = []) => {
        if (event.type === 'create') {
          toast.info(`🎙️ ${event.data.user_name} joined the greenroom`, { duration: 3000 });
          return [...prev.filter(p => p.id !== event.data.id), event.data];
        }
        if (event.type === 'update') {
          const updated = prev.map(p => p.id === event.id ? event.data : p);
          const changed = prev.find(p => p.id === event.id);
          if (changed && changed.status !== event.data.status) {
            toast.info(`${event.data.user_name} is now ${event.data.status}`);
          }
          return updated;
        }
        if (event.type === 'delete') {
          return prev.filter(p => p.id !== event.id);
        }
        return prev;
      });
    });
    return unsub;
  }, [roomId, qc]);

  const admitMutation = useMutation({
    mutationFn: (participant) => base44.entities.Participant.update(participant.id, {
      status: 'admitted',
      role: participant.role === 'viewer' ? 'guest' : participant.role,
    }),
    onSuccess: (_, p) => toast.success(`✅ ${p.user_name} admitted to stage`),
  });

  const rejectMutation = useMutation({
    mutationFn: (participant) => base44.entities.Participant.update(participant.id, { status: 'rejected' }),
    onSuccess: (_, p) => toast.error(`${p.user_name} removed from queue`),
  });

  const waitingGuests = participants.filter(p =>
    (p.status === 'waiting' || p.status === 'ready') &&
    (!guestSearch || p.user_name?.toLowerCase().includes(guestSearch.toLowerCase()))
  );

  const liveGuests = participants.filter(p => p.status === 'admitted');

  const copyJoinLink = () => {
    const link = `${window.location.origin}/GuestJoin?room=${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success('Guest join link copied!');
  };

  if (!roomId) return null;

  return (
    <div className="space-y-3">
      {/* Header + invite */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">Greenroom</span>
          {waitingGuests.length > 0 && (
            <Badge className="bg-red-600 text-white text-[9px] animate-pulse border-0">
              {waitingGuests.length} waiting
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={copyJoinLink}
          className="h-6 text-[9px] border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 px-2"
        >
          <Copy className="w-2.5 h-2.5 mr-1" /> Invite Link
        </Button>
      </div>

      {/* Live guests */}
      {liveGuests.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9px] text-white/30 uppercase tracking-wider">On Stage</p>
          {liveGuests.map(p => (
            <GuestRow key={p.id} participant={p} status="live" />
          ))}
        </div>
      )}

      {/* Search */}
      <Input
        placeholder="Search guests…"
        value={guestSearch}
        onChange={e => setGuestSearch(e.target.value)}
        className="h-7 text-[10px] bg-white/5 border-white/10 text-white placeholder:text-white/30"
      />

      {/* Waiting queue */}
      <div className="space-y-2">
        <p className="text-[9px] text-white/30 uppercase tracking-wider">
          Waiting ({waitingGuests.length})
        </p>

        {isLoading ? (
          <div className="text-center py-4 text-[10px] text-white/30">Loading…</div>
        ) : waitingGuests.length === 0 ? (
          <div className="text-center py-6 text-[10px] text-white/20 border border-dashed border-white/10 rounded-lg">
            <Wifi className="w-5 h-5 mx-auto mb-1 opacity-30" />
            No guests in queue
          </div>
        ) : (
          <AnimatePresence>
            {waitingGuests.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#800020] to-[#d4af37] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {p.user_name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white truncate">{p.user_name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <StatusDot status={p.status} />
                    <span className="text-[9px] text-white/40 capitalize">{p.status}</span>
                  </div>
                </div>
                {isHost && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => admitMutation.mutate(p)}
                      disabled={admitMutation.isPending}
                      className="w-6 h-6 rounded flex items-center justify-center bg-green-800/50 hover:bg-green-600 border border-green-500/30 transition-all"
                      title="Admit"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(p)}
                      disabled={rejectMutation.isPending}
                      className="w-6 h-6 rounded flex items-center justify-center bg-red-900/50 hover:bg-red-700 border border-red-500/20 transition-all"
                      title="Reject"
                    >
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function GuestRow({ participant, status }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-green-900/20 border border-green-500/20 rounded-lg">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-700 to-emerald-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
        {participant.user_name?.charAt(0)?.toUpperCase()}
      </div>
      <p className="text-[10px] font-semibold text-white truncate flex-1">{participant.user_name}</p>
      <Badge className="bg-green-700 text-white text-[8px] border-0 animate-pulse px-1">
        <Radio className="w-2 h-2 mr-0.5" /> LIVE
      </Badge>
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    waiting: 'bg-yellow-400',
    ready: 'bg-green-400 animate-pulse',
    admitted: 'bg-blue-400',
    rejected: 'bg-red-400',
  };
  return <span className={`w-1.5 h-1.5 rounded-full ${colors[status] || 'bg-white/20'}`} />;
}