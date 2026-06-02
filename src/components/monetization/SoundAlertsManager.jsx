import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Play, Plus, Trash2, X, Check, Volume2, Music } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const inputStyle = {
  width: '100%', padding: '10px 14px', background: 'rgba(17,8,34,0.85)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif',
};

// Sound presets using Web Audio API
const SOUND_PRESETS = {
  cash_register: { label: '💵 Cash Register', freq: [880, 1100, 880], type: 'square' },
  fanfare: { label: '🎺 Fanfare', freq: [523, 659, 784, 1047], type: 'sine' },
  chime: { label: '🔔 Chime', freq: [1047, 1319, 1568], type: 'sine' },
  explosion: { label: '💥 Explosion', freq: [80, 60, 40], type: 'sawtooth' },
  coin: { label: '🪙 Coin', freq: [1319, 1568], type: 'triangle' },
  alert: { label: '🚨 Alert', freq: [880, 440, 880], type: 'square' },
  level_up: { label: '⬆️ Level Up', freq: [523, 659, 784, 1047, 1319], type: 'sine' },
};

const TRIGGER_TYPES = [
  { id: 'donation_amount', label: '💰 Donation ≥ Amount' },
  { id: 'donation_exact', label: '💎 Exact Donation' },
  { id: 'new_subscriber', label: '⭐ New Subscriber' },
  { id: 'first_donation', label: '🎉 First Donation Ever' },
  { id: 'milestone', label: '🏆 Goal Milestone' },
];

// Synthesize a sound using Web Audio
function playPreset(preset, volume = 80) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const presetData = SOUND_PRESETS[preset] || SOUND_PRESETS.coin;
  const vol = volume / 100;

  presetData.freq.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = presetData.type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
    gain.gain.linearRampToValueAtTime(vol * 0.3, ctx.currentTime + i * 0.12 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.45);
  });
}

