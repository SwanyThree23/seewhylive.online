import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Zap, Users, TrendingUp, Crown, Flame } from 'lucide-react';

const G = '#D4AF37';
const BG = '#080B18';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

const BADGE_ICONS = {
  super_fan: '⭐',
  top_supporter: '💎',
  raid_master: '⚔️',
  poll_champion: '📊',
  chat_legend: '💬',
  watch_streak: '🔥',
  gifter: '🎁',
  first_subscriber: '👑',
};

export default function LeaderboardPanel({ roomId }) {
  const [activeTab, setActiveTab] = useState('supporters');

  // Top supporters (by tips)
  const { data: topSupporters } = useQuery({
    queryKey: ['topSupporters', roomId],
    queryFn: () =>
      base44.entities.ViewerPoints.filter(
        { room_id: roomId },
        '-tips_sent_count',
        10
      ),
  });

  // Top raiders
  const { data: topRaiders } = useQuery({
    queryKey: ['topRaiders', roomId],
    queryFn: async () => {
      const raids = await base44.entities.RaidEvent.filter(
        { from_room_id: roomId, status: 'completed' },
        '-viewer_count_sent',
        10
      );
      const grouped = {};
      raids.forEach(raid => {
        if (!grouped[raid.from_creator_id]) {
          grouped[raid.from_creator_id] = {
            creator_id: raid.from_creator_id,
            creator_name: raid.from_creator_username,
            total_viewers: 0,
            raid_count: 0,
          };
        }
        grouped[raid.from_creator_id].total_viewers += raid.viewer_count_sent;
        grouped[raid.from_creator_id].raid_count += 1;
      });
      return Object.values(grouped).sort((a, b) => b.total_viewers - a.total_viewers).slice(0, 10);
    },
  });

  // Most active viewers
  const { data: activeViewers } = useQuery({
    queryKey: ['activeViewers', roomId],
    queryFn: () =>
      base44.entities.ViewerPoints.filter(
        { room_id: roomId },
        '-watch_minutes',
        10
      ),
  });

  // Recent badges earned
  const { data: badges } = useQuery({
    queryKey: ['recentBadges', roomId],
    queryFn: () =>
      base44.entities.EngagementBadge.filter(
        { creator_id: roomId },
        '-awarded_at',
        8
      ),
  });

  const renderLeaderboard = () => {
    switch (activeTab) {
      case 'supporters':
        return (
          <div className="space-y-1.5">
            {topSupporters?.map((viewer, idx) => (
              <motion.div
                key={viewer.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-center justify-center w-6 h-6 shrink-0 rounded-lg text-xs font-bold" style={{ background: `${G}20`, color: G }}>
                  {idx < 3 ? ['👑', '🥈', '🥉'][idx] : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">User {viewer.user_id?.slice(0, 8)}</p>
                  <p className="text-[10px] text-amber-300">{viewer.tips_sent_count} tips</p>
                </div>
              </motion.div>
            ))}
          </div>
        );
      case 'raiders':
        return (
          <div className="space-y-1.5">
            {topRaiders?.map((raider, idx) => (
              <motion.div
                key={raider.creator_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-center justify-center w-6 h-6 shrink-0 rounded-lg text-xs font-bold" style={{ background: `${G}20`, color: G }}>
                  {idx < 3 ? ['⚔️', '🔱', '⚡'][idx] : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{raider.creator_name}</p>
                  <p className="text-[10px] text-emerald-300">{raider.total_viewers} viewers • {raider.raid_count} raids</p>
                </div>
              </motion.div>
            ))}
          </div>
        );
      case 'active':
        return (
          <div className="space-y-1.5">
            {activeViewers?.map((viewer, idx) => (
              <motion.div
                key={viewer.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-center justify-center w-6 h-6 shrink-0 rounded-lg text-xs font-bold" style={{ background: `${G}20`, color: G }}>
                  {idx < 3 ? ['🔥', '💫', '⭐'][idx] : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">User {viewer.user_id?.slice(0, 8)}</p>
                  <p className="text-[10px] text-[#6DBF7E]">{Math.round(viewer.watch_minutes)} min • {viewer.points || 0} pts</p>
                </div>
              </motion.div>
            ))}
          </div>
        );
      case 'badges':
        return (
          <div className="grid grid-cols-4 gap-2">
            {badges?.map((badge, idx) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex flex-col items-center p-2 rounded-lg text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}
              >
                <div className="text-xl mb-1">{BADGE_ICONS[badge.badge_type] || '🏅'}</div>
                <p className="text-[11px] font-bold text-white truncate leading-tight">{badge.title}</p>
              </motion.div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: BG, border: `1px solid ${BORDER}` }}>
      {/* Header */}
      <div className="px-3 py-3" style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4" style={{ color: G }} />
          <h3 className="text-xs font-bold uppercase" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Engagement Hub
          </h3>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {[
            { id: 'supporters', label: 'Top Supporters', icon: '💎' },
            { id: 'raiders', label: 'Top Raiders', icon: '⚔️' },
            { id: 'active', label: 'Most Active', icon: '🔥' },
            { id: 'badges', label: 'Badges', icon: '🏅' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 px-2 py-1.5 rounded text-[10px] font-bold transition-all"
              style={{
                background: activeTab === tab.id ? `${G}20` : 'rgba(255,255,255,0.03)',
                color: activeTab === tab.id ? G : 'rgba(255,255,255,0.4)',
                border: activeTab === tab.id ? `1px solid ${G}40` : `1px solid ${BORDER}`,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-3 max-h-80 overflow-y-auto">
        {renderLeaderboard()}
      </div>
    </div>
  );
}