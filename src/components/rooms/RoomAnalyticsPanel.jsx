import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, MessageSquare, TrendingUp, Eye, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RoomAnalyticsPanel({ roomId }) {
  const { data: analytics = [] } = useQuery({
    queryKey: ['room-analytics', roomId],
    queryFn: () => base44.entities.RoomAnalytics.filter(
      { room_id: roomId },
      '-timestamp',
      20
    ),
    enabled: !!roomId,
  });

  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const rooms = await base44.entities.Room.filter({ id: roomId });
      return rooms[0];
    },
    enabled: !!roomId,
  });

  const latest = analytics[0] || {};
  const chartData = analytics.slice(0, 10).reverse();

  const stats = [
    {
      label: 'Current Viewers',
      value: room?.viewer_count || 0,
      icon: Users,
      color: 'text-[#D4AF37]',
    },
    {
      label: 'Peak Viewers',
      value: latest.peak_viewers || 0,
      icon: TrendingUp,
      color: 'text-[#6DBF7E]',
    },
    {
      label: 'Total Viewers',
      value: latest.total_viewers || 0,
      icon: Eye,
      color: 'text-[#D4854A]',
    },
    {
      label: 'Avg Watch Time',
      value: `${Math.round(latest.average_watch_time || 0)}m`,
      icon: Clock,
      color: 'text-orange-500',
    },
    {
      label: 'Chat Messages',
      value: latest.chat_messages || 0,
      icon: MessageSquare,
      color: 'text-[#C0392B]',
    },
    {
      label: 'Tips Received',
      value: `$${latest.tips_received || 0}`,
      icon: DollarSign,
      color: 'text-[#6DBF7E]',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {latest.engagement_rate > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Engagement Rate</CardTitle>
              <Badge className="bg-[#6DBF7E]">
                {Math.round(latest.engagement_rate)}%
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Viewer Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="viewer_count" stroke="#D4AF37" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}