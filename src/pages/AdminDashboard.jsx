import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Radio, DollarSign, MessageSquare, Shield, TrendingUp,
  Activity, Crown, Ban, AlertTriangle, CheckCircle, RefreshCw,
  Search, BarChart2, Database, Zap, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function StatCard({ label, value, icon: Icon, color, badge, sub }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        {badge && <Badge className="mt-2 text-[10px]">{badge}</Badge>}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [userSearch, setUserSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
    enabled: user?.role === 'admin',
  });

  const { data: allRooms = [] } = useQuery({
    queryKey: ['adminRooms'],
    queryFn: () => base44.entities.Room.list('-created_date', 100),
    enabled: user?.role === 'admin',
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['adminTransactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 200),
    enabled: user?.role === 'admin',
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['adminReports'],
    queryFn: () => base44.entities.Report.list('-created_date', 50),
    enabled: user?.role === 'admin',
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['adminMessages'],
    queryFn: () => base44.entities.Message.list('-created_date', 500),
    enabled: user?.role === 'admin',
  });

  const { data: communities = [] } = useQuery({
    queryKey: ['adminCommunities'],
    queryFn: () => base44.entities.Community.list('-member_count', 50),
    enabled: user?.role === 'admin',
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      return base44.entities.User.update(userId, { role });
    },
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries(['adminUsers']);
    },
  });

  const endRoomMutation = useMutation({
    mutationFn: (roomId) => base44.entities.Room.update(roomId, { status: 'ended', ended_at: new Date().toISOString() }),
    onSuccess: () => {
      toast.success('Room ended');
      qc.invalidateQueries(['adminRooms']);
    },
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // Metrics
  const totalRevenue = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  const liveRooms = allRooms.filter(r => r.status === 'live');
  const pendingReports = reports.filter(r => r.status === 'pending');
  const todayUsers = allUsers.filter(u => {
    const d = new Date(u.created_date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  // User growth data
  const userGrowth = allUsers.reduce((acc, u) => {
    const month = new Date(u.created_date).toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  const userGrowthData = Object.entries(userGrowth).slice(-8).map(([month, count]) => ({ month, count }));

  // Revenue data
  const revenueData = transactions.reduce((acc, t) => {
    const month = new Date(t.created_date).toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + (t.amount || 0);
    return acc;
  }, {});
  const revenueChartData = Object.entries(revenueData).slice(-8).map(([month, revenue]) => ({ month, revenue }));

  const filteredUsers = allUsers.filter(u =>
    !userSearch || u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredRooms = roomFilter === 'all' ? allRooms :
    allRooms.filter(r => r.status === roomFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Platform management & oversight</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries()} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Users" value={allUsers.length} icon={Users} color="bg-blue-500" sub={`+${todayUsers.length} today`} />
          <StatCard label="Live Rooms" value={liveRooms.length} icon={Radio} color="bg-red-500" badge={liveRooms.length > 0 ? 'LIVE' : undefined} />
          <StatCard label="Total Rooms" value={allRooms.length} icon={Globe} color="bg-purple-500" />
          <StatCard label="Revenue" value={`$${totalRevenue.toFixed(0)}`} icon={DollarSign} color="bg-green-500" />
          <StatCard label="Messages" value={messages.length} icon={MessageSquare} color="bg-amber-500" />
          <StatCard label="Open Reports" value={pendingReports.length} icon={AlertTriangle} color={pendingReports.length > 0 ? "bg-red-500" : "bg-slate-400"} />
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users ({allUsers.length})</TabsTrigger>
            <TabsTrigger value="rooms">Rooms ({allRooms.length})</TabsTrigger>
            <TabsTrigger value="reports">Reports ({pendingReports.length})</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  {userGrowthData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Platform Health</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Active Users (30d)', value: allUsers.length, Ico: Users, ok: true },
                      { label: 'Communities', value: communities.length, Ico: Globe, ok: true },
                      { label: 'Live Streams', value: liveRooms.length, Ico: Radio, ok: true },
                      { label: 'Pending Reports', value: pendingReports.length, Ico: AlertTriangle, ok: pendingReports.length === 0 },
                      { label: 'Total Transactions', value: transactions.length, Ico: DollarSign, ok: true },
                    ].map(({ label, value, Ico, ok }) => (
                      <div key={label} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-2 text-sm">
                          <Ico className="w-4 h-4 text-muted-foreground" />
                          {label}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{value}</span>
                          {ok ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent activity */}
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Transactions</CardTitle></CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No transactions yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {transactions.slice(0, 15).map(t => (
                      <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                        <div>
                          <p className="font-medium">{t.sender_name || 'Anonymous'} → {t.recipient_name || 'Creator'}</p>
                          <p className="text-xs text-muted-foreground">{t.type} · {format(new Date(t.created_date), 'MMM d, h:mm a')}</p>
                        </div>
                        <span className="font-bold text-green-700">+${(t.amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users" className="space-y-4 mt-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Badge variant="outline">{filteredUsers.length} users</Badge>
            </div>

            <Card>
              <CardContent className="p-0">
                {loadingUsers ? (
                  <div className="text-center py-12 text-muted-foreground">Loading users...</div>
                ) : (
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {filteredUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {u.full_name?.charAt(0) || u.email?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.full_name || 'No name'}</p>
                            <p className="text-xs text-muted-foreground">{u.email} · Joined {format(new Date(u.created_date), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                          {u.id !== user?.id && (
                            <Select
                              value={u.role}
                              onValueChange={(role) => changeRoleMutation.mutate({ userId: u.id, role })}
                            >
                              <SelectTrigger className="h-7 text-xs w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">user</SelectItem>
                                <SelectItem value="admin">admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rooms */}
          <TabsContent value="rooms" className="space-y-4 mt-6">
            <div className="flex items-center gap-3">
              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline">{filteredRooms.length} rooms</Badge>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {filteredRooms.map(room => (
                    <div key={room.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                      <div>
                        <p className="font-medium text-sm">{room.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.type} · {room.viewer_count || 0} viewers · {format(new Date(room.created_date), 'MMM d')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          room.status === 'live' ? 'bg-red-100 text-red-700' :
                          room.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }>
                          {room.status}
                        </Badge>
                        {room.status === 'live' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() => endRoomMutation.mutate(room.id)}
                          >
                            End
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="space-y-4 mt-6">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No reports to review</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reports.map(report => (
                  <Card key={report.id} className={report.status === 'pending' ? 'border-orange-200' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={report.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>
                              {report.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{report.report_type}</Badge>
                          </div>
                          <p className="text-sm">{report.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(report.created_date), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        {report.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={async () => {
                              await base44.entities.Report.update(report.id, { status: 'resolved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() });
                              qc.invalidateQueries(['adminReports']);
                              toast.success('Report resolved');
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Revenue */}
          <TabsContent value="revenue" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Monthly Revenue</CardTitle></CardHeader>
                <CardContent>
                  {revenueChartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">No revenue data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                        <Tooltip formatter={v => [`$${Number(v).toFixed(2)}`, 'Revenue']} />
                        <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Revenue Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-4 bg-green-50 rounded-xl text-center">
                      <p className="text-3xl font-bold text-green-700">${totalRevenue.toFixed(2)}</p>
                      <p className="text-sm text-green-600">Total Platform Revenue</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg text-center">
                        <p className="text-xl font-bold">{transactions.length}</p>
                        <p className="text-xs text-muted-foreground">Transactions</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg text-center">
                        <p className="text-xl font-bold">
                          ${transactions.length > 0 ? (totalRevenue / transactions.length).toFixed(2) : '0.00'}
                        </p>
                        <p className="text-xs text-muted-foreground">Avg Transaction</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}