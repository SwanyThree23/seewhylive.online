import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const REACTIONS = ['😂', '❤️', '🔥', '👏', '😮', '🎉', '💯', '🤩', '😍'];

function FloatingReaction({ emoji, x }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0.8, x }}
      animate={{ y: -200, opacity: 0, scale: 1.4 }}
      transition={{ duration: 2.2, ease: 'easeOut' }}
      className="absolute bottom-16 text-3xl pointer-events-none select-none z-30"
    >
      {emoji}
    </motion.div>
  );
}

export default function ReactionOverlay({ partyId, currentUser }) {
  const [reactions, setReactions] = useState([]);
  const [cooldown, setCooldown] = useState(false);
  const idRef = useRef(0);

  // Subscribe to reaction messages in this party
  useEffect(() => {
    if (!partyId) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type !== 'create') return;
      if (event.data?.room_id !== partyId) return;
      if (event.data?.message_type !== 'poll') return; // reuse poll type for reactions
      const emoji = event.data?.content;
      if (!REACTIONS.includes(emoji)) return;
      const id = ++idRef.current;
      const x = Math.random() * 200 - 100;
      setReactions(p => [...p, { id, emoji, x }]);
      setTimeout(() => setReactions(p => p.filter(r => r.id !== id)), 2400);
    });
    return unsub;
  }, [partyId]);

  const sendReaction = async (emoji) => {
    if (cooldown || !currentUser || !partyId) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 800);
    // Optimistic local reaction
    const id = ++idRef.current;
    const x = Math.random() * 200 - 100;
    setReactions(p => [...p, { id, emoji, x }]);
    setTimeout(() => setReactions(p => p.filter(r => r.id !== id)), 2400);
    // Broadcast to all party members
    await base44.entities.Message.create({
      room_id: partyId,
      user_id: currentUser.id,
      user_name: currentUser.full_name || currentUser.email,
      content: emoji,
      message_type: 'poll',
    });
  };

  return (
    <>
      {/* Floating reactions layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {reactions.map(r => (
            <FloatingReaction key={r.id} emoji={r.emoji} x={r.x} />
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction bar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-black/60 border-t border-white/10">
        {REACTIONS.map(emoji => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            disabled={cooldown}
            className="text-xl hover:scale-125 transition-transform active:scale-95 disabled:opacity-50"
            title={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}