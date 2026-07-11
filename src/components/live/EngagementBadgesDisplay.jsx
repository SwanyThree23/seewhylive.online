import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Sparkles, Gift, Flame, Star, Trophy, Heart } from 'lucide-react';

const G = '#d4af37';

const BADGE_ICONS = {
  super_fan: { icon: Heart, color: '#C0392B', emoji: '❤️' },
  top_supporter: { icon: Trophy, color: '#FFD700', emoji: '🏆' },
  raid_master: { icon: Flame, color: '#FF6B6B', emoji: '🔥' },
  poll_champion: { icon: Star, color: '#C9A84C', emoji: '⭐' },
  chat_legend: { icon: Sparkles, color: '#D4AF37', emoji: '✨' },
  watch_streak: { icon: Flame, color: '#D4854A', emoji: '🔥' },
  gifter: { icon: Gift, color: '#FFB700', emoji: '🎁' },
  first_subscriber: { icon: Trophy, color: G, emoji: '👑' },
};

export default function EngagementBadgesDisplay({ roomId, userId, creatorId }) {
  const [badges, setBadges] = useState([]);

  const triggerBadgeAward = useCallback(async (badgeType, milestone) => {
    if (!userId || !creatorId) return;

    try {
      const result = await base44.functions.invoke('awardEngagementBadges', {
        user_id: userId,
        creator_id: creatorId,
        badge_type: badgeType,
        room_id: roomId,
        milestone_data: milestone,
      });

      if (result?.data?.badge_awarded) {
        displayBadgePopup(result.data.badge);
      }
    } catch (error) {
      console.error('Badge award error:', error);
    }
  }, [userId, creatorId, roomId]);

  const displayBadgePopup = (badgeData) => {
    const id = Date.now();
    const badgeInfo = BADGE_ICONS[badgeData.badge_type] || BADGE_ICONS.chat_legend;

    setBadges(prev => [...prev, { id, ...badgeData, ...badgeInfo }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setBadges(prev => prev.filter(b => b.id !== id));
    }, 5000);
  };

  // Export function for external triggers
  React.useImperativeHandle = triggerBadgeAward;

  return (
    <div className="fixed top-24 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="pointer-events-auto"
            >
              <div
                className="p-4 rounded-lg backdrop-blur-md overflow-hidden relative"
                style={{
                  background: `rgba(7,7,15,0.9)`,
                  border: `2px solid ${badge.color}`,
                  boxShadow: `0 0 20px ${badge.color}40`,
                }}
              >
                {/* Animated background glow */}
                <motion.div
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0"
                  style={{ background: `${badge.color}20` }}
                />

                <div className="relative flex items-start gap-3">
                  {/* Icon */}
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-3xl flex-shrink-0"
                  >
                    {badge.emoji}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1">
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm font-black uppercase tracking-wide"
                      style={{ color: badge.color }}
                    >
                      {badge.badge_type.replace(/_/g, ' ')}
                    </motion.p>
                    <p className="text-xs text-white/70 mt-0.5">
                      {badge.title || 'Milestone Unlocked'}
                    </p>
                    {badge.description && (
                      <p className="text-[10px] text-white/50 mt-1">{badge.description}</p>
                    )}
                  </div>

                  {/* Close */}
                  <button
                    onClick={() => setBadges(prev => prev.filter(b => b.id !== badge.id))}
                    className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0 active:scale-95"
                  >
                    ✕
                  </button>
                </div>

                {/* Progress bar */}
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 4.5 }}
                  className="absolute bottom-0 left-0 h-1 origin-left"
                  style={{ background: badge.color }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Hook for external components to trigger badges
export function useEngagementBadges() {
  return {
    triggerBadge: async (badgeType, data) => {
      // Dispatch custom event that EngagementBadgesDisplay listens to
      window.dispatchEvent(new CustomEvent('badge-awarded', { detail: { badgeType, data } }));
    },
  };
}