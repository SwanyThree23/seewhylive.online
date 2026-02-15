import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AIModerationPage() {
  const queryClient = useQueryClient();

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
        action_taken: action
      });
    },
    onSuccess: () => {
      toast.success('Review submitted');
      queryClient.invalidateQueries(['moderations']);
    },
  });

  const flagged = moderations.filter(m => 
    m.violation_type !== 'safe' && !m.reviewed_by
  );
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
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8" />
          <h1 className="text-3xl font-bold">AI Moderation Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <p className="text-muted-foreground">All content reviewed!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {flagged.map((mod) => (
                  <Card key={mod.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={violationColors[mod.violation_type]}>
                              {mod.violation_type}
                            </Badge>
                            <Badge variant="outline">
                              {(mod.ai_confidence * 100).toFixed(0)}% confidence
                            </Badge>
                            <span className="text-xs text-muted-foreground capitalize">
                              {mod.content_type}
                            </span>
                          </div>
                          {mod.ai_explanation && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {mod.ai_explanation}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Detected: {new Date(mod.created_date).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reviewMutation.mutate({
                              id: mod.id,
                              decision: 'upheld',
                              action: 'hidden'
                            })}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Uphold
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reviewMutation.mutate({
                              id: mod.id,
                              decision: 'reversed',
                              action: 'none'
                            })}
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
            <div className="space-y-3">
              {reviewed.slice(0, 20).map((mod) => (
                <Card key={mod.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={violationColors[mod.violation_type]}>
                            {mod.violation_type}
                          </Badge>
                          <Badge variant={mod.override_decision === 'upheld' ? 'default' : 'secondary'}>
                            {mod.override_decision}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Reviewed: {new Date(mod.reviewed_at).toLocaleString()}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Violation Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      moderations.reduce((acc, m) => {
                        acc[m.violation_type] = (acc[m.violation_type] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="capitalize text-sm">{type}</span>
                        <Badge>{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Average Confidence</span>
                        <span className="font-semibold">
                          {(moderations.reduce((acc, m) => acc + (m.ai_confidence || 0), 0) / 
                            moderations.length * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Review Rate</span>
                        <span className="font-semibold">
                          {((reviewed.length / moderations.length) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}