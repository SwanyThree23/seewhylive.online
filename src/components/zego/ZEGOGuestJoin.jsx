import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

/**
 * Allows viewers/guests to request co-hosting on a live ZEGO stream.
 * Host approves → guest is added to participants roster in database.
 */
export default function ZEGOGuestJoin({ roomId, userId, userName, onJoined }) {
  const qc = useQueryClient();
  const [requestSent, setRequestSent] = useState(false);

  const requestJoinMut = useMutation({
    mutationFn: async () => {
      // Create participant record (pending approval)
      const result = await base44.entities.Participant.create({
        room_id: roomId,
        user_id: userId,
        user_name: userName,
        role: 'guest',
        status: 'pending',
        joined_at: new Date().toISOString(),
      });
      return result;
    },
    onSuccess: () => {
      setRequestSent(true);
      toast.success('Join request sent to host');
      qc.invalidateQueries(['participants', roomId]);
      setTimeout(() => onJoined?.(), 2000);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to request join');
    },
  });

  const handleRequestJoin = () => {
    requestJoinMut.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 text-center space-y-3"
      style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)' }}>
      
      {requestSent ? (
        <>
          <div className="flex items-center justify-center gap-2" style={{ color: '#00FF88' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00FF88' }} />
            <span className="text-sm font-black uppercase" style={{ ...T }}>Waiting for Host</span>
          </div>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Your request to co-host has been sent
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" style={{ color: GOLD }} />
            <span className="text-xs font-bold" style={{ color: GOLD, ...T }}>Want to Co-Host?</span>
          </div>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Request to join this live stream and share your camera
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRequestJoin}
            disabled={requestJoinMut.isPending}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg font-black uppercase text-[11px] transition-all"
            style={{
              background: GOLD,
              color: '#000',
              ...T,
              opacity: requestJoinMut.isPending ? 0.6 : 1,
            }}>
            <LogIn className="w-4 h-4" />
            {requestJoinMut.isPending ? 'Requesting…' : 'Request to Co-Host'}
          </motion.button>
        </>
      )}
    </motion.div>
  );
}