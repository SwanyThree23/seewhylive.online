import type { Metadata } from 'next'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = { title: 'Videos' }
export const revalidate = 30

interface VideoPost {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  views: number
  isPaywalled: boolean
  paywallAmountCents: number | null
  createdAt: string
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

async function getVideos(): Promise<VideoPost[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/video-posts?limit=24`,
      { next: { revalidate: 30 } },
    )
    const data = await res.json()
    return data.success ? data.data.items : []
  } catch {
    return []
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default async function VideosPage() {
  const videos = await getVideos()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-bebas text-hero text-text">VIDEOS</h1>
        <p className="font-barlow text-body text-muted">Watch on-demand content from creators</p>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-bebas text-page text-muted">NO VIDEOS YET</p>
          <p className="mt-2 font-barlow text-body text-muted">Check back soon or go live to record your first video</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map(video => (
            <Link
              key={video.id}
              href={`/videos/${video.id}`}
              className="group flex flex-col overflow-hidden rounded border border-border bg-card transition-colors hover:border-border/70"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-surface">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="font-bebas text-section tracking-widest text-muted">VIDEO</span>
                  </div>
                )}
                {video.isPaywalled && (
                  <div className="absolute right-2 top-2">
                    <Badge variant="gold">PPV</Badge>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="line-clamp-2 font-bebas text-section leading-tight text-text group-hover:text-accent transition-colors">
                  {video.title}
                </p>
                <div className="mt-auto flex items-center gap-2">
                  <Avatar
                    src={video.creator.avatarUrl}
                    alt={video.creator.displayName ?? video.creator.username}
                    size={24}
                  />
                  <span className="min-w-0 flex-1 truncate font-barlow text-caption text-muted">
                    {video.creator.displayName ?? video.creator.username}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-barlow text-caption text-muted">
                    {video.views.toLocaleString()} views
                  </span>
                  <span className="font-barlow text-caption text-muted">
                    {formatDate(video.createdAt)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
