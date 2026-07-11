import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import moment from 'moment';

export default function PollCard({ poll }) {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userVote } = useQuery({
    queryKey: ['poll-vote', poll.id, user?.id],
    queryFn: async () => {
      const votes = await base44.entities.PollVote.filter({
        poll_id: poll.id,
        user_id: user.id,
      });
      return votes[0];
    },
    enabled: !!user,
  });

  const voteMutation = useMutation({
    mutationFn: async () => {
      // Create vote record
      await base44.entities.PollVote.create({
        poll_id: poll.id,
        user_id: user.id,
        option_ids: selectedOptions,
      });

      // Update poll with new vote counts
      const updatedOptions = poll.options.map(opt => ({
        ...opt,
        votes: selectedOptions.includes(opt.id) ? opt.votes + 1 : opt.votes,
      }));

      await base44.entities.Poll.update(poll.id, {
        options: updatedOptions,
        total_votes: poll.total_votes + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      queryClient.invalidateQueries({ queryKey: ['poll-vote'] });
      toast.success('Vote submitted!');
    },
    onError: () => { toast.error('Failed to submit vote. Please try again.'); },
  });

  const handleVote = () => {
    if (selectedOptions.length === 0) return;
    voteMutation.mutate();
  };

  const hasVoted = !!userVote;
  const isEnded = poll.status === 'ended' || (poll.ends_at && new Date(poll.ends_at) < new Date());

  const toggleOption = (optionId) => {
    if (hasVoted || isEnded) return;
    
    if (poll.allow_multiple) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{poll.question}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              by {poll.creator_name} • {poll.total_votes} votes
            </p>
          </div>
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {poll.options.map((option) => {
          const percentage = poll.total_votes > 0 
            ? Math.round((option.votes / poll.total_votes) * 100) 
            : 0;
          const isSelected = selectedOptions.includes(option.id);
          const hasUserVoted = userVote?.option_ids?.includes(option.id);

          return (
            <motion.div
              key={option.id}
              whileHover={!hasVoted && !isEnded ? { scale: 1.02 } : {}}
              className="relative"
            >
              <Button
                variant={isSelected ? "default" : "outline"}
                className="w-full justify-start relative overflow-hidden"
                onClick={() => toggleOption(option.id)}
                disabled={hasVoted || isEnded}
              >
                {/* Progress bar background */}
                {hasVoted && (
                  <div
                    className="absolute inset-0 bg-primary/10"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                
                <div className="relative flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {hasUserVoted && <CheckCircle2 className="w-4 h-4" />}
                    <span>{option.text}</span>
                  </div>
                  {hasVoted && (
                    <span className="font-semibold">{percentage}%</span>
                  )}
                </div>
              </Button>
            </motion.div>
          );
        })}

        {!hasVoted && !isEnded && (
          <Button
            onClick={handleVote}
            disabled={selectedOptions.length === 0}
            className="w-full"
          >
            Submit Vote
          </Button>
        )}

        {isEnded && (
          <p className="text-sm text-center text-muted-foreground">
            Poll ended {moment(poll.ends_at).fromNow()}
          </p>
        )}

        {!isEnded && poll.ends_at && (
          <p className="text-sm text-center text-muted-foreground">
            Ends {moment(poll.ends_at).fromNow()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}