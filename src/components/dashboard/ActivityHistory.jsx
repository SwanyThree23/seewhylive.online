import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Radio, Users, Star, DollarSign, Trophy, Award, Activity as ActivityIcon,
} from 'lucide-react';

const G = '#d4af37';

const TYPE_ICON = {
  room_created: Radio,
  room_joined: Users,
  community_joined: Users,
  subscription: Star,
  tip_sent: DollarSign,
  challenge_completed: Trophy,
  badge_earned: Award,
};

export default function ActivityHistory({ user }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['my-activity', user?.id],
    queryFn: () => base44.entities.Activity.filter({ user_id: user.id }, '-created_date', 25),
    enabled: !!user?.id,
  });

  return (
    <section
      className="rounded-2xl p-4"
      style={{ background: 'rgba(13,16,34,0.95)', border: '1px solid rgba(212,175,55,0.15)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <ActivityIcon className="w-4 h-4" style={{ color: G }} />
        <h2 className="text-sm font-black uppercase tracking-widest"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: G }}>
          Activity History
        </h2>
      </div>

      {isLoading && <p className="text-xs text-white/40 py-4 text-center">Loading…</p>}

      {!isLoading && items.length === 0 && (
        <p className="text-xs text-white/40 py-4 text-center">
          Nothing yet — join a room or send a tip and it'll show up here.
        </p>
      )}

      <div className="space-y-1.5">
        {items.map((item) => {
          const Icon = TYPE_ICON[item.type] || ActivityIcon;
          return (
            <div key={item.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(212,175,55,0.12)' }}>
                <Icon className="w-4 h-4" style={{ color: G }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/85 leading-tight">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-white/45 mt-0.5 leading-tight">{item.description}</p>
                )}
                {item.created_date && (
                  <p className="text-xs text-white/30 mt-1">
                    {formatDistanceToNow(new Date(item.created_date), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}