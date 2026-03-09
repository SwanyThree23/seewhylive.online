import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Users, DollarSign, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import TierEditor from './TierEditor';
import TierBadge from './TierBadge';

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
          <Card key={s.label} className="text-center py-3">
            <div className="flex justify-center mb-1 text-amber-500">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Membership Tiers</h2>
          <p className="text-sm text-muted-foreground">Define custom levels for your subscribers</p>
        </div>
        <Button onClick={() => { setEditing(null); setEditorOpen(true); }} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
          <Plus className="w-4 h-4 mr-2" /> New Tier
        </Button>
      </div>

      {/* Tier list */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : tiers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-3">🏆</div>
            <p className="font-semibold text-lg mb-1">No tiers yet</p>
            <p className="text-muted-foreground text-sm mb-4">Create your first membership tier to start earning from subscribers.</p>
            <Button onClick={() => { setEditing(null); setEditorOpen(true); }} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
              <Plus className="w-4 h-4 mr-2" /> Create First Tier
            </Button>
          </CardContent>
        </Card>
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
                <Card className={`border-l-4 ${!tier.is_active ? 'opacity-60' : ''}`} style={{ borderLeftColor: tier.color || '#d4af37' }}>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center gap-4">
                      <TierBadge tier={tier} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-lg">{tier.name}</span>
                          {!tier.is_active && <Badge variant="secondary">Hidden</Badge>}
                          {tier.max_subscribers && (
                            <Badge variant="outline" className="text-xs">
                              {getSubCount(tier.id)}/{tier.max_subscribers} spots
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{tier.description}</div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {tier.has_early_access && <Badge className="text-xs bg-blue-100 text-blue-800">Early Access</Badge>}
                          {tier.has_exclusive_rooms && <Badge className="text-xs bg-purple-100 text-purple-800">Exclusive Rooms</Badge>}
                          {tier.has_custom_badge && <Badge className="text-xs bg-amber-100 text-amber-800">Badge</Badge>}
                          {tier.has_custom_emotes && <Badge className="text-xs bg-green-100 text-green-800">Emotes</Badge>}
                          {tier.is_ad_free && <Badge className="text-xs bg-pink-100 text-pink-800">Ad-Free</Badge>}
                          {tier.priority_support && <Badge className="text-xs bg-orange-100 text-orange-800">Priority Support</Badge>}
                          {tier.benefits?.slice(0, 2).map((b, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{b}</Badge>
                          ))}
                          {tier.benefits?.length > 2 && <Badge variant="outline" className="text-xs">+{tier.benefits.length - 2} more</Badge>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold">${tier.price}</div>
                        <div className="text-xs text-muted-foreground">/month</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{getSubCount(tier.id)} subscribers</div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => toggleMutation.mutate({ id: tier.id, is_active: !tier.is_active })}
                          className="text-muted-foreground hover:text-foreground"
                          title={tier.is_active ? 'Hide tier' : 'Show tier'}
                        >
                          {tier.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => { setEditing(tier); setEditorOpen(true); }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(tier.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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