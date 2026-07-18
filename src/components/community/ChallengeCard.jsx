import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Target, Calendar, Users, Award } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

export default function ChallengeCard({ challenge, userParticipation, userId }) {
  const queryClient = useQueryClient();

  const joinChallengeMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.ChallengeParticipant.create({
        challenge_id: challenge.id,
        user_id: userId,
        progress: 0,
        score: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challengeParticipation'] });
      toast.success('Joined challenge successfully!');
      if (userId) {
        base44.entities.Activity.create({
          user_id: userId,
          type: 'challenge_joined',
          title: `Joined challenge: ${challenge?.title || 'Challenge'}`,
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Action failed.'),
  });

  const isParticipating = !!userParticipation;
  const progress = userParticipation ? (userParticipation.progress / challenge.goal_value) * 100 : 0;
  const isCompleted = userParticipation?.completed;

  const statusBadgeStyle = {
    upcoming: { background: 'rgba(212,175,55,0.2)', color: '#D4AF37' },
    active:   { background: 'rgba(109,191,126,0.2)',  color: '#6DBF7E' },
    completed:{ background: 'rgba(156,163,175,0.2)', color: '#9ca3af' },
  };

  const typeIcons = {
    attendance: Calendar,
    engagement: Users,
    content: Trophy,
    referral: Award,
    custom: Target,
  };

  const Icon = typeIcons[challenge.type] || Target;

  const btnBase = {
    width: '100%', padding: '10px 0', borderRadius: 8, fontWeight: 700, fontSize: 13,
    cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    ...T,
  };

  return (
    <div style={{
      background: isCompleted ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon className="w-6 h-6" style={{ color: '#7B5DA6' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: '#fff', margin: '0 0 2px', ...T }}>{challenge.title}</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, ...T }}>{challenge.description}</p>
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99,
            ...(statusBadgeStyle[challenge.status] || statusBadgeStyle.completed),
            flexShrink: 0, ...T,
          }}>
            {challenge.status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Challenge Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)' }}>
            <Calendar className="w-4 h-4" />
            <span>
              {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)' }}>
            <Users className="w-4 h-4" />
            <span>{challenge.participant_count} participants</span>
          </div>
        </div>

        {/* Goal */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', ...T }}>Goal</span>
            <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', ...T }}>
              {challenge.goal_value} {challenge.goal_type}
            </span>
          </div>
          {isParticipating && (
            <>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: GOLD, borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                <span>{userParticipation.progress} / {challenge.goal_value}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </>
          )}
        </div>

        {/* Reward */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(212,175,55,0.08)', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy className="w-4 h-4" style={{ color: '#7B5DA6' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', ...T }}>Reward</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#7B5DA6', ...T }}>{challenge.reward_value}</span>
        </div>

        {/* Action Button */}
        {challenge.status === 'active' && (
          <>
            {!isParticipating ? (
              <button onClick={() => joinChallengeMutation.mutate()} style={{ ...btnBase, background: '#800020', color: '#fff' }}>
                Join Challenge
              </button>
            ) : isCompleted ? (
              <button disabled style={{ ...btnBase, background: '#4A9B5E', color: '#fff', cursor: 'default' }}>
                <Trophy className="w-4 h-4" /> Completed!
              </button>
            ) : (
              <button style={{ ...btnBase, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
                View Progress
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
