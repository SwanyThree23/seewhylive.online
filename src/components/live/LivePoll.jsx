import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Plus, X, ChevronRight, Check, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

const POLL_TEMPLATES = [
  { q: 'Which topic next?',     opts: ['Deep dive', 'Quick tips', 'Q&A'] },
  { q: "How's the stream?",     opts: ['Loving it!', "It's okay", 'Lost me...'] },
  { q: 'Pick the vibe!',        opts: ['Chill', 'Hype', 'Educational'] },
  { q: 'Your skill level?',     opts: ['Beginner', 'Intermediate', 'Expert'] },
];

function PollResults({ poll, votes, currentUser, onVote, onEnd }) {
  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const userVote = poll.options?.findIndex((_, i) => votes[`user_${currentUser?.id}_${i}`]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-white">{poll.question}</p>
        {onEnd && (
          <button onClick={onEnd} style={{ height: 24, padding: '0 4px', fontSize: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: '#FF4444', fontFamily: 'Barlow Condensed, sans-serif' }}>
            End Poll
          </button>
        )}
      </div>
      {poll.options?.map((option, i) => {
        const count = votes[i] || 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isWinner = totalVotes > 0 && count === Math.max(...poll.options.map((_, j) => votes[j] || 0));
        return (
          <button
            key={i}
            onClick={() => onVote && onVote(i)}
            disabled={!onVote}
            className="w-full text-left"
          >
            <div className="relative h-8 rounded-lg overflow-hidden border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`absolute inset-y-0 left-0 ${isWinner ? 'bg-[#d4af37]/30' : 'bg-white/10'}`}
              />
              <div className="absolute inset-0 flex items-center justify-between px-2.5">
                <span className="text-[11px] font-medium text-white">{option}</span>
                <span className={`text-[11px] font-bold ${isWinner ? 'text-[#d4af37]' : 'text-white/60'}`}>{pct}%</span>
              </div>
            </div>
          </button>
        );
      })}
      <p className="text-[10px] text-white/30 text-right">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function LivePoll({ roomId, isHost }) {
  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [votes, setVotes] = useState({});
  const [userVotedOption, setUserVotedOption] = useState(null);
  const [pollDuration, setPollDuration] = useState(0);
  const [pollSecondsLeft, setPollSecondsLeft] = useState(null);

  const { data: activePoll } = useQuery({
    queryKey: ['livepoll', roomId],
    queryFn: () => base44.entities.Poll.filter({ room_id: roomId, status: 'active' }).then(r => r[0]),
    enabled: !!roomId,
    refetchInterval: 5000,
  });

  // Restore voted option from localStorage when active poll loads
  useEffect(() => {
    if (!activePoll?.id) return;
    try {
      const saved = localStorage.getItem(`poll_voted_${activePoll.id}`);
      if (saved !== null) setUserVotedOption(Number(saved));
    } catch {}
  }, [activePoll?.id]);

  // Subscribe to poll vote updates in real-time
  useEffect(() => {
    if (!activePoll?.id) return;
    const unsub = base44.entities.PollVote.subscribe((event) => {
      if (event.data?.poll_id !== activePoll.id) return;
      qc.invalidateQueries({ queryKey: ['pollvotes', activePoll.id] });
    });
    return unsub;
  }, [activePoll?.id, qc]);

  const { data: pollVotes = [] } = useQuery({
    queryKey: ['pollvotes', activePoll?.id],
    queryFn: () => base44.entities.PollVote.filter({ poll_id: activePoll.id }),
    enabled: !!activePoll?.id,
    refetchInterval: 3000,
  });

  // Tally votes by option index
  const voteTally = pollVotes.reduce((acc, v) => {
    acc[v.option_index] = (acc[v.option_index] || 0) + 1;
    return acc;
  }, {});

  // Poll countdown timer
  useEffect(() => {
    if (!activePoll) { setPollSecondsLeft(null); return; }
    if (!activePoll.duration_seconds) return;
    const elapsed = Math.floor((Date.now() - new Date(activePoll.created_at).getTime()) / 1000);
    const left = activePoll.duration_seconds - elapsed;
    if (left <= 0) { setPollSecondsLeft(0); return; }
    setPollSecondsLeft(left);
    const tick = setInterval(() => setPollSecondsLeft(s => (s !== null && s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(tick);
  }, [activePoll?.id]);

  const createPollMutation = useMutation({
    mutationFn: () => base44.entities.Poll.create({
      room_id: roomId,
      question: question.trim(),
      options: options.filter(o => o.trim()),
      status: 'active',
      created_at: new Date().toISOString(),
      ...(pollDuration > 0 && { duration_seconds: pollDuration }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['livepoll', roomId] });
      setCreating(false);
      setQuestion('');
      setOptions(['', '']);
      setPollDuration(0);
      toast.success('Poll launched!');
    },
    onError: () => toast.error('Failed to launch poll.'),
  });

  const endPollMutation = useMutation({
    mutationFn: () => base44.entities.Poll.update(activePoll.id, { status: 'ended' }),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ['livepoll', roomId] });
      // Post summary to activity feed
      const winner = activePoll.options?.[
        Object.entries(voteTally).sort((a, b) => b[1] - a[1])[0]?.[0]
      ];
      if (winner) {
        base44.entities.Activity.create({
          user_id: roomId,
          type: 'room_joined',
          title: `Poll ended: "${activePoll.question}"`,
          description: `Winner: "${winner}" with ${Object.values(voteTally)[0] || 0} votes`,
          is_public: true,
        }).catch(() => {});
      }
      toast.success('Poll ended');
    },
    onError: () => toast.error('Failed to end poll.'),
  });

  const voteMutation = useMutation({
    mutationFn: async (optionIndex) => {
      const { data: me } = await base44.auth.me().catch(() => ({ data: null }));
      return base44.entities.PollVote.create({
        poll_id: activePoll.id,
        option_index: optionIndex,
        user_id: me?.id || 'anonymous',
      });
    },
    onMutate: async (optionIndex) => {
      await qc.cancelQueries({ queryKey: ['pollvotes', activePoll?.id] });
      const prevVotes = qc.getQueryData(['pollvotes', activePoll?.id]);
      // Optimistically add a vote
      qc.setQueryData(['pollvotes', activePoll?.id], (old) =>
        (old || []).concat({ poll_id: activePoll.id, option_index: optionIndex, user_id: 'optimistic' })
      );
      setUserVotedOption(optionIndex);
      try { if (activePoll?.id) localStorage.setItem(`poll_voted_${activePoll.id}`, String(optionIndex)); } catch {}
      return { prevVotes };
    },
    onError: (_err, _optionIndex, context) => {
      if (context) qc.setQueryData(['pollvotes', activePoll?.id], context.prevVotes);
      setUserVotedOption(null);
      try { if (activePoll?.id) localStorage.removeItem(`poll_voted_${activePoll.id}`); } catch {}
      toast.error('Could not record vote');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['pollvotes', activePoll?.id] });
    },
  });

  const handleVote = (i) => {
    if (userVotedOption !== null) return;
    voteMutation.mutate(i);
  };

  if (!activePoll && !isHost) return null;

  const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' };
  const inputSmStyle = { ...inputStyle, height: 28, padding: '0 10px', fontSize: 12 };

  return (
    <div className="bg-white/5 border border-[rgba(212,175,55,0.15)] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BarChart2 className="w-3.5 h-3.5 text-[#d4af37]" />
          <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wide">Live Poll</span>
        </div>
        {isHost && !activePoll && (
          <button
            onClick={() => setCreating(c => !c)}
            style={{ height: 24, padding: '0 6px', fontSize: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            {creating ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {creating ? '' : 'New Poll'}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activePoll ? (
          <motion.div key="poll" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-1.5 mb-2">
              <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(192,57,43,0.8)', color: '#fff', border: 'none', display: 'inline-block' }}>LIVE</span>
              {pollSecondsLeft !== null && pollSecondsLeft > 0 && (
                <span className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 700, color: pollSecondsLeft < 10 ? '#C0392B' : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  <Clock className="w-3 h-3" />{pollSecondsLeft}s
                </span>
              )}
              {pollSecondsLeft === 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>Ended</span>
              )}
            </div>
            <PollResults
              poll={activePoll}
              votes={voteTally}
              currentUser={currentUser || null}
              onVote={userVotedOption === null ? handleVote : null}
              onEnd={isHost ? () => endPollMutation.mutate() : null}
            />
            {userVotedOption !== null && (
              <p className="text-[10px] text-[#6DBF7E] flex items-center gap-1 mt-1">
                <Check className="w-3 h-3" /> Your vote was recorded
              </p>
            )}
          </motion.div>
        ) : creating && isHost ? (
          <motion.div key="create" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {POLL_TEMPLATES.map((t, i) => (
                <button key={i}
                  onClick={() => { setQuestion(t.q); setOptions(t.opts); }}
                  style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 9, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}
                >
                  {t.q}
                </button>
              ))}
            </div>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask your audience..."
              style={inputSmStyle}
            />
            {options.map((opt, i) => (
              <div key={i} className="flex gap-1.5">
                <input
                  value={opt}
                  onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                  placeholder={`Option ${i + 1}`}
                  style={inputSmStyle}
                />
                {options.length > 2 && (
                  <button style={{ height: 28, width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}
                    onClick={() => setOptions(prev => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {options.length < 5 && (
              <button onClick={() => setOptions(prev => [...prev, ''])}
                className="text-[10px] text-white/30 hover:text-[#d4af37] transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add option
              </button>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <select value={pollDuration} onChange={e => setPollDuration(Number(e.target.value))}
                style={{ flex: 1, padding: '2px 6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif' }}>
                <option value={0}>No timer</option>
                <option value={30}>30s</option>
                <option value={60}>1 min</option>
                <option value={120}>2 min</option>
                <option value={300}>5 min</option>
              </select>
            </div>
            <button
              style={{ width: '100%', height: 28, fontSize: 12, background: '#d4af37', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4, opacity: (!question.trim() || options.filter(o => o.trim()).length < 2 || createPollMutation.isPending) ? 0.5 : 1 }}
              disabled={!question.trim() || options.filter(o => o.trim()).length < 2 || createPollMutation.isPending}
              onClick={() => createPollMutation.mutate()}
            >
              <ChevronRight className="w-3.5 h-3.5" /> Launch Poll
            </button>
          </motion.div>
        ) : isHost ? (
          <p className="text-[10px] text-white/30 text-center py-1">No active poll</p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}