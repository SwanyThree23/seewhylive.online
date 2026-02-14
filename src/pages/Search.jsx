import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search as SearchIcon, Radio, Users, Trophy } from 'lucide-react';
import RoomCard from '../components/rooms/RoomCard';
import CommunityCard from '../components/communities/CommunityCard';
import ChallengeCard from '../components/community/ChallengeCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');

  const { data: rooms = [] } = useQuery({
    queryKey: ['searchRooms', query],
    queryFn: () => base44.entities.Room.list('-created_date', 50),
  });

  const { data: communities = [] } = useQuery({
    queryKey: ['searchCommunities', query],
    queryFn: () => base44.entities.Community.list('-member_count', 50),
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['searchChallenges', query],
    queryFn: () => base44.entities.Challenge.list('-created_date', 50),
  });

  const filteredRooms = rooms.filter(r => 
    r.title?.toLowerCase().includes(query.toLowerCase()) ||
    r.description?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCommunities = communities.filter(c => 
    c.name?.toLowerCase().includes(query.toLowerCase()) ||
    c.description?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredChallenges = challenges.filter(ch => 
    ch.title?.toLowerCase().includes(query.toLowerCase()) ||
    ch.description?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <SearchIcon className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Search</h1>
        </div>

        <div className="max-w-2xl">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rooms, communities, challenges..."
            className="text-lg h-12"
          />
        </div>

        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rooms">
              <Radio className="w-4 h-4 mr-2" />
              Rooms ({filteredRooms.length})
            </TabsTrigger>
            <TabsTrigger value="communities">
              <Users className="w-4 h-4 mr-2" />
              Communities ({filteredCommunities.length})
            </TabsTrigger>
            <TabsTrigger value="challenges">
              <Trophy className="w-4 h-4 mr-2" />
              Challenges ({filteredChallenges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Radio className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No rooms found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map(room => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="communities">
            {filteredCommunities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No communities found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCommunities.map(community => (
                  <CommunityCard key={community.id} community={community} isMember={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="challenges">
            {filteredChallenges.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No challenges found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredChallenges.map(challenge => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}