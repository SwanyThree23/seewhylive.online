import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Plus, X, Zap } from 'lucide-react';
import { toast } from 'sonner';

const QUICK_TEMPLATES = [
  { q: 'How is the stream so far?', opts: ['🔥 Fire', '👍 Good', '😐 Okay', '💤 Boring'] },
  { q: 'What should we do next?', opts: ['Keep going', 'Switch topics', 'Take a break', 'Viewer Q&A'] },
  { q: 'Rate the vibe right now', opts: ['🔥 10/10', '💯 8/10', '👍 6/10', '😕 4/10'] },
  { q: 'Should I do a giveaway?', opts: ['YES! 🎁', 'Maybe later', 'No thanks'] },
];

export default function QuickPollLauncher({ roomId, hostId, isHost }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const qc = useQueryClient();

  const launchMutation = useMutation({
    mutationFn: ({ q, opts }) => base44.entities.Poll.create({
      room_id: roomId,
      host_id: hostId,
      question: q,
      options: opts.filter(Boolean),
      status: 'active',
      timeout_seconds: 60,
      created_at: new Date().toISOString(),
    }),
    onSuccess: (poll) => {
      toast.success('Poll launched! 📊');
      setOpen(false);
      setCustom(false);
      setQuestion('');
      setOptions(['', '']);
      qc.invalidateQueries({ queryKey: ['polls', roomId] });
      if (hostId) {
        base44.entities.Activity.create({
          user_id: hostId,
          type: 'milestone',
          title: `Launched quick poll: ${poll?.question || question || 'Poll'}`,
        }).catch(() => {});
      }
    },
  });

  if (!isHost) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95"
        style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          background: open ? 'rgba(212,175,55,0.25)' : 'rgba(212,175,55,0.1)',
          border: '1px solid rgba(212,175,55,0.3)',
          color: '#D4AF37',
        }}>
        <BarChart2 className="w-3 h-3" /> Poll
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full mb-2 right-0 z-50 rounded-2xl overflow-hidden"
            style={{ background: '#080B18', border: '1px solid rgba(212,175,55,0.25)', width: 240, boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}>
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[10px] font-black uppercase text-[#D4AF37]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Quick Poll
              </span>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>

            {!custom ? (
              <div className="p-2 space-y-1">
                {QUICK_TEMPLATES.map((t, i) => (
                  <button key={i}
                    onClick={() => launchMutation.mutate({ q: t.q, opts: t.opts })}
                    disabled={launchMutation.isPending}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/5 transition-all">
                    <p className="text-[11px] font-bold text-white">{t.q}</p>
                    <p className="text-[11px] text-white/30">{t.opts.join(' · ')}</p>
                  </button>
                ))}
                <button onClick={() => setCustom(true)}
                  className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-bold transition-all"
                  style={{ color: '#D4AF37' }}>
                  <Plus className="w-3 h-3" /> Custom poll
                </button>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                <input
                  placeholder="Your question..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  className="w-full text-[11px] px-2.5 py-2 rounded-lg text-white placeholder:text-white/30 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                {options.map((opt, i) => (
                  <input key={i}
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={e => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                    className="w-full text-[11px] px-2.5 py-2 rounded-lg text-white placeholder:text-white/30 outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                ))}
                {options.length < 5 && (
                  <button onClick={() => setOptions([...options, ''])}
                    className="text-[10px] text-[#D4AF37] flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add option
                  </button>
                )}
                <button
                  onClick={() => launchMutation.mutate({ q: question, opts: options })}
                  disabled={!question || options.filter(Boolean).length < 2 || launchMutation.isPending}
                  className="w-full py-2 rounded-xl text-[11px] font-black uppercase transition-all disabled:opacity-40"
                  style={{ background: '#D4AF37', color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  <Zap className="w-3 h-3 inline mr-1" /> Launch Poll
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}