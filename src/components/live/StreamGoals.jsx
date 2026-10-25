import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, X, Check, TrendingUp, Zap, Share2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { fireAlert } from './HostAlertCenter';
import confetti from 'canvas-confetti';

const GOAL_TYPES = [
  { id: 'tips',    label: '💰 Tip Goal',    unit: '$',      prefix: '$' },
  { id: 'subs',    label: '⭐ Sub Goal',    unit: 'subs',   prefix: '' },
  { id: 'viewers', label: '👁 Viewer Goal', unit: 'viewers',prefix: '' },
  { id: 'custom',  label: '🎯 Custom Goal', unit: 'total',  prefix: '' },
];

const QUICK_PRESETS = [
  { goal_type: 'tips',    title: 'First $50 Tips',   target_amount: 50,   reward_text: 'Shoutout to every tipper!' },
  { goal_type: 'tips',    title: 'Tip $100',          target_amount: 100,  reward_text: "I'll do a dance!" },
  { goal_type: 'tips',    title: 'Tip $500',          target_amount: 500,  reward_text: 'Face reveal at goal!' },
  { goal_type: 'subs',    title: '10 Subscribers',   target_amount: 10,   reward_text: 'Special sub-only stream!' },
  { goal_type: 'viewers', title: '100 Viewers',       target_amount: 100,  reward_text: 'Giveaway at 100!' },
  { goal_type: 'viewers', title: '250 Viewers',       target_amount: 250,  reward_text: 'Collab stream unlocked!' },
];

function estimateMinutesLeft(current, target, ratePerMin) {
  if (!ratePerMin || ratePerMin <= 0) return null;
  const remaining = target - current;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / ratePerMin);
}

