import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { toast } from 'sonner';

const tierConfig = {
  basic: {
    icon: Star,
    gradient: 'from-blue-600 to-cyan-600',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  premium: {
    icon: Zap,
    gradient: 'from-purple-600 to-pink-600',
    badgeColor: 'bg-purple-100 text-purple-800'
  },
  elite: {
    icon: Crown,
    gradient: 'from-amber-600 to-orange-600',
    badgeColor: 'bg-amber-100 text-amber-800'
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Subscription Tiers</h2>
        <p className="text-muted-foreground">Choose a plan that fits your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const config = tierConfig[tier.name.toLowerCase()] || tierConfig.basic;
          const Icon = config.icon;
          const isCurrentTier = currentSubscription?.tier === tier.name.toLowerCase();

          return (
            <Card key={tier.id} className={isCurrentTier ? 'border-2 border-primary' : ''}>
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  {tier.name}
                  {isCurrentTier && <Badge>Current</Badge>}
                </CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="pt-3">
                  <span className="text-3xl font-bold">${tier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  {tier.benefits?.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                  
                  {tier.has_early_access && (
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Early access to content</span>
                    </div>
                  )}
                  
                  {tier.is_ad_free && (
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Ad-free viewing</span>
                    </div>
                  )}
                  
                  {tier.badge_id && (
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Exclusive badge</span>
                    </div>
                  )}
                  
                  {tier.custom_emotes?.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{tier.custom_emotes.length} custom emotes</span>
                    </div>
                  )}
                  
                  {tier.priority_support && (
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Priority support</span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                {isCurrentTier ? (
                  <Button disabled className="w-full">Current Plan</Button>
                ) : (
                  <Button
                    onClick={() => subscribeMutation.mutate({ tierId: tier.name.toLowerCase(), price: tier.price })}
                    disabled={subscribeMutation.isPending}
                    className={`w-full bg-gradient-to-r ${config.gradient}`}
                  >
                    {subscribeMutation.isPending ? 'Processing...' : 'Subscribe'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}