import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Send, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AnnouncementPanel({ communityId, userId }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [targetAudience, setTargetAudience] = useState('all');
  const queryClient = useQueryClient();

  const createAnnouncementMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.Announcement.create({
        community_id: communityId,
        title,
        content,
        created_by: userId,
        priority,
        target_audience: targetAudience,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      setTitle('');
      setContent('');
      setPriority('normal');
      setTargetAudience('all');
      toast.success('Announcement sent successfully!');
    },
  });

  const scheduleAnnouncementMutation = useMutation({
    mutationFn: async (scheduledTime) => {
      return await base44.entities.Announcement.create({
        community_id: communityId,
        title,
        content,
        created_by: userId,
        priority,
        target_audience: targetAudience,
        status: 'scheduled',
        scheduled_for: scheduledTime,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      setTitle('');
      setContent('');
      toast.success('Announcement scheduled!');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-purple-600" />
          Create Announcement
        </CardTitle>
        <CardDescription>
          Send targeted messages to your community members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            placeholder="Announcement title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Message</label>
          <Textarea
            placeholder="Write your announcement here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
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

          {/* Target Audience */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Target</label>
            <Select value={targetAudience} onValueChange={setTargetAudience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="admins">Admins Only</SelectItem>
                <SelectItem value="moderators">Moderators</SelectItem>
                <SelectItem value="subscribers">Subscribers</SelectItem>
                <SelectItem value="new_members">New Members</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview */}
        {(title || content) && (
          <div className="bg-slate-50 rounded-lg p-4 border">
            <Badge className="mb-2">{priority.toUpperCase()}</Badge>
            <h4 className="font-semibold mb-1">{title || 'Untitled'}</h4>
            <p className="text-sm text-muted-foreground">{content || 'No content'}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => createAnnouncementMutation.mutate()}
            disabled={!title || !content}
            className="flex-1"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Now
          </Button>
          <Button
            variant="outline"
            disabled={!title || !content}
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              scheduleAnnouncementMutation.mutate(tomorrow.toISOString());
            }}
          >
            <Clock className="w-4 h-4 mr-2" />
            Schedule
          </Button>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 text-sm">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-blue-900">
            <p className="font-medium mb-1">Targeting: {targetAudience.replace('_', ' ')}</p>
            <p className="text-xs text-blue-700">
              This will notify members via in-app notifications
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}