import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { X, Zap } from 'lucide-react';

const G = '#D4AF37';
const ORANGE = '#D4854A';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.3)';

/**
 * AdPollPopup — when a video with an attached quick poll starts playing,
 * the poll pops up automatically for viewers to vote.
 * The poll is attached by the host in Product Ad Studio and stored with
 * room_id = 'ad:<videoUrl>' so any playback surface can find it.
 */
export default function AdPollPopup({ videoUrl, playing }) {
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [votedIndex, setVotedIndex] = useState(null);
  const showTimer = useRef(null);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  // Reset per video
  useEffect(() => {
    setDismissed(false);
    setVisible(false);
    setVotedIndex(null);
  }, [videoUrl]);

  // Attached poll (host created it in Product Ad Studio)
  const { data: poll } = useQuery({
    queryKey: ['ad-poll', videoUrl],
    queryFn: async () => {
      const list = await base44.entities.Poll.filter({ room_id: 'ad:' + videoUrl });
      return list[0] || null;
    },
    enabled: !!videoUrl,
  });

  // All votes → live tallied results
  const { data: votes = [] } = useQuery({
    queryKey: ['ad-poll-votes', poll?.id],
    queryFn: () => base44.entities.PollVote.filter({ poll_id: poll.id }),
    enabled: !!poll,
  });

  // Realtime tally updates
  useEffect(() => {
    if (!poll) return undefined;
    const unsub = base44.entities.PollVote.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['ad-poll-votes', poll.id] });
    });
    return unsub;
  }, [poll?.id]);

  const myVote = poll ? votes.find((v) => v.user_id === user?.id) : null;

  // Auto-pop shortly after the ad actually starts playing
  useEffect(() => {
    if (!playing || !poll || poll.status !== 'active' || dismissed || myVote) return undefined;
    clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(showTimer.current);
  }, [playing, poll, dismissed, myVote]);

  const tally = useMemo(() => {
    const counts = (poll?.options || []).map(() => 0);
    votes.forEach((v) => {
      if (v.option_index >= 0 && v.option_index < counts.length) counts[v.option_index] += 1;
    });
    return { counts, total: votes.length };
  }, [votes, poll]);

  async function vote(i) {
    if (!poll || !user || myVote || votedIndex !== null) return;
    setVotedIndex(i);
    try {
      await base44.entities.PollVote.create({
        room_id: poll.room_id,
        poll_id: poll.id,
        user_id: user.id,
        option_index: i,
      });
      queryClient.invalidateQueries({ queryKey: ['ad-poll-votes', poll.id] });
    } catch {
      setVotedIndex(null);
    }
  }

  if (!poll || poll.status !== 'active' || !visible) return null;

  const chosen = votedIndex !== null ? votedIndex : (myVote ? myVote.option_index : null);
  const showResults = chosen !== null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[95] flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        <motion.div
          key={poll.id}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="pointer-events-auto w-full max-w-md rounded-2xl overflow-hidden"
          style={{ background: PANEL, border: `1px solid ${BORDER}`, boxShadow: '0 10px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.18)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" style={{ color: ORANGE }} />
              <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                Quick Poll
              </span>
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>· from this ad</span>
            </div>
            <button onClick={() => { setVisible(false); setDismissed(true); }}
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            <p className="text-[13px] font-bold mb-3" style={{ color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>
              {poll.question}
            </p>

            {!showResults ? (
              <div className="space-y-1.5">
                {(poll.options || []).map((opt, i) => (
                  <button key={i} onClick={() => vote(i)}
                    className="w-full text-left rounded-xl px-3 py-2.5 text-[12px] font-bold transition-all active:scale-[0.98]"
                    style={{ background: 'rgba(212,175,55,0.08)', border: `1px solid ${G}44`, color: 'rgba(255,255,255,0.85)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(poll.options || []).map((opt, i) => {
                  const pct = tally.total > 0 ? Math.round((tally.counts[i] / tally.total) * 100) : 0;
                  const mine = chosen === i;
                  return (
                    <div key={i} className="relative rounded-xl overflow-hidden" style={{ border: `1px solid ${mine ? G + '88' : 'rgba(255,255,255,0.08)'}` }}>
                      <div className="absolute inset-y-0 left-0 transition-all duration-500"
                        style={{ width: `${pct}%`, background: mine ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.08)' }} />
                      <div className="relative flex items-center justify-between px-3 py-2">
                        <span className="text-[11px] font-bold" style={{ color: mine ? G : 'rgba(255,255,255,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                          {opt}{mine ? ' · your vote' : ''}
                        </span>
                        <span className="text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Share Tech Mono, monospace' }}>
                          {pct}% ({tally.counts[i]})
                        </span>
                      </div>
                    </div>
                  );
                })}
                <p className="text-[9px] text-center pt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {tally.total} vote{tally.total !== 1 ? 's' : ''} · updates live
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}