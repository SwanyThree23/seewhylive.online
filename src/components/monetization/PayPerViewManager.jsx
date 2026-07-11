import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Users, DollarSign, Calendar, Trash2 } from 'lucide-react';

const G = '#D4AF37';
const BG = '#0A0710';
const PANEL = '#0F0B1A';
const BORDER = 'rgba(212,175,55,0.18)';

export default function PayPerViewManager({ roomId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 9.99,
    event_date: '',
    duration_minutes: 60,
    max_participants: null,
  });
  const queryClient = useQueryClient();

  const { data: ppvEvents } = useQuery({
    queryKey: ['ppvEvents', roomId],
    queryFn: () =>
      base44.entities.PayPerViewEvent.filter(
        { room_id: roomId },
        '-event_date',
        20
      ),
    enabled: !!roomId,
  });

  const createPPVMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.PayPerViewEvent.create({
        ...data,
        room_id: roomId,
        status: 'upcoming',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppvEvents', roomId] });
      setShowForm(false);
      setFormData({ title: '', description: '', price: 9.99, event_date: '', duration_minutes: 60, max_participants: null });
    },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5" style={{ color: G }} />
          <h2 className="text-lg font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Pay-Per-View Events
          </h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded-lg font-bold text-xs"
          style={{ background: G, color: '#000' }}
        >
          + New Event
        </motion.button>
      </div>

      {/* Create Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg space-y-3"
          style={{ background: PANEL, border: `1px solid ${BORDER}` }}
        >
          <input
            type="text"
            placeholder="Event title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            maxLength={120}
            className="w-full px-3 py-2 rounded text-sm outline-none"
            style={{ background: BG, border: `1px solid ${BORDER}`, color: 'white' }}
          />
          <textarea
            placeholder="Event description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            maxLength={500}
            className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
            style={{ background: BG, border: `1px solid ${BORDER}`, color: 'white' }}
            rows="3"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="datetime-local"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="px-3 py-2 rounded text-sm outline-none"
              style={{ background: BG, border: `1px solid ${BORDER}`, color: 'white' }}
            />
            <input
              type="number"
              placeholder="Price ($)"
              min="0.99"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 rounded text-sm outline-none"
              style={{ background: BG, border: `1px solid ${BORDER}`, color: 'white' }}
            />
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => createPPVMutation.mutate(formData)}
              disabled={!formData.title || !formData.event_date}
              className="flex-1 py-2 rounded font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: G, color: '#000' }}
            >
              Create Event
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

      {/* Events List */}
      <div className="space-y-2">
        {ppvEvents?.map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 rounded-lg"
            style={{ background: PANEL, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-bold text-white mb-1">{event.title}</p>
                <div className="flex gap-4 text-[10px] text-white/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(event.event_date).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ${event.price.toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {event.current_participants} / {event.max_participants || '∞'}
                  </span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                className="p-2 rounded text-xs"
                style={{ background: 'rgba(255,0,0,0.1)', color: '#C0392B' }}
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {!ppvEvents || ppvEvents.length === 0 && (
        <p className="text-center text-white/40 text-sm py-4">No PPV events yet</p>
      )}
    </div>
  );
}