import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard } from 'lucide-react';
import ActivityHistory from '@/components/dashboard/ActivityHistory';
import SavedAdTemplates from '@/components/dashboard/SavedAdTemplates';
import ChallengeProgress from '@/components/dashboard/ChallengeProgress';

const G = '#d4af37';

export default function MyDashboard() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  return (
    <div className="max-w-2xl mx-auto px-3 py-5 pb-28 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #6B4423, #d4af37)' }}>
          <LayoutDashboard className="w-5 h-5 text-black" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-black uppercase tracking-wider leading-none"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', color: G }}>
            My Dashboard
          </h1>
          <p className="text-xs text-white/40 mt-1 truncate">
            {isLoading ? 'Loading…' : (user?.full_name || user?.email || 'Your activity at a glance')}
          </p>
        </div>
      </div>

      <ActivityHistory user={user} />
      <SavedAdTemplates user={user} />
      <ChallengeProgress user={user} />
    </div>
  );
}