import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';

export default function ChallengeLeaderboard({ challengeId }) {
  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['leaderboard', challengeId],
    queryFn: async () => {
      const data = await base44.entities.ChallengeParticipant.filter(
        { challenge_id: challengeId },
        '-score'
      );
      return data;
    },
  });

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-orange-600" />;
      default: return <span className="text-muted-foreground text-sm">#{rank}</span>;
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-slate-100 text-slate-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading leaderboard...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-600" />
          Leaderboard
        </CardTitle>
        <CardDescription>Top performers in this challenge</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {participants.slice(0, 10).map((participant, index) => {
            const rank = index + 1;
            return (
              <div
                key={participant.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  rank <= 3 ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200' : 'bg-slate-50'
                }`}
              >
                {/* Rank */}
                <div className="w-10 flex justify-center">
                  {getRankIcon(rank)}
                </div>

                {/* User Info */}
                <Avatar className="w-10 h-10">
                  <AvatarFallback>{participant.user_id.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">User {participant.user_id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    Progress: {participant.progress}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <Badge className={getRankBadge(rank)}>
                    {participant.score} pts
                  </Badge>
                  {participant.completed && (
                    <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {participants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No participants yet. Be the first to join!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}