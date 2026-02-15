import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Play, Edit, Trash2, Eye, Sparkles, Video } from 'lucide-react';
import { toast } from 'sonner';
import AIHighlightGenerator from './AIHighlightGenerator';

export default function RecordingManager({ userId }) {
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [highlightDialogOpen, setHighlightDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [],
    category: '',
    is_public: true,
  });
  const queryClient = useQueryClient();

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ['recordings', userId],
    queryFn: () => base44.entities.StreamRecording.filter(
      { creator_id: userId },
      '-recorded_at'
    ),
    enabled: !!userId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      // Upload video file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadFile });
      
      // Generate AI summary
      const aiResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a concise summary and 5 relevant keywords for a stream recording titled "${data.title}" with description: ${data.description}`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      return await base44.entities.StreamRecording.create({
        ...data,
        creator_id: userId,
        recording_url: file_url,
        recorded_at: new Date().toISOString(),
        ai_summary: aiResult.summary,
        ai_keywords: aiResult.keywords,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      setUploadDialogOpen(false);
      setUploadFile(null);
      setFormData({ title: '', description: '', tags: [], category: '', is_public: true });
      toast.success('Recording uploaded successfully!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StreamRecording.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      setEditDialogOpen(false);
      toast.success('Recording updated!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StreamRecording.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      toast.success('Recording deleted');
    },
  });

  const handleUpload = () => {
    if (!uploadFile || !formData.title) {
      toast.error('Please select a file and enter a title');
      return;
    }
    uploadMutation.mutate(formData);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Recording Library</h2>
          <p className="text-muted-foreground">
            {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Recording
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading recordings...</div>
      ) : recordings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No recordings yet</p>
            <Button className="mt-4" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Recording
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recordings.map((recording) => (
            <Card key={recording.id}>
              <CardContent className="p-4 space-y-3">
                {recording.thumbnail_url && (
                  <img 
                    src={recording.thumbnail_url} 
                    alt={recording.title}
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                )}
                
                <div>
                  <h3 className="font-semibold line-clamp-1">{recording.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {recording.description}
                  </p>
                </div>

                {recording.ai_summary && (
                  <div className="bg-purple-50 p-2 rounded text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      <span className="font-semibold text-purple-700">AI Summary</span>
                    </div>
                    <p className="text-purple-600 line-clamp-2">{recording.ai_summary}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {recording.ai_keywords?.slice(0, 3).map(keyword => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {recording.views || 0}
                  </div>
                  {recording.duration_seconds && (
                    <span>{formatDuration(recording.duration_seconds)}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Play className="w-3 h-3 mr-1" />
                    Play
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedRecording(recording);
                      setHighlightDialogOpen(true);
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedRecording(recording);
                      setFormData(recording);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => deleteMutation.mutate(recording.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Recording</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Video File</label>
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => setUploadFile(e.target.files[0])}
              />
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
            <Button 
              onClick={handleUpload} 
              disabled={uploadMutation.isPending}
              className="w-full"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload & Generate AI Summary'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Highlight Generator Dialog */}
      <Dialog open={highlightDialogOpen} onOpenChange={setHighlightDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Generate Highlights</DialogTitle>
          </DialogHeader>
          {selectedRecording && (
            <AIHighlightGenerator recording={selectedRecording} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}