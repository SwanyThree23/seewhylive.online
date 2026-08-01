import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_REACTIONS = ['🔥', '😂', '💯', '❤️', '👏', '😮', '🏆', '⚡', '💰', '🎉'];

function FloatingEmoji({ emoji, id, onDone }) {
  const x = Math.random() * 60 - 30;
  return (
    <motion.div
      key={id}
      className="absolute bottom-0 right-0 text-2xl pointer-events-none z-50 select-none"
      initial={{ opacity: 1, y: 0, x, scale: 0.8 }}
      animate={{ opacity: 0, y: -180, x: x + (Math.random() * 40 - 20), scale: 1.4 }}
      transition={{ duration: 2.2, ease: 'easeOut' }}
      onAnimationComplete={onDone}>
      {emoji}
    </motion.div>
  );
}

export default function LiveEmoticonStorm({ partyId, currentUser, triggerReact }) {
  const [floating, setFloating] = useState([]);
  const [cooldown, setCooldown] = useState(false);
  const prevTrigger = useRef(triggerReact);

  // Subscribe to party reactions in real-time
  useEffect(() => {
    if (!partyId) return;
    const unsub = base44.entities.PartyReaction.subscribe((event) => {
      if (event.data?.party_id !== partyId) return;
      if (event.type === 'create' && event.data?.user_id !== currentUser?.id) {
        // Show other users' reactions floating
        const id = `incoming-${Date.now()}-${Math.random()}`;
        setFloating(prev => [...prev, { id, emoji: event.data.emoji }]);
      }
    });
    return unsub;
  }, [partyId, currentUser?.id]);

  const sendMutation = useMutation({
    mutationFn: (emoji) => base44.entities.PartyReaction.create({
      party_id: partyId,
      user_id: currentUser?.id,
      user_name: currentUser?.full_name || 'Guest',
      emoji,
      reaction_at: new Date().toISOString(),
    }),
    onError: () => toast.error('Action failed.'),
  });

  const fireReaction = useCallback((emoji) => {
    if (cooldown) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 500);

    const id = `local-${Date.now()}`;
    setFloating(prev => [...prev.slice(-12), { id, emoji }]);
    sendMutation.mutate(emoji);
  }, [cooldown, sendMutation]);

  useEffect(() => {
    if (triggerReact !== prevTrigger.current && triggerReact?.emoji) {
      prevTrigger.current = triggerReact;
      const id = `ext-${Date.now()}`;
      setFloating(prev => [...prev.slice(-12), { id, emoji: triggerReact.emoji }]);
      sendMutation.mutate(triggerReact.emoji);
    }
  }, [triggerReact, sendMutation]);

  const removeFloat = useCallback((id) => {
    setFloating(prev => prev.filter(f => f.id !== id));
  }, []);

  return (
    <div className="relative">
      {/* Floating emojis */}
      <div className="absolute bottom-12 right-4 w-16 h-48 pointer-events-none overflow-visible z-40">
        <AnimatePresence>
          {floating.map(f => (
            <FloatingEmoji key={f.id} emoji={f.emoji} id={f.id} onDone={() => removeFloat(f.id)} />
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto scrollbar-hide"
        style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {QUICK_REACTIONS.map(emoji => (
          <button key={emoji}
            onClick={() => fireReaction(emoji)}
            className="text-xl w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-all active:scale-75 hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}