export default function StreamGoals({ isHost, roomId, creatorId, currentTips = 0, currentSubs = 0, currentViewers = 0 }) {
  const qc = useQueryClient();
  const [showForm, setShowForm]         = useState(false);
  const [showPresets, setShowPresets]   = useState(false);
  const [form, setForm]                 = useState({ goal_type: 'tips', title: '', target_amount: 100, reward_text: '' });
  const [completed, setCompleted]       = useState(new Set());
  const prevTipsRef                     = React.useRef(currentTips);
  const [tipRate, setTipRate]           = React.useState(0);
  const [viewerRate, setViewerRate]     = React.useState(0);

  const enabled = !!creatorId;

  const { data: goals = [] } = useQuery({
    queryKey: ['stream-goals', creatorId, roomId],
    queryFn: () => base44.entities.StreamerGoal.filter(
      roomId
        ? { creator_id: creatorId, room_id: roomId, status: 'active' }
        : { creator_id: creatorId, status: 'active' },
      'created_date'
    ),
    enabled,
    refetchInterval: 5000,
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.StreamerGoal.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stream-goals', creatorId, roomId] });
      setForm({ goal_type: 'tips', title: '', target_amount: 100, reward_text: '' });
      setShowForm(false);
      setShowPresets(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.StreamerGoal.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stream-goals', creatorId, roomId] }),
  });

  const completeMut = useMutation({
    mutationFn: (id) => base44.entities.StreamerGoal.update(id, { status: 'completed' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stream-goals', creatorId, roomId] }),
  });

  const shareGoalMut = useMutation({
    mutationFn: async (goal) => {
      const current = getCurrentValue(goal.goal_type);
      const gt = GOAL_TYPES.find(g => g.id === goal.goal_type);
      const pct = goal.target_amount > 0 ? Math.min(100, Math.round((current / goal.target_amount) * 100)) : 0;
      const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
      await base44.entities.Message.create({
        room_id: roomId,
        user_id: creatorId,
        user_name: 'System',
        content: `🎯 Goal: ${goal.title} — ${bar} ${pct}% (${gt?.prefix}${current}/${gt?.prefix}${goal.target_amount})${goal.reward_text ? ` · ${goal.reward_text}` : ''}`,
        type: 'system',
      });
    },
  });

  // Track tip rate ($/min) from tip changes
  useEffect(() => {
    const diff = currentTips - prevTipsRef.current;
    if (diff > 0) setTipRate(diff);
    prevTipsRef.current = currentTips;
  }, [currentTips]);

  const getCurrentValue = (type) => {
    if (type === 'tips')    return currentTips;
    if (type === 'subs')    return currentSubs;
    if (type === 'viewers') return currentViewers;
    return 0;
  };

  const getRateForType = (type) => {
    if (type === 'tips')    return tipRate;
    if (type === 'viewers') return viewerRate;
    return null;
  };

  useEffect(() => {
    goals.forEach(goal => {
      if (completed.has(goal.id)) return;
      const current = getCurrentValue(goal.goal_type);
      const target  = goal.target_amount;
      if (target > 0 && current >= target) {
        setCompleted(prev => new Set([...prev, goal.id]));
        completeMut.mutate(goal.id);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.4 }, colors: ['#6DBF7E', '#d4af37', '#D4AF37'] });
        fireAlert({ type: 'milestone', duration: 8000, title: `🎯 GOAL REACHED: ${goal.title}!`, body: goal.reward_text });
      }
    });
  }, [currentTips, currentSubs, currentViewers, goals]);

  const addGoal = (preset = null) => {
    const data = preset || form;
    if (!data.title?.trim() || data.target_amount <= 0 || !creatorId) return;
    createMut.mutate({
      ...data,
      creator_id: creatorId,
      room_id: roomId || null,
      status: 'active',
      current_amount: 0,
    });
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#6DBF7E]" />
          <h3 className="font-semibold text-white">Stream Goals</h3>
        </div>
        {isHost && creatorId && (
          <div className="flex gap-1">
            <button onClick={() => { setShowPresets(v => !v); setShowForm(false); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
              style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C' }}
              title="Quick presets">
              <Zap className="w-3 h-3" /> Quick
            </button>
            <button onClick={() => { setShowForm(v => !v); setShowPresets(false); }}
              className="w-7 h-7 rounded-lg bg-[#6DBF7E]/10 border border-[#6DBF7E]/30 flex items-center justify-center text-[#6DBF7E] hover:bg-[#6DBF7E]/20">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Quick preset chips */}
      <AnimatePresence>
        {showPresets && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="grid grid-cols-2 gap-1.5 pb-1">
              {QUICK_PRESETS.map((p, i) => (
                <button key={i} onClick={() => addGoal(p)}
                  className="text-left px-2 py-2 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                  style={{ background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.2)', color: '#6DBF7E' }}>
                  <p className="truncate">{p.title}</p>
                  <p className="text-[9px] text-white/30 truncate mt-0.5">{p.reward_text}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/5 border border-[#6DBF7E]/20 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                {GOAL_TYPES.map(gt => (
                  <button key={gt.id} onClick={() => setForm(f => ({ ...f, goal_type: gt.id }))}
                    className={`text-xs py-1.5 px-2 rounded-lg border transition-all text-left ${
                      form.goal_type === gt.id ? 'border-[#6DBF7E] bg-[#6DBF7E]/10 text-white' : 'border-white/10 text-white/40'
                    }`}>
                    {gt.label}
                  </button>
                ))}
              </div>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Goal title (e.g. New Mic Fund!)"
                style={{ width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }} />
              <div className="flex gap-2">
                <input type="number" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: Number(e.target.value) }))}
                  placeholder="Target"
                  style={{ flex:1, padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }} />
                <span className="text-sm text-white/40 flex items-center">{GOAL_TYPES.find(g => g.id === form.goal_type)?.unit}</span>
              </div>
              <input value={form.reward_text} onChange={e => setForm(f => ({ ...f, reward_text: e.target.value }))}
                placeholder="Reward: I'll dance at goal! 🎉"
                style={{ width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }} />
              <div className="flex gap-2">
                <button onClick={() => addGoal()} style={{ flex:1, padding:'6px 14px', borderRadius:8, border:'none', background:'#6DBF7E', color:'#000', fontWeight:700, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  <Check className="w-3.5 h-3.5" /> Add Goal
                </button>
                <button onClick={() => setShowForm(false)} style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'transparent', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:13 }}>Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="text-center py-8 text-white/30">
          <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{isHost ? 'Add a goal to motivate viewers' : 'No goals set yet'}</p>
        </div>
      ) : goals.map(goal => {
        const current     = getCurrentValue(goal.goal_type);
        const target      = goal.target_amount;
        const pct         = target > 0 ? Math.min(100, (current / target) * 100) : 0;
        const gt          = GOAL_TYPES.find(g => g.id === goal.goal_type);
        const isCompleted = completed.has(goal.id) || goal.status === 'completed';
        const remaining   = Math.max(0, target - current);
        const minsLeft    = !isCompleted ? estimateMinutesLeft(current, target, getRateForType(goal.goal_type)) : null;

        return (
          <motion.div key={goal.id} layout
            className={`p-4 rounded-xl border space-y-3 ${isCompleted ? 'border-[#6DBF7E]/50 bg-[#6DBF7E]/5' : pct >= 80 ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5' : 'border-white/10 bg-white/3'}`}
            style={pct >= 80 && !isCompleted ? { boxShadow: '0 0 16px rgba(201,168,76,0.15)' } : {}}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white text-sm">{goal.title}</p>
                {goal.reward_text && <p className="text-[10px] text-white/40 mt-0.5">{goal.reward_text}</p>}
              </div>
              <div className="flex items-center gap-2">
                {isCompleted && <span style={{ fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(109,191,126,0.2)', color:'#6DBF7E', border:'1px solid rgba(109,191,126,0.3)' }}>✓ REACHED</span>}
                {isHost && roomId && (
                  <button onClick={() => shareGoalMut.mutate(goal)} className="text-white/30 hover:text-[#C9A84C]" title="Share progress to chat">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {isHost && (
                  <button onClick={() => deleteMut.mutate(goal.id)} className="text-white/20 hover:text-[#C0392B]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/50">{gt?.prefix}{current.toLocaleString()}</span>
                <span className="text-[#6DBF7E]">{pct.toFixed(0)}%</span>
                <span className="text-white/50">{gt?.prefix}{target.toLocaleString()}</span>
              </div>
              <div className="h-4 bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full relative"
                  style={{ background: isCompleted ? '#6DBF7E' : 'linear-gradient(90deg, #4A9B5E, #6DBF7E, #6DBF7E)' }}
                >
                  {pct > 10 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  )}
                </motion.div>
                {pct >= 100 && (
                  <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-xs">
                    🎉
                  </motion.div>
                )}
              </div>
            </div>

            {/* Remaining callout + ETA */}
            {!isCompleted && remaining > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold" style={{ color: '#C9A84C' }}>
                  Just {gt?.prefix}{remaining.toLocaleString()} more!
                </p>
                {minsLeft != null && minsLeft > 0 && (
                  <p className="text-[10px] text-white/30 flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />
                    ~{minsLeft}m at current rate
                  </p>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
