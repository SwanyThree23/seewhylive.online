import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Check, Edit2 } from 'lucide-react';
import NativeSelect from '@/components/shared/NativeSelect';

const F = { fontFamily: 'Barlow Condensed, sans-serif' };

const PRESETS = [
  { label: '50 viewers',  type: 'viewers', target: 50 },
  { label: '100 viewers', type: 'viewers', target: 100 },
  { label: '$25 in tips', type: 'tips',    target: 25 },
  { label: '$50 in tips', type: 'tips',    target: 50 },
  { label: '10 subs',     type: 'subs',    target: 10 },
];

export default function LiveGoalWidget({ memberCount = 0, tipTotal = 0, subCount = 0 }) {
  const [goal, setGoal] = useState(null);
  const [editing, setEditing] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customTarget, setCustomTarget] = useState('');
  const [customType, setCustomType] = useState('viewers');
  const [celebrated, setCelebrated] = useState(false);

  const current = goal
    ? goal.type === 'viewers' ? memberCount
    : goal.type === 'tips'    ? tipTotal
    : subCount
    : 0;

  const pct = goal ? Math.min(100, (current / goal.target) * 100) : 0;
  const done = goal && current >= goal.target;

  useEffect(() => {
    if (done && !celebrated) {
      setCelebrated(true);
    }
  }, [done, celebrated]);

  const setPreset = (p) => {
    setGoal({ ...p });
    setEditing(false);
    setCelebrated(false);
  };

  const setCustom = () => {
    const t = parseInt(customTarget);
    if (!customLabel.trim() || isNaN(t) || t <= 0) return;
    setGoal({ label: customLabel.trim(), type: customType, target: t });
    setEditing(false);
    setCelebrated(false);
  };

  if (editing) {
    return (
      <div style={{ borderRadius: 12, background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Target style={{ width: 14, height: 14, color: '#D4AF37' }} />
          <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#D4AF37', ...F }}>Set Stream Goal</span>
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => setPreset(p)}
              style={{ padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, cursor: 'pointer', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', ...F }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom */}
        <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', ...F, marginBottom: 5 }}>Custom Goal</div>
        <div style={{ display: 'flex', gap: 5, flexDirection: 'column' }}>
          <input
            value={customLabel}
            onChange={e => setCustomLabel(e.target.value)}
            placeholder="Goal name (e.g. 200 viewers)"
            style={{ width: '100%', height: 28, padding: '0 8px', fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 6, outline: 'none', boxSizing: 'border-box', ...F }}
          />
          <div style={{ display: 'flex', gap: 5 }}>
            <NativeSelect
              value={customType}
              onChange={val => setCustomType(val)}
              style={{ width: 90, height: 28, padding: '0 6px', fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 6, outline: 'none', ...F }}
              options={[{value:'viewers',label:'Viewers'},{value:'tips',label:'Tips ($)'},{value:'subs',label:'Subs'}]}
            />
            <input
              type="number"
              value={customTarget}
              onChange={e => setCustomTarget(e.target.value)}
              placeholder="Target"
              style={{ flex: 1, height: 28, padding: '0 8px', fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 6, outline: 'none', ...F }}
            />
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={setCustom}
              style={{ flex: 1, height: 28, fontSize: 11, fontWeight: 900, background: '#D4AF37', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', ...F }}>
              Set Goal
            </button>
            <button onClick={() => setEditing(false)}
              style={{ height: 28, padding: '0 10px', fontSize: 11, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', borderRadius: 6, cursor: 'pointer', ...F }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <button onClick={() => setEditing(true)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(212,175,55,0.04)', border: '1px dashed rgba(212,175,55,0.2)', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}>
        <Target style={{ width: 14, height: 14, color: '#D4AF37' }} />
        <span style={{ fontSize: 11, fontWeight: 700, ...F }}>Set a stream goal...</span>
      </button>
    );
  }

  return (
    <div style={{ borderRadius: 12, background: done ? 'rgba(109,191,126,0.07)' : 'rgba(212,175,55,0.06)', border: `1px solid ${done ? 'rgba(109,191,126,0.3)' : 'rgba(212,175,55,0.2)'}`, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {done ? <Check style={{ width: 13, height: 13, color: '#6DBF7E' }} /> : <Target style={{ width: 13, height: 13, color: '#D4AF37' }} />}
        <span style={{ flex: 1, fontSize: 11, fontWeight: 900, color: done ? '#6DBF7E' : '#D4AF37', ...F }}>
          {goal.label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 900, color: done ? '#6DBF7E' : 'rgba(255,255,255,0.5)', ...F }}>
          {goal.type === 'tips' ? `$${current.toFixed(2)}` : current} / {goal.type === 'tips' ? `$${goal.target}` : goal.target}
        </span>
        <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
          <Edit2 style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.2)' }} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 99, background: done ? '#6DBF7E' : 'linear-gradient(90deg, #D4AF37, #C0392B)' }}
        />
      </div>

      {done && (
        <div style={{ marginTop: 6, fontSize: 10, color: '#6DBF7E', fontWeight: 900, textAlign: 'center', ...F }}>
          🎉 Goal reached! Set a new one!
        </div>
      )}
    </div>
  );
}