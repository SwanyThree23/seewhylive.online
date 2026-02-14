import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Shield, Flag, AlertCircle, CheckCircle, Clock, User, Ban, Mic } from 'lucide-react';
import { format } from 'date-fns';

export default function ModerationDashboard() {
  const [selectedTab, setSelectedTab] = useState('reports');
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list('-created_date'),
  });

  const { data: actions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ['moderationActions'],
    queryFn: () => base44.entities.ModerationAction.list('-created_date'),
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, data }) => {
      return await base44.entities.Report.update(reportId, data);
    },
    onSuccess: () => {
      toast.success('Report updated');
      queryClient.invalidateQueries(['reports']);
      setSelectedReport(null);
      setResolutionNotes('');
      setActionTaken('');
    },
  });

  const handleResolveReport = (report, status) => {
    updateReportMutation.mutate({
      reportId: report.id,
      data: {
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        resolution_notes: resolutionNotes || null,
        action_taken: actionTaken || null,
      },
    });
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-800',
  };

  const actionIcons = {
    mute: Mic,
    kick: User,
    ban: Ban,
    warning: AlertCircle,
  };

  const pendingReports = reports.filter(r => r.status === 'pending' || r.status === 'under_review');
  const resolvedReports = reports.filter(r => r.status === 'resolved' || r.status === 'dismissed');
  const activeActions = actions.filter(a => a.is_active);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
          <p className="text-muted-foreground">Manage reports and moderation actions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Reports</CardDescription>
            <CardTitle className="text-3xl">{pendingReports.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flag className="w-4 h-4" />
              <span>Requiring attention</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Actions</CardDescription>
            <CardTitle className="text-3xl">{activeActions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Currently enforced</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Resolved Today</CardDescription>
            <CardTitle className="text-3xl">
              {resolvedReports.filter(r => {
                const reviewDate = r.reviewed_at ? new Date(r.reviewed_at) : null;
                const today = new Date();
                return reviewDate && reviewDate.toDateString() === today.toDateString();
              }).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              <span>Cases handled</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="reports">
            Reports ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="actions">
            Actions ({activeActions.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4 mt-6">
          {reportsLoading ? (
            <div className="text-center py-12">Loading reports...</div>
          ) : pendingReports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-muted-foreground">All caught up! No pending reports.</p>
              </CardContent>
            </Card>
          ) : (
            pendingReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={priorityColors[report.priority]}>
                          {report.priority}
                        </Badge>
                        <Badge className={statusColors[report.status]}>
                          {report.status}
                        </Badge>
                        <Badge variant="outline">{report.report_type}</Badge>
                      </div>
                      <CardTitle className="text-lg">
                        Report against User ID: {report.reported_user_id}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Reported by User ID: {report.reporter_id} • {format(new Date(report.created_date), 'PPp')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium mb-1">Description:</p>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>

                  {selectedReport?.id === report.id && (
                    <div className="space-y-3 border-t pt-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Action Taken</label>
                        <Select value={actionTaken} onValueChange={setActionTaken}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select action" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="warning_issued">Warning Issued</SelectItem>
                            <SelectItem value="user_muted">User Muted</SelectItem>
                            <SelectItem value="user_banned">User Banned</SelectItem>
                            <SelectItem value="no_action">No Action Required</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Resolution Notes</label>
                        <Textarea
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Add notes about your decision..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleResolveReport(report, 'resolved')}
                          disabled={updateReportMutation.isPending}
                          size="sm"
                        >
                          Resolve
                        </Button>
                        <Button
                          onClick={() => handleResolveReport(report, 'dismissed')}
                          disabled={updateReportMutation.isPending}
                          variant="outline"
                          size="sm"
                        >
                          Dismiss
                        </Button>
                        <Button
                          onClick={() => setSelectedReport(null)}
                          variant="ghost"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedReport?.id !== report.id && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedReport(report)}
                        size="sm"
                      >
                        Review
                      </Button>
                      <Button
                        onClick={() => {
                          updateReportMutation.mutate({
                            reportId: report.id,
                            data: { status: 'under_review', reviewed_by: user?.id },
                          });
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Mark Under Review
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4 mt-6">
          {actionsLoading ? (
            <div className="text-center py-12">Loading actions...</div>
          ) : activeActions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active moderation actions.</p>
              </CardContent>
            </Card>
          ) : (
            activeActions.map((action) => {
              const Icon = actionIcons[action.action_type] || Shield;
              return (
                <Card key={action.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg capitalize">
                            {action.action_type}
                          </CardTitle>
                          <CardDescription>
                            Target: {action.target_user_id} • By: {action.moderator_id}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={action.is_permanent ? 'destructive' : 'default'}>
                          {action.is_permanent ? 'Permanent' : `${action.duration}m`}
                        </Badge>
                        {action.expires_at && (
                          <span className="text-xs text-muted-foreground">
                            Expires: {format(new Date(action.expires_at), 'PPp')}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Reason:</p>
                        <p className="text-sm text-muted-foreground">{action.reason}</p>
                      </div>
                      {action.notes && (
                        <div>
                          <p className="text-sm font-medium">Notes:</p>
                          <p className="text-sm text-muted-foreground">{action.notes}</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created: {format(new Date(action.created_date), 'PPp')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-6">
          {resolvedReports.map((report) => (
            <Card key={report.id} className="opacity-75">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={statusColors[report.status]}>
                        {report.status}
                      </Badge>
                      <Badge variant="outline">{report.report_type}</Badge>
                    </div>
                    <CardTitle className="text-base">
                      Report against User ID: {report.reported_user_id}
                    </CardTitle>
                  </div>
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{report.description}</p>
                {report.resolution_notes && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Resolution:</p>
                    <p className="text-sm text-muted-foreground">{report.resolution_notes}</p>
                    {report.action_taken && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Action: {report.action_taken}
                      </p>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Resolved: {report.reviewed_at ? format(new Date(report.reviewed_at), 'PPp') : 'N/A'}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}