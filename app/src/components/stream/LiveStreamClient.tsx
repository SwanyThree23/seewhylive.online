'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/Badge'
import { Btn } from '@/components/ui/Btn'
import { TipModal } from '@/components/payment/TipModal'
import { PaywallModal } from '@/components/payment/PaywallModal'
import { CreatorControls } from '@/components/stream/CreatorControls'
import { connectSocket } from '@/lib/socket-client'
import type { Socket } from 'socket.io-client'

interface Props {
  streamId: string
  initialViewerCount: number
  isPaywalled: boolean
  paywallAmountCents: number | null
  creatorId: string
  creatorName: string
  hasStripe: boolean
  isLive: boolean
  auraEnabled: boolean
}

export function LiveStreamClient({
  streamId,
  initialViewerCount,
  isPaywalled,
  paywallAmountCents,
  creatorId,
  creatorName,
  hasStripe,
  isLive,
  auraEnabled,
}: Props) {
  const { data: session } = useSession()
  const [viewerCount, setViewerCount] = useState(initialViewerCount)
  const [tipOpen, setTipOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [hasAccess, setHasAccess] = useState(!isPaywalled)
  const [checkingAccess, setCheckingAccess] = useState(isPaywalled)

  // Check paywall access
  useEffect(() => {
    if (!isPaywalled) return
    if (!session) { setCheckingAccess(false); return }

    fetch(`/api/streams/${streamId}/join`, { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        setHasAccess(d.success && d.data?.joined)
      })
      .finally(() => setCheckingAccess(false))
  }, [streamId, isPaywalled, session])

  // Socket viewer count
  useEffect(() => {
    if (!isLive) return
    let socket: Socket | null = null

    const token = (session as { accessToken?: string } | null)?.accessToken

    const s = connectSocket(token)
    socket = s
    s.emit('join-stream', { streamId })
    s.on('viewer-count', (data: { streamId: string; count: number }) => {
      if (data.streamId === streamId) setViewerCount(data.count)
    })

    return () => {
      if (socket) {
        socket.emit('leave-stream', { streamId })
        socket.off('viewer-count')
      }
    }
  }, [streamId, isLive, session])

  if (checkingAccess) {
    return (
      <div className="flex h-12 items-center justify-center">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      {/* Viewer count + tip button bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-bg">
        {isLive && (
          <span className="font-bebas text-label text-muted tracking-widest">
            {viewerCount.toLocaleString()} WATCHING
          </span>
        )}
        <div className="flex-1" />

        {isPaywalled && !hasAccess && (
          <div className="flex items-center gap-2">
            <Badge variant="gold">PPV</Badge>
            <Btn
              size="sm"
              variant="gold"
              onClick={() => setPaywallOpen(true)}
            >
              UNLOCK — ${((paywallAmountCents ?? 0) / 100).toFixed(2)}
            </Btn>
          </div>
        )}

        {hasStripe && session && (
          <Btn
            size="sm"
            variant="gold"
            onClick={() => setTipOpen(true)}
          >
            💰 TIP
          </Btn>
        )}
      </div>

      {tipOpen && hasStripe && (
        <TipModal
          open={tipOpen}
          streamId={streamId}
          toUserId={creatorId}
          creatorName={creatorName}
          onClose={() => setTipOpen(false)}
        />
      )}

      {paywallOpen && paywallAmountCents && (
        <PaywallModal
          open={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          streamId={streamId}
          amountCents={paywallAmountCents}
          creatorName={creatorName}
          onUnlocked={() => setHasAccess(true)}
        />
      )}

      {isLive && session?.user?.id === creatorId && (
        <CreatorControls streamId={streamId} auraEnabled={auraEnabled} />
      )}
    </>
  )
}
