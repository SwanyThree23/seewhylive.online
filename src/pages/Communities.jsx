import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import CommunityCard from '../components/communities/CommunityCard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function CommunitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allCommunities = [], isLoading } = useQuery({
    queryKey: ['communities', selectedCategory],
    queryFn: async () => {
      if (selectedCategory === 'all') {
        return await base44.entities.Community.list('-member_count', 50);
      }
      return await base44.entities.Community.filter({ category: selectedCategory }, '-member_count', 50);
    },
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['myMemberships'],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.CommunityMember.filter({ user_id: user.id });
    },
    enabled: !!user,
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async (communityId) => {
      const existing = myMemberships.find(m => m.community_id === communityId);
      if (existing) {
        toast.info('Already a member');
        return;
      }

      await base44.entities.CommunityMember.create({
        community_id: communityId,
        user_id: user.id,
        role: 'member',
        joined_at: new Date().toISOString(),
      });

      // Update member count
      const community = allCommunities.find(c => c.id === communityId);
      if (community) {
        await base44.entities.Community.update(communityId, {
          member_count: (community.member_count || 0) + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMemberships'] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      toast.success('Joined community!');
    },
  });

  const categories = ['all', 'music', 'gaming', 'tech', 'education', 'business', 'entertainment', 'sports', 'lifestyle'];

  const filteredCommunities = allCommunities.filter(community => {
    const matchesSearch = !searchQuery || 
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const myCommunities = filteredCommunities.filter(c => 
    myMemberships.some(m => m.community_id === c.id)
  );

  const trendingCommunities = filteredCommunities.slice(0, 12);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Communities</h1>
              <p className="text-lg text-purple-100">
                Discover and join communities that match your interests
              </p>
            </div>
            <Link to={createPageUrl('CreateCommunity')}>
              <Button size="lg" className="bg-white text-purple-600 hover:bg-white/90">
                <Plus className="w-5 h-5 mr-2" />
                Create Community
              </Button>
            </Link>
          </div>

          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg bg-white/10 backdrop-blur border-white/20 text-white placeholder:text-white/60"
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="discover" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
            <TabsTrigger value="discover">
              <TrendingUp className="w-4 h-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="my-communities">
              <Users className="w-4 h-4 mr-2" />
              My Communities ({myCommunities.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Trending Communities</h2>
              <p className="text-muted-foreground">
                Popular communities you might be interested in
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : trendingCommunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingCommunities.map((community) => (
                  <motion.div
                    key={community.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <CommunityCard
                      community={community}
                      isMember={myMemberships.some(m => m.community_id === community.id)}
                      onJoin={(community) => joinCommunityMutation.mutate(community.id)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No communities found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or category filter
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-communities" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Communities</h2>
              <p className="text-muted-foreground">
                Communities you're a member of
              </p>
            </div>

            {myCommunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCommunities.map((community) => (
                  <motion.div
                    key={community.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <CommunityCard
                      community={community}
                      isMember={true}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No communities yet</h3>
                <p className="text-muted-foreground mb-4">
                  Join communities to connect with like-minded people
                </p>
                <Button onClick={() => document.querySelector('[value="discover"]').click()}>
                  Discover Communities
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}