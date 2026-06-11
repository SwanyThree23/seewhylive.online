import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Activity as ActivityIcon, Radio, Users, Trophy, Gift, Award } from 'lucide-react';
import { format } from 'date-fns';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TYPE_CONFIG = {
  room_created:        { icon: Radio,        color: '#C0392B' },
  room_joined:         { icon: Radio,        color: '#C0392B' },
  community_joined:    { icon: Users,        color: '#C9A84C' },
  subscription:        { icon: Users,        color: '#C9A84C' },
  tip_sent:            { icon: Gift,         color: GOLD      },
  challenge_completed: { icon: Trophy,       color: '#D4AF37' },
  badge_earned:        { icon: Award,        color: '#6DBF7E' },
};

export default function ActivityPage() {
  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-created_date', 100),
  });

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  return (
    <div className="min-h-screen pb-8" style={{ background: '#080B18' }}>
      {user?.id && <MilestoneAlerts creatorId={user.id} />}
      {/* Sticky header */}
      <div className="sticky top-0 z-20 flex items-center gap-2 px-4 py-3"
        style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(212,175,55,0.1)', backdropFilter: 'blur(12px)' }}>
        <ActivityIcon className="w-5 h-5" style={{ color: GOLD }} />
        <h1 className="font-black text-lg text-white" style={T}>Activity Feed</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ActivityIcon className="w-14 h-14 mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No activity yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => {
              const cfg = TYPE_CONFIG[activity.type] || { icon: ActivityIcon, color: GOLD };
              const Icon = cfg.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-white leading-snug" style={T}>{activity.title}</p>
                    {activity.description && (
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{activity.description}</p>
                    )}
                    <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
                      {format(new Date(activity.created_date), 'PPp')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
