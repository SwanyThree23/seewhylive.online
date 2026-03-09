import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VirtualGoodsStore from '../components/monetization/VirtualGoodsStore';
import AnimatedGiftShop from '../components/monetization/AnimatedGiftShop';
import RevenueDashboard from '../components/monetization/RevenueDashboard';
import CreatorTierManager from '../components/subscriptions/CreatorTierManager';
import MySubscriptions from '../components/subscriptions/MySubscriptions';
import StreamerGoalsWidget from '../components/monetization/StreamerGoalsWidget';
import SoundAlertsManager from '../components/monetization/SoundAlertsManager';
import LiveAuctionWidget from '../components/monetization/LiveAuctionWidget';
import { DollarSign, TrendingUp, Users, Award, Gift, Sparkles, Target, Bell, Gavel } from 'lucide-react';

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
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="store">Virtual Goods</TabsTrigger>
          <TabsTrigger value="gifts"><Sparkles className="w-4 h-4 mr-1" />Gifts</TabsTrigger>
          <TabsTrigger value="goals"><Target className="w-4 h-4 mr-1" />Goals</TabsTrigger>
          <TabsTrigger value="alerts"><Bell className="w-4 h-4 mr-1" />Alerts</TabsTrigger>
          <TabsTrigger value="auctions"><Gavel className="w-4 h-4 mr-1" />Auctions</TabsTrigger>
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

        <TabsContent value="gifts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Animated Gift Gallery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Send unique animated gifts to streamers and community members to show your support
              </p>
              <Button onClick={() => setShowGiftShop(true)} size="lg">
                <Gift className="w-4 h-4 mr-2" />
                Browse Gifts
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <StreamerGoalsWidget creatorId={user?.id} isCreator={true} />
        </TabsContent>

        <TabsContent value="alerts">
          <div className="max-w-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" /> Sound Alert Configuration
            </h3>
            <SoundAlertsManager creatorId={user?.id} />
          </div>
        </TabsContent>

        <TabsContent value="auctions">
          <div className="max-w-2xl">
            <LiveAuctionWidget creatorId={user?.id} isCreator={true} currentUser={user} />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showGiftShop} onOpenChange={setShowGiftShop}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Animated Gift Shop</DialogTitle>
          </DialogHeader>
          <AnimatedGiftShop onClose={() => setShowGiftShop(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}