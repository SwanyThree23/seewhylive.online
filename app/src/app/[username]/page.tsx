import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, TierBadge } from '@/components/ui/Badge'
import { StreamCard } from '@/components/stream/StreamCard'

interface Props { params: { username: string } }

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getProfile(params.username)
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
  const user = await getProfile(params.username)
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
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/users/${user.username}/follow`}
            className="rounded border border-accent bg-accent/15 px-4 py-2 font-bebas text-section tracking-widest text-accent transition-colors hover:bg-accent/25"
          >
            FOLLOW
          </a>
        </div>
      </div>

      {/* Live now */}
      {user.streams.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="live-dot" />
            <p className="font-bebas text-section tracking-widest text-accent">LIVE NOW</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user.streams.map((stream: Parameters<typeof StreamCard>[0]['stream']) => (
              <StreamCard
                key={stream.id}
                stream={{ ...stream, isPaywalled: false, creator: user }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      {(user.twitterHandle || user.instagramHandle || user.websiteUrl) && (
        <div className="flex gap-3">
          {user.twitterHandle && (
            <a
              href={`https://twitter.com/${user.twitterHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bebas text-label tracking-widest text-cyan transition-colors hover:text-cyan/80"
            >
              TWITTER
            </a>
          )}
          {user.instagramHandle && (
            <a
              href={`https://instagram.com/${user.instagramHandle}`}
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
    </div>
  )
}
