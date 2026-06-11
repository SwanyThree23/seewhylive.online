import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, X, Check, TrendingUp } from 'lucide-react';
import { fireAlert } from './HostAlertCenter';
import confetti from 'canvas-confetti';

const GOAL_TYPES = [
  { id: 'tip', label: '💰 Tip Goal', unit: '$', prefix: '$' },
  { id: 'sub', label: '⭐ Sub Goal', unit: 'subs', prefix: '' },
  { id: 'viewer', label: '👁 Viewer Goal', unit: 'viewers', prefix: '' },
  { id: 'custom', label: '🎯 Custom Goal', unit: 'total', prefix: '' },
];

export default function StreamGoals({ isHost, currentTips = 0, currentSubs = 0, currentViewers = 0 }) {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'tip', title: '', target: 100, reward_text: '' });

  const getCurrentValue = (type) => {
    if (type === 'tip') return currentTips;
    if (type === 'sub') return currentSubs;
    if (type === 'viewer') return currentViewers;
    return 0;
  };

  useEffect(() => {
    goals.forEach(goal => {
      const current = getCurrentValue(goal.type);
      const pct = current / goal.target;
      if (pct >= 1 && !goal.completed) {
        setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, completed: true } : g));
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.4 }, colors: ['#22c55e', '#d4af37', '#D4AF37'] });
        fireAlert({ type: 'milestone', duration: 8000, title: `🎯 GOAL REACHED: ${goal.title}!`, body: goal.reward_text });
      }
    });
  }, [currentTips, currentSubs, currentViewers, goals]);

  const addGoal = () => {
    if (!form.title.trim() || form.target <= 0) return;
    setGoals(prev => [...prev, { ...form, id: Date.now().toString(), completed: false }]);
    setForm({ type: 'tip', title: '', target: 100, reward_text: '' });
    setShowForm(false);
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#22c55e]" />
          <h3 className="font-semibold text-white">Stream Goals</h3>
        </div>
        {isHost && (
          <button onClick={() => setShowForm(!showForm)}
            className="w-7 h-7 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e] hover:bg-[#22c55e]/20">
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/5 border border-[#22c55e]/20 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                {GOAL_TYPES.map(gt => (
                  <button key={gt.id} onClick={() => setForm(f => ({ ...f, type: gt.id }))}
                    className={`text-xs py-1.5 px-2 rounded-lg border transition-all text-left ${
                      form.type === gt.id ? 'border-[#22c55e] bg-[#22c55e]/10 text-white' : 'border-white/10 text-white/40'
                    }`}>
                    {gt.label}
                  </button>
                ))}
              </div>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Goal title (e.g. New Mic Fund!)"
                style={{ width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }} />
              <div className="flex gap-2">
                <input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: Number(e.target.value) }))}
                  placeholder="Target"
                  style={{ flex:1, padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }} />
                <span className="text-sm text-white/40 flex items-center">{GOAL_TYPES.find(g => g.id === form.type)?.unit}</span>
              </div>
              <input value={form.reward_text} onChange={e => setForm(f => ({ ...f, reward_text: e.target.value }))}
                placeholder="Reward: I'll dance at goal! 🎉"
                style={{ width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }} />
              <div className="flex gap-2">
                <button onClick={addGoal} style={{ flex:1, padding:'6px 14px', borderRadius:8, border:'none', background:'#22c55e', color:'#000', fontWeight:700, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
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
        const current = getCurrentValue(goal.type);
        const target = goal.target;
        const pct = Math.min(100, (current / target) * 100);
        const gt = GOAL_TYPES.find(g => g.id === goal.type);

        return (
          <motion.div key={goal.id} layout
            className={`p-4 rounded-xl border space-y-3 ${goal.completed ? 'border-[#22c55e]/50 bg-[#22c55e]/5' : 'border-white/10 bg-white/3'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white text-sm">{goal.title}</p>
                {goal.reward_text && <p className="text-[10px] text-white/40 mt-0.5">{goal.reward_text}</p>}
              </div>
              <div className="flex items-center gap-2">
                {goal.completed && <span style={{ fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(34,197,94,0.2)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.3)' }}>✓ REACHED</span>}
                {isHost && (
                  <button onClick={() => setGoals(prev => prev.filter(g => g.id !== goal.id))}
                    className="text-white/20 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Liquid progress bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/50">{gt?.prefix}{current.toLocaleString()}</span>
                <span className="text-[#22c55e]">{pct.toFixed(0)}%</span>
                <span className="text-white/50">{gt?.prefix}{target.toLocaleString()}</span>
              </div>
              <div className="h-4 bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full relative"
                  style={{ background: goal.completed ? '#22c55e' : 'linear-gradient(90deg, #16a34a, #22c55e, #4ade80)' }}
                >
                  {pct > 10 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  )}
                </motion.div>
                {pct >= 100 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-xs">
                    🎉
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}