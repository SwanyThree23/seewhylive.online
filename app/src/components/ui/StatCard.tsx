import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  sub?: string
  accent?: 'gold' | 'cyan' | 'green' | 'accent'
}

const accentClasses = {
  gold:   'text-gold',
  cyan:   'text-cyan',
  green:  'text-green',
  accent: 'text-accent',
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="bcast-bracket rounded border border-border bg-card p-4">
      <p className="font-bebas text-label tracking-widest text-muted">{label}</p>
      <p className={`mt-1 font-bebas text-stat ${accent ? accentClasses[accent] : 'text-text'}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 font-barlow text-label text-muted">{sub}</p>}
    </div>
  )
}
