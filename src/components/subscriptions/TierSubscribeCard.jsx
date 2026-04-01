import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Flame, Heart, Star } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import TierBadge from './TierBadge';

const FEATURE_LABELS = [
  { key: 'has_early_access', label: 'Early access to streams' },
  { key: 'has_exclusive_rooms', label: 'Subscriber-only rooms' },
  { key: 'has_custom_badge', label: 'Custom badge in chat' },
  { key: 'has_custom_emotes', label: 'Exclusive emotes' },
  { key: 'is_ad_free', label: 'Ad-free experience' },
  { key: 'priority_support', label: 'Priority support' },
];

export default function TierSubscribeCard({ tier, currentSub, userId, creatorId, isHighlighted }) {
  const qc = useQueryClient();
  const isCurrentTier = currentSub?.tier_id === tier.id && currentSub?.status === 'active';
  const isFull = tier.max_subscribers && tier.subscriber_count >= tier.max_subscribers;

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 1);
      const allBenefits = [
        ...FEATURE_LABELS.filter(f => tier[f.key]).map(f => f.label),
        ...(tier.benefits || []),
      ];
      const sub = await base44.entities.Subscription.create({
        user_id: userId,
        creator_id: creatorId,
        tier_id: tier.id,
        tier_name: tier.name,
        price: tier.price,
        status: 'active',
        start_date: now.toISOString(),
        end_date: end.toISOString(),
        auto_renew: true,
        benefits_snapshot: allBenefits,
      });
      // Notify the creator
      const me = await base44.auth.me();
      await base44.entities.Notification.create({
        user_id: creatorId,
        type: 'subscription',
        title: `⭐ New ${tier.name} subscriber!`,
        message: `${me.full_name || me.email} just subscribed to your ${tier.name} tier for $${tier.price}/month.`,
        sender_id: userId,
      });
      return sub;
    },
    onSuccess: () => {
      toast.success(`Subscribed to ${tier.name}! 🎉`);
      qc.invalidateQueries(['userSubs']);
      qc.invalidateQueries(['creatorSubscriptions']);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => base44.entities.Subscription.update(currentSub.id, { status: 'cancelled', auto_renew: false }),
    onSuccess: () => {
      toast.info('Subscription cancelled');
      qc.invalidateQueries(['userSubs']);
    },
  });

  const activeFeatures = FEATURE_LABELS.filter(f => tier[f.key]);
  const allBenefits = [...activeFeatures.map(f => ({ label: f.label })), ...(tier.benefits || []).map(b => ({ label: b }))];

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card
        className={`relative overflow-hidden h-full flex flex-col transition-all ${isHighlighted ? 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/20' : ''} ${isFull && !isCurrentTier ? 'opacity-60' : ''}`}
      >
        {isHighlighted && (
          <div className="absolute top-0 left-0 right-0 bg-amber-500 text-black text-xs font-bold text-center py-0.5 tracking-wide">
            MOST POPULAR
          </div>
        )}

        {/* Color bar */}
        <div className="h-1.5 w-full" style={{ background: tier.color || '#d4af37' }} />

        <CardHeader className={`pb-3 ${isHighlighted ? 'pt-7' : 'pt-5'}`}>
          <div className="flex items-start justify-between">
            <TierBadge tier={tier} size="lg" showName={false} />
            {isFull && !isCurrentTier && <Badge variant="secondary" className="text-xs">Full</Badge>}
          </div>
          <div>
            <h3 className="text-xl font-bold mt-2">{tier.name}</h3>
            {tier.description && <p className="text-sm text-muted-foreground mt-0.5">{tier.description}</p>}
          </div>
          <div className="mt-3">
            <span className="text-4xl font-extrabold">${tier.price}</span>
            <span className="text-muted-foreground text-sm"> /month</span>
          </div>
          {tier.max_subscribers && (
            <div className="text-xs text-muted-foreground">
              {tier.subscriber_count || 0} / {tier.max_subscribers} spots filled
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 pb-4">
          <div className="space-y-2">
            {allBenefits.map((b, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tier.color || '#d4af37' }} />
                <span className="text-sm">{b.label}</span>
              </div>
            ))}
            {allBenefits.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Basic membership</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {isCurrentTier ? (
            <>
              <Button disabled className="w-full" style={{ background: tier.color, color: '#000' }}>
                ✓ Current Plan
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                Cancel subscription
              </Button>
            </>
          ) : (
            <Button
              className="w-full font-bold text-black"
              style={{ background: tier.color || '#d4af37' }}
              onClick={() => subscribeMutation.mutate()}
              disabled={subscribeMutation.isPending || isFull}
            >
              {subscribeMutation.isPending ? 'Processing...' : isFull ? 'Full' : `Join ${tier.name}`}
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}