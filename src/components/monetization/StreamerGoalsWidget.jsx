import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, Check, Trash2, X, Zap, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const GOAL_ICONS = { tips: '💰', subscribers: '⭐', viewers: '👁', messages: '💬', custom: '🎯' };
const GOAL_COLORS = ['#d4af37', '#00d4ff', '#a78bfa', '#22c55e', '#f97316', '#f472b6'];

function GoalBar({ goal, onUpdate, isCreator }) {
  const pct = Math.min(100, ((goal.current_amount || 0) / goal.target_amount) * 100);
  const isComplete = pct >= 100;
  const prevPct = React.useRef(pct);

  useEffect(() => {
    if (pct >= 100 && prevPct.current < 100) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: [goal.color || '#d4af37', '#fff', '#00d4ff'] });
      toast.success(`🎉 Goal "${goal.title}" reached!`);
    }
    prevPct.current = pct;
  }, [pct]);

  return (
    <motion.div layout className={`rounded-xl border p-4 space-y-3 transition-all ${isComplete ? 'border-[#22c55e]/50 bg-[#22c55e]/5' : 'border-white/10 bg-white/3'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{GOAL_ICONS[goal.goal_type] || '🎯'}</span>
          <div>
            <p className="font-semibold text-white text-sm">{goal.title}</p>
            {goal.reward_text && <p className="text-[10px] text-white/50">{goal.reward_text}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isComplete && <Badge className="text-[9px] bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30">✓ Complete!</Badge>}
          {isCreator && !isComplete && (
            <button
              onClick={() => onUpdate(goal.id, Math.min(goal.target_amount, (goal.current_amount || 0) + 1))}
              className="w-6 h-6 rounded bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center text-xs"
              title="Manually increment"
            >+</button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[10px] mb-1.5">
          <span className="text-white/50">
            {goal.goal_type === 'tips' ? `$${(goal.current_amount || 0).toLocaleString()}` : (goal.current_amount || 0).toLocaleString()}
            {' / '}
            {goal.goal_type === 'tips' ? `$${goal.target_amount.toLocaleString()}` : goal.target_amount.toLocaleString()}
          </span>
          <span style={{ color: goal.color || '#d4af37' }} className="font-bold">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-5 bg-white/5 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full relative overflow-hidden"
            style={{ background: isComplete ? '#22c55e' : `linear-gradient(90deg, ${goal.color || '#d4af37'}88, ${goal.color || '#d4af37'})` }}
          >
            {/* Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </motion.div>
          {/* Milestone markers at 25/50/75% */}
          {[25, 50, 75].map(m => (
            <div key={m} className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: `${m}%` }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function StreamerGoalsWidget({ creatorId, roomId, isCreator, embedded = false }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', goal_type: 'tips', target_amount: 100, reward_text: '', color: '#d4af37' });

  const { data: goals = [] } = useQuery({
    queryKey: ['streamer-goals', creatorId, roomId],
    queryFn: () => base44.entities.StreamerGoal.filter(
      roomId ? { creator_id: creatorId, room_id: roomId, status: 'active' } : { creator_id: creatorId, status: 'active' },
      'created_date'
    ),
    enabled: !!creatorId,
    refetchInterval: 5000, // real-time polling
  });

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.StreamerGoal.subscribe((event) => {
      if (event.data?.creator_id === creatorId) {
        qc.invalidateQueries(['streamer-goals', creatorId, roomId]);
      }
    });
    return unsub;
  }, [creatorId, roomId]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StreamerGoal.create(data),
    onSuccess: () => { qc.invalidateQueries(['streamer-goals']); setShowForm(false); toast.success('Goal created!'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, amount }) => base44.entities.StreamerGoal.update(id, { current_amount: amount }),
    onSuccess: () => qc.invalidateQueries(['streamer-goals']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StreamerGoal.delete(id),
    onSuccess: () => qc.invalidateQueries(['streamer-goals']),
  });

  const handleCreate = () => {
    if (!form.title || !form.target_amount) return toast.error('Title and target required');
    createMutation.mutate({ ...form, creator_id: creatorId, room_id: roomId || null, status: 'active' });
  };

  const containerClass = embedded
    ? 'space-y-3'
    : 'min-h-screen bg-[#0d0618] text-white p-4 max-w-2xl mx-auto space-y-5';

  return (
    <div className={containerClass}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#d4af37] flex items-center gap-2"><Target className="w-5 h-5" /> Streamer Goals</h2>
          {isCreator && (
            <Button onClick={() => setShowForm(!showForm)} size="sm" className="bg-[#d4af37] text-black font-bold hover:bg-[#f5e6a3] gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Goal
            </Button>
          )}
        </div>
      )}

      {embedded && isCreator && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[#d4af37] flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Goals</p>
          <button onClick={() => setShowForm(!showForm)} className="text-[10px] text-[#d4af37] hover:underline">+ Add</button>
        </div>
      )}

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/5 border border-[#d4af37]/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/60">New Goal</p>
                <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white"><X className="w-3.5 h-3.5" /></button>
              </div>

              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Goal title (e.g. 'New Webcam Fund')"
                className="bg-white/5 border-white/20 text-white h-8 text-sm placeholder:text-white/25" />

              <div className="grid grid-cols-2 gap-2">
                <select value={form.goal_type} onChange={e => setForm(f => ({ ...f, goal_type: e.target.value }))}
                  className="bg-white/5 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white outline-none">
                  {Object.entries(GOAL_ICONS).map(([k, v]) => (
                    <option key={k} value={k} className="bg-[#0d0618]">{v} {k}</option>
                  ))}
                </select>
                <Input type="number" value={form.target_amount}
                  onChange={e => setForm(f => ({ ...f, target_amount: Number(e.target.value) }))}
                  placeholder="Target" className="bg-white/5 border-white/20 text-white h-8 text-sm" />
              </div>

              <Input value={form.reward_text} onChange={e => setForm(f => ({ ...f, reward_text: e.target.value }))}
                placeholder="Reward: 'I'll dance on stream!'" className="bg-white/5 border-white/20 text-white h-8 text-sm placeholder:text-white/25" />

              {/* Color picker */}
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-white/40">Color:</p>
                <div className="flex gap-1.5">
                  {GOAL_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${form.color === c ? 'border-white scale-125' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>

              <Button onClick={handleCreate} disabled={createMutation.isPending}
                className="w-full bg-[#d4af37] text-black font-bold hover:bg-[#f5e6a3] h-8 text-sm">
                <Check className="w-3.5 h-3.5 mr-1.5" /> Create Goal
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals */}
      {goals.length === 0 && !showForm ? (
        <div className="text-center py-6 text-white/30">
          <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{isCreator ? 'Create your first goal!' : 'No active goals'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {goals.map(goal => (
            <div key={goal.id} className="relative group">
              <GoalBar goal={goal} onUpdate={(id, amount) => updateMutation.mutate({ id, amount })} isCreator={isCreator} />
              {isCreator && (
                <button
                  onClick={() => deleteMutation.mutate(goal.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded opacity-0 group-hover:opacity-100 hover:bg-red-900/30 flex items-center justify-center text-white/30 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}