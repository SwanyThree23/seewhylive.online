import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Zap } from 'lucide-react';

const TIER_CONFIG = {
  bronze:   { color: '#CD7F32', glow: 'rgba(205,127,50,0.3)',   bg: 'rgba(205,127,50,0.08)',  label: 'Bronze',    next: 500 },
  silver:   { color: '#C0C0C0', glow: 'rgba(192,192,192,0.3)', bg: 'rgba(192,192,192,0.08)', label: 'Silver',    next: 2000 },
  gold:     { color: '#d4af37', glow: 'rgba(212,175,55,0.4)',  bg: 'rgba(212,175,55,0.1)',   label: 'Gold',      next: 7500 },
  platinum: { color: '#00F5FF', glow: 'rgba(0,245,255,0.3)',   bg: 'rgba(0,245,255,0.08)',   label: 'Platinum',  next: 20000 },
  diamond:  { color: '#8B5CF6', glow: 'rgba(139,92,246,0.4)', bg: 'rgba(139,92,246,0.1)',   label: 'Diamond ♦', next: null },
};

const TIER_THRESHOLDS = { bronze: 0, silver: 500, gold: 2000, platinum: 7500, diamond: 20000 };

export default function ViewerLoyaltyCard({ userId, creatorId, compact = false }) {
  const { data: loyalty } = useQuery({
    queryKey: ['viewer-loyalty', userId, creatorId],
    queryFn: () => base44.entities.ViewerLoyalty.filter({ user_id: userId, creator_id: creatorId }).then(r => r[0]),
    enabled: !!userId && !!creatorId,
    refetchInterval: 15000,
  });

  if (!loyalty) return (
    <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <Zap className="w-6 h-6 mx-auto mb-1 text-white/20" />
      <p className="text-[11px] text-white/30">Start chatting to earn points!</p>
    </div>
  );

  const tier = loyalty.loyalty_tier || 'bronze';
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  const pts = loyalty.loyalty_points || 0;
  const nextThreshold = cfg.next;
  const currentThreshold = TIER_THRESHOLDS[tier] || 0;
  const progress = nextThreshold
    ? Math.min(100, ((pts - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
        style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
        <Zap className="w-3 h-3" style={{ color: cfg.color }} />
        <span className="text-[10px] font-bold font-mono" style={{ color: cfg.color }}>{pts.toLocaleString()}</span>
        <span className="text-[11px]" style={{ color: `${cfg.color}80` }}>{cfg.label}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: cfg.bg, border: `1px solid ${cfg.color}25`, boxShadow: `0 0 20px ${cfg.glow}` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" style={{ color: cfg.color }} />
          <span className="text-xs font-black uppercase" style={{ color: cfg.color, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {cfg.label} Member
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" style={{ color: cfg.color }} />
          <span className="text-sm font-black font-mono" style={{ color: cfg.color }}>{pts.toLocaleString()}</span>
          <span className="text-[10px] text-white/40">pts</span>
        </div>
      </div>

      {nextThreshold && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span>Progress to next tier</span>
            <span>{pts.toLocaleString()} / {nextThreshold.toLocaleString()}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Messages', value: loyalty.messages_sent || 0 },
          { label: 'Tips Sent', value: `$${(loyalty.total_tips_sent || 0).toFixed(0)}` },
          { label: 'Day Streak', value: loyalty.streak_days || 0 },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <p className="text-[11px] font-bold text-white/80">{s.value}</p>
            <p className="text-[11px] text-white/30 uppercase">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}