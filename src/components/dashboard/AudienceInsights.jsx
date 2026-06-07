import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Users, Crown, Star, Zap, Diamond } from 'lucide-react';

const G       = '#D4AF37';
const CRIMSON = '#800020';
const PANEL   = '#0F0B1A';
const BORDER  = 'rgba(212,175,55,0.18)';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };
const OCT     = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

const TIERS = [
  { id: 'diamond', label: 'Diamond', min: 15000, color: '#B9F2FF', icon: Diamond },
  { id: 'platinum', label: 'Platinum', min: 5000,  color: '#E5E4E2', icon: Crown },
  { id: 'gold',    label: 'Gold',     min: 1500,  color: G,         icon: Crown },
  { id: 'silver',  label: 'Silver',   min: 500,   color: '#C0C0C0', icon: Star },
  { id: 'bronze',  label: 'Bronze',   min: 0,     color: '#CD7F32', icon: Zap },
];

function tierFromPoints(pts) {
  for (const t of TIERS) if (pts >= t.min) return t;
  return TIERS[TIERS.length - 1];
}

function OctAvatar({ size = 40, initials, color = CRIMSON }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="absolute inset-0" style={{ clipPath: OCT, background: color }} />
      <div className="absolute flex items-center justify-center"
        style={{ inset: 2, clipPath: OCT, background: `linear-gradient(145deg, ${CRIMSON}cc, #0d0618)` }}>
        <span className="font-black text-white" style={{ fontSize: size * 0.32, ...T }}>{initials}</span>
      </div>
    </div>
  );
}

export default function AudienceInsights({ creatorId }) {
  const { data: tips = [] } = useQuery({
    queryKey: ['audienceTips', creatorId],
    queryFn: () => base44.entities.Tip.filter({ creator_id: creatorId }, '-created_date', 100),
    enabled: !!creatorId,
  });

  const { data: subs = [] } = useQuery({
    queryKey: ['audienceSubs', creatorId],
    queryFn: () => base44.entities.Subscription.filter({ creator_id: creatorId, status: 'active' }),
    enabled: !!creatorId,
  });

  const { data: loyalty = [] } = useQuery({
    queryKey: ['audienceLoyalty', creatorId],
    queryFn: () => base44.entities.LoyaltyMembership.filter({ creator_id: creatorId }),
    enabled: !!creatorId,
  });

  const topSupporters = useMemo(() => {
    const byUser = {};
    tips.forEach(t => {
      const uid = t.tipper_id || t.user_id || 'anon';
      if (!byUser[uid]) byUser[uid] = { uid, name: t.tipper_name || t.username || 'Fan', total: 0, count: 0 };
      byUser[uid].total += t.amount || 0;
      byUser[uid].count += 1;
    });
    return Object.values(byUser).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [tips]);

  const tierCounts = useMemo(() => {
    const counts = Object.fromEntries(TIERS.map(t => [t.id, 0]));
    loyalty.forEach(l => {
      const tier = tierFromPoints(l.loyalty_points || 0);
      counts[tier.id] = (counts[tier.id] || 0) + 1;
    });
    return counts;
  }, [loyalty]);

  const totalLoyalty = loyalty.length;

  const insights = {
    subscribers: subs.length,
    retention: subs.length && totalLoyalty ? Math.round((subs.length / Math.max(totalLoyalty, 1)) * 100) : 0,
    avgTip: tips.length ? (tips.reduce((s, t) => s + (t.amount || 0), 0) / tips.length).toFixed(2) : '0.00',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: PANEL, border: `1px solid ${BORDER}` }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Users className="w-4 h-4" style={{ color: G }} />
        <h3 className="font-black text-[13px] uppercase" style={{ color: G, ...T }}>Audience Insights</h3>
        <span className="ml-auto text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
          {subs.length} active subs
        </span>
      </div>

      <div className="p-4 space-y-5">

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Subs',    value: insights.subscribers, color: G },
            { label: 'Sub %',   value: insights.retention + '%', color: '#6DBF7E' },
            { label: 'Avg Tip', value: '$' + insights.avgTip, color: '#C9A84C' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-0.5 p-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-lg font-black" style={{ color: s.color, fontFamily: 'Orbitron, monospace', fontSize: 15 }}>{s.value}</span>
              <span className="text-[9px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Fan Tier Distribution */}
        {totalLoyalty > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Fan Tier Distribution</p>
            <div className="space-y-1.5">
              {TIERS.map((tier, i) => {
                const count = tierCounts[tier.id] || 0;
                const pct = totalLoyalty > 0 ? Math.round((count / totalLoyalty) * 100) : 0;
                if (count === 0 && i > 2) return null;
                return (
                  <div key={tier.id}>
                    <div className="flex items-center justify-between text-[10px] mb-0.5" style={T}>
                      <span className="font-black" style={{ color: tier.color }}>{tier.label}</span>
                      <span style={{ color: 'rgba(255,255,255,0.35)' }}>{count} · {pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{ background: tier.color + 'aa' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Supporters */}
        <div>
          <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Top Supporters</p>
          {topSupporters.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-1">
              <Crown className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No tips yet — share your stream!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topSupporters.map((sup, idx) => {
                const initials = (sup.name || '?').slice(0, 2).toUpperCase();
                const rankColors = [G, '#C0C0C0', '#CD7F32', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)'];
                return (
                  <motion.div key={sup.uid}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.07 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-[10px] font-black w-4 text-center" style={{ color: rankColors[idx], ...T }}>
                      #{idx + 1}
                    </span>
                    <OctAvatar size={36} initials={initials} color={rankColors[idx] || CRIMSON} />
                    <span className="flex-1 font-black text-[12px] text-white truncate" style={T}>{sup.name}</span>
                    <span className="font-black text-[12px]" style={{ color: G, ...T }}>${sup.total.toFixed(0)}</span>
                    <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{sup.count}x</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Growth note */}
        <div className="text-center pt-1">
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>
            📊 Grow your audience by going live consistently
          </p>
        </div>

      </div>
    </motion.div>
  );
}
