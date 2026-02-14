import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radio, Clock, TrendingUp, Search, Plus, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import RoomCard from '../components/rooms/RoomCard';
import CommunityCard from '../components/communities/CommunityCard';
import { motion } from 'framer-motion';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: liveRooms = [], isLoading: loadingLive } = useQuery({
    queryKey: ['rooms', 'live'],
    queryFn: () => base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 20),
  });

  const { data: scheduledRooms = [], isLoading: loadingScheduled } = useQuery({
    queryKey: ['rooms', 'scheduled'],
    queryFn: () => base44.entities.Room.filter({ status: 'scheduled' }, 'scheduled_start', 10),
  });

  const { data: communities = [], isLoading: loadingCommunities } = useQuery({
    queryKey: ['communities'],
    queryFn: () => base44.entities.Community.list('-member_count', 12),
  });

  const categories = ['all', 'music', 'gaming', 'tech', 'education', 'business', 'entertainment', 'sports', 'lifestyle'];

  const filteredRooms = (rooms) => {
    return rooms.filter(room => {
      const matchesSearch = !searchQuery || 
        room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        room.tags?.includes(selectedCategory);
      
      return matchesSearch && matchesCategory;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-4">
              Welcome to StreamSpace
            </h1>
            <p className="text-xl text-purple-100 mb-8">
              Join live audio & video rooms, connect with communities, and stream together
            </p>

            <div className="flex gap-4 justify-center max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search rooms, topics, communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-6 text-lg bg-white/10 backdrop-blur border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              <Link to={createPageUrl('CreateRoom')}>
                <Button size="lg" className="bg-white text-purple-600 hover:bg-white/90 px-8">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Room
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-muted-foreground shrink-0" />
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="live" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-3 mx-auto">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              Live Now
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Communities
            </TabsTrigger>
          </TabsList>

          {/* Live Rooms */}
          <TabsContent value="live" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Live Now</h2>
                <p className="text-muted-foreground">Join active conversations happening right now</p>
              </div>
              {liveRooms.length > 0 && (
                <div className="flex items-center gap-2 text-red-500 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="font-medium">{liveRooms.length} Live</span>
                </div>
              )}
            </div>

            {loadingLive ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredRooms(liveRooms).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms(liveRooms).map((room) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <RoomCard room={room} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Radio className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No live rooms right now</h3>
                <p className="text-muted-foreground mb-4">Be the first to start a conversation!</p>
                <Link to={createPageUrl('CreateRoom')}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Room
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Scheduled Rooms */}
          <TabsContent value="scheduled" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Upcoming Rooms</h2>
              <p className="text-muted-foreground">Schedule reminders for rooms you don't want to miss</p>
            </div>

            {loadingScheduled ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredRooms(scheduledRooms).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms(scheduledRooms).map((room) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <RoomCard room={room} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No scheduled rooms</h3>
                <p className="text-muted-foreground">Check back later for upcoming events</p>
              </div>
            )}
          </TabsContent>

          {/* Communities */}
          <TabsContent value="communities" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Trending Communities</h2>
                <p className="text-muted-foreground">Join communities to stay connected</p>
              </div>
              <Link to={createPageUrl('Communities')}>
                <Button variant="outline">View All</Button>
              </Link>
            </div>

            {loadingCommunities ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-72 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communities.map((community) => (
                  <motion.div
                    key={community.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <CommunityCard community={community} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}