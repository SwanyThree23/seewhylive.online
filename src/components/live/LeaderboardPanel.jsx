import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const G      = '#D4AF37';
const BG     = '#080B18';
const PANEL  = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

const BADGE_ICONS = {
  super_fan: '⭐', top_supporter: '💎', raid_master: '⚔️',
  poll_champion: '📊', chat_legend: '💬', watch_streak: '🔥',
  gifter: '🎁', first_subscriber: '👑',
  big_tipper: '💸', hype_train: '⚡', night_owl: '🦉',
  co_streamer: '🤝', battle_winner: '⚔️', early_bird: '🐦', combo_king: '🔥',
};

const RANK_MEDALS = ['👑', '🥈', '🥉'];
const RAID_MEDALS = ['⚔️', '🔱', '⚡'];
const ACTIVE_MEDALS = ['🔥', '💫', '⭐'];

const TIME_RANGES = [
  { id: 'stream', label: 'This Stream' },
  { id: 'alltime', label: 'All Time'   },
];

function RankChange({ change }) {
  if (change > 0) return <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#6DBF7E]"><TrendingUp className="w-2.5 h-2.5" />+{change}</span>;
  if (change < 0) return <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#C0392B]"><TrendingDown className="w-2.5 h-2.5" />{change}</span>;
  return <span className="text-[9px] font-bold text-white/20"><Minus className="w-2.5 h-2.5" /></span>;
}

function LeaderRow({ item, idx, medals, subLine, showRankChange }) {
  const isFirst = idx === 0;
  return (
    <motion.div
      key={item.id || item.creator_id || idx}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{
        background: isFirst ? `${G}10` : 'rgba(255,255,255,0.03)',
        border: isFirst ? `1px solid ${G}25` : '1px solid transparent',
      }}
    >
      <div className="flex items-center justify-center w-6 h-6 shrink-0 rounded-lg text-xs font-bold"
        style={{ background: isFirst ? `${G}25` : `${G}12`, color: G }}>
        {idx < 3 ? medals[idx] : idx + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{item.display_name || item.creator_name || `User ${(item.user_id || '').slice(0, 8)}`}</p>
        <p className="text-[10px] truncate" style={{ color: isFirst ? G : 'rgba(109,191,126,0.8)' }}>{subLine}</p>
      </div>
      {showRankChange && <RankChange change={item.rank_change ?? 0} />}
    </motion.div>
  );
}

const TABS = [
  { id: 'supporters', label: '💎 Supporters' },
  { id: 'chatters',   label: '💬 Chatters'   },
  { id: 'raiders',    label: '⚔️ Raiders'    },
  { id: 'active',     label: '🔥 Active'     },
  { id: 'badges',     label: '🏅 Badges'     },
];

