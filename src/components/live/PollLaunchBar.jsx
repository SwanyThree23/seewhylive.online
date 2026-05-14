import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart2, Plus, X, Zap, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const QUICK_TEMPLATES = [
  { q: 'How is the stream so far?', opts: ['🔥 Fire', '👍 Good', '😐 Okay', '💤 Boring'] },
  { q: 'What should we do next?', opts: ['Keep going', 'Switch topics', 'Viewer Q&A', 'Take a break'] },
  { q: 'Rate the vibe right now', opts: ['🔥 10/10', '💯 8/10', '👍 6/10', '😕 4/10'] },
  { q: 'Should I do a giveaway?', opts: ['YES! 🎁', 'Maybe later', 'No thanks'] },
  { q: 'Pick the next topic', opts: ['Music', 'Gaming', 'Real talk', 'Collab'] },
];

export default function PollLaunchBar({ roomId, hostId, activePoll, isHost }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [duration, setDuration] = useState(60);
  const qc = useQueryClient();

  const launchMutation = useMutation({
    mutationFn: ({ q, opts, dur }) => base44.entities.Poll.create({
      room_id: roomId,
      host_id: hostId,
      question: q,
      options: opts.filter(Boolean).map(o => ({ text: o, votes: 0 })),
      status: 'active',
      total_votes: 0,
      timeout_seconds: dur,
      ends_at: new Date(Date.now() + dur * 1000).toISOString(),
      created_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      toast.success('Poll launched! 📊');
      setOpen(false);
      setCustom(false);
      setQuestion('');
      setOptions(['', '', '']);
      qc.invalidateQueries(['livepoll', roomId]);
      qc.invalidateQueries(['polls', roomId]);
    },
  });

  const endPollMutation = useMutation({
    mutationFn: (id) => base44.entities.Poll.update(id, { status: 'ended' }),
    onSuccess: () => {
      toast.success('Poll ended');
      qc.invalidateQueries(['livepoll', roomId]);
      qc.invalidateQueries(['polls', roomId]);
    },
  });

  if (!isHost) return null;

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95"
        style={{
          ...T,
          background: activePoll
            ? 'rgba(74,222,128,0.15)'
            : open ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.08)',
          border: activePoll ? '1px solid rgba(74,222,128,0.3)' : `1px solid ${G}30`,
          color: activePoll ? '#4ADE80' : G,
        }}
      >
        <BarChart2 className="w-3 h-3" />
        {activePoll ? 'Poll Live' : 'Poll'}
        {activePoll && <motion.div className="w-1.5 h-1.5 rounded-full bg-green-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="absolute bottom-full mb-2 right-0 z-50 rounded-2xl overflow-hidden"
              style={{
                background: '#08051A',
                border: `1px solid ${G}25`,
                width: 280,
                boxShadow: '0 12px 48px rgba(0,0,0,0.8)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-[11px] font-black uppercase" style={{ color: G, ...T }}>Poll Manager</span>
                <button onClick={() => setOpen(false)}><X className="w-3.5 h-3.5 text-white/30" /></button>
              </div>

              {/* Active poll controls */}
              {activePoll && (
                <div className="p-3 space-y-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start gap-2">
                    <motion.div className="w-2 h-2 rounded-full bg-green-400 mt-1 shrink-0" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                    <p className="text-[11px] font-bold text-white flex-1 leading-snug">{activePoll.question}</p>
                  </div>
                  <div className="flex items-center justify-between text-[9px]" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>
                    <span>{activePoll.total_votes || 0} votes · {(activePoll.options || []).length} options</span>
                  </div>
                  <button
                    onClick={() => endPollMutation.mutate(activePoll.id)}
                    disabled={endPollMutation.isPending}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all disabled:opacity-50"
                    style={{ background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.25)', color: '#FF6B6B', ...T }}
                  >
                    <Trash2 className="w-3 h-3" /> End Poll Now
                  </button>
                </div>
              )}

              {/* New poll section */}
              {!activePoll && (
                <div className="p-3 space-y-2">
                  {!custom ? (
                    <>
                      <p className="text-[9px] uppercase font-bold" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>Quick Launch</p>
                      {QUICK_TEMPLATES.map((t, i) => (
                        <button key={i}
                          onClick={() => launchMutation.mutate({ q: t.q, opts: t.opts, dur: duration })}
                          disabled={launchMutation.isPending}
                          className="w-full text-left px-2.5 py-2 rounded-xl transition-all hover:bg-white/5 active:scale-98"
                          style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <p className="text-[11px] font-bold text-white leading-snug">{t.q}</p>
                          <p className="text-[9px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.opts.join(' · ')}</p>
                        </button>
                      ))}
                      <button onClick={() => setCustom(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase"
                        style={{ background: `${G}10`, border: `1px solid ${G}20`, color: G, ...T }}>
                        <Plus className="w-3 h-3" /> Custom Poll
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setCustom(false)} className="text-[9px] font-bold flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        ← Templates
                      </button>
                      <input
                        placeholder="Ask your audience something..."
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        className="w-full text-[11px] px-2.5 py-2 rounded-lg text-white placeholder:text-white/25 outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      {options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <input
                            placeholder={`Option ${i + 1}`}
                            value={opt}
                            onChange={e => {
                              const next = [...options];
                              next[i] = e.target.value;
                              setOptions(next);
                            }}
                            className="flex-1 text-[11px] px-2.5 py-2 rounded-lg text-white placeholder:text-white/25 outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                          {options.length > 2 && (
                            <button onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                              <X className="w-3 h-3 text-white/25 hover:text-white/60" />
                            </button>
                          )}
                        </div>
                      ))}
                      {options.length < 6 && (
                        <button onClick={() => setOptions([...options, ''])}
                          className="text-[9px] flex items-center gap-1 font-bold" style={{ color: G }}>
                          <Plus className="w-3 h-3" /> Add option
                        </button>
                      )}

                      {/* Duration selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Duration</span>
                        <div className="flex gap-1">
                          {[30, 60, 120, 300].map(d => (
                            <button key={d}
                              onClick={() => setDuration(d)}
                              className="px-2 py-0.5 rounded text-[9px] font-black"
                              style={{
                                ...T,
                                background: duration === d ? G : 'rgba(255,255,255,0.06)',
                                color: duration === d ? '#000' : 'rgba(255,255,255,0.4)',
                              }}>
                              {d < 60 ? `${d}s` : `${d / 60}m`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => launchMutation.mutate({ q: question, opts: options, dur: duration })}
                        disabled={!question.trim() || options.filter(Boolean).length < 2 || launchMutation.isPending}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all disabled:opacity-40"
                        style={{ background: G, color: '#000', ...T }}
                      >
                        <Zap className="w-3.5 h-3.5" /> Launch Poll
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}