import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Gift, Users, TrendingUp, Award, DollarSign } from 'lucide-react';

const CARD = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden' };
const CARD_HEADER = { padding:'16px 20px 12px' };
const CARD_CONTENT = { padding:'0 20px 20px' };
const INPUT_STYLE = { width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' };
const SELECT_STYLE = { ...INPUT_STYLE };
const LABEL_STYLE = { fontSize:13, fontWeight:600, display:'block', marginBottom:6, color:'rgba(255,255,255,0.8)' };

function StatCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div style={CARD}>
      <div style={CARD_HEADER}>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:4 }}>{label}</p>
        <p style={{ fontSize:30, fontWeight:900, color: color || '#fff', margin:0, fontFamily:'Barlow Condensed, sans-serif' }}>{value}</p>
      </div>
      <div style={CARD_CONTENT}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(255,255,255,0.4)' }}>
          {Icon && <Icon style={{ width:16, height:16 }} />}
          <span>{sub}</span>
        </div>
      </div>
    </div>
  );
}

export default function ReferralConfig({ communityId }) {
  const [rewardType, setRewardType] = useState('points');
  const [rewardValue, setRewardValue] = useState('100');

  const { data: referrals = [] } = useQuery({
    queryKey: ['communityReferrals', communityId],
    queryFn: () => base44.entities.Referral.filter({ community_id: communityId }),
  });

  const totalReferrals = referrals.length;
  const completedReferrals = referrals.filter(r => r.status === 'completed').length;
  const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
  const conversionRate = totalReferrals > 0 ? ((completedReferrals / totalReferrals) * 100).toFixed(1) : 0;

  const topReferrers = referrals.reduce((acc, ref) => {
    const userId = ref.referrer_id;
    if (!acc[userId]) acc[userId] = { count: 0, completed: 0 };
    acc[userId].count++;
    if (ref.status === 'completed') acc[userId].completed++;
    return acc;
  }, {});

  const sortedReferrers = Object.entries(topReferrers)
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 10);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Stats Overview */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
        <StatCard label="Total Referrals" value={totalReferrals} icon={Users} sub="All time" />
        <StatCard label="Completed" value={completedReferrals} color="#4ade80" icon={Award} sub="Successful" />
        <StatCard label="Pending" value={pendingReferrals} color="#fb923c" icon={TrendingUp} sub="In progress" />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} icon={DollarSign} sub="Success rate" />
      </div>

      {/* Reward Configuration */}
      <div style={CARD}>
        <div style={CARD_HEADER}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:16, fontWeight:700, color:'#fff', marginBottom:4 }}>
            <Gift style={{ width:20, height:20 }} />
            Referral Reward Configuration
          </div>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>Set rewards for successful referrals</p>
        </div>
        <div style={CARD_CONTENT}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <label style={LABEL_STYLE}>Reward Type</label>
                <select style={SELECT_STYLE} value={rewardType} onChange={e => setRewardType(e.target.value)}>
                  <option value="points">Points</option>
                  <option value="badge">Badge</option>
                  <option value="subscription">Subscription</option>
                  <option value="virtual_good">Virtual Good</option>
                </select>
              </div>

              <div>
                <label style={LABEL_STYLE}>Reward Value</label>
                <input
                  type="number"
                  style={INPUT_STYLE}
                  value={rewardValue}
                  onChange={(e) => setRewardValue(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>

            <div style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:8, padding:16 }}>
              <p style={{ fontSize:13, color:'#93c5fd', margin:0 }}>
                <strong>Current Settings:</strong> Users will receive <strong>{rewardValue} {rewardType}</strong> for each successful referral.
              </p>
            </div>

            <button
              style={{ width:'100%', padding:'10px', background:'#D4AF37', color:'#000', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'Barlow Condensed, sans-serif' }}
            >
              Update Reward Settings
            </button>
          </div>
        </div>
      </div>

      {/* Top Referrers */}
      <div style={CARD}>
        <div style={CARD_HEADER}>
          <p style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:4 }}>Top Referrers</p>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>Members driving the most growth</p>
        </div>
        <div style={CARD_CONTENT}>
          {sortedReferrers.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'rgba(255,255,255,0.4)' }}>
              No referral data yet
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {sortedReferrers.map((referrer, idx) => (
                <div key={referrer.userId} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#db2777)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12 }}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p style={{ fontWeight:600, color:'#fff', margin:0 }}>User {referrer.userId.slice(0, 8)}</p>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', margin:'2px 0 0' }}>
                        {referrer.count} total • {referrer.completed} completed
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(34,197,94,0.15)', color:'#4ade80' }}>
                    {referrer.completed} successful
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
