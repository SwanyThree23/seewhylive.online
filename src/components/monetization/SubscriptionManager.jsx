import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Crown, Edit2, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const TIERS = ['Bronze', 'Silver', 'Gold', 'Diamond'];
const TIER_ICONS = ['bronze', 'silver', 'gold', 'diamond'];
const TIER_COLORS = ['#cd7f32', '#c0c0c0', '#ffd700', '#0891b2'];

export default function SubscriptionManager({ creatorId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: 4.99, benefits: [] });
  const queryClient = useQueryClient();

  const { data: tiers } = useQuery({
    queryKey: ['subscriptionTiers', creatorId],
    queryFn: () =>
      base44.entities.SubscriptionTier.filter(
        { creator_id: creatorId },
        'sort_order',
        10
      ),
    enabled: !!creatorId,
  });

  const createTierMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.SubscriptionTier.create({
        ...data,
        creator_id: creatorId,
        sort_order: (tiers?.length || 0) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionTiers', creatorId] });
      setShowForm(false);
    },
    onError: () => { toast.error('Failed to create subscription tier. Please try again.'); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5" style={{ color: G }} />
          <h2 className="text-lg font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Subscription Tiers
          </h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded-lg font-bold text-xs"
          style={{ background: G, color: '#000' }}
        >
          + Add Tier
        </motion.button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg space-y-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(212,175,55,0.12)` }}
        >
          <input
            type="text"
            placeholder="Tier name (e.g., Gold)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded text-sm outline-none"
            style={{ background: '#0F0B1A', border: `1px solid rgba(212,175,55,0.18)`, color: 'white' }}
          />
          <input
            type="number"
            placeholder="Price ($/month)"
            min="0.99"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded text-sm outline-none"
            style={{ background: '#0F0B1A', border: `1px solid rgba(212,175,55,0.18)`, color: 'white' }}
          />
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => createTierMutation.mutate(formData)}
              disabled={!formData.name}
              className="flex-1 py-2 rounded font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: G, color: '#000' }}
            >
              Create
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded font-bold text-sm"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tiers?.map((tier, idx) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${TIER_COLORS[idx % 4]}40` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-white">{tier.name}</p>
                <p className="text-2xl font-black" style={{ color: TIER_COLORS[idx % 4] }}>
                  ${tier.price}
                  <span className="text-xs text-white/60 font-normal">/mo</span>
                </p>
              </div>
              <span className="text-lg">{tier.icon === 'bronze' ? '🥉' : tier.icon === 'silver' ? '🥈' : tier.icon === 'gold' ? '🥇' : '💎'}</span>
            </div>
            <p className="text-xs text-white/60 mb-3">{tier.subscriber_count || 0} subscribers</p>
            <div className="flex gap-2">
              <motion.button whileHover={{ scale: 1.05 }} className="flex-1 py-1.5 rounded text-xs font-bold" style={{ background: `${TIER_COLORS[idx % 4]}20`, color: TIER_COLORS[idx % 4] }}>
                <Edit2 className="w-3 h-3 mx-auto" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} className="flex-1 py-1.5 rounded text-xs font-bold" style={{ background: 'rgba(255,0,0,0.1)', color: '#FF4444' }}>
                <Trash2 className="w-3 h-3 mx-auto" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}