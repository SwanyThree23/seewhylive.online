import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart2, Trophy, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function PollCountdown({ endsAt, onExpire }) {
  const [rem, setRem] = useState(0);
  useEffect(() => {
    const tick = () => {
      const r = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
      setRem(r);
      if (r === 0) onExpire?.();
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [endsAt, onExpire]);
  const m = Math.floor(rem / 60), s = rem % 60;
  const urgent = rem <= 10 && rem > 0;
  return (
    <motion.span
      animate={urgent ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.5, repeat: urgent ? Infinity : 0 }}
      style={{ color: rem === 0 ? 'rgba(255,255,255,0.3)' : rem < 30 ? '#C0392B' : G }}
    >
      {rem === 0 ? 'Ended' : `${m}:${String(s).padStart(2, '0')}`}
    </motion.span>
  );
}

// Animated progress bar for each option
function PollBar({ pct, isWinner, hasVoted, color }) {
  return (
    <motion.div
      className="absolute inset-y-0 left-0 rounded-lg"
      initial={{ width: 0 }}
      animate={{ width: `${pct}%` }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        background: hasVoted
          ? `linear-gradient(90deg, ${G}40, ${G}20)`
          : isWinner
          ? 'linear-gradient(90deg, rgba(212,175,55,0.25), rgba(212,175,55,0.08))'
          : 'rgba(255,255,255,0.06)',
      }}
    />
  );
}

