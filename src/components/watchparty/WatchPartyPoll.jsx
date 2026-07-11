import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { BarChart3, Plus, X, Send, CheckCircle2, StopCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

// ── Compact result bar ──────────────────────────────────────────────────────
function ResultBar({ option, totalVotes, hasVoted, isMyVote }) {
  const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
  return (
    <div className="relative overflow-hidden rounded-lg"
      style={{ background: isMyVote ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)', border: isMyVote ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.08)' }}>
      {/* fill */}
      <motion.div
        initial={{ width: 0 }} animate={{ width: hasVoted ? `${pct}%` : '0%' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="absolute inset-0 rounded-lg"
        style={{ background: isMyVote ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)' }}
      />
      <div className="relative flex items-center justify-between px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          {isMyVote && <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: '#d4af37' }} />}
          <span className="text-[11px] font-bold text-white">{option.text}</span>
        </div>
        {hasVoted && (
          <span className="text-[10px] font-black tabular-nums shrink-0" style={{ color: isMyVote ? '#d4af37' : 'rgba(255,255,255,0.4)' }}>
            {pct}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── Active poll viewer (for all members) ────────────────────────────────────
function ActivePoll({ poll, currentUser, onVote }) {
  const [chosen, setChosen] = useState(null);
  const myVoteId = poll.my_votes?.[currentUser?.id];
  const hasVoted = !!myVoteId;
  const totalVotes = (poll.options || []).reduce((s, o) => s + (o.votes || 0), 0);

  const submit = () => {
    if (!chosen) return;
    onVote(poll.id, chosen);
    setChosen(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(7,7,15,0.97)', border: '1px solid rgba(212,175,55,0.3)' }}>
      {/* header */}
      <div className="flex items-center gap-2 px-3 py-2"
        style={{ background: 'rgba(212,175,55,0.08)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-[11px] font-black uppercase tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#d4af37' }}>
          Live Poll · {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </span>
      </div>
      {/* question */}
      <div className="px-3 pt-2.5 pb-2">
        <p className="text-[12px] font-bold text-white leading-snug">{poll.question}</p>
      </div>
      {/* options */}
      <div className="px-3 pb-2.5 space-y-1.5">
        {(poll.options || []).map(opt => (
          !hasVoted ? (
            <button key={opt.id} onClick={() => setChosen(opt.id)}
              className="w-full rounded-lg px-2.5 py-2 text-left text-[11px] font-bold transition-all"
              style={{
                background: chosen === opt.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                border: chosen === opt.id ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: chosen === opt.id ? '#d4af37' : 'rgba(255,255,255,0.8)',
              }}>
              {chosen === opt.id && '✓ '}{opt.text}
            </button>
          ) : (
            <ResultBar key={opt.id} option={opt} totalVotes={totalVotes}
              hasVoted={hasVoted} isMyVote={myVoteId === opt.id} />
          )
        ))}
        {!hasVoted && (
          <button
            style={{ width: '100%', marginTop: 4, height: 28, fontSize: 10, fontWeight: 900, background: chosen ? '#d4af37' : 'rgba(255,255,255,0.06)', color: chosen ? '#000' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 6, cursor: chosen ? 'pointer' : 'default', fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase' }}
            disabled={!chosen} onClick={submit}>
            Submit Vote
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Host creator form ────────────────────────────────────────────────────────
function PollCreator({ partyId, roomId, currentUser, onPollCreated }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const addOption = () => options.length < 6 && setOptions(p => [...p, '']);
  const removeOption = (i) => options.length > 2 && setOptions(p => p.filter((_, idx) => idx !== i));
  const updateOption = (i, v) => setOptions(p => p.map((x, idx) => idx === i ? v : x));

  const launch = async () => {
    const validOpts = options.filter(o => o.trim());
    if (!question.trim() || validOpts.length < 2) {
      toast.error('Need a question and at least 2 options');
      return;
    }
    const poll = {
      id: `poll_${Date.now()}`,
      question: question.trim(),
      options: validOpts.map((text, i) => ({ id: `o${i}`, text, votes: 0 })),
      my_votes: {},
      status: 'active',
      created_at: Date.now(),
    };
    try {
      await base44.entities.Message.create({
        room_id: roomId || partyId,
        user_id: currentUser.id,
        user_name: currentUser.full_name || currentUser.email,
        content: JSON.stringify(poll),
        message_type: 'announcement',
      });
    } catch {
      toast.error('Failed to launch poll. Please try again.');
      return;
    }
    onPollCreated(poll);
    setQuestion('');
    setOptions(['', '']);
    setOpen(false);
    toast.success('Poll launched!');
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(7,7,15,0.97)', border: '1px solid rgba(212,175,55,0.18)' }}>
      <button className="w-full flex items-center gap-2 px-3 py-2 transition-all"
        style={{ background: 'rgba(0,0,0,0.3)', borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
        onClick={() => setOpen(v => !v)}>
        <BarChart3 className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-widest flex-1 text-left" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#d4af37' }}>
          Create Poll
        </span>
        {open ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-3 space-y-2.5">
              <input
                placeholder="Ask the viewers something..."
                value={question}
                onChange={e => setQuestion(e.target.value)}
                style={{ width: '100%', height: 32, padding: '0 10px', fontSize: 11, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }}
              />
              <div className="space-y-1.5">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-1.5">
                    <input
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={e => updateOption(i, e.target.value)}
                      style={{ flex: 1, height: 28, padding: '0 8px', fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }}
                    />
                    {options.length > 2 && (
                      <button onClick={() => removeOption(i)}
                        className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(180,50,30,0.15)', border: '1px solid rgba(180,50,30,0.2)' }}>
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <button onClick={addOption}
                    className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded"
                    style={{ color: 'rgba(212,175,55,0.6)', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                    <Plus className="w-2.5 h-2.5" /> Add option
                  </button>
                )}
              </div>
              <button
                style={{ width: '100%', height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 10, fontWeight: 900, background: '#d4af37', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', opacity: (!question.trim() || options.filter(o => o.trim()).length < 2) ? 0.5 : 1 }}
                disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
                onClick={launch}>
                <Send className="w-3 h-3" /> Launch Poll
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main widget ─────────────────────────────────────────────────────────────
export default function WatchPartyPoll({ partyId, roomId, currentUser, isHost }) {
  const [polls, setPolls] = useState([]);     // live polls from messages
  const [closedIds, setClosedIds] = useState(new Set());

  // Subscribe to Message entity for new polls broadcast by host
  useEffect(() => {
    if (!partyId) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type !== 'create') return;
      const msg = event.data;
      if (msg?.room_id !== (roomId || partyId)) return;
      if (msg?.message_type !== 'announcement') return;
      try {
        const poll = JSON.parse(msg.content);
        if (!poll?.question || !poll?.options) return;
        setPolls(prev => {
          if (prev.find(p => p.id === poll.id)) return prev;
          return [poll, ...prev];
        });
      } catch { /* not a poll message */ }
    });
    return unsub;
  }, [partyId, roomId]);

  const handleVote = (pollId, optionId) => {
    if (!currentUser) return;
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p;
      return {
        ...p,
        options: p.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o),
        my_votes: { ...p.my_votes, [currentUser.id]: optionId },
      };
    }));
  };

  const closeHostPoll = (pollId) => {
    setClosedIds(prev => new Set([...prev, pollId]));
  };

  const activePolls = polls.filter(p => !closedIds.has(p.id));

  return (
    <div className="space-y-2">
      {/* Host creator */}
      {isHost && (
        <PollCreator
          partyId={partyId}
          roomId={roomId}
          currentUser={currentUser}
          onPollCreated={(poll) => setPolls(prev => [poll, ...prev])}
        />
      )}

      {/* Active polls */}
      <AnimatePresence>
        {activePolls.map(poll => (
          <motion.div key={poll.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="relative">
            <ActivePoll poll={poll} currentUser={currentUser} onVote={handleVote} />
            {isHost && (
              <button onClick={() => closeHostPoll(poll.id)}
                className="absolute top-2 right-2 flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(180,50,30,0.2)', border: '1px solid rgba(180,50,30,0.3)', color: '#ff8866' }}>
                <StopCircle className="w-2.5 h-2.5" /> End
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {!isHost && activePolls.length === 0 && (
        <p className="text-center text-[10px] py-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
          No active polls — the host will launch one soon
        </p>
      )}
    </div>
  );
}