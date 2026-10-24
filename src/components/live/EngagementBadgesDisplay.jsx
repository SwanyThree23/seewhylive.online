import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Sparkles, Gift, Flame, Star, Trophy, Heart, DollarSign, Zap, Clock, User2, Sword } from 'lucide-react';

const G = '#d4af37';

const TIER_STYLES = {
  bronze:    { color: '#CD7F32', label: 'BRONZE' },
  silver:    { color: '#C0C0C0', label: 'SILVER' },
  gold:      { color: '#D4AF37', label: 'GOLD' },
  legendary: { color: '#ff6ef7', label: 'LEGENDARY' },
};

const BADGE_ICONS = {
  super_fan:      { icon: Heart,       color: '#C0392B', emoji: '❤️',  tier: 'bronze' },
  top_supporter:  { icon: Trophy,      color: '#D4AF37', emoji: '🏆',  tier: 'gold' },
  raid_master:    { icon: Flame,       color: '#C0392B', emoji: '🔥',  tier: 'silver' },
  poll_champion:  { icon: Star,        color: '#C9A84C', emoji: '⭐',  tier: 'bronze' },
  chat_legend:    { icon: Sparkles,    color: '#D4AF37', emoji: '✨',  tier: 'gold' },
  watch_streak:   { icon: Flame,       color: '#D4854A', emoji: '🔥',  tier: 'bronze' },
  gifter:         { icon: Gift,        color: '#D4854A', emoji: '🎁',  tier: 'silver' },
  first_subscriber:{ icon: Trophy,     color: G,         emoji: '👑',  tier: 'gold' },
  big_tipper:     { icon: DollarSign,  color: '#D4AF37', emoji: '💸',  tier: 'gold' },
  hype_train:     { icon: Zap,         color: '#D4854A', emoji: '⚡',  tier: 'silver' },
  night_owl:      { icon: Clock,       color: '#7B5DA6', emoji: '🦉',  tier: 'bronze' },
  co_streamer:    { icon: User2,       color: '#6DBF7E', emoji: '🤝',  tier: 'silver' },
  battle_winner:  { icon: Sword,       color: '#C0392B', emoji: '⚔️',  tier: 'gold' },
  early_bird:     { icon: Star,        color: '#6DBF7E', emoji: '🐦',  tier: 'bronze' },
  combo_king:     { icon: Flame,       color: '#D4854A', emoji: '🔥',  tier: 'legendary' },
};

export default function EngagementBadgesDisplay({ roomId, userId, creatorId, messageCount }) {
  const [badges, setBadges] = useState([]);

  // Auto-trigger chat_legend when messageCount crosses 50
  useEffect(() => {
    if (messageCount > 50 && userId && creatorId) {
      triggerBadgeAward('chat_legend', { milestone: 'chat_legend', streak: messageCount });
    }
  }, [messageCount > 50]);

  const triggerBadgeAward = useCallback(async (badgeType, milestone) => {
    if (!userId || !creatorId) return;

    try {
      const badge = await base44.entities.EngagementBadge.create({
        user_id: userId,
        creator_id: creatorId,
        badge_type: badgeType,
        room_id: roomId,
        milestone_data: milestone,
        awarded_at: new Date().toISOString(),
      });

      if (badge?.id) {
        displayBadgePopup({ badge_type: badgeType, milestone_data: milestone, ...badge });
      }
    } catch (_) {}
  }, [userId, creatorId, roomId]);

  const displayBadgePopup = (badgeData) => {
    const id = Date.now();
    const badgeInfo = BADGE_ICONS[badgeData.badge_type] || BADGE_ICONS.chat_legend;
    const tier = badgeInfo.tier || 'bronze';
    setBadges(prev => [...prev, { id, ...badgeData, ...badgeInfo, tier }]);
    setTimeout(() => {
      setBadges(prev => prev.filter(b => b.id !== id));
    }, 6000);
  };

  React.useImperativeHandle = triggerBadgeAward;

  return (
    <div className="fixed top-24 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {badges.map((badge) => {
          const Icon = badge.icon;
          const tierStyle = TIER_STYLES[badge.tier] || TIER_STYLES.bronze;
          const isLegendary = badge.tier === 'legendary';
          const streak = badge.milestone_data?.streak;

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
                  background: 'rgba(8,11,24,0.92)',
                  border: `2px solid ${badge.color}`,
                  boxShadow: isLegendary
                    ? `0 0 24px ${tierStyle.color}80, 0 0 8px ${badge.color}40`
                    : `0 0 20px ${badge.color}40`,
                  minWidth: 200,
                }}
              >
                {/* Animated background glow */}
                <motion.div
                  animate={{ opacity: [0.15, 0.4, 0.15] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0"
                  style={{ background: `${badge.color}18` }}
                />

                {/* Legendary ring pulse */}
                {isLegendary && (
                  <motion.div
                    animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.04, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{ border: `2px solid ${tierStyle.color}`, borderRadius: 8 }}
                  />
                )}

                <div className="relative flex items-start gap-3">
                  {/* Icon */}
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-3xl flex-shrink-0"
                  >
                    {badge.emoji}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm font-black uppercase tracking-wide"
                        style={{ color: badge.color }}
                      >
                        {badge.badge_type.replace(/_/g, ' ')}
                      </motion.p>
                      {/* Tier badge */}
                      <span
                        className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded"
                        style={{ background: `${tierStyle.color}22`, color: tierStyle.color, border: `1px solid ${tierStyle.color}50` }}
                      >
                        {tierStyle.label}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 mt-0.5 truncate">
                      {badge.title || 'Milestone Unlocked'}
                    </p>
                    {badge.description && (
                      <p className="text-[10px] text-white/50 mt-1">{badge.description}</p>
                    )}
                    {streak && (
                      <p className="text-[10px] font-black mt-1" style={{ color: '#D4854A' }}>
                        🔥 {streak} streak
                      </p>
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

                {/* Progress bar countdown */}
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 5.5 }}
                  className="absolute bottom-0 left-0 h-1 origin-left"
                  style={{ background: isLegendary ? tierStyle.color : badge.color, width: '100%' }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function useEngagementBadges() {
  return {
    triggerBadge: async (badgeType, data) => {
      window.dispatchEvent(new CustomEvent('badge-awarded', { detail: { badgeType, data } }));
    },
  };
}
