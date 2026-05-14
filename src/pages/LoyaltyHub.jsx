import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Flame, Clock, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const B = '#800020';
const OB = '#0D0D0D';
const OB2 = '#1A1A1A';
const CREAM = '#F5E6D3';

const TIER_META = {
  bronze:   { color: '#cd7f32', label: 'Bronze',   next: 'silver',   threshold: 500 },
  silver:   { color: '#C0C0C0', label: 'Silver',   next: 'gold',     threshold: 2000 },
  gold:     { color: G,         label: 'Gold',     next: 'platinum', threshold: 5000 },
  platinum: { color: '#E5E4E2', label: 'Platinum', next: 'diamond',  threshold: 15000 },
  diamond:  { color: '#b9f2ff', label: 'Diamond',  next: null,       threshold: null },
};

function TierBadge({ tier }) {
  const meta = TIER_META[tier] || TIER_META.bronze;
  return (
    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase"
      style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}40`, fontFamily: 'Barlow Condensed, sans-serif' }}>
      {meta.label}
    </span>
  );
}

function LoyaltyCard({ loyalty }) {
  const tier = loyalty?.loyalty_tier || 'bronze';
  const meta = TIER_META[tier];
  const pts = loyalty?.loyalty_points || 0;
  const nextPts = meta.threshold || pts;
  const pct = meta.threshold ? Math.min(100, Math.round((pts / meta.threshold) * 100)) : 100;

  return (
    <div className="rounded-2xl p-5 space-y-4"
      style={{ background: `linear-gradient(135deg, ${OB2}, ${B}22)`, border: `2px solid ${meta.color}40`, boxShadow: `0 0 30px ${meta.color}15` }}>
      <div className="flex items-start justify-between">
        <div>
          <TierBadge tier={tier} />
          <div className="mt-2 text-4xl font-black" style={{ color: meta.color, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {pts.toLocaleString()}
          </div>
          <div className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>
            Loyalty Points
          </div>
        </div>
        <div className="text-5xl">
          {tier === 'diamond' ? '💎' : tier === 'platinum' ? '🏅' : tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : '🥉'}
        </div>
      </div>

      {meta.threshold && (
        <div>
          <div className="flex justify-between text-[8px] mb-1" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>
            <span>Progress to {TIER_META[meta.next]?.label}</span>
            <span>{pts} / {meta.threshold}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${B}, ${meta.color})` }} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4" style={{ color: '#FF6B35' }} />
          <span className="text-[11px] font-bold" style={{ color: CREAM }}>{loyalty?.streak_days || 0}d streak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(245,230,211,0.3)' }} />
          <span className="text-[9px]" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>
            {loyalty?.last_active ? new Date(loyalty.last_active).toLocaleDateString() : 'Never'}
          </span>
        </div>
      </div>
    </div>
  );
}

function RewardCard({ reward, userPoints, onRedeem }) {
  const canRedeem = userPoints >= (reward.points_required || 0);
  const rewardColors = { badge: G, discount_code: '#00FF88', exclusive_content: '#8B5CF6', shoutout: '#FF6B35', custom_emote: '#00F5FF' };
  const c = rewardColors[reward.reward_type] || G;

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: OB2, border: `1px solid ${canRedeem ? c : 'rgba(255,255,255,0.07)'}30` }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-bold" style={{ color: CREAM }}>{reward.name}</p>
          {reward.description && <p className="text-[8px] mt-0.5" style={{ color: 'rgba(245,230,211,0.3)' }}>{reward.description}</p>}
        </div>
        <span className="text-[7px] px-1.5 py-0.5 rounded font-black uppercase shrink-0 ml-2"
          style={{ background: `${c}15`, color: c, border: `1px solid ${c}25`, fontFamily: 'Barlow Condensed, sans-serif' }}>
          {reward.reward_type?.replace('_', ' ')}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          {(reward.points_required || 0).toLocaleString()} pts
        </span>
        <button onClick={() => canRedeem && onRedeem(reward)}
          className="px-3 h-7 rounded-lg font-black uppercase text-[8px]"
          style={{
            background: canRedeem ? B : 'rgba(255,255,255,0.04)',
            color: canRedeem ? G : 'rgba(255,255,255,0.2)',
            border: canRedeem ? `1px solid ${G}40` : '1px solid rgba(255,255,255,0.08)',
            cursor: canRedeem ? 'pointer' : 'not-allowed',
            fontFamily: 'Barlow Condensed, sans-serif',
          }}>
          {canRedeem ? 'Redeem' : 'Need more pts'}
        </button>
      </div>
      {reward.claimed_count > 0 && (
        <p className="text-[7px]" style={{ color: 'rgba(245,230,211,0.2)', fontFamily: 'IBM Plex Mono, monospace' }}>
          {reward.claimed_count} claimed
        </p>
      )}
    </div>
  );
}

