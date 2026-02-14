import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, TrendingUp, Users, DollarSign, Radio, Eye } from 'lucide-react';

export default function AnalyticsPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['userRooms', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id }),
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['creatorTransactions', user?.id],
    queryFn: () => base44.entities.Transaction.filter({ to_user_id: user?.id }),
    enabled: !!user,
  });

  const totalViews = rooms.reduce((sum, r) => sum + (r.viewer_count || 0), 0);
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const avgViewers = rooms.length > 0 ? (totalViews / rooms.length).toFixed(0) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-3">
          <BarChart className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Views</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Eye className="w-6 h-6 text-blue-600" />
                {totalViews}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Viewers</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                {avgViewers}
              </CardTitle>
            </CardHeader>
          </Card>

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
              <CardDescription>Rooms Created</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Radio className="w-6 h-6 text-orange-600" />
                {rooms.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Rooms</CardTitle>
            <CardDescription>Your streaming history</CardDescription>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Radio className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No rooms created yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.slice(0, 10).map(room => (
                  <div key={room.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">{room.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">{room.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{room.viewer_count || 0} views</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}