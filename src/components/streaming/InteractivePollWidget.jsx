import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { BarChart3, Plus, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InteractivePollWidget({ roomId, isHost }) {
  const [polls, setPolls] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });
  const [votes, setVotes] = useState({});

  const handleAddOption = () => {
    setNewPoll(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleRemoveOption = (index) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleCreatePoll = async () => {
    if (!newPoll.question.trim() || newPoll.options.some(o => !o.trim())) {
      toast.error('Fill in all fields');
      return;
    }

    try {
      const poll = {
        id: `poll_${Date.now()}`,
        room_id: roomId,
        question: newPoll.question,
        options: newPoll.options,
        created_at: new Date().toISOString(),
        status: 'active'
      };

      setPolls(prev => [poll, ...prev]);
      setVotes(prev => ({
        ...prev,
        [poll.id]: {}
      }));
      setNewPoll({ question: '', options: ['', ''] });
      setShowCreate(false);
      toast.success('Poll created!');
    } catch (err) {
      toast.error('Poll creation failed');
    }
  };

  const handleVote = (pollId, optionIndex) => {
    setVotes(prev => ({
      ...prev,
      [pollId]: { ...prev[pollId], voted: optionIndex }
    }));
  };

  const getTotalVotes = (pollId) => {
    return Object.values(polls.find(p => p.id === pollId)?.option_votes || {}).reduce((a, b) => a + b, 0) || 1;
  };

  if (polls.length === 0 && !showCreate) {
    return isHost ? (
      <Button
        onClick={() => setShowCreate(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 flex items-center justify-center gap-2"
      >
        <BarChart3 className="w-3 h-3" />
        Create Poll
      </Button>
    ) : null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#1a0a2e]/50 border border-blue-600/20 rounded-lg p-3 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Live Poll</h3>
        </div>
        {isHost && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-[10px] text-white/50 hover:text-white/80"
          >
            {showCreate ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 border-t border-white/10 pt-3"
          >
            <input
              type="text"
              placeholder="Poll question"
              value={newPoll.question}
              onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[9px] text-white placeholder-white/40"
            />

            <div className="space-y-1.5">
              {newPoll.options.map((option, idx) => (
                <div key={idx} className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={option}
                    onChange={(e) =>
                      setNewPoll(prev => ({
                        ...prev,
                        options: prev.options.map((o, i) => (i === idx ? e.target.value : o))
                      }))
                    }
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[9px] text-white placeholder-white/40"
                  />
                  {newPoll.options.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(idx)}
                      className="text-white/40 hover:text-white/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={handleAddOption}
                className="flex-1 text-[9px] bg-white/5 hover:bg-white/10 rounded px-2 py-1 text-white/60"
              >
                + Add Option
              </button>
              <Button
                onClick={handleCreatePoll}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-8 text-[9px]"
              >
                Launch
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {polls.map((poll, pollIdx) => (
        <motion.div
          key={poll.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <p className="text-[10px] font-semibold text-white">{poll.question}</p>

          <div className="space-y-1.5">
            {poll.options.map((option, optIdx) => {
              const isVoted = votes[poll.id]?.voted === optIdx;
              const fakeVotes = Math.floor(Math.random() * 50) + 5;
              const percentage = (fakeVotes / 100) * 100;

              return (
                <button
                  key={optIdx}
                  onClick={() => handleVote(poll.id, optIdx)}
                  className={`w-full text-left transition-all ${isVoted ? 'ring-1 ring-blue-400' : ''}`}
                >
                  <div className="flex items-center justify-between text-[9px] mb-0.5">
                    <div className="flex items-center gap-1">
                      {isVoted && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                      <span className="text-white">{option}</span>
                    </div>
                    <span className="text-white/50">{Math.round(percentage)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}