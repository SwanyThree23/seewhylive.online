import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Sparkles, Calendar, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function NewsletterPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [generating, setGenerating] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: communities = [] } = useQuery({
    queryKey: ['userCommunities', user?.id],
    queryFn: async () => {
      const memberships = await base44.entities.CommunityMember.filter({ 
        user_id: user?.id,
        role: { $in: ['owner', 'admin'] }
      });
      const communityIds = memberships.map(m => m.community_id);
      if (communityIds.length === 0) return [];
      return await base44.entities.Community.filter({ id: { $in: communityIds } });
    },
    enabled: !!user,
  });

  const [selectedCommunity, setSelectedCommunity] = useState('');

  const { data: newsletters = [] } = useQuery({
    queryKey: ['newsletters', selectedCommunity],
    queryFn: () => base44.entities.Newsletter.filter({ community_id: selectedCommunity }, '-created_date'),
    enabled: !!selectedCommunity,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Newsletter.create(data);
    },
    onSuccess: () => {
      toast.success('Newsletter created!');
      queryClient.invalidateQueries(['newsletters']);
      setTitle('');
      setContent('');
      setPreviewText('');
    },
  });

  const generateWithAI = async () => {
    if (!selectedCommunity) {
      toast.error('Please select a community first');
      return;
    }

    setGenerating(true);
    try {
      const rooms = await base44.entities.Room.filter({ 
        community_id: selectedCommunity,
        status: 'ended'
      }, '-ended_at', 5);

      const prompt = `Create an engaging newsletter for a streaming community. Include:
1. A catchy subject line
2. Summary of recent live streams (${rooms.length} streams)
3. Community highlights
4. Call-to-action to join upcoming streams

Keep it professional, engaging, and under 500 words.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            preview: { type: 'string' },
            content: { type: 'string' }
          }
        }
      });

      setTitle(result.subject);
      setPreviewText(result.preview);
      setContent(result.content);
      toast.success('Newsletter generated!');
    } catch (error) {
      toast.error('Failed to generate newsletter');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!selectedCommunity) {
      toast.error('Please select a community');
      return;
    }
    if (!title || !content) {
      toast.error('Title and content are required');
      return;
    }

    createMutation.mutate({
      community_id: selectedCommunity,
      title,
      content,
      preview_text: previewText,
      status: 'draft',
      source_type: generating ? 'ai_generated' : 'manual'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Newsletter Manager</h1>
          </div>
          <Button onClick={generateWithAI} disabled={generating || !selectedCommunity}>
            <Sparkles className="w-4 h-4 mr-2" />
            {generating ? 'Generating...' : 'AI Generate'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Newsletter</CardTitle>
                <CardDescription>Engage your community with email updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Community</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={selectedCommunity}
                    onChange={(e) => setSelectedCommunity(e.target.value)}
                  >
                    <option value="">Select community...</option>
                    {communities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Subject Line</label>
                  <Input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Your weekly community update..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Preview Text</label>
                  <Input 
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="What subscribers see before opening..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <ReactQuill 
                    value={content}
                    onChange={setContent}
                    className="bg-white"
                    style={{ height: '300px', marginBottom: '50px' }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={createMutation.isPending}>
                    <Send className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Sent</span>
                  <span className="font-semibold">{newsletters.filter(n => n.status === 'sent').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Drafts</span>
                  <span className="font-semibold">{newsletters.filter(n => n.status === 'draft').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Open Rate</span>
                  <span className="font-semibold">
                    {newsletters.length > 0 
                      ? (newsletters.reduce((acc, n) => acc + (n.open_rate || 0), 0) / newsletters.length).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Newsletters</CardTitle>
              </CardHeader>
              <CardContent>
                {newsletters.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No newsletters yet</p>
                ) : (
                  <div className="space-y-2">
                    {newsletters.slice(0, 5).map(newsletter => (
                      <div key={newsletter.id} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{newsletter.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(newsletter.created_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={newsletter.status === 'sent' ? 'default' : 'secondary'}>
                            {newsletter.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}