import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Radio, Bell, Users, Mail, Trophy, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addDays, isSameDay, isToday } from 'date-fns';
import { toast } from 'sonner';

export default function ContentCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [formData, setFormData] = useState({
    content_type: 'room',
    title: '',
    description: '',
    scheduled_for: new Date().toISOString(),
    recurrence: 'none',
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: scheduledContent = [] } = useQuery({
    queryKey: ['scheduled-content', user?.id],
    queryFn: () => base44.entities.ScheduledContent.filter(
      { creator_id: user?.id },
      'scheduled_for'
    ),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ScheduledContent.create({
      ...data,
      creator_id: user.id,
      status: 'scheduled',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-content'] });
      setCreateDialogOpen(false);
      setFormData({
        content_type: 'room',
        title: '',
        description: '',
        scheduled_for: new Date().toISOString(),
        recurrence: 'none',
      });
      toast.success('Content scheduled!');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ScheduledContent.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-content'] });
    },
  });

  const getFilteredContent = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = addDays(today, 7);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return scheduledContent.filter(item => {
      const itemDate = new Date(item.scheduled_for);
      
      switch (dateFilter) {
        case 'today':
          return isSameDay(itemDate, today);
        case 'week':
          return itemDate >= today && itemDate <= weekFromNow;
        case 'month':
          return itemDate >= monthStart && itemDate <= monthEnd;
        default:
          return true;
      }
    });
  };

  const filteredContent = getFilteredContent();

  const getContentIcon = (type) => {
    switch (type) {
      case 'room': return <Radio className="w-4 h-4" />;
      case 'event': return <Users className="w-4 h-4" />;
      case 'announcement': return <Bell className="w-4 h-4" />;
      case 'newsletter': return <Mail className="w-4 h-4" />;
      case 'challenge': return <Trophy className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'scheduled': return 'bg-blue-500';
      case 'published': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold">Content Calendar</h1>
            <p className="text-muted-foreground">Schedule and manage your content</p>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Content
        </Button>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-muted-foreground" />
        <Button
          variant={dateFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('all')}
        >
          All
        </Button>
        <Button
          variant={dateFilter === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('today')}
        >
          Today
        </Button>
        <Button
          variant={dateFilter === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('week')}
        >
          This Week
        </Button>
        <Button
          variant={dateFilter === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('month')}
        >
          This Month
        </Button>
      </div>

      {/* Content List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContent.map((item) => {
          const scheduledDate = new Date(item.scheduled_for);
          const isUpcoming = scheduledDate > new Date();
          
          return (
            <Card key={item.id} className={isToday(scheduledDate) ? 'border-purple-500 border-2' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getContentIcon(item.content_type)}
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      {item.content_type}
                    </span>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{format(scheduledDate, 'MMM d, yyyy')}</span>
                    <span>•</span>
                    <span>{format(scheduledDate, 'h:mm a')}</span>
                  </div>
                  {item.recurrence !== 'none' && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Repeats {item.recurrence}
                    </Badge>
                  )}
                </div>

                {item.status === 'scheduled' && isUpcoming && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'published' })}
                    >
                      Publish Now
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'cancelled' })}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredContent.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No content scheduled for this period</p>
            <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Your First Content
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Content Type</label>
              <Select 
                value={formData.content_type} 
                onValueChange={(value) => setFormData({ ...formData, content_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="room">Room</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="challenge">Challenge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Schedule For</label>
              <Input
                type="datetime-local"
                value={format(new Date(formData.scheduled_for), "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setFormData({ ...formData, scheduled_for: new Date(e.target.value).toISOString() })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Recurrence</label>
              <Select 
                value={formData.recurrence} 
                onValueChange={(value) => setFormData({ ...formData, recurrence: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={() => createMutation.mutate(formData)} 
              disabled={createMutation.isPending || !formData.title}
              className="w-full"
            >
              {createMutation.isPending ? 'Scheduling...' : 'Schedule Content'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}