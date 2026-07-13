import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Play, Edit, Trash2, Eye, Sparkles, Video, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AIHighlightGenerator from './AIHighlightGenerator';

export default function RecordingManager({ userId }) {
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [batchUploadDialogOpen, setBatchUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [highlightDialogOpen, setHighlightDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [batchFiles, setBatchFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [],
    category: '',
    is_public: true,
  });
  const queryClient = useQueryClient();

  const categories = ['all', 'gaming', 'music', 'tech', 'education', 'entertainment', 'other'];

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
    onSuccess: (recording) => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      setUploadDialogOpen(false);
      setUploadFile(null);
      setFormData({ title: '', description: '', tags: [], category: '', is_public: true });
      toast.success('Recording uploaded successfully!');
      if (userId) {
        base44.entities.Activity.create({
          user_id: userId,
          type: 'clip_created',
          title: `Uploaded recording: ${recording?.title || 'New Recording'}`,
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Action failed.'),
  });

  const batchUploadMutation = useMutation({
    mutationFn: async (files) => {
      const results = [];
      for (const file of files) {
        try {
          // Upload file
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          
          // Auto-generate metadata
          const fileName = file.name.replace(/\.[^/.]+$/, '');
          const aiResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Based on the filename "${fileName}", generate a title, description, category, and 3-5 keywords for this stream recording.`,
            response_json_schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
                keywords: { type: 'array', items: { type: 'string' } }
              }
            }
          });

          const recording = await base44.entities.StreamRecording.create({
            creator_id: userId,
            title: aiResult.title,
            description: aiResult.description,
            category: aiResult.category,
            recording_url: file_url,
            recorded_at: new Date().toISOString(),
            ai_summary: aiResult.description,
            ai_keywords: aiResult.keywords,
            is_public: true,
          });
          
          results.push({ success: true, recording });
        } catch (error) {
          results.push({ success: false, error: error.message, fileName: file.name });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      setBatchUploadDialogOpen(false);
      setBatchFiles([]);

      if (failed === 0) {
        toast.success(`Successfully uploaded ${successful} recordings!`);
      } else {
        toast.warning(`Uploaded ${successful} recordings, ${failed} failed`);
      }
      if (successful > 0 && userId) {
        base44.entities.Activity.create({
          user_id: userId,
          type: 'clip_created',
          title: `Batch uploaded ${successful} recording${successful !== 1 ? 's' : ''}`,
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Action failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StreamRecording.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      setEditDialogOpen(false);
      toast.success('Recording updated!');
    },
    onError: () => toast.error('Action failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StreamRecording.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      toast.success('Recording deleted');
    },
    onError: () => toast.error('Action failed.'),
  });

  const handleUpload = () => {
    if (!uploadFile || !formData.title) {
      toast.error('Please select a file and enter a title');
      return;
    }
    uploadMutation.mutate(formData);
  };

  const handleBatchUpload = () => {
    if (batchFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }
    batchUploadMutation.mutate(batchFiles);
  };

  const filteredRecordings = selectedCategory === 'all' 
    ? recordings 
    : recordings.filter(r => r.category === selectedCategory);

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBatchUploadDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Batch Upload
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Recording
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="capitalize"
          >
            {cat}
          </Button>
        ))}
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
          {filteredRecordings.map((recording) => (
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
                  <div className="bg-[#D4854A]/10 p-2 rounded text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <Sparkles className="w-3 h-3 text-[#D4854A]" />
                      <span className="font-semibold text-[#D4854A]">AI Summary</span>
                    </div>
                    <p className="text-[#D4854A] line-clamp-2">{recording.ai_summary}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {recording.category && (
                    <Badge variant="default" className="text-xs capitalize">
                      {recording.category}
                    </Badge>
                  )}
                  {recording.ai_keywords?.slice(0, 2).map(keyword => (
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
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                className="w-full border rounded-md p-2"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>
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

      {/* Batch Upload Dialog */}
      <Dialog open={batchUploadDialogOpen} onOpenChange={setBatchUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batch Upload Recordings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Multiple Videos</label>
              <Input
                type="file"
                accept="video/*"
                multiple
                onChange={(e) => setBatchFiles(Array.from(e.target.files))}
              />
              {batchFiles.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {batchFiles.length} file{batchFiles.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
            <div className="bg-[#D4AF37]/5 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37] mt-0.5" />
                <div className="text-sm text-[#D4AF37]">
                  <p className="font-medium">AI-Powered Upload</p>
                  <p>Files will be automatically analyzed to generate titles, descriptions, categories, and keywords.</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleBatchUpload} 
              disabled={batchUploadMutation.isPending}
              className="w-full"
            >
              {batchUploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading {batchFiles.length} files...
                </>
              ) : (
                <>Upload {batchFiles.length} Recording{batchFiles.length !== 1 ? 's' : ''}</>
              )}
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
