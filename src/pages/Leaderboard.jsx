import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, TrendingUp, Star, Zap, DollarSign, Users, Trophy, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const RANK_COLORS = ['from-yellow-400 to-amber-500', 'from-slate-300 to-slate-400', 'from-amber-600 to-orange-700'];
const RANK_ICONS = ['🥇', '🥈', '🥉'];

function RankRow({ rank, user, stat, statLabel, isCurrentUser }) {
  const top3 = rank <= 3;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCurrentUser ? 'bg-primary/5 border border-primary/20' : 'hover:bg-slate-50'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
        top3 ? `bg-gradient-to-br ${RANK_COLORS[rank - 1]} text-white` : 'bg-slate-100 text-slate-600'
      }`}>
        {top3 ? RANK_ICONS[rank - 1] : rank}
      </div>
      <Avatar className="w-9 h-9 shrink-0">
        <AvatarImage src={user.avatar_url} />
        <AvatarFallback className="text-sm bg-gradient-to-br from-purple-400 to-pink-400 text-white">
          {user.full_name?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate flex items-center gap-1">
          {user.full_name || 'Anonymous'}
          {isCurrentUser && <Badge className="text-[9px] py-0 px-1 ml-1">You</Badge>}
        </p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-sm">{typeof stat === 'number' && stat >= 1000 ? `${(stat / 1000).toFixed(1)}k` : stat}</p>
        <p className="text-[10px] text-muted-foreground">{statLabel}</p>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: creators = [] } = useQuery({
    queryKey: ['leaderboardCreators'],
    queryFn: () => base44.entities.CreatorProfile.list('-subscriber_count', 50),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['leaderboardRooms'],
    queryFn: () => base44.entities.Room.list('-viewer_count', 50),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['leaderboardTransactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 500),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['leaderboardUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
  });

  // Revenue leaderboard: aggregate by creator
  const revenueByCreator = transactions.reduce((acc, t) => {
    if (!t.to_user_id) return acc;
    acc[t.to_user_id] = (acc[t.to_user_id] || 0) + (t.amount || 0);
    return acc;
  }, {});

  const topEarners = Object.entries(revenueByCreator)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([userId, revenue]) => {
      const user = allUsers.find(u => u.id === userId);
      return { user: user || { full_name: 'Creator', email: '', id: userId }, revenue };
    })
    .filter(e => e.user);

  const topByViewers = [...rooms]
    .sort((a, b) => (b.viewer_count || 0) - (a.viewer_count || 0))
    .slice(0, 20)
    .map(room => {
      const user = allUsers.find(u => u.id === room.host_id);
      return { user: user || { full_name: room.host_id || 'Creator', email: '', id: room.host_id }, viewers: room.viewer_count || 0, room };
    })
    .filter(e => e.user);

  const topBySubscribers = creators.slice(0, 20).map(profile => {
    const user = allUsers.find(u => u.id === profile.user_id);
    return { user: user || { full_name: profile.display_name, email: '', id: profile.user_id }, subscribers: profile.subscriber_count || 0 };
  }).filter(e => e.user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">Top creators and streamers on SeeWhy LIVE</p>
        </div>

        <Tabs defaultValue="earnings">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="earnings" className="gap-1.5">
              <DollarSign className="w-4 h-4" /> Top Earners
            </TabsTrigger>
            <TabsTrigger value="viewers" className="gap-1.5">
              <Users className="w-4 h-4" /> Most Viewed
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="gap-1.5">
              <Star className="w-4 h-4" /> Subscribers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  Top Earning Creators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {topEarners.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No earnings data yet</p>
                ) : (
                  topEarners.map((entry, i) => (
                    <RankRow
                      key={entry.user.id}
                      rank={i + 1}
                      user={entry.user}
                      stat={`$${entry.revenue.toFixed(0)}`}
                      statLabel="earned"
                      isCurrentUser={entry.user.id === currentUser?.id}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="viewers" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Radio className="w-4 h-4 text-red-600" />
                  Most Viewed Streams
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {topByViewers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No stream data yet</p>
                ) : (
                  topByViewers.map((entry, i) => (
                    <RankRow
                      key={`${entry.user.id}-${i}`}
                      rank={i + 1}
                      user={entry.user}
                      stat={entry.viewers}
                      statLabel="viewers"
                      isCurrentUser={entry.user.id === currentUser?.id}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscribers" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Most Subscribed Creators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {topBySubscribers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No subscriber data yet</p>
                ) : (
                  topBySubscribers.map((entry, i) => (
                    <RankRow
                      key={entry.user.id}
                      rank={i + 1}
                      user={entry.user}
                      stat={entry.subscribers}
                      statLabel="subscribers"
                      isCurrentUser={entry.user.id === currentUser?.id}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}