// Live alert overlay component
export function SoundAlertOverlay({ alerts, onTrigger }) {
  const [activeAlert, setActiveAlert] = useState(null);

  const checkAndFire = useCallback((amount, donorName, type = 'donation') => {
    if (!alerts?.length) return;

    const matching = alerts
      .filter(a => a.is_active)
      .filter(a => {
        if (a.trigger_type === 'donation_amount') return amount >= (a.trigger_value || 0);
        if (a.trigger_type === 'donation_exact') return amount === a.trigger_value;
        if (a.trigger_type === 'first_donation') return type === 'first';
        if (a.trigger_type === 'new_subscriber') return type === 'subscribe';
        return false;
      })
      .sort((a, b) => (b.trigger_value || 0) - (a.trigger_value || 0));

    if (matching.length === 0) return;
    const alert = matching[0];

    playPreset(alert.sound_preset || 'cash_register', alert.volume || 80);

    const message = (alert.message_template || '🎉 {name} donated ${amount}!')
      .replace('{name}', donorName)
      .replace('{amount}', amount);

    setActiveAlert({ ...alert, message });
    setTimeout(() => setActiveAlert(null), (alert.duration_seconds || 5) * 1000);
  }, [alerts]);

  // Expose to parent
  useEffect(() => {
    if (onTrigger) onTrigger.current = checkAndFire;
  }, [checkAndFire, onTrigger]);

  return (
    <AnimatePresence>
      {activeAlert && (
        <motion.div
          initial={{ y: -80, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 15 }}
          style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 100, pointerEvents: 'none' }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            background: `linear-gradient(135deg, ${activeAlert.color || GOLD}22, #0d0618)`,
            border: `1px solid ${activeAlert.color || GOLD}`,
            boxShadow: `0 0 40px ${activeAlert.color || GOLD}44`,
          }}>
            <motion.div
              animate={{ rotate: [0, -15, 15, -15, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
              style={{ fontSize: 28 }}
            >
              {activeAlert.sound_preset === 'fanfare' ? '🎺' :
               activeAlert.sound_preset === 'explosion' ? '💥' :
               activeAlert.sound_preset === 'level_up' ? '⬆️' : '🎉'}
            </motion.div>
            <div>
              <p style={{ fontWeight: 700, color: '#fff', fontSize: 17, margin: 0 }}>{activeAlert.name}</p>
              <p style={{ fontSize: 13, color: activeAlert.color || GOLD, margin: 0 }}>{activeAlert.message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Creator management panel
export default function SoundAlertsManager({ creatorId }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [testAmount, setTestAmount] = useState(10);
  const [form, setForm] = useState({
    name: '', trigger_type: 'donation_amount', trigger_value: 5,
    sound_preset: 'cash_register', message_template: '🎉 {name} donated ${amount}!',
    volume: 80, duration_seconds: 5, is_active: true, color: '#d4af37',
  });

  const { data: soundAlerts = [] } = useQuery({
    queryKey: ['sound-alerts', creatorId],
    queryFn: () => base44.entities.SoundAlert.filter({ creator_id: creatorId }, 'trigger_value'),
    enabled: !!creatorId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SoundAlert.create(data),
    onSuccess: () => { qc.invalidateQueries(['sound-alerts']); setShowForm(false); toast.success('Alert created!'); },
  });
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.SoundAlert.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries(['sound-alerts']),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SoundAlert.delete(id),
    onSuccess: () => qc.invalidateQueries(['sound-alerts']),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Test widget */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}>
        <Volume2 className="w-4 h-4" style={{ color: GOLD, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>Test with $</span>
        <input type="number" value={testAmount} onChange={e => setTestAmount(Number(e.target.value))}
          style={{ ...inputStyle, width: 80, height: 28, fontSize: 11 }} />
        <button
          style={{ height: 28, fontSize: 11, background: GOLD, color: '#000', fontWeight: 700, border: 'none', borderRadius: 6, padding: '0 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif' }}
          onClick={() => {
            const matching = soundAlerts.filter(a => a.is_active && a.trigger_type === 'donation_amount' && testAmount >= (a.trigger_value || 0));
            if (matching.length) { playPreset(matching[matching.length - 1].sound_preset, matching[matching.length - 1].volume); toast.success(`Played: ${matching[matching.length - 1].name}`); }
            else toast.info('No alerts match this amount');
          }}>
          <Play className="w-3 h-3" /> Test
        </button>
        <button
          style={{ height: 28, fontSize: 11, background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', fontFamily: 'Barlow Condensed, sans-serif' }}
          onClick={() => setShowForm(true)}>
          <Plus className="w-3 h-3" /> Add Alert
        </button>
      </div>

      {/* Alerts list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {soundAlerts.length === 0 && !showForm ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '16px 0', margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>No sound alerts yet</p>
        ) : soundAlerts.map(alert => (
          <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, border: alert.is_active ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)', background: alert.is_active ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)', opacity: alert.is_active ? 1 : 0.5, transition: 'all 0.2s' }}>
            <button onClick={() => playPreset(alert.sound_preset, alert.volume)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <Play className="w-3.5 h-3.5" />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>{alert.name}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>{TRIGGER_TYPES.find(t => t.id === alert.trigger_type)?.label} {alert.trigger_value ? `· $${alert.trigger_value}` : ''}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                {SOUND_PRESETS[alert.sound_preset]?.label?.split(' ')[0] || '🔔'}
              </span>
              {/* Switch */}
              <div onClick={() => toggleMutation.mutate({ id: alert.id, is_active: !alert.is_active })} style={{ width: 40, height: 22, borderRadius: 99, background: alert.is_active ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: alert.is_active ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              <button onClick={() => deleteMutation.mutate(alert.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>New Sound Alert</p>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X className="w-4 h-4" /></button>
            </div>

            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Alert name (e.g. 'Mega Donation')" style={{ ...inputStyle, height: 32, fontSize: 12 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <select value={form.trigger_type} onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(17,8,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                {TRIGGER_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              {(form.trigger_type === 'donation_amount' || form.trigger_type === 'donation_exact') && (
                <input type="number" value={form.trigger_value} onChange={e => setForm(f => ({ ...f, trigger_value: Number(e.target.value) }))}
                  placeholder="$ amount" style={{ ...inputStyle, height: 32, fontSize: 12 }} />
              )}
            </div>

            {/* Sound presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>Sound</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                {Object.entries(SOUND_PRESETS).map(([id, preset]) => (
                  <button key={id} onClick={() => { setForm(f => ({ ...f, sound_preset: id })); playPreset(id, 50); }}
                    style={{ fontSize: 11, padding: '6px 8px', borderRadius: 8, border: `1px solid ${form.sound_preset === id ? GOLD : 'rgba(255,255,255,0.1)'}`, background: form.sound_preset === id ? 'rgba(212,175,55,0.1)' : 'transparent', color: form.sound_preset === id ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>Volume</p>
                <span style={{ fontSize: 10, color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>{form.volume}%</span>
              </div>
              <input type="range" value={form.volume} onChange={e => setForm(f => ({ ...f, volume: +e.target.value }))} min={0} max={100} style={{ width: '100%', accentColor: GOLD }} />
            </div>

            <input value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))}
              placeholder="Message: {name} donated ${amount}!" style={{ ...inputStyle, height: 32, fontSize: 12 }} />

            <button onClick={() => createMutation.mutate({ ...form, creator_id: creatorId })}
              style={{ width: '100%', background: GOLD, color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12 }}>
              <Check className="w-3.5 h-3.5" /> Create Alert
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
