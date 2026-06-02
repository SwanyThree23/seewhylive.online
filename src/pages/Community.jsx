import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Users, MessageSquare } from 'lucide-react';
import DiscussionFeed from '@/components/community/DiscussionFeed';
import SpotlightSection from '@/components/community/SpotlightSection';
import ReferralProgram from '@/components/community/ReferralProgram';

const G = '#D4AF37';
const BG = '#080B18';

export default function CommunityPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: community } = useQuery({
    queryKey: ['userCommunity', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const communities = await base44.entities.Community.filter({ creator_id: user.id }, '-created_date', 1);
      return communities?.[0];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-6 md:px-8 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6" style={{ color: G }} />
            <h1 className="text-3xl font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
              Community Hub
            </h1>
          </div>
          <p className="text-white/60">Connect with your audience, share content, and build relationships</p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {community?.id ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-2"
            >
              <DiscussionFeed communityId={community.id} />
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <SpotlightSection communityId={community.id} />
              <ReferralProgram communityId={community.id} />
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/40">Create a community to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}