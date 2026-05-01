import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Radio, Eye, Activity,
  MessageSquare, Star, Crown, Zap
} from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl flex items-center gap-2">
          <Icon className={`w-6 h-6 ${color}`} />
          {value}
        </CardTitle>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardHeader>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['analyticsRooms', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id }),
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['analyticsTransactions', user?.id],
    queryFn: () => base44.entities.Transaction.filter({ to_user_id: user?.id }, '-created_date', 100),
    enabled: !!user,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['analyticsSubscriptions', user?.id],
    queryFn: () => base44.entities.Subscription.filter({ creator_id: user?.id }),
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['analyticsMessages'],
    queryFn: () => base44.entities.Message.list('-created_date', 200),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['analyticsAllUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
    enabled: user?.role === 'admin',
  });

  // ── Derived Metrics ──────────────────────────────────────────────────────
  const totalViews = rooms.reduce((s, r) => s + (r.viewer_count || 0), 0);
  const totalRevenue = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  const avgViewers = rooms.length > 0 ? (totalViews / rooms.length).toFixed(0) : 0;
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const liveRooms = rooms.filter(r => r.status === 'live').length;

  // ── Room status distribution for pie ────────────────────────────────────
  const statusGroups = rooms.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const statusPieData = Object.entries(statusGroups).map(([name, value]) => ({ name, value }));

  // ── Revenue by month ─────────────────────────────────────────────────────
  const revenueByMonth = transactions.reduce((acc, t) => {
    const month = new Date(t.created_date).toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + (t.amount || 0);
    return acc;
  }, {});
  const revenueChartData = Object.entries(revenueByMonth).slice(-6).map(([month, revenue]) => ({ month, revenue }));

  // ── Rooms by category ────────────────────────────────────────────────────
  const categoryGroups = rooms.reduce((acc, r) => {
    const cat = r.tags?.[0] || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(categoryGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // ── Top rooms by viewership ──────────────────────────────────────────────
  const topRooms = [...rooms]
    .sort((a, b) => (b.viewer_count || 0) - (a.viewer_count || 0))
    .slice(0, 8)
    .map(r => ({ name: r.title.slice(0, 20), viewers: r.viewer_count || 0 }));

  // ── User growth (admin) ──────────────────────────────────────────────────
  const userGrowth = allUsers.reduce((acc, u) => {
    const month = new Date(u.created_date).toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  const userGrowthData = Object.entries(userGrowth).slice(-6).map(([month, count]) => ({ month, count }));

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Platform performance and creator insights</p>
          </div>
          {isAdmin && <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 ml-auto">Admin View</Badge>}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Views" value={totalViews} icon={Eye} color="text-blue-600" />
          <StatCard label="Avg Viewers" value={avgViewers} icon={Users} color="text-purple-600" />
          <StatCard label="Revenue" value={`$${totalRevenue.toFixed(0)}`} icon={DollarSign} color="text-green-600" />
          <StatCard label="Rooms" value={rooms.length} icon={Radio} color="text-orange-600" />
          <StatCard label="Live Now" value={liveRooms} icon={Zap} color="text-red-600" sub="currently live" />
          <StatCard label="Subscribers" value={activeSubscriptions} icon={Star} color="text-amber-600" sub="active" />
        </div>

        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            {isAdmin && <TabsTrigger value="platform">Platform</TabsTrigger>}
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Over Time</CardTitle>
                  <CardDescription>Monthly earnings from tips & subscriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueChartData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No revenue data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                        <Tooltip formatter={v => [`$${v.toFixed(2)}`, 'Revenue']} />
                        <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest {Math.min(transactions.length, 8)} payments received</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No transactions yet</div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {transactions.slice(0, 12).map(t => (
                        <div key={t.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{t.sender_name || 'Anonymous'}</p>
                            <p className="text-xs text-muted-foreground">{new Date(t.created_date).toLocaleDateString()}</p>
                          </div>
                          <span className="text-sm font-bold text-green-700">+${(t.amount || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Subscription breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {['active', 'cancelled', 'expired'].map(status => {
                    const count = subscriptions.filter(s => s.status === status).length;
                    const revenue = subscriptions.filter(s => s.status === status).reduce((s, sub) => s + (sub.price || 0), 0);
                    const colors = { active: 'text-green-700 bg-green-50', cancelled: 'text-red-700 bg-red-50', expired: 'text-slate-600 bg-slate-50' };
                    return (
                      <div key={status} className={`rounded-xl p-4 ${colors[status]}`}>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-sm capitalize font-medium">{status}</p>
                        <p className="text-xs mt-1">${revenue.toFixed(0)}/mo</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Rooms by Viewers</CardTitle>
                </CardHeader>
                <CardContent>
                  {topRooms.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No rooms yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={topRooms} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                        <Tooltip />
                        <Bar dataKey="viewers" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Room Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusPieData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={statusPieData} dataKey="value" nameKey="name" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {statusPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent rooms list */}
            <Card>
              <CardHeader><CardTitle>All Rooms</CardTitle></CardHeader>
              <CardContent>
                {rooms.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No rooms yet</div>
                ) : (
                  <div className="space-y-2">
                    {rooms.slice(0, 15).map(room => (
                      <div key={room.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{room.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(room.created_date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-sm font-medium">{room.viewer_count || 0} views</span>
                          <Badge
                            className={
                              room.status === 'live' ? 'bg-red-100 text-red-700 border-red-200' :
                              room.status === 'ended' ? 'bg-slate-100 text-slate-600' :
                              'bg-blue-100 text-blue-700'
                            }
                          >
                            {room.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Chat Activity</CardTitle>
                  <CardDescription>Recent {messages.length} messages across all rooms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm">Total Messages</span>
                      <span className="font-bold">{messages.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm">Unique Chatters</span>
                      <span className="font-bold">{new Set(messages.map(m => m.user_id)).size}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm">Avg Message Length</span>
                      <span className="font-bold">
                        {messages.length > 0 ? Math.round(messages.reduce((s, m) => s + (m.content?.length || 0), 0) / messages.length) : 0} chars
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                  <CardDescription>Rooms by category</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Platform Tab — admin only */}
          {isAdmin && (
            <TabsContent value="platform" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New registrations per month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userGrowthData.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={userGrowthData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Platform Totals</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { label: 'Total Users', value: allUsers.length, icon: Users },
                        { label: 'Admin Users', value: allUsers.filter(u => u.role === 'admin').length, icon: Crown },
                        { label: 'Total Rooms', value: rooms.length, icon: Radio },
                        { label: 'Total Messages', value: messages.length, icon: MessageSquare },
                        { label: 'Total Transactions', value: transactions.length, icon: DollarSign },
                        { label: 'Platform Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: TrendingUp },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            {label}
                          </div>
                          <span className="font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}