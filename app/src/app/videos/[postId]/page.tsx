import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { VideoPlayerClient } from './VideoPlayerClient'

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Video player */}
      <div className="mb-6 overflow-hidden rounded border border-border">
        <VideoPlayerClient
          postId={post.id ?? postId}
          videoUrl={post.videoUrl ?? null}
          thumbnailUrl={post.thumbnailUrl ?? null}
          title={post.title}
          isPaywalled={post.isPaywalled ?? false}
          paywallAmountCents={post.paywallAmountCents ?? null}
          creatorName={post.creator?.displayName ?? post.creator?.username ?? 'Creator'}
        />
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
