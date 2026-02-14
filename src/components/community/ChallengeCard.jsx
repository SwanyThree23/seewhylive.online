import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Calendar, Users, Award } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ChallengeCard({ challenge, userParticipation, userId }) {
  const queryClient = useQueryClient();

  const joinChallengeMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.ChallengeParticipant.create({
        challenge_id: challenge.id,
        user_id: userId,
        progress: 0,
        score: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['challenges']);
      queryClient.invalidateQueries(['challengeParticipation']);
      toast.success('Joined challenge successfully!');
    },
  });

  const isParticipating = !!userParticipation;
  const progress = userParticipation ? (userParticipation.progress / challenge.goal_value) * 100 : 0;
  const isCompleted = userParticipation?.completed;

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
  };

  const typeIcons = {
    attendance: Calendar,
    engagement: Users,
    content: Trophy,
    referral: Award,
    custom: Target,
  };

  const Icon = typeIcons[challenge.type] || Target;

  return (
    <Card className={`${isCompleted ? 'bg-gradient-to-br from-yellow-50 to-orange-50' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Icon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{challenge.title}</CardTitle>
              <CardDescription>{challenge.description}</CardDescription>
            </div>
          </div>
          <Badge className={statusColors[challenge.status]}>
            {challenge.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Challenge Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{challenge.participant_count} participants</span>
          </div>
        </div>

        {/* Goal */}
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Goal</span>
            <Badge variant="outline">{challenge.goal_value} {challenge.goal_type}</Badge>
          </div>
          {isParticipating && (
            <>
              <Progress value={progress} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{userParticipation.progress} / {challenge.goal_value}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </>
          )}
        </div>

        {/* Reward */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">Reward</span>
          </div>
          <span className="text-sm font-bold text-purple-600">{challenge.reward_value}</span>
        </div>

        {/* Action Button */}
        {challenge.status === 'active' && (
          <>
            {!isParticipating ? (
              <Button
                onClick={() => joinChallengeMutation.mutate()}
                className="w-full"
              >
                Join Challenge
              </Button>
            ) : isCompleted ? (
              <Button disabled className="w-full bg-green-600">
                <Trophy className="w-4 h-4 mr-2" />
                Completed!
              </Button>
            ) : (
              <Button variant="outline" className="w-full">
                View Progress
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}