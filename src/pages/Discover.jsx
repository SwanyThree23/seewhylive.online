import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Star, Users, Radio } from 'lucide-react';
import RoomCard from '../components/rooms/RoomCard';
import CommunityCard from '../components/communities/CommunityCard';

export default function DiscoverPage() {
  const [recommendations, setRecommendations] = useState({ rooms: [], communities: [] });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: preferences } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreference.filter({ user_id: user.id });
      return prefs[0];
    },
    enabled: !!user,
  });

  const { data: allRooms = [] } = useQuery({
    queryKey: ['discoverRooms'],
    queryFn: () => base44.entities.Room.list('-viewer_count', 50),
  });

  const { data: allCommunities = [] } = useQuery({
    queryKey: ['discoverCommunities'],
    queryFn: () => base44.entities.Community.list('-member_count', 50),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['userActivities', user?.id],
    queryFn: () => base44.entities.Activity.filter({ user_id: user?.id }, '-created_date', 20),
    enabled: !!user,
  });

  useEffect(() => {
    if (preferences && allRooms.length && allCommunities.length) {
      generateRecommendations();
    }
  }, [preferences, allRooms, allCommunities]);

  const generateRecommendations = async () => {
    try {
      // AI-powered recommendations
      const prompt = `Based on user preferences:
- Categories: ${preferences?.categories?.join(', ') || 'none'}
- Recent activity: ${activities.length} actions

Recommend 3 rooms and 3 communities from the available options that would best match this user's interests.

Available rooms: ${allRooms.slice(0, 10).map(r => r.title).join(', ')}
Available communities: ${allCommunities.slice(0, 10).map(c => c.name).join(', ')}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            rooms: { type: 'array', items: { type: 'string' } },
            communities: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      // Match recommended titles to actual entities
      const recommendedRooms = allRooms.filter(r => 
        result.rooms.some(title => r.title.toLowerCase().includes(title.toLowerCase()))
      );
      const recommendedCommunities = allCommunities.filter(c => 
        result.communities.some(name => c.name.toLowerCase().includes(name.toLowerCase()))
      );

      setRecommendations({
        rooms: recommendedRooms.slice(0, 6),
        communities: recommendedCommunities.slice(0, 6)
      });
    } catch (error) {
      // Fallback to simple recommendations
      const userCategories = preferences?.categories || [];
      setRecommendations({
        rooms: allRooms.slice(0, 6),
        communities: allCommunities.slice(0, 6)
      });
    }
  };

  const trendingRooms = allRooms
    .filter(r => r.status === 'live')
    .sort((a, b) => (b.viewer_count || 0) - (a.viewer_count || 0))
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Discover</h1>
        </div>

        <Tabs defaultValue="foryou" className="space-y-6">
          <TabsList>
            <TabsTrigger value="foryou">
              <Star className="w-4 h-4 mr-2" />
              For You
            </TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="communities">
              <Users className="w-4 h-4 mr-2" />
              Communities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="foryou" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Recommended For You
                </CardTitle>
              </CardHeader>
              <CardContent>
                {preferences?.categories && (
                  <div className="flex gap-2 mb-4">
                    {preferences.categories.map(cat => (
                      <Badge key={cat} variant="secondary">{cat}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {recommendations.rooms.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Radio className="w-5 h-5" />
                  Recommended Rooms
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.rooms.map(room => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              </div>
            )}

            {recommendations.communities.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Recommended Communities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.communities.map(community => (
                    <CommunityCard key={community.id} community={community} isMember={false} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending">
            <div>
              <h2 className="text-xl font-semibold mb-4">Trending Live Now</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingRooms.map(room => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="communities">
            <div>
              <h2 className="text-xl font-semibold mb-4">Popular Communities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCommunities.slice(0, 12).map(community => (
                  <CommunityCard key={community.id} community={community} isMember={false} />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}