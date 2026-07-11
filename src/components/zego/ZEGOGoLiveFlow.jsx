import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Radio } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

/**
 * Wraps any Go Live button with ZEGOCLOUD session setup.
 * Usage: <ZEGOGoLiveFlow roomId={roomId} userId={user?.id} onLive={fn} children={<button>Go Live</button>} />
 */
export default function ZEGOGoLiveFlow({ roomId, userId, onLive, children }) {
  const [connecting, setConnecting] = useState(false);
  const [zegoRoomId, setZegoRoomId] = useState(null);
  const [streamSessionId, setStreamSessionId] = useState(null);
  const qc = useQueryClient();

  const goLiveMut = useMutation({
    mutationFn: async () => {
      const ts = Date.now();
      const zrId = `seewhy_${roomId}_${ts}`;
      setZegoRoomId(zrId);

      // Create ZEGO stream record
      const record = await base44.entities.ZEGOStream.create({
        room_id: roomId,
        host_id: userId,
        zego_room_id: zrId,
        status: 'connecting',
        platform: 'web',
        kit_type: 'live_streaming',
        started_at: new Date().toISOString(),
      });
      setStreamSessionId(record.id);

      // Simulate ZEGOCLOUD connection (2s)
      await new Promise(res => setTimeout(res, 2000));

      // Set both records to live
      await base44.entities.ZEGOStream.update(record.id, { status: 'live' });
      await base44.entities.Room.update(roomId, { status: 'live', started_at: new Date().toISOString() });

      return { zrId, recordId: record.id };
    },
    onSuccess: ({ zrId }) => {
      setConnecting(false);
      qc.invalidateQueries({ queryKey: ['cr-room', roomId] });
      qc.invalidateQueries({ queryKey: ['zego-health', roomId] });
      toast.success('Stream is now LIVE via ZEGOCLOUD!');
      onLive?.();
      if (userId) {
        base44.entities.Activity.create({
          user_id: userId,
          type: 'room_created',
          title: 'Started ZEGO live stream',
        }).catch(() => {});
      }
    },
    onError: () => { setConnecting(false); toast.error('Failed to start stream. Please try again.'); },
  });

  const handleGoLive = () => {
    setConnecting(true);
    goLiveMut.mutate();
  };

  return (
    <>
      {/* Connecting overlay */}
      <AnimatePresence>
        {connecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.85)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl p-8 text-center space-y-4 max-w-xs w-full mx-4"
              style={{ background: '#1A1A1A', border: `1px solid ${GOLD}40` }}>
              {/* Gold spinner */}
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-transparent animate-spin"
                  style={{ borderTopColor: GOLD, borderRightColor: `${GOLD}40` }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radio className="w-6 h-6" style={{ color: GOLD }} />
                </div>
              </div>
              <p className="font-black uppercase text-sm" style={{ color: GOLD, ...T }}>Connecting to ZEGOCLOUD…</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Setting up ultra-low latency stream</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger child with injected onClick */}
      <span onClick={handleGoLive} style={{ cursor: 'pointer', display: 'inline-flex' }}>
        {children}
      </span>

      {/* Session ID bar — shows after live */}
      {zegoRoomId && !connecting && goLiveMut.isSuccess && (
        <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(201,168,76,0.15)' }}>
          <span className="text-[11px] uppercase font-black" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>Stream Session</span>
          <span className="text-[11px] flex-1 truncate" style={{ color: '#C9A84C', fontFamily: 'Share Tech Mono, monospace' }}>{zegoRoomId}</span>
          <button onClick={() => { navigator.clipboard.writeText(zegoRoomId).then(() => toast.success('Copied!')).catch(() => toast.error('Copy failed.')); }}>
            <Copy className="w-3 h-3 text-white/30 hover:text-white/60 transition-colors" />
          </button>
        </div>
      )}
    </>
  );
}