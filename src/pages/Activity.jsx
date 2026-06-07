import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity as ActivityIcon, Radio, Users, Trophy, Gift, Award, Star, Bell } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const GREEN   = '#6DBF7E';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const TYPE_CONFIG = {
  room_created:        { icon: Radio,         color: CRIMSON,  label: 'Stream'        },
  room_joined:         { icon: Radio,         color: '#C0392B', label: 'Stream'       },
  community_joined:    { icon: Users,         color: '#C9A84C', label: 'Community'    },
  subscription:        { icon: Star,          color: GOLD,     label: 'Subscription'  },
  tip_sent:            { icon: Gift,          color: GOLD,     label: 'Tip'           },
  tip_received:        { icon: Gift,          color: GREEN,    label: 'Tip'           },
  challenge_completed: { icon: Trophy,        color: GOLD,     label: 'Challenge'     },
  badge_earned:        { icon: Award,         color: GREEN,    label: 'Badge'         },
  follow:              { icon: Users,         color: '#4fc3f7', label: 'Follow'       },
  announcement:        { icon: Bell,          color: '#a78bfa', label: 'Announcement' },
};

const FILTER_TABS = [
  { id: 'all',      label: 'All' },
  { id: 'streams',  label: 'Streams',  types: ['room_created', 'room_joined'] },
  { id: 'tips',     label: 'Tips',     types: ['tip_sent', 'tip_received'] },
  { id: 'social',   label: 'Social',   types: ['community_joined', 'follow', 'subscription'] },
  { id: 'rewards',  label: 'Rewards',  types: ['challenge_completed', 'badge_earned'] },
];

function dateLabel(date) {
  if (isToday(date))     return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMM d');
}

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-created_date', 150),
  });

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return activities;
    const tab = FILTER_TABS.find(t => t.id === activeFilter);
    if (!tab?.types) return activities;
    return activities.filter(a => tab.types.includes(a.type));
  }, [activities, activeFilter]);

  // Group by day
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(a => {
      const d = new Date(a.created_date);
      const key = format(d, 'yyyy-MM-dd');
      if (!groups[key]) groups[key] = { label: dateLabel(d), items: [] };
      groups[key].items.push(a);
    });
    return Object.values(groups);
  }, [filtered]);

  return (
    <div className="min-h-screen pb-8" style={{ background: '#080B18' }}>

      {/* Sticky header */}
      <div className="sticky top-0 z-20"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-5 h-5" style={{ color: GOLD }} />
            <h1 className="font-black text-lg text-white" style={T}>Activity Feed</h1>
          </div>
          <span className="text-[10px] font-black px-2 py-1 rounded-lg"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>
            {filtered.length} events
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {FILTER_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveFilter(tab.id)}
              className="px-3 py-1.5 rounded-full shrink-0 font-black uppercase text-[10px] transition-all"
              style={{
                ...T,
                background: activeFilter === tab.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                border:     `1px solid ${activeFilter === tab.id ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color:      activeFilter === tab.id ? GOLD : 'rgba(255,255,255,0.4)',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <ActivityIcon className="w-14 h-14 mb-3" style={{ color: 'rgba(255,255,255,0.08)' }} />
            <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No activity yet</p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.12)', ...T }}>Events will appear here as you interact</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeFilter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-6">
              {grouped.map((group, gi) => (
                <div key={gi}>
                  {/* Day label */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-black uppercase shrink-0" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
                      {group.label}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>

                  <div className="space-y-2">
                    {group.items.map((activity, i) => {
                      const cfg  = TYPE_CONFIG[activity.type] || { icon: ActivityIcon, color: GOLD, label: 'Event' };
                      const Icon = cfg.icon;
                      const ago  = formatDistanceToNow(new Date(activity.created_date), { addSuffix: true });
                      return (
                        <motion.div key={activity.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-start gap-3 p-3 rounded-xl"
                          style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(255,255,255,0.05)' }}>

                          {/* Icon */}
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
                            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Type chip */}
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                                style={{ background: `${cfg.color}12`, color: cfg.color, ...T }}>
                                {cfg.label}
                              </span>
                            </div>
                            <p className="font-black text-sm text-white leading-snug" style={T}>{activity.title}</p>
                            {activity.description && (
                              <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {activity.description}
                              </p>
                            )}
                          </div>

                          <span className="text-[9px] shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>{ago}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
