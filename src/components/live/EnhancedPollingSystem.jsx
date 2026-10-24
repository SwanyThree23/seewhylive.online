import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, RotateCcw, Zap, Plus, Copy, Star, Calendar, Trophy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#d4af37', '#C0392B', '#C9A84C', '#D4AF37', '#6DBF7E'];

const POLL_TYPES = [
  { id: 'choice',   label: 'Choice',   icon: '📊' },
  { id: 'rating',   label: '1–5 Stars', icon: '⭐' },
  { id: 'reaction', label: 'Reactions', icon: '😄' },
];

const REACTION_OPTIONS = ['😄', '😮', '🔥', '❤️', '👑'];

const QUICK_TEMPLATES = [
  { name: 'Hot or Not', question: 'What do you think of this?', type: 'choice', options: ['🔥 Hot', '❄️ Not'], timeout_seconds: 60 },
  { name: 'What Next', question: 'What should we do next?', type: 'choice', options: ['Keep streaming', 'Take a break', 'Play a game', 'Q&A time'], timeout_seconds: 90 },
  { name: 'Rate Stream', question: 'How would you rate this stream?', type: 'rating', options: ['1', '2', '3', '4', '5'], timeout_seconds: 120 },
  { name: 'Agree / Disagree', question: 'Do you agree?', type: 'choice', options: ['✅ Agree', '❌ Disagree', '🤷 Not sure'], timeout_seconds: 60 },
];

const DEFAULT_FORM = {
  question: '',
  type: 'choice',
  options: ['', ''],
  timeout_seconds: 60,
  allow_re_vote: false,
  scheduled_at: '',
};