export default function LeaderboardPanel({ roomId }) {
  const [activeTab, setActiveTab] = useState('supporters');
  const [timeRange, setTimeRange] = useState('stream');
  const prevRanksRef = useRef({});

  const addRankChanges = (items, key) => {
    const prev = prevRanksRef.current[key] || {};
    const result = items.map((item, idx) => {
      const id  = item.user_id || item.creator_id || idx;
      const was = prev[id];
      return { ...item, rank_change: was != null ? was - idx : 0 };
    });
    const next = {};
    items.forEach((item, idx) => { next[item.user_id || item.creator_id || idx] = idx; });
    prevRanksRef.current = { ...prevRanksRef.current, [key]: next };
    return result;
  };

  const { data: rawSupporters } = useQuery({
    queryKey: ['topSupporters', roomId, timeRange],
    queryFn: () => base44.entities.ViewerPoints.filter({ room_id: roomId }, '-tips_sent_count', 10),
    refetchInterval: 30000,
  });
  const topSupporters = rawSupporters ? addRankChanges(rawSupporters, 'supporters') : [];

  const { data: rawChatters } = useQuery({
    queryKey: ['topChatters', roomId, timeRange],
    queryFn: () => base44.entities.ViewerPoints.filter({ room_id: roomId }, '-message_count', 10),
    refetchInterval: 30000,
  });
  const topChatters = rawChatters ? addRankChanges(rawChatters, 'chatters') : [];

  const { data: rawRaiders } = useQuery({
    queryKey: ['topRaiders', roomId],
    queryFn: async () => {
      const raids = await base44.entities.RaidEvent.filter({ from_room_id: roomId, status: 'completed' }, '-viewer_count_sent', 10);
      const grouped = {};
      raids.forEach(raid => {
        if (!grouped[raid.from_creator_id]) {
          grouped[raid.from_creator_id] = { creator_id: raid.from_creator_id, creator_name: raid.from_creator_username, total_viewers: 0, raid_count: 0 };
        }
        grouped[raid.from_creator_id].total_viewers += raid.viewer_count_sent;
        grouped[raid.from_creator_id].raid_count    += 1;
      });
      return Object.values(grouped).sort((a, b) => b.total_viewers - a.total_viewers).slice(0, 10);
    },
    refetchInterval: 60000,
  });
  const topRaiders = rawRaiders ? addRankChanges(rawRaiders, 'raiders') : [];

  const { data: rawActive } = useQuery({
    queryKey: ['activeViewers', roomId, timeRange],
    queryFn: () => base44.entities.ViewerPoints.filter({ room_id: roomId }, '-watch_minutes', 10),
    refetchInterval: 30000,
  });
  const activeViewers = rawActive ? addRankChanges(rawActive, 'active') : [];

  const { data: badges } = useQuery({
    queryKey: ['recentBadges', roomId],
    queryFn: () => base44.entities.EngagementBadge.filter({ creator_id: roomId }, '-awarded_at', 8),
    refetchInterval: 30000,
  });

  const totals = {
    supporters: topSupporters.reduce((s, v) => s + (v.tips_sent_count || 0), 0),
    chatters:   topChatters.reduce((s, v) => s + (v.message_count || 0), 0),
    raiders:    topRaiders.reduce((s, r) => s + r.total_viewers, 0),
    active:     activeViewers.reduce((s, v) => s + (v.points || 0), 0),
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'supporters':
        return topSupporters.length
          ? topSupporters.map((v, i) => <LeaderRow key={v.id || i} item={v} idx={i} medals={RANK_MEDALS} subLine={`${v.tips_sent_count || 0} tips`} showRankChange />)
          : <Empty />;

      case 'chatters':
        return topChatters.length
          ? topChatters.map((v, i) => <LeaderRow key={v.id || i} item={v} idx={i} medals={['💬', '🗣️', '📢']} subLine={`${v.message_count || 0} messages`} showRankChange />)
          : <Empty />;

      case 'raiders':
        return topRaiders.length
          ? topRaiders.map((r, i) => <LeaderRow key={r.creator_id || i} item={{ ...r, display_name: r.creator_name }} idx={i} medals={RAID_MEDALS} subLine={`${r.total_viewers} viewers · ${r.raid_count} raids`} showRankChange />)
          : <Empty />;

      case 'active':
        return activeViewers.length
          ? activeViewers.map((v, i) => <LeaderRow key={v.id || i} item={v} idx={i} medals={ACTIVE_MEDALS} subLine={`${Math.round(v.watch_minutes || 0)}m · ${v.points || 0} pts`} showRankChange />)
          : <Empty />;

      case 'badges':
        return badges?.length ? (
          <div className="grid grid-cols-4 gap-2">
            {badges.map((badge, idx) => (
              <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                className="flex flex-col items-center p-2 rounded-lg text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
                <div className="text-xl mb-1">{BADGE_ICONS[badge.badge_type] || '🏅'}</div>
                <p className="text-[10px] font-bold text-white truncate leading-tight">{badge.title || badge.badge_type?.replace(/_/g, ' ')}</p>
              </motion.div>
            ))}
          </div>
        ) : <Empty />;

      default: return null;
    }
  };

  const showTimeRange = ['supporters', 'chatters', 'active'].includes(activeTab);

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: BG, border: `1px solid ${BORDER}` }}>
      {/* Header */}
      <div className="px-3 pt-3 pb-0" style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4" style={{ color: G }} />
          <h3 className="text-xs font-bold uppercase flex-1" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Engagement Hub
          </h3>
          {showTimeRange && (
            <div className="flex gap-1">
              {TIME_RANGES.map(r => (
                <button key={r.id} onClick={() => setTimeRange(r.id)}
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold transition-all"
                  style={timeRange === r.id
                    ? { background: `${G}20`, color: G }
                    : { color: 'rgba(255,255,255,0.3)' }}>
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="shrink-0 px-2 py-1.5 rounded-t text-[10px] font-bold transition-all whitespace-nowrap"
              style={{
                background: activeTab === tab.id ? `${G}20` : 'rgba(255,255,255,0.03)',
                color: activeTab === tab.id ? G : 'rgba(255,255,255,0.4)',
                borderBottom: activeTab === tab.id ? `2px solid ${G}` : '2px solid transparent',
              }}>
              {tab.label}
              {totals[tab.id] != null && totals[tab.id] > 0 && (
                <span className="ml-1 text-[9px] font-mono" style={{ color: activeTab === tab.id ? G : 'rgba(255,255,255,0.2)' }}>
                  {totals[tab.id].toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="px-3 py-3 max-h-80 overflow-y-auto space-y-1.5">
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Empty() {
  return (
    <div className="py-8 text-center text-[10px] text-white/20">
      No data yet
    </div>
  );
}
