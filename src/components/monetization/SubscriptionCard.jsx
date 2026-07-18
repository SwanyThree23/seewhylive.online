import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle, Star, Crown, Zap } from 'lucide-react';

const tierConfig = {
  basic: {
    icon: Zap,
    color: '#D4AF37',
    gradient: 'linear-gradient(135deg, #D4AF37, #C9A84C)',
  },
  premium: {
    icon: Star,
    color: '#D4854A',
    gradient: 'linear-gradient(135deg, #D4854A, #800020)',
  },
  elite: {
    icon: Crown,
    color: '#C9A84C',
    gradient: 'linear-gradient(135deg, #C9A84C, #d97706)',
  },
};

export default function SubscriptionCard({ tier, price, benefits, communityId, creatorId, isSubscribed }) {
  const queryClient = useQueryClient();
  const config = tierConfig[tier] || tierConfig.basic;
  const Icon = config.icon;

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      return await base44.entities.Subscription.create({
        user_id: currentUser?.id || 'unknown',
        community_id: communityId,
        creator_id: creatorId,
        tier,
        price,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        auto_renew: true,
        benefits,
      });
    },
    onSuccess: () => {
      toast.success(`Subscribed to ${tier} tier! 🎉`);
      queryClient.invalidateQueries(['subscriptions']);
      if (currentUser?.id) {
        Promise.allSettled([
          base44.entities.Activity.create({
            user_id: currentUser.id,
            type: 'subscription',
            title: `Subscribed to ${tier} tier`,
            creator_id: creatorId,
            amount: price,
          }),
          creatorId && base44.entities.Activity.create({
            user_id: creatorId,
            type: 'subscription',
            title: `New ${tier} subscriber`,
            amount: price,
            sender_id: currentUser.id,
          }),
        ]);
      }
    },
    onError: () => {
      toast.error('Failed to subscribe');
    },
  });

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, background: 'rgba(8,11,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Barlow Condensed, sans-serif' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: config.gradient }} />

      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: config.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: 24, height: 24, color: '#fff' }} />
          </div>
          <div>
            <p style={{ fontWeight: 900, fontSize: 18, color: '#fff', textTransform: 'capitalize' }}>{tier} Tier</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>
              ${price}<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/month</span>
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {benefits?.map((benefit, index) => (
            <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <CheckCircle style={{ width: 20, height: 20, color: '#6DBF7E', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        {isSubscribed ? (
          <span style={{ display: 'block', textAlign: 'center', padding: '10px 0', fontSize: 10, fontWeight: 900, borderRadius: 99, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
            Active Subscription
          </span>
        ) : (
          <button
            onClick={() => subscribeMutation.mutate()}
            disabled={subscribeMutation.isPending}
            style={{ width: '100%', padding: '10px 0', background: config.gradient, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: subscribeMutation.isPending ? 'not-allowed' : 'pointer', opacity: subscribeMutation.isPending ? 0.7 : 1, fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            {subscribeMutation.isPending ? 'Processing...' : 'Subscribe Now'}
          </button>
        )}
      </div>
    </div>
  );
}
