'use client'

import { useState } from 'react'
import { VideoPaywallClient } from './VideoPaywallClient'

interface Props {
  postId: string
  videoUrl: string | null
  thumbnailUrl: string | null
  title: string
  isPaywalled: boolean
  paywallAmountCents: number | null
  creatorName: string
}

export function VideoPlayerClient({ postId, videoUrl: initialVideoUrl, thumbnailUrl, title, isPaywalled, paywallAmountCents, creatorName }: Props) {
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl)

  async function onUnlocked() {
    const res = await fetch(`/api/video-posts/${postId}`)
    const d = await res.json()
    if (d.success && d.data.post?.videoUrl) {
      setVideoUrl(d.data.post.videoUrl)
    }
  }

  return (
    <div className="relative aspect-video bg-bg">
      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          className="h-full w-full"
          poster={thumbnailUrl ?? undefined}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          {thumbnailUrl && (
            <img src={thumbnailUrl} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-20" />
          )}
          {isPaywalled && paywallAmountCents ? (
            <VideoPaywallClient
              postId={postId}
              amountCents={paywallAmountCents}
              creatorName={creatorName}
              onUnlocked={onUnlocked}
            />
          ) : (
            <p className="relative z-10 font-bebas text-page text-muted">VIDEO UNAVAILABLE</p>
          )}
        </div>
      )}
    </div>
  )
}
