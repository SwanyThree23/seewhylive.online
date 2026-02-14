import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Flag } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, reportedUser, roomId, communityId, messageId }) {
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const reportMutation = useMutation({
    mutationFn: async (reportData) => {
      return await base44.entities.Report.create(reportData);
    },
    onSuccess: () => {
      toast.success('Report submitted successfully');
      queryClient.invalidateQueries(['reports']);
      onClose();
      setReportType('');
      setDescription('');
    },
    onError: () => {
      toast.error('Failed to submit report');
    },
  });

  const handleSubmit = () => {
    if (!reportType || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    reportMutation.mutate({
      reporter_id: currentUser?.id,
      reported_user_id: reportedUser.user_id || reportedUser.id,
      report_type: reportType,
      description: description.trim(),
      room_id: roomId,
      community_id: communityId,
      message_id: messageId,
      status: 'pending',
      priority: reportType === 'hate_speech' || reportType === 'harassment' ? 'high' : 'medium',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Report User
          </DialogTitle>
          <DialogDescription>
            Report {reportedUser?.name || 'this user'} for violating community guidelines
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Reason</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="hate_speech">Hate Speech</SelectItem>
                <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                <SelectItem value="impersonation">Impersonation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              placeholder="Please provide details about the violation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={reportMutation.isPending}
              className="flex-1"
            >
              {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}