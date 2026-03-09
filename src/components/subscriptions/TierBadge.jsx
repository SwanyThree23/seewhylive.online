import React from 'react';
import { Flame, Star, Crown, Zap, Heart, Diamond } from 'lucide-react';

const ICON_MAP = {
  bronze: ({ className }) => <span className={className}>🥉</span>,
  silver: ({ className }) => <span className={className}>🥈</span>,
  gold: ({ className }) => <span className={className}>🥇</span>,
  diamond: ({ className }) => <span className={className}>💎</span>,
  star: Star,
  crown: Crown,
  flame: Flame,
  heart: Heart,
  zap: Zap,
};

const DEFAULT_COLORS = {
  bronze: '#cd7f32',
  silver: '#aaa9ad',
  gold: '#d4af37',
  diamond: '#b9f2ff',
};

export default function TierBadge({ tier, size = 'sm', showName = false }) {
  if (!tier) return null;
  const iconKey = tier.icon || 'star';
  const Icon = ICON_MAP[iconKey] || Star;
  const color = tier.color || DEFAULT_COLORS[tier.name?.toLowerCase()] || '#d4af37';

  const sizeClasses = {
    xs: 'w-4 h-4 text-xs',
    sm: 'w-5 h-5 text-xs',
    md: 'w-7 h-7 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`inline-flex items-center justify-center rounded-full ${sizeClasses[size]}`}
        style={{ background: color + '22', border: `1.5px solid ${color}` }}
      >
        <Icon className={`${size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}`} style={{ color }} />
      </span>
      {showName && (
        <span className="font-semibold text-xs" style={{ color }}>{tier.name}</span>
      )}
    </span>
  );
}