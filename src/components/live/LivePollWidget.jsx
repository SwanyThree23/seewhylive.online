import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart2, Clock, X, Trophy, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const BURGUNDY = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function PollCountdown({ endsAt }) {
  const [rem, setRem] = useState(0);
  useEffect(() => {
    const tick = () => setRem(Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [endsAt]);
  if (rem === 0) return <span style={{ color: '#FF4444' }}>Poll Ended</span>;
  const m = Math.floor(rem / 60), s = rem % 60;
  return <span style={{ color: rem < 30 ? '#FF4444' : GOLD }}>{m}:{String(s).padStart(2,'0')}</span>;
}

function CreatePollModal({ roomId, communityId, userId, onClose, onCreated }) {
  const [form, setForm] = useState({ question: '', options: ['',''], ends_at: '', allow_multiple: false });
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => base44.entities.Poll.create({
      room_id: roomId,
      community_id: communityId,
      creator_id: userId,
      question: form.question,
      options: form.options.filter(Boolean).map(o => ({ text: o, votes: 0 })),
      ends_at: form.ends_at || new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      allow_multiple: form.allow_multiple,
      status: 'active',
      total_votes: 0,
    }),
    onSuccess: (poll) => {
      qc.invalidateQueries({ queryKey: ['livepoll', roomId] });
      toast.success('Poll created!');
      onCreated?.();
      onClose();
      if (userId) {
        base44.entities.Activity.create({
          user_id: userId,
          type: 'milestone',
          title: `Created live poll: ${poll?.question || form.question || 'Poll'}`,
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Failed to create poll.'),
  });

  const addOpt = () => setForm(f => ({ ...f, options: [...f.options, ''] }));

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl p-5 space-y-3"
        style={{ background: '#1A1A1A', border: `1px solid rgba(212,175,55,0.25)` }}>
        <div className="flex items-center justify-between">
          <span className="font-black uppercase text-sm" style={{ color: GOLD, ...T }}>Create Poll</span>
          <button onClick={onClose}><X className="w-4 h-4 text-white/40" /></button>
        </div>
        <input placeholder="Question…" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg text-[11px] outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
        {form.options.map((o, i) => (
          <input key={i} placeholder={`Option ${i+1}`} value={o} onChange={e => setForm(f => ({ ...f, options: f.options.map((x,j) => j===i?e.target.value:x) }))}
            className="w-full px-3 py-2 rounded-lg text-[11px] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
        ))}
        {form.options.length < 6 && (
          <button onClick={addOpt} className="text-[11px] font-black" style={{ color: GOLD, ...T }}>+ Add Option</button>
        )}
        <button onClick={() => mut.mutate()} disabled={!form.question || mut.isPending}
          className="w-full py-2.5 rounded-xl font-black uppercase text-[11px]"
          style={{ background: BURGUNDY, color: GOLD, border: `1px solid rgba(212,175,55,0.3)`, ...T }}>
          Launch Poll
        </button>
      </motion.div>
    </>
  );
}

export default function LivePollWidget({ roomId, currentUser, isHost }) {
  const [expanded, setExpanded] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: polls = [] } = useQuery({
    queryKey: ['livepoll', roomId],
    queryFn: () => base44.entities.Poll.filter({ room_id: roomId, status: 'active' }),
    enabled: !!roomId,
    refetchInterval: 5000,
  });
  const { data: myVotes = [] } = useQuery({
    queryKey: ['myvotes', roomId, currentUser?.id],
    queryFn: () => base44.entities.PollVote.filter({ room_id: roomId, user_id: currentUser?.id }),
    enabled: !!roomId && !!currentUser?.id,
    refetchInterval: 5000,
  });

  const voteMut = useMutation({
    mutationFn: async ({ poll, optionIndex }) => {
      await base44.entities.PollVote.create({
        poll_id: poll.id,
        room_id: roomId,
        user_id: currentUser?.id,
        option_index: optionIndex,
      });
      const opts = Array.isArray(poll.options) ? [...poll.options] : [];
      if (opts[optionIndex]) {
        if (typeof opts[optionIndex] === 'object') {
          opts[optionIndex] = { ...opts[optionIndex], votes: (opts[optionIndex].votes || 0) + 1 };
        }
      }
      await base44.entities.Poll.update(poll.id, {
        options: opts,
        total_votes: (poll.total_votes || 0) + 1,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['livepoll', roomId] }),
  });

  const endPollMut = useMutation({
    mutationFn: (id) => base44.entities.Poll.update(id, { status: 'ended' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['livepoll', roomId] }),
  });

  const pinResultsMut = useMutation({
    mutationFn: async (poll) => {
      const opts = Array.isArray(poll.options) ? poll.options : [];
      const results = opts.map((o, i) => {
        const label = typeof o === 'object' ? o.text : o;
        const votes = typeof o === 'object' ? (o.votes || 0) : 0;
        return `${label}: ${votes}`;
      }).join(' | ');
      await base44.entities.Message.create({
        room_id: roomId,
        user_id: currentUser?.id,
        user_name: 'System',
        content: `📊 Poll Results — "${poll.question}": ${results}`,
        type: 'system',
      });
      toast.success('Results pinned to chat');
    },
  });

  const activePoll = polls[0];
  if (!activePoll && !isHost) return null;

  const opts = Array.isArray(activePoll?.options) ? activePoll.options : [];
  const total = activePoll?.total_votes || 1;
  const myVoteForPoll = myVotes.find(v => v.poll_id === activePoll?.id);
  const winnerIdx = opts.reduce((max, o, i) => {
    const v = typeof o === 'object' ? (o.votes || 0) : 0;
    const mv = typeof opts[max] === 'object' ? (opts[max]?.votes || 0) : 0;
    return v > mv ? i : max;
  }, 0);

  return (
    <>
      <AnimatePresence>
        {showCreate && (
          <CreatePollModal
            roomId={roomId}
            userId={currentUser?.id}
            onClose={() => setShowCreate(false)}
          />
        )}
      </AnimatePresence>

      <div className="rounded-xl overflow-hidden" style={{ background: '#161616', border: `1px solid rgba(212,175,55,0.15)` }}>
        <button className="w-full flex items-center justify-between px-4 py-3"
          onClick={() => setExpanded(e => !e)}>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4" style={{ color: GOLD }} />
            <span className="font-black uppercase text-[11px]" style={{ color: GOLD, ...T }}>
              {activePoll ? 'Live Poll' : 'Polls'}
            </span>
            {activePoll && (
              <div className="w-1.5 h-1.5 rounded-full bg-[#6DBF7E] animate-pulse" />
            )}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {isHost && (
                  <div className="pt-2">
                    <button onClick={() => setShowCreate(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase"
                      style={{ background: `rgba(212,175,55,0.08)`, border: `1px solid rgba(212,175,55,0.2)`, color: GOLD, ...T }}>
                      <Plus className="w-3 h-3" /> Create Poll
                    </button>
                  </div>
                )}

                {!activePoll && (
                  <p className="text-center py-3 text-[10px]" style={{ color: 'rgba(245,230,211,0.25)' }}>No active polls</p>
                )}

                {activePoll && (
                  <div className="pt-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-[12px] text-white flex-1">{activePoll.question}</p>
                      <div className="flex items-center gap-1 text-[11px] shrink-0" style={{ color: 'rgba(245,230,211,0.4)' }}>
                        <Clock className="w-3 h-3" />
                        {activePoll.ends_at ? <PollCountdown endsAt={activePoll.ends_at} /> : '—'}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {opts.map((opt, i) => {
                        const label = typeof opt === 'object' ? opt.text : opt;
                        const votes = typeof opt === 'object' ? (opt.votes || 0) : 0;
                        const pct = Math.round((votes / total) * 100);
                        const isWinner = i === winnerIdx && votes > 0;
                        const hasVoted = myVoteForPoll?.option_index === i;

                        return (
                          <button key={i}
                            onClick={() => !myVoteForPoll && voteMut.mutate({ poll: activePoll, optionIndex: i })}
                            className="w-full relative overflow-hidden rounded-lg text-left transition-all"
                            style={{
                              border: hasVoted ? `1px solid ${GOLD}` : isWinner ? `1px solid rgba(212,175,55,0.4)` : '1px solid rgba(255,255,255,0.08)',
                              background: hasVoted ? `rgba(212,175,55,0.1)` : 'rgba(255,255,255,0.03)',
                              cursor: myVoteForPoll ? 'default' : 'pointer',
                            }}>
                            <div className="absolute inset-y-0 left-0 rounded-lg transition-all"
                              style={{ width: `${pct}%`, background: isWinner ? `${GOLD}20` : 'rgba(255,255,255,0.05)' }} />
                            <div className="relative flex items-center justify-between px-2.5 py-2">
                              <div className="flex items-center gap-1.5">
                                {isWinner && votes > 0 && <Trophy className="w-3 h-3" style={{ color: GOLD }} />}
                                <span className="text-[10px] font-bold" style={{ color: hasVoted ? GOLD : 'rgba(245,230,211,0.7)' }}>{label}</span>
                                {hasVoted && <span className="text-[7px] px-1 py-0.5 rounded" style={{ background: `${GOLD}20`, color: GOLD }}>✓</span>}
                              </div>
                              <span className="text-[11px] font-black" style={{ color: GOLD, ...T }}>{pct}%</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[11px]" style={{ color: 'rgba(245,230,211,0.3)' }}>{activePoll.total_votes || 0} votes</p>

                    {isHost && (
                      <div className="flex gap-1.5">
                        <button onClick={() => endPollMut.mutate(activePoll.id)}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-black uppercase"
                          style={{ background: 'rgba(255,68,68,0.1)', color: '#FF4444', border: '1px solid rgba(255,68,68,0.2)', ...T }}>
                          End Poll
                        </button>
                        <button onClick={() => pinResultsMut.mutate(activePoll)}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-black uppercase"
                          style={{ background: `rgba(212,175,55,0.08)`, color: GOLD, border: `1px solid rgba(212,175,55,0.2)`, ...T }}>
                          Pin Results
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}