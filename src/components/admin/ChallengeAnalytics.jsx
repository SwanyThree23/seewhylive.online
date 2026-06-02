import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, TrendingUp, Award, Target, Zap } from 'lucide-react';

const CARD = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden' };

function StatCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div style={CARD}>
      <div style={{ padding:'16px 20px 12px' }}>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:4 }}>{label}</p>
        <p style={{ fontSize:30, fontWeight:900, color: color || '#fff', margin:0, fontFamily:'Barlow Condensed, sans-serif' }}>{value}</p>
      </div>
      <div style={{ padding:'0 20px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(255,255,255,0.4)' }}>
          {Icon && <Icon style={{ width:16, height:16 }} />}
          <span>{sub}</span>
        </div>
      </div>
    </div>
  );
}

export default function ChallengeAnalytics({ communityId }) {
  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges', communityId],
    queryFn: () => base44.entities.Challenge.filter({ community_id: communityId }),
  });

  const { data: allParticipants = [] } = useQuery({
    queryKey: ['allChallengeParticipants'],
    queryFn: () => base44.entities.ChallengeParticipant.list(),
  });

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  const totalParticipations = allParticipants.filter(p =>
    challenges.some(c => c.id === p.challenge_id)
  ).length;

  const completedParticipations = allParticipants.filter(p =>
    challenges.some(c => c.id === p.challenge_id) && p.completed
  ).length;

  const avgParticipantsPerChallenge = challenges.length > 0
    ? (totalParticipations / challenges.length).toFixed(1)
    : 0;

  const completionRate = totalParticipations > 0
    ? ((completedParticipations / totalParticipations) * 100).toFixed(1)
    : 0;

  // Challenge performance details
  const challengeStats = challenges.map(challenge => {
    const participants = allParticipants.filter(p => p.challenge_id === challenge.id);
    const completed = participants.filter(p => p.completed).length;
    const rate = participants.length > 0 ? ((completed / participants.length) * 100).toFixed(1) : 0;

    return {
      ...challenge,
      participantCount: participants.length,
      completedCount: completed,
      completionRate: rate,
    };
  }).sort((a, b) => b.participantCount - a.participantCount);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Overview Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
        <StatCard label="Total Challenges" value={challenges.length} icon={Trophy} sub={`${activeChallenges.length} active`} />
        <StatCard label="Total Participants" value={totalParticipations} color="#60a5fa" icon={Users} sub="All challenges" />
        <StatCard label="Avg Participants" value={avgParticipantsPerChallenge} color="#a78bfa" icon={TrendingUp} sub="Per challenge" />
        <StatCard label="Completion Rate" value={`${completionRate}%`} color="#4ade80" icon={Award} sub="Success rate" />
      </div>

      {/* Challenge Performance */}
      <div style={CARD}>
        <div style={{ padding:'16px 20px 12px' }}>
          <p style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:4 }}>Challenge Performance</p>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>Engagement metrics for each challenge</p>
        </div>
        <div style={{ padding:'0 20px 20px' }}>
          {challengeStats.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 0', color:'rgba(255,255,255,0.3)' }}>
              <Trophy style={{ width:48, height:48, margin:'0 auto 16px', opacity:0.3 }} />
              <p>No challenges created yet</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {challengeStats.map((challenge) => (
                <div key={challenge.id} style={{ border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:16 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <h3 style={{ fontWeight:600, color:'#fff', margin:0 }}>{challenge.title}</h3>
                        <span style={{
                          fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99,
                          background: challenge.status === 'active' ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.08)',
                          color: challenge.status === 'active' ? '#D4AF37' : 'rgba(255,255,255,0.5)',
                        }}>
                          {challenge.status}
                        </span>
                      </div>
                      <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>{challenge.description}</p>
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:12 }}>
                    <div style={{ background:'rgba(59,130,246,0.08)', borderRadius:8, padding:12, textAlign:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginBottom:4 }}>
                        <Users style={{ width:16, height:16, color:'#60a5fa' }} />
                        <span style={{ fontSize:12, color:'#60a5fa', fontWeight:600 }}>Participants</span>
                      </div>
                      <p style={{ fontSize:24, fontWeight:900, color:'#60a5fa', margin:0, fontFamily:'Barlow Condensed, sans-serif' }}>{challenge.participantCount}</p>
                    </div>

                    <div style={{ background:'rgba(34,197,94,0.08)', borderRadius:8, padding:12, textAlign:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginBottom:4 }}>
                        <Award style={{ width:16, height:16, color:'#4ade80' }} />
                        <span style={{ fontSize:12, color:'#4ade80', fontWeight:600 }}>Completed</span>
                      </div>
                      <p style={{ fontSize:24, fontWeight:900, color:'#4ade80', margin:0, fontFamily:'Barlow Condensed, sans-serif' }}>{challenge.completedCount}</p>
                    </div>

                    <div style={{ background:'rgba(139,92,246,0.08)', borderRadius:8, padding:12, textAlign:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginBottom:4 }}>
                        <Target style={{ width:16, height:16, color:'#a78bfa' }} />
                        <span style={{ fontSize:12, color:'#a78bfa', fontWeight:600 }}>Rate</span>
                      </div>
                      <p style={{ fontSize:24, fontWeight:900, color:'#a78bfa', margin:0, fontFamily:'Barlow Condensed, sans-serif' }}>{challenge.completionRate}%</p>
                    </div>
                  </div>

                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
                      <span style={{ color:'rgba(255,255,255,0.4)' }}>Progress</span>
                      <span style={{ fontWeight:600, color:'#fff' }}>{challenge.completionRate}%</span>
                    </div>
                    <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.08)' }}>
                      <div style={{ height:'100%', width:`${challenge.completionRate}%`, background:'#D4AF37', borderRadius:4 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Engagement Insights */}
      <div style={CARD}>
        <div style={{ padding:'16px 20px 12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:16, fontWeight:700, color:'#fff' }}>
            <Zap style={{ width:20, height:20 }} />
            Engagement Insights
          </div>
        </div>
        <div style={{ padding:'0 20px 20px', display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:12, background:'rgba(59,130,246,0.08)', borderRadius:8, border:'1px solid rgba(59,130,246,0.2)' }}>
            <TrendingUp style={{ width:20, height:20, color:'#60a5fa', marginTop:2 }} />
            <div>
              <p style={{ fontWeight:600, color:'#93c5fd', margin:'0 0 2px' }}>Most Popular Challenge</p>
              <p style={{ fontSize:13, color:'#60a5fa', margin:0 }}>
                {challengeStats[0]?.title || 'N/A'} with {challengeStats[0]?.participantCount || 0} participants
              </p>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:12, background:'rgba(34,197,94,0.08)', borderRadius:8, border:'1px solid rgba(34,197,94,0.2)' }}>
            <Award style={{ width:20, height:20, color:'#4ade80', marginTop:2 }} />
            <div>
              <p style={{ fontWeight:600, color:'#86efac', margin:'0 0 2px' }}>Best Completion Rate</p>
              <p style={{ fontSize:13, color:'#4ade80', margin:0 }}>
                {challengeStats.sort((a, b) => parseFloat(b.completionRate) - parseFloat(a.completionRate))[0]?.title || 'N/A'}
                {' '}at {challengeStats.sort((a, b) => parseFloat(b.completionRate) - parseFloat(a.completionRate))[0]?.completionRate || 0}%
              </p>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:12, background:'rgba(139,92,246,0.08)', borderRadius:8, border:'1px solid rgba(139,92,246,0.2)' }}>
            <Users style={{ width:20, height:20, color:'#a78bfa', marginTop:2 }} />
            <div>
              <p style={{ fontWeight:600, color:'#c4b5fd', margin:'0 0 2px' }}>Community Engagement</p>
              <p style={{ fontSize:13, color:'#a78bfa', margin:0 }}>
                {totalParticipations} total participations across {challenges.length} challenges
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
