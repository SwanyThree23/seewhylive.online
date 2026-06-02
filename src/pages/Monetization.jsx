import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp } from 'lucide-react';
import PayPerViewManager from '@/components/monetization/PayPerViewManager';
import SubscriptionManager from '@/components/monetization/SubscriptionManager';

const G = '#D4AF37';
const BG = '#080B18';

export default function MonetizationPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: room } = useQuery({
    queryKey: ['userRoom', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const rooms = await base44.entities.Room.filter({ creator_id: user.id }, '-viewer_count', 1);
      return rooms?.[0];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-6 md:px-8 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6" style={{ color: G }} />
            <h1 className="text-3xl font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
              Monetization
            </h1>
          </div>
          <p className="text-white/60">Manage subscriptions, PPV events, and pricing</p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* PPV Section */}
          {room?.id && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <PayPerViewManager roomId={room.id} />
            </motion.div>
          )}

          {/* Subscriptions Section */}
          {user?.id && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <SubscriptionManager creatorId={user.id} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}