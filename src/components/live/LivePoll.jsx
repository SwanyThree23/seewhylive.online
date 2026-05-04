import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
          <Button size="sm" variant="ghost" onClick={onEnd} className="h-6 text-[10px] text-red-400 hover:text-red-300 px-1">
            End Poll
          </Button>
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
        await base44.entities.Activity.create({
          user_id: roomId,
          type: 'room_joined',
          title: `Poll ended: "${activePoll.question}"`,
          description: `Winner: "${winner}" with ${Object.values(voteTally)[0] || 0} votes`,
          is_public: true,
        });
      }
      toast.success('Poll ended');
    },
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

  return (
    <div className="bg-white/5 border border-[rgba(212,175,55,0.15)] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BarChart2 className="w-3.5 h-3.5 text-[#d4af37]" />
          <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wide">Live Poll</span>
        </div>
        {isHost && !activePoll && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCreating(c => !c)}
            className="h-6 text-[10px] text-white/50 hover:text-white px-1.5"
          >
            {creating ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3 mr-1" />}
            {creating ? '' : 'New Poll'}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activePoll ? (
          <motion.div key="poll" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Badge className="bg-red-600/80 text-white border-0 text-[9px] animate-pulse px-1.5">LIVE</Badge>
            </div>
            <PollResults
              poll={activePoll}
              votes={voteTally}
              currentUser={null}
              onVote={userVotedOption === null ? handleVote : null}
              onEnd={isHost ? () => endPollMutation.mutate() : null}
            />
            {userVotedOption !== null && (
              <p className="text-[10px] text-green-400 flex items-center gap-1 mt-1">
                <Check className="w-3 h-3" /> Your vote was recorded
              </p>
            )}
          </motion.div>
        ) : creating && isHost ? (
          <motion.div key="create" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <Input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask your audience..."
              className="h-7 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
            {options.map((opt, i) => (
              <div key={i} className="flex gap-1.5">
                <Input
                  value={opt}
                  onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                  placeholder={`Option ${i + 1}`}
                  className="h-7 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                {options.length > 2 && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-white/30 hover:text-red-400 shrink-0"
                    onClick={() => setOptions(prev => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 5 && (
              <button onClick={() => setOptions(prev => [...prev, ''])}
                className="text-[10px] text-white/30 hover:text-[#d4af37] transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add option
              </button>
            )}
            <Button
              size="sm"
              className="w-full h-7 text-xs bg-[#d4af37] text-black hover:bg-[#f5e6a3] font-bold mt-1"
              disabled={!question.trim() || options.filter(o => o.trim()).length < 2 || createPollMutation.isPending}
              onClick={() => createPollMutation.mutate()}
            >
              <ChevronRight className="w-3.5 h-3.5 mr-1" /> Launch Poll
            </Button>
          </motion.div>
        ) : isHost ? (
          <p className="text-[10px] text-white/30 text-center py-1">No active poll</p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}