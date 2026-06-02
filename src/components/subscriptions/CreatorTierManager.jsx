import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Users, DollarSign, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import TierEditor from './TierEditor';
import TierBadge from './TierBadge';

const GOLD = '#D4AF37';
const BG = '#080B18';

export default function CreatorTierManager({ creatorId }) {
  const qc = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['creatorTiers', creatorId],
    queryFn: () => base44.entities.SubscriptionTier.filter({ creator_id: creatorId }, 'sort_order', 50),
    enabled: !!creatorId,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['creatorSubscriptions', creatorId],
    queryFn: () => base44.entities.Subscription.filter({ creator_id: creatorId, status: 'active' }),
    enabled: !!creatorId,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.SubscriptionTier.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries(['creatorTiers', creatorId]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SubscriptionTier.delete(id),
    onSuccess: () => {
      toast.success('Tier deleted');
      qc.invalidateQueries(['creatorTiers', creatorId]);
    },
  });

  const monthlyRevenue = subscriptions.reduce((sum, s) => sum + (s.price || 0), 0);

  const getSubCount = (tierId) => subscriptions.filter(s => s.tier_id === tierId).length;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tiers', value: tiers.length, icon: <span>🏆</span> },
          { label: 'Active Subscribers', value: subscriptions.length, icon: <Users className="w-4 h-4" /> },
          { label: 'Monthly Revenue', value: `$${monthlyRevenue.toFixed(2)}`, icon: <DollarSign className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: '#f59e0b' }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Membership Tiers</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Define custom levels for your subscribers</p>
        </div>
        <button
          onClick={() => { setEditing(null); setEditorOpen(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            background: '#f59e0b', color: '#000', border: 'none',
          }}
        >
          <Plus className="w-4 h-4" /> New Tier
        </button>
      </div>

      {/* Tier list */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} style={{ height: 96, borderRadius: 12, background: 'rgba(255,255,255,0.06)', animation: 'pulse 2s infinite' }} />)}</div>
      ) : tiers.length === 0 ? (
        <div style={{ border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
          <p style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>No tiers yet</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 16 }}>Create your first membership tier to start earning from subscribers.</p>
          <button
            onClick={() => { setEditing(null); setEditorOpen(true); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              background: '#f59e0b', color: '#000', border: 'none',
            }}
          >
            <Plus className="w-4 h-4" /> Create First Tier
          </button>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {tiers.map((tier, idx) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div
                  style={{
                    borderRadius: 12, borderLeft: `4px solid ${tier.color || '#d4af37'}`,
                    background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`,
                    borderLeftColor: tier.color || '#d4af37',
                    opacity: !tier.is_active ? 0.6 : 1,
                    padding: '16px 20px',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <TierBadge tier={tier} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontWeight: 700, fontSize: 18 }}>{tier.name}</span>
                        {!tier.is_active && (
                          <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                            Hidden
                          </span>
                        )}
                        {tier.max_subscribers && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
                            {getSubCount(tier.id)}/{tier.max_subscribers} spots
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{tier.description}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {tier.has_early_access && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(59,130,246,0.15)', color: '#93c5fd' }}>Early Access</span>}
                        {tier.has_exclusive_rooms && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(139,92,246,0.15)', color: '#c4b5fd' }}>Exclusive Rooms</span>}
                        {tier.has_custom_badge && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(245,158,11,0.15)', color: '#fcd34d' }}>Badge</span>}
                        {tier.has_custom_emotes && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(34,197,94,0.15)', color: '#86efac' }}>Emotes</span>}
                        {tier.is_ad_free && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(236,72,153,0.15)', color: '#f9a8d4' }}>Ad-Free</span>}
                        {tier.priority_support && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(249,115,22,0.15)', color: '#fdba74' }}>Priority Support</span>}
                        {tier.benefits?.slice(0, 2).map((b, i) => (
                          <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>{b}</span>
                        ))}
                        {tier.benefits?.length > 2 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>+{tier.benefits.length - 2} more</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>${tier.price}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>/month</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{getSubCount(tier.id)} subscribers</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => toggleMutation.mutate({ id: tier.id, is_active: !tier.is_active })}
                        title={tier.is_active ? 'Hide tier' : 'Show tier'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 0 }}
                      >
                        {tier.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setEditing(tier); setEditorOpen(true); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 0 }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(tier.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 0 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      <TierEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        creatorId={creatorId}
        existing={editing}
      />
    </div>
  );
}
