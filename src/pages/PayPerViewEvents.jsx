import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import PayPerViewCard from '../components/monetization/PayPerViewCard';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
export default function PayPerViewEventsPage() {
  const [filter, setFilter] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['ppv-events', filter],
    queryFn: async () => {
      if (filter === 'all') {
        return await base44.entities.PayPerViewEvent.filter({}, '-event_date', 20);
      }
      return await base44.entities.PayPerViewEvent.filter({ status: filter }, '-event_date', 20);
    },
  });

  const { data: myAccess = [] } = useQuery({
    queryKey: ['my-ppv-access', user?.id],
    queryFn: () => base44.entities.PayPerViewAccess.filter({ user_id: user.id }),
    enabled: !!user,
  });

  const myEventIds = myAccess.map(a => a.event_id);
  const myEvents = events.filter(e => myEventIds.includes(e.id));
  const availableEvents = events.filter(e => !myEventIds.includes(e.id));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <Lock className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-5xl font-bold mb-4">Premium Events</h1>
            <p className="text-xl text-purple-100 mb-8">
              Exclusive access to special rooms and premium content
            </p>
            <div className="flex gap-4 justify-center">
              <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-4">
                <DollarSign className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Pay Per Event</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-4">
                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Early Access</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-4">
                <Lock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Exclusive Content</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'upcoming', 'live', 'ended'].map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="available" className="space-y-6">
          <TabsList>
            <TabsTrigger value="available">Available Events</TabsTrigger>
            <TabsTrigger value="purchased">My Events</TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            {availableEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableEvents.map(event => (
                  <PayPerViewCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No events available</h3>
                <p className="text-muted-foreground">Check back soon for premium events</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchased">
            {myEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myEvents.map(event => (
                  <PayPerViewCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Lock className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No purchased events</h3>
                <p className="text-muted-foreground">Browse available events to get started</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="ppv" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={null} roomId={null} currentUser={null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </div>
  );
}