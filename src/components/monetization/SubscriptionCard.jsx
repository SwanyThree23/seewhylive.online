import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, Star, Crown, Zap } from 'lucide-react';

const tierConfig = {
  basic: {
    icon: Zap,
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600',
  },
  premium: {
    icon: Star,
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-purple-600',
  },
  elite: {
    icon: Crown,
    color: 'bg-amber-500',
    gradient: 'from-amber-500 to-amber-600',
  },
};

export default function SubscriptionCard({ tier, price, benefits, communityId, creatorId, isSubscribed }) {
  const queryClient = useQueryClient();
  const config = tierConfig[tier];
  const Icon = config.icon;

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      return await base44.entities.Subscription.create({
        user_id: 'current_user',
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
    },
    onError: () => {
      toast.error('Failed to subscribe');
    },
  });

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />
      
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg ${config.color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="capitalize">{tier} Tier</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">
              ${price}<span className="text-sm font-normal text-muted-foreground">/month</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {benefits?.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{benefit}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isSubscribed ? (
          <Badge className="w-full justify-center py-2">Active Subscription</Badge>
        ) : (
          <Button
            onClick={() => subscribeMutation.mutate()}
            disabled={subscribeMutation.isPending}
            className={`w-full bg-gradient-to-r ${config.gradient}`}
          >
            {subscribeMutation.isPending ? 'Processing...' : 'Subscribe Now'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}