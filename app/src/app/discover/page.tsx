import type { Metadata } from 'next'
import { StreamCard } from '@/components/stream/StreamCard'

export const metadata: Metadata = { title: 'Discover' }
export const revalidate = 30

const GENRES = ['ALL', 'TALK_SHOW', 'MUSIC', 'LIFESTYLE', 'COMMUNITY', 'PANEL', 'COMEDY', 'SPORTS', 'GAMING', 'EDUCATION']

async function getLiveStreams(genre?: string) {
  const url = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/streams`)
  if (genre && genre !== 'ALL') url.searchParams.set('genre', genre)
  url.searchParams.set('limit', '24')

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 30 } })
    const data = await res.json()
    return data.success ? data.data.items : []
  } catch {
    return []
  }
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { genre?: string }
}) {
  const genre = searchParams.genre ?? 'ALL'
  const streams = await getLiveStreams(genre)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-bebas text-hero text-text">DISCOVER</h1>
        <p className="font-barlow text-body text-muted">Live now — creators streaming for you</p>
      </div>

      {/* Genre filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {GENRES.map(g => (
          <a
            key={g}
            href={g === 'ALL' ? '/discover' : `/discover?genre=${g}`}
            className={`shrink-0 rounded border px-3 py-1.5 font-bebas text-section tracking-widest transition-colors
              ${genre === g || (g === 'ALL' && genre === 'ALL')
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-border bg-surface text-muted hover:border-border/70 hover:text-text'
              }`}
          >
            {g.replace('_', ' ')}
          </a>
        ))}
      </div>

      {/* Stream grid */}
      {streams.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {streams.map((stream: Parameters<typeof StreamCard>[0]['stream']) => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-bebas text-page text-muted">NO LIVE STREAMS RIGHT NOW</p>
          <p className="mt-2 font-barlow text-body text-muted">Check back soon or start your own broadcast</p>
          <a
            href="/studio"
            className="mt-6 inline-flex items-center gap-2 rounded border border-accent bg-accent/15 px-5 py-2.5 font-bebas text-section tracking-widest text-accent transition-colors hover:bg-accent/25"
          >
            GO LIVE NOW
          </a>
        </div>
      )}
    </div>
  )
}
