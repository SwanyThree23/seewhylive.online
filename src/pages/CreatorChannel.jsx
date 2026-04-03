import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Radio, Users, CheckCircle, Share2, Bell, Play, Clock,
  Twitter, Instagram, Youtube, ExternalLink, Calendar, Crown
} from 'lucide-react';
import SubscriberTierView from '../components/subscriptions/SubscriberTierView';
import VideoLibrary from '../components/vod/VideoLibrary';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function CreatorChannel() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  const qc = useQueryClient();

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['creator-profile', userId],
    queryFn: () => base44.entities.CreatorProfile.filter({ user_id: userId }).then(r => r[0]),
    enabled: !!userId,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['creator-rooms', userId],
    queryFn: () => base44.entities.Room.filter({ host_id: userId }, '-created_date', 20),
    enabled: !!userId,
  });

  const { data: recordings = [] } = useQuery({
    queryKey: ['creator-recordings', userId],
    queryFn: () => base44.entities.StreamRecording.filter({ creator_id: userId }, '-recorded_at', 12),
    enabled: !!userId,
  });

  const liveRoom = rooms.find(r => r.status === 'live');
  const pastRooms = rooms.filter(r => r.status === 'ended');
  const scheduledRooms = rooms.filter(r => r.status === 'scheduled');

  const socialIcons = { twitter: Twitter, instagram: Instagram, youtube: Youtube };

  const notifyMutation = useMutation({
    mutationFn: () => base44.entities.Notification.create({
      user_id: currentUser?.id,
      type: 'room_invite',
      title: `${profile?.display_name} went live!`,
      message: `${profile?.display_name} is now streaming. Join now!`,
    }),
    onSuccess: () => alert('Reminder set!'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0618] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = profile?.display_name || 'Creator';
  const bio = profile?.bio || 'Welcome to my channel!';
  const category = profile?.category || 'other';
  const bannerUrl = profile?.banner_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80';

  return (
    <div className="min-h-screen bg-[#0d0618] text-white">
      {/* Hero Banner */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0618] via-[#0d0618]/40 to-transparent" />

        {liveRoom && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-red-600 text-white animate-pulse border-0 text-sm px-3 py-1.5 gap-2 shadow-2xl">
              <div className="w-2 h-2 rounded-full bg-white" />
              LIVE NOW
            </Badge>
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 mb-6 relative z-10">
          <Avatar className="w-28 h-28 border-4 border-[#0d0618] shadow-2xl">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-[#800020] to-[#d4af37] text-3xl font-bold text-white w-full h-full">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              {profile?.is_verified && <CheckCircle className="w-5 h-5 text-[#00d4ff]" />}
              <Badge className="text-xs bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30 capitalize">{category}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {(profile?.subscriber_count || 0).toLocaleString()} subscribers</span>
              <span>{(profile?.follower_count || 0).toLocaleString()} followers</span>
              <span>{Math.round(profile?.total_hours_streamed || 0)}h streamed</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pb-2">
            {liveRoom ? (
              <Link to={createPageUrl('LiveRoom') + `?id=${liveRoom.id}`}>
                <Button className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2">
                  <Radio className="w-4 h-4" />
                  Watch Now
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                className="border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/10 gap-2"
                onClick={() => notifyMutation.mutate()}
              >
                <Bell className="w-4 h-4" />
                Notify Me
              </Button>
            )}
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white w-10 h-10">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bio + Socials */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start">
          <p className="text-sm text-white/70 flex-1 max-w-2xl">{bio}</p>
          <div className="flex items-center gap-2 shrink-0">
            {profile?.social_links && Object.entries(profile.social_links).map(([platform, url]) => {
              const Icon = socialIcons[platform];
              return url ? (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all">
                  {Icon ? <Icon className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                </a>
              ) : null;
            })}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="live" className="pb-16">
          <TabsList className="bg-white/5 border border-white/10">
            {['live', 'videos', 'schedule', 'memberships', 'about'].map(t => (
              <TabsTrigger key={t} value={t}
                className="capitalize text-white/50 data-[state=active]:text-[#d4af37] data-[state=active]:bg-[#d4af37]/10">
                {t === 'memberships' ? <><Crown className="w-3.5 h-3.5 mr-1 inline" />Memberships</> : t}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Live Tab */}
          <TabsContent value="live" className="mt-6">
            {liveRoom ? (
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.15)] text-white overflow-hidden">
                <div className="relative h-48 bg-gradient-to-br from-[#800020]/30 to-[#0d0618] flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-red-400 font-semibold text-sm">LIVE NOW</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{liveRoom.title}</h3>
                    <p className="text-sm text-white/50 mt-1">{liveRoom.viewer_count || 0} viewers watching</p>
                  </div>
                </div>
                <CardContent className="p-4">
                  <Link to={createPageUrl('LiveRoom') + `?id=${liveRoom.id}`}>
                    <Button className="w-full bg-red-600 hover:bg-red-700 gap-2">
                      <Play className="w-4 h-4" /> Join Stream
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-16 text-white/30">
                <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Not currently live</p>
                {scheduledRooms.length > 0 && (
                  <p className="text-sm mt-2">Next stream: <strong className="text-[#d4af37]">{scheduledRooms[0]?.title}</strong></p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="mt-6">
            <VideoLibrary creatorId={userId} />
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="mt-6 space-y-3">
            {(profile?.stream_schedule || []).map((item, i) => (
              <Card key={i} className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)] text-white">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-[#d4af37]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{item.title || 'Weekly Stream'}</p>
                    <p className="text-sm text-white/50">{item.day} · {item.time}</p>
                  </div>
                  <Button size="sm" variant="outline"
                    className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 text-xs"
                    onClick={() => notifyMutation.mutate()}>
                    <Bell className="w-3 h-3 mr-1" /> Remind Me
                  </Button>
                </CardContent>
              </Card>
            ))}
            {scheduledRooms.map(r => (
              <Card key={r.id} className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)] text-white">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-[#00d4ff]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{r.title}</p>
                    <p className="text-sm text-white/50">{r.scheduled_start ? new Date(r.scheduled_start).toLocaleString() : 'Scheduled'}</p>
                  </div>
                  <Badge className="bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/30">Upcoming</Badge>
                </CardContent>
              </Card>
            ))}
            {!profile?.stream_schedule?.length && !scheduledRooms.length && (
              <p className="text-center text-white/30 py-12">No upcoming streams scheduled</p>
            )}
          </TabsContent>

          {/* Memberships Tab */}
          <TabsContent value="memberships" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-[#d4af37]" />
                <h3 className="text-lg font-bold text-white">Support {displayName}</h3>
              </div>
              <div className="bg-white/3 rounded-2xl p-4">
                <SubscriberTierView creatorId={userId} userId={currentUser?.id} />
              </div>
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-6">
            <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.12)] text-white">
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-[#d4af37] mb-2">About</p>
                  <p className="text-sm text-white/70">{bio}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase">Category</p>
                    <p className="text-sm font-semibold capitalize">{category}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase">Total Hours</p>
                    <p className="text-sm font-semibold">{Math.round(profile?.total_hours_streamed || 0)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}