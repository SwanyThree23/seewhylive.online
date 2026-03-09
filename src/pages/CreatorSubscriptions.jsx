import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import CreatorTierManager from '../components/subscriptions/CreatorTierManager';
import SubscriberTierView from '../components/subscriptions/SubscriberTierView';
import MySubscriptions from '../components/subscriptions/MySubscriptions';
import { Crown, Users, Settings, Star } from 'lucide-react';

export default function CreatorSubscriptionsPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isCreator = user?.role === 'admin' || user?.role === 'creator';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Memberships</h1>
            <p className="text-muted-foreground text-sm">Manage tiers or discover creator memberships</p>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue={isCreator ? 'manage' : 'my'} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          {isCreator && (
            <TabsTrigger value="manage" className="gap-1.5">
              <Settings className="w-4 h-4" /> Manage Tiers
            </TabsTrigger>
          )}
          <TabsTrigger value="discover" className="gap-1.5">
            <Star className="w-4 h-4" /> Discover
          </TabsTrigger>
          <TabsTrigger value="my" className="gap-1.5">
            <Users className="w-4 h-4" /> My Subscriptions
          </TabsTrigger>
        </TabsList>

        {/* Creator: Manage Tiers */}
        {isCreator && (
          <TabsContent value="manage">
            <CreatorTierManager creatorId={user?.id} />
          </TabsContent>
        )}

        {/* Discover: view your own tiers as a viewer would */}
        <TabsContent value="discover">
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="py-4 flex items-center gap-3">
                <span className="text-3xl">🎭</span>
                <div>
                  <p className="font-semibold">Preview Your Membership Page</p>
                  <p className="text-sm text-muted-foreground">This is how your subscribers see your tiers.</p>
                </div>
              </CardContent>
            </Card>
            <SubscriberTierView creatorId={user?.id} userId={user?.id} />
          </div>
        </TabsContent>

        {/* My subscriptions */}
        <TabsContent value="my">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">My Memberships</h2>
              <p className="text-sm text-muted-foreground">All your active and past subscriptions</p>
            </div>
            <MySubscriptions userId={user?.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}