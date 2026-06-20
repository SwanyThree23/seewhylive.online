import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CreatePollModal({ isOpen, onClose, communityId }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [duration, setDuration] = useState(24);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createPollMutation = useMutation({
    mutationFn: (pollData) => {
      if (!user?.id) throw new Error('Not authenticated');
      return base44.entities.Poll.create(pollData);
    },
    onError: () => toast.error('Failed to create poll. Please try again.'),
    onSuccess: (poll) => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      toast.success('Poll created!');
      if (user?.id) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'milestone',
          title: `Created poll: ${poll?.question || 'Community Poll'}`,
        }).catch(() => {});
      }
      handleClose();
    },
  });

  const handleClose = () => {
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
    setDuration(24);
    onClose();
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    const validOptions = options.filter(opt => opt.trim());
    
    if (!question.trim() || validOptions.length < 2) {
      toast.error('Please enter a question and at least 2 options');
      return;
    }

    const endsAt = new Date();
    endsAt.setHours(endsAt.getHours() + duration);

    createPollMutation.mutate({
      community_id: communityId,
      created_by: user?.id,
      creator_name: user?.full_name,
      question: question.trim(),
      options: validOptions.map((text, index) => ({
        id: `opt_${Date.now()}_${index}`,
        text: text.trim(),
        votes: 0,
      })),
      allow_multiple: allowMultiple,
      ends_at: endsAt.toISOString(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a Poll</DialogTitle>
          <DialogDescription>
            Ask your community a question and gather their opinions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Question</Label>
            <Input
              placeholder="What would you like to know?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Options</Label>
            <div className="space-y-2 mt-1">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label>Allow Multiple Selections</Label>
            <Switch
              checked={allowMultiple}
              onCheckedChange={setAllowMultiple}
            />
          </div>

          <div>
            <Label>Duration (hours)</Label>
            <Input
              type="number"
              min="1"
              max="168"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="mt-1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Create Poll
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}