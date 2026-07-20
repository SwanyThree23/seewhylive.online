import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

function FloatingEmoji({ emoji, id, onDone }) {
  const x = Math.random() * 60 - 30;
  return (
    <motion.div
      key={id}
      className="absolute bottom-0 right-0 text-2xl pointer-events-none z-50 select-none"
      initial={{ opacity: 1, y: 0, x, scale: 0.8 }}
      animate={{ opacity: 0, y: -180, x: x + (Math.random() * 40 - 20), scale: 1.4 }}
      transition={{ duration: 2.2, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      {emoji}
    </motion.div>
  );
}

export default function RoomReactionOverlay({ roomId, currentUser, triggerReact }) {
  const [floating, setFloating] = useState([]);
  const prevTrigger = useRef(triggerReact);

  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.Reaction.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      if (event.type === 'create' && event.data?.user_id !== currentUser?.id) {
        const id = `incoming-${Date.now()}-${Math.random()}`;
        setFloating(prev => [...prev.slice(-12), { id, emoji: event.data.emoji || '❤️' }]);
      }
    });
    return unsub;
  }, [roomId, currentUser?.id]);

  const sendMutation = useMutation({
    mutationFn: (emoji) => base44.entities.Reaction.create({
      room_id: roomId,
      user_id: currentUser?.id,
      emoji,
      target_type: 'room',
      target_id: roomId,
    }),
  });

  useEffect(() => {
    if (triggerReact !== prevTrigger.current && triggerReact?.emoji) {
      prevTrigger.current = triggerReact;
      const id = `ext-${Date.now()}`;
      setFloating(prev => [...prev.slice(-12), { id, emoji: triggerReact.emoji }]);
      sendMutation.mutate(triggerReact.emoji);
    }
  }, [triggerReact, sendMutation]);

  const removeFloat = (id) => setFloating(prev => prev.filter(f => f.id !== id));

  return (
    <div className="absolute bottom-16 right-4 w-16 h-48 pointer-events-none overflow-visible z-40">
      <AnimatePresence>
        {floating.map(f => (
          <FloatingEmoji key={f.id} emoji={f.emoji} id={f.id} onDone={() => removeFloat(f.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
