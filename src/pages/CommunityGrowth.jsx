import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Gift, Megaphone, TrendingUp } from 'lucide-react';
import ReferralProgram from '../components/community/ReferralProgram';
import ChallengeCard from '../components/community/ChallengeCard';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';
import AnnouncementPanel from '../components/community/AnnouncementPanel';
import AnnouncementFeed from '../components/community/AnnouncementFeed';

export default function CommunityGrowthPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const communityId = urlParams.get('id');
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => base44.entities.Community.filter({ id: communityId }).then(c => c[0]),
    enabled: !!communityId,
  });

  const { data: membership } = useQuery({
    queryKey: ['membership', communityId, user?.id],
    queryFn: () => base44.entities.CommunityMember.filter({
      community_id: communityId,
      user_id: user?.id,
    }).then(m => m[0]),
    enabled: !!communityId && !!user,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges', communityId],
    queryFn: () => base44.entities.Challenge.filter({ community_id: communityId }, '-start_date'),
    enabled: !!communityId,
  });

  const { data: userParticipation = [] } = useQuery({
    queryKey: ['challengeParticipation', user?.id],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ user_id: user?.id }),
    enabled: !!user,
  });

  const isAdmin = membership?.role === 'admin' || membership?.role === 'owner';

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-2">{community.name} - Growth Hub</h1>
          <p className="text-purple-100">
            Engage members, drive growth, and build community
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="challenges" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-3">
            <TabsTrigger value="challenges">
              <Trophy className="w-4 h-4 mr-2" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="referrals">
              <Gift className="w-4 h-4 mr-2" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="announcements">
              <Megaphone className="w-4 h-4 mr-2" />
              Announcements
            </TabsTrigger>
          </TabsList>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Active Challenges</h2>
                  <p className="text-muted-foreground">
                    Compete and earn rewards
                  </p>
                </div>

                <div className="grid gap-4">
                  {challenges.filter(c => c.status === 'active').map((challenge) => (
                    <div key={challenge.id} onClick={() => setSelectedChallenge(challenge.id)}>
                      <ChallengeCard
                        challenge={challenge}
                        userParticipation={userParticipation.find(p => p.challenge_id === challenge.id)}
                        userId={user?.id}
                      />
                    </div>
                  ))}
                  {challenges.filter(c => c.status === 'active').length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg border">
                      <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-2 opacity-50" />
                      <p className="text-muted-foreground">No active challenges</p>
                    </div>
                  )}
                </div>

                {/* Upcoming */}
                {challenges.filter(c => c.status === 'upcoming').length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Coming Soon</h3>
                    <div className="grid gap-4">
                      {challenges.filter(c => c.status === 'upcoming').map((challenge) => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          userId={user?.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Leaderboard Sidebar */}
              <div>
                {selectedChallenge ? (
                  <ChallengeLeaderboard challengeId={selectedChallenge} />
                ) : (
                  <div className="bg-white rounded-lg border p-6 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Select a challenge to view leaderboard
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <div className="max-w-2xl">
              <ReferralProgram communityId={communityId} userId={user?.id} />
            </div>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {isAdmin && (
                <div>
                  <AnnouncementPanel communityId={communityId} userId={user?.id} />
                </div>
              )}
              
              <div className={isAdmin ? '' : 'lg:col-span-2'}>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold mb-2">Announcements</h2>
                  <p className="text-muted-foreground">
                    Stay updated with community news
                  </p>
                </div>
                <AnnouncementFeed communityId={communityId} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}