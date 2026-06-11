import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Check, Trash2, X, Zap, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const inputStyle = {
  width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif',
};

const GOAL_ICONS = { tips: '💰', subscribers: '⭐', viewers: '👁', messages: '💬', custom: '🎯' };
const GOAL_COLORS = ['#d4af37', '#D4AF37', '#D4AF37', '#6DBF7E', '#D4854A', '#D4854A'];

function GoalBar({ goal, onUpdate, isCreator }) {
  const pct = Math.min(100, ((goal.current_amount || 0) / goal.target_amount) * 100);
  const isComplete = pct >= 100;
  const prevPct = React.useRef(pct);

  useEffect(() => {
    if (pct >= 100 && prevPct.current < 100) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: [goal.color || '#d4af37', '#fff', '#D4AF37'] });
      toast.success(`🎉 Goal "${goal.title}" reached!`);
    }
    prevPct.current = pct;
  }, [pct]);

  return (
    <motion.div layout style={{ borderRadius: 12, border: isComplete ? '1px solid rgba(34,197,94,0.5)' : '1px solid rgba(255,255,255,0.1)', background: isComplete ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.03)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{GOAL_ICONS[goal.goal_type] || '🎯'}</span>
          <div>
            <p style={{ fontWeight: 600, color: '#fff', fontSize: 13, margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>{goal.title}</p>
            {goal.reward_text && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>{goal.reward_text}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isComplete && (
            <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(34,197,94,0.2)', color: '#6DBF7E', border: '1px solid rgba(34,197,94,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              ✓ Complete!
            </span>
          )}
          {isCreator && !isComplete && (
            <button
              onClick={() => onUpdate(goal.id, Math.min(goal.target_amount, (goal.current_amount || 0) + 1))}
              style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(212,175,55,0.1)', border: 'none', color: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
              title="Manually increment"
            >+</button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 6 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            {goal.goal_type === 'tips' ? `$${(goal.current_amount || 0).toLocaleString()}` : (goal.current_amount || 0).toLocaleString()}
            {' / '}
            {goal.goal_type === 'tips' ? `$${goal.target_amount.toLocaleString()}` : goal.target_amount.toLocaleString()}
          </span>
          <span style={{ color: goal.color || '#d4af37', fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>{pct.toFixed(0)}%</span>
        </div>
        <div style={{ height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: 99, position: 'relative', overflow: 'hidden', background: isComplete ? '#6DBF7E' : `linear-gradient(90deg, ${goal.color || '#d4af37'}88, ${goal.color || '#d4af37'})` }}
          >
            {/* Shimmer */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)', animation: 'pulse 2s infinite' }} />
          </motion.div>
          {/* Milestone markers at 25/50/75% */}
          {[25, 50, 75].map(m => (
            <div key={m} style={{ position: 'absolute', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.1)', left: `${m}%` }} />
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
    refetchInterval: 5000,
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

  const containerStyle = embedded
    ? { display: 'flex', flexDirection: 'column', gap: 12 }
    : { minHeight: '100vh', background: '#080B18', color: '#fff', padding: 16, maxWidth: 672, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'Barlow Condensed, sans-serif' };

  return (
    <div style={containerStyle}>
      {!embedded && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#d4af37', display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>
            <Target className="w-5 h-5" /> Streamer Goals
          </h2>
          {isCreator && (
            <button onClick={() => setShowForm(!showForm)}
              style={{ background: '#d4af37', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif' }}>
              <Plus className="w-3.5 h-3.5" /> Add Goal
            </button>
          )}
        </div>
      )}

      {embedded && isCreator && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#d4af37', display: 'flex', alignItems: 'center', gap: 6, margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>
            <Target className="w-3.5 h-3.5" /> Goals
          </p>
          <button onClick={() => setShowForm(!showForm)} style={{ fontSize: 10, color: '#d4af37', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Barlow Condensed, sans-serif' }}>+ Add</button>
        </div>
      )}

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>New Goal</p>
                <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X className="w-3.5 h-3.5" /></button>
              </div>

              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Goal title (e.g. 'New Webcam Fund')"
                style={{ ...inputStyle, height: 32, fontSize: 12 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select value={form.goal_type} onChange={e => setForm(f => ({ ...f, goal_type: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                  {Object.entries(GOAL_ICONS).map(([k, v]) => (
                    <option key={k} value={k}>{v} {k}</option>
                  ))}
                </select>
                <input type="number" value={form.target_amount}
                  onChange={e => setForm(f => ({ ...f, target_amount: Number(e.target.value) }))}
                  placeholder="Target" style={{ ...inputStyle, height: 32, fontSize: 12 }} />
              </div>

              <input value={form.reward_text} onChange={e => setForm(f => ({ ...f, reward_text: e.target.value }))}
                placeholder="Reward: 'I'll dance on stream!'" style={{ ...inputStyle, height: 32, fontSize: 12 }} />

              {/* Color picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>Color:</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {GOAL_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${form.color === c ? '#fff' : 'transparent'}`, background: c, cursor: 'pointer', transition: 'all 0.15s', transform: form.color === c ? 'scale(1.25)' : 'scale(1)' }} />
                  ))}
                </div>
              </div>

              <button onClick={handleCreate} disabled={createMutation.isPending}
                style={{ width: '100%', background: '#d4af37', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '8px 0', cursor: createMutation.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, opacity: createMutation.isPending ? 0.7 : 1 }}>
                <Check className="w-3.5 h-3.5" /> Create Goal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals */}
      {goals.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.3)' }}>
          <Target className="w-10 h-10" style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
          <p style={{ fontSize: 13, margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>{isCreator ? 'Create your first goal!' : 'No active goals'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {goals.map(goal => (
            <div key={goal.id} style={{ position: 'relative' }} className="group">
              <GoalBar goal={goal} onUpdate={(id, amount) => updateMutation.mutate({ id, amount })} isCreator={isCreator} />
              {isCreator && (
                <button
                  onClick={() => deleteMutation.mutate(goal.id)}
                  style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 6, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.15s' }}
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