export default function EnhancedPollingSystem({ roomId, hostId, isHost }) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [activePoll, setActivePoll] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [winner, setWinner] = useState(null);
  const queryClient = useQueryClient();

  const { data: polls } = useQuery({
    queryKey: ['polls', roomId],
    queryFn: () => base44.entities.Poll.filter({ room_id: roomId, status: 'active' }, '-created_at', 1),
    refetchInterval: 2000,
    enabled: !!roomId,
  });

  const { data: pollVotes } = useQuery({
    queryKey: ['pollVotes', activePoll?.id],
    queryFn: () => activePoll ? base44.entities.PollVote.filter({ poll_id: activePoll.id }) : Promise.resolve([]),
    refetchInterval: 1000,
    enabled: !!activePoll,
  });

  useEffect(() => {
    if (polls && polls.length > 0) setActivePoll(polls[0]);
  }, [polls]);

  // Countdown timer
  useEffect(() => {
    if (!activePoll?.expires_at) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(activePoll.expires_at) - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0) { closePoll(); clearInterval(interval); }
    }, 1000);
    return () => clearInterval(interval);
  }, [activePoll]);

  // Auto-dismiss winner banner after 4s
  useEffect(() => {
    if (!winner) return;
    const t = setTimeout(() => setWinner(null), 4000);
    return () => clearTimeout(t);
  }, [winner]);

  const computeWinner = (poll, votes) => {
    if (!poll?.options || !votes?.length) return null;
    const counts = poll.options.map((opt, idx) => ({
      label: opt,
      count: votes.filter(v => v.option_index === idx).length,
    }));
    counts.sort((a, b) => b.count - a.count);
    return counts[0]?.count > 0 ? counts[0] : null;
  };

  const createPollMutation = useMutation({
    mutationFn: async (pollData) => {
      const isScheduled = !!pollData.scheduled_at;
      const expiresAt = pollData.timeout_seconds && !isScheduled
        ? new Date(Date.now() + pollData.timeout_seconds * 1000).toISOString()
        : null;
      const options = pollData.type === 'rating'
        ? ['1', '2', '3', '4', '5']
        : pollData.type === 'reaction'
          ? REACTION_OPTIONS
          : pollData.options.filter(Boolean);
      return base44.entities.Poll.create({
        question: pollData.question,
        type: pollData.type,
        options,
        room_id: roomId,
        host_id: hostId,
        status: isScheduled ? 'scheduled' : 'active',
        allow_re_vote: pollData.allow_re_vote,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        scheduled_at: isScheduled ? new Date(pollData.scheduled_at).toISOString() : null,
      });
    },
    onError: () => toast.error('Failed to create poll'),
    onSuccess: (poll) => {
      queryClient.invalidateQueries({ queryKey: ['polls', roomId] });
      setShowCreate(false);
      setForm(DEFAULT_FORM);
      toast.success(poll?.status === 'scheduled' ? '📅 Poll scheduled!' : '📊 Poll launched!');
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
      const existingVote = pollVotes?.find(v => v.poll_id === pollId && v.user_id === user.id);
      if (existingVote && !activePoll.allow_re_vote) return;
      if (existingVote) {
        await base44.entities.PollVote.update(existingVote.id, { option_index: optionIndex });
      } else {
        await base44.entities.PollVote.create({ room_id: roomId, poll_id: pollId, user_id: user.id, option_index: optionIndex });
      }
      setUserVotes(prev => ({ ...prev, [pollId]: optionIndex }));
    },
    onError: () => toast.error('Failed to submit vote'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pollVotes', activePoll?.id] }),
  });

  const closePollMutation = useMutation({
    mutationFn: (pollId) => base44.entities.Poll.update(pollId, { status: 'closed' }),
    onError: () => toast.error('Failed to close poll'),
    onSuccess: () => {
      const w = computeWinner(activePoll, pollVotes);
      if (w) setWinner(w);
      queryClient.invalidateQueries({ queryKey: ['polls', roomId] });
      setActivePoll(null);
    },
  });

  const closePoll = () => { if (activePoll) closePollMutation.mutate(activePoll.id); };

  const copyResults = () => {
    if (!activePoll || !pollVotes) return;
    const total = pollVotes.length;
    const lines = activePoll.options.map((opt, idx) => {
      const count = pollVotes.filter(v => v.option_index === idx).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return `${opt}: ${count} votes (${pct}%)`;
    });
    const text = `Poll: ${activePoll.question}\n${lines.join('\n')}\nTotal: ${total} votes`;
    navigator.clipboard.writeText(text).then(() => toast.success('Results copied!')).catch(() => toast.error('Copy failed'));
  };

  const useTemplate = (tpl) => {
    setForm({ ...DEFAULT_FORM, ...tpl });
    setShowCreate(true);
  };

  const voteStats = activePoll?.options.map((opt, idx) => {
    const count = pollVotes?.filter(v => v.option_index === idx).length || 0;
    const total = pollVotes?.length || 0;
    return { name: opt, value: count, percentage: total > 0 ? (count / total) * 100 : 0 };
  }) || [];

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return 'No limit';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const renderVoteOptions = () => {
    if (activePoll.type === 'rating') {
      return (
        <div className="flex gap-2 justify-center py-2">
          {activePoll.options.map((_, idx) => (
            <button
              key={idx}
              onClick={() => voteMutation.mutate({ pollId: activePoll.id, optionIndex: idx })}
              className="text-2xl transition-transform hover:scale-125"
              style={{ opacity: userVotes[activePoll.id] !== undefined && userVotes[activePoll.id] !== idx ? 0.35 : 1 }}
              title={`${idx + 1} star${idx !== 0 ? 's' : ''}`}
            >
              {userVotes[activePoll.id] >= idx ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      );
    }
    if (activePoll.type === 'reaction') {
      return (
        <div className="flex gap-3 justify-center py-2">
          {activePoll.options.map((emoji, idx) => {
            const count = voteStats[idx]?.value || 0;
            const selected = userVotes[activePoll.id] === idx;
            return (
              <button
                key={idx}
                onClick={() => voteMutation.mutate({ pollId: activePoll.id, optionIndex: idx })}
                className="flex flex-col items-center gap-1 transition-transform hover:scale-125"
                style={{ transform: selected ? 'scale(1.2)' : undefined }}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] text-white/50">{count}</span>
              </button>
            );
          })}
        </div>
      );
    }
    // choice (default)
    return (
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
    );
  };

  return (
    <div className="space-y-3">
      {/* Winner banner */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -20 }}
            className="p-3 rounded-xl text-center"
            style={{ background: 'rgba(212,175,55,0.15)', border: '2px solid #d4af37', boxShadow: '0 0 24px rgba(212,175,55,0.4)' }}
          >
            <Trophy className="w-5 h-5 mx-auto mb-1" style={{ color: '#d4af37' }} />
            <p className="text-xs text-white/60 font-bold uppercase tracking-wider">Poll Winner</p>
            <p className="text-sm font-black text-white mt-0.5">{winner.label}</p>
            <p className="text-xs" style={{ color: '#d4af37' }}>{winner.count} vote{winner.count !== 1 ? 's' : ''}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!activePoll ? (
        <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
          {isHost && (
            <>
              <button
                onClick={() => setShowCreate(!showCreate)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#d4af37', color: '#000', border: 'none', borderRadius: 8, padding: '8px 0', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
              >
                <Plus className="w-4 h-4" /> Create Poll
              </button>

              {/* Quick templates */}
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5">Quick Templates</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_TEMPLATES.map(tpl => (
                    <button
                      key={tpl.name}
                      onClick={() => useTemplate(tpl)}
                      className="p-2 text-left text-xs rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}
                    >
                      <span className="font-bold text-white/80">{tpl.name}</span>
                      <span className="block text-[10px] text-white/40 mt-0.5 truncate">{tpl.question}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {!isHost && <p className="text-sm text-white/50">No active polls</p>}

          {/* Create form */}
          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2.5 overflow-hidden pt-1 border-t border-white/10"
              >
                {/* Poll type */}
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Poll Type</p>
                  <div className="flex gap-1">
                    {POLL_TYPES.map(pt => (
                      <button
                        key={pt.id}
                        onClick={() => setForm(f => ({ ...f, type: pt.id }))}
                        className="flex-1 py-1.5 rounded text-[11px] font-bold transition-all border"
                        style={form.type === pt.id
                          ? { background: 'rgba(212,175,55,0.2)', borderColor: '#d4af37', color: '#d4af37' }
                          : { background: 'transparent', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' }
                        }
                      >
                        {pt.icon} {pt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question */}
                <input
                  value={form.question}
                  onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  placeholder="Poll question..."
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#d4af37]/40"
                />

                {/* Options (choice only) */}
                {form.type === 'choice' && (
                  <div className="space-y-1">
                    {form.options.map((opt, idx) => (
                      <div key={idx} className="flex gap-1">
                        <input
                          value={opt}
                          onChange={e => setForm(f => ({ ...f, options: f.options.map((o, i) => i === idx ? e.target.value : o) }))}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#d4af37]/40"
                        />
                        {form.options.length > 2 && (
                          <button onClick={() => setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx) }))}
                            className="text-white/20 hover:text-white/50 px-1">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {form.options.length < 6 && (
                      <button
                        onClick={() => setForm(f => ({ ...f, options: [...f.options, ''] }))}
                        className="text-[11px] text-white/40 hover:text-white/60 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add option
                      </button>
                    )}
                  </div>
                )}

                {/* Rating / reaction previews */}
                {form.type === 'rating' && (
                  <p className="text-[11px] text-white/40 text-center">⭐ ⭐ ⭐ ⭐ ⭐ — viewers pick 1–5</p>
                )}
                {form.type === 'reaction' && (
                  <p className="text-[11px] text-white/40 text-center">{REACTION_OPTIONS.join('  ')} — tap to react</p>
                )}

                {/* Timeout */}
                <div className="flex gap-1.5 items-center">
                  <Clock className="w-3 h-3 text-white/30 shrink-0" />
                  <select
                    value={form.timeout_seconds}
                    onChange={e => setForm(f => ({ ...f, timeout_seconds: Number(e.target.value) }))}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#d4af37]/40"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={90}>90 seconds</option>
                    <option value={120}>2 minutes</option>
                    <option value={300}>5 minutes</option>
                    <option value={0}>No limit</option>
                  </select>
                </div>

                {/* Scheduled date */}
                <div className="flex gap-1.5 items-center">
                  <Calendar className="w-3 h-3 text-white/30 shrink-0" />
                  <input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#d4af37]/40"
                    style={{ colorScheme: 'dark' }}
                    placeholder="Schedule (optional)"
                  />
                </div>
                {form.scheduled_at && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.35)' }}>
                    📅 SCHEDULED
                  </span>
                )}

                {/* Re-vote toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setForm(f => ({ ...f, allow_re_vote: !f.allow_re_vote }))}
                    className="relative w-8 h-4 rounded-full transition-colors"
                    style={{ background: form.allow_re_vote ? '#d4af37' : 'rgba(255,255,255,0.12)' }}
                  >
                    <div className="absolute top-0.5 rounded-full w-3 h-3 bg-white transition-transform"
                      style={{ transform: form.allow_re_vote ? 'translateX(18px)' : 'translateX(2px)' }} />
                  </div>
                  <span className="text-[11px] text-white/50">Allow re-vote</span>
                </label>

                <button
                  onClick={() => {
                    if (!form.question.trim()) { toast.error('Add a question'); return; }
                    if (form.type === 'choice' && form.options.filter(Boolean).length < 2) { toast.error('Need at least 2 options'); return; }
                    createPollMutation.mutate(form);
                  }}
                  disabled={createPollMutation.isPending}
                  style={{ width: '100%', background: '#d4af37', color: '#000', border: 'none', borderRadius: 8, padding: '8px 0', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                >
                  {createPollMutation.isPending ? 'Launching...' : form.scheduled_at ? '📅 Schedule Poll' : '🚀 Launch Poll'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl space-y-3"
          style={{ background: 'rgba(11,11,24,0.95)', border: '1px solid rgba(212,175,55,0.15)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {activePoll.type && activePoll.type !== 'choice' && (
                <span className="text-[10px] font-bold uppercase tracking-wider mr-2"
                  style={{ color: '#C9A84C' }}>
                  {POLL_TYPES.find(p => p.id === activePoll.type)?.icon} {activePoll.type}
                </span>
              )}
              <h3 className="font-bold text-white">{activePoll.question}</h3>
              {timeRemaining !== null && (
                <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: timeRemaining < 10 ? '#C0392B' : '#d4af37' }}>
                  <Clock className="w-3 h-3" />
                  {formatTime(timeRemaining)}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              {isHost && (
                <button onClick={copyResults} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ background: 'rgba(201,168,76,0.15)' }} title="Copy results">
                  <Copy className="w-3.5 h-3.5 text-[#C9A84C]" />
                </button>
              )}
              {isHost && (
                <button onClick={closePoll} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ background: 'rgba(192,57,43,0.15)' }} title="Close poll">
                  <X className="w-3.5 h-3.5 text-[#C0392B]" />
                </button>
              )}
            </div>
          </div>

          {/* Bar chart (choice only) */}
          {activePoll.type === 'choice' && voteStats.length > 0 && (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={voteStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} height={32} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                <Tooltip
                  contentStyle={{ background: 'rgba(8,11,24,0.95)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8 }}
                  labelStyle={{ color: '#fff', fontSize: 11 }}
                  formatter={(v) => [`${v} votes`, '']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {voteStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Vote UI */}
          {renderVoteOptions()}

          {/* Re-vote notice */}
          {activePoll.allow_re_vote && userVotes[activePoll.id] !== undefined && (
            <div className="flex items-center gap-2 text-xs" style={{ color: '#C9A84C' }}>
              <RotateCcw className="w-3 h-3" />
              You can change your vote
            </div>
          )}

          {/* Total votes */}
          <p className="text-[10px] text-white/30 text-right">{pollVotes?.length || 0} votes</p>
        </motion.div>
      )}
    </div>
  );
}