export default function LivePollOverlay({ roomId, currentUser, isHost, position = 'bottom-left' }) {
  const [activePoll, setActivePoll] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prevVotes, setPrevVotes] = useState({});
  const qc = useQueryClient();

  // Real-time subscription to Poll changes
  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.Poll.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      if (event.type === 'create' && event.data?.status === 'active') {
        setActivePoll(event.data);
        setIsVisible(true);
        setMyVote(null);
      } else if (event.type === 'update') {
        if (event.data?.status !== 'active') {
          // Poll ended — show results briefly then hide
          setActivePoll(event.data);
          setTimeout(() => setIsVisible(false), 5000);
        } else {
          setActivePoll(prev => {
            // Track which options just got new votes for flash effect
            if (prev) {
              const flashes = {};
              (event.data.options || []).forEach((opt, i) => {
                const newVotes = typeof opt === 'object' ? (opt.votes || 0) : 0;
                const oldVotes = typeof prev.options?.[i] === 'object' ? (prev.options[i].votes || 0) : 0;
                if (newVotes > oldVotes) flashes[i] = true;
              });
              if (Object.keys(flashes).length) setPrevVotes(flashes);
              setTimeout(() => setPrevVotes({}), 600);
            }
            return event.data;
          });
        }
      } else if (event.type === 'delete') {
        setIsVisible(false);
      }
    });

    // Also load any currently active poll on mount
    base44.entities.Poll.filter({ room_id: roomId, status: 'active' }, '-created_date', 1).then(polls => {
      if (polls.length > 0) {
        setActivePoll(polls[0]);
        setIsVisible(true);
      }
    }).catch(() => {});

    // Load my existing vote
    if (currentUser?.id) {
      base44.entities.PollVote.filter({ room_id: roomId, user_id: currentUser.id }, '-created_date', 20).then(votes => {
        if (votes.length > 0 && activePoll) {
          const v = votes.find(v => v.poll_id === activePoll.id);
          if (v) setMyVote(v.option_index);
        }
      }).catch(() => {});
    }

    return unsub;
  }, [roomId]);

  // Keep myVote in sync when activePoll changes
  useEffect(() => {
    if (!currentUser?.id || !activePoll) return;
    base44.entities.PollVote.filter({ poll_id: activePoll.id, user_id: currentUser.id }, '-created_date', 1).then(votes => {
      if (votes.length > 0) setMyVote(votes[0].option_index);
      else setMyVote(null);
    }).catch(() => {});
  }, [activePoll?.id, currentUser?.id]);

  const voteMut = useMutation({
    mutationFn: async (optionIndex) => {
      if (myVote !== null || !activePoll) return;
      await base44.entities.PollVote.create({
        poll_id: activePoll.id,
        room_id: roomId,
        user_id: currentUser?.id,
        option_index: optionIndex,
      });
      const opts = [...(activePoll.options || [])];
      if (typeof opts[optionIndex] === 'object') {
        opts[optionIndex] = { ...opts[optionIndex], votes: (opts[optionIndex].votes || 0) + 1 };
      }
      await base44.entities.Poll.update(activePoll.id, {
        options: opts,
        total_votes: (activePoll.total_votes || 0) + 1,
      });
      setMyVote(optionIndex);
    },
    onError: () => toast.error('Failed to submit vote.'),
  });

  const positionClass = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  }[position] || 'bottom-4 left-4';

  if (!isVisible || !activePoll) return null;

  const opts = Array.isArray(activePoll.options) ? activePoll.options : [];
  const total = Math.max(activePoll.total_votes || 1, 1);
  const ended = activePoll.status !== 'active';

  const winnerIdx = opts.reduce((max, o, i) => {
    const v = typeof o === 'object' ? (o.votes || 0) : 0;
    const mv = typeof opts[max] === 'object' ? (opts[max]?.votes || 0) : 0;
    return v > mv ? i : max;
  }, 0);

  return (
    <AnimatePresence>
      <motion.div
        key={activePoll.id}
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className={`absolute ${positionClass} z-30 w-64 pointer-events-auto`}
        style={{
          background: 'rgba(8,5,18,0.92)',
          border: `1px solid ${G}30`,
          borderRadius: 14,
          backdropFilter: 'blur(16px)',
          boxShadow: `0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px ${G}10`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" style={{ color: G }} />
            <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: G, ...T }}>
              {ended ? 'Poll Results' : 'Live Poll'}
            </span>
            {!ended && (
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-[#6DBF7E]"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px]" style={{ ...T }}>
            <Clock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
            {activePoll.ends_at
              ? <PollCountdown endsAt={activePoll.ends_at} onExpire={() => {}} />
              : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}
          </div>
        </div>

        {/* Question */}
        <div className="px-3 pt-2.5 pb-1">
          <p className="text-[12px] font-bold text-white leading-snug">{activePoll.question}</p>
        </div>

        {/* Options */}
        <div className="px-3 pb-2.5 space-y-1.5">
          {opts.map((opt, i) => {
            const label = typeof opt === 'object' ? opt.text : opt;
            const votes = typeof opt === 'object' ? (opt.votes || 0) : 0;
            const pct = Math.round((votes / total) * 100);
            const isWinner = i === winnerIdx && votes > 0;
            const hasVoted = myVote === i;
            const justVoted = prevVotes[i];
            const canVote = myVote === null && !ended && !isHost;

            return (
              <motion.button
                key={i}
                onClick={() => canVote && voteMut.mutate(i)}
                animate={justVoted ? { scale: [1, 1.03, 1] } : {}}
                transition={{ duration: 0.3 }}
                className="w-full relative overflow-hidden rounded-lg text-left"
                style={{
                  border: hasVoted
                    ? `1px solid ${G}70`
                    : isWinner && (ended || myVote !== null)
                    ? `1px solid ${G}40`
                    : '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: canVote ? 'pointer' : 'default',
                  minHeight: 34,
                }}
                whileHover={canVote ? { scale: 1.01 } : {}}
                whileTap={canVote ? { scale: 0.98 } : {}}
              >
                <PollBar pct={myVote !== null || ended ? pct : 0} isWinner={isWinner} hasVoted={hasVoted} />
                <div className="relative flex items-center justify-between px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {ended && isWinner && votes > 0 && <Trophy className="w-3 h-3 shrink-0" style={{ color: G }} />}
                    {hasVoted && <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: G }} />}
                    <span className="text-[10px] font-bold truncate"
                      style={{ color: hasVoted ? G : ended && isWinner ? G : 'rgba(245,230,211,0.75)' }}>
                      {label}
                    </span>
                  </div>
                  {(myVote !== null || ended) && (
                    <motion.span
                      key={`${i}-${pct}`}
                      initial={{ opacity: 0, x: 4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[11px] font-black shrink-0 ml-1"
                      style={{ color: isWinner ? G : 'rgba(255,255,255,0.4)', ...T }}
                    >
                      {pct}%
                    </motion.span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-1.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
            {activePoll.total_votes || 0} {activePoll.total_votes === 1 ? 'vote' : 'votes'}
          </span>
          {myVote === null && !ended && !isHost && (
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>Tap to vote</span>
          )}
          {myVote !== null && !ended && (
            <span className="text-[11px]" style={{ color: '#6DBF7E', ...T }}>✓ Voted</span>
          )}
          {ended && (
            <span className="text-[11px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Final</span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}