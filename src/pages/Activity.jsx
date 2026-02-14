import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Activity as ActivityIcon, Radio, Users, Trophy, Gift, Award } from 'lucide-react';
import { format } from 'date-fns';

const activityIcons = {
  room_created: Radio,
  room_joined: Radio,
  community_joined: Users,
  subscription: Users,
  tip_sent: Gift,
  challenge_completed: Trophy,
  badge_earned: Award,
};

export default function ActivityPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-created_date', 100),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-6">
          <ActivityIcon className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Activity Feed</h1>
        </div>

        {activities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ActivityIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No activity yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type] || ActivityIcon;
              return (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{activity.user_id.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold">{activity.title}</h3>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.created_date), 'PPp')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}