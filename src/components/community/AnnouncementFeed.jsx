import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Pin, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AnnouncementFeed({ communityId }) {
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements', communityId],
    queryFn: () => base44.entities.Announcement.filter(
      { community_id: communityId, status: 'sent' },
      '-sent_at'
    ),
  });

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const priorityIcons = {
    urgent: <AlertCircle className="w-4 h-4" />,
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading announcements...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((announcement) => (
        <Card
          key={announcement.id}
          className={`${
            announcement.is_pinned ? 'border-purple-200 bg-purple-50/50' : ''
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                announcement.priority === 'urgent' ? 'bg-red-100' : 'bg-purple-100'
              }`}>
                {announcement.is_pinned ? (
                  <Pin className="w-5 h-5 text-purple-600" />
                ) : (
                  <Megaphone className={`w-5 h-5 ${
                    announcement.priority === 'urgent' ? 'text-red-600' : 'text-purple-600'
                  }`} />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{announcement.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(announcement.sent_at), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <Badge className={priorityColors[announcement.priority]}>
                    {priorityIcons[announcement.priority]}
                    {announcement.priority}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {announcement.content}
                </p>

                {announcement.target_audience !== 'all' && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      Target: {announcement.target_audience.replace('_', ' ')}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {announcements.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No announcements yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}