import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Play, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function AIHighlightGenerator({ recording }) {
  const [generating, setGenerating] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const queryClient = useQueryClient();

  const createHighlightMutation = useMutation({
    mutationFn: (highlightData) => base44.entities.StreamHighlight.create(highlightData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights'] });
    },
  });

  const generateHighlights = async () => {
    setGenerating(true);
    try {
      const prompt = `Analyze this stream recording and suggest 3-5 key highlights based on engagement potential:

Title: ${recording.title}
Description: ${recording.description}
Duration: ${Math.floor(recording.duration_seconds / 60)} minutes
Category: ${recording.category || 'general'}
AI Keywords: ${recording.ai_keywords?.join(', ') || 'none'}
Tags: ${recording.tags?.join(', ') || 'none'}
Views: ${recording.views || 0}

Consider these factors for highlight selection:
- Moments likely to drive high engagement (shares, comments)
- Peak entertainment or educational value
- Moments that work well as standalone clips
- Viral potential and social media friendliness

Generate highlight segments with:
- title: catchy, shareable title (under 60 chars)
- description: compelling description that drives clicks
- start_time: approximate start time in seconds (distribute across video)
- duration: optimal length for highlight (20-90 seconds)
- highlight_type: one of [peak_moment, funny, educational, interactive, custom]
- confidence: score 0-1 for engagement potential
- engagement_score: predicted engagement rating 0-100`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            highlights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  start_time: { type: 'number' },
                  duration: { type: 'number' },
                  highlight_type: { type: 'string' },
                  confidence: { type: 'number' },
                  engagement_score: { type: 'number' }
                }
              }
            }
          }
        }
      });

      setHighlights(result.highlights || []);
      toast.success(`Generated ${result.highlights?.length || 0} highlights!`);
    } catch (error) {
      toast.error('Failed to generate highlights');
    } finally {
      setGenerating(false);
    }
  };

  const saveHighlight = async (highlight) => {
    await createHighlightMutation.mutateAsync({
      recording_id: recording.id,
      title: highlight.title,
      description: highlight.description,
      start_time: highlight.start_time,
      end_time: highlight.start_time + highlight.duration,
      highlight_type: highlight.highlight_type,
      ai_generated: true,
      ai_confidence: highlight.confidence,
      thumbnail_url: recording.thumbnail_url,
    });
    toast.success('Highlight saved!');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI Highlight Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {highlights.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Let AI analyze your stream and find the best moments
            </p>
            <Button onClick={generateHighlights} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Highlights
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {highlights.map((highlight, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{highlight.title}</h3>
                    <p className="text-sm text-muted-foreground">{highlight.description}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {highlight.highlight_type.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(highlight.start_time)} - {formatTime(highlight.start_time + highlight.duration)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(highlight.confidence * 100)}% AI confidence
                  </Badge>
                  {highlight.engagement_score && (
                    <Badge className="bg-green-500 text-xs">
                      {Math.round(highlight.engagement_score)} engagement
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Play className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => saveHighlight(highlight)}
                    disabled={createHighlightMutation.isPending}
                  >
                    Save Highlight
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={generateHighlights} className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}