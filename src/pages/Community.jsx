import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, MessageSquare, BarChart2 } from 'lucide-react';
import DiscussionFeed from '@/components/community/DiscussionFeed';
import SpotlightSection from '@/components/community/SpotlightSection';
import ReferralProgram from '@/components/community/ReferralProgram';
import SpotlightBanner from '../components/community/SpotlightBanner';
import CreatePollModal from '../components/community/CreatePollModal';
import PollCard from '../components/community/PollCard';
import ModerationActionModal from '../components/moderation/ModerationActionModal';

const G = '#D4AF37';
const BG = '#080B18';

function usePullToRefresh(onRefresh) {
  var [pullY, setPullY] = useState(0);
  var [refreshing, setRefreshing] = useState(false);
  var startY = React.useRef(0);
  var THRESHOLD = 65;
  function onTouchStart(e) {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (window.scrollY > 0) return;
    var dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPullY(Math.min(dy * 0.45, THRESHOLD + 20));
  }
  async function onTouchEnd() {
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      try { await onRefresh(); } catch {}
      finally { setRefreshing(false); }
    }
    setPullY(0);
  }
  return { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd };
}

export default function CommunityPage() {
  const qc = useQueryClient();
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [modModalOpen, setModModalOpen] = useState(false);
  const { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(async () => {
    await qc.invalidateQueries();
  });

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
    <div className="min-h-screen" style={{ background: BG }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

      {/* Pull-to-refresh indicator */}
      <motion.div
        style={{ height: pullY, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        {pullY > 10 && (
          <>
            <motion.div
              animate={refreshing ? { rotate: 360 } : { rotate: pullY * 4 }}
              transition={refreshing ? { repeat: Infinity, duration: 0.6, ease: 'linear' } : {}}
              style={{ width: 26, height: 26, borderRadius: '50%', border: '2.5px solid rgba(212,175,55,0.25)', borderTopColor: '#D4AF37', flexShrink: 0 }}
            />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: refreshing ? '#D4AF37' : 'rgba(212,175,55,0.5)' }}>
              {refreshing ? 'REFRESHING…' : pullY >= 65 ? 'RELEASE TO REFRESH' : 'PULL TO REFRESH'}
            </span>
          </>
        )}
      </motion.div>

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
          {community?.id && user?.id === community.creator_id && (
            <button onClick={() => setPollModalOpen(true)}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-[11px]"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', fontFamily: 'Barlow Condensed, sans-serif' }}>
              <BarChart2 className="w-3.5 h-3.5" /> Create Poll
            </button>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {community?.id ? (
          <>
            <SpotlightBanner communityId={community.id} isAdmin={user?.id === community.creator_id} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
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
          </>

        ) : (
          <div className="text-center py-12">
            <p className="text-white/40">Create a community to get started</p>
          </div>
        )}
      </div>
      {community?.id && (
        <>
          <CreatePollModal isOpen={pollModalOpen} onClose={() => setPollModalOpen(false)} communityId={community.id} />
          <PollCard poll={null} />
          <ModerationActionModal isOpen={modModalOpen} onClose={() => setModModalOpen(false)} targetUser={null} roomId={null} communityId={community.id} moderatorId={user?.id} />
        </>
      )}
    </div>
  );
}
