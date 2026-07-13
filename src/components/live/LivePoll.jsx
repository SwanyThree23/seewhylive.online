import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Plus, X, ChevronRight, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function PollResults({ poll, votes, currentUser, onVote, onEnd }) {
  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const userVote = poll.options?.findIndex((_, i) => votes[`user_${currentUser?.id}_${i}`]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-white">{poll.question}</p>
        {onEnd && (
          <button onClick={onEnd} style={{ height: 24, padding: '0 4px', fontSize: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif' }}>
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
  const qc = useQueryClient();
  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const [creating, setCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [votes, setVotes] = useState({});
  const [userVotedOption, setUserVotedOption] = useState(null);

  const { data: activePoll } = useQuery({
    queryKey: ['livepoll', roomId],
    queryFn: () => base44.entities.Poll.filter({ room_id: roomId, status: 'active' }).then(r => r[0]),
    enabled: !!roomId,
    refetchInterval: 5000,
  });

  // Subscribe to poll vote updates in real-time
  useEffect(() => {
    if (!activePoll?.id) return;
    const unsub = base44.entities.PollVote.subscribe((event) => {
      if (event.data?.poll_id !== activePoll.id) return;
      qc.invalidateQueries(['pollvotes', activePoll.id]);
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

  const createPollMutation = useMutation({
    mutationFn: () => base44.entities.Poll.create({
      room_id: roomId,
      question: question.trim(),
      options: options.filter(o => o.trim()),
      status: 'active',
      created_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries(['livepoll', roomId]);
      setCreating(false);
      setQuestion('');
      setOptions(['', '']);
      toast.success('Poll launched!');
    },
    onError: () => toast.error('Failed to launch poll.'),
  });

  const endPollMutation = useMutation({
    mutationFn: () => base44.entities.Poll.update(activePoll.id, { status: 'ended' }),
    onSuccess: async () => {
      qc.invalidateQueries(['livepoll', roomId]);
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
    onSuccess: (_, optionIndex) => {
      setUserVotedOption(optionIndex);
      qc.invalidateQueries(['pollvotes', activePoll?.id]);
    },
    onError: () => toast.error('Could not record vote'),
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
              <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(220,38,38,0.8)', color: '#fff', border: 'none', display: 'inline-block' }}>LIVE</span>
            </div>
            <PollResults
              poll={activePoll}
              votes={voteTally}
              currentUser={currentUser}
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
