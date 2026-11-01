import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

interface Props { params: Promise<{ postId: string }> }

async function getPost(postId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/video-posts/${postId}`, {
      next: { revalidate: 0 },
    })
    const data = await res.json()
    return data.success ? data.data.post : null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params
  const post = await getPost(postId)
  if (!post) return { title: 'Video Not Found' }
  return {
    title: post.title,
    description: post.description ?? `Watch ${post.title} on SeeWhy LIVE`,
    openGraph: {
      title: post.title,
      images: post.thumbnailUrl ? [post.thumbnailUrl] : [],
    },
  }
}

export default async function VideoPostPage({ params }: Props) {
  const { postId } = await params
  const post = await getPost(postId)
  if (!post) notFound()

  const isPaywallBlocked = post.isPaywalled && !post.videoUrl

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Video player */}
      <div className="mb-6 overflow-hidden rounded border border-border">
        <div className="relative aspect-video bg-bg">
          {post.videoUrl ? (
            <video
              src={post.videoUrl}
              controls
              className="h-full w-full"
              poster={post.thumbnailUrl ?? undefined}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              {post.thumbnailUrl && (
                <img src={post.thumbnailUrl} alt={post.title} className="absolute inset-0 h-full w-full object-cover opacity-20" />
              )}
              <div className="relative z-10 text-center">
                {isPaywallBlocked ? (
                  <>
                    <Badge variant="gold" className="mb-3">PAY-PER-VIEW</Badge>
                    <p className="font-bebas text-page text-text">
                      ${((post.paywallAmountCents ?? 0) / 100).toFixed(2)} to unlock
                    </p>
                    <p className="mt-2 font-barlow text-body text-muted">Sign in to purchase</p>
                  </>
                ) : (
                  <p className="font-bebas text-page text-muted">VIDEO UNAVAILABLE</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post info */}
      <div className="mb-6">
        <div className="flex items-start gap-3">
          <Avatar
            src={post.creator?.avatarUrl}
            alt={post.creator?.displayName ?? post.creator?.username}
            size={48}
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-bebas text-page text-text leading-tight">{post.title}</h1>
            <a
              href={`/${post.creator?.username}`}
              className="font-barlow text-body text-muted hover:text-text transition-colors"
            >
              {post.creator?.displayName ?? post.creator?.username}
            </a>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Badge variant="muted">{post.views?.toLocaleString() ?? 0} views</Badge>
            {post.isPaywalled && <Badge variant="gold">PPV</Badge>}
          </div>
        </div>

        {post.description && (
          <p className="mt-4 font-barlow text-body text-muted/90 whitespace-pre-line">
            {post.description}
          </p>
        )}
      </div>
    </div>
  )
}
