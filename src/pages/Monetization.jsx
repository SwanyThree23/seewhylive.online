import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubscriptionCard from '../components/monetization/SubscriptionCard';
import VirtualGoodsStore from '../components/monetization/VirtualGoodsStore';
import RevenueDashboard from '../components/monetization/RevenueDashboard';
import SubscriptionTiers from '../components/monetization/SubscriptionTiers';
import { DollarSign, TrendingUp, Users, Award } from 'lucide-react';

export default function MonetizationPage() {
  const [showGiftShop, setShowGiftShop] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['userTransactions'],
    queryFn: () => base44.entities.Transaction.filter({ from_user_id: user?.id || '' }),
    enabled: !!user,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['userSubscriptions'],
    queryFn: () => base44.entities.Subscription.filter({ user_id: user?.id || '' }),
    enabled: !!user,
  });

  const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;

  const subscriptionTiers = [
    {
      tier: 'basic',
      price: 4.99,
      benefits: [
        'Access to exclusive rooms',
        'Custom profile badge',
        'Priority support',
        'Ad-free experience',
      ],
    },
    {
      tier: 'premium',
      price: 9.99,
      benefits: [
        'All Basic benefits',
        'Host unlimited rooms',
        'Custom emojis',
        'Advanced analytics',
        'VIP community access',
      ],
    },
    {
      tier: 'elite',
      price: 19.99,
      benefits: [
        'All Premium benefits',
        'Verified badge',
        'Revenue sharing',
        'Dedicated support',
        'Early access to features',
        'Custom branding',
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Monetization</h1>
          <p className="text-muted-foreground">Subscriptions, virtual goods, and more</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Spent</CardDescription>
            <CardTitle className="text-3xl">${totalSpent.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>All time</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Subscriptions</CardDescription>
            <CardTitle className="text-3xl">{activeSubscriptions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Supporting creators</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Virtual Items</CardDescription>
            <CardTitle className="text-3xl">
              {transactions.filter(t => t.type === 'virtual_good').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="w-4 h-4" />
              <span>Items purchased</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="store">Virtual Goods Store</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <RevenueDashboard userId={user?.id} />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <SubscriptionTiers userId={user?.id} />
        </TabsContent>

        <TabsContent value="store">
          <VirtualGoodsStore userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}