import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Check } from 'lucide-react';

const G = '#d4af37';

export default function ChallengeProgress({ user }) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['my-challenges', user?.id],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges-for-progress'],
    queryFn: () => base44.entities.Challenge.list('-created_date', 100),
    enabled: !!user?.id,
  });

  const byId = Object.fromEntries(challenges.map((c) => [c.id, c]));

  return (
    <section
      className="rounded-2xl p-4"
      style={{ background: 'rgba(13,16,34,0.95)', border: '1px solid rgba(212,175,55,0.15)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4" style={{ color: G }} />
        <h2 className="text-sm font-black uppercase tracking-widest"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: G }}>
          Challenge Progress
        </h2>
      </div>

      {isLoading && <p className="text-xs text-white/40 py-4 text-center">Loading…</p>}

      {!isLoading && entries.length === 0 && (
        <p className="text-xs text-white/40 py-4 text-center">
          You're not in any challenges yet — check the Challenges hub.
        </p>
      )}

      <div className="space-y-2">
        {entries.map((entry) => {
          const challenge = byId[entry.challenge_id];
          const goal = challenge?.goal_value || 0;
          const pct = goal > 0 ? Math.min(100, Math.round(((entry.progress || 0) / goal) * 100)) : 0;

          return (
            <div key={entry.id} className="px-3 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-white/85 leading-tight truncate">
                  {challenge?.title || 'Challenge'}
                </p>
                {entry.completed ? (
                  <span className="flex items-center gap-1 text-xs font-bold shrink-0" style={{ color: '#6DBF7E' }}>
                    <Check className="w-3 h-3" /> Done
                  </span>
                ) : (
                  <span className="text-xs font-bold shrink-0" style={{ color: G }}>{pct}%</span>
                )}
              </div>

              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full"
                  style={{ width: `${entry.completed ? 100 : pct}%`, background: entry.completed ? '#6DBF7E' : G }} />
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                <span>{entry.progress || 0}{goal ? ` / ${goal}` : ''}</span>
                {entry.score > 0 && <span>{entry.score} pts</span>}
                {entry.rank && <span>Rank #{entry.rank}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}