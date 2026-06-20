import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
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
      const me = await base44.auth.me();
      await base44.entities.Notification.create({
        user_id: creatorId,
        type: 'subscription',
        title: `⭐ New ${tier.name} subscriber!`,
        message: `${me.full_name || me.email} just subscribed to your ${tier.name} tier for $${tier.price}/month.`,
        sender_id: userId,
      });
      await Promise.allSettled([
        base44.entities.Activity.create({
          user_id: userId,
          type: 'subscription',
          title: `Subscribed to ${tier.name} tier`,
          creator_id: creatorId,
          amount: tier.price,
        }),
        base44.entities.Activity.create({
          user_id: creatorId,
          type: 'subscription',
          title: `New ${tier.name} subscriber`,
          amount: tier.price,
          sender_id: userId,
        }),
      ]);
      return sub;
    },
    onSuccess: () => {
      toast.success(`Subscribed to ${tier.name}! 🎉`);
      qc.invalidateQueries({ queryKey: ['userSubs'] });
      qc.invalidateQueries({ queryKey: ['creatorSubscriptions'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => base44.entities.Subscription.update(currentSub.id, { status: 'cancelled', auto_renew: false }),
    onSuccess: () => {
      toast.info('Subscription cancelled');
      qc.invalidateQueries({ queryKey: ['userSubs'] });
    },
  });

  const activeFeatures = FEATURE_LABELS.filter(f => tier[f.key]);
  const allBenefits = [...activeFeatures.map(f => ({ label: f.label })), ...(tier.benefits || []).map(b => ({ label: b }))];

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
      <div
        style={{
          position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%',
          background: 'rgba(8,11,24,0.95)',
          border: isHighlighted ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          boxShadow: isHighlighted ? '0 4px 20px rgba(212,175,55,0.2)' : 'none',
          opacity: (isFull && !isCurrentTier) ? 0.6 : 1,
          fontFamily: 'Barlow Condensed, sans-serif',
        }}
      >
        {isHighlighted && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#D4AF37', color: '#000', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '2px 0', letterSpacing: '0.08em' }}>
            MOST POPULAR
          </div>
        )}

        {/* Color bar */}
        <div style={{ height: 6, width: '100%', background: tier.color || '#d4af37' }} />

        <div style={{ padding: `${isHighlighted ? 28 : 20}px 20px 12px` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <TierBadge tier={tier} size="lg" showName={false} />
            {isFull && !isCurrentTier && (
              <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}>Full</span>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>{tier.name}</h3>
            {tier.description && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{tier.description}</p>}
          </div>
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>${tier.price}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}> /month</span>
          </div>
          {tier.max_subscribers && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              {tier.subscriber_count || 0} / {tier.max_subscribers} spots filled
            </div>
          )}
        </div>

        <div style={{ flex: 1, padding: '0 20px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allBenefits.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Check style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, color: tier.color || '#d4af37' }} />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{b.label}</span>
              </div>
            ))}
            {allBenefits.length === 0 && (
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Basic membership</p>
            )}
          </div>
        </div>

        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isCurrentTier ? (
            <>
              <button disabled style={{ width: '100%', padding: '10px 0', background: tier.color, border: 'none', borderRadius: 8, color: '#000', fontSize: 14, fontWeight: 700, cursor: 'not-allowed', fontFamily: 'Barlow Condensed, sans-serif' }}>
                ✓ Current Plan
              </button>
              <button
                style={{ width: '100%', padding: '6px 0', background: 'transparent', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: cancelMutation.isPending ? 'not-allowed' : 'pointer', opacity: cancelMutation.isPending ? 0.6 : 1, fontFamily: 'Barlow Condensed, sans-serif' }}
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                Cancel subscription
              </button>
            </>
          ) : (
            <button
              style={{ width: '100%', padding: '10px 0', background: tier.color || '#d4af37', border: 'none', borderRadius: 8, color: '#000', fontSize: 14, fontWeight: 700, cursor: (subscribeMutation.isPending || isFull) ? 'not-allowed' : 'pointer', opacity: (subscribeMutation.isPending || isFull) ? 0.7 : 1, fontFamily: 'Barlow Condensed, sans-serif' }}
              onClick={() => subscribeMutation.mutate()}
              disabled={subscribeMutation.isPending || isFull}
            >
              {subscribeMutation.isPending ? 'Processing...' : isFull ? 'Full' : `Join ${tier.name}`}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
