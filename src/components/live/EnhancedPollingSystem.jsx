import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, RotateCcw, Zap, Plus, Copy } from 'lucide-react';

const COLORS = ['#d4af37', '#C0392B', '#C9A84C', '#D4AF37', '#6DBF7E'];

export default function EnhancedPollingSystem({ roomId, hostId, isHost }) {
  const [showCreate, setShowCreate] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [activePoll, setActivePoll] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const queryClient = useQueryClient();

  const { data: polls } = useQuery({
    queryKey: ['polls', roomId],
    queryFn: () => base44.entities.Poll.filter({ room_id: roomId, status: 'active' }, '-created_at', 1),
    refetchInterval: 2000,
  });

  const { data: pollTemplates } = useQuery({
    queryKey: ['pollTemplates', hostId],
    queryFn: () => base44.entities.PollTemplate.filter({ creator_id: hostId }, '-created_at'),
  });

  const { data: pollVotes } = useQuery({
    queryKey: ['pollVotes', activePoll?.id],
    queryFn: () => activePoll ? base44.entities.PollVote.filter({ poll_id: activePoll.id }) : Promise.resolve([]),
    refetchInterval: 1000,
    enabled: !!activePoll,
  });

  useEffect(() => {
    if (polls && polls.length > 0) {
      setActivePoll(polls[0]);
    }
  }, [polls]);

  // Handle poll timeout
  useEffect(() => {
    if (!activePoll || !activePoll.expires_at) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(activePoll.expires_at);
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        closePoll();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activePoll]);

  const createPollMutation = useMutation({
    mutationFn: async (pollData) => {
      const expiresAt = pollData.timeout_seconds
        ? new Date(Date.now() + pollData.timeout_seconds * 1000).toISOString()
        : null;
      return base44.entities.Poll.create({
        ...pollData,
        room_id: roomId,
        host_id: hostId,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
      });
    },
    onSuccess: (poll) => {
      queryClient.invalidateQueries({ queryKey: ['polls', roomId] });
      setShowCreate(false);
      if (hostId) {
        base44.entities.Activity.create({
          user_id: hostId,
          type: 'milestone',
          title: `Launched live poll: ${poll?.question || 'Poll'}`,
        }).catch(() => {});
      }
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ pollId, optionIndex }) => {
      const user = await base44.auth.me();
      // Check if user already voted
      const existingVote = pollVotes?.find(
        v => v.poll_id === pollId && v.user_id === user.id
      );

      if (existingVote && !activePoll.allow_re_vote) {
        return;
      }

      if (existingVote) {
        await base44.entities.PollVote.update(existingVote.id, { option_index: optionIndex });
      } else {
        await base44.entities.PollVote.create({
          room_id: roomId,
          poll_id: pollId,
          user_id: user.id,
          option_index: optionIndex,
        });
      }

      setUserVotes(prev => ({ ...prev, [pollId]: optionIndex }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pollVotes', activePoll?.id] });
    },
  });

  const closePollMutation = useMutation({
    mutationFn: (pollId) => base44.entities.Poll.update(pollId, { status: 'closed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', roomId] });
      setActivePoll(null);
    },
  });

  const closePoll = () => {
    if (activePoll) {
      closePollMutation.mutate(activePoll.id);
    }
  };

  const createFromTemplate = useCallback((template) => {
    createPollMutation.mutate(template);
  }, [createPollMutation]);

  if (!activePoll) {
    return (
      <div className="p-4 rounded-xl" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
        {isHost ? (
          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#d4af37', color: '#000', border: 'none', borderRadius: 8, padding: '8px 0', cursor: 'pointer', fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14 }}
          >
            <Plus className="w-4 h-4" /> Create Poll
          </button>
        ) : (
          <p className="text-sm text-white/50">No active polls</p>
        )}

        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3"
            >
              {pollTemplates && pollTemplates.length > 0 && (
                <div>
                  <p className="text-xs text-white/60 mb-2">Quick Templates</p>
                  <div className="grid grid-cols-2 gap-2">
                    {pollTemplates.slice(0, 4).map(t => (
                      <button
                        key={t.id}
                        onClick={() => createFromTemplate(t)}
                        className="p-2 text-left text-xs rounded-lg transition-all"
                        style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.3)' }}
                      >
                        <Copy className="w-3 h-3 mb-1" />
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const voteStats = activePoll.options.map((opt, idx) => {
    const count = pollVotes?.filter(v => v.option_index === idx).length || 0;
    const total = pollVotes?.length || 0;
    return {
      name: opt,
      value: count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    };
  });

  const formatTime = (seconds) => {
    if (!seconds) return 'No limit';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl space-y-3"
      style={{ background: 'rgba(11,11,24,0.95)', border: '1px solid rgba(212,175,55,0.15)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="font-bold text-white mb-1">{activePoll.question}</h3>
          {timeRemaining !== null && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: timeRemaining < 10 ? '#C0392B' : '#d4af37' }}>
              <Clock className="w-3 h-3" />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>
        {isHost && (
          <button
            onClick={closePoll}
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
            style={{ background: 'rgba(192,57,43,0.15)' }}
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={voteStats}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} height={40} />
          <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
          <Tooltip
            contentStyle={{ background: 'rgba(8,11,24,0.95)', border: '1px solid rgba(212,175,55,0.2)' }}
            labelStyle={{ color: '#fff' }}
          />
          <Bar dataKey="value" fill="#d4af37" radius={[4, 4, 0, 0]}>
            {voteStats.map((_, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Vote options */}
      <div className="space-y-2">
        {activePoll.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => voteMutation.mutate({ pollId: activePoll.id, optionIndex: idx })}
            className="w-full p-2.5 rounded-lg text-left transition-all hover:opacity-80"
            style={{
              background: userVotes[activePoll.id] === idx ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.05)',
              border: userVotes[activePoll.id] === idx ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{option}</span>
              <span className="text-xs text-white/50">
                {voteStats[idx]?.percentage.toFixed(0)}% ({voteStats[idx]?.value})
              </span>
            </div>
            <div className="h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${voteStats[idx]?.percentage}%` }}
                className="h-full"
                style={{ background: COLORS[idx % COLORS.length] }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Re-vote notice */}
      {activePoll.allow_re_vote && userVotes[activePoll.id] !== undefined && (
        <div className="flex items-center gap-2 text-xs text-[#C9A84C]" style={{ color: '#C9A84C' }}>
          <RotateCcw className="w-3 h-3" />
          You can change your vote anytime
        </div>
      )}
    </motion.div>
  );
}