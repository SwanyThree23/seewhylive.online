import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, DollarSign, Radio, Zap, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdvancedAnalyticsPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['performanceMetrics'],
    queryFn: () => base44.entities.PerformanceMetric.list('-timestamp', 1000),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['allRooms'],
    queryFn: () => base44.entities.Room.list('-created_date', 100),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['allTransactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 500),
  });

  // Calculate KPIs
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const activeRooms = rooms.filter(r => r.status === 'live').length;
  const totalViewers = rooms.reduce((sum, r) => sum + (r.viewer_count || 0), 0);
  
  // Engagement trend data
  const engagementData = metrics
    .filter(m => m.metric_type === 'user_engagement')
    .slice(0, 30)
    .reverse()
    .map(m => ({
      date: new Date(m.timestamp).toLocaleDateString(),
      value: m.value
    }));

  // Revenue trend
  const revenueData = transactions
    .reduce((acc, t) => {
      const date = new Date(t.created_date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + t.amount;
      return acc;
    }, {});
  
  const revenueChartData = Object.entries(revenueData)
    .slice(-14)
    .map(([date, amount]) => ({ date, amount }));

  // Room performance
  const roomPerformance = rooms
    .filter(r => r.viewer_count > 0)
    .slice(0, 10)
    .map(r => ({
      title: r.title.substring(0, 20),
      viewers: r.viewer_count
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                ${totalRevenue.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Live Rooms</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Radio className="w-6 h-6 text-red-600" />
                {activeRooms}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Viewers</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                {totalViewers}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg. Engagement</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-600" />
                {metrics.length > 0 ? (metrics.reduce((a, m) => a + m.value, 0) / metrics.length).toFixed(1) : 0}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="performance">Room Performance</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>Last 14 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Trend</CardTitle>
                <CardDescription>Daily engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Rooms</CardTitle>
                <CardDescription>By viewer count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={roomPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="viewers" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Growth Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-medium text-sm text-blue-900">Optimize Stream Times</p>
                      <p className="text-xs text-blue-700">Peak viewership at 7-9 PM</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-medium text-sm text-green-900">Increase Monetization</p>
                      <p className="text-xs text-green-700">15% conversion rate on tips</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="font-medium text-sm text-purple-900">Community Engagement</p>
                      <p className="text-xs text-purple-700">Chat activity up 23%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>System Performance</span>
                        <span className="font-semibold text-green-600">Excellent</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>User Satisfaction</span>
                        <span className="font-semibold text-blue-600">High</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Content Quality</span>
                        <span className="font-semibold text-purple-600">Good</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '82%' }}></div>
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