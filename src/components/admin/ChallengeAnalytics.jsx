import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, TrendingUp, Award, Target, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ChallengeAnalytics({ communityId }) {
  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges', communityId],
    queryFn: () => base44.entities.Challenge.filter({ community_id: communityId }),
  });

  const { data: allParticipants = [] } = useQuery({
    queryKey: ['allChallengeParticipants'],
    queryFn: () => base44.entities.ChallengeParticipant.list(),
  });

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const completedChallenges = challenges.filter(c => c.status === 'completed');
  
  const totalParticipations = allParticipants.filter(p => 
    challenges.some(c => c.id === p.challenge_id)
  ).length;
  
  const completedParticipations = allParticipants.filter(p => 
    challenges.some(c => c.id === p.challenge_id) && p.completed
  ).length;

  const avgParticipantsPerChallenge = challenges.length > 0 
    ? (totalParticipations / challenges.length).toFixed(1) 
    : 0;

  const completionRate = totalParticipations > 0 
    ? ((completedParticipations / totalParticipations) * 100).toFixed(1) 
    : 0;

  // Challenge performance details
  const challengeStats = challenges.map(challenge => {
    const participants = allParticipants.filter(p => p.challenge_id === challenge.id);
    const completed = participants.filter(p => p.completed).length;
    const rate = participants.length > 0 ? ((completed / participants.length) * 100).toFixed(1) : 0;
    
    return {
      ...challenge,
      participantCount: participants.length,
      completedCount: completed,
      completionRate: rate,
    };
  }).sort((a, b) => b.participantCount - a.participantCount);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Challenges</CardDescription>
            <CardTitle className="text-3xl">{challenges.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4" />
              <span>{activeChallenges.length} active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Participants</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{totalParticipations}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>All challenges</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Participants</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{avgParticipantsPerChallenge}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>Per challenge</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-3xl text-green-600">{completionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="w-4 h-4" />
              <span>Success rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Challenge Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Challenge Performance</CardTitle>
          <CardDescription>Engagement metrics for each challenge</CardDescription>
        </CardHeader>
        <CardContent>
          {challengeStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No challenges created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {challengeStats.map((challenge) => (
                <div key={challenge.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{challenge.title}</h3>
                        <Badge variant={challenge.status === 'active' ? 'default' : 'outline'}>
                          {challenge.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">Participants</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{challenge.participantCount}</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Award className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">Completed</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{challenge.completedCount}</p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Target className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-purple-600 font-medium">Rate</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">{challenge.completionRate}%</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{challenge.completionRate}%</span>
                    </div>
                    <Progress value={parseFloat(challenge.completionRate)} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Engagement Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Most Popular Challenge</p>
                <p className="text-sm text-blue-700">
                  {challengeStats[0]?.title || 'N/A'} with {challengeStats[0]?.participantCount || 0} participants
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Award className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Best Completion Rate</p>
                <p className="text-sm text-green-700">
                  {challengeStats.sort((a, b) => parseFloat(b.completionRate) - parseFloat(a.completionRate))[0]?.title || 'N/A'} 
                  {' '}at {challengeStats.sort((a, b) => parseFloat(b.completionRate) - parseFloat(a.completionRate))[0]?.completionRate || 0}%
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Users className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-purple-900">Community Engagement</p>
                <p className="text-sm text-purple-700">
                  {totalParticipations} total participations across {challenges.length} challenges
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}