import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Calendar, Send, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AnnouncementScheduler({ communityId, userId }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [targetAudience, setTargetAudience] = useState('all');
  const [isPinned, setIsPinned] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const queryClient = useQueryClient();

  const { data: announcements = [] } = useQuery({
    queryKey: ['communityAnnouncements', communityId],
    queryFn: () => base44.entities.Announcement.filter({ community_id: communityId }, '-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: async (announcementData) => {
      return await base44.entities.Announcement.create(announcementData);
    },
    onSuccess: () => {
      toast.success('Announcement created!');
      queryClient.invalidateQueries(['communityAnnouncements']);
      resetForm();
    },
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPriority('normal');
    setTargetAudience('all');
    setIsPinned(false);
    setScheduleDate('');
    setScheduleTime('');
  };

  const handleSubmit = (sendNow = false) => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    let scheduledFor = null;
    let status = 'draft';

    if (sendNow) {
      status = 'sent';
    } else if (scheduleDate && scheduleTime) {
      scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      status = 'scheduled';
    }

    createMutation.mutate({
      community_id: communityId,
      title: title.trim(),
      content: content.trim(),
      priority,
      target_audience: targetAudience,
      is_pinned: isPinned,
      scheduled_for: scheduledFor,
      sent_at: sendNow ? new Date().toISOString() : null,
      status,
      created_by: userId,
    });
  };

  const draftAnnouncements = announcements.filter(a => a.status === 'draft');
  const scheduledAnnouncements = announcements.filter(a => a.status === 'scheduled');
  const sentAnnouncements = announcements.filter(a => a.status === 'sent');

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Create Form */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Create Announcement
            </CardTitle>
            <CardDescription>Communicate with your community members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Content *</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What do you want to announce?"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Target Audience</label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="admins">Admins</SelectItem>
                    <SelectItem value="moderators">Moderators</SelectItem>
                    <SelectItem value="subscribers">Subscribers</SelectItem>
                    <SelectItem value="new_members">New Members</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <label className="text-sm font-medium">Pin to Top</label>
              <Switch checked={isPinned} onCheckedChange={setIsPinned} />
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-medium mb-2 block">Schedule (Optional)</label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => handleSubmit(true)} className="flex-1">
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </Button>
              <Button onClick={() => handleSubmit(false)} variant="outline" className="flex-1">
                <Clock className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <div className="space-y-6">
        {/* Scheduled */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Scheduled ({scheduledAnnouncements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduledAnnouncements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No scheduled announcements</p>
            ) : (
              <div className="space-y-3">
                {scheduledAnnouncements.map((ann) => (
                  <div key={ann.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium">{ann.title}</p>
                      <Badge className={priorityColors[ann.priority]}>{ann.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Scheduled: {ann.scheduled_for ? format(new Date(ann.scheduled_for), 'PPp') : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sent */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Sent ({sentAnnouncements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {sentAnnouncements.slice(0, 5).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No sent announcements</p>
            ) : (
              <div className="space-y-3">
                {sentAnnouncements.slice(0, 5).map((ann) => (
                  <div key={ann.id} className="border rounded-lg p-3 opacity-75">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium">{ann.title}</p>
                      <Badge variant="outline">sent</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sent: {ann.sent_at ? format(new Date(ann.sent_at), 'PPp') : 'N/A'}
                    </p>
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