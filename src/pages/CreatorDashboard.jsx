import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Video, Calendar, TrendingUp, DollarSign, Users, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import RecordingManager from '../components/content/RecordingManager';

export default function CreatorDashboardPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myRooms = [] } = useQuery({
    queryKey: ['my-rooms', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id }, '-created_date'),
    enabled: !!user,
  });

  const { data: recordings = [] } = useQuery({
    queryKey: ['recordings', user?.id],
    queryFn: () => base44.entities.StreamRecording.filter({ creator_id: user?.id }),
    enabled: !!user,
  });

  const { data: scheduledContent = [] } = useQuery({
    queryKey: ['scheduled-content', user?.id],
    queryFn: () => base44.entities.ScheduledContent.filter(
      { creator_id: user?.id, status: 'scheduled' }
    ),
    enabled: !!user,
  });

  const liveRooms = myRooms.filter(r => r.status === 'live');
  const totalViews = recordings.reduce((sum, r) => sum + (r.views || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-8 h-8 text-purple-500" />
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your content and grow your audience</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Live Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              <span className="text-3xl font-bold">{liveRooms.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-3xl font-bold">{myRooms.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recordings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-500" />
              <span className="text-3xl font-bold">{recordings.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-3xl font-bold">{totalViews}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to={createPageUrl('CreateRoom')}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Radio className="w-12 h-12 mx-auto mb-3 text-purple-500" />
              <h3 className="font-semibold mb-2">Start Live Room</h3>
              <p className="text-sm text-muted-foreground">
                Go live and connect with your audience
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('ContentCalendar')}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-blue-500" />
              <h3 className="font-semibold mb-2">Content Calendar</h3>
              <p className="text-sm text-muted-foreground">
                Schedule rooms and events
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('Monetization')}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <h3 className="font-semibold mb-2">Monetization</h3>
              <p className="text-sm text-muted-foreground">
                Manage subscriptions and earnings
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recordings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recordings">
            <Video className="w-4 h-4 mr-2" />
            Recordings
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            <Calendar className="w-4 h-4 mr-2" />
            Upcoming ({scheduledContent.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recordings">
          <RecordingManager userId={user?.id} />
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Scheduled Content</CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledContent.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No upcoming content scheduled</p>
                  <Link to={createPageUrl('ContentCalendar')}>
                    <Button>Schedule Content</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledContent.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.scheduled_for).toLocaleString()}
                        </p>
                      </div>
                      <Link to={createPageUrl('ContentCalendar')}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}