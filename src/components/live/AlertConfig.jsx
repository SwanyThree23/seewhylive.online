import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Volume2, Trash2, Play } from 'lucide-react';
import SelectSheet from '@/components/shared/SelectSheet';
import { toast } from 'sonner';

const G = '#D4AF37';
const PANEL = '#0F0B1A';
const BORDER = 'rgba(212,175,55,0.18)';

const SOUND_PRESETS = ['cash_register', 'fanfare', 'chime', 'explosion', 'coin', 'alert', 'level_up'];

export default function AlertConfig({ creatorId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'donation_amount',
    trigger_value: 5,
    sound_preset: 'cash_register',
    volume: 80,
    color: G,
  });
  const queryClient = useQueryClient();

  const { data: alerts } = useQuery({
    queryKey: ['soundAlerts', creatorId],
    queryFn: () =>
      base44.entities.SoundAlert.filter(
        { creator_id: creatorId },
        '-created_date'
      ),
    enabled: !!creatorId,
  });

  const createAlertMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.SoundAlert.create({
        creator_id: creatorId,
        ...formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soundAlerts', creatorId] });
      setShowForm(false);
      setFormData({ name: '', trigger_type: 'donation_amount', trigger_value: 5, sound_preset: 'cash_register', volume: 80, color: G });
    },
    onError: () => toast.error('Failed to create alert.'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" style={{ color: G }} />
          <h3 className="text-lg font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Custom Alerts
          </h3>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded-lg font-bold text-xs"
          style={{ background: G, color: '#000' }}
        >
          + New Alert
        </motion.button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg space-y-3"
          style={{ background: PANEL, border: `1px solid ${BORDER}` }}
        >
          <input
            type="text"
            placeholder="Alert name (e.g., $50 Donation)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded text-sm outline-none"
            style={{ background: '#0A0710', border: `1px solid ${BORDER}`, color: 'white' }}
          />

          <div className="grid grid-cols-2 gap-2">
            <SelectSheet
              label="Trigger Type"
              value={formData.trigger_type}
              onChange={(v) => setFormData({ ...formData, trigger_type: v })}
              options={[
                { value: 'donation_amount', label: 'Donation Amount' },
                { value: 'new_subscriber', label: 'New Subscriber' },
                { value: 'custom', label: 'Custom Event' },
              ]}
            />
            <input
              type="number"
              placeholder="Trigger value"
              value={formData.trigger_value}
              onChange={(e) => setFormData({ ...formData, trigger_value: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 rounded text-sm outline-none"
              style={{ background: '#0A0710', border: `1px solid ${BORDER}`, color: 'white' }}
            />
          </div>

          <SelectSheet
            label="Sound Preset"
            value={formData.sound_preset}
            onChange={(v) => setFormData({ ...formData, sound_preset: v })}
            options={SOUND_PRESETS.map((preset) => ({ value: preset, label: '🔊 ' + preset.replace(/_/g, ' ') }))}
          />

          <div className="flex gap-2 items-center">
            <Volume2 className="w-4 h-4 text-white/60" />
            <input
              type="range"
              min="0"
              max="100"
              value={formData.volume}
              onChange={(e) => setFormData({ ...formData, volume: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs text-white/60 w-8 text-right">{formData.volume}%</span>
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => createAlertMutation.mutate()}
              disabled={!formData.name}
              className="flex-1 py-2 rounded font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: G, color: '#000' }}
            >
              Create Alert
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded font-bold text-sm"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)' }}
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Alerts List */}
      <div className="space-y-2">
        {alerts?.map((alert, idx) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-3 rounded-lg flex items-center justify-between"
            style={{ background: PANEL, border: `1px solid ${alert.color}40` }}
          >
            <div>
              <p className="font-bold text-sm text-white">{alert.name}</p>
              <p className="text-[10px] text-white/60">{alert.trigger_type} • 🔊 {alert.sound_preset}</p>
            </div>
            <motion.button whileHover={{ scale: 1.1 }} className="p-2 text-[#C0392B]">
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </motion.div>
        ))}
      </div>

      {!alerts || alerts.length === 0 && (
        <p className="text-center text-white/40 py-4 text-sm">No alerts yet</p>
      )}
    </div>
  );
}