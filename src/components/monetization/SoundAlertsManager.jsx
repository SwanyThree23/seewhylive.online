import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Bell, Play, Plus, Trash2, X, Check, Volume2, Music } from 'lucide-react';
import { toast } from 'sonner';

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
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border"
            style={{
              background: `linear-gradient(135deg, ${activeAlert.color || '#d4af37'}22, #0d0618)`,
              borderColor: activeAlert.color || '#d4af37',
              boxShadow: `0 0 40px ${activeAlert.color || '#d4af37'}44`
            }}>
            <motion.div
              animate={{ rotate: [0, -15, 15, -15, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="text-3xl"
            >
              {activeAlert.sound_preset === 'fanfare' ? '🎺' :
               activeAlert.sound_preset === 'explosion' ? '💥' :
               activeAlert.sound_preset === 'level_up' ? '⬆️' : '🎉'}
            </motion.div>
            <div>
              <p className="font-bold text-white text-lg">{activeAlert.name}</p>
              <p className="text-sm" style={{ color: activeAlert.color || '#d4af37' }}>{activeAlert.message}</p>
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
    <div className="space-y-4">
      {/* Test widget */}
      <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
        <Volume2 className="w-4 h-4 text-[#d4af37] shrink-0" />
        <span className="text-xs text-white/60">Test with $</span>
        <Input type="number" value={testAmount} onChange={e => setTestAmount(Number(e.target.value))}
          className="w-20 h-7 bg-white/5 border-white/20 text-white text-xs" />
        <Button size="sm" className="h-7 text-xs bg-[#d4af37] text-black font-bold hover:bg-[#f5e6a3]"
          onClick={() => {
            const matching = soundAlerts.filter(a => a.is_active && a.trigger_type === 'donation_amount' && testAmount >= (a.trigger_value || 0));
            if (matching.length) { playPreset(matching[matching.length - 1].sound_preset, matching[matching.length - 1].volume); toast.success(`Played: ${matching[matching.length - 1].name}`); }
            else toast.info('No alerts match this amount');
          }}>
          <Play className="w-3 h-3 mr-1" /> Test
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-white/50 ml-auto" onClick={() => setShowForm(true)}>
          <Plus className="w-3 h-3 mr-1" /> Add Alert
        </Button>
      </div>

      {/* Alerts list */}
      <div className="space-y-2">
        {soundAlerts.length === 0 && !showForm ? (
          <p className="text-sm text-white/30 text-center py-4">No sound alerts yet</p>
        ) : soundAlerts.map(alert => (
          <div key={alert.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${alert.is_active ? 'border-white/10 bg-white/3' : 'border-white/5 bg-white/[0.01] opacity-50'}`}>
            <button onClick={() => playPreset(alert.sound_preset, alert.volume)} className="w-8 h-8 rounded-lg bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37]/20 shrink-0">
              <Play className="w-3.5 h-3.5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{alert.name}</p>
              <p className="text-[10px] text-white/40">{TRIGGER_TYPES.find(t => t.id === alert.trigger_type)?.label} {alert.trigger_value ? `· $${alert.trigger_value}` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-[9px] text-white/50 bg-white/5 border-white/10">{SOUND_PRESETS[alert.sound_preset]?.label?.split(' ')[0] || '🔔'}</Badge>
              <Switch checked={alert.is_active} onCheckedChange={v => toggleMutation.mutate({ id: alert.id, is_active: v })}
                className="scale-75 data-[state=checked]:bg-[#d4af37]" />
              <button onClick={() => deleteMutation.mutate(alert.id)} className="text-white/20 hover:text-red-400">
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
            className="bg-white/5 border border-[#d4af37]/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">New Sound Alert</p>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Alert name (e.g. 'Mega Donation')" className="bg-white/5 border-white/20 text-white h-8 text-sm placeholder:text-white/25" />

            <div className="grid grid-cols-2 gap-2">
              <select value={form.trigger_type} onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value }))}
                className="bg-white/5 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white outline-none">
                {TRIGGER_TYPES.map(t => <option key={t.id} value={t.id} className="bg-[#0d0618]">{t.label}</option>)}
              </select>
              {(form.trigger_type === 'donation_amount' || form.trigger_type === 'donation_exact') && (
                <Input type="number" value={form.trigger_value} onChange={e => setForm(f => ({ ...f, trigger_value: Number(e.target.value) }))}
                  placeholder="$ amount" className="bg-white/5 border-white/20 text-white h-8 text-sm" />
              )}
            </div>

            {/* Sound presets */}
            <div className="space-y-1">
              <p className="text-[10px] text-white/40">Sound</p>
              <div className="grid grid-cols-3 gap-1">
                {Object.entries(SOUND_PRESETS).map(([id, preset]) => (
                  <button key={id} onClick={() => { setForm(f => ({ ...f, sound_preset: id })); playPreset(id, 50); }}
                    className={`text-xs py-1.5 px-2 rounded-lg border transition-all text-left ${form.sound_preset === id ? 'border-[#d4af37] bg-[#d4af37]/10 text-white' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-1">
              <div className="flex justify-between"><p className="text-[10px] text-white/40">Volume</p><span className="text-[10px] text-[#d4af37]">{form.volume}%</span></div>
              <Slider value={[form.volume]} onValueChange={([v]) => setForm(f => ({ ...f, volume: v }))} min={0} max={100}
                className="[&_[role=slider]]:bg-[#d4af37] [&_[role=slider]]:border-[#d4af37]" />
            </div>

            <Input value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))}
              placeholder="Message: {name} donated ${amount}!" className="bg-white/5 border-white/20 text-white h-8 text-sm placeholder:text-white/25" />

            <Button onClick={() => createMutation.mutate({ ...form, creator_id: creatorId })}
              className="w-full bg-[#d4af37] text-black font-bold hover:bg-[#f5e6a3] h-8 text-sm">
              <Check className="w-3.5 h-3.5 mr-1.5" /> Create Alert
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}