function HowToEarn() {
  const [open, setOpen] = useState(false);
  const rates = [
    { action: 'Watch 1 minute', pts: 1 },
    { action: 'Send a message', pts: 5 },
    { action: 'Send a tip', pts: 10 },
    { action: 'Send a reaction', pts: 2 },
    { action: 'Join a room', pts: 5 },
  ];
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: OB2, border: '1px solid rgba(255,255,255,0.07)' }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3">
        <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: G, fontFamily: 'IBM Plex Mono, monospace' }}>How to Earn Points</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {rates.map(r => (
            <div key={r.action} className="flex items-center justify-between py-1">
              <span className="text-[10px]" style={{ color: 'rgba(245,230,211,0.6)' }}>{r.action}</span>
              <span className="text-[10px] font-black" style={{ color: G, fontFamily: 'IBM Plex Mono, monospace' }}>+{r.pts} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TABS = ['My Card', 'Rewards', 'Points', 'Leaderboard'];

export default function LoyaltyHubPage() {
  const [activeTab, setActiveTab] = useState('My Card');
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: loyalties = [] } = useQuery({
    queryKey: ['loyalty-me', user?.id],
    queryFn: () => base44.entities.ViewerLoyalty.filter({ user_id: user.id }, '-loyalty_points', 20),
    enabled: !!user?.id,
  });
  const { data: viewerPoints = [] } = useQuery({
    queryKey: ['viewer-pts', user?.id],
    queryFn: () => base44.entities.ViewerPoints.filter({ user_id: user.id }, '-points', 20),
    enabled: !!user?.id,
  });
  const { data: rewards = [] } = useQuery({
    queryKey: ['loyalty-rewards'],
    queryFn: () => base44.entities.LoyaltyReward.filter({ is_active: true }, '-points_required', 50),
  });
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['loyalty-leaderboard'],
    queryFn: () => base44.entities.ViewerLoyalty.list('-loyalty_points', 10),
  });

  const myLoyalty = loyalties[0];
  const totalPts = loyalties.reduce((s, l) => s + (l.loyalty_points || 0), 0);

  return (
    <div className="min-h-screen" style={{ background: OB }}>
      {/* Header */}
      <div className="px-4 md:px-8 py-4" style={{ background: OB2, borderBottom: `1px solid ${G}18` }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5" style={{ color: G }} />
            <h1 className="text-xl font-black uppercase" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>Loyalty Hub</h1>
          </div>
          <div className="flex gap-0.5">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 text-[9px] font-black uppercase border-b-2 transition-all"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', color: activeTab === tab ? G : 'rgba(245,230,211,0.3)', borderBottomColor: activeTab === tab ? G : 'transparent', background: activeTab === tab ? `${G}08` : 'transparent' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-5 space-y-4">
        {activeTab === 'My Card' && (
          <>
            <LoyaltyCard loyalty={myLoyalty} />
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Points', value: totalPts.toLocaleString(), icon: Star },
                { label: 'Streak', value: `${myLoyalty?.streak_days || 0}d`, icon: Flame },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 flex items-center gap-2" style={{ background: OB2, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <s.icon className="w-4 h-4" style={{ color: G }} />
                  <div>
                    <div className="font-black text-lg" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>{s.value}</div>
                    <div className="text-[8px] uppercase" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <HowToEarn />
          </>
        )}

        {activeTab === 'Rewards' && (
          <div className="space-y-2">
            {rewards.length === 0 && <p className="text-center py-10 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No rewards available</p>}
            {rewards.map(r => (
              <RewardCard key={r.id} reward={r} userPoints={totalPts}
                onRedeem={(rw) => toast?.success(`Redeemed: ${rw.name}`)} />
            ))}
          </div>
        )}

        {activeTab === 'Points' && (
          <div className="space-y-3">
            <HowToEarn />
            <div className="rounded-xl overflow-hidden" style={{ background: OB2, border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[8px] uppercase tracking-widest font-bold" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>Points by Creator</span>
              </div>
              {viewerPoints.length === 0
                ? <p className="text-center py-6 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No points yet</p>
                : viewerPoints.map(vp => (
                  <div key={vp.id} className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-[10px]" style={{ color: CREAM }}>{vp.creator_id}</span>
                    <span className="font-black text-[11px]" style={{ color: G, fontFamily: 'IBM Plex Mono, monospace' }}>{(vp.points || 0).toLocaleString()} pts</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {activeTab === 'Leaderboard' && (
          <div className="space-y-2">
            {leaderboard.map((l, i) => (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: i < 3 ? `${[G, '#C0C0C0', '#cd7f32'][i]}10` : OB2, border: `1px solid ${i < 3 ? [G, '#C0C0C0', '#cd7f32'][i] : 'rgba(255,255,255,0.07)'}25` }}>
                <span className="text-lg shrink-0">{['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
                <div className="flex-1">
                  <p className="text-[11px] font-bold" style={{ color: CREAM }}>{l.user_name || l.user_id}</p>
                  <TierBadge tier={l.loyalty_tier || 'bronze'} />
                </div>
                <div className="text-right">
                  <p className="font-black text-[13px]" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>{(l.loyalty_points || 0).toLocaleString()}</p>
                  <p className="text-[8px]" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>{l.streak_days || 0}d 🔥</p>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && <p className="text-center py-10 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No leaderboard data yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}