import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Radio, Heart, Bell, BellOff, Clock, DollarSign, Scissors,
  Play, TrendingUp, Star, Users, Filter, CheckCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function ViewerDashboard() {
  const qc = useQueryClient();
  const [notifFilter, setNotifFilter] = useState('all');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: liveRooms = [] } = useQuery({
    queryKey: ['all-live-rooms'],
    queryFn: () => base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 20),
    refetchInterval: 15000,
  });

  const { data: scheduledRooms = [] } = useQuery({
    queryKey: ['upcoming-rooms'],
    queryFn: () => base44.entities.Room.filter({ status: 'scheduled' }, 'scheduled_start', 10),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user?.id }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: mySubscriptions = [] } = useQuery({
    queryKey: ['my-subs', user?.id],
    queryFn: () => base44.entities.Subscription.filter({ subscriber_id: user?.id }),
    enabled: !!user,
  });

  const { data: myClips = [] } = useQuery({
    queryKey: ['my-clips', user?.id],
    queryFn: () => base44.entities.StreamClip.filter({ clipped_by_id: user?.id }, '-created_date', 10),
    enabled: !!user,
  });

  const { data: recentVODs = [] } = useQuery({
    queryKey: ['recent-vods'],
    queryFn: () => base44.entities.StreamRecording.list('-recorded_at', 12),
  });

  const markAllRead = useMutation({
    mutationFn: () => Promise.all(notifications.filter(n => !n.is_read).map(n => base44.entities.Notification.update(n.id, { is_read: true }))),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filteredNotifs = notifFilter === 'all' ? notifications : notifications.filter(n => {
    if (notifFilter === 'live') return n.type === 'room_invite';
    if (notifFilter === 'tips') return n.type === 'tip';
    if (notifFilter === 'system') return n.type === 'announcement' || n.type === 'moderation';
    return true;
  });

  const getCountdown = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    if (diff <= 0) return 'Starting now';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
  };

  return (
    <div className="min-h-screen bg-[#0d0618] text-white p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Your Feed</h1>
            <p className="text-sm text-white/50">Welcome back, {user?.full_name || 'Viewer'}</p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30 text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>

        <Tabs defaultValue="following">
          <TabsList className="bg-white/5 border border-white/10">
            {[
              { value: 'following', label: 'Following' },
              { value: 'activity', label: 'My Activity' },
              { value: 'discover', label: 'Discover' },
              { value: 'notifications', label: `Notifications${unreadCount ? ` (${unreadCount})` : ''}` },
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}
                className="text-xs text-white/50 data-[state=active]:text-[#d4af37] data-[state=active]:bg-[#d4af37]/10">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* FOLLOWING FEED */}
          <TabsContent value="following" className="space-y-5 mt-5">
            {/* Live Now */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="font-semibold text-white">Live Now</h2>
                <Badge className="text-[9px] bg-red-900/40 text-red-400 border-red-700/30">{liveRooms.length}</Badge>
              </div>
              {liveRooms.length === 0 ? (
                <p className="text-sm text-white/30 py-4">No one is live right now</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {liveRooms.slice(0, 6).map((room, i) => (
                    <motion.div key={room.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.02 }}>
                      <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)] hover:border-[rgba(212,175,55,0.25)] transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback className="bg-gradient-to-br from-[#800020] to-[#d4af37] text-white font-bold">
                                  {room.title?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-[#0d0618]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white text-sm truncate">{room.title}</p>
                              <div className="flex items-center gap-2 text-[10px] text-white/40 mt-0.5">
                                <Users className="w-3 h-3" />{room.viewer_count || 0} watching
                              </div>
                            </div>
                          </div>
                          <Link to={createPageUrl('LiveRoom') + `?id=${room.id}`} className="mt-3 block">
                            <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5 h-8 text-xs">
                              <Radio className="w-3.5 h-3.5" /> Join Now
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming */}
            <div className="space-y-3">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00d4ff]" /> Upcoming Streams
              </h2>
              {scheduledRooms.slice(0, 4).map(room => (
                <div key={room.id} className="flex items-center gap-3 p-3 bg-white/3 border border-white/5 rounded-xl hover:bg-white/5 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-[#00d4ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{room.title}</p>
                    <p className="text-xs text-[#00d4ff]">{getCountdown(room.scheduled_start)}</p>
                  </div>
                  <Badge className="text-[9px] bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20 shrink-0">Upcoming</Badge>
                </div>
              ))}
            </div>

            {/* Recent VODs */}
            <div className="space-y-3">
              <h2 className="font-semibold text-white">Recent Videos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {recentVODs.slice(0, 6).map((vod, i) => (
                  <motion.div key={vod.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="group cursor-pointer">
                    <div className="relative bg-[#1a0a20] rounded-xl overflow-hidden aspect-video mb-2">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white/30 group-hover:text-white/60 transition-all" />
                      </div>
                      {vod.duration_seconds && (
                        <Badge className="absolute bottom-1.5 right-1.5 text-[9px] bg-black/80 text-white border-0">
                          {Math.floor(vod.duration_seconds / 60)}m
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-white/80 font-semibold line-clamp-1">{vod.title}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{vod.views || 0} views</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ACTIVITY */}
          <TabsContent value="activity" className="space-y-5 mt-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Subscriptions', value: mySubscriptions.length, icon: Star, color: '#a78bfa' },
                { label: 'Clips Created', value: myClips.length, icon: Scissors, color: '#a78bfa' },
                { label: 'Notifications', value: notifications.length, icon: Bell, color: '#d4af37' },
                { label: 'Following', value: liveRooms.length, icon: Heart, color: '#f472b6' },
              ].map(stat => (
                <Card key={stat.label} className="bg-[rgba(255,255,255,0.04)] border-white/5">
                  <CardContent className="p-4">
                    <p className="text-[10px] text-white/40 uppercase">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Subscriptions */}
            <Card className="bg-[rgba(255,255,255,0.04)] border-white/5">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-[#d4af37]">Active Subscriptions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {mySubscriptions.length === 0 ? <p className="text-sm text-white/30 text-center py-4">No active subscriptions</p> :
                  mySubscriptions.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-purple-900/40 flex items-center justify-center shrink-0">
                        <Star className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{s.community_id}</p>
                        <p className="text-[10px] text-white/40">Active</p>
                      </div>
                      <Badge className="text-[9px] bg-green-900/30 text-green-400 border-green-700/30">Active</Badge>
                    </div>
                  ))
                }
              </CardContent>
            </Card>

            {/* My Clips */}
            <Card className="bg-[rgba(255,255,255,0.04)] border-white/5">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-[#a78bfa]">My Clips</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {myClips.length === 0 ? <p className="text-sm text-white/30 text-center py-4">No clips yet — create one during a stream!</p> :
                  myClips.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl">
                      <div className="w-10 h-8 rounded-lg bg-[#a78bfa]/10 flex items-center justify-center shrink-0 text-sm">✂️</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{c.title}</p>
                        <p className="text-[10px] text-white/40">{c.duration_seconds}s · {c.view_count || 0} views</p>
                      </div>
                    </div>
                  ))
                }
              </CardContent>
            </Card>
          </TabsContent>

          {/* DISCOVER */}
          <TabsContent value="discover" className="space-y-5 mt-5">
            <div className="space-y-3">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#d4af37]" /> Trending Streams
              </h2>
              {liveRooms.slice(0, 8).map((room, i) => (
                <motion.div key={room.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={createPageUrl('LiveRoom') + `?id=${room.id}`}>
                    <div className="flex items-center gap-3 p-3 bg-white/3 border border-white/5 rounded-xl hover:border-[#d4af37]/20 hover:bg-white/5 transition-all">
                      <span className="text-[#d4af37]/40 font-mono text-sm w-5 text-center">{i + 1}</span>
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-[#800020] to-[#d4af37] text-white text-sm font-bold">
                          {room.title?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{room.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-white/40">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <Users className="w-3 h-3" />{room.viewer_count || 0}
                          {room.type && <span>· {room.type}</span>}
                        </div>
                      </div>
                      <Button size="sm" className="shrink-0 h-7 text-xs bg-[#800020]/50 hover:bg-[#800020] border border-[#800020]/60 text-white">
                        Watch
                      </Button>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* NOTIFICATIONS */}
          <TabsContent value="notifications" className="space-y-4 mt-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-1.5">
                {['all', 'live', 'tips', 'system'].map(f => (
                  <button key={f} onClick={() => setNotifFilter(f)}
                    className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-all ${
                      notifFilter === f ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]' : 'border-white/10 text-white/40 hover:border-white/20'
                    }`}>
                    {f === 'live' ? '🔴 Live' : f === 'tips' ? '💰 Tips' : f === 'system' ? '⚙️ System' : 'All'}
                  </button>
                ))}
              </div>
              {unreadCount > 0 && (
                <Button size="sm" variant="ghost" onClick={() => markAllRead.mutate()}
                  className="text-xs text-white/50 gap-1.5 h-7">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {filteredNotifs.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No notifications</p>
                </div>
              ) : filteredNotifs.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    !n.is_read ? 'bg-[#d4af37]/5 border-[#d4af37]/15' : 'bg-white/3 border-white/5'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                      n.type === 'tip' ? 'bg-[#d4af37]/20' : n.type === 'room_invite' ? 'bg-red-900/30' : 'bg-white/10'
                    }`}>
                      {n.type === 'tip' ? '💰' : n.type === 'room_invite' ? '🔴' : n.type === 'subscription' ? '⭐' : '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{n.title}</p>
                      <p className="text-xs text-white/50 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-white/20 mt-1">{new Date(n.created_date).toLocaleString()}</p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-[#d4af37] shrink-0 mt-2" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}