import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import CreatorProfileSetup from '../components/profile/CreatorProfileSetup';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radio, Clock, TrendingUp, Search, Plus, Filter, Activity, Zap, Video, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import RoomCard from '../components/rooms/RoomCard';
import CommunityCard from '../components/communities/CommunityCard';
import ActivitySidebar from '../components/shared/ActivitySidebar';
import QuickActionPanel from '../components/shared/QuickActionPanel';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showActivitySidebar, setShowActivitySidebar] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const qc = useQueryClient();

  // Real-time room updates
  useEffect(() => {
    const unsub = base44.entities.Room.subscribe(() => {
      qc.invalidateQueries(['rooms']);
    });
    return unsub;
  }, [qc]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: preferences } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreference.filter({ user_id: user?.id });
      return prefs[0];
    },
    enabled: !!user,
  });

  const { data: creatorProfile } = useQuery({
    queryKey: ['creatorProfile', user?.id],
    queryFn: () => base44.entities.CreatorProfile.filter({ user_id: user?.id }).then(r => r[0]),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    if (!preferences || !preferences.onboarding_completed) {
      setTimeout(() => setShowOnboarding(true), 1000);
    } else if (creatorProfile === null || creatorProfile === undefined) {
      // Onboarding done but no creator profile yet — prompt after short delay
      setTimeout(() => setShowProfileSetup(true), 1500);
    }
  }, [user, preferences, creatorProfile]);

  const { data: liveRooms = [], isLoading: loadingLive } = useQuery({
    queryKey: ['rooms', 'live'],
    queryFn: () => base44.entities.Room.filter({ status: 'live' }, '-viewer_count', 20),
    refetchInterval: 15000,
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
    <>
      <OnboardingFlow isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
      <CreatorProfileSetup user={user} isOpen={showProfileSetup} onClose={() => setShowProfileSetup(false)} />
      <ActivitySidebar isOpen={showActivitySidebar} onClose={() => setShowActivitySidebar(false)} />
      <QuickActionPanel isOpen={showQuickActions} onClose={() => setShowQuickActions(false)} />
      
      {/* Floating Action Buttons */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-30 flex flex-col gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowQuickActions(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl"
        >
          <Zap className="w-6 h-6" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowActivitySidebar(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl"
        >
          <Activity className="w-6 h-6" />
        </motion.button>
      </motion.div>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-5xl font-bold mb-3">
              Welcome to SeeWhy LIVE
            </h1>
            <p className="text-base sm:text-xl text-purple-100 mb-6 sm:mb-8 px-2">
              Join live audio & video rooms, connect with communities, and stream together
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto px-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search rooms, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-5 text-base bg-white/10 backdrop-blur border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              <Link to={createPageUrl('CreateRoom')}>
                <Button size="lg" className="w-full sm:w-auto bg-white text-purple-600 hover:bg-white/90 px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Room
                </Button>
              </Link>
              <Link to={createPageUrl('VideoPost')}>
                <Button size="lg" className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border border-white/30 px-6">
                  <Video className="w-5 h-5 mr-2" />
                  Post Video
                </Button>
              </Link>
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <Link to={createPageUrl('FeaturedContent')}>
                <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white/80 px-3 py-1.5 rounded-full border border-white/20 transition-all cursor-pointer">
                  <Star className="w-3 h-3 text-yellow-300" /> Featured Channels & Videos
                </span>
              </Link>
              <Link to={createPageUrl('LiveRoom')}>
                <span className="inline-flex items-center gap-1.5 text-xs bg-red-600/40 hover:bg-red-600/60 text-white px-3 py-1.5 rounded-full border border-red-500/30 transition-all cursor-pointer">
                  <Radio className="w-3 h-3 animate-pulse" /> Go Live Now
                </span>
              </Link>
              <Link to={createPageUrl('WatchParty')}>
                <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white/80 px-3 py-1.5 rounded-full border border-white/20 transition-all cursor-pointer">
                  <Video className="w-3 h-3" /> Watch Party
                </span>
              </Link>
              <Link to={createPageUrl('VODLibrary')}>
                <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white/80 px-3 py-1.5 rounded-full border border-white/20 transition-all cursor-pointer">
                  <Video className="w-3 h-3" /> VOD Library
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Category Filter */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Filter className="w-5 h-5 text-muted-foreground shrink-0" />
            {categories.map((category, index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize shrink-0"
                >
                  {category}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs defaultValue="live" className="space-y-6 sm:space-y-8">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-72 sm:h-96 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredRooms(liveRooms).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredRooms(liveRooms).map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.03, y: -5 }}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-72 sm:h-96 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredRooms(scheduledRooms).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredRooms(scheduledRooms).map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.03, y: -5 }}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 sm:h-72 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {communities.map((community, index) => (
                  <motion.div
                    key={community.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.03, y: -5 }}
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
    </>
  );
}