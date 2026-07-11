import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

/**
 * Host-only panel: manage pending guest requests to co-host.
 * Approve → guest moves to "active" participants
 * Reject → participant record deleted
 */
export default function ZEGOGuestApprovalPanel({ roomId, isHost }) {
  const qc = useQueryClient();

  // Fetch pending participants
  const { data: pendingGuests = [] } = useQuery({
    queryKey: ['pending-guests', roomId],
    queryFn: () => base44.entities.Participant.filter({ room_id: roomId, status: 'pending' }),
    enabled: !!roomId && isHost,
    refetchInterval: 2000,
  });

  const approveMut = useMutation({
    mutationFn: (participantId) =>
      base44.entities.Participant.update(participantId, { status: 'active', approved_at: new Date().toISOString() }),
    onSuccess: () => {
      qc.invalidateQueries(['pending-guests']);
      toast.success('Guest approved');
    },
  });

  const rejectMut = useMutation({
    mutationFn: (participantId) => base44.entities.Participant.delete(participantId),
    onSuccess: () => {
      qc.invalidateQueries(['pending-guests']);
      toast.success('Guest request declined');
    },
  });

  if (!isHost || pendingGuests.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-3 space-y-2"
      style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
      
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-3.5 h-3.5" style={{ color: GOLD }} />
        <span className="text-[11px] font-black uppercase" style={{ color: GOLD, ...T }}>
          {pendingGuests.length} Join Request{pendingGuests.length !== 1 ? 's' : ''}
        </span>
      </div>

      <AnimatePresence>
        {pendingGuests.map((guest) => (
          <motion.div
            key={guest.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center justify-between gap-2 p-2 rounded-lg"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
            
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-white truncate">{guest.user_name}</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Wants to co-host</p>
            </div>

            <div className="flex items-center gap-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => approveMut.mutate(guest.id)}
                disabled={approveMut.isPending}
                className="flex items-center justify-center w-7 h-7 rounded transition-all"
                style={{ background: 'rgba(109,191,126,0.15)', border: '1px solid rgba(109,191,126,0.3)', color: '#6DBF7E' }}>
                <Check className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => rejectMut.mutate(guest.id)}
                disabled={rejectMut.isPending}
                className="flex items-center justify-center w-7 h-7 rounded transition-all"
                style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', color: '#C0392B' }}>
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}