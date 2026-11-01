'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'

interface EarningsBreakdown { cents: number; count: number }

interface DashboardData {
  earnings: {
    totalCents: number
    transactionCount: number
    tips: EarningsBreakdown
    paywall: EarningsBreakdown
    subscriptions: EarningsBreakdown
  }
  streams: Array<{
    id: string; title: string; status: string
    viewerCount: number; startedAt: string | null; endedAt: string | null
  }>
  followerCount: number
  activeSubscribers: number
  periodDays: number
}

function formatDollars(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '—'
  const s = new Date(start)
  const e = end ? new Date(end) : new Date()
  const mins = Math.round((e.getTime() - s.getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    fetch(`/api/creator/dashboard?days=${days}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data) })
      .finally(() => setLoading(false))
  }, [status, days])

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-hero text-text">ANALYTICS</h1>
          <p className="font-barlow text-body text-muted">Your creator dashboard</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded border px-3 py-1.5 font-bebas text-label tracking-widest transition-colors
                ${days === d ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted hover:text-text'}`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={`Earnings (${days}d)`}
          value={data ? formatDollars(data.earnings.totalCents) : '—'}
          sub="your 90% share"
          accent="gold"
        />
        <StatCard
          label="Transactions"
          value={data?.earnings.transactionCount ?? '—'}
          sub={`last ${days} days`}
        />
        <StatCard
          label="Followers"
          value={data?.followerCount.toLocaleString() ?? '—'}
          accent="cyan"
        />
        <StatCard
          label="Subscribers"
          value={data?.activeSubscribers ?? '—'}
          sub="active"
          accent="green"
        />
      </div>

      {/* Recent streams */}
      <div>
        <h2 className="mb-4 font-bebas text-section tracking-widest text-muted">RECENT STREAMS</h2>
        {data?.streams.length === 0 ? (
          <p className="font-barlow text-body text-muted">No streams in this period.</p>
        ) : (
          <div className="overflow-hidden rounded border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  {['Title', 'Status', 'Duration', 'Peak Viewers'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-bebas text-label tracking-widest text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.streams.map(s => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-cardHi">
                    <td className="px-4 py-3">
                      <a href={`/live/${s.id}`} className="font-barlow text-body text-text hover:text-cyan transition-colors">
                        {s.title}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.status === 'LIVE' ? 'live' : 'muted'} dot={s.status === 'LIVE'}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-barlow text-body text-muted">
                      {formatDuration(s.startedAt, s.endedAt)}
                    </td>
                    <td className="px-4 py-3 font-bebas text-stat text-text">
                      {s.viewerCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Earnings breakdown */}
      {data && (data.earnings.tips.count > 0 || data.earnings.paywall.count > 0 || data.earnings.subscriptions.count > 0) && (
        <div className="mt-8">
          <h2 className="mb-4 font-bebas text-section tracking-widest text-muted">EARNINGS BREAKDOWN</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Tips', key: data.earnings.tips, color: 'text-gold' },
              { label: 'Paywall Unlocks', key: data.earnings.paywall, color: 'text-purple' },
              { label: 'Subscriptions', key: data.earnings.subscriptions, color: 'text-cyan' },
            ].map(({ label, key, color }) => (
              <div key={label} className="rounded border border-border bg-card p-4">
                <p className="font-bebas text-label tracking-widest text-muted">{label.toUpperCase()}</p>
                <p className={`mt-1 font-bebas text-stat ${color}`}>{formatDollars(key.cents)}</p>
                <p className="font-barlow text-caption text-muted">{key.count} transaction{key.count !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue split reminder */}
      <div className="mt-8 rounded border border-border bg-card p-4">
        <p className="font-bebas text-label tracking-widest text-muted">REVENUE MODEL</p>
        <p className="mt-1 font-barlow text-body text-muted">
          You keep <span className="text-green font-semibold">90%</span> of every tip, paywall, and subscription.
          SeeWhy earns 10% to keep the platform running.
        </p>
      </div>
    </div>
  )
}
