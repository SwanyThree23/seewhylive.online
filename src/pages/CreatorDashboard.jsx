import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video, Calendar, TrendingUp, DollarSign, Users, Radio,
  Zap, Scissors, Star, Clock, Flame, Target, BarChart2, Monitor, Library
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import RecordingManager from '../components/content/RecordingManager';
import VideoLibrary from '../components/vod/VideoLibrary';
import OBSBridge from '../components/obs/OBSBridge';
import { toast } from 'sonner';
import { Link as RouterLink } from 'react-router-dom';

function StreamStreakBadge({ days }) {
  if (days === 0) return null;
  return (
    <div className="flex items-center gap-1.5 bg-orange-900/20 border border-orange-700/30 rounded-full px-3 py-1">
      <Flame className="w-4 h-4 text-orange-400" />
      <span className="text-sm font-bold text-orange-400">{days} day streak!</span>
    </div>
  );
}

function CountdownTimer({ dateStr }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(dateStr) - new Date();
      if (diff <= 0) { setTime('Starting now!'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [dateStr]);
  return <span className="text-[#00d4ff] font-mono text-xs">{time}</span>;
}

export default function CreatorDashboardPage() {
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: myRooms = [] } = useQuery({
    queryKey: ['my-rooms', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id }, '-created_date', 20),
    enabled: !!user,
  });
  const { data: recordings = [] } = useQuery({
    queryKey: ['recordings', user?.id],
    queryFn: () => base44.entities.StreamRecording.filter({ creator_id: user?.id }, '-recorded_at', 10),
    enabled: !!user,
  });
  const { data: scheduledStreams = [] } = useQuery({
    queryKey: ['scheduled-streams-dash', user?.id],
    queryFn: () => base44.entities.ScheduledStream.filter({ creator_id: user?.id, status: 'scheduled' }, 'scheduled_start', 5),
    enabled: !!user,
  });
  const { data: myClips = [] } = useQuery({
    queryKey: ['creator-clips', user?.id],
    queryFn: () => base44.entities.StreamClip.filter({ creator_id: user?.id }, '-view_count', 5),
    enabled: !!user,
  });
  const { data: loyaltyRewards = [] } = useQuery({
    queryKey: ['creator-loyalty', user?.id],
    queryFn: () => base44.entities.LoyaltyReward.filter({ creator_id: user?.id }),
    enabled: !!user,
  });
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['loyalty-lb-dash', user?.id],
    queryFn: () => base44.entities.ViewerPoints.filter({ creator_id: user?.id }, '-points', 3),
    enabled: !!user,
  });

  const { data: pastStreamRecordings = [] } = useQuery({
    queryKey: ['past-recordings', user?.id],
    queryFn: () => base44.entities.Recording.filter({ host_id: user?.id }, '-created_date', 20),
    enabled: !!user,
  });

  const { data: activeSubscriptions = [] } = useQuery({
    queryKey: ['creator-active-subs', user?.id],
    queryFn: () => base44.entities.Subscription.filter({ creator_id: user?.id, status: 'active' }),
    enabled: !!user,
  });

  const quickLaunchMutation = useMutation({
    mutationFn: async () => {
      const room = await base44.entities.Room.create({
        title: `${user?.full_name || 'Creator'}'s Live Stream`,
        type: 'video', host_id: user?.id, status: 'live',
        started_at: new Date().toISOString(), is_public: true,
      });
      return room;
    },
    onSuccess: (room) => {
      window.location.href = createPageUrl('LiveRoom') + `?id=${room.id}`;
      toast.success('Room created! Going live...');
    },
  });

  const liveRooms = myRooms.filter(r => r.status === 'live');
  const recentRooms = myRooms.filter(r => r.status === 'ended').slice(0, 3);
  const totalViews = recordings.reduce((s, r) => s + (r.views || 0), 0);
  const monthlyRevenue = activeSubscriptions.reduce((sum, s) => sum + (s.price || 0), 0);
  const streamStreak = 3; // Simulated streak

  return (
    <div className="min-h-screen bg-[#0d0618] text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#d4af37]">Creator Dashboard</h1>
              <p className="text-sm text-white/50">Your broadcast command center</p>
            </div>
            <StreamStreakBadge days={streamStreak} />
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => quickLaunchMutation.mutate()}
              disabled={quickLaunchMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2 px-6 py-3 h-auto shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            >
              <Radio className="w-5 h-5" />
              {quickLaunchMutation.isPending ? 'Launching...' : '🚀 Go Live Now'}
            </Button>
          </motion.div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Live Rooms', value: liveRooms.length, color: '#ef4444', icon: Radio },
            { label: 'Total Rooms', value: myRooms.length, color: '#00d4ff', icon: Users },
            { label: 'Recordings', value: recordings.length, color: '#d4af37', icon: Video },
            { label: 'Total Views', value: totalViews.toLocaleString(), color: '#22c55e', icon: TrendingUp },
            { label: 'Subscribers', value: activeSubscriptions.length, color: '#a78bfa', icon: Star },
          { label: 'Monthly Rev.', value: `$${monthlyRevenue.toFixed(0)}`, color: '#22c55e', icon: DollarSign },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)] hover:border-[rgba(212,175,55,0.2)] transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                      <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Schedule Stream', icon: Calendar, href: 'StreamScheduler', color: '#00d4ff' },
            { label: 'Stream Analytics', icon: BarChart2, href: 'StreamAnalytics', color: '#d4af37' },
            { label: 'Memberships', icon: DollarSign, href: 'CreatorSubscriptions', color: '#f59e0b' },
            { label: 'Multi-Stream', icon: Radio, href: 'MultiStreamManager', color: '#f97316' },
          ].map(action => (
            <Link key={action.label} to={createPageUrl(action.href)}>
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.08)] hover:border-[rgba(212,175,55,0.2)] cursor-pointer transition-all h-24">
                  <CardContent className="p-4 flex flex-col items-center justify-center gap-2 h-full">
                    <action.icon className="w-7 h-7" style={{ color: action.color }} />
                    <p className="text-xs font-semibold text-white/70 text-center">{action.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scheduled Streams Widget */}
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)]">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-[#d4af37] flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Upcoming Streams
                </CardTitle>
                <Link to={createPageUrl('StreamScheduler')}>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] text-white/40">View all →</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {scheduledStreams.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-white/30 mb-2">No streams scheduled</p>
                  <Link to={createPageUrl('StreamScheduler')}>
                    <Button size="sm" className="bg-[#d4af37] text-black font-bold text-xs h-7">Schedule One</Button>
                  </Link>
                </div>
              ) : scheduledStreams.slice(0, 3).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-2 bg-white/3 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{s.title}</p>
                    <CountdownTimer dateStr={s.scheduled_start} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Clip Spotlight */}
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm text-[#a78bfa] flex items-center gap-2">
                <Scissors className="w-4 h-4" /> Clip Spotlight
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {myClips.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-4">No clips yet — create one during a stream!</p>
              ) : myClips.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-center gap-2 p-2 bg-white/3 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/10 flex items-center justify-center text-sm shrink-0">✂️</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{c.title}</p>
                    <p className="text-[10px] text-white/40">{c.view_count || 0} views · {c.duration_seconds}s</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Loyalty Snapshot */}
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)]">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-[#fbbf24] flex items-center gap-2">
                  <Star className="w-4 h-4" /> Loyalty Program
                </CardTitle>
                <Link to={createPageUrl('LoyaltyProgram')}>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] text-white/40">Manage →</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1">
                  <p className="text-[10px] text-white/40">Total Rewards</p>
                  <p className="text-xl font-bold text-[#fbbf24]">{loyaltyRewards.length}</p>
                </div>
              </div>
              <p className="text-[10px] text-white/30 uppercase mb-2">Top 3 Viewers</p>
              {leaderboard.length === 0 ? (
                <p className="text-xs text-white/20">No viewers yet</p>
              ) : leaderboard.slice(0, 3).map((l, i) => (
                <div key={l.id} className="flex items-center gap-2 text-xs">
                  <span className="text-white/30 w-4">{['🥇','🥈','🥉'][i]}</span>
                  <span className="text-white/60 flex-1 truncate">{l.user_id?.slice(0, 10)}</span>
                  <span className="font-bold text-[#fbbf24]">{(l.points || 0).toLocaleString()}pts</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Streams */}
        {recentRooms.length > 0 && (
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(212,175,55,0.1)]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm text-[#d4af37]">Recent Streams</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recentRooms.map(r => (
                  <div key={r.id} className="p-3 bg-white/3 border border-white/5 rounded-xl">
                    <p className="text-sm font-semibold text-white truncate mb-1">{r.title}</p>
                    <div className="flex items-center gap-3 text-[10px] text-white/40">
                      <span><Users className="w-3 h-3 inline mr-1" />{r.viewer_count || 0}</span>
                      <span>{r.ended_at ? new Date(r.ended_at).toLocaleDateString() : ''}</span>
                    </div>
                    <Link to={createPageUrl('StreamAnalytics') + `?id=${r.id}`}>
                      <Button size="sm" variant="ghost" className="mt-2 h-6 text-[10px] text-[#d4af37] p-0">
                        View Stats →
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main content tabs */}
        <Tabs defaultValue="past-streams">
          <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="past-streams" className="text-white/50 data-[state=active]:text-[#d4af37] data-[state=active]:bg-[#d4af37]/10">
              <Video className="w-4 h-4 mr-2" /> Past Streams
            </TabsTrigger>
            <TabsTrigger value="recordings" className="text-white/50 data-[state=active]:text-[#d4af37] data-[state=active]:bg-[#d4af37]/10">
              <Video className="w-4 h-4 mr-2" /> Recordings
            </TabsTrigger>
            <TabsTrigger value="video-library" className="text-white/50 data-[state=active]:text-[#d4af37] data-[state=active]:bg-[#d4af37]/10">
              <Library className="w-4 h-4 mr-2" /> VOD Library
            </TabsTrigger>
            <TabsTrigger value="obs" className="text-white/50 data-[state=active]:text-[#00d4ff] data-[state=active]:bg-[#00d4ff]/10">
              <Monitor className="w-4 h-4 mr-2" /> OBS Bridge
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-white/50 data-[state=active]:text-[#d4af37] data-[state=active]:bg-[#d4af37]/10">
              <Calendar className="w-4 h-4 mr-2" /> Scheduled ({scheduledStreams.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="past-streams" className="mt-4">
            {pastStreamRecordings.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 mx-auto mb-4 text-white/20" />
                <p className="text-white/40 mb-2">No recordings yet</p>
                <p className="text-xs text-white/20">Hit "Record" during a live stream to save it here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastStreamRecordings.map(rec => {
                  const mins = Math.floor((rec.duration_seconds || 0) / 60);
                  const secs = (rec.duration_seconds || 0) % 60;
                  return (
                    <div key={rec.id} className="bg-[rgba(255,255,255,0.04)] border border-[rgba(212,175,55,0.1)] rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 flex items-center justify-center shrink-0">
                          <Video className="w-5 h-5 text-[#d4af37]" />
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          rec.status === 'ready' ? 'text-green-400 border-green-800' :
                          rec.status === 'recording' ? 'text-red-400 border-red-800 animate-pulse' :
                          'text-white/40 border-white/10'
                        }`}>{rec.status}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white truncate">{rec.title}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          {new Date(rec.started_at || rec.created_date).toLocaleDateString()} ·{' '}
                          {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} ·{' '}
                          {rec.viewer_count || 0} viewers
                        </p>
                      </div>
                      {rec.stream_url && (
                        <a href={rec.stream_url} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] text-[#d4af37] p-0 hover:bg-transparent">
                            View Stream →
                          </Button>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
          <TabsContent value="recordings" className="mt-4">
            <RecordingManager userId={user?.id} />
          </TabsContent>
          <TabsContent value="video-library" className="mt-4">
            <VideoLibrary creatorId={user?.id} />
          </TabsContent>
          <TabsContent value="obs" className="mt-4">
            <div className="max-w-lg">
              <OBSBridge />
            </div>
          </TabsContent>
          <TabsContent value="upcoming" className="mt-4">
            {scheduledStreams.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-white/20" />
                <p className="text-white/40 mb-4">No upcoming streams scheduled</p>
                <Link to={createPageUrl('StreamScheduler')}>
                  <Button className="bg-[#d4af37] text-black font-bold hover:bg-[#f5e6a3]">Open Stream Scheduler</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledStreams.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-xl">
                    <div>
                      <p className="font-semibold text-white">{s.title}</p>
                      <p className="text-sm text-white/50">{new Date(s.scheduled_start).toLocaleString()}</p>
                    </div>
                    <Link to={createPageUrl('StreamScheduler')}>
                      <Button variant="outline" size="sm" className="border-[#d4af37]/30 text-[#d4af37]">Edit</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}