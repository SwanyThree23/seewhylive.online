import type { ReactNode } from 'react'

type BadgeVariant = 'live' | 'gold' | 'cyan' | 'green' | 'purple' | 'muted' | 'warn'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  live:   'bg-accent/15 text-accent border-accent/30',
  gold:   'bg-gold/15 text-gold border-gold/30',
  cyan:   'bg-cyan/15 text-cyan border-cyan/30',
  green:  'bg-green/15 text-green border-green/30',
  purple: 'bg-purple/15 text-purple border-purple/30',
  muted:  'bg-surface text-muted border-border',
  warn:   'bg-warn/15 text-warn border-warn/30',
}

export function Badge({ variant = 'muted', children, className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-bebas text-label tracking-widest ${variantClasses[variant]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${variant === 'live' ? 'animate-pulse-live bg-accent' : 'bg-current'}`} />}
      {children}
    </span>
  )
}

export function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    FREE:      { label: 'FREE',      variant: 'muted'  },
    CREATOR:   { label: 'CREATOR',   variant: 'cyan'   },
    PRO:       { label: 'PRO',       variant: 'gold'   },
    STUDIO:    { label: 'STUDIO',    variant: 'purple' },
  }
  const { label, variant } = map[tier] ?? { label: tier, variant: 'muted' }
  return <Badge variant={variant}>{label}</Badge>
}
