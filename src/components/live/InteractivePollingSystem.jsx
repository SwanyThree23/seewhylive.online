import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, Pin, PinOff, MessageCircle, TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';

const POLL_COLORS = ['#C0392B', '#D4AF37', '#D4854A', '#CC7755', '#C9A84C'];

const PollResultsChart = ({ poll, votes }) => {
  if (!poll?.options) return null;

  const data = poll.options.map((option, i) => ({
    name: option,
    votes: votes.filter(v => v.option_index === i).length,
    color: POLL_COLORS[i % POLL_COLORS.length]
  }));

  const totalVotes = data.reduce((sum, d) => sum + d.votes, 0);

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.3)" />
          <YAxis tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.3)" />
          <Tooltip
            contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(212,175,55,0.3)' }}
            cursor={{ fill: 'rgba(212,175,55,0.1)' }}
          />
          <Bar dataKey="votes" fill="#d4af37" isAnimationActive={true} animationDuration={500}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Percentage breakdown */}
      <div className="space-y-1">
        {data.map((option, i) => {
          const percentage = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className="w-12 text-[10px] font-semibold text-white/60 truncate">{option.name}</div>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5 }}
                  style={{ background: option.color }}
                  className="h-full"
                />
              </div>
              <div className="w-12 text-right text-[10px] font-bold text-white/70">
                {percentage}%
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-white/40 text-center pt-1">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

const PollCard = ({ poll, votes, isHost, isPinned, onPin, onClose, hasVoted, onVote, isActive }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleVote = async () => {
    if (selectedOption !== null) {
      onVote(poll.id, selectedOption);
      setSelectedOption(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-lg p-3 space-y-2"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-[11px] font-bold text-white truncate">{poll.question}</h4>
          <p className="text-[11px] text-white/40 mt-0.5">
            {isActive ? '🔴 Live' : '✓ Closed'}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isHost && (
            <>
              <button
                onClick={() => onPin(poll.id)}
                className="w-6 h-6 flex items-center justify-center rounded text-white/50 hover:text-white/80 transition"
                title={isPinned ? 'Unpin' : 'Pin'}
              >
                {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onClose(poll.id)}
                className="w-6 h-6 flex items-center justify-center rounded text-white/50 hover:text-white/80 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Voting options (only if active and not voted) */}
      {isActive && !hasVoted && (
        <div className="space-y-1">
          {poll.options?.map((option, i) => (
            <button
              key={i}
              onClick={() => setSelectedOption(i)}
              className={`w-full text-left px-2.5 py-1.5 rounded text-[10px] font-semibold transition-all ${
                selectedOption === i
                  ? 'bg-[#d4af37] text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {option}
            </button>
          ))}
          {selectedOption !== null && (
            <button
              onClick={handleVote}
              className="w-full px-2.5 py-1.5 rounded text-[10px] font-bold text-black bg-[#d4af37] hover:bg-[#e5c158] transition-all"
            >
              Vote
            </button>
          )}
        </div>
      )}

      {/* Results chart */}
      {votes.length > 0 && <PollResultsChart poll={poll} votes={votes} />}

      {hasVoted && isActive && (
        <div className="text-[11px] text-white/50 text-center">✓ You voted</div>
      )}
    </motion.div>
  );
};

export default function InteractivePollingSystem({ roomId, isHost, currentUser }) {
  const [polls, setPolls] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const [pinnedPollId, setPinnedPollId] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const qc = useQueryClient();

  // Fetch polls
  useQuery({
    queryKey: ['polls', roomId],
    queryFn: async () => {
      const pollList = await base44.entities.Poll.filter(
        { room_id: roomId },
        '-created_date',
        20
      );
      setPolls(pollList);
      return pollList;
    },
    refetchInterval: 3000,
  });

  // Fetch votes
  const { data: allVotes = [] } = useQuery({
    queryKey: ['poll-votes', roomId],
    queryFn: () => base44.entities.PollVote.filter({ room_id: roomId }),
    refetchInterval: 2000,
  });

  // Subscribe to real-time polls
  useEffect(() => {
    const unsubscribe = base44.entities.Poll.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      if (event.type === 'create') {
        setPolls(prev => [event.data, ...prev]);
        // Announce new poll
        announceNewPoll(event.data.question);
      } else if (event.type === 'update') {
        setPolls(prev => prev.map(p => p.id === event.id ? event.data : p));
      } else if (event.type === 'delete') {
        setPolls(prev => prev.filter(p => p.id !== event.id));
      }
    });
    return unsubscribe;
  }, [roomId]);

  const announceNewPoll = (question) => {
    toast.success(`📊 New poll: "${question}"`, {
      duration: 4000,
      icon: '🗳️',
    });
  };

  const createPollMutation = useMutation({
    mutationFn: async () => {
      if (!newQuestion.trim() || newOptions.some(o => !o.trim())) {
        throw new Error('Please fill in all fields');
      }
      return base44.entities.Poll.create({
        room_id: roomId,
        host_id: currentUser?.id,
        question: newQuestion,
        options: newOptions.filter(o => o.trim()),
        status: 'active',
      });
    },
    onSuccess: () => {
      setNewQuestion('');
      setNewOptions(['', '']);
      setShowCreateForm(false);
      toast.success('Poll created!');
    },
    onError: () => {
      toast.error('Failed to create poll. Please try again.');
    }
  });

  const closePollMutation = useMutation({
    mutationFn: (pollId) => base44.entities.Poll.update(pollId, { status: 'closed' }),
    onSuccess: () => qc.invalidateQueries(['polls', roomId]),
  });

  const voteMutation = useMutation({
    mutationFn: async (pollId, optionIndex) => {
      const existingVote = allVotes.find(v => v.poll_id === pollId && v.user_id === currentUser?.id);
      if (existingVote) {
        throw new Error('You already voted on this poll');
      }
      return base44.entities.PollVote.create({
        room_id: roomId,
        poll_id: pollId,
        user_id: currentUser?.id,
        option_index: optionIndex,
      });
    },
    onSuccess: (_, pollId) => {
      setUserVotes(prev => ({ ...prev, [pollId]: true }));
      qc.invalidateQueries(['poll-votes', roomId]);
      toast.success('Vote recorded!');
    },
  });

  const togglePin = (pollId) => {
    setPinnedPollId(pinnedPollId === pollId ? null : pollId);
  };

  const activePoll = polls.find(p => p.status === 'active');
  const pinnedPoll = polls.find(p => p.id === pinnedPollId);

  return (
    <div className="space-y-3">
      {/* Pinned poll (top) */}
      {pinnedPoll && (
        <div className="border-2 border-[#d4af37] bg-[#d4af37]/5 rounded-lg p-2">
          <div className="text-[11px] text-[#d4af37] font-semibold mb-1 flex items-center gap-1">
            <Pin className="w-3 h-3" /> PINNED
          </div>
          <PollCard
            poll={pinnedPoll}
            votes={allVotes.filter(v => v.poll_id === pinnedPoll.id)}
            isHost={isHost}
            isPinned={true}
            onPin={togglePin}
            onClose={closePollMutation.mutate}
            hasVoted={userVotes[pinnedPoll.id] || false}
            onVote={voteMutation.mutate}
            isActive={pinnedPoll.status === 'active'}
          />
        </div>
      )}

      {/* Active poll indicator */}
      {activePoll && activePoll.id !== pinnedPollId && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#D4854A' }} />
          <MessageCircle className="w-3.5 h-3.5 text-white/50" />
          <p className="text-[10px] font-semibold text-white/70 flex-1">{activePoll.question}</p>
          <TrendingUp className="w-3.5 h-3.5 text-white/30" />
        </div>
      )}

      {/* Create poll button (host only) */}
      {isHost && (
        <>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-[11px] font-bold transition-all"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Launch Poll
            </button>
          )}

          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-lg space-y-2"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}
            >
              <input
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                placeholder="Poll question..."
                maxLength={100}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[10px] outline-none placeholder:text-white/25"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              />

              <div className="space-y-1">
                {newOptions.map((opt, i) => (
                  <input
                    key={i}
                    value={opt}
                    onChange={e => {
                      const updated = [...newOptions];
                      updated[i] = e.target.value;
                      setNewOptions(updated);
                    }}
                    placeholder={`Option ${i + 1}`}
                    maxLength={50}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] outline-none placeholder:text-white/25"
                    style={{ color: 'rgba(255,255,255,0.9)' }}
                  />
                ))}
                <button
                  onClick={() => setNewOptions([...newOptions, ''])}
                  className="text-[11px] text-white/50 hover:text-white/70 transition"
                >
                  + Add option
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewQuestion('');
                    setNewOptions(['', '']);
                  }}
                  className="flex-1 px-2 py-1.5 rounded text-[10px] font-bold bg-white/5 text-white/70 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createPollMutation.mutate()}
                  disabled={createPollMutation.isPending}
                  className="flex-1 px-2 py-1.5 rounded text-[10px] font-bold bg-[#d4af37] text-black hover:bg-[#e5c158] transition disabled:opacity-50"
                >
                  Launch
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Poll list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {polls.slice(0, 5).map(poll => (
            <PollCard
              key={poll.id}
              poll={poll}
              votes={allVotes.filter(v => v.poll_id === poll.id)}
              isHost={isHost}
              isPinned={pinnedPollId === poll.id}
              onPin={togglePin}
              onClose={closePollMutation.mutate}
              hasVoted={userVotes[poll.id] || false}
              onVote={voteMutation.mutate}
              isActive={poll.status === 'active'}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}