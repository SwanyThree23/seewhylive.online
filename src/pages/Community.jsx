import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Users, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import DiscussionFeed from '@/components/community/DiscussionFeed';
import SpotlightSection from '@/components/community/SpotlightSection';
import ReferralProgram from '@/components/community/ReferralProgram';
import SpotlightBanner from '../components/community/SpotlightBanner';
import CreatePollModal from '../components/community/CreatePollModal';
import PollCard from '../components/community/PollCard';
import ModerationActionModal from '../components/moderation/ModerationActionModal';
import AnnouncementFeed from '../components/community/AnnouncementFeed';
import UnifiedChat from '../components/live/UnifiedChat';
import InteractivePollingSystem from '../components/live/InteractivePollingSystem';
import ShareModal from '../components/live/ShareModal';
import AnnouncementPanel from '../components/community/AnnouncementPanel';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';
import AnnouncementScheduler from '../components/admin/AnnouncementScheduler';
import ChallengeAnalytics from '../components/admin/ChallengeAnalytics';
import ReferralConfig from '../components/admin/ReferralConfig';

const G = '#D4AF37';
const BG = '#080B18';

export default function CommunityPage() {
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [modModalOpen, setModModalOpen] = useState(false);

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

  const { data: activePolls = [] } = useQuery({
    queryKey: ['communityPolls', community?.id],
    queryFn: () => base44.entities.Poll.filter({ community_id: community.id, status: 'active' }, '-created_date', 5),
    enabled: !!community?.id,
  });

  const { data: activeChallenge } = useQuery({
    queryKey: ['communityActiveChallenge', community?.id],
    queryFn: async () => {
      if (!community?.id) return null;
      const challenges = await base44.entities.Challenge.filter({ community_id: community.id, status: 'active' }, 'end_date', 1);
      return challenges?.[0] ?? null;
    },
    enabled: !!community?.id,
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
          <>
            {/* Spotlight Banner — full width above the grid */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <SpotlightBanner communityId={community.id} isAdmin={community.creator_id === user?.id} />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Main Feed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="md:col-span-2 space-y-6"
              >
                {/* Announcements */}
                <AnnouncementFeed communityId={community.id} />

                {/* Discussion */}
                <DiscussionFeed communityId={community.id} />

                {/* Active Polls */}
                {activePolls.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                      Active Polls
                    </h2>
                    {activePolls.map(poll => (
                      <PollCard key={poll.id} poll={poll} />
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <SpotlightSection communityId={community.id} />

                {/* Announcement Panel (creator tool) */}
                {community.creator_id === user?.id && (
                  <AnnouncementPanel communityId={community.id} userId={user?.id} />
                )}

                {/* Creator admin tools */}
                {community.creator_id === user?.id && (
                  <>
                    <AnnouncementScheduler communityId={community.id} userId={user?.id} />
                    <ChallengeAnalytics communityId={community.id} />
                    <ReferralConfig communityId={community.id} />
                  </>
                )}

                {/* Challenge Leaderboard */}
                {activeChallenge?.id && (
                  <ChallengeLeaderboard challengeId={activeChallenge.id} />
                )}

                <ReferralProgram communityId={community.id} />
              </motion.div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/40">Create a community to get started</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '16px 0 24px' }}>
          {[
            { label: '👥 All Communities',   href: 'Communities'       },
            { label: '⚙️ Admin',             href: 'CommunityAdmin'    },
            { label: '📈 Growth',            href: 'CommunityGrowth'   },
            { label: '⚡ Settings',          href: 'CommunitySettings' },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span className="font-black uppercase text-[10px] px-3 py-1.5 rounded-xl" style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', display: 'block', cursor: 'pointer' }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {community?.id && (
        <>
          <CreatePollModal isOpen={pollModalOpen} onClose={() => setPollModalOpen(false)} communityId={community.id} />
          <ModerationActionModal isOpen={modModalOpen} onClose={() => setModModalOpen(false)} targetUser={null} roomId={null} communityId={community.id} moderatorId={user?.id} />
        </>
      )}

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {community?.id && <InteractivePollingSystem communityId={community.id} userId={user?.id} isHost={false} />}
        {community?.id && <UnifiedChat roomId={community.id} currentUser={user} isHost={false} />}
        <ShareModal isOpen={false} onClose={() => {}} url={window.location.href} title={community?.name || 'Community'} />
      </div>
    </div>
  );
}
