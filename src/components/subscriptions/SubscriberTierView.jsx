import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import TierSubscribeCard from './TierSubscribeCard';

export default function SubscriberTierView({ creatorId, userId }) {
  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['creatorTiers', creatorId],
    queryFn: () => base44.entities.SubscriptionTier.filter({ creator_id: creatorId, is_active: true }, 'sort_order', 20),
    enabled: !!creatorId,
  });

  const { data: userSubs = [] } = useQuery({
    queryKey: ['userSubs', userId, creatorId],
    queryFn: () => base44.entities.Subscription.filter({ user_id: userId, creator_id: creatorId }),
    enabled: !!userId,
  });

  const currentSub = userSubs.find(s => s.status === 'active');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-80 bg-muted animate-pulse rounded-xl" />)}
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-2xl mb-2">🎭</p>
        <p>This creator hasn't set up membership tiers yet.</p>
      </div>
    );
  }

  // Highlight the middle tier or the one most popular
  const highlightIdx = Math.floor(tiers.length / 2);

  return (
    <div className="space-y-6">
      {currentSub && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#D4AF37]/6 border border-[#D4AF37]/25 rounded-xl p-4 flex items-center gap-3"
        >
          <span className="text-2xl">⭐</span>
          <div>
            <p className="font-semibold text-[#D4AF37]">You're a <span className="text-[#D4AF37]">{currentSub.tier_name}</span> member!</p>
            <p className="text-sm text-[#C9A84C]">Your subscription renews on {new Date(currentSub.end_date).toLocaleDateString()}</p>
          </div>
        </motion.div>
      )}

      <div className={`grid gap-6 ${tiers.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : tiers.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {tiers.map((tier, idx) => (
          <TierSubscribeCard
            key={tier.id}
            tier={tier}
            currentSub={currentSub}
            userId={userId}
            creatorId={creatorId}
            isHighlighted={idx === highlightIdx && tiers.length > 1}
          />
        ))}
      </div>
    </div>
  );
}