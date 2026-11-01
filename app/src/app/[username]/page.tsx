import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { TierBadge } from '@/components/ui/Badge'
import { StreamCard } from '@/components/stream/StreamCard'
import { ProfileActions } from './ProfileActions'

interface Props { params: Promise<{ username: string }> }

async function getProfile(username: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users/${username}`, {
      next: { revalidate: 60 },
    })
    const data = await res.json()
    return data.success ? data.data : null
  } catch {
    return null
  }
}

async function getVideoPosts(creatorId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/video-posts?creatorId=${creatorId}&limit=6`, {
      next: { revalidate: 60 },
    })
    const data = await res.json()
    return data.success ? data.data.items : []
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const user = await getProfile(username)
  if (!user) return { title: 'Profile Not Found' }
  return {
    title: user.displayName,
    description: user.bio ?? `${user.displayName} on SeeWhy LIVE`,
    openGraph: {
      title: `${user.displayName} (@${user.username})`,
      images: user.avatarUrl ? [user.avatarUrl] : [],
    },
  }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const [user, videos] = await Promise.all([
    getProfile(username),
    getProfile(username).then(u => u ? getVideoPosts(u.id) : []),
  ])
  if (!user) notFound()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        <Avatar src={user.avatarUrl} alt={user.displayName} size={96} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-bebas text-hero text-text leading-none">{user.displayName}</h1>
            <TierBadge tier={user.tier} />
          </div>
          <p className="mt-0.5 font-barlow text-body text-muted">@{user.username}</p>
          {user.bio && <p className="mt-2 font-barlow text-body text-text/80 max-w-lg">{user.bio}</p>}
          <div className="mt-3 flex gap-4">
            <span className="font-barlow text-body">
              <span className="font-semibold text-text">{user._count.followers.toLocaleString()}</span>
              <span className="ml-1 text-muted">followers</span>
            </span>
            {videos.length > 0 && (
              <span className="font-barlow text-body">
                <span className="font-semibold text-text">{videos.length}</span>
                <span className="ml-1 text-muted">videos</span>
              </span>
            )}
          </div>
        </div>

        {/* Client-side follow button */}
        <ProfileActions userId={user.id} username={user.username} />
      </div>

      {/* Social links */}
      {(user.twitterHandle || user.instagramHandle || user.websiteUrl) && (
        <div className="mb-8 flex gap-3">
          {user.twitterHandle && (
            <a
              href={`https://twitter.com/${user.twitterHandle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bebas text-label tracking-widest text-cyan transition-colors hover:text-cyan/80"
            >
              TWITTER
            </a>
          )}
          {user.instagramHandle && (
            <a
              href={`https://instagram.com/${user.instagramHandle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bebas text-label tracking-widest text-cyan transition-colors hover:text-cyan/80"
            >
              INSTAGRAM
            </a>
          )}
          {user.websiteUrl && (
            <a
              href={user.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bebas text-label tracking-widest text-cyan transition-colors hover:text-cyan/80"
            >
              WEBSITE
            </a>
          )}
        </div>
      )}

      {/* Live now */}
      {user.streams?.length > 0 && (
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="live-dot" />
            <p className="font-bebas text-section tracking-widest text-accent">LIVE NOW</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user.streams.map((stream: Parameters<typeof StreamCard>[0]['stream']) => (
              <StreamCard
                key={stream.id}
                stream={{ ...stream, isPaywalled: stream.isPaywalled ?? false, creator: user }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Video posts */}
      {videos.length > 0 && (
        <div>
          <p className="mb-4 font-bebas text-section tracking-widest text-muted">VIDEOS</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v: {
              id: string; title: string; thumbnailUrl: string | null;
              durationSeconds: number | null; views: number; isPaywalled: boolean; paywallAmountCents: number | null
            }) => (
              <a key={v.id} href={`/videos/${v.id}`} className="group">
                <div className="rounded border border-border bg-card overflow-hidden hover:border-accent/40 transition-colors">
                  <div className="relative aspect-video bg-surface">
                    {v.thumbnailUrl
                      ? <img src={v.thumbnailUrl} alt={v.title} className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center">
                          <span className="font-bebas text-muted text-sm">VIDEO</span>
                        </div>
                    }
                    {v.durationSeconds && (
                      <span className="absolute bottom-1.5 right-1.5 rounded bg-bg/80 px-1.5 py-0.5 font-bebas text-caption text-text">
                        {Math.floor(v.durationSeconds / 60)}:{String(v.durationSeconds % 60).padStart(2, '0')}
                      </span>
                    )}
                    {v.isPaywalled && (
                      <span className="absolute top-1.5 right-1.5 rounded bg-gold/90 px-1.5 py-0.5 font-bebas text-caption text-bg">
                        PPV
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-barlow text-body text-text truncate group-hover:text-accent transition-colors">
                      {v.title}
                    </p>
                    <p className="font-barlow text-caption text-muted">{v.views.toLocaleString()} views</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
