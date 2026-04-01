import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, Zap, RefreshCw, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function AIModerationPage() {
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const { data: moderations = [] } = useQuery({
    queryKey: ['moderations'],
    queryFn: () => base44.entities.ContentModeration.list('-created_date', 100),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, decision, action }) => {
      return await base44.entities.ContentModeration.update(id, {
        reviewed_by: 'admin',
        reviewed_at: new Date().toISOString(),
        override_decision: decision,
        action_taken: action,
      });
    },
    onSuccess: () => {
      toast.success('Review submitted');
      queryClient.invalidateQueries(['moderations']);
    },
  });

  const handleAIScan = async () => {
    setIsScanning(true);
    setScanProgress(10);
    try {
      // Fetch recent messages
      const messages = await base44.entities.Message.list('-created_date', 50);
      setScanProgress(30);

      if (messages.length === 0) {
        toast.info('No messages to scan yet.');
        setIsScanning(false);
        setScanProgress(0);
        return;
      }

      // Get already-scanned content IDs to avoid duplicates
      const scannedIds = new Set(moderations.map(m => m.content_id));
      const unscanned = messages.filter(m => !scannedIds.has(m.id));

      if (unscanned.length === 0) {
        toast.info('All recent messages have already been scanned.');
        setIsScanning(false);
        setScanProgress(0);
        return;
      }

      setScanProgress(50);

      // Run AI scan on unscanned messages
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a content moderation AI. Analyze the following chat messages and classify each one.
For each message, return a JSON object with:
- "id": the message id
- "violation_type": one of "spam", "harassment", "hate_speech", "inappropriate", "safe"
- "ai_confidence": a number between 0 and 1 representing confidence
- "ai_explanation": a brief explanation (one sentence, only if not safe)

Messages to analyze:
${unscanned.map(m => `ID: ${m.id} | User: ${m.user_name} | Message: "${m.content}"`).join('\n')}

Return ONLY a JSON object with a "results" array.`,
        response_json_schema: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  violation_type: { type: 'string' },
                  ai_confidence: { type: 'number' },
                  ai_explanation: { type: 'string' },
                },
              },
            },
          },
        },
      });

      setScanProgress(80);

      // Save results to ContentModeration entity
      const scanResults = result?.results || [];
      const violations = scanResults.filter(r => r.violation_type !== 'safe');

      await Promise.all(
        scanResults.map(r =>
          base44.entities.ContentModeration.create({
            content_type: 'message',
            content_id: r.id,
            violation_type: r.violation_type,
            ai_confidence: r.ai_confidence,
            ai_explanation: r.ai_explanation || null,
            action_taken: r.violation_type !== 'safe' ? 'flagged' : 'none',
          })
        )
      );

      setScanProgress(100);
      toast.success(`Scanned ${scanResults.length} messages — ${violations.length} violation(s) found.`);
      queryClient.invalidateQueries(['moderations']);
    } catch (err) {
      toast.error('AI scan failed. Please try again.');
      console.error(err);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const flagged = moderations.filter(m => m.violation_type !== 'safe' && !m.reviewed_by);
  const reviewed = moderations.filter(m => m.reviewed_by);

  const stats = {
    total: moderations.length,
    pending: flagged.length,
    safe: moderations.filter(m => m.violation_type === 'safe').length,
    violations: moderations.filter(m => m.violation_type !== 'safe').length,
  };

  const violationColors = {
    spam: 'bg-yellow-100 text-yellow-800',
    harassment: 'bg-orange-100 text-orange-800',
    hate_speech: 'bg-red-100 text-red-800',
    inappropriate: 'bg-pink-100 text-pink-800',
    safe: 'bg-green-100 text-green-800',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">AI Moderation Dashboard</h1>
              <p className="text-sm text-muted-foreground">Scan chat messages for policy violations using AI</p>
            </div>
          </div>
          <Button
            onClick={handleAIScan}
            disabled={isScanning}
            className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isScanning ? 'Scanning...' : 'Run AI Scan'}
          </Button>
        </div>

        {/* Scan Progress */}
        {isScanning && (
          <Card>
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="w-4 h-4 animate-pulse" />
                Fetching messages and analyzing content with AI...
              </div>
              <Progress value={scanProgress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Scanned</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Review</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                {stats.pending}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Safe Content</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                {stats.safe}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Violations</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-600" />
                {stats.violations}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Review ({flagged.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed">
              Reviewed ({reviewed.length})
            </TabsTrigger>
            <TabsTrigger value="insights">
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {flagged.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                  <p className="text-lg font-semibold mb-1">All clear!</p>
                  <p className="text-muted-foreground text-sm">
                    {stats.total === 0
                      ? 'No content scanned yet. Click "Run AI Scan" to begin.'
                      : 'All flagged content has been reviewed.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {flagged.map((mod) => (
                  <Card key={mod.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={violationColors[mod.violation_type]}>
                              {mod.violation_type?.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline">
                              {((mod.ai_confidence || 0) * 100).toFixed(0)}% confidence
                            </Badge>
                            <span className="text-xs text-muted-foreground capitalize bg-slate-100 px-2 py-0.5 rounded">
                              {mod.content_type}
                            </span>
                          </div>
                          {mod.ai_explanation && (
                            <p className="text-sm text-muted-foreground mb-2 italic">
                              "{mod.ai_explanation}"
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Detected: {new Date(mod.created_date).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => reviewMutation.mutate({ id: mod.id, decision: 'upheld', action: 'hidden' })}
                            disabled={reviewMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Uphold
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 border-red-300 hover:bg-red-50"
                            onClick={() => reviewMutation.mutate({ id: mod.id, decision: 'reversed', action: 'none' })}
                            disabled={reviewMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reverse
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviewed">
            {reviewed.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No reviewed items yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reviewed.slice(0, 30).map((mod) => (
                  <Card key={mod.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={violationColors[mod.violation_type]}>
                            {mod.violation_type?.replace('_', ' ')}
                          </Badge>
                          <Badge variant={mod.override_decision === 'upheld' ? 'default' : 'secondary'}>
                            {mod.override_decision}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(mod.reviewed_at).toLocaleString()}
                          </span>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Violation Distribution</CardTitle>
                  <CardDescription>Breakdown of detected content types</CardDescription>
                </CardHeader>
                <CardContent>
                  {moderations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data yet. Run a scan first.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(
                        moderations.reduce((acc, m) => {
                          acc[m.violation_type] = (acc[m.violation_type] || 0) + 1;
                          return acc;
                        }, {})
                      ).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                        <div key={type} className="flex items-center gap-3">
                          <span className="capitalize text-sm w-28">{type.replace('_', ' ')}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                              style={{ width: `${(count / moderations.length) * 100}%` }}
                            />
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Performance</CardTitle>
                  <CardDescription>Scan accuracy and review metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  {moderations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data yet. Run a scan first.</p>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Average Confidence</span>
                          <span className="font-semibold">
                            {(moderations.reduce((acc, m) => acc + (m.ai_confidence || 0), 0) / moderations.length * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={moderations.reduce((acc, m) => acc + (m.ai_confidence || 0), 0) / moderations.length * 100}
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Review Rate</span>
                          <span className="font-semibold">
                            {stats.violations > 0
                              ? ((reviewed.length / stats.violations) * 100).toFixed(0)
                              : 0}%
                          </span>
                        </div>
                        <Progress
                          value={stats.violations > 0 ? (reviewed.length / stats.violations) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Violation Rate</span>
                          <span className="font-semibold">
                            {((stats.violations / stats.total) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={(stats.violations / stats.total) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}