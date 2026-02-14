import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Video, Mic, CalendarIcon, Plus, X, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

export default function CreateRoomPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video',
    status: 'live',
    is_public: true,
    max_participants: 50,
    scheduled_start: null,
    tags: [],
    recording_enabled: false,
    community_id: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: communities = [] } = useQuery({
    queryKey: ['myCommunities'],
    queryFn: async () => {
      if (!user) return [];
      const memberships = await base44.entities.CommunityMember.filter({ user_id: user.id });
      const communityIds = memberships.map(m => m.community_id);
      if (communityIds.length === 0) return [];
      const communities = await base44.entities.Community.list();
      return communities.filter(c => communityIds.includes(c.id));
    },
    enabled: !!user,
  });

  const createRoomMutation = useMutation({
    mutationFn: async (roomData) => {
      const room = await base44.entities.Room.create({
        ...roomData,
        host_id: user.id,
        started_at: roomData.status === 'live' ? new Date().toISOString() : null,
        viewer_count: 0,
      });

      // Create default main stage
      await base44.entities.Stage.create({
        room_id: room.id,
        name: 'Main Stage',
        description: 'Primary streaming stage',
        type: 'main',
        layout: 'grid',
        is_active: true,
        max_speakers: 12,
        allow_audience_requests: true,
        order: 0,
      });

      return room;
    },
    onSuccess: (room) => {
      toast.success('Room created successfully!');
      window.location.href = createPageUrl(`Room?id=${room.id}`);
    },
    onError: (error) => {
      toast.error('Failed to create room: ' + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error('Please enter a room title');
      return;
    }

    createRoomMutation.mutate(formData);
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumbnail(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, thumbnail_url: file_url }));
      toast.success('Thumbnail uploaded!');
    } catch (error) {
      toast.error('Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create a New Room</h1>
          <p className="text-muted-foreground text-lg">
            Set up your live audio/video streaming room
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Room Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter room title..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What's this room about?"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 h-24"
                />
              </div>

              <div>
                <Label htmlFor="thumbnail">Thumbnail Image</Label>
                <div className="mt-1">
                  {formData.thumbnail_url ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden">
                      <img 
                        src={formData.thumbnail_url} 
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        {uploadingThumbnail ? 'Uploading...' : 'Click to upload thumbnail'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        disabled={uploadingThumbnail}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add tags..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Room Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Room Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger id="type" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audio">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4" />
                          Audio Only
                        </div>
                      </SelectItem>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Video
                        </div>
                      </SelectItem>
                      <SelectItem value="hybrid">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          <Mic className="w-4 h-4" />
                          Hybrid (Audio & Video)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Start</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger id="status" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">Start Now (Go Live)</SelectItem>
                      <SelectItem value="scheduled">Schedule for Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.status === 'scheduled' && (
                  <div className="md:col-span-2">
                    <Label>Scheduled Start Time</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full mt-1 justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.scheduled_start ? (
                            format(new Date(formData.scheduled_start), 'PPP p')
                          ) : (
                            <span>Pick a date and time</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.scheduled_start ? new Date(formData.scheduled_start) : undefined}
                          onSelect={(date) => setFormData(prev => ({ ...prev, scheduled_start: date?.toISOString() }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <div>
                  <Label htmlFor="max_participants">Max Participants on Stage</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.max_participants}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                    className="mt-1"
                  />
                </div>

                {communities.length > 0 && (
                  <div>
                    <Label htmlFor="community">Community (Optional)</Label>
                    <Select
                      value={formData.community_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, community_id: value }))}
                    >
                      <SelectTrigger id="community" className="mt-1">
                        <SelectValue placeholder="Select community..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>None</SelectItem>
                        {communities.map(community => (
                          <SelectItem key={community.id} value={community.id}>
                            {community.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_public">Public Room</Label>
                    <p className="text-sm text-muted-foreground">
                      Anyone can discover and join
                    </p>
                  </div>
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="recording">Enable Recording</Label>
                    <p className="text-sm text-muted-foreground">
                      Save this session for later
                    </p>
                  </div>
                  <Switch
                    id="recording"
                    checked={formData.recording_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, recording_enabled: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createRoomMutation.isPending}
            >
              {createRoomMutation.isPending ? 'Creating...' : 
               formData.status === 'live' ? 'Create & Go Live' : 'Schedule Room'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}