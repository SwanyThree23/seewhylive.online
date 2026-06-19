import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Crown, Check } from 'lucide-react';

const G = '#d4af37';

export default function SubscriptionGate({ creatorId, roomId }) {
  const [tiers, setTiers] = useState([]);
  const [userSubscription, setUserSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const tierList = await base44.entities.SubscriptionTier.filter(
          { creator_id: creatorId, is_active: true },
          'sort_order'
        );
        setTiers(tierList || []);
        
        const user = await base44.auth.me();
        if (user?.id) {
          const sub = await base44.entities.ViewerSubscription.filter({
            viewer_id: user.id,
            creator_id: creatorId,
          });
          setUserSubscription(sub?.[0]);
        }
      } catch (error) {
      }
      setLoading(false);
    };

    fetchTiers();
  }, [creatorId]);

  const handleSubscribe = async (tierId) => {
    try {
      await base44.entities.ViewerSubscription.create({
        tier_id: tierId,
        creator_id: creatorId,
        viewer_id: (await base44.auth.me())?.id,
        status: 'active',
        started_at: new Date().toISOString(),
      });
      // Refresh subscription
      const user = await base44.auth.me();
      const sub = await base44.entities.ViewerSubscription.filter({
        viewer_id: user.id,
        creator_id: creatorId,
      });
      setUserSubscription(sub?.[0]);
    } catch (error) {
    }
  };

  if (loading || tiers.length === 0) return null;

  return (
    <div className="p-3 rounded-lg" style={{ background: 'rgba(8,11,24,0.95)', border: `1px solid ${G}20` }}>
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4" style={{ color: G }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: G }}>Subscribe</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {tiers.map((tier) => {
          const isSubscribed = userSubscription?.tier_id === tier.id;
          return (
            <motion.div
              key={tier.id}
              whileHover={{ scale: 1.02 }}
              className="p-2.5 rounded-lg cursor-pointer transition-all"
              onClick={() => !isSubscribed && handleSubscribe(tier.id)}
              style={{
                background: isSubscribed ? `${tier.color}30` : 'rgba(255,255,255,0.03)',
                border: isSubscribed ? `2px solid ${tier.color}` : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-bold" style={{ color: tier.color }}>
                    {tier.name}
                  </p>
                  <p className="text-[10px] text-white/50">${tier.price}/month</p>
                </div>
                {isSubscribed && <Check className="w-4 h-4" style={{ color: tier.color }} />}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}