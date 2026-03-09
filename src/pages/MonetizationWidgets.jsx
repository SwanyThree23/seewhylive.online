import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Bell, Gavel, Zap, Info } from 'lucide-react';
import StreamerGoalsWidget from '../components/monetization/StreamerGoalsWidget';
import SoundAlertsManager from '../components/monetization/SoundAlertsManager';
import LiveAuctionWidget from '../components/monetization/LiveAuctionWidget';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function MonetizationWidgets() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: myRooms = [] } = useQuery({
    queryKey: ['my-live-rooms', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }, '-created_date', 5),
    enabled: !!user,
  });

  const activeRoom = myRooms[0];

  return (
    <div className="min-h-screen bg-[#0d0618] text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#d4af37] flex items-center gap-2">
            <Zap className="w-6 h-6" /> Monetization Widgets
          </h1>
          <p className="text-sm text-white/50 mt-1">Streamer Goals, Sound Alerts &amp; Live Auctions for your stream</p>
        </div>

        {/* Beta notice */}
        <div className="flex items-start gap-3 p-4 bg-[#00d4ff]/5 border border-[#00d4ff]/20 rounded-xl">
          <Info className="w-4 h-4 text-[#00d4ff] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#00d4ff]">Beta Testing</p>
            <p className="text-xs text-white/50 mt-0.5">
              These features are live for Beta Testing. Goals update in real-time, sound alerts fire during streams, and auctions let viewers bid during live sessions.
              {activeRoom ? (
                <span> Using room: <strong className="text-white">{activeRoom.title}</strong></span>
              ) : (
                <span> <Link to={createPageUrl('CreateRoom')} className="underline hover:text-[#00d4ff]">Start a live room</Link> to enable auction bidding.</span>
              )}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active Goals', color: '#d4af37', icon: Target, tab: 'goals' },
            { label: 'Sound Alerts', color: '#22c55e', icon: Bell, tab: 'alerts' },
            { label: 'Live Auctions', color: '#a78bfa', icon: Gavel, tab: 'auctions' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)] cursor-pointer hover:border-[rgba(212,175,55,0.2)] transition-all">
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className="w-5 h-5 shrink-0" style={{ color: s.color }} />
                  <p className="text-xs text-white/60">{s.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="goals">
          <TabsList className="bg-white/5 border border-white/10 w-full grid grid-cols-3">
            <TabsTrigger value="goals" className="text-white/50 data-[state=active]:text-[#d4af37] data-[state=active]:bg-[#d4af37]/10 gap-1.5">
              <Target className="w-3.5 h-3.5" /> Goals
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-white/50 data-[state=active]:text-[#22c55e] data-[state=active]:bg-[#22c55e]/10 gap-1.5">
              <Bell className="w-3.5 h-3.5" /> Sound Alerts
            </TabsTrigger>
            <TabsTrigger value="auctions" className="text-white/50 data-[state=active]:text-[#a78bfa] data-[state=active]:bg-[#a78bfa]/10 gap-1.5">
              <Gavel className="w-3.5 h-3.5" /> Auctions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="mt-5">
            <Card className="bg-[rgba(255,255,255,0.03)] border-white/5">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-[#d4af37]">Streamer Goals — Real-Time</CardTitle>
                <p className="text-xs text-white/40">Goals update live and celebrate when reached with confetti</p>
              </CardHeader>
              <CardContent className="p-4">
                <StreamerGoalsWidget
                  creatorId={user?.id}
                  roomId={activeRoom?.id}
                  isCreator={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="mt-5">
            <Card className="bg-[rgba(255,255,255,0.03)] border-white/5">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-[#22c55e]">Sound Alert Configuration</CardTitle>
                <p className="text-xs text-white/40">Alerts trigger automatically when donation thresholds are met during stream</p>
              </CardHeader>
              <CardContent className="p-4">
                <SoundAlertsManager creatorId={user?.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auctions" className="mt-5">
            <Card className="bg-[rgba(255,255,255,0.03)] border-white/5">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-[#a78bfa]">Live Auctions</CardTitle>
                <p className="text-xs text-white/40">Start real-time auctions — viewers bid live during your stream</p>
              </CardHeader>
              <CardContent className="p-4">
                <LiveAuctionWidget
                  creatorId={user?.id}
                  roomId={activeRoom?.id}
                  isCreator={true}
                  currentUser={user}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}