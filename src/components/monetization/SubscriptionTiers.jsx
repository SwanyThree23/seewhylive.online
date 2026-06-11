import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { toast } from 'sonner';

const tierConfig = {
  basic: {
    icon: Star,
    gradient: 'linear-gradient(135deg, #2563eb, #0891b2)',
    badgeColor: '#3b82f6',
  },
  premium: {
    icon: Zap,
    gradient: 'linear-gradient(135deg, #800020, #D4854A)',
    badgeColor: '#D4854A',
  },
  elite: {
    icon: Crown,
    gradient: 'linear-gradient(135deg, #d97706, #ea580c)',
    badgeColor: '#f59e0b',
  },
};

export default function SubscriptionTiers({ communityId, userId }) {
  const queryClient = useQueryClient();

  const { data: tiers = [] } = useQuery({
    queryKey: ['subscriptionTiers', communityId],
    queryFn: () => base44.entities.SubscriptionTier.filter({ community_id: communityId, is_active: true }),
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ['userSubscription', userId, communityId],
    queryFn: () => base44.entities.Subscription.filter({
      user_id: userId,
      community_id: communityId,
      status: 'active',
    }).then(subs => subs[0]),
    enabled: !!userId,
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ tierId, price }) => {
      return await base44.entities.Subscription.create({
        user_id: userId,
        community_id: communityId,
        tier: tierId,
        price,
        status: 'active',
        start_date: new Date().toISOString(),
        auto_renew: true,
      });
    },
    onSuccess: () => {
      toast.success('Subscription activated! 🎉');
      queryClient.invalidateQueries(['userSubscription']);
    },
    onError: () => {
      toast.error('Subscription failed');
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'Barlow Condensed, sans-serif' }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Subscription Tiers</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Choose a plan that fits your needs</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
        {tiers.map((tier) => {
          const config = tierConfig[tier.name.toLowerCase()] || tierConfig.basic;
          const Icon = config.icon;
          const isCurrentTier = currentSubscription?.tier === tier.name.toLowerCase();

          return (
            <div key={tier.id} style={{ border: isCurrentTier ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(8,11,24,0.95)', overflow: 'hidden' }}>
              <div style={{ padding: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: config.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon style={{ width: 24, height: 24, color: '#fff' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{tier.name}</span>
                  {isCurrentTier && <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>Current</span>}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>{tier.description}</p>
                <div>
                  <span style={{ fontSize: 30, fontWeight: 700, color: '#fff' }}>${tier.price}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>/month</span>
                </div>
              </div>

              <div style={{ padding: '0 20px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tier.benefits?.map((benefit, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Check style={{ width: 16, height: 16, color: '#22c55e', marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{benefit}</span>
                    </div>
                  ))}

                  {tier.has_early_access && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Check style={{ width: 16, height: 16, color: '#22c55e', marginTop: 2 }} />
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>Early access to content</span>
                    </div>
                  )}

                  {tier.is_ad_free && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Check style={{ width: 16, height: 16, color: '#22c55e', marginTop: 2 }} />
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>Ad-free viewing</span>
                    </div>
                  )}

                  {tier.badge_id && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Check style={{ width: 16, height: 16, color: '#22c55e', marginTop: 2 }} />
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>Exclusive badge</span>
                    </div>
                  )}

                  {tier.custom_emotes?.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Check style={{ width: 16, height: 16, color: '#22c55e', marginTop: 2 }} />
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{tier.custom_emotes.length} custom emotes</span>
                    </div>
                  )}

                  {tier.priority_support && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Check style={{ width: 16, height: 16, color: '#22c55e', marginTop: 2 }} />
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>Priority support</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: '0 20px 20px' }}>
                {isCurrentTier ? (
                  <button disabled style={{ width: '100%', padding: '10px 0', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'not-allowed', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => subscribeMutation.mutate({ tierId: tier.name.toLowerCase(), price: tier.price })}
                    disabled={subscribeMutation.isPending}
                    style={{ width: '100%', padding: '10px 0', background: config.gradient, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: subscribeMutation.isPending ? 'not-allowed' : 'pointer', opacity: subscribeMutation.isPending ? 0.7 : 1, fontFamily: 'Barlow Condensed, sans-serif' }}
                  >
                    {subscribeMutation.isPending ? 'Processing...' : 'Subscribe'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
