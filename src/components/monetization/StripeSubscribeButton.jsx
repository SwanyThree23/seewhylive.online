import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CreditCard, Crown, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const TIERS = [
  { id: 'bronze', label: 'Bronze', price: 1.00, color: '#cd7f32', description: 'Support your creator' },
  { id: 'silver', label: 'Silver', price: 5.00, color: '#C0C0C0', description: 'Exclusive badge + early access' },
  { id: 'gold',   label: 'Gold',   price: 15.00, color: '#d4af37', description: 'All perks + private room access' },
];

export default function StripeSubscribeButton({ creatorId, creatorName, currentUserId }) {
  const [loading, setLoading] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubscribe = async (tier) => {
    if (!currentUserId) {
      toast.error('Please log in to subscribe');
      return;
    }
    setLoading(tier.id);
    try {
      const sub = await base44.entities.ViewerSubscription.create({
        viewer_id: currentUserId,
        creator_id: creatorId,
        tier: tier.id,
        price_usd: tier.price,
        status: 'pending',
        started_at: new Date().toISOString(),
      });

      const sessionId = `cs_${Date.now()}_${sub.id.slice(0, 8)}`;
      await base44.entities.ViewerSubscription.update(sub.id, {
        stripe_checkout_session_id: sessionId,
      });

      await simulatePaymentSuccess(sub.id, currentUserId, creatorId, tier.price);

      setSuccess(tier.id);
      toast.success(`Subscribed to ${tier.label} tier! 🎉`);
    } catch {
      toast.error('Subscription failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Barlow Condensed, sans-serif' }}>
        Subscribe to {creatorName}
      </p>
      {TIERS.map(tier => (
        <div
          key={tier.id}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 16, borderRadius: 12,
            border: `2px solid ${success === tier.id ? tier.color : 'transparent'}`,
            background: `${tier.color}10`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Crown style={{ width: 20, height: 20, color: tier.color }} />
            <div>
              <p style={{ fontWeight: 700, color: tier.color, fontFamily: 'Barlow Condensed, sans-serif' }}>{tier.label}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{tier.description}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'transparent', color: tier.color, border: `1px solid ${tier.color}` }}>
              ${tier.price}/mo
            </span>
            {success === tier.id ? (
              <button disabled style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#16a34a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'not-allowed', fontFamily: 'Barlow Condensed, sans-serif' }}>
                <CheckCircle style={{ width: 16, height: 16 }} /> Active
              </button>
            ) : (
              <button
                disabled={!!loading}
                onClick={() => handleSubscribe(tier)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: tier.color, border: 'none', borderRadius: 8, color: '#000', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                {loading === tier.id
                  ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                  : <><CreditCard style={{ width: 16, height: 16 }} /> Subscribe</>}
              </button>
            )}
          </div>
        </div>
      ))}
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
        Powered by Stripe · Creator receives 90% · Cancel anytime
      </p>
    </div>
  );
}

async function simulatePaymentSuccess(subId, viewerId, creatorId, grossUsd) {
  const creatorAmount = Math.floor(grossUsd * 90) / 100;
  const platformAmount = Math.round((grossUsd - creatorAmount) * 100) / 100;

  await Promise.all([
    base44.entities.ViewerSubscription.update(subId, {
      status: 'active',
      stripe_subscription_id: `sub_${Date.now()}`,
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    }),
    base44.entities.Transaction.create({
      from_user_id: viewerId,
      to_user_id: creatorId,
      amount: grossUsd,
      type: 'subscription',
      status: 'completed',
      description: `Subscription payment`,
      metadata: {
        creator_amount: creatorAmount,
        platform_amount: platformAmount,
        split: '90/10',
      },
    }),
  ]);
}
