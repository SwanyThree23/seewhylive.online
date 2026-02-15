import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Radio, Calendar, TrendingUp, Settings, Shield, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import RoomCard from '../components/rooms/RoomCard';
import AnnouncementFeed from '../components/community/AnnouncementFeed';
import DiscussionFeed from '../components/community/DiscussionFeed';
import PollCard from '../components/community/PollCard';
import CreatePollModal from '../components/community/CreatePollModal';
import SpotlightSection from '../components/community/SpotlightSection';
import PayPerViewCard from '../components/monetization/PayPerViewCard';
import { toast } from 'sonner';

export default function CommunityPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const communityId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: community, isLoading } = useQuery({
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

  const { data: rooms = [] } = useQuery({
    queryKey: ['communityRooms', communityId],
    queryFn: () => base44.entities.Room.filter({ community_id: communityId }, '-created_date', 20),
    enabled: !!communityId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: () => base44.entities.CommunityMember.filter({ community_id: communityId }, '-joined_at', 50),
    enabled: !!communityId,
  });

  const { data: polls = [] } = useQuery({
    queryKey: ['polls', communityId],
    queryFn: () => base44.entities.Poll.filter({ community_id: communityId }, '-created_date', 10),
    enabled: !!communityId,
  });

  const { data: ppvEvents = [] } = useQuery({
    queryKey: ['ppv-events', communityId],
    queryFn: () => base44.entities.PayPerViewEvent.filter(
      { community_id: communityId, status: 'upcoming' },
      'event_date',
      6
    ),
    enabled: !!communityId,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.CommunityMember.create({
        community_id: communityId,
        user_id: user.id,
        role: 'member',
        joined_at: new Date().toISOString(),
      });
      await base44.entities.Community.update(communityId, {
        member_count: (community.member_count || 0) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['membership']);
      queryClient.invalidateQueries(['community']);
      toast.success('Joined community!');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading community...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Community not found</h2>
          <Button asChild><Link to={createPageUrl('Communities')}>Browse Communities</Link></Button>
        </div>
      </div>
    );
  }

  const isMember = !!membership;
  const isAdmin = membership?.role === 'owner' || membership?.role === 'admin';
  const liveRooms = rooms.filter(r => r.status === 'live');
  const upcomingRooms = rooms.filter(r => r.status === 'scheduled');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-purple-600 to-pink-600 overflow-hidden">
          {community.cover_url && (
            <img src={community.cover_url} alt="" className="w-full h-full object-cover opacity-50" />
          )}
        </div>
        <div className="max-w-7xl mx-auto px-6 relative -mt-16">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="w-32 h-32 ring-4 ring-white">
                <AvatarImage src={community.avatar_url} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                  {community.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-3xl font-bold">{community.name}</h1>
                      {community.verified && (
                        <Badge className="bg-blue-500"><Star className="w-3 h-3 mr-1" />Verified</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{community.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-4">
                  <Badge variant="outline" className="text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    {community.member_count} members
                  </Badge>
                  <Badge variant="outline" className="capitalize">{community.category}</Badge>
                  {community.tags?.map(tag => (
                    <Badge key={tag} variant="secondary">#{tag}</Badge>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  {!isMember ? (
                    <Button onClick={() => joinMutation.mutate()} size="lg">
                      <Users className="w-4 h-4 mr-2" />
                      Join Community
                    </Button>
                  ) : (
                    <>
                      <Button asChild variant="outline">
                        <Link to={createPageUrl('CommunityGrowth') + '?id=' + communityId}>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Growth Hub
                        </Link>
                      </Button>
                      {isAdmin && (
                        <Button asChild variant="outline">
                          <Link to={createPageUrl('CommunitySettings') + '?id=' + communityId}>
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </Link>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Spotlight Section */}
        <SpotlightSection communityId={communityId} />

        <Tabs defaultValue="discussions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
            <TabsTrigger value="rooms"><Radio className="w-4 h-4 mr-2" />Rooms</TabsTrigger>
            <TabsTrigger value="polls">Polls</TabsTrigger>
            <TabsTrigger value="premium">Premium Events</TabsTrigger>
            <TabsTrigger value="announcements"><Calendar className="w-4 h-4 mr-2" />Announcements</TabsTrigger>
            <TabsTrigger value="members"><Users className="w-4 h-4 mr-2" />Members</TabsTrigger>
          </TabsList>

          <TabsContent value="discussions">
            <DiscussionFeed communityId={communityId} />
          </TabsContent>

          <TabsContent value="rooms" className="space-y-6">
            {liveRooms.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Live Now</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveRooms.map(room => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              </div>
            )}

            {upcomingRooms.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Upcoming</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingRooms.map(room => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              </div>
            )}

            {rooms.length === 0 && (
              <Card><CardContent className="p-12 text-center">
                <Radio className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No rooms yet</p>
              </CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="polls" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Community Polls</h2>
              {isMember && (
                <Button onClick={() => setShowCreatePoll(true)}>
                  Create Poll
                </Button>
              )}
            </div>
            {polls.length > 0 ? (
              <div className="space-y-4">
                {polls.map(poll => (
                  <PollCard key={poll.id} poll={poll} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No polls yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="premium" className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Premium Events</h2>
            {ppvEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ppvEvents.map(event => (
                  <PayPerViewCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No premium events scheduled</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementFeed communityId={communityId} />
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader><CardTitle>Members ({members.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {members.map(member => (
                    <div key={member.id} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Avatar><AvatarFallback>{member.user_id.slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
                      <Badge variant="outline" className="text-xs">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CreatePollModal
        isOpen={showCreatePoll}
        onClose={() => setShowCreatePoll(false)}
        communityId={communityId}
      />
    </div>
  );
}