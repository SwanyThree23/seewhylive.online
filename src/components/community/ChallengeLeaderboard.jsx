import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Medal, Award } from 'lucide-react';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

export default function ChallengeLeaderboard({ challengeId }) {
  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['leaderboard', challengeId],
    queryFn: async () => {
      const data = await base44.entities.ChallengeParticipant.filter(
        { challenge_id: challengeId },
        '-score'
      );
      return data;
    },
  });

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Trophy className="w-5 h-5" style={{ color: '#eab308' }} />;
      case 2: return <Medal className="w-5 h-5" style={{ color: '#9ca3af' }} />;
      case 3: return <Medal className="w-5 h-5" style={{ color: '#ea580c' }} />;
      default: return <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>#{rank}</span>;
    }
  };

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) return { background: 'rgba(234,179,8,0.2)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)' };
    if (rank === 2) return { background: 'rgba(156,163,175,0.2)', color: '#9ca3af', border: '1px solid rgba(156,163,175,0.3)' };
    if (rank === 3) return { background: 'rgba(234,88,12,0.2)', color: '#fb923c', border: '1px solid rgba(234,88,12,0.3)' };
    return { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' };
  };

  if (isLoading) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)', ...T }}>
        Loading leaderboard...
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0' }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 2px', ...T }}>
          <Trophy className="w-5 h-5" style={{ color: '#a78bfa' }} />
          Leaderboard
        </h3>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, ...T }}>Top performers in this challenge</p>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {participants.slice(0, 10).map((participant, index) => {
          const rank = index + 1;
          const initials = participant.user_id.slice(0, 2).toUpperCase();
          return (
            <div
              key={participant.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8,
                background: rank <= 3 ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
                border: rank <= 3 ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
              }}
            >
              {/* Rank */}
              <div style={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                {getRankIcon(rank)}
              </div>

              {/* Avatar */}
              <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: 'rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: GOLD, flexShrink: 0 }}>
                {initials}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: '#fff', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...T }}>
                  User {participant.user_id.slice(0, 8)}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, ...T }}>
                  Progress: {participant.progress}
                </p>
              </div>

              {/* Score */}
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99,
                  display: 'inline-block', ...getRankBadgeStyle(rank), ...T,
                }}>
                  {participant.score} pts
                </span>
                {participant.completed && (
                  <div style={{ fontSize: 10, color: '#4ade80', marginTop: 2, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                    <Award className="w-3 h-3" />
                    Completed
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {participants.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.4)', ...T }}>
            No participants yet. Be the first to join!
          </div>
        )}
      </div>
    </div>
  );
}
