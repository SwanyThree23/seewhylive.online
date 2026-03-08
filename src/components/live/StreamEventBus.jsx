import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { fireAlert } from './HostAlertCenter';

const handledEvents = new Set();

export default function StreamEventBus({ roomId, isHost, sessionId, onViewerUpdate, onTipReceived, onMessageReceived }) {
  const viewerCountRef = useRef(0);
  const tipStormRef = useRef({ count: 0, lastReset: Date.now() });

  useEffect(() => {
    if (!roomId) return;

    // Subscribe to messages (tips, chat, Q&A)
    const unsub1 = base44.entities.Message.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      if (handledEvents.has(event.id + event.type)) return;
      handledEvents.add(event.id + event.type);

      const msg = event.data;
      if (event.type === 'create') {
        onMessageReceived?.(msg);

        if (msg.message_type === 'tip' && msg.tip_amount) {
          onTipReceived?.(msg);
          if (isHost) {
            fireAlert({
              type: 'tip', duration: 6000, progress: true,
              title: `💰 $${msg.tip_amount} tip from ${msg.user_name || 'Someone'}!`,
              body: msg.content || '',
            });
            const now = Date.now();
            const storm = tipStormRef.current;
            if (now - storm.lastReset > 60000) {
              storm.count = 0; storm.lastReset = now;
            }
            storm.count++;
            if (storm.count >= 3 && isHost) {
              fireAlert({ type: 'milestone', duration: 8000, title: '🌊 TIP STORM! 3 tips in 60 seconds!' });
              storm.count = 0;
            }
          }
        }

        if (msg.message_type === 'qa' && (msg.upvotes || 0) >= 5 && isHost) {
          fireAlert({
            type: 'stage', persistent: true,
            title: `❓ Hot Q&A: "${msg.content?.slice(0, 60)}..."`,
            body: '5+ upvotes — consider answering',
          });
        }
      }
    });

    // Subscribe to participants (viewer count)
    const unsub2 = base44.entities.Participant.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      if (event.type === 'create') {
        viewerCountRef.current++;
        onViewerUpdate?.(viewerCountRef.current);
      } else if (event.type === 'delete') {
        viewerCountRef.current = Math.max(0, viewerCountRef.current - 1);
        onViewerUpdate?.(viewerCountRef.current);
      }
    });

    // Subscribe to reactions (burst detection)
    const unsub3 = base44.entities.Reaction.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      // Reaction burst handled by room-level state
    });

    return () => {
      unsub1?.();
      unsub2?.();
      unsub3?.();
    };
  }, [roomId, isHost]);

  return null;
}