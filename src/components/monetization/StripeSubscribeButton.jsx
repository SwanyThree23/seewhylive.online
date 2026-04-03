import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

    // Create a pending ViewerSubscription record
    const sub = await base44.entities.ViewerSubscription.create({
      viewer_id: currentUserId,
      creator_id: creatorId,
      tier: tier.id,
      price_usd: tier.price,
      status: 'pending',
      started_at: new Date().toISOString(),
    });

    // Use InvokeLLM to simulate Stripe Checkout URL generation
    // In production, replace with a real backend function call to Stripe API
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a mock Stripe Checkout session response JSON for a subscription:
- Customer subscribes to "${tier.label}" tier at $${tier.price}/month
- Creator: ${creatorName}
- Subscription record ID: ${sub.id}
- Return a JSON with: { session_id: "cs_test_xxx", checkout_url: "https://checkout.stripe.com/pay/cs_test_xxx" }
Only return valid JSON.`,
      response_json_schema: {
        type: 'object',
        properties: {
          session_id: { type: 'string' },
          checkout_url: { type: 'string' },
        },
      },
    });

    // Update the subscription with the session ID
    await base44.entities.ViewerSubscription.update(sub.id, {
      stripe_checkout_session_id: result.session_id,
    });

    // Simulate immediate success (in production, handle via webhook)
    await simulatePaymentSuccess(sub.id, currentUserId, creatorId, tier.price);

    setLoading(null);
    setSuccess(tier.id);
    toast.success(`Subscribed to ${tier.label} tier! 🎉`);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Subscribe to {creatorName}</p>
      {TIERS.map(tier => (
        <div
          key={tier.id}
          className="flex items-center justify-between p-4 rounded-xl border-2 transition-all"
          style={{ borderColor: success === tier.id ? tier.color : 'transparent', background: `${tier.color}10` }}
        >
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5" style={{ color: tier.color }} />
            <div>
              <p className="font-bold" style={{ color: tier.color }}>{tier.label}</p>
              <p className="text-xs text-muted-foreground">{tier.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" style={{ borderColor: tier.color, color: tier.color }}>
              ${tier.price}/mo
            </Badge>
            {success === tier.id ? (
              <Button size="sm" disabled className="bg-green-600 text-white">
                <CheckCircle className="w-4 h-4 mr-1" /> Active
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!!loading}
                onClick={() => handleSubscribe(tier)}
                style={{ background: tier.color, color: '#000' }}
              >
                {loading === tier.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><CreditCard className="w-4 h-4 mr-1" /> Subscribe</>}
              </Button>
            )}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground text-center">
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