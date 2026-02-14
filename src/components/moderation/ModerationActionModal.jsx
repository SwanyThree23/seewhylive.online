import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

export default function ModerationActionModal({ isOpen, onClose, targetUser, roomId, communityId, moderatorId }) {
  const [actionType, setActionType] = useState('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const actionMutation = useMutation({
    mutationFn: async (actionData) => {
      return await base44.entities.ModerationAction.create(actionData);
    },
    onSuccess: () => {
      toast.success('Moderation action applied');
      queryClient.invalidateQueries(['moderationActions']);
      queryClient.invalidateQueries(['participants']);
      onClose();
      resetForm();
    },
    onError: () => {
      toast.error('Failed to apply action');
    },
  });

  const resetForm = () => {
    setActionType('');
    setReason('');
    setDuration('');
    setIsPermanent(false);
    setNotes('');
  };

  const handleSubmit = () => {
    if (!actionType || !reason.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    const expiresAt = isPermanent || !duration
      ? null
      : new Date(Date.now() + parseInt(duration) * 60000).toISOString();

    actionMutation.mutate({
      action_type: actionType,
      target_user_id: targetUser.user_id || targetUser.id,
      moderator_id: moderatorId,
      room_id: roomId,
      community_id: communityId,
      reason: reason.trim(),
      duration: duration ? parseInt(duration) : null,
      is_permanent: isPermanent,
      expires_at: expiresAt,
      is_active: true,
      notes: notes.trim() || null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Moderation Action
          </DialogTitle>
          <DialogDescription>
            Take action against {targetUser?.user_name || 'this user'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Action Type</label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="mute">Mute</SelectItem>
                <SelectItem value="kick">Kick from Room</SelectItem>
                <SelectItem value="ban">Ban</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Reason *</label>
            <Textarea
              placeholder="Explain the reason for this action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {(actionType === 'mute' || actionType === 'ban') && (
            <>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Permanent</label>
                <Switch checked={isPermanent} onCheckedChange={setIsPermanent} />
              </div>

              {!isPermanent && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Duration (minutes)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 30, 60, 1440"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Additional Notes</label>
            <Textarea
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={actionMutation.isPending}
              className="flex-1"
              variant="destructive"
            >
              {actionMutation.isPending ? 'Applying...' : 'Apply Action'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}