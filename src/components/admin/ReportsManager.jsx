import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flag, AlertCircle, CheckCircle, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ReportsManager({ communityId, userId }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ['communityReports', communityId],
    queryFn: () => base44.entities.Report.filter({ community_id: communityId }, '-created_date'),
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, data }) => {
      return await base44.entities.Report.update(reportId, data);
    },
    onSuccess: () => {
      toast.success('Report updated');
      queryClient.invalidateQueries(['communityReports']);
      setSelectedReport(null);
      setResolutionNotes('');
      setActionTaken('');
    },
  });

  const handleResolve = (report, status) => {
    updateReportMutation.mutate({
      reportId: report.id,
      data: {
        status,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        resolution_notes: resolutionNotes || null,
        action_taken: actionTaken || null,
      },
    });
  };

  const pendingReports = reports.filter(r => r.status === 'pending' || r.status === 'under_review');
  const resolvedReports = reports.filter(r => r.status === 'resolved' || r.status === 'dismissed');

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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Reports</CardDescription>
            <CardTitle className="text-3xl">{pendingReports.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flag className="w-4 h-4" />
              Require attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Resolved Today</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {resolvedReports.filter(r => {
                const date = r.reviewed_at ? new Date(r.reviewed_at) : null;
                return date && date.toDateString() === new Date().toDateString();
              }).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              Cases handled
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Reports</CardDescription>
            <CardTitle className="text-3xl">{reports.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              All time
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Reports ({pendingReports.length})</CardTitle>
          <CardDescription>Reports requiring moderation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingReports.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-muted-foreground">All caught up! No pending reports.</p>
            </div>
          ) : (
            pendingReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={priorityColors[report.priority]}>{report.priority}</Badge>
                      <Badge className={statusColors[report.status]}>{report.status}</Badge>
                      <Badge variant="outline">{report.report_type}</Badge>
                    </div>
                    <p className="font-medium">User ID: {report.reported_user_id}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reported by: {report.reporter_id} • {format(new Date(report.created_date), 'PPp')}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Description:</p>
                  <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                </div>

                {selectedReport?.id === report.id ? (
                  <div className="space-y-3 border-t pt-3">
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
                          <SelectItem value="content_removed">Content Removed</SelectItem>
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
                      <Button onClick={() => handleResolve(report, 'resolved')} size="sm">
                        Resolve
                      </Button>
                      <Button onClick={() => handleResolve(report, 'dismissed')} variant="outline" size="sm">
                        Dismiss
                      </Button>
                      <Button onClick={() => setSelectedReport(null)} variant="ghost" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => setSelectedReport(report)} size="sm">
                    Review Report